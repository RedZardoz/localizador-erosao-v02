import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
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

/**
 * ============================================================================
 * L-05 / N-13 — Lastro citado, porém NÃO conferido no primário (R-L2 e R-L3)
 * ============================================================================
 *
 * POR QUE ESTA SEGUNDA CATEGORIA EXISTE. `DIVIDA_DECLARADA` cobre a decisão SEM
 * citação. Ela não consegue — por desenho — expressar o caso oposto e mais
 * perigoso: a decisão COM citação cuja fonte não foi conferida, ou que não
 * sustenta exatamente a afirmação que lastreia. Pior: o teste "dívida que já
 * recebeu lastro externo deve ser REMOVIDA" PROÍBE registrar essas entradas em
 * `DIVIDA_DECLARADA`, justamente porque elas têm marcador bibliográfico.
 *
 * O resultado era uma lacuna: a seção "Três das sete são baratas" da Norma
 * orienta quitar dívidas por CRUZAMENTO com fontes que o registro já possui, e
 * as três quitações assim feitas passaram a trava sem que ninguém verificasse se
 * a fonte sustenta a frase. A R-L3 adverte exatamente contra isso: "esticar
 * citação verdadeira é a forma mais comum de corrompê-la".
 *
 * REGRA DE PREENCHIMENTO. Cada entrada nomeia a obra, a AFIRMAÇÃO EXATA que
 * precisa de lastro, e o que falta. A entrada sai da lista quando a obra for
 * arquivada em `docs/verificacoes/fontes/<idAcervo>/` e a conferência declarar o
 * que a fonte sustenta e o que não sustenta.
 */
interface LastroNaoConferido {
  id: string;
  obra: string;
  /** A frase exata que a citação precisa sustentar. Sem isso, não há o que conferir. */
  afirmacao: string;
  pendencia: string;
  /** Pasta esperada em docs/verificacoes/fontes/. A ausência dela é o que mantém a entrada viva. */
  idAcervo: string;
}

