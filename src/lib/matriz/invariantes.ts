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

/**
 * Invariante 3: Deriva com precisão a lista de campos científicos cujo estado NÃO é "medido".
 */
export function derivarCamposNaoMedidos(ponto: PontoAmostral): string[] {
  const campos: string[] = [];

  function testar(nome: string, p?: Proveniencia<unknown> | null) {
    if (p && !ehMedido(p)) {
      campos.push(nome);
    }
  }

  // Localização
  testar("municipio", ponto.localizacao?.municipio);
  testar("codigoIbge", ponto.localizacao?.codigoIbge);
  testar("bacia", ponto.localizacao?.bacia);

  // Terreno
  testar("elevacao", ponto.terreno?.elevacao);
  testar("declividadePct", ponto.terreno?.declividadePct);
  testar("declividadeGraus", ponto.terreno?.declividadeGraus);
  testar("curvaturaPerfil", ponto.terreno?.curvaturaPerfil);
  testar("curvaturaPlana", ponto.terreno?.curvaturaPlana);
  testar("acumuloFluxo", ponto.terreno?.acumuloFluxo);
  testar("twi", ponto.terreno?.twi);

  // Solo
  testar("ordemSolo", ponto.solo?.ordem);
  testar("subOrdemSolo", ponto.solo?.subOrdem);
  testar("grandeGrupoSolo", ponto.solo?.grandeGrupo);
  testar("tipoUnidadeSolo", ponto.solo?.tipoUnidade);
  testar("erodibilidadeClasse", ponto.solo?.erodibilidadeClasse);

  // Temporal (D ou P)
  for (const janela of Object.values(ponto.temporal ?? {})) {
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
  // ==========================================================================
  for (const col of cabecalho) {
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
          for (const proibido of LISTA_NEGRA_LITERAIS_GEOGRAFICOS) {
            if (valMin === proibido || (proibido.includes("bacia") && valMin.includes(proibido))) {
              violacoes.push({
                invariante: 6,
                nome: "Literal Geográfico Proibido",
                mensagem: `Linha ${i + 1}: coluna '${col}' contém literal de programa proibido ('${val}').`,
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
  // "Sem correspondência" só aparece após consulta bem-sucedida sem match
  // ==========================================================================
  if (cabecalho.includes("CAR_Status")) {
    for (let i = 0; i < n; i++) {
      const status = linhas[i]["CAR_Status"];
      if (status === "sem-correspondencia") {
        const docMascarado = linhas[i]["Documento_Mascarado"];
        const motivo = linhas[i]["Motivo_Acesso"];
        // Se status afirma sem correspondência mas houve erro ou não foi consultado
        if (motivo && String(motivo).toLowerCase().includes("erro")) {
          violacoes.push({
            invariante: 5,
            nome: "Afirmação Negativa Fundiária Falaciosa",
            mensagem: `Linha ${i + 1}: declarada 'sem-correspondencia' porém o motivo aponta falha de consulta ('${motivo}').`,
            detalhes: { linha: i + 1 },
          });
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
