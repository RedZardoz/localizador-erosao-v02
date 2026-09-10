"use client";

import React, { useState } from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { Sparkles, X, Shuffle, Layers, ShieldCheck, Check } from "lucide-react";

export function CandidateSelectionModal() {
  const { aoiAtiva, sementeAmostragem, amostrarNovaColecao, fecharModal } = useSarelStore();
  const [quantidade, setQuantidade] = useState<number>(150);
  const [semente, setSemente] = useState<number>(sementeAmostragem);
  const [emProcessamento, setEmProcessamento] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  function gerarNovaSemente() {
    setSemente(Math.floor(10000000 + Math.random() * 90000000));
  }

  function dispararAmostragem(substituir: boolean) {
    setEmProcessamento(true);
    setTimeout(() => {
      amostrarNovaColecao({
        quantidade,
        semente,
        aoi: aoiAtiva,
        substituir,
      });
      setEmProcessamento(false);
      setSucesso(true);
      setTimeout(() => {
        fecharModal();
      }, 700);
    }, 400);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full max-w-xl flex-col rounded-2xl border border-slate-700/60 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Amostragem Estratificada sob Medida</h2>
              <p className="text-xs text-slate-400">
                Geração de pontos amostrais balanceados por quantis e dispersos por blocos espaciais
              </p>
            </div>
          </div>
          <button
            onClick={fecharModal}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-5">
          {/* Alerta de AOI Ativa */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Recorte Territorial Ativo (AOI)
              </span>
              <p className="text-sm font-bold text-white mt-0.5">{aoiAtiva.nome}</p>
              <p className="text-[11px] text-slate-400">
                BBox: [{aoiAtiva.bbox.map((b) => b.toFixed(2)).join(", ")}]
              </p>
            </div>
            <span className="rounded-md bg-emerald-950 px-2.5 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-800/50">
              {aoiAtiva.tipo.toUpperCase()}
            </span>
          </div>

          {/* Configuração de Quantidade */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex justify-between">
              <span>Quantidade de Pontos Amostrais (N):</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">{quantidade} pontos</span>
            </label>
            <div className="flex gap-2">
              {[36, 50, 100, 150, 300].map((qtd) => (
                <button
                  key={qtd}
                  type="button"
                  onClick={() => setQuantidade(qtd)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                    quantidade === qtd
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {qtd}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={18}
              max={600}
              step={18}
              value={quantidade}
              onChange={(e) => setQuantidade(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Semente Aleatória (PRNG) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                Semente PRNG de Reprodutibilidade:
              </label>
              <button
                type="button"
                onClick={gerarNovaSemente}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <Shuffle className="h-3 w-3" /> Gerar Nova Semente
              </button>
            </div>
            <input
              type="number"
              value={semente}
              onChange={(e) => setSemente(parseInt(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 italic">
              * A semente aleatória registrada garante 100% de reprodutibilidade científica por terceiros (Achado M3).
            </p>
          </div>

          {/* Card dos 18 Estratos */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>Estratificação Físico-Ambiental (18 Classes Balanceadas)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Distribuição garantida: <b>3 terços de Declividade (S^)</b> × <b>3 terços de Freq. Solo Nu (E^)</b> × <b>2 níveis de Erodibilidade SiBCS (K^)</b>.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 font-semibold pt-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Regra 4: Alocação puramente física. Nenhum cálculo de severidade vira rótulo.</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-amber-300/90 font-medium pt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>Guarda Antissintética (Achado I2): Sem API GEE conectada, os pontos são marcados como demonstrativos e bloqueados para exportação/treino.</span>
            </div>
          </div>
        </div>

        {/* Rodapé e Ações */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-900/90 rounded-b-2xl">
          <button
            onClick={fecharModal}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Cancelar
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => dispararAmostragem(false)}
              disabled={emProcessamento}
              className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              Adicionar aos Atuais
            </button>
            <button
              onClick={() => dispararAmostragem(true)}
              disabled={emProcessamento}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 transition-all disabled:opacity-50"
            >
              {sucesso ? (
                <>
                  <Check className="h-4 w-4" /> Amostrado com Sucesso!
                </>
              ) : emProcessamento ? (
                "Processando Estratificação..."
              ) : (
                "Substituir Coleção Ativa"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
