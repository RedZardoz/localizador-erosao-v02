# Relatório de execução — Contenção (P-0)

**Data da execução:** 2 de novembro de 2026
**Prompt executado:** [`PROMPT_EXECUTOR_CONTENCAO_2026-11-01.md`](../planejamento/prompts/PROMPT_EXECUTOR_CONTENCAO_2026-11-01.md)
**Branch:** `correcoes/contencao-2026-11-02`, criada de `origin/sarel/executor-2026-10-09` (ponta, `8262ed9`)
**Natureza:** implementação dos cinco itens de contenção. Nenhuma decisão metodológica foi tomada; nenhum valor de limiar científico foi alterado; `src/config/decisoes.ts` não foi tocado.

> **Relatório consolidado em 03/11/2026.** Duas execuções independentes de `P-0` produziram relatórios separados: este, da execução de 02/11, e um segundo escrito por outro executor e commitado em `9cd8bd0` como `RELATORIO_CONTENCAO_2026-11-01.md`. Os dois descrevem o mesmo trabalho e **convergem em todas as conclusões**. Foram fundidos aqui, com a data de execução no nome conforme a convenção do projeto, e o duplicado foi removido. O que a segunda análise acrescentou está marcado ao longo do texto; a convergência na §4 é o dado mais relevante que ela produziu.

---

## 1. Baseline e estado final

| Verificação | Antes | Depois |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | **exit 0** |
| `npm test` | 93 arquivos, **743** passaram, 3 pulados | 93 arquivos, **761** passaram, 3 pulados |
| `npm test src/lib/seguranca/padroesProibidos.test.ts` | 32 passaram | **34** passaram |
| `npx next lint --max-warnings 0` | 2 warnings | **2 warnings** (inalterado) |

**Saldo de testes: +18**, sendo 19 acrescentados e 1 removido por redundância (ver item 2). Nenhum teste que passava deixou de passar.

**Os 3 testes pulados são legítimos e condicionais** — detalhe que a segunda análise trouxe e que foi verificado em 03/11: estão todos em `src/lib/fundiario/matcher.test.ts`, no bloco *"testes condicionais ao provisionamento da base"*, e são pulados porque a base fundiária SQLite local não está provisionada neste ambiente. Não são testes desativados.

**Atenção a uma confusão de fase, que a segunda análise registra e vale isolar.** O relatório de 03/11 cita *"94 arquivos, 794 passaram"* como estado da contenção. Esse é o estado da **branch inteira**, que inclui `P-L` (+9 testes) e `P-M` (+24). **A contenção isolada terminou em 93 arquivos e 761 testes**, e é esse o número que serve de referência para medir regressão em `P-0`. A segunda análise declara a mistura no seu próprio texto, de modo que não é erro — mas o número isolado é o que importa aqui.

**Sobre o baseline citado em prompts anteriores.** O prompt de 31/10 registrava *"92 arquivos, 725 testes aprovados, 3 pulados"*. O baseline medido hoje é 93 arquivos e 743 testes: a suíte cresceu entre 31/10 e agora. O número antigo não deve ser usado como referência de regressão.

**Sobre o lint.** Os dois warnings são pré-existentes e estão em arquivos **não tocados** por este trabalho — `src/components/map/MapViewer.tsx:526` e `src/components/map/PointPopup.tsx:69`, ambos `react-hooks/exhaustive-deps`. Corrigi-los é escopo de `A-10`, fora deste prompt. A afirmação do prompt de 01/11 de que "`npm test` pode falhar por infraestrutura" **não se verificou**: a suíte roda limpa.

---

## 2. Item por item

### Item 1 — Alvo D26 sem valor padrão (A-07a) ✅

| Arquivo | O que mudou |
|---|---|
| `src/components/inspetor/InspetorPonto.tsx` | `fracaoErodidaInput`: `useState<number>(0.0)` → `useState<number \| null>(null)`. O controle deixou de ser `input type="range"`, que não tem estado vazio, e passou a `input type="number"` com `step="0.001"`, iniciando vazio. `observadorInput`: `"Pesquisador PPGTCA"` → `""`. `confiancaInput`: `"alta"` → `""`, com opção `— selecione (sem valor padrão)` no `select`. A exibição do binário derivado mostra `— aguardando a fração observada` enquanto não há valor. |
| `src/lib/rotulos/rotuloHumano.ts` | `InsumosRotuloHumano.fracaoErodida`: `number` → `number \| null`; `confianca` admite `""`. Três recusas novas: confiança não escolhida; fração ausente; fração não numérica. Uma quarta recusa aplica a **Regra 2**: fração fora de `[0, 1]` é rejeitada com o valor no motivo, **não truncada**. |

