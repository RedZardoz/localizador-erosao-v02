/**
 * ============================================================================
 * Contrato de Esquema da Matriz de Treino e Held-out — SAREL v2
 * A-05 / C-02 (PPGTCA 2026)
 * ============================================================================
 *
 * POR QUE EXISTE. Três achados de severidade máxima tinham uma causa raiz só: `perfis.ts` não
 * tinha contrato com os seus dois consumidores — o script que produz o alvo (D26) e o que o
 * avalia (D25). O resultado era um avaliador que parecia mais protegido do que era: as guardas
 * `_so_incluidas` (filtro de cobertura) e `_checar_pixels_disjuntos` (vazamento de pixel de
 * borda) existem e retornam em silêncio quando a coluna falta. Uma guarda que se desliga por
 * ausência de insumo é pior que a ausência de guarda, porque produz confiança falsa.
 *
 * O QUE ESTE MÓDULO VALIDA, E O QUE NÃO VALIDA.
 *
 * Valida ESTRUTURA e DOMÍNIO: a coluna existe, o tipo é o declarado, o valor está na faixa
 * física, `Modelo` é uniforme no artefato, e `Pi_i × W_i = 1`.
 *
 * NÃO valida CARDINALIDADE. Este módulo não sabe nem pergunta quantos estratos, quantos
 * polígonos ou quantos held-out existem. Essa contagem é do selo D16 e da verificação do modo
 * probatório do D25 (A-06). A razão é direta: o gate G-01 ainda não foi decidido, e qualquer
 * número gravado aqui — 18, 72, 36 — teria de ser refeito. Nenhum deles aparece neste arquivo.
 *
 * NÃO valida AUSÊNCIA de valor nas chaves de desenho. `Pi_i` vazio é estado declarado, não
 * defeito: significa montagem sem selo, o que é a situação real enquanto nenhum voo foi selado.
 * Exigir as chaves é privilégio do modo probatório, não do esquema.
 */

import { z } from "zod";
import type { PerfilExportacao } from "./perfis";

/**
 * Versão do contrato. Vai ao cabeçalho do artefato exportado para que um consumidor saiba, sem
 * inspecionar colunas, qual contrato ele está lendo.
 *
 * 2.0.0 — A-05: entram `Estrato_ID`, `Pi_i`, `W_i`, `N_Candidatos_Estrato`, `Incluida`,
 * `Cobertura_Celula`, `Area_Delineada_m2`, `Pixel_ID`, `Modelo`, `Data_Referencia`, `Fim_Janela`.
 */
export const ESQUEMA_MATRIZ_VERSAO = "2.0.0" as const;

export class ErroEsquemaMatriz extends Error {
  readonly perfil: string;
  readonly violacoes: string[];

  constructor(perfil: string, violacoes: string[]) {
    super(
      `[ESQUEMA_MATRIZ_INVALIDO] Perfil '${perfil}' (contrato ${ESQUEMA_MATRIZ_VERSAO}): ` +
        `${violacoes.length} violação(ões).\n` +
        violacoes.map((v) => `  - ${v}`).join("\n")
    );
    this.name = "ErroEsquemaMatriz";
    this.perfil = perfil;
    this.violacoes = violacoes;
  }
}

/** Célula vazia é AUSÊNCIA declarada. Jamais coagida a 0 (Regra 1). */
const vazio = z.literal("");

const numeroOuVazio = (checa: (n: number) => boolean, descricao: string) =>
  z.union([
    vazio,
    z.number().refine(checa, { message: `fora do domínio esperado (${descricao})` }),
  ]);

const textoOuVazio = z.union([vazio, z.string().min(1)]);

/**
 * Colunas que TODO perfil de matriz tem de projetar, com o seu domínio.
 *
 * A presença é obrigatória; o valor pode ser vazio onde a ausência é estado legítimo.
 */
const COLUNAS_CONTRATO = {
  // Identificadores
  Celula_ID: textoOuVazio,
  Ponto_ID: z.string().min(1),
  Poligono_ID: z.string().min(1),
  Pixel_ID: textoOuVazio,

  // Desenho amostral
  Estrato_ID: textoOuVazio,
  Pi_i: numeroOuVazio((n) => n > 0 && n <= 1, "probabilidade de inclusão em (0, 1]"),
  W_i: numeroOuVazio((n) => n > 0, "peso de Horvitz-Thompson > 0"),
  N_Candidatos_Estrato: numeroOuVazio(
    (n) => Number.isInteger(n) && n >= 1,
    "contagem inteira de candidatos >= 1"
  ),
  Papel_Conjunto: z.enum(["treino", "held-out"]),
  Bloco_Espacial: z.string().min(1),

  // Modelo e janela
  Modelo: z.enum(["D", "P"]),
  Data_Referencia: textoOuVazio,
  Fim_Janela: textoOuVazio,

  // Cobertura da delineação
  Incluida: z.union([vazio, z.literal("true"), z.literal("false")]),
  Cobertura_Celula: numeroOuVazio((n) => n >= 0 && n <= 1, "fração de cobertura em [0, 1]"),
  Area_Delineada_m2: numeroOuVazio((n) => n >= 0, "área em m² não negativa"),

  // Alvo
  Fracao_Erodida: numeroOuVazio((n) => n >= 0 && n <= 1, "fração erodida em [0, 1]"),
  Alvo_Binario_25: z.union([vazio, z.literal(0), z.literal(1)]),
} as const;

