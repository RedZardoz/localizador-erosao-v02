"use client";

import React from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { Sparkles, Compass, Shield, Database, GitBranch } from "lucide-react";

export function RelatorioReprodutibilidade() {
  const { sementeAmostragem, pontos } = useSarelStore();

  const totalEstratos = 18; // 3 x 3 x 2
  const arestaBlocoKm = 20; // km
  const versaoMotor = "SAREL-Engine v2.0 (EPSG:31982 SIRGAS 2000)";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">
              Relatório de Reprodutibilidade da Amostragem Científica (§12.6)
            </h2>
          </div>
          <span className="rounded bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-mono font-bold text-indigo-700">
            Auditável por Terceiros
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Este documento registra formalmente todos os parâmetros matemáticos, sementes de números pseudoaleatórios
          e critérios de corte espacial que tornam a malha amostral do SAREL 100% reproduzível por qualquer
          pesquisador ou banca examinadora independente.
        </p>

        {/* Grade de Parâmetros Científicos */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          {/* Semente Aleatória (corrige M3) */}
          <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-4">
            <div className="flex items-center gap-1.5 font-bold text-purple-900">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>Semente Aleatória PRNG (corrige M3)</span>
            </div>
            <p className="mt-2 font-mono text-xl font-extrabold text-purple-950">{sementeAmostragem}</p>
            <p className="mt-1 text-[11px] text-purple-800">
              Garante alocação idêntica de candidatos e empates no sorteio estratificado.
            </p>
          </div>

          {/* Estratificação Cruzada */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Database className="h-4 w-4 text-emerald-600" />
              <span>Estratificação Multivariada</span>
            </div>
            <p className="mt-2 font-mono text-xl font-extrabold text-slate-900">
              18 Estratos (3 × 3 × 2)
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              Tercil Ŝ (Terreno) &times; Tercil Ê (Solo Nu) &times; N&iacute;vel K̂ (Erodibilidade).
            </p>
          </div>

          {/* Blocos Espaciais */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <GitBranch className="h-4 w-4 text-blue-600" />
              <span>Blocos Espaciais (Spatial CV)</span>
            </div>
            <p className="mt-2 font-mono text-xl font-extrabold text-slate-900">
              Aresta: {arestaBlocoKm} km
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              Alcance de autocorrela&ccedil;&atilde;o &gamma;̂(h) estimado (patamar 95% vari&acirc;ncia).
            </p>
          </div>
        </div>
      </div>

      {/* Critérios do Frame de Elegibilidade */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 border-b pb-2.5 mb-3">
          Critérios Invariantes do Frame Amostral de Elegibilidade (§8.1)
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="px-3 py-2">Filtro / Camada</th>
                <th className="px-3 py-2">Regra Operacional</th>
                <th className="px-3 py-2">Fonte e Resolução</th>
                <th className="px-3 py-2">Justificativa Metodológica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="px-3 py-2 font-semibold text-slate-800">Uso e Cobertura Agrícola</td>
                <td className="px-3 py-2 font-mono">Classes 30, 40 e 60</td>
                <td className="px-3 py-2">ESA WorldCover 10m</td>
                <td className="px-3 py-2">Restringe a lavouras anuais e pastagens com potencial de erosão laminar</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-slate-800">Declividade Topográfica</td>
                <td className="px-3 py-2 font-mono">3% &le; declividade &le; 20%</td>
                <td className="px-3 py-2">Copernicus DEM 30m (EPSG:31982)</td>
                <td className="px-3 py-2">Exclui áreas planas (&lt;3%) e declives íngremes dominados por voçorocas (&gt;20%)</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-slate-800">Buffer Hídrico</td>
                <td className="px-3 py-2 font-mono">Distância &gt; 30 metros</td>
                <td className="px-3 py-2">Massa d&apos;água ESA / JRC</td>
                <td className="px-3 py-2">Evita contaminação de pixels por umidade marginal e planícies de inundação</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-slate-800">Buffer Urbano</td>
                <td className="px-3 py-2 font-mono">Distância &gt; 150 metros</td>
                <td className="px-3 py-2">Manchas urbanas ESA (classe 50)</td>
                <td className="px-3 py-2">Isola contra interferências de solo compactado e drenagem antropogênica</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-slate-800">Cobertura Temporal</td>
                <td className="px-3 py-2 font-mono">&ge; 24 passagens válidas</td>
                <td className="px-3 py-2">Sentinel-2 L2A (2023–2025)</td>
                <td className="px-3 py-2">Garante densidade temporal suficiente para ajuste robusto da série de harmônicos</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
