import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { ErosionPoint } from "@/types/erosion";

export interface RuralPropertyMatch {
  carCode?: string;
  propertyName?: string;
  ownerName?: string;
  incraRegistry?: string;
  propertyAreaHa?: number;
  ownerDocumentMasked?: string;
}

/**
 * Executa o cruzamento espacial por Bounding Box via Python/SQLite local.
 * Retorna os dados cadastrais da propriedade rural (CAR/SICAR e SNCR/CNIR)
 * ou um objeto vazio caso o ponto não caia em nenhum perímetro cadastrado
 * ou o banco de dados não esteja disponível.
 */
export async function matchRuralProperty(
  latitude: number,
  longitude: number,
  dbRelativePath: string = "data/fundiario_brasil.db"
): Promise<RuralPropertyMatch> {
  return new Promise((resolve) => {
    try {
      const projectRoot = process.cwd();
      const scriptPath = path.join(projectRoot, "scripts", "spatial_owner_matcher.py");
      const dbPath = path.join(projectRoot, dbRelativePath);

      // Verificação defensiva de existência do script
      if (!fs.existsSync(scriptPath)) {
        return resolve({});
      }

      // Se o banco e a pasta de shapes não existirem, encerra antecipadamente
      const shapesDir = path.join(projectRoot, "data", "shapes");
      if (!fs.existsSync(dbPath) && !fs.existsSync(shapesDir)) {
        return resolve({});
      }

      const pythonCmd = process.env.PYTHON_PATH || "python";
      const args = [
        scriptPath,
        "--lat",
        String(latitude),
        "--lon",
        String(longitude),
        "--db",
        dbPath,
      ];

      execFile(
        pythonCmd,
        args,
        {
          cwd: projectRoot,
          timeout: 12000,
          windowsHide: true,
          env: {
            ...process.env,
            PYTHONIOENCODING: "utf-8",
          },
        },
        (error, stdout, stderr) => {
          if (error) {
            // Em caso de erro do subprocesso, não interrompe a aplicação; retorna vazio defensivamente
            return resolve({});
          }

          try {
            const trimmed = stdout.trim();
            if (!trimmed) {
              return resolve({});
            }
            const parsed = JSON.parse(trimmed);
            if (!parsed || Object.keys(parsed).length === 0) {
              return resolve({});
            }

            const cleanResult: RuralPropertyMatch = {};
            if (parsed.carCode) cleanResult.carCode = parsed.carCode;
            if (parsed.propertyName) cleanResult.propertyName = parsed.propertyName;
            if (parsed.ownerName) cleanResult.ownerName = parsed.ownerName;
            if (parsed.incraRegistry) cleanResult.incraRegistry = parsed.incraRegistry;
            if (typeof parsed.propertyAreaHa === "number") cleanResult.propertyAreaHa = parsed.propertyAreaHa;
            if (parsed.ownerDocumentMasked) cleanResult.ownerDocumentMasked = parsed.ownerDocumentMasked;

            return resolve(cleanResult);
          } catch {
            return resolve({});
          }
        }
      );
    } catch {
      return resolve({});
    }
  });
}
