# PROMPT EXECUTOR — REFERENCIAL TEÓRICO CORRIGIDO (P-5)

**Data:** 04/11/2026
**Branch de trabalho:** `correcoes/contencao-2026-11-02` (ponta esperada: `20b3194`)
**Alvo:** reemitir `Estrutura_Referencial_Teorico_Luis_Alfredo_2858827` em `.docx`, **igual em estrutura e corrigido em conteúdo verificável**.
**Natureza:** correção documental e de dados. **Não altera metodologia, limiar, decisão nem código de produção.**

---

## 1. Objetivo em uma frase

Reemitir o capítulo de referencial teórico com a mesma estrutura, formatação, figuras e redação, corrigindo oito defeitos que foram apurados por conferência direta no artefato — entre eles uma **asserção de verificação que não se cumpriu** e uma **contagem inflada que está no título do capítulo**.

## 2. Regra de ouro

**Igual:** seções, ordem, redação, callouts, quadros, figuras, paleta, fontes e tabelas permanecem como estão. Isto não é uma reescrita.
**Corrigido:** apenas os oito itens da seção 4, e nada além deles.

Não há autorização para reescrever argumento, mudar enquadramento epistemológico, acrescentar ou remover obras do acervo por mérito científico, nem alterar as hipóteses.

---

## 3. Onde as coisas estão

| Item | Caminho |
|:---|:---|
| Gerador do `.docx` | `scripts/gerar_referencial_teorico_docx.py` (função `build_document`, linha 156) |
| Acervo lido pelo gerador | `data/acervo_sanitizado_111.json` (carregado na linha 818) |
| Acervo pré-expurgo | `data/acervo_sanitizado.json` (112 registros) |
| Sanitizador que produz o acervo | `scripts/sanitizar_acervo_bibliografico.py` (campos lidos de `parts[4]` / `parts[5]`, linhas 73 e 96) |
| Figuras | `docs/dissertacao/figuras_referencial/figura_1..5*.png` |
| PDF e `.docx` atuais | `docs/dissertacao/` e `docs/bibliografia/` |

Reemita pelo gerador. Não edite o `.docx` à mão: o documento tem de continuar reproduzível por script.

---

## 4. Os oito defeitos a corrigir

Cada um abaixo foi conferido no artefato, não inferido.

### C-1 — A contagem de 111 está inflada; são 109 arquivos distintos

Há **dois pares byte-idênticos** (mesmo SHA-256), cada par contado uma vez como `Relacionada` e uma vez como `Triagem`:

| Par | SHA (prefixo) | Registros | Observação |
|:---|:---|:---|:---|
| 1 | `f3045e3d` | nº 045 (`Relacionada`) e nº 089 (`Triagem`) | mesmo arquivo `admin,+RBG_Ano_7_n_2_2006_73_85.pdf`, 13 p. |
| 2 | `2d42f6c3` | nº 088 (`Relacionada`) e nº 098 (`Triagem`) | 14 p.; nomes de arquivo e títulos diferentes para o mesmo conteúdo |

**Ação:** remover a cópia redundante de cada par, mantendo **o registro de melhor metadado** — atenção: no par 2, o título do nº 098 ("...na Bacia Hidrográfica do Córrego Baguaçu-SP") é mais completo que o do nº 088 ("Estimativa de Perda de Solos por Erosão Laminar"); preserve o título melhor e a categoria substantiva (`Relacionada`), não a de triagem.

Aritmética resultante, a conferir na reemissão: **35 Direta + 53 Relacionada + 19 Triagem + 2 Seminal = 109**.

Atualize os literais `111` em **todas** estas linhas de `scripts/gerar_referencial_teorico_docx.py`: 5 (docstring), 157 (print), 227 (subtítulo da capa), 244 (linha "Data de Consolidação / Versão"), 286 (callout da §1), 520 (consolidação da §2.3), 526 (legenda da Figura 5), 544 (abertura da §3), 800 (comentário), 804 (título da §5), 814 (abertura da §5) e 854 (fonte da Tabela 2). Atualize também as contagens por categoria na linha 520.

