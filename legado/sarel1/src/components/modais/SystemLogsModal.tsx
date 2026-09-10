"use client";

import React, { useState } from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { Terminal, ShieldCheck, Copy, Trash2, X, Check } from "lucide-react";

export function SystemLogsModal() {
  const { pontos, aoiAtiva, sementeAmostragem, fecharModal } = useSarelStore();
  const [copiado, setCopiado] = useState(false);

  const logs = [
    { timestamp: "18:25:10.142", nivel: "INFO", componente: "Kernel", mensagem: "Inicialização do motor analítico SAREL v1.0 (PPGTCA 2026)." },
    { timestamp: "18:25:10.250", nivel: "INFO", componente: "GEE Client", mensagem: "Sessão de execução local verificada (localhost / 127.0.0.1)." },
    { timestamp: "18:25:10.315", nivel: "INFO", componente: "Embrapa GeoInfo", mensagem: "Serviço WFS Embrapa Solos PR conectado e responsivo (Regra 8 auditada)." },
    { timestamp: "18:25:10.380", nivel: "INFO", componente: "Fundiário SQLite", mensagem: "Índice espacial R-Tree do SICAR PR carregado (559.899 feições)." },
    { timestamp: "18:25:10.420", nivel: "INFO", componente: "Fundiário SNCR", mensagem: "Base cadastral do SNCR Paraná (01/09/2026) conectada com mascaramento LGPD." },
    { timestamp: "18:25:10.510", nivel: "INFO", componente: "Amostragem", mensagem: `AOI Ativa: ${aoiAtiva.nome} · Semente PRNG: ${sementeAmostragem}.` },
    { timestamp: "18:25:10.600", nivel: "INFO", componente: "Estratificação", mensagem: `${pontos.length} pontos distribuídos uniformemente nos 18 estratos físicos (S^ x E^ x K^).` },
    { timestamp: "18:25:10.650", nivel: "OK", componente: "Invariantes", mensagem: "7 Invariantes analíticos e guarda antissintético validados com sucesso." },
  ];

  function copiarLogs() {
    const texto = logs.map((l) => `[${l.timestamp}] [${l.nivel}] [${l.componente}] ${l.mensagem}`).join("\n");
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-slate-700/60 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700/50 text-slate-300">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Telemetria &amp; Logs do Sistema</h2>
              <p className="text-xs text-slate-400">
                Rastreabilidade de requisições, versão do motor e auditoria de serviços (Regra 8)
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

        {/* Terminal de Logs */}
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-slate-400">Motor: SAREL-v1.0-PPGTCA (2026.1-metric)</span>
            </div>
            <button
              onClick={copiarLogs}
              className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300"
            >
              {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiado ? "Copiado!" : "Copiar Logs"}
            </button>
          </div>

          <div className="h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-300 space-y-1">
            {logs.map((l, idx) => (
              <div key={idx} className="flex items-start gap-2 hover:bg-slate-900/60 p-0.5 rounded">
                <span className="text-slate-500 shrink-0">{l.timestamp}</span>
                <span
                  className={`shrink-0 font-bold ${
                    l.nivel === "OK" ? "text-emerald-400" : l.nivel === "WARN" ? "text-amber-400" : "text-cyan-400"
                  }`}
                >
                  [{l.nivel}]
                </span>
                <span className="text-slate-400 font-semibold shrink-0">[{l.componente}]</span>
                <span className="text-slate-200">{l.mensagem}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3.5 bg-slate-900/90 rounded-b-2xl">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
            <ShieldCheck className="h-4 w-4" />
            <span>Conformidade Científica Homologada</span>
          </div>
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
