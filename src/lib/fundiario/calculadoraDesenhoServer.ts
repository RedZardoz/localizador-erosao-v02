/**
 * ============================================================================
 * Consulta Fundiária Direta para Simulação de Desenho (Lado Servidor / Offline)
 * SAREL v2.0 — Disciplina Pericial PPGTCA 2026
 * ============================================================================
 *
 * Módulo segregado para execução exclusiva em ambiente Node.js / Servidor.
 * Não deve ser importado em componentes React client-side ("use client").
 */

import { execFile } from "child_process";
import path from "path";
import fs from "fs";

/**
 * Consulta assíncrona ao vivo diretamente sobre data/fundiario_brasil.db via Python SQLite,
 * validando a fração exata de imóveis no envelope da BP3 que comportam o retângulo.
 */
export function consultarFracaoImoveisElegiveisDbPython(
  areaPoligonoHa: number,
  larguraM: number,
  comprimentoM: number
): Promise<number | null> {
  return new Promise((resolve) => {
    const dbPath = path.resolve(process.cwd(), "data/fundiario_brasil.db");
    if (!fs.existsSync(dbPath)) {
      return resolve(null);
    }

    const dLonMin = larguraM / 101062.0;
    const dLatMin = comprimentoM / 111132.0;

    const pyCode = `
import sqlite3, json
conn = sqlite3.connect(r'${dbPath}')
c = conn.cursor()
c.execute("""
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN area_ha >= ? AND (
          (lon_max - lon_min >= ? AND lat_max - lat_min >= ?) OR
          (lon_max - lon_min >= ? AND lat_max - lat_min >= ?)
        ) THEN 1 ELSE 0 END) as elegiveis
    FROM imoveis_brasil
    WHERE estado = 'PR' 
      AND lat_centro BETWEEN -25.65 AND -24.00 
      AND lon_centro BETWEEN -54.65 AND -53.35
""", (${areaPoligonoHa}, ${dLonMin}, ${dLatMin}, ${dLatMin}, ${dLonMin}))
row = c.fetchone()
conn.close()
total = row[0] or 0
eleg = row[1] or 0
frac = round(eleg / total, 4) if total > 0 else 0.0
print(json.dumps({'fracao': frac}))
`;

    execFile("python", ["-c", pyCode], { timeout: 10000 }, (err, stdout) => {
      if (err) return resolve(null);
      try {
        const res = JSON.parse(stdout.trim());
        resolve(typeof res.fracao === "number" ? res.fracao : null);
      } catch {
        resolve(null);
      }
    });
  });
}
