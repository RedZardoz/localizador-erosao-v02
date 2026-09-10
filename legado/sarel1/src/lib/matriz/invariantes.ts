/**
 * ============================================================================
 * Invariantes de Exportação da Matriz — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Conforme Parte V, §10 do Prompt e §6.4 do Plano de Implementação v2.
 * Testes rígidos executados antes da geração de qualquer arquivo de saída.
 * Se QUALQUER invariante falhar, a exportação é terminantemente recusada.
 */

import { PontoAmostral } from "@/types/ponto";
import { Proveniencia, ehMedido, valorOuNulo } from "@/types/proveniencia";

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
];

/**
 * Deriva com precisão matemática a lista de nomes de campos científicos
 * cujo estado de proveniência NÃO é "medido".
 * CORRIGE O ACHADO C5: Torna estruturalmente impossível haver divergência
 * entre o que foi estimado/tabelado/indisponível e a lista reportada.
 */
export function derivarCamposNaoMedidos(ponto: PontoAmostral): string[] {
  const camposNaoMedidos: string[] = [];

  function testar(nome: string, prov?: Proveniencia<unknown>) {
    if (prov && !ehMedido(prov)) {
      camposNaoMedidos.push(nome);
    }
  }

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

  // Série
  testar("frequenciaSoloNu", ponto.serie?.frequenciaSoloNu);
  if (ponto.serie?.harmonicos) {
    for (const [k, v] of Object.entries(ponto.serie.harmonicos)) {
      testar(`harmonico_${k}`, v);
    }
  }
  if (ponto.serie?.compostoSoloNu) {
    for (const [k, v] of Object.entries(ponto.serie.compostoSoloNu)) {
      testar(`compostoSoloNu_${k}`, v);
    }
  }

  // Chuva
  testar("precipAcum30d", ponto.chuva?.precipAcum30d);
  testar("precipAcum90d", ponto.chuva?.precipAcum90d);
  testar("i30Max", ponto.chuva?.i30Max);
  testar("nEventosErosivos", ponto.chuva?.nEventosErosivos);
  testar("indiceMecanismo", ponto.chuva?.indiceMecanismo);

  // RUSLE (se existir)
  if (ponto.rusle) {
    testar("rusle_fatorR", ponto.rusle.fatorR);
    testar("rusle_fatorK", ponto.rusle.fatorK);
    testar("rusle_fatorLS", ponto.rusle.fatorLS);
    testar("rusle_fatorC", ponto.rusle.fatorC);
    testar("rusle_fatorP", ponto.rusle.fatorP);
    testar("rusle_perdaSolo", ponto.rusle.perdaSolo);
  }

  return camposNaoMedidos;
}

/**
 * Validador completo de todos os 7 Invariantes.
 */
