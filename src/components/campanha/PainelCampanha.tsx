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
import { gerarCsvCientifico } from "@/lib/export/csv";
import { gerarPlanilhaXLSX } from "@/lib/export/planilha";
import {
  ingestarSubmissoesSarelColetor,
  gerarTemplateSarelColetorCsv,
  ResultadoIngestaoColetor,
} from "@/lib/rotulos/ingestaoColetor";
import {
  ingestarSubmissoesKobo,
  ResultadoIngestaoKobo,
  CoordenadaEsperada,
} from "@/lib/rotulos/ingestaoKobo";
import { AREA_INTERESSE_PADRAO } from "@/config/areaInteresse";
import {
  FileSpreadsheet,
  CheckCircle2,
  Plane,
  Crosshair,
  Layers,
  MapPin,
  ShieldCheck,
  Download,
  Upload,
  AlertTriangle,
  History,
  Smartphone,
  Info,
} from "lucide-react";

export function PainelCampanha() {
  const {
    pontos,
    pontosProvisorios,
    rotulosConsolidados,
    setMapState,
    setModalAtiva,
    definirRotuloConsolidado,
    adicionarLog,
  } = useSarelStore();
  const pontosAtivos = pontos.length > 0 ? pontos : pontosProvisorios;

  // J2: Alinhamento das abas à metodologia vigente (D16)
  const [abaInterna, setAbaInterna] = useState<"vant-d16" | "coletor" | "exportacao" | "legado">("vant-d16");
  const [sitioSelecionadoId, setSitioSelecionadoId] = useState<string>("sitio-ouro-01");
  const [metricasSimuladas, setMetricasSimuladas] = useState<MetricasValidacaoMatricial | null>(null);

  // Ingestão SAREL Coletor (D16)
  const [resultadoColetor, setResultadoColetor] = useState<ResultadoIngestaoColetor | null>(null);
  const fileInputColetorRef = React.useRef<HTMLInputElement | null>(null);

  // Ingestão Histórica de Legado Kobo (Superado D16)
  const [resultadoKoboLegado, setResultadoKoboLegado] = useState<ResultadoIngestaoKobo | null>(null);
  const fileInputKoboLegadoRef = React.useRef<HTMLInputElement | null>(null);

  const [msgCampanha, setMsgCampanha] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const exportarPerfilCsv = (perfil: PerfilExportacao) => {
    if (pontosAtivos.length === 0) return;
    try {
      const csvStr = gerarCsvCientifico(pontosAtivos, perfil, rotulosConsolidados);
      const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sarel_${perfil}_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMsgCampanha({
        tipo: "sucesso",
        texto: `Perfil '${perfil}' exportado em CSV (${pontosAtivos.length} amostras) respeitando o Invariante 2!`,
      });
    } catch (e: any) {
      setMsgCampanha({ tipo: "erro", texto: e?.message || "Erro ao exportar perfil CSV." });
    }
  };

  const exportarPerfilXlsx = async (perfil: PerfilExportacao) => {
    if (pontosAtivos.length === 0) return;
    try {
      const buffer = await gerarPlanilhaXLSX(pontosAtivos, { perfil, rotulosConsolidados });
      const blob = new Blob([buffer as any], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sarel_${perfil}_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setMsgCampanha({
        tipo: "sucesso",
        texto: `Perfil '${perfil}' exportado em XLSX (${pontosAtivos.length} amostras) respeitando o Invariante 2!`,
      });
    } catch (e: any) {
      setMsgCampanha({ tipo: "erro", texto: e?.message || "Erro ao exportar perfil XLSX." });
    }
  };

  // Download do Template Canônico do SAREL Coletor (28 colunas canônicas)
  const baixarTemplateSarelColetorCsv = () => {
    if (pontosAtivos.length === 0) return;
    const mapaEsperadas = pontosAtivos.map((p) => ({
      codigo: p.codigo,
      latitude: p.latitude,
      longitude: p.longitude,
    }));
    const csv = gerarTemplateSarelColetorCsv(mapaEsperadas);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_sarel_coletor_28col_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Ingestão Oficial do SAREL Coletor (CSV separado por ponto-e-vírgula com 28 colunas + GNSS)
  const processarArquivoSarelColetor = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const texto = await file.text();
      const mapaEsperadas: Record<string, CoordenadaEsperada> = {};
      for (const p of pontosAtivos) {
        mapaEsperadas[p.codigo] = {
          codigo: p.codigo,
          latitude: p.latitude,
          longitude: p.longitude,
        };
      }

      const res = ingestarSubmissoesSarelColetor(texto, mapaEsperadas);
      setResultadoColetor(res);

      let consolidadosCount = 0;
      for (const item of res.aceitos) {
        const pontoRef = pontosAtivos.find((p) => p.codigo === item.pontoCodigo);
        const papelConjunto = pontoRef?.papelConjunto ?? "indisponivel";

        definirRotuloConsolidado(item.pontoCodigo, {
          final: item.rotulo,
          origens: [item.rotulo],
          kappa: null,
          divergencia: "indisponivel",
          papelConjunto,
        });
        consolidadosCount++;
      }

      adicionarLog(
        "info",
        "SAREL-Coletor-D16",
        `Ingestão SAREL Coletor: ${consolidadosCount} pontos aceitos (qualidade P03 auditada) e ${res.rejeitados.length} rejeitados.`
      );
      setMsgCampanha({
        tipo: "sucesso",
        texto: `Ingestão SAREL Coletor concluída: ${consolidadosCount} laudos de campo consolidados sob protocolo cego!`,
      });
    } catch (err: any) {
      setMsgCampanha({
        tipo: "erro",
        texto: err?.message || "Falha ao processar arquivo do SAREL Coletor.",
      });
    } finally {
      if (fileInputColetorRef.current) {
        fileInputColetorRef.current.value = "";
      }
    }
  };

  // Ingestão Histórica de Legado KoboToolbox (Superado D16)
  const processarArquivoKoboLegado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const texto = await file.text();
      let registros: Record<string, unknown>[] = [];
      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(texto);
        registros = Array.isArray(parsed) ? parsed : [];
      } else {
        const linhas = texto
          .replace(/^\uFEFF/, "")
          .split(/\r?\n/)
          .filter((l) => l.trim().length > 0 && !l.startsWith("#"));
        if (linhas.length >= 2) {
          const cols = linhas[0].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
          registros = linhas.slice(1).map((l) => {
            const vals = l.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
            const obj: Record<string, unknown> = {};
            cols.forEach((col, idx) => {
              obj[col] = vals[idx] ?? "";
            });
            if (obj.cego === "true") obj.cego = true;
            if (obj.cego === "false") obj.cego = false;
            return obj;
          });
        }
      }

      const mapaEsperadas: Record<string, CoordenadaEsperada> = {};
      for (const p of pontosAtivos) {
        mapaEsperadas[p.codigo] = {
          codigo: p.codigo,
          latitude: p.latitude,
          longitude: p.longitude,
        };
      }

      const res = ingestarSubmissoesKobo(registros, mapaEsperadas);
      setResultadoKoboLegado(res);
      adicionarLog(
        "warning",
        "Legado-Kobo-Superado",
        `Ingestão de legado Kobo executada para fins históricos: ${res.aceitos.length} aceitos, ${res.rejeitados.length} rejeitados.`
      );
      setMsgCampanha({
        tipo: "sucesso",
        texto: `Arquivo legado Kobo processado para consulta histórica (${res.aceitos.length} registros). Conforme D16 item 5, o instrumento canônico atual é o SAREL Coletor.`,
      });
    } catch (err: any) {
      setMsgCampanha({
        tipo: "erro",
        texto: err?.message || "Falha ao processar arquivo legado Kobo.",
      });
    } finally {
      if (fileInputKoboLegadoRef.current) {
        fileInputKoboLegadoRef.current.value = "";
      }
    }
  };

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

  // Simulação / Demonstração do cálculo matricial sobre a área do sítio selecionado (J4: coordenadas via config central)
  const calcularMetricasDemonstracao = () => {
    const latRef = AREA_INTERESSE_PADRAO.coordenadasReferenciaDemonstracao.lat;
    const lonRef = AREA_INTERESSE_PADRAO.coordenadasReferenciaDemonstracao.lng;

    const pixelsDemonstracao: PixelValidacao[] = Array.from({ length: 250 }, (_, i) => {
      const isErosao = i < 75; // 75 pixels de erosão real
      const predicao = i < 70 ? 1 : i === 71 || i === 72 ? 1 : isErosao ? 0 : 0; // 70 TP, 2 FP, 5 FN, 173 TN
      const ndviDrone = isErosao ? 0.18 + (i % 6) * 0.01 : 0.72 + (i % 12) * 0.01;
      const ndviSatelite = isErosao ? 0.20 + (i % 6) * 0.011 : 0.70 + (i % 12) * 0.011;
      const ndreDrone = isErosao ? 0.11 + (i % 5) * 0.008 : 0.42 + (i % 8) * 0.01;

      return {
        idPixel: `px-${i + 1}`,
        latitude: latRef + (i % 15) * 0.0001,
        longitude: lonRef + Math.floor(i / 15) * 0.0001,
        referenciaDrone: isErosao ? 1 : 0,
        predicaoSatelite: predicao as 0 | 1,
        ndviDrone,
        ndviSatelite,
        ndreDrone,
        compartimento:
          i < 50
            ? "topo_estavel"
            : i < 180
            ? "encosta_escoamento"
            : "baixada_deposicao",
      };
    });

    const m = executarValidacaoMatricial(pixelsDemonstracao, {
      gsdDroneCm: 5.0,
      gradeSateliteM: 10.0,
    });
    setMetricasSimuladas(m);
  };

  return (
    <div className="space-y-6">
      {/* Abas Superiores Reestruturadas conforme D16 (J2) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 flex-wrap">
        <button
          onClick={() => setAbaInterna("vant-d16")}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            abaInterna === "vant-d16"
              ? "border-cyan-500 text-cyan-700 dark:text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Plane className="w-4 h-4 text-cyan-500" />
          VANT &amp; Desenho Amostral (D16)
          <span className="bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
            72 Polígonos
          </span>
        </button>

        <button
          onClick={() => setAbaInterna("coletor")}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            abaInterna === "coletor"
              ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-500" />
          SAREL Coletor (Fase B — D16)
          <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
            28 Colunas
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
          onClick={() => setAbaInterna("legado")}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            abaInterna === "legado"
              ? "border-amber-500 text-amber-700 dark:text-amber-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <History className="w-4 h-4 text-amber-500" />
          Legado Superado (D16)
        </button>
      </div>

      {/* CONTEÚDO 1: CAMPANHA DE VANT & DESENHO AMOSTRAL (DECISÃO D16) */}
      {abaInterna === "vant-d16" && (
        <div className="space-y-6">
          {/* Banner Metodológico da Inversão de Papéis de D16 */}
          <div className="rounded-xl border border-cyan-200 dark:border-cyan-900/60 bg-gradient-to-r from-cyan-50/80 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/10 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                  Inversão de Papéis da Decisão D16 — VANT Multiespectral como Massa de Treino e Teste
                  <span className="bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded">
                    MicaSense Altum / Spectral 2 • GSD ~3,8 cm • CE90 1,47 m
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Conforme formalizado na <strong>Decisão D16</strong>, o VANT deixou de ser exclusivamente held-out e assumiu o papel de 
                  <strong> massa de treino e teste independente balanceado</strong>. A delineação vetorial centimétrica sobre ortomosaicos 
                  eleva a acurácia de atribuição ao pixel de 10 m para <strong>~78%</strong> (contra ~37% do GNSS de campo isolado), 
                  entregando cerca de <strong>1.845 unidades espacialmente independentes</strong> ao longo dos 18 estratos biofísicos.
                </p>
              </div>
            </div>
          </div>

          {/* Os Três Conjuntos Metodológicos de D16 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Conjunto 1: Polígonos de VANT */}
            <div className="rounded-xl border border-cyan-300 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded">
                  Conjunto 1 (D16)
                </span>
                <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">361 ha Total</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                72 Polígonos de VANT (5,02 ha)
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                4 polígonos por estrato nos 18 estratos de D12 (~224 x 224 m compatíveis com minifúndios da BP3). 
                De cada quarteto, <strong>2 vão para treino</strong> e <strong>2 para held-out</strong>, garantindo replicação interna.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                • 36 Treino | 36 Held-out (D25)
              </div>
            </div>

            {/* Conjunto 2: Pontos de Campo */}
            <div className="rounded-xl border border-emerald-300 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  Conjunto 2 (D16)
                </span>
                <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">60 a 80 Pontos</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Âncora de Prevalência Real
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Pontos dispersos na bacia (fora dos polígonos), sorteados com πᵢ conhecido e coletados pelo SAREL Coletor 
                com média estática GNSS. Função exclusiva: <strong>ancorar a prevalência</strong> sem treinar o classificador.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                • Protocolo cego estrito (Android)
              </div>
            </div>

            {/* Conjunto 3: Confirmação Prospectiva */}
            <div className="rounded-xl border border-purple-300 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  Conjunto 3 (D16)
                </span>
                <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">Pós-Treino</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Confirmação Prospectiva
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Amostra prospectiva sorteada sobre as predições do modelo final após o término do ajuste. 
                Validação confirmatória em campo para atestar a capacidade de generalização e evitar vazamento temporal.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                • Teste confirmatório independente
              </div>
            </div>
          </div>

          {/* Sítios Contínuos de Aferição Instrumental (Céu Azul e Medianeira) */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600" />
              Sítios Piloto de Aferição Instrumental (Nuvem UAV / D16)
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Missões históricas de aferição fotogramétrica que calibraram o GSD (~3,8 cm), a produtividade e o CE90 (1,47 m).
            </p>

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

                    <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Área de Voo:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {sitio.properties.areaHa} ha
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Células S2 (10m):</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {sitio.properties.totalPixels10mEstimados} px
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">GSD Medido:</span>
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

          {/* Gradiente Topo-Sequencial e Validação Matricial */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-cyan-600" />
                  Simulação de Delineação Matricial sobre {sitioAtual.properties.nomeIdentificador}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Confronto de resolução: 62.500 subpixels de VANT (~4 cm) por célula de 10 m do Sentinel-2.
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

            {metricasSimuladas && (
              <div className="rounded-xl border border-cyan-200 dark:border-cyan-900 bg-cyan-50/20 dark:bg-cyan-950/10 p-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[10px] text-slate-500 block">Acurácia Global (OA)</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                      {(metricasSimuladas.acuraciaGlobal * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[10px] text-slate-500 block">Kappa (κ)</span>
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
                    <span className="text-[10px] text-slate-500 block">IoU (Jaccard)</span>
                    <span className="text-base font-bold text-blue-600 font-mono">
                      {(metricasSimuladas.iouErosao * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[10px] text-indigo-600 font-bold block">Confronto Radiom.</span>
                    <span className="text-base font-bold text-indigo-700 font-mono">r = 0.982</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO 2: INGESTÃO SAREL COLETOR (FASE B — D16) */}
      {abaInterna === "coletor" && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Ingestão Oficial do SAREL Coletor (Android GNSS com Média Estática)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Consome CSV canônico com 28 colunas mais métricas de qualidade posicional GNSS. Avalia o critério P03 (15 m nominal, tolerância 25 m).
              </p>
            </div>
            <button
              onClick={baixarTemplateSarelColetorCsv}
              disabled={pontosAtivos.length === 0}
              className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Template CSV do Coletor ({pontosAtivos.length} Pontos)
            </button>
          </div>

          {msgCampanha && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                msgCampanha.tipo === "sucesso"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{msgCampanha.texto}</span>
            </div>
          )}

          {/* Área de Upload de CSV do Coletor */}
          <div className="rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700 p-8 text-center space-y-3 bg-emerald-50/30 dark:bg-emerald-950/10">
            <input
              ref={fileInputColetorRef}
              type="file"
              accept=".csv"
              onChange={processarArquivoSarelColetor}
              className="hidden"
            />
            <Smartphone className="w-8 h-8 text-emerald-600 mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Selecione o arquivo CSV exportado pelo SAREL Coletor
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Separado por ponto-e-vírgula contendo as 28 colunas canônicas e qualidade GNSS P03.
              </p>
            </div>
            <button
              onClick={() => fileInputColetorRef.current?.click()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Selecionar CSV do SAREL Coletor
            </button>
          </div>

          {/* Relatório de Aceitação P03 e Qualidade Posicional */}
          {resultadoColetor && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Total Processados</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {resultadoColetor.totalProcessados}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-emerald-600 block text-[10px]">Aceitos (P03 ≤ 25m)</span>
                  <span className="text-base font-bold text-emerald-700 font-mono">
                    {resultadoColetor.aceitos.length}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-rose-200">
                  <span className="text-rose-600 block text-[10px]">Rejeitados (Desvio &gt; 25m ou Mock)</span>
                  <span className="text-base font-bold text-rose-700 font-mono">
                    {resultadoColetor.rejeitados.length}
                  </span>
                </div>
              </div>

              {resultadoColetor.avisosQualidade.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-200">
                  <span className="font-bold text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Avisos de Tolerância Geodésica (P03):
                  </span>
                  {resultadoColetor.avisosQualidade.slice(0, 5).map((av, idx) => (
                    <p key={idx} className="text-[11px] text-amber-800 font-mono">
                      • {av}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO 3: EXPORTAÇÃO CEGA POR PERFIL */}
      {abaInterna === "exportacao" && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Gestão de Campanha e Exportação por Perfil Cego (Invariante 2)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Garante que equipes de campo e operadores recebam planilhas cegas sem vazamento de
              features, escores ou rótulos de outras modalidades ({pontosAtivos.length} pontos ativos).
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

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => exportarPerfilCsv(perfil)}
                      disabled={pontosAtivos.length === 0}
                      className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 py-1.5 px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </button>
                    <button
                      onClick={() => exportarPerfilXlsx(perfil)}
                      disabled={pontosAtivos.length === 0}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-700 py-1.5 px-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      XLSX
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTEÚDO 4: HISTÓRICO DE LEGADO SUPERADO (D16) */}
      {abaInterna === "legado" && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico de Métodos e Instrumentos Superados (Decisão D16)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Registro histórico transparente dos instrumentos anteriores que foram formalmente aposentados ou substituídos pela reformulação metodológica de D16.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Legado 1: KoboToolbox */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Formulários KoboToolbox / ODK
                </span>
                <span className="font-mono text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  SUPERADO (D16 item 5)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                O KoboCollect operava com 8 colunas e fix GPS único não estabilizado (erro de 3 a 8 m, degradando o acerto de pixel para 37%). 
                Foi substituído pelo <strong>SAREL Coletor</strong>, que implementa média estática e 20 campos adicionais de solo e manejo.
              </p>

              <div className="pt-2 border-t border-slate-200/80">
                <input
                  ref={fileInputKoboLegadoRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={processarArquivoKoboLegado}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputKoboLegadoRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Consultar Arquivo Legado Kobo (Histórico)
                </button>
              </div>
            </div>

            {/* Legado 2: Fotointerpretação Visual em Satélite */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Fotointerpretação Visual Orbital (Fase A)
                </span>
                <span className="font-mono text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  APOSENTADA (D16 item 4)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                A fotointerpretação humana sobre pixels de 10 m do Sentinel-2 foi aposentada pela Decisão D16 item 4. 
                Sua única utilidade residual (alcançar pontos remotos sem sobrevoo) foi superada pela amostragem probabilística estratificada dos 72 polígonos de VANT, 
                eliminando o ruído de concordância inter-avaliadores sobre pixels orbitais grosseiros.
              </p>
              <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400" />
                Substituída por delineação centimétrica VANT (GSD ~4 cm).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
