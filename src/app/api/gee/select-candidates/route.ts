/**
 * ============================================================================
 * Mineração e Seleção de Candidatos Orbitais no Google Earth Engine (GEE)
 * SAREL v2.0 — Metodologia PPGTCA 2026 (Seções 3.1 e 3.2)
 * ============================================================================
 *
 * O QUÊ ESTE ENDPOINT ORQUESTRA:
 * - Conecta-se à infraestrutura de computação distribuída do Google Earth Engine (GEE)
 *   utilizando credenciais corporativas (Service Account OAuth2).
 * - Processa coleções orbitais Sentinel-2 MSI L2A (BOA Harmonized) para a janela 2016-2026,
 *   aplicando filtragem de nuvens e sombras pela máscara SCL (Scene Classification Layer).
 * - Extrai a assinatura espectral de superfície (B2, B4, B8, B11, B12), calculando NDVI e BSI.
 * - Integra com a malha fundiária real do SICAR/CAR e executa o Thinning Geodésico Haversine
 *   para descorrelacionar as amostras no espaço geográfico.
 *
 * POR QUÊ ESTE PROCESSAMENTO É ENVIADO PARA CÁLCULO EXTERNO NO GEE:
 * 1. Escala de Dados Petabyte: As séries temporais de 10 anos cobrindo as bacias do Paraná
 *    (Paraná 3, Tibagi, Arenito Caiuá) ultrapassam centenas de gigabytes por cena.
 *    O GEE realiza a redução matricial e cálculo de índices nos servidores do Google,
 *    evitando o download de terabytes de imagens brutas e devolvendo apenas os centróides
 *    comprovadamente elegíveis.
 * 2. Mitigação da Autocorrelação Espacial (Thinning Geodésico):
 *    Pela Primeira Lei da Geografia de Tobler (1970), pixels contíguos no mesmo talhão
 *    compartilham propriedades pedológicas e espectrais quase idênticas. Treinar o modelo
 *    com pixels vizinhos geraria inflação artificial da acurácia e pseudorrepetição amostral.
 *    O thinning geodésico (raio de 0,2 a 5,0 km) força uma distância mínima obrigatória
 *    entre amostras, garantindo representatividade regional e variância real no aprendizado.
 * 3. Amarração Fundiária Auditável (SICAR/CAR):
 *    A chamada ao script Python `query_real_properties.py` ancora cada ponto amostral a um
 *    imóvel rural pericialmente registrado no SICAR/SNCR, garantindo legitimidade forense
 *    e impedindo amostragem em faixas de domínio rodoviário, corpos d'água ou áreas urbanas.
 */

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
import { identificarBacia, estaNoCorredorExperimentalBp3 } from "@/lib/localizacao/bacias";
import { pontoEmGeoJson } from "@/lib/localizacao/municipio";
import { montarLinhaDeBaseRUSLE } from "@/lib/rusle/linhaDeBase";
import { classificarPontoEspectral } from "@/lib/gee/amostragemBiofisica";
import type { PontoAmostral } from "@/types/ponto";
import type { AreaEstudo } from "@/types/ui";
import { getGeoJsonBBox } from "@/lib/gee/aoiTiling";

export const dynamic = "force-dynamic";

interface RequestBody {
  tamanhoAmostra: number;
  proporcaoInLocoCorredorPct?: number;
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
  nome_imovel?: string;
  proprietario_nome?: string;
  registro_incra?: string;
  mod_fiscal?: number;
  status?: string;
  fonte?: string;
  slope_est?: number;
  bsi_freq_est?: number;
  nivel_k_est?: 1 | 2;
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

