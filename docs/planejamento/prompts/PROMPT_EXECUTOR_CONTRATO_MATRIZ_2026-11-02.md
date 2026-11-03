# Tarefa: contrato de dados da matriz — a parte que não depende dos gates

**Versão:** 1.0 — 2 de novembro de 2026
**Base do trabalho:** `origin/sarel/executor-2026-10-09` (ponta)
**Origem:** [Consolidação dos achados verificados](../CONSOLIDACAO_ACHADOS_VERIFICADOS_2026-11-01.md), achados `V-01`, `V-03`, `T-02` e `N-08`; [Planejamento sequencial](../PLANEJAMENTO_SEQUENCIAL_CORRECOES_2026-11-01.md), Fase 4 (`A-05`, `C-02`, `C-07`).

> **Fecha de uma vez três achados S1 que têm uma única causa raiz.** `V-01` (só o Modelo D é exportado), `V-03` (a matriz não carrega as chaves do desenho) e `T-02` (`Incluida`/`Pixel_ID` não chegam à matriz) não são três problemas: são o mesmo — `src/lib/matriz/perfis.ts` não tem contrato com seus dois consumidores, o script que produz o alvo (D26) e o que o avalia (D25).

---

## 1. Correção de avaliação, declarada antes de qualquer instrução

A proposta de 01/11 (§5) afirma: *"Dependências duras: A-05/A-06 dependem de B-02/B-03"*, e o planejamento sequencial repetiu isso ao pôr a Fase 4 depois dos gates. **Essa avaliação estava excessiva para `A-05`, e está corrigida aqui**, com base em duas verificações:

1. **O selo D16 já carrega tudo o que falta à matriz.** `sorteioPoligonos.ts:531-543` grava, por polígono: `idPoligono`, `estratoId`, `papelConjunto`, `pi_i`, `w_i`, `nCandidatosEstrato`, `codigoOpacoVant`. Popular `Estrato_ID`, `Pi_i` e `W_i` é uma junção por `Poligono_ID` — e os **valores vêm do selo que o sorteio gravar**, qualquer que seja o cenário escolhido em `G-01`.
2. **Zod 3.23.8 já é dependência** (`package.json:37`). Não há decisão de biblioteca a tomar.

**O princípio de desenho que torna isto possível, e que você deve seguir à risca:**

> **O esquema valida estrutura e proveniência, nunca cardinalidade.** Ele exige que `Estrato_ID` exista, seja não vazio e venha do selo. Ele **não** sabe nem pergunta se há 18, 15, 14 ou 12 estratos, nem quantos polígonos há no held-out. Essa contagem é do selo D16 e da verificação de `A-06`.

Se você hardcodar `18`, `72` ou `36` em qualquer lugar deste trabalho, o contrato passa a depender de `G-01` e terá de ser refeito. **Não hardcode cardinalidade.**

### O que continua fora, e por quê

| Fora | Depende de |
|---|---|
| exigir `n` estratos e `n` polígonos held-out no modo probatório (`A-06`) | **G-01** — é o prompt `P-V` |
| exportar a **segunda** matriz (Modelo P) | **G-04** — ver item 4 |
| o limiar de `Incluida` (cobertura mínima) | **G-06** — é filtro do D25, não do esquema |
| trocar a partição treino/held-out | **G-03** — `Papel_Conjunto` já existe e não muda de forma |

---

## 2. Papel e limites

**Pode:** criar o esquema, acrescentar colunas aos perfis, popular a partir do selo e do CSV de D26, escrever testes e o dicionário de dados.

**Não pode:** alterar `src/config/decisoes.ts`; alterar valor de limiar; alterar `scripts/d25/avaliacao_d25_referencia.py`; decidir qualquer gate; hardcodar número de estratos, de polígonos ou de held-out.

**Regra fundamental do projeto (CLAUDE.md §5):** limiar científico não se escreve literal no código — lê-se do registro por `exigirParametro`.

### Autorização de git — a ser preenchida pelo pesquisador

- [ ] `git commit` na branch ______________________
- [ ] `git push` na branch ______________________
- [ ] nenhuma das duas — escreva, relate os caminhos e pare

### Antes de tocar em qualquer arquivo

```bash
npm run typecheck
npm test
npm test src/lib/seguranca/padroesProibidos.test.ts
```

Registre o baseline no relatório. Não o presuma.

---

## 3. Item 1 — As colunas do contrato e a origem de cada uma

Acrescente aos perfis `matriz-treino` e `matriz-heldout` de `src/lib/matriz/perfis.ts`:

