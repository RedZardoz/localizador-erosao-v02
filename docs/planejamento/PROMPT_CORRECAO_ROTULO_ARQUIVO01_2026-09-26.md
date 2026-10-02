# Prompt de Correção — Fabricação do Alvo Supervisionado no Arquivo 01 e Endurecimento da Validação Cruzada Espacial

**Sistema de Amostragem e Rotulagem para Erosão Laminar (SAREL)** — PPGTCA 2026
**Versão:** 26/09/2026
**Branch de trabalho:** `sarel/v2`
**Parte anterior desta sequência:** `docs/planejamento/PROMPT_CORRECAO_FABRICACAO_RUSLE_2026-09-26.md` (commits `53693a8`, `2774932`, `46bf35f`, concluídos e verificados)
**Governa:** `docs/design.md` (9 Regras Invioláveis, Invariantes 1 e 2)
**Natureza:** correção de conformidade com a **Regra 4** (Nada Calculado Vira Rótulo) e a **Regra 1**. O prompt anterior tratou de fabricação em preditores ($X$); este trata de fabricação no **alvo supervisionado ($y$)**, que é mais grave. **Não altera física, não toma decisão metodológica, não destrava decisão pendente.**

---

> ## Como usar
>
> Abra uma sessão nova do agente na raiz do repositório `geolocalizacao-erosao-propriedade` e cole o bloco abaixo como primeira mensagem.
>
> ```
> Execute docs/planejamento/PROMPT_CORRECAO_ROTULO_ARQUIVO01_2026-09-26.md.
>
> Leia o arquivo inteiro antes de qualquer ação, começando pela PARTE 0
> (Postura de Execução), e leia também docs/design.md (Regras 1 a 9 e
> Invariantes 1 e 2).
>
> Antes de editar qualquer arquivo:
> 1. reproduza os achados da PARTE I e cole a evidência bruta de cada um
>    (trecho com número de linha real, e a saída dos comandos);
> 2. se algum achado não se reproduzir exatamente como descrito, PARE e me
>    informe a divergência — não prossiga por suposição;
> 3. responda a QUESTÃO ABERTA Q1 da PARTE I com sua recomendação e aguarde
>    minha decisão, porque ela muda a assinatura de duas funções públicas;
> 4. declare o escopo que vai tocar, arquivo por arquivo, e aguarde minha
>    autorização.
> ```

---

# PARTE 0 — POSTURA DE EXECUÇÃO

Esta seção é um contrato permanente de conduta, não uma crítica. A execução anterior foi correta e completa no que lhe foi pedido; os dez itens abaixo tornam explícito o que ali funcionou por iniciativa própria e o que ficou implícito, para que nenhuma execução futura dependa de sorte. Aplicam-se a esta e a toda tarefa seguinte neste repositório.

1. **Não herde o escopo da ferramenta que você está auditando.** O varredor de padrões proibidos lê apenas `src/lib`; isso é o **objeto** da auditoria, não a definição do seu escopo de busca. Ao procurar um padrão, varra `src` inteiro e `scripts/`, incluindo `.tsx`, antes de declarar cobertura. Na execução anterior, uma ocorrência em `.tsx` só apareceu porque o pesquisador varreu por fora.

2. **Procure a implementação correta antes de escrever uma nova.** Quando um comportamento está errado num lugar, verifique se o repositório já tem a versão certa e **convirja para ela**. Duplicata divergente é exatamente a causa deste prompt: o alvo supervisionado é calculado de duas formas diferentes em dois arquivos, e a versão errada é a que vai para a banca.

3. **Toda correção declara o novo modo de falha que ela introduz.** Trocar degradação silenciosa por `[ABORTO]` é ganho de honestidade e, ao mesmo tempo, cria a possibilidade de um único registro inválido derrubar a corrida inteira. Quando duas saídas são igualmente honestas, prefira a **falha proporcional** — descartar o registro com contagem declarada — à falha total; e diga no relatório qual modo de falha você criou.

4. **Quando a correção piora um número, entregue o número.** Retirar cinco preditores fabricados fez o Arquivo 05 cair de 8 para 3 preditores. Isso não é regressão, é honestidade — mas o pesquisador precisa do valor novo, com as casas decimais, não da constatação qualitativa de que "vai cair".

5. **Citação literal, nunca paráfrase**, em qualquer registro que possa ser citado em defesa de dissertação: nomes de variável reais, linha real, texto real. Reescrever `medS2` como `medicaoS2` num documento da Regra 8 compromete o valor probatório do documento.

