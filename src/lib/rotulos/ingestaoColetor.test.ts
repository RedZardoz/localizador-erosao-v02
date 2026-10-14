import { describe, it, expect } from "vitest";
import {
  ingestarSubmissoesSarelColetor,
  gerarTemplateSarelColetorCsv,
  COLUNAS_CANONICAS_SAREL_COLETOR,
} from "./ingestaoColetor";

describe("Ingestão SAREL Coletor (Fase B / D16)", () => {
  const coordenadasEsperadas = {
    "PONTO-01": { codigo: "PONTO-01", latitude: -24.850000, longitude: -54.050000 },
    "PONTO-02": { codigo: "PONTO-02", latitude: -24.860000, longitude: -54.060000 },
  };

  it("gera template CSV com as 28 colunas canônicas separadas por ponto-e-vírgula", () => {
    const csv = gerarTemplateSarelColetorCsv([
      { codigo: "PONTO-01", latitude: -24.85, longitude: -54.05 },
    ]);
    expect(csv).toContain(COLUNAS_CANONICAS_SAREL_COLETOR.join(";"));
    expect(csv).toContain("PONTO-01");
    expect(csv).toContain("-24.850000;-54.050000");
  });

  it("ingesta CSV com 28 colunas com sucesso e avalia critério P03 e alvo contínuo D26", () => {
    const cabecalho = [...COLUNAS_CANONICAS_SAREL_COLETOR, "fracaoErodida"].join(";");
    const linha1 = "PONTO-01;erosao;alta;campo;Perito A;2026-10-02;2026-10-02T10:00:00Z;-24.850050;-54.050050;350;1.8;7.5;true;true;false;false;18;false;true;false;spd;85;true;bom;em_nivel;presença de sulcos;;;0.35";

    const csv = `${cabecalho}\n${linha1}`;
    const res = ingestarSubmissoesSarelColetor(csv, coordenadasEsperadas);

    expect(res.totalProcessados).toBe(1);
    expect(res.aceitos).toHaveLength(1);
    expect(res.rejeitados).toHaveLength(0);

    const item = res.aceitos[0];
    expect(item.pontoCodigo).toBe("PONTO-01");
    expect(item.rotulo.classe).toBe("erosao");
    expect(item.rotulo.modalidade).toBe("campo");
    expect(item.rotulo.cego).toBe(true);
    expect(item.qualidadeP03).toBe("aceito"); // desvio pequeno < 15 m
    expect(item.rotulo.fracaoErodida).toBe(0.35); // fallback erosao
    expect(item.rotulo.alvoBinarioDerivado).toBe(1);
  });

  it("rejeita compulsoriamente posições com fix_simulado (P12 / Invariante 5)", () => {
    // Teste 1: via objeto estruturado
    const resObj = ingestarSubmissoesSarelColetor(
      [
        {
          codigoPonto: "PONTO-01",
          classe: "erosao",
          latitude: -24.850000,
          longitude: -54.050000,
          fix_simulado: true,
        },
      ],
      coordenadasEsperadas
    );
    expect(resObj.aceitos).toHaveLength(0);
    expect(resObj.rejeitados).toHaveLength(1);
    expect(resObj.rejeitados[0].motivo).toContain("Coordenada GPS mockada ou simulada detectada");

    // Teste 2: via CSV formatado
    const colunas = [...COLUNAS_CANONICAS_SAREL_COLETOR, "fix_simulado"];
    const valores = [
      "PONTO-01", "erosao", "alta", "campo", "Perito A", "2026-10-02", "2026-10-02T10:00:00Z",
      "-24.850000", "-54.050000", "350", "1.8", "0", "true", "true",
      "", "", "", "", "", "", "", "", "", "", "", "", "", "", // 14 campos vazios de foto/manejo
      "true" // fix_simulado
    ];
    const csv = `${colunas.join(";")}\n${valores.join(";")}`;
    const resCsv = ingestarSubmissoesSarelColetor(csv, coordenadasEsperadas);
    expect(resCsv.aceitos).toHaveLength(0);
    expect(resCsv.rejeitados).toHaveLength(1);
    expect(resCsv.rejeitados[0].motivo).toContain("Coordenada GPS mockada ou simulada detectada");
  });

  it("rejeita desvio geodésico excessivo (> 25 m) para proteger pixel adjacente", () => {
    const cabecalho = COLUNAS_CANONICAS_SAREL_COLETOR.join(";");
    // Coordenada ~100m de distância
    const linha = "PONTO-01;erosao;alta;campo;Perito A;2026-10-02;2026-10-02T10:00:00Z;-24.851000;-54.051000;350;1.8;120;false;true;;;;;;;;;;;;;;";

    const csv = `${cabecalho}\n${linha}`;
    const res = ingestarSubmissoesSarelColetor(csv, coordenadasEsperadas);

    expect(res.aceitos).toHaveLength(0);
    expect(res.rejeitados).toHaveLength(1);
    expect(res.rejeitados[0].motivo).toContain("Desvio geodésico excessivo");
  });
});
