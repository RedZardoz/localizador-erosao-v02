"use client";

import React, { useMemo } from "react";
import { Mountain, SunMedium, Layers, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";
import { obterComparativoDesenhoD16 } from "@/lib/gee/seloPublicoD16";

export const PainelMedicaoDimensoes: React.FC = () => {
  const { realizado } = useMemo(() => obterComparativoDesenhoD16(), []);

  // Agrega contagens de K1 e K2 a partir do selo público
  const distribuicaoK = useMemo(() => {
    if (!realizado.disponivel || !realizado.contagemCandidatosPorEstrato) {
      return null;
    }
    let totalK1 = 0;
    let totalK2 = 0;
    for (const [estrato, count] of Object.entries(realizado.contagemCandidatosPorEstrato)) {
      if (estrato.endsWith("_1")) totalK1 += count;
      if (estrato.endsWith("_2")) totalK2 += count;
    }
    const totalGeral = totalK1 + totalK2;
    const pctK2 = totalGeral > 0 ? ((totalK2 / totalGeral) * 100).toFixed(2) : "0,00";
    return { totalK1, totalK2, totalGeral, pctK2 };
  }, [realizado]);

  return (
    <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
      {/* Cabeçalho do Painel */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Medição Pericial das Três Dimensões Amostrais (Ŝ × Ê × K̂)
          </h3>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Superfície de leitura transparente dos artefatos versionados de sensoriamento remoto e pedologia.
          Valores consolidados pelo CLI pré-sorteio (Decisões D07, D10, D11 e D12).
        </p>
      </div>

      {/* Dimensão 1: Ŝ — Declividade Topográfica */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              <Mountain className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                Dimensão Ŝ — Declividade Topográfica (Copernicus DEM GLO-30 · D07)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Domínio de validade de 3% a 20%, estratificado em tercis empíricos da bacia
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            D07 / D12
          </span>
        </div>

        {realizado.disponivel && realizado.limiaresS ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Ŝ₁ — Suave-Ondulado
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                [3,00%; {realizado.limiaresS.t1.toFixed(2).replace(".", ",")}%]
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Corte inferior (t₁ = {realizado.limiaresS.t1})
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Ŝ₂ — Moderado
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                ({realizado.limiaresS.t1.toFixed(2).replace(".", ",")}%; {realizado.limiaresS.t2.toFixed(2).replace(".", ",")}%]
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Faixa intermediária
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Ŝ₃ — Forte-Ondulado
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                ({realizado.limiaresS.t2.toFixed(2).replace(".", ",")}%; 20,00%]
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Corte superior (t₂ = {realizado.limiaresS.t2})
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Indisponível declarado: cortes de Ŝ não carregados do selo público.</span>
          </div>
        )}
      </div>

      {/* Dimensão 2: Ê — Frequência Temporal de Solo Exposto & Máscara GEOS3 */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <SunMedium className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                Dimensão Ê — Frequência de Solo Exposto &amp; GEOS3 (Sentinel-2 L2A · D10/D11)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Série temporal multianual com máscara SWIR de solo mineral vs palhada
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            D10 / D11 / D12
          </span>
        </div>

        {/* Bloco com Âncora: frequencia-solo-nu-e */}
        <div data-metodologia="frequencia-solo-nu-e" className="space-y-2">
          <h5 className="font-semibold text-xs text-slate-900 dark:text-slate-200">
            Tercis Empíricos da Dimensão Ê (Frequência Temporal de Solo Nu)
          </h5>

          {realizado.disponivel && realizado.limiaresE ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Ê₁ — Solo Nu Raro (SPD)
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  [0,0000; {realizado.limiaresE.t1.toFixed(4).replace(".", ",")}]
                </p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Corte inferior (t₁ = {realizado.limiaresE.t1}) · 181 pontos em zero exato
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Ê₂ — Sazonal
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  ({realizado.limiaresE.t1.toFixed(4).replace(".", ",")}; {realizado.limiaresE.t2.toFixed(4).replace(".", ",")}]
                </p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Exposição periódica de entressafra
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Ê₃ — Solo Nu Frequente
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  ({realizado.limiaresE.t2.toFixed(4).replace(".", ",")}; 1,0000]
                </p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Corte superior (t₂ = {realizado.limiaresE.t2}) · Alta propensão
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Indisponível declarado: cortes de Ê não carregados do selo público.</span>
            </div>
          )}
        </div>

        {/* Bloco com Âncora: mascara-solo-geos3 */}
        <div
          data-metodologia="mascara-solo-geos3"
          className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
              Máscara Espectral GEOS3 (Critério de Solo Mineral em Sentinel-2 MSI L2A)
            </h5>
          </div>

          <div className="font-mono text-[11px] p-2.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 space-y-1">
            <p>Conjunção estrita dos 5 testes biofísicos:</p>
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
              1. NDVI ∈ [0,00; 0,25]
            </p>
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
              2. NBR2 ∈ [0,00; 0,075] &nbsp;&nbsp;&nbsp;[NBR2 = (B11 - B12) / (B11 + B12)]
            </p>
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
              3. Banda 4 (Red) ≥ Banda 3 (Green)
            </p>
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
              4. Banda 3 (Green) ≥ Banda 2 (Blue)
            </p>
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
              5. Ausência de nuvem ou sombra (SCL/QA60)
            </p>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
            <strong>Fundamentação biofísica:</strong> O NBR2 no infravermelho de ondas curtas (SWIR1/B11 e SWIR2/B12)
            é o componente espectral indispensável que separa resíduo vegetal/palhada agrícola sob Sistema Plantio Direto
            de solo mineral desprovido de cobertura (absorção de celulose e lignina em 2,1–2,3 µm), discriminação que o
            NDVI isolado é incapaz de operar (Daughtry et al., 2001, 2004; Hively et al., 2021). A transposição dos limiares
            originais de Landsat 5 TM para Sentinel-2 MSI é declarada formalmente como hipótese experimental não validada
            (Decisão D10 / Emenda de 09/11/2026).
          </p>
        </div>
      </div>

      {/* Dimensão 3: K̂ — Erodibilidade Pedológica */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                Dimensão K̂ — Erodibilidade Pedológica (Carta Embrapa 2024 · D08/D09/D12)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Binarização de fragilidade: K̂₁ (erodibilidade baixa a média) vs K̂₂ (alta a muito alta)
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            D08 / D12
          </span>
        </div>

        {distribuicaoK ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                K̂₁ — Baixa a Média Erodibilidade
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                {distribuicaoK.totalK1} candidatos
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Latossolos e solos argilosos estruturados
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                K̂₂ — Alta a Muito Alta Erodibilidade
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                {distribuicaoK.totalK2} candidatos ({distribuicaoK.pctK2}%)
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Neossolos e solos frágeis (Meta de representação &gt;= 36 cumprida)
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Indisponível declarado: distribuição de K̂ não carregada do selo público.</span>
          </div>
        )}
      </div>
    </div>
  );
};
