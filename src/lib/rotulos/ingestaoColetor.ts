/**
 * ============================================================================
 * Ingestão de Arquivos do SAREL Coletor (Android GNSS / Fase B — D16)
 * ============================================================================
 *
 * Módulo oficial de ingestão do SAREL Coletor (substitui o KoboCollect conforme D16 item 5).
 * Processa o CSV de 28 colunas canônicas mais as métricas de qualidade posicional GNSS:
 *
 * 1. Tolerância Geodésica P03: 15 m nominal (1,5 pixel do Sentinel-2), aceito com ressalva
 *    até 25 m quando houver obstáculo físico. Acima de 25 m é compulsoriamente rejeitado.
 * 2. Média Estática GNSS: Avalia metodo_posicao ("media_estatica" vs "fix_unico"),
 *    rejeita estritamente coordenadas simuladas (fix_simulado === true, Invariante 5 / P12).
 * 3. Alvo Contínuo e Secundário (D26): Ingesta fracaoErodida [0, 1] e deriva alvoBinarioDerivado.
 * 4. Blindagem Epistêmica: Rótulos ingeridos passam a compor a âncora de prevalência de campo
 *    ou a massa de treino dependendo do selo do ponto.
 */

import { Rotulo } from "@/types/rotulo";
import { calcularDistanciaHaversineMetros, CoordenadaEsperada } from "./ingestaoKobo";

export interface ItemColetorProcessado {
  pontoCodigo: string;
  rotulo: Rotulo;
  distanciaGpsMetros: number;
  qualidadeP03: "aceito" | "aceito_com_ressalva" | "rejeitado";
  metodoPosicao: "media_estatica" | "fix_unico" | "desconhecido";
  erroPadraoM?: number;
  respostasBrutas: Record<string, unknown>;
}

export interface RegistroRejeitadoColetor {
  registro: unknown;
  motivo: string;
}

export interface ResultadoIngestaoColetor {
  totalProcessados: number;
  aceitos: ItemColetorProcessado[];
  rejeitados: RegistroRejeitadoColetor[];
  avisosQualidade: string[];
}

export const COLUNAS_CANONICAS_SAREL_COLETOR = [
  "codigoPonto",
  "classe",
  "confianca",
  "modalidade",
  "observador",
  "observadoEm",
  "dataHoraCompleta",
  "latitude",
  "longitude",
  "altitude",
  "acuraciaGps",
  "distanciaPlanejadaMetros",
  "dentroToleranciaP03",
  "cego",
  "pedestais_raizes_expostas",
  "exposicao_horizonte_b",
  "espessura_horizonte_a_cm",
  "crosta_selamento_superficial",
  "microssulcos_iniciais",
  "sedimentacao_sope",
  "sistema_manejo",
  "cobertura_vegetal_pct",
  "presenca_terraco",
  "estado_conservacao_terraco",
  "sentido_plantio",
  "observacoes",
  "foto_nadir",
  "foto_panoramica",
] as const;

/**
 * Faz o parse e a validação completa de uma string CSV (ou array de objetos)
 * originada do SAREL Coletor.
 */
