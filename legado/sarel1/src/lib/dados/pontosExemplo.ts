/**
 * ============================================================================
 * Conjunto Demonstrativo de Pontos Amostrais — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Gera malha representativa de pontos distribuídos nos 18 estratos
 * (Tercil S x Tercil E x Nível K), com blocos espaciais e proveniência científica.
 * Utilizado para inicialização da UI e testes interativos.
 */

import { PontoAmostral } from "@/types/ponto";
import { RotuloConsolidado } from "@/types/rotulo";
import { pontoDentroDoParana } from "./fronteiraParana";
import { pontoEmGeoJson } from "../ibge/ibgeService";

export const SEMENTE_AMOSTRAGEM_PADRAO = 20260908;

/**
 * Gera pontos amostrais realistas em bacias do Paraná (ex: Bacia do Alto Iguaçu / Tibagi).
 */
export function gerarPontosDemonstrativos(qtd: number = 36): PontoAmostral[] {
  const pontos: PontoAmostral[] = [];

  const ordens = [
    { ordem: "Latossolo", subOrdem: "Vermelho", erodibilidade: "baixa" },
    { ordem: "Argissolo", subOrdem: "Vermelho-Amarelo", erodibilidade: "moderada" },
    { ordem: "Neossolo", subOrdem: "Regolítico", erodibilidade: "alta" },
    { ordem: "Cambissolo", subOrdem: "Háplico", erodibilidade: "alta" },
  ];

  for (let i = 0; i < qtd; i++) {
    const idNum = i + 1;
    const tercilS = (i % 3) + 1; // 1, 2, 3 (terreno)
    const tercilE = ((Math.floor(i / 3)) % 3) + 1; // 1, 2, 3 (exposição)
    const nivelK = (i % 2) + 1; // 1, 2 (erodibilidade)
    const estratoId = `ESTRATO_S${tercilS}_E${tercilE}_K${nivelK}`;

    const blocoLinha = Math.floor(i / 6) + 1;
    const blocoColuna = (i % 6) + 1;
    const blocoEspacial = `BLOCO_R${String(blocoLinha).padStart(2, "0")}_C${String(blocoColuna).padStart(2, "0")}`;

    const soloRef = ordens[i % ordens.length];

    // Variância realista em declividade e terreno
    const declividadePct = Number((3.2 + tercilS * 5.4 + (i * 0.35) % 4.0).toFixed(2));
    const declividadeGraus = Number((Math.atan(declividadePct / 100) * (180 / Math.PI)).toFixed(2));
    const elevacao = Math.round(820 + i * 8.5 + (tercilS * 30));
    const twi = Number((5.5 + (15 - declividadePct) * 0.25).toFixed(2));
    const freqSoloNu = Number((0.10 + tercilE * 0.18 + (i % 5) * 0.03).toFixed(2));

    const lat = Number((-25.35 - (blocoLinha * 0.08) - (i % 4) * 0.015).toFixed(5));
    const lon = Number((-49.30 - (blocoColuna * 0.08) - (i % 3) * 0.012).toFixed(5));

    const ponto: PontoAmostral = {
      id: `SYNTHETIC-demo-${idNum}`,
      codigo: `SINT-PR-${String(idNum).padStart(4, "0")}`,
      origemSintetica: true,
      latitude: lat,
      longitude: lon,
      blocoEspacial,
      estratoId,
      criterioSelecao: {
        tercilS,
        tercilE,
        nivelK,
        phiDiag: Number((0.2 + (tercilS + tercilE + nivelK) * 0.08).toFixed(3)),
      },
      terreno: {
        elevacao: { estado: "medido", valor: elevacao, fonte: "Copernicus DEM 30m (GLO-30)", adquiridoEm: "2026-02-10" },
        declividadePct: { estado: "medido", valor: declividadePct, fonte: "Copernicus DEM 30m métrico (EPSG:31982)", adquiridoEm: "2026-02-10" },
        declividadeGraus: { estado: "medido", valor: declividadeGraus, fonte: "Copernicus DEM 30m métrico (EPSG:31982)", adquiridoEm: "2026-02-10" },
        curvaturaPerfil: { estado: "medido", valor: Number((-0.02 + (i % 5) * 0.01).toFixed(4)), fonte: "Copernicus DEM 30m", adquiridoEm: "2026-02-10" },
        curvaturaPlana: { estado: "medido", valor: Number((0.01 - (i % 4) * 0.008).toFixed(4)), fonte: "Copernicus DEM 30m", adquiridoEm: "2026-02-10" },
        acumuloFluxo: { estado: "medido", valor: Math.round(50 + i * 35 + (tercilS * 20)), fonte: "D8 Copernicus DEM", adquiridoEm: "2026-02-10" },
        twi: { estado: "medido", valor: twi, fonte: "Topographic Wetness Index (UTM 22S)", adquiridoEm: "2026-02-10" },
      },
      solo: {
        ordem: { estado: "tabelado", valor: soloRef.ordem, tabela: "Embrapa Solos PR", chave: soloRef.ordem.slice(0, 2).toUpperCase() },
        subOrdem: { estado: "tabelado", valor: soloRef.subOrdem, tabela: "Embrapa Solos PR", chave: "sub" },
        grandeGrupo: { estado: "medido", valor: i % 2 === 0 ? "Distrófico" : "Eutrófico", fonte: "Amostragem de Campo", adquiridoEm: "2026-05-14" },
        tipoUnidade: { estado: "tabelado", valor: i % 4 === 0 ? "associacao" : "simples", tabela: "Embrapa Solos PR", chave: "tipo" },
        confiancaPedologica: i % 4 === 0 ? "media" : "alta",
        erodibilidadeClasse: { estado: "tabelado", valor: soloRef.erodibilidade, tabela: "Tabela K Pedológica", chave: soloRef.erodibilidade },
      },
      serie: {
        janela: { inicio: "2023-01-01", fim: "2025-12-31" },
        nObservacoesValidas: 38 + (i % 12),
        harmonicos: {
          B12_amplitude: { estado: "modelado", valor: Number((0.12 + (i % 6) * 0.02).toFixed(3)), modelo: "OLS Harmonic 2-termos", insumos: ["Sentinel-2 B12"], qualidade: { nObservacoes: 42, r2: 0.81, erroPadrao: 0.02 } },
          B12_tendencia: { estado: "modelado", valor: Number((0.0015 + (i % 3) * 0.0005).toFixed(4)), modelo: "OLS Harmonic linear", insumos: ["Sentinel-2 B12"] },
          NDVI_amplitude: { estado: "modelado", valor: Number((0.28 + (i % 4) * 0.03).toFixed(3)), modelo: "OLS Harmonic 2-termos", insumos: ["Sentinel-2 NDVI"] },
        },
        frequenciaSoloNu: { estado: "medido", valor: freqSoloNu, fonte: "Sentinel-2 MSI (NDVI < 0.25)", adquiridoEm: "2026-02-15" },
        compostoSoloNu: {
          B2: { estado: "medido", valor: Number((0.06 + (i % 4) * 0.01).toFixed(3)), fonte: "Sentinel-2 Composto Mediano", adquiridoEm: "2026-02-15" },
          B3: { estado: "medido", valor: Number((0.09 + (i % 4) * 0.01).toFixed(3)), fonte: "Sentinel-2 Composto Mediano", adquiridoEm: "2026-02-15" },
          B4: { estado: "medido", valor: Number((0.13 + (i % 5) * 0.015).toFixed(3)), fonte: "Sentinel-2 Composto Mediano", adquiridoEm: "2026-02-15" },
          B8: { estado: "medido", valor: Number((0.21 + (i % 5) * 0.02).toFixed(3)), fonte: "Sentinel-2 Composto Mediano", adquiridoEm: "2026-02-15" },
          B11: { estado: "medido", valor: Number((0.25 + (i % 5) * 0.02).toFixed(3)), fonte: "Sentinel-2 Composto Mediano", adquiridoEm: "2026-02-15" },
          B12: { estado: "medido", valor: Number((0.18 + (i % 4) * 0.02).toFixed(3)), fonte: "Sentinel-2 Composto Mediano", adquiridoEm: "2026-02-15" },
        },
      },
      chuva: {
        precipAcum30d: { estado: "medido", valor: 140 + (i % 7) * 15, fonte: "CHIRPS Diário v2.0", adquiridoEm: "2026-03-01" },
        precipAcum90d: { estado: "medido", valor: 390 + (i % 8) * 25, fonte: "CHIRPS Diário v2.0", adquiridoEm: "2026-03-01" },
        i30Max: { estado: "medido", valor: Number((24.5 + (i % 6) * 4.8).toFixed(1)), fonte: "GPM IMERG Final Semi-horário", adquiridoEm: "2026-03-01" },
        nEventosErosivos: { estado: "medido", valor: 2 + (i % 4), fonte: "Eventos >= 10mm GPM/CHIRPS", adquiridoEm: "2026-03-01" },
        indiceMecanismo: { estado: "modelado", valor: Number((65.0 + i * 3.8).toFixed(1)), modelo: "Erosividade x Solo Nu Integrado", insumos: ["GPM IMERG", "Sentinel-2 Solo Nu"] },
      },
      fundiario: {
        status: "encontrado",
        codigoCar: `PR-4106902-CAR${String(100000 + idNum)}`,
        titularMascarado: `PRODUTOR ${String.fromCharCode(65 + (i % 20))} **********`,
        documentoMascarado: `***.${String(100 + idNum).slice(0, 3)}.${String(200 + idNum).slice(0, 3)}-**`,
        areaImovelHa: 45.2 + i * 2.5,
      },
    };

    // Rotular os primeiros pontos com observação de campo ou fotointerpretação
    if (i < 24) {
      const classes = ["ausente", "incipiente", "moderada", "severa"] as const;
      const classe = classes[i % classes.length];
      ponto.rotulo = {
        classe,
        modalidade: i % 2 === 0 ? "campo" : "interpretacao-visual",
        observador: i % 2 === 0 ? "Técnico Silva (Kobo)" : "Intérprete Independente A",
        observadoEm: "2026-05-18",
        confianca: "alta",
        cego: true,
      };
    }

    pontos.push(ponto);
  }

  return pontos;
}

