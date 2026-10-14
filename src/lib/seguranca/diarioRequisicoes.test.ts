import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  criarDiarioRequisicoes,
  registrarChamadaDiario,
  salvarDiarioRequisicoes,
  carregarDiarioRequisicoes,
  validarArtefatoComDiario,
  obterCaminhoDiarioParaArtefato,
  DiarioRequisicoes,
} from "./diarioRequisicoes";

describe("Guarda Estrutural F5: Diário de Requisições de Rede Obrigatório", () => {
  let pastaTemp: string;

  beforeEach(() => {
    pastaTemp = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-diario-teste-"));
  });

  afterEach(() => {
    try {
      if (fs.existsSync(pastaTemp)) {
        fs.rmSync(pastaTemp, { recursive: true, force: true });
      }
    } catch {
      // Ignora erro de limpeza
    }
  });

  it("deve criar, registrar chamadas e sanitizar credenciais em query strings no diário", () => {
    const diario = criarDiarioRequisicoes("docs/verificacoes/teste_artefato.json");
    expect(diario.totalChamadas).toBe(0);
    expect(diario.totalItensProcessados).toBe(0);

    registrarChamadaDiario(diario, {
      timestampIso: "2026-10-01T12:00:00.000Z",
      servico: "GEE",
      endpoint: "https://earthengine.googleapis.com/v1/projects/ee-lab/value:compute?key=AIzaSySecretKey123",
      metodoHttp: "POST",
      quantidadeItens: 100,
      tamanhoRespostaBytes: 45000,
      codigoHttp: 200,
      duracaoMs: 1250,
    });

    expect(diario.totalChamadas).toBe(1);
    expect(diario.totalItensProcessados).toBe(100);
    expect(diario.totalBytesRecebidos).toBe(45000);
    // Assegura sanitização
    expect(diario.chamadas[0].endpoint).not.toContain("AIzaSySecretKey123");
    expect(diario.chamadas[0].endpoint).toContain("key=REDACTED");
  });

  it("deve persistir e carregar diário em disco com integridade", () => {
    const caminhoDiario = path.join(pastaTemp, "diario_exemplo.json");
    const diario = criarDiarioRequisicoes("artefato.json");
    registrarChamadaDiario(diario, {
      timestampIso: new Date().toISOString(),
      servico: "EMBRAPA_WFS",
      endpoint: "https://geoinfo.cnpm.embrapa.br/geoserver/wfs",
      metodoHttp: "GET",
      quantidadeItens: 50,
      tamanhoRespostaBytes: 128000,
      codigoHttp: 200,
      duracaoMs: 800,
    });

    salvarDiarioRequisicoes(diario, caminhoDiario);
    expect(fs.existsSync(caminhoDiario)).toBe(true);

    const carregado = carregarDiarioRequisicoes(caminhoDiario);
    expect(carregado).not.toBeNull();
    expect(carregado!.totalChamadas).toBe(1);
    expect(carregado!.totalItensProcessados).toBe(50);
  });

  it("deve REPROVAR artefato que afirma ter medido dados externos sem possuir diário", () => {
    const caminhoArtefato = path.join(pastaTemp, "artefato_sem_diario.json");
    const artefatoComMedicao = {
      dimensoesMedidas: {
        E: {
          estado: "medido",
          fonteExterna: true,
          totalItens: 680,
        },
      },
      diarioRequisicoes: "docs/verificacoes/diario_inexistente.json",
    };
    fs.writeFileSync(caminhoArtefato, JSON.stringify(artefatoComMedicao, null, 2), "utf8");

    const validacao = validarArtefatoComDiario(caminhoArtefato);
    expect(validacao.valido).toBe(false);
    expect(validacao.diarioEncontrado).toBe(false);
    expect(validacao.inconsistencias[0]).toContain("não foi encontrado");
  });

  it("deve REPROVAR artefato quando a soma de itens do diário for inferior aos itens do artefato", () => {
    const caminhoArtefato = path.join(pastaTemp, "artefato_incompativel.json");
    const caminhoDiario = path.join(pastaTemp, "diario_insuficiente.json");

    const artefato = {
      dimensoesMedidas: {
        E: {
          estado: "medido",
          fonteExterna: true,
          totalItens: 680,
        },
      },
      diarioRequisicoes: caminhoDiario,
    };
    fs.writeFileSync(caminhoArtefato, JSON.stringify(artefato, null, 2), "utf8");

    const diario = criarDiarioRequisicoes(caminhoArtefato);
    // Registra apenas 100 itens quando o artefato afirmava 680
    registrarChamadaDiario(diario, {
      timestampIso: new Date().toISOString(),
      servico: "GEE",
      endpoint: "https://earthengine.googleapis.com/v1/projects/ee-lab/value:compute",
      metodoHttp: "POST",
      quantidadeItens: 100,
      tamanhoRespostaBytes: 25000,
      codigoHttp: 200,
      duracaoMs: 1200,
    });
    salvarDiarioRequisicoes(diario, caminhoDiario);

    const validacao = validarArtefatoComDiario(caminhoArtefato, caminhoDiario);
    expect(validacao.valido).toBe(false);
    expect(validacao.diarioEncontrado).toBe(true);
    expect(validacao.inconsistencias[0]).toContain("Incompatibilidade de itens");
  });

  it("deve APROVAR artefato quando o diário comprova integralmente as chamadas de rede", () => {
    const caminhoArtefato = path.join(pastaTemp, "artefato_comprovado.json");
    const caminhoDiario = path.join(pastaTemp, "diario_comprovado.json");

    const artefato = {
      dimensoesMedidas: {
        E: {
          estado: "medido",
          fonteExterna: true,
          totalItens: 200,
        },
      },
      diarioRequisicoes: caminhoDiario,
    };
    fs.writeFileSync(caminhoArtefato, JSON.stringify(artefato, null, 2), "utf8");

    const diario = criarDiarioRequisicoes(caminhoArtefato);
    registrarChamadaDiario(diario, {
      timestampIso: new Date().toISOString(),
      servico: "GEE",
      endpoint: "https://earthengine.googleapis.com/v1/projects/ee-lab/value:compute",
      metodoHttp: "POST",
      quantidadeItens: 100,
      tamanhoRespostaBytes: 25000,
      codigoHttp: 200,
      duracaoMs: 1100,
    });
    registrarChamadaDiario(diario, {
      timestampIso: new Date().toISOString(),
      servico: "GEE",
      endpoint: "https://earthengine.googleapis.com/v1/projects/ee-lab/value:compute",
      metodoHttp: "POST",
      quantidadeItens: 100,
      tamanhoRespostaBytes: 25000,
      codigoHttp: 200,
      duracaoMs: 1050,
    });
    salvarDiarioRequisicoes(diario, caminhoDiario);

    const validacao = validarArtefatoComDiario(caminhoArtefato, caminhoDiario);
    expect(validacao.valido).toBe(true);
    expect(validacao.inconsistencias).toHaveLength(0);
    expect(validacao.totalItensArtefato).toBe(200);
    expect(validacao.totalItensDiario).toBe(200);
  });
});
