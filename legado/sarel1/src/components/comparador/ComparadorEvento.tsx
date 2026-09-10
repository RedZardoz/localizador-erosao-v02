"use client";

import React, { useState } from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { CloudRain, Calendar, ArrowRight, Eye, Crosshair } from "lucide-react";

export function ComparadorEvento() {
  const { obterPontoSelecionado } = useSarelStore();
  const ponto = obterPontoSelecionado();

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Metadados do par de evento associado ao ponto
  const evento = {
    dataChuva: "2024-10-18",
    precipitacaoMm: 52.4,
    i30Max: ponto && "valor" in ponto.chuva.i30Max ? (ponto.chuva.i30Max.valor as number) : 34.8,
    dataAntes: "2024-10-15", // T- (3 dias antes)
    dataDepois: "2024-10-27", // T+ (9 dias pós-chuva, solo seco)
    deltaZenital: 3.2, // graus
    intervaloDias: 12,
  };

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursorPos({ x, y });
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Comparador */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Comparador de Par de Evento Retrospectivo ($T^-$ vs $T^+$) — §12.5
            </h2>
            <p className="text-xs text-slate-500">
              Ponto em análise: <b>{ponto?.codigo ?? "PR-2026-0001"}</b> · Alinhamento temporal com chuvas erosivas
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono bg-slate-50 p-2 rounded-lg border">
            <span className="text-slate-600">&Delta;zenital: <b>{evento.deltaZenital}°</b> (&le; 10°)</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">Intervalo: <b>{evento.intervaloDias} dias</b> (&le; 20d)</span>
          </div>
        </div>

        {/* Linha do Tempo do Evento */}
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
            <div className="flex items-center gap-1 text-emerald-700">
              <Calendar className="h-4 w-4" />
              <span>T⁻ (Pré-evento): {evento.dataAntes}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded bg-blue-100 px-2.5 py-1 text-blue-900 border border-blue-300 font-bold">
              <CloudRain className="h-4 w-4 text-blue-600" />
              <span>Chuva Erosiva: {evento.dataChuva} · {evento.precipitacaoMm} mm · I₃₀ = {evento.i30Max} mm/h</span>
            </div>
            <div className="flex items-center gap-1 text-amber-700">
              <Calendar className="h-4 w-4" />
              <span>T⁺ (Pós-evento, Solo Seco): {evento.dataDepois}</span>
            </div>
          </div>

          <div className="relative h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1/4 bg-emerald-500" />
            <div className="absolute left-[45%] top-0 h-full w-[10%] bg-blue-600" />
            <div className="absolute right-0 top-0 h-full w-1/4 bg-amber-500" />
          </div>
        </div>
      </div>

      {/* Painéis Lado a Lado com Cursor Sincronizado */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Painel T- */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                T⁻ Pré-Chuva (PlanetScope / Sentinel-2) — {evento.dataAntes}
              </h3>
            </div>
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              Solo Coberto / Intacto
            </span>
          </div>

          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setCursorPos(null)}
            className="relative h-80 w-full overflow-hidden rounded-lg bg-emerald-900/10 border border-slate-200 cursor-crosshair flex items-center justify-center"
            style={{
              background: "radial-gradient(circle at 50% 50%, #064e3b 0%, #022c22 100%)",
            }}
          >
            {/* Elementos simulados de textura espectral de solo protegido */}
            <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="text-center text-white/80 p-4">
              <p className="text-xs font-mono font-bold">Cena Órbita PSScene (8 bandas SR)</p>
              <p className="text-[11px] text-emerald-200 mt-1">Refletância estável · Sem evidência de arraste</p>
            </div>

            {/* Cursor sincronizado */}
            {cursorPos && (
              <div
                className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
              >
                <Crosshair className="h-6 w-6 text-emerald-300 drop-shadow-md" />
              </div>
            )}
          </div>
        </div>

        {/* Painel T+ */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                T⁺ Pós-Chuva com Solo Seco — {evento.dataDepois}
              </h3>
            </div>
            <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
              Solo Seco / Arraste Visível
            </span>
          </div>

          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setCursorPos(null)}
            className="relative h-80 w-full overflow-hidden rounded-lg bg-amber-950/20 border border-slate-200 cursor-crosshair flex items-center justify-center"
            style={{
              background: "radial-gradient(circle at 50% 50%, #78350f 0%, #451a03 100%)",
            }}
          >
            {/* Elementos simulados de alteração espectral pós-chuva */}
            <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="text-center text-white/80 p-4">
              <p className="text-xs font-mono font-bold">Cena Órbita PSScene (8 bandas SR)</p>
              <p className="text-[11px] text-amber-200 mt-1">Exposição de horizonte subsuperficial / deposição em sopé</p>
            </div>

            {/* Cursor sincronizado */}
            {cursorPos && (
              <div
                className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
              >
                <Crosshair className="h-6 w-6 text-amber-300 drop-shadow-md" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600 leading-relaxed shadow-sm">
        <p className="font-semibold text-slate-800">Diretriz Metodológica de Comparabilidade (§10.3 e §12.5):</p>
        <p className="mt-1">
          O par de evento deve pertencer ao mesmo sensor calibrado com harmonização radiométrica ativa. A observação
          do evento em T⁺ é realizada estritamente após o solo secar (7 a 15 dias), de modo que a reflectância
          reflita redistribuição morfológica e perda laminar real, e não umidade residual transitória pós-chuva.
        </p>
      </div>
    </div>
  );
}