export function ingestarSubmissoesSarelColetor(
  conteudoOuRegistros: string | Record<string, unknown>[],
  coordenadasEsperadas: Record<string, CoordenadaEsperada>
): ResultadoIngestaoColetor {
  const aceitos: ItemColetorProcessado[] = [];
  const rejeitados: RegistroRejeitadoColetor[] = [];
  const avisosQualidade: string[] = [];

  let registros: Record<string, unknown>[] = [];

  if (typeof conteudoOuRegistros === "string") {
    const textoLimpo = conteudoOuRegistros.replace(/^\uFEFF/, "").trim();
    if (!textoLimpo) {
      return { totalProcessados: 0, aceitos, rejeitados, avisosQualidade };
    }

    const linhas = textoLimpo
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));

    if (linhas.length < 2) {
      return {
        totalProcessados: 0,
        aceitos,
        rejeitados: [{ registro: textoLimpo, motivo: "CSV sem linhas de dados ou cabeçalho ausente." }],
        avisosQualidade,
      };
    }

    // Detecta separador (; ou ,)
    const primeiraLinha = linhas[0];
    const separador = primeiraLinha.includes(";") ? ";" : ",";
    const cabecalho = primeiraLinha.split(separador).map((c) => c.trim().replace(/^"|"$/g, ""));

    for (let i = 1; i < linhas.length; i++) {
      const valores = linhas[i].split(separador).map((v) => v.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, unknown> = {};
      cabecalho.forEach((col, idx) => {
        obj[col] = valores[idx] ?? "";
      });
      registros.push(obj);
    }
  } else if (Array.isArray(conteudoOuRegistros)) {
    registros = conteudoOuRegistros;
  }

  for (let idx = 0; idx < registros.length; idx++) {
    const reg = registros[idx];
    const codigoPonto = String(reg.codigoPonto ?? reg.codigo ?? reg.idPonto ?? "").trim();

    if (!codigoPonto) {
      rejeitados.push({ registro: reg, motivo: "Campo obrigatório 'codigoPonto' ausente ou vazio." });
      continue;
    }

    const esperada = coordenadasEsperadas[codigoPonto];
    if (!esperada) {
      rejeitados.push({
        registro: reg,
        motivo: `Ponto '${codigoPonto}' não cadastrado na malha amostral de referência do SAREL.`,
      });
      continue;
    }

    // Rejeição de Fix Simulado (P12 / Invariante 5)
    if (reg.fix_simulado === true || reg.fix_simulado === "true" || reg.mock === true) {
      rejeitados.push({
        registro: reg,
        motivo: `Coordenada GPS mockada ou simulada detectada (Invariante 5 / P12 proíbe posições não-físicas).`,
      });
      continue;
    }

    // Coordenadas coletadas
    const latColetada = parseFloat(String(reg.latitude ?? "NaN"));
    const lonColetada = parseFloat(String(reg.longitude ?? "NaN"));

    if (isNaN(latColetada) || isNaN(lonColetada)) {
      rejeitados.push({
        registro: reg,
        motivo: `Coordenadas geográficas inválidas ou não numéricas (lat: ${reg.latitude}, lon: ${reg.longitude}).`,
      });
      continue;
    }

    // Distância geodésica em relação ao ponto planejado
    const distanciaCalculadaM = calcularDistanciaHaversineMetros(
      esperada.latitude,
      esperada.longitude,
      latColetada,
      lonColetada
    );

    // Avaliação do Critério P03: 15 m nominal, tolerância até 25 m
    let qualidadeP03: "aceito" | "aceito_com_ressalva" | "rejeitado";
    if (distanciaCalculadaM <= 15.0) {
      qualidadeP03 = "aceito";
    } else if (distanciaCalculadaM <= 25.0) {
      qualidadeP03 = "aceito_com_ressalva";
      avisosQualidade.push(
        `Ponto ${codigoPonto}: desvio de ${distanciaCalculadaM.toFixed(1)} m excede o raio nominal (15 m), aceito sob ressalva (< 25 m).`
      );
    } else {
      rejeitados.push({
        registro: reg,
        motivo: `Desvio geodésico excessivo (${distanciaCalculadaM.toFixed(1)} m > 25 m). Risco de contaminação de pixel adjacente.`,
      });
      continue;
    }

    // Classe de campo (D03)
    const classeRaw = String(reg.classe ?? "").trim().toLowerCase();
    const classeNormalizada =
      classeRaw === "1" || classeRaw === "erosao" || classeRaw === "erosão"
        ? "erosao"
        : classeRaw === "0" || classeRaw === "controle"
        ? "controle"
        : "";

    if (!classeNormalizada) {
      rejeitados.push({
        registro: reg,
        motivo: `Classe observada inválida ('${reg.classe}'). Esperado 'erosao' ou 'controle'.`,
      });
      continue;
    }

    // Alvo contínuo D26 (fracaoErodida) e alvo binário derivado
    let fracaoErodida: number | undefined = undefined;
    if (reg.fracaoErodida !== undefined && reg.fracaoErodida !== "") {
      const parsedFracao = parseFloat(String(reg.fracaoErodida));
      if (!isNaN(parsedFracao) && parsedFracao >= 0 && parsedFracao <= 1) {
        fracaoErodida = Number(parsedFracao.toFixed(3));
      }
    }

    const alvoBinarioDerivado: 0 | 1 =
      fracaoErodida !== undefined
        ? fracaoErodida >= 0.25
          ? 1
          : 0
        : classeNormalizada === "erosao"
        ? 1
        : 0;

    // Metadados periciais
    const observador = String(reg.observador ?? "").trim() || "Perito SAREL Coletor";
    const observadoEm = String(reg.observadoEm ?? new Date().toISOString().split("T")[0]).trim();
    const confiancaRaw = String(reg.confianca ?? "").trim().toLowerCase();
    const confianca: "alta" | "media" | "baixa" =
      confiancaRaw === "alta" || confiancaRaw === "media" || confiancaRaw === "baixa"
        ? (confiancaRaw as any)
        : "alta";

    const cego = reg.cego === true || reg.cego === "true" || reg.cego === "1";

    const rotulo: Rotulo = {
      classe: classeNormalizada,
      modalidade: "campo",
      observador,
      observadoEm,
      confianca,
      cego,
      fracaoErodida,
      alvoBinarioDerivado,
      observacoes: reg.observacoes ? String(reg.observacoes).trim() : undefined,
    };

    const metodoPosicao =
      reg.metodo_posicao === "media_estatica"
        ? "media_estatica"
        : reg.metodo_posicao === "fix_unico"
        ? "fix_unico"
        : "desconhecido";

    const erroPadraoM =
      reg.erro_padrao_m !== undefined && reg.erro_padrao_m !== ""
        ? parseFloat(String(reg.erro_padrao_m))
        : undefined;

    aceitos.push({
      pontoCodigo: codigoPonto,
      rotulo,
      distanciaGpsMetros: Number(distanciaCalculadaM.toFixed(2)),
      qualidadeP03,
      metodoPosicao,
      erroPadraoM: erroPadraoM !== undefined && !isNaN(erroPadraoM) ? erroPadraoM : undefined,
      respostasBrutas: reg,
    });
  }

  return {
    totalProcessados: registros.length,
    aceitos,
    rejeitados,
    avisosQualidade,
  };
}

/**
 * Gera um template de CSV canônico do SAREL Coletor para importar pontos na campanha.
 */
export function gerarTemplateSarelColetorCsv(pontos: CoordenadaEsperada[]): string {
  const colunas = COLUNAS_CANONICAS_SAREL_COLETOR.join(";");
  const linhas = pontos.map((p) => {
    // codigoPonto;classe;confianca;modalidade;observador;observadoEm;dataHoraCompleta;latitude;longitude;...
    return `${p.codigo};;;campo;;;${new Date().toISOString()};${p.latitude.toFixed(6)};${p.longitude.toFixed(6)};;;;;true;;;;;;;;;;;;;`;
  });
  return "\uFEFF" + [colunas, ...linhas].join("\r\n");
}
