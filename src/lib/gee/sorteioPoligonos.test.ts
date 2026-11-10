import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  CandidatoSorteioD16,
  ErroPreCondicaoSorteioD16,
  verificarPreCondicoesSorteioD16,
  sortear72PoligonosD16,
  validarInvariantesSeloD16,
  INVARIANTES_SELO_D16,
} from "./sorteioPoligonos";
import { TODOS_ESTRATOS_D12 } from "./estratificacao";
import { medido } from "../../types/proveniencia";

function gerarPoolCandidatosElegiveis(nPorEstrato = 4): CandidatoSorteioD16[] {
  const sTercis = [4.0, 9.0, 16.0];
  const eTercis = [0.10, 0.40, 0.75];
  const kNiveis: Array<1 | 2> = [1, 2];

  const candidatos: CandidatoSorteioD16[] = [];
  let seq = 1;
  for (let sIdx = 0; sIdx < sTercis.length; sIdx++) {
    for (let eIdx = 0; eIdx < eTercis.length; eIdx++) {
      for (const k of kNiveis) {
        for (let i = 0; i < nPorEstrato; i++) {
          const freq = Number((eTercis[eIdx] + i * 0.005 + (sIdx * 2 + k) * 0.0001).toFixed(4));
          candidatos.push({
            id: `CAND-${String(seq).padStart(4, "0")}`,
            latitude: -24.8 - seq * 0.001,
            longitude: -53.8 - seq * 0.001,
            declividadePct: Number((sTercis[sIdx] + i * 0.05 + (eIdx * 2 + k) * 0.001).toFixed(4)),
            frequenciaSoloNu: freq,
            nivelK: k,
            classeWorldCover2020: i % 2 === 0 ? 40 : 30,
            classeWorldCover2021: 40,
            kAmbiguoAssociacao: k === 2 && i === 0,
            provenienciaE: medido(
              freq,
              "GEE REST v1 reduceRegions (S2_SR_HARMONIZED)",
              "2016-01-01 a 2026-06-30",
              new Date().toISOString(),
              "reduceRegions first(solo_nu_mean), nObservacoes=50",
              {
                nObservacoes: 50,
                regime: "padrao_pleno",
                erroPadrao: 0.0707,
                elegivelD12: true,
              }
            ),
          });
          seq++;
        }
      }
    }
  }
  return candidatos;
}