> **Fora da sua alçada, relate e não decida:** os registros **nº 022 e nº 023** são o **mesmo artigo** (Arabameri et al., 2021, "Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms") em duas versões de PDF — repositório UTS (26 p.) e editora (31 p.), SHAs distintos. Se o pesquisador decidir contá-los como uma obra, o total passa a **108** (34 Direta + 53 + 19 + 2). **Registre a questão e aguarde**; não funda os dois por conta própria. Igualmente, **não decida** se as 19 obras de `Triagem` devem contar como "canônicas": isso é do pesquisador.

### C-2 — A frase de higienização afirma uma verificação que não ocorreu (o mais grave)

Linha 814 do gerador afirma, sobre os registros da Tabela 2:

> "Todos os registros foram integralmente higienizados a partir da leitura da folha de rosto e consulta aos identificadores digitais canônicos (DOI / CrossRef), garantindo autores reais, anos exatos e títulos completos."

**Isso é falso e demonstrável no próprio acervo**: 9 registros têm título inutilizável, 29 têm título truncado, nenhum registro tem campo de DOI, e o nº 009 está atribuído a uma obra que não foi localizada (ver C-5). A frase é exatamente o tipo de asserção que R-L2 e R-L3 proíbem: declara conferência no primário sem que ela tenha acontecido.

**Ação:** substituir por declaração verdadeira do estado do acervo, dizendo o que foi feito (catalogação por leitura de arquivo e hash SHA-256 de arquivo único) e o que **não** foi feito (conferência de folha de rosto e de DOI/CrossRef registro por registro), com a dívida datada. Não remova a frase sem pôr a declaração honesta no lugar: o leitor precisa saber o grau de verificação.

### C-3 — 38 registros (34%) com metadado quebrado

Nove títulos não são títulos:

| Nº | Campo `title` atual |
|:---|:---|
| 037 | `eISSN: 2358-1778` |
| 040 | `Caminhos de Geografia Uberlândia-MG v. 23, n. 87 jun./2...` |
| 041 | `Caminhos de Geografia Uberlândia-MG v. 24, n. 92 abr./2...` |
| 043 | `Jataí-GO` |
| 050 | `2019` |
| 053 | `PÁGINA 317` |
| 058 | `You are free: to copy, distribute and transmit the work...` |
| 075 | `Caminhos de Geografia Uberlândia-MG v. 23, n. 87 jun./2...` |
| 078 | `Nota Técnica` |

Outros 29 terminam em `...` por truncagem.

**Ação:** recuperar título e autoria **a partir do próprio arquivo PDF** (folha de rosto), que é leitura de fonte, não inferência. Vários nomes de arquivo já carregam o título — por exemplo o nº 041 (`63077+POTENCIAL+À+EROSÃO+LAMINAR+NA+BACIA+HIDROGRÁFICA+DO+RIBEIRÃO+DOURADINHO,+NO+TRIÂNGULO+MINEIRO_.pdf`). Onde o nome do arquivo for a fonte do título, **marque o registro como recuperado do nome do arquivo, pendente de conferência na folha de rosto.**

**Onde não for recuperável, escreva `[título não extraído — conferir no primário]`.** Deixar um aviso de licença Creative Commons ou um ISSN no lugar do título é pior do que declarar a lacuna, porque a lacuna é visível e o metadado falso não é. **Nunca preencha por inferência de memória.**

### C-4 — Campo `eixo` truncado em 35 caracteres em 109 dos 111 registros

Todos os valores de `eixo` têm exatamente 35 caracteres (`"Modelagem Preditiva com Machine Lea"`, `"Validação Regional / Estrutura Fund"`), e o nº 043 tem `eixo = "n.24"`, que é número de fascículo vazado para o campo.

A truncagem **não está no gerador** — nasce acima dele, em `scripts/sanitizar_acervo_bibliografico.py`, que lê os campos por posição (`parts[4]`, `parts[5]`) de uma fonte de largura fixa.

