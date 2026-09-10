/**
 * ============================================================================
 * Máscara e Frame de Elegibilidade Amostral — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * CRITÉRIOS DO FRAME AMOSTRAL (PLANEJAMENTO V3, §7.1):
 * 1. Uso do Solo: ESA WorldCover (classes 30, 40, 60 - lavoura e vegetação esparsa).
 *    Exclui corpos d'água (classe 80) e florestas densas (classes 10, 20, 90).
 * 2. Relevo: Declividade entre 3% e 20% (domínio agrícola com suscetibilidade laminar;
 *    relevo plano < 3% é deposicional e escarpas > 20% sofrem outros processos).
 * 3. Buffer de corpos d'água: Exclusão num raio de 30 metros.
 * 4. Buffer de área urbana: Exclusão num raio de 150 metros.
 * 5. Cobertura Temporal Mínima: Número mínimo de observações desanuviadas válidas
 *    na série histórica (evita harmônicos mal condicionados).
 */

export interface ParametrosElegibilidade {
  classesUsoPermitidas: number[]; // [30, 40, 60]
  declividadeMinPct: number;      // 3.0
  declividadeMaxPct: number;      // 20.0
  bufferAguaMetros: number;       // 30
  bufferUrbanoMetros: number;     // 150
  minObservacoesValidasSerie: number; // 24 observações sem nuvem
}

export const PARAMETROS_ELEGIBILIDADE_PADRAO: ParametrosElegibilidade = {
  classesUsoPermitidas: [30, 40, 60],
  declividadeMinPct: 3.0,
  declividadeMaxPct: 20.0,
  bufferAguaMetros: 30,
  bufferUrbanoMetros: 150,
  minObservacoesValidasSerie: 24,
};

export interface CandidatoPonto {
  id: string;
  latitude: number;
  longitude: number;
  classeUsoEsa: number;
  declividadePct: number;
  distanciaAguaMetros: number;
  distanciaUrbanoMetros: number;
  nObservacoesValidasSerie: number;
}

export interface ResultadoElegibilidade {
  elegivel: boolean;
  motivosInaptidao: string[];
}

/**
 * Avalia se um candidato satisfaz todos os critérios do frame de elegibilidade.
 */
export function avaliarElegibilidadePonto(
  candidato: CandidatoPonto,
  params: ParametrosElegibilidade = PARAMETROS_ELEGIBILIDADE_PADRAO
): ResultadoElegibilidade {
  const motivos: string[] = [];

  // 1. Uso do Solo
  if (!params.classesUsoPermitidas.includes(candidato.classeUsoEsa)) {
    motivos.push(`Uso do solo (classe ESA ${candidato.classeUsoEsa}) fora do domínio agrícola de interesse.`);
  }

  // 2. Faixa de Declividade
  if (candidato.declividadePct < params.declividadeMinPct) {
    motivos.push(`Declividade de ${candidato.declividadePct.toFixed(1)}% abaixo do limiar erosivo de 3% (área deposicional/plana).`);
  } else if (candidato.declividadePct > params.declividadeMaxPct) {
    motivos.push(`Declividade de ${candidato.declividadePct.toFixed(1)}% acima do limite de 20% (suscetibilidade a incisão e deslizamento).`);
  }

  // 3. Buffer de Água
  if (candidato.distanciaAguaMetros < params.bufferAguaMetros) {
    motivos.push(`Ponto dentro da zona de amortecimento de água (${candidato.distanciaAguaMetros} m < ${params.bufferAguaMetros} m).`);
  }

  // 4. Buffer Urbano
  if (candidato.distanciaUrbanoMetros < params.bufferUrbanoMetros) {
    motivos.push(`Ponto dentro da zona de influência urbana (${candidato.distanciaUrbanoMetros} m < ${params.bufferUrbanoMetros} m).`);
  }

  // 5. Cobertura Temporal Mínima (Requisito Científico)
  if (candidato.nObservacoesValidasSerie < params.minObservacoesValidasSerie) {
    motivos.push(`Cobertura temporal insuficiente (${candidato.nObservacoesValidasSerie} obs. válidas < ${params.minObservacoesValidasSerie} mínimas exigidas).`);
  }

  return {
    elegivel: motivos.length === 0,
    motivosInaptidao: motivos,
  };
}
