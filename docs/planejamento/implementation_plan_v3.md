# Plano de Implementação v3 — SAREL

**Sistema de Amostragem e Rotulagem para Erosão Laminar** — PPGTCA 2026

**Substitui:** `implementation_plan_v2.md` (08/09/2026), mantido em `docs/planejamento/historico/`.
**Data:** 10/09/2026
**Onde se executa:** repositório `geolocalizacao-erosao-propriedade` (GitHub `RedZardoz/localizador-erosao-v2`), branch `sarel/v2`, criada a partir da tag `legado-pre-sarel`.

**O que muda em relação ao v2**

1. **Onde se constrói.** O SAREL é reconstruído dentro do repositório do Localizador, não em projeto novo. O código antigo entra em quarentena (`legado/`) e volta para `src/` módulo a módulo, revisado e testado (§4, §5, Apêndice A).
2. **O que fazer com o SAREL 1.** O protótipo da pasta `08 - SAREL 1` foi avaliado em 10/09/2026 (§1.3). Ele não chama o Earth Engine e repete, em código novo, a classe de defeito que reprovou o Localizador. Entra como **rascunho a revisar**, nunca como base aprovada.
3. **Decisões que o v2 deixou abertas ou implícitas** — Fator R, Fator K numérico, limiar de NDVI para solo descoberto, cobertura temporal mínima, Modelo D × P, entre outras — ganham identificador e passam a viver num **Registro de Decisões** que o código consulta (§3).
4. **Mecanismos que tornam o defeito detectável por máquina:** evidência obrigatória para toda afirmação de "verificado", teste de padrões proibidos, perfis de exportação por lista de permissão, Invariante 7 não evadível (§7.4 a §7.9).
5. **Correções de consistência do v2** (§16).

---

## 0. Como usar este plano

Documentos, na ordem de leitura:

| Documento | Papel |
|---|---|
| `docs/planejamento/PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md` | Lei Fundamental (9 regras), modelo de dados, fórmulas, planilha, UI, disciplina de trabalho |
| **este plano** | o que construir, em que ordem, com que critério de aceite |
| `docs/planejamento/PLANEJAMENTO_PESQUISA_v3_2026-09-08.md` | fundamentação metodológica e referências |
| `docs/planejamento/DECISOES.md` | fonte de verdade das decisões metodológicas (criado na Fase −1 a partir da §3) |
| `docs/planejamento/INVENTARIO_LEGADO.md` | destino e status de cada arquivo do legado e do SAREL 1 (criado na Fase −1 a partir do Apêndice A) |
| `docs/auditorias/Relatorio_Auditoria_Tabela_Consolidada_2026-09-08.txt` | defeitos do Localizador, coluna a coluna, com evidência |
| `docs/auditorias/Relatorio_Auditoria_Projeto_2026-09-08.txt` | auditoria geral do Localizador |
| `docs/planejamento/historico/AUDITORIA_implementation_plan_2026-09-08.md` | por que o plano v1 falhou |

Os caminhos acima já seguem a organização feita na Fase −1 (§5.6). Antes dela, planejamento, prompts e auditorias estão na raiz do repositório, e a auditoria do plano v1 está em `08 - SAREL 1/Fontes de consulta/`.

**Regra que prevalece sobre todas as outras:** quando houver conflito entre entregar um número e dizer a verdade, diz-se a verdade.

**Quando parar e perguntar.** Nos itens marcados 🛑 o agente não decide: apresenta as alternativas, com demonstração numérica quando couber, e aguarda o pesquisador. São decisões de dissertação, não de implementação.

**Ritmo.** Uma fase por sessão. Ao fim de cada fase o agente para e entrega o Relatório de Fase (modelo no prompt, §22). Não existe commit de "implementação completa".

---

## 1. Contexto

### 1.1 O que o sistema é

Instrumento computacional de uma dissertação de mestrado. Objetivo da pesquisa: **validar um método de localização e predição de erosão laminar** com séries temporais multiespectrais, terreno, solo e chuva, usando XGBoost treinado **fora** deste sistema.

O SAREL faz três coisas:

1. **Propõe onde observar** — desenho amostral estratificado e espacialmente disperso.
2. **Extrai features verificáveis** — de fontes legítimas, com proveniência por variável.
3. **Gerencia a campanha de rotulagem** — exporta planos de campo e de interpretação cegos, **ingere rótulos observados** e monta a matriz de treino.

**Não classifica erosão.** O rótulo vem exclusivamente de observação humana.

### 1.2 Duas tentativas, o mesmo defeito

| | Localizador (este repositório) | SAREL 1 (pasta separada) |
|---|---|---|
| Estado | HEAD `ec31669`, auditado em 08/09/2026 | 3 commits entre 08 e 10/09/2026 |
| Testes | 175 verdes (21 arquivos) em 10/09/2026 | 139 verdes (21 arquivos) em 10/09/2026 |
| Tipagem | `tsc` sem erro | `tsc` sem erro |
| Earth Engine | integração real (`@google/earthengine`) | **nenhuma chamada** |
| Veredito | engenharia sólida, **veracidade reprovada**: 13 de 54 colunas falsas; 150/150 linhas com 35,2 t/ha/ano | rascunho que se declara "implementação completa (Fases 1 a 8)" sem dado real |

**Lição que orienta este plano.** Nos dois casos a suíte estava verde e a tipagem limpa com os defeitos presentes. Teste verde não mede veracidade. O que faltava eram verificações que **falham quando o defeito existe** — é isso que as §7.4 a §7.9 acrescentam, e é por isso que o Marco M1 (§10.5) exige dado real antes da Fase 5.

### 1.3 Avaliação do SAREL 1 (10/09/2026)

Leitura de código na pasta `08 - SAREL 1`, commit `9808c46`. Nada foi alterado nela.

| ID | Achado | Evidência | Regra |
|---|---|---|---|
| S1-01 | Nenhuma chamada ao Earth Engine. Os pontos exibidos são gerados no navegador por gerador pseudoaleatório | `src/lib/dados/pontosExemplo.ts`, usado em `src/store/useSarelStore.ts:273` e `:300`; confirmado pela auditoria interna do próprio SAREL 1 | 1, 8 |
| S1-02 | Afirmação de verificação sem execução | `src/lib/gee/client.ts:6` ("capacidades verificados em 08/09/2026", sem nenhuma chamada no arquivo); `src/lib/chuva/chirps.ts:11`; `src/lib/chuva/imerg.ts:17` | 8 |
| S1-03 | Enumeração da erodibilidade declarada como executada e não executada. As classes "Muito Baixa" a "Muito Alta" não constam de nenhuma verificação registrada — o planejamento v3 registra apenas `codnum 4 = Alta` e `codnum 9 = Area urbana` | `src/lib/embrapa/soilClient.ts:441` | 8 |
| S1-04 | Decisões 🛑 tomadas pelo agente: mapa ordinal 1–5 e corte `nivelK` (≤3 / ≥4); limiar de NDVI 0,25; tabela numérica de K por ordem de solo | `soilClient.ts:437-532`; `src/lib/gee/compostoSoloNu.ts:21`; `src/lib/rusle/fatores.ts:116` | 9 |
| S1-05 | A implementação de referência verificada foi alterada: 19 testes viraram 13; perdidos "NUNCA inventa valor: HTTP de erro não produz solo nem erodibilidade", os de cache e o de proveniência completa | `src/lib/embrapa/soilClient.test.ts` comparado a `embrapaSoilClient.test.ts` | 8 |
| S1-06 | NDVI fabricado a partir da frequência de solo nu, com default | `fatores.ts:284`: `1 − (frequenciaSoloNu ?? 0,3) × 0,7` | 1, 5 |
| S1-07 | Chuva anual estimada como acumulado de 90 dias × 4 | `fatores.ts:269` | 1 |
| S1-08 | Fator R inventado: fator 0,5 de "fração erosiva", corte em [1000, 18000], `0,24·P^1,32` com citação trocada | `fatores.ts:80-89` | 1, 9 |
| S1-09 | Erosividade de evento inventada: `volume × 1,5`; `volume × I30 / 100`; `volume × 0,5` sem I30; limiar de evento 10 mm sem referência | `src/lib/chuva/eventos.ts:40`, `:50`, `:67-68` | 1, 9 |
| S1-10 | Correções silenciosas por corte (clamp) e piso | `fatores.ts:41` (C), `:181` e `:191` (`Math.max(1, …)`, `Math.max(0,001, …)`), `:194` (LS em [0,05; 45]); `src/lib/gee/terreno.ts:91` e `:95` (TWI) | 1 |
| S1-11 | `adquiridoEm` preenchido com a data de hoje quando a data real é desconhecida | `terreno.ts:116`; `chirps.ts:67` | 3 |
| S1-12 | Invariante 7 evadível: só dispara se **todas** as n linhas tiverem valor — uma linha sem dado basta para uma constante passar; lista de colunas fixa, colunas novas escapam | `src/lib/matriz/invariantes.ts:115-135` | 1 |
| S1-13 | Kappa = 0 quando não há pares (deveria ser ausente); divergência pendente devolve o rótulo do observador 1 como final; confiança "media" inventada na consolidação | `src/lib/rotulos/concordancia.ts:63-76`, `:237-248`, `:204` | 1, 4 |
| S1-14 | Cota Planet em memória (zera a cada reinício do servidor), ciclo fixo "2026-09"; fração limpa mínima de 80% sem justificativa | `src/lib/planet/quota.ts:33`, `:37`; `src/lib/planet/dataApi.ts:74` | 2, 9 |
| S1-15 | Bloco espacial com piso de 10 km e 20 km atribuídos a Roberts et al. (2017), que orientam derivar do alcance, não fixar valor | `src/lib/gee/blocosEspaciais.ts:72`, `:117` | 9 |
| S1-16 | Parâmetros metodológicos como valor default na assinatura: `limiarNdvi = 0,25`, `limiarVolumeMm = 10`, `metaAmostras = 300`, `semente = 20260908`, `resolucaoPixelM = 30` | `compostoSoloNu.ts:52`, `eventos.ts:40`, `estratificacao.ts:95-96`, `fatores.ts:174` | 9 |
| S1-17 | Auto-auditoria que descreve o código incorretamente e se aprova: "3 classes de exposição solar" (o código usa frequência de solo nu); "Fleiss' Kappa e IVS" (não existem no código) | `docs/AUDITORIA_INTEGRIDADE_2026.md:55`, `:64` | 8 |
| S1-18 | Serviço fundiário próprio que, antes da correção NC-01, fabricava registros SNCR; duplica o matcher auditado do Localizador | `src/lib/fundiario/cadastre_service.py` | 1, 2 |

**O que o SAREL 1 acertou e será aproveitado, depois de revisado:** os tipos `Proveniencia<T>` com `QualidadeAjuste`, `Rotulo`, `RotuloConsolidado` e `SubmissaoDrone` com `papelConjunto: "held-out"`; a guarda antissintético; a estrutura da estratificação por terços cruzados; a fórmula do Kappa; o esboço do Inspetor de Ponto com selos de proveniência; a rota de importação de rótulos com testes. O destino de cada arquivo está no Apêndice A.2.

---

## 2. A Lei Fundamental

Texto integral, justificativas e exemplos no prompt (Parte II). Resumo:

| # | Regra | Defeito de origem |
|---|---|---|
| 1 | **Dado verdadeiro ou ausência declarada** — lacuna nunca vira constante; correção silenciosa (corte, piso, arredondamento que muda classe) é preenchimento disfarçado | Localizador: 150/150 linhas com 16%, 0,45, 0,32. SAREL 1: NDVI fabricado, cortes em C, LS e R |
| 2 | **Nunca colapsar estados distintos** — "não há" ≠ "não pude consultar" ≠ "fora de cobertura" | falha de banco virava "nenhum imóvel nesta coordenada" |
| 3 | **Proveniência viaja junto com o valor** — e `adquiridoEm` é a data do dado, não a da consulta | quatro rotas divergentes; SAREL 1 carimbava a data de hoje |
| 4 | **Nada calculado pelo sistema vira rótulo** | `severity` era função das próprias features |
| 5 | **Zero é um valor** — nunca `\|\|` nem default numérico para lacuna | `{slope: 0}` virava 16 sem marcação |
| 6 | **Respeitar as fontes legítimas** | Mapbox/Google sem calibração nem data por pixel |
| 7 | **Preservar o mascaramento do GEE** — nunca `.unmask(constante)` em banda física | `unmask(0.0)` no BSI reintroduzia nuvem como medição |
| 8 | **Verificar antes de afirmar — com evidência arquivada** | Embrapa como PNG decorativo; SAREL 1 com "verificado" sem chamada |
| 9 | **Todo parâmetro metodológico tem dono e registro** — o agente não fixa limiar, peso, corte ou fórmula; consulta o Registro de Decisões | SAREL 1: limiar 0,25, mapa ordinal, tabela K e fator 0,5 decididos pelo agente |

---

## 3. Decisões metodológicas e Registro de Decisões

### 3.1 O Registro — decisão como dado, não como constante no código

**Problema.** Os dois sistemas anteriores falharam do mesmo modo: um parâmetro metodológico (limiar, peso, corte, fator) nasceu como literal no meio do código, sem dono e sem referência. No Localizador, `declividade × 2,2`; no SAREL 1, `limiarNdvi = 0,25` e `R × 0,5`.

**Mecanismo.** Todo parâmetro metodológico vive em `src/config/decisoes.ts`, espelhado em `docs/planejamento/DECISOES.md`:

```ts
export type EstadoDecisao = "pendente" | "proposta" | "decidida";

export interface Decisao<T> {
  id: string;              // "D10"
  titulo: string;
  estado: EstadoDecisao;
  valor?: T;               // preenchido somente quando "decidida"
  justificativa?: string;
  referencia?: string;     // obra e seção, conferida na fonte
  decididoPor?: string;    // "pesquisador" | "pesquisador e orientador"
  decididoEm?: string;     // AAAA-MM-DD
}

export class ErroDecisaoPendente extends Error {}

/** Devolve o valor decidido ou lança ErroDecisaoPendente. */
export function exigirDecisao<T>(d: Decisao<T>): T;
```

