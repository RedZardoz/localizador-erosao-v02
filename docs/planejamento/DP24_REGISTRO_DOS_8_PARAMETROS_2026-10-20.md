# DP-24 — registro dos 8 parâmetros: opções e recomendação

**Data:** 20 de outubro de 2026
**Commit-base da verificação:** `5ea1a65` (`sarel/executor-2026-10-09`), com dependências instaladas
**Para:** decisão do pesquisador

---

## 1. O enquadramento mudou: não são 8 problemas iguais

O detector do GOV-5 acusou 8 ocorrências e as classificou todas como "científico e não registrado". Ao ler o que cada número faz, **elas são três problemas diferentes**, e tratar os 8 do mesmo jeito criaria governança duplicada em metade deles.

| Grupo | Quantos | Natureza |
|---|---|---|
| **A** — já decididos, falta valor legível por máquina | 3 | A decisão existe e fixa o número; o código não a lê |
| **B** — entrada de operador via HTTP com preenchimento silencioso | 3 | Não é valor da metodologia: é escolha de campanha, com fallback silencioso |
| **C** — parâmetro genuinamente não registrado | 2 | Nenhuma decisão cobre; precisa de registro novo |

---

## 2. Grupo A — a decisão já existe (3 números)

Estes **não precisam de parâmetro P novo**. Precisam exatamente do que o GOV-3 fez com D02 e D10: campo `parametros` com valor e operador, e leitura por `exigirParametro`.

### A.1 `intervaloGuardaMeses = 24` — `montagemTemporal.ts:109`

**O que faz.** Intervalo de guarda entre a janela de preditores e a data do evento, para impedir vazamento temporal no Modelo P.

**Já decidido em D04**, cujo valor diz: *"intervalo de guarda temporal estrito de 2 anos (24 meses) encerrado antes da data do evento para eliminar vazamento temporal"*.

| Opção | Explicação |
|---|---|
| **(a) Acrescentar `parametros.intervaloGuardaMeses = 24` em D04 e ler por `exigirParametro`** | O número sai do código e passa a ter uma fonte só. Se D04 for revista, o código acompanha automaticamente — é exatamente o que falhou entre D10 e o gráfico |
| (b) Criar um parâmetro P novo | Duplica governança: passariam a existir dois lugares decidindo a mesma coisa, e eles divergiriam na primeira revisão |
| (c) Deixar como default | Mantém o vermelho e a violação da Regra 1 |

**Recomendo (a).** É mecânico, de risco nulo, e o valor não muda.

### A.2 e A.3 `declividadeMin = 3.0` e `declividadeMax = 20.0` — `route.ts:191-192`

**O que faz.** Domínio de declividade dos candidatos elegíveis.

**Já decidido em D07**: *"Domínio de validade: declividade 3 a 20%, WorldCover 30 e 40, concordância entre épocas"*.

> ### Achado que surgiu desta análise: D07 está decidida e **não é imposta**
>
> `validarOpcoesElegibilidade` (`elegibilidade.ts:54-58`) só verifica `minSlope >= 0` e `maxSlope > minSlope`. **Uma requisição com `declividadeMin: 0` e `declividadeMax: 60` é aceita** — fora do domínio que D07 declarou. O default de 3.0/20.0 hoje é a *única* coisa que mantém o domínio, e um cliente que envie outros valores o contorna sem aviso.
>
> Isso é mais grave que o default em si: é uma decisão registrada que o sistema não faz valer.

| Opção | Explicação |
|---|---|
| **(a) Registrar em D07 e fazer `validarOpcoesElegibilidade` recusar fora do domínio** | Fecha as duas coisas de uma vez: tira o default e passa a impor a decisão. Requisição fora de 3–20% é rejeitada com causa |
| (b) Só registrar, sem impor | Tira o vermelho e deixa o buraco: continua possível pedir 0–60% |
| (c) Registrar e permitir ultrapassar com justificativa explícita | Útil se houver análise de sensibilidade fora do domínio; exige decidir quem autoriza |

**Recomendo (a)**, com uma ressalva: se você pretende rodar sensibilidade fora de 3–20%, (c) é a escolha certa, e aí precisa dizer quem pode autorizar e como fica registrado.

---

## 3. Grupo B — entrada de operador, não valor de metodologia (3 números)

Os cinco de `route.ts` são campos do **corpo da requisição HTTP**, desestruturados de `body`. A interface já os fornece: `CandidateSelectionModal.tsx:47` tem `useState<number>(0.15)`. O default no servidor é o que acontece **quando o cliente omite o campo**.

