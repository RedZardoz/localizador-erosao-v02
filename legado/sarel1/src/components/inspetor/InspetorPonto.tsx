"use client";

import React from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { SeloProveniencia } from "./SeloProveniencia";
import { GraficoSerieTemporal } from "./GraficoSerieTemporal";
import { sincronizarCoordenada } from "@/lib/export/geoConversao";
import {
  MapPin,
  Layers,
  Mountain,
  Droplets,
  Sprout,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export function InspetorPonto() {
  const { obterPontoSelecionado, rotulosConsolidados, pontos, selecionarPonto } = useSarelStore();
  const ponto = obterPontoSelecionado();

  if (!ponto) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <HelpCircle className="h-12 w-12 text-slate-300" />
        <h3 className="mt-3 text-base font-semibold text-slate-700">Nenhum Ponto Selecionado</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Selecione um ponto no Mapa Amostral ou na listagem lateral para inspecionar todas as suas
          variáveis científicas com rastreabilidade completa.
        </p>
        {pontos.length > 0 && (
          <button
            onClick={() => selecionarPonto(pontos[0].id)}
            className="mt-4 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Inspecionar Primeiro Ponto ({pontos[0].codigo})
          </button>
        )}
      </div>
    );
  }

  const latSinc = sincronizarCoordenada(ponto.latitude, "lat");
  const lngSinc = sincronizarCoordenada(ponto.longitude, "lng");

  const rotuloConsolidado = rotulosConsolidados[ponto.codigo] ?? (ponto.rotulo ? { final: ponto.rotulo, origens: [ponto.rotulo] } : null);
  const rotuloFinal = rotuloConsolidado?.final;

  const soloAssociacao = ponto.solo?.tipoUnidade && "valor" in ponto.solo.tipoUnidade && ponto.solo.tipoUnidade.valor === "associacao";

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Ponto */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{ponto.codigo}</h2>
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                  {ponto.id.slice(0, 8)}...
                </span>
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                  {ponto.estratoId}
                </span>
                <span className="rounded bg-purple-50 px-2 py-0.5 font-mono text-xs font-semibold text-purple-700 border border-purple-200">
                  {ponto.blocoEspacial}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Ponto amostral estratificado para validação com séries Sentinel-2, DEM e sensores de campo
              </p>
            </div>
          </div>

          {/* Seletor rápido de pontos */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Trocar Ponto:</label>
            <select
              value={ponto.id}
              onChange={(e) => selecionarPonto(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none"
            >
              {pontos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} — {p.estratoId} ({p.blocoEspacial})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Coordenadas Sincronizadas */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded bg-slate-50 p-2.5 border border-slate-200/60">
            <span className="text-[11px] font-medium text-slate-500">Latitude (Decimal)</span>
            <p className="font-mono font-semibold text-slate-800">{latSinc.decimal.toFixed(6)}°</p>
          </div>
          <div className="rounded bg-slate-50 p-2.5 border border-slate-200/60">
            <span className="text-[11px] font-medium text-slate-500">Latitude (DMS com Rollover)</span>
            <p className="font-mono font-semibold text-slate-800">{latSinc.dms}</p>
          </div>
          <div className="rounded bg-slate-50 p-2.5 border border-slate-200/60">
            <span className="text-[11px] font-medium text-slate-500">Longitude (Decimal)</span>
            <p className="font-mono font-semibold text-slate-800">{lngSinc.decimal.toFixed(6)}°</p>
          </div>
          <div className="rounded bg-slate-50 p-2.5 border border-slate-200/60">
            <span className="text-[11px] font-medium text-slate-500">Longitude (DMS com Rollover)</span>
            <p className="font-mono font-semibold text-slate-800">{lngSinc.dms}</p>
          </div>
        </div>
      </div>

      {/* Grid de Variáveis Biofísicas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Bloco 1: Terreno */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Mountain className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Variáveis de Terreno (Copernicus DEM)</h3>
          </div>
          <div className="space-y-2.5">
            <SeloProveniencia proveniencia={ponto.terreno.elevacao} label="Elevação" unidade="m" />
            <SeloProveniencia proveniencia={ponto.terreno.declividadePct} label="Declividade (%)" unidade="%" />
            <SeloProveniencia proveniencia={ponto.terreno.declividadeGraus} label="Declividade (°)" unidade="°" />
            <SeloProveniencia proveniencia={ponto.terreno.twi} label="TWI (Umidade Topogr.)" />
            <SeloProveniencia proveniencia={ponto.terreno.acumuloFluxo} label="Acúmulo de Fluxo" unidade="pixels" />
            <SeloProveniencia proveniencia={ponto.terreno.curvaturaPerfil} label="Curvatura de Perfil" />
            <SeloProveniencia proveniencia={ponto.terreno.curvaturaPlana} label="Curvatura Plana" />
          </div>
        </div>

        {/* Bloco 2: Pedologia */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Layers className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-800">Solo e Erodibilidade (Embrapa)</h3>
          </div>
          <div className="space-y-2.5">
            <SeloProveniencia
              proveniencia={ponto.solo.ordem}
              label="Ordem Pedológica"
              ressalvaAssociacao={soloAssociacao}
            />
            <SeloProveniencia
              proveniencia={ponto.solo.subOrdem}
              label="Subordem"
              ressalvaAssociacao={soloAssociacao}
            />
            <SeloProveniencia
              proveniencia={ponto.solo.grandeGrupo}
              label="Grande Grupo (Química/Fertilidade)"
            />
            <SeloProveniencia
              proveniencia={ponto.solo.erodibilidadeClasse}
              label="Classe de Erodibilidade (K)"
            />
            <SeloProveniencia
              proveniencia={ponto.solo.tipoUnidade}
              label="Tipo de Unidade Pedológica"
            />
          </div>

          {/* Contexto Fundiário Protegido LGPD */}
          <div className="mt-5 border-t border-slate-100 pt-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <span>Contexto Fundiário (Proteção LGPD)</span>
            </div>
            {ponto.fundiario ? (
              <div className="rounded bg-slate-50 p-2.5 text-[11px] space-y-1 font-mono text-slate-600 border border-slate-200/80">
                <p><span className="font-sans font-semibold text-slate-700">Status:</span> {ponto.fundiario.status}</p>
                <p><span className="font-sans font-semibold text-slate-700">CAR:</span> {ponto.fundiario.codigoCar || "N/A"}</p>
                <p><span className="font-sans font-semibold text-slate-700">Titular:</span> {ponto.fundiario.titularMascarado || "N/A"}</p>
                <p><span className="font-sans font-semibold text-slate-700">Documento:</span> {ponto.fundiario.documentoMascarado || "N/A"}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Sem dados fundiários vinculados.</p>
            )}
          </div>
        </div>

        {/* Bloco 3: Chuva e Dinâmica */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Droplets className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Regime Pluviométrico (CHIRPS/IMERG)</h3>
          </div>
          <div className="space-y-2.5">
            <SeloProveniencia proveniencia={ponto.chuva.precipAcum30d} label="Precip. Acumulada (30d)" unidade="mm" />
            <SeloProveniencia proveniencia={ponto.chuva.precipAcum90d} label="Precip. Acumulada (90d)" unidade="mm" />
            <SeloProveniencia proveniencia={ponto.chuva.i30Max} label="I30 Máximo (Semi-horário)" unidade="mm/h" />
            <SeloProveniencia proveniencia={ponto.chuva.nEventosErosivos} label="Eventos Erosivos (≥10mm)" />
            <SeloProveniencia proveniencia={ponto.chuva.indiceMecanismo} label="Índice de Mecanismo (Chuva x Solo Nu)" />
          </div>

          {/* Rótulo Humano Observado */}
          <div className="mt-5 border-t border-slate-100 pt-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Sprout className="h-4 w-4 text-emerald-600" />
              <span>Rótulo de Erosão Humano (Regra 4)</span>
            </div>
            {rotuloFinal ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 uppercase tracking-wide">
                    {rotuloFinal.classe}
                  </span>
                  <span className="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    {rotuloFinal.modalidade}
                  </span>
                </div>
                <div className="mt-1.5 space-y-0.5 text-[11px] text-emerald-900">
                  <p><span className="font-medium">Observador:</span> {rotuloFinal.observador}</p>
                  <p><span className="font-medium">Data:</span> {rotuloFinal.observadoEm}</p>
                  <p><span className="font-medium">Protocolo:</span> {rotuloFinal.cego ? "Cego (Válido)" : "Não-Cego (Alerta)"}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-semibold">Aguardando Coleta de Rótulo</p>
                  <p className="text-[11px] text-amber-700">
                    Este ponto ainda não recebeu observação humana consolidada. Não integra matrizes de treino supervisionado.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de Série Temporal Multiespectral com Quebras Reais */}
      <GraficoSerieTemporal
        titulo={`Série Temporal Sentinel-2 (NDVI e BSI) — Ponto ${ponto.codigo} (${ponto.serie.janela.inicio} a ${ponto.serie.janela.fim})${ponto.origemSintetica ? " [Simulação Demonstrativa]" : ""}`}
      />
    </div>
  );
}
