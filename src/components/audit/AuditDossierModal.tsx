"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Copy,
  Check,
  Code,
  ShieldCheck,
  FileText,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import { formatToDMS } from "@/lib/export/dms";
import { valorOuNulo } from "@/types/proveniencia";

export const AuditDossierModal: React.FC = () => {
  const { modalAtiva, setModalAtiva, pontoAuditoria } = useSarelStore();
  const [copiado, setCopiado] = useState(false);

  if (modalAtiva !== "audit-dossier" || !pontoAuditoria) return null;

  const p = pontoAuditoria;
  const dmsLat = formatToDMS(p.latitude, true);
  const dmsLon = formatToDMS(p.longitude, false);
  const elevacaoNum = valorOuNulo(p.terreno.elevacao);
  const elevacao = elevacaoNum !== null ? Math.round(elevacaoNum) : "—";
  const declivPct = valorOuNulo(p.terreno.declividadePct);
  const twiVal = valorOuNulo(p.terreno.twi);

  const munNome = valorOuNulo(p.localizacao.municipio) || "Paraná";
  const bacNome = valorOuNulo(p.localizacao.bacia) || "Bacia";
  const soloOrd = valorOuNulo(p.solo.ordem) || "Não mapeado";
  const soloSubOrd = valorOuNulo(p.solo.subOrdem) || "—";
  const soloErod = valorOuNulo(p.solo.erodibilidadeClasse) || "—";

  const perdaSoloVal = valorOuNulo(p.linhaDeBase?.perdaSolo);
  const fatorCVal = valorOuNulo(p.linhaDeBase?.fatorC);
  const fatorLSVal = valorOuNulo(p.linhaDeBase?.fatorLS);

  // Script GEE JavaScript Reprodutível Gerado para a Coordenada Exata
  const scriptGee = `/**
 * ============================================================================
 * Script de Reprodutibilidade GEE — SAREL v2 (PPGTCA 2026)
 * Ponto Amostral: ${p.codigo}
 * Coordenadas: [${p.longitude.toFixed(6)}, ${p.latitude.toFixed(6)}] (WGS84)
 * Município: ${munNome} — Bacia: ${bacNome}
 * ============================================================================
 */

var ponto = ee.Geometry.Point([${p.longitude.toFixed(6)}, ${p.latitude.toFixed(6)}]);
Map.centerObject(ponto, 15);
Map.setOptions('SATELLITE');

// 1. Coleção Sentinel-2 Harmonized L2A (2018 a 2023) com máscara de nuvens SCL
function mascaraNuvens(image) {
  var scl = image.select('SCL');
  // Mantém vegetação (4), solo nu (5) e água (6)
  var mask = scl.eq(4).or(scl.eq(5)).or(scl.eq(6));
  return image.updateMask(mask).divide(10000);
}

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(ponto)
  .filterDate('2018-01-01', '2023-12-31')
  .map(mascaraNuvens);

// 2. Cálculo dos Índices BSI e NDVI
var comIndices = s2.map(function(img) {
  var ndvi = img.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var bsi = img.expression(
    '((SWIR + RED) - (NIR + BLUE)) / ((SWIR + RED) + (NIR + BLUE))',
    {
      'SWIR': img.select('B11'),
      'RED': img.select('B4'),
      'NIR': img.select('B8'),
      'BLUE': img.select('B2')
    }
  ).rename('BSI');
  return img.addBands([ndvi, bsi]);
});

// 3. Relevo e Declividade (Copernicus DEM 30m)
var dem = ee.ImageCollection('COPERNICUS/DEM/GLO30')
  .filterBounds(ponto)
  .first()
  .select('DEM');
var declividadeGraus = ee.Terrain.slope(dem);
var declividadePct = declividadeGraus.multiply(Math.PI / 180).tan().multiply(100);

// Visualização no Mapa do GEE
Map.addLayer(dem, {min: 200, max: 1200, palette: ['blue', 'green', 'yellow', 'brown']}, 'Copernicus DEM 30m', false);
Map.addLayer(ponto, {color: 'FF0000'}, 'Ponto ${p.codigo}');

// Extração dos Valores no Ponto
print('Amostra ${p.codigo}:', {
  'Latitude': ${p.latitude.toFixed(6)},
  'Longitude': ${p.longitude.toFixed(6)},
  'Altitude_DEM': dem.reduceRegion(ee.Reducer.first(), ponto, 30).get('DEM'),
  'Declividade_Pct': declividadePct.reduceRegion(ee.Reducer.first(), ponto, 30).get('slope')
});
`;

  const copiarScript = () => {
    navigator.clipboard.writeText(scriptGee);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const dispararImpressao = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header do Dossiê */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Dossiê de Auditoria Científica &amp; Reprodutibilidade GEE
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  {p.codigo}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Memória de cálculo reprodutível e script Google Earth Engine — Dissertação PPGTCA 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={dispararImpressao}
              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Dossiê (.pdf)</span>
            </button>

            <button
              onClick={() => setModalAtiva(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo Imprimível do Dossiê */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 print:p-0 print:space-y-4 print:text-black">
          {/* Metadados Geográficos e Fundiários */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Identificação &amp; Localização do Ponto
              </span>
              <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                SIRGAS 2000 / WGS84 (EPSG:4326)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Latitude (Dec / DMS)</span>
                <span className="font-bold text-slate-900 dark:text-white">{p.latitude.toFixed(6)}°</span>
                <span className="text-[10px] text-slate-500 block">{dmsLat}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Longitude (Dec / DMS)</span>
                <span className="font-bold text-slate-900 dark:text-white">{p.longitude.toFixed(6)}°</span>
                <span className="text-[10px] text-slate-500 block">{dmsLon}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Município / Bacia</span>
                <span className="font-bold text-slate-900 dark:text-white font-sans truncate block">
                  {munNome}
                </span>
                <span className="text-[10px] text-slate-500 font-sans truncate block">
                  {bacNome}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Imóvel Rural (CAR)</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">
                  {p.fundiario?.codigoCar || "Sem correspondência"}
                </span>
                <span className="text-[10px] text-slate-500 font-sans">
                  {p.fundiario?.titularMascarado || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Memória Biofísica e RUSLE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Terreno */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                1. Relevo (Copernicus DEM 30m)
              </span>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Altitude:</span>
                  <span className="font-bold">{elevacao} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Declividade:</span>
                  <span className="font-bold">{declivPct !== null ? `${declivPct.toFixed(1)}%` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">TWI (Umidade):</span>
                  <span className="font-bold">{twiVal !== null ? twiVal.toFixed(2) : "—"}</span>
                </div>
              </div>
            </div>

            {/* Solo Embrapa */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                2. Solo (Embrapa SiBCS)
              </span>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Ordem:</span>
                  <span className="font-bold font-sans">{soloOrd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Sub-Ordem:</span>
                  <span className="font-bold font-sans">{soloSubOrd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Erodibilidade:</span>
                  <span className="font-bold font-sans">{soloErod}</span>
                </div>
              </div>
            </div>

            {/* RUSLE */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                3. Linha de Base RUSLE
              </span>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Perda Estimada:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {perdaSoloVal !== null ? `${perdaSoloVal.toFixed(1)} t/ha·ano` : "Pendente"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Fator C (Durigon):</span>
                  <span className="font-bold">{fatorCVal !== null ? fatorCVal.toFixed(3) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Fator LS:</span>
                  <span className="font-bold">{fatorLSVal !== null ? fatorLSVal.toFixed(2) : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Script JavaScript Reprodutível para GEE Code Editor */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-2.5 print:bg-white print:text-black print:border-black">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">
                  Script JavaScript Executável no Google Earth Engine Code Editor
                </span>
              </div>
              <button
                onClick={copiarScript}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer print:hidden"
              >
                {copiado ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Script GEE</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 bg-slate-950/80 rounded-lg text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed border border-slate-800 print:max-h-none print:border-none">
              <code>{scriptGee}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Auditoria Científica em conformidade com as 9 Regras do SAREL</span>
          </div>

          <button
            onClick={() => setModalAtiva(null)}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Fechar Dossiê
          </button>
        </div>
      </div>
    </div>
  );
};
