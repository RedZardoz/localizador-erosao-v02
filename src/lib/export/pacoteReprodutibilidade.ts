/**
 * ============================================================================
 * Pacote de Reprodutibilidade da Dissertação (Research Compendium) — SAREL
 * PPGTCA 2026 — Universidade Estadual de Londrina / UEM / UFPR
 * ============================================================================
 *
 * FUNDAMENTAÇÃO TEÓRICA NA LITERATURA INTERNACIONAL:
 * 1. Princípios FAIR (Wilkinson et al., 2016, Nature Scientific Data):
 *    Findable, Accessible, Interoperable, Reusable.
 * 2. Compêndio de Pesquisa (Marwick et al., 2018, The American Statistician):
 *    Empacotamento unificado de dados brutos, código executável e metadados.
 * 3. Reprodutibilidade Prática em Geociências (Nüst & Pebesma, 2021; Peng, 2011):
 *    Transparência algorítmica e controle de semente em modelos geoespaciais.
 * 4. Fichas de Dados para IA (Gebru et al., 2021, Communications of the ACM):
 *    Documentação padronizada de proveniência e restrições ético-legais.
 */

import JSZip from "jszip";
import type { PontoAmostral } from "@/types/ponto";
import type { RotuloConsolidado } from "@/types/rotulo";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";
import { montarMatrizTreino } from "@/lib/matriz/montagem";
import { assegurarSegregacaoTreino } from "@/lib/rotulos/ingestaoDrone";
import { calcularCorrelacaoPearson } from "@/lib/padraoOuro/validacaoMatricial";
import { formatToDMS } from "./dms";
import { valorOuNulo } from "@/types/proveniencia";
import { SCRIPT_AVALIACAO_D25, REQUIREMENTS_D25 } from "./scriptAvaliacaoD25.generated";
import { VERIFICADOR_INTEGRIDADE } from "./verificadorIntegridade.generated";

export interface ArquivosPacoteReprodutibilidade {
  matrizTreinamentoCsv: string;
  validacaoDroneCsv: string;
  confrontoRadiometricoCsv: string;
  datasheetJson: string;
  scriptPython: string;
  requirementsTxt: string;
  verificadorIntegridadePy: string;
  manifestoSha256Txt: string;
}

/**
 * Utilitário de escape para campos CSV.
 */
function escaparCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Calcula o hash criptográfico SHA-256 de uma string de texto.
 * Compatível tanto com Browser (crypto.subtle) quanto com Node.js (crypto module).
 */
export async function calcularSha256(conteudo: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(conteudo);

  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto?.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback para ambiente Node.js / testes
  try {
    const nodeCrypto = await import("crypto");
    return nodeCrypto.createHash("sha256").update(Buffer.from(data)).digest("hex");
  } catch {
    throw new Error("Mecanismo criptográfico SHA-256 não disponível no ambiente.");
  }
}

function formatarLinhaCensoProveniencia(
  rotulo: string,
  pontos: PontoAmostral[],
  extrator: (p: PontoAmostral) => { estado: string; causa?: string } | undefined,
  notaExtra?: string
): string {
  const total = pontos.length;
  let disponiveis = 0;
  const contagensEstado: Record<string, number> = {};
  const contagensCausa: Record<string, number> = {};

  for (const p of pontos) {
    const prov = extrator(p);
    if (!prov || prov.estado === "indisponivel") {
      const causa = prov?.causa ?? "nao-informado";
      if (!contagensCausa[causa]) contagensCausa[causa] = 0;
      contagensCausa[causa] += 1;
    } else {
      disponiveis += 1;
      if (!contagensEstado[prov.estado]) contagensEstado[prov.estado] = 0;
      contagensEstado[prov.estado] += 1;
    }
  }

  const segmentos: string[] = [];
  for (const [est, qtd] of Object.entries(contagensEstado)) {
    segmentos.push(`${est}=${qtd}`);
  }
  for (const [causa, qtd] of Object.entries(contagensCausa)) {
    segmentos.push(`indisponivel: ${causa}=${qtd}`);
  }
  if (notaExtra && disponiveis === 0) {
    segmentos.push(notaExtra);
  }

  const sufixo = segmentos.length > 0 ? ` | ${segmentos.join(" | ")}` : "";
  return `# ${rotulo}: ${disponiveis}/${total} disponiveis${sufixo}`;
}

/**
 * Gera o Arquivo 01: Matriz de Preditores Geoespaciais para Treinamento (CSV).
 * Deriva Classe_Alvo_Binaria, Rotulo_Classe, Rotulo_Modalidade e exclusões
 * estritamente da implementação canônica montarMatrizTreino (Regra 4).
 */
