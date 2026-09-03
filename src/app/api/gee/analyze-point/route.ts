import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeRealVariablesForPoint } from "@/lib/gee/earthEngineClient";
import { estimateRainfallErosivity } from "@/lib/rusle/rainfallErosivity";
import { getKFactorRealOrApproximate } from "@/lib/rusle/soilErodibility";
import { getGeeSession, GEE_SESSION_COOKIE } from "@/lib/gee/sessionStore";
import { GEE_CALC_ENGINE_VERSION } from "@/lib/gee/calcEngineVersion";
import {
  calculateCFactor,
  calculateLSFactor,
  calculatePriorityScore,
  calculateSeverity,
  calculateSoilLossRUSLE,
} from "@/lib/rusle/rusleCalculator";
import { matchRuralProperty } from "@/lib/fundiario/spatialMatcher";

/**
 * ============================================================================
 * Rota de Análise Biofísica e Sensoriamento Remoto Pontual via Earth Engine
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * SERVIDORES EXTERNOS ACESSADOS:
 * 1. Google Earth Engine (Google Cloud Platform)
 *    - Sentinel-2 SR Harmonized L2A (B12, B8, B4, B2, SCL) -> BSI e NDVI (README §2.1)
 *    - Copernicus DEM GLO-30 -> Declividade e Altitude Ortométrica (README §2.2)
 *    - WWF HydroSHEDS 15ACC -> Área de contribuição específica para Fator LS (README §2.2.C)
 * 2. NASA POWER API
 *    - Climatologia MERRA-2 (Precipitação mensal PRECTOTCORR) -> Fator R (README §2.4)
 * 3. ISRIC SoilGrids REST API
 *    - Frações de areia, silte, argila e carbono orgânico -> Fator K (README §2.3)
 *
 * MODELAGEM CIENTÍFICA APLICADA:
 * - RUSLE: A = R · K · LS · C · P [t·ha⁻¹·ano⁻¹] (README §2.5)
 * - Severidade: Φ = (S% × 0.40) + (BSI × 50.0) + Ψ_solo (README §3.1)
 * - Prioridade Top-N: PriorityScore = min(100, max(10, Round(Ω_base + (BSI × 25.0) + (θ × 1.20)))) (README §3.2)
 */

const RequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  soilType: z.string().min(1),
  conservationPracticeFactor: z.number().min(0.2).max(1.0).optional(),
});

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get(GEE_SESSION_COOKIE)?.value;
  const credentials = getGeeSession(sessionId);
  if (!credentials) {
    return NextResponse.json(
      {
        success: false,
        error: "Nenhuma sessão do Earth Engine ativa (ou ela expirou). Configure a Service Account em Configurações → GEE Service Account.",
      },
      { status: 401 }
    );
  }

  let parsed;
  try {
    const body = await req.json();
    parsed = RequestSchema.parse(body);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Requisição inválida: ${err.message || err}` },
      { status: 400 }
    );
  }

  const { latitude, longitude, soilType, conservationPracticeFactor } = parsed;
  const p = conservationPracticeFactor ?? 1.0;

  try {
    // Consulta paralela aos servidores externos (GEE, NASA POWER, SoilGrids) e base fundiária local (CAR/SNCR)
    const [satellite, rainfall, kResult, ruralProperty] = await Promise.all([
      computeRealVariablesForPoint(credentials, latitude, longitude),
      estimateRainfallErosivity(latitude, longitude),
      getKFactorRealOrApproximate(latitude, longitude, soilType),
      matchRuralProperty(latitude, longitude),
    ]);

    // Aplicação das equações da RUSLE e Fatores de Manejo e Relevo
    const cFactor = calculateCFactor(satellite.ndvi, satellite.bsi);
    const lsFactor = calculateLSFactor(satellite.specificCatchmentAreaM2PerM, satellite.slopeDegrees);
    const soilLoss = calculateSoilLossRUSLE(rainfall.rFactor, kResult.kFactor, lsFactor, cFactor, p);

    // Classificação de Severidade e Ranqueamento de Prioridade (README §3.1 e §3.2)
    const { severity } = calculateSeverity(satellite.slopePercent, satellite.bsi, soilType);
    const priorityScore = calculatePriorityScore(severity, satellite.bsi, satellite.slopeDegrees, 0);

    return NextResponse.json({
      success: true,
      data: {
        elevation: satellite.elevation,
        slopePercent: satellite.slopePercent,
        slopeDegrees: satellite.slopeDegrees,
        bsi: satellite.bsi,
        ndvi: satellite.ndvi,
        severity,
        estimatedSoilLoss: soilLoss,
        priorityScore,
        dataProvenance: "satellite-derived",
        geeSourceImageId: satellite.sentinelSceneId,
        geeComputedAt: new Date().toISOString(),
        calcEngineVersion: satellite.calcEngineVersion || GEE_CALC_ENGINE_VERSION,
        carCode: ruralProperty?.carCode,
        propertyName: ruralProperty?.propertyName,
        ownerName: ruralProperty?.ownerName,
        incraRegistry: ruralProperty?.incraRegistry,
        propertyAreaHa: ruralProperty?.propertyAreaHa,
        ownerDocumentMasked: ruralProperty?.ownerDocumentMasked,
        rusleFactors: {
          r: rainfall.rFactor,
          k: kResult.kFactor,
          ls: lsFactor,
          c: cFactor,
          p,
        },
        diagnostics: {
          sentinelSceneDate: satellite.sentinelSceneDate,
          cloudyPixelPercentage: satellite.cloudyPixelPercentage,
          annualPrecipitationMm: rainfall.annualPrecipitationMm,
          kFactorSusceptibility: kResult.susceptibility,
          kFactorSource: kResult.source,
          lsFactorApproximated: satellite.lsApproximated,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Falha ao consultar Earth Engine / APIs meteorológicas: ${err.message || err}` },
      { status: 502 }
    );
  }
}
