# Norma de Lastro Científico — SAREL

**Instituída pelo pesquisador em 20 de outubro de 2026.**
**Vincula:** o pesquisador, os bolsistas, o agente executor, e qualquer assistente ou pessoa que trabalhe neste programa de pesquisa, em qualquer sessão.

---

## 1. A norma, em uma frase

**Todo procedimento, limiar, parâmetro ou decisão metodológica deste projeto precisa de lastro em bibliografia científica externa, verdadeira e verificável — e, onde não houver, isso deve estar escrito.**

---

## 2. As cinco regras

### R-L1 — Autorreferência não é lastro

Citar "Metodologia PPGTCA 2026", "Planejamento V3", um arquivo em `docs/`, uma linha de código ou outra decisão do próprio registro **não referencia nada**: apenas move a pergunta de lugar. Documento interno pode acompanhar a referência externa; nunca substituí-la.

Isso vale também para "herdado do SAREL 1" e equivalentes. Herança explica a origem histórica de um número — não o justifica.

### R-L2 — Citação não conferida no primário é declarada como tal

Referência obtida de fonte secundária — resenha, documentação de software, outro artigo, busca na web, ou memória de um assistente — **fica marcada como não conferida** até que alguém abra a fonte primária.

O registro já faz isso em **D13**: *"Waltrick, P. C. et al. (2015) — NÃO conferida contra a fonte primária nesta…"*. É o padrão a seguir.

Uma emenda de 06/10/2026 em D09/D10 vai além e registra uma citação **suspensa** depois de a conferência ter falhado. Suspender é melhor que remover: preserva o rastro de que alguém procurou.

### R-L3 — A fonte é arquivada, e o seu limite é declarado

Conferência no primário gera dois artefatos, pela **Regra 8**:

1. o arquivo da fonte em `docs/verificacoes/fontes/<autor><ano>/`, com SHA-256 registrado;
2. um arquivo de verificação em `docs/verificacoes/<data>_<assunto>.md`, com as citações textuais que sustentam a afirmação.

O arquivo de verificação precisa conter uma seção **"o que NÃO foi conferido"** ou **"o que a fonte não sustenta"**.

**Por quê:** a maneira mais comum de corromper uma citação verdadeira não é inventá-la — é esticá-la. Exemplo real deste projeto: Hyndman & Fan (1996) sustenta que, com $n$ observações, espera-se massa $1/(n+1)$ abaixo do mínimo amostral. **Não** sustenta nenhum mínimo de observações para séries Sentinel-2. O limiar operacional é decisão do pesquisador *apoiada* no resultado — e a dissertação precisa dizer isso, ou a citação vira exagero.

### R-L4 — Decisão sem fonte é registrada como dívida, não maquiada

Quando não existir fonte, a decisão **não fica sem referência em silêncio**. Ela declara: que não há lastro externo, que a escolha é operacional do pesquisador, e a data da dívida.

Dívida declarada é honesta e defensável numa arguição. Campo de referência vazio, ou preenchido com documento interno, não é.

**Nem toda decisão é científica.** D17 — alocação da cota do Planet Labs Education & Research Program — é **contratual**. Não existe literatura que prescreva repartição de cota comercial, e exigir citação ali induziria a inventar uma, violando a seção 5. Nesses casos a decisão **declara a sua natureza** e aponta o instrumento correto: contrato, termo, licença, documentação oficial do fornecedor.

Distinguir "sem fonte científica porque ninguém procurou" de "sem fonte científica porque o objeto não é científico" é parte da norma, não exceção a ela.

#### Definição estreita de "operacional" (ratificada pelo pesquisador em 20/10/2026)

Uma decisão só é operacional se passar nos **três** testes. Dois não bastam.

| | Teste | Pergunta |
|---|---|---|
| **1** | Falsificabilidade | Algum estudo poderia, em princípio, mostrar que o valor está errado? Se **sim**, é científica |
| **2** | Resultado | Mudar o valor altera o que a pesquisa **conclui**, ou apenas o que ela **custa** para chegar lá? Se altera a conclusão, é científica |
| **3** | Instrumento | Existe documento não científico que fixe o valor com autoridade — contrato, licença, especificação técnica, norma legal, ficha de equipamento? Se **não existe**, não é operacional |

**O teste 3 é a guarda contra o abuso da categoria**, e por isso é verificado pela trava: declarar "operacional" **obriga a nomear o instrumento** — número de contrato, versão da especificação, artigo da norma. Sem instrumento citável, a decisão é dívida comum e vai para a lista como as outras.

