# Relatório de Evidência: Junção de Ê no CLI do Sorteio D16 (Prompt K)

**Data:** 2026-11-10  
**Branch:** `correcoes/contencao-2026-11-02`  
**Escopo:** Implementação da junção determinística entre universo de candidatos e medições de Ê no CLI `scripts/sortear_poligonos_d16.ts`, compartilhamento de lógica com testes, travas fail-closed e testes de subprocesso.

---

## 1. Defeito Medido Antes da Correção

Ao invocar o comando de simulação:
```bash
node --import ./scripts/ts-loader.mjs scripts/sortear_poligonos_d16.ts --dry-run --candidatos docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json
```
o CLI lia o arquivo bruto de candidatos (`universo_candidatos_bp3_d16_2026-11-10.json`), que não continha o objeto formal `provenienciaE` nem a propriedade numérica `frequenciaSoloNu` (ambos são gerados pelo satélite via GEE e persistidos em `docs/verificacoes/cache_frequencia_solo_nu_bp3.json`).

Como resultado, o motor filtrava candidatos elegíveis descartando os 677 registros e emitia:
```text
Total de candidatos avaliados: 0
...
Contagem de candidatos por estrato (18 estratos de D12):
  - E_1_1_1:   0 candidatos | ESTRATO VAZIO DECLARADO (N_h = 0)
  ...
  - E_3_3_2:   0 candidatos | ESTRATO VAZIO DECLARADO (N_h = 0)
```
Confundia-se, assim, ausência de junção de dados com ausência de terreno (defeito de classe: teste que montava o insumo à mão em loop de teste vs caminho de produção/CLI que não o montava).

A saída completa do defeito medido encontra-se gravada em:
`docs/verificacoes/execucao/2026-11-10k/defeito_medido.txt`.

---

## 2. Função Compartilhada `juntarCandidatosComCacheSoloNu`

Para assegurar que o caminho de produção (CLI) e os testes unitários sigam rigorosamente a mesma regra de junção determinística, foi implementada e exportada a função:

- **Localização:** `src/lib/gee/sorteioPoligonos.ts` (linhas 570–674)
- **Assinatura:**
  ```typescript
  export function juntarCandidatosComCacheSoloNu(
    candidatos: any[],
    cacheOuCaminho: string | CacheFrequenciaSoloNuArquivo,
    opcoes?: { caminhoOrigem?: string }
  ): CandidatoSorteioD16[]
  ```

### Migração dos Testes Existentes
Os três pontos de testes em `src/lib/gee/sorteioPoligonos.test.ts` que antes montavam manualmente o pool real via laço `for (const cand of dadosCandidatos.candidatos)` foram refatorados para utilizar exclusivamente `juntarCandidatosComCacheSoloNu(dadosCandidatos.candidatos, dadosCache)`.

---

## 3. Travas Fail-Closed Implementadas

A função `juntarCandidatosComCacheSoloNu` e o CLI `scripts/sortear_poligonos_d16.ts` aplicam validações estritas sob o prefixo `[ERRO_JUNCAO_E]`:

1. **Arquivo de Cache Inexistente ou Inválido:**
   Se o caminho indicado por `--cache` não existir no disco ou o objeto JSON não contiver a chave `itens`, a execução falha imediatamente com exit code 1:
   ```text
   [ERRO_JUNCAO_E] Arquivo de cache de frequência de solo nu não encontrado: <caminho>
   ```
2. **Divergência de Hash de Definição:**
   Se `cache.hashDefinicao` diferir do hash canônico calculado por `calcularHashDefinicao()` (`6a63a17cb9760d507648b903beec99cfcce6479940e9041b90f23dc59daa7a21`), a execução falha imediatamente:
   ```text
   [ERRO_JUNCAO_E] Divergência no hash da definição de Ê. Cache: <hashCache>, Esperado: <hashEsperado>
   ```
3. **Candidato sem Medição Válida de Ê:**
   Se qualquer candidato presente no conjunto não possuir medição válida no cache, a execução falha relatando a contagem de faltantes e até 5 IDs exemplares:
   ```text
   [ERRO_JUNCAO_E] N candidatos não possuem medição válida de frequência de solo nu no cache. Exemplos: cand-01, cand-02
   ```
4. **Contagem Zero com Ê:**
   Se a contagem total de candidatos válidos após a junção for zero, o CLI falha com mensagem explícita em vez de imprimir uma tabela vazia de 18 estratos:
   ```text
   [ERRO_JUNCAO_E] Nenhum candidato possui medição válida de Ê após junção com o cache.
   ```

No CLI, foi adicionado o argumento:
- `--cache <caminho>` (com valor padrão `docs/verificacoes/cache_frequencia_solo_nu_bp3.json`).

---

## 4. Testes de Subprocesso do CLI (Tarefa 2)

Foram adicionados dois testes automatizados de subprocesso ao final de `src/lib/gee/sorteioPoligonos.test.ts`:

1. **Exercício do CLI com `--dry-run`, `--candidatos` e `--cache` reais:**
   - Comando executado: `node --import ./scripts/ts-loader.mjs scripts/sortear_poligonos_d16.ts --dry-run --candidatos docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json --cache docs/verificacoes/cache_frequencia_solo_nu_bp3.json`
   - Validações bem-sucedidas:
     - `Total de candidatos avaliados: 677`
     - Notação compacta: `totais 67 / 34 / 33 / 336,34`
     - `E_1_3_2:   0 candidatos | ESTRATO VAZIO DECLARADO (N_h = 0)` (estrato genuinamente vazio no terreno)
     - `E_1_2_2:   3 candidatos | CENSO DO ESTRATO (pi_i = 1, w_i = 1, sem suplente)`
     - Modo `DRY-RUN` ativo e nenhum arquivo gravado em `docs/verificacoes/sorteio/`.
2. **Garantia de Fail-Closed do CLI com `--cache` apontando para arquivo inexistente:**
   - Comando executado com `--cache docs/verificacoes/cache_inexistente_9999.json`
   - Verifica saída com exit code 1 e mensagem contendo `[ERRO_JUNCAO_E]`.

---

## 5. Varredura de Instanciação e Proveniência de Ê (Tarefa 3)

Comando executado:
```bash
git grep -n "provenienciaE" -- src scripts
```
(Saída completa gravada em `docs/verificacoes/execucao/2026-11-10k/grep_provenienciaE.txt`).

### Mapeamento de Pontos de Construção de `CandidatoSorteioD16` e `CandidatoEstratificacao`:

1. **`src/lib/gee/sorteioPoligonos.ts` (`juntarCandidatosComCacheSoloNu`):**
   - **Preenche `provenienciaE`?** Sim.
   - **Origem:** Campo `frequenciaSoloNu` do item correspondente em `docs/verificacoes/cache_frequencia_solo_nu_bp3.json` (medição via GEE REST sob regime `padrao_pleno`, $N=50$).

2. **`scripts/sortear_poligonos_d16.ts` (`gerarConjuntoInspecaoDryRun`):**
   - **Preenche `provenienciaE`?** Sim.
   - **Origem:** Gerado sinteticamente com `medido(...)` em regime `padrao_pleno`, estritamente documentado para fallback quando nenhuma flag `--candidatos` for informada.

3. **`scripts/sortear_poligonos_d16.ts` (Carregamento via CLI):**
   - **Preenche `provenienciaE`?** Sim, via `juntarCandidatosComCacheSoloNu`.

4. **`src/app/api/gee/select-candidates/route.ts` (Linhas 662–676):**
   - **Preenche `provenienciaE`?** Sim.
   - **Origem:** `p.temporal?.D?.serie?.frequenciaSoloNu` gerado pela amostragem do polígono.

5. **`src/components/decisoes/PainelSorteioD16.tsx` (Linhas 62–89):**
   - **Preenche `provenienciaE`?** Sim.
   - **Origem:** `p.temporal?.D?.serie?.frequenciaSoloNu`.

6. **`scripts/verificar_pool_estratos.ts` (Linhas 197–205):**
   - **Preenche `provenienciaE`?** Injeta sinteticamente se ausente.
   - **Origem:** Injeta objeto sintético de proveniência quando o arquivo possui apenas `frequenciaSoloNu` numérico, para permitir a verificação das taxas de amostragem. Não afeta a rotina do sorteio D16 oficial.

7. **`src/app/api/gee/sorteio-d16/route.ts` (Linhas 91–95):**
   - **Preenche `provenienciaE`?** Não faz junção local; espera que `body.candidatos` já possua os campos preenchidos. Caso receba candidatos sem `provenienciaE`, a função `verificarPreCondicoesSorteioD16` rejeita a requisição fail-closed nomeando `[PRÉ-CONDIÇÃO REPROVADA: guarda_d11_2_proveniencia_e]`.

8. **Testes Unitários (`sorteioPoligonos.test.ts`, `estratificacao.test.ts`, `guardaD11_2.test.ts`):**
   - Preenchem `provenienciaE` via helpers de teste (`provEValida`, `medido`) ou agora através de `juntarCandidatosComCacheSoloNu`.

---

## 6. O Que NÃO Foi Feito

Conforme estipulado no protocolo anti-fabricação e no planejamento do Prompt K:
- O comando com `--confirmar` **NÃO** foi executado nesta etapa.
- Nenhum selo de sorteio foi gerado em `docs/verificacoes/sorteio/`.
- A execução do sorteio real irreversível permanece reservada para o **Prompt J**, que deverá ser executado com `--candidatos docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json --cache docs/verificacoes/cache_frequencia_solo_nu_bp3.json`.

---

## 7. Registro de Execução e Verificações

- `npm test`: 108 arquivos de teste passaram (921 testes aprovados, 3 skipped). Gravado em `docs/verificacoes/execucao/2026-11-10k/npm_test.txt`.
- `npx tsc --noEmit`: 0 erros de compilação. Gravado em `docs/verificacoes/execucao/2026-11-10k/tsc_noemit.txt`.
- `npm run estado:verificar`: Sincronizado com sucesso. Gravado em `docs/verificacoes/execucao/2026-11-10k/estado_verificar.txt`.
- `git status --short`: Gravado em `docs/verificacoes/execucao/2026-11-10k/git_status.txt`.
- `git log --oneline -3`: Gravado em `docs/verificacoes/execucao/2026-11-10k/git_log.txt`.
