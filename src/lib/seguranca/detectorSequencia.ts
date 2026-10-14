/**
 * ============================================================================
 * Detector de Sequência Monotônica e Correlação Espúria com Índice (Guarda F5)
 * SAREL v2.0 — Disciplina Pericial PPGTCA 2026
 * ============================================================================
 *
 * REGRA INVIOLÁVEL:
 * Medições biofísicas de campo (terreno, pedologia, solo nu, reflectância)
 * NÃO se correlacionam fortemente com a ordem de gravação no arquivo ou índice
 * sequencial da lista (|r| > 0,95).
 *
 * Uma correlação com o índice superior a 0,95 em séries com N >= 10 é indício
 * pericial inequívoco de fabricação algorítmica por contador monotônico ou PRNG
 * indexado por loop for (idx).
 */

import fs from "fs";
import path from "path";

export interface ViolacaoSequencia {
  arquivo: string;
  propriedade: string;
  correlacao: number;
  totalElementos: number;
  totalDistintos: number;
  motivo: string;
}

/**
 * Calcula o coeficiente de correlação de Pearson r(X, Y) entre dois vetores.
 */
export function calcularCorrelacaoPearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n < 2) return 0;

  let somaX = 0;
  let somaY = 0;
  for (let i = 0; i < n; i++) {
    somaX += x[i];
    somaY += y[i];
  }
  const mediaX = somaX / n;
  const mediaY = somaY / n;

  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mediaX;
    const dy = y[i] - mediaY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }

  const denom = Math.sqrt(varX * varY);
  if (denom === 0 || !Number.isFinite(denom)) return 0;

  const r = cov / denom;
  return Number.isFinite(r) ? r : 0;
}

export const LIMIAR_PADRAO_CORRELACAO = 0.95;
export const MINIMO_AMOSTRAS_PADRAO = 10;

/**
 * Avalia se uma série numérica apresenta correlação linear com a sua posição/índice.
 */
export function avaliarCorrelacaoComIndice(
  valores: number[],
  limiarCorrelacao?: number,
  minimoAmostras?: number
): { correlacao: number; suspeito: boolean; nValores: number; nDistintos: number } {
  const limiar = typeof limiarCorrelacao === "number" ? limiarCorrelacao : LIMIAR_PADRAO_CORRELACAO;
  const minAmostras = typeof minimoAmostras === "number" ? minimoAmostras : MINIMO_AMOSTRAS_PADRAO;

  if (valores.length < minAmostras) {
    return { correlacao: 0, suspeito: false, nValores: valores.length, nDistintos: new Set(valores).size };
  }

  const indices = valores.map((_, i) => i);
  const nDistintos = new Set(valores).size;

  // Se todos os valores forem idênticos (constante pura), variância é 0
  if (nDistintos <= 1) {
    return { correlacao: 0, suspeito: false, nValores: valores.length, nDistintos };
  }

  const r = calcularCorrelacaoPearson(indices, valores);
  const suspeito = Math.abs(r) > limiar;

  return {
    correlacao: Number(r.toFixed(4)),
    suspeito,
    nValores: valores.length,
    nDistintos,
  };
}

/**
 * Extrai séries numéricas de estruturas JSON complexas (arrays de números, arrays de objetos
 * ou dicionários indexados) e varre a correlação de cada campo numérico com a ordem de aparição.
 */