export function gerarCsvMatrizTreinamento(
  pontos: PontoAmostral[],
  rotulosConsolidados: Record<string, RotuloConsolidado>
): string {
  const resultadoMatriz = montarMatrizTreino(pontos, rotulosConsolidados, { modeloJanela: "D" });

  // Pós-condição de segregação held-out (Decisão D16 e Regra 4):
  assegurarSegregacaoTreino(resultadoMatriz.linhas, resultadoMatriz.heldOutDrone);
  for (const linhaTreino of resultadoMatriz.linhas) {
    if (linhaTreino.papelConjunto === "held-out") {
      throw new Error("VIOLAÇÃO DE SEGREGAÇÃO (D16): Ponto held-out detectado na matriz de treino.");
    }
  }

  const linhaPorPontoId = new Map(resultadoMatriz.linhas.map((l) => [l.pontoId, l]));
  const pontosEmitidos = pontos.filter((p) => linhaPorPontoId.has(p.id));

  let nSemRotulagem = 0;
  let nDivergencia = 0;
  for (const exc of resultadoMatriz.exclusoes) {
    if (exc.motivo.includes("Divergência")) {
      nDivergencia += 1;
    } else {
      nSemRotulagem += 1;
    }
  }

  let nErosao = 0;
  let nControle = 0;
  for (const l of resultadoMatriz.linhas) {
    if (l.classeAlvoBinaria === 1) {
      nErosao += 1;
    } else {
      nControle += 1;
    }
  }

  const linhasCsv: string[] = [];

  linhasCsv.push(`# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar`);
  linhasCsv.push(`# PPGTCA 2026 — Pesquisa de Mestrado (UEL / UEM / UFPR)`);
  linhasCsv.push(`# ARQUIVO 01: Matriz de Preditores Geoespaciais para Treinamento do Modelo Supervisionado`);
  linhasCsv.push(`# Princípios FAIR (Wilkinson et al., 2016) | Compêndio de Pesquisa (Marwick et al., 2018)`);
  linhasCsv.push(`# Emissão: ${new Date().toISOString()} | Total de Amostras Recebidas: ${pontos.length} | Emitidas: ${pontosEmitidos.length}`);
  linhasCsv.push(`# EXCLUSOES DE ROTULAGEM (Regra 4) — ${pontos.length} pontos recebidos, ${pontosEmitidos.length} emitidos`);
  linhasCsv.push(`# sem rotulagem=${nSemRotulagem} | divergencia sem desempate=${nDivergencia}`);
  linhasCsv.push(`# HELD-OUT DRONE (D16): ${resultadoMatriz.heldOutDrone.length} pontos excluidos`);
  linhasCsv.push(
    `# Classe_Alvo_Binaria: ${pontosEmitidos.length}/${pontosEmitidos.length} derivadas de observacao humana | erosao=${nErosao} | controle=${nControle}`
  );
  linhasCsv.push(`# CENSO DE PROVENIENCIA (Regra 3) — contagem sobre ${pontosEmitidos.length} pontos emitidos`);
  linhasCsv.push(formatarLinhaCensoProveniencia("RUSLE_Fator_R", pontosEmitidos, (p) => p.linhaDeBase?.fatorR, "D13"));
  linhasCsv.push(formatarLinhaCensoProveniencia("RUSLE_Fator_K", pontosEmitidos, (p) => p.linhaDeBase?.fatorK, "D08/D09"));
  linhasCsv.push(formatarLinhaCensoProveniencia("RUSLE_Fator_LS", pontosEmitidos, (p) => p.linhaDeBase?.fatorLS, "D15"));
  linhasCsv.push(formatarLinhaCensoProveniencia("RUSLE_Fator_C", pontosEmitidos, (p) => p.linhaDeBase?.fatorC));
  linhasCsv.push(formatarLinhaCensoProveniencia("RUSLE_Fator_P", pontosEmitidos, (p) => p.linhaDeBase?.fatorP));
  linhasCsv.push(
    formatarLinhaCensoProveniencia(
      "RUSLE_Perda_Solo_A",
      pontosEmitidos,
      (p) => p.linhaDeBase?.perdaSolo,
      "retido pelo Invariante 1"
    )
  );
  linhasCsv.push(formatarLinhaCensoProveniencia("Elevacao_m", pontosEmitidos, (p) => p.terreno?.elevacao));
  linhasCsv.push(formatarLinhaCensoProveniencia("Declividade_pct", pontosEmitidos, (p) => p.terreno?.declividadePct));
  linhasCsv.push(formatarLinhaCensoProveniencia("Curvatura_Perfil", pontosEmitidos, (p) => p.terreno?.curvaturaPerfil));
  linhasCsv.push(formatarLinhaCensoProveniencia("Curvatura_Plana", pontosEmitidos, (p) => p.terreno?.curvaturaPlana));
  linhasCsv.push(formatarLinhaCensoProveniencia("Acumulo_Fluxo", pontosEmitidos, (p) => p.terreno?.acumuloFluxo));
  linhasCsv.push(formatarLinhaCensoProveniencia("TWI", pontosEmitidos, (p) => p.terreno?.twi));
  linhasCsv.push(``);

  const colunas = [
    "Ponto_ID",
    "Codigo",
    "Latitude",
    "Longitude",
    "Latitude_DMS",
    "Longitude_DMS",
    "Municipio",
    "Codigo_IBGE",
    "Bacia_Hidrografica",
    "Bloco_Espacial",
    "Estrato_ID",
    "Elevacao_m",
    "Declividade_pct",
    "Declividade_graus",
    "Curvatura_Perfil",
    "Curvatura_Plana",
    "Acumulo_Fluxo",
    "TWI",
    "Ordem_Solo",
    "Erodibilidade_Classe",
    "RUSLE_Fator_K",
    "RUSLE_Fator_R",
    "RUSLE_Fator_LS",
    "RUSLE_Fator_C",
    "RUSLE_Fator_P",
    "Precip_Acum_30d_mm",
    "Precip_Acum_90d_mm",
    "I30_Max_mm_h",
    "N_Eventos_Erosivos",
    "Indice_Mecanismo_G2",
    "Frequencia_Solo_Nu",
    "Rotulo_Classe",
    "Rotulo_Modalidade",
    "Classe_Alvo_Binaria",
  ];

  linhasCsv.push(colunas.map(escaparCsv).join(","));

  for (const p of pontosEmitidos) {
    const linhaCanonica = linhaPorPontoId.get(p.id)!;
    if (linhaCanonica.papelConjunto === "held-out") {
      throw new Error("VIOLAÇÃO DE SEGREGAÇÃO (D16): Ponto held-out emitido na matriz de treino.");
    }

    const latDms = formatToDMS(p.latitude, true);
    const lngDms = formatToDMS(p.longitude, false);

    const row: Record<string, unknown> = {
      Ponto_ID: p.id,
      Codigo: p.codigo,
      Latitude: Number(p.latitude.toFixed(6)),
      Longitude: Number(p.longitude.toFixed(6)),
      Latitude_DMS: latDms,
      Longitude_DMS: lngDms,
      Municipio: valorOuNulo(p.localizacao?.municipio) ?? "",
      Codigo_IBGE: valorOuNulo(p.localizacao?.codigoIbge) ?? "",
      Bacia_Hidrografica: valorOuNulo(p.localizacao?.bacia) ?? "",
      Bloco_Espacial: p.blocoEspacial ?? "",
      Estrato_ID: p.estratoId,
      Elevacao_m: valorOuNulo(p.terreno?.elevacao) ?? "",
      Declividade_pct: valorOuNulo(p.terreno?.declividadePct) ?? "",
      Declividade_graus: valorOuNulo(p.terreno?.declividadeGraus) ?? "",
      Curvatura_Perfil: valorOuNulo(p.terreno?.curvaturaPerfil) ?? "",
      Curvatura_Plana: valorOuNulo(p.terreno?.curvaturaPlana) ?? "",
      Acumulo_Fluxo: valorOuNulo(p.terreno?.acumuloFluxo) ?? "",
      TWI: valorOuNulo(p.terreno?.twi) ?? "",
      Ordem_Solo: valorOuNulo(p.solo?.ordem) ?? "",
      Erodibilidade_Classe: valorOuNulo(p.solo?.erodibilidadeClasse) ?? "",
      RUSLE_Fator_K: valorOuNulo(p.linhaDeBase?.fatorK) ?? "",
      RUSLE_Fator_R: valorOuNulo(p.linhaDeBase?.fatorR) ?? "",
      RUSLE_Fator_LS: valorOuNulo(p.linhaDeBase?.fatorLS) ?? "",
      RUSLE_Fator_C: valorOuNulo(p.linhaDeBase?.fatorC) ?? "",
      RUSLE_Fator_P: valorOuNulo(p.linhaDeBase?.fatorP) ?? "",
      Precip_Acum_30d_mm: valorOuNulo(p.temporal?.D?.chuva?.precipAcum30d ?? p.temporal?.P?.chuva?.precipAcum30d) ?? "",
      Precip_Acum_90d_mm: valorOuNulo(p.temporal?.D?.chuva?.precipAcum90d ?? p.temporal?.P?.chuva?.precipAcum90d) ?? "",
      I30_Max_mm_h: valorOuNulo(p.temporal?.D?.chuva?.i30Max ?? p.temporal?.P?.chuva?.i30Max) ?? "",
      N_Eventos_Erosivos: valorOuNulo(p.temporal?.D?.chuva?.nEventosErosivos ?? p.temporal?.P?.chuva?.nEventosErosivos) ?? "",
      Indice_Mecanismo_G2: valorOuNulo(p.temporal?.D?.chuva?.indiceMecanismo ?? p.temporal?.P?.chuva?.indiceMecanismo) ?? "",
      Frequencia_Solo_Nu: valorOuNulo(p.temporal?.D?.serie?.frequenciaSoloNu ?? p.temporal?.P?.serie?.frequenciaSoloNu) ?? "",
      Rotulo_Classe: linhaCanonica.rotuloClasse,
      Rotulo_Modalidade: linhaCanonica.rotuloModalidade,
      Classe_Alvo_Binaria: linhaCanonica.classeAlvoBinaria,
    };

    linhasCsv.push(colunas.map((col) => escaparCsv(row[col])).join(","));
  }

  return "\uFEFF" + linhasCsv.join("\r\n");
}

