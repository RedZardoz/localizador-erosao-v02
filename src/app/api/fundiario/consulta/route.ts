import { NextRequest, NextResponse } from "next/server";
import { isLocalRequest } from "@/lib/seguranca/localOnly";
import { matchRuralProperty, toContextoFundiario } from "@/lib/fundiario/matcher";

/**
 * ============================================================================
 * Rota de Consulta Fundiária Espacial (SICAR / SNCR / SIGEF) — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Restrita a chamadas locais via isLocalRequest (LGPD art. 7, IV).
 * Preserva estritamente os 5 estados do Invariante 5.
 */
export async function GET(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return NextResponse.json(
      {
        status: "erro-na-consulta",
        motivo: "Acesso negado: consulta fundiária restrita a execução local (localhost).",
      },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const latStr = searchParams.get("lat") || searchParams.get("latitude");
  const lonStr = searchParams.get("lon") || searchParams.get("lng") || searchParams.get("longitude");
  const uf = searchParams.get("uf") || undefined;

  if (!latStr || !lonStr) {
    return NextResponse.json(
      {
        status: "erro-na-consulta",
        motivo: "Parâmetros de latitude e longitude são obrigatórios.",
      },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      {
        status: "erro-na-consulta",
        motivo: "Coordenadas geográficas inválidas.",
      },
      { status: 400 }
    );
  }

  const match = await matchRuralProperty(lat, lon, uf);
  const contexto = toContextoFundiario(match, uf || "PR");

  return NextResponse.json(contexto);
}

export async function POST(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return NextResponse.json(
      {
        status: "erro-na-consulta",
        motivo: "Acesso negado: consulta fundiária restrita a execução local (localhost).",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const lat = typeof body.latitude === "number" ? body.latitude : parseFloat(body.lat);
    const lon = typeof body.longitude === "number" ? body.longitude : parseFloat(body.lon || body.lng);
    const uf = body.uf || undefined;

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        {
          status: "erro-na-consulta",
          motivo: "Coordenadas numéricas 'latitude' e 'longitude' são obrigatórias.",
        },
        { status: 400 }
      );
    }

    const match = await matchRuralProperty(lat, lon, uf);
    const contexto = toContextoFundiario(match, uf || "PR");

    return NextResponse.json(contexto);
  } catch (err) {
    return NextResponse.json(
      {
        status: "erro-na-consulta",
        motivo: `Corpo da requisição inválido: ${(err as Error).message}`,
      },
      { status: 400 }
    );
  }
}
