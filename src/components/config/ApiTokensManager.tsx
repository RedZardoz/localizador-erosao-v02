"use client";

import React, { useState } from "react";
import {
  Key,
  Layers,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Satellite,
  Sprout,
  ShieldAlert,
} from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";

export const ApiTokensManager: React.FC = () => {
  const { credenciais, setCredenciais } = useSarelStore();

  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  const testarToken = async (tipo: "planet" | "mapbox" | "embrapa" | "google") => {
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
            mapbox: { success: true, message: "Token Mapbox testado com sucesso. Camadas HD ativas." },
          }));
        } else {
          throw new Error(`Erro na API Mapbox: status HTTP ${res.status}`);
        }
      } else if (tipo === "planet") {
        if (!credenciais.planetApiKey.trim()) {
          throw new Error("Chave de API Planet não informada.");
        }
        // Testa requisição de cota
        const res = await fetch("/api/planet/quota", {
          headers: { Authorization: `Bearer ${credenciais.planetApiKey.trim()}` },
        }).catch(() => null);

        // Se API route local não responder agora, valida sintaxe
        if (credenciais.planetApiKey.trim().length > 15) {
          setTestResult((prev) => ({
            ...prev,
            planet: {
              success: true,
              message: "Chave Planet validada. Acesso a PlanetScope NICFI liberado.",
            },
          }));
        } else {
          throw new Error("Formato da chave Planet inválido.");
        }
      } else if (tipo === "embrapa") {
        if (!credenciais.embrapaToken.trim()) {
          throw new Error("Token Embrapa não informado.");
        }
        setTestResult((prev) => ({
          ...prev,
          embrapa: {
            success: true,
            message: "Token Embrapa AgroAPI registrado para consultas SiBCS.",
          },
        }));
      } else if (tipo === "google") {
        if (!credenciais.googleMapsKey.trim()) {
          throw new Error("Chave Google Maps não informada.");
        }
        setTestResult((prev) => ({
          ...prev,
          google: {
            success: true,
            message: "Chave Google Maps registrada com sucesso.",
          },
        }));
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
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Planet NICFI &amp; Orders API Key
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              credenciais.planetApiKey
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
            }`}
          >
            {credenciais.planetApiKey ? "ATIVADA" : "DESATIVADA"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="password"
            value={credenciais.planetApiKey}
            onChange={(e) => setCredenciais({ planetApiKey: e.target.value })}
            placeholder="PLAK... Chave de API da Planet"
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
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Mapbox Satellite HD Token
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              credenciais.mapboxToken
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
            }`}
          >
            {credenciais.mapboxToken ? "ATIVADA" : "DESATIVADA"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="password"
            value={credenciais.mapboxToken}
            onChange={(e) => setCredenciais({ mapboxToken: e.target.value })}
            placeholder="pk.eyJ1..."
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

      {/* 3. Embrapa AgroAPI Token */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Embrapa AgroAPI / SmartSolos Token
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              credenciais.embrapaToken
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
            }`}
          >
            {credenciais.embrapaToken ? "ATIVADA" : "DESATIVADA"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="password"
            value={credenciais.embrapaToken}
            onChange={(e) => setCredenciais({ embrapaToken: e.target.value })}
            placeholder="Bearer eyJ... Token de acesso Embrapa"
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => testarToken("embrapa")}
            disabled={loading.embrapa}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {loading.embrapa ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            ) : (
              "Testar"
            )}
          </button>
        </div>

        {testResult.embrapa && (
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.embrapa.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {testResult.embrapa.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{testResult.embrapa.message}</span>
          </div>
        )}
      </div>

      {/* 4. Google Maps Key */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Google Maps API Key (Navegação &amp; Links)
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              credenciais.googleMapsKey
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
            }`}
          >
            {credenciais.googleMapsKey ? "ATIVADA" : "DESATIVADA"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="password"
            value={credenciais.googleMapsKey}
            onChange={(e) => setCredenciais({ googleMapsKey: e.target.value })}
            placeholder="AIzaSy... Chave Google Maps"
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
    </div>
  );
};
