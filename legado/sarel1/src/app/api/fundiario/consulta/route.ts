import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import { assegurarRequisicaoLocal } from "@/lib/gee/auth";

/**
 * ============================================================================
 * Rota de Consulta Fundiária Espacial (SICAR / SNCR) — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Executa consulta espacial com R-Tree no Shapefile oficial do SICAR/PR e
 * cruza com a base cadastral do SNCR.
 *
 * REGRA 2: Nunca colapsa estados distintos.
 * REGRA 4: Dado cadastral para acesso ético e contexto, NUNCA feature de treino.
 */
export async function GET(request: NextRequest) {
  // 1. Guarda de Execução Local: recusa requisições originadas fora de localhost
  try {
    assegurarRequisicaoLocal(request);
  } catch (err) {
    return NextResponse.json(
      {
        status: "erro-na-consulta",
        motivo: err instanceof Error ? err.message : "Acesso negado: rota fundiária restrita à execução local.",
        consultadoEm: new Date().toISOString().split("T")[0],
      },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");
  const uf = (searchParams.get("uf") || "PR").toUpperCase();

  if (!latStr || !lngStr) {
    return NextResponse.json(
      {
        status: "erro-na-consulta",
        motivo: "Parâmetros 'lat' e 'lng' são obrigatórios.",
        consultadoEm: new Date().toISOString().split("T")[0],
      },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      {
        status: "erro-na-consulta",
        motivo: "Coordenadas geográficas inválidas.",
        consultadoEm: new Date().toISOString().split("T")[0],
      },
      { status: 400 }
    );
  }

  if (uf !== "PR") {
    return NextResponse.json({
      status: "base-nao-disponivel",
      motivo: `Base vetorial instalada cobre o Paraná (PR). Para a UF '${uf}', solicite a ingestão complementar.`,
      consultadoEm: new Date().toISOString().split("T")[0],
      ufConsultada: uf,
    });
  }

  const scriptPath = path.join(
    process.cwd(),
    "src",
    "lib",
    "fundiario",
    "cadastre_service.py"
  );

  return new Promise<NextResponse>((resolve) => {
    execFile(
      "python",
      [scriptPath, lat.toString(), lng.toString(), uf],
      { timeout: 15000, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("[Fundiário API] Erro na execução:", error, stderr);
          return resolve(
            NextResponse.json({
              status: "erro-na-consulta",
              motivo: `Falha técnica no serviço espacial local: ${error.message}`,
              consultadoEm: new Date().toISOString().split("T")[0],
              ufConsultada: uf,
            })
          );
        }

        try {
          const resultado = JSON.parse(stdout.trim());
          return resolve(NextResponse.json(resultado));
        } catch (parseErr) {
          console.error("[Fundiário API] Erro ao parsear saída:", parseErr, stdout);
          return resolve(
            NextResponse.json({
              status: "erro-na-consulta",
              motivo: "Erro na serialização do retorno cadastral.",
              consultadoEm: new Date().toISOString().split("T")[0],
              ufConsultada: uf,
            })
          );
        }
      }
    );
  });
}
