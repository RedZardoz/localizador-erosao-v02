import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar",
  description: "Instrumento computacional de suporte à pesquisa de mestrado PPGTCA 2026",
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
