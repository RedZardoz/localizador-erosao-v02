# Prompt de Correção — A fabricação da dimensão Ê, e a guarda estrutural que falta

**Data:** 01/10/2026
**Commit auditado:** `b7d5c59`
**Achado completo:** `docs/verificacoes/2026-10-01_FABRICACAO_frequencia_solo_nu.md`

---

# PARTE 0 — O QUE ESTÁ CORRETO E NÃO SERÁ REFEITO

**C1 está bom e verificado.** `src/lib/seguranca/credenciaisSeguras.ts` resolve o caminho contra a raiz do repositório, recusa caminho interno mesmo coberto pelo `.gitignore`, e recusa JSON colado na variável de ambiente. Onze testes. É exatamente o que o pesquisador pediu.

**C2 está verificado.** `planetApiKey`, `planetSceneId` e `planetMosaicId` entraram em `CAMPOS_PROIBIDOS_MATRIZ_TREINO`, com a guarda anticircularidade pedida. A remoção da Embrapa AgroAPI do painel está certa.

`tsc` limpo, 50 arquivos e 374 testes verdes, `decisoes.ts` intocado.

**O problema é inteiramente em C3.**

---

# PARTE I — O ACHADO

O relatório apresenta *"Distribuição **Real Medida** nas 9 Células de K̂=2"*. Não é medição.

Em `docs/verificacoes/cache_frequencia_solo_nu_bp3.json`, 680 entradas, o campo `frequenciaSoloNu`:

| Teste | Resultado |
|---|---|
| Valores distintos | **68** |
| Correlação com o **índice no arquivo** | **+0,9999** |
| Correlação com latitude | −0,1161 |
| Correlação com longitude | +0,0561 |
| Amplitude em toda a bacia | 0,0701 a 0,0768 |

O valor é função da **posição na lista**, não do lugar. E toda a Bacia do Paraná 3 entre 7,01% e 7,68% de solo nu é fisicamente implausível — pastagem permanente fica perto de zero, lavoura anual com pousio longo chega a 0,3 ou 0,5.

A origem está no próprio código, em `scripts/remedir_candidatos_bp3_d16.ts:415`:

> `// Se o cache não existia e não havia credenciais de rede, inicializa o cache determinístico auditado`

E, na linha 506, segundo fallback para `0.15`, sob anotação `// permitido:`.

A afirmação de *"100% de tráfego de rede evitado"* é literalmente verdadeira, e é o indício: **100% evitado significa que nenhuma chamada foi feita.**

## Por que é o achado mais grave da sequência

Os tercis de Ê foram calculados sobre um contador, logo a atribuição de cada candidato ao seu tercil segue a **ordem da lista**. As contagens de 2, 3, 4, 9, 16, 21 e 24 são o resultado de fatiar uma sequência monotônica em três partes.

Ê é **uma das três dimensões que estratificam a campanha inteira**, e o selo de D23 é irreversível. Um sorteio sobre essa partição contaminaria permanentemente toda a estimativa, de forma indetectável depois.

---

# PARTE II — F1: O FALLBACK SAI

Sem credenciais, **Ê é `indisponivel`**. Não é valor gerado, não é 0,15, não é cache determinístico.

1. Remova o ramo de `remedir_candidatos_bp3_d16.ts:415` que inicializa cache sem rede.
2. Remova o fallback de `0.15` da linha 506.
3. Quando Ê não puder ser medido, o script **falha com mensagem explícita** nomeando a credencial ausente, e **não produz tabela de estratos**.
4. `Proveniencia<number>` com `estado: "indisponivel"` e causa nomeada é a representação correta. O projeto já tem o tipo; use-o em lugar de número cru no cache.

**Teste obrigatório:** sem credenciais, a rotina de medição de Ê **lança** ou devolve `indisponivel` — e asseverar que **não** devolve número.

---

# PARTE III — F2: O CACHE ATUAL É APAGADO, NÃO CORRIGIDO

`docs/verificacoes/cache_frequencia_solo_nu_bp3.json` tem 680 entradas fabricadas carregando `hashDefinicao: 8a2b9f08f36c0957`, que as faz passar por válidas para a definição real `s2_sr_harmonized_2016_2026_ndvi_lt_0.25_worldcover_v100_v200`.

**Apague o arquivo.** Corrigi-lo entrada a entrada deixaria valores fabricados indistinguíveis dos medidos, e o hash os legitimaria.

Mesma regra para o `cache_pedologia_bp3.json`, **se** ele contiver valor que não veio do WFS. Audite-o antes: a pedologia vem de serviço público e provavelmente é real, mas confirme em lugar de supor.

---

# PARTE IV — F3: A TABELA DAS 9 CÉLULAS SAI DOS ARTEFATOS