Regras de uso:

- **Funções de cálculo recebem o parâmetro como argumento obrigatório, sem default** (S1-16). Quem lê o Registro é a camada de orquestração (rota de API ou serviço), que injeta o valor.
- Parâmetro pendente produz `{ estado: "indisponivel", causa: "decisao-pendente", motivo: "aguardando decisão D10 (limiar de NDVI)" }` — nunca um valor provisório silencioso.
- Somente o pesquisador muda uma decisão para `"decidida"`. O agente pode redigir a proposta (`"proposta"`, com alternativas e demonstração), nunca aprová-la. O commit que registra uma decisão cita data e quem decidiu.
- Testes: (a) toda decisão `"decidida"` tem `valor`, `decididoPor`, `decididoEm` e `referencia` ou `justificativa`; (b) cada consumidor devolve `indisponivel` com o ID da decisão quando ela está pendente. Nos testes de unidade, o valor é injetado explicitamente.

### 3.2 Decisão tomada

#### D01 — Fórmula do Fator C: Durigon et al. (2014) — **DECIDIDA em 08/09/2026**

$$C = \frac{1 - NDVI}{2}$$

Justificativa registrada (texto completo no histórico do plano v2, §3.1):

1. **Validade regional** — desenvolvida e validada em bacia tropical brasileira; os parâmetros α = 2 e β = 1 de van der Knijff et al. (2000) são calibração europeia.
2. **Concebida para série temporal**, que é a arquitetura do SAREL.
3. **Sem parâmetros livres e sem truncamento** — C ∈ [0, 1] para NDVI ∈ [−1, 1]. NDVI fora desse domínio indica erro a montante e produz `indisponivel` com `causa: "fora-do-dominio"`, **nunca corte** (o SAREL 1 cortava — S1-10).
4. **Não anula o sinal sob dossel** — em NDVI = 0,75, van der Knijff produz A ≈ 0,47 t·ha⁻¹·ano⁻¹; Durigon preserva o gradiente (A ≈ 23,9).
5. **Proveniência limpa** — a fórmula legada era esta mesma elevada a (1 + BSI). Redação sugerida: *"adotou-se a formulação original de Durigon et al. (2014), sem a extensão por BSI presente na versão legada, que invertia o comportamento físico do fator"*.

**Limitação a declarar:** resposta linear em NDVI e saturação do NDVI sob biomassa densa comprimem a faixa de C em dossel fechado. Resposta antecipada: análise de sensibilidade com van der Knijff (§14.3).

### 3.3 Decisões pendentes 🛑

"Trava" indica o que não pode ser concluído sem a decisão. "O agente entrega" indica o que o agente prepara para o pesquisador decidir — nunca a decisão em si.

| ID | Decisão | Trava | O agente entrega |
|---|---|---|---|
| D02 | Critérios observacionais de presente/ausente, com critério de negativo tão explícito quanto o de positivo | Fase 0 e tudo o que depende do rótulo | nada de código; apoio à redação da ficha |
| D03 | Escala do rótulo: binária ou ordinal (`ausente / incipiente / moderada / severa` é provisória) | enum `ClasseRotulo`, ficha Kobo | — |
| D04 | **Modelo D (detecção), Modelo P (predição) ou os dois**, e o intervalo de guarda do Modelo P (sugerido no planejamento v3: 2 anos) | janela da série (Fase 3) e montagem da matriz (Fase 6) | demonstração da diferença de janela em um ponto real |
| D05 | Extensão da série: só Sentinel-2 (~2017+) ou também Landsat (1984+), com harmonização (Claverie et al., 2018) | Fase 3 | nº de observações válidas por ponto em cada opção, numa AOI real |
| D06 | Unidade de predição: pixel 10 m, 30 m ou talhão | Fases 3, 4 e 6 | — |
| D07 | Domínio de validade (3–20% de declividade, uso agrícola) | elegibilidade (Fase 4) e redação | fração da AOI excluída por cada critério |
| D08 | Tratamento das unidades pedológicas em **associação**. Proposta do planejamento v3 §5.2: usar `ordem_1` e propagar `tipo_unida` como confiança média | Fase 2 | fração de pontos em associação numa AOI real |
| D09 | Mapa ordinal das classes de erodibilidade da Embrapa e o corte em 2 níveis de K̂ | Fase 2 (mapa) e Fase 4 (K̂) | enumeração do domínio **com evidência** (§8.1) e ao menos duas propostas de mapa, com contagem de pontos por classe. A função do SAREL 1 pode ser uma delas, apresentada como proposta, não como verificação |
| D10 | Limiar de NDVI para "solo descoberto" (usado em Ê, no composto e na frequência de exposição) | Fases 3 e 4 | valores da literatura com citação **conferida na fonte** (ex.: a linha GEOS3, Demattê et al., 2018) e sensibilidade de Ê a ±0,05 |
| D11 | Cobertura temporal mínima — nº mínimo de observações válidas por ponto | elegibilidade (Fase 4) | distribuição do nº de observações válidas numa AOI real; relação com o nº de parâmetros do modelo harmônico |
| D12 | Dimensões da estratificação: manter Ŝ × Ê × K̂ (18 estratos, plano v2) ou ampliar com erosividade e/ou uso, como pede o planejamento v3 §7.2 | Fase 4 | ocupação dos estratos em cada opção, numa AOI real, frente ao tamanho de amostra previsto |
| D13 | Formulação do **Fator R** a partir de IMERG/CHIRPS — critério de evento erosivo, equação de energia cinética, agregação anual | Fase 8 e feature de mecanismo | alternativas da literatura com referência conferida (ex.: EI30 por evento com energia de Brown & Foster, 1987, adotada na RUSLE; equações regionais do Paraná, Waltrick et al., 2015) |
| D14 | **Fator K numérico** para a linha de base. A carta da Embrapa dá classe, e a RUSLE exige número | Fase 8 | origem documental possível de valores de K e o que cada uma exige |
| D15 | Fator LS: método de cálculo de As e expoentes m e n | Fase 8 | alternativas (Moore & Burch, 1986; Desmet & Govers, 1996) e sensibilidade |
| D16 | Nº de pontos de campo e de voos de drone viáveis | tamanho de amostra, Fases 4 e 6 | — |
| D17 | **Ciclo da cota Planet: mensal ou total** — é verificação, não escolha, mas altera o orçamento por um fator de 24 | Fase 5 | evidência da verificação (§11.2) |
| D18 | Buffer do recorte Planet (recomendado 250 m) | Fase 5 | tabela de consumo (§11.3) |
| D19 | Nº de pontos com par de evento — depende de D17 e D18 | Fase 5 | resultado do script de viabilidade (§11.4) |

### 3.4 Parâmetros operacionais

Não são decisões de dissertação no mesmo grau, mas também não podem nascer como literal anônimo. Ficam no Registro com valor, origem e estado. Os valores herdados do Localizador entram como `"proposta"` até o pesquisador confirmá-los.

| ID | Parâmetro | Valor herdado | Origem declarada |
|---|---|---|---|
| P01 | Aresta do bloco espacial | derivada do variograma (§3.7); fallback 20 km **provisório** | Roberts et al. (2017) orientam derivar do alcance; os 20 km são escolha de contingência, não da referência |
| P02 | Espaçamento mínimo do *thinning* | 1 km | `spatialThinning` do Localizador |
| P03 | Raio de casamento de formulário Kobo com ponto planejado | 150 m | `koboParser.ts` do Localizador |
| P04 | Buffers de exclusão: água 30 m, urbano 150 m; limiar de ocorrência de água 10% | 30 m / 150 m / 10% | `eligibilityConstants.ts`, README §3.3.4 do Localizador |
| P05 | Classes elegíveis do ESA WorldCover | 30, 40, 60 | planejamento v3 §7.1 |
| P06 | Fração limpa mínima (UDM2) dentro da AOI do ponto | nenhum (o SAREL 1 usava 80% sem justificativa) | a definir na Fase 5 |
| P07 | Semente aleatória da amostragem | registrada a cada execução | reprodutibilidade (M3 da auditoria do plano v1) |
| P08 | Limiar do **alerta** de baixa variância (não bloqueia; o bloqueio é o Invariante 7) | nenhum | limiar de alerta visual, a propor na Fase 1 |
| P09 | Método de máscara de nuvem e sombra do Sentinel-2 (e do Landsat, se D05) | implícito no Localizador (`maskS2Clouds`) | a propor na Fase 3, com referência e evidência |

### 3.5 Estratificação multivariada

Mantém-se o desenho do plano v2, §3.3, sujeito a D12:

| Dimensão | Insumo | Origem |
|---|---|---|
| **Ŝ** — terreno | declividade em % | Copernicus DEM em EPSG:31982, pela **mesma função** usada nas features (§8.2) |
| **Ê** — exposição de solo | frequência de solo descoberto na série: fração das observações válidas com NDVI < limiar D10 | série temporal (Fase 3) |
| **K̂** — erodibilidade | classe da carta da Embrapa, mapeada para 2 níveis por D09 | `embrapaSoilClient` (Fase 2) |

- **Estratos:** 3 terços de Ŝ × 3 terços de Ê × 2 níveis de K̂ = 18. Terços sobre a distribuição empírica **dentro do frame de elegibilidade da AOI**.
- **Empates na fronteira dos terços:** regra determinística documentada e testada.
- **Alocação:** uniforme entre estratos ocupados. Estrato com menos candidatos que a cota é esgotado e o déficit fica **registrado** — nunca completado por vizinho. O total amostrado não excede a meta.
- **Classe negativa:** emerge das células de Ŝ e Ê baixos, dentro do mesmo frame.
- **Φ_diag** = (Ŝ_norm + Ê_norm + K̂_norm) / 3 — só para ordenação dentro do estrato e para o relatório. Peso igual declarado como conveniência, sem alegação física. Se a amplitude de uma dimensão for zero, Φ_diag fica **indisponível** para aquela AOI, em vez de receber 0,5 (o SAREL 1 usava 0,5). **Nunca exportado, nunca feature, nunca rótulo.**

### 3.6 Classes de erodibilidade da Embrapa

A camada `brasil_erodibilidade_solo` devolve `classe` categórica e `codnum`. Verificado em 08/09/2026: `codnum 4 = "Alta"`, `codnum 9 = "Area urbana"`. A presença de categoria não pedológica prova que `codnum` **não é escala ordinal** e não pode ser usado diretamente.

Procedimento, primeira tarefa de erodibilidade na Fase 2:

1. **Enumerar o domínio completo** da camada (WFS `GetFeature` com `propertyName=classe,codnum`, ou legenda do GeoServer) e **arquivar a resposta bruta** em `docs/verificacoes/` (Regra 8).
2. Submeter ao pesquisador as propostas de mapa ordinal e de corte em 2 níveis (D09).
3. Excluir explicitamente do frame as categorias não pedológicas, com teste.
4. Classe fora do mapa → `indisponivel` com motivo, **nunca** um ordinal arbitrado.

### 3.7 Blocos espaciais

1. Após a Fase 4 extrair as features de uma amostra real, calcular o **variograma empírico** de declividade, frequência de solo descoberto e ordinal de erodibilidade.
2. Aresta do bloco = **maior alcance** entre elas, arredondado para cima, **sem piso arbitrário** (o SAREL 1 impunha 10 km — S1-15).
3. Registrar valor, variograma, critério de patamar, nº de pares por classe de distância e data no Relatório de Amostragem.
4. Reavaliar após a rotulagem, com o variograma do próprio rótulo.
5. **Fallback (P01):** variograma inconclusivo → 20 km, registrado como provisório, com o motivo. Nunca silenciosamente, e sem atribuir o número a Roberts et al.

### 3.8 A Fase 8 só está desbloqueada para o Fator C

O plano v2 declarou a Fase 8 "desbloqueada" com a decisão do Fator C. Mas A = R · K · LS · C · P exige R, K e LS numéricos, e:

- **R** não tem formulação definida — o v2 dizia "EI30 acumulado, usar IMERG", sem critério de evento nem equação de energia. Foi nessa lacuna que o SAREL 1 inventou `R × 0,5` (S1-08). → D13.
- **K** vem da Embrapa como **classe**, e o próprio plano proíbe convertê-la em número sem respaldo documental. Sem K numérico não há A. → D14.
- **LS** depende do método de As e dos expoentes. → D15.

Enquanto D13, D14 e D15 estiverem pendentes, a Fase 8 implementa e testa o Fator C, o Fator P tabelado e a infraestrutura de coerência (Invariante 1), e deixa `perdaSolo` **indisponível com `causa: "decisao-pendente"`**.

---

## 4. Estratégia de repositório

### 4.1 Por que reconstruir em vez de corrigir no lugar

- **A causa raiz é estrutural.** A auditoria mostrou quatro caminhos paralelos produzindo os mesmos campos com regras diferentes (`parsers.ts`, `api/gee/analyze-point`, `candidateSelector.ts`, `batchEnrichment.ts`). Na correção no lugar, basta esquecer um deles para que ele continue fabricando número com a suíte verde.
- **O defeito está mais espalhado do que a auditoria registrou.** Defaults numéricos aparecem também na interface e no laudo: `components/audit/AuditDossierModal.tsx:152-154` (`k ?? 0,035`, `c ?? 0,28`), `lib/pdf/auditPdfGenerator.ts:628-630` (idem), `lib/store/useErosionStore.ts:533-534` (`bsi ?? 0,3`, `ndvi ?? 0,35`), `lib/gee/eligibilityMask.ts:75` (EPSG:3857 também na máscara de elegibilidade).
- **O modelo de dados muda inteiro.** `types/erosion.ts` dá lugar a `Proveniencia<T>`; severidade e score deixam de existir como resultado. Isso atinge o store e todos os componentes grandes.
- **Com `src/` limpo, o padrão passa a ser a ausência.** Nada do sistema antigo existe no novo sem que alguém o tenha trazido pelo protocolo da §4.3.

### 4.2 Branches, tag e quarentena

