"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Sparkles, ArrowUp, ArrowDown } from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import { obterItemMetodologico } from "@/config/tourMetodologico";

interface ElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
}

interface ApresentacaoSpotlightProps {
  destaqueApenas?: boolean;
}

export const ApresentacaoSpotlight: React.FC<ApresentacaoSpotlightProps> = () => {
  const {
    modoApresentacaoAtivo,
    modalMetodologiaAberta,
    itemMetodologicoAtivoId,
  } = useSarelStore();

  const [rect, setRect] = useState<ElementRect | null>(null);
  const [nomeElemento, setNomeElemento] = useState<string>("");

  const atualizarPosicao = useCallback(() => {
    if (!modoApresentacaoAtivo || !itemMetodologicoAtivoId) {
      setRect(null);
      return;
    }

    const item = obterItemMetodologico(itemMetodologicoAtivoId);
    if (!item?.seletorAlvo) {
      setRect(null);
      return;
    }

    let elemento = document.querySelector(item.seletorAlvo) as HTMLElement | null;

    // Fallback gracioso: se o item for de configuração e o menu ainda estiver abrindo, foca na engrenagem
    if (!elemento && (item.id === "config-api" || item.id === "decisoes-metodologicas" || item.id === "diagnostico")) {
      elemento = document.querySelector('[data-metodologia="menu-configuracoes"]') as HTMLElement | null;
    }

    if (elemento) {
      const r = elemento.getBoundingClientRect();
      setRect({
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        top: r.top,
        left: r.left,
        bottom: r.bottom,
        right: r.right,
      });
      setNomeElemento(item.titulo);
    } else {
      setRect(null);
    }
  }, [modoApresentacaoAtivo, itemMetodologicoAtivoId]);

  // Rola suavemente até o elemento uma única vez quando o passo da tour mudar (com delay para abertura de menus)
  useEffect(() => {
    if (!modoApresentacaoAtivo || !itemMetodologicoAtivoId) return;
    const item = obterItemMetodologico(itemMetodologicoAtivoId);
    if (!item?.seletorAlvo) return;

    const timer = setTimeout(() => {
      const elemento = document.querySelector(item.seletorAlvo) as HTMLElement | null;
      if (elemento) {
        elemento.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [modoApresentacaoAtivo, itemMetodologicoAtivoId]);

  useEffect(() => {
    atualizarPosicao();

    // Re-calcula em scroll e resize para acompanhar animações e responsividade
    window.addEventListener("resize", atualizarPosicao);
    window.addEventListener("scroll", atualizarPosicao, true);

    const intervalo = setInterval(atualizarPosicao, 300);

    return () => {
      window.removeEventListener("resize", atualizarPosicao);
      window.removeEventListener("scroll", atualizarPosicao, true);
      clearInterval(intervalo);
    };
  }, [atualizarPosicao]);

  if (!modoApresentacaoAtivo || !modalMetodologiaAberta) {
    return null;
  }

  const padding = 6;
  const rx = 12;

  // Determina posição do ponteiro indicador (abaixo se o botão está no topo, acima se está na base)
  const indicadorAbaixo = rect ? rect.top <= 140 : true;

  return (
    <div className="fixed inset-0 z-45 pointer-events-none transition-all duration-300">
      {/* 1. Máscara SVG recortando fisicamente o botão em foco com transparência 100% */}
      <svg className="w-full h-full absolute inset-0">
        <defs>
          <filter id="spotlight-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <mask id="spotlight-cutout-mask">
            {/* Fundo Branco = escurece a tela inteira */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Janela Negra = recorte onde a luz passa 100% pura para o botão */}
            {rect && (
              <rect
                x={rect.left - padding}
                y={rect.top - padding}
                width={rect.width + padding * 2}
                height={rect.height + padding * 2}
                rx={rx}
                ry={rx}
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Backdrop escurecido usando a máscara com recorte */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.72)"
          mask="url(#spotlight-cutout-mask)"
        />

        {/* Borda dourada/esmeralda brilhante pulsando ao redor do botão */}
        {rect && (
          <>
            <rect
              x={rect.left - padding}
              y={rect.top - padding}
              width={rect.width + padding * 2}
              height={rect.height + padding * 2}
              rx={rx}
              ry={rx}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="3"
              filter="url(#spotlight-glow)"
              className="animate-pulse"
            />
            <rect
              x={rect.left - padding - 4}
              y={rect.top - padding - 4}
              width={rect.width + padding * 2 + 8}
              height={rect.height + padding * 2 + 8}
              rx={rx + 2}
              ry={rx + 2}
              fill="none"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="animate-spin-slow opacity-80"
            />
          </>
        )}
      </svg>

      {/* 2. Badge / Ponteiro Flutuante Ancorado diretamente no botão */}
      {rect && (
        <div
          className="absolute transition-all duration-300 pointer-events-auto"
          style={{
            left: Math.max(16, Math.min(window.innerWidth - 320, rect.left + rect.width / 2 - 140)),
            top: indicadorAbaixo
              ? rect.bottom + 14
              : Math.max(10, rect.top - 46),
          }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 text-white font-bold text-xs shadow-2xl shadow-amber-500/40 border border-amber-300 animate-bounce">
            {indicadorAbaixo ? (
              <ArrowUp className="w-4 h-4 text-white shrink-0 animate-pulse" />
            ) : (
              <ArrowDown className="w-4 h-4 text-white shrink-0 animate-pulse" />
            )}
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span className="truncate max-w-[240px]">
              Função em Análise: {nomeElemento}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
