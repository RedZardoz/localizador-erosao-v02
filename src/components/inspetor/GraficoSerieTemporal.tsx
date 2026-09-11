"use client";

import React, { useState } from "react";

export interface PontoSerieVisual {
  data: string; // YYYY-MM-DD
  ndvi: number | null;
  bsi: number | null;
}

interface GraficoSerieTemporalProps {
  dados: PontoSerieVisual[];
  titulo?: string;
}

/**
 * Gráfico de Série Temporal Multiespectral — SAREL (§19)
 *
 * REGRA FUNDAMENTAL DE INTEGRIDADE VISUAL:
 * Lacunas temporais (nuvem, sombra, máscara, ausência de dado) são representadas
 * como DESCONTINUIDADE REAL no traçado da linha.
 * Interpolar visualmente conectando pontos através de uma lacuna é falseamento.
 */
export function GraficoSerieTemporal({
  dados,
  titulo = "Série Temporal Sentinel-2 (NDVI e BSI) — Lacunas como Descontinuidades",
}: GraficoSerieTemporalProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const largura = 600;
  const altura = 200;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  const plotLargura = largura - padding.left - padding.right;
  const plotAltura = altura - padding.top - padding.bottom;

  // Escala Y fixa de -0.5 a 1.0 (faixa típica de NDVI e BSI)
  const yMin = -0.5;
  const yMax = 1.0;
  const escalaY = (v: number) => padding.top + plotAltura - ((v - yMin) / (yMax - yMin)) * plotAltura;
  const escalaX = (i: number) => padding.left + (i / (dados.length > 1 ? dados.length - 1 : 1)) * plotLargura;

  // Construir caminhos SVG com quebra imediata na presença de null
  function construirSegmentosDescontinuos(seletor: (o: PontoSerieVisual) => number | null): string[] {
    const caminhos: string[] = [];
    let segmentoAtual: string[] = [];

    dados.forEach((d, idx) => {
      const val = seletor(d);
      if (val !== null && !isNaN(val)) {
        const x = escalaX(idx).toFixed(1);
        const y = escalaY(val).toFixed(1);
        if (segmentoAtual.length === 0) {
          segmentoAtual.push(`M ${x} ${y}`);
        } else {
          segmentoAtual.push(`L ${x} ${y}`);
        }
      } else {
        // Encontrou lacuna: quebra a linha imediatamente
        if (segmentoAtual.length > 0) {
          caminhos.push(segmentoAtual.join(" "));
          segmentoAtual = [];
        }
      }
    });

    if (segmentoAtual.length > 0) {
      caminhos.push(segmentoAtual.join(" "));
    }

    return caminhos;
  }

  const caminhosNdvi = construirSegmentosDescontinuos((d) => d.ndvi);
  const caminhosBsi = construirSegmentosDescontinuos((d) => d.bsi);

  const totalObservacoes = dados.length;
  const validasNdvi = dados.filter((d) => d.ndvi !== null).length;
  const lacunasNdvi = totalObservacoes - validasNdvi;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{titulo}</h3>
          <p className="text-xs text-slate-500">
            {validasNdvi} observações válidas · {lacunasNdvi} lacunas (máscara de nuvem/sombra)
          </p>
        </div>

        {/* Legenda visual */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            <span className="font-medium text-slate-700">NDVI (Vegetação)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
            <span className="font-medium text-slate-700">BSI (Solo Descoberto)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="inline-block border-b border-dashed border-slate-300 w-4" />
            <span>Lacunas reais</span>
          </div>
        </div>
      </div>

      {totalObservacoes === 0 ? (
        <div className="flex h-48 items-center justify-center text-xs text-slate-400">
          Nenhuma observação temporal carregada para este ponto.
        </div>
      ) : (
        <div className="relative mt-4 flex justify-center overflow-x-auto">
          <svg width={largura} height={altura} className="overflow-visible">
            {/* Grade de fundo */}
            {[-0.5, 0.0, 0.5, 1.0].map((val) => {
              const y = escalaY(val);
              return (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={largura - padding.right}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Linha zero de referência */}
            <line
              x1={padding.left}
              y1={escalaY(0)}
              x2={largura - padding.right}
              y2={escalaY(0)}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* Traçados com descontinuidade estrita */}
            {caminhosNdvi.map((dPath, i) => (
              <path key={`ndvi-${i}`} d={dPath} fill="none" stroke="#059669" strokeWidth="2" />
            ))}

            {caminhosBsi.map((dPath, i) => (
              <path key={`bsi-${i}`} d={dPath} fill="none" stroke="#d97706" strokeWidth="2" />
            ))}

            {/* Pontos observados */}
            {dados.map((d, idx) => {
              const x = escalaX(idx);
              const isHover = hoverIdx === idx;

              return (
                <g key={d.data}>
                  {d.ndvi !== null && (
                    <circle
                      cx={x}
                      cy={escalaY(d.ndvi)}
                      r={isHover ? 5 : 2.5}
                      className="fill-emerald-600 transition-all cursor-pointer"
                      onMouseEnter={() => setHoverIdx(idx)}
                      onMouseLeave={() => setHoverIdx(null)}
                    />
                  )}
                  {d.bsi !== null && (
                    <circle
                      cx={x}
                      cy={escalaY(d.bsi)}
                      r={isHover ? 5 : 2.5}
                      className="fill-amber-600 transition-all cursor-pointer"
                      onMouseEnter={() => setHoverIdx(idx)}
                      onMouseLeave={() => setHoverIdx(null)}
                    />
                  )}

                  {/* Sinalizador visual de lacuna */}
                  {d.ndvi === null && (
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={altura - padding.bottom}
                      stroke="#fecaca"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip de inspeção */}
          {hoverIdx !== null && dados[hoverIdx] && (
            <div className="absolute top-2 right-4 rounded-md bg-slate-900/90 p-2 text-[11px] text-white shadow-lg backdrop-blur-sm">
              <p className="font-semibold">{dados[hoverIdx].data}</p>
              <p className="text-emerald-300">
                NDVI: {dados[hoverIdx].ndvi !== null ? dados[hoverIdx].ndvi?.toFixed(3) : "mascarado (nuvem)"}
              </p>
              <p className="text-amber-300">
                BSI: {dados[hoverIdx].bsi !== null ? dados[hoverIdx].bsi?.toFixed(3) : "mascarado (nuvem)"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
