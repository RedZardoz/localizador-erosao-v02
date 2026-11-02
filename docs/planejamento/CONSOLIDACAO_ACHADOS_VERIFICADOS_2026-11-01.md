# Consolidação dos Achados Verificados — Auditorias de 31/10 e 01/11/2026

**Data:** 1 de novembro de 2026
**Commit verificado:** `f63d8a5` (branch `sarel/executor-2026-10-09`)
**Objeto:** triagem independente dos três documentos de 01/11/2026 — a auditoria científica do desenho/validação/alvo, a proposta de correções e o prompt executor da frente XGBoost.
**Natureza:** verificação de asserções contra o código e o registro. Nenhum arquivo de código, decisão ou parâmetro foi alterado. Nenhuma decisão metodológica é tomada aqui (CLAUDE.md §2).

> **Critério desta triagem:** um achado só entra como válido se a asserção que o sustenta foi reproduzida no código ou no registro, com arquivo e linha. Asserção não reproduzida fica declarada como não reproduzida, não como falsa.

---

## 1. Método e limites

**O que foi feito.** Cada asserção verificável dos três documentos foi conferida contra `f63d8a5` por leitura direta do arquivo citado. Onde a numeração de linha divergia, procurou-se o símbolo no arquivo inteiro antes de concluir divergência.

**Limites declarados.**

1. **A auditoria de 31/10 (`AUDITORIA_FUNCIONALIDADES_COERENCIA_E_LASTRO_2026-10-31.md`) não está em `f63d8a5` nem foi fornecida.** Os achados `F-01` a `F-20`, citados pela proposta na tabela de rastreabilidade, **não puderam ser verificados**. Tudo o que esta consolidação diz sobre eles vem da paráfrase feita pela proposta.
2. **Não foram executados `npm run typecheck`, `lint` ou `test`.** O checkout não tem `node_modules` e a instalação não foi feita. A afirmação do prompt de que "typecheck passa e lint falha com 2 warnings" **não foi verificada**.
3. **Nenhum dado de desfecho existe.** Nada aqui diz respeito a acurácia, prevalência ou superioridade reais.
4. **Ausência de problema não é prova de correção.** Onde não há teste, a conclusão é "não verificado".

---

## 2. Achados confirmados no código

Todos os itens abaixo foram reproduzidos. A severidade é a do título da seção original na auditoria.

| ID | Achado | Evidência reproduzida | Sev. |
|---|---|---|---|
| D-01 | Quatro estratos com `N_h < 4` (um com zero) impedem o sorteio pré-registrado | `docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md`: `E_1_1_2`=0, `E_1_2_2`=3, `E_2_2_2`=2, `E_2_3_2`=2, `E_1_3_2`=4 sem reserva. Guarda ativa em `sorteioPoligonos.ts:466-471` | S1 |
| D-02 | A unidade sorteada é o imóvel, não a área | `sorteioPoligonos.ts:473-474`: `pi_i = 4/nH`, `w_i = nH/4`, com `nH` = contagem de candidatos do estrato. Polígono sempre 5,02 ha | S1 |
| D-03 | Amostra desproporcional, modelo sem pesos | `avaliacao_d25_referencia.py`: todos os ajustes são `.fit(X, y)` (linhas 310, 335, 337, 344), nenhum `sample_weight`. `pi_i`/`w_i` ausentes do perfil de matriz | S2 |
| T-01 | O alvo primário é um controle manual com default 0,00 | `InspetorPonto.tsx:36-41`: `fracaoErodidaInput` inicia `0.0`; classe inicia `"erosao"`; observador inicia `"Pesquisador PPGTCA"`; confiança inicia `"alta"`. Slider `type="range"` em `:285-293` | S1 |
| T-01b | A validação do rótulo não checa coerência classe↔fração | `rotuloHumano.ts:30-68`: exige apenas `observadoEm` e `observador` não vazios. É possível gravar `classe="erosao"` com `fracao=0,00` | S1 |
| T-02 | `Incluida`, `Cobertura_Celula`, `Pixel_ID` não chegam à matriz | `perfis.ts`, perfil `matriz-treino`: as quatro colunas ausentes da lista de permitidas | S1 |
| V-01 | Só o Modelo D é exportado | 4 pontos de produção fixam `modeloJanela: "D"` — `planilha.ts:290`, `pacoteReprodutibilidade.ts:124` e `:697`, `PainelMatrizTreino.tsx:21`. Nenhum caminho exporta P, embora `montagem.ts:104` aceite `"D" \| "P"` | S1 |
| V-03 | A matriz não carrega as chaves do desenho | `perfis.ts` `matriz-treino` não lista `Estrato_ID`, `Pi_i`, `W_i`, `Incluida`, `Cobertura_Celula`, `Pixel_ID`, `Modelo`, `Data_Referencia` | S1 |
| V-04a | As guardas do D25 se desligam em silêncio | `avaliacao_d25_referencia.py:176-181`: `_so_incluidas` faz `return df` se falta `Incluida`. `:184-195`: `_checar_pixels_disjuntos` faz `return` se falta `Pixel_ID` e `Grade_X/Y` | S1/S2 |
| V-04b | O modo probatório aceita held-out truncado | `avaliacao_d25_referencia.py:394-395`: exige apenas `heldout ≥ 2` e `treino ≥ 4` polígonos. Não exige 36/18 | S2 |
| V-04c | Config não congelado | `config_pre_registro_PROPOSTA.json:1`: "PROPOSTA NAO CONGELADA"; `pre_registro` não preenchido | S2 |
| A-03 | Semente fixa, contra P07 | `select-candidates/route.ts:296`: `const semente = 42`, propagada a thinning e realocação | — |
| A-04 | Fator C atribui D01 quando o modelo é híbrido | `fatorC.ts:127` alterna o texto de `modelo` conforme `temBsi`, mas `:133` fixa `decisoes: ["D01"]` em ambos os ramos | — |
| A-01 | D11.2 decidida e não implementada | Registro em `decisoes.ts:225` e emenda de 31/10 em `:245` fixam `n ≥ 12` e `SE ≤ 0,144`; código ainda usa piso escalar 6 | — |
| A-02 | P03 decidida e não implementada | `decisoes.ts:580-590`: `estado: "decidida"` com os três critérios (30 m / integridade de estrato / GNSS 5–10 m). `ingestaoKobo.ts:15,93-94`: ainda 15/25 m | — |

