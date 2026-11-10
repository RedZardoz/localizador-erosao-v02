/**
 * ============================================================================
 * Medição de Frequência de Solo Nu em Lote via Earth Engine REST API (C3)
 * SAREL v2.0 — Disciplina Pericial PPGTCA 2026 (Decisões D05, D07, D10, D11, D16)
 * ============================================================================
 *
 * REGRAS INVIOLÁVEIS:
 * - Regra C1: Autenticação exclusiva via Service Account em arquivo JSON externo
 *   apontado por SAREL_GEE_SERVICE_ACCOUNT_FILE. Recusa estrita (fail-closed)
 *   se ausente ou se apontar para dentro do repositório.
 * - Regra 1 / Invariante 5: Jamais emite número simulado. Ê = 0 é medida real;
 *   falha de ponto é 'indisponivel' com causa documentada.
 * - Regra C3: Cache determinístico persistente invalidado por hash metodológico
 *   e salvamento incremental a cada bloco.
 */

import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import {
  carregarCredenciaisServiceAccountLote,
  obterCaminhoCredencialServiceAccountLote,
  NOME_VAR_ENV_GEE_SERVICE_ACCOUNT,
} from "@/lib/seguranca/credenciaisSeguras";
import { getGoogleAccessToken, EARTH_ENGINE_SCOPES } from "@/lib/gee/auth";
import {
  medirFrequenciaSoloNuEmLoteGeeRest,
  carregarCacheFrequenciaSoloNu,
  salvarCacheFrequenciaSoloNu,
  calcularHashDefinicao,
  DEFINICAO_METRICA_SOLO_NU,
  obterCaminhoPadraoCacheFrequenciaSoloNu,
  PontoAmostragemSoloNu,
  MedicaoSoloNuLote,
} from "@/lib/gee/amostragemSoloNuLote";
import { criarPrng } from "@/lib/gee/estratificacao";
import { calcularPercentilOrdenado } from "@/lib/gee/estatisticasSerie";
import {
  criarDiarioRequisicoes,
  salvarDiarioRequisicoes,
  DiarioRequisicoes,
} from "@/lib/seguranca/diarioRequisicoes";
import { valorOuNulo } from "@/types/proveniencia";

export const FONTE_DOS_DADOS =
  "Google Earth Engine REST v1 (COPERNICUS/S2_SR_HARMONIZED) — Conjunção GEOS3 (Demattê et al., 2018)";

export interface ArgumentosCli {
  limite?: number;
  retomar: boolean;
  saida: string;
  candidatosArquivo: string;
  cacheArquivo: string;
  semente: number;
  tamanhoBloco: number;
}

export function parseArgumentos(args: string[]): ArgumentosCli {
  let limite: number | undefined = undefined;
  let retomar = false;
  let saida = path.resolve(process.cwd(), "docs/verificacoes/calibracao_30_pontos_solo_nu.json");
  let candidatosArquivo = path.resolve(
    process.cwd(),
    "docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json"
  );
  let cacheArquivo = obterCaminhoPadraoCacheFrequenciaSoloNu();
  let semente = 20261109; // Semente determinística padrão declarada
  let tamanhoBloco = 1; // Para calibração individual de latência por ponto; pode ser customizado via --tamanho-bloco

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--limite" && i + 1 < args.length) {
      limite = parseInt(args[++i], 10);
    } else if (arg === "--retomar") {
      retomar = true;
    } else if (arg === "--saida" && i + 1 < args.length) {
      saida = path.resolve(process.cwd(), args[++i]);
    } else if (arg === "--candidatos" && i + 1 < args.length) {
      candidatosArquivo = path.resolve(process.cwd(), args[++i]);
    } else if (arg === "--cache" && i + 1 < args.length) {
      cacheArquivo = path.resolve(process.cwd(), args[++i]);
    } else if (arg === "--semente" && i + 1 < args.length) {
      semente = parseInt(args[++i], 10);
    } else if (arg === "--tamanho-bloco" && i + 1 < args.length) {
      tamanhoBloco = parseInt(args[++i], 10);
    }
  }

  return {
    limite,
    retomar,
    saida,
    candidatosArquivo,
    cacheArquivo,
    semente,
    tamanhoBloco,
  };
}

