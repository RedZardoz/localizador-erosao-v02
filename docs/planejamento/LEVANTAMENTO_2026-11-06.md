# SESSÃO DE LEVANTAMENTO — Adoção da Linha Oficial e Auditoria de Estado
**Data:** 2026-11-06  
**Repositório:** SAREL (PPGTCA 2026)  
**Branch de Execução:** `correcoes/contencao-2026-11-02` (HEAD `af3a72d`)  
**Natureza da Sessão:** Auditoria estrita de código e estado, sem alteração de código-fonte de aplicação (§4, §8, §22, §23.8).

---

## 1. TAREFA 1 — Confirmação da Linha Oficial de Trabalho

### 1.1 Comando de sincronização remota
```bash
git fetch --all --tags --prune
```

### 1.2 Tabela de Linhagem das Branches Remotas
Critério de ancestralidade em relação a `origin/correcoes/contencao-2026-11-02` (`af3a72d`, 2026-11-06):
`git merge-base --is-ancestor <branch> origin/correcoes/contencao-2026-11-02`

| Branch Remota | Hash HEAD | Data HEAD | Arquivos Versionados | Arquivos `*.test.ts` | É Ancestral Estrito de `contencao-2026-11-02`? | Commits à Frente de `contencao-2026-11-02` |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `origin/correcoes/contencao-2026-11-02` | `af3a72d` | 2026-11-06 | 846 | 98 | **SIM (HEAD Atual)** | 0 |
| `origin/correcoes/consolidacao-achados-2026-11-01` | `5c8e310` | 2026-11-02 | 845 | 98 | SIM | 0 |
| `origin/sarel/executor-2026-10-09` | `28f4ebf` | 2026-11-01 | 841 | 96 | SIM | 0 |
| `origin/sarel/v2` | `1e95640` | 2026-10-18 | 800 | 83 | SIM | 0 |
| `origin/main` | `a165c71` | 2026-09-02 | 148 | 0 | SIM | 0 |
| `origin/correcoes/auditoria-2026-09` | `d2a7b5a` | 2026-09-17 | 622 | 47 | NÃO (Divergente / Estagnada) | 0 commits exclusivos da auditoria (331 commits atrás) |
| `origin/claude/quirky-lovelace-cckuzc` | `edf05b1` | 2026-11-06 | 627 | 47 | NÃO (Divergente / Isolada) | 3 commits à frente de `d2a7b5a`, nenhum na linha v2 |
| `origin/claude/brave-lovelace-tq5jt0` | `b5aaefc` | 2026-11-06 | 627 | 47 | NÃO (Divergente / Isolada) | 1 commit à frente de `d2a7b5a` |
| `origin/claude/pensive-keller-v2d2bt` | `6cce75c` | 2026-11-06 | 627 | 47 | NÃO (Divergente / Isolada) | 1 commit à frente de `d2a7b5a` |
| `origin/claude/trusting-mendel-c3mozf` | `378cf23` | 2026-11-06 | 627 | 47 | NÃO (Divergente / Isolada) | 1 commit à frente de `d2a7b5a` |
| `origin/claude/affectionate-galileo-8abtjo` | `23ca4cc` | 2026-09-24 | 165 | 0 | NÃO (Divergente / Slides) | 4 commits de slides de apresentação sobre `a165c71` |

### 1.3 Conclusão da Tarefa 1
- `origin/correcoes/contencao-2026-11-02` é de fato o **descendente mais avançado** de toda a árvore oficial do SAREL v2.
- Nenhuma outra branch de trabalho contém commits que `contencao-2026-11-02` não contenha. As branches `claude/*` foram geradas a partir de `d2a7b5a` (17/09/2026), estando 331 commits defasadas e completamente cegas a toda a implementação das fases 0 a 5 do SAREL v2.

---

## 2. TAREFA 2 — Três Verdes e Build: Saída Bruta e Testes Pulados

### 2.1 Saída Bruta: `npm ci`
```text
added 549 packages, and audited 550 packages in 2m
142 packages are looking for funding
  run `npm fund`
found 0 vulnerabilities
```

