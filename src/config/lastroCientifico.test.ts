import { describe, it, expect } from "vitest";
import { DECISOES, PARAMETROS, Decisao } from "./decisoes";

/**
 * ============================================================================
 * Trava da Norma de Lastro Científico — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * O QUÊ: reprova quando uma decisão ou parâmetro com estado "decidida" não tem
 * referência a bibliografia EXTERNA. Autorreferência — "Metodologia PPGTCA",
 * "Planejamento V3", caminho em docs/, linha de código, outra decisão do próprio
 * registro, "herdado do SAREL 1" — não conta como lastro: apenas move a pergunta
 * de lugar.
 *
 * POR QUÊ EXISTE: a norma completa está em docs/NORMA_LASTRO_CIENTIFICO.md. Ela
 * tem trava porque, neste projeto, regra escrita em prosa já derivou: as 9 Regras
 * Invioláveis existiam em docs/design.md desde o início e, ainda assim, sete
 * decisões chegaram a 20/10/2026 sem lastro externo. Texto depende de memória
 * humana entre sessões; teste, não.
 *
 * COMO SE COMPORTA: passa hoje por causa da DIVIDA_DECLARADA abaixo, e reprova em
 * qualquer entrada NOVA que nasça sem lastro. A lista também se autodenuncia: se
 * uma entrada em dívida receber referência externa de verdade, ela vira obsoleta e
 * o teste exige a sua remoção — a dívida não apodrece em silêncio.
 */

/**
 * Marcadores de fonte externa: autor com ano, DOI, ISBN, localizador de periódico
 * (volume(número):página) ou "et al.". Deliberadamente permissivo — a função desta
 * trava é pegar a AUSÊNCIA de lastro, não julgar a qualidade da fonte. Julgar a
 * fonte é do pesquisador (Seção 2 do CLAUDE.md).
 */
const MARCADORES_EXTERNOS: readonly RegExp[] = [
  /\(\d{4}[a-z]?\)/,              // Durigon et al. (2014)
  /,\s*\d{4}\)/,                  // (Franchini et al., 2011)
  /\bet al\./,                    // et al.
  /\b10\.\d{4,}\/\S+/,            // DOI
  /\bISBN\b/i,
  /\b\d+\(\d+\)\s*:\s*\d+/,       // 35(2):441-453
  /\bv\.\s*\d+.*\bn\.\s*\d+/i,    // v. 24, n. 5
];

/**
 * Dívida declarada em 20/10/2026, pela regra R-L4 da norma. Cada entrada aqui é
 * uma decisão que HOJE não tem lastro externo e cuja correção está pendente.
 *
 * Isto NÃO é absolvição: é dívida nomeada, com data, para que o teste possa
 * bloquear violação nova sem fingir que as antigas não existem.
 */
interface DividaLastro {
  id: string;
  motivo: string;
}

const DIVIDA_DECLARADA: readonly DividaLastro[] = [
  {
    id: "D02",
    motivo:
      "Limiares espectrais referenciados à metodologia do próprio projeto. O BSI tem fonte " +
      "externa JÁ presente no registro — Rikimaru et al. (2002), citada em D20. Correção por cruzamento.",
  },
  {
    id: "D03",
    motivo:
      "Escala do rótulo referenciada à metodologia do próprio projeto e a arquivos de código. " +
      "Sem candidato externo identificado no registro; exige busca bibliográfica.",
  },
  {
    id: "D11",
    motivo:
      "Mínimo de 6 observações válidas, referenciado apenas à Seção 6.1 da metodologia do projeto. " +
      "Busca por literatura de sensoriamento remoto que fixe mínimo de observações para composição " +
      "por percentil não encontrou padrão estabelecido. É a dívida de maior consequência: governa " +
      "suficiência amostral.",
  },
  {
    id: "D18",
    motivo:
      "Buffer do recorte Planet referenciado ao Planejamento V3 e a código. Sem candidato externo " +
      "identificado; exige busca bibliográfica.",
  },
  {
    id: "P02",
    motivo:
      "Espaçamento do thinning declarado como herdado do SAREL 1. Herança explica a origem, não " +
      "justifica o valor. Lastro externo JÁ presente no registro — Roberts et al. (2017), citada em " +
      "P01 para autocorrelação espacial. Correção por cruzamento.",
  },
  {
    id: "P05",
    motivo:
      "Classes elegíveis do ESA WorldCover sem campo de referência. Fonte externa JÁ presente no " +
      "registro — Zanaga et al. (2022), citada em D07 para a mesma base. Correção por cruzamento.",
  },
  {
    id: "P07",
    motivo:
      "Semente aleatória da amostragem sem campo de referência. Sem candidato externo identificado; " +
      "exige busca bibliográfica sobre reprodutibilidade de sorteio.",
  },
  {
    id: "D17",
    motivo:
      "Decisão de natureza CONTRATUAL, não científica: alocação da cota do Planet Labs Education & " +
      "Research Program, Plan ID 798565. Não existe literatura científica que prescreva alocação de " +
      "cota comercial, e exigir citação aqui induziria a inventar uma. A referência correta é o " +
      "próprio instrumento contratual, e é isso que o campo traz. Fica em dívida para que o " +
      "pesquisador decida se a norma deve prever uma categoria de decisão operacional/contratual.",
  },
];

function temLastroExterno(referencia: string | undefined): boolean {
  if (typeof referencia !== "string" || referencia.trim().length === 0) return false;
  return MARCADORES_EXTERNOS.some((re) => re.test(referencia));
}

