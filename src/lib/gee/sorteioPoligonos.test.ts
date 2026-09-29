import { describe, it, expect } from "vitest";
import {
  CandidatoSorteioD16,
  ErroPreCondicaoSorteioD16,
  verificarPreCondicoesSorteioD16,
  sortearPoligonosDroneD16,
} from "./sorteioPoligonos";
import { TODOS_ESTRATOS_D12 } from "./estratificacao";

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
          candidatos.push({
            id: `CAND-${String(seq).padStart(4, "0")}`,
            latitude: -24.8 - seq * 0.001,
            longitude: -53.8 - seq * 0.001,
            declividadePct: sTercis[sIdx] + i * 0.05 + (eIdx * 2 + k) * 0.001,
            frequenciaSoloNu: eTercis[eIdx] + i * 0.005 + (sIdx * 2 + k) * 0.0001,
            nivelK: k,
            classeWorldCover2020: i % 2 === 0 ? 40 : 30,
            classeWorldCover2021: 40,
            kAmbiguoAssociacao: k === 2 && i === 0,
          });
          seq++;
        }
      }
    }
  }
  return candidatos;
}

describe("Motor de Sorteio dos 36 Polígonos de Drone — FASE A1 (D16 / D23)", () => {
  it("deve aprovar as 7 pré-condições para um pool íntegro com >= 2 candidatos nos 18 estratos", () => {
    const pool = gerarPoolCandidatosElegiveis(4);
    const rel = verificarPreCondicoesSorteioD16(pool, { seloExistenteCaminho: null });
    expect(rel.aprovado).toBe(true);
    expect(rel.condicaoFalha).toBeNull();
    expect(rel.estratosDeficientes).toHaveLength(0);
    for (const idEstrato of TODOS_ESTRATOS_D12) {
      expect(rel.contagemCandidatosPorEstrato[idEstrato]).toBeGreaterThanOrEqual(2);
    }
  });

  it("deve recusar e nomear 'nenhum_selo_anterior' se um selo já existir (Idempotência D23)", () => {
    const pool = gerarPoolCandidatosElegiveis(3);
    expect(() =>
      sortearPoligonosDroneD16(pool, {
        semente: 20260928,
        gitCommit: "abc1234",
        sha256ConjuntoCandidatos: "deadbeef",
        seloExistenteCaminho: "docs/verificacoes/sorteio/sorteio_d16_2026-09-28.json",
      })
    ).toThrowError(ErroPreCondicaoSorteioD16);

    try {
      sortearPoligonosDroneD16(pool, {
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
    const pool = gerarPoolCandidatosElegiveis(3);
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
    const pool = gerarPoolCandidatosElegiveis(3);
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

    const selo = sortearPoligonosDroneD16(pool, {
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

  it("deve recusar e nomear 'minimo_2_candidatos_por_estrato' listando os estratos deficientes", () => {
    const pool = gerarPoolCandidatosElegiveis(1);
    try {
      verificarPreCondicoesSorteioD16(pool, { lancarErro: true });
      expect.fail("Deveria ter recusado estratos com 1 candidato");
    } catch (e) {
      expect(e).toBeInstanceOf(ErroPreCondicaoSorteioD16);
      expect((e as ErroPreCondicaoSorteioD16).condicaoFalha).toBe(
        "minimo_2_candidatos_por_estrato"
      );
      expect((e as Error).message).toContain("E_1_1_1");
    }
  });

  it("deve recusar e nomear 'guarda_anticircularidade_d16' se candidato contiver scoreSuscetibilidade, scoreJev ou severidade", () => {
    const pool = gerarPoolCandidatosElegiveis(3);
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

  it("deve sortear exatamente 36 polígonos (18 treino + 18 held-out, 1 par por estrato) com pi_i = 2 / N_h e ser invariante à ordem de entrada", () => {
    const pool = gerarPoolCandidatosElegiveis(5); // N_h = 5 em cada um dos 18 estratos -> pi_i = 2/5 = 0.4
    const invertido = [...pool].reverse();

    const selo1 = sortearPoligonosDroneD16(pool, {
      semente: 987654321,
      gitCommit: "commit-teste",
      sha256ConjuntoCandidatos: "sha256-teste",
      geradoEm: "2026-09-28T14:30:00.000Z",
    });

    const selo2 = sortearPoligonosDroneD16(invertido, {
      semente: 987654321,
      gitCommit: "commit-teste",
      sha256ConjuntoCandidatos: "sha256-teste",
      geradoEm: "2026-09-28T14:30:00.000Z",
    });

    expect(selo1.poligonos).toHaveLength(36);
    expect(selo1.totalTreino).toBe(18);
    expect(selo1.totalHeldOut).toBe(18);
    expect(selo1.areaTotalHectares).toBe(360);

    // Verifica que o sorteio e a designação treino/held-out independem da ordem de entrada
    expect(selo1.poligonos.map((p) => `${p.idCandidatoOrigem}:${p.papelConjunto}`)).toEqual(
      selo2.poligonos.map((p) => `${p.idCandidatoOrigem}:${p.papelConjunto}`)
    );

    // Verifica que cada estrato possui exatamente 1 treino e 1 held-out e pi_i = 2 / N_h
    for (const idEstrato of TODOS_ESTRATOS_D12) {
      const doEstrato = selo1.poligonos.filter((p) => p.estratoId === idEstrato);
      expect(doEstrato).toHaveLength(2);
      const papeis = doEstrato.map((p) => p.papelConjunto).sort();
      expect(papeis).toEqual(["held-out", "treino"]);
      const nh = selo1.contagemCandidatosPorEstrato[idEstrato];
      expect(nh).toBeGreaterThanOrEqual(2);
      expect(doEstrato[0].nCandidatosEstrato).toBe(nh);
      expect(doEstrato[0].pi_i).toBeCloseTo(2 / nh, 8);
      expect(doEstrato[1].pi_i).toBeCloseTo(2 / nh, 8);
    }
  });

  it("T3.1: deve garantir determinismo bit-a-bit sob a mesma semente (incluindo hashIntegridade) e sensibilidade à semente preservando a partição 18+18=36", () => {
    const pool = gerarPoolCandidatosElegiveis(6);

    const execucaoA = sortearPoligonosDroneD16(pool, {
      semente: 20260928,
      gitCommit: "commit-a",
      sha256ConjuntoCandidatos: "sha256-pool",
      geradoEm: "2026-09-28T15:00:00.000Z",
    });

    const execucaoB = sortearPoligonosDroneD16(pool, {
      semente: 20260928,
      gitCommit: "commit-a",
      sha256ConjuntoCandidatos: "sha256-pool",
      geradoEm: "2026-09-28T15:00:00.000Z",
    });

    const execucaoSementeDiferente = sortearPoligonosDroneD16(pool, {
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
    expect(execucaoSementeDiferente.poligonos).toHaveLength(36);
    expect(execucaoSementeDiferente.totalTreino).toBe(18);
    expect(execucaoSementeDiferente.totalHeldOut).toBe(18);
    for (const idEstrato of TODOS_ESTRATOS_D12) {
      const par = execucaoSementeDiferente.poligonos.filter((p) => p.estratoId === idEstrato);
      expect(par).toHaveLength(2);
      expect(par.map((p) => p.papelConjunto).sort()).toEqual(["held-out", "treino"]);
    }
  });

  it("T3.2: deve satisfazer a identidade de Horvitz-Thompson pi_i * w_i = 1 sobre estratos com tamanhos N_h distintos", () => {
    // Gera candidatos com quantidades distintas por estrato (ex.: entre 2 e 11 candidatos por estrato, incluindo primos 3, 5, 7, 11)
    const sTercis = [3.5, 9.5, 18.0];
    const eTercis = [0.08, 0.38, 0.78];
    const kNiveis: Array<1 | 2> = [1, 2];
    const tamanhosDesejados = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 3, 5, 7, 9, 11, 4, 6, 8];

    const candidatosHeterogeneos: CandidatoSorteioD16[] = [];
    let seq = 1;
    let estratoCounter = 0;
    for (let sIdx = 0; sIdx < sTercis.length; sIdx++) {
      for (let eIdx = 0; eIdx < eTercis.length; eIdx++) {
        for (const k of kNiveis) {
          const nNesteEstrato = tamanhosDesejados[estratoCounter];
          estratoCounter++;
          for (let i = 0; i < nNesteEstrato; i++) {
            candidatosHeterogeneos.push({
              id: `HET-${String(seq).padStart(4, "0")}`,
              latitude: -24.7 - seq * 0.001,
              longitude: -53.9 - seq * 0.001,
              declividadePct: sTercis[sIdx] + i * 0.03 + (eIdx * 2 + k) * 0.001,
              frequenciaSoloNu: eTercis[eIdx] + i * 0.003 + (sIdx * 2 + k) * 0.0001,
              nivelK: k,
              classeWorldCover2020: 40,
              classeWorldCover2021: 30,
              kAmbiguoAssociacao: false,
            });
            seq++;
          }
        }
      }
    }

    const selo = sortearPoligonosDroneD16(candidatosHeterogeneos, {
      semente: 20260928,
      gitCommit: "commit-ht",
      sha256ConjuntoCandidatos: "sha256-ht",
      geradoEm: "2026-09-28T15:05:00.000Z",
    });

    const tamanhosObservados = Object.values(selo.contagemCandidatosPorEstrato);
    expect(new Set(tamanhosObservados).size).toBeGreaterThan(4);

    for (const p of selo.poligonos) {
      const nh = p.nCandidatosEstrato;
      expect(nh).toBeGreaterThanOrEqual(2);
      expect(p.pi_i).toBeCloseTo(2 / nh, 8);
      expect(p.w_i).toBeCloseTo(nh / 2, 8);
      expect(p.pi_i * p.w_i).toBeCloseTo(1.0, 7);
    }
  });
});

