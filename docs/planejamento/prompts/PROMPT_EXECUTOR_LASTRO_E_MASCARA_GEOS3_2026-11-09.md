# PROMPT A — EXECUTOR SAREL — 09/11/2026 (substitui a versão anterior deste prompt)
## Conferência no primário + máscara GEOS3 completa + saneamento do inventário

**EMENDA DE 09/11/2026, posterior à primeira entrega deste prompt:** Safanelli et al. (2021)
passou a estar na máquina local. Por isso a Tarefa 1 ganhou a seção **1.4** (conferência de
Safanelli, Q8-Q11) e a **Tarefa 5 foi reescrita**: ela já **não** manda abrir dívida para essa
obra. Se você tem uma cópia anterior deste arquivo, descarte-a.

**Mudou em relação à versão anterior:** o PDF primário de Demattê et al. (2018) e o de Rikimaru
et al. (2002) **já estão na máquina local** (commit `fbc8250`). Por isso a conferência no primário
virou a **Tarefa 1**: a emenda de D10 deve afirmar o que o artigo diz, não declarar pendência
sobre fonte secundária. Não execute a versão anterior.

---

## 0. LEITURA OBRIGATÓRIA

1. `docs/DESENVOLVIMENTO.md` integralmente (9 Regras Invioláveis).
2. `docs/metodologia/NORMA_LASTRO_CIENTIFICO.md` (R-L1 a R-L5).
3. `docs/planejamento/ESTADO.md` e `docs/planejamento/DECISOES_DE_CONVERSA.md`.

Informe o branch (`git branch --show-current`) e **permaneça nele**.

---

## 1. REGRA DE RELATO

- **Nunca** transcreva listagem de arquivos, de testes ou de resultados "de memória". Só cole
  saída **literal** de comando que você rodou nesta sessão.
- Por tarefa: (a) o comando, (b) a saída crua — se longa, 5 primeiras e 5 últimas linhas, dizendo
  que recortou —, (c) o veredicto.
- Tarefa que não puder ser concluída: **diga qual e por quê**. Não conclua parcialmente em
  silêncio e não invente número nenhum.
- Nunca apague, desabilite ou marque `skip` em teste para ficar verde. Trava vermelha sem causa
  entendida: **pare e relate**.
- No fim: `git status --short` e `git log --oneline -3`, crus.

---

## 2. FATOS JÁ MEDIDOS — não re-derive

| Fato | Onde |
|---|---|
| `candidatosComSoloNuMedido: 0` — **nenhum Ê medido**; mudar a máscara agora custa zero remedição | `ESTADO.md:53` |
| `statusSorteio: BLOQUEADO — Dimensão Ê não foi medida` | `ESTADO.md:43` |
| A série S2 lê `["B2","B4","B8","B11","B12"]` — **B3 (Green) não é lido** | `copernicusGeeClient.ts:349` e `:532` |
| Caminho de produção de Ê usa `Image.lt` (estritamente `<`) | `amostragemSoloNuLote.ts:323` |
| Caminho local usa `ndvi < limiarNdvi` (estritamente `<`) | `compostoSoloNu.ts:114` |
| Dois outros caminhos usam `<=` | `persistenciaTemporal.ts:121`; `montagemTemporal.ts:291` e `:314` |
| D10 declara `operador: "<="` | `decisoes.ts`, `D10.parametros.ndviSoloNu` |
| A EMENDA de Mannigel em `D10.referencia` é **cópia** da de `D09.referencia` | `decisoes.ts`, D09 e D10 |
| `.gitignore:103` ignora `docs/bibliografia/**/*.pdf`; `docs/verificacoes/fontes/` **não** é ignorado | `.gitignore` |
| Os 4 DOIs do lote novo resolvem corretamente (conferidos no resolvedor DOI em 09/11/2026) | §6 do inventário |

---

## TAREFA 1 — CONFERÊNCIA NO PRIMÁRIO (faça primeiro; tudo depende dela)

### 1.1 Onde arquivar, e quando o PDF pode ir junto

`.gitignore:103` mantém os PDFs da bibliografia fora do Git — decisão correta, e por copyright:
`1-s2.0-S0034425718302049-main.pdf` é o PDF pago da Elsevier, que não deve ser redistribuído pelo
repositório. **Catalogar não é arquivar.** A R-L2 exige evidência em
`docs/verificacoes/fontes/<idAcervo>/`, que **não** é ignorado.

**A regra geral, que vale para as três obras desta rodada:** o que decide se o PDF entra no Git é
a **licença da obra**, não a conveniência. Confira você mesmo os dois padrões já existentes:

```
git ls-files docs/verificacoes/fontes/doc246 docs/verificacoes/fontes/cochran1977
git ls-files docs/verificacoes/fontes/renard1997 docs/verificacoes/fontes/zhu2013
```