**Por que o `range` tinha de sair.** Um `input type="range"` não representa ausência: ele sempre tem posição. Era isso que produzia o default `0,00` — e, combinado com a classe inicial `"erosao"`, permitia gravar um positivo com alvo zero, indistinguível de um zero observado.

**Testes (5 novos, `rotuloHumano.test.ts`, 3 → 8):** recusa de fração ausente com classe `"erosao"`; **aceitação de fração `0` explícita**, porque zero é observação e não ausência; recusa de `-0,01` e `1,5` sem truncar; recusa de `NaN`; recusa de confiança vazia.

### Item 2 — Duplicidade de `pi_i` no módulo de sorteio (N-02) ✅

`sortearPoligonosDroneD16` (36 polígonos, `pi_i = 2/N_h`) foi **removida**, com o docstring do módulo reescrito: ele documentava `pi_i = 2 / N_h` como a regra vigente, apontando para a rotina obsoleta.

**A cobertura foi preservada por conversão, não descartada.** Quatro testes exercitavam só a rotina legada e cobriam coisas que a vigente não testava:

| Teste | Destino |
|---|---|
| idempotência do selo (`nenhum_selo_anterior`) | convertido para `sortear72PoligonosD16` |
| três estados de `kAmbiguoAssociacao` + `unidadeDeterminanteK2024` | convertido |
| determinismo bit-a-bit sob a mesma semente, incluindo `hashIntegridade` | convertido; partição ajustada de 18+18=36 para 36+36=72 |
| identidade de Horvitz-Thompson `pi_i × w_i = 1` com `N_h` heterogêneos | convertido; expectativas ajustadas para `pi_i = 4/N_h` e `w_i = N_h/4` |
| "36 polígonos com `pi_i = 2/N_h` e invariância à ordem" | **removido por redundância**: T3.3 cobre 72 e `4/N_h`, e N10 (v) cobre invariância à ordem |

`sorteioPoligonos.test.ts`: 7 chamadas trocadas, 1 teste removido, **19 testes passando**, todos na rotina vigente.

**Estado do risco, verificado antes de agir.** Os dois chamadores de produção — `src/app/api/gee/sorteio-d16/route.ts:186` e `scripts/sortear_poligonos_d16.ts:246` — **já usavam a rotina correta**. A legada só era chamada pelos testes. Era risco latente, não bug ativo: nenhum `pi_i` errado foi selado.

### Item 3 — Semente registrada, não fixa (A-03) ✅

| Arquivo | O que mudou |
|---|---|
| `src/app/api/gee/select-candidates/route.ts` | `const semente = 42` removido. `RequestBody` ganhou `semente?: number`. Semente informada é validada (inteiro ≥ 1, com erro `SEMENTE_INVALIDA` e status 400); ausente, é gerada por `nodeCrypto.randomInt(1, 2**31 - 1)`. A semente efetiva e sua origem (`informada` / `gerada`) entram no `relatorio` da resposta, além do `criterioSelecao.semente` por ponto, que já existia. |
| `scripts/sortear_poligonos_d16.ts` | **Achado não previsto pelo prompt:** havia um **segundo default de semente**, `20260928`, embutido no CLI. Removido. Com `--confirmar`, `--semente` passou a ser **obrigatória** — o sorteio é irreversível e a semente tem de ser escolha registrada do pesquisador. No dry-run, gera e imprime a semente. |

A auditoria de 01/11 citava apenas `route.ts:296`. O default do CLI é, em certo sentido, mais grave: é o caminho que grava o selo irreversível de D16.

**Teste (2 novos, em `padroesProibidos.test.ts`, 32 → 34):** varre os dois arquivos de sorteio e falha se qualquer `const|let|var semente* = <número>` reaparecer, ignorando comentários; e assevera que a rota gera e registra a semente e que o CLI recusa `--confirmar` sem `--semente`. O objetivo é impedir a reincidência, que já ocorreu duas vezes.

### Item 4 — Fabricações numéricas (A-08) ✅

