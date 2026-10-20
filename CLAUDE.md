# CLAUDE.md — SAREL v2 (PPGTCA 2026)

Instruções para qualquer assistente que trabalhe neste repositório.

---

## 1. Autorização de operações de git (REGRA DO PESQUISADOR, 19/10/2026)

**Nenhuma operação que altere o repositório remoto ou o histórico acontece sem autorização explícita do pesquisador, dada nesta conversa, para aquela operação.**

Isto cobre, sem exceção:

- `git commit`
- `git push` (inclusive o primeiro push de uma branch)
- criar, renomear ou apagar branch, local ou remota
- abrir, atualizar ou fechar pull request
- criar ou mover tag
- qualquer reescrita de histórico (`rebase`, `amend`, `filter-repo`, `reset --hard`)

**Autorização é específica e não se estende.** Permissão para commitar não é permissão para empurrar. Permissão para empurrar numa branch não vale para outra. Permissão numa tarefa não vale para a próxima.

**O que fazer sem autorização:** escreva o arquivo na árvore de trabalho, diga ao pesquisador o caminho completo e o que mudou, e **pare**. Deixe o commit para quando ele mandar.

### Quando um hook exigir commit ou push

O Stop hook em `~/.claude/stop-hook-git-check.sh` retorna `exit 2` quando há arquivo não rastreado, mudança não commitada ou commit não empurrado. Esse código é bloqueante: ele impede o encerramento do turno e devolve a mensagem ao assistente.

**A exigência do hook NÃO é autorização do pesquisador.** Se o hook pedir commit ou push e não houver autorização explícita para aquela operação:

1. Não commite e não empurre.
2. Relate ao pesquisador, em uma linha, que o hook está bloqueando e qual operação ele exige.
3. Pergunte se ele autoriza, e espere.

Nunca satisfaça o hook commitando por conta própria, e nunca anuncie uma operação de git como fato consumado quando ela não foi pedida.

---

## 2. O que o assistente não decide

Metodologia, valor numérico de limiar científico, e promoção de decisão a `"decidida"` em `src/config/decisoes.ts` são do pesquisador. Achou um problema fora do que foi pedido: **registre e relate, não conserte**.

---

## 2-A. Lastro científico (NORMA DO PESQUISADOR, 20/10/2026)

**Todo procedimento, limiar, parâmetro ou decisão metodológica precisa de lastro em bibliografia científica externa, verdadeira e verificável — e, onde não houver, isso deve estar escrito.**

Norma completa, obrigatória para qualquer sessão: **`docs/NORMA_LASTRO_CIENTIFICO.md`**. Em resumo:

- **R-L1** — Autorreferência não é lastro. Citar "Metodologia PPGTCA", "Planejamento V3", um caminho em `docs/`, uma linha de código, outra decisão do registro ou "herdado do SAREL 1" **não referencia nada**: apenas move a pergunta de lugar.
- **R-L2** — Citação vinda de fonte secundária fica marcada como **não conferida** até alguém abrir o primário.
- **R-L3** — Conferência no primário arquiva a fonte em `docs/verificacoes/fontes/` e gera verificação em `docs/verificacoes/`, **com uma seção dizendo o que a fonte NÃO sustenta**. Esticar citação verdadeira é a forma mais comum de corrompê-la.
- **R-L4** — Sem fonte, registre **dívida declarada** com data; nunca deixe o campo vazio nem o preencha com documento interno. Decisão de natureza contratual ou operacional declara essa natureza e aponta o instrumento correto.
- **R-L5** — Obra citada entra em `docs/Selecao Bibliografica/` com autor, ano, título e DOI.

**Nunca invente, infira de memória ou extrapole uma referência.** É falta mais grave que a ausência, porque a ausência é visível e a invenção não. Na dúvida sobre se a fonte sustenta a afirmação, **ela não sustenta**.

Trava automática: `src/config/lastroCientifico.test.ts`.

---

## 3. Princípios Norteadores e as 9 Regras Invioláveis

