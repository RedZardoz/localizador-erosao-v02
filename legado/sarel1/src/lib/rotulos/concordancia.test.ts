import { describe, expect, it } from "vitest";
import {
  calcularKappaCohen,
  classificarLandisKoch,
  ParRotulo,
  resolverDivergencia,
  validarRotulo,
} from "./concordancia";
import { Rotulo } from "@/types/rotulo";

describe("Concordância entre Intérpretes e Kappa de Cohen (§11.3)", () => {
  it("classifica corretamente os patamares canônicos de Landis & Koch (1977)", () => {
    expect(classificarLandisKoch(-0.15)).toBe("pobre");
    expect(classificarLandisKoch(0.12)).toBe("leve");
    expect(classificarLandisKoch(0.35)).toBe("razoavel");
    expect(classificarLandisKoch(0.55)).toBe("moderada");
    expect(classificarLandisKoch(0.72)).toBe("substancial");
    expect(classificarLandisKoch(0.91)).toBe("quase-perfeita");
  });

  it("calcula o índice Kappa de Cohen com precisão matemática contra caso conhecido", () => {
    // Caso de teste com 100 pares:
    // A/A: 50, A/B: 10, B/A: 20, B/B: 20
    // Po = 0.70
    // Marginais: p1_A = 0.60, p1_B = 0.40; p2_A = 0.70, p2_B = 0.30
    // Pe = (0.60 * 0.70) + (0.40 * 0.30) = 0.54
    // Kappa = (0.70 - 0.54) / (1 - 0.54) = 0.16 / 0.46 = 0.3478
    const pares: ParRotulo[] = [];
    for (let i = 0; i < 50; i++) pares.push({ observador1: "ausente", observador2: "ausente" });
    for (let i = 0; i < 10; i++) pares.push({ observador1: "ausente", observador2: "moderada" });
    for (let i = 0; i < 20; i++) pares.push({ observador1: "moderada", observador2: "ausente" });
    for (let i = 0; i < 20; i++) pares.push({ observador1: "moderada", observador2: "moderada" });

    const res = calcularKappaCohen(pares, ["ausente", "moderada"]);

    expect(res.nObservacoes).toBe(100);
    expect(res.po).toBe(0.70);
    expect(res.pe).toBe(0.54);
    expect(res.kappa).toBeCloseTo(0.3478, 3);
    expect(res.grau).toBe("razoavel");
    expect(res.operacional).toBe(false);
  });

  it("emite ALERTA BLOQUEANTE quando Kappa < 0.60 (critério não operacional)", () => {
    const paresFracos: ParRotulo[] = [
      { observador1: "ausente", observador2: "moderada" },
      { observador1: "moderada", observador2: "severa" },
      { observador1: "incipiente", observador2: "ausente" },
      { observador1: "severa", observador2: "incipiente" },
    ];

    const res = calcularKappaCohen(paresFracos);

    expect(res.operacional).toBe(false);
    expect(res.alertaBloqueante).toBeDefined();
    expect(res.alertaBloqueante).toContain("ALERTA BLOQUEANTE");
    expect(res.alertaBloqueante).toContain("inferior a 0.60");
    expect(res.alertaBloqueante).toContain("Landis & Koch, 1977");
  });

  it("aprova critério operacional quando Kappa >= 0.60 sem alerta bloqueante", () => {
    // Concordância quase unânime
    const paresFortes: ParRotulo[] = [];
    for (let i = 0; i < 40; i++) paresFortes.push({ observador1: "ausente", observador2: "ausente" });
    for (let i = 0; i < 30; i++) paresFortes.push({ observador1: "moderada", observador2: "moderada" });
    for (let i = 0; i < 25; i++) paresFortes.push({ observador1: "severa", observador2: "severa" });
    paresFortes.push({ observador1: "ausente", observador2: "incipiente" });
    paresFortes.push({ observador1: "moderada", observador2: "severa" });

    const res = calcularKappaCohen(paresFortes);

    expect(res.kappa).toBeGreaterThanOrEqual(0.60);
    expect(res.operacional).toBe(true);
    expect(res.alertaBloqueante).toBeUndefined();
    expect(["substancial", "quase-perfeita"]).toContain(res.grau);
  });

  it("valida rigorosamente a estrutura de um objeto Rotulo", () => {
    const rotuloValido: Rotulo = {
      classe: "moderada",
      modalidade: "interpretacao-visual",
      observador: "Prof. Dr. Avaliador",
      observadoEm: "2026-05-12",
      cego: true,
    };
    expect(validarRotulo(rotuloValido).valido).toBe(true);

    const semObservador = { ...rotuloValido, observador: "" };
    expect(validarRotulo(semObservador).valido).toBe(false);

    const semData = { ...rotuloValido, observadoEm: "data-invalida" };
    expect(validarRotulo(semData).valido).toBe(false);

    const modalidadeInvalida = { ...rotuloValido, modalidade: "ia-estimada" as any };
    expect(validarRotulo(modalidadeInvalida).valido).toBe(false);
  });

  it("resolve divergências com protocolo de consenso e terceiro árbitro", () => {
    const obsA: Rotulo = {
      classe: "ausente",
      modalidade: "interpretacao-visual",
      observador: "Intérprete A",
      observadoEm: "2026-05-10",
      cego: true,
    };

    const obsB: Rotulo = {
      classe: "ausente",
      modalidade: "interpretacao-visual",
      observador: "Intérprete B",
      observadoEm: "2026-05-10",
      cego: true,
    };

    // Caso 1: Concordância direta
    const consDireto = resolverDivergencia(obsA, obsB);
    expect(consDireto.divergencia).toBe("nenhuma");
    expect(consDireto.final.classe).toBe("ausente");

    // Caso 2: Divergência com terceiro concordando com obsA
    const obsBDivergente: Rotulo = { ...obsB, classe: "moderada" };
    const obsCTerceiro: Rotulo = {
      classe: "ausente",
      modalidade: "interpretacao-visual",
      observador: "Árbitro C",
      observadoEm: "2026-05-11",
      cego: true,
    };

    const consDesempate = resolverDivergencia(obsA, obsBDivergente, obsCTerceiro);
    expect(consDesempate.divergencia).toBe("resolvida-por-terceiro");
    expect(consDesempate.final.classe).toBe("ausente");
    expect(consDesempate.final.observacoes).toContain("Árbitro C");

    // Caso 3: Divergência sem terceiro -> pendente
    const consPendente = resolverDivergencia(obsA, obsBDivergente);
    expect(consPendente.divergencia).toBe("pendente");
  });
});
