import type { PontoAmostral } from "@/types/ponto";
import type { Proveniencia } from "@/types/proveniencia";
import { ehMedido } from "@/types/proveniencia";
import type { PerfilExportacao } from "./perfis";
import { obterColunasPermitidas } from "./perfis";

export interface ViolacaoInvariante {
  invariante: number;
  nome: string;
  mensagem: string;
  detalhes?: unknown;
}

export interface ResultadoValidacaoInvariantes {
  valido: boolean;
  violacoes: ViolacaoInvariante[];
}

export const LISTA_NEGRA_LITERAIS_GEOGRAFICOS = [
  "custom",
  "bacia local",
  "bacia hidrográfica local",
  "bacia hidrografica local",
  "área amostral gee",
  "area amostral gee",
  "paraná",
  "parana",
];

export const NOMES_UFS_BRASIL = [
  "acre",
  "alagoas",
  "amapá",
  "amapa",
  "amazonas",
  "bahia",
  "ceará",
  "ceara",
  "distrito federal",
  "espírito santo",
  "espirito santo",
  "goiás",
  "goias",
  "maranhão",
  "maranhao",
  "mato grosso",
  "mato grosso do sul",
  "minas gerais",
  "pará",
  "para",
  "paraíba",
  "paraiba",
  "paraná",
  "parana",
  "pernambuco",
  "piauí",
  "piaui",
  "rio de janeiro",
  "rio grande do norte",
  "rio grande do sul",
  "rondônia",
  "rondonia",
  "roraima",
  "santa catarina",
  "são paulo",
  "sao paulo",
  "sergipe",
  "tocantins",
] as const;

export const SIGLAS_UFS_BRASIL = [
  "ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma",
  "mt", "ms", "mg", "pa", "pb", "pr", "pe", "pi", "rj", "rn",
  "rs", "ro", "rr", "sc", "sp", "se", "to",
] as const;

/**
 * Casa `termo` em `texto` apenas como palavra/expressão ISOLADA: os vizinhos do trecho não podem ser letra nem dígito
 * (o sublinhado, a barra e o hífen contam como separadores). Evita que "rede" case dentro de "credenciada" ou "dem" dentro
 * de "ordem", o que bloquearia exportações legítimas. `texto` e `termo` devem vir em minúsculas.
 */
