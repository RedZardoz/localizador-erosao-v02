import { describe, it, expect } from "vitest";
import { converterParaDMS, sincronizarCoordenada, pontosParaGeoJSON } from "./geoConversao";
import { ErroPontoSinteticoDetectado } from "@/lib/seguranca/guardaSintetico";

describe("Conversão Geográfica e Sincronização Decimal/DMS (src/lib/export/geoConversao)", () => {
  it("trata o rollover de 60.0'' corretamente", () => {
    // Caso de teste específico citado na auditoria: -25.99999 produzia 25° 59' 60.0" S (inválido)
    const dms = converterParaDMS(-25.999999, "lat");
    expect(dms).not.toContain("60.0\"");
    expect(dms).toBe("26° 0' 0.0\" S");
  });

  it("garante que decimal e DMS derivem do mesmo número arredondado a 6 casas decimais", () => {
    const coord = -51.127569123;
    const sincronizado = sincronizarCoordenada(coord, "lng");
    expect(sincronizado.decimal).toBe(-51.127569);
    expect(sincronizado.dms).toContain("W");
    expect(sincronizado.dms).not.toContain("60.0\"");
  });

  it("bloqueia exportação GeoJSON caso haja pontos sintéticos no conjunto", () => {
    const pontoSintetico: any = {
      id: "SYNTHETIC-001",
      codigo: "SINT-001",
      origemSintetica: true,
      latitude: -25.0,
      longitude: -53.0,
    };

    expect(() => pontosParaGeoJSON([pontoSintetico])).toThrow(ErroPontoSinteticoDetectado);
  });
});
