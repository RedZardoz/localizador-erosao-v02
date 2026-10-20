/**
 * ============================================================================
 * Relação local da equipe de autorizações — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * O QUÊ: carrega a relação `pseudônimo → nome + RA` dos bolsistas que solicitam as
 * autorizações de acesso, a partir de um arquivo que vive FORA do git.
 *
 * POR QUÊ ELA É SEPARADA DO LOG:
 *   O log de autorizações (`logRecusas.ts`) é publicável junto com a dissertação —
 *   ele chaveia por código cego e estrato, sem nenhum dado pessoal. Nome e RA do
 *   bolsista são dado pessoal, e o RA é chave institucional: resolve para a matrícula
 *   na universidade. Nenhum leitor do log precisa deles.
 *   Por isso o log guarda o pseudônimo de papel ("bolsista-1") e esta relação guarda o
 *   vínculo. As duas informações existem e são resolvíveis; só não moram no mesmo
 *   arquivo. É a mesma arquitetura da tabela reversa de cegamento dos proprietários.
 *
 * GUARDA K2 (espelhada de `sorteioPoligonos.ts`):
 *   O carregamento é RECUSADO se o caminho do arquivo não estiver coberto pelo
 *   .gitignore. Relação de equipe versionada no repositório exporia nome e RA a quem
 *   clonar, e o histórico do git não esquece.
 *
 * CONFORMIDADE: Regra 1 — entrada sem pseudônimo, sem nome ou sem RA é REJEITADA com
 * causa. Nenhum campo é preenchido por omissão.
 */

import fs from "fs";
import {
  pareceIdentificadorInstitucional,
  LIMITE_DIGITOS_IDENTIFICADOR,
} from "./logRecusas";
import { verificarCaminhoIgnoradoGit } from "@/lib/gee/sorteioPoligonos";

export interface MembroEquipe {
  /** Pseudônimo de papel usado no log publicável (ex.: "bolsista-1"). */
  pseudonimo: string;
  /** Nome completo. Nunca entra no log de autorizações. */
  nome: string;
  /** Registro acadêmico. Nunca entra no log de autorizações. */
  ra: string;
}

export class ErroEquipeNaoIgnoradaGit extends Error {
  constructor(caminho: string) {
    super(
      `[CARGA_EQUIPE_RECUSADA] O caminho '${caminho}' não está coberto pelo .gitignore. ` +
        "Versionar a relação da equipe exporia nome e RA dos bolsistas no repositório, " +
        "e o histórico do git não esquece. A leitura foi compulsoriamente abortada."
    );
    this.name = "ErroEquipeNaoIgnoradaGit";
  }
}

export class ErroEquipeInvalida extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroEquipeInvalida";
  }
}

function textoPreenchido(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim().length > 0;
}

/**
 * Valida a estrutura da relação sem tocar em disco — separado para poder ser testado
 * sem fixture de arquivo e reutilizado por quem já tenha o conteúdo em memória.
 */
export function validarEquipe(bruto: unknown): MembroEquipe[] {
  if (!Array.isArray(bruto)) {
    throw new ErroEquipeInvalida("A relação da equipe deve ser uma lista de membros.");
  }

  const membros: MembroEquipe[] = [];
  const pseudonimosVistos = new Set<string>();

  for (const [i, item] of bruto.entries()) {
    const m = item as Partial<MembroEquipe>;
    const onde = `entrada ${i + 1}`;

    if (!textoPreenchido(m.pseudonimo)) {
      throw new ErroEquipeInvalida(`${onde}: pseudonimo ausente.`);
    }
    if (pareceIdentificadorInstitucional(m.pseudonimo)) {
      throw new ErroEquipeInvalida(
        `${onde}: pseudonimo "${m.pseudonimo}" tem ${LIMITE_DIGITOS_IDENTIFICADOR} ou mais dígitos ` +
          "e parece identificador institucional. O pseudônimo vai para o log publicável; " +
          "use forma de papel, como \"bolsista-1\"."
      );
    }
    if (pseudonimosVistos.has(m.pseudonimo)) {
      throw new ErroEquipeInvalida(`${onde}: pseudonimo "${m.pseudonimo}" duplicado.`);
    }
    if (!textoPreenchido(m.nome)) {
      throw new ErroEquipeInvalida(
        `${onde}: nome ausente. Sem nome a relação não resolve o autor do registro, ` +
          "que é a única razão de ela existir."
      );
    }
    if (!textoPreenchido(m.ra)) {
      throw new ErroEquipeInvalida(`${onde}: ra ausente.`);
    }

    pseudonimosVistos.add(m.pseudonimo);
    membros.push({ pseudonimo: m.pseudonimo, nome: m.nome, ra: m.ra });
  }

  if (membros.length === 0) {
    throw new ErroEquipeInvalida("A relação da equipe está vazia.");
  }
  return membros;
}

/**
 * Carrega a relação local. Recusa caminho não ignorado pelo git (K2) antes de ler
 * qualquer byte — a verificação vem primeiro, de propósito.
 */
export function carregarEquipeLocal(caminho: string): MembroEquipe[] {
  if (!verificarCaminhoIgnoradoGit(caminho)) {
    throw new ErroEquipeNaoIgnoradaGit(caminho);
  }
  if (!fs.existsSync(caminho)) {
    throw new ErroEquipeInvalida(
      `Relação da equipe não encontrada em '${caminho}'. ` +
        "Copie docs/modelos/equipe_local_MODELO.json e preencha com os dados reais."
    );
  }
  let bruto: unknown;
  try {
    bruto = JSON.parse(fs.readFileSync(caminho, "utf-8"));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ErroEquipeInvalida(`JSON inválido em '${caminho}': ${msg}`);
  }
  return validarEquipe(bruto);
}

/** Pseudônimos aceitos na ingestão do log. */
export function listarPseudonimos(equipe: readonly MembroEquipe[]): string[] {
  return equipe.map((m) => m.pseudonimo);
}

/**
 * Resolve o pseudônimo para a pessoa. Uso interno da equipe e de auditoria: jamais
 * escreva o retorno disto no log de autorizações nem em artefato publicável.
 */
export function resolverAutor(
  equipe: readonly MembroEquipe[],
  pseudonimo: string
): MembroEquipe | null {
  return equipe.find((m) => m.pseudonimo === pseudonimo) ?? null;
}
