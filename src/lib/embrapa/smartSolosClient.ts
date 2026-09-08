/**
 * ============================================================================
 * Cliente de Integração com a API Embrapa AgroAPI / SmartSolos Expert v1
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * SERVIÇO EXTERNO:
 * - Plataforma AgroAPI - Embrapa Agricultura Digital / Embrapa Solos
 * - Base URL: https://api.cnptia.embrapa.br/smartsolos/expert/v1
 * - Sistema Especialista de Classificação de Solos no SiBCS (Santos et al., 2018)
 *
 * ENDPOINTS UTILIZADOS:
 * - GET /health: Verificação de conectividade e status do token.
 * - POST /classification: Classificação taxonômica a partir de atributos físico-químicos.
 */

const SMARTSOLOS_BASE_URL = "https://api.cnptia.embrapa.br/smartsolos/expert/v1";

export interface SmartSolosClassificationResult {
  ordem?: string;
  subordem?: string;
  grandeGrupo?: string;
  subgrupo?: string;
  taxonomiaCompleta?: string;
  source: "EMBRAPA_SMARTSOLOS_EXPERT";
  validatedAt: string;
}

/**
 * Testa a saúde do serviço SmartSolos Expert com o token fornecido.
 */
export async function checkSmartSolosHealth(token: string): Promise<boolean> {
  if (!token || token.trim().length < 8) return false;
  const rawToken = token.trim().replace(/^Bearer\s+/i, "");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${SMARTSOLOS_BASE_URL}/health`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${rawToken}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    return res.status === 200 || res.status === 204;
  } catch {
    return false;
  }
}

export interface SoilHorizonSample {
  simbolo: string; // Ex: "A", "Bt", "Bw"
  profundidadeTopoCm: number;
  profundidadeBaseCm: number;
  areiaGKg: number; // g/kg (ex: 250 para 25%)
  silteGKg: number;
  argilaGKg: number;
  carbonoOrganicoGKg?: number;
}

/**
 * Envia dados analíticos de um perfil de solo para classificação taxonômica no SmartSolos Expert da Embrapa.
 */
export async function classifyProfileWithSmartSolos(
  token: string,
  horizontes: SoilHorizonSample[]
): Promise<SmartSolosClassificationResult | null> {
  if (!token || token.trim().length < 8) return null;
  const rawToken = token.trim().replace(/^Bearer\s+/i, "");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const payload = {
      horizontes: horizontes.map((h) => ({
        simbolo: h.simbolo,
        profundidade_topo: h.profundidadeTopoCm,
        profundidade_base: h.profundidadeBaseCm,
        areia: h.areiaGKg,
        silte: h.silteGKg,
        argila: h.argilaGKg,
        carbono_organico: h.carbonoOrganicoGKg ?? 10,
      })),
    };

    const res = await fetch(`${SMARTSOLOS_BASE_URL}/classification`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${rawToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[SmartSolos Expert] Resposta não-200 da Embrapa: HTTP ${res.status}`);
      return null;
    }

    const json = await res.json();

    return {
      ordem: json?.ordem || json?.classification?.ordem,
      subordem: json?.subordem || json?.classification?.subordem,
      grandeGrupo: json?.grande_grupo || json?.classification?.grande_grupo,
      subgrupo: json?.subgrupo || json?.classification?.subgrupo,
      taxonomiaCompleta: json?.nome || json?.descricao || json?.classification?.nome,
      source: "EMBRAPA_SMARTSOLOS_EXPERT",
      validatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[SmartSolos Expert] Erro na requisição à Embrapa:", err);
    return null;
  }
}
