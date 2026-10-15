/**
 * ============================================================================
 * Sítios de Referência Padrão-Ouro (VANT/Drone) — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * O QUÊ ESTE MÓDULO DEFINE:
 * - Cadastra os metadados metodológicos e instrumentais dos 4 sítios contínuos
 *   de referência territorial (10 a 50 hectares cada) nos municípios de Céu Azul
 *   e Medianeira (Bacia Hidrográfica do Paraná 3).
 * - Apenas metadados não identificantes e identificadores opacos (CAR-OPACO-0n)
 *   permanecem versionados no repositório Git.
 * - Os dados cadastrais reais (código CAR completo, bounding boxes e perímetros
 *   vetoriais) são estritamente locais, residindo em `data/sitios_referencia_local.json`
 *   (fora do controle de versão, distribuídos via banco complementar Google Drive / Instalador).
 *
 * POR QUÊ POLÍGONOS CONTÍNUOS DE 10 A 50 HA FORAM ESCOLHIDOS (SEÇÃO 3.2):
 * 1. Superação da Falácia da Microparcela:
 *    Estudos clássicos de erosão frequentemente apoiam-se em parcelas experimentais
 *    reduzidas (ex.: padrão Wischmeier de 22 x 4 m), que desconsideram o comportamento
 *    real da enxurrada na escala da paisagem agrícola. Polígonos de 10 a 50 ha englobam
 *    o comprimento de rampa real, a confluência de fluxos, terraços agrícolas e carreadores.
 * 2. Captura da Catena Completa (Gradiente Topo-Sequencial):
 *    A erosão laminar não é um evento pontual estático; ela é um processo dinâmico
 *    que se intensifica no terço médio da rampa (8 a 18% de declividade) e desacelera
 *    no sopé, gerando leques de deposição coluvial. Apenas áreas contínuas permitem
 *    validar se a IA é capaz de distinguir o ponto de desprendimento do ponto de acúmulo.
 * 3. Base Fundiária e Pericial Real:
 *    Os dados cadastrais e espaciais reais de cada sítio ficam em arquivo local
 *    (`data/sitios_referencia_local.json`), preservando a privacidade fundiária (LGPD)
 *    enquanto asseguram a autenticidade pericial das missões de validação.
 */

export interface CompartimentoTopoSequencial {
  nome: 'topo_estavel' | 'encosta_escoamento' | 'baixada_deposicao';
  descricao: string;
  declividadeTipicaPct: string;
  processoPredominante: string;
}

export interface SitioPadraoOuro {
  id: string;
  identificadorOpaco: string;
  nomeIdentificador: string;
  municipio: 'Ceu Azul' | 'Medianeira';
  baciaHidrografica: string;
  areaHa: number;
  altitudeMediaM: number;
  resolucaoVantGsdCm: number;
  resolucaoGradeSateliteM: number;
  totalPixels10mEstimados: number;
  papelConjunto: 'held-out';
  vantModelo?: string;
  fabricanteVant?: string;
  sensorTipo?: string;
  bandasMultiespectrais?: ("blue" | "green" | "red" | "rededge" | "nir")[];
  georreferenciamento?: string;
  calibracaoRadiometrica?: string;
  compartimentos?: CompartimentoTopoSequencial[];
  properties?: SitioPadraoOuro;
}

export type SitioPadraoOuroProperties = SitioPadraoOuro;

export const COMPARTIMENTOS_PADRAO: CompartimentoTopoSequencial[] = [
  {
    nome: 'topo_estavel',
    descricao: 'Divisor de águas com declividade suave, área de baixa energia erosiva e infiltração.',
    declividadeTipicaPct: '2% a 6%',
    processoPredominante: 'Infiltração e escoamento laminar incipiente',
  },
  {
    nome: 'encosta_escoamento',
    descricao: 'Meia encosta com aceleração do escoamento superficial concentrado e arraste de partículas.',
    declividadeTipicaPct: '8% a 18%',
    processoPredominante: 'Cisalhamento hidráulico e desprendimento por salpico/escoamento',
  },
  {
    nome: 'baixada_deposicao',
    descricao: 'Baixada e sopé de encosta com desaceleração do fluxo e acúmulo de sedimentos coluviais.',
    declividadeTipicaPct: '1% a 5%',
    processoPredominante: 'Sedimentação coluvial e convergência de umidade',
  },
];

