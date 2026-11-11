import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  CHAVES_PROIBIDAS_CEGAMENTO,
  DECLARACAO_NATUREZA,
  construirSeloPublico,
  validarInvariantesSeloCompleto,
  TODOS_ESTRATOS_D12,
  localizarSeloCompleto,
} from "../../../scripts/auditoria/gerar_selo_publico_d16.mjs";
import { SeloPublicoD16, SeloSorteioD16 } from "@/lib/gee/sorteioPoligonosTipos";

const REPO_ROOT = process.cwd();
const CAMINHO_PUBLICO = path.resolve(
  REPO_ROOT,
  "docs/verificacoes/selo_publico_d16_2026-11-10.json"
);

function coletarTodasChavesRecursivo(obj: unknown, prefixo = ""): string[] {
  const chaves: string[] = [];
  if (!obj || typeof obj !== "object") return chaves;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      chaves.push(...coletarTodasChavesRecursivo(obj[i], `${prefixo}[${i}]`));
    }
  } else {
    for (const [k, v] of Object.entries(obj)) {
      chaves.push(k);
      chaves.push(...coletarTodasChavesRecursivo(v, prefixo ? `${prefixo}.${k}` : k));
    }
  }
  return chaves;
}

function coletarTodosValoresRecursivo(obj: unknown): unknown[] {
  const valores: unknown[] = [];
  if (obj === null || obj === undefined) return valores;

  if (typeof obj !== "object") {
    valores.push(obj);
    return valores;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      valores.push(...coletarTodosValoresRecursivo(item));
    }
  } else {
    for (const v of Object.values(obj)) {
      valores.push(...coletarTodosValoresRecursivo(v));
    }
  }
  return valores;
}

