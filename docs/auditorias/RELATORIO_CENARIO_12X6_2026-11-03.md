# Relatório de Execução — Cenário 12 × 6 no Material de Decisão de G-01

**Data:** 3 de novembro de 2026  
**Prompt executado:** [`PROMPT_EXECUTOR_CENARIO_12X6_2026-11-03.md`](../planejamento/prompts/PROMPT_EXECUTOR_CENARIO_12X6_2026-11-03.md)  
**Base:** `correcoes/contencao-2026-11-02`  
**Origem:** §4 de `AVALIACAO_DESENHO_SEQUENCIA_TAMANHO_AMOSTRAL_2026-11-03.md`  
**Natureza:** ampliação neutra do material de decisão de `G-01`. **Não recomenda e não decide nada.**

---

## 1. Entregáveis Realizados

| Arquivo | Ação |
|---|---|
| `scripts/cenarios_g01.py` | Refatorado para suportar `poligonos_por_estrato` por cenário (default 4). Acrescentado o cenário `Op.3+ (12 × 6) — K agregado em S1 e S2` com 6 por estrato. Guarda de viabilidade dinâmica (`N_h >= poligonos_por_estrato`). |
| `docs/planejamento/decisao/G-01.md` | Acrescentado o cenário 12 × 6 na tabela da §3, quarta consequência no texto, entrada na §5 (o que deixa de ser estimável com atenuante dos 3 held-out), nota na §6 sobre compatibilidade fortuita com tipo do selo, e atualização da §7 (impacto em `G-13` e achado `N-05`). |
| `scripts/test_cenarios_g01.py` | Suíte de testes de aceite automatizados cobrindo conferência de leitura da tabela (677/453), neutralidade estrita dos 7 cenários originais, métricas do cenário 12 × 6, e guarda dinâmica com falha para alocação excessiva. |

---

## 2. Saída do Script: Antes vs. Depois da Refatoração

### 2.1. Comparação Lado a Lado dos Sete Cenários Originais (Neutralidade Estrita)

| Cenário | Estratos (A/D) | Polígonos (A/D) | Held-out (A/D) | Área ha (A/D) | `min(N_h)` (A/D) | Em titular (A/D) | Guarda (A/D) | P(≥tit\|25%) (A/D) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Pré-registrado (18 estratos, D16 emendada) | 18 / 18 | 72 / 72 | 36 / 36 | 361.4 / 361.4 | 0 / 0 | 1 / 1 | **NAO** / **NAO** | 0.0% / 0.0% |
| Op.1 — colapsar E em S1xK2 e no S2xK2 deficie | 15 / 15 | 60 / 60 | 30 / 30 | 301.2 / 301.2 | 4 / 4 | 1 / 1 | sim / sim | 31.6% / 31.6% |
| Op.1-v — colapsar E em TODO S1xK2 e TODO S2xK2 | 14 / 14 | 56 / 56 | 28 / 28 | 281.1 / 281.1 | 7 / 7 | 0 / 0 | sim / sim | 92.9% / 92.9% |
| Op.2 pura — excluir S1xK2 do dominio de D07 | 15 / 15 | 60 / 60 | 30 / 30 | 301.2 / 301.2 | 2 / 2 | 0 / 0 | **NAO** / **NAO** | 0.0% / 0.0% |
| Op.2 + colapso do S2xK2 deficiente | 14 / 14 | 56 / 56 | 28 / 28 | 281.1 / 281.1 | 4 / 4 | 1 / 1 | sim / sim | 31.6% / 31.6% |
| Op.3 — K agregado somente em S1 | 15 / 15 | 60 / 60 | 30 / 30 | 301.2 / 301.2 | 2 / 2 | 0 / 0 | **NAO** / **NAO** | 0.0% / 0.0% |
| Op.3 — K agregado em S1 e S2 | 12 / 12 | 48 / 48 | 24 / 24 | 241.0 / 241.0 | 12 / 12 | 0 / 0 | sim / sim | 100.0% / 100.0% |

> **Conclusão de Neutralidade:** Todos os números, probabilidades e estados de guarda para os 7 cenários originais são **100% idênticos** aos anteriores à refatoração. A soma dos candidatos da tabela (`antes=677`, `pos-thinning=453`) continua funcionando como trava de integridade inalterada.

---

## 3. Os Números do Cenário 12 × 6 e Conferência da Fragilidade

### 3.1. Métricas do Desenho 12 × 6

| Métrica | Valor | Observação |
|---|---:|---|
| Macro-estratos | **12** | Formados pela agregação dos níveis de erodibilidade $K$ dentro de $S_1$ e $S_2$ |
| Polígonos por estrato | **6** | 3 titulares de treino + 3 de validação (held-out) por estrato |
| Total de polígonos sorteados | **72** | Idêntico ao desenho pré-registrado |
| Total de clusters held-out | **36** | Idêntico ao desenho pré-registrado |
| Área total de voo VANT | **361,4 ha** | Idêntica ao desenho pré-registrado ($72 \times 5,02\text{ ha}$) |
| `min(N_h)` pós-thinning | **12** | Candidatos ordenados: `[12, 15, 17, 35, 36, 37, 48, 48, 49, 51, 52, 53]` |
| Estratos em reserva zero | **0** | Nenhum estrato tem exatamente 6 candidatos; todos possuem folga |
| Satisfaz a guarda de viabilidade | **Sim** | $\min(N_h) = 12 \ge 6$ |

