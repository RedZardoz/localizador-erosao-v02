"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSarelStore, AoiDefinicao } from "@/store/useSarelStore";
import {
  Globe,
  Landmark,
  MapPin,
  Search,
  Sparkles,
  Upload,
  X,
  ChevronDown,
  Check,
  PlusCircle,
  Loader2,
  Waves,
} from "lucide-react";
import { ESTADOS_BRASIL, EstadoBrasil, obterEstadoPorSigla } from "@/lib/dados/estadosBrasil";
import {
  listarMunicipiosPorUf,
  obterMalhaMunicipioGeoJson,
  obterMalhaEstadoGeoJson,
  extrairBboxGeoJson,
  MunicipioIbge,
} from "@/lib/ibge/ibgeService";

const MACROBACIAS_PARANA: { nome: string; bbox: [number, number, number, number]; descricao: string }[] = [
  { nome: "Bacia do Rio Tibagi", bbox: [-51.50, -25.40, -50.10, -22.80], descricao: "Eixo geomorfológico central dos Campos Gerais e Terceiro Planalto" },
  { nome: "Bacia do Rio Paranapanema", bbox: [-53.80, -23.40, -49.50, -22.50], descricao: "Fronteira norte com São Paulo e solos arenosos/argilosos" },
  { nome: "Bacia do Rio Ivaí", bbox: [-54.00, -25.10, -51.20, -23.20], descricao: "Zona de transição Terceiro Planalto / Arenito Caiuá" },
  { nome: "Bacia do Rio Piquiri", bbox: [-54.40, -25.00, -52.40, -24.00], descricao: "Sudoeste / Oeste Paranaense com agricultura intensiva de grãos" },
  { nome: "Bacia do Paraná 3", bbox: [-54.60, -25.60, -53.80, -24.10], descricao: "Vertente do Lago de Itaipu e solos vulcânicos férteis" },
  { nome: "Bacia do Rio Iguaçu", bbox: [-54.60, -26.30, -48.90, -25.20], descricao: "Região Centro-Sul e Metropolitana de Curitiba" },
];