Em 20/10/2026, das 8 entradas em dívida, **apenas D17 passa nos três** (Plan ID 798565, vigência até 05/04/2028). Os números da D02, D11 e P02 afirmam coisas sobre o mundo e são falsificáveis; P07 não tem instrumento que a fixe.

> **O risco que esta categoria cria, dito por escrito:** daqui a meses, alguém pode declarar D11 "operacional" porque *"é só um limiar de processamento"*. Seria o fim da norma, pela porta que ela mesma abriu. O teste 3 existe para isso — e é mecânico, não interpretativo.

### R-L5 — Toda obra citada entra no acervo, com metadados

Obra citada em decisão vai para `docs/Selecao Bibliografica/`, registrada no inventário com **autor, ano, título e DOI** — e a decisão que ela sustenta.

Sem esses campos a conferência "toda citação tem artigo no acervo" é impossível de automatizar e pouco confiável à mão. Em 20/10/2026 o inventário tinha apenas `Arquivo | Origem Prévia | Metodologia | Relevância`, e 23 dos 100 arquivos tinham nome opaco de periódico.

---

## 3. Por que isto é norma, e não recomendação

Este projeto já teve **onze auditorias em seis semanas**. O padrão que elas revelam não é falta de rigor — é que o rigor **se perde entre as sessões**. As 9 Regras Invioláveis existiam em `docs/design.md` desde o início, e ainda assim:

- um limiar revisto em D10 ficou com o valor antigo no gráfico, atribuído à decisão nova;
- o registro de D01 e o código de `fatorC.ts` passaram a calcular coisas diferentes;
- um literal de 800 m furava silenciosamente o piso do próprio parâmetro herdado;
- sete decisões chegaram a 20/10/2026 sem lastro bibliográfico externo.

Nenhuma dessas falhas veio de má-fé ou de desleixo. Vieram de **regra escrita em prosa, aplicada por memória humana**. Por isso esta norma tem uma trava automática, descrita abaixo, e não apenas um texto.

---

## 4. A trava

`src/config/lastroCientifico.test.ts` percorre `DECISOES` e `PARAMETROS` e reprova quando uma entrada com estado `"decidida"` não tem referência externa — autor com ano, DOI, ISBN ou localizador de periódico.

**Dívida declarada em 20/10/2026 (8 entradas):** `D02, D03, D11, D17, D18, P02, P05, P07`.

> **A oitava foi encontrada pela própria trava, não pela auditoria em prosa.**
> A auditoria manual de 20/10 contou sete. Ao rodar o teste, ele acusou **D17**, que a auditoria havia classificado como tendo fonte externa: a regex de conferência aceitou *"(vigência até 05/04/2028)"* como se o `2028)` fosse ano de citação. Era uma data de contrato.
>
> Registro o episódio porque é o argumento desta norma em miniatura: a conferência em prosa, feita com cuidado, errou; a trava, não. Nenhum texto substitui o teste.

Essas entradas estão listadas nominalmente no teste, com o motivo. O teste passa hoje por causa dessa lista, e **reprova em qualquer entrada nova** que nasça sem lastro.

A lista se autodenuncia: quando uma dessas decisões receber referência externa de verdade, a entrada correspondente vira obsoleta e o teste reprova pedindo a remoção dela. A dívida não apodrece em silêncio.

### Três das sete são baratas

Têm lastro externo **já presente no próprio registro**, citado em outra decisão:

| Entrada | Fonte que o registro já possui |
|---|---|
| D02 (limiares de BSI) | **Rikimaru et al. (2002)**, citada em D20 |
| P05 (classes WorldCover) | **Zanaga et al. (2022)**, citada em D07 |
| P02 (espaçamento do thinning) | **Roberts et al. (2017)**, citada em P01 |

Não é falta de fonte: é falta de cruzamento.

---

## 5. O que fazer quando a fonte não for encontrada

Nesta ordem:

1. **Procure.** Busca bibliográfica de verdade, no acervo e fora dele.
2. **Não encontrou?** Registre a dívida pela R-L4 e acrescente a entrada à lista do teste, com data e motivo.
3. **Nunca invente.** Citação fabricada, inferida de memória ou extrapolada além do que a fonte diz é falta grave — pior que a ausência, porque a ausência é visível e a invenção não.
4. **Na dúvida sobre se a fonte sustenta a afirmação, ela não sustenta.** Marque como não conferida (R-L2) e siga.

---

## 6. Quem decide

A escolha do valor, da metodologia e da fonte é **do pesquisador**. Assistente e executor **encontram, conferem, arquivam e relatam** — e param quando falta decisão, conforme a Seção 2 do `CLAUDE.md`.

Um assistente que preenche uma referência por conta própria, ainda que plausível, viola esta norma e a Regra 1.