### 2.2 Saída Bruta: `npm run test`
```text
> sarel@2.0.0 test
> vitest run --exclude "**/*.vivo.test.ts"

 RUN  v2.1.9 c:/Users/lalfr/Docs Fora do Ar/LUIS ALFREDO/01 - MESTRADO PPGTCA 2026/02 - PESQUISA EROSÃO LAMINAR/geolocalizacao-erosao-propriedade

 ✓ src/lib/seguranca/verificacoes.test.ts (4 tests) 117ms
 ✓ src/lib/rusle/fatorR.test.ts (11 tests) 20ms
 ✓ src/lib/fundiario/verificadorManifesto.test.ts (6 tests) 17ms
 ✓ src/lib/chuva/chirpsClient.test.ts (6 tests) 31ms
 ✓ src/lib/seguranca/detectorSequencia.test.ts (7 tests) 15ms
 ✓ src/lib/rusle/fatorLS.test.ts (16 tests) 20ms
 ✓ src/lib/export/reprodutibilidade.test.ts (6 tests) 17ms
 ✓ src/lib/geo/utm.test.ts (5 tests) 13ms
 ✓ src/lib/export/geradorPacoteReprodutibilidade.test.ts (3 tests) 30ms
 ✓ src/lib/rotulos/ingestaoDrone.test.ts (7 tests) 21ms
 ✓ src/lib/geo/distorcaoProjecao.test.ts (10 tests) 16ms
 ✓ src/lib/export/validadorCsvD26.test.ts (10 tests) 18ms
 ✓ src/lib/geo/areaContribuicaoCopernicus.test.ts (8 tests) 18ms
 ✓ src/lib/gee/calculoD16.test.ts (9 tests) 17ms
 ✓ src/lib/export/pipelineExportacao.test.ts (9 tests) 35ms
 ✓ src/lib/rusle/fatorK.test.ts (13 tests) 20ms
 ✓ src/lib/amostragem/thinningEspacial.test.ts (10 tests) 16ms
 ✓ src/lib/gee/analisadorJanelaTemporal.test.ts (5 tests) 16ms
 ✓ src/lib/rusle/fatorC.test.ts (11 tests) 25ms
 ✓ src/lib/amostragem/alocacaoNeyman.test.ts (13 tests) 18ms
 ✓ src/lib/geo/calculoCotas.test.ts (5 tests) 12ms
 ✓ src/lib/chuva/pluviometriaIat.test.ts (6 tests) 25ms
 ✓ src/lib/estatistica/quantilHyndmanFan.test.ts (12 tests) 22ms
 ✓ src/lib/fundiario/consultaRobusta.test.ts (8 tests) 30ms
 ✓ src/lib/amostragem/pesosAmostraisD23.test.ts (13 tests) 24ms
 ✓ src/lib/amostragem/redutorUniversoCandidatos.test.ts (10 tests) 20ms
 ✓ src/lib/gee/estatisticasSerie.test.ts (9 tests) 21ms
 ✓ src/lib/export/xlsxWriter.test.ts (6 tests) 28ms
 ✓ src/lib/geo/curvaturaVertente.test.ts (7 tests) 13ms
 ✓ src/lib/rusle/rusle.test.ts (21 tests) 32ms
 ✓ src/lib/embrapa/validadorPedologia.test.ts (9 tests) 21ms
 ✓ src/lib/amostragem/alocacaoEstratos.test.ts (11 tests) 16ms
 ✓ src/lib/embrapa/clienteErodibilidade2024.test.ts (15 tests) 27ms
 ✓ src/lib/export/escritorLinhasExportacao.test.ts (15 tests) 29ms
 ✓ src/lib/export/conversorGeoJson.test.ts (8 tests) 23ms
 ✓ src/lib/amostragem/sorteioPoligonosD16.test.ts (12 tests) 22ms
 ✓ src/lib/amostragem/gerenciadorLotes.test.ts (10 tests) 18ms
 ✓ src/lib/amostragem/estratos.test.ts (10 tests) 16ms
 ✓ src/lib/amostragem/diagnosticoEstratos.test.ts (5 tests) 16ms
 ✓ src/lib/export/validadorIntegridadePacote.test.ts (6 tests) 19ms
 ✓ src/lib/export/formatadorCsv.test.ts (10 tests) 17ms
 ✓ src/lib/localizacao/bacia.test.ts (4 tests) 14ms
 ✓ src/lib/amostragem/gradeAmostral.test.ts (6 tests) 12ms
 ✓ src/lib/chuva/serieTemporalChirps.test.ts (7 tests) 16ms
 ✓ src/lib/geo/perfilTopografico.test.ts (7 tests) 12ms
 ✓ src/lib/amostragem/calculadoraTamanhoAmostral.test.ts (13 tests) 15ms
 ✓ src/lib/amostragem/desenhoAmostralD16.test.ts (14 tests) 24ms
 ✓ src/lib/gee/triagemEspectral.test.ts (7 tests) 16ms
 ✓ src/lib/export/conversorLinhasPlanilha.test.ts (12 tests) 22ms
 ✓ src/lib/geo/acumuloFluxoCopernicus.test.ts (9 tests) 15ms
 ✓ src/lib/export/scriptAvaliacaoD25.test.ts (14 tests) 26ms
 ✓ src/lib/geo/perfilCurvatura.test.ts (7 tests) 13ms
 ✓ src/lib/drone/geradorPlanoVoo.test.ts (13 tests) 17ms
 ✓ src/lib/gee/analisadorConcordanciaS2Planet.test.ts (4 tests) 15ms
 ✓ src/lib/export/geradorArquivosPacote.test.ts (6 tests) 19ms
 ✓ src/lib/geo/twiCopernicus.test.ts (9 tests) 16ms
 ✓ src/lib/geo/declividadeCopernicus.test.ts (8 tests) 12ms
 ✓ src/lib/gee/validadorFrequenciaSoloNu.test.ts (9 tests) 17ms
 ✓ src/lib/export/validadorEstruturaPacote.test.ts (6 tests) 14ms
 ✓ src/lib/amostragem/selecaoCandidatos.test.ts (8 tests) 16ms
 ✓ src/lib/amostragem/exportadorCandidatosD16.test.ts (10 tests) 21ms
 ✓ src/lib/gee/copernicusGeeClient.test.ts (9 tests) 16ms
 ✓ src/lib/gee/auth.test.ts (8 tests) 17ms
 ✓ src/lib/gee/amostragemSoloNuLote.test.ts (6 tests) 17ms
 ✓ src/lib/export/csvWriter.test.ts (7 tests) 16ms
 ✓ src/lib/export/manifestoReprodutibilidade.test.ts (7 tests) 16ms
 ✓ src/lib/amostragem/diagnosticoVies.test.ts (10 tests) 17ms
 ✓ src/lib/gee/serieTemporal.test.ts (11 tests) 16ms
 ✓ src/lib/drone/planoVooNControl.test.ts (11 tests) 17ms
 ✓ src/lib/embrapa/embrapaSoilClient.test.ts (12 tests) 23ms
 ✓ src/lib/localizacao/municipio.test.ts (7 tests) 15ms
 ✓ src/lib/export/colunasExportacao.test.ts (11 tests) 15ms
 ✓ src/lib/geo/elevacaoCopernicus.test.ts (8 tests) 16ms
 ✓ src/lib/amostragem/otimizadorRastreioEspectral.test.ts (10 tests) 17ms
 ✓ src/lib/export/validadorColunas.test.ts (13 tests) 16ms
 ✓ src/lib/jev/jevClient.test.ts (13 tests) 22ms
 ✓ src/lib/fundiario/validadorFundiario.test.ts (8 tests) 16ms
 ✓ src/lib/export/extratorMetadadosPacote.test.ts (7 tests) 15ms
 ✓ src/lib/export/montadorMatrizTreino.test.ts (14 tests) 19ms
 ✓ src/lib/export/construtorColunas.test.ts (14 tests) 17ms
 ✓ src/lib/export/validadorPerfis.test.ts (9 tests) 16ms
 ✓ src/lib/matriz/perfis.test.ts (12 tests) 16ms
 ✓ src/lib/export/escritorPacoteZip.test.ts (8 tests) 20ms
 ✓ src/lib/export/geradorReadmePacote.test.ts (6 tests) 17ms
 ✓ src/lib/seguranca/padroesProibidos.test.ts (24 tests) 3180ms
 ✓ src/lib/fundiario/matcher.test.ts (10 tests | 3 skipped) 20ms
 ✓ src/lib/amostragem/validadorDesenhoAmostral.test.ts (11 tests) 15ms
 ✓ src/lib/geo/aspectCopernicus.test.ts (7 tests) 14ms
 ✓ src/lib/export/validadorAmostragemD16.test.ts (6 tests) 17ms
 ✓ src/lib/export/escritorRelatorioInspecao.test.ts (8 tests) 17ms
 ✓ src/lib/amostragem/validadorSorteioD16.test.ts (10 tests) 16ms
 ✓ src/lib/export/escritorLinhasGeoJson.test.ts (13 tests) 18ms
 ✓ src/lib/export/verificadorCegamento.test.ts (11 tests) 16ms
 ✓ src/lib/export/escritorMetadadosPacote.test.ts (7 tests) 15ms
 ✓ src/lib/export/geradorRelatorioMudancas.test.ts (3 tests) 17ms
 ✓ src/lib/export/geradorScriptAvaliacao.test.ts (6 tests) 16ms

 Test Files  96 passed (96)
      Tests  801 passed | 3 skipped (804)
   Start at  17:28:44
   Duration  23.20s (transform 3.01s,setup 0ms,collect 2.91s,tests 4.39s,environment 1ms,prepare 6.94s)
```