export function analisarEstruturaParaSequencias(
  dado: unknown,
  caminhoArquivo: string = "artefato.json",
  limiar?: number
): ViolacaoSequencia[] {
  const limiarEfetivo = typeof limiar === "number" ? limiar : LIMIAR_PADRAO_CORRELACAO;
  const violacoes: ViolacaoSequencia[] = [];

  function inspecionarSerie(caminhoProp: string, serie: number[]) {
    if (serie.length < 10) return;
    const res = avaliarCorrelacaoComIndice(serie, limiarEfetivo);

    if (res.suspeito) {
      violacoes.push({
        arquivo: caminhoArquivo,
        propriedade: caminhoProp,
        correlacao: res.correlacao,
        totalElementos: res.nValores,
        totalDistintos: res.nDistintos,
        motivo: `Série correlacionada com índice (|r| = ${res.correlacao} > ${limiar}) sobre ${res.nValores} elementos (${res.nDistintos} distintos). Indício de contador ou gerador monotônico artificial.`,
      });
    }
  }

  function visitar(no: any, rota: string) {
    if (!no || typeof no !== "object") return;

    if (Array.isArray(no)) {
      // Caso 1: Array de números primitivos
      if (no.every((v) => typeof v === "number")) {
        inspecionarSerie(rota, no as number[]);
      } else if (no.every((v) => typeof v === "object" && v !== null)) {
        // Caso 2: Array de objetos -> extrai colunas numéricas
        const chaves = new Set<string>();
        for (const item of no) {
          Object.keys(item).forEach((k) => chaves.add(k));
        }

        for (const chave of chaves) {
          const serie: number[] = [];
          let todosValidos = true;
          for (const item of no) {
            const v = item[chave];
            if (typeof v === "number" && Number.isFinite(v)) {
              serie.push(v);
            } else if (v && typeof v === "object" && typeof v.valor === "number") {
              serie.push(v.valor);
            } else {
              todosValidos = false;
              break;
            }
          }
          if (todosValidos && serie.length >= 10) {
            inspecionarSerie(`${rota}[].${chave}`, serie);
          }
        }
      }
    } else {
      // Caso 3: Dicionário/Objeto com propriedades internas
      // Se for um mapa de itens como cache (ex: itens: { "cand-1": { frequenciaSoloNu: 0.07 }, ... })
      const chaves = Object.keys(no);
      if (chaves.length >= 10 && chaves.every((k) => typeof no[k] === "object" && no[k] !== null)) {
        const subChaves = new Set<string>();
        for (const k of chaves) {
          Object.keys(no[k]).forEach((sk) => subChaves.add(sk));
        }

        for (const sk of subChaves) {
          const serie: number[] = [];
          for (const k of chaves) {
            const item = no[k];
            const v = item?.[sk];
            if (typeof v === "number" && Number.isFinite(v)) {
              serie.push(v);
            } else if (v && typeof v === "object" && typeof v.valor === "number") {
              serie.push(v.valor);
            }
          }
          if (serie.length === chaves.length && serie.length >= 10) {
            inspecionarSerie(`${rota}.${sk}`, serie);
          }
        }
      }

      // Continua busca recursiva em nós filhos
      for (const [k, v] of Object.entries(no)) {
        visitar(v, rota ? `${rota}.${k}` : k);
      }
    }
  }

  visitar(dado, "");
  return violacoes;
}

/**
 * Varre um arquivo JSON em disco em busca de sequências artificiais monotônicas.
 */
export function varrerArquivoJsonParaSequencias(
  caminhoArquivo: string,
  limiar?: number
): ViolacaoSequencia[] {
  const limiarEfetivo = typeof limiar === "number" ? limiar : LIMIAR_PADRAO_CORRELACAO;
  if (!fs.existsSync(caminhoArquivo) || !caminhoArquivo.endsWith(".json")) {
    return [];
  }
  try {
    const raw = fs.readFileSync(caminhoArquivo, "utf8");
    const json = JSON.parse(raw);
    return analisarEstruturaParaSequencias(json, caminhoArquivo, limiarEfetivo);
  } catch {
    return [];
  }
}

/**
 * Varre todos os arquivos JSON em um diretório recursivamente.
 */
export function varrerDiretorioParaSequencias(
  diretorio: string,
  limiar?: number
): ViolacaoSequencia[] {
  const limiarEfetivo = typeof limiar === "number" ? limiar : LIMIAR_PADRAO_CORRELACAO;
  if (!fs.existsSync(diretorio)) return [];


  const violacoes: ViolacaoSequencia[] = [];
  const entries = fs.readdirSync(diretorio, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(diretorio, entry.name);
    if (entry.isDirectory()) {
      violacoes.push(...varrerDiretorioParaSequencias(fullPath, limiar));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      violacoes.push(...varrerArquivoJsonParaSequencias(fullPath, limiar));
    }
  }

  return violacoes;
}
