# Tarefa: resolver o déficit estrutural dos estratos S₁ × K̂₂

**Origem:** achado reiterado na `docs/auditorias/AUDITORIA_D11_2026-10-31.md`, §5.2. Três estratos não têm candidatos suficientes para o que D16 exige, e a causa **não** é filtro temporal.

---

## Caminhos e push

```bash
git fetch origin
git checkout -B sarel/executor-2026-10-09 origin/sarel/executor-2026-10-09
```

Trabalhe e empurre **direto em `sarel/executor-2026-10-09`**. Não crie branch nova. Não espere notificação de push. Confirme com um comando e encerre o turno:

```bash
git push origin sarel/executor-2026-10-09 && git log --oneline -1 origin/sarel/executor-2026-10-09
```

Se o push falhar por credencial, diga no relatório e encerre.

---

## ⚠ Isto não é um achado novo. Não refaça o que já existe.

Há uma verificação de **29/09/2026** sobre exatamente este gargalo:

**`docs/verificacoes/2026-09-29_gargalo_estratos_k2_dominio_d07.md`**

Leia-a inteira antes de qualquer coisa. Ela já:

- corrigiu um erro de domínio (a medição usava 3–45%, D07 fixa 3–20%) e mostrou que **o gargalo é pior** do que o relatado na época: 5 candidatos em K̂₂ dentro de 3–20%, contra 18 necessários;
- identificou a causa raiz: o teto operacional do pool (`slice`) era aplicado **antes** do filtro de declividade, de modo que o pool era cortado sobre o universo inteiro;
- aprovou a Proposta 1 (elevar o teto e filtrar antes) como **necessária, possivelmente suficiente, não garantida**;
- **recusou** a Proposta 2 (mover a classe "Média" para K̂₂) por contrariar D09 e a Tabela 5 do Documentos 246. **Essa recusa continua valendo — não a reabra.**
- previu, com razão: *"os solos de erodibilidade alta ocorrem preferencialmente em relevo mais declivoso […] as células (S1, \*, K2) podem seguir magras mesmo com 593"*.

## O que mudou desde então, e por que agora é conclusivo

Duas coisas que a verificação de 29/09 não podia saber:

1. **A causa raiz foi corrigida.** Em `src/app/api/gee/select-candidates/route.ts`, o filtro de D07 agora precede o teto: `candidatosComTerrenoElegivelPreGee.filter(...)` na linha ~434 e só então `.slice(0, limitePool)` na ~447, com o comentário *"Garante que 100% das requisições ao GEE REST sejam consumidas em pontos comprovadamente elegíveis em declividade"*.
2. **Ê passou a ser medido de verdade.** Em 29/09 a distribuição em Ê era desconhecida por falta de credenciais GEE. Hoje a rota exige `frequenciaSoloNu` real e descarta o candidato sem ela.

**Conclusão: os 9 candidatos em S₁ × K̂₂, sobre 677 candidatos reais, são a distribuição física da bacia — não resíduo de bug.** A previsão de setembro se confirmou.

## O problema real, enunciado

D16 exige **4 polígonos por estrato** (2 treino + 2 held-out). O quadrante S₁ × K̂₂ reúne **9 candidatos** distribuídos em 3 células (os três tercis de Ê), contra **12 necessários**:

| Estrato | Candidatos | Exigido por D16 |
| :--- | ---: | ---: |
| `E_1,1,2` | **0** | 4 |
| `E_1,2,2` | 4 | 4 |
| `E_1,3,2` | 5 | 4 |

Uma célula é impossível de preencher; as outras duas têm margem zero ou um — **antes** do thinning de 1 km (P02), que ainda reduz.

A razão é pedogeomorfológica e está no próprio vocabulário do projeto: o registro de decisões já fala em **catena agrícola topo-sequencial**. Solos de erodibilidade alta na BP3 — Neossolos Regolíticos RLm e Argissolos PVAe/PVe — ocorrem preferencialmente em relevo mais declivoso. Ou seja:

> **O desenho fatorial 3 × 3 × 2 pressupõe que Ŝ e K̂ sejam aproximadamente independentes na paisagem. A relação de catena os torna dependentes.** Fatorial sobre fatores dependentes gera células estruturalmente vazias — é consequência esperada do desenho, não defeito dos dados.

É esse o enunciado que precisa chegar à banca, e é ele que define quais saídas são legítimas.

---

## Passo 1 — Medir, com a ferramenta que já existe

**Não construa instrumentação nova.** Já existem:

- `scripts/verificar_pool_estratos.ts` — CLI somente-leitura que reaproveita `verificarPreCondicoesSorteioD16`;
- `src/lib/gee/poolEstratos.ts` — análise de pool por estrato e reservas (DP-20);
- `docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json` — os candidatos reais.

Produza a **tabela de ocupação dos 18 estratos**, não apenas do quadrante crítico, com:

- candidatos por estrato **antes** e **depois** do thinning de 1 km (P02);
- quantos estratos ficam abaixo dos 4 exigidos por D16, e por quanto;
- a distribuição marginal de K̂₂ pelos três tercis de Ŝ, que é o que evidencia a dependência;
- se disponível no `poolEstratos`, a margem de reserva sob as taxas de recusa já modeladas em DP-20 — um estrato com 4 candidatos e 25% de recusa esperada não tem 4.

Entregue a tabela antes de propor qualquer coisa.

