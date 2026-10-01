import { describe, it, expect } from "vitest";
import {
  calcularDesenhoAmostral,
  exportarRelatorioSimulacaoDesenho,
  CONFIGURACAO_REGISTRADA_D16,
} from "./calculadoraDesenho";
import { REGISTRO_DECISOES } from "@/config/decisoes";

describe("Calculadora de Desenho Amostral — X5 (PPGTCA 2026)", () => {
  it("deve reproduzir exatamente o pré-set de D16 emendada (224 m, razão 1:2, 361 ha) sem alertas críticos", () => {
    const res = calcularDesenhoAmostral({
      ladoMetros: 224,
      razaoAspectoMaxima: 2.0,
      areaTotalVoadaHa: 361,
    });

    expect(res.areaPorPoligonoHa).toBeCloseTo(5.02, 2);
    expect(res.numPoligonosTotal).toBe(72);
    expect(res.poligonosPorEstrato).toBe(4);
    expect(res.unidadesEfetivasTotais).toBe(1845);
    expect(res.unidadesEfetivasHeldOut).toBe(923);
    expect(res.tetoPreditoresD24).toBe(9); // >= 8 preditores exigidos por D24
    expect(res.autorizacoesNecessarias).toBe(72);
    expect(res.fracaoImoveisElegiveis).toBeGreaterThan(0.60);
    expect(res.inadmissivel).toBe(false);

    // Deltas contra D16 devem ser nulos ou mínimos no pré-set
    expect(res.deltaContraD16.deltaPoligonosTotal).toBe(0);
    expect(res.deltaContraD16.deltaPoligonosPorEstrato).toBe(0);
    expect(res.deltaContraD16.deltaUnidadesEfetivas).toBe(0);
    expect(res.deltaContraD16.deltaAutorizacoes).toBe(0);

    // Salvaguardas ativas
    expect(res.salvaguarda.somenteExploratorio).toBe(true);
    expect(res.salvaguarda.alteraD16).toBe(false);
    expect(res.salvaguarda.persisteParametro).toBe(false);
  });

  it("deve disparar alertas CRÍTICOS e marcar como inadmissível se quebrar a replicação 2+2 ou teto de preditores", () => {
    // Configuração com área voada muito baixa (120 ha) e lado grande (350 m = 12,25 ha)
    // 120 / 12,25 = ~10 polígonos no total -> menos de 1 por estrato!
    const res = calcularDesenhoAmostral({
      ladoMetros: 350,
      razaoAspectoMaxima: 1.0,
      areaTotalVoadaHa: 120,
    });

    expect(res.inadmissivel).toBe(true);

    const idsCriticos = res.alertas
      .filter((a) => a.severidade === "critico")
      .map((a) => a.id);

    expect(idsCriticos).toContain("critico-pareamento-treino-teste");
    expect(idsCriticos).toContain("critico-unidades-efetivas-insuficientes");
    expect(idsCriticos).toContain("critico-teto-preditores");
  });

  it("deve disparar alertas de ATENÇÃO quando aplicável (lado < 200m, razão > 2.0, autorizações > 72)", () => {
    const res = calcularDesenhoAmostral({
      ladoMetros: 180, // < 200 m -> efeito de borda
      razaoAspectoMaxima: 2.5, // > 2.0 -> razão de aspecto alta
      areaTotalVoadaHa: 400, // polígonos: 400 / 3.24 = 123 > 72 autorizações
    });

    const idsAtencao = res.alertas
      .filter((a) => a.severidade === "atencao")
      .map((a) => a.id);

    expect(idsAtencao).toContain("atencao-efeito-borda");
    expect(idsAtencao).toContain("atencao-razao-aspecto-alta");
    expect(idsAtencao).toContain("atencao-viabilidade-campo");
  });

  it("deve gerar relatório textual formatado sem conter códigos opacos ou dados de intérprete (Cegamento W2)", () => {
    const entradas = {
      ladoMetros: 224,
      razaoAspectoMaxima: 2.0,
      areaTotalVoadaHa: 361,
    };
    const saidas = calcularDesenhoAmostral(entradas);
    const relatorio = exportarRelatorioSimulacaoDesenho(entradas, saidas);

    expect(relatorio).toContain("Relatório de Simulação de Desenho Amostral");
    expect(relatorio).toContain("D16 Registrada");
    expect(relatorio).toContain("ESTA CALCULADORA É EXCLUSIVAMENTE EXPLORATÓRIA");

    // W2: Não pode conter códigos de intérprete
    expect(relatorio).not.toMatch(/int[0-9]+/i);
    expect(relatorio).not.toContain("codigoOpaco");
    expect(relatorio).not.toContain("interpreteCego");
  });

  it("assevera que a calculadora jamais modifica o objeto registrado em REGISTRO_DECISOES.D16 (P8)", () => {
    const d16Antes = JSON.stringify(REGISTRO_DECISOES.D16);

    calcularDesenhoAmostral({
      ladoMetros: 300,
      razaoAspectoMaxima: 1.5,
      areaTotalVoadaHa: 500,
    });

    const d16Depois = JSON.stringify(REGISTRO_DECISOES.D16);
    expect(d16Antes).toBe(d16Depois);
  });
});
