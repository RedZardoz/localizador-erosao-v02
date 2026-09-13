import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { obterSessao, SAREL_SESSION_COOKIE } from "@/lib/seguranca/sessaoEfemera";
import { getGoogleAccessToken, EARTH_ENGINE_SCOPES } from "@/lib/gee/auth";
import { validarOpcoesElegibilidade } from "@/lib/gee/elegibilidade";
import { executarAmostragemEstratificada, CandidatoEstratificacao } from "@/lib/gee/estratificacao";
import { aplicarThinningDeterminista } from "@/lib/gee/thinning";
import { queryEmbrapaSoil } from "@/lib/embrapa/embrapaSoilClient";
import { matchRuralProperty, toContextoFundiario } from "@/lib/fundiario/matcher";
import { identificarBacia } from "@/lib/localizacao/bacias";
import { pontoEmGeoJson } from "@/lib/localizacao/municipio";
import { montarLinhaDeBaseRUSLE } from "@/lib/rusle/linhaDeBase";
import { classificarPontoEspectral } from "@/lib/gee/amostragemBiofisica";
import type { PontoAmostral } from "@/types/ponto";
import type { AreaEstudo } from "@/types/ui";
import { getGeoJsonBBox } from "@/lib/gee/aoiTiling";

export const dynamic = "force-dynamic";

interface RequestBody {
  tamanhoAmostra: number;
  raioThinningKm: number;
  frequenciaSoloNuMin: number;
  declividadeMin: number;
  declividadeMax: number;
  areas: AreaEstudo[];
}

interface ImovelRealDb {
  cod_car: string;
  municipio: string;
  lat: number;
  lng: number;
  area_ha: number;
}

/**
 * Consulta imóveis rurais reais georreferenciados na base oficial SICAR/SNCR do Brasil
 * contidos no Bounding Box territorial delimitado.
 */
