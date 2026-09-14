"use client";

import React, { useState } from "react";
import {
  PenTool,
  RotateCcw,
  X,
  Check,
  Layers,
  Save,
} from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";

export const DrawingToolbar: React.FC = () => {
  const {
    modoDesenhoAtivo,
    setModoDesenhoAtivo,
    poligonoDesenhando,
    desfazerVerticeDesenho,
    cancelarDesenho,
    concluirDesenhoTalhao,
    areas,
  } = useSarelStore();

  const [modalSalvarAberto, setModalSalvarAberto] = useState(false);
  const [nomeTalhao, setNomeTalhao] = useState("");
  const [categoria, setCategoria] = useState("Talhão Agrícola");

  const numVertices = poligonoDesenhando.length;
  const talhoesExistentes = areas.filter((a) => a.tipo === "talhao");

  const abrirSalvar = () => {
    if (numVertices < 3) return;
    setNomeTalhao(`Talhão ${talhoesExistentes.length + 1}`);
    setModalSalvarAberto(true);
  };

  const confirmarSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    concluirDesenhoTalhao(nomeTalhao, categoria);
    setModalSalvarAberto(false);
  };

  return (
    <>
      {/* Barra flutuante superior de desenho */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {!modoDesenhoAtivo ? (
          <button
            onClick={() => setModoDesenhoAtivo(true)}
            className="px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl shadow-lg backdrop-blur-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer group"
          >
            <PenTool className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Delimitar Talhão / Polígono</span>
            {talhoesExistentes.length > 0 && (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                {talhoesExistentes.length}
              </span>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-slate-900/95 text-white border border-emerald-500/50 px-3.5 py-2 rounded-xl shadow-2xl backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Desenhando na Tela</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                {numVertices} {numVertices === 1 ? "vértice" : "vértices"}
              </span>
            </div>

            <button
              onClick={desfazerVerticeDesenho}
              disabled={numVertices === 0}
              className="p-1.5 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Desfazer último vértice"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={cancelarDesenho}
              className="px-2.5 py-1 hover:bg-rose-950/50 text-slate-300 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              onClick={abrirSalvar}
              disabled={numVertices < 3}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Concluir &amp; Salvar</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal para nomear e salvar o talhão delimitado */}
      {modalSalvarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Save className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Salvar Talhão / Polígono Delimitado
              </h3>
              <button
                onClick={() => setModalSalvarAberto(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={confirmarSalvar} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nome ou Identificação do Talhão
                </label>
                <input
                  type="text"
                  required
                  value={nomeTalhao}
                  onChange={(e) => setNomeTalhao(e.target.value)}
                  placeholder="Ex: Talhão 01 - Fazenda Rio Bonito"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Categoria
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Talhão Agrícola">Talhão Agrícola (Lavoura)</option>
                  <option value="Foco de Erosão">Foco de Erosão / Ravina</option>
                  <option value="Área de Pastagem">Área de Pastagem</option>
                  <option value="Reserva / APP">Reserva Legal / APP</option>
                  <option value="Outro">Outro Polígono de Estudo</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                <p>
                  ✓ Este polígono permanecerá renderizado na tela e servirá de máscara delimitadora na próxima <strong>Amostragem GEE</strong>.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalSalvarAberto(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  Salvar Talhão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
