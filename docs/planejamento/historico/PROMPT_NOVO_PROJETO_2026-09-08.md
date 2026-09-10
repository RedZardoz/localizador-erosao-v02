# Prompt de Início — Sistema de Amostragem e Rotulagem para Predição de Erosão Laminar

> **Como usar:** cole este documento inteiro como primeira mensagem de uma sessão nova, em um diretório vazio. Ele é autocontido.
>
> **Documentos de apoio** (leia antes de escrever a primeira linha, se estiverem disponíveis):
> `PLANEJAMENTO_PESQUISA_v3_2026-09-08.md` — fundamentação metodológica e referências
> `Relatorio_Auditoria_Tabela_Consolidada_2026-09-08.txt` — os defeitos da versão anterior, com evidência
> `src/lib/embrapa/embrapaSoilClient.ts` — implementação de referência já verificada

---

# PARTE I — CONTEXTO

## 1. O que este sistema é

Instrumento computacional de uma dissertação de mestrado do PPGTCA. Objetivo da pesquisa: **validar um método de localização e predição de erosão laminar** usando séries temporais multiespectrais, terreno, solo e regime de chuvas, com classificador supervisionado (XGBoost).

O sistema **não** classifica erosão. Ele faz três coisas:

1. **Propõe onde observar** — desenho de amostragem estratificado e espacialmente disperso.
2. **Extrai features verificáveis** — de fontes públicas legítimas, com proveniência por variável.
3. **Gerencia a campanha de rotulagem** — exporta plano de campo, ingere rótulos observados, monta a matriz de treino.

O rótulo vem **exclusivamente de observação humana** (interpretação de imagem, campo, drone). O modelo é treinado fora deste sistema.

## 2. Por que o rigor importa aqui

O produto será citado como resultado em dissertação submetida a banca, e a planilha exportada **nomeia proprietários rurais** ao associar focos a imóveis do CAR/SNCR. Um número errado não é bug de UI — é afirmação falsa sobre um resultado científico ou sobre uma pessoa identificável.

Existiu uma versão anterior deste sistema. Ela foi auditada e **reprovada por veracidade**: 13 das 54 colunas exportadas apresentavam valores falsos. A Parte II deste documento destila os defeitos encontrados em regras. **Não os repita.**

---

# PARTE II — A LEI FUNDAMENTAL

Estas regras têm precedência sobre qualquer conveniência de implementação. Quando houver conflito entre "entregar um número" e "dizer a verdade", diz-se a verdade.

## Regra 1 — Dado verdadeiro ou ausência declarada

> Nunca preencha uma lacuna com constante, média, valor típico ou estimativa não solicitada. Se o dado não existe, o valor é `null` e o motivo é registrado.

**Justificativa técnica.** Os valores alimentam um modelo de árvore. Árvores particionam por limiar e **criam divisões em valor exato**: um conjunto de pixels preenchidos com `bsi = 0.45` forma um agrupamento artificial perfeitamente separável que o modelo aprende como padrão do terreno. O erro não se dilui com mais dados — consolida-se. Além disso, o XGBoost trata ausentes nativamente, aprendendo a direção padrão por nó. **`NaN` é tecnicamente superior a imputar.**

**Defeito real observado:** o importador atribuía declividade 16%, BSI 0,45, NDVI 0,32 e solo "Latossolo Vermelho" quando o arquivo não trazia esses campos. Resultado: 150 de 150 linhas exportadas com valores idênticos, apresentados como medição.

## Regra 2 — Nunca colapsar estados distintos

> "Consultado e não há" ≠ "não foi possível consultar" ≠ "fora da área de cobertura". Três estados, três respostas.

**Defeito real observado:** qualquer falha da consulta fundiária — erro de banco, timeout, coordenada inválida — virava `sem-correspondencia`, e a planilha afirmava *"Sem correspondência — nenhum imóvel nesta coordenada"*. Afirmação positiva de ausência gerada por falha técnica. Consequência prática: planejar visita de campo a uma propriedade sem procurar autorização de ninguém.

**Implementação obrigatória:** todo cliente de dado externo retorna um `status` de enumeração fechada, e nenhum `catch` pode produzir um status que afirme algo sobre o território.

