"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  GraduationCap,
  ShieldAlert,
  Info,
  X,
  Compass,
  Lock,
  CheckCircle2,
  Eye,
} from "lucide-react";
import {
  IS_VITRINE_DEMONSTRACAO,
  DATA_ESTADO_VITRINE,
} from "@/config/vitrineDemonstracao";
import { PONTOS_DEMONSTRACAO_VITRINE } from "@/config/pontosDemonstracao";
import { useSarelStore } from "@/store/useSarelStore";

export const VitrineDemonstracaoBanner: React.FC<{
  onAbrirBoasVindas: () => void;
}> = ({ onAbrirBoasVindas }) => {
  const { iniciarTour } = useSarelStore();

  if (!IS_VITRINE_DEMONSTRACAO) return null;

  return (
    <div
      role="region"
      aria-label="Aviso permanente de demonstração estática"
      className="w-full bg-amber-500 text-slate-950 px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-black shadow-md z-50 border-b-2 border-amber-700 shrink-0"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          MOCKUP DEMONSTRATIVO
        </span>
        <span className="truncate">
          DEMONSTRAÇÃO ESTÁTICA • SAREL v2.0 • OPERAÇÃO DESABILITADA • DADOS SINTÉTICOS • ESTADO: {DATA_ESTADO_VITRINE}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={iniciarTour}
          className="px-2.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-amber-300 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          title="Abrir o roteiro interativo completo com as 17 etapas do tour metodológico"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Iniciar Tour (17 Etapas)</span>
        </button>

        <button
          type="button"
          onClick={onAbrirBoasVindas}
          className="px-2.5 py-0.5 bg-amber-300/80 hover:bg-amber-200 text-slate-950 border border-amber-800/40 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Sobre este Mockup</span>
        </button>
      </div>
    </div>
  );
};

export const VitrineDemonstracaoController: React.FC = () => {
  const [boasVindasAberta, setBoasVindasAberta] = useState<boolean>(
    IS_VITRINE_DEMONSTRACAO
  );
  const inicializouMapa = useRef(false);
  const {
    pontos,
    pontoAuditoria,
    carregarPontosDemonstracaoVitrine,
    setPontoAuditoria,
    setMapState,
    iniciarTour,
  } = useSarelStore();

  useEffect(() => {
    if (!IS_VITRINE_DEMONSTRACAO) return;

    if (typeof document !== "undefined") {
      document.title =
        "[MOCKUP DEMONSTRATIVO] SAREL v2.0 — Demonstração Estática (PPGTCA 2026)";
    }

    if (pontos.length === 0) {
      carregarPontosDemonstracaoVitrine(PONTOS_DEMONSTRACAO_VITRINE);
    }

    if (!pontoAuditoria && PONTOS_DEMONSTRACAO_VITRINE.length > 0) {
      setPontoAuditoria(PONTOS_DEMONSTRACAO_VITRINE[0]);
    }

    if (!inicializouMapa.current) {
      inicializouMapa.current = true;
      setMapState({
        mostrarBacias: true,
        mostrarLimites: true,
        terreno3d: false,
      });
    }
  }, [
    pontos.length,
    pontoAuditoria,
    carregarPontosDemonstracaoVitrine,
    setPontoAuditoria,
    setMapState,
  ]);

  if (!IS_VITRINE_DEMONSTRACAO) return null;

  return (
    <>
      <VitrineDemonstracaoBanner
        onAbrirBoasVindas={() => setBoasVindasAberta(true)}
      />

      {boasVindasAberta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-boas-vindas-vitrine"
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white text-slate-900 border-2 border-amber-500 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Cabeçalho */}
            <div className="bg-amber-500 px-5 py-4 flex items-center justify-between text-slate-950 border-b border-amber-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shadow shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2
                    id="titulo-boas-vindas-vitrine"
                    className="text-base font-black tracking-tight uppercase"
                  >
                    SAREL v2.0 — Mockup Demonstrativo para Navegador
                  </h2>
                  <p className="text-xs font-bold text-slate-900">
                    Versão Estática de Inspeção • Data do Estado Retratado:{" "}
                    {DATA_ESTADO_VITRINE}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBoasVindasAberta(false)}
                aria-label="Fechar tela inicial do mockup"
                className="p-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-slate-950 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950">
                <p className="font-bold text-sm mb-1">
                  O que é este pacote?
                </p>
                <p>
                  Trata-se de uma exportação estática (somente leitura) da interface do{" "}
                  <strong>SAREL v2.0</strong> (PPGTCA/UTFPR), construída especificamente
                  para que orientadores, banca examinadora e financiadores naveguem pela
                  arquitetura e pelo rigor metodológico da pesquisa{" "}
                  <strong>sem operar o sistema real</strong> e{" "}
                  <strong>sem risco de vazamento de dados ou credenciais</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <h3 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    O que esta demonstração mostra
                  </h3>
                  <ul className="space-y-1 text-emerald-950 text-[11px] list-disc pl-4">
                    <li>
                      Casca de navegação completa nas <strong>8 etapas</strong> do fluxo
                      (Área, Triagem, Medição, Sorteio, Voos, Campo, Matriz e Auditoria).
                    </li>
                    <li>
                      <strong>Tour Metodológico em 17 etapas</strong> com fórmulas, scripts e
                      destaques na interface.
                    </li>
                    <li>
                      <strong>26 Decisões (D01–D26)</strong>, 16 Parâmetros e Selo Público
                      D16 redigido.
                    </li>
                    <li>
                      <strong>12 registros sintéticos</strong> (<code>SINTETICO_NAO_VOAR_</code>)
                      com coordenadas deslocadas no Paraná.
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <h3 className="font-bold text-rose-900 flex items-center gap-1.5 text-xs uppercase">
                    <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                    O que NÃO faz (travas estáticas)
                  </h3>
                  <ul className="space-y-1 text-rose-950 text-[11px] list-disc pl-4">
                    <li>
                      <strong>Zero rotas de API</strong>: compilado sem servidor; impossível
                      consultar Google Earth Engine ou serviços externos.
                    </li>
                    <li>
                      <strong>Zero dados reais</strong>: nenhuma coordenada dos 677 pontos,
                      nenhum código CAR e nenhum proprietário incluído.
                    </li>
                    <li>
                      <strong>Zero credenciais</strong>: nenhuma chave privada ou token no
                      pacote distribuído.
                    </li>
                    <li>
                      Botões operacionais estão <strong>desabilitados e explicados</strong>{" "}
                      para transparência arquitetural.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                Estado retratado: <strong>{DATA_ESTADO_VITRINE}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBoasVindasAberta(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-slate-600" />
                  Explorar Telas Livremente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBoasVindasAberta(false);
                    iniciarTour();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer flex items-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4" />
                  Iniciar Tour Completo (17 Passos)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