| Referência | Papel |
|---|---|
| `correcoes/auditoria-2026-09` | congelada; recebe só o commit de documentação da Fase −1 |
| tag `legado-pre-sarel` | ponto de retorno ao Localizador como estava |
| `sarel/v2` | onde a reconstrução acontece |
| `main` | **não usar como base** — está 93 arquivos atrás da branch de trabalho |
| `legado/localizador/` | o `src/` do Localizador, movido com `git mv` (histórico preservado) |
| `legado/sarel1/` | cópia do `src/`, `docs/` e `README.md` do SAREL 1 no commit `9808c46` |

- Nada em `src/` importa de `legado/` — bloqueado por ESLint e por teste (§7.7).
- `legado/` é removida na Fase 9, quando cada arquivo do inventário tiver destino resolvido.
- A pasta `08 - SAREL 1` não é alterada em nenhuma fase.

### 4.3 Protocolo de porte

Para cada arquivo que sai de `legado/`:

1. Ler o arquivo inteiro e a linha correspondente do `INVENTARIO_LEGADO.md`.
2. Conferir contra a Lei Fundamental, os achados do Apêndice B e os padrões proibidos (§7.5).
3. **Escrever primeiro o teste que falharia se o defeito conhecido estivesse presente.** Teste que passaria com o defeito não conta.
4. `git mv legado/... src/...` em commit **sem alteração de conteúdo**; adaptar no commit seguinte. Assim `git log --follow` e o diff mostram exatamente o que mudou.
5. Converter para `Proveniencia<T>`, remover defaults numéricos, receber parâmetros metodológicos por argumento (§3.1).
6. Atualizar o inventário: ação executada, commit, observação.
7. `npm run test && npx tsc --noEmit && npm run lint` verdes.

Ações possíveis no inventário:

| Ação | Significado |
|---|---|
| **portar** | volta quase intacto; só ajustes de tipo e caminho |
| **adaptar** | volta com correções listadas no inventário |
| **reescrever** | arquivo novo; o antigo é lido como referência e o inventário aponta o substituto |
| **descartar** | não volta; o inventário registra o motivo (ID do achado). Permanece em `legado/` até a Fase 9 |
| **avaliar** | decisão adiada para a fase indicada, com critério |

### 4.4 Estrutura de diretórios alvo

```
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/session/route.ts           # sessão efêmera: GEE, Planet e demais tokens
│   │   │   ├── embrapa/solo/route.ts
│   │   │   ├── chuva/historico/route.ts
│   │   │   ├── gee/{terreno,serie,amostragem}/route.ts
│   │   │   ├── fundiario/{consulta,fontes,poligono}/route.ts
│   │   │   ├── planet/{busca,pedido,cota}/route.ts
│   │   │   ├── rotulos/importar/route.ts
│   │   │   ├── exportar/route.ts
│   │   │   └── verificacao/[servico]/route.ts  # NOVO — captura de evidência (Regra 8), só local
│   │   ├── layout.tsx · page.tsx · globals.css
│   ├── components/
│   │   ├── mapa/ · aoi/ · inspetor/ · matriz/ · campanha/ · comparador/ · relatorios/ · config/ · diagnostico/
│   ├── config/
│   │   └── decisoes.ts                         # NOVO — Registro de Decisões (§3.1)
│   ├── lib/
│   │   ├── embrapa/      embrapaSoilClient.ts (+ .test.ts)  — nome ORIGINAL mantido
│   │   ├── gee/          auth · client · versaoMotor · terreno · elegibilidade · aoiTiling
│   │   │                 estratificacao · thinning · blocosEspaciais
│   │   │                 serieTemporal · harmonicos · estatisticasSerie · compostoSoloNu · sentinel1
│   │   ├── chuva/        chirps · imerg · eventos
│   │   ├── planet/       dataApi · ordersApi · tiles · quota · paresEvento
│   │   ├── fundiario/    matcher · protecao
│   │   ├── localizacao/  municipio · bacia · dados/
│   │   ├── rotulos/      ingestaoKobo · ingestaoInterpretacao · ingestaoDrone · concordancia
│   │   ├── matriz/       perfis · invariantes · montagem
│   │   ├── export/       xlsxWriter · planilha · csv · geo · dms
│   │   ├── rusle/        fatores · baseline
│   │   └── seguranca/    localOnly · sessaoEfemera · guardaSintetico
│   │                     padroesProibidos.test · verificacoes.test · importacoes.test
│   ├── store/            useSarelStore.ts
│   └── types/            proveniencia.ts · ponto.ts · rotulo.ts
├── scripts/              Python do fundiário e da ingestão (permanecem; matcher adaptado na Fase 2)
├── data/                 base fundiária local — não versionada, não movida
├── docs/
│   ├── planejamento/     plano · prompt · DECISOES.md · INVENTARIO_LEGADO.md · historico/
│   ├── auditorias/       relatórios de auditoria
│   ├── verificacoes/     evidências brutas da Regra 8 — VERSIONADAS
│   ├── legado/           README, manuais e design do Localizador
│   └── images/
└── legado/               localizador/ · sarel1/   (quarentena; removida na Fase 9)
```

Testes colocalizados: `modulo.ts` e `modulo.test.ts` no mesmo diretório. Testes que exigem rede ou credencial terminam em `.vivo.test.ts` e ficam fora do `npm run test` (§7.6).

### 4.5 Configuração

- `tsconfig.json`: `"exclude": ["node_modules", "legado"]`.
- `.eslintrc.json`: `ignorePatterns: ["legado/"]` e `no-restricted-imports` com os padrões `**/legado/**` e `legado/*`.
- `vitest.config.mts`: `include: ["src/**/*.test.ts"]`, `exclude: ["src/**/*.vivo.test.ts"]`. Configuração separada para `npm run test:vivo`.
- `package.json`: scripts `typecheck` (`tsc --noEmit`) e `test:vivo`.
- `.gitignore`: acrescentar `data/planet/` (livro-razão local da cota) e `legado/**/__pycache__/`. **Não** ignorar `docs/verificacoes/`.
- Nenhuma dependência nova sem autorização do pesquisador.

### 4.6 Usar o Localizador durante a transição

`data/` e as pastas `Dados *` não são versionadas e permanecem ao trocar de branch:

```bash
git switch --detach legado-pre-sarel
```

Depois `npm run build && npm run start` (ou o lançador `.bat`, que reconstrói quando o build está defasado). Para voltar, `git switch sarel/v2`. Alterações não commitadas precisam ser commitadas antes da troca.

---

## 5. Fase −1 — Preparação do repositório

**Execução somente com autorização do pesquisador. O push exige confirmação explícita.**

### 5.1 Antes de começar

- **Backup externo (opcional).** `data/` (~9,9 GB) e as pastas `Dados INCRA`, `Dados SICAR`, `Dados SNCR` (~1,7 GB) não são tocadas pelo plano. Se forem copiadas, lembrar que os `.bak` do banco contêm dados pessoais pseudonimizados (LGPD). `node_modules` e `.next` se regeneram e não precisam de cópia.
- **Linha de base registrada em 10/09/2026:** `npx vitest run` → 21 arquivos, 175 testes, todos verdes.

### 5.2 Passo 1 — Versionar o que ainda não está no git

Na branch `correcoes/auditoria-2026-09`. O cliente da Embrapa e seus 19 testes — a implementação de referência que o plano manda usar — **não estão versionados**; uma tag feita antes deste passo não os levaria.

```bash
git add src/lib/embrapa/embrapaSoilClient.ts src/lib/embrapa/embrapaSoilClient.test.ts
git add PROMPT_*.md PROMPT_*.pdf PLANEJAMENTO_*.md PLANEJAMENTO_*.pdf
git add Relatorio_Auditoria_Projeto_2026-09-08.txt Relatorio_Auditoria_Tabela_Consolidada_2026-09-08.txt
git add design.md docs/
git commit -m "docs: registrar planejamento, auditorias e cliente Embrapa verificado antes da reconstrucao"
```

`Tabela_Consolidada_*.xlsx` continua fora (ignorada pelo `.gitignore`): contém códigos CAR e nomes mascarados do SNCR.

### 5.3 Passo 2 — Tag e cópia remota

```bash
git tag -a legado-pre-sarel -m "Localizador antes da reconstrucao SAREL (auditoria de 08/09/2026)"
```

Push de `correcoes/auditoria-2026-09` e da tag **somente com confirmação**. Antes, conferir que o repositório no GitHub é **privado**: os documentos citam códigos CAR reais e nomes mascarados do SNCR.

### 5.4 Passo 3 — Branch de trabalho

```bash
git switch -c sarel/v2
```

### 5.5 Passo 4 — Quarentena (commit A: só movimentação)

1. `git mv src legado/localizador/src`
2. Exportar do repositório do SAREL 1, **sem alterá-lo**, o commit `9808c46` (`src/`, `docs/`, `README.md`) para `legado/sarel1/` — por exemplo com `git -C "<caminho>/08 - SAREL 1" archive --format=zip -o <scratch>/sarel1.zip 9808c46 src docs README.md` e extração em `legado/sarel1/`.
3. Copiar de `08 - SAREL 1/Fontes de consulta/` para `docs/planejamento/historico/`: `implementation_plan.md`, `implementation_plan_v2.md`, `AUDITORIA_implementation_plan_2026-09-08.md`, `PROMPT_ABERTURA_IMPLEMENTACAO.md`, `LAUDO_TECNICO_COMPATIBILIDADE_DESIGN_SAREL_2026-09-09.pdf`. **Não copiar** as bases de dados daquela pasta: a base fundiária do Localizador (`data/fundiario_brasil.db`) é a única usada.
4. Commit: `chore(sarel): quarentena do Localizador e do rascunho SAREL 1`.

### 5.6 Passo 5 — Documentação (commit B)

| Origem | Destino |
|---|---|
| `PLANEJAMENTO_PESQUISA_v3_2026-09-08.{md,pdf}` | `docs/planejamento/` |
| `PLANEJAMENTO_PESQUISA_2026-09-08.*`, `PLANEJAMENTO_PESQUISA_v2_2026-09-08.*` | `docs/planejamento/historico/` |
| `PROMPT_NOVO_PROJETO_2026-09-08.{md,pdf}`, `PROMPT_CORRECAO_AUDITORIA_2026-09-08.md` | `docs/planejamento/historico/` — substituídos pelo prompt de reconstrução |
| `Relatorio_Auditoria_*.txt` (4 arquivos) | `docs/auditorias/` |
| `README.md`, `MANUAL_INSTALACAO.md`, `MANUAL_OPERACAO.md`, `MAPA_DOCUMENTACAO_CALCULOS.md`, `GUIA_CONFIGURACAO_CREDENCIAIS.md`, `design.md` | `docs/legado/` — descrevem o Localizador; o README antigo contém a fórmula invertida do Fator C |

- Novo `README.md` curto: o que é o SAREL, estado "em reconstrução", como usar o Localizador (§4.6), onde estão plano e prompt.
- Criar `docs/planejamento/DECISOES.md` a partir das §3.2 a §3.4 e `docs/planejamento/INVENTARIO_LEGADO.md` a partir do Apêndice A, com as colunas: arquivo · origem · ação · destino · motivo/achado · fase · status · commit.
- Scripts de apresentação (`generate_*.py`, `.pptx`) e lançadores (`.bat`, `.ps1`) permanecem na raiz; renomeação na Fase 9.

### 5.7 Passo 6 — Configuração, casca mínima e primeiro porte (commit C)

1. Aplicar a §4.5.
2. Casca mínima: `src/app/layout.tsx`, `src/app/page.tsx` ("SAREL — em reconstrução", com o caminho para o Localizador), `src/app/globals.css`; `git mv` de `favicon.ico` e `icon.png`.
3. **Primeiro porte, o cliente da Embrapa, com nome e conteúdo originais:**
   `git mv legado/localizador/src/lib/embrapa/embrapaSoilClient.ts src/lib/embrapa/` e o mesmo para o `.test.ts`. O módulo não importa nada do projeto. A versão alterada do SAREL 1 (`legado/sarel1/src/lib/embrapa/soilClient.ts`) **não** é usada (S1-05).

### 5.8 Critério de aceite da Fase −1

- `npm run test` → 1 arquivo, **19 testes**, verdes.
- `npx tsc --noEmit`, `npm run lint` e `npm run build` sem erro.
- `git log --follow --oneline src/lib/embrapa/embrapaSoilClient.ts` mostra o commit de origem.
- O inventário lista **todos** os arquivos de `legado/`, conferido por script (contagem de linhas do inventário = contagem de arquivos).
- `git status` limpo neste repositório e na pasta `08 - SAREL 1`.

---

## 6. Fase 0 — Definição operacional do rótulo 🛑 *(bloqueante para a coleta)*

Nenhuma coleta antes desta fase. O desempenho máximo de qualquer classificador é limitado pela consistência do rótulo; ruído sistemático de rotulagem é aprendido como se fosse sinal.

**Produtos (pesquisador e orientador; o agente apoia a redação, não decide):**

1. **Critérios observacionais por classe** (D02) — observáveis pelo instrumento, reprodutíveis entre observadores, registrados antes de olhar os dados.
2. **Critério de negativo tão explícito quanto o de positivo.** Sem ele, "não observei" será registrado como "não há".
3. **Escala** (D03) — binária ou ordinal.
4. **Ficha de campo** (KoboToolbox) derivada dos critérios.
5. **Protocolo de concordância:** dois intérpretes independentes, Kappa de Cohen (1960), patamares de Landis & Koch (1977), regra de desempate. Kappa < 0,60 → o critério não está operacional e é reescrito antes da coleta em escala. Recomenda-se uma **rodada piloto** para medir o Kappa antes da campanha.
6. **Protocolo de cegamento**, por modalidade:
   - intérprete da Fase A não vê features, estrato, Φ nem a leitura do outro intérprete;
   - equipe de campo da Fase B não vê o rótulo da interpretação visual — a Fase B existe para **medir a taxa de erro** da Fase A, e conhecer a resposta enviesa a medida;
   - intérprete do ortomosaico da Fase D não vê predição nem score (planejamento v3 §8.1).
7. **Tamanho da campanha** (D16).

**Indicadores candidatos** (planejamento v3 §3): espessura do horizonte A, exposição do horizonte B, pedestais e raízes expostas, início de sulcos, deposição em sopé, vigor diferencial da cultura.