Os dois primeiros **não têm PDF** — só script de extração e saída, ou transcrição em markdown: é o
padrão para obra não redistribuível. Os dois últimos têm PDF, porque podem (USDA em domínio
público; tese). Nesta rodada:

| Obra | Editor | PDF no Git? |
|---|---|---|
| Demattê et al. (2018) | Elsevier, pago | **Não** — padrão `doc246`: extração + nota |
| Rikimaru et al. (2002) | re-hospede de terceiro, licença desconhecida | **Não** — padrão `doc246`; registre a procedência na nota |
| Safanelli et al. (2021) | RBCS/SciELO, acesso aberto | **Depende da licença** — ver 1.4 |

Em caso de dúvida sobre licença, **não** versione o PDF: a extração mais a nota já satisfazem a
R-L2, e o hash mais a URL de origem garantem a rastreabilidade.

### 1.2 Conferir Demattê et al. (2018) — `docs/verificacoes/fontes/dematte2018/`

A partir do PDF local `docs/bibliografia/01_pesquisas_diretamente_relacionadas/1-s2.0-S0034425718302049-main.pdf`
(SHA-256 registrado: `f6dc34d82c5bcd9165c78f32fe6efd2926275d1d5f81f4e037e43e4f4185ab87` —
**confirme o hash antes de ler** e cole a saída).

Crie o diretório e nele:

- `extrair_dematte_2018.py` — script de extração (padrão de `doc246/extrair_cnps_doc_246_2024.py`);
- `saida_extracao_dematte_2018.txt` — saída crua da extração;
- `conferencia_dematte_2018.md` — a nota de conferência.

A nota de conferência tem de responder, **com citação literal e número de página**, as quatro
perguntas abaixo. Se o artigo não responder alguma, escreva **"NÃO CONSTA NO PRIMÁRIO"** — isso é
um resultado válido e importante, não uma falha sua.

| # | Pergunta |
|---|---|
| Q1 | Os limites da máscara de solo exposto são `NDVI ∈ [−0,25; 0,25]`, `NBR2 ∈ [−0,30; 0,10]` e `VNSIR ≤ 0,90`? Transcreva a passagem. |
| Q2 | O operador do VNSIR é `< 0,9` ou `≤ 0,9`? E os do NDVI e do NBR2 são inclusivos? |
| Q3 | A fórmula é exatamente `VNSIR = 1 − [(2·Red − Green − Blue) + 3·(SWIR2 − NIR)]`? **Em que escala de refletância** (0–1, 0–10000, outra)? |
| Q4 | Qual banda de NIR, e de qual sensor Landsat? (decide B8 vs B8A no Sentinel-2) |

A nota tem de trazer também, por exigência da norma, a seção **"O que esta obra NÃO sustenta"**.
Comece por: a obra não trata de erosão laminar, e não é um estudo de Sentinel-2 — a transposição
de bandas é do projeto.

### 1.3 Conferir Rikimaru et al. (2002) — `docs/verificacoes/fontes/rikimaru2002/`

PDF local: `Tropical forest cover density mapping - International Society for ....pdf`
(SHA-256 `80e9e9fe884282860c1be461d08017515da18130d08531268b0d6c054b71885f`). Este é um **re-hospede
de terceiro** (Yumpu), não o PDF do editor. Registre isso na nota: a cópia pode divergir da versão
publicada.

Responder, com citação literal:

| # | Pergunta |
|---|---|
| Q5 | A autoria é `A. Rikimaru, P. S. Roy, S. Miyatake` e o veículo `Tropical Ecology 43(1):39-47`? Transcreva da folha de rosto. |
| Q6 | A obra enuncia **qualquer** corte numérico de BSI ou de NDVI? Se sim, qual e para quê? |
| Q7 | A fórmula do BSI na obra é a mesma de `calcularBsi` em `compostoSoloNu.ts`? |

Seção **"O que esta obra NÃO sustenta"**: os cortes `0,10 / 0,40 / 0,00 / 0,65` de D02, se Q6 der
negativo.

### 1.4 Conferir Safanelli et al. (2021) — `docs/verificacoes/fontes/safanelli2021/`

**Novidade de 09/11/2026:** esta obra passou a estar disponível na máquina local, depois de o
prompt ter sido escrito. Ela **deixa de ser dívida** e entra na conferência.

**Localize o arquivo mecanicamente, não por caminho adivinhado.** Rode e cole a saída crua:

```
git status --short --untracked-files=all | head -40
find docs -iname "*safanelli*" -o -iname "*rbcs*2021*" | head
```

Registre na nota de conferência o caminho real, o SHA-256 do arquivo e de onde foi obtido.

