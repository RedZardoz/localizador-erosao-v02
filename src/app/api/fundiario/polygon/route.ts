import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { isLocalRequest } from "@/lib/security/localOnly";

export async function POST(req: NextRequest) {
  if (!isLocalRequest(req)) {
    return NextResponse.json(
      { success: false, error: "Consulta fundiaria disponivel apenas em execucao local." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { latitude, longitude, carCode } = body;

    const projectRoot = process.cwd();
    const scriptPath = path.join(projectRoot, "scripts", "get_property_polygon.py");
    const dbPath = path.join(projectRoot, "data", "fundiario_brasil.db");

    if (!fs.existsSync(scriptPath) || !fs.existsSync(dbPath)) {
      return NextResponse.json({ success: false, error: "Base fundiária não disponível" }, { status: 404 });
    }

    const pythonCmd = process.env.PYTHON_PATH || "python";
    const args = [scriptPath, "--db", dbPath];

    if (carCode) {
      args.push("--car", String(carCode));
    }
    if (typeof latitude === "number" && typeof longitude === "number") {
      args.push("--lat", String(latitude), "--lon", String(longitude));
    }

    const feature = await new Promise<any>((resolve, reject) => {
      execFile(
        pythonCmd,
        args,
        {
          cwd: projectRoot,
          timeout: 10000,
          windowsHide: true,
          env: {
            ...process.env,
            PYTHONIOENCODING: "utf-8",
          },
        },
        (error, stdout, stderr) => {
          if (error) {
            return reject(new Error(stderr || error.message));
          }
          try {
            const trimmed = stdout.trim();
            if (!trimmed) return resolve(null);
            const parsed = JSON.parse(trimmed);
            resolve(parsed);
          } catch (e: any) {
            reject(new Error(`Falha no parse do GeoJSON: ${e.message}`));
          }
        }
      );
    });

    if (!feature || !feature.geometry) {
      return NextResponse.json({ success: false, error: "Polígono não encontrado para o imóvel" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: feature,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro interno ao buscar polígono" },
      { status: 500 }
    );
  }
}