export function carregarCandidatos(caminhoArquivo: string): {
  pontos: PontoAmostragemSoloNu[];
  fonte: string;
  aviso?: string;
} {
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo de candidatos não encontrado no disco: '${caminhoArquivo}'`);
  }

  const raw = fs.readFileSync(caminhoArquivo, "utf8");
  const dados = JSON.parse(raw);

  let listaBruta: any[] = [];
  let fonte = caminhoArquivo;
  let aviso: string | undefined = undefined;

  if (Array.isArray(dados)) {
    listaBruta = dados;
  } else if (Array.isArray(dados.candidatos)) {
    listaBruta = dados.candidatos;
  } else if (Array.isArray(dados.candidatosMedidos)) {
    listaBruta = dados.candidatosMedidos;
  } else if (Array.isArray(dados.itens)) {
    listaBruta = dados.itens;
  } else if (Array.isArray(dados.pontos)) {
    listaBruta = dados.pontos;
  } else if (dados.itens && typeof dados.itens === "object") {
    listaBruta = Object.entries(dados.itens).map(([k, v]: [string, any]) => ({ id: k, ...v }));
  }

  // Se o arquivo inspecionado não contiver a lista individual (caso de arquivos apenas com agregados)
  if (listaBruta.length === 0) {
    const totalTerreno =
      typeof dados.funilContagem?.candidatosComTerrenoD07 === "number"
        ? dados.funilContagem.candidatosComTerrenoD07
        : typeof dados.totalCandidatos === "number"
          ? dados.totalCandidatos
          : "N/D";
    throw new Error(
      `[FAIL-CLOSED] O arquivo indicado '${caminhoArquivo}' contém metadados/agregados do funil amostral ` +
      `(${totalTerreno} candidatos), mas não lista as coordenadas individuais de cada candidato. ` +
      `É obrigatório indicar um arquivo com registros individuais (ex: 'docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json'). ` +
      `Substituições automáticas de universo ou fallbacks silenciosos são estritamente vedados.`
    );
  }

  const pontos: PontoAmostragemSoloNu[] = [];
  for (const item of listaBruta) {
    const id = item.id ?? item.ponto_id ?? item.cand_id;
    const lat = item.latitude ?? item.lat;
    const lon = item.longitude ?? item.lon ?? item.lng;

    if (
      id &&
      typeof lat === "number" &&
      typeof lon === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lon)
    ) {
      pontos.push({ id: String(id), latitude: lat, longitude: lon });
    }
  }

  return { pontos, fonte, aviso };
}

export function selecionarAmostraPrng(
  candidatos: PontoAmostragemSoloNu[],
  limite: number,
  semente: number
): PontoAmostragemSoloNu[] {
  if (limite <= 0 || limite >= candidatos.length) {
    return [...candidatos];
  }

  const prng = criarPrng(semente);
  const copia = [...candidatos];

  // Amostragem sem reposição via Fisher-Yates parcial com PRNG determinístico
  for (let i = 0; i < limite; i++) {
    const j = i + Math.floor(prng() * (copia.length - i));
    const temp = copia[i];
    copia[i] = copia[j];
    copia[j] = temp;
  }

  return copia.slice(0, limite);
}

export interface MetricasCalibracaoSoloNu {
  totalPontosAvaliados: number;
  sementePrng: number;
  pontosSorteadosIds: string[];
  tempoTotalMs: number;
  tempoPorPontoMs: {
    mediana: number;
    p95: number;
    maximo: number;
    minimo: number;
    media: number;
  };
  pontosMedidos: number;
  pontosIndisponiveis: number;
  falhasPorCausa: Record<string, number>;
  nObservacoesPorPonto: {
    mediana: number;
    minimo: number;
    maximo: number;
    media: number;
    pontosAbaixoDe12Obs: number;
  };
  requisicoesGee: {
    totalChamadas: number;
    errosPorCodigo: Record<number, number>;
  };
  definicaoMetrica: string;
  hashDefinicao: string;
  projetado680Pontos: {
    tempoMedianaMinutos: number;
    tempoP95Minutos: number;
    diferencaMinutos: number;
  };
}

async function principal() {
  const args = parseArgumentos(process.argv.slice(2));

  console.log("===============================================================================");
  console.log("SAREL v2.0 — Medição de Frequência de Solo Nu em Lote (GEE REST)");
  console.log(`FONTE_DOS_DADOS: ${FONTE_DOS_DADOS}`);
  console.log(`DEFINICAO_METRICA_SOLO_NU: ${DEFINICAO_METRICA_SOLO_NU}`);
  console.log(`Hash da Definição: ${calcularHashDefinicao()}`);
  console.log("===============================================================================\n");

  // 1. Leitura e amostragem de candidatos (validação fail-closed antecipada)
  console.log(`[1/5] Carregando universo de candidatos de '${args.candidatosArquivo}'...`);
  let carregamento: ReturnType<typeof carregarCandidatos>;
  try {
    carregamento = carregarCandidatos(args.candidatosArquivo);
  } catch (err: any) {
    console.error("\n===============================================================================");
    console.error(`[ERRO UNIVERSO DE CANDIDATOS] Recusa fail-closed ao carregar candidatos:`);
    console.error(`  ${err?.message || String(err)}`);
    console.error("===============================================================================\n");
    process.exit(1);
  }
  const { pontos: candidatosDisponiveis, fonte: fonteCandidatos, aviso } = carregamento;

  if (aviso) {
    console.log(`  -> ${aviso}`);
  }
  console.log(`  -> Candidatos válidos carregados: ${candidatosDisponiveis.length} (Fonte: ${fonteCandidatos})`);

  if (candidatosDisponiveis.length === 0) {
    console.error("[ERRO] Nenhum candidato com coordenadas válidas encontrado para medição.");
    process.exit(1);
  }

  let pontosParaMedir = candidatosDisponiveis;
  if (typeof args.limite === "number" && args.limite > 0) {
    console.log(
      `  -> Aplicando seleção determinística de ${args.limite} pontos com PRNG LCG (Semente: ${args.semente})...`
    );
    pontosParaMedir = selecionarAmostraPrng(candidatosDisponiveis, args.limite, args.semente);
    console.log(`  -> ${pontosParaMedir.length} pontos sorteados:`);
    console.log(`     ${pontosParaMedir.map((p) => p.id).join(", ")}`);
  }

  // 2. Verificação estrita de credencial (Regra C1)
  console.log("\n[2/5] Verificando credencial de lote conforme Regra C1...");
  let credsLote: ReturnType<typeof carregarCredenciaisServiceAccountLote> = null;

  try {
    const caminhoCredencial = obterCaminhoCredencialServiceAccountLote();
    if (!caminhoCredencial) {
      console.error("\n===============================================================================");
      console.error("[VIOLAÇÃO REGRA C1] Credencial GEE de lote ausente no ambiente.");
      console.error(`A variável de ambiente '${NOME_VAR_ENV_GEE_SERVICE_ACCOUNT}' não está configurada.`);
      console.error("Conforme a Regra Inviolável C1 (Via de Lote):");
      console.error("  1. Nenhuma credencial toca a árvore do repositório, mesmo que em .gitignore.");
      console.error("  2. A ingestão por lote exige o CAMINHO para um arquivo JSON externo fora da raiz do projeto.");
      console.error("  3. Na ausência de credencial viva do GEE, a medição é interrompida (fail-closed).");
      console.error("  4. NENHUM número sintético ou fallback é admitido (Regra 1 / Invariante 5).");
      console.error("===============================================================================\n");
      process.exit(1);
    }

    credsLote = carregarCredenciaisServiceAccountLote();
  } catch (err: any) {
    console.error("\n===============================================================================");
    console.error(`[VIOLAÇÃO REGRA C1] Erro na validação da credencial: ${err?.message}`);
    console.error("===============================================================================\n");
    process.exit(1);
  }

  if (!credsLote) {
    console.error(`\n[VIOLAÇÃO REGRA C1] Falha ao carregar credenciais de Service Account.`);
    process.exit(1);
  }

  console.log(`  -> Credencial validada: Service Account '${credsLote.client_email}' (Projeto: '${credsLote.project_id}')`);

  // 3. Autenticação OAuth2 RFC 7523
  console.log("\n[3/5] Autenticando junto ao Google Earth Engine via RFC 7523...");
  let tokenAcesso: { accessToken: string; expiresAt?: number } | null = null;
  try {
    tokenAcesso = await getGoogleAccessToken(credsLote, EARTH_ENGINE_SCOPES);
    console.log("  -> Autenticação bem-sucedida. Token de acesso obtido.");
  } catch (err: any) {
    console.error(`\n[ERRO AUTENTICAÇÃO GEE] Falha ao trocar asserção JWT por access token: ${err?.message}`);
    process.exit(1);
  }

  // 4. Medição de solo nu via GEE REST com cache determinístico e diário
  console.log(`\n[4/5] Iniciando medição de ${pontosParaMedir.length} pontos via GEE REST...`);
  console.log(`  -> Tamanho de bloco: ${args.tamanhoBloco}`);
  console.log(`  -> Modo de retomada: ${args.retomar ? "Ativo (usa cache existente)" : "Inativo"}`);
  console.log(`  -> Arquivo de cache: ${args.cacheArquivo}`);

  const dirDiario = path.resolve(process.cwd(), "docs/verificacoes");
  const caminhoDiario = path.join(dirDiario, "diario_requisicoes_solo_nu_calibracao.json");
  const diario = criarDiarioRequisicoes("scripts/medir_frequencia_solo_nu_lote.ts");

  const temposPorPontoMs: number[] = [];
  const temposBlocoMs: number[] = [];
  const nObservacoesLista: number[] = [];
  let pontosMedidos = 0;
  let pontosIndisponiveis = 0;
  const falhasPorCausa: Record<string, number> = {};

  const inicioTotal = performance.now();

  const { resultados, metricas } = await medirFrequenciaSoloNuEmLoteGeeRest(
    pontosParaMedir,
    { accessToken: tokenAcesso.accessToken, projectId: credsLote.project_id },
    {
      tamanhoBloco: args.tamanhoBloco,
      caminhoCache: args.cacheArquivo,
      ignorarCache: !args.retomar,
      salvarCache: true,
      diario,
    }
  );

  const tempoTotalMs = Math.round(performance.now() - inicioTotal);

  if (diario.totalChamadas > 0) {
    salvarDiarioRequisicoes(diario, caminhoDiario);
  }

  // Extrai latências registradas no diário de requisições
  const errosPorCodigo: Record<number, number> = {};
  for (const chamada of diario.chamadas) {
    temposBlocoMs.push(chamada.duracaoMs);
    const msPorPonto = chamada.quantidadeItens > 0 ? chamada.duracaoMs / chamada.quantidadeItens : chamada.duracaoMs;
    const repeticoes = chamada.quantidadeItens > 1 ? chamada.quantidadeItens : 1;
    for (let k = 0; k < repeticoes; k++) {
      temposPorPontoMs.push(msPorPonto);
    }
    const contAtualHttp = errosPorCodigo[chamada.codigoHttp];
    errosPorCodigo[chamada.codigoHttp] = typeof contAtualHttp === "number" ? contAtualHttp + 1 : 1;
  }

  // Compila resultados dos pontos
  for (const pt of pontosParaMedir) {
    const med = resultados.get(pt.id);
    if (!med) {
      pontosIndisponiveis++;
      const contSemRes = falhasPorCausa["sem-resultado"];
      falhasPorCausa["sem-resultado"] = typeof contSemRes === "number" ? contSemRes + 1 : 1;
      continue;
    }

    if (med.frequenciaSoloNu.estado === "medido") {
      pontosMedidos++;
      nObservacoesLista.push(med.nObservacoes);
    } else {
      pontosIndisponiveis++;
      const rawCausa = (med.frequenciaSoloNu as any).causa;
      const causa = typeof rawCausa === "string" && rawCausa.length > 0 ? rawCausa : "indisponivel";
      const contCausa = falhasPorCausa[causa];
      falhasPorCausa[causa] = typeof contCausa === "number" ? contCausa + 1 : 1;
    }
  }

  // Se tempos individuais não vieram do diário (ex: cache hits)
  if (temposPorPontoMs.length === 0 && pontosParaMedir.length > 0) {
    const tempoMedio = tempoTotalMs / pontosParaMedir.length;
    for (let i = 0; i < pontosParaMedir.length; i++) {
      temposPorPontoMs.push(tempoMedio);
    }
  }

  const temposOrdenados = [...temposPorPontoMs].sort((a, b) => a - b);
  const obsOrdenadas = [...nObservacoesLista].sort((a, b) => a - b);

  const medianaTempo = temposOrdenados.length > 0 ? calcularPercentilOrdenado(temposOrdenados, 50) : 0;
  const p95Tempo = temposOrdenados.length > 0 ? calcularPercentilOrdenado(temposOrdenados, 95) : 0;
  const maxTempo = temposOrdenados.length > 0 ? temposOrdenados[temposOrdenados.length - 1] : 0;
  const minTempo = temposOrdenados.length > 0 ? temposOrdenados[0] : 0;
  const mediaTempo =
    temposOrdenados.length > 0
      ? Number((temposOrdenados.reduce((acc, v) => acc + v, 0) / temposOrdenados.length).toFixed(1))
      : 0;

  const medianaObs = obsOrdenadas.length > 0 ? calcularPercentilOrdenado(obsOrdenadas, 50) : 0;
  const minObs = obsOrdenadas.length > 0 ? obsOrdenadas[0] : 0;
  const maxObs = obsOrdenadas.length > 0 ? obsOrdenadas[obsOrdenadas.length - 1] : 0;
  const mediaObs =
    obsOrdenadas.length > 0
      ? Number((obsOrdenadas.reduce((acc, v) => acc + v, 0) / obsOrdenadas.length).toFixed(1))
      : 0;
  const pontosAbaixoDe12Obs = obsOrdenadas.filter((n) => n < 12).length;

  // Projeção para 680 pontos
  const projetadoMedianaMinutos = Number(((medianaTempo * 680) / (1000 * 60)).toFixed(2));
  const projetadoP95Minutos = Number(((p95Tempo * 680) / (1000 * 60)).toFixed(2));
  const diferencaMinutos = Number((projetadoP95Minutos - projetadoMedianaMinutos).toFixed(2));

  const relatorio: MetricasCalibracaoSoloNu = {
    totalPontosAvaliados: pontosParaMedir.length,
    sementePrng: args.semente,
    pontosSorteadosIds: pontosParaMedir.map((p) => p.id),
    tempoTotalMs,
    tempoPorPontoMs: {
      mediana: medianaTempo,
      p95: p95Tempo,
      maximo: maxTempo,
      minimo: minTempo,
      media: mediaTempo,
    },
    pontosMedidos,
    pontosIndisponiveis,
    falhasPorCausa,
    nObservacoesPorPonto: {
      mediana: medianaObs,
      minimo: minObs,
      maximo: maxObs,
      media: mediaObs,
      pontosAbaixoDe12Obs,
    },
    requisicoesGee: {
      totalChamadas: diario.totalChamadas,
      errosPorCodigo,
    },
    definicaoMetrica: DEFINICAO_METRICA_SOLO_NU,
    hashDefinicao: calcularHashDefinicao(),
    projetado680Pontos: {
      tempoMedianaMinutos: projetadoMedianaMinutos,
      tempoP95Minutos: projetadoP95Minutos,
      diferencaMinutos,
    },
  };

  // Salva artefato de evidência
  const dirSaida = path.dirname(args.saida);
  if (!fs.existsSync(dirSaida)) {
    fs.mkdirSync(dirSaida, { recursive: true });
  }
  fs.writeFileSync(args.saida, JSON.stringify(relatorio, null, 2), "utf8");

  console.log("\n===============================================================================");
  console.log("RESULTADOS DA CALIBRAÇÃO DE SOLO NU (30 PONTOS):");
  console.log("===============================================================================");
  console.log(`- Total de Pontos Avaliados: ${pontosParaMedir.length}`);
  console.log(`- Tempo Total da Rodada: ${tempoTotalMs} ms (${(tempoTotalMs / 1000).toFixed(2)} s)`);
  console.log(`- tempoPorPontoMs:`);
  console.log(`    Mediana: ${medianaTempo} ms`);
  console.log(`    p95:     ${p95Tempo} ms`);
  console.log(`    Máximo:  ${maxTempo} ms`);
  console.log(`    Mínimo:  ${minTempo} ms`);
  console.log(`    Média:   ${mediaTempo} ms`);
  console.log(`- Pontos com Ê medido: ${pontosMedidos}`);
  console.log(`- Pontos indisponíveis: ${pontosIndisponiveis}`);
  if (Object.keys(falhasPorCausa).length > 0) {
    console.log(`  Detalhamento por causa: ${JSON.stringify(falhasPorCausa)}`);
  }
  console.log(`- Chamadas HTTP GEE: ${diario.totalChamadas}`);
  console.log(`  Distribuição de códigos HTTP: ${JSON.stringify(errosPorCodigo)}`);
  console.log(`- nObservações por ponto (máscara GEOS3):`);
  console.log(`    Mediana: ${medianaObs}`);
  console.log(`    Mínimo:  ${minObs}`);
  console.log(`    Máximo:  ${maxObs}`);
  console.log(`    Média:   ${mediaObs}`);
  console.log(`    Pontos com n < 12: ${pontosAbaixoDe12Obs} (de ${pontosParaMedir.length})`);
  console.log("-------------------------------------------------------------------------------");
  console.log("PROJEÇÃO PARA O LOTE DE 680 PONTOS:");
  console.log(`- Por Mediana (${medianaTempo} ms/ponto): ${projetadoMedianaMinutos} minutos`);
  console.log(`- Por p95 (${p95Tempo} ms/ponto):     ${projetadoP95Minutos} minutos`);
  console.log(`- Diferença na cauda:                ${diferencaMinutos} minutos`);
  console.log("===============================================================================");
  console.log(`Artefato de evidência gravado em: ${args.saida}`);
}

// Execução se chamado diretamente via CLI
if (process.argv[1] && process.argv[1].includes("medir_frequencia_solo_nu_lote")) {
  principal().catch((err) => {
    console.error("\n[ERRO FATAL NA EXECUÇÃO DO CLI]:", err);
    process.exit(1);
  });
}
