# PROMPT C — EXECUTOR SAREL — 09/11/2026
## Máscara GEOS3 de Demattê et al. (2018) em Ê + pendências do Prompt A

**Contexto.** O Prompt A acionou corretamente o Ponto de Parada §1.6. A conferência no primário
mostrou que a máscara que o Prompt A especificava — `NDVI ∈ [−0,25; 0,25]`, `NBR2 ∈ [−0,30; 0,10]`,
`VNSIR ≤ 0,90` — **não é de Demattê et al. (2018)**, e sim da evolução de 2020. O erro foi do
planejador, que tomou fontes secundárias por primário. A conferência está certa e é a base deste
prompt: ver `docs/verificacoes/fontes/dematte2018/conferencia_dematte_2018.md`.

**Decisão do pesquisador (09/11/2026):** adotar a **opção 2** — a máscara estrita de Demattê et
al. (2018), que é o artigo que D10 já cita.

Este prompt faz o que ficou suspenso (Tarefas 3 e 5 do Prompt A) com os números certos, mais três
pendências do Prompt A que não foram concluídas.

---

## 0. LEITURA OBRIGATÓRIA

1. `docs/DESENVOLVIMENTO.md` integralmente (9 Regras Invioláveis).
2. `docs/metodologia/NORMA_LASTRO_CIENTIFICO.md` (R-L1 a R-L5).
3. **`docs/verificacoes/fontes/dematte2018/conferencia_dematte_2018.md`** — é o lastro deste prompt.
4. `docs/planejamento/ESTADO.md`.

Informe o branch (`git branch --show-current`) e permaneça nele.

---

## 1. PROTOCOLO ANTI-FABRICAÇÃO — obrigatório, leia antes de tudo

O relatório da rodada anterior continha seis citações bibliográficas inventadas e duas saídas de
`git grep` inventadas, **enquanto os arquivos escritos em disco estavam corretos**. O padrão é
claro: o que você roda e grava é confiável; o que você transcreve de memória para o relatório, não.

Portanto, nesta rodada:

**R1 — Saída de comando não se transcreve, se grava.** Todo comando cuja saída o relatório
mencionar tem de ser redirecionado para arquivo em `docs/verificacoes/execucao/2026-11-09/` e
commitado. Exemplo:

```
mkdir -p docs/verificacoes/execucao/2026-11-09
git grep -rn "rigoros" -- src docs scripts > docs/verificacoes/execucao/2026-11-09/grep_rigoros.txt 2>&1
```

No relatório, **cite o arquivo**; não reescreva o conteúdo. Se precisar destacar uma linha, copie-a
do arquivo que acabou de gravar, nunca da memória.

**R2 — Citação bibliográfica não se escreve de memória.** Toda referência a obra tem de vir (a) da
folha de rosto na saída de extração já commitada, ou (b) do resolvedor DOI, com o comando gravado
conforme R1. Se não puder fazer nem (a) nem (b), escreva `CITAÇÃO NÃO CONFERIDA` — é resposta
aceitável e preferível.

**R3 — Nunca cite um arquivo sem antes confirmar que ele existe.** `ls` ou `git ls-files` primeiro.

**R4 — Tarefa não concluída é declarada como não concluída.** Na rodada anterior a remoção da frase
"rigorosa" foi declarada feita e não foi. Isso é pior que não fazer.

**R5 — Nunca apague, desabilite ou marque `skip` em teste para ficar verde.** Trava vermelha sem
causa entendida: pare e relate.

Ao final: `git status --short` e `git log --oneline -3`, também gravados conforme R1.

---

## 2. A MÁSCARA A IMPLEMENTAR

Conforme o primário conferido, transposta de Landsat 5 TM para Sentinel-2 MSI:

| Landsat 5 TM | Sentinel-2 | Papel |
|---|---|---|
| B1 | **B2** | Blue |
| B2 | **B3** | Green |
| B3 | **B4** | Red |
| B4 (760–900 nm) | **B8** (785–900 nm) | NIR — ver Q4 da conferência: B8, não B8A |
| B5 | **B11** | SWIR1 |
| B7 | **B12** | SWIR2 |