```ts
// CORRETO
catch (err) {
  return { status: "servico-indisponivel", motivo: `Falha: ${msg}. Nada se afirma.` };
}
// PROIBIDO
catch { return { status: "sem-correspondencia" }; }   // afirma inexistência a partir de falha
catch { return {}; }                                   // silencia e o chamador inventa o default
```

## Regra 3 — Proveniência viaja junto com o valor

> Não existe número solto no sistema. Todo valor científico carrega de onde veio.

**Justificativa.** Na versão anterior, valor e origem trafegavam separados: o número em `ErosionPoint.bsi`, a origem talvez em `estimatedFields`, talvez em `diagnostics`, talvez em lugar nenhum. Quatro rotas de código preenchiam os mesmos campos com regras diferentes, e as quatro divergiram. Enquanto forem separados, voltarão a divergir.

**Tipo obrigatório** (defina em `src/types/proveniencia.ts` e use em todas as variáveis científicas):

```ts
export type Proveniencia<T> =
  | { estado: "medido";        valor: T; fonte: string; adquiridoEm: string; detalhe?: string }
  | { estado: "modelado";      valor: T; modelo: string; insumos: string[] }
  | { estado: "tabelado";      valor: T; tabela: string; chave: string }
  | { estado: "indisponivel";  motivo: string };

export function valorOuNulo<T>(p: Proveniencia<T> | undefined): T | null {
  return p && p.estado !== "indisponivel" ? p.valor : null;
}
export function ehMedido(p: Proveniencia<unknown> | undefined): boolean {
  return p?.estado === "medido";
}
```

**Consequência:** a coluna "Campos_Estimados" da planilha deixa de ser preenchida à mão e passa a ser **derivada** — é a lista dos campos cujo `estado !== "medido"`. Torna-se estruturalmente impossível exportar um valor sem dizer de onde veio.

## Regra 4 — Nada calculado pelo sistema pode virar rótulo

> Severidade, score, perda de solo e tipologia são **critérios internos de amostragem**. Nunca saem como resultado, nunca entram na matriz de treino.

**Justificativa.** Na versão anterior, `severity` era função determinística de quatro variáveis brutas via `Φ = declividade×0,40 + BSI×50 + Ψ_solo`. Treinar com essas features e esse rótulo reconstruiria os limiares 28,0 e 48,0 com acurácia quase perfeita **sem aprender nada sobre erosão**. É vazamento de alvo em forma pura, e o pior é que parece sucesso.

## Regra 5 — Zero é um valor

> Use verificação explícita de nulidade. Nunca `||` para default numérico.

```ts
// PROIBIDO — declividade 0% legítima vira 16
const slope = parseFloat(props.slope || props.declividade || 16);
// CORRETO
const bruto = props.slope ?? props.declividade;
const slope = bruto === undefined || bruto === null || bruto === "" ? null : Number(bruto);
```

**Defeito real observado:** entrada `{slope: 0, bsi: 0}` produzia `16` e `0,45`, e ainda assim **não** era marcada como estimada — porque a checagem de presença considerava `0` presente enquanto a leitura do valor o considerava ausente.

## Regra 6 — Respeitar as fontes legítimas

> Só entram no caminho analítico fontes com calibração radiométrica documentada, data de aquisição por observação e termos de uso compatíveis com pesquisa.

- **Permitido no cálculo:** Sentinel-1/2, Landsat, Copernicus DEM, ESA WorldCover, CHIRPS, GPM IMERG (via Earth Engine); cartas da Embrapa GeoInfo; PlanetScope (licença acadêmica); SICAR/SIGEF/SNCR.
- **Proibido no cálculo:** basemaps visuais (Mapbox Satellite, Google, Bing). São mosaicos RGB sem calibração e sem data por pixel. Servem para navegação e contexto visual, jamais para extrair feature ou para fotointerpretação com âncora temporal.
- **Nunca** invente dado de satélite, nem use `unmask()` com constante sobre banda física (ver Regra 7).

## Regra 7 — Preservar o mascaramento do Earth Engine

> Máscara de nuvem existe para remover pixel inválido. Não a desfaça.

**Defeito real observado:** o pipeline aplicava `maskS2Clouds()` e, na linha seguinte, `.unmask(0.0)` no BSI e `.unmask(0.5)` no NDVI. Como `stratifiedSample` roda com `dropNulls: true`, o `unmask` **impedia** o descarte: pixels de nuvem eram amostrados com valores fabricados que seguiam para severidade, score e perda de solo.

