"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  AlertTriangle,
  Key,
  ShieldCheck,
  Save,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Layers,
} from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import type { PontoAmostral } from "@/types/ponto";
import { gerarPlanilhaXLSX } from "@/lib/export/planilha";

export const CandidateSelectionModal: React.FC = () => {
  const {
    modalAtiva,
    setModalAtiva,
    credenciais,
    areas,
    alternarAreaAtiva,
    pontosProvisorios,
    carregarPontosProvisorios,
    salvarPontosProvisorios,
    descartarPontosProvisorios,
    adicionarLog,
  } = useSarelStore();

  const [tamanhoAmostra, setTamanhoAmostra] = useState<number>(50);
  const [raioThinningKm, setRaioThinningKm] = useState<number>(5.0);
  const [frequenciaSoloNuMin, setFrequenciaSoloNuMin] = useState<number>(0.15);
  const [declividadeMin, setDeclividadeMin] = useState<number>(3.0);
  const [declividadeMax, setDeclividadeMax] = useState<number>(20.0);
  const [processando, setProcessando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (modalAtiva !== "candidates") return null;

  const geeAtivo = credenciais.geeSessionActive;
  const areasAtivas = areas.filter((a) => a.ativa);

  const executarEleicaoAmostral = async () => {
    if (!geeAtivo) return;
    if (areasAtivas.length === 0) {
      setErro("Nenhuma área ativada. Ative ao menos uma área abaixo.");
      return;
    }
    if (declividadeMax <= declividadeMin) {
      setErro("Declividade máxima deve ser estritamente maior que a declividade mínima.");
      return;
    }

    setProcessando(true);
    setErro(null);
    setMensagemSucesso(null);

    try {
      const res = await fetch("/api/gee/select-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tamanhoAmostra,
          raioThinningKm,
          frequenciaSoloNuMin,
          declividadeMin,
          declividadeMax,
          areas: areasAtivas.map((a) => ({
            id: a.id,
            tipo: a.tipo,
            nome: a.nome,
            geometry: a.geometry,
            codigoIbge: a.codigoIbge,
          })),
        }),
      });

      const dados = await res.json().catch(() => null);

      if (res.ok && dados?.pontos && Array.isArray(dados.pontos)) {
        carregarPontosProvisorios(dados.pontos);
        setMensagemSucesso(
          dados.pontos.length + " pontos eleitos com sucesso e mantidos em Memória Provisória."
        );
      } else {
        throw new Error(
          dados?.error ||
            "Falha na execução do script Earth Engine no servidor. Verifique a sessão do GEE."
        );
      }
    } catch (err: any) {
      setErro(err.message || "Erro durante o processamento da amostragem.");
      adicionarLog("error", "GEE-Sampling", err.message || "Erro na amostragem.");
    } finally {
      setProcessando(false);
    }
  };

  const handleImprimirPlanilha = async () => {
    if (pontosProvisorios.length === 0) return;
    try {
      const buffer = await gerarPlanilhaXLSX(pontosProvisorios);
      const blob = new Blob([buffer as any], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sarel_amostras_provisorias_" + Date.now() + ".xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Eleição Amostral no Google Earth Engine (GEE)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Estratificação cruzada (Solo ⊗ Relevo ⊗ Freq. Solo Nu), Thinning e Blocos Espaciais
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalAtiva(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* AVISO OBRIGATÓRIO: API CONECTADA E ATIVA (Requisito Estrito) */}
          {!geeAtivo && (
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Atenção: Conexão com o Google Earth Engine Desativada</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Os pontos somente podem ser eleitos com as APIs conectadas e ativas.
                Para garantir dados verdadeiros e auditáveis sem fabricação sintética,
                é necessário ativar a Service Account GCP antes de disparar a eleição.
              </p>
              <div className="pt-1">
                <button
                  onClick={() => setModalAtiva("settings")}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  Ir para Conexão &amp; Chaves API
                </button>
              </div>
            </div>
          )}

          {/* Seção de Áreas Ativáveis / Desativáveis */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Áreas Incluídas na Eleição Amostral ({areasAtivas.length} ativas)
            </span>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto custom-scrollbar pt-1">
              {areas.map((a) => (
                <label
                  key={a.id}
                  className={"px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all " + (
                    a.ativa
                      ? "bg-white dark:bg-slate-800 border-emerald-500 font-semibold text-slate-900 dark:text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-500 opacity-60"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={a.ativa}
                    onChange={() => alternarAreaAtiva(a.id)}
                    className="accent-emerald-600 h-3.5 w-3.5 rounded"
                  />
                  <span>{a.nome}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Parâmetros Metodológicos */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Quantidade de Candidatos
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={tamanhoAmostra}
                onChange={(e) => setTamanhoAmostra(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Raio de Thinning Espacial (km)
              </label>
              <input
                type="number"
                step="0.5"
                min="1.0"
                max="25.0"
                value={raioThinningKm}
                onChange={(e) => setRaioThinningKm(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Frequência Solo Nu Mínima (0 a 1)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.05"
                max="0.80"
                value={frequenciaSoloNuMin}
                onChange={(e) => setFrequenciaSoloNuMin(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Declividade Mínima DEM (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="30"
                value={declividadeMin}
                onChange={(e) => setDeclividadeMin(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1 col-span-2 sm:col-span-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Declividade Máxima DEM (%)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="60"
                value={declividadeMax}
                onChange={(e) => setDeclividadeMax(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Feedback de Sucesso ou Erro */}
          {mensagemSucesso && (
            <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {erro && (
            <div className="p-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* SEÇÃO DE MEMÓRIA PROVISÓRIA (Requisito Estrito) */}
          {pontosProvisorios.length > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <Save className="w-4 h-4" />
                  {pontosProvisorios.length} Pontos em Memória Provisória (Não Salvos)
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Dados voláteis
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Os dados eleitos permanecem nesta tela até você decidir salvar na base,
                imprimir em planilha de dissertação ou descartar/limpar a tela.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={salvarPontosProvisorios}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar em Projeto
                </button>

                <button
                  onClick={handleImprimirPlanilha}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Imprimir em Planilha XLSX
                </button>

                <button
                  onClick={descartarPontosProvisorios}
                  className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/70 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-300 rounded-lg font-semibold text-xs flex items-center gap-1.5 border border-rose-300 dark:border-rose-800 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Tela / Descartar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer com Botão de Processar Bloqueado sem API */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Regras 1 a 9 ativas: Zero dados sintéticos</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setModalAtiva(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={executarEleicaoAmostral}
              disabled={!geeAtivo || processando}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              {processando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processando no GEE...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Eleger Pontos Reais no GEE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
