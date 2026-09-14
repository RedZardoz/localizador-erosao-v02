"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Globe,
  Search,
  Check,
  Layers,
  MapPin,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  RefreshCw,
  ChevronDown,
  Navigation,
} from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import {
  listarEstadosIbge,
  listarMunicipiosPorUf,
  obterMalhaEstadoGeoJson,
  obterMalhaMunicipioGeoJson,
  EstadoIbge,
  MunicipioIbge,
} from "@/lib/localizacao/municipio";
import { PARANA_BASINS_GEOJSON } from "@/lib/localizacao/bacias";
import type { AreaEstudo } from "@/types/ui";
import * as toGeoJSON from "@tmcw/togeojson";

export const RegionRequestModal: React.FC = () => {
  const {
    modalAtiva,
    setModalAtiva,
    areas,
    adicionarArea,
    removerArea,
    alternarAreaAtiva,
    setMapState,
  } = useSarelStore();

  const [abaAtiva, setAbaAtiva] = useState<"territorio" | "bacias" | "upload">(
    "territorio"
  );

  // Estados & Municípios (IBGE)
  const [estados, setEstados] = useState<EstadoIbge[]>([]);
  const [ufSelecionada, setUfSelecionada] = useState<string>("PR");
  const [carregandoEstados, setCarregandoEstados] = useState(false);

  const [municipios, setMunicipios] = useState<MunicipioIbge[]>([]);
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);
  const [municipioSelecionadoId, setMunicipioSelecionadoId] = useState<string>("");
  const [buscaMunicipio, setBuscaMunicipio] = useState("");

  // Processando adições
  const [carregandoEstadoTodo, setCarregandoEstadoTodo] = useState(false);
  const [carregandoMunAdicao, setCarregandoMunAdicao] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(
    null
  );

  // 1. Carrega lista de todos os 27 Estados via IBGE
  useEffect(() => {
    let ativo = true;
    if (modalAtiva === "region" && estados.length === 0) {
      setCarregandoEstados(true);
      listarEstadosIbge()
        .then((dados) => {
          if (ativo) {
            setEstados(dados);
            setCarregandoEstados(false);
          }
        })
        .catch(() => {
          if (ativo) {
            // Fallback com estados principais se a rede falhar
            setEstados([
              { id: 41, sigla: "PR", nome: "Paraná" },
              { id: 35, sigla: "SP", nome: "São Paulo" },
              { id: 31, sigla: "MG", nome: "Minas Gerais" },
              { id: 43, sigla: "RS", nome: "Rio Grande do Sul" },
              { id: 42, sigla: "SC", nome: "Santa Catarina" },
              { id: 51, sigla: "MT", nome: "Mato Grosso" },
              { id: 50, sigla: "MS", nome: "Mato Grosso do Sul" },
              { id: 52, sigla: "GO", nome: "Goiás" },
              { id: 29, sigla: "BA", nome: "Bahia" },
            ]);
            setCarregandoEstados(false);
          }
        });
    }
    return () => {
      ativo = false;
    };
  }, [modalAtiva, estados.length]);

  // 2. Carrega municípios do Estado selecionado via IBGE
  useEffect(() => {
    let ativo = true;
    if (modalAtiva === "region" && ufSelecionada) {
      setCarregandoMunicipios(true);
      setMunicipioSelecionadoId("");
      setBuscaMunicipio("");
      listarMunicipiosPorUf(ufSelecionada)
        .then((dados) => {
          if (ativo) {
            setMunicipios(dados);
            setCarregandoMunicipios(false);
          }
        })
        .catch((err) => {
          if (ativo) {
            console.error("Erro ao listar municípios:", err);
            setMunicipios([]);
            setCarregandoMunicipios(false);
          }
        });
    }
    return () => {
      ativo = false;
    };
  }, [modalAtiva, ufSelecionada]);

  if (modalAtiva !== "region") return null;

  // Filtragem dos municípios pesquisáveis no dropdown
  const municipiosFiltrados = municipios.filter((m) =>
    m.nome.toLowerCase().includes(buscaMunicipio.toLowerCase())
  );

  // AÇÃO 1: Selecionar o Estado Todo como Área de Coleta
  const handleSelecionarEstadoTodo = async () => {
    setCarregandoEstadoTodo(true);
    setFeedback(null);
    try {
      const estObj = estados.find((e) => e.sigla === ufSelecionada) || {
        nome: ufSelecionada,
        sigla: ufSelecionada,
      };

      const geojson = await obterMalhaEstadoGeoJson(ufSelecionada);
      if (geojson && geojson.type === "FeatureCollection") {
        const feature = (geojson as GeoJSON.FeatureCollection).features[0];
        if (
          feature &&
          (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")
        ) {
          const areaId = `estado-${ufSelecionada.toLowerCase()}`;
          const novaArea: AreaEstudo = {
            id: areaId,
            nome: `Estado de ${estObj.nome} (${estObj.sigla})`,
            tipo: "estado",
            codigoIbge: ufSelecionada,
            ativa: true,
            cor: "#059669",
            geometry: feature.geometry as any,
          };
          adicionarArea(novaArea);
          setFeedback({
            tipo: "sucesso",
            texto: `Área completa do ${estObj.nome} adicionada e ativada na tela para coleta!`,
          });
        }
      }
    } catch (e: any) {
      setFeedback({
        tipo: "erro",
        texto: e.message || "Erro ao baixar malha do estado no IBGE.",
      });
    } finally {
      setCarregandoEstadoTodo(false);
    }
  };

  // AÇÃO 2: Adicionar Município Selecionado via Dropdown
  const handleAdicionarMunicipio = async () => {
    if (!municipioSelecionadoId) return;
    const mun = municipios.find((m) => String(m.id) === String(municipioSelecionadoId));
    if (!mun) return;

    setCarregandoMunAdicao(true);
    setFeedback(null);
    try {
      const geojson = await obterMalhaMunicipioGeoJson(mun.id);
      if (geojson && geojson.type === "FeatureCollection") {
        const feature = (geojson as GeoJSON.FeatureCollection).features[0];
        if (
          feature &&
          (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")
        ) {
          const areaId = `mun-${mun.id}`;
          const novaArea: AreaEstudo = {
            id: areaId,
            nome: `${mun.nome} (${ufSelecionada})`,
            tipo: "municipio",
            codigoIbge: String(mun.id),
            ativa: true,
            cor: "#06B6D4",
            geometry: feature.geometry as any,
          };
          adicionarArea(novaArea);
          setFeedback({
            tipo: "sucesso",
            texto: `Município de ${mun.nome} adicionado com sucesso!`,
          });
        }
      }
    } catch (e: any) {
      setFeedback({
        tipo: "erro",
        texto: e.message || "Erro ao obter malha do município no IBGE.",
      });
    } finally {
      setCarregandoMunAdicao(false);
    }
  };

  // AÇÃO 3: Selecionar Bacia Hidrográfica
  const selecionarBacia = (baciaFeature: any) => {
    const props = baciaFeature.properties;
    const areaId = `bacia-${baciaFeature.id || props.code}`;
    const novaArea: AreaEstudo = {
      id: areaId,
      nome: props.name,
      tipo: "bacia",
      areaKm2: props.area_km2,
      ativa: true,
      cor: props.color || "#0284C7",
      geometry: baciaFeature.geometry,
    };
    adicionarArea(novaArea);
    setFeedback({
      tipo: "sucesso",
      texto: `${props.name} adicionada como área ativa!`,
    });
  };

  // AÇÃO 4: Importar Arquivo de Polígono (GeoJSON ou KML)
  const handleUploadPoligono = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFeedback(null);
    const fileName = file.name;
    const extensao = fileName.split(".").pop()?.toLowerCase();

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let geojson: GeoJSON.FeatureCollection | null = null;
        const text = event.target?.result as string;

        if (extensao === "geojson" || extensao === "json") {
          const parsed = JSON.parse(text);
          if (parsed.type === "FeatureCollection") {
            geojson = parsed;
          } else if (parsed.type === "Feature") {
            geojson = { type: "FeatureCollection", features: [parsed] };
          } else if (parsed.type === "Polygon" || parsed.type === "MultiPolygon") {
            geojson = {
              type: "FeatureCollection",
              features: [{ type: "Feature", properties: {}, geometry: parsed }],
            };
          }
        } else if (extensao === "kml") {
          const dom = new DOMParser().parseFromString(text, "text/xml");
          const converted = toGeoJSON.kml(dom);
          if (converted && converted.features && converted.features.length > 0) {
            geojson = converted as GeoJSON.FeatureCollection;
          } else {
            throw new Error("Não foi possível encontrar geometrias válidas no arquivo KML.");
          }
        } else {
          throw new Error("Formato não suportado. Por favor use .geojson, .json ou .kml");
        }

        if (!geojson || geojson.features.length === 0) {
          throw new Error("O arquivo não contém geometrias vetoriais válidas.");
        }

        let adicionados = 0;
        geojson.features.forEach((feat, index) => {
          if (
            feat.geometry &&
            (feat.geometry.type === "Polygon" || feat.geometry.type === "MultiPolygon")
          ) {
            const nomePropriedade =
              (feat.properties && (feat.properties.name || feat.properties.nome || feat.properties.rotulo)) ||
              `${fileName.replace(/\.[^/.]+$/, "")} #${index + 1}`;

            const novaArea: AreaEstudo = {
              id: `custom-${Date.now()}-${index}`,
              nome: nomePropriedade,
              tipo: "customizado",
              ativa: true,
              cor: "#8B5CF6",
              geometry: feat.geometry as any,
            };
            adicionarArea(novaArea);
            adicionados++;
          }
        });

        if (adicionados > 0) {
          setFeedback({
            tipo: "sucesso",
            texto: `${adicionados} ${adicionados === 1 ? "polígono importado" : "polígonos importados"} com sucesso!`,
          });
        } else {
          throw new Error("Nenhum polígono (Polygon/MultiPolygon) encontrado no arquivo.");
        }
      } catch (err: any) {
        setFeedback({
          tipo: "erro",
          texto: err.message || "Erro ao processar arquivo vetorial.",
        });
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Definir Área de Estudo &amp; Delimitação para Coleta (AOI)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Selecione por Estado, Município, Microbacias ou importe polígonos próprios
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalAtiva(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gerenciador de Áreas Cadastradas com Checkboxes (Ativar/Desativar) */}
        <div className="p-4 bg-slate-100/80 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Áreas Cadastradas na Tela ({areas.length})
            </span>
            <span className="text-[11px] text-slate-500">
              Ative ou desative áreas para compor a máscara da nova coleta
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
            {areas.map((area) => (
              <div
                key={area.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  area.ativa
                    ? "bg-white dark:bg-slate-900 border-emerald-500/60 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800 opacity-60"
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer truncate mr-2">
                  <input
                    type="checkbox"
                    checked={area.ativa}
                    onChange={() => alternarAreaAtiva(area.id)}
                    className="accent-emerald-600 h-4 w-4 rounded cursor-pointer"
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: area.cor || "#10B981" }}
                  />
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {area.nome}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize font-mono">
                      {area.tipo} {area.areaKm2 ? `• ${area.areaKm2.toLocaleString("pt-BR")} km²` : ""}
                    </span>
                  </div>
                </label>

                <button
                  onClick={() => removerArea(area.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer shrink-0 transition-colors"
                  title="Remover área da tela"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Abas para Novas Áreas */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => {
              setAbaAtiva("territorio");
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === "territorio"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Estado &amp; Municípios (IBGE)
          </button>
          <button
            onClick={() => {
              setAbaAtiva("bacias");
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === "bacias"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            Microbacias Hidrográficas
          </button>
          <button
            onClick={() => {
              setAbaAtiva("upload");
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === "upload"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Importar Polígono (GeoJSON / KML)
          </button>
        </div>

        {/* Mensagem de Feedback */}
        {feedback && (
          <div
            className={`mx-5 mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
              feedback.tipo === "sucesso"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {feedback.tipo === "sucesso" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.texto}</span>
          </div>
        )}

        {/* Conteúdo das Abas */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* ABA 1: ESTADO & MUNICÍPIOS (DROPDOWNS) */}
          {abaAtiva === "territorio" && (
            <div className="space-y-4">
              {/* 1. SELETOR DE ESTADO */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    1. Estado (Unidade Federativa)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">IBGE Localidades</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <select
                      value={ufSelecionada}
                      onChange={(e) => setUfSelecionada(e.target.value)}
                      disabled={carregandoEstados}
                      className="w-full h-10 px-3 pr-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                    >
                      {estados.map((e) => (
                        <option key={e.sigla} value={e.sigla}>
                          {e.nome} ({e.sigla})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Botão de Selecionar o Estado Todo Apenas */}
                  <button
                    onClick={handleSelecionarEstadoTodo}
                    disabled={carregandoEstadoTodo}
                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    title="Baixa a malha vetorial do estado todo e adiciona como área de amostragem"
                  >
                    {carregandoEstadoTodo ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )}
                    <span>Selecionar o Estado Todo como Área</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Dica: Para selecionar o estado todo apenas, clique no botão acima. Para restringir a municípios, utilize o campo abaixo.
                </p>
              </div>

              {/* 2. SELETOR DE MUNICÍPIO */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    2. Município de {ufSelecionada}
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {municipios.length} municípios disponíveis
                  </span>
                </div>

                {/* Filtro rápido / Busca do Município */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <select
                      value={municipioSelecionadoId}
                      onChange={(e) => setMunicipioSelecionadoId(e.target.value)}
                      disabled={carregandoMunicipios || municipios.length === 0}
                      className="w-full h-10 px-3 pr-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                    >
                      <option value="">Selecione um município...</option>
                      {municipiosFiltrados.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome} (IBGE: {m.id})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  <button
                    onClick={handleAdicionarMunicipio}
                    disabled={!municipioSelecionadoId || carregandoMunAdicao}
                    className="h-10 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {carregandoMunAdicao ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Adicionar Município</span>
                  </button>
                </div>

                {/* Busca rápida com digitação */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={buscaMunicipio}
                    onChange={(e) => setBuscaMunicipio(e.target.value)}
                    placeholder={`Filtrar nome do município em ${ufSelecionada}...`}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: MICROBACIAS HIDROGRÁFICAS */}
          {abaAtiva === "bacias" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Bacias Hidrográficas do Estado ({PARANA_BASINS_GEOJSON.features.length})</span>
                <span className="font-mono text-[10px]">Fonte Oficial: IAT / SUDERHSA</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PARANA_BASINS_GEOJSON.features.map((f) => {
                  const areaId = `bacia-${f.id || f.properties.code}`;
                  const jaAdicionado = areas.some((a) => a.id === areaId);

                  return (
                    <button
                      key={f.id}
                      disabled={jaAdicionado}
                      onClick={() => selecionarBacia(f)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        jaAdicionado
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 opacity-70"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500 shadow-sm"
                      }`}
                    >
                      <div className="space-y-0.5 truncate mr-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: f.properties.color || "#0284C7" }}
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                            {f.properties.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {f.properties.area_km2.toLocaleString("pt-BR")} km² • Código: {f.properties.code}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {f.properties.mainCities}
                        </span>
                      </div>

                      {jaAdicionado ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                          + Adicionar
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA 3: IMPORTAÇÃO DE POLÍGONO EXTERNO */}
          {abaAtiva === "upload" && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 rounded-2xl bg-slate-50 dark:bg-slate-950 cursor-pointer transition-colors group">
                <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-purple-500 transition-colors" />
                <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  Clique ou arraste um arquivo vetorial da sua área
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Formatos aceitos: <strong>.geojson</strong>, <strong>.json</strong> ou <strong>.kml</strong> (WGS84)
                </span>
                <input
                  type="file"
                  accept=".geojson,.json,.kml"
                  onChange={handleUploadPoligono}
                  className="hidden"
                />
              </label>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Instruções de Importação:
                </span>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>O polígono importado permanecerá desenhado na tela como uma área de estudo ativa.</li>
                  <li>Você pode importar múltiplos talhões ou limites de propriedades rurais.</li>
                  <li>Todas as áreas ativas serão usadas como máscara de amostragem na eleição do GEE.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <span className="text-[11px] text-slate-500 font-mono">
            {areas.filter((a) => a.ativa).length} de {areas.length} áreas ativas para amostragem
          </span>
          <button
            onClick={() => setModalAtiva(null)}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 cursor-pointer"
          >
            Concluir &amp; Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
