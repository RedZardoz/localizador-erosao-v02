import { describe, it, expect } from "vitest";
import { validarInvariantesArtefato, assegurarInvariantesArtefato, ArtefatoProjetado, contemTermoIsolado } from "./invariantes";

describe("Invariantes de Exportação — Validações e Meta-Testes", () => {
  describe("Invariante 7: Detector de Constante Disfarçada", () => {
    it("bloqueia quando uma coluna numérica possui o mesmo valor em 150 linhas idênticas", () => {
      const linhas = Array.from({ length: 150 }, () => ({
        Codigo: "PR-001",
        Declividade_pct: 16.0, // defeito clássico do Localizador
        RUSLE_Perda_Solo_t_ha_ano: 35.2,
      }));

      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Declividade_pct", "RUSLE_Perda_Solo_t_ha_ano"],
        linhas,
      };

      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      const v7 = res.violacoes.filter((v) => v.invariante === 7);
      expect(v7.length).toBeGreaterThan(0);
      expect(v7.some((v) => (v.detalhes as any)?.coluna === "Declividade_pct")).toBe(true);
    });

    it("NÃO é desativado quando há valores vazios (corrige defeito S1-12)", () => {
      // 30 linhas com valor idêntico e 10 linhas vazias
      const linhas = [
        ...Array.from({ length: 25 }, () => ({
          Codigo: "PR-001",
          Declividade_pct: 12.0,
        })),
        ...Array.from({ length: 10 }, () => ({
          Codigo: "PR-002",
          Declividade_pct: null,
        })),
      ];

      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Declividade_pct"],
        linhas,
      };

      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 7)).toBe(true);
    });

    it("aprova dados com variância física natural", () => {
      const linhas = Array.from({ length: 30 }, (_, i) => ({
        Codigo: `PR-${i}`,
        Declividade_pct: 5.0 + i * 0.5,
      }));

      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Declividade_pct"],
        linhas,
      };

      const res = validarInvariantesArtefato(artefato);
      const v7 = res.violacoes.filter((v) => v.invariante === 7);
      expect(v7).toHaveLength(0);
    });
  });

  describe("Invariante 2: Lista de Permissão de Colunas por Perfil", () => {
    it("recusa coluna não permitida no perfil (ex: phiDiag ou severity)", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "phiDiag", "severity"],
        linhas: [{ Codigo: "PR-001", phiDiag: 0.5, severity: "Alta" }],
      };

      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 2)).toBe(true);
    });

    it("recusa features científicas ou rótulo no perfil campo-cego", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "campo-cego",
        cabecalho: ["Codigo", "Latitude", "Longitude", "Frequencia_Solo_Nu", "Rotulo_Classe"],
        linhas: [{ Codigo: "PR-001", Latitude: -25.0, Longitude: -53.0, Frequencia_Solo_Nu: 0.2, Rotulo_Classe: "Alta" }],
      };

      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      const v2 = res.violacoes.filter((v) => v.invariante === 2);
      expect(v2.length).toBe(2); // Frequencia_Solo_Nu e Rotulo_Classe
    });

    it("recusa campos derivados de Planet na matriz de treino (Decisão D05)", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "matriz-treino",
        cabecalho: ["Codigo", "planetApiKey", "planetRefletancia"],
        linhas: [{ Codigo: "PR-001", planetApiKey: "chave", planetRefletancia: 0.15 }],
      };

      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 2)).toBe(true);
    });
  });

  describe("Invariante 6: Lista Negra de Literais Geográficos", () => {
    it("recusa literais proibidos como 'Custom', 'Bacia Local' ou 'Paraná' como município", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Municipio", "Bacia_Hidrografica"],
        linhas: [
          { Codigo: "PR-001", Municipio: "Paraná", Bacia_Hidrografica: "Bacia Hidrográfica Local" },
        ],
      };

      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 6)).toBe(true);
    });
  });

  describe("Invariante 7: Detector de Constante Disfarçada e Exceção Tabelada", () => {
    it("bloqueia exportação quando coluna contínua possui 21 valores idênticos", () => {
      const linhas = Array.from({ length: 25 }, (_, i) => ({
        Codigo: `PR-${String(i + 1).padStart(3, "0")}`,
        Declividade_pct: 12.5, // constante disfarçada!
      }));

      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Declividade_pct"],
        linhas,
      };

      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 7)).toBe(true);
    });

    it("permite RUSLE_Fator_P constante (1.0) por ser valor tabelado legítimo (Renard et al. 1997)", () => {
      const linhas = Array.from({ length: 25 }, (_, i) => ({
        Codigo: `PR-${String(i + 1).padStart(3, "0")}`,
        Declividade_pct: 5.0 + i * 0.5, // com variância natural
        RUSLE_Fator_P: 1.0,            // tabelado uniforme
      }));

      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Declividade_pct", "RUSLE_Fator_P"],
        linhas,
      };

      const res = validarInvariantesArtefato(artefato);
      expect(res.violacoes.some((v) => v.invariante === 7)).toBe(false);
    });
  });

  describe("Invariante 1: Coerência RUSLE", () => {
    it("recusa perda de solo preenchida sem os 5 fatores e memória válida", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "RUSLE_Perda_Solo_t_ha_ano", "RUSLE_Fator_R"],
        linhas: [{ Codigo: "PR-001", RUSLE_Perda_Solo_t_ha_ano: 15.0, RUSLE_Fator_R: 10000 }],
      };
      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 1)).toBe(true);
    });

    it("aprova quando perda, os 5 fatores e a memória estão presentes e válidos", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: [
          "Codigo",
          "RUSLE_Perda_Solo_t_ha_ano",
          "RUSLE_Fator_R",
          "RUSLE_Fator_K",
          "RUSLE_Fator_LS",
          "RUSLE_Fator_C",
          "RUSLE_Fator_P",
          "RUSLE_Memoria_Calculo",
        ],
        linhas: [
          {
            Codigo: "PR-001",
            RUSLE_Perda_Solo_t_ha_ano: 12.5,
            RUSLE_Fator_R: 10000,
            RUSLE_Fator_K: 0.02,
            RUSLE_Fator_LS: 1.5,
            RUSLE_Fator_C: 0.05,
            RUSLE_Fator_P: 1.0,
            RUSLE_Memoria_Calculo: "A = 10000 * 0.02 * 1.5 * 0.05 * 1.0 = 15.0",
          },
        ],
      };
      const res = validarInvariantesArtefato(artefato);
      expect(res.violacoes.some((v) => v.invariante === 1)).toBe(false);
    });
  });

  describe("Invariante 3: Coerência de Campos_Estimados", () => {
    it("recusa quando há coluna não medida mas Campos_Estimados está vazio ou diz 100% medido", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Campos_Estimados", "Elevacao_m", "Elevacao_m_Origem"],
        linhas: [{ Codigo: "PR-001", Campos_Estimados: "", Elevacao_m: 100, Elevacao_m_Origem: "modelado" }],
      };
      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 3)).toBe(true);
    });

    it("aprova quando Campos_Estimados reflete as colunas estimadas", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Campos_Estimados", "Elevacao_m", "Elevacao_m_Origem"],
        linhas: [{ Codigo: "PR-001", Campos_Estimados: "Elevacao_m", Elevacao_m: 100, Elevacao_m_Origem: "modelado" }],
      };
      const res = validarInvariantesArtefato(artefato);
      expect(res.violacoes.some((v) => v.invariante === 3)).toBe(false);
    });
  });

  describe("Invariante 4: Rastreabilidade de Satélite", () => {
    it("recusa quando há coluna de satélite mas campos de rastreio estão vazios", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Elevacao_m_Origem", "Rastreio_Cenas", "Rastreio_Versao_Motor"],
        linhas: [{ Codigo: "PR-001", Elevacao_m_Origem: "medido", Rastreio_Cenas: "", Rastreio_Versao_Motor: "" }],
      };
      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 4)).toBe(true);
    });

    it("aprova quando campos de rastreio estão preenchidos", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Elevacao_m_Origem", "Rastreio_Cenas", "Rastreio_Versao_Motor", "Rastreio_Calculado_Em"],
        linhas: [
          {
            Codigo: "PR-001",
            Elevacao_m_Origem: "medido",
            Rastreio_Cenas: "S2B_MSIL2A_TEST",
            Rastreio_Versao_Motor: "1.0",
            Rastreio_Calculado_Em: "2026-09-10",
          },
        ],
      };
      const res = validarInvariantesArtefato(artefato);
      expect(res.violacoes.some((v) => v.invariante === 4)).toBe(false);
    });
  });

  describe("Invariante 5: Afirmação Negativa Fundiária", () => {
    it("recusa sem-correspondencia com motivo apontando falha ou serviço indisponível", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "CAR_Status", "Motivo_Acesso"],
        linhas: [{ Codigo: "PR-001", CAR_Status: "sem-correspondencia", Motivo_Acesso: "servico indisponivel" }],
      };
      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 5)).toBe(true);
    });

    it("recusa Status_Fundiario sem-correspondencia com erro de rede no perfil campo-cego", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "campo-cego",
        cabecalho: ["Codigo", "Status_Fundiario", "Motivo_Acesso"],
        linhas: [{ Codigo: "PR-001", Status_Fundiario: "sem-correspondencia", Motivo_Acesso: "erro de rede" }],
      };
      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 5)).toBe(true);
    });

    it("aprova sem-correspondencia após consulta válida sem match", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "campo-cego",
        cabecalho: ["Codigo", "Status_Fundiario", "Motivo_Acesso"],
        linhas: [{ Codigo: "PR-001", Status_Fundiario: "sem-correspondencia", Motivo_Acesso: "imovel_nao_localizado" }],
      };
      const res = validarInvariantesArtefato(artefato);
      expect(res.violacoes.some((v) => v.invariante === 5)).toBe(false);
    });
  });

  describe("Casamento de termos por palavra isolada (revisão de 15/10/2026)", () => {
    it("contemTermoIsolado: 'rede' não casa dentro de 'credenciada' nem 'dem' dentro de 'ordem'", () => {
      expect(contemTermoIsolado("autorização de acesso credenciada", "rede")).toBe(false);
      expect(contemTermoIsolado("ordem de serviço", "dem")).toBe(false);
      expect(contemTermoIsolado("erro de rede", "rede")).toBe(true);
      expect(contemTermoIsolado("erro_de_rede", "erro")).toBe(true);       // sublinhado separa
      expect(contemTermoIsolado("copernicus/dem/glo30 (esa)", "dem")).toBe(true); // barra separa
      expect(contemTermoIsolado("servico-indisponivel", "servico-indisponivel")).toBe(true);
    });

    it("Invariante 5: motivo legítimo com 'credenciada' NÃO é tratado como falha de consulta", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "campo-cego",
        cabecalho: ["Codigo", "Status_Fundiario", "Motivo_Acesso"],
        linhas: [{ Codigo: "PR-001", Status_Fundiario: "sem-correspondencia", Motivo_Acesso: "Consulta realizada por equipe credenciada; imóvel não localizado na base" }],
      };
      const res = validarInvariantesArtefato(artefato);
      expect(res.violacoes.some((v) => v.invariante === 5)).toBe(false);
    });

    it("Invariante 5: 'falha de rede' continua reprovando", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "campo-cego",
        cabecalho: ["Codigo", "Status_Fundiario", "Motivo_Acesso"],
        linhas: [{ Codigo: "PR-001", Status_Fundiario: "sem-correspondencia", Motivo_Acesso: "falha de rede na consulta" }],
      };
      expect(validarInvariantesArtefato(artefato).violacoes.some((v) => v.invariante === 5)).toBe(true);
    });

    it("Invariante 4: origem 'Ordem de serviço' não é dado de satélite; 'Copernicus DEM' é", () => {
      const base = (origem: string): ArtefatoProjetado => ({
        perfil: "planilha",
        cabecalho: ["Codigo", "Observacao_Origem", "Rastreio_Cenas", "Rastreio_Versao_Motor"],
        linhas: [{ Codigo: "PR-001", Observacao_Origem: origem, Rastreio_Cenas: "", Rastreio_Versao_Motor: "" }],
      });
      expect(validarInvariantesArtefato(base("Ordem de serviço 123")).violacoes.some((v) => v.invariante === 4)).toBe(false);
      expect(validarInvariantesArtefato(base("Copernicus DEM GLO-30")).violacoes.some((v) => v.invariante === 4)).toBe(true);
    });
  });

  describe("Invariante 6: Lista Negra e Siglas de UF", () => {
    it("recusa sigla de UF (PR) na coluna de Municipio", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Municipio", "Bacia_Hidrografica"],
        linhas: [{ Codigo: "PR-001", Municipio: "PR", Bacia_Hidrografica: "Paraná 3" }],
      };
      const res = validarInvariantesArtefato(artefato);
      expect(res.valido).toBe(false);
      expect(res.violacoes.some((v) => v.invariante === 6)).toBe(true);
    });

    it("aprova município real com bacia válida", () => {
      const artefato: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: ["Codigo", "Municipio", "Bacia_Hidrografica"],
        linhas: [{ Codigo: "PR-001", Municipio: "Medianeira", Bacia_Hidrografica: "Paraná 3" }],
      };
      const res = validarInvariantesArtefato(artefato);
      expect(res.violacoes.some((v) => v.invariante === 6)).toBe(false);
    });
  });

  describe("Meta-Teste: Todos os 7 Invariantes Existem e Operam", () => {
    it("garante que existem validadores ativos para os invariantes 1 a 7", () => {
      const invariantesEsperados = [1, 2, 3, 4, 5, 6, 7];
      const artefatosTeste: Record<number, ArtefatoProjetado> = {
        1: {
          perfil: "planilha",
          cabecalho: ["Codigo", "RUSLE_Perda_Solo_t_ha_ano"],
          linhas: [{ Codigo: "X", RUSLE_Perda_Solo_t_ha_ano: 10 }],
        },
        2: {
          perfil: "matriz-treino",
          cabecalho: ["Ponto_ID", "coluna_invalida_nao_permitida"],
          linhas: [{ Ponto_ID: "X", coluna_invalida_nao_permitida: 1 }],
        },
        3: {
          perfil: "planilha",
          cabecalho: ["Codigo", "Campos_Estimados", "Elevacao_m_Origem"],
          linhas: [{ Codigo: "X", Campos_Estimados: "", Elevacao_m_Origem: "modelado" }],
        },
        4: {
          perfil: "planilha",
          cabecalho: ["Codigo", "Elevacao_m_Origem", "Rastreio_Cenas", "Rastreio_Versao_Motor"],
          linhas: [{ Codigo: "X", Elevacao_m_Origem: "medido", Rastreio_Cenas: "", Rastreio_Versao_Motor: "" }],
        },
        5: {
          perfil: "campo-cego",
          cabecalho: ["Codigo", "Status_Fundiario", "Motivo_Acesso"],
          linhas: [{ Codigo: "X", Status_Fundiario: "sem-correspondencia", Motivo_Acesso: "servico indisponivel" }],
        },
        6: {
          perfil: "planilha",
          cabecalho: ["Codigo", "Municipio"],
          linhas: [{ Codigo: "X", Municipio: "Custom" }],
        },
        7: {
          perfil: "planilha",
          cabecalho: ["Codigo", "Declividade_pct"],
          linhas: Array.from({ length: 25 }, () => ({ Codigo: "X", Declividade_pct: 10 })),
        },
      };

      for (const invNum of invariantesEsperados) {
        const artefato = artefatosTeste[invNum];
        expect(artefato, `Artefato para teste do invariante ${invNum} deve estar definido`).toBeDefined();
        const res = validarInvariantesArtefato(artefato);
        const encontrou = res.violacoes.some((v) => v.invariante === invNum);
        expect(encontrou, `Invariante ${invNum} deve disparar violação quando acionado`).toBe(true);
      }
    });
  });
});
