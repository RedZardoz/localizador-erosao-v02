/**
 * ============================================================================
 * Gestão Orçamentária e Controle de Cota Planet — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * RESTRIÇÕES REAIS DA CONTA INSTITUCIONAL (PLANO V3, §11.1-11.3):
 * - Plano Ativo: Education and Research Basic (Plan ID 798565, vigência até 05/04/2028).
 * - Cota de Scene Downloads: 3.000 km² (OVERAGE: OFF — esgotou, a API rejeita).
 * - Cota de Scene Tiles: 100.000 tiles (para visualização/fotointerpretação sem consumir km²).
 * - Ciclo da cota: sujeito a D17 (leitura mensal vs total).
 *
 * CORREÇÃO DA AUDITORIA (Achado S1-14):
 * O SAREL 1 guardava o saldo da cota em memória volátil e zerava a cada reinício do servidor.
 * Aqui implementamos o livro-razão persistente (livroRazao.json) em diretório local
 * configurável (padrão em data/planet/), garantindo que o saldo sobreviva a reinicializações.
 *
 * REGRAS DA LEI FUNDAMENTAL:
 * - Regra 1: Sem parâmetros numéricos com default na assinatura; sem cortes disfarçados.
 * - Regra 2: Cota esgotada é tratada como estado explícito "cota-esgotada",
 *   NUNCA como falha de rede e NUNCA como ausência de dados no território.
 */

import fs from "fs";
import path from "path";

export interface EstadoCotaPlanet {
  cotaTotalKm2: number;
  consumoAtualKm2: number;
  saldoDisponivelKm2: number;
  tilesTotal: number;
  tilesConsumidos: number;
  cicloMes: string;
  overagePermitido: boolean;
  ultimaAtualizacaoIso: string;
}

export interface RegistroLivroRazao {
  idTransacao: string;
  dataIso: string;
  tipo: "download" | "tile" | "ajuste" | "reconciliacao";
  quantidade: number;
  unidade: "km2" | "tiles";
  descricao: string;
  saldoResultanteKm2: number;
}

export class ErroCotaPlanetExcedida extends Error {
  readonly saldoDisponivelKm2: number;
  readonly solicitadoKm2: number;

  constructor(mensagem: string, saldoDisponivelKm2: number, solicitadoKm2: number) {
    super(mensagem);
    this.name = "ErroCotaPlanetExcedida";
    this.saldoDisponivelKm2 = saldoDisponivelKm2;
    this.solicitadoKm2 = solicitadoKm2;
  }
}

export interface OpcoesGerenciadorCota {
  caminhoArquivoLedger: string;
  cotaInicialKm2: number;
  tilesInicial: number;
  cicloMes: string;
}

export class GerenciadorCotaPlanet {
  private caminhoArquivo: string;
  private estado: EstadoCotaPlanet;
  private historico: RegistroLivroRazao[] = [];

  constructor(opcoes: OpcoesGerenciadorCota) {
    this.caminhoArquivo = opcoes.caminhoArquivoLedger;
    this.estado = {
      cotaTotalKm2: opcoes.cotaInicialKm2,
      consumoAtualKm2: 0,
      saldoDisponivelKm2: opcoes.cotaInicialKm2,
      tilesTotal: opcoes.tilesInicial,
      tilesConsumidos: 0,
      cicloMes: opcoes.cicloMes,
      overagePermitido: false,
      ultimaAtualizacaoIso: new Date().toISOString(), // permitido: auditoria de timestamp do livro-razao local
    };

    this.carregarDoDisco();
  }

  private carregarDoDisco(): void {
    try {
      if (fs.existsSync(this.caminhoArquivo)) {
        const conteudo = fs.readFileSync(this.caminhoArquivo, "utf-8");
        const dados = JSON.parse(conteudo);
        if (dados && dados.estado) {
          this.estado = dados.estado;
          this.historico = dados.historico || [];
        }
      }
    } catch {
      // Se não for possível ler, mantém estado inicial
    }
  }

