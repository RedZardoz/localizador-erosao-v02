"use client";

import React, { useState } from "react";
import { Proveniencia, formatarDescricaoOrigem } from "@/types/proveniencia";

interface SeloProvenienciaProps<T> {
  proveniencia?: Proveniencia<T> | null;
  label: string;
  unidade?: string;
  ressalvaAssociacao?: boolean;
}

/**
 * Selo Visual de Proveniência Científica — SAREL (§12.2 e Regra 3)
 *
 * ● medido      — verde, sólido
 * ◊ modelado    — azul, losango
 * □ tabelado    — amarelo, quadrado
 * ○ indisponivel— cinza, círculo aberto
 */
export function SeloProveniencia<T>({
  proveniencia,
  label,
  unidade,
  ressalvaAssociacao,
}: SeloProvenienciaProps<T>) {
  const [expandido, setExpandido] = useState(false);

  const estado = proveniencia?.estado ?? "indisponivel";
  const descricao = formatarDescricaoOrigem(proveniencia);

  let valorFormatado: string;
  if (!proveniencia || proveniencia.estado === "indisponivel") {
    valorFormatado = "indisponível";
  } else if (typeof proveniencia.valor === "number") {
    valorFormatado = Number.isInteger(proveniencia.valor)
      ? String(proveniencia.valor)
      : (proveniencia.valor as number).toFixed(2);
  } else {
    valorFormatado = String(proveniencia.valor);
  }

  // Configurações de glifo e paleta
  let icone = "○";
  let classeEstilo = "border-slate-300 bg-slate-50 text-slate-600";
  let badgeCor = "bg-slate-200 text-slate-700";

  switch (estado) {
    case "medido":
      icone = "●";
      classeEstilo = "border-emerald-300 bg-emerald-50/70 text-emerald-950";
      badgeCor = "bg-emerald-100 text-emerald-800 border-emerald-300";
      break;
    case "modelado":
      icone = "◊";
      classeEstilo = "border-blue-300 bg-blue-50/70 text-blue-950";
      badgeCor = "bg-blue-100 text-blue-800 border-blue-300";
      break;
    case "tabelado":
      icone = "□";
      classeEstilo = "border-amber-300 bg-amber-50/70 text-amber-950";
      badgeCor = "bg-amber-100 text-amber-800 border-amber-300";
      break;
    case "indisponivel":
      icone = "○";
      classeEstilo = "border-slate-300 bg-slate-100 text-slate-500 italic";
      badgeCor = "bg-slate-200 text-slate-600 border-slate-300";
      break;
  }

  return (
    <div
      onClick={() => setExpandido(!expandido)}
      className={`relative cursor-pointer rounded-md border p-2.5 transition-all hover:shadow-sm ${classeEstilo}`}
      title="Clique para ver detalhes de proveniência científica"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold tracking-wide text-slate-700">{label}</span>
        <span
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium border ${badgeCor}`}
        >
          <span className="font-bold">{icone}</span>
          <span className="capitalize">{estado}</span>
        </span>
      </div>

      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-base font-bold text-slate-900">{valorFormatado}</span>
        {unidade && valorFormatado !== "indisponível" && (
          <span className="text-xs font-medium text-slate-500">{unidade}</span>
        )}
      </div>

      {ressalvaAssociacao && (
        <div className="mt-1.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 border border-amber-300">
          ⚠ Unidade em associação (confiança média)
        </div>
      )}

      {expandido && (
        <div className="mt-2.5 border-t border-slate-200/80 pt-2 text-[11px] leading-tight text-slate-600">
          <p className="font-medium text-slate-800">Origem Rastreada:</p>
          <p className="mt-0.5 font-mono text-[10px] text-slate-600 break-words">{descricao}</p>
        </div>
      )}
    </div>
  );
}
