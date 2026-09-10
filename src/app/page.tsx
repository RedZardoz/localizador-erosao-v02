export default function HomePage() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col gap-6">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          SAREL
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Sistema de Amostragem e Rotulagem para Erosão Laminar — PPGTCA 2026
        </p>
      </header>

      <section className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
          Repositório em Reconstrução (Fase −1 Concluída)
        </h2>
        <p className="text-sm text-amber-800 dark:text-amber-300 mt-2">
          A reconstrução metodológica do SAREL está em andamento na branch{" "}
          <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">
            sarel/v2
          </code>
          . O código antigo do Localizador está preservado em quarentena em{" "}
          <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">
            legado/localizador/
          </code>{" "}
          e na tag{" "}
          <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">
            legado-pre-sarel
          </code>
          .
        </p>
      </section>

      <section className="space-y-4 text-slate-700 dark:text-slate-300">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Como alternar para o Localizador (legado) durante a transição:
        </h3>
        <pre className="bg-slate-900 text-slate-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
          git switch --detach legado-pre-sarel{"\n"}
          npm run build && npm run start
        </pre>
        <p className="text-sm">
          Para retornar ao SAREL:{" "}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">
            git switch sarel/v2
          </code>
        </p>
      </section>
    </main>
  );
}
