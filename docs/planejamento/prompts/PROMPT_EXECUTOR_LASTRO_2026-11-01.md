# Tarefa: lastro — obter os primários que sustentam os gates e auditar as quitações por cruzamento

**Versão:** 1.0 — 1 de novembro de 2026
**Base do trabalho:** `f63d8a5` (`sarel/executor-2026-10-09`)
**Norma obrigatória:** [`docs/metodologia/NORMA_LASTRO_CIENTIFICO.md`](../../metodologia/NORMA_LASTRO_CIENTIFICO.md) — R-L1 a R-L5.
**Origem:** [Consolidação dos achados verificados](../CONSOLIDACAO_ACHADOS_VERIFICADOS_2026-11-01.md), achados `N-01`, `N-07`, `N-11`, `N-13`, `N-14`; [Planejamento sequencial](../PLANEJAMENTO_SEQUENCIAL_CORRECOES_2026-11-01.md), Fase 1.

> **Por que este bloco é bloqueante, e não documentação.** Duas decisões estruturais e a leitura do desfecho principal dependem de fontes não conferidas: `G-01` (fatorial) se apoia em Cochran §5A.12; `G-02` (estimando) em Olofsson et al. (2014); a interpretação de D25 depende do fator P de D22, cuja tabela veio de saída de IA. E dois dos cinco fatores do RUSLE estão declaradamente degradados, **ambos enfraquecendo o competidor** — de modo que lastro, aqui, é **especificação do competidor**, não bibliografia.

---

## 1. Papel e limites

A Seção 6 da Norma é o seu mandato, literalmente: *"Assistente e executor **encontram, conferem, arquivam e relatam** — e param quando falta decisão."*

**Pode:** buscar, obter por meio legítimo, arquivar com hash, escrever verificações, reabrir dívida declarada, estender a trava, reconstruir o inventário, propagar marca de pendência.

**Não pode:** escolher valor, metodologia ou fonte; alterar `src/config/decisoes.ts`; alterar `docs/metodologia/NORMA_LASTRO_CIENTIFICO.md` (é norma do pesquisador — entregue redação proposta no relatório); promover decisão a `"decidida"`.

**Três proibições absolutas**, da Seção 5 da Norma:

1. **Nunca invente, infira de memória ou extrapole uma referência.** É falta mais grave que a ausência, porque a ausência é visível e a invenção não.
2. **Na dúvida sobre se a fonte sustenta a afirmação, ela não sustenta.** Marque como não conferida (R-L2) e siga.
3. **Autorreferência não é lastro** (R-L1). "Metodologia PPGTCA", "Planejamento V3", caminho em `docs/`, linha de código ou outra decisão do registro **não referenciam nada**.

**Obtenção apenas por meio legítimo:** DOI do editor, página institucional ou pessoal do autor, repositório de acesso aberto, acervo da universidade. **Não** use repositórios de cópia não autorizada. Se a obra não estiver acessível por via legítima, o resultado correto é **dívida declarada**, não cópia obtida de qualquer jeito.

### Autorização de git — a ser preenchida pelo pesquisador

CLAUDE.md §1: nenhuma operação de git sem autorização explícita e específica. **Este prompt não concede autorização.**

- [ ] `git commit` na branch ______________________
- [ ] `git push` na branch ______________________
- [ ] nenhuma das duas — escreva, relate os caminhos e pare

Atenção ao peso dos binários: PDFs de livro podem ser grandes. Confirme com o pesquisador antes de versionar arquivo acima de ~25 MB.

---

## 2. O que já foi feito em 31/10 — não refaça

O prompt `PROMPT_EXECUTOR_CLI_POOL_E_LASTRO_COCHRAN_2026-10-31.md` já tratou de Cochran e Kish. O executor escolheu corretamente o caminho (b): declarar a síntese como não conferida. O produto está em `docs/verificacoes/fontes/cochran1977/cochran_1977_sampling_techniques_ch5a12.md`, que se autodeclara `NAO_CONFERIDO_NO_PRIMARIO` e registra a fronteira do que a fonte sustenta.

**Isso está certo e não deve ser desfeito.** Sua tarefa não é redocumentar: é **tentar obter o primário** e, não obtendo, **tornar o impedimento operante** no gate.

---

## 3. Item 1 — Obter os primários que sustentam gates

