import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  calcularEtapasFluxo,
  ContextoFluxo,
  EtapaFluxo,
} from "./BarraFluxoOperacional";
import { CATALOGO_METODOLOGICO } from "@/config/tourMetodologico";
import { obterComparativoDesenhoD16, ResultadoDesenhoRealizadoD16 } from "@/lib/gee/seloPublicoD16";
import type { ModalType } from "@/types/ui";

/**
 * Coleta recursivamente todos os identificadores de data-metodologia presentes
 * nos arquivos fonte de componentes e páginas (src/components e src/app).
 */
export function coletarAncorasMetodologia(diretorios: string[]): Set<string> {
  const ancoras = new Set<string>();

  function varrerDiretorio(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entradas = fs.readdirSync(dir, { withFileTypes: true });

    for (const entrada of entradas) {
      const fullPath = path.join(dir, entrada.name);
      if (entrada.isDirectory()) {
        varrerDiretorio(fullPath);
      } else if (
        (entrada.name.endsWith(".tsx") || entrada.name.endsWith(".ts")) &&
        !entrada.name.includes(".test.")
      ) {
        const conteudo = fs.readFileSync(fullPath, "utf-8");
        // Captura data-metodologia="identificador"
        const regexAttr = /data-metodologia=["']([^"']+)["']/g;
        let match: RegExpExecArray | null;
        while ((match = regexAttr.exec(conteudo)) !== null) {
          ancoras.add(match[1]);
        }
        // Captura dataMetodologia: "identificador" (em objetos de configuração / JSX dinâmico)
        const regexProp = /dataMetodologia:\s*["']([^"']+)["']/g;
        while ((match = regexProp.exec(conteudo)) !== null) {
          ancoras.add(match[1]);
        }
      }
    }
  }

  for (const dir of diretorios) {
    varrerDiretorio(dir);
  }

  return ancoras;
}

/**
 * Valida se todos os seletoresAlvo de um catálogo resolvem para âncoras existentes.
 */
export function validarSeletoresTourContraAncoras(
  catalogo: Record<string, { seletorAlvo: string }>,
  ancorasExistentes: Set<string>
): { valido: boolean; ausentes: { id: string; seletor: string; ancora: string }[] } {
  const ausentes: { id: string; seletor: string; ancora: string }[] = [];

  for (const [id, item] of Object.entries(catalogo)) {
    const match = item.seletorAlvo.match(/\[data-metodologia=["']([^"']+)["']\]/);
    if (match) {
      const ancoraEsperada = match[1];
      if (!ancorasExistentes.has(ancoraEsperada)) {
        ausentes.push({ id, seletor: item.seletorAlvo, ancora: ancoraEsperada });
      }
    }
  }

  return { valido: ausentes.length === 0, ausentes };
}

