# Auditoria Científica do Desenho, da Validação e do Alvo — SAREL v2

**Data:** 1 de novembro de 2026
**Commit auditado:** `f63d8a5` (branch `sarel/executor-2026-10-09`)
**Objeto:** critérios científicos do desenho amostral (D07, D12, D16, D23), do alvo (D03, D26) e da validação (D24, D25), com verificação de implementação no app e nos scripts de referência.
**Natureza:** auditoria científica independente, somente leitura. Não altera decisões, não promove parâmetros e não corrige código.
**Auditoria anterior:** funcionalidades, coerência decisão×código e lastro bibliográfico em [AUDITORIA_FUNCIONALIDADES_COERENCIA_E_LASTRO_2026-10-31.md](AUDITORIA_FUNCIONALIDADES_COERENCIA_E_LASTRO_2026-10-31.md).

> **Pergunta:** o que a evidência produzida pelo SAREL permite afirmar, e o que ela ainda não permite? O critério não é “o código roda”, mas “o estimando está definido, a amostra o identifica e a validação mede o que se alega medir”.

---

## 1. Sumário executivo

| Afirmação | Situação |
|---|---|
| O app implementa candidatos, estratificação, matriz e exportação com invariantes. | **Sim**, com ressalvas. |
| O desenho de 18 estratos de D12 é executável como pré-registrado. | **Não**: quatro estratos têm menos de 4 candidatos após o thinning; um tem zero. O sorteio D16 recusa corretamente. |
| A amostra é probabilística da área da BP3, com `pi_i` que sustenta área/prevalência. | **Não**: a unidade é o imóvel/polígono, não a área; `pi_i` não chega à matriz; não há pesos de área. |
| O alvo primário é a fração rasterizada da delineação de VANT, como D26 define. | **Parcialmente**: o script de referência faz; o app usa um slider manual com default 0,00 e não ingere a fração. |
| A validação avalia o Modelo P (prognóstico). | **Não**: todas as exportações fixam `modeloJanela: "D"`; o que se avalia é detecção. |
| O held-out é espacialmente independente. | **Não**: é sorteado dentro do estrato, sem bloco nem buffer; o `GroupKFold` agrupa por polígono, não por espaço. |
| D25 pode rodar em modo probatório com a matriz do app. | **Não**: faltam R/LS/`RUSLE_A` e as chaves `Estrato_ID`, `Incluida`, `Pixel_ID`, `pi_i`. |
| O alvo contínuo é compatível com Tweedie e com “fração”. | **Parcialmente**: Tweedie é não negativo, mas ilimitado; não há clip nem calibração. |
| A acurácia/kappa nos sítios contínuos é generalizável. | **Não**: amostra de conveniência; IC do kappa ignora autocorrelação. |

**Contagem:** 6 achados S1 (D-01, D-02, T-01, T-02, V-01, V-02), 8 S2 (D-03, D-04, D-05, T-03, T-04, T-05, V-03, V-04), 3 S3 (V-05, V-06, V-07).

**Conclusão em uma frase:** o SAREL tem um desenho conceitualmente sofisticado, mas hoje executa uma amostra de 72 polígonos que não pode ser sorteada como pré-registrada, um alvo manual que pode contradizer a classe e uma validação de detecção apresentada como se cobrisse predição e inferência populacional.

---

## 2. O estimando: quatro perguntas diferentes

| # | Pergunta | Unidade | População | Desenho | Métrica |
|---|---|---|---|---|---|
| E1 | Onde está a erosão laminar ativa? | célula de 10 m | células agrícolas no domínio D07 | amostra estratificada de polígonos + modelo | Spearman/AUC no held-out (D25) |
| E2 | Qual a prevalência/área afetada na BP3? | célula ou área | todas as células da BP3 | amostra probabilística de área com `pi_i` | HT/Olofsson |
| E3 | O modelo prevê erosão futura? | célula | células em t0, preditores até t0−24m | matriz do Modelo P | métrica em t0 |
| E4 | O classificador concorda com o VANT nos sítios? | pixel de 10 m | Céu Azul/Medianeira | amostra de conveniência | acurácia, kappa, IoU |

D23 fala de E2, D25 mede E1, D04 promete E3 e `validacaoMatricial` mede E4. Os quatro não são intercambiáveis. A dissertação precisa declarar o estimando primário e subordinar os demais; hoje o texto e o código alternam entre eles.