**Ação:** corrigir no sanitizador para não truncar, regerar o JSON do acervo e corrigir o `eixo` do nº 043. A Tabela 2 passa a exibir o eixo completo.

### C-5 — O nº 009 está atribuído a uma obra que não foi localizada

Registro nº 009: título "Enhancing predictive modeling of interrill and rill erosion susceptibility using machine learning", autoria **"Ferreira et al. (2022)"**, **1 página**.

Busca em indexadores não localizou nenhuma obra de Ferreira (2022) com esse título. A única obra com esse título é **Abdo et al. (2026)**, "Enhancing predictive modeling of interrill and rill erosion susceptibility **in the Eastern Mediterranean using stacking ensemble** machine learning algorithms" (*Soil and Tillage Research*) — confirmada em registro de repositório institucional, e que é **justamente a obra que a §2.2 apresenta como a única exceção aderente da lacuna**.

A hipótese mais provável é que o nº 009 seja essa mesma obra (o PDF de 1 página sendo página de acesso/resumo), com autor e ano errados. **Isso não pode ser resolvido por dedução.**

**Ação:** abrir o PDF do nº 009 e resolver na fonte. Se for a obra de Abdo, corrigir autoria e ano **e** declarar na §2.2 que a obra da lacuna consta do acervo (hoje a narrativa a trata como achado externo, e o inventário a traz sob outro autor). Se for obra distinta, registrar autoria e DOI reais. Até a conferência, o registro fica marcado como **atribuição não conferida**. Não o remova e não o renomeie por suposição.

### C-6 — O funil cita 122 itens num arquivo que tem 53

Linha 506 afirma "ingestão de 122 itens brutos no manifesto inicial de seleção do projeto (`manifesto_selecao.json`)". O arquivo `docs/bibliografia/manifesto_selecao.json` versionado tem **53 entradas**, com apenas `filename`, `orig_rel_path`, `new_rel_path` e `justification` — nenhum campo bibliográfico.

**Ação:** ou aponte o artefato que de fato contém os 122 itens, ou declare que o manifesto versionado reflete um estágio posterior da curadoria e que o lote de 122 não é reconstituível a partir do repositório. O número inicial de um funil de revisão sistemática precisa ser rastreável; se não é, isso se declara.

### C-7 — O acervo não é verificável por terceiro

A §2.3 (linha 520) afirma 111 obras "integralmente arquivados em disco local com hashes criptográficos SHA-256", e a fonte da Tabela 2 (linha 854) aponta `docs/bibliografia` e `docs/auditorias/externa_a/`. Mas **só 36 PDFs estão versionados no repositório**; os demais existem apenas no disco local do pesquisador.

Os hashes estão no JSON, mas os arquivos que eles resumem não estão no repositório — logo **nenhuma banca pode reexecutar a conferência**. "Auditoria forense" que o examinador não consegue reproduzir é declaração, não auditoria.

**Ação:** declarar com precisão quantos arquivos estão versionados e quantos estão apenas em disco local, e corrigir a indicação de fonte da Tabela 2 para apontar onde o acervo realmente está. Decidir se o acervo passa a ser versionado é do pesquisador — **registre e relate**.

### C-8 — Os critérios de exclusão contradizem o acervo

O Quadro 2 exclui "estudos exclusivos de voçorocas/ravinas (gullies) sem modelagem laminar" e "notas técnicas preliminares". No entanto:

- **8 das 35 obras `Direta` são de suscetibilidade a voçorocas**: nº 007, 011, 019, 020, 022, 023, 033 (e o nº 009, de interrill/rill). Títulos como "Comparison of machine learning models for gully erosion susceptibility mapping" e "Head-cut gully erosion susceptibility mapping" indicam estudo exclusivamente de voçoroca.
- O nº 078 é `Nota Técnica` (`Relatorio_Tecnico_Suscetibilidade.pdf`).

Isso é defensável se as obras foram mantidas **pelo método** (ensembles, SHAP, validação espacial) e não pelo tipo de erosão — o que é coerente com o Eixo C. Mas, **como o critério está redigido, o acervo o viola.**