```ts
// PROIBIDO
const bsi = expressao.unmask(0.0).rename("BSI");
// CORRETO — pixel sem dado é descartado pelo dropNulls
const bsi = expressao.rename("BSI");
```

Se a amostra ficar pequena, amplie a janela temporal ou o número de cenas. **Nunca** reponha constante.

## Regra 8 — Verificar antes de afirmar

> Não declare que algo funciona sem ter executado. Não invente esquema de API, nome de campo ou valor de retorno.

Antes de integrar qualquer serviço externo: consulte o `GetCapabilities`/documentação, execute uma consulta real, e registre o esquema observado em comentário no código com a data da verificação. Se não puder verificar, diga que não verificou.

---

# PARTE III — ARQUITETURA

## 3. Stack

Mantenha a stack da versão anterior — ela funcionava bem e não foi fonte de nenhum defeito:

```
Next.js 14 (App Router) · TypeScript (strict) · React 18
Zustand (estado) · Tailwind · MapLibre GL (mapa)
Vitest (testes) · Zod (validação de entrada)
```

Node ≥ 18.17. Execução **local**: as rotas que tocam base fundiária e credenciais devem recusar requisição não-local.

## 4. Estrutura de diretórios

```
src/
  types/
    proveniencia.ts        Proveniencia<T> e utilitários (Regra 3)
    ponto.ts               PontoAmostral, Rotulo, Bloco espacial
  lib/
    gee/
      auth.ts              Service Account, sessão efêmera
      client.ts            init + helpers de reduceRegion
      serieTemporal.ts     extração da série multibanda
      harmonicos.ts        compressão por regressão harmônica
      compostoSoloNu.ts    composto de solo exposto
      elegibilidade.ts     máscara (uso, declividade, água, urbano, cobertura temporal)
      estratificacao.ts    estratos e amostragem por quantis
      terreno.ts           declividade em projeção métrica, curvatura, TWI
    embrapa/
      soilClient.ts        cópia verificada de embrapaSoilClient.ts
    chuva/
      chirps.ts            eventos diários
      imerg.ts             intensidade sub-horária, aproximação do I30
      eventos.ts           detecção e caracterização de evento erosivo
    planet/
      dataApi.ts           busca no catálogo + leitura de UDM2
      ordersApi.ts         pedido com clipping e harmonização
      paresEvento.ts       montagem retrospectiva de pares
    fundiario/
      matcher.ts           consulta local SICAR/SIGEF/SNCR
    rusle/
      *.ts                 LINHA DE BASE de comparação (ver §7)
    matriz/
      montagem.ts          matriz de treino com proveniência
      invariantes.ts       validação do artefato exportado
    export/
      planilha.ts          exportação XLSX/CSV
      xlsxWriter.ts        escritor próprio (reaproveitar)
  app/api/...              rotas
  components/...           UI (Parte VI)
```

## 5. Modelo de dados

```ts
export interface PontoAmostral {
  id: string;                    // estável, gerado uma vez
  codigo: string;                // legível: "PR-2026-0001"
  latitude: number;              // EPSG:4326
  longitude: number;
  blocoEspacial: string;         // para validação cruzada espacial

  // Estrato amostral (critério interno, NUNCA feature nem rótulo)
  estratoId: string;
  criterioSelecao: { quantilPhi: number; phi: number };

  // Variáveis científicas — TODAS com proveniência
  terreno: {
    elevacao: Proveniencia<number>;
    declividadePct: Proveniencia<number>;
    declividadeGraus: Proveniencia<number>;
    curvaturaPerfil: Proveniencia<number>;
    curvaturaPlana: Proveniencia<number>;
    acumuloFluxo: Proveniencia<number>;
    twi: Proveniencia<number>;
  };
  solo: {
    ordem: Proveniencia<string>;
    subOrdem: Proveniencia<string>;
    grandeGrupo: Proveniencia<string>;      // distrófico/eutrófico LEVANTADO
    tipoUnidade: Proveniencia<string>;      // simples | associacao
    confiancaPedologica: "alta" | "media" | "indisponivel";
    erodibilidadeClasse: Proveniencia<string>;  // CATEGÓRICA, nunca numérica
  };
  serie: {
    janela: { inicio: string; fim: string };
    nObservacoesValidas: number;
    harmonicos: Record<string, Proveniencia<number>>;  // "B12_amplitude", "B12_tendencia", ...
    frequenciaSoloNu: Proveniencia<number>;
    compostoSoloNu: Record<string, Proveniencia<number>>;
  };
  chuva: {
    precipAcum30d: Proveniencia<number>;
    precipAcum90d: Proveniencia<number>;
    i30Max: Proveniencia<number>;
    nEventosErosivos: Proveniencia<number>;
    indiceMecanismo: Proveniencia<number>;   // Σ(erosividade_t × soloNu_t)
  };

  // Rótulo — SEMPRE de observação, nunca de cálculo
  rotulo?: {
    classe: "ausente" | "incipiente" | "moderada" | "severa";
    modalidade: "interpretacao-visual" | "campo" | "drone";
    observador: string;
    observadoEm: string;
    confianca?: "alta" | "media" | "baixa";
    observacoes?: string;
    cego: boolean;              // o observador desconhecia qualquer predição
  };

  // Contexto fundiário — acesso e autorização, NUNCA feature
  fundiario?: {
    status: "encontrado" | "aproximado" | "sem-correspondencia"
          | "base-nao-disponivel" | "erro-na-consulta";
    motivo?: string;
    codigoCar?: string;
    titularMascarado?: string;
    consultadoEm?: string;
    criterioAssociacao?: string;
  };
}
```

