"use client";

import React, { useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  Lock,
  MinusCircle,
  HelpCircle,
  ChevronRight,
  Compass,
  Filter,
  Sparkles,
  Dices,
  Plane,
  ClipboardCheck,
  Table,
  ShieldCheck,
} from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import { obterComparativoDesenhoD16, ResultadoDesenhoRealizadoD16 } from "@/lib/gee/seloPublicoD16";
import type { ModalType } from "@/types/ui";
import type { PontoAmostral } from "@/types/ponto";
import type { AreaEstudo } from "@/types/ui";
import type { RotuloConsolidado } from "@/types/rotulo";

export type EstadoEtapa =
  | "concluida"
  | "disponivel"
  | "bloqueada"
  | "nao_implementada"
  | "desconhecido";

export interface EtapaFluxo {
  numero: number;
  rotulo: string;
  modalAlvo: ModalType;
  estado: EstadoEtapa;
  motivo: string;
  clicavel: boolean;
  dataMetodologia?: string;
}

export interface ContextoFluxo {
  areas: AreaEstudo[];
  pontos: PontoAmostral[];
  rotulosConsolidados: Record<string, RotuloConsolidado>;
  realizado: ResultadoDesenhoRealizadoD16;
}

/**
 * Função pura de cálculo do estado das 8 etapas do fluxo metodológico.
 * Respeita a regra de estado honesto e a trava G08 (sem números literais de desenho no código).
 */
export function calcularEtapasFluxo(ctx: ContextoFluxo): EtapaFluxo[] {
  const { areas, pontos, rotulosConsolidados, realizado } = ctx;

  const areaAtiva = areas.find((a) => a.ativa);
  const totalPontos = pontos.length;
  const pontosComRotulo = pontos.filter(
    (p) => p.rotulo !== undefined || rotulosConsolidados[p.id] !== undefined
  ).length;

  // 1. Área
  let estadoArea: EstadoEtapa = "disponivel";
  let motivoArea = "Nenhuma área de interesse ativada";
  if (areaAtiva) {
    estadoArea = "concluida";
    motivoArea = `Área ativa: ${areaAtiva.nome}`;
  } else if (areas.length > 0) {
    estadoArea = "disponivel";
    motivoArea = `Área cadastrada (${areas.length}), aguardando ativação`;
  }

  // 2. Triagem
  let estadoTriagem: EstadoEtapa = "bloqueada";
  let motivoTriagem = "Bloqueada: delimite e ative a área de interesse antes da triagem";
  if (totalPontos > 0) {
    estadoTriagem = "concluida";
    motivoTriagem = `Concluída: ${totalPontos} candidatos em memória`;
  } else if (areaAtiva) {
    estadoTriagem = "disponivel";
    motivoTriagem = "Disponível: pronta para triagem espectral Sentinel-2";
  }

  // 3. Medição (Ŝ, Ê, K̂)
  let estadoMedicao: EstadoEtapa = "bloqueada";
  let motivoMedicao = "Bloqueada: triagem de candidatos necessária";
  if (realizado.disponivel && realizado.limiaresS && realizado.limiaresE) {
    estadoMedicao = "concluida";
    motivoMedicao = `Concluída: ${realizado.limiaresS.nValidos} candidatos medidos em Ŝ, Ê e K̂`;
  } else if (totalPontos > 0) {
    estadoMedicao = "disponivel";
    motivoMedicao = "Disponível: candidatos prontos para medição de relevo e solo nu";
  }

  // 4. Sorteio
  let estadoSorteio: EstadoEtapa = "bloqueada";
  let motivoSorteio = "Bloqueada: medição das três dimensões requerida";
  if (realizado.disponivel) {
    estadoSorteio = "concluida";
    const dataSelo = realizado.geradoEm
      ? new Date(realizado.geradoEm).toLocaleDateString("pt-BR")
      : "";
    motivoSorteio = `Concluído: ${realizado.totalPoligonosSorteados} polígonos, selo de ${dataSelo}`;
  } else if (realizado.motivo) {
    estadoSorteio = "bloqueada";
    motivoSorteio = `Bloqueada: ${realizado.motivo}`;
  }

  // 5. Voos (Constante declarada, aguardando decisões do pesquisador)
  const estadoVoos: EstadoEtapa = "nao_implementada";
  const motivoVoos =
    "Não implementada: planos de voo são gerados por script (src/lib/drone/planoVooNControl.ts) e ainda não possuem superfície na interface.";

  // 6. Campo
  let estadoCampo: EstadoEtapa = "bloqueada";
  let motivoCampo = "Bloqueada: sorteio de polígonos pendente";
  if (pontosComRotulo > 0) {
    estadoCampo = "concluida";
    motivoCampo = `Concluída: ${pontosComRotulo} pontos com verdade de terreno`;
  } else if (realizado.disponivel) {
    estadoCampo = "disponivel";
    motivoCampo = "Disponível: aguardando ingestão de formulários ODK/Kobo ou visitas de campo";
  }

  // 7. Matriz
  let estadoMatriz: EstadoEtapa = "bloqueada";
  let motivoMatriz = "Bloqueada: nenhum rótulo de campo ingerido";
  if (pontosComRotulo > 0) {
    estadoMatriz = "disponivel";
    motivoMatriz = `Disponível: ${pontosComRotulo} amostras rotuladas prontas para consolidação tabular`;
  }

  // 8. Auditoria
  const estadoAuditoria: EstadoEtapa = "disponivel";
  const motivoAuditoria = "Disponível: auditoria forense RUSLE e integridade de invariantes";

  return [
    {
      numero: 1,
      rotulo: "Área",
      modalAlvo: "region",
      estado: estadoArea,
      motivo: motivoArea,
      clicavel: true,
    },
    {
      numero: 2,
      rotulo: "Triagem",
      modalAlvo: "candidates",
      estado: estadoTriagem,
      motivo: motivoTriagem,
      clicavel: true,
    },
    {
      numero: 3,
      rotulo: "Medição",
      modalAlvo: "medicao",
      estado: estadoMedicao,
      motivo: motivoMedicao,
      clicavel: true,
    },
    {
      numero: 4,
      rotulo: "Sorteio",
      modalAlvo: "sorteio",
      estado: estadoSorteio,
      motivo: motivoSorteio,
      clicavel: true,
    },
    {
      numero: 5,
      rotulo: "Voos",
      modalAlvo: null,
      estado: estadoVoos,
      motivo: motivoVoos,
      clicavel: false,
    },
    {
      numero: 6,
      rotulo: "Campo",
      modalAlvo: "campanha",
      estado: estadoCampo,
      motivo: motivoCampo,
      clicavel: true,
    },
    {
      numero: 7,
      rotulo: "Matriz",
      modalAlvo: "matriz",
      estado: estadoMatriz,
      motivo: motivoMatriz,
      clicavel: true,
    },
    {
      numero: 8,
      rotulo: "Auditoria",
      modalAlvo: "audit-dossier",
      estado: estadoAuditoria,
      motivo: motivoAuditoria,
      clicavel: true,
      dataMetodologia: "cadeia-verificacao",
    },
  ];
}

