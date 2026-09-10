/**
 * ============================================================================
 * Cliente GEE e Helpers de Redução — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * REGRA 8: Esquemas e capacidades verificados em 08/09/2026.
 * Todo método retorna estados fechados. Falhas de serviço nunca produzem valores default.
 */

import { obterCredencialEfemera } from "./auth";

export type StatusExecucaoGee =
  | "sucesso"
  | "nao-autenticado"
  | "fora-cobertura"
  | "servico-indisponivel";

export interface RespostaGee<T> {
  status: StatusExecucaoGee;
  dados: T | null;
  motivo?: string;
  proveniencia: {
    colecao: string;
    projecao: string;
    resolucaoMetros: number;
    processadoEm: string;
  };
}

export function estaAutenticadoGee(): boolean {
  return obterCredencialEfemera() !== null;
}
