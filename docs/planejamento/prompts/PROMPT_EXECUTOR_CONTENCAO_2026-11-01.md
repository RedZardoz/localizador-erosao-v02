# Tarefa: contenção — remover o que pode gravar dado falso

**Versão:** 1.0 — 1 de novembro de 2026
**Base do trabalho:** `f63d8a5` (`sarel/executor-2026-10-09`)
**Origem:** [Consolidação dos achados verificados](../CONSOLIDACAO_ACHADOS_VERIFICADOS_2026-11-01.md) e [Planejamento sequencial](../PLANEJAMENTO_SEQUENCIAL_CORRECOES_2026-11-01.md), Fase 0.

> **Por que este bloco vem primeiro.** Nenhum item aqui depende de decisão pendente, e todos reduzem risco de **dado irreversível**: rótulo humano gravado e selo de D16 não se desfazem. Se um voo ou uma visita de campo ocorrer antes dos gates de desenho, o default de 0,00 no alvo é o único defeito capaz de produzir rótulo falso silencioso.

---

## 1. Papel e limites

**Pode:** implementar código, testes e correções de coerência; refatorar sem mudar semântica.

**Não pode:** decidir metodologia; alterar valor numérico de limiar científico; promover decisão a `"decidida"` em `src/config/decisoes.ts`; escrever limiar literal no código (CLAUDE.md §5 — lê-se do registro via `exigirParametro`).

**Achou problema fora deste escopo:** registre e relate, não conserte (CLAUDE.md §2).

### Autorização de git — a ser preenchida pelo pesquisador

CLAUDE.md §1: nenhuma operação de git sem autorização explícita, específica para aquela operação. **Este prompt não concede autorização.** Marque abaixo o que autoriza:

- [ ] `git commit` na branch ______________________
- [ ] `git push` na branch ______________________
- [ ] nenhuma das duas — escreva os arquivos, relate os caminhos e pare

Se o Stop hook exigir commit ou push sem linha marcada: **não commite**, relate em uma linha e pergunte.

---

## 2. Antes de tocar em qualquer arquivo

Estabeleça o baseline e **registre os números no relatório**. Não os presuma: o baseline citado em prompts anteriores (92 arquivos, 725 testes, 3 pulados) é de 31/10 e pode ter mudado.

```bash
npm run typecheck
npm test
npm test src/lib/seguranca/padroesProibidos.test.ts
```

Qualquer teste que passava e passe a falhar é regressão e deve ser corrigido, não silenciado. Se a suíte falhar por infraestrutura (caminho, acento, `spawn EPERM`), registre a saída e **não conclua que passou**.

---

## 3. Item 1 — Alvo D26 sem default (A-07a)

**Verificado em `f63d8a5`:** `src/components/inspetor/InspetorPonto.tsx`

```
:36  const [fracaoErodidaInput, setFracaoErodidaInput] = React.useState<number>(0.0);
:37  const [classeRotuloInput, setClasseRotuloInput] = React.useState<...>("erosao");
:39  const [observadorInput, setObservadorInput] = React.useState<string>("Pesquisador PPGTCA");
:41  const [confiancaInput, setConfiancaInput] = React.useState<...>("alta");
```

O campo da fração é um `input type="range"` (`:285-293`), que não tem estado vazio. `src/lib/rotulos/rotuloHumano.ts:30-68` exige apenas `observadoEm` e `observador` não vazios — e o segundo é satisfeito pelo default da UI, o que **anula** a própria guarda, cujo comentário diz *"proibido valor-padrão de sistema — C25"*.

**Faça:**

1. A fração erodida passa a iniciar **sem valor** (`number | null`, iniciando `null`). Trocar o `range` puro por entrada numérica que admita vazio, ou manter o slider acompanhado de um campo numérico obrigatório — a decisão de interface é sua, o requisito é que **não exista valor antes de o observador digitar**.
2. `observadorInput` e `confiancaInput` iniciam vazios. Remover `"Pesquisador PPGTCA"` e `"alta"`.
3. `validarEConstruirRotuloHumano` recusa `fracaoErodida` ausente, com motivo formal no mesmo padrão das recusas existentes (Regra 1: ausente permanece ausente, com causa).
4. **Não** implemente a regra de coerência classe↔fração. Ela depende de `G-05` (estado vs evento) e está fora deste prompt.

**Aceite:** não é possível gravar rótulo sem fração digitada; não é possível gravar com observador vindo de default; teste cobre os três casos (fração ausente, observador ausente, gravação válida).

---

## 4. Item 2 — Duplicidade de `pi_i` no módulo de sorteio (N-02)