A unidade primária de D16/D23 é o polígono de 5,02 ha dentro de um imóvel elegível, não a célula. `pi_i = 4/N_h` usa `N_h` = número de **candidatos/imóveis** no estrato, não hectares. Para estimar área da BP3 seria necessário um desenho de área (probabilidade proporcional à área, ou pesos de área); o `pi_i` atual não é peso de área. Para **treinar** um modelo, isso não é defeito; o defeito é alegar inferência de área com esse desenho.

---

## 3. Desenho

### D-01 — O fatorial de 18 estratos não é executável como pré-registrado (S1)

A tabela de ocupação de 31/10/2026, sobre 677 candidatos, mostra após thinning de 1 km: `E_1_1_2` com 0, `E_1_2_2` com 3, `E_2_2_2` com 2, `E_2_3_2` com 2; `E_1_3_2` tem 4, sem reserva (fonte: `docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md:21-38`). O sorteio exige `nH >= 4` nos 18 estratos e recusa com erro tipado (`src/lib/gee/sorteioPoligonos.ts:438-446`; `src/lib/gee/sorteioPoligonosTipos.ts:337-346`). A recusa é correta: o desenho não pode ser executado.

O que não é correto é a rota de candidatos contornar o problema: ela calcula a cota apenas sobre os estratos ocupados e redistribui a sobra (`src/lib/gee/estratificacao.ts:263-293`), transformando “18 estratos” em “n estratos ocupados” sem decisão do pesquisador. A dependência entre Ŝ e K̂ é real e forte (`χ² = 67,5667`, `p = 2,13×10⁻¹⁵`, `V = 0,3159`); um desenho que exige células estruturalmente vazias não é um fatorial completo. A decisão de colapsar, excluir ou declarar fora do domínio é emenda a D12/D16, não ajuste de código.

**Recomendação:** manter a recusa do sorteio; não permitir que a rota “conserte” o vazio por redistribuição; levar ao pesquisador a decisão já registrada na auditoria de 31/10, com emenda formal antes de qualquer selo.

### D-02 — A unidade sorteada é o imóvel, não a área (S1)

D16 define 72 polígonos de 5,02 ha sorteados com `pi_i` (`src/config/decisoes.ts:301`); D23 define a unidade primária como o polígono e `pi_i = n_h/N_h` (`:425`). O sorteio registra `pi_i = 4/N_h` (`sorteioPoligonos.ts:473`), com `N_h` = candidatos do estrato, não hectares. Não há área do imóvel no cálculo, e o polígono tem sempre 5,02 ha.

Se um imóvel tem 10 ha e outro 1.000 ha, ambos contribuem com 5,02 ha e têm a mesma probabilidade. A amostra é autoponderada para polígonos de 5,02 ha, não para hectares da BP3. “Prevalência na população de polígonos elegíveis” é defensável; “área afetada na BP3” não é, com este `pi_i`. Se a área for o alvo, é preciso um segundo desenho ou pesos de área; não reutilizar `4/N_h` como peso de área.

### D-03 — Amostra desproporcional, modelo sem pesos e `pi_i` ausente (S2)

A cota é uniforme por estrato ocupado (`estratificacao.ts:265`), não proporcional a `N_h`. Os `N_h` variam de 2 a 49; `w_i = N_h/4` varia de 0,5 a 12,25 (no treino, `N_h/2` de 1 a 24,5). O avaliador ajusta XGBoost e regressão penalizada **sem `sample_weight`** (`scripts/d25/avaliacao_d25_referencia.py:317-348`). A matriz não contém `pi_i` nem `w_i` (`src/lib/matriz/perfis.ts:143-188`; `src/lib/export/planilha.ts:303-345`).

O modelo aprende na amostra desproporcional, em que estratos raros estão sobre-representados. A relação pode não valer para a BP3, mesmo que o ranking no held-out seja bom. D23 invoca King & Zeng para sobreamostrar eventos raros, mas a correção a priori é de **probabilidade**, não da distribuição de covariáveis, e não é aplicada no treino nem na avaliação. D25 mede desempenho na amostra estratificada, não na população.

**Recomendação:** declarar que o estimando de D25 é a amostra estratificada; ou registrar `pi_i`/`w_i` e aplicar pesos/pós-estratificação; ou separar modelo de triagem de estimativa populacional. A pior opção é a atual: amostra desproporcional com texto de população.

