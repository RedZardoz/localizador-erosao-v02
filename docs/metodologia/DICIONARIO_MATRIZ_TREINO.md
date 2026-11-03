# Dicionário de Dados — Matriz de Treino e Held-out

**Versão do contrato:** `2.0.0` (constante `ESQUEMA_MATRIZ_VERSAO` em `src/lib/matriz/esquema.ts`)
**Data:** 3 de novembro de 2026
**Perfis cobertos:** `matriz-treino`, `matriz-heldout` (`src/lib/matriz/perfis.ts`)
**Origem:** `C-07` do planejamento sequencial; achados `V-03`, `T-02`, `D-02`.

> **Como ler o campo "Vazio".** Célula vazia significa **ausência declarada**, nunca zero. É a Regra 1: variável sem resposta da fonte permanece indisponível, com causa. Onde zero é valor científico legítimo — `Fracao_Erodida`, `NDVI` —, a distinção entre vazio e zero é o que impede que uma omissão entre no modelo como observação.

---

## 1. Identificadores

| Coluna | Tipo | Unidade | Suporte | Origem | Decisão | Vazio permitido |
|---|---|---|---|---|---|---|
| `Ponto_ID` | texto | — | ponto amostral | `PontoAmostral.id` | — | **não** |
| `Celula_ID` | texto | — | célula de 10 m | `PontoAmostral.celulaId` | D16 / D26 | sim |
| `Poligono_ID` | texto | — | polígono de 5,02 ha | selo D16 (`idPoligono`) | D16 | **não** |
| `Pixel_ID` | texto opaco | — | pixel de 10 m | CSV de D26 | D26 | sim |

**`Pixel_ID` é hash opaco.** Jamais derivável de coordenada, por Invariante 2 e pelo cegamento de D16. É a chave que permite ao avaliador D25 detectar o mesmo pixel de borda em treino e held-out — a guarda `_checar_pixels_disjuntos`, que sem esta coluna retorna em silêncio.

## 2. Desenho amostral

| Coluna | Tipo | Unidade | Suporte | Origem | Decisão | Vazio permitido |
|---|---|---|---|---|---|---|
| `Estrato_ID` | texto | — | estrato | **selo D16**, prevalecendo sobre `ponto.estratoId` | D12 / D16 | sim |
| `Pi_i` | número em `(0, 1]` | probabilidade | polígono | **selo D16** | D23 | sim |
| `W_i` | número `> 0` | peso | polígono | **selo D16** | D23 | sim |
| `N_Candidatos_Estrato` | inteiro `≥ 1` | contagem | estrato | **selo D16** | D16 | sim |
| `Papel_Conjunto` | `treino` \| `held-out` | — | polígono | selo D16 | D16 | **não** |
| `Bloco_Espacial` | texto | — | bloco | `ponto.blocoEspacial` | P01 / D24 | **não** |

**`Pi_i` NÃO é peso de área.** É a probabilidade de inclusão do **polígono** no seu estrato, `n_h/N_h`, com `N_h` em **número de candidatos** — não em hectares. Um imóvel de 10 ha e outro de 1.000 ha contribuem com o mesmo polígono de 5,02 ha e têm a mesma probabilidade. Usar `4/N_h` como peso de área é erro de unidade, não de precisão (achado `D-02`). Estimativa de área da BP3 exige outro desenho, e é o gate `G-02`.

**`W_i` é o peso de Horvitz-Thompson**, `1/Pi_i`, com a mesma ressalva de unidade. O contrato assevera `Pi_i × W_i = 1` e recusa um sem o outro: peso sem probabilidade não permite auditar a ponderação.

**Por que vêm do selo, e não do ponto.** `pi_i` é produto do ato probabilístico, e o selo de D16 é irreversível por construção (D23). A junção por `Poligono_ID` impede que um campo editável no ponto divirja da probabilidade efetivamente selada. Polígono ausente do selo é **excluído** da matriz, com motivo registrado — não recebe `pi_i` herdado nem inventado.

**`Bloco_Espacial` não admite sentinela.** O valor `"BLOCO_INDEFINIDO"` que existia virava um grupo real no `GroupKFold` de D24, misturando pontos sem relação espacial no mesmo agrupamento de validação. Ponto sem bloco é excluído.