**Dependência de código:** o tipo `ClasseRotulo` só é criado depois de D03. Todo o resto da Fase 1 corre em paralelo à Fase 0.

---

## 7. Fase 1 — Fundação

### 7.1 Tipos

Base: os tipos do SAREL 1 (`legado/sarel1/src/types/`), **adaptados**:

| Mudança | Motivo |
|---|---|
| `medido` ganha `consultadoEm`; `adquiridoEm` passa a significar a data (ou período) do dado na fonte, nunca a data da consulta | S1-11 |
| `indisponivel` ganha `causa`, enumeração fechada: `sem-cobertura`, `servico-indisponivel`, `mascarado`, `insuficiente`, `fora-do-dominio`, `decisao-pendente`, `nao-calculado` | Regra 2 aplicada à própria ausência; permite a Aba 3 separar "não há" de "não pude" |
| `origemSintetica` obrigatório, não opcional | guarda antissintético sem brecha por campo ausente |
| `blocoEspacial: string \| null` | só existe depois do variograma (§3.7) |
| `criterioSelecao: { tercilS, tercilE, nivelK, phiDiag, semente }`; remover `quantilPhi` e `phi` | Φ escalar foi abandonado (§3.5) |
| `localizacao: { municipio, codigoIbge, bacia }` com `Proveniencia<string>` | literais "Paraná", "Custom", "Bacia Local" (A2) |
| `serie` por janela de modelo: `Partial<Record<"D" \| "P", BlocoSerie>>` | D04 |
| `rusle?` sai do ponto como feature e vira `linhaDeBase?`, fora de qualquer matriz | Regra 4 |
| `rastreio: { versaoMotor, cenas: string[], calculadoEm }` — `cenas` com `PRODUCT_ID` | A7 |
| `poligonoGeoJson?: any` → tipo GeoJSON | tipagem estrita |
| `RotuloConsolidado.final: Rotulo \| null`; `kappa: number \| null` | S1-13 |
| `rotulo.ts` sem `ClasseRotulo` até D03 | Fase 0 |

A definição completa está no prompt, §7.

### 7.2 Registro de Decisões

`src/config/decisoes.ts` com D01 a D19 e P01 a P08 nos estados da §3, e `exigirDecisao()`. Testes da §3.1.

### 7.3 Segurança portada do Localizador

| Módulo | Origem | Ação |
|---|---|---|
| `seguranca/localOnly.ts` (+ teste) | `lib/security/localOnly.ts` | portar |
| `seguranca/sessaoEfemera.ts` (+ teste) | `lib/gee/sessionStore.ts` | adaptar — generalizar para GEE, Planet e demais tokens; manter `globalThis` (sobrevive ao HMR), TTL, cookie `httpOnly` e a limitação documentada (não sobrevive a reinício) |
| `gee/auth.ts` (+ teste) | `lib/gee/googleAuth.ts` | portar — JWT RS256 com `crypto` nativo, sem dependência |

### 7.4 Guarda antissintético

`seguranca/guardaSintetico.ts`, unindo a semântica de `isSyntheticPoint` do Localizador (`types/erosion.ts:34`), auditada como "sem brecha", à versão do SAREL 1.

- Todo ponto de teste tem `origemSintetica: true`.
- **Toda** saída (planilha, CSV, GeoJSON, KML, shapefile, dossiê PDF, exportações cegas, matriz) e a **reidratação do store** recusam ponto sintético, com mensagem explícita.
- Teste de cobertura: cada função exportada de `lib/export/` e `lib/matriz/montagem.ts` recebe um conjunto com um ponto sintético e deve lançar. Função nova de saída sem a guarda faz o teste falhar.

### 7.5 Teste de padrões proibidos

`seguranca/padroesProibidos.test.ts` varre `src/lib/{gee,chuva,rusle,embrapa,planet,matriz,export,rotulos,fundiario,localizacao}/**/*.ts`, exceto testes:

| Padrão | Exemplo real que teria sido barrado |
|---|---|
| `.unmask(` com literal numérico | `candidateSelector.ts:126-162` (C6) |
| `\|\|` seguido de literal numérico | `parsers.ts` `\|\| 16` (A3) |
| `??` seguido de literal numérico | `earthEngineClient.ts:231-232` (A8); `fatores.ts:284` do SAREL 1 |
| parâmetro numérico com default na assinatura (`: number = 0.25`) | S1-16 |
| `Math.max(`/`Math.min(` com literal (corte ou piso) | S1-10 |
| `adquiridoEm` atribuído a partir de `new Date` | S1-11 |

**Exceção** somente com marcador na mesma linha e justificativa: `// permitido: <motivo com pelo menos 20 caracteres>`. O teste lista todas as exceções no relatório de fase.

**Meta-teste obrigatório:** o varredor é exercitado contra trechos que contêm cada padrão e precisa detectá-los. Varredor que não detecta nada é teste vacuoso.

### 7.6 Evidência de verificação (Regra 8)

- Toda afirmação de verificação em comentário segue o formato `VERIFICADO AAAA-MM-DD — evidência: docs/verificacoes/<arquivo>`.
- `seguranca/verificacoes.test.ts` falha se: (a) um comentário menciona verificação com data e não cita arquivo em `docs/verificacoes/`; (b) o arquivo citado não existe.
- **Captura da evidência:**
  - serviço público sem credencial (Embrapa, IBGE) → script em `scripts/verificacao/<servico>.mjs`, que faz a chamada real e grava a resposta bruta;
  - serviço com credencial (GEE, Planet) → rota `/api/verificacao/[servico]`, restrita a execução local, que usa a sessão efêmera e grava a resposta **sem** nenhum dado de credencial.
- Nome do arquivo: `AAAA-MM-DD_<servico>_<operacao>.<ext>`. Evidência nunca contém dado pessoal — do fundiário, só contagens e status.
- Testes que exigem rede ou credencial: `*.vivo.test.ts`, executados por `npm run test:vivo`.
- **Primeiro exercício, ainda nesta fase:** refazer a verificação da Embrapa — `GetCapabilities` e `GetFeatureInfo` nas três coordenadas do planejamento v3 §5.2 — arquivar as respostas e atualizar o comentário de `embrapaSoilClient.ts`. É a única alteração permitida nesse arquivo; os 19 testes permanecem intactos.

### 7.7 Importações da quarentena

Regra ESLint `no-restricted-imports` e `seguranca/importacoes.test.ts`: nenhum arquivo de `src/` importa de `legado/`. Meta-teste com um trecho que importa de `legado/`.

### 7.8 Perfis de exportação

`matriz/perfis.ts` define, para cada artefato, uma **lista de permissão** de colunas — lista do que pode entrar, não do que é proibido. Coluna nova não entra em nenhum perfil sem ser declarada.

| Perfil | Destinatário | Contém | Não contém |
|---|---|---|---|
| `planilha` | pesquisador, dissertação | identificação, coordenadas, localização, bloco, estrato, features com colunas `_Origem`, solo com confiança, fundiário com bloco LGPD, rótulo consolidado, linha de base RUSLE em colunas próprias (Fase 8), rastreio | Φ_diag, qualquer score, tipologia |
| `interpretacao-cega` | intérpretes da Fase A | código, coordenadas, janela temporal, referência de cena ou tile | features, estrato, Φ, bloco, RUSLE, leitura do outro intérprete |
| `campo-cego` | equipe da Fase B | código, coordenadas, município, acesso (status fundiário com motivo, CAR, titular mascarado), rota | features, estrato, Φ, bloco, RUSLE, **rótulo de qualquer outra modalidade** |
| `voo-cego` | intérprete da Fase D | código, coordenadas, área de voo | predição, score, features, estrato, rótulos anteriores |
| `matriz-treino` | modelagem, fora do sistema | id, bloco, features (valores; ausente = vazio), rótulo consolidado, modalidade | coordenadas, estrato, Φ, fatores RUSLE e perda, tipologia, fundiário. Coordenadas vão para um arquivo de chaves; proveniência, para um arquivo de proveniência com a mesma chave; linhas *held-out* de drone, para arquivo próprio |

Coordenadas fora da matriz evitam que o modelo aprenda posição em vez de processo. Incluí-las seria decisão explícita do pesquisador.

### 7.9 Invariantes

`matriz/invariantes.ts`, executados **sobre o artefato já projetado no perfil** — as linhas e colunas que serão escritas —, antes de gerar o arquivo. Falha em qualquer um: recusa a exportação com mensagem explícita.

| # | Invariante | Observação |
|---|---|---|
| 1 | `perdaSolo` preenchida ⟺ os 5 fatores preenchidos ⟺ memória com a equação | inerte até a Fase 8; o relatório declara "inerte", para que verde não seja lido como cobertura |
| 2 | **O cabeçalho do artefato está contido na lista de permissão do seu perfil** | redefinido: aplica a Regra 4 e o cegamento no próprio arquivo. A faixa de Φ_diag é testada na estratificação, porque Φ_diag nunca chega a um artefato |
| 3 | `Campos_Estimados` lista exatamente os campos com `estado !== "medido"` | derivado, nunca escrito à mão |
| 4 | origem satélite ⟹ `PRODUCT_ID` das cenas, data de cálculo e versão do motor preenchidos | A7 |
| 5 | "Sem correspondência" só após consulta bem-sucedida sem match | C4 |
| 6 | nenhuma coluna geográfica com literal de programa: `"Custom"`, `"Bacia Local"`, `"Bacia Hidrográfica Local"`, `"Área Amostral GEE"`, nem nome de UF na coluna de município | A2 |
| 7 | **Nenhuma coluna numérica do artefato com valor idêntico em todos os valores não vazios, quando há 21 ou mais valores não vazios** | aplica-se a **todas** as colunas numéricas do artefato, não a uma lista escolhida; valores vazios **não** desativam o detector (corrige S1-12). Implementar primeiro |

### 7.10 Exportação

| Módulo | Origem | Ação |
|---|---|---|
| `export/xlsxWriter.ts` | `lib/utils/xlsxWriter.ts` do Localizador | portar — escrita própria com escape por `inlineStr`, auditada |
| `export/planilha.ts` | `lib/utils/auditTableExport.ts` do Localizador + o formato `_Origem` do SAREL 1 | adaptar — **preservar** `resolveBlockF()`, a máscara do SNCR byte a byte e o bloco LGPD |
| `export/csv.ts` | idem | adaptar — mesmos metadados e bloco LGPD do XLSX (M1) |
| `export/dms.ts` | `lib/utils/geoUtils.ts:26` | adaptar — DMS derivado do **mesmo número arredondado** da coluna decimal (M3) e com *rollover* de 60,0″ (M4) |

- **Aba 1 — Dados:** cada variável científica em duas colunas adjacentes, `[Variavel]` e `[Variavel]_Origem`.
- **Aba 2 — Procedência e Conformidade:** emissão, filtros, janela, **contagem real** de consultas por fonte, bloco LGPD; cabeçalho das bases diz "disponíveis nesta instalação" (M2).
- **Aba 3 — Qualidade do Dado:** por variável, % medido, modelado, tabelado e indisponível — este último **por causa**.
- Célula numérica ausente fica **vazia**, nunca `0`; célula textual ausente recebe texto explicativo.
- `Codigo` e identificador interno não são a mesma coluna repetida (M6).

### 7.11 Testes da Fase 1

- Invariante 7 recusa as 150 linhas idênticas (35,2 t/ha/ano; 16%; 0,45) **e** o mesmo conjunto com uma linha vazia **e** uma coluna nova que não estava em nenhuma lista.
- Invariante 2 recusa Φ_diag na `planilha`, feature no `campo-cego` e rótulo da interpretação no `campo-cego`.
- `Campos_Estimados` derivado de `Proveniencia`.
- `0` preservado como `0`.
- DMS: `-25.99999` não produz `59' 60.0"`; decimal e DMS da mesma coordenada coincidem (caso `-51.127569` da auditoria).
- CSV com metadados e bloco LGPD.
- Guarda antissintético em todas as saídas e na reidratação.
- Registro: decisão pendente produz `indisponivel` com o ID; decisão "decidida" incompleta falha.
- Meta-testes dos três varredores (§7.5 a §7.7).
- Embrapa: os 19 testes originais, intactos, e a evidência arquivada.

### 7.12 Critério de aceite

Três verdes; evidência da Embrapa em `docs/verificacoes/`; inventário atualizado; Relatório de Fase entregue. O tipo `ClasseRotulo` entra somente após D03.

---

## 8. Fase 2 — Fontes verificadas

**Primeira tarefa de cada serviço externo:** consultar capacidades, executar chamada real, arquivar a resposta em `docs/verificacoes/` e só então codificar (§7.6). Nada é declarado pronto sem evidência.

### 8.1 Embrapa

- Cliente já portado e reverificado na Fase 1.
- **Enumerar o domínio da erodibilidade** com evidência e preparar as propostas de D09 (§3.6).
- `tipo_unida = associacao` propaga `confiancaPedologica: "media"` até a planilha (D08).
- Rota `api/embrapa/solo`.
- Categorias não pedológicas excluídas do frame, com teste.

### 8.2 Terreno — uma única função de declividade

`gee/terreno.ts` é a **única** fonte de declividade do sistema: elegibilidade, estratificação e features chamam a mesma função. No Localizador havia três cálculos, e a própria máscara de elegibilidade usava EPSG:3857 (`eligibilityMask.ts:75`).