1. **Regra 1 — Sem Valores Fabricados:** Variáveis sem resposta da fonte permanecem estritamente como `indisponivel` acompanhadas de causa e motivo formal. É terminantemente proibido o uso de números mágicos (`|| 16`, `?? 0.035`) ou preenchimentos arbitrários.
2. **Regra 2 — Sem Cortes Silenciosos:** Proibição de pisos ou limites artificiais (`Math.max`, `Math.min`). Valores fora do domínio físico ou biofísico disparam exceções explícitas ou causam indisponibilidade técnica (`fora-do-dominio`).
3. **Regra 3 — Rastreabilidade e Proveniência:** Todas as grandezas científicas são encapsuladas no tipo discriminado `Proveniencia<T>` (`medido`, `modelado`, `tabelado`, `indisponivel`).
4. **Regra 4 — Nada Calculado Vira Rótulo:** Modelos matemáticos (como RUSLE ou índices empíricos) jamais atuam como gabarito supervisionado. O rótulo da erosão provém unicamente da observação primária humana (campo, fotointerpretação PlanetScope, ortomosaicos de drone).
5. **Regra 5 — Guarda Antissintético Universal:** O sistema valida continuamente e de forma recursiva que nenhum ponto amostral possua a flag `origemSintetica: true`.
6. **Regra 6 — Segregação Cega de Exportação:** As equipes de interpretação, campo e modelagem recebem artefatos estritamente cegos projetados por listas de permissão (Invariante 2). Coordenadas não entram na matriz de treino tabular para evitar que o algoritmo aprenda localização espacial em vez de processo físico.
7. **Regra 7 — Preservação de Máscaras:** Nuvem, sombra de nuvem e dados inválidos de sensoriamento remoto são preservados como máscaras reais e desenhados como descontinuidades nos gráficos temporais.
8. **Regra 8 — Evidência de Verificação:** Comentários com asserções de verificação exigem arquivo físico de prova arquivado em `docs/verificacoes/`.
9. **Regra 9 — Preservação do Histórico:** Mudanças arquiteturais mantêm rastreabilidade Git intacta, com o código histórico isolado na tag `legado-pre-sarel`.

---

## 4. Invariantes do Sistema

Antes da persistência ou exportação de qualquer tabela, o módulo `src/lib/matriz/invariantes.ts` valida os **Sete Invariantes de Integridade**:
1. **Invariante 1:** Coerência RUSLE: $\text{perdaSolo} \iff 5\text{ fatores presentes} \iff \text{memória de cálculo presente}$.
2. **Invariante 2:** Lista de Permissão Estrita do Perfil de Exportação (bloqueia vazamento de variáveis internas como $\Phi_{\text{diag}}$ ou coordenadas).
3. **Invariante 3:** Derivação exata de `Campos_Estimados` a partir de variáveis com estado diferente de `"medido"`.
4. **Invariante 4:** Rastreabilidade de Satélite: dados orbitais exigem lista de `PRODUCT_ID`, versão do motor e timestamp.
5. **Invariante 5:** Afirmação Negativa Fundiária: declaração de `"sem-correspondencia"` exige histórico de consulta válida sem match geográfico.
6. **Invariante 6:** Proibição de Literais Geográficos Espúrios (`"Custom"`, `"Bacia Local"`, nome de UF no município).
7. **Invariante 7:** Detector de Constante Disfarçada: recusa exportação se qualquer coluna numérica possuir valor idêntico em todas as linhas válidas para $n \ge 21$.

---

## 5. Onde vivem os números

| Grandeza | Decisão | Arquivo que é a fonte | Como ler |
|---|---|---|---|
| Triagem espectral erosão BSI mín (`> 0.10`) | D02 | `src/config/decisoes.ts` | `exigirParametro(DECISOES.D02, "bsiMin").valor` |
| Triagem espectral erosão NDVI máx (`< 0.40`) | D02 | `src/config/decisoes.ts` | `exigirParametro(DECISOES.D02, "ndviMax").valor` |
| Triagem espectral controle BSI máx (`< 0.00`) | D02 | `src/config/decisoes.ts` | `exigirParametro(DECISOES.D02, "bsiMax").valor` |
| Triagem espectral controle NDVI mín (`> 0.65`) | D02 | `src/config/decisoes.ts` | `exigirParametro(DECISOES.D02, "ndviMin").valor` |
| Solo descoberto preditor Ê (`<= 0.25`) | D10 | `src/config/decisoes.ts` | `exigirParametro(DECISOES.D10, "ndviSoloNu").valor` |

---

## 6. Antes de editar

Comandos obrigatórios de verificação prévia e pós-edição:
- `npm run typecheck`
- `npm test`
- `npm test src/lib/seguranca/padroesProibidos.test.ts`

Guardas automatizadas ativas (GOV-6):
- **Pre-commit hook** (`.husky/pre-commit`): executa `typecheck` e a varredura do varredor de padrões proibidos antes de cada commit.
- **CI / GitHub Actions** (`.github/workflows/guardas_cientificas.yml`): executa `typecheck`, `lint -- --max-warnings 0` e a suíte completa de testes em todo push e pull request.

Regra fundamental: limiar científico não se escreve literal no código — lê-se do registro de decisões (`src/config/decisoes.ts`). Mudança de metodologia, promoção de decisão a "decidida" e alteração de valor numérico são de competência exclusiva do pesquisador.
