import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  CATALOGO_METODOLOGICO,
  PASSOS_TOUR_APRESENTACAO,
  obterItemMetodologico,
  type ItemMetodologico,
} from "./tourMetodologico";
import { DECISOES, PARAMETROS } from "./decisoes";
import { obterComparativoDesenhoD16 } from "@/lib/gee/seloPublicoD16";

export const TERMOS_PROIBIDOS_TOUR = [
  "D01 a D19",
  "Classe 1",
  "Classe 0",
  "fator_ls",
  "rotulo_classe",
] as const;

export function extrairViolacoesTermosProibidos(item: ItemMetodologico): string[] {
  const serializado = JSON.stringify(item);
  return TERMOS_PROIBIDOS_TOUR.filter((termo) => serializado.includes(termo));
}

describe("Catálogo do Modo de Apresentação e Tour Metodológico", () => {
  it("deve conter todos os passos listados na tour ordenada", () => {
    expect(PASSOS_TOUR_APRESENTACAO.length).toBeGreaterThanOrEqual(15);

    for (const passoId of PASSOS_TOUR_APRESENTACAO) {
      const item = obterItemMetodologico(passoId);
      expect(item, `Passo '${passoId}' não encontrado no catálogo`).toBeDefined();
      expect(item?.id).toBe(passoId);
    }
  });

  it("cada item do catálogo deve conter todos os blocos científicos canônicos", () => {
    for (const [id, item] of Object.entries(CATALOGO_METODOLOGICO)) {
      expect(item.id).toBe(id);
      expect(item.titulo).toBeTruthy();
      expect(item.modulo).toBeTruthy();
      expect(item.oQueFaz).toBeTruthy();
      expect(item.comoUsar).toBeTruthy();
      expect(item.comoFunciona).toBeTruthy();

      // Bloco do Cálculo Canônico
      expect(item.calculo).toBeDefined();
      expect(item.calculo.nome).toBeTruthy();
      expect(item.calculo.formulaTex).toBeTruthy();
      expect(item.calculo.formulaDescritiva).toBeTruthy();
      expect(item.calculo.variaveis.length).toBeGreaterThan(0);

      // Bloco do Script Executado
      expect(item.script).toBeDefined();
      expect(item.script.codigo).toBeTruthy();
      expect(item.script.linguagem).toMatch(/^(typescript|python-gee|sql)$/);

      // Referência Bibliográfica
      expect(item.referencia).toBeTruthy();
    }
  });

  it("trava 1: nenhum passo contém as cadeias 'D01 a D19', 'Classe 1', 'Classe 0', 'fator_ls' ou 'rotulo_classe'", () => {
    for (const [id, item] of Object.entries(CATALOGO_METODOLOGICO)) {
      const violacoes = extrairViolacoesTermosProibidos(item);
      expect(
        violacoes,
        `Passo '${id}' viola a trava contendo termos desautorizados: ${violacoes.join(", ")}`
      ).toEqual([]);
    }
  });

  it("trava 2: nenhum passo apresenta coluna de PROIBIDOS_COMO_PREDITOR como preditor da matriz (lido do avaliador D25)", () => {
    const caminhoScriptD25 = path.resolve(__dirname, "../../scripts/d25/avaliacao_d25_referencia.py");
    const conteudoD25 = fs.readFileSync(caminhoScriptD25, "utf-8");
    const matchProibidos = conteudoD25.match(/PROIBIDOS_COMO_PREDITOR\s*=\s*\{([^}]+)\}/);
    expect(
      matchProibidos,
      "Definição de PROIBIDOS_COMO_PREDITOR deve existir em scripts/d25/avaliacao_d25_referencia.py"
    ).toBeTruthy();

    const proibidosExtraidos = matchProibidos![1]
      .split(",")
      .map((s) => s.replace(/['"\s]/g, ""))
      .filter(Boolean);
    expect(proibidosExtraidos.length).toBeGreaterThan(0);

    const passoMatriz = CATALOGO_METODOLOGICO["matriz-treino"];
    expect(passoMatriz).toBeDefined();

    for (const colunaProibida of proibidosExtraidos) {
      // Verifica que a coluna proibida não é retornada como campo/chave no objeto preditor
      const regexChaveExata = new RegExp(`\\b${colunaProibida}\\s*:`, "i");
      expect(
        regexChaveExata.test(passoMatriz.script.codigo),
        `Coluna proibida '${colunaProibida}' encontrada como chave de preditor no código de matriz-treino`
      ).toBe(false);

      // Checa aliases comuns proibidos
      if (colunaProibida === "RUSLE_Fator_C") {
        expect(passoMatriz.script.codigo).not.toMatch(/\bfator_c\s*:/i);
      }
      if (colunaProibida === "RUSLE_Fator_P") {
        expect(passoMatriz.script.codigo).not.toMatch(/\bfator_p\s*:/i);
      }
    }
  });

  it("trava 3: a contagem de decisões e parâmetros citada no tour bate dinamicamente com DECISOES e PARAMETROS", () => {
    const totalDecisoes = Object.keys(DECISOES).length;
    const totalParametros = Object.keys(PARAMETROS).length;
    const chavesDecisoes = Object.keys(DECISOES).sort();
    const faixaEsperada = `${chavesDecisoes[0]} a ${chavesDecisoes[chavesDecisoes.length - 1]}`;

    const passoDecisoes = CATALOGO_METODOLOGICO["decisoes-metodologicas"];
    expect(passoDecisoes).toBeDefined();

    expect(passoDecisoes.titulo).toContain(faixaEsperada);
    expect(passoDecisoes.oQueFaz).toContain(`${totalDecisoes} decisões metodológicas`);
    expect(passoDecisoes.oQueFaz).toContain(`${totalParametros} parâmetros operacionais`);
  });

  it("trava 4: os números de desenho citados no tour batem com o leitor do selo público", () => {
    const comparativo = obterComparativoDesenhoD16();
    expect(comparativo.realizado.disponivel).toBe(true);

    if (comparativo.realizado.disponivel) {
      const passoDesenho = CATALOGO_METODOLOGICO["sorteio-d16-realizado"];
      expect(passoDesenho).toBeDefined();

      const { totalPoligonosSorteados, totalTreino, totalHeldOut, areaTotalHectares } =
        comparativo.realizado;
      const { totalPoligonos, areaTotalArredondadaHa } = comparativo.nominal;

      expect(passoDesenho.oQueFaz).toContain(`${totalPoligonos} polígonos`);
      expect(passoDesenho.oQueFaz).toContain(`~${areaTotalArredondadaHa} ha`);

      expect(passoDesenho.oQueFaz).toContain(`${totalPoligonosSorteados} polígonos`);
      expect(passoDesenho.oQueFaz).toContain(`${totalTreino} treino`);
      expect(passoDesenho.oQueFaz).toContain(`${totalHeldOut} held-out`);
      expect(passoDesenho.oQueFaz).toContain(areaTotalHectares.toFixed(2).replace(".", ","));

      // Menção formal ao estrato vazio e censo
      expect(passoDesenho.comoFunciona).toContain("E_1_3_2");
      expect(passoDesenho.comoFunciona).toContain("censo");
    }
  });

  it("trava 5 (meta-teste): injeta um passo sintético violando as travas e prova que a trava acusa", () => {
    for (const termo of TERMOS_PROIBIDOS_TOUR) {
      const passoViolador: ItemMetodologico = {
        ...CATALOGO_METODOLOGICO["aoi-selector"],
        id: "passo-sintetico-violador",
        titulo: `Passo violador contendo ${termo}`,
      };

      const violacoes = extrairViolacoesTermosProibidos(passoViolador);
      expect(
        violacoes,
        `A trava deve acusar a violação sintética do termo '${termo}'`
      ).toContain(termo);
    }
  });
});