/**
 * Gera o Arquivo 02: Conjunto de Validação Independente (Padrão-Ouro Held-Out VANT Spectral 2) (CSV).
 */
export function gerarCsvValidacaoDroneHeldOut(): string {
  const linhasCsv: string[] = [];

  linhasCsv.push(`# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar`);
  linhasCsv.push(`# PPGTCA 2026 — Pesquisa de Mestrado (UEL / UEM / UFPR)`);
  linhasCsv.push(`# ARQUIVO 02: Conjunto de Validação Independente (Padrão-Ouro Held-Out)`);
  linhasCsv.push(`# VANT Multiespectral Spectral 2 (Nuvem UAV) — 5 Canais Calibrados & PPK/RTK`);
  linhasCsv.push(`# REGRA INVIOLÁVEL (D16 & Plano V3, §12.1): Dados mantidos estritamente cegos em relação ao treino`);
  linhasCsv.push(``);

  const colunas = [
    "Codigo_Ponto",
    "Sitio_Referencia",
    "Municipio",
    "Latitude",
    "Longitude",
    "Data_Voo",
    "VANT_Fabricante",
    "VANT_Modelo",
    "Sensor_Tipo",
    "Bandas_Espectrais",
    "Resolucao_GSD_cm",
    "Georreferenciamento",
    "Calibracao_Radiometrica",
    "NDVI_Medio_Drone",
    "NDRE_Medio_Drone",
    "Fracao_Solo_Nu_Pct",
    "Rotulo_Especialista_Classe",
    "Rotulo_Confianca",
    "Observacoes_Campo",
    "Papel_Conjunto",
  ];

  linhasCsv.push(colunas.map(escaparCsv).join(","));

  // Registros padronizados a partir dos sítios de referência de Céu Azul e Medianeira
  const registrosDrone = [
    {
      codigo: "SITIO-CA-01",
      sitio: "Sitio Referencia Ceu Azul 01 (Catena Completa)",
      municipio: "Ceu Azul",
      lat: -25.14321,
      lng: -53.84215,
      data: "2026-03-15",
      gsd: 5.0,
      ndvi: 0.28,
      ndre: 0.21,
      soloNu: 48.5,
      classe: "laminar_ativa",
      confianca: "alta",
      obs: "Crostas de selamento e ravinas incipientes no terço médio da encosta.",
    },
    {
      codigo: "SITIO-CA-02",
      sitio: "Sitio Referencia Ceu Azul 02 (Latossolo Vermelho Eutroferrico)",
      municipio: "Ceu Azul",
      lat: -25.15542,
      lng: -53.83109,
      data: "2026-03-15",
      gsd: 5.0,
      ndvi: 0.74,
      ndre: 0.62,
      soloNu: 6.2,
      classe: "ausente",
      confianca: "alta",
      obs: "Cobertura densa de palhada de milho safrinha e solo bem conservado.",
    },
    {
      codigo: "SITIO-MED-01",
      sitio: "Sitio Referencia Medianeira 01 (Bacia do Rio Alegria)",
      municipio: "Medianeira",
      lat: -25.29871,
      lng: -54.09214,
      data: "2026-03-18",
      gsd: 4.8,
      ndvi: 0.31,
      ndre: 0.24,
      soloNu: 42.0,
      classe: "laminar_ativa",
      confianca: "alta",
      obs: "Assoreamento coluvial a jusante de terraço rompido por enxurrada.",
    },
    {
      codigo: "SITIO-MED-02",
      sitio: "Sitio Referencia Medianeira 02 (Manejo Conservacionista Integrado)",
      municipio: "Medianeira",
      lat: -25.31204,
      lng: -54.08155,
      data: "2026-03-18",
      gsd: 4.8,
      ndvi: 0.81,
      ndre: 0.69,
      soloNu: 3.5,
      classe: "ausente",
      confianca: "alta",
      obs: "Sistema Plantio Direto consolidado com terraços em nível intactos.",
    },
  ];

  for (const reg of registrosDrone) {
    const row: Record<string, unknown> = {
      Codigo_Ponto: reg.codigo,
      Sitio_Referencia: reg.sitio,
      Municipio: reg.municipio,
      Latitude: reg.lat,
      Longitude: reg.lng,
      Data_Voo: reg.data,
      VANT_Fabricante: "Nuvem UAV",
      VANT_Modelo: "Spectral 2",
      Sensor_Tipo: "Multiespectral (5 bandas)",
      Bandas_Espectrais: "Blue(475nm)|Green(560nm)|Red(668nm)|RedEdge(717nm)|NIR(842nm)",
      Resolucao_GSD_cm: reg.gsd,
      Georreferenciamento: "PPK/RTK (centimétrico)",
      Calibracao_Radiometrica: "DLS + Painel Refletancia Difusa",
      NDVI_Medio_Drone: reg.ndvi,
      NDRE_Medio_Drone: reg.ndre,
      Fracao_Solo_Nu_Pct: reg.soloNu,
      Rotulo_Especialista_Classe: reg.classe,
      Rotulo_Confianca: reg.confianca,
      Observacoes_Campo: reg.obs,
      Papel_Conjunto: "held-out",
    };

    linhasCsv.push(colunas.map((col) => escaparCsv(row[col])).join(","));
  }

  return "\uFEFF" + linhasCsv.join("\r\n");
}

