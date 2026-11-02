# Relatório de execução — Lastro (P-L)

**Data:** 2 de novembro de 2026
**Prompt executado:** [`PROMPT_EXECUTOR_LASTRO_2026-11-01.md`](../planejamento/prompts/PROMPT_EXECUTOR_LASTRO_2026-11-01.md)
**Branch:** `correcoes/contencao-2026-11-02`
**Natureza:** encontrar, conferir, arquivar e relatar (Norma, §6). Nenhuma decisão tomada; `decisoes.ts` e `NORMA_LASTRO_CIENTIFICO.md` não foram alterados.

---

## 1. Item 1 — obtenção dos primários: **bloqueado pela rede do ambiente**

**Nenhuma obra foi obtida.** A política de rede desta sessão nega todos os repositórios de fontes. Verificado host por host:

| Host | Resultado |
|---|---|
| `www.biometrie.uni-freiburg.de` (PDF de Roberts 2017 em página institucional de co-autor) | `CONNECT tunnel failed, 403` |
| `zenodo.org`, `doi.org`, `gking.harvard.edu`, `projecteuclid.org`, `www.sciencedirect.com`, `nsojournals.onlinelibrary.wiley.com` | todos negados |
| `agris.fao.org`, `developers.google.com` (via WebFetch) | `ENOTFOUND` — fora dos domínios permitidos |

A busca na web funciona, o acesso direto aos arquivos não. Parei de tentar após o segundo padrão idêntico de falha, como manda o procedimento.

**Consequência pela norma:** sem o arquivo depositado, não há conferência no primário (R-L3). O resultado correto é **dívida declarada**, e não substituto improvisado. Estado por obra:

| Obra | Sustenta | Estado | Registro |
|---|---|---|---|
| Cochran (1977) §5A.12 | `G-01` opção 1 | só síntese autodeclarada não conferida | `LASTRO_NAO_CONFERIDO` via P02? **não** — ver §4; registrado no impedimento de `G-01` e no inventário |
| Roberts et al. (2017) | P02 (thinning 1 km) | **não obtido**; PDF localizado em página de co-autor, host negado | `LASTRO_NAO_CONFERIDO`, id de acervo `roberts2017` |
| Rikimaru et al. (2002) | cortes de D02 | **não obtido**; ver §3 | `LASTRO_NAO_CONFERIDO`, id `rikimaru2002` |
| Zanaga et al. (2022) | classes de P05 | **não obtido** | `LASTRO_NAO_CONFERIDO`, id `zanaga2022` |
| Olofsson et al. (2014) | `G-02`, D23 | **não obtido** | dívida a declarar quando houver decisão vinculada |
| King & Zeng (2001) | correção a priori de D23 | **não obtido** | idem |
| Agresti & Coull (1998); Brown et al. (2001) | `SE ≤ 0,144` de D11.2 | **não obtidos** | verificação própria: [`2026-11-02_lastro_d11_2_se_0144.md`](../verificacoes/2026-11-02_lastro_d11_2_se_0144.md) |
| Bertoni & Lombardi Neto | tabela de P de D22 | **não obtido**; obra em livro | [`2026-11-02_especificacao_competidor_rusle.md`](../verificacoes/2026-11-02_especificacao_competidor_rusle.md) |

---

## 2. Item 3 — veredito das três quitações por cruzamento (**prioritário**)

A seção *"Três das sete são baratas"* da Norma orientou quitar `D02`, `P05` e `P02` por **cruzamento** com fontes que o registro já possuía. Nenhuma das três obras está no acervo: pela R-L2 e R-L3, **nenhuma pode contar como conferida**, independentemente do conteúdo. As três foram reabertas.

