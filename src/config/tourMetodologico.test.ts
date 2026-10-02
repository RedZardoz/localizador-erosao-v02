import { describe, it, expect } from "vitest";
import {
  CATALOGO_METODOLOGICO,
  PASSOS_TOUR_APRESENTACAO,
  obterItemMetodologico,
} from "./tourMetodologico";

describe("Catálogo do Modo de Apresentação e Tour Metodológico", () => {
  it("deve conter todos os passos listados na tour ordenada", () => {
    expect(PASSOS_TOUR_APRESENTACAO.length).toBeGreaterThanOrEqual(10);

    for (const passoId of PASSOS_TOUR_APRESENTACAO) {
      const item = obterItemMetodologico(passoId);
      expect(item, `Passo '${passoId}' não encontrado no catálogo`).toBeDefined();
      expect(item?.id).toBe(passoId);
    }
  });

  it("cada item do catálogo deve conter todos os blocos científicos canônicos", () => {
    for (const [id, item] of Object.entries(CATALOGO_METODOLOGICO)) {
      expect(item.id).toBe(id);
      expect(item.titulo).toBeTruthy();
      expect(item.modulo).toBeTruthy();
      expect(item.oQueFaz).toBeTruthy();
      expect(item.comoUsar).toBeTruthy();
      expect(item.comoFunciona).toBeTruthy();

      // Bloco do Cálculo Canônico
      expect(item.calculo).toBeDefined();
      expect(item.calculo.nome).toBeTruthy();
      expect(item.calculo.formulaTex).toBeTruthy();
      expect(item.calculo.formulaDescritiva).toBeTruthy();
      expect(item.calculo.variaveis.length).toBeGreaterThan(0);

      // Bloco do Script Executado
      expect(item.script).toBeDefined();
      expect(item.script.codigo).toBeTruthy();
      expect(item.script.linguagem).toMatch(/^(typescript|python-gee|sql)$/);

      // Referência Bibliográfica
      expect(item.referencia).toBeTruthy();
    }
  });
});