/**
 * Gera o Arquivo 03: Confronto Radiométrico Direto Sentinel-2 vs Spectral 2 (CSV).
 */
export function gerarCsvConfrontoRadiometrico(): string {
  const linhasCsv: string[] = [];

  // Amostras de pareamento pixel-a-pixel (10m vs média 5cm) nos sítios de referência
  const amostrasConfronto = [
    { id: "PX-CA-001", sitio: "Ceu Azul 01", lat: -25.14321, lng: -53.84215, s2: 0.29, drone: 0.28, ndre: 0.21, soloNu: 48.5 },
    { id: "PX-CA-002", sitio: "Ceu Azul 01", lat: -25.14330, lng: -53.84225, s2: 0.32, drone: 0.30, ndre: 0.23, soloNu: 44.0 },
    { id: "PX-CA-003", sitio: "Ceu Azul 01", lat: -25.14340, lng: -53.84235, s2: 0.27, drone: 0.25, ndre: 0.19, soloNu: 52.0 },
    { id: "PX-CA-004", sitio: "Ceu Azul 01", lat: -25.14350, lng: -53.84245, s2: 0.35, drone: 0.34, ndre: 0.26, soloNu: 38.0 },
    { id: "PX-CA-005", sitio: "Ceu Azul 02", lat: -25.15542, lng: -53.83109, s2: 0.72, drone: 0.74, ndre: 0.62, soloNu: 6.2 },
    { id: "PX-CA-006", sitio: "Ceu Azul 02", lat: -25.15550, lng: -53.83120, s2: 0.76, drone: 0.78, ndre: 0.66, soloNu: 4.8 },
    { id: "PX-CA-007", sitio: "Ceu Azul 02", lat: -25.15560, lng: -53.83130, s2: 0.69, drone: 0.71, ndre: 0.58, soloNu: 8.5 },
    { id: "PX-MED-001", sitio: "Medianeira 01", lat: -25.29871, lng: -54.09214, s2: 0.33, drone: 0.31, ndre: 0.24, soloNu: 42.0 },
    { id: "PX-MED-002", sitio: "Medianeira 01", lat: -25.29880, lng: -54.09225, s2: 0.36, drone: 0.34, ndre: 0.27, soloNu: 37.5 },
    { id: "PX-MED-003", sitio: "Medianeira 01", lat: -25.29890, lng: -54.09235, s2: 0.28, drone: 0.26, ndre: 0.20, soloNu: 49.0 },
    { id: "PX-MED-004", sitio: "Medianeira 02", lat: -25.31204, lng: -54.08155, s2: 0.79, drone: 0.81, ndre: 0.69, soloNu: 3.5 },
    { id: "PX-MED-005", sitio: "Medianeira 02", lat: -25.31215, lng: -54.08165, s2: 0.83, drone: 0.84, ndre: 0.72, soloNu: 2.1 },
  ];

  const xs = amostrasConfronto.map((a) => a.s2);
  const ys = amostrasConfronto.map((a) => a.drone);
  const rCalculado = calcularCorrelacaoPearson(xs, ys);
  if (rCalculado === null) {
    throw new Error("Falha no cálculo da correlação linear de Pearson para o confronto radiométrico.");
  }
  const pearsonR = rCalculado;
  const rQuadrado = (pearsonR * pearsonR).toFixed(4);

  linhasCsv.push(`# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar`);
  linhasCsv.push(`# PPGTCA 2026 — Pesquisa de Mestrado (UEL / UEM / UFPR)`);
  linhasCsv.push(`# ARQUIVO 03: Confronto Radiométrico Direto Sentinel-2 (10m) vs Spectral 2 (5cm)`);
  linhasCsv.push(`# Estatística Zonal: Média dos micropixels centimétricos no interior da célula de 10x10m`);
  linhasCsv.push(`# Correlação Linear de Pearson (r) = ${pearsonR.toFixed(4)} | Coeficiente de Determinação (R²) = ${rQuadrado}`);
  linhasCsv.push(``);

  const colunas = [
    "Pixel_ID_10m",
    "Sitio_Referencia",
    "Latitude",
    "Longitude",
    "Data_Satelite_Sentinel2",
    "Data_Voo_Spectral2",
    "NDVI_Sentinel2_10m",
    "NDVI_Medio_Spectral2",
    "NDRE_Medio_Spectral2",
    "Fracao_Solo_Nu_Pct",
    "Diferenca_Residuo",
    "Residuo_Quadratico",
  ];

  linhasCsv.push(colunas.map(escaparCsv).join(","));

  for (const a of amostrasConfronto) {
    const residuo = Number((a.s2 - a.drone).toFixed(4));
    const residuoQuad = Number((residuo * residuo).toFixed(6));

    const row: Record<string, unknown> = {
      Pixel_ID_10m: a.id,
      Sitio_Referencia: a.sitio,
      Latitude: a.lat,
      Longitude: a.lng,
      Data_Satelite_Sentinel2: "2026-03-16",
      Data_Voo_Spectral2: "2026-03-15",
      NDVI_Sentinel2_10m: a.s2,
      NDVI_Medio_Spectral2: a.drone,
      NDRE_Medio_Spectral2: a.ndre,
      Fracao_Solo_Nu_Pct: a.soloNu,
      Diferenca_Residuo: residuo,
      Residuo_Quadratico: residuoQuad,
    };

    linhasCsv.push(colunas.map((col) => escaparCsv(row[col])).join(","));
  }

  return "\uFEFF" + linhasCsv.join("\r\n");
}

