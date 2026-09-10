import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token, type } = await req.json();

    if (!token || typeof token !== "string" || token.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: "Token inválido ou vazio." },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();

    if (type === "gee" || type === "earthengine" || type === "earth-engine") {
      try {
        const project = process.env.GEE_PROJECT_ID || "ee-luisalfredoramos";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(`https://earthengine.googleapis.com/v1/projects/${project}/algorithms`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${cleanToken}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.status === 200) {
          return NextResponse.json({
            success: true,
            valid: true,
            message: "Token ativo e autenticado no Google Earth Engine",
            service: "Google Earth Engine",
          });
        } else if (res.status === 401) {
          return NextResponse.json(
            { success: false, valid: false, message: "Token expirado ou inválido", error: "Token expirado ou inválido" },
            { status: 401 }
          );
        } else if (res.status === 403) {
          return NextResponse.json(
            { success: false, valid: false, message: "Token sem permissão de acesso ao projeto Earth Engine", error: "Token sem permissão de acesso ao projeto Earth Engine" },
            { status: 403 }
          );
        } else {
          return NextResponse.json(
            { success: false, valid: false, message: `Erro ao validar no Earth Engine (HTTP ${res.status})`, error: `Erro HTTP ${res.status}` },
            { status: res.status }
          );
        }
      } catch (err: any) {
        return NextResponse.json(
          { success: false, valid: false, message: `Não foi possível conectar ao Earth Engine: ${err.message}`, error: `Não foi possível conectar ao Earth Engine: ${err.message}` },
          { status: 502 }
        );
      }
    } else if (type === "mapbox") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(`https://api.mapbox.com/v4/mapbox.satellite/0/0/0.png?access_token=${encodeURIComponent(cleanToken)}`, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.status === 200 || res.status === 304) {
          return NextResponse.json({
            success: true,
            message: "Mapbox Access Token verificado e ativo!",
            service: "Mapbox GL / Satellite",
          });
        } else {
          return NextResponse.json(
            {
              success: false,
              error: `Mapbox rejeitou o token (Status HTTP ${res.status}). Verifique as permissões de escopo no painel da Mapbox.`,
            },
            { status: 401 }
          );
        }
      } catch (err: any) {
        return NextResponse.json(
          {
            success: false,
            error: `Não foi possível conectar à API da Mapbox: ${err.message}`,
          },
          { status: 502 }
        );
      }
    } else if (type === "google") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Curitiba&key=${encodeURIComponent(cleanToken)}`, {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (data.status === "OK" || data.status === "ZERO_RESULTS") {
          return NextResponse.json({
            success: true,
            message: "Chave da Google Maps API validada e ativa (Geocoding API operacional).",
            service: "Google Maps API",
          });
        } else if (data.status === "REQUEST_DENIED") {
          return NextResponse.json(
            {
              success: false,
              error: `Google Maps rejeitou a chave: ${data.error_message || "Chave inválida ou serviço Geocoding desativado no Google Cloud Console."}`,
            },
            { status: 401 }
          );
        } else if (data.status === "OVER_QUERY_LIMIT") {
          return NextResponse.json(
            {
              success: false,
              error: "Cota de requisições da Google Maps API excedida para esta chave.",
            },
            { status: 429 }
          );
        } else {
          return NextResponse.json(
            {
              success: false,
              error: `Google Maps retornou status '${data.status}'${data.error_message ? `: ${data.error_message}` : ""}`,
            },
            { status: 400 }
          );
        }
      } catch (err: any) {
        return NextResponse.json(
          {
            success: false,
            error: `Não foi possível conectar à Google Maps API: ${err.message}`,
          },
          { status: 502 }
        );
      }
    } else if (type === "carto") {
      try {
        const testUrl = `https://basemaps.cartocdn.com/rastertiles/voyager/0/0/0.png?key=${encodeURIComponent(cleanToken)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(testUrl, {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.status === 200) {
          const hasWatermarkTransform = res.headers.get("fastly-io-transform-stats") !== null;
          if (hasWatermarkTransform) {
            return NextResponse.json(
              {
                success: false,
                error: "Chave não autorizada pela CARTO (a marca d'água continua sendo aplicada às imagens). Verifique a chave no painel da CARTO.",
                service: "CARTO Basemaps",
              },
              { status: 401 }
            );
          }

          return NextResponse.json({
            success: true,
            message: "CARTO API Key verificada e ativa! Basemaps liberados sem marca d'água.",
            service: "CARTO Basemaps (Raster/Voyager/Dark)",
          });
        } else if (res.status === 401 || res.status === 403) {
          return NextResponse.json(
            {
              success: false,
              error: `CARTO rejeitou a chave (Status HTTP ${res.status}). Verifique a chave no painel da CARTO.`,
            },
            { status: 401 }
          );
        } else {
          return NextResponse.json(
            {
              success: false,
              error: `Servidor da CARTO retornou status HTTP ${res.status}.`,
            },
            { status: res.status }
          );
        }
      } catch (err: any) {
        return NextResponse.json(
          {
            success: false,
            error: `Não foi possível conectar ao servidor da CARTO: ${err.message}`,
          },
          { status: 502 }
        );
      }
    } else if (type === "embrapa") {
      try {
        const rawToken = cleanToken.replace(/^Bearer\s+/i, "");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const res = await fetch("https://api.cnptia.embrapa.br/smartsolos/expert/v1/health", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${rawToken}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.status === 200 || res.status === 204) {
          return NextResponse.json({
            success: true,
            message: "Token Embrapa AgroAPI validado e ativo com sucesso! SmartSolos Expert operacional.",
            service: "Embrapa AgroAPI (SmartSolos Expert)",
          });
        } else if (res.status === 401 || res.status === 403) {
          return NextResponse.json(
            {
              success: false,
              error: `Embrapa rejeitou o token (Status HTTP ${res.status}). Verifique se o Access Token gerado na aplicação do portal AgroAPI está ativo.`,
            },
            { status: 401 }
          );
        } else {
          return NextResponse.json(
            {
              success: false,
              error: `Serviço da Embrapa AgroAPI retornou erro temporário (Status HTTP ${res.status}).`,
            },
            { status: res.status }
          );
        }
      } catch (err: any) {
        return NextResponse.json(
          {
            success: false,
            error: `Não foi possível conectar ao servidor da Embrapa AgroAPI: ${err.message}. Verifique sua conexão com a internet.`,
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: `Tipo de serviço desconhecido: ${type}` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Erro no teste de token: ${err.message}` },
      { status: 500 }
    );
  }
}
