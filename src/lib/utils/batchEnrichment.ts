import { ErosionPoint } from "@/types/erosion";
import {
  calculateCFactor,
  calculateLSFactor,
  calculateSoilLossRUSLE,
} from "@/lib/rusle/rusleCalculator";
import { K_FACTOR_TABLE } from "@/lib/rusle/soilErodibility";

export interface BatchEnrichmentOptions {
  calculateRusle: boolean;
  queryTenure: boolean;
  forceRefresh?: boolean;
}

export type BatchProgressCallback = (
  current: number,
  total: number,
  message: string
) => void;

/**
 * Resolve o Fator K de erodibilidade com base na ordem SiBCS ou tabela regional ponderada.
 */
export function resolveKFactorForPoint(soilType?: string): { kFactor: number; approximated: boolean } {
  if (!soilType) {
    return { kFactor: 0.03, approximated: true };
  }

  const sLower = soilType.toLowerCase();
  for (const [key, entry] of Object.entries(K_FACTOR_TABLE)) {
    if (sLower.includes(key.toLowerCase()) || key.toLowerCase().includes(sLower)) {
      return { kFactor: entry.mean, approximated: false };
    }
  }

  if (sLower.includes("latossolo")) {
    return { kFactor: 0.02, approximated: true };
  }
  if (sLower.includes("argissolo")) {
    return { kFactor: 0.0465, approximated: true };
  }
  if (sLower.includes("neossolo")) {
    return { kFactor: 0.04, approximated: true };
  }
  if (sLower.includes("cambissolo")) {
    return { kFactor: 0.033, approximated: true };
  }
  if (sLower.includes("nitossolo")) {
    return { kFactor: 0.025, approximated: true };
  }

  return { kFactor: 0.03, approximated: true };
}

/**
 * Estima o Fator R de Erosividade regional (MJ·mm·ha⁻¹·h⁻¹·ano⁻¹) com base na latitude e estado.
 */
export function resolveRegionalRFactor(lat: number, state?: string): number {
  const st = (state || "").toUpperCase();
  if (st === "SC" || st === "RS") {
    return 7200;
  }
  if (st === "SP") {
    return 6200;
  }
  // Padrão Paraná / Região Sul (Lombardi Neto & Moldenhauer, 1992 / Bertoni & Lombardi Neto, 2017)
  if (lat <= -25.0) {
    return 7000;
  }
  return 6600;
}

/**
 * Enriquece uma lista de pontos com cruzamento fundiário em lote e/ou cálculo dos fatores RUSLE.
 */
