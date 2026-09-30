import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

export interface ViolacaoCegamentoArtefato {
  arquivo: string;
  motivo: string;
  trechoInfrator: string;
}

const PADRAO_CODIGO_CEGO = /VANT-BLIND-[0-9A-Fa-f]{6,}/;

const PADROES_PROIBIDOS_COM_CODIGO_CEGO: Array<{ nome: string; regex: RegExp }> = [
  { nome: "estratoId", regex: /\b(estratoId|estrato)\b|E_\d_\d_\d|S[123]_E[123]_K[12]/i },
  { nome: "papelConjunto", regex: /\b(papelConjunto|treino|held-out|held_out)\b/i },
  { nome: "nivelK", regex: /\b(nivelK|k_solos|erodibilidade)\b/i },
  { nome: "idPoligono", regex: /\b(idPoligono|codigoPoligono)\b|D16_[A-Za-z0-9_]+/i },
  { nome: "coordenadas", regex: /\b(centroideLat|centroideLon|latitude|longitude)\b/i },
];

/**
 * Inspeciona o conteúdo de um artefato emitido para garantir que NENHUM documento
 * contenha, simultaneamente, um código opaco de intérprete (VANT-BLIND-*) e qualquer
 * atributo de desenho amostral (estratoId, papelConjunto, nivelK, idPoligono ou coordenada).
 * Disciplina pericial W2 / Y5 / Z5.
 */
export function verificarCegamentoArtefato(
  conteudo: string,
  nomeArquivo: string
): ViolacaoCegamentoArtefato[] {
  const violacoes: ViolacaoCegamentoArtefato[] = [];

  const temCodigoCego = PADRAO_CODIGO_CEGO.test(conteudo);
  if (!temCodigoCego) {
    return violacoes;
  }

  for (const { nome, regex } of PADROES_PROIBIDOS_COM_CODIGO_CEGO) {
    const match = regex.exec(conteudo);
    if (match) {
      violacoes.push({
        arquivo: nomeArquivo,
        motivo: `Artefato contém simultaneamente código opaco VANT-BLIND e atributo de desenho '${nome}'.`,
        trechoInfrator: match[0],
      });
    }
  }

  return violacoes;
}

describe("Auditoria Pericial de Cegamento nos Artefatos Emitidos (W2 / Y5 / Z5)", () => {
  it("meta-teste: detector deve sinalizar vazamento quando código cego e atributos coexistirem", () => {
    const docComVazamento = "codigoOpacoInterprete,estratoId\nVANT-BLIND-A1B2C3D4E5,E_1_1_1";
    const violacoes = verificarCegamentoArtefato(docComVazamento, "teste_vazamento.csv");
    expect(violacoes.length).toBeGreaterThan(0);
    expect(violacoes[0].motivo).toContain("estratoId");

    const docInterpreteValido = "codigoOpacoInterprete,cameraName\nVANT-BLIND-A1B2C3D4E5,Micasense Altum";
    expect(verificarCegamentoArtefato(docInterpreteValido, "manifesto_valido.csv")).toHaveLength(0);

    const docPilotoValido = "idPoligono,estratoId,papelConjunto\nD16_01,E_1_1_1,treino";
    expect(verificarCegamentoArtefato(docPilotoValido, "roteiro_valido.csv")).toHaveLength(0);
  });

  it("nenhum artefato emitido em docs/verificacoes/voo_ncontrol/ deve conter código opaco e atributos de desenho", () => {
    const dirVoo = path.resolve(process.cwd(), "docs/verificacoes/voo_ncontrol");
    if (!fs.existsSync(dirVoo)) {
      return;
    }

    const arquivos = fs.readdirSync(dirVoo);
    const todasViolacoes: ViolacaoCegamentoArtefato[] = [];

    for (const arq of arquivos) {
      const caminhoCompleto = path.join(dirVoo, arq);
      const stat = fs.statSync(caminhoCompleto);
      if (!stat.isFile()) continue;

      const conteudo = fs.readFileSync(caminhoCompleto, "utf-8");
      const v = verificarCegamentoArtefato(conteudo, arq);
      todasViolacoes.push(...v);
    }

    expect(
      todasViolacoes,
      `Vazamento de correspondência cega detectado nos seguintes artefatos:\n${todasViolacoes
        .map((x) => `  - ${x.arquivo}: ${x.motivo} (trecho: '${x.trechoInfrator}')`)
        .join("\n")}`
    ).toEqual([]);
  });
});
