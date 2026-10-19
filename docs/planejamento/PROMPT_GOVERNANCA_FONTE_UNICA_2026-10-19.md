# Prompt do agente executor — Governança e fonte única de parâmetros (2026-10-19)

**Para quem é.** Um agente executor que aplica, em ordem e com portões verificáveis, três medidas de governança destinadas a **estancar o ciclo de ajuste e retroajuste das regras do SAREL**: (1) um `CLAUDE.md` na raiz, para que toda sessão de assistente parta das mesmas regras em vez de redescobri-las; (2) a desambiguação dos limiares de D02 e D10 e a criação de uma **fonte única legível por máquina** para eles; (3) o fechamento das lacunas do varredor de padrões proibidos e a sua execução **bloqueante** em CI e em pre-commit.

**Estado: NÃO EXECUTADO.** Nada aqui foi aplicado ao código.

**Base verificada.** Todos os portões "esperado hoje" deste prompt foram capturados em `6af6dc8` (`sarel/executor-2026-10-09`, 19/10/2026) com `git grep` num worktree limpo. Nenhum teste foi executado pelo redator: o contêiner não tinha `node_modules`. O executor roda a suíte e **cola a saída**.

**Branch de trabalho:** `sarel/executor-2026-10-09` (a mesma em que o pesquisador vem commitando). Um commit **local** por bloco. **Sem push, sem PR, sem tag.**

---

## 1. Por que estes três blocos, e nesta ordem

O diagnóstico que originou este prompt não é "faltam regras". O SAREL tem 9 Regras Invioláveis, 7 Invariantes, um varredor anti-mock com registro de exceções e um registro de decisões com mecanismo *fail-closed*. O retrabalho ocorre **mesmo assim**, por três mecanismos distintos:

| Mecanismo | Evidência em `6af6dc8` |
|---|---|
| A regra existe em prosa, mas nenhuma sessão de assistente a lê automaticamente | Não há `CLAUDE.md` nem `AGENTS.md` na raiz |
| O mesmo conceito tem valor em vários lugares, sem fonte única, e os lugares divergem | `GraficoSerieTemporal.tsx` desenha a linha de "Solo Exposto" em `NDVI < 0.40` **atribuindo-a a D10**, que decidiu `NDVI <= 0.25` |
| A regra escrita é mais larga que a regra aplicada | A regex de `parametro-com-default-numerico` não pega defaults por desestruturação; há 12 no código, 5 deles científicos, numa rota de API |

A ordem importa. **GOV-1** fixa as regras antes de qualquer edição. **GOV-2** desambigua D02 e D10 — é impossível criar fonte única para dois limiares que estão conflados. **GOV-3** só então os unifica. **GOV-5** corrige o varredor **antes** de **GOV-6** torná-lo bloqueante: tornar bloqueante um varredor incompleto produz vermelho no primeiro dia e alguém o desliga, que é exatamente o ciclo que queremos interromper.

---

## 2. Achado que o executor NÃO deve "corrigir"

Durante a redação deste prompt verificou-se que **`NDVI < 0.40` e `NDVI <= 0.25` não são a mesma regra com valores divergentes.** São dois limiares com finalidades diferentes:

- **D02** — `BSI > 0.10 e NDVI < 0.40` — é **critério de triagem de candidatos espectrais e ajuda visual**. A emenda de 06/10/2026, aceita pelo pesquisador, é explícita: estes limiares **não** têm papel na seleção de polígonos nem no alvo do modelo (Regra 4; D16; D26). Leia-se "candidato espectral a erosão", não "Classe 1".
- **D10** — `NDVI <= 0.25` (GEOS3 / Demattê et al., 2018) — é o **limiar de solo descoberto do preditor de frequência Ê**.

Portanto `amostragemBiofisica.ts:38` (`NDVI_MAX: 0.40`) está **correto** por D02. Os módulos que usam `0.25` estão **corretos** por D10.

> **Proibido unificar 0.40 e 0.25.** Quem "alinhar" os dois números altera a triagem amostral ou o preditor Ê sem decisão do pesquisador. O defeito real é de **nomeação e atribuição**, tratado em GOV-2.

