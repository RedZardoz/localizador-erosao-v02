# Relatório de Auditoria Integral — Coerência e Efetividade Científica do SAREL v2

**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA)**
**Projeto de Dissertação:** Sistema de Amostragem e Rotulagem para Erosão Laminar (SAREL)
**Data da Auditoria:** 26 de setembro de 2026
**Branch auditada:** `sarel/v2` no commit `4ea31ba`
**Objeto:** `src/` (103 arquivos, ~23.100 linhas), `scripts/` (34 arquivos), registro de decisões, artefatos de exportação, sistema de guardas e suíte de 40 arquivos de teste (283 asserções)
**Estado da suíte na data:** `283 passed (283)`, `tsc --noEmit` código 0, `npm run build` código 0 — **executados por este auditor**, não reportados de terceiro.

---

## 1. Veredito

O SAREL é **honesto no que declara e incompleto no que executa**. Após os seis commits de correção de 26/09/2026, não localizei nenhuma fabricação de dado ativa nos caminhos de exportação, no alvo supervisionado ou no ponto de entrada da rotulagem de campo. O aparato de proveniência, os sete invariantes e o varredor de padrões proibidos são incomuns em rigor para uma dissertação de mestrado, e há passagens de honestidade científica exemplar documentadas na Seção 7.

O risco à defesa **não é mais fabricação**. É a distância entre o método descrito e o método executável, concentrada em três achados:

1. **A árvore de features espectro-temporais está implementada, testada e desconectada** (Achado A1). Harmônicos, estatísticas de banda, métricas de composto de solo exposto e janelas temporais não rodam no sistema.
2. **O módulo de chuva não tem chamadores** (A2). A erosividade episódica — argumento central contra a RUSLE de média anual — não é medida, embora suas colunas existam na matriz de treino.
3. **O selo `medido`, a afirmação mais forte do sistema, carrega data de aquisição fixa em código** em 31 pontos (B1).

Os três são corrigíveis e nenhum exige refazer arquitetura. Mas, enquanto persistirem, a tese de superioridade sobre a RUSLE clássica repousa sobre capacidade que o repositório possui e não aciona.

**Classificação dos 13 achados:** 4 críticos (A1, A2, B1, C1 — este com três desdobramentos, C1a a C1c), 5 graves (A3, C3, C4, D1, E1) e 4 relevantes (A4, C2, E2, E3).

---

## 2. Efetividade Científica

### A1 — CRÍTICO: a árvore de features temporais está desconectada

Rastreei os importadores de cada módulo do subsistema temporal, excluindo testes:

| Módulo | Importado por |
|---|---|
| `src/lib/matriz/montagemTemporal.ts` | **nenhum** |
| `src/lib/gee/estatisticasSerie.ts` | **nenhum** |
| `src/lib/gee/harmonicos.ts` | apenas `montagemTemporal.ts` (morto) |
| `src/lib/gee/compostoSoloNu.ts` | apenas `montagemTemporal.ts` (morto) |
| `src/lib/gee/persistenciaTemporal.ts` | `GraficoSerieTemporal.tsx` (vivo, só o gráfico) e `montagemTemporal.ts` (morto) |

`montagemTemporal.ts` é a raiz de uma subárvore morta. Consequência: `ajustarHarmonicosBanda`, `construirHarmonicosBloco`, `construirEstatisticasBloco`, `extrairMetricasSoloExposto` e `definirJanelasModelo` **não executam no sistema**. O bloco `temporal` dos pontos é montado inline nas rotas (`inspect-point/route.ts:242`, `select-candidates/route.ts:921`), não por esse subsistema.

Efeito sobre a suíte de testes: `montagemTemporal.test.ts` (3), `estatisticasSerie.test.ts` (4), `harmonicos.test.ts` (3), `compostoSoloNu.test.ts` (4) — **14 asserções verdes sobre código que não roda**. A suíte de 283 testes transmite cobertura que o caminho executável não tem.

**Ação:** decidir explicitamente entre ligar `montagemTemporal` ao pipeline de features ou declará-la como biblioteca não utilizada nesta versão. A terceira via — deixar como está — produz uma dissertação que descreve harmônicos e estatísticas de série que nenhum ponto exportado possui.

### A2 — CRÍTICO: o módulo de chuva não tem chamadores

