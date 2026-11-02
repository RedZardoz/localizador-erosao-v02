import { describe, it, expect } from "vitest";
import {
  calcularNdvi,
  calcularBsi,
  definirJanelasModelo,
  filtrarSeriePorJanela,
  contarObservacoesValidas,
  ObservacaoCena,
} from "./serieTemporal";

describe("A-08 / Regras 1 e 2 — NDVI e BSI nao fabricam valor nem cortam dominio", () => {
  it("retorna null, nao 0, quando o denominador do NDVI e nulo", () => {
    // B8 == -B4 anula a soma: sem NDVI calculavel. Um 0 aqui seria indistinguivel de B8 == B4.
    expect(calcularNdvi(0, 0)).toBeNull();
    expect(calcularNdvi(0.2, -0.2)).toBeNull();
  });

  it("retorna null, nao 0, quando o denominador do BSI e nulo", () => {
    expect(calcularBsi(0, 0, 0, 0)).toBeNull();
    // (B11 + B4) == -(B8 + B2) anula o denominador.
    expect(calcularBsi(0.3, 0.1, -0.3, -0.1)).toBeNull();
  });

  it("retorna null para NDVI fora do dominio [-1, 1], em vez de truncar", () => {
    // Banda negativa (artefato de correcao atmosferica) empurra a razao fora do dominio fisico.
    const fora = calcularNdvi(1, -3);
    expect(fora).toBeNull();
  });

  it("retorna null para BSI fora do dominio [-1, 1], em vez de truncar", () => {
    const fora = calcularBsi(1, 1, -3, 0);
    expect(fora).toBeNull();
  });

  it("preserva o zero legitimo, quando B8 e B4 sao iguais e nao nulos", () => {
    // Este e o caso que o retorno fabricado tornava ambiguo: NDVI 0 observado de verdade.
    expect(calcularNdvi(0.25, 0.25)).toBe(0);
  });
});

describe("Cálculo de Índices Espectrais (NDVI e BSI)", () => {
  it("deve calcular NDVI corretamente para bandas válidas", () => {
    // b8 = 0.4, b4 = 0.1 -> (0.4 - 0.1) / (0.4 + 0.1) = 0.3 / 0.5 = 0.6
    expect(calcularNdvi(0.4, 0.1)).toBe(0.6);
  });

  it("deve retornar null se qualquer banda for mascarada (Regra 7)", () => {
    expect(calcularNdvi(null, 0.1)).toBeNull();
    expect(calcularNdvi(0.4, null)).toBeNull();
    expect(calcularNdvi(null, null)).toBeNull();
  });

  it("deve calcular BSI corretamente para as 4 bandas", () => {
    // B11 = 0.3, B4 = 0.2, B8 = 0.15, B2 = 0.1
    // ((0.3 + 0.2) - (0.15 + 0.1)) / ((0.3 + 0.2) + (0.15 + 0.1)) = (0.5 - 0.25) / (0.5 + 0.25) = 0.25 / 0.75 = 0.3333
    const bsi = calcularBsi(0.3, 0.2, 0.15, 0.1);
    expect(bsi).toBeCloseTo(0.3333, 3);
  });

  it("deve retornar null para BSI se faltar qualquer banda", () => {
    expect(calcularBsi(null, 0.2, 0.15, 0.1)).toBeNull();
    expect(calcularBsi(0.3, null, 0.15, 0.1)).toBeNull();
    expect(calcularBsi(0.3, 0.2, null, 0.1)).toBeNull();
    expect(calcularBsi(0.3, 0.2, 0.15, null)).toBeNull();
  });
});

describe("Separação de Janelas por Modelo (Decisão D04)", () => {
  it("deve separar a janela do Modelo D e Modelo P com intervalo de guarda", () => {
    const janelas = definirJanelasModelo("2026-05-15", 2, 3);

    // Modelo D: 3 anos até a data do rótulo (2023-05-15 a 2026-05-15)
    expect(janelas.modeloD.fim).toBe("2026-05-15");
    expect(janelas.modeloD.inicio).toBe("2023-05-15");

    // Modelo P: termina 2 anos antes (2024-05-15), cobrindo 3 anos (2021-05-15 a 2024-05-15)
    expect(janelas.modeloP.fim).toBe("2024-05-15");
    expect(janelas.modeloP.inicio).toBe("2021-05-15");
  });

  it("deve filtrar as cenas que pertencem estritamente à janela", () => {
    const cenas: ObservacaoCena[] = [
      {
        data: "2020-01-01",
        tAnos: 2020.0,
        productId: "CENA_1",
        nuvemSombra: false,
        b2: 0.1, b3: 0.1, b4: 0.1, b5: 0.1, b6: 0.1, b7: 0.1, b8: 0.1, b8a: 0.1, b11: 0.1, b12: 0.1,
      },
      {
        data: "2022-06-01",
        tAnos: 2022.41,
        productId: "CENA_2",
        nuvemSombra: false,
        b2: 0.1, b3: 0.1, b4: 0.1, b5: 0.1, b6: 0.1, b7: 0.1, b8: 0.1, b8a: 0.1, b11: 0.1, b12: 0.1,
      },
      {
        data: "2025-01-01",
        tAnos: 2025.0,
        productId: "CENA_3",
        nuvemSombra: false,
        b2: 0.1, b3: 0.1, b4: 0.1, b5: 0.1, b6: 0.1, b7: 0.1, b8: 0.1, b8a: 0.1, b11: 0.1, b12: 0.1,
      },
    ];

    const filtradasP = filtrarSeriePorJanela(cenas, { inicio: "2021-01-01", fim: "2024-01-01" });
    expect(filtradasP.length).toBe(1);
    expect(filtradasP[0].productId).toBe("CENA_2");
  });

  it("deve contar observações válidas descontando nuvens e nulos", () => {
    const cenas: ObservacaoCena[] = [
      {
        data: "2024-01-01",
        tAnos: 2024.0,
        productId: "CENA_1",
        nuvemSombra: false,
        b2: 0.1, b3: 0.1, b4: 0.1, b5: 0.1, b6: 0.1, b7: 0.1, b8: 0.1, b8a: 0.1, b11: 0.1, b12: 0.1,
      },
      {
        data: "2024-02-01",
        tAnos: 2024.08,
        productId: "CENA_2",
        nuvemSombra: true, // Mascarado por nuvem
        b2: 0.1, b3: 0.1, b4: 0.1, b5: 0.1, b6: 0.1, b7: 0.1, b8: 0.1, b8a: 0.1, b11: 0.1, b12: 0.1,
      },
      {
        data: "2024-03-01",
        tAnos: 2024.16,
        productId: "CENA_3",
        nuvemSombra: false,
        b2: 0.1, b3: 0.1, b4: null, b5: 0.1, b6: 0.1, b7: 0.1, b8: 0.1, b8a: 0.1, b11: 0.1, b12: 0.1,
      },
    ];

    const contagens = contarObservacoesValidas(cenas);
    expect(contagens["B2"]).toBe(2); // Cenas 1 e 3
    expect(contagens["B4"]).toBe(1); // Somente Cena 1 (Cena 2 é nuvem, Cena 3 é null)
  });
});
