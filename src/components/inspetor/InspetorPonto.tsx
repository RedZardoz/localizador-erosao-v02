"use client";

import React from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { SeloProveniencia } from "./SeloProveniencia";
import { GraficoSerieTemporal } from "./GraficoSerieTemporal";
import { formatToDMS } from "@/lib/export/dms";

export function InspetorPonto() {
  const { obterPontoSelecionado, rotulosConsolidados, pontos, selecionarPonto } = useSarelStore();
  const [modeloAtivo, setModeloAtivo] = React.useState<"D" | "P">("D");
  const ponto = obterPontoSelecionado();

  if (!ponto) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <div className="rounded-full bg-slate-100 p-3 text-slate-400">○</div>
        <h3 className="mt-3 text-base font-semibold text-slate-700">Nenhum Ponto Selecionado</h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          Selecione um ponto no Mapa Amostral ou na listagem para inspecionar todas as suas variáveis
          científicas com os 4 selos de proveniência (● medido, ◊ modelado, □ tabelado, ○ indisponível).
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

  const dmsLat = formatToDMS(ponto.latitude, true);
  const dmsLng = formatToDMS(ponto.longitude, false);

  const rotuloConsolidado = rotulosConsolidados[ponto.codigo] ?? (ponto.rotulo ? { final: ponto.rotulo, origens: [ponto.rotulo] } : null);
  const rotuloFinal = rotuloConsolidado?.final;
  const soloAssociacao = ponto.solo?.tipoUnidade?.estado === "medido" && ponto.solo.tipoUnidade.valor === "associacao";

  const janelaAtiva = modeloAtivo === "D" ? ponto.temporal?.D : ponto.temporal?.P;

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Ponto Amostral */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{ponto.codigo}</h2>
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                {ponto.id.slice(0, 8)}...
              </span>
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                Estrato: {ponto.estratoId}
              </span>
              <span className="rounded bg-purple-50 px-2 py-0.5 font-mono text-xs font-semibold text-purple-700 border border-purple-200">
                {ponto.blocoEspacial ?? "Bloco pendente"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Ponto amostral estratificado (S tercil {ponto.criterioSelecao.tercilS} × E tercil {ponto.criterioSelecao.tercilE} × K nível {ponto.criterioSelecao.nivelK})
            </p>
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
                  {p.codigo} — {p.estratoId} ({p.blocoEspacial ?? "Pendente"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Coordenadas e Localização */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded bg-slate-50 p-2.5 border border-slate-200/60">
            <span className="text-slate-500 font-medium">Latitude:</span>
            <p className="font-mono text-slate-800 font-semibold">{ponto.latitude.toFixed(6)}° ({dmsLat})</p>
          </div>
          <div className="rounded bg-slate-50 p-2.5 border border-slate-200/60">
            <span className="text-slate-500 font-medium">Longitude:</span>
            <p className="font-mono text-slate-800 font-semibold">{ponto.longitude.toFixed(6)}° ({dmsLng})</p>
          </div>
          <div className="rounded bg-slate-50 p-2.5 border border-slate-200/60">
            <span className="text-slate-500 font-medium">Município / IBGE:</span>
            <p className="font-medium text-slate-800">
              {ponto.localizacao?.municipio?.estado === "medido" ? ponto.localizacao.municipio.valor : "indisponível"} (
              {ponto.localizacao?.codigoIbge?.estado === "medido" ? ponto.localizacao.codigoIbge.valor : "—"})
            </p>
          </div>
          <div className="rounded bg-slate-50 p-2.5 border border-slate-200/60">
            <span className="text-slate-500 font-medium">Macrobacia IAT:</span>
            <p className="font-medium text-slate-800">
              {ponto.localizacao?.bacia?.estado === "medido" ? ponto.localizacao.bacia.valor : "indisponível"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Blocos Biofísicos com Selos de Proveniência */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Bloco Terreno */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-3">
            TERRENO (Copernicus DEM GLO-30 em EPSG:31982)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <SeloProveniencia label="Declividade" proveniencia={ponto.terreno?.declividadePct} unidade="%" />
            <SeloProveniencia label="Declividade" proveniencia={ponto.terreno?.declividadeGraus} unidade="°" />
            <SeloProveniencia label="Elevação" proveniencia={ponto.terreno?.elevacao} unidade="m" />
            <SeloProveniencia label="Curvatura Perfil" proveniencia={ponto.terreno?.curvaturaPerfil} />
            <SeloProveniencia label="Curvatura Plana" proveniencia={ponto.terreno?.curvaturaPlana} />
            <SeloProveniencia label="TWI (Topographic Wetness)" proveniencia={ponto.terreno?.twi} />
          </div>
        </div>

        {/* Bloco Solo */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-3">
            PEDOLOGIA (Embrapa Solos / GeoInfo)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <SeloProveniencia label="Ordem" proveniencia={ponto.solo?.ordem} />
            <SeloProveniencia label="Subordem" proveniencia={ponto.solo?.subOrdem} />
            <SeloProveniencia label="Grande Grupo" proveniencia={ponto.solo?.grandeGrupo} />
            <SeloProveniencia
              label="Erodibilidade"
              proveniencia={ponto.solo?.erodibilidadeClasse}
              ressalvaAssociacao={soloAssociacao}
            />
          </div>
        </div>
      </div>

      {/* Série Temporal e Composto de Solo Exposto */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-3">
            SÉRIE TEMPORAL & SOLO EXPOSTO (Sentinel-2 L2A)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <SeloProveniencia
              label="Frequência Solo Nu (Ê)"
              proveniencia={janelaAtiva?.serie?.frequenciaSoloNu}
            />
            <SeloProveniencia
              label="Maior Sequência Nu"
              proveniencia={janelaAtiva?.serie?.maiorSequenciaSoloNu}
              unidade="cenas"
            />
            <SeloProveniencia
              label="Mês Modal Exposição"
              proveniencia={janelaAtiva?.serie?.mesModalExposicao}
            />
          </div>
        </div>

        {/* Bloco Chuva */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-3">
            PRECIPITAÇÃO & EROSIVIDADE (CHIRPS & GPM IMERG)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <SeloProveniencia label="Acumulado 30d" proveniencia={janelaAtiva?.chuva?.precipAcum30d} unidade="mm" />
            <SeloProveniencia label="Acumulado 90d" proveniencia={janelaAtiva?.chuva?.precipAcum90d} unidade="mm" />
            <SeloProveniencia label="I30 Máximo" proveniencia={janelaAtiva?.chuva?.i30Max} unidade="mm/h" />
            <SeloProveniencia label="Nº Eventos Erosivos" proveniencia={janelaAtiva?.chuva?.nEventosErosivos} />
            <SeloProveniencia label="Índice Mecanismo" proveniencia={janelaAtiva?.chuva?.indiceMecanismo} />
          </div>
        </div>
      </div>

      {/* Gráfico da Série Temporal */}
      <GraficoSerieTemporal
        dados={
          janelaAtiva?.observacoes && janelaAtiva.observacoes.length > 0
            ? janelaAtiva.observacoes
            : ponto.espectral?.ndvi?.estado === "medido" && ponto.rastreio?.calculadoEm
            ? [
                {
                  data: ponto.rastreio.calculadoEm.split("T")[0],
                  ndvi: ponto.espectral.ndvi.valor,
                  bsi: ponto.espectral.bsi?.estado === "medido" ? ponto.espectral.bsi.valor : null,
                },
              ]
            : []
        }
        modeloAtivo={modeloAtivo}
        onModeloChange={setModeloAtivo}
        dataReferencia={ponto.rastreio?.calculadoEm?.split("T")[0] || "2026-01-01"}
      />

      {/* Bloco de Rótulo Humano e Fundiário */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-3">
            ROTULAGEM HUMANA (Regra 4 — Nunca calculado pelo sistema)
          </h3>
          {rotuloFinal ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Classe Observada:</span>
                <span className="font-bold text-slate-900 uppercase">{rotuloFinal.classe}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Modalidade:</span>
                <span className="font-medium text-slate-800">{rotuloFinal.modalidade}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Observador:</span>
                <span className="font-medium text-slate-800">{rotuloFinal.observador}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Data de Observação:</span>
                <span className="font-mono text-slate-800">{rotuloFinal.observadoEm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Protocolo Cego:</span>
                <span className="font-medium text-emerald-700">{rotuloFinal.cego ? "Sim (Cego)" : "Não"}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Ponto ainda não rotulado por observação humana independente.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-3">
            CONTEXTO FUNDIÁRIO (Acesso para campo — Não é feature)
          </h3>
          {ponto.fundiario ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Status da Consulta:</span>
                <span className="font-semibold text-slate-800">{ponto.fundiario.status}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Código CAR:</span>
                <span className="font-mono text-slate-800">{ponto.fundiario.codigoCar ?? "Não associado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Titular (Máscara SNCR):</span>
                <span className="font-medium text-slate-800">{ponto.fundiario.titularMascarado ?? "Não disponível"}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Consulta fundiária ainda não vinculada a este ponto.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
