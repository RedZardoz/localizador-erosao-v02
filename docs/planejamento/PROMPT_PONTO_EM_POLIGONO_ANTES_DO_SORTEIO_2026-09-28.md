# Prompt de Execução — Atribuição por ponto-em-polígono, último item antes do sorteio

**Data:** 28/09/2026
**Natureza:** substitui o mecanismo de atribuição pedológica. O trabalho de U1 a U3 foi **aceito e verificado**; isto troca uma heurística que acerta sem garantia por uma consulta determinística.
**Posição no plano:** é o **último item antes do sorteio dos 36 polígonos**, por decisão do pesquisador. Depois dele, o quadro amostral fica determinístico e o sorteio pode ocorrer.

---

# PARTE 0 — ESTADO, INCLUINDO DOIS ERROS MEUS

## O que verifiquei de U1 a U3 e está correto

`tsc` limpo, 43 arquivos e 321 testes, os relatórios de 28/09 preservados sem sobrescrita, `decisoes.ts` intocado, sorteio não executado. O `R13` virou de excluído para correspondente com a feição certa (`parana_solos_20201105.2807`, NVef2, NITOSSOLO), a correspondência subiu de 10/19 para 11/20, e o K numérico operou pela via tabelada em **20 de 20** pontos rurais, sem fallback. Confirmei por consulta própria. **Nada disso será refeito.**

## Erro meu, 1: o sufixo em `cod_um2`

Eu havia registrado que você anexava um sufixo de duas letras a `cod_um2`. **Estava errado, e a correção é sua a favor.** A camada tem **dois** campos:

| ponto | `cod_um` | `cod_um2` |
|---|---|---|
| R13 / C02 | `SG21NVef1NV` | `SG21NVef1` |
| R01 Toledo | `SG22LVef1LV` | `SG22LVef1` |

Os valores que você relatou são os de **`cod_um`**, corretos — só estavam rotulados como `cod_um2`. Erro de rótulo de campo, não valor inventado. Corrigido no registro em `f5e9d6f`. Permanecem sem explicação apenas o `cod_um2` do ponto de associação e o `erod_um` dele.

## Erro meu, 2: a suspeita sobre o C02

Suspeitei que a sua regra "preferir a feição com solo" pudesse admitir ponto realmente dentro da represa de Itaipu. **Testei por ponto-em-polígono e a suspeita era infundada:** em (−24,8531, −54,3622) as duas cartas dizem **solo** — PR `LVef1 LATOSSOLO`, 2024 `SG21NVef1 Baixa k=0,012`. O rótulo `C02_SantaHelena_CorpoDagua` é que é impróprio; a coordenada está em terra. A leitura "Corpo d'água" que eu obtive antes era artefato do **meu** método, que tomava a primeira feição do `GetFeatureInfo`.

## Por que ainda assim trocar o mecanismo

Porque ele acerta **sem garantia de acertar**. A ordem das feições devolvidas pelo GeoServer **não é ordem de contenção**, e isso é demonstrável: em C02 o polígono de água vem **primeiro** na camada de 2024; em R13 vem primeiro na camada do Paraná. A regra "preferir solo" chega à resposta certa nos pontos que conferi, mas é heurística sobre consulta com buffer, e **7 de 20 pontos (35%)** têm hoje a classificação decidida por ela. Esses 7 alimentam o quadro amostral do sorteio, e depois de sortear não há correção sem descartar `pi_i`, o que D23 proíbe.

---

# PARTE I — O MECANISMO, JÁ TESTADO POR MIM

Testei cinco variantes. **Funciona, numa requisição só, devolvendo exatamente o polígono que contém o ponto, uma feição por camada:**

```
service=WFS
version=1.1.0
request=GetFeature
typeName=geonode:parana_solos_20201105,geonode:bra_erodibilidade_2024_sirgas2000,geonode:brasil_erodibilidade_solo
outputFormat=application/json
CQL_FILTER=INTERSECTS(geometry, POINT(<lat> <lon>));INTERSECTS(geometry, POINT(<lat> <lon>));INTERSECTS(geometry, POINT(<lat> <lon>))
```

Um filtro por camada, separados por **ponto e vírgula**, na mesma ordem de `typeName`.

Resultado medido em (−24,8800, −54,2600):

```
3 feições: parana_solos_20201105.2807 (NVef2)
           bra_erodibilidade_2024_sirgas2000.102154 (SG21NVef1)
           brasil_erodibilidade_solo.75362 (Baixa)
```

**O custo não aumenta:** continua uma requisição por ponto, como hoje.

## O que NÃO funciona, para você não perder tempo

- **WFS 2.0.0 com várias `typeNames`** é interpretado como consulta de junção e devolve `500 — "Join query must specify a filter"`. Com uma camada só, a 2.0.0 funciona, mas exigiria três requisições.
- **`GetFeatureInfo` com bbox** continua funcionando, mas é o mecanismo que estamos trocando.

