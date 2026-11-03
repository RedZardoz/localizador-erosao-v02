# Relatório de execução — Contenção (P-0)

**Data de referência do prompt:** 1 de novembro de 2026  
**Data da execução / consolidação:** 2 e 3 de novembro de 2026  
**Prompt executado:** [`PROMPT_EXECUTOR_CONTENCAO_2026-11-01.md`](../planejamento/prompts/PROMPT_EXECUTOR_CONTENCAO_2026-11-01.md)  
**Branch:** `correcoes/contencao-2026-11-02` (criada a partir de `origin/sarel/executor-2026-10-09`)  
**Natureza:** implementação dos cinco itens de contenção (A-07a, N-02, A-03, A-08, A-09). Nenhuma decisão metodológica foi tomada; nenhum valor de limiar científico foi alterado; `src/config/decisoes.ts` não foi modificado.

---

## 1. Baseline e estado verificado

| Verificação | Baseline de referência inicial | Estado verificado pós-execução |
|---|---|---|
| `npm run typecheck` (`tsc --noEmit`) | exit 0 | **exit 0** |
| `npm test` | 93 arquivos, **743** passaram, 3 pulados | **94 arquivos, 794 passaram, 3 pulados** |
| `npm test src/lib/seguranca/padroesProibidos.test.ts` | 32 passaram | **34 passaram** |

**Sobre o baseline citado em prompts anteriores:**
O baseline histórico mencionado em prompts anteriores citava *92 arquivos, 725 testes aprovados e 3 pulados* (em 31/10). No início das tarefas de contenção a suíte já contava com 93 arquivos e 743 testes, e ao longo das fases e contratos subsequentes na branch consolidou-se em 94 arquivos e 794 testes aprovados (com 3 testes pulados legítimos em `matcher.test.ts`), sem nenhuma regressão.

---

## 2. Item por item

### Item 1 — Alvo D26 sem valor padrão (A-07a) ✅

| Arquivo | O que mudou | Teste que cobre |
|---|---|---|
| `src/components/inspetor/InspetorPonto.tsx` | `fracaoErodidaInput`: `useState<number>(0.0)` → `useState<number \| null>(null)`. O controle deixou de ser `input type="range"`, que não tem estado vazio, e passou a `input type="number"` com `step="0.001"`, iniciando vazio (`""`). `observadorInput`: `"Pesquisador PPGTCA"` → `""`. `confiancaInput`: `"alta"` → `""`, com opção vazia inicial `— selecione (sem valor padrão)` no `select`. | `src/components/inspetor/InspetorPonto.test.ts` e `src/lib/rotulos/rotuloHumano.test.ts` |
| `src/lib/rotulos/rotuloHumano.ts` | `InsumosRotuloHumano.fracaoErodida`: `number` → `number \| null`; `confianca` admite `""`. Recusas estritas: confiança não escolhida; fração ausente/nula; fração não numérica. Fração fora de `[0, 1]` é recusada com o valor explicito no motivo (Regra 2), sem truncamento silencioso. | `src/lib/rotulos/rotuloHumano.test.ts` (testes para fração ausente com classe "erosao", aceitação de 0 explícito como observação real, recusa de valores fora do domínio `[-0.01, 1.5]`, NaN e confiança vazia) |

### Item 2 — Duplicidade de `pi_i` no módulo de sorteio (N-02) ✅

| Arquivo | O que mudou | Teste que cobre |
|---|---|---|
| `src/lib/gee/sorteioPoligonos.ts` | Rotina legada `sortearPoligonosDroneD16` (36 polígonos, `pi_i = 2/N_h`) foi **removida**. O docstring do módulo foi atualizado (linhas 13 e 106) para documentar a rotina vigente `sortear72PoligonosD16`, com `pi_i = 4/N_h` e `w_i = N_h/4`. | `src/lib/gee/sorteioPoligonos.test.ts` (19 testes passando na rotina vigente, cobrindo idempotência do selo, kAmbiguoAssociacao, determinismo e Horvitz-Thompson) |