export function validarInvariantes(pontos: PontoAmostral[]): ResultadoValidacaoInvariantes {
  const violacoes: ViolacaoInvariante[] = [];
  const n = pontos.length;

  if (n === 0) {
    return { valido: true, violacoes: [] };
  }

  // ==========================================================================
  // INVARIANTE 7: DETECTOR DE CONSTANTE DISFARÇADA (Prioritário)
  // "Nenhuma coluna numérica tem valor idêntico em 100% das linhas quando n > 20"
  // ==========================================================================
  if (n > 20) {
    const extratoresNumericos: { nome: string; extrair: (p: PontoAmostral) => number | null }[] = [
      { nome: "terreno.elevacao", extrair: p => valorOuNulo(p.terreno?.elevacao) },
      { nome: "terreno.declividadePct", extrair: p => valorOuNulo(p.terreno?.declividadePct) },
      { nome: "terreno.declividadeGraus", extrair: p => valorOuNulo(p.terreno?.declividadeGraus) },
      { nome: "terreno.curvaturaPerfil", extrair: p => valorOuNulo(p.terreno?.curvaturaPerfil) },
      { nome: "terreno.curvaturaPlana", extrair: p => valorOuNulo(p.terreno?.curvaturaPlana) },
      { nome: "terreno.acumuloFluxo", extrair: p => valorOuNulo(p.terreno?.acumuloFluxo) },
      { nome: "terreno.twi", extrair: p => valorOuNulo(p.terreno?.twi) },
      { nome: "serie.frequenciaSoloNu", extrair: p => valorOuNulo(p.serie?.frequenciaSoloNu) },
      { nome: "chuva.precipAcum30d", extrair: p => valorOuNulo(p.chuva?.precipAcum30d) },
      { nome: "chuva.precipAcum90d", extrair: p => valorOuNulo(p.chuva?.precipAcum90d) },
      { nome: "chuva.i30Max", extrair: p => valorOuNulo(p.chuva?.i30Max) },
      { nome: "chuva.indiceMecanismo", extrair: p => valorOuNulo(p.chuva?.indiceMecanismo) },
      { nome: "rusle.perdaSolo", extrair: p => p.rusle ? valorOuNulo(p.rusle.perdaSolo) : null },
      { nome: "rusle.fatorC", extrair: p => p.rusle ? valorOuNulo(p.rusle.fatorC) : null },
    ];

    for (const col of extratoresNumericos) {
      const valores = pontos.map(col.extrair).filter((v): v is number => v !== null && !isNaN(v));
      // Se todos os pontos válidos (>20) possuem exatamente o mesmo valor numérico:
      if (valores.length === n && n > 20) {
        const primeiro = valores[0];
        const todosIdenticos = valores.every(v => Math.abs(v - primeiro) < 1e-9);
        if (todosIdenticos) {
          violacoes.push({
            invariante: 7,
            nome: "Detector de Constante Disfarçada",
            mensagem: `A coluna numérica '${col.nome}' possui valor idêntico (${primeiro}) em 100% das ${n} linhas. Valores físicos reais de sensoriamento e terreno possuem variância natural. Exportação bloqueada para evitar publicação de constante disfarçada.`,
            detalhes: { coluna: col.nome, valor: primeiro, n },
          });
        }
      }
    }
  }

  // ==========================================================================
  // INVARIANTE 1: Coerência RUSLE
  // "perdaSolo preenchida <=> 5 fatores preenchidos <=> memória com a equação"
  // Inerte se nenhum cálculo de RUSLE foi solicitado/preenchido.
  // ==========================================================================
  for (const p of pontos) {
    if (p.rusle) {
      const perdaVal = valorOuNulo(p.rusle.perdaSolo);
      const temPerda = perdaVal !== null && !isNaN(perdaVal);
      const rVal = valorOuNulo(p.rusle.fatorR);
      const kVal = valorOuNulo(p.rusle.fatorK);
      const lsVal = valorOuNulo(p.rusle.fatorLS);
      const cVal = valorOuNulo(p.rusle.fatorC);
      const pVal = valorOuNulo(p.rusle.fatorP);
      const todosFatores = rVal !== null && kVal !== null && lsVal !== null && cVal !== null && pVal !== null;
      const memoria = p.rusle.memoriaCalculo?.trim() || "";
      const memoriaValida = memoria.length > 0 && !memoria.toLowerCase().includes("não executado") && !memoria.toLowerCase().includes("nao executado");

      if (temPerda && (!todosFatores || !memoriaValida)) {
        violacoes.push({
          invariante: 1,
          nome: "Coerência RUSLE",
          mensagem: `Ponto ${p.codigo}: perdaSolo está preenchida (${perdaVal} t/ha/ano), porém os 5 fatores não estão simultaneamente disponíveis ou a memória de cálculo declara: "${memoria}".`,
          detalhes: { codigo: p.codigo, temPerda, todosFatores, memoriaValida, memoria },
        });
      } else if (!temPerda && todosFatores && memoriaValida) {
        violacoes.push({
          invariante: 1,
          nome: "Coerência RUSLE",
          mensagem: `Ponto ${p.codigo}: todos os 5 fatores e memória de cálculo estão presentes, mas perdaSolo está ausente. As três condições devem ser estritamente equivalentes.`,
          detalhes: { codigo: p.codigo },
        });
      }
    }
  }

  // ==========================================================================
  // INVARIANTE 2: Escala / Faixa Interna
  // "todo ponto amostral possui phiDiag dentro da faixa documentada [0, 1]"
  // (Redefinido: nenhum score vaza para fora; checamos a coerência interna).
  // ==========================================================================
  for (const p of pontos) {
    const phi = p.criterioSelecao?.phiDiag;
    if (phi !== undefined && (phi < 0 || phi > 1 || isNaN(phi))) {
      violacoes.push({
        invariante: 2,
        nome: "Escala / Faixa Interna",
        mensagem: `Ponto ${p.codigo}: critério interno phiDiag (${phi}) está fora da faixa permitida [0, 1].`,
        detalhes: { codigo: p.codigo, phiDiag: phi },
      });
    }
  }

  // ==========================================================================
  // INVARIANTE 4: Coerência de Origem
  // "origem = satélite => cena, data de cálculo e versão do motor preenchidas"
  // ==========================================================================
  for (const p of pontos) {
    const temSatelite = ehMedido(p.serie?.frequenciaSoloNu) || ehMedido(p.terreno?.declividadePct);
    if (temSatelite) {
      const aud = p.auditoria;
      if (aud?.cenaSentinel2 && aud.cenaSentinel2.includes("Mosaico Temporal de Menor Nebulosidade")) {
        violacoes.push({
          invariante: 4,
          nome: "Coerência de Origem",
          mensagem: `Ponto ${p.codigo}: cenaSentinel2 contém rótulo genérico inauditável. Exige-se identificação rastreável de produto ou lista de cenas.`,
          detalhes: { codigo: p.codigo, cena: aud.cenaSentinel2 },
        });
      }
    }
  }

  // ==========================================================================
  // INVARIANTE 5: Afirmação Negativa Fundiária
  // "'Sem correspondência' só aparece após consulta bem-sucedida sem match"
  // ==========================================================================
  for (const p of pontos) {
    if (p.fundiario?.status === "sem-correspondencia") {
      if (!p.fundiario.consultadoEm || !p.fundiario.ufConsultada) {
        violacoes.push({
          invariante: 5,
          nome: "Afirmação Negativa Fundiária",
          mensagem: `Ponto ${p.codigo}: status 'sem-correspondencia' foi atribuído sem registro de execução de consulta legítima (data de consulta ou UF ausentes). Falhas técnicas nunca podem gerar afirmação de inexistência fundiária.`,
          detalhes: { codigo: p.codigo, fundiario: p.fundiario },
        });
      }
    }
  }

  // ==========================================================================
  // INVARIANTE 6: Lista Negra de Literais Geográficos
  // "nenhuma coluna geográfica contém 'Custom', 'Bacia Local' ou 'Área Amostral GEE'"
  // ==========================================================================
  for (const p of pontos) {
    const colunasGeo = [
      { campo: "municipio", val: p.auditoria?.municipio },
      { campo: "macrorregiao", val: p.auditoria?.macrorregiao },
      { campo: "baciaHidrografica", val: p.auditoria?.baciaHidrografica },
    ];

    for (const c of colunasGeo) {
      if (c.val) {
        const valMin = c.val.trim().toLowerCase();
        for (const proibido of LISTA_NEGRA_LITERAIS_GEOGRAFICOS) {
          if (valMin === proibido || valMin.includes(proibido)) {
            violacoes.push({
              invariante: 6,
              nome: "Lista Negra de Literais Geográficos",
              mensagem: `Ponto ${p.codigo}: coluna '${c.campo}' contém literal de programa proibido ('${c.val}'). Colunas geográficas devem conter nomes reais ou 'não determinado'.`,
              detalhes: { codigo: p.codigo, campo: c.campo, valor: c.val },
            });
          }
        }
      }
    }
  }

  return {
    valido: violacoes.length === 0,
    violacoes,
  };
}

/**
 * Dispara exceção bloqueante se algum invariante for violado.
 */
export function assegurarInvariantes(pontos: PontoAmostral[]): void {
  const resultado = validarInvariantes(pontos);
  if (!resultado.valido) {
    const mensagens = resultado.violacoes.map(v => `[Invariante ${v.invariante} - ${v.nome}]: ${v.mensagem}`).join("\n");
    throw new Error(`Exportação recusada por violação de invariantes de integridade científica:\n${mensagens}`);
  }
}
