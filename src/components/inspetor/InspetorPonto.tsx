"use client";

import React from "react";
import { Cpu, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import { SeloProveniencia } from "./SeloProveniencia";
import { GraficoSerieTemporal } from "./GraficoSerieTemporal";
import { formatToDMS } from "@/lib/export/dms";
import type { LaudoAuditoriaPonto } from "@/types/jev";

export function InspetorPonto() {
  const { obterPontoSelecionado, rotulosConsolidados, pontos, selecionarPonto, credenciais, adicionarLog } = useSarelStore();
  const [modeloAtivo, setModeloAtivo] = React.useState<"D" | "P">("D");
  const [laudoAuditoria, setLaudoAuditoria] = React.useState<LaudoAuditoriaPonto | null>(null);
  const [auditando, setAuditando] = React.useState(false);
  const ponto = obterPontoSelecionado();

  React.useEffect(() => {
    setLaudoAuditoria(null);
  }, [ponto?.id]);

  const dispararAuditoria = async () => {
    if (!ponto) return;
    setAuditando(true);
    try {
      const res = await fetch("/api/jev/auditar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ponto,
          apiKey: credenciais.jevApiKey,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.laudo) {
        setLaudoAuditoria(data.laudo);
        adicionarLog(
          "info",
          "Auditoria-DualEngine",
          `Auditoria concluída para ${ponto.codigo} via ${data.laudo.metodo} (${data.laudo.latenciaMs}ms).`
        );
      } else {
        throw new Error(data?.error || `Falha na requisição: HTTP ${res.status}`);
      }
    } catch (err: any) {
      adicionarLog(
        "warning",
        "Auditoria-DualEngine",
        `Erro ao auditar ponto ${ponto.codigo}: ${err?.message || "Falha na comunicação"}.`
      );
    } finally {
      setAuditando(false);
    }
  };

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

      {/* Bloco de Auditoria Rápida Dual-Engine (Jev System One / RUSLE Local) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Auditoria de Decisão Rápida (Dual-Engine)
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-slate-100 text-slate-600">
                  {credenciais.jevApiKey ? "API Jev Configurada" : "Motor Determinístico Local"}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Auditoria biofísica em tempo real via Jev (TypeSafe AI / System One) com fallback determinístico RUSLE.
              </p>
            </div>
          </div>

          <button
            onClick={dispararAuditoria}
            disabled={auditando}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {auditando ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Auditando amostra...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Auditar Ponto {ponto.codigo}</span>
              </>
            )}
          </button>
        </div>

        {laudoAuditoria && (
          <div className="space-y-3 animate-in fade-in">
            {/* Metadados da Auditoria */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Motor de Execução:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-mono font-bold text-[11px] flex items-center gap-1.5 ${
                    laudoAuditoria.metodo === "JEV_SYSTEM_ONE"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-blue-100 text-blue-800 border border-blue-300"
                  }`}
                >
                  <span className="text-xs">●</span>
                  {laudoAuditoria.metodo === "JEV_SYSTEM_ONE"
                    ? "Jev (TypeSafe AI / System One)"
                    : "Motor Local Determinístico (RUSLE/Embrapa)"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                <span>Latência: <b>{laudoAuditoria.latenciaMs}ms</b></span>
                <span>•</span>
                <span>{new Date(laudoAuditoria.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Aviso de Degradação Graciosa, se houver */}
            {laudoAuditoria.detalhes?.motivoFallback && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span><b>Nota de Resiliência:</b> {laudoAuditoria.detalhes.motivoFallback}</span>
              </div>
            )}

            {/* 3 Primitivas Avaliadas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* 1. Consistência Física (Noul) */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Consistência Física (Noul)</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      laudoAuditoria.consistenciaFisica.valido
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {laudoAuditoria.consistenciaFisica.valido ? "Válido" : "Inconsistente"}
                  </span>
                </div>
                <p className="font-bold text-slate-900">
                  Confiança: {(laudoAuditoria.consistenciaFisica.confianca * 100).toFixed(0)}%
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {laudoAuditoria.consistenciaFisica.observacao}
                </p>
              </div>

              {/* 2. Suscetibilidade à Erosão (Score) */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Suscetibilidade (Score 0-4)</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      laudoAuditoria.scoreSuscetibilidade.grau >= 3
                        ? "bg-rose-100 text-rose-800"
                        : laudoAuditoria.scoreSuscetibilidade.grau === 2
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {laudoAuditoria.scoreSuscetibilidade.rotulo}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-slate-900">
                    Grau {laudoAuditoria.scoreSuscetibilidade.grau}
                  </span>
                  <span className="text-[11px] text-slate-400">/ 4</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {laudoAuditoria.scoreSuscetibilidade.descricao}
                </p>
              </div>

              {/* 3. Classificação de Manejo (Choice) */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Uso e Manejo (Choice)</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(laudoAuditoria.coberturaManejo.confianca * 100).toFixed(0)}% conf.
                  </span>
                </div>
                <p className="font-bold text-slate-900 leading-snug">
                  {laudoAuditoria.coberturaManejo.classe}
                </p>
                <div className="pt-1 text-[10px] text-slate-400 font-mono flex justify-between">
                  <span>NDVI: {laudoAuditoria.detalhes?.ndviObservado !== null ? laudoAuditoria.detalhes.ndviObservado?.toFixed(2) : "—"}</span>
                  <span>BSI: {laudoAuditoria.detalhes?.bsiObservado !== null ? laudoAuditoria.detalhes.bsiObservado?.toFixed(2) : "—"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
