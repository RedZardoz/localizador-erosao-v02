# Tarefa: fechar a interação entre o contrato da matriz e o D25 — vazio não é `false` (S1-1)

**Versão:** 1.0 — 3 de novembro de 2026
**Base do trabalho:** `correcoes/contencao-2026-11-02`
**Origem:** achado `S1-1` de [`AUDITORIA_PROGRAMA_COERENCIA_2026-11-03.md`](../../auditorias/DeepSeek/AUDITORIA_PROGRAMA_COERENCIA_2026-11-03.md), **confirmado por reprodução**
**Prioridade:** a mais alta das três tarefas emitidas hoje

> **Este defeito foi introduzido por mim em `P-M`.** O contrato de dados acrescentou `Estrato_ID`, `Pi_i`, `W_i`, `Incluida`, `Cobertura_Celula`, `Area_Delineada_m2` e `Pixel_ID` aos perfis da matriz — mas as quatro rotas de produção continuam chamando `montarMatrizTreino` **sem** `seloD16` e **sem** `exigirDelineacaoD26`, de modo que as colunas saem **presentes e vazias**. E o D25 não distingue vazio de valor. Em um aspecto específico, o estado atual é **pior que antes de `P-M`**: as guardas que antes retornavam em silêncio agora disparam errado.

---

## 1. A reprodução, para que você não precise confiar na descrição

Executada em 03/11/2026 contra o código vigente, com uma matriz de 6 linhas em que `Incluida` e `Pixel_ID` são `""` — exatamente o que as rotas exportam hoje:

```
linhas antes de _so_incluidas : 6
linhas depois de _so_incluidas: 0        <-- a matriz é esvaziada
_checar_pixels_disjuntos LANCOU: ErroAvaliacao
    -> 1 pixel(is) de 10 m em treino e held-out (vazamento espacial)
```

**As duas falhas, e por que acontecem:**

| Guarda | Linha | O que faz com `""` | Por quê |
|---|---|---|---|
| `_so_incluidas` | `avaliacao_d25_referencia.py:176-181` | **filtra tudo**: zero linhas | `""` não está em `("true","1","1.0","verdadeiro")`, logo cada linha é lida como **não incluída** |
| `_checar_pixels_disjuntos` | `:184-195` | **falso vazamento** | `set(d["Pixel_ID"].astype(str))` coloca `""` nos dois conjuntos, e a interseção não é vazia |

**O princípio que a correção aplica** é a Regra 1 do projeto, aplicada ao consumidor: **célula vazia é ausência de insumo, não um valor.** Uma guarda que lê ausência como `false` produz zero linhas; uma que lê ausência como identidade produz vazamento inventado. Nenhuma das duas é o comportamento correto.

---

## 2. Papel e limites

**Pode:** acrescentar campos de opção às exportações, repassar o selo e a delineação, corrigir a interpretação de vazio no D25, escrever testes.

**Não pode:** decidir `G-01`; implementar a exigência estrita do modo probatório (é `A-06`, depende de `G-01` — ver §6); alterar `src/config/decisoes.ts`; alterar a margem de 0,10; aplicar o filtro de cobertura P11 (é `G-06`).

### Autorização de git — a ser preenchida pelo pesquisador

- [ ] `git commit` na branch ______________________
- [ ] `git push` na branch ______________________
- [ ] nenhuma das duas — escreva, relate os caminhos e pare

### Antes de editar

```bash
npm run typecheck
npm test
npm test src/lib/seguranca/padroesProibidos.test.ts
python3 -m unittest discover -s scripts/d25 -p "test_*.py"
```

**Baseline em 03/11/2026:** `tsc` exit 0; **94 arquivos, 794 testes, 3 pulados**; varredor 34/34; D25 **49 testes OK** (exige `pip install -r scripts/d25/requirements.txt`). Os 3 pulados são legítimos: `src/lib/fundiario/matcher.test.ts`, condicionais ao provisionamento da base SQLite.

**Nota de ambiente:** se você rodar em Windows com pacotes em `site-packages` do usuário, **não use a flag `-I`** do Python — ela isola o ambiente e gera `ModuleNotFoundError`. Use `python -u`.

---

## 3. Metade TypeScript — fazer o insumo chegar às rotas

As quatro chamadas, todas sem as opções novas:

```
src/lib/export/planilha.ts:291
src/lib/export/pacoteReprodutibilidade.ts:136
src/lib/export/pacoteReprodutibilidade.ts:709
src/components/matriz/PainelMatrizTreino.tsx:21
```

**Faça:**

1. **`OpcoesExportacao`** (`planilha.ts:19-25`) ganha dois campos **opcionais**, repassados a `montarMatrizTreino`:
   - `seloD16?: { poligonos: Array<{ idPoligono, estratoId, pi_i, w_i, nCandidatosEstrato }> }` — a forma já aceita por `OpcoesMontagemMatriz`;
   - `exigirDelineacaoD26?: boolean`.
