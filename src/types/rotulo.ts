// ClasseRotulo e criado SOMENTE depois da decisao D03 (Fase 0).
export type ClasseRotulo = string;

export type ModalidadeRotulo = "interpretacao-visual" | "campo" | "drone";

export type BandaMultiespectral = "blue" | "green" | "red" | "rededge" | "nir";

export interface MetadadosSensorDrone {
  tipoSensor: "multiespectral" | "rgb";
  fabricanteVant: "Nuvem UAV" | string;
  modeloVant: "Spectral 2" | string;
  bandas: BandaMultiespectral[];
  resolucaoGsdCm: number;
  georreferenciamento: "ppk-rtk" | "gnss-navegacao";
  calibracaoRadiometrica: boolean; // DLS (sensor de irradiância solar) + painel de reflectância difusa
}

export interface Rotulo {
  classe: ClasseRotulo;
  modalidade: ModalidadeRotulo;
  observador: string;
  observadoEm: string;                        // AAAA-MM-DD
  confianca?: "alta" | "media" | "baixa";
  observacoes?: string;
  cego: boolean;  // desconhecia predicao, score, estrato e rotulo de outra modalidade
  fracaoErodida?: number;                     // D26: alvo contínuo [0, 1] (primário)
  alvoBinarioDerivado?: 0 | 1;                // D26: secundário derivado a 25% (>= 0.25)
}

export interface RotuloConsolidado {
  final: Rotulo | null;                       // null enquanto a divergencia estiver pendente
  origens: Rotulo[];                          // todas as observacoes independentes
  kappa: number | null;                       // null sem pares ou quando indefinido
  divergencia: "nenhuma" | "resolvida-por-terceiro" | "pendente" | "indisponivel";
  papelConjunto: "treino" | "held-out" | "indisponivel";       // sob D16, vem do sorteio ou indisponivel
}

