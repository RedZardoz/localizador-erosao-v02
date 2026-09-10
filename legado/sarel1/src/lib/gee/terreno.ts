/**
 * ============================================================================
 * Variáveis de Terreno e Correção de Projeção Métrica — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * REFERÊNCIA TÉCNICA E JUSTIFICATIVA (PARTE IV, §6 DO PROMPT E ACHADO M5):
 * Na versão anterior, o uso de setDefaultProjection("EPSG:3857") (Web Mercator)
 * inflava a distância horizontal na latitude do Paraná (~24-26°S) em ~10%,
 * subestimando a declividade de forma sistemática.
 *
 * PROJEÇÃO MÉTRICA ADOTADA:
 * EPSG:31982 (SIRGAS 2000 / UTM Zone 22S, Paraná).
 *
 * REGRA 8 E ACHADO M1 (Verificado em 08/09/2026):
 * O fuso UTM 22S cobre 54°W a 48°W. A faixa extremo-oeste do Paraná (~54,25°W,
 * região de Guaíra/Foz) fica marginalmente fora do fuso ideal (UTM 21S),
 * apresentando uma distorção residual da ordem de 0,1% — perfeitamente
 * desprezível frente à distorção de ~10% do Web Mercator.
 * Para AOIs que se estendam além desse limite de forma expressiva, deve-se
 * aplicar reprojeção explícita por fuso.
 */

import { Proveniencia } from "@/types/proveniencia";

export const PROJECAO_METRICA_PARANA = "EPSG:31982";
export const DEM_COLECAO_PADRAO = "COPERNICUS/DEM/GLO30";

export class ErroPlausibilidadeTerreno extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroPlausibilidadeTerreno";
  }
}

/**
 * Guarda de Plausibilidade da Declividade (Parte IV, §6):
 * Rejeita valores fora de [0°, 75°]. 75° ≈ 373% já é escarpa rochosa extrema.
 * Valores próximos de 90° indicam bug severo de projeção.
 */
export function validarPlausibilidadeDeclividade(graus: number): void {
  if (!Number.isFinite(graus) || isNaN(graus)) {
    throw new ErroPlausibilidadeTerreno("Declividade inválida: valor não numérico.");
  }
  if (graus < 0 || graus > 75) {
    throw new ErroPlausibilidadeTerreno(
      `Declividade de ${graus.toFixed(2)}° fora da faixa fisicamente plausível [0°, 75°]. 75° equivale a 373% de declividade. Valores próximos de 90° indicam bug de projeção cartográfica.`
    );
  }
}

/**
 * Converte declividade de porcentagem (%) para graus decimais (°).
 */
export function converterPctParaGraus(declividadePct: number): number {
  if (declividadePct < 0) {
    throw new ErroPlausibilidadeTerreno(`Declividade em % não pode ser negativa (${declividadePct}%).`);
  }
  const rad = Math.atan(declividadePct / 100);
  const graus = Number((rad * (180 / Math.PI)).toFixed(2));
  validarPlausibilidadeDeclividade(graus);
  return graus;
}

/**
 * Converte declividade de graus decimais (°) para porcentagem (%).
 */
export function converterGrausParaPct(declividadeGraus: number): number {
  validarPlausibilidadeDeclividade(declividadeGraus);
  const rad = (declividadeGraus * Math.PI) / 180;
  const pct = Number((Math.tan(rad) * 100).toFixed(2));
  return pct;
}

/**
 * Calcula o Índice Topográfico de Umidade (TWI — Topographic Wetness Index):
 * TWI = ln(As / tan(beta))
 * Onde As é a área de contribuição por largura de contorno (m²/m) e beta é a declividade em radianos.
 * Referência: Moore & Burch (1986).
 */
export function calcularTWI(
  acumuloFluxoPixels: number,
  declividadeGraus: number,
  resolucaoPixelMetros: number = 30
): number {
  if (acumuloFluxoPixels < 0) {
    throw new Error("Acúmulo de fluxo não pode ser negativo.");
  }
  validarPlausibilidadeDeclividade(declividadeGraus);

  // Guarda para evitar divisão por zero em declividade plana
  const declivMinimaGraus = Math.max(declividadeGraus, 0.1);
  const betaRad = (declivMinimaGraus * Math.PI) / 180;

  // As (m²/m) = pixels de acúmulo * resolução métrica da célula
  const areaContribuicaoAs = Math.max(acumuloFluxoPixels, 1) * resolucaoPixelMetros;
  const tanBeta = Math.tan(betaRad);

  const twi = Math.log(areaContribuicaoAs / tanBeta);
  return Number(twi.toFixed(2));
}

