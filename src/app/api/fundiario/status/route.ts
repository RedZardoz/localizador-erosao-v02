import { NextRequest, NextResponse } from "next/server";
import { isLocalRequest } from "@/lib/seguranca/localOnly";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";

export interface StatusFundiarioResposta {
  existe: boolean;
  tabelas: number | null;
  erro?: string;
}

/**
 * ============================================================================
 * Status da Base Cartográfica Fundiária Local (N15 / REVISAO_GLOBAL M4)
 * ============================================================================
 *
 * Exclusivamente local via isLocalRequest.
 * Informa apenas { existe: boolean, tabelas: number | null, erro?: string }
 * sem nenhum caminho absoluto, dado pessoal ou identificador sob LGPD.
 * Ausente ou não lido é null, nunca zero fabricado.
 */
export async function GET(request: NextRequest): Promise<NextResponse<StatusFundiarioResposta | { erro: string }>> {
  if (!isLocalRequest(request)) {
    return NextResponse.json(
      {
        erro: "Acesso restrito: status fundiário restrito a execução local.",
      },
      { status: 403 }
    );
  }

  const dbPath = path.resolve(process.cwd(), "data", "fundiario_brasil.db");
  let dbExiste = false;
  try {
    dbExiste = fs.existsSync(dbPath) && fs.statSync(dbPath).isFile();
  } catch {
    dbExiste = false;
  }

  if (!dbExiste) {
    return NextResponse.json({ existe: false, tabelas: null });
  }

  return new Promise<NextResponse<StatusFundiarioResposta>>((resolve) => {
    const pyCode = `import sqlite3, json, sys
try:
    p = sys.argv[1]
    conn = sqlite3.connect(f'file:{p}?mode=ro', uri=True)
    c = conn.cursor()
    c.execute("SELECT count(1) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    n = c.fetchone()[0]
    conn.close()
    print(json.dumps({'existe': True, 'tabelas': n}))
except Exception:
    print(json.dumps({'existe': True, 'tabelas': None, 'erro': 'falha-leitura-sqlite'}))
`;
    execFile("python", ["-c", pyCode, dbPath], { timeout: 5000 }, (err, stdout) => {
      if (err) {
        return resolve(NextResponse.json({ existe: true, tabelas: null, erro: "falha-execucao-python" }));
      }
      try {
        const dados = JSON.parse(stdout.trim());
        if (typeof dados?.tabelas === "number") {
          return resolve(NextResponse.json({ existe: true, tabelas: dados.tabelas }));
        }
        return resolve(NextResponse.json({ existe: true, tabelas: null, erro: dados?.erro || "resposta-invalida" }));
      } catch {
        return resolve(NextResponse.json({ existe: true, tabelas: null, erro: "json-invalido" }));
      }
    });
  });
}