## 3. Modelo e janela temporal

| Coluna | Tipo | Unidade | Suporte | Origem | Decisão | Vazio permitido |
|---|---|---|---|---|---|---|
| `Modelo` | `D` \| `P` | — | artefato | opção de montagem | D04 | **não** |
| `Data_Referencia` | ISO 8601 | data | ponto | opção, ou `rotulo.observadoEm` | D04 | sim |
| `Fim_Janela` | ISO 8601 | data | ponto | `BlocoTemporal.janela.fim` | D04 / D05 | sim |

**Um artefato, um modelo.** `D` é detecção contemporânea; `P` é predição prospectiva, com preditores encerrados 24 meses antes de `t0`. O contrato **recusa** D e P na mesma matriz: misturá-los tornaria a avaliação de D25 ininterpretável (achado `V-01`). Hoje todas as rotas de produção emitem `D`; a exportação de `P` depende do gate `G-04`.

## 4. Cobertura da delineação de VANT

| Coluna | Tipo | Unidade | Suporte | Origem | Decisão | Vazio permitido |
|---|---|---|---|---|---|---|
| `Incluida` | **texto** `true` \| `false` | — | célula | CSV de D26 | P11 (**pendente**) | sim |
| `Cobertura_Celula` | número em `[0, 1]` | fração | célula | CSV de D26 | P11 | sim |
| `Area_Delineada_m2` | número `≥ 0` | m² | célula | CSV de D26 | D26 | sim |

**`Incluida` é texto, não `1`/`0`.** Após qualquer filtragem a montante, toda linha valeria `1` — coluna numérica constante com `n ≥ 21` — e o **Invariante 7** (detector de constante disfarçada) bloquearia a exportação de uma coluna que é legitimamente uniforme. `"true"`/`"false"` é também o que o avaliador D25 já reconhece em `_so_incluidas`. Há teste que demonstra as duas pontas: texto passa, numérico bloqueia.

**O filtro de cobertura não é aplicado na matriz.** A coluna viaja; o limiar é do D25, porque o valor de P11 é decisão pendente (`G-06`). `Cobertura_Celula` também serve à auditoria do alvo em célula parcial: a fração erodida é calculada sobre a **porção observada**, de modo que uma célula com 50% de cobertura e 100% da parte observada erodida recebe `Fracao_Erodida = 1,0`, que não descreve a célula inteira (achado `T-02`).

## 5. Alvo supervisionado

| Coluna | Tipo | Unidade | Suporte | Origem | Decisão | Vazio permitido |
|---|---|---|---|---|---|---|
| `Fracao_Erodida` | número em `[0, 1]` | fração | célula de 10 m | rótulo humano (D26) | D26 | sim |
| `Alvo_Binario_25` | `0` \| `1` | — | célula | derivado de `Fracao_Erodida ≥ 0,25` | D26 | sim |
| `Classe_Alvo_Binaria` | `0` \| `1` | — | célula | derivado do rótulo ordinal | D03 | **não** |
| `Rotulo_Classe` | texto | — | célula | rótulo humano | D03 | **não** |
| `Rotulo_Modalidade` | texto | — | célula | rótulo humano | D06 / D16 | **não** |
| `Rotulo_N_Observadores` | inteiro | contagem | célula | consolidação de rótulos | D03 | sim |

**O alvo primário é `Fracao_Erodida`**, contínua, obtida por rasterização da delineação vetorial sobre o ortomosaico. **Não tem valor padrão**: zero é um valor científico válido — célula observada e delineada como não erodida — e não um marcador de ausência. A gravação sem fração é recusada (`A-07a`).

**`Alvo_Binario_25` é secundário e derivado.** O limiar de 0,25 está pré-registrado, mas a sua sensibilidade não foi testada; dicotomizar variável contínua descarta informação (Altman & Royston, 2006), e é por isso que o alvo primário é a fração.

## 6. Preditores

Projetados conforme os blocos do config de D25, com o teto de D24. Nenhum admite valor fabricado: ausência permanece vazia, com a causa registrada na proveniência do ponto.