### 2.3 Saída Bruta: `npx tsc --noEmit`
```text
(exit code 0, 0 erros)
```

### 2.4 Saída Bruta: `npm run lint`
```text
> sarel@2.0.0 lint
> next lint

./src/components/map/MapViewer.tsx
526:6  Warning: React Hook useEffect has a missing dependency: 'credenciais.mapboxToken'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps

./src/components/map/PointPopup.tsx
69:6  Warning: React Hook useEffect has missing dependencies: 'atualizarPontoIndividual' and 'point'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
```
Resultado: 0 erros, 2 avisos (ambos `react-hooks/exhaustive-deps`).

### 2.5 Saída Bruta: `npm run build`
```text
> sarel@2.0.0 build
> next build

  ▲ Next.js 14.2.35

   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...

./src/components/map/MapViewer.tsx
526:6  Warning: React Hook useEffect has a missing dependency: 'credenciais.mapboxToken'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps

./src/components/map/PointPopup.tsx
69:6  Warning: React Hook useEffect has missing dependencies: 'atualizarPontoIndividual' and 'point'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
   Collecting page data ...
   Generating static pages (0/10) ...
   Generating static pages (2/10) 
   Generating static pages (4/10) 
   Generating static pages (7/10) 
 ✓ Generating static pages (10/10)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    268 kB          356 kB
├ ○ /_not-found                          873 B          88.7 kB
├ ƒ /api/auth/gee-session                0 B                0 B
├ ƒ /api/auth/gee-test                   0 B                0 B
├ ƒ /api/embrapa/solo                    0 B                0 B
├ ƒ /api/fundiario/consulta              0 B                0 B
├ ƒ /api/fundiario/status                0 B                0 B
├ ƒ /api/gee/inspect-point               0 B                0 B
├ ƒ /api/gee/select-candidates           0 B                0 B
├ ƒ /api/gee/sorteio-d16                 0 B                0 B
├ ƒ /api/jev/auditar                     0 B                0 B
├ ƒ /api/jev/test                        0 B                0 B
└ ƒ /api/sitios-referencia               0 B                0 B
+ First Load JS shared by all            87.8 kB
  ├ chunks/117-62423ae8fa0a0706.js       31.7 kB
  ├ chunks/fd9d1056-d17313c03983f67e.js  53.6 kB
  └ other shared chunks (total)          2.47 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
(exit code 0)
```

### 2.6 Auditoria dos 3 testes pulados
- **Arquivo e Linhas:** `src/lib/fundiario/matcher.test.ts:119, 136, 148`
- **Mecanismo:** `it.skipIf(!baseDisponivel)` onde `const baseDisponivel = fs.existsSync(dbPath)` e `dbPath = path.resolve(process.cwd(), "data/fundiario_brasil.db")`.
- **Natureza:** É um skip **condicional** baseado na presença física do banco SQLite local de 2 GB (`data/fundiario_brasil.db`), que não é versionado no Git por restrição de tamanho. NÃO é um skip incondicional (`it.skip`).
- **Commit de introdução:** `02b96d6` (2026-10-30), "fix(fundiario): adiciona manifesto de integridade e testes condicionais".
- **Conformidade §23.9:** Como o skip é estritamente condicional à presença do insumo no ambiente de execução, não viola a vedação de skip incondicional do §23.9, mas os testes deveriam ser migrados para `matcher.vivo.test.ts` conforme a política de segregação de testes externos.

---

## 3. TAREFA 3 — As Guardas Automáticas Realmente Guardam?

