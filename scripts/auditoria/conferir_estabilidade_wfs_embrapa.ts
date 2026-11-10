/**
 * ============================================================================
 * Conferência de Estabilidade do WFS Embrapa GeoInfo por Amostragem
 * SAREL v2.0 — Auditoria Metodológica (Prompt F — 10/11/2026)
 * ============================================================================
 *
 * Sorteia deterministicamente 30 dos 677 candidatos de BP3 (D16) e reconsulta
 * o WFS ao vivo (sem cache) para testar a estabilidade da fonte externa
 * contra docs/verificacoes/cache_pedologia_bp3.json.
 *
 * NUNCA escreve no cache — estritamente leitura e comparação pericial.
 */

import fs from "fs";
import path from "path";
import { criarPrng } from "@/lib/gee/estratificacao";
import {
  queryEmbrapaSoil,
  derivarNivelKDaCarta2024,
} from "@/lib/embrapa/embrapaSoilClient";

export const FONTE_DOS_DADOS =
  "Embrapa GeoInfo OGC WFS 1.1.0 (geonode:bra_erodibilidade_2024_sirgas2000, geonode:parana_solos_20201105) vs docs/verificacoes/cache_pedologia_bp3.json";

export const SEMENTE_PADRAO = 20261110;
export const TAMANHO_AMOSTRA = 30;

interface CandidatoUniverso {
  id: string;
  latitude: number;
  longitude: number;
  nivelK?: number;
  classeErodibilidade?: string;
  kSolos?: number;
}

interface ItemCachePedologia {
  nivelK: number;
  classeErodibilidade: string;
  kSolos: number;
  foraDoDominioSolo?: boolean;
}

interface Divergencia {
  id: string;
  latitude: number;
  longitude: number;
  campo: string;
  valorCache: any;
  valorWfs: any;
}

interface ResultadoPonto {
  id: string;
  latitude: number;
  longitude: number;
  status: "igual" | "divergente" | "sem_resposta";
  motivoSemResposta?: string;
  cache?: {
    nivelK: number;
    classeErodibilidade: string;
    kSolos: number;
  };
  wfs?: {
    nivelK: number | null;
    classeErodibilidade: string;
    kSolos: number | null;
  };
  divergencias: Divergencia[];
}