describe("BarraFluxoOperacional e Travas da Interface (Prompt P)", () => {
  const comparativo = obterComparativoDesenhoD16();

  const mockContextoPadrao: ContextoFluxo = {
    areas: [
      {
        id: "bp3",
        nome: "Bacia Paraná 3",
        tipo: "bacia",
        geometry: { type: "Polygon", coordinates: [] },
        ativa: true,
      },
    ],
    pontos: [],
    rotulosConsolidados: {},
    realizado: comparativo.realizado,
  };

  it("trava 1: toda etapa da casca tem número ordenado (1 a 8), rótulo, estado válido e motivo em texto", () => {
    const etapas = calcularEtapasFluxo(mockContextoPadrao);
    expect(etapas.length).toBe(8);

    const estadosValidos = new Set([
      "concluida",
      "disponivel",
      "bloqueada",
      "nao_implementada",
      "desconhecido",
    ]);

    etapas.forEach((etapa, idx) => {
      expect(etapa.numero).toBe(idx + 1);
      expect(etapa.rotulo.length).toBeGreaterThan(0);
      expect(estadosValidos.has(etapa.estado)).toBe(true);
      expect(etapa.motivo.length).toBeGreaterThan(5);

      // Quando bloqueada ou não implementada, o motivo deve ser explícito
      if (etapa.estado === "bloqueada" || etapa.estado === "nao_implementada") {
        expect(etapa.motivo).toMatch(/(Bloqueada:|Não implementada:)/);
      }
    });

    // Etapa 5 especificamente é declarada não implementada com motivo transparente
    const etapa5 = etapas.find((e) => e.numero === 5);
    expect(etapa5).toBeDefined();
    expect(etapa5?.estado).toBe("nao_implementada");
    expect(etapa5?.clicavel).toBe(false);
    expect(etapa5?.motivo).toContain("planoVooNControl.ts");
  });

  it("trava 2: nenhum número de desenho literal em contexto metodológico existe na casca de fluxo (G08)", () => {
    const caminhoCasca = path.resolve(__dirname, "BarraFluxoOperacional.tsx");
    const conteudo = fs.readFileSync(caminhoCasca, "utf-8");
    const linhas = conteudo.split(/\r?\n/);

    const regexNumeros = /\b(72|36|18|361|360|67|34|33|336)\b/;
    const regexContexto = /\b(pol[íi]gonos?|estratos?|hectares?|ha|treino|held-?out)\b/i;

    linhas.forEach((linha, idx) => {
      // Ignora linhas de comentários informativos de docstring
      if (linha.trim().startsWith("*") || linha.trim().startsWith("//")) return;

      const temNum = regexNumeros.test(linha);
      const temCtx = regexContexto.test(linha);
      expect(
        temNum && temCtx,
        `Linha ${idx + 1} de BarraFluxoOperacional.tsx contém número literal de desenho: "${linha.trim()}"`
      ).toBe(false);
    });
  });

  it("trava 3: todo seletorAlvo do tour metodológico resolve para atributo data-metodologia existente", () => {
    const dirComponents = path.resolve(process.cwd(), "src/components");
    const dirApp = path.resolve(process.cwd(), "src/app");
    const ancorasExistentes = coletarAncorasMetodologia([dirComponents, dirApp]);

    const resultado = validarSeletoresTourContraAncoras(CATALOGO_METODOLOGICO, ancorasExistentes);

    expect(
      resultado.ausentes,
      `Existem ${resultado.ausentes.length} seletoresAlvo do tour sem âncora correspondente no código: ${JSON.stringify(
        resultado.ausentes,
        null,
        2
      )}`
    ).toEqual([]);
    expect(resultado.valido).toBe(true);
  });

  it("trava 3 (meta-teste): prova que a validação de seletores acusa âncora inexistente sintética", () => {
    const dirComponents = path.resolve(process.cwd(), "src/components");
    const dirApp = path.resolve(process.cwd(), "src/app");
    const ancorasExistentes = coletarAncorasMetodologia([dirComponents, dirApp]);

    const catalogoSinteticoViolador = {
      ...CATALOGO_METODOLOGICO,
      "passo-fantasma": {
        seletorAlvo: '[data-metodologia="ancora-fantasma-inexistente-123"]',
      },
    };

    const resultado = validarSeletoresTourContraAncoras(
      catalogoSinteticoViolador,
      ancorasExistentes
    );
    expect(resultado.valido).toBe(false);
    expect(resultado.ausentes).toHaveLength(1);
    expect(resultado.ausentes[0].ancora).toBe("ancora-fantasma-inexistente-123");
  });

  it("trava 4: cada ModalType invocado pela casca existe no tipo e tem modal montado em page.tsx", () => {
    const etapas = calcularEtapasFluxo(mockContextoPadrao);
    const modaisInvocados = etapas
      .map((e) => e.modalAlvo)
      .filter((m): m is Exclude<ModalType, null> => m !== null);

    expect(modaisInvocados).toContain("region");
    expect(modaisInvocados).toContain("candidates");
    expect(modaisInvocados).toContain("medicao");
    expect(modaisInvocados).toContain("sorteio");
    expect(modaisInvocados).toContain("campanha");
    expect(modaisInvocados).toContain("matriz");
    expect(modaisInvocados).toContain("audit-dossier");

    const caminhoPage = path.resolve(process.cwd(), "src/app/page.tsx");
    const conteudoPage = fs.readFileSync(caminhoPage, "utf-8");

    // Verifica montagem de cada componente modal correspondente
    const mapaModalComponente: Record<string, string> = {
      region: "RegionRequestModal",
      candidates: "CandidateSelectionModal",
      medicao: "PainelMedicaoModal",
      sorteio: "PainelSorteioModal",
      campanha: "PainelCampanhaModal",
      matriz: "PainelMatrizModal",
      "audit-dossier": "AuditDossierModal",
    };

    for (const [modal, comp] of Object.entries(mapaModalComponente)) {
      expect(
        conteudoPage.includes(`<${comp}`),
        `page.tsx deve montar o componente <${comp} /> para o modal '${modal}'`
      ).toBe(true);
    }
  });

  it("trava 5: com selo público indisponível ou ausente, a casca exibe estado declarado e não quebra", () => {
    const seloIndisponivel: ResultadoDesenhoRealizadoD16 = {
      disponivel: false,
      motivo: "Selo público de sorteio D16 indisponível, ausente ou corrompido.",
      totalPoligonosSorteados: null,
      totalTreino: null,
      totalHeldOut: null,
      areaTotalHectares: null,
      totalEstratos: null,
      estratosCenso: null,
      estratosVazios: null,
      limiaresS: null,
      limiaresE: null,
      estratos: null,
      contagemCandidatosPorEstrato: null,
      hashIntegridade: null,
      sha256ConjuntoCandidatos: null,
      sha256SeloCompleto: null,
      semente: null,
      geradoEm: null,
      gitCommit: null,
      versaoEsquema: null,
      invariantesVerificados: null,
      motivoDeficit: null,
      motivoEstratoVazio: null,
      rotuloCurto: "Desenho realizado indisponível",
      rotuloCompleto: "Desenho amostral realizado indisponível (selo público não carregado)",
    };

    const ctxSemSelo: ContextoFluxo = {
      ...mockContextoPadrao,
      realizado: seloIndisponivel,
    };

    // A função não deve lançar exceção
    expect(() => calcularEtapasFluxo(ctxSemSelo)).not.toThrow();

    const etapas = calcularEtapasFluxo(ctxSemSelo);
    expect(etapas).toHaveLength(8);

    const etapaSorteio = etapas.find((e) => e.numero === 4);
    expect(etapaSorteio?.estado).toBe("bloqueada");
    expect(etapaSorteio?.motivo).toContain("indisponível");

    const etapaMedicao = etapas.find((e) => e.numero === 3);
    expect(etapaMedicao?.estado).toBe("bloqueada");
  });
});