**Nota sobre `Proveniencia` no estado do React:** o tipo é serializável; use-o direto no Zustand. Não crie um "espelho plano" do ponto para conveniência da UI — foi assim que a versão anterior perdeu a origem dos valores.

---

# PARTE IV — FÓRMULAS: ATENÇÃO MÁXIMA

Toda fórmula abaixo entra **acompanhada da referência**, em docstring, e **com teste unitário que verifica o comportamento, não só o cálculo**.

## 6. Declividade — corrigir o erro de projeção

**Defeito real observado:** `setDefaultProjection("EPSG:3857")`. Web Mercator é conforme mas **não preserva escala** — o fator varia com 1/cos(latitude). No Paraná (~24–26° S) isso dá ≈ 1,10: a distância horizontal fica inflada ~10% e a declividade **subestimada** sistematicamente.

```ts
// CORRETO — projeção métrica local
const dem = ee.ImageCollection("COPERNICUS/DEM/GLO30").select("DEM").mosaic()
  .setDefaultProjection("EPSG:31982", null, 30);   // UTM 22S, Paraná
const slopeDeg = ee.Terrain.slope(dem);
```

Se a AOI cruzar fusos, reprojete por fuso ou aplique correção explícita por latitude. **Documente a escolha.**

**Guarda de plausibilidade:** rejeitar valores fora de [0°, 75°], lançando erro explícito. 75° ≈ 373% já é escarpa rochosa extrema; valores próximos de 90° indicam bug de projeção.

## 7. RUSLE — é LINHA DE BASE, e precisa estar correta

A RUSLE não é o produto. Ela existe para responder *"o modelo supervisionado supera a prática estabelecida?"*. Uma linha de base incorreta invalida a comparação.

**A = R · K · LS · C · P** (Renard et al., 1997)

### 7.1 Fator C — ATENÇÃO: a fórmula anterior era invertida

A versão anterior usava `C = ((1 − NDVI)/2)^(1 + BSI)`. Como a base é sempre menor que 1, **elevar a expoente menor produz resultado maior** — BSI negativo (solo coberto) *aumenta* C. Verificado numericamente, com NDVI fixo em 0,70:

| BSI | C obtido | C esperado fisicamente |
|---|---|---|
| −0,9 | **0,8272** | próximo de 0 |
| 0,0 | 0,1500 | intermediário |
| +0,9 | **0,0272** | próximo de 1 |

Efeito: pixel vegetado (NDVI 0,85 / BSI −0,70) recebia C = 0,4597 contra 0,3019 do solo nu — perda 52% **maior** na vegetação.

> **INSTRUÇÃO:** não escolha a fórmula por conta própria. Apresente ao pesquisador as alternativas documentadas — Durigon et al. (2014), forma exponencial de van der Knijff et al. (2000), ou C derivado só de NDVI — com a demonstração numérica acima, e **aguarde a decisão**. Ao implementar, altere **em conjunto** código, docstring, README e testes.

