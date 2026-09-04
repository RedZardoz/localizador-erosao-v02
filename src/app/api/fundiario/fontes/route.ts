import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { isLocalRequest } from "@/lib/security/localOnly";

export interface FonteDadosItem {
  sistema: string;
  uf: string;
  arquivo_origem: string | null;
  data_base: string | null;
  total_registros: number;
}

export async function GET(req: NextRequest) {
  if (!isLocalRequest(req)) {
    return NextResponse.json(
      { success: false, error: "Consulta fundiaria disponivel apenas em execucao local." },
      { status: 403 }
    );
  }

  try {
    const projectRoot = process.cwd();
    const scriptPath = path.join(projectRoot, "scripts", "get_fontes_dados.py");
    const dbPath = path.join(projectRoot, "data", "fundiario_brasil.db");

    if (!fs.existsSync(scriptPath) || !fs.existsSync(dbPath)) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const pythonCmd = process.env.PYTHON_PATH || "python";
    const args = [scriptPath, "--db", dbPath];

    const result = await new Promise<FonteDadosItem[]>((resolve) => {
      execFile(
        pythonCmd,
        args,
        {
          cwd: projectRoot,
          timeout: 5000,
          windowsHide: true,
          env: {
            ...process.env,
            PYTHONIOENCODING: "utf-8",
          },
        },
        (error, stdout) => {
          if (error) {
            console.error("[FontesDados Error]", error);
            return resolve([]);
          }
          try {
            const data = JSON.parse(stdout.trim() || "[]");
            resolve(Array.isArray(data) ? data : []);
          } catch {
            resolve([]);
          }
        }
      );
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[FontesDados Error - handler]", err);
    return NextResponse.json(
      { success: false, error: "Erro ao consultar metadados de fontes." },
      { status: 500 }
    );
  }
}