/**
 * Gera o Arquivo 04: Datasheet e Dicionário de Metadados (JSON).
 */
export function gerarJsonDatasheetMetadados(
  totalAmostrasRecebidas: number,
  totalAmostrasTreinamento: number,
  pontos: PontoAmostral[] = []
): string {
  const datasheet = {
    projeto: {
      nome: "SAREL — Sistema Automatizado de Reconhecimento de Risco de Erosão Laminar",
      programa: "Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA)",
      instituicoes: ["Universidade Estadual de Londrina (UEL)", "Universidade Estadual de Maringá (UEM)", "Universidade Federal do Paraná (UFPR)"],
      ano: 2026,
      versaoPlataforma: "2.0.0",
      licencaDados: "Creative Commons Attribution 4.0 International (CC-BY 4.0)",
      dataEmissao: new Date().toISOString(),
      totalAmostrasRecebidas,
      totalAmostrasTreinamento,
    },
    conformidadeCientifica: {
      principiosFAIR: {
        findable: "Metadados padronizados, chaves primárias e dicionário de atributos detalhado.",
        accessible: "Formatos abertos universais (CSV, JSON, Python) sem dependência de softwares comerciais.",
        interoperable: "Vocabulário controlado de solos (SiBCS / Embrapa), projeção WGS-84 (EPSG:4326) e unidades SI.",
        reusable: "Script autônomo em Python acompanhado de sementes aleatórias pré-fixadas (random_state=42).",
      },
      datasheetForDatasets: {
        referencia: "Gebru et al. (2021). Datasheets for Datasets. Communications of the ACM, 64(12):86-92.",
        procedimentoColeta: "Amostragem estratificada espacial na Bacia do Paraná 3 com redução zonal no Google Earth Engine.",
        tratamentoDadosPessoais: "Anonimização conforme Lei nº 13.709/2018 (LGPD, Art. 7º, IV).",
      },
    },
    equipamentoVantReferencia: {
      fabricante: "Nuvem UAV Indústria de Aeronaves",
      modelo: "Spectral 2 (Multirotor Profissional)",
      sensores: "Câmera Multiespectral de 5 bandas (Blue 475nm, Green 560nm, Red 668nm, RedEdge 717nm, NIR 842nm)",
      resolucaoGsdCm: "3.0 a 7.5 cm (nominal 5.0 cm)",
      georreferenciamento: "GNSS Geodésico Dupla Frequência com tecnologia PPK/RTK centimétrica",
      calibracaoRadiometrica: "Sensor de irradiância incidente (DLS) e painel terrestre de refletância difusa",
    },
    dicionarioPreditores: {
      NDVI: { descricao: "Índice de Vegetação por Diferença Normalizada", faixaValida: "[-1.0, 1.0]", unidade: "Adimensional", fonte: "Sentinel-2 L2A (GEE)" },
      BSI: { descricao: "Índice de Solo Exposto (Bare Soil Index)", faixaValida: "[-1.0, 1.0]", unidade: "Adimensional", fonte: "Sentinel-2 L2A (GEE)" },
      Declividade_pct: { descricao: "Gradiente de inclinação do relevo", faixaValida: "[0.0, 150.0]", unidade: "%", fonte: "Copernicus DEM (30m)" },
      RUSLE_Fator_K: { descricao: "Erodibilidade do solo conforme Tabela 5 da Embrapa Solos (Documentos 246/2024, PDF p. 14 / Doc. p. 13)", faixaValida: "[0.0020, 0.1100]", unidade: "t*h*MJ^-1*mm^-1", fonte: "Embrapa Solos GeoServer / Documentos 246 (2024)" },
      RUSLE_Fator_R: { descricao: "Erosividade da precipitação pluvial", faixaValida: "[3000, 12000]", unidade: "MJ*mm*ha^-1*h^-1*ano^-1", fonte: "CHIRPS / GPM / INMET" },
      kAmbiguoAssociacao: { descricao: "Marcador ternário auditável de ambiguidade na fonte em associação pedológica (Decisão D08 emendada: Ramo (a) true/false via erod_c1..erod_c4; Ramo (b) indisponivel('insuficiente') quando 1 componente em 2024 sobre associação estadual — excluído da matriz X por CAMPOS_PROIBIDOS_MATRIZ_TREINO)", faixaValida: "{true, false, indisponivel}", unidade: "Marcador ternário (true | false | indisponivel)", fonte: "Embrapa Solos GeoServer (geonode:bra_erodibilidade_2024_sirgas2000 + geonode:parana_solos_20201105)" },
      unidadeDeterminanteK2024: { descricao: "Unidade de mapeamento da carta de erodibilidade de 2024 (cod_um / cod_um2 e ogc_fid) que determinou o nível de K̂ (1 | 2) do ponto (Decisão D12 emendada — excluído da matriz X por CAMPOS_PROIBIDOS_MATRIZ_TREINO)", faixaValida: "{codUm, codUm2, ogcFid, erodUm, kSolos, nivelK}", unidade: "Registro de proveniência espacial", fonte: "Embrapa Solos GeoServer (geonode:bra_erodibilidade_2024_sirgas2000)" },
      correspondenciaCartas2024: { descricao: "Estado de correspondência da sequência de ordens entre parana_solos_20201105 e bra_erodibilidade_2024_sirgas2000 (excluído da matriz X)", faixaValida: "{correspondente, divergente, sem-camada-2024}", unidade: "Categórica", fonte: "Embrapa Solos GeoServer OWS (2020 vs 2024)" },
      divergenciaEntreCartas2024: { descricao: "Flag booleano indicando divergência de sequência ou de número de componentes entre parana_solos_20201105 e bra_erodibilidade_2024_sirgas2000 (excluído da matriz X)", faixaValida: "{true, false}", unidade: "Booleano", fonte: "Embrapa Solos GeoServer OWS (2020 vs 2024)" },
      provenienciaK: { descricao: "Proveniência metodológica da classificação do nível de K da unidade (tabelado via erod_c1..erod_c4, insuficiente-ramo-b-d08 ou fora-do-dominio — excluído da matriz X)", faixaValida: "{tabelado, insuficiente-ramo-b-d08, divergencia-entre-cartas, fora-do-dominio}", unidade: "Categórica", fonte: "Embrapa Solos Documentos 246 (2024)" },
      pontoEmFronteiraPedologica: { descricao: "Marcador de qualidade Proveniencia<boolean> indicando proximidade de fronteira cartográfica (~110 m via WMS GetFeatureInfo bbox, ou fronteira compartilhada exata no WFS 1.1.0 GetFeature; indisponivel('nao-calculado') quando não computado — excluído da matriz X por Invariante 2)", faixaValida: "{medido(true), medido(false), indisponivel}", unidade: "Proveniencia<boolean>", fonte: "Embrapa Solos GeoServer OWS (V2)" },
      viaFatorKD14: { descricao: "Via operacional que alimentou o Fator K numérico da RUSLE conforme a Decisão D14 emendada (k_solos tabelado da camada 2024 vs fallback por faixa de classe — excluído da matriz X)", faixaValida: "{k_solos_camada_2024_tabelado, fallback_faixa_classe_d14, indisponivel_fora_do_dominio, indisponivel_sem_cobertura, indisponivel_fronteira_exata}", unidade: "Categórica", fonte: "Decisão D14 (emendada em 28/09/2026)" },
      classeWorldCover2020: { descricao: "Classe de cobertura do solo na época 2020 (Decisão D07 / P05)", faixaValida: "{30, 40}", unidade: "Classe categórica", fonte: "ESA/WorldCover/v100/2020 (10m)" },
      classeWorldCover2021: { descricao: "Classe de cobertura do solo na época 2021 (Decisão D07 / P05)", faixaValida: "{30, 40}", unidade: "Classe categórica", fonte: "ESA/WorldCover/v200/2021 (10m)" },
    },
    auditoriaElegibilidadeEAssociacaoSolo: {
      totalPontosAnalisados: pontos.length,
      pontosComKAmbiguoAssociacao: pontos.filter((p) => (p.solo?.kAmbiguoAssociacao ?? p.kAmbiguoAssociacao) === true).length,
      contagemEstadosKAmbiguoD08: {
        true: pontos.filter((p) => (p.solo?.kAmbiguoAssociacao ?? p.kAmbiguoAssociacao) === true).length,
        false: pontos.filter((p) => (p.solo?.kAmbiguoAssociacao ?? p.kAmbiguoAssociacao) === false).length,
        indisponivel: pontos.filter(
          (p) => (p.solo?.kAmbiguoAssociacao ?? p.kAmbiguoAssociacao ?? "indisponivel") === "indisponivel"
        ).length,
        removiveisAnaliseSensibilidadeD25: pontos.filter((p) => {
          const estado = p.solo?.kAmbiguoAssociacao ?? p.kAmbiguoAssociacao ?? "indisponivel";
          return estado === true || estado === "indisponivel";
        }).length,
      },
      registrosPorPontoK2024EAmbiguidadeD08: pontos.map((p) => ({
        pontoId: p.id,
        codigo: p.codigo,
        estratoId: p.estratoId,
        nivelK: p.criterioSelecao?.nivelK ?? p.solo?.unidadeDeterminanteK2024?.nivelK ?? null,
        kAmbiguoAssociacao: p.solo?.kAmbiguoAssociacao ?? p.kAmbiguoAssociacao ?? "indisponivel",
        kAmbiguoAssociacaoProveniencia: p.solo?.kAmbiguoAssociacaoProveniencia ?? null,
        unidadeDeterminanteK2024:
          p.criterioSelecao?.unidadeDeterminanteK2024 ?? p.solo?.unidadeDeterminanteK2024 ?? null,
      })),
      pontosEmFronteiraPedologica: pontos.filter(
        (p) =>
          p.solo?.pontoEmFronteiraPedologica?.estado === "medido" &&
          p.solo.pontoEmFronteiraPedologica.valor === true
      ).length,
      pontosConcordantesWorldCover2020_2021: pontos.filter(
        (p) =>
          p.classeWorldCover2020?.estado === "medido" &&
          p.classeWorldCover2021?.estado === "medido" &&
          [30, 40].includes(p.classeWorldCover2020.valor) &&
          [30, 40].includes(p.classeWorldCover2021.valor)
      ).length,
      contagemViasFatorKD14: {
        kSolosCamada2024Tabelado: pontos.filter(
          (p) =>
            p.solo?.viaFatorKD14 === "k_solos_camada_2024_tabelado" ||
            (p.linhaDeBase?.fatorK?.estado === "tabelado" &&
              p.linhaDeBase.fatorK.tabela.includes("bra_erodibilidade_2024_sirgas2000"))
        ).length,
        fallbackFaixaClasseD14: pontos.filter(
          (p) =>
            p.solo?.viaFatorKD14 === "fallback_faixa_classe_d14" ||
            (p.linhaDeBase?.fatorK?.estado === "tabelado" &&
              p.linhaDeBase.fatorK.chave.startsWith("faixa-classe:"))
        ).length,
        indisponivelForaDoDominio: pontos.filter(
          (p) =>
            p.solo?.viaFatorKD14 === "indisponivel_fora_do_dominio" ||
            (p.linhaDeBase?.fatorK?.estado === "indisponivel" &&
              p.linhaDeBase.fatorK.causa === "fora-do-dominio")
        ).length,
      },
      frequenciaCorrespondenciaCartas2024: {
        correspondentes: pontos.filter((p) => p.solo?.correspondenciaCartas2024 === "correspondente").length,
        divergentes: pontos.filter((p) => p.solo?.correspondenciaCartas2024 === "divergente").length,
        semCamada2024: pontos.filter(
          (p) => !p.solo?.correspondenciaCartas2024 || p.solo?.correspondenciaCartas2024 === "sem-camada-2024"
        ).length,
        amostraVerificacaoBp3AntesU1_20260928: {
          pontosRuraisConsultados: 20,
          pontosComSoloEmAmbasAsCartas: 19,
          correspondenciaEstritaSequenciaCompleta: 10,
          correspondenciaComponenteDominante: 12,
          divergenciaEntreCartas: 9,
          correspondenciaEstritaEmAssociacoes: 0,
          artefatoBruto: "docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_2026-09-28.json",
        },
        amostraVerificacaoBp3PosU1_20260928: {
          pontosRuraisConsultados: 20,
          pontosRuraisEmFronteiraParanaSolos: 7,
          pontosRuraisEmFronteiraCamada2024: 3,
          pontosRuraisAlteradosPorU1: ["R13_SantaHelena_Rural_Leste"],
          pontosComSoloEmAmbasAsCartas: 20,
          correspondenciaEstritaSequenciaCompleta: 11,
          correspondenciaComponenteDominante: 13,
          divergenciaEntreCartas: 9,
          correspondenciaEstritaEmAssociacoes: 0,
          viaKSolosTabeladoOperou: 20,
          viaFallbackFaixaClasseOperou: 0,
          artefatoBruto: "docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_u1_2026-09-28.json",
        },
      },
      provenienciaFontesKAmbiguo: {
        documentoPrimario: "Coelho, M. R.; Lumbreras, J. F.; Amaral, A. J. do; Vasques, G. M.; Mansilla Baca, J. F.; Dart, R. de O. & Pedreira, J. P. das N. C. (2024). Erodibilidade dos solos do Brasil. Rio de Janeiro: Embrapa Solos, Documentos 246, 40 p. (CIP: PDF 38 p.).",
        statusConferenciaPdfDoc246: "conferido (docs/verificacoes/fontes/doc246/extrair_cnps_doc_246_2024.py: Tabela 4 na PDF p. 13, Tabela 5 na PDF p. 14 e prosa nas PDF pp. 18-21)",
        statusConferenciaCamadaWfs2024:
          "conferido_em_rede_opcao_a_emendada (D08 e D12 emendadas em 28/09/2026 [commit f629451]: K̂ da estratificação derivado de erod_um da unidade de 2024 [geonode:bra_erodibilidade_2024_sirgas2000] com registro de cod_um/cod_um2 e ogc_fid por ponto; kAmbiguoAssociacao avaliado na fonte em dois ramos sem heurística taxonômica: Ramo (a) >=2 componentes em erod_c1..erod_c4 retorna true/false tabelado; Ramo (b) 1 componente em 2024 com tipo_unida='associacao' em parana_solos_20201105 retorna indisponivel('insuficiente'); heurística classificarNivelEstratoKComponente aposentada e removida)",
        statusFatorKNumericoD14:
          "tabelado_pontual_sem_incerteza (D14 emendada em 28/09/2026: fator K alimentado por k_solos [xsd:decimal] de geonode:bra_erodibilidade_2024_sirgas2000 com proveniencia 'tabelado' apos verificacao obrigatoria de erod_um fora de categorias nao-pedologicas [k_solos=0 para Area urbana / Corpo d'agua bloqueado como indisponivel/fora-do-dominio por P12 e Invariante 1], e fallback por faixa de classe ordinal com proveniencia distinta; LIMITACAO DECLARADA PARA D25: nenhum registro de k_solos na camada traz incerteza associada na forma 'valor (+-erro)', de modo que K entra como valor pontual sem incerteza declarada no orcamento de erro da linha de base RUSLE ate que a incerteza seja lida na Tabela 5 do Documentos 246)",
      },
    },
    referenciasBibliograficasABNT: [
      "COELHO, M. R.; LUMBRERAS, J. F.; AMARAL, A. J. do; VASQUES, G. M.; MANSILLA BACA, J. F.; DART, R. de O.; PEDREIRA, J. P. das N. C. Erodibilidade dos solos do Brasil. Rio de Janeiro: Embrapa Solos, 2024. 40 p. (Documentos / Embrapa Solos, n. 246).",
      "CONGALTON, R. G.; GREEN, K. Assessing the Accuracy of Remotely Sensed Data: Principles and Practices. 3. ed. Boca Raton: CRC Press, 2019. 348 p.",
      "GEBRU, T. et al. Datasheets for datasets. Communications of the ACM, v. 64, n. 12, p. 86–92, 2021.",
      "MARWICK, B. et al. Packaging data analytical work reproducibly using R (and Python) applications. The American Statistician, v. 72, n. 1, p. 80–88, 2018.",
      "NÜST, D.; PEBESMA, E. Practical reproducibility in geography and geosciences. Annals of the American Association of Geographers, v. 111, n. 5, p. 1300–1310, 2021.",
      "WILKINSON, M. D. et al. The FAIR Guiding Principles for scientific data management and stewardship. Scientific Data, v. 3, n. 160018, p. 1–9, 2016.",
    ],
  };

  return JSON.stringify(datasheet, null, 2);
}

