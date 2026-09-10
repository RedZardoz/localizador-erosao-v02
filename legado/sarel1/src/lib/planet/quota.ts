/**
 * ============================================================================
 * Gestão Orçamentária e Controle de Cota Planet — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * RESTRIÇÕES REAIS DA CONTA INSTITUCIONAL (PLANO V2, §10.0):
 * - Plano Ativo: Education and Research Basic (Plan ID 798565, vigência até 05/04/2028).
 * - Cota de Scene Downloads: 3.000 km² (OVERAGE: OFF — esgotou, a API rejeita).
 * - Cota de Scene Tiles: 100.000 tiles (para visualização/fotointerpretação sem consumir km²).
 * - Plano Trial EXPIRADO em 29/04/2026: Statistical API vinha nele e não deve ser premissa.
 *
 * REGRA 2 DA LEI FUNDAMENTAL:
 * Cota esgotada é tratada como estado explícito e informativo, NUNCA como falha de rede
 * e NUNCA como ausência de dado no território.
 */

export interface EstadoCotaPlanet {
  cotaTotalKm2: number;
  consumoAtualKm2: number;
  saldoDisponivelKm2: number;
  tilesTotal: number;
  tilesConsumidos: number;
  cicloMes: string;
  overagePermitido: boolean;
}

export const COTA_PADRAO_ACADEMICA: EstadoCotaPlanet = {
  cotaTotalKm2: 3000.0,
  consumoAtualKm2: 0.0,
  saldoDisponivelKm2: 3000.0,
  tilesTotal: 100000,
  tilesConsumidos: 0,
  cicloMes: "2026-09",
  overagePermitido: false,
};

let estadoCotaAtual: EstadoCotaPlanet = { ...COTA_PADRAO_ACADEMICA };

export class ErroCotaPlanetExcedida extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroCotaPlanetExcedida";
  }
}

/**
 * Retorna o estado atual do orçamento de cota Planet.
 */
export function obterEstadoCota(): EstadoCotaPlanet {
  return { ...estadoCotaAtual };
}

/**
 * Reseta ou atualiza o saldo da cota (por exemplo, no reinício do ciclo mensal).
 */
export function atualizarSaldoCota(novosDados: Partial<EstadoCotaPlanet>): void {
  estadoCotaAtual = {
    ...estadoCotaAtual,
    ...novosDados,
    saldoDisponivelKm2: (novosDados.cotaTotalKm2 ?? estadoCotaAtual.cotaTotalKm2) -
                        (novosDados.consumoAtualKm2 ?? estadoCotaAtual.consumoAtualKm2),
  };
}

/**
 * Calcula a área em km² de um buffer circular em torno de um ponto.
 * Buffer padrão recomendado: 250 m (janela de 500m x 500m ≈ 0,25 km²).
 */
export function calcularAreaBufferKm2(raioBufferMetros: number = 250): number {
  const ladoKm = (raioBufferMetros * 2) / 1000;
  // Janela quadrada circunscrita de download
  return Number((ladoKm * ladoKm).toFixed(4));
}

/**
 * Verifica se um pedido de download cabe no saldo da cota.
 * Lança ErroCotaPlanetExcedida se ultrapassar o limite com OVERAGE: OFF.
 */
export function validarConsumoPrevisto(areaSolicitadaKm2: number): void {
  if (areaSolicitadaKm2 <= 0) {
    throw new Error("Área de download solicitada deve ser maior que zero.");
  }

  if (estadoCotaAtual.consumoAtualKm2 + areaSolicitadaKm2 > estadoCotaAtual.cotaTotalKm2) {
    const deficit = (estadoCotaAtual.consumoAtualKm2 + areaSolicitadaKm2) - estadoCotaAtual.cotaTotalKm2;
    throw new ErroCotaPlanetExcedida(
      `Pedido Planet de ${areaSolicitadaKm2.toFixed(2)} km² excede a cota disponível (Saldo restante: ${estadoCotaAtual.saldoDisponivelKm2.toFixed(2)} km², Déficit: ${deficit.toFixed(2)} km²). Cota institucional com OVERAGE: OFF bloqueou a emissão para evitar falhas silenciosas.`
    );
  }
}

/**
 * Registra o consumo de um pedido faturado e atualiza o saldo.
 */
export function registrarConsumoDownload(areaConsumidaKm2: number): void {
  validarConsumoPrevisto(areaConsumidaKm2);
  estadoCotaAtual.consumoAtualKm2 = Number((estadoCotaAtual.consumoAtualKm2 + areaConsumidaKm2).toFixed(4));
  estadoCotaAtual.saldoDisponivelKm2 = Number((estadoCotaAtual.cotaTotalKm2 - estadoCotaAtual.consumoAtualKm2).toFixed(4));
}

/**
 * Registra consumo de visualização via Scene Tiles (não desconta da cota de km²).
 */
export function registrarConsumoTiles(quantidadeTiles: number): void {
  estadoCotaAtual.tilesConsumidos += quantidadeTiles;
}