6. **Registre o achado incidental no instante em que o vê.** Mantenha, desde o primeiro minuto, um bloco de achados incidentais com âncora `arquivo:linha` que cresce durante a execução, e transcreva-o no relatório final. Não confie na memória ao final da tarefa: é assim que erro se acumula silenciosamente entre execuções.

7. **Quando duas leituras plausíveis levam a resultados diferentes, pergunte antes de agir** — e, enquanto espera, execute tudo o que não depende da resposta. Dúvida local não justifica bloquear a tarefa inteira, e também não autoriza escolher por conta própria.

8. **Não afirme conclusão sem o artefato.** "Criado integralmente conforme a especificação" não é verificação: verificação é colar o conteúdo, ou o `ls -l` com as seções e o trecho decisivo. Vale igualmente para teste, build e contagem.

9. **Prefira tornar o defeito visível a torná-lo ausente.** Falhar alto e cedo é sempre preferível a preencher, imputar, rotular por omissão ou arredondar. Se o dado não existe, o sistema diz que não existe.

10. **Mudança de assinatura ou de contrato público é decisão declarada, não improviso.** Proponha, liste os chamadores afetados, aguarde autorização. Esta tarefa contém uma dessas mudanças (Q1).

---

# PARTE I — DIAGNÓSTICO VERIFICADO

Confirmado por leitura direta do código em 26/09/2026, após os commits `53693a8`, `2774932` e `46bf35f`. **Reproduza cada item antes de corrigir**; se a linha não corresponder, pare e reporte.

## Achado A — O Arquivo 01 fabrica o alvo supervisionado $y$

**Arquivo:** `src/lib/export/pacoteReprodutibilidade.ts`, linhas 184-185 e 219-220, dentro de `gerarCsvMatrizTreinamento`.

```ts
184:    const classeStr = String(p.rotulo?.final?.classe ?? "ausente").toLowerCase();
185:    const classeBinaria = classeStr.includes("laminar") || classeStr.includes("erosao") || classeStr === "1" ? 1 : 0;
...
219:      Rotulo_Classe: p.rotulo?.final?.classe ?? "ausente",
220:      Rotulo_Modalidade: p.rotulo?.final?.modalidade ?? "campo",
```

O Python do Arquivo 05 consome isso diretamente: `y = df["Classe_Alvo_Binaria"].astype(int)`.

São **cinco defeitos distintos** na mesma expressão. Trate os cinco.

### A1 — Ausência de observação humana vira controle confirmado

`p.rotulo?.final?.classe ?? "ausente"` produz `"ausente"`, que não casa com nenhum termo da linha 185, resultando em `Classe_Alvo_Binaria = 0`. Um ponto **nunca observado** entra na matriz como negativo confirmado.

Isto viola a Regra 4 na sua formulação literal (`docs/design.md:17`): *"O rótulo da erosão provém unicamente da observação primária humana."* Aqui um operador `??` produz rótulo.

### A2 — A modalidade da observação é afirmada por omissão

`p.rotulo?.final?.modalidade ?? "campo"` declara que a observação foi **presencial de campo** quando não houve observação alguma. Afirmação de fato sobre procedência de dado inexistente.

### A3 — Binarização divergente da canônica, gerando falso negativo

A linha 185 reconhece apenas `"laminar"`, `"erosao"` e `"1"`. A implementação canônica em `src/lib/matriz/montagem.ts:139-148` reconhece mais:

```ts
139:    const rotuloNorm = rotulo.classe.trim().toLowerCase();
141:      rotuloNorm.includes("erosao") ||
142:      rotuloNorm.includes("erosão") ||
143:      rotuloNorm === "presente" ||
144:      rotuloNorm === "incipiente" ||
145:      rotuloNorm === "moderada" ||
146:      rotuloNorm === "severa" ||
147:      rotuloNorm === "1";
148:    const classeAlvoBinaria: 0 | 1 = ehErosao ? 1 : 0;
```

Consequência: um ponto com erosão **observada em campo** e registrada como `"severa"`, `"moderada"`, `"incipiente"`, `"presente"` ou `"erosão"` (com acento) sai do Arquivo 01 como `Classe_Alvo_Binaria = 0`. Falso negativo sobre observação humana válida — pior que dado ausente, porque contradiz o observador.

### A4 — Ausência da guarda de segregação do padrão-ouro

`montagem.ts:202` chama `assegurarSegregacaoTreino(rotulo.modalidade)`, definida em `src/lib/rotulos/ingestaoDrone.ts:119-125`, que lança exceção para a modalidade `"drone"`:

```ts
119: export function assegurarSegregacaoTreino(modalidade: string): void {
120:   if (modalidade === "drone") {
121:     throw new Error(
122:       "VIOLAÇÃO DA LEI FUNDAMENTAL (Regra 4 e §12.1): Observações da modalidade 'drone' são estritamente 'held-out' e nunca podem integrar a matriz de treino."
123:     );
124:   }
125: }
```

`gerarCsvMatrizTreinamento` **não tem essa guarda**. Um ponto rotulado por ortomosaico de drone pode entrar no Arquivo 01, quebrando o isolamento *held-out* dos 4 sítios do VANT Spectral 2 (Decisão D16) e contaminando a validação independente.

### A5 — Duas fontes de verdade para o rótulo

`montagem.ts:110` lê o rótulo do registro consolidado: `const rotuloCons = rotulosConsolidados[ponto.codigo];`
`pacoteReprodutibilidade.ts:184` lê do próprio ponto: `p.rotulo?.final`.

São duas origens distintas que podem divergir. Ver **Q1**.

### Ausência de registro de exclusão

`montagem.ts:112` e `:117` excluem explicitamente, com motivo registrado, o ponto sem rotulagem e o ponto com divergência entre observadores não desempatada (`final: null`):

```ts
112:    if (!rotuloCons) {
         exclusoes.push({ codigo: ponto.codigo, motivo: "Ponto sem rotulagem." });
         continue;
117:    if (rotuloCons.divergencia === "pendente" || !rotuloCons.final) {
         exclusoes.push({ codigo: ..., motivo: "Divergência entre observadores sem desempate (final: null)." });
         continue;
```

`gerarCsvMatrizTreinamento` não exclui ninguém: emite todos os pontos recebidos, rotulados ou não.

### Alcançabilidade — não é caso hipotético

`src/components/export/ExportModal.tsx:95` chama `gerarPacoteReprodutibilidadeZip(pontosVisiveis)`. O filtro de visibilidade em `src/store/useSarelStore.ts:581` seleciona por estrato, bloco, bacia, ordem de solo e declividade — **nunca por rótulo**. Com a campanha de campo ainda não realizada, o Arquivo 01 é emitido hoje como uma matriz de negativos manufaturados a partir de ausência de observação.

A prova está na saída que a execução anterior gerou: a linha de dados termina em `...,ausente,campo,0`.

**Este defeito é anterior aos três commits de hoje** — não é regressão introduzida por eles.

## Achado B — A validação cruzada espacial quebra com um único bloco

**Arquivo:** `src/lib/export/pacoteReprodutibilidade.ts`, linha 633.

```python
gkf = GroupKFold(n_splits=min(3, len(set(grupos))))
```

Com todos os pontos num mesmo bloco espacial, `len(set(grupos)) == 1`, logo `n_splits = 1`, e o `GroupKFold` do scikit-learn exige `n_splits >= 2`: o script levanta exceção em vez de relatar a insuficiência. A guarda introduzida na linha 617 verifica célula vazia, não quantidade de grupos distintos.

## Refinamento C — A guarda de `Bloco_Espacial` é tudo-ou-nada

**Arquivo:** `src/lib/export/pacoteReprodutibilidade.ts`, linhas 617-620.

A condição usa `.isna().any()` e `(... == "").any()`. Um único ponto sem bloco espacial, entre 124, aborta a auditoria inteira. Cumpre a instrução do prompt anterior, mas é falha total onde cabe falha proporcional — ver **Postura 3**.

## Q1 — QUESTÃO ABERTA (responder antes de executar)

Qual é a fonte autoritativa do rótulo para o Arquivo 01: `rotulosConsolidados` do store (como em `montagem.ts:110`) ou `ponto.rotulo.final` embutido no ponto?

Isso importa porque a correção recomendada é **reutilizar `montarMatrizTreino`** em vez de duplicar sua lógica, e essa função tem a assinatura (`montagem.ts:93`):

```ts
export function montarMatrizTreino(
  pontos: PontoAmostral[],
  rotulosConsolidados: Record<string, RotuloConsolidado>,
  opcoes: OpcoesMontagemMatriz
): ResultadoMontagemMatriz
```