const LASTRO_NAO_CONFERIDO: readonly LastroNaoConferido[] = [
  {
    id: "P05",
    obra: "Zanaga, D. et al. (2022), ESA WorldCover",
    afirmacao: "as classes 30 e 40 do produto WorldCover usadas como filtro de elegibilidade",
    pendencia:
      "Cruzamento plausível, porque as classes são definidas pelo próprio produto, mas a citação " +
      "parece desalinhada da versão em uso: o código lê `classeWorldCover2020` e " +
      "`classeWorldCover2021`, e a citação de 2022 corresponde ao produto v200 (ano 2021), enquanto " +
      "o v100 (ano 2020) tem registro próprio, atribuído a Tsendbazar et al. Se as duas épocas são " +
      "usadas, são necessárias as duas citações. A conferir no primário, com o manual do produto.",
    idAcervo: "zanaga2022",
  },
  {
    id: "P02",
    obra: "Roberts, D. R. et al. (2017), Ecography 40(8):913-929",
    afirmacao: "o piso de espaçamento de 1.000 m no thinning espacial de candidatos",
    pendencia:
      "A obra trata de ESTRATÉGIAS DE VALIDAÇÃO CRUZADA para dados com estrutura espacial, " +
      "temporal, hierárquica ou filogenética, e conclui que validação por blocos supera a aleatória. " +
      "Não prescreve distância de 1 km para SELEÇÃO de candidatos: são problemas distintos, e a " +
      "distância de bloco de uma validação não é o espaçamento amostral de um sorteio. " +
      "BLOQUEANTE PARA O GATE G-01: pela tabela de ocupação de 31/10/2026, o thinning de 1 km " +
      "converte E_1_2_2 de 4 candidatos (viável) em 3 (inviável) e remove a única reserva de " +
      "E_1_3_2 (5 para 4). Sem ele haveria 3 estratos inviáveis, não 4. Um parâmetro que remove um " +
      "estrato do desenho não pode repousar em citação não conferida.",
    idAcervo: "roberts2017",
  },
];

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

  /**
   * L-05 / N-13 — R-L2 e R-L3: a citação existe, a conferência não.
   *
   * Esta trava cobre a lacuna que permitiu as três quitações por cruzamento passarem:
   * `temLastroExterno` é, por desenho declarado, permissivo — reconhece a PRESENÇA de
   * marcador bibliográfico e não julga a qualidade da fonte. Isso está correto no seu
   * escopo, e não deve ser alterado. O que faltava era a categoria que registra
   * "citado, não conferido".
   */
  describe("R-L2 / R-L3 — lastro citado mas não conferido no primário", () => {
    const DIR_FONTES = path.resolve(process.cwd(), "docs/verificacoes/fontes");

    /**
     * Pasta vazia NAO e acervo. Um diretorio criado por tentativa de download frustrada nao
     * constitui fonte arquivada: a R-L3 exige o arquivo depositado.
     */
    function obraArquivada(idAcervo: string): boolean {
      const dir = path.join(DIR_FONTES, idAcervo);
      if (!fs.existsSync(dir)) return false;
      try {
        return fs.readdirSync(dir).some((f) => !f.startsWith("."));
      } catch {
        return false;
      }
    }

    it("toda entrada nomeia obra, afirmação exata e pendência substantivas", () => {
      for (const e of LASTRO_NAO_CONFERIDO) {
        expect(e.obra.trim().length, `${e.id}: obra`).toBeGreaterThan(10);
        expect(e.afirmacao.trim().length, `${e.id}: afirmação`).toBeGreaterThan(20);
        expect(e.pendencia.trim().length, `${e.id}: pendência`).toBeGreaterThan(80);
        expect(e.idAcervo.trim().length, `${e.id}: idAcervo`).toBeGreaterThan(3);
      }
    });

    it("a entrada aponta para decisão ou parâmetro que existe no registro", () => {
      const fantasmas = LASTRO_NAO_CONFERIDO.filter(
        (e) => DECISOES[e.id] === undefined && PARAMETROS[e.id] === undefined
      ).map((e) => `  ${e.id} — não existe em DECISOES nem em PARAMETROS.`);
      expect(fantasmas).toHaveLength(0);
    });

    it("as duas categorias são disjuntas: sem citação versus citação não conferida", () => {
      const emDivida = new Set(DIVIDA_DECLARADA.map((d) => d.id));
      const duplicadas = LASTRO_NAO_CONFERIDO.filter((e) => emDivida.has(e.id)).map(
        (e) =>
          `  ${e.id} — está em DIVIDA_DECLARADA (sem citação) e em LASTRO_NAO_CONFERIDO (citada, não conferida). Escolha uma.`
      );
      if (duplicadas.length > 0) {
        expect.fail("Entrada em duas categorias de lastro:\n" + duplicadas.join("\n"));
      }
      expect(duplicadas).toHaveLength(0);
    });

    /**
     * Autodenúncia, no mesmo espírito de "a dívida declarada não apodrece": quando a obra
     * finalmente for arquivada, esta entrada tem de ser revista — ou a conferência passa a
     * existir e ela sai, ou o veredito é que a fonte não sustenta e a decisão muda.
     */
    it("entrada cuja obra JÁ foi arquivada no acervo deve ser revista e removida", () => {
      const arquivadas = LASTRO_NAO_CONFERIDO.filter((e) => obraArquivada(e.idAcervo)).map(
        (e) =>
          `  ${e.id} — docs/verificacoes/fontes/${e.idAcervo}/ já existe: conclua a conferência, declare o que a fonte NÃO sustenta e remova esta entrada.`
      );
      if (arquivadas.length > 0) {
        expect.fail(
          "Lastro já arquivado e ainda listado como não conferido:\n" + arquivadas.join("\n")
        );
      }
      expect(arquivadas).toHaveLength(0);
    });

    it("as três quitações por cruzamento de 20/10/2026 continuam declaradas enquanto não conferidas", () => {
      // A seção "Três das sete são baratas" da Norma orientou quitar D02, P05 e P02 por
      // cruzamento. Nenhuma das três obras está no acervo; nenhuma pode contar como conferida.
      const acervosCruzamento: Record<string, string> = {
        D02: "rikimaru2002",
        P05: "zanaga2022",
        P02: "roberts2017",
      };
      const ids = new Set(LASTRO_NAO_CONFERIDO.map((e) => e.id));
      for (const [id, acervo] of Object.entries(acervosCruzamento)) {
        if (!obraArquivada(acervo)) {
          expect(ids.has(id), `${id} foi quitado por cruzamento e sua obra não está arquivada`).toBe(
            true
          );
        }
      }
    });
  });
});