`construirBlocoChuva` (`src/lib/chuva/eventos.ts:117`), `calcularAcumuladosChuva` (`chirps.ts:26`) e `extrairI30Maximo` (`imerg.ts:27`) não são invocados em `src/app/api` nem em `src/components`.

Porém `Precip_Acum_30d_mm`, `Precip_Acum_90d_mm`, `I30_Max_mm_h`, `N_Eventos_Erosivos` e `Indice_Mecanismo` constam da lista de permissão de `matriz-treino` (`src/lib/matriz/perfis.ts:153-161`) e do conjunto de preditores do Arquivo 05.

Isto atinge o núcleo do argumento da pesquisa. A crítica à RUSLE registrada na discussão metodológica é que a erosividade $R$ média anual não explica processo episódico. O instrumento que mediria o episódio — $I_{30}$ máximo, contagem de eventos erosivos, índice de mecanismo — existe, está testado (`chuva.test.ts`, 10 asserções) e **não é chamado**.

**Ação:** ligar o bloco de chuva às rotas GEE, ou remover as colunas da lista de permissão e declarar na dissertação que a dimensão pluviométrica não entrou nesta versão. A situação atual declara a coluna e entrega vazio.

### A3 — GRAVE: o lado topográfico opera com 2 de 6 derivadas

Motivos de indisponibilidade declarados nas rotas GEE, extraídos literalmente do código:

```
"Curvatura aguarda cálculo de janela focal 3x3 no GEE."
"Direção de fluxo D8 em processamento."
"TWI aguarda integração da área de contribuição específica."
"Histograma mensal aguarda agregação de 5 anos."
"Sequência temporal contínua requer série interpolada."
```

Restam elevação e declividade como variáveis de terreno medidas. O `PLANEJAMENTO_PESQUISA_v3_2026-09-08.md:242` justifica a curvatura de perfil precisamente como o mecanismo que "controla aceleração e desaceleração do escoamento, discriminando zonas de perda e de deposição". Esse mecanismo não é computado.

A honestidade está preservada: tudo isso é `indisponivel` com causa formal, não preenchido. O problema é de capacidade, não de integridade.

### A4 — RELEVANTE: o que a matriz executável entrega hoje

Somando A1, A2 e A3, o Arquivo 05 ajusta o XGBoost sobre **3 preditores**: `Elevacao_m` (medido), `Declividade_pct` (medido) e `RUSLE_Fator_K` (tabelado, D14). Os outros cinco declarados são descartados por ausência total, com aviso `[RETIDA]` — comportamento correto instaurado no commit `53693a8`.

Um modelo de três preditores, sendo um deles tabelado a partir de classe pedológica, não sustenta comparação de mérito contra a RUSLE. Isto precisa constar da dissertação como limitação da versão, ou ser resolvido ligando A1 e A2.

---

## 3. Proveniência

### B1 — CRÍTICO: o selo `medido` carrega data de aquisição fixa em código

O tipo `Proveniencia<T>` define o estado `medido` como `{ valor, fonte, adquiridoEm, consultadoEm }` (`src/types/proveniencia.ts`). O campo `adquiridoEm` é a data de aquisição do dado — a afirmação factual mais forte do sistema.

Localizei **31 ocorrências** de `adquiridoEm` atribuído a literal fixo nas duas rotas GEE vivas:

| Fonte | Literal usado | Ocorrências |
|---|---|---|
| Sentinel-2 L2A (bandas, NDVI, BSI) | `"2023-10-31"` | 10 |
| Sentinel-2 (frequência de solo nu) | `"2023-12-31"` | 2 |
| Copernicus DEM GLO-30 | `"2022-01-01"` | 6 |
| Copernicus DEM GLO-30 | `"2023-01-01"` | 2 |
| Embrapa Solos / GeoInfo | `"2020-11-05"` | 8 |
| Outros | `"2020-01-01"` | 1 |

Dois problemas distintos:

1. **A data não é a do produto efetivamente usado.** Cada linha exportada declara, na coluna `*_Origem`, algo como `medido (Sentinel-2 ..., 2023-10-31)` independentemente de quais cenas entraram no cálculo. Um parecerista que cruze os `PRODUCT_ID` de `rastreio.cenas` com o `adquiridoEm` encontrará divergência sistemática.
2. **Inconsistência interna:** o mesmo Copernicus DEM GLO-30 aparece como adquirido em `2022-01-01` e em `2023-01-01` em pontos diferentes do mesmo arquivo.

