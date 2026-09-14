import { describe, it, expect } from "vitest";
import { ehPontoSintetico, contemPontoSintetico, assegurarApenasPontosReais, ErroPontoSinteticoDetectado } from "./guardaSintetico";
import type { PontoAmostral } from "@/types/ponto";

function criarPontoBase(parciais?: Partial<PontoAmostral>): PontoAmostral {
  return {
    id: "a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6",
    codigo: "PR-2026-0001",
    latitude: -25.0669,
    longitude: -53.6880,
    origemSintetica: false,
    blocoEspacial: "BLOCO_01",
    estratoId: "E1",
    criterioSelecao: {
      tercilS: 2,
      tercilE: 3,
      nivelK: 2,
      phiDiag: 0.45,
      semente: 42,
    },
    localizacao: {
      municipio: { estado: "medido", valor: "Cascavel", fonte: "IBGE", adquiridoEm: "2026", consultadoEm: "2026-09-10" },
      codigoIbge: { estado: "medido", valor: "4104808", fonte: "IBGE", adquiridoEm: "2026", consultadoEm: "2026-09-10" },
      bacia: { estado: "medido", valor: "Paraná 3", fonte: "IAT", adquiridoEm: "2026", consultadoEm: "2026-09-10" },
    },
    terreno: {
      elevacao: { estado: "medido", valor: 520, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      declividadePct: { estado: "medido", valor: 12.4, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      declividadeGraus: { estado: "modelado", valor: 7.07, modelo: "atan(pct/100)", insumos: ["declividadePct"] },
      curvaturaPerfil: { estado: "medido", valor: -0.003, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      curvaturaPlana: { estado: "medido", valor: 0.002, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      acumuloFluxo: { estado: "medido", valor: 1540, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      twi: { estado: "modelado", valor: 7.81, modelo: "ln(As/tan(beta))", insumos: ["acumuloFluxo", "declividadeGraus"] },
    },
    solo: {
      ordem: { estado: "medido", valor: "NEOSSOLO", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      subOrdem: { estado: "medido", valor: "REGOLITICO", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      grandeGrupo: { estado: "medido", valor: "Eutrofico", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      tipoUnidade: { estado: "medido", valor: "associacao", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      confiancaPedologica: "media",
      erodibilidadeClasse: { estado: "medido", valor: "Alta", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
    },
    temporal: {},
    rastreio: {
      versaoMotor: "SAREL-1.0",
      cenas: ["S2A_MSIL2A_20240908T134211_N0511_R124_T22JCS_20240908T170425"],
      calculadoEm: "2026-09-10T15:00:00Z",
    },
    ...parciais,
  };
}

describe("Guarda Antissintético (src/lib/seguranca/guardaSintetico)", () => {
  it("aprova pontos reais com origemSintetica: false", () => {
    const pReal = criarPontoBase({ origemSintetica: false });
    expect(ehPontoSintetico(pReal)).toBe(false);
    expect(contemPontoSintetico([pReal])).toBe(false);
    expect(() => assegurarApenasPontosReais([pReal])).not.toThrow();
  });

  it("detecta e bloqueia ponto com flag origemSintetica: true", () => {
    const pSint = criarPontoBase({ origemSintetica: true });
    expect(ehPontoSintetico(pSint)).toBe(true);
    expect(contemPontoSintetico([pSint])).toBe(true);
    expect(() => assegurarApenasPontosReais([pSint])).toThrow(ErroPontoSinteticoDetectado);
  });

  it("detecta e bloqueia ponto com prefixos reservados de teste no ID ou código", () => {
    const pId = criarPontoBase({ id: "TEST-0001", origemSintetica: false });
    const pCod = criarPontoBase({ codigo: "SINT-0001", origemSintetica: false });
    expect(ehPontoSintetico(pId)).toBe(true);
    expect(ehPontoSintetico(pCod)).toBe(true);
    expect(() => assegurarApenasPontosReais([pId, pCod])).toThrow(ErroPontoSinteticoDetectado);
  });
});
