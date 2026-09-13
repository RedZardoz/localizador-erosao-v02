/**
 * Sítios de Referência Padrão-Ouro (VANT/Drone) — SAREL (PPGTCA 2026)
 *
 * ESPECIFICAÇÃO METODOLÓGICA (SEÇÃO 3.2 DO PDF):
 * - Polígonos contínuos de 10 a 50 hectares em propriedades agrícolas estratégicas
 *   nos municípios de Céu Azul e Medianeira (Bacia Hidrográfica do Paraná 3).
 * - Cobertura do gradiente topo-sequencial completo:
 *   1. Topo estável (divisor de águas)
 *   2. Encosta de escoamento (zona crítica de transporte/erosão)
 *   3. Baixada de deposição de colúvio
 * - Resolução do VANT/Drone: GSD de 5 a 10 cm, sobreposta à grade de 10 m do satélite.
 * - Papel no sistema: Conjunto estritamente HELD-OUT (validação cega e calibração).
 */

export interface CompartimentoTopoSequencial {
  nome: 'topo_estavel' | 'encosta_escoamento' | 'baixada_deposicao';
  descricao: string;
  declividadeTipicaPct: string;
  processoPredominante: string;
}

export interface SitioPadraoOuroProperties {
  id: string;
  codigoCar: string;
  nomeIdentificador: string;
  municipio: 'Ceu Azul' | 'Medianeira';
  baciaHidrografica: string;
  areaHa: number;
  altitudeMediaM: number;
  resolucaoVantGsdCm: number;
  resolucaoGradeSateliteM: number;
  totalPixels10mEstimados: number;
  papelConjunto: 'held-out';
  compartimentos?: CompartimentoTopoSequencial[];
}