```
NDVI = (B8 - B4) / (B8 + B4)
NBR2 = (B11 - B12) / (B11 + B12)

solo_exposto  =  (qualidade SCL aprovada, como ja existe)
            AND  NDVI >= 0,00   AND  NDVI <= 0,25
            AND  NBR2 >= 0,00   AND  NBR2 <= 0,075
            AND  (B4 - B3) >= 0        # Red - Green, o "B3-B2" do Landsat
            AND  (B3 - B2) >= 0        # Green - Blue, o "B2-B1" do Landsat
```

**Todos os operadores são inclusivos.** O artigo diz *"the range between 0 and 0.25"* e
*"values outside this range were flagged as NA"*, e, para a inclinação, *"the negative values ...
were flagged as NA"* — logo o zero permanece. Isso resolve a favor do `<=` já declarado em D10.

### 2.1 Não há armadilha de escala nesta máscara

Diferentemente do VNSIR, **nenhum dos cinco testes depende da escala da refletância**: NDVI e NBR2
são razões normalizadas, e as duas inclinações são testes de sinal de uma diferença — dividir
ambos os termos por 10000 não muda o sinal. Você **não** precisa normalizar nada.

Ainda assim, registre em comentário, em cada ponto de chamada, qual escala aquele ponto recebe. É
informação que o próximo trabalho vai precisar, e foi o que faltou da última vez.

---

## TAREFA 1 — remover a frase não sustentada de D10 (declarada feita, não feita)

`src/config/decisoes.ts:210` ainda contém:

```
justificativa: "Calibrado no sistema GEOS3 (GeoCiS/ESALQ-USP) para solos brasileiros sob imagens orbitais (Landsat e Sentinel-2). Garante separação rigorosa entre solo exposto e resíduos de palhada de Plantio Direto."
```

Duas coisas estão erradas aí: "Garante separação rigorosa ... por NDVI" é contrariado pela
literatura de resíduo (Daughtry et al., 2001; 2004; Hively et al., 2021 — todos no acervo); e
"Landsat e Sentinel-2" é falso, pois a conferência (Q4) mostrou que a obra é **exclusivamente**
Landsat 5 TM. Substitua por:

```
justificativa: "Mascara de solo exposto do sistema GEOS3 (GeoCiS/ESALQ-USP), adotada como conjuncao de cinco testes: faixa de NDVI, faixa de NBR2 e dois testes de inclinacao positiva no visivel. O NBR2 e o componente no SWIR que discrimina residuo celulosico (palhada de Plantio Direto) de solo mineral exposto; o NDVI, isolado, nao faz essa separacao (Daughtry et al., 2001; 2004; Hively et al., 2021). A obra primaria calibrou a mascara exclusivamente sobre Landsat 5 TM; a transposicao para Sentinel-2 MSI e deste projeto e esta declarada em referencia.",
```

Depois, grave conforme R1:

```
git grep -rn "rigoros" -- src docs scripts > docs/verificacoes/execucao/2026-11-09/grep_rigoros.txt 2>&1
```

Liste no relatório, **lendo do arquivo**, quais ocorrências restam e em quais afirmam separação
rigorosa solo/palhada por NDVI. **Não edite fora de `src/config/decisoes.ts`** nesta tarefa.

---

## TAREFA 2 — registrar a decisão em D10 antes de mexer no código

### 2.1 `valor`

Hoje: `"NDVI <= 0.25 (combinado com BSI > 0.10 quando aplicável na assinatura espectral)"`.
O trecho do BSI não pertence ao GEOS3 e some. Novo:

```
valor: "Mascara GEOS3 (Dematte et al., 2018): NDVI em [0,00; 0,25] E NBR2 em [0,00; 0,075] E (B4-B3) >= 0 E (B3-B2) >= 0, em Sentinel-2 MSI L2A",
```

### 2.2 `parametros`

**Não altere** `ndviSoloNu.valor`, que segue `0.25` — duas travas o fixam
(`decisoes.parametros.test.ts:65` e `paridadeArtefatos.test.ts:112`). Acrescente:

