import { NextRequest, NextResponse } from "next/server";
import { isLocalRequest } from "@/lib/seguranca/localOnly";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";

/**
 * ============================================================================
 * Status da Base Cartográfica Fundiária Local (N15 / REVISAO_GLOBAL M4)
 * ============================================================================
 *
 * Exclusivamente local via isLocalRequest.
 * Informa apenas { existe: boolean, tabelas: number } sem nenhum caminho
 * absoluto, dado pessoal ou identificador sob LGPD.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isLocalRequest(request)) {
    return NextResponse.json(
      {
        erro: "Acesso restrito: status fundiário restrito a execução local.",
      },
      { status: 403 }
    );
  }

  const dbPath = path.resolve(process.cwd(), "data", "fundiario_brasil.db");
  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ existe: false, tabelas: 0 });
  }

  return new Promise<NextResponse>((resolve) => {
    const pyCode = `
import sqlite3, json
try:
    conn = sqlite3.connect(r'''${dbPath}''')
    c = conn.cursor()
    c.execute("SELECT count(1) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    n = c.fetchone()[0]
    conn.close()
    print(json.dumps({'existe': True, 'tabelas': n}))
except Exception:
    print(json.dumps({'existe': True, 'tabelas': 0}))
`;
    execFile("python", ["-c", pyCode], { timeout: 5000 }, (err, stdout) => {
      if (err) {
        return resolve(NextResponse.json({ existe: true, tabelas: 0 }));
      }
      try {
        const dados = JSON.parse(stdout.trim());
        return resolve(NextResponse.json(dados));
      } catch {
        return resolve(NextResponse.json({ existe: true, tabelas: 0 }));
      }
    });
  });
}