**Nota sobre A-01 e A-02.** Ambas foram testadas especificamente sob a hipótese de que a proposta estaria promovendo parâmetro novo sob a etiqueta de "implementação de decisão vigente". **A hipótese foi refutada:** os números (`n ≥ 12`, `SE ≤ 0,144`, 30 m, 5/10 m GNSS) estão no registro com estado `decidida` anterior à proposta. A classificação Classe A está correta nos dois casos.

---

## 3. Achados com severidade reclassificada

Estes achados são reais, mas a severidade atribuída pela proposta não se sustenta à verificação.

### R-01 — O fator 9,81 de D13 **não** é lastro pendente (proposta B-15 improcedente na parte principal)

A proposta afirma: *"O R depende de 9,81 para reproduzir a escala; a origem física não está na fonte lida."*

**Isso não se reproduz.** A emenda de D13 de 09/10/2026 (`decisoes.ts:260`) resolve a origem com rigor acima da média do projeto:

- demonstra que a equação impressa em Rufino et al. (1993) em kgf·m **não** reproduz a escala do R (a soma de 12 valores é no máximo `12a + bP`, limite excedido pelo Quadro 1 em seis das oito estações da Região 1);
- localiza a fonte da conversão: Waltrick (2010, dissertação UFPR, PDF arquivado em `docs/verificacoes/fontes/waltrick2010/waltrick_2010.pdf`) declara as equações "convertidas para o SI" e traz Região 1 como `Y = 182,86 + 56,21·X`, que é exatamente `18,64 × 9,81` e `5,73 × 9,81`;
- confirma em duas fontes independentes;
- 9,81 é `g`, a conversão kgf·m → J. Não é parâmetro de calibração.

**O que resta válido de B-15:** apenas a propagação da marca. `pendenteVerificacao: true` existe em um único lugar (`fatorR.ts:279`) e, pela proposta, não está no tipo nem chega ao CSV. **Severidade: baixa, custo mínimo.** A parte principal do achado é improcedente e não deve consumir decisão do pesquisador.

### R-02 — Rikimaru e os cortes de D02: válido como citação, de impacto científico baixo

A crítica é correta: `decisoes.ts:86` lista `referencia: "Rikimaru, T. et al. (2002); ..."` para uma decisão cujo valor são os cortes `BSI > 0,10`, `NDVI < 0,40`, `BSI < 0,00`, `NDVI > 0,65`, e Rikimaru é mapeamento de densidade de dossel florestal, que não prescreve esses cortes para erosão.

