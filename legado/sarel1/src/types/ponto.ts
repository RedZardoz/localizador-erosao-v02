/**
 * ============================================================================
 * Modelo de Dados do Ponto Amostral — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Conforme especificação da Parte III, §5 do Prompt e do Plano v2.
 * Todas as variáveis científicas carregam Proveniencia<T>.
 * Dados cadastrais e critérios internos NUNCA são features de treino.
 */

import { Proveniencia } from "./proveniencia";
import { Rotulo } from "./rotulo";

export type StatusFundiario =
  | "encontrado"
  | "aproximado"
  | "sem-correspondencia"
  | "base-nao-disponivel"
  | "erro-na-consulta"; // Regra 2: falha de consulta não vira sem-correspondência

export interface ContextoFundiario {
  status: StatusFundiario;
  motivo?: string;
  codigoCar?: string;
  titularMascarado?: string;
  documentoMascarado?: string;
  registroIncra?: string;
  areaImovelHa?: number | null;
  consultadoEm?: string;
  criterioAssociacao?: string;
  ufConsultada?: string;
  sicarArquivo?: string;
  sigefArquivo?: string;
  sncrArquivo?: string;
  sncrDataBase?: string;
  denominacao?: string;
  municipio?: string;
  poligonoGeoJson?: any;
}

export interface CriterioSelecaoAmostral {
  tercilS?: number; // 1, 2, 3 (terreno)
  tercilE?: number; // 1, 2, 3 (exposição)
  nivelK?: number;  // 1, 2 (erodibilidade)
  phiDiag: number;  // Diagnóstico interno [0, 1] — NUNCA feature nem rótulo
  quantilPhi?: number;
  phi?: number;
}

export interface PontoAmostral {
  id: string; // UUID v4 estável, gerado uma vez
  codigo: string; // legível: "PR-2026-0001"
  latitude: number; // EPSG:4326 decimal
  longitude: number;
  blocoEspacial: string; // para validação cruzada espacial independente (Roberts et al., 2017)

  /** Guarda antissintético (corrige I2): ponto sintético é bloqueado de exportação real. */
  origemSintetica?: boolean;

  /** Estrato amostral (critério interno de amostragem, NUNCA feature nem rótulo). */
  estratoId: string;
  criterioSelecao: CriterioSelecaoAmostral;

  /** Variáveis científicas — TODAS com proveniência explícita */
  terreno: {
    elevacao: Proveniencia<number>;
    declividadePct: Proveniencia<number>;
    declividadeGraus: Proveniencia<number>;
    curvaturaPerfil: Proveniencia<number>;
    curvaturaPlana: Proveniencia<number>;
    acumuloFluxo: Proveniencia<number>;
    twi: Proveniencia<number>;
  };

  solo: {
    ordem: Proveniencia<string>;
    subOrdem: Proveniencia<string>;
    grandeGrupo: Proveniencia<string>; // distrófico/eutrófico LEVANTADO em campo
    tipoUnidade: Proveniencia<string>; // simples | associacao
    confiancaPedologica: "alta" | "media" | "indisponivel";
    erodibilidadeClasse: Proveniencia<string>; // CATEGÓRICA, nunca numérica
  };

  serie: {
    janela: { inicio: string; fim: string };
    nObservacoesValidas: number;
    harmonicos: Record<string, Proveniencia<number>>; // "B12_amplitude", "B12_tendencia", etc.
    frequenciaSoloNu: Proveniencia<number>;
    compostoSoloNu: Record<string, Proveniencia<number>>;
  };

  chuva: {
    precipAcum30d: Proveniencia<number>;
    precipAcum90d: Proveniencia<number>;
    i30Max: Proveniencia<number>;
    nEventosErosivos: Proveniencia<number>;
    indiceMecanismo: Proveniencia<number>; // Σ(erosividade_t × soloNu_t)
  };

  /** Linha de base RUSLE (opcional, só preenchida se os cinco fatores existirem). */
  rusle?: {
    fatorR: Proveniencia<number>;
    fatorK: Proveniencia<number>;
    fatorLS: Proveniencia<number>;
    fatorC: Proveniencia<number>;
    fatorP: Proveniencia<number>;
    perdaSolo: Proveniencia<number>;
    memoriaCalculo: string;
  };

  /** Rótulo — SEMPRE de observação humana, nunca de cálculo. */
  rotulo?: Rotulo;

  /** Contexto fundiário — acesso e autorização para campo, NUNCA feature. */
  fundiario?: ContextoFundiario;

  /** Metadados de cadeia e rastreabilidade */
  auditoria?: {
    municipio?: string;
    uf?: string;
    macrorregiao?: string;
    baciaHidrografica?: string;
    cenaSentinel2?: string;
    dataCalculoGee?: string;
    versaoMotorCalculo?: string;
    observacoes?: string;
    validadoCampoEm?: string;
    observacoesCampo?: string;
  };
}
