/**
 * ============================================================================
 * Leitor Único do Selo Público de Sorteio D16 — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * FINALIDADE:
 * - Ponto único de verdade para os números do desenho amostral REALIZADO pelo
 *   selo público de sorteio D16 (docs/verificacoes/selo_publico_d16_*.json).
 * - Distingue explicitamente o desenho NOMINAL (72 polígonos, 18 × 4, 361,44 ha,
 *   36 treino + 36 held-out) do desenho REALIZADO (67 polígonos, 336,34 ha,
 *   34 treino + 33 held-out).
 *
 * SALVAGUARDAS INVIOLÁVEIS:
 * 1. Ponto único: nenhum componente da interface lê arquivos de selo diretamente.
 * 2. Validação estrita em execução: o módulo faz import estático do JSON (selo ausente
 *    é erro em compilação, a salvaguarda mais forte); caso o conteúdo presente seja inválido
 *    ou corrompido, devolve estado indisponível ({ disponivel: false, motivo: "..." }) sem inventar números.
 * 3. Pureza de importação: módulo isento de dependências node:* para execução segura
 *    em componentes React ("use client") e no navegador.
 */

import seloPublicoJsonRaw from "../../../docs/verificacoes/selo_publico_d16_2026-11-10.json";
import type { EstratoPublicoD16 } from "./sorteioPoligonosTipos";

/**
 * Desenho Amostral Nominal (pré-sorteio, conforme Decisões D12, D16 e CONFIGURACAO_REGISTRADA_D16).
 */
export const DESENHO_NOMINAL_D16 = {
  totalPoligonos: 72,
  poligonosPorEstrato: 4,
  totalTreino: 36,
  totalHeldOut: 36,
  areaTotalHectares: 361.44,
  areaTotalArredondadaHa: 361,
  totalEstratos: 18,
  areaPoligonoHa: 5.0176,
  areaPoligonoArredondadaHa: 5.02,
  unidadesEfetivasTotais: 1845,
  unidadesEfetivasHeldOut: 923,
  ladoMetros: 224,
  razaoAspectoMaxima: 2.0,
  rotuloCurto: "72 polígonos nominais",
  rotuloCompleto:
    "72 polígonos nominais de 5,02 ha (18 estratos × 4, ~361 ha: 36 treino + 36 held-out)",
  fonte: "DECISOES.D12 / DECISOES.D16 / CONFIGURACAO_REGISTRADA_D16",
} as const;

export type DesenhoAmostralNominalD16 = typeof DESENHO_NOMINAL_D16;

/**
 * Estrutura do desenho amostral realizado quando o selo público está disponível.
 */
export interface DesenhoAmostralRealizadoD16 {
  disponivel: true;
  totalPoligonosSorteados: number;
  totalTreino: number;
  totalHeldOut: number;
  areaTotalHectares: number;
  totalEstratos: number;
  estratosCenso: string[];
  estratosVazios: string[];
  limiaresS: {
    t1: number;
    t2: number;
    nValidos: number;
    nNaoFinitos: number;
    nEmpatesEmT1: number;
    nEmpatesEmT2: number;
  };
  limiaresE: {
    t1: number;
    t2: number;
    nValidos: number;
    nNaoFinitos: number;
    nEmpatesEmT1: number;
    nEmpatesEmT2: number;
  };
  estratos: EstratoPublicoD16[];
  contagemCandidatosPorEstrato: Record<string, number>;
  hashIntegridade: string;
  sha256ConjuntoCandidatos: string;
  sha256SeloCompleto: string;
  semente: number;
  geradoEm: string;
  gitCommit: string;
  versaoEsquema: string;
  invariantesVerificados: string[];
  motivoDeficit: string;
  motivoEstratoVazio: string;
  rotuloCurto: string;
  rotuloCompleto: string;
}

/**
 * Estrutura devolvida quando o selo público não está disponível.
 */
