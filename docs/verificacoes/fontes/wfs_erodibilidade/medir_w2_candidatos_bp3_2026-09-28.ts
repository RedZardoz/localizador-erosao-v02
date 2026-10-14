/**
 * ============================================================================
 * Medição Empírica de W1, W2 e W3 sobre o Conjunto Real de Candidatos da BP3
 * SAREL v2.0 — Opção A (Decisões D08 e D12 emendadas em 28/09/2026)
 * ============================================================================
 */

import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import {
  estaNoDivisorHidrologicoBp3,
  estaEmUnidadeConservacaoFlorestalBp3,
} from "@/lib/localizacao/bacias";
import { aplicarThinningDeterminista } from "@/lib/gee/thinning";
import { medirTerrenoCopernicusEmLote } from "@/lib/gee/copernicusGeeClient";
import {
  queryEmbrapaSoil,
  derivarNivelKDaCarta2024,
  verificarSanidadeZeroFeicoesLoteEmbrapa,
} from "@/lib/embrapa/embrapaSoilClient";
import {
  TODOS_ESTRATOS_D12,
  calcularLimiaresTercis,
  classificarTercil,
} from "@/lib/gee/estratificacao";
import { verificarPreCondicoesSorteioD16 } from "@/lib/gee/sorteioPoligonos";

interface ImovelRealDb {
  cod_car: string;
  municipio: string;
  lat: number;
  lng: number;
  area_ha: number;
  nome_imovel?: string;
  fonte?: string;
}

interface CandidatoRealPython {
  id: string;
  latitude: number;
  longitude: number;
  codigoCar: string;
  nomeImovel: string;
  municipio: string;
  areaHa: number;
  fonteCar: string;
}

