# Tarefa: restaurar o verificador de pool e sanear o lastro de Cochran e Kish

**Origem:** verificação do commit `6268b74` (`docs(amostragem): audita deficit estrutural S1xK2...`), feita em 31/10/2026.

A análise entregue é sólida e **não deve ser desfeita**. A quantificação da catena está correta e é o achado central: χ² = 67,5667, p = 2,13 × 10⁻¹⁵, V de Cramér = 0,3159 sobre 677 candidatos — conferi a aritmética, inclusive o `min(r−1, c−1) = 1` da tabela 3 × 2. A independência que o fatorial 3 × 3 × 2 pressupõe está rejeitada com evidência. E `src/config/decisoes.ts` não foi tocado, como mandava o Passo 4.

São dois acertos de procedimento, ambos cirúrgicos. Não amplie o escopo.

---

## Caminhos e push

```bash
git fetch origin
git checkout -B sarel/executor-2026-10-09 origin/sarel/executor-2026-10-09
```

Trabalhe e empurre **direto em `sarel/executor-2026-10-09`**. Não crie branch nova. Não espere notificação. Confirme com um comando e encerre:

```bash
git push origin sarel/executor-2026-10-09 && git log --oneline -1 origin/sarel/executor-2026-10-09
```

Se o push falhar por credencial, diga no relatório e encerre.

Baseline: **92 arquivos, 725 testes aprovados, 3 pulados**. Qualquer divergência é regressão.

---

## Ajuste 1 — O verificador de pool foi afrouxado para a verificação rodar

`scripts/verificar_pool_estratos.ts` teve três argumentos obrigatórios convertidos em default embutido, e os blocos que abortavam a execução foram removidos:

```diff
-  let reservas: number | null = null;      +  let reservas = 2;
-  let nMinimo: number | null = null;       +  let nMinimo = 4;
-  let taxas: number[] | null = null;       +  let taxas = [0.1, 0.25];
```

```diff
-  if (reservas === null) { console.error("[ERRO_PARAMETRO] O argumento --reservas <N> é obrigatório..."); process.exit(1); }
-  if (nMinimo === null)  { console.error("[ERRO_PARAMETRO] O argumento --n-minimo <N> é obrigatório..."); process.exit(1); }
-  if (!taxas || taxas.length === 0) { console.error("[ERRO_PARAMETRO] O argumento --taxas ... é obrigatório..."); process.exit(1); }
```

E o comando registrado na própria verificação (`docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md`, linha 156) roda **sem** esses três argumentos. Ou seja: os números da tabela de ocupação saíram de defaults invisíveis, não de parâmetros declarados para aquela execução.

### Por que isso não pode ficar

1. **São limiares científicos escritos como literal.** `nMinimo = 4` é a exigência de D16; `taxas = [0.1, 0.25]` são as de recusa do DP-20. A Seção 6 do `CLAUDE.md` é explícita: *"limiar científico não se escreve literal no código — lê-se do registro de decisões"*.
2. **Falha explícita virou default silencioso.** O instrumento existia para obrigar quem verifica a declarar sob que premissas verifica. Quem rodar sem argumentos agora recebe números de aparência autoritativa que ninguém escolheu para aquele caso.
3. **O instrumento foi alterado na mesma tarefa que o usou como prova.** Sob a Regra 8 (Evidência de Verificação), afrouxar o verificador e então citá-lo inverte a ordem.

### Correção, com a divisão que o registro impõe

Levantei o que existe no registro, e os três parâmetros têm situações diferentes:

| Parâmetro | Situação no registro | O que fazer |
| :--- | :--- | :--- |
| `nMinimo` | **derivável**: `DECISOES.D16.parametros.totalPoligonos` = 72, dividido pelo número de estratos de D12 | ler do registro via `exigirParametro`, **não** cravar 4 |
| `reservas` | **não existe** no registro | restaurar como argumento obrigatório |
| `taxas` | **não existe** no registro (DP-20 não tem `parametros` em `decisoes.ts`) | restaurar como argumento obrigatório |

Atenção a duas armadilhas na derivação de `nMinimo`:

- `poligonosTreino` e `poligonosHeldOut` em D16 valem **36 cada** — são **totais da campanha**, não por estrato. Somá-los dá 72, não 4. Não os use como se fossem por estrato.
- o número de estratos (18) vive em **D12**, não em D16. Se D12 não tiver uma entrada formal em `parametros` para isso, **não crave 18**: registre o impedimento no relatório e mantenha `--n-minimo` como argumento obrigatório até que o pesquisador decida promover o valor ao registro. Criar parâmetro novo em `decisoes.ts` é competência dele (Seção 2 do `CLAUDE.md`).

Em qualquer caso, **restaure a falha explícita** para todo parâmetro que não venha do registro. Default silencioso em instrumento de verificação é o oposto do que ele existe para fazer.

### Reexecutar e reemitir a evidência

Depois de restaurado, rode a verificação **com os três parâmetros declarados no comando**, e atualize `docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md`:

