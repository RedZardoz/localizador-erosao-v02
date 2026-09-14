"use client";

import React from "react";
import {
  X,
  MapPin,
  Mountain,
  TrendingUp,
  Percent,
  Layers,
  Globe,
  Printer,
  ExternalLink,
  ShieldCheck,
  Building,
} from "lucide-react";
import type { PontoAmostral } from "@/types/ponto";
import { formatToDMS } from "@/lib/export/dms";
import { useSarelStore } from "@/store/useSarelStore";
import { valorOuNulo } from "@/types/proveniencia";

interface PointPopupProps {
  point: PontoAmostral;
  onClose: () => void;
}

export const PointPopup: React.FC<PointPopupProps> = ({ point, onClose }) => {
  const { setPontoAuditoria, setModalAtiva } = useSarelStore();

  const dmsLat = formatToDMS(point.latitude, true);
  const dmsLon = formatToDMS(point.longitude, false);

  const elevacaoNum = valorOuNulo(point.terreno.elevacao);
  const elevacao = elevacaoNum !== null ? Math.round(elevacaoNum) : null;
  const declivPctNum = valorOuNulo(point.terreno.declividadePct);
  const declividadePct = declivPctNum !== null ? declivPctNum.toFixed(1) : "—";
  const declivGrausNum = valorOuNulo(point.terreno.declividadeGraus);
  const declividadeGraus = declivGrausNum !== null ? declivGrausNum.toFixed(1) : "—";

  // Índices reais
  const freqNuNum = valorOuNulo(point.temporal.D?.serie.frequenciaSoloNu);
  const freqSoloNu = freqNuNum !== null ? freqNuNum.toFixed(2) : "—";

  const ndviP50Num = valorOuNulo(point.temporal.D?.serie.estatisticas["B8_p50"]);
  const ndviP50 = ndviP50Num !== null ? ndviP50Num.toFixed(2) : "—";

  const bsiNum = valorOuNulo(point.espectral?.bsi);
  const ndviNum = valorOuNulo(point.espectral?.ndvi);
  const bsiStr = bsiNum !== null ? bsiNum.toFixed(2) : "—";
  const ndviStr = ndviNum !== null ? ndviNum.toFixed(2) : "—";
  const classeAmostral = point.classeAmostral ?? "indefinido";

  // Base Fundiária
  const car = point.fundiario?.codigoCar;
  const titular = point.fundiario?.titularMascarado || "Não informado";
  const statusFundiario = point.fundiario?.status || "sem-correspondencia";

  // RUSLE
  const rusle = point.linhaDeBase;

  // Localizacao e Solos
  const municipioNome = valorOuNulo(point.localizacao.municipio) || "Paraná";
  const baciaNome = valorOuNulo(point.localizacao.bacia) || "Bacia";
  const soloOrdem = valorOuNulo(point.solo.ordem) || "Não mapeado";
  const soloSubOrdem = valorOuNulo(point.solo.subOrdem);

  // URLs externas oficiais
  const elevacaoStr = elevacao !== null ? `${elevacao}a` : "800a";
  const urlGoogleEarth = `https://earth.google.com/web/@${point.latitude},${point.longitude},${elevacaoStr},1200d,35y,0h,45t,0r`;
  const urlGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`;

  const abrirDossieAuditoria = () => {
    setPontoAuditoria(point);
    setModalAtiva("audit-dossier");
  };

  return (
    <div className="absolute top-16 right-4 z-20 w-96 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3 text-slate-800 dark:text-slate-200 animate-in fade-in slide-in-from-right-4">
      {/* Header do Popup */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono">
              {point.codigo}
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              Estrato: {point.estratoId}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
            {municipioNome} — {baciaNome}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          title="Fechar inspeção"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Banner de Classificação Biofísica da Pesquisa (PPGTCA 2026) */}
      <div
        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
          classeAmostral === "erosao"
            ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200"
            : classeAmostral === "controle"
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200"
            : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full shrink-0 ${
              classeAmostral === "erosao"
                ? "bg-red-500"
                : classeAmostral === "controle"
                ? "bg-emerald-500"
                : "bg-amber-500"
            }`}
          />
          <div>
            <div className="font-bold text-[11px] uppercase tracking-wider">
              {classeAmostral === "erosao"
                ? "Erosão Laminar (Classe 1)"
                : classeAmostral === "controle"
                ? "Controle / SPD (Classe 0)"
                : "Amostra em Avaliação"}
            </div>
            <div className="text-[10px] opacity-80">
              {classeAmostral === "erosao"
                ? "BSI > 0.10 e NDVI < 0.40"
                : classeAmostral === "controle"
                ? "BSI < 0.00 e NDVI > 0.65"
                : "Transição ou sem medição"}
            </div>
          </div>
        </div>

        <div className="text-right font-mono text-[10px]">
          <div>BSI: <span className="font-bold">{bsiStr}</span></div>
          <div>NDVI: <span className="font-bold">{ndviStr}</span></div>
        </div>
      </div>

      {/* Coordenadas e Altimetria */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Lat / Lon (Decimal):
          </span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {point.latitude.toFixed(5)}°, {point.longitude.toFixed(5)}°
          </span>
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
          <span>DMS:</span>
          <span>{dmsLat} | {dmsLon}</span>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
          <span className="text-slate-500">Altitude DEM Copernicus:</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {elevacao !== null ? `${elevacao} m` : "—"}
          </span>
        </div>
      </div>

      {/* Grid de Atributos Reais */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Declividade */}
        <div className="p-2 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <TrendingUp className="w-3 h-3 text-amber-500" />
            <span>Declividade DEM</span>
          </div>
          <div className="text-xs font-bold font-mono text-slate-900 dark:text-white mt-0.5">
            {declividadePct}% ({declividadeGraus}°)
          </div>
        </div>

        {/* Solo Nu */}
        <div className="p-2 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Percent className="w-3 h-3 text-rose-500" />
            <span>Frequência Solo Nu</span>
          </div>
          <div className="text-xs font-bold font-mono text-slate-900 dark:text-white mt-0.5">
            {freqSoloNu}
          </div>
        </div>

        {/* Solo Embrapa */}
        <div className="p-2 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2">
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Layers className="w-3 h-3 text-emerald-500" />
            <span>Classificação Oficial de Solos (Embrapa SiBCS)</span>
          </div>
          <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
            {soloOrdem} {soloSubOrdem ? `(${soloSubOrdem})` : ""}
          </div>
        </div>
      </div>

      {/* Cadastro Rural (SICAR / SNCR) */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span className="flex items-center gap-1">
            <Building className="w-3 h-3 text-indigo-500" />
            Base Fundiária Oficial
          </span>
          <span
            className={`px-1.5 py-0.2 rounded font-mono ${
              statusFundiario === "encontrado"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {statusFundiario === "encontrado" ? "Imóvel CAR ✓" : "Sem Correspondência"}
          </span>
        </div>

        {car ? (
          <div className="space-y-0.5 text-[11px]">
            <div className="flex justify-between font-mono">
              <span className="text-slate-500">Código CAR:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[190px]">
                {car}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Titular SNCR:</span>
              <span className="italic text-slate-700 dark:text-slate-300">
                {titular}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic">
            Nenhum imóvel rural sobreposto na base local do SICAR/SNCR.
          </p>
        )}
      </div>

      {/* Memória de Cálculo RUSLE */}
      {rusle && (
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Linha de Base RUSLE (A = R·K·LS·C·P)
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {valorOuNulo(rusle.perdaSolo) !== null ? `${valorOuNulo(rusle.perdaSolo)!.toFixed(1)} t/ha·ano` : "—"}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px] pt-1">
            <div className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[9px]">R</span>
              <span className="font-bold">{valorOuNulo(rusle.fatorR) !== null ? valorOuNulo(rusle.fatorR)!.toFixed(0) : "—"}</span>
            </div>
            <div className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[9px]">K</span>
              <span className="font-bold">{valorOuNulo(rusle.fatorK) !== null ? valorOuNulo(rusle.fatorK)!.toFixed(3) : "—"}</span>
            </div>
            <div className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[9px]">LS</span>
              <span className="font-bold">{valorOuNulo(rusle.fatorLS) !== null ? valorOuNulo(rusle.fatorLS)!.toFixed(2) : "—"}</span>
            </div>
            <div className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[9px]">C (Dur)</span>
              <span className="font-bold">{valorOuNulo(rusle.fatorC) !== null ? valorOuNulo(rusle.fatorC)!.toFixed(3) : "—"}</span>
            </div>
            <div className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[9px]">P</span>
              <span className="font-bold">{valorOuNulo(rusle.fatorP) !== null ? valorOuNulo(rusle.fatorP)!.toFixed(2) : "—"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ação Exigidos: Google Earth Web, Google Maps e Dossiê Científico GEE */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <a
            href={urlGoogleEarth}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Earth</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <a
            href={urlGoogleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Botão de Dossiê Científico e Script GEE */}
        <button
          onClick={abrirDossieAuditoria}
          className="w-full h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir Dossiê &amp; Script GEE</span>
        </button>
      </div>
    </div>
  );
};