## A ARMADILHA DE EIXOS — leia duas vezes

A ordem dos eixos **inverte entre versões**:

| Versão | Forma correta | Com a forma errada |
|---|---|---|
| **1.1.0** | `POINT(lat lon)` | **0 feições** |
| 1.0.0 | `POINT(lon lat)` | **0 feições** |
| 2.0.0 (camada única) | `POINT(lat lon)` | **0 feições** |

**Este é o modo de falha mais perigoso desta mudança, e não é exagero.** Com a ordem errada a consulta **não dá erro**: devolve zero feições, para todos os pontos. Isso significa que **todo candidato passa a "sem solo mapeado" e o quadro amostral esvazia silenciosamente** — e "sem solo mapeado" é uma resposta que parece legítima, não dispara alarme e não quebra teste algum que não olhe para a contagem.

Adote **1.1.0 com `POINT(lat lon)`** e trave a ordem por teste, conforme a PARTE IV.

---

# PARTE II — V1: SUBSTITUIR O ATRIBUIDOR

1. Escreva o construtor da URL de `GetFeature` com os três filtros, ao lado de `buildGetFeatureInfoUrl` (`src/lib/embrapa/embrapaSoilClient.ts:198`), sem removê-la ainda — ela tem uso na PARTE III.
2. `queryEmbrapaSoil` passa a **atribuir** pela resposta do ponto-em-polígono. A atribuição é a autoridade: é a unidade que contém a coordenada, e não a que o GeoServer devolveu primeiro num buffer.
3. **Espera-se no máximo uma feição por camada.** Se vier mais de uma, a coordenada está **exatamente sobre a fronteira compartilhada** de dois polígonos, porque `INTERSECTS` inclui o contorno. É caso legítimo e raro: registre-o e trate-o como `indisponivel` com causa `insuficiente` e motivo nomeado, em lugar de escolher por ordem. Não invente critério de desempate.
4. A heurística "preferir a feição com solo" de U1 **deixa de governar a atribuição**. Não a apague às cegas: verifique se ela ainda tem chamador e relate. Se ficar sem uso na atribuição, ou remova-a dizendo por quê, ou mantenha-a apenas para o diagnóstico da PARTE III, declarando esse papel.

---

# PARTE III — V2: O MARCADOR DE FRONTEIRA NÃO PODE VIRAR FALSO EM SILÊNCIO

`pontoEmFronteiraPedologica` está definido em `embrapaSoilClient.ts:870` como `feicoesSoloPr.length > 1`. Com ponto-em-polígono há sempre no máximo uma feição — de modo que **o marcador passaria a ser sempre `false`**, sem que nada avise. Seria perder informação e, pior, afirmar ausência de fronteira onde há.

**O marcador tem valor científico real:** com célula de 10 m e rótulo de erosão atribuído por unidade pedológica, estar a poucos metros da fronteira de duas unidades afeta a confiabilidade do rótulo. Não o descarte.

**O que fazer:**

1. **Nunca deixe o marcador `false` por indisponibilidade.** Se não for computado, é `indisponivel`. `false` significa "conferido e não é fronteira".
2. Compute-o **mantendo a consulta com bbox** — é justamente para isso que ela serve bem — e **restrinja-o aos pontos que importam**: os candidatos que chegam ao sorteio e os 36 polígonos sorteados. Não é preciso computá-lo para todo candidato do quadro, porque a **atribuição** já está correta por ponto-em-polígono; o marcador é diagnóstico de confiabilidade de rótulo, não critério de elegibilidade.
3. Assim cada consulta faz o que sabe fazer: **ponto-em-polígono atribui, bbox detecta fronteira.** Declare essa divisão no comentário do módulo.
4. O marcador continua **fora da matriz de treino** por Invariante 2. Mantenha-o em `CAMPOS_PROIBIDOS_MATRIZ_TREINO`.

---

# PARTE IV — V3: ZERO FEIÇÕES, E O TESTE QUE TRAVA A ORDEM DOS EIXOS

## Zero feições

Com ponto-em-polígono, zero feições passa a ser resposta **frequente e correta**: a coordenada está sobre lâmina de água, sobre lacuna do mapeamento, ou fora da cobertura da carta.

- Zero feições é **`indisponivel`**, com causas distintas e nomeadas: fora da cobertura da camada estadual, versus dentro da cobertura mas sobre lacuna ou água.
- **É vedado** tratar zero feições como "solo não encontrado, usar o fallback por faixa de classe". O fallback de D14 existe para quando **a camada de 2024** não traz `k_solos` havendo unidade de solo — não para quando não há unidade alguma. Confundir os dois poria K numérico em cima de represa.

## O teste que trava a ordem dos eixos

Obrigatório, porque é o que impede o esvaziamento silencioso:

