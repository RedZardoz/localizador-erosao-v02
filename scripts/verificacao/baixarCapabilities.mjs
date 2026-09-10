import fs from "fs";

async function run() {
  console.log("Baixando GetCapabilities da Embrapa GeoInfo com timeout de 60s...");
  const res = await fetch("https://geoinfo.dados.embrapa.br/geoserver/ows?service=WMS&version=1.1.1&request=GetCapabilities", {
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  fs.writeFileSync("docs/verificacoes/2026-09-10_embrapa_capabilities.xml", xml, "utf-8");
  console.log("GetCapabilities salvo com sucesso! Tamanho:", xml.length);
}

run().catch((err) => {
  console.error("Erro no download:", err);
  process.exit(1);
});