export const BarraFluxoOperacional: React.FC = () => {
  const { areas, pontos, rotulosConsolidados, setModalAtiva } = useSarelStore();
  const { realizado } = useMemo(() => obterComparativoDesenhoD16(), []);

  const etapas = useMemo(
    () =>
      calcularEtapasFluxo({
        areas,
        pontos,
        rotulosConsolidados,
        realizado,
      }),
    [areas, pontos, rotulosConsolidados, realizado]
  );

  const obterIconeEstado = (estado: EstadoEtapa) => {
    switch (estado) {
      case "concluida":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case "disponivel":
        return <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />;
      case "bloqueada":
        return <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case "nao_implementada":
        return <MinusCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  const obterBadgeClasse = (estado: EstadoEtapa) => {
    switch (estado) {
      case "concluida":
        return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900";
      case "disponivel":
        return "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900";
      case "bloqueada":
        return "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900";
      case "nao_implementada":
        return "bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700";
    }
  };

  const obterIconeEtapa = (num: number) => {
    switch (num) {
      case 1:
        return <Compass className="w-3.5 h-3.5" />;
      case 2:
        return <Filter className="w-3.5 h-3.5" />;
      case 3:
        return <Sparkles className="w-3.5 h-3.5" />;
      case 4:
        return <Dices className="w-3.5 h-3.5" />;
      case 5:
        return <Plane className="w-3.5 h-3.5" />;
      case 6:
        return <ClipboardCheck className="w-3.5 h-3.5" />;
      case 7:
        return <Table className="w-3.5 h-3.5" />;
      case 8:
        return <ShieldCheck className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  return (
    <nav
      aria-label="Fluxo Operacional da Pesquisa"
      className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-between gap-1.5 overflow-x-auto custom-scrollbar z-20 shadow-xs"
    >
      <div className="flex items-center gap-1.5 min-w-max w-full justify-between">
        {etapas.map((etapa, idx) => {
          const isLast = idx === etapas.length - 1;
          return (
            <React.Fragment key={etapa.numero}>
              <div
                data-metodologia={etapa.dataMetodologia}
                onClick={() => {
                  if (etapa.clicavel && etapa.modalAlvo) {
                    setModalAtiva(etapa.modalAlvo);
                  }
                }}
                title={`${etapa.numero}. ${etapa.rotulo} — ${etapa.motivo}`}
                className={`group flex flex-col justify-center px-2.5 py-1 rounded-lg border transition-all text-left ${
                  etapa.clicavel
                    ? "cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-xs active:scale-[0.99]"
                    : "cursor-default opacity-85"
                } ${obterBadgeClasse(etapa.estado)} max-w-[170px] xl:max-w-[195px] flex-1`}
              >
                {/* Linha 1: Número, Ícone, Rótulo e Indicador de Estado */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1 font-bold text-xs truncate">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-mono">
                      {etapa.numero}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 shrink-0">
                      {obterIconeEtapa(etapa.numero)}
                    </span>
                    <span className="truncate">{etapa.rotulo}</span>
                  </div>
                  {obterIconeEstado(etapa.estado)}
                </div>

                {/* Linha 2: Motivo honesto em texto */}
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight mt-0.5 truncate font-normal">
                  {etapa.motivo}
                </p>
              </div>

              {!isLast && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