describe("Selo Público Redigido do Sorteio D16 — Travas de Cegamento e Integridade (Prompt L)", () => {
  it("o arquivo do selo público redigido existe em docs/verificacoes/", () => {
    expect(
      fs.existsSync(CAMINHO_PUBLICO),
      `Selo público redigido não encontrado em ${CAMINHO_PUBLICO}. Execute scripts/auditoria/gerar_selo_publico_d16.mjs.`
    ).toBe(true);
  });

  const rawPublico = fs.existsSync(CAMINHO_PUBLICO)
    ? fs.readFileSync(CAMINHO_PUBLICO, "utf8")
    : "{}";
  const seloPublico: SeloPublicoD16 = JSON.parse(rawPublico);

  describe("Trava 1 — Lista de proibidos recursiva (roda sempre em qualquer clone)", () => {
    it("nenhuma chave do selo público em qualquer profundidade pode constar na lista de proibidos", () => {
      const chavesEncontradas = coletarTodasChavesRecursivo(seloPublico);

      for (const proibida of CHAVES_PROIBIDAS_CEGAMENTO) {
        expect(
          chavesEncontradas,
          `Violação de cegamento: a chave proibida '${proibida}' foi encontrada na estrutura do selo público redigido.`
        ).not.toContain(proibida);
      }
    });

    it("nenhuma string do selo público contém códigos opacos VANT-BLIND-*, prefixos de candidato ou IDs de polígono", () => {
      const valores = coletarTodosValoresRecursivo(seloPublico);
      const strings = valores.filter((v): v is string => typeof v === "string");

      const PADRAO_VANT_BLIND = /VANT-BLIND-[0-9A-Fa-f]{6,}/i;
      const PADRAO_ID_CANDIDATO = /cand-\d+/i;
      const PADRAO_ID_POLIGONO_INDIVIDUAL = /D16_E_\d_\d_\d_Q\d+/;

      for (const s of strings) {
        expect(s).not.toMatch(PADRAO_VANT_BLIND);
        expect(s).not.toMatch(PADRAO_ID_CANDIDATO);
        expect(s).not.toMatch(PADRAO_ID_POLIGONO_INDIVIDUAL);
      }
    });

    it("contém a declaração formal de natureza em campo próprio de texto", () => {
      expect(seloPublico.declaracaoNatureza).toBe(DECLARACAO_NATUREZA);
    });

    it("tabela por estrato possui exatamente 18 estratos agregados e nenhum polígono individual", () => {
      expect(Array.isArray(seloPublico.estratos)).toBe(true);
      expect(seloPublico.estratos).toHaveLength(18);

      const idsEstratos = seloPublico.estratos.map((e) => e.estratoId);
      expect(idsEstratos).toEqual(TODOS_ESTRATOS_D12);

      // Garante que cada estrato contém apenas métricas agregadas
      for (const est of seloPublico.estratos) {
        expect(Object.keys(est).sort()).toEqual([
          "areaHectares",
          "estratoId",
          "nCandidatos",
          "nHeldOut",
          "nSorteados",
          "nTreino",
          "pi_i",
          "regime",
          "w_i",
        ]);
      }
    });
  });

  describe("Trava 2 — Nenhuma coordenada da BP3 (roda sempre em qualquer clone)", () => {
    it("nenhum valor numérico em qualquer profundidade pode coincidir com a faixa geográfica da BP3", () => {
      const valores = coletarTodosValoresRecursivo(seloPublico);
      const numeros = valores.filter((v): v is number => typeof v === "number" && Number.isFinite(v));

      const MIN_LAT_BP3 = -26.0;
      const MAX_LAT_BP3 = -23.0;
      const MIN_LON_BP3 = -55.0;
      const MAX_LON_BP3 = -53.0;

      for (const n of numeros) {
        const estaNaFaixaLat = n >= MIN_LAT_BP3 && n <= MAX_LAT_BP3;
        const estaNaFaixaLon = n >= MIN_LON_BP3 && n <= MAX_LON_BP3;

        expect(
          estaNaFaixaLat,
          `Possível vazamento de latitude: valor numérico ${n} encontrado na faixa [${MIN_LAT_BP3}, ${MAX_LAT_BP3}].`
        ).toBe(false);

        expect(
          estaNaFaixaLon,
          `Possível vazamento de longitude: valor numérico ${n} encontrado na faixa [${MIN_LON_BP3}, ${MAX_LON_BP3}].`
        ).toBe(false);
      }
    });
  });

  describe("Travas 3, 4 e 5 — Verificação cruzada com o selo completo (pulam em clone sem selo)", () => {
    const loc = localizarSeloCompleto(path.resolve(REPO_ROOT, "docs/verificacoes/sorteio"));
    const seloCompletoExiste = loc.arquivos.length === 1 && fs.existsSync(loc.arquivos[0]);

    it("Trava 3: equivalência estrita de totais e somas agregadas com o selo completo", () => {
      if (!seloCompletoExiste) {
        console.warn(
          "[PULANDO TRAVA 3] Selo completo ausente em docs/verificacoes/sorteio/ (comportamento legítimo em clone limpo sob guarda K2)."
        );
        return;
      }

      const rawCompleto = fs.readFileSync(loc.arquivos[0], "utf8");
      const seloCompleto: SeloSorteioD16 = JSON.parse(rawCompleto);

      expect(seloPublico.versaoEsquema).toBe(seloCompleto.versaoEsquema);
      expect(seloPublico.semente).toBe(seloCompleto.semente);
      expect(seloPublico.politicaSemente).toBe(seloCompleto.politicaSemente);
      expect(seloPublico.gitCommit).toBe(seloCompleto.gitCommit);
      expect(seloPublico.sha256ConjuntoCandidatos).toBe(seloCompleto.sha256ConjuntoCandidatos);
      expect(seloPublico.hashIntegridade).toBe(seloCompleto.hashIntegridade);
      expect(seloPublico.totalCandidatosEntrada).toBe(seloCompleto.totalCandidatosEntrada);
      expect(seloPublico.totalPoligonosSorteados).toBe(seloCompleto.totalPoligonosSorteados);
      expect(seloPublico.totalTreino).toBe(seloCompleto.totalTreino);
      expect(seloPublico.totalHeldOut).toBe(seloCompleto.totalHeldOut);
      expect(seloPublico.areaTotalHectares).toBe(seloCompleto.areaTotalHectares);

      const somaNSorteados = seloPublico.estratos.reduce((a, b) => a + b.nSorteados, 0);
      expect(somaNSorteados).toBe(seloCompleto.totalPoligonosSorteados);

      const somaNCandidatos = seloPublico.estratos.reduce((a, b) => a + b.nCandidatos, 0);
      expect(somaNCandidatos).toBe(seloCompleto.totalCandidatosEntrada);

      const somaNTreino = seloPublico.estratos.reduce((a, b) => a + b.nTreino, 0);
      expect(somaNTreino).toBe(seloCompleto.totalTreino);

      const somaNHeldOut = seloPublico.estratos.reduce((a, b) => a + b.nHeldOut, 0);
      expect(somaNHeldOut).toBe(seloCompleto.totalHeldOut);
    });

    it("Trava 4: vínculo íntegro de sha256SeloCompleto com o hash SHA-256 do arquivo completo no disco", () => {
      if (!seloCompletoExiste) {
        console.warn(
          "[PULANDO TRAVA 4] Selo completo ausente em docs/verificacoes/sorteio/ (comportamento legítimo em clone limpo sob guarda K2)."
        );
        return;
      }

      const bytesCompleto = fs.readFileSync(loc.arquivos[0]);
      const hashEsperado = crypto.createHash("sha256").update(bytesCompleto).digest("hex");

      expect(seloPublico.sha256SeloCompleto).toBe(hashEsperado);
    });

    it("Trava 5: idempotência estrita (geração repetida produz bytes idênticos bit-a-bit)", () => {
      if (!seloCompletoExiste) {
        console.warn(
          "[PULANDO TRAVA 5] Selo completo ausente em docs/verificacoes/sorteio/ (comportamento legítimo em clone limpo sob guarda K2)."
        );
        return;
      }

      const bytesCompleto = fs.readFileSync(loc.arquivos[0]);
      const seloCompleto: SeloSorteioD16 = JSON.parse(bytesCompleto.toString("utf8"));
      const hashCompleto = crypto.createHash("sha256").update(bytesCompleto).digest("hex");

      const g1 = construirSeloPublico(seloCompleto, hashCompleto);
      const g2 = construirSeloPublico(seloCompleto, hashCompleto);

      const s1 = JSON.stringify(g1, null, 2) + "\n";
      const s2 = JSON.stringify(g2, null, 2) + "\n";

      expect(s1).toBe(s2);
      expect(rawPublico).toBe(s1);
    });

    it("recusa gerar selo público se o selo completo violar os 8 invariantes", () => {
      if (!seloCompletoExiste) return;

      const rawCompleto = fs.readFileSync(loc.arquivos[0], "utf8");
      const seloCorrompido = JSON.parse(rawCompleto);
      seloCorrompido.totalTreino += 1; // quebra INV_1

      expect(() => {
        construirSeloPublico(seloCorrompido, "0".repeat(64));
      }).toThrow(/\[SELO_INVALIDO:INV_1_TOTAL_TREINO_HELDOUT\]/);
    });
  });
});