export interface InsumosTerrenoBrutos {
  elevacao: number | null;
  declividadePct: number | null;
  curvaturaPerfil: number | null;
  curvaturaPlana: number | null;
  acumuloFluxo: number | null;
  dataAdquisicao?: string;
  projecao?: string;
}

/**
 * Constrói o bloco científico 'terreno' com garantia estrita de proveniência e plausibilidade.
 */
export function construirBlocoTerreno(insumos: InsumosTerrenoBrutos) {
  const dataHoje = insumos.dataAdquisicao || new Date().toISOString().split("T")[0];
  const proj = insumos.projecao || PROJECAO_METRICA_PARANA;
  const detalhe = `Projeção métrica local ${proj}`;

  // Elevação
  const elevacao: Proveniencia<number> = insumos.elevacao !== null && Number.isFinite(insumos.elevacao)
    ? { estado: "medido", valor: insumos.elevacao, fonte: DEM_COLECAO_PADRAO, adquiridoEm: dataHoje, detalhe }
    : { estado: "indisponivel", motivo: "Elevação não obtida do DEM." };

  // Declividade %
  let declividadePct: Proveniencia<number>;
  let declividadeGraus: Proveniencia<number>;

  if (insumos.declividadePct !== null && Number.isFinite(insumos.declividadePct)) {
    try {
      const graus = converterPctParaGraus(insumos.declividadePct);
      declividadePct = {
        estado: "medido",
        valor: insumos.declividadePct,
        fonte: DEM_COLECAO_PADRAO,
        adquiridoEm: dataHoje,
        detalhe,
      };
      declividadeGraus = {
        estado: "modelado",
        valor: graus,
        modelo: "atan(declividadePct / 100) em graus",
        insumos: ["declividadePct"],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      declividadePct = { estado: "indisponivel", motivo: msg };
      declividadeGraus = { estado: "indisponivel", motivo: msg };
    }
  } else {
    declividadePct = { estado: "indisponivel", motivo: "Declividade ausente no DEM." };
    declividadeGraus = { estado: "indisponivel", motivo: "Declividade ausente no DEM." };
  }

  // Curvaturas
  const curvaturaPerfil: Proveniencia<number> = insumos.curvaturaPerfil !== null && Number.isFinite(insumos.curvaturaPerfil)
    ? { estado: "medido", valor: insumos.curvaturaPerfil, fonte: DEM_COLECAO_PADRAO, adquiridoEm: dataHoje, detalhe }
    : { estado: "indisponivel", motivo: "Curvatura de perfil não obtida." };

  const curvaturaPlana: Proveniencia<number> = insumos.curvaturaPlana !== null && Number.isFinite(insumos.curvaturaPlana)
    ? { estado: "medido", valor: insumos.curvaturaPlana, fonte: DEM_COLECAO_PADRAO, adquiridoEm: dataHoje, detalhe }
    : { estado: "indisponivel", motivo: "Curvatura plana não obtida." };

  // Acúmulo de Fluxo
  const acumuloFluxo: Proveniencia<number> = insumos.acumuloFluxo !== null && Number.isFinite(insumos.acumuloFluxo)
    ? { estado: "medido", valor: insumos.acumuloFluxo, fonte: DEM_COLECAO_PADRAO, adquiridoEm: dataHoje, detalhe }
    : { estado: "indisponivel", motivo: "Acúmulo de fluxo não obtido." };

  // TWI
  let twi: Proveniencia<number>;
  if (acumuloFluxo.estado === "medido" && declividadeGraus.estado === "modelado") {
    const valorTwi = calcularTWI(acumuloFluxo.valor, declividadeGraus.valor, 30);
    twi = {
      estado: "modelado",
      valor: valorTwi,
      modelo: "ln(As / tan(beta)) (Moore & Burch, 1986)",
      insumos: ["acumuloFluxo", "declividadeGraus"],
    };
  } else {
    twi = {
      estado: "indisponivel",
      motivo: "TWI requer acúmulo de fluxo e declividade válidos.",
    };
  }

  return {
    elevacao,
    declividadePct,
    declividadeGraus,
    curvaturaPerfil,
    curvaturaPlana,
    acumuloFluxo,
    twi,
  };
}
