# Material de Decisão — Estratificação de Ê e desenho das células de K̂=2

**Data:** 10/11/2026 · **Base:** commit `af6cf47` · **Autor:** planejador, a partir dos 677 pontos medidos
**Natureza:** material para decisão do pesquisador. **Nenhuma decisão foi tomada aqui.**

---

## 1. A pergunta

A ingestão de Ê terminou: 677 de 677 candidatos medidos sob a máscara GEOS3, nenhum indisponível.
Pela primeira vez o cruzamento Ŝ × Ê × K̂ é calculável. Ele mostra que **o desenho vigente de 18
estratos com 4 polígonos cada não é inteiramente povoável na BP3**.

A decisão é: **manter o desenho e declarar a deficiência, ou reparticionar a grade.**

---

## 2. Os dados

Tercis globais sobre os 677: Ŝ em 5,12% e 8,46%; Ê em 0,0116 e 0,0488.

### 2.1 Ocupação atual das 9 células de K̂=2 (piso D16: 4 por célula)

| | Ê₁ | Ê₂ | Ê₃ |
|---|---:|---:|---:|
| **Ŝ₁** (≤5,12%) | 6 | **3** | **0** |
| **Ŝ₂** | 6 | 4 | 4 |
| **Ŝ₃** (>8,46%) | 51 | 4 | 6 |

- Células que atingem o piso: **7 de 9**
- Polígonos alcançáveis em K̂=2: **31 de 36**
- **Células no piso ou abaixo dele: 5 de 9** — as duas deficientes (0 e 3) e três exatamente em 4

### 2.2 Por que Ŝ₁ × Ê₃ × K̂₂ está vazia

Em toda a bacia existem **9 candidatos** com relevo plano e solo de alta erodibilidade:

```
Ŝ₁ × K̂₂, valores de Ê:  0, 0, 0, 0, 0, 0,0093, 0,0207, 0,0212, 0,0331
```

O máximo é **0,0331**, abaixo do corte t₂ = 0,0488. **Ê₃ é inalcançável por construção** nessa
combinação — não por empate nem por fronteira, mas porque nenhum candidato plano de solo frágil na
BP3 tem frequência de solo exposto acima de 3,3%. Cinco dos nove nunca ficaram expostos uma única
vez em centenas de observações.

Distribuição de K̂ por relevo, que explica a escassez a montante:

| | K̂₁ | K̂₂ |
|---|---:|---:|
| Ŝ₁ | 218 | **9** |
| Ŝ₂ | 211 | 14 |
| Ŝ₃ | 164 | 61 |

Relevo plano com solo frágil é raro na bacia (9 de 677) e, quando ocorre sob SPD consolidado, não
expõe solo. **É achado sobre a bacia, não falha do método.**

**Hipótese alternativa não descartada:** o thinning reduziu 4.679 imóveis a 687 a 2.450 m e poderia
ter eliminado candidatos dessa célula. É verificável relaxando o raio apenas em Ŝ₁ × K̂₂. O padrão
observado — população uniformemente baixa, com 5 de 9 em zero absoluto — não sugere sobreviventes
de uma população rica, mas a verificação não foi feita.

### 2.3 Precisão da medida

Erro-padrão binomial mediano: **0,0087** (0,87 ponto percentual), contra largura do tercil central
de 0,0374. Razão **SE/largura = 23%**.

Isto é relevante para a decisão: o corte inferior t₁ = 0,0116 dista do zero pouco mais de **um
erro-padrão**. Separar Ê₁ de Ê₂ exige da medição uma resolução comparável ao seu próprio erro.

---

## 3. Os três cenários, calculados sobre os dados reais

### (a) Vigente — 18 estratos × 4 polígonos (72 no total; 36 em K̂=2)

| | Ê₁ | Ê₂ | Ê₃ |
|---|---:|---:|---:|
| Ŝ₁ | 6 | 3 | 0 |
| Ŝ₂ | 6 | 4 | 4 |
| Ŝ₃ | 51 | 4 | 6 |

**7 de 9 células · 31 de 36 polígonos · 5 de 9 células no piso ou abaixo**

### (b) Tercis de Ê calculados dentro de K̂=2 (84 pontos), cortes 0,0000 e 0,0041

| | Ê₁ | Ê₂ | Ê₃ |
|---|---:|---:|---:|
| Ŝ₁ | 5 | 0 | 4 |
| Ŝ₂ | 5 | 0 | 9 |
| Ŝ₃ | 44 | 3 | 14 |

**6 de 9 células · 27 de 36 polígonos — pior que o vigente.**

A causa: dentro de K̂=2 a distribuição é tão concentrada que o primeiro corte cai exatamente em
zero e o segundo em 0,0041, de modo que Ê₂ vira uma lasca quase vazia. **Esta opção parece elegante
e os dados a rejeitam.**

### (c) Ê em 2 classes pela mediana global (0,0330) — 12 estratos × 6 polígonos (72 no total; 36 em K̂=2)

| | Ê₁ (≤0,0330) | Ê₂ (>0,0330) |
|---|---:|---:|
| Ŝ₁ | 8 | **1** |
| Ŝ₂ | 8 | 6 |
| Ŝ₃ | 53 | 8 |

