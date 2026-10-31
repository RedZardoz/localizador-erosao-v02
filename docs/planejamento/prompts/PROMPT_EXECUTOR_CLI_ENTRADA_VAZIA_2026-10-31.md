# Tarefa: o verificador de pool fabrica um achado quando a entrada não tem candidatos

**Origem:** verificação do commit `c8346dd`, feita em 31/10/2026.

O commit anterior está **correto e não deve ser desfeito**. Confirmei por execução:

- os três argumentos obrigatórios voltaram, sem default cravado, e o CLI aborta de verdade (`exit code 1`);
- Cochran e Kish foram marcadas como **não conferidas no primário**, com a nota rebatizada para "Síntese Bibliográfica Não Conferida no Primário" e a declaração de origem da síntese — caminho (b), feito com rigor acima do pedido;
- a Saída 3 aparece na tabela comparativa já carregando `[NÃO CONFERIDO NO PRIMÁRIO]`, que é exatamente o que o pesquisador precisa ver antes de decidir;
- suíte verde: 92 arquivos, 728 testes aprovados, 3 pulados.

Mas a reexecução do CLI expôs um defeito que não é do commit — é anterior, e sério.

---

## Caminhos e push

```bash
git fetch origin
git checkout -B sarel/executor-2026-10-09 origin/sarel/executor-2026-10-09
```

Trabalhe e empurre **direto em `sarel/executor-2026-10-09`**. Não crie branch nova. Não espere notificação. Confirme e encerre:

```bash
git push origin sarel/executor-2026-10-09 && git log --oneline -1 origin/sarel/executor-2026-10-09
```

Baseline: **92 arquivos, 728 aprovados, 3 pulados**.

---

## Antes de tudo: um erro meu, para você não repetir o diagnóstico

O prompt anterior mandava rodar:

```bash
node --import ./scripts/ts-loader.mjs scripts/verificar_pool_estratos.ts \
  --candidatos docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json ...
```

Esse comando está **errado**, e o erro é meu: copiei o caminho da citação da auditoria sem abrir o JSON. O arquivo **não contém lista de candidatos**. É um relatório agregado, com as chaves `dataRemedicao`, `versao`, `parametros`, `funilContagem`, `pedologia`, `tercisDeclividadeS`, `tercisFrequenciaSoloNuE`, `dimensoesMedidas`, `metricasGeeLote`, `estratosK2Medidos`, `statusSorteio`. Não há `candidatos`.

Não gaste tempo procurando onde a leitura falhou. O problema é outro, abaixo.

---

## Ajuste 1 — O CLI tabula 18 zeros para entrada sem candidatos

Rodando com os três parâmetros declarados, sobre o arquivo acima:

```
Estrato      | N_h | Tit | ResPoss | ResEfet | Status       | P(rec=0.1) | P(rec=0.25)
E_1_1_1      |   0 |   4 |       0 |       0 | INVIÁVEL(<4) |      65.6% |      31.6%
E_1_1_2      |   0 |   4 |       0 |       0 | INVIÁVEL(<4) |      65.6% |      31.6%
...   (os 18 estratos, idênticos)
```

Dezoito estratos inviáveis parece um achado devastador. É ausência de entrada.

### A linha responsável

`scripts/verificar_pool_estratos.ts`, por volta da linha 142:

```ts
const candidatos: CandidatoSorteioD16[] = Array.isArray(bruto)
  ? bruto
  : (bruto as { candidatos?: CandidatoSorteioD16[] })?.candidatos ?? [];
```

O `?? []` converte "o arquivo não tem a chave `candidatos`" em "o arquivo tem zero candidatos", e a execução segue até imprimir a tabela.

### Por que isso é grave neste projeto

1. **É zero-por-ausência renderizado como zero-medido** — exatamente o que a Regra 1 proíbe: *"Variáveis sem resposta da fonte permanecem estritamente como `indisponivel` acompanhadas de causa e motivo formal."* A mesma patologia que existe em `src/lib/matriz/montagemTemporal.ts` com `frequenciaSoloNu: 0` em ramo de ausência.
2. **É num instrumento de verificação.** Sob a Regra 8 (Evidência de Verificação), uma ferramenta que devolve achado plausível para entrada vazia é pior que uma que quebra: ela produz prova falsa em vez de nenhuma prova.
3. **O varredor anti-mock não pega.** O padrão `coalescencia-com-numero` usa `/\?\?\s*\d+(\.\d+)?\b/` — casa `?? 0`, não casa `?? []`. O defeito passou por um portão que existe precisamente para esta classe.