O Invariante 4 já exige `PRODUCT_ID`, versão do motor e timestamp para dados orbitais, e `rastreio.cenas` os armazena. As datas verdadeiras estão disponíveis e não propagam para o selo.

Observo que o varredor tem regra específica `adquiridoEm-com-new-date` bloqueando `new Date()` nesse campo — os autores identificaram o risco e fecharam a versão dinâmica, deixando passar o literal.

**Ação:** derivar `adquiridoEm` do `PRODUCT_ID` da cena (ou da data de publicação da coleção, quando for produto estático como a carta pedológica), e acrescentar ao varredor a regra `adquiridoEm` com literal de data.

---

## 4. Coerência entre Decisões Registradas e Código

### C1 — CRÍTICO: D01 decide uma fórmula, o código executa outra, e o resultado excede o domínio físico

`src/config/decisoes.ts:31-40` registra D01 como `decidida`:

```
titulo: "Fórmula do Fator C: Durigon et al. (2014)"
valor: "(1 - NDVI) / 2"
justificativa: "...sem parametros livres e sem corte em [0, 1]."
referencia: "Durigon et al. (2014), International Journal of Remote Sensing 35(2):441-453"
```

O código executado (`src/lib/rusle/fatorC.ts:58-68`):

```ts
const bsiNum = bsi !== undefined ? bsi : 0;
return ((1 - ndvi) / 2) * (1 + bsiNum);
```

**Verificação bibliográfica.** Confirmei a referência: Durigon, V. L., Carvalho, D. F., Antunes, M. A. H., Oliveira, P. T. S. & Fernandes, M. M. (2014), *NDVI time series for monitoring RUSLE cover management factor in a tropical watershed*, International Journal of Remote Sensing 35(2):441-453, DOI 10.1080/01431161.2013.871081. A formulação de Durigon é $C = (1 - \text{NDVI})/2$, que mapeia $\text{NDVI} \in [-1,1]$ em $C \in [0,1]$. O fator $(1 + \text{BSI})$ **não pertence a essa publicação**.

**Mérito a registrar:** o selo de proveniência **não finge** ser Durigon puro. `fatorC.ts:121-122` declara literalmente `"Híbrido SPD: C = ((1 - NDVI) / 2) * (1 + BSI) (Durigon et al., 2014 modulado por BSI)"` quando o BSI está presente, e a forma pura quando ausente. Isso é atribuição honesta e deve ser reconhecido.

Restam dois defeitos reais:

**C1a — A decisão não autoriza a fórmula executada.** O selo cita `decisoes: ["D01"]`, mas D01 decidiu `(1 - NDVI) / 2`. Como o BSI é computado junto do NDVI, o caminho híbrido é o **caminho normal**, não a exceção. O sistema roda, na prática, uma fórmula que o registro de decisões não contempla.

**C1b — O Fator C alcança 2,0, o dobro do máximo físico.** Com $\text{BSI} \in [-1,1]$, o multiplicador $(1+\text{BSI}) \in [0,2]$. Calculado:

| NDVI | BSI | C resultante |
|---:|---:|---:|
| −1,00 | 1,00 | **2,0000** |
| 0,10 | 0,50 | 0,6750 |
| 0,25 | 0,10 | 0,4125 |

O fator $C$ da RUSLE é, por construção, uma razão adimensional em $[0,1]$ (Renard et al., 1997). `calcularFatorC` valida **apenas as entradas**; não há verificação de domínio da saída. Um $C = 2{,}0$ propagaria para $A = R \cdot K \cdot LS \cdot C \cdot P$ dobrando a perda de solo estimada.

E a Regra 2 proíbe corte silencioso, então a correção **não é** aplicar `Math.min(1, c)`: é recusar explicitamente o resultado fora do domínio com `indisponivel("fora-do-dominio")`, como o próprio módulo já faz para as entradas.

**C1c — O caminho híbrido não tem teste.** `rusle.test.ts` exercita `calcularFatorC` com um único argumento nas linhas 30-32 (`0.0 → 0.5`, `0.5 → 0.25`, `1.0 → 0.0`) e testa exceções de domínio de entrada nas linhas 36-39. **Nenhuma asserção passa BSI.** O caminho que executa em produção é o único não coberto, entre 12 testes do módulo.