export const COLUNAS_OBRIGATORIAS_MATRIZ: readonly string[] = Object.keys(COLUNAS_CONTRATO);

const PERFIS_COM_CONTRATO: readonly PerfilExportacao[] = ["matriz-treino", "matriz-heldout"];

export function perfilTemContratoDeMatriz(perfil: PerfilExportacao): boolean {
  return PERFIS_COM_CONTRATO.includes(perfil);
}

/** Tolerância da identidade de Horvitz-Thompson, compatível com o arredondamento do selo. */
const TOLERANCIA_HT = 1e-6;

/**
 * Valida o artefato projetado contra o contrato. Lança `ErroEsquemaMatriz` — nunca avisa, nunca
 * corrige, nunca preenche (Regras 1 e 2).
 *
 * Chamada na exportação: é o ponto em que o artefato deixa de ser estado interno e passa a ser
 * evidência que alguém vai ler.
 */
export function validarEsquemaMatriz(
  perfil: PerfilExportacao,
  linhas: Array<Record<string, unknown>>
): void {
  if (!perfilTemContratoDeMatriz(perfil)) return;

  const violacoes: string[] = [];

  if (linhas.length === 0) return;

  // 1. Presença das colunas do contrato, verificada no cabeçalho efetivo do artefato.
  const presentes = new Set(Object.keys(linhas[0]));
  for (const coluna of COLUNAS_OBRIGATORIAS_MATRIZ) {
    if (!presentes.has(coluna)) {
      violacoes.push(
        `coluna obrigatória ausente: '${coluna}'. Sem ela o consumidor não pode verificar o que ` +
          `alega verificar (ver V-03 e T-02).`
      );
    }
  }

  // Sem as colunas, validar valor não faz sentido: o erro é estrutural.
  if (violacoes.length > 0) {
    throw new ErroEsquemaMatriz(perfil, violacoes);
  }

  // 2. Domínio de cada valor, por linha.
  const modelosVistos = new Set<string>();

  linhas.forEach((linha, i) => {
    for (const [coluna, validador] of Object.entries(COLUNAS_CONTRATO)) {
      const resultado = validador.safeParse(linha[coluna]);
      if (!resultado.success) {
        const motivo = resultado.error.issues[0]?.message ?? "valor inválido";
        violacoes.push(
          `linha ${i + 1}, coluna '${coluna}': ${motivo} (recebido: ${JSON.stringify(linha[coluna])})`
        );
      }
    }

    if (typeof linha.Modelo === "string") modelosVistos.add(linha.Modelo);

    // 3. Identidade de Horvitz-Thompson: pi_i * w_i = 1. Só quando ambos estão presentes.
    const pi = linha.Pi_i;
    const w = linha.W_i;
    if (typeof pi === "number" && typeof w === "number") {
      const produto = pi * w;
      if (Math.abs(produto - 1) > TOLERANCIA_HT) {
        violacoes.push(
          `linha ${i + 1}: identidade de Horvitz-Thompson violada — Pi_i * W_i = ${produto}, ` +
            `esperado 1 (D23). Peso e probabilidade não vêm do mesmo estrato.`
        );
      }
    } else if (typeof pi === "number" || typeof w === "number") {
      violacoes.push(
        `linha ${i + 1}: 'Pi_i' e 'W_i' têm de estar ambos presentes ou ambos ausentes; ` +
          `um sem o outro não permite auditar a ponderação.`
      );
    }
  });

  // 4. Um artefato, um modelo. Misturar detecção (D) e predição (P) na mesma matriz tornaria a
  // avaliação de D25 ininterpretável (achado V-01).
  if (modelosVistos.size > 1) {
    violacoes.push(
      `artefato mistura modelos: ${[...modelosVistos].sort().join(" e ")}. D (detecção) e ` +
        `P (predição) nunca compartilham a mesma matriz.`
    );
  }

  if (violacoes.length > 0) {
    throw new ErroEsquemaMatriz(perfil, violacoes);
  }
}