| Arquivo | Linha original | O que mudou |
|---|---|---|
| `src/lib/gee/serieTemporal.ts` | `calcularNdvi`, denominador nulo → `return 0` | → `return null`. Um zero fabricado era indistinguível de um NDVI 0 real (B8 = B4) |
| | `calcularNdvi`, clamp `±1` | → `return null`. Valor fora do domínio físico é indisponibilidade técnica, não valor a truncar (Regra 2) |
| | `calcularBsi` | mesmas duas correções |
| `src/lib/matriz/montagemTemporal.ts` | `ndvi: calcularNdvi(c.b8, c.b4)!` | A asserção não-nula injetaria `null` na série ordenada e contaminaria as estatísticas. A cena sem NDVI calculável passou a ser filtrada |
| `src/lib/matriz/montagem.ts` | `?? "BLOCO_INDEFINIDO"` em 2 pontos | Guarda nova: ponto sem bloco espacial é **excluído** com motivo registrado. O sentinela virava um grupo real no `GroupKFold` de D24, misturando pontos sem relação espacial no mesmo agrupamento de validação |
| `src/lib/export/planilha.ts` | `?? "BLOCO_INDEFINIDO"` | removido — **este ponto não constava da proposta de 01/11** |
| `src/lib/jev/jevClient.ts` | `confidence ... : 0.95` | → `: null` |
| `src/lib/jev/fallbackLocal.ts` | `0.5`, `0.95`, `0.92`, `0.82` e `valido ? 0.98 : 0.99` | todas → `null`. **As duas últimas (`0,98`/`0,99`) não constavam da proposta** |
| `src/types/jev.ts` | `confianca: number` (2 campos) | → `number \| null`, com a razão documentada no tipo |

**Decisão de escopo declarada:** o campo `confianca` foi preservado para a confiança que o **serviço externo reporta** (dado externo real, hoje coberto por um teste que assevera `0,96`), e removido apenas onde era **fabricado** — o default e as constantes do motor local. A leitura foi a de que o defeito é o número inventado, não o campo.

#### O caso do clamp com concessão `// permitido:` — `amostragemSoloNuLote.ts:497`

O prompt mandava **procurar lastro antes de alterar**. Busca feita em três frentes:

| Onde | Resultado |
|---|---|
| `src/config/decisoes.ts` | nenhuma decisão sobre clamp de frequência de solo nu |
| `docs/verificacoes/`, `docs/metodologia/` | a **única** menção a *clamp* é a Regra 2 da Ficha Técnica, que o **proíbe**: *"Proibição de clamping arbitrário (`Math.max`/`Math.min`) que oculte anomalias radiométricas; valores fora da faixa física recebem selo `fora-do-dominio`"* |
| histórico do git da linha | introduzido em `b7d5c59` (01/10/2026), commit de implementação (`fix(seguranca-gee-painel)`), não de decisão metodológica |

**Não há lastro para a concessão** — ao contrário, a documentação do projeto a proíbe e nomeia o remédio. Regra 2 aplicada: a frequência de solo nu é média de máscara binária e pertence a `[0, 1]` por construção; valor fora denuncia erro de redução no GEE. O clamp foi substituído por recusa com `indisponivel("fora-do-dominio", ...)`, com tolerância de `1e-9` apenas para ruído de ponto flutuante.

**Nota sobre o próprio varredor.** A primeira versão desta correção deixou um `Math.min(1, Math.max(0, ...))` residual depois da verificação de domínio. **O varredor de padrões proibidos o detectou e reprovou a suíte** (`[corte-math-max-min-com-literal]`). Era desnecessário — o `toFixed(4)` já absorve o ruído — e foi removido. O varredor funcionou exatamente como projetado, inclusive contra quem o estava usando.

#### Convergência independente, e é o achado mais sólido deste relatório

A segunda execução de `P-0` percorreu esta mesma busca **sem acesso às conclusões da primeira**, e chegou ao mesmo resultado nas três frentes:

| Frente | Primeira análise (02/11) | Segunda análise (03/11) |
|---|---|---|
| `src/config/decisoes.ts` | nenhuma decisão sobre clamp de solo nu | *"Nenhuma menção a corte ou clamp de frequência de solo nu"* |
| `docs/` | a única menção a *clamp* é a Regra 2, que o **proíbe** e nomeia o selo `fora-do-dominio` | mesma citação literal da Regra 2 da Ficha Técnica |
| histórico do git | `b7d5c59` (01/10/2026), commit de implementação | `b7d5c59`, *"commit de implementação/fix de interface, sem vínculo com decisão metodológica"* |
| conclusão | aplicar a Regra 2: recusa com `fora-do-dominio`, tolerância `1e-9` | idêntica, inclusive a tolerância |