**5 de 6 células · 31 de 36 polígonos · 2 de 6 células no piso ou abaixo**

Mesmo rendimento que o vigente, com **metade da fragilidade**: uma célula deficiente em vez de duas,
e uma no piso em vez de três.

**Totais preservados:** 12 × 6 = 72 polígonos, 6 × 6 = 36 em K̂=2 — exatamente os mesmos totais do
desenho vigente. `sorteioPoligonosTipos.ts:103` já aceita `totalPoligonosSorteados: 36 | 72`.

---

## 4. O argumento estatístico a favor de 2 classes

Não é só ocupação. Com três classes, o corte inferior está a 0,0116 do zero, e o erro-padrão típico
da medição é 0,0087. **A distância entre a fronteira e o zero é 1,3 erro-padrão.** Pontos próximos
dessa fronteira trocam de estrato por ruído de medição.

Com duas classes, a fronteira vai para a mediana, 0,0330, a 3,8 erros-padrão do zero. O contraste
entre as classes passa a ser maior que a incerteza que o separa.

A perda é de resolução no eixo Ê — que é justamente a dimensão de interesse da pesquisa. **Esse é o
verdadeiro custo da opção (c), e não o número de polígonos.**

---

## 5. O que já está pré-registrado

O pipeline declara, desde 30/09: *"Respeito estrito a P11: se K̂=2 não alcançar 4 por estrato em
algum estrato, relata com os números exatos e as células deficientes sem alterar limiares."*

A resposta a esta situação **foi pré-registrada antes de existir o dado**, e foi cumprida: a
deficiência está relatada com números exatos, e nenhum limiar foi alterado. Isso é um ponto forte
perante a banca — o desenho previu a própria deficiência e não se ajustou quando ela apareceu.

**Consequência para a decisão:** qualquer mudança de grade precisa ser registrada como decisão
nova, datada, **antes de qualquer dado de desfecho** — que ainda não existe, pois nenhum rótulo de
campo foi coletado. A janela para decidir sem contaminação está aberta agora e fecha no primeiro
rótulo.

---

## 6. Custo de implementação

| Opção | O que muda no código |
|---|---|
| (a) manter | nada; apenas documentar a ausência estrutural |
| (b) tercis em K̂=2 | pequena, mas os dados a rejeitam |
| (c) 12 × 6 | `sorteioPoligonos.ts` fixa 18 estratos e `pi_i = 4/N_h`, `w_i = N_h/4`; passaria a `6/N_h` e `N_h/6`. O achado **S1-3** do DeepSeek (09/11) já apontava que o 12×6 consta do material de G-01 mas não do algoritmo |

Em qualquer das opções, a **trava do sorteio** e a **guarda de D11.2** (Prompt H) continuam
pendentes e bloqueiam a execução.

---

## 7. Recomendação do planejador

**Opção (c), 12 estratos × 6 polígonos** — com uma ressalva que o pesquisador precisa pesar.

A favor: mesmo rendimento de polígonos (31 de 36), metade da fragilidade, fronteira de classe a
3,8 erros-padrão em vez de 1,3, totais de 72 e 36 preservados, e o cenário já consta do material de
G-01.

Contra: perde-se um nível de resolução no eixo Ê, que é a dimensão central da pesquisa. Se a
hipótese da dissertação exige distinguir três regimes de exposição — SPD consolidado, exposição
sazonal e exposição crônica —, duas classes não a sustentam, e a opção (a) com a ausência
documentada é preferível **mesmo sendo mais frágil**.

**A pergunta que decide entre (a) e (c) não é estatística, é de hipótese:** a pesquisa precisa de
três regimes de Ê, ou dois bastam?

Se precisar de três, recomendo (a) com reserva de candidatos constituída para as três células em 4,
porque o risco ali é logístico — perda de acesso em campo —, não metodológico.

---

## 8. O que não deve entrar na decisão

- **Nenhum limiar de D10 deve ser alterado** para melhorar a ocupação. Mover `nbr2Max` elevaria Ê e
  espalharia a distribuição, mas seria escolher parâmetro metodológico pelo resultado que ele
  produz. A varredura das seis faixas de NBR2 continua instrumentada e sua pergunta legítima é
  outra: se 0,075, calibrado em São Paulo sobre Landsat 5 TM, é apropriado para a BP3 em
  Sentinel-2.
- **Nenhum dado de desfecho existe** e nenhum deve ser consultado antes desta decisão.
- A célula vazia **não deve ser perseguida** por si. Ŝ₁ × Ê₃ × K̂₂ descreve relevo plano, solo
  frágil e solo frequentemente exposto — uma combinação que a bacia não tem. Forçá-la distorceria o
  desenho para alcançar um estrato inexistente.

---

## 9. Onde registrar

A decisão entra em `src/config/decisoes.ts` como emenda a **D12** (tercis) e **D16** (sorteio),
datada, com o estado de pré-registro declarado, e é transcrita em
`docs/planejamento/DECISOES_DE_CONVERSA.md`. A evidência de suporte é
`docs/verificacoes/2026-11-10g_ingestao_680_e_distribuicao_e.md` e este material.
