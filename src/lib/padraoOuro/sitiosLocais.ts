/**
 * ============================================================================
 * Carregador de Sítios de Referência Locais (DEC-10, Opção C)
 * ============================================================================
 *
 * Lê os dados confidenciais dos sítios de aferição (códigos CAR reais e geometrias)
 * a partir de `data/sitios_referencia_local.json` (fora do versionamento Git).
 *
 * Integridade garantida por SHA-256 (via arquivo `.sha256` ou env SAREL_SITIOS_SHA256).
 * Validação estrutural via Zod.
 * Em caso de ausência ou falha de integridade, devolve estado "indisponivel" gracioso.
 * NUNCA lança exceções não tratadas.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { z } from "zod";

export interface SitioLocal {
  id: string;
  codigoCar: string;
  nomeIdentificador?: string;
  municipio?: string;
  bbox?: [number, number, number, number];
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  [key: string]: unknown;
}

export interface ResultadoSitiosLocais {
  estado: "disponivel" | "indisponivel";
  causa?: string;
  sitios: SitioLocal[];
}

const SitioLocalSchema = z
  .object({
    id: z.string().min(1),
    codigoCar: z.string().min(1),
    nomeIdentificador: z.string().optional(),
    municipio: z.string().optional(),
    bbox: z
      .tuple([z.number(), z.number(), z.number(), z.number()])
      .optional(),
    geometry: z.object({
      type: z.literal("Polygon"),
      coordinates: z
        .array(z.array(z.array(z.number())))
        .refine(
          (rings) =>
            rings.length > 0 &&
            rings[0].length >= 4 &&
            rings[0].every((pt) => pt.length >= 2),
          {
            message:
              "Polygon geometry deve ter anel exterior com pelo menos 4 pontos",
          }
        ),
    }),
  })
  .passthrough();

const ArquivoSitiosSchema = z
  .object({
    versao: z.number().optional(),
    aviso: z.string().optional(),
    gerado_em: z.string().optional(),
    sitios: z.array(SitioLocalSchema).min(1),
  })
  .passthrough();

export function carregarSitiosLocais(): ResultadoSitiosLocais {
  try {
    const dataDir =
      process.env.SAREL_DATA_DIR || path.join(process.cwd(), "data");
    const jsonPath = path.join(dataDir, "sitios_referencia_local.json");
    const shaPath = jsonPath + ".sha256";

    if (!fs.existsSync(jsonPath)) {
      return {
        estado: "indisponivel",
        causa: "dado-local-ausente",
        sitios: [],
      };
    }

    let hashEsperado: string | null = null;
    if (
      process.env.SAREL_SITIOS_SHA256 &&
      process.env.SAREL_SITIOS_SHA256.trim()
    ) {
      hashEsperado = process.env.SAREL_SITIOS_SHA256.trim()
        .split(/\s+/)[0]
        .toLowerCase();
    } else if (fs.existsSync(shaPath)) {
      const conteudoSha = fs.readFileSync(shaPath, "utf8").trim();
      const primeiroToken = conteudoSha.split(/\s+/)[0];
      if (primeiroToken) {
        hashEsperado = primeiroToken.toLowerCase();
      }
    }

    if (!hashEsperado) {
      return {
        estado: "indisponivel",
        causa: "integridade",
        sitios: [],
      };
    }

    const fileBuffer = fs.readFileSync(jsonPath);
    const hashReal = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex")
      .toLowerCase();

    if (hashReal !== hashEsperado) {
      return {
        estado: "indisponivel",
        causa: "integridade",
        sitios: [],
      };
    }

    if (process.env.SAREL_SITIOS_SHA256 && fs.existsSync(shaPath)) {
      const shaDoArquivo = fs
        .readFileSync(shaPath, "utf8")
        .trim()
        .split(/\s+/)[0]
        .toLowerCase();
      if (shaDoArquivo !== hashReal) {
        return {
          estado: "indisponivel",
          causa: "integridade",
          sitios: [],
        };
      }
    }

    const conteudoJson = fileBuffer.toString("utf8");
    const parsed = JSON.parse(conteudoJson);

    const validacao = ArquivoSitiosSchema.safeParse(parsed);
    if (!validacao.success) {
      return {
        estado: "indisponivel",
        causa: "integridade",
        sitios: [],
      };
    }

    return {
      estado: "disponivel",
      sitios: validacao.data.sitios as SitioLocal[],
    };
  } catch (_erro) {
    return {
      estado: "indisponivel",
      causa: "integridade",
      sitios: [],
    };
  }
}
