import type { Proveniencia } from "./proveniencia";
import type { RotuloConsolidado } from "./rotulo";

export type StatusFundiario =
  | "encontrado" | "aproximado" | "sem-correspondencia"
  | "base-nao-disponivel" | "erro-na-consulta";

export interface ContextoFundiario {          // acesso e autorizacao — NUNCA feature
  status: StatusFundiario;
  motivo: string | null;                      // obrigatorio quando status != "encontrado"
  consultadoEm: string | null;
  criterioAssociacao: string | null;
  codigoCar: string | null;
  titularMascarado: string | null;            // mascara do SNCR, byte a byte
  documentoMascarado: string | null;          // CPF/CNPJ nunca aberto
  registroIncra: string | null;
  areaImovelHa: number | null;                // ausente = null, nunca 0
  bases: { uf: string; sicar?: string; sigef?: string; sncr?: string; sncrDataBase?: string };
  poligono?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

export interface BlocoSerie {
  sensores: string[];                                   // colecoes usadas
  nObservacoesValidas: Record<string, number>;          // por banda
  harmonicos: Record<string, Proveniencia<number>>;     // "B12_amplitudeAnual", "B12_tendencia", ...
  estatisticas: Record<string, Proveniencia<number>>;   // "B11_p10", "B11_p50", "B11_p90", ...
  frequenciaSoloNu: Proveniencia<number>;               // E^
  maiorSequenciaSoloNu: Proveniencia<number>;
  mesModalExposicao: Proveniencia<number>;
  compostoSoloNu: Record<string, Proveniencia<number>>;
}

export interface BlocoChuva {
  precipAcum30d: Proveniencia<number>;
  precipAcum90d: Proveniencia<number>;
  i30Max: Proveniencia<number>;
  nEventosErosivos: Proveniencia<number>;     // depende de D13
  indiceMecanismo: Proveniencia<number>;      // Sigma(erosividade_t * soloNu_t) — depende de D13 e D10
}

export interface BlocoTemporal {
  janela: { inicio: string; fim: string };
  serie: BlocoSerie;
  chuva: BlocoChuva;
}

export interface LinhaDeBaseRUSLE {
  fatorR: Proveniencia<number>;
  fatorK: Proveniencia<number>;
  fatorLS: Proveniencia<number>;
  fatorC: Proveniencia<number>;
  fatorP: Proveniencia<number>;
  perdaSolo: Proveniencia<number>;
  memoriaCalculo: string | null;
}

export interface PontoAmostral {
  id: string;                                 // estavel, gerado uma vez
  codigo: string;                             // legivel: "PR-2026-0001"; nao repetir o id em outra coluna
  latitude: number;                           // EPSG:4326
  longitude: number;
  origemSintetica: boolean;                   // obrigatorio
  blocoEspacial: string | null;               // null ate o variograma (plano secao 3.7)

  // Criterio interno de amostragem — NUNCA feature, NUNCA rotulo, NUNCA em perfil cego
  estratoId: string;
  criterioSelecao: {
    tercilS: 1 | 2 | 3;
    tercilE: 1 | 2 | 3;
    nivelK: 1 | 2;
    phiDiag: number | null;                   // null quando alguma dimensao tem amplitude zero
    semente: number;
  };

  localizacao: {
    municipio: Proveniencia<string>;
    codigoIbge: Proveniencia<string>;
    bacia: Proveniencia<string>;
  };

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
    grandeGrupo: Proveniencia<string>;        // distrofico/eutrofico COMO LEVANTADO
    tipoUnidade: Proveniencia<string>;        // simples | associacao
    confiancaPedologica: "alta" | "media" | "indisponivel";
    erodibilidadeClasse: Proveniencia<string>; // CATEGORICA
  };

  temporal: Partial<Record<"D" | "P", BlocoTemporal>>;  // uma janela por modelo (D04)

  rotulo?: RotuloConsolidado;                 // Fase 6 — sempre de observacao
  fundiario?: ContextoFundiario;
  linhaDeBase?: LinhaDeBaseRUSLE;             // Fase 8 — nunca em matriz
  rastreio: { versaoMotor: string; cenas: string[]; calculadoEm: string };  // cenas = PRODUCT_ID
}