| Grupo | Colunas | Unidade | Suporte | Decisão |
|---|---|---|---|---|
| Terreno | `Elevacao_m`, `Declividade_pct`, `Declividade_graus`, `Curvatura_Perfil`, `Curvatura_Plana`, `Acumulo_Fluxo`, `TWI` | m; %; graus; 1/m; —; células; — | célula (MDE 30 m) | D21 |
| Solo | `Ordem_Solo`, `Subordem_Solo`, `Grande_Grupo_Solo`, `Erodibilidade_Classe` | — | unidade de mapeamento | D09 / D14 |
| Exposição | `Frequencia_Solo_Nu` | fração em `[0, 1]` | célula, janela D05 | D10 / D11.2 |
| Espectral | `Banda_B2`, `Banda_B4`, `Banda_B8`, `Banda_B12`, `NDVI`, `BSI` | reflectância; índice em `[-1, 1]` | célula de 10 m | D02 / D20 |
| Série | `Composto_Solo_Nu_B12`, `Composto_Solo_Nu_Razao_B4_B2`, `Taxa_Degradacao_SWIR_Anual`, `NDVI_P90_Serie` | — | célula, série | D08 / D11.3 |
| RUSLE | `RUSLE_Fator_K`, `RUSLE_Fator_R`, `RUSLE_Fator_LS` | t·ha·h/(ha·MJ·mm); MJ·mm/(ha·h·ano); — | célula | D13 / D14 / D15 |
| Chuva | `Precip_Acum_30d_mm`, `Precip_Acum_90d_mm`, `I30_Max_mm_h`, `N_Eventos_Erosivos`, `Indice_Mecanismo` | mm; mm/h; contagem; — | célula, janela | D13 / D19 |

**Três ressalvas que acompanham os preditores:**

1. **`NDVI` e `BSI` são `null` quando o denominador é nulo** ou o valor sai de `[-1, 1]`. Um zero fabricado era indistinguível de um NDVI 0 real, e o clamp escondia anomalia radiométrica (Regras 1 e 2).
2. **`RUSLE_Fator_R` carrega pendência de verificação bibliográfica.** O fator de escala está reproduzido nos dados e conferido em Waltrick (2010); a interpretação física como `g` é hipótese declarada, e a forma funcional e os coeficientes seguem pendentes (R-L2). A marca aparece no censo de proveniência do pacote de reprodutibilidade.
3. **`RUSLE_Fator_P` não está na matriz** — e o competidor RUSLE opera com `P = 1,0` tabelado, que superestima a perda onde há prática conservacionista. Ver a especificação do competidor em `docs/verificacoes/2026-11-02_especificacao_competidor_rusle.md`.

## 7. O que NUNCA entra na matriz

| Proibido | Razão |
|---|---|
| `latitude`, `longitude`, qualquer coordenada | Regra 6 / Invariante 2: o modelo aprenderia localização em vez de processo físico |
| código de propriedade, nome de titular, documento | Invariante 2 e LGPD |
| `phiDiag` e variáveis internas de estratificação | Invariante 2 |
| `RUSLE_Perda_Solo` (o `A` da RUSLE) | Regra 4: nada calculado vira rótulo nem preditor do seu próprio competidor |
| laudo do JEV, em qualquer forma | Regra 4: auditoria heurística não é rótulo, alvo nem métrica |

## 8. O que o contrato valida, e o que não valida

**Valida:** presença das colunas, tipo, domínio físico, `Pi_i × W_i = 1`, e `Modelo` uniforme no artefato. Lança erro tipado `ErroEsquemaMatriz` — não avisa, não corrige, não preenche.

**Não valida cardinalidade.** O contrato não sabe nem pergunta quantos estratos, polígonos ou held-out existem. Essa contagem é do selo D16 e da verificação do modo probatório do D25 (`A-06`). A razão é direta: o gate `G-01` ainda não foi decidido, e qualquer número gravado no contrato — 18, 72, 36 — teria de ser refeito. Há teste que assevera que o módulo do contrato não contém nenhum desses números.

**Não exige valor nas chaves de desenho.** `Pi_i` vazio é estado declarado — montagem sem selo —, que é a situação real enquanto nenhum voo foi selado. Exigir as chaves é privilégio do modo probatório, não do esquema.

**Fim do dicionário.**