export async function enrichPointsBatch(
  points: ErosionPoint[],
  options: BatchEnrichmentOptions,
  onProgress?: BatchProgressCallback
): Promise<ErosionPoint[]> {
  if (!points || points.length === 0) {
    return [];
  }

  const enrichedPoints = [...points.map((p) => ({ ...p }))];
  const total = enrichedPoints.length;

  // 1. Cruzamento Fundiário em Lote (se solicitado)
  if (options.queryTenure) {
    onProgress?.(0, total, "Iniciando consulta fundiária nas bases oficiais (SICAR/SIGEF/SNCR)...");

    const pointsToQuery = options.forceRefresh
      ? enrichedPoints
      : enrichedPoints.filter((p) => !p.tenureStatus);

    if (pointsToQuery.length > 0) {
      try {
        const payload = pointsToQuery.map((p) => ({
          id: p.id,
          latitude: p.latitude,
          longitude: p.longitude,
          uf: p.state || "PR",
        }));

        onProgress?.(
          Math.floor(total * 0.2),
          total,
          `Cruzando ${pointsToQuery.length} feições com polígonos do CAR e registros do INCRA...`
        );

        let response: Response | null = null;
        try {
          response = await fetch("/api/fundiario/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ points: payload }),
          });
        } catch {
          response = null;
        }

        if (!response || !response.ok) {
          try {
            response = await fetch("/api/fundiario/batch-match", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ points: payload }),
            });
          } catch {
            response = null;
          }
        }

        if (response && response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            const matches = json.data as Record<string, any>;
            for (let i = 0; i < enrichedPoints.length; i++) {
              const pt = enrichedPoints[i];
              const match = matches[pt.id];
              if (match) {
                pt.tenureStatus = match.status || "sem-correspondencia";
                pt.carCode = match.carCode || undefined;
                pt.propertyName = match.propertyName || undefined;
                pt.ownerName = match.ownerName || undefined;
                pt.incraRegistry = match.incraRegistry || undefined;
                pt.propertyAreaHa = typeof match.propertyAreaHa === "number" ? match.propertyAreaHa : undefined;
                pt.ownerDocumentMasked = match.ownerDocumentMasked || undefined;
                pt.tenureUf = match.uf || pt.state;
                pt.tenureQueryDate = match.dataConsulta;
                pt.tenureAssociationCriterion = match.criterioAssociacao;
                pt.sicarSourceFile = match.sicarArquivoOrigem;
                pt.sicarBaseDate = match.sicarDataBase;
                pt.sigefSourceFile = match.sigefArquivoOrigem;
                pt.sigefBaseDate = match.sigefDataBase;
                pt.sncrSourceFile = match.sncrArquivoOrigem;
                pt.sncrBaseDate = match.sncrDataBase;
              }
            }
          }
        }
      } catch (fundiarioErr) {
        console.warn("[enrichPointsBatch] Falha na consulta fundiária em lote:", fundiarioErr);
      }
    }
  }

  // 2. Cálculo dos Fatores RUSLE (se solicitado)
  if (options.calculateRusle) {
    onProgress?.(
      Math.floor(total * 0.6),
      total,
      "Calculando fatores da equação RUSLE (R, K, LS, C, P)..."
    );

    for (let i = 0; i < enrichedPoints.length; i++) {
      const pt = enrichedPoints[i];

      const shouldCalcRusle =
        options.forceRefresh ||
        !pt.rusleFactors ||
        pt.rusleFactors.r === undefined ||
        pt.rusleFactors.k === undefined;

      if (shouldCalcRusle) {
        const ndviVal = typeof pt.ndvi === "number" && !isNaN(pt.ndvi) ? pt.ndvi : 0.32;
        const bsiVal = typeof pt.bsi === "number" && !isNaN(pt.bsi) ? pt.bsi : 0.45;
        const slopeDeg =
          typeof pt.slopeDegrees === "number" && !isNaN(pt.slopeDegrees)
            ? pt.slopeDegrees
            : typeof pt.slopePercent === "number" && !isNaN(pt.slopePercent)
            ? Math.atan(pt.slopePercent / 100) * (180 / Math.PI)
            : 8.0;

        const cFactor = calculateCFactor(ndviVal, bsiVal);
        const specificCatchmentArea = 10.0;
        const lsFactor = calculateLSFactor(specificCatchmentArea, slopeDeg);
        const kResult = resolveKFactorForPoint(pt.soilType);
        const rFactor = resolveRegionalRFactor(pt.latitude, pt.state);
        const pFactor = 1.0;

        const soilLoss = calculateSoilLossRUSLE(rFactor, kResult.kFactor, lsFactor, cFactor, pFactor);

        pt.rusleFactors = {
          r: rFactor,
          k: kResult.kFactor,
          ls: lsFactor,
          c: cFactor,
          p: pFactor,
        };

        pt.estimatedSoilLoss = soilLoss;
        pt.calcEngineVersion = "2026.1-batch-rusle";

        const estFields = new Set(pt.estimatedFields || []);
        if (kResult.approximated) estFields.add("kFactor");
        estFields.add("lsFactor");
        estFields.add("rFactor");
        pt.estimatedFields = Array.from(estFields);
      }

      if (i % 25 === 0 || i === total - 1) {
        onProgress?.(
          Math.floor(total * 0.6 + (i / total) * (total * 0.35)),
          total,
          `Processando RUSLE para o ponto ${i + 1} de ${total}...`
        );
      }
    }
  }

  onProgress?.(total, total, "Enriquecimento concluído com sucesso!");
  return enrichedPoints;
}