### C2 — RELEVANTE: D02 é a raiz governamental do alvo circular corrigido hoje

`decisoes.ts:41-50`, D02, `estado: "decidida"`:

```
titulo: "Critérios observacionais de presente/ausente e negativo explícito"
valor: "Amostragem estratificada pura: Classe 1 (Erosão: BSI > 0.10 e NDVI < 0.40)
        vs Classe 0 (Controle/SPD: BSI < 0.00 e NDVI > 0.65)"
justificativa: "Critérios biofísicos objetivos e reprodutíveis..."
```

O título emprega a linguagem de rótulo — "presente/ausente", "negativo explícito" — para critérios que são índices espectrais. É exatamente o que a Regra 4 proíbe como alvo supervisionado, e o que `montagem.ts:138` veda por escrito.

O código adota a leitura defensável: esses critérios definem `classeAmostral`, usada para **estratificação amostral**, nunca como $y$. A expressão "Amostragem estratificada pura" no próprio valor sustenta essa leitura.

Mas a ambiguidade da redação foi o que autorizou `scripts/treinar_xgboost_loco.py` a converter `classeAmostral` em alvo supervisionado — o defeito D1 eliminado no commit `207dca2`. O defeito tinha raiz de governança, não apenas de codificação.

**Ação:** reescrever o título e o valor de D02 declarando explicitamente que os critérios selecionam **candidatos à observação** e jamais constituem o alvo supervisionado, com remissão à Regra 4. Fecha a porta de forma permanente.

### C3 — GRAVE: D11 não é aplicada no caminho executado

D11 está `decidida`: "Mínimo de 6 observações orbitais válidas (sem nuvem/sombra) por ponto/janela temporal".

A guarda existe em `src/lib/gee/persistenciaTemporal.ts:94` (`if (nValidas < 6)`) e em `src/lib/gee/harmonicos.ts:62` — **ambos fora do caminho vivo** (ver A1). O cliente que efetivamente produz o dado, `src/lib/gee/copernicusGeeClient.ts`, não possui nenhuma verificação de suficiência amostral: busquei `nObserv`, `>= 6`, `< 6`, `minimo`, `D11` e `count`, sem resultado.

Consequência concreta: `frequenciaSoloNu` derivada de 1 cena válida recebe o mesmo selo `estado: "medido"` que a derivada de 40, e alimenta o tercil $\hat{E}$ da estratificação em igualdade de condições. A decisão que protege a significância da série é inoperante onde importa.

### C4 — GRAVE: o raio de thinning é relaxado abaixo do parâmetro proposto e não é registrado

- `P02` (`decisoes.ts:204`), `estado: "proposta"`: "1 km herdado do Localizador para dispersão espacial".
- Cabeçalho de `src/lib/gee/thinning.ts:7`: "espaçamento geodésico mínimo (P02 = 1.0 km)".
- Default efetivo: `raioThinningKm = 5.0` (`select-candidates/route.ts:162`; idem na interface, `CandidateSelectionModal.tsx:37`).
- Laço de relaxamento (`route.ts:291-294`):

```ts
while (candidatosAposThinning.length < metaPoolMinimo && raioMetros > 800) {
  raioMetros = Math.max(800, Math.floor(raioMetros * 0.65));
  candidatosAposThinning = aplicarThinningDeterminista(candidatosBase, raioMetros, semente);
}
```

A trajetória é 5.000 → 3.250 → 2.112 → 1.372 → 891 → 800 m. O piso de 800 m fica **abaixo do 1 km proposto em P02**, e o afrouxamento ocorre para atingir uma meta de tamanho de pool — conveniência amostral reduzindo independência espacial.

**O defeito mais grave aqui é de auditabilidade, não de valor.** `criterioSelecao` (`route.ts:578-584`) grava `tercilS`, `tercilE`, `nivelK`, `phiDiag` e `semente` — **não grava o raio efetivo**. Concluída uma corrida, é impossível saber se a amostra foi afinada a 5.000 m ou a 800 m. A independência espacial da amostra é irreprodutível a posteriori, mesmo com a semente registrada.

**Ação:** gravar `raioThinningEfetivoMetros` em `criterioSelecao`, registrar cada iteração de relaxamento no log de seleção, e submeter a P02 a decisão formal (`decidida`) fixando o piso — que não pode ser inferior ao valor decidido.