Isso muda o diagnóstico. O problema não é "a metodologia está escondida no código". É que **uma requisição incompleta é silenciosamente completada**, e nada registra que houve preenchimento. Em substância é a Regra 1: preenchimento arbitrário sem causa declarada.

Para estes três, a correção mais fiel não é ler do registro — é **recusar a requisição incompleta**.

### B.1 `tamanhoAmostra = 50` — `route.ts:188`

**O que faz.** Escolha de campanha que escala todo o pipeline: `tamanhoAmostra * 25` (teto 10.000) define a busca de candidatos; `* 9` a meta de pool; `* 1,8` o teto; e entra no cálculo da proporção in loco.

| Opção | Explicação |
|---|---|
| **(a) Tornar obrigatório: requisição sem o campo é recusada** | Nenhum número é inventado. Quem dispara a seleção declara o tamanho, sempre. É o fail-closed que o projeto já usa em `exigirDecisao` |
| (b) Registrar como parâmetro P com valor 50 | Trata como constante metodológica o que é escolha por campanha. Engessa e provavelmente será ignorado |
| (c) Manter o default, documentando-o | Mantém o preenchimento silencioso |

**Recomendo (a).** É operador, não metodologia.

### B.2 `raioThinningKm = 5.0` — `route.ts:189`

**O que faz.** Raio **de partida** do thinning. O laço relaxa a partir dele até a meta de pool, nunca abaixo do piso de **1.000 m fixado por P02**.

Este é o número sobre o qual eu me enganei antes: não colide com P02 — são papéis distintos. Mas P02 registra o piso, e **o raio de partida existe apenas na prosa da justificativa de P02**.

| Opção | Explicação |
|---|---|
| **(a) Acrescentar `parametros.raioPartidaMetros = 5000` à própria P02** | Mantém piso e partida no mesmo lugar, lado a lado. Torna impossível confundir os dois de novo — que foi exatamente o meu erro |
| (b) Criar P novo separado | Separa o que é um mecanismo só, e reabre a confusão |
| (c) Tornar obrigatório na requisição, como B.1 | Defensável, mas aqui o número é metodológico: governa independência espacial, não logística de campanha |

**Recomendo (a).** E lembro o que está pendente: o **variograma** responde empiricamente se 5 km compra algo sobre 1 km, e a mesma medição fecha P01. Vale rodar antes do sorteio D16, porque o selo é irreversível.

### B.3 `frequenciaSoloNuMin = 0.15` — `route.ts:190`

**O que faz.** Frequência mínima de solo descoberto (Ê) para um candidato ser elegível. É filtro de seleção, distinto de D10, que define **o que conta** como solo descoberto (`NDVI <= 0.25`). D10 define o critério; este número define quanto dele é preciso.

O valor está duplicado: `route.ts:190` e `CandidateSelectionModal.tsx:47`.

| Opção | Explicação |
|---|---|
| **(a) Registrar como parâmetro novo e a UI semear do registro** | Elimina a duplicação UI/servidor e dá rastreabilidade ao filtro, que influencia quem entra na amostra |
| (b) Tornar obrigatório na requisição | Resolve o preenchimento silencioso, mas mantém as duas cópias e deixa a escolha sem registro |
| (c) Vincular a D10 | Errado: D10 é o limiar de NDVI, este é a fração de tempo. Juntá-los repete a confusão D02×D10 |

**Recomendo (a).** É um filtro que decide quem entra na amostra: merece registro, e a duplicação UI/servidor é dívida independente.

---

## 4. Grupo C — genuinamente sem registro (2 números)

### C.1 `nMinimo = 3` — `estatisticasSerie.ts:57`

**O que faz.** Mínimo de observações válidas para calcular percentis (p10, p50, p90) de uma banda. Abaixo disso devolve `indisponivel` com causa `"insuficiente"` — ou seja, o fail-closed está correto; só o número é que não tem origem declarada.

**Não é D11.** D11 exige **6** observações, mas para outra coisa: suficiência da frequência de solo nu, imposta por `avaliarSuficienciaAmostralD11` em `amostragemSoloNuLote.ts:484`. São dois gates distintos.

> **Questão metodológica, não só de registro:** p10 e p90 calculados sobre **n = 3** são essencialmente o mínimo e o máximo da amostra. O percentil existe, mas não significa o que o nome promete. Um examinador pode perguntar por que o preditor de percentil aceita 3 observações enquanto a metodologia exige 6 para frequência de solo nu.

