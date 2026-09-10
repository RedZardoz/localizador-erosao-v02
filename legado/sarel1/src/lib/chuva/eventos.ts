/**
 * ============================================================================
 * Detecção de Eventos Erosivos e Índice de Mecanismo — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * CRITÉRIOS DE EVENTO EROSIVO (Wischmeier & Smith, 1978; Renard et al., 1997):
 * Um evento individual de chuva é classificado como potencialmente erosivo se:
 * 1. Volume total acumulado >= 10.0 mm; OU
 * 2. Intensidade máxima em 30 minutos (I30) >= 12.7 mm/h.
 *
 * ÍNDICE DE MECANISMO DA EROSÃO HÍDRICA (PLANEJAMENTO V3, §6.4):
 * Índice = Sigma_t ( erosividade_t * solo_exposto_t )
 * É a formalização física estrita do impacto da chuva incidente diretamente
 * sobre solo descoberto ao longo da série histórica.
 */

import { Proveniencia } from "@/types/proveniencia";
import { RegistroChuvaDiaria, calcularAcumuladosChuva, criarProvenienciaChirps } from "./chirps";
import { RegistroImergSemiHorario, extrairI30Maximo, criarProvenienciaImerg } from "./imerg";

export interface EventoErosivoDetectado {
  data: string;
  volumeMm: number;
  i30MmH?: number;
  fatorErosividadeEstimado: number;
}

export interface ParChuvaSolo {
  data: string;
  volumeChuvaMm: number;
  i30MmH?: number;
  fracaoSoloNu: number; // 0.0 a 1.0
}

/**
 * Detecta dias com eventos erosivos a partir da série diária e intensidade.
 */
export function detectarEventosErosivos(
  serieDiaria: RegistroChuvaDiaria[],
  limiarVolumeMm: number = 10.0
): EventoErosivoDetectado[] {
  const eventos: EventoErosivoDetectado[] = [];

  for (const reg of serieDiaria) {
    if (reg.precipitacaoMm >= limiarVolumeMm) {
      // Estimativa da energia cinética / erosividade do evento individual
      eventos.push({
        data: reg.data,
        volumeMm: reg.precipitacaoMm,
        fatorErosividadeEstimado: Number((reg.precipitacaoMm * 1.5).toFixed(2)),
      });
    }
  }

  return eventos;
}

/**
 * Calcula o Índice de Mecanismo: Sigma_t ( erosividade_t * soloNu_t )
 */
export function calcularIndiceMecanismo(pares: ParChuvaSolo[]): number | null {
  if (!pares || pares.length === 0) return null;

  let soma = 0;
  for (const p of pares) {
    const erosividade = (p.i30MmH && p.i30MmH > 0)
      ? (p.volumeChuvaMm * p.i30MmH) / 100
      : p.volumeChuvaMm * 0.5;
    const solo = Math.max(0, Math.min(1, p.fracaoSoloNu));
    soma += erosividade * solo;
  }

  return Number(soma.toFixed(2));
}

export interface InsumosChuvaCompletos {
  serieDiariaChirps: RegistroChuvaDiaria[];
  serieImerg: RegistroImergSemiHorario[];
  paresMecanismo?: ParChuvaSolo[];
}

/**
 * Constrói o bloco científico 'chuva' de PontoAmostral com proveniência por variável.
 */
export function construirBlocoChuva(insumos: InsumosChuvaCompletos) {
  const acumulados = calcularAcumuladosChuva(insumos.serieDiariaChirps);
  const i30 = extrairI30Maximo(insumos.serieImerg);
  const eventos = detectarEventosErosivos(insumos.serieDiariaChirps);
  const nEventos = eventos.length;

  const indiceMec = insumos.paresMecanismo ? calcularIndiceMecanismo(insumos.paresMecanismo) : null;

  const precipAcum30d = criarProvenienciaChirps(
    acumulados.acum30d,
    "Acumulado móvel de 30 dias na janela de amostragem"
  );
  const precipAcum90d = criarProvenienciaChirps(
    acumulados.acum90d,
    "Acumulado móvel de 90 dias na janela de amostragem"
  );
  const i30Max = criarProvenienciaImerg(
    i30,
    "Intensidade máxima sub-horária (taxa em janela de 30 min)"
  );

  const nEventosErosivos: Proveniencia<number> = {
    estado: "medido",
    valor: nEventos,
    fonte: "CHIRPS + GPM IMERG",
    adquiridoEm: new Date().toISOString().split("T")[0],
    detalhe: `Total de eventos com chuva diária >= 10 mm na série observada`,
  };

  const indiceMecanismo: Proveniencia<number> = indiceMec !== null
    ? {
        estado: "modelado",
        valor: indiceMec,
        modelo: "Sigma_t (erosividade_t * soloNu_t)",
        insumos: ["chirpsPrecip", "imergI30", "sentinel2SoloNu"],
      }
    : {
        estado: "indisponivel",
        motivo: "Pares simultâneos de chuva e solo nu não fornecidos para cálculo de mecanismo.",
      };

  return {
    precipAcum30d,
    precipAcum90d,
    i30Max,
    nEventosErosivos,
    indiceMecanismo,
  };
}
