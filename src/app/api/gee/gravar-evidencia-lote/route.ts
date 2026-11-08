import { NextRequest, NextResponse } from "next/server";
import { obterSessao, SAREL_SESSION_COOKIE } from "@/lib/seguranca/sessaoEfemera";
import { getGoogleAccessToken, EARTH_ENGINE_SCOPES } from "@/lib/gee/auth";
import { exigirRequisicaoLocalConfiavel } from "@/lib/seguranca/localOnly";
import { medirSerieSentinel2EmLoteGeeRest } from "@/lib/gee/copernicusGeeClient";
import {
  gravarEvidenciaLoteGeeSerieS2,
  PontoEvidenciaLote,
  CustoMedidoExecucao,
} from "@/lib/gee/gravadorEvidenciaGee";
import { dataCivilSaoPaulo } from "@/lib/tempo/datas";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Gravação de Evidência da Regra 8 em LOTE — Earth Engine
 *
 * REQUISITOS DE GOVERNANÇA (Lei Fundamental Regras 1, 3 e 8, §6 e §18):
 * 1. Apenas requisições locais confiáveis (exigirRequisicaoLocalConfiavel).
 * 2. As coordenadas vêm EXCLUSIVAMENTE no corpo da requisição (disciplina LGPD / CAR).
 * 3. Utiliza credencial da sessão efêmera em memória (Regra C1) — NUNCA persiste credencial.
 * 4. Elimina compulsoriamente tokens, chaves e dados pessoais antes da gravação.
 * 5. Registra o custo medido cronometrado real (requisições, tempo total, tempo por ponto).
 * 6. Destino restrito a docs/verificacoes/AAAA-MM-DD_gee_serie_s2_<operacao>.json.
 */
export async function POST(request: NextRequest) {
  const bloqueio = exigirRequisicaoLocalConfiavel(request);
  if (bloqueio) return bloqueio;

  try {
    const body = await request.json().catch(() => ({}));
    const listaEntrada = Array.isArray(body.pontos)
      ? body.pontos
      : Array.isArray(body.coordenadas)
        ? body.coordenadas
        : [];

    if (listaEntrada.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Nenhuma coordenada fornecida. O corpo da requisição deve conter 'pontos' ou 'coordenadas' como array de objetos com latitude e longitude.",
        },
        { status: 400 }
      );
    }

    const operacao = typeof body.operacao === "string" ? body.operacao : "lote_pontos";

    // Validação estrita das coordenadas de entrada
    const pontosFormatados: Array<{ id: string; latitude: number; longitude: number }> = [];
    for (let i = 0; i < listaEntrada.length; i++) {
      const item = listaEntrada[i];
      const lat = typeof item.latitude === "number" ? item.latitude : typeof item.lat === "number" ? item.lat : null;
      const lon =
        typeof item.longitude === "number"
          ? item.longitude
          : typeof item.lng === "number"
            ? item.lng
            : typeof item.lon === "number"
              ? item.lon
              : null;

      if (lat === null || lon === null || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        return NextResponse.json(
          {
            ok: false,
            error: `Coordenadas inválidas para o ponto no índice ${i}. Latitude e longitude numéricas finitas são obrigatórias.`,
          },
          { status: 400 }
        );
      }

      const id = typeof item.id === "string" && item.id.trim().length > 0 ? item.id.trim() : `PONTO_${String(i + 1).padStart(3, "0")}`;
      pontosFormatados.push({ id, latitude: lat, longitude: lon });
    }

    // 1. Obtenção da credencial da sessão efêmera em memória (Regra C1)
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

    // 2. Obtenção de token OAuth2 de curta duração
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

    // 3. Execução em lote cronometrada com medição real de custo
    const celulasUnicas = new Set(
      pontosFormatados.map((p) => `${p.latitude.toFixed(5)}_${p.longitude.toFixed(5)}`)
    ).size;

    const inicioMs = Date.now();
    const mapaSeries = await medirSerieSentinel2EmLoteGeeRest(
      pontosFormatados,
      tokenRes.accessToken,
      sessao.gee.project_id
    );
    const tempoTotalMs = Date.now() - inicioMs;

    const tempoPorPontoMs =
      pontosFormatados.length > 0
        ? Number((tempoTotalMs / pontosFormatados.length).toFixed(1))
        : 0;

    const custoMedido: CustoMedidoExecucao = {
      requisicoesEmitidas: celulasUnicas,
      tempoTotalMs,
      tempoPorPontoMs,
    };

    // 4. Montagem dos pontos para a gravação da evidência
    const listaPontosEvidencia: PontoEvidenciaLote[] = [];
    for (const pt of pontosFormatados) {
      const resSerie = mapaSeries.get(pt.id);
      if (resSerie) {
        listaPontosEvidencia.push({
          id: pt.id,
          coordenadas: { latitude: pt.latitude, longitude: pt.longitude },
          observacoes: resSerie.observacoes,
          nObservacoesValidasPorBanda: resSerie.nObservacoesValidasPorBanda,
          nObservacoesValidas: resSerie.nObservacoesValidas,
          insuficienteD11: resSerie.insuficienteD11,
        });
      } else {
        listaPontosEvidencia.push({
          id: pt.id,
          coordenadas: { latitude: pt.latitude, longitude: pt.longitude },
          observacoes: [],
          nObservacoesValidasPorBanda: {},
          nObservacoesValidas: 0,
          insuficienteD11: true,
        });
      }
    }

    // 5. Gravação atômica em docs/verificacoes com sanitização estrita da Regra 8
    const registroEvidencia = gravarEvidenciaLoteGeeSerieS2({
      pontos: listaPontosEvidencia,
      custoMedido,
      operacao,
      dataConsulta: dataCivilSaoPaulo(),
    });

    return NextResponse.json({
      ok: true,
      registro: registroEvidencia,
      custoMedido,
      totalPontos: listaPontosEvidencia.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: `Erro na gravação de evidência em lote GEE: ${err?.message}` },
      { status: 500 }
    );
  }
}