```ts
ndviSoloNu:    { valor: 0.25,  operador: "<=", finalidade: "Limite superior da faixa de NDVI da mascara GEOS3 (Dematte et al., 2018)" },
ndviSoloNuMin: { valor: 0.00,  operador: ">=", finalidade: "Limite inferior da faixa de NDVI da mascara GEOS3; exclui agua, sombra e nuvem residual" },
nbr2Min:       { valor: 0.00,  operador: ">=", finalidade: "Limite inferior do NBR2 da mascara GEOS3" },
nbr2Max:       { valor: 0.075, operador: "<=", finalidade: "Limite superior do NBR2 da mascara GEOS3 — e ESTE filtro que exclui palhada seca em SPD. Escolhido pelos autores entre seis faixas testadas, por avaliacao multicriterio (correlacao canonica 0,93)" },
```

Os dois testes de inclinação não têm parâmetro numérico; declare-os no `valor` (feito em 2.1) e
implemente-os como regra estrutural.

### 2.3 `referencia`

Reescreva o campo inteiro. Ele **deve** conter, além da citação canônica de ambas as obras:

- `EMENDA DE 09/11/2026 (substitui integralmente o texto anterior deste campo)`;
- **(i)** o texto anterior era cópia literal da EMENDA de Mannigel que pertence a **D09** (Fator K);
  foi removido daqui e permanece intacto em `D09.referencia`;
- **(ii)** **CONFERIDO NO PRIMÁRIO** em 09/11/2026 — aponte
  `docs/verificacoes/fontes/dematte2018/conferencia_dematte_2018.md` e registre que a obra formula
  `NDVI ∈ [0; 0,25]`, `NBR2 ∈ [0; 0,075]` e as duas inclinações no visível, **e que não contém o
  índice VNSIR**;
- **(iii)** que `0,25` **não** é corte isolado: é o limite superior de uma faixa, em conjunção com
  NBR2 e as inclinações;
- **(iv)** que `0,075` foi escolhido pelos autores **entre seis faixas** (0,025 / 0,075 / 0,150 /
  0,225 / 0,300 / 0,350) por avaliação multicritério sobre **Landsat 5 TM em São Paulo** — logo é
  ótimo daquele conjunto, **não constante universal**. Aponte a varredura da Tarefa 4;
- **(v)** **PENDÊNCIA DE TRANSPOSIÇÃO:** a obra é exclusivamente Landsat 5 TM. A transposição para
  Sentinel-2 usa B2/B3/B4/B8/B11/B12, com **B8** e não B8A, justificada em Q4 da conferência. Não
  validada; declarada;
- **(vi)** que a máscara com `VNSIR` e limites negativos pertence a **Demattê et al. (2020)**,
  *Scientific Reports* 10:4461, DOI `10.1038/s41598-020-61408-1` — **obra ainda não conferida no
  primário**, presente no acervo local e fora do Git. Não a cite como lastro;
- **(vii)** **ATENÇÃO TERMINOLÓGICA:** em Safanelli et al. (2021), `BSI` significa *bare soil image*,
  não *Bare Soil Index*. Essa obra usa calibração regional paulista (`NDVI ∈ [−0,05; 0,30]`,
  `NBR2 ∈ [−0,15; 0,15]`) que **não** foi adotada aqui, por ser de outro estado e mais permissiva.

### 2.4 Trava de emendas

`src/config/decisoesEmendas.test.ts:12` exige que `D10.referencia` contenha
`"EMENDA DE 06/10/2026"` — asserção que afirma fato falso (a emenda de 06/10 era de D09, duplicada
em D10 por erro). Remova a linha de D10 dessa asserção, deixe comentário explicando, e acrescente:

```ts
expect(DECISOES.D10.referencia).toContain("EMENDA DE 09/11/2026");
```

**Mantenha** `expect(DECISOES.D10.estado).toBe("decidida")`.

---

## TAREFA 3 — implementar

### 3.1 B3 (Green) precisa passar a ser lido

`src/lib/gee/copernicusGeeClient.ts:349` e `:532` selecionam `["B2","B4","B8","B11","B12"]`.
Acrescente `"B3"`, na ordem que a extração espera, e estenda: extração por índice
(`extrairBanda(idxB3, "B3")`) e por objeto (`extrairBandaObj(["B3","b3"], "B3")`); o tipo da cena
(`b3`) e tudo que o consome; `nObservacoesValidasPorBanda`.

**Isso vai quebrar `src/lib/gee/contratoEscritorLeitorGee.test.ts`**, que fixa o conjunto de bandas.
Atualize o teste de contrato; não o remova.

