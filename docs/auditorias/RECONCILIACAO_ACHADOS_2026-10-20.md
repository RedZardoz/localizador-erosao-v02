# Reconciliação dos achados de auditoria — SAREL

**Data:** 20 de outubro de 2026
**Commit-base da medição:** `30681d0` (`sarel/executor-2026-10-09`)
**Escopo:** série A01–A54 das auditorias de 05/10/2026

---

## 1. O que isto é, e o que não é

Isto **não é a décima segunda auditoria.** Nenhuma linha de código foi reexaminada à procura de defeito novo. É o fechamento do livro: pegar os achados que já existem e atribuir a cada um um estado sustentado por evidência.

O déficit que isso cobre é real e foi medido: antes deste documento, ninguém sabia quantos dos achados estavam abertos. A informação existia espalhada por onze relatórios, uma tabela de mapeamento e mensagens de commit — e três prompts ainda declaravam "Estado: NÃO EXECUTADO" com seus blocos já commitados.

### Escopo e o que ficou de fora

A série **A01–A54** é a única com identificadores estáveis e com mapeamento declarado para remediação (C = correção, DEC = decisão do pesquisador, V = verificação). Os relatórios de 07/09 a 01/10 e o Zero Trust de 19/10 **não têm IDs estáveis** e ficam fora desta versão — entram quando receberem identificadores. Declarar isso é melhor do que fingir cobertura total.

### A regra que me impus

**Estado que não se determina por evidência fica `indeterminado`.** Nunca preenchido por suposição. Uma reconciliação que adivinha é pior que nenhuma: cria confiança falsa exatamente onde o projeto já se queimou uma vez.

---

## 2. O quadro

| Estado | Achados | |
|---|---|---|
| **Fechado** | 23 | Commit cujo assunto inicia pelo ID, ou decisão declarada resolvida em documento datado |
| **Aberto** | 16 | Pendência confirmada em código, ou verificação sem arquivo de prova |
| **Indeterminado** | 9 | Sem evidência em nenhuma direção; exige conferência do pesquisador |
| **Recusado na origem** | 6 | A própria auditoria refutou; sem ação |
| **Total** | **54** | |

---

## 3. O achado principal: o problema não é conserto que falta, é prova que falta

Dos 16 achados abertos:

- **13 estão abertos apenas porque a verificação não foi arquivada.** A correção foi feita e commitada; a prova não existe.
  `A02, A05, A15, A19, A20, A33, A35, A37, A38, A41, A44, A48, A49`
- **3 estão abertos por correção pendente** — o grupo 5, classificado como "cosmético" na origem.
  `A03 → C28`, `A34 → C29`, `A47 → C30`

Isto reformula o diagnóstico. **O SAREL conserta e não comprova.** E pela Regra 8 do próprio projeto — "asserções de verificação exigem arquivo físico de prova arquivado em `docs/verificacoes/`" — conserto não comprovado não está concluído.

A medição que sustenta isso: `docs/verificacoes/` tem 34 arquivos, e **o mais recente é de 02/10** — três dias **antes** da auditoria que definiu V1–V13. Nenhum deles pode ser prova dessas verificações. Não é inferência sobre intenção: é a regra do projeto aplicada ao calendário.

### Por que isso é uma boa notícia

Treze achados abertos por falta de prova custam muito menos que treze defeitos. O trabalho é rodar as verificações e arquivar a saída — não rediagnosticar nem reescrever código. E o resultado tem valor duplo: fecha os achados e cumpre a Regra 8, que hoje está sendo violada em silêncio.

---

## 4. O que depende de você: sete decisões

Os 9 achados indeterminados travam em **sete decisões** que não constam da tabela de aceite de 06/10:

| Decisão | Achados travados |
|---|---|
| DEC-1 | A04 |
| DEC-2 | A13 |
| DEC-3 | A11, A26, A29 |
| DEC-4 | A27, A29, A37 |
| DEC-8 | A17 |
| DEC-14 | A46 |
| DEC-15 | A28 |

**DEC-3 e DEC-4 são as de maior alcance**: juntas destravam quatro achados. Se o tempo for curto, são por onde começar.

Nota: existe uma **DEC-17** na branch `claude/affectionate-galileo-8abtjo` (commit `f589670`, que também revisa a condição da DEC-4 e um erro da DEC-11) que **não está** na branch do executor. Decidir o tronco (E-1 do planejamento) precede fechar estas decisões, ou elas serão decididas duas vezes.

---

## 5. O artefato não é este documento

Um relatório de reconciliação apodrece no dia seguinte. O que foi entregue tem três partes, e só a primeira é texto:

| Arquivo | Papel |
|---|---|
| `docs/auditorias/RECONCILIACAO_ACHADOS_2026-10-20.md` | Este texto. Foto de hoje. |
| `docs/auditorias/INDICE_ACHADOS.json` | **O livro-razão.** Versionado, uma entrada por achado, com estado, método e nota de evidência por remediação. |
| `scripts/reconciliar_achados.py` | **A trava.** Confronta o livro-razão com o histórico do git e reprova com código de saída 1 quando divergirem. |

É o mesmo princípio que o projeto já aplica ao código: achado não se fecha em prosa, se fecha em trava. Rodando hoje: **0 divergências, saída 0.**

Em CI (bloco GOV-6), o verificador passa a reprovar automaticamente quando alguém declarar fechado o que não tem evidência — ou deixar aberto o que já foi feito.

---

## 6. Limites, declarados

**Casamento por assunto de commit é proxy, não prova.** Ausência de commit não prova que nada foi feito; presença não prova que foi feito direito. O verificador ancora no início do assunto porque é a convenção do projeto (R9), mas um bloco pode ter sido executado dentro de um commit com outro prefixo.

**O estado "fechado" dos 23 não foi reauditado.** Diz que há evidência de execução, não que a execução está correta. Reabrir isso seria auditoria, não reconciliação.

**Os achados anteriores a 05/10 não entraram.** Os relatórios de setembro trazem achados em prosa, sem identificador. Atribuí-los a IDs agora seria inventar um mapeamento que ninguém declarou.

---

## 7. O que eu faria, nesta ordem

1. **CI com o verificador** (GOV-6). Sem isso, este índice vira outro documento que envelhece.
2. **Rodar as 13 verificações pendentes** e arquivar a saída em `docs/verificacoes/`. É o maior bloco aberto, e o mais barato — não exige rediagnóstico.
3. **Decidir DEC-3 e DEC-4**, que destravam quatro achados.
4. **Executar C28, C29 e C30** — lembrando que C30 foi mal triado na origem: as duas implementações de Pearson devolvem `r = 0` para correlação indefinida, e uma alimenta o detector de correlação espúria. Não é cosmético.
5. **Dar IDs aos achados dos relatórios de setembro** e incorporá-los ao índice, se quiser cobertura total.
