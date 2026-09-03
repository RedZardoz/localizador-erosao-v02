import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { isLocalRequest } from "@/lib/security/localOnly";

const RequestSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  carCode: z
    .string()
    .regex(/^[A-Z]{2}-[0-9]{7}-[A-F0-9]{32}$/i, "Formato de código do CAR inválido.")
    .optional(),
}).refine(
  (data) => (data.latitude !== undefined && data.longitude !== undefined) || Boolean(data.carCode),
  { message: "Informe as coordenadas geográficas ou o código oficial do CAR." }
);

export async function POST(req: NextRequest) {
  if (!isLocalRequest(req)) {
    return NextResponse.json(
      { success: false, error: "Consulta fundiaria disponivel apenas em execucao local." },
      { status: 403 }
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

  const { latitude, longitude, carCode } = parsed;

  try {
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
            console.error("[Fundiário Polygon Subprocess Error]", stderr || error.message);
            return reject(new Error("Erro interno no processamento do polígono."));
          }
          try {
            const trimmed = stdout.trim();
            if (!trimmed) return resolve(null);
            const parsedJson = JSON.parse(trimmed);
            resolve(parsedJson);
          } catch (e: any) {
            console.error("[Fundiário Polygon JSON Parse Error]", e.message);
            reject(new Error("Falha no parse do GeoJSON do polígono."));
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
    console.error("[Fundiário Polygon Route Error]", err);
    return NextResponse.json(
      { success: false, error: "Erro interno ao buscar polígono. Consulte os logs do servidor." },
      { status: 500 }
    );
  }
}
