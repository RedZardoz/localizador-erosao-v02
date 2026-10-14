import { describe, it, expect } from "vitest";
import { gerarPlanilhaXLSX } from "./planilha";
import { gerarCsvCientifico } from "./csv";
import type { PontoAmostral } from "@/types/ponto";
import { ErroPontoSinteticoDetectado } from "@/lib/seguranca/guardaSintetico";
import { montarMatrizTreino } from "@/lib/matriz/montagem";
import type { PerfilExportacao } from "@/lib/matriz/perfis";

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

  it("todos os 5 perfis de exportação (planilha, interpretacao-cega, campo-cego, voo-cego, matriz-treino) passam no Invariante 2 em CSV e XLSX", async () => {
    const pontos = Array.from({ length: 4 }, (_, i) => mockPonto(i + 1));
    const mapaRotulos = Object.fromEntries(
      pontos.map((p, idx) => [
        p.codigo,
        {
          final: {
            classe: idx % 2 === 0 ? "erosao" : "controle",
            modalidade: "campo" as const,
            observador: "Perito_PPGTCA",
            observadoEm: "2026-09-26",
            cego: true,
          },
          origens: [],
          kappa: 0.9,
          divergencia: "nenhuma" as const,
          papelConjunto: "treino" as const,
        },
      ])
    );
    const perfis: PerfilExportacao[] = [
      "planilha",
      "interpretacao-cega",
      "campo-cego",
      "voo-cego",
      "matriz-treino",
    ];
    for (const perfil of perfis) {
      const csv = gerarCsvCientifico(pontos, perfil, mapaRotulos);
      expect(csv.startsWith("\uFEFF")).toBe(true);
      const xlsx = await gerarPlanilhaXLSX(pontos, { perfil, rotulosConsolidados: mapaRotulos });
      expect(xlsx).toBeInstanceOf(Buffer);
    }
  });

  it("T5 (D5 / Q1): perfil 'matriz-treino' recusa mapa de rótulos ausente ou vazio (Postura 9), exclui pontos sem rótulo e segrega modalidade 'drone'", () => {
    const p1 = mockPonto(1);
    const p2 = mockPonto(2);
    const p3 = mockPonto(3);

    // 1. Omissão ou mapa vazio lança erro explícito
    expect(() => gerarCsvCientifico([p1], "matriz-treino")).toThrow(/exige o mapa autoritativo 'rotulosConsolidados'/);
    expect(() => gerarCsvCientifico([p1], "matriz-treino", {})).toThrow(/exige o mapa autoritativo 'rotulosConsolidados'/);

    // 2. p1 rotulado em campo ("severa"), p2 sem rótulo, p3 rotulado por "drone" (held-out)
    const mapa = {
      [p1.codigo]: {
        final: {
          classe: "severa",
          modalidade: "campo" as const,
          observador: "Perito_1",
          observadoEm: "2026-09-26",
          cego: true,
        },
        origens: [],
        kappa: 0.92,
        divergencia: "nenhuma" as const,
        papelConjunto: "treino" as const,
      },
      [p3.codigo]: {
        final: {
          classe: "erosao",
          modalidade: "drone" as const,
          observador: "VANT_Spectral2",
          observadoEm: "2026-09-26",
          cego: true,
        },
        origens: [],
        kappa: null,
        divergencia: "nenhuma" as const,
        papelConjunto: "held-out" as const,
      },
    };

    const csv = gerarCsvCientifico([p1, p2, p3], "matriz-treino", mapa);
    const linhasDados = csv
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0 && !l.startsWith("#") && !l.startsWith("Ponto_ID,"));

    // Apenas p1 é emitido (p2 sem rótulo excluído, p3 drone segregado em heldOutDrone)
    expect(linhasDados).toHaveLength(1);
    expect(linhasDados[0]).toContain("ponto-1");
    expect(linhasDados[0]).not.toContain("ponto-2");
    expect(linhasDados[0]).not.toContain("ponto-3");
    expect(linhasDados[0].endsWith(",1,severa,campo")).toBe(true);
  });

  it("montarMatrizTreino respeita estritamente a Regra 4: classeAmostral espectral não sobrescreve rótulo humano 'controle'", () => {
    const p = mockPonto(1, { classeAmostral: "erosao" });
    const res = montarMatrizTreino(
      [p],
      {
        [p.codigo]: {
          final: {
            classe: "controle",
            modalidade: "campo",
            observador: "Perito_1",
            observadoEm: "2026-09-26",
            cego: true,
          },
          origens: [],
          kappa: null,
          divergencia: "nenhuma",
          papelConjunto: "treino",
        },
      },
      { modeloJanela: "D" }
    );
    expect(res.linhas).toHaveLength(1);
    expect(res.linhas[0].classeAlvoBinaria).toBe(0);
    expect(res.linhas[0].rotuloClasse).toBe("controle");
  });
});
