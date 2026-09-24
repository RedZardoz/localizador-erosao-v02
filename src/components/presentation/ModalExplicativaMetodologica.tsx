"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Code2,
  Calculator,
  Compass,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  MapPin,
} from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import {
  CATALOGO_METODOLOGICO,
  PASSOS_TOUR_APRESENTACAO,
  obterItemMetodologico,
} from "@/config/tourMetodologico";
import type { ModalType } from "@/types/ui";

export const ModalExplicativaMetodologica: React.FC = () => {
  const {
    modalMetodologiaAberta,
    itemMetodologicoAtivoId,
    passoTourAtual,
    fecharModalMetodologia,
    avancarPassoTour,
    voltarPassoTour,
    setModalAtiva,
    setMapState,
    toggleSidebar,
    sidebarRecolhida,
  } = useSarelStore();

  const [copiado, setCopiado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"tudo" | "calculo" | "script">("tudo");
  const [revelado, setRevelado] = useState(false);
  const [espiandoBotao, setEspiandoBotao] = useState(false);

  // Efeito de Revelação em 2 Tempos:
  // Primeiro o observador visualiza o botão destacado na interface por 500ms;
  // em seguida, o card teórico com fórmulas e scripts surge suavemente.
  useEffect(() => {
    if (!itemMetodologicoAtivoId || !modalMetodologiaAberta) {
      setRevelado(false);
      setEspiandoBotao(false);
      return;
    }

    setRevelado(false);
    setEspiandoBotao(false);

    const timer = setTimeout(() => {
      setRevelado(true);
    }, 450);

    return () => clearTimeout(timer);
  }, [itemMetodologicoAtivoId, modalMetodologiaAberta]);

  if (!modalMetodologiaAberta || !itemMetodologicoAtivoId) {
    return null;
  }

  const item = obterItemMetodologico(itemMetodologicoAtivoId) || CATALOGO_METODOLOGICO["aoi-selector"];
  const totalPassos = PASSOS_TOUR_APRESENTACAO.length;
  const indicePasso = PASSOS_TOUR_APRESENTACAO.indexOf(item.id);
  const ehPassoTour = indicePasso !== -1;
  const numeroExibicaoPasso = ehPassoTour ? indicePasso + 1 : passoTourAtual + 1;

  const copiarCodigo = () => {
    if (item.script?.codigo) {
      navigator.clipboard.writeText(item.script.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const executarAcaoAtalho = () => {
    if (!item.acaoAtalho) return;

    if (item.acaoAtalho.tipo === "modal" && item.acaoAtalho.modalAlvo) {
      setModalAtiva(item.acaoAtalho.modalAlvo as ModalType);
    } else if (item.acaoAtalho.tipo === "terreno3d") {
      setMapState((prev) => ({ terreno3d: !prev.terreno3d }));
    } else if (item.acaoAtalho.tipo === "sidebar" && sidebarRecolhida) {
      toggleSidebar();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-start pt-20 sm:pt-24 pb-8 px-3 sm:px-6 overflow-y-auto light-popup"
    >
      {/* Botão de alternância flutuante caso o card esteja minimizado/espiando o botão */}
      {espiandoBotao && (
        <button
          onClick={() => setEspiandoBotao(false)}
          className="pointer-events-auto mt-4 px-5 py-2.5 bg-white hover:bg-emerald-50 text-slate-950 rounded-xl text-xs font-black shadow-2xl flex items-center gap-2 cursor-pointer animate-bounce border-2 border-emerald-500 ring-4 ring-black/20"
        >
          <Eye className="w-4 h-4 text-emerald-600" />
          <span>Restaurar Card Teórico da Função</span>
        </button>
      )}

      {/* Card da Teoria & Fórmulas (Sempre em Modo Claro de Alto Contraste + Código em Fundo Negro) */}
      <div
        className={`pointer-events-auto w-full max-w-4xl max-h-[calc(100vh-120px)] flex flex-col bg-white border-2 border-slate-300 ring-4 ring-black/30 rounded-2xl shadow-[0_25px_70px_-10px_rgba(0,0,0,0.75)] overflow-hidden transition-all duration-300 text-slate-900 ${
          revelado && !espiandoBotao
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Faixa Superior: Indicação Clara de Qual Botão Está em Destaque na Tela */}
        <div className="px-4 py-2.5 bg-amber-100 border-b border-amber-300 flex items-center justify-between text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping shrink-0" />
            <span className="font-semibold truncate">
              📍 Botão em Destaque na Interface: <strong className="font-black text-slate-950">{item.titulo}</strong>
            </span>
          </div>

          <button
            onClick={() => setEspiandoBotao(true)}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
            title="Ocultar card temporariamente para observar o botão destacado na interface"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Espiar Botão na Tela</span>
          </button>
        </div>

        {/* 1. Header do Modal com Identidade Científica (Modo Claro Puro) */}
        <div className="p-4 sm:p-5 border-b border-slate-300 bg-gradient-to-r from-emerald-50 via-white to-indigo-50 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0 mt-0.5">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-400">
                  {item.modulo}
                </span>
                {item.decisaoId && (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-extrabold bg-amber-100 text-amber-950 border border-amber-400">
                    Decisão {item.decisaoId}
                  </span>
                )}
                {ehPassoTour && (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-950 border border-indigo-300">
                    Passo {numeroExibicaoPasso} de {totalPassos}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">
                {item.titulo}
              </h2>
              <p className="text-xs text-slate-700 mt-0.5 font-semibold">
                {item.subtitulo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fecharModalMetodologia}
              className="p-1.5 text-slate-500 hover:text-slate-950 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Barra de Abas / Filtro Visual */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setAbaAtiva("tudo")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                abaAtiva === "tudo"
                  ? "bg-white text-emerald-800 shadow-sm border border-slate-300"
                  : "text-slate-700 hover:text-slate-950 hover:bg-white/60"
              }`}
            >
              Visão Completa
            </button>
            <button
              onClick={() => setAbaAtiva("calculo")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                abaAtiva === "calculo"
                  ? "bg-white text-emerald-800 shadow-sm border border-slate-300"
                  : "text-slate-700 hover:text-slate-950 hover:bg-white/60"
              }`}
            >
              Fórmula &amp; Variáveis
            </button>
            <button
              onClick={() => setAbaAtiva("script")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                abaAtiva === "script"
                  ? "bg-slate-950 text-emerald-300 shadow-sm border border-slate-800"
                  : "text-slate-700 hover:text-slate-950 hover:bg-white/60"
              }`}
            >
              Script Computacional
            </button>
          </div>

          {item.acaoAtalho && (
            <button
              onClick={executarAcaoAtalho}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{item.acaoAtalho.rotulo}</span>
            </button>
          )}
        </div>

        {/* 3. Conteúdo Rolável (Fundo Branco / Cartões Claros de Alto Contraste) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-white text-slate-900">
          {/* Bloco 1: O Que Faz & Como Usar */}
          {abaAtiva === "tudo" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-black text-slate-950 uppercase tracking-wider mb-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  O Que Esta Função Faz
                </div>
                <p className="text-xs leading-relaxed text-slate-800 font-medium">
                  {item.oQueFaz}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-black text-slate-950 uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Como Utilizar no Sistema
                </div>
                <p className="text-xs leading-relaxed text-slate-800 font-medium">
                  {item.comoUsar}
                </p>
              </div>
            </div>
          )}

          {/* Bloco 2: Mecanismo & Como Funciona */}
          {abaAtiva === "tudo" && (
            <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-300 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-950 uppercase tracking-wider mb-1.5">
                <Layers className="w-4 h-4 text-indigo-700" />
                Mecanismo Epistemológico &amp; Físico (Como Funciona)
              </div>
              <p className="text-xs leading-relaxed text-slate-900 font-medium">
                {item.comoFunciona}
              </p>
            </div>
          )}

          {/* Bloco 3: Cálculo Canônico & Formulação Matemática */}
          {(abaAtiva === "tudo" || abaAtiva === "calculo") && (
            <div className="p-4 rounded-xl bg-emerald-50/90 border-2 border-emerald-300 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-950 uppercase tracking-wider">
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  Cálculo Por Trás: {item.calculo.nome}
                </div>
                <span className="text-[10px] font-mono font-extrabold text-emerald-950 bg-emerald-200/80 border border-emerald-400 px-2.5 py-0.5 rounded">
                  Formulação Canônica
                </span>
              </div>

              {/* Display da Fórmula com Alto Contraste */}
              <div className="p-4 rounded-xl bg-white border-2 border-emerald-500 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                <span className="text-base sm:text-lg font-serif font-black text-slate-950 tracking-wide">
                  {item.calculo.formulaDescritiva}
                </span>
                <span className="text-[11px] font-mono font-semibold text-emerald-300 bg-[#050811] px-3 py-1 rounded-lg border border-slate-800 shadow-sm">
                  LaTeX: {item.calculo.formulaTex}
                </span>
              </div>

              {/* Tabela de Variáveis */}
              {item.calculo.variaveis.length > 0 && (
                <div className="pt-1">
                  <h4 className="text-[11px] font-extrabold text-slate-900 uppercase mb-2">
                    Variáveis do Sistema Internacional (SI) e Domínio:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.calculo.variaveis.map((v, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-white border border-slate-300 shadow-2xs flex items-center justify-between text-xs"
                      >
                        <span className="font-serif font-black text-emerald-900 mr-2 text-sm">
                          {v.simbolo}
                        </span>
                        <span className="text-slate-800 font-medium truncate flex-1 text-[11px]">
                          {v.significado}
                        </span>
                        {v.unidade && (
                          <span className="text-[10px] font-mono font-bold text-slate-800 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded ml-2 shrink-0">
                            [{v.unidade}]
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interpretação Mecânica */}
              <p className="text-xs text-slate-900 font-medium italic pt-2 border-t border-emerald-300">
                <strong className="font-black text-emerald-950 not-italic">Interpretação para a Banca:</strong> {item.calculo.interpretacao}
              </p>
            </div>
          )}

          {/* Bloco 4: Script & Código Executado (Fundo Negro de Alto Contraste) */}
          {(abaAtiva === "tudo" || abaAtiva === "script") && (
            <div className="p-4 rounded-xl bg-[#070b14] text-slate-100 border-2 border-slate-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5 text-xs font-extrabold text-white uppercase tracking-wider">
                  <div className="flex items-center gap-1 mr-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>Script de Processamento: {item.script.rotulo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700">
                    {item.script.linguagem}
                  </span>
                  <button
                    onClick={copiarCodigo}
                    className="p-1 px-2.5 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copiar snippet de código"
                  >
                    {copiado ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bloco de Código em Fundo Negro Puro */}
              <pre className="p-3.5 bg-[#020409] rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800/90 shadow-inner custom-scrollbar">
                <code>{item.script.codigo}</code>
              </pre>

              <p className="text-xs text-slate-300 font-medium">
                {item.script.explicacao}
              </p>
            </div>
          )}

          {/* Bloco 5: Referência Oficial e Blindagem Metodológica */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-2.5 shadow-2xs">
            <BookOpen className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-black text-amber-950">
                Literatura e Fundamentação Científica:
              </span>{" "}
              <span className="text-slate-900 font-medium">
                {item.referencia}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Footer com Controles de Navegação da Tour */}
        <div className="p-3.5 sm:p-4 border-t border-slate-300 bg-slate-100 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Pressione <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 text-slate-950 rounded font-mono font-bold text-[10px] shadow-2xs">Espaço</kbd> para alternar visão do botão na tela.
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {ehPassoTour && (
              <>
                <button
                  onClick={voltarPassoTour}
                  disabled={indicePasso === 0}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-white text-slate-900 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Passo anterior (Seta Esquerda)"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <button
                  onClick={avancarPassoTour}
                  disabled={indicePasso === totalPassos - 1}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1 cursor-pointer"
                  title="Próximo passo (Seta Direita)"
                >
                  <span>Próximo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={fecharModalMetodologia}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
