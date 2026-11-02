# Especificação do competidor RUSLE na comparação de D25

**Data:** 2 de novembro de 2026
**Origem:** item 6 do [prompt de lastro](../planejamento/prompts/PROMPT_EXECUTOR_LASTRO_2026-11-01.md); achado `N-07`.
**Natureza:** levantamento para decisão do pesquisador (`G-10`). **Não recomenda** opção.

> **Por que este documento existe.** D25 pré-registra a comparação entre o XGBoost e a linha de base física RUSLE. O desfecho dessa comparação depende tanto do modelo quanto da **especificação do competidor** — e dois dos cinco fatores da RUSLE estão declaradamente degradados, **ambos na direção de enfraquecer o competidor**. Lido antes dos resultados, este levantamento permite declarar a limitação na dissertação. Lido depois, seria racionalização.

---

## 1. Estado dos cinco fatores, e a direção do viés de cada um

| Fator | Decisão | Estado | Direção do efeito sobre a comparação |
|---|---|---|---|
| **R** | D13 (`decidida`) | **Sucedâneo declarado do EI30.** O EI30 do RUSLE exige intensidade em 30 minutos; o CHIRPS é **diário**, e o próprio registro afirma que *"o EI30 verdadeiro NÃO é obtenível dele"*. Além disso, a forma funcional e os coeficientes da equação regional seguem **pendentes de conferência no primário**, marca que a partir de 02/11/2026 chega ao CSV (`L-08`) | **degrada o RUSLE** |
| **K** | D09 + D14 (`decidida`) | Carta oficial de erodibilidade 2024 por ponto-em-polígono, com lastro em Coelho et al. (2024), Embrapa Doc 246 — arquivado. Limitação declarada: discordância com o levantamento estadual em associações de Neossolo Regolítico, registrada e não reconciliada | neutro, com limitação declarada |
| **LS** | D15 (`decidida`) | Desmet & Govers (1996) a 30 m, com Schmidt (2019) para encosta íngreme — **ambos arquivados**, e a distorção de projeção está medida em verificação própria | neutro |
| **C** | D01 / D20 (`decidida`) | Híbrido SPD: Durigon et al. (2014) modulado por BSI. **Defeito de atribuição aberto (`A-04` / F-06):** `fatorC.ts:133` fixa `decisoes: ["D01"]` em ambos os ramos, de modo que o selo diz Durigon puro mesmo quando o valor é híbrido de D20. Não corrigido por este prompt — é escopo de `P-A` | neutro quanto ao valor; **proveniência falsa** quanto à etiqueta |
| **P** | D22 (`decidida`, **não implementada**) | `linhaDeBase.ts` usa **P = 1,0** em todos os pontos (Renard et al., 1997, tabelado). A tabela de D22 veio de **saída de modelo de IA**, atribuída a "Bertoni & Lombardi Neto / Wischmeier & Smith adaptados", e **não foi conferida na fonte primária** — ressalva registrada a pedido do pesquisador no próprio registro | **degrada o RUSLE**: P = 1,0 superestima a perda onde há terraceamento ou plantio em nível |

## 2. O registro já antecipou a consequência

A justificativa de D13 diz, textualmente:

> *"parte da distância entre o RUSLE e os competidores pode vir da degradação do fator R, não da inferioridade do modelo físico, e essa possibilidade precisa estar escrita antes dos resultados."*

E a avaliação de 01/11 observa, sobre P: *"manter P = 1,0 é conservador e declarado, mas superestima a perda em áreas terraceadas e pode favorecer o XGBoost na comparação."*

**Portanto:** um resultado favorável ao XGBoost, obtido neste estado, é **ambíguo de antemão** entre "o modelo é melhor" e "o competidor foi mal especificado". A ambiguidade é conhecida antes do dado — o que a torna indefensável se não estiver escrita.

Há ainda a consequência mais direta, já registrada no config de D25: sem R e LS fornecidos à linha de base, `RUSLE_A` sai vazio e o desfecho da comparação é `NAO_AVALIAVEL` (F-02).

## 3. Opções de `G-10` (fator P), com o efeito de cada uma

Apresentadas **sem recomendação**. A escolha é do pesquisador, e precisa ser feita antes de qualquer resultado.

| Opção | O que implica | Efeito sobre a leitura do desfecho |
|---|---|---|
| **1. Manter P = 1,0 e declarar a direção do viés** | Nenhuma implementação. Exige redigir na dissertação que o competidor opera com P conservador, que superestima a perda onde há prática conservacionista, e que parte de qualquer vantagem do XGBoost pode vir disso | Honesto e barato. Mantém a comparação enviesada, mas com o viés **declarado e direcional** |
| **2. Implementar a tabela de D22 com status `provisorio`** | Depende de `L-03` — conferir Bertoni & Lombardi Neto no primário. **Não implementar antes disso**: transformaria uma saída de IA em número de sistema, que é exatamente o que a norma R-L4 existe para evitar | Melhora a especificação **se** a fonte se confirmar. Antes disso, troca um viés declarado por um número sem lastro |
| **3. Declarar a comparação condicionada** | A comparação de D25 é reportada como "XGBoost contra RUSLE com R sucedâneo e P tabelado", e não como "XGBoost contra RUSLE" | Mais restritivo e mais defensável. Reduz o alcance da afirmação em vez de maquiar o número |

**Pré-requisito comum:** `L-03` (Bertoni & Lombardi Neto) está **não obtido** — a rede deste ambiente bloqueia os repositórios, e a obra é livro. Enquanto não for conferida, a opção 2 está fechada pela própria norma.

## 4. O que fazer de imediato, independentemente de `G-10`

1. **Redigir a limitação conjunta R+P** na dissertação, **antes** de qualquer resultado. É o que a justificativa de D13 já determina.
2. **Corrigir `A-04`** (atribuição de D20 no fator C): o selo não pode dizer D01 quando a fórmula é híbrida. É correção de etiqueta, não de valor, e está em `P-A`.
3. **Não interpretar** um eventual `NAO_AVALIAVEL` de D25 como falha do avaliador: sem R e LS, é o desfecho correto.

**Fim do levantamento.** Nenhuma decisão foi tomada; nenhum parâmetro foi alterado.
