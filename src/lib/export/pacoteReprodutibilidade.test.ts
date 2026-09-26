import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import type { PontoAmostral } from "@/types/ponto";
import type { RotuloConsolidado } from "@/types/rotulo";
import { assegurarSegregacaoTreino } from "@/lib/rotulos/ingestaoDrone";
import {
  calcularSha256,
  gerarCsvMatrizTreinamento,
  gerarCsvValidacaoDroneHeldOut,
  gerarCsvConfrontoRadiometrico,
  gerarJsonDatasheetMetadados,
  gerarScriptPythonAuditoria,
  gerarManifestoSha256,
  gerarConteudoPacoteReprodutibilidade,
  gerarPacoteReprodutibilidadeZip,
} from "./pacoteReprodutibilidade";

const prov = <T>(valor: T) => ({
  estado: "medido" as const,
  valor,
  fonte: "OFICIAL",
  adquiridoEm: "2026-01-01",
  consultadoEm: "2026-01-02",
});

function criarPontoTeste(id: string, lat: number, lng: number, classe: string): PontoAmostral {
  const num = parseInt(id.replace(/\D/g, "") || "1", 10);
  return {
    id: `ponto-${id}`,
    codigo: `PR-2026-${String(num).padStart(4, "0")}`,
    latitude: lat,
    longitude: lng,
    origemSintetica: false,
    blocoEspacial: "bloco_oeste",
    estratoId: `E${num}`,
    criterioSelecao: {
      tercilS: 1,
      tercilE: 1,
      nivelK: 1,
      phiDiag: 0.5,
      semente: 2026,
    },
    localizacao: {
      municipio: prov("Ceu Azul"),
      codigoIbge: prov("4105309"),
      bacia: prov("Paraná 3"),
    },
    terreno: {
      elevacao: prov(550),
      declividadePct: prov(12.5),
      declividadeGraus: prov(7.1),
      curvaturaPerfil: prov(-0.02),
      curvaturaPlana: prov(0.01),
      acumuloFluxo: prov(140),
      twi: prov(6.8),
    },
    solo: {
      ordem: prov("LATOSSOLO"),
      subOrdem: prov("VERMELHO"),
      grandeGrupo: prov("Distrofico"),
      tipoUnidade: prov("simples"),
      confiancaPedologica: "alta",
      erodibilidadeClasse: prov("Media"),
    },
    linhaDeBase: {
      fatorR: prov(7200),
      fatorK: prov(0.0117),
      fatorLS: prov(1.45),
      fatorC: prov(0.12),
      fatorP: prov(1.0),
      perdaSolo: prov(12.4),
      memoriaCalculo: "A = R * K * LS * C * P",
    },
    temporal: {
      D: {
        janela: { inicio: "2023-01-01", fim: "2026-03-01" },
        serie: {
          sensores: ["Sentinel-2"],
          nObservacoesValidas: { B4: 45, B8: 45 },
          harmonicos: {
            B12_amplitude: prov(0.2),
            B12_tendencia: prov(-0.01),
          },
          estatisticas: {
            NDVI_p10: prov(0.2),
            NDVI_p50: prov(0.55),
            NDVI_p90: prov(0.78),
          },
          frequenciaSoloNu: prov(0.15),
          maiorSequenciaSoloNu: prov(3),
          mesModalExposicao: prov(9),
          compostoSoloNu: {},
        },
        chuva: {
          precipAcum30d: prov(120),
          precipAcum90d: prov(380),
          i30Max: prov(45.2),
          nEventosErosivos: prov(4),
          indiceMecanismo: prov(18.5),
        },
      },
    },
    rotulo: {
      final: {
        classe,
        modalidade: "campo",
        observador: "Especialista A",
        observadoEm: "2026-03-10",
        confianca: "alta",
        cego: true,
      },
      origens: [],
      kappa: 0.92,
      divergencia: "nenhuma",
      papelConjunto: "treino",
    },
    rastreio: {
      versaoMotor: "SAREL-2.0",
      cenas: ["SCENE-TEST"],
      calculadoEm: "2026-03-10",
    },
  };
}

function extrairMapaRotulos(pontos: PontoAmostral[]): Record<string, RotuloConsolidado> {
  const mapa: Record<string, RotuloConsolidado> = {};
  for (const p of pontos) {
    if (p.rotulo) {
      mapa[p.codigo] = p.rotulo;
    }
  }
  return mapa;
}

