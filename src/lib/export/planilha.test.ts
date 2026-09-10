import { describe, it, expect } from "vitest";
import { gerarPlanilhaXLSX } from "./planilha";
import { gerarCsvCientifico } from "./csv";
import type { PontoAmostral } from "@/types/ponto";
import { ErroPontoSinteticoDetectado } from "@/lib/seguranca/guardaSintetico";

function mockPonto(id: number, parciais?: Partial<PontoAmostral>): PontoAmostral {
  return {
    id: `ponto-${id}`,
    codigo: `PR-2026-${String(id).padStart(4, "0")}`,
    latitude: -25.0 - id * 0.01,
    longitude: -53.0 - id * 0.01,
    origemSintetica: false,
    blocoEspacial: `BLOCO_${id % 3}`,
    estratoId: `E${(id % 18) + 1}`,
    criterioSelecao: {
      tercilS: 1,
      tercilE: 1,
      nivelK: 1,
      phiDiag: 0.5,
      semente: 2026,
    },
    localizacao: {
      municipio: { estado: "medido", valor: "Cascavel", fonte: "IBGE", adquiridoEm: "2026", consultadoEm: "2026-09-10" },
      codigoIbge: { estado: "medido", valor: "4104808", fonte: "IBGE", adquiridoEm: "2026", consultadoEm: "2026-09-10" },
      bacia: { estado: "medido", valor: "Paraná 3", fonte: "IAT", adquiridoEm: "2026", consultadoEm: "2026-09-10" },
    },
    terreno: {
      elevacao: { estado: "medido", valor: 500 + id * 5, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      declividadePct: { estado: "medido", valor: 5.0 + id * 0.5, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      declividadeGraus: { estado: "modelado", valor: 3.0 + id * 0.2, modelo: "atan(pct/100)", insumos: ["declividadePct"] },
      curvaturaPerfil: { estado: "medido", valor: -0.001 * id, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      curvaturaPlana: { estado: "medido", valor: 0.001 * id, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      acumuloFluxo: { estado: "medido", valor: 1000 + id * 50, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      twi: { estado: "modelado", valor: 6.0 + id * 0.1, modelo: "ln(As/tan(beta))", insumos: ["acumuloFluxo", "declividadeGraus"] },
    },
    solo: {
      ordem: { estado: "medido", valor: "LATOSSOLO", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      subOrdem: { estado: "medido", valor: "VERMELHO", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      grandeGrupo: { estado: "medido", valor: "Distrofico", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      tipoUnidade: { estado: "medido", valor: "simples", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      confiancaPedologica: "alta",
      erodibilidadeClasse: { estado: "medido", valor: "Media", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
    },
    temporal: {},
    rastreio: {
      versaoMotor: "SAREL-1.0",
      cenas: ["SCENE-TEST"],
      calculadoEm: "2026-09-10",
    },
    ...parciais,
  };
}

describe("Exportação XLSX e CSV — Validações e Guardas", () => {
  it("gerarPlanilhaXLSX produz Buffer válido de 3 abas para dados reais", async () => {
    const pontos = Array.from({ length: 5 }, (_, i) => mockPonto(i + 1));
    const buffer = await gerarPlanilhaXLSX(pontos);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("gerarPlanilhaXLSX recusa exportação se houver pontos sintéticos", async () => {
    const pontos = [mockPonto(1), mockPonto(2, { origemSintetica: true })];
    await expect(gerarPlanilhaXLSX(pontos)).rejects.toThrow(ErroPontoSinteticoDetectado);
  });

  it("gerarCsvCientifico inclui BOM UTF-8 e bloco de fundamentação LGPD", () => {
    const pontos = Array.from({ length: 3 }, (_, i) => mockPonto(i + 1));
    const csv = gerarCsvCientifico(pontos);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("TRATAMENTO DE DADOS PESSOAIS FUNDIÁRIOS — CONFORMIDADE LGPD");
    expect(csv).toContain("Codigo,Latitude,Longitude");
    expect(csv).toContain("PR-2026-0001");
  });

  it("gerarCsvCientifico recusa exportação se houver pontos sintéticos", () => {
    const pontos = [mockPonto(1, { id: "TEST-01" })];
    expect(() => gerarCsvCientifico(pontos)).toThrow(ErroPontoSinteticoDetectado);
  });
});