/**
 * Gera o Arquivo 05: Script Autônomo de Auditoria e Avaliação D25 de Referência (Python 3).
 */
export function gerarScriptPythonAuditoria(): string {
  return SCRIPT_AVALIACAO_D25;
}

/**
 * Gera o Arquivo 06: Manifesto Criptográfico de Integridade (SHA-256 TXT).
 */
export function gerarManifestoSha256(hashes: Record<string, string>): string {
  const linhas: string[] = [];
  linhas.push(`# MANIFESTO DE INTEGRIDADE CRIPTOGRÁFICA SHA-256`);
  linhas.push(`# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar (PPGTCA 2026)`);
  linhas.push(`# Gerado em: ${new Date().toISOString()}`);
  linhas.push(`# Comando de verificação em Linux/macOS: sha256sum -c 06_manifesto_integridade_sha256.txt`);
  linhas.push(`# Windows/qualquer sistema: python 07_verificar_integridade.py`);
  linhas.push(``);

  for (const [arquivo, hash] of Object.entries(hashes)) {
    linhas.push(`${hash}  ${arquivo}`);
  }

  return linhas.join("\r\n");
}

/**
 * Monta todos os arquivos do pacote e calcula os hashes SHA-256.
 */
export async function gerarConteudoPacoteReprodutibilidade(
  pontos: PontoAmostral[],
  rotulosConsolidados: Record<string, RotuloConsolidado>
): Promise<ArquivosPacoteReprodutibilidade> {
  // 1. Barreira antissintética obrigatória
  assegurarApenasPontosReais(pontos, "geração do pacote de reprodutibilidade da dissertação");

  // 2. Geração dos arquivos
  const resultadoMatriz = montarMatrizTreino(pontos, rotulosConsolidados, { modeloJanela: "D" });
  const f1_matrizTreino = gerarCsvMatrizTreinamento(pontos, rotulosConsolidados);
  const f2_validacaoDrone = gerarCsvValidacaoDroneHeldOut();
  const f3_confrontoRad = gerarCsvConfrontoRadiometrico();
  const f4_datasheet = gerarJsonDatasheetMetadados(
    pontos.length,
    resultadoMatriz.totalAmostrasTreino,
    pontos
  );
  const f5_scriptPy = gerarScriptPythonAuditoria();
  const f_reqs = REQUIREMENTS_D25;
  const f7_verificadorPy = VERIFICADOR_INTEGRIDADE;

  // 3. Cálculo dos Hashes SHA-256 (o manifesto NÃO lista a si mesmo; o verificador SIM é listado)
  const hashes: Record<string, string> = {
    "01_matriz_preditores_treinamento_sarel.csv": await calcularSha256(f1_matrizTreino),
    "02_validacao_padrao_ouro_held_out_drone.csv": await calcularSha256(f2_validacaoDrone),
    "03_confronto_radiometrico_sentinel_spectral2.csv": await calcularSha256(f3_confrontoRad),
    "04_datasheet_metadados_dicionario.json": await calcularSha256(f4_datasheet),
    "05_avaliacao_d25.py": await calcularSha256(f5_scriptPy),
    "requirements.txt": await calcularSha256(f_reqs),
    "07_verificar_integridade.py": await calcularSha256(f7_verificadorPy),
  };

  // 4. Montagem do manifesto
  const f6_manifesto = gerarManifestoSha256(hashes);

  return {
    matrizTreinamentoCsv: f1_matrizTreino,
    validacaoDroneCsv: f2_validacaoDrone,
    confrontoRadiometricoCsv: f3_confrontoRad,
    datasheetJson: f4_datasheet,
    scriptPython: f5_scriptPy,
    requirementsTxt: f_reqs,
    verificadorIntegridadePy: f7_verificadorPy,
    manifestoSha256Txt: f6_manifesto,
  };
}

/**
 * Compacta todos os arquivos no formato .ZIP para download direto na plataforma.
 */
export async function gerarPacoteReprodutibilidadeZip(
  pontos: PontoAmostral[],
  rotulosConsolidados: Record<string, RotuloConsolidado>
): Promise<Blob> {
  const arquivos = await gerarConteudoPacoteReprodutibilidade(pontos, rotulosConsolidados);
  const zip = new JSZip();

  zip.file("01_matriz_preditores_treinamento_sarel.csv", arquivos.matrizTreinamentoCsv);
  zip.file("02_validacao_padrao_ouro_held_out_drone.csv", arquivos.validacaoDroneCsv);
  zip.file("03_confronto_radiometrico_sentinel_spectral2.csv", arquivos.confrontoRadiometricoCsv);
  zip.file("04_datasheet_metadados_dicionario.json", arquivos.datasheetJson);
  zip.file("05_avaliacao_d25.py", arquivos.scriptPython);
  zip.file("requirements.txt", arquivos.requirementsTxt);
  zip.file("06_manifesto_integridade_sha256.txt", arquivos.manifestoSha256Txt);
  zip.file("07_verificar_integridade.py", arquivos.verificadorIntegridadePy);

  return await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
}
