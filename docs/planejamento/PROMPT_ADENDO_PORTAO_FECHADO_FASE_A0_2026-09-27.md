# Adendo de Execução — Portão Fechado e FASE A0

**Data:** 27/09/2026
**Natureza:** ADENDO ao `PROMPT_EXECUCAO_DESENHO_CONSOLIDADO_2026-09-27.md`. **Não o substitui.**
**Situação:** você estava parado na PARTE I daquele prompt, que instruía a aguardar o registro das decisões pelo pesquisador antes de declarar o escopo da FASE A. **O portão está fechado.** Este adendo (i) informa o que o portão decidiu, (ii) insere uma **FASE A0** que precede a FASE A, e (iii) emenda as FASES B e D.

As FASES A a F do prompt consolidado **permanecem válidas como escritas**, exceto onde este adendo as emenda explicitamente. A PARTE 0 (postura), a PARTE IV (proibições) e a PARTE V (relatório) daquele prompt continuam vigentes na íntegra.

---

# PARTE 0 — O QUE O PORTÃO DECIDIU

O registro `src/config/decisoes.ts` está **integralmente decidido, de D01 a D26**. Nenhuma decisão permanece `pendente`. Commits do portão, em ordem:

| Commit | Conteúdo |
|---|---|
| `7342d5a` | D16 e D23 reescritas para o desenho por polígonos de VANT |
| `c3b8371` | D24 (teto de preditores por bloco físico) e emenda de D06 |
| `d582343` | D25 (critério de refutação pré-registrado) e D12 (18 estratos) |
| `f541862` | D07, D08 e restrição de P05 |
| `d30252b` | D05, D13, D15 e D19 — fecha o registro |

**Leia as decisões no arquivo, não neste resumo.** O texto do `valor` de cada decisão é normativo e contém obrigações que este adendo não repete.

## Consequência que mais importa para você

Três decisões criaram **divergência declarada entre decisão e código**. A divergência está escrita no próprio `valor` das decisões, de propósito, para que não fosse silenciosa. Ela **vale contra o código**: onde decisão e código discordarem, a decisão prevalece e o código é que está errado. Fechar essas três divergências é o conteúdo da FASE A0.

Não houve regressão de fabricação no fechamento do portão — isto foi verificado. Em particular, `src/lib/rusle/linhaDeBase.ts:66-104` trata corretamente os dois ramos de D13 e D15, de modo que com as decisões tomadas os fatores R e LS passaram de `indisponivel/decisao-pendente` para `indisponivel/nao-calculado`, e `perdaSolo` **segue retida** pelo Invariante 1. Dois testes foram corrigidos por acoplamento indevido entre teste de mecanismo e estado do registro (`src/config/decisoes.test.ts` e `src/lib/rusle/rusle.test.ts`). Estado atual verificado: `npx tsc --noEmit` sem erros, `npx vitest run` com 40 arquivos e 288 testes aprovados. **Reproduza esse estado antes de qualquer edição.**

---

# PARTE I — FASE A0 (NOVA, PRECEDE A FASE A)

Quatro tarefas. A ordem importa: a Tarefa 1 condiciona a Tarefa 2.

## Tarefa 1 — Medir a distorção de projeção (obrigação de D15)

**Por que primeiro.** A Bacia do Paraná 3 atravessa o meridiano de 54 graus oeste, fronteira entre as zonas UTM 21S e 22S. Medianeira está a cerca de 54,1 graus oeste, já em 21S, e a bacia segue a oeste até o rio Paraná. O código calcula declividade em `EPSG:31982` (SIRGAS 2000 / UTM 22S), declarado em `src/lib/gee/terreno.ts:24` como `CRS_TERRENO_PADRAO`. Isso afeta **duas** coisas, não uma: o fator LS da FASE D **e** o limiar de declividade de 3% a 20% que D07 usa para definir o domínio de validade. Declividade enviesada desloca a fronteira do domínio.