**Licença — decide se o PDF pode ser versionado.** A RBCS/SciELO é de acesso aberto, mas **confira
a declaração de licença** na primeira página do PDF ou na página do artigo (procure por `CC BY`,
`CC BY-NC`, "Creative Commons"). **Cole o texto literal da licença que encontrar.** Então:

- se a licença **permite** redistribuição (ex.: CC BY), arquive o **PDF** em
  `docs/verificacoes/fontes/safanelli2021/` junto com a extração — como já se faz em
  `renard1997/` e `zhu2013/`;
- se **não** permite ou você não encontrar a declaração, siga o padrão `doc246/`: extração e nota,
  **sem** PDF, e diga no relatório que foi por licença não confirmada.

Responder, com citação literal e página:

| # | Pergunta |
|---|---|
| Q8 | A obra enuncia **qualquer** limiar numérico de NDVI? Especificamente `0,25`? (expectativa: não — é estudo pedométrico, não de calibração de limiar) |
| Q9 | A obra define `BSI` como *"bare soil image"*? Transcreva a definição. |
| Q10 | A obra descreve a máscara de solo exposto que usou? Com quais limiares e citando quem? **Se ela reenunciar os limites do GEOS3, isso é confirmação independente de Q1 — destaque.** |
| Q11 | Confere a citação: `Rev Bras Cienc Solo 45:e0210080`, DOI `10.36783/18069657rbcs20210080`, e os sete autores? |

Seção **"O que esta obra NÃO sustenta"**: comece pelo limiar de NDVI de D10, se Q8 der negativo, e
pelo fato de o escopo ser São Paulo e atributos do solo, não erosão.

### 1.5 Consequência mecânica na trava de lastro

`src/config/lastroCientifico.test.ts` verifica, para cada entrada, se
`docs/verificacoes/fontes/<idAcervo>/` existe — e, se existir, **exige que a entrada seja removida**
e a conferência concluída. Portanto, ao criar os dois diretórios você **tem** de resolver as
entradas `rikimaru2002` e, se criar, `dematte2018`:

- **Se a conferência sustentar a afirmação:** remova a entrada da lista e registre a quitação.
- **Se não sustentar:** a entrada **sai** da lista de dívida e a *não-sustentação* passa a ser
  afirmada no campo `referencia` da decisão, como fato conferido — que é mais forte que dívida.
  Diga no relatório qual dos dois caminhos cada obra tomou e por quê.

Isso vale para as **três** obras conferidas nesta rodada: `rikimaru2002`, `dematte2018` e
`safanelli2021`. Nenhuma delas termina esta rodada como dívida não conferida — ou a conferência
sustenta a afirmação, ou a não-sustentação passa a ser afirmada no campo `referencia` da decisão
como fato conferido. Diga no relatório qual caminho cada uma tomou.

---

### 1.6 PONTO DE PARADA — leia antes de seguir para a Tarefa 3

A Tarefa 3 implementa números. Se a conferência não os sustentar, **não os implemente de qualquer
jeito**. Três cenários, e o que fazer em cada:

| Resultado de Q1 | O que fazer |
|---|---|
| O primário traz os cinco limites como esperado | siga normalmente; a Tarefa 3 fica mais forte, pois cita primário conferido |
| O primário traz limites **diferentes** | use os do primário em `decisoes.ts` e nas travas, e relate a divergência. O primário vence a fonte secundária, sempre |
| O primário **não traz** a máscara, ou não traz o VNSIR (`NÃO CONSTA NO PRIMÁRIO`) | **PARE a Tarefa 3 e relate.** Conclua as Tarefas 1, 2, 4, 6 e 7, que não dependem disso, e deixe a 3 e a 5 pendentes com a pergunta explícita |

O terceiro cenário não é fracasso: é o achado mais importante que esta rodada pode produzir. Ele
significaria que a máscara GEOS3, como a literatura secundária a descreve, não está no artigo que
todos citam — e isso muda a decisão metodológica, que é do pesquisador, não sua. Nesse caso o
relatório tem de dizer, em uma frase, **qual é a pergunta que ficou aberta**.

A mesma regra vale para Q3: se o primário usar escala de refletância diferente da que você mediu
no código, **pare e relate** em vez de escolher — o VNSIR é o único dos três testes sensível a isso.

---

## TAREFA 2 — D02: restringir Rikimaru ao índice BSI

Escreva o campo `referencia` de D02 em `src/config/decisoes.ts` **com base no resultado de Q5-Q7**,
não com base em busca na web. Esqueleto, a ajustar ao que você conferiu:

```
referencia: "Rikimaru, A., Roy, P. S. & Miyatake, S. (2002), Tropical forest cover density mapping, Tropical Ecology 43(1):39-47 " +
  "— citada EXCLUSIVAMENTE pelo indice BSI, que a obra formula como componente de solo nu de um modelo de Forest Canopy Density sobre LANDSAT TM. " +
  "Os cortes numericos BSI > 0,10, NDVI < 0,40, BSI < 0,00 e NDVI > 0,65 sao CONVENCAO OPERACIONAL DESTE PROJETO e NAO sao atribuidos a esta fonte, que nao trata de erosao laminar. " +
  "CONFERIDO NO PRIMARIO em 09/11/2026: ver docs/verificacoes/fontes/rikimaru2002/conferencia_rikimaru_2002.md. <preencha com o veredicto de Q5, Q6 e Q7>."
```

Se Q5 contradisser a autoria ou o veículo, **escreva o que o PDF diz** e relate a divergência. Não
force o texto acima.

---

## TAREFA 3 — D10: adotar a máscara GEOS3 completa

### 3.0 Por que

A literatura do grupo Daughtry — agora **no acervo**, itens 037, 039 e 040 do lote novo —
estabelece que NDVI não separa palhada de solo descoberto: resíduo, água e solo têm NDVI
semelhante e diferem no CAI; a cobertura de resíduo correlaciona com o CAI (r² = 0,89) e não com o
NDVI. O GEOS3 usa **NBR2**, no SWIR, por isso. O SAREL herdou o 0,25 e descartou o NBR2.

**Confirme esse r² e a afirmação no PDF `daughtry_rse04.pdf`** e cite página na evidência da
Tarefa 7. Se o número divergir, use o que o PDF diz.

### 3.1 A máscara (ajuste aos achados de Q1-Q4 antes de implementar)

```
NDVI  = (B8 - B4) / (B8 + B4)
NBR2  = (B11 - B12) / (B11 + B12)
VNSIR = 1 - [ (2*B4 - B3 - B2) + 3*(B12 - B8) ]

solo_exposto  =  NDVI >= -0,25  AND  NDVI <= 0,25
            AND  NBR2 >= -0,30  AND  NBR2 <= 0,10
            AND  VNSIR <= 0,90
```

### 3.2 ARMADILHA DE ESCALA — leia duas vezes

`NDVI` e `NBR2` são razões normalizadas: **invariantes à escala**. `VNSIR` **não é** — é combinação
linear comparada contra `1` e `0,90`. Só está correto com refletância **0–1**.

`COPERNICUS/S2_SR_HARMONIZED` guarda refletância ×10000. Com DN, o VNSIR sai na ordem de −30000 e
o filtro passa tudo (ou nada) **sem erro aparente**. E as escalas **divergem entre módulos deste
repositório**: `copernicusGeeClient.test.ts` traz `B11_p15: 1800` (DN); `compostoSoloNu.test.ts`
traz `0.29` para composto de B12 (0–1).

**Meça a escala em cada ponto de chamada antes de escrever o VNSIR e cole a evidência.** Não
assuma. Divida por 10000 só onde a medida mostrar DN, e registre em comentário qual escala aquele
ponto recebe. Se Q3 disser que o primário usa outra escala, reconcilie e relate.

### 3.3 B3 (Green) precisa passar a ser lido

Acrescente `"B3"` em `copernicusGeeClient.ts:349` e `:532`, na ordem que a extração espera, e
estenda: extração por índice (`extrairBanda(idxB3, "B3")`) e por objeto
(`extrairBandaObj(["B3","b3"], "B3")`); o tipo da cena (`b3`) e tudo que o consome;
`nObservacoesValidasPorBanda`, que hoje enumera `B2/B4/B8/B11/B12`.

**Isso vai quebrar `src/lib/gee/contratoEscritorLeitorGee.test.ts`**, que fixa esse conjunto.
Atualize o teste de contrato para incluir `B3`; não o remova.

Use `git grep -n "B11" -- src/lib/gee | grep -v test` para achar todos os pontos antes de editar.

### 3.4 Registrar a decisão ANTES de mudar o código

Em `src/config/decisoes.ts`, bloco `D10`:

**(a) `parametros`** — acrescente, **sem alterar** `ndviSoloNu.valor` (duas travas o fixam em `0.25`):

```ts
ndviSoloNu:    { valor: 0.25,  operador: "<=", finalidade: "Limite SUPERIOR da faixa de NDVI da mascara GEOS3" },
ndviSoloNuMin: { valor: -0.25, operador: ">=", finalidade: "Limite inferior da faixa de NDVI da mascara GEOS3 (exclui agua e sombra profunda)" },
nbr2Min:       { valor: -0.30, operador: ">=", finalidade: "Limite inferior do NBR2 da mascara GEOS3" },
nbr2Max:       { valor: 0.10,  operador: "<=", finalidade: "Limite superior do NBR2 da mascara GEOS3 — e ESTE filtro que exclui palhada seca (residuo celulosico) em SPD" },
vnsirMax:      { valor: 0.90,  operador: "<=", finalidade: "Limite superior do VNSIR da mascara GEOS3 (tendencia espectral)" },
```