### D-04 — Geometria, encaixe e espaçamento não são verificados (S2)

O polígono de 5,02 ha é um quadrado alinhado aos eixos, lado `sqrt(50.200) ≈ 224,05 m`, centrado no candidato (`src/lib/gee/sorteioPoligonos.ts:349-378`). D16 admite quadrado ou retângulo até 1:2, orientado preferencialmente no declive (`decisoes.ts:301`); o construtor não implementa retângulo nem orientação. As pré-condições verificam decisões, P05, WorldCover, K ambíguo e contagem ≥4, mas não se o quadrado cabe no imóvel, se cruza estrada/água/urbano, nem a distância entre polígonos (`sorteioPoligonosTipos.ts:187-359`). O thinning de 1 km é aplicado aos centróides **antes** da realocação para célula elegível dentro do imóvel (`src/app/api/gee/select-candidates/route.ts:294-431`), sem novo thinning.

Um quadrado de 224 m centrado em imóvel estreito pode sair do imóvel, cruzar APP/estrada/área não agrícola e contaminar o domínio D07, além de inviabilizar a autorização de sobrevoo. A orientação fixa ignora o declive. O espaçamento P02 pode ser violado após a realocação. O selo não detecta nenhum desses fatos.

**Recomendação:** verificar contenção no imóvel e no domínio; permitir retângulo/orientação; recalcular o thinning após realocação; registrar a distância mínima realizada; se não for possível, declarar que o selo não garante encaixe.

### D-05 — Não resposta e âncora de prevalência sem desenho de inferência (S2)

O módulo de pool modela recusas como binomiais independentes e declara a simplificação: recusas podem ser correlacionadas por vizinhança, cooperativa ou perfil fundiário (`src/lib/gee/poolEstratos.ts:1-15`). Sob 25% de recusa, `E_1_3_2` (4 candidatos) tem 31,6% de chance de preencher os 4 titulares; estratos com 0–3 têm 0% (`docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md:47-49`). Não há modelo de não resposta, peso de resposta ou sensibilidade para recusa correlacionada.

D23 prevê 60–80 pontos de campo **fora dos polígonos**, com `pi_i` conhecido, para prevalência (`decisoes.ts:425-427`). A rota de candidatos usa default **50** (`route.ts:188-190`), não registra `pi_i` e não exclui polígonos D16. `montagem` exclui corretamente “campo” do treino (`src/lib/matriz/montagem.ts:153-160`), mas não há módulo de estimativa de prevalência por HT. A âncora que deveria corrigir a prevalência para a correção a priori de D23 não é operacionalizada.

**Recomendação:** pré-registrar protocolo de não resposta (substituição com `pi_i` atualizado, pesos de resposta ou sensibilidade com recusa correlacionada); separar a seleção da âncora da seleção dos polígonos; registrar `pi_i` dos pontos de campo; implementar o estimador antes de usar a correção a priori.

---

## 4. Alvo

### T-01 — O alvo primário é um controle manual com default 0,00 (S1)

D26 define a fração da célula **delineada como erodida**, obtida por **rasterização da delineação vetorial** (`decisoes.ts:547-548`). O script de referência faz isso: une feições, intersecta com o voo, calcula `Fracao_Erodida = a_del / parte.area` e confere conservação de área (`scripts/d25/fracao_erodida_celulas_referencia.py:68-115`). O app **não ingere** esse CSV: a fração é um `input type="range"` inicializado em **0,00** (`src/components/inspetor/InspetorPonto.tsx:36`, `:285-293`). A classe inicial é **“erosao”** (`:37`), e a validação só exige data e observador; não verifica coerência classe↔fração (`src/lib/rotulos/rotuloHumano.ts:30-68`). É possível salvar `classe = "erosao"` com `fracao = 0,00`; `montarMatrizTreino` usa a fração como alvo (`src/lib/matriz/montagem.ts:197-219`), e o ponto entra como **negativo**. O observador já vem “Pesquisador PPGTCA” (`InspetorPonto.tsx:39`) e a confiança “alta” (`:41`), apesar do comentário do validador dizer que não há default.

Este é o achado mais grave do alvo: o default é uma contradição silenciosa — classe positiva, fração zero. Se o usuário não mover o slider, “erosão” vira alvo 0. A fração não tem rastro de rasterização, área delineada, cobertura da célula nem operador de delineação.