---

## 5. Delimitação Territorial

### D1 — GRAVE: polígonos simplificados usados em decisão analítica

`src/lib/localizacao/bacias.ts` declara proveniência correta no cabeçalho (Resolução CERH/PR nº 49/2006, Lei Estadual 12.726/1999, IBGE Malhas Territoriais v3, ITCG em SIRGAS 2000) e separa corretamente três recortes da BP3: divisor hidrológico (~7.979 km²), limite legal dos 28 municípios (~13.350 km²) e corredor experimental de 6 municípios (~2.920 km²), mais os 28 polígonos municipais individuais.

`scripts/treinar_xgboost_loco.py:130` declara honestamente que são "limites vetoriais simplificados do Instituto Água e Terra (IAT)".

Medi a área esférica de cada anel e comparei com a área que cada feature declara:

| Feature | Vértices | Declarada (km²) | Calculada (km²) | Erro |
|---|---:|---:|---:|---:|
| `basin-parana3` | 149 | 7.979 | 9.625 | **+20,6%** |
| `basin-corredor-foz-ceu-azul` | 273 | 2.920 | 3.884 | **+33,0%** |
| `basin-paranapanema` | 897 | 39.800 | 29.947 | −24,8% |
| `basin-piquiri` | 594 | 24.171 | 20.131 | −16,7% |
| `basin-litoral` | 417 | 14.780 | 12.873 | −12,9% |
| `basin-tibagi` | 721 | 24.715 | 27.712 | +12,1% |
| `basin-iguacu` | 1.342 | 54.820 | 60.351 | +10,1% |
| `basin-ivai` | 763 | 36.540 | 34.670 | −5,1% |
| `...municipios-legais` | 430 | 13.350 | 14.054 | +5,3% |

**Validação do método:** os 28 polígonos municipais somam 14.053 km² e o polígono agregado encerra 14.054 km² — concordância de 0,0% entre geometrias independentes. Os erros ocorrem em ambos os sentidos, o que exclui viés sistemático do cálculo. A precisão mista das coordenadas confirma edição manual: entre 17.512 valores, 13 têm 1 casa decimal (~11 km de granularidade) e 175 têm 2 casas (~1,1 km).

**Onde isso decide, e não apenas desenha:**

1. `select-candidates/route.ts:603` — `identificarBacia(lat, lon) || "Bacia Hidrográfica do Paraná 3"` define o campo `Bacia_Hidrografica` do ponto. O fallback **afirma BP3** para qualquer ponto que caia fora de todos os polígonos: fabricação por omissão em string, invisível ao varredor.
2. `identificar_bacia_real` define `bloco_loco`, a unidade de bloqueio da validação cruzada espacial. Erro de pertencimento na borda desloca o bloco — a contaminação por autocorrelação que o LOCO existe para impedir.
3. O recorte da dissertação: com a BP3 encerrando 20,6% mais área que o divisor oficial, há território amostrável fora da bacia declarada.

Os valores de `area_km2` são as cifras oficiais da literatura (7.979 km² é a figura padrão do IAT para a BP3). **Os metadados estão corretos e a geometria é o esboço**: as propriedades prometem precisão que o polígono não possui.

**Ação:** para exibição, manter. Para moldura amostral, `Bacia_Hidrografica` e `bloco_loco`, substituir pelo vetor oficial (shapefile IAT ou ottobacias ANA). Não sendo viável agora, declarar a tolerância da simplificação junto de cada `area_km2` e eliminar o fallback da linha 603, que deve resultar em `indisponivel`.

---

## 6. Sistema de Guardas

### E1 — GRAVE: o mecanismo `// permitido:` foi usado para silenciar achado aberto

`select-candidates/route.ts:292`:

```ts
// permitido: registrado sem execucao na auditoria (relaxamento iterativo ate 800m pendente revisao)
raioMetros = Math.max(800, Math.floor(raioMetros * 0.65));
```

O mecanismo de exceção existe para declarar um valor como legitimamente tabelado ou normativo, com justificativa científica. Aqui foi usado para **estacionar uma pendência**, convertendo a guarda em lista de tarefas: a violação da Regra 2 agora passa silenciosamente e para sempre, a menos que alguém leia o comentário.

Não houve ocultação — o achado consta do relatório de execução. O problema é o instrumento escolhido para manter a suíte verde.

