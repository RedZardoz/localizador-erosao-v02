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
    id: "D03",
    motivo:
      "Escala ordinal de rótulo e binarização em 'incipiente'. Busca por literatura internacional " +
      "de classificação visual e scoring de erosão (Morgan 2005; Boardman 2006; Herweg 1996) " +
      "confirmou que não há limiar universal que imponha corte entre ausente/incipiente ou " +
      "incipiente/moderada; a escolha é convenção pré-registrada do projeto de pesquisa para capturar sinal precoce.",
  },
  {
    id: "D11",
    motivo:
      "Mínimo de 6 observações orbitais válidas para densidade geral da série temporal. Busca por " +
      "literatura de sensoriamento remoto (Griffiths et al. 2013; Jonsson & Eklundh 2002) não encontrou " +
      "padrão unificado para stacking em clima tropical. O piso estatístico estrito de n >= 9 para caudas " +
      "foi adotado via DP-24 (Hyndman & Fan 1996), permanecendo n >= 6 como piso empírico de cobertura geral.",
  },
  {
    id: "D18",
    motivo:
      "Buffer de 250 m (caixa envolvente de 500 m / 25 ha) para recortes PlanetScope. Busca por literatura " +
      "geomorfológica de encostas e catenas agrícolas (Gerrard 1981; Conacher & Dalrymple 1977) " +
      "demonstrou que 250 m é dimensão operacional ajustada ao comprimento médio de vertente da BP3 e " +
      "ao teto de cota do instrumento contratual Plan ID 798565, sem prescrição bibliográfica universal.",
  },
  {
    id: "P07",
    motivo:
      "Semente aleatória 'dinamica-registrada'. Busca por normas de computação científica reprodutível " +
      "(Peng 2011; Sandve et al. 2013). A persistência dinâmica do seed em cada execução é protocolo " +
      "algorítmico de reprodutibilidade computacional, não constante matemática universal.",
  },
  {
    id: "D17",
    motivo:
      "Decisão de natureza CONTRATUAL/OPERACIONAL, não científica: alocação e gestão da cota comercial " +
      "do Planet Labs Education & Research Program, Plan ID 798565 (3.000 km²/mês). O instrumento contratual " +
      "é a referência legítima, conforme conferido e documentado em 20/10/2026.",
  },
];

/**
 * Dívidas de propostas e pendentes (C2/C3): parâmetros ainda não promovidos a decididos
 * ou de natureza operacional/heurística sem norma bibliográfica externa prescritiva.
 */
const DIVIDA_PROPOSTAS: readonly DividaLastro[] = [
  {
    id: "P06",
    motivo:
      "Fração limpa mínima UDM2 na AOI do ponto. Parâmetro pendente de definição experimental " +
      "conforme qualidade do produto PlanetScope UDM2 na bacia.",
  },
  {
    id: "P08",
    motivo:
      "Limiar de alerta visual de baixa variância na interface de usuário. Heurística operacional " +
      "informativa para diagnóstico rápido no Inspetor do pesquisador.",
  },
  {
    id: "P09",
    motivo:
      "Método de máscara de nuvens Sentinel-2 (QA60 / SCL). Procedimento operacional derivado " +
      "das bandas de qualidade da ESA (Sentinel-2 Technical Guide).",
  },
  {
    id: "P11",
    motivo:
      "Fração mínima de área coberta da célula de 10 m (0,95). Limiar operacional contra efeito de " +
      "borda de cena orbital derivado do planejamento analítico (DEC-7, D11).",
  },
  {
    id: "P20",
    motivo:
      "Tolerância temporal Sentinel-2 de 30 dias para composição espectro-temporal. Parâmetro " +
      "operacional de janela móvel para mosaico sem nuvens (DEC-7, D04).",
  },
  {
    id: "P21",
    motivo:
      "Tolerância temporal PlanetScope de 45 dias para pares de evento erosivo. Parâmetro operacional " +
      "de busca retrospectiva de imagem de alta resolução (DEC-7, D19).",
  },
  {
    id: "P23",
    motivo:
      "Área mínima sem nuvem/sombra na célula (0,95). Limiar operacional de pureza radiométrica " +
      "derivado do protocolo de pré-processamento (DEC-7, D11).",
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

function entradasPropostasEPendentes(): Decisao<unknown>[] {
  return [...Object.values(DECISOES), ...Object.values(PARAMETROS)].filter(
    (d) => d.estado === "proposta" || d.estado === "pendente"
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

  describe("C2 e C3 — Guarda de propostas e parâmetros provisórios", () => {
    it("propostas e pendentes têm lastro externo ou dívida formal declarada em DIVIDA_PROPOSTAS", () => {
      const emDivida = new Set(DIVIDA_PROPOSTAS.map((d) => d.id));
      const violacoes = entradasPropostasEPendentes()
        .filter((d) => !temLastroExterno(d.referencia) && !emDivida.has(d.id))
        .map((d) => `  ${d.id} — "${d.titulo}": proposta/pendente sem lastro e sem dívida declarada.`);

      if (violacoes.length > 0) {
        expect.fail(
          "Proposta ou pendência sem lastro bibliográfico e sem dívida formal (R-L1 / C2 / C3):\n" +
            violacoes.join("\n")
        );
      }
      expect(violacoes).toHaveLength(0);
    });

    it("parâmetro em proposta citado como método publicado deve carregar marcação explícita de provisoriedade", () => {
      // Parâmetros em proposta como P01 (aresta do bloco a ≈ 50 m) têm dependência na metodologia publicada
      const propostasPublicadas = ["P01"];
      for (const id of propostasPublicadas) {
        const param = PARAMETROS[id];
        expect(param).toBeDefined();
        const texto = `${param.justificativa ?? ""} ${param.referencia ?? ""}`.toLowerCase();
        const temMarcacaoProvisoria = texto.includes("provisór") || texto.includes("planejamento");
        expect(
          temMarcacaoProvisoria,
          `Parâmetro publicado ${id} em estado proposta deve declarar provisoriedade explicitamente.`
        ).toBe(true);
      }
    });

    it("toda dívida de proposta declara justificativa substantiva (>= 40 caracteres)", () => {
      for (const dv of DIVIDA_PROPOSTAS) {
        expect(dv.motivo.trim().length).toBeGreaterThan(40);
      }
    });
  });
});
