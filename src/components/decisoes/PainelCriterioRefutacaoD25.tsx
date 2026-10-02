"use client";

import React, { useState } from "react";
import {
  Scale,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Layers,
  Target,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface CompetidorD24 {
  id: "rusle" | "regressao_penalizada" | "xgboost";
  nome: string;
  descricao: string;
  objetivoOuPerda: string;
  rhoSpearman: number | null; // null = não avaliado
  aucSecundaria: number | null; // null = não avaliado
  ic95Diferenca: [number, number] | null; // bootstrap agrupado por polígono
}

export interface BlocoPreditorD24 {
  bloco: "Espectro-Temporal" | "Terreno" | "Solo" | "Chuva";
  exemplos: string;
  tetoPreditores: number;
  unidadesEfetivasEstimadas: number;
  alcanceEspacial: string;
  statusRegime: "adequado" | "abaixo_regime_fisico";
  justificativaFisica: string;
}

export const BLOCOS_PREDITORES_D24: BlocoPreditorD24[] = [
  {
    bloco: "Espectro-Temporal",
    exemplos: "Sentinel-2 bandas, índices biofísicos (NDVI, BSI), métricas temporais",
    tetoPreditores: 8,
    unidadesEfetivasEstimadas: 1845,
    alcanceEspacial: "50 m de alcance de autocorrelação espacial (~26 efetivas/polígono de 5,02 ha)",
    statusRegime: "adequado",
    justificativaFisica: "Varia livremente dentro do talhão; é onde o XGBoost aprende não-linearidades e interações que o RUSLE não capta.",
  },
  {
    bloco: "Terreno",
    exemplos: "Copernicus DEM GLO-30 (declividade, fator LS, curvatura vertical/horizontal)",
    tetoPreditores: 4,
    unidadesEfetivasEstimadas: 396,
    alcanceEspacial: "~11 unidades efetivas por polígono de 5,02 ha (pixel 30 m já agrega)",
    statusRegime: "abaixo_regime_fisico",
    justificativaFisica: "Admitido por necessidade física (Invariante 1 — cinco fatores do RUSLE). Monotonicidade reduz graus de liberdade.",
  },
  {
    bloco: "Solo",
    exemplos: "Erodibilidade K̂ (Embrapa Solos / cartas oficiais)",
    tetoPreditores: 1,
    unidadesEfetivasEstimadas: 72,
    alcanceEspacial: "1 unidade por polígono (polígono de 5,02 ha cai tipicamente numa mesma mancha pedológica)",
    statusRegime: "abaixo_regime_fisico",
    justificativaFisica: "Crítico: 1 único preditor admitido (K̂). Impossível aumentar sem novos polígonos. Monotonicidade física imposta.",
  },
  {
    bloco: "Chuva",
    exemplos: "Erosividade R (séries CHIRPS / TRMM / I30)",
    tetoPreditores: 1,
    unidadesEfetivasEstimadas: 72,
    alcanceEspacial: "Grade regional (5 a 10 km de resolução nativa)",
    statusRegime: "abaixo_regime_fisico",
    justificativaFisica: "Crítico: 1 único preditor admitido (fator R). Polígonos próximos compartilham a mesma célula de chuva.",
  },
];

/**
 * Painel Metodológico dos Critérios de Refutação D25, Regime de Dados D24 e Alvo Contínuo D26.
 *
 * Em conformidade estrita com D25 e P12:
 * Enquanto não houver avaliação pericial sobre o held-out agrupado de VANT,
 * o status exibe compulsoriamente "NÃO AVALIADO". Não antecipa nem fabrica resultados.
 */
export const PainelCriterioRefutacaoD25: React.FC = () => {
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);

  // Status de avaliação em conformidade estrita com P12 e D25
  const statusAvaliacao: "nao_avaliado" | "corroborada" | "inconclusiva" | "refutada" =
    "nao_avaliado";

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm space-y-0 text-xs">
      {/* Header com Badge Destacado de NÃO AVALIADO */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
              <span>Critério de Refutação Pré-Registrado (D25) & Regime D24 / D26</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-normal">
                Held-out Agrupado
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Inferência ternária (Corroborada | Inconclusiva | Refutada) por bootstrap em 36 clusters mantendo D24 e D26.
            </p>
          </div>
        </div>

        {/* Badge de Status Oficial D25 */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full font-bold uppercase text-[10px] tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Estado: NÃO AVALIADO
          </span>
          <button
            type="button"
            onClick={() => setDetalhesAbertos(!detalhesAbertos)}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            title="Expandir detalhes"
          >
            {detalhesAbertos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Banner de Não Avaliado (P12 inviolável) */}
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Avaliação Pré-Registrada Pendente de Sobrevoo e Delineação de VANT (D16 / D25)</span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            Conforme a Decisão <b>D25</b> e a postura metodológica <b>P12</b>, o teste de refutação é <b>único e cego</b>,
            executado exclusivamente sobre os 36 polígonos held-out reservados de VANT após a sobreposição ortomosaica (~4 cm GSD).
            Nenhum resultado sintético ou preliminar é antecipado na interface.
          </p>
        </div>

        {/* Três Competidores Pareados (D24 / D25) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
              Os 3 Competidores Emparelhados (Métrica Primária: ρ Spearman — D26)
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Piso: ρ ≥ 0,40 | Margem: Δρ ≥ 0,10</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Competidor 1: Linha de Base RUSLE */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">1. Linha de Base RUSLE</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  Referência
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Modelo empírico clássico: <code>A = R · K · LS · C · P</code> em t/ha·ano.
              </p>
              <div className="pt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center font-mono text-[10px]">
                <span className="text-slate-500">ρ Spearman:</span>
                <span className="font-bold text-slate-600 dark:text-slate-400">não avaliado</span>
              </div>
              <div className="flex justify-between items-center font-mono text-[10px]">
                <span className="text-slate-500">AUC (Secundária):</span>
                <span className="font-bold text-slate-600 dark:text-slate-400">não avaliado</span>
              </div>
            </div>

            {/* Competidor 2: Regressão Penalizada */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">2. Regressão Penalizada</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                  Parcimônia
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Tweedie penalizada (alvo contínuo) / Logística (binário derivado).
              </p>
              <div className="pt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center font-mono text-[10px]">
                <span className="text-slate-500">ρ Spearman:</span>
                <span className="font-bold text-slate-600 dark:text-slate-400">não avaliado</span>
              </div>
              <div className="flex justify-between items-center font-mono text-[10px]">
                <span className="text-slate-500">AUC (Secundária):</span>
                <span className="font-bold text-slate-600 dark:text-slate-400">não avaliado</span>
              </div>
            </div>

            {/* Competidor 3: Modelo Proposto (XGBoost) */}
            <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 text-xs">3. Modelo Proposto (XGBoost)</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-mono">
                  reg:tweedie
                </span>
              </div>
              <p className="text-[10px] text-indigo-800/80 dark:text-indigo-300/80">
                Sentinel-2 + biofísica com <code>monotone_constraints</code> e tetos D24.
              </p>
              <div className="pt-1 border-t border-indigo-200 dark:border-indigo-900/60 flex justify-between items-center font-mono text-[10px]">
                <span className="text-indigo-700 dark:text-indigo-400">ρ Spearman:</span>
                <span className="font-bold text-indigo-700 dark:text-indigo-400">não avaliado</span>
              </div>
              <div className="flex justify-between items-center font-mono text-[10px]">
                <span className="text-indigo-700 dark:text-indigo-400">AUC (Secundária):</span>
                <span className="font-bold text-indigo-700 dark:text-indigo-400">não avaliado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estrutura Ternária de Desfecho D25 */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Estrutura Ternária de Desfechos Pré-Registrados (D25)
            </span>
            <span className="text-[10px] font-mono text-slate-500">IC 95% Bootstrap em 36 Clusters Held-Out</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200">
              <b className="block text-emerald-700 dark:text-emerald-300 font-mono text-xs">1. Corroborada</b>
              <span>Ponto atinge piso (ρ ≥ 0,40) e margem (Δρ ≥ 0,10), e o IC 95% emparelhado exclui zero.</span>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-blue-950 dark:text-blue-200">
              <b className="block text-blue-700 dark:text-blue-300 font-mono text-xs">2. Inconclusiva</b>
              <span>Margem pontual atingida (Δρ ≥ 0,10), porém IC 95% cruza zero. Reporta-se limitação de potência amostral.</span>
            </div>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200">
              <b className="block text-rose-700 dark:text-rose-300 font-mono text-xs">3. Refutada</b>
              <span>Estimativa pontual fica abaixo do piso de utilidade (ρ &lt; 0,40) ou inferior à linha de base RUSLE.</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
            * 4º Desfecho de Parcimônia: Se a Regressão Penalizada empatar ou superar o XGBoost dentro do intervalo,
            a hipótese sobre a necessidade de ensemble de árvores/não-linearidade fica refutada, mantendo o mérito do sensoriamento remoto.
          </p>
        </div>

        {/* Tabela do Regime de Dados (D24) e Hierarquia de Alvo (D26) */}
        {detalhesAbertos && (
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800 animate-in fade-in">
            {/* D26: Hierarquia de Alvos */}
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-1.5">
              <div className="font-bold text-indigo-950 dark:text-indigo-200 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Hierarquia Rígida de Alvos (Decisão D26 — Inversão Irreversível)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-white dark:bg-slate-900 rounded border border-indigo-100 dark:border-indigo-900">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 block">ALVO PRIMÁRIO (D26):</span>
                  <span>Fração contínua da área da célula de 10 m delineada sob ortomosaico VANT [0, 1]. Modelo <code>reg:tweedie</code> para inflação de zeros; ordenação por correlação de Spearman.</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded border border-indigo-100 dark:border-indigo-900">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block">ALVO BINÁRIO DERIVADO (D26):</span>
                  <span>Positivo se fração erodida ≥ 25% (25 m² em célula de 100 m²). Estritamente SECUNDÁRIO para compatibilidade ordinal e reporte de AUC (≥ 0,70).</span>
                </div>
              </div>
            </div>

            {/* D24: Tetos de Preditores por Bloco */}
            <div className="space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  Regime de Dados e Tetos por Bloco Físico (Decisão D24 — Máx. 14 Preditores)
                </span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                  3 dos 4 blocos operam abaixo do regime estatístico recomendado
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold">
                      <th className="p-1.5">Bloco Físico</th>
                      <th className="p-1.5">Teto</th>
                      <th className="p-1.5">Unidades Efetivas</th>
                      <th className="p-1.5">Escala / Autocorrelação</th>
                      <th className="p-1.5">Regime van der Ploeg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {BLOCOS_PREDITORES_D24.map((b) => (
                      <tr key={b.bloco} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-1.5 font-bold text-slate-800 dark:text-slate-200">{b.bloco}</td>
                        <td className="p-1.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          até {b.tetoPreditores}
                        </td>
                        <td className="p-1.5 font-mono text-slate-600 dark:text-slate-400">
                          ~{b.unidadesEfetivasEstimadas}
                        </td>
                        <td className="p-1.5 text-slate-500 dark:text-slate-400 text-[10px] max-w-xs">
                          {b.alcanceEspacial}
                        </td>
                        <td className="p-1.5">
                          {b.statusRegime === "adequado" ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-bold">
                              Suportado
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-bold">
                              Abaixo (Mín. Físico)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
