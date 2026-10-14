# Prompt de auditoria honesta do SAREL v2 — 2026-10-05

Cole o bloco abaixo no agente auditor. Antes dele, leia a seção "Origem" para saber por que cada instrução existe.

## Origem (para o pesquisador, não para o auditor)

Pedi a uma instância Sonnet 5.5 uma visão geral do repositório. Conferi três afirmações dela antes de escrever este prompt:

| Afirmação do relatório | Conferência em 2026-10-05 | Resultado |
|---|---|---|
| "O último commit é o merge do PR #2 (sarel/v2)" | `git log -1` = `fd613e3 fix(pericial): saneamento N1, N2 e N3...`; `git log --merges` não devolveu merge algum entre os 5 commits recentes | **Falsa** |
| "node_modules não está instalado" | `ls node_modules` lista `@alloc`, `@babel`... | **Falsa** (ou ao menos desatualizada) |
| "O script de treino usa Fator K, Fator R e perda RUSLE; o commit 575467f diz ter removido a perda RUSLE da matriz" | `scripts/treinar_xgboost_loco.py` linhas 20, 351, 578-580 ainda citam `rusle_fator_k`, `rusle_fator_r`, `rusle_perda_solo`. O `575467f` alterou só `src/lib/matriz/*` e `src/lib/rotulos/*`, não o script Python. O JSON do relatório lista `preditores_utilizados = [declividade_pct, elevacao_m, bsi, ndvi, rusle_perda_solo]` | **Procede**, e é mais grave do que o relatório diz (ver B1) |
| "Relatório XGBoost tem AUC = 1,0 e se declara dry-run" | JSON: `natureza_execucao = BENCHMARK_INFRAESTRUTURA_DRY_RUN`, `dados_100pct_empiricos = false`, matriz de confusão `[[150,0],[0,150]]`. Script, linhas 335-351: classe 0 gerada com `np.random.uniform` em declividade, elevação e `perda_solo_spd` | **Procede** |

Também não conferi: a descrição do fluxo funcional (18 estratos, Kappa 0,60, 7 invariantes, perfis cegos), a lista de decisões pendentes (o relatório cita "D02, D03", mas D26 em `src/config/decisoes.ts:338` está `decidida` e fala em VANT como alvo primário contínuo, o que talvez torne a descrição "rótulos por campo, fotointerpretação e drone" desatualizada), nem se testes, typecheck, lint e build passam. Tudo isso entra no prompt como **hipótese a verificar**, não como fato.

---

## Como usar

O prompt único foi dividido em duas execuções, para que o auditor não abrevie os blocos finais:

1. [PROMPT_AUDITORIA_PARTE1_2026-10-05.md](PROMPT_AUDITORIA_PARTE1_2026-10-05.md): estado base, testes, hipóteses B1..B7 e aptidão para a função C1..C7. Gera `docs/auditorias/AUDITORIA_PARTE1_2026-10-05.md`.
2. Você revisa o relatório da Parte 1.
3. [PROMPT_AUDITORIA_PARTE2_2026-10-05.md](PROMPT_AUDITORIA_PARTE2_2026-10-05.md): indícios de má interpretação D1..D8 e geração do prompt de correção. Gera `docs/auditorias/AUDITORIA_PARTE2_2026-10-05.md` e `docs/planejamento/PROMPT_CORRECAO_POS_AUDITORIA_2026-10-05.md`.
