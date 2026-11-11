import { describe, it, expect } from "vitest";
import {
  PERFIS_EXPORTACAO,
  PERFIS_CEGOS,
  PADROES_PROIBIDOS_PERFIS_CEGOS,
  COLUNAS_FIXADAS_AUTORIZACAO,
  ErroViolacaoCegamento,
  validarColunasCegas,
  validarColunasAutorizacao,
} from "./perfis";

/**
 * ============================================================================
 * TRAVA DE CEGAMENTO DOS PERFIS DE EXPORTAÇÃO — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Esta suíte de testes constitui a trava normativa e inviolável de integridade
 * amostral (Invariante 2 e Regra 6 / D16 / Prompt Q).
 *
 * Fixa o conjunto exato de colunas permitido para cada papel operacional,
 * aplicando lista estrita de exclusão contra qualquer vazamento de estrato biofísico,
 * titularidade aberta, probabilidades de inclusão (pi_i), pesos de amostragem (w_i),
 * identificadores de candidatos, partições de modelagem ou alvos supervisionados.
 *
 * DECLARAÇÃO FORMAL DE DESTINAÇÃO POR PERFIL:
 * - interpretacao-cega: Destina-se aos fotointérpretes de imagens de satélite (Fase A) — coordenadas e parâmetros de cena, sem qualquer indício de estrato, titular ou amostragem.
 * - campo-cego: Destina-se à equipe de campo para âncora de prevalência (Fase B) — coordenadas, rota e identificadores fundiários mascarados para localização física, sem titular aberto nem estrato.
 * - voo-cego: Destina-se ao piloto de drone e intérprete de ortomosaico centimétrico (Fase D) — coordenadas e envelope de voo, estritamente desvinculado de dados fundiários e estratos.
 * - autorizacao: Destina-se exclusivamente ao operador responsável pelo contato fundiário prévio com proprietários — contém titular real e CAR, mas omite categoricamente o estrato biofísico.
 */