**Mas a emenda de 06/10/2026 (`decisoes.ts:84`) já retirou esses limiares de todo papel científico:** declara-os "CRITÉRIO DE TRIAGEM DE CANDIDATOS e uma ajuda visual, NÃO um rótulo", e afirma que "não têm papel na seleção de polígonos nem no alvo do modelo (D26)". **Verificação independente:** busca por `0.10`, `0.40`, `0.65` e `D02` em `select-candidates/route.ts` e `estratificacao.ts` **não retorna ocorrência** — os cortes de fato não filtram o pool nem a estratificação.

**Severidade cientifica: baixa. Severidade de governanca: alta** — ver N-13, descoberto depois desta avaliacao inicial. O impacto sobre o resultado continua baixo, porque os cortes nao entram no alvo nem na selecao. Mas a citacao de Rikimaru em D02 nao e um lapso remanescente: foi **acrescentada deliberadamente para quitar uma divida de lastro**, por orientacao da propria norma do projeto, e a divida consta como quitada. Isso muda a natureza da correcao, que deixa de ser cosmetica.

### R-03 — A trava de lastro **não** é vácua (proposta C-05 improcedente nesta parte)

A proposta afirma: *"as duas travas atuais são vácuas."*

`src/config/lastroCientifico.test.ts` é o oposto de vácua: é um *ratchet* com dívida nomeada. Reprova qualquer entrada nova com estado `decidida` sem marcador de fonte externa; passa hoje por causa de uma lista `DIVIDA_DECLARADA` de **11 entradas** (`D03`, `D18`, `P07`, `D17`, `P06`, `P08`, `P09`, `P11`, `P20`, `P21`, `P23`); e — o detalhe que a torna boa — **exige a remoção da entrada quando a dívida é quitada**, de modo que a lista não apodrece em silêncio. O próprio comentário documenta o motivo histórico: sete decisões chegaram a 20/10/2026 sem lastro externo.

**Não localizei a segunda trava** a que a proposta se refere. A asserção fica como não reproduzida para esta trava, e o mecanismo existente deve ser **estendido**, não substituído (ver L-05).

### R-04 — "7 de 41 caminhos existentes": número não reproduzido

Extraindo do `INVENTARIO_SELECAO_BIBLIOGRAFICA.md` os caminhos sob `docs/verificacoes/fontes/`, obtêm-se 8 caminhos, dos quais **6 existem** em `f63d8a5`. O diretório de fontes contém **49 arquivos** arquivados (PDFs primários, scripts de extração e saídas), entre eles Renard 1997 (`ah_703.pdf`), Rufino 1993, Waltrick 2010 e 2015, Zhu 2013, Desmet & Govers 1996, Hyndman & Fan 1996, Schmidt 2019 e NEPAR 2011.

A **direção** do achado é válida — a maioria das obras citadas no inventário não tem caminho rastreado, e o acervo arquivado é mais rico do que o inventário declara —, mas o número "7 de 41" não foi reproduzido e não deve ser citado. O defeito real é de **sincronia entre o inventário e o acervo**, em ambos os sentidos.

---

## 4. Achados novos desta verificação

### N-01 — Cochran §5A.12 não está conferido no primário; B-01 não é decidível pela opção recomendada (CRÍTICO)

Os três documentos recomendam, para o gate mais bloqueante do projeto (B-01, o fatorial inviável), a **opção 1 — colapsar estratos**, e dão como lastro "Cochran (1977) §5A.12". A proposta escreve que a opção 1 "usa um estimador de variância conhecido (Cochran, viés positivo)"; o prompt lista "Lastro: Cochran (1977) §5A.12".

**O que está arquivado não é Cochran.** `docs/verificacoes/fontes/cochran1977/cochran_1977_sampling_techniques_ch5a12.md` é uma síntese de 68 linhas que **se autodeclara**:

- `Status de Conferência: NAO_CONFERIDO_NO_PRIMARIO (Regras R-L1 e R-L4)`;
- origem: *"síntese da literatura secundária e sumários acadêmicos públicos"*; o exemplar primário **não** está depositado;
- *"qualquer decisão de desenho apoiada nesta saída repousa provisoriamente sobre citação não conferida"*;
- *"devem ser homologadas perante o texto primário antes de suportar qualquer emenda oficial a D12/D16"*.

