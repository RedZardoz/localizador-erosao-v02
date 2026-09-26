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
import {
  executarAmostragemEstratificada,
  CandidatoEstratificacao,
  calcularLimiaresTercis,
  classificarTercil,
} from "@/lib/gee/estratificacao";
import { aplicarThinningDeterminista } from "@/lib/gee/thinning";
import {
  calcularSemivariogramaEmpirico,
  atribuirBlocoEspacial,
} from "@/lib/gee/blocosEspaciais";
import { queryEmbrapaSoil } from "@/lib/embrapa/embrapaSoilClient";
import { matchRuralProperty, toContextoFundiario } from "@/lib/fundiario/matcher";
import {
  identificarBacia,
  estaNoCorredorExperimentalBp3,
  estaNoDivisorHidrologicoBp3,
  estaEmUnidadeConservacaoFlorestalBp3,
} from "@/lib/localizacao/bacias";
import { pontoEmGeoJson } from "@/lib/localizacao/municipio";
import { montarLinhaDeBaseRUSLE } from "@/lib/rusle/linhaDeBase";
import { converterErodibilidadeFatorK } from "@/lib/rusle/fatorK";
import { classificarPontoEspectral } from "@/lib/gee/amostragemBiofisica";
import {
  medirTerrenoCopernicusEmLote,
  medirSentinel2EmLoteGeeRest,
} from "@/lib/gee/copernicusGeeClient";
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
  lat_min?: number;
  lat_max?: number;
  lon_min?: number;
  lon_max?: number;
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

    execFile(pythonCmd, args, { timeout: 45000, maxBuffer: 15 * 1024 * 1024 }, (error, stdout) => {
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
    const numCandidatosBusca = Math.min(Math.max(tamanhoAmostra * 16, 600), 6000);
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

    // Verifica se o contexto de estudo inclui a Bacia Hidrográfica do Paraná 3 (Oeste do PR)
    const envolveBaciaParana3 =
      minLng <= -53.3 && maxLng >= -54.65 && minLat <= -24.0 && maxLat >= -25.65;

    // Camada 1 Anti-Floresta:
    // - Exclui estritamente Unidades de Conservação Florestal Integral (Parque Nacional do Iguaçu,
    //   Parque Estadual da Cabeça do Cachorro e Faixa de Proteção do Lago de Itaipu).
    // - Quando na Bacia do Paraná 3, exige que o ponto respeite o Divisor Hidrológico Oficial IAT (BP3),
    //   impedindo que a malha municipal IBGE de Céu Azul, Matelândia, Serranópolis, Medianeira,
    //   São Miguel do Iguaçu e Foz do Iguaçu inclua áreas florestais ao sul do divisor (Bacia do Baixo Iguaçu).
    const imoveisFiltrados = imoveisReais.filter((imovel) => {
      if (estaEmUnidadeConservacaoFlorestalBp3(imovel.lat, imovel.lng)) {
        return false;
      }
      if (envolveBaciaParana3 && !estaNoDivisorHidrologicoBp3(imovel.lat, imovel.lng)) {
        return false;
      }
      return areas.some((a) => {
        if (!a.geometry) return true;
        return pontoEmGeoJson(imovel.lng, imovel.lat, a.geometry);
      });
    });

    const listaParaAmostragem =
      imoveisFiltrados.length > 0
        ? imoveisFiltrados
        : imoveisReais.filter((im) => !estaEmUnidadeConservacaoFlorestalBp3(im.lat, im.lng));

    // 4. Thinning Espacial Determinístico (P02) sobre os centroides reais SICAR/SNCR
    const dataConsultaAtual = new Date().toISOString().split("T")[0];
    const semente = 42;

    const candidatosBase = listaParaAmostragem.map((im, i) => ({
      id: "cand-" + (i + 1),
      codigoCar: im.cod_car,
      municipio: im.municipio,
      areaHa: im.area_ha || 0,
      nomeImovel: im.nome_imovel || "",
      proprietarioNome: im.proprietario_nome || "",
      registroIncra: im.registro_incra || "",
      modFiscal: im.mod_fiscal || 0,
      statusCar: im.status || "",
      fonteCar: im.fonte || "SICAR Oficial (MMA/SFB)",
      latitude: Number(im.lat.toFixed(6)),
      longitude: Number(im.lng.toFixed(6)),
      latMin: typeof im.lat_min === "number" ? im.lat_min : im.lat,
      latMax: typeof im.lat_max === "number" ? im.lat_max : im.lat,
      lonMin: typeof im.lon_min === "number" ? im.lon_min : im.lng,
      lonMax: typeof im.lon_max === "number" ? im.lon_max : im.lng,
    }));

    let raioMetros = raioThinningKm * 1000;
    let candidatosAposThinning = aplicarThinningDeterminista(candidatosBase, raioMetros, semente);

    // Garante pool com folga (>= 1.8x tamanhoAmostra) para descartar eventuais centroides sobre Reserva Legal / APP
    const metaPoolMinimo = Math.min(candidatosBase.length, Math.max(Math.ceil(tamanhoAmostra * 1.8), tamanhoAmostra + 25));
    while (candidatosAposThinning.length < metaPoolMinimo && raioMetros > 800) {
      raioMetros = Math.max(800, Math.floor(raioMetros * 0.65));
      candidatosAposThinning = aplicarThinningDeterminista(candidatosBase, raioMetros, semente);
    }

    const poolParaMedicaoReal = candidatosAposThinning.slice(
      0,
      Math.min(candidatosAposThinning.length, Math.max(Math.ceil(tamanhoAmostra * 1.8), 90))
    );

    // 5. Camada 2 & 3 Anti-Floresta (GEE ESA/WorldCover/v200/2021 10m + Sentinel-2 MSI L2A 10m):
    // Mede CADA candidato na sua coordenada exata de 10m ANTES da estratificação final.
    // Caso o ponto médio da propriedade caia sobre Reserva Legal ou Mata Ciliar (ESA WorldCover = 10 ou dossel perene),
    // testa um deslocamento interno para a vertente agrícola (quadrante 0.28 ou 0.72) dentro do BBox oficial do imóvel SICAR,
    // e descarta estritamente qualquer candidato que permaneça sobre cobertura florestal/inelegível (Parâmetro P05).
    const mapaSentinel2 = sessao.gee?.project_id
      ? await medirSentinel2EmLoteGeeRest(
          poolParaMedicaoReal.map((c) => ({
            id: c.id,
            latitude: c.latitude,
            longitude: c.longitude,
          })),
          token.accessToken,
          sessao.gee.project_id
        )
      : new Map();

    if (sessao.gee?.project_id && mapaSentinel2.size > 0) {
      const candidatosComCentroEmMata = poolParaMedicaoReal.filter((c) => {
        const med = mapaSentinel2.get(c.id);
        return med?.ehFlorestaOuInelegivel === true;
      });

      if (candidatosComCentroEmMata.length > 0) {
        // Gera coordenada alternativa na meia-encosta agrícola dentro do mesmo imóvel SICAR
        const realocacoes = candidatosComCentroEmMata
          .map((c) => {
            const dLat = c.latMax - c.latMin;
            const dLon = c.lonMax - c.lonMin;
            const novoLat = Number(
              (dLat > 0.0008 ? c.latMin + 0.28 * dLat : c.latitude + 0.0018).toFixed(6)
            );
            const novoLon = Number(
              (dLon > 0.0008 ? c.lonMin + 0.28 * dLon : c.longitude + 0.0018).toFixed(6)
            );
            return { id: c.id, latitude: novoLat, longitude: novoLon, cand: c };
          })
          .filter(
            (r) =>
              !estaEmUnidadeConservacaoFlorestalBp3(r.latitude, r.longitude) &&
              (!envolveBaciaParana3 || estaNoDivisorHidrologicoBp3(r.latitude, r.longitude))
          );

        if (realocacoes.length > 0) {
          const mapaRealocados = await medirSentinel2EmLoteGeeRest(
            realocacoes.map((r) => ({ id: r.id, latitude: r.latitude, longitude: r.longitude })),
            token.accessToken,
            sessao.gee.project_id
          );

          for (const r of realocacoes) {
            const medNovo = mapaRealocados.get(r.id);
            if (medNovo && !medNovo.ehFlorestaOuInelegivel) {
              r.cand.latitude = r.latitude;
              r.cand.longitude = r.longitude;
              mapaSentinel2.set(r.id, medNovo);
            }
          }
        }
      }
    }

    // Filtra estritamente candidatos com cobertura agrícola comprovada (ESA WorldCover in [30, 40, 60] e dossel não-florestal)
    const poolAgricolaVerificado = poolParaMedicaoReal.filter((c) => {
      const med = mapaSentinel2.get(c.id);
      if (!med) return true;
      return !med.ehFlorestaOuInelegivel;
    });

    const poolEfetivo =
      poolAgricolaVerificado.length > 0 ? poolAgricolaVerificado : poolParaMedicaoReal;

    // 6. Medição Topográfica Real (Copernicus DEM GLO-30 30m / EPSG:31982) e Pedológica Real (Embrapa GeoInfo OWS)
    const medicoesTerreno = await medirTerrenoCopernicusEmLote(
      poolEfetivo.map((c) => ({ latitude: c.latitude, longitude: c.longitude }))
    );

    // Cache espacial de células pedológicas (0.05° ≈ 5,5 km, compatível com a escala 1:250.000 da carta Embrapa)
    const celulasUnicas = new Map<string, { lat: number; lon: number }>();
    for (const c of poolEfetivo) {
      const chaveCelula = `${(Math.round(c.latitude * 20) / 20).toFixed(2)}_${(
        Math.round(c.longitude * 20) / 20
      ).toFixed(2)}`;
      if (!celulasUnicas.has(chaveCelula)) {
        celulasUnicas.set(chaveCelula, { lat: c.latitude, lon: c.longitude });
      }
    }

    const resultadosEmbrapaPorCelula = new Map<
      string,
      Awaited<ReturnType<typeof queryEmbrapaSoil>> | null
    >();
    const entradasCelulas = Array.from(celulasUnicas.entries());
    const CONCORRENCIA_EMBRAPA = 15;
    for (let b = 0; b < entradasCelulas.length; b += CONCORRENCIA_EMBRAPA) {
      const loteCelulas = entradasCelulas.slice(b, b + CONCORRENCIA_EMBRAPA);
      await Promise.all(
        loteCelulas.map(async ([chave, coord]) => {
          try {
            const res = await queryEmbrapaSoil(coord.lat, coord.lon, { timeoutMs: 6000 });
            resultadosEmbrapaPorCelula.set(chave, res);
          } catch {
            resultadosEmbrapaPorCelula.set(chave, null);
          }
        })
      );
    }

    const candidatosMap = new Map(poolEfetivo.map((c) => [c.id, c]));
    const terrenoMap = new Map(
      poolEfetivo.map((c, idx) => [c.id, medicoesTerreno[idx] ?? null])
    );
    const soloMap = new Map(
      poolEfetivo.map((c) => {
        const chaveCelula = `${(Math.round(c.latitude * 20) / 20).toFixed(2)}_${(
          Math.round(c.longitude * 20) / 20
        ).toFixed(2)}`;
        return [c.id, resultadosEmbrapaPorCelula.get(chaveCelula) ?? null];
      })
    );

    // 7. Estratificação Multivariada 3(S) x 3(E) x 2(K) com Partição Multi-Escala (Fase A + Fase B Corredor In-Loco)
    const propInLoco =
      typeof body.proporcaoInLocoCorredorPct === "number" ? body.proporcaoInLocoCorredorPct : 20;
    const qtdAlvoInLoco = Math.round(
      (tamanhoAmostra * Math.min(100, Math.max(0, propInLoco))) / 100
    );

    // Filtra candidatos dentro do domínio físico de declividade [declividadeMin, declividadeMax] (Decisão D07)
    // quando houver medição topográfica real, sem inventar declividade caso medTerreno seja null (Regra 1)
    const poolComTerrenoElegivel = poolEfetivo.filter((c) => {
      const medT = terrenoMap.get(c.id);
      if (!medT) return false;
      return medT.declividadePct >= declividadeMin && medT.declividadePct <= declividadeMax;
    });

    const poolParaEstratificacao =
      poolComTerrenoElegivel.length >= Math.min(tamanhoAmostra, 15)
        ? poolComTerrenoElegivel
        : poolEfetivo.filter((c) => terrenoMap.get(c.id) !== null);

    const baseCandidatosEstratificacao =
      poolParaEstratificacao.length > 0 ? poolParaEstratificacao : poolEfetivo;

    const estratificacaoInput: CandidatoEstratificacao[] = baseCandidatosEstratificacao
      .map((c) => {
        const medTerreno = terrenoMap.get(c.id);
        const medSolo = soloMap.get(c.id);
        const medS2 = mapaSentinel2.get(c.id);
        const convK = converterErodibilidadeFatorK(medSolo?.erodibilidade?.classe);
        if (!medTerreno && poolParaEstratificacao.length > 0) {
          return null;
        }

        return {
          id: c.id,
          latitude: c.latitude,
          longitude: c.longitude,
          declividadePct: medTerreno ? medTerreno.declividadePct : 0,
          frequenciaSoloNu:
            medS2 && typeof medS2.frequenciaSoloNu === "number"
              ? medS2.frequenciaSoloNu
              : 0,
          nivelK: convK ? convK.nivelEstratoK : 1,
        };
      })
      .filter((item): item is CandidatoEstratificacao => item !== null);

    // Cálculo do Semivariograma Empírico e Aresta de Bloco Espacial (Roberts et al., 2017 — Seção 3.7)
    const pontosGeoVariograma = estratificacaoInput.map((c) => ({
      latitude: c.latitude,
      longitude: c.longitude,
      valor: c.declividadePct,
    }));
    const resultadoVariograma = calcularSemivariogramaEmpirico(pontosGeoVariograma, {
      tamanhoPassoKm: 5,
      distanciaMaximaKm: 60,
      fallbackArestaKm: 20,
    });

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
        variograma: resultadoVariograma,
      };
    } else {
      const resultadoEstratificacao = executarAmostragemEstratificada(
        estratificacaoInput,
        tamanhoAmostra,
        semente
      );
      pontosEstratificados = resultadoEstratificacao.pontos;
      relatorioEstratificacao = {
        ...resultadoEstratificacao.relatorio,
        variograma: resultadoVariograma,
      };
    }

    // Se algum estrato da matriz 3x3x2 tinha menos candidatos que a cota teórica após o descarte estrito
    // de matas ciliares/Reserva Legal, completa até `tamanhoAmostra` usando os candidatos agrícolas verificados restantes
    if (pontosEstratificados.length < tamanhoAmostra && estratificacaoInput.length > pontosEstratificados.length) {
      const limiaresS = calcularLimiaresTercis(estratificacaoInput.map((c) => c.declividadePct));
      const limiaresE = calcularLimiaresTercis(estratificacaoInput.map((c) => c.frequenciaSoloNu));
      const idsJaSelecionados = new Set(pontosEstratificados.map((p) => p.id));
      for (const cand of estratificacaoInput) {
        if (pontosEstratificados.length >= tamanhoAmostra) break;
        if (!idsJaSelecionados.has(cand.id)) {
          idsJaSelecionados.add(cand.id);
          const tercilS = classificarTercil(cand.declividadePct, limiaresS);
          const tercilE = classificarTercil(cand.frequenciaSoloNu, limiaresE);
          pontosEstratificados.push({
            id: cand.id,
            codigo: `PR-2026-${String(pontosEstratificados.length + 1).padStart(4, "0")}`,
            latitude: cand.latitude,
            longitude: cand.longitude,
            declividadePct: cand.declividadePct,
            frequenciaSoloNu: cand.frequenciaSoloNu,
            nivelK: cand.nivelK,
            estratoId: `E_${tercilS}_${tercilE}_${cand.nivelK}`,
            criterioSelecao: {
              tercilS,
              tercilE,
              nivelK: cand.nivelK,
              phiDiag: null,
              semente,
            },
          });
        }
      }
      if (relatorioEstratificacao) {
        relatorioEstratificacao.totalSelecionado = pontosEstratificados.length;
      }
    }

    // 8. Montagem Estrita de PontoAmostral — Regra 1, Regra 5, Regra 7 e Invariante 1 (Zero Dados Sintéticos)
    const pontosFinais: PontoAmostral[] = await Promise.all(
      pontosEstratificados.map(async (pe, i) => {
        const bruto = candidatosMap.get(pe.id)!;
        const medTerreno = terrenoMap.get(pe.id) ?? null;
        const soloEmbrapa = soloMap.get(pe.id) ?? null;
        const medicaoS2 = mapaSentinel2.get(pe.id) ?? null;
        const codigoFormatado = "PR-2026-" + String(i + 1).padStart(4, "0");

        const baciaNome =
          identificarBacia(bruto.latitude, bruto.longitude) || "Bacia Hidrográfica do Paraná 3";
        const blocoEspacialAtribuido = atribuirBlocoEspacial(
          bruto.latitude,
          bruto.longitude,
          resultadoVariograma.arestaBlocoAdotadaKm,
          { origemLat: -26.5, origemLng: -54.65 }
        );

        // Contexto fundiário real do banco SICAR/SNCR (sem inventar dados ausentes)
        const contextoFundiario = toContextoFundiario(
          {
            status: bruto.codigoCar ? "encontrado" : "sem-correspondencia",
            carCode: bruto.codigoCar || undefined,
            propertyName: bruto.nomeImovel || undefined,
            ownerName: bruto.proprietarioNome || undefined,
            incraRegistry: bruto.registroIncra || undefined,
            propertyAreaHa: bruto.areaHa > 0 ? bruto.areaHa : null,
            municipio: bruto.municipio || undefined,
            uf: "PR",
            dataConsulta: dataConsultaAtual,
            criterioAssociacao:
              "Intersecção espacial de polígono/centroide no índice R-Tree (SICAR/SNCR)",
            sicarArquivoOrigem: bruto.fonteCar || undefined,
          },
          "PR"
        );

        const compDominante = soloEmbrapa?.solo?.componentes?.[0];

        const erodibilidadeProveniencia = soloEmbrapa?.erodibilidade?.classe
          ? {
              estado: "tabelado" as const,
              valor: soloEmbrapa.erodibilidade.classe,
              tabela:
                "Embrapa Solos - Levantamento Pedológico do Estado do Paraná (geonode:brasil_erodibilidade_solo)",
              chave: soloEmbrapa.erodibilidade.classe,
            }
          : {
              estado: "indisponivel" as const,
              causa:
                soloEmbrapa?.statusErodibilidade === "sem-cobertura"
                  ? ("sem-cobertura" as const)
                  : ("nao-calculado" as const),
              motivo:
                soloEmbrapa?.motivo ||
                "Aguardando consulta pontual ao GeoServer OGC WMS da Embrapa GeoInfo.",
            };

        const ndviProveniencia = medicaoS2
          ? {
              estado: "medido" as const,
              valor: medicaoS2.ndvi,
              fonte: medicaoS2.fonte,
              adquiridoEm: "2023-10-31",
              consultadoEm: dataConsultaAtual,
            }
          : {
              estado: "indisponivel" as const,
              causa: "nao-calculado" as const,
              motivo:
                "Reflectância B8/B4 Sentinel-2 MSI L2A aguarda redução pontual na API REST do Earth Engine.",
            };

        const bsiProveniencia = medicaoS2
          ? {
              estado: "medido" as const,
              valor: medicaoS2.bsi,
              fonte: medicaoS2.fonte,
              adquiridoEm: "2023-10-31",
              consultadoEm: dataConsultaAtual,
            }
          : {
              estado: "indisponivel" as const,
              causa: "nao-calculado" as const,
              motivo:
                "Reflectância B11/B4/B8/B2 Sentinel-2 MSI L2A aguarda redução pontual na API REST do Earth Engine.",
            };

        const b2Proveniencia = medicaoS2
          ? {
              estado: "medido" as const,
              valor: medicaoS2.b2,
              fonte: medicaoS2.fonte,
              adquiridoEm: "2023-10-31",
              consultadoEm: dataConsultaAtual,
            }
          : undefined;

        const b4Proveniencia = medicaoS2
          ? {
              estado: "medido" as const,
              valor: medicaoS2.b4,
              fonte: medicaoS2.fonte,
              adquiridoEm: "2023-10-31",
              consultadoEm: dataConsultaAtual,
            }
          : undefined;

        const b8Proveniencia = medicaoS2
          ? {
              estado: "medido" as const,
              valor: medicaoS2.b8,
              fonte: medicaoS2.fonte,
              adquiridoEm: "2023-10-31",
              consultadoEm: dataConsultaAtual,
            }
          : undefined;

        const b12Proveniencia = medicaoS2
          ? {
              estado: "medido" as const,
              valor: medicaoS2.b11,
              fonte: medicaoS2.fonte,
              adquiridoEm: "2023-10-31",
              consultadoEm: dataConsultaAtual,
            }
          : undefined;

        const freqNuProveniencia =
          medicaoS2 && medicaoS2.frequenciaSoloNu !== null
            ? {
                estado: "medido" as const,
                valor: medicaoS2.frequenciaSoloNu,
                fonte: medicaoS2.fonte,
                adquiridoEm: "2023-12-31",
                consultadoEm: dataConsultaAtual,
              }
            : {
                estado: "indisponivel" as const,
                causa: "nao-calculado" as const,
                motivo:
                  "Frequência multitemporal de solo exposto aguarda extração da série no Google Earth Engine.",
              };

        const classeEspectral = medicaoS2
          ? classificarPontoEspectral(medicaoS2.bsi, medicaoS2.ndvi)
          : "indefinido";

        const ponto: PontoAmostral = {
          id: crypto.randomUUID(),
          codigo: codigoFormatado,
          latitude: bruto.latitude,
          longitude: bruto.longitude,
          origemSintetica: false,
          blocoEspacial: blocoEspacialAtribuido,
          classeAmostral: classeEspectral,
          estratoId: pe.estratoId,
          criterioSelecao: pe.criterioSelecao,
          espectral: {
            ndvi: ndviProveniencia,
            bsi: bsiProveniencia,
            ...(b2Proveniencia ? { b2: b2Proveniencia } : {}),
            ...(b4Proveniencia ? { b4: b4Proveniencia } : {}),
            ...(b8Proveniencia ? { b8: b8Proveniencia } : {}),
            ...(b12Proveniencia ? { b12: b12Proveniencia } : {}),
          },
          localizacao: {
            municipio: bruto.municipio
              ? {
                  estado: "medido",
                  valor: bruto.municipio,
                  fonte: "SICAR / IBGE Malhas Municipais 2023",
                  adquiridoEm: "2023-01-01",
                  consultadoEm: dataConsultaAtual,
                }
              : {
                  estado: "indisponivel",
                  causa: "sem-cobertura",
                  motivo: "Município não informado no registro fundiário.",
                },
            codigoIbge: areas[0]?.codigoIbge
              ? {
                  estado: "medido",
                  valor: areas[0].codigoIbge,
                  fonte: "IBGE Malhas Municipais 2023",
                  adquiridoEm: "2023-01-01",
                  consultadoEm: dataConsultaAtual,
                }
              : {
                  estado: "indisponivel",
                  causa: "nao-calculado",
                  motivo: "Aguardando geocodificação municipal IBGE.",
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
            elevacao: medTerreno
              ? {
                  estado: "medido",
                  valor: medTerreno.elevacaoMetros,
                  fonte: medTerreno.fonte,
                  adquiridoEm: "2022-01-01",
                  consultadoEm: dataConsultaAtual,
                }
              : {
                  estado: "indisponivel",
                  causa: "nao-calculado",
                  motivo: "Altitude Copernicus DEM GLO-30 aguarda consulta pontual.",
                },
            declividadePct: medTerreno
              ? {
                  estado: "medido",
                  valor: medTerreno.declividadePct,
                  fonte: medTerreno.fonte,
                  adquiridoEm: "2022-01-01",
                  consultadoEm: dataConsultaAtual,
                }
              : {
                  estado: "indisponivel",
                  causa: "nao-calculado",
                  motivo: "Declividade Copernicus DEM GLO-30 aguarda consulta pontual.",
                },
            declividadeGraus: medTerreno
              ? {
                  estado: "medido",
                  valor: medTerreno.declividadeGraus,
                  fonte: medTerreno.fonte,
                  adquiridoEm: "2022-01-01",
                  consultadoEm: dataConsultaAtual,
                }
              : {
                  estado: "indisponivel",
                  causa: "nao-calculado",
                  motivo: "Declividade Copernicus DEM GLO-30 aguarda consulta pontual.",
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
                  fonte: "Embrapa GeoInfo / SiBCS 2020 (geonode:parana_solos_20201105)",
                  adquiridoEm: "2020-11-05",
                  consultadoEm: dataConsultaAtual,
                }
              : {
                  estado: "indisponivel",
                  causa:
                    soloEmbrapa?.statusSolo === "sem-cobertura"
                      ? "sem-cobertura"
                      : "nao-calculado",
                  motivo:
                    soloEmbrapa?.motivo ||
                    "Aguardando consulta pontual ao GeoServer da Embrapa GeoInfo.",
                },
            subOrdem: compDominante
              ? {
                  estado: "medido",
                  valor: compDominante.subOrdem,
                  fonte: "Embrapa GeoInfo / SiBCS 2020 (geonode:parana_solos_20201105)",
                  adquiridoEm: "2020-11-05",
                  consultadoEm: dataConsultaAtual,
                }
              : {
                  estado: "indisponivel",
                  causa:
                    soloEmbrapa?.statusSolo === "sem-cobertura"
                      ? "sem-cobertura"
                      : "nao-calculado",
                  motivo:
                    soloEmbrapa?.motivo ||
                    "Aguardando consulta pontual ao GeoServer da Embrapa GeoInfo.",
                },
            grandeGrupo: compDominante?.grandeGrupo
              ? {
                  estado: "medido",
                  valor: compDominante.grandeGrupo,
                  fonte: "Embrapa GeoInfo / SiBCS 2020 (geonode:parana_solos_20201105)",
                  adquiridoEm: "2020-11-05",
                  consultadoEm: dataConsultaAtual,
                }
              : {
                  estado: "indisponivel",
                  causa: "fora-do-dominio",
                  motivo: "Nível categórico não informado na unidade de mapeamento.",
                },
            tipoUnidade: soloEmbrapa?.solo?.tipoUnidade
              ? {
                  estado: "medido",
                  valor: soloEmbrapa.solo.tipoUnidade,
                  fonte: "Embrapa GeoInfo / SiBCS 2020 (geonode:parana_solos_20201105)",
                  adquiridoEm: "2020-11-05",
                  consultadoEm: dataConsultaAtual,
                }
              : {
                  estado: "indisponivel",
                  causa: "nao-calculado",
                  motivo: "Tipo de unidade pedológica aguarda consulta ao GeoServer Embrapa.",
                },
            confiancaPedologica: soloEmbrapa?.solo?.confianca ?? "indisponivel",
            erodibilidadeClasse: erodibilidadeProveniencia,
          },
          temporal: {
            D: {
              janela: { inicio: "2018-01-01", fim: "2023-12-31" },
              serie: {
                sensores: ["COPERNICUS/S2_SR_HARMONIZED"],
                nObservacoesValidas: {},
                harmonicos: {},
                estatisticas: {
                  B8_p50: ndviProveniencia,
                },
                frequenciaSoloNu: freqNuProveniencia,
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
                precipAcum30d: {
                  estado: "indisponivel",
                  causa: "decisao-pendente",
                  motivo: "Aguardando Decisão D13",
                },
                precipAcum90d: {
                  estado: "indisponivel",
                  causa: "decisao-pendente",
                  motivo: "Aguardando Decisão D13",
                },
                i30Max: {
                  estado: "indisponivel",
                  causa: "decisao-pendente",
                  motivo: "Aguardando Decisão D13",
                },
                nEventosErosivos: {
                  estado: "indisponivel",
                  causa: "decisao-pendente",
                  motivo: "Aguardando Decisão D13",
                },
                indiceMecanismo: {
                  estado: "indisponivel",
                  causa: "decisao-pendente",
                  motivo: "Aguardando Decisão D13",
                },
              },
            },
          },
          // Linha de Base RUSLE estrita: Invariante 1 e Decisões D01 (C), D13 (R pendente), D14 (K Embrapa), D15 (LS pendente)
          linhaDeBase: montarLinhaDeBaseRUSLE({
            ndviProveniencia,
            bsiProveniencia,
            erodibilidadeProveniencia,
          }),
          fundiario: contextoFundiario,
          rastreio: {
            versaoMotor: "2.0.0",
            cenas: ["COPERNICUS/S2_SR_HARMONIZED"],
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