Antes de editar, grave o mapa dos pontos conforme R1:

```
git grep -n "B11" -- src/lib/gee > docs/verificacoes/execucao/2026-11-09/grep_b11.txt 2>&1
```

### 3.2 Uma função, quatro chamadores

| # | Arquivo | Hoje |
|---|---|---|
| 1 | `src/lib/gee/amostragemSoloNuLote.ts` (~315-340) | expressão GEE REST; **caminho de produção de Ê** |
| 2 | `src/lib/gee/compostoSoloNu.ts:113-121` | local, a partir da série |
| 3 | `src/lib/gee/persistenciaTemporal.ts:121` | local |
| 4 | `src/lib/matriz/montagemTemporal.ts:291` e `:314` | montagem da matriz |

Crie `src/lib/gee/mascaraSoloNuGeos3.ts`:

```ts
export function ehSoloExpostoGeos3(
  b2: number | null, b3: number | null, b4: number | null,
  b8: number | null, b11: number | null, b12: number | null,
): boolean | null   // null quando falta banda — NUNCA false por omissao
```

Note que **não há parâmetro de escala**: a máscara é invariante (ver §2.1).

Os três caminhos locais chamam essa função. O caminho GEE reproduz a mesma conjunção na expressão
REST, com teste de paridade (3.4).

**Regra 1 / Invariante 5:** banda ausente é `indisponivel`, **não** `false`. Se B3 faltar numa
cena, ela não pode ser silenciosamente classificada como "não é solo nu": ou sai do denominador de
Ê, ou Ê fica `indisponivel`. Decida qual e **declare na `Proveniencia`**.

Atualize as strings de `modelo` da `Proveniencia` de `frequenciaSoloNu` nos três caminhos locais
para a conjunção dos cinco testes, e `insumos` para
`serie_B2, serie_B3, serie_B4, serie_B8, serie_B11, serie_B12`.

### 3.3 Alinhar o operador

`amostragemSoloNuLote.ts:323` usa `Image.lt` e `compostoSoloNu.ts:114` usa `ndvi < limiarNdvi`,
contra o `"<="` declarado em D10 e contra `decisoes.parametros.test.ts:135`. Como o primário é
inclusivo (§2), corrija: `Image.lt` → `Image.lte`, com `gte`/`lte` nos demais limites da expressão
REST; e `ndvi < limiarNdvi` → `ndvi <= limiarNdvi`.

### 3.4 Travas novas — `src/lib/gee/mascaraSoloNuGeos3.test.ts`

1. **Fronteira, uma por limite** (são seis: NDVI min/max, NBR2 min/max e as duas inclinações):
   logo dentro, **exatamente na fronteira — deve classificar como solo exposto** — e logo fora.
2. **Paridade com `decisoes.ts`:** os quatro números vêm de `exigirParametro(DECISOES.D10, ...)`.
   Nenhum literal `0.25`, `0.0` ou `0.075` escrito à mão no código de produção.
3. **Invariância de escala:** a mesma cena em DN (×10000) e em 0–1 dá o mesmo veredicto. Aqui o
   teste deve **passar sem nenhuma normalização no código** — é o que distingue esta máscara da de
   2020.
4. **Paridade GEE ↔ local:** mesmo veredicto para cenas sintéticas fixas. Se a expressão REST não
   puder ser avaliada offline, compare sua **estrutura** contra `DECISOES.D10.parametros` e diga no
   relatório que é paridade estrutural, não numérica.
5. **Rejeição de palhada:** ao menos um caso com NDVI dentro de `[0; 0,25]` e NBR2 **acima** de
   0,075, que o limiar antigo aceitaria e a máscara nova rejeita.
6. **Rejeição por inclinação:** ao menos um caso que passa em NDVI e NBR2 mas falha em
   `(B4-B3) >= 0` — demonstra que os dois testes do visível estão ativos e não são decorativos.

### 3.5 Espelhos

`paridadeArtefatos.test.ts` (G03, G07) exige que `docs/planejamento/DECISOES.md` carregue as
grandezas canônicas de D10. Regenere o espelho e rode a suíte inteira.