**Ação:** exigir que `// permitido:` contenha justificativa científica com fonte, nunca prazo ou pendência. Achado aberto pertence ao documento de auditoria, não ao supressor da guarda.

Avaliei as 12 anotações `// permitido:` existentes: 10 são legítimas (limite computacional de busca, teto de concorrência da API, normalização de percentual [0,100], subtração de cota inteira, fallback de protocolo OAuth `expires_in`, timestamps de livro-razão local, paginação de interface), 1 é discutível (`route.ts:441`, critério mínimo de pool elegível, que é metodológico) e 1 é a abusiva acima.

### E2 — RELEVANTE: lacunas de padrão remanescentes

Classes de fabricação que os regex atuais não detectam:

| Padrão | Exemplo localizado |
|---|---|
| Ternário numérico | `frequenciaSoloNu: ... ? ... : 0` (corrigido em `bb7e192`, classe segue invisível) |
| Default de desestruturação | `raioThinningKm = 5.0` (`route.ts:162`) |
| Literal de data em `adquiridoEm` | 31 ocorrências (B1) |
| Literal em `return` de objeto | `return { t1: 0, t2: 0 }` (`estratificacao.ts:78`) |
| String não numérica afirmativa | `|| "Bacia Hidrográfica do Paraná 3"` (`route.ts:603`) |

O caso de `calcularLimiaresTercis` merece nota: com entrada vazia devolve `{ t1: 0, t2: 0 }`, e `classificarTercil` então atribui tercil 3 a toda declividade positiva — colapso silencioso da estratificação num único tercil.

### E3 — RELEVANTE: `src/components` segue fora da varredura

A ampliação Q2(ii) do commit `bb7e192` cobre `src/lib`, `src/app/api`, `src/store` e `src/config`. `src/components` (8.732 linhas) permanece fora, com regra restrita apenas a numerais entre aspas e `adquiridoEm`. A decisão é defensável — as 10 violações medidas ali eram geometria de interface — mas convém reavaliar, pois componentes também constroem objetos de dado (o template Kobo, corrigido em `28b78e5`, era um deles).

---

## 7. Mérito — o que está cientificamente bem feito

Registro isto com o mesmo rigor das críticas, porque é material de defesa.

**F1 — Recusa explícita de atribuição falsa.** `src/lib/gee/blocosEspaciais.ts:82` e `:137` declaram, na própria string de justificativa, que a aresta de contingência de 20 km é provisória e que "Roberts et al., 2017 orientam derivar do alcance, mas não determinam 20 km". Recusar-se a emprestar autoridade de uma referência a um número que ela não fornece é honestidade científica de nível raro em código.

**F2 — Invariante 7 com exceção correta.** O detector de constante disfarçada recusa exportação se coluna numérica for idêntica em todas as linhas para $n \ge 21$, e isenta `RUSLE_Fator_P`, que é legitimamente tabelado em 1,0 (`invariantes.ts:57-63`, `:175`). O desenho antecipou o conflito.

**F3 — Síntese sintética exemplar.** `scripts/treinar_xgboost_loco.py:300-331`: flag de opt-in `--permitir-dryrun-sintetico` com recusa por padrão (linha 252), marca d'água `CTRL-DRYRUN-` em cada código, tipologia `"Controle / SPD (Dry-Run)"`, `# permitido:` justificado em cada `np.random`, e propagação de `eh_dryrun` até as funções de relatório. É o padrão da casa feito certo.

**F4 — Implementação canônica com norma escrita.** `montagem.ts` exclui ponto sem rotulagem e divergência sem desempate com motivo registrado, segrega o held-out de drone e documenta em comentário a proibição que protege o alvo (`:137-138`).

**F5 — Proveniência do híbrido declarada.** O selo do Fator C nomeia o híbrido em vez de fingir Durigon puro (C1).

**F6 — Trajetória de correção de 26/09/2026.** Os seis commits eliminaram fabricação nos cinco fatores RUSLE do Arquivo 01, a imputação por zero no Arquivo 05, o alvo circular por `classeAmostral`, a heurística textual de `Tipologia_Feicao`, a imputação de rótulo por `fillna`, e o pré-preenchimento de classe no template de campo — este último o ponto de entrada mais sensível de todo o sistema.

---

## 8. Plano de Ação Priorizado

