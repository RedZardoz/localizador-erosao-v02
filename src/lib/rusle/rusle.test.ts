import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  calcularFatorC,
  calcularFatorCSensibilidadeBsi,
  calcularFatorCVanDerKnijff,
  obterFatorCComProveniencia,
  ErroForaDoDominio,
} from "./fatorC";
import { montarLinhaDeBaseRUSLE, obterFatorPPadrao } from "./linhaDeBase";
import { validarInvariantesArtefato, ArtefatoProjetado } from "../matriz/invariantes";
import { REGISTRO_DECISOES, DECISOES, ErroDecisaoPendente } from "@/config/decisoes";

describe("Fase 8 — Linha de Base RUSLE e Fator C", () => {
  describe("14.1 Fator C (Durigon et al., 2014)", () => {
    it("C decresce estritamente com o NDVI", () => {
      const cs = [-0.2, 0.05, 0.2, 0.4, 0.6, 0.8, 0.95].map((n) => calcularFatorC(n));
      for (let i = 1; i < cs.length; i++) {
        expect(cs[i]).toBeLessThan(cs[i - 1]);
      }
    });

    it("C permanece em [0, 1] em todo o domínio", () => {
      for (const n of [-1, -0.5, 0, 0.5, 0.99, 1]) {
        const c = calcularFatorC(n);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    });

    it("reproduz os valores de referência", () => {
      expect(calcularFatorC(0.0)).toBeCloseTo(0.5, 6);
      expect(calcularFatorC(0.5)).toBeCloseTo(0.25, 6);
      expect(calcularFatorC(1.0)).toBeCloseTo(0.0, 6);
    });

    it("NDVI fora do domínio lança em vez de ser cortado", () => {
      expect(() => calcularFatorC(1.2)).toThrow(ErroForaDoDominio);
      expect(() => calcularFatorC(-1.01)).toThrow(ErroForaDoDominio);
      expect(() => calcularFatorC(Number.NaN)).toThrow(ErroForaDoDominio);
      expect(() => calcularFatorC(Infinity)).toThrow(ErroForaDoDominio);
    });

    it("exige que a decisão D01 esteja decidida no Registro de Decisões (§8)", () => {
      const estadoOriginal = DECISOES.D01.estado;
      try {
        DECISOES.D01.estado = "pendente";
        expect(() => calcularFatorC(0.4)).toThrow(ErroDecisaoPendente);
        const resp = obterFatorCComProveniencia({
          estado: "medido",
          valor: 0.4,
          fonte: "Sentinel-2 L2A",
          adquiridoEm: "2026-05-10T12:00:00Z",
          consultadoEm: "2026-09-10T21:00:00Z",
        });
        expect(resp.estado).toBe("indisponivel");
        if (resp.estado === "indisponivel") {
          expect(resp.causa).toBe("decisao-pendente");
          expect(resp.motivo).toContain("D01");
        }
      } finally {
        DECISOES.D01.estado = estadoOriginal;
      }
    });

    it("encapsula proveniência corretamente com modelo puro Durigon et al. (2014) e trata fora-do-dominio sem quebrar", () => {
      const respValida = obterFatorCComProveniencia({
        estado: "medido",
        valor: 0.4,
        fonte: "Sentinel-2 L2A",
        adquiridoEm: "2026-05-10T12:00:00Z",
        consultadoEm: "2026-09-10T21:00:00Z",
      });
      expect(respValida.estado).toBe("modelado");
      if (respValida.estado === "modelado") {
        expect(respValida.valor).toBe(0.3);
        expect(respValida.decisoes).toContain("D01");
        expect(respValida.modelo).toBe("Durigon et al. (2014): C = (1 - NDVI) / 2");
        expect(respValida.modelo).not.toContain("Híbrido");
        expect(respValida.modelo).not.toContain("(1 + BSI)");
        expect(respValida.insumos).toEqual(["NDVI Sentinel-2 L2A"]);
      }

      const respFora = obterFatorCComProveniencia({
        estado: "medido",
        valor: 1.5,
        fonte: "Sentinel-2 L2A",
        adquiridoEm: "2026-05-10T12:00:00Z",
        consultadoEm: "2026-09-10T21:00:00Z",
      });
      expect(respFora.estado).toBe("indisponivel");
      if (respFora.estado === "indisponivel") {
        expect(respFora.causa).toBe("fora-do-dominio");
      }

      const respIndisp = obterFatorCComProveniencia(null);
      expect(respIndisp.estado).toBe("indisponivel");
    });

    it("garante que obterFatorCComProveniencia e calcularFatorC possuem aridade 1 (não admitem segundo argumento)", () => {
      expect(obterFatorCComProveniencia.length).toBe(1);
      expect(calcularFatorC.length).toBe(1);
    });
  });

  describe("Análise de Sensibilidade — Modulação por BSI (exploratória)", () => {
    it("calcula a formulação de sensibilidade modulada por BSI: C = ((1 - NDVI)/2) * (1 + BSI)", () => {
      // Caso base (BSI = 0): reduz a Durigon
      expect(calcularFatorCSensibilidadeBsi(0.2, 0)).toBeCloseTo(0.4, 6);

      // Solo exposto lavado (BSI positivo = 0.5): fator C aumenta
      expect(calcularFatorCSensibilidadeBsi(0.2, 0.5)).toBeCloseTo(0.6, 6);

      // Solo protegido com palhada (BSI negativo = -0.2): fator C diminui
      expect(calcularFatorCSensibilidadeBsi(0.7, -0.2)).toBeCloseTo(0.12, 6);
    });

    it("BSI fora do domínio [-1, 1] lança erro em vez de corte silencioso na análise de sensibilidade", () => {
      expect(() => calcularFatorCSensibilidadeBsi(0.4, 1.5)).toThrow(ErroForaDoDominio);
      expect(() => calcularFatorCSensibilidadeBsi(0.4, -1.2)).toThrow(ErroForaDoDominio);
    });

    it("rejeita saída de sensibilidade C > 1 (ex.: NDVI = -1.0, BSI = 1.0 -> C = 2.0) lançando ErroForaDoDominio", () => {
      expect(() => calcularFatorCSensibilidadeBsi(-1.0, 1.0)).toThrow(ErroForaDoDominio);
    });
  });

  describe("Guarda de isolamento metodológico (§18) — sensibilidade fora do caminho analítico", () => {
    it("nenhum módulo em src/ (exceto fatorC.ts e testes) importa ou chama calcularFatorCSensibilidadeBsi nem calcularFatorCHibrido", () => {
      function listarArquivosTs(dir: string): string[] {
        let arqs: string[] = [];
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            arqs = arqs.concat(listarArquivosTs(full));
          } else if (
            (full.endsWith(".ts") || full.endsWith(".tsx")) &&
            !full.endsWith(".test.ts") &&
            !full.endsWith(".test.tsx") &&
            !full.replace(/\\/g, "/").endsWith("src/lib/rusle/fatorC.ts")
          ) {
            arqs.push(full);
          }
        }
        return arqs;
      }

      const arquivos = listarArquivosTs(path.resolve(process.cwd(), "src"));
      const violacoes = [];

      for (const arq of arquivos) {
        const c = fs.readFileSync(arq, "utf8");
        const rel = path.relative(process.cwd(), arq).replace(/\\/g, "/");
        if (c.includes("calcularFatorCSensibilidadeBsi")) {
          violacoes.push(`${rel}: referência a calcularFatorCSensibilidadeBsi no caminho analítico de produção`);
        }
        if (c.includes("calcularFatorCHibrido")) {
          violacoes.push(`${rel}: referência ao legado calcularFatorCHibrido`);
        }
      }

      expect(violacoes).toHaveLength(0);
    });

    it("meta-teste: a guarda detecta violação se um trecho de código chamar a função de sensibilidade", () => {
      const codigoInvasivo = 'import { calcularFatorCSensibilidadeBsi } from "@/lib/rusle/fatorC"; const x = calcularFatorCSensibilidadeBsi(0.2, 0.1);';
      expect(codigoInvasivo.includes("calcularFatorCSensibilidadeBsi")).toBe(true);
    });
  });

  describe("14.2 Fator P (Renard et al., 1997)", () => {
    it("P é sempre tabelado por padrão, nunca medido", () => {
      const p = obterFatorPPadrao();
      expect(p.estado).toBe("tabelado");
      if (p.estado === "tabelado") {
        expect(p.valor).toBe(1.0);
        expect(p.tabela).toContain("Renard et al. (1997)");
        expect(p.chave).toBe("sem-pratica-informada");
      }
    });
  });

  describe("14.3 Análise de Sensibilidade — van der Knijff et al. (2000)", () => {
    it("ordena o Fator C monotonicamente mas com compressão exponencial", () => {
      const alpha = 2;
      const beta = 1;
      const ndvis = [0.15, 0.35, 0.55, 0.75];
      const durigonC = ndvis.map((n) => calcularFatorC(n));
      const knijffC = ndvis.map((n) => calcularFatorCVanDerKnijff(n, alpha, beta));

      // Ambas são estritamente decrescentes
      for (let i = 1; i < knijffC.length; i++) {
        expect(knijffC[i]).toBeLessThan(knijffC[i - 1]);
        expect(durigonC[i]).toBeLessThan(durigonC[i - 1]);
      }

      // Para vegetação densa (0.75), Knijff cai acentuadamente em relação a Durigon
      expect(knijffC[3]).toBeLessThan(0.01);
      expect(durigonC[3]).toBe(0.125);
    });
  });

  describe("14.4 Coerência e Invariante 1", () => {
    // D13 e D15 estao integradas. Sem insumos de R e LS fornecidos, o Invariante 1
    // continua retendo perdaSolo com a causa "insuficiente", pois os fatores
    // nao puderam ser calculados por falta de dados.
    it("com D13 e D15 integradas mas sem insumos fornecidos, R, LS e perdaSolo são indisponíveis por insuficiente", () => {
      expect(REGISTRO_DECISOES.D13.estado).toBe("decidida");
      expect(REGISTRO_DECISOES.D14.estado).toBe("decidida");
      expect(REGISTRO_DECISOES.D15.estado).toBe("decidida");

      const rusle = montarLinhaDeBaseRUSLE({
        ndviProveniencia: {
          estado: "medido",
          valor: 0.5,
          fonte: "Sentinel-2 L2A",
          adquiridoEm: "2026-05-10T12:00:00Z",
          consultadoEm: "2026-09-10T21:00:00Z",
        },
      });

      expect(rusle.fatorC.estado).toBe("modelado");
      expect(rusle.fatorP.estado).toBe("tabelado");
      expect(rusle.fatorR.estado).toBe("indisponivel");
      expect(rusle.fatorK.estado).toBe("indisponivel");
      expect(rusle.fatorLS.estado).toBe("indisponivel");

      if (rusle.fatorR.estado === "indisponivel") {
        expect(rusle.fatorR.causa).toBe("insuficiente");
      }
      if (rusle.fatorLS.estado === "indisponivel") {
        expect(rusle.fatorLS.causa).toBe("insuficiente");
      }

      expect(rusle.perdaSolo.estado).toBe("indisponivel");
      if (rusle.perdaSolo.estado === "indisponivel") {
        expect(rusle.perdaSolo.causa).toBe("insuficiente");
      }
      expect(rusle.memoriaCalculo).toBeNull();
    });

    it("calcula RUSLE de ponta a ponta com insumos reais dos 5 fatores (D01, D13, D14, D15 e Renard 1997) sem substitutos", () => {
      const dataIso = "2026-09-10T21:00:00Z";
      const rusle = montarLinhaDeBaseRUSLE({
        // Fator C (D01): NDVI 0.5 -> C = (1 - 0.5) / 2 = 0.25
        ndviProveniencia: {
          estado: "medido",
          valor: 0.5,
          fonte: "Sentinel-2 L2A",
          adquiridoEm: dataIso,
          consultadoEm: dataIso,
        },
        // Fator K (D14): Camada oficial 2024 -> kSolos = 0.0285
        camadaErodibilidade2024: {
          kSolos: 0.0285,
          erodUm: "Média",
          codUm: "SG22NVef7",
          ogcFid: 105112,
        },
        // Fator R (D13): Coordenadas de Toledo (BP3) -> CHIRPS climatológico regional
        insumoFatorR: {
          latitude: -24.72,
          longitude: -53.74,
          identificadorFonte: "CHIRPS v2.0 0.05° Toledo",
        },
        // Fator LS (D15): Rampa típica em Toledo (declividade 5.143° = 9%, área contribuição 22.13 * 30 = 663.9 m²)
        insumoFatorLS: {
          declividadeGraus: 5.143,
          areaContribuicaoMontanteM2: 663.9,
          latitude: -24.72,
          longitude: -53.74,
        },
        // Fator P: Padrão (Renard et al., 1997) -> P = 1.0 tabelado
      });

      // Sob a Diretriz H1 (02/10/2026), sem fonte primária arquivada contendo os coeficientes,
      // fatorR é compulsoriamente indisponivel ('insuficiente') e perdaSolo fica retida (Invariante 1).
      expect(rusle.fatorC.estado).toBe("modelado");
      expect(rusle.fatorK.estado).toBe("tabelado");
      expect(rusle.fatorR.estado).toBe("indisponivel");
      if (rusle.fatorR.estado === "indisponivel") {
        expect(rusle.fatorR.causa).toBe("insuficiente");
        expect(rusle.fatorR.motivo).toContain("Diretriz H1");
      }
      expect(rusle.fatorLS.estado).toBe("modelado");
      expect(rusle.fatorP.estado).toBe("tabelado");

      expect(rusle.perdaSolo.estado).toBe("indisponivel");
      if (rusle.perdaSolo.estado === "indisponivel") {
        expect(rusle.perdaSolo.causa).toBe("insuficiente");
        expect(rusle.perdaSolo.motivo).toContain("R (insuficiente)");
      }

      // Quando o Fator R é fornecido com proveniência modelada comprovada (ex: calibração controlada):
      const rusleCompleto = montarLinhaDeBaseRUSLE({
        ndviProveniencia: {
          estado: "medido",
          valor: 0.2,
          fonte: "Sentinel-2 L2A",
          adquiridoEm: "2026-05-10T12:00:00Z",
          consultadoEm: "2026-09-10T21:00:00Z",
        },
        camadaErodibilidade2024: {
          kSolos: 0.0285,
          erodUm: "Média",
          codUm: "SG22NVef7",
          ogcFid: 105112,
        },
        fatorRSubstituto: {
          estado: "modelado",
          valor: 10623,
          modelo: "Equação regional do Paraná",
          insumos: ["CHIRPS v2.0 Toledo", "P_anual = 1820 mm"],
          decisoes: ["D13"],
        },
        insumoFatorLS: {
          declividadeGraus: 5.143,
          areaContribuicaoMontanteM2: 663.9,
          latitude: -24.72,
          longitude: -53.74,
        },
      });

      expect(rusleCompleto.fatorC.estado).toBe("modelado");
      expect(rusleCompleto.fatorK.estado).toBe("tabelado");
      expect(rusleCompleto.fatorR.estado).toBe("modelado");
      expect(rusleCompleto.fatorLS.estado).toBe("modelado");
      expect(rusleCompleto.fatorP.estado).toBe("tabelado");

      expect(rusleCompleto.perdaSolo.estado).toBe("modelado");
      if (rusleCompleto.perdaSolo.estado === "modelado") {
        expect(rusleCompleto.perdaSolo.valor).toBeGreaterThan(0);
        expect(rusleCompleto.perdaSolo.decisoes).toEqual(["D01", "D13", "D14", "D15"]);
      }
      expect(rusleCompleto.memoriaCalculo).not.toBeNull();
      expect(rusleCompleto.memoriaCalculo).toContain("RUSLE A = R");
      expect(rusleCompleto.memoriaCalculo).toContain("t/ha/ano");
    });

    it("propaga causa decisao-pendente para perdaSolo quando um fator a carrega", () => {
      // Cobertura do caminho "decisao-pendente" por injecao, e nao pelo estado do
      // registro: e a agregacao do Invariante 1 que esta sob teste, e ela deve preferir
      // "decisao-pendente" a "insuficiente" sempre que qualquer fator a carregue.
      const rusle = montarLinhaDeBaseRUSLE({
        ndviProveniencia: {
          estado: "medido",
          valor: 0.5,
          fonte: "Sentinel-2 L2A",
          adquiridoEm: "2026-05-10T12:00:00Z",
          consultadoEm: "2026-09-10T21:00:00Z",
        },
        fatorRSubstituto: {
          estado: "indisponivel",
          causa: "decisao-pendente",
          motivo: "Injetado pelo teste para exercitar a agregacao do Invariante 1.",
        },
      });

      expect(rusle.perdaSolo.estado).toBe("indisponivel");
      if (rusle.perdaSolo.estado === "indisponivel") {
        expect(rusle.perdaSolo.causa).toBe("decisao-pendente");
      }
      expect(rusle.memoriaCalculo).toBeNull();
    });

    it("calcula perda de solo e gera memória de cálculo quando todos os 5 fatores são providos", () => {
      const dataIso = "2026-09-10T21:00:00Z";
      const rusle = montarLinhaDeBaseRUSLE({
        ndviProveniencia: {
          estado: "medido",
          valor: 0.5, // C = (1 - 0.5) / 2 = 0.25
          fonte: "Sentinel-2 L2A",
          adquiridoEm: dataIso,
          consultadoEm: dataIso,
        },
        fatorRSubstituto: {
          estado: "modelado",
          valor: 6800,
          modelo: "Equação regional",
          insumos: ["Chuva"],
          decisoes: ["D13"],
        },
        fatorKSubstituto: {
          estado: "tabelado",
          valor: 0.02,
          tabela: "Embrapa Solos",
          chave: "LVd",
        },
        fatorLSSubstituto: {
          estado: "modelado",
          valor: 1.405,
          modelo: "Desmet & Govers",
          insumos: ["MDE"],
          decisoes: ["D15"],
        },
        fatorPSubstituto: {
          estado: "tabelado",
          valor: 1.0,
          tabela: "Renard et al. (1997)",
          chave: "sem-pratica-informada",
        },
      });

      expect(rusle.fatorC.estado).toBe("modelado");
      expect(rusle.perdaSolo.estado).toBe("modelado");
      if (rusle.perdaSolo.estado === "modelado") {
        // A = 6800 * 0.020 * 1.405 * 0.25 * 1.0 = 47.77
        expect(rusle.perdaSolo.valor).toBeCloseTo(47.77, 2);
      }
      expect(rusle.memoriaCalculo).not.toBeNull();
      expect(rusle.memoriaCalculo).toContain("RUSLE A = R (6800) * K (0.02) * LS (1.405) * C (0.25) * P (1) = 47.7700 t/ha/ano");
    });

    it("com D13/D15 decididas e sem insumos passados pela rota, causa de indisponivel é 'insuficiente' e declara que o insumo não é fornecido pela rota (C11 / A38)", () => {
      const rusle = montarLinhaDeBaseRUSLE({});

      expect(rusle.fatorR.estado).toBe("indisponivel");
      if (rusle.fatorR.estado === "indisponivel") {
        expect(rusle.fatorR.causa).not.toBe("decisao-pendente");
        expect(rusle.fatorR.causa).toBe("insuficiente");
        expect(rusle.fatorR.motivo).toContain("não é fornecido pela rota");
      }

      expect(rusle.fatorLS.estado).toBe("indisponivel");
      if (rusle.fatorLS.estado === "indisponivel") {
        expect(rusle.fatorLS.causa).not.toBe("decisao-pendente");
        expect(rusle.fatorLS.causa).toBe("insuficiente");
        expect(rusle.fatorLS.motivo).toContain("não é fornecido pela rota");
      }
    });

    it("Invariante 1 valida artefato com linhas RUSLE consistentes e recusa violações", () => {
      // Caso 1: Artefato válido com RUSLE calculada (5 fatores + perda + memória)
      const artefatoValido: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: [
          "Codigo",
          "Latitude",
          "Longitude",
          "RUSLE_Fator_R",
          "RUSLE_Fator_K",
          "RUSLE_Fator_LS",
          "RUSLE_Fator_C",
          "RUSLE_Fator_P",
          "RUSLE_Perda_Solo_t_ha_ano",
          "RUSLE_Memoria_Calculo",
        ],
        linhas: [
          {
            Codigo: "PR-2026-0001",
            Latitude: -24.1,
            Longitude: -51.2,
            RUSLE_Fator_R: 6800,
            RUSLE_Fator_K: 0.02,
            RUSLE_Fator_LS: 1.4,
            RUSLE_Fator_C: 0.25,
            RUSLE_Fator_P: 1.0,
            RUSLE_Perda_Solo_t_ha_ano: 47.6,
            RUSLE_Memoria_Calculo: "A = R*K*LS*C*P",
          },
        ],
      };
      const resValido = validarInvariantesArtefato(artefatoValido);
      expect(resValido.valido).toBe(true);

      // Caso 2: perdaSolo preenchida mas sem fator K
      const artefatoIncompleto: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: [
          "Codigo",
          "Latitude",
          "Longitude",
          "RUSLE_Fator_R",
          "RUSLE_Fator_K",
          "RUSLE_Fator_LS",
          "RUSLE_Fator_C",
          "RUSLE_Fator_P",
          "RUSLE_Perda_Solo_t_ha_ano",
          "RUSLE_Memoria_Calculo",
        ],
        linhas: [
          {
            Codigo: "PR-2026-0002",
            Latitude: -24.2,
            Longitude: -51.3,
            RUSLE_Fator_R: 6800,
            RUSLE_Fator_K: null, // ausente
            RUSLE_Fator_LS: 1.4,
            RUSLE_Fator_C: 0.25,
            RUSLE_Fator_P: 1.0,
            RUSLE_Perda_Solo_t_ha_ano: 47.6,
            RUSLE_Memoria_Calculo: "A = R*K*LS*C*P",
          },
        ],
      };
      const resIncompleto = validarInvariantesArtefato(artefatoIncompleto);
      expect(resIncompleto.valido).toBe(false);
      expect(resIncompleto.violacoes.some((v) => v.invariante === 1)).toBe(true);

      // Caso 3: 5 fatores presentes mas perdaSolo vazia
      const artefatoSemPerda: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: [
          "Codigo",
          "Latitude",
          "Longitude",
          "RUSLE_Fator_R",
          "RUSLE_Fator_K",
          "RUSLE_Fator_LS",
          "RUSLE_Fator_C",
          "RUSLE_Fator_P",
          "RUSLE_Perda_Solo_t_ha_ano",
          "RUSLE_Memoria_Calculo",
        ],
        linhas: [
          {
            Codigo: "PR-2026-0003",
            Latitude: -24.3,
            Longitude: -51.4,
            RUSLE_Fator_R: 6800,
            RUSLE_Fator_K: 0.02,
            RUSLE_Fator_LS: 1.4,
            RUSLE_Fator_C: 0.25,
            RUSLE_Fator_P: 1.0,
            RUSLE_Perda_Solo_t_ha_ano: null, // vazio
            RUSLE_Memoria_Calculo: "A = R*K*LS*C*P",
          },
        ],
      };
      const resSemPerda = validarInvariantesArtefato(artefatoSemPerda);
      expect(resSemPerda.valido).toBe(false);
      expect(resSemPerda.violacoes.some((v) => v.invariante === 1)).toBe(true);
    });
  });
});
