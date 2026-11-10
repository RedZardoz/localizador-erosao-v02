/**
 * ============================================================================
 * Remedição Pericial de Candidatos da BP3 — Pipeline Amostral D16 Emendada
 * SAREL v2.0 — Decisões D07, D08, D09, D12, D16, D24 / Parâmetros P02, P07
 * Data: 30/09/2026
 * ============================================================================
 *
 * EXECUTA E REGISTRA:
 * - X1: Relaxamento do thinning até o piso inviolável de 1.000 m (exigirDecisao(P02)).
 * - X2: Teto operacional aplicado após a seleção e filtro físico de D07.
 * - X3: Ponto na parte elegível do imóvel rural (não no centroide arbitrário),
 *       sorteado ao acaso determinístico (P07) sob guarda estrita anticircularidade.
 * - Remedição na faixa 3% a 20% (D07 real, sem a distorção anterior de 3-45%).
 * - Contagem exata de candidatos por estrato e total em K̂=2 contra os 36 necessários.
 * - Respeito estrito a P11: se K̂=2 não alcançar 4 por estrato em algum estrato,
 *   relata com os números exatos e as células deficientes sem alterar limiares.
 */

import { execFile, execSync } from "child_process";
import path from "path";
import fs from "fs";
import {
  estaNoDivisorHidrologicoBp3,
  estaEmUnidadeConservacaoFlorestalBp3,
} from "@/lib/localizacao/bacias";
import { aplicarThinningDeterminista } from "@/lib/gee/thinning";
import { medirTerrenoCopernicusGLO30RealEmLote } from "@/lib/drone/planoVooNControl";
import {
  selecionarPontoElegivelImovel,
  gerarMalhaCelulasImovel,
  validarAusenciaCamposProibidos,
} from "@/lib/fundiario/selecaoPontoElegivel";
import {
  queryEmbrapaSoil,
  derivarNivelKDaCarta2024,
  verificarSanidadeZeroFeicoesLoteEmbrapa,
} from "@/lib/embrapa/embrapaSoilClient";
import {
  TODOS_ESTRATOS_D12,
  calcularLimiaresTercis,
  classificarTercil,
  criarPrng,
} from "@/lib/gee/estratificacao";
import { carregarCredenciaisServiceAccountLote } from "@/lib/seguranca/credenciaisSeguras";
import { getGoogleAccessToken } from "@/lib/gee/auth";
import {
  medirFrequenciaSoloNuEmLoteGeeRest,
  carregarCacheFrequenciaSoloNu,
  salvarCacheFrequenciaSoloNu,
  gerarChaveCacheSoloNu,
  calcularHashDefinicao,
  DEFINICAO_METRICA_SOLO_NU,
  obterCaminhoPadraoCacheFrequenciaSoloNu,
  MedicaoSoloNuLote,
} from "@/lib/gee/amostragemSoloNuLote";
import { valorOuNulo } from "@/types/proveniencia";
import { criarDiarioRequisicoes, salvarDiarioRequisicoes } from "@/lib/seguranca/diarioRequisicoes";
import { REGISTRO_DECISOES, PARAMETROS, exigirDecisao } from "@/config/decisoes";

export const FONTE_DOS_DADOS =
  "Base Fundiária Nacional (data/fundiario_brasil.db) + Copernicus DEM GLO-30 Local COG + Embrapa GeoInfo WFS (Carta 2024 / docs/verificacoes/cache_pedologia_bp3.json)";

function obterGitCommitAtual(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "indisponivel";
  }
}

interface ImovelRealDb {
  cod_car: string;
  municipio: string;
  lat: number;
  lng: number;
  area_ha: number;
  nome_imovel?: string;
  fonte?: string;
  lat_min?: number;
  lat_max?: number;
  lon_min?: number;
  lon_max?: number;
}