export interface DesenhoAmostralIndisponivelD16 {
  disponivel: false;
  motivo: string;
  totalPoligonosSorteados: null;
  totalTreino: null;
  totalHeldOut: null;
  areaTotalHectares: null;
  totalEstratos: null;
  estratosCenso: null;
  estratosVazios: null;
  limiaresS: null;
  limiaresE: null;
  estratos: null;
  contagemCandidatosPorEstrato: null;
  hashIntegridade: null;
  sha256ConjuntoCandidatos: null;
  sha256SeloCompleto: null;
  semente: null;
  geradoEm: null;
  gitCommit: null;
  versaoEsquema: null;
  invariantesVerificados: null;
  motivoDeficit: null;
  motivoEstratoVazio: null;
  rotuloCurto: string;
  rotuloCompleto: string;
}

export type ResultadoDesenhoRealizadoD16 =
  | DesenhoAmostralRealizadoD16
  | DesenhoAmostralIndisponivelD16;

const MOTIVO_ESTRATO_VAZIO_E_1_3_2 =
  "O estrato E_1_3_2 é vazio (Nh = 0): na bacia BP3 existem apenas 9 candidatos em relevo plano (S ≤ 5,12%) com erodibilidade elevada (K̂=2), e o maior Ê medido entre eles é 0,0331, abaixo do corte do tercil superior de solo exposto (Ê > 0,0490).";

const MOTIVO_DEFICIT_ESTRUTURAL_D16 =
  "Dois estratos com K̂=2 não atingem o piso de 4 polígonos: E_1_2_2 tem 3 candidatos (todos incluídos em censo amostral) e E_1_3_2 tem 0 candidatos (vazio biofísico da bacia), resultando em 67 polígonos realizados frente aos 72 nominais.";

function validarSeloPublicoObjeto(dados: unknown): dados is {
  versaoEsquema: string;
  geradoEm: string;
  semente: number;
  gitCommit: string;
  sha256ConjuntoCandidatos: string;
  hashIntegridade: string;
  sha256SeloCompleto: string;
  totalPoligonosSorteados: number;
  totalTreino: number;
  totalHeldOut: number;
  areaTotalHectares: number;
  limiaresS: {
    t1: number;
    t2: number;
    nValidos: number;
    nNaoFinitos: number;
    nEmpatesEmT1: number;
    nEmpatesEmT2: number;
  };
  limiaresE: {
    t1: number;
    t2: number;
    nValidos: number;
    nNaoFinitos: number;
    nEmpatesEmT1: number;
    nEmpatesEmT2: number;
  };
  contagemCandidatosPorEstrato: Record<string, number>;
  estratosCenso: string[];
  estratosVazios: string[];
  invariantesVerificados: string[];
  estratos: EstratoPublicoD16[];
} {
  if (!dados || typeof dados !== "object") return false;
  const d = dados as Record<string, unknown>;

  if (typeof d.versaoEsquema !== "string") return false;
  if (typeof d.geradoEm !== "string") return false;
  if (typeof d.semente !== "number") return false;
  if (typeof d.gitCommit !== "string") return false;
  if (typeof d.sha256ConjuntoCandidatos !== "string") return false;
  if (typeof d.hashIntegridade !== "string") return false;
  if (typeof d.sha256SeloCompleto !== "string") return false;
  if (typeof d.totalPoligonosSorteados !== "number") return false;
  if (typeof d.totalTreino !== "number") return false;
  if (typeof d.totalHeldOut !== "number") return false;
  if (typeof d.areaTotalHectares !== "number") return false;
  if (!d.limiaresS || typeof d.limiaresS !== "object") return false;
  if (!d.limiaresE || typeof d.limiaresE !== "object") return false;
  if (!d.contagemCandidatosPorEstrato || typeof d.contagemCandidatosPorEstrato !== "object") return false;
  if (!Array.isArray(d.estratosCenso)) return false;
  if (!Array.isArray(d.estratosVazios)) return false;
  if (!Array.isArray(d.invariantesVerificados)) return false;
  if (!Array.isArray(d.estratos) || d.estratos.length !== 18) return false;

  return true;
}