| # | Achado | Ação | Esforço |
|---|---|---|---|
| 1 | C1b | Recusar $C > 1$ com `indisponivel("fora-do-dominio")`; **nunca** `Math.min` | baixo |
| 2 | C1c | Teste do caminho híbrido, incluindo o limite $C = 2{,}0$ | baixo |
| 3 | C1a | Decidir: emendar D01 para contemplar o híbrido, ou criar decisão própria | do pesquisador |
| 4 | B1 | Derivar `adquiridoEm` do `PRODUCT_ID`; nova regra no varredor | médio |
| 5 | C4 | Gravar raio efetivo em `criterioSelecao`; formalizar P02 | baixo |
| 6 | E1 | Remover o `// permitido:` da linha 292; decidir o piso de thinning | baixo |
| 7 | A2 | Ligar o bloco de chuva, ou remover as colunas da lista de permissão | médio |
| 8 | C3 | Guarda de D11 no `copernicusGeeClient` | baixo |
| 9 | D1 | Vetor oficial IAT/ANA para uso analítico; eliminar fallback da linha 603 | médio |
| 10 | A1 | Decidir entre ligar `montagemTemporal` ou declará-la não utilizada | alto |
| 11 | C2 | Reescrever D02 separando critério amostral de alvo supervisionado | do pesquisador |
| 12 | A3 | Implementar curvaturas, D8 e TWI no GEE — pré-requisito de D15/LS | alto |
| 13 | E2, E3 | Fechar classes de padrão remanescentes; reavaliar `src/components` | médio |

Os itens 1, 2, 5, 6 e 8 são de esforço baixo e removem, juntos, três achados graves e um crítico. Recomendo-os como próxima rodada.

Os itens 3 e 11 são decisões metodológicas do pesquisador e não podem ser executados por agente.

Os itens 10 e 12 determinam se a dissertação defende o método descrito ou uma versão reduzida dele. São a decisão de maior consequência deste relatório.

---

## 9. Declaração de Método desta Auditoria

Todas as âncoras `arquivo:linha` foram verificadas contra o código no commit `4ea31ba`. A suíte de testes, o `tsc` e o `build` foram executados por este auditor, não reproduzidos de relatório de terceiro. As áreas dos polígonos foram calculadas por excesso esférico com raio autálico de 6.371,0088 km, e o método foi validado por concordância independente de 0,0% entre a soma dos 28 municípios e o polígono agregado. A referência de Durigon et al. (2014) foi conferida contra a publicação; a formulação híbrida com $(1+\text{BSI})$ não consta dela.

Dois achados que este auditor levantou em revisão anterior **não se confirmaram** e são retirados: (i) as ocorrências restantes de "Bacia do Rio Ivaí" em `src/` são o polígono real da bacia no registro geográfico e sua asserção de teste, dado correto; (ii) o selo do Fator C não comete atribuição falsa a Durigon.

`D13` e `D15` permanecem `pendente`; `R`, `LS` e a perda de solo $A$ seguem corretamente retidos pelo Invariante 1.

---

## Referências citadas

- Durigon, V. L., Carvalho, D. F., Antunes, M. A. H., Oliveira, P. T. S. & Fernandes, M. M. (2014). NDVI time series for monitoring RUSLE cover management factor in a tropical watershed. *International Journal of Remote Sensing*, 35(2), 441-453.
- Renard, K. G., Foster, G. R., Weesies, G. A., McCool, D. K. & Yoder, D. C. (1997). *Predicting Soil Erosion by Water: RUSLE*. USDA-ARS, Agriculture Handbook 703.
- Roberts, D. R. et al. (2017). Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure. *Ecography*, 40(8), 913-929.
- Desmet, P. J. J. & Govers, G. (1996). A GIS procedure for automatically calculating the USLE LS factor on topographically complex landscape units. *Journal of Soil and Water Conservation*, 51(5), 427-433.
- Mannigel, A. R. et al. (2002). Fator erodibilidade e tolerância de perda dos solos do Estado de São Paulo. *Revista Brasileira de Ciência do Solo*, 26, 1039-1049.
- Gebru, T. et al. (2021). Datasheets for Datasets. *Communications of the ACM*, 64(12), 86-92.
- Chen, T. & Guestrin, C. (2016). XGBoost: A Scalable Tree Boosting System. *Proceedings of KDD 2016*, 785-794.