**Verificado:** `src/lib/gee/sorteioPoligonos.ts` exporta duas rotinas com probabilidade de inclusão incompatível.

| Função | Linha | `pi_i` | `w_i` | n |
|---|---|---|---|---|
| `sortearPoligonosDroneD16` | 108 | `2/N_h` (`:197`) | `N_h/2` (`:198`) | 36 |
| `sortear72PoligonosD16` | 385 | `4/N_h` (`:473`) | `N_h/4` (`:474`) | 72 |

**Estado do risco, também verificado:** os dois chamadores de produção — `src/app/api/gee/sorteio-d16/route.ts:186` e `scripts/sortear_poligonos_d16.ts:246` — usam a função **correta** (`sortear72PoligonosD16`). A legada só é chamada pelos testes. **Portanto é risco latente, não bug ativo.** Não anuncie no relatório como se estivesse selando `pi_i` errado hoje.

O agravante é documental: o **docstring do próprio módulo** (linhas 13 e 106) declara `pi_i = 2 / N_h` como a regra, apontando para a rotina obsoleta.

**Faça:**

1. Deixar inequívoco qual rotina é vigente. Preferência: **remover** `sortearPoligonosDroneD16` e os testes que só a exercitam, preservando os testes de invariante que valham para a vigente. Se preferir conservar por histórico, marque com `@deprecated` e um comentário que nomeie a rotina vigente, e **impeça** o uso: a chamada deve lançar erro tipado em caminho de produção.
2. Corrigir o docstring do módulo (linhas 13 e 106) para `pi_i = 4 / N_h` e `w_i = N_h / 4`.
3. **Registrar, sem corrigir**, a divergência de D23: `src/config/decisoes.ts:425` ainda diz *"36 polígonos de 10 ha, dois por estrato"*, enquanto o código sorteia 72 de 5,02 ha, quatro por estrato. É emenda ao registro, competência do pesquisador (CLAUDE.md §2). Entregue a redação sugerida **no relatório**, não em `decisoes.ts`.

**Aceite:** só uma rotina de sorteio é alcançável a partir da rota e do CLI; o docstring diz `4/N_h`; o relatório traz a redação proposta para D23.

---

## 5. Item 3 — Semente registrada, não fixa (A-03)

**Verificado:** `src/app/api/gee/select-candidates/route.ts:296` — `const semente = 42`, propagada ao thinning (`:327`, `:347`), à realocação de célula (`:413`) e a `:638`, `:643`, `:661`, `:699`.

**Já correto, não mexa:** `scripts/sortear_poligonos_d16.ts` aceita `--semente` (`:94-95`) e a repassa (`:247`); a rota de sorteio D16 e o CLI usam a rotina vigente. O defeito é **só** na rota de candidatos.

P07 decidiu "dinâmica-registrada". Uma constante global não é semente registrada: torna todas as execuções idênticas e retira do sorteio o caráter probabilístico que D23 descreve.

**Faça:**

1. Remover `const semente = 42`. A rota aceita semente explícita; na ausência, gera com `crypto.randomInt(1, 2**31 - 1)`.
2. Registrar a semente efetiva no relatório de seleção, no critério de seleção e na proveniência dos candidatos.
3. Confirmar que `scripts/sortear_poligonos_d16.ts` **exige** `--semente` quando `--confirmar` é usado; se houver default embutido, remova-o.

**Aceite:** duas execuções sem semente explícita produzem pools diferentes; a mesma semente reproduz o pool e aparece no registro; `--confirmar` sem `--semente` falha.

---

## 6. Item 4 — Fabricações numéricas (A-08)

Todos os pontos abaixo foram **verificados em `f63d8a5`**. Dois deles não constam da proposta de 01/11 e estão marcados.

| Arquivo | Linha | O que há | Regra violada |
|---|---|---|---|
| `src/lib/gee/serieTemporal.ts` | 51 | `if (Math.abs(soma) < 1e-6) return 0;` em `calcularNdvi` | Regra 1 — NDVI 0 por denominador nulo é indistinguível de NDVI 0 real |
| `src/lib/gee/serieTemporal.ts` | 53-54 | `if (val > 1) return 1; if (val < -1) return -1;` | Regra 2 — corte silencioso |
| `src/lib/gee/serieTemporal.ts` | ~75+ | `calcularBsi`: conferir o mesmo padrão de denominador e clamp | Regras 1 e 2 |
| `src/lib/matriz/montagem.ts` | 282, 342 | `?? "BLOCO_INDEFINIDO"` | Regra 1 |
| `src/lib/export/planilha.ts` | 311 | `?? "BLOCO_INDEFINIDO"` **(não está na proposta)** | Regra 1 |
| `src/lib/jev/jevClient.ts` | 145 | `: 0.95` como confiança default | Regra 1 |
| `src/lib/jev/fallbackLocal.ts` | 53 | `confiancaCobertura = 0.95` **(não está na proposta)** | Regra 1 |

