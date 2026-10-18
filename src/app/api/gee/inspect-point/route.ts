import { NextRequest, NextResponse } from "next/server";
import { obterSessao, SAREL_SESSION_COOKIE } from "@/lib/seguranca/sessaoEfemera";
import { getGoogleAccessToken, EARTH_ENGINE_SCOPES } from "@/lib/gee/auth";
import { exigirRequisicaoLocalConfiavel } from "@/lib/seguranca/localOnly";
import {
  medirTerrenoCopernicusEmLote,
  medirSentinel2PontoGeeRest,
  ultimoErroGee,
} from "@/lib/gee/copernicusGeeClient";
import { queryEmbrapaSoil } from "@/lib/embrapa/embrapaSoilClient";
import { matchRuralProperty } from "@/lib/fundiario/matcher";
import { consolidarInspecaoPonto } from "@/lib/gee/consolidacaoInspecao";
import { dataCivilSaoPaulo } from "@/lib/tempo/datas";
import type { PontoAmostral } from "@/types/ponto";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Inspeção Pontual em Tempo Real — Conformidade Estrita Regras 1 a 9 SAREL.
 * Consulta exclusivamente fontes primárias oficiais para a coordenada exata (lat, lon):
 * 1. Copernicus DEM GLO-30 (ESA 30m / EPSG:31982) -> elevacao, declividadePct, declividadeGraus
 * 2. Embrapa GeoInfo OGC WMS (geonode:parana_solos_20201105 + geonode:brasil_erodibilidade_solo) -> SiBCS + K
 * 3. Google Earth Engine REST API v1 (COPERNICUS/S2_SR_HARMONIZED) -> B2, B4, B8, B11, NDVI, BSI
 * 4. Base Fundiária Oficial (SICAR / SIGEF / SNCR) -> matchRuralProperty
 * 5. Linha de Base RUSLE -> montarLinhaDeBaseRUSLE (respeitando Invariante 1 e Decisões D01, D13, D14, D15)
 *
 * ZERO DADOS SINTÉTICOS OU ESTIMADOS: Qualquer variável não retornada pela fonte oficial
 * permanece declarada com `{ estado: "indisponivel", causa: ... }`.
 * Nenhuma falha de consulta é engolida silenciosamente: cada falha é registrada em 'avisos'
 * e reflete nos estados do ponto (erro-na-consulta para fundiário, servico-indisponivel para os demais).
 */
export async function POST(request: NextRequest) {
  const bloqueio = exigirRequisicaoLocalConfiavel(request);
  if (bloqueio) return bloqueio;

  try {
    const point = (await request.json()) as PontoAmostral;
    if (
      !point ||
      typeof point.latitude !== "number" ||
      typeof point.longitude !== "number"
    ) {
      return NextResponse.json(
        { ok: false, error: "Coordenadas do ponto inválidas." },
        { status: 400 }
      );
    }

    const { latitude, longitude } = point;
    const dataConsultaAtual = dataCivilSaoPaulo();

    const sessionId = request.cookies.get(SAREL_SESSION_COOKIE)?.value;
    const sessao = obterSessao(sessionId);

    // Dispara em paralelo as consultas reais às fontes primárias oficiais com captura explícita de falhas
    const [terrenoRes, soloRes, fundiarioRes, geeTokenRes] = await Promise.all([
      medirTerrenoCopernicusEmLote([{ latitude, longitude }])
        .then((res) => ({ medicao: res[0] ?? null, erro: null }))
        .catch((err) => ({ medicao: null, erro: err })),
      queryEmbrapaSoil(latitude, longitude)
        .then((res) => ({ dados: res, erro: null }))
        .catch((err) => ({ dados: null, erro: err })),
      point.fundiario?.status === "encontrado" && point.fundiario?.codigoCar
        ? Promise.resolve({ dados: null, erro: null })
        : matchRuralProperty(latitude, longitude, "PR")
            .then((res) => ({ dados: res, erro: null }))
            .catch((err) => ({ dados: null, erro: err })),
      sessao?.gee
        ? getGoogleAccessToken(
            {
              client_email: sessao.gee.client_email,
              private_key: sessao.gee.private_key,
              token_uri: sessao.gee.token_uri,
            },
            EARTH_ENGINE_SCOPES
          )
            .then((res) => ({ token: res, erro: null }))
            .catch((err) => ({ token: null, erro: err }))
        : Promise.resolve({ token: null, erro: null }),
    ]);

    // Consulta espectral real ao Google Earth Engine REST v1 (se autenticado)
    let medicaoS2 = null;
    let erroGee = geeTokenRes.erro ?? null;
    if (geeTokenRes?.token?.accessToken && sessao?.gee?.project_id) {
      try {
        medicaoS2 = await medirSentinel2PontoGeeRest(
          latitude,
          longitude,
          geeTokenRes.token.accessToken,
          sessao.gee.project_id
        );
      } catch (err) {
        erroGee = err;
      }
    }

    const resultado = consolidarInspecaoPonto({
      point,
      terreno: terrenoRes,
      solo: soloRes,
      fundiario: fundiarioRes,
      gee: {
        medicaoS2,
        erro: erroGee,
      },
      dataConsultaAtual,
    });

    return NextResponse.json({
      ok: true,
      ponto: resultado.ponto,
      avisos: resultado.avisos,
      geeDebug: ultimoErroGee,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro na inspeção pontual." },
      { status: 500 }
    );
  }
}
