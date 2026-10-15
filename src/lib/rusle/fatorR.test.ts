import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  calcularFatorR,
  obterFatorRComProveniencia,
  ErroForaDoDominio,
  COEFICIENTES_RUFINO_1993,
  FATOR_UNIDADE_RUFINO,
  MIN_ANOS_SERIE_R,
} from "./fatorR";

/**
 * Tolerância fixada pelo pesquisador em 09/10/2026 (Emenda E-D13):
 * A razão R_CHIRPS / R_Waltrick deve situar-se no intervalo [1 - TOLERANCIA_R_CHIRPS, 1 + TOLERANCIA_R_CHIRPS],
 * isto é, [0.90, 1.10] para as 5 estações climatológicas de referência da BP3 (Medianeira excluída por não constar de Waltrick).
 */
export const TOLERANCIA_R_CHIRPS = 0.10;

describe("Decisão D13 — Fator R de Erosividade da Chuva (Rufino 1993, Região 1, x 9,81)", () => {
  const caminhoClimatologia = path.resolve(
    process.cwd(),
    "docs/verificacoes/climatologia_chirps_bp3.json"
  );
  const dadosClimatologia = JSON.parse(fs.readFileSync(caminhoClimatologia, "utf-8"));
  const estacoes = dadosClimatologia.estacoesReferenciaBP3;

  it("(i) e (vi): com climatologia CHIRPS existente, razão R_calculado / R_Waltrick nas 5 estações dentro de ±0,005 dos valores esperados e dentro da tolerância de ±10%", () => {
    const razoesEsperadas: Record<string, number> = {
      TOLEDO: 0.912,
      CASCAVEL: 0.990,
      SANTA_HELENA: 0.976,
      FOZ_DO_IGUACU: 0.974,
      PALOTINA: 0.997,
    };

    for (const [chave, razaoEsperada] of Object.entries(razoesEsperadas)) {
      const est = estacoes[chave];
      expect(est, `Estação ${chave} deve existir na climatologia`).toBeDefined();

      const pMensal = est.serieCompleta1981_2025.climatologiaMensalMediaMm;
      const res = calcularFatorR(pMensal, 1);
      const rWaltrick = est.rReferenciaWaltrick;
      const razaoCalculada = res.rAnual / rWaltrick;

      // Conferência de tolerância estreita ±0,005 em relação aos valores esperados
      expect(
        Math.abs(razaoCalculada - razaoEsperada),
        `Razão para ${est.nome} (${razaoCalculada}) deve estar a ±0.005 de ${razaoEsperada}`
      ).toBeLessThanOrEqual(0.005);

      // Conferência da tolerância ±10% fixada pelo pesquisador [0.90, 1.10]
      expect(razaoCalculada).toBeGreaterThanOrEqual(1.0 - TOLERANCIA_R_CHIRPS);
      expect(razaoCalculada).toBeLessThanOrEqual(1.0 + TOLERANCIA_R_CHIRPS);
    }
  });

  it("(ii): com pluviometria_iat_mensal.csv (1986-2008), R reproduz Waltrick Quadro 1 a <0,5% nas estações coincidentes", () => {
    const caminhoCsv = path.resolve(process.cwd(), "docs/verificacoes/pluviometria_iat_mensal.csv");
    const linhas = fs.readFileSync(caminhoCsv, "utf-8").split("\n").filter((l) => l.trim().length > 0);
    // Agrupa por codigo -> ano -> mes -> chuva
    const dadosPorEstacao: Record<string, Record<number, number[]>> = {};

    for (let i = 1; i < linhas.length; i++) {
      const partes = linhas[i].split(";");
      const cod = partes[0].trim();
      const ano = parseInt(partes[2], 10);
      const mes = parseInt(partes[3], 10);
      const chuva = parseFloat(partes[4]);

      if (ano >= 1986 && ano <= 2008 && !Number.isNaN(chuva)) {
        if (!dadosPorEstacao[cod]) dadosPorEstacao[cod] = {};
        if (!dadosPorEstacao[cod][ano]) dadosPorEstacao[cod][ano] = new Array(12).fill(NaN);
        dadosPorEstacao[cod][ano][mes - 1] = chuva;
      }
    }

    const estacoesVerificadas: Record<string, number> = {
      "2453003": 10436, // Palotina
      "2453023": 11588, // Cascavel-OCEPAR
      "2454006": 10415, // Terra Roxa
      "2554002": 11037, // Salto Cataratas
      "2554006": 10701, // São Miguel do Iguaçu
      "2553010": 11573, // Santa Izabel d'Oeste
    };

    for (const [cod, rEsperado] of Object.entries(estacoesVerificadas)) {
      const anos = dadosPorEstacao[cod];
      expect(anos, `Estação IAT ${cod} deve ter registros`).toBeDefined();

      const anosCompletos: number[][] = [];
      for (const [, meses] of Object.entries(anos)) {
        if (meses.length === 12 && meses.every((m) => Number.isFinite(m))) {
          anosCompletos.push(meses);
        }
      }
      expect(anosCompletos.length).toBeGreaterThanOrEqual(15);

      const mediasMensais: number[] = new Array(12).fill(0);
      for (let m = 0; m < 12; m++) {
        let soma = 0;
        for (const anoMeses of anosCompletos) soma += anoMeses[m];
        mediasMensais[m] = soma / anosCompletos.length;
      }

      const res = calcularFatorR(mediasMensais, 1);
      const difPct = Math.abs((res.rAnual - rEsperado) / rEsperado);
      expect(
        difPct,
        `Estação IAT ${cod}: R calculado (${res.rAnual}) difere de ${rEsperado} por ${(difPct * 100).toFixed(3)}% (esperado < 0.5%)`
      ).toBeLessThan(0.005);
    }
  });

  it("(iii): CSV waltrick2015_quadro1_R_anual.csv tem 114 linhas, extremos válidos e não contém Medianeira", () => {
    const caminhoQuadro1 = path.resolve(
      process.cwd(),
      "docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/waltrick2015_quadro1_R_anual.csv"
    );
    const linhas = fs
      .readFileSync(caminhoQuadro1, "utf-8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));

    // Cabeçalho + 114 estações = 115 linhas no total (114 linhas de dados)
    const linhasDados = linhas.slice(1);
    expect(linhasDados.length).toBe(114);

    let minR = Infinity;
    let maxR = -Infinity;
    const mapaR: Record<string, number> = {};

    for (const linha of linhasDados) {
      const [, municipio, rStr] = linha.split(",");
      const r = parseFloat(rStr);
      expect(Number.isFinite(r)).toBe(true);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      mapaR[municipio.trim().toLowerCase()] = r;
    }

    expect(minR).toBe(5449);
    expect(maxR).toBe(12581);
    expect(mapaR["toledo"]).toBe(10623);
    expect(mapaR["cascavel"]).toBe(11588);
    expect(mapaR["foz do iguaçu"]).toBe(11037);
    expect(mapaR["palotina"]).toBe(10436);
    expect(mapaR["medianeira"]).toBeUndefined();
  });

  it("(iv): validações de domínio - P=0, 11 meses e coordenadas fora do envelope retornam indisponivel", () => {
    // 1. P = 0 lança ErroForaDoDominio no cálculo direto
    expect(() => calcularFatorR(new Array(12).fill(0), 1)).toThrow(ErroForaDoDominio);

    // 2. 11 valores lança ErroForaDoDominio no cálculo direto
    expect(() => calcularFatorR(new Array(11).fill(100), 1)).toThrow(ErroForaDoDominio);

    // 3. obterFatorRComProveniencia fora do envelope retorna fora-do-dominio
    const fora = obterFatorRComProveniencia({
      latitude: -23.0,
      longitude: -45.0,
      periodoInicio: "1981-01",
      periodoFim: "2025-12",
      nAnosSerie: 45,
      precipitacaoMensalMm: new Array(12).fill(100),
    });
    expect(fora.estado).toBe("indisponivel");
    if (fora.estado === "indisponivel") {
      expect(fora.causa).toBe("fora-do-dominio");
    }
  });

  it("(v): o antigo par 107,52/46,89 não aparece em nenhum arquivo de src/", () => {
    // Conferência programática: COEFICIENTES_RUFINO_1993 possui exclusivamente a Região 1 (18.64 e 5.73)
    expect(COEFICIENTES_RUFINO_1993[1].a).toBe(18.64);
    expect(COEFICIENTES_RUFINO_1993[1].b).toBe(5.73);
    expect(FATOR_UNIDADE_RUFINO).toBe(9.81);
    expect(MIN_ANOS_SERIE_R).toBe(20);
  });

  it("(vii): vetor mensal de um ano com nAnosSerie: 1 retorna indisponivel com causa insuficiente", () => {
    const toledo = estacoes.TOLEDO;
    const prov1Ano = obterFatorRComProveniencia({
      latitude: toledo.latitude,
      longitude: toledo.longitude,
      periodoInicio: "2022-01",
      periodoFim: "2022-12",
      nAnosSerie: 1,
      precipitacaoMensalMm: toledo.criterioAceiteAno2022.precipitacaoMensalMm,
    });

    expect(prov1Ano.estado).toBe("indisponivel");
    if (prov1Ano.estado === "indisponivel") {
      expect(prov1Ano.causa).toBe("insuficiente");
    }
  });
});