export function gerarRotulosConsolidadosIniciais(pontos: PontoAmostral[]): Record<string, RotuloConsolidado> {
  const map: Record<string, RotuloConsolidado> = {};
  for (const p of pontos) {
    if (p.rotulo) {
      map[p.codigo] = {
        final: p.rotulo,
        origens: [p.rotulo],
        divergencia: "nenhuma",
      };
    }
  }
  return map;
}

export interface ParametrosAmostragemAoi {
  quantidade: number;
  semente: number;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  nomeRegiao: string;
  municipio?: string;
  uf?: string;
  geojson?: any;
}

/**
 * Gera uma nova amostragem estratificada balanceada sob medida para uma AOI geográfica (município, estado ou bacia).
 */
export function gerarAmostragemParaAoi(params: ParametrosAmostragemAoi): PontoAmostral[] {
  const { quantidade, semente, bbox, nomeRegiao, municipio, uf = "PR", geojson } = params;
  const pontos: PontoAmostral[] = [];

  let s = Math.abs(semente) % 2147483647;
  if (s === 0) s = 12345;
  const prng = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const ordens = [
    { ordem: "Latossolo", subOrdem: "Vermelho", erodibilidade: "baixa" },
    { ordem: "Argissolo", subOrdem: "Vermelho-Amarelo", erodibilidade: "moderada" },
    { ordem: "Neossolo", subOrdem: "Regolítico", erodibilidade: "alta" },
    { ordem: "Cambissolo", subOrdem: "Háplico", erodibilidade: "alta" },
    { ordem: "Nitossolo", subOrdem: "Vermelho", erodibilidade: "baixa" },
  ];

  const [minLng, minLat, maxLng, maxLat] = bbox;
  const deltaLng = maxLng - minLng;
  const deltaLat = maxLat - minLat;

  for (let i = 0; i < quantidade; i++) {
    const idNum = i + 1;
    const tercilS = (i % 3) + 1; // 1, 2, 3 (terreno)
    const tercilE = (Math.floor(i / 3) % 3) + 1; // 1, 2, 3 (exposição)
    const nivelK = (i % 2) + 1; // 1, 2 (erodibilidade)
    const estratoId = `ESTRATO_S${tercilS}_E${tercilE}_K${nivelK}`;

    // Dispersão espacial em grid com ruído pseudo-aleatório
    const gridCols = Math.ceil(Math.sqrt(quantidade * 1.5));
    const gridRows = Math.ceil(quantidade / gridCols);
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);

    const jitterLng = (prng() - 0.5) * (deltaLng / gridCols) * 0.8;
    const jitterLat = (prng() - 0.5) * (deltaLat / gridRows) * 0.8;

    let lon = Number((minLng + (col + 0.5) * (deltaLng / gridCols) + jitterLng).toFixed(5));
    let lat = Number((minLat + (row + 0.5) * (deltaLat / gridRows) + jitterLat).toFixed(5));

    // Se houver polígono GeoJSON oficial (município/estado), valida contenção exata
    if (geojson) {
      let tentativas = 0;
      while (!pontoEmGeoJson(lon, lat, geojson) && tentativas < 50) {
        lon = Number((minLng + prng() * deltaLng).toFixed(5));
        lat = Number((minLat + prng() * deltaLat).toFixed(5));
        tentativas++;
      }
    } else if (uf === "PR") {
      // Se o estado for PR e não tiver geojson, garante que o ponto nunca excede a fronteira oficial do estado
      let tentativas = 0;
      while (!pontoDentroDoParana(lon, lat) && tentativas < 30) {
        lon = Number((lon + (-51.50 - lon) * 0.15).toFixed(5));
        lat = Number((lat + (-24.65 - lat) * 0.15).toFixed(5));
        tentativas++;
      }
    }

    const blocoLinha = (row % 5) + 1;
    const blocoColuna = (col % 5) + 1;
    const blocoEspacial = `BLOCO_R${String(blocoLinha).padStart(2, "0")}_C${String(blocoColuna).padStart(2, "0")}`;

    const soloRef = ordens[i % ordens.length];
    const declividadePct = Number((2.5 + tercilS * 5.2 + prng() * 3.8).toFixed(2));
    const declividadeGraus = Number((Math.atan(declividadePct / 100) * (180 / Math.PI)).toFixed(2));
    const elevacao = Math.round(550 + tercilS * 90 + prng() * 120);
    const twi = Number((5.0 + (16 - declividadePct) * 0.28).toFixed(2));
    const freqSoloNu = Number((0.08 + tercilE * 0.16 + prng() * 0.05).toFixed(2));

    const municPonto = municipio || (nomeRegiao.includes("Município") ? nomeRegiao.replace("Município de ", "") : nomeRegiao);

    const ponto: PontoAmostral = {
      id: `SYNTHETIC-aoi-${semente}-${idNum}`,
      codigo: `SINT-${uf}-${String(idNum).padStart(4, "0")}`,
      origemSintetica: true,
      latitude: lat,
      longitude: lon,
      blocoEspacial,
      estratoId,
      criterioSelecao: {
        tercilS,
        tercilE,
        nivelK,
        phiDiag: Number((0.2 + (tercilS + tercilE + nivelK) * 0.08).toFixed(3)),
      },
      terreno: {
        elevacao: { estado: "medido", valor: elevacao, fonte: "Copernicus DEM 30m (GLO-30)", adquiridoEm: "2026-04-12" },
        declividadePct: { estado: "medido", valor: declividadePct, fonte: "Copernicus DEM 30m métrico (EPSG:31982)", adquiridoEm: "2026-04-12" },
        declividadeGraus: { estado: "medido", valor: declividadeGraus, fonte: "Copernicus DEM 30m métrico (EPSG:31982)", adquiridoEm: "2026-04-12" },
        curvaturaPerfil: { estado: "medido", valor: Number((-0.03 + prng() * 0.06).toFixed(4)), fonte: "Copernicus DEM 30m", adquiridoEm: "2026-04-12" },
        curvaturaPlana: { estado: "medido", valor: Number((-0.02 + prng() * 0.05).toFixed(4)), fonte: "Copernicus DEM 30m", adquiridoEm: "2026-04-12" },
        acumuloFluxo: { estado: "medido", valor: Math.round(40 + prng() * 180 + tercilS * 30), fonte: "D8 Copernicus DEM", adquiridoEm: "2026-04-12" },
        twi: { estado: "medido", valor: twi, fonte: "Topographic Wetness Index", adquiridoEm: "2026-04-12" },
      },
      solo: {
        ordem: { estado: "tabelado", valor: soloRef.ordem, tabela: `Embrapa Solos ${uf}`, chave: soloRef.ordem.slice(0, 2).toUpperCase() },
        subOrdem: { estado: "tabelado", valor: soloRef.subOrdem, tabela: `Embrapa Solos ${uf}`, chave: "sub" },
        grandeGrupo: { estado: "medido", valor: i % 2 === 0 ? "Distrófico" : "Eutrófico", fonte: "Amostragem de Campo", adquiridoEm: "2026-05-14" },
        tipoUnidade: { estado: "tabelado", valor: i % 3 === 0 ? "associacao" : "simples", tabela: `Embrapa Solos ${uf}`, chave: "tipo" },
        confiancaPedologica: i % 3 === 0 ? "media" : "alta",
        erodibilidadeClasse: { estado: "tabelado", valor: soloRef.erodibilidade, tabela: "Tabela K Pedológica", chave: soloRef.erodibilidade },
      },
      serie: {
        janela: { inicio: "2023-01-01", fim: "2025-12-31" },
        nObservacoesValidas: 35 + (i % 15),
        harmonicos: {
          B12_amplitude: { estado: "modelado", valor: Number((0.11 + prng() * 0.06).toFixed(3)), modelo: "OLS Harmonic 2-termos", insumos: ["Sentinel-2 B12"], qualidade: { nObservacoes: 40, r2: 0.83, erroPadrao: 0.02 } },
          B12_tendencia: { estado: "modelado", valor: Number((0.0012 + prng() * 0.001).toFixed(4)), modelo: "OLS Harmonic linear", insumos: ["Sentinel-2 B12"] },
          NDVI_amplitude: { estado: "modelado", valor: Number((0.26 + prng() * 0.08).toFixed(3)), modelo: "OLS Harmonic 2-termos", insumos: ["Sentinel-2 NDVI"] },
        },
        frequenciaSoloNu: { estado: "medido", valor: freqSoloNu, fonte: "Sentinel-2 MSI (NDVI < 0.25)", adquiridoEm: "2026-03-20" },
        compostoSoloNu: {
          B2: { estado: "medido", valor: Number((0.05 + prng() * 0.03).toFixed(3)), fonte: "Sentinel-2 Composto Mediano", adquiridoEm: "2026-03-20" },
          B3: { estado: "medido", valor: Number((0.08 + prng() * 0.04).toFixed(3)), fonte: "Sentinel-2 Composto Mediano", adquiridoEm: "2026-03-20" },
          B4: { estado: "medido", valor: Number((0.12 + prng() * 0.05).toFixed(3)), fonte: "Sentinel-2 Composto Mediano", adquiridoEm: "2026-03-20" },
          B8: { estado: "medido", valor: Number((0.20 + prng() * 0.06).toFixed(3)), fonte: "Sentinel-2 Composto Mediano", adquiridoEm: "2026-03-20" },
          B11: { estado: "medido", valor: Number((0.24 + prng() * 0.06).toFixed(3)), fonte: "Sentinel-2 Composto Mediano", adquiridoEm: "2026-03-20" },
          B12: { estado: "medido", valor: Number((0.17 + prng() * 0.05).toFixed(3)), fonte: "Sentinel-2 Composto Mediano", adquiridoEm: "2026-03-20" },
        },
      },
      chuva: {
        precipAcum30d: { estado: "medido", valor: Math.round(120 + prng() * 80), fonte: "CHIRPS Diário v2.0", adquiridoEm: "2026-04-01" },
        precipAcum90d: { estado: "medido", valor: Math.round(340 + prng() * 160), fonte: "CHIRPS Diário v2.0", adquiridoEm: "2026-04-01" },
        i30Max: { estado: "medido", valor: Number((22.0 + prng() * 18.0).toFixed(1)), fonte: "GPM IMERG Final Semi-horário", adquiridoEm: "2026-04-01" },
        nEventosErosivos: { estado: "medido", valor: 1 + Math.floor(prng() * 5), fonte: "Eventos >= 10mm GPM/CHIRPS", adquiridoEm: "2026-04-01" },
        indiceMecanismo: { estado: "modelado", valor: Number((58.0 + prng() * 45.0).toFixed(1)), modelo: "Erosividade x Solo Nu Integrado", insumos: ["GPM IMERG", "Sentinel-2 Solo Nu"] },
      },
      fundiario: {
        status: "encontrado",
        codigoCar: `${uf}-41${String(10000 + idNum)}-${String(1000000000 + idNum)}`,
        titularMascarado: `PRODUTOR ${String.fromCharCode(65 + (i % 26))} **********`,
        denominacao: `Fazenda / Sítio ${municPonto} - Gleba ${idNum}`,
        municipio: municPonto,
        areaImovelHa: Number((32.0 + prng() * 180.0).toFixed(1)),
      },
      auditoria: {
        municipio: municPonto,
        uf,
        macrorregiao: nomeRegiao,
        baciaHidrografica: `Bacia Hidrográfica Regional ${uf}`,
        versaoMotorCalculo: "SAREL-v1.0-PPGTCA",
      }
    };

    pontos.push(ponto);
  }

  return pontos;
}

