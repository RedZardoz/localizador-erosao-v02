/**
 * Extrai os 4 sítios de aferição (código CAR real + perímetro) do módulo versionado para um arquivo LOCAL
 * (opção c, DEC-10): data/sitios_referencia_local.json — fora do git, instalado só na máquina do pesquisador
 * (Google Drive -> pasta data/). Rode ANTES de o módulo ser esvaziado (bloco N06 do prompt do executor):
 *
 *   node --import ./scripts/ts-loader.mjs docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/extrair_sitios_locais.ts
 *
 * Recusa sobrescrever arquivo existente (use --forcar) e recusa gravar se o módulo já estiver esvaziado.
 * Não acessa rede. Não imprime códigos CAR (só contagens e hashes).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { SITIOS_PADRAO_OURO } from "@/lib/padraoOuro/sitiosReferencia";

const destino = path.join(process.cwd(), "data", "sitios_referencia_local.json");
const forcar = process.argv.includes("--forcar");

const sitios = (SITIOS_PADRAO_OURO as any[]).map((f) => ({
  id: f.properties.id,
  codigoCar: f.properties.codigoCar,
  nomeIdentificador: f.properties.nomeIdentificador,
  municipio: f.properties.municipio,
  bbox: f.bbox,
  geometry: f.geometry,
}));

if (sitios.length === 0 || sitios.some((s) => !s.codigoCar || !s.geometry?.coordinates?.length)) {
  console.error("[ERRO] módulo já esvaziado (sem codigoCar/geometria): nada a extrair. Se o arquivo local já existe, está tudo certo.");
  process.exit(2);
}
if (fs.existsSync(destino) && !forcar) {
  console.error(`[ERRO] ${path.relative(process.cwd(), destino)} já existe; use --forcar para sobrescrever.`);
  process.exit(3);
}
fs.mkdirSync(path.dirname(destino), { recursive: true });
const conteudo = JSON.stringify(
  {
    versao: 1,
    aviso: "DADO LOCAL — identifica imóveis rurais reais. NÃO versionar, NÃO publicar. Instalado pelo Google Drive em data/.",
    gerado_em: new Date().toISOString(),
    sitios,
  },
  null,
  2
);
fs.writeFileSync(destino, conteudo, "utf8");
const sha = crypto.createHash("sha256").update(conteudo).digest("hex");
fs.writeFileSync(destino + ".sha256", `${sha}  sitios_referencia_local.json\n`, "utf8");
console.log(`[OK] ${sitios.length} sítios gravados em data/sitios_referencia_local.json (sha256 ${sha.slice(0, 16)}…).`);
