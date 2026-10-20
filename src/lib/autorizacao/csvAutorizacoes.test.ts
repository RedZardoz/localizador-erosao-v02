import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  dividirLinhaCsv,
  ingestarCsvAutorizacoes,
  ErroCabecalhoCsv,
  COLUNAS_CSV_AUTORIZACAO,
} from "./csvAutorizacoes";
import { prestarContasAmostra } from "./logRecusas";

const CAB = COLUNAS_CSV_AUTORIZACAO.join(",");

describe("Ingestão do log de autorizações por CSV", () => {
  describe("Leitura de campos", () => {
    it("respeita vírgula dentro de campo entre aspas", () => {
      const campos = dividirLinhaCsv('PT-1,E_1_1_1,"alegou cerca, gado solto e obra",x');
      expect(campos).toEqual(["PT-1", "E_1_1_1", "alegou cerca, gado solto e obra", "x"]);
    });

    it("trata aspas duplicadas como aspa literal", () => {
      expect(dividirLinhaCsv('a,"disse ""não autorizo"" e desligou"')).toEqual([
        "a",
        'disse "não autorizo" e desligou',
      ]);
    });

    it("preserva campos vazios nas pontas", () => {
      expect(dividirLinhaCsv("a,,c,")).toEqual(["a", "", "c", ""]);
    });
  });

  describe("Cabeçalho", () => {
    it("rejeita o arquivo inteiro quando o cabeçalho não confere", () => {
      expect(() => ingestarCsvAutorizacoes("codigo,estrato\nPT-1,E_1_1_1")).toThrow(
        ErroCabecalhoCsv
      );
    });

    it("rejeita CSV vazio", () => {
      expect(() => ingestarCsvAutorizacoes("   \n  ")).toThrow(ErroCabecalhoCsv);
    });
  });

  describe("Conversão e validação", () => {
    it("ingere uma autorização concedida", () => {
      const csv = `${CAB}\nPT-0001,E_2_3_1,2026-10-01,2026-10-05,autorizada,,,bolsista-1,AUT-0001,`;
      const r = ingestarCsvAutorizacoes(csv);
      expect(r.rejeitados).toHaveLength(0);
      expect(r.aceitos[0].desfecho).toBe("autorizada");
      expect(r.aceitos[0].autorizacaoId).toBe("AUT-0001");
      expect(r.aceitos[0].motivoRecusa).toBeNull();
    });

    it("ingere uma recusa com motivo livre contendo vírgula", () => {
      const csv =
        `${CAB}\n` +
        `PT-0002,E_1_1_1,2026-10-01,2026-10-03,recusada,outro,"obra na estrada, sem acesso",bolsista-1,,`;
      const r = ingestarCsvAutorizacoes(csv);
      expect(r.rejeitados).toHaveLength(0);
      expect(r.aceitos[0].motivoLivre).toBe("obra na estrada, sem acesso");
    });

    it("célula em branco é ausência e é rejeitada onde o campo é obrigatório", () => {
      const csv = `${CAB}\nPT-0003,E_1_1_1,2026-10-01,2026-10-03,recusada,,,bolsista-1,,`;
      const r = ingestarCsvAutorizacoes(csv);
      expect(r.aceitos).toHaveLength(0);
      expect(r.rejeitados[0].causa).toMatch(/sem motivo categorizado/);
    });

    it("não inventa data: respondido_em vazio em desfecho concluído é rejeitado", () => {
      const csv = `${CAB}\nPT-0004,E_1_1_1,2026-10-01,,sem-resposta,,,bolsista-1,,`;
      const r = ingestarCsvAutorizacoes(csv);
      expect(r.rejeitados[0].causa).toMatch(/exige respondidoEm/);
    });

    it("aceita pendente com resposta em branco", () => {
      const csv = `${CAB}\nPT-0005,E_1_1_1,2026-10-01,,pendente,,,bolsista-1,,`;
      const r = ingestarCsvAutorizacoes(csv);
      expect(r.rejeitados).toHaveLength(0);
      expect(r.aceitos[0].respondidoEm).toBeNull();
    });
  });

  describe("Política de substituição no mesmo estrato", () => {
    it("aceita reposição dentro do mesmo estrato", () => {
      const csv =
        `${CAB}\n` +
        `PT-0010,E_1_1_1,2026-10-01,2026-10-03,recusada,receio-fiscalizacao,,bolsista-1,,PT-0011\n` +
        `PT-0011,E_1_1_1,2026-10-04,2026-10-06,autorizada,,,bolsista-1,AUT-0011,`;
      const r = ingestarCsvAutorizacoes(csv);
      expect(r.rejeitados).toHaveLength(0);
      expect(r.aceitos).toHaveLength(2);
    });

    it("rejeita reposição vinda de outro estrato", () => {
      const csv =
        `${CAB}\n` +
        `PT-0020,E_1_1_1,2026-10-01,2026-10-03,recusada,receio-fiscalizacao,,bolsista-1,,PT-0021\n` +
        `PT-0021,E_3_3_2,2026-10-04,2026-10-06,autorizada,,,bolsista-1,AUT-0021,`;
      const r = ingestarCsvAutorizacoes(csv);
      expect(r.rejeitados).toHaveLength(1);
      expect(r.rejeitados[0].causa).toMatch(/mesmo estrato/);
    });

    it("rejeita substituição em autorização concedida", () => {
      const csv = `${CAB}\nPT-0030,E_1_1_1,2026-10-01,2026-10-03,autorizada,,,bolsista-1,AUT-0030,PT-0031`;
      const r = ingestarCsvAutorizacoes(csv);
      expect(r.rejeitados[0].causa).toMatch(/não há ponto perdido a repor/);
    });
  });

  describe("O modelo entregue ao bolsista é válido", () => {
    // Guarda de regressão: o arquivo que a equipe recebe tem de atravessar a própria
    // ingestão sem nenhuma rejeição. Um modelo que não valida ensina o erro.
    const caminho = path.resolve(process.cwd(), "docs/modelos/log_autorizacoes_MODELO.csv");

    it("docs/modelos/log_autorizacoes_MODELO.csv é ingerido sem rejeição", () => {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      const r = ingestarCsvAutorizacoes(conteudo);
      if (r.rejeitados.length > 0) {
        expect.fail(
          "O modelo entregue ao bolsista foi rejeitado:\n" +
            r.rejeitados.map((x) => `  ${x.registro.codigoPonto}: ${x.causa}`).join("\n")
        );
      }
      expect(r.aceitos.length).toBeGreaterThan(0);
    });

    it("o modelo exercita a prestação de contas de ponta a ponta", () => {
      const { aceitos } = ingestarCsvAutorizacoes(fs.readFileSync(caminho, "utf-8"));
      const contas = prestarContasAmostra(aceitos, { E_1_1_1: 2, E_2_3_1: 1, E_2_2_2: 4 });

      // Estrato planejado sem nenhum pedido não pode virar "zero recusa" (Regra 2).
      expect(contas.estratosSemRegistro).toContain("E_2_2_2");
      const vazio = contas.porEstrato.find((e) => e.estratoId === "E_2_2_2");
      expect(vazio?.taxaRecusa).toBeNull();

      // O modelo traz recusa e autorização, então a amplitude tem de existir.
      expect(contas.amplitudeTaxaRecusa).not.toBeNull();
    });
  });
});