function entradasDecididas(): Decisao<unknown>[] {
  return [...Object.values(DECISOES), ...Object.values(PARAMETROS)].filter(
    (d) => d.estado === "decidida"
  ) as Decisao<unknown>[];
}

describe("Norma de Lastro Científico (docs/NORMA_LASTRO_CIENTIFICO.md)", () => {
  describe("Meta-testes — confirma que o detector NÃO é vacuoso", () => {
    it("reconhece formas usuais de referência externa", () => {
      for (const r of [
        "Durigon et al. (2014), International Journal of Remote Sensing 35(2):441-453",
        "Embrapa Soja (Franchini et al., 2011)",
        "doi 10.1080/00031305.1996.10473566",
        "Acta Scientiarum, Maringá, v. 24, n. 5, p. 1335-1340",
      ]) {
        expect(temLastroExterno(r)).toBe(true);
      }
    });

    it("recusa autorreferência, caminho interno e campo vazio", () => {
      for (const r of [
        "Metodologia PPGTCA 2026, Seção 3.1 e Tabela 1",
        "Planejamento V3, §10.4",
        "src/lib/matriz/montagem.ts:139-148",
        "Herdado do Localizador de Erosão (SAREL 1) para dispersão espacial",
        "",
        undefined,
      ]) {
        expect(temLastroExterno(r as string | undefined)).toBe(false);
      }
    });
  });

  describe("R-L1 — toda decisão decidida tem lastro externo", () => {
    it("nenhuma entrada NOVA pode nascer sem referência bibliográfica externa", () => {
      const emDivida = new Set(DIVIDA_DECLARADA.map((d) => d.id));
      const violacoes = entradasDecididas()
        .filter((d) => !temLastroExterno(d.referencia) && !emDivida.has(d.id))
        .map((d) => `  ${d.id} — "${d.titulo}": referência ausente ou apenas interna.`);

      if (violacoes.length > 0) {
        expect.fail(
          "Decisão decidida sem lastro bibliográfico externo (Norma de Lastro Científico, R-L1):\n" +
            violacoes.join("\n") +
            "\n\nCaminhos admitidos: (a) acrescentar a referência externa; ou (b) registrar a " +
            "dívida pela R-L4, acrescentando a entrada a DIVIDA_DECLARADA com motivo e data. " +
            "Inventar referência é falta grave — ver seção 5 da norma."
        );
      }
      expect(violacoes).toHaveLength(0);
    });
  });

  describe("A dívida declarada não apodrece", () => {
    it("entrada em dívida que já recebeu lastro externo deve ser REMOVIDA da lista", () => {
      const obsoletas = DIVIDA_DECLARADA.filter((dv) => {
        const d = DECISOES[dv.id] ?? PARAMETROS[dv.id];
        return d !== undefined && temLastroExterno(d.referencia);
      }).map((dv) => `  ${dv.id} — já tem referência externa; remova de DIVIDA_DECLARADA.`);

      if (obsoletas.length > 0) {
        expect.fail(
          "Dívida obsoleta em DIVIDA_DECLARADA (a correção foi feita, a dívida ficou):\n" +
            obsoletas.join("\n")
        );
      }
      expect(obsoletas).toHaveLength(0);
    });

    it("entrada em dívida que não existe mais no registro deve ser REMOVIDA", () => {
      const fantasmas = DIVIDA_DECLARADA.filter(
        (dv) => DECISOES[dv.id] === undefined && PARAMETROS[dv.id] === undefined
      ).map((dv) => `  ${dv.id} — não existe em DECISOES nem em PARAMETROS.`);

      expect(fantasmas).toHaveLength(0);
    });

    it("toda dívida declara motivo substantivo", () => {
      for (const dv of DIVIDA_DECLARADA) {
        expect(dv.motivo.trim().length).toBeGreaterThan(40);
      }
    });

    /**
     * Guarda da categoria "operacional" (norma, R-L4, definição estreita ratificada
     * em 20/10/2026). Dos tres testes que a definem, o terceiro — existir instrumento
     * nao cientifico que fixe o valor — e o unico mecanico, e e a guarda contra o
     * abuso: sem ele, "isso e operacional" vira desculpa para qualquer numero sem
     * fonte, e a norma morre pela porta que ela mesma abriu.
     */
    it("dívida que se declara operacional ou contratual tem de NOMEAR o instrumento", () => {
      const invocaCategoria = /\b(operacional|contratual)\b/i;
      const nomeiaInstrumento =
        /\b(plan id|contrato|contract|licen[çc]a|license|termo|norma\s+\w+|ISO\s*\d|ABNT|NBR|spec\w*\s*v?\d|vers[ãa]o\s*\d|\bID\s*\d{3,})/i;

      const semInstrumento = DIVIDA_DECLARADA.filter(
        (dv) => invocaCategoria.test(dv.motivo) && !nomeiaInstrumento.test(dv.motivo)
      ).map(
        (dv) =>
          `  ${dv.id} — invoca natureza operacional/contratual sem nomear o instrumento que fixa o valor.`
      );

      if (semInstrumento.length > 0) {
        expect.fail(
          "Categoria 'operacional' invocada sem instrumento (Norma de Lastro Científico, R-L4, teste 3):\n" +
            semInstrumento.join("\n") +
            "\n\nOperacional exige contrato, licença, especificação técnica, norma legal ou " +
            "ficha de equipamento, citado nominalmente. Sem instrumento, a decisão é dívida " +
            "comum — não operacional."
        );
      }
      expect(semInstrumento).toHaveLength(0);
    });
  });
});
