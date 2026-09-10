"use client";

import React, { useState } from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { PontoAmostral } from "@/types/ponto";
import { valorOuNulo } from "@/types/proveniencia";
import { PALETA_ESTRATOS } from "./MapaAmostral";
import {
  MapPin,
  ChevronLeft,
  Activity,
  TrendingUp,
  Percent,
  Layers,
  RotateCcw,
  BookmarkPlus,
  Compass,
  Filter,
  Eye,
  Sliders,
  Sparkles,
  Search,
} from "lucide-react";

interface SidebarAmostralProps {
  onFlyToPonto: (ponto: PontoAmostral) => void;
}

export function SidebarAmostral({ onFlyToPonto }: SidebarAmostralProps) {
  const {
    pontos,
    obterPontosFiltrados,
    pontoSelecionadoId,
    selecionarPonto,
    aoiAtiva,
    abrirModal,
    topN,
    definirTopN,
    alternarSidebar,
    filtros,
    atualizarFiltros,
    tema,
  } = useSarelStore();

  const [abaInterna, setAbaInterna] = useState<"triagem" | "filtros">("triagem");
  const [recalculando, setRecalculando] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState("");

  const pontosFiltrados = obterPontosFiltrados().filter((p) => {
    if (!filtroTexto) return true;
    const q = filtroTexto.toLowerCase();
    return (
      p.codigo.toLowerCase().includes(q) ||
      p.estratoId.toLowerCase().includes(q) ||
      (p.fundiario?.municipio && p.fundiario.municipio.toLowerCase().includes(q)) ||
      (p.fundiario?.denominacao && p.fundiario.denominacao.toLowerCase().includes(q)) ||
      (p.auditoria?.municipio && p.auditoria.municipio.toLowerCase().includes(q))
    );
  });

  // Estatísticas calculadas da amostragem ativa (REGRA 1: dado verdadeiro ou ausência declarada)
  const totalPontos = pontos.length;

  const declividadeValores = pontosFiltrados
    .map((p) => valorOuNulo(p.terreno.declividadePct))
    .filter((v): v is number => v !== null && v !== undefined);
  const declividadeMedia =
    declividadeValores.length > 0
      ? declividadeValores.reduce((acc, v) => acc + v, 0) / declividadeValores.length
      : null;

  const soloNuValores = pontosFiltrados
    .map((p) => valorOuNulo(p.serie.frequenciaSoloNu))
    .filter((v): v is number => v !== null && v !== undefined);
  const soloNuMedio =
    soloNuValores.length > 0
      ? soloNuValores.reduce((acc, v) => acc + v, 0) / soloNuValores.length
      : null;

  // Baseline de referência indicativa (não é rótulo de treino - Regra 4)
  // REGRA 1: Sem dados reais calculados, o valor é null/ausente. NUNCA inventar com declive * 3.5!
  const perdaValores = pontosFiltrados
    .map((p) => valorOuNulo(p.rusle?.perdaSolo))
    .filter((v): v is number => v !== null && v !== undefined);
  const perdaMedia =
    perdaValores.length > 0
      ? perdaValores.reduce((acc, v) => acc + v, 0) / perdaValores.length
      : null;

  // Distribuição dos estratos físicos
  const distribuicaoS = {
    alto: pontosFiltrados.filter((p) => p.estratoId.includes("S3")).length,
    medio: pontosFiltrados.filter((p) => p.estratoId.includes("S2")).length,
    suave: pontosFiltrados.filter((p) => p.estratoId.includes("S1")).length,
  };

  function handleRecalcular() {
    setRecalculando(true);
    setTimeout(() => {
      setRecalculando(false);
    }, 600);
  }

  const botoesTopN = [10, 25, 50, 100];

  return (
    <aside
      className={`w-88 sm:w-96 shrink-0 h-full flex flex-col border-r z-20 select-none shadow-2xl transition-colors duration-200 ${
        tema === "dark"
          ? "bg-[#0b1320] border-slate-800/80 text-slate-200"
          : "bg-white border-slate-200 text-slate-800 shadow-xl"
      }`}
    >
      {/* Top Header da Sidebar: Tabs e Botão de Recolher */}
      <div
        className={`flex items-center justify-between border-b px-3 py-2 transition-colors ${
          tema === "dark"
            ? "border-slate-800/90 bg-[#090f1a]"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAbaInterna("triagem")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              abaInterna === "triagem"
                ? "bg-emerald-600 text-white shadow-sm"
                : tema === "dark"
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Triagem &amp; Focos</span>
          </button>

          <button
            onClick={() => setAbaInterna("filtros")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              abaInterna === "filtros"
                ? "bg-emerald-600 text-white shadow-sm"
                : tema === "dark"
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Filtros Detalhados</span>
          </button>
        </div>

        <button
          onClick={alternarSidebar}
          title="Recolher painel lateral"
          className={`rounded-lg p-1 transition-colors ${
            tema === "dark"
              ? "text-slate-400 hover:bg-slate-800 hover:text-white"
              : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Conteúdo Rolável da Sidebar */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 custom-scrollbar text-xs">
        {abaInterna === "triagem" ? (
          <>
            {/* Bloco 1: Região & Território */}
            <div
              className={`rounded-xl border p-3 shadow-sm transition-colors ${
                tema === "dark"
                  ? "border-slate-800 bg-[#0e1726]/80 text-slate-200"
                  : "border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider ${
                    tema === "dark" ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  Região &amp; Território
                </span>
                <button
                  onClick={() => abrirModal("region")}
                  className={`font-semibold text-[11px] flex items-center gap-1 transition-colors ${
                    tema === "dark"
                      ? "text-cyan-400 hover:text-cyan-300"
                      : "text-cyan-700 hover:text-cyan-800"
                  }`}
                >
                  <span>+ Novo Pedido / AOI</span>
                </button>
              </div>

              <div
                className={`rounded-lg p-2.5 border transition-colors ${
                  tema === "dark"
                    ? "bg-slate-900/90 border-slate-800/80"
                    : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-bold text-xs truncate max-w-[210px] ${
                      tema === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {aoiAtiva.nome}
                  </span>
                  <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-800">
                    {aoiAtiva.tipo === "estado" ? "ESTADO" : aoiAtiva.tipo === "municipio" ? "MUNICÍPIO" : "AOI"}
                  </span>
                </div>
                <div
                  className={`mt-2 flex items-center justify-between pt-1.5 border-t text-[10px] ${
                    tema === "dark"
                      ? "border-slate-800 text-slate-400"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  <span className="truncate max-w-[190px]">
                    Polígono: {aoiAtiva.nome} — IBGE
                  </span>
                  <button
                    onClick={() => abrirModal("region")}
                    className={`underline ml-1 shrink-0 ${
                      tema === "dark"
                        ? "text-slate-400 hover:text-cyan-400"
                        : "text-slate-600 hover:text-cyan-700"
                    }`}
                  >
                    Alterar
                  </button>
                </div>
              </div>
            </div>

            {/* Bloco 2: Quantidade de Áreas a Triar (Top N) */}
            <div
              className={`rounded-xl border p-3 shadow-sm space-y-2.5 transition-colors ${
                tema === "dark"
                  ? "border-slate-800 bg-[#0e1726]/80 text-slate-200"
                  : "border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                    tema === "dark" ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <Activity className="h-3.5 w-3.5 text-amber-500" />
                  Quantidade a Triar (Top N)
                </span>
                <span
                  className={`font-mono text-[11px] font-bold ${
                    tema === "dark" ? "text-amber-400" : "text-amber-700"
                  }`}
                >
                  {topN === "todas" ? `Todas (${totalPontos})` : `Top ${topN}`}
                </span>
              </div>

              {/* Botões Top N */}
              <div className="grid grid-cols-5 gap-1 text-[11px]">
                {botoesTopN.map((n) => (
                  <button
                    key={n}
                    onClick={() => definirTopN(n)}
                    className={`rounded-lg py-1 font-bold transition-all ${
                      topN === n
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : tema === "dark"
                        ? "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-xs"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => definirTopN("todas")}
                  className={`rounded-lg py-1 font-bold transition-all ${
                    topN === "todas"
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : tema === "dark"
                      ? "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-xs"
                  }`}
                >
                  Todas
                </button>
              </div>

              {/* Slider de Quantidade */}
              <div className="pt-1">
                <div
                  className={`flex items-center justify-between text-[10px] mb-1 ${
                    tema === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <span>Quantidade selecionada:</span>
                  <span
                    className={`font-mono font-bold ${
                      tema === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {pontosFiltrados.length} de {totalPontos}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={Math.max(totalPontos, 1)}
                  value={topN === "todas" ? totalPontos : topN}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= totalPontos) definirTopN("todas");
                    else definirTopN(val);
                  }}
                  className={`w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg ${
                    tema === "dark" ? "bg-slate-800" : "bg-slate-200"
                  }`}
                />
              </div>
            </div>

            {/* Bloco 3: Quatro Cards de Indicadores (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`rounded-xl border p-2.5 shadow-sm transition-colors ${
                  tema === "dark"
                    ? "border-slate-800 bg-[#0e1726]/90"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div
                  className={`flex items-center justify-between text-[10px] mb-1 ${
                    tema === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <span>Focos Ativos</span>
                  <Activity className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div
                  className={`text-base font-black font-mono ${
                    tema === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {pontosFiltrados.length}
                </div>
                <p
                  className={`text-[10px] mt-0.5 ${
                    tema === "dark" ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Áreas em triagem
                </p>
              </div>

              <div
                className={`rounded-xl border p-2.5 shadow-sm transition-colors ${
                  tema === "dark"
                    ? "border-slate-800 bg-[#0e1726]/90"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div
                  className={`flex items-center justify-between text-[10px] mb-1 ${
                    tema === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <span>Declividade Méd.</span>
                  <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div
                  className={`text-base font-black font-mono ${
                    tema === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {declividadeMedia !== null ? `${declividadeMedia.toFixed(1)}%` : "—"}
                </div>
                <p
                  className={`text-[10px] mt-0.5 ${
                    tema === "dark" ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {declividadeMedia !== null ? `~ ${(declividadeMedia * 0.57).toFixed(1)}° inclinação` : "Aguardando extração GEE"}
                </p>
              </div>

              <div
                className={`rounded-xl border p-2.5 shadow-sm transition-colors ${
                  tema === "dark"
                    ? "border-slate-800 bg-[#0e1726]/90"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div
                  className={`flex items-center justify-between text-[10px] mb-1 ${
                    tema === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <span>Solo Nu Méd.</span>
                  <Percent className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div
                  className={`text-base font-black font-mono ${
                    tema === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {soloNuMedio !== null ? `${(soloNuMedio * 100).toFixed(1)}%` : "—"}
                </div>
                <p
                  className={`text-[10px] mt-0.5 ${
                    tema === "dark" ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {soloNuMedio !== null ? "Freq. de solo exposto" : "Aguardando Sentinel-2"}
                </p>
              </div>

              <div
                className={`rounded-xl border p-2.5 shadow-sm transition-colors ${
                  tema === "dark"
                    ? "border-slate-800 bg-[#0e1726]/90"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div
                  className={`flex items-center justify-between text-[10px] mb-1 ${
                    tema === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <span>Perda de Solo</span>
                  <Layers className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div
                  className={`text-base font-black font-mono ${
                    tema === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {perdaMedia !== null ? perdaMedia.toFixed(1) : "—"}
                </div>
                <p
                  className={`text-[10px] mt-0.5 ${
                    tema === "dark" ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {perdaMedia !== null ? "t/ha/ano (RUSLE Ref)" : "Sem cálculo RUSLE"}
                </p>
              </div>
            </div>

            {/* Bloco 4: Distribuição dos Estratos Físicos (Declividade S3/S2/S1) */}
            <div
              className={`rounded-xl border p-3 shadow-sm space-y-2 transition-colors ${
                tema === "dark"
                  ? "border-slate-800 bg-[#0e1726]/80 text-slate-200"
                  : "border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-bold text-[11px] uppercase tracking-wider ${
                    tema === "dark" ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Distribuição de Estratos Físicos
                </span>
                <span
                  className={`text-[10px] ${
                    tema === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Tercil S^
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                <button
                  onClick={() => atualizarFiltros({ estrato: filtros.estrato === "S3" ? "todos" : "todos" })}
                  className={`rounded-lg border p-2 transition-colors ${
                    tema === "dark"
                      ? "border-rose-900/60 bg-rose-950/30 text-rose-200 hover:bg-rose-950/50"
                      : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
                  }`}
                >
                  <div className={`text-[10px] font-bold ${tema === "dark" ? "text-rose-400" : "text-rose-700"}`}>
                    Escarpa (S3)
                  </div>
                  <div className="text-sm font-black font-mono mt-0.5">{distribuicaoS.alto}</div>
                </button>

                <button
                  onClick={() => atualizarFiltros({ estrato: filtros.estrato === "S2" ? "todos" : "todos" })}
                  className={`rounded-lg border p-2 transition-colors ${
                    tema === "dark"
                      ? "border-amber-900/60 bg-amber-950/30 text-amber-200 hover:bg-amber-950/50"
                      : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  <div className={`text-[10px] font-bold ${tema === "dark" ? "text-amber-400" : "text-amber-700"}`}>
                    Ondulado (S2)
                  </div>
                  <div className="text-sm font-black font-mono mt-0.5">{distribuicaoS.medio}</div>
                </button>

                <button
                  onClick={() => atualizarFiltros({ estrato: filtros.estrato === "S1" ? "todos" : "todos" })}
                  className={`rounded-lg border p-2 transition-colors ${
                    tema === "dark"
                      ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-950/50"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  <div className={`text-[10px] font-bold ${tema === "dark" ? "text-emerald-400" : "text-emerald-700"}`}>
                    Suave (S1)
                  </div>
                  <div className="text-sm font-black font-mono mt-0.5">{distribuicaoS.suave}</div>
                </button>
              </div>

              <p className={`text-[10px] italic ${tema === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                (Regra 4: Rótulos por estrato biofísico, nunca por severidade predita)
              </p>
            </div>

            {/* Bloco 5: Lista de Cards de Pontos Amostrais */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span
                  className={`font-bold text-xs flex items-center gap-1.5 ${
                    tema === "dark" ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  <Compass className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  Focos Amostrais ({pontosFiltrados.length})
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleRecalcular}
                    disabled={recalculando}
                    title="Recalcular covariáveis"
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-all ${
                      tema === "dark"
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-900"
                    }`}
                  >
                    <RotateCcw className={`h-3 w-3 ${recalculando ? "animate-spin text-cyan-400" : ""}`} />
                    <span>Recalcular</span>
                  </button>

                  <button
                    onClick={() => abrirModal("saved")}
                    title="Salvar coleção de pontos"
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold border transition-all ${
                      tema === "dark"
                        ? "bg-cyan-950 text-cyan-300 border-cyan-800 hover:bg-cyan-900"
                        : "bg-cyan-50 text-cyan-800 border-cyan-300 hover:bg-cyan-100"
                    }`}
                  >
                    <BookmarkPlus className="h-3 w-3" />
                    <span>Salvar</span>
                  </button>
                </div>
              </div>

              {/* Campo de Busca Rápida na Lista */}
              <div className="relative">
                <Search className={`absolute left-2.5 top-2 h-3.5 w-3.5 ${tema === "dark" ? "text-slate-500" : "text-slate-400"}`} />
                <input
                  type="text"
                  placeholder="Filtrar por código, município ou estrato..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className={`w-full rounded-lg border py-1.5 pl-8 pr-3 text-[11px] focus:outline-none transition-colors ${
                    tema === "dark"
                      ? "border-slate-800 bg-slate-900/90 text-white placeholder-slate-500 focus:border-cyan-500"
                      : "border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-cyan-600 shadow-xs"
                  }`}
                />
              </div>

              {/* Lista Scrollável de Cards */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {pontosFiltrados.map((p, idx) => {
                  const selecionado = p.id === pontoSelecionadoId;
                  const corEstrato = PALETA_ESTRATOS[p.estratoId] || "#10b981";
                  const declive = valorOuNulo(p.terreno.declividadePct) ?? 0;
                  const soloNu = ((valorOuNulo(p.serie.frequenciaSoloNu) ?? 0) * 100).toFixed(1);
                  const perdaVal = valorOuNulo(p.rusle?.perdaSolo);
                  const perdaEst = perdaVal !== null ? `${perdaVal.toFixed(1)} t/ha` : "—";

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        selecionarPonto(p.id);
                        onFlyToPonto(p);
                      }}
                      className={`cursor-pointer rounded-xl border p-2.5 transition-all ${
                        selecionado
                          ? tema === "dark"
                            ? "border-cyan-400 bg-cyan-950/40 shadow-md ring-1 ring-cyan-500/50"
                            : "border-cyan-500 bg-cyan-50/90 shadow-md ring-1 ring-cyan-400"
                          : tema === "dark"
                          ? "border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/70 hover:border-slate-700"
                          : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-xs"
                      }`}
                    >
                      {/* Topo do Card */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: corEstrato }}
                          />
                          <span
                            className={`font-mono font-bold text-xs ${
                              tema === "dark" ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {p.codigo}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                              tema === "dark" ? "text-slate-200" : "text-slate-800"
                            }`}
                            style={{ backgroundColor: `${corEstrato}33`, borderColor: corEstrato }}
                          >
                            {p.estratoId.replace("ESTRATO_", "")}
                          </span>
                        </div>
                      </div>

                      {/* Subtítulo / Localização */}
                      <p
                        className={`mt-1 text-[10px] truncate ${
                          tema === "dark" ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {p.fundiario?.denominacao || "Imóvel Rural"} ·{" "}
                        {p.fundiario?.municipio || p.auditoria?.municipio || aoiAtiva.nome.replace("Município de ", "")}
                      </p>

                      {/* Métricas do Ponto */}
                      <div
                        className={`mt-2 flex items-center justify-between border-t pt-1.5 font-mono text-[10px] ${
                          tema === "dark" ? "border-slate-800/70" : "border-slate-100"
                        }`}
                      >
                        <span className={tema === "dark" ? "text-amber-300" : "text-amber-700"}>
                          ~ {declive.toFixed(1)}%
                        </span>
                        <span className={tema === "dark" ? "text-rose-300" : "text-rose-700"}>
                          Solo Nu: {soloNu}%
                        </span>
                        <span className={tema === "dark" ? "text-cyan-300 font-bold" : "text-cyan-700 font-bold"}>
                          {perdaEst}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {pontosFiltrados.length === 0 && (
                  <div
                    className={`rounded-xl border border-dashed p-4 text-center space-y-2.5 ${
                      tema === "dark"
                        ? "border-slate-800 bg-slate-900/40 text-slate-400"
                        : "border-slate-300 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Compass className="h-4 w-4" />
                    </div>
                    {totalPontos === 0 ? (
                      <div className="space-y-1">
                        <p className={`font-bold text-xs ${tema === "dark" ? "text-slate-200" : "text-slate-800"}`}>
                          Nenhum ponto amostral nesta AOI
                        </p>
                        <p className="text-[10px] leading-relaxed">
                          O limite oficial foi carregado via IBGE. Respeitando a <b>Regra 1</b>, nenhum ponto sintético foi fabricado. Conecte ao GEE ou defina critérios de estratificação para triar candidatos reais.
                        </p>
                        <div className="pt-2 flex flex-col gap-1.5">
                          <button
                            onClick={() => abrirModal("settings")}
                            className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 py-1.5 text-[11px] font-bold text-white transition-colors"
                          >
                            Conectar API do GEE
                          </button>
                          <button
                            onClick={() => abrirModal("candidate")}
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 py-1.5 text-[11px] font-bold text-slate-200 transition-colors"
                          >
                            Definir Critérios Amostrais
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs">Nenhum ponto corresponde aos filtros ativos.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Aba de Filtros Detalhados */
          <div className="space-y-4">
            <div
              className={`rounded-xl border p-3 space-y-3 transition-colors ${
                tema === "dark"
                  ? "border-slate-800 bg-[#0e1726]/80 text-slate-200"
                  : "border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              <span
                className={`font-bold text-xs flex items-center gap-1.5 ${
                  tema === "dark" ? "text-slate-200" : "text-slate-800"
                }`}
              >
                <Filter className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                Critérios de Filtro Amostral
              </span>

              {/* Modo de Coloração */}
              <div>
                <label
                  className={`text-[11px] font-semibold mb-1 block ${
                    tema === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Coloração dos Marcadores no Mapa:
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => atualizarFiltros({ colorirPor: "estrato" })}
                    className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition-all ${
                      filtros.colorirPor === "estrato"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : tema === "dark"
                        ? "bg-slate-900 text-slate-400 hover:bg-slate-800"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    1. Estrato Multivariado (18 classes cruzadas)
                  </button>
                  <button
                    onClick={() => atualizarFiltros({ colorirPor: "completude" })}
                    className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition-all ${
                      filtros.colorirPor === "completude"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : tema === "dark"
                        ? "bg-slate-900 text-slate-400 hover:bg-slate-800"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    2. Completude dos Dados (Medido vs Tabelado)
                  </button>
                  <button
                    onClick={() => atualizarFiltros({ colorirPor: "blocoEspacial" })}
                    className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition-all ${
                      filtros.colorirPor === "blocoEspacial"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : tema === "dark"
                        ? "bg-slate-900 text-slate-400 hover:bg-slate-800"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    3. Bloco Espacial (Spatial Cross-Validation)
                  </button>
                </div>
              </div>

              {/* Status de Rotulagem */}
              <div>
                <label
                  className={`text-[11px] font-semibold mb-1 block ${
                    tema === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Status de Validação de Campo:
                </label>
                <select
                  value={filtros.rotulagem}
                  onChange={(e) =>
                    atualizarFiltros({ rotulagem: e.target.value as any })
                  }
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none transition-colors ${
                    tema === "dark"
                      ? "border-slate-700 bg-slate-900 text-white focus:border-cyan-500"
                      : "border-slate-300 bg-white text-slate-800 focus:border-cyan-600 shadow-xs"
                  }`}
                >
                  <option value="todos">Todos os Status</option>
                  <option value="rotulado">Apenas Rotulados com Laudo de Campo</option>
                  <option value="pendente">Apenas Pendentes de Inspeção</option>
                </select>
              </div>

              {/* Resetar Filtros */}
              <button
                onClick={() =>
                  atualizarFiltros({
                    estrato: "todos",
                    bloco: "todos",
                    rotulagem: "todos",
                    colorirPor: "estrato",
                  })
                }
                className={`w-full rounded-lg py-1.5 text-xs font-bold transition-colors ${
                  tema === "dark"
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                Limpar Todos os Filtros
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