| Coluna | Tipo | Origem | Por que falta hoje |
|---|---|---|---|
| `Estrato_ID` | texto não vazio | selo D16, `estratoId`, por `Poligono_ID` | sem ela não há avaliação estratificada; o D25 a declara no contrato e a proíbe como preditor, mas **não exige a coluna** |
| `Pi_i` | número em `(0, 1]` | selo D16, `pi_i` | sem ela a inferência de D23 não é reproduzível |
| `W_i` | número `> 0` | selo D16, `w_i` | idem; vale `Pi_i × W_i = 1` |
| `N_Candidatos_Estrato` | inteiro `≥ 4` | selo D16, `nCandidatosEstrato` | permite auditar `Pi_i` sem o selo em mãos |
| `Incluida` | **booleano** (ver item 4) | CSV de D26 | sem ela o filtro de cobertura é perdido e `_so_incluidas` do D25 **retorna sem erro** |
| `Cobertura_Celula` | número em `[0, 1]` | CSV de D26 | sem ela não se audita o alvo de célula parcial |
| `Area_Delineada_m2` | número `≥ 0` | CSV de D26 | idem |
| `Pixel_ID` | texto opaco | CSV de D26 | sem ela `_checar_pixels_disjuntos` **retorna sem erro**: a guarda existe e nunca dispara |
| `Modelo` | `"D"` \| `"P"` | parâmetro de montagem | sem ela não se distingue detecção de predição |
| `Data_Referencia` | ISO | parâmetro de montagem | sem ela não se audita a guarda temporal |
| `Fim_Janela` | ISO | `montagemTemporal` | idem |

**Sobre `Modelo`:** popule com `"D"`, porque é o que **já é verdade** — as quatro rotas de produção fixam `modeloJanela: "D"` (`planilha.ts:290`, `pacoteReprodutibilidade.ts:124` e `:697`, `PainelMatrizTreino.tsx:21`). Registrar o que já ocorre **não antecipa `G-04`**; o que `G-04` decide é se passará a existir uma segunda matriz. Deixe o caminho pronto e não o exporte.

**Invariante 2 (lista de permissão):** nenhuma destas colunas é coordenada, e `Pixel_ID` é hash opaco — jamais derive-o de latitude/longitude de forma reversível. Confirme que o teste da lista de permissão continua passando.

---

## 4. Item 2 — Esquema versionado (`C-02`)

Crie `src/lib/matriz/esquema.ts` com Zod:

1. `ESQUEMA_MATRIZ_VERSAO = "2.0.0"`, gravada no cabeçalho do artefato exportado.
2. Um esquema por perfil, declarando as colunas **obrigatórias** e seus domínios: `Pi_i ∈ (0,1]`, `W_i > 0`, `Fracao_Erodida ∈ [0,1]`, `Cobertura_Celula ∈ [0,1]`, `Estrato_ID` não vazio, `Modelo ∈ {"D","P"}`.
3. `validarEsquemaMatriz(perfil, linhas)`, chamada **na exportação**, que **falha** se faltar coluna obrigatória ou se um valor sair do domínio. Erro tipado, no padrão dos erros do projeto — não aviso, não valor corrigido (Regras 1 e 2).
4. Asserção de coerência: `Pi_i × W_i = 1` com a tolerância de arredondamento do selo.
5. `Modelo` uniforme em todo o artefato: D e P **nunca** na mesma matriz.

**Aceite:** a exportação falha se faltar `Estrato_ID`; falha com `Pi_i = 0` ou `Pi_i > 1`; falha com `Modelo` misturado; passa no estado corrigido.

---

## 5. Item 3 — População e junções

1. **Do selo D16, por `Poligono_ID`:** `Estrato_ID`, `Pi_i`, `W_i`, `N_Candidatos_Estrato`. Se o polígono da linha não existir no selo, **falhe** — não preencha com vazio nem com zero (Regra 1).
2. **Do CSV de D26, por `Celula_ID` (ou `Pixel_ID`):** `Incluida`, `Cobertura_Celula`, `Area_Delineada_m2`, `Pixel_ID`. Célula sem correspondência no CSV **não entra** na matriz de treino; registre a contagem de excluídas no relatório.
3. **Não** aplique o filtro de cobertura aqui. A coluna viaja; o filtro é do D25 e depende de `G-06`.
4. Ler o selo não pode exigir rede nem sessão: é artefato local.

---

## 6. Item 4 — Alerta: o Invariante 7 pode bloquear a exportação