### 3.2. Conferência da Fragilidade com 6 Titulares

A probabilidade de preenchimento dos 6 titulares no estrato mais frágil ($N_h = 12$) sob taxa de recusa $p$ segue o modelo binomial com recusas independentes:
$$P(X \ge 6 \mid N_h = 12, p) = \sum_{k=6}^{12} \binom{12}{k} (1 - p)^k p^{12 - k}$$

- **Sob 10% de recusa ($p = 0,10$):**  
  $$P(X \ge 6 \mid 12, 0,10) = 0,999978 \approx \mathbf{100,0\%}$$
- **Sob 25% de recusa ($p = 0,25$):**  
  $$P(X < 6 \mid 12, 0,25) = \sum_{k=0}^5 \binom{12}{k} 0,75^k 0,25^{12 - k} \approx 0,01428$$  
  $$P(X \ge 6 \mid 12, 0,25) = 1 - 0,01428 = 0,98572 \approx \mathbf{98,6\%}$$

Contraposição às outras opções sob 25% de recusa:
- Pré-registrado ($18 \times 4$): **0,0%** (inviável por ter estratos com $N_h < 4$)
- Opção 1 ($15 \times 4$, recomendada em 01/11): **31,6%** (frágil em $N_h = 4$)
- Opção 1-v ($14 \times 4$): **92,9%** ($N_h = 7$)
- Opção 3+ ($12 \times 4$): **100,0%** ($N_h = 12$, 4 titulares)
- Opção 3+ ($12 \times 6$): **98,6%** ($N_h = 12$, 6 titulares)

---

## 4. Independência Teórica de Cochran (1977) §5A.12

Uma distinção metodológica crucial:
- As opções baseadas em **colapso** (Opção 1, Opção 1-v e Opção 2+) colapsam classes de declividade $E$ (por exemplo, relevo forte-ondulado com escarpado). Isso exige ponderação analítica de variâncias entre estratos colapsados com pesos de amostragem desiguais, mecanismo teorizado em **Cochran (1977) §5A.12**. Como essa passagem ainda não foi conferida no primário (impedimento `L-01`), as opções com colapso permanecem bloqueadas para emenda definitiva.
- O cenário **12 × 6**, por sua vez, é construído exclusivamente por **agregação** dos níveis de erodibilidade $K$ (fatores de solo $K_1$ e $K_2$) dentro dos níveis de declividade $S_1$ e $S_2$. Trata-se de redefinição clássica do fator de estratificação (unificação dos tipos de solo em um único estrato de solo no relevo correspondente), **não constituindo colapso pós-estratificado**.
- Portanto, o desenho **12 × 6 é teoricamente independente de Cochran §5A.12** e pode ser executado mesmo enquanto `L-01` estiver pendente.

---

## 5. Observação sobre o Tipo do Selo Criptográfico

Em `src/types/sorteioPoligonosTipos.ts`:
```typescript
totalPoligonosSorteados: 36 | 72;
totalTreino: 18 | 36;
totalHeldOut: 18 | 36;
areaTotalHectares: 360 | 361.44;
```
- No cenário 12 × 6, o total de polígonos sorteados é exatamente **72**, o total de treino é **36**, o total de held-out é **36** e a área é **361,44 ha**.
- Isso faz com que o desenho 12 × 6 coincida com a tipagem restrita do selo atual sem exigir quebras sintáticas na assinatura TypeScript.
- **Ressalva importante:** Essa compatibilidade é uma **coincidência aritmética**. Ela não resolve a necessidade arquitetural de flexibilizar a tipagem caso o pesquisador venha a optar por um dos outros desenhos viáveis (56, 60 ou 48 polígonos). O tipo do selo não foi alterado nesta tarefa, em cumprimento rigoroso aos limites de escopo.

---

## 6. O que Ficou Pendente (Decisão do Pesquisador)

1. **A decisão do gate `G-01`:** A escolha de qual desenho adotar (12 × 6, 1-v, 3+ 12 × 4, etc.) pertence exclusivamente ao pesquisador.
2. **Homologação de `L-01` (Cochran §5A.12):** Continua pendente para desbloquear formalmente as famílias que utilizam colapso de declividade (Opção 1 e 1-v).
3. **Auditoria de `L-10` (Roberts et al. 2017 para P02):** Permanece pendente para avaliar se o espaçamento de 1 km de thinning pode ou não ser flexibilizado em estratos limítrofes.
4. **Fechamento de `G-13` (Poder e Margem):** Depende da execução probatória de `P-S` (`scripts/d25/poder_d25.py`).
