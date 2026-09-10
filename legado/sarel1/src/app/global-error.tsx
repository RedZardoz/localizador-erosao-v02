"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex h-screen w-full flex-col items-center justify-center bg-[#080e1a] text-slate-100 p-6 text-center font-sans">
        <h2 className="text-xl font-bold mb-2">Erro Crítico do Sistema</h2>
        <p className="text-xs text-slate-400 mb-4 font-mono">{error.message}</p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
        >
          Recarregar Sistema
        </button>
      </body>
    </html>
  );
}