Ou seja: o repositório **já diz** que esse lastro não autoriza a emenda a D12/D16, e os três documentos novos tratam-no como se autorizasse. É exatamente o regime de D22 (tabela de origem em IA) aplicado agora à decisão estrutural do desenho amostral — com o agravante de que D22 está explicitamente marcada como provisória e não implementada, enquanto B-01 seria executado.

**Atribuição, para não tomar crédito indevido.** Isto **já havia sido estabelecido pelo projeto em 31/10/2026**. O prompt `docs/planejamento/prompts/PROMPT_EXECUTOR_CLI_POOL_E_LASTRO_COCHRAN_2026-10-31.md` identificou que `docs/verificacoes/fontes/cochran1977/` tinha nota sem PDF nem SHA-256, exigiu a escolha entre arquivar o primário ou declarar a síntese como não conferida, e instruiu textualmente: *"Se a opção for (b) e Cochran era o lastro da Saída 3 ... diga isso com todas as letras no relatório: a recomendação passa a repousar em citação não conferida, e o pesquisador precisa saber disso antes de decidir entre as quatro saídas."* O executor cumpriu, escolhendo (b). **O achado é novo apenas em relação aos três documentos de 01/11**, que recomendam a opção 1 de B-01 citando esse lastro como se conferido — ou seja, há regressão de um dia para o outro, não descoberta.

**Consequência para o sequenciamento:** a conferência de Cochran no primário **precede** o gate B-01, que precede todo o resto. A validação bibliográfica não é a última fase do plano; é a primeira.

### N-02 — Duas funções de sorteio exportadas, com `pi_i` incompatível

`src/lib/gee/sorteioPoligonos.ts` exporta duas rotinas de sorteio:

| Função | Linha | `pi_i` | `w_i` | n | Testes |
|---|---|---|---|---|---|
| `sortearPoligonosDroneD16` | 108 | `2/N_h` | `N_h/2` | 36 | suíte completa em `sorteioPoligonos.test.ts` (10+ chamadas) |
| `sortear72PoligonosD16` | 385 | `4/N_h` | `N_h/4` | 72 | — |

Agravantes verificados: o **docstring de cabeçalho do arquivo** (linhas 13 e 106) documenta `pi_i = 2/N_h` como a regra do módulo; e **D23 no registro** (`decisoes.ts:425`) ainda diz "36 polígonos de 10 ha, dois por estrato", com `pi_i = n_h/N_h`.

A proposta trata isso como texto defasado (A-09, "D23 36 vs 72"). É mais do que texto: é código exportado e testado capaz de selar o `pi_i` errado, com a documentação do próprio módulo apontando para ele. Como o selo de `pi_i` é irreversível por desenho (D16 proíbe sobrescrever selo), um chamador equivocado produz dano não recuperável.

### N-03 — Spearman sobre alvo zero-inflado torna a margem de 0,10 uma quantidade de escala desconhecida

D26 (`decisoes.ts:547`) fixa a fração contínua como alvo e declara: *"a maioria das células é 0"*. D23 (`:425`) fixa correlação de postos como métrica primária de D26. D25 pré-registra margem de 0,10.

Com forte inflação de zeros, **todos os zeros empatam**: Spearman mede essencialmente a separação zero/não-zero somada ao ordenamento interno dos positivos, e sua distribuição nula depende da prevalência de zeros — **que só será conhecida depois do primeiro voo**. Pré-registrar uma margem numérica numa escala cujo comportamento depende de um parâmetro ainda não observado enfraquece justamente o que D25 existe para proteger. Nenhum dos três documentos menciona o tratamento de empates.

Isso é emenda a decisão vigente (D25/D26) e precisa ser resolvido **antes do primeiro rótulo**; depois, qualquer mexida é flexibilidade analítica.

### N-04 — B-01 e B-08 estão acoplados, e são tratados como independentes

B-01 opção 1 (recomendada) leva a 14–16 estratos, portanto **28–32 polígonos held-out**, contra os 36 sobre os quais a análise de poder já é descrita como marginal para a margem de 0,10. B-08 recomenda manter 0,10 e aceitar `INCONCLUSIVA`.

Aceitas as duas recomendações em conjunto, decide-se de antemão — antes de voar — que o desfecho principal provavelmente será inconclusivo, com 281–321 ha de VANT a ~4 cm de GSD gastos para chegar lá. Isso pode ser a escolha correta (um inconclusivo honesto é resultado científico), mas é uma **decisão de alocação de esforço de campo**, e nenhum dos 12 gates a apresenta nesses termos. A proposta declara dependências duras entre outros itens e omite esta.

