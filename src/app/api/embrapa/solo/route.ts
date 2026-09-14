import { NextRequest, NextResponse } from "next/server";
import { queryEmbrapaSoil } from "@/lib/embrapa/embrapaSoilClient";

/**
 * Rota pública para consulta pedológica e de erodibilidade da Embrapa GeoInfo.
 * Dados abertos OGC WMS/GetFeatureInfo.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latStr = searchParams.get("lat") || searchParams.get("latitude");
  const lngStr = searchParams.get("lng") || searchParams.get("lon") || searchParams.get("longitude");

  if (!latStr || !lngStr) {
    return NextResponse.json(
      {
        statusSolo: "servico-indisponivel",
        statusErodibilidade: "servico-indisponivel",
        motivo: "Parâmetros 'lat' e 'lng' são obrigatórios.",
      },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      {
        statusSolo: "servico-indisponivel",
        statusErodibilidade: "servico-indisponivel",
        motivo: "Coordenadas geográficas inválidas.",
      },
      { status: 400 }
    );
  }

  const result = await queryEmbrapaSoil(lat, lng);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lat = typeof body.latitude === "number" ? body.latitude : parseFloat(body.lat);
    const lng = typeof body.longitude === "number" ? body.longitude : parseFloat(body.lng || body.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        {
          statusSolo: "servico-indisponivel",
          statusErodibilidade: "servico-indisponivel",
          motivo: "Coordenadas numéricas 'latitude' e 'longitude' são obrigatórias.",
        },
        { status: 400 }
      );
    }

    const result = await queryEmbrapaSoil(lat, lng);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        statusSolo: "servico-indisponivel",
        statusErodibilidade: "servico-indisponivel",
        motivo: `Erro no payload da requisição: ${(err as Error).message}`,
      },
      { status: 400 }
    );
  }
}
