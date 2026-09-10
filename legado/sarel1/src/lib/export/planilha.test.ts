import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import {
  gerarPlanilhaXLSX,
  gerarPlanilhaCSV,
  extrairLinhasAbaDados,
  calcularQualidadeDosDados,
} from "./planilha";
import { PontoAmostral } from "@/types/ponto";

function gerarPontoTeste(index: number, declividade: number = 3.5 + (index * 0.5)): PontoAmostral {
  const declivGraus = Math.atan(declividade / 100) * (180 / Math.PI);
  return {
    id: `real-uuid-${index}`,
    codigo: `PR-2026-${String(index).padStart(4, "0")}`,
    latitude: -25.0 - (index * 0.01),
    longitude: -53.0 - (index * 0.01),
    blocoEspacial: `BLOCO_${index % 3}`,
    estratoId: `E${(index % 6) + 1}`,
    criterioSelecao: { phiDiag: 0.2 + (index * 0.02) },
    terreno: {
      elevacao: { estado: "medido", valor: 450 + index * 5, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      declividadePct: { estado: "medido", valor: declividade, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      declividadeGraus: { estado: "modelado", valor: Number(declivGraus.toFixed(2)), modelo: "atan", insumos: ["declividadePct"] },
      curvaturaPerfil: { estado: "medido", valor: ((index % 7) - 3) * 0.001, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      curvaturaPlana: { estado: "medido", valor: ((index % 5) - 2) * 0.001, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      acumuloFluxo: { estado: "medido", valor: 1200 + index * 25, fonte: "COPERNICUS/DEM/GLO30", adquiridoEm: "2026-09-08" },
      twi: { estado: "modelado", valor: 5.5 + (index % 6) * 0.4, modelo: "ln(As/tan(beta))", insumos: ["acumuloFluxo"] },
    },
    solo: {
      ordem: { estado: "medido", valor: "LATOSSOLO", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
      subOrdem: { estado: "medido", valor: "VERMELHO", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
      grandeGrupo: { estado: "medido", valor: "Distrofico", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
      tipoUnidade: { estado: "medido", valor: "simples", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
      confiancaPedologica: "alta",
      erodibilidadeClasse: { estado: "medido", valor: "Media", fonte: "Embrapa GeoInfo", adquiridoEm: "2026-09-08" },
    },
    serie: {
      janela: { inicio: "2019-01-01", fim: "2025-12-31" },
      nObservacoesValidas: 380 + index,
      harmonicos: {},
      frequenciaSoloNu: { estado: "medido", valor: 0.10 + (index % 15) * 0.02, fonte: "Sentinel-2", adquiridoEm: "2026-09-08" },
      compostoSoloNu: {},
    },
    chuva: {
      precipAcum30d: { estado: "medido", valor: 110 + index * 3, fonte: "CHIRPS", adquiridoEm: "2026-09-08" },
      precipAcum90d: { estado: "medido", valor: 390 + index * 4, fonte: "CHIRPS", adquiridoEm: "2026-09-08" },
      i30Max: { estado: "medido", valor: 25 + (index % 12) * 1.5, fonte: "GPM IMERG", adquiridoEm: "2026-09-08" },
      nEventosErosivos: { estado: "medido", valor: 3 + (index % 4), fonte: "GPM IMERG", adquiridoEm: "2026-09-08" },
      indiceMecanismo: { estado: "modelado", valor: 10.5 + index * 1.2, modelo: "Sigma", insumos: [] },
    },
    auditoria: {
      municipio: "Londrina",
      uf: "PR",
      macrorregiao: "Norte Central Paranaense",
      baciaHidrografica: "Bacia do Rio Tibagi",
    },
  };
}

describe("Exportação de Planilha XLSX e CSV (src/lib/export/planilha)", () => {
  it("preserva zero legítimo como 0 e célula ausente como vazia", () => {
    const p = gerarPontoTeste(1);
    p.terreno.curvaturaPerfil = { estado: "medido", valor: 0.0, fonte: "DEM", adquiridoEm: "2026-09-08" };
    p.terreno.twi = { estado: "indisponivel", motivo: "Não calculado" };

    const linhas = extrairLinhasAbaDados([p]);
    expect(linhas[0].Curvatura_Perfil).toBe(0); // ZERO preservado
    expect(linhas[0].TWI).toBe(""); // Ausente vira vazio, NUNCA 0
    expect(linhas[0].TWI_Origem).toContain("indisponível");
  });

  it("omite estratoId e colunas de predição quando em modo cego", () => {
    const p = gerarPontoTeste(1);
    const linhasNormal = extrairLinhasAbaDados([p], false);
    const linhasCego = extrairLinhasAbaDados([p], true);

    expect(linhasNormal[0].Estrato_ID).toBe("E2");
    expect(linhasCego[0].Estrato_ID).toBeUndefined();
  });

  it("calcula corretamente o resumo de qualidade para a Aba 3", () => {
    const pontos = Array.from({ length: 10 }, (_, i) => gerarPontoTeste(i));
    const qualidade = calcularQualidadeDosDados(pontos);
    const itemElevacao = qualidade.find(q => q.variavel.includes("Elevação"));
    expect(itemElevacao?.pctMedido).toBe(100);
    expect(itemElevacao?.pctIndisponivel).toBe(0);
  });

  it("gera arquivo XLSX válido contendo exatamente as 3 abas especificadas", async () => {
    const pontos = Array.from({ length: 22 }, (_, i) => gerarPontoTeste(i));
    const buffer = await gerarPlanilhaXLSX(pontos);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    expect(wb.worksheets).toHaveLength(3);
    expect(wb.worksheets[0].name).toBe("Dados");
    expect(wb.worksheets[1].name).toBe("Procedência e Conformidade");
    expect(wb.worksheets[2].name).toBe("Qualidade do Dado");

    // Verificar cabeçalho da Aba 1
    const sheetDados = wb.getWorksheet("Dados");
    const row1 = sheetDados?.getRow(1);
    expect(row1?.getCell(1).value).toBe("Codigo");
    expect(row1?.getCell(2).value).toBe("Latitude");
    expect(row1?.getCell(3).value).toBe("Longitude");

    // Verificar bloco LGPD na Aba 2
    const sheetProc = wb.getWorksheet("Procedência e Conformidade");
    const textoProc = sheetProc?.getSheetValues().toString();
    expect(textoProc).toContain("BASES DISPONÍVEIS NESTA INSTALAÇÃO");
    expect(textoProc).toContain("LGPD");
  });

  it("gera CSV com UTF-8 BOM, bloco LGPD no cabeçalho e delimitador sincronizado", () => {
    const pontos = Array.from({ length: 22 }, (_, i) => gerarPontoTeste(i));
    const csv = gerarPlanilhaCSV(pontos);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("# FUNDAMENTAÇÃO LGPD (Lei 13.709/2018):");
    expect(csv).toContain("Codigo;Latitude;Longitude");
    expect(csv).toContain("PR-2026-0001");
  });

  it("bloqueia exportação se contiver ponto sintético", async () => {
    const pontos = Array.from({ length: 22 }, (_, i) => gerarPontoTeste(i));
    pontos[0].origemSintetica = true; // Ponto sintético!

    await expect(gerarPlanilhaXLSX(pontos)).rejects.toThrow(/ponto\(s\) sintético\(s\)/);
    expect(() => gerarPlanilhaCSV(pontos)).toThrow(/ponto\(s\) sintético\(s\)/);
  });
});