describe("Pacote de Reprodutibilidade da Dissertação (Research Compendium)", () => {
  it("deve calcular o hash criptográfico SHA-256 de forma determinística", async () => {
    const texto = "SAREL-PPGTCA-2026";
    const hash = await calcularSha256(texto);
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);

    // O mesmo texto deve gerar sempre o mesmo hash
    const hash2 = await calcularSha256(texto);
    expect(hash).toBe(hash2);
  });

  it("deve gerar o Arquivo 01 (Matriz de Treinamento CSV) com BOM e colunas esperadas", () => {
    const pontos = [
      criarPontoTeste("1", -25.14, -53.84, "erosao"),
      criarPontoTeste("2", -25.15, -53.85, "ausente"),
    ];

    const csv = gerarCsvMatrizTreinamento(pontos, extrairMapaRotulos(pontos));
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Ponto_ID,Codigo,Latitude,Longitude");
    expect(csv).toContain("RUSLE_Fator_K");
    expect(csv).toContain("Classe_Alvo_Binaria");
    expect(csv).toContain("PR-2026-0001");
    expect(csv).toContain("PR-2026-0002");
    expect(csv).toContain("Ceu Azul");
  });

  it("deve gerar o Arquivo 02 (Validação Drone Held-Out) com metadados do Spectral 2", () => {
    const csv = gerarCsvValidacaoDroneHeldOut();
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Spectral 2");
    expect(csv).toContain("Nuvem UAV");
    expect(csv).toContain("PPK/RTK");
    expect(csv).toContain("held-out");
    expect(csv).toContain("SITIO-CA-01");
    expect(csv).toContain("SITIO-MED-01");
  });

  it("deve gerar o Arquivo 03 (Confronto Radiométrico) com correlação de Pearson no cabeçalho", () => {
    const csv = gerarCsvConfrontoRadiometrico();
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Correlação Linear de Pearson (r)");
    expect(csv).toContain("NDVI_Sentinel2_10m");
    expect(csv).toContain("NDVI_Medio_Spectral2");
    expect(csv).toContain("Diferenca_Residuo");
  });

  it("deve gerar o Arquivo 04 (Datasheet JSON) em conformidade com Gebru et al. (2021) e FAIR", () => {
    const jsonStr = gerarJsonDatasheetMetadados(150, 120);
    const data = JSON.parse(jsonStr);

    expect(data.projeto.nome).toContain("SAREL");
    expect(data.projeto.programa).toContain("PPGTCA");
    expect(data.projeto.totalAmostrasRecebidas).toBe(150);
    expect(data.projeto.totalAmostrasTreinamento).toBe(120);
    expect(data.conformidadeCientifica.principiosFAIR.findable).toBeDefined();
    expect(data.conformidadeCientifica.datasheetForDatasets.referencia).toContain("Gebru et al. (2021)");
    expect(data.equipamentoVantReferencia.modelo).toContain("Spectral 2");
    expect(data.referenciasBibliograficasABNT.length).toBeGreaterThan(3);
  });

  it("deve gerar o Arquivo 05 (Script Python de Auditoria) com seed fixa e XGBoost", () => {
    const script = gerarScriptPythonAuditoria();
    expect(script).toContain("#!/usr/bin/env python3");
    expect(script).toContain("random_state=42");
    expect(script).toContain("GroupKFold");
    expect(script).toContain("XGBClassifier");
    expect(script).toContain("06_manifesto_integridade_sha256.txt");
  });

  it("deve gerar o manifesto de integridade com os hashes corretos", () => {
    const hashes = {
      "01_matriz.csv": "a1b2c3d4",
      "02_drone.csv": "e5f6g7h8",
    };
    const manifesto = gerarManifestoSha256(hashes);
    expect(manifesto).toContain("a1b2c3d4  01_matriz.csv");
    expect(manifesto).toContain("e5f6g7h8  02_drone.csv");
    expect(manifesto).toContain("sha256sum -c");
  });

  it("deve gerar o conteúdo completo dos 6 arquivos e verificar coerência do manifesto", async () => {
    const pontos = [criarPontoTeste("1", -25.14, -53.84, "erosao")];
    const pacote = await gerarConteudoPacoteReprodutibilidade(pontos, extrairMapaRotulos(pontos));

    expect(pacote.matrizTreinamentoCsv).toBeDefined();
    expect(pacote.validacaoDroneCsv).toBeDefined();
    expect(pacote.confrontoRadiometricoCsv).toBeDefined();
    expect(pacote.datasheetJson).toBeDefined();
    expect(pacote.scriptPython).toBeDefined();
    expect(pacote.manifestoSha256Txt).toBeDefined();

    // Conferir se o hash do arquivo 01 no manifesto corresponde ao SHA-256 real calculado
    const hashRealF1 = await calcularSha256(pacote.matrizTreinamentoCsv);
    expect(pacote.manifestoSha256Txt).toContain(`${hashRealF1}  01_matriz_preditores_treinamento_sarel.csv`);
  });

  it("deve gerar um arquivo ZIP válido contendo os 6 arquivos", async () => {
    const pontos = [
      criarPontoTeste("1", -25.14, -53.84, "erosao"),
      criarPontoTeste("2", -25.15, -53.85, "ausente"),
    ];

    const blob = await gerarPacoteReprodutibilidadeZip(pontos, extrairMapaRotulos(pontos));
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(1000);

    // Descompactar o ZIP e verificar que contém exatamente os 6 arquivos
    const arrayBuffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    expect(zip.file("01_matriz_preditores_treinamento_sarel.csv")).not.toBeNull();
    expect(zip.file("02_validacao_padrao_ouro_held_out_drone.csv")).not.toBeNull();
    expect(zip.file("03_confronto_radiometrico_sentinel_spectral2.csv")).not.toBeNull();
    expect(zip.file("04_datasheet_metadados_dicionario.json")).not.toBeNull();
    expect(zip.file("05_script_auditoria_reproduzivel.py")).not.toBeNull();
    expect(zip.file("06_manifesto_integridade_sha256.txt")).not.toBeNull();
  });

  it("não deve fabricar fatores RUSLE nem solo quando linhaDeBase e solo forem indisponíveis e deve emitir censo de proveniência (Regra 1 e Regra 3)", () => {
    const base = criarPontoTeste("1", -25.14, -53.84, "erosao");
    const pontoIndisponivel: PontoAmostral = {
      ...base,
      solo: {
        ordem: { estado: "indisponivel", causa: "sem-cobertura", motivo: "Sem carta pedológica" },
        subOrdem: { estado: "indisponivel", causa: "sem-cobertura", motivo: "Sem carta pedológica" },
        grandeGrupo: { estado: "indisponivel", causa: "sem-cobertura", motivo: "Sem carta pedológica" },
        tipoUnidade: { estado: "indisponivel", causa: "sem-cobertura", motivo: "Sem carta pedológica" },
        confiancaPedologica: "indisponivel",
        erodibilidadeClasse: { estado: "indisponivel", causa: "sem-cobertura", motivo: "Sem carta pedológica" },
      },
      linhaDeBase: {
        fatorR: { estado: "indisponivel", causa: "decisao-pendente", motivo: "Aguarda D13" },
        fatorK: { estado: "indisponivel", causa: "insuficiente", motivo: "Sem erodibilidade" },
        fatorLS: { estado: "indisponivel", causa: "decisao-pendente", motivo: "Aguarda D15" },
        fatorC: { estado: "indisponivel", causa: "sem-cobertura", motivo: "Nuvem" },
        fatorP: { estado: "indisponivel", causa: "insuficiente", motivo: "Não informado" },
        perdaSolo: { estado: "indisponivel", causa: "decisao-pendente", motivo: "Retido Invariante 1" },
        memoriaCalculo: null,
      },
    };

    const csv = gerarCsvMatrizTreinamento([pontoIndisponivel], extrairMapaRotulos([pontoIndisponivel]));
    const linhas = csv.replace(/^\uFEFF/, "").split(/\r?\n/);
    const linhasDados = linhas.filter((l) => l.trim().length > 0 && !l.startsWith("#") && !l.startsWith("Ponto_ID,"));

    expect(linhasDados).toHaveLength(1);
    const linhaDado = linhasDados[0];

    expect(linhaDado).not.toContain("7500");
    expect(linhaDado).not.toContain("1.45");
    expect(linhaDado).not.toContain("0.0117");
    expect(linhaDado).not.toContain("0.12");
    expect(linhaDado).not.toContain("Latossolo Vermelho");
    expect(linhaDado).not.toContain("Baixa");

    expect(csv).toContain("RUSLE_Fator_R: 0/1 disponiveis");
  });

  it("A1: ponto sem rótulo em rotulosConsolidados não aparece nas linhas de dados do CSV e o censo registra a exclusão (Regra 4)", () => {
    const pontoSemRotulo: PontoAmostral = {
      ...criarPontoTeste("1", -25.14, -53.84, "erosao"),
      rotulo: undefined,
    };

    const csv = gerarCsvMatrizTreinamento([pontoSemRotulo], {});
    const linhas = csv.replace(/^\uFEFF/, "").split(/\r?\n/);
    const linhasDados = linhas.filter((l) => l.trim().length > 0 && !l.startsWith("#") && !l.startsWith("Ponto_ID,"));

    expect(linhasDados).toHaveLength(0);
    expect(csv).toContain("# EXCLUSOES DE ROTULAGEM (Regra 4) — 1 pontos recebidos, 0 emitidos");
    expect(csv).toContain("# sem rotulagem=1 | divergencia sem desempate=0");
  });

  it("A3: ponto com rotulo.final.classe = 'severa' emite Classe_Alvo_Binaria = 1 conforme a regra canônica (montagem.ts)", () => {
    const pontoSevera = criarPontoTeste("1", -25.14, -53.84, "severa");
    const csv = gerarCsvMatrizTreinamento([pontoSevera], extrairMapaRotulos([pontoSevera]));
    const linhas = csv.replace(/^\uFEFF/, "").split(/\r?\n/);
    const linhasDados = linhas.filter((l) => l.trim().length > 0 && !l.startsWith("#") && !l.startsWith("Ponto_ID,"));

    expect(linhasDados).toHaveLength(1);
    expect(linhasDados[0].endsWith(",severa,campo,1")).toBe(true);
    expect(csv).toContain("# Classe_Alvo_Binaria: 1/1 derivadas de observacao humana | erosao=1 | controle=0");
  });

  it("A4: ponto com modalidade = 'drone' é segregado por montarMatrizTreino (0 emitidos, registrado em # HELD-OUT DRONE) e assegurarSegregacaoTreino protege como pós-condição", () => {
    const pontoDrone = criarPontoTeste("1", -25.14, -53.84, "severa");
    const mapaDrone: Record<string, RotuloConsolidado> = {
      [pontoDrone.codigo]: {
        final: {
          classe: "severa",
          modalidade: "drone",
          observador: "Piloto VANT Spectral 2",
          observadoEm: "2026-03-10",
          confianca: "alta",
          cego: true,
        },
        origens: [],
        kappa: null,
        divergencia: "nenhuma",
        papelConjunto: "held-out",
      },
    };

    const csv = gerarCsvMatrizTreinamento([pontoDrone], mapaDrone);
    const linhas = csv.replace(/^\uFEFF/, "").split(/\r?\n/);
    const linhasDados = linhas.filter((l) => l.trim().length > 0 && !l.startsWith("#") && !l.startsWith("Ponto_ID,"));

    expect(linhasDados).toHaveLength(0);
    expect(csv).toContain("# HELD-OUT DRONE (D16): 1 pontos excluidos");
    expect(() => assegurarSegregacaoTreino("drone")).toThrow(/held-out/);
  });

  it("T1 (D4): coerência entre artefatos — totalAmostrasTreinamento do Arquivo 04 é idêntico ao número de linhas de dados emitidas no Arquivo 01 sob rotulagem parcial", async () => {
    const p1 = criarPontoTeste("1", -25.14, -53.84, "erosao");
    const p2 = criarPontoTeste("2", -25.15, -53.85, "ausente");
    const p3: PontoAmostral = { ...criarPontoTeste("3", -25.16, -53.86, "erosao"), rotulo: undefined };
    const p4: PontoAmostral = { ...criarPontoTeste("4", -25.17, -53.87, "ausente"), rotulo: undefined };
    const pontos = [p1, p2, p3, p4];
    // Rotulagem parcial: apenas p1 e p2 consolidados
    const mapaParcial = extrairMapaRotulos([p1, p2]);

    const pacote = await gerarConteudoPacoteReprodutibilidade(pontos, mapaParcial);
    const linhasArquivo01 = pacote.matrizTreinamentoCsv
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0 && !l.startsWith("#") && !l.startsWith("Ponto_ID,"));

    const datasheet = JSON.parse(pacote.datasheetJson);

    expect(datasheet.projeto.totalAmostrasRecebidas).toBe(4);
    expect(datasheet.projeto.totalAmostrasTreinamento).toBe(2);
    expect(datasheet.projeto.totalAmostrasTreinamento).toBe(linhasArquivo01.length);
  });
});