**Recomendação:** não permitir salvar fração 0,00 com classe “erosão” sem justificativa; exigir a fração do script de referência (ou valor com origem e área); remover o default 0,00; remover observador/confiança padrão; teste de coerência classe↔fração. O que fazer quando a fração é desconhecida é decisão do pesquisador; o código não deve inventar zero.

### T-02 — Células parciais, `Incluida` e `Pixel_ID` não chegam à matriz (S1)

O script de referência calcula `Cobertura_Celula`, `Incluida` (cobertura ≥ 0,95), `Pixel_ID` opaco e `Area_Delineada_m2` (`fracao_erodida_celulas_referencia.py:96-110`). A fração é calculada sobre a **porção observada** (`:100`), não sobre a célula inteira. A matriz não contém `Incluida`, `Cobertura_Celula`, `Pixel_ID` nem `Area_Delineada_m2` (`perfis.ts:143-188`; `planilha.ts:303-345`). O D25 tenta filtrar por `Incluida` e verificar pixels disjuntos, mas **retorna silenciosamente** quando as colunas não existem (`avaliacao_d25_referencia.py:176-195`). `COBERTURA_MIN = 0,95` é P11, ainda **proposta** (`fracao_erodida_celulas_referencia.py:33`).

Uma célula com 50% de cobertura e 100% da parte observada erodida recebe `Fracao_Erodida = 1,0`; sem `Incluida`, o alvo é inflado em relação à célula inteira. O filtro P11 é perdido na exportação. A checagem de pixel compartilhado também é perdida.

**Recomendação:** levar `Incluida`, `Cobertura_Celula`, `Pixel_ID` e `Area_Delineada_m2` à matriz; aplicar P11 explicitamente (e decidir P11); fazer o D25 falhar se as colunas de controle faltarem; testar célula parcial.

### T-03 — O alvo mede o estado (cicatriz), não o evento (S2)

D26 define a fração “delineada como erodida” em uma data de voo (`decisoes.ts:547-548`). Não há idade da feição nem distinção entre erosão ativa e cicatriz estabilizada. D19, que trataria de eventos pré/pós, é **secundária** e não entra na matriz nem em D25 (`decisoes.ts:373-380`). O alvo do Modelo P é o mesmo estado em t0, com preditores encerrados 24 meses antes (`src/lib/matriz/montagemTemporal.ts:173-181`).

O modelo aprende onde **há** erosão, não onde **surgirá**. Para triagem/localização pode ser útil; para “predição” é extrapolação semântica. Um ponto com cicatriz antiga é positivo; um processo incipiente ainda não visível é negativo. A dissertação precisa escolher “predição espacial da presença” ou “previsão de nova erosão”; se a segunda, o alvo precisa de duas datas e de uma definição de incidente.

### T-04 — Tweedie ilimitado para alvo limitado; limiar binário sem sensibilidade (S2)

O alvo é `[0,1]`; o modelo é `reg:tweedie` (`avaliacao_d25_referencia.py:286-291`), não negativo mas sem teto. As predições não são clipadas antes de Spearman/AUC (`:424-425`); não há Brier, calibração ou reliability plot. O binário é `fração >= 0,25` (`src/lib/rotulos/binarizacao.ts:6,19-26`); D26 o declara secundário, mas D25 o usa para AUC, sem sensibilidade de limiar.

Para Spearman/AUC o teto não importa (transformação monotônica); para “fração predita”, importa: 1,3 não é fração. O limiar 0,25 muda a prevalência do binário e a AUC; a escolha é pré-registrada, mas não testada. Sem calibração, não se pode afirmar que a probabilidade é utilizável para priorização com custo assimétrico.

**Recomendação:** declarar que o modelo é um **ordenador**, ou acrescentar família limitada (beta/zero-inflada) e clipar/calibrar; reportar sensibilidade do limiar; incluir Brier/calibração se a probabilidade for usada.

### T-05 — Sem confiabilidade interobservador nem cegamento operacional (S2)

O kappa de Cohen é usado para **fotointerpretação** (`src/lib/rotulos/concordancia.ts`); `ingestaoDrone` não calcula kappa de delineação, e o Inspetor grava um único observador. O campo `cego` é derivado de `modo === "registro"` na UI (`src/lib/rotulos/rotuloHumano.ts:53`), não de protocolo cego; o mesmo pesquisador pode ver série, estrato e laudo JEV enquanto delineia. Observador “Pesquisador PPGTCA” e confiança “alta” são preenchidos automaticamente (`InspetorPonto.tsx:39-41`). D16 reconhece que a cifra de 78% “não se reproduz” e está em verificação (`decisoes.ts:302`).

