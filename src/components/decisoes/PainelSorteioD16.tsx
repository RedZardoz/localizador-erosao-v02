"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Lock, ShieldAlert, FileCheck2, Calculator } from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import {
  CandidatoSorteioD16,
  SeloSorteioD16,
  verificarPreCondicoesSorteioD16,
} from "@/lib/gee/sorteioPoligonos";
import { valorOuNulo } from "@/types/proveniencia";
import { CalculadoraDesenhoAmostral } from "./CalculadoraDesenhoAmostral";

/**
 * Painel exclusivo do pesquisador para o sorteio único e irreversível dos polígonos
 * (FASE A1 — Decisões D07, D08, D12, D16 e D23) e exploração via Calculadora de Desenho (X5).
 *
 * Nunca é exibido em telas de coleta de campo (protocolo cego).
 */
export const PainelSorteioD16: React.FC = () => {
  const { pontos, adicionarLog } = useSarelStore();
  const [seloExistenteCaminho, setSeloExistenteCaminho] = useState<string | null>(null);
  const [seloGravado, setSeloGravado] = useState<SeloSorteioD16 | null>(null);
  const [artefatoRemedicao, setArtefatoRemedicao] = useState<{
    statusSorteio?: string;
    dimensoesMedidas?: {
      S?: { estado: string; fonte?: string };
      K?: { estado: string; fonte?: string };
      E?: { estado: string; motivo?: string; fonte?: string };
    };
    [chave: string]: unknown;
  } | null>(null);
  const [etapaConfirmacao, setEtapaConfirmacao] = useState<0 | 1>(0);
  const [executando, setExecutando] = useState(false);
  const [erroExecucao, setErroExecucao] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"sorteio" | "calculadora">("sorteio");

  useEffect(() => {
    let cancelado = false;
    fetch("/api/gee/sorteio-d16")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelado) {
          if (d?.seloExistenteCaminho) {
            setSeloExistenteCaminho(d.seloExistenteCaminho);
            if (d.selo) setSeloGravado(d.selo);
          }
          if (d?.artefatoRemedicao) {
            setArtefatoRemedicao(d.artefatoRemedicao);
          }
        }
      })
      .catch(() => {
        // Ignora erro silenciosamente no carregamento inicial
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const candidatosMapeados = useMemo<CandidatoSorteioD16[]>(() => {
    return pontos.map((p) => {
      const decliv = valorOuNulo(p.terreno?.declividadePct) ?? 0;
      const freqNu = valorOuNulo(p.temporal?.D?.serie?.frequenciaSoloNu) ?? 0;
      const wc2020 = valorOuNulo(p.classeWorldCover2020);
      const wc2021 = valorOuNulo(p.classeWorldCover2021);
      const kAmbiguo = p.solo?.kAmbiguoAssociacao ?? p.kAmbiguoAssociacao;
      return {
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        declividadePct: decliv,
        frequenciaSoloNu: freqNu,
        nivelK: p.criterioSelecao.nivelK,
        classeWorldCover2020: wc2020,
        classeWorldCover2021: wc2021,
        kAmbiguoAssociacao: kAmbiguo,
        unidadeDeterminanteK2024:
          p.criterioSelecao.unidadeDeterminanteK2024 ?? p.solo?.unidadeDeterminanteK2024 ?? null,
      };
    });
  }, [pontos]);

  const relatorioPre = useMemo(() => {
    return verificarPreCondicoesSorteioD16(candidatosMapeados, {
      seloExistenteCaminho,
      lancarErro: false,
    });
  }, [candidatosMapeados, seloExistenteCaminho]);

  const confirmarSorteioIrreversivel = async () => {
    setExecutando(true);
    setErroExecucao(null);
    try {
      const res = await fetch("/api/gee/sorteio-d16", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidatos: candidatosMapeados,
          confirmar: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setErroExecucao(data?.motivo ?? "Falha ao executar sorteio D16.");
        return;
      }
      setSeloExistenteCaminho(data.seloExistenteCaminho);
      setSeloGravado(data.selo);
      setEtapaConfirmacao(0);
      adicionarLog(
        "info",
        "Sorteio-D16",
        `Sorteio irreversível de polígonos selado em ${data.seloExistenteCaminho}.`
      );
    } catch (e: unknown) {
      setErroExecucao(e instanceof Error ? e.message : String(e));
    } finally {
      setExecutando(false);
    }
  };

  const bloqueioENaoMedido =
    artefatoRemedicao?.dimensoesMedidas?.E?.estado === "indisponivel" ||
    (typeof artefatoRemedicao?.statusSorteio === "string" &&
      artefatoRemedicao.statusSorteio.includes("BLOQUEADO"));

  const motivoBloqueioArtefato =
    artefatoRemedicao?.statusSorteio ||
    artefatoRemedicao?.dimensoesMedidas?.E?.motivo ||
    null;

  return (
    <div className="space-y-4">
      {/* Abas de Navegação */}
      <div className="flex border-b border-slate-700/80 gap-2">
        <button
          type="button"
          onClick={() => setAbaAtiva("sorteio")}
          className={`py-2 px-3.5 text-xs font-bold rounded-t-lg transition border-t border-x ${
            abaAtiva === "sorteio"
              ? "bg-slate-800 text-white border-slate-700 border-b-transparent"
              : "bg-slate-900/60 text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Sorteio D16 (Selo Irreversível)
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("calculadora")}
          className={`py-2 px-3.5 text-xs font-bold rounded-t-lg transition border-t border-x flex items-center gap-1.5 ${
            abaAtiva === "calculadora"
              ? "bg-slate-800 text-sky-400 border-slate-700 border-b-transparent"
              : "bg-slate-900/60 text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          Calculadora de Desenho Amostral (X5)
        </button>
      </div>

      {abaAtiva === "calculadora" ? (
        <CalculadoraDesenhoAmostral />
      ) : seloExistenteCaminho ? (
        <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/30 dark:border-emerald-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>Sorteio D16 Selado e Irreversível (Decisões D16 e D23)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-mono text-[10px] font-bold">
              SELADO (72 POLÍGONOS / 361 ha)
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300">
            O sorteio estratificado de 72 polígonos de 5,02 ha (36 treino + 36 held-out) já foi executado e selado.
            Conforme a Decisão D23, as probabilidades de inclusão (<code>pi_i</code>) registradas não podem ser descartadas nem sobrescritas.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 font-mono text-[11px] text-emerald-900 dark:text-emerald-300">
            <span>
              Arquivo do Selo:{" "}
              <a
                href={`/${seloExistenteCaminho}`}
                target="_blank"
                rel="noreferrer"
                className="underline font-bold"
              >
                {seloExistenteCaminho}
              </a>
            </span>
            {seloGravado && (
              <>
                <span>• Semente: {seloGravado.semente}</span>
                <span>• Hash: {seloGravado.hashIntegridade.slice(0, 12)}...</span>
                <span>• Selado em: {seloGravado.geradoEm}</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800 space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Comando de Sorteio dos 72 Polígonos de Drone (FASE A1 — D16 / D23)</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                bloqueioENaoMedido
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                  : relatorioPre.aprovado
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {bloqueioENaoMedido
                ? "Bloqueado (Ê não medido — P12)"
                : relatorioPre.aprovado
                ? "Pré-condições OK"
                : `Bloqueado (${relatorioPre.condicaoFalha})`}
            </span>
          </div>

          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            <b>Escopo e Irreversibilidade:</b> Sorteia exatamente <b>72 polígonos de 5,02 ha</b> (<b>4 por estrato</b> sobre os{" "}
            <b>18 estratos</b> de D12, totalizando <b>361 ha</b>: 36 para treino e 36 reservados em held-out para avaliação única de D25).
            Esta ação é <b>irreversível</b> (D23 proíbe descartar <code>pi_i</code> registrado).
          </p>

          {bloqueioENaoMedido && (
            <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800 text-rose-950 dark:text-rose-200 flex items-start gap-2.5">
              <Lock className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold flex flex-wrap items-center gap-2">
                  <span>Sorteio D16 Bloqueado — Dimensão Ê Não Medida no GEE (P12)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200">
                    Fonte: docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {motivoBloqueioArtefato}
                </p>
                <div className="text-[10px] font-mono opacity-85 pt-1">
                  Ŝ: {artefatoRemedicao?.dimensoesMedidas?.S?.estado?.toUpperCase() ?? "MEDIDO"} | K̂: {artefatoRemedicao?.dimensoesMedidas?.K?.estado?.toUpperCase() ?? "MEDIDO"} | Ê: {artefatoRemedicao?.dimensoesMedidas?.E?.estado?.toUpperCase() ?? "INDISPONÍVEL"}
                </div>
              </div>
            </div>
          )}

          {!bloqueioENaoMedido && !relatorioPre.aprovado && (
            <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-2">
              <Lock className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <b>Gatilho Desabilitado — Falha na Pré-condição <code>{relatorioPre.condicaoFalha}</code>:</b>{" "}
                {relatorioPre.motivoFalha}
              </div>
            </div>
          )}

          {erroExecucao && (
            <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-100 text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{erroExecucao}</span>
            </div>
          )}

          {etapaConfirmacao === 0 ? (
            <button
              type="button"
              disabled={bloqueioENaoMedido || !relatorioPre.aprovado || executando}
              onClick={() => setEtapaConfirmacao(1)}
              className="px-3.5 py-2 rounded-lg font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {bloqueioENaoMedido
                ? "Sorteio Bloqueado (Ê não medido — P12)"
                : relatorioPre.aprovado
                ? "Etapa 1/2 — Preparar Sorteio Irreversível de 72 Polígonos (361 ha)"
                : `Sorteio Desabilitado (${relatorioPre.condicaoFalha})`}
            </button>
          ) : (
            <div className="p-3 rounded-lg border border-amber-400 bg-amber-100/80 dark:bg-amber-900/40 space-y-2">
              <p className="font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-700" />
                Confirmação Explícita (Etapa 2/2): Deseja selar definitivamente os 72 polígonos (4 por estrato, 361 ha) e gravar os pi_i de D23?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={executando}
                  onClick={confirmarSorteioIrreversivel}
                  className="px-3.5 py-1.5 rounded-lg font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 cursor-pointer"
                >
                  {executando
                    ? "Gravando Selo D16..."
                    : "Confirmar e Selar Sorteio Irreversível (72 Polígonos)"}
                </button>
                <button
                  type="button"
                  disabled={executando}
                  onClick={() => setEtapaConfirmacao(0)}
                  className="px-3 py-1.5 rounded-lg font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
