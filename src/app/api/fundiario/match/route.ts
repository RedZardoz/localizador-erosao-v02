import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { matchRuralProperty, batchMatchRuralProperties } from "@/lib/fundiario/spatialMatcher";
import { isLocalRequest } from "@/lib/security/localOnly";

const SingleRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  uf: z.string().length(2).optional(),
});

const BatchRequestSchema = z.object({
  points: z.array(
    z.object({
      id: z.string(),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      uf: z.string().length(2).optional(),
    })
  ).max(2000),
});

export async function POST(req: NextRequest) {
  if (!isLocalRequest(req)) {
    return NextResponse.json(
      { success: false, error: "Consulta fundiaria disponivel apenas em execucao local." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    if (body && Array.isArray(body.points)) {
      const parsedBatch = BatchRequestSchema.parse(body);
      const results = await batchMatchRuralProperties(parsedBatch.points);
      return NextResponse.json({
        success: true,
        data: results,
      });
    }

    const parsed = SingleRequestSchema.parse(body);
    const match = await matchRuralProperty(parsed.latitude, parsed.longitude, parsed.uf);

    return NextResponse.json({
      success: true,
      data: match,
    });
  } catch (err: any) {
    console.error("[Fundiário Error - match]", err);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno no processamento fundiário. Consulte os logs do servidor.",
        data: {},
      },
      { status: 500 }
    );
  }
}