`src/lib/matriz/invariantes.ts:333-360` recusa a exportação quando **qualquer coluna numérica** tem valor idêntico em 100% das linhas não vazias, com `n ≥ 21`. Duas colunas novas entram em rota de colisão:

- **`Incluida`**, se exportada como `1`/`0`. Após qualquer filtragem a montante, todas as linhas valem `1` — coluna numérica constante, `n ≥ 21`, **exportação bloqueada**. **Exporte-a como booleano ou texto**, nunca como `1`/`0`.
- **`Cobertura_Celula`**, se todas as células observadas tiverem cobertura integral — plausível em voo bem planejado. Se ocorrer, **não** desative o invariante: use o mecanismo de exceção que o projeto já tem, a anotação `"tabelado ("` na coluna irmã `<col>_Origem` (`:338`), ou declare a situação no relatório para decisão do pesquisador.

**Não** acrescente nome à lista `COLUNAS_EXCECAO_CONSTANTE_TABELADA` sem relatar: ela é a exceção nominal do fator P, com lastro em Renard et al. (1997), e ampliá-la por conveniência enfraquece o invariante.

**Aceite:** existe teste com 21+ linhas em que `Incluida` é uniformemente verdadeiro e a exportação **passa**; e teste em que uma coluna numérica genuinamente constante **bloqueia**.

---

## 7. Item 5 — Dicionário de dados (`C-07`)

Crie `docs/metodologia/DICIONARIO_MATRIZ_TREINO.md`, uma linha por coluna: **nome, tipo, unidade, suporte** (célula de 10 m, polígono de 5,02 ha, estrato), **origem** (selo D16, CSV D26, GEE, cálculo), **decisão de referência** e **domínio válido**.

Duas entradas precisam de redação explícita, porque a confusão de unidade é o erro que `D-02` descreve:

- **`Pi_i`** — probabilidade de inclusão do **polígono** no seu estrato, igual a `n_h/N_h` com `N_h` em **número de candidatos**, não em hectares. **Não é peso de área.** Escreva isso na própria linha do dicionário.
- **`W_i`** — peso de Horvitz-Thompson do polígono, `1/Pi_i`. Mesma ressalva.

---

## 8. Fora de escopo

1. **Não** implemente o fail-closed do D25 (`A-06`): depende de `G-01`, é o prompt `P-V`.
2. **Não** exporte a matriz do Modelo P: depende de `G-04`.
3. **Não** aplique nem decida o limiar de cobertura: depende de `G-06`.
4. **Não** altere a partição treino/held-out: depende de `G-03`.
5. **Não** hardcode 18, 72 ou 36 em lugar algum.
6. **Não** altere `decisoes.ts`, `avaliacao_d25_referencia.py` nem o alvo no Inspetor (é `P-0`).
7. **Não** desative nem afrouxe invariante algum.
8. **Não** abra pull request.

---

## 9. Testes e aceite

```bash
npm run typecheck
npm test
npm test src/lib/seguranca/padroesProibidos.test.ts
```

Testes que precisam existir:

1. a matriz exportada contém as onze colunas novas;
2. o esquema **rejeita** matriz sem `Estrato_ID`;
3. o esquema rejeita `Pi_i` fora de `(0,1]` e `Modelo` misturado;
4. `Pi_i × W_i = 1` para toda linha;
5. polígono ausente do selo **falha** a montagem, não preenche;
6. célula ausente do CSV de D26 não entra no treino, e a contagem é reportada;
7. `Incluida` uniformemente verdadeiro com 21+ linhas **não** bloqueia a exportação;
8. a lista de permissão do Invariante 2 continua passando, sem coordenada na matriz.

---

## 10. Relatório

Grave em `docs/auditorias/RELATORIO_CONTRATO_MATRIZ_2026-11-02.md`:

1. Baseline antes e depois.
2. Colunas acrescentadas, com a origem efetiva de cada uma.
3. Como o esquema trata ausência, domínio violado e `Modelo` misturado.
4. O que aconteceu com o Invariante 7 e como `Incluida` foi tipada.
5. Contagem de linhas excluídas por falta de correspondência no selo ou no CSV de D26.
6. Confirmação de que nenhuma cardinalidade foi hardcodada — e onde o número de estratos passa a ser lido.
7. O que ficou pendente de `G-01`, `G-03`, `G-04` e `G-06`.

**Resposta final:** 5 a 10 linhas; tabela coluna → origem → teste; comando → resultado; o que exige decisão do pesquisador.

**Fim do prompt.** Nenhuma decisão, parâmetro ou norma é alterado por este arquivo.
