import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  gerarPacoteDistribuicao,
  lerDiarioDistribuicao,
  registrarNoDiario,
  ErroPacoteVazio,
  type PapelDistribuicao,
  CAMINHO_DIARIO_PADRAO,
} from "./pacoteDistribuicao";
import type { PontoAmostral } from "@/types/ponto";
import { ErroPontoSinteticoDetectado } from "@/lib/seguranca/guardaSintetico";

function mockPonto(id: number, parciais?: Partial<PontoAmostral>): PontoAmostral {
  return {
    id: `ponto-${id}`,
    codigo: `PR-2026-${String(id).padStart(4, "0")}`,
    latitude: -25.0 - id * 0.01,
    longitude: -53.0 - id * 0.01,
    origemSintetica: false,
    poligonoId: `POL_TESTE_${id}`,
    blocoEspacial: `BLOCO_${id % 3}`,
    estratoId: `E${(id % 18) + 1}`,
    criterioSelecao: {
      tercilS: 1,
      tercilE: 1,
      nivelK: 1,
      phiDiag: 0.5,
      semente: 2026,
    },
    localizacao: {
      municipio: { estado: "medido", valor: "Cascavel", fonte: "IBGE", adquiridoEm: "2026", consultadoEm: "2026-09-10" },
      codigoIbge: { estado: "medido", valor: "4104808", fonte: "IBGE", adquiridoEm: "2026", consultadoEm: "2026-09-10" },
      bacia: { estado: "medido", valor: "Paraná 3", fonte: "IAT", adquiridoEm: "2026", consultadoEm: "2026-09-10" },
    },
    terreno: {
      elevacao: { estado: "medido", valor: 500 + id * 5, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      declividadePct: { estado: "medido", valor: 5.0 + id * 0.5, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      declividadeGraus: { estado: "modelado", valor: 3.0 + id * 0.2, modelo: "atan(pct/100)", insumos: ["declividadePct"] },
      curvaturaPerfil: { estado: "medido", valor: -0.001 * id, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      curvaturaPlana: { estado: "medido", valor: 0.001 * id, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      acumuloFluxo: { estado: "medido", valor: 1000 + id * 50, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      twi: { estado: "modelado", valor: 6.0 + id * 0.1, modelo: "ln(As/tan(beta))", insumos: ["acumuloFluxo", "declividadeGraus"] },
    },
    solo: {
      ordem: { estado: "medido", valor: "LATOSSOLO", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      subOrdem: { estado: "medido", valor: "VERMELHO", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      grandeGrupo: { estado: "medido", valor: "Distrofico", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      tipoUnidade: { estado: "medido", valor: "simples", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
      confiancaPedologica: "alta",
      erodibilidadeClasse: { estado: "medido", valor: "Media", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08", consultadoEm: "2026-09-10" },
    },
    temporal: {
      D: {
        janela: { inicio: "2025-01-01", fim: "2025-12-31" },
        serie: {} as any,
        chuva: {} as any,
      },
    },
    fundiario: {
      status: "encontrado",
      motivo: null,
      consultadoEm: "2026-09-10",
      criterioAssociacao: null,
      codigoCar: `PR-4104808-000${id}`,
      titularMascarado: "A*** S***",
      documentoMascarado: "***.000.000-**",
      registroIncra: null,
      areaImovelHa: 100.0 + id * 10,
      bases: { uf: "PR" },
    } as any,
    rastreio: {
      versaoMotor: "SAREL-1.0",
      cenas: ["SCENE-TEST-1"],
      calculadoEm: "2026-09-10",
    },
    ...parciais,
  };
}

describe("TAREFAS 3 e 4 — Pacotes Selados por Papel e Diário de Distribuição", () => {
  const caminhoDiarioTeste = path.resolve(process.cwd(), "docs/verificacoes/distribuicao/diario_distribuicao_teste.json");

  afterEach(() => {
    if (fs.existsSync(caminhoDiarioTeste)) {
      fs.unlinkSync(caminhoDiarioTeste);
    }
  });

  describe("Tarefa 3 — Geração do Pacote Selado", () => {
    const papeis: PapelDistribuicao[] = ["autorizacao", "campo", "voo", "interpretacao"];

    for (const papel of papeis) {
      it(`gera pacote selado completo e válido para o papel '${papel}'`, () => {
        const pontos = [mockPonto(1), mockPonto(2)];
        (pontos[0].fundiario as any).nomeProprietario = "Proprietário 1";
        (pontos[1].fundiario as any).nomeProprietario = "Proprietário 2";
        (pontos[0] as any).areaPoligonoHa = 5.02;
        (pontos[1] as any).areaPoligonoHa = 5.02;

        const dataRef = new Date("2026-11-11T14:30:00Z");
        const pacote = gerarPacoteDistribuicao(pontos, papel, {
          dataReferencia: dataRef,
          caminhoDiario: caminhoDiarioTeste,
        });

        // 1. Nome do arquivo declara o papel e a data
        expect(pacote.nomeArquivo).toBe(`pacote_${papel}_2026-11-11.csv`);

        // 2. Cabeçalho declara papel, data e advertência
        expect(pacote.conteudoArquivo.startsWith("\uFEFF")).toBe(true);
        expect(pacote.conteudoArquivo).toContain(`# Papel: ${papel}`);
        expect(pacote.conteudoArquivo).toContain(`# Data de Geração: 2026-11-11T14:30:00.000Z`);
        expect(pacote.conteudoArquivo).toContain(`# Advertência:`);
        expect(pacote.conteudoArquivo).toContain(`# Total de Pontos: 2`);
        expect(pacote.conteudoArquivo).toContain(`# SHA-256 do Conteúdo: ${pacote.sha256}`);

        // 3. Verificação matemática do hash SHA-256
        const hashCalculado = crypto.createHash("sha256").update(pacote.payloadCsv, "utf8").digest("hex");
        expect(pacote.sha256).toBe(hashCalculado);

        // 4. Se papel for cego, não pode conter estrato nem titular real
        if (papel !== "autorizacao") {
          expect(pacote.payloadCsv).not.toContain("Estrato_ID");
          expect(pacote.payloadCsv).not.toContain("estrato_id");
          expect(pacote.payloadCsv).not.toContain("Proprietário");
        } else {
          // Autorização tem titular e CAR, mas omite categoricamente estrato
          expect(pacote.payloadCsv).toContain("Nome_Proprietario");
          expect(pacote.payloadCsv).toContain("Proprietário 1");
          expect(pacote.payloadCsv).not.toContain("Estrato_ID");
          expect(pacote.payloadCsv).not.toContain("estrato_id");
        }
      });
    }

    it("recusa conjunto de pontos vazio com ErroPacoteVazio", () => {
      expect(() => gerarPacoteDistribuicao([], "campo", { caminhoDiario: caminhoDiarioTeste })).toThrow(
        ErroPacoteVazio
      );
      expect(() => gerarPacoteDistribuicao([], "campo", { caminhoDiario: caminhoDiarioTeste })).toThrow(
        /\[RECUSA DE DISTRIBUIÇÃO\] Não é permitido gerar pacote vazio para o papel 'campo'/
      );
    });

    it("recusa pontos sintéticos por salvaguarda antissintética", () => {
      const pontos = [mockPonto(1), mockPonto(2, { origemSintetica: true })];
      expect(() => gerarPacoteDistribuicao(pontos, "campo", { caminhoDiario: caminhoDiarioTeste })).toThrow(
        ErroPontoSinteticoDetectado
      );
    });
  });

  describe("Tarefa 4 — Diário de Distribuição", () => {
    it("registra papel, data, hash, total de pontos, perfil e nome de arquivo no diário", () => {
      const pontos = [mockPonto(1), mockPonto(2), mockPonto(3)];
      const dataRef = new Date("2026-11-11T15:00:00Z");

      const pacote = gerarPacoteDistribuicao(pontos, "interpretacao", {
        dataReferencia: dataRef,
        caminhoDiario: caminhoDiarioTeste,
      });

      expect(fs.existsSync(caminhoDiarioTeste)).toBe(true);
      const diario = lerDiarioDistribuicao(caminhoDiarioTeste);
      expect(diario.registros).toHaveLength(1);

      const reg = diario.registros[0];
      expect(reg.papel).toBe("interpretacao");
      expect(reg.perfil).toBe("interpretacao-cega");
      expect(reg.geradoEm).toBe("2026-11-11T15:00:00.000Z");
      expect(reg.sha256).toBe(pacote.sha256);
      expect(reg.totalPontos).toBe(3);
      expect(reg.nomeArquivo).toBe("pacote_interpretacao_2026-11-11.csv");
      expect(reg.destinatario).toBeNull();
    });

    it("destinatário é estritamente opcional: aceita quando fornecido e não quebra quando omitido", () => {
      const pontos = [mockPonto(1)];

      // 1. Fornecido
      const pkgComDest = gerarPacoteDistribuicao(pontos, "campo", {
        destinatario: "Equipe Alfa - Perito Responsável",
        caminhoDiario: caminhoDiarioTeste,
      });
      expect(pkgComDest.conteudoArquivo).toContain("# Destinatário Declarado: Equipe Alfa - Perito Responsável");
      expect(pkgComDest.registro.destinatario).toBe("Equipe Alfa - Perito Responsável");

      // 2. Omitido (undefined ou null)
      const pkgSemDest = gerarPacoteDistribuicao(pontos, "voo", {
        caminhoDiario: caminhoDiarioTeste,
      });
      expect(pkgSemDest.conteudoArquivo).not.toContain("# Destinatário Declarado:");
      expect(pkgSemDest.registro.destinatario).toBeNull();

      const diario = lerDiarioDistribuicao(caminhoDiarioTeste);
      expect(diario.registros).toHaveLength(2);
      expect(diario.registros[0].destinatario).toBe("Equipe Alfa - Perito Responsável");
      expect(diario.registros[1].destinatario).toBeNull();
    });

    it("grava atomicamente múltiplos registros no diário em chamadas sucessivas", () => {
      const pontos = [mockPonto(1)];
      gerarPacoteDistribuicao(pontos, "autorizacao", { caminhoDiario: caminhoDiarioTeste });
      gerarPacoteDistribuicao(pontos, "campo", { caminhoDiario: caminhoDiarioTeste });
      gerarPacoteDistribuicao(pontos, "voo", { caminhoDiario: caminhoDiarioTeste });
      gerarPacoteDistribuicao(pontos, "interpretacao", { caminhoDiario: caminhoDiarioTeste });

      const diario = lerDiarioDistribuicao(caminhoDiarioTeste);
      expect(diario.registros).toHaveLength(4);
      expect(diario.registros.map((r) => r.papel)).toEqual([
        "autorizacao",
        "campo",
        "voo",
        "interpretacao",
      ]);
    });
  });
});
