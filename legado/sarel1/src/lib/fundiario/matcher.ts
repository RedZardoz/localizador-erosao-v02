/**
 * ============================================================================
 * Casador Espacial Fundiário (SICAR / SIGEF / SNCR) — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * REGRA 2 DA LEI FUNDAMENTAL E ACHADO C4 DA AUDITORIA:
 * "Nunca colapsar estados distintos: 'Consultado e não há' != 'não foi possível consultar' != 'fora da área de cobertura'."
 *
 * Status obrigatórios (enumeração fechada):
 * - "encontrado": polígono oficial intercepta a coordenada.
 * - "aproximado": associação por proximidade de centroide / bounding box.
 * - "sem-correspondencia": consulta executada com sucesso, base cobre o local, mas não há imóvel na coordenada.
 * - "base-nao-disponivel": a base local (arquivo SICAR/SIGEF/SNCR) não está instalada ou não cobre a UF.
 * - "erro-na-consulta": falha técnica, timeout, exceção de banco. NADA SE AFIRMA sobre o território.
 *
 * PAPEL DO DADO FUNDIÁRIO:
 * Acesso e autorização para campo, contexto de manejo e documentação ética. NUNCA feature de treino.
 */

import { ContextoFundiario, StatusFundiario } from "@/types/ponto";
import { mascararDocumentoPessoal, validarMascaraTitularSncr } from "./protecao";

export interface RegistroBaseFundiaria {
  codigoCar: string;
  titularSncr: string;
  documentoMascarado?: string;
  registroIncra?: string;
  areaImovelHa: number;
  criterioAssociacao: string;
}

export interface InsumoConsultaFundiaria {
  latitude: number;
  longitude: number;
  uf: string;
  dataConsulta?: string;
}

export interface ConfiguracaoBasesInstaladas {
  ufsDisponiveis: string[];
  sicarArquivo?: string;
  sigefArquivo?: string;
  sncrArquivo?: string;
  sncrDataBase?: string;
}

/** Configuração padrão das bases instaladas no ambiente de pesquisa do Paraná. */
export const BASES_PARANA_CONFIG: ConfiguracaoBasesInstaladas = {
  ufsDisponiveis: ["PR"],
  sicarArquivo: "AREA_IMOVEL_PR.zip",
  sigefArquivo: "Sigef Brasil_PR.zip",
  sncrArquivo: "Imoveis_PR_01_09_2026.csv",
  sncrDataBase: "2026-09-01",
};

/**
 * Executa consulta fundiária sobre as bases locais com estrita preservação de estados.
 */
export async function consultarCadastroFundiario(
  insumo: InsumoConsultaFundiaria,
  config: ConfiguracaoBasesInstaladas = BASES_PARANA_CONFIG,
  provedorConsultaLocal?: (lat: number, lng: number, uf: string) => Promise<RegistroBaseFundiaria | null>
): Promise<ContextoFundiario> {
  const dataHoje = insumo.dataConsulta || new Date().toISOString().split("T")[0];

  // 1. Validação da Coordenada
  if (!Number.isFinite(insumo.latitude) || !Number.isFinite(insumo.longitude) || Math.abs(insumo.latitude) > 90 || Math.abs(insumo.longitude) > 180) {
    return {
      status: "erro-na-consulta",
      motivo: `Coordenada geográfica inválida (${insumo.latitude}, ${insumo.longitude}). Nenhuma consulta foi realizada.`,
      consultadoEm: dataHoje,
      ufConsultada: insumo.uf,
    };
  }

  // 2. Verificação de Cobertura das Bases Instaladas
  if (!config.ufsDisponiveis.includes(insumo.uf.toUpperCase())) {
    return {
      status: "base-nao-disponivel",
      motivo: `Base fundiária não instalada para a UF '${insumo.uf}'. Instalação cobre apenas: ${config.ufsDisponiveis.join(", ")}.`,
      consultadoEm: dataHoje,
      ufConsultada: insumo.uf,
      sicarArquivo: config.sicarArquivo,
      sigefArquivo: config.sigefArquivo,
      sncrArquivo: config.sncrArquivo,
      sncrDataBase: config.sncrDataBase,
    };
  }

  // 3. Execução da Consulta Espacial
  try {
    if (!provedorConsultaLocal) {
      // Se nenhum motor de consulta for fornecido, reporta que a base está instalada mas o motor não foi conectado
      return {
        status: "base-nao-disponivel",
        motivo: "Motor de cruzamento espacial local não conectado nesta execução.",
        consultadoEm: dataHoje,
        ufConsultada: insumo.uf,
        sicarArquivo: config.sicarArquivo,
        sigefArquivo: config.sigefArquivo,
        sncrArquivo: config.sncrArquivo,
        sncrDataBase: config.sncrDataBase,
      };
    }

    const resultado = await provedorConsultaLocal(insumo.latitude, insumo.longitude, insumo.uf);

    if (resultado) {
      // Imóvel localizado com sucesso
      const ehAproximado = resultado.criterioAssociacao.toLowerCase().includes("aproximad") ||
                            resultado.criterioAssociacao.toLowerCase().includes("bounding box") ||
                            resultado.criterioAssociacao.toLowerCase().includes("centroide");

      const status: StatusFundiario = ehAproximado ? "aproximado" : "encontrado";

      return {
        status,
        motivo: ehAproximado ? "Associação aproximada por centroide/BBox; requer validação no local." : undefined,
        codigoCar: resultado.codigoCar,
        titularMascarado: validarMascaraTitularSncr(resultado.titularSncr),
        documentoMascarado: mascararDocumentoPessoal(resultado.documentoMascarado),
        registroIncra: resultado.registroIncra || "não informado",
        areaImovelHa: resultado.areaImovelHa > 0 ? resultado.areaImovelHa : null,
        criterioAssociacao: resultado.criterioAssociacao,
        consultadoEm: dataHoje,
        ufConsultada: insumo.uf,
        sicarArquivo: config.sicarArquivo,
        sigefArquivo: config.sigefArquivo,
        sncrArquivo: config.sncrArquivo,
        sncrDataBase: config.sncrDataBase,
      };
    }

    // Consulta executada com sucesso, mas nenhum polígono contém a coordenada
    return {
      status: "sem-correspondencia",
      motivo: "Consulta executada com sucesso nas bases SICAR/SIGEF/SNCR, porém nenhum imóvel cadastrado intercepta esta coordenada.",
      consultadoEm: dataHoje,
      ufConsultada: insumo.uf,
      codigoCar: "não localizado",
      titularMascarado: "não localizado",
      documentoMascarado: "não localizado",
      registroIncra: "não localizado",
      areaImovelHa: null,
      criterioAssociacao: "Interseção espacial estrita sobre polígonos oficiais",
      sicarArquivo: config.sicarArquivo,
      sigefArquivo: config.sigefArquivo,
      sncrArquivo: config.sncrArquivo,
      sncrDataBase: config.sncrDataBase,
    };
  } catch (err: unknown) {
    // REGRA 2: NENHUM CATCH PODE AFIRMAR "sem-correspondencia"!
    const msg = err instanceof Error ? err.message : String(err);
    return {
      status: "erro-na-consulta",
      motivo: `Falha técnica durante a execução da consulta fundiária: ${msg}. Nada se afirma sobre a existência ou inexistência de imóvel nesta coordenada.`,
      consultadoEm: dataHoje,
      ufConsultada: insumo.uf,
      sicarArquivo: config.sicarArquivo,
      sigefArquivo: config.sigefArquivo,
      sncrArquivo: config.sncrArquivo,
      sncrDataBase: config.sncrDataBase,
    };
  }
}
