"use client";

import React, { useEffect } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro capturado no SAREL:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#080e1a] text-slate-100 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 mb-4 border border-rose-500/30">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-black tracking-tight text-white mb-2">
        Ocorreu um erro no módulo do SAREL
      </h2>
      <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed font-mono">
        {error.message || "Falha temporária de carregamento. Clique abaixo para reiniciar os componentes."}
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg transition-all"
      >
        <RotateCcw className="h-4 w-4" />
        <span>Tentar Novamente</span>
      </button>
    </div>
  );
}