function consultarCandidatosReaisPython(
  bbox: { minLat: number; minLon: number; maxLat: number; maxLon: number },
  limite: number
): Promise<CandidatoRealPython[]> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "query_real_properties.py");
    const args = [
      scriptPath,
      String(bbox.minLon),
      String(bbox.minLat),
      String(bbox.maxLon),
      String(bbox.maxLat),
      String(limite),
    ];

    execFile(
      "python",
      args,
      { timeout: 45000, maxBuffer: 15 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          return reject(error);
        }
        try {
          const parsed: ImovelRealDb[] = JSON.parse(stdout);
          const lista = Array.isArray(parsed) ? parsed : [];
          resolve(
            lista.map((im, idx) => ({
              id: `cand-${idx + 1}`,
              latitude: Number(im.lat.toFixed(6)),
              longitude: Number(im.lng.toFixed(6)),
              codigoCar: im.cod_car || "",
              nomeImovel: im.nome_imovel || "",
              municipio: im.municipio || "",
              areaHa: typeof im.area_ha === "number" ? im.area_ha : 0,
              fonteCar: im.fonte || "SICAR Oficial (MMA/SFB)",
            }))
          );
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

async function executarMedicaoW2(): Promise<void> {
  const bboxBp3 = { minLat: -25.6, minLon: -54.62, maxLat: -24.05, maxLon: -53.35 };
  console.log("[1/5] Extraindo candidatos reais de imóveis rurais (SICAR/SNCR) na Bacia do Paraná 3...");
  const candidatosBrutos = await consultarCandidatosReaisPython(bboxBp3, 1200);

  const candidatosPreThinning = candidatosBrutos
    .filter(
      (c) =>
        estaNoDivisorHidrologicoBp3(c.latitude, c.longitude) &&
        !estaEmUnidadeConservacaoFlorestalBp3(c.latitude, c.longitude)
    )
    .map((c, idx) => ({ ...c, id: `cand-${idx + 1}` }));

  const semente = 42;
  const maxCandidatos = 90;
  const raioThinningMetros = 500;
  const candidatosAposThinning = aplicarThinningDeterminista(
    candidatosPreThinning,
    raioThinningMetros,
    semente
  );
  const poolEfetivo = candidatosAposThinning.slice(0, maxCandidatos);

  console.log(
    `  -> Brutos BBOX: ${candidatosBrutos.length} | Dentro do divisor hidrográfico BP3 (fora de UC): ${candidatosPreThinning.length} | Pool pós-thinning (500m, semente=42): ${poolEfetivo.length}`
  );

  console.log("[2/5] Medindo declividade real (Ŝ) via Copernicus DEM GLO-30 (30m)...");
  const medicoesTerreno = await medirTerrenoCopernicusEmLote(
    poolEfetivo.map((c) => ({ latitude: c.latitude, longitude: c.longitude }))
  );

  console.log("[3/5] Consultando WFS 1.1.0 Embrapa GeoServer (parana_solos_20201105 + bra_erodibilidade_2024_sirgas2000) por candidato...");
  const resultadosSolo = new Map<string, Awaited<ReturnType<typeof queryEmbrapaSoil>>>();
  const CONCORRENCIA = 10;
  for (let i = 0; i < poolEfetivo.length; i += CONCORRENCIA) {
    const lote = poolEfetivo.slice(i, i + CONCORRENCIA);
    await Promise.all(
      lote.map(async (c) => {
        const res = await queryEmbrapaSoil(c.latitude, c.longitude, { timeoutMs: 12000 });
        resultadosSolo.set(c.id, res);
      })
    );
  }

  const listaResultadosEmbrapa = Array.from(resultadosSolo.values());
  verificarSanidadeZeroFeicoesLoteEmbrapa(listaResultadosEmbrapa);

  // Analisar resultados de cada candidato
  const declividadeMin = 3;
  const declividadeMax = 45;

  interface RegistroCandidatoMedido {
    id: string;
    latitude: number;
    longitude: number;
    municipio: string;
    declividadePct: number | null;
    elegivelDeclividadeD07: boolean;
    sbcsEstadual: string | null;
    tipoUnidaEstadual: string | null;
    codUm2024: string | null;
    codUm2_2024: string | null;
    ogcFid2024: number | null;
    erodUm2024: string | null;
    erodC1_2024: string | null;
    erodC2_2024: string | null;
    erodC3_2024: string | null;
    erodC4_2024: string | null;
    kSolos2024: number | null;
    kSolosBruto2024: number | null;
    nivelK: 1 | 2 | null;
    retiradoCategoriaNaoPedologica: boolean;
    motivoRetiradaNaoPedologica: string | null;
    kAmbiguoAssociacao: true | false | "indisponivel";
    ramoAmbiguidadeD08: string | null;
    frequenciaSoloNu: null;
    classeWorldCover2020: null;
    classeWorldCover2021: null;
  }

  const registros: RegistroCandidatoMedido[] = [];

  for (let idx = 0; idx < poolEfetivo.length; idx++) {
    const c = poolEfetivo[idx];
    const medT = medicoesTerreno[idx] ?? null;
    const medS = resultadosSolo.get(c.id) ?? null;
    const derivK = derivarNivelKDaCarta2024(medS?.erodibilidade2024);

    const decliv = medT ? medT.declividadePct : null;
    const elegivelDecliv =
      decliv !== null && decliv >= declividadeMin && decliv <= declividadeMax;

    const retiradoNaoPedologico =
      medS?.foraDoDominioSolo === true ||
      medS?.solo?.foraDoDominioSolo === true ||
      (derivK.provenienciaNivelK.estado === "indisponivel" &&
        derivK.provenienciaNivelK.causa === "fora-do-dominio");

    const motivoNaoPedologico = retiradoNaoPedologico
      ? derivK.provenienciaNivelK.estado === "indisponivel"
        ? derivK.provenienciaNivelK.motivo
        : medS?.motivo ?? "Fora do domínio pedológico"
      : null;

    const sbcs = medS?.solo?.sbcs ?? null;
    const tipoUnida = medS?.solo?.tipoUnidade ?? null;
    const erod2024 = medS?.erodibilidade2024 ?? null;

    registros.push({
      id: c.id,
      latitude: c.latitude,
      longitude: c.longitude,
      municipio: c.municipio,
      declividadePct: decliv,
      elegivelDeclividadeD07: elegivelDecliv,
      sbcsEstadual: sbcs,
      tipoUnidaEstadual: tipoUnida,
      codUm2024: erod2024?.codUm ?? null,
      codUm2_2024: erod2024?.codUm2 ?? null,
      ogcFid2024: erod2024?.ogcFid ?? null,
      erodUm2024: erod2024?.erodUm ?? null,
      erodC1_2024: erod2024?.erodComponentes?.[0] ?? null,
      erodC2_2024: erod2024?.erodComponentes?.[1] ?? null,
      erodC3_2024: erod2024?.erodComponentes?.[2] ?? null,
      erodC4_2024: erod2024?.erodComponentes?.[3] ?? null,
      kSolos2024: erod2024?.kSolos ?? null,
      kSolosBruto2024: erod2024?.kSolosBruto ?? null,
      nivelK: retiradoNaoPedologico ? null : derivK.nivelK,
      retiradoCategoriaNaoPedologica: retiradoNaoPedologico,
      motivoRetiradaNaoPedologica: motivoNaoPedologico,
      kAmbiguoAssociacao: medS?.solo?.kAmbiguoAssociacao ?? "indisponivel",
      ramoAmbiguidadeD08: medS?.solo?.ramoAmbiguidadeD08 ?? null,
      frequenciaSoloNu: null,
      classeWorldCover2020: null,
      classeWorldCover2021: null,
    });
  }

  // Contagens sobre o pool de 90 candidatos pós-thinning
  const retiradosNaoPedologicosPool90 = registros.filter(
    (r) => r.retiradoCategoriaNaoPedologica
  );
  const nivelK1Pool90 = registros.filter(
    (r) => !r.retiradoCategoriaNaoPedologica && r.nivelK === 1
  ).length;
  const nivelK2Pool90 = registros.filter(
    (r) => !r.retiradoCategoriaNaoPedologica && r.nivelK === 2
  ).length;
  const semNivelKPool90 = registros.filter(
    (r) => !r.retiradoCategoriaNaoPedologica && r.nivelK === null
  ).length;

  // Subconjunto elegível em declividade [3%, 45%] (mesmo filtro de select-candidates/route.ts)
  const poolElegivelDeclividade = registros.filter((r) => r.elegivelDeclividadeD07);
  const retiradosNaoPedologicosDeclivElegivel = poolElegivelDeclividade.filter(
    (r) => r.retiradoCategoriaNaoPedologica
  );
  const candidatosValidosSK = poolElegivelDeclividade.filter(
    (r) =>
      !r.retiradoCategoriaNaoPedologica &&
      (r.nivelK === 1 || r.nivelK === 2) &&
      typeof r.declividadePct === "number"
  );

  const nivelK1Elegivel = candidatosValidosSK.filter((r) => r.nivelK === 1).length;
  const nivelK2Elegivel = candidatosValidosSK.filter((r) => r.nivelK === 2).length;

  // Dispersão intra-unidade estadual (sbcs em parana_solos_20201105)
  const construirDispersaoSbcs = (lista: RegistroCandidatoMedido[]) => {
    const mapaSbcs = new Map<
      string,
      {
        sbcs: string;
        tipoUnida: string | null;
        nCandidatos: number;
        nNivelK1: number;
        nNivelK2: number;
        nRetiradosNaoPedologico: number;
        niveisKObservados: number[];
        codUm2Observados: string[];
        erodUmObservados: string[];
        kAmbiguoTrue: number;
        kAmbiguoFalse: number;
        kAmbiguoIndisponivel: number;
      }
    >();

    for (const r of lista) {
      const chave = r.sbcsEstadual ?? "(sem_sbcs)";
      if (!mapaSbcs.has(chave)) {
        mapaSbcs.set(chave, {
          sbcs: chave,
          tipoUnida: r.tipoUnidaEstadual,
          nCandidatos: 0,
          nNivelK1: 0,
          nNivelK2: 0,
          nRetiradosNaoPedologico: 0,
          niveisKObservados: [],
          codUm2Observados: [],
          erodUmObservados: [],
          kAmbiguoTrue: 0,
          kAmbiguoFalse: 0,
          kAmbiguoIndisponivel: 0,
        });
      }
      const item = mapaSbcs.get(chave)!;
      item.nCandidatos += 1;
      if (r.retiradoCategoriaNaoPedologica) {
        item.nRetiradosNaoPedologico += 1;
      } else if (r.nivelK === 1) {
        item.nNivelK1 += 1;
        if (!item.niveisKObservados.includes(1)) item.niveisKObservados.push(1);
      } else if (r.nivelK === 2) {
        item.nNivelK2 += 1;
        if (!item.niveisKObservados.includes(2)) item.niveisKObservados.push(2);
      }
      if (r.codUm2_2024 && !item.codUm2Observados.includes(r.codUm2_2024)) {
        item.codUm2Observados.push(r.codUm2_2024);
      }
      if (r.erodUm2024 && !item.erodUmObservados.includes(r.erodUm2024)) {
        item.erodUmObservados.push(r.erodUm2024);
      }
      if (r.kAmbiguoAssociacao === true) item.kAmbiguoTrue += 1;
      else if (r.kAmbiguoAssociacao === false) item.kAmbiguoFalse += 1;
      else item.kAmbiguoIndisponivel += 1;
    }

    const unidades = Array.from(mapaSbcs.values()).map((u) => ({
      ...u,
      niveisKObservados: u.niveisKObservados.sort((a, b) => a - b),
      possuiMaisDeUmNivelK: u.niveisKObservados.length > 1,
    }));
    unidades.sort((a, b) => b.nCandidatos - a.nCandidatos || a.sbcs.localeCompare(b.sbcs));
    return {
      totalUnidadesSbcsDistintas: unidades.length,
      unidadesComMaisDeUmNivelK: unidades.filter((u) => u.possuiMaisDeUmNivelK).length,
      listaSbcsComMaisDeUmNivelK: unidades
        .filter((u) => u.possuiMaisDeUmNivelK)
        .map((u) => u.sbcs),
      detalhamentoPorSbcs: unidades,
    };
  };

  const dispersaoSbcsPool90 = construirDispersaoSbcs(registros);
  const dispersaoSbcsElegiveisSK = construirDispersaoSbcs(candidatosValidosSK);

  // Tercis de Ŝ (Copernicus DEM GLO-30) sobre candidatosValidosSK
  const limiaresS = calcularLimiaresTercis(
    candidatosValidosSK.map((r) => r.declividadePct as number)
  );

  const marginaisSK: Record<string, number> = {
    S_1_K_1: 0,
    S_1_K_2: 0,
    S_2_K_1: 0,
    S_2_K_2: 0,
    S_3_K_1: 0,
    S_3_K_2: 0,
  };

  for (const r of candidatosValidosSK) {
    const tS = classificarTercil(r.declividadePct as number, limiaresS);
    const chave = `S_${tS}_K_${r.nivelK}`;
    marginaisSK[chave] = (marginaisSK[chave] ?? 0) + 1;
  }

  // Distribuição dos 18 estratos (E_1_1_1 .. E_3_3_2)
  // Como frequenciaSoloNu (Ê) depende de extração Sentinel-2 no GEE (credenciais OAuth2 ausentes no ambiente local),
  // nenhum candidato tem frequenciaSoloNu fabricada (P1 / P12: frequenciaSoloNu = null -> indisponivel('nao-calculado')).
  // Portanto, a contagem direta de candidatos completos nos 18 estratos sem GEE é 0 em cada estrato,
  // e para cada estrato E_{s}_{e}_{k} registramos também a capacidade marginal medida N(S_s, K_k) = soma_{e=1..3} N(E_{s}_{e}_{k}).
  const tabela18Estratos = TODOS_ESTRATOS_D12.map((estratoId) => {
    const partes = estratoId.split("_"); // ["E", s, e, k]
    const s = Number(partes[1]) as 1 | 2 | 3;
    const e = Number(partes[2]) as 1 | 2 | 3;
    const k = Number(partes[3]) as 1 | 2;
    const chaveMarginal = `S_${s}_K_${k}`;
    const nMarginalSK = marginaisSK[chaveMarginal] ?? 0;
    return {
      estratoId,
      tercilS: s,
      tercilE: e,
      nivelK: k,
      contagemCandidatosComS2MedidoLocal: 0,
      contagemMarginalMedida_S_x_K: nMarginalSK,
      cotaMediaEsperadaPorEstratoSeUniformeEmE: Number((nMarginalSK / 3).toFixed(2)),
      viabilidadeEstruturalMarginal_N_SK_ge_6: nMarginalSK >= 6,
    };
  });

  // Executar verificarPreCondicoesSorteioD16 sobre os registros reais (sem fabricar Ê nem WorldCover)
  const relatorioPreCondicoesReais = verificarPreCondicoesSorteioD16(
    registros.map((r) => ({
      id: r.id,
      latitude: r.latitude,
      longitude: r.longitude,
      declividadePct: r.declividadePct ?? NaN,
      frequenciaSoloNu: NaN,
      nivelK: (r.nivelK ?? 1) as 1 | 2,
      classeWorldCover2020: r.classeWorldCover2020,
      classeWorldCover2021: r.classeWorldCover2021,
      kAmbiguoAssociacao: r.kAmbiguoAssociacao,
      unidadeDeterminanteK2024: r.codUm2024
        ? {
            codUm: r.codUm2024,
            codUm2: r.codUm2_2024 ?? "",
            ogcFid: r.ogcFid2024,
            erodUm: r.erodUm2024 ?? "",
            kSolos: r.kSolos2024,
            kSolosBruto: r.kSolosBruto2024,
            nivelK: r.nivelK,
          }
        : null,
    })),
    { lancarErro: false }
  );

  // Contagens dos 3 estados de kAmbiguoAssociacao (W3)
  const contagemKAmbiguoPool90 = {
    true: registros.filter((r) => r.kAmbiguoAssociacao === true).length,
    false: registros.filter((r) => r.kAmbiguoAssociacao === false).length,
    indisponivel: registros.filter((r) => r.kAmbiguoAssociacao === "indisponivel").length,
    porRamoD08: {
      ramo_a_2_ou_mais_componentes_2024: registros.filter(
        (r) => r.ramoAmbiguidadeD08 === "ramo-a-tabelado-multiplos-componentes"
      ).length,
      ramo_a_true_atravessa_fronteira_d09: registros.filter(
        (r) =>
          r.ramoAmbiguidadeD08 === "ramo-a-tabelado-multiplos-componentes" &&
          r.kAmbiguoAssociacao === true
      ).length,
      ramo_a_false_mesmo_lado_fronteira_d09: registros.filter(
        (r) =>
          r.ramoAmbiguidadeD08 === "ramo-a-tabelado-multiplos-componentes" &&
          r.kAmbiguoAssociacao === false
      ).length,
      ramo_b_1_componente_2024_associacao_estadual: registros.filter(
        (r) => r.ramoAmbiguidadeD08 === "ramo-b-indisponivel-generalizacao-1-componente"
      ).length,
      unidade_simples_estadual: registros.filter(
        (r) => r.ramoAmbiguidadeD08 === "unidade-simples-1-componente"
      ).length,
      fora_do_dominio_nao_solo: registros.filter(
        (r) => r.ramoAmbiguidadeD08 === "fora-do-dominio"
      ).length,
      sem_camada_2024_ou_fronteira: registros.filter(
        (r) => r.ramoAmbiguidadeD08 === "sem-camada-2024" || r.ramoAmbiguidadeD08 === null
      ).length,
    },
  };

  const artefato = {
    metadados: {
      geradoEm: new Date().toISOString(),
      scriptGerador:
        "docs/verificacoes/fontes/wfs_erodibilidade/medir_w2_candidatos_bp3_2026-09-28.ts",
      bancoFundiario: "data/fundiario_brasil.db (SICAR/SNCR Bacia do Paraná 3)",
      sementeThinning: semente,
      raioThinningMetros,
      maxCandidatosThinning: maxCandidatos,
      fontesAoVivoConsultadas: [
        "Embrapa GeoServer WFS 1.1.0 (geonode:parana_solos_20201105, geonode:bra_erodibilidade_2024_sirgas2000, geonode:brasil_erodibilidade_solo)",
        "Copernicus DEM GLO-30 (30m) via Open-Meteo Elevation API",
      ],
      statusCredenciaisGeeSentinel2WorldCover:
        "indisponivel('nao-calculado') — ambiente local sem credenciais OAuth2 Service Account do Google Earth Engine (.env/.env.local ausentes). Em conformidade estrita com P1 e P12, frequenciaSoloNu (Ê) e classeWorldCover2020/2021 NÃO foram fabricados nem interpolados.",
    },
    resumoUniversoCandidatos: {
      imoveisBrutosBboxBp3: candidatosBrutos.length,
      imoveisNoDivisorHidrograficoForaUc: candidatosPreThinning.length,
      candidatosPosThinningGeodesico: poolEfetivo.length,
      candidatosRetiradosCategoriaNaoPedologica_Pool90:
        retiradosNaoPedologicosPool90.length,
      detalheCandidatosRetiradosNaoPedologicos_Pool90: retiradosNaoPedologicosPool90.map(
        (r) => ({
          id: r.id,
          latitude: r.latitude,
          longitude: r.longitude,
          municipio: r.municipio,
          sbcsEstadual: r.sbcsEstadual,
          codUm2_2024: r.codUm2_2024,
          ogcFid2024: r.ogcFid2024,
          erodUm2024: r.erodUm2024,
          kSolosBruto2024: r.kSolosBruto2024,
          motivo: r.motivoRetiradaNaoPedologica,
        })
      ),
      contagemPorNivelK_Pool90: {
        nivelK_1: nivelK1Pool90,
        nivelK_2: nivelK2Pool90,
        retiradosCategoriaNaoPedologica: retiradosNaoPedologicosPool90.length,
        semNivelKOutros: semNivelKPool90,
      },
      filtroDeclividadeD07_3a45pct: {
        candidatosComDeclividadeEm3a45pct: poolElegivelDeclividade.length,
        candidatosForaDe3a45pct: registros.length - poolElegivelDeclividade.length,
        retiradosCategoriaNaoPedologicaDentroDe3a45pct:
          retiradosNaoPedologicosDeclivElegivel.length,
        candidatosElegiveisComS_e_K_Medidos: candidatosValidosSK.length,
        contagemPorNivelK_ElegiveisSK: {
          nivelK_1: nivelK1Elegivel,
          nivelK_2: nivelK2Elegivel,
        },
        limiaresTercisDeclividadePct: limiaresS,
      },
      contagemEstadosKAmbiguoD08_Pool90: contagemKAmbiguoPool90,
    },
    dispersaoIntraUnidadeEstadualSbcs: {
      sobrePool90Candidatos: dispersaoSbcsPool90,
      sobreCandidatosElegiveisSK: dispersaoSbcsElegiveisSK,
    },
    distribuicaoMarginal_S_x_K_Elegiveis: marginaisSK,
    distribuicao18Estratos_W2: tabela18Estratos,
    verificacaoPreCondicoesSorteioD16_CandidatosReaisSemGee: {
      aprovado: relatorioPreCondicoesReais.aprovado,
      condicaoFalha: relatorioPreCondicoesReais.condicaoFalha,
      motivoFalha: relatorioPreCondicoesReais.motivoFalha,
      estratosDeficientes: relatorioPreCondicoesReais.estratosDeficientes,
    },
    candidatosMedidos: registros,
  };

  const outJsonPath = path.join(
    process.cwd(),
    "docs",
    "verificacoes",
    "fontes",
    "wfs_erodibilidade",
    "medicao_w2_candidatos_bp3_2026-09-28.json"
  );
  fs.writeFileSync(outJsonPath, JSON.stringify(artefato, null, 2), "utf-8");
  console.log(`[4/5] Artefato JSON gravado em: ${outJsonPath}`);

  // Gerar relatório Markdown diretamente do JSON (para colagem literal sem digitação manual)
  const mdLines: string[] = [];
  mdLines.push(
    `# Medição Empírica W2 sobre o Conjunto de Candidatos da Bacia do Paraná 3 (28/09/2026)`
  );
  mdLines.push(``);
  mdLines.push(`- **Artefato JSON fonte:** \`docs/verificacoes/fontes/wfs_erodibilidade/medicao_w2_candidatos_bp3_2026-09-28.json\``);
  mdLines.push(`- **Script gerador:** \`docs/verificacoes/fontes/wfs_erodibilidade/medir_w2_candidatos_bp3_2026-09-28.ts\``);
  mdLines.push(`- **Pool de candidatos reais (SICAR/SNCR pós-thinning 500 m, semente=42):** \`${artefato.resumoUniversoCandidatos.candidatosPosThinningGeodesico}\` candidatos (de \`${artefato.resumoUniversoCandidatos.imoveisNoDivisorHidrograficoForaUc}\` imóveis no divisor hidrográfico da BP3 fora de UCs florestais).`);
  mdLines.push(``);
  mdLines.push(`## 1. Contagem por Nível de K̂ (\`1\` vs \`2\`) e Retirados por Categoria Não-Pedológica`);
  mdLines.push(``);
  mdLines.push(`| Universo Analisado | Total | Nível K̂ = 1 (\`Baixa\`/\`Muito baixa\`/\`Média\`) | Nível K̂ = 2 (\`Alta\`/\`Muito alta\`/\`Extremamente alta\`) | Retirados por Categoria Não-Pedológica (\`fora-do-dominio\`) |`);
  mdLines.push(`|---|---:|---:|---:|---:|`);
  mdLines.push(
    `| Pool pós-thinning completo (BP3) | ${artefato.resumoUniversoCandidatos.candidatosPosThinningGeodesico} | ${artefato.resumoUniversoCandidatos.contagemPorNivelK_Pool90.nivelK_1} | ${artefato.resumoUniversoCandidatos.contagemPorNivelK_Pool90.nivelK_2} | ${artefato.resumoUniversoCandidatos.contagemPorNivelK_Pool90.retiradosCategoriaNaoPedologica} |`
  );
  mdLines.push(
    `| Candidatos com declividade D07 elegível ($S \\in [3\\%, 45\\%]$) | ${artefato.resumoUniversoCandidatos.filtroDeclividadeD07_3a45pct.candidatosComDeclividadeEm3a45pct} | ${artefato.resumoUniversoCandidatos.filtroDeclividadeD07_3a45pct.contagemPorNivelK_ElegiveisSK.nivelK_1} | ${artefato.resumoUniversoCandidatos.filtroDeclividadeD07_3a45pct.contagemPorNivelK_ElegiveisSK.nivelK_2} | ${artefato.resumoUniversoCandidatos.filtroDeclividadeD07_3a45pct.retiradosCategoriaNaoPedologicaDentroDe3a45pct} |`
  );
  mdLines.push(``);
  mdLines.push(`## 2. Contagem dos 3 Estados de \`kAmbiguoAssociacao\` (\`W1\` / \`W3\`) sobre o Pool de 90 Candidatos`);
  mdLines.push(``);
  mdLines.push(`| Estado de \`kAmbiguoAssociacao\` | Contagem | Detalhamento por Ramo de \`D08\` |`);
  mdLines.push(`|---|---:|---|`);
  mdLines.push(`| \`true\` | ${contagemKAmbiguoPool90.true} | Ramo (a) (\`>= 2\` componentes em \`erod_c1..erod_c4\` cruzando a fronteira de D09: ${contagemKAmbiguoPool90.porRamoD08.ramo_a_true_atravessa_fronteira_d09}) |`);
  mdLines.push(`| \`false\` | ${contagemKAmbiguoPool90.false} | Ramo (a) do mesmo lado (${contagemKAmbiguoPool90.porRamoD08.ramo_a_false_mesmo_lado_fronteira_d09}) + Unidade simples estadual (${contagemKAmbiguoPool90.porRamoD08.unidade_simples_estadual}) |`);
  mdLines.push(`| \`"indisponivel"\` | ${contagemKAmbiguoPool90.indisponivel} | Ramo (b): 1 componente em 2024 sobre \`associacao\` estadual (${contagemKAmbiguoPool90.porRamoD08.ramo_b_1_componente_2024_associacao_estadual}) + Fora do domínio/fronteira exata (${contagemKAmbiguoPool90.porRamoD08.fora_do_dominio_nao_solo + contagemKAmbiguoPool90.porRamoD08.sem_camada_2024_ou_fronteira}) |`);
  mdLines.push(``);
  mdLines.push(`## 3. Dispersão Intra-Unidade Estadual (\`sbcs\` em \`parana_solos_20201105\`)`);
  mdLines.push(``);
  mdLines.push(`- **Unidades estaduais distintas (\`sbcs\`) no pool de 90 candidatos:** \`${dispersaoSbcsPool90.totalUnidadesSbcsDistintas}\``);
  mdLines.push(`- **Unidades \`sbcs\` que aparecem com mais de um nível de K̂ (\`[1, 2]\`) no pool de 90 candidatos:** \`${dispersaoSbcsPool90.unidadesComMaisDeUmNivelK}\` (${dispersaoSbcsPool90.listaSbcsComMaisDeUmNivelK.length > 0 ? dispersaoSbcsPool90.listaSbcsComMaisDeUmNivelK.map((s) => `\`${s}\``).join(", ") : "nenhuma"})`);
  mdLines.push(`- **Unidades \`sbcs\` que aparecem com mais de um nível de K̂ (\`[1, 2]\`) nos candidatos elegíveis ($S \\in [3\\%, 45\\%]$):** \`${dispersaoSbcsElegiveisSK.unidadesComMaisDeUmNivelK}\` (${dispersaoSbcsElegiveisSK.listaSbcsComMaisDeUmNivelK.length > 0 ? dispersaoSbcsElegiveisSK.listaSbcsComMaisDeUmNivelK.map((s) => `\`${s}\``).join(", ") : "nenhuma"})`);
  mdLines.push(``);
  mdLines.push(`| \`sbcs\` (\`parana_solos_20201105\`) | \`tipo_unida\` | Candidatos (Pool 90) | Nível K̂ = 1 | Nível K̂ = 2 | Retirados Não-Solo | Níveis K̂ Observados | \`cod_um2\` (2024) Observados | \`erod_um\` (2024) Observados | \`kAmbiguo\` (\`true\`/\`false\`/\`indisp\`) |`);
  mdLines.push(`|---|---|---:|---:|---:|---:|---|---|---|---|`);
  for (const u of dispersaoSbcsPool90.detalhamentoPorSbcs) {
    mdLines.push(
      `| \`${u.sbcs}\` | \`${u.tipoUnida ?? "n/d"}\` | ${u.nCandidatos} | ${u.nNivelK1} | ${u.nNivelK2} | ${u.nRetiradosNaoPedologico} | \`[${u.niveisKObservados.join(", ")}]\` | ${u.codUm2Observados.map((c) => `\`${c}\``).join(", ") || "—"} | ${u.erodUmObservados.map((e) => `\`${e}\``).join(", ") || "—"} | ${u.kAmbiguoTrue} / ${u.kAmbiguoFalse} / ${u.kAmbiguoIndisponivel} |`
    );
  }
  mdLines.push(``);
  mdLines.push(`## 4. Distribuição dos 18 Estratos (\`E_1_1_1\` .. \`E_3_3_2\`) e Marginais Medidas $(\\hat{S} \\times \\hat{K})$`);
  mdLines.push(``);
  mdLines.push(`| Estrato (\`D12\`) | Tercil $\\hat{S}$ | Tercil $\\hat{E}$ | Nível $\\hat{K}$ | Contagem Local (sem GEE: $\\hat{E}$ \`indisponivel\`) | Capacidade Marginal Medida $N(\\text{Tercil }\\hat{S}, \\text{Nível }\\hat{K}) = \\sum_{e=1}^{3} N(E_{s,e,k})$ | Média Esperada por Estrato ($N_{s,k}/3$) | Viabilidade Marginal ($N_{s,k} \\ge 6$ para $\\ge 2$/estrato) |`);
  mdLines.push(`|---|---:|---:|---:|---:|---:|---:|---|`);
  for (const row of tabela18Estratos) {
    mdLines.push(
      `| \`${row.estratoId}\` | ${row.tercilS} | ${row.tercilE} | ${row.nivelK} | ${row.contagemCandidatosComS2MedidoLocal} | ${row.contagemMarginalMedida_S_x_K} | ${row.cotaMediaEsperadaPorEstratoSeUniformeEmE.toFixed(2)} | ${row.viabilidadeEstruturalMarginal_N_SK_ge_6 ? "SIM (>= 6)" : "NÃO (< 6 — estrato K=" + row.nivelK + " insuficiente)"} |`
    );
  }
  mdLines.push(``);

  const outMdPath = path.join(
    process.cwd(),
    "docs",
    "verificacoes",
    "fontes",
    "wfs_erodibilidade",
    "medicao_w2_candidatos_bp3_2026-09-28.md"
  );
  fs.writeFileSync(outMdPath, mdLines.join("\n"), "utf-8");
  console.log(`[5/5] Relatório Markdown gerado diretamente do JSON em: ${outMdPath}`);
}

executarMedicaoW2().catch((err) => {
  console.error("Erro fatal na medição W2:", err);
  process.exit(1);
});
