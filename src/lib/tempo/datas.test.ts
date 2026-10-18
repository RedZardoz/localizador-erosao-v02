import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { dataCivilSaoPaulo, instanteUtc } from "./datas";
import { criarProvenienciaChirps } from "../chuva/chirps";
import { criarProvenienciaImerg } from "../chuva/imerg";

describe("C26 — Data civil no fuso de Brasília e instantes UTC", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("relógio fixo em 2026-10-05T23:30:00-03:00 retorna 2026-10-05 no fuso civil e 2026-10-06T02:30:00.000Z em UTC", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-05T23:30:00-03:00"));

    expect(dataCivilSaoPaulo()).toBe("2026-10-05");
    expect(instanteUtc()).toBe("2026-10-06T02:30:00.000Z");
  });

  it("criarProvenienciaChirps e criarProvenienciaImerg sem adquiridoEm devolvem indisponivel com data-da-fonte-desconhecida", () => {
    // @ts-expect-error teste de robustez em tempo de execução sem adquiridoEm
    const provChirps = criarProvenienciaChirps(12.5, "teste");
    expect(provChirps.estado).toBe("indisponivel");
    expect((provChirps as any).causa).toBe("data-da-fonte-desconhecida");

    // @ts-expect-error teste de robustez em tempo de execução sem adquiridoEm
    const provImerg = criarProvenienciaImerg(25.0, "teste");
    expect(provImerg.estado).toBe("indisponivel");
    expect((provImerg as any).causa).toBe("data-da-fonte-desconhecida");
  });

  it("varre src e falha se sobrar toISOString().split('T')[0] ou .slice(0, 10) fora do utilitário e da lista fechada de exceções UTC", () => {
    function normalizePath(p: string) {
      return p.replace(/\\/g, "/");
    }

    const EXCECOES_UTC_AUTORIZADAS = new Set([
      // Janelas de consulta temporal a acervos multiespectrais Sentinel-2/Landsat (estritamente UTC)
      normalizePath("src/lib/gee/serieTemporal.ts"),
      // Timestamps de metadados e coleções de satélite GEE (estritamente UTC)
      normalizePath("src/lib/gee/metadadosColecoes.ts"),
      // Linha de corte de guarda temporal para séries de satélite (estritamente UTC)
      normalizePath("src/components/inspetor/GraficoSerieTemporal.tsx"),
      // Utilitário de datas que encapsula e define as conversões
      normalizePath("src/lib/tempo/datas.ts"),
      // Exceções C25 pendentes de remoção de valor-padrão (InspetorPonto e ingestaoColetor)
      normalizePath("src/components/inspetor/InspetorPonto.tsx"),
      normalizePath("src/lib/rotulos/ingestaoColetor.ts"),
    ]);

    const arquivosComSplitIso: string[] = [];
    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        const rel = normalizePath(path.relative(process.cwd(), full));
        if (entry.isDirectory()) {
          scanDir(full);
        } else if (
          (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
          !entry.name.includes(".test.")
        ) {
          const content = fs.readFileSync(full, "utf8");
          const padrao = /toISOString\(\)\s*\.\s*(?:split\s*\(\s*["']T["']\s*\)\s*\[\s*0\s*\]|slice\s*\(\s*0\s*,\s*10\s*\)|substring\s*\(\s*0\s*,\s*10\s*\))/;
          if (padrao.test(content)) {
            if (!EXCECOES_UTC_AUTORIZADAS.has(rel)) {
              arquivosComSplitIso.push(rel);
            }
          }
        }
      }
    }

    scanDir(path.resolve(process.cwd(), "src"));
    expect(arquivosComSplitIso).toEqual([]);
  });
});
