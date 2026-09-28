import { describe, it, expect } from "vitest";
import { CRS_TERRENO_PADRAO, grausParaPct, pctParaGraus, calcularTwi } from "./terreno";

describe("Cálculo e Conversão de Declividade (Invariante 2)", () => {
  it("deve converter 0° em 0%", () => {
    expect(grausParaPct(0)).toBe(0);
  });

  it("deve converter 45° exatamente em 100% de declividade", () => {
    expect(grausParaPct(45)).toBeCloseTo(100, 5);
  });

  it("deve converter de volta 100% para 45°", () => {
    expect(pctParaGraus(100)).toBeCloseTo(45, 5);
  });

  it("deve lançar erro para declividade implausível acima de 75°", () => {
    expect(() => grausParaPct(75.1)).toThrow(/fisicamente implausível/);
    expect(() => grausParaPct(90)).toThrow(/fisicamente implausível/);
  });
});

describe("Cálculo do Topographic Wetness Index (TWI)", () => {
  it("deve calcular TWI corretamente para valores nominais positivos", () => {
    // a = 1000 m², declividade = 10°
    const twi = calcularTwi(1000, 10);
    expect(twi.estado).toBe("modelado");
    if (twi.estado === "modelado") {
      expect(twi.valor).toBeGreaterThan(0);
      expect(twi.modelo).toContain("TWI");
    }
  });

  it("deve retornar indisponivel com causa fora-do-dominio para declividade 0° (Invariante 5)", () => {
    const twi = calcularTwi(1000, 0);
    expect(twi.estado).toBe("indisponivel");
    if (twi.estado === "indisponivel") {
      expect(twi.causa).toBe("fora-do-dominio");
      expect(twi.motivo).toContain("divisão por zero");
    }
  });

  it("deve retornar indisponivel com causa fora-do-dominio para área <= 0", () => {
    const twi = calcularTwi(0, 15);
    expect(twi.estado).toBe("indisponivel");
    if (twi.estado === "indisponivel") {
      expect(twi.causa).toBe("fora-do-dominio");
    }
  });

  it("deve retornar indisponivel com causa fora-do-dominio para declividade > 75°", () => {
    const twi = calcularTwi(1000, 80);
    expect(twi.estado).toBe("indisponivel");
    if (twi.estado === "indisponivel") {
      expect(twi.causa).toBe("fora-do-dominio");
    }
  });

  it("deve retornar indisponivel com causa fora-do-dominio para NaN", () => {
    const twi = calcularTwi(NaN, 10);
    expect(twi.estado).toBe("indisponivel");
    if (twi.estado === "indisponivel") {
      expect(twi.causa).toBe("fora-do-dominio");
    }
  });
});