export function RegionRequestModal() {
  const { aoiAtiva, definirAoiAtiva, fecharModal, abrirModal } = useSarelStore();

  const [abaAtiva, setAbaAtiva] = useState<"ibge" | "predefinidas" | "upload" | "pedido">("ibge");
  const [modoIbge, setModoIbge] = useState<"estado" | "municipio">("municipio");

  // Estado e Município selecionados no formulário
  const [estadoSelecionado, setEstadoSelecionado] = useState<EstadoBrasil | null>(() => {
    return obterEstadoPorSigla(aoiAtiva.uf || "PR") || ESTADOS_BRASIL.find((e) => e.sigla === "PR") || null;
  });
  const [municipiosLista, setMunicipiosLista] = useState<MunicipioIbge[]>([]);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<MunicipioIbge | null>(null);

  const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);
  const [carregandoMalha, setCarregandoMalha] = useState(false);
  const [buscaMunicipio, setBuscaMunicipio] = useState("");
  const [dropdownMunicipiosAberto, setDropdownMunicipiosAberto] = useState(false);

  // Pedido de região personalizada
  const [pedidoNome, setPedidoNome] = useState("");
  const [pedidoCoordenadas, setPedidoCoordenadas] = useState("");
  const [pedidoEnviado, setPedidoEnviado] = useState(false);

  // Carregar municípios sempre que o estado mudar
  useEffect(() => {
    if (!estadoSelecionado) {
      setMunicipiosLista([]);
      setMunicipioSelecionado(null);
      return;
    }

    let cancelado = false;
    setCarregandoMunicipios(true);
    setMunicipioSelecionado(null);
    setBuscaMunicipio("");

    listarMunicipiosPorUf(estadoSelecionado.sigla)
      .then((data) => {
        if (!cancelado) {
          setMunicipiosLista(data);
          // Se o aoiAtiva atual for do mesmo estado, tenta selecionar o município ativo
          if (aoiAtiva.tipo === "municipio" && aoiAtiva.codigoIbge) {
            const munAtual = data.find((m) => String(m.id) === String(aoiAtiva.codigoIbge));
            if (munAtual) {
              setMunicipioSelecionado(munAtual);
            }
          }
        }
      })
      .catch((err) => {
        console.error("Erro ao listar municípios:", err);
      })
      .finally(() => {
        if (!cancelado) setCarregandoMunicipios(false);
      });

    return () => {
      cancelado = true;
    };
  }, [estadoSelecionado, aoiAtiva.tipo, aoiAtiva.codigoIbge]);

  // Municípios filtrados pela busca
  const municipiosFiltrados = useMemo(() => {
    if (!buscaMunicipio.trim()) return municipiosLista;
    const buscaNorm = buscaMunicipio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return municipiosLista.filter((m) =>
      m.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(buscaNorm)
    );
  }, [municipiosLista, buscaMunicipio]);

  // Ação: aplicar limite do município
  async function aplicarLimiteMunicipio() {
    if (!municipioSelecionado || !estadoSelecionado) return;
    setCarregandoMalha(true);

    try {
      const geojson = await obterMalhaMunicipioGeoJson(municipioSelecionado.id);
      const bbox = extrairBboxGeoJson(geojson);

      const novaAoi: AoiDefinicao = {
        tipo: "municipio",
        nome: `Município de ${municipioSelecionado.nome} - ${estadoSelecionado.sigla}`,
        codigoIbge: String(municipioSelecionado.id),
        uf: estadoSelecionado.sigla,
        nomeEstado: estadoSelecionado.nome,
        bbox,
        geojson,
      };

      definirAoiAtiva(novaAoi);
      fecharModal();
    } catch (err: any) {
      console.error("Erro ao carregar malha do município:", err);
      // Fallback usando BBox aproximada do estado com centro estimado
      const novaAoi: AoiDefinicao = {
        tipo: "municipio",
        nome: `Município de ${municipioSelecionado.nome} - ${estadoSelecionado.sigla}`,
        codigoIbge: String(municipioSelecionado.id),
        uf: estadoSelecionado.sigla,
        nomeEstado: estadoSelecionado.nome,
        bbox: estadoSelecionado.bbox,
      };
      definirAoiAtiva(novaAoi);
      fecharModal();
    } finally {
      setCarregandoMalha(false);
    }
  }

  // Ação: aplicar limite do estado
  async function aplicarLimiteEstado() {
    if (!estadoSelecionado) return;
    setCarregandoMalha(true);

    try {
      const geojson = await obterMalhaEstadoGeoJson(estadoSelecionado.id);
      const bbox = extrairBboxGeoJson(geojson);

      const novaAoi: AoiDefinicao = {
        tipo: "estado",
        nome: `${estadoSelecionado.nome} (${estadoSelecionado.sigla}) — Limite Oficial IBGE`,
        codigoIbge: String(estadoSelecionado.id),
        uf: estadoSelecionado.sigla,
        nomeEstado: estadoSelecionado.nome,
        bbox: bbox || estadoSelecionado.bbox,
        geojson,
      };

      definirAoiAtiva(novaAoi);
      fecharModal();
    } catch (err: any) {
      console.error("Erro ao carregar malha do estado:", err);
      const novaAoi: AoiDefinicao = {
        tipo: "estado",
        nome: `${estadoSelecionado.nome} (${estadoSelecionado.sigla}) — Limite Oficial IBGE`,
        codigoIbge: String(estadoSelecionado.id),
        uf: estadoSelecionado.sigla,
        nomeEstado: estadoSelecionado.nome,
        bbox: estadoSelecionado.bbox,
      };
      definirAoiAtiva(novaAoi);
      fecharModal();
    } finally {
      setCarregandoMalha(false);
    }
  }

  // Ação: Triar candidatos GEE para a área selecionada
  async function triarCandidatosGee() {
    if (modoIbge === "municipio" && municipioSelecionado) {
      await aplicarLimiteMunicipio();
      abrirModal("candidate");
    } else if (modoIbge === "estado" && estadoSelecionado) {
      await aplicarLimiteEstado();
      abrirModal("candidate");
    } else {
      abrirModal("candidate");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-slate-700/60 bg-[#0c1424] text-slate-100 shadow-2xl overflow-hidden">
        {/* 1. Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800/90 px-6 py-4 bg-[#0e172b]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Seleção de Regiões &amp; Área de Interesse (AOI)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Delimite por estado, município, polígono próprio ou regiões predefinidas em todo o Brasil
              </p>
            </div>
          </div>
          <button
            onClick={fecharModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. Abas de Seleção */}
        <div className="border-b border-slate-800 px-6 pt-2 bg-[#0c1424]">
          <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setAbaAtiva("ibge")}
              className={`flex items-center gap-2 border-b-2 px-1 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
                abaAtiva === "ibge"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Landmark className="h-4 w-4" />
              Estado / Município
            </button>
            <button
              onClick={() => setAbaAtiva("predefinidas")}
              className={`flex items-center gap-2 border-b-2 px-1 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
                abaAtiva === "predefinidas"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="h-4 w-4" />
              Regiões Predefinidas
            </button>
            <button
              onClick={() => setAbaAtiva("upload")}
              className={`flex items-center gap-2 border-b-2 px-1 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
                abaAtiva === "upload"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Upload className="h-4 w-4" />
              Subir Polígono (AOI)
            </button>
          </div>

          {/* Ação secundária: Adicionar Pedido de Região */}
          <div className="pt-2 pb-2">
            <button
              onClick={() => setAbaAtiva("pedido")}
              className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors ${
                abaAtiva === "pedido" ? "text-cyan-400 font-bold" : "text-slate-400 hover:text-cyan-300"
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Adicionar Pedido de Região</span>
            </button>
          </div>
        </div>

        {/* 3. Conteúdo das Abas */}
        <div className="p-6 space-y-4 max-h-[460px] overflow-y-auto custom-scrollbar">
          {/* ABA 1: ESTADO / MUNICÍPIO (IBGE) */}
          {abaAtiva === "ibge" && (
            <div className="space-y-4">
              {/* Card Explicativo com Ícone Institucional */}
              <div className="flex items-start gap-3.5 rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 mt-0.5">
                  <Landmark className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <h3 className="font-bold text-white text-xs">Limite Territorial Oficial (IBGE)</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Escolha um estado ou município brasileiro — o limite geográfico oficial (malha territorial do IBGE)
                    é usado para recortar quais focos entram na triagem, da mesma forma que um polígono próprio.
                  </p>
                </div>
              </div>

              {/* Botões Segmentados: Por Estado / Por Município */}
              <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setModoIbge("estado")}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all text-center ${
                    modoIbge === "estado"
                      ? "bg-cyan-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Por Estado
                </button>
                <button
                  type="button"
                  onClick={() => setModoIbge("municipio")}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all text-center ${
                    modoIbge === "municipio"
                      ? "bg-cyan-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Por Município
                </button>
              </div>

              {/* Seleção do Estado (UF) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Estado (UF)</label>
                <div className="relative">
                  <select
                    value={estadoSelecionado?.sigla || ""}
                    onChange={(e) => {
                      const est = obterEstadoPorSigla(e.target.value);
                      setEstadoSelecionado(est || null);
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-3.5 pr-10 text-xs text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="" disabled>
                      Selecione um estado
                    </option>
                    {ESTADOS_BRASIL.map((est) => (
                      <option key={est.sigla} value={est.sigla}>
                        {est.nome} ({est.sigla}) · Região {est.regiao}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-3 h-4 w-4 pointer-events-none text-slate-400" />
                </div>
              </div>

              {/* Seleção de Município (se modo === 'municipio') */}
              {modoIbge === "municipio" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Município</label>
                    {carregandoMunicipios && (
                      <span className="flex items-center gap-1 text-[11px] text-cyan-400">
                        <Loader2 className="h-3 w-3 animate-spin" /> Carregando municípios do IBGE...
                      </span>
                    )}
                    {!carregandoMunicipios && estadoSelecionado && municipiosLista.length > 0 && (
                      <span className="text-[11px] text-slate-400">
                        {municipiosLista.length} municípios em {estadoSelecionado.sigla}
                      </span>
                    )}
                  </div>

                  {!estadoSelecionado ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 py-2.5 text-xs text-slate-500">
                      Selecione um estado primeiro
                    </div>
                  ) : (
                    <div className="relative space-y-2">
                      {/* Campo de Busca & Seleção Dinâmica */}
                      <div className="relative">
                        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder={
                            municipioSelecionado
                              ? `${municipioSelecionado.nome} (digite para trocar...)`
                              : `Buscar município em ${estadoSelecionado.nome}...`
                          }
                          value={buscaMunicipio}
                          onFocus={() => setDropdownMunicipiosAberto(true)}
                          onChange={(e) => {
                            setBuscaMunicipio(e.target.value);
                            setDropdownMunicipiosAberto(true);
                          }}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>

                      {/* Dropdown com Lista de Municípios Filtrados */}
                      {dropdownMunicipiosAberto && (
                        <div className="rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                          {municipiosFiltrados.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">
                              Nenhum município encontrado com &quot;{buscaMunicipio}&quot;
                            </div>
                          ) : (
                            municipiosFiltrados.map((m) => {
                              const selecionado = municipioSelecionado?.id === m.id;
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setMunicipioSelecionado(m);
                                    setDropdownMunicipiosAberto(false);
                                    setBuscaMunicipio("");
                                  }}
                                  className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                                    selecionado
                                      ? "bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60"
                                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                  }`}
                                >
                                  <span>{m.nome}</span>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <span>IBGE: {m.id}</span>
                                    {selecionado && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}

                      {/* Badge do Município Atualmente Selecionado */}
                      {municipioSelecionado && !dropdownMunicipiosAberto && (
                        <div className="flex items-center justify-between rounded-xl border border-cyan-500/40 bg-cyan-950/20 px-3 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-cyan-400" />
                            <span className="font-bold text-white">
                              {municipioSelecionado.nome} ({estadoSelecionado.sigla})
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-cyan-300">
                            Código IBGE: {municipioSelecionado.id}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Botão de Aplicação Principal */}
              <div>
                {modoIbge === "municipio" ? (
                  <button
                    type="button"
                    onClick={aplicarLimiteMunicipio}
                    disabled={!municipioSelecionado || carregandoMalha}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                      municipioSelecionado && !carregandoMalha
                        ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/60"
                        : "bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                    }`}
                  >
                    {carregandoMalha ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Carregando malha oficial do IBGE...
                      </>
                    ) : (
                      <>
                        <Landmark className="h-4 w-4" /> Usar limite do município selecionado
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={aplicarLimiteEstado}
                    disabled={!estadoSelecionado || carregandoMalha}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                      estadoSelecionado && !carregandoMalha
                        ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/60"
                        : "bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                    }`}
                  >
                    {carregandoMalha ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Carregando malha estadual do IBGE...
                      </>
                    ) : (
                      <>
                        <Landmark className="h-4 w-4" /> Usar limite do estado selecionado
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Banner GEE: Amostragem e Triagem sob Medida */}
              <div className="flex items-center justify-between rounded-xl border border-indigo-500/40 bg-indigo-950/30 p-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
                  <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Deseja gerar candidatos reais de visita de campo para este limite via GEE?</span>
                </div>
                <button
                  type="button"
                  onClick={triarCandidatosGee}
                  disabled={carregandoMalha}
                  className="shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-950/50 transition-all"
                >
                  Triar Candidatos GEE
                </button>
              </div>

              {/* Nota de rodapé oficial */}
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Fonte: malhas territoriais oficiais do IBGE (servicodados.ibge.gov.br). O recorte se aplica sobre os
                pontos carregados e delimita a Área de Interesse para amostragem no Earth Engine.
              </p>
            </div>
          )}

          {/* ABA 2: REGIÕES PREDEFINIDAS */}
          {abaAtiva === "predefinidas" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Selecione uma das macrobacias hidrográficas consolidadas do Paraná como recorte espacial contínuo:
              </p>
              <div className="space-y-2">
                {MACROBACIAS_PARANA.map((b) => {
                  const ativo = aoiAtiva.nome === b.nome;
                  return (
                    <button
                      key={b.nome}
                      type="button"
                      onClick={() => {
                        definirAoiAtiva({
                          tipo: "bacia",
                          nome: b.nome,
                          uf: "PR",
                          bbox: b.bbox,
                        });
                        fecharModal();
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        ativo
                          ? "border-cyan-500 bg-cyan-950/30 text-white"
                          : "border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Waves className="h-3.5 w-3.5 text-cyan-400" />
                          {b.nome}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{b.descricao}</p>
                      </div>
                      {ativo && <Check className="h-4 w-4 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA 3: SUBIR POLÍGONO (AOI) */}
          {abaAtiva === "upload" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/20 p-8 text-center">
                <Upload className="h-10 w-10 text-cyan-400 mb-2" />
                <h3 className="text-sm font-bold text-white">Carregar Polígono de Estudo</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Arraste e solte arquivos <b>.geojson</b>, <b>.kml</b> ou <b>.zip (Shapefile)</b> contendo os limites de sua bacia ou fazenda experimental
                </p>
                <input
                  type="file"
                  accept=".geojson,.json,.kml,.zip"
                  className="hidden"
                  id="input-vetor-upload-modal"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const parsed = JSON.parse(event.target?.result as string);
                          const bbox = extrairBboxGeoJson(parsed);
                          definirAoiAtiva({
                            tipo: "talhao",
                            nome: `Vetor: ${file.name.replace(/\.[^/.]+$/, "")}`,
                            bbox,
                            geojson: parsed,
                          });
                          fecharModal();
                        } catch {
                          definirAoiAtiva({
                            tipo: "talhao",
                            nome: `Vetor: ${file.name}`,
                            bbox: [-51.5, -25.0, -50.5, -24.0],
                          });
                          fecharModal();
                        }
                      };
                      if (file.name.endsWith(".json") || file.name.endsWith(".geojson")) {
                        reader.readAsText(file);
                      } else {
                        definirAoiAtiva({
                          tipo: "talhao",
                          nome: `Vetor: ${file.name}`,
                          bbox: [-51.5, -25.0, -50.5, -24.0],
                        });
                        fecharModal();
                      }
                    }
                  }}
                />
                <label
                  htmlFor="input-vetor-upload-modal"
                  className="mt-4 cursor-pointer rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-cyan-400 border border-slate-700 hover:bg-slate-700 transition-colors"
                >
                  Selecionar Arquivo Vetorial
                </label>
              </div>
            </div>
          )}

          {/* ABA 4: ADICIONAR PEDIDO DE REGIÃO */}
          {abaAtiva === "pedido" && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-cyan-400" />
                  Solicitar Cadastro de Região ou Coordenadas Específicas
                </h3>
                <p className="text-[11px] text-slate-400">
                  Informe o nome da localidade, bacia experimental ou coordenadas de delimitação (Bounding Box ou centróide)
                  para processamento no cluster GEE:
                </p>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Nome da Área / Experimento:</label>
                  <input
                    type="text"
                    placeholder="Ex: Microbacia Faxinal dos Guedes / Fazenda Guatambu"
                    value={pedidoNome}
                    onChange={(e) => setPedidoNome(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Coordenadas ou Bounding Box:</label>
                  <input
                    type="text"
                    placeholder="Ex: -52.45, -24.12, -52.20, -23.95 (minLng, minLat, maxLng, maxLat)"
                    value={pedidoCoordenadas}
                    onChange={(e) => setPedidoCoordenadas(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {pedidoEnviado ? (
                  <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/60 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>Pedido de região registrado com sucesso! Área enquadrada.</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!pedidoNome.trim()) return;
                      const partes = pedidoCoordenadas.split(",").map((p) => parseFloat(p.trim())).filter((n) => !isNaN(n));
                      const bbox: [number, number, number, number] =
                        partes.length === 4
                          ? [partes[0], partes[1], partes[2], partes[3]]
                          : [-51.5, -25.0, -50.5, -24.0];

                      definirAoiAtiva({
                        tipo: "talhao",
                        nome: pedidoNome,
                        bbox,
                      });
                      setPedidoEnviado(true);
                      setTimeout(() => {
                        fecharModal();
                      }, 800);
                    }}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-colors"
                  >
                    Salvar Pedido de Região e Enquadrar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. Rodapé do Modal com Botão Fechar */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3.5 bg-[#0a101d]">
          <div className="text-xs">
            <span className="text-slate-400">Recorte atual no sistema: </span>
            <span className="font-bold text-cyan-300">{aoiAtiva.nome}</span>
          </div>
          <button
            type="button"
            onClick={fecharModal}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