Os `scripts/gerar_*.py` que repetem "NDVI <= 0,25" em texto: **não** os edite. Grave a lista
conforme R1 em `docs/verificacoes/execucao/2026-11-09/grep_ndvi_025_scripts.txt`.

---

## TAREFA 4 — instrumentar a varredura das seis faixas de NBR2 (não rodar)

O artigo escolheu `0,075` testando seis faixas sobre Landsat 5 TM em São Paulo. O recorte do SAREL
é o Paraná, com Sentinel-2. Replicar essa avaliação no recorte próprio transforma uma transposição
declarada em **contribuição metodológica**.

Nesta rodada, **apenas instrumente**; não rode. A medição depende de credencial do GEE e da
ingestão, hoje bloqueada (`candidatosComSoloNuMedido: 0`).

1. Parametrize `nbr2Max` de modo que a varredura possa percorrer
   `[0.025, 0.075, 0.150, 0.225, 0.300, 0.350]` sem editar código — por argumento de função, com o
   valor de `DECISOES.D10` como padrão.
2. Crie `scripts/auditoria/varrer_faixas_nbr2.mjs` que, **dada uma série já medida**, calcule Ê sob
   as seis faixas e emita uma tabela. O script deve **recusar-se a rodar sem dados reais** e
   **jamais** emitir número simulado — declare `FONTE_DOS_DADOS` no cabeçalho da saída, como fazem
   os demais scripts de auditoria.
3. Teste o script com uma série sintética de entrada, verificando que as seis colunas saem
   monotonicamente não-decrescentes em Ê (faixa maior admite mais pixels).
4. **Não** registre decisão nova para isso: a varredura é instrumento, não escolha. A escolha fica
   para depois dos dados.

---

## TAREFA 5 — varredura real dos caminhos inexistentes

O Prompt A pediu isso e a saída relatada estava incorreta. Grave conforme R1:

```
git grep -n "Selecao Bibliografica" -- docs > docs/verificacoes/execucao/2026-11-09/grep_selecao_bibliografica.txt 2>&1
ls -d "docs/Selecao Bibliografica" > docs/verificacoes/execucao/2026-11-09/ls_selecao_bibliografica.txt 2>&1
```

O diretório **não existe**. No relatório, diga **quantas** linhas o arquivo tem e em quais arquivos
estão. Corrija apenas as linhas de `docs/bibliografia/INVENTARIO_SELECAO_BIBLIOGRAFICA.md`
(a matriz da Seção 5), substituindo o caminho por `AUSENTE DO ACERVO` ou pelo caminho real quando
houver. As ocorrências em `docs/auditorias/` são registro histórico: **não as edite**, apenas
conte-as.

---

## TAREFA 6 — correção de fidelidade na nota de conferência

Em `docs/verificacoes/fontes/dematte2018/conferencia_dematte_2018.md`, a citação do item 3 de Q1
aparece como `"The negative values of B3-B2 and B2-B1 were flagged as NA"`. A saída de extração
(`saida_extracao_dematte_2018.txt`) traz `"The negative values of B3-B3 and B2-B1 were flagged as NA"`
— há um erro de digitação **no artigo**, que a nota corrigiu em silêncio.

Restaure a fidelidade: transcreva como está no original e marque `[sic]`, acrescentando que a
leitura correta é `B3-B2`, coerente com a frase anterior do mesmo parágrafo. Verifique também se a
primeira metade da citação (`"The difference between B3 and B2, as well as between B2 and B1 were
also calculated to improve soil masking"`) consta literalmente na extração; se não constar, remova
as aspas e parafraseie.

Isso não muda conclusão nenhuma — muda o rito, que é o que a banca vai testar.

---

## TAREFA 6.1 — desfazer uma asserção vácua introduzida no Prompt B

Em `src/config/desenvolvimentoDiretrizes.test.ts:47-48` ficaram:

```ts
expect(conteudo).toContain("npm run estado");
expect(conteudo).toContain("npm run estado:verificar");
```

A primeira é **vácua**: `"npm run estado:verificar"` contém `"npm run estado"` como substring, logo
ela passa mesmo que o comando de geração nunca seja citado nas diretrizes. Não prova o que aparenta.

