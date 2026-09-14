import fs from "fs";
import path from "path";

async function main() {
  console.log("Coletando evidência real de integração com a API do IBGE...");
  const codigoMunicipio = 4103206; // Boa Ventura de São Roque / PR

  const urlLocalidade = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${codigoMunicipio}`;
  console.log("Consultando dados cadastrais:", urlLocalidade);
  const resLoc = await fetch(urlLocalidade);
  if (!resLoc.ok) throw new Error(`HTTP ${resLoc.status} em localidade`);
  const dadosLoc = await resLoc.json();

  const urlMalha = `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${codigoMunicipio}?formato=application/vnd.geo+json`;
  console.log("Consultando malha vetorial:", urlMalha);
  const resMalha = await fetch(urlMalha);
  if (!resMalha.ok) throw new Error(`HTTP ${resMalha.status} em malha`);
  const malhaGeoJson = await resMalha.json();

  const evidencia = {
    fonte: "IBGE - Instituto Brasileiro de Geografia e Estatística",
    dataVerificacao: new Date().toISOString(),
    municipioConsultado: {
      codigo: codigoMunicipio,
      nome: dadosLoc.nome,
      microrregiao: dadosLoc.microrregiao?.nome,
      uf: dadosLoc.microrregiao?.mesorregiao?.UF?.sigla,
    },
    tipoGeometria: malhaGeoJson.features?.[0]?.geometry?.type,
    numeroPontosPoligono: malhaGeoJson.features?.[0]?.geometry?.coordinates?.[0]?.length,
    amostraCoordenadas: malhaGeoJson.features?.[0]?.geometry?.coordinates?.[0]?.slice(0, 5),
  };

  const outFile = path.join(process.cwd(), "docs", "verificacoes", "2026-09-10_ibge_municipio_exemplo.json");
  fs.writeFileSync(outFile, JSON.stringify(evidencia, null, 2), "utf8");
  console.log("Evidência gravada com sucesso em:", outFile);
}

main().catch(err => {
  console.error("Erro na verificação IBGE:", err);
  process.exit(1);
});