| Obra | Sustenta | Via provável | Se não obtiver |
|---|---|---|---|
| **Olofsson et al. (2014)**, Remote Sensing of Environment 148:42-57, `10.1016/j.rse.2014.02.015` | D23 (regras de inferência), **G-02**, `G-09` | DOI; possível versão de autor em repositório institucional | dívida declarada; `G-02` fica sem lastro para a linguagem de área |
| **King & Zeng (2001)**, Political Analysis 9(2):137-163, `10.1093/oxfordjournals.pan.a004868` | correção a priori de D23, `G-09` | o autor mantém cópia pública dos próprios artigos | dívida declarada |
| **Agresti & Coull (1998)**, The American Statistician 52(2):119-126, `10.1080/00031305.1998.10480550` | `SE <= 0,144` de D11.2 | DOI | ver item 5 — o número é auto-verificável |
| **Brown, Cai & DasGupta (2001)**, Statistical Science 16(2):101-133 | idem | Statistical Science costuma ser de acesso aberto | idem |
| **Cochran (1977)**, *Sampling Techniques*, 3ª ed., ISBN 0-471-16240-X, §5A.12, p. 138-140 | **G-01 opção 1** (estratos colapsados) | **livro** — acervo da universidade ou aquisição; improvável por rede | item 4 |
| **Bertoni & Lombardi Neto**, *Conservação do Solo* | tabela de P de D22, `G-10` | **livro** — idem | dívida declarada; D22 permanece não operacional |

**Procedimento para cada obra obtida (R-L3):**

1. Arquivar em `docs/verificacoes/fontes/<autor><ano>/` com o nome no padrão já usado no acervo (compare `rufino1993/`, `hyndman1996/`, `zhu2013/`).
2. Registrar o **SHA-256** do arquivo.
3. Escrever a verificação em `docs/verificacoes/<data>_<obra>.md` com, obrigatoriamente, **uma seção dizendo o que a fonte NÃO sustenta**. A R-L3 existe porque *"esticar citação verdadeira é a forma mais comum de corrompê-la"*.
4. Declarar a página conferida, não apenas o capítulo.
5. Acrescentar a obra a `docs/bibliografia/` com autor, ano, título e DOI (R-L5).

**Procedimento para cada obra não obtida (R-L4):**

1. Registrar dívida declarada **com data e motivo**, no formato que o projeto já usa.
2. Acrescentar a entrada à lista `DIVIDA_DECLARADA` de `src/config/lastroCientifico.test.ts`.
3. Declarar no relatório **qual gate fica sem lastro** e o que isso impede.

**Aceite:** toda obra da tabela está ou arquivada com hash e verificação, ou com dívida declarada datada e entrada na lista do teste. Nenhuma fica em estado intermediário.

---

## 4. Item 2 — Tornar operante o impedimento a `G-01` opção 1 (N-01)

Se Cochran não for obtido no primário, a opção 1 de `B-01`/`G-01` — colapsar estratos — permanece apoiada em citação não conferida. O projeto já sabe disso desde 31/10; o que falta é o impedimento **chegar ao ponto de decisão**.

**Faça:**

1. Escrever em `docs/verificacoes/2026-11-01_impedimento_lastro_G01.md` um registro curto que declare: a opção 1 depende do estimador de variância colapsada; o lastro disponível é síntese não conferida; a norma exige homologação no primário antes de emenda a D12/D16.
2. **Registrar a saída, que é a informação útil ao pesquisador:** as opções 2 (declarar S1×K̂2 fora do domínio de D07) e 3 (desenho condicional) **não** usam o estimador colapsado e **não dependem de Cochran**. O impedimento recai sobre a opção 1, não sobre o gate inteiro.
3. Referenciar esse registro na tabela de gates do planejamento sequencial.

**Não** decida entre as saídas. Continua sendo do pesquisador.

**Aceite:** existe um arquivo de verificação que um leitor do gate encontra, dizendo o que está impedido e qual é a alternativa sem impedimento.

---

## 5. Item 3 — Auditar as três quitações por cruzamento (N-13) — **prioritário**

A Norma, na seção *"Três das sete são baratas"*, orienta quitar dívidas por cruzamento com fontes que o registro já possui. **Uma dessas quitações foi consumada por esticamento de citação.**