2. **O mesmo para o pacote de reprodutibilidade**, nas duas chamadas.
3. **`PainelMatrizTreino.tsx`** passa o selo quando ele existir. O componente `PainelSorteioD16.tsx` já busca o selo por `GET /api/gee/sorteio-d16`, que devolve `seloExistenteCaminho` — use o mesmo caminho de leitura; não invente um novo mecanismo.
4. **Onde o selo não existir, as colunas continuam vazias** — e isso é correto, porque nenhum voo foi selado. O que a correção garante é que, **quando existir**, o insumo chega.

**Não torne as opções obrigatórias.** Com exigência incondicional hoje, a matriz sai vazia. A exigência é do modo probatório (`A-06`).

---

## 4. Metade Python — distinguir ausente, vazio e preenchido

Três estados, três comportamentos. Hoje só existem dois.

| Estado da coluna | Hoje | Deve ser |
|---|---|---|
| **ausente** | retorna em silêncio | **avisa** no dry-run; falha em probatório (`A-06`, fora deste escopo) |
| **presente e 100% vazia** | `_so_incluidas` esvazia a matriz; `_checar_pixels_disjuntos` acusa falso vazamento | **avisa e não opera**: sem insumo não há filtro nem checagem a fazer |
| **presente e parcialmente vazia** | linhas vazias tratadas como `false` / como pixel compartilhado | **avisa com a contagem** e opera apenas sobre as linhas preenchidas |
| preenchida | filtra / compara | inalterado |

**Faça em `scripts/d25/avaliacao_d25_referencia.py`:**

1. **`_so_incluidas`**: se `Incluida` existe mas **nenhuma** linha é reconhecível como verdadeira ou falsa — isto é, todas vazias —, **não filtre**; emita aviso explícito dizendo que o filtro de cobertura não tem insumo. Se houver vazios **parciais**, reporte quantos e decida só sobre os preenchidos, deixando claro no aviso que as linhas sem `Incluida` não foram filtradas.
2. **`_checar_pixels_disjuntos`**: descarte valores vazios **antes** de formar os conjuntos. Se, após o descarte, um dos lados ficar sem nenhum pixel, **não há checagem possível** — emita aviso e retorne, em vez de acusar vazamento. Mantenha o erro para interseção de pixels **reais**.
3. **Um comentário em cada guarda** registrando por que vazio não é valor, com referência a `S1-1`. Quem ler o código em seis meses precisa entender que isto é deliberado.

**Cuidado com um detalhe que a reprodução expôs:** `astype(str)` transforma `NaN` em `"nan"`, que é tão compartilhado quanto `""`. Trate ambos — e qualquer coisa que não seja identificador real — como ausência.

---

## 5. Testes de aceite

**Python**, em `scripts/d25/test_avaliacao_d25_referencia.py`:

1. `Incluida` 100% vazia → `_so_incluidas` **preserva** as linhas e avisa; **não** devolve zero.
2. `Incluida` parcialmente vazia → opera sobre as preenchidas, reporta a contagem das vazias.
3. `Pixel_ID` 100% vazio → `_checar_pixels_disjuntos` **não lança**; avisa.
4. `Pixel_ID` com `NaN` em todas → idem.
5. `Pixel_ID` com pixel **real** repetido entre treino e held-out → **lança** `ErroAvaliacao`. É o teste que impede a correção de desarmar a guarda.
6. `Incluida` com valores reais mistos (`"true"`/`"false"`) → filtra corretamente, como hoje.

**TypeScript:**

7. Exportação **com** `seloD16` → `Estrato_ID`, `Pi_i`, `W_i` e `N_Candidatos_Estrato` saem **preenchidos**, e `Pi_i × W_i = 1`.
8. Exportação **sem** `seloD16` → saem vazios, e o esquema **aceita** (é ausência declarada).
9. As quatro rotas repassam a opção quando ela é fornecida — teste que falhe se alguém acrescentar uma quinta chamada sem repassar.

---

## 6. Fora de escopo

1. **Não implemente `A-06`** — exigir `Incluida`, `Pixel_ID`, `Estrato_ID`, contagem de clusters, config congelado e `RUSLE_A` no modo probatório depende de `G-01` e é o prompt `P-V`. Esta tarefa corrige a **interpretação** de vazio, não a **exigência** de preenchimento.
2. **Não aplique o filtro de cobertura P11** (`G-06`).
3. **Não torne `seloD16` obrigatório.**
4. **Não decida `G-01`** nem altere o tipo do selo (`36 | 72`).
5. **Não abra** pull request.

---

## 7. Relatório

Grave em `docs/auditorias/RELATORIO_CHAVES_VAZIAS_2026-11-XX.md`:

1. Baseline antes e depois, com os quatro comandos.
2. A reprodução do defeito **antes** da correção, e a mesma reprodução **depois** — é a evidência de que a correção funciona.
3. O que mudou em cada arquivo, TypeScript e Python.
4. Como ficaram os três estados (ausente, vazio, preenchido) em cada guarda.
5. Confirmação de que a guarda de pixel **real** continua disparando.
6. O que ficou pendente de `A-06` e de `G-01`.

**Resposta final:** 5 a 10 linhas; a reprodução antes e depois; comando → resultado; o que exige decisão do pesquisador.

**Fim do prompt.** Nenhuma decisão, parâmetro científico ou norma é alterado por este arquivo.
