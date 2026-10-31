/**
 * ============================================================================
 * Fonte Única de Parâmetros e Cálculo de Deflação Espacial (GOV-3 / D16 / D24)
 * SAREL v2.0 — Disciplina de Integridade Epistemológica (Regra 1 / R-L4)
 * ============================================================================
 *
 * Fornece a derivação matemática canônica das unidades efetivas espacialmente
 * independentes a partir da geometria declarada em D16 e dos alcances físicos
 * de autocorrelação pré-registrados em D24.
 *
 * Fórmula bidimensional isotrópica canônica:
 *   A_bloco = π · (a / 2)²
 *   n_ef = round(A / A_bloco)
 *
 * Provisoriedade dos alcances (R-L4):
 *   Tanto o alcance de 50 m (espectro-temporal) quanto o de 100 m (terreno)
 *   são valores de planejamento pré-registrados (P01), com compromisso formal
 *   em D24 de substituição pelos variogramas empíricos correspondentes quando
 *   a delineação vetorial de campo/VANT estiver concluída.
 */

import { DECISOES, exigirParametro } from "./decisoes";
import canonicalData from "../../data/PARAMETROS_DEFLACAO.json";

export interface ResultadoCalculoDeflacao {
  raioMetros: number;
  suporteM2: number;
  suporteHa: number;
  unidadesEfetivasPorPoligono: number;
  unidadesEfetivasTotal: number;
  unidadesEfetivasHeldOut: number;
}

export interface ParametrosDeflacaoConsolidados {
  areaPoligonoHa: number;
  totalPoligonos: number;
  areaTotalHa: number;
  poligonosHeldOut: number;
  areaHeldOutHa: number;
  espectroTemporal: ResultadoCalculoDeflacao & {
    alcanceMetros: number;
    tetoPreditores: number;
  };
  terreno: ResultadoCalculoDeflacao & {
    alcanceMetros: number;
    tetoPreditores: number;
  };
  solo: {
    tetoPreditores: number;
  };
  chuva: {
    tetoPreditores: number;
  };
  tetoTotalMatriz: number;
}

/**
 * Calcula a deflação espacial para uma dada área total e alcance físico.
 */
export function calcularUnidadesEfetivas(
  areaTotalHa: number,
  areaHeldOutHa: number,
  totalPoligonos: number,
  alcanceMetros: number
): ResultadoCalculoDeflacao {
  const raioMetros = alcanceMetros / 2;
  const suporteM2 = Math.PI * raioMetros * raioMetros;
  const suporteHa = suporteM2 / 10000;

  const areaTotalM2 = areaTotalHa * 10000;
  const areaHeldOutM2 = areaHeldOutHa * 10000;

  const unidadesEfetivasTotal = Math.round(areaTotalM2 / suporteM2);
  const unidadesEfetivasHeldOut = Math.round(areaHeldOutM2 / suporteM2);
  const unidadesEfetivasPorPoligono = Number(
    (areaTotalM2 / suporteM2 / totalPoligonos).toFixed(2)
  );

  return {
    raioMetros,
    suporteM2: Number(suporteM2.toFixed(4)),
    suporteHa: Number(suporteHa.toFixed(5)),
    unidadesEfetivasPorPoligono,
    unidadesEfetivasTotal,
    unidadesEfetivasHeldOut,
  };
}

/**
 * Obtém os parâmetros consolidados derivados diretamente de DECISOES.D16 e DECISOES.D24.
 */
export function obterParametrosDeflacao(): ParametrosDeflacaoConsolidados {
  const totalPoligonos = exigirParametro(DECISOES.D16, "totalPoligonos").valor;
  const areaPoligonoHa = exigirParametro(DECISOES.D16, "areaPoligonoHa").valor;
  const poligonosHeldOut = exigirParametro(DECISOES.D16, "poligonosHeldOut").valor;

  const areaTotalHa = Number((totalPoligonos * areaPoligonoHa).toFixed(2));
  const areaHeldOutHa = Number((poligonosHeldOut * areaPoligonoHa).toFixed(2));

  const alcanceET = exigirParametro(
    DECISOES.D24,
    "alcanceEspectroTemporalMetros"
  ).valor;
  const tetoET = exigirParametro(DECISOES.D24, "tetoEspectroTemporal").valor;

  const alcanceTerreno = exigirParametro(
    DECISOES.D24,
    "alcanceTerrenoMetros"
  ).valor;
  const tetoTerreno = exigirParametro(DECISOES.D24, "tetoTerreno").valor;

  const tetoSolo = exigirParametro(DECISOES.D24, "tetoSolo").valor;
  const tetoChuva = exigirParametro(DECISOES.D24, "tetoChuva").valor;
  const tetoTotal = exigirParametro(DECISOES.D24, "tetoTotal").valor;

  const defET = calcularUnidadesEfetivas(
    areaTotalHa,
    areaHeldOutHa,
    totalPoligonos,
    alcanceET
  );
  const defTerreno = calcularUnidadesEfetivas(
    areaTotalHa,
    areaHeldOutHa,
    totalPoligonos,
    alcanceTerreno
  );

  return {
    areaPoligonoHa,
    totalPoligonos,
    areaTotalHa,
    poligonosHeldOut,
    areaHeldOutHa,
    espectroTemporal: {
      ...defET,
      alcanceMetros: alcanceET,
      tetoPreditores: tetoET,
    },
    terreno: {
      ...defTerreno,
      alcanceMetros: alcanceTerreno,
      tetoPreditores: tetoTerreno,
    },
    solo: {
      tetoPreditores: tetoSolo,
    },
    chuva: {
      tetoPreditores: tetoChuva,
    },
    tetoTotalMatriz: tetoTotal,
  };
}

export { canonicalData };
