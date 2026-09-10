import { describe, it, expect } from "vitest";
import {
  validarInvariantes,
  assegurarInvariantes,
  derivarCamposNaoMedidos,
} from "./invariantes";
import { PontoAmostral } from "@/types/ponto";

function gerarPontoValido(index: number, declividade: number = 5 + (index % 15)): PontoAmostral {
  return {
    id: `ponto-uuid-${index}`,
    codigo: `PR-2026-${String(index).padStart(4, "0")}`,
    latitude: -25.0 - (index * 0.01),
    longitude: -53.0 - (index * 0.01),
    blocoEspacial: `BLOCO_${index % 4}`,
    estratoId: `E_${index % 6}`,
    criterioSelecao: {
      phiDiag: 0.1 + ((index % 8) * 0.1),
    },
    terreno: {
      elevacao: { estado: "medido", valor: 500 + index, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      declividadePct: { estado: "medido", valor: declividade, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      declividadeGraus: { estado: "modelado", valor: Math.atan(declividade / 100) * (180 / Math.PI), modelo: "atan(pct/100)", insumos: ["declividadePct"] },
      curvaturaPerfil: { estado: "medido", valor: -0.001 * (index % 5), fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      curvaturaPlana: { estado: "medido", valor: 0.001 * (index % 5), fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      acumuloFluxo: { estado: "medido", valor: 1000 + (index * 50), fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      twi: { estado: "modelado", valor: 7.0 + (index % 3), modelo: "ln(As/tan(beta))", insumos: ["acumuloFluxo", "declividadeGraus"] },
    },
    solo: {
      ordem: { estado: "medido", valor: "LATOSSOLO", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
      subOrdem: { estado: "medido", valor: "VERMELHO", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
      grandeGrupo: { estado: "medido", valor: "Distrofico", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
      tipoUnidade: { estado: "medido", valor: "simples", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
      confiancaPedologica: "alta",
      erodibilidadeClasse: { estado: "medido", valor: "Media", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
    },
    serie: {
      janela: { inicio: "2019-01-01", fim: "2025-12-31" },
      nObservacoesValidas: 350 + index,
      harmonicos: {},
      frequenciaSoloNu: { estado: "medido", valor: 0.15 + (index * 0.002), fonte: "Sentinel-2", adquiridoEm: "2026-09-08" },
      compostoSoloNu: {},
    },
    chuva: {
      precipAcum30d: { estado: "medido", valor: 100 + index, fonte: "CHIRPS", adquiridoEm: "2026-09-08" },
      precipAcum90d: { estado: "medido", valor: 350 + (index * 2), fonte: "CHIRPS", adquiridoEm: "2026-09-08" },
      i30Max: { estado: "medido", valor: 25 + (index % 10), fonte: "GPM IMERG", adquiridoEm: "2026-09-08" },
      nEventosErosivos: { estado: "medido", valor: 4, fonte: "GPM IMERG", adquiridoEm: "2026-09-08" },
      indiceMecanismo: { estado: "modelado", valor: 12.0 + index, modelo: "Sigma(erosividade * soloNu)", insumos: ["i30Max", "frequenciaSoloNu"] },
    },
    auditoria: {
      municipio: "Cascavel",
      uf: "PR",
      macrorregiao: "Oeste Paranaense",
      baciaHidrografica: "Bacia do Rio Piquiri",
    },
  };
}

describe("Invariantes de Exportação (src/lib/matriz/invariantes)", () => {
  it("aprova conjunto com dados reais e variância natural", () => {
    const pontos = Array.from({ length: 25 }, (_, i) => gerarPontoValido(i));
    const res = validarInvariantes(pontos);
    expect(res.valido).toBe(true);
    expect(res.violacoes).toHaveLength(0);
    expect(() => assegurarInvariantes(pontos)).not.toThrow();
  });

  describe("Invariante 7: Detector de Constante Disfarçada", () => {
    it("ABORTA com mensagem explícita se 150 linhas tiverem declividade idêntica de 16%", () => {
      // Reprodução do defeito real auditado
      const pontos150 = Array.from({ length: 150 }, (_, i) => gerarPontoValido(i, 16.0));
      const res = validarInvariantes(pontos150);

      expect(res.valido).toBe(false);
      const violacao7 = res.violacoes.find(v => v.invariante === 7);
      expect(violacao7).toBeDefined();
      expect(violacao7?.mensagem).toContain("terreno.declividadePct");
      expect(violacao7?.mensagem).toContain("16");
      expect(() => assegurarInvariantes(pontos150)).toThrow(/Invariante 7/);
    });

    it("não dispara quando n <= 20", () => {
      const poucosPontos = Array.from({ length: 15 }, (_, i) => gerarPontoValido(i, 16.0));
      const res = validarInvariantes(poucosPontos);
      const violacao7 = res.violacoes.find(v => v.invariante === 7);
      expect(violacao7).toBeUndefined();
    });
  });

  describe("Invariante 1: Coerência RUSLE", () => {
    it("rejeita perdaSolo preenchida quando a memória declara cálculo não executado", () => {
      const p = gerarPontoValido(1);
      p.rusle = {
        fatorR: { estado: "indisponivel", motivo: "Não calculado" },
        fatorK: { estado: "indisponivel", motivo: "Não calculado" },
        fatorLS: { estado: "indisponivel", motivo: "Não calculado" },
        fatorC: { estado: "indisponivel", motivo: "Não calculado" },
        fatorP: { estado: "tabelado", valor: 1.0, tabela: "P=1 default", chave: "default" },
        perdaSolo: { estado: "modelado", valor: 35.2, modelo: "declividade * 2.2", insumos: ["declividadePct"] },
        memoriaCalculo: "Cálculo RUSLE não executado",
      };

      const res = validarInvariantes([p]);
      expect(res.valido).toBe(false);
      const violacao1 = res.violacoes.find(v => v.invariante === 1);
      expect(violacao1).toBeDefined();
      expect(violacao1?.mensagem).toContain("Cálculo RUSLE não executado");
    });
  });

  describe("Invariante 2: Escala / Faixa Interna", () => {
    it("rejeita phiDiag fora da faixa [0, 1]", () => {
      const p = gerarPontoValido(1);
      p.criterioSelecao = { phiDiag: 1.25 }; // fora de [0, 1]
      const res = validarInvariantes([p]);
      expect(res.valido).toBe(false);
      const violacao2 = res.violacoes.find(v => v.invariante === 2);
      expect(violacao2).toBeDefined();
      expect(violacao2?.mensagem).toContain("1.25");
    });
  });

  describe("Invariante 3: Derivação estrita de campos não medidos", () => {
    it("deriva com exatidão todos os campos que não têm estado 'medido'", () => {
      const p = gerarPontoValido(1);
      // No ponto válido gerado: declividadeGraus, twi e indiceMecanismo são modelados.
      const naoMedidos = derivarCamposNaoMedidos(p);
      expect(naoMedidos).toContain("declividadeGraus");
      expect(naoMedidos).toContain("twi");
      expect(naoMedidos).toContain("indiceMecanismo");
      expect(naoMedidos).not.toContain("declividadePct");
      expect(naoMedidos).not.toContain("elevacao");
    });
  });

  describe("Invariante 5: Afirmação Negativa Fundiária", () => {
    it("rejeita status 'sem-correspondencia' se não houver registro de data de consulta", () => {
      const p = gerarPontoValido(1);
      p.fundiario = {
        status: "sem-correspondencia",
        // consultadoEm ausente!
      };
      const res = validarInvariantes([p]);
      expect(res.valido).toBe(false);
      const violacao5 = res.violacoes.find(v => v.invariante === 5);
      expect(violacao5).toBeDefined();
    });
  });

  describe("Invariante 6: Lista Negra de Literais Geográficos", () => {
    it("rejeita literais como 'Custom' e 'Bacia Local'", () => {
      const p = gerarPontoValido(1);
      p.auditoria = {
        municipio: "Paraná",
        macrorregiao: "Custom",
        baciaHidrografica: "Bacia Local",
      };
      const res = validarInvariantes([p]);
      expect(res.valido).toBe(false);
      const violacoes6 = res.violacoes.filter(v => v.invariante === 6);
      expect(violacoes6.length).toBeGreaterThanOrEqual(2);
      expect(violacoes6.some(v => v.mensagem.includes("Custom"))).toBe(true);
      expect(violacoes6.some(v => v.mensagem.includes("Bacia Local"))).toBe(true);
    });
  });
});
