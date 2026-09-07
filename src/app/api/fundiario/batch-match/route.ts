import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { batchMatchRuralProperties } from "@/lib/fundiario/spatialMatcher";
import { isLocalRequest } from "@/lib/security/localOnly";

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
      { success: false, error: "Consulta fundiária disponível apenas em execução local." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = BatchRequestSchema.parse(body);

    const results = await batchMatchRuralProperties(parsed.points);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err: any) {
    console.error("[Fundiário Error - batch-match]", err);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno no processamento fundiário em lote.",
        data: {},
      },
      { status: 500 }
    );
  }
}
