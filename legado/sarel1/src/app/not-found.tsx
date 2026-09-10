import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#080e1a] text-slate-100 p-6 text-center font-sans">
      <h2 className="text-2xl font-black mb-2">404 — Página Não Encontrada</h2>
      <p className="text-xs text-slate-400 mb-6">A rota solicitada não existe no SAREL.</p>
      <Link
        href="/"
        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg transition-all"
      >
        Retornar ao Dashboard
      </Link>
    </div>
  );
}
