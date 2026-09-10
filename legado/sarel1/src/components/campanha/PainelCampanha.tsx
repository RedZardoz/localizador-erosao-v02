"use client";

import React, { useMemo, useState } from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { gerarPlanilhaCSV } from "@/lib/export/planilha";
import { calcularKappaCohen, ParRotulo } from "@/lib/rotulos/concordancia";
import {
  FileDown,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  Clock,
  Send,
  HelpCircle,
  EyeOff,
  Users,
} from "lucide-react";

export function PainelCampanha() {
  const { pontos, rotulosConsolidados, adicionarRotuloConsolidado } = useSarelStore();

  const [modalExportacaoCega, setModalExportacaoCega] = useState(false);
  const [tipoImportacao, setTipoImportacao] = useState<"kobo" | "interpretacao" | "drone">("kobo");
  const [conteudoImportacao, setConteudoImportacao] = useState("");
  const [feedbackImportacao, setFeedbackImportacao] = useState<{ sucesso: boolean; msg: string } | null>(null);

  // Status de rotulagem agregados
  const statusContagem = useMemo(() => {
    let rotulados = 0;
    let emCampo = 0;
    let validadosDrone = 0;

    for (const p of pontos) {
      const rot = rotulosConsolidados[p.codigo]?.final ?? p.rotulo;
      if (rot) {
        rotulados++;
        if (rot.modalidade === "campo") emCampo++;
        if (rot.modalidade === "drone") validadosDrone++;
      }
    }

    const aRotular = pontos.length - rotulados;
    return { aRotular, rotulados, emCampo, validadosDrone };
  }, [pontos, rotulosConsolidados]);

  // Cálculo de concordância Kappa em tempo real para pares com 2+ observadores
  const resultadoKappa = useMemo(() => {
    const pares: ParRotulo[] = [];
    for (const cons of Object.values(rotulosConsolidados)) {
      if (cons.origens && cons.origens.length >= 2) {
        pares.push({
          observador1: cons.origens[0].classe,
          observador2: cons.origens[1].classe,
        });
      }
    }
    if (pares.length === 0) return null;
    return calcularKappaCohen(pares);
  }, [rotulosConsolidados]);

  // Exportação cega em CSV
  function baixarPlanoCampoCegoCsv() {
    try {
      const csvStr = gerarPlanilhaCSV(pontos, {
        modoCego: true,
        responsavelEmissao: "Equipe de Campo SAREL - Mestrado PPGTCA 2026",
      });

      const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `plano_campo_cego_sarel_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setModalExportacaoCega(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao gerar exportação cega");
    }
  }

  // Processar importação via endpoint de API ou local
  async function processarImportacao() {
    try {
      setFeedbackImportacao(null);
      const jsonDados = JSON.parse(conteudoImportacao);
      const arrayDados = Array.isArray(jsonDados) ? jsonDados : [jsonDados];

      const res = await fetch("/api/rotulos/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: tipoImportacao,
          dados: arrayDados,
          pontosReferencia: pontos,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro || "Falha na importação.");
      }

      // Atualizar o store localmente com os novos rótulos aceitos
      if (tipoImportacao === "kobo" && data.resultado.aceitos) {
        data.resultado.aceitos.forEach((item: any) => {
          adicionarRotuloConsolidado(item.pontoCodigo, {
            final: item.rotulo,
            origens: [item.rotulo],
            divergencia: "nenhuma",
          });
        });
      } else if (tipoImportacao === "interpretacao" && data.resultado.consolidados) {
        Object.entries(data.resultado.consolidados).forEach(([cod, cons]: [string, any]) => {
          adicionarRotuloConsolidado(cod, cons);
        });
      }

      setFeedbackImportacao({
        sucesso: true,
        msg: `Importação de ${tipoImportacao} realizada com sucesso! Registros incorporados ao sistema.`,
      });
      setConteudoImportacao("");
    } catch (err) {
      setFeedbackImportacao({
        sucesso: false,
        msg: err instanceof Error ? err.message : "Erro no formato JSON.",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Cards de Status da Campanha */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>A Rotular (Pendentes)</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-800">{statusContagem.aRotular}</p>
          <p className="mt-1 text-[11px] text-slate-500">Aguardando campo ou fotointerpretação</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Rotulados em Campo (Kobo)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700">{statusContagem.emCampo}</p>
          <p className="mt-1 text-[11px] text-slate-500">Observações diretas in situ</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total com Rótulo Consolidado</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-blue-700">{statusContagem.rotulados}</p>
          <p className="mt-1 text-[11px] text-slate-500">Disponíveis para matriz de treino</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Validados com Drone (Held-Out)</span>
            <ShieldCheck className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-purple-700">{statusContagem.validadosDrone}</p>
          <p className="mt-1 text-[11px] text-slate-500">Segregados exclusivamente para teste final</p>
        </div>
      </div>

      {/* Botão de Exportação Cega Destacado (§12.4) */}
      <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50/50 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
              <EyeOff className="h-5 w-5 text-emerald-700" />
              <span>Exportação Cega para Campanha de Campo e Fotointerpretação</span>
            </div>
            <p className="text-xs text-emerald-800 max-w-2xl">
              Gera planilha de campo com coordenadas de navegação (decimal e DMS), identificador do ponto e
              bloco espacial. <b>Omissão terminante de scores, estratos, predições ou fatores RUSLE</b>,
              garantindo observação 100% isenta e sem indução de viés cognitivo (§12.4).
            </p>
          </div>

          <button
            onClick={() => setModalExportacaoCega(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white shadow-md hover:bg-emerald-800 transition-all"
          >
            <FileDown className="h-5 w-5" />
            Exportar Plano de Campo Cego
          </button>
        </div>
      </div>

      {/* Card de Concordância Interobservador (Kappa de Cohen) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Protocolo de Concordância Interobservador (Kappa de Cohen)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Landis &amp; Koch (1977)</span>
        </div>

        {resultadoKappa ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
              <span className="text-[11px] font-medium text-slate-500">Índice Kappa (κ)</span>
              <p className="text-xl font-bold font-mono text-slate-900">{resultadoKappa.kappa.toFixed(3)}</p>
              <p className="text-[10px] text-slate-500">Po: {resultadoKappa.po} | Pe: {resultadoKappa.pe}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
              <span className="text-[11px] font-medium text-slate-500">Grau de Concordância</span>
              <p className="text-xl font-bold capitalize text-indigo-700">{resultadoKappa.grau}</p>
              <p className="text-[10px] text-slate-500">Patamares de Landis &amp; Koch</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
              <span className="text-[11px] font-medium text-slate-500">Status Operacional</span>
              <p className={`text-xl font-bold ${resultadoKappa.operacional ? "text-emerald-700" : "text-rose-600"}`}>
                {resultadoKappa.operacional ? "OPERACIONAL (≥ 0.60)" : "NÃO OPERACIONAL"}
              </p>
              <p className="text-[10px] text-slate-500">Critério de validação do protocolo</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Aguardando Pares de Fotointerpretação</p>
            <p className="mt-1">
              O cálculo de Kappa requer ao menos um ponto com 2 interpretações independentes (Fases A e B).
            </p>
          </div>
        )}
      </div>

      {/* Seção de Ingestão de Rótulos (§11) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Ingestão de Rótulos de Observação Humana</h3>
          </div>
          <div className="flex gap-2">
            {(["kobo", "interpretacao", "drone"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTipoImportacao(t)}
                className={`rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
                  tipoImportacao === t
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-2">
          Cole abaixo a carga JSON de submissões de <b>{tipoImportacao.toUpperCase()}</b> para validação e incorporação:
        </p>

        <textarea
          rows={5}
          value={conteudoImportacao}
          onChange={(e) => setConteudoImportacao(e.target.value)}
          placeholder={`[\n  {\n    "codigoPonto": "PR-2026-0001",\n    "classe": "moderada",\n    "observador": "Técnico Silva",\n    "observadoEm": "2026-05-18",\n    "cego": true\n  }\n]`}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
        />

        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={processarImportacao}
            disabled={!conteudoImportacao.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Validar e Ingerir Rótulos
          </button>

          {feedbackImportacao && (
            <p className={`text-xs font-semibold ${feedbackImportacao.sucesso ? "text-emerald-700" : "text-rose-600"}`}>
              {feedbackImportacao.msg}
            </p>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exportação Cega */}
      {modalExportacaoCega && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-base border-b pb-3">
              <EyeOff className="h-5 w-5 text-emerald-600" />
              <span>Confirmação: Exportação de Campo em Modo Cego</span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <b>Conformidade com a Regra 4 da Lei Fundamental:</b>
              </p>
              <p>
                A planilha exportada conterá exclusivamente as coordenadas de localização (decimal e DMS) e o
                identificador de ponto. As seguintes colunas serão terminantemente suprimidas:
              </p>
              <ul className="list-inside list-disc font-mono text-[11px] text-slate-700 space-y-0.5">
                <li>Score de prioridade e diagnóstico Φ</li>
                <li>Estrato amostral (S x E x K)</li>
                <li>Qualquer severidade ou predição estimada</li>
                <li>Fatores e perdas de solo da RUSLE</li>
              </ul>
              <p className="pt-1 text-[11px] text-slate-500 italic">
                O observador em campo deve realizar a leitura puramente baseada na evidência morfológica do solo.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setModalExportacaoCega(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={baixarPlanoCampoCegoCsv}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800"
              >
                Confirmar e Baixar CSV Cego
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