Hoje `gerarCsvMatrizTreinamento(pontos)` e `gerarPacoteReprodutibilidadeZip(pontos)` não recebem `rotulosConsolidados`. Reutilizar exige acrescentá-lo às duas assinaturas e passá-lo em `ExportModal.tsx:95`, o que é viável: o modal já usa `useSarelStore()` na linha 28, e `src/components/matriz/PainelMatrizTreino.tsx:21` demonstra o padrão de chamada correto.

**Apresente sua recomendação com os chamadores afetados e aguarde a decisão do pesquisador.** Não escolha por conta própria (Postura 10).

---

# PARTE II — TAREFAS AUTORIZADAS

Ordem obrigatória. Não inicie uma tarefa antes de a anterior passar em seu critério de aceite. **T1 depende da resposta a Q1.**

## T1 — Convergir o alvo supervisionado do Arquivo 01 para a implementação canônica

Objetivo: o Arquivo 01 deve derivar `Classe_Alvo_Binaria`, `Rotulo_Classe` e `Rotulo_Modalidade` **exatamente** como `montarMatrizTreino`, sem defaults e sem regra própria.

Requisitos, na ordem de preferência:

1. **Preferência forte: reutilizar `montarMatrizTreino`** (`src/lib/matriz/montagem.ts:93`) para obter classe, modalidade, alvo binário e lista de exclusões, em vez de recalcular. Duplicata divergente é o defeito que estamos corrigindo; não crie uma segunda.
2. Se a reutilização integral for inviável por alguma razão técnica que você demonstre, então: extrair a binarização de `montagem.ts:139-148` para função única exportada, e **ambos** os chamadores passam a usá-la. Nunca duas cópias.

Comportamento obrigatório, qualquer que seja o caminho:

- **Ponto sem rótulo consolidado é excluído do Arquivo 01**, com o motivo registrado — nunca emitido com `Classe_Alvo_Binaria = 0`.
- **Ponto com divergência entre observadores sem desempate (`final: null`) é excluído**, com motivo registrado, como em `montagem.ts:117`.
- **Nenhum default para `Rotulo_Modalidade`.** Se não há modalidade, o ponto não está na matriz.
- **A guarda `assegurarSegregacaoTreino`** (`ingestaoDrone.ts:119`) é aplicada a todo ponto que entre no Arquivo 01.
- **O censo de proveniência do cabeçalho passa a declarar as exclusões**, no idioma já implementado por `formatarLinhaCensoProveniencia`, por exemplo:

```
# EXCLUSOES DE ROTULAGEM (Regra 4) — 124 pontos recebidos, 31 emitidos
# sem rotulagem=88 | divergencia sem desempate=5
# Classe_Alvo_Binaria: 31/31 derivadas de observacao humana | erosao=14 | controle=17
```

Contagens computadas dos dados, zero literais no código.

- Se **nenhum** ponto tiver rótulo, o Arquivo 01 é emitido apenas com cabeçalho e censo, sem linha de dados, e o Arquivo 05 aborta com mensagem explícita. Matriz de treino vazia é o estado correto de uma campanha não realizada.

### Aceite de T1

- `grep -nE 'rotulo\?\.final\?\.(classe|modalidade)\s*\?\?' src/lib/export/pacoteReprodutibilidade.ts` → zero linhas.
- Teste novo: ponto **sem** `rotulo` não aparece em nenhuma linha de dados do CSV, e o censo registra a exclusão.
- Teste novo: ponto com `rotulo.final.classe = "severa"` emite `Classe_Alvo_Binaria = 1` (prova de A3 corrigido).
- Teste novo: ponto com `rotulo.final.modalidade = "drone"` faz a geração lançar a exceção de `assegurarSegregacaoTreino` (prova de A4 corrigido).
- `npx vitest run` inteiro em verde; os 10 testes de `pacoteReprodutibilidade.test.ts` preservados ou ajustados sem afrouxar asserção.

## T2 — Endurecer a validação cruzada espacial (Achado B)

No Python do Arquivo 05, antes de instanciar o `GroupKFold`:

1. Calcular `n_grupos = len(set(grupos))`.
2. Se `n_grupos < 2`, abortar com mensagem explícita, informando `n_grupos` e por que a validação cruzada espacial é impossível — nunca instanciar `GroupKFold` com `n_splits < 2`.
3. Usar `n_splits = min(3, n_grupos)` apenas depois dessa verificação, e imprimir o número de dobras efetivas junto com a contagem de pontos por bloco.

Referência metodológica para a mensagem: validação cruzada por blocos espaciais exige grupos independentes para estimar erro sem inflação por autocorrelação espacial (Roberts et al., 2017).

### Aceite de T2

