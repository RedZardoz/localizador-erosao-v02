"use client";

import React, { useState } from "react";
import {
  X,
  Key,
  Database,
  Layers,
  ShieldCheck,
  HardDrive,
} from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import { GcpCredentialsManager } from "./GcpCredentialsManager";
import { ApiTokensManager } from "./ApiTokensManager";

export const SettingsModal: React.FC = () => {
  const { modalAtiva, setModalAtiva } = useSarelStore();
  const [abaAtiva, setAbaAtiva] = useState<"gee" | "tokens" | "fundiario">("gee");

  if (modalAtiva !== "settings") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Conexão, Credenciais &amp; Gestão de Dados
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configuração de APIs oficiais para processamento real no SAREL v2
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalAtiva(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas do Modal */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setAbaAtiva("gee")}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === "gee"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Key className="w-4 h-4" />
            Google Earth Engine (GEE)
          </button>

          <button
            onClick={() => setAbaAtiva("tokens")}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === "tokens"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            Chaves de API &amp; Mapas
          </button>

          <button
            onClick={() => setAbaAtiva("fundiario")}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === "fundiario"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Database className="w-4 h-4" />
            Base Fundiária Local
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {abaAtiva === "gee" && <GcpCredentialsManager />}
          {abaAtiva === "tokens" && <ApiTokensManager />}
          {abaAtiva === "fundiario" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Base Cartográfica Fundiária Local (SQLite)
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  O SAREL v2 utiliza a base de dados fundiária oficial consolidada em{" "}
                  <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[11px] font-mono">
                    data/
                  </code>{" "}
                  (~1,6 GB) com cruzamento espacial direto entre coordenadas e imóveis rurais
                  do SICAR, SIGEF e SNCR do Paraná.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-sans">SICAR (CAR)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Ativo</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-sans">SIGEF (INCRA)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Ativo</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-sans">SNCR Titulares</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Protegido LGPD</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    Casamento espacial verificado sem geração de dados sintéticos ou titulares fictícios.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/80">
          <button
            onClick={() => setModalAtiva(null)}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 cursor-pointer"
          >
            Concluir &amp; Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