| Entrada | Afirmação que precisa de lastro | A fonte sustenta? | Veredito |
|---|---|---|---|
| **D02** / Rikimaru et al. (2002) | os cortes `BSI > 0,10`, `NDVI < 0,40`, `BSI < 0,00`, `NDVI > 0,65` | **Não.** A obra desenvolve modelo de *Forest Canopy Density* sobre LANDSAT TM, com quatro fatores (vegetação, solo nu, térmico, sombra). Sustenta o **índice BSI**, não cortes numéricos para erosão laminar | **esticamento de citação**; reaberta |
| **P05** / Zanaga et al. (2022) | as classes 30 e 40 do WorldCover usadas como filtro | **Plausível, mas desalinhado.** As classes são definidas pelo próprio produto. Porém o código lê `classeWorldCover2020` **e** `classeWorldCover2021`, e a citação de 2022 corresponde ao produto **v200 (ano 2021)**; o **v100 (ano 2020)** tem registro próprio, atribuído a Tsendbazar et al. Se as duas épocas são usadas, faltam as duas citações | **a conferir**; reaberta |
| **P02** / Roberts et al. (2017) | o piso de espaçamento de **1.000 m** no thinning | **Não.** A obra trata de **estratégias de validação cruzada** para dados com estrutura espacial, e conclui que validação por blocos supera a aleatória. Não prescreve distância para **seleção** de candidatos: a distância de bloco de uma validação não é o espaçamento amostral de um sorteio | **esticamento de citação**; reaberta. **Bloqueia `G-01`** — ver §3 |

**Dois agravantes de identificação em D02**, a conferir no primário: a referência do registro grafa **"Rikimaru, T."**, e o registro bibliográfico localizado indica **"A. Rikimaru"**; e o veículo *"Tropical Ecology 43(1):39-47"* **não foi confirmado**. Natureza da evidência: busca na web, não primário — por isso ficam como "a conferir", não como erro estabelecido.

**Impacto científico de D02 é baixo** — a emenda de 06/10/2026 já retirou esses cortes do alvo e da seleção, o que foi **verificado no código** (busca por `0.10`, `0.40`, `0.65` e `D02` em `select-candidates/route.ts` e `estratificacao.ts` não retorna ocorrência). **O impacto de governança é alto**, pela razão da §4.

---

## 3. Item 2 — decomposição da inviabilidade e impedimento a `G-01`

Registrado em [`2026-11-02_impedimento_lastro_G01.md`](../verificacoes/2026-11-02_impedimento_lastro_G01.md). Em resumo:

| Estrato | antes do thinning | pós-thinning | efeito de P02 |
|---|---:|---:|---|
| `E_1_1_2` | 0 | 0 | nenhum — déficit estrutural |
| `E_1_2_2` | **4** | **3** | **viável → inviável** |
| `E_1_3_2` | 5 | 4 | perde a única reserva |
| `E_2_2_2` | 3 | 2 | já inviável |
| `E_2_3_2` | 2 | 2 | nenhum |

Sem o thinning haveria **3** estratos inviáveis, não 4. O impedimento é duplo e independente: **(a)** a opção 1 de `G-01` depende de Cochran, não conferido; **(b)** parte da inviabilidade vem de P02, cujo lastro está sob auditoria. E as opções 2 e 3, puras, deixam `E_2_2_2` e `E_2_3_2` em 2 candidatos — logo a família que resolve envolve colapso, que é justamente o que o lastro não sustenta hoje.

---

## 4. Item 3 (continuação) — por que a trava não pegava, e o que foi construído

**O achado mecânico:** a trava proibia registrar essas três entradas. O teste *"dívida que já recebeu lastro externo deve ser REMOVIDA"* reprova qualquer entrada de `DIVIDA_DECLARADA` cuja decisão tenha marcador bibliográfico — e D02, P05 e P02 **têm** marcador. A trava, por desenho, distingue apenas "tem citação" de "não tem citação": não consegue expressar **"tem citação que não sustenta a afirmação"**.

Isso não é defeito do *ratchet*, que é bom e foi preservado. É a lacuna que a auditoria de 31/10 (§6.5) já havia diagnosticado: `temLastroExterno` é *"deliberadamente permissivo"* e *"não verifica se a obra existe, se está no acervo ou se sustenta a afirmação"*.

**O que foi construído** (`src/config/lastroCientifico.test.ts`):

