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
});