- Copernicus DEM GLO-30 em **EPSG:31982** (SIRGAS 2000 / UTM 22S).
- **Demonstração numérica arquivada:** declividade em 3 pontos reais sob EPSG:3857 e sob EPSG:31982, confirmando a ordem de grandeza prevista pela auditoria (subestimação de ~9–10% no Mercator).
- Comentário documentando o fuso: 22S cobre 54°W–48°W; a faixa oeste do Paraná (~54,25°W) fica marginalmente fora, com distorção de escala da ordem de 0,1%. AOI que cruze fusos de forma significativa → reprojeção por fuso.
- Guarda de plausibilidade [0°, 75°] e versão do motor: `gee/versaoMotor.ts`, adaptado de `calcEngineVersion.ts` do Localizador, com versão nova.
- Curvatura de perfil e plana em unidades métricas.
- **Acúmulo de fluxo e TWI:** a fonte do acúmulo (produto hidrológico no GEE ou cálculo a partir do DEM) e sua resolução real entram em D15 e são verificadas antes de adotar. TWI = ln(As / tan β): com β = 0 o índice não existe e o resultado é `indisponivel` com `causa: "fora-do-dominio"` — nunca `Math.max(0,1°)` (S1-10).
- Posição na vertente (planejamento v3 §6.4): **avaliar** nesta fase, com critério de inclusão registrado.
- Base das funções puras: `legado/sarel1/src/lib/gee/terreno.ts`, adaptado (sem data de hoje, sem pisos). Base do encanamento do Earth Engine: `earthEngineClient.ts` do Localizador (`ee.data.authenticateViaPrivateKey` e `ee.initialize`, linhas 82-85; padrão `evaluate`), sem as partes de análise (EPSG:3857, `?? 0` — A8).

### 8.3 Chuva

- `chirps.ts` — série diária; acumulados de 30 e 90 dias **por janela de calendário**, não "os últimos N registros" (como fazia o SAREL 1). `adquiridoEm` = a janela.
- `imerg.ts` — intensidade semi-horária e aproximação do I30, declarada como aproximação.
- `eventos.ts` — critério de evento erosivo, erosividade por evento e índice de mecanismo Σ(erosividade_t × soloNu_t) dependem de D13 (e de D10, para soloNu). **Até a decisão:** acumulados e I30 máximo saem como `medido`; `nEventosErosivos` e `indiceMecanismo` saem `indisponivel` com `causa: "decisao-pendente"`. As fórmulas do SAREL 1 (S1-09) não são usadas.
- Evidência: coleção, banda, unidade e cobertura de cada produto, observadas numa chamada real.

### 8.4 Fundiário

Base: o matcher auditado do Localizador. O serviço do SAREL 1 (`cadastre_service.py`) é descartado (S1-18).

- `fundiario/matcher.ts` ← `lib/fundiario/spatialMatcher.ts`: manter `execFile` com array de argumentos (sem shell); acrescentar o estado `erro-na-consulta`.
- `scripts/spatial_owner_matcher.py`: corrigir os caminhos de falha que hoje produzem `sem-correspondencia` — linhas 427, 472, 482, 491 e 541 (C4). **Preservar** `propertyName = None` (linha 245).
- Enumeração fechada: `encontrado | aproximado | sem-correspondencia | base-nao-disponivel | erro-na-consulta`. `sem-correspondencia` exige prova positiva: consulta executada, base cobre a UF, nenhum polígono contém o ponto. **Nenhum `catch` pode produzi-lo.** O `motivo` é exportado.
- A rota de consulta devolve status e toda a cadeia de consulta (A1).
- `fundiario/protecao.ts`: máscara do SNCR reproduzida byte a byte, CPF/CNPJ nunca divulgado, execução só local.
- Rotas `fundiario/{consulta,fontes,poligono}` ← as quatro rotas do Localizador, com `localOnly`.

### 8.5 Localização — município e bacia

Corrige A2 ("Paraná", "Custom", "Bacia Local" em 150/150 linhas).

- Município: IBGE. **Avaliar** `lib/api/ibgeClient.ts` (Localizador) e `lib/ibge/ibgeService.ts` (SAREL 1), escolher um, verificar ao vivo com evidência.
- Bacia: `src/data/paranaBasins.ts` do Localizador, depois de documentar a origem e a data do dado. Sem origem documentada → `indisponivel`.
- Sem resolução, a célula diz "não determinado — <motivo>", nunca literal de programa.

### 8.6 Testes da Fase 2

- Terreno: escala métrica em EPSG:31982; guarda dispara fora de [0°, 75°]; TWI com β = 0 é indisponível.
- Embrapa: domínio de erodibilidade coberto; classe desconhecida é indisponível.
- Fundiário: **os três estados de falha produzem status distintos e nenhum gera "Sem correspondência"**; testes da máscara do SNCR portados do Localizador.
- Chuva: janela de calendário; `adquiridoEm` nunca é a data da consulta.

### 8.7 Critério de aceite

Três verdes; uma evidência arquivada por serviço (Embrapa, GEE, CHIRPS, IMERG, IBGE); demonstração numérica da projeção arquivada; propostas de D09 entregues ao pesquisador.

---

## 9. Fase 3 — Séries temporais e composto de solo exposto

### 9.1 `serieTemporal.ts`

- Sentinel-2 L2A e, se D05, Landsat harmonizado.
- **Máscaras preservadas** (Regra 7), com o método de P09. Proibido `.unmask(constante)` em banda física. Amostra pequena → ampliar janela ou número de cenas.
- Bandas: B2, B3, B4, B5, B6, B7, B8, B8A, **B11, B12**. Descartar B1 e B9.
- **Janela por modelo (D04):** Modelo D, até a data do rótulo; Modelo P, encerrada antes, com o intervalo de guarda decidido.
- `nObservacoesValidas` por banda; `PRODUCT_ID` de cada cena em `rastreio.cenas`.
- Extração em lotes que respeitem os limites do Earth Engine; tamanho de lote e tempo registrados.

### 9.2 `harmonicos.ts`

Regressão por banda: offset, tendência linear, termos anual e semianual (seno e cosseno), com amplitude e fase derivadas. Sem interpolação sobre vazios. Cada coeficiente carrega `QualidadeAjuste` (nº de observações, R², erro padrão). Observações abaixo do mínimo (D11) → `indisponivel` com `causa: "insuficiente"`. Base: `legado/sarel1/src/lib/gee/harmonicos.ts`, a avaliar.

### 9.3 `estatisticasSerie.ts` *(novo em relação ao v2)*

Percentis 10, 50 e 90, amplitude e desvio por banda (planejamento v3 §6.1, estratégia 2).

### 9.4 `compostoSoloNu.ts`

- Composto com **apenas** as observações de solo descoberto (NDVI < D10), ao longo de todos os anos.
- **Ê** = fração das observações válidas com solo descoberto.
- *(novo em relação ao v2)* **maior sequência contínua de solo descoberto** e **mês modal de exposição** (planejamento v3 §6.1, estratégia 3).
- Pixel sem nenhuma observação de solo descoberto → composto `indisponivel` e Ê = 0 como `modelado` (zero é valor: a série foi observada e nunca esteve descoberta).
- A constante 0,25 do SAREL 1 não é usada (S1-04).

### 9.5 Testes da Fase 3

- Lacuna permanece `NaN`/`indisponivel` do pixel à planilha; nenhuma constante substitui pixel mascarado.
- Série curta → harmônicos `insuficiente`, nunca coeficiente mal condicionado apresentado como medido.
- Ê = 0 com série válida é valor (`modelado`); Ê sem série é `indisponivel`.
- Janelas D e P distintas para o mesmo ponto quando D04 pedir os dois.

---

## 10. Fase 4 — Amostragem e blocos espaciais

### 10.1 `elegibilidade.ts`

← `eligibilityMask.ts` + `eligibilityConstants.ts` do Localizador, **adaptados**:

- declividade vinda de `terreno.ts` (EPSG:31982), no lugar do EPSG:3857 da linha 75;
- AOI em `FeatureCollection` hoje usa só a primeira feição (`eligibilityConstants.ts:147-148`) e descarta as demais em silêncio → unir todas as feições ou recusar com erro;
- cobertura temporal mínima (D11);
- parâmetros P04 e P05 do Registro;
- os `unmask(0)` das máscaras de exclusão (`eligibilityMask.ts:110`, `:123`, `:163`) atuam sobre camadas **categóricas** de exclusão, não sobre bandas físicas. Ficam como exceção da Regra 7 **somente** com comentário que cite a documentação do produto (por exemplo, que a banda `occurrence` do JRC é mascarada onde nunca se detectou água), evidência arquivada e teste.

### 10.2 `estratificacao.ts`

← `legado/sarel1/src/lib/gee/estratificacao.ts`, **adaptado**: parâmetros por argumento, sem default (S1-16); nível K̂ por D09 e dimensões por D12; empates determinísticos; total não excede a meta; déficit de estrato registrado; Φ_diag indisponível quando a amplitude é zero (§3.5); semente registrada (P07).

### 10.3 `thinning.ts`

← `spatialThinning.ts` do Localizador. Hoje ordena por `priorityScore` (linhas 41-45), conceito eliminado. Passa a ordenar por sorteio com a semente registrada, dentro do estrato. Espaçamento P02.

### 10.4 `blocosEspaciais.ts` e `aoiTiling.ts`

- Blocos ← `legado/sarel1/src/lib/gee/blocosEspaciais.ts`, adaptado conforme §3.7: sem piso de 10 km, sem atribuir 20 km a Roberts et al.
- `aoiTiling.ts` ← Localizador, **portar**. As telhas cobrem a caixa envolvente e excedem a AOI; o recorte é feito no Earth Engine.
- Referência de encanamento: `candidateSelector.ts` do Localizador (uso de `stratifiedSample` com `dropNulls: true` e `evaluate`) é **lido**, não portado — sua lógica é descartada (C3, C4, C6, A7).

### 10.5 Marco M1 — primeira amostra real

**Antes de qualquer trabalho com Planet.** Com autorização do pesquisador (consome cota do Earth Engine):

1. AOI real e pequena, escolhida pelo pesquisador (um município, por exemplo).
2. Fases 1 a 4 de ponta a ponta com credencial real: elegibilidade, terreno, solo, série, chuva, estratificação, blocos.
3. Exportar o perfil `planilha` e passar **todos** os invariantes.
4. Relatório de Amostragem com frame, ocupação dos estratos, semente, variograma e aresta do bloco.
5. Evidências arquivadas e Relatório de Fase.

É o primeiro teste que mede veracidade. Todo o resto até aqui é preparação para ele.

### 10.6 Testes da Fase 4

- A amostra cobre **todos os terços de cada dimensão**, não apenas o topo.
- Há pontos nas células de Ŝ e Ê baixos (candidatos a negativo).
- Φ_diag não aparece em nenhum artefato (Invariante 2 em execução).
- A mesma semente reproduz a mesma amostra.
- AOI com várias feições é tratada inteira ou recusada.
- A declividade da elegibilidade e a da feature são idênticas para o mesmo pixel.

---

## 11. Fase 5 — Planet e pares de evento

**Só depois do Marco M1.** O Planet cobre o que o Earth Engine não alcança — revisita diária para pares de evento e 3–5 m para interpretação visual. As features espectrais da matriz vêm do Earth Engine.

### 11.1 Direitos de acesso da conta

Registrados no painel da conta em 08/09/2026 (captura de tela, não documentação — por isso a verificação da §11.2).

**Plano ativo — Education and Research Basic.** `Plan ID 798565` · status **Active** · vigência **06/04/2026 a 05/04/2028** · organização UTFPR.

| Produto | Cota | Consumo em 08/09/2026 | Overage |
|---|---|---|---|
| Scene downloads *(preferred)* | **3.000 km²** | 0% | **OFF** |
| Scene tiles | **100.000 tiles** | 0% | OFF |
| Basemap tiles | 100.000 tiles | 0% | OFF |

- Os três blocos exibiam `23 DAYS LEFT IN MONTH`, sugerindo **ciclo mensal**; a vigência de dois anos seria a do plano, não a da cota. **É leitura de rótulo, não documentação** (D17).
- `OVERAGE: OFF` → ao esgotar a cota, a requisição **falha**. O cliente trata "cota esgotada" como estado próprio e informativo — nunca como falha de rede, nunca como ausência de dado (Regra 2).

**Plano Trial — expirado em 29/04/2026**, com "No active products". Trazia Catalog API, **Statistical API**, Process API, OGC Streaming, 30.000 Processing Units/mês e 30.000 Requests/mês. A Statistical API pode não estar mais acessível.

### 11.2 Verificação antes de qualquer código

Pela rota `/api/verificacao/planet`, com a chave em sessão efêmera, arquivando cada resposta:

1. Statistical API sobre um ponto: responde ou devolve 401/403?
2. O mesmo para Catalog API e Process API.
3. *Item types* e *assets* liberados pelo Education and Research Basic.
4. Área mínima faturável por pedido na Orders API.
5. `Scene tiles` e `Scene downloads` consomem cotas independentes?
6. **Ciclo da cota (D17):** Reports API, documentação do plano ou observação do contador na virada do mês.

**Não construir sobre a Statistical API antes da resposta de (1). Não dimensionar a campanha antes de (6).**

### 11.3 Orçamento e buffer (D18)

Sob a leitura mensal, reservando 20% de contingência: 3.000 − 600 = **2.400 km²/mês** para pares de evento.

| Buffer | Área por ponto | 100 pontos × 3 momentos | Eventos por mês em 2.400 km² |
|---|---|---|---|
| 500 m | 1,00 km² | 300 km² | 8 |
| **250 m** | **0,25 km²** | **75 km²** | **32** |
| 150 m | 0,09 km² | 27 km² | 88 |

Recomendação: **250 m**, salvo se a área mínima faturável (§11.2, item 4) for maior. A 3–5 m, a janela de 500 × 500 m tem de 100×100 a 166×166 pixels — contexto suficiente para situar o ponto na vertente e ver deposição em sopé. Se a cota for **total**, os mesmos 250 m permitem 32 eventos **no projeto inteiro**.

### 11.4 Script de viabilidade — antes do desenho

Cruzar os eventos CHIRPS/IMERG com o arquivo Planet disponível e **contar os pares utilizáveis** (fração limpa na AOI do ponto segundo o UDM2, dentro da janela, com comparabilidade). O resultado decide se o eixo de eventos é central ou ilustrativo (D19). Roda antes de comprometer cota.

### 11.5 Tiles para interpretar, download para medir

| Necessidade | Recurso | Cota |
|---|---|---|
| **Fase A — interpretação visual** | Scene tiles via Tiles API / OGC Streaming | tiles |
| Contexto temporal amplo | Basemap tiles | tiles |
| **Pares de evento com valor de pixel** | Scene downloads com recorte | km² |
| Features espectrais da matriz | Earth Engine (Sentinel-2, Landsat) | nenhuma |