### 3.1 Item 3(a): Disparo de CI e Histórico no GitHub Actions
- **Arquivo:** `.github/workflows/guardas_cientificas.yml:3-11`
- **Triggers configurados:**
  ```yaml
  on:
    push:
      branches:
        - main
        - 'sarel/**'
    pull_request:
      branches:
        - main
        - 'sarel/**'
  ```
- **Linha de trabalho:** `correcoes/**` (ex: `correcoes/contencao-2026-11-02`).
- **Execuções nos últimos 30 dias (API GitHub):**
  - Total de execuções: **32**
  - Branches executadas: **32 em `sarel/executor-2026-10-09`**, **0 em `correcoes/**`**.
  - Resultados: **32 falhas (100% failure)**, 0 sucessos.
- **Resultado:** **CONFIRMADO**. O CI nunca roda na linha de desenvolvimento ativa (`correcoes/**`), e todas as execuções na branch legada falharam.

### 3.2 Item 3(b): Passo de Lint com `--max-warnings 0`
- **Arquivo:** `.github/workflows/guardas_cientificas.yml:34-40`
- **Comando:** `run: npm run lint -- --max-warnings 0`
- **Comentário explícito no workflow:**
  ```yaml
  # NOTA DE GOVERNANÇA (GOV-6):
  # Este passo requer 0 warnings. Enquanto o bloco C28 (dependências de useEffect
  # em MapViewer.tsx:526 e PointPopup.tsx:69) não for aplicado pelo pesquisador,
  # este passo reprovará conforme portão de governança declarado.
  ```
- **Resultado:** **CONFIRMADO**. Como o lint gera 2 avisos de React Hooks, o portão do CI está configurado para reprovar permanentemente enquanto o pesquisador não sanear C28.

### 3.3 Item 3(c): Presença de `npm run build` no Workflow
- **Arquivo:** `.github/workflows/guardas_cientificas.yml`
- **Passos existentes:** Checkout, Setup Node, `npm ci`, `npm run typecheck`, `npm run lint -- --max-warnings 0`, `npm test`.
- **Passo `npm run build`:** Ausente.
- **Resultado:** **CONFIRMADO**.

### 3.4 Item 3(d): Defasagem de Contagem de Testes no Comentário do Workflow
- **Arquivo:** `.github/workflows/guardas_cientificas.yml:42`
- **Texto:** `# Todos os 86 arquivos e 663+ testes do SAREL executam em ambiente autocontido`
- **Medição real (Tarefa 2):** 96 arquivos de teste, 804 testes no total (801 aprovados, 3 pulados).
- **Resultado:** **CONFIRMADO**. Comentário defasado em 10 arquivos e 141 testes.

### 3.5 Item 3(e): Operacionalidade do Hook de Pre-Commit (.husky)
- **Arquivo `.husky/pre-commit`:** Existe.
- **`package.json` script `prepare`:** `undefined` (inexistente).
- **`husky` em `devDependencies`:** `false` (não instalado).
- **`git config core.hooksPath`:** Não configurado (retorna vazio/erro).
- **`.git/hooks/pre-commit`:** Inexistente.
- **Teste Empírico Executado:**
  1. Criado arquivo `src/temp_test_violation.ts` com `export const mockData = { id: 1 };` (violação explícita de `identificador-admite-simulacao`).
  2. `git add src/temp_test_violation.ts` e `git commit -m "teste descartavel hook"`.
  3. Resultado: Commit `786fe71` criado com sucesso sem executar qualquer verificação de tipos ou varredor.
  4. Desfeito imediatamente com `git reset --hard HEAD~1`.
- **Resultado:** **CONFIRMADO**. O hook de pre-commit é inoperante e nunca executa localmente.

### 3.6 Item 3(f): Raiz de Varredura de `padroesProibidos.test.ts` e Lista de Exceções
- **Raiz de varredura ativa:**
  - Código TS/TSX: `src/lib`, `src/app/api`, `src/store`, `src/config`, `src/components` (`padroesProibidos.test.ts:315-317`).
  - **Lacuna detectada:** Arquivos na raiz de `src/app/` (como `src/app/page.tsx` e `src/app/layout.tsx`) NÃO são varridos, pois apenas `src/app/api` está na lista.
- **Contagem de Exceções no Repositório:**
  - Total de ocorrências de `// permitido:` e `# permitido:` no repositório: 50
  - Excluindo arquivos do próprio detector e comentários discursivos: **41 ocorrências ativas em código**.