- o comando registrado passa a mostrar os argumentos explícitos;
- confirme se a tabela de ocupação muda. Se os valores que estavam embutidos coincidirem com os declarados, a tabela não muda e basta registrar isso. **Se mudar, a tabela anterior estava errada** — e aí a auditoria do gargalo precisa ser revista com os números certos.

Confirme também que `src/lib/gee/verificarPoolEstratosCli.test.ts` volta a cobrir o caso de argumento ausente, que era justamente o comportamento removido.

---

## Ajuste 2 — Cochran e Kish entraram sem o padrão de lastro do projeto

`docs/verificacoes/fontes/cochran1977/` contém **apenas** uma nota em markdown:

```
cochran_1977_sampling_techniques_ch5a12.md
```

Sem PDF, sem SHA-256. O arquivo se intitula *"Nota Técnica de Fonte Primária"*, mas em nenhum ponto declara **como** a obra foi consultada.

Compare com o padrão que o próprio projeto estabeleceu: `docs/verificacoes/fontes/hyndman1996/` e `docs/verificacoes/fontes/zhu2013/` trazem o PDF e o hash. A R-L3 diz que conferência no primário **arquiva a fonte** — uma nota escrita sobre a obra não é a obra.

O mesmo vale para **Kish, L. (1965), *Survey Sampling***, citada na Saída 4 da auditoria (`AUDITORIA_GARGALO_S1K2_2026-10-31.md`, linha 82) sem arquivo e sem marcação.

### O conteúdo não está sob suspeita — o procedimento está

A nota descreve o método de estratos colapsados, a §5A.12, o estimador $v_{cs}$ e traz a seção de fronteira R-L3. Parece correta. Mas "parece correta" é exatamente o critério que a Norma recusa: *"Na dúvida sobre se a fonte sustenta a afirmação, ela não sustenta."*

### Correção — um dos dois caminhos, para cada obra

**(a) Se você tem o exemplar ou o PDF:** arquive-o em `docs/verificacoes/fontes/<autor><ano>/` com SHA-256 registrado, e na nota declare `lida no primário`, com a página conferida. Mantenha a seção de fronteira que já existe.

**(b) Se não tem:** marque explicitamente como **não conferida no primário**, no mesmo formato que o projeto já usa em D13 para Waltrick e na citação de Zhu & Woodcock (2014). A nota deixa de se chamar "Fonte Primária" e passa a declarar o que é: síntese não conferida, com a origem do que foi sintetizado.

Aplique a `docs/verificacoes/fontes/cochran1977/`, à `AUDITORIA_GARGALO_S1K2_2026-10-31.md` e a qualquer citação de Cochran ou Kish em `docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md`.

Se a opção for (b) e Cochran era o lastro da **Saída 3**, que a auditoria recomendou, diga isso com todas as letras no relatório: a recomendação passa a repousar em citação não conferida, e o pesquisador precisa saber disso antes de decidir entre as quatro saídas.

---

## Fora de escopo

- **Não refaça a análise da catena.** χ², p e V de Cramér estão conferidos e corretos.
- **Não decida** entre as quatro saídas. Continua sendo do pesquisador.
- **Não altere** `src/config/decisoes.ts`, nem crie parâmetro novo ali.
- Não mexa nas dívidas de lastro abertas (D03, D17, D18, P07).

---

## Verificação

```bash
# 1. nenhum limiar cravado no CLI
grep -nE "reservas *= *[0-9]|nMinimo *= *[0-9]|taxas *= *\[" scripts/verificar_pool_estratos.ts

# 2. a falha explicita voltou
node --import ./scripts/ts-loader.mjs scripts/verificar_pool_estratos.ts --candidatos docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json
#   deve ABORTAR com [ERRO_PARAMETRO]

# 3. a execucao declarada funciona
node --import ./scripts/ts-loader.mjs scripts/verificar_pool_estratos.ts \
  --candidatos docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json \
  --reservas <N> --n-minimo <N> --taxas 0.1,0.25

# 4. o acervo reflete o que foi conferido
git ls-files docs/verificacoes/fontes/cochran1977/

# 5. nada quebrou
npx vitest run && npm run typecheck && npm run lint
```

O passo 2 não é opcional: um instrumento que deveria abortar e não aborta não foi verificado.

Rodapé obrigatório em cada commit:
```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0124eRLwbTVuEsVKcsq67486
```

---

## Relatório final

Cada afirmação numérica ou de caminho acompanhada do comando que a produziu e da **saída real colada**. Deve conter:

- de onde `nMinimo` passou a vir, e se a derivação pelo registro foi possível ou ficou impedida por falta de parâmetro em D12;
- a saída do passo 2 mostrando o CLI **abortando** sem argumentos;
- **se a tabela de ocupação mudou** ao rodar com parâmetros declarados — e, se mudou, o que isso faz com a auditoria do gargalo;
- para Cochran e para Kish, separadamente: caminho (a) ou (b), e a forma final da citação;
- se foi (b) para Cochran, a declaração explícita de que a Saída 3 recomendada repousa em citação não conferida;
- **a linha de confirmação do push.**

Depois, **encerre o turno**. Não aguarde notificação.