A incerteza do alvo não é medida. Se dois delineadores concordam 80% ou 95%, a conclusão de D25 muda; se o delineador vê as predições, o held-out deixa de ser cego. O alvo é a variável de maior impacto e a única sem estimativa de confiabilidade.

**Recomendação:** delinear uma amostra por dois operadores independentes e reportar kappa/IoU da delineação; manter o held-out literalmente cego; registrar operador e confiança observados, não defaults; medir o erro conjunto rótulo→célula antes de usar o 78%.

---

## 5. Validação

### V-01 — Só o Modelo D é exportado e avaliado (S1)

Todas as exportações de matriz fixam `modeloJanela: "D"`: `src/lib/export/planilha.ts:290`; `src/lib/export/pacoteReprodutibilidade.ts:124` e `:697`; `src/components/matriz/PainelMatrizTreino.tsx:21`. `montarMatrizTreino` aceita `"D" | "P"` (`src/lib/matriz/montagem.ts:104-115`) e `montarPreditoresTemporais` implementa a guarda de 24 meses (`montagemTemporal.ts:165-181`), mas nenhum caminho de produção exporta P. D04 diz “ambos os modelos integrados” (`decisoes.ts:125-134`); D25 avalia a matriz que recebe.

O que D25 mede é **detecção contemporânea** (D). A **predição prospectiva** (P), a mais valiosa para a dissertação, não tem matriz, avaliação nem métrica. Se o texto usar “predição” no sentido de P, a evidência não existe; se usar como “predição espacial de estado”, D04/D16/D19 precisam ser reescritos nesse sentido.

**Recomendação:** exportar duas matrizes nomeadas (`Modelo_D`, `Modelo_P`), com `Modelo`, `Data_Referencia` e `Fim_Janela`; avaliar D e P separadamente; não apresentar D como P.

### V-02 — O held-out é aleatório dentro do estrato, não bloco espacial (S1)

D16: quatro polígonos por estrato, **dois treino e dois held-out** (`decisoes.ts:301`); o sorteio escolhe 4 e sorteia os papéis (`sorteioPoligonos.ts:483-510`). D25 usa `GroupKFold` por `Poligono_ID` **apenas na validação interna**; a avaliação final é uma única partição treino/held-out por polígono (`avaliacao_d25_referencia.py:304-314`, `:390-395`). Não há buffer, bloco espacial ou teste de distância treino–held-out. `blocosEspaciais.ts` existe, mas D25 não o usa; D24 cita `GroupKFold` por polígono, não por bloco. Solos e chuva têm escala maior que 1 km (polígonos pedológicos; grade de 5–10 km), de modo que treino e held-out do mesmo estrato compartilham essas covariáveis.

O held-out não é espacialmente independente; é uma amostra aleatória de polígonos dentro de estratos. Mede generalização para novos polígonos na mesma paisagem, não para novas regiões. O desempenho pode ser otimista. D24 mitiga pseudorreplicação **dentro** do polígono, não autocorrelação **entre** polígonos.

**Recomendação:** avaliação final por blocos espaciais (ou grupos separados por buffer), com alcance do variograma; manter `GroupKFold` por polígono como validação interna; reportar distância mínima treino–held-out e sensibilidade ao buffer. A decisão de trocar a partição é do pesquisador; não chamar a partição atual de “spatial CV” é de nomenclatura.

### V-03 — A matriz não carrega as chaves do desenho; as guardas do D25 são vácuas (S1)

A matriz contém `Celula_ID`, `Poligono_ID`, `Papel_Conjunto`, `Fracao_Erodida`, `Alvo_Binario_25`, `Ponto_ID`, `Bloco_Espacial` e preditores, mas não:

| Coluna | Para quê | Onde se perde |
|---|---|---|
| `Estrato_ID` | estratificação, pesos, cobertura dos 18 estratos | `perfis.ts:143-188`; `planilha.ts:303-345` |
| `pi_i` / `w_i` | inferência D23, HT, ponderação | não existe no tipo `PontoAmostral` nem na matriz |
| `Incluida` | filtro P11 | `perfis.ts`; `_so_incluidas` fica sem efeito |
| `Cobertura_Celula` | auditoria do alvo parcial | idem |
| `Pixel_ID` | impedir pixel em treino e held-out | idem; `_checar_pixels_disjuntos` fica sem efeito |
| `Modelo` / `Data_Referencia` | distinguir D de P e auditar a guarda | não existe |

O D25 declara `Estrato_ID` no contrato (`avaliacao_d25_referencia.py:11-16`) e o proíbe como preditor (`:55-57`), mas não exige a coluna. `_so_incluidas` e `_checar_pixels_disjuntos` retornam sem erro quando faltam (`:176-195`). `auditar_preditores` só verifica preditores declarados, não as chaves do desenho.

O avaliador parece mais protegido do que é: não pode verificar cobertura, pixel compartilhado, estrato ou peso porque a matriz não os carrega. A guarda de pixel é especialmente enganosa: existe, mas nunca dispara.

**Recomendação:** adicionar as colunas (com `Pixel_ID` opaco; `pi_i` não é coordenada); fazer o D25 **falhar** se `Incluida`/`Pixel_ID`/`Estrato_ID` faltarem em modo probatório; testar que a guarda dispara com pixel repetido.

### V-04 — O D25 não está pronto para o modo probatório (S2)

O config é `config_pre_registro_PROPOSTA.json`: `pre_registro: null` (`:50`), e o arquivo diz “PROPOSTA NAO CONGELADA” (`:2`). O `--probatorio` recusa sem `declarado_por`, `declarado_em` e `sha256_config_congelada` (`avaliacao_d25_referencia.py:367-375`). Os blocos incluem `NDVI_Maximo_Mediano`, `Curvatura_Perfil` e `TWI`; o config reconhece que não existem ou saem indisponíveis (`:60-63`), e `auditar_preditores` recusa preditor 100% ausente. O config pede renomear `NDVI_Maximo_Mediano` para `NDVI_P90_Serie`. `RUSLE_A` não existe porque R/LS não são fornecidos (`:61`); sem A, o competidor RUSLE é `NaN` e o desfecho é `NAO_AVALIAVEL`.

O script não exige 36 polígonos held-out nem 18 estratos: aceita `held-out >= 2` e `treino >= 4` (`:394-395`). Um held-out truncado produziria resultado “probatório” com n menor que o pré-registrado. O script não exige `monotonicidade` preenchida; se o config omitir, o modelo principal roda sem as restrições físicas de D24. Tampouco exige que a grade de Tweedie seja declarada: se ausente, usa `GRADE_PADRAO` (`:46-49`), cujos expoentes pertencem a P10, ainda **proposta**; `TWEEDIE_POWER = 1.5` é outro fallback (`:45`).

O D25 é um bom avaliador, mas hoje aceita matriz incompleta e config não congelado. A execução `--probatorio` falha por desenho, o que é correto; o risco é alguém rodar `--dryrun-sintetico` e apresentar números. O prefixo protege, mas não impede citação seletiva.

**Recomendação:** fechar o config (colunas reais, monotonicidade, grade, hash); exigir 36/18 no modo probatório; exigir as chaves; exigir R/LS ou declarar não avaliável; falhar em vez de usar P10 default.

### V-05 — Poder e multiplicidade: 36 clusters não resolvem 0,10 (S3)

D25 usa bootstrap por polígono; há 36 polígonos held-out, 2 por estrato (`decisoes.ts:534`). O texto reconhece que “a potência é governada por 18 agrupamentos ... o intervalo é largo e pode conter zero ainda que a margem seja atingida” (`:534`); a emenda corrige para 36, mas mantém a estrutura ternária. Há um desfecho principal, um quarto desfecho e duas sensibilidades, sem correção de multiplicidade.

Com 36 clusters, uma diferença de Spearman de 0,10 está próxima do ruído; o desfecho mais provável, mesmo com vantagem real moderada, é `INCONCLUSIVA`. Isso não é falha do avaliador; é limitação de potência. O quarto desfecho e as sensibilidades aumentam a chance de achado “positivo” por multiplicidade se reportados como testes.

**Recomendação:** reportar poder a priori para 0,10 com 36 clusters (sensibilidade, não resultado); declarar quarto desfecho e sensibilidades como **secundários e não confirmatórios**; não reclassificar o principal.