---

## 3. Decisões do pesquisador (o executor NÃO as toma)

| ID | Questão | Onde aparece |
|---|---|---|
| **DP-21** | **Contradição D01 × código.** O registro de D01 diz `valor: "(1 - NDVI) / 2"` (Durigon et al., 2014) e o teste afirma essa string. O código calcula `((1 - ndvi) / 2) * (1 + bsiNum)` e declara-se autorizado por `decisoes: ["D01"]`. A híbrida multiplicativa **não é** Durigon: é formulação nova, e precisa de validação própria e de redação na dissertação, ou o registro deve ser emendado para descrevê-la. **Qual das duas é a metodologia?** | GOV-4 |
| **DP-22** | O gráfico temporal deve passar a desenhar **também** a linha de D10 (`NDVI <= 0.25`), além da linha de triagem de D02 (`NDVI < 0.40`), ou apenas uma delas? Duas linhas informam mais e poluem mais. | GOV-2 |
| **DP-23** | `calcularFatorC(ndvi, bsi?)` substitui BSI ausente por `0` (`bsiNum = bsi !== undefined ? bsi : 0`), o que faz a híbrida degenerar na fórmula de Durigon. O invólucro `obterFatorCComProveniencia` **registra** qual modelo foi usado, então a proveniência está preservada; a função crua, não. Manter a substituição silenciosa, ou exigir BSI explícito e recusar o cálculo sem ele? Depende de DP-21. | GOV-4 |
| **DP-24** | `select-candidates/route.ts:188-192` traz `tamanhoAmostra = 50`, `raioThinningKm = 5.0`, `frequenciaSoloNuMin = 0.15`, `declividadeMin = 3.0`, `declividadeMax = 20.0` como defaults silenciosos. `3.0–20.0` parece ser o domínio de D07 e `raioThinningKm` parece colidir com P02 ("1 km herdado do Localizador"). **Cada um desses cinco números corresponde a qual decisão ou parâmetro registrado — e o valor registrado é esse?** O executor apenas inventaria e relata. | GOV-5 |
| **DP-25** | `calcularFatorCVanDerKnijff` retorna `0.0` para `ndvi >= beta` e `1.0` para `ndvi <= 0`. O primeiro é o **limite analítico** correto (o expoente diverge para −∞). O segundo é exato em `ndvi = 0`, mas para `ndvi < 0` a fórmula daria `C > 1` e o código **limita em 1.0** — isto é um teto real, e C ≤ 1 por definição da RUSLE pode justificá-lo. Documentar como limite justificado, ou tratar `ndvi < 0` como fora-do-domínio? | GOV-5 |

Onde a tabela acima não decide, o executor **para e relata**. Não há preenchimento por suposição.

---

## 4. O prompt (copie o bloco inteiro)

