"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { IS_VITRINE_DEMONSTRACAO } from "@/config/vitrineDemonstracao";

export const VitrineAvisoModal: React.FC<{ textoCustom?: string }> = ({
  textoCustom,
}) => {
  if (!IS_VITRINE_DEMONSTRACAO) return null;

  return (
    <div
      role="status"
      className="px-3 py-2 rounded-xl bg-amber-100 border border-amber-400 text-amber-950 text-[11px] font-bold flex items-center gap-2 shadow-xs"
    >
      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
      <span>
        {textoCustom ||
          "DEMONSTRAÇÃO ESTÁTICA (MOCKUP): Os registros exibidos são sintéticos (SINTETICO_NAO_VOAR_) e ações reais de gravação, consulta externa ou exportação estão desabilitadas."}
      </span>
    </div>
  );
};