### V-06 — Sítios contínuos: conveniência e IC do kappa ingênuo (S2)

`validacaoMatricial.ts` calcula acurácia, kappa, F1 e IoU em sítios contínuos de Céu Azul/Medianeira (`:1-37`). Esses sítios não foram sorteados probabilisticamente; D06 os trata como aferição instrumental, não massa de treino/teste (`decisoes.ts:153`). O IC do kappa é assintótico e assume pixels independentes; o próprio código reconhece que o `N_efetivo` é menor e que o intervalo fica “artificialmente estreito” (`:223-229`), mas ainda o reporta (`:240`).

A acurácia nos sítios não é generalizável para a BP3; é medida local em áreas provavelmente mais erodidas. O IC estreito pode dar falsa precisão. IoU e kappa são úteis como aferição, não como validação populacional.

**Recomendação:** rotular como “aferição local em sítios de conveniência”; corrigir o IC por block bootstrap/variograma; não usar esses números para sustentar a superioridade de D25.

### V-07 — Sem calibração nem avaliação da correção a priori (S3)

D23 exige correção a priori ancorada na prevalência (King & Zeng). D25 mede Spearman e AUC; não mede Brier, calibração ou a probabilidade corrigida. O desfecho é de ordenação, coerente com priorização, mas o texto de D23 fala em “probabilidade predita”.

Se a saída for usada para área/probabilidade, calibração é necessária; se para ordenar visitas, não. A dissertação precisa declarar o uso. Hoje a métrica é de ordenação, mas a narrativa de prevalência sugere probabilidade.

**Recomendação:** declarar que o produto é um ranking; se probabilidade, incluir calibração e correção a priori com a prevalência da âncora; não misturar as linguagens.

---

## 6. O que a evidência permite concluir

1. **O desenho não está executável como pré-registrado.** A dependência Ŝ×K̂ e os quatro estratos com menos de 4 candidatos impedem o sorteio de 72 polígonos. A recusa do código é correta; a solução é emenda formal, não redistribuição silenciosa.
2. **O alvo não é o que D26 descreve no app.** O script de referência calcula corretamente; o app oferece um slider com default 0,00, classe “erosao” por default e nenhuma checagem de coerência. O alvo pode ser falso negativo por omissão.
3. **A validação mede D, não P.** Todas as exportações fixam o Modelo D. A predição prospectiva de D04 não tem matriz nem métrica.
4. **A validação não é espacial.** O held-out é sorteado dentro do estrato; não há bloco nem buffer. O `GroupKFold` por polígono protege contra pseudorreplicação dentro do polígono, não contra autocorrelação entre polígonos.
5. **A matriz perdeu as chaves do desenho.** Sem `Estrato_ID`, `pi_i`, `Incluida` e `Pixel_ID`, as guardas de D25 são opcionais e a inferência de D23 não é reproduzível.
6. **A inferência de área não é sustentada pelo `pi_i` de imóvel.** O desenho é de polígonos de 5,02 ha dentro de imóveis; não é amostra de área da BP3.

Nada disso diz que a pesquisa é inválida. Diz que **as afirmações precisam ser reduzidas ao que o desenho sustenta** até que as emendas e a integração sejam feitas. Um resultado `INCONCLUSIVA` ou uma acurácia local declarada como local são científicos; uma superioridade não avaliada ou uma área não identificada não são.

---

## 7. Checklist de defensabilidade

| Pergunta | Resposta atual | O que falta |
|---|---|---|
| Qual é a população e a unidade de sorteio? | imóveis elegíveis, polígono de 5,02 ha | declarar que não é área; ou desenho de área |
| Qual é o estimando? | ambíguo entre E1/E2/E3/E4 | uma frase por produto |
| O sorteio de 18 estratos foi executado? | não; 4 estratos inviáveis | emenda D12/D16 |
| A amostra é probabilística? | sim para polígonos, não para área | pesos/declaração |
| O alvo é a fração de D26? | no app é manual, default 0 | integração com o script; sem default |
| O alvo tem confiabilidade? | não medida | kappa/IoU de delineação |
| O held-out é independente? | não espacialmente | bloco/buffer |
| O modelo avaliado é D ou P? | D | exportar/avaliar P |
| A matriz tem as chaves do desenho? | não | `Estrato_ID`, `pi_i`, `Incluida`, `Pixel_ID` |
| O D25 está pré-registrado? | config proposta, não congelada | congelar hash e colunas |
| A potência resolve a margem? | provavelmente não | análise de poder declarada |
| A acurácia dos sítios é generalizável? | não | declarar como local |

