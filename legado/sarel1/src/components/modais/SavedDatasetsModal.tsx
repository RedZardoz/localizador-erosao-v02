"use client";

import React, { useState } from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { FolderArchive, Save, Upload, Download, Trash2, CheckCircle2, X } from "lucide-react";

interface ColecaoSalva {
  id: string;
  nome: string;
  data: string;
  qtdPontos: number;
  aoiNome: string;
  pontos: any[];
}

export function SavedDatasetsModal() {
  const { pontos, aoiAtiva, carregarPontos, fecharModal } = useSarelStore();
  const [nomeColecao, setNomeColecao] = useState(`Campanha ${aoiAtiva.nome} - ${new Date().toLocaleDateString("pt-BR")}`);
  const [colecoes, setColecoes] = useState<ColecaoSalva[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("sarel_colecoes_salvas");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [sucesso, setSucesso] = useState(false);

  function salvarColecaoAtual() {
    const nova: ColecaoSalva = {
      id: "col-" + Date.now(),
      nome: nomeColecao.trim() || `Coleção ${Date.now()}`,
      data: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      qtdPontos: pontos.length,
      aoiNome: aoiAtiva.nome,
      pontos,
    };

    const atualizadas = [nova, ...colecoes];
    setColecoes(atualizadas);
    try {
      localStorage.setItem("sarel_colecoes_salvas", JSON.stringify(atualizadas));
    } catch (e) {
      console.error(e);
    }
    setSucesso(true);
    setTimeout(() => setSucesso(false), 2000);
  }

  function carregarColecao(col: ColecaoSalva) {
    carregarPontos(col.pontos);
    fecharModal();
  }

  function excluirColecao(id: string) {
    const filtradas = colecoes.filter((c) => c.id !== id);
    setColecoes(filtradas);
    try {
      localStorage.setItem("sarel_colecoes_salvas", JSON.stringify(filtradas));
    } catch (e) {
      console.error(e);
    }
  }

  function exportarJsonColecao(col: ColecaoSalva) {
    const str = JSON.stringify(col, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Projeto_${col.nome.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full max-w-xl flex-col rounded-2xl border border-slate-700/60 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <FolderArchive className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Projetos &amp; Coleções de Amostragem</h2>
              <p className="text-xs text-slate-400">
                Gerencie snapshots de pontos amostrais e importe/exporte projetos de pesquisa
              </p>
            </div>
          </div>
          <button
            onClick={fecharModal}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-5">
          {/* Seção Salvar Coleção Atual */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4 space-y-2.5">
            <span className="text-xs font-bold text-slate-200">Salvar Seleção Atual ({pontos.length} pontos):</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={nomeColecao}
                onChange={(e) => setNomeColecao(e.target.value)}
                placeholder="Nome da coleção (ex: Amostragem Tibagi Safra 2026)..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={salvarColecaoAtual}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-500 transition-all"
              >
                {sucesso ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
                {sucesso ? "Salvo!" : "Salvar"}
              </button>
            </div>
          </div>

          {/* Lista de Coleções */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300">Coleções Salvas em Memória:</span>
            {colecoes.length === 0 ? (
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-6 text-center text-xs text-slate-500">
                Nenhuma coleção salva localmente ainda. Salve a seleção atual acima.
              </div>
            ) : (
              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                {colecoes.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-3 hover:bg-slate-800/70 transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{c.nome}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {c.qtdPontos} pontos · {c.aoiNome} · {c.data}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => carregarColecao(c)}
                        className="rounded-lg bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-purple-300 hover:bg-purple-900/40 border border-purple-800/40"
                      >
                        Carregar
                      </button>
                      <button
                        onClick={() => exportarJsonColecao(c)}
                        title="Exportar JSON"
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => excluirColecao(c.id)}
                        title="Excluir"
                        className="rounded-lg p-1 text-slate-500 hover:bg-rose-950/50 hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end border-t border-slate-800 px-6 py-3.5 bg-slate-900/90 rounded-b-2xl">
          <button
            onClick={fecharModal}
            className="rounded-xl px-4 py-1.5 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
