import { describe, it, expect } from "vitest";
import { formatToDMS } from "./dms";

describe("formatToDMS — Conversão Geodésica e Rollover", () => {
  it("converte coordenadas normais corretamente", () => {
    expect(formatToDMS(-25.5, true)).toBe("25° 30' 0.0\" S");
    expect(formatToDMS(-53.25, false)).toBe("53° 15' 0.0\" W");
  });

  it("trata o rollover de 60.0 segundos sem gerar 60.0\"", () => {
    // -25.999999 graus: 0.999999 * 60 = 59.99994 min -> 0.99994 * 60 = 59.9964" -> toFixed(1) = 60.0"
    const dms = formatToDMS(-25.999999, true);
    expect(dms).not.toContain("60.0\"");
    expect(dms).toBe("26° 0' 0.0\" S");
  });

  it("deriva decimal e DMS do mesmo número arredondado", () => {
    // Exemplo clássico da auditoria: -51.127569
    const dms = formatToDMS(-51.127569, false);
    expect(dms).toBe("51° 7' 39.2\" W");
  });
});