- categoria nova **`LASTRO_NAO_CONFERIDO`** (R-L2/R-L3), com as três entradas. Cada uma nomeia a **obra**, a **afirmação exata** que precisa de lastro, a **pendência** e o **id de acervo** esperado;
- 5 testes: campos substantivos; a entrada aponta para decisão existente; as duas categorias são **disjuntas**; **autodenúncia** — quando a obra for arquivada, a entrada tem de ser revista e removida; e as três quitações de 20/10 continuam declaradas enquanto as obras não estiverem no acervo.

**Pasta vazia não é acervo.** A primeira versão do teste de autodenúncia reprovou por causa do diretório `roberts2017/` que a tentativa de download frustrada havia criado. O teste passou a exigir **conteúdo**, não a existência da pasta: a R-L3 exige o arquivo depositado.

### A segunda trava, que era a mais grave

`src/config/inventarioBibliografico.test.ts` verificava apenas se o **ID da decisão** aparecia em algum lugar do inventário. Como todos os IDs aparecem, **nenhuma citação era reprovada**. Foi estendida nos dois sentidos, e as duas asserções novas **falharam de imediato**, revelando:

| Defeito revelado | Detalhe |
|---|---|
| **2 caminhos quebrados** | `fontes/2010_04_20_waltrick.pdf` (o arquivo está em `waltrick2010/waltrick_2010.pdf`) e `fontes/renard1997/renard_1997_handbook_703.pdf` (o arquivo é `ah_703.pdf`). O primeiro é citado pela própria emenda de D13 |
| **3 obras arquivadas e ausentes do inventário** | `nepar2011`, `schmidt2019`, `tondati2026` — PDFs no acervo, nenhuma menção no inventário |
| **1 obra catalogada sem caminho** | `cochran1977` — citada, mas sem declarar que o arquivado é uma síntese não conferida |

**Correções aplicadas no inventário**, com metadados extraídos **do próprio acervo**, não inventados:

- **NEPAR 2011** — Waltrick, Machado, Oliveira, Grimm & Dieckow, *Erosividade de chuvas no Estado do Paraná: atualização e influência dos eventos "El Niño" e "La Niña"*, Boletim Técnico nº 01, SBCS-NEPAR, Curitiba, ISSN 2236-2916, 21 p. SHA-256 `c7391c1a…`, lido da extração arquivada.
- **Schmidt (2019)** — *Modification of the RUSLE slope length and steepness factor (LS-factor) based on rainfall experiments at steep alpine grasslands*, MethodsX. SHA-256 `f5aabe02…`, título e autoria dos metadados do PDF.
- **`tondati2026`** — cadastrada como **IDENTIFICAÇÃO PENDENTE**: o PDF não traz `/Title` e o campo `/Author` registra "Anna Carolina Barcelos", que **não corresponde** ao identificador da pasta. Autoria, título, veículo e decisão vinculada **não foram inventados**. SHA-256 `1ed9e5f4…`.
- **Cochran** — caminho declarado, com alerta de que o arquivado é síntese `NAO_CONFERIDO_NO_PRIMARIO` e não sustenta a opção 1 de `G-01`.
- `wfs_erodibilidade` e `doc246` foram declarados **artefatos de verificação, não obras bibliográficas**, em lista nomeada no teste.

---

## 5. Item 5 — `L-08`: a marca de pendência morria no cast

`fatorR.ts` emitia `pendenteVerificacao: true` dentro de um objeto fechado com `as unknown as Proveniencia<number>`. O **duplo cast** silenciava o erro: o campo não existia no tipo, e o objeto ainda carregava `tabela`, que não pertence ao ramo `"modelado"`. A pendência morria ali.

- `Proveniencia<T>`, ramo `modelado`, ganhou `pendenteVerificacao?: boolean` e `detalheVerificacao?: string`, documentados;
- o duplo cast foi **removido** — é o que escondia o erro;
- o censo de proveniência do pacote de reprodutibilidade passa a emitir `PENDENTE DE VERIFICACAO BIBLIOGRAFICA (R-L2)=n`;
- `detalheVerificacao` do fator R **separa as duas coisas** que a avaliação de 01/11 havia fundido: o fator de escala `9,81` está **reproduzido nos dados** e conferido em Waltrick (2010), que traz os coeficientes de Rufino já convertidos ao SI; a **interpretação física** como `g` permanece hipótese, como o próprio código declara. O que segue pendente é a forma funcional e os coeficientes.

