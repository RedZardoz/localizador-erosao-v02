"use client";

import React, { useState } from "react";
import { KeyRound, CheckCircle2, AlertCircle, RefreshCw, Globe, Map, Layers, Sprout } from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";

export const ApiTokensManager: React.FC = () => {
  const {
    mapboxToken,
    setMapboxToken,
    googleMapsKey,
    setGoogleMapsKey,
    cartoApiKey,
    setCartoApiKey,
    embrapaToken,
    setEmbrapaToken,
  } = useErosionStore();

  const [testStatus, setTestStatus] = useState<{
    mapbox?: { success: boolean; message: string };
    google?: { success: boolean; message: string };
    carto?: { success: boolean; message: string };
    embrapa?: { success: boolean; message: string };
  }>({});

  const [loading, setLoading] = useState<{
    mapbox?: boolean;
    google?: boolean;
    carto?: boolean;
    embrapa?: boolean;
  }>({});

  const testToken = async (type: "mapbox" | "google" | "carto" | "embrapa", token: string) => {
    if (!token.trim()) return;

    setLoading((prev) => ({ ...prev, [type]: true }));
    setTestStatus((prev) => ({ ...prev, [type]: undefined }));

    try {
      const res = await fetch("/api/auth/token-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, type }),
      });

      const data = await res.json();
      setTestStatus((prev) => ({
        ...prev,
        [type]: {
          success: data.success,
          message: data.success ? data.message : data.error || "Erro de validação.",
        },
      }));
    } catch (err: any) {
      setTestStatus((prev) => ({
        ...prev,
        [type]: {
          success: false,
          message: `Erro ao testar: ${err.message}`,
        },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Mapbox Token Field */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Map className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Mapbox Access Token (Opcional)
          </label>
          <span className="text-[10px] text-slate-500 font-mono">pk.eyJ1...</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Para habilitar estilos vetoriais customizados e imagens aéreas de ultra-resolução da Mapbox.
        </p>

        <div className="flex gap-2">
          <input
            type="password"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            placeholder="pk.eyJ1..."
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => testToken("mapbox", mapboxToken)}
            disabled={!mapboxToken || loading.mapbox}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {loading.mapbox ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-600 dark:text-cyan-400" />
            ) : (
              "Testar"
            )}
          </button>
        </div>

        {testStatus.mapbox && (
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              testStatus.mapbox.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300"
            }`}
          >
            {testStatus.mapbox.success ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            )}
            <span>{testStatus.mapbox.message}</span>
          </div>
        )}
      </div>

      {/* Google Maps API Key Field */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Google Maps JavaScript API Key (Opcional)
          </label>
          <span className="text-[10px] text-slate-500 font-mono">AIzaSy...</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Para integração direta com Street View e geocodificação reversa de municípios.
        </p>

        <div className="flex gap-2">
          <input
            type="password"
            value={googleMapsKey}
            onChange={(e) => setGoogleMapsKey(e.target.value)}
            placeholder="AIzaSy..."
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => testToken("google", googleMapsKey)}
            disabled={!googleMapsKey || loading.google}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {loading.google ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
            ) : (
              "Testar"
            )}
          </button>
        </div>

        {testStatus.google && (
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              testStatus.google.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300"
            }`}
          >
            {testStatus.google.success ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            )}
            <span>{testStatus.google.message}</span>
          </div>
        )}
      </div>

      {/* CARTO Basemaps API Key Field */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            CARTO Basemaps API Key (Opcional)
          </label>
          <span className="text-[10px] text-slate-500 font-mono">cb1_...</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Remove a marca d&apos;água <i>&quot;API key required&quot;</i> das camadas raster da CARTO (Dark GIS, Voyager e Positron). Gratuito até 5 milhões de requisições/mês.{" "}
          <a
            href="https://carto.com/basemaps/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 dark:text-amber-400 underline hover:text-amber-700 dark:hover:text-amber-300 font-medium inline-flex items-center gap-0.5"
          >
            Obter chave gratuita no site da CARTO
          </a>
        </p>

        <div className="flex gap-2">
          <input
            type="password"
            value={cartoApiKey}
            onChange={(e) => setCartoApiKey(e.target.value)}
            placeholder="cb1_... ou chave CARTO"
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => testToken("carto", cartoApiKey)}
            disabled={!cartoApiKey || loading.carto}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {loading.carto ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
            ) : (
              "Testar"
            )}
          </button>
        </div>

        {testStatus.carto && (
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              testStatus.carto.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300"
            }`}
          >
            {testStatus.carto.success ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            )}
            <span>{testStatus.carto.message}</span>
          </div>
        )}
      </div>

      {/* Embrapa AgroAPI / SmartSolos Token Field */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Embrapa AgroAPI / SmartSolos Token (Opcional)
          </label>
          <span className="text-[10px] text-slate-500 font-mono">Bearer ey...</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Para classificação taxonômica oficial de solos segundo o SiBCS da Embrapa Agricultura Digital a partir de amostras de campo.{" "}
          <a
            href="https://www.agroapi.cnptia.embrapa.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-700 dark:hover:text-emerald-300 font-medium inline-flex items-center gap-0.5"
          >
            Acessar o portal AgroAPI Embrapa
          </a>
        </p>

        <div className="flex gap-2">
          <input
            type="password"
            value={embrapaToken}
            onChange={(e) => setEmbrapaToken(e.target.value)}
            placeholder="Bearer eyJ... ou Token de acesso"
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => testToken("embrapa", embrapaToken)}
            disabled={!embrapaToken || loading.embrapa}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {loading.embrapa ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
            ) : (
              "Testar"
            )}
          </button>
        </div>

        {testStatus.embrapa && (
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              testStatus.embrapa.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300"
            }`}
          >
            {testStatus.embrapa.success ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            )}
            <span>{testStatus.embrapa.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
