/**
 * ============================================================================
 * Integração Sentinel-1 GRD no Earth Engine — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO (PLANO V3, §11.6):
 * Sentinel-1 GRD (radar banda C) opera independente de nuvens para o momento T0
 * pós-chuva imediata (0 a 2 dias). Detecta solo saturado por queda no retroespalhamento
 * e rugosidade superficial sem consumir cota Planet.
 */

export interface MetadadosSentinel1 {
  id: string;
  dataAdquisicao: string;
  polarizacao: ("VV" | "VH")[];
  orbita: "ASCENDING" | "DESCENDING";
  anguloIncidenciaGraus: number;
}

export interface FiltrosSentinel1 {
  latitude: number;
  longitude: number;
  dataInicio: string;
  dataFim: string;
}

/**
 * Consulta ou simula a presença de cena Sentinel-1 GRD livre de interferência de nuvens.
 */
export async function buscarCenaSentinel1T0(
  filtros: FiltrosSentinel1,
  provedorApi?: (f: FiltrosSentinel1) => Promise<MetadadosSentinel1[]>
): Promise<{ cena?: MetadadosSentinel1; encontrado: boolean }> {
  if (provedorApi) {
    const cenas = await provedorApi(filtros);
    if (cenas.length > 0) {
      return { cena: cenas[0], encontrado: true };
    }
  }

  return { encontrado: false };
}
