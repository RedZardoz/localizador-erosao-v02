# PROMPT N — EXECUTOR SAREL — atualizar o tour metodológico

**Por que importa.** `src/config/tourMetodologico.ts` é o roteiro que o pesquisador vai percorrer,
botão a botão, na apresentação da dissertação. Ele descreve o sistema como era **antes** do
trabalho de 09 a 11 de novembro, e em dois pontos afirma coisas que o próprio registro desautoriza.

**Não altera decisão alguma. Não executa sorteio. Não toca o selo.**

---

## 0. LEITURA E PROTOCOLO

1. `docs/DESENVOLVIMENTO.md` integralmente.
2. `src/config/decisoes.ts`, bloco **D02** (EMENDA DE 06/10/2026) e **D10** (EMENDA DE 09/11/2026).
3. `src/lib/matriz/perfis.ts` — colunas reais do perfil `matriz-treino` e `DECLARACAO_ALVOS_MATRIZ`.
4. `scripts/d25/avaliacao_d25_referencia.py`, linhas 53-60 — os conjuntos de proibidos.
5. `docs/verificacoes/selo_publico_d16_2026-11-10.json`.
6. `npm run estado:verificar`.

Informe o branch e permaneça nele. **PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: saídas em
`docs/verificacoes/execucao/2026-11-11n/`. **Commit escrito depois do fato. `git push` confirmado.**

---

## TAREFA 1 — passo 8: a matriz ilustrativa mostra o que não é

`tourMetodologico.ts`, no passo "Central da Matriz de Treino (XGBoost)", o bloco de código
ilustrativo monta a linha assim (linhas ~433-444):

```ts
ndvi, bsi,
fator_c: (1 - ponto.propriedades.ndvi) / 2,
fator_k, fator_ls, fator_r,
declividade_graus,
rotulo_classe: ponto.classe === 'erosao' ? 1 : 0
```

**Três defeitos, de naturezas diferentes — não os trate como um só:**

1. **`fator_c` é preditor proibido.** `PROIBIDOS_COMO_PREDITOR` em
   `avaliacao_d25_referencia.py:53` veda `RUSLE_Fator_C`, `RUSLE_Fator_P`, `RUSLE_A` e
   `RUSLE_Perda_Solo_t_ha_ano`, por serem saída do competidor RUSLE. Mostrá-lo como coluna da
   matriz exibe à banca um desenho que o pré-registro recusa.
2. **`fator_ls` foi retirado da matriz por decisão** — não é proibido, foi removido. Permanece na
   planilha e na linha de base RUSLE. A distinção importa: um é veto, o outro é escolha.
3. **O alvo está errado.** `rotulo_classe` binário era o alvo antigo. O canônico é
   `Fracao_Erodida`, contínuo (`DECLARACAO_ALVOS_MATRIZ`, papel `primario`), com
   `Classe_Alvo_Binaria` como secundário e `Rotulo_Classe` como escala de origem.

**`fator_k` e `fator_r` estão corretos** — correspondem a `RUSLE_Fator_K` e `RUSLE_Fator_R`, que
constam da matriz como insumos. Não os remova.

**Correção:** reescreva o exemplo usando nomes reais de coluna do perfil `matriz-treino`, com
`Fracao_Erodida` como alvo. Não invente colunas: leia a lista de `perfis.ts` e use um subconjunto
representativo, dizendo no texto que é recorte ilustrativo de uma matriz mais larga.

---

## TAREFA 2 — passo 3: triagem não é definição

Linha ~183:

```
"Erosão laminar ativa exige BSI > 0.10 e NDVI < 0.40 (solo descoberto com cicatriz de
arraste mineral). Controle sob SPD exige BSI < 0.00 e NDVI > 0.65."
```

A EMENDA DE 06/10/2026 a D02 estabelece que esses cortes são **critério de triagem de candidatos e
ajuda visual, não rótulo** (Regra 4: nada calculado vira rótulo). E a conferência no primário de
09/11/2026 estabeleceu que os quatro valores são **convenção operacional do projeto**, não
atribuídos a Rikimaru et al. (2002), que formula o índice mas não prescreve corte algum.

O verbo "exige" transforma triagem em definição. Reescreva para linguagem de candidatura, no modelo
que `src/components/inspetor/GraficoSerieTemporal.tsx` já usa — "Candidato Espectral (NDVI < 0.40 ·
D02)" — e declare, em uma frase, que os cortes são convenção do projeto, com a análise de
sensibilidade pendente.

O mesmo vale para o trecho de código na linha ~203 (`bsi.gt(0.10).And(ndvi.lt(0.40))`): mantenha o
código, corrija o nome da variável e o comentário para falar de candidatos, não de erosão.

---

## TAREFA 3 — passo 9: a contagem das decisões

Título atual: `"Livro de Decisões Metodológicas (D01 a D19)"`, repetido no corpo (linha ~467).

O registro tem hoje **26 decisões (D01 a D26) e 16 parâmetros**. Confirme você mesmo com
`grep -cE "^  D[0-9]+:" src/config/decisoes.ts` e `grep -cE "^  P[0-9]+:"`, e grave a saída.

