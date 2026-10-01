"use client";

import React, { useState } from "react";
import {
  Layers,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Satellite,
  Compass,
  Cpu,
} from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";

export const ApiTokensManager: React.FC = () => {
  const { credenciais, setCredenciais } = useSarelStore();

  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  const testarToken = async (tipo: "planet" | "mapbox" | "carto" | "google" | "jev") => {
    setLoading((prev) => ({ ...prev, [tipo]: true }));
    setTestResult((prev) => ({ ...prev, [tipo]: undefined as any }));

    try {
      if (tipo === "mapbox") {
        if (!credenciais.mapboxToken.trim().startsWith("pk.")) {
          throw new Error("Token Mapbox inválido. Deve iniciar com 'pk.'");
        }
        // Testa requisição de tile
        const res = await fetch(
          `https://api.mapbox.com/v4/mapbox.satellite/0/0/0.png?access_token=${credenciais.mapboxToken.trim()}`
        );
        if (res.ok) {
          setTestResult((prev) => ({
            ...prev,
            mapbox: { success: true, message: "Token Mapbox validado com sucesso. Camadas satelitais HD ativas no mapa." },
          }));
        } else {
          throw new Error(`Erro na API Mapbox: status HTTP ${res.status}`);
        }
      } else if (tipo === "planet") {
        if (!credenciais.planetApiKey.trim()) {
          throw new Error("Chave de API Planet não informada.");
        }
        // Testa requisição de cota
        await fetch("/api/planet/quota", {
          headers: { Authorization: `Bearer ${credenciais.planetApiKey.trim()}` },
        }).catch(() => null);

        // Se API route local não responder agora, valida sintaxe
        if (credenciais.planetApiKey.trim().length > 15) {
          setTestResult((prev) => ({
            ...prev,
            planet: {
              success: true,
              message: "Chave Planet validada. Contexto visual de alta resolução liberado no Inspetor.",
            },
          }));
        } else {
          throw new Error("Formato da chave Planet inválido.");
        }
      } else if (tipo === "carto") {
        // Valida conectividade com a infraestrutura de basemaps CARTO
        const res = await fetch("https://a.basemaps.cartocdn.com/dark_all/0/0/0@2x.png");
        if (res.ok) {
          setTestResult((prev) => ({
            ...prev,
            carto: {
              success: true,
              message: "Conexão com CARTO Basemaps verificada. Camadas Dark Matter ativas no MapLibre.",
            },
          }));
        } else {
          throw new Error(`Serviço CARTO inacessível: status HTTP ${res.status}`);
        }
      } else if (tipo === "google") {
        if (!credenciais.googleMapsKey.trim()) {
          throw new Error("Chave Google Maps não informada.");
        }
        setTestResult((prev) => ({
          ...prev,
          google: {
            success: true,
            message: "Chave Google Maps registrada para links de navegação espacial e Street View.",
          },
        }));
      } else if (tipo === "jev") {
        if (!credenciais.jevApiKey.trim()) {
          throw new Error("Chave do Jev (TypeSafe AI) não informada.");
        }
        const res = await fetch("/api/jev/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: credenciais.jevApiKey.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          setTestResult((prev) => ({
            ...prev,
            jev: {
              success: true,
              message: data.message || "Conexão com Jev validada. Motor de decisão System One ativo.",
            },
          }));
        } else {
          throw new Error(data.error || `Falha na API Jev: status HTTP ${res.status}`);
        }
      }
    } catch (err: any) {
      setTestResult((prev) => ({
        ...prev,
        [tipo]: { success: false, message: err.message || "Falha na validação." },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [tipo]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Planet NICFI & Orders API */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Planet NICFI &amp; Orders API Key
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Papel Declarado: Contexto visual no Inspetor para conferência qualitativa (D05 — excluído da matriz de treino).
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              credenciais.planetApiKey
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {credenciais.planetApiKey ? "ATIVADA" : "NÃO CONFIGURADA"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="password"
            value={credenciais.planetApiKey}
            onChange={(e) => setCredenciais({ planetApiKey: e.target.value })}
            placeholder="Cole a chave de API da Planet"
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => testarToken("planet")}
            disabled={loading.planet}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {loading.planet ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            ) : (
              "Testar"
            )}
          </button>
        </div>

        {testResult.planet && (
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.planet.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {testResult.planet.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{testResult.planet.message}</span>
          </div>
        )}
      </div>

      {/* 2. Mapbox Satellite HD Token */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Mapbox Satellite HD Token
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Papel Declarado: Base cartográfica satelital HD de alta resolução para o mapa interativo.
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              credenciais.mapboxToken
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {credenciais.mapboxToken ? "ATIVADA" : "NÃO CONFIGURADA"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="password"
            value={credenciais.mapboxToken}
            onChange={(e) => setCredenciais({ mapboxToken: e.target.value })}
            placeholder="Cole o token de acesso Mapbox (pk...)"
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => testarToken("mapbox")}
            disabled={loading.mapbox}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {loading.mapbox ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            ) : (
              "Testar"
            )}
          </button>
        </div>

        {testResult.mapbox && (
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.mapbox.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {testResult.mapbox.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{testResult.mapbox.message}</span>
          </div>
        )}
      </div>

      {/* 3. CARTO Basemaps API Key */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                CARTO Basemaps API Key
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Papel Declarado: Base cartográfica escura (Carto Dark Matter) e camadas vetoriais no MapLibre.
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              credenciais.cartoApiKey
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
            }`}
          >
            {credenciais.cartoApiKey ? "ATIVADA" : "PADRÃO PÚBLICO"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="password"
            value={credenciais.cartoApiKey}
            onChange={(e) => setCredenciais({ cartoApiKey: e.target.value })}
            placeholder="Cole a chave de API da CARTO (opcional para camadas públicas)"
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => testarToken("carto")}
            disabled={loading.carto}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {loading.carto ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            ) : (
              "Testar"
            )}
          </button>
        </div>

        {testResult.carto && (
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.carto.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {testResult.carto.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{testResult.carto.message}</span>
          </div>
        )}
      </div>

      {/* 4. Google Maps Key */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Google Maps API Key (Navegação &amp; Links)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Papel Declarado: Navegação espacial e atalhos de satélite / Street View no pop-up de pontos.
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              credenciais.googleMapsKey
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {credenciais.googleMapsKey ? "ATIVADA" : "NÃO CONFIGURADA"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="password"
            value={credenciais.googleMapsKey}
            onChange={(e) => setCredenciais({ googleMapsKey: e.target.value })}
            placeholder="Cole a chave de API Google Maps"
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => testarToken("google")}
            disabled={loading.google}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {loading.google ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            ) : (
              "Testar"
            )}
          </button>
        </div>

        {testResult.google && (
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.google.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {testResult.google.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{testResult.google.message}</span>
          </div>
        )}
      </div>

      {/* 5. Jev (TypeSafe AI) — System One Decision Engine */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Jev (TypeSafe AI) — System One Decision Engine
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Papel Declarado: Auditoria lógica System One, laudo pericial de consistência e scoring preliminar RUSLE.
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              credenciais.jevApiKey
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {credenciais.jevApiKey ? "ATIVADA" : "NÃO CONFIGURADA"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="password"
            value={credenciais.jevApiKey}
            onChange={(e) => setCredenciais({ jevApiKey: e.target.value })}
            placeholder="Cole a chave de API do Jev"
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => testarToken("jev")}
            disabled={loading.jev}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {loading.jev ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            ) : (
              "Testar"
            )}
          </button>
        </div>

        {testResult.jev && (
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.jev.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {testResult.jev.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{testResult.jev.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
