import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  gravarEvidenciaGeeSerieS2,
  gravarEvidenciaLoteGeeSerieS2,
  sanitizarRespostaBrutaGee,
  assegurarAusenciaTotalCredenciais,
} from "./gravadorEvidenciaGee";

describe("Gravador de Evidências da Regra 8 para Google Earth Engine", () => {
  it("grava artefato de evidência em docs/verificacoes com metadados obrigatórios e hash SHA-256", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sarel_evidencia_test_"));

    try {
      const respostaMock = [
        { data: "2021-03-10", ndvi: 0.65, bsi: -0.1 },
        { data: "2021-03-20", ndvi: 0.45, bsi: 0.05 },
      ];

      const resultado = gravarEvidenciaGeeSerieS2({
        coordenadas: { latitude: -24.85, longitude: -54.05 },
        operacao: "teste_unitario",
        respostaBruta: respostaMock,
        dataConsulta: "2026-11-08",
        diretorioDestino: tmpDir,
      });

      expect(resultado.sucesso).toBe(true);
      expect(resultado.nomeArquivo).toBe("2026-11-08_gee_serie_s2_teste_unitario.json");
      expect(resultado.totalObservacoes).toBe(2);

      const conteudoGravado = JSON.parse(fs.readFileSync(resultado.caminhoAbsoluto, "utf8"));
      expect(conteudoGravado.tipo).toBe("REGRA_8_EVIDENCIA_GEE");
      expect(conteudoGravado.colecao).toBe("COPERNICUS/S2_SR_HARMONIZED");
      expect(conteudoGravado.janelaTemporal).toEqual({ inicio: "2016-01-01", fim: "2026-06-30" });
      expect(conteudoGravado.coordenadas).toEqual({ latitude: -24.85, longitude: -54.05 });
      expect(conteudoGravado.operacao).toBe("teste_unitario");
      expect(conteudoGravado.dataVerificacao).toBe("2026-11-08");
      expect(conteudoGravado.hashSha256Resposta).toBe(resultado.hashSha256Resposta);
      expect(conteudoGravado.respostaBruta).toEqual(respostaMock);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("elimina estritamente tokens e credenciais antes da gravação", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sarel_evidencia_sanitizacao_"));

    try {
      const payloadComCredenciais = {
        observacoes: [
          { data: "2021-03-10", ndvi: 0.65, bsi: -0.1 },
        ],
        access_token: "ya29.a0AfH6SMB_secret_token_12345",
        token: "secret_token_foo",
        client_email: "service-account@projeto.iam.gserviceaccount.com",
        client_secret: "super-secret-oauth-secret",
        authorization: "Bearer ya29.foo",
      };

      const resultado = gravarEvidenciaGeeSerieS2({
        coordenadas: { latitude: -24.85, longitude: -54.05 },
        operacao: "sanitizacao_teste",
        respostaBruta: payloadComCredenciais,
        dataConsulta: "2026-11-08",
        diretorioDestino: tmpDir,
      });

      const arquivoTexto = fs.readFileSync(resultado.caminhoAbsoluto, "utf8");

      // Assegura que nenhum dos termos ou valores sensíveis aparece no JSON final
      expect(arquivoTexto).not.toContain("ya29.a0AfH6SMB_secret_token_12345");
      expect(arquivoTexto).not.toContain("access_token");
      expect(arquivoTexto).not.toContain("client_email");
      expect(arquivoTexto).not.toContain("client_secret");
      expect(arquivoTexto).not.toContain("authorization");
      expect(arquivoTexto).not.toContain("secret_token_foo");

      const parsed = JSON.parse(arquivoTexto);
      expect(parsed.respostaBruta.access_token).toBeUndefined();
      expect(parsed.respostaBruta.client_secret).toBeUndefined();
      expect(parsed.respostaBruta.observacoes).toHaveLength(1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("FALHA compulsoriamente se chave privada ou token JWT atravessar o payload", () => {
    const payloadComChavePrivada = {
      chave: "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...",
      observacoes: [],
    };

    expect(() => {
      sanitizarRespostaBrutaGee(payloadComChavePrivada);
    }).toThrow(/VIOLACAO_REGRA_8_CREDENCIAL_DETECTADA/);

    const payloadComJwt = {
      dadoObservacional: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJmb28ifQ.abcdef12345678901234567890",
    };

    expect(() => {
      sanitizarRespostaBrutaGee(payloadComJwt);
    }).toThrow(/VIOLACAO_REGRA_8_CREDENCIAL_DETECTADA/);
  });

  it("assegurarAusenciaTotalCredenciais falha se string contiver campos proibidos de credencial", () => {
    const jsonComToken = '{"colecao": "COPERNICUS/S2", "access_token": "ya29.123"}';
    expect(() => {
      assegurarAusenciaTotalCredenciais(jsonComToken);
    }).toThrow(/VIOLACAO_REGRA_8_CREDENCIAL_DETECTADA.*access_token/);

    const jsonComPrivKey = '{"colecao": "COPERNICUS/S2", "private_key": "-----BEGIN PRIVATE KEY-----"}';
    expect(() => {
      assegurarAusenciaTotalCredenciais(jsonComPrivKey);
    }).toThrow(/VIOLACAO_REGRA_8_CREDENCIAL_DETECTADA/);
  });

  it("recusa gravação se destino for em src/ ou em scripts/ (VEDADO por regra)", () => {
    expect(() => {
      gravarEvidenciaGeeSerieS2({
        coordenadas: { latitude: -24.85, longitude: -54.05 },
        operacao: "tentativa_src",
        respostaBruta: [],
        diretorioDestino: path.resolve(process.cwd(), "src/lib/gee"),
      });
    }).toThrow(/Destino proibido.*É VEDADO gravar evidências em src\/ ou em scripts\//);

    expect(() => {
      gravarEvidenciaGeeSerieS2({
        coordenadas: { latitude: -24.85, longitude: -54.05 },
        operacao: "tentativa_scripts",
        respostaBruta: [],
        diretorioDestino: path.resolve(process.cwd(), "scripts/auditoria"),
      });
    }).toThrow(/Destino proibido.*É VEDADO gravar evidências em src\/ ou em scripts\//);
  });

  describe("Gravação de Evidência em Lote (Regra 8)", () => {
    it("grava arquivo de lote com N pontos, custo medido cronometrado e cabeçalho de proveniência", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sarel_lote_test_"));

      try {
        const pontosMock = [
          {
            id: "PT_01",
            coordenadas: { latitude: -24.85, longitude: -54.05 },
            nObservacoesValidasPorBanda: { B2: 25, B4: 25, B8: 25, B11: 25, B12: 25 },
            nObservacoesValidas: 25,
            insuficienteD11: false,
            observacoes: [
              { data: "2020-03-15", ndvi: 0.62, bsi: -0.05 },
              { data: "2020-04-10", ndvi: 0.58, bsi: -0.02 },
            ],
          },
          {
            id: "PT_02",
            coordenadas: { latitude: -24.95, longitude: -54.15 },
            nObservacoesValidasPorBanda: { B2: 4, B4: 4, B8: 4, B11: 4, B12: 4 },
            nObservacoesValidas: 4,
            insuficienteD11: true,
            observacoes: [
              { data: "2021-02-11", ndvi: 0.40, bsi: 0.12 },
            ],
          },
        ];

        const custoMedidoMock = {
          requisicoesEmitidas: 2,
          tempoTotalMs: 1450,
          tempoPorPontoMs: 725,
        };

        const resultado = gravarEvidenciaLoteGeeSerieS2({
          pontos: pontosMock,
          custoMedido: custoMedidoMock,
          operacao: "teste_lote",
          dataConsulta: "2026-11-08",
          diretorioDestino: tmpDir,
        });

        expect(resultado.sucesso).toBe(true);
        expect(resultado.nomeArquivo).toBe("2026-11-08_gee_serie_s2_teste_lote.json");
        expect(resultado.numeroPontos).toBe(2);
        expect(resultado.custoMedido).toEqual(custoMedidoMock);

        const gravado = JSON.parse(fs.readFileSync(resultado.caminhoAbsoluto, "utf8"));
        expect(gravado.tipo).toBe("REGRA_8_EVIDENCIA_GEE_LOTE");
        expect(gravado.colecao).toBe("COPERNICUS/S2_SR_HARMONIZED");
        expect(gravado.numeroPontos).toBe(2);
        expect(gravado.custoMedido).toEqual(custoMedidoMock);
        expect(gravado.pontos).toHaveLength(2);
        expect(gravado.pontos[0].id).toBe("PT_01");
        expect(gravado.pontos[0].nObservacoesValidas).toBe(25);
        expect(gravado.pontos[1].insuficienteD11).toBe(true);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it("elimina tokens e campos sensíveis em lote", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sarel_lote_sanitizacao_"));

      try {
        const pontosComVazamento = [
          {
            id: "PT_01",
            coordenadas: { latitude: -24.85, longitude: -54.05 },
            access_token: "ya29.vazamento_proibido",
            nObservacoesValidasPorBanda: { B2: 10 },
            nObservacoesValidas: 10,
            insuficienteD11: false,
            observacoes: [],
          },
        ];

        const resultado = gravarEvidenciaLoteGeeSerieS2({
          pontos: pontosComVazamento as any,
          custoMedido: { requisicoesEmitidas: 1, tempoTotalMs: 100, tempoPorPontoMs: 100 },
          operacao: "teste_sanitizacao_lote",
          dataConsulta: "2026-11-08",
          diretorioDestino: tmpDir,
        });

        const conteudoRaw = fs.readFileSync(resultado.caminhoAbsoluto, "utf8");
        expect(conteudoRaw).not.toContain("access_token");
        expect(conteudoRaw).not.toContain("ya29.vazamento_proibido");
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