Se Q1 ou Q2 derem valores ou operadores diferentes, **use os do primário** e diga no relatório.

**(b) `justificativa`** — a frase atual, *"Garante separação rigorosa entre solo exposto e resíduos
de palhada de Plantio Direto"*, é contrariada pela literatura e **sai**. Em seu lugar:

```
Mascara de solo exposto do sistema GEOS3 (GeoCiS/ESALQ-USP), adotada como conjuncao de tres
testes: faixa de NDVI, faixa de NBR2 e limite de VNSIR. O NBR2 e o componente no SWIR que
discrimina residuo celulosico (palhada de Plantio Direto) de solo mineral exposto; o NDVI,
isolado, nao faz essa separacao (Daughtry et al., 2001; 2004; Hively et al., 2021).
```

**(c) `referencia`** — reescreva com estes elementos, preenchendo com o que a conferência achou:

1. Citação completa e correta de Demattê et al. (2018): *"A powerful data mining procedure to
   retrieve soil spectral reflectance from satellite images"*, RSE 212:161-175,
   DOI `10.1016/j.rse.2018.04.047`. **O subtítulo que o projeto registrava — "A powerful code in
   Google Earth Engine" — não é o desta obra.**
2. Citação de Safanelli et al. (2021), com o DOI **correto**: `10.36783/18069657rbcs20210080`
   (o `rbcs20200080` do inventário está errado; conferido no resolvedor DOI).
3. `EMENDA DE 09/11/2026 (substitui integralmente o texto anterior deste campo)`, contendo:
   - **(i)** o texto anterior era **cópia literal** da EMENDA de Mannigel que pertence a **D09**
     (Fator K) e nada tinha com o limiar de NDVI. Removido daqui; permanece intacto em
     `D09.referencia`, seu lugar próprio.
   - **(ii)** `0,25` **não** é corte isolado: na máscara GEOS3 é o **limite superior de uma faixa**,
     em conjunção com NBR2 e VNSIR. O projeto adotava só o 0,25; passa a adotar a máscara completa.
   - **(iii)** **CONFERIDO NO PRIMÁRIO** em 09/11/2026 — aponte
     `docs/verificacoes/fontes/dematte2018/conferencia_dematte_2018.md` e resuma Q1-Q4. Se alguma
     pergunta deu "NÃO CONSTA NO PRIMÁRIO", declare isso aqui; é a informação mais valiosa do campo.
   - **(iv)** **PENDÊNCIA DE TRANSPOSIÇÃO:** o GEOS3 é sobre Landsat harmonizado. A aplicação a
     Sentinel-2 usa B2/B3/B4/B8/B11/B12 como Blue/Green/Red/NIR/SWIR1/SWIR2. Justifique B8 ou B8A
     **pelo que Q4 disse**. A transposição não foi validada e fica declarada.
   - **(v)** **ATENÇÃO TERMINOLÓGICA**, a preencher com o resultado de **Q8, Q9 e Q10**: em
     Safanelli et al. (2021), `BSI` significa *"bare soil image"* (imagem sintética de solo
     exposto), **não** *Bare Soil Index* — confirme a definição literal (Q9) e não a afirme sem
     ela. Não confundir com o BSI de D02/D20. Declare, como fato conferido no primário, se a obra
     prescreve ou não limiar de NDVI (Q8) e qual máscara ela própria usou (Q10). Se Q10 reenunciar
     os limites do GEOS3, isto deixa de ser só advertência e passa a ser **lastro adicional** —
     registre nos dois lugares.

**(d) Trava de emendas.** `src/config/decisoesEmendas.test.ts:12` exige que `D10.referencia`
contenha `"EMENDA DE 06/10/2026"` — asserção que afirma um fato falso, pois a emenda de 06/10 era
de D09 e foi duplicada em D10 por erro. **Remova a linha de D10 dessa asserção** (as outras nove
ficam), deixe o comentário explicando, e acrescente:

```ts
expect(DECISOES.D10.referencia).toContain("EMENDA DE 09/11/2026");
```

**Mantenha** `expect(DECISOES.D10.estado).toBe("decidida")` no segundo teste.

### 3.5 Implementar — uma função, quatro chamadores

| # | Arquivo | Hoje |
|---|---|---|
| 1 | `src/lib/gee/amostragemSoloNuLote.ts` (~315-340) | expressão GEE REST; **caminho de produção de Ê** |
| 2 | `src/lib/gee/compostoSoloNu.ts:113-121` | local, a partir da série |
| 3 | `src/lib/gee/persistenciaTemporal.ts:121` | local |
| 4 | `src/lib/matriz/montagemTemporal.ts:291` e `:314` | montagem da matriz |