- `grep -n 'GroupKFold' src/lib/export/pacoteReprodutibilidade.ts` mostra a instanciação **depois** da verificação de `n_grupos`.
- O script imprime o número de dobras e a distribuição de pontos por bloco antes de ajustar.

## T3 — Falha proporcional na guarda de `Bloco_Espacial` (Refinamento C)

Substituir a condição tudo-ou-nada das linhas 617-620 por:

1. Identificar as linhas com `Bloco_Espacial` ausente ou vazio, **descartá-las** e imprimir a contagem: `[DESCARTE] 3/124 pontos sem bloco espacial atribuído — excluídos da validação cruzada espacial.`
2. Abortar apenas se, após o descarte, `n_grupos < 2` (converge com T2) ou se não restarem amostras suficientes para as dobras.
3. Nunca agrupar os descartados num bloco sintético comum.

### Aceite de T3

- Um ponto sem bloco reduz a amostra com contagem declarada; não derruba a execução.
- Zero pontos com bloco válido continua abortando, com mensagem.

## T4 — Evidência de verificação (Regra 8)

Criar `docs/verificacoes/2026-09-26_fabricacao_alvo_supervisionado_arquivo01.md`, no formato de `docs/verificacoes/2026-09-10_distorcao_projecao_declividade.md`, com:

1. Os trechos originais das linhas 184-185 e 219-220, **citados literalmente** (Postura 5).
2. A tabela comparativa entre a binarização de `pacoteReprodutibilidade.ts:185` e a de `montagem.ts:139-148`, listando cada rótulo aceito por uma e não pela outra, e o efeito em $y$.
3. Demonstração do caso de falso negativo de A3: rótulo `"severa"` observado em campo produzindo `Classe_Alvo_Binaria = 0` no estado anterior.
4. Demonstração de A1: contagem, sobre o conjunto de pontos atual do repositório, de quantos pontos eram emitidos com `y = 0` sem nenhuma observação humana.
5. Fundamentação de A4: por que a modalidade `drone` é *held-out* (Decisão D16, `src/config/decisoes.ts:163`) e o que a ausência da guarda permitia.
6. Saída literal do `vitest` antes e depois.
7. Declaração de que D13 e D15 permanecem `pendente` e que nenhum valor de R, LS ou A foi produzido.

## T5 — Commits

Um commit para T1, um para T2 e T3 em conjunto (ambos tocam a mesma guarda), um para T4. Mensagens em português, imperativo, escopo entre parênteses, corpo nomeando a regra restaurada.

Sugestão para T1:

```
fix(reprodutibilidade): deriva alvo supervisionado do Arquivo 01 da rotulagem humana canonica e exclui ponto sem rotulo (Regra 4)
```

Cada mensagem termina com a identificação do **executor real** — o nome e a versão do agente que de fato escreveu o código:

```
Co-Authored-By: <nome e versão do agente executor> <identificador>
```

**Proibido assinar com a identidade de outro agente.** Em particular, não use `Claude Opus 5`: esse identificador pertence ao agente de auditoria e especificação desta sequência, que não escreve o código das fases. Atribuir a ele trabalho que você executou corrompe o registro de proveniência que o pesquisador declarará academicamente. Use sempre a sua identidade, de forma idêntica em todos os seus commits — por exemplo `Co-Authored-By: Antigravity (Advanced Agentic Pair Programmer) <noreply@antigravity>`.

Sem `push`, sem tag, sem PR sem autorização explícita.

---

# PARTE III — PROIBIÇÕES ABSOLUTAS

## P1 — `montagem.ts` e `ingestaoDrone.ts` são a referência, não o alvo

Não altere `src/lib/matriz/montagem.ts` nem `src/lib/rotulos/ingestaoDrone.ts` para acomodar o Arquivo 01. A convergência é na direção deles. Se você identificar defeito **neles**, registre no bloco de achados incidentais e **pare para consultar** — não corrija por iniciativa própria, porque eles governam a matriz de treino real.

## P2 — Não relaxar a binarização canônica

Proibido remover termos de `montagem.ts:141-147` para "igualar" as duas implementações. A convergência é para a regra **mais completa**. Se você julgar que algum termo ali está errado, isso é decisão metodológica do pesquisador.

## P3 — Não inferir a fonte autoritativa do rótulo

Q1 é decidida pelo pesquisador. Proibido escolher entre `rotulosConsolidados` e `ponto.rotulo.final` por conta própria, e proibido ler de ambos com fallback de um para o outro — fallback entre fontes de verdade é fabricação de procedência.

