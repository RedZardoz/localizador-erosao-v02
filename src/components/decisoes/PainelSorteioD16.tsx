"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Lock, ShieldAlert, FileCheck2 } from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import {
  CandidatoSorteioD16,
  SeloSorteioD16,
  verificarPreCondicoesSorteioD16,
} from "@/lib/gee/sorteioPoligonos";
import { valorOuNulo } from "@/types/proveniencia";

/**
 * Painel exclusivo do pesquisador para o sorteio único e irreversível dos 36 polígonos
 * de 10 ha (FASE A1 — Decisões D07, D08, D12, D16 e D23).
 *
 * Nunca é exibido em telas de coleta de campo (protocolo cego).
 */
export const PainelSorteioD16: React.FC = () => {
  const { pontos, adicionarLog } = useSarelStore();
  const [seloExistenteCaminho, setSeloExistenteCaminho] = useState<string | null>(null);
  const [seloGravado, setSeloGravado] = useState<SeloSorteioD16 | null>(null);
  const [etapaConfirmacao, setEtapaConfirmacao] = useState<0 | 1>(0);
  const [executando, setExecutando] = useState(false);
  const [erroExecucao, setErroExecucao] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    fetch("/api/gee/sorteio-d16")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelado && d?.seloExistenteCaminho) {
          setSeloExistenteCaminho(d.seloExistenteCaminho);
          if (d.selo) setSeloGravado(d.selo);
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
          semente: 20260928,
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
        `Sorteio irreversível de 36 polígonos (360 ha) selado em ${data.seloExistenteCaminho}.`
      );
    } catch (e: unknown) {
      setErroExecucao(e instanceof Error ? e.message : String(e));
    } finally {
      setExecutando(false);
    }
  };

  if (seloExistenteCaminho) {
    return (
      <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/30 dark:border-emerald-800 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <span>Sorteio D16 Selado e Irreversível (Decisões D16 e D23)</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-mono text-[10px] font-bold">
            SELADO (36 POLÍGONOS / 360 ha)
          </span>
        </div>
        <p className="text-slate-700 dark:text-slate-300">
          O sorteio estratificado de 36 polígonos de 10 ha (18 treino + 18 held-out) já foi executado e selado.
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
              <span>• SHA-256: {seloGravado.sha256ConjuntoCandidatos.slice(0, 12)}...</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800 space-y-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Comando de Sorteio dos 36 Polígonos de Drone (FASE A1 — D16 / D23)</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            relatorioPre.aprovado
              ? "bg-emerald-100 text-emerald-800"
              : "bg-rose-100 text-rose-800"
          }`}
        >
          {relatorioPre.aprovado ? "Pré-condições OK" : `Bloqueado (${relatorioPre.condicaoFalha})`}
        </span>
      </div>

      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
        <b>Escopo e Irreversibilidade:</b> Sorteia exatamente <b>36 polígonos de 10 ha</b> (<b>2 por estrato</b> sobre os{" "}
        <b>18 estratos</b> de D12, totalizando <b>360 ha</b>: 18 para treino e 18 reservados em held-out para avaliação única de D25).
        Esta ação é <b>irreversível</b> (D23 proíbe descartar <code>pi_i</code> registrado).
      </p>

      {!relatorioPre.aprovado && (
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
          disabled={!relatorioPre.aprovado || executando}
          onClick={() => setEtapaConfirmacao(1)}
          className="px-3.5 py-2 rounded-lg font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {relatorioPre.aprovado
            ? "Etapa 1/2 — Preparar Sorteio Irreversível de 36 Polígonos (360 ha)"
            : `Sorteio Desabilitado (${relatorioPre.condicaoFalha})`}
        </button>
      ) : (
        <div className="p-3 rounded-lg border border-amber-400 bg-amber-100/80 dark:bg-amber-900/40 space-y-2">
          <p className="font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-700" />
            Confirmação Explícita (Etapa 2/2): Deseja selar definitivamente os 36 polígonos (2 por estrato, 360 ha) e gravar os pi_i de D23?
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
                : "Confirmar e Selar Sorteio Irreversível (36 Polígonos)"}
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
  );
};