export function contemTermoIsolado(texto: string, termo: string): boolean {
  const escapado = termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapado}(?![\\p{L}\\p{N}])`, "u").test(texto);
}

export const MOTIVOS_FALHA_OU_NAO_CONSULTADO_FUNDIARIO = [
  "erro",
  "falha",
  "servico indisponivel",
  "serviço indisponível",
  "servico-indisponivel",
  "rede",
  "timeout",
  "indisponivel",
  "indisponível",
  "nao consultado",
  "não consultado",
  "nao-consultado",
  "desconhecido",
] as const;

export const CAMPOS_PROIBIDOS_MATRIZ_TREINO = [
  "phiDiag",
  "quantilPhi",
  "phi",
  "tercilS",
  "tercilE",
  "nivelK",
  "scorePrioridade",
  "severidade",
  "tipologia",
  "latitude",
  "longitude",
  "codigoCar",
  "titularMascarado",
  "documentoMascarado",
  "perdaSolo",
  "perdaSoloRUSLE",
  "RUSLE_Perda_Solo",
  "RUSLE_A",
  "RUSLE_Fator_C",
  "RUSLE_Fator_P",
  "fatorC",
  "fatorP",
  "scoreSuscetibilidade",
  "scoreJev",
  "laudoJev",
  "consistenciaFisica",
  "kAmbiguoAssociacao",
  "kAmbiguoAssociacaoProveniencia",
  "ramoAmbiguidadeD08",
  "unidadeDeterminanteK2024",
  "nivelK2024",
  "Marcador_K_Ambiguo_D08",
  "Marcador_K_Ambiguo_D08_Origem",
  "Unidade_Determinante_K_2024_CodUm",
  "Unidade_Determinante_K_2024_OgcFid",
  "Unidade_Determinante_K_2024_ErodUm",
  "correspondenciaCartas2024",
  "divergenciaEntreCartas2024",
  "provenienciaK",
  "chaveProvenienciaK",
  "foraDoDominioSolo",
  "pontoEmFronteiraPedologica",
  "fronteiraCompartilhadaExata",
  "causaZeroFeicoes",
  "totalFeicoesSoloRetornadas",
  "indiceFeicaoSoloEscolhida",
  "feicaoSoloEscolhidaId",
  "viaFatorKD14",
  "planetApiKey",
  "planetSceneId",
  "planetMosaicId",
  "planetTileUrl",
  "planetRefletancia",
  "planetData",
] as const;

/**
 * Chaves permitidas na matriz de treino D16/D26 (DEC-17).
 * Nunca atuam como preditores (X) no modelo probatório.
 */
export const CHAVES_PERMITIDAS_MATRIZ_TREINO = [
  "Poligono_ID",
  "Papel_Conjunto",
  "Estrato_ID",
  "Celula_ID",
  "Pixel_ID",
] as const;

/**
 * Colunas expressamente tabeladas da RUSLE que possuem valor de literatura legítimo
 * uniforme quando as práticas conservacionistas são desconhecidas (Renard et al., 1997).
 * Excluídas da verificação de constante disfarçada do Invariante 7.
 */
export const COLUNAS_EXCECAO_CONSTANTE_TABELADA = [
  "RUSLE_Fator_P",
  "rusle_fator_p",
  "Fator_P",
  "RUSLE_Fator_P_Origem",
] as const;

/**
 * Invariante 3: Deriva com precisão a lista de campos científicos cujo estado NÃO é "medido".
 */
export function derivarCamposNaoMedidos(ponto: PontoAmostral): string[] {
  const campos: string[] = [];

  function testar(nome: string, p?: Proveniencia<unknown> | null) {
    if (!p || !ehMedido(p)) {
      campos.push(nome);
    }
  }

  // Localização
  if (!ponto.localizacao) {
    campos.push("localizacao");
  } else {
    testar("municipio", ponto.localizacao.municipio);
    testar("codigoIbge", ponto.localizacao.codigoIbge);
    testar("bacia", ponto.localizacao.bacia);
  }

  // Terreno
  if (!ponto.terreno) {
    campos.push("terreno");
  } else {
    testar("elevacao", ponto.terreno.elevacao);
    testar("declividadePct", ponto.terreno.declividadePct);
    testar("declividadeGraus", ponto.terreno.declividadeGraus);
    testar("curvaturaPerfil", ponto.terreno.curvaturaPerfil);
    testar("curvaturaPlana", ponto.terreno.curvaturaPlana);
    testar("acumuloFluxo", ponto.terreno.acumuloFluxo);
    testar("twi", ponto.terreno.twi);
  }

  // Solo
  if (!ponto.solo) {
    campos.push("solo");
  } else {
    testar("ordemSolo", ponto.solo.ordem);
    testar("subOrdemSolo", ponto.solo.subOrdem);
    testar("grandeGrupoSolo", ponto.solo.grandeGrupo);
    testar("tipoUnidadeSolo", ponto.solo.tipoUnidade);
    testar("erodibilidadeClasse", ponto.solo.erodibilidadeClasse);
  }

  // Temporal (D ou P)
  if (!ponto.temporal || Object.keys(ponto.temporal).length === 0) {
    campos.push("temporal");
  } else {
    for (const janela of Object.values(ponto.temporal)) {
      if (janela) {
        testar("frequenciaSoloNu", janela.serie?.frequenciaSoloNu);
        testar("maiorSequenciaSoloNu", janela.serie?.maiorSequenciaSoloNu);
        testar("mesModalExposicao", janela.serie?.mesModalExposicao);
        testar("precipAcum30d", janela.chuva?.precipAcum30d);
        testar("precipAcum90d", janela.chuva?.precipAcum90d);
        testar("i30Max", janela.chuva?.i30Max);
        testar("nEventosErosivos", janela.chuva?.nEventosErosivos);
        testar("indiceMecanismo", janela.chuva?.indiceMecanismo);
      }
    }
  }

  // RUSLE (linhaDeBase)
  if (ponto.linhaDeBase) {
    testar("rusle_fatorR", ponto.linhaDeBase.fatorR);
    testar("rusle_fatorK", ponto.linhaDeBase.fatorK);
    testar("rusle_fatorLS", ponto.linhaDeBase.fatorLS);
    testar("rusle_fatorC", ponto.linhaDeBase.fatorC);
    testar("rusle_fatorP", ponto.linhaDeBase.fatorP);
    testar("rusle_perdaSolo", ponto.linhaDeBase.perdaSolo);
  }

  return campos;
}

export interface ArtefatoProjetado {
  cabecalho: string[];
  linhas: Record<string, unknown>[];
  perfil: PerfilExportacao;
}

/**
 * Validador completo dos Invariantes de Exportação.
 * Executado sobre o artefato já projetado no perfil.
 */
export function validarInvariantesArtefato(artefato: ArtefatoProjetado): ResultadoValidacaoInvariantes {
  const violacoes: ViolacaoInvariante[] = [];
  const { cabecalho, linhas, perfil } = artefato;
  const n = linhas.length;

  // ==========================================================================
  // INVARIANTE 2: O cabeçalho do artefato está contido na lista de permissão
  // ==========================================================================
  const permitidas = new Set(obterColunasPermitidas(perfil));
  for (const col of cabecalho) {
    if (!permitidas.has(col)) {
      violacoes.push({
        invariante: 2,
        nome: "Lista de Permissão do Perfil",
        mensagem: `A coluna '${col}' não consta na lista de permissão do perfil '${perfil}'.`,
        detalhes: { coluna: col, perfil },
      });
    }
  }

  // Se houver tentativa de exportar colunas internas proibidas
  const colunasInternasProibidas = ["phiDiag", "phi_diag", "severity", "severidade", "score", "priorityScore"];
  for (const col of cabecalho) {
    if (colunasInternasProibidas.includes(col.toLowerCase())) {
      violacoes.push({
        invariante: 2,
        nome: "Vazamento de Variável Interna",
        mensagem: `A coluna interna '${col}' é terminantemente proibida em saídas exportadas.`,
        detalhes: { coluna: col },
      });
    }
  }

  // ==========================================================================
  // INVARIANTE 7: DETECTOR DE CONSTANTE DISFARÇADA
  // Nenhuma coluna numérica tem valor idêntico em 100% das linhas não vazias
  // quando há >= 21 valores não vazios.
  // Percorre TODAS as colunas numéricas do artefato projetado.
  // Valores vazios NÃO desativam o detector.
  // Exceção: colunas tabeladas legítimas da RUSLE (ex.: RUSLE_Fator_P = 1.0)
  // ==========================================================================
  for (const col of cabecalho) {
    if ((COLUNAS_EXCECAO_CONSTANTE_TABELADA as readonly string[]).includes(col)) {
      continue;
    }
    const valoresNaoVazios: number[] = [];
    for (const linha of linhas) {
      const v = linha[col];
      if (v !== undefined && v !== null && v !== "" && typeof v === "number" && !isNaN(v)) {
        valoresNaoVazios.push(v);
      }
    }

    if (valoresNaoVazios.length >= 21) {
      const primeiro = valoresNaoVazios[0];
      const todosIdenticos = valoresNaoVazios.every((v) => Math.abs(v - primeiro) < 1e-9);
      if (todosIdenticos) {
        violacoes.push({
          invariante: 7,
          nome: "Detector de Constante Disfarçada",
          mensagem: `A coluna numérica '${col}' possui valor idêntico (${primeiro}) em todos os ${valoresNaoVazios.length} valores não vazios (total de linhas: ${n}). Valores físicos reais de sensoriamento e terreno possuem variância natural. Exportação bloqueada.`,
          detalhes: { coluna: col, valor: primeiro, nValidos: valoresNaoVazios.length, nTotal: n },
        });
      }
    }
  }

  // ==========================================================================
  // INVARIANTE 3: Coerência de Campos_Estimados
  // Valida que Campos_Estimados reflete as colunas *_Origem do artefato que não são "medido".
  // ==========================================================================
  if (cabecalho.includes("Campos_Estimados")) {
    const colunasOrigem = cabecalho.filter((c) => c.endsWith("_Origem"));
    for (let i = 0; i < n; i++) {
      const linha = linhas[i];
      const camposEstimadosStr = String(linha["Campos_Estimados"] ?? "").trim();
      const colunasNaoMedidas: string[] = [];

      for (const col of colunasOrigem) {
        const valOrigem = String(linha[col] ?? "").trim();
        const isMedido = valOrigem.toLowerCase().startsWith("medido");
        if (!isMedido) {
          const nomeCampo = col.slice(0, -"_Origem".length);
          colunasNaoMedidas.push(nomeCampo);
        }
      }

      if (colunasNaoMedidas.length > 0) {
        const diz100Medido =
          camposEstimadosStr === "" ||
          camposEstimadosStr.toLowerCase().includes("100% medido") ||
          camposEstimadosStr.toLowerCase() === "nenhum";

        if (diz100Medido) {
          violacoes.push({
            invariante: 3,
            nome: "Campos Estimados Inconsistente",
            mensagem: `Linha ${i + 1}: existem colunas com origem não medida (${colunasNaoMedidas.join(", ")}), mas 'Campos_Estimados' declara '${camposEstimadosStr || "(vazio)"}'.`,
            detalhes: { linha: i + 1, colunasNaoMedidas, camposEstimados: camposEstimadosStr },
          });
        }
      } else if (colunasOrigem.length > 0) {
        if (
          camposEstimadosStr !== "" &&
          !camposEstimadosStr.toLowerCase().includes("100% medido") &&
          camposEstimadosStr.toLowerCase() !== "nenhum"
        ) {
          violacoes.push({
            invariante: 3,
            nome: "Campos Estimados Inconsistente",
            mensagem: `Linha ${i + 1}: todas as colunas de origem presentes são medidas, mas 'Campos_Estimados' aponta campos estimados ('${camposEstimadosStr}').`,
            detalhes: { linha: i + 1, camposEstimados: camposEstimadosStr },
          });
        }
      }
    }
  }

  // ==========================================================================
  // INVARIANTE 4: Rastreabilidade de Satélite
  // Linhas com produto derivado de satélite devem conter Rastreio_Cenas,
  // Rastreio_Calculado_Em e Rastreio_Versao_Motor preenchidos.
  // ==========================================================================
  if (cabecalho.includes("Rastreio_Cenas") || cabecalho.includes("Rastreio_Versao_Motor")) {
    const colunasSateliteConhecidas = [
      "Elevacao_m_Origem",
      "Declividade_pct_Origem",
      "Declividade_graus_Origem",
      "Curvatura_Perfil_Origem",
      "Curvatura_Plana_Origem",
      "Acumulo_Fluxo_Origem",
      "TWI_Origem",
      "Frequencia_Solo_Nu_Origem",
      "Precip_Acum_30d_mm_Origem",
      "Precip_Acum_90d_mm_Origem",
      "I30_Max_mm_h_Origem",
      "N_Eventos_Erosivos_Origem",
      "Indice_Mecanismo_Origem",
      "Referencia_Cena_Tile",
    ];
    const termosSatelite = [
      "copernicus", "dem", "glo30", "glo-30", "sentinel", "s2", "chirps", "imerg",
      "planet", "landsat", "satélite", "satellite"
    ];

    for (let i = 0; i < n; i++) {
      const linha = linhas[i];
      let temDadoSatelite = false;
      let colunaDetectada = "";

      for (const col of cabecalho) {
        if (col.endsWith("_Origem") || col === "Referencia_Cena_Tile") {
          const val = String(linha[col] ?? "").trim();
          const valLower = val.toLowerCase();
          if (valLower.length > 0 && !valLower.startsWith("indisponível") && !valLower.startsWith("indisponivel")) {
            const mencionaTermoSatelite = termosSatelite.some((t) => contemTermoIsolado(valLower, t));
            const ehColunaSatelite = colunasSateliteConhecidas.includes(col);
            if (mencionaTermoSatelite || ehColunaSatelite) {
              temDadoSatelite = true;
              colunaDetectada = col;
              break;
            }
          }
        }
      }

      if (temDadoSatelite) {
        const cenas = String(linha["Rastreio_Cenas"] ?? "").trim();
        const versaoMotor = String(linha["Rastreio_Versao_Motor"] ?? "").trim();
        const calculadoEm = String(linha["Rastreio_Calculado_Em"] ?? "").trim();

        const cenasVazia = !cenas || cenas.toLowerCase() === "não informado" || cenas.toLowerCase() === "nao informado";
        const versaoVazia = !versaoMotor || versaoMotor.toLowerCase() === "não informado" || versaoMotor.toLowerCase() === "nao informado";
        const checarCalculadoEm = cabecalho.includes("Rastreio_Calculado_Em");
        const calcVazio = checarCalculadoEm && (!calculadoEm || calculadoEm.toLowerCase() === "não informado" || calculadoEm.toLowerCase() === "nao informado");

        if (cenasVazia || versaoVazia || calcVazio) {
          violacoes.push({
            invariante: 4,
            nome: "Rastreabilidade de Satélite Ausente",
            mensagem: `Linha ${i + 1}: dados derivados de satélite presentes ('${colunaDetectada}'), mas informações de rastreio (Rastreio_Cenas, Rastreio_Versao_Motor, Rastreio_Calculado_Em) não estão devidamente preenchidas.`,
            detalhes: { linha: i + 1, coluna: colunaDetectada, cenas, versaoMotor, calculadoEm },
          });
        }
      }
    }
  }

  // ==========================================================================
  // INVARIANTE 6: Lista Negra de Literais Geográficos
  // Nenhuma coluna geográfica contém "Custom", "Bacia Local", ou nome de UF como município
  // ==========================================================================
  const colunasGeo = ["Municipio", "Bacia_Hidrografica", "Macrorregiao"];
  for (const col of colunasGeo) {
    if (cabecalho.includes(col)) {
      for (let i = 0; i < n; i++) {
        const val = linhas[i][col];
        if (typeof val === "string" && val.trim().length > 0) {
          const valMin = val.trim().toLowerCase();
          let violou = false;
          for (const proibido of LISTA_NEGRA_LITERAIS_GEOGRAFICOS) {
            if (valMin === proibido || (proibido.includes("bacia") && valMin.includes(proibido))) {
              violacoes.push({
                invariante: 6,
                nome: "Literal Geográfico Proibido",
                mensagem: `Linha ${i + 1}: coluna '${col}' contém literal de programa proibido ('${val}').`,
                detalhes: { linha: i + 1, coluna: col, valor: val },
              });
              violou = true;
              break;
            }
          }
          if (!violou && col === "Municipio") {
            if (
              (NOMES_UFS_BRASIL as readonly string[]).includes(valMin) ||
              (SIGLAS_UFS_BRASIL as readonly string[]).includes(valMin)
            ) {
              violacoes.push({
                invariante: 6,
                nome: "Literal Geográfico Proibido",
                mensagem: `Linha ${i + 1}: coluna '${col}' contém nome ou sigla de UF ('${val}') em vez de município.`,
                detalhes: { linha: i + 1, coluna: col, valor: val },
              });
            }
          }
        }
      }
    }
  }

  // ==========================================================================
  // INVARIANTE 5: Afirmação Negativa Fundiária
  // "Sem correspondência" só aparece após consulta bem-sucedida sem match.
  // Aplica-se a CAR_Status e a Status_Fundiario.
  // ==========================================================================
  const colunasStatusFundiario = ["CAR_Status", "Status_Fundiario"];
  for (const colStatus of colunasStatusFundiario) {
    if (cabecalho.includes(colStatus)) {
      for (let i = 0; i < n; i++) {
        const status = String(linhas[i][colStatus] ?? "").trim().toLowerCase();
        if (status === "sem-correspondencia") {
          const motivo = String(linhas[i]["Motivo_Acesso"] ?? "").trim().toLowerCase();
          const motivoApontaFalha = MOTIVOS_FALHA_OU_NAO_CONSULTADO_FUNDIARIO.some(
            (m) => contemTermoIsolado(motivo, m)
          );
          if (!motivo || motivoApontaFalha) {
            violacoes.push({
              invariante: 5,
              nome: "Afirmação Negativa Fundiária Falaciosa",
              mensagem: `Linha ${i + 1}: declarada '${colStatus} = sem-correspondencia' porém o motivo aponta falha de consulta ou ausência de consulta ('${linhas[i]["Motivo_Acesso"] ?? ""}').`,
              detalhes: { linha: i + 1, coluna: colStatus, motivo: linhas[i]["Motivo_Acesso"] },
            });
          }
        }
      }
    }
  }

  // ==========================================================================
  // INVARIANTE 1: Coerência RUSLE (inerte se não preenchido)
  // perdaSolo preenchida <=> 5 fatores preenchidos <=> memoria preenchida
  // ==========================================================================
  if (cabecalho.includes("RUSLE_Perda_Solo_t_ha_ano")) {
    for (let i = 0; i < n; i++) {
      const linha = linhas[i];
      const perda = linha["RUSLE_Perda_Solo_t_ha_ano"];
      const temPerda = perda !== undefined && perda !== null && perda !== "" && !isNaN(Number(perda));

      const r = linha["RUSLE_Fator_R"];
      const k = linha["RUSLE_Fator_K"];
      const ls = linha["RUSLE_Fator_LS"];
      const c = linha["RUSLE_Fator_C"];
      const p = linha["RUSLE_Fator_P"];
      const tem5 = [r, k, ls, c, p].every((x) => x !== undefined && x !== null && x !== "" && !isNaN(Number(x)));

      const mem = String(linha["RUSLE_Memoria_Calculo"] ?? "").trim();
      const memValida = mem.length > 0 && !mem.toLowerCase().includes("não executado") && !mem.toLowerCase().includes("nao executado");

      if (temPerda && (!tem5 || !memValida)) {
        violacoes.push({
          invariante: 1,
          nome: "Coerência RUSLE",
          mensagem: `Linha ${i + 1}: perda de solo preenchida (${perda}), mas os 5 fatores e a memória válida não estão simultaneamente disponíveis.`,
          detalhes: { linha: i + 1 },
        });
      } else if (!temPerda && tem5 && memValida) {
        violacoes.push({
          invariante: 1,
          nome: "Coerência RUSLE",
          mensagem: `Linha ${i + 1}: todos os 5 fatores e memória estão presentes, mas perdaSolo está vazia.`,
          detalhes: { linha: i + 1 },
        });
      }
    }
  }

  return {
    valido: violacoes.length === 0,
    violacoes,
  };
}

export function assegurarInvariantesArtefato(artefato: ArtefatoProjetado): void {
  const resultado = validarInvariantesArtefato(artefato);
  if (!resultado.valido) {
    const msgs = resultado.violacoes.map((v) => `[Invariante ${v.invariante} - ${v.nome}]: ${v.mensagem}`).join("\n");
    throw new Error(`Exportação recusada por violação de invariantes:\n${msgs}`);
  }
}