### N-05 — Nenhum gate pergunta se 4 × 18 é a melhor alocação

Todas as opções de B-01 tratam o fatorial de 18 estratos como restrição a salvar (colapsar, excluir, aninhar, exaurir). Nenhuma pergunta: dado que o poder é governado pelo número de clusters e o custo pelos hectares voados, a alocação que maximiza a chance de responder à pergunta é 4 polígonos em 18 células, ou menos estratos com mais polígonos por estrato? A pergunta está fora do espaço de opções oferecido ao pesquisador.

### N-06 — O congelamento por hash é auto-certificado

`hash_config` (`avaliacao_d25_referencia.py:150-155`) exclui corretamente a chave `pre_registro` do corpo hasheado, evitando circularidade. Mas o pesquisador escreve o hash no mesmo arquivo que controla: quem pode editar os blocos recalcula o hash. Nem C-04 da proposta nem o prompt mencionam **depósito externo com estampa de tempo** (OSF, Zenodo, ou tag Git assinada em repositório público com data anterior ao primeiro dado). Sem isso, o mecanismo protege contra descuido, não contra a tentação que ele existe para conter.

### N-07 — Dois dos cinco fatores do RUSLE estão declaradamente mal especificados, ambos contra o competidor

Este é o achado central da frente bibliográfica, e está lastreado no próprio registro.

| Fator | Estado | Direção do efeito sobre a comparação |
|---|---|---|
| R | Sucedâneo declarado do EI30: CHIRPS é diário, o EI30 exige intensidade em 30 min (`decisoes.ts`, valor de D13) | degrada o RUSLE |
| P | Fixo em 1,0 (`linhaDeBase.ts:8,41,74`); a tabela de D22 não está implementada e é de origem em IA não conferida | superestima a perda em área terraceada; degrada o RUSLE |

A justificativa de D13 **já reconhece isso textualmente**: *"parte da distância entre o RUSLE e os competidores pode vir da degradação do fator R, não da inferioridade do modelo físico, e essa possibilidade precisa estar escrita antes dos resultados."*

**Consequência:** a comparação de D25 está estruturalmente inclinada a favor do XGBoost por duas vias documentadas. O prompt executor declara na missão *"não otimize para XGBoost > RUSLE"* — mas a especificação atual do competidor já faz parte desse trabalho. Validação bibliográfica, aqui, **é especificação do competidor**, não documentação.

### N-08 — A auditoria infla a contagem de S1 por desagregação

V-01 (só D exportado), V-03 (matriz sem chaves) e T-02 (`Incluida`/`Pixel_ID` não chegam) são três achados S1 com **uma causa raiz**: `perfis.ts` não tem contrato com seus consumidores — o script D26 que produz o alvo e o script D25 que o avalia. Um esquema versionado (A-05 + C-02) fecha os três. Contar a mesma falha três vezes em severidade máxima distorce a prioridade de leitura.

### N-09 — O prompt executor contradiz a dependência dura declarada pela proposta

Proposta §5: *"Dependências duras: A-05/A-06 dependem de B-02/B-03."*
Prompt §5: A-05 e A-06 estão na Trilha A. Prompt §6: *"Sem aprovação, execute apenas a Trilha A."*

O prompt manda construir agora o contrato de dados e o fail-closed cujas chaves (B-02) e cuja partição (B-03) ele próprio diz que só o pesquisador define. Agrava: A-06 manda congelar `n_estratos = 18` e `n_poligonos_heldout = 36` "salvo B-01", quando a recomendação pendente de B-01 leva a 14–16 estratos e 56–64 polígonos. O default contraria a recomendação do próprio documento, garantindo retrabalho.

### N-10 — A numeração dos gates divverge entre a proposta e o prompt, e o termo de assinatura usa a do prompt

| Tema | Proposta | Prompt |
|---|---|---|
| Estado vs evento | B-05 | B-05 (fundido com P11) |
| Cobertura P11 | B-06 | B-05 |
| Tweedie / beta | B-07 | B-06 |
| Kappa | B-08 | B-07 |
| Poder e margem | B-12 | B-08 |
| D22 (fator P) | B-10 | B-11 |
| Rikimaru / 9,81 | B-14 / B-15 | B-12 (fundidos) |
| Bake-off de modelos | — | B-10 (novo) |

O pesquisador lê a proposta e assina a seção 11 do prompt. "B-12 — opção 1" significa coisas diferentes nos dois documentos (Rikimaru num, poder/margem no outro). **Um pré-registro assinado com numeração ambígua não é pré-registro.** Correção: o termo deve nomear tema + número nos dois documentos.