Este erro não é hipotético neste projeto: a conversão de coordenadas da Missão 009 foi feita supondo zona 22S e devolveu posição litorânea, porque a missão está em 21S.

**Procedimento exigido, falsificável:**

1. Obtenha a extensão oeste da bacia. Se o vetor territorial oficial (IAT/ANA) estiver disponível, use-o. Caso contrário use `src/lib/localizacao/bacias.ts` e **declare no relatório** que a extensão herda o erro de área já medido naquele arquivo (de −24,8% a +33,0%), de modo que a medição de distorção é limitada pela qualidade do polígono.
2. Tome pelo menos 20 segmentos de teste distribuídos pela bacia, concentrando ao menos 5 no extremo oeste.
3. Para cada segmento, compute o comprimento **geodésico sobre o elipsoide** (GRS80/SIRGAS 2000) e o comprimento **projetado em EPSG:31982**.
4. Reporte a razão `projetado / geodesico` por segmento, e o **máximo da diferença relativa** sobre todos os segmentos.

**Critério de aceitação declarado em D15:** se a distorção linear máxima dentro da bacia exceder **0,5%**, abandone a UTM 22S e adote Mercator Transversa customizada com meridiano central em cerca de 54,2 graus oeste. Abaixo de 0,5%, mantenha `EPSG:31982`.

**O resultado da medição entra no pacote de reprodutibilidade em qualquer caso**, inclusive quando confirmar a UTM 22S. A decisão exige a medição registrada, não apenas a conclusão. Medição que confirma o que se esperava ainda é medição; medição omitida porque "era pequena" é suposição.

## Tarefa 2 — Alinhar P05 ao domínio de D07: classes `[30, 40]`

D07 **excluiu a classe 60** do WorldCover (solo exposto e vegetação esparsa), revertendo a proposta original que a admitia. A razão é circularidade: a dimensão Ê da estratificação de D12 **é** a frequência de solo nu, de modo que admitir solo exposto como critério de **entrada** no domínio faria a definição do domínio determinar em parte o estrato de destino. É a mesma família de defeito que D16 barra ao proibir voar onde o rastreio espectral aponta erosão.

Âncoras conferidas em 27/09/2026:

| Arquivo | Linha | Conteúdo atual |
|---|---|---|
| `src/lib/gee/elegibilidade.ts` | 7 | comentário de cabeçalho `[30: Pastagem, 40: Lavouras, 60: Solo Exposto]` |
| `src/lib/gee/elegibilidade.ts` | 30 | `allowedLandCoverClasses: [30, 40, 60], // P05` |
| `src/app/api/gee/select-candidates/route.ts` | 401 | comentário `(ESA WorldCover in [30, 40, 60] e dossel não-florestal)` |
| `src/lib/gee/elegibilidade.test.ts` | 29 | `expect(isClasseUsoElegivel(60)).toBe(true);  // Solo exposto` |

Altere os quatro. A asserção do teste passa a `toBe(false)`, **com comentário explicando que a exclusão vem de D07 e por qual razão** — uma asserção invertida sem justificativa no código parece regressão para quem ler depois.

Verifique também `src/lib/gee/elegibilidade.ts:51`, `:64` e `:133`, que propagam a constante, e confirme que nenhum outro consumidor fixa a lista por conta própria. Se encontrar outro, relate antes de alterar.

## Tarefa 3 — Concordância entre épocas do WorldCover (obrigação de D07)

D07 exige que uma célula só esteja no domínio se **ambas** as épocas disponíveis a classificarem como 30 ou 40. Hoje o cliente GEE consulta **uma só época**: `src/lib/gee/copernicusGeeClient.ts:199` traz `id: { constantValue: "ESA/WorldCover/v200/2021" }`, e o comentário de `:155` a descreve.

**Por que.** O produto de cobertura é de época única enquanto a série de treino de D05 vai de 2016 a 2026 — uma máscara de um ano estava sendo aplicada a dez.

