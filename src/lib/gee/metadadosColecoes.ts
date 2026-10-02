/**
 * ============================================================================
 * Metadados de Publicação de Coleções Estáticas e Extração de Data Sentinel-2
 * ============================================================================
 *
 * Regra 3 & F0.3: Datas de aquisição (`adquiridoEm`) jamais podem ser literais
 * espalhados pelas rotas. Para coleções estáticas (MDE, Cobertura do Solo,
 * Levantamento Pedológico), utiliza-se a data oficial de publicação da versão
 * da coleção com URL de catálogo conferida. Para séries dinâmicas Sentinel-2,
 * extrai-se a data real de aquisição (`YYYY-MM-DD`) do timestamp da cena (`time_max`)
 * ou do `PRODUCT_ID` (`S2A_MSIL2A_YYYYMMDDTHHMMSS_...`).
 */

/**
 * Copernicus DEM GLO-30 (Global 30m Digital Elevation Model — European Space Agency).
 * Catálogo Earth Engine: https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_DEM_GLO30
 * Nota de lançamento ESA PRISM (Release 2023_1): https://prism-dem-open.copernicus.eu/
 */
export const DATA_PUBLICACAO_COPERNICUS_GLO30 = "2023-11-15";

/**
 * Levantamento de Reconhecimento dos Solos do Estado do Paraná — Embrapa Solos GeoInfo.
 * Camada OGC WMS/WFS: `geonode:parana_solos_20201105` (data de publicação 2020-11-05 no identificador oficial).
 * Catálogo oficial Embrapa GeoInfo: https://geoinfo.dados.embrapa.br/catalogue/#/dataset/2384
 */
export const DATA_PUBLICACAO_EMBRAPA_SOLOS_PR = "2020-11-05";

/**
 * ESA WorldCover 10m 2020 v100 (European Space Agency).
 * Catálogo Earth Engine: https://developers.google.com/earth-engine/datasets/catalog/ESA_WorldCover_v100
 * Registro Zenodo (publicado em 20/10/2021): https://doi.org/10.5281/zenodo.5571936
 */
export const DATA_PUBLICACAO_ESA_WORLDCOVER_V100 = "2021-10-20";

/**
 * ESA WorldCover 10m 2021 v200 (European Space Agency).
 * Catálogo Earth Engine: https://developers.google.com/earth-engine/datasets/catalog/ESA_WorldCover_v200
 * Registro Zenodo (publicado em 28/10/2022): https://doi.org/10.5281/zenodo.7254221
 */
export const DATA_PUBLICACAO_ESA_WORLDCOVER_V200 = "2022-10-28";

/**
 * MapBiomas Brasil — Coleção 8.0 da Série Anual de Mapas de Cobertura e Uso da Terra.
 * Catálogo oficial MapBiomas: https://brasil.mapbiomas.org/colecoes-mapbiomas/
 * Nota: data de lançamento público da Coleção 8.0 (agosto de 2023).
 */
export const DATA_PUBLICACAO_MAPBIOMAS_COL8 = "2023-08-31";

/**
 * EC JRC / Google Global Surface Water Mapping Layers v1.4 (1984–2021).
 * Catálogo Earth Engine: https://developers.google.com/earth-engine/datasets/catalog/JRC_GSW1_4_GlobalSurfaceWater
 * Referência: Pekel et al. (2016), Nature 540:418-422.
 */
export const DATA_PUBLICACAO_JRC_GSW_V1_4 = "2022-11-01";

/**
 * IBGE — Malha Municipal Digital da Divisão Político-Administrativa Brasileira (Edição 2023).
 * Catálogo oficial IBGE Geociências: https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html
 * Repositório FTP oficial: https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2023/
 */
export const DATA_PUBLICACAO_IBGE_MALHA_MUNICIPAL_2023 = "2024-04-17";

/**
 * Instituto Água e Terra do Paraná (IAT) — Divisão de Bacias Hidrográficas do Estado do Paraná.
 * Catálogo oficial de Dados Espaciais IAT-PR: https://www.iat.pr.gov.br/Pagina/Mapas-e-Dados-Espaciais
 * Nota: data de referência da base cartográfica hidrográfica estadual (verificada no portal IAT-PR).
 */
export const DATA_PUBLICACAO_IAT_BACIAS_PR = "2020-06-15";

/**
 * Extrai a data ISO (`YYYY-MM-DD`) a partir de um `PRODUCT_ID` ou identificador de cena
 * Sentinel-2 (`S2A_MSIL2A_20240815T134209_...` ou `20240815T134209_...`) ou de um
 * timestamp epoch em milissegundos retornado pelo Google Earth Engine (`system:time_start`).
 */
export function extrairDataAquisicaoSentinel2(
  opcoes: { timestampMs?: number | null; cenas?: string[] | null }
): string | null {
  if (typeof opcoes.timestampMs === "number" && Number.isFinite(opcoes.timestampMs) && opcoes.timestampMs > 0) {
    return new Date(opcoes.timestampMs).toISOString().slice(0, 10);
  }
  if (Array.isArray(opcoes.cenas)) {
    for (const cena of opcoes.cenas) {
      const match = String(cena).match(/(?:^|_)(\d{4})(\d{2})(\d{2})T\d{6}/);
      if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
      }
    }
  }
  return null;
}
