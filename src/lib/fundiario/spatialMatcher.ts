import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { ErosionPoint } from "@/types/erosion";

export type MatchStatus =
  | "encontrado"
  | "aproximado"
  | "sem-correspondencia"
  | "base-nao-disponivel";

export interface RuralPropertyMatch {
  status?: MatchStatus;
  uf?: string;
  municipio?: string;
  carCode?: string;
  propertyName?: string;
  ownerName?: string;
  incraRegistry?: string;
  propertyAreaHa?: number;
  ownerDocumentMasked?: string;
  mensagem?: string;
  dataConsulta?: string;
  criterioAssociacao?: string;
  sicarArquivoOrigem?: string;
  sicarDataBase?: string;
  sigefArquivoOrigem?: string;
  sigefDataBase?: string;
  sncrArquivoOrigem?: string;
  sncrDataBase?: string;
}

/**
 * Executa o cruzamento espacial por Bounding Box via Python/SQLite local.
 * Retorna os dados cadastrais da propriedade rural (CAR/SICAR e SNCR/CNIR)
 * ou um status pericial rigoroso caso o ponto não caia em nenhum perímetro cadastrado
 * ou o estado não possua base territorial ingerida.
 */
export async function matchRuralProperty(
  latitude: number,
  longitude: number,
  ufOrDbPath?: string,
  customDbPath?: string
): Promise<RuralPropertyMatch> {
  let uf: string | undefined;
  let dbRelativePath = "data/fundiario_brasil.db";

  if (ufOrDbPath) {
    if (ufOrDbPath.endsWith(".db") || ufOrDbPath.includes("/") || ufOrDbPath.includes("\\")) {
      dbRelativePath = ufOrDbPath;
    } else {
      uf = ufOrDbPath;
      if (customDbPath) {
        dbRelativePath = customDbPath;
      }
    }
  }

  return new Promise((resolve) => {
    try {
      const projectRoot = process.cwd();
      const scriptPath = path.join(projectRoot, "scripts", "spatial_owner_matcher.py");
      const dbPath = path.join(projectRoot, dbRelativePath);

      // Verificação defensiva de existência do script e do banco
      if (!fs.existsSync(scriptPath) || !fs.existsSync(dbPath)) {
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
        ...(uf ? ["--uf", uf] : []),
      ];

      execFile(
        pythonCmd,
        args,
        {
          cwd: projectRoot,
          timeout: 15000,
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
            if (parsed.status) cleanResult.status = parsed.status;
            if (parsed.uf) cleanResult.uf = parsed.uf;
            if (parsed.municipio) cleanResult.municipio = parsed.municipio;
            if (parsed.carCode) cleanResult.carCode = parsed.carCode;
            if (parsed.propertyName) cleanResult.propertyName = parsed.propertyName;
            if (parsed.ownerName) cleanResult.ownerName = parsed.ownerName;
            if (parsed.incraRegistry) cleanResult.incraRegistry = parsed.incraRegistry;
            if (typeof parsed.propertyAreaHa === "number") cleanResult.propertyAreaHa = parsed.propertyAreaHa;
            if (parsed.ownerDocumentMasked) cleanResult.ownerDocumentMasked = parsed.ownerDocumentMasked;
            if (parsed.mensagem) cleanResult.mensagem = parsed.mensagem;
            if (parsed.dataConsulta) cleanResult.dataConsulta = parsed.dataConsulta;
            if (parsed.criterioAssociacao) cleanResult.criterioAssociacao = parsed.criterioAssociacao;
            if (parsed.sicarArquivoOrigem) cleanResult.sicarArquivoOrigem = parsed.sicarArquivoOrigem;
            if (parsed.sicarDataBase) cleanResult.sicarDataBase = parsed.sicarDataBase;
            if (parsed.sigefArquivoOrigem) cleanResult.sigefArquivoOrigem = parsed.sigefArquivoOrigem;
            if (parsed.sigefDataBase) cleanResult.sigefDataBase = parsed.sigefDataBase;
            if (parsed.sncrArquivoOrigem) cleanResult.sncrArquivoOrigem = parsed.sncrArquivoOrigem;
            if (parsed.sncrDataBase) cleanResult.sncrDataBase = parsed.sncrDataBase;

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
