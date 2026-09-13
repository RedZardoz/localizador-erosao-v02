"use client";

import React, { useState } from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { PERFIS_EXPORTACAO, PerfilExportacao } from "@/lib/matriz/perfis";
import { SITIOS_PADRAO_OURO } from "@/lib/padraoOuro/sitiosReferencia";
import {
  executarValidacaoMatricial,
  MetricasValidacaoMatricial,
  PixelValidacao,
} from "@/lib/padraoOuro/validacaoMatricial";
import {
  FileSpreadsheet,
  CheckCircle2,
  Plane,
  Crosshair,
  Layers,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export function PainelCampanha() {
  const { pontos, setMapState, setModalAtiva } = useSarelStore();
  const [abaInterna, setAbaInterna] = useState<"exportacao" | "kobo" | "padrao-ouro">("padrao-ouro");
  const [sitioSelecionadoId, setSitioSelecionadoId] = useState<string>("sitio-ouro-01");
  const [metricasSimuladas, setMetricasSimuladas] = useState<MetricasValidacaoMatricial | null>(null);

  const perfis: PerfilExportacao[] = [
    "planilha",
    "interpretacao-cega",
    "campo-cego",
    "voo-cego",
    "matriz-treino",
  ];

  const sitioAtual = SITIOS_PADRAO_OURO.find((s) => s.id === sitioSelecionadoId) || SITIOS_PADRAO_OURO[0];

  const voarParaSitio = (lat: number, lng: number) => {
    setMapState({
      flyToTarget: {
        lat,
        lng,
        zoom: 14.5,
        pitch: 45,
      },
    });
    setModalAtiva(null);
  };

  // Simulação / Demonstração do cálculo matricial sobre a área do sítio selecionado
  const calcularMetricasDemonstracao = () => {
    // Grade de pixels sobre o sítio com alta concordância típica de ortomosaicos VANT
    const pixelsDemonstracao: PixelValidacao[] = Array.from({ length: 250 }, (_, i) => {
      const isErosao = i < 75; // 75 pixels de erosão real
      const predicao = i < 70 ? 1 : i === 71 || i === 72 ? 1 : isErosao ? 0 : 0; // 70 TP, 2 FP, 5 FN, 173 TN
      return {
        idPixel: `px-${i + 1}`,
        latitude: -25.2985 + (i % 15) * 0.0001,
        longitude: -54.0208 + Math.floor(i / 15) * 0.0001,
        referenciaDrone: isErosao ? 1 : 0,
        predicaoSatelite: predicao as 0 | 1,
        compartimento:
          i < 50
            ? "topo_estavel"
            : i < 180
            ? "encosta_escoamento"
            : "baixada_deposicao",
      };
    });

    const m = executarValidacaoMatricial(pixelsDemonstracao, {
      gsdDroneCm: 7.5,
      gradeSateliteM: 10.0,
    });
    setMetricasSimuladas(m);
  };

  return (
    <div className="space-y-6">
      {/* Abas Superiores */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setAbaInterna("padrao-ouro")}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            abaInterna === "padrao-ouro"
              ? "border-cyan-500 text-cyan-700 dark:text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Plane className="w-4 h-4 text-cyan-500" />
          Validação Padrão-Ouro (VANT/Drone)
          <span className="bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
            4 Sítios
          </span>
        </button>

        <button
          onClick={() => setAbaInterna("exportacao")}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            abaInterna === "exportacao"
              ? "border-indigo-500 text-indigo-700 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          Exportação Cega por Perfil
        </button>

        <button
          onClick={() => setAbaInterna("kobo")}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            abaInterna === "kobo"
              ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Ingestão KoboCollect (Fase B)
        </button>
      </div>

      {/* CONTEÚDO 1: VALIDAÇÃO PADRÃO-OURO VANT/DRONE (SEÇÃO 3.2) */}
      {abaInterna === "padrao-ouro" && (
        <div className="space-y-6">
          {/* Banner Metodológico */}
          <div className="rounded-xl border border-cyan-200 dark:border-cyan-900/60 bg-gradient-to-r from-cyan-50/80 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/10 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Protocolo de Validação Padrão-Ouro — Seção 3.2 (PPGTCA 2026)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Para validação de alta resolução espacial em vez de voos fragmentados em microparcelas, 
                  o método adota polígonos contínuos de <strong>10 a 50 hectares</strong> em propriedades agrícolas de 
                  <strong> Céu Azul</strong> e <strong>Medianeira</strong> (Bacia do Paraná 3). Os dados de drone possuem papel 
                  estritamente <strong>HELD-OUT</strong> (nunca integram a matriz de treino).
                </p>
              </div>
            </div>
          </div>

          {/* Grid dos 4 Sítios Contínuos Oficiais */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600" />
              Sítios Contínuos de Referência Territorial (SICAR/CAR)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SITIOS_PADRAO_OURO.map((sitio) => {
                const isSelected = sitio.id === sitioSelecionadoId;
                const centerLat = (sitio.bbox[1] + sitio.bbox[3]) / 2;
                const centerLng = (sitio.bbox[0] + sitio.bbox[2]) / 2;

                return (
                  <div
                    key={sitio.id}
                    onClick={() => setSitioSelecionadoId(sitio.id)}
                    className={`rounded-xl border p-4 transition-all cursor-pointer ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-50/30 dark:bg-cyan-950/20 shadow-md ring-1 ring-cyan-400"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {sitio.properties.nomeIdentificador}
                          </span>
                          <span className="bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                            {sitio.properties.municipio}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-1">
                          CAR: {sitio.properties.codigoCar.substring(0, 24)}...
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          voarParaSitio(centerLat, centerLng);
                        }}
                        className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                        title="Localizar no Mapa 3D"
                      >
                        <MapPin className="w-3 h-3" />
                        Ver no Mapa
                      </button>
                    </div>

                    {/* Atributos Físicos e Metodológicos */}
                    <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Área Contínua:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {sitio.properties.areaHa} ha
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Grade Satélite:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {sitio.properties.totalPixels10mEstimados} pixels (10m)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">VANT GSD:</span>
                        <span className="font-bold text-cyan-700 dark:text-cyan-400 font-mono">
                          {sitio.properties.resolucaoVantGsdCm} cm
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detalhes do Sítio Ativo e Gradiente Topo-Sequencial */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-cyan-600" />
                  Gradiente Topo-Sequencial de Calibração: {sitioAtual.properties.nomeIdentificador}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Captura a dinâmica erosiva completa da vertente agrícola: Topo Estável, Encosta de Escoamento e Baixada Coluvial.
                </p>
              </div>

              <button
                onClick={calcularMetricasDemonstracao}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Plane className="w-3.5 h-3.5" />
                Calcular Métricas Matriciais (GSD vs 10m)
              </button>
            </div>

            {/* Compartimentos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3">
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                  1. Topo Estável
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2">
                  Divisor de Águas (2% a 6%)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Área de baixa energia cinética e infiltração. Solo estável com cobertura vegetal consolidada.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3">
                <span className="text-[10px] font-bold uppercase text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded">
                  2. Encosta de Escoamento
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2">
                  Meia Encosta (8% a 18%)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Zona crítica de cisalhamento hidráulico, arraste de sedimentos e formação potencial de sulcos erosivos.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3">
                <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                  3. Baixada de Deposição
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2">
                  Sopé e Baixada (1% a 5%)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Desaceleração do fluxo e deposição coluvial. Convergência de umidade e acúmulo de partículas finas.
                </p>
              </div>
            </div>

            {/* Painel de Métricas Matriciais */}
            {metricasSimuladas && (
              <div className="mt-4 rounded-xl border border-cyan-200 dark:border-cyan-900 bg-cyan-50/20 dark:bg-cyan-950/10 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                    Resultado da Validação Matricial Pixel-a-Pixel (GSD 7.5 cm vs 10 m)
                  </h5>
                  <span className="text-[10px] font-mono text-cyan-800 dark:text-cyan-300 font-bold bg-cyan-100 dark:bg-cyan-900/60 px-2 py-0.5 rounded">
                    Razão de Escala: ~17.778 sub-pixels/célula
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[10px] text-slate-500 block">Acurácia Global (OA)</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                      {(metricasSimuladas.acuraciaGlobal * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[10px] text-slate-500 block">Kappa de Cohen (κ)</span>
                    <span className="text-base font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                      {metricasSimuladas.kappaCohen.toFixed(3)}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[10px] text-slate-500 block">F1-Score</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                      {(metricasSimuladas.f1Score * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[10px] text-slate-500 block">Precisão</span>
                    <span className="text-base font-bold text-emerald-600 font-mono">
                      {(metricasSimuladas.precisao * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[10px] text-slate-500 block">Índice IoU (Jaccard)</span>
                    <span className="text-base font-bold text-blue-600 font-mono">
                      {(metricasSimuladas.iouErosao * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Matriz de Confusão Numérica */}
                <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono flex items-center justify-between pt-2 border-t border-cyan-100 dark:border-cyan-900/60">
                  <span>Matriz: TP={metricasSimuladas.matrizConfusao.tp} | FP={metricasSimuladas.matrizConfusao.fp} | FN={metricasSimuladas.matrizConfusao.fn} | TN={metricasSimuladas.matrizConfusao.tn}</span>
                  <span className="text-[10px] text-slate-400">Total: {metricasSimuladas.totalPixelsAvaliados} células de 10m validadas</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO 2: EXPORTAÇÃO CEGA POR PERFIL */}
      {abaInterna === "exportacao" && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Gestão de Campanha e Exportação por Perfil Cego (Invariante 2)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Garante que equipes de campo e fotointérpretes recebam planilhas cegas sem vazamento de
              features, escores ou rótulos de outras modalidades.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 pt-2">
            {perfis.map((perfil) => {
              const config = PERFIS_EXPORTACAO[perfil];
              return (
                <div
                  key={perfil}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 shadow-sm"
                >
                  <div>
                    <span className="rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                      {perfil}
                    </span>
                    <h4 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">{config.descricao}</h4>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Permite {config.colunasPermitidas.length} colunas pré-aprovadas.
                    </p>
                  </div>

                  <button
                    disabled={pontos.length === 0}
                    className="mt-4 w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Exportar CSV / XLSX ({perfil})
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTEÚDO 3: INGESTÃO KOBOCOLLECT (FASE B) */}
      {abaInterna === "kobo" && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Ingestão de Formulários Georreferenciados KoboCollect (Fase B)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ingestão automatizada de formulários de campo com conferência geodésica de raio de tolerância P03 (ex.: 150m) 
              e avaliação de concordância inter-avaliadores (Kappa de Cohen).
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Arraste o arquivo CSV/Excel exportado do KoboToolbox
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Contendo as colunas: <code>codigoPonto</code>, <code>classe</code>, <code>_geolocation</code>, <code>data_observacao</code>
              </p>
            </div>
            <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer">
              Selecionar Arquivo Kobo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