/**
 * Lê e processa o selo público D16.
 *
 * @param dadosEntrada Objeto de dados brutos (opcional; padrão é o selo versionado no repositório).
 * @returns Resultado tipado do desenho realizado ou estado indisponível declarado.
 */
export function obterDesenhoRealizadoD16(dadosEntrada?: unknown): ResultadoDesenhoRealizadoD16 {
  const fonte = dadosEntrada !== undefined ? dadosEntrada : seloPublicoJsonRaw;

  if (!fonte || !validarSeloPublicoObjeto(fonte)) {
    return {
      disponivel: false,
      motivo: "Selo público de sorteio D16 indisponível, ausente ou corrompido.",
      totalPoligonosSorteados: null,
      totalTreino: null,
      totalHeldOut: null,
      areaTotalHectares: null,
      totalEstratos: null,
      estratosCenso: null,
      estratosVazios: null,
      limiaresS: null,
      limiaresE: null,
      estratos: null,
      contagemCandidatosPorEstrato: null,
      hashIntegridade: null,
      sha256ConjuntoCandidatos: null,
      sha256SeloCompleto: null,
      semente: null,
      geradoEm: null,
      gitCommit: null,
      versaoEsquema: null,
      invariantesVerificados: null,
      motivoDeficit: null,
      motivoEstratoVazio: null,
      rotuloCurto: "Desenho realizado indisponível",
      rotuloCompleto: "Desenho amostral realizado indisponível (selo público não carregado)",
    };
  }

  const rotuloCurto = `${fonte.totalPoligonosSorteados} polígonos realizados`;
  const rotuloCompleto = `${fonte.totalPoligonosSorteados} polígonos realizados (${fonte.areaTotalHectares.toFixed(2).replace(".", ",")} ha: ${fonte.totalTreino} treino + ${fonte.totalHeldOut} held-out)`;

  return {
    disponivel: true,
    totalPoligonosSorteados: fonte.totalPoligonosSorteados,
    totalTreino: fonte.totalTreino,
    totalHeldOut: fonte.totalHeldOut,
    areaTotalHectares: fonte.areaTotalHectares,
    totalEstratos: fonte.estratos.length,
    estratosCenso: [...fonte.estratosCenso],
    estratosVazios: [...fonte.estratosVazios],
    limiaresS: { ...fonte.limiaresS },
    limiaresE: { ...fonte.limiaresE },
    estratos: fonte.estratos.map((e) => ({ ...e })),
    contagemCandidatosPorEstrato: { ...fonte.contagemCandidatosPorEstrato },
    hashIntegridade: fonte.hashIntegridade,
    sha256ConjuntoCandidatos: fonte.sha256ConjuntoCandidatos,
    sha256SeloCompleto: fonte.sha256SeloCompleto,
    semente: fonte.semente,
    geradoEm: fonte.geradoEm,
    gitCommit: fonte.gitCommit,
    versaoEsquema: fonte.versaoEsquema,
    invariantesVerificados: [...fonte.invariantesVerificados],
    motivoDeficit: MOTIVO_DEFICIT_ESTRUTURAL_D16,
    motivoEstratoVazio: MOTIVO_ESTRATO_VAZIO_E_1_3_2,
    rotuloCurto,
    rotuloCompleto,
  };
}

/**
 * Retorna visão comparativa unificada contendo o desenho nominal e o desenho realizado.
 */
export function obterComparativoDesenhoD16(dadosEntrada?: unknown): {
  nominal: DesenhoAmostralNominalD16;
  realizado: ResultadoDesenhoRealizadoD16;
} {
  return {
    nominal: DESENHO_NOMINAL_D16,
    realizado: obterDesenhoRealizadoD16(dadosEntrada),
  };
}