**Ação:** reescrever o critério de exclusão para distinguir "excluído quanto ao objeto" de "mantido quanto ao método", declarando explicitamente que obras de voçoroca entram como referência metodológica. Alternativamente, reclassificá-las. **A escolha entre as duas é do pesquisador** — proponha o texto e aguarde.

---

## 5. O que NÃO mudar

- Estrutura, ordem e redação das seções 1 a 6 fora dos pontos acima.
- As cinco figuras e suas legendas (salvo a Figura 5, cuja legenda carrega a contagem — C-1).
- Formatação: paleta, fontes, tabelas, callouts, margens.
- A alegação de lacuna em si: a obra de Abdo foi confirmada como existente e o argumento de escassez **não** foi refutado. Corrija a atribuição do nº 009, não o argumento.
- O expurgo R-L1 já feito: a passagem de `acervo_sanitizado.json` (112) para `acervo_sanitizado_111.json` (111) removeu corretamente o item autorreferente nº 106, "Curadoria Metodológica SAREL (2026)". Isso está certo e **deve permanecer**.

## 6. Limites de alçada (CLAUDE.md §2 e §2-A)

- **Nunca invente, infira de memória ou extrapole referência.** Na dúvida sobre se a fonte sustenta a afirmação, ela não sustenta.
- Título, autor ou ano que não saírem do PDF ficam marcados como lacuna explícita.
- Não decida: a fusão de nº 022/023, o status "canônico" das obras de `Triagem`, a reclassificação das obras de voçoroca, e o versionamento do acervo. Proponha e relate.
- Não toque em `src/config/decisoes.ts`, limiar ou estado de decisão.

## 7. Entregáveis

1. `.docx` reemitido pelo gerador, em `docs/dissertacao/`, preservando o nome base `Estrutura_Referencial_Teorico_Luis_Alfredo_2858827` (acrescente sufixo de versão/data se não for sobrescrever).
2. `scripts/gerar_referencial_teorico_docx.py` e `scripts/sanitizar_acervo_bibliografico.py` atualizados.
3. Acervo regerado, com o arquivo antigo preservado para rastreabilidade.
4. **Relatório de correções** em `docs/auditorias/`, listando C-1 a C-8, o que foi corrigido, o que ficou como lacuna declarada e o que aguarda o pesquisador. Inclua a tabela de reconciliação da contagem (registros / arquivos distintos / obras distintas).
5. Lista explícita dos registros que seguem com **atribuição ou título não conferidos**, para a dívida ficar visível.

## 8. Verificação pós-execução (CLAUDE.md §6)

```bash
npm run typecheck
npm test
npm test src/lib/seguranca/padroesProibidos.test.ts
```

E, sobre o acervo regerado, confira e relate:

- contagem de registros, de SHAs distintos e a soma das categorias (têm de fechar entre si);
- ausência de SHA duplicado;
- ausência de `title` com menos de 18 caracteres ou iniciando por ISSN, capa de periódico, ano isolado, número de página ou texto de licença;
- ausência de `eixo` com exatamente 35 caracteres (sinal de truncagem remanescente);
- nenhum registro autorreferente (R-L1).

## 9. Autorização de git

CLAUDE.md §1: nenhuma operação que altere o repositório remoto ou o histórico acontece sem autorização explícita do pesquisador, dada na conversa, para aquela operação. Autorização é específica e não se estende.

O preenchimento deste bloco é do pesquisador. **Quem redigiu este prompt não pode preenchê-lo.**

```
Commit autorizado:   [ ] sim   [ ] não        Data: ____/____/______
Push autorizado:     [ ] sim   [ ] não        Branch: _______________________
Assinatura: ______________________________
```

Sem este bloco preenchido: escreva os arquivos na árvore de trabalho, informe os caminhos completos ao pesquisador e **pare**. Se o Stop hook exigir commit ou push, relate em uma linha que ele está bloqueando e qual operação exige, e espere — a exigência do hook não é autorização.