| Entrada | Fonte indicada | Afirmação que precisa de lastro | Situação verificada |
|---|---|---|---|
| **D02** | Rikimaru et al. (2002), via D20 | os cortes `BSI > 0,10`, `NDVI < 0,40`, `BSI < 0,00`, `NDVI > 0,65` | **quitada** — `D02` saiu da lista de dívidas e `decisoes.ts:86` cita Rikimaru. Mas Rikimaru é mapeamento de densidade de dossel: sustenta **o índice BSI**, não os cortes |
| **P05** | Zanaga et al. (2022), via D07 | as classes do WorldCover | as classes são definidas pelo próprio produto — cruzamento plausível, **conferir** |
| **P02** | Roberts et al. (2017), via P01 | **espaçamento de thinning de 1.000 m** | Roberts trata de estratégias de validação com estrutura espacial; **não prescreve 1 km para seleção de candidatos** — conferir |

**Por que P02 é o mais urgente dos três.** Pela tabela de ocupação (`docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md`), o thinning de 1 km converte `E_1_2_2` de 4 candidatos (viável) em 3 (inviável) e remove a única reserva de `E_1_3_2` (5 → 4). **Sem o thinning haveria 3 estratos inviáveis, não 4.** Um parâmetro que remove um estrato do desenho não pode estar lastreado por esticamento.

**Faça:**

1. Para cada uma das três, abrir a fonte indicada e responder, por escrito: **qual frase exata a fonte sustenta?** Compare com a afirmação que a entrada precisa lastrear.
2. O que não passar volta a `DIVIDA_DECLARADA`, com data e motivo. Para D02, isso significa **reabrir** uma dívida hoje registrada como quitada — faça-o e explique no relatório.
3. Corrigir a referência de D02 **no relatório, não em `decisoes.ts`**: entregue a redação proposta, que restrinja Rikimaru ao índice BSI e declare os cortes como convenção do projeto. A emenda é do pesquisador.
4. **Decompor a inviabilidade** no registro de verificação: quanto do déficit do quadrante S1×K̂2 é estrutural e quanto é efeito do thinning. Essa decomposição é insumo de `G-01` (N-14).
5. Entregar, **no relatório**, redação proposta de emenda à Norma: toda quitação por cruzamento declara a frase que a fonte sustenta. A trava é *"deliberadamente permissiva"* por desenho e não pega isso — o reforço é de norma, não de teste.

**Aceite:** as três quitações têm veredito escrito com a frase sustentada; o que falhou está reaberto como dívida; a decomposição estrutural × thinning está registrada; as redações propostas estão no relatório e não em `decisoes.ts` nem na Norma.

---

## 6. Item 4 — Inventário e trava (L-05)

**Verificado:** o acervo `docs/verificacoes/fontes/` tem 49 arquivos, com PDFs primários de Renard (1997), Rufino (1993), Waltrick (2010 e 2015), Zhu (2013), Desmet & Govers (1996), Hyndman & Fan (1996), Schmidt (2019) e NEPAR (2011). Do `INVENTARIO_SELECAO_BIBLIOGRAFICA.md`, extraindo os caminhos sob `fontes/`, **6 de 8 existem**.

A afirmação de 01/11 de que *"a matriz tem 7 de 41 caminhos existentes"* **não se reproduz** e não deve ser citada. O defeito real é de **sincronia nos dois sentidos**: obras citadas sem caminho rastreado, e arquivos no acervo que o inventário não lista.

**Faça:**

1. Reconstruir o inventário com, por obra: autor, ano, título, DOI, caminho no acervo (se houver) e status de conferência (`conferido_no_primario` / `nao_conferido` / `divida_declarada`).
2. Listar, em seção própria, os arquivos presentes no acervo que o inventário não referencia.
3. **Estender** a trava de `src/config/lastroCientifico.test.ts` para verificar que todo caminho declarado no inventário **existe no disco**. Preserve o mecanismo de *ratchet* e a lista de dívida: ela está correta e deve ser mantida, não substituída. A trava atual pega ausência de lastro, não qualidade da fonte — e isso é intencional; não tente fazê-la julgar qualidade.

**Aceite:** o teste falha se um caminho do inventário não existir; passa no estado corrigido; a lista de dívida continua funcionando como antes.

---

## 7. Item 5 — Marcas de pendência (L-08, L-09)