### Item 3 — Semente registrada, não fixa (A-03) ✅

| Arquivo | O que mudou | Teste que cobre |
|---|---|---|
| `src/app/api/gee/select-candidates/route.ts` | `const semente = 42` foi removido. A rota aceita semente explícita no corpo da requisição; na ausência, gera semente criptográfica via `nodeCrypto.randomInt(1, 2**31 - 1)`. A semente efetiva e sua origem (`informada` \| `gerada`) são registradas no relatório e critérios de seleção de cada candidato. | `src/lib/seguranca/padroesProibidos.test.ts` ("A-03 / P07 — nenhuma semente de sorteio constante no codigo") |
| `scripts/sortear_poligonos_d16.ts` | Default embutido `20260928` removido. Quando executado com `--confirmar`, `--semente` passou a ser **obrigatória** (falha com código 1 caso omitida); no modo `--dry-run`, gera semente criptográfica e a imprime explicitamente no console. | `src/lib/seguranca/padroesProibidos.test.ts` |

### Item 4 — Fabricações numéricas (A-08) ✅

| Arquivo | O que mudou | Teste que cobre |
|---|---|---|
| `src/lib/gee/serieTemporal.ts` | Em `calcularNdvi` e `calcularBsi`, denominador nulo (`Math.abs < 1e-6`) agora retorna `null` (em vez de `0`). Valores fora de `[-1, 1]` retornam `null` em vez de clampar com `Math.max`/`Math.min` (Regras 1 e 2). | `src/lib/gee/serieTemporal.test.ts` (cobre denominador zero retornando `null`, fora de faixa retornando `null`, e zero legítimo preservado) |
| `src/lib/matriz/montagemTemporal.ts` | Cenas com bandas sem NDVI calculável são filtradas em vez de injetar asserção forçada `!`. | `src/lib/matriz/montagemTemporal.test.ts` |
| `src/lib/matriz/montagem.ts` | Removido `?? "BLOCO_INDEFINIDO"`. Ponto sem bloco espacial definido é formalmente excluído da montagem com justificativa registrada, preservando o agrupamento do `GroupKFold` (D24). | `src/lib/matriz/montagemRotulo.test.ts` |
| `src/lib/export/planilha.ts` | Removido sentinela `BLOCO_INDEFINIDO`. | `src/lib/export/planilha.test.ts` |
| `src/lib/jev/jevClient.ts` | Confiança default `: 0.95` substituída por `: null`. | `src/lib/jev/jevClient.test.ts` |
| `src/lib/jev/fallbackLocal.ts` | Confianças empíricas fabricadas (0.5, 0.95, 0.92, 0.82, 0.98, 0.99) substituídas por `null`. | `src/lib/jev/jevClient.test.ts` |
| `src/types/jev.ts` | Tipagens de confiança atualizadas para `number \| null`. | `src/lib/jev/jevClient.test.ts` |

### Item 5 — JEV sem coordenadas e sem confiança fabricada (A-09) ✅

| Arquivo | O que mudou | Teste que cobre |
|---|---|---|
| `src/lib/jev/jevClient.ts` | Removidos do payload externo: `latitude`, `longitude`, `municipio` e `ponto.codigo`. O serviço externo recebe estritamente atributos biofísicos adimensionais: declividade, índices espectrais (NDVI, BSI), classe pedológica e erodibilidade. | `src/lib/jev/jevClient.test.ts` (inspeciona o payload do `fetch` e assevera ausência de coordenadas, palavras-chave e códigos) |
| `src/types/jev.ts` | Adicionado campo obrigatório `naturezaEvidencia: "heuristica-nao-rotulo"` para garantir que o laudo não seja consumido como alvo supervisionado ou rótulo pericial (Regra 4). | `src/lib/jev/jevClient.test.ts` |
| `src/app/api/jev/auditar/route.ts` | Exige opt-in explícito (`consentimentoEnvioExterno === true`); sem consentimento, comuta diretamente para a heurística determinística local. | `src/lib/jev/jevClient.test.ts` |

