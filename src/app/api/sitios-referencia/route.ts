import { NextResponse } from "next/server";
import { carregarSitiosLocais } from "@/lib/padraoOuro/sitiosLocais";

export async function GET() {
  const resultado = carregarSitiosLocais();
  return NextResponse.json(resultado);
}
