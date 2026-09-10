"use client";

import React, { useState } from "react";

export interface ObservacaoTemporal {
  data: string; // YYYY-MM-DD
  ndvi: number | null;
  bsi: number | null;
}

interface GraficoSerieTemporalProps {
  dados?: ObservacaoTemporal[];
  titulo?: string;
}

/**
 * Gera série temporal demonstrativa com lacunas reais (nuvens/sombras).
 */
export function gerarSerieTemporalDemonstrativa(): ObservacaoTemporal[] {
  const obs: ObservacaoTemporal[] = [];
  const datas = [
    "2023-02-15", "2023-03-20", "2023-04-10", "2023-05-18", "2023-06-25",
    "2023-08-12", "2023-09-15", "2023-10-30", "2023-11-20", "2024-01-10",
    "2024-02-28", "2024-04-15", "2024-06-10", "2024-08-05", "2024-09-22",
    "2024-11-15", "2025-01-20", "2025-03-10", "2025-05-02", "2025-07-18",
  ];

  for (let i = 0; i < datas.length; i++) {
    // Simulando lacunas reais (ex: 2023-08-12 nublado -> null)
    if (i === 5 || i === 11 || i === 16) {
      obs.push({ data: datas[i], ndvi: null, bsi: null });
    } else {
      const ciclo = Math.sin((i / 4) * Math.PI);
      const ndvi = Number((0.45 + 0.35 * ciclo).toFixed(3));
      const bsi = Number((0.15 - 0.28 * ciclo).toFixed(3));
      obs.push({ data: datas[i], ndvi, bsi });
    }
  }

  return obs;
}

/**
 * Gráfico de Série Temporal Multiespectral — SAREL (§12.2)
 *
 * REGRA FUNDAMENTAL DE INTEGRIDADE VISUAL:
 * Lacunas temporais (nuvem, sombra, ausência de dado) são representadas como
 * DESCONTINUIDADE REAL no traçado da linha.
 * Interpolar visualmente conectando pontos através de uma lacuna é falseamento.
 */
export function GraficoSerieTemporal({
  dados = gerarSerieTemporalDemonstrativa(),
  titulo = "Série Temporal Sentinel-2 (NDVI e BSI) — 2023 a 2025",
}: GraficoSerieTemporalProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const largura = 600;
  const altura = 200;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  const plotLargura = largura - padding.left - padding.right;
  const plotAltura = altura - padding.top - padding.bottom;

  // Escala Y: de -0.5 a 1.0
  const yMin = -0.5;
  const yMax = 1.0;
  const escalaY = (v: number) => padding.top + plotAltura - ((v - yMin) / (yMax - yMin)) * plotAltura;
  const escalaX = (i: number) => padding.left + (i / (dados.length - 1)) * plotLargura;

  // Construir caminhos com descontinuidade estrita
  function construirSegmentosDescontinuos(seletor: (o: ObservacaoTemporal) => number | null): string[] {
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

  // Linha limiar solo nu (NDVI = 0.25)
  const ySoloNu = escalaY(0.25);
  // Linha zero
  const yZero = escalaY(0.0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">{titulo}</h4>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-full bg-emerald-600" />
            <span className="font-medium text-slate-700">NDVI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-full bg-amber-600" />
            <span className="font-medium text-slate-700">BSI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 border-b-2 border-dashed border-rose-500" />
            <span className="text-[11px] text-slate-500">Solo Nu (0.25)</span>
          </div>
        </div>
      </div>

      <div className="relative mt-2">
        <svg
          viewBox={`0 0 ${largura} ${altura}`}
          className="h-auto w-full overflow-visible select-none"
        >
          {/* Eixo Y Linhas de grade */}
          {[-0.5, 0.0, 0.25, 0.5, 0.75, 1.0].map((v) => (
            <g key={v}>
              <line
                x1={padding.left}
                y1={escalaY(v)}
                x2={largura - padding.right}
                y2={escalaY(v)}
                stroke={v === 0 ? "#cbd5e1" : "#f1f5f9"}
                strokeWidth={v === 0 ? "1.5" : "1"}
              />
              <text
                x={padding.left - 6}
                y={escalaY(v) + 3}
                fontSize="10"
                textAnchor="end"
                fill="#94a3b8"
                fontFamily="monospace"
              >
                {v.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Limiar de Solo Nu Tracejado */}
          <line
            x1={padding.left}
            y1={ySoloNu}
            x2={largura - padding.right}
            y2={ySoloNu}
            stroke="#f43f5e"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />

          {/* Áreas de Lacunas Nulas destacadas com hachura visual */}
          {dados.map((d, idx) => {
            if (d.ndvi === null) {
              const x = escalaX(idx);
              return (
                <g key={`lacuna-${idx}`}>
                  <rect
                    x={x - 8}
                    y={padding.top}
                    width={16}
                    height={plotAltura}
                    fill="#e2e8f0"
                    opacity={0.5}
                  />
                  <text
                    x={x}
                    y={padding.top + plotAltura / 2}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#64748b"
                    transform={`rotate(-90 ${x} ${padding.top + plotAltura / 2})`}
                  >
                    Lacuna
                  </text>
                </g>
              );
            }
            return null;
          })}

          {/* Traçados BSI (descontínuos) */}
          {caminhosBsi.map((seg, i) => (
            <path
              key={`bsi-${i}`}
              d={seg}
              fill="none"
              stroke="#d97706"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}

          {/* Traçados NDVI (descontínuos) */}
          {caminhosNdvi.map((seg, i) => (
            <path
              key={`ndvi-${i}`}
              d={seg}
              fill="none"
              stroke="#059669"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          ))}

          {/* Pontos de Observação Real */}
          {dados.map((d, idx) => {
            const x = escalaX(idx);
            if (d.ndvi === null) return null;

            const yNdvi = escalaY(d.ndvi);
            const yBsi = escalaY(d.bsi ?? 0);
            const isHover = hoverIdx === idx;

            return (
              <g
                key={`pts-${idx}`}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={x}
                  cy={yNdvi}
                  r={isHover ? 5 : 3.5}
                  fill="#059669"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <circle
                  cx={x}
                  cy={yBsi}
                  r={isHover ? 5 : 3.5}
                  fill="#d97706"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Rótulos do Eixo X */}
          {dados.map((d, idx) => {
            if (idx % 4 === 0 || idx === dados.length - 1) {
              const x = escalaX(idx);
              return (
                <text
                  key={`x-${idx}`}
                  x={x}
                  y={altura - 8}
                  fontSize="9"
                  textAnchor="middle"
                  fill="#64748b"
                >
                  {d.data.slice(2)}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Tooltip interativo */}
        {hoverIdx !== null && dados[hoverIdx] && dados[hoverIdx].ndvi !== null && (
          <div className="absolute right-4 top-2 rounded bg-slate-900/90 px-2.5 py-1.5 text-xs text-white shadow-md backdrop-blur">
            <p className="font-semibold text-slate-200">Data: {dados[hoverIdx].data}</p>
            <p className="text-emerald-400">NDVI: {dados[hoverIdx].ndvi?.toFixed(3)}</p>
            <p className="text-amber-400">BSI: {dados[hoverIdx].bsi?.toFixed(3)}</p>
          </div>
        )}
      </div>

      <p className="mt-2 text-[11px] text-slate-500 italic">
        Nota metodológica: Quebras no traçado representam lacunas reais de observação (cobertura de
        nuvens/sombras). Nenhuma interpolação sintética é projetada sobre o gráfico.
      </p>
    </div>
  );
}