**Semântica exigida, sem margem:**

- Acrescente a época **v100 / 2020** ao grafo de expressão, ao lado da v200 / 2021.
- Uma célula está no domínio **se e somente se** ambas as épocas a classificarem em `[30, 40]`.
- Se **qualquer** das duas épocas não tiver dado para a célula, a célula fica **fora** do domínio. Não a admita por concordância parcial, e não invente a época faltante.
- Registre no metadado do ponto **qual foi a classe em cada época**, separadamente, e não apenas o resultado da conjunção. Sem isso a decisão não é auditável depois.

**Antes de implementar, confirme que o identificador do ativo da época v100 resolve de fato na API** e relate o identificador exato que funcionou. Não presuma a grafia por simetria com a v200.

D07 declara como **não modelada** a mudança de uso ocorrida dentro da série — duas épocas não resolvem isso. Não tente compensá-la; declare-a onde a decisão manda.

## Tarefa 4 — Sinalizador de K ambíguo na associação (obrigação de D08)

D08 mantém a atribuição pelo **componente dominante** (`ordem_1`) e **veda** a ponderação de K pela área dos componentes, porque a média ponderada produz erodibilidade que não existe em unidade de mapeamento alguma. A atribuição dominante já está implementada — ver `src/lib/embrapa/embrapaSoilClient.ts:244`, `ordem: "ordem_1"`.

O que **falta** é a marcação que D08 acrescentou à proposta original:

- Quando os componentes da associação **atravessarem a fronteira de D09** — `ordem_1` nas classes 1 a 3 (K ≤ 0,0285) e algum componente subordinado nas classes 4 ou 5 (K ≥ 0,0300), **ou o inverso** — a unidade recebe sinalizador de **K ambíguo na associação**.
- O sinalizador é **metadado de qualidade**: acompanha o registro, aparece no Inspetor, entra no pacote de reprodutibilidade.
- **NUNCA entra na matriz de treino como preditor**, por Invariante 2. Se `src/lib/matriz/invariantes.ts` mantém lista de campos proibidos na matriz, o sinalizador entra nessa lista.
- As unidades marcadas **permanecem no quadro amostral** e não são excluídas do sorteio de D16.

**Razão de existir, para você não o implementar como enfeite:** o componente dominante sozinho esconde exatamente o caso que mais importa. Uma associação cujo dominante cai no nível 1 de K e cujo subordinado cai no nível 2 vai para o estrato de erodibilidade baixa sem que nada no registro indique que a atribuição poderia ter sido a oposta. Marcar torna esse custo auditável em vez de invisível.

D08 pré-registrou análise de sensibilidade sobre as unidades marcadas. **Não a implemente agora** — ela pertence à avaliação de D25, que não existe ainda. Apenas garanta que o sinalizador seja persistido e exportado, para que a sensibilidade seja possível depois.

---

# PARTE II — EMENDAS ÀS FASES EXISTENTES

## FASE B (chuva e eventos) — acrescentar o fator R de D13

D13 fixou três coisas que a FASE B precisa respeitar:

1. **Proveniência `modelado`, jamais `medido`.** É equação calibrada em pluviógrafo aplicada a totais estimados por satélite. Foi exatamente a rotulagem de valor modelado como medido que a auditoria de 26/09 encontrou no pacote de reprodutibilidade; o fator R é o candidato mais óbvio à reincidência, porque parece dado climático quando é saída de equação sobre estimativa de satélite.
2. **R climatológico**, média de longo prazo sobre toda a série, **não** erosividade de um ano. O rótulo do VANT é estado acumulado, não de uma safra.
3. **Divisão de produtos:** CHIRPS (grade de 0,05 grau, registro longo) alimenta os totais mensais da equação regional; **IMERG fica reservado à FASE de pares de evento**, porque D19 exige resolução sub-diária que o CHIRPS não tem.