---

## 3. Conclusão da busca pelo lastro da concessão `// permitido:` em `amostragemSoloNuLote.ts:497`

Conforme exigido pelo prompt, foi realizada busca exaustiva por lastro para a concessão de clamp numérico em `src/lib/gee/amostragemSoloNuLote.ts:497`:
1. **`src/config/decisoes.ts`:** Nenhuma menção a corte ou clamp de frequência de solo nu.
2. **`docs/verificacoes/` e `docs/metodologia/`:** A única menção a clamp na documentação oficial é a **Regra 2** da Ficha Técnica, que o **proíbe expressamente**: *"Proibição de clamping arbitrário (`Math.max`/`Math.min`) que oculte anomalias radiométricas; valores fora da faixa física recebem selo `fora-do-dominio`"*.
3. **Histórico Git:** O comentário foi inserido no commit `b7d5c59` (01/10/2026), um commit de implementação/fix de interface, sem vínculo com decisão metodológica ou lastro bibliográfico.

**Conclusão e ação:** Constatada a ausência total de lastro científico e a colisão direta com a Regra 2, o clamp foi substituído por verificação estrita de domínio: valores fora de `[0, 1]` (com tolerância estrita de `1e-9` para resíduo de ponto flutuante) disparam `indisponivel("fora-do-dominio")`.

---

## 4. Para decisão do pesquisador — redação proposta para a emenda de D23

Em conformidade com CLAUDE.md §2, `src/config/decisoes.ts` não foi alterado. O texto de D23 (linha 425) ainda declara:
> *"36 polígonos de 10 ha, dois por estrato sobre os 18 estratos de D12, conforme D16. Para cada estrato h, pi_i = n_h / N_h"*

Enquanto o desenho amostral vigente consolidado no código executa o sorteio de **72 polígonos de 5,02 ha, quatro por estrato** (dois de treino e dois de held-out), com `pi_i = 4/N_h`.

**Redação proposta para emenda em `src/config/decisoes.ts`:**
> *"A UNIDADE DE SORTEIO PRIMÁRIA É O POLÍGONO DE VANT, não o ponto: **72 polígonos de 5,02 ha, quatro por estrato** — dois de treino e dois de held-out — sobre os estratos de D12, conforme D16 emendada. Para cada estrato `h`, `pi_i = 4 / N_h` e `w_i = N_h / 4`, com `pi_i × w_i = 1`, e ambos registrados junto do sorteio. **`N_h` é contagem de CANDIDATOS do estrato, não de hectares: `pi_i` não é peso de área** (ver achado D-02)."*

---

## 5. Pendências declaradas e próximos passos

1. **Diário persistente da rota externa do JEV:** O logging de processo registra a saída (`[A-09][SAIDA-EXTERNA]`), mas a persistência em diário estruturado (`diarioRequisicoes.ts`) requer definição de qual artefato alvo deve receber o log unificado por requisição de auditoria.
2. **Regra de coerência classe↔fração (`A-07b`):** Permanece pendente do gate metodológico `G-05` (estado vs evento), fora do escopo desta contenção técnica.
3. **Emenda textual de D23 em `src/config/decisoes.ts`:** Aguarda decisão e chancela formal do pesquisador.

---

## 6. Comandos e resultados finais

```bash
npm run typecheck                                   → exit 0
npm test                                            → 94 arquivos | 794 passaram | 3 pulados (exit 0)
npm test src/lib/seguranca/padroesProibidos.test.ts → 1 arquivo | 34 passaram (exit 0)
```

Nenhuma operação de `git commit` ou `git push` foi executada (em estrito cumprimento a CLAUDE.md §1).
