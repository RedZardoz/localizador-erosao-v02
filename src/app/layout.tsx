import type { Metadata } from "next";
import "./globals.css";

const ehVitrineMockup = process.env.NEXT_PUBLIC_SAREL_MOCKUP === "true";

export const metadata: Metadata = {
  title: ehVitrineMockup
    ? "[MOCKUP DEMONSTRATIVO] SAREL v2.0 — Demonstração Estática (PPGTCA 2026)"
    : "SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar",
  description: ehVitrineMockup
    ? "Mockup estático demonstrativo do SAREL v2.0 (dados sintéticos, sem credenciais e operação desabilitada)"
    : "Instrumento computacional de suporte à pesquisa de mestrado PPGTCA 2026",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
