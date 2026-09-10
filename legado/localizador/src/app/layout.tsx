import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Localizador de Erosão | Visualização 2D/3D Brasil",
  description:
    "Sistema de informação geográfica (GIS) para análise, visualização 2D/3D e triagem de pontos críticos de erosão em qualquer estado ou município do Brasil. Mestrado PPGTCA.",
  keywords: [
    "Erosão Laminar",
    "Brasil",
    "GIS",
    "Google Earth Engine",
    "BSI",
    "Sensoriamento Remoto",
    "MapLibre GL",
    "PPGTCA",
  ],
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