## Passo 2 — Quantificar a dependência entre Ŝ e K̂

A afirmação "o fatorial pressupõe independência e a catena a quebra" precisa de número, não de retórica. Sobre os 677 candidatos, meça a associação entre o tercil de Ŝ e o nível de K̂ — tabela de contingência 3 × 2, com teste de independência e medida de associação (qui-quadrado e V de Cramér servem; declare o que usou).

Se a dependência for estatisticamente clara, ela **é o argumento** que justifica reformar o desenho. Se não for, o déficit é só escassez amostral e a saída é outra. Meça antes de decidir qual história contar.

## Passo 3 — Buscar lastro para as saídas, pela Norma

Saídas conhecidas em teoria de amostragem, cada uma precisando de fonte pela R-L1/R-L4:

- **Colapso de estratos adjacentes.** Prática padrão quando um estrato tem unidades insuficientes. Candidato natural: **Cochran (1977), *Sampling Techniques*, 3ª ed.**, já citada em D12. Verifique **no primário** o que o livro diz sobre colapso e sobre estratos com poucas unidades, e declare a fronteira (R-L3).
- **Amostragem exaustiva do estrato raro** (π_i = 1). **D23 já sustenta isso** — estratificação desproporcional com π_i registrado, Olofsson et al. (2014) e King & Zeng (2001). É a saída que **não exige emenda a D12**, apenas alocação. Avalie-a com seriedade antes das demais.
- **Declarar a célula fora do domínio de validade.** Se S₁ × K̂₂ quase não existe na bacia, predizer ali é extrapolação — e **D07 já veda extrapolação** fora do domínio. Essa saída é internamente coerente com decisão vigente e não inventa nada.
- **Reduzir o fatorial** (estratificar K̂ apenas dentro dos tercis de Ŝ onde K̂₂ existe). Muda a cardinalidade dos estratos e, por consequência, o tamanho da campanha.

Para cada saída, diga **o que custa**: quantos polígonos, quantos estratos, e o que muda em D12, D16 e D23.

## Passo 4 — Propor e PARAR

Pela Seção 2 do `CLAUDE.md`, metodologia e cardinalidade de estratos são do pesquisador. Apresente as saídas medidas e **pergunte**. Não altere D12, D16 nem D23 por conta própria.

Inclua, para a saída que você recomendar, a minuta de emenda pronta — como foi feito em D11.

---

## Consequência de pré-registro

D12 (18 estratos) e D16 (72 polígonos, 4 por estrato) estão declaradas como pré-registradas antes da coleta. Qualquer mudança na cardinalidade dos estratos ou na alocação é emenda formal.

A favor: **o sorteio real ainda não ocorreu** — os únicos artefatos de 72 polígonos são os `SINTETICO_NAO_VOAR_*` em `docs/verificacoes/voo_ncontrol/`. A janela está aberta.

Contra: é emenda a decisão pré-registrada, e precisa de data, motivo e o registro de que foi feita **antes de qualquer dado de desfecho existir** — o que a distingue de HARKing (Nosek et al., 2018, citada em D25).

Note que a saída por **alocação** (π_i exaustivo, via D23) é a única que não toca o pré-registro de D12. Isso é um argumento a favor dela que vale explicitar na comparação.

---

## Fora de escopo

- **Não reabra a Proposta 2** de 29/09 (mover "Média" para K̂₂). Foi recusada por contrariar D09 e a Tabela 5 do Documentos 246.
- **Não execute o sorteio de D16.**
- **Não altere o domínio de D07** (3–20%) para fabricar candidatos. Alargar o domínio para encher estrato é ajustar a premissa ao resultado.
- Não mexa nas dívidas de lastro abertas (D03, D17, D18, P07).

---

## Entregáveis

1. `docs/verificacoes/<data>_ocupacao_estratos_d16.md` — a tabela dos 18 estratos (Passo 1), a medida de associação Ŝ × K̂ (Passo 2) e os comandos que produziram ambas.
2. `docs/auditorias/AUDITORIA_GARGALO_S1K2_<data>.md` — as saídas, com custo e lastro de cada uma, e a recomendação com minuta de emenda.
3. Fonte lida no primário, se houver: arquivada em `docs/verificacoes/fontes/<autor><ano>/` com SHA-256, com a seção dizendo **o que a fonte não sustenta** (R-L3).
4. Nenhuma alteração em `src/config/decisoes.ts` sem decisão do pesquisador.

## Verificação

```bash
npx vitest run && npm run typecheck && npm run lint
node --import ./scripts/ts-loader.mjs scripts/verificar_pool_estratos.ts --candidatos docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json
```

Baseline atual: **92 arquivos, 725 testes aprovados, 3 pulados**. Qualquer divergência é regressão sua.

Rodapé obrigatório em cada commit:
```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0124eRLwbTVuEsVKcsq67486
```

## Relatório final

Cada afirmação numérica ou de caminho acompanhada do comando que a produziu e da **saída real colada**. Nome de arquivo confirmado com `ls` ou `git show`, não lembrado. Deve conter:

- a tabela de ocupação dos 18 estratos, antes e depois do thinning;
- a medida de associação entre Ŝ e K̂, com o teste usado;
- o custo de cada saída, em polígonos e em emendas;
- a recomendação, com a minuta;
- o que foi lido no primário e o que ficou como citação não conferida;
- **a linha de confirmação do push.**

Depois, **encerre o turno**. Não aguarde notificação.
