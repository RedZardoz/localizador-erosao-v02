"use client";

import React, { useState } from "react";
import {
  X,
  Activity,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Server,
} from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { LogSeverity, SystemLog } from "@/types/erosion";

export const SystemLogsModal: React.FC = () => {
  const { activeModal, setActiveModal, systemLogs, clearSystemLogs, geeSessionActive, mapboxToken } =
    useErosionStore();

  const [selectedSeverity, setSelectedSeverity] = useState<LogSeverity | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (activeModal !== "diagnostics") return null;

  const errorCount = systemLogs.filter((l) => l.severity === "error").length;
  const warningCount = systemLogs.filter((l) => l.severity === "warning").length;
  const infoCount = systemLogs.filter((l) => l.severity === "info" || l.severity === "success").length;

  const filteredLogs = systemLogs.filter((log) => {
    if (selectedSeverity !== "all" && log.severity !== selectedSeverity) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.category.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopyReport = () => {
    const reportLines = [
      `# Relatório de Diagnóstico do Sistema - Localizador de Erosão`,
      `Data/Hora: ${new Date().toLocaleString("pt-BR")}`,
      `Sessão GEE: ${geeSessionActive ? "Ativa" : "Inativa"}`,
      `Token Mapbox: ${mapboxToken ? "Configurado" : "Não configurado"}`,
      `Total de Eventos: ${systemLogs.length} (Erros: ${errorCount}, Avisos: ${warningCount}, Info: ${infoCount})`,
      `---`,
      `## Detalhamento de Eventos:`,
      ...systemLogs.map(
        (l) =>
          `[${new Date(l.timestamp).toLocaleTimeString("pt-BR")}] [${l.severity.toUpperCase()}] [${
            l.category
          }] ${l.message}${l.details ? `\n  Detalhes: ${l.details}` : ""}`
      ),
    ];

    navigator.clipboard.writeText(reportLines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getSeverityBadge = (sev: LogSeverity) => {
    switch (sev) {
      case "error":
        return {
          icon: AlertCircle,
          label: "Erro Crítico",
          class:
            "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          label: "Aviso / Alerta",
          class:
            "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        };
      case "success":
        return {
          icon: CheckCircle2,
          label: "Sucesso",
          class:
            "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
        };
      default:
        return {
          icon: Info,
          label: "Informativo",
          class:
            "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800",
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Painel de Diagnóstico &amp; Relatório de Erros
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {systemLogs.length} eventos
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitoramento de integridade da aplicação, requisições do Earth Engine, tiles de satélite e conexões.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Cards */}
        <div className="p-6 pb-2 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/80">
          <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Status da Sessão GEE</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    geeSessionActive ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                {geeSessionActive ? "Conectado" : "Aguardando"}
              </span>
            </div>
            <Server className="w-5 h-5 text-slate-400" />
          </div>

          <button
            onClick={() => setSelectedSeverity(selectedSeverity === "error" ? "all" : "error")}
            className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
              selectedSeverity === "error"
                ? "bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/20"
                : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-rose-300"
            }`}
          >
            <div>
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block">
                Erros Críticos
              </span>
              <span className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">
                {errorCount}
              </span>
            </div>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </button>

          <button
            onClick={() => setSelectedSeverity(selectedSeverity === "warning" ? "all" : "warning")}
            className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
              selectedSeverity === "warning"
                ? "bg-amber-50 dark:bg-amber-950/50 border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/20"
                : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-amber-300"
            }`}
          >
            <div>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block">
                Avisos &amp; Alertas
              </span>
              <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
                {warningCount}
              </span>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </button>

          <button
            onClick={() => setSelectedSeverity(selectedSeverity === "info" ? "all" : "info")}
            className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
              selectedSeverity === "info"
                ? "bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20"
                : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-blue-300"
            }`}
          >
            <div>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block">
                Informativos
              </span>
              <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300">
                {infoCount}
              </span>
            </div>
            <Info className="w-5 h-5 text-blue-500" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por mensagem ou módulo..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copiar relatório completo estruturado em texto para suporte técnico"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Relatório
                </>
              )}
            </button>

            <button
              onClick={clearSystemLogs}
              disabled={systemLogs.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Histórico
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhum evento registrado nesta categoria
              </h4>
              <p className="text-xs max-w-sm mx-auto">
                O sistema está operando normalmente e sem falhas ativas no momento.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const badge = getSeverityBadge(log.severity);
              const Icon = badge.icon;
              const isExpanded = expandedLogId === log.id;

              return (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg border shrink-0 ${badge.class}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.class}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {log.category}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 break-words">
                          {log.message}
                        </p>
                      </div>
                    </div>

                    {log.details && (
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors shrink-0"
                        title="Ver detalhes técnicos"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {isExpanded && log.details && (
                    <div className="mt-2.5 p-3 bg-slate-900 dark:bg-slate-950 text-slate-300 text-[11px] font-mono rounded-lg overflow-x-auto border border-slate-800 max-h-40 custom-scrollbar">
                      <pre className="whitespace-pre-wrap">{log.details}</pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-xs text-slate-500">
          <span>
            Classificação: 🔴 <b>Erros</b> (requer atenção) • 🟡 <b>Avisos</b> (tiles/rede) • 🔵 <b>Informativos</b>.
          </span>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