```
Você é o EXECUTOR do repositório SAREL v2 (PPGTCA 2026). Trabalhe SOMENTE no que está escrito.
Quando faltar informação, PARE e relate; nunca preencha lacuna com suposição.
Siga a ordem dos blocos, cole a saída de cada comando e não pule portões.

════════════════════════════════════════════════════════════════════════════════════
1. REGRAS INVIOLÁVEIS
════════════════════════════════════════════════════════════════════════════════════
R1.  Faça apenas o que o bloco descreve. Achou outro problema: registre no relatório,
     não conserte.
R2.  Antes de editar um bloco: rode o comando "REPRODUZIR" e cole a saída. Se diferir
     do "esperado hoje", PARE nesse bloco e relate a diferença.
R3.  Reabra cada âncora (arquivo:linha) antes de editar; linhas se deslocam.
R4.  Você NÃO decide metodologia. As decisões do pesquisador estão em DP-21..DP-25.
     Fora delas, PARE e pergunte.
R5.  Nunca escreva "corrigido", "passa" ou "limpo" sem a saída do comando, da MESMA
     sessão.
R6.  Proibido pular, desativar, quarentenar ou apagar teste para obter verde.
R7.  PROIBIDO ALTERAR QUALQUER VALOR NUMÉRICO. Estes blocos são de refatoração
     value-preserving: todo número existente deve terminar idêntico. GOV-3 exige
     uma tabela antes/depois no relatório em que todas as linhas tenham
     valor_antigo == valor_novo. Uma linha divergente invalida o bloco.
R8.  PROIBIDO unificar 0.40 (D02, triagem) com 0.25 (D10, solo nu). São limiares de
     finalidades distintas. Ver seção 2 do documento que acompanha este prompt.
R9.  Em `src/config/decisoes.ts` você pode: (i) ACRESCENTAR o campo estruturado novo
     descrito em GOV-3; (ii) acrescentar comentários. É PROIBIDO reescrever ou apagar
     o texto de `valor`, `justificativa` ou `referencia`, e tocar em `estado`,
     `decididoPor` ou `decididoEm`. Nada passa a "decidida" por sua mão.
R10. Proibido: fazer push, abrir PR, criar tag; reescrever histórico (rebase,
     filter-repo, amend de commit antigo); tocar em `legado/pre_sarel/`; consumir cota
     PlanetScope; criar tarefa no Earth Engine; rodar qualquer coisa com credencial
     real; subir arquivo ao Google Drive.
R11. Um commit LOCAL por bloco, mensagem iniciando pelo ID ("GOV-2: ..."). Antes de
     cada commit: `npm run typecheck` e os testes tocados pelo bloco. Antes do último
     commit: a suíte inteira.
R12. Comandos portáveis para Windows/PowerShell: use `git grep` e `node`, nunca `grep`,
     `sed`, `sha256sum` ou `python3` (use `python`). Cole a saída literal, sem "...".

════════════════════════════════════════════════════════════════════════════════════
2. BLOCO GOV-1 — CLAUDE.md na raiz (nenhuma mudança de comportamento)
════════════════════════════════════════════════════════════════════════════════════
MOTIVO: as 9 Regras e os 7 Invariantes vivem em `docs/design.md`. Nenhuma sessão de
assistente os lê automaticamente, então cada sessão reinterpreta as regras e "corrige"
o que a anterior fez. Este é o motor mais barato de desligar.

REPRODUZIR:
  git ls-files CLAUDE.md AGENTS.md

ESPERADO HOJE: nenhuma linha (os dois arquivos não existem).

AÇÃO: criar `CLAUDE.md` na raiz, com NO MÁXIMO 150 linhas, contendo exatamente:
  a) As 9 Regras Invioláveis, copiadas de `docs/design.md` §1 sem reescrita.
  b) Os 7 Invariantes, copiados de `docs/design.md` §4 sem reescrita.
  c) Seção "Onde vivem os números": tabela com uma linha por grandeza governada por
     decisão, nas colunas [grandeza | decisão | arquivo que é a fonte | como ler].
     Preencha-a a partir do inventário de GOV-3; se GOV-3 ainda não rodou, deixe a
     seção com o texto "A PREENCHER EM GOV-3" e volte a ela no fim.
  d) Seção "Antes de editar": os comandos `npm run typecheck`, `npm test` e a regra de
     que limiar científico não se escreve literal — lê-se do registro de decisões.
  e) Seção "O que você NÃO decide": que mudança de metodologia, promoção de decisão a
     "decidida" e alteração de valor numérico são do pesquisador.

PROIBIDO: inventar regra que não esteja em `docs/design.md`; parafrasear as 9 Regras
ou os 7 Invariantes (copie-os); escrever mais de 150 linhas.

ACEITE: `git ls-files CLAUDE.md` retorna uma linha; `node -e "const t=require('fs').readFileSync('CLAUDE.md','utf8');console.log(t.split('\n').length)"`
retorna <= 150; e as 9 Regras aparecem com a mesma redação de `docs/design.md`
(cole a saída de `git grep -c "Regra" CLAUDE.md`).

════════════════════════════════════════════════════════════════════════════════════
3. BLOCO GOV-2 — desambiguar D02 × D10 e corrigir a atribuição na UI
════════════════════════════════════════════════════════════════════════════════════
MOTIVO: o gráfico temporal desenha a linha de solo exposto em NDVI < 0.40 e a atribui
a D10, que decidiu NDVI <= 0.25. O número é o de D02 (triagem) e o crédito é de D10
(solo nu). É um erro de rótulo visível em tela.

REPRODUZIR:
  git grep -nE "D10|0\.40|0\.25" -- src/components/inspetor/GraficoSerieTemporal.tsx

ESPERADO HOJE (4 linhas):
  src/components/inspetor/GraficoSerieTemporal.tsx:30: *    - NDVI = 0.40 (Solo Exposto / Degradação - Decisão D10)
  src/components/inspetor/GraficoSerieTemporal.tsx:245:            <span>Solo Exposto (NDVI &lt; 0.40 · D10)</span>
  src/components/inspetor/GraficoSerieTemporal.tsx:321:            {/* Linha Biofísica: Limiar de Solo Exposto (NDVI = 0.40 - D10) */}
  src/components/inspetor/GraficoSerieTemporal.tsx:338:                Solo Exposto (NDVI &lt; 0.40 · D10)

AÇÃO:
  a) Nas 4 âncoras, trocar a ATRIBUIÇÃO e o RÓTULO, mantendo o valor 0.40 intacto
     (R7): a linha passa a ler "Candidato espectral (NDVI < 0.40 · D02)" — ou a
     redação equivalente que você justifique no relatório. O crédito a D10 sai.
  b) Em `src/lib/gee/amostragemBiofisica.ts`, a âncora de cabeçalho
     "DECISÕES D02, D10" passa a citar apenas D02 para os limiares de triagem
     (reproduza com: git grep -n "DECISÕES D02, D10" -- src/lib/gee/amostragemBiofisica.ts).
  c) RELATAR, sem editar: `src/lib/gee/persistenciaTemporal.test.ts:9` passa
     `limiarNdviSoloNu: 0.40` a um teste do mecanismo de D10. Se o valor é arbitrário
     para o teste, diga isso; se é o valor de D02 usado por engano num teste de D10,
     diga isso. Não altere o número (R7).
  d) NÃO acrescentar a linha de D10 ao gráfico: isso é DP-22.

ACEITE: `git grep -n "D10" -- src/components/inspetor/GraficoSerieTemporal.tsx` não
retorna nenhuma linha que associe D10 ao valor 0.40; `npm test` verde nos testes de
componentes tocados; nenhum número alterado no diff (cole `git diff --stat` e confirme
que o diff não contém nenhuma linha que troque dígitos).

════════════════════════════════════════════════════════════════════════════════════
4. BLOCO GOV-3 — fonte única legível por máquina (fase 1: limiares biofísicos)
════════════════════════════════════════════════════════════════════════════════════
MOTIVO: o campo `valor` do registro de decisões guarda PROSA. Prosa não alimenta
código e não pode ser comparada ao comportamento, então os números vivem duplicados
e divergem em silêncio. É a causa direta do achado de GOV-2.

ESCOPO DA FASE 1 — exclusivamente os limiares de D02 (bsiMin, ndviMax, bsiMax,
ndviMin) e de D10 (ndviSoloNu). FORA DE ESCOPO nesta fase, e a relatar como dívida:
os parâmetros P* em estado "proposta" (cujos valores só existem na prosa de
`justificativa`) e os cinco defaults de `select-candidates/route.ts` (ver DP-24).

TAMBÉM FORA DE ESCOPO: `limiarNdviDosselFechado: 0.65` (persistenciaTemporal.ts:55,
montagemTemporal.ts:203). Ele tem o MESMO VALOR do `NDVI_MIN: 0.65` do critério de
controle de D02, mas pode ter finalidade própria — "dossel fechado para aferir
recuperação do dossel" não é necessariamente "candidato espectral a controle". O
achado de GOV-2 é precisamente que valores iguais podem ser regras distintas.
NÃO o unifique com D02 por semelhança numérica. Apenas RELATE, em uma linha por
âncora, qual finalidade o código lhe dá, para que o pesquisador decida se é D02 ou
se é um limiar a registrar.

REPRODUZIR:
  git grep -nE "NDVI_MAX: |NDVI_MIN: |BSI_MIN: |BSI_MAX: |limiarNdviSoloNu: |limiarNdviSoloNu = |limiarNdviDosselFechado: " -- src/lib src/app src/store src/config

ESPERADO HOJE (exatamente 11 linhas):
  src/lib/gee/amostragemBiofisica.ts:37:    BSI_MIN: 0.10,
  src/lib/gee/amostragemBiofisica.ts:38:    NDVI_MAX: 0.40,
  src/lib/gee/amostragemBiofisica.ts:43:    BSI_MAX: 0.00,
  src/lib/gee/amostragemBiofisica.ts:44:    NDVI_MIN: 0.65,
  src/lib/gee/persistenciaTemporal.test.ts:9:  limiarNdviSoloNu: 0.40,
  src/lib/gee/persistenciaTemporal.test.ts:10:  limiarNdviDosselFechado: 0.65,
  src/lib/gee/persistenciaTemporal.ts:54:  limiarNdviSoloNu: 0.25,
  src/lib/gee/persistenciaTemporal.ts:55:  limiarNdviDosselFechado: 0.65,
  src/lib/gee/persistenciaTemporal.ts:83:  const limiarNdviSoloNu = opcoes.limiarNdviSoloNu ?? OPCOES_PERSISTENCIA_PADRAO.limiarNdviSoloNu;
  src/lib/matriz/montagemTemporal.ts:110:    limiarNdviSoloNu = 0.25,
  src/lib/matriz/montagemTemporal.ts:203:    limiarNdviDosselFechado: 0.65,

NOTA: a linha 83 de `persistenciaTemporal.ts` coalesce com uma CONSTANTE, não com um
literal: está correta e não é alvo. A linha 9 do arquivo de teste é o item (c) de
GOV-2 e também não é alvo aqui.

AÇÃO:
  a) Em `src/config/decisoes.ts`, ACRESCENTAR (R9: acrescentar, não reescrever) ao
     tipo `Decisao<T>` um campo opcional:

       parametros?: Record<string, {
         valor: number;
         operador: "<" | "<=" | ">" | ">=";
         finalidade: string;   // para que serve ESTE limiar, em uma linha
         unidade?: string;
       }>;

     O OPERADOR É OBRIGATÓRIO. Hoje D10 diz "<=" e `amostragemBiofisica.ts:83` usa
     "<" para o limiar de D02: sem registrar o operador, a divergência volta.

  b) Preencher `parametros` em D02 e D10 com os valores JÁ EXISTENTES no código,
     sem alterar nenhum (R7), e com `finalidade` distinguindo triagem de candidatos
     (D02) de solo descoberto do preditor Ê (D10).

  c) ACRESCENTAR o acessor fail-closed, ao lado de `exigirDecisao`:

       export function exigirParametro(d: Decisao<unknown>, chave: string):
         { valor: number; operador: "<" | "<=" | ">" | ">=" }

     Lança `ErroDecisaoPendente` se `d.estado !== "decidida"`, e um erro novo
     `ErroParametroAusente` se a chave não existir. Nunca retorna default.

  d) Reescrever `CRITERIOS_ESPECTRAIS` (amostragemBiofisica.ts:35-45) e os defaults
     de `persistenciaTemporal.ts:54` e `montagemTemporal.ts:110` para LEREM do
     registro via `exigirParametro`. Os valores resultantes têm de ser idênticos.

  e) Acrescentar um teste novo `src/config/decisoes.parametros.test.ts` que afirme o
     COMPORTAMENTO, não a prosa: para cada limiar registrado, que o módulo que o
     consome classifica na fronteira conforme o operador registrado. É este teste que
     impede a próxima divergência.

  f) Voltar a GOV-1(c) e preencher a tabela "Onde vivem os números".

PROIBIDO: alterar valor (R7); unificar 0.40 e 0.25 (R8); tocar em `valor`/`estado`
do registro (R9); rotear por `exigirParametro` qualquer parâmetro cujo estado não seja
"decidida" — se encontrar um, PARE e relate (é dívida de fase 2, não tarefa sua).

ACEITE (três partes, as três coladas no relatório):
  1. Tabela antes/depois com uma linha por literal movido, colunas
     [arquivo:linha | chave no registro | valor_antigo | valor_novo]. TODAS as linhas
     com valor_antigo == valor_novo.
  2. `npm test` verde na suíte INTEIRA (não só nos arquivos tocados). A suíte já
     cobre amostragem, persistência e montagem temporal: se um número tivesse mudado,
     ela reprovaria. Essa é a prova de que a refatoração preservou valores.
  3. `git grep -nE "NDVI_MAX: 0|NDVI_MIN: 0|BSI_MIN: 0|BSI_MAX: 0" -- src/lib`
     sem nenhuma linha (os literais saíram dos módulos).

════════════════════════════════════════════════════════════════════════════════════
5. BLOCO GOV-4 — contradição D01 × fatorC (SOMENTE RELATAR; nenhuma edição)
════════════════════════════════════════════════════════════════════════════════════
MOTIVO: o registro, o teste e o código afirmam três coisas que não fecham, e a suíte
passa verde porque o teste afirma a STRING do registro enquanto outro teste afirma o
COMPORTAMENTO híbrido. É DP-21 e só o pesquisador decide.

REPRODUZIR:
  git grep -n "valor: \"(1 - NDVI) / 2\"" -- src/config/decisoes.ts
  git grep -n "expect(val).toBe" -- src/config/decisoes.test.ts
  git grep -nE "const c = \(\(1 - ndvi\)" -- src/lib/rusle/fatorC.ts

ESPERADO HOJE (3 linhas):
  src/config/decisoes.ts:35:    valor: "(1 - NDVI) / 2",
  src/config/decisoes.test.ts:9:    expect(val).toBe("(1 - NDVI) / 2");
  src/lib/rusle/fatorC.ts:68:  const c = ((1 - ndvi) / 2) * (1 + bsiNum);

AÇÃO: NENHUMA EDIÇÃO. Escrever no relatório, em uma página:
  a) As três âncoras acima, com as linhas citadas.
  b) Que a híbrida multiplicativa NÃO é Durigon et al. (2014) — o próprio cabeçalho
     de `fatorC.ts` argumenta contra a formulação puramente linear de Durigon — e
     que `obterFatorCComProveniencia` declara `decisoes: ["D01"]` para um cálculo que
     D01 não descreve.
  c) As duas saídas possíveis, sem escolher: emendar D01 para descrever a híbrida
     (e então ela precisa de validação própria e de redação na dissertação), ou
     alinhar o código a Durigon puro (e então a justificativa do paradoxo do SPD no
     cabeçalho de `fatorC.ts` perde objeto).
  d) DP-23 e DP-25 como consequências que dependem de DP-21.

ACEITE: o relatório contém a seção; `git diff` deste bloco está VAZIO.

════════════════════════════════════════════════════════════════════════════════════
6. BLOCO GOV-5 — fechar as lacunas do varredor de padrões proibidos
════════════════════════════════════════════════════════════════════════════════════
MOTIVO: a Regra 1 proíbe parâmetro numérico com default. A regex só pega a forma
`: number = 123` e não pega a forma por desestruturação, então há 12 defaults vivos,
5 deles científicos numa rota de API, com a suíte verde.

REPRODUZIR:
  git grep -nE "^\s+[a-zA-Z][a-zA-Z0-9]*\s*=\s*[0-9]+(\.[0-9]+)?,?\s*$" -- "src/**/*.ts"

ESPERADO HOJE (12 linhas, das quais as 5 primeiras são científicas):
  src/app/api/gee/select-candidates/route.ts:188:      tamanhoAmostra = 50,
  src/app/api/gee/select-candidates/route.ts:189:      raioThinningKm = 5.0,
  src/app/api/gee/select-candidates/route.ts:190:      frequenciaSoloNuMin = 0.15,
  src/app/api/gee/select-candidates/route.ts:191:      declividadeMin = 3.0,
  src/app/api/gee/select-candidates/route.ts:192:      declividadeMax = 20.0,
  src/lib/drone/planoVooNControl.ts:545:    turnAroundDistanceMeters = 10,
  src/lib/drone/planoVooNControl.ts:550:    entryLocation = 0,
  src/lib/drone/planoVooNControl.ts:553:    startDoJumpId = 2,
  src/lib/gee/estatisticasSerie.ts:57:  nMinimo = 3
  src/lib/matriz/montagemTemporal.ts:108:    intervaloGuardaMeses = 24,
  src/lib/matriz/montagemTemporal.ts:109:    duracaoJanelaAnos = 3,
  src/lib/matriz/montagemTemporal.ts:110:    limiarNdviSoloNu = 0.25,

AÇÃO:
  a) Acrescentar ao `REGEX_PADROES` o padrão `default-numerico-desestruturacao`,
     que pegue a forma acima.
  b) Classificar CADA uma das 12 ocorrências em exatamente uma destas três, e colar
     a classificação no relatório:
       (i)   CIENTÍFICO E JÁ REGISTRADO -> rotear por `exigirParametro` (GOV-3);
       (ii)  CIENTÍFICO E NÃO REGISTRADO -> NÃO corrigir. Inventariar em DP-24 e
             PARAR nesse item: criar registro é decisão do pesquisador;
       (iii) APRESENTAÇÃO OU PROTOCOLO (ex.: `startDoJumpId`, `entryLocation`, campos
             do formato .plan do NControl) -> acrescentar entrada ao registro de
             exceções existente, imitando a forma de `EXC-UI-MAPVIEWER-ZOOM`, com
             `id`, `arquivo`, `trecho`, `justificativa`, `autorizadoPor:
             "GOV-5 / 2026-10-19"` e `padrao`.
     Na dúvida entre (ii) e (iii), classifique como (ii) e pare. Errar para o lado de
     parar é barato; errar para o lado de conceder exceção a um valor científico
     reabre exatamente o buraco que este bloco fecha.
  c) PRECISÃO ACIMA DE COBERTURA. Não acrescente um padrão para ternário com literal
     numérico: `bsi !== undefined ? bsi : 0` é alvo legítimo, mas uma regex genérica
     de ternário produz falso-positivo em massa na UI, e guarda ruidosa é guarda
     desligada. Registre no relatório, como dívida declarada, o que você
     deliberadamente NÃO detecta — incluindo esse ternário (DP-23) e os retornos
     constantes de `calcularFatorCVanDerKnijff` (DP-25).
  d) Os meta-testes que já existem ("confirma que o detector NÃO é vacuoso") devem
     ganhar um caso para o padrão novo: um trecho que ele PEGA e um que ele
     legitimamente ignora.

PROIBIDO: conceder exceção a limiar científico para obter verde; alterar valor (R7);
decidir a que decisão pertence um número não registrado (R4, DP-24).

ACEITE: o padrão novo existe e tem meta-teste; as 12 ocorrências estão classificadas
no relatório; `npm test` verde; a dívida declarada está escrita.

════════════════════════════════════════════════════════════════════════════════════
7. BLOCO GOV-6 — tornar as guardas bloqueantes (CI + pre-commit)
════════════════════════════════════════════════════════════════════════════════════
MOTIVO: hoje as guardas só existem se alguém digitar `npm test`. Enquanto a violação
é descoberta por auditoria semanas depois, o ciclo ajuste/retroajuste continua. Este
bloco move a detecção para o instante da violação. Rode-o DEPOIS de GOV-5: CI
bloqueante com varredor incompleto fica vermelho e é desligado.

REPRODUZIR:
  git ls-files .github
  git ls-files .husky .pre-commit-config.yaml

ESPERADO HOJE: nenhuma linha em nenhum dos dois.

AÇÃO:
  a) Criar `.github/workflows/guardas_cientificas.yml`, disparado em `push` e
     `pull_request`, com um job único em `ubuntu-latest`, Node na versão de
     `package.json` (se não houver `engines`, relate e use a LTS corrente), passos:
     `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`.
  b) O job NÃO pode depender de `data/`, de credencial, de rede para GEE/Planet/
     Embrapa nem de cota. Se a suíte inteira não passar sem `data/`, NÃO contorne:
     relate exatamente quais testes falham sem `data/` e configure o job para rodar a
     suíte EXCLUINDO esses arquivos, listando-os nominalmente no YAML com um
     comentário que diga por que cada um está fora. Nunca use `continue-on-error`
     nem `|| true`.
  c) Criar o hook de pre-commit. Escolha husky OU `.pre-commit-config.yaml`, não os
     dois, e justifique: o repositório é Node, o pesquisador trabalha em Windows, e
     o hook tem de rodar no PowerShell. O hook roda `npm run typecheck` e SOMENTE o
     arquivo de teste do varredor (`padroesProibidos`), não a suíte inteira — um
     pre-commit lento é um pre-commit contornado com `--no-verify`.
  d) Documentar os dois em `CLAUDE.md`, seção "Antes de editar".

PROIBIDO: `continue-on-error`, `|| true`, `--no-verify` em exemplo documentado;
colocar credencial, ID de projeto GEE ou segredo no YAML; tornar o job verde
excluindo o teste do varredor.

ACEITE: cole o YAML inteiro; cole a saída de `npm run typecheck` e `npm test` locais;
declare explicitamente se a suíte precisou de exclusão por ausência de `data/` e
qual. Como não há push (R10), o CI não vai rodar: o aceite aqui é o YAML revisável
e a suíte local verde.

════════════════════════════════════════════════════════════════════════════════════
8. RELATÓRIO FINAL
════════════════════════════════════════════════════════════════════════════════════
Escreva `docs/planejamento/RELATO_GOVERNANCA_FONTE_UNICA_2026-10-19.md` com:
  - Um bloco por GOV-*, com a saída REPRODUZIR colada, o que foi feito e o aceite.
  - A tabela antes/depois de GOV-3, completa.
  - A classificação das 12 ocorrências de GOV-5.
  - A seção DP-21 de GOV-4.
  - A dívida declarada: o que o varredor deliberadamente não detecta; os parâmetros
    P* em "proposta" cujos valores seguem só em prosa; os cinco defaults de
    `select-candidates` pendentes de DP-24.
  - A lista dos commits locais criados (`git log --oneline` do intervalo).
  - Qualquer bloco em que você PAROU, e por quê.

Se algum portão "esperado hoje" divergiu, o relatório começa por isso.
```

---

## 5. Antes de entregar este arquivo ao executor

1. Decida **DP-21** (Fator C). GOV-4 só relata, mas GOV-3 toca `decisoes.ts` e `fatorC.ts` está na mesma vizinhança: é melhor o executor saber a resposta antes, ou aceitar que GOV-4 fique aberto.
2. Decida **DP-22** (segunda linha no gráfico). Sem ela, GOV-2 corrige o rótulo e deixa o gráfico sem a linha de D10 — o que é o estado de hoje, só com o crédito certo.
3. Confirme que o `HEAD` da sua `sarel/executor-2026-10-09` é `6af6dc8` ou descendente. Se houve commit novo, os números de linha das âncoras mudaram: a regra R3 cobre isso, mas os "esperado hoje" de GOV-2, GOV-4 e GOV-5 podem precisar de recaptura.
4. GOV-3 é a **fase 1**. Os parâmetros em estado "proposta" continuam com valor só na prosa de `justificativa`, e rotear um deles por `exigirParametro` quebraria o aplicativo, porque o acessor é fail-closed e eles não são "decidida". Promovê-los é ato seu, não do executor — é a fase 2 natural deste trabalho.