Troque as duas por uma asserção que distinga de fato os dois comandos — por exemplo, exigindo a
ocorrência do comando de geração **fora** do nome do comando de verificação (uma regex com
fronteira, como `/npm run estado(?!:)/`), mantendo a exigência de `npm run estado:verificar`.
Escreva um meta-teste que **falhe** se o texto das diretrizes citar apenas `estado:verificar`:
é ele que prova que a trava deixou de ser vácua.

---

## TAREFA 7 — evidência e commit

### 7.1 `docs/verificacoes/2026-11-09b_adocao_mascara_geos3_2018.md`

1. A decisão tomada e **por que a opção 2**, contra as opções 1 e 3.
2. Que a máscara anterior proposta era de 2020, não de 2018, e que o erro foi detectado pela
   conferência no primário — registro do funcionamento do rito.
3. Os cinco testes implementados, com a transposição de bandas Landsat→Sentinel-2.
4. Que não há armadilha de escala nesta máscara, e por quê.
5. Pendências abertas: Demattê 2020 não conferido; transposição Landsat→Sentinel-2 não validada;
   `0,075` é ótimo de São Paulo em Landsat 5 TM e aguarda a varredura da Tarefa 4 no Paraná.
6. Impacto: `candidatosComSoloNuMedido` continua 0 — nenhuma medição foi invalidada.

### 7.2 Commit

```
feat(D10): adotar mascara de solo exposto de Dematte et al. (2018) em E-hat

Conferencia no primario (09/11/2026) mostrou que a mascara com VNSIR e limites negativos
pertence a Dematte et al. (2020), nao ao artigo de 2018 que D10 cita. Adotada a mascara
estrita de 2018, conforme decisao do pesquisador.

- D10: NDVI em [0,00; 0,25] E NBR2 em [0,00; 0,075] E (B4-B3) >= 0 E (B3-B2) >= 0
- D10: removida a afirmacao de separacao "rigorosa" solo/palhada por NDVI e a mencao
  falsa a Sentinel-2 na justificativa (a obra e exclusivamente Landsat 5 TM)
- D10: removida a copia da EMENDA de Mannigel, que pertence a D09
- B3 (Green) passa a ser lido na serie Sentinel-2, necessario aos testes de inclinacao
- mascara centralizada em mascaraSoloNuGeos3.ts, usada pelos quatro caminhos de E-hat
- alinhado o operador inclusivo, conforme o primario
- instrumentada a varredura das seis faixas de NBR2 do artigo, para replicacao no Parana
- inventario: varredura real dos caminhos inexistentes

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0124eRLv8s4zYkBWGYtYdZXZ
```

`git push -u origin <branch-atual>`.

---

## CHECKLIST

Cada item responde citando o **arquivo gravado** em `docs/verificacoes/execucao/2026-11-09/`:

- [ ] Branch: ______
- [ ] T1 — frase "rigorosa" removida de D10; `grep_rigoros.txt` gravado e commitado
- [ ] T2 — `valor`, `parametros` (4) e `referencia` de D10 reescritos; `ndviSoloNu.valor` segue `0.25`
- [ ] T2 — `decisoesEmendas.test.ts` ajustado
- [ ] T3 — B3 lido; `contratoEscritorLeitorGee.test.ts` atualizado; `grep_b11.txt` gravado
- [ ] T3 — `ehSoloExpostoGeos3` única, usada pelos três caminhos locais
- [ ] T3 — operador inclusivo nos quatro caminhos
- [ ] T3 — as **6** travas novas passam, incluindo rejeição de palhada e rejeição por inclinação
- [ ] T3 — teste de invariância de escala passa **sem normalização no código**
- [ ] T3 — `DECISOES.md` regenerado; `paridadeArtefatos` verde
- [ ] T4 — `varrer_faixas_nbr2.mjs` criado, com recusa sem dados reais; **não rodado em produção**
- [ ] T5 — `grep_selecao_bibliografica.txt` gravado; nº de linhas: ______; só o inventário editado
- [ ] T6 — `[sic]` restaurado na nota de conferência
- [ ] T6.1 — asserção vácua de `desenvolvimentoDiretrizes.test.ts` substituída, com meta-teste que a prova não-vácua
- [ ] T7 — evidência escrita
- [ ] `npm test` — saída gravada em `docs/verificacoes/execucao/2026-11-09/npm_test.txt`
- [ ] `git status --short` e `git log --oneline -3` gravados