#### Tabela Completa de Exceções `// permitido:` e `# permitido:`
| Nº | Arquivo:Linha | Trecho / Padrão | Justificativa Registrada |
| :---: | :--- | :--- | :--- |
| 1 | `scripts/remedir_candidatos_bp3_d16.ts:275` | `parsedCache.itens ?? {}` | Fallback para cache vazio quando `cache_pedologia_bp3.json` não possui chave itens |
| 2 | `scripts/treinar_xgboost_loco.py:407` | `# permitido: EXC-DRYRUN-SINTETICO-XGBOOST` | Geração explícita de benchmark de pipeline quando solicitado via flag dry-run |
| 3 | `scripts/treinar_xgboost_loco.py:409` | `# permitido: EXC-DRYRUN-SINTETICO-XGBOOST` | Geração explícita de benchmark de pipeline quando solicitado via flag dry-run |
| 4 | `scripts/treinar_xgboost_loco.py:411` | `# permitido: EXC-DRYRUN-SINTETICO-XGBOOST` | Geração explícita de benchmark de pipeline quando solicitado via flag dry-run |
| 5 | `scripts/treinar_xgboost_loco.py:413` | `# permitido: EXC-DRYRUN-SINTETICO-XGBOOST` | Geração explícita de benchmark de pipeline quando solicitado via flag dry-run |
| 6 | `src/app/api/gee/select-candidates/route.ts:195` | `tamanhoAmostra = 500` | Default para amostragem no GEE (GOV-5) |
| 7 | `src/app/api/gee/select-candidates/route.ts:197` | `raioThinningKm = 2.0` | Raio inicial de rarefação espacial (GOV-5) |
| 8 | `src/app/api/gee/select-candidates/route.ts:199` | `frequenciaSoloNuMin = 0.20` | Limiar mínimo de solo exposto (GOV-5) |
| 9 | `src/app/api/gee/select-candidates/route.ts:201` | `declividadeMin = 3.0` | Cota inferior de declividade física (GOV-5) |
| 10 | `src/app/api/gee/select-candidates/route.ts:203` | `declividadeMax = 45.0` | Cota superior de declividade física (GOV-5) |
| 11 | `src/app/api/gee/select-candidates/route.ts:259` | `limit 500` | Limite computacional de busca inicial de centroides no índice SQLite |
| 12 | `src/app/api/gee/select-candidates/route.ts:559` | `Math.max(0, Math.min(100, ...))` | Normalização de percentual de alocação de subamostra da interface [0, 100] |
| 13 | `src/app/api/gee/select-candidates/route.ts:572` | `pool >= 10` | Critério mínimo de tamanho de pool elegível para seleção de candidatos |
| 14 | `src/app/api/gee/select-candidates/route.ts:665` | `cota - subamostra` | Subtração aritmética de cota amostral inteira não negativa entre subconjuntos |
| 15 | `src/components/campanha/PainelCampanha.tsx:57` | `const mock...` | Demonstração de interface com dados ilustrativos (EXC-DEMO-PAINEL) |
| 16 | `src/components/campanha/PainelCampanha.tsx:297` | `const mock...` | Demonstração de interface com dados ilustrativos (EXC-DEMO-PAINEL) |
| 17 | `src/components/campanha/PainelCampanha.tsx:302` | `const mock...` | Demonstração de interface com dados ilustrativos (EXC-DEMO-PAINEL) |
| 18 | `src/components/inspetor/GraficoSerieTemporal.tsx:43` | `intervaloGuardaMeses = 12` | Valor default visual para gráfico (GOV-5) |
| 19 | `src/components/inspetor/InspetorPonto.tsx:600` | `janelaAtiva.observacoes ?? []` | Fallback de coleção vazia para gráfico temporal (EXC-UI-INSPETOR-GRAFICO) |
| 20 | `src/components/mapa/MapaAmostral.tsx:104` | `Math.min(100, Math.max(0, ...))` | Clamp de posição percentual na interface (EXC-UI-MAPA-CLAMP) |
| 21 | `src/components/mapa/MapaAmostral.tsx:106` | `Math.min(100, Math.max(0, ...))` | Clamp de posição percentual na interface (EXC-UI-MAPA-CLAMP) |
| 22 | `src/components/presentation/ApresentacaoSpotlight.tsx:191` | `Math.max(0, ...)` | Clamp de coordenadas de tela para spotlight (EXC-UI-SPOTLIGHT-CLAMP) |
| 23 | `src/components/presentation/ApresentacaoSpotlight.tsx:195` | `Math.min(..., ...)` | Clamp de coordenadas de tela para spotlight (EXC-UI-SPOTLIGHT-CLAMP) |
| 24 | `src/components/region/CandidateSelectionModal.tsx:59` | `Math.max(0, ...)` | Subtração aritmética de cota amostral inteira não negativa (EXC-UI-MODAL-COTA) |
| 25 | `src/components/region/CandidateSelectionModal.tsx:316` | `Math.max(0, ...)` | Subtração aritmética de cota amostral inteira não negativa (EXC-UI-MODAL-COTA) |
| 26 | `src/lib/embrapa/embrapaSoilClient.ts:1157` | `f?.properties ?? {}` | Extração defensiva de propriedades GeoJSON WFS BBOX (EXC-EMBRAPA-WFS-PROPS-BBOX) |
| 27 | `src/lib/embrapa/embrapaSoilClient.ts:1254` | `f?.properties ?? {}` | Extração defensiva de propriedades GeoJSON WFS Ponto (EXC-EMBRAPA-WFS-PROPS-PONTO) |
| 28 | `src/lib/gee/amostragemSoloNuLote.ts:577` | `timeoutMs : 30000` | Timeout de rede de requisição HTTP em ms para GEE |
| 29 | `src/lib/gee/amostragemSoloNuLote.ts:734` | `Math.max(0, totalPontos - requisicoesHttp)` | Métrica contável de requisições HTTP poupadas em lote |
| 30 | `src/lib/gee/auth.ts:102` | `expires_in : 3600` | Fallback de protocolo OAuth2 RFC6749 para token expirável |
| 31 | `src/lib/gee/estatisticasSerie.ts:57` | `nMinimo = 5` | Piso amostral mínimo para cálculo de estatísticas de banda (GOV-5) |
| 32 | `src/lib/matriz/montagemTemporal.ts:172` | `intervaloGuardaMeses = 12` | Janela de guarda do modelo P (GOV-5) |
| 33 | `src/lib/matriz/montagemTemporal.ts:174` | `duracaoJanelaAnos = 3` | Janela retrospectiva em anos (GOV-5) |
| 34 | `src/lib/planet/ordersApi.ts:179` | `mock / offline` | Fallback para desenvolvimento local sem chave Planet (EXC-FALLBACK-OFFLINE) |
| 35 | `src/lib/planet/ordersApi.ts:191` | `mock / offline` | Fallback para desenvolvimento local sem chave Planet (EXC-FALLBACK-OFFLINE) |
| 36 | `src/lib/planet/quota.ts:81` | `new Date().toISOString()` | Auditoria de timestamp do livro-razão local |
| 37 | `src/lib/planet/quota.ts:152` | `new Date().toISOString()` | Auditoria de timestamp do livro-razão local |
| 38 | `src/lib/planet/quota.ts:176` | `new Date().toISOString()` | Auditoria de timestamp do livro-razão local |
| 39 | `src/lib/rotulos/ingestaoDrone.ts:166` | `new Set(param3 ?? [])` | Normalização do conjunto held-out (EXC-ROTULOS-HELDOUT-SET) |
| 40 | `src/lib/rusle/fatorC.ts:67` | `bsi !== undefined ? bsi : 0` | Fallback neutro para fórmula base da RUSLE quando bsi omitido (EXC-LIB-RUSLE-FATORC-BSINUM) |
| 41 | `src/store/useSarelStore.ts:259` | `Math.max(0, ...)` | Controle de índice de paginação de interface do tour (>= 0) |

