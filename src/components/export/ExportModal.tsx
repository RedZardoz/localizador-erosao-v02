"use client";

import React, { useState } from "react";
import {
  X,
  FileSpreadsheet,
  Download,
  FileText,
  Map,
  Globe,
  Layers,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { useSarelStore, usePontosVisiveis } from "@/store/useSarelStore";
import { gerarPlanilhaXLSX } from "@/lib/export/planilha";
import { gerarCsvCientifico } from "@/lib/export/csv";
import { valorOuNulo } from "@/types/proveniencia";

export const ExportModal: React.FC = () => {
  const { modalAtiva, setModalAtiva, areas } = useSarelStore();
  const pontosVisiveis = usePontosVisiveis();

  const [exportando, setExportando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(
    null
  );

  if (modalAtiva !== "export") return null;

  const totalPontos = pontosVisiveis.length;

  const baixarXlsx = async () => {
    if (totalPontos === 0) {
      setMensagem({ tipo: "erro", texto: "Nenhum ponto visível na tela para exportar." });
      return;
    }
    setExportando("xlsx");
    try {
      const buffer = await gerarPlanilhaXLSX(pontosVisiveis);
      const blob = new Blob([buffer as any], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sarel_planilha_dissertacao_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setMensagem({ tipo: "sucesso", texto: "Planilha XLSX de dissertação exportada com sucesso!" });
    } catch (e: any) {
      setMensagem({ tipo: "erro", texto: e.message || "Falha ao gerar XLSX." });
    } finally {
      setExportando(null);
    }
  };

  const baixarCsv = () => {
    if (totalPontos === 0) {
      setMensagem({ tipo: "erro", texto: "Nenhum ponto visível na tela para exportar." });
      return;
    }
    setExportando("csv");
    try {
      const csvStr = gerarCsvCientifico(pontosVisiveis, "planilha");
      const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sarel_dados_cientificos_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMensagem({ tipo: "sucesso", texto: "Arquivo CSV científico com metadados exportado!" });
    } catch (e: any) {
      setMensagem({ tipo: "erro", texto: e.message || "Falha ao gerar CSV." });
    } finally {
      setExportando(null);
    }
  };

  const baixarGeoJson = () => {
    if (totalPontos === 0 && areas.length === 0) {
      setMensagem({ tipo: "erro", texto: "Nenhum ponto ou área para exportar." });
      return;
    }
    setExportando("geojson");
    try {
      const features: GeoJSON.Feature[] = [
        ...pontosVisiveis.map(
          (p): GeoJSON.Feature => ({
            type: "Feature",
            id: p.id,
            properties: {
              codigo: p.codigo,
              estrato: p.estratoId,
              municipio: valorOuNulo(p.localizacao.municipio),
              bacia: valorOuNulo(p.localizacao.bacia),
              altitude_dem: valorOuNulo(p.terreno.elevacao),
              declividade_pct: valorOuNulo(p.terreno.declividadePct),
              solo_embrapa: valorOuNulo(p.solo.ordem),
              car_codigo: p.fundiario?.codigoCar || null,
            },
            geometry: {
              type: "Point",
              coordinates: [p.longitude, p.latitude],
            },
          })
        ),
        ...areas.map(
          (a): GeoJSON.Feature => ({
            type: "Feature",
            id: a.id,
            properties: {
              nome: a.nome,
              tipo: a.tipo,
              areaHa: a.areaHa || null,
            },
            geometry: a.geometry,
          })
        ),
      ];

      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features,
      };

      const blob = new Blob([JSON.stringify(geojson, null, 2)], {
        type: "application/geo+json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sarel_camadas_sig_${Date.now()}.geojson`;
      a.click();
      URL.revokeObjectURL(url);
      setMensagem({ tipo: "sucesso", texto: "Arquivo GeoJSON padrão RFC 7946 exportado!" });
    } catch (e: any) {
      setMensagem({ tipo: "erro", texto: e.message || "Falha ao gerar GeoJSON." });
    } finally {
      setExportando(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Central de Exportação Científica &amp; SIG
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Formatos abertos e auditáveis com conformidade às 9 Regras do SAREL
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalAtiva(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Amostras prontas para exportação:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {totalPontos} {totalPontos === 1 ? "registro" : "registros"}
            </span>
          </div>

          {mensagem && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                mensagem.tipo === "sucesso"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
              }`}
            >
              {mensagem.tipo === "sucesso" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{mensagem.texto}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card XLSX */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Planilha de Dissertação (.xlsx)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Planilha Microsoft Excel oficial com abas Metadados, Dados com colunas duplas de proveniência e Dicionário.
              </p>
              <button
                onClick={baixarXlsx}
                disabled={exportando === "xlsx" || totalPontos === 0}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Planilha XLSX</span>
              </button>
            </div>

            {/* Card CSV */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  CSV Científico UTF-8
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Arquivo delimitado por vírgulas com bloco de conformidade LGPD e cabeçalho formal de proveniência.
              </p>
              <button
                onClick={baixarCsv}
                disabled={exportando === "csv" || totalPontos === 0}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar CSV</span>
              </button>
            </div>

            {/* Card GeoJSON */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 col-span-1 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Camadas Vetoriais GeoJSON (QGIS, ArcGIS, Python)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                FeatureCollection contendo pontos amostrais com todos os atributos físicos e os polígonos de talhões delimitados.
              </p>
              <button
                onClick={baixarGeoJson}
                disabled={exportando === "geojson"}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar GeoJSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sem colunas inventadas: Toda célula tem proveniência real</span>
          </div>

          <button
            onClick={() => setModalAtiva(null)}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
