# Impedimento de lastro ao gate G-01 (fatorial inviável) — opção de colapso

**Data:** 2 de novembro de 2026
**Origem:** item 2 do [prompt de lastro](../planejamento/prompts/PROMPT_EXECUTOR_LASTRO_2026-11-01.md); achados `N-01` e `N-14`.
**Natureza:** registro de impedimento. Não decide o gate.

---

## 1. O que está impedido, e o que não está

O gate `G-01` trata dos quatro estratos com `N_h < 4` (um deles com zero). A **opção 1 — colapsar estratos** é a recomendada pelos três documentos de 01/11/2026, e depende do estimador de variância com estratos colapsados de **Cochran (1977), §5A.12**.

**Esse lastro não está conferido no primário.** O que o acervo contém, em `docs/verificacoes/fontes/cochran1977/`, é uma síntese de 68 linhas que **se autodeclara**:

- `Status de Conferência: NAO_CONFERIDO_NO_PRIMARIO (Regras R-L1 e R-L4)`;
- origem: *"síntese da literatura secundária e sumários acadêmicos públicos"*; o exemplar primário **não** está depositado;
- *"qualquer decisão de desenho apoiada nesta saída repousa provisoriamente sobre citação não conferida"*;
- *"devem ser homologadas perante o texto primário antes de suportar qualquer emenda oficial a D12/D16"*.

**O impedimento recai sobre a opção 1, não sobre o gate inteiro.** As opções **2** (declarar Ŝ1×K̂2 fora do domínio de D07) e **3** (desenho condicional/aninhado) não usam o estimador de variância colapsada e **não dependem de Cochran**.

## 2. Mas as opções 2 e 3, puras, não resolvem o problema

Aritmética sobre a tabela de ocupação de 31/10/2026, já registrada no material de decisão de `G-01`: dos quatro estratos inviáveis, **dois são Ŝ2×K̂2, não Ŝ1×K̂2** — `E_2_2_2` (2 candidatos) e `E_2_3_2` (2). Excluir Ŝ1×K̂2 do domínio, ou agregar K̂ apenas em Ŝ1, deixa esses dois abaixo do mínimo: `min(N_h) = 2`, e a guarda do sorteio continuaria recusando.

**Consequência conjunta:** a família de saídas que cobre os quatro estratos envolve colapso — e colapso é exatamente o que depende do lastro não conferido. As combinações que dispensam Cochran (exclusão de domínio **mais** agregação de K̂ em Ŝ2) custam o contraste de erodibilidade onde o quadrante é justamente deficiente.

Isto não recomenda nada. Apenas registra que `L-01` — obter Cochran no primário — é o item de maior retorno do plano de lastro, porque é o que devolve ao pesquisador a opção metodologicamente mais defensável.

## 3. Segundo impedimento, independente do primeiro: P02

O thinning espacial de 1.000 m (P02) **é causa direta** de parte da inviabilidade que `G-01` precisa resolver:

| Estrato | `N_h` antes do thinning | `N_h` pós-thinning | Efeito |
|---|---:|---:|---|
| `E_1_2_2` | **4** | **3** | viável → inviável |
| `E_1_3_2` | 5 | 4 | perde a única reserva |

Sem o thinning haveria **3** estratos inviáveis, não 4. E o lastro de P02 é **Roberts et al. (2017)**, que trata de estratégias de validação cruzada com estrutura espacial e **não prescreve 1 km para seleção de candidatos** — obra não arquivada e, a partir de 02/11/2026, registrada em `LASTRO_NAO_CONFERIDO` (`src/config/lastroCientifico.test.ts`).

Não se recomenda afrouxar P02: o espaçamento existe para mitigar pseudorreplicação e reduzi-lo tem custo na validação. O que se registra é que `G-01` deve ser decidido com a inviabilidade **decomposta** entre déficit estrutural e efeito de um parâmetro cujo lastro está sob auditoria.

## 4. Estado

| Item | Situação em 02/11/2026 |
|---|---|
| `L-01` Cochran (1977) §5A.12 no primário | **não obtido** — a rede do ambiente bloqueia os repositórios de fontes; obra em livro, provavelmente exige acervo da universidade |
| `L-10` Roberts et al. (2017) para P02 | **não obtido** — PDF localizado em página institucional de co-autor, host negado pela política de rede |
| Decisão de `G-01` | **do pesquisador**, com os impedimentos acima declarados |

**Fim do registro.** Nenhuma decisão foi tomada.
