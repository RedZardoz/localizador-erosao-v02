/**
 * ============================================================================
 * Portão de Paridade entre Artefatos e Fontes Canônicas (Fase 1 / Auditoria 2026-10-31)
 * SAREL v2.0 — Disciplina Pericial e Integridade Epistemológica (Regras 1, 4 e 5)
 * ============================================================================
 *
 * O QUE FAZ:
 * Compara as grandezas publicadas e citações bibliográficas entre a fonte canônica
 * no código (src/config/decisoes.ts, data/PARAMETROS_DEFLACAO.json, data/MANIFESTO_FUNDIARIO.json)
 * e todos os seus consumidores documentais (scripts/gerar_*.py, scripts/gerar_*.mjs,
 * scripts/gerar_*.ts, docs/planejamento/DECISOES.md, README.md).
 *
 * RELAÇÃO COM deflacao.test.ts:
 * - deflacao.test.ts: guarda especializada da família de deflação espacial (fórmulas,
 *   suportes e literais históricos defasados 1.845, 1.836, 396, 936, 918).
 * - paridadeArtefatos.test.ts: portão geral de paridade multi-artefato cobrindo
 *   todas as grandezas com representação legível por máquina (D02, D10, D16, D24,
 *   PARAMETROS_DEFLACAO, MANIFESTO_FUNDIARIO) e citações canônicas de obras (Durigon,
 *   Waltrick, Zhu, Cochran, Kish) contra deriva em scripts geradores e documentos.
 *
 * REPROVAÇÃO FAIL-CLOSED:
 * Se qualquer consumidor apresentar valor divergente do canônico ou citação com
 * ano/periódico defasado, o teste falha compulsoriamente nomeando:
 *   - Arquivo do consumidor
 *   - Número da linha
 *   - Valor divergente encontrado
 *   - Valor esperado da fonte canônica
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { DECISOES, exigirParametro } from "./decisoes";

describe("Portão de Paridade entre Artefatos (Fase 1)", () => {
  // --------------------------------------------------------------------------
  // 1. Fontes Canônicas e Paridade Estrutural entre Configurações
  // --------------------------------------------------------------------------

  const caminhoDeflacaoJson = path.resolve(process.cwd(), "data/PARAMETROS_DEFLACAO.json");
  const paramsDeflacao = JSON.parse(fs.readFileSync(caminhoDeflacaoJson, "utf-8"));

  const caminhoManifestoJson = path.resolve(process.cwd(), "data/MANIFESTO_FUNDIARIO.json");
  const manifestoFundiario = JSON.parse(fs.readFileSync(caminhoManifestoJson, "utf-8"));

  it("G01 — Paridade DECISOES.D16.parametros <-> data/PARAMETROS_DEFLACAO.json", () => {
    const totalPoligonos = exigirParametro(DECISOES.D16, "totalPoligonos").valor;
    const areaPoligonoHa = exigirParametro(DECISOES.D16, "areaPoligonoHa").valor;
    const areaTotalHa = exigirParametro(DECISOES.D16, "areaTotalHa").valor;
    const poligonosHeldOut = exigirParametro(DECISOES.D16, "poligonosHeldOut").valor;
    const poligonosTreino = exigirParametro(DECISOES.D16, "poligonosTreino").valor;

    expect(totalPoligonos).toBe(72);
    expect(areaPoligonoHa).toBe(5.02);
    expect(areaTotalHa).toBe(361.44);
    expect(poligonosHeldOut).toBe(36);
    expect(poligonosTreino).toBe(36);

    expect(paramsDeflacao.totalPoligonos).toBe(totalPoligonos);
    expect(paramsDeflacao.areaPoligonoHa).toBe(areaPoligonoHa);
    expect(paramsDeflacao.areaTotalHa).toBe(areaTotalHa);
    expect(paramsDeflacao.poligonosHeldOut).toBe(poligonosHeldOut);
    expect(paramsDeflacao.areaHeldOutHa).toBe(180.72);
  });

  it("G02 — Paridade DECISOES.D24.parametros <-> data/PARAMETROS_DEFLACAO.json", () => {
    const tetoTotal = exigirParametro(DECISOES.D24, "tetoTotal").valor;
    const tetoEspectro = exigirParametro(DECISOES.D24, "tetoEspectroTemporal").valor;
    const tetoTerreno = exigirParametro(DECISOES.D24, "tetoTerreno").valor;
    const tetoSolo = exigirParametro(DECISOES.D24, "tetoSolo").valor;
    const tetoChuva = exigirParametro(DECISOES.D24, "tetoChuva").valor;
    const nEfEspectro = exigirParametro(DECISOES.D24, "unidadesEfetivasEspectroTemporal").valor;
    const nEfTerreno = exigirParametro(DECISOES.D24, "unidadesEfetivasTerreno").valor;
    const nEfHeldOutEspectro = exigirParametro(DECISOES.D24, "unidadesEfetivasHeldOut").valor;
    const nEfHeldOutTerreno = exigirParametro(DECISOES.D24, "unidadesEfetivasHeldOutTerreno").valor;

    expect(tetoTotal).toBe(14);
    expect(tetoEspectro).toBe(8);
    expect(tetoTerreno).toBe(4);
    expect(tetoSolo).toBe(1);
    expect(tetoChuva).toBe(1);
    expect(tetoEspectro + tetoTerreno + tetoSolo + tetoChuva).toBe(14);

    expect(nEfEspectro).toBe(1841);
    expect(nEfTerreno).toBe(460);
    expect(nEfHeldOutEspectro).toBe(920);
    expect(nEfHeldOutTerreno).toBe(230);

    expect(paramsDeflacao.tetoTotalMatriz).toBe(tetoTotal);
    expect(paramsDeflacao.espectroTemporal.tetoPreditores).toBe(tetoEspectro);
    expect(paramsDeflacao.terreno.tetoPreditores).toBe(tetoTerreno);
    expect(paramsDeflacao.solo.tetoPreditores).toBe(tetoSolo);
    expect(paramsDeflacao.chuva.tetoPreditores).toBe(tetoChuva);

    expect(paramsDeflacao.espectroTemporal.unidadesEfetivasTotal).toBe(nEfEspectro);
    expect(paramsDeflacao.terreno.unidadesEfetivasTotal).toBe(nEfTerreno);
    expect(paramsDeflacao.espectroTemporal.unidadesEfetivasHeldOut).toBe(nEfHeldOutEspectro);
    expect(paramsDeflacao.terreno.unidadesEfetivasHeldOut).toBe(nEfHeldOutTerreno);
  });

  it("G03 — Paridade DECISOES.D02.parametros e D10.parametros (Limiares Biofísicos)", () => {
    const bsiMin = exigirParametro(DECISOES.D02, "bsiMin").valor;
    const ndviMax = exigirParametro(DECISOES.D02, "ndviMax").valor;
    const bsiMax = exigirParametro(DECISOES.D02, "bsiMax").valor;
    const ndviMin = exigirParametro(DECISOES.D02, "ndviMin").valor;
    const ndviSoloNu = exigirParametro(DECISOES.D10, "ndviSoloNu").valor;

    expect(bsiMin).toBe(0.10);
    expect(ndviMax).toBe(0.40);
    expect(bsiMax).toBe(0.00);
    expect(ndviMin).toBe(0.65);
    expect(ndviSoloNu).toBe(0.25);
  });

  it("G04 — Paridade de Metadados do Banco Fundiário (data/MANIFESTO_FUNDIARIO.json)", () => {
    expect(manifestoFundiario.banco.totalPropriedades).toBe(559899);
    expect(manifestoFundiario.banco.tamanhoBytes).toBe(1793216512);
    expect(manifestoFundiario.banco.ufDominante).toBe("PR");
    expect(manifestoFundiario.banco.sha256Estado).toBe("indisponivel");
  });

  // --------------------------------------------------------------------------
  // 2. Paridade de Grandezas nos Scripts Geradores de Documentos
  // --------------------------------------------------------------------------

  const GERADORES_DOCUMENTOS = [
    "scripts/gerar_pdf_metodologia_integrada.py",
    "scripts/gerar_docx_metodologia_integrada.py",
    "scripts/gerar_pdf_especificacao_projeto.py",
    "scripts/gerar_pdf_mudanca_metodologica.py",
    "scripts/gerar_pptx_mudanca_metodologica.py",
  ];

  interface RegraParidadeConsumidor {
    descricao: string;
    regexDivergente: RegExp;
    valorEsperado: string;
    motivo: string;
  }

  const REGRAS_PARIDADE_GRANDEZAS: RegraParidadeConsumidor[] = [
    {
      descricao: "Total de polígonos VANT D16 (72 polígonos)",
      regexDivergente: /\b36\s+pol[íi]gonos\s+(?:de\s+VANT|sorteados|na\s+campanha)/i,
      valorEsperado: "72 polígonos",
      motivo: "D16 fixa 72 polígonos (4 por estrato em 18 estratos); 36 polígonos era o desenho pré-emenda",
    },
    {
      descricao: "Área nominal do polígono VANT D16 (5,02 ha)",
      regexDivergente: /(?<!proposta\s+|original\s+|desenho\s+)\b10(?:\.0|\,0)?\s*ha\s+(?:em\s+quadrado|por\s+pol[íi]gono|nominal)/i,
      valorEsperado: "5,02 ha",
      motivo: "D16 emendou o tamanho nominal de polígono para 5,02 ha (224x224 m) para elevar elegibilidade fundiária na BP3",
    },
    {
      descricao: "Área total da campanha VANT D16 (361,44 ha)",
      regexDivergente: /(?<!anterior\s+|pr[ée]-emenda\s+)\b360(?:\.0|\,0)?\s*ha\s+(?:total|de\s+mapeamento|da\s+campanha)/i,
      valorEsperado: "361,44 ha (ou 361 ha)",
      motivo: "D16 fixa área total em 361,44 ha (72 x 5,02 ha); 360 ha pertencia ao desenho anterior",
    },
    {
      descricao: "Unidades independentes vigentes no bloco espectro-temporal D24 (1.841)",
      regexDivergente: /(?:~\s*|\b)(?:1\.845|1\.836|1845|1836)\s+unidades/i,
      valorEsperado: "1.841 unidades",
      motivo: "D24 fixa 1.841 unidades efetivas para alcance de 50 m (histórico pré-emenda citava 1.845 e 1.836)",
    },
    {
      descricao: "Unidades independentes vigentes no bloco de terreno D24 (460)",
      regexDivergente: /(?:~\s*|\b)(?:396|936|918)\s+unidades/i,
      valorEsperado: "460 unidades",
      motivo: "D24 fixa 460 unidades efetivas para o bloco de terreno a 100 m",
    },
    {
      descricao: "Teto total global de preditores D24 (14 preditores)",
      regexDivergente: /\bteto\s+(?:m[áa]ximo\s+)?(?:global\s+)?de\s+(?:1[0-3]|1[5-9]|[2-9][0-9])\s+preditores/i,
      valorEsperado: "14 preditores",
      motivo: "D24 fixa teto máximo global estrito de 14 preditores (8 espectro + 4 terreno + 1 solo + 1 chuva)",
    },
    {
      descricao: "Total de propriedades no banco fundiário (559.899)",
      regexDivergente: /\b73\.?643\s+(?:im[óo]veis|propriedades)\s+no\s+banco\s+fundi[áa]rio/i,
      valorEsperado: "559.899 imóveis",
      motivo: "559.899 é o total de imóveis no banco fundiário nacional/PR; 73.643 é apenas o recorte da BP3",
    },
  ];

  it("G05 — Consumidores geradores de documentos respeitam grandezas canônicas", () => {
    for (const relPath of GERADORES_DOCUMENTOS) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (!fs.existsSync(fullPath)) continue;

      const lines = fs.readFileSync(fullPath, "utf-8").split(/\r?\n/);
      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const lineNum = idx + 1;

        // Se a linha expressamente contextualiza a proposta original/histórica sendo comparada, pula
        if (/proposta\s+original|desenho\s+anterior|hist[óo]rico\s+de\s+emenda|pr[ée]-emenda/i.test(line)) {
          continue;
        }

        for (const regra of REGRAS_PARIDADE_GRANDEZAS) {
          const match = regra.regexDivergente.exec(line);
          if (match) {
            expect.fail(
              `[PARIDADE] Divergência em ${relPath}:${lineNum}.\n` +
              `  Encontrado: '${match[0]}' na linha: "${line.trim()}"\n` +
              `  Esperado: '${regra.valorEsperado}'\n` +
              `  Motivo: ${regra.motivo}`
            );
          }
        }
      }
    }
  });

  // --------------------------------------------------------------------------
  // 3. Paridade de Citação Bibliográfica de Obras entre Registro e Geradores
  // --------------------------------------------------------------------------

  interface RegraParidadeCitacao {
    obra: string;
    decisaoCanonica: string;
    regexPeriódicoOuAnoDivergente: RegExp;
    esperado: string;
    motivo: string;
  }

  const REGRAS_CITACOES: RegraParidadeCitacao[] = [
    {
      obra: "Durigon (2014)",
      decisaoCanonica: "D01 e D20",
      regexPeriódicoOuAnoDivergente: /DURIGON[^,.;\n]*[,.;\n][^.\n]*(?:Revista Brasileira de Ciência do Solo|RBCS.*1814-1824|v\.\s*38,\s*n\.\s*6)/i,
      esperado: "Durigon et al. (2014), International Journal of Remote Sensing 35(2):441-453",
      motivo: "Durigon (2014) da fórmula do Fator C tropical é publicado no IJRS 35(2):441-453, e NÃO na RBCS 38(6):1814-1824",
    },
    {
      obra: "Waltrick (2015)",
      decisaoCanonica: "D13",
      regexPeriódicoOuAnoDivergente: /WALTRICK[^,.;\n]*[,.;\n][^.\n]*(?:Revista Brasileira de Recursos H[íi]dricos|RBRH|v\.\s*15,\s*n\.\s*3,\s*p\.\s*115-125)/i,
      esperado: "Waltrick et al. (2015), Revista Brasileira de Ciência do Solo 39(1):256-267",
      motivo: "Waltrick da erosividade no Paraná é RBCS 2015 v. 39 n. 1 (com conversão SI por Waltrick 2010 dissertação UFPR), e NÃO RBRH 2010",
    },
    {
      obra: "Zhu & Woodcock (2014)",
      decisaoCanonica: "D11",
      regexPeriódicoOuAnoDivergente: /ZHU,\s*Z\.;\s*WOODCOCK,\s*C\.\s*E\.[^.\n]*Remote Sensing of Environment[^.\n]*144[^.\n]*(?!.*(?:n[ãa]o\s+conferid[ao]|prim[áa]rio))/i,
      esperado: "Zhu & Woodcock (2014), RSE 144:152-171 com marcação [Nota: não conferida no primário]",
      motivo: "Zhu & Woodcock (2014) deve preservar marcação de não conferida no primário conforme D11",
    },
    {
      obra: "Cochran (1977)",
      decisaoCanonica: "D12",
      regexPeriódicoOuAnoDivergente: /Cochran\s*\((?!1977\b)\d{4}\)/i,
      esperado: "Cochran, W. G. (1977), Sampling Techniques, 3a ed.",
      motivo: "Ano canônico de Cochran é 1977 (Sampling Techniques, 3a ed.)",
    },
    {
      obra: "Kish (1965)",
      decisaoCanonica: "AUDITORIA_GARGALO_S1K2 / Saída 4",
      regexPeriódicoOuAnoDivergente: /Kish\s*\((?!1965\b)\d{4}\)/i,
      esperado: "Kish, L. (1965), Survey Sampling",
      motivo: "Ano canônico de Kish é 1965 (Survey Sampling)",
    },
  ];

  it("G06 — Citações de obras nos geradores de documentos respeitam forma canônica de decisoes.ts", () => {
    for (const relPath of GERADORES_DOCUMENTOS) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (!fs.existsSync(fullPath)) continue;

      const lines = fs.readFileSync(fullPath, "utf-8").split(/\r?\n/);
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        for (const regra of REGRAS_CITACOES) {
          const match = regra.regexPeriódicoOuAnoDivergente.exec(line);
          if (match) {
            expect.fail(
              `[PARIDADE] Citação divergente de ${regra.obra} detectada em ${relPath}:${lineNum}.\n` +
              `  Encontrado: '${match[0]}' na linha: "${line.trim()}"\n` +
              `  Esperado: '${regra.esperado}' (Fonte: ${regra.decisaoCanonica})\n` +
              `  Motivo: ${regra.motivo}`
            );
          }
        }
      });
    }
  });

  // --------------------------------------------------------------------------
  // 4. Paridade em Documentos Markdown Principais (DECISOES.md e README.md)
  // --------------------------------------------------------------------------

  it("G07 — docs/planejamento/DECISOES.md e README.md contêm as grandezas canônicas vigentes", () => {
    const caminhoDecisoesMd = path.resolve(process.cwd(), "docs/planejamento/DECISOES.md");
    const conteudoDecisoesMd = fs.readFileSync(caminhoDecisoesMd, "utf-8");

    // DECISOES.md deve carregar explicitamente todas as grandezas canônicas de D16, D24, D02, D10
    expect(conteudoDecisoesMd).toContain("72 polígonos");
    expect(conteudoDecisoesMd).toContain("5,02 ha");
    expect(conteudoDecisoesMd).toContain("361 ha");
    expect(conteudoDecisoesMd).toContain("1.841 unidades");
    expect(conteudoDecisoesMd).toContain("460 unidades");
    expect(conteudoDecisoesMd).toContain("14 preditores");

    // E citações canônicas em suas decisões
    expect(conteudoDecisoesMd).toContain("International Journal of Remote Sensing 35(2):441-453");
    expect(conteudoDecisoesMd).toContain("Revista Brasileira de Ciência do Solo");
    expect(conteudoDecisoesMd).toContain("Zhu, Z. (2013)");
    expect(conteudoDecisoesMd).toContain("Cochran, W. G. (1977)");
  });
});