Duas buscas independentes convergindo na mesma ausência de lastro vale mais que uma. **A concessão `// permitido:` daquele clamp não tinha fundamento, e isso agora está estabelecido por dupla verificação.**

**Testes (5 em `serieTemporal.test.ts`, 7 → 12; 3 em `montagemRotulo.test.ts`, 4 → 7):** NDVI e BSI com denominador nulo retornam `null`; ambos retornam `null` fora de `[-1, 1]`; **o zero legítimo é preservado** (`calcularNdvi(0.25, 0.25) === 0`), que é o caso que o retorno fabricado tornava ambíguo; ponto sem bloco, com bloco vazio ou só espaços é excluído com motivo; nenhuma linha da matriz carrega o sentinela.

### Item 5 — JEV sem coordenadas e sem confiança fabricada (A-09) ✅

| Arquivo | O que mudou |
|---|---|
| `src/lib/jev/jevClient.ts` | Removidos do payload externo: `latitude`, `longitude`, `municipio` e **`ponto.codigo`**. O serviço recebe apenas o estado biofísico adimensional — declividade, NDVI, BSI, classe de solo, erodibilidade. A instrução que dizia "desta **coordenada**" passou a "desta **amostra**" |
| `src/types/jev.ts` | Campo novo `naturezaEvidencia: "heuristica-nao-rotulo"`, obrigatório no laudo, para que nenhum consumidor possa alegar dúvida (Regra 4) |
| `src/app/api/jev/auditar/route.ts` | **Opt-in explícito**: a chamada externa só ocorre com `consentimentoEnvioExterno === true` na requisição. A ausência do campo **não** é consentimento — degrada para o motor local, que não faz requisição de rede. A resposta passou a declarar `envio_externo` |

O código do ponto foi removido junto com as coordenadas porque permite reidentificação cruzada, e o prompt mandava enviar "apenas índices, classe de solo e declividade".

**Testes (4 novos em `jevClient.test.ts`, 7 → 11):** o corpo efetivamente enviado ao `fetch` é inspecionado e não contém as coordenadas do ponto em nenhuma forma, nem as palavras `latitude`, `longitude`, `coordenada`, `wgs84`, nem o código ou o id — e **continua contendo** `declividade`, para que o teste não passe por payload vazio; ambos os motores declaram `naturezaEvidencia`; sem `confidence` do serviço, a confiança fica `null`; a heurística local não atribui confiança numérica.

---

## 2-A. Rastreabilidade achado → commit → teste (`C-06`)

Estrutura que a segunda análise trouxe e que faltava a este relatório: cada correção ligada ao
commit que a fez e ao teste que a sustenta. Os números de teste são os **acrescentados** por
item, não o total do arquivo.

| Item | Achado | Commit | Arquivo de teste | Testes novos | O que o teste assevera |
|---|---|---|---|---:|---|
| 1 | `A-07a` | `d2fd40e` | `src/lib/rotulos/rotuloHumano.test.ts` | +5 | fração ausente recusada mesmo com classe `"erosao"`; **fração 0 explícita aceita**, porque zero é observação; `-0,01` e `1,5` recusados sem truncar; `NaN` recusado; confiança vazia recusada |
| 2 | `N-02` | `4afc4e4` | `src/lib/gee/sorteioPoligonos.test.ts` | 19 convertidos, −1 redundante | idempotência do selo, três estados de `kAmbiguoAssociacao`, determinismo bit-a-bit sob a mesma semente, identidade `pi_i × w_i = 1` com `N_h` heterogêneos — **todos agora na rotina vigente** |
| 3 | `A-03` / `P07` | `d2fe5c2` | `src/lib/seguranca/padroesProibidos.test.ts` | +2 | nenhuma atribuição de semente a literal numérico nos dois arquivos de sorteio; a rota gera e registra a semente; o CLI recusa `--confirmar` sem `--semente` |
| 4 | `A-08` | `3766ce4` | `src/lib/gee/serieTemporal.test.ts` | +5 | denominador nulo retorna `null` em NDVI e BSI; fora de `[-1,1]` retorna `null`; **o zero legítimo é preservado** (`calcularNdvi(0.25, 0.25) === 0`) |
| 4 | `A-08` | `3766ce4` | `src/lib/matriz/montagemRotulo.test.ts` | +3 | ponto sem bloco, com bloco vazio ou só espaços é excluído com motivo; nenhuma linha carrega o sentinela |
| 5 | `A-09` | `3766ce4` | `src/lib/jev/jevClient.test.ts` | +4 | o corpo enviado ao `fetch` não contém as coordenadas em nenhuma forma, nem `latitude`, `longitude`, `coordenada`, `wgs84`, nem código ou id — e **continua contendo** `declividade`, para o teste não passar por payload vazio; ambos os motores declaram `naturezaEvidencia`; sem `confidence` do serviço a confiança fica `null` |