---

## 8. Prioridades

### P0 — antes de qualquer resultado probatório

1. **Resolver o fatorial** (D-01): emenda formal a D12/D16; manter a recusa; remover a redistribuição silenciosa.
2. **Definir o estimando** (D-02): área vs polígono; se área, desenho/pesos; se modelo, limitar a afirmação.
3. **Corrigir o alvo no app** (T-01): sem default 0,00; sem classe “erosao” com fração 0; integrar a fração do script; registrar origem.
4. **Levar as chaves do desenho à matriz** (V-03).
5. **Exportar e avaliar o Modelo P** (V-01), ou declarar que a evidência é de detecção.
6. **Fazer o D25 falhar sem as chaves** (V-04).

### P1 — antes da campanha

7. **Geometria/encaixe/thinning** (D-04).
8. **Não resposta e âncora** (D-05).
9. **Confiabilidade do alvo** (T-05).
10. **Cobertura P11** (T-02).
11. **Calibração/limiar** (T-04).

### P2 — antes da defesa

12. **Potência/multiplicidade** (V-05).
13. **Sítios contínuos** (V-06).
14. **Modelo D/P e data de referência** (V-01).

---

## 9. Limites

- **Não há dados de desfecho**: nenhuma conclusão sobre acurácia real, prevalência real ou superioridade.
- **Não executei GEE/Planet/Embrapa**; a auditoria é de desenho, código e artefatos.
- **Não li todos os PDFs**; lastro bibliográfico fica na auditoria anterior.
- **Não decido** colapso de estratos, unidade de área, limiar, partição espacial ou família de modelo. Essas são decisões do pesquisador; a auditoria mostra o custo científico de cada estado atual.
- **Ausência de problema no código não é prova de correção**: onde não há teste, a conclusão é “não verificado”.

---

## Anexo A — Números

- Ocupação: `N_h` de 0 a 49; 4 estratos com `N_h < 4`; 1 com `N_h = 4` sem reserva (`2026-10-31_ocupacao_estratos_d16.md:21-38`).
- Pesos: `w_i = N_h/4` de 0,5 a 12,25; no treino, `N_h/2` de 1 a 24,5. A matriz não carrega nenhum.
- Eficiência: D24 estima 1.841 unidades efetivas para 34.800 células (≈18,9) e 920 para 18.072 held-out (≈19,6); o bootstrap reamostra 36 polígonos.
- Colunas presentes: `Celula_ID`, `Poligono_ID`, `Papel_Conjunto`, `Fracao_Erodida`, `Alvo_Binario_25`, `Ponto_ID`, `Bloco_Espacial`, preditores.
- Ausentes: `Estrato_ID`, `pi_i`, `w_i`, `Incluida`, `Cobertura_Celula`, `Pixel_ID`, `Modelo`, `Data_Referencia`, `Fim_Janela`.

## Anexo B — Arquivos

[decisoes.ts](../../src/config/decisoes.ts) · [select-candidates](../../src/app/api/gee/select-candidates/route.ts) · [estratificacao.ts](../../src/lib/gee/estratificacao.ts) · [sorteioPoligonos.ts](../../src/lib/gee/sorteioPoligonos.ts) · [sorteioPoligonosTipos.ts](../../src/lib/gee/sorteioPoligonosTipos.ts) · [montagem.ts](../../src/lib/matriz/montagem.ts) · [perfis.ts](../../src/lib/matriz/perfis.ts) · [planilha.ts](../../src/lib/export/planilha.ts) · [InspetorPonto.tsx](../../src/components/inspetor/InspetorPonto.tsx) · [rotuloHumano.ts](../../src/lib/rotulos/rotuloHumano.ts) · [fracao_erodida_celulas_referencia.py](../../scripts/d25/fracao_erodida_celulas_referencia.py) · [avaliacao_d25_referencia.py](../../scripts/d25/avaliacao_d25_referencia.py) · [validacaoMatricial.ts](../../src/lib/padraoOuro/validacaoMatricial.ts) · [ocupacao](../../docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md)

---

**Fim do relatório.** Nenhum código, decisão ou parâmetro foi alterado.