1. **L-08 — fator R.** `src/lib/rusle/fatorR.ts:279` tem `pendenteVerificacao: true`, em um único lugar. Propagar ao tipo de proveniência, à exibição no Inspetor e ao CSV do pacote de reprodutibilidade, para que a pendência não seja invisível ao leitor da matriz.
   **Não refaça o lastro do fator 9,81.** A emenda de D13 de 09/10/2026 já o resolve: é a conversão kgf·m → J via `g`, conferida em Waltrick (2010), que traz os coeficientes já convertidos (`18,64 × 9,81 = 182,86`; `5,73 × 9,81 = 56,21`). A pendência remanescente é da **forma funcional e dos coeficientes da equação regional**, não da constante.
2. **L-09 — `SE <= 0,144`.** Registrar na verificação de D11.2 que o valor é **auto-verificável por aritmética elementar** (`0,5/√12 = 0,1443`, o erro-padrão binomial máximo com n = 12), de modo que a indisponibilidade de Agresti & Coull (1998) e Brown et al. (2001) **não** compromete o número — compromete apenas a atribuição das propriedades intervalares a essas obras. Distinga as duas coisas.

**Aceite:** a marca do fator R aparece no CSV e na UI; a verificação de D11.2 distingue o número auto-verificável da atribuição bibliográfica.

---

## 8. Item 6 — Fator P e a especificação do competidor (N-07)

**Não decida.** Este item é preparação de decisão para `G-10`.

Levante e escreva, em `docs/verificacoes/2026-11-01_especificacao_competidor_rusle.md`:

1. O estado dos cinco fatores do RUSLE, com a direção do viés de cada um sobre a comparação de D25. Dois já estão declarados no registro:
   - **R** é sucedâneo declarado do EI30 — o CHIRPS é diário e o EI30 exige intensidade em 30 minutos (valor de D13);
   - **P** está fixo em 1,0 (`src/lib/rusle/linhaDeBase.ts:8,41,74`); a tabela de D22 é de origem em saída de IA, não conferida, e não está implementada.
2. A citação da justificativa de D13, que já registra a consequência: *"parte da distância entre o RUSLE e os competidores pode vir da degradação do fator R, não da inferioridade do modelo físico, e essa possibilidade precisa estar escrita antes dos resultados."*
3. As opções de `G-10` com o efeito de cada uma sobre a leitura do desfecho, **sem recomendar**.

**Aceite:** existe um documento que, lido antes dos resultados, permite ao pesquisador declarar a limitação conjunta R+P na dissertação.

---

## 9. Fora de escopo

1. **Não** altere `src/config/decisoes.ts`. Toda emenda proposta vai para o relatório.
2. **Não** altere `docs/metodologia/NORMA_LASTRO_CIENTIFICO.md`. Redação proposta vai para o relatório.
3. **Não** implemente a tabela de P de D22, mesmo se encontrar a fonte. Implementar depende de `G-10`.
4. **Não** desfaça o trabalho de 31/10 sobre Cochran e Kish.
5. **Não** decida entre as saídas de `B-01`, nem altere P02.
6. **Não** toque em código de matriz, exportação ou `scripts/d25/`.
7. **Não** substitua a trava de lastro; estenda-a.
8. **Não** abra pull request.

---

## 10. Verificação e relatório

```bash
npm run typecheck
npm test src/config/lastroCientifico.test.ts
npm test
```

Grave em `docs/auditorias/RELATORIO_LASTRO_2026-11-01.md`:

1. Obra por obra: obtida ou não, por qual via, hash, caminho, verificação escrita, ou dívida declarada com motivo.
2. Veredito das três quitações por cruzamento, com **a frase que cada fonte sustenta**.
3. Decomposição da inviabilidade de S1×K̂2 entre déficit estrutural e efeito do thinning.
4. Redações propostas: emenda de D02, emenda da Norma quanto a quitação por cruzamento.
5. Quais gates ficam sem lastro, e o que isso impede.
6. Estado da trava e do inventário antes e depois.

**Resposta final:** 5 a 10 linhas; tabela obra → status; tabela quitação → veredito; gates impedidos; o que exige decisão do pesquisador.

**Fim do prompt.** Nenhuma decisão, parâmetro ou norma é alterado por este arquivo.