### N-11 — Obras que sustentam decisões vigentes não estão arquivadas

Ausentes do acervo de `docs/verificacoes/fontes/`: **Olofsson et al. (2014)**, **King & Zeng (2001)**, **Agresti & Coull (1998)**, **Brown, Cai & DasGupta (2001)**, **Cochran (1977)** no primário, **Bertoni & Lombardi Neto**.

Elas sustentam, respectivamente: as regras de inferência de D23 e o gate B-02; a correção a priori de D23; o `SE ≤ 0,144` de D11.2 (emenda de 31/10, que é Classe A); a opção 1 de B-01; e a tabela de D22. O caso de D11.2 é o menos grave, porque o número é auto-verificável por aritmética elementar (`0,5/√12 = 0,1443`), independente da citação.

### N-12 — Prompt B-10 (bake-off) é escopo novo sem origem em achado

GAM/EBM, CatBoost, BART e stacking não aparecem na auditoria nem na proposta. Num projeto cujo risco diagnosticado é flexibilidade analítica, e cujo D24/D25 existem para fechá-la, é o item de menor valor e maior risco da lista. A recomendação do próprio prompt (bake-off secundário pré-registrado, sem trocar o primário) é razoável; o problema é a existência do item criar a tentação.

### N-13 — Uma dívida de lastro foi falsamente quitada por esticamento de citação, e a trava não pega isso

`docs/metodologia/NORMA_LASTRO_CIENTIFICO.md`, na seção *"Três das sete são baratas"*, orienta quitar três dívidas por **cruzamento** com fontes que o registro já possui:

| Entrada | Fonte indicada pela norma | Sustenta o quê, de fato |
|---|---|---|
| **D02** (limiares de BSI) | Rikimaru et al. (2002), via D20 | **o índice BSI**, não os cortes `0,10 / 0,40 / 0,00 / 0,65` |
| P05 (classes WorldCover) | Zanaga et al. (2022), via D07 | as classes são definidas pelo próprio produto — cruzamento plausível |
| P02 (espaçamento do thinning de 1 km) | Roberts et al. (2017), via P01 | estratégias de validação com estrutura espacial; **não prescreve 1 km para seleção de candidatos** — a conferir |

**A quitação de D02 já foi consumada.** `D02` não consta mais da lista `DIVIDA_DECLARADA` de `src/config/lastroCientifico.test.ts`, e `decisoes.ts:86` traz `referencia: "Rikimaru, T. et al. (2002); ..."`. A trava passa. Um leitor do registro vê os cortes como lastreados.

**Por que a trava não pega.** Ela é, por desenho declarado, *"deliberadamente permissivo — a função desta trava é pegar a AUSÊNCIA de lastro, não julgar a qualidade da fonte"*. Está correta no seu escopo. O defeito não está na trava: está no mecanismo de **quitação por cruzamento**, que trata "a decisão tem uma fonte" como equivalente a "a fonte sustenta a decisão".

**Por que isto importa mais do que o caso D02.** A própria R-L3 adverte: *"Esticar citação verdadeira é a forma mais comum de corrompê-la."* E a Seção 5 da norma: *"Na dúvida sobre se a fonte sustenta a afirmação, ela não sustenta."* O projeto produziu, na seção de exemplos da sua própria norma, uma instância do erro que a norma proíbe — e a consumou. É o cenário que a norma descreve como o pior: *"pior que a ausência, porque a ausência é visível e a invenção não."*

**Medida:** auditar as três quitações por cruzamento pelo critério "a fonte sustenta exatamente qual afirmação?", reabrindo como dívida o que não passar; e acrescentar à norma a exigência de que toda quitação por cruzamento declare a frase que a fonte sustenta. Ver `L-07` e `L-10`.

### N-14 — Parte da inviabilidade que B-01 precisa resolver é induzida pelo thinning de P02

A tabela de ocupação de 31/10 (`docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md`) traz `N_h` antes e depois do thinning de 1 km. Comparando as duas colunas no quadrante deficiente:

| Estrato | Antes do thinning | Pós-thinning (1 km) | Efeito do thinning |
|---|---|---|---|
| `E_1_1_2` | 0 | 0 | nenhum — déficit estrutural |
| `E_1_2_2` | **4** | **3** | **viável → inviável** |
| `E_1_3_2` | 5 | 4 | perde a única reserva |
| `E_2_2_2` | 3 | 2 | já inviável |
| `E_2_3_2` | 2 | 2 | nenhum |