### 3.7 Item 3(g): Selos de Verificação (Regra 8) e Módulos de Rede
- **Total de selos `VERIFICADO ... — evidência:` encontrados no código TS:** **8**
- **Distribuição dos selos:**
  - 4 selos em `src/lib/rusle/fatorLS.ts:18, 23, 29, 36` (Renard 1997, Desmet & Govers 1996, Schmidt 2019).
  - 4 selos em `src/lib/rusle/fatorR.ts:18, 24, 30, 36` (Waltrick 2015, NEPAR 2011, CHIRPS Climatologia).

#### Tabela de Módulos com Chamada Externa vs. Selos vs. Evidência
| Módulo | Faz chamada externa (`fetch`)? | Tem evidência arquivada em `docs/verificacoes/`? | Possui selo `VERIFICADO` no código? |
| :--- | :---: | :---: | :---: |
| `src/lib/rusle/fatorLS.ts` | NÃO | SIM (`docs/verificacoes/fontes/...`) | **SIM (4 selos)** |
| `src/lib/rusle/fatorR.ts` | NÃO | SIM (`docs/verificacoes/fontes/...`) | **SIM (4 selos)** |
| `src/lib/embrapa/embrapaSoilClient.ts` | **SIM** (WFS Geoinfo) | SIM (`2026-09-10_embrapa_capabilities.xml` etc.) | **NÃO (0 selos)** |
| `src/lib/gee/copernicusGeeClient.ts` | **SIM** (GEE API REST) | SIM (`2026-09-26_...`) | **NÃO (0 selos)** |
| `src/lib/gee/auth.ts` | **SIM** (Google OAuth2) | NÃO | **NÃO (0 selos)** |
| `src/lib/gee/amostragemSoloNuLote.ts` | **SIM** (GEE) | SIM | **NÃO (0 selos)** |
| `src/lib/jev/jevClient.ts` | **SIM** (API JEV) | NÃO | **NÃO (0 selos)** |
| `src/lib/localizacao/municipio.ts` | **SIM** (API IBGE) | SIM (`2026-09-10_ibge_municipio_exemplo.json`) | **NÃO (0 selos)** |
| `src/lib/planet/tiles.ts` | NÃO (monta URL) | SIM (`docs/verificacoes/planet/...`) | **NÃO (0 selos)** |
| `src/app/api/jev/test/route.ts` | **SIM** (JEV) | NÃO | **NÃO (0 selos)** |

---

## 4. TAREFA 4 — Fator C contra a Decisão do Pesquisador (06/11/2026)

### 4.1 Fórmula no código e citação de linha
- **Arquivo:** `src/lib/rusle/fatorC.ts:67-69`
- **Código:**
  ```typescript
  // permitido: EXC-LIB-RUSLE-FATORC-BSINUM fallback neutro para formula base da RUSLE quando bsi omitido
  const bsiNum = bsi !== undefined ? bsi : 0;
  const c = ((1 - ndvi) / 2) * (1 + bsiNum);
  ```
- **Dispensa no varredor:** A violação da fórmula híbrida não autorizada foi dispensada por comentário `// permitido: EXC-LIB-RUSLE-FATORC-BSINUM` (linha 67) e catalogada em `padroesProibidos.ts:272-278` em vez de removida.

### 4.2 Registro de Decisões: D01
- **Arquivo:** `src/config/decisoes.ts:69-78`
- **Valores registrados:**
  - `id`: `"D01"`
  - `titulo`: `"Fórmula do Fator C: Durigon et al. (2014)"`
  - `estado`: `"decidida"`
  - `valor`: `"(1 - NDVI) / 2"`
  - `referencia`: `"Durigon et al. (2014), International Journal of Remote Sensing 35(2):441-453"`
  - `justificativa`: `"Validade regional em bacia tropical brasileira, concebida para serie temporal, sem parametros livres e sem corte em [0, 1]."`

### 4.3 Chamadores de `calcularFatorC` com dois argumentos
- **Em código de produção:** **ZERO chamadores**.
- **Em código de teste:** Chamado exclusivamente em `src/lib/rusle/rusle.test.ts` (linhas 44, 47, 50, 54, 55, 89).
- **Em encapsuladores:** `obterFatorCComProveniencia` (`src/lib/rusle/fatorC.ts:123`) repassa `bsiVal` para `calcularFatorC` e emite modelo `"Híbrido SPD: C = ((1 - NDVI) / 2) * (1 + BSI)"`.

### 4.4 Chamadores de `calcularFatorCHibrido`
- **Total no repositório:** **ZERO chamadores** (função órfã em `src/lib/rusle/fatorC.ts:81-83`).

### 4.5 Perfil `matriz-treino` em `src/lib/matriz/perfis.ts`
- **Fator C consta na lista?** **NÃO CONSTA**. As únicas variáveis RUSLE em `matriz-treino` são `RUSLE_Fator_K`, `RUSLE_Fator_R` e `RUSLE_Fator_LS` (`perfis.ts:192-194`).
- **NDVI e BSI constam separados?** **SIM, CONSTAM SEPARADOS** nas linhas 186 e 187 (`"NDVI"`, `"BSI"`).

