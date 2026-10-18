import { describe, it, expect } from "vitest";
import {
  proximoIndiceFoco,
  deveFecharComTecla,
} from "./useModalA11y";
import { useSarelStore } from "@/store/useSarelStore";

describe("U02 — Lógica pura do hook useModalA11y (useModalA11y.ts)", () => {
  it("deve tratar ciclo de foco com Tab e Shift+Tab corretamente", () => {
    const total = 4;

    // Último elemento + Tab deve voltar ao primeiro (0)
    expect(proximoIndiceFoco(total, 3, false)).toBe(0);

    // Primeiro elemento + Shift+Tab deve ir ao último (3)
    expect(proximoIndiceFoco(total, 0, true)).toBe(3);

    // Avanço normal com Tab
    expect(proximoIndiceFoco(total, 1, false)).toBe(2);

    // Retrocesso normal com Shift+Tab
    expect(proximoIndiceFoco(total, 2, true)).toBe(1);

    // Lista vazia não quebra e retorna -1
    expect(proximoIndiceFoco(0, 0, false)).toBe(-1);
    expect(proximoIndiceFoco(0, 0, true)).toBe(-1);

    // Índice fora dos limites é normalizado com segurança
    expect(proximoIndiceFoco(total, -1, false)).toBe(0);
    expect(proximoIndiceFoco(total, 10, true)).toBe(3);
  });

  it("deve reconhecer tecla Escape para fechar modal", () => {
    expect(deveFecharComTecla("Escape")).toBe(true);
    expect(deveFecharComTecla("Enter")).toBe(false);
    expect(deveFecharComTecla("Tab")).toBe(false);
    expect(deveFecharComTecla(" ")).toBe(false);
  });
});

describe("U02 — Tour/Modo Defesa: encerramento sem persistência de banner residual", () => {
  it("ao fechar a modal metodológica, o modo apresentação deve ser desativado para não manter o banner na tela", () => {
    const store = useSarelStore.getState();
    store.iniciarTour();
    expect(useSarelStore.getState().modoApresentacaoAtivo).toBe(true);
    expect(useSarelStore.getState().modalMetodologiaAberta).toBe(true);

    // Fecha a modal metodológica
    useSarelStore.getState().fecharModalMetodologia();

    // Banner 'MODO DEFESA / APRESENTAÇÃO ATIVO' não pode persistir
    expect(useSarelStore.getState().modoApresentacaoAtivo).toBe(false);
    expect(useSarelStore.getState().modalMetodologiaAberta).toBe(false);
  });
});