---

## 3. Para decisão do pesquisador — redação proposta para a emenda de D23

Não alterei `decisoes.ts` (CLAUDE.md §2). O texto vigente de D23 (`:425`) diz:

> "36 polígonos de 10 ha, dois por estrato sobre os 18 estratos de D12, conforme D16. Para cada estrato h, pi_i = n_h / N_h"

O código vigente sorteia **72 polígonos de 5,02 ha, quatro por estrato**, com `pi_i = 4/N_h`. Redação proposta:

> "A UNIDADE DE SORTEIO PRIMÁRIA É O POLÍGONO DE VANT, não o ponto: **72 polígonos de 5,02 ha, quatro por estrato** — dois de treino e dois de held-out — sobre os estratos de D12, conforme D16 emendada. Para cada estrato `h`, `pi_i = 4 / N_h` e `w_i = N_h / 4`, com `pi_i × w_i = 1`, e ambos registrados junto do sorteio. **`N_h` é contagem de CANDIDATOS do estrato, não de hectares: `pi_i` não é peso de área** (ver achado D-02)."

A última frase é acréscimo sugerido, não correção de divergência: ela fecha a confusão de unidade que o achado D-02 descreve. **A decisão de incorporá-la é do pesquisador.**

**A segunda análise propôs redação equivalente**, com a mesma ressalva de que `N_h` é contagem de candidatos e não de hectares. A convergência reforça a proposta, mas não a transforma em decisão: `decisoes.ts` segue intocado em ambas as execuções.

---

## 4. Pendências declaradas

1. **Diário persistente da requisição externa do JEV.** O prompt pedia registro da saída no diário local. `src/lib/seguranca/diarioRequisicoes.ts` existe, mas é orientado a *artefato alvo* com caminho em disco (`criarDiarioRequisicoes(artefatoAlvo)`, `salvarDiarioRequisicoes`). Vinculá-lo a uma rota de requisição única exige decidir **qual artefato** recebe a anotação — decisão de desenho, não de implementação. Implementei registro em log de processo com marca `[A-09][SAIDA-EXTERNA]` e deixo a integração ao diário para decisão.
2. **Regra de coerência classe↔fração (`A-07b`).** Fora de escopo por depender de `G-05` (estado vs evento), como o prompt determina. Hoje é possível gravar `classe = "erosao"` com fração `0,05` — não é mais possível gravar sem fração, que era o defeito que podia produzir dado falso.
3. **Os 2 warnings de lint** permanecem, em arquivos não tocados; escopo de `A-10`.
4. **`npm run lint` via script do projeto** não foi usado por exigir configuração interativa do ESLint do Next na primeira execução; usei `npx next lint --max-warnings 0` diretamente, com a saída registrada na seção 1.

---

## 5. Comandos e resultados

```
npx tsc --noEmit                                  → exit 0
npm test                                          → 93 arquivos | 761 passaram | 3 pulados
npm test src/lib/seguranca/padroesProibidos.test.ts → 34 passaram
npx next lint --max-warnings 0                    → 2 warnings (pré-existentes, A-10)
```

**Arquivos tocados:** 20 (14 de código, 6 de teste), 622 inserções, 346 remoções.

**Verificação dupla.** A segunda execução mediu, de forma independente e no estado consolidado da branch: `typecheck` exit 0, 794 testes passando com 3 pulados, 34 no varredor. Os três números batem com a medição de 03/11 feita aqui. Nenhuma das duas execuções encontrou regressão.

**Fim do relatório.** Nenhuma decisão, parâmetro científico ou norma foi alterado.
