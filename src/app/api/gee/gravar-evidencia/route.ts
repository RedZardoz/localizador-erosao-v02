import { NextRequest, NextResponse } from "next/server";
import { obterSessao, SAREL_SESSION_COOKIE } from "@/lib/seguranca/sessaoEfemera";
import { getGoogleAccessToken, EARTH_ENGINE_SCOPES } from "@/lib/gee/auth";
import { exigirRequisicaoLocalConfiavel } from "@/lib/seguranca/localOnly";
import { medirSerieSentinel2PontoGeeRest } from "@/lib/gee/copernicusGeeClient";
import { gravarEvidenciaGeeSerieS2 } from "@/lib/gee/gravadorEvidenciaGee";
import { dataCivilSaoPaulo } from "@/lib/tempo/datas";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Gravação Explícita de Evidência da Regra 8 — Earth Engine
 *
 * REQUISITOS DE GOVERNANÇA:
 * 1. Apenas requisições locais confiáveis (exigirRequisicaoLocalConfiavel).
 * 2. Gravação sob demanda EXPLÍCITA (nunca automática a cada consulta).
 * 3. Utiliza credencial da sessão efêmera em memória (Regra C1) — NUNCA grava credencial.
 * 4. Remove compulsoriamente tokens, chaves e dados pessoais antes da gravação.
 * 5. Destino restrito a docs/verificacoes/AAAA-MM-DD_gee_serie_s2_<operacao>.json.
 */
export async function POST(request: NextRequest) {
  const bloqueio = exigirRequisicaoLocalConfiavel(request);
  if (bloqueio) return bloqueio;

  try {
    const body = await request.json().catch(() => ({}));
    const { latitude, longitude, operacao } = body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return NextResponse.json(
        { ok: false, error: "Coordenadas (latitude, longitude) inválidas ou não fornecidas." },
        { status: 400 }
      );
    }

    const sessionId = request.cookies.get(SAREL_SESSION_COOKIE)?.value;
    const sessao = obterSessao(sessionId);

    if (!sessao?.gee || !sessao.gee.client_email || !sessao.gee.private_key || !sessao.gee.project_id) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Sessão Google Earth Engine não configurada. A coleta de evidência da Regra 8 exige credencial efêmera ativa no app.",
        },
        { status: 401 }
      );
    }

    const tokenRes = await getGoogleAccessToken(
      {
        client_email: sessao.gee.client_email,
        private_key: sessao.gee.private_key,
        token_uri: sessao.gee.token_uri,
      },
      EARTH_ENGINE_SCOPES
    );

    if (!tokenRes?.accessToken) {
      return NextResponse.json(
        { ok: false, error: "Falha na obtenção do token OAuth2 do Google Earth Engine." },
        { status: 502 }
      );
    }

    const serieRes = await medirSerieSentinel2PontoGeeRest(
      latitude,
      longitude,
      tokenRes.accessToken,
      sessao.gee.project_id
    );

    if (!serieRes) {
      return NextResponse.json(
        { ok: false, error: "Falha ao obter série temporal do Sentinel-2 no Earth Engine." },
        { status: 502 }
      );
    }

    const registroEvidencia = gravarEvidenciaGeeSerieS2({
      coordenadas: { latitude, longitude },
      operacao: operacao || "inspecao_ponto",
      respostaBruta: serieRes.observacoes,
      dataConsulta: dataCivilSaoPaulo(),
    });

    return NextResponse.json({
      ok: true,
      registro: registroEvidencia,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: `Erro na gravação de evidência GEE: ${err?.message}` },
      { status: 500 }
    );
  }
}