const SITIO_1_DADOS: SitioPadraoOuro = {
  id: "sitio-ouro-01",
  identificadorOpaco: "CAR-OPACO-01",
  nomeIdentificador: "Sitio Alfa (Medianeira)",
  municipio: "Medianeira",
  baciaHidrografica: "Bacia Hidrográfica do Paraná 3",
  areaHa: 49.94,
  altitudeMediaM: 395,
  resolucaoVantGsdCm: 7.5,
  resolucaoGradeSateliteM: 10,
  totalPixels10mEstimados: 4994,
  papelConjunto: "held-out",
  vantModelo: "Spectral 2 (Nuvem UAV)",
  fabricanteVant: "Nuvem UAV",
  sensorTipo: "Multiespectral 5 bandas (Azul, Verde, Vermelho, RedEdge, NIR)",
  bandasMultiespectrais: ["blue", "green", "red", "rededge", "nir"],
  georreferenciamento: "PPK/RTK centimétrico",
  calibracaoRadiometrica: "Sensor DLS + Painel de Reflectância Difusa",
};
SITIO_1_DADOS.properties = SITIO_1_DADOS;

const SITIO_2_DADOS: SitioPadraoOuro = {
  id: "sitio-ouro-02",
  identificadorOpaco: "CAR-OPACO-02",
  nomeIdentificador: "Sitio Beta (Medianeira)",
  municipio: "Medianeira",
  baciaHidrografica: "Bacia Hidrográfica do Paraná 3",
  areaHa: 49.54,
  altitudeMediaM: 410,
  resolucaoVantGsdCm: 7.5,
  resolucaoGradeSateliteM: 10,
  totalPixels10mEstimados: 4954,
  papelConjunto: "held-out",
  vantModelo: "Spectral 2 (Nuvem UAV)",
  fabricanteVant: "Nuvem UAV",
  sensorTipo: "Multiespectral 5 bandas (Azul, Verde, Vermelho, RedEdge, NIR)",
  bandasMultiespectrais: ["blue", "green", "red", "rededge", "nir"],
  georreferenciamento: "PPK/RTK centimétrico",
  calibracaoRadiometrica: "Sensor DLS + Painel de Reflectância Difusa",
};
SITIO_2_DADOS.properties = SITIO_2_DADOS;

const SITIO_3_DADOS: SitioPadraoOuro = {
  id: "sitio-ouro-03",
  identificadorOpaco: "CAR-OPACO-03",
  nomeIdentificador: "Sitio Gama (Ceu Azul)",
  municipio: "Ceu Azul",
  baciaHidrografica: "Bacia Hidrográfica do Paraná 3",
  areaHa: 49.54,
  altitudeMediaM: 580,
  resolucaoVantGsdCm: 7.5,
  resolucaoGradeSateliteM: 10,
  totalPixels10mEstimados: 4954,
  papelConjunto: "held-out",
  vantModelo: "Spectral 2 (Nuvem UAV)",
  fabricanteVant: "Nuvem UAV",
  sensorTipo: "Multiespectral 5 bandas (Azul, Verde, Vermelho, RedEdge, NIR)",
  bandasMultiespectrais: ["blue", "green", "red", "rededge", "nir"],
  georreferenciamento: "PPK/RTK centimétrico",
  calibracaoRadiometrica: "Sensor DLS + Painel de Reflectância Difusa",
};
SITIO_3_DADOS.properties = SITIO_3_DADOS;

const SITIO_4_DADOS: SitioPadraoOuro = {
  id: "sitio-ouro-04",
  identificadorOpaco: "CAR-OPACO-04",
  nomeIdentificador: "Sitio Delta (Ceu Azul)",
  municipio: "Ceu Azul",
  baciaHidrografica: "Bacia Hidrográfica do Paraná 3",
  areaHa: 49.54,
  altitudeMediaM: 575,
  resolucaoVantGsdCm: 7.5,
  resolucaoGradeSateliteM: 10,
  totalPixels10mEstimados: 4954,
  papelConjunto: "held-out",
  vantModelo: "Spectral 2 (Nuvem UAV)",
  fabricanteVant: "Nuvem UAV",
  sensorTipo: "Multiespectral 5 bandas (Azul, Verde, Vermelho, RedEdge, NIR)",
  bandasMultiespectrais: ["blue", "green", "red", "rededge", "nir"],
  georreferenciamento: "PPK/RTK centimétrico",
  calibracaoRadiometrica: "Sensor DLS + Painel de Reflectância Difusa",
};
SITIO_4_DADOS.properties = SITIO_4_DADOS;

export const SITIOS_PADRAO_OURO: SitioPadraoOuro[] = [
  SITIO_1_DADOS,
  SITIO_2_DADOS,
  SITIO_3_DADOS,
  SITIO_4_DADOS,
];