**Teste obrigatório, qualquer que seja a forma escolhida:**

```ts
it("C cresce monotonicamente com o BSI, mantendo o NDVI fixo", () => {
  const cs = [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9].map(b => calcularFatorC(0.70, b));
  for (let i = 1; i < cs.length; i++) expect(cs[i]).toBeGreaterThanOrEqual(cs[i - 1]);
});
```

### 7.2 Demais fatores

| Fator | Forma | Referência | Cuidado |
|---|---|---|---|
| **R** | EI30 acumulado | Wischmeier & Smith (1978) | Usar IMERG para a intensidade. Climatologia mensal **não** contém I30 |
| **K** | classe da Embrapa | Santos et al. (2018) | É **categórica**. Não converter em número sem respaldo documental da Embrapa |
| **LS** | `(As/22,13)^m · (sen β/0,0896)^n` | Desmet & Govers (1996); Moore & Burch (1986) | `As` real do acúmulo de fluxo. **Não** usar constante de 10 m²/m como padrão silencioso |
| **P** | 1,0 quando desconhecido | Renard et al. (1997) | Registrar como `{estado:"tabelado", tabela:"P=1 default"}`, nunca como medido |

### 7.3 Regra de coerência

> `perdaSolo` preenchida se e somente se os cinco fatores preenchidos se e somente se memória de cálculo exibindo a equação. As três condições são **equivalentes**, nunca parciais.

**Defeito real observado:** 150 linhas com `Perda_Solo = 35,2 t/ha/ano` (que era `declividade × 2,2`, regra inventada) ao lado da coluna `RUSLE_Memoria_Calculo` declarando *"Cálculo RUSLE não executado"* e os cinco fatores vazios.

**Nunca crie fórmula que não esteja na literatura.** Se precisar de uma, marque `{estado: "modelado", modelo: "<descrição>"}` e submeta ao pesquisador.

---

# PARTE V — PLANILHA DE EXPORTAÇÃO: ATENÇÃO MÁXIMA

A planilha é o artefato que vai à banca. Trate-a como peça formal.

## 8. Estrutura

**Aba 1 — Dados.** Uma linha por ponto. Cada variável científica ocupa **duas colunas adjacentes**: valor e proveniência.

```
Codigo | Latitude | Longitude | ... | Declividade_Pct | Declividade_Pct_Origem | ...
```

`*_Origem` recebe: `medido (COPERNICUS/DEM/GLO30, 2026-09-08)`, `tabelado (P=1 default)`, `indisponível — <motivo>`.

**Justificativa:** o leitor não precisa cruzar com outra aba para saber se o número é medição. A auditabilidade fica na própria linha.

**Aba 2 — Procedência e Conformidade.** Data de emissão, filtros ativos, janela temporal, **contagem real** de consultas por fonte, e o bloco de fundamentação LGPD.

**Aba 3 — Qualidade do Dado.** Por variável: % medido, % modelado, % tabelado, % indisponível. É o resumo executivo da confiabilidade do conjunto.

## 9. Regras de preenchimento

| Regra | Motivo |
|---|---|
| Célula numérica ausente fica **vazia**, nunca `0` | `0` é valor legítimo de declividade, BSI e área |
| Célula textual ausente recebe **texto explicativo**, nunca vazio | Vazio é ambíguo entre "não consultado" e "não há" |
| Latitude/longitude e a versão em DMS derivam do **mesmo número arredondado** | Na versão anterior a decimal usava `toFixed(6)` e o DMS a precisão plena, gerando divergência |
| DMS trata o *rollover* de 60,0″ | `25° 59' 60.0" S` é notação inválida — produzida pela versão anterior |
| CSV recebe os **mesmos metadados** do XLSX | Na versão anterior o CSV saía sem procedência e **sem o bloco LGPD** |
| Cabeçalho da aba de fontes diz **"disponíveis nesta instalação"** | Dizer "consultadas" quando 148 de 150 linhas registram "não consultado" é falso |
| Nenhum literal de programa em coluna geográfica | A versão anterior exportou `"Custom"` como macrorregião e `"Bacia Local"` como bacia, em 150/150 linhas |

## 10. Invariantes — testes que bloqueiam exportação inválida

Implemente em `src/lib/matriz/invariantes.ts` e execute **antes de gerar o arquivo**. Falha em qualquer um: recusar a exportação com mensagem explícita.

