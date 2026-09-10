import { describe, it, expect } from "vitest";
import { ehPontoSintetico, contemPontoSintetico, assegurarApenasPontosReais, ErroPontoSinteticoDetectado } from "./guardaSintetico";
import { PontoAmostral } from "@/types/ponto";

function criarPontoBase(parciais?: Partial<PontoAmostral>): PontoAmostral {
  return {
    id: "a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6",
    codigo: "PR-2026-0001",
    latitude: -25.0669,
    longitude: -53.6880,
    blocoEspacial: "BLOCO_01",
    estratoId: "E1",
    criterioSelecao: { phiDiag: 0.45 },
    terreno: {
      elevacao: { estado: "medido", valor: 520, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      declividadePct: { estado: "medido", valor: 12.4, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      declividadeGraus: { estado: "modelado", valor: 7.07, modelo: "atan(pct/100)", insumos: ["declividadePct"] },
      curvaturaPerfil: { estado: "medido", valor: -0.003, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      curvaturaPlana: { estado: "medido", valor: 0.002, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      acumuloFluxo: { estado: "medido", valor: 1540, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      twi: { estado: "modelado", valor: 7.81, modelo: "ln(As/tan(beta))", insumos: ["acumuloFluxo", "declividadeGraus"] },
    },
    solo: {
      ordem: { estado: "medido", valor: "NEOSSOLO", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
      subOrdem: { estado: "medido", valor: "REGOLITICO", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
      grandeGrupo: { estado: "medido", valor: "Eutrofico", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
      tipoUnidade: { estado: "medido", valor: "associacao", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
      confiancaPedologica: "media",
      erodibilidadeClasse: { estado: "medido", valor: "Alta", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
    },
    serie: {
      janela: { inicio: "2019-01-01", fim: "2025-12-31" },
      nObservacoesValidas: 412,
      harmonicos: {},
      frequenciaSoloNu: { estado: "medido", valor: 0.22, fonte: "Sentinel-2", adquiridoEm: "2026-09-08" },
      compostoSoloNu: {},
    },
    chuva: {
      precipAcum30d: { estado: "medido", valor: 120.5, fonte: "CHIRPS", adquiridoEm: "2026-09-08" },
      precipAcum90d: { estado: "medido", valor: 412.0, fonte: "CHIRPS", adquiridoEm: "2026-09-08" },
      i30Max: { estado: "medido", valor: 38.2, fonte: "GPM IMERG", adquiridoEm: "2026-09-08" },
      nEventosErosivos: { estado: "medido", valor: 5, fonte: "GPM IMERG", adquiridoEm: "2026-09-08" },
      indiceMecanismo: { estado: "modelado", valor: 14.5, modelo: "Sigma(erosividade * soloNu)", insumos: ["i30Max", "frequenciaSoloNu"] },
    },
    ...parciais,
  };
}

describe("Guarda Antissintético (src/lib/seguranca/guardaSintetico)", () => {
  it("aprova pontos reais sem marcação de teste", () => {
    const pReal = criarPontoBase();
    expect(ehPontoSintetico(pReal)).toBe(false);
    expect(contemPontoSintetico([pReal])).toBe(false);
    expect(() => assegurarApenasPontosReais([pReal])).not.toThrow();
  });

  it("detecta ponto com flag origemSintetica: true", () => {
    const pSint = criarPontoBase({ origemSintetica: true });
    expect(ehPontoSintetico(pSint)).toBe(true);
    expect(contemPontoSintetico([pSint])).toBe(true);
    expect(() => assegurarApenasPontosReais([pSint])).toThrow(ErroPontoSinteticoDetectado);
  });

  it("detecta ponto com prefixos reservados de teste no ID ou código", () => {
    const pId = criarPontoBase({ id: "TEST-0001" });
    const pCod = criarPontoBase({ codigo: "SINT-0001" });
    expect(ehPontoSintetico(pId)).toBe(true);
    expect(ehPontoSintetico(pCod)).toBe(true);
    expect(() => assegurarApenasPontosReais([pId, pCod])).toThrow(ErroPontoSinteticoDetectado);
  });
});