**Sem o thinning, os estratos inviáveis seriam 3, não 4**, e `E_1_3_2` teria uma reserva. O thinning de 1 km (P02) é portanto **causa direta** de um dos quatro estratos inviáveis e da fragilidade de um quinto.

Isso **não** é recomendação de afrouxar P02: o espaçamento existe para mitigar pseudorreplicação e tem custo científico se reduzido. O ponto é outro, e é duplo:

1. **B-01 deve ser decidido sabendo disso.** O espaço de opções e o custo de cada uma mudam conforme P02 seja mantido, revisto ou declarado; nenhum dos três documentos de 01/11 apresenta a inviabilidade decomposta entre déficit estrutural e efeito de thinning.
2. **P02 é uma das três quitações por cruzamento de N-13** — seu lastro indicado é Roberts et al. (2017), que trata de estratégias de validação com estrutura espacial e **não prescreve 1 km para seleção de candidatos**. Ou seja, um parâmetro que remove um estrato do desenho pode estar lastreado por esticamento de citação.

**Medida:** decompor a inviabilidade na apresentação de `G-01` (déficit estrutural × efeito de P02) e auditar o lastro de P02 antes do gate. Ver `L-10` e `P-D`.

---

## 5. Erro formal na auditoria

A contagem de severidade do sumário executivo (linha 27) diz **6 S1 / 8 S2 / 3 S3**. Pelos títulos das próprias seções:

- **V-03** é titulado `(S1)` e contado em S2;
- **V-06** é titulado `(S2)` e contado em S3.

A distribuição correta é **7 S1 / 8 S2 / 2 S3** (total 17, que coincide). Importa porque a contagem é o que o leitor usa para priorizar.

---

## 6. Medidas corretivas consolidadas

Classes conforme a proposta: **A** = implementa decisão vigente ou corrige defeito, executável por engenharia; **B** = exige decisão do pesquisador; **C** = governança; **L** = lastro bibliográfico (trilha acrescentada por esta consolidação).

### 6.1 Lastro — trilha L

| ID | Medida | Classe | Bloqueia |
|---|---|---|---|
| L-01 | Obter e conferir **Cochran (1977) §5A.12** no primário; arquivar com SHA-256; registrar o que a fonte sustenta e o que não sustenta | L | **B-01** |
| L-02 | Obter e conferir **Olofsson et al. (2014)** e **King & Zeng (2001)**; arquivar | L | **B-02**, B-09 |
| L-03 | Conferir **Bertoni & Lombardi Neto** para a tabela de P de D22; se não houver fonte, declarar D22 não operacional | L | **B-11/B-10**, interpretação de D25 |
| L-04 | Decidir o tratamento do fator P na linha de base, dada a degradação declarada (manter 1,0 / tabela provisória marcada / declarar a comparação condicionada) | B | desfecho de D25 |
| L-05 | Reconstruir o inventário bibliográfico com caminho existente, DOI e status de conferência, nos dois sentidos (obra→acervo e acervo→obra); **estender** a trava de `lastroCientifico.test.ts` para verificar existência do caminho | A+C | — |
| L-06 | Quitar ou re-datar as 11 entradas de `DIVIDA_DECLARADA` | A/B | — |
| L-07 | Restringir a citação de **Rikimaru (2002)** ao índice BSI; **reabrir a dívida de D02** como declarada (R-L4), por quitação indevida (N-13); declarar os cortes como convenção do projeto | A | — |
| L-10 | Auditar as três quitações por cruzamento (D02/Rikimaru, P05/Zanaga, P02/Roberts) pelo critério "qual frase exata a fonte sustenta"; reabrir como dívida o que não passar; emendar a norma para exigir essa frase em toda quitação por cruzamento (N-13) | A+C | **G-01** via P02 (N-14) |
| L-08 | Propagar a marca `pendenteVerificacao` do fator R ao tipo, à UI e ao CSV | A | — |
| L-09 | Registrar que **Agresti & Coull (1998)** e **Brown et al. (2001)** não estão arquivados, e que o `SE ≤ 0,144` é auto-verificável por `0,5/√12` | A | — |

### 6.2 Desenho e validação — gates do pesquisador