### Correção

Abortar com `[ERRO_ARQUIVO]` quando o JSON não trouxer lista de candidatos, distinguindo os três casos:

- **chave `candidatos` ausente** e raiz não é array → aborta, dizendo que o arquivo não é uma lista de candidatos e nomeando as chaves que ele tem;
- **lista presente mas vazia** → aborta, dizendo que a lista está vazia (é input inválido para esta verificação, não resultado);
- **lista com itens** → segue normalmente.

Não use `?? []` em lugar nenhum desse caminho. Cubra os três casos em `src/lib/gee/verificarPoolEstratosCli.test.ts`, que já ganhou 84 linhas no commit anterior — acrescente ali.

Avalie também, e diga no relatório se vale a pena: acrescentar ao varredor um padrão para coalescência com coleção vazia (`?? []`, `?? {}`) em código científico. Se achar que gera ruído demais, registre a decisão e o motivo — não implemente por implementar.

---

## Ajuste 2 — A verificação registra um comando que não reproduz a sua própria tabela

`docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md` traz dois comandos:

- um em **Python**, que é o que de fato produziu a tabela de ocupação;
- o do **CLI**, que produz os 18 zeros.

E, logo abaixo do segundo, uma nota afirmando que os parâmetros declarados *"coincidem exatamente com as premissas assumidas na modelagem"*, o que sugere corroboração. O CLI não corrobora nada ali.

### O agravante: não existe arquivo versionado que o CLI possa consumir

Varri todos os JSON versionados do repositório procurando lista de candidatos. **Nenhum tem.** O contrato do CLI (`verificarPreCondicoesSorteioD16`, em `src/lib/gee/sorteioPoligonosTipos.ts`) exige objetos com `estratoId`, e nada versionado os traz.

Ou seja: o CLI é um instrumento sem entrada válida disponível no repositório. Só roda contra um arquivo que exista localmente, produzido por execução GEE e não versionado.

### Correção

Escolha e diga qual, com o motivo:

**(a)** Remover o comando do CLI daquela verificação e registrar, em uma frase, que o CLI não se aplica a arquivo agregado e que a tabela vem do caminho Python. Simples e honesto.

**(b)** Versionar um arquivo de candidatos real que o CLI consuma, e rodar. Só faça isso se existir arquivo real e não sintético — **a Regra 5 e a própria recusa interna do CLI proíbem candidato fabricado**, e um fixture inventado para fazer o comando rodar seria pior que o problema.

Em qualquer caso, remova ou corrija a nota de "coincidem exatamente com as premissas", que hoje afirma uma corroboração que não existe.

---

## Fora de escopo

- **Não desfaça** nada do commit `c8346dd`. A restauração do CLI e a marcação de Cochran e Kish estão corretas.
- **Não refaça** a análise da catena (χ² = 67,5667; p = 2,13 × 10⁻¹⁵; V de Cramér = 0,3159). Conferida.
- **Não decida** entre as quatro saídas do gargalo. É do pesquisador.
- **Não fabrique** arquivo de candidatos para fazer o CLI rodar.

---

## Verificação

```bash
# 1. o CLI aborta com arquivo agregado (sem lista de candidatos)
node --import ./scripts/ts-loader.mjs scripts/verificar_pool_estratos.ts \
  --candidatos docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json \
  --reservas 2 --n-minimo 4 --taxas 0.1,0.25; echo "exit: $?"
#   esperado: [ERRO_ARQUIVO] nomeando as chaves presentes, exit 1 — NUNCA uma tabela de zeros

# 2. nenhuma coalescencia com colecao vazia no caminho de leitura
grep -nE "\?\?\s*(\[\]|\{\})" scripts/verificar_pool_estratos.ts

# 3. nada quebrou
npx vitest run && npm run typecheck && npm run lint
```

O passo 1 é o que define a tarefa: se ainda imprimir tabela, não foi corrigido.

Rodapé obrigatório em cada commit:
```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0124eRLwbTVuEsVKcsq67486
```

---

## Relatório final

Cada afirmação numérica ou de caminho acompanhada do comando que a produziu e da **saída real colada**. Deve conter:

- a saída do passo 1 mostrando o CLI **abortando**, com a mensagem completa;
- os três casos cobertos em teste, e quais testes foram acrescentados;
- qual caminho foi escolhido no Ajuste 2, (a) ou (b), e por quê;
- a decisão sobre o padrão `?? []` no varredor — implementado ou recusado, com o motivo;
- **a linha de confirmação do push.**

Depois, **encerre o turno**. Não aguarde notificação.