### 4.6 Busca por artefatos emitidos contendo C calculado com `(1 + BSI)`
- **Varredura realizada:** Todos os arquivos CSV, XLSX, JSON e relatórios em `docs/` e `data/`.
- **Resultado:** **NENHUM artefato emitido (planilha, CSV, pacote de reprodutibilidade, relatório oficial ou PDF de resultados) contém valor de C calculado com o termo `(1 + BSI)`**.
- A string só ocorre em relatórios discursivos de auditoria e propostas metodológicas anteriores (`docs/auditorias/...` e `docs/verificacoes/2026-11-02_especificacao_competidor_rusle.md`).
- **Conclusão:** Não há artefato numérico emitido a retratar.

---

## 5. TAREFA 5 — R, K e LS: Decisão, Código e Orquestração

### 5.1 Diagnóstico do estado do sistema
Classificação categórica: **(ii) Lacuna de ORQUESTRAÇÃO**.
- As decisões D13, D14 e D15 estão com `estado: "decidida"` em `src/config/decisoes.ts`.
- Os motores científicos existem e implementam as fórmulas decididas: `src/lib/rusle/fatorR.ts`, `fatorK.ts`, `fatorLS.ts`.
- O cálculo da perda de solo da RUSLE (`perdaSolo`) permanece indisponível porque as rotas que orquestram a montagem do ponto amostral não fornecem os parâmetros necessários para `montarLinhaDeBaseRUSLE`.

### 5.2 Rastreamento do caminho de execução
Chamadores de produção de `montarLinhaDeBaseRUSLE`:
1. `src/app/api/gee/select-candidates/route.ts:1309`:
   - Passa: `ndviProveniencia`, `bsiProveniencia`, `erodibilidadeProveniencia`, `camadaErodibilidade2024`.
   - **NÃO passa:** `insumoFatorR`, `insumoFatorLS`.
2. `src/lib/gee/consolidacaoInspecao.ts:390` (chamado por `src/app/api/gee/inspect-point/route.ts`):
   - Passa: `ndviProveniencia`, `bsiProveniencia`, `erodibilidadeProveniencia`.
   - **NÃO passa:** `insumoFatorR`, `insumoFatorLS`, nem `camadaErodibilidade2024`.

### 5.3 O que falta para os cinco fatores existirem simultaneamente (Invariante 1)
- **Fator C:** Funcional quando `ndviProveniencia` é informado (requer apenas remoção do acoplamento com BSI).
- **Fator P:** Funcional (possui fallback tabelado `P = 1.0` por padrão via `obterFatorPPadrao()`).
- **Fator K:**
  - Em `select-candidates`: Funcional quando a consulta WFS Embrapa retorna a feição com `kSolos`.
  - Em `consolidacaoInspecao`: Falta conectar `camadaErodibilidade2024` ou a extração do `kSolos`.
- **Fator R:** Falta orquestração na rota para passar `insumoFatorR` (composto pelos 12 totais mensais de chuva CHIRPS ou coordenadas para consulta na climatologia CHIRPS `climatologia_chirps_bp3.json`).
- **Fator LS:** Falta orquestração na rota para passar `insumoFatorLS` (requer `declividadeGraus` e cálculo da área de contribuição a montante 2D de Desmet & Govers 1996 a partir do Copernicus DEM 30 m).

---

## 6. TAREFA 6 — Peso, Licenciamento e Organização do Repositório

### 6.1 Item 6(a): Medição de `docs/` e `.git`
- **Arquivos versionados em `docs/`:** **464 arquivos**.
- **Tamanho total dos arquivos versionados em `docs/`:** **174.87 MB** (183.360.157 bytes).
- **Diretório `docs/` total em disco (incluindo não-versionados/caches):** 631.90 MB em 601 arquivos.
- **Diretório `.git/` total em disco:** **216.61 MB** (227.130.477 bytes) em 5.651 arquivos.

### 6.2 Item 6(b): Arquivo ScienceDirect Zip
- **Caminho:** `docs/bibliografia/06_pesquisas_machine_learning/ScienceDirect_articles_22Oct2026_13-13-36.639.zip`
- **Tamanho:** **36.91 MB** (38.707.314 bytes).
- **Conteúdo interno:** 9 artigos científicos em PDF baixados da Elsevier/ScienceDirect relativos a sensoriamento remoto, PlanetScope e aprendizagem de máquina.

### 6.3 Item 6(c): PDFs de Terceiros e Exposição Jurídica
Status de licenciamento dos PDFs versionados em `docs/verificacoes/fontes/`:
1. `ah_703.pdf` (21.36 MB, Renard et al., 1997):
   - **Origem:** USDA Agricultural Research Service (Agriculture Handbook 703).
   - **Status:** **Domínio Público** (obra oficial do Governo Federal dos EUA, 17 U.S.C. § 105).
2. `waltrick_2010.pdf` (14.38 MB, Waltrick, 2010):
   - **Origem:** Dissertação de Mestrado UEL / IAPAR.
   - **Status:** Depósito institucional acadêmico público. Sem licença aberta explícita (CC-BY).
3. `zhu_2013_tese_ccdc.pdf` (5.36 MB, Zhu, 2013):
   - **Origem:** Tese de Doutorado na Boston University.
   - **Status:** Repositório OpenBU. Copyright acadêmico tradicional, sem licença de redistribuição comercial.
4. `schmidt_2019_methodsx.pdf` (4.14 MB, Schmidt et al., 2019):
   - **Origem:** MethodsX (Elsevier).
   - **Status:** **Acesso Aberto (Gold Open Access)** sob licença Creative Commons (CC-BY).