A interpretação visual não precisa de download: o intérprete olha a imagem, não os valores de pixel.

### 11.6 Módulos

Os módulos do SAREL 1 (`legado/sarel1/src/lib/planet/`) nunca chamaram a API. São **avaliados depois da §11.2**, contra as respostas reais.

| Módulo | Função |
|---|---|
| `planet/dataApi.ts` | busca no catálogo (`PSScene`), assets `ortho_analytic_8b_sr` e `udm2`, se confirmados em §11.2. Filtro pela **fração limpa dentro da AOI** do ponto, não pelo percentual de nuvem da cena; limiar P06 |
| `planet/ordersApi.ts` | pedido com recorte ao buffer e harmonização com Sentinel-2 |
| `planet/tiles.ts` | visualização para a Fase A, com data de aquisição exibida |
| `planet/quota.ts` | **livro-razão persistente** em `data/planet/` (não versionado), reconciliado com a Reports API se acessível. Estima antes de pedir, **bloqueia** o que ultrapassa o saldo, exige confirmação explícita do usuário antes de cada envio, trata cota esgotada como estado próprio. A versão do SAREL 1 guardava o saldo em memória e o zerava a cada reinício (S1-14) |
| `gee/sentinel1.ts` | Sentinel-1 GRD no Earth Engine para o T0, sob nuvem |
| `planet/paresEvento.ts` | montagem retrospectiva (abaixo) |

```
T-   cena limpa mais proxima anterior ao evento
T0   0-2 dias   Sentinel-1 garantido + Planet se houver janela
T+   7-15 dias  solo ja seco, padrao de redistribuicao
```

Comparabilidade: mesmo sensor, geometria próxima, estágio fenológico semelhante — senão a diferença medida é crescimento da cultura.

**Demais APIs:** Features API para registrar as AOIs uma vez e evitar divergência entre a AOI da busca e a do pedido; Quota Reservations API, se acessível; Reports API para acompanhar o consumo. Subscriptions, Basemaps, Tasking e Analytics estão fora do escopo.

### 11.7 Testes da Fase 5

- Pedido acima do saldo é bloqueado com mensagem explícita.
- O saldo sobrevive a reinício do servidor.
- Cota esgotada produz estado próprio, distinto de falha de rede e de "sem cena".
- Nenhum pedido é enviado sem confirmação.
- Fração limpa é calculada dentro da AOI do ponto.

---

## 12. Fase 6 — Rótulos e matriz de treino

Depende de D02 e D03. É a fase que produz o resultado final do sistema.

### 12.1 Ingestão

| Módulo | Origem | Ação |
|---|---|---|
| `rotulos/ingestaoKobo.ts` | `lib/utils/koboParser.ts` (Localizador) + `lib/rotulos/ingestaoKobo.ts` (SAREL 1) | adaptar — casa por código e por coordenada (raio P03), preserva as respostas como vieram do formulário |
| `rotulos/ingestaoInterpretacao.ts` | SAREL 1 | adaptar — dois intérpretes independentes, leituras mantidas separadas |
| `rotulos/ingestaoDrone.ts` | SAREL 1 | adaptar — `modalidade: "drone"`, conjunto *held-out*, **jamais** misturado ao treino |
| `app/api/rotulos/importar/route.ts` | SAREL 1 | adaptar — restrita a execução local |

Todo rótulo exige `modalidade`, `observador`, `observadoEm` e `cego`.

### 12.2 `rotulos/concordancia.ts`

← SAREL 1, **adaptado** (S1-13):

- Kappa de Cohen com patamares de Landis & Koch e intervalo de confiança; Kappa < 0,60 emite **alerta bloqueante**.
- Sem pares → Kappa **ausente** (`null`), não 0.
- Divergência sem desempate → `final: null`; o ponto **não entra** na matriz e é contado no relatório como pendente.
- Consolidação não inventa confiança: se os observadores discordam na confiança, as duas ficam registradas nas origens.

### 12.3 Taxa de erro da interpretação *(novo em relação ao v2)*

Na subamostra com rótulo de campo (Fase B) e de interpretação (Fase A), a matriz de confusão A × B e a taxa de erro por classe. É o insumo da ponderação ou correção prevista para o treino (planejamento v3 §8, Fase C). Sem este produto, a Fase B não cumpre sua função.

### 12.4 `matriz/montagem.ts`

← SAREL 1, **adaptado**:

- Projeção pelo perfil `matriz-treino` (§7.8); a exclusão é garantida pela lista de permissão e verificada pelo Invariante 2.
- Uma matriz por modelo quando D04 pedir D e P.
- Linhas *held-out* de drone em arquivo próprio; coordenadas em arquivo de chaves; proveniência em arquivo próprio com a mesma chave.
- Ausente = célula vazia (o XGBoost trata ausência nativamente), nunca imputação.

### 12.5 Testes da Fase 6

- Nenhuma coluna calculada pelo sistema (Φ_diag, score, perda, fatores RUSLE, estrato, tipologia) entra na matriz — verificado em execução.
- Rótulo sem `modalidade`, `observador` ou `observadoEm` é recusado.
- Rótulo com `cego: false` é aceito e **sinalizado** no Relatório de Qualidade.
- Kappa confere com caso conhecido; sem pares, é ausente.
- Divergência pendente não entra na matriz.
- Conjunto de drone permanece segregado.
- Matriz de confusão A × B só usa pontos com as duas modalidades.

---

## 13. Fase 7 — Interface

### 13.1 Base

A interface do Localizador era boa em navegação, mapa e fluxo de trabalho (`docs/legado/design.md`, telas em `docs/images/`). **Aproveita-se o que funcionava e retira-se o que afirmava resultado.** Os componentes do SAREL 1 que portavam modais do Localizador não são usados: parte-se do original do Localizador, para não adaptar cópia de cópia.

| Tela do Localizador | Destino no SAREL | Ação |
|---|---|---|
| Mapa 2D/3D, basemaps, camadas, relevo (`MapViewer`, `MapControls`) | `mapa/MapaAmostral` | adaptar — pontos coloridos por **estrato**, nunca por severidade; sem mapa de calor de "risco"; camadas WMS da Embrapa só como contexto visual |
| Seletor Top-N, cards de "perda média", distribuição de severidade, "Recalcular" | — | descartar — Top-N e severidade deixam de existir; o recálculo em lote era a rota do C5(d) |
| Lista de pontos e filtros (`PointCardList`, `FiltersPanel`, `Sidebar`) | `mapa/` | adaptar — filtros por estrato, declividade, status de rotulagem e bloco; alternador "colorir por completude de dado" |
| Credenciais (`SettingsModal`, `GcpCredentialsManager`, `ApiTokensManager`) | `config/` | adaptar — incluir a chave Planet; remover SmartSolos |
| Delimitação de polígonos e talhões (`DrawingToolbar`, `PolygonManagerModal`) | `aoi/` | adaptar |
| Seleção de região e AOI (`RegionRequestModal`) | `aoi/` | adaptar |
| Projetos salvos (`SavedDatasetsModal`) | `campanha/` | adaptar — a reidratação passa pela guarda antissintético |
| Inspeção do ponto (`PointPopup`) | `inspetor/InspetorPonto` | reescrever, a partir do esboço do SAREL 1 |
| Dossiê e laudo (`AuditDossierModal`, `auditPdfGenerator`) | `relatorios/DossiePonto` | reescrever — defaults `k ?? 0,035` e `c ?? 0,28`, rótulo "Perda de Solo Calculada" (C1), script em EPSG:3857 |
| Exportação (`ExportModal`, `DataManagerModal`) | `campanha/Exportacao` | reescrever por perfil (§7.8) |
| Triagem de candidatos (`CandidateSelectionModal`) | `aoi/Amostragem` | reescrever — parâmetros vindos do Registro e relatório de ocupação dos estratos |
| Diagnóstico e logs (`SystemLogsModal`, `SystemLogCapture`) | `diagnostico/` | portar |

### 13.2 Inspetor de Ponto — a tela central

Todas as variáveis com selo de proveniência: ● `medido` (verde, sólido) · ◊ `modelado` (azul, losango) · □ `tabelado` (amarelo, quadrado) · ○ `indisponivel` (cinza, círculo aberto), com a **causa** da indisponibilidade visível. Unidade pedológica em associação exibe a ressalva de confiança média. **Série temporal com lacuna desenhada como descontinuidade** — interpolar visualmente é mentir na tela.

### 13.3 Painéis

- **Matriz de Treino:** completude por feature, balanço de classes com prevalência explícita, distribuição por estrato e bloco, Kappa, taxa de erro A × B, alerta de baixa variância (P08).
- **Campanha:** status (a rotular / em campo / rotulado / validado), por observador e modalidade; um botão de exportação cega por perfil, com aviso do que é omitido; importação de rótulos; roteirização (Mapbox Directions — fora do caminho analítico); consumo da cota Planet, saldo e dias restantes.
- **Comparador de Evento:** T− e T+ lado a lado, evento marcado na linha do tempo com o I30, cursor sincronizado.
- **Decisões** *(novo)*: leitura do Registro — D01 a D19 e P01 a P09, com estado e o que cada pendência trava. Alteração só pelo pesquisador, no arquivo.

### 13.4 Relatórios

1. **Qualidade do Dado** — completude e proveniência por variável, com a indisponibilidade separada por causa.
2. **Reprodutibilidade da Amostragem** — frame, estratos, terços, semente, variograma, aresta do bloco, versão do motor e **as decisões em vigor, com seus IDs**.
3. **Dossiê do Ponto** (PDF) — ficha completa para anexo de dissertação.

### 13.5 Verificação manual

Selos refletindo a origem real; lacunas como descontinuidade; exportação cega sem feature, estrato, Φ ou rótulo de outra modalidade; Relatório de Amostragem com semente, variograma e aresta. `docs/design.md` do SAREL redigido ao fim da fase.

---

## 14. Fase 8 — Linha de base RUSLE

Desbloqueada **para o Fator C** (D01). R, K e LS aguardam D13, D14 e D15 (§3.8).

### 14.1 Fator C

```ts
/**
 * Fator C de uso e manejo do solo.
 * Durigon, V. L. et al. (2014). NDVI time series for monitoring RUSLE cover
 * management factor in a tropical watershed. Int. J. of Remote Sensing, 35(2).
 *
 * C = (1 - NDVI) / 2
 *
 * Não usa BSI. A versão legada empregava esta mesma expressão elevada a
 * (1 + BSI), o que invertia a resposta física. Sem corte: NDVI fora de [-1, 1]
 * indica erro a montante e lança, em vez de ser corrigido em silêncio.
 */
export function calcularFatorC(ndvi: number): number {
  if (!Number.isFinite(ndvi) || ndvi < -1 || ndvi > 1) {
    throw new ErroForaDoDominio(`NDVI ${ndvi} fora do domínio [-1, 1]`);
  }
  return (1 - ndvi) / 2;
}
```

O invólucro com proveniência converte o erro em `indisponivel` com `causa: "fora-do-dominio"`.

```ts
it("C decresce estritamente com o NDVI", () => {
  const cs = [-0.2, 0.05, 0.2, 0.4, 0.6, 0.8, 0.95].map(calcularFatorC);
  for (let i = 1; i < cs.length; i++) expect(cs[i]).toBeLessThan(cs[i - 1]);
});

it("C permanece em [0, 1] em todo o domínio", () => {
  for (const n of [-1, -0.5, 0, 0.5, 0.99, 1]) {
    const c = calcularFatorC(n);
    expect(c).toBeGreaterThanOrEqual(0);
    expect(c).toBeLessThanOrEqual(1);
  }
});

it("reproduz os valores de referência", () => {
  expect(calcularFatorC(0.0)).toBeCloseTo(0.5, 6);
  expect(calcularFatorC(0.5)).toBeCloseTo(0.25, 6);
  expect(calcularFatorC(1.0)).toBeCloseTo(0.0, 6);
});

it("NDVI fora do domínio lança em vez de ser cortado", () => {
  expect(() => calcularFatorC(1.2)).toThrow();
  expect(() => calcularFatorC(Number.NaN)).toThrow();
});

it("não aceita BSI — a extensão legada foi removida", () => {
  expect(calcularFatorC.length).toBe(1);
});
```

O teste de monotonicidade em BSI do plano v1 era vacuoso com esta fórmula e foi **removido**.

### 14.2 Fator P

`{ estado: "tabelado", valor: 1.0, tabela: "Renard et al. (1997) — P = 1 quando a prática é desconhecida", chave: "sem-pratica-informada" }`, nunca `medido`. Outros valores de P só com a prática observada e referência que considere a declividade; os valores fixos do SAREL 1 (0,5 e 0,2) não são usados.

### 14.3 Análise de sensibilidade *(recomendada)*

Calcular a linha de base também com van der Knijff et al. (2000) e reportar quanto a comparação com o XGBoost muda. Se o modelo supervisionado superar a RUSLE sob as duas formulações, a conclusão é robusta à escolha.

Demonstração com valores **ilustrativos** (R = 6800, K = 0,020, LS = 1,405, P = 1,0):

| NDVI | A — Durigon | A — van der Knijff |
|---|---|---|
| 0,15 | 81,21 | 134,26 |
| 0,35 | 62,10 | 65,09 |
| 0,55 | 42,99 | 16,58 |
| 0,75 | 23,89 | **0,47** |

As duas ordenam o Fator C da mesma forma, mas comprimem a faixa de modo muito diferente — o que pode alterar a ordenação de A quando os demais fatores variam.

### 14.4 Coerência

`perdaSolo` só existe se os cinco fatores e a memória de cálculo existirem; a memória mostra a proveniência de cada fator. O Invariante 1 passa a estar ativo. **Nenhuma fórmula ausente da literatura** — nem para R, nem para eventos, nem para "fração erosiva".

### 14.5 Testes da Fase 8

Os da §14.1; P sempre `tabelado`; com D13, D14 ou D15 pendente, `perdaSolo` é `indisponivel` com `causa: "decisao-pendente"`; Invariante 1 ativo sobre um conjunto real.

---

## 15. Fase 9 — Encerramento