export async function executarConferencia(
  semente: number = SEMENTE_PADRAO,
  tamanhoAmostra: number = TAMANHO_AMOSTRA
): Promise<{
  totalAvaliados: number;
  iguais: number;
  divergentes: number;
  semResposta: number;
  resultados: ResultadoPonto[];
}> {
  console.log("===============================================================================");
  console.log("SAREL v2.0 — Auditoria de Estabilidade da Fonte Externa WFS Embrapa GeoInfo");
  console.log(`FONTE_DOS_DADOS: ${FONTE_DOS_DADOS}`);
  console.log(`Semente PRNG: ${semente} | Amostra: ${tamanhoAmostra} pontos de 677`);
  console.log("===============================================================================\n");

  const caminhoUniverso = path.resolve(
    process.cwd(),
    "docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json"
  );
  const caminhoCache = path.resolve(
    process.cwd(),
    "docs/verificacoes/cache_pedologia_bp3.json"
  );

  if (!fs.existsSync(caminhoUniverso)) {
    throw new Error(`Artefato de universo não encontrado: ${caminhoUniverso}`);
  }
  if (!fs.existsSync(caminhoCache)) {
    throw new Error(`Cache de pedologia não encontrado: ${caminhoCache}`);
  }

  const rawUniverso = JSON.parse(fs.readFileSync(caminhoUniverso, "utf-8"));
  const rawCache = JSON.parse(fs.readFileSync(caminhoCache, "utf-8"));

  if (!Array.isArray(rawUniverso.candidatos)) {
    throw new Error("Chave 'candidatos' ausente ou não é array no universo.");
  }
  const candidatos: CandidatoUniverso[] = rawUniverso.candidatos;

  if (!rawCache.itens || typeof rawCache.itens !== "object") {
    throw new Error("Chave 'itens' ausente ou não é objeto no cache.");
  }
  const cacheItens: Record<string, ItemCachePedologia> = rawCache.itens;

  if (candidatos.length === 0) {
    throw new Error("O universo de candidatos está vazio.");
  }

  console.log(`[1/3] Carregados ${candidatos.length} candidatos do universo e ${Object.keys(cacheItens).length} itens do cache.`);

  // Sorteio determinístico Fisher-Yates com criarPrng
  const prng = criarPrng(semente);
  const copia = [...candidatos];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const tmp = copia[i];
    copia[i] = copia[j];
    copia[j] = tmp;
  }
  const amostra = copia.slice(0, tamanhoAmostra);
  console.log(`[2/3] Sorteados ${amostra.length} candidatos com semente ${semente}.`);

  console.log(`[3/3] Consultando WFS ao vivo e comparando com cache (sem alterar cache)...`);
  const resultados: ResultadoPonto[] = [];
  const CONCORRENCIA = 5;

  for (let i = 0; i < amostra.length; i += CONCORRENCIA) {
    const bloco = amostra.slice(i, i + CONCORRENCIA);
    const promessas = bloco.map(async (cand) => {
      const itemCache = cacheItens[cand.id];
      const pontoRes: ResultadoPonto = {
        id: cand.id,
        latitude: cand.latitude,
        longitude: cand.longitude,
        status: "igual",
        cache: itemCache
          ? {
              nivelK: itemCache.nivelK,
              classeErodibilidade: itemCache.classeErodibilidade,
              kSolos: itemCache.kSolos,
            }
          : undefined,
        divergencias: [],
      };

      if (!itemCache) {
        pontoRes.status = "divergente";
        pontoRes.divergencias.push({
          id: cand.id,
          latitude: cand.latitude,
          longitude: cand.longitude,
          campo: "presenca_no_cache",
          valorCache: "ausente",
          valorWfs: "presente_no_universo",
        });
        return pontoRes;
      }

      try {
        const wfsRes = await queryEmbrapaSoil(cand.latitude, cand.longitude, {
          timeoutMs: 15000,
        });

        if (
          wfsRes.statusSolo === "servico-indisponivel" ||
          wfsRes.statusErodibilidade === "servico-indisponivel"
        ) {
          pontoRes.status = "sem_resposta";
          pontoRes.motivoSemResposta = wfsRes.motivo || "Serviço WFS indisponível";
          return pontoRes;
        }

        const derivK = derivarNivelKDaCarta2024(wfsRes.erodibilidade2024);
        const nivelKWfs = derivK.nivelK;
        const classeErodWfs =
          wfsRes.erodibilidade2024?.erodUm ??
          wfsRes.erodibilidade?.classe ??
          "Indeterminada";
        const kSolosWfs = wfsRes.erodibilidade2024?.kSolos ?? null;

        pontoRes.wfs = {
          nivelK: nivelKWfs,
          classeErodibilidade: classeErodWfs,
          kSolos: kSolosWfs,
        };

        const divs: Divergencia[] = [];
        if (nivelKWfs !== itemCache.nivelK) {
          divs.push({
            id: cand.id,
            latitude: cand.latitude,
            longitude: cand.longitude,
            campo: "nivelK",
            valorCache: itemCache.nivelK,
            valorWfs: nivelKWfs,
          });
        }

        if (classeErodWfs.trim().toLowerCase() !== itemCache.classeErodibilidade.trim().toLowerCase()) {
          divs.push({
            id: cand.id,
            latitude: cand.latitude,
            longitude: cand.longitude,
            campo: "classeErodibilidade",
            valorCache: itemCache.classeErodibilidade,
            valorWfs: classeErodWfs,
          });
        }

        const difK =
          kSolosWfs === null
            ? itemCache.kSolos !== null
            : Math.abs(kSolosWfs - itemCache.kSolos) > 1e-5;
        if (difK) {
          divs.push({
            id: cand.id,
            latitude: cand.latitude,
            longitude: cand.longitude,
            campo: "kSolos",
            valorCache: itemCache.kSolos,
            valorWfs: kSolosWfs,
          });
        }

        if (divs.length > 0) {
          pontoRes.status = "divergente";
          pontoRes.divergencias = divs;
        } else {
          pontoRes.status = "igual";
        }

        return pontoRes;
      } catch (err: any) {
        pontoRes.status = "sem_resposta";
        pontoRes.motivoSemResposta = err?.message || String(err);
        return pontoRes;
      }
    });

    const resolvidos = await Promise.all(promessas);
    for (const r of resolvidos) {
      resultados.push(r);
      const icon =
        r.status === "igual"
          ? "[OK]"
          : r.status === "divergente"
          ? "[DIVERGENTE]"
          : "[SEM RESPOSTA]";
      console.log(
        `  ${icon} ${r.id} (${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)}) -> ` +
          `status: ${r.status}${
            r.divergencias.length > 0
              ? ` (${r.divergencias.map((d) => `${d.campo}: cache=${d.valorCache} vs wfs=${d.valorWfs}`).join("; ")})`
              : ""
          }${r.motivoSemResposta ? ` (${r.motivoSemResposta})` : ""}`
      );
    }
  }

  const iguais = resultados.filter((r) => r.status === "igual").length;
  const divergentes = resultados.filter((r) => r.status === "divergente").length;
  const semResposta = resultados.filter((r) => r.status === "sem_resposta").length;

  console.log("\n===============================================================================");
  console.log("RESUMO DA AUDITORIA DE ESTABILIDADE WFS EMBRAPA");
  console.log("===============================================================================");
  console.log(`Total de pontos avaliados: ${resultados.length}`);
  console.log(`  - Iguais:        ${iguais} / ${resultados.length} (${((iguais / resultados.length) * 100).toFixed(1)}%)`);
  console.log(`  - Divergentes:   ${divergentes} / ${resultados.length} (${((divergentes / resultados.length) * 100).toFixed(1)}%)`);
  console.log(`  - Sem resposta:  ${semResposta} / ${resultados.length} (${((semResposta / resultados.length) * 100).toFixed(1)}%)`);
  console.log("===============================================================================\n");

  if (divergentes > 0) {
    console.log("DETALHAMENTO DAS DIVERGÊNCIAS ENCONTRADAS:");
    for (const r of resultados.filter((x) => x.status === "divergente")) {
      console.log(`Candidato ${r.id} (lat: ${r.latitude}, lon: ${r.longitude}):`);
      for (const d of r.divergencias) {
        console.log(`  - Campo '${d.campo}': Cache = ${d.valorCache} | WFS = ${d.valorWfs}`);
      }
    }
  } else {
    console.log("Nenhuma divergência detectada na amostra de 30 pontos.");
  }

  console.log("\nNota Pericial: O arquivo de cache não foi modificado (integridade preservada).");

  return {
    totalAvaliados: resultados.length,
    iguais,
    divergentes,
    semResposta,
    resultados,
  };
}

if (process.argv[1]?.endsWith("conferir_estabilidade_wfs_embrapa.ts") || process.argv[1]?.endsWith("conferir_estabilidade_wfs_embrapa.mjs")) {
  executarConferencia().catch((err) => {
    console.error("Erro fatal na execução da auditoria:", err);
    process.exit(1);
  });
}