describe("Motor de Sorteio dos 36 Polígonos de Drone — FASE A1 (D16 / D23)", () => {
  it("deve aprovar as 7 pré-condições para um pool íntegro com >= 4 candidatos nos 18 estratos", () => {
    const pool = gerarPoolCandidatosElegiveis(5);
    const rel = verificarPreCondicoesSorteioD16(pool, { seloExistenteCaminho: null });
    expect(rel.aprovado).toBe(true);
    expect(rel.condicaoFalha).toBeNull();
    expect(rel.estratosDeficientes).toHaveLength(0);
    for (const idEstrato of TODOS_ESTRATOS_D12) {
      expect(rel.contagemCandidatosPorEstrato[idEstrato]).toBeGreaterThanOrEqual(4);
    }
  });

  it("deve recusar e nomear 'nenhum_selo_anterior' se um selo já existir (Idempotência D23)", () => {
    const pool = gerarPoolCandidatosElegiveis(3);
    expect(() =>
      sortear72PoligonosD16(pool, {
        semente: 20260928,
        gitCommit: "abc1234",
        sha256ConjuntoCandidatos: "deadbeef",
        seloExistenteCaminho: "docs/verificacoes/sorteio/sorteio_d16_2026-09-28.json",
      })
    ).toThrowError(ErroPreCondicaoSorteioD16);

    try {
      sortear72PoligonosD16(pool, {
        semente: 20260928,
        gitCommit: "abc1234",
        sha256ConjuntoCandidatos: "deadbeef",
        seloExistenteCaminho: "docs/verificacoes/sorteio/sorteio_d16_2026-09-28.json",
      });
    } catch (e) {
      expect(e).toBeInstanceOf(ErroPreCondicaoSorteioD16);
      expect((e as ErroPreCondicaoSorteioD16).condicaoFalha).toBe("nenhum_selo_anterior");
    }
  });

  it("deve recusar e nomear 'worldcover_duas_epocas' se faltar época ou houver classe fora de [30, 40]", () => {
    const pool = gerarPoolCandidatosElegiveis(3);
    pool[5].classeWorldCover2020 = 60;
    try {
      verificarPreCondicoesSorteioD16(pool, { lancarErro: true });
      expect.fail("Deveria ter recusado classe 60 em 2020");
    } catch (e) {
      expect(e).toBeInstanceOf(ErroPreCondicaoSorteioD16);
      expect((e as ErroPreCondicaoSorteioD16).condicaoFalha).toBe("worldcover_duas_epocas");
    }
  });

  it("deve recusar e nomear 'k_ambiguo_associacao_booleano' se kAmbiguoAssociacao for undefined", () => {
    const pool = gerarPoolCandidatosElegiveis(4);
    pool[2].kAmbiguoAssociacao = undefined;
    try {
      verificarPreCondicoesSorteioD16(pool, { lancarErro: true });
      expect.fail("Deveria ter recusado kAmbiguoAssociacao undefined");
    } catch (e) {
      expect(e).toBeInstanceOf(ErroPreCondicaoSorteioD16);
      expect((e as ErroPreCondicaoSorteioD16).condicaoFalha).toBe("k_ambiguo_associacao_booleano");
    }
  });

  it("deve aceitar e preservar os três estados de kAmbiguoAssociacao (true, false, 'indisponivel') e unidadeDeterminanteK2024 (W2/W3)", () => {
    const pool = gerarPoolCandidatosElegiveis(5);
    pool[0].kAmbiguoAssociacao = true;
    for (let i = 1; i < pool.length; i++) {
      if (i % 2 === 1) {
        pool[i].kAmbiguoAssociacao = "indisponivel";
        pool[i].unidadeDeterminanteK2024 = {
          codUm: "LVdf30",
          codUm2: "LVdf30",
          ogcFid: 14132,
          erodUm: "Baixa",
          kSolos: 0.0148,
          kSolosBruto: 0.0148,
          nivelK: pool[i].nivelK,
        };
      }
    }
    const relatorio = verificarPreCondicoesSorteioD16(pool);
    expect(relatorio.aprovado).toBe(true);

    const selo = sortear72PoligonosD16(pool, {
      semente: 42,
      gitCommit: "commit-w3",
      sha256ConjuntoCandidatos: "sha256-w3",
      geradoEm: "2026-09-28T15:00:00.000Z",
    });
    const sorteadoIndisponivel = selo.poligonos.find(
      (p) => p.kAmbiguoAssociacao === "indisponivel"
    );
    expect(sorteadoIndisponivel).toBeDefined();
    expect(sorteadoIndisponivel!.kAmbiguoAssociacao).toBe("indisponivel");
    expect(sorteadoIndisponivel!.kAmbiguoAssociacao).not.toBe(false);
    expect(sorteadoIndisponivel!.unidadeDeterminanteK2024?.ogcFid).toBe(14132);
    expect(sorteadoIndisponivel!.unidadeDeterminanteK2024?.codUm2).toBe("LVdf30");
  });

  it("deve recusar e nomear 'minimo_4_candidatos_por_estrato' quando exigirMinimo4PorEstrato for ativado no modo legado", () => {
    for (const qtd of [1, 2, 3]) {
      const pool = gerarPoolCandidatosElegiveis(qtd);
      try {
        verificarPreCondicoesSorteioD16(pool, { lancarErro: true, exigirMinimo4PorEstrato: true });
        expect.fail(`Deveria ter recusado estratos com ${qtd} candidato(s)`);
      } catch (e) {
        expect(e).toBeInstanceOf(ErroPreCondicaoSorteioD16);
        expect((e as ErroPreCondicaoSorteioD16).condicaoFalha).toBe(
          "minimo_4_candidatos_por_estrato"
        );
        expect((e as Error).message).toContain("E_1_1_1");
        expect((e as Error).message).toContain("ao menos 4 candidatos cada");
      }
    }
  });

  describe("Regra de Estrato Deficiente e Sorteio D16 — Travas de π_i (Prompt H / Opção a)", () => {
    it("Trava T3.1: N_h = 3 produz censo com π_i = 1, w_i = 1 e NÃO lança erro", () => {
      const pool = gerarPoolCandidatosElegiveis(3);
      let selo: any;
      expect(() => {
        selo = sortear72PoligonosD16(pool, {
          semente: 42,
          gitCommit: "commit-teste-nh3",
          sha256ConjuntoCandidatos: "sha256-nh3",
        });
      }).not.toThrow();

      expect(selo).toBeDefined();
      // Em cada estrato com 3 candidatos, foram tomados os 3 candidatos (censo)
      // 18 estratos * 3 = 54 polígonos
      expect(selo.totalPoligonosSorteados).toBe(54);
      for (const p of selo.poligonos) {
        expect(p.pi_i).toBe(1);
        expect(p.w_i).toBe(1);
        expect(p.pi_i * p.w_i).toBe(1);
      }
      expect(selo.estratosCenso).toHaveLength(18);
    });

    it("Trava T3.2: N_h = 0 produz estrato vazio declarado no selo e NÃO lança erro", () => {
      // Gera pool com 4 candidatos em 17 estratos e 0 no estrato E_1_3_2
      const pool = gerarPoolCandidatosElegiveis(4).filter((c) => {
        // Exclui candidatos que cairiam em E_1_3_2 (s=1, e=3, k=2)
        return !(c.nivelK === 2 && (c.declividadePct ?? 0) < 6 && (c.frequenciaSoloNu ?? 0) > 0.6);
      });

      let selo: any;
      expect(() => {
        selo = sortear72PoligonosD16(pool, {
          semente: 42,
          gitCommit: "commit-teste-nh0",
          sha256ConjuntoCandidatos: "sha256-nh0",
        });
      }).not.toThrow();

      expect(selo).toBeDefined();
      expect(selo.estratosVazios.length).toBeGreaterThan(0);
      for (const vazioId of selo.estratosVazios) {
        expect(selo.contagemCandidatosPorEstrato[vazioId]).toBe(0);
        const poligonosNoEstrato = selo.poligonos.filter((p: any) => p.estratoId === vazioId);
        expect(poligonosNoEstrato).toHaveLength(0);
      }
    });

    it("Trava T3.3: N_h = 4 produz π_i = 1 e é marcado como censo no selo", () => {
      const pool = gerarPoolCandidatosElegiveis(4);
      const selo = sortear72PoligonosD16(pool, {
        semente: 42,
        gitCommit: "commit-teste-nh4",
        sha256ConjuntoCandidatos: "sha256-nh4",
      });

      expect(selo.totalPoligonosSorteados).toBe(72);
      expect(selo.estratosCenso).toHaveLength(18);
      for (const p of selo.poligonos) {
        expect(p.pi_i).toBe(1);
        expect(p.w_i).toBe(1);
        expect(p.pi_i * p.w_i).toBe(1);
      }
    });

    it("Trava T3.4: N_h = 51 produz π_i = 4/51, w_i = 51/4 e π_i × w_i = 1", () => {
      const caminhoCandidatos = path.resolve(
        process.cwd(),
        "docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json"
      );
      const caminhoCache = path.resolve(
        process.cwd(),
        "docs/verificacoes/cache_frequencia_solo_nu_bp3.json"
      );
      const dadosCandidatos = JSON.parse(fs.readFileSync(caminhoCandidatos, "utf-8"));
      const dadosCache = JSON.parse(fs.readFileSync(caminhoCache, "utf-8"));

      const mapaCache = new Map();
      for (const item of Object.values(dadosCache.itens) as any[]) {
        mapaCache.set(item.id, item);
      }

      const poolReal: CandidatoSorteioD16[] = [];
      for (const cand of dadosCandidatos.candidatos) {
        const med = mapaCache.get(cand.id);
        if (!med || !med.frequenciaSoloNu || typeof med.frequenciaSoloNu.valor !== "number") continue;

        poolReal.push({
          id: cand.id,
          latitude: cand.latitude,
          longitude: cand.longitude,
          declividadePct: cand.declividadePct,
          frequenciaSoloNu: med.frequenciaSoloNu.valor,
          nivelK: cand.nivelK,
          classeWorldCover2020: 40,
          classeWorldCover2021: 40,
          kAmbiguoAssociacao: false,
          provenienciaE: med.frequenciaSoloNu,
        });
      }

      const selo = sortear72PoligonosD16(poolReal, {
        semente: 42,
        gitCommit: "commit-teste-nh51",
        sha256ConjuntoCandidatos: "sha256-nh51",
      });

      // O estrato E_3_1_2 (S3 x E1 x K2) tem exatamente 51 candidatos no universo real
      expect(selo.contagemCandidatosPorEstrato["E_3_1_2"]).toBe(51);

      const poligonos51 = selo.poligonos.filter((p) => p.estratoId === "E_3_1_2");
      expect(poligonos51).toHaveLength(4);
      for (const p of poligonos51) {
        expect(p.nCandidatosEstrato).toBe(51);
        expect(p.pi_i).toBeCloseTo(4 / 51, 6);
        expect(p.w_i).toBeCloseTo(51 / 4, 6);
        expect(p.pi_i * p.w_i).toBeCloseTo(1, 6);
      }
    });

    it("Trava T3.5: Total sorteado sobre o universo real da BP3 é exatamente 67 (não 72)", () => {
      const caminhoCandidatos = path.resolve(
        process.cwd(),
        "docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json"
      );
      const caminhoCache = path.resolve(
        process.cwd(),
        "docs/verificacoes/cache_frequencia_solo_nu_bp3.json"
      );
      expect(fs.existsSync(caminhoCandidatos)).toBe(true);
      expect(fs.existsSync(caminhoCache)).toBe(true);

      const dadosCandidatos = JSON.parse(fs.readFileSync(caminhoCandidatos, "utf-8"));
      const dadosCache = JSON.parse(fs.readFileSync(caminhoCache, "utf-8"));

      const mapaCache = new Map();
      for (const item of Object.values(dadosCache.itens) as any[]) {
        mapaCache.set(item.id, item);
      }

      const poolReal: CandidatoSorteioD16[] = [];
      for (const cand of dadosCandidatos.candidatos) {
        const med = mapaCache.get(cand.id);
        if (!med || !med.frequenciaSoloNu || typeof med.frequenciaSoloNu.valor !== "number") continue;

        poolReal.push({
          id: cand.id,
          latitude: cand.latitude,
          longitude: cand.longitude,
          declividadePct: cand.declividadePct,
          frequenciaSoloNu: med.frequenciaSoloNu.valor,
          nivelK: cand.nivelK,
          classeWorldCover2020: 40,
          classeWorldCover2021: 40,
          kAmbiguoAssociacao: false,
          provenienciaE: med.frequenciaSoloNu,
        });
      }

      expect(poolReal).toHaveLength(677);

      const selo = sortear72PoligonosD16(poolReal, {
        semente: 42,
        gitCommit: "commit-teste-bp3",
        sha256ConjuntoCandidatos: "sha256-bp3",
      });

      // Total sorteado sobre o universo atual: 67, não 72!
      expect(selo.totalPoligonosSorteados).toBe(67);
      expect(selo.totalTreino).toBe(34);
      expect(selo.totalHeldOut).toBe(33);
      expect(selo.totalTreino + selo.totalHeldOut).toBe(67);

      // Estrato vazio declarado: E_1_3_2 (S1 x E3 x K2)
      expect(selo.estratosVazios).toContain("E_1_3_2");

      // Estratos de censo em K=2 (pi_i = 1):
      // E_1_2_2 (Nh=3), E_2_2_2 (Nh=4), E_2_3_2 (Nh=4), E_3_2_2 (Nh=4)
      expect(selo.estratosCenso).toContain("E_1_2_2");
      expect(selo.estratosCenso).toContain("E_2_2_2");
      expect(selo.estratosCenso).toContain("E_2_3_2");
      expect(selo.estratosCenso).toContain("E_3_2_2");

      // Exatamente 5 dos 9 estratos de K=2 são censo ou vazios
      const estratosK2CensoOuVazio = [...selo.estratosCenso!, ...selo.estratosVazios!].filter(e => e.endsWith("_2"));
      expect(estratosK2CensoOuVazio).toHaveLength(5);
    });
  });

  it("deve recusar e nomear 'guarda_anticircularidade_d16' se candidato contiver scoreSuscetibilidade, scoreJev ou severidade", () => {
    const pool = gerarPoolCandidatosElegiveis(4);
    pool[0].scorePrioridade = 0.88;
    try {
      verificarPreCondicoesSorteioD16(pool, { lancarErro: true });
      expect.fail("Deveria ter recusado campo proibido de rastreio espectral");
    } catch (e) {
      expect(e).toBeInstanceOf(ErroPreCondicaoSorteioD16);
      expect((e as ErroPreCondicaoSorteioD16).condicaoFalha).toBe("guarda_anticircularidade_d16");
      expect((e as Error).message).toContain("scorePrioridade");
    }
  });

  it("T3.1: deve garantir determinismo bit-a-bit sob a mesma semente (incluindo hashIntegridade) e sensibilidade à semente preservando a partição 36+36=72", () => {
    const pool = gerarPoolCandidatosElegiveis(6);

    const execucaoA = sortear72PoligonosD16(pool, {
      semente: 20260928,
      gitCommit: "commit-a",
      sha256ConjuntoCandidatos: "sha256-pool",
      geradoEm: "2026-09-28T15:00:00.000Z",
    });

    const execucaoB = sortear72PoligonosD16(pool, {
      semente: 20260928,
      gitCommit: "commit-a",
      sha256ConjuntoCandidatos: "sha256-pool",
      geradoEm: "2026-09-28T15:00:00.000Z",
    });

    const execucaoSementeDiferente = sortear72PoligonosD16(pool, {
      semente: 20260929,
      gitCommit: "commit-a",
      sha256ConjuntoCandidatos: "sha256-pool",
      geradoEm: "2026-09-28T15:00:00.000Z",
    });

    // Determinismo estrito com a mesma semente
    expect(execucaoA.hashIntegridade).toBe(execucaoB.hashIntegridade);
    expect(execucaoA.hashIntegridade).toMatch(/^[0-9a-f]{16}$/);
    expect(
      execucaoA.poligonos.map((p) => ({
        idPoligono: p.idPoligono,
        idCandidatoOrigem: p.idCandidatoOrigem,
        estratoId: p.estratoId,
        papelConjunto: p.papelConjunto,
        pi_i: p.pi_i,
        w_i: p.w_i,
      }))
    ).toEqual(
      execucaoB.poligonos.map((p) => ({
        idPoligono: p.idPoligono,
        idCandidatoOrigem: p.idCandidatoOrigem,
        estratoId: p.estratoId,
        papelConjunto: p.papelConjunto,
        pi_i: p.pi_i,
        w_i: p.w_i,
      }))
    );

    // Sensibilidade à semente mantendo invariantes de partição
    expect(execucaoSementeDiferente.hashIntegridade).not.toBe(execucaoA.hashIntegridade);
    expect(
      execucaoSementeDiferente.poligonos.map((p) => `${p.idCandidatoOrigem}:${p.papelConjunto}`)
    ).not.toEqual(
      execucaoA.poligonos.map((p) => `${p.idCandidatoOrigem}:${p.papelConjunto}`)
    );
    expect(execucaoSementeDiferente.poligonos).toHaveLength(72);
    expect(execucaoSementeDiferente.totalTreino).toBe(36);
    expect(execucaoSementeDiferente.totalHeldOut).toBe(36);
    for (const idEstrato of TODOS_ESTRATOS_D12) {
      const quarteto = execucaoSementeDiferente.poligonos.filter((p) => p.estratoId === idEstrato);
      expect(quarteto).toHaveLength(4);
      expect(quarteto.map((p) => p.papelConjunto).sort()).toEqual([
        "held-out",
        "held-out",
        "treino",
        "treino",
      ]);
    }
  });

  it("T3.2: deve satisfazer a identidade de Horvitz-Thompson pi_i * w_i = 1 sobre estratos com tamanhos N_h distintos", () => {
    // Gera candidatos com quantidades distintas por estrato (ex.: entre 2 e 11 candidatos por estrato, incluindo primos 3, 5, 7, 11)
    const sTercis = [3.5, 9.5, 18.0];
    const eTercis = [0.08, 0.38, 0.78];
    const kNiveis: Array<1 | 2> = [1, 2];
    const tamanhosDesejados = [4, 5, 6, 7, 8, 9, 10, 11, 4, 5, 7, 9, 11, 4, 6, 8, 5, 7];

    const candidatosHeterogeneos: CandidatoSorteioD16[] = [];
    let seq = 1;
    let estratoCounter = 0;
    for (let sIdx = 0; sIdx < sTercis.length; sIdx++) {
      for (let eIdx = 0; eIdx < eTercis.length; eIdx++) {
        for (const k of kNiveis) {
          const nNesteEstrato = tamanhosDesejados[estratoCounter];
          estratoCounter++;
          for (let i = 0; i < nNesteEstrato; i++) {
            const freq = Number((eTercis[eIdx] + i * 0.003 + (sIdx * 2 + k) * 0.0001).toFixed(4));
            candidatosHeterogeneos.push({
              id: `HET-${String(seq).padStart(4, "0")}`,
              latitude: -24.7 - seq * 0.001,
              longitude: -53.9 - seq * 0.001,
              declividadePct: Number((sTercis[sIdx] + i * 0.03 + (eIdx * 2 + k) * 0.001).toFixed(4)),
              frequenciaSoloNu: freq,
              nivelK: k,
              classeWorldCover2020: 40,
              classeWorldCover2021: 30,
              kAmbiguoAssociacao: false,
              provenienciaE: medido(
                freq,
                "GEE REST v1 reduceRegions",
                "2016-01-01 a 2026-06-30",
                new Date().toISOString(),
                "nObservacoes=50",
                {
                  nObservacoes: 50,
                  regime: "padrao_pleno",
                  erroPadrao: 0.0707,
                  elegivelD12: true,
                }
              ),
            });
            seq++;
          }
        }
      }
    }

    const selo = sortear72PoligonosD16(candidatosHeterogeneos, {
      semente: 20260928,
      gitCommit: "commit-ht",
      sha256ConjuntoCandidatos: "sha256-ht",
      geradoEm: "2026-09-28T15:05:00.000Z",
    });

    const tamanhosObservados = Object.values(selo.contagemCandidatosPorEstrato);
    expect(new Set(tamanhosObservados).size).toBeGreaterThan(4);

    for (const p of selo.poligonos) {
      const nh = p.nCandidatosEstrato;
      expect(nh).toBeGreaterThanOrEqual(4);
      expect(p.pi_i).toBeCloseTo(4 / nh, 8);
      expect(p.w_i).toBeCloseTo(nh / 4, 8);
      expect(p.pi_i * p.w_i).toBeCloseTo(1.0, 7);
    }
  });

  it("T3.3: sortear72PoligonosD16 sorteia 72 polígonos de 5,02 ha (4 por estrato: 2 treino + 2 held-out, pi_i = 4 / N_h) conforme emenda D16 (f5be525)", () => {
    const pool = gerarPoolCandidatosElegiveis(6); // 6 candidatos por estrato = 108 candidatos
    const selo72 = sortear72PoligonosD16(pool, {
      semente: 20260929,
      gitCommit: "f5be525",
      sha256ConjuntoCandidatos: "sha256-conjunto-teste",
      geradoEm: "2026-09-29T19:20:00.000Z",
    });

    expect(selo72.totalPoligonosSorteados).toBe(72);
    expect(selo72.totalTreino).toBe(36);
    expect(selo72.totalHeldOut).toBe(36);
    expect(selo72.areaTotalHectares).toBe(361.44);
    expect(selo72.poligonos).toHaveLength(72);

    for (const idEstrato of TODOS_ESTRATOS_D12) {
      const quarteto = selo72.poligonos.filter((p: any) => p.estratoId === idEstrato);
      expect(quarteto).toHaveLength(4);
      expect(quarteto.map((p: any) => p.papelConjunto).sort()).toEqual([
        "held-out",
        "held-out",
        "treino",
        "treino",
      ]);
      for (const p of quarteto) {
        expect(p.areaHectares).toBe(5.02);
        expect(p.pi_i).toBeCloseTo(4 / p.nCandidatosEstrato, 8);
        expect(p.w_i).toBeCloseTo(p.nCandidatosEstrato / 4, 8);
        expect(p.pi_i * p.w_i).toBeCloseTo(1.0, 7);
      }
    }
  });

  it("C01 / A01: assevera que PainelSorteioD16 não importa módulos com node:* nem sorteioPoligonos diretamente", () => {
    const painelPath = path.resolve(__dirname, "../../components/decisoes/PainelSorteioD16.tsx");
    const conteudo = fs.readFileSync(painelPath, "utf-8");
    expect(conteudo).not.toMatch(/from\s+["']@\/lib\/gee\/sorteioPoligonos["']/);
    expect(conteudo).not.toMatch(/node:(crypto|child_process|fs)/);
  });
});

describe("N10 — Contrato de Sorteio 72 Polígonos D16 (REVISAO_GLOBAL B1)", () => {
  it("(i) sortear72PoligonosD16 com semente 0, negativa, fracionária ou NaN deve lançar erro", () => {
    const pool = gerarPoolCandidatosElegiveis(5);
    const opcoesBase = {
      gitCommit: "abc1234",
      sha256ConjuntoCandidatos: "sha256-valido",
    };
    for (const sem of [0, -1, 1.5, NaN]) {
      expect(() =>
        sortear72PoligonosD16(pool, { ...opcoesBase, semente: sem } as any)
      ).toThrow(/Semente de sorteio inválida/);
    }
  });

  it("(ii) com candidato DRY-CAND-…, isSynthetic: true ou origemSintetica: true deve lançar erro (mesma mensagem da versão antiga)", () => {
    const pool1 = gerarPoolCandidatosElegiveis(5);
    pool1[0].id = "DRY-CAND-0001";
    expect(() =>
      sortear72PoligonosD16(pool1, { semente: 20260928, gitCommit: "c1", sha256ConjuntoCandidatos: "sha1" } as any)
    ).toThrow(
      "Recusa de sorteio D23 (T4.3): o selo de sorteio jamais pode ser gerado a partir de candidatos sintéticos/fabricados (DRY-CAND- / isSynthetic)."
    );

    const pool2 = gerarPoolCandidatosElegiveis(5);
    pool2[0].isSynthetic = true;
    expect(() =>
      sortear72PoligonosD16(pool2, { semente: 20260928, gitCommit: "c1", sha256ConjuntoCandidatos: "sha1" } as any)
    ).toThrow(
      "Recusa de sorteio D23 (T4.3): o selo de sorteio jamais pode ser gerado a partir de candidatos sintéticos/fabricados (DRY-CAND- / isSynthetic)."
    );

    const pool3 = gerarPoolCandidatosElegiveis(5);
    pool3[0].origemSintetica = true;
    expect(() =>
      sortear72PoligonosD16(pool3, { semente: 20260928, gitCommit: "c1", sha256ConjuntoCandidatos: "sha1" } as any)
    ).toThrow(
      "Recusa de sorteio D23 (T4.3): o selo de sorteio jamais pode ser gerado a partir de candidatos sintéticos/fabricados (DRY-CAND- / isSynthetic)."
    );
  });

  it("(iii) sem gitCommit ou sem sha256ConjuntoCandidatos nas opções deve lançar erro (nada de HEAD nem constante)", () => {
    const pool = gerarPoolCandidatosElegiveis(5);
    expect(() =>
      sortear72PoligonosD16(pool, { semente: 20260928, sha256ConjuntoCandidatos: "sha1" } as any)
    ).toThrow(/gitCommit/);

    expect(() =>
      sortear72PoligonosD16(pool, { semente: 20260928, gitCommit: "c1" } as any)
    ).toThrow(/sha256ConjuntoCandidatos/);
  });

  it("(iv) o selo devolvido tem sha256ConjuntoCandidatos igual ao informado e hashIntegridade DIFERENTE para sementes diferentes e para conjuntos de polígonos diferentes (hash do conteúdo, não da semente)", () => {
    const pool1 = gerarPoolCandidatosElegiveis(5);
    const seloA = sortear72PoligonosD16(pool1, {
      semente: 20260928,
      gitCommit: "commit1",
      sha256ConjuntoCandidatos: "sha-especifico-1",
    } as any);
    expect(seloA.sha256ConjuntoCandidatos).toBe("sha-especifico-1");

    const seloB = sortear72PoligonosD16(pool1, {
      semente: 20260929,
      gitCommit: "commit1",
      sha256ConjuntoCandidatos: "sha-especifico-1",
    } as any);
    expect(seloA.hashIntegridade).not.toBe(seloB.hashIntegridade);

    const pool2 = gerarPoolCandidatosElegiveis(6);
    const seloC = sortear72PoligonosD16(pool2, {
      semente: 20260928,
      gitCommit: "commit1",
      sha256ConjuntoCandidatos: "sha-especifico-2",
    } as any);
    expect(seloA.hashIntegridade).not.toBe(seloC.hashIntegridade);
  });

  it("(v) a ordem de chegada dos candidatos não altera o resultado (embaralhe o vetor de entrada e compare os IDs sorteados)", () => {
    const pool1 = gerarPoolCandidatosElegiveis(5);
    const pool2 = [...pool1].reverse();

    const selo1 = sortear72PoligonosD16(pool1, {
      semente: 20260928,
      gitCommit: "commit1",
      sha256ConjuntoCandidatos: "sha-teste",
    } as any);

    const selo2 = sortear72PoligonosD16(pool2, {
      semente: 20260928,
      gitCommit: "commit1",
      sha256ConjuntoCandidatos: "sha-teste",
    } as any);

    const ids1 = selo1.poligonos.map((p) => p.idCandidatoOrigem);
    const ids2 = selo2.poligonos.map((p) => p.idCandidatoOrigem);
    expect(ids1).toEqual(ids2);
  });

  it("(vi) totalPoligonosSorteados = 72, totalTreino = 36, totalHeldOut = 36", () => {
    const pool = gerarPoolCandidatosElegiveis(5);
    const selo = sortear72PoligonosD16(pool, {
      semente: 20260928,
      gitCommit: "c1",
      sha256ConjuntoCandidatos: "sha1",
    } as any);
    expect(selo.totalPoligonosSorteados).toBe(72);
    expect(selo.totalTreino).toBe(36);
    expect(selo.totalHeldOut).toBe(36);
    expect(selo.poligonos.filter((p) => p.papelConjunto === "treino")).toHaveLength(36);
    expect(selo.poligonos.filter((p) => p.papelConjunto === "held-out")).toHaveLength(36);
  });
});

describe("C07 (A15) — Candidatos com medidas ausentes no sorteio D16", () => {
  it("nenhum candidato com medida ausente vira 0, a contagem de excluídos é reportada e PainelSorteioD16.tsx não contém ?? 0", () => {
    const painelSrc = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/decisoes/PainelSorteioD16.tsx"),
      "utf-8"
    );
    expect(painelSrc).not.toMatch(/\?\?\s*0/);

    const pool = gerarPoolCandidatosElegiveis(5);
    (pool[0] as any).declividadePct = null;
    (pool[1] as any).frequenciaSoloNu = null;

    const relatorio = verificarPreCondicoesSorteioD16(pool as any, { lancarErro: false });
    expect(relatorio.candidatosExcluidosMedidaAusente).toBe(2);
    expect(relatorio.totalCandidatos).toBe(pool.length - 2);
  });
});

describe("Prompt I — Invariantes de Totais e Integridade do Selo de Sorteio D16", () => {
  function clonarSelo(selo: any): any {
    return JSON.parse(JSON.stringify(selo));
  }

  it("1. Caminho feliz: sorteio válido sobre pool sintético passa pelos 8 invariantes", () => {
    const pool = gerarPoolCandidatosElegiveis(5);
    const selo = sortear72PoligonosD16(pool, {
      semente: 12345,
      gitCommit: "commit-feliz",
      sha256ConjuntoCandidatos: "sha256-feliz",
    });

    expect(selo.versaoEsquema).toBe("1.4.0");
    expect(selo.invariantesVerificados).toEqual([
      "INV_1_TOTAL_TREINO_HELDOUT",
      "INV_2_AREA_TOTAL",
      "INV_3_SOMA_POLIGONOS_POR_ESTRATO",
      "INV_4_PARTICAO_CANDIDATOS",
      "INV_5_POLIGONOS_UNICOS",
      "INV_6_CENSO_PI_1",
      "INV_7_ESTRATO_VAZIO",
      "INV_8_HORVITZ_THOMPSON",
    ]);

    expect(() => validarInvariantesSeloD16(selo)).not.toThrow();
  });

  describe("2. Testes de adulteração por invariante (8 testes)", () => {
    it("Adulteração 1: INV_1_TOTAL_TREINO_HELDOUT lança se totalTreino + totalHeldOut != totalPoligonosSorteados", () => {
      const pool = gerarPoolCandidatosElegiveis(5);
      const selo = sortear72PoligonosD16(pool, {
        semente: 12345,
        gitCommit: "commit-tamper",
        sha256ConjuntoCandidatos: "sha256-tamper",
      });

      const corrompido = clonarSelo(selo);
      corrompido.totalTreino = corrompido.totalTreino + 1;

      expect(() => validarInvariantesSeloD16(corrompido)).toThrow(
        /\[SELO_INVALIDO:INV_1_TOTAL_TREINO_HELDOUT\]/
      );
    });

    it("Adulteração 2: INV_2_AREA_TOTAL lança se areaTotalHectares != totalSorteados * 5.02", () => {
      const pool = gerarPoolCandidatosElegiveis(5);
      const selo = sortear72PoligonosD16(pool, {
        semente: 12345,
        gitCommit: "commit-tamper",
        sha256ConjuntoCandidatos: "sha256-tamper",
      });

      const corrompido = clonarSelo(selo);
      corrompido.areaTotalHectares = 999.99;

      expect(() => validarInvariantesSeloD16(corrompido)).toThrow(
        /\[SELO_INVALIDO:INV_2_AREA_TOTAL\]/
      );
    });

    it("Adulteração 3: INV_3_SOMA_POLIGONOS_POR_ESTRATO lança se totalPoligonosSorteados != soma dos polígonos por estrato", () => {
      const pool = gerarPoolCandidatosElegiveis(5);
      const selo = sortear72PoligonosD16(pool, {
        semente: 12345,
        gitCommit: "commit-tamper",
        sha256ConjuntoCandidatos: "sha256-tamper",
      });

      const corrompido = clonarSelo(selo);
      corrompido.poligonos.pop(); // remove 1 polígono sem atualizar totalPoligonosSorteados

      expect(() => validarInvariantesSeloD16(corrompido)).toThrow(
        /\[SELO_INVALIDO:INV_3_SOMA_POLIGONOS_POR_ESTRATO\]/
      );
    });

    it("Adulteração 4: INV_4_PARTICAO_CANDIDATOS lança se totalCandidatosEntrada != soma de N_h por estrato", () => {
      const pool = gerarPoolCandidatosElegiveis(5);
      const selo = sortear72PoligonosD16(pool, {
        semente: 12345,
        gitCommit: "commit-tamper",
        sha256ConjuntoCandidatos: "sha256-tamper",
      });

      const corrompido = clonarSelo(selo);
      corrompido.totalCandidatosEntrada = corrompido.totalCandidatosEntrada + 10;

      expect(() => validarInvariantesSeloD16(corrompido)).toThrow(
        /\[SELO_INVALIDO:INV_4_PARTICAO_CANDIDATOS\]/
      );
    });

    it("Adulteração 5: INV_5_POLIGONOS_UNICOS lança se houver identificador de polígono repetido", () => {
      const pool = gerarPoolCandidatosElegiveis(5);
      const selo = sortear72PoligonosD16(pool, {
        semente: 12345,
        gitCommit: "commit-tamper",
        sha256ConjuntoCandidatos: "sha256-tamper",
      });

      const corrompido = clonarSelo(selo);
      corrompido.poligonos[1].idPoligono = corrompido.poligonos[0].idPoligono;

      expect(() => validarInvariantesSeloD16(corrompido)).toThrow(
        /\[SELO_INVALIDO:INV_5_POLIGONOS_UNICOS\]/
      );
    });

    it("Adulteração 6: INV_6_CENSO_PI_1 lança se estrato de censo tiver polígono com pi_i != 1", () => {
      const pool = gerarPoolCandidatosElegiveis(4); // Com 4 por estrato, todos são censo (Nh=4)
      const selo = sortear72PoligonosD16(pool, {
        semente: 12345,
        gitCommit: "commit-tamper",
        sha256ConjuntoCandidatos: "sha256-tamper",
      });

      expect(selo.estratosCenso?.length).toBeGreaterThan(0);
      const corrompido = clonarSelo(selo);
      corrompido.poligonos[0].pi_i = 0.8;
      corrompido.poligonos[0].w_i = 1.25;

      expect(() => validarInvariantesSeloD16(corrompido)).toThrow(
        /\[SELO_INVALIDO:INV_6_CENSO_PI_1\]/
      );
    });

    it("Adulteração 7: INV_7_ESTRATO_VAZIO lança se estrato vazio tiver N_h > 0 ou polígonos alocados", () => {
      const pool = gerarPoolCandidatosElegiveis(4).filter(
        (c) => !(c.nivelK === 2 && (c.declividadePct ?? 0) < 6 && (c.frequenciaSoloNu ?? 0) > 0.6)
      );
      const selo = sortear72PoligonosD16(pool, {
        semente: 12345,
        gitCommit: "commit-tamper",
        sha256ConjuntoCandidatos: "sha256-tamper",
      });

      expect(selo.estratosVazios).toContain("E_1_3_2");

      const corrompido = clonarSelo(selo);
      // Declara E_1_1_1 como estrato vazio, mas ele possui Nh = 4 e 4 polígonos alocados
      corrompido.estratosVazios = ["E_1_1_1"];

      expect(() => validarInvariantesSeloD16(corrompido)).toThrow(
        /\[SELO_INVALIDO:INV_7_ESTRATO_VAZIO\]/
      );
    });

    it("Adulteração 8: INV_8_HORVITZ_THOMPSON lança se pi_i * w_i != 1 ou pi_i fora de (0, 1]", () => {
      const pool = gerarPoolCandidatosElegiveis(5);
      const selo = sortear72PoligonosD16(pool, {
        semente: 12345,
        gitCommit: "commit-tamper",
        sha256ConjuntoCandidatos: "sha256-tamper",
      });

      const corrompido = clonarSelo(selo);
      corrompido.poligonos[0].w_i = 999.0;

      expect(() => validarInvariantesSeloD16(corrompido)).toThrow(
        /\[SELO_INVALIDO:INV_8_HORVITZ_THOMPSON\]/
      );
    });
  });

  it("3. Censo: estrato com N_h = 3 passa nos invariantes 6 e 8 com pi_i = 1", () => {
    const pool = gerarPoolCandidatosElegiveis(4);
    const idx = pool.findIndex(
      (c) =>
        c.nivelK === 2 &&
        (c.declividadePct ?? 0) < 6 &&
        (c.frequenciaSoloNu ?? 0) >= 0.3 &&
        (c.frequenciaSoloNu ?? 0) < 0.6
    );
    if (idx !== -1) {
      pool.splice(idx, 1);
    }

    const selo = sortear72PoligonosD16(pool, {
      semente: 42,
      gitCommit: "commit-censo3",
      sha256ConjuntoCandidatos: "sha-censo3",
    });

    expect(selo.estratosCenso).toBeDefined();
    for (const idCenso of selo.estratosCenso!) {
      const polis = selo.poligonos.filter((p) => p.estratoId === idCenso);
      for (const p of polis) {
        expect(p.pi_i).toBe(1);
        expect(p.w_i).toBe(1);
        expect(p.pi_i * p.w_i).toBe(1);
      }
    }
    expect(() => validarInvariantesSeloD16(selo)).not.toThrow();
  });

  it("4. Vazio: estrato com N_h = 0 passa no invariante 7 sem alocar polígono", () => {
    const pool = gerarPoolCandidatosElegiveis(4).filter(
      (c) => !(c.nivelK === 2 && (c.declividadePct ?? 0) < 6 && (c.frequenciaSoloNu ?? 0) > 0.6)
    );

    const selo = sortear72PoligonosD16(pool, {
      semente: 42,
      gitCommit: "commit-vazio0",
      sha256ConjuntoCandidatos: "sha-vazio0",
    });

    expect(selo.estratosVazios).toContain("E_1_3_2");
    expect(selo.contagemCandidatosPorEstrato["E_1_3_2"]).toBe(0);
    expect(selo.poligonos.filter((p) => p.estratoId === "E_1_3_2")).toHaveLength(0);
    expect(() => validarInvariantesSeloD16(selo)).not.toThrow();
  });

  it("5. O universo real: com 677 candidatos de BP3, passa nos 8 invariantes e totais são 67 / 34 / 33 / 336,34", () => {
    const caminhoCandidatos = path.resolve(
      process.cwd(),
      "docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json"
    );
    const caminhoCache = path.resolve(
      process.cwd(),
      "docs/verificacoes/cache_frequencia_solo_nu_bp3.json"
    );
    const dadosCandidatos = JSON.parse(fs.readFileSync(caminhoCandidatos, "utf-8"));
    const dadosCache = JSON.parse(fs.readFileSync(caminhoCache, "utf-8"));

    const mapaCache = new Map();
    for (const item of Object.values(dadosCache.itens) as any[]) {
      mapaCache.set(item.id, item);
    }

    const poolReal: CandidatoSorteioD16[] = [];
    for (const cand of dadosCandidatos.candidatos) {
      const med = mapaCache.get(cand.id);
      if (!med || !med.frequenciaSoloNu || typeof med.frequenciaSoloNu.valor !== "number") continue;

      poolReal.push({
        id: cand.id,
        latitude: cand.latitude,
        longitude: cand.longitude,
        declividadePct: cand.declividadePct,
        frequenciaSoloNu: med.frequenciaSoloNu.valor,
        nivelK: cand.nivelK,
        classeWorldCover2020: 40,
        classeWorldCover2021: 40,
        kAmbiguoAssociacao: false,
        provenienciaE: med.frequenciaSoloNu,
      });
    }

    expect(poolReal).toHaveLength(677);

    const selo = sortear72PoligonosD16(poolReal, {
      semente: 42,
      gitCommit: "commit-teste-real-inv",
      sha256ConjuntoCandidatos: "sha256-real-inv",
    });

    // Verificação estrita dos totais
    expect(selo.totalPoligonosSorteados).toBe(67);
    expect(selo.totalTreino).toBe(34);
    expect(selo.totalHeldOut).toBe(33);
    expect(selo.areaTotalHectares).toBe(336.34);

    // Validação dos 8 invariantes sobre o universo real
    expect(() => validarInvariantesSeloD16(selo)).not.toThrow();
    expect(selo.invariantesVerificados).toHaveLength(8);
    expect(selo.versaoEsquema).toBe("1.4.0");
  });
});


