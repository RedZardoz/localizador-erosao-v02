import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PontoAmostral } from "@/types/ponto";
import { RotuloConsolidado } from "@/types/rotulo";
import { medido } from "@/types/proveniencia";
import { extrairLinhasPorPerfil } from "@/lib/export/planilha";
import {
  gerarCsvMatrizTreinamento,
  gerarConteudoPacoteReprodutibilidade,
} from "@/lib/export/pacoteReprodutibilidade";
import { validarEsquemaMatriz } from "./esquema";

/**
 * Testes de Aceite S1-1 / Tarefa 2026-11-03:
 * Vazio não é false; interação entre contrato da matriz e avaliador D25.
 *
 * TODO dado aqui é SINTETICO_TESTE_ENCANAMENTO: nenhum resultado é evidência científica.
 */

const provMedido = (v: number) => medido(v, "SINTETICO_TESTE_ENCANAMENTO", "2026-01-01");

function mockPonto(id: string, codigo: string, poligonoId: string): PontoAmostral {
  return {
    id,
    codigo,
    latitude: -24.5,
    longitude: -53.5,
    origemSintetica: false,
    poligonoId,
    blocoEspacial: "BLOCO_A",
    estratoId: "E01",
    criterioSelecao: {
      tercilS: 1,
      tercilE: 1,
      nivelK: 1,
      phiDiag: 0.5,
      semente: 42,
    },
    localizacao: {
      municipio: { estado: "medido", valor: "Toledo", fonte: "IBGE", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      codigoIbge: { estado: "medido", valor: "4127700", fonte: "IBGE", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      bacia: { estado: "medido", valor: "Paraná 3", fonte: "IAT", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
    },
    terreno: {
      elevacao: provMedido(450),
      declividadePct: provMedido(8.5),
      declividadeGraus: provMedido(4.86),
      curvaturaPerfil: provMedido(0.01),
      curvaturaPlana: provMedido(-0.01),
      acumuloFluxo: provMedido(120),
      twi: provMedido(7.2),
    },
    solo: {
      ordem: { estado: "medido", valor: "LATOSSOLO", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
      subOrdem: { estado: "medido", valor: "VERMELHO", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
      grandeGrupo: { estado: "medido", valor: "Distrofico", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
      tipoUnidade: { estado: "medido", valor: "simples", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
      confiancaPedologica: "alta",
      erodibilidadeClasse: { estado: "medido", valor: "Baixa", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
    },
    temporal: {},
    rastreio: { versaoMotor: "2.0.0", cenas: [], calculadoEm: "2026-01-01" },
  };
}

const rotuloTreinoMock: RotuloConsolidado = {
  final: {
    classe: "erosao",
    modalidade: "drone",
    observador: "Especialista Teste",
    observadoEm: "2026-03-01",
    confianca: "alta",
    cego: true,
  },
  origens: [],
  kappa: 0.9,
  divergencia: "nenhuma",
  papelConjunto: "treino",
};

const seloTesteD16 = {
  poligonos: [
    {
      idPoligono: "POL_TESTE_S11",
      estratoId: "E07",
      pi_i: 0.2,
      w_i: 5.0,
      nCandidatosEstrato: 10,
    },
  ],
};

describe("Aceite S1-1: Interação entre Contrato da Matriz e D25", () => {
  it("7. Exportação COM seloD16: Estrato_ID, Pi_i, W_i e N_Candidatos_Estrato saem preenchidos e Pi_i * W_i = 1", async () => {
    const p = mockPonto("p-s11-1", "SINTETICO_TESTE_ENCANAMENTO_01", "POL_TESTE_S11");
    const rotulos = { "SINTETICO_TESTE_ENCANAMENTO_01": rotuloTreinoMock };

    // 1. Exportação pela rota de planilha
    const linhas = extrairLinhasPorPerfil([p], "matriz-treino", rotulos, { seloD16: seloTesteD16 });
    expect(linhas).toHaveLength(1);
    const l = linhas[0];
    expect(l.Estrato_ID).toBe("E07");
    expect(l.Pi_i).toBe(0.2);
    expect(l.W_i).toBe(5.0);
    expect(l.N_Candidatos_Estrato).toBe(10);
    expect((l.Pi_i as number) * (l.W_i as number)).toBeCloseTo(1.0, 6);

    // Validação estrita do contrato de esquema
    expect(() => validarEsquemaMatriz("matriz-treino", linhas)).not.toThrow();

    // 2. Exportação pela rota do pacote de reprodutibilidade
    const csvMatriz = gerarCsvMatrizTreinamento([p], rotulos, { seloD16: seloTesteD16 });
    expect(csvMatriz).toContain("E07");

    const pacote = await gerarConteudoPacoteReprodutibilidade([p], rotulos, { seloD16: seloTesteD16 });
    expect(pacote.matrizTreinamentoCsv).toContain("E07");
  });

  it("8. Exportação SEM seloD16: chaves de desenho saem vazias e o esquema aceita (ausência declarada)", () => {
    const p = mockPonto("p-s11-2", "SINTETICO_TESTE_ENCANAMENTO_02", "POL_TESTE_S11");
    delete (p as any).estratoId;
    const rotulos = { "SINTETICO_TESTE_ENCANAMENTO_02": rotuloTreinoMock };

    const linhas = extrairLinhasPorPerfil([p], "matriz-treino", rotulos);
    expect(linhas).toHaveLength(1);
    const l = linhas[0];
    expect(l.Estrato_ID).toBe("");
    expect(l.Pi_i).toBe("");
    expect(l.W_i).toBe("");
    expect(l.N_Candidatos_Estrato).toBe("");

    // O esquema aceita ausência declarada (célula vazia "")
    expect(() => validarEsquemaMatriz("matriz-treino", linhas)).not.toThrow();
  });

  it("9. As quatro rotas repassam a opção quando ela é fornecida — falha se houver 5ª chamada sem repassar", () => {
    // Varredor estático em src/ para auditar chamadas a montarMatrizTreino
    const srcDir = path.resolve(__dirname, "../..");

    function varrerArquivos(dir: string): string[] {
      const arquivos: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          arquivos.push(...varrerArquivos(full));
        } else if (
          entry.isFile() &&
          (full.endsWith(".ts") || full.endsWith(".tsx")) &&
          !full.includes(".test.") &&
          !full.endsWith("montagem.ts")
        ) {
          arquivos.push(full);
        }
      }
      return arquivos;
    }

    const arquivosSrc = varrerArquivos(srcDir);
    interface ChamadaProducao {
      arquivo: string;
      relPath: string;
      linha: number;
      trecho: string;
      repassaSeloD16: boolean;
    }

    const chamadasProducao: ChamadaProducao[] = [];

    for (const arq of arquivosSrc) {
      const relPath = path.relative(srcDir, arq).replace(/\\/g, "/");
      const conteudo = fs.readFileSync(arq, "utf-8");
      const linhas = conteudo.split("\n");

      for (let i = 0; i < linhas.length; i++) {
        const l = linhas[i];
        if (l.includes("montarMatrizTreino(")) {
          // Captura bloco da chamada (até 10 linhas seguintes)
          const bloco = linhas.slice(i, Math.min(linhas.length, i + 10)).join("\n");
          const repassa = bloco.includes("seloD16") || bloco.includes("selo");
          chamadasProducao.push({
            arquivo: arq,
            relPath,
            linha: i + 1,
            trecho: l.trim(),
            repassaSeloD16: repassa,
          });
        }
      }
    }

    // Devem existir exatamente as 4 rotas de produção mapeadas pelo achado S1-1
    expect(chamadasProducao).toHaveLength(4);

    // As 4 rotas esperadas:
    const arquivosEsperados = [
      "lib/export/planilha.ts",
      "lib/export/pacoteReprodutibilidade.ts",
      "lib/export/pacoteReprodutibilidade.ts",
      "components/matriz/PainelMatrizTreino.tsx",
    ];

    const rotasEncontradas = chamadasProducao.map((c) => c.relPath);
    for (const exp of arquivosEsperados) {
      expect(rotasEncontradas).toContain(exp);
    }

    // Toda chamada a montarMatrizTreino em produção DEVE repassar seloD16 (S1-1)
    for (const c of chamadasProducao) {
      if (!c.repassaSeloD16) {
        throw new Error(
          `[S1-1 VIOLAÇÃO] Chamada a montarMatrizTreino em ${c.relPath}:${c.linha} não repassa seloD16!\n` +
            `Trecho: ${c.trecho}\n` +
            `Veja S1-1: vazio não é false, opções de desenho devem ser repassadas.`
        );
      }
      expect(c.repassaSeloD16).toBe(true);
    }
  });
});
