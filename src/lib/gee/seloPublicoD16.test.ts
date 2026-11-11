import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  DESENHO_NOMINAL_D16,
  obterDesenhoRealizadoD16,
  obterComparativoDesenhoD16,
} from "./seloPublicoD16";

describe("Leitor Único do Selo Público D16 (seloPublicoD16.ts)", () => {
  it("expõe exatamente os números realizados do selo público versionado", () => {
    const res = obterDesenhoRealizadoD16();

    expect(res.disponivel).toBe(true);
    if (!res.disponivel) return;

    expect(res.totalPoligonosSorteados).toBe(67);
    expect(res.totalTreino).toBe(34);
    expect(res.totalHeldOut).toBe(33);
    expect(res.areaTotalHectares).toBe(336.34);
    expect(res.totalEstratos).toBe(18);
    expect(res.estratos).toHaveLength(18);

    expect(res.estratosCenso).toEqual(["E_1_2_2", "E_2_2_2", "E_2_3_2", "E_3_2_2"]);
    expect(res.estratosVazios).toEqual(["E_1_3_2"]);

    expect(res.limiaresS.t1).toBe(5.12);
    expect(res.limiaresS.t2).toBe(8.46);
    expect(res.limiaresE.t1).toBe(0.0116);
    expect(res.limiaresE.t2).toBe(0.049);

    expect(res.semente).toBe(20261110);
    expect(res.hashIntegridade).toBe("15a5f1f38a3cf512");
    expect(res.sha256SeloCompleto).toBe(
      "ee1a8d82dbdbe4ae604817b65012771a983042a4ee764032e30bfe5154ab0f3c"
    );

    expect(res.motivoDeficit).toContain("E_1_2_2");
    expect(res.motivoDeficit).toContain("E_1_3_2");
    expect(res.motivoEstratoVazio).toContain("9 candidatos");
    expect(res.motivoEstratoVazio).toContain("0,0331");
  });

  it("devolve estado indisponível declarado sem inventar valores quando o selo é ausente ou corrompido", () => {
    const entradasInvalidas = [null, undefined, {}, { totalPoligonosSorteados: "invalido" }, []];

    for (const entrada of entradasInvalidas) {
      // Passa explicitamente a entrada inválida (inclusive undefined se desejado testar validação interna)
      const res = entrada === undefined
        ? obterDesenhoRealizadoD16(null)
        : obterDesenhoRealizadoD16(entrada);

      expect(res.disponivel).toBe(false);
      if (res.disponivel) return;

      expect(res.motivo).toMatch(/indisponível|ausente|corrompido/i);
      expect(res.totalPoligonosSorteados).toBeNull();
      expect(res.totalTreino).toBeNull();
      expect(res.totalHeldOut).toBeNull();
      expect(res.areaTotalHectares).toBeNull();
      expect(res.totalEstratos).toBeNull();
      expect(res.estratos).toBeNull();
      expect(res.estratosCenso).toBeNull();
      expect(res.estratosVazios).toBeNull();
      expect(res.limiaresS).toBeNull();
      expect(res.limiaresE).toBeNull();
    }
  });

  it("distingue explicitamente o desenho nominal (72, 361 ha) do realizado (67, 336,34 ha)", () => {
    const { nominal, realizado } = obterComparativoDesenhoD16();

    expect(nominal.totalPoligonos).toBe(72);
    expect(nominal.poligonosPorEstrato).toBe(4);
    expect(nominal.totalTreino).toBe(36);
    expect(nominal.totalHeldOut).toBe(36);
    expect(nominal.areaTotalHectares).toBe(361.44);
    expect(nominal.totalEstratos).toBe(18);

    expect(realizado.disponivel).toBe(true);
    if (!realizado.disponivel) return;

    expect(realizado.totalPoligonosSorteados).toBe(67);
    expect(realizado.totalTreino).toBe(34);
    expect(realizado.totalHeldOut).toBe(33);
    expect(realizado.areaTotalHectares).toBe(336.34);

    expect(nominal.totalPoligonos).not.toBe(realizado.totalPoligonosSorteados);
    expect(nominal.totalTreino).not.toBe(realizado.totalTreino);
    expect(nominal.totalHeldOut).not.toBe(realizado.totalHeldOut);
    expect(nominal.areaTotalHectares).not.toBe(realizado.areaTotalHectares);
  });

  it("pureza de importação: seloPublicoD16.ts não importa dependências node:*", () => {
    const caminhoFonte = path.resolve(process.cwd(), "src/lib/gee/seloPublicoD16.ts");
    const conteudo = fs.readFileSync(caminhoFonte, "utf-8");

    expect(conteudo).not.toMatch(/node:(crypto|child_process|fs|path|os|buffer)/);
    expect(conteudo).not.toMatch(/from\s+["'](fs|path|crypto|child_process)["']/);
  });
});