| Opção | Explicação |
|---|---|
| **(a) Registrar como P novo com valor a decidir, e alinhar com D11 se a resposta for 6** | Um único critério de suficiência temporal é mais fácil de defender que dois |
| (b) Registrar mantendo 3, com justificativa de por que percentis toleram menos que a frequência | Defensável se houver razão; a razão precisa ser escrita |
| (c) Registrar mantendo 3 sem justificativa | Tira o vermelho e deixa a pergunta de pé para a banca |

**Recomendo (a) ou (b) — e esta é sua, não minha.** Não tenho base para dizer se 3 é suficiente para percentis nesta aplicação. O que posso afirmar é que **3 e 6 convivendo sem explicação é pergunta certa numa arguição**.

### C.2 `duracaoJanelaAnos = 3` — `montagemTemporal.ts:110`

**O que faz.** Comprimento da janela de preditores por ponto, em anos.

Verifiquei: **nenhuma decisão cobre.** D05 fixa o sensor e o período da série (Sentinel-2 L2A, 2016–2026); D04 fixa a guarda de 24 meses; D11 fixa o mínimo de observações. O comprimento da janela não está em lugar nenhum.

| Opção | Explicação |
|---|---|
| **(a) Registrar como P novo, com 3 anos e a justificativa que sustenta a escolha** | É um preditor estrutural: muda quantas observações entram em cada ponto e interage com D11 e com a guarda de D04 |
| (b) Acrescentar a D04, junto da guarda | Guarda e janela são conceitos adjacentes, mas distintos: uma afasta do evento, a outra dimensiona a observação. Juntar repete a confusão D02×D10 |
| (c) Deixar como default | Um dos números mais consequentes do desenho temporal fica sem origem declarada |

**Recomendo (a).** Com um ponto a considerar: janela de 3 anos mais guarda de 2 anos exige **5 anos de série antes de cada evento**. Vale conferir se a série de 2016–2026 sustenta isso para todos os pontos, ou se alguns perdem janela — e, nesse caso, se a perda é homogênea entre estratos.

---

## 5. Resumo para decidir

| # | Parâmetro | Onde | Recomendação |
|---|---|---|---|
| 1 | `intervaloGuardaMeses = 24` | D04 existente | Registrar em D04 |
| 2 | `declividadeMin = 3.0` | D07 existente | Registrar em D07 **e impor** |
| 3 | `declividadeMax = 20.0` | D07 existente | Registrar em D07 **e impor** |
| 4 | `tamanhoAmostra = 50` | requisição | Tornar obrigatório |
| 5 | `raioThinningKm = 5.0` | P02 existente | Registrar em P02 como raio de partida |
| 6 | `frequenciaSoloNuMin = 0.15` | — | P novo + UI semeia do registro |
| 7 | `nMinimo = 3` | — | P novo; **decidir se alinha com os 6 de D11** |
| 8 | `duracaoJanelaAnos = 3` | — | P novo |

**Só três exigem decisão metodológica sua:** o nº 7 (3 ou 6), o nº 2/3 (impor D07 estritamente ou permitir sensibilidade) e o nº 8 (confirmar os 3 anos e verificar se a série sustenta janela + guarda).

Os demais são mecânicos: valor não muda, só passa a ter fonte única.

**Parâmetros P novos necessários: três** (`frequenciaSoloNuMin`, `nMinimo`, `duracaoJanelaAnos`).

### IDs livres — conferidos, não presumidos

A v2 do prompt do executor já colidiu aqui, então verifiquei em vez de contar a partir do último. As chaves de `PARAMETROS` vão de P01 a P11 e de P20 a P24, mas **chave ausente não significa ID livre**:

| ID | Situação |
|---|---|
| **P12** | **EM USO.** É "a proibição P12", citada em `sorteio-d16/route.ts:123`, em `PainelCriterioRefutacaoD25.tsx` e em D14 |
| **P15** | **EM USO.** 10 referências vivas no código |
| P13, P14, P16–P19 | Sem referência, mas ficam no vão deixado pela colisão anterior |
| **P25, P26, P27** | **Livres e contíguos**, acima do maior existente (P24) |

**Use P25, P26 e P27.** Reaproveitar número que já teve significado é como se cria a próxima colisão — e o custo de pular alguns IDs é zero.

---

## 6. O que decorre da sua decisão

Decidido o DP-24, o **GOV-5b não deve ser executado**: registrar os 8 é mais limpo que criar 8 exceções para removê-las em seguida. A suíte volta ao verde pela via definitiva.

Resta então **C28** — os dois warnings de lint — como único bloqueio do CI do GOV-6.