1. **Teste de fixture:** a partir de artefato cometido, asseverar que a resposta de (−24,8800, −54,2600) traz **exatamente três feições, uma por camada**, com `sbcs = "NVef2"`, `cod_um2 = "SG21NVef1"` e `classe = "Baixa"`.
2. **Teste de contagem, que é o que pega a inversão:** asseverar que a URL construída contém `POINT(<lat> <lon>)` **nessa ordem**, comparando com a latitude e a longitude de entrada. Um teste que apenas verifique "a URL tem POINT" passaria com os eixos trocados.
3. **Script de conferência ao vivo**, cometido em `docs/verificacoes/fontes/wfs_erodibilidade/`, que consulta um punhado de coordenadas conhecidas e **falha se qualquer uma devolver zero feições nas três camadas**. Zero em todas as camadas, em coordenada agrícola conhecida, é assinatura de eixo invertido.
4. **Guarda de sanidade no código**, não só em teste: se a fração de candidatos com zero feições exceder um limiar declarado, abortar com mensagem nomeando a suspeita de inversão de eixos, em lugar de seguir com quadro vazio. Fixe o limiar e justifique-o no relatório.

---

# PARTE V — V4: REMEDIR PELA TERCEIRA VEZ

1. Reexecute sobre as **mesmas 20 coordenadas rurais** e os **2 controles**.
2. **Preserve os dois relatórios anteriores** — o de 28/09 e o `_pos_u1`. O novo leva sufixo próprio. As três medições lado a lado são o resultado.
3. Reporte a comparação **de três colunas**: antes de U1, depois de U1, depois de V1. Os mesmos indicadores: solo em ambas as cartas, correspondência estrita, correspondência do dominante, divergência, e o recorte das associações.
4. **Diga quais dos 7 pontos de fronteira mudaram de classificação** ao sair da heurística para o ponto-em-polígono. Se nenhum mudou, isso também é resultado, e forte: significaria que a heurística vinha acertando nos 7.
5. Reconte a via do fator K de D14: quantos por `k_solos` tabelado, quantos por fallback, quantos `fora-do-dominio`.
6. Registre quantas coordenadas caíram **exatamente sobre fronteira** (mais de uma feição na mesma camada) e quantas devolveram **zero** feições.

---

# PARTE VI — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `src/config/decisoes.ts` e `src/config/decisoes.test.ts` proibidos. Nenhuma emenda é necessária aqui: D08, D09 e D14 não mudam de conteúdo; muda **como** a unidade que contém o ponto é determinada, o que nenhuma delas fixa.
- **P12** — zero feições não vira valor, e `k_solos = 0` não vira K.
- **Não use WFS 2.0.0 com três camadas.** Devolve 500.
- **Não adote `POINT(lon lat)` na 1.1.0.** Devolve zero em tudo, sem erro.
- **Não execute o sorteio.** Ele é o passo seguinte, e depende desta remedição, mas não é seu.

---

# PARTE VII — RELATÓRIO

Vale a disciplina **R1 a R6**. Em especial **R1** — cole do artefato, não do texto — que foi a única fonte de erro do seu relatório anterior, e **R2**, script cometido junto da saída bruta.

1. A URL de `GetFeature` efetivamente construída, colada de artefato, para uma coordenada real.
2. Como ficou o tratamento de mais de uma feição na mesma camada, e quantas coordenadas caíram nesse caso.
3. Como ficou o tratamento de zero feições, com as causas distintas, e quantas caíram em cada uma.
4. O limiar da guarda de sanidade de V3.4 e a justificativa dele.
5. Onde o marcador de fronteira passou a ser computado, e a confirmação de que ele é `indisponivel` — nunca `false` — quando não computado.
6. A comparação de três colunas de V4, e o destino dos 7 pontos de fronteira.
7. Se a heurística de U1 ficou sem chamador, e o que você fez com ela.
8. Confirmação da passagem de autoconferência de R5 e o que ela pegou.

Assine com a sua identidade. `author` é Luís Alfredo Ferreira da Silva (`RedZardoz`). Atualize `docs/PROVENIENCIA_ASSISTENCIA_IA.md`.

---

## Nota

Depois desta tarefa o quadro amostral deixa de ter ponto cuja unidade pedológica foi decidida por ordem de retorno de servidor. É a condição que faltava para o sorteio, porque `pi_i` registrado é irreversível por D23: qualquer correção de elegibilidade feita **depois** do sorteio exigiria descartá-lo.

A dívida de D08 **não** se fecha aqui, e vale repetir para não haver ilusão: as associações têm `0 de 3` de correspondência entre as duas cartas, e isso é divergência real entre levantamentos, não artefato de consulta. Ponto-em-polígono torna a atribuição determinística; não faz as duas cartas concordarem. A marcação de ambiguidade segue governada pela heurística taxonômica não conferida, e segue marcada.
