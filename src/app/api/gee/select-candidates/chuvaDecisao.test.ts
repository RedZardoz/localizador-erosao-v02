import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { DECISOES } from "@/config/decisoes";

describe("C15 — Campos de chuva em select-candidates não aguardam D13", () => {
  const caminhoRoute = path.resolve(
    process.cwd(),
    "src/app/api/gee/select-candidates/route.ts"
  );
  const conteudoRoute = fs.readFileSync(caminhoRoute, "utf8");

  it("não deve conter 'Aguardando Decisão D13' no código da rota", () => {
    expect(conteudoRoute).not.toContain("Aguardando Decisão D13");
  });

  it("nenhum motivo com causa decisao-pendente pode citar decisão já decidida em decisoes.ts", () => {
    // Procura blocos com causa: "decisao-pendente" e motivo: "..."
    const regexBloco = /causa:\s*["']decisao-pendente["'][\s\S]{1,120}?motivo:\s*["']([^"']+)["']/g;
    const regexBlocoInvertido = /motivo:\s*["']([^"']+)["'][\s\S]{1,120}?causa:\s*["']decisao-pendente["']/g;

    const violacoes: string[] = [];

    const checarTrecho = (motivo: string) => {
      const matchD = motivo.match(/\bD(\d+)\b/);
      if (matchD) {
        const id = `D${matchD[1].padStart(2, "0")}`;
        const dec = (DECISOES as Record<string, any>)[id];
        if (dec && dec.estado === "decidida") {
          violacoes.push(
            `Motivo '${motivo}' cita ${id} com causa 'decisao-pendente', mas ${id} está decidida.`
          );
        }
      }
    };

    let m: RegExpExecArray | null;
    while ((m = regexBloco.exec(conteudoRoute)) !== null) {
      checarTrecho(m[1]);
    }
    while ((m = regexBlocoInvertido.exec(conteudoRoute)) !== null) {
      checarTrecho(m[1]);
    }

    expect(violacoes).toEqual([]);
  });

  it("os 5 campos de chuva em select-candidates devem ter causa 'nao-calculado' e motivo exato", () => {
    const motivoEsperado =
      "Módulo de chuva (src/lib/chuva) não está ligado a esta rota; ligação depende da DEC-6 do pesquisador";

    // Extrai o bloco de chuva
    const idxInicio = conteudoRoute.indexOf("chuva: {");
    expect(idxInicio, "bloco chuva deve existir em route.ts").toBeGreaterThan(0);
    const trechoChuva = conteudoRoute.slice(idxInicio, idxInicio + 1500);

    const campos = [
      "precipAcum30d",
      "precipAcum90d",
      "i30Max",
      "nEventosErosivos",
      "indiceMecanismo",
    ];

    for (const campo of campos) {
      const regexCampo = new RegExp(
        `${campo}:\\s*\\{[\\s\\S]*?causa:\\s*["']([^"']+)["'][\\s\\S]*?motivo:\\s*["']([^"']+)["']`
      );
      const m = trechoChuva.match(regexCampo);
      expect(m, `campo ${campo} deve estar estruturado no bloco chuva`).not.toBeNull();
      const [, causa, motivo] = m!;

      expect(causa, `${campo} não pode ser decisao-pendente`).not.toBe("decisao-pendente");
      expect(causa, `${campo} deve ter causa nao-calculado`).toBe("nao-calculado");
      expect(motivo, `${campo} deve ter o motivo exato prescrito`).toBe(motivoEsperado);
    }
  });
});