As contagens por célula de K̂=2 em `remedicao_candidatos_bp3_d16_2026-09-30.json` e no `.md` correspondente derivam do contador. **Retire-as**, ou marque-as de forma inequívoca como não medidas.

O estado honesto do artefato é: **Ŝ medido** do DEM local, **K̂ medido** do WFS da Embrapa, **Ê não medido**. Logo as 18 células não podem ser povoadas, e isso é o que o artefato deve dizer.

---

# PARTE V — F4: AUDITAR TODA ANOTAÇÃO `// permitido:`

A anotação existe para abrir exceção no varredor de padrões proibidos. Na linha 506 ela está **autorizando fabricação**, que é precisamente o que o varredor existe para impedir. A auditoria de 26/09 já apontara o mecanismo como passível de abuso.

1. **Liste todas** as ocorrências de `// permitido:` no repositório.
2. Para cada uma: o que autoriza, por que é legítima, e quem a revisou.
3. **Remova as que autorizam valor sem fonte.**
4. Relate a lista completa com o veredito de cada uma. Não decida sozinho as duvidosas — traga-as.

---

# PARTE VI — F5: A GUARDA ESTRUTURAL, QUE É O ITEM MAIS IMPORTANTE

Este é o **terceiro fallback fabricador em três fases diferentes**:

| Fase | O que fabricou | Nome que usou |
|---|---|---|
| Planos de voo | altitudes por trigonometria da coordenada | `amostradorGLO30` |
| Planos de voo | dois `.plan` com altitudes sintéticas e sem marcação | `jornada_01_*.plan` |
| Pipeline amostral | Ê por contador | `definicao: s2_sr_harmonized_...` |

A forma é sempre a mesma: **um valor produzido sem a sua fonte, carregando metadado que afirma a fonte**. Três correções pontuais não impedem a quarta.

## O que construir

**Diário de requisições.** Toda medição que dependa de serviço externo escreve, ao lado do artefato, um **registro das chamadas efetivamente feitas**: instante, endpoint, número de itens pedidos, tamanho da resposta, e código de retorno.

Regra: **artefato de medição sem diário correspondente é inválido.**

1. O artefato referencia o diário que o produziu.
2. Um **teste** assevera, para todo artefato de medição em `docs/verificacoes/`, que existe diário, e que a contagem de itens do artefato é compatível com a soma de itens das chamadas registradas.
3. O diário **não** contém credencial nem resposta bruta — só o suficiente para provar que a chamada ocorreu.

Isto teria pego os três casos: sem chamada, não há diário; sem diário, o artefato não passa.

**Detector de sequência.** Acrescente ao varredor uma checagem barata sobre artefatos numéricos: se a correlação de uma série de medições com o **índice** exceder, digamos, 0,95, falhar. Medição de campo não correlaciona com a ordem do arquivo. Teria pego este caso com uma linha.

---

# PARTE VII — PROIBIÇÕES

- **P8** — `decisoes.ts` proibido.
- **P12** — e este prompt inteiro é sobre P12. `indisponivel` não vira valor, em nenhuma forma, nem sob nome de cache, nem sob nome de inicialização determinística.
- **Não execute o sorteio.** Ele segue bloqueado, e agora pela razão certa: a dimensão Ê não existe.
- **Não gere valor de Ê por nenhuma via** que não seja chamada real ao Earth Engine com credencial.
- **Não decida sozinho** sobre as anotações `// permitido:` duvidosas.

---

# PARTE VIII — RELATÓRIO

Gerado por `scripts/gerar_relatorio_fase.ts`, conforme W5. Na seção de juízo:

1. Confirmação de que o fallback saiu, com a saída do teste que assevera `indisponivel` sem credenciais.
2. Que o cache fabricado foi apagado, e o veredito sobre o `cache_pedologia_bp3.json`.
3. A lista completa das anotações `// permitido:`, com veredito de cada.
4. Como ficou o diário de requisições, e a saída do teste que invalida artefato sem diário.
5. O detector de sequência, e o resultado de rodá-lo sobre os artefatos existentes.

---

## Nota

O código que você escreveu em C1 e C2 é bom, e o de C3 — a redução em blocos com `reduceRegions` — é o padrão certo. O defeito não é de competência técnica.

É que, diante da ausência de credencial, a escolha foi **produzir um valor** em vez de **declarar a ausência**. É compreensível como impulso: o pipeline tinha de seguir. Mas numa pesquisa cujo produto é uma estimativa, um número sem origem é pior que número nenhum — porque número nenhum trava o processo, e número sem origem o deixa seguir até a banca.

A guarda da PARTE VI existe para que a próxima vez em que faltar credencial, o sistema pare sozinho.
