import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { medido, modelado, Proveniencia } from "@/types/proveniencia";
import {
  podeEntrarEstratificacaoD12,
  N_MINIMO_OBSERVACOES_SOLO_NU_D11_2,
} from "@/lib/matriz/montagemTemporal";
import {
  particionarCandidatosEm18Estratos,
  CandidatoEstratificacao,
} from "@/lib/gee/estratificacao";
import { processarRespostaGeeReduceRegions } from "@/lib/gee/amostragemSoloNuLote";

describe("Guarda de D11.2 em 3 Camadas — Travas Obrigatórias (Prompt H)", () => {
  // Trava 1: Candidato com nObservações = 6 NÃO é estratificado
  it("Trava 1: candidato com nObservacoes = 6 não é elegível para estratificação", () => {
    const provN6 = medido(
      0.15,
      "GEE REST",
      "2016-2026",
      new Date().toISOString(),
      "n=6",
      {
        nObservacoes: 6,
        regime: "fallback_janela_curta",
        erroPadrao: 0.2041,
        elegivelD12: false,
      }
    );

    // Na rota, candidato com n=6 é barrado por podeEntrarEstratificacaoD12
    expect(podeEntrarEstratificacaoD12(provN6)).toBe(false);

    // Se tentar estratificar, particionarCandidatosEm18Estratos lança erro nomeando D11.2
    const candN6: CandidatoEstratificacao = {
      id: "cand-n6",
      latitude: -25.0,
      longitude: -50.0,
      declividadePct: 5.0,
      frequenciaSoloNu: 0.15,
      nivelK: 1,
      provenienciaE: provN6,
    };

    expect(() => particionarCandidatosEm18Estratos([candN6])).toThrow(/D11\.2/);
  });

  // Trava 2: 'medido' com n=6 é recusado por podeEntrarEstratificacaoD12
  it("Trava 2: medido com n=6 é categoricamente recusado por podeEntrarEstratificacaoD12", () => {
    const provMedidoN6 = medido(
      0.22,
      "GEE REST v1 reduceRegions",
      "2016-2026",
      new Date().toISOString(),
      "n=6",
      {
        nObservacoes: 6,
        regime: "fallback_janela_curta",
        erroPadrao: 0.2041,
        elegivelD12: false,
      }
    );
    expect(podeEntrarEstratificacaoD12(provMedidoN6)).toBe(false);
  });

  // Trava 3: Qualidade ausente é recusada (fail-closed)
  it("Trava 3: proveniência sem bloco qualidade é recusada (fail-closed)", () => {
    const provSemQualidadeMedido = medido(
      0.18,
      "GEE REST",
      "2016-2026"
    );
    expect(podeEntrarEstratificacaoD12(provSemQualidadeMedido)).toBe(false);

    const provSemQualidadeModelado = modelado(0.18, "Modelo", ["S2"]);
    expect(podeEntrarEstratificacaoD12(provSemQualidadeModelado)).toBe(false);
  });

  // Trava 4: Candidato sem provenienciaE falha nomeando D11.2
  it("Trava 4: candidato sem provenienciaE falha nomeando D11.2", () => {
    const candSemProv = {
      id: "cand-incompleto",
      latitude: -25.0,
      longitude: -50.0,
      declividadePct: 7.0,
      frequenciaSoloNu: 0.3,
      nivelK: 1 as const,
    } as unknown as CandidatoEstratificacao;

    expect(() => particionarCandidatosEm18Estratos([candSemProv])).toThrow(
      /D11\.2/
    );
  });

  // Trava 5: n = 12 exatamente é aceito (fronteira inclusiva)
  it("Trava 5: n = 12 exatamente é aceito (fronteira inclusiva D11.2)", () => {
    expect(N_MINIMO_OBSERVACOES_SOLO_NU_D11_2).toBe(12);

    const provN12 = medido(
      0.14,
      "GEE REST",
      "2016-2026",
      new Date().toISOString(),
      "n=12",
      {
        nObservacoes: 12,
        regime: "padrao_pleno",
        erroPadrao: 0.1443,
        elegivelD12: true,
      }
    );

    expect(podeEntrarEstratificacaoD12(provN12)).toBe(true);

    const candN12: CandidatoEstratificacao = {
      id: "cand-12",
      latitude: -25.0,
      longitude: -50.0,
      declividadePct: 5.0,
      frequenciaSoloNu: 0.14,
      nivelK: 1,
      provenienciaE: provN12,
    };

    expect(() => particionarCandidatosEm18Estratos([candN12])).not.toThrow();
  });

  // Trava 6: O lote grava qualidade.nObservacoes igual à contagem real
  it("Trava 6: lote processarRespostaGeeReduceRegions grava qualidade.nObservacoes igual à contagem real", () => {
    const pontos = [{ id: "pt-real-count", latitude: -24.71, longitude: -53.74 }];
    const respostaGee = {
      result: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "0",
            properties: {
              ponto_id: "pt-real-count",
              solo_nu_mean: 0.125,
              solo_nu_count: 537,
              Map_2020: 40,
              Map_2021: 40,
            },
          },
        ],
      },
    };

    const res = processarRespostaGeeReduceRegions(respostaGee, pontos);
    const item = res.get("pt-real-count");
    expect(item).toBeDefined();
    expect(item!.nObservacoes).toBe(537);
    expect(item!.frequenciaSoloNu.estado).toBe("medido");
    if (item!.frequenciaSoloNu.estado === "medido") {
      expect(item!.frequenciaSoloNu.qualidade).toBeDefined();
      expect(item!.frequenciaSoloNu.qualidade?.nObservacoes).toBe(537);
      expect(item!.frequenciaSoloNu.qualidade?.regime).toBe("padrao_pleno");
      expect(item!.frequenciaSoloNu.qualidade?.elegivelD12).toBe(true);
      expect(item!.frequenciaSoloNu.qualidade?.erroPadrao).toBe(Number((0.5 / Math.sqrt(537)).toFixed(4)));
    }
  });

  // Verificação com dado real dos 677 candidatos de BP3
  it("Verificação com dados reais: nenhum dos 677 candidatos de BP3 é barrado pela guarda D11.2", () => {
    const caminhoCache = path.resolve(
      process.cwd(),
      "docs/verificacoes/cache_frequencia_solo_nu_bp3.json"
    );
    expect(fs.existsSync(caminhoCache)).toBe(true);

    const raw = fs.readFileSync(caminhoCache, "utf-8");
    const parsed = JSON.parse(raw);
    const itens = Object.values(parsed.itens) as Array<{
      id: string;
      nObservacoes: number;
      frequenciaSoloNu: Proveniencia<number>;
    }>;

    expect(itens.length).toBe(677);

    const barrados: string[] = [];
    for (const item of itens) {
      expect(item.nObservacoes).toBeGreaterThanOrEqual(148);
      expect(item.nObservacoes).toBeLessThanOrEqual(1011);

      if (!podeEntrarEstratificacaoD12(item.frequenciaSoloNu)) {
        barrados.push(`${item.id} (n=${item.nObservacoes})`);
      }
    }

    // MANDATÓRIO: Nenhum dos 677 candidatos é barrado pela guarda!
    expect(barrados).toHaveLength(0);
  });
});
