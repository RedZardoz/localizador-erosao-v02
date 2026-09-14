import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { ContextoFundiario, StatusFundiario } from "@/types/ponto";
import { mascararDocumentoPessoal, validarMascaraTitularSncr } from "./protecao";

export interface RuralPropertyMatch {
  status: StatusFundiario;
  motivo?: string | null;
  uf?: string;
  municipio?: string;
  carCode?: string;
  propertyName?: string;
  ownerName?: string;
  incraRegistry?: string;
  propertyAreaHa?: number | null;
  ownerDocumentMasked?: string | null;
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
 * Converte um resultado bruto de correspondência em um ContextoFundiario formal (SAREL).
 * Garante que:
 * - O status nunca seja colapsado (Invariante 5).
 * - Documentos e titulares estejam sob proteção LGPD byte a byte.
 * - Area nula nunca seja convertida em 0.
 * - Motivo seja preenchido sempre que status != "encontrado".
 */
export function toContextoFundiario(
  match: RuralPropertyMatch,
  fallbackUf = "PR"
): ContextoFundiario {
  const status = match.status || "erro-na-consulta";
  const motivo =
    status === "encontrado"
      ? null
      : match.motivo || match.mensagem || `Status fundiário: ${status}`;

  const area =
    typeof match.propertyAreaHa === "number" && match.propertyAreaHa > 0
      ? match.propertyAreaHa
      : null;

  return {
    status,
    motivo,
    consultadoEm: match.dataConsulta || new Date().toISOString().split("T")[0],
    criterioAssociacao: match.criterioAssociacao || null,
    codigoCar: match.carCode || null,
    titularMascarado: validarMascaraTitularSncr(match.ownerName),
    documentoMascarado: mascararDocumentoPessoal(match.ownerDocumentMasked),
    registroIncra: match.incraRegistry || null,
    areaImovelHa: area,
    bases: {
      uf: match.uf || fallbackUf,
      sicar: match.sicarArquivoOrigem,
      sigef: match.sigefArquivoOrigem,
      sncr: match.sncrArquivoOrigem,
      sncrDataBase: match.sncrDataBase,
    },
  };
}

/**
 * Executa o cruzamento espacial fundiário para um ponto geográfico.
 * Retorna RuralPropertyMatch com status estrito:
 * - "encontrado": polígono oficial intercepta a coordenada
 * - "aproximado": associação por Bounding Box / centroide
 * - "sem-correspondencia": consulta executada com sucesso, base cobre o local, mas não há imóvel
 * - "base-nao-disponivel": base não instalada ou UF sem cobertura
 * - "erro-na-consulta": falha técnica, timeout ou exceção no banco
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

  // Validação de entrada
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return {
      status: "erro-na-consulta",
      motivo: `Coordenadas inválidas: lat=${latitude}, lon=${longitude}`,
      uf,
    };
  }

  return new Promise((resolve) => {
    try {
      const projectRoot = process.cwd();
      const scriptPath = path.join(projectRoot, "scripts", "spatial_owner_matcher.py");
      const dbPath = path.isAbsolute(dbRelativePath)
        ? dbRelativePath
        : path.join(projectRoot, dbRelativePath);

      if (!fs.existsSync(scriptPath)) {
        return resolve({
          status: "erro-na-consulta",
          motivo: `Script de cruzamento não encontrado: ${scriptPath}`,
          uf,
        });
      }

      if (!fs.existsSync(dbPath)) {
        return resolve({
          status: "base-nao-disponivel",
          motivo: `Base fundiária não encontrada em ${dbPath}`,
          uf,
        });
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
          timeout: 20000,
          windowsHide: true,
          env: {
            ...process.env,
            PYTHONIOENCODING: "utf-8",
          },
        },
        (error, stdout, stderr) => {
          if (error) {
            return resolve({
              status: "erro-na-consulta",
              motivo: `Erro no subprocesso Python: ${error.message}${stderr ? " - " + stderr : ""}`,
              uf,
            });
          }

          try {
            const trimmed = stdout.trim();
            if (!trimmed) {
              return resolve({
                status: "erro-na-consulta",
                motivo: "Subprocesso retornou saída vazia.",
                uf,
              });
            }
            const parsed = JSON.parse(trimmed);
            if (!parsed || typeof parsed !== "object") {
              return resolve({
                status: "erro-na-consulta",
                motivo: "Resposta inválida do subprocesso de consulta.",
                uf,
              });
            }

            const cleanResult: RuralPropertyMatch = {
              status: parsed.status || "erro-na-consulta",
              motivo: parsed.status !== "encontrado" ? (parsed.mensagem || parsed.motivo || null) : null,
              uf: parsed.uf || uf,
              municipio: parsed.municipio,
              carCode: parsed.carCode,
              propertyName: parsed.propertyName,
              ownerName: parsed.ownerName,
              incraRegistry: parsed.incraRegistry,
              propertyAreaHa: typeof parsed.propertyAreaHa === "number" && parsed.propertyAreaHa > 0 ? parsed.propertyAreaHa : null,
              ownerDocumentMasked: parsed.ownerDocumentMasked,
              mensagem: parsed.mensagem,
              dataConsulta: parsed.dataConsulta,
              criterioAssociacao: parsed.criterioAssociacao,
              sicarArquivoOrigem: parsed.sicarArquivoOrigem,
              sicarDataBase: parsed.sicarDataBase,
              sigefArquivoOrigem: parsed.sigefArquivoOrigem,
              sigefDataBase: parsed.sigefDataBase,
              sncrArquivoOrigem: parsed.sncrArquivoOrigem,
              sncrDataBase: parsed.sncrDataBase,
            };

            return resolve(cleanResult);
          } catch (parseErr) {
            return resolve({
              status: "erro-na-consulta",
              motivo: `Falha ao interpretar JSON retornado: ${(parseErr as Error).message}`,
              uf,
            });
          }
        }
      );
    } catch (err) {
      return resolve({
        status: "erro-na-consulta",
        motivo: `Exceção inesperada na chamada: ${(err as Error).message}`,
        uf,
      });
    }
  });
}

export interface BatchMatchItem {
  id: string;
  latitude: number;
  longitude: number;
  uf?: string;
}

/**
 * Executa a consulta fundiária em lote para múltiplos pontos via Python/SQLite.
 */
export async function batchMatchRuralProperties(
  items: BatchMatchItem[],
  customDbPath?: string
): Promise<Record<string, RuralPropertyMatch>> {
  if (!items || items.length === 0) {
    return {};
  }

  return new Promise((resolve) => {
    try {
      const projectRoot = process.cwd();
      const scriptPath = path.join(projectRoot, "scripts", "spatial_owner_matcher.py");
      const dbRelative = customDbPath || "data/fundiario_brasil.db";
      const dbPath = path.isAbsolute(dbRelative)
        ? dbRelative
        : path.join(projectRoot, dbRelative);

      if (!fs.existsSync(scriptPath) || !fs.existsSync(dbPath)) {
        const statusFallback = !fs.existsSync(dbPath) ? "base-nao-disponivel" : "erro-na-consulta";
        const res: Record<string, RuralPropertyMatch> = {};
        for (const item of items) {
          res[item.id] = {
            status: statusFallback,
            motivo: `Arquivo ${!fs.existsSync(dbPath) ? "de banco" : "de script"} não encontrado.`,
            uf: item.uf,
          };
        }
        return resolve(res);
      }

      const pythonCmd = process.env.PYTHON_PATH || "python";
      const child = execFile(
        pythonCmd,
        [scriptPath, "--batch", "--db", dbPath],
        {
          cwd: projectRoot,
          timeout: 120000,
          maxBuffer: 10 * 1024 * 1024,
          windowsHide: true,
          env: {
            ...process.env,
            PYTHONIOENCODING: "utf-8",
          },
        },
        (error, stdout, stderr) => {
          if (error) {
            const res: Record<string, RuralPropertyMatch> = {};
            for (const item of items) {
              res[item.id] = {
                status: "erro-na-consulta",
                motivo: `Erro subprocesso: ${error.message}${stderr ? " - " + stderr : ""}`,
                uf: item.uf,
              };
            }
            return resolve(res);
          }

          try {
            const trimmed = stdout.trim();
            if (!trimmed) {
              const res: Record<string, RuralPropertyMatch> = {};
              for (const item of items) {
                res[item.id] = {
                  status: "erro-na-consulta",
                  motivo: "Saída vazia do subprocesso",
                  uf: item.uf,
                };
              }
              return resolve(res);
            }
            const parsed = JSON.parse(trimmed) as Record<string, RuralPropertyMatch>;
            return resolve(parsed || {});
          } catch (jsonErr) {
            const res: Record<string, RuralPropertyMatch> = {};
            for (const item of items) {
              res[item.id] = {
                status: "erro-na-consulta",
                motivo: `Erro JSON parse: ${(jsonErr as Error).message}`,
                uf: item.uf,
              };
            }
            return resolve(res);
          }
        }
      );

      const payload = items.map((it) => ({
        id: it.id,
        lat: it.latitude,
        lon: it.longitude,
        uf: it.uf,
      }));

      if (child.stdin) {
        child.stdin.write(JSON.stringify(payload));
        child.stdin.end();
      }
    } catch (err) {
      const res: Record<string, RuralPropertyMatch> = {};
      for (const item of items) {
        res[item.id] = {
          status: "erro-na-consulta",
          motivo: `Exceção batch: ${(err as Error).message}`,
          uf: item.uf,
        };
      }
      return resolve(res);
    }
  });
}