5. `rufino_biscaia_merten_1993_rbcs.pdf` (2.03 MB, Rufino et al., 1993):
   - **Origem:** Revista Brasileira de Ciência do Solo (RBCS, 1993).
   - **Status:** **Copyright comercial/sociedade científica (SBCS)**. Não possui licença CC-BY declarada.
6. `nepar_boletim_01_2011.pdf` (2.00 MB, NEPAR/SBCS, 2011):
   - **Origem:** Boletim Técnico NEPAR.
   - **Status:** Publicação técnica institucional sem licença aberta.
7. `waltrick_2015.pdf` (1.00 MB, Waltrick et al., 2015):
   - **Origem:** RBCS / SciELO (2015).
   - **Status:** Acesso aberto (CC-BY via SciELO).
8. `ScienceDirect_articles_...zip` (36.91 MB, Elsevier):
   - **Origem:** Download em lote da plataforma ScienceDirect.
   - **Status:** **Artigos comerciais com direitos reservados da Elsevier**.
- **Diretório `.licenses/`:** Contém apenas `literature_search_europepmc_LICENSE.txt` (um aviso de 3 linhas). Não cobre nenhum dos artigos acima.
- **Avaliação de Risco:** A presença de PDFs comerciais com direitos reservados (Elsevier e SBCS 1993) constitui exposição a reivindicações de direitos autorais caso o repositório seja tornado público.

### 6.4 Item 6(d): `Instalador_SAREL.exe` na raiz
- **Tamanho:** **2.08 MB** (2.181.120 bytes).
- **Natureza:** Executável binário compilado pelo script `scripts/build_single_exe.py` (usando `scripts/installer/InstaladorSAREL.cs` e empacotando `SarelPayload.zip`).
- **Avaliação:** É um artefato gerado de distribuição que não deveria estar versionado no Git.

### 6.5 Item 6(e): Contagem por Extensão de Arquivos Versionados
Contagem realizada sobre os 846 arquivos versionados no Git (`git ls-files`):
- `.ts`: 213 (Código-fonte / Testes) -> Deve ficar.
- `.md`: 181 (Documentação / Planejamento / Verificações) -> Deve ficar.
- `.py`: 93 (Scripts científicos) -> Deve ficar.
- `.xls`: **79** (Séries históricas pluviométricas IAT/IAPAR em `docs/dados/pluviometria/`) -> **Dado primário de pesquisa**.
- `.png`: **53** (Evidências de auditoria e imagens de manuais) -> **Evidência da Regra 8 / Documentação**.
- `.txt`: **52** (OCR de referências, saídas periciais) -> **Evidência da Regra 8**.
- `.pdf`: **37** (Artigos de terceiros, relatórios gerados e apresentações) -> Misto (**Material de terceiros** e **Artefatos gerados**).
- `.json`: 36 (Metadados, configurações e manifestos) -> Deve ficar.
- `.tsx`: **35** (Componentes de interface React) -> Código-fonte (deve ficar).
- `.docx`: **11** (Textos informais / minutas de dissertação em `docs/`) -> Material de apoio.
- `.mjs` / `.mts` / `.cjs`: 13 (Configurações de infraestrutura) -> Deve ficar.
- `.pptx`: **8** (Apresentações de slides em `docs/`) -> Artefatos de comunicação.
- `.csv`: **8** (Evidências de auditoria e pluviometria em `docs/verificacoes/`) -> **Evidência da Regra 8**.
- `.plan`: 4 (Planos de voo NControl de teste em `docs/verificacoes/voo_ncontrol/`) -> Evidência de teste.
- `.exe`: **1** (`Instalador_SAREL.exe`) -> **Artefato gerado** (não deve estar versionado).
- `.zip`: **1** (`ScienceDirect_articles_...zip`) -> **Material de terceiros** (não deve estar versionado).

### 6.6 Item 6(f): Arquivos com Espaço e Acento no Nome
- **Arquivos com espaço no nome:** **20 arquivos**.
- **Arquivos com acento E espaço no nome:** **1 arquivo**:
  `docs/auditorias/externa_a/Relatório de Auditoria e Arquitetura Zero-Trust — Projeto SAREL v2.pdf`
- **Impacto em scripts:** Quebra pipelines e ferramentas que não usam `-c core.quotepath=false` ou `-z` no Git, pois o Git escapa nomes não-ASCII em octal (`\"Relat\\303\\263rio...\"`), gerando erros de `ENOENT` em rotinas do Node.js/Python.

### 6.7 Item 6(g): Extensão e Prosa em `src/config/decisoes.ts`
- **Total de linhas:** **689 linhas**.
- **Total de decisões registradas:** 42.
- **Top 5 maiores campos `valor`:**
  1. `D13`: **7.705 caracteres** (narrativa sobre erosividade regional, CHIRPS e histórico de emendas).
  2. `D24`: **7.404 caracteres** (ensaio sobre suficiência de dados e regime amostral).
  3. `D16`: **5.020 caracteres** (discussão sobre inversão de papéis do VANT e desenho amostral).
  4. `D15`: **4.443 caracteres** (dissertação metodológica sobre algoritmo 2D de Desmet & Govers).
  5. `D25`: **4.419 caracteres** (especificação de critérios de refutação pré-registrados).
- **Status do arquivo `docs/planejamento/decisoes-notas.md`:** Possui apenas 4 linhas introdutórias. **Nenhuma migração foi realizada**.
- **Achado:** O campo `valor` em `decisoes.ts` continua funcionando como repositório de ensaios em prosa em vez de armazenar o valor estrito da decisão metodológica.

---

## 7. TAREFA 7 — Autorização de Commit
O presente documento é o único arquivo gerado e comitado nesta sessão, preservando integralmente o código-fonte da aplicação na branch oficial `correcoes/contencao-2026-11-02`.