export interface SitioPadraoOuroFeature {
  type: 'Feature';
  id: string;
  bbox: [number, number, number, number];
  properties: SitioPadraoOuroProperties;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

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

export const SITIOS_PADRAO_OURO: SitioPadraoOuroFeature[] = [
  {
    "type": "Feature",
    "id": "sitio-ouro-01",
    "bbox": [
      -54.02623450425946,
      -25.30225378144709,
      -54.01537394435227,
      -25.29493242609618
    ],
    "properties": {
      "id": "sitio-ouro-01",
      "codigoCar": "PR-4115804-63E945FC816944DA84D2DB2C9C3AF6F3",
      "nomeIdentificador": "Sitio Alfa (Medianeira)",
      "municipio": "Medianeira",
      "baciaHidrografica": "Bacia do Rio Piquiri / Parana 3",
      "areaHa": 49.94,
      "altitudeMediaM": 395,
      "resolucaoVantGsdCm": 7.5,
      "resolucaoGradeSateliteM": 10,
      "totalPixels10mEstimados": 4994,
      "papelConjunto": "held-out"
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            -54.02620109937277,
            -25.29572656751262
          ],
          [
            -54.02475056911645,
            -25.29556654655146
          ],
          [
            -54.02358360540967,
            -25.29544715788163
          ],
          [
            -54.02197780636144,
            -25.29528911700131
          ],
          [
            -54.02051000608794,
            -25.29512157779601
          ],
          [
            -54.0188889009851,
            -25.29493242609618
          ],
          [
            -54.01868861610146,
            -25.29494849552398
          ],
          [
            -54.01861195328548,
            -25.29499882638542
          ],
          [
            -54.01854423188306,
            -25.29510961120609
          ],
          [
            -54.01849693702346,
            -25.29528604496213
          ],
          [
            -54.01843450837646,
            -25.29539549312549
          ],
          [
            -54.01822945321228,
            -25.29555772685809
          ],
          [
            -54.01813142409165,
            -25.29560103837202
          ],
          [
            -54.01804090042172,
            -25.29560940254185
          ],
          [
            -54.0178747396819,
            -25.29558158806728
          ],
          [
            -54.01780000363924,
            -25.29556130800941
          ],
          [
            -54.01765557805511,
            -25.29551327066546
          ],
          [
            -54.01737222700748,
            -25.29542768324568
          ],
          [
            -54.01706249334722,
            -25.29538189370035
          ],
          [
            -54.01706560227597,
            -25.29546162894422
          ],
          [
            -54.01699668601192,
            -25.29558465990226
          ],
          [
            -54.01693723963971,
            -25.29585188817454
          ],
          [
            -54.01687533706474,
            -25.29594384175179
          ],
          [
            -54.01688311571366,
            -25.29618545230428
          ],
          [
            -54.01682834716168,
            -25.29652910899151
          ],
          [
            -54.01698999786699,
            -25.2966559952149
          ],
          [
            -54.01684033986758,
            -25.29682963420913
          ],
          [
            -54.01680979898396,
            -25.29690543998107
          ],
          [
            -54.01537394435227,
            -25.30184049400296
          ],
          [
            -54.01574947482077,
            -25.30198046651642
          ],
          [
            -54.01575448806092,
            -25.30225378144709
          ],
          [
            -54.02125333920015,
            -25.30064654821947
          ],
          [
            -54.02107892581171,
            -25.29955602989232
          ],
          [
            -54.02106290040812,
            -25.29945645368667
          ],
          [
            -54.02109724142293,
            -25.29943621475031
          ],
          [
            -54.02128093426719,
            -25.29923447613461
          ],
          [
            -54.0214572805082,
            -25.29905713111394
          ],
          [
            -54.02160867726851,
            -25.29887314595283
          ],
          [
            -54.0216620946109,
            -25.29881557658767
          ],
          [
            -54.02174402366675,
            -25.29874477838469
          ],
          [
            -54.02180360685766,
            -25.29870294325681
          ],
          [
            -54.02185883821336,
            -25.29866047877117
          ],
          [
            -54.02197919473363,
            -25.29858901339796
          ],
          [
            -54.02204854831475,
            -25.29855351121446
          ],
          [
            -54.02217430115311,
            -25.29850895284242
          ],
          [
            -54.0223073244568,
            -25.29847554925878
          ],
          [
            -54.02242722401576,
            -25.29843493269774
          ],
          [
            -54.0224878274825,
            -25.29840412586445
          ],
          [
            -54.02254569064331,
            -25.2983757900558
          ],
          [
            -54.02262907169024,
            -25.29831052463033
          ],
          [
            -54.02272894281121,
            -25.29822032809948
          ],
          [
            -54.02280164926733,
            -25.29813698146264
          ],
          [
            -54.02287908217544,
            -25.29805517394404
          ],
          [
            -54.02294767689319,
            -25.29799791067537
          ],
          [
            -54.0230345582806,
            -25.29794372368954
          ],
          [
            -54.02306516625619,
            -25.2979299955671
          ],
          [
            -54.0262174959878,
            -25.29842873309552
          ],
          [
            -54.02623450425946,
            -25.29843133208009
          ],
          [
            -54.02620170658797,
            -25.29576267160461
          ],
          [
            -54.02620109937277,
            -25.29572656751262
          ]
        ]
      ]
    }
  },
  {
    "type": "Feature",
    "id": "sitio-ouro-02",
    "bbox": [
      -54.09019947052002,
      -25.255428294377772,
      -54.0791916847229,
      -25.247529537251022
    ],
    "properties": {
      "id": "sitio-ouro-02",
      "codigoCar": "PR-4115804-4ACF9DE20F19462B89232E3E54565B6E",
      "nomeIdentificador": "Sitio Beta (Medianeira)",
      "municipio": "Medianeira",
      "baciaHidrografica": "Bacia do Rio Piquiri / Parana 3",
      "areaHa": 49.54,
      "altitudeMediaM": 410,
      "resolucaoVantGsdCm": 7.5,
      "resolucaoGradeSateliteM": 10,
      "totalPixels10mEstimados": 4954,
      "papelConjunto": "held-out"
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            -54.0791916847229,
            -25.247529537251022
          ],
          [
            -54.079599380493164,
            -25.250654168422987
          ],
          [
            -54.07972812652588,
            -25.25127520355397
          ],
          [
            -54.08052206039429,
            -25.251760385040946
          ],
          [
            -54.081315994262695,
            -25.253138289897098
          ],
          [
            -54.08172369003295,
            -25.25391456743963
          ],
          [
            -54.08217430114746,
            -25.255137194508666
          ],
          [
            -54.08316135406494,
            -25.255428294377772
          ],
          [
            -54.08466339111328,
            -25.253371173680794
          ],
          [
            -54.09019947052002,
            -25.25251726429109
          ],
          [
            -54.09002279293748,
            -25.2519197043846
          ],
          [
            -54.09006911121275,
            -25.25156294255201
          ],
          [
            -54.09002705719808,
            -25.25119432139805
          ],
          [
            -54.08990359832293,
            -25.25105431225552
          ],
          [
            -54.08982317528741,
            -25.2508835828781
          ],
          [
            -54.08986423889608,
            -25.25069835098442
          ],
          [
            -54.08977624961148,
            -25.25057077125639
          ],
          [
            -54.08978302419582,
            -25.25041536212901
          ],
          [
            -54.08974885940552,
            -25.24972260977363
          ],
          [
            -54.083333015441895,
            -25.2502854273118
          ],
          [
            -54.083569049835205,
            -25.24966438712087
          ],
          [
            -54.084041118621826,
            -25.248985120776872
          ],
          [
            -54.08414840698242,
            -25.24834466617397
          ],
          [
            -54.08434152603149,
            -25.248092364948874
          ],
          [
            -54.0791916847229,
            -25.247529537251022
          ]
        ]
      ]
    }
  },
  {
    "type": "Feature",
    "id": "sitio-ouro-03",
    "bbox": [
      -53.93433094024658,
      -25.109404336104774,
      -53.92808268144833,
      -25.101357295186386
    ],
    "properties": {
      "id": "sitio-ouro-03",
      "codigoCar": "PR-4105300-DD634A8A94FB403B8C5492F9BF22EF5B",
      "nomeIdentificador": "Sitio Gama (Ceu Azul)",
      "municipio": "Ceu Azul",
      "baciaHidrografica": "Bacia do Rio Piquiri / Parana 3",
      "areaHa": 49.54,
      "altitudeMediaM": 580,
      "resolucaoVantGsdCm": 7.5,
      "resolucaoGradeSateliteM": 10,
      "totalPixels10mEstimados": 4954,
      "papelConjunto": "held-out"
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            -53.92809394017208,
            -25.101357295186386
          ],
          [
            -53.92809394017208,
            -25.101357295186386
          ],
          [
            -53.92809394017208,
            -25.101357295186386
          ],
          [
            -53.92808268144833,
            -25.109404336104774
          ],
          [
            -53.92848832522306,
            -25.109268416225827
          ],
          [
            -53.9288926546812,
            -25.109054581214636
          ],
          [
            -53.92892360687256,
            -25.1090142474522
          ],
          [
            -53.92894506454468,
            -25.10897538751387
          ],
          [
            -53.92892360687256,
            -25.10897538751387
          ],
          [
            -53.92896652221679,
            -25.108955957540076
          ],
          [
            -53.929009437561035,
            -25.108955957540076
          ],
          [
            -53.928987979888916,
            -25.10893652756319
          ],
          [
            -53.928987979888916,
            -25.108917097583216
          ],
          [
            -53.92905235290527,
            -25.108897667600164
          ],
          [
            -53.92919678546336,
            -25.10871332935554
          ],
          [
            -53.92935276031494,
            -25.108528497335367
          ],
          [
            -53.929502964019775,
            -25.10843134708043
          ],
          [
            -53.93430948257446,
            -25.108470207191672
          ],
          [
            -53.93433094024658,
            -25.101591775136097
          ],
          [
            -53.92809394017208,
            -25.101357295186386
          ]
        ]
      ]
    }
  },
  {
    "type": "Feature",
    "id": "sitio-ouro-04",
    "bbox": [
      -53.93441677093506,
      -25.10942227605891,
      -53.92806529998779,
      -25.101339169983937
    ],
    "properties": {
      "id": "sitio-ouro-04",
      "codigoCar": "PR-4105300-DED72F1D0CA84A9AA5413B121592E6C0",
      "nomeIdentificador": "Sitio Delta (Ceu Azul)",
      "municipio": "Ceu Azul",
      "baciaHidrografica": "Bacia do Rio Piquiri / Parana 3",
      "areaHa": 49.54,
      "altitudeMediaM": 575,
      "resolucaoVantGsdCm": 7.5,
      "resolucaoGradeSateliteM": 10,
      "totalPixels10mEstimados": 4954,
      "papelConjunto": "held-out"
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            -53.93433094024658,
            -25.101552912838958
          ],
          [
            -53.92806529998779,
            -25.101339169983937
          ],
          [
            -53.92817258834839,
            -25.10942227605891
          ],
          [
            -53.92855896115352,
            -25.10927140570917
          ],
          [
            -53.92879486083984,
            -25.109169687081994
          ],
          [
            -53.928816318511956,
            -25.109169687081994
          ],
          [
            -53.92879486083984,
            -25.10918911702182
          ],
          [
            -53.92883777618408,
            -25.10918911702182
          ],
          [
            -53.92883777618408,
            -25.10915025713908
          ],
          [
            -53.92888069152832,
            -25.109130827193074
          ],
          [
            -53.92894506454468,
            -25.109111397243975
          ],
          [
            -53.929009437561035,
            -25.1090142474522
          ],
          [
            -53.92922925173488,
            -25.10877921623873
          ],
          [
            -53.929524421691895,
            -25.108353626820882
          ],
          [
            -53.93441677093506,
            -25.108392486956834
          ],
          [
            -53.93433094024658,
            -25.101552912838958
          ]
        ]
      ]
    }
  }
];

export const SITIOS_PADRAO_OURO_GEOJSON: GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  SitioPadraoOuroProperties
> = {
  type: 'FeatureCollection',
  features: SITIOS_PADRAO_OURO as any,
};
