"use client";

import React from "react";
import { Cpu, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Zap, Eye, Edit3, Lock } from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import { SeloProveniencia } from "./SeloProveniencia";
import { GraficoSerieTemporal } from "./GraficoSerieTemporal";
import { formatToDMS } from "@/lib/export/dms";
import { REGISTRO_DECISOES } from "@/config/decisoes";
import type { LaudoAuditoriaPonto } from "@/types/jev";
import type { Rotulo } from "@/types/rotulo";

export interface InspetorPontoProps {
  modoInicial?: "inspecao" | "registro";
}

export function InspetorPonto({ modoInicial = "inspecao" }: InspetorPontoProps = {}) {
  const {
    obterPontoSelecionado,
    rotulosConsolidados,
    pontos,
    selecionarPonto,
    credenciais,
    adicionarLog,
    definirRotuloConsolidado,
  } = useSarelStore();

  const [modo, setModo] = React.useState<"inspecao" | "registro">(modoInicial);
  const [modeloAtivo, setModeloAtivo] = React.useState<"D" | "P">("D");
  const [laudoAuditoria, setLaudoAuditoria] = React.useState<LaudoAuditoriaPonto | null>(null);
  const [auditando, setAuditando] = React.useState(false);

  // Campos do Laudo Pericial Humano (D26 / D03)
  const [fracaoErodidaInput, setFracaoErodidaInput] = React.useState<number>(0.0);
  const [classeRotuloInput, setClasseRotuloInput] = React.useState<"erosao" | "controle">("erosao");
  const [modalidadeRotuloInput, setModalidadeRotuloInput] = React.useState<"campo" | "drone" | "interpretacao-visual">("campo");
  const [observadorInput, setObservadorInput] = React.useState<string>("Pesquisador PPGTCA");
  const [confiancaInput, setConfiancaInput] = React.useState<"alta" | "media" | "baixa">("alta");
  const [observacoesInput, setObservacoesInput] = React.useState<string>("");

  const ponto = obterPontoSelecionado();

  React.useEffect(() => {
    setLaudoAuditoria(null);
  }, [ponto?.id]);

  const salvarRotuloHumano = () => {
    if (!ponto) return;
    const hoje = new Date().toISOString().split("T")[0];

    // J1: cego é estritamente DERIVADO do modo da tela no momento do registro.
    // Se a tela exibiu estrato, tercil, nível de K ou score heurístico/JEV (modo inspeção), cego é falso.
    const cegoDerivado = modo === "registro";

    // J1: papelConjunto deixa de ser literal e vem da designação registrada no sorteio D16, ou indisponivel.
    const papelConjuntoDerivado: "treino" | "held-out" | "indisponivel" =
      ponto.papelConjunto ?? "indisponivel";

    // J1: Sem segunda observação independente, divergência é "indisponivel" e kappa é null.
    const divergenciaDerivada: "nenhuma" | "resolvida-por-terceiro" | "pendente" | "indisponivel" =
      "indisponivel";
    const kappaDerivado = null;

    // D26: Alvo binário derivado a 25% (>= 0.25)
    const alvoBinarioDerivado: 0 | 1 = fracaoErodidaInput >= 0.25 ? 1 : 0;

    const novoRotulo: Rotulo = {
      classe: classeRotuloInput,
      modalidade: modalidadeRotuloInput as any,
      observador: observadorInput.trim() || "Pesquisador PPGTCA",
      observadoEm: hoje,
      cego: cegoDerivado,
      confianca: confiancaInput,
      fracaoErodida: Number(fracaoErodidaInput.toFixed(3)),
      alvoBinarioDerivado,
      observacoes: observacoesInput.trim() || undefined,
    };

    definirRotuloConsolidado(ponto.codigo, {
      final: novoRotulo,
      origens: [novoRotulo],
      kappa: kappaDerivado,
      divergencia: divergenciaDerivada,
      papelConjunto: papelConjuntoDerivado,
    });

    adicionarLog(
      "info",
      "Rotulagem-Humana",
      `Rótulo pericial consolidado para ${ponto.codigo} [cego=${cegoDerivado}, fração=${fracaoErodidaInput.toFixed(2)}, papel=${papelConjuntoDerivado}].`
    );
  };

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
            className="mt-4 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 cursor-pointer"
          >
            Inspecionar Primeiro Ponto ({pontos[0].codigo})
          </button>
        )}
      </div>
    );
  }

  const dmsLat = formatToDMS(ponto.latitude, true);
  const dmsLng = formatToDMS(ponto.longitude, false);

  const rotuloConsolidado = rotulosConsolidados[ponto.codigo] ?? null;
  const rotuloFinal = rotuloConsolidado?.final ?? null;
  const soloAssociacao = ponto.solo?.tipoUnidade?.estado === "medido" && ponto.solo.tipoUnidade.valor === "associacao";
  const janelaAtiva = modeloAtivo === "D" ? ponto.temporal?.D : ponto.temporal?.P;

  return (
    <div className="space-y-6">
      {/* Barra de Seleção de Modo Epistêmico (J1: Separação Estrita de Registro vs Inspeção) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Protocolo Epistêmico de Operação (J1 / Regra 4 / D26)
            </h4>
            <p className="text-[11px] text-slate-400">
              {modo === "registro"
                ? "Modo Registro Ativo: Telas blindadas sem metadados de estrato ou preditores para assegurar 'cego = true'."
                : "Modo Inspeção Ativo: Visão diagnóstica integral de variáveis e modelos. Gravação de rótulo desabilitada."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => setModo("inspecao")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              modo === "inspecao"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Modo Inspeção Diagnóstica
          </button>
          <button
            type="button"
            onClick={() => setModo("registro")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              modo === "registro"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Modo Registro de Rótulo (Protocolo Cego)
          </button>
        </div>
      </div>

      {/* =====================================================================
          MODO REGISTRO DE RÓTULO (PROTOCOLO CEGO ESTRITO)
          NÃO renderiza: estratoId, tercilS/E, nivelK, scoreJev, laudos ou preditores
          ===================================================================== */}
      {modo === "registro" ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Cabeçalho Blindado do Ponto */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{ponto.codigo}</h2>
                  <span className="rounded bg-emerald-100 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-800 border border-emerald-200">
                    PROTOCOLO CEGO ATIVO (D26)
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Registro de verdade terrestre independente. Coordenadas e identificador único de amostragem.
                </p>
              </div>

              {/* Seletor rápido de pontos no modo cego */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 font-medium">Trocar Ponto:</label>
                <select
                  value={ponto.id}
                  onChange={(e) => selecionarPonto(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none"
                >
                  {pontos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Coordenadas e Localização do Registro */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded bg-white p-3 border border-emerald-200/80 shadow-xs">
                <span className="text-slate-500 font-medium">Latitude:</span>
                <p className="font-mono text-slate-900 font-bold">{ponto.latitude.toFixed(6)}° ({dmsLat})</p>
              </div>
              <div className="rounded bg-white p-3 border border-emerald-200/80 shadow-xs">
                <span className="text-slate-500 font-medium">Longitude:</span>
                <p className="font-mono text-slate-900 font-bold">{ponto.longitude.toFixed(6)}° ({dmsLng})</p>
              </div>
            </div>
          </div>

          {/* Formulário Pericial de Observação com Alvo Contínuo (D26) e Binário Secundário */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                FORMULÁRIO DE ANOTAÇÃO PERICIAL HUMANA (REGRA 4 &amp; DECISÃO D26)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Os valores registrados aqui alimentam a massa de treino e teste sem influência de predições algorítmicas ou estratificações.
              </p>
            </div>

            {/* Alvo Primário Contínuo (D26): Fração Erodida da Célula [0, 1] */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px]">
                    ALVO PRIMÁRIO (D26)
                  </span>
                  Fração Erodida da Célula [0.00 a 1.00] (Tweedie):
                </label>
                <span className="font-mono font-bold text-base text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {fracaoErodidaInput.toFixed(2)} ({(fracaoErodidaInput * 100).toFixed(0)}% da célula de 10 m)
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Área da célula de 10 m (100 m²) delineada como mancha ou sulco de erosão laminar sobre imagem de alta resolução (VANT ou campo).
              </p>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={fracaoErodidaInput}
                onChange={(e) => setFracaoErodidaInput(parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-emerald-600"
              />
            </div>

            {/* Alvo Secundário Derivado: Limiar D26 de 25% */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div>
                <span className="px-1.5 py-0.5 rounded bg-slate-300 text-slate-800 font-mono text-[10px] font-bold mr-2">
                  ALVO SECUNDÁRIO DERIVADO
                </span>
                <span className="text-slate-700 font-medium">
                  Limiar Binário D26 (≥ 25% erodido):
                </span>
              </div>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  fracaoErodidaInput >= 0.25
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {fracaoErodidaInput >= 0.25
                  ? "1 — Positivo (≥ 25 m² erodidos)"
                  : "0 — Negativo (< 25 m² erodidos)"}
              </span>
            </div>

            {/* Campos Categóricos Tradicionais (D03) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Classe Categórica D03:</label>
                <select
                  value={classeRotuloInput}
                  onChange={(e) => setClasseRotuloInput(e.target.value as "erosao" | "controle")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="erosao">1 — Erosão Laminar Ativa</option>
                  <option value="controle">0 — Controle (SPD Conservado)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Modalidade de Observação:</label>
                <select
                  value={modalidadeRotuloInput}
                  onChange={(e) =>
                    setModalidadeRotuloInput(e.target.value as any)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="campo">Campo — SAREL Coletor (GNSS com Média Estática)</option>
                  <option value="drone">VANT — Delineação Ortomosaico Centimétrico (D16 / D26)</option>
                  <option value="interpretacao-visual">Legado Superado — Interpretação Visual (Aposentado D16)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Perito / Observador:</label>
                <input
                  type="text"
                  value={observadorInput}
                  onChange={(e) => setObservadorInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-emerald-500 focus:outline-none"
                  placeholder="Nome do avaliador pericial"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Nível de Confiança:</label>
                <select
                  value={confiancaInput}
                  onChange={(e) => setConfiancaInput(e.target.value as "alta" | "media" | "baixa")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="alta">Alta (Feição nítida / Posicionamento preciso)</option>
                  <option value="media">Média (Sinal moderado de escoamento)</option>
                  <option value="baixa">Baixa (Cobertura densa / Dúvida interpretativa)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Observações Periciais:</label>
              <textarea
                value={observacoesInput}
                onChange={(e) => setObservacoesInput(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-emerald-500 focus:outline-none"
                placeholder="Detalhes in-situ, estado de palhada, microrrelevo ou feições diagnósticas..."
              />
            </div>

            {/* Botão de Gravação — EXCLUSIVO DO MODO REGISTRO */}
            <div className="pt-2">
              <button
                type="button"
                onClick={salvarRotuloHumano}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Gravar Rótulo Pericial Humano sob Protocolo Cego (Ponto {ponto.codigo})
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* =====================================================================
           MODO INSPEÇÃO DIAGNÓSTICA (VISÃO INTEGRAL)
           Exibe metadados completos de estratificação, solo, terreno, modelos e auditoria.
           NÃO contém botão de salvar rótulo (proteção contra quebra de protocolo cego).
           ===================================================================== */
        <div className="space-y-6 animate-in fade-in">
          {/* Cabeçalho Completo do Ponto com Metadados da Estratificação */}
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

              {/* Seletor de pontos */}
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
                <SeloProveniencia label="TWI (Topographic Wetness Index)" proveniencia={ponto.terreno?.twi} />
                <SeloProveniencia label="Curvatura de Perfil" proveniencia={ponto.terreno?.curvaturaPerfil} unidade="m⁻¹" />
                <SeloProveniencia label="Curvatura Plana" proveniencia={ponto.terreno?.curvaturaPlana} unidade="m⁻¹" />
                <div className="col-span-2">
                  <SeloProveniencia label="Acúmulo de Fluxo" proveniencia={ponto.terreno?.acumuloFluxo} unidade="pixels" />
                </div>
              </div>
            </div>

            {/* Bloco Solo */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  PEDOLOGIA (Cartas Embrapa Solos / D12 / D14)
                </h3>
                {soloAssociacao && (
                  <span className="flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                    <AlertTriangle className="w-3 h-3" />
                    Associação
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SeloProveniencia label="Ordem do Solo" proveniencia={ponto.solo?.ordem} />
                <SeloProveniencia label="Subordem" proveniencia={ponto.solo?.subOrdem} />
                <SeloProveniencia label="Grande Grupo" proveniencia={ponto.solo?.grandeGrupo} />
                <SeloProveniencia label="Tipo de Unidade" proveniencia={ponto.solo?.tipoUnidade} />
                <div className="col-span-2">
                  <SeloProveniencia
                    label="Classe de Erodibilidade (Fator K)"
                    proveniencia={ponto.solo?.erodibilidadeClasse}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bloco Temporal — Seletor Modelo D vs P */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  SÉRIE TEMPORAL SENTINEL-2 L2A (Decisão D04 — Separação D vs P)
                </h3>
                <p className="text-xs text-slate-500">
                  {modeloAtivo === "D"
                    ? "Modelo D: Detecção Contemporânea (t₀) — cicatrizes e feições ativas."
                    : "Modelo P: Predição de Risco Futuro com Guarda Obrigatória de 24 meses (t₀ - 2 anos anti-leakage)."}
                </p>
              </div>

              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setModeloAtivo("D")}
                  className={`rounded-md px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                    modeloAtivo === "D"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Modelo D (Contemporâneo)
                </button>
                <button
                  type="button"
                  onClick={() => setModeloAtivo("P")}
                  className={`rounded-md px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                    modeloAtivo === "P"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Modelo P (Guarda 2 Anos)
                </button>
              </div>
            </div>

            {janelaAtiva ? (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <SeloProveniencia label="Frequência Solo Nu" proveniencia={janelaAtiva.serie?.frequenciaSoloNu} unidade="%" />
                  <SeloProveniencia label="Persistência Temporal" proveniencia={janelaAtiva.serie?.persistenciaTemporal} />
                  <SeloProveniencia label="Tendência (Sen's Slope)" proveniencia={janelaAtiva.serie?.tendenciaSenSlope} />
                  <SeloProveniencia label="Amplitude Sazonal" proveniencia={janelaAtiva.serie?.amplitudeSazonal} />
                </div>
                <GraficoSerieTemporal dados={janelaAtiva.observacoes ?? []} modeloAtivo={modeloAtivo} />
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Série temporal não calculada para a janela do Modelo {modeloAtivo}.
              </div>
            )}
          </div>

          {/* Bloco de Auditoria Qualitativa com Fallback Heurístico Local */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    AUDITORIA QUALITATIVA DE SUSCETIBILIDADE (DUAL-ENGINE JEV)
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Avaliação qualitativa sob demanda. Não substitui o cálculo físico da RUSLE nem compõe a matriz de treino.
                </p>
              </div>

              <button
                type="button"
                onClick={dispararAuditoria}
                disabled={auditando}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                {auditando ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditando...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Auditar Suscetibilidade</span>
                  </>
                )}
              </button>
            </div>

            {laudoAuditoria && (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">
                    Método: {laudoAuditoria.metodo === "JEV_SYSTEM_ONE" ? "JEV Neural Remoto" : "Heurística Local de Suscetibilidade"}
                  </span>
                  <span className="font-mono text-emerald-800">
                    Latência: {laudoAuditoria.latenciaMs} ms
                  </span>
                </div>
                <p className="text-slate-700 italic">
                  &ldquo;{laudoAuditoria.scoreSuscetibilidade?.descricao || laudoAuditoria.consistenciaFisica?.observacao || "Laudo pericial emitido."}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Bloco de Rótulo Humano (Somente Leitura no Modo Inspeção) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">
                  RÓTULO HUMANO CONSOLIDADO (Regra 4 — Somente Leitura na Inspeção)
                </h3>
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Blindado contra Edição
                </span>
              </div>

              {rotuloFinal ? (
                <div className="space-y-2 text-xs bg-emerald-50/50 border border-emerald-200/80 rounded-lg p-3">
                  <div className="flex justify-between border-b border-emerald-100 pb-1">
                    <span className="text-slate-500 font-medium">Classe Observada:</span>
                    <span className="font-bold text-emerald-900 uppercase">{rotuloFinal.classe}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-100 pb-1">
                    <span className="text-slate-500 font-medium">Alvo Primário Contínuo (D26):</span>
                    <span className="font-bold text-emerald-900">
                      {rotuloFinal.fracaoErodida !== undefined
                        ? `${rotuloFinal.fracaoErodida.toFixed(2)} (${(rotuloFinal.fracaoErodida * 100).toFixed(0)}% erodido)`
                        : "Não informado (legado)"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-100 pb-1">
                    <span className="text-slate-500 font-medium">Alvo Secundário Derivado:</span>
                    <span className="font-bold text-slate-800">
                      {rotuloFinal.alvoBinarioDerivado !== undefined
                        ? rotuloFinal.alvoBinarioDerivado === 1
                          ? "1 (≥ 25% erodido)"
                          : "0 (< 25% erodido)"
                        : rotuloFinal.classe === "erosao"
                        ? "1 (classe legada)"
                        : "0 (classe legada)"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-100 pb-1">
                    <span className="text-slate-500 font-medium">Modalidade:</span>
                    <span className="font-medium text-slate-800">{rotuloFinal.modalidade}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-100 pb-1">
                    <span className="text-slate-500 font-medium">Observador:</span>
                    <span className="font-medium text-slate-800">{rotuloFinal.observador}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-100 pb-1">
                    <span className="text-slate-500 font-medium">Data de Observação:</span>
                    <span className="font-mono text-slate-800">{rotuloFinal.observadoEm}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-100 pb-1">
                    <span className="text-slate-500 font-medium">Protocolo Cego:</span>
                    <span className="font-medium text-emerald-700">{rotuloFinal.cego ? "Sim (Cego)" : "Não"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Papel no Conjunto (D16):</span>
                    <span className="font-mono font-bold text-slate-800">
                      {rotuloConsolidado.papelConjunto}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Ponto ainda não rotulado por observação humana independente.
                </p>
              )}

              {/* Aviso Metodológico: Gravação Desabilitada no Modo de Inspeção */}
              <div className="p-3 rounded-lg border border-sky-200 bg-sky-50 text-[11px] text-sky-900 leading-relaxed flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
                <div>
                  <b>Gravação de Rótulos Bloqueada neste Modo:</b> Para registrar novo laudo com garantia de protocolo cego (<code>cego = true</code>), alterne no topo para o <b>Modo Registro de Rótulo</b>. O formulário de gravação é intencionalmente omitido aqui para impedir contaminação cognitiva.
                </div>
              </div>
            </div>

            {/* Contexto Fundiário */}
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
      )}
    </div>
  );
}
