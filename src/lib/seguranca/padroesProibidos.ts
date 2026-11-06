/**
 * ============================================================================
 * Varredor de Padrões Proibidos e Integridade Científica (Regras 1 e 5) — SAREL
 * PPGTCA 2026 — Pesquisa de Mestrado em Erosão Laminar (Paraná)
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { verificarSanidadeHashSha256 } from "../fundiario/manifestoSanidade";

export interface ViolacaoPadrao {
  arquivo: string;
  linha: number;
  padrao: string;
  trecho: string;
}

export interface ExcecaoAutorizada {
  id: string;
  arquivo: string;
  trecho: string;
  justificativa: string;
  autorizadoPor: string;
  padrao?: string;
}

export const LISTA_EXCECOES_AUTORIZADAS: ExcecaoAutorizada[] = [
  // Scripts - Geração sintética controlada para benchmark de pipeline
  {
    id: "EXC-DRYRUN-SINTETICO-XGBOOST",
    arquivo: "scripts/treinar_xgboost_loco.py",
    trecho: "bsi_spd = float(np.random.uniform",
    justificativa: "Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-DRYRUN-SINTETICO-XGBOOST",
    arquivo: "scripts/treinar_xgboost_loco.py",
    trecho: "ndvi_spd = float(np.random.uniform",
    justificativa: "Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-DRYRUN-SINTETICO-XGBOOST",
    arquivo: "scripts/treinar_xgboost_loco.py",
    trecho: "decliv = float(np.random.uniform",
    justificativa: "Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-DRYRUN-SINTETICO-XGBOOST",
    arquivo: "scripts/treinar_xgboost_loco.py",
    trecho: "elev = float(np.random.uniform",
    justificativa: "Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-DRYRUN-SINTETICO-XGBOOST",
    arquivo: "scripts/treinar_xgboost_loco.py",
    trecho: "perda_solo_spd = float(np.random.uniform",
    justificativa: "Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },

  // Componentes de UI - Coalescência com número permitida exclusivamente para controles visuais/câmera
  {
    id: "EXC-UI-MAPVIEWER-ZOOM",
    arquivo: "src/components/map/MapViewer.tsx",
    trecho: "zoom: zoom ?? 14",
    justificativa: "Fallback de nível de zoom padrão da câmera do Mapbox na interface do usuário",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
    padrao: "coalescencia-com-numero",
  },
  {
    id: "EXC-UI-MAPVIEWER-PITCH",
    arquivo: "src/components/map/MapViewer.tsx",
    trecho: "pitch: pitch ?? 50",
    justificativa: "Fallback de inclinação de perspectiva (pitch) da câmera 3D na interface do usuário",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
    padrao: "coalescencia-com-numero",
  },
  {
    id: "EXC-UI-MAPVIEWER-BEARING",
    arquivo: "src/components/map/MapViewer.tsx",
    trecho: "bearing: bearing ?? 0",
    justificativa: "Fallback de rotação azimutal (bearing) da câmera do mapa na interface do usuário",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
    padrao: "coalescencia-com-numero",
  },
  {
    id: "EXC-UI-FILTERSPANEL-DECLIVIDADE",
    arquivo: "src/components/sidebar/FiltersPanel.tsx",
    trecho: "value={filtros.declividadeMin ?? 0}",
    justificativa: "Piso numérico inicial do controle deslizante (slider) de filtro de declividade mínima na UI",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
    padrao: "coalescencia-com-numero",
  },
  {
    id: "EXC-UI-GRAFICO-SERIE-GUARDA",
    arquivo: "src/components/inspetor/GraficoSerieTemporal.tsx",
    trecho: "GOV-5-DESTRUTURACAO-PROVISORIA",
    justificativa: "Fallback visual padrão de 12 meses para gráfico de série temporal",
    autorizadoPor: "GOV-5 / 2026-10-30",
    padrao: "default-numerico-desestruturacao",
  },
  {
    id: "EXC-UI-MAPA-CLAMP",
    arquivo: "src/components/mapa/MapaAmostral.tsx",
    trecho: "clamp de posicao percentual na interface",
    justificativa: "Clamp de coordenadas de posicionamento percentual de elementos na interface do mapa",
    autorizadoPor: "Auditoria 2026-10-30",
    padrao: "corte-math-max-min-com-literal",
  },
  {
    id: "EXC-UI-SPOTLIGHT-CLAMP",
    arquivo: "src/components/presentation/ApresentacaoSpotlight.tsx",
    trecho: "clamp de coordenadas de tela para spotlight",
    justificativa: "Clamp de coordenadas de tela para renderização de overlay do spotlight",
    autorizadoPor: "Auditoria 2026-10-30",
    padrao: "corte-math-max-min-com-literal",
  },
  {
    id: "EXC-UI-MODAL-COTA",
    arquivo: "src/components/region/CandidateSelectionModal.tsx",
    trecho: "subtracao aritmetica de cota amostral inteira nao negativa",
    justificativa: "Cálculo de cota amostral remanescente inteira e validação de input de interface [0, 100]",
    autorizadoPor: "Auditoria 2026-10-30",
    padrao: "corte-math-max-min-com-literal",
  },

  // Código Ativo - Exceções auditadas com comentário explícito
  {
    id: "EXC-API-SELECT-CANDIDATES-LIMITE",
    arquivo: "src/app/api/gee/select-candidates/route.ts",
    trecho: "limite computacional de busca inicial de centroides no indice SQLite",
    justificativa: "Limite computacional de busca inicial de centroides no índice SQLite",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-API-SELECT-CANDIDATES-NORMALIZACAO",
    arquivo: "src/app/api/gee/select-candidates/route.ts",
    trecho: "normalizacao de percentual de alocacao de subamostra da interface [0, 100]",
    justificativa: "Normalização de percentual de alocação de subamostra da interface [0, 100]",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-API-SELECT-CANDIDATES-POOL",
    arquivo: "src/app/api/gee/select-candidates/route.ts",
    trecho: "criterio minimo de tamanho de pool elegivel para selecao de candidatos",
    justificativa: "Critério mínimo de tamanho de pool elegível para seleção de candidatos",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-API-SELECT-CANDIDATES-COTA",
    arquivo: "src/app/api/gee/select-candidates/route.ts",
    trecho: "subtracao aritmetica de cota amostral inteira nao negativa entre subconjuntos",
    justificativa: "Subtração aritmética de cota amostral inteira não negativa entre subconjuntos",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-API-SELECT-CANDIDATES-DESTRUTURACAO",
    arquivo: "src/app/api/gee/select-candidates/route.ts",
    trecho: "GOV-5-DESTRUTURACAO-PROVISORIA",
    justificativa: "Defaults provisórios de destruturação para amostragem no GEE (tamanhoAmostra, raioThinningKm, frequenciaSoloNuMin, declividadeMin, declividadeMax)",
    autorizadoPor: "GOV-5 / 2026-10-30",
    padrao: "default-numerico-desestruturacao",
  },
  {
    id: "EXC-LIB-ESTATISTICAS-SERIE-NMINIMO",
    arquivo: "src/lib/gee/estatisticasSerie.ts",
    trecho: "GOV-5-DESTRUTURACAO-PROVISORIA",
    justificativa: "Piso amostral mínimo nMinimo = 3 para cálculo de estatísticas de banda",
    autorizadoPor: "GOV-5 / 2026-10-30",
    padrao: "default-numerico-desestruturacao",
  },
  {
    id: "EXC-LIB-MONTAGEM-TEMPORAL-JANELA",
    arquivo: "src/lib/matriz/montagemTemporal.ts",
    trecho: "GOV-5-DESTRUTURACAO-PROVISORIA",
    justificativa: "Parâmetros de janela temporal intervaloGuardaMeses e duracaoJanelaAnos",
    autorizadoPor: "GOV-5 / 2026-10-30",
    padrao: "default-numerico-desestruturacao",
  },
  {
    id: "EXC-DEMO-PAINEL",
    arquivo: "src/components/campanha/PainelCampanha.tsx",
    trecho: "EXC-DEMO-PAINEL",
    justificativa: "Demonstração de cálculo matricial na interface com dados ilustrativos declarados",
    autorizadoPor: "Auditoria 2026-10-30",
  },
  {
    id: "EXC-FALLBACK-OFFLINE",
    arquivo: "src/lib/planet/ordersApi.ts",
    trecho: "EXC-FALLBACK-OFFLINE",
    justificativa: "Fallback de pedido simulado para desenvolvimento offline sem chave Planet",
    autorizadoPor: "Auditoria 2026-10-30",
  },
  {
    id: "EXC-LIB-AMOSTRAGEM-CLAMP-SOLO-NU",
    arquivo: "src/lib/gee/amostragemSoloNuLote.ts",
    trecho: "clamp de seguranca numerica para fracao normalizada de satelite no intervalo 0 a 1",
    justificativa: "Clamp de segurança numérica para fração normalizada de satélite no intervalo 0 a 1",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-LIB-AMOSTRAGEM-TIMEOUT-REDE",
    arquivo: "src/lib/gee/amostragemSoloNuLote.ts",
    trecho: "timeout de rede de requisicao http em milissegundos para conexao gee",
    justificativa: "Timeout de rede de requisição HTTP em milissegundos para conexão GEE",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-LIB-AMOSTRAGEM-REQUISICOES-EVITADAS",
    arquivo: "src/lib/gee/amostragemSoloNuLote.ts",
    trecho: "metrica contavel de requisicoes http poupadas no processamento em lote",
    justificativa: "Métrica contável de requisições HTTP poupadas no processamento em lote",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-LIB-AUTH-SEGUNDOS-VALIDADE",
    arquivo: "src/lib/gee/auth.ts",
    trecho: "fallback de protocolo oauth2 rfc6749 para token expiravel",
    justificativa: "Fallback de protocolo OAuth2 RFC6749 para token expirável",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-LIB-PLANET-QUOTA-TIMESTAMP",
    arquivo: "src/lib/planet/quota.ts",
    trecho: "auditoria de timestamp do livro-razao local",
    justificativa: "Auditoria de timestamp do livro-razao local",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-LIB-RUSLE-FATOR-LS-DIVISOR",
    arquivo: "src/lib/rusle/fatorLS.ts",
    trecho: "divisor de aguas no topo da vertente sem area de montante afluente (A_in = 0)",
    justificativa: "Divisor de águas no topo da vertente sem área de montante afluente (A_in = 0)",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-STORE-PAGINACAO-TOUR",
    arquivo: "src/store/useSarelStore.ts",
    trecho: "controle de indice de paginacao de interface do tour metodologico (>= 0)",
    justificativa: "Controle de índice de paginação de interface do tour metodológico (>= 0)",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-TESTE-UNMASK-JRC",
    arquivo: "teste.ts",
    trecho: "const water = jrc.unmask(0);",
    justificativa: "Camada de exclusão booleana JRC sem dado no teste unitário",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-DRONE-PLAN-TURNAROUND",
    arquivo: "src/lib/drone/planoVooNControl.ts",
    trecho: "turnAroundDistanceMeters = 10",
    justificativa: "Fallback de distância de manobra (turnaround) no formato .plan do NControl",
    autorizadoPor: "GOV-5 / 2026-10-19",
    padrao: "default-numerico-desestruturacao",
  },
  {
    id: "EXC-DRONE-PLAN-ENTRYLOCATION",
    arquivo: "src/lib/drone/planoVooNControl.ts",
    trecho: "entryLocation = 0",
    justificativa: "Vértice de entrada padrão (entryLocation) de survey no formato .plan",
    autorizadoPor: "GOV-5 / 2026-10-19",
    padrao: "default-numerico-desestruturacao",
  },
  // Exceções de Coalescência com Coleção Vazia (Portões e Paridade 2026-10-31)
  {
    id: "EXC-UI-INSPETOR-GRAFICO",
    arquivo: "src/components/inspetor/InspetorPonto.tsx",
    trecho: "janelaAtiva.observacoes ?? []",
    justificativa: "Fallback visual de coleção vazia para renderização de gráfico temporal na interface quando observações ainda não foram carregadas",
    autorizadoPor: "Auditoria 2026-10-31 / Portões e Paridade",
    padrao: "coalescencia-com-colecao-vazia",
  },
  {
    id: "EXC-EMBRAPA-WFS-PROPS-BBOX",
    arquivo: "src/lib/embrapa/embrapaSoilClient.ts",
    trecho: "const props = (f?.properties ?? {})",
    justificativa: "Extração defensiva de propriedades em feição GeoJSON retornada pelo serviço WFS GetFeatureInfo em BBOX da Embrapa",
    autorizadoPor: "Auditoria 2026-10-31 / Portões e Paridade",
    padrao: "coalescencia-com-colecao-vazia",
  },
  {
    id: "EXC-EMBRAPA-WFS-PROPS-PONTO",
    arquivo: "src/lib/embrapa/embrapaSoilClient.ts",
    trecho: "const props = (f?.properties ?? {})",
    justificativa: "Extração defensiva de propriedades em feição GeoJSON retornada pelo serviço WFS GetFeatureInfo pontual da Embrapa",
    autorizadoPor: "Auditoria 2026-10-31 / Portões e Paridade",
    padrao: "coalescencia-com-colecao-vazia",
  },
  {
    id: "EXC-ROTULOS-HELDOUT-SET",
    arquivo: "src/lib/rotulos/ingestaoDrone.ts",
    trecho: "new Set(param3 ?? [])",
    justificativa: "Normalização do conjunto de polígonos held-out para verificação de segregação quando conjunto não é informado",
    autorizadoPor: "Auditoria 2026-10-31 / Portões e Paridade",
    padrao: "coalescencia-com-colecao-vazia",
  },
  {
    id: "EXC-SCRIPT-CACHE-PEDOLOGIA",
    arquivo: "scripts/remedir_candidatos_bp3_d16.ts",
    trecho: "parsedCache.itens ?? {}",
    justificativa: "Fallback para cache vazio quando arquivo local cache_pedologia_bp3.json não possui chave itens, forçando re-medição",
    autorizadoPor: "Auditoria 2026-10-31 / Portões e Paridade",
    padrao: "coalescencia-com-colecao-vazia",
  },
  {
    id: "EXC-DRONE-PLAN-STARTDOJUMPID",
    arquivo: "src/lib/drone/planoVooNControl.ts",
    trecho: "startDoJumpId = 2",
    justificativa: "Identificador de comando DO_JUMP no formato .plan do NControl",
    autorizadoPor: "GOV-5 / 2026-10-19",
    padrao: "default-numerico-desestruturacao",
  },
];

export interface RegraPadraoProibido {
  id: string;
  regex: RegExp;
}

export const REGEX_PADROES: RegraPadraoProibido[] = [
  // Padrões de fechamento de furos periciais (Auditoria 2026-10-31)
  { id: "coalescencia-com-colecao-vazia", regex: /\?\?\s*(\[\s*\]|\{\s*\})/ },
  {
    id: "literal-em-proveniencia-medida",
    regex: /estado:\s*["']medido["'][^}]{0,80}valor:\s*-?\d+\.\d+/,
  },
  {
    id: "constante-cientifica-py",
    regex: /^\s*(ndvi|bsi|declividade|elevacao|perda|fator[a-z]*|erodibilidade)\w*\s*=\s*-?\d+\.\d+\s*(#.*)?$/i,
  },
  { id: "unmask-numerico", regex: /\.unmask\s*\(\s*\d+(\.\d+)?\s*\)/ },
  { id: "ou-logico-com-numero", regex: /\|\|\s*\d+(\.\d+)?\b/ },
  { id: "coalescencia-com-numero", regex: /\?\?\s*\d+(\.\d+)?\b/ },
  { id: "coalescencia-com-numero-entre-aspas", regex: /\?\?\s*["'`]\s*[0-9]/ },
  { id: "ou-logico-com-numero-entre-aspas", regex: /\|\|\s*["'`]\s*[0-9]/ },
  { id: "parametro-com-default-numerico", regex: /:\s*number\s*=\s*\d+(\.\d+)?\b/ },
  { id: "corte-math-max-min-com-literal", regex: /Math\.(max|min)\s*\([^)]*\b\d+(\.\d+)?\b[^)]*\)/ },
  { id: "adquiridoEm-com-new-date", regex: /adquiridoEm\s*:\s*(new\s+Date|Date\.now)/ },
  { id: "adquiridoEm-com-literal-data", regex: /adquiridoEm\s*:\s*["'`]\d{4}-\d{2}-\d{2}/ },
  {
    id: "sintese-aleatoria-atributos-fisicos",
    regex: /(=\s*|:\s*)(float\()?(np\.)?random\.[a-zA-Z0-9_]+/,
  },
  { id: "credencial-begin-private-key", regex: /-----BEGIN\s+((RSA|EC|DSA|OPENSSH)\s+)?PRIVATE\s+KEY-----/i },
  { id: "credencial-literal-private-key", regex: /"private_key"\s*:\s*["'][A-Za-z0-9+/=\s-]{20,}/ },
  { id: "credencial-planet-plak", regex: /\bPLAK[0-9a-zA-Z]{10,}\b/ },
  { id: "credencial-google-aizasy", regex: /\bAIzaSy[0-9a-zA-Z_-]{20,}\b/ },
  { id: "credencial-mapbox-pkey", regex: /\bpk\.eyJ[0-9a-zA-Z_-]{15,}\b/ },
  { id: "credencial-jev-ts", regex: /\bts_[0-9a-fA-F]{20,}\b/ },
  { id: "credencial-bearer-jwt", regex: /Bearer\s+eyJ[0-9a-zA-Z_-]{20,}\b/ },
  {
    id: "default-numerico-desestruturacao",
    regex: /^\s+[a-zA-Z][a-zA-Z0-9]*\s*=\s*[0-9]+(\.[0-9]+)?,?\s*$/,
  },
  // Novos 3 padrões da auditoria metodológica (Item 3b)
  {
    id: "grade-cientifica-fabricada",
    regex: /\[\s*\[\s*-?\d+(?:\.\d+)?\s*(?:,\s*-?\d+(?:\.\d+)?){2,}\s*\]\s*,\s*\[\s*-?\d+(?:\.\d+)?\s*(?:,\s*-?\d+(?:\.\d+)?){2,}\s*\]/,
  },
  {
    id: "preditor-cientifico-de-limiar-ou-zero",
    regex: /\b(ndvi|bsi|declividade|elevacao|fatorK|fatorR|fatorLS|frequenciaSoloNu|perdaSolo)\b\s*[:=](?!=)\s*(?:0(?:\.0+)?(?![0-9.])|limiar\w*)\b/i,
  },
  {
    id: "identificador-admite-simulacao",
    regex: /(?:const|let|var|function)\s+\b(simular|mock|fake|gerarFalso|dadosDemonstracao|pixelsDemonstracao)\w*\b|\b(simular|mock|fake|gerarFalso|dadosDemonstracao|pixelsDemonstracao)\w*\s*[:=](?!=)/i,
  },
];

export function compilarPadroes(): RegraPadraoProibido[] {
  return REGEX_PADROES;
}

export function isLinhaIsentaPorListaFechada(
  arquivo: string,
  linha: string,
  motivoComentario: string | null,
  padraoId: string
): boolean {
  const arqNorm = arquivo.replace(/\\/g, "/");

  for (const exc of LISTA_EXCECOES_AUTORIZADAS) {
    const excArqNorm = exc.arquivo.replace(/\\/g, "/");
    const arquivoBate = arqNorm.endsWith(excArqNorm) || excArqNorm.endsWith(arqNorm);
    if (!arquivoBate) continue;

    if (motivoComentario !== null) {
      const bateComentario =
        motivoComentario.includes(exc.id) || (exc.trecho && motivoComentario.includes(exc.trecho));
      if (bateComentario) {
        return true;
      }
    } else {
      const trechoBate = linha.includes(exc.trecho) || exc.trecho.includes(linha.trim());
      if (trechoBate) {
        if (exc.padrao && exc.padrao !== padraoId) continue;
        if (arqNorm.includes("src/components/") || exc.padrao) {
          return true;
        }
      }
    }
  }

  return false;
}

export function varrerLinha(
  linha: string,
  numeroLinha: number,
  arquivo: string,
  motivoExterno?: string | null
): ViolacaoPadrao[] {
  const marcadorTs = "// permitido:";
  const marcadorPy = "# permitido:";
  const idxTs = linha.indexOf(marcadorTs);
  const idxPy = linha.indexOf(marcadorPy);
  const idxMarcador = idxTs !== -1 ? idxTs : idxPy;
  const tamMarcador = idxTs !== -1 ? marcadorTs.length : marcadorPy.length;

  let motivo: string | null = null;
  if (idxMarcador !== -1 && idxMarcador + tamMarcador < linha.length) {
    motivo = linha.slice(idxMarcador + tamMarcador).trim();
  } else if (motivoExterno) {
    motivo = motivoExterno;
  }

  // Se a linha for comentário puro (começa com //, *, /* ou #), filtra identificador-admite-simulacao
  const ehComentarioPuro = /^\s*(\/\/|\*|\/\*|#)/.test(linha);
  const linhaSemComentario = linha.replace(/\/\/.*$/, "").replace(/#.*$/, "");
  const linhaSemStrings = linhaSemComentario.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''");

  const violacoes: ViolacaoPadrao[] = [];
  for (const { id, regex } of REGEX_PADROES) {
    if (id === "default-numerico-desestruturacao" && arquivo.endsWith(".py")) {
      continue;
    }
    if (id === "identificador-admite-simulacao") {
      if (ehComentarioPuro) continue;
      if (!regex.test(linhaSemStrings)) continue;
    } else if (id === "preditor-cientifico-de-limiar-ou-zero") {
      if (ehComentarioPuro) continue;
      if (!regex.test(linhaSemStrings)) continue;
    } else {
      if (!regex.test(linha)) continue;
    }

    if (!isLinhaIsentaPorListaFechada(arquivo, linha, motivo, id)) {
      violacoes.push({
        arquivo,
        linha: numeroLinha,
        padrao: id,
        trecho: linha.trim(),
      });
    }
  }
  return violacoes;
}

export function varrerCodigo(codigo: string, nomeArquivo: string): ViolacaoPadrao[] {
  const linhas = codigo.split("\n");
  const violacoes: ViolacaoPadrao[] = [];
  linhas.forEach((linha, idx) => {
    const linhaAnterior = idx > 0 ? linhas[idx - 1] : "";
    const idxAntTs = linhaAnterior.indexOf("// permitido:");
    const idxAntPy = linhaAnterior.indexOf("# permitido:");
    const idxAnt = idxAntTs !== -1 ? idxAntTs : idxAntPy;
    const tamAnt = idxAntTs !== -1 ? 14 : 13;
    let motivoAnt: string | null = null;
    if (idxAnt !== -1 && idxAnt + tamAnt < linhaAnterior.length) {
      motivoAnt = linhaAnterior.slice(idxAnt + tamAnt).trim();
    }

    violacoes.push(...varrerLinha(linha, idx + 1, nomeArquivo, motivoAnt));
  });
  return violacoes;
}

export function listarArquivosCodigo(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const arquivos: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".next") {
      arquivos.push(...listarArquivosCodigo(fullPath));
    } else if (
      entry.isFile() &&
      (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) &&
      !fullPath.endsWith(".test.ts") &&
      !fullPath.endsWith(".test.tsx") &&
      relPath !== "src/lib/export/scriptAvaliacaoD25.generated.ts" && relPath !== "src/lib/seguranca/padroesProibidos.ts"
    ) {
      arquivos.push(fullPath);
    }
  }
  return arquivos;
}

export function listarArquivosScripts(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const arquivos: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relDir = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
    if (
      entry.isDirectory() &&
      entry.name !== "__pycache__" &&
      entry.name !== ".git" &&
      relDir !== "scripts/d25"
    ) {
      arquivos.push(...listarArquivosScripts(fullPath));
    } else if (
      entry.isFile() &&
      (fullPath.endsWith(".py") || fullPath.endsWith(".mjs") || fullPath.endsWith(".ts"))
    ) {
      arquivos.push(fullPath);
    }
  }
  return arquivos;
}

export function varrerPadroesProibidos(diretorios: string[]): ViolacaoPadrao[] {
  const violacoes: ViolacaoPadrao[] = [];
  for (const dir of diretorios) {
    const absDir = path.resolve(process.cwd(), dir);
    const arquivos = listarArquivosCodigo(absDir);
    for (const arq of arquivos) {
      const conteudo = fs.readFileSync(arq, "utf-8");
      const v = varrerCodigo(conteudo, path.relative(process.cwd(), arq));
      violacoes.push(...v);
    }
  }
  return violacoes;
}

export interface ViolacaoJson {
  arquivo: string;
  propriedade: string;
  padrao: string;
  valor: unknown;
  motivo: string;
}

export function listarArquivosJson(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const arquivos: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (
      entry.isDirectory() &&
      entry.name !== "node_modules" &&
      entry.name !== ".next" &&
      entry.name !== ".git"
    ) {
      arquivos.push(...listarArquivosJson(fullPath));
    } else if (entry.isFile() && fullPath.endsWith(".json")) {
      arquivos.push(fullPath);
    }
  }
  return arquivos;
}

export function varrerIntegridadeJson(caminhoArquivo: string): ViolacaoJson[] {
  if (!fs.existsSync(caminhoArquivo)) return [];
  const relPath = path.relative(process.cwd(), caminhoArquivo).replace(/\\/g, "/");
  let json: unknown;
  let ehArquivoDemonstracaoSintetica = false;
  try {
    const raw = fs.readFileSync(caminhoArquivo, "utf-8");
    json = JSON.parse(raw);
    ehArquivoDemonstracaoSintetica =
      (typeof json === "object" && json !== null && (json as Record<string, unknown>).ehPlanoSinteticoDemonstracao === true) ||
      raw.includes('"ehPlanoSinteticoDemonstracao": true');
  } catch (e) {
    return [
      {
        arquivo: relPath,
        propriedade: "(raiz)",
        padrao: "json-invalido",
        valor: null,
        motivo: `Falha ao interpretar JSON: ${(e as Error).message}`,
      },
    ];
  }

  const violacoes: ViolacaoJson[] = [];

  function visitar(no: unknown, rota: string, pai?: Record<string, unknown>, ehDemo?: boolean) {
    if (!no || typeof no !== "object") return;

    if (Array.isArray(no)) {
      no.forEach((item, idx) => {
        visitar(item, `${rota}[${idx}]`, undefined, ehDemo);
      });
      return;
    }

    const obj = no as Record<string, unknown>;
    const demoLocal = ehDemo || obj.ehPlanoSinteticoDemonstracao === true;

    for (const [k, v] of Object.entries(obj)) {
      const propRota = rota ? `${rota}.${k}` : k;

      // 1. Hash implausível em campos com sha256 ou hash
      const kLower = k.toLowerCase();
      const ehCampoHash =
        (kLower.includes("sha256") || kLower.includes("hash")) &&
        !kLower.includes("estado") &&
        !kLower.includes("motivo") &&
        !kLower.includes("algoritmo");

      if (ehCampoHash) {
        if (typeof v === "string") {
          const res = verificarSanidadeHashSha256(v);
          if (!res.valido) {
            violacoes.push({
              arquivo: relPath,
              propriedade: propRota,
              padrao: "hash-implausivel",
              valor: v,
              motivo: res.motivo ?? "Hash criptográfico implausível",
            });
          }
        } else if (v === null || v === undefined) {
          const estado =
            typeof obj.sha256Estado === "string"
              ? obj.sha256Estado
              : typeof obj.hashEstado === "string"
              ? obj.hashEstado
              : undefined;
          const res = verificarSanidadeHashSha256(v as string | null | undefined, estado);
          if (!res.valido) {
            violacoes.push({
              arquivo: relPath,
              propriedade: propRota,
              padrao: "hash-implausivel",
              valor: v,
              motivo: res.motivo ?? "Hash nulo sem estado indisponível",
            });
          }
        }
      }

      // 2. Timestamp suspeito em geradoEm (ex: T00:00:00.000Z ou hora cheia com .000Z)
      if (k === "geradoEm" && typeof v === "string") {
        if (!demoLocal) {
          const ehHoraCheiaComMilissegundosZerados = /T\d{2}:00:00\.000Z?$/i.test(v);
          const ehMeiaNoiteZerada = /T00:00:00(?:\.000)?Z?$/i.test(v);
          if (ehHoraCheiaComMilissegundosZerados || ehMeiaNoiteZerada) {
            violacoes.push({
              arquivo: relPath,
              propriedade: propRota,
              padrao: "timestamp-suspeito",
              valor: v,
              motivo: `Timestamp '${v}' com hora cheia e milissegundos zerados sugere escrita manual em vez de geração automatizada.`,
            });
          }
        }
      }

      // Recursão
      if (typeof v === "object" && v !== null) {
        visitar(v, propRota, obj, demoLocal);
      }
    }
  }

  visitar(json, "", undefined, ehArquivoDemonstracaoSintetica);
  return violacoes;
}

export function varrerIntegridadeJsonDiretorios(diretorios: string[]): ViolacaoJson[] {
  const todas: ViolacaoJson[] = [];
  for (const dir of diretorios) {
    const absDir = path.resolve(process.cwd(), dir);
    const arquivos = listarArquivosJson(absDir);
    for (const arq of arquivos) {
      todas.push(...varrerIntegridadeJson(arq));
    }
  }
  return todas;
}
