import { describe, it, expect } from "vitest";
import path from "path";
import {
  gerarRelatorioFasePericial,
  inspecionarArtefatos,
  calcularSha256Arquivo,
  derivarEnunciadoViesClimatologico,
} from "../../../scripts/gerar_relatorio_fase";

describe("Gerador Mecânico de Relatório de Fase (W5)", () => {
  it("marca FALHA no topo quando a suíte de testes ou tipagem falha", () => {
    const relatorioFalha = gerarRelatorioFasePericial({
      artefatosParaInspecionar: ["package.json"],
      mockResultadoTsc: {
        comando: "npx tsc --noEmit",
        codigoSaida: 1,
        sucesso: false,
        saida: "error TS2304: Cannot find name 'foo'.",
      },
      mockResultadoVitest: {
        comando: "npx vitest run",
        codigoSaida: 0,
        sucesso: true,
        saida: "336 passed",
      },
    });

    expect(relatorioFalha.statusGeral).toBe("FALHA");
    expect(relatorioFalha.conteudoMarkdown).toContain("# 🚨 [FALHA NA SUÍTE DE TESTES]");
    expect(relatorioFalha.conteudoMarkdown).toContain("error TS2304");
  });

  it("marca SUCESSO quando a suíte passa e inclui SHA-256 e tamanho de cada artefato", () => {
    const relatorioSucesso = gerarRelatorioFasePericial({
      artefatosParaInspecionar: ["package.json", "tsconfig.json"],
      mockResultadoTsc: {
        comando: "npx tsc --noEmit",
        codigoSaida: 0,
        sucesso: true,
        saida: "",
      },
      mockResultadoVitest: {
        comando: "npx vitest run",
        codigoSaida: 0,
        sucesso: true,
        saida: "Test Files 45 passed (45)\nTests 338 passed (338)",
      },
    });

    expect(relatorioSucesso.statusGeral).toBe("SUCESSO");
    expect(relatorioSucesso.conteudoMarkdown).toContain("# ✅ [SUCESSO - SUÍTE 100% APROVADA]");

    // SHA-256 e tamanho dos artefatos listados
    const shaPkg = calcularSha256Arquivo(path.resolve(process.cwd(), "package.json"));
    expect(relatorioSucesso.conteudoMarkdown).toContain(shaPkg);
    expect(relatorioSucesso.conteudoMarkdown).toContain("`package.json`");
  });

  it("inspeciona artefatos e calcula SHA-256 real", () => {
    const itens = inspecionarArtefatos(["package.json"]);
    expect(itens).toHaveLength(1);
    expect(itens[0].existe).toBe(true);
    expect(itens[0].tamanhoBytes).toBeGreaterThan(0);
    expect(itens[0].sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  describe("Derivação Mecânica de Viés Climatológico (N1 - Falsificabilidade)", () => {
    it("dado conjunto sintético com desvios positivos, enunciado contém 'acima' e NÃO contém 'abaixo'", () => {
      const estacoesPositivas = {
        EST_A: {
          nome: "Estação Norte",
          criterioAceiteAno2022: { desvioParaMediaClimatologicaPercentual: 14.5 },
        },
        EST_B: {
          nome: "Estação Sul",
          criterioAceiteAno2022: { desvioParaMediaClimatologicaPercentual: 22.1 },
        },
      };

      const resultado = derivarEnunciadoViesClimatologico(estacoesPositivas);

      expect(resultado.estacoesAcima).toBe(2);
      expect(resultado.estacoesAbaixo).toBe(0);
      expect(resultado.enunciadoSintetico).toContain("acima");
      expect(resultado.enunciadoSintetico).not.toContain("abaixo");
    });

    it("dado conjunto sintético com desvios negativos, enunciado contém 'abaixo' e NÃO contém 'acima'", () => {
      const estacoesNegativas = {
        EST_X: {
          nome: "Estação Leste",
          criterioAceiteAno2022: { desvioParaMediaClimatologicaPercentual: -18.3 },
        },
        EST_Y: {
          nome: "Estação Oeste",
          criterioAceiteAno2022: { desvioParaMediaClimatologicaPercentual: -27.0 },
        },
      };

      const resultado = derivarEnunciadoViesClimatologico(estacoesNegativas);

      expect(resultado.estacoesAbaixo).toBe(2);
      expect(resultado.estacoesAcima).toBe(0);
      expect(resultado.enunciadoSintetico).toContain("abaixo");
      expect(resultado.enunciadoSintetico).not.toContain("acima");
    });

    it("deriva corretamente os dados reais da BP3 (5 acima, 1 na média, 0 abaixo)", () => {
      const estacoesBP3 = {
        TOLEDO: { criterioAceiteAno2022: { desvioParaMediaClimatologicaPercentual: -1.35 } },
        CASCAVEL: { criterioAceiteAno2022: { desvioParaMediaClimatologicaPercentual: 6.66 } },
        SANTA_HELENA: { criterioAceiteAno2022: { desvioParaMediaClimatologicaPercentual: 18.95 } },
        FOZ_DO_IGUACU: { criterioAceiteAno2022: { desvioParaMediaClimatologicaPercentual: 12.37 } },
        PALOTINA: { criterioAceiteAno2022: { desvioParaMediaClimatologicaPercentual: 34.48 } },
        MEDIANEIRA: { criterioAceiteAno2022: { desvioParaMediaClimatologicaPercentual: 19.93 } },
      };

      const res = derivarEnunciadoViesClimatologico(estacoesBP3);

      expect(res.estacoesAcima).toBe(5);
      expect(res.estacoesNaMedia).toBe(1);
      expect(res.estacoesAbaixo).toBe(0);
      expect(res.amplitudeMinPercentual).toBe(-1.35);
      expect(res.amplitudeMaxPercentual).toBe(34.48);
      expect(res.enunciadoSintetico).toContain("Precipitação acima da média histórica em 5 das 6 estações");
      expect(res.enunciadoSintetico).toContain("1 estação na média");
    });
  });
});