**Testes:** 2 novos em `pacoteReprodutibilidade.test.ts` (18 → 20): a marca chega ao censo e o valor continua disponível (a pendência qualifica, não invalida); proveniência sem a marca não gera o aviso.

---

## 6. Redações propostas — para decisão do pesquisador

Nada abaixo foi aplicado. `decisoes.ts` e a Norma não foram tocados.

### 6.1 Emenda de D02 (referência)

> `referencia`: "Rikimaru, A., Roy, P. S. & Miyatake, S. (2002), *Tropical forest cover density mapping* — **citada exclusivamente pelo índice BSI**, que a obra formula no contexto de densidade de dossel florestal. **Os cortes numéricos de 0,10 / 0,40 / 0,00 / 0,65 são convenção operacional deste projeto e não são atribuídos a esta fonte**, que não trata de erosão laminar. Ver a análise de sensibilidade dos cortes em ⟨verificação a produzir⟩. Obra pendente de conferência no primário (R-L2); autoria e veículo a confirmar."

### 6.2 Emenda da Norma — quitação por cruzamento

Acrescentar à seção *"Três das sete são baratas"*:

> **Toda quitação por cruzamento declara a frase que a fonte sustenta.** Cruzar uma decisão com obra já citada em outra decisão **não** é lastro: é hipótese de lastro. A quitação só se completa quando a verificação registra, na primeira pessoa da fonte, **qual afirmação** ela sustenta — e, pela R-L3, **o que ela não sustenta**. Enquanto isso não existir, a entrada pertence a `LASTRO_NAO_CONFERIDO`, não a `DIVIDA_DECLARADA` nem ao conjunto das quitadas. As três quitações de 20/10/2026 (D02, P05, P02) foram reabertas em 02/11/2026 por esta regra.

---

## 7. Gates sem lastro, e o que fica impedido

| Gate | Impedimento |
|---|---|
| **`G-01`** opção 1 (colapsar) | Cochran §5A.12 não conferido no primário. As opções 2 e 3 **puras não resolvem** (deixam `min(N_h) = 2`), logo a família que resolve é a que está impedida |
| **`G-01`**, insumo | P02 sob auditoria (`L-10`): o thinning responde por 1 dos 4 estratos inviáveis |
| **`G-02`** | Olofsson et al. (2014) não obtido — as regras de inferência de área dependem dele |
| **`G-09`** | Olofsson (2014) e King & Zeng (2001) não obtidos |
| **`G-10`** | Bertoni & Lombardi Neto não conferido; a opção de implementar a tabela de D22 está **fechada pela norma** enquanto isso durar |

---

## 8. Verificação

```
npx tsc --noEmit                                      → exit 0
npm test                                              → 93 arquivos | 770 passaram | 3 pulados
npm test src/config/lastroCientifico.test.ts          → 15 passaram (10 → 15)
npm test src/config/inventarioBibliografico.test.ts   → 5 passaram (3 → 5)
npm test src/lib/export/pacoteReprodutibilidade.test.ts → 20 passaram (18 → 20)
```

Baseline ao entrar: 761 testes (estado final de P-0). **+9 testes**, nenhuma regressão.

---

## 9. Pendências

1. **Todas as obras do Item 1** — bloqueio de rede. Fora deste ambiente, Statistical Science (Brown et al.) e a página de autor de King & Zeng são de acesso aberto e devem ser simples; Cochran e Bertoni & Lombardi Neto são livros e exigem acervo da universidade.
2. **A análise de sensibilidade dos cortes de D02** referida na redação proposta (§6.1) ainda não existe.
3. **`A-04`** (atribuição de D20 no fator C) permanece aberto; é escopo de `P-A`, não deste prompt.
4. **A emenda da Norma** (§6.2) depende do pesquisador — o prompt proíbe alterá-la.

**Fim do relatório.** Nenhuma decisão, parâmetro ou norma foi alterado.