| ID (proposta) | ID (prompt) | Tema | Pré-requisito |
|---|---|---|---|
| B-01 | B-01 | Fatorial inviável | **L-01** |
| B-02 | B-02 | Estimando: área ou polígono | **L-02** |
| B-03 | B-03 | Validação espacial | — |
| B-04 | B-04 | Modelo P no escopo | B-02 |
| B-05 | B-05 (parte) | Estado vs evento | — |
| B-06 | B-05 (parte) | Cobertura P11 | B-05 |
| B-07 | B-06 | Tweedie / beta / calibração | **N-03** |
| B-08 | B-07 | Regra de kappa | — |
| B-09 | B-09 | Não resposta e âncora | L-02 |
| B-10 | B-11 | D22 / fator P | **L-03** |
| B-11 | — | P10 e grade de Tweedie | — |
| B-12 | B-08 | Poder e margem | **B-01** (via N-04), **N-03** |
| B-13 | — | Sítios contínuos | — |
| B-14 | B-12 (parte) | Rikimaru / D02 | → rebaixado a L-07 |
| B-15 | B-12 (parte) | Fator 9,81 de D13 | → **improcedente**; resta L-08 |
| — | B-10 | Bake-off de modelos | → **fora de escopo** (N-12) |
| **novo** | — | Alocação 4×18 contra poder e custo de voo | **N-05**, dentro de B-01 |
| **novo** | — | Tratamento de empates em Spearman e escala da margem | **N-03**, antes do 1º rótulo |
| **novo** | — | Depósito externo do pré-registro com estampa de tempo | **N-06** |

### 6.3 Engenharia — Classe A

| ID | Medida | Depende de |
|---|---|---|
| A-01 | D11.2: piso por estimando e guarda de D12 efetiva | — |
| A-02 | P03: três critérios de campo | — |
| A-03 | P07: semente registrada, não fixa | — |
| A-04 | D20: atribuição correta do fator C híbrido | — |
| A-07 | Alvo D26: remover default 0,00, observador e confiança padrão; exigir coerência classe↔fração | — (parte normativa em B-05) |
| A-08 | Remover fabricações numéricas (NDVI/BSI 0, clamp, `BLOCO_INDEFINIDO`, confiança 0,95 do JEV) | — |
| A-09 | JEV: retirar coordenadas do payload externo; marcar laudo como heurístico | — |
| A-05 | Contrato de dados da matriz (chaves do desenho + esquema versionado) | **B-01, B-02, B-03, B-04** |
| A-06 | D25 fail-closed | **A-05, B-01, B-12** |
| A-10 | CI verde e textos defasados | — |
| A-11 | Geometria, contenção, re-thinning e âncora | B-01, B-02 |
| **N-02** | Resolver a duplicidade de `pi_i`: remover ou marcar como legada `sortearPoligonosDroneD16`; corrigir o docstring do módulo; alinhar D23 (36×10 ha → 72×5,02 ha) | — |

### 6.4 Governança — Classe C

`C-01` estado de implementação nas decisões · `C-02` esquema versionado da matriz · `C-03` CI com testes de decisão · `C-04` pré-registro operacional **+ depósito externo (N-06)** · `C-05` lastro verificável (ver L-05) · `C-06` rastro achado→commit→teste · `C-07` dicionário de dados.

---

## 7. Síntese

**O que a verificação sustenta.** A auditoria científica é confiável: de 15 asserções verificáveis testadas, 15 se reproduziram no código, com arquivo e linha corretos — incluindo os dois pontos em que se suspeitou de promoção de parâmetro disfarçada (A-01 e A-02), onde a suspeita foi refutada. A proposta acerta a separação A/B nos casos difíceis.

**O que a verificação corrige.** Três achados da proposta têm severidade menor do que a atribuída (R-01 improcedente na parte principal, R-02 e R-03), um número não se reproduz (R-04), a contagem de severidade da auditoria está errada em dois itens, e o prompt executor contradiz a proposta em dois pontos operacionais (N-09, N-10) além de abrir escopo novo sem achado (N-12).

**O que a verificação acrescenta, e que muda a ordem do trabalho.** A decisão mais bloqueante do projeto (B-01) se apoia num lastro que o próprio repositório declara não conferido no primário (N-01), e o competidor da hipótese central está degradado por duas vias documentadas (N-07). As duas coisas põem a validação bibliográfica **no início** do caminho crítico, não no fim — ao contrário do que uma leitura da proposta sugere, e ao contrário do que esta verificação concluiu em sua primeira passagem.

**Fim da consolidação.** Nenhum código, decisão ou parâmetro foi alterado.