**Não duplique a regra quatro vezes.** Crie `src/lib/gee/mascaraSoloNuGeos3.ts`:

```ts
export function ehSoloExpostoGeos3(
  b2: number | null, b3: number | null, b4: number | null,
  b8: number | null, b11: number | null, b12: number | null,
  escala: "reflectancia_0_1" | "dn_10000",
): boolean | null   // null quando falta banda — NUNCA false por omissao
```

Os três caminhos locais chamam essa função; o caminho GEE reproduz a mesma conjunção na expressão
REST, com teste de paridade (3.7).

**Regra 1 / Invariante 5:** banda ausente é `indisponivel`, **não** `false`. Se B3 faltar numa
cena, ela não pode ser silenciosamente classificada como "não é solo nu": ou sai do denominador de
Ê, ou Ê fica `indisponivel`. Decida qual e **declare na `Proveniencia`**.

Atualize as strings de `modelo` da `Proveniencia` de `frequenciaSoloNu` nos três caminhos locais —
hoje dizem `"Ê = nSoloNu / nTotalValidas"` e `"Ê = nSoloNu(NDVI < limiar & BSI >= limiarMin) / nTotalValidas"` —
para a conjunção dos cinco testes; e `insumos` passa a listar
`serie_B2, serie_B3, serie_B4, serie_B8, serie_B11, serie_B12`.

### 3.6 Alinhar o operador

D10 declara `"<="` e `decisoes.parametros.test.ts:135` afirma que **exatamente em 0,25 classifica
como solo nu**. Mas `amostragemSoloNuLote.ts:323` usa `Image.lt` e `compostoSoloNu.ts:114` usa
`ndvi < limiarNdvi`. Dois dos quatro caminhos contradizem o declarado, e a trava não pegou porque
só exercita o caminho inclusivo. Com cinco comparações, as fronteiras vão de 1 para 5 — corrija:

- `Image.lt` → `Image.lte`, e `gte`/`lte` nos demais limites da expressão REST;
- `ndvi < limiarNdvi` → `ndvi <= limiarNdvi`.

Se Q2 disser que o primário usa `<` em algum limite, **siga o primário** e ajuste o `operador` em
`decisoes.ts` e a trava de fronteira junto. Coerência declarado↔implementado é o que importa.

### 3.7 Travas novas, obrigatórias — `src/lib/gee/mascaraSoloNuGeos3.test.ts`

1. **Fronteira, uma por limite:** logo dentro, exatamente na fronteira (classifica, se inclusivo) e logo fora.
2. **Paridade com `decisoes.ts`:** os cinco números vêm de `exigirParametro(DECISOES.D10, ...)`.
   Nenhum literal `0.25`, `-0.25`, `-0.30`, `0.10` ou `0.90` escrito à mão no código de produção.
3. **Invariância de escala:** a mesma cena em DN e em 0–1 dá o mesmo veredicto. É o teste que pega 3.2.
4. **Paridade GEE ↔ local:** mesmo veredicto para cenas sintéticas fixas. Se a expressão REST não
   puder ser avaliada offline, compare sua **estrutura** (cinco limites, operadores, bandas) contra
   `DECISOES.D10.parametros` e **diga no relatório que é paridade estrutural, não numérica**.
5. **Rejeição de palhada:** ao menos um caso com NDVI dentro da faixa e NBR2 **acima** de 0,10, que
   o limiar antigo aceitaria e a máscara nova rejeita. É a demonstração de que o filtro faz o que a
   justificativa afirma.

### 3.8 Espelhos

`paridadeArtefatos.test.ts` (G03, G07) exige que `docs/planejamento/DECISOES.md` carregue as
grandezas canônicas de D10. Com cinco parâmetros, o espelho muda: regenere com
`node scripts/gerar_decisoes_md.mjs` (confirme o nome real antes) e rode a suíte inteira.

Vários `scripts/gerar_*.py` repetem "NDVI <= 0,25" em texto. **Não** os reescreva agora: apenas
**liste** arquivos e linhas desatualizados no relatório, para um passe próprio.

---

## TAREFA 4 — varrer a afirmação não sustentada

Depois de 3.4(b), rode e **cole a saída crua**:

```
git grep -rn "rigoros" -- src docs scripts
```

Liste cada ocorrência que afirme separação rigorosa solo/palhada **por NDVI**. **Não edite** fora
de `src/config/decisoes.ts` nesta tarefa — quero ver a extensão antes.

---

## TAREFA 5 — resolver `safanelli2021` na trava de lastro

**Esta tarefa mudou:** a obra está agora na máquina local e foi conferida na Tarefa 1.4, logo
**não** se acrescenta entrada de dívida para ela. Em vez disso:

- Se a conferência (Q8-Q11) confirmar que a obra **não** prescreve o limiar de NDVI, o campo
  `referencia` de D10 passa a afirmar isso como **fato conferido no primário** — redação já prevista
  em 3.4(c)(v), que você preenche com o resultado de Q8 e Q9 em vez de deixar como asserção.
- Se Q10 mostrar que a obra **reenuncia** os limites da máscara GEOS3, registre em 3.4(c)(iii) como
  **segunda fonte independente**, e diga se os valores coincidem com os de Q1.
- Se a conferência revelar pendência residual que a obra não resolve, **aí sim** abra entrada em
  `LASTRO_NAO_CONFERIDO` com `idAcervo: "safanelli2021"`, descrevendo a pendência residual
  concretamente — não a genérica "não arquivada", que deixa de ser verdadeira.

**Em qualquer caso, corrija o DOI:** o inventário registra `rbcs20200080`; o correto, conferido no
resolvedor DOI, é `rbcs20210080`. Confirme contra o que o próprio PDF declara (Q11) e, se o PDF
divergir do resolvedor, **relate a divergência em vez de escolher sozinho**.

**Nota terminológica a propagar:** se Q9 confirmar que `BSI` na obra é *"bare soil image"*, essa
advertência tem de aparecer em três lugares: `D10.referencia`, a nota de conferência e a linha da
obra no inventário. Citá-la ao lado do `BSI` de D02/D20 sem a advertência é oferecer à banca uma
confusão pronta.

---

## TAREFA 6 — sanear o inventário bibliográfico

O commit `fbc8250` catalogou 6 obras com SHA-256 e acertou os 4 DOIs do lote (todos conferidos no
resolvedor). Mas atualizou **só os caminhos** nas linhas da §5, deixando autoria, veículo e título
errados — de modo que **o mesmo arquivo agora afirma as duas versões**. Corrija:

**V1 — §5 contradiz §6 em Rikimaru (linha ~375).** `Rikimaru, T. et al.` e
`*New Phytologist* / FCD Mapper` → `Rikimaru, A., Roy, P. S. & Miyatake, S.` e
`*Tropical Ecology* 43(1):39-47`, conforme Q5. Coluna de papel científico:
`Formulação do índice BSI (componente de solo nu do modelo FCD) — NÃO sustenta os cortes numéricos de D02`.

**V2 — §5 contradiz §6 em Demattê 2018 (linha ~383).** `A powerful code in Google Earth Engine` →
`A powerful data mining procedure to retrieve soil spectral reflectance from satellite images`.
Coluna de papel: `Calibração do limiar de NDVI <= 0,25 para solo descoberto` →
`Máscara de solo exposto do GEOS3: faixa de NDVI, faixa de NBR2 e limite de VNSIR (conjunção)`.

**V3 — a linha de Safanelli (~384) ficou intocada.** DOI `rbcs20200080` → `rbcs20210080`; título
`Fine-scale soil mapping using EO data and the GEOS3 platform` →
`Fine-scale soil mapping with Earth Observation data: a multiple geographic level comparison`;
caminho `docs/Selecao Bibliografica/...` → `AUSENTE DO ACERVO (dívida em LASTRO_NAO_CONFERIDO)`.

**V4 — colisão de numeração, em `docs/bibliografia/README.md`.** O commit passou o diretório 01
para `Itens 001 a 041`, mas o diretório 02 continua `Itens 036 a 088`. **Os itens 036–041 designam
hoje dois conjuntos distintos de obras.** Resolva numerando as adições fora da faixa canônica
(ex.: `A01` a `A06`, ou `110` a `115`, continuando dos 109) e ajuste os dois READMEs e a §6 do
inventário de forma coerente. Diga qual esquema escolheu.

**V5 — veículo errado na §6, item 2.** Daughtry et al. (2001), *"Assessing the Spatial Distribution
of Plant Litter"*, está creditado a *"Agronomy Journal / USDA-ARS"*. O arquivo `2001Daughtry_web.pdf`
é das atas do **10th JPL Airborne Earth Science Workshop (AVIRIS)**, de `aviris.jpl.nasa.gov`.
**Confirme na folha de rosto do PDF** e corrija para o veículo que o PDF declarar. É o mesmo tipo
de erro que esta rodada corrige em Rikimaru.

**V6 — os hashes não são verificáveis a partir do repositório.** `.gitignore:103` deixa os 6 PDFs
fora do Git e a §6 **não registra de onde cada arquivo veio nem quando**. Sem URL de origem e data,
ninguém — nem a banca, nem você em 2027 — pode reobter o arquivo e conferir o hash; o hash sozinho
prova integridade de algo irrecuperável. Acrescente à tabela da §6 duas colunas:
**`URL de Origem`** e **`Data de Obtenção`**, preenchidas para as seis obras.