**Não escreva o número à mão.** Derive-o de `REGISTRO_DECISOES`/`PARAMETROS` em tempo de execução,
para que o passo nunca mais envelheça. Se a estrutura do tour não admitir valor dinâmico no título,
diga isso no relatório e proponha onde ele caberia.

---

## TAREFA 4 — o que a dissertação conquistou não está no tour

Em 715 linhas há quatro menções somadas a solo nu, estrato, sorteio, GEOS3 e NBR2. Faltam os
resultados centrais das duas últimas semanas. Acrescente passos — a numeração e o encaixe são sua
decisão de desenho:

**(a) Máscara de solo exposto GEOS3.** A conjunção de cinco testes: NDVI em [0,00; 0,25], NBR2 em
[0,00; 0,075], B4 ≥ B3 e B3 ≥ B2 em Sentinel-2. Explique que o NBR2 é o componente no SWIR que
separa palhada de solo mineral, e que o NDVI isolado não faz essa separação (Daughtry et al., 2001;
2004; Hively et al., 2021, todos no acervo). Declare a transposição de Landsat 5 TM para
Sentinel-2 como hipótese não validada.

**(b) Dimensão Ê medida.** 677 de 677 candidatos, 148 a 1.011 observações válidas por ponto
(mediana 477), nenhum abaixo do piso de 12 de D11.2. Distribuição assimétrica com 181 pontos
(26,7 %) em zero exato; tercis em 0,0116 e 0,0488; ocupação 226 / 225 / 226.

**(c) Desenho amostral realizado.** 67 polígonos de 72 nominais, 34 de treino e 33 reservados,
336,34 ha. **Use o leitor único** `src/lib/gee/seloPublicoD16.ts` criado no Prompt M; não repita
números. O estrato Ŝ₁ × Ê₃ × K̂₂ é vazio porque a bacia tem apenas nove candidatos de relevo plano
com erodibilidade elevada, e o maior Ê entre eles é 0,0331, abaixo do corte de 0,0488 — achado
sobre a bacia, não falha do método. Cinco dos nove estratos de K̂=2 operam em censo, sem suplente.

**(d) Cadeia de verificação.** Semente pré-registrada, oito invariantes do selo, selo público
redigido que preserva o cegamento, e reprodutibilidade confirmada em clone limpo. Aponte para
`docs/dissertacao/Verificacao_e_Validacao_SAREL_2026-11-11.docx`.

Mantenha o padrão dos passos existentes: fórmula quando houver, símbolos explicados, referência, e
bloco de código quando ilustrar.

---

## TAREFA 5 — travas do tour

`src/config/tourMetodologico.test.ts` hoje verifica estrutura, não conteúdo. Acrescente:

1. nenhum passo contém as cadeias `"D01 a D19"`, `"Classe 1"`, `"Classe 0"`, `fator_ls` ou
   `rotulo_classe`;
2. nenhum passo apresenta coluna de `PROIBIDOS_COMO_PREDITOR` como preditor da matriz — leia o
   conjunto do avaliador, não o escreva à mão;
3. a contagem de decisões citada no tour bate com `REGISTRO_DECISOES`;
4. os números de desenho citados no tour batem com o leitor do selo público;
5. **meta-teste**: injete um passo sintético violando (1) e prove que a trava acusa.

---

## TAREFA 6 — correção de redação pendente do Prompt M

Em `src/lib/gee/seloPublicoD16.ts`, o cabeçalho afirma: *"se o selo estiver ausente ou inválido,
devolve estado declarado indisponível"*. O módulo faz **import estático** do JSON, de modo que selo
**ausente** é erro de compilação, não estado em execução — o que é mais forte, e não mais fraco. O
caminho de indisponível só é alcançado com arquivo presente e conteúdo inválido.

Corrija a redação para descrever o que o código faz. Três linhas de comentário; não altere o código.

---

## TAREFA 7 — evidência e commit

`docs/verificacoes/2026-11-11n_tour_atualizado.md`: a tabela antes/depois dos três defeitos
corrigidos; os passos acrescentados e o que cada um afirma; as cinco travas com o resultado; e a
saída dos `grep` de contagem das decisões.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] T1 — `fator_c` removido como preditor; `fator_ls` removido; alvo passa a `Fracao_Erodida`
- [ ] T1 — `fator_k` e `fator_r` **mantidos**; colunas lidas de `perfis.ts`, não inventadas
- [ ] T2 — "exige" substituído por linguagem de candidatura; cortes declarados convenção
- [ ] T3 — contagem derivada do registro, não escrita à mão; saída dos `grep` gravada
- [ ] T4 — passos (a) a (d) acrescentados; números vindos do leitor único do selo
- [ ] T5 — as 5 travas passam, incluindo o meta-teste
- [ ] T6 — redação do cabeçalho de `seloPublicoD16.ts` corrigida; código intocado
- [ ] T7 — evidência escrita
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
- [ ] **`git push` confirmado contra o remoto**
