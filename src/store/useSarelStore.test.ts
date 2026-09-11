import { describe, it, expect } from "vitest";
import { useSarelStore } from "@/store/useSarelStore";
import { PontoAmostral } from "@/types/ponto";

describe("Interface e Estado Global SAREL (Fase 7 — SAREL)", () => {
  const criarPontoValido = (id: string, codigo: string): PontoAmostral => ({
    id,
    codigo,
    latitude: -25.0,
    longitude: -53.0,
    origemSintetica: false,
    blocoEspacial: "BLOCO_R01_C01",
    estratoId: "ESTRATO_S1_E1_K1",
    criterioSelecao: { tercilS: 1, tercilE: 1, nivelK: 1, phiDiag: null, semente: 42 },
    localizacao: {
      municipio: { estado: "medido", valor: "Toledo", fonte: "IBGE", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      codigoIbge: { estado: "medido", valor: "4127700", fonte: "IBGE", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      bacia: { estado: "medido", valor: "Paraná 3", fonte: "IAT", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
    },
    terreno: {
      elevacao: { estado: "medido", valor: 500, fonte: "DEM", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      declividadePct: { estado: "medido", valor: 6.5, fonte: "DEM", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      declividadeGraus: { estado: "medido", valor: 3.7, fonte: "DEM", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      curvaturaPerfil: { estado: "medido", valor: 0.0, fonte: "DEM", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      curvaturaPlana: { estado: "medido", valor: 0.0, fonte: "DEM", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      acumuloFluxo: { estado: "medido", valor: 100, fonte: "DEM", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      twi: { estado: "medido", valor: 5.5, fonte: "Calculado", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
    },
    solo: {
      ordem: { estado: "medido", valor: "LATOSSOLO", fonte: "Embrapa", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      subOrdem: { estado: "medido", valor: "VERMELHO", fonte: "Embrapa", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      grandeGrupo: { estado: "medido", valor: "Eutrófico", fonte: "Embrapa", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      tipoUnidade: { estado: "medido", valor: "simples", fonte: "Embrapa", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      confiancaPedologica: "alta",
      erodibilidadeClasse: { estado: "medido", valor: "Média", fonte: "Embrapa", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
    },
    temporal: {},
    rastreio: { versaoMotor: "test", cenas: [], calculadoEm: "2026-09-10" },
  });

  it("permite navegação entre as abas do sistema", () => {
    const store = useSarelStore.getState();
    expect(store.abaAtiva).toBe("mapa");

    store.setAbaAtiva("inspetor");
    expect(useSarelStore.getState().abaAtiva).toBe("inspetor");

    store.setAbaAtiva("matriz");
    expect(useSarelStore.getState().abaAtiva).toBe("matriz");
  });

  it("reidrata pontos amostrais reais e bloqueia pontos sintéticos (Regra 5)", () => {
    const store = useSarelStore.getState();
    const p1 = criarPontoValido("p1", "PR-01");
    store.carregarPontos([p1]);

    expect(useSarelStore.getState().pontos).toHaveLength(1);
    expect(useSarelStore.getState().obterPontoSelecionado()?.codigo).toBe("PR-01");

    // Ponto com flag sintético deve ser recusado
    const pSintetico = { ...p1, id: "p2", origemSintetica: true };
    expect(() => store.carregarPontos([pSintetico])).toThrow(/ponto\(s\) sintético\(s\)/);
  });
});