**Limitação que D13 manda declarar e que você não deve tentar contornar:** o EI30 do RUSLE exige intensidade em 30 minutos e o CHIRPS é **diário** — o EI30 verdadeiro **não é obtenível dele**. A equação regional sobre totais mensais é **sucedâneo declarado** do EI30, e essa substituição entra no selo de proveniência e na limitação reportada. Não a apresente como EI30.

## FASE D (terreno bidimensional) — acrescentar o fator LS de D15

Além do que a FASE D já prevê:

- **Desmet & Govers (1996)**, área de contribuição específica bidimensional, sobre **Copernicus GLO-30 a 30 m** conforme D21, **sem reamostragem para 10 m**. O LS carrega suporte nativo de 30 m e é atribuído às células de 10 m nele contidas, conforme a emenda de D06. É por isso que o bloco de terreno tem cerca de 11 unidades efetivas por polígono em D24 — não "conserte" isso reamostrando.
- **Projeção:** o que a Tarefa 1 tiver determinado.
- **Expoente m dependente da declividade**, não valor fixo único, porque o domínio de 3% a 20% de D07 atravessa o ponto de quebra da formulação.
- **Proveniência `modelado`.**

## FASE E — sem emenda

Permanece como escrita, incluindo a correção de que o `dataReferencia` de `montarPreditoresTemporais` deve ser ancorado na data do evento de chuva.

**Acrescente porém o que D05 fixou sobre densidade desigual da série:** o Sentinel-2B opera desde 2017, de modo que a revisita de cinco dias não vale para o trecho inicial. As métricas de série — frequência de solo nu de Ê, persistência, sequência máxima — devem ser calculadas sobre **fração de cenas válidas** e não sobre contagem absoluta; abaixo do mínimo declarado de cenas válidas, a métrica é `indisponivel` e **não** um valor deflacionado. Sem isso, uma célula com poucas cenas em 2016 teria frequência de solo nu baixa por falta de observação e não por cobertura — e essa frequência é justamente a dimensão que define o estrato em D12.

---

# PARTE III — GATE ANTIFABRICAÇÃO BIBLIOGRÁFICA

**Esta parte tem precedência sobre o cumprimento de prazo ou de escopo. Leia duas vezes.**

D13 e D15 foram registradas com **ressalva de verificação explícita**, no mesmo regime adotado em D22: a forma funcional e os coeficientes da equação de erosividade regional, e os patamares do expoente `m` com a forma da função de declividade, **não foram conferidos contra a fonte primária** na data do registro. As decisões declaram a conferência como **obrigatória antes da implementação**.

Regras, sem exceção:

1. **Não escreva nenhum coeficiente de memória.** Nem seu, nem meu, nem "o valor usualmente adotado", nem o que aparece em artigo secundário que cita a fonte.
2. Para cada número que entrar em código, registre **onde** foi conferido: obra, edição, e a localização interna (tabela, equação numerada, página).
3. **Se não conseguir acessar a fonte primária, PARE.** Relate o bloqueio nomeando qual fonte e qual coeficiente faltou, deixe o fator como `indisponivel` com causa `nao-calculado`, e **não** implemente com valor plausível. Fator retido é resultado correto; fator inventado é o defeito que a auditoria de 26/09 encontrou e que este projeto inteiro passou a evitar.
4. Fontes a conferir: **Waltrick et al. (2015)**, Revista Brasileira de Ciência do Solo, para a erosividade do Paraná; **Renard et al. (1997)**, Agriculture Handbook 703, para os patamares de `m` e a forma de `S`; **Desmet & Govers (1996)**, JSWC 51(5):427-433, para a área de contribuição específica.
5. Até a conferência, a marca de pendência bibliográfica das decisões **propaga ao selo de proveniência** do pacote de reprodutibilidade. Não a remova sem conferir.

