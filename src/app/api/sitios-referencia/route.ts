import { NextRequest, NextResponse } from "next/server";
import { isLocalRequest } from "@/lib/seguranca/localOnly";
import { carregarSitiosLocais } from "@/lib/padraoOuro/sitiosLocais";

/**
 * Sítios de aferição (dado local). A resposta traz código CAR e perímetros, que identificam proprietários (LGPD):
 * restrita a chamadas locais, como a rota de consulta fundiária.
 */
export async function GET(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return NextResponse.json(
      { estado: "indisponivel", causa: "acesso-negado", sitios: [] },
      { status: 403 }
    );
  }
  const resultado = carregarSitiosLocais();
  return NextResponse.json(resultado);
}