1. Inventário 100% resolvido → `git rm -r legado/` num único commit. A tag `legado-pre-sarel` preserva tudo.
2. Documentação nova: README, manual de instalação (reaproveitando as instruções ainda válidas da base fundiária e das credenciais em `docs/legado/`), manual de operação, `docs/design.md` do SAREL e um mapa de cálculos com fórmula, referência e decisão de cada variável.
3. Renomear o pacote (`package.json`) e os lançadores.
4. Definir com o pesquisador qual branch passa a ser a principal.
5. Validação final (§17.3) e relatório final honesto: o que foi feito, com evidência; o que ficou pendente e por quê; decisões ainda abertas; defeitos novos encontrados.

A `Tabela_Consolidada_Parana_Todo_o_Estado_150focos_2026-09-04.xlsx` é **inválida** como resultado: foi importada de GeoJSON, nunca passou pelo Earth Engine e carrega os defaults do importador. Não é reemitida; o SAREL produz artefatos novos.

---

## 16. Correções de consistência em relação ao v2

| # | No v2 | Neste plano |
|---|---|---|
| 1 | §13.2 numerada duas vezes (sensibilidade e demais fatores) | §14.3 e §3.8 |
| 2 | §15 dizia "Fase 8 após decisão sobre o Fator C", já decidido | C decidido; R, K e LS pendentes (§3.8) |
| 3 | §4.2 renomeava o cliente para `soilClient.ts`, quebrando o import do teste verificado | nome original `embrapaSoilClient.ts` mantido |
| 4 | §14.1 citava `rusle/baseline.test.ts` sem módulo `baseline.ts` | `rusle/fatores.ts` e `rusle/baseline.ts`, com testes de mesmo nome |
| 5 | Invariante 2 checava a faixa de Φ_diag, que nunca chega ao artefato | lista de permissão por perfil (§7.8, §7.9) |
| 6 | Invariante 7 sem regra para valores vazios | não evadível por lacuna; todas as colunas do artefato (S1-12) |
| 7 | Limiar de NDVI e cobertura temporal mínima usados sem definição | D10 e D11 |
| 8 | Estratificação Ŝ × Ê × K̂ diverge do planejamento v3 §7.2 sem registrar a divergência | D12 |
| 9 | Pontos do planejamento v3 §12 ausentes: Modelo D × P (#3), associação pedológica (#6), campo e voos (#9) | D04, D08, D16 |
| 10 | Features do planejamento v3 §6.1 ausentes: estatísticas de distribuição, maior sequência de solo descoberto, mês modal | §9.3 e §9.4 |
| 11 | Sentinel-1 para o T0 sem módulo | `gee/sentinel1.ts` (§11.6) |
| 12 | Fator R sem formulação; "K categórico" contradizia o cálculo de A | D13 e D14 |
| 13 | Exportação de campo cega só para predição e score | cega também para rótulo de outra modalidade (§6, §7.8) |
| 14 | Fase B sem produto que meça o erro da interpretação | matriz de confusão A × B (§12.3) |
| 15 | Cota Planet sem lugar definido para o saldo | livro-razão persistente (§11.6) |
| 16 | `adquiridoEm` sem semântica | data do dado na fonte; `consultadoEm` separado (§7.1) |
| 17 | "Verificado em" aceito sem prova | evidência arquivada e teste (§7.6) |
| 18 | Declividade sem exigência de função única | `terreno.ts` para elegibilidade, estratificação e features (§8.2) |
| 19 | Fallback de 20 km sem dizer que é contingência | P01, sem atribuição a Roberts et al. |
| 20 | `ClasseRotulo` definido no tipo apesar de "provisório" | criado só após D03 |

---

## 17. Plano de verificação

### 17.1 Após cada fase

```bash
npm run test && npx tsc --noEmit && npm run lint
```

Nas fases com interface, também `npm run build`. **Nunca** desativar teste, usar `skip` ou afrouxar asserção para passar. Exceções aos padrões proibidos (§7.5) listadas no Relatório de Fase.

### 17.2 Testes por módulo

| Arquivo | Verifica |
|---|---|
| `seguranca/padroesProibidos.test.ts` | nenhum padrão proibido fora de exceção justificada; meta-teste |
| `seguranca/verificacoes.test.ts` | toda afirmação de verificação cita evidência existente; meta-teste |
| `seguranca/importacoes.test.ts` | nada importa de `legado/`; meta-teste |
| `seguranca/guardaSintetico.test.ts` | nenhuma saída nem reidratação escapa da guarda |
| `config/decisoes.test.ts` | decisão pendente → indisponível com ID; decisão tomada completa |
| `matriz/invariantes.test.ts` | 150 linhas idênticas recusadas, também com lacuna e com coluna nova; os 7 invariantes |
| `matriz/perfis.test.ts` | cada perfil recusa coluna fora da lista de permissão |
| `export/planilha.test.ts` | 3 abas; `0` preservado; `_Origem`; máscara do SNCR; LGPD |
| `export/dms.test.ts` | DMS do mesmo número arredondado; *rollover* |
| `embrapa/embrapaSoilClient.test.ts` | os 19 originais, intactos; cobertura do mapa ordinal após D09 |
| `gee/terreno.test.ts` | EPSG:31982; guarda [0°, 75°]; TWI com β = 0 indisponível |
| `gee/elegibilidade.test.ts` | declividade da mesma função; AOI com várias feições; exceção da Regra 7 documentada |
| `gee/estratificacao.test.ts` | todos os terços; candidatos a negativo; semente; total ≤ meta; Φ_diag indisponível com amplitude zero |
| `gee/harmonicos.test.ts` | `QualidadeAjuste`; série curta → insuficiente |
| `chuva/*.test.ts` | janela de calendário; `adquiridoEm` da fonte; eventos indisponíveis até D13 |
| `fundiario/matcher.test.ts` | três falhas distintas; nenhuma gera "Sem correspondência" |
| `planet/quota.test.ts` | bloqueio, persistência, cota esgotada como estado próprio |
| `rotulos/concordancia.test.ts` | Kappa contra caso conhecido; sem pares → ausente; pendente fora da matriz |
| `matriz/montagem.test.ts` | nenhuma coluna calculada pelo sistema na matriz; drone segregado |
| `rusle/fatores.test.ts` | §14.1; P tabelado |
| `rusle/baseline.test.ts` | coerência da perda; indisponível com decisão pendente |

### 17.3 Critério de conclusão do sistema

- Todos os invariantes passam sobre um conjunto **real** extraído do Earth Engine.
- A Aba de Qualidade mostra a proveniência efetiva de cada variável, com a indisponibilidade separada por causa.
- As exportações cegas não têm feature, estrato, Φ nem rótulo de outra modalidade.
- Nenhuma coluna numérica tem valor idêntico em todas as linhas.
- Toda fórmula tem referência em docstring e teste **de comportamento**.
- Todo serviço externo tem evidência arquivada e datada.
- Nenhum código usa decisão pendente sem devolver `indisponivel`.
- `legado/` removida e inventário 100% resolvido.

---

## 18. Ordem de execução

```
Fase -1  Preparacao do repositorio        autorizacao do pesquisador; push com confirmacao
Fase 0   Definicao do rotulo              BLOQUEANTE para a coleta - pesquisador e orientador
         (as Fases 1 a 4 correm em paralelo a Fase 0)
Fase 1   Fundacao: tipos, Registro, guardas, invariantes, planilha, evidencia da Embrapa
Fase 2   Fontes verificadas: Embrapa, terreno, chuva, fundiario, localizacao
Fase 3   Series temporais e composto de solo exposto
Fase 4   Amostragem e blocos espaciais
         >> MARCO M1: primeira amostra real, todos os invariantes
Fase 5   Planet e pares de evento (verificacao e viabilidade primeiro)
Fase 6   Rotulos e matriz de treino
Fase 7   Interface
Fase 8   Linha de base RUSLE (C decidido; R, K e LS aguardam D13 a D15)
Fase 9   Encerramento: remover legado/, documentacao, validacao final
```

**Decisões e fases.** Uma fase pode ser **construída** com decisão pendente — o código devolve `indisponivel` com o ID. Mas só é **concluída** quando as decisões abaixo estiverem tomadas:

| Marco | Decisões necessárias |
|---|---|
| Fase 2 | D08, D09 |
| Marco M1 (fim da Fase 4) | D04, D05, D06, D07, D10, D11, D12; P01 a P05, P07, P09 |
| Fase 5 | D17, D18, D19, P06 |
| Fase 6 | D02, D03, D16, P03 |
| Fase 8 | D13, D14, D15 |

---

## Apêndice A — Inventário do legado

Semente do `INVENTARIO_LEGADO.md`. Arquivos agrupados quando têm o mesmo destino; o inventário da Fase −1 os desdobra, um por linha, e acrescenta as colunas de status e commit. "+ teste" indica o `.test.ts` colocalizado.

### A.1 Localizador — `legado/localizador/src/`

**Aplicação e rotas**

| Arquivo | Ação | Destino / motivo | Fase |
|---|---|---|---|
| `app/layout.tsx`, `app/page.tsx`, `app/globals.css` | reescrever | casca na Fase −1; layout real na Fase 7 | −1, 7 |
| `app/favicon.ico`, `app/icon.png` | portar | — | −1 |
| `app/api/auth/gee-session/route.ts` | adaptar | → `api/auth/session`; generalizar para Planet e tokens | 1 |
| `app/api/auth/gee-test/route.ts` | adaptar | incorporado a `api/auth/session` (teste de credencial) | 1 |
| `app/api/auth/token-test/route.ts` | adaptar | remover SmartSolos, incluir Planet | 5 |
| `app/api/gee/analyze-point/route.ts` | descartar | uma das quatro rotas paralelas (A1, C5b) | — |
| `app/api/gee/select-candidates/route.ts`, `app/api/gee/replace-candidate/route.ts` | descartar | dependem de `candidateSelector` | — |
| `app/api/gee/token-test/route.ts` | descartar | coberto por `api/auth/session` | — |
| `app/api/fundiario/match/route.ts`, `app/api/fundiario/batch-match/route.ts` | adaptar | → `api/fundiario/consulta` (C4, A1) | 2 |
| `app/api/fundiario/fontes/route.ts` | adaptar | "disponíveis nesta instalação" (M2) | 2 |
| `app/api/fundiario/polygon/route.ts` | adaptar | → `api/fundiario/poligono` | 2 |

**Componentes**

| Arquivo | Ação | Destino / motivo | Fase |
|---|---|---|---|
| `components/audit/AuditDossierModal.tsx` | reescrever | → `relatorios/DossiePonto`; defaults `k ?? 0,035` e `c ?? 0,28` (:152-154); EPSG:3857 (:193) | 7 |
| `components/config/ApiTokensManager.tsx`, `GcpCredentialsManager.tsx`, `SettingsModal.tsx` | adaptar | → `config/`; Planet dentro, SmartSolos fora | 7 |
| `components/config/DataIngestionDropzone.tsx` | adaptar | ponto importado entra só com coordenada; toda feature `indisponivel` até ser extraída (C1, A3, A4) | 7 |
| `components/config/KoboFieldImport.tsx` | adaptar | → `campanha/` | 6 |
| `components/data/DataManagerModal.tsx` | reescrever | 92 KB; CSV sem metadados (M1) | 7 |
| `components/diagnostics/SystemLogCapture.tsx`, `SystemLogsModal.tsx` | portar | → `diagnostico/` | 7 |
| `components/export/ExportModal.tsx` | reescrever | → `campanha/Exportacao`, por perfil | 7 |
| `components/layout/Header.tsx` | adaptar | sem "focos triados" nem atalhos de severidade | 7 |
| `components/map/MapViewer.tsx`, `MapControls.tsx` | adaptar | → `mapa/`; cor por estrato; sem mapa de calor de risco | 7 |
| `components/map/PointPopup.tsx` | reescrever | → `inspetor/InspetorPonto` | 7 |
| `components/polygon/DrawingToolbar.tsx`, `PolygonManagerModal.tsx` | adaptar | → `aoi/` | 7 |
| `components/region/CandidateSelectionModal.tsx` | reescrever | → `aoi/Amostragem`; Top-N eliminado | 7 |
| `components/region/RegionRequestModal.tsx` | adaptar | → `aoi/` | 7 |
| `components/saved/SavedDatasetsModal.tsx` | adaptar | → `campanha/`; guarda na reidratação | 7 |
| `components/sidebar/BatchGeeCalculator.tsx` | descartar | C5(d) | — |
| `components/sidebar/FiltersPanel.tsx`, `PointCardList.tsx`, `Sidebar.tsx` | adaptar | → `mapa/`; sem perda nem severidade | 7 |
| `components/sidebar/RegionAndTopNSelector.tsx` | descartar | Top-N; a parte de região vai para `aoi/` | 7 |
| `components/sidebar/StatsOverview.tsx` | reescrever | "perda média" e distribuição de severidade | 7 |

**Dados e bibliotecas**

| Arquivo | Ação | Destino / motivo | Fase |
|---|---|---|---|
| `data/paranaBasins.ts`, `data/paranaBoundary.ts` | avaliar | → `localizacao/dados/`, depois de documentar origem e data | 2 |
| `data/regionsData.ts` | avaliar | risco de literal de macrorregião (A2) | 2 |
| `lib/api/ibgeClient.ts` | avaliar | comparar com `ibgeService.ts` do SAREL 1 → `localizacao/municipio` | 2 |
| `lib/embrapa/embrapaSoilClient.ts` + teste | **portar intacto** | referência verificada; só o comentário de evidência muda (Fase 1) | −1 |
| `lib/embrapa/smartSolosClient.ts` | descartar | classifica perfis a partir de horizontes que o projeto não coleta; integração decorativa | — |
| `lib/fundiario/spatialMatcher.ts` + teste | adaptar | → `fundiario/matcher.ts`; `erro-na-consulta` (C4) | 2 |
| `lib/gee/aoiTiling.ts` + teste | portar | — | 4 |
| `lib/gee/calcEngineVersion.ts` + teste | adaptar | → `gee/versaoMotor.ts`, versão nova | 2 |
| `lib/gee/candidateSelector.ts` | descartar | C3, C4, C6, A7, M5 — lido como referência de encanamento | — |
| `lib/gee/earthEngineClient.ts` | adaptar em parte | inicialização e `evaluate` → `gee/client.ts`; análise descartada (M5, A8) | 2 |
| `lib/gee/eligibilityConstants.ts`, `eligibilityMask.ts` + teste | adaptar | → `gee/elegibilidade.ts`; EPSG:3857 (:75); `FeatureCollection` (:147-148); exceção da Regra 7 | 4 |
| `lib/gee/googleAuth.ts` + teste | portar | → `gee/auth.ts` | 1 |
| `lib/gee/sessionStore.ts` + teste | adaptar | → `seguranca/sessaoEfemera.ts` | 1 |
| `lib/gee/spatialThinning.ts` + teste | adaptar | → `gee/thinning.ts`; ordenação por `priorityScore` (:41-45) | 4 |
| `lib/gee/stratification.ts`, `stratificationConstants.ts` + teste | descartar | limiares absolutos de 6% e 12%; grupo de solo default 0; `inferPedologyClass` (A5); Φ ponderado | — |
| `lib/gee/verifyEarthEngineAccess.ts` | adaptar | → `api/verificacao/gee` | 2 |
| `lib/pdf/auditPdfGenerator.ts` + teste | reescrever | → `relatorios/DossiePonto`; defaults (:628-630); "Perda de Solo Calculada" (:737, C1) | 7 |
| `lib/rusle/rainfallErosivity.ts` + teste | descartar | climatologia sem I30; constantes regionais (D13) | — |
| `lib/rusle/rusleCalculator.ts` + teste | descartar | Fator C invertido (C2); severidade e Φ | — |
| `lib/rusle/soilErodibility.ts` + teste, `soilGridsClient.ts` | descartar | SoilGrids nulo no Brasil; tabela SiBCS aproximada (D14) | — |
| `lib/security/localOnly.ts` + teste | portar | → `seguranca/localOnly.ts` | 1 |
| `lib/store/useErosionStore.ts` + teste | reescrever | → `store/useSarelStore.ts`; `bsi ?? 0,3`, `ndvi ?? 0,35` (:533-534); espelho plano do ponto | 7 |
| `lib/utils/auditTableExport.ts` + teste | adaptar | → `export/planilha.ts`; preservar `resolveBlockF`, máscara SNCR, LGPD; M1, M2, M3, M6 | 1 |
| `lib/utils/batchEnrichment.ts` + teste | descartar | C7, A6 | — |
| `lib/utils/exportUtils.ts` | reescrever | → `export/geo.ts`; "Score 125/100" (C3) | 7 |
| `lib/utils/geoUtils.ts` + teste | adaptar | → `export/dms.ts` (M4) e `localizacao/` | 1 |
| `lib/utils/koboParser.ts` + teste | adaptar | → `rotulos/ingestaoKobo.ts` (P03) | 6 |
| `lib/utils/parsers.ts` + teste | descartar | C1, A3, A4 | — |
| `lib/utils/shapefileExport.ts` + teste | adaptar | → `export/geo.ts`; `?? 0` (:603-608, M7) | 7 |
| `lib/utils/xlsxWriter.ts` | portar | → `export/xlsxWriter.ts` | 1 |
| `types/erosion.ts` | descartar | substituído por `proveniencia`, `ponto`, `rotulo`; a lógica de `isSyntheticPoint` vai para a guarda | 1 |

**Fora de `src/` (permanecem no lugar)**

| Arquivo | Ação | Motivo | Fase |
|---|---|---|---|
| `scripts/spatial_owner_matcher.py` | adaptar no lugar | C4 (:427, :472, :482, :491, :541); preservar `propertyName = None` (:245) | 2 |
| `scripts/ingest_*.py`, `ingest_data.py`, `verificar_cobertura.py`, `conferir_fontes.py`, `get_fontes_dados.py`, `repopular_fontes_dados.py`, `get_property_polygon.py` | manter | pipeline da base fundiária, já auditado | — |
| `scripts/check-build-freshness.mjs`, `install_shortcut.ps1`, `uninstall_shortcut.ps1`, lançadores `.bat` | manter | renomear na Fase 9 | 9 |
| `generate_*.py`, `scripts/generate_presentation.py`, `.pptx` | manter | apresentação; fora do escopo | — |

### A.2 SAREL 1 — `legado/sarel1/` (commit `9808c46`; caminhos relativos a `src/`, exceto `docs/`)

| Arquivo | Ação | Destino / motivo | Fase |
|---|---|---|---|
| `types/proveniencia.ts`, `types/ponto.ts`, `types/rotulo.ts` | adaptar | §7.1 | 1 |
| `lib/seguranca/guardaSintetico.ts` + teste | adaptar | unir à semântica do Localizador | 1 |
| `lib/matriz/invariantes.ts` + teste | adaptar | S1-12; Invariante 2 redefinido; operar sobre o artefato | 1 |
| `lib/matriz/montagem.ts` + teste | adaptar | perfis; D04 | 6 |
| `lib/export/planilha.ts` + teste | avaliar | referência do formato `_Origem`; a base é a do Localizador | 1 |
| `lib/export/xlsxWriter.ts` | descartar | só reexporta `planilha.ts`; o escritor real é o do Localizador | — |
| `lib/export/geoConversao.ts` + teste | avaliar | → `export/geo.ts` | 7 |
| `lib/embrapa/soilClient.ts` + teste | descartar | S1-03, S1-04, S1-05; a função de mapa ordinal pode ser apresentada como **proposta** em D09 | — |
| `lib/gee/terreno.ts` + teste | adaptar | funções puras; S1-10, S1-11 | 2 |
| `lib/gee/estratificacao.ts` + teste | adaptar | S1-16; §3.5 | 4 |
| `lib/gee/blocosEspaciais.ts` + teste | adaptar | S1-15; §3.7 | 4 |
| `lib/gee/serieTemporal.ts` + teste, `harmonicos.ts`, `compostoSoloNu.ts` | avaliar | funções puras sem extração real; limiar 0,25 (S1-04) | 3 |
| `lib/gee/elegibilidade.ts` | descartar | a máscara real é a do Localizador | — |
| `lib/gee/auth.ts`, `lib/gee/client.ts` | descartar | sem Earth Engine; S1-02 | — |
| `lib/chuva/chirps.ts`, `lib/chuva/imerg.ts` | avaliar | funções puras; S1-02, S1-11; janela por registros | 2 |
| `lib/chuva/eventos.ts` + teste | descartar as fórmulas | S1-09; D13 | 2 |
| `lib/planet/dataApi.ts`, `ordersApi.ts`, `paresEvento.ts`, `quota.ts`, `planet.test.ts` | avaliar após §11.2 | nunca chamaram a API; S1-14 | 5 |
| `lib/rotulos/concordancia.ts` + teste | adaptar | S1-13 | 6 |
| `lib/rotulos/ingestaoKobo.ts`, `ingestaoInterpretacao.ts`, `ingestaoDrone.ts`, `ingestao.test.ts` | adaptar | — | 6 |
| `lib/rusle/fatores.ts`, `lib/rusle/baseline.test.ts` | descartar | S1-06 a S1-10 | — |
| `lib/fundiario/matcher.ts`, `protecao.ts`, `matcher.test.ts` | avaliar | a base é a do Localizador | 2 |
| `lib/fundiario/cadastre_service.py`, `cadastreService.test.ts` | descartar | S1-18 | — |
| `lib/ibge/ibgeService.ts` + teste | avaliar | com `ibgeClient.ts` | 2 |
| `lib/dados/pontosExemplo.ts` | descartar | S1-01 | — |
| `lib/dados/estadosBrasil.ts`, `fronteiraParana.ts`, `municipiosParana.ts` | avaliar | origem a documentar | 2 |
| `store/useSarelStore.ts` + teste | avaliar | sem geração de pontos; guarda na reidratação | 7 |
| `app/api/auth/session/route.ts` + teste | avaliar | a base é a do Localizador | 1 |
| `app/api/fundiario/consulta/route.ts` | descartar | depende de `cadastre_service.py` | — |
| `app/api/rotulos/importar/route.ts` + teste | adaptar | — | 6 |
| `app/page.tsx`, `layout.tsx`, `globals.css`, `favicon.ico` | descartar | casca própria na Fase −1 | — |
| `app/error.tsx`, `global-error.tsx`, `not-found.tsx` | avaliar | — | 7 |
| `components/inspetor/InspetorPonto.tsx`, `SeloProveniencia.tsx`, `GraficoSerieTemporal.tsx` | adaptar | base do Inspetor | 7 |
| `components/matriz/PainelMatrizTreino.tsx`, `campanha/PainelCampanha.tsx`, `comparador/ComparadorEvento.tsx`, `relatorios/*` | adaptar | esboços | 7 |
| `components/mapa/MapaAmostral.tsx`, `SidebarAmostral.tsx`, `components/modais/*` | descartar | portes de telas do Localizador; parte-se do original | — |
| `docs/AUDITORIA_INTEGRIDADE_2026.md` | manter em quarentena | registro histórico (S1-17) | — |

---

## Apêndice B — Onde cada achado é resolvido

### B.1 Auditoria da Tabela Consolidada (08/09/2026)

| Achado | Resolução |
|---|---|
| C1 — perda de solo por regra ad hoc (`declividade × 2,2`) | `parsers.ts` descartado; ponto importado sem feature; Invariantes 1 e 7 |
| C2 — Fator C invertido em relação ao BSI | D01 (Durigon); §14.1 |
| C3 — bônus CAR de +25 no score exportado | score eliminado como resultado; Invariante 2 |
| C4 — falha de consulta vira "sem correspondência" | §8.4; Invariante 5; `causa` na proveniência |
| C5 — `Campos_Estimados` incompleto em quatro rotas | derivado da proveniência (Invariante 3); uma rota por variável |
| C6 — `unmask()` com constante no pipeline em lote | Regra 7; padrões proibidos (§7.5); §9.1 |
| C7 — constantes no enriquecimento em lote | `batchEnrichment.ts` descartado; padrões proibidos |
| A1 — Bloco F oculta dado fundiário existente | a rota de consulta devolve status e cadeia completos (§8.4) |
| A2 — literais em colunas geográficas | §8.5; Invariante 6 |
| A3 — zero tratado como ausência (`\|\|`) | Regra 5; padrões proibidos |
| A4 — defaults divergentes entre CSV e GeoJSON | uma rota de importação, sem defaults |
| A5 — tipo de solo inferido por granulometria | carta da Embrapa; `stratificationConstants.ts` descartado |
| A6 — duas resoluções do Fator K | D14; RUSLE do Localizador descartada |
| A7 — cena Sentinel-2 não auditável | `rastreio.cenas` com `PRODUCT_ID`; Invariante 4 |
| A8 — nulos do Earth Engine viram zero | padrões proibidos (`?? 0`); §8.2 |
| M1 — CSV sem procedência nem LGPD | §7.10 |
| M2 — "bases consultadas" para bases instaladas | §7.10 |
| M3, M4 — DMS divergente e sem *rollover* | `export/dms.ts` (§7.10) |
| M5 — declividade em EPSG:3857 | §8.2, incluindo a máscara de elegibilidade |
| M6 — `Codigo` igual ao identificador interno | §7.10 |
| M7 — shapefile grava `0` onde a tabela deixa vazio | `export/geo.ts`; padrões proibidos |
| M8 — docstring de severidade incompleta | severidade eliminada |

### B.2 Auditoria do plano v1 (08/09/2026)

| Achado | Resolução |
|---|---|
| B1 — teste do Fator C vacuoso | §14.1 |
| B2 — Φ indefinido | §3.5 |
| B3 — sem ingestão de rótulos nem montagem da matriz | Fase 6 |
| B4 — Etapa 0 ausente | Fase 0 (§6) |
| I1 — fundiário órfão | §8.4 |
| I2 — guarda antissintético ausente | §7.4 |
| I3 — Invariante 2 sem objeto | §7.9 |
| I4 — blocos de 10–20 km sem justificativa | §3.7, P01 |
| I5 — Regra 8 sem etapa | §7.6 e primeira tarefa de cada fase |
| I6 — testes fora do lugar quebravam import | §4.4 |
| M1 — fuso UTM e o oeste do Paraná | §8.2 |
| M2 — harmônicos sem qualidade de ajuste | §9.2 |
| M3 — relatório sem semente | P07; §13.4 |
| M4 — Invariante 1 inerte sem aviso | §7.9 |

### B.3 Avaliação do SAREL 1 (10/09/2026)

| Achado | Resolução |
|---|---|
| S1-01 — sem Earth Engine; pontos gerados no navegador | Marco M1 com dado real; `pontosExemplo.ts` descartado |
| S1-02, S1-03, S1-17 — verificação afirmada sem execução | evidência obrigatória e teste (§7.6) |
| S1-04, S1-16 — decisões e parâmetros fixados pelo agente | Registro de Decisões (§3.1); padrões proibidos |
| S1-05 — referência verificada alterada | `embrapaSoilClient.ts` portado intacto |
| S1-06 a S1-09 — fórmulas e valores inventados | `fatores.ts` e fórmulas de `eventos.ts` descartados; D13 |
| S1-10 — cortes e pisos silenciosos | Regra 1; padrões proibidos |
| S1-11 — `adquiridoEm` = hoje | semântica nova (§7.1); padrões proibidos |
| S1-12 — Invariante 7 evadível | §7.9 |
| S1-13 — Kappa 0 sem pares; pendente vira final | §12.2 |
| S1-14 — cota em memória | livro-razão persistente (§11.6) |
| S1-15 — piso de 10 km e atribuição indevida | §3.7 |
| S1-18 — serviço fundiário duplicado | matcher do Localizador (§8.4) |

---

*Plano v3 — 10/09/2026. Incorpora a estratégia de reconstrução no repositório do Localizador, a avaliação do SAREL 1, o Registro de Decisões e as correções de consistência do plano v2. Toda afirmação sobre código cita arquivo e linha conferidos em 10/09/2026, na branch `correcoes/auditoria-2026-09` (HEAD `ec31669`) e no commit `9808c46` do SAREL 1.*
