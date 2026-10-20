import { describe, it, expect } from "vitest";
import {
  validarRegistroAutorizacao,
  ingestarRegistrosAutorizacao,
  prestarContasAmostra,
  RegistroAutorizacao,
} from "./logRecusas";

function base(): RegistroAutorizacao {
  return {
    codigoPonto: "PT-0001",
    estratoId: "E_2_3_1",
    solicitadoEm: "2026-10-01",
    respondidoEm: "2026-10-05",
    desfecho: "autorizada",
    motivoRecusa: null,
    motivoLivre: null,
    registradoPor: "bolsista-1",
    autorizacaoId: "AUT-2026-0001",
    substituidoPor: null,
  };
}

describe("Log de autorizações e recusas (viés de atrito)", () => {
  describe("Regra 1 — lacuna é rejeição, nunca preenchimento", () => {
    it("aceita um registro íntegro", () => {
      expect(validarRegistroAutorizacao(base())).toBeNull();
    });

    it("rejeita recusa sem motivo categorizado", () => {
      const r = { ...base(), desfecho: "recusada" as const, autorizacaoId: null };
      expect(validarRegistroAutorizacao(r)).toMatch(/sem motivo categorizado/);
    });

    it("distingue 'sem-motivo-declarado' de ausência de motivo", () => {
      const r = {
        ...base(),
        desfecho: "recusada" as const,
        motivoRecusa: "sem-motivo-declarado" as const,
        autorizacaoId: null,
      };
      expect(validarRegistroAutorizacao(r)).toBeNull();
    });

    it("exige motivoLivre quando o motivo é 'outro'", () => {
      const r = {
        ...base(),
        desfecho: "recusada" as const,
        motivoRecusa: "outro" as const,
        autorizacaoId: null,
      };
      expect(validarRegistroAutorizacao(r)).toMatch(/motivoLivre/);
      expect(
        validarRegistroAutorizacao({ ...r, motivoLivre: "alegou obra na estrada de acesso" })
      ).toBeNull();
    });

    it("rejeita motivoRecusa em desfecho que não é recusa", () => {
      const r = { ...base(), motivoRecusa: "receio-fiscalizacao" as const };
      expect(validarRegistroAutorizacao(r)).toMatch(/só se aplica a recusa/);
    });

    it("exige autorizacaoId quando autorizada e proíbe quando não", () => {
      expect(validarRegistroAutorizacao({ ...base(), autorizacaoId: null })).toMatch(
        /exige autorizacaoId/
      );
      const recusa = {
        ...base(),
        desfecho: "recusada" as const,
        motivoRecusa: "receio-uso-dos-dados" as const,
      };
      expect(validarRegistroAutorizacao(recusa)).toMatch(/só se aplica a autorização/);
    });

    it("trata 'pendente' e respondidoEm como mutuamente excludentes", () => {
      const pend = { ...base(), desfecho: "pendente" as const, autorizacaoId: null };
      expect(validarRegistroAutorizacao(pend)).toMatch(/não admite respondidoEm/);
      expect(validarRegistroAutorizacao({ ...pend, respondidoEm: null })).toBeNull();

      const semResp = { ...base(), desfecho: "sem-resposta" as const, autorizacaoId: null };
      expect(validarRegistroAutorizacao({ ...semResp, respondidoEm: null })).toMatch(
        /exige respondidoEm/
      );
    });

    it("rejeita resposta anterior ao pedido e data fora do formato", () => {
      expect(validarRegistroAutorizacao({ ...base(), respondidoEm: "2026-09-30" })).toMatch(
        /anterior a solicitadoEm/
      );
      expect(validarRegistroAutorizacao({ ...base(), solicitadoEm: "01/10/2026" })).toMatch(
        /AAAA-MM-DD/
      );
    });

    it("rejeita estrato fora dos 18 de D12", () => {
      expect(validarRegistroAutorizacao({ ...base(), estratoId: "E_9_9_9" })).toMatch(/D12/);
    });
  });

  describe("Sem dado pessoal", () => {
    it("o tipo do registro não possui campo de CAR, titular ou documento", () => {
      const chaves = Object.keys(base());
      for (const proibida of ["codigoCar", "titular", "titularMascarado", "documento"]) {
        expect(chaves).not.toContain(proibida);
      }
    });
  });

  describe("Ingestão em lote", () => {
    it("separa aceitos de rejeitados sem corrigir nenhum", () => {
      const r = ingestarRegistrosAutorizacao([
        base(),
        { ...base(), codigoPonto: "PT-0002", desfecho: "recusada", autorizacaoId: null },
      ]);
      expect(r.aceitos).toHaveLength(1);
      expect(r.rejeitados).toHaveLength(1);
      expect(r.rejeitados[0].causa).toMatch(/sem motivo categorizado/);
    });

    it("recusa codigoPonto duplicado no lote", () => {
      const r = ingestarRegistrosAutorizacao([base(), { ...base(), autorizacaoId: "AUT-X" }]);
      expect(r.aceitos).toHaveLength(1);
      expect(r.rejeitados[0].causa).toMatch(/duplicado/);
    });
  });

  describe("Prestação de contas e atrito diferencial", () => {
    const recusa = (cod: string, estrato: string): RegistroAutorizacao => ({
      ...base(),
      codigoPonto: cod,
      estratoId: estrato,
      desfecho: "recusada",
      motivoRecusa: "receio-fiscalizacao",
      autorizacaoId: null,
    });
    const aceite = (cod: string, estrato: string): RegistroAutorizacao => ({
      ...base(),
      codigoPonto: cod,
      estratoId: estrato,
      autorizacaoId: `AUT-${cod}`,
    });

    it("Regra 2 — taxa de recusa sem pedido concluído é null, não 0", () => {
      const pend: RegistroAutorizacao = {
        ...base(),
        codigoPonto: "PT-9",
        desfecho: "pendente",
        respondidoEm: null,
        autorizacaoId: null,
      };
      const c = prestarContasAmostra([pend], { E_2_3_1: 1 });
      expect(c.porEstrato[0].taxaRecusa).toBeNull();
      expect(c.amplitudeTaxaRecusa).toBeNull();
    });

    it("calcula taxa de recusa por estrato e a amplitude entre eles", () => {
      const registros = [
        recusa("A1", "E_1_1_1"),
        recusa("A2", "E_1_1_1"),
        aceite("B1", "E_3_3_2"),
        aceite("B2", "E_3_3_2"),
      ];
      const c = prestarContasAmostra(registros, { E_1_1_1: 2, E_3_3_2: 2 });
      const degradado = c.porEstrato.find((e) => e.estratoId === "E_1_1_1");
      const conservado = c.porEstrato.find((e) => e.estratoId === "E_3_3_2");

      expect(degradado?.taxaRecusa).toBeCloseTo(1.0, 6);
      expect(conservado?.taxaRecusa).toBeCloseTo(0.0, 6);
      expect(c.amplitudeTaxaRecusa).toBeCloseTo(1.0, 6);
      expect(c.totalPlanejado).toBe(4);
      expect(c.totalAutorizado).toBe(2);
    });

    it("estrato planejado sem registro não vira zero recusa", () => {
      const c = prestarContasAmostra([aceite("A1", "E_1_1_1")], {
        E_1_1_1: 1,
        E_2_2_2: 3,
      });
      expect(c.estratosSemRegistro).toContain("E_2_2_2");
      const vazio = c.porEstrato.find((e) => e.estratoId === "E_2_2_2");
      expect(vazio?.taxaRecusa).toBeNull();
      expect(vazio?.planejados).toBe(3);
    });

    it("conta substituições", () => {
      const r = { ...recusa("A1", "E_1_1_1"), substituidoPor: "A9" };
      const c = prestarContasAmostra([r], { E_1_1_1: 1 });
      expect(c.porEstrato[0].substituicoes).toBe(1);
    });
  });
});
