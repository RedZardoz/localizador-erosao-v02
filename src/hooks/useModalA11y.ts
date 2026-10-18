import { useEffect, useRef } from "react";

export interface UseModalA11yOptions {
  aberto: boolean;
  fechar: () => void;
  containerRef: React.RefObject<HTMLElement | null>;
  restaurarFoco?: boolean;
}

/**
 * Função pura que calcula o próximo índice de foco navegável com Tab / Shift+Tab.
 */
export function proximoIndiceFoco(
  total: number,
  atual: number,
  shift: boolean
): number {
  if (total <= 0) return -1;
  if (shift) {
    if (atual <= 0 || atual >= total) return total - 1;
    return atual - 1;
  }
  if (atual >= total - 1 || atual < 0) return 0;
  return atual + 1;
}

/**
 * Função pura que decide se a tecla pressionada deve fechar o diálogo modal.
 */
export function deveFecharComTecla(key: string): boolean {
  return key === "Escape";
}

const SELETOR_FOCAVEIS =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function obterElementosFocaveis(container: HTMLElement): HTMLElement[] {
  const elementos = Array.from(
    container.querySelectorAll<HTMLElement>(SELETOR_FOCAVEIS)
  );
  return elementos.filter((el) => {
    return (
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-hidden") !== "true" &&
      el.offsetParent !== null
    );
  });
}

/**
 * Hook centralizado de acessibilidade para modais e diálogos (U02).
 *
 * Gerencia:
 * 1. Movimento de foco para o primeiro elemento focável ao abrir;
 * 2. Fechamento acessível com tecla Escape;
 * 3. Armadilha de foco em ciclo fechado (Tab e Shift+Tab);
 * 4. Restauração do foco ao elemento de origem ao fechar.
 */
export function useModalA11y({
  aberto,
  fechar,
  containerRef,
  restaurarFoco = true,
}: UseModalA11yOptions): void {
  const elementoOrigemRef = useRef<HTMLElement | null>(null);
  // `fechar` costuma chegar como função nova a cada render. Guardá-la em ref evita que o
  // efeito rode de novo (e roube o foco do campo em que a pessoa está digitando) a cada render.
  const fecharRef = useRef(fechar);
  fecharRef.current = fechar;
  const restaurarFocoRef = useRef(restaurarFoco);
  restaurarFocoRef.current = restaurarFoco;

  useEffect(() => {
    if (!aberto) return;

    if (typeof document !== "undefined") {
      elementoOrigemRef.current = document.activeElement as HTMLElement | null;
    }

    // Foca o primeiro elemento focável ou o contêiner (só na abertura)
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (container) {
        const focaveis = obterElementosFocaveis(container);
        if (focaveis.length > 0) {
          focaveis[0].focus();
        } else {
          container.setAttribute("tabindex", "-1");
          container.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (deveFecharComTecla(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        fecharRef.current();
        return;
      }

      if (e.key === "Tab" && containerRef.current) {
        const focaveis = obterElementosFocaveis(containerRef.current);
        if (focaveis.length === 0) {
          e.preventDefault();
          return;
        }

        const indexAtual = focaveis.indexOf(document.activeElement as HTMLElement);
        const proximo = proximoIndiceFoco(focaveis.length, indexAtual, e.shiftKey);
        if (proximo !== -1 && focaveis[proximo]) {
          e.preventDefault();
          focaveis[proximo].focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      if (
        restaurarFocoRef.current &&
        elementoOrigemRef.current &&
        typeof elementoOrigemRef.current.focus === "function"
      ) {
        elementoOrigemRef.current.focus();
      }
    };
    // Depende só de `aberto` e do contêiner: abrir move o foco; fechar (ou desmontar) o devolve.
  }, [aberto, containerRef]);
}