**V7 — caminhos inexistentes remanescentes.** Rode `git grep -n "Selecao Bibliografica" -- docs` e
**cole a saída crua**. Confirme com `ls -d "docs/Selecao Bibliografica"` que o diretório não existe.
Corrija as linhas das obras **desta rodada**; para as demais, **liste** quantas e em que linhas,
para um passe próprio.

---

## TAREFA 7 — evidência (Regra 8) e commit

### 7.1 `docs/verificacoes/2026-11-09_lastro_d02_d10_e_mascara_geos3.md`

1. **O que foi conferido no primário e o que não foi** — separando explicitamente. Nesta rodada
   **três** obras foram conferidas: Demattê et al. (2018), Rikimaru et al. (2002) e Safanelli et
   al. (2021). Diga, para cada uma, se o PDF foi arquivado e, se não, por que (licença).
2. **"O que cada fonte NÃO sustenta"**, uma seção por obra.
3. **Defeitos corrigidos**, com arquivo e linha, antes/depois.
4. **Pendências abertas** após esta rodada.
5. **Linha de impacto:** `candidatosComSoloNuMedido` era 0 — nenhuma medição foi invalidada.
6. **Nota de proveniência:** a cópia de Rikimaru é re-hospede de terceiro, não o PDF do editor.

### 7.2 Commit

```
lastro(D02,D10): confere primarios e adota mascara GEOS3 completa em E-hat

- conferencia no primario de Dematte et al. (2018) e Rikimaru et al. (2002), arquivada em
  docs/verificacoes/fontes/ no padrao doc246 (extracao + nota, sem PDF: obra nao redistribuivel)
- D02: cortes BSI/NDVI declarados convencao do projeto; autoria e veiculo corrigidos
- D10: mascara passa de NDVI<=0,25 para a conjuncao GEOS3 (faixa de NDVI, faixa de NBR2,
  limite de VNSIR); B3 passa a ser lido
- D10: removida a copia da EMENDA de Mannigel, que pertence a D09
- D10: removida a afirmacao de separacao "rigorosa" solo/palhada por NDVI
- alinhado o operador nos quatro caminhos de E-hat (dois divergiam do declarado)
- inventario: resolvidas as contradicoes entre as secoes 5 e 6, colisao de numeracao dos itens,
  veiculo de Daughtry 2001 e rastreabilidade de origem dos PDFs

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0124eRLv8s4zYkBWGYtYdZXZ
```

`git push -u origin <branch-atual>`.

---

## CHECKLIST DO RELATÓRIO FINAL

- [ ] Branch: ______
- [ ] T1 — SHA-256 dos dois PDFs confirmado (saída crua colada)
- [ ] T1 — Q1 a Q4 respondidas com citação literal e página, ou "NÃO CONSTA NO PRIMÁRIO"
- [ ] T1 — Q5 a Q7 respondidas idem
- [ ] T1 — `rikimaru2002` e `dematte2018`: qual caminho cada uma tomou na trava de lastro, e por quê
- [ ] T2 — `referencia` de D02 escrita a partir da conferência, não de busca
- [ ] T3 — escala medida em cada ponto de chamada do VNSIR (evidência colada): ______
- [ ] T3 — B3 lido; `contratoEscritorLeitorGee.test.ts` atualizado
- [ ] T3 — cinco parâmetros em `D10.parametros`; `ndviSoloNu.valor` segue `0.25` (ou: primário diz outro, qual)
- [ ] T3 — função única `ehSoloExpostoGeos3` usada pelos três caminhos locais
- [ ] T3 — operador alinhado em `amostragemSoloNuLote.ts` e `compostoSoloNu.ts`
- [ ] T3 — as 5 travas novas passam, incluindo a de rejeição de palhada
- [ ] T3 — `decisoesEmendas.test.ts` ajustado; `DECISOES.md` regenerado; `paridadeArtefatos` verde
- [ ] T4 — saída crua de `git grep -rn "rigoros"`
- [ ] T1 — Q8 a Q11 respondidas com citação literal e página; licença da RBCS transcrita
- [ ] T5 — `safanelli2021` resolvida: quitada, ou com pendência residual concreta (qual: ______)
- [ ] T5 — advertência "BSI = bare soil image" propagada aos três lugares
- [ ] T6 — V1 a V7; esquema de numeração escolhido: ______; saída crua de `git grep -n "Selecao Bibliografica"`
- [ ] T7 — evidência escrita
- [ ] `npm test` — resumo literal; zero falhas, ou o `AssertionError` literal
- [ ] `git status --short` e `git log --oneline -3`, crus
- [ ] Lista dos `scripts/gerar_*.py` com texto desatualizado (não editados)
