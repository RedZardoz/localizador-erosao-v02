"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  FileDown,
  RefreshCw,
  Info,
  Scale,
  Building2,
  Layers,
} from "lucide-react";
import {
  calcularDesenhoAmostral,
  exportarRelatorioSimulacaoDesenho,
  CONFIGURACAO_REGISTRADA_D16,
  EntradasCalculadoraDesenho,
} from "@/lib/fundiario/calculadoraDesenho";
import { AREA_INTERESSE_PADRAO } from "@/config/areaInteresse";

export const CalculadoraDesenhoAmostral: React.FC = () => {
  const [ladoMetros, setLadoMetros] = useState<number>(224);
  const [razaoAspecto, setRazaoAspecto] = useState<number>(2.0);
  const [areaTotalHa, setAreaTotalHa] = useState<number>(361);

  const entradas = useMemo<EntradasCalculadoraDesenho>(() => {
    return {
      ladoMetros,
      razaoAspectoMaxima: razaoAspecto,
      areaTotalVoadaHa: areaTotalHa,
    };
  }, [ladoMetros, razaoAspecto, areaTotalHa]);

  const saidas = useMemo(() => {
    return calcularDesenhoAmostral(entradas);
  }, [entradas]);

  const resetarParaD16 = () => {
    setLadoMetros(224);
    setRazaoAspecto(2.0);
    setAreaTotalHa(361);
  };

  const baixarRelatorioMd = () => {
    const texto = exportarRelatorioSimulacaoDesenho(entradas, saidas);
    const blob = new Blob([texto], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `simulacao_desenho_amostral_${ladoMetros}m_${areaTotalHa}ha.md`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const temDivergenciaD16 =
    ladoMetros !== CONFIGURACAO_REGISTRADA_D16.ladoMetros ||
    razaoAspecto !== CONFIGURACAO_REGISTRADA_D16.razaoAspectoMaxima ||
    areaTotalHa !== CONFIGURACAO_REGISTRADA_D16.areaTotalVoadaHa;

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-6 shadow-xl space-y-6 text-slate-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Calculadora de Desenho Amostral (X5)
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Simulador de trade-offs metodológicos, viabilidade fundiária e regime de amostra (PPGTCA 2026 / Decisões D12, D16 e D24).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {temDivergenciaD16 && (
            <button
              onClick={resetarParaD16}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-950/60 border border-sky-700/60 rounded-lg hover:bg-sky-900/60 transition"
              title="Restaurar parâmetros oficiais pré-registrados em D16"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restaurar D16
            </button>
          )}

          <button
            onClick={baixarRelatorioMd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 rounded-lg hover:bg-emerald-900/60 transition shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            Exportar Relatório (.md)
          </button>
        </div>
      </div>

      {/* Caixa de Salvaguarda Estrita */}
      <div className="bg-amber-950/30 border border-amber-600/50 rounded-lg p-4 text-xs text-amber-200/90 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300 block mb-0.5">
            Salvaguarda de Auditabilidade e Pré-Registro Metodológico:
          </span>
          Esta calculadora é <strong>exclusivamente exploratória</strong> para subsidiar a defesa perante a banca.
          Ela <strong>NÃO</strong> altera o desenho do sorteio, que lê obrigatoriamente a geometria de{" "}
          <code className="text-amber-100 font-mono">D16</code> via <code className="text-amber-100 font-mono">exigirDecisao</code>.
          Nenhum valor simulado é persistido como parâmetro de execução do SAREL (P8).
        </div>
      </div>

      {/* Controles de Entrada */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/60 p-5 rounded-lg border border-slate-800">
        {/* Lado do Polígono */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-300">Lado do Polígono:</span>
            <span className="text-sky-400 font-mono font-bold">{ladoMetros} m</span>
          </div>
          <input
            type="range"
            min={100}
            max={400}
            step={2}
            value={ladoMetros}
            onChange={(e) => setLadoMetros(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>100 m</span>
            <span className="text-sky-400 font-bold">224 m (D16)</span>
            <span>400 m</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Área individual correspondente: <strong>{saidas.areaPorPoligonoHa.toFixed(2)} ha</strong>.
          </p>
        </div>

        {/* Razão de Aspecto Máxima */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-300">Razão de Aspecto:</span>
            <span className="text-sky-400 font-mono font-bold">1:{razaoAspecto.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1.0, 1.5, 2.0, 3.0].map((r) => (
              <button
                key={r}
                onClick={() => setRazaoAspecto(r)}
                className={`py-1 text-xs font-mono rounded border transition ${
                  razaoAspecto === r
                    ? "bg-sky-500 text-slate-950 font-bold border-sky-400"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                1:{r === 1 ? "1" : r}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Dimensões simuladas: {saidas.larguraPoligonoM} m x {saidas.comprimentoPoligonoM} m.
          </p>
        </div>

        {/* Área Total Voada */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-300">Área Total Voada:</span>
            <span className="text-sky-400 font-mono font-bold">{areaTotalHa} ha</span>
          </div>
          <input
            type="range"
            min={100}
            max={800}
            step={5}
            value={areaTotalHa}
            onChange={(e) => setAreaTotalHa(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>100 ha</span>
            <span className="text-sky-400 font-bold">361 ha (D16)</span>
            <span>800 ha</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Total de {saidas.numPoligonosTotal} polígonos ({saidas.poligonosPorEstrato} por estrato).
          </p>
        </div>
      </div>

      {/* Tabela Comparativa: D16 Registrada vs Simulação */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Métrica de Desenho</th>
              <th className="py-3 px-4 text-center">Registrado em D16</th>
              <th className="py-3 px-4 text-center">Configuração Simulada</th>
              <th className="py-3 px-4 text-center">Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
            <tr>
              <td className="py-2.5 px-4 font-medium text-slate-200">Área por Polígono</td>
              <td className="py-2.5 px-4 text-center font-mono">5,02 ha</td>
              <td className="py-2.5 px-4 text-center font-mono font-semibold text-sky-400">
                {saidas.areaPorPoligonoHa.toFixed(2)} ha
              </td>
              <td className="py-2.5 px-4 text-center font-mono text-xs">
                {saidas.deltaContraD16.deltaAreaHa === 0
                  ? "—"
                  : `${saidas.deltaContraD16.deltaAreaHa > 0 ? "+" : ""}${saidas.deltaContraD16.deltaAreaHa.toFixed(2)} ha`}
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-4 font-medium text-slate-200">Número de Polígonos Total</td>
              <td className="py-2.5 px-4 text-center font-mono">72</td>
              <td className="py-2.5 px-4 text-center font-mono font-semibold text-sky-400">
                {saidas.numPoligonosTotal}
              </td>
              <td className="py-2.5 px-4 text-center font-mono text-xs">
                {saidas.deltaContraD16.deltaPoligonosTotal === 0
                  ? "—"
                  : `${saidas.deltaContraD16.deltaPoligonosTotal > 0 ? "+" : ""}${saidas.deltaContraD16.deltaPoligonosTotal}`}
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-4 font-medium text-slate-200">Polígonos por Estrato (18 estratos D12)</td>
              <td className="py-2.5 px-4 text-center font-mono">4,0 (2+2)</td>
              <td className="py-2.5 px-4 text-center font-mono font-semibold text-sky-400">
                {saidas.poligonosPorEstrato}
              </td>
              <td className="py-2.5 px-4 text-center font-mono text-xs">
                {saidas.deltaContraD16.deltaPoligonosPorEstrato === 0
                  ? "—"
                  : `${saidas.deltaContraD16.deltaPoligonosPorEstrato > 0 ? "+" : ""}${saidas.deltaContraD16.deltaPoligonosPorEstrato}`}
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-4 font-medium text-slate-200">Unidades Espacialmente Independentes</td>
              <td className="py-2.5 px-4 text-center font-mono">1.845 (922 held-out)</td>
              <td className="py-2.5 px-4 text-center font-mono font-semibold text-sky-400">
                {saidas.unidadesEfetivasTotais} ({saidas.unidadesEfetivasHeldOut} held-out)
              </td>
              <td className="py-2.5 px-4 text-center font-mono text-xs">
                {saidas.deltaContraD16.deltaUnidadesEfetivas === 0
                  ? "—"
                  : `${saidas.deltaContraD16.deltaUnidadesEfetivas > 0 ? "+" : ""}${saidas.deltaContraD16.deltaUnidadesEfetivas}`}
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-4 font-medium text-slate-200">Teto de Preditores (D24 - 200 obs/var)</td>
              <td className="py-2.5 px-4 text-center font-mono">9 preditores (≥ 8)</td>
              <td className="py-2.5 px-4 text-center font-mono font-semibold text-sky-400">
                {saidas.tetoPreditoresD24} preditores
              </td>
              <td className="py-2.5 px-4 text-center font-mono text-xs">
                {saidas.deltaContraD16.deltaTetoPreditores === 0
                  ? "—"
                  : `${saidas.deltaContraD16.deltaTetoPreditores > 0 ? "+" : ""}${saidas.deltaContraD16.deltaTetoPreditores}`}
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-4 font-medium text-slate-200">Autorizações de Proprietário (Logística)</td>
              <td className="py-2.5 px-4 text-center font-mono">72 autorizações</td>
              <td className="py-2.5 px-4 text-center font-mono font-semibold text-sky-400">
                {saidas.autorizacoesNecessarias} autorizações
              </td>
              <td className="py-2.5 px-4 text-center font-mono text-xs">
                {saidas.deltaContraD16.deltaAutorizacoes === 0
                  ? "—"
                  : `${saidas.deltaContraD16.deltaAutorizacoes > 0 ? "+" : ""}${saidas.deltaContraD16.deltaAutorizacoes}`}
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-4 font-medium text-slate-200">
                Fração de Imóveis Elegíveis (nesta bacia: {AREA_INTERESSE_PADRAO.sigla} — parâmetro do estudo)
              </td>
              <td className="py-2.5 px-4 text-center font-mono">71,8%</td>
              <td className="py-2.5 px-4 text-center font-mono font-semibold text-sky-400">
                {(saidas.fracaoImoveisElegiveis * 100).toFixed(1)}%
              </td>
              <td className="py-2.5 px-4 text-center font-mono text-xs">
                {saidas.deltaContraD16.deltaFracaoElegivelPct === 0
                  ? "—"
                  : `${saidas.deltaContraD16.deltaFracaoElegivelPct > 0 ? "+" : ""}${saidas.deltaContraD16.deltaFracaoElegivelPct}%`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Painel de Alertas */}
      {saidas.alertas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            Diagnóstico de Restrições e Alertas
          </h3>

          <div className="space-y-2">
            {saidas.alertas.map((alerta) => (
              <div
                key={alerta.id}
                className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
                  alerta.severidade === "critico"
                    ? "bg-rose-950/40 border-rose-600/50 text-rose-200"
                    : "bg-amber-950/40 border-amber-600/50 text-amber-200"
                }`}
              >
                {alerta.severidade === "critico" ? (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>{alerta.titulo}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 font-mono">
                      {alerta.regraAfetada}
                    </span>
                  </div>
                  <p className="mt-1 opacity-90 leading-relaxed">{alerta.mensagem}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aviso de Inadmissibilidade se Crítico */}
      {saidas.inadmissivel && (
        <div className="bg-rose-950/50 border border-rose-600 rounded-lg p-4 text-xs text-rose-200 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <strong>CONFIGURAÇÃO INADMISSÍVEL:</strong> Esta simulação viola restrições matemáticas e metodológicas pré-registradas (ex: quebra de pareamento 2+2 ou teto de preditores inferior a 8).
          </div>
        </div>
      )}
    </div>
  );
};