```ts
export const INVARIANTES = [
  // 1. Coerência RUSLE
  "perdaSolo preenchida <=> 5 fatores preenchidos <=> memória com a equação",
  // 2. Escala
  "todo score exportado está dentro da faixa documentada",
  // 3. Proveniência derivada
  "Campos_Estimados lista EXATAMENTE os campos com estado !== 'medido'",
  // 4. Coerência de origem
  "origem = satélite => cena, data de cálculo e versão do motor preenchidas",
  // 5. Afirmação negativa
  "'Sem correspondência' só aparece após consulta bem-sucedida sem match",
  // 6. Lista negra de literais
  "nenhuma coluna geográfica contém 'Custom' | 'Bacia Local' | 'Área Amostral GEE'",
  // 7. DETECTOR DE CONSTANTE DISFARÇADA
  "nenhuma coluna numérica tem valor idêntico em 100% das linhas quando n > 20",
];
```

**O invariante 7 sozinho teria capturado o defeito principal da versão anterior** — 150 linhas com 35,2 t/ha/ano idênticos são impossíveis em dado real. Implemente-o primeiro.

---

# PARTE VI — INTERFACE

A UI existente da versão anterior era boa em navegação e mapa. **Aproveite o que funcionava** e acrescente o que faltava: tornar a proveniência **visível**.

## 11. Princípio de projeto da UI

> Quem olha a tela precisa distinguir, sem clicar, o que é medição e o que não é.

## 12. Telas

### 12.1 Mapa + painel lateral *(evoluir do que existe)*

- MapLibre GL, camadas alternáveis, pontos coloridos por **estrato** (não por severidade — severidade não é resultado).
- Filtros: estrato, faixa de declividade, status de rotulagem, bloco espacial.
- **Novo:** alternador "colorir por completude de dado" — mostra de imediato onde faltam features.

### 12.2 Inspetor de Ponto — a tela central

Ao clicar num ponto, painel com **todas as variáveis**, cada uma com selo de proveniência:

```
┌──────────────────────────────────────────────────────────┐
│  PR-2026-0042        -25,0669 / -53,6880      Estrato A3  │
├──────────────────────────────────────────────────────────┤
│  TERRENO                                                  │
│   Declividade      12,4 %      ● medido   DEM GLO-30      │
│   Curvatura perfil −0,003      ● medido   DEM GLO-30      │
│   TWI               7,81       ◊ modelado  a partir do DEM│
│                                                           │
│  SOLO                                                     │
│   Ordem            NEOSSOLO    ● medido   Embrapa GeoInfo │
│   Grande grupo     Eutrófico   ● medido   levantamento    │
│   Unidade          associação  ⚠ confiança média —        │
│                                  3 solos, carta não       │
│                                  resolve o ponto          │
│   Erodibilidade    Alta        ● medido   (categórica)    │
│                                                           │
│  SÉRIE 2019-2025            412 observações válidas       │
│   [gráfico por banda, com LACUNAS VISÍVEIS COMO LACUNAS]  │
│                                                           │
│  CHUVA                                                    │
│   I30 máx          38,2 mm/h   ● medido   GPM IMERG       │
│   Acum. 90 d      412,0 mm     ● medido   CHIRPS          │
│                                                           │
│  ROTULAGEM                                                │
│   ○ não rotulado                                          │
│                                                           │
│  FUNDIÁRIO (acesso para campo — não é feature)            │
│   CAR   PR-4114609-6332…    Titular  ADAO ********        │
└──────────────────────────────────────────────────────────┘
```

Legenda dos selos: `●` medido · `◊` modelado · `□` tabelado · `○` indisponível.

**Requisito do gráfico de série:** lacuna aparece como **descontinuidade**, jamais como linha interpolada. Interpolar visualmente é mentir na tela.

### 12.3 Painel da Matriz de Treino

Tabela com filtro e ordenação, mais um cabeçalho de diagnóstico:

- total de pontos · rotulados · por modalidade
- **balanço de classes** com a prevalência explícita
- distribuição por estrato e por bloco espacial
- completude por feature (barra de % medido)
- **alerta automático** quando alguma feature tem baixa variância — o detector do invariante 7, na tela

### 12.4 Painel de Campanha