describe("Verificação de Distorção Linear da Projeção EPSG:31982 na Bacia do Paraná 3 (Decisão D15)", () => {
  // Parâmetros oficiais do elipsoide GRS80 (SIRGAS 2000) e UTM 22S (EPSG:31982)
  const A_GRS80 = 6378137.0;
  const F_GRS80 = 1 / 298.257222101;
  const B_GRS80 = A_GRS80 * (1 - F_GRS80);
  const E2 = 2 * F_GRS80 - F_GRS80 * F_GRS80;
  const EP2 = E2 / (1 - E2);
  const K0 = 0.9996;
  const LON0_RAD = (-51.0 * Math.PI) / 180;

  function projetarEpsg31982(latDeg: number, lonDeg: number): { x: number; y: number } {
    const phi = (latDeg * Math.PI) / 180;
    const lam = (lonDeg * Math.PI) / 180;
    const dlam = lam - LON0_RAD;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const tanPhi = Math.tan(phi);
    const T = tanPhi * tanPhi;
    const C = EP2 * cosPhi * cosPhi;
    const A = cosPhi * dlam;
    const N = A_GRS80 / Math.sqrt(1 - E2 * sinPhi * sinPhi);
    const e4 = E2 * E2;
    const e6 = e4 * E2;
    const M =
      A_GRS80 *
      ((1 - E2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * phi -
        ((3 * E2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * phi) +
        ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * phi) -
        ((35 * e6) / 3072) * Math.sin(6 * phi));

    const x =
      500000 +
      K0 *
        N *
        (A +
          ((1 - T + C) * Math.pow(A, 3)) / 6 +
          ((5 - 18 * T + T * T + 72 * C - 58 * EP2) * Math.pow(A, 5)) / 120);
    const y =
      10000000 +
      K0 *
        (M +
          N *
            tanPhi *
            ((A * A) / 2 +
              ((5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4)) / 24 +
              ((61 - 58 * T + T * T + 600 * C - 330 * EP2) * Math.pow(A, 6)) / 720));
    return { x, y };
  }

  function comprimentoGeodesicoGrs80(
    lat1Deg: number,
    lon1Deg: number,
    lat2Deg: number,
    lon2Deg: number
  ): number {
    const phi1 = (lat1Deg * Math.PI) / 180;
    const phi2 = (lat2Deg * Math.PI) / 180;
    const L = ((lon2Deg - lon1Deg) * Math.PI) / 180;
    const U1 = Math.atan((1 - F_GRS80) * Math.tan(phi1));
    const U2 = Math.atan((1 - F_GRS80) * Math.tan(phi2));
    const sinU1 = Math.sin(U1);
    const cosU1 = Math.cos(U1);
    const sinU2 = Math.sin(U2);
    const cosU2 = Math.cos(U2);

    let lambda = L;
    let lambdaP = 0;
    let iterLimit = 100;
    let cosSqAlpha = 0;
    let sinSigma = 0;
    let cos2SigmaM = 0;
    let cosSigma = 0;
    let sigma = 0;

    do {
      const sinLambda = Math.sin(lambda);
      const cosLambda = Math.cos(lambda);
      sinSigma = Math.sqrt(
        cosU2 * sinLambda * (cosU2 * sinLambda) +
          (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) *
            (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda)
      );
      if (sinSigma === 0) return 0;
      cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
      sigma = Math.atan2(sinSigma, cosSigma);
      const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
      cosSqAlpha = 1 - sinAlpha * sinAlpha;
      cos2SigmaM = cosSqAlpha !== 0 ? cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha : 0;
      const C = (F_GRS80 / 16) * cosSqAlpha * (4 + F_GRS80 * (4 - 3 * cosSqAlpha));
      lambdaP = lambda;
      lambda =
        L +
        (1 - C) *
          F_GRS80 *
          sinAlpha *
          (sigma +
            C *
              sinSigma *
              (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

    const uSq = (cosSqAlpha * (A_GRS80 * A_GRS80 - B_GRS80 * B_GRS80)) / (B_GRS80 * B_GRS80);
    const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    const deltaSigma =
      B *
      sinSigma *
      (cos2SigmaM +
        (B / 4) *
          (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
            (B / 6) *
              cos2SigmaM *
              (-3 + 4 * sinSigma * sinSigma) *
              (-3 + 4 * cos2SigmaM * cos2SigmaM)));
    return B_GRS80 * A * (sigma - deltaSigma);
  }

  const SEGMENTOS_BP3 = [
    { id: "S01", lat1: -25.4631, lon1: -54.6199, lat2: -25.4631, lon2: -54.6099 },
    { id: "S02", lat1: -25.4631, lon1: -54.6199, lat2: -25.4531, lon2: -54.6199 },
    { id: "S03", lat1: -25.4631, lon1: -54.6199, lat2: -25.4551, lon2: -54.6099 },
    { id: "S04", lat1: -25.5161, lon1: -54.6011, lat2: -25.5081, lon2: -54.5911 },
    { id: "S05", lat1: -25.5825, lon1: -54.5881, lat2: -25.5725, lon2: -54.5781 },
    { id: "S06", lat1: -25.3511, lon1: -54.4875, lat2: -25.3411, lon2: -54.4775 },
    { id: "S07", lat1: -25.2528, lon1: -54.4322, lat2: -25.2428, lon2: -54.4222 },
    { id: "S08", lat1: -25.0844, lon1: -54.3958, lat2: -25.0744, lon2: -54.3858 },
    { id: "S09", lat1: -24.8531, lon1: -54.3622, lat2: -24.8431, lon2: -54.3522 },
    { id: "S10", lat1: -24.6961, lon1: -54.3164, lat2: -24.6861, lon2: -54.3064 },
    { id: "S11", lat1: -24.5133, lon1: -54.3156, lat2: -24.5033, lon2: -54.3056 },
    { id: "S12", lat1: -24.2819, lon1: -54.2906, lat2: -24.2719, lon2: -54.2806 },
    { id: "S13", lat1: -24.0611, lon1: -54.2586, lat2: -24.0511, lon2: -54.2486 },
    { id: "S14", lat1: -24.1600, lon1: -53.8600, lat2: -24.1500, lon2: -53.8500 },
    { id: "S15", lat1: -24.6200, lon1: -53.7100, lat2: -24.6100, lon2: -53.7000 },
    { id: "S16", lat1: -24.7250, lon1: -53.7400, lat2: -24.7150, lon2: -53.7300 },
    { id: "S17", lat1: -25.1500, lon1: -53.8500, lat2: -25.1400, lon2: -53.8400 },
    { id: "S18", lat1: -24.9558, lon1: -53.4550, lat2: -24.9458, lon2: -53.4450 },
    { id: "S19", lat1: -25.0800, lon1: -53.6200, lat2: -25.0700, lon2: -53.6100 },
    { id: "S20", lat1: -25.3800, lon1: -54.0500, lat2: -25.3700, lon2: -54.0400 },
  ];

  const avaliacoes = SEGMENTOS_BP3.map((seg) => {
    const p1 = projetarEpsg31982(seg.lat1, seg.lon1);
    const p2 = projetarEpsg31982(seg.lat2, seg.lon2);
    const compProj = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const compGeo = comprimentoGeodesicoGrs80(seg.lat1, seg.lon1, seg.lat2, seg.lon2);
    const distorcaoPct = ((compProj - compGeo) / compGeo) * 100;
    const afastamentoEixoCentralM = Math.abs((p1.x + p2.x) / 2 - 500000);
    return { ...seg, compProj, compGeo, distorcaoPct, afastamentoEixoCentralM };
  });

  it("deve manter CRS_TERRENO_PADRAO igual a EPSG:31982 e distorção máxima estritamente inferior a 0,5% (D15)", () => {
    expect(CRS_TERRENO_PADRAO).toBe("EPSG:31982");
    expect(avaliacoes).toHaveLength(20);
    const maxAbsPct = Math.max(...avaliacoes.map((a) => Math.abs(a.distorcaoPct)));
    expect(maxAbsPct).toBeLessThan(0.5);
  });

  it("deve apresentar sinal de distorção estritamente positivo em todos os 20 segmentos da bacia (> 1,79° a oeste de -51°W)", () => {
    for (const a of avaliacoes) {
      expect(a.distorcaoPct).toBeGreaterThan(0);
    }
  });

  it("deve exibir crescimento monotônico da distorção linear com a distância transversal ao meridiano central (-51°W)", () => {
    const ordenadosPorDistancia = [...avaliacoes].sort(
      (a, b) => a.afastamentoEixoCentralM - b.afastamentoEixoCentralM
    );
    for (let i = 1; i < ordenadosPorDistancia.length; i++) {
      const anterior = ordenadosPorDistancia[i - 1];
      const atual = ordenadosPorDistancia[i];
      // Quando o afastamento transversal cresce de forma significativa (> 500 m),
      // o fator de escala secante k = k0 * (1 + dE² / (2 * R²)) cresce estritamente.
      if (atual.afastamentoEixoCentralM - anterior.afastamentoEixoCentralM > 500) {
        expect(atual.distorcaoPct).toBeGreaterThan(anterior.distorcaoPct);
      }
    }
  });
});

