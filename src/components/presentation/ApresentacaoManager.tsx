"use client";

import React, { useEffect } from "react";
import { GraduationCap, Play, X, Sparkles, HelpCircle } from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import {
  CATALOGO_METODOLOGICO,
  PASSOS_TOUR_APRESENTACAO,
  obterItemMetodologico,
} from "@/config/tourMetodologico";

export const ApresentacaoManager: React.FC = () => {
  const {
    modoApresentacaoAtivo,
    modalMetodologiaAberta,
    itemMetodologicoAtivoId,
    passoTourAtual,
    toggleModoApresentacao,
    iniciarTour,
    avancarPassoTour,
    voltarPassoTour,
    abrirItemMetodologico,
    fecharModalMetodologia,
  } = useSarelStore();

  // 1. Interceptação global do Botão Direito do Mouse (ContextMenu)
  useEffect(() => {
    if (!modoApresentacaoAtivo) return;

    const tratarCliqueDireito = (e: MouseEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (!alvo) return;

      // Busca o elemento mais próximo com anotação metodológica
      const elementoMetodologia = alvo.closest("[data-metodologia]") as HTMLElement | null;

      if (elementoMetodologia) {
        const idMetodologia = elementoMetodologia.getAttribute("data-metodologia");
        if (idMetodologia && CATALOGO_METODOLOGICO[idMetodologia]) {
          e.preventDefault();
          e.stopPropagation();
          abrirItemMetodologico(idMetodologia);
        }
      }
    };

    window.addEventListener("contextmenu", tratarCliqueDireito, true);
    return () => {
      window.removeEventListener("contextmenu", tratarCliqueDireito, true);
    };
  }, [modoApresentacaoAtivo, abrirItemMetodologico]);

  // 2. Atalhos de Teclado (Navegação da Tour e Fechamento)
  useEffect(() => {
    if (!modoApresentacaoAtivo) return;

    const tratarTeclas = (e: KeyboardEvent) => {
      // Ignora digitação em inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (modalMetodologiaAberta) {
        if (e.key === "ArrowRight" || e.key.toLowerCase() === "n") {
          e.preventDefault();
          avancarPassoTour();
        } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "p") {
          e.preventDefault();
          voltarPassoTour();
        } else if (e.key === "Escape") {
          e.preventDefault();
          fecharModalMetodologia();
        }
      }
    };

    window.addEventListener("keydown", tratarTeclas);
    return () => {
      window.removeEventListener("keydown", tratarTeclas);
    };
  }, [
    modoApresentacaoAtivo,
    modalMetodologiaAberta,
    avancarPassoTour,
    voltarPassoTour,
    fecharModalMetodologia,
  ]);

  // 3. Efeito Visual de Destaque (Spotlight) no Elemento em Foco
  useEffect(() => {
    if (!modoApresentacaoAtivo || !modalMetodologiaAberta || !itemMetodologicoAtivoId) {
      return;
    }

    const item = obterItemMetodologico(itemMetodologicoAtivoId);
    if (!item?.seletorAlvo) return;

    const elemento = document.querySelector(item.seletorAlvo);
    if (elemento) {
      elemento.classList.add(
        "ring-4",
        "ring-emerald-500",
        "ring-offset-2",
        "dark:ring-offset-slate-900",
        "transition-all",
        "duration-300"
      );

      // Scroll suave até o elemento se necessário
      elemento.scrollIntoView({ behavior: "smooth", block: "nearest" });

      return () => {
        elemento.classList.remove(
          "ring-4",
          "ring-emerald-500",
          "ring-offset-2",
          "dark:ring-offset-slate-900"
        );
      };
    }
  }, [modoApresentacaoAtivo, modalMetodologiaAberta, itemMetodologicoAtivoId]);

  if (!modoApresentacaoAtivo) {
    return null;
  }

  return (
    <>
      {/* Banner Flutuante Inferior do Modo de Apresentação */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] sm:max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 dark:border-emerald-600/50 rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-2xl flex items-center justify-between gap-3 text-slate-800 dark:text-slate-200 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white uppercase">
                Modo Defesa / Apresentação Ativo
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Clique com o <strong className="text-emerald-700 dark:text-emerald-400">botão direito</strong> em qualquer função para ver fórmulas e scripts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!modalMetodologiaAberta ? (
            <button
              onClick={iniciarTour}
              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Iniciar percurso sequencial da metodologia"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Iniciar Tour</span>
            </button>
          ) : (
            <button
              onClick={() => abrirItemMetodologico(PASSOS_TOUR_APRESENTACAO[passoTourAtual])}
              className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ver Card Atual</span>
            </button>
          )}

          <button
            onClick={toggleModoApresentacao}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Sair do Modo de Apresentação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};