**Faça:**

1. `calcularNdvi` e `calcularBsi` retornam `null` quando o denominador é nulo e **não** clampam para `±1`. O chamador marca `indisponivel` com causa, ou `fora-do-dominio` conforme o caso.
2. Remover `"BLOCO_INDEFINIDO"` nos **três** pontos. Ponto sem bloco espacial **não entra** no perfil de treino — rejeição explícita, não rótulo de preenchimento.
3. Remover a confiança `0,95` do JEV nos dois pontos. O laudo é heurístico e não carrega número de confiança (ver item 5).

**Caso que exige relato antes de alterar — `src/lib/gee/amostragemSoloNuLote.ts:497`:**

```
const clamped = Number(Math.max(0, Math.min(1, rawSoloNu)).toFixed(4)); // permitido: clamp de seguranca numerica para fracao normalizada de satelite no intervalo 0 a 1
```

O comentário `// permitido:` indica concessão **deliberada** ao varredor de padrões proibidos. A Regra 2 proíbe limites artificiais, mas remover uma concessão declarada pode reverter decisão anterior consciente. **Procure** a decisão ou verificação que a sustente (`decisoes.ts`, `docs/verificacoes/`, histórico do git da linha). Se encontrar, **não altere** e relate. Se não encontrar, aplique a Regra 2 — fração fora de `[0,1]` é erro de dado, não valor a cortar — e relate a ausência de lastro para a concessão.

**Aceite:** `0/0` em NDVI retorna indisponível; BSI fora de `[-1,1]` retorna indisponível; ponto sem bloco é rejeitado no treino; nenhum laudo JEV carrega confiança numérica; o caso do clamp está relatado com a conclusão da busca.

---

## 7. Item 5 — JEV sem coordenadas e sem confiança fabricada (A-09)

**Verificado:** `src/lib/jev/jevClient.ts:60` lê o município e `:65` monta `"Coordenadas WGS84: Lat ..., Lon ..."` no texto enviado à API externa.

O projeto trata coordenada como dado sensível — Invariante 2, cegamento de D16, LGPD. Enviá-la a serviço externo contradiz essa postura. Um "grau de suscetibilidade" produzido por LLM também não é medida calibrada.

**Faça:**

1. Remover latitude, longitude e município do payload externo. Enviar apenas o que a auditoria heurística exige: índices espectrais, classe de solo e declividade.
2. Exigir opt-in explícito por requisição; registrar a saída no diário local.
3. Marcar o laudo como `HEURISTICA` e garantir que não entre em `montarMatrizTreino` como rótulo, alvo ou métrica (Regra 4).

**Aceite:** teste assevera que o payload não contém coordenada nem município; teste assevera que o laudo não é aceito como rótulo.

---

## 8. Fora de escopo

1. **Não** toque em `src/lib/matriz/perfis.ts` nem no esquema da matriz. O contrato de dados (`A-05`) depende de `G-01` a `G-04` e é o prompt `P-M`.
2. **Não** altere `scripts/d25/`. `A-06` depende do contrato e de `G-13`.
3. **Não** altere `src/config/decisoes.ts`, nem crie parâmetro novo ali.
4. **Não** implemente a regra de coerência classe↔fração (depende de `G-05`), nem o filtro de cobertura P11 (depende de `G-06`).
5. **Não** decida entre as saídas de `B-01`, nem mexa na estratificação.
6. **Não** mexa nas dívidas de lastro — são do prompt `P-L`.
7. **Não** abra pull request.

---

## 9. Relatório

Grave em `docs/auditorias/RELATORIO_CONTENCAO_2026-11-01.md`:

1. Baseline medido antes das alterações (arquivos, testes passados, pulados, falhados) e o mesmo depois.
2. Comando → saída para `typecheck`, `test` e o varredor de padrões proibidos.
3. Item por item (1 a 5): arquivos tocados, o que mudou, teste que cobre.
4. **Redação proposta para a emenda de D23** (36×10 ha → 72×5,02 ha), para decisão do pesquisador.
5. Conclusão da busca pelo lastro da concessão `// permitido:` em `amostragemSoloNuLote.ts:497`.
6. O que ficou pendente e por quê.

**Resposta final:** 5 a 10 linhas; tabela dos 5 itens com estado; comando → resultado dos testes; o que exige decisão do pesquisador.

**Fim do prompt.** Nenhuma decisão ou parâmetro científico é alterado por este arquivo.