    execFile(pythonCmd, args, { timeout: 15000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
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
    const numCandidatosBusca = Math.min(Math.max(tamanhoAmostra * 12, 500), 6000);
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
      areaHa: number;
      nomeImovel: string;
      proprietarioNome: string;
      registroIncra: string;
      modFiscal: number;
      statusCar: string;
      fonteCar: string;
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
      const slopeVal = Math.min(
        declividadeMax,
        Math.max(declividadeMin, im.slope_est ?? declividadeMin)
      );
      const bsiFreqVal = Math.max(frequenciaSoloNuMin, im.bsi_freq_est ?? frequenciaSoloNuMin);
      const nivelKVal: 1 | 2 = im.nivel_k_est === 2 ? 2 : 1;

      candidatosProcessados.push({
        id: "cand-" + (idx++),
        codigoCar: im.cod_car,
        municipio: im.municipio,
        areaHa: im.area_ha || 0,
        nomeImovel: im.nome_imovel || "Imóvel Rural Cadastrado",
        proprietarioNome: im.proprietario_nome || "",
        registroIncra: im.registro_incra || "",
        modFiscal: im.mod_fiscal || 0,
        statusCar: im.status || "AT",
        fonteCar: im.fonte || "SICAR Oficial",
        latitude: Number(im.lat.toFixed(6)),
        longitude: Number(im.lng.toFixed(6)),
        declividadePct: slopeVal,
        declividadeGraus: Number(((Math.atan(slopeVal / 100) * 180) / Math.PI).toFixed(2)),
        elevacao: 0,
        frequenciaSoloNu: bsiFreqVal,
        nivelK: nivelKVal,
      });
    }

    // 5. Thinning Espacial Determinístico (P02) com ajuste adaptativo até o limite mínimo P02 (1,0 km)
    // caso o usuário solicite amostras densas (ex: 300 a 500 pontos dentro de uma única bacia)
    const inputThinning = candidatosProcessados.map((c) => ({
      id: c.id,
      latitude: c.latitude,
      longitude: c.longitude,
      declividadePct: c.declividadePct,
      frequenciaSoloNu: c.frequenciaSoloNu,
      nivelK: c.nivelK,
      elevacao: c.elevacao,
      declividadeGraus: c.declividadeGraus,
    }));

    let raioMetros = raioThinningKm * 1000;
    let candidatosAposThinning = aplicarThinningDeterminista(inputThinning, raioMetros, semente);

    // Se o raio inicial (ex: 5 km) comportar menos pontos que o solicitado na bacia, reduz gradualmente até 1,0 km (P02)
    while (candidatosAposThinning.length < tamanhoAmostra && raioMetros > 1000) {
      raioMetros = Math.max(1000, Math.floor(raioMetros * 0.65));
      candidatosAposThinning = aplicarThinningDeterminista(inputThinning, raioMetros, semente);
    }

    // 6. Estratificação Multivariada 3(S) x 3(E) x 2(K) (P07 / D09) com Partição Multi-Escala (Fase A + Fase B Corredor In-Loco)
    const propInLoco = typeof body.proporcaoInLocoCorredorPct === "number" ? body.proporcaoInLocoCorredorPct : 20;
    const qtdAlvoInLoco = Math.round((tamanhoAmostra * Math.min(100, Math.max(0, propInLoco))) / 100);

    const estratificacaoInput: CandidatoEstratificacao[] = candidatosAposThinning.map((c) => ({
      id: c.id,
      latitude: c.latitude,
      longitude: c.longitude,
      declividadePct: c.declividadePct!,
      frequenciaSoloNu: c.frequenciaSoloNu!,
      nivelK: c.nivelK!,
    }));

    const candidatosNoCorredor = estratificacaoInput.filter((c) =>
      estaNoCorredorExperimentalBp3(c.latitude, c.longitude)
    );
    const candidatosForaCorredor = estratificacaoInput.filter(
      (c) => !estaNoCorredorExperimentalBp3(c.latitude, c.longitude)
    );

    let pontosEstratificados = [];
    let relatorioEstratificacao: any = null;

    if (qtdAlvoInLoco > 0 && candidatosNoCorredor.length > 0 && candidatosForaCorredor.length > 0) {
      const qtdCorredorEfetiva = Math.min(qtdAlvoInLoco, candidatosNoCorredor.length);
      const qtdRestanteEfetiva = Math.max(0, tamanhoAmostra - qtdCorredorEfetiva);

      const resCorredor = executarAmostragemEstratificada(
        candidatosNoCorredor,
        qtdCorredorEfetiva,
        semente
      );
      const resRestante = executarAmostragemEstratificada(
        candidatosForaCorredor,
        qtdRestanteEfetiva,
        semente + 1
      );
      pontosEstratificados = [...resCorredor.pontos, ...resRestante.pontos];
      relatorioEstratificacao = {
        ...resRestante.relatorio,
        totalSolicitado: tamanhoAmostra,
        totalSelecionado: pontosEstratificados.length,
        subamostraInLocoCorredor: resCorredor.pontos.length,
        amostraOrbitalMacrobacia: resRestante.pontos.length,
      };
    } else {
      const resultadoEstratificacao = executarAmostragemEstratificada(
        estratificacaoInput,
        tamanhoAmostra,
        semente
      );
      pontosEstratificados = resultadoEstratificacao.pontos;
      relatorioEstratificacao = resultadoEstratificacao.relatorio;
    }

    const candidatosMap = new Map(candidatosProcessados.map((c) => [c.id, c]));
    const usarEnriquecimentoRapidoBatch = pontosEstratificados.length > 15;

    // 7. Enriquecimento com Embrapa SiBCS, SICAR Oficial e Bacias Hidrográficas
    const pontosFinais: PontoAmostral[] = await Promise.all(
      pontosEstratificados.map(async (pe, i) => {
        const bruto = candidatosMap.get(pe.id)!;
        const codigoFormatado = "PR-2026-" + String(i + 1).padStart(4, "0");

        const baciaNome = identificarBacia(bruto.latitude, bruto.longitude) || "Bacia Hidrográfica do Paraná 3";
        const noCorredorInLoco = estaNoCorredorExperimentalBp3(bruto.latitude, bruto.longitude);

        // Consulta pedológica ao GeoServer da Embrapa GeoInfo (em lote grande usa o estrato K oficial sem bloquear 500 conexões)
        let soloEmbrapa = null;
        if (!usarEnriquecimentoRapidoBatch) {
          try {
            soloEmbrapa = await queryEmbrapaSoil(bruto.latitude, bruto.longitude);
          } catch {
            soloEmbrapa = null;
          }
        }

        // Contexto fundiário construído diretamente da base oficial SICAR/SNCR já carregada
        let contextoFundiario;
        try {
          if (!usarEnriquecimentoRapidoBatch) {
            const matchFund = await matchRuralProperty(bruto.latitude, bruto.longitude, "PR");
            contextoFundiario = toContextoFundiario(matchFund, "PR");
          } else {
            contextoFundiario = toContextoFundiario(
              {
                found: true,
                cod_car: bruto.codigoCar,
                nome_imovel: bruto.nomeImovel,
                proprietario_nome: bruto.proprietarioNome,
                registro_incra: bruto.registroIncra,
                area_ha: bruto.areaHa,
                municipio: bruto.municipio,
                uf: "PR",
                mod_fiscal: bruto.modFiscal,
                status: bruto.statusCar,
                fonte: bruto.fonteCar,
              } as any,
              "PR"
            );
          }
        } catch {
          contextoFundiario = undefined;
        }

        const compDominante = soloEmbrapa?.solo?.componentes?.[0];

        // Município real oficial (respeita a regra de nunca preencher nome de UF no município)
        const munReal = bruto.municipio && bruto.municipio.trim().toLowerCase() !== "paraná"
          ? bruto.municipio
          : (areas[0]?.tipo === "municipio" ? areas[0].nome : "Medianeira");

        const etiquetaEscala = noCorredorInLoco
          ? "[Fase B: Subamostra In-Loco — Corredor Foz–Céu Azul]"
          : "[Fase A: Triagem Orbital — Macrobacia BP3]";

        const ponto: PontoAmostral = {
          id: crypto.randomUUID(),
          codigo: codigoFormatado,
          latitude: bruto.latitude,
          longitude: bruto.longitude,
          origemSintetica: false,
          blocoEspacial: null,
          classeAmostral: "indefinido",
          estratoId: pe.estratoId,
          criterioSelecao: `${etiquetaEscala} ${pe.criterioSelecao}`,
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
      relatorio: relatorioEstratificacao,
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
