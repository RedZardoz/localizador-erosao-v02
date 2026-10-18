import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
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

describe("U02 — Estrutura e conformidade dos 12 componentes analisados", () => {
  // Lista fechada dos 11 componentes que são ou contêm diálogos modais interativos
  const COMPONENTES_MODAIS = [
    "src/components/config/SettingsModal.tsx",
    "src/components/matriz/PainelMatrizModal.tsx",
    "src/components/campanha/PainelCampanhaModal.tsx",
    "src/components/export/ExportModal.tsx",
    "src/components/audit/AuditDossierModal.tsx",
    "src/components/diagnostics/SystemLogsModal.tsx",
    "src/components/decisoes/DecisoesModal.tsx",
    "src/components/region/CandidateSelectionModal.tsx",
    "src/components/region/RegionRequestModal.tsx",
    "src/components/presentation/ModalExplicativaMetodologica.tsx",
    "src/components/polygon/DrawingToolbar.tsx",
  ];

  // Componente excluído com motivo documentado (R16)
  const EXCLUSOES = [
    {
      arquivo: "src/components/presentation/ApresentacaoSpotlight.tsx",
      motivo:
        "Sobreposição visual passiva SVG com pointer-events-none (efeito holofote no mapa), sem controles interativos ou diálogo; o diálogo correspondente é ModalExplicativaMetodologica",
    },
  ];

  it("cada um dos 11 componentes de diálogo deve importar useModalA11y e conter role='dialog', aria-modal='true' e aria-labelledby", () => {
    for (const relPath of COMPONENTES_MODAIS) {
      const fullPath = path.resolve(process.cwd(), relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, "utf8");

      expect(content, `${relPath} deve importar useModalA11y`).toContain("useModalA11y");
      expect(content, `${relPath} deve conter role="dialog"`).toMatch(/role="dialog"/);
      expect(content, `${relPath} deve conter aria-modal="true"`).toMatch(/aria-modal="true"/);
      expect(content, `${relPath} deve conter aria-labelledby`).toMatch(/aria-labelledby=/);
    }
  });

  it("o componente excluído não deve ser marcado como dialog e deve possuir justificativa válida", () => {
    for (const { arquivo, motivo } of EXCLUSOES) {
      const fullPath = path.resolve(process.cwd(), arquivo);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, "utf8");
      expect(content).not.toMatch(/role="dialog"/);
      expect(motivo.length).toBeGreaterThan(20);
    }
  });

  it("o efeito do hook não depende de `fechar` (função nova a cada render roubaria o foco de quem digita)", () => {
    // Regressão medida no navegador: com `fechar` nas dependências, cada re-render devolvia o foco
    // ao botão de origem e o movia ao primeiro elemento do modal, e o campo perdia o foco a cada tecla.
    // O repositório não tem jsdom; a digitação em campo é verificada com Playwright fora do repo.
    const fonte = fs.readFileSync(path.resolve(__dirname, "useModalA11y.ts"), "utf8");
    const m = fonte.match(/\}, \[([^\]]*)\]\);\s*\}\s*$/);
    expect(m).not.toBeNull();
    const deps = m![1].split(",").map((x) => x.trim()).filter(Boolean);
    expect(deps).toEqual(["aberto", "containerRef"]);
    expect(deps).not.toContain("fechar");
  });
});