describe("TAREFA 1 — Trava de Cegamento por Papel e Fixação de Colunas", () => {
  describe("1. Fixação Estrita das Colunas dos Perfis Cegos", () => {
    it("fixa exatamente as 6 colunas de 'interpretacao-cega' (Fase A: satélite)", () => {
      // Destina-se aos fotointérpretes de imagens de satélite (Fase A) — coordenadas e parâmetros de cena, sem qualquer indício de estrato, titular ou amostragem.
      const colunasEsperadas = [
        "Codigo",
        "Latitude",
        "Longitude",
        "Janela_Inicio",
        "Janela_Fim",
        "Referencia_Cena_Tile",
      ];
      expect(PERFIS_EXPORTACAO["interpretacao-cega"].colunasPermitidas).toEqual(colunasEsperadas);
    });

    it("fixa exatamente as 11 colunas de 'campo-cego' (Fase B: âncora de prevalência)", () => {
      // Destina-se à equipe de campo para âncora de prevalência (Fase B) — coordenadas, rota e identificadores fundiários mascarados para localização física, sem titular aberto nem estrato.
      const colunasEsperadas = [
        "Codigo",
        "Latitude",
        "Longitude",
        "Latitude_DMS",
        "Longitude_DMS",
        "Municipio",
        "Status_Fundiario",
        "Motivo_Acesso",
        "Codigo_CAR",
        "Titular_Mascarado",
        "Rota_Acesso",
      ];
      expect(PERFIS_EXPORTACAO["campo-cego"].colunasPermitidas).toEqual(colunasEsperadas);
    });

    it("fixa exatamente as 4 colunas de 'voo-cego' (Fase D: drone ortomosaico)", () => {
      // Destina-se ao piloto de drone e intérprete de ortomosaico centimétrico (Fase D) — coordenadas e envelope de voo, estritamente desvinculado de dados fundiários e estratos.
      const colunasEsperadas = [
        "Codigo",
        "Latitude",
        "Longitude",
        "Area_Voo_Poligono",
      ];
      expect(PERFIS_EXPORTACAO["voo-cego"].colunasPermitidas).toEqual(colunasEsperadas);
    });
  });

  describe("2. Barreira de Exclusão: Nenhum Perfil Cego Pode Conter Variáveis Proibidas", () => {
    for (const perfil of PERFIS_CEGOS) {
      it(`perfil '${perfil}' passa na validação contra todos os padrões proibidos`, () => {
        const colunas = PERFIS_EXPORTACAO[perfil].colunasPermitidas;
        expect(() => validarColunasCegas(perfil, colunas)).not.toThrow();
      });
    }

    it("a lista de padrões proibidos cobre todas as 10 categorias normativas de cegamento", () => {
      const categorias = PADROES_PROIBIDOS_PERFIS_CEGOS.map((p) => p.nome);
      expect(categorias).toContain("estrato biofísico");
      expect(categorias).toContain("titular real do imóvel");
      expect(categorias).toContain("titular não mascarado");
      expect(categorias).toContain("documento pessoal não mascarado");
      expect(categorias).toContain("documento pessoal CPF/CNPJ");
      expect(categorias).toContain("probabilidade de inclusão amostral");
      expect(categorias).toContain("peso amostral");
      expect(categorias).toContain("identificador de candidato");
      expect(categorias).toContain("partição ou papel no conjunto de modelagem");
      expect(categorias).toContain("alvo ou desfecho supervisionado");
    });

    const casosProibidos: Array<{ coluna: string; descricao: string }> = [
      { coluna: "Estrato_ID", descricao: "estrato biofísico nominal de D12" },
      { coluna: "estrato_id", descricao: "estrato biofísico minúsculo" },
      { coluna: "estrato", descricao: "termo genérico de estrato" },
      { coluna: "Nome_Proprietario", descricao: "titular real em PascalCase" },
      { coluna: "nome_proprietario", descricao: "titular real em snake_case" },
      { coluna: "proprietario", descricao: "proprietário direto" },
      { coluna: "Titular", descricao: "titular aberto sem máscara" },
      { coluna: "Nome_Titular", descricao: "nome do titular aberto" },
      { coluna: "CPF", descricao: "cadastro de pessoa física" },
      { coluna: "CNPJ", descricao: "cadastro de pessoa jurídica" },
      { coluna: "Documento", descricao: "documento aberto sem máscara" },
      { coluna: "pi", descricao: "probabilidade de inclusão simples" },
      { coluna: "pi_i", descricao: "probabilidade de inclusão de D23" },
      { coluna: "Pi_i", descricao: "probabilidade de inclusão D23 PascalCase" },
      { coluna: "probabilidade_inclusao", descricao: "probabilidade por extenso" },
      { coluna: "w", descricao: "peso amostral simples" },
      { coluna: "w_i", descricao: "peso amostral Horvitz-Thompson D23" },
      { coluna: "W_i", descricao: "peso amostral PascalCase" },
      { coluna: "peso", descricao: "peso por extenso" },
      { coluna: "peso_amostragem", descricao: "peso de amostragem por extenso" },
      { coluna: "candidato", descricao: "identificador de candidato simples" },
      { coluna: "candidato_id", descricao: "identificador opaco de candidato" },
      { coluna: "papel_conjunto", descricao: "papel treino/teste em snake_case" },
      { coluna: "Papel_Conjunto", descricao: "papel treino/teste em PascalCase" },
      { coluna: "particao", descricao: "partição de modelagem" },
      { coluna: "treino", descricao: "marcador de conjunto de treino" },
      { coluna: "heldout", descricao: "marcador de conjunto held-out" },
      { coluna: "Fracao_Erodida", descricao: "alvo contínuo primário D26" },
      { coluna: "Classe_Alvo_Binaria", descricao: "desfecho secundário D03" },
      { coluna: "Rotulo_Classe", descricao: "escala ordinal de origem D03" },
    ];

    for (const { coluna, descricao } of casosProibidos) {
      it(`rejeita coluna proibida '${coluna}' (${descricao}) se injetada em perfil cego`, () => {
        expect(() => validarColunasCegas("teste-cego", [coluna])).toThrow(ErroViolacaoCegamento);
      });
    }
  });

  describe("3. Meta-teste: Injeção de 'estrato_id' em Perfil Cego Falha Ruidosamente", () => {
    it("acusa com erro explícito se 'estrato_id' for injetado em perfil cego sintético", () => {
      const colunasComEstrato = [
        "Codigo",
        "Latitude",
        "Longitude",
        "estrato_id",
      ];

      expect(() => validarColunasCegas("voo-cego", colunasComEstrato)).toThrow(
        /\[VIOLAÇÃO DE CEGAMENTO\] O perfil cego 'voo-cego' contém a coluna proibida 'estrato_id'/
      );
    });

    it("acusa com erro explícito se 'Nome_Proprietario' for injetado em 'campo-cego'", () => {
      const colunasComProprietario = [
        ...PERFIS_EXPORTACAO["campo-cego"].colunasPermitidas,
        "Nome_Proprietario",
      ];

      expect(() => validarColunasCegas("campo-cego", colunasComProprietario)).toThrow(
        /\[VIOLAÇÃO DE CEGAMENTO\] O perfil cego 'campo-cego' contém a coluna proibida 'Nome_Proprietario'/
      );
    });
  });

  describe("4. TAREFA 2 — Trava Específica do Perfil 'autorizacao'", () => {
    it("fixa exatamente as 8 colunas de 'autorizacao' (contato com proprietários)", () => {
      // Destina-se exclusivamente ao operador responsável pelo contato fundiário prévio com proprietários — contém titular real e CAR, mas omite categoricamente o estrato biofísico.
      const colunasEsperadas = [
        "Codigo",
        "Latitude",
        "Longitude",
        "Municipio",
        "Codigo_CAR",
        "Nome_Proprietario",
        "Area_Imovel_Ha",
        "Area_Poligono_Ha",
      ];

      expect(PERFIS_EXPORTACAO["autorizacao"].colunasPermitidas).toEqual(colunasEsperadas);
      expect(COLUNAS_FIXADAS_AUTORIZACAO).toEqual(colunasEsperadas);
    });

    it("assegura que o perfil 'autorizacao' OMITE categoricamente o estrato biofísico", () => {
      const colunasAutorizacao = PERFIS_EXPORTACAO["autorizacao"].colunasPermitidas;
      expect(colunasAutorizacao.some((c) => /estrato/i.test(c))).toBe(false);
      expect(() => validarColunasAutorizacao(colunasAutorizacao)).not.toThrow();
    });

    it("meta-teste autorizacao: acusa violação se estrato_id for adicionado a 'autorizacao'", () => {
      const colunasComEstrato = [...PERFIS_EXPORTACAO["autorizacao"].colunasPermitidas, "Estrato_ID"];
      expect(() => validarColunasAutorizacao(colunasComEstrato)).toThrow(
        /identifica estrato biofísico \(omissão obrigatória sob D16 \/ Tarefa 2\)/
      );
    });
  });
});
