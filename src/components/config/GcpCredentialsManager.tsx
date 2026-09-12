"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileJson,
  Key,
  ShieldCheck,
} from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";

export const GcpCredentialsManager: React.FC = () => {
  const { credenciais, setCredenciais, setGeeSessionActive, adicionarLog } =
    useSarelStore();

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErro(null);
    setSucesso(null);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        if (!json.project_id || !json.client_email) {
          throw new Error(
            "O arquivo JSON não é uma Service Account válida do Google Cloud (faltam project_id ou client_email)."
          );
        }

        setLoading(true);

        // Dispara autenticação real no backend
        const res = await fetch("/api/auth/gee-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });

        const data = await res.json().catch(() => null);

        if (res.ok && data?.ok) {
          setCredenciais({
            gcpCredentials: {
              project_id: json.project_id,
              client_email: json.client_email,
              type: json.type,
            },
            geeSessionActive: true,
          });
          setGeeSessionActive(true);
          setSucesso(
            `Conexão autenticada com sucesso! Projeto: ${json.project_id}`
          );
          adicionarLog(
            "info",
            "GEE-Auth",
            `Sessão GEE autenticada para o projeto ${json.project_id}.`
          );
        } else {
          const motivo = data?.error || `Falha HTTP ${res.status}: Não foi possível autenticar junto ao Google.`;
          throw new Error(motivo);
        }
      } catch (err: any) {
        setErro(err.message || "Erro ao processar arquivo JSON.");
        setGeeSessionActive(false);
        adicionarLog("error", "GEE-Auth", err.message || "Erro na Service Account.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const testarSessao = async () => {
    setLoading(true);
    setErro(null);
    setSucesso(null);

    try {
      const res = await fetch("/api/auth/gee-test");
      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setGeeSessionActive(true);
        setSucesso(`Sessão GEE ativa e verificada junto ao Google Cloud (${data.project_id}).`);
      } else {
        const motivo = data?.error || `Falha no teste: HTTP ${res.status}`;
        throw new Error(motivo);
      }
    } catch (err: any) {
      setGeeSessionActive(false);
      setErro(err.message || "Falha no teste de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Card de Status da Conexão GEE */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Google Earth Engine (GEE) Service Account
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider ${
              credenciais.geeSessionActive
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
            }`}
          >
            {credenciais.geeSessionActive
              ? "ATIVADA - Autenticado GCP"
              : "DESATIVADA - Não Conectado"}
          </span>
        </div>

        {/* Upload Dropzone */}
        <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl bg-white dark:bg-slate-950 cursor-pointer transition-colors group">
          <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          <span className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Clique para selecionar o arquivo JSON da Service Account
          </span>
          <span className="text-[10px] text-slate-400">
            GCP IAM &amp; Admin → Service Accounts → Keys (JSON)
          </span>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {/* Detalhes da Credencial se Ativa */}
        {credenciais.gcpCredentials && (
          <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Project ID:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {credenciais.gcpCredentials.project_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Client Email:</span>
              <span className="text-slate-700 dark:text-slate-300 truncate max-w-[280px]">
                {credenciais.gcpCredentials.client_email}
              </span>
            </div>
          </div>
        )}

        {/* Feedback de Teste */}
        {sucesso && (
          <div className="p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{sucesso}</span>
          </div>
        )}

        {erro && (
          <div className="p-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Botão de Testar Conexão */}
        <div className="flex justify-end pt-1">
          <button
            onClick={testarSessao}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            ) : (
              "Testar Conexão GEE"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
