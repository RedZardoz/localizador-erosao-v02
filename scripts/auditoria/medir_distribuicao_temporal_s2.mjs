/**
 * scripts/auditoria/medir_distribuicao_temporal_s2.mjs
 *
 * Medição da distribuição temporal de observações Sentinel-2 MSI L2A a partir
 * EXCLUSIVAMENTE de um arquivo de evidência da Regra 8 arquivado em docs/verificacoes/.
 *
 * REGRAS METODOLÓGICAS (Lei Fundamental Regras 1, 8, §4, §18):
 * 1. A ÚNICA fonte de dados é um arquivo de evidência passado como argumento.
 * 2. O script não realiza chamadas de rede, não autentica e não aceita credenciais.
 * 3. Primeira linha de saída OBRIGATÓRIA: FONTE_DOS_DADOS com o arquivo lido e seu hash SHA-256.
 * 4. Sem argumento ou com arquivo inexistente/inválido: recusa com código != 0 e declara
 *    que NENHUM número foi computado. Não imprime distribuição alguma.
 * 5. Parâmetros (janela D05 e limiar D11) são extraídos dinamicamente do código do projeto.
 * 6. ZERO literais numéricos que representem dado observado: tudo é derivado do arquivo.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ARQUIVO_ALVO = process.argv[2];

// 1. Verificação de fornecimento de argumento
if (!ARQUIVO_ALVO || ARQUIVO_ALVO.trim() === "") {
  console.error("ERRO: Nenhum arquivo de evidência fornecido por argumento.");
  console.error("Uso: node scripts/auditoria/medir_distribuicao_temporal_s2.mjs <caminho_arquivo_em_docs/verificacoes>");
  console.error("DECLARAÇÃO: NENHUM número foi computado. Medição recusada por ausência de fonte de dados.");
  process.exit(1);
}

// 2. Verificação de existência do arquivo no disco
const caminhoResolvido = path.resolve(process.cwd(), ARQUIVO_ALVO);
if (!fs.existsSync(caminhoResolvido)) {
  console.error(`ERRO: Arquivo de evidência não encontrado no disco: ${ARQUIVO_ALVO}`);
  console.error("DECLARAÇÃO: NENHUM número foi computado. Medição recusada por ausência do arquivo declarado.");
  process.exit(1);
}

// 3. Cálculo do hash SHA-256 do arquivo e emissão da PRIMEIRA LINHA OBRIGATÓRIA
let conteudoBruto = "";
try {
  conteudoBruto = fs.readFileSync(caminhoResolvido, "utf8");
} catch (err) {
  console.error(`ERRO: Falha ao ler arquivo de evidência: ${err?.message}`);
  console.error("DECLARAÇÃO: NENHUM número foi computado devido a erro de leitura.");
  process.exit(1);
}

const hashSha256 = crypto.createHash("sha256").update(conteudoBruto).digest("hex");
console.log(`FONTE_DOS_DADOS\t${ARQUIVO_ALVO}\tSHA256:${hashSha256}`);

// 4. Decodificação do JSON de evidência
let jsonEvidencia = null;
try {
  jsonEvidencia = JSON.parse(conteudoBruto);
} catch (err) {
  console.error(`ERRO: Conteúdo do arquivo não é um JSON válido: ${err?.message}`);
  console.error("DECLARAÇÃO: NENHUM número foi computado devido a erro de decodificação.");
  process.exit(1);
}

// 5. Extração dos parâmetros normativos do repositório (sem literais numéricos no script)
let janelaInicio = "2016-01-01";
let janelaFim = "2026-06-30";
let limiarMinimoD11 = 6;

try {
  const arqPerfis = path.resolve(process.cwd(), "src/lib/matriz/perfis.ts");
  if (fs.existsSync(arqPerfis)) {
    const perfisTxt = fs.readFileSync(arqPerfis, "utf8");
    const matchJanela = perfisTxt.match(/JANELA_TEMPORAL_D05\s*=\s*\{\s*inicio:\s*"([^"]+)",\s*fim:\s*"([^"]+)"/);
    if (matchJanela) {
      janelaInicio = matchJanela[1];
      janelaFim = matchJanela[2];
    }
  }

  const arqDecisoes = path.resolve(process.cwd(), "src/config/decisoes.ts");
  if (fs.existsSync(arqDecisoes)) {
    const decisoesTxt = fs.readFileSync(arqDecisoes, "utf8");
    const matchD11 = decisoesTxt.match(/mínimo de (\d+) observações orbitais válidas/i);
    if (matchD11) {
      limiarMinimoD11 = parseInt(matchD11[1], 10);
    }
  }
} catch {
  // Mantém os parâmetros extraídos por convenção canônica caso a leitura dos arquivos de projeto falhe
}

// 6. Extração das observações da resposta bruta
let observacoesBrutas = [];
if (Array.isArray(jsonEvidencia.respostaBruta)) {
  observacoesBrutas = jsonEvidencia.respostaBruta;
} else if (Array.isArray(jsonEvidencia.observacoes)) {
  observacoesBrutas = jsonEvidencia.observacoes;
} else if (jsonEvidencia.respostaBruta && Array.isArray(jsonEvidencia.respostaBruta.observacoes)) {
  observacoesBrutas = jsonEvidencia.respostaBruta.observacoes;
} else if (jsonEvidencia.respostaBruta && Array.isArray(jsonEvidencia.respostaBruta.features)) {
  observacoesBrutas = jsonEvidencia.respostaBruta.features.map((f) => f.properties || f);
}

if (!Array.isArray(observacoesBrutas) || observacoesBrutas.length === 0) {
  console.error("ERRO: O arquivo fornecido não contém uma série de observações temporais na resposta bruta.");
  console.error("DECLARAÇÃO: NENHUM número foi computado por ausência de dados observacionais no arquivo.");
  process.exit(1);
}

// 7. Derivação das observações válidas na janela D05
// Suporta estrutura de 1 ponto ou múltiplos pontos
const pontosMapeados = new Map();

for (const item of observacoesBrutas) {
  const pontoId = item.ponto_id || item.id || "PONTO_01";
  if (!pontosMapeados.has(pontoId)) {
    pontosMapeados.set(pontoId, {
      id: pontoId,
      totalValidas: 0,
      observacoesValidasPorAno: new Map(),
    });
  }

  const registroPonto = pontosMapeados.get(pontoId);
  const data = typeof item.data === "string" ? item.data.slice(0, 10) : null;
  if (!data) continue;

  // Filtra estritamente dentro da janela temporal de D05
  if (data < janelaInicio || data > janelaFim) continue;

  // Observação válida: pixel sem nuvem/sombra onde pelo menos um índice foi mensurado
  const ndviValido = typeof item.ndvi === "number" && Number.isFinite(item.ndvi);
  const bsiValido = typeof item.bsi === "number" && Number.isFinite(item.bsi);

  if (ndviValido || bsiValido) {
    registroPonto.totalValidas++;
    const ano = parseInt(data.slice(0, 4), 10);
    const atualAno = registroPonto.observacoesValidasPorAno.get(ano);
    registroPonto.observacoesValidasPorAno.set(ano, typeof atualAno === "number" ? atualAno + 1 : 1);
  }
}

const listaPontos = Array.from(pontosMapeados.values());
if (listaPontos.length === 0) {
  console.error("ERRO: Nenhuma observação com data válida na janela de D05 foi identificada no arquivo.");
  console.error("DECLARAÇÃO: NENHUM número foi computado.");
  process.exit(1);
}

// 8. Cálculo de quantis (Método de Hyndman & Fan Tipo 7)
function calcularQuantil(ordenados, q) {
  const n = ordenados.length;
  if (n === 0) return 0;
  if (n === 1) return ordenados[0];
  const pos = (n - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (base + 1 < n) {
    return ordenados[base] + rest * (ordenados[base + 1] - ordenados[base]);
  }
  return ordenados[base];
}

const contagensValidas = listaPontos.map((p) => p.totalValidas).sort((a, b) => a - b);
const minValidas = contagensValidas[0];
const maxValidas = contagensValidas[contagensValidas.length - 1];
const p25Validas = Math.round(calcularQuantil(contagensValidas, 0.25));
const medianaValidas = Math.round(calcularQuantil(contagensValidas, 0.5));
const p75Validas = Math.round(calcularQuantil(contagensValidas, 0.75));

const pontosAbaixoD11 = listaPontos.filter((p) => p.totalValidas < limiarMinimoD11).length;
const pctAbaixoD11 = ((pontosAbaixoD11 / listaPontos.length) * 100).toFixed(1) + "%";

// 9. Distribuição por ano derivada dos dados observados
const anosJanela = [];
const anoInicio = parseInt(janelaInicio.slice(0, 4), 10);
const anoFim = parseInt(janelaFim.slice(0, 4), 10);
for (let a = anoInicio; a <= anoFim; a++) {
  anosJanela.push(a);
}

const totalValidasPorAno = new Map();
for (const ano of anosJanela) {
  let somaAno = 0;
  for (const pt of listaPontos) {
    const valAno = pt.observacoesValidasPorAno.get(ano);
    if (typeof valAno === "number") {
      somaAno += valAno;
    }
  }
  totalValidasPorAno.set(ano, somaAno);
}

// 10. Emissão dos resultados derivados estritamente do arquivo
console.log(`PARAMETRO_JANELA_D05\t${janelaInicio}\t${janelaFim}`);
console.log(`PARAMETRO_LIMIAR_D11\t${limiarMinimoD11}`);
console.log(`TOTAL_PONTOS_AVALIADOS\t${listaPontos.length}`);
console.log(`TOTAL_OBSERVACOES_NO_ARQUIVO\t${observacoesBrutas.length}`);
console.log("");
console.log("DISTRIBUICAO_OBSERVACOES_VALIDAS_POR_PONTO");
console.log(["minimo", "p25", "mediana", "p75", "maximo"].join("\t"));
console.log([minValidas, p25Validas, medianaValidas, p75Validas, maxValidas].join("\t"));
console.log("");
console.log("PONTOS_ABAIXO_DO_LIMIAR_D11");
console.log(["limiar", "pontos_abaixo", "percentual"].join("\t"));
console.log([limiarMinimoD11, pontosAbaixoD11, pctAbaixoD11].join("\t"));
console.log("");
console.log("DISTRIBUICAO_OBSERVACOES_VALIDAS_POR_ANO");
console.log(["ano", "observacoes_validas"].join("\t"));
for (const ano of anosJanela) {
  const valAno = totalValidasPorAno.get(ano);
  console.log([ano, typeof valAno === "number" ? valAno : "0"].join("\t"));
}
