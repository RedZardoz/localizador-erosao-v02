import { describe, it, expect } from "vitest";
import { validarInvariantesArtefato, assegurarInvariantesArtefato, ArtefatoProjetado } from "./invariantes";

describe("Invariantes de Exportação — Validações e Meta-Testes", () => {
  describe("Invariante 7: Detector de Constante Disfarçada", () => {
    it("bloqueia quando uma coluna numérica possui o mesmo valor em 150 linhas idênticas", () => {
      const linhas = Array.from({ length: 150 }, () => ({
        Codigo: "PR-001",
        Declividade_pct: 16.0, // defeito clássico do Localizador
        RUSLE_Perda_Solo_t_ha_ano: 35.2,
      }));

      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Declividade_pct", "RUSLE_Perda_Solo_t_ha_ano"],
        linhas,
      };

      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      const v7 = res.violacoes.filter((v) => v.invariante === 7);
      expect(v7.length).toBeGreaterThan(0);
      expect(v7.some((v) => (v.detalhes as any)?.coluna === "Declividade_pct")).toBe(true);
    });

    it("NÃO é desativado quando há valores vazios (corrige defeito S1-12)", () => {
      // 30 linhas com valor idêntico e 10 linhas vazias
      const linhas = [
        ...Array.from({ length: 25 }, () => ({
          Codigo: "PR-001",
          Declividade_pct: 12.0,
        })),
        ...Array.from({ length: 10 }, () => ({
          Codigo: "PR-002",
          Declividade_pct: null,
        })),
      ];

      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Declividade_pct"],
        linhas,
      };

      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 7)).toBe(true);
    });

    it("aprova dados com variância física natural", () => {
      const linhas = Array.from({ length: 30 }, (_, i) => ({
        Codigo: `PR-${i}`,
        Declividade_pct: 5.0 + i * 0.5,
      }));

      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Declividade_pct"],
        linhas,
      };

      const res = validarInvariantesArtefato(artefato);
      const v7 = res.violacoes.filter((v) => v.invariante === 7);
      expect(v7).toHaveLength(0);
    });
  });

  describe("Invariante 2: Lista de Permissão de Colunas por Perfil", () => {
    it("recusa coluna não permitida no perfil (ex: phiDiag ou severity)", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "phiDiag", "severity"],
        linhas: [{ Codigo: "PR-001", phiDiag: 0.5, severity: "Alta" }],
      };

      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 2)).toBe(true);
    });

    it("recusa features científicas ou rótulo no perfil campo-cego", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "campo-cego",
        cabecalho: ["Codigo", "Latitude", "Longitude", "Frequencia_Solo_Nu", "Rotulo_Classe"],
        linhas: [{ Codigo: "PR-001", Latitude: -25.0, Longitude: -53.0, Frequencia_Solo_Nu: 0.2, Rotulo_Classe: "Alta" }],
      };

      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      const v2 = res.violacoes.filter((v) => v.invariante === 2);
      expect(v2.length).toBe(2); // Frequencia_Solo_Nu e Rotulo_Classe
    });
  });

  describe("Invariante 6: Lista Negra de Literais Geográficos", () => {
    it("recusa literais proibidos como 'Custom', 'Bacia Local' ou 'Paraná' como município", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Municipio", "Bacia_Hidrografica"],
        linhas: [
          { Codigo: "PR-001", Municipio: "Paraná", Bacia_Hidrografica: "Bacia Hidrográfica Local" },
        ],
      };

      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 6)).toBe(true);
    });
  });
});