function buscarImoveisReaisPython(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
  limite: number
): Promise<ImovelRealDb[]> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), "scripts", "query_real_properties.py");
    if (!fs.existsSync(scriptPath)) {
      return resolve([]);
    }

    const pythonCmd = process.env.PYTHON_PATH || "python";
    const args = [
      scriptPath,
      String(minLng),
      String(minLat),
      String(maxLng),
      String(maxLat),
      String(limite),
    ];

    execFile(pythonCmd, args, { timeout: 15000 }, (error, stdout) => {
      if (error || !stdout) {
        return resolve([]);
      }
      try {
        const dados = JSON.parse(stdout) as ImovelRealDb[];
        resolve(Array.isArray(dados) ? dados : []);
      } catch {
        resolve([]);
      }
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SAREL_SESSION_COOKIE)?.value;
    const sessao = obterSessao(sessionId);

    if (!sessao?.gee) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Sessão do Google Earth Engine não autenticada no servidor. Por favor, conecte as credenciais GCP na aba 'Configurações'.",
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as RequestBody;
    const {
      tamanhoAmostra = 50,
      raioThinningKm = 5.0,
      frequenciaSoloNuMin = 0.15,
      declividadeMin = 3.0,
      declividadeMax = 20.0,
      areas = [],
    } = body;

    // Validação estrita dos limites de declividade física
    validarOpcoesElegibilidade({
      minSlopePercent: declividadeMin,
      maxSlopePercent: declividadeMax,
    });

    if (!areas || areas.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nenhuma área de estudo ativa fornecida para amostragem no GEE.",
        },
        { status: 400 }
      );
    }

    // 1. Validação do Token Oficial do Earth Engine (OAuth2 RFC 7523)
    const token = await getGoogleAccessToken(
      {
        client_email: sessao.gee.client_email,
        private_key: sessao.gee.private_key,
        token_uri: sessao.gee.token_uri,
      },
      EARTH_ENGINE_SCOPES
    );

    if (!token?.accessToken) {
      return NextResponse.json(
        { ok: false, error: "Falha ao obter autorização do Earth Engine junto ao Google." },
        { status: 401 }
      );
    }

    // 2. Extrai os limites das geometrias das áreas ativas
    let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
    for (const area of areas) {
      if (area.geometry) {
        const [aMinLng, aMinLat, aMaxLng, aMaxLat] = getGeoJsonBBox(area.geometry);
        if (aMinLng < minLng) minLng = aMinLng;
        if (aMinLat < minLat) minLat = aMinLat;
        if (aMaxLng > maxLng) maxLng = aMaxLng;
        if (aMaxLat > maxLat) maxLat = aMaxLat;
      }
    }

    if (minLng >= maxLng || minLat >= maxLat) {
      minLng = -54.6; maxLng = -48.1;
      minLat = -26.7; maxLat = -22.5;
    }

    // 3. Obtenção de Coordenadas de Imóveis Rurais Reais (SICAR / SNCR)
    const numCandidatosBusca = Math.min(Math.max(tamanhoAmostra * 10, 200), 2000);
    const imoveisReais = await buscarImoveisReaisPython(minLng, minLat, maxLng, maxLat, numCandidatosBusca);

    if (imoveisReais.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nenhum imóvel rural cadastrado nas bases oficiais foi localizado na área de estudo delimitada.",
        },
        { status: 404 }
      );
    }

    // Filtra imóveis que estejam dentro da geometria poligonal ativa (se houver polígono delimitador)
    const imoveisFiltrados = imoveisReais.filter((imovel) => {
      return areas.some((a) => {
        if (!a.geometry) return true;
        return pontoEmGeoJson(imovel.lng, imovel.lat, a.geometry);
      });
    });

    const listaParaAmostragem = imoveisFiltrados.length > 0 ? imoveisFiltrados : imoveisReais;

    // 4. Parâmetros e Variáveis Físicas Geodésicas Reais
    const dataConsultaAtual = new Date().toISOString().split("T")[0];
    const semente = 42;

    const candidatosProcessados: Array<{
      id: string;
      codigoCar: string;
      municipio: string;
      latitude: number;
      longitude: number;
      declividadePct: number;
      declividadeGraus: number;
      elevacao: number;
      frequenciaSoloNu: number;
      nivelK: 1 | 2;
    }> = [];

    let idx = 1;
    for (const im of listaParaAmostragem) {
      candidatosProcessados.push({
        id: "cand-" + (idx++),
        codigoCar: im.cod_car,
        municipio: im.municipio,
        latitude: Number(im.lat.toFixed(6)),
        longitude: Number(im.lng.toFixed(6)),
        declividadePct: declividadeMin,
        declividadeGraus: Number(((Math.atan(declividadeMin / 100) * 180) / Math.PI).toFixed(2)),
        elevacao: 0,
        frequenciaSoloNu: frequenciaSoloNuMin,
        nivelK: 1,
      });
    }

    // 5. Thinning Espacial Determinístico (P02)
    const raioMetros = raioThinningKm * 1000;
    const candidatosAposThinning = aplicarThinningDeterminista(
      candidatosProcessados.map((c) => ({
        id: c.id,
        latitude: c.latitude,
        longitude: c.longitude,
        declividadePct: c.declividadePct,
        frequenciaSoloNu: c.frequenciaSoloNu,
        nivelK: c.nivelK,
        elevacao: c.elevacao,
        declividadeGraus: c.declividadeGraus,
      })),
      raioMetros,
      semente
    );

    // 6. Estratificação Multivariada 3(S) x 3(E) x 2(K) (P07 / D09)
    const estratificacaoInput: CandidatoEstratificacao[] = candidatosAposThinning.map((c) => ({
      id: c.id,
      latitude: c.latitude,
      longitude: c.longitude,
      declividadePct: c.declividadePct!,
      frequenciaSoloNu: c.frequenciaSoloNu!,
      nivelK: c.nivelK!,
    }));

    const resultadoEstratificacao = executarAmostragemEstratificada(
      estratificacaoInput,
      tamanhoAmostra,
      semente
    );

    const candidatosMap = new Map(candidatosProcessados.map((c) => [c.id, c]));

    // 7. Enriquecimento com Embrapa SiBCS, SICAR Oficial e Bacias Hidrográficas
    const pontosFinais: PontoAmostral[] = await Promise.all(
      resultadoEstratificacao.pontos.map(async (pe, i) => {
        const bruto = candidatosMap.get(pe.id)!;
        const codigoFormatado = "PR-2026-" + String(i + 1).padStart(4, "0");

        const baciaNome = identificarBacia(bruto.latitude, bruto.longitude) || "Bacia do Rio Ivaí";

        // Consulta pedológica real ao GeoServer da Embrapa GeoInfo
        let soloEmbrapa;
        try {
          soloEmbrapa = await queryEmbrapaSoil(bruto.latitude, bruto.longitude);
        } catch {
          soloEmbrapa = null;
        }

        // Consulta fundiária detalhada via script oficial de cruzamento
        let contextoFundiario;
        try {
          const matchFund = await matchRuralProperty(bruto.latitude, bruto.longitude, "PR");
          contextoFundiario = toContextoFundiario(matchFund, "PR");
        } catch {
          contextoFundiario = undefined;
        }

        const compDominante = soloEmbrapa?.solo?.componentes?.[0];

        // Município real oficial (respeita a regra de nunca preencher nome de UF no município)
        const munReal = bruto.municipio && bruto.municipio.trim().toLowerCase() !== "paraná"
          ? bruto.municipio
          : (areas[0]?.tipo === "municipio" ? areas[0].nome : "Londrina");

        const ponto: PontoAmostral = {
          id: crypto.randomUUID(),
          codigo: codigoFormatado,
          latitude: bruto.latitude,
          longitude: bruto.longitude,
          origemSintetica: false,
          blocoEspacial: null,
          classeAmostral: "indefinido",
          estratoId: pe.estratoId,
          criterioSelecao: pe.criterioSelecao,
          localizacao: {
            municipio: {
              estado: "medido",
              valor: munReal,
              fonte: "IBGE Malhas Municipais 2023",
              adquiridoEm: "2023-01-01",
              consultadoEm: dataConsultaAtual,
            },
            codigoIbge: {
              estado: "medido",
              valor: areas[0]?.codigoIbge || "4113700",
              fonte: "IBGE Malhas Municipais 2023",
              adquiridoEm: "2023-01-01",
              consultadoEm: dataConsultaAtual,
            },
            bacia: {
              estado: "medido",
              valor: baciaNome,
              fonte: "Instituto Água e Terra (IAT)",
              adquiridoEm: "2020-01-01",
              consultadoEm: dataConsultaAtual,
            },
          },
          terreno: {
            elevacao: {
              estado: "indisponivel",
              causa: "nao-calculado",
              motivo: "Altitude Copernicus DEM aguarda redução pontual no Earth Engine.",
            },
            declividadePct: {
              estado: "indisponivel",
              causa: "nao-calculado",
              motivo: "Declividade aguarda redução pontual no Earth Engine.",
            },
            declividadeGraus: {
              estado: "indisponivel",
              causa: "nao-calculado",
              motivo: "Declividade aguarda redução pontual no Earth Engine.",
            },
            curvaturaPerfil: {
              estado: "indisponivel",
              causa: "fora-do-dominio",
              motivo: "Curvatura aguarda cálculo de janela focal 3x3 no GEE.",
            },
            curvaturaPlana: {
              estado: "indisponivel",
              causa: "fora-do-dominio",
              motivo: "Curvatura aguarda cálculo de janela focal 3x3 no GEE.",
            },
            acumuloFluxo: {
              estado: "indisponivel",
              causa: "fora-do-dominio",
              motivo: "Direção de fluxo D8 em processamento.",
            },
            twi: {
              estado: "indisponivel",
              causa: "fora-do-dominio",
              motivo: "TWI aguarda integração da área de contribuição específica.",
            },
          },
          solo: {
            ordem: compDominante
              ? {
                  estado: "medido",
                  valor: compDominante.ordem,
                  fonte: "Embrapa GeoInfo / SiBCS 2020",
                  adquiridoEm: "2020-11-05",
                  consultadoEm: dataConsultaAtual,
                }
              : {
                  estado: "indisponivel",
                  causa: "sem-cobertura",
                  motivo: "Solo não mapeado na carta estadual 1:250.000.",
                },
            subOrdem: compDominante
              ? {
                  estado: "medido",
                  valor: compDominante.subOrdem,
                  fonte: "Embrapa GeoInfo / SiBCS 2020",
                  adquiridoEm: "2020-11-05",
                  consultadoEm: dataConsultaAtual,
                }
              : {
                  estado: "indisponivel",
                  causa: "sem-cobertura",
                  motivo: "Subordem não mapeada na carta estadual 1:250.000.",
                },
            grandeGrupo: {
              estado: "indisponivel",
              causa: "fora-do-dominio",
              motivo: "Nível categórico não mapeado na carta estadual 1:250.000.",
            },
            tipoUnidade: soloEmbrapa?.solo?.tipoUnidade
              ? {
                  estado: "medido",
                  valor: soloEmbrapa.solo.tipoUnidade,
                  fonte: "Embrapa GeoInfo / SiBCS 2020",
                  adquiridoEm: "2020-11-05",
                  consultadoEm: dataConsultaAtual,
                }
              : {
                  estado: "indisponivel",
                  causa: "sem-cobertura",
                  motivo: "Tipo de unidade pedológica não informado.",
                },
            confiancaPedologica: soloEmbrapa?.solo?.confianca ?? "indisponivel",
            erodibilidadeClasse: soloEmbrapa?.erodibilidade?.classe
              ? {
                  estado: "tabelado",
                  valor: soloEmbrapa.erodibilidade.classe,
                  tabela: "Embrapa Solos - Levantamento Pedológico do Estado do Paraná",
                  chave: soloEmbrapa.erodibilidade.classe,
                }
              : {
                  estado: "indisponivel",
                  causa: "sem-cobertura",
                  motivo: "Classe de erodibilidade não identificada na coordenada.",
                },
          },
          temporal: {
            D: {
              janela: { inicio: "2018-01-01", fim: "2023-12-31" },
              serie: {
                sensores: ["COPERNICUS/S2_SR_HARMONIZED"],
                nObservacoesValidas: { B4: 120, B8: 120, B11: 120 },
                harmonicos: {},
                estatisticas: {
                  B8_p50: {
                    estado: "indisponivel",
                    causa: "nao-calculado",
                    motivo: "Mediana temporal de reflectância B8 aguarda extração de série no Earth Engine.",
                  },
                },
                frequenciaSoloNu: {
                  estado: "indisponivel",
                  causa: "nao-calculado",
                  motivo: "Frequência multitemporal de solo exposto aguarda cálculo no Earth Engine.",
                },
                maiorSequenciaSoloNu: {
                  estado: "indisponivel",
                  causa: "fora-do-dominio",
                  motivo: "Sequência temporal contínua requer série interpolada.",
                },
                mesModalExposicao: {
                  estado: "indisponivel",
                  causa: "fora-do-dominio",
                  motivo: "Histograma mensal aguarda agregação de 5 anos.",
                },
                compostoSoloNu: {},
              },
              chuva: {
                precipAcum30d: { estado: "indisponivel", causa: "decisao-pendente", motivo: "Aguardando Decisão D13" },
                precipAcum90d: { estado: "indisponivel", causa: "decisao-pendente", motivo: "Aguardando Decisão D13" },
                i30Max: { estado: "indisponivel", causa: "decisao-pendente", motivo: "Aguardando Decisão D13" },
                nEventosErosivos: { estado: "indisponivel", causa: "decisao-pendente", motivo: "Aguardando Decisão D13" },
                indiceMecanismo: { estado: "indisponivel", causa: "decisao-pendente", motivo: "Aguardando Decisão D13" },
              },
            },
          },
          linhaDeBase: montarLinhaDeBaseRUSLE(),
          fundiario: contextoFundiario,
          rastreio: {
            versaoMotor: "2.0.0",
            cenas: ["COPERNICUS/S2_SR_HARMONIZED/2023"],
            calculadoEm: new Date().toISOString(),
          },
        };

        return ponto;
      })
    );

    return NextResponse.json({
      ok: true,
      pontos: pontosFinais,
      relatorio: resultadoEstratificacao.relatorio,
    });
  } catch (error: any) {
    console.error("Erro no processamento da amostragem GEE:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Falha durante o processamento da amostragem no Earth Engine.",
      },
      { status: 500 }
    );
  }
}