Há uma razão científica direta, além da integridade: D25 pré-registrou o `rho_RUSLE` como linha de base de comparação. Um fator R ou LS com coeficiente errado **desloca a linha de base**, e parte da distância medida entre o RUSLE e os competidores viria do seu erro de implementação, não do modelo físico. Isso corromperia o critério de refutação inteiro.

---

# PARTE IV — PROIBIÇÕES (reafirmadas e acrescidas)

Valem todas as proibições P1 a P10 do prompt consolidado. Reforço as que este adendo torna mais críticas, e acrescento duas:

- **P8 — `src/config/decisoes.ts` é proibido para você.** Nem para corrigir digitação, nem para acrescentar campo, nem para atualizar comentário. Se encontrar erro ali, **relate e não toque**. O mesmo vale para `src/config/decisoes.test.ts`.
- **P11 (nova) — Não relaxe critério declarado para fazer teste passar.** Se a distorção de projeção exceder 0,5%, a resposta é trocar a projeção, não elevar a tolerância. Se o ativo do WorldCover v100 não resolver, a resposta é relatar, não voltar a uma época só. Critério declarado em decisão não é parâmetro ajustável.
- **P12 (nova) — Não converta `indisponivel` em valor.** Nem por imputação, nem por mediana, nem por padrão, nem por `fillna`. Se um insumo falta, o produto é `indisponivel` com causa nomeada.

## Atribuição dos commits

**Assine os commits com a sua própria identidade.** Não use `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` — essa linha identifica outro agente, que não executou o seu trabalho. O pesquisador declarará academicamente o uso dos dois agentes separadamente, e atribuir a um o trabalho do outro corrompe o registro que ele apresentará à banca.

O `author` de todo commit é **Luís Alfredo Ferreira da Silva (`RedZardoz`)**. Registre a sua participação como co-autoria com o seu próprio nome, e atualize `docs/PROVENIENCIA_ASSISTENCIA_IA.md` com a fase, os commits e o que foi seu.

---

# PARTE V — PROTOCOLO DE EXECUÇÃO

Mantido o do prompt consolidado, com estas exigências:

1. **Reproduza antes de editar.** Rode `npx tsc --noEmit` e `npx vitest run` e confirme 40 arquivos / 288 testes. Se divergir, pare e relate — o estado de partida não é o que este adendo supõe.
2. **Confira cada âncora de linha citada na PARTE I** antes de usá-la. Este adendo as conferiu em 27/09/2026, mas você pode estar em árvore diferente. Se uma âncora não bater, relate a divergência com o conteúdo real da linha; não procure "a linha parecida".
3. **Declare o escopo da FASE A0 arquivo por arquivo e aguarde autorização** antes de editar.
4. **Ao terminar, relate por tarefa**, e para cada uma: o que mudou, com qual âncora; o que foi medido, com o número obtido; o que ficou retido, com a causa nomeada; e o que você **não** fez e por quê.
5. Não acumule tarefas com resultado incerto. Se a Tarefa 1 devolver distorção acima de 0,5%, isso muda a Tarefa 2 e as FASES D — pare e relate antes de seguir.

**Depois da FASE A0, a FASE A está autorizada** conforme escrita no prompt consolidado.

---

## Nota sobre o que este adendo deliberadamente não pede

O **sorteio dos 36 polígonos de D16** está desbloqueado pelo portão — com D07, D08 e D12 decididas, os 18 estratos passam a ter fronteira numérica e o `pi_i` exigido por D23 torna-se calculável. Mas o sorteio **não** faz parte da FASE A0, e não o execute: ele depende de as Tarefas 2, 3 e 4 estarem concluídas, porque o quadro amostral é definido pelo domínio de validade e pelo nível de K. Sortear antes produziria polígonos sobre um quadro que a decisão já superou, e o sorteio é irreversível na prática — refazê-lo depois exigiria descartar `pi_i` já registrado, o que D23 proíbe.
