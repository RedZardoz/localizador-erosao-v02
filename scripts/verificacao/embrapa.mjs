import fs from "fs";
import path from "path";

const EMBRAPA_OWS = "https://geoinfo.dados.embrapa.br/geoserver/ows";

async function capturar() {
  const dataHoje = new Date().toISOString().slice(0, 10);
  const dirVerif = path.resolve(process.cwd(), "docs/verificacoes");
  if (!fs.existsSync(dirVerif)) {
    fs.mkdirSync(dirVerif, { recursive: true });
  }

  console.log(`[1/4] Consultando GetCapabilities da Embrapa GeoInfo...`);
  const urlCap = `${EMBRAPA_OWS}?service=WMS&version=1.1.1&request=GetCapabilities`;
  try {
    const resCap = await fetch(urlCap, { signal: AbortSignal.timeout(20000) });
    if (!resCap.ok) throw new Error(`HTTP ${resCap.status}`);
    const xmlCap = await resCap.text();
    const arqCap = path.join(dirVerif, `${dataHoje}_embrapa_capabilities.xml`);
    fs.writeFileSync(arqCap, xmlCap, "utf-8");
    console.log(`  -> Salvo: ${arqCap} (${xmlCap.length} bytes)`);
  } catch (err) {
    console.error(`  -> Erro ao consultar GetCapabilities:`, err);
  }

  // Coordenadas documentadas:
  // 1. Oeste: -25.067, -53.688
  // 2. Noroeste: -23.42, -52.60
  // 3. Oceano: -25.5, -45.0
  const pontos = [
    { nome: "oeste", lat: -25.067, lng: -53.688 },
    { nome: "noroeste", lat: -23.42, lng: -52.60 },
    { nome: "oceano", lat: -25.5, lng: -45.0 },
  ];

  for (const pt of pontos) {
    console.log(`Consultando GetFeatureInfo em ${pt.nome} (${pt.lat}, ${pt.lng})...`);
    const delta = 0.05;
    const bbox = `${pt.lng - delta},${pt.lat - delta},${pt.lng + delta},${pt.lat + delta}`;
    const params = new URLSearchParams({
      service: "WMS",
      version: "1.1.1",
      request: "GetFeatureInfo",
      layers: "geonode:parana_solos_20201105,geonode:brasil_erodibilidade_solo",
      query_layers: "geonode:parana_solos_20201105,geonode:brasil_erodibilidade_solo",
      bbox,
      width: "101",
      height: "101",
      srs: "EPSG:4326",
      x: "50",
      y: "50",
      info_format: "application/json",
      feature_count: "10",
    });

    try {
      const urlInfo = `${EMBRAPA_OWS}?${params.toString()}`;
      const resInfo = await fetch(urlInfo, { signal: AbortSignal.timeout(20000) });
      if (!resInfo.ok) throw new Error(`HTTP ${resInfo.status}`);
      const jsonInfo = await resInfo.text();
      const arqInfo = path.join(dirVerif, `${dataHoje}_embrapa_featureinfo_${pt.nome}.json`);
      fs.writeFileSync(arqInfo, jsonInfo, "utf-8");
      console.log(`  -> Salvo: ${arqInfo} (${jsonInfo.length} bytes)`);
    } catch (err) {
      console.error(`  -> Erro ao consultar ${pt.nome}:`, err);
    }
  }

  console.log("Captura de evidências concluída.");
}

capturar();
