import { describe, expect, it } from "vitest";
import {
  CAMPOS_PROIBIDOS_MATRIZ_TREINO,
  montarMatrizTreino,
  verificarCamposProibidos,
} from "./montagem";
import { PontoAmostral } from "@/types/ponto";
import { RotuloConsolidado } from "@/types/rotulo";

describe("Montagem da Matriz de Treino (§11.5 e Regra 4)", () => {
  function criarPontoMock(
    idNum: number,
    classeRotulo: "ausente" | "incipiente" | "moderada" | "severa" = "moderada"
  ): PontoAmostral {
    return {
      id: `uuid-ponto-${idNum}`,
      codigo: `PR-2026-${String(idNum).padStart(4, "0")}`,
      latitude: -25.42 + idNum * 0.01,
      longitude: -49.27 + idNum * 0.01,
      blocoEspacial: `BLOCO_R${idNum % 3}_C${idNum % 2}`,
      estratoId: `ESTRATO_S${(idNum % 3) + 1}_E${(idNum % 3) + 1}_K${(idNum % 2) + 1}`,
      criterioSelecao: {
        phiDiag: 0.45 + (idNum % 10) * 0.03,
        tercilS: 2,
        tercilE: 1,
        nivelK: 2,
      },
      terreno: {
        elevacao: { valor: 850 + idNum, estado: "medido", fonte: "Copernicus DEM 30m", adquiridoEm: "2026-01-01" },
        declividadePct: { valor: 8.5 + (idNum % 5), estado: "medido", fonte: "Copernicus DEM 30m", adquiridoEm: "2026-01-01" },
        declividadeGraus: { valor: 4.8 + (idNum % 3), estado: "medido", fonte: "Copernicus DEM 30m", adquiridoEm: "2026-01-01" },
        curvaturaPerfil: { valor: 0.01 * idNum, estado: "medido", fonte: "Copernicus DEM 30m", adquiridoEm: "2026-01-01" },
        curvaturaPlana: { valor: -0.01 * idNum, estado: "medido", fonte: "Copernicus DEM 30m", adquiridoEm: "2026-01-01" },
        acumuloFluxo: { valor: 120 + idNum * 10, estado: "medido", fonte: "Copernicus DEM 30m", adquiridoEm: "2026-01-01" },
        twi: { valor: 6.2 + (idNum % 2), estado: "medido", fonte: "Copernicus DEM 30m", adquiridoEm: "2026-01-01" },
      },
      solo: {
        ordem: { valor: "Latossolo", estado: "tabelado", tabela: "Embrapa GeoInfo", chave: "LV" },
        subOrdem: { valor: "Vermelho", estado: "tabelado", tabela: "Embrapa GeoInfo", chave: "LVd" },
        grandeGrupo: { valor: "Distrófico", estado: "medido", fonte: "Campo", adquiridoEm: "2026-01-01" },
        tipoUnidade: { valor: "simples", estado: "tabelado", tabela: "Embrapa GeoInfo", chave: "simples" },
        confiancaPedologica: "alta",
        erodibilidadeClasse: { valor: "moderada", estado: "tabelado", tabela: "Embrapa", chave: "moderada" },
      },
      serie: {
        janela: { inicio: "2023-01-01", fim: "2025-12-31" },
        nObservacoesValidas: 42,
        harmonicos: {
          B12_amplitude: { valor: 0.15 + (idNum % 4) * 0.02, estado: "modelado", modelo: "OLS Harmonico", insumos: ["B12"] },
          B12_tendencia: { valor: 0.002, estado: "modelado", modelo: "OLS Harmonico", insumos: ["B12"] },
        },
        frequenciaSoloNu: { valor: 0.28 + (idNum % 5) * 0.05, estado: "medido", fonte: "Sentinel-2", adquiridoEm: "2026-01-01" },
        compostoSoloNu: {
          B2: { valor: 0.08, estado: "medido", fonte: "Sentinel-2", adquiridoEm: "2026-01-01" },
          B4: { valor: 0.14, estado: "medido", fonte: "Sentinel-2", adquiridoEm: "2026-01-01" },
        },
      },
      chuva: {
        precipAcum30d: { valor: 180 + idNum * 5, estado: "medido", fonte: "CHIRPS", adquiridoEm: "2026-01-01" },
        precipAcum90d: { valor: 450 + idNum * 10, estado: "medido", fonte: "CHIRPS", adquiridoEm: "2026-01-01" },
        i30Max: { valor: 32 + idNum, estado: "medido", fonte: "GPM IMERG", adquiridoEm: "2026-01-01" },
        nEventosErosivos: { valor: 3 + (idNum % 3), estado: "medido", fonte: "GPM IMERG", adquiridoEm: "2026-01-01" },
        indiceMecanismo: { valor: 85 + idNum * 2, estado: "modelado", modelo: "Calculado", insumos: ["chuva", "soloNu"] },
      },
      rusle: {
        fatorR: { valor: 6500, estado: "modelado", modelo: "RUSLE", insumos: ["chuva"] },
        fatorK: { valor: 0.02, estado: "modelado", modelo: "RUSLE", insumos: ["solo"] },
        fatorLS: { valor: 2.1, estado: "modelado", modelo: "RUSLE", insumos: ["terreno"] },
        fatorC: { valor: 0.15, estado: "modelado", modelo: "RUSLE", insumos: ["serie"] },
        fatorP: { valor: 1.0, estado: "modelado", modelo: "RUSLE", insumos: ["praticas"] },
        perdaSolo: { valor: 4.2, estado: "modelado", modelo: "RUSLE", insumos: ["R", "K", "LS", "C", "P"] },
        memoriaCalculo: "R*K*LS*C*P",
      },
      fundiario: {
        status: "encontrado",
        codigoCar: "PR-4106902-CAR123456",
        titularMascarado: "JOAO **********",
        documentoMascarado: "***.123.456-**",
      },
      rotulo: {
        classe: classeRotulo,
        modalidade: "campo",
        observador: "Pesquisador Mestrado",
        observadoEm: "2026-05-18",
        cego: true,
      },
    };
  }

  it("REGRA 4: nenhuma coluna proibida entra na matriz de treino", () => {
    const pontos = [
      criarPontoMock(1, "ausente"),
      criarPontoMock(2, "moderada"),
      criarPontoMock(3, "severa"),
    ];

    const resultado = montarMatrizTreino(pontos);

    expect(resultado.linhas.length).toBe(3);

    // Verificar linha por linha
    for (const linha of resultado.linhas) {
      const chaves = Object.keys(linha);

      for (const proibido of CAMPOS_PROIBIDOS_MATRIZ_TREINO) {
        expect(chaves).not.toContain(proibido);
      }

      // Verificação específica dos 5 fatores da RUSLE e perda de solo
      expect(chaves).not.toContain("fatorR");
      expect(chaves).not.toContain("fatorK");
      expect(chaves).not.toContain("fatorLS");
      expect(chaves).not.toContain("fatorC");
      expect(chaves).not.toContain("fatorP");
      expect(chaves).not.toContain("perdaSolo");

      // Verificação dos critérios internos de amostragem
      expect(chaves).not.toContain("phiDiag");
      expect(chaves).not.toContain("estratoId");

      // Verificação cadastral fundiária
      expect(chaves).not.toContain("codigoCar");
      expect(chaves).not.toContain("titularMascarado");
    }

    // A auditoria deve atestar explicitamente todas as colunas ausentes
    expect(resultado.metadados.colunasProibidasVerificadasAusentes.length).toBeGreaterThan(15);
  });

  it("garante a presença obrigatória do blocoEspacial para CV espacial independente (Roberts et al., 2017)", () => {
    const pontos = [criarPontoMock(1), criarPontoMock(2)];
    const resultado = montarMatrizTreino(pontos);

    for (const linha of resultado.linhas) {
      expect(linha.blocoEspacial).toBeDefined();
      expect(typeof linha.blocoEspacial).toBe("string");
      expect(linha.blocoEspacial).toMatch(/^BLOCO_R\d+_C\d+$/);
    }
  });

  it("mapeia rótulos ordinais e binários corretamente", () => {
    const pontos = [
      criarPontoMock(1, "ausente"),
      criarPontoMock(2, "incipiente"),
      criarPontoMock(3, "moderada"),
      criarPontoMock(4, "severa"),
    ];

    const resultado = montarMatrizTreino(pontos);
    expect(resultado.linhas[0].rotuloBinario).toBe(0); // ausente -> 0
    expect(resultado.linhas[1].rotuloBinario).toBe(0); // incipiente -> 0
    expect(resultado.linhas[2].rotuloBinario).toBe(1); // moderada -> 1
    expect(resultado.linhas[3].rotuloBinario).toBe(1); // severa -> 1
  });

  it("permite excluir a classe intermediária ambígua ('incipiente') para afiar fronteira (§3 da Etapa 0)", () => {
    const pontos = [
      criarPontoMock(1, "ausente"),
      criarPontoMock(2, "incipiente"),
      criarPontoMock(3, "moderada"),
    ];

    const resultado = montarMatrizTreino(pontos, undefined, { excluirAmbigua: true });
    expect(resultado.linhas.length).toBe(2);
    expect(resultado.linhas.map((l) => l.rotuloClasse)).toEqual(["ausente", "moderada"]);
    expect(resultado.metadados.avisos.some((a) => a.includes("incipiente"))).toBe(true);
  });

  it("exclui pontos com divergência de rótulo pendente", () => {
    const ponto = criarPontoMock(1);
    const rotuloPendente: RotuloConsolidado = {
      final: ponto.rotulo!,
      origens: [ponto.rotulo!],
      divergencia: "pendente",
    };

    const resultado = montarMatrizTreino([ponto], { [ponto.codigo]: rotuloPendente }, {
      excluirDivergenciasPendentes: true,
    });

    expect(resultado.linhas.length).toBe(0);
    expect(resultado.metadados.avisos.some((a) => a.includes("divergência pendente"))).toBe(true);
  });

  it("bloqueia terminantemente pontos sintéticos (corrige I2)", () => {
    const pontoSintetico = {
      ...criarPontoMock(1),
      origemSintetica: true,
    };

    expect(() => montarMatrizTreino([pontoSintetico])).toThrow(
      /ponto\(s\) sintético\(s\)/
    );
  });

  it("bloqueia terminantemente rótulos de drone no conjunto de treino (Fase D / Held-out)", () => {
    const pontoComDrone = {
      ...criarPontoMock(1),
      rotulo: {
        classe: "severa" as const,
        modalidade: "drone" as const,
        observador: "Piloto Drone",
        observadoEm: "2026-05-20",
        cego: true,
      },
    };

    expect(() => montarMatrizTreino([pontoComDrone])).toThrow(
      /VIOLAÇÃO DE SEGREGAÇÃO METODOLÓGICA/
    );
  });

  it("verificarCamposProibidos lança erro explícito se campo proibido for injetado", () => {
    const linhaInjetada = {
      pontoId: "id-1",
      codigo: "PR-2026-0001",
      blocoEspacial: "BLOCO_R01_C01",
      phiDiag: 0.5, // PROIBIDO
    } as any;

    expect(() => verificarCamposProibidos([linhaInjetada])).toThrow(
      /VIOLAÇÃO DA REGRA 4 DA LEI FUNDAMENTAL/
    );
  });
});