## P4 — Fator R, Fator LS e Perda de Solo A permanecem retidos

`D13` e `D15` seguem `pendente` em `src/config/decisoes.ts:139` e `:156`. Não alterar `src/lib/rusle/linhaDeBase.ts`, `fatorC.ts`, `fatorK.ts` nem `rusle.test.ts`. Continuam válidas, na íntegra, as proibições P1, P2 e P3 do prompt anterior, inclusive a rejeição de `R` por latitude/longitude/elevação e de `LS` por rampa fixa de 30 m.

## P5 — Não alterar as listas de permissão de exportação

`src/lib/matriz/perfis.ts` materializa o Invariante 2. Nenhuma coluna acrescentada ou removida de qualquer perfil.

## P6 — Não executar os achados colaterais já registrados

Ficam registrados e **não executados** nesta tarefa:

- o achado P5 do prompt anterior (Arquivo 01 declara lista própria de colunas em vez de consumir `obterColunasPermitidas("matriz-treino")`, e carrega coordenada);
- o escopo restrito do varredor (`padroesProibidos.test.ts:168` tem raiz em `src/lib` e ignora `.tsx`, deixando `src/app`, `src/components`, `src/config` e `src/store` sem guarda);
- a fabricação por ternário em `src/app/api/gee/select-candidates/route.ts:458-462` (`frequenciaSoloNu = 0` e `nivelK = 1` entrando na estratificação dos 18 estratos, D12).

Reafirme os três no relatório final, sem tocá-los.

## P7 — Não tocar em SAREL 1 e em legado

Nada em `legado/`, `docs/legado/` ou dados de SAREL 1 (Regra 9).

## P8 — Nenhuma asserção sem prova

Regra 8 e Postura 8. Nada declarado verificado sem o artefato; nenhum teste relatado verde sem a saída colada.

---

# PARTE IV — RELATÓRIO FINAL EXIGIDO

1. **Reprodução dos achados A (A1 a A5), B e C** — evidência bruta com linha real, antes de qualquer edição.
2. **Resposta a Q1** conforme decidido, e a lista final de chamadores alterados.
3. **Diff completo** por arquivo tocado.
4. **Saída literal** de `npx vitest run`, `npx tsc --noEmit` e `npm run build`.
5. **Prova de A1, A3 e A4 corrigidos** — o CSV gerado em cada um dos três cenários de teste, colado.
6. **Números concretos** (Postura 4): pontos recebidos, pontos emitidos, exclusões por motivo, e a distribuição de `Classe_Alvo_Binaria` antes e depois da correção.
7. **Novos modos de falha introduzidos** (Postura 3), um por correção.
8. **Bloco de achados incidentais** acumulado durante a execução (Postura 6), com âncora `arquivo:linha`, mesmo para o que parecer menor.
9. **Reafirmação dos três achados de P6**, não executados.
10. **Declaração explícita** de que D13 e D15 permanecem `pendente` e que nenhum valor de R, LS ou A foi produzido.
11. **Lista do que não foi feito** e por qual proibição.

Relato de conclusão parcial é aceitável, com o que ficou e por quê. Relato de conclusão inexistente não é.

---

## Referências normativas do sistema

- **Regras 1 a 9 e Invariantes 1 e 2:** `docs/design.md:14-22` e `:73-74`
- **Regra 4 (rótulo apenas de observação humana):** `docs/design.md:17`
- **Implementação canônica da matriz de treino:** `src/lib/matriz/montagem.ts:93-234` (`montarMatrizTreino`)
- **Guarda de segregação do padrão-ouro:** `src/lib/rotulos/ingestaoDrone.ts:119-125`
- **Decisão D16 (VANT Spectral 2 como held-out):** `src/config/decisoes.ts:163`
- **Prompt da etapa anterior:** `docs/planejamento/PROMPT_CORRECAO_FABRICACAO_RUSLE_2026-09-26.md`

## Referências científicas citadas neste prompt

- Chen, T. & Guestrin, C. (2016). XGBoost: A Scalable Tree Boosting System. *Proceedings of KDD 2016*, 785-794.
- Roberts, D. R. et al. (2017). Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure. *Ecography*, 40(8), 913-929.
- Gebru, T. et al. (2021). Datasheets for Datasets. *Communications of the ACM*, 64(12), 86-92.
- Wilkinson, M. D. et al. (2016). The FAIR Guiding Principles for scientific data management and stewardship. *Scientific Data*, 3, 160018.
