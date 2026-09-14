"use client";

import React, { useState } from "react";
import { DiagnosticoPersistencia, RegimeFenologico } from "@/lib/gee/persistenciaTemporal";

export interface PontoSerieVisual {
  data: string; // YYYY-MM-DD
  ndvi: number | null;
  bsi: number | null;
}

export interface GraficoSerieTemporalProps {
  dados: PontoSerieVisual[];
  titulo?: string;
  modeloAtivo?: "D" | "P";
  onModeloChange?: (modelo: "D" | "P") => void;
  dataReferencia?: string; // YYYY-MM-DD (data do evento ou t0)
  intervaloGuardaMeses?: number; // Padrão: 12 meses (Decisão D04)
  diagnosticoPersistencia?: DiagnosticoPersistencia | null;
}

/**
 * Gráfico de Série Temporal Multiespectral — SAREL (§19 & Etapa 4)
 *
 * REGRAS METODOLÓGICAS FUNDAMENTAIS:
 * 1. INTEGRIDADE VISUAL: Lacunas temporais (nuvem, sombra, máscara) são
 *    representadas como DESCONTINUIDADE REAL no traçado da linha. Interpolar
 *    visualmente através de uma lacuna é falseamento de dados.
 * 2. LIMIARES BIOFÍSICOS:
 *    - NDVI = 0.40 (Solo Exposto / Degradação - Decisão D10)
 *    - NDVI = 0.65 (Dossel Fechado / Manejo SPD - Critério de Controle)
 * 3. MODELO D vs MODELO P (Decisão D04):
 *    - Modelo D: série contemporânea até t0.
 *    - Modelo P: intervalo de guarda temporal obrigatório (>= 12 meses) demarcado
 *      graficamente para eliminar vazamento de alvo (data leakage).
 */
