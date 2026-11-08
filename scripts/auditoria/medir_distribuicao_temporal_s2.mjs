/**
 * scripts/auditoria/medir_distribuicao_temporal_s2.mjs
 *
 * Medição da distribuição temporal de observações Sentinel-2 MSI L2A a partir
 * EXCLUSIVAMENTE de um arquivo de evidência da Regra 8 em LOTE arquivado em docs/verificacoes/.
 *
 * REGRAS METODOLÓGICAS (Lei Fundamental Regras 1, 8, §4, §18):
 * 1. A ÚNICA fonte de dados é um arquivo de evidência passado como argumento (process.argv[2]).
 * 2. O script não realiza chamadas de rede, não autentica e não aceita credenciais.
 * 3. Primeira linha de saída OBRIGATÓRIA: FONTE_DOS_DADOS com o arquivo lido e seu hash SHA-256.
 * 4. Sem argumento ou com arquivo inexistente/inválido: recusa com código != 0 e declara
 *    que NENHUM número foi computado. Não imprime distribuição alguma.
 * 5. Se receber arquivo no formato PONTUAL (medição de ponto único), RECUSA compulsoriamente
 *    com código != 0, explicando o formato esperado (LOTE) e o motivo da recusa, sem imprimir números.
 * 6. Parâmetros (janela D05 e limiar D11) são extraídos dinamicamente do código do projeto.
 * 7. ZERO literais numéricos que representem dado observado: tudo é derivado do arquivo.
 * 8. Registra o custo medido cronometrado gravado no arquivo (identificado como medição real).
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

// 3. Leitura e cálculo do hash SHA-256 do arquivo (emissão da PRIMEIRA LINHA OBRIGATÓRIA)
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

// 5. Verificação de contrato escritor-leitor: recusa compulsoriamente arquivo PONTUAL
if (jsonEvidencia.tipo === "REGRA_8_EVIDENCIA_GEE" || !Array.isArray(jsonEvidencia.pontos)) {
  console.error("ERRO: O arquivo fornecido está no formato PONTUAL (medição de ponto único).");
  console.error("FORMATO ESPERADO: REGRA_8_EVIDENCIA_GEE_LOTE contendo o array 'pontos' com as medições de múltiplos pontos da amostragem.");
  console.error("MOTIVO DA RECUSA: A distribuição temporal de observações é uma métrica amostral que requer o conjunto de pontos em lote para mensurar quantis e a taxa de insuficiência de D11.");
  console.error("DECLARAÇÃO: NENHUM número foi computado. Medição recusada por incompatibilidade de formato do arquivo.");
  process.exit(1);
}

const listaPontosBrutos = jsonEvidencia.pontos;
if (listaPontosBrutos.length === 0) {
  console.error("ERRO: O arquivo de evidência em lote não contém nenhum ponto no array 'pontos'.");
  console.error("DECLARAÇÃO: NENHUM número foi computado por ausência de pontos observacionais no arquivo.");
  process.exit(1);
}

// 6. Extração dos parâmetros normativos do repositório (sem literais cravados no script)
let janelaInicio = null;
let janelaFim = null;
let limiarMinimoD11 = null;

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

  if (limiarMinimoD11 === null) {
    const arqClient = path.resolve(process.cwd(), "src/lib/gee/copernicusGeeClient.ts");
    if (fs.existsSync(arqClient)) {
      const clientTxt = fs.readFileSync(arqClient, "utf8");
      const matchLimiar = clientTxt.match(/LIMIAR_MINIMO_OBSERVACOES_D11\s*=\s*(\d+)/);
      if (matchLimiar) {
        limiarMinimoD11 = parseInt(matchLimiar[1], 10);
      }
    }
  }
} catch {
  // Ignora erro de parsing de fontes locais
}

if (!janelaInicio && jsonEvidencia.janelaTemporal?.inicio) {
  janelaInicio = jsonEvidencia.janelaTemporal.inicio;
}
if (!janelaFim && jsonEvidencia.janelaTemporal?.fim) {
  janelaFim = jsonEvidencia.janelaTemporal.fim;
}

if (!janelaInicio || !janelaFim || limiarMinimoD11 === null) {
  console.error("ERRO: Falha ao resolver parâmetros normativos de D05 e D11.");
  console.error("DECLARAÇÃO: NENHUM número foi computado por inconsistência normativa.");
  process.exit(1);
}

// 7. Derivação das observações válidas na janela D05 para cada ponto do lote
const pontosProcessados = [];
let totalObservacoesNoArquivo = 0;

for (let i = 0; i < listaPontosBrutos.length; i++) {
  const p = listaPontosBrutos[i];
  const pontoId = p.id || `PONTO_${i + 1}`;
  const observacoes = Array.isArray(p.observacoes) ? p.observacoes : [];
  totalObservacoesNoArquivo += observacoes.length;

  let totalValidas = 0;
  const observacoesValidasPorAno = new Map();

  if (observacoes.length > 0) {
    for (const item of observacoes) {
      const data = typeof item.data === "string" ? item.data.slice(0, 10) : null;
      if (!data) continue;
      if (data < janelaInicio || data > janelaFim) continue;

      const ndviValido = typeof item.ndvi === "number" && Number.isFinite(item.ndvi);
      const bsiValido = typeof item.bsi === "number" && Number.isFinite(item.bsi);

      if (ndviValido || bsiValido) {
        totalValidas++;
        const ano = parseInt(data.slice(0, 4), 10);
        const atualAno = observacoesValidasPorAno.get(ano);
        observacoesValidasPorAno.set(ano, typeof atualAno === "number" ? atualAno + 1 : 1);
      }
    }
  } else if (typeof p.nObservacoesValidas === "number") {
    totalValidas = p.nObservacoesValidas;
  }

  pontosProcessados.push({
    id: pontoId,
    totalValidas,
    observacoesValidasPorAno,
  });
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

const contagensValidas = pontosProcessados.map((p) => p.totalValidas).sort((a, b) => a - b);
const minValidas = contagensValidas[0];
const maxValidas = contagensValidas[contagensValidas.length - 1];
const p25Validas = Math.round(calcularQuantil(contagensValidas, 0.25));
const medianaValidas = Math.round(calcularQuantil(contagensValidas, 0.5));
const p75Validas = Math.round(calcularQuantil(contagensValidas, 0.75));

const pontosAbaixoD11 = pontosProcessados.filter((p) => p.totalValidas < limiarMinimoD11).length;
const pctAbaixoD11 = ((pontosAbaixoD11 / pontosProcessados.length) * 100).toFixed(1) + "%";

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
  for (const pt of pontosProcessados) {
    const valAno = pt.observacoesValidasPorAno.get(ano);
    if (typeof valAno === "number") {
      somaAno += valAno;
    }
  }
  totalValidasPorAno.set(ano, somaAno);
}

// 10. Emissão dos resultados derivados estritamente do arquivo de evidência
console.log(`PARAMETRO_JANELA_D05\t${janelaInicio}\t${janelaFim}`);
console.log(`PARAMETRO_LIMIAR_D11\t${limiarMinimoD11}`);
console.log(`TOTAL_PONTOS_AVALIADOS\t${pontosProcessados.length}`);
console.log(`TOTAL_OBSERVACOES_NO_ARQUIVO\t${totalObservacoesNoArquivo}`);
console.log("");

// 11. Custo medido registrado no arquivo de evidência (medição cronometrada, não estimativa)
const custo = jsonEvidencia.custoMedido;
if (custo && typeof custo.tempoTotalMs === "number" && typeof custo.requisicoesEmitidas === "number") {
  console.log("CUSTO_MEDIDO_EXECUCAO");
  console.log(["metrica", "valor", "unidade", "natureza"].join("\t"));
  console.log(["requisicoes_http_emitidas", custo.requisicoesEmitidas, "requisicoes", "MEDICAO_REAL_CRONOMETRADA"].join("\t"));
  console.log(["tempo_total_parede_ms", custo.tempoTotalMs, "ms", "MEDICAO_REAL_CRONOMETRADA"].join("\t"));
  console.log(["tempo_medio_por_ponto_ms", custo.tempoPorPontoMs, "ms_por_ponto", "MEDICAO_REAL_CRONOMETRADA"].join("\t"));
  console.log("");
}

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