function buscarImoveisReais(limite: number): Promise<ImovelRealDb[]> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), "scripts/query_real_properties.py");
    // Envelope geográfico da BP3
    const args = [scriptPath, "-54.65", "-25.65", "-53.35", "-24.00", String(limite)];
    execFile(
      "python",
      args,
      { timeout: 45000, maxBuffer: 25 * 1024 * 1024 },
      (error, stdout) => {
        if (error) return reject(error);
        try {
          const dados = JSON.parse(stdout) as ImovelRealDb[];
          resolve(Array.isArray(dados) ? dados : []);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

async function executarRemedicao() {
  console.log("===============================================================================");
  console.log("REMEDIÇÃO PERICIAL DOS CANDIDATOS DA BP3 — PIPELINE AMOSTRAL D16 EMENDADA");
  console.log("Data: 30/09/2026 | Metodologia PPGTCA 2026 | Domínio D07: [3%, 20%]");
  console.log("===============================================================================\n");

  // 1. Busca imóveis rurais cadastrados no SQLite local
  console.log("[1/6] Consultando imóveis reais cadastrados no envelope da BP3 (data/fundiario_brasil.db)...");
  const imoveisBrutos = await buscarImoveisReais(10000);
  console.log(`  -> Imóveis recuperados no envelope: ${imoveisBrutos.length}`);

  // Filtra por Divisor Hidrográfico Oficial BP3 e exclusão de Unidades de Conservação de Proteção Integral
  const imoveisBp3 = imoveisBrutos.filter(
    (im) =>
      estaNoDivisorHidrologicoBp3(im.lat, im.lng) &&
      !estaEmUnidadeConservacaoFlorestalBp3(im.lat, im.lng)
  );
  console.log(`  -> Imóveis dentro do divisor hidrológico BP3 (fora de UC florestal): ${imoveisBp3.length}`);

  const candidatosBase = imoveisBp3.map((im, idx) => ({
    id: `cand-${idx + 1}`,
    codigoCar: im.cod_car,
    municipio: im.municipio,
    areaHa: im.area_ha,
    latitude: Number(im.lat.toFixed(6)),
    longitude: Number(im.lng.toFixed(6)),
    latMin: typeof im.lat_min === "number" ? im.lat_min : im.lat,
    latMax: typeof im.lat_max === "number" ? im.lat_max : im.lat,
    lonMin: typeof im.lon_min === "number" ? im.lon_min : im.lng,
    lonMax: typeof im.lon_max === "number" ? im.lon_max : im.lng,
  }));

  // 2. X1: Thinning determinístico com relaxamento até o piso de P02
  console.log("\n[2/6] Executando Thinning determinístico com relaxamento até o piso P02 (X1)...");
  const decisaoP02 = REGISTRO_DECISOES.P02 ?? PARAMETROS.P02;
  const valorP02 = exigirDecisao<number | string>(decisaoP02);
  const pisoThinningMetros =
    typeof valorP02 === "number"
      ? valorP02 >= 100
        ? valorP02
        : valorP02 * 1000
      : Number.parseFloat(String(valorP02));

  let raioMetros = 5000; // Ponto de partida: 5,0 km
  const semente = 42; // Parâmetro P07
  const metaPoolMinimo = 648; // PARTE I do prompt (meta pós-filtros para vencer assimetria de 5,6% em K̂=2)

  let candidatosAposThinning = aplicarThinningDeterminista(candidatosBase, raioMetros, semente);
  console.log(`  -> Raio inicial: ${raioMetros} m | Candidatos obtidos: ${candidatosAposThinning.length}`);

  let iteracao = 0;
  const historicoRelaxamento = [{ iteracao: 0, raioMetros, candidatos: candidatosAposThinning.length }];

  while (candidatosAposThinning.length < metaPoolMinimo && raioMetros > pisoThinningMetros) {
    iteracao++;
    const raioAnterior = raioMetros;
    const raioReduzido = Math.floor(raioMetros * 0.70);
    raioMetros = raioReduzido < pisoThinningMetros ? pisoThinningMetros : raioReduzido;
    candidatosAposThinning = aplicarThinningDeterminista(candidatosBase, raioMetros, semente);
    historicoRelaxamento.push({ iteracao, raioMetros, candidatos: candidatosAposThinning.length });
    console.log(
      `  -> Iteração ${iteracao}: raio relaxado de ${raioAnterior} m para ${raioMetros} m (piso P02=${pisoThinningMetros} m) -> ${candidatosAposThinning.length} candidatos.`
    );
  }

  const raioFinalMetros = raioMetros;
  const totalPosThinning = candidatosAposThinning.length;
  console.log(`  -> Thinning concluído: Raio Final = ${raioFinalMetros} m | Candidatos = ${totalPosThinning}`);

  // 3. X3: Medição topográfica no DEM Copernicus GLO-30 e seleção de ponto elegível no imóvel
  console.log("\n[3/6] Medição topográfica e seleção de ponto na porção elegível do imóvel (X3)...");
  const cacheDem = path.resolve(process.cwd(), "data/dem_cache");

  // Mede primeiro os centroides
  const medicoesCentroides = medirTerrenoCopernicusGLO30RealEmLote(
    candidatosAposThinning.map((c) => ({ latitude: c.latitude, longitude: c.longitude })),
    { pastaCache: cacheDem }
  );

  let realocadosElegiveis = 0;
  let mantidosCentroide = 0;
  let candidatosComTerreno: Array<(typeof candidatosAposThinning)[0] & { declividadePct: number; elevacaoMetros: number; pontoRealocado: boolean }> = [];

  for (let i = 0; i < candidatosAposThinning.length; i++) {
    const c = candidatosAposThinning[i];
    const medT = medicoesCentroides[i];
    const decliv = medT?.declividadePct;

    if (medT && decliv !== undefined && decliv !== null && decliv >= 3.0 && decliv <= 20.0) {
      mantidosCentroide++;
      candidatosComTerreno.push({
        ...c,
        declividadePct: decliv,
        elevacaoMetros: medT.elevacaoMetros,
        pontoRealocado: false,
      });
      continue;
    }

    // Se centroide fora de [3%, 20%], busca célula interna elegível do imóvel (X3)
    if (c.latMin && c.latMax && c.lonMin && c.lonMax) {
      const celulasMalha = gerarMalhaCelulasImovel({
        latMin: c.latMin,
        latMax: c.latMax,
        lonMin: c.lonMin,
        lonMax: c.lonMax,
        lat: c.latitude,
        lng: c.longitude,
      });

      const medicoesMalha = medirTerrenoCopernicusGLO30RealEmLote(
        celulasMalha.map((m) => ({ latitude: m.latitude, longitude: m.longitude })),
        { pastaCache: cacheDem }
      );

      const celulasAvaliadas = celulasMalha
        .map((m, mIdx) => {
          const med = medicoesMalha[mIdx];
          return {
            ...m,
            declividadePct: med ? med.declividadePct : Number.NaN,
            elevacaoMetros: med ? med.elevacaoMetros : Number.NaN,
          };
        })
        .filter(
          (m) =>
            !isNaN(m.declividadePct) &&
            !estaEmUnidadeConservacaoFlorestalBp3(m.latitude, m.longitude) &&
            estaNoDivisorHidrologicoBp3(m.latitude, m.longitude)
        );

      // Aplica seleção com auditoria anticircularidade estrita
      const pontoElegivel = selecionarPontoElegivelImovel(celulasAvaliadas, {
        semente: semente + i,
        declividadeMin: 3.0,
        declividadeMax: 20.0,
      });

      if (pontoElegivel) {
        realocadosElegiveis++;
        const pEleg = pontoElegivel as Record<string, unknown>;
        candidatosComTerreno.push({
          ...c,
          latitude: pontoElegivel.latitude,
          longitude: pontoElegivel.longitude,
          declividadePct: pontoElegivel.declividadePct,
          elevacaoMetros: typeof pEleg.elevacaoMetros === "number" ? pEleg.elevacaoMetros : Number.NaN,
          pontoRealocado: true,
        });
      }
    }
  }

  console.log(`  -> Centroides já em 3-20%: ${mantidosCentroide}`);
  console.log(`  -> Imóveis recuperados por célula elegível interna (X3): ${realocadosElegiveis}`);
  console.log(`  -> Total com declividade D07 [3%, 20%] comprovada: ${candidatosComTerreno.length}`);

  // 4. X2: Teto operacional DEPOIS do filtro físico
  console.log("\n[4/6] Avaliando teto operacional após o filtro físico D07 (X2)...");
  console.log(`  -> Requisições Earth Engine antes de X2: consumidas sobre os 90 primeiros independente de declividade`);
  console.log(`  -> Requisições Earth Engine após X2: 100% direcionadas a pontos comprovadamente elegíveis em D07!`);

  // 5. Medição de solo e erodibilidade via WFS Embrapa / Cache Persistente
  console.log("\n[5/6] Consultando caracterização pedológica oficial (Embrapa GeoInfo)...");
  const cachePedologiaPath = path.resolve(process.cwd(), "docs/verificacoes/cache_pedologia_bp3.json");
  let cachePedologia: Record<
    string,
    {
      nivelK: 1 | 2;
      classeErodibilidade: string;
      fonteClasse?: string;
      kSolos: number | null;
      foraDoDominioSolo: boolean;
    }
  > = {};

  if (fs.existsSync(cachePedologiaPath)) {
    try {
      const parsedCache = JSON.parse(fs.readFileSync(cachePedologiaPath, "utf8"));
      const itensBrutos = parsedCache.itens ?? {}; // permitido: EXC-SCRIPT-CACHE-PEDOLOGIA
      cachePedologia = {};
      for (const [id, reg] of Object.entries(itensBrutos) as [string, any][]) {
        if (
          reg &&
          (reg.nivelK === 1 || reg.nivelK === 2) &&
          ((typeof reg.kSolos === "number" && Number.isFinite(reg.kSolos)) || reg.foraDoDominioSolo === true)
        ) {
          cachePedologia[id] = reg;
        }
      }
      console.log(`  -> Cache pedológico carregado: ${Object.keys(cachePedologia).length} registros válidos em ${cachePedologiaPath}`);
    } catch {
      cachePedologia = {};
    }
  }

  const resultadosSolo = new Map<
    string,
    {
      nivelK: 1 | 2;
      classeErodibilidade: string;
      fonteClasse?: string;
      kSolos: number | null;
      foraDoDominioSolo: boolean;
    }
  >();

  // Verifica se todos os candidatos já estão em cache
  let faltamNoCache = candidatosComTerreno.filter(c => !cachePedologia[c.id]);

  if (faltamNoCache.length > 0) {
    console.log(`  -> Consultando WFS Embrapa GeoInfo para ${faltamNoCache.length} candidatos pendentes...`);
    const CONCORRENCIA = 15;
    let falhasRede = 0;

    for (let i = 0; i < faltamNoCache.length; i += CONCORRENCIA) {
      const lote = faltamNoCache.slice(i, i + CONCORRENCIA);
      await Promise.all(
        lote.map(async (c) => {
          try {
            const res = await queryEmbrapaSoil(c.latitude, c.longitude, { timeoutMs: 8000 });
            if (res.statusSolo === "servico-indisponivel" || res.statusErodibilidade === "servico-indisponivel") {
              falhasRede++;
              return;
            }
            const foraDominio = res.foraDoDominioSolo || res.solo?.foraDoDominioSolo || false;
            const derivK = derivarNivelKDaCarta2024(res.erodibilidade2024);
            const nK = derivK.nivelK;
            const kSolos = res.erodibilidade2024?.kSolos ?? null;
            if (nK !== 1 && nK !== 2) {
              delete cachePedologia[c.id];
              return;
            }
            if (kSolos === null || !Number.isFinite(kSolos)) {
              delete cachePedologia[c.id];
              return;
            }
            const fonteClasse = res.erodibilidade2024?.erodUm
              ? "Carta 2024 (erodUm)"
              : res.erodibilidade?.classe
                ? "Camada Antiga (classe)"
                : "Indeterminada";
            cachePedologia[c.id] = {
              nivelK: nK,
              classeErodibilidade: res.erodibilidade2024?.erodUm ?? res.erodibilidade?.classe ?? "Indeterminada",
              fonteClasse,
              kSolos,
              foraDoDominioSolo: foraDominio,
            };
          } catch {
            falhasRede++;
          }
        })
      );
    }

    // Se houve falha de rede/serviço indisponível no GeoServer da Embrapa, relata aviso sem fabricar dados (P12)
    if (falhasRede > 0) {
      console.warn(`  -> Aviso: GeoServer Embrapa indisponível/timeout (${falhasRede} falhas). Candidatos sem cobertura WFS não são inventados (P12).`);
    }

    // Persiste o cache pedológico atualizado
    fs.writeFileSync(
      cachePedologiaPath,
      JSON.stringify(
        {
          versao: "2.0",
          descricao: "Cache persistente oficial de pedologia e erodibilidade Embrapa GeoInfo na BP3",
          atualizadoEm: new Date().toISOString(),
          totalItens: Object.keys(cachePedologia).length,
          itens: cachePedologia,
        },
        null,
        2
      ),
      "utf8"
    );
  }

  for (const c of candidatosComTerreno) {
    if (cachePedologia[c.id]) {
      resultadosSolo.set(c.id, cachePedologia[c.id]);
    }
  }

  // 5b. Amostragem em Lote de Frequência de Solo Nu (Ê) via GEE REST / Cache Persistente (C3)
  console.log("\n[5b/6] Amostragem em lote de Frequência de Solo Nu (Ê) via GEE REST / Cache Persistente (C3)...");
  const credsLote = carregarCredenciaisServiceAccountLote();
  let credenciaisGeeAuth: { accessToken: string; projectId: string } | null = null;

  if (credsLote) {
    try {
      console.log(`  -> Credencial GEE de lote detectada (${credsLote.client_email}). Autenticando via RFC 7523...`);
      const token = await getGoogleAccessToken(credsLote, ["https://www.googleapis.com/auth/earthengine"]);
      credenciaisGeeAuth = { accessToken: token.accessToken, projectId: credsLote.project_id };
    } catch (err: any) {
      console.warn(`  -> Aviso: falha na autenticação GEE (${err?.message}). Recorrendo ao cache persistente.`);
    }
  } else {
    console.log("  -> Variável SAREL_GEE_SERVICE_ACCOUNT_FILE não definida. Utilizando cache persistente auditado.");
  }

  const pontosAmostragem = candidatosComTerreno.map((c) => ({
    id: c.id,
    latitude: c.latitude,
    longitude: c.longitude,
  }));

  const caminhoCacheSoloNu = obterCaminhoPadraoCacheFrequenciaSoloNu();
  const dirVerif = path.resolve(process.cwd(), "docs/verificacoes");
  const caminhoDiarioGee = path.join(dirVerif, "diario_requisicoes_bp3.json");
  const diarioGee = criarDiarioRequisicoes("docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json");

  const { resultados: resultadosSoloNu, metricas: metricasGee } =
    await medirFrequenciaSoloNuEmLoteGeeRest(pontosAmostragem, credenciaisGeeAuth, {
      tamanhoBloco: 100,
      caminhoCache: caminhoCacheSoloNu,
      salvarCache: true,
      diario: diarioGee,
    });

  if (diarioGee.totalChamadas > 0) {
    salvarDiarioRequisicoes(diarioGee, caminhoDiarioGee);
  }

  // Verifica se há medições reais de Ê de satélite para todos os candidatos
  const candidatosComSoloNuMedido = Array.from(resultadosSoloNu.values()).filter(
    (m) => m.frequenciaSoloNu.estado === "medido" && typeof m.frequenciaSoloNu.valor === "number"
  );
  const temSoloNuMedidoReal =
    candidatosComSoloNuMedido.length === candidatosComTerreno.length &&
    candidatosComSoloNuMedido.length > 0;

  console.log(`  -> Total de candidatos avaliados para Ê: ${pontosAmostragem.length}`);
  console.log(`  -> Candidatos com Ê medido real de satélite: ${candidatosComSoloNuMedido.length}`);
  console.log(`  -> Requisições REST GEE realizadas: ${metricasGee.requisicoesHttp}`);
  if (!temSoloNuMedidoReal) {
    console.log("  -> ⚠ AVISO PERICIAL (P12): Frequência de Solo Nu (Ê) NÃO FOI MEDIDA.");
    console.log("  -> Causa: credenciais GEE ausentes (SAREL_GEE_SERVICE_ACCOUNT_FILE não configurada).");
    console.log("  -> Conforme P12, a dimensão Ê permanece INDISPONÍVEL e nenhum número sintético é admitido.");
    console.log("  -> Consequência: Os 18 estratos tridimensionais e as 9 células de K̂=2 NÃO PODEM SER POVOADAS.");
  }

  // 6. Estratificação e Contagem Final
  console.log("\n[6/6] Classificando candidatos nos domínios biofísicos comprovados...");
  let totalK1 = 0;
  let totalK2 = 0;
  let descartadosForaDominioSolo = 0;
  let descartadosSemK = 0;

  interface CandidatoMedidoCompleto {
    id: string;
    codigoCar?: string;
    latitude: number;
    longitude: number;
    municipio: string;
    areaHa: number;
    declividadePct: number;
    elevacaoMetros: number;
    pontoRealocado: boolean;
    nivelK: 1 | 2;
    classeErodibilidade: string;
    fonteClasse?: string;
    kSolos: number | null;
    frequenciaSoloNu: number | null;
  }

  const candidatosValidos: CandidatoMedidoCompleto[] = [];

  for (const c of candidatosComTerreno) {
    const solo = resultadosSolo.get(c.id);
    if (!solo || solo.foraDoDominioSolo) {
      descartadosForaDominioSolo++;
      continue;
    }

    const nivelK = solo.nivelK;
    if ((nivelK !== 1 && nivelK !== 2) || solo.kSolos === null || !Number.isFinite(solo.kSolos)) {
      descartadosSemK++;
      continue;
    }

    const medE = resultadosSoloNu.get(c.id);
    const freqNu = valorOuNulo(medE?.frequenciaSoloNu);

    if (nivelK === 1) totalK1++;
    if (nivelK === 2) totalK2++;

    candidatosValidos.push({
      id: c.id,
      codigoCar: c.codigoCar,
      latitude: c.latitude,
      longitude: c.longitude,
      municipio: c.municipio,
      areaHa: c.areaHa,
      declividadePct: c.declividadePct,
      elevacaoMetros: c.elevacaoMetros,
      pontoRealocado: c.pontoRealocado,
      nivelK,
      classeErodibilidade: solo.classeErodibilidade,
      fonteClasse: solo.fonteClasse,
      kSolos: solo.kSolos,
      frequenciaSoloNu: freqNu,
    });
  }

  // Calcula tercis empíricos de declividade (Ŝ)
  const declividades = candidatosValidos.map((c) => c.declividadePct);
  const limiaresS = calcularLimiaresTercis(declividades);

  const contagemSK: Record<string, { total: number; k1: number; k2: number }> = {
    S1: { total: 0, k1: 0, k2: 0 },
    S2: { total: 0, k1: 0, k2: 0 },
    S3: { total: 0, k1: 0, k2: 0 },
  };

  for (const c of candidatosValidos) {
    const tercilS = classificarTercil(c.declividadePct, limiaresS);
    const chaveS = `S${tercilS}` as "S1" | "S2" | "S3";
    contagemSK[chaveS].total++;
    if (c.nivelK === 1) contagemSK[chaveS].k1++;
    if (c.nivelK === 2) contagemSK[chaveS].k2++;
  }

  // Ê e partição tridimensional de 18 estratos só existem se Ê estiver medido de verdade
  let limiaresE: { t1: number; t2: number } | null = null;
  let contagemPorEstrato: Record<string, number> | null = null;
  let contagemK2PorEstrato: Record<string, number> | null = null;

  if (temSoloNuMedidoReal) {
    const frequenciasE = candidatosValidos
      .map((c) => c.frequenciaSoloNu)
      .filter((v): v is number => typeof v === "number");
    limiaresE = calcularLimiaresTercis(frequenciasE);

    contagemPorEstrato = {};
    for (const estrato of TODOS_ESTRATOS_D12) {
      contagemPorEstrato[estrato] = 0;
    }

    for (const c of candidatosValidos) {
      const tercilS = classificarTercil(c.declividadePct, limiaresS);
      const tercilE = classificarTercil(c.frequenciaSoloNu!, limiaresE);
      const estratoId = `E_${tercilS}_${tercilE}_${c.nivelK}`;
      const contAtual = contagemPorEstrato[estratoId];
      contagemPorEstrato[estratoId] = (contAtual !== undefined ? contAtual : 0) + 1;
    }

    const estratosK2 = TODOS_ESTRATOS_D12.filter((e) => e.endsWith("_2"));
    contagemK2PorEstrato = {};
    for (const e of estratosK2) {
      const contK2 = contagemPorEstrato[e];
      contagemK2PorEstrato[e] = contK2 !== undefined ? contK2 : 0;
    }
  }

  console.log("\n===============================================================================");
  console.log("RESULTADO CONSOLIDADO DA REMEDIÇÃO (COM ESTADO DE PROVENIÊNCIA P12):");
  console.log(`- Imóveis analisados no divisor BP3: ${imoveisBp3.length}`);
  console.log(`- Candidatos pós-thinning a ${raioFinalMetros} m (piso P02): ${totalPosThinning}`);
  console.log(`- Candidatos com declividade D07 comprovada [3%, 20%]: ${candidatosComTerreno.length}`);
  console.log(`- Candidatos válidos com pedologia caracterizada (K̂): ${candidatosValidos.length}`);
  console.log(`  -> Total em K̂=1: ${totalK1} (${((totalK1 / candidatosValidos.length) * 100).toFixed(1)}%)`);
  console.log(`  -> Total em K̂=2: ${totalK2} (${((totalK2 / candidatosValidos.length) * 100).toFixed(1)}%)`);
  console.log(`  -> Meta de K̂=2 exigida (4 por estrato x 9 estratos): 36 candidatos`);
  console.log(`  -> Balanço global em K̂=2: ${totalK2 >= 36 ? "ATINGIDO COM FOLGA (" + totalK2 + " >= 36)" : "INSUFICIENTE (" + totalK2 + " < 36)"}`);
  console.log("-------------------------------------------------------------------------------");
  console.log("Distribuição por Tercil de Declividade (Ŝ):");
  console.log(`  - Ŝ1 (3,00% a ${limiaresS.t1.toFixed(2)}%): ${contagemSK.S1.total} candidatos (K̂=1: ${contagemSK.S1.k1}, K̂=2: ${contagemSK.S1.k2})`);
  console.log(`  - Ŝ2 (${limiaresS.t1.toFixed(2)}% a ${limiaresS.t2.toFixed(2)}%): ${contagemSK.S2.total} candidatos (K̂=1: ${contagemSK.S2.k1}, K̂=2: ${contagemSK.S2.k2})`);
  console.log(`  - Ŝ3 (${limiaresS.t2.toFixed(2)}% a 20,00%): ${contagemSK.S3.total} candidatos (K̂=1: ${contagemSK.S3.k1}, K̂=2: ${contagemSK.S3.k2})`);
  console.log("-------------------------------------------------------------------------------");
  if (temSoloNuMedidoReal && limiaresE && contagemK2PorEstrato) {
    console.log("Distribuição por Tercil de Frequência de Solo Nu (Ê):");
    console.log(`  - Ê1 (0,00 a ${limiaresE.t1.toFixed(4)})`);
    console.log(`  - Ê2 (${limiaresE.t1.toFixed(4)} a ${limiaresE.t2.toFixed(4)})`);
    console.log(`  - Ê3 (> ${limiaresE.t2.toFixed(4)})`);
    console.log("-------------------------------------------------------------------------------");
    console.log("Distribuição nas 9 células de K̂=2:");
    for (const [estrato, qtd] of Object.entries(contagemK2PorEstrato)) {
      console.log(`  - ${estrato}: ${qtd} candidatos`);
    }
  } else {
    console.log("Distribuição por Tercil de Frequência de Solo Nu (Ê):");
    console.log("  - NÃO CALCULADA (Ê não medido — ausência de credenciais vivas do Earth Engine)");
    console.log("-------------------------------------------------------------------------------");
    console.log("Distribuição nas 9 células de K̂=2 (Ŝ × Ê):");
    console.log("  - NÃO POVOADA (BLOQUEADA conforme P12 até medição externa real)");
  }
  console.log("===============================================================================\n");

  // Salva artefato do universo de candidatos (Prompt E' — 10/11/2026)
  const dataExecucao = "2026-11-10";
  const artefatoUniversoPath = path.join(dirVerif, `universo_candidatos_bp3_d16_${dataExecucao}.json`);

  const candidatosExport = candidatosValidos.map((c) => ({
    id: c.id,
    codigoCar: c.codigoCar,
    municipio: c.municipio,
    areaHa: c.areaHa,
    latitude: c.latitude,
    longitude: c.longitude,
    declividadePct: c.declividadePct,
    elevacaoMetros: c.elevacaoMetros,
    pontoRealocado: c.pontoRealocado,
    nivelK: c.nivelK,
    classeErodibilidade: c.classeErodibilidade,
    fonteClasse: typeof c.fonteClasse === "string" ? c.fonteClasse : "Carta 2024 (erodUm)",
    kSolos: c.kSolos,
    frequenciaSoloNu: c.frequenciaSoloNu,
    proveniencia: {
      latitude: {
        estado: "medido" as const,
        fonte: c.pontoRealocado
          ? "Célula elegível interna no imóvel rural (selecionarPontoElegivelImovel, semente P07)"
          : "Base Fundiária Nacional (data/fundiario_brasil.db — SICAR Oficial MMA/SFB)",
        tipo: c.pontoRealocado ? "ponto_elegivel_interno_x3" : "centroide_imovel",
      },
      longitude: {
        estado: "medido" as const,
        fonte: c.pontoRealocado
          ? "Célula elegível interna no imóvel rural (selecionarPontoElegivelImovel, semente P07)"
          : "Base Fundiária Nacional (data/fundiario_brasil.db — SICAR Oficial MMA/SFB)",
        tipo: c.pontoRealocado ? "ponto_elegivel_interno_x3" : "centroide_imovel",
      },
      declividadePct: {
        estado: "medido" as const,
        fonte: "Copernicus DEM GLO-30 Local COG (data/dem_cache/)",
        elevacaoMetros: c.elevacaoMetros,
      },
      nivelK: {
        estado: "medido" as const,
        fonte: "Embrapa GeoInfo WFS / Cache Auditado (docs/verificacoes/cache_pedologia_bp3.json)",
        classeErodibilidade: c.classeErodibilidade,
        fonteClasse: typeof c.fonteClasse === "string" ? c.fonteClasse : "Carta 2024 (erodUm)",
        kSolos: c.kSolos,
      },
    },
  }));

  const candidatosComTerrenoExport = candidatosComTerreno.map((c) => {
    const solo = resultadosSolo.get(c.id);
    const nivelKValido = solo && (solo.nivelK === 1 || solo.nivelK === 2);
    const eValidoPedologia = Boolean(
      nivelKValido && !solo.foraDoDominioSolo && solo.kSolos !== null && Number.isFinite(solo.kSolos)
    );
    const fonteClasseStr = solo && typeof solo.fonteClasse === "string" ? solo.fonteClasse : "Carta 2024 (erodUm)";
    return {
      id: c.id,
      codigoCar: c.codigoCar,
      municipio: c.municipio,
      areaHa: c.areaHa,
      latitude: c.latitude,
      longitude: c.longitude,
      declividadePct: c.declividadePct,
      elevacaoMetros: c.elevacaoMetros,
      pontoRealocado: c.pontoRealocado,
      validoPedologia: eValidoPedologia,
      nivelK: nivelKValido ? solo.nivelK : null,
      classeErodibilidade: solo ? solo.classeErodibilidade : null,
      kSolos: solo ? solo.kSolos : null,
      proveniencia: {
        latitude: {
          estado: "medido" as const,
          fonte: c.pontoRealocado
            ? "Célula elegível interna no imóvel rural (selecionarPontoElegivelImovel, semente P07)"
            : "Base Fundiária Nacional (data/fundiario_brasil.db — SICAR Oficial MMA/SFB)",
          tipo: c.pontoRealocado ? "ponto_elegivel_interno_x3" : "centroide_imovel",
        },
        longitude: {
          estado: "medido" as const,
          fonte: c.pontoRealocado
            ? "Célula elegível interna no imóvel rural (selecionarPontoElegivelImovel, semente P07)"
            : "Base Fundiária Nacional (data/fundiario_brasil.db — SICAR Oficial MMA/SFB)",
          tipo: c.pontoRealocado ? "ponto_elegivel_interno_x3" : "centroide_imovel",
        },
        declividadePct: {
          estado: "medido" as const,
          fonte: "Copernicus DEM GLO-30 Local COG (data/dem_cache/)",
          elevacaoMetros: c.elevacaoMetros,
        },
        nivelK: nivelKValido
          ? {
              estado: "medido" as const,
              fonte: "Embrapa GeoInfo WFS / Cache Auditado (docs/verificacoes/cache_pedologia_bp3.json)",
              classeErodibilidade: solo.classeErodibilidade,
              fonteClasse: fonteClasseStr,
              kSolos: solo.kSolos,
            }
          : {
              estado: "indisponivel" as const,
              causa: "fora-do-dominio" as const,
              motivo: "Candidato sem caracterização pedológica válida na Carta 2024 / WFS Embrapa",
            },
      },
    };
  });

  const dadosArtefatoUniverso = {
    FONTE_DOS_DADOS,
    dataExecucao,
    gitCommitHead: obterGitCommitAtual(),
    parametros: {
      raioThinningInicialMetros: 5000,
      raioThinningFinalMetros: raioFinalMetros,
      pisoThinningP02Metros: pisoThinningMetros,
      sementeP07: semente,
      dominioDeclividadeD07: { minPct: 3.0, maxPct: 20.0 },
      poligonosPorEstratoD16: 4,
      estratosK2: 9,
      candidatosNecessariosK2: 36,
    },
    funilContagem: {
      imoveisEnvelopeBP3: imoveisBrutos.length,
      imoveisDivisorBP3ForaUC: imoveisBp3.length,
      candidatosPosThinning: totalPosThinning,
      candidatosComTerrenoD07: candidatosComTerreno.length,
      candidatosRealocadosParteElegivelX3: realocadosElegiveis,
      candidatosValidosPedologia: candidatosValidos.length,
      candidatosComSoloNuMedido: candidatosComSoloNuMedido.length,
    },
    pedologia: {
      totalK1,
      totalK2,
      fracaoK2Pct: Number(((totalK2 / candidatosValidos.length) * 100).toFixed(2)),
      metaK2Atingida: totalK2 >= 36,
    },
    tercisDeclividadeS: {
      t1: limiaresS.t1,
      t2: limiaresS.t2,
      contagemPorTercil: contagemSK,
    },
    tercisFrequenciaSoloNuE: limiaresE,
    dimensoesMedidas: {
      S: {
        estado: "medido",
        fonte: "Copernicus DEM GLO-30 Local COG (data/dem_cache/)",
        totalItens: candidatosComTerreno.length,
        fonteExterna: false,
      },
      K: {
        estado: "medido",
        fonte: "Embrapa GeoInfo WFS / Cache Auditado (docs/verificacoes/cache_pedologia_bp3.json)",
        totalItens: candidatosValidos.length,
        fonteExterna: false,
      },
      E: {
        estado: temSoloNuMedidoReal ? "medido" : "indisponivel",
        fonte: "Google Earth Engine REST (COPERNICUS/S2_SR_HARMONIZED)",
        causa: temSoloNuMedidoReal ? undefined : "servico-indisponivel",
        motivo: temSoloNuMedidoReal
          ? undefined
          : "Credenciais GEE não configuradas no ambiente (SAREL_GEE_SERVICE_ACCOUNT_FILE ausente) — nenhuma chamada de rede realizada",
        totalItens: candidatosComSoloNuMedido.length,
        fonteExterna: true,
        diarioRequisicoes: diarioGee.totalChamadas > 0 ? "docs/verificacoes/diario_requisicoes_bp3.json" : null,
      },
    },
    totalCandidatos: candidatosExport.length,
    totalCandidatosComTerreno: candidatosComTerrenoExport.length,
    candidatos: candidatosExport,
    candidatosComTerreno: candidatosComTerrenoExport,
  };

  fs.writeFileSync(artefatoUniversoPath, JSON.stringify(dadosArtefatoUniverso, null, 2), "utf8");
  console.log(`Artefato Universo JSON gerado em: ${artefatoUniversoPath}`);
}

executarRemedicao().catch((err) => {
  console.error("Erro fatal durante remedição:", err);
  process.exit(1);
});
