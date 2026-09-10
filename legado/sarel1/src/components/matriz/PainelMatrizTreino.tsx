"use client";

import React, { useMemo, useState } from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { montarMatrizTreino, LinhaMatrizTreino } from "@/lib/matriz/montagem";
import { validarInvariantes } from "@/lib/matriz/invariantes";
import {
  Table,
  AlertTriangle,
  Download,
  BarChart3,
  Sliders,
  CheckCircle,
  FileSpreadsheet,
} from "lucide-react";

export function PainelMatrizTreino() {
  const { pontos, rotulosConsolidados } = useSarelStore();

  const [modo, setModo] = useState<"D" | "P">("D");
  const [excluirAmbigua, setExcluirAmbigua] = useState<boolean>(false);

  // Montagem da matriz com base nas opções ativas
  const resultadoMatriz = useMemo(() => {
    try {
      return montarMatrizTreino(pontos, rotulosConsolidados, {
        modo,
        excluirAmbigua,
        excluirDivergenciasPendentes: true,
      });
    } catch (err) {
      return {
        linhas: [],
        metadados: {
          totalAmostras: 0,
          modo,
          distribuicaoClasses: { ausente: 0, incipiente: 0, moderada: 0, severa: 0 },
          prevalenciaPositivaPct: 0,
          distribuicaoBlocosEspaciais: {},
          colunasFeatures: [],
          colunasProibidasVerificadasAusentes: [],
          avisos: [err instanceof Error ? err.message : "Erro na montagem da matriz"],
        },
      };
    }
  }, [pontos, rotulosConsolidados, modo, excluirAmbigua]);

  // Validação dos Invariantes (especialmente Invariante 7 em tempo real)
  const validacaoInvariantes = useMemo(() => {
    return validarInvariantes(pontos);
  }, [pontos]);

  const violacoesInvariante7 = validacaoInvariantes.violacoes.filter((v) => v.invariante === 7);

  // Função de download CSV da matriz gerada
  function baixarMatrizCsv() {
    if (resultadoMatriz.linhas.length === 0) return;

    const chaves = Object.keys(resultadoMatriz.linhas[0]) as (keyof LinhaMatrizTreino)[];
    const cabecalho = chaves.join(";");
    const linhasCsv = resultadoMatriz.linhas.map((linha) =>
      chaves.map((k) => (linha[k] === null || linha[k] === undefined ? "" : String(linha[k]))).join(";")
    );

    const conteudoCompleto = [cabecalho, ...linhasCsv].join("\n");
    const blob = new Blob(["\uFEFF" + conteudoCompleto], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `matriz_treino_sarel_${modo}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const { metadados, linhas } = resultadoMatriz;

  return (
    <div className="space-y-6">
      {/* Alerta Ativo de Baixa Variância (Invariante 7 em tempo real) */}
      {violacoesInvariante7.length > 0 && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-rose-800">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <span>ALERTA ATIVO DO INVARIANTE 7 (Constante Disfarçada Detectada)</span>
          </div>
          <p className="mt-1 text-xs text-rose-700">
            O Invariante 7 detectou coluna numérica com valor idêntico em 100% das linhas para n &gt; 20.
            A exportação será bloqueada até que a medição contenha variância natural legítima.
          </p>
          <ul className="mt-2 list-inside list-disc text-xs font-mono text-rose-800">
            {violacoesInvariante7.map((v, i) => (
              <li key={i}>{v.mensagem}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Controles e Resumo de Métricas da Matriz */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total de Amostras Rotuladas */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Amostras Rotuladas Elegíveis</span>
            <Table className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{metadados.totalAmostras}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {pontos.length - metadados.totalAmostras} aguardando rotulagem ou desempate
          </p>
        </div>

        {/* Prevalência de Classes Positivas */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Prevalência Positiva (Erosão)</span>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-blue-600">
            {metadados.prevalenciaPositivaPct}%
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Classes Moderada + Severa sobre o conjunto total
          </p>
        </div>

        {/* Distribuição de Classes */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Balanço de Rótulos</span>
          <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-xs">
            <span className="text-slate-700">Ausente: <b>{metadados.distribuicaoClasses.ausente}</b></span>
            <span className="text-amber-700">Incip.: <b>{metadados.distribuicaoClasses.incipiente}</b></span>
            <span className="text-blue-700">Mod.: <b>{metadados.distribuicaoClasses.moderada}</b></span>
            <span className="text-rose-700">Severa: <b>{metadados.distribuicaoClasses.severa}</b></span>
          </div>
        </div>

        {/* Auditoria da Regra 4 */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Auditoria Regra 4</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-xs font-bold text-emerald-700">
            {metadados.colunasProibidasVerificadasAusentes.length} colunas proibidas auditadas
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Nenhum score, estrato, severidade ou RUSLE vazado
          </p>
        </div>
      </div>

      {/* Barra de Opções e Exportação */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-1.5 font-bold">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <span>Configurações Metodológicas:</span>
          </div>

          {/* Alternador Modelo D / Modelo P */}
          <div className="flex items-center gap-1.5">
            <label className="text-slate-500">Janela Temporal:</label>
            <select
              value={modo}
              onChange={(e) => setModo(e.target.value as "D" | "P")}
              className="rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800"
            >
              <option value="D">Modelo D (Detecção: série até a data do rótulo)</option>
              <option value="P">Modelo P (Predição: encerra antes com guarda temporal)</option>
            </select>
          </div>

          {/* Toggle Excluir Amígua */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={excluirAmbigua}
              onChange={(e) => setExcluirAmbigua(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Excluir classe ambígua (&quot;incipiente&quot;) para afiar fronteira (§3 da Etapa 0)</span>
          </label>
        </div>

        <button
          onClick={baixarMatrizCsv}
          disabled={linhas.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Exportar Matriz de Treino (CSV UTF-8)
        </button>
      </div>

      {/* Tabela de Amostras da Matriz */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Visualização Tabular da Matriz de Treino ({linhas.length} linhas, {metadados.colunasFeatures.length + 5} colunas)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Formato pronto para ingestão em Python (XGBoost / scikit-learn)
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 text-left font-mono text-[11px]">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2.5">Código</th>
                <th className="px-3 py-2.5">Bloco Espacial</th>
                <th className="px-3 py-2.5 text-emerald-700">Target (Binário)</th>
                <th className="px-3 py-2.5">Classe Rótulo</th>
                <th className="px-3 py-2.5">Decliv. (%)</th>
                <th className="px-3 py-2.5">Elevação (m)</th>
                <th className="px-3 py-2.5">TWI</th>
                <th className="px-3 py-2.5">Solo Ordem</th>
                <th className="px-3 py-2.5">Freq. Solo Nu</th>
                <th className="px-3 py-2.5">Precip 90d</th>
                <th className="px-3 py-2.5">I30 Max</th>
                <th className="px-3 py-2.5">Índice Mecanismo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {linhas.slice(0, 15).map((linha) => (
                <tr key={linha.pontoId} className="hover:bg-slate-50/80">
                  <td className="px-3 py-2 font-bold text-slate-900">{linha.codigo}</td>
                  <td className="px-3 py-2 text-purple-700 font-semibold">{linha.blocoEspacial}</td>
                  <td className="px-3 py-2 font-bold">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] ${
                        linha.rotuloBinario === 1
                          ? "bg-rose-100 text-rose-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {linha.rotuloBinario}
                    </span>
                  </td>
                  <td className="px-3 py-2 capitalize font-sans">{linha.rotuloClasse}</td>
                  <td className="px-3 py-2">{linha.declividadePct ?? "null"}</td>
                  <td className="px-3 py-2">{linha.elevacao ?? "null"}</td>
                  <td className="px-3 py-2">{linha.twi ?? "null"}</td>
                  <td className="px-3 py-2 font-sans">{linha.ordemSolo ?? "null"}</td>
                  <td className="px-3 py-2">{linha.frequenciaSoloNu ?? "null"}</td>
                  <td className="px-3 py-2">{linha.precipAcum90d ?? "null"}</td>
                  <td className="px-3 py-2">{linha.i30Max ?? "null"}</td>
                  <td className="px-3 py-2">{linha.indiceMecanismo ?? "null"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {linhas.length > 15 && (
          <p className="mt-2 text-right text-[11px] text-slate-400 italic">
            Exibindo 15 de {linhas.length} linhas. Use o botão de exportação para baixar a tabela integral.
          </p>
        )}
      </div>
    </div>
  );
}
