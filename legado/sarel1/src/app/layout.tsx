import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAREL — Sistema de Amostragem e Rotulagem para Predição de Erosão Laminar",
  description: "Instrumento computacional da dissertação de mestrado — PPGTCA 2026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