- pontos por estado: a rotular · em campo · rotulado · validado
- por observador e por modalidade
- **exportação de campo em MODO CEGO** — botão destacado, com aviso de que colunas de predição serão omitidas
- roteirização da visita (Mapbox Directions, uso legítimo)

### 12.5 Comparador de Evento

Duas imagens lado a lado (T− e T+), com o evento de chuva marcado numa linha do tempo, valor do I30 e a diferença espectral. Cursor sincronizado entre os painéis.

### 12.6 Relatórios

Três, todos exportáveis:

1. **Relatório de Qualidade do Dado** — completude e proveniência por variável, com gráfico.
2. **Relatório de Amostragem** — como os pontos foram eleitos: frame, estratos, quantis, semente aleatória, versão do motor. É o documento que torna a amostragem **reprodutível por terceiros**.
3. **Dossiê do Ponto** (PDF) — ficha completa de um ponto para anexo de dissertação.

## 13. Credenciais

Manter o padrão anterior, que foi auditado e está correto: setor próprio de configuração, chaves em **sessão de servidor efêmera** referenciada por cookie `httpOnly`, **nunca gravadas em disco**. Planet, GEE Service Account e demais tokens pelo mesmo caminho. Nunca registre chave em log, nunca a inclua em mensagem de erro.

---

# PARTE VII — EXECUÇÃO

## 14. Ordem de construção

```
FASE 1  Fundação
        types/proveniencia.ts + types/ponto.ts
        invariantes.ts com o detector de constante (invariante 7)
        xlsxWriter + planilha com colunas de proveniência
        >> Teste: exportação de conjunto sintético falha nos invariantes certos

FASE 2  Fontes verificadas
        embrapa/soilClient.ts   (copiar a referência já verificada)
        gee/auth + client + terreno (projeção métrica)
        chuva/chirps + imerg
        >> Regra 8: verificar cada serviço ao vivo antes de declarar pronto

FASE 3  Séries e composto
        gee/serieTemporal + harmonicos + compostoSoloNu
        >> Teste: lacuna permanece NaN em todo o percurso

FASE 4  Amostragem
        elegibilidade (+ cobertura temporal mínima)
        estratificacao com amostragem POR QUANTIS
        blocos espaciais
        >> Teste: a amostra cobre toda a faixa de Φ, não só o topo

FASE 5  Planet
        dataApi (busca + UDM2) → ordersApi (clipping) → paresEvento
        >> Antes: script de viabilidade contando pares reais

FASE 6  UI
        Mapa → Inspetor de Ponto → Matriz → Campanha → Relatórios

FASE 7  Linha de base RUSLE
        Só após decisão do pesquisador sobre o Fator C
```

## 15. Disciplina de trabalho

1. **Teste antes de declarar pronto.** Cada módulo com teste que falharia se o defeito estivesse presente. Teste que passaria com o bug não conta.
2. **Verifique serviços ao vivo** e registre o esquema observado, com data, em comentário.
3. **Pergunte quando a decisão for metodológica.** Fórmula do Fator C, definição de rótulo, unidade de predição, domínio de validade: **pare e pergunte**. Não escolha sozinho o que vai para uma dissertação.
4. **Diffs cirúrgicos.** Não reformate arquivo inteiro, não troque biblioteca sem pedir.
5. **Relate com honestidade.** Se algo ficou parcial, diga qual parte. Se não verificou, diga que não verificou. Nunca declare concluído o que não executou.
6. `npx vitest run && npx tsc --noEmit && npx next lint` verdes ao fim de cada fase. **Nunca** desative teste nem afrouxe asserção para fazer passar.

## 16. Critério de conclusão

O sistema está pronto quando:

- todos os invariantes da §10 passam sobre um conjunto **real**, extraído do GEE;
- a aba de Qualidade do Dado mostra, para cada variável, a proveniência efetiva;
- exportar em modo cego produz planilha sem nenhuma coluna de predição;
- nenhuma coluna numérica tem valor idêntico em todas as linhas;
- toda fórmula tem referência em docstring e teste de comportamento;
- o Inspetor de Ponto mostra os selos de proveniência, e as lacunas da série aparecem como lacunas.

---

## 17. Resumo em uma frase

> Construa um sistema que prefere dizer **"não sei, e este é o motivo"** a apresentar um número plausível — porque o número plausível é exatamente o que reprovou a versão anterior, e é exatamente o que uma banca detecta.
