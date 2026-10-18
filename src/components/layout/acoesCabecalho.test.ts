import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  obterDistribuicaoAcoes,
  ACOES_CABECALHO,
  AcaoCabecalhoId,
} from "./acoesCabecalho";

describe("U01 — Lógica pura de ações do cabeçalho por largura (acoesCabecalho.ts)", () => {
  const todasAcoes: AcaoCabecalhoId[] = [
    "defesa",
    "aoi",
    "amostras",
    "tema",
    "candidatos",
    "campanha",
    "matriz",
    "config",
    "export",
  ];

  it("deve conter todas as 9 ações mapeadas sem nenhuma perda (R16)", () => {
    const ids = ACOES_CABECALHO.map((a) => a.id);
    for (const acao of todasAcoes) {
      expect(ids).toContain(acao);
    }
    expect(ids.length).toBe(9);
  });

  it("em 1440px: todas as 9 ações devem ficar no cabeçalho e nenhuma no menu Mais Ações", () => {
    const dist = obterDistribuicaoAcoes(1440);
    expect(dist.noCabecalho.length).toBe(9);
    expect(dist.noMenu.length).toBe(0);
    for (const acao of todasAcoes) {
      expect(dist.noCabecalho).toContain(acao);
    }
  });

  it("em 1280px: ações densas vão para o menu, mantendo cabeçalho sem overflow", () => {
    const dist = obterDistribuicaoAcoes(1280);
    expect(dist.noCabecalho).not.toContain("matriz");
    expect(dist.noMenu).toContain("matriz");
    expect(dist.noMenu).toContain("campanha");
    // Nenhuma ação pode sumir
    const soma = [...dist.noCabecalho, ...dist.noMenu];
    expect(soma.length).toBe(9);
  });

  it("em 1024px: defesa, campanha, matriz e config vão para Mais Ações", () => {
    const dist = obterDistribuicaoAcoes(1024);
    expect(dist.noMenu).toEqual(expect.arrayContaining(["defesa", "campanha", "matriz", "config"]));
    expect(dist.noCabecalho).toContain("aoi");
    expect(dist.noCabecalho).toContain("candidatos");
    const soma = [...dist.noCabecalho, ...dist.noMenu];
    expect(soma.length).toBe(9);
  });

  it("em 768px: apenas controles essenciais no cabeçalho e o restante no menu", () => {
    const dist = obterDistribuicaoAcoes(768);
    expect(dist.noMenu).toEqual(
      expect.arrayContaining(["defesa", "candidatos", "campanha", "matriz", "config"])
    );
    expect(dist.noCabecalho).toContain("aoi");
    const soma = [...dist.noCabecalho, ...dist.noMenu];
    expect(soma.length).toBe(9);
  });

  it("em 390px: apenas controles vitais no cabeçalho e todas as ações secundárias no menu", () => {
    const dist = obterDistribuicaoAcoes(390);
    expect(dist.noCabecalho).toEqual(["aoi"]);
    expect(dist.noMenu.length).toBe(8);
    const soma = [...dist.noCabecalho, ...dist.noMenu];
    expect(soma.length).toBe(9);
  });
});

describe("U01 — Acessibilidade e atributos do cabeçalho (Header.tsx)", () => {
  const headerPath = path.resolve(process.cwd(), "src/components/layout/Header.tsx");
  const content = fs.readFileSync(headerPath, "utf8");

  it("o botão do menu Mais Ações deve possuir aria-expanded e aria-controls", () => {
    expect(content).toMatch(/aria-expanded=\{[^}]+\}/);
    expect(content).toMatch(/aria-controls="[^"]+"/);
  });

  it("cada botão só-ícone deve ter aria-label", () => {
    expect(content).toContain("aria-label=");
    expect(content).toMatch(/aria-label="Alternar tema/i);
    expect(content).toMatch(/aria-label="Configurações/i);
    expect(content).toMatch(/aria-label="Mais ações/i);
  });
});