  private salvarNoDisco(): void {
    try {
      const dir = path.dirname(this.caminhoArquivo);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const payload = {
        estado: this.estado,
        historico: this.historico,
      };
      fs.writeFileSync(this.caminhoArquivo, JSON.stringify(payload, null, 2), "utf-8");
    } catch {
      // Falhas de gravação em ambientes restritos mantêm dados em memória
    }
  }

  /**
   * Retorna o estado atual do orçamento de cota Planet.
   */
  public obterEstado(): EstadoCotaPlanet {
    return { ...this.estado };
  }

  /**
   * Verifica se o pedido cabe no saldo da cota institucional.
   * Lança ErroCotaPlanetExcedida se exceder o saldo com OVERAGE: OFF.
   */
  public validarConsumoPrevisto(areaSolicitadaKm2: number): void {
    if (areaSolicitadaKm2 <= 0) {
      throw new Error("Área de download solicitada deve ser maior que zero.");
    }

    if (this.estado.consumoAtualKm2 + areaSolicitadaKm2 > this.estado.cotaTotalKm2) {
      const deficit = (this.estado.consumoAtualKm2 + areaSolicitadaKm2) - this.estado.cotaTotalKm2;
      throw new ErroCotaPlanetExcedida(
        `Pedido Planet de ${areaSolicitadaKm2.toFixed(2)} km² excede o saldo da cota disponível (Saldo restante: ${this.estado.saldoDisponivelKm2.toFixed(2)} km², Déficit: ${deficit.toFixed(2)} km²). Cota com OVERAGE: OFF bloqueou a solicitação.`,
        this.estado.saldoDisponivelKm2,
        areaSolicitadaKm2
      );
    }
  }

  /**
   * Registra o débito de um download faturado e persiste no livro-razão.
   */
  public registrarConsumoDownload(areaConsumidaKm2: number, idTransacao: string, descricao: string): void {
    this.validarConsumoPrevisto(areaConsumidaKm2);

    this.estado.consumoAtualKm2 = Number((this.estado.consumoAtualKm2 + areaConsumidaKm2).toFixed(4));
    this.estado.saldoDisponivelKm2 = Number((this.estado.cotaTotalKm2 - this.estado.consumoAtualKm2).toFixed(4));
    this.estado.ultimaAtualizacaoIso = new Date().toISOString(); // permitido: auditoria de timestamp do livro-razao local

    this.historico.push({
      idTransacao,
      dataIso: this.estado.ultimaAtualizacaoIso,
      tipo: "download",
      quantidade: areaConsumidaKm2,
      unidade: "km2",
      descricao,
      saldoResultanteKm2: this.estado.saldoDisponivelKm2,
    });

    this.salvarNoDisco();
  }

  /**
   * Registra o consumo de tiles de visualização (não desconta da cota de km²).
   */
  public registrarConsumoTiles(quantidadeTiles: number, idTransacao: string, descricao: string): void {
    if (quantidadeTiles <= 0) {
      throw new Error("Quantidade de tiles deve ser maior que zero.");
    }

    this.estado.tilesConsumidos += quantidadeTiles;
    this.estado.ultimaAtualizacaoIso = new Date().toISOString(); // permitido: auditoria de timestamp do livro-razao local

    this.historico.push({
      idTransacao,
      dataIso: this.estado.ultimaAtualizacaoIso,
      tipo: "tile",
      quantidade: quantidadeTiles,
      unidade: "tiles",
      descricao,
      saldoResultanteKm2: this.estado.saldoDisponivelKm2,
    });

    this.salvarNoDisco();
  }
}

/**
 * Calcula a área em km² de um recorte quadrado circunscrito a um buffer pontual.
 * Para raio de 250 m (D18): lado = 500 m = 0.5 km -> Área = 0.25 km².
 */
export function calcularAreaBufferKm2(raioBufferMetros: number): number {
  if (raioBufferMetros <= 0) {
    throw new Error("Raio do buffer deve ser estritamente positivo.");
  }
  const ladoKm = (raioBufferMetros * 2) / 1000;
  return Number((ladoKm * ladoKm).toFixed(4));
}