export function GraficoSerieTemporal({
  dados,
  titulo = "Série Temporal Multianual Sentinel-2 (NDVI e BSI)",
  modeloAtivo,
  onModeloChange,
  dataReferencia,
  intervaloGuardaMeses = 12,
  diagnosticoPersistencia,
}: GraficoSerieTemporalProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [modeloLocal, setModeloLocal] = useState<"D" | "P">("D");

  const modo = modeloAtivo ?? modeloLocal;
  const setModo = onModeloChange ?? setModeloLocal;

  const largura = 660;
  const altura = 240;
  const padding = { top: 25, right: 35, bottom: 40, left: 45 };

  const plotLargura = largura - padding.left - padding.right;
  const plotAltura = altura - padding.top - padding.bottom;

  // Escala Y fixa de -0.5 a 1.0 (faixa biofísica típica de NDVI e BSI)
  const yMin = -0.5;
  const yMax = 1.0;
  const escalaY = (v: number) => padding.top + plotAltura - ((v - yMin) / (yMax - yMin)) * plotAltura;
  const escalaX = (i: number) => padding.left + (i / (dados.length > 1 ? dados.length - 1 : 1)) * plotLargura;

  // Determinar limite do intervalo de guarda para Modelo P
  let idxInicioGuarda: number | null = null;
  let dataCorteGuarda: string | null = null;

  if (modo === "P" && dados.length > 0) {
    const dataRefStr = dataReferencia || dados[dados.length - 1]?.data;
    if (dataRefStr) {
      const dRef = new Date(dataRefStr);
      dRef.setMonth(dRef.getMonth() - intervaloGuardaMeses);
      dataCorteGuarda = dRef.toISOString().split("T")[0];

      // Encontrar índice do primeiro ponto dentro da guarda
      const idx = dados.findIndex((d) => d.data >= dataCorteGuarda!);
      if (idx !== -1) {
        idxInicioGuarda = idx;
      }
    }
  }

  // Construir caminhos SVG com quebra estrita na presença de null (Regra de Integridade)
  function construirSegmentosDescontinuos(
    seletor: (o: PontoSerieVisual) => number | null,
    limitarGuarda = false
  ): string[] {
    const caminhos: string[] = [];
    let segmentoAtual: string[] = [];

    dados.forEach((d, idx) => {
      // Se for modelo P e estiver na guarda, corta o traçado
      if (limitarGuarda && idxInicioGuarda !== null && idx >= idxInicioGuarda) {
        if (segmentoAtual.length > 0) {
          caminhos.push(segmentoAtual.join(" "));
          segmentoAtual = [];
        }
        return;
      }

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

  const caminhosNdvi = construirSegmentosDescontinuos((d) => d.ndvi, modo === "P");
  const caminhosBsi = construirSegmentosDescontinuos((d) => d.bsi, modo === "P");

  const totalObservacoes = dados.length;
  const validasNdvi = dados.filter((d) => d.ndvi !== null).length;
  const lacunasNdvi = totalObservacoes - validasNdvi;

  // Badge do Regime de Persistência
  function renderBadgeRegime(regime?: RegimeFenologico) {
    if (!regime) return null;

    switch (regime) {
      case "degradacao_persistente":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
            Degradação Crônica / Erosão Ativa
          </span>
        );
      case "pousio_transitorio":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
            Pousio Agrícola Transitório (Recuperou Dossel)
          </span>
        );
      case "vegetacao_estavel":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Vegetação Estável / Cobertura Plena
          </span>
        );
      case "inconclusivo":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
            Inconclusivo (Cenas Insuficientes)
          </span>
        );
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Cabeçalho do Gráfico com Controles de Modelo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-bold text-slate-900">{titulo}</h3>
            {diagnosticoPersistencia && renderBadgeRegime(diagnosticoPersistencia.regime)}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {validasNdvi} observações válidas · {lacunasNdvi} lacunas (nuvem/sombra) · Lacunas não-interpoladas
          </p>
        </div>

        {/* Seletor de Modelo (D vs P — Decisão D04) */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
          <button
            onClick={() => setModo("D")}
            className={`rounded-md px-3 py-1 transition-all ${
              modo === "D"
                ? "bg-white font-bold text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Modelo D (Detecção t₀)
          </button>
          <button
            onClick={() => setModo("P")}
            className={`rounded-md px-3 py-1 transition-all ${
              modo === "P"
                ? "bg-white font-bold text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Modelo P (Prognóstico 12m)
          </button>
        </div>
      </div>

      {/* Alerta de Decisão D04 / Guarda Temporal */}
      {modo === "P" && (
        <div className="rounded-lg bg-indigo-50/70 border border-indigo-100 p-2.5 text-xs text-indigo-900 flex items-start gap-2">
          <span className="font-bold text-indigo-600 mt-0.5">D04:</span>
          <div>
            <strong>Intervalo de Guarda Temporal Ativo (≥ 12 meses):</strong> As observações dentro do
            período de 12 meses anteriores a {dataReferencia || "t₀"} são visualmente segregadas e
            estritamente proibidas no Modelo P para evitar vazamento de alvo (*temporal data leakage*).
          </div>
        </div>
      )}

      {/* Legenda Espectral e Limiares Biofísicos */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs bg-slate-50/60 rounded-lg p-2.5 border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            <span className="font-medium text-slate-700">NDVI (Vegetação)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
            <span className="font-medium text-slate-700">BSI (Solo Descoberto)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="inline-block border-b border-dashed border-red-300 w-4" />
            <span>Lacuna real (nuvem)</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="inline-block border-b border-dashed border-emerald-600 w-3" />
            <span>Dossel Fechado (NDVI ≥ 0.65)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block border-b border-dashed border-amber-600 w-3" />
            <span>Solo Exposto (NDVI &lt; 0.40 · D10)</span>
          </div>
        </div>
      </div>

      {/* Gráfico SVG */}
      {totalObservacoes === 0 ? (
        <div className="flex h-52 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
          <p>Nenhuma observação temporal carregada para este ponto amostral.</p>
          <p className="mt-1 text-[11px] text-slate-400">
            As séries Sentinel-2 são extraídas automaticamente na consulta da coleção GEE.
          </p>
        </div>
      ) : (
        <div className="relative mt-2 flex justify-center overflow-x-auto">
          <svg width={largura} height={altura} className="overflow-visible select-none">
            {/* Faixa de Guarda Temporal (Modelo P) */}
            {modo === "P" && idxInicioGuarda !== null && (
              <g>
                <rect
                  x={escalaX(idxInicioGuarda)}
                  y={padding.top}
                  width={largura - padding.right - escalaX(idxInicioGuarda)}
                  height={plotAltura}
                  fill="rgba(239, 68, 68, 0.07)"
                  stroke="#fca5a5"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={(escalaX(idxInicioGuarda) + largura - padding.right) / 2}
                  y={padding.top + 16}
                  textAnchor="middle"
                  className="text-[10px] fill-red-600 font-semibold tracking-wide"
                >
                  GUARDA TEMPORAL (12m) — SEM VAZAMENTO
                </text>
              </g>
            )}

            {/* Grade de fundo horizontal */}
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

            {/* Linha Biofísica: Limiar de Solo Exposto (NDVI = 0.40 - D10) */}
            <g>
              <line
                x1={padding.left}
                y1={escalaY(0.4)}
                x2={largura - padding.right}
                y2={escalaY(0.4)}
                stroke="#d97706"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={largura - padding.right}
                y={escalaY(0.4) - 4}
                textAnchor="end"
                className="text-[9px] fill-amber-700 font-medium"
              >
                Solo Exposto (NDVI &lt; 0.40 · D10)
              </text>
            </g>

            {/* Linha Biofísica: Limiar de Dossel Fechado / SPD (NDVI = 0.65) */}
            <g>
              <line
                x1={padding.left}
                y1={escalaY(0.65)}
                x2={largura - padding.right}
                y2={escalaY(0.65)}
                stroke="#059669"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={largura - padding.right}
                y={escalaY(0.65) - 4}
                textAnchor="end"
                className="text-[9px] fill-emerald-700 font-medium"
              >
                Dossel Fechado (NDVI ≥ 0.65)
              </text>
            </g>

            {/* Traçados SVG com descontinuidade estrita */}
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
              const estaNaGuarda = modo === "P" && idxInicioGuarda !== null && idx >= idxInicioGuarda;

              return (
                <g key={d.data}>
                  {d.ndvi !== null && (
                    <circle
                      cx={x}
                      cy={escalaY(d.ndvi)}
                      r={isHover ? 5 : estaNaGuarda ? 2 : 2.5}
                      className={`transition-all cursor-pointer ${
                        estaNaGuarda
                          ? "fill-slate-300 stroke-red-400 stroke-1 opacity-50"
                          : "fill-emerald-600"
                      }`}
                      onMouseEnter={() => setHoverIdx(idx)}
                      onMouseLeave={() => setHoverIdx(null)}
                    />
                  )}
                  {d.bsi !== null && (
                    <circle
                      cx={x}
                      cy={escalaY(d.bsi)}
                      r={isHover ? 5 : estaNaGuarda ? 2 : 2.5}
                      className={`transition-all cursor-pointer ${
                        estaNaGuarda
                          ? "fill-slate-300 stroke-red-400 stroke-1 opacity-50"
                          : "fill-amber-600"
                      }`}
                      onMouseEnter={() => setHoverIdx(idx)}
                      onMouseLeave={() => setHoverIdx(null)}
                    />
                  )}

                  {/* Sinalizador visual de lacuna real */}
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

          {/* Tooltip interativo */}
          {hoverIdx !== null && dados[hoverIdx] && (
            <div className="absolute top-2 right-4 rounded-md bg-slate-900/95 p-2.5 text-[11px] text-white shadow-xl backdrop-blur-sm border border-slate-700">
              <p className="font-semibold text-slate-200">{dados[hoverIdx].data}</p>
              <p className="text-emerald-300">
                NDVI: {dados[hoverIdx].ndvi !== null ? dados[hoverIdx].ndvi?.toFixed(3) : "mascarado (nuvem)"}
              </p>
              <p className="text-amber-300">
                BSI: {dados[hoverIdx].bsi !== null ? dados[hoverIdx].bsi?.toFixed(3) : "mascarado (nuvem)"}
              </p>
              {modo === "P" && idxInicioGuarda !== null && hoverIdx >= idxInicioGuarda && (
                <p className="text-red-300 font-bold mt-1 text-[10px]">
                  [!] Ponto na Zona de Guarda (ignorado no Modelo P)
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Relatório Sintético de Persistência Temporal */}
      {diagnosticoPersistencia && (
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 border border-slate-100 space-y-1">
          <div className="font-bold text-slate-800">
            Diagnóstico Fenológico Multianual (§6.1 Metodologia):
          </div>
          <p className="text-slate-600">{diagnosticoPersistencia.motivoCientifico}</p>
          <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-slate-500 font-mono">
            <span>Freq. Solo Nu (Ê): {(diagnosticoPersistencia.frequenciaExposicao * 100).toFixed(1)}%</span>
            <span>Máx. Seq. Nu: {diagnosticoPersistencia.maxSequenciaExposicaoDias} dias</span>
            <span>Vigor Máx (NDVI): {diagnosticoPersistencia.ndviMaximoMediano.toFixed(2)}</span>
            <span>Tendência SWIR: {(diagnosticoPersistencia.taxaDegradacaoSwirAnual * 100).toFixed(2)}%/ano</span>
          </div>
        </div>
      )}
    </div>
  );
}
