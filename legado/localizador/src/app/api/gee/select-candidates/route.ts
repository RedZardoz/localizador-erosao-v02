import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGeeSession, GEE_SESSION_COOKIE } from "@/lib/gee/sessionStore";
import { selectCandidatesWithGEE } from "@/lib/gee/candidateSelector";

/**
 * ============================================================================
 * Rota de Amostragem Estratificada e Seleção de Candidatos no Earth Engine
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * SERVIDOR EXTERNO ACESSADO:
 * - Google Earth Engine (GEE API - Google Cloud Platform)
 * - Produtos do pipeline:
 *   1. ESA WorldCover 10m (v200) -> Máscara de uso da terra e solo agrícola (README §3.3)
 *   2. Copernicus DEM GLO-30 -> Morfometria e faixas de declividade 3% a 20% (README §2.2.B)
 *   3. JRC Global Surface Water -> Buffer de exclusão de 30m de corpos d'água (README §3.3.4)
 *   4. Sentinel-2 SR Harmonized L2A -> Extração de BSI e NDVI nos pontos candidatos (README §2.1)
 *
 * MODELAGEM CIENTÍFICA & REFERÊNCIA AO README:
 * - README §3: Critérios Metodológicos para Seleção e Triagem dos Pontos Amostrais.
 * - Amostragem Espacial Estratificada Guiada por Modelagem Multicritério (Sub-estratos A1 a B3).
 * - Thinning Espacial Global para garantia de dispersão geográfica e eliminação de agrupamentos.
 */

const RequestSchema = z.object({
  aoi: z.any(), // GeoJSON ou AOIPolygon
  targetCount: z.number().min(5).max(500).optional(),
  minSpacingKm: z.number().min(0).max(50).optional(),
  municipalityName: z.string().optional(),
  stateName: z.string().optional(),
  eligibilityOptions: z
    .object({
      allowedLandCoverClasses: z.array(z.number()).optional(),
      minSlopePercent: z.number().optional(),
      maxSlopePercent: z.number().optional(),
      waterOccurrenceThreshold: z.number().optional(),
      waterBufferMeters: z.number().optional(),
      urbanBufferMeters: z.number().min(0).max(2000).optional(),
    })
    .optional(),
  seed: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get(GEE_SESSION_COOKIE)?.value;
  const credentials = getGeeSession(sessionId);

  if (!credentials) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Nenhuma sessão do Earth Engine ativa (ou ela expirou). Configure a Service Account em Configurações → GEE Service Account.",
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
      { success: false, error: `Requisição inválida: ${err?.message || err}` },
      { status: 400 }
    );
  }

  try {
    // Executa amostragem balanceada em alta resolução no GEE
    const result = await selectCandidatesWithGEE(credentials, parsed as any);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[GEE Error - select-candidates]", err);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno no processamento geoespacial via Earth Engine. Consulte os logs do servidor.",
      },
      { status: 502 }
    );
  }
}
