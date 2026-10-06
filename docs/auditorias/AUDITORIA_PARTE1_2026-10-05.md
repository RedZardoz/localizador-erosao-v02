# Auditoria do SAREL v2 — Parte 1 de 2 (função e hipóteses)

Auditoria, não correção. Nenhum arquivo do código, dos dados ou dos relatórios existentes foi editado. Este é o único arquivo criado no repositório.

**Legenda de evidência.** **[M]** medido: executei o comando nesta sessão e colei a saída. **[L]** lido: li o arquivo, sem executá-lo. **[S]** suposto: inferência minha, que o pesquisador deve conferir. Todo número de linha foi conferido abrindo o arquivo com `grep -n` nesta sessão.

**Gravidade** usa exatamente: *bloqueia a função* / *bloqueia a dissertação* / *precisa de decisão do pesquisador* / *induz má interpretação* / *cosmético*.

---

## 1. Commit auditado e estado base

### 1.1 Commit

- **Hash completo auditado: `5f7c033fff918fa99783939d7a218ac9f4d5b582`** (`origin/sarel/v2`, HEAD detached). **[M]**
- O prompt cita `fd613e3` (`fd613e32f13e9ecd880e23bd99b0695f74fc47d3`) como HEAD. O commit auditado tem 1 commit a mais, `5f7c033 docs(planejamento): prompts de auditoria honesta em duas partes`. **[M]** `git diff --stat fd613e3 HEAD` lista só 3 arquivos, todos em `docs/planejamento/` (`PROMPT_AUDITORIA_HONESTA_2026-10-05.md`, `..._PARTE1_...md`, `..._PARTE2_...md`; 405 inserções). Logo o **código é idêntico ao de `fd613e3`**.
- Meu checkout inicial era `d2a7b5a`, a `main` com o merge do PR #2. O arquivo do prompt não existia lá. Fiz `git fetch` e `git checkout --detach origin/sarel/v2` para auditar a branch pedida. Isso mudou o HEAD do clone, mas nenhum arquivo versionado.

### 1.2 Saídas do estado base (Etapa 0) **[M]**

```
$ git status            ->  HEAD detached at origin/sarel/v2 / nothing to commit, working tree clean
$ git log --oneline -10
5f7c033 docs(planejamento): prompts de auditoria honesta em duas partes
fd613e3 fix(pericial): saneamento N1, N2 e N3 - derivacao mecanica de vies, pisos contra falsos positivos e eliminacao de residuo
b84cda0 docs(planejamento): prompt do relatorio contraditorio e das guardas vacuas
4ed3825 docs(auditoria): registra a refutacao da minha hipotese sobre 2022
6d6da85 fix(chirps): série completa 1981-2025 (D13b), recorte em memória (L2) e guarda P12 NoData
7032fbb docs(planejamento): prompt de correcao do CHIRPS de um ano, e tres defeitos vizinhos
ec9c142 docs(auditoria): atualiza o prompt de auditoria independente ao estado de 02/10
4d2919c decide(governanca): corrige D24 e D25 — held-out passou de 18 para 36 agrupamentos
f0b2026 feat(sorteio): implementar códigos opacos no selo e marca de sintético nos artefatos irmãos (K1 a K3)
49b42f6 docs(planejamento): prompt dos codigos opacos no selo e da marca de sintetico
$ git log --merges --oneline -5   ->  (saída vazia; conferi depois: 0 merges nos 194 commits do histórico, clone não-raso)
$ node --version -> v22.22.0 ; npm --version -> 10.9.4
$ ls -d node_modules package-lock.json  -> "ls: cannot access 'node_modules'"  /  package-lock.json (existe)
$ python3 --version -> Python 3.11.15
$ python3 -c "import xgboost|shap|sklearn|pandas|numpy|matplotlib|seaborn"  ->  ModuleNotFoundError em todas
```

- **`node_modules` não existia neste contêiner** no início. O pesquisador afirma que existe na máquina dele. Não consigo verificar a máquina dele, e a afirmação vale para o ambiente dele. Instalei com `npm ci` (14 s, 549 pacotes adicionados, `node_modules` está no `.gitignore`).
- As libs Python **não estavam instaladas**. Instalei por `pip install` fora do repositório. Versões obtidas, **diferentes** das de `requirements.txt` (que usa `>=`): numpy 2.4.6, pandas 3.0.6, scikit-learn 1.9.1, xgboost 3.2.0, shap 0.51.0, matplotlib 3.11.2, seaborn 0.13.2, openpyxl 3.1.5. Nada indica que o ambiente do pesquisador use as mesmas versões **[S]**.
- Módulos que `scripts/*.py` importam e **não instalei**: `rasterio`, `shapely`, `geopandas`, `pyshp`, `pyproj`, `reportlab`, `python-docx`, `python-pptx`, `Pillow` (este último já estava presente). Isso explica parte das falhas de teste da seção 2.

---

## 2. Resultado cru das execuções (Etapa 1)

Scripts de `package.json`: `dev`, `build`, `check:build`, `start`, `lint`, `typecheck`, `test`, `test:vivo`. Rodei `test`, `typecheck`, `lint` e `build`. **Não rodei** `test:vivo` (inclui `*.vivo.test.ts`: `find src -name "*.vivo.test.ts"` não retornou nenhum arquivo), `dev`, `start`, `check:build`.

| Comando | Código de saída | Resultado **[M]** |
|---|---|---|
| `npm run typecheck` (`tsc --noEmit`) | **0** | Sem erros. Saída contém só o cabeçalho do npm. |
| `npm run lint` (`next lint`) | **0** | 0 erros, **2 warnings** `react-hooks/exhaustive-deps`: `src/components/map/MapViewer.tsx:476`, `src/components/map/PointPopup.tsx:64`. |
| `npm run test` (`vitest run`) | **1** | `Test Files  3 failed \| 54 passed (57)` / `Tests  6 failed \| 429 passed (435)`. |
| `npm run build` (`next build`) | **1** | `Failed to compile` / `Build failed because of webpack errors`. |

Rodei os testes duas vezes. A segunda, depois de instalar as libs Python, deu o mesmo placar (6 falhas, 429 passaram).

### 2.1 `npm run build` falha **[M]**

```
Failed to compile.

node:child_process
Module build failed: UnhandledSchemeError: Reading from "node:child_process" is not handled by plugins (Unhandled scheme).
Webpack supports "data:" and "file:" URIs by default.
You may need an additional plugin to handle "node:" URIs.
Import trace for requested module:
node:child_process
./src/lib/gee/sorteioPoligonos.ts
./src/components/decisoes/PainelSorteioD16.tsx
./src/components/decisoes/DecisoesModal.tsx
./src/app/page.tsx

node:crypto
Module build failed: UnhandledSchemeError: Reading from "node:crypto" is not handled by plugins (Unhandled scheme).
Import trace for requested module:
node:crypto
./src/lib/gee/sorteioPoligonos.ts
./src/components/decisoes/PainelSorteioD16.tsx
./src/components/decisoes/DecisoesModal.tsx
./src/app/page.tsx

> Build failed because of webpack errors
```

Um componente de cliente (`PainelSorteioD16.tsx`) importa `src/lib/gee/sorteioPoligonos.ts`, que usa `node:child_process` e `node:crypto`. A compilação de produção falha em 2 módulos. O README exige "os três verdes" e lista `npm run build`. Se `npm run dev` abre a tela **não verifiquei** (NÃO VERIFICADO: não subi o servidor).

### 2.2 `npm run test`: 6 falhas, todas ligadas a dado local ausente **[M]**

```
 ❯ src/lib/seguranca/provenienciaCaminhos.test.ts (2 tests | 1 failed)
     × todos os caminhos de repositório citados em docs/PROVENIENCIA_ASSISTENCIA_IA.md devem existir no disco
 ❯ src/lib/fundiario/matcher.test.ts (14 tests | 3 failed)
     × deve encontrar uma propriedade rural oficial indexada no SQLite local
     × deve retornar status sem-correspondencia para coordenada fora de qualquer perímetro cadastrado
     × deve executar batchMatchRuralProperties em lote com integridade de status
 ❯ src/lib/drone/planoVooNControl.test.ts (9 tests | 2 failed)
     × Z1 & W3: amostrador real do Copernicus DEM GLO-30 lê os tiles oficiais ... (P12)
     × W4: verificação prévia de cobertura de tiles DEM antes de emitir planos aborta cedo polígonos sem tile em cache
```

Primeiras linhas de cada falha, resumidas: (a) `provenienciaCaminhos`: `Caminho inexistente ... 'docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/CNPS-DOC-246-2024.pdf' (linha 83)` e `'data/dem_cache/Copernicus_DSM_COG_10_S26_00_W055_00_DEM.tif' (linha 90)`; (b) `matcher`: `expected 'base-nao-disponivel' to be 'encontrado'` (e `'sem-correspondencia'`); (c) `planoVooNControl`: `ErroTerrenoForaDeCoberturaGLO30 ... python scripts/reduzir_terreno_copernicus.py ... ModuleNotFoundError: No module named 'numpy'` na 1ª rodada; `expected false to be true` em `planoVooNControl.test.ts:180`.

Causa comum **[M]**: `ls data` mostra que a pasta **`data/` não existe no clone**, e `data/dem_cache/`, `data/*.db`, `docs/Selecao Bibliografica/**/*.pdf` estão no `.gitignore` (`:74-75` `data/*.db`, `:84` `data/dem_cache/`, `:100` `docs/Selecao Bibliografica/**/*.pdf`). Os 6 testes dependem de arquivos que o git não carrega. **Não verifiquei se passariam com os dados presentes** (NÃO VERIFICADO). Concluo só que a suíte **não é hermética**: num clone limpo, ela fica vermelha.

### 2.3 Testes pulados

`grep` por `it.skip|test.skip|describe.skip|.todo|.only|xit(|xdescribe(|fit(` em `src` e `scripts` **[M]**: nenhum teste pulado ou `only`. O único acerto foi `modelo.fit(` em `src/lib/export/pacoteReprodutibilidade.ts:826` (código Python gerado em string, falso positivo). O resumo do vitest não reporta `skipped`.

### 2.4 O que isso prova e o que não prova

Quando algo passou, ele só prova que **os testes que existem passam**: 429 de 435, `tsc` limpo, `lint` sem erro. Não prova que o método está certo, que o programa funciona de ponta a ponta nem que os testes testam o que importa. As seções 3 e 4 mostram vários casos em que a suíte está verde e a barreira correspondente não existe (A24, A25).

---

## 3. Hipóteses B1..B7 e Bloco C: conclusões, evidências, gravidade

Identificadores estáveis **A01..A30**. **Último usado: A30.** A PARTE 2 continua em A31.

### Quadro-resumo

| ID | Hipótese/Item | Conclusão | Gravidade |
|---|---|---|---|
| A01 | Build de produção falha | **CONFIRMADO** | bloqueia a função |
| A02 | Suíte não é hermética (6 falhas por dado local) | **CONFIRMADO** | induz má interpretação |
| A03 | Lint: 2 warnings; typecheck limpo | **CONFIRMADO** | cosmético |
| A04 | B1: RUSLE como preditor | **PARCIAL** | precisa de decisão do pesquisador |
| A05 | B2: dry-run, AUC=1,0 e vazamento para a dissertação | **PARCIAL** (artefato confirmado; vazamento não encontrado) | induz má interpretação |
| A06 | B2e: guarda de scripts/ tem isenção por texto livre | **CONFIRMADO** | bloqueia a dissertação |
| A07 | Figura `tela5` e `gerar_manual_pdf.py` com métricas fixas | **CONFIRMADO** | induz má interpretação |
| A08 | Relatório de mudanças afirma "AUC 0,82-0,91" e "35 passed" | **CONFIRMADO** | induz má interpretação |
| A09 | UI exibe métricas "simuladas" sem selo no cartão | **CONFIRMADO** | induz má interpretação |
| A10 | B3: texto corrompido no JSON | **REFUTADO** | cosmético |
| A11 | B4: `DECISOES.md` diverge de `decisoes.ts` | **CONFIRMADO** | induz má interpretação |
| A12 | B4: README defasado | **CONFIRMADO** | induz má interpretação |
| A13 | B4: D02 define classes por índices calculados | **PARCIAL** | precisa de decisão do pesquisador |
| A14 | B4: escolhas metodológicas no código sem decisão | **CONFIRMADO** | precisa de decisão do pesquisador |
| A15 | B5: `?? 0` em componente e buraco na guarda | **CONFIRMADO** | bloqueia a dissertação |
| A16 | B5: `medido()` carimba `adquiridoEm = "2024-01-01"` por padrão | **CONFIRMADO** | bloqueia a dissertação |
| A17 | B5: BSI ausente vira 0 no Fator C | **PARCIAL** | precisa de decisão do pesquisador |
| A18 | B5: ingestão fundiária grava 0 para ausente | **CONFIRMADO** | induz má interpretação |
| A19 | B6: dados fundiários/CPF versionados | **REFUTADO** (CPF/CNPJ reais) / **PARCIAL** (CAR) | precisa de decisão do pesquisador |
| A20 | B6/C3: exportação não re-mascara titular e documento | **CONFIRMADO** | bloqueia a função |
| A21 | B7: segredos | **REFUTADO** (nos padrões buscados) | cosmético |
| A22 | C1: módulos centrais sem chamador | **CONFIRMADO** | bloqueia a função |
| A23 | C1: chuva fixa em "Aguardando D13" com D13 decidida | **CONFIRMADO** | induz má interpretação |
| A24 | C3: Invariantes 3 e 4 não são aplicados; 5 e 6 são parciais | **CONFIRMADO** | bloqueia a função |
| A25 | C3: Kappa < 0,60 não bloqueia nada | **CONFIRMADO** | bloqueia a função |
| A26 | C4: binarização do rótulo por texto | **CONFIRMADO** | bloqueia a dissertação |
| A27 | C4: arquivo de chaves e held-out nunca exportados | **CONFIRMADO** | bloqueia a função |
| A28 | C5: o treino consome a saída do app? | **PARCIAL** (XLSX sim, CSV não) | bloqueia a função |
| A29 | C6: código diverge de D24/D25/D26/D16/D03 | **CONFIRMADO** | bloqueia a dissertação |
| A30 | Tag `legado-pre-sarel` não existe | **CONFIRMADO** | induz má interpretação |

---

### A04 — B1: RUSLE como preditor (PARCIAL)

**Evidência [L]/[M]:**

- `scripts/treinar_xgboost_loco.py:20`: docstring lista "Fator K, Fator R e Perda RUSLE estimada (A)" como preditores.
- `:351`: o dry-run **sintetiza** `'rusle_perda_solo': round(perda_solo_spd, 2)`, com `perda_solo_spd = float(np.random.uniform(0.5, 4.5))` (`:340`).
- `:409-417`: o mapeamento aceita `Perda_Solo_t_ha_ano`, `RUSLE_Perda_Solo`, `perdaSoloRUSLE`, `*Fator_K*`, `*Fator_R*`.
- `:578-580`: `'rusle_fator_k'`, `'rusle_fator_r'`, `'rusle_perda_solo'` estão em `candidatos_preditores`. `:592`: `X = df[preditores_disponiveis]`. O `relatorio_modelagem_xgboost_loco.json` lista `rusle_perda_solo` entre os 5 preditores usados.
- Commit `575467f` **[M]** (`git show`): removeu **só** `perdaSoloRUSLE` de `src/lib/matriz/montagem.ts` e `src/lib/matriz/perfis.ts` (`-perdaSoloRUSLE: number | null;`, `-"RUSLE_Perda_Solo",`). **Fator K e Fator R continuam exportados**: `montagem.ts:62-63`, `:186-187`; `perfis.ts:158-159` (`"RUSLE_Fator_K"`, `"RUSLE_Fator_R"`).
- Contradição interna em `montagem.ts:11`: o cabeçalho diz que "Fatores da RUSLE (R, K, LS, C, P) e perdaSolo" são **exclusões invioláveis**, mas o código exporta K e R. `CAMPOS_PROIBIDOS_MATRIZ_TREINO` (`invariantes.ts:30`, itens em `:46-47`) proíbe só `perdaSoloRUSLE`/`RUSLE_Perda_Solo`.
- **Medido (C5):** com a saída do app, `preparar_matriz_preditores` selecionou 13 preditores: `rusle_fator_k` e `rusle_fator_r` **entram**; `rusle_perda_solo` **não entra**, porque a coluna não existe mais.

**O que dizem os documentos.** `README.md:35` diz que D13/D14/D15 são "guardas ativas para decisões pendentes" e fala de "perda de solo estritamente vinculada ao Invariante 1". `decisoes.ts` marca D13, D14 e D15 como **decididas** (A11/A12). D25 e D26 tratam a RUSLE como **competidora** (um dos três competidores de D24). D24 define blocos de preditores "solo" (K) e "chuva", o que sugere que K e R **como preditores** são previstos **[L]**. Nenhuma decisão que li autoriza ou proíbe a perda como preditor **[S]**.

**Veredito: PARCIAL.**

- Perda RUSLE como preditor: contradição **confirmada no script Python e no dry-run** (que gerou e usou `rusle_perda_solo`); **refutada para o fluxo real do app**, que já não exporta a coluna (comprovado em C5).
- K e R como preditores: **confirmado nos dois lados**. É consistente com D24 e contradiz o cabeçalho de `montagem.ts:11` e o README.

**Implicação para a hipótese central (texto, sem rodar nada novo) [S].** A hipótese pré-registrada (D25) é que o XGBoost supera a linha de base RUSLE por margem ≥ 0,10 em Spearman. Se `perda_solo` (a saída da linha de base) entra como *feature*, o modelo recebe de graça o competidor: um ρ do XGBoost ≥ ρ_RUSLE deixa de medir ganho, e a comparação fica **circular**. Isso invalidaria a conclusão de "superioridade sobre RUSLE" mesmo com ρ alto. Para K e R (insumos, não a saída), o risco é menor, mas o pesquisador precisa registrar em decisão se entram como preditores. Hoje a única fonte é o código.

**Gravidade: precisa de decisão do pesquisador** (K e R) e *induz má interpretação* (script e dry-run ainda aceitam a perda).

---

### A05 — B2: dry-run e artefatos (PARCIAL)

**(a) O que é sintético e como a classe 1 é montada [L].** Em `balancear_com_pontos_controle`, só as **5 colunas** da classe 0 são geradas por `np.random.uniform` (`scripts/treinar_xgboost_loco.py:332-340`, semente `:306`):

| Coluna (classe 0) | Distribuição | Linha |
|---|---|---|
| `bsi` | U(−0,25; −0,02) | 332 |
| `ndvi` | U(0,68; 0,88) | 334 |
| `declividade_pct` | U(3,0; 14,0) | 336 |
| `elevacao_m` | U(350; 750) | 338 |
| `rusle_perda_solo` | U(0,5; 4,5) | 340 |

Latitude, longitude e município da classe 0 vêm de centróides reais de imóveis em `data/fundiario_brasil.db` (`db_path` em `:305`, SQL em `:315-320`, `ORDER BY RANDOM()`). A **classe 1** vem do arquivo `--dados`. O padrão é `legado/pre_sarel/Tabela_Consolidada_Parana_Todo_o_Estado_150focos_2026-09-04.xlsx` (`:879`), arquivo do `.gitignore` (`Tabela_Consolidada_*`) e **ausente neste clone**. Não pude abrir a classe 1 nem a reproduzir o dry-run (**NÃO VERIFICADO**).

**(b) Por que AUC=1,0 é esperado [S + M].** As duas classes saem de processos diferentes por construção: a classe 0 é desenhada de faixas fixas escolhidas pelo autor (SPD estável: NDVI alto, BSI negativo, declividade 3-14%). A classe 1 é uma tabela de "focos" cujas distribuições não vi. **O PNG de SHAP mostra** que o modelo separou quase só por `declividade_pct`: `|SHAP|` médio 4,92 contra 0,02 (ndvi) e 0 (rusle_perda_solo, bsi, elevacao_m) **[M, imagem aberta]**. Se os focos de erosão têm declividade fora de [3; 14]%, um único corte separa perfeitamente. Isso é uma hipótese: não vi a classe 1 **[S]**. Em todo caso, AUC=1,0 aqui mede a **diferença entre dois geradores**, não o poder de prever erosão.

**(c) Menções fora de `docs/relatorios/modelagem` [M].**

- `git grep` por `curva_roc_loco|shap_feature_importance|shap_summary_beeswarm|matriz_confusao_loco|relatorio_modelagem_xgboost_loco|relatorios/modelagem` **fora** da pasta: só `scripts/treinar_xgboost_loco.py:799,811,833,853,930` (onde os arquivos são gravados) e 3 prompts de planejamento/auditoria (`PROMPT_EXECUCAO_DESENHO_CONSOLIDADO_2026-09-27.md:163` sugere "mover `docs/relatorios/modelagem/` para o legado"; as demais linhas são os próprios prompts de auditoria).
- Hash dos 4 PNGs e dos pixels comparado com toda mídia de **10 PPTX/DOCX** e imagens extraídas de **17 PDF** rastreados: **nenhuma coincidência** (bytes ou pixels). Limite: reencodes ou capturas de tela dessas figuras não seriam detectados.
- Números "1.0000"/"100%": `docs/auditorias/Relatorio_Auditoria_Cientifica_Veracidade_2026-09-13.md:14,69` (que diz expressamente que 100% **não** reflete um modelo infalível) e `docs/Compendio_Metodologico_SAREL_PPGTCA_2026.pdf` ("O 'Elefante na Sala': A Acurácia de 100% no XGBoost de Teste", também em `scripts/gerar_compendio_metodologico_pdf.py:492`). Todas tratam o 100% como alerta. **Não achei vazamento do resultado dry-run como achado científico.**

**(d) Marca d'água [M, imagens abertas].** Os 4 PNGs trazem no topo, em vermelho, `[AVISO: BENCHMARK DE INFRAESTRUTURA - DADOS NÃO EMPÍRICOS]`. O JSON traz `"natureza_execucao": "BENCHMARK_INFRAESTRUTURA_DRY_RUN"`, `"dados_100pct_empiricos": false` e um alerta em `alertas_rigor`. O aviso do PNG não diz *quais* dados são sintéticos (só a classe 0).

**(e) A guarda cobre scripts Python? Cobre, mas tem uma porta aberta (ver A06).**

**(f) A barreira real do dry-run existe e funciona [M].**

```
$ python3 scripts/treinar_xgboost_loco.py --dados SINTETICO_TESTE_ENCANAMENTO_so_classe1.csv --saida <tmp>/out
  File ".../scripts/treinar_xgboost_loco.py", line 283, in balancear_com_pontos_controle
    raise ValueError(
ValueError: [ERRO DE INTEGRIDADE CIENTÍFICA (ANTI-MOCK - METODOLOGIA PPGTCA 2026)]
  A base de entrada contém apenas amostras de Erosão (Classe 1). ...
  3. Se você deseja APENAS testar a infraestrutura ... utilize a flag explícita: --permitir-dryrun-sintetico
exit=1
```

O `raise` em `:283` é código executável, não só texto: sem a flag, o script aborta. Com a flag e sem `data/fundiario_brasil.db`, ele imprime `[BALANCEAMENTO DRY-RUN] Base equilibrada com marca d'agua: 4 Erosão + 0 Controle` (`:364`) e **depois** aborta (`ValueError ... restou apenas 1 classe`, `exit=1`). A mensagem de "base equilibrada" com 0 controles é enganosa (cosmético).

**Veredito: PARCIAL.** Artefato de construção **confirmado**; **vazamento para documentos não encontrado** pelos meios acima. O dry-run **não é reproduzível neste clone** (faltam o `.db` e o `.xlsx`).

**Gravidade: induz má interpretação** (a pasta `docs/relatorios/modelagem/` continua onde alguém procura resultados, apesar da sugestão de movê-la).

---

### A06 — B2e: a guarda de `scripts/` tem uma isenção por texto livre (CONFIRMADO)

**Evidência.**

- `src/lib/seguranca/padroesProibidos.test.ts:302-327` varre `scripts/` (`.py`, `.mjs`, `.ts`) com piso de 28 arquivos. **Cobre** `np.random.uniform` atribuído a variáveis com nome do tipo `bsi|ndvi|decliv|slope|elev|perda|fator` (regex `id: "sintese-aleatoria-atributos-fisicos"`, `:34`).
- **Porta aberta:** `:49` define `marcadorPy = "# permitido:"` e `:57` aceita qualquer comentário com `motivo.length >= 20`. O texto é livre e **não está ligado à flag** `--permitir-dryrun-sintetico`.
- As 5 linhas `np.random.uniform` do script (`:332-340`) estão **todas** isentas por esse comentário ("permitido: geracao explicita de benchmark de pipeline quando solicitado via flag dry-run"), que é só texto.

**Medido** (`guarda_probe.mjs`, apêndice B, que replica `varrerCodigo` com o texto do arquivo de teste):

```
A) linha real do script, SEM comentario                    => violacoes: 1
B) mesma linha + comentario arbitrario (>=20 chars)       => violacoes: 0
C) nome de variavel fora do padrao (x = np.random.uniform) => violacoes: 0
D) atribuicao em dict literal ('ndvi': float(np.random...)) => violacoes: 0
```

Ou seja: qualquer um escreve `# permitido: qualquer texto com mais de vinte letras` e a guarda passa. E variações simples de sintaxe (C, D) nem precisam de comentário. O dry-run real do repositório **só é seguro** porque o `raise` de `:283` o barra. **A guarda de `scripts/` sozinha não impediria dado sintético em outra rota.** **[M]**

**Também nos componentes.** A varredura de `src/components` aplica só 5 dos 17 padrões (`padroesProibidos.test.ts:275-281`) e **omite `coalescencia-com-numero`** (`:26`, `?? <num>`). Isso permite A15.

**Gravidade: bloqueia a dissertação** (a Regra 1 é verificável por teste, e o teste tem um furo documentável).

---

### A07 — Figura `tela5` e `gerar_manual_pdf.py` com métricas fixas (CONFIRMADO)

- `scripts/gerar_manual_pdf.py:365-375` desenha uma "tela" com `Acurácia Global: 89.3%`, `ROC-AUC Global: 0.924` (`:366`), `F1-Score: 0.891`, `Precisão: 88.5% | Recall: 89.8%`, uma curva ROC desenhada com pontos fixos (`:374`) e barras de SHAP com valores fixos (bsi 0.42, declividade 0.35, ndvi 0.31 ...). `docs/figuras_manual/tela5_xgboost_decisoes.png` (aberto **[M]**) é essa figura, referenciada por `scripts/gerar_manual_pdf.py:423`.
- A figura também declara `D02: Buffer Não Amostragem ... Status: Decidida (>= 500 m)` e `D13: Limiar Evento Erosivo ... Pendente (10 vs 12.7 mm/h)`. Isso **contradiz** `decisoes.ts` (D02 trata de critérios presente/ausente; D13 é o Fator R, decidida) **[L]**.
- Nenhum modelo produziu esses números. O único resultado executado do repositório é o dry-run (AUC=1,0).
- **Não está embutida** em nenhum PDF/PPTX/DOCX rastreado (comparação de pixels, mesma busca de A05c). O `docs/Manual_Instalacao_e_Operacao_SAREL.pdf` não contém "0.924" como texto (`pdftotext | grep`). **NÃO VERIFICADO** se alguma cópia redimensionada aparece em PDF.

**Gravidade: induz má interpretação.** Figura com aparência de resultado, sem selo de ilustração, na pasta de figuras do manual.

### A08 — Relatório de mudanças afirma "AUC 0,82-0,91" e "35 passed" (CONFIRMADO)

`pdftotext` de `Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf` (raiz e `docs/relatorios/`) **[M]**: linha 337 `métricas realistas (AUC 0,82-0,91)` (origem: `scripts/gerar_relatorio_mudancas_pdf.py:578`); linhas 355-363 `assegurando 100% de estabilidade e conformidade` e `35 Arquivos de Teste avaliados e aprovados com 100% de sucesso (35 passed)`. Medido hoje: **57 arquivos de teste, 3 com falha** (seção 2). O intervalo de AUC não vem de nenhuma execução registrada **[S: não achei a execução]**. Documento defasado e afirmação sem lastro.

**Gravidade: induz má interpretação.**

### A09 — UI mostra métricas "simuladas" (CONFIRMADO)

`src/components/campanha/PainelCampanha.tsx:267-300` (`calcularMetricasDemonstracao`) gera **250 pixels artificiais** com contagens fixas (comentário `:273`: "70 TP, 2 FP, 5 FN, 173 TN") e NDVI/NDRE por fórmulas de `i`. O botão se chama **"Calcular Métricas Matriciais (GSD vs 10m)"** (`:543-548`) e exibe Acurácia, Kappa, F1, Precisão e IoU em cartões **sem** a palavra "simulado" (`:551-581`). O título da seção diz "Simulação de Delineação Matricial". O estado se chama `metricasSimuladas` (`:56`). A palavra existe no título e no nome interno, não nos números exibidos **[L]**.

**Gravidade: induz má interpretação.**

---

### A10 — B3: texto corrompido no JSON (REFUTADO)

**[M]**

```
$ file docs/relatorios/modelagem/relatorio_modelagem_xgboost_loco.json  ->  JSON text data
UTF-8 estrito: decodifica SIM; U+FFFD (EF BF BD) presentes: 0
"Iguaçu" True | "Ivaí" True | "Litorânea" True | "dissertação" True | "PPGTCA 2026 — XGBoost" True   (bytes UTF-8 corretos)
```

O arquivo é UTF-8 válido, sem caractere de substituição. Os "�" vinham da **leitura** de quem o abriu com outra codificação. O script grava com `open(..., 'w', encoding='utf-8')` e `json.dump(..., ensure_ascii=False)` (`scripts/treinar_xgboost_loco.py:931-932`). Não há linha a corrigir. **Gravidade: cosmético** (nenhuma).

---

### A11 — B4: `DECISOES.md` diverge de `decisoes.ts` (CONFIRMADO)

`DECISOES.md` se descreve como "espelho legível de `src/config/decisoes.ts`". Comparei os dois por script **[M]** (apêndice C reproduz o método): **entre as decisões D**, estado diferente em **9 casos**:

| ID | `decisoes.ts` | `DECISOES.md` (tabela) |
|---|---|---|
| D05, D07, D08, D12, D13, D15, D17, D18, D19 | **decidida** (2026-09-27/28) | **proposta** ("🛑 Proposta Madura") |
| D20, D21, D22, D23, D24, D25, D26 | decidida (2026-09-27) | **ausentes** do arquivo |

(As linhas `P01..P09` também aparecem divergentes na minha comparação, mas minha extração de colunas desse bloco foi imprecisa; não as cito como achado.)

**Divergência de conteúdo, não só de estado [L]:**

- **D03**: `DECISOES.md:67` = "Escala do rótulo: **Binária estrita**" (`0` / `1`, cita `binary:logistic`); `decisoes.ts:51` (decidida em 2026-09-27) = "coleta **ordinal de quatro níveis** (`ausente/incipiente/moderada/severa`) com **binarização declarada** (ausente=0; incipiente, moderada e severa=1)". Os dois dizem "decidida" e dizem coisas diferentes.
- **D26** existe só no `.ts` (`:337`): alvo contínuo, `reg:tweedie`, Spearman. O `.md` ainda descreve `binary:logistic`.

**Gravidade: induz má interpretação.** Quem lê o `.md` (o "legível") toma como vigentes decisões que o `.ts` já substituiu.

### A12 — B4: README defasado (CONFIRMADO)

`README.md:35` ("Guardas ativas para decisões metodológicas pendentes (D13 para Fator R, D14 para Fator K, D15 para Fator LS)"): as três constam como **decididas** em `decisoes.ts` (`:169` D13, D14 e D15 idem). `README.md:39` diz "Invariantes 1 a 7 verificados em tempo de execução" (falso para 3 e 4: A24). `README.md:100` manda executar `git checkout legado-pre-sarel` (a tag não existe: A30). O README descreve rótulos vindos de "campo, fotointerpretação de PlanetScope e drone" e voos de drone "como conjunto de teste independente (held-out)": ver A29.

**A descrição dos rótulos ainda vale depois de D26? PARCIAL.**

- *Sustenta que vale:* `types/rotulo.ts` mantém as três modalidades (`"interpretacao-visual" | "campo" | "drone"`); `ingestaoColetor.ts`/`ingestaoKobo.ts` (campo) e `ingestaoDrone.ts` estão ligados à UI.
- *Sustenta que mudou:* D16 (`decisoes.ts:208`, texto): "o VANT deixa de ser exclusivamente held-out e passa a ser a **MASSA DE TREINO e o TESTE INDEPENDENTE**; o campo deixa de ser massa de treino e passa a ser **âncora**". D26 define o alvo como a **fração contínua** da área delineada **sobre o ortomosaico do VANT**. A fotointerpretação de PlanetScope (Fase A) tem módulo (`ingestaoInterpretacao.ts`) **sem chamador** (A22).
- Conclusão: o README descreve o desenho **anterior** a D16/D26.

**Gravidade: induz má interpretação.**

### A13 — B4: D02 define classes por índices calculados (PARCIAL)

`decisoes.ts:41` D02, titulada "Critérios **observacionais** de presente/ausente e negativo explícito", tem como **valor**: "Amostragem estratificada pura: **Classe 1 (Erosão: BSI > 0.10 e NDVI < 0.40)** vs **Classe 0 (Controle/SPD: BSI < 0.00 e NDVI > 0.65)**" (decidida em 2026-09-13). BSI e NDVI são índices **calculados pelo sistema**. A Regra 4 (`PROMPT_RECONSTRUCAO_SAREL...md:136`) diz que "nada calculado pelo sistema vira rótulo". D02 pode estar definindo **estratos de amostragem** (não rótulos); o texto não separa as duas coisas e o título fala em "observacionais". O script de treino tem as 4 constantes (`:61-64`: `LIMIAR_EROSAO_BSI=0.10` etc.) **sem uso** (só a definição). **[M, grep]**

**Não decido nada.** **Gravidade: precisa de decisão do pesquisador**: separar, na redação de D02, "critério de estrato" de "critério de rótulo".

### A14 — B4: escolhas metodológicas feitas pelo código (CONFIRMADO)

Nenhuma destas consta em decisão **[M]** (`grep -i "imput\|mediana"` em `decisoes.ts`/`DECISOES.md` só acerta texto não relacionado):

| Escolha no código | Onde |
|---|---|
| Imputação de ausentes pela **mediana** do treino antes de ajustar e explicar | `treinar_xgboost_loco.py:676-677` (treino/teste), `:748`, `:788` (SHAP). Contradiz o comentário de `montagem.ts:17` ("Ausente = célula vazia / null; XGBoost trata nativamente ausência"). |
| AUC = **0,5** quando o cálculo falha (ex.: teste com uma só classe) | `treinar_xgboost_loco.py:691-692` (`except Exception: auc = 0.5`). Medido no encanamento: 4 folds com 1 classe cada imprimem `AUC: nan`; o global sai `0.0000`. |
| "LOCO" é `KFold(shuffle=True)` sobre os **nomes dos blocos** | `:638`. Não é leave-one-catchment-out; o texto fala em "6 macrobacias". Com `Bloco_Espacial` vindo do app, o script imprime `[MACROBACIAS] Distribuição por Bacia do Paraná` com rótulos A/B/C/D (`:600`). |
| `clamp` de fração de solo nu em [0,1] | `src/lib/gee/amostragemSoloNuLote.ts:422` (isento por `// permitido:`) |
| Tolerâncias 30 dias (pareamento), 45 dias (busca de cena), 75° (declividade plausível), 0,95 (correlação) | `chuva/eventos.ts:48`, `matriz/montagemTemporal.ts:61`, `gee/versaoMotor.ts:18`, `seguranca/detectorSequencia.ts:63`; sem decisão no registro (as duas primeiras estão em módulos sem chamador: A22) |

**Gravidade: precisa de decisão do pesquisador.** Eu não decido: registro que o código as tomou.

---

### A15 — B5: `?? 0` em componente e furo da guarda (CONFIRMADO)

`src/components/decisoes/PainelSorteioD16.tsx:63-64`:

```ts
const decliv = valorOuNulo(p.terreno?.declividadePct) ?? 0;
const freqNu = valorOuNulo(p.temporal?.D?.serie?.frequenciaSoloNu) ?? 0;
```

Declividade e frequência de solo nu **ausentes viram 0** e entram como candidatos do sorteio D16 (Regras 1 e 5). A guarda não pega porque, em `src/components`, `padroesRestritosComponentes` (`padroesProibidos.test.ts:275-281`) exclui `coalescencia-com-numero` (`:26`). **O efeito no sorteio não foi medido** (NÃO VERIFICADO: não executei o sorteio). **Classificação: viola.**

### A16 — B5: `medido()` carimba uma data de aquisição padrão (CONFIRMADO)

`src/types/proveniencia.ts:33`: `adquiridoEm: string = "2024-01-01"` (e `consultadoEm` padrão `new Date().toISOString()`). Chamadores **sem** a data de aquisição: `src/lib/embrapa/embrapaSoilClient.ts:1166`, `:1274`, `:1397` (`medido(valor, "WMS/WFS ...")`, 2 argumentos). Resultado: dados de uma consulta feita **hoje** a serviços Embrapa recebem `adquiridoEm = "2024-01-01"`. Isso é um default disfarçado em campo de proveniência (Regras 1 e 3). A guarda cobre `adquiridoEm: new Date` e `adquiridoEm: "AAAA-MM-DD"` literais (`padroesProibidos.test.ts:31-32`), mas não um **parâmetro padrão** de função. Em `amostragemSoloNuLote.ts:423-428`, `adquiridoEm` recebe o texto `"2016-2026"` (um intervalo, não uma data). **Classificação: viola** (Embrapa); *justificada com ressalva* (solo nu).

### A17 — B5: BSI ausente vira 0 no Fator C (PARCIAL)

`src/lib/rusle/fatorC.ts:67`: `const bsiNum = bsi !== undefined ? bsi : 0;` com `C = ((1 - ndvi)/2) * (1 + bsiNum)`. Sem BSI, o resultado equivale a Durigon puro (D01); com BSI, é o híbrido (D20). Quem chama sem BSI recebe a fórmula de D01 **sem selo** de que não foi a de D20. Está em função com BSI opcional por assinatura, e `calcularFatorC` só é usada por `linhaDeBase.ts` **[M, grep]**. **Classificação: justificada com ressalva.** **Gravidade: precisa de decisão** (qual fórmula vale quando falta BSI).

### A18 — B5: ingestão fundiária grava 0 para ausente (CONFIRMADO)

`scripts/ingest_sicar_official.py:207-208` (`float(rec.get('num_area') or 0.0)`, `mod_fiscal`), `scripts/ingest_sigef_official.py:181` (`int(rec.get('municipio_') or 0)`), `scripts/query_real_properties.py:109,119`. Área ausente vira 0,0 no SQLite. **Mitigação lida:** `src/lib/fundiario/matcher.ts` (`toContextoFundiario`) converte área ≤ 0 em `null`. **Não verifiquei** o mesmo para `mod_fiscal` nem `municipio_` **(NÃO VERIFICADO)**. **Classificação: viola na ingestão, mitigada na leitura da área.** **Gravidade: induz má interpretação.**

### B5: busca exaustiva, contagens

Escopo: `git ls-files src scripts`, excluindo `*.test.ts(x)`, `legado/`, `scripts/gerar_*`/`generate_*` nos padrões de ternário. **165 arquivos** de código varridos. **[M]**

| Padrão (`git grep`) | Ocorrências | Classificação |
|---|---|---|
| `?? <num>` | **6** | 2 **violam** (`PainelSorteioD16.tsx:63-64`); 4 UI sem efeito científico (`MapViewer.tsx:661-663` zoom/pitch/bearing; `FiltersPanel.tsx:163` valor de campo) |
| `\|\| <num>` | 0 | n/a |
| `fillna(` | 4 | todas `treinar_xgboost_loco.py:676,677,748,788`: imputação por mediana (A14) |
| `np.random`, `random.uniform/normal/choice`, `Math.random` | 7 | 6 **justificadas só pela flag dry-run** (`treinar_xgboost_loco.py:306,332,334,336,338,340`); 1 sem efeito científico (`src/store/useSarelStore.ts:547`, id de log) |
| `faker` | 0 | n/a |
| `.unmask(` | 1 | só comentário (`serieTemporal.ts:9`) |
| `: number = <n>` (parâmetro padrão) | 0 | n/a |
| `.get(.., 0)` / `or 0` (Python/TS) | 4 + 9 | 8 contagens legítimas (`query_real_properties.py:34,73` e `verificar_cobertura.py:79-81`, `treinar...py:562`, `calculadoraDesenhoServer.ts:51-52`); 5 de cadastro fundiário (`ingest_sicar_official.py:207-208`, `ingest_sigef_official.py:181`, `query_real_properties.py:109,119`: A18) |
| ternário `? x : 0` com `isFinite/undefined` | 5 | `fatorC.ts:67` (A17); `amostragemSoloNuLote.ts:414` (contagem inválida vira "0 observações", causa colapsada: Regra 2, mas o D11 então marca insuficiente: *justificada com ressalva*); `detectorSequencia.ts:60` (correlação NaN vira 0, *só guarda*); 2 em `remedir_candidatos_bp3_d16.ts:499,506` (contagem) |
| constantes `const NOME = <num>` (src, não-teste) | 33 | 12 ligadas a decisão (D10: `0.25`; D11: `6`; D12: `18`; D24: `50`; P03: `15/25`; D15: `0.5`; etc.); **candidatas à Regra 9 sem decisão registrada**: `30` dias, `45` dias, `75°`, `0,95`, `0,5` (`embrapaSoilClient.ts:1442`) e `5` (`:1443`). As demais são geodésicas/técnicas (raio da Terra, timeouts, concorrência). Não classifiquei uma a uma além disso. |

**Limite da busca:** a classificação é minha, por leitura de contexto em ~15 locais. Padrões não listados (ex.: `Number(x) || 0` com espaços atípicos, `?? "0"`, `parseFloat(...) || 0` em `.tsx`) foram cobertos pelas regex de `|| <num>` e `?? <num>`; **atribuições `= 0` após `if (x == null)` não foram buscadas**.

---

### A19 — B6: dados pessoais (LGPD)

**[M]**

- `git ls-files data` → **0 arquivos**. Nenhum `.db/.sqlite/.shp/.dbf/.gpkg/.parquet/.xlsx/.xls` versionado; arquivos de dados versionados com essas extensões: 4, todos de voo: `docs/verificacoes/voo/cobertura_voos.geojson` e 3 CSV `SINTETICO_NAO_VOAR_*` em `docs/verificacoes/voo_ncontrol/`. **Um deles é uma "tabela de autorização de proprietários"** (72 linhas; colunas `codigoCar`, `nomeProprietario`, `municipio`, `areaImovelHa`, `dataAutorizacao`, `formaAutorizacao`). **[M]** `nomeProprietario` são 72 rótulos posicionais (`Titular Sicar #1 (A consultar na matrícula/CAR)` … `#72`), não nomes de pessoa; `dataAutorizacao` e `formaAutorizacao` estão vazias; os `codigoCar` têm **27 caracteres**, fora do formato real de 43 (`UF-<7>-<32 hex>`), logo **não parecem CAR reais** **[S]**. O arquivo traz o aviso `# SINTETICO_NAO_VOAR - DADOS DE DEMONSTRACAO`.
- CPF pontuado (`\d{3}\.\d{3}\.\d{3}-\d{2}`): **2** ocorrências, só em `src/lib/fundiario/matcher.test.ts`. CNPJ pontuado: **1**, no mesmo arquivo. Vi os valores: são exemplos óbvios (`123.456.789-00`, `12.345.678/0001-99`). **PDF/PPTX/DOCX/XLSX rastreados: 0 CPF e 0 CNPJ** (extração de texto, regex).
- **Histórico** (`git log --all -G`): 5 commits tocaram CPF pontuado, e eram placeholders de interface, testes e docstring de exemplo (`Ex: ***.456.789-**`). Nenhum com valor que pareça real.
- **CAR (identificador de imóvel rural)**: 9 ocorrências do formato `UF-<7 dígitos>-<32 hex>` em **3 arquivos**: `docs/Delimitacao_Territorial_e_Selecao_Amostral_MultiEscala_BP3.md` (4), `docs/legado/MANUAL_OPERACAO.md:187` (1, como exemplo de "botão de cópia"), `src/lib/padraoOuro/sitiosReferencia.ts:101,377,513,629` (4, `"codigoCar"`). **Não sei se são reais** (NÃO VERIFICADO). O CAR não é CPF, mas identifica uma propriedade e, com as coordenadas, permite chegar ao titular em base pública.
- Em `MANUAL_OPERACAO.md:188-189,376` a palavra "titular" aparece em **prosa** (descreve a máscara do SNCR). Não é nome de pessoa.
- **Não busquei** nomes de proprietários (sem regex possível) nem rostos/placas em imagens.

**Veredito:** CPF/CNPJ reais versionados, **REFUTADO nos padrões buscados**. CAR de 4 sítios de referência no código, **PARCIAL**, para decisão do pesquisador (A19).

### A20 — LGPD na exportação (CONFIRMADO)

**[M, C3]** Ponto artificial com `fundiario.titularMascarado = "NOME_EM_CLARO SINTETICO_TESTE_ENCANAMENTO"`, `documentoMascarado = "123.456.789-00"` e `areaImovelHa = 12.5`:

| Perfil | titular em claro exportado | CPF exportado | área do imóvel exportada |
|---|---|---|---|
| planilha | **sim** | **sim** | sim |
| campo-cego | **sim** | não | não |
| voo-cego | não | não | **sim** |
| interpretacao-cega | não | não | não |
| matriz-treino | não | não | não |

`planilha.ts:119,182` copia `titularMascarado` **como veio**, sem revalidar a máscara; a máscara só é aplicada em `toContextoFundiario` (`fundiario/matcher.ts`). Se algum caminho preencher `ponto.fundiario` **sem** esse passo, o dado vai ao arquivo. Os dois pontos de atribuição não-teste são `inspect-point/route.ts:323` e `select-candidates/route.ts:1231`; **não confirmei** que ambos passam por `toContextoFundiario` (NÃO VERIFICADO). Além disso, `voo-cego` (plano "cego" para o intérprete de ortomosaico) leva a **área do imóvel** na coluna `Area_Voo_Poligono` (`planilha.ts:192`: `` `${areaImovelHa} ha` `` ou o literal `"Buffer 250 m"`): dado fundiário num perfil cego, com nome de coluna que sugere outra coisa.

**Mascaramento "byte a byte"**: com entrada já mascarada ele é preservado (testes de `matcher.test.ts` passam). **Com entrada não mascarada que chegue ao exportador, nenhum perfil fundiário-cego a mascara.** **Gravidade: bloqueia a função** (garantia LGPD declarada depende só do passo anterior).

### A21 — B7: segredos (REFUTADO nos padrões buscados)

**[M]**

- `git ls-files | grep -iE "credential|service.?account|\.pem$|\.key$|\.p12|\.env|token|secret|gee.*json|kobo"` → `.env.example`, `docs/figuras_manual/tela4_ingestao_kobo.png`, `src/components/config/{ApiTokensManager,GcpCredentialsManager}.tsx`, `src/lib/rotulos/ingestaoKobo.ts` (**código/UI/figura**, não credencial).
- `.env.example`: **só comentários** e nomes de variáveis (`NEXT_PUBLIC_MAPBOX_TOKEN=`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY=`, `NEXT_PUBLIC_CARTO_API_KEY=`), todas vazias/comentadas. Valores omitidos aqui por regra.
- `git grep` de `PLAK…`, `AIzaSy…`, `pk.eyJ…`, `"private_key": "-----BEGIN…`, `ts_<hex>`, `ghp_`, `sk-`, `Bearer eyJ…`: acertos **só em testes/guia e todos placeholders truncados**: `docs/legado/GUIA_CONFIGURACAO_CREDENCIAIS.md:63` (`MIIEv...`), `src/lib/seguranca/credenciaisSeguras.test.ts:101`, `padroesProibidos.test.ts:207-213`, `sessaoEfemera.test.ts:8`.
- **Histórico** (`git log --all -G`): 3 commits (`b7d5c59`, `67d8750`, `c52ce84`) acertaram; todos são `pk.eyJ….example` em teste ou a própria suíte de padrões proibidos. Arquivos adicionados no histórico com nome de credencial: só `GcpCredentialsManager.tsx` (componente).
- `.gitignore:20-37` cobre `.env*`, `*.pem`, `*.key`, `*credential*.json`, `*service-account*.json`, `chaves/`, `secrets/`, `tokens/` etc.

**Veredito:** nenhum segredo real **nos padrões buscados**. Não cobre credenciais sem padrão conhecido (senhas, JSON de service account sem o rótulo `private_key`) nem o conteúdo de binários.

---

### A22 — C1: módulos centrais sem chamador (CONFIRMADO)

Método **[M]**: para cada módulo de `src/lib/**` fora de testes, contei importadores (alias `@/`, relativos, `import()`). Os sem importador foram reconferidos **por nome de função** (`git grep -w` excluindo o próprio arquivo e testes). Funções exportadas **sem nenhum uso fora do arquivo e dos testes**:

| Módulo | Funções órfãs | O que o README/planejamento promete |
|---|---|---|
| `matriz/montagemTemporal.ts` | `montarPreditoresTemporais` | monta a série e as janelas D/P que alimentam a matriz |
| `gee/harmonicos.ts` (só importado pela anterior) | decomposição harmônica OLS | "Decomposição harmônica multivariada" |
| `gee/estatisticasSerie.ts` | `calcularEstatisticasBanda`, `construirEstatisticasBloco`, ... | percentis da série |
| `chuva/eventos.ts` (+ `chirps.ts`, `imerg.ts`, só importados por ela) | `construirBlocoChuva`, `calcularIndiceMecanismo` | Fator R / I30 / eventos / índice de mecanismo |
| `gee/sentinel1.ts` | `buscarCenaSentinel1T0` | radar S1 para datas sob nuvem |
| `planet/paresEvento.ts`, `planet/ordersApi.ts`, `planet/tiles.ts`, `planet/dataApi.ts` | `montarTrioEvento`, `avaliarViabilidadeParesAOI`, `montarPedidoPlanetComClipping`, `submeterPedidoPlanet`, `obterUrlSceneTile` | pares T−/T0/T+ e controle de cota PlanetScope |
| `rotulos/ingestaoInterpretacao.ts` | `ingestarInterpretacaoVisual` | Fase A (fotointerpretação cega) |
| `rotulos/taxaErro.ts` | `calcularTaxaErroInterpretacao` | taxa de erro da interpretação |
| `localizacao/fronteira.ts`, `seguranca/detectorSequencia.ts` (7 funções), `fundiario/calculadoraDesenhoServer.ts` | idem | guardas/utilidades |

`planet/quota.ts` é importado por `ApiTokensManager.tsx` (UI) e por módulos Planet sem chamador; se a UI usa o livro-razão **não verifiquei** (NÃO VERIFICADO).

**Como `ponto.temporal` é preenchido no app de fato [L]:** pelas rotas `inspect-point/route.ts:277-313` e `select-candidates/route.ts:1148-1200`, que montam o bloco **à mão**: `harmonicos: {}` (`:1160`), `compostoSoloNu: {}`, `estatisticas: { B8_p50: ... }`, `maiorSequenciaSoloNu` e `mesModalExposicao` como `indisponivel` com `causa: "fora-do-dominio"`, e a chuva **inteira** como `indisponivel` (A23). Ou seja, o app **não usa** o código de harmônicos, de estatísticas da série, de chuva, de pares ou de Planet.

**Gravidade: bloqueia a função.** Parte do que o README diz que o programa faz está implementada e testada **como biblioteca**, mas não é executada por nenhuma rota, tela ou script.

### A23 — C1: chuva fixa em "Aguardando D13" (CONFIRMADO)

`src/app/api/gee/select-candidates/route.ts:1177-1202` (marcador em `:1181`): `precipAcum30d`, `precipAcum90d`, `i30Max`, `nEventosErosivos`, `indiceMecanismo` = `{ estado: "indisponivel", causa: "decisao-pendente", motivo: "Aguardando Decisão D13" }` **para todo candidato**. D13 consta como **decidida** em `decisoes.ts:169`. A causa real é "nao-calculado" (o módulo de chuva não está ligado: A22). O motivo declarado é falso (Regra 2). A janela `"2018-01-01"`–`"2023-12-31"` (`:1150`) é literal no route; não conferi contra D04/D05 (NÃO VERIFICADO). **Efeito medido (C5):** as colunas `Precip_Acum_30d_mm`, `Precip_Acum_90d_mm`, `I30_Max_mm_h`, `N_Eventos_Erosivos`, `Indice_Mecanismo` existem na matriz **mas, no fluxo real, saem vazias** **[L, inferido da rota; não executei a rota]**.

**Gravidade: induz má interpretação.**

### A24 — C3: nem todo invariante bloqueia (CONFIRMADO)

`PROMPT_RECONSTRUCAO...md:541-550` define 7 invariantes que "bloqueiam a exportação". **Medido** com `validarInvariantesArtefato` e entradas artificiais (apêndice A, bloco C3):

| Inv. | Caso inválido entregue | Resultado |
|---|---|---|
| 1 (RUSLE: perda ⟺ 5 fatores ⟺ memória) | perda presente, fatores ausentes | **recusa** (`inv1`) |
| 2 (cabeçalho ⊂ lista do perfil) | coluna `Latitude` no perfil `matriz-treino` | **recusa** (`inv2`) |
| 3 (`Campos_Estimados` lista exatamente os campos ≠ medido) | `Campos_Estimados = ""` com `Elevacao_m_Origem = "modelado"` | **NÃO recusa** (`[]`) |
| 4 (origem satélite ⟹ PRODUCT_ID, data e versão do motor) | `Rastreio_Cenas = ""` e `Rastreio_Versao_Motor = ""` | **NÃO recusa** (`[]`) |
| 5 (negativa fundiária só após consulta ok) | `CAR_Status = sem-correspondencia` + motivo "erro de rede" | recusa (`inv5`); com motivo `"servico indisponivel"` (sem a substring `erro`): **NÃO recusa**; com a coluna do perfil `campo-cego` (`Status_Fundiario`): **NÃO recusa** |
| 6 (literal geográfico proibido) | `Municipio = "Custom"` | **recusa** (`inv6`); `Municipio = "PR"`: **NÃO recusa** (a spec cita "nome de UF") |
| 7 (constante disfarçada, ≥ 21 valores) | 21 valores iguais | **recusa** (`inv7`); 20 iguais: não recusa (limite da regra); coluna *string* constante: não recusa (a regra é numérica) |

No código: o Invariante 3 existe só como **função auxiliar** (`invariantes.ts:97`, `derivarCamposNaoMedidos`), que **não** é chamada por `validarInvariantesArtefato`; o **Invariante 4 não tem implementação** (`grep -in "invariante 4"` em `src` → 0 acertos). O Invariante 5 só olha a coluna `CAR_Status` e a substring `"erro"` (`invariantes.ts:258-270`), e o perfil `campo-cego` usa `Status_Fundiario`.

**README:39 diz "Invariantes 1 a 7 verificados em tempo de execução antes de qualquer exportação".** Medido: 1, 2, 6 (parcial) e 7 bloqueiam; 3 e 4 não existem como barreira; 5 é parcial. **Gravidade: bloqueia a função** (as garantias de proveniência prometidas pelo método).

### A25 — C3: Kappa < 0,60 não bloqueia nada (CONFIRMADO)

`calcularKappaCohen` calcula κ, `operacional = kappa >= 0.6` (`concordancia.ts:135`) e monta o texto `"ALERTA BLOQUEANTE ..."` (`:148`) **[L]**. **Medido:** com 6 pares artificiais discordantes, retorna `{"kappa":-0.3333,"operacional":false,"alertaBloqueante":"ALERTA BLOQUEANTE: Índice Kappa de Cohen (-0.333, IC 95% [-1.00, 0.42]..."}`. Mas `git grep -n "alertaBloqueante|operacional"` em código não-teste só acerta `concordancia.ts` (definição e preenchimento): **nenhum consumidor** lê o campo, e o único chamador de `calcularKappaCohen` é `ingestaoInterpretacao.ts`, que não tem chamador (A22). Resultado: **o "bloqueio" é uma string que ninguém lê**. Na UI, o rótulo "consolidado" nasce com `kappa: null` e `divergencia: "indisponivel"` (`PainelCampanha.tsx:151-156`, `InspetorPonto.tsx:79-85`): um único observador basta para o ponto entrar na matriz (`montagem.ts:117` só exclui `pendente` ou `final` nulo).

Observação: o repositório tem **três** funções `calcularKappaCohen` (`rotulos/concordancia.ts`, `padraoOuro/validacaoMatricial.ts:142`, `config/tourMetodologico.ts:375`).

**Gravidade: bloqueia a função.**

### A26 — C4: binarização do rótulo por texto (CONFIRMADO)

`montagem.ts:139-148` define `ehErosao` por `rotuloNorm.includes("erosao") || includes("erosão") || === "presente" | "incipiente" | "moderada" | "severa" | "1"`. **Medido** chamando `montarMatrizTreino` direto:

```
rotulo "Sem erosão"     => classeAlvoBinaria = 1   (contém a substring "erosão")
rotulo "indeterminado"  => classeAlvoBinaria = 0   (qualquer texto desconhecido vira ausência)
```

Mitigação **lida**: `validarRotulo` (`concordancia.ts:182`, lista `CLASSES_ROTULO_VALIDAS:165`) rejeita as duas strings na ingestão. **Mas `montarMatrizTreino` não revalida**, e a UI pode criar rótulos pelo `InspetorPonto.tsx:79` sem passar por `validarRotulo` **[S: não li o fluxo de validação da UI]**. Além disso há **três binarizações discordantes**: (i) `montagem.ts` por texto; (ii) a UI calcula `alvoBinarioDerivado = fracaoErodida >= 0.25` (`InspetorPonto.tsx:65`, D26) e **a matriz ignora** `fracaoErodida` e `alvoBinarioDerivado` (as linhas da matriz só têm `classeAlvoBinaria`; **medido** `C6.fracaoErodida_na_linha: ["classeAlvoBinaria"]`); (iii) D03 (`decisoes.ts:51`) corta em "incipiente". Um ponto com `classe = "ausente"` e `fracaoErodida = 0.4` seria **0** na matriz e **1** no derivado de D26.

**Gravidade: bloqueia a dissertação** (o alvo supervisionado depende da regra usada).

### A27 — C4: arquivo de chaves e held-out nunca exportados (CONFIRMADO)

`montagem.ts:5-12` promete "Coordenadas geográficas (isoladas no arquivo de chaves)" e "Modalidade 'drone' (estritamente 'held-out', segregada em arquivo próprio)". `git grep` de `chavesCoordenadas` e `heldOutDrone` em código não-teste **[M]**: usados só para contagem na UI (`PainelMatrizTreino.tsx:39,53`) e para uma linha de comentário no pacote (`pacoteReprodutibilidade.ts:161`: `# HELD-OUT DRONE (D16): N pontos excluidos`). **Nenhum arquivo de chaves nem de held-out é gerado.** Consequências: a matriz exportada **não leva coordenadas** (bom para vazamento espacial, mas o trainer então depende de `Bloco_Espacial`); os pontos de drone **somem** do export, e o teste independente de D25 (36 polígonos) não tem arquivo de saída.

**Gravidade: bloqueia a função.**

**C4, colunas por perfil e justificativa [M, medido na C2; colunas do perfil `matriz-treino` em `perfis.ts:135-168`]:**

- `planilha`: 75 colunas, para o pesquisador; inclui rótulo, Kappa, coordenadas e fundiário **por desenho** (não é cego).
- `interpretacao-cega`: `Codigo, Latitude, Longitude, Janela_Inicio, Janela_Fim, Referencia_Cena_Tile`. Não vi rótulo nem estrato. O `Codigo` pode codificar o estrato? **Não verifiquei** (o `Codigo` vem do sorteio, K1 "códigos opacos" no commit `f0b2026`).
- `campo-cego`: `Codigo, Latitude, Longitude, ..._DMS, Municipio, Status_Fundiario, Motivo_Acesso, Codigo_CAR, Titular_Mascarado, Rota_Acesso`. Fundiário para acesso (por desenho; A20).
- `voo-cego`: `Codigo, Latitude, Longitude, Area_Voo_Poligono` (A20: área do imóvel).
- `matriz-treino`: 30 colunas: `Ponto_ID, Bloco_Espacial`, 24 preditores, `Classe_Alvo_Binaria, Rotulo_Classe, Rotulo_Modalidade`. **Sem** coordenadas, **sem** `Estrato_ID`, **sem** `phi`, **sem** fundiário, **sem** drone. O alvo aparece em **3 colunas** (`Classe_Alvo_Binaria`, `Rotulo_Classe`, `Rotulo_Modalidade`): quem montar X por "todas as colunas menos o alvo" vaza o rótulo ordinal. O trainer **não** faz isso (usa lista branca, A28).

---

### A28 — C5: o treino consome a saída do app? **PARCIAL**

**Pergunta, em uma frase: "o treino consome a saída do app"? PARCIAL: o XLSX sim, o CSV não.** **[M]**

- **CSV:** `csv.ts:44-52` escreve linhas `# SAREL...`, `# Emissão`, um bloco LGPD e uma linha em branco **antes** do cabeçalho. `treinar_xgboost_loco.py:188` usa `pd.read_csv(caminho)` sem `comment` nem `skiprows`:

```
$ python3 scripts/treinar_xgboost_loco.py --dados SINTETICO_TESTE_ENCANAMENTO_matriz-treino.csv
pandas.errors.ParserError: Error tokenizing data. C error: Expected 1 fields in line 6, saw 8
exit=1
```

- **XLSX** (aba "Dados" + "Procedência e Conformidade" + "Qualidade do Dado"): `pd.read_excel` lê a **primeira** aba, **(4, 30)**, e `preparar_matriz_preditores` aceita. O pipeline `executar_spatial_kfold_loco` **rodou** (4 linhas artificiais, 4 folds de 1 amostra; AUC `nan` em todos). **Isso prova o encanamento e nada mais.** Os números desse teste não são evidência de nada.
- **Colunas** exportadas pelo app (30) × consumidas pelo trainer: consumidos **13 preditores** (`declividade_pct, elevacao_m, bsi, ndvi, banda_b2, banda_b4, banda_b8, banda_b12, curvatura_perfil, curvatura_plana, twi, rusle_fator_k, rusle_fator_r`). **Exportadas e não consumidas (12):** `Declividade_graus` (o mapeamento do script tem `Declividade_Graus` com G maiúsculo, `:431`; o app emite `Declividade_graus`; e `declividade_graus` nem está nos candidatos), `Acumulo_Fluxo`, `Ordem_Solo`, `Subordem_Solo`, `Grande_Grupo_Solo`, `Erodibilidade_Classe`, `Frequencia_Solo_Nu`, `Precip_Acum_30d_mm`, `Precip_Acum_90d_mm`, `I30_Max_mm_h`, `N_Eventos_Erosivos`, `Indice_Mecanismo`. **O trainer ignora, em silêncio, as variáveis de solo-nu, de chuva e as categóricas de solo.** (As de chuva já saem vazias do fluxo real: A23.)
- **Alvo:** `Classe_Alvo_Binaria` (0/1) presente e lido (`:468`). **Bloco:** `Bloco_Espacial` lido e usado como grupo; o script o chama "bacia"/"macrobacia" nos logs. No app, o bloco vem de `blocosEspaciais.ts` (aresta derivada de variograma, fallback P01 = 20 km), não das macrobacias do Paraná que o texto do script invoca.
- **Unidades e tipos:** não encontrei divergência de nome/tipo nas 13 colunas que casam. **Unidades não foram verificadas** (NÃO VERIFICADO).

**Gravidade: bloqueia a função** (o caminho mais óbvio, CSV, não funciona; o que funciona usa só parte das colunas).

### A29 — C6: fidelidade ao método declarado (CONFIRMADO)

Cada divergência é "decisão (trecho) × código (arquivo:linha)". **Não decido qual lado está certo.**

| Decisão vigente (`decisoes.ts`) | O código |
|---|---|
| **D26 (`:337`)**: alvo **contínuo** (fração da célula de 10 m delineada como erodida, [0,1]); objetivo `reg:tweedie`; métrica primária **Spearman**; binário só **secundário** (≥ 25%) | `treinar_xgboost_loco.py:646` `'objective': 'binary:logistic'`; alvo `Classe_Alvo_Binaria`; métricas acurácia/precisão/recall/F1/AUC. `git grep` de `tweedie`/`spearman`/`bootstrap` em código não-teste: só `PainelCriterioRefutacaoD25.tsx` (painel de UI) e `decisoes.ts`/`InspetorPonto.tsx` (texto). **Nenhuma implementação de treino do alvo contínuo.** |
| **D24 (`:311`)**: **três competidores** pelo mesmo Spearman: linha de base RUSLE, regressão penalizada (logística/Tweedie penalizada) e XGBoost; **monotonicidade** por física; teto de preditores **por bloco**; agrupamento **por polígono** | Só o XGBoost; sem regressão penalizada; `grep -ic monoton` no script = 0; sem teto por bloco; `KFold(shuffle=True)` sobre blocos (`:638`) |
| **D25 (`:324`)**: avaliação **uma vez**, nos **36 polígonos held-out de D16**; ρ ≥ 0,40; margem ≥ 0,10 sobre RUSLE; **bootstrap cuja unidade é o polígono** | CV por blocos no mesmo conjunto; sem held-out; sem bootstrap por polígono; a RUSLE não é avaliada pelo script |
| **D16 (`:208`)**: VANT é **massa de treino e teste independente**; campo é **âncora** | `montagem.ts:196-197`: `if (rotulo.modalidade === "drone") { heldOutDrone.push(linha); continue; }`. Medido: 1 ponto drone ⟹ `{treino:1, heldOut:1}` (o drone não entra em `linhas`). O README e o cabeçalho de `montagem.ts` descrevem o desenho **anterior** a D16. |
| **D03 (`:51`)**: ordinal de 4 níveis preservado no dado; binário com corte entre ausente e incipiente | `perfis.ts:165-167` exporta `Classe_Alvo_Binaria` e `Rotulo_Classe` (a ordinal **é** preservada: ok). A binarização é por texto (A26). |
| **D04**: Modelo D e Modelo P com guarda de 24 meses (`definirJanelasModelo`) | A função só é chamada por `montagemTemporal.ts`, sem chamador (A22); `planilha.ts:204` fixa `modeloJanela: "D"`. |

**Gravidade: bloqueia a dissertação.** O código ainda é o desenho anterior a D16/D24/D25/D26.

### A30 — Tag `legado-pre-sarel` não existe (CONFIRMADO)

`README.md:100`: `git checkout legado-pre-sarel`. **[M]** `git tag` (vazio) e `git rev-parse refs/tags/legado-pre-sarel` → "NAO existe"; `git ls-remote --tags origin` → vazio. O README promete código legado "congelado" nessa tag. O que existe é `legado/pre_sarel/` e `legado/versoes_anteriores/` na árvore. **Gravidade: induz má interpretação.**

---

## 4. Tabela C7: função proposta → estado

Valores permitidos: **FUNCIONA E FOI DEMONSTRADO** / **IMPLEMENTADO MAS NÃO DEMONSTRADO** / **NÃO IMPLEMENTADO** / **BLOQUEADO POR DECISÃO OU DADO EXTERNO**. Mapa de ponta a ponta (C1) com a marca do elo: CE+T = conectado e testado; CS = conectado sem teste; DESC = desconectado; NI = não implementado.

| # | Função proposta | Módulo(s) | Elo (C1) | Estado (C7) | Evidência |
|---|---|---|---|---|---|
| 1 | Região e candidatos (AOI, tiling, elegibilidade, município) | `api/gee/select-candidates/route.ts`, `gee/aoiTiling.ts`, `elegibilidade.ts`, `localizacao/municipio.ts` | CS (módulos com teste unitário; a rota não tem teste) | **IMPLEMENTADO MAS NÃO DEMONSTRADO** | exige credencial GEE; 429 testes unitários passam, nenhum executa a rota |
| 2 | Estratificação em 18 estratos e *thinning* | `gee/estratificacao.ts`, `thinning.ts` | CE+T (unitário) | **IMPLEMENTADO MAS NÃO DEMONSTRADO** | testes unitários passam; não executado com candidatos reais |
| 3 | Série temporal e biofísica por ponto (freq. solo nu, NDVI, BSI, terreno) | `gee/serieTemporal.ts`, `amostragemSoloNuLote.ts`, `copernicusGeeClient.ts`, `terreno.ts` | CS | **IMPLEMENTADO MAS NÃO DEMONSTRADO** | depende de GEE/DEM; testes de DEM falham sem `data/dem_cache` |
| 4 | Harmônicos OLS, estatísticas da série, pares T−/T0/T+, chuva (CHIRPS/IMERG), S1 | `harmonicos.ts`, `estatisticasSerie.ts`, `paresEvento.ts`, `chuva/*`, `sentinel1.ts`, `montagemTemporal.ts` | **DESC** (A22) | **NÃO IMPLEMENTADO** no fluxo (existe como biblioteca testada) | `git grep -w`: 0 usos fora de testes |
| 5 | Cotas e pedidos PlanetScope | `planet/quota.ts`, `ordersApi.ts`, `tiles.ts` | **DESC** (A22) | **NÃO IMPLEMENTADO** no fluxo; demonstração **BLOQUEADA** por credencial/cota | 0 chamadores de `submeterPedidoPlanet` |
| 6 | Rotulagem de campo (Coletor/Kobo) e pela UI (Inspetor) | `rotulos/ingestaoColetor.ts`, `ingestaoKobo.ts`, `InspetorPonto.tsx` | CE+T (unitário) | **IMPLEMENTADO MAS NÃO DEMONSTRADO** | não executei as ingestões |
| 7 | Rotulagem por fotointerpretação (Fase A) e Kappa interobservador | `ingestaoInterpretacao.ts`, `concordancia.ts`, `taxaErro.ts` | **DESC** (A22, A25) | **NÃO IMPLEMENTADO** no fluxo | 0 chamadores |
| 8 | Bloqueio de Kappa < 0,60 | `concordancia.ts:148` | **NI** como bloqueio (A25) | **NÃO IMPLEMENTADO** | `alertaBloqueante` sem consumidor |
| 9 | RUSLE como linha de base (C, K, R, LS, P, A) | `rusle/linhaDeBase.ts`, `fatorC/K/LS/R.ts` | CS | **IMPLEMENTADO MAS NÃO DEMONSTRADO** | valores dependem de GEE/DEM/Embrapa; não executei |
| 10 | Montagem da matriz e exportação por perfil (5 perfis) | `matriz/montagem.ts`, `perfis.ts`, `export/*` | CE+T | **FUNCIONA E FOI DEMONSTRADO** (somente o encanamento) | executei nesta sessão com 4 pontos artificiais: 5 perfis geraram 4 linhas cada; XLSX gerado (C2). **Isso não valida nenhum resultado científico.** |
| 11 | Invariantes 1, 2, 6 (parcial) e 7 recusam caso inválido | `matriz/invariantes.ts` | CE+T | **FUNCIONA E FOI DEMONSTRADO** (somente o encanamento) | casos inválidos recusados (A24) |
| 12 | Invariantes 3 e 4; 5 completo | idem | **NI** | **NÃO IMPLEMENTADO** | A24 |
| 13 | Guarda contra dado sintético (`origemSintetica`, prefixos `TEST-`/`SYNTHETIC-`) | `seguranca/guardaSintetico.ts` | CE+T | **FUNCIONA E FOI DEMONSTRADO** (só por flag ou prefixo; não detecta o nome `SINTETICO_…`) | `origemSintetica=true` ⟹ exportação recusada (A06, C3) |
| 14 | Mascaramento LGPD no export | `fundiario/protecao.ts`, `planilha.ts` | CE+T parcial | **IMPLEMENTADO MAS NÃO DEMONSTRADO** (falha com entrada não mascarada: A20) | executei: titular e CPF em claro saíram na `planilha` |
| 15 | Segregação de drone como held-out | `montagem.ts:196` | CE+T, mas é o desenho antigo (A29) | **IMPLEMENTADO MAS NÃO DEMONSTRADO** (e diverge de D16) | executei: drone fica fora de `linhas` |
| 16 | Treino lê a matriz (XLSX) | `scripts/treinar_xgboost_loco.py` | CS (manual, só XLSX) | **FUNCIONA E FOI DEMONSTRADO** (somente o encanamento XLSX→trainer) | executei com 4 linhas artificiais (A28) |
| 17 | Treino lê a matriz (CSV) | idem | — | **NÃO IMPLEMENTADO** | `ParserError` (A28) |
| 18 | Modelo conforme D24/D25/D26 (alvo contínuo, Tweedie, Spearman, 3 competidores, bootstrap por polígono) | — | **NI** | **NÃO IMPLEMENTADO** | A29 |
| 19 | Treino + SHAP (binário) | `treinar_xgboost_loco.py` | CS | **IMPLEMENTADO MAS NÃO DEMONSTRADO** | só dry-run existente (artefato, A05); não reproduzível aqui |
| 20 | Validação científica do método com dados reais (GEE, Planet, campo, voo) | — | — | **BLOQUEADO POR DECISÃO OU DADO EXTERNO** | ver abaixo |

**Escopo.** Nenhuma etapa que dependa de GEE, Planet, campo ou voo reais foi validada cientificamente. Isso está fora do alcance de uma auditoria de código. O que "FUNCIONA E FOI DEMONSTRADO" prova **só que o encanamento liga**, não que o método esteja certo.

---

## 5. Afirmações do relatório do Sonnet 5.5

(O "relatório anterior" é a descrição do repositório que o Sonnet 5.5 entregou no 1º turno desta sessão, sobre o checkout `d2a7b5a`.)

| # | Afirmação | Veredito | Evidência |
|---|---|---|---|
| 1 | "O repositório está limpo, e o último commit é o merge do PR #2 (`d2a7b5a`)." | **REFUTADA** para a branch auditada. Era verdadeira para o checkout que o agente examinou (`main`). | O HEAD de `sarel/v2` é `5f7c033` (código idêntico a `fd613e3`), a branch que o prompt manda auditar. `git log --merges` não mostra merge recente. |
| 2 | "`node_modules` não está instalado." | **REFUTADA para a máquina do pesquisador; verdadeira neste contêiner.** | `ls node_modules` → "No such file" no início; depois `npm ci` criou 457 pastas. Na máquina do pesquisador, eu não verifico. |
| 3 | "SAREL v2.0.0; Next.js 14, React 18, TS, Zustand, Tailwind, MapLibre; roda em 127.0.0.1:3000." | **CONFIRMADA** (stack) / **NÃO VERIFICADA** (rodar). | `package.json`: `next 14.2.35`, `react 18.3.1`, `zustand`, `maplibre-gl`, `tailwindcss`; `dev: next dev -H 127.0.0.1`. O `build` falha (A01); não subi o servidor. |
| 4 | "Estratifica em 18 estratos e aplica thinning de 1 km." | **PARCIAL.** | D12 e `calculadoraDesenho.ts:145` (`ESTRATOS = 18`); thinning **P02** está como "1,0 km a 5,0 km" no `.md` e como `decidida` no `.ts`. Conectado à rota (`select-candidates`); não executei. |
| 5 | "Ajusta harmônicos por OLS e calcula frequência de solo exposto." | **PARCIAL**: frequência de solo nu **sim**; harmônicos **não**. | A22: harmônicos órfãos; `route.ts:1160` `harmonicos: {}`. |
| 6 | "Monta pares de eventos T−/T0/T+ com chuva (CHIRPS/IMERG) e radar S1." | **REFUTADA** como funcionalidade ativa. | A22: `montarTrioEvento`, `construirBlocoChuva`, `buscarCenaSentinel1T0` sem chamador; A23: chuva fixa em "indisponivel". |
| 7 | "Livro-razão persistente de cotas PlanetScope, recusa de sobretaxa." | **NÃO VERIFICADA / parcial.** | `quota.ts` existe e é testado; seus chamadores de pedido são órfãos (A22). |
| 8 | "Fator R, K e LS bloqueados por decisões pendentes (D13, D14, D15)." | **REFUTADA.** | `decisoes.ts`: D13 (`:169`), D14 e D15 estão **decididas**. O texto veio do README (A12). |
| 9 | "Kappa de Cohen com alerta bloqueante para κ < 0,60." | **REFUTADA** quanto a "bloqueante". | A25: o alerta é uma string sem consumidor. |
| 10 | "Invariantes 1 a 7 verificados em tempo de execução antes de qualquer exportação." | **REFUTADA** para 3 e 4; **PARCIAL** para 5 e 6. | A24 (medido). |
| 11 | "Segregação mandatória de voos de drone como conjunto de teste independente (held-out)." | **PARCIAL**: implementado; **diverge** de D16 vigente; os dados de held-out nunca são exportados. | A27, A29. |
| 12 | "O script de treino usa Fator K, Fator R e perda RUSLE como preditores; o commit 575467f removeu a perda da matriz." | **CONFIRMADA** (e matizada). | A04: confirmado para o script; a matriz do app já não exporta a perda; K e R seguem exportados. |
| 13 | "O relatório de modelagem é dry-run; AUC=1,0; classe 0 sintetizada." | **CONFIRMADA.** | A05: JSON, intervalos `np.random.uniform` (`:332-340`), PNGs com aviso. |
| 14 | "As imagens ROC/SHAP desse relatório podem parar em documento ou apresentação." | **REFUTADA nos meios usados**: não achei nenhuma cópia embutida. | A05(c): hash de bytes e pixels vs 10 PPTX/DOCX e 17 PDFs. **Mas** `tela5_xgboost_decisoes.png` mostra métricas inventadas (A07). |
| 15 | "D02 e D03 estão pendentes; ficam com você." | **REFUTADA** para `sarel/v2`. Era verdadeira no `DECISOES.md` do checkout `main`. | `decisoes.ts:41,51`: ambas **decididas**; D03 mudou de conteúdo (A11). |
| 16 | "Código legado arquivado em `legado/pre_sarel/` e na tag `legado-pre-sarel`." | **REFUTADA** quanto à tag. | A30. |
| 17 | "Scripts Python: ingestão SIGEF, SNCR, SICAR, geração de PDFs, treino XGBoost/SHAP." | **CONFIRMADA** (existência). | `ls scripts/`: `ingest_sicar/sigef/sncr_official.py`, `gerar_*_pdf.py`, `treinar_xgboost_loco.py`. Nenhum desses scripts foi executado. |
| 18 | "Fontes: GEE (Sentinel-2, Sentinel-1, CHIRPS, IMERG), PlanetScope, Embrapa, IBGE." | **PARCIAL**: Sentinel-2, Embrapa e IBGE ligados; S1, CHIRPS/IMERG e Planet existem sem ligação. | A22. |

---

## 6. O que eu não consegui verificar e por quê

1. **Qualquer etapa com GEE, Planet, campo ou voo.** Não há credencial (e as regras proíbem consumir cota ou criar tarefa no Earth Engine). Os elos 1, 2, 3 e 9 da tabela C7 ficam em "IMPLEMENTADO MAS NÃO DEMONSTRADO".
2. **Reproduzir o dry-run existente.** Faltam `data/fundiario_brasil.db` e `legado/pre_sarel/Tabela_Consolidada_...150focos...xlsx` (ambos fora do git). Não vi a classe 1 do dry-run, e a explicação do AUC=1,0 (A05b) fica como hipótese.
3. **Os 6 testes que falham, com os dados presentes.** `data/dem_cache/*.tif`, `data/*.db` e os PDFs bibliográficos não existem aqui. Não sei se passam na máquina do pesquisador.
4. **Se `npm run dev` abre a aplicação** apesar de o `build` falhar. Não subi o servidor.
5. **Valores de R, K e LS nos pontos reais** e a corretude numérica da linha de base RUSLE. Dependem de GEE/DEM/Embrapa.
6. **Se os dois pontos que atribuem `ponto.fundiario`** (`inspect-point/route.ts:323`, `select-candidates/route.ts:1231`) **passam por `toContextoFundiario`** (A20). Não segui o fluxo até o fim.
7. **Se os identificadores CAR versionados (A19) são de imóveis reais.**
8. **Nomes de proprietários** em qualquer arquivo (sem regex possível) e **conteúdo de imagens** (rostos, placas).
9. **Unidades** das 13 colunas que casam entre app e trainer (A28).
10. **Efeito de A15** (`?? 0`) sobre o resultado do sorteio D16.
11. **Se a validação da UI** (`InspetorPonto.tsx`) **chama `validarRotulo`** antes de gravar o rótulo (A26).
12. **A janela `2018-01-01`–`2023-12-31`** (`select-candidates/route.ts:1150`) **contra D04/D05.**
13. **Versões das libs Python do pesquisador.** Usei as mais recentes; o resultado do trainer pode variar.
14. **Constantes numéricas:** classifiquei por contexto uma amostra (~15 de 33 + as de `scripts/`). Não li o contexto das demais.
15. **`git log --merges`** retornou vazio. Conferi depois **[M]**: `git rev-parse --is-shallow-repository` = `false`, 194 commits, 0 merges em todo o histórico (histórico linear). Não sei se isso é intencional (rebase/squash).

---

## 7. Onde eu posso ter errado

| Suposição em que a conclusão depende | Como o pesquisador confere |
|---|---|
| **A06**: repliquei `varrerCodigo` copiando o texto do arquivo de teste (`guarda_probe.mjs`), não importando o arquivo (o `.test.ts` não exporta um ponto de entrada acessível sem rodar o vitest). Se a cópia divergir do original, os 4 casos mudam. | Reproduzir os casos A-D no próprio `padroesProibidos.test.ts` (adicionar um caso temporário) ou rodar `node` sobre o apêndice B. |
| **A24**: usei `validarInvariantesArtefato` com cabeçalhos mínimos e `perfil: "planilha"` para os casos 1, 3, 4, 6, 7. Se o app exporta com cabeçalhos diferentes, Inv. 3/4 podem ser checados em outro ponto que não encontrei (`grep` por `Campos_Estimados` e `Rastreio_Cenas`/`Invariante 4` em `src` só achou a função auxiliar do 3). | `git grep -n "Invariante 4\|Campos_Estimados" -- src`; rodar o apêndice A (bloco `C3`). |
| **A22**: "órfão" = nenhuma importação/uso por nome fora do arquivo e dos testes. Uso por string (`require` dinâmico, nome montado) escaparia da busca. Os scripts `scripts/*.ts` entram na busca; chamadas por Python, não. | `git grep -nw montarPreditoresTemporais construirBlocoChuva submeterPedidoPlanet ingestarInterpretacaoVisual`. |
| **A26**: `ehErosao` foi exercitada direto em `montarMatrizTreino`; a rota real da UI pode validar antes. | Ver se `InspetorPonto.tsx:79` valida a classe; tentar gravar `"Sem erosão"` pela tela. |
| **A28**: usei 4 linhas artificiais. O resultado "CSV falha; XLSX lê" independe dos valores; o comportamento do trainer com dados reais **não** foi testado. | Exportar o CSV real do app e rodar `pd.read_csv` nele. |
| **A05b**: a explicação de AUC=1,0 pela declividade vem da imagem SHAP e das faixas `uniform`; **não vi a classe 1**. | Abrir a planilha `150focos` e comparar a distribuição de `declividade_pct` dos focos com U(3;14). |
| **A11**: comparei estados com um parser de texto (regex) sobre `decisoes.ts` e a tabela de `DECISOES.md`. A divergência das linhas `P01..P09` pode ser artefato do meu parser (não as citei). Os 9 casos `D` foram conferidos também por leitura da tabela. | `grep -n "^| \*\*D05\*\*" docs/planejamento/DECISOES.md` e `grep -n "estado:" -B3 src/config/decisoes.ts`. |
| **B5**: "exaustiva" vale para os padrões listados; classifiquei por contexto. | Rodar os mesmos `git grep` da seção B5 e comparar contagens. |
| **A19/A21**: ausência de achado em busca por regex não prova ausência de dado/segredo. | Rodar `gitleaks`/`trufflehog` e uma varredura de nomes próprios com apoio do pesquisador. |
| Pressupus que o trecho `# permitido:` ≥ 20 caracteres, lido em `padroesProibidos.test.ts:49-57`, é o único mecanismo de isenção; não procurei listas de exceção por arquivo. | `grep -n "permitido\|EXCE\|ignor" src/lib/seguranca/padroesProibidos.test.ts`. |

---

## 8. Material de teste

- **O que criei.** Diretório `…/scratchpad/SINTETICO_TESTE_ENCANAMENTO_tmp/`, **fora do repositório**, na pasta temporária da sessão. Dentro: `SINTETICO_TESTE_ENCANAMENTO_so_classe1.csv` (4 linhas, valores 1-4), 5 CSV + 1 XLSX gerados pelo próprio app a partir de **4 pontos artificiais** (`SINTETICO_TESTE_ENCANAMENTO_1..4`, valores 1-4), os 2 arquivos de sonda (`*_c.probe.test.ts`, `*_k.probe.test.ts`), `guarda_probe.mjs`, `vitest.probe.config.mts`, `hash_antes.txt` e um *symlink* para o `node_modules` do repositório (para o `vitest` resolver). Todos levam `SINTETICO_TESTE_ENCANAMENTO` no nome e no conteúdo. Nenhum em `data/`, `docs/`, `src/` ou `scripts/`.
- **Execuções:** `treinar_xgboost_loco.py` pela linha de comando com saída em `<tmp>/out` (nunca em `docs/relatorios/`): 3 vezes (sem flag; com flag e sem banco; com o CSV do app). Mais 1 sessão Python que **importou** o módulo e leu o XLSX do app (`preparar_matriz_preditores`, `executar_spatial_kfold_loco`). `<tmp>/out` ficou vazio. Nenhum número desses testes é citado como evidência científica; onde aparecem (C2, C5), a frase diz que provam só o encanamento.
- **Hashes SHA-256** dos 5 arquivos de `docs/relatorios/modelagem/` **antes e depois**, idênticos:

```
bb557dada06e630d6ea2e4d3ceae9fb030682dcf857bf4a4073f76c415c718f5  curva_roc_loco.png
20a713c60bf2fe7ff1dee6dbd91542b1dd707cd1b2214ea32853ef4e9d01ae63  matriz_confusao_loco.png
755bbd4e173340f29d117eef5c55ac446af2bde89f47b5018ffd83bbf101caa3  relatorio_modelagem_xgboost_loco.json
cf85dcf0558865b305fb7492fab7d243712d8a6a635ef73ee957cdd427b2a12b  shap_feature_importance.png
37aae950f90117254a18cbb6ccf950c4bf55f035093cc4c10f5a2b3c6593ac1f  shap_summary_beeswarm.png
$ sha256sum -c hash_antes.txt  ->  os 5 arquivos: OK    (conferido antes de apagar)
$ git diff --stat HEAD -- docs/relatorios/modelagem  ->  (vazio: iguais ao commit)
```

(O prompt pede `Get-FileHash`, do PowerShell. O ambiente é Linux e usei `sha256sum`, que calcula o mesmo SHA-256.)

- **Prova de remoção:**

```
$ unlink <tmp>/node_modules && rm -rf <tmp>
$ ls -d <tmp>
ls: cannot access '.../scratchpad/SINTETICO_TESTE_ENCANAMENTO_tmp': No such file or directory
$ ls node_modules | wc -l   ->  457   (a instalação do repositório não foi tocada)
$ git status --porcelain    ->  (vazio antes de criar este relatório)
```

**Estado final (conferido depois de gravar este arquivo):**

```
$ git status --porcelain
?? docs/auditorias/AUDITORIA_PARTE1_2026-10-05.md
$ git diff --stat HEAD -- docs/relatorios/modelagem   ->  (vazio)
```

`docs/auditorias/` já existia (tem 9 arquivos rastreados). Só este arquivo é novo; nenhum arquivo rastreado foi alterado.

- **Fora do diretório temporário, por necessidade:** `npm ci` (criou `node_modules/`, que está no `.gitignore`) e `pip install` das libs Python no ambiente do contêiner. Nenhum dos dois altera arquivos versionados. Também usei `/tmp/_pdfimg` (extração de imagens de PDF, apagado no mesmo comando), e gravei o rascunho deste relatório e os apêndices na pasta de rascunho da sessão (`…/scratchpad/`), fora do repositório. Mudei o HEAD do clone para `origin/sarel/v2` (seção 1.1).

---

## 9. Pontos para a PARTE 2 (indícios de má interpretação, sem investigar a fundo)

1. **Nomes enganosos:** `Area_Voo_Poligono` carrega a área do imóvel (`planilha.ts:192`); `[MACROBACIAS]` no log do trainer rotula blocos arbitrários (`:600`); "LOCO" é `KFold` de blocos (`:638`); `metricasSimuladas` exibido como "Calcular Métricas Matriciais" (A09); "ALERTA BLOQUEANTE" sem bloqueio (A25); `heldOutDrone` "segregada em arquivo próprio" sem arquivo (A27); `Bloco_Espacial` default `BLOCO_INDEFINIDO` (`montagem.ts`) no app e `"não atribuído"` na planilha (`planilha.ts:49`).
2. **Documentos defasados:** README (A12), `DECISOES.md` (A11), `Relatorio_Mudancas...pdf` ("35 passed", "AUC 0,82-0,91": A08), `tela5` (A07), `docs/legado/*`, cabeçalho de `montagem.ts` (A04, A27).
3. **Resultado sem selo:** `tela5_xgboost_decisoes.png`; cartões de métricas da UI; JSON do dry-run em `docs/relatorios/` (existe a recomendação, em `PROMPT_EXECUCAO_DESENHO_CONSOLIDADO_2026-09-27.md:163`, de movê-lo).
4. **Rótulo "Sem erosão" → 1** (A26) e a regra de binarização em três lugares.
5. **Motivo falso de indisponibilidade** ("Aguardando D13", A23) e `causa: "fora-do-dominio"` usado para "ainda não calculado".
6. **Default como dado:** `medido()` com `adquiridoEm = "2024-01-01"` (A16); `"Buffer 250 m"` literal em `voo-cego`; `0` na ingestão fundiária (A18).
7. **Três `calcularKappaCohen`** com assinaturas diferentes; `tourMetodologico.ts` duplica código de cálculo.
8. **`scripts/` é dependente de ambiente:** dados locais e bibliotecas fora do `requirements.txt` (`rasterio`, `reportlab`, `python-docx`, `python-pptx`, `pyproj`).
9. **Guardas que só olham o arquivo, não a execução:** `ehPontoSintetico` pelo prefixo do `id`/`codigo` (`guardaSintetico.ts:17`), isenção `# permitido:` (A06), invariantes 3 e 4 (A24).
10. **Quatro constantes de script não usadas** (`treinar_xgboost_loco.py:61-64`) que reproduzem os limiares de D02.

---

## 10. Nenhuma correção aplicada e nenhum prompt de correção

Não corrigi nada, não criei prompt de correção, não fiz commit, push, merge nem rebase. Não assinei nada nem preenchi `docs/PROVENIENCIA_ASSISTENCIA_IA.md`. O único arquivo novo no repositório é este.

**Conclusão geral (sem veredito de "pronto/limpo/robusto").** O que existe e o que foi provado:

- Existe um **motor de exportação e de invariantes funcional como encanamento** (C2): 5 perfis, recusa de casos inválidos nos Invariantes 1, 2, 6 e 7, recusa de pontos marcados como sintéticos.
- Existe uma **biblioteca ampla** (harmônicos, chuva, pares de evento, Planet, fotointerpretação, Kappa) **sem ligação** com as telas e rotas (A22).
- **O build de produção falha** (A01), os testes **não são herméticos** (A02), e o **treino não consome o CSV** que o app exporta (A28).
- **O código de treino ainda é o desenho anterior a D16/D24/D25/D26** (A29), e as decisões do `.ts` e do `.md` divergem (A11).
- Os testes que passam (429 de 435) **não provam** que o método esteja certo: vários dos achados acima convivem com a suíte verde (A06, A15, A24, A25).

**Último identificador usado: A30.** A PARTE 2 continua em A31.

---

# Apêndices (reprodutibilidade)

Os apêndices abaixo permitem repetir as sondas. Todo dado é artificial e leva `SINTETICO_TESTE_ENCANAMENTO`. **Nenhum resultado delas é evidência científica**; provam só que o encanamento liga ou recusa.

## Apêndice A. Sonda de encanamento (C2, C3, C4, C5, C6): `SINTETICO_TESTE_ENCANAMENTO_c.probe.test.ts`

Executada com `vitest` e um config fora do repositório (apêndice E). Pontos artificiais `SINTETICO_TESTE_ENCANAMENTO_1..4`, valores 1-4. Cada linha de saída tem o prefixo `PROBE|`.

```ts
// SINTETICO_TESTE_ENCANAMENTO — sonda de auditoria. Dados obviamente artificiais (valores 1,2,3,4). NAO e evidencia cientifica.
import { describe, it, expect } from "vitest";
import fs from "fs";
import { medido } from "@/types/proveniencia";
import { gerarCsvCientifico } from "@/lib/export/csv";
import { gerarPlanilhaXLSX, extrairLinhasPorPerfil } from "@/lib/export/planilha";
import { validarInvariantesArtefato } from "@/lib/matriz/invariantes";
import { PERFIS_EXPORTACAO } from "@/lib/matriz/perfis";
import { montarMatrizTreino } from "@/lib/matriz/montagem";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";
import { calcularKappaCohen } from "@/lib/rotulos/concordancia";

const T = process.env.T_DIR as string;
const P = (v: number) => medido(v, "SINTETICO_TESTE_ENCANAMENTO", "2000-01-01", "2000-01-01T00:00:00Z");
const S = (v: string) => medido(v, "SINTETICO_TESTE_ENCANAMENTO", "2000-01-01", "2000-01-01T00:00:00Z");
function mk(i: number, bloco: string, extra: any = {}): any {
  return {
    id: `SINTETICO_TESTE_ENCANAMENTO_ID_${i}`, codigo: `SINTETICO_TESTE_ENCANAMENTO_${i}`,
    latitude: -24 - i * 0.001, longitude: -53 - i * 0.001, origemSintetica: false, blocoEspacial: bloco,
    espectral: { ndvi: P(i), bsi: P(i + 1), b2: P(i), b4: P(i), b8: P(i), b12: P(i) },
    estratoId: "SINTETICO_TESTE_ENCANAMENTO_E1",
    criterioSelecao: { tercilS: 1, tercilE: 1, nivelK: 1, phiDiag: 1, semente: 1 },
    localizacao: { municipio: S("SINTETICO_TESTE_ENCANAMENTO"), codigoIbge: S("0"), bacia: S("SINTETICO_TESTE_ENCANAMENTO") },
    terreno: { elevacao: P(i), declividadePct: P(i), declividadeGraus: P(i), curvaturaPerfil: P(i), curvaturaPlana: P(i), acumuloFluxo: P(i), twi: P(i) },
    solo: { ordem: S("SINTETICO_TESTE_ENCANAMENTO"), subOrdem: S("x"), grandeGrupo: S("x"), tipoUnidade: S("simples"), confiancaPedologica: "alta", erodibilidadeClasse: S("1") },
    temporal: { D: { janela: { inicio: "2000-01-01", fim: "2000-02-01" },
      serie: { sensores: [], nObservacoesValidas: {}, harmonicos: {}, estatisticas: {}, frequenciaSoloNu: P(i), maiorSequenciaSoloNu: P(i), mesModalExposicao: P(i), compostoSoloNu: {} },
      chuva: { precipAcum30d: P(i), precipAcum90d: P(i), i30Max: P(i), nEventosErosivos: P(i), indiceMecanismo: P(i) } } },
    linhaDeBase: { fatorR: P(i), fatorK: P(i), fatorLS: P(i), fatorC: P(i), fatorP: P(1), perdaSolo: P(i), memoriaCalculo: "SINTETICO_TESTE_ENCANAMENTO" },
    rastreio: { versaoMotor: "SINTETICO_TESTE_ENCANAMENTO", cenas: ["SINTETICO_TESTE_ENCANAMENTO"], calculadoEm: "2000-01-01" },
    ...extra,
  };
}
const rot = (classe: string, modalidade = "campo") => ({ final: { classe, modalidade, observador: "SINTETICO_TESTE_ENCANAMENTO", observadoEm: "2000-01-01", cego: true }, origens: [], kappa: null, divergencia: "nenhuma", papelConjunto: "treino" });
const pontos = [mk(1, "A"), mk(2, "B"), mk(3, "C"), mk(4, "D")];
const rotulos: any = { [pontos[0].codigo]: rot("ausente"), [pontos[1].codigo]: rot("incipiente"), [pontos[2].codigo]: rot("severa"), [pontos[3].codigo]: rot("ausente") };
const log = (k: string, v: unknown) => console.log(`PROBE|${k}|${typeof v === "string" ? v : JSON.stringify(v)}`);
function viol(cab: string[], linhas: any[], perfil: any) { return validarInvariantesArtefato({ cabecalho: cab, linhas, perfil }).violacoes.map(v => `inv${v.invariante}`); }

describe("C2 encanamento por perfil", () => {
  for (const perfil of Object.keys(PERFIS_EXPORTACAO) as any[]) {
    it(`perfil ${perfil}`, () => {
      try {
        const linhas = extrairLinhasPorPerfil(pontos, perfil, rotulos);
        log(`C2.${perfil}.n_linhas`, linhas.length); log(`C2.${perfil}.colunas`, Object.keys(linhas[0] ?? {}));
        const csv = gerarCsvCientifico(pontos, perfil, rotulos);
        fs.writeFileSync(`${T}/SINTETICO_TESTE_ENCANAMENTO_${perfil}.csv`, csv);
        log(`C2.${perfil}.csv_primeiras_linhas`, csv.split("\r\n").slice(0, 3).map(l => l.slice(0, 80)));
      } catch (e: any) { log(`C2.${perfil}.RECUSADO`, String(e.message).slice(0, 300)); }
    });
  }
  it("xlsx", async () => {
    const buf = await gerarPlanilhaXLSX(pontos, { perfil: "matriz-treino", rotulosConsolidados: rotulos } as any);
    fs.writeFileSync(`${T}/SINTETICO_TESTE_ENCANAMENTO_matriz-treino.xlsx`, buf); log("C2.xlsx.bytes", buf.length);
  });
});

describe("C3 barreiras", () => {
  const base = ["Municipio", "Bacia_Hidrografica"];
  it("inv1 RUSLE incoerente", () => log("C3.inv1.invalido(perda sem fatores)", viol(["RUSLE_Perda_Solo_t_ha_ano", "RUSLE_Fator_R"], [{ RUSLE_Perda_Solo_t_ha_ano: 1, RUSLE_Fator_R: 1 }], "planilha")));
  it("inv2 coluna fora da lista", () => log("C3.inv2.invalido(Latitude em matriz-treino)", viol(["Ponto_ID", "Latitude"], [{ Ponto_ID: "x", Latitude: 1 }], "matriz-treino")));
  it("inv3 Campos_Estimados inconsistente", () => log("C3.inv3.invalido(Campos_Estimados='')", viol(["Campos_Estimados", "Elevacao_m", "Elevacao_m_Origem"], [{ Campos_Estimados: "", Elevacao_m: 1, Elevacao_m_Origem: "modelado" }], "planilha")));
  it("inv4 sem PRODUCT_ID", () => log("C3.inv4.invalido(Rastreio_Cenas vazio, origem satelite)", viol(["Elevacao_m_Origem", "Rastreio_Cenas", "Rastreio_Versao_Motor"], [{ Elevacao_m_Origem: "medido", Rastreio_Cenas: "", Rastreio_Versao_Motor: "" }], "planilha")));
  it("inv5 negativa fundiaria", () => { log("C3.inv5.invalido(motivo contem 'erro')", viol(["CAR_Status", "Motivo_Acesso"], [{ CAR_Status: "sem-correspondencia", Motivo_Acesso: "erro de rede" }], "campo-cego")); log("C3.inv5.variante(motivo 'servico indisponivel')", viol(["CAR_Status", "Motivo_Acesso"], [{ CAR_Status: "sem-correspondencia", Motivo_Acesso: "servico indisponivel" }], "campo-cego")); log("C3.inv5.variante(coluna Status_Fundiario do campo-cego)", viol(["Status_Fundiario", "Motivo_Acesso"], [{ Status_Fundiario: "sem-correspondencia", Motivo_Acesso: "erro de rede" }], "campo-cego")); });
  it("inv6 literal geografico", () => { log("C3.inv6.invalido(Municipio=Custom)", viol(base, [{ Municipio: "Custom", Bacia_Hidrografica: "x" }], "planilha")); log("C3.inv6.variante(Municipio='PR')", viol(base, [{ Municipio: "PR", Bacia_Hidrografica: "x" }], "planilha")); });
  it("inv7 constante", () => {
    const mkc = (n: number) => Array.from({ length: n }, () => ({ Elevacao_m: 7 }));
    log("C3.inv7.21_identicos", viol(["Elevacao_m"], mkc(21), "planilha")); log("C3.inv7.20_identicos(limite)", viol(["Elevacao_m"], mkc(20), "planilha"));
    log("C3.inv7.coluna_string_constante(Rotulo_Classe x30)", viol(["Rotulo_Classe"], Array.from({ length: 30 }, () => ({ Rotulo_Classe: "ausente" })), "matriz-treino"));
    log("C3.inv7.Classe_Alvo_Binaria constante x30 (matriz-treino)", viol(["Classe_Alvo_Binaria"], Array.from({ length: 30 }, () => ({ Classe_Alvo_Binaria: 1 })), "matriz-treino"));
  });
  it("kappa<0.60 bloqueia algo?", () => {
    const pares = [["erosao", "erosao"], ["erosao", "ausente"], ["ausente", "erosao"], ["ausente", "ausente"], ["erosao", "ausente"], ["ausente", "erosao"]].map(([a, b], i) => ({ pontoId: `p${i}`, classeObs1: a, classeObs2: b, rotuloA: a, rotuloB: b } as any));
    try { const r: any = calcularKappaCohen(pares as any, ["erosao", "ausente"] as any); log("C3.kappa.resultado", { kappa: r.kappa, operacional: r.operacional, alerta: String(r.alertaBloqueante).slice(0, 60) }); } catch (e: any) { log("C3.kappa.erro_chamada", String(e.message).slice(0, 200)); }
  });
  it("guarda sintetico: nome SINTETICO_ nao e detectado", () => {
    const a = mk(9, "A"); log("C3.guarda.ponto_nome_SINTETICO_TESTE (origemSintetica=false)", (() => { try { assegurarApenasPontosReais([a]); return "PASSOU (nao detectado)"; } catch (e: any) { return "BARRADO"; } })());
    const b = mk(9, "A", { origemSintetica: true }); log("C3.guarda.origemSintetica=true", (() => { try { assegurarApenasPontosReais([b]); return "PASSOU"; } catch { return "BARRADO"; } })());
    const c = mk(9, "A", { id: "TEST-9", codigo: "TEST-9" }); log("C3.guarda.prefixo_TEST-", (() => { try { assegurarApenasPontosReais([c]); return "PASSOU"; } catch { return "BARRADO"; } })());
    try { gerarCsvCientifico([b], "planilha"); log("C3.export_com_origemSintetica=true", "EXPORTOU"); } catch (e: any) { log("C3.export_com_origemSintetica=true", "RECUSADO"); }
  });
  it("LGPD: titular em claro no ponto", () => {
    const f = { status: "encontrado", motivo: null, consultadoEm: "2000-01-01", criterioAssociacao: null, codigoCar: "SINTETICO_TESTE_ENCANAMENTO", titularMascarado: "NOME_EM_CLARO SINTETICO_TESTE_ENCANAMENTO", documentoMascarado: "123.456.789-00", registroIncra: null, areaImovelHa: 12.5, bases: { uf: "PR" } };
    const p = mk(7, "A", { fundiario: f });
    for (const perfil of ["planilha", "campo-cego", "voo-cego", "interpretacao-cega", "matriz-treino"] as const) {
      try { const l = extrairLinhasPorPerfil([p], perfil, { [p.codigo]: rot("ausente") } as any); const s = JSON.stringify(l); log(`C3.lgpd.${perfil}`, { titular_em_claro_exportado: s.includes("NOME_EM_CLARO"), cpf_exportado: s.includes("123.456.789-00"), area_imovel: /12\.5/.test(s) }); } catch (e: any) { log(`C3.lgpd.${perfil}`, "RECUSADO " + String(e.message).slice(0, 100)); }
    }
  });
});

describe("C4/C6 montagem", () => {
  it("rotulo 'Sem erosao' direto em montarMatrizTreino", () => {
    const p = [mk(1, "A")]; const r = montarMatrizTreino(p, { [p[0].codigo]: rot("Sem erosão") } as any, { modeloJanela: "D" });
    log("C4.montagem.'Sem erosão' => classeAlvoBinaria", r.linhas[0]?.classeAlvoBinaria);
    const r2 = montarMatrizTreino(p, { [p[0].codigo]: rot("indeterminado") } as any, { modeloJanela: "D" }); log("C4.montagem.'indeterminado' => classeAlvoBinaria", r2.linhas[0]?.classeAlvoBinaria);
  });
  it("drone vai a held-out, fora do treino", () => {
    const p = [mk(1, "A"), mk(2, "B")]; const r = montarMatrizTreino(p, { [p[0].codigo]: rot("severa", "drone"), [p[1].codigo]: rot("ausente", "campo") } as any, { modeloJanela: "D" });
    log("C6.montagem.drone", { treino: r.linhas.length, heldOut: r.heldOutDrone.length });
  });
  it("bloco ausente", () => { const p = [mk(1, null as any)]; const r = montarMatrizTreino(p, { [p[0].codigo]: rot("severa") } as any, { modeloJanela: "D" }); log("C4.bloco_null=>", r.linhas[0]?.blocoEspacial); });
  it("alvo continuo D26 usado?", () => { const p = [mk(1, "A")]; const rr: any = rot("severa"); rr.final.fracaoErodida = 0.4; const r: any = montarMatrizTreino(p, { [p[0].codigo]: rr } as any, { modeloJanela: "D" }); log("C6.fracaoErodida_na_linha", Object.keys(r.linhas[0]).filter(k => /fracao|alvo/i.test(k))); });
});
```

Sonda do Kappa (`SINTETICO_TESTE_ENCANAMENTO_k.probe.test.ts`):

```ts
// SINTETICO_TESTE_ENCANAMENTO — sonda Kappa. Pares artificiais; NAO e evidencia cientifica.
import { it } from "vitest";
import { calcularKappaCohen } from "@/lib/rotulos/concordancia";
it("kappa", () => {
  const pares = [["erosao","erosao"],["erosao","ausente"],["ausente","erosao"],["ausente","ausente"],["erosao","ausente"],["ausente","erosao"]].map(([a,b]) => ({ observador1: a, observador2: b }));
  const r: any = calcularKappaCohen(pares, ["erosao","ausente"]);
  console.log("PROBE|C3.kappa|" + JSON.stringify({ kappa: r.kappa, operacional: r.operacional, alertaBloqueante: String(r.alertaBloqueante).slice(0,70) }));
});
```

## Apêndice B. Sonda da guarda de `scripts/` (A06): `guarda_probe.mjs`

Copia o texto de `padroesProibidos.test.ts` entre `const REGEX_PADROES` e `export function listarArquivosCodigo` e avalia `varrerCodigo` em 4 linhas.

```js
// SINTETICO_TESTE_ENCANAMENTO: sonda das guardas; extrai REGEX/lógica via cópia verbatim do arquivo de teste
import fs from "fs";
const src = fs.readFileSync("src/lib/seguranca/padroesProibidos.test.ts","utf8");
const ini = src.indexOf("const REGEX_PADROES"); const fim = src.indexOf("export function listarArquivosCodigo");
let code = src.slice(ini, fim).replace(/export /g,"").replace(/: ViolacaoPadrao\[\]/g,"").replace(/: string/g,"").replace(/: number/g,"").replace(/const violacoes\s*=\s*\[\]/,"const violacoes = []");
code = code.replace(/\(linha, numeroLinha, arquivo\)/,"(linha, numeroLinha, arquivo)");
const fn = new Function(code.replace(/function varrerLinha\(linha[^)]*\)/,"function varrerLinha(linha, numeroLinha, arquivo)").replace(/function varrerCodigo\(codigo[^)]*\)/,"function varrerCodigo(codigo, nomeArquivo)").replace(/\(linha, idx\)/,"(linha, idx)") + "; return {varrerCodigo};");
const {varrerCodigo} = fn();
const casos = {
 "A) linha real do script, SEM comentario": "bsi_spd = float(np.random.uniform(-0.25, -0.02))",
 "B) mesma linha + comentario arbitrario >=20 chars": "# permitido: qualquer texto com mais de vinte letras\nbsi_spd = float(np.random.uniform(-0.25, -0.02))",
 "C) nome de variavel fora do padrao (x), SEM comentario": "x = np.random.uniform(-0.25, -0.02)",
 "D) atribuicao em dict literal, SEM comentario": "reg = {'ndvi': float(np.random.uniform(0.68, 0.88))}",
};
for (const [k,v] of Object.entries(casos)) console.log(k, "=> violacoes:", varrerCodigo(v,"x.py").length);
```

Saída:

```
A) linha real do script, SEM comentario => violacoes: 1
B) mesma linha + comentario arbitrario >=20 chars => violacoes: 0
C) nome de variavel fora do padrao (x), SEM comentario => violacoes: 0
D) atribuicao em dict literal, SEM comentario => violacoes: 0
```

## Apêndice C. Comparação de estados `decisoes.ts` × `DECISOES.md` (A11)

```python
import re
ts=open('src/config/decisoes.ts',encoding='utf8').read()
parts=re.split(r'\n  ([DP]\d+[a-z]?): \{\n',ts)
ts_est={}
for i in range(1,len(parts),2):
    k=parts[i]; b=parts[i+1].split('\n  },')[0]
    est=re.search(r'estado:\s*"([^"]+)"',b); ts_est[k]=est.group(1) if est else '?'
md=open('docs/planejamento/DECISOES.md',encoding='utf8').read()
md_est={}
for l in md.split('\n'):
    m=re.match(r'\|\s*\*\*([DP]\d+[a-z]?)\*\*\s*\|[^|]*\|\s*([^|]+)\|',l)
    if m:
        s=m.group(2).strip(); md_est[m.group(1)]='decidida' if 'Decidida' in s else ('proposta' if 'Proposta' in s else ('pendente' if 'Pendente' in s else s))
for k in sorted(set(ts_est)|set(md_est)):
    t=ts_est.get(k); m=md_est.get(k)
    if k.startswith('D') and ((t and m and t!=m) or (t and not m) or (m and not t)): print(k,'TS=',t,'MD=',m)
```

Saída (só decisões D): D05, D07, D08, D12, D13, D15, D17, D18, D19 com `TS= decidida  MD= proposta`; D20 a D26 com `TS= decidida  MD= None`.

## Apêndice D. Saída bruta da sonda (linhas `PROBE|`, truncadas a 700 caracteres)

```
PROBE|C2.planilha.n_linhas|4
PROBE|C2.planilha.colunas|["Ponto_ID","Codigo","Latitude","Longitude","Latitude_DMS","Longitude_DMS","Municipio","Municipio_Origem","Codigo_IBGE","Codigo_IBGE_Origem","Bacia_Hidrografica","Bacia_Hidrografica_Origem","Bloco_Espacial","Estrato_ID","Elevacao_m","Elevacao_m_Origem","Declividade_pct","Declividade_pct_Origem","Declividade_graus","Declividade_graus_Origem","Curvatura_Perfil","Curvatura_Perfil_Origem","Curvatura_Plana","Curvatura_Plana_Origem","Acumulo_Fluxo","Acumulo_Fluxo_Origem","TWI","TWI_Origem","Ordem_Solo","Ordem_Solo_Origem","Subordem_Solo","Subordem_Solo_Origem","Grande_Grupo_Solo","Grande_Grupo_Solo_Origem","Tipo_Unidade_Solo","Tipo_Unidade_Solo_Origem","Confianca_Pedologi
PROBE|C2.planilha.csv_primeiras_linhas|["﻿# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar","# Emissão: 2026-10-05T23:31:42.134Z","# Total de registros recebidos: 4 | Emitidos no perfil: 4"]
PROBE|C2.interpretacao-cega.n_linhas|4
PROBE|C2.interpretacao-cega.colunas|["Codigo","Latitude","Longitude","Janela_Inicio","Janela_Fim","Referencia_Cena_Tile"]
PROBE|C2.interpretacao-cega.csv_primeiras_linhas|["﻿# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar","# Emissão: 2026-10-05T23:31:42.136Z","# Total de registros recebidos: 4 | Emitidos no perfil: 4"]
PROBE|C2.campo-cego.n_linhas|4
PROBE|C2.campo-cego.colunas|["Codigo","Latitude","Longitude","Latitude_DMS","Longitude_DMS","Municipio","Status_Fundiario","Motivo_Acesso","Codigo_CAR","Titular_Mascarado","Rota_Acesso"]
PROBE|C2.campo-cego.csv_primeiras_linhas|["﻿# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar","# Emissão: 2026-10-05T23:31:42.136Z","# Total de registros recebidos: 4 | Emitidos no perfil: 4"]
PROBE|C2.voo-cego.n_linhas|4
PROBE|C2.voo-cego.colunas|["Codigo","Latitude","Longitude","Area_Voo_Poligono"]
PROBE|C2.voo-cego.csv_primeiras_linhas|["﻿# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar","# Emissão: 2026-10-05T23:31:42.137Z","# Total de registros recebidos: 4 | Emitidos no perfil: 4"]
PROBE|C2.matriz-treino.n_linhas|4
PROBE|C2.matriz-treino.colunas|["Ponto_ID","Bloco_Espacial","Elevacao_m","Declividade_pct","Declividade_graus","Curvatura_Perfil","Curvatura_Plana","Acumulo_Fluxo","TWI","Ordem_Solo","Subordem_Solo","Grande_Grupo_Solo","Erodibilidade_Classe","Frequencia_Solo_Nu","Banda_B2","Banda_B4","Banda_B8","Banda_B12","NDVI","BSI","RUSLE_Fator_K","RUSLE_Fator_R","Precip_Acum_30d_mm","Precip_Acum_90d_mm","I30_Max_mm_h","N_Eventos_Erosivos","Indice_Mecanismo","Classe_Alvo_Binaria","Rotulo_Classe","Rotulo_Modalidade"]
PROBE|C2.matriz-treino.csv_primeiras_linhas|["﻿# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar","# Emissão: 2026-10-05T23:31:42.138Z","# Total de registros recebidos: 4 | Emitidos no perfil: 4"]
PROBE|C2.xlsx.bytes|19536
PROBE|C3.inv1.invalido(perda sem fatores)|["inv1"]
PROBE|C3.inv2.invalido(Latitude em matriz-treino)|["inv2"]
PROBE|C3.inv3.invalido(Campos_Estimados='')|[]
PROBE|C3.inv4.invalido(Rastreio_Cenas vazio, origem satelite)|[]
PROBE|C3.inv5.invalido(motivo contem 'erro')|["inv2","inv5"]
PROBE|C3.inv5.variante(motivo 'servico indisponivel')|["inv2"]
PROBE|C3.inv5.variante(coluna Status_Fundiario do campo-cego)|[]
PROBE|C3.inv6.invalido(Municipio=Custom)|["inv6"]
PROBE|C3.inv6.variante(Municipio='PR')|[]
PROBE|C3.inv7.21_identicos|["inv7"]
PROBE|C3.inv7.20_identicos(limite)|[]
PROBE|C3.inv7.coluna_string_constante(Rotulo_Classe x30)|[]
PROBE|C3.inv7.Classe_Alvo_Binaria constante x30 (matriz-treino)|["inv7"]
PROBE|C3.kappa.resultado|{"kappa":1,"operacional":true,"alerta":"undefined"}
PROBE|C3.guarda.ponto_nome_SINTETICO_TESTE (origemSintetica=false)|PASSOU (nao detectado)
PROBE|C3.guarda.origemSintetica=true|BARRADO
PROBE|C3.guarda.prefixo_TEST-|BARRADO
PROBE|C3.export_com_origemSintetica=true|RECUSADO
PROBE|C3.lgpd.planilha|{"titular_em_claro_exportado":true,"cpf_exportado":true,"area_imovel":true}
PROBE|C3.lgpd.campo-cego|{"titular_em_claro_exportado":true,"cpf_exportado":false,"area_imovel":false}
PROBE|C3.lgpd.voo-cego|{"titular_em_claro_exportado":false,"cpf_exportado":false,"area_imovel":true}
PROBE|C3.lgpd.interpretacao-cega|{"titular_em_claro_exportado":false,"cpf_exportado":false,"area_imovel":false}
PROBE|C3.lgpd.matriz-treino|{"titular_em_claro_exportado":false,"cpf_exportado":false,"area_imovel":false}
PROBE|C4.montagem.'Sem erosão' => classeAlvoBinaria|1
PROBE|C4.montagem.'indeterminado' => classeAlvoBinaria|0
PROBE|C6.montagem.drone|{"treino":1,"heldOut":1}
PROBE|C4.bloco_null=>|BLOCO_INDEFINIDO
PROBE|C6.fracaoErodida_na_linha|["classeAlvoBinaria"]
```

O CSV do app tem, antes do cabeçalho, linhas `# SAREL...` (`csv.ts:44-52`): `PROBE|C2.<perfil>.csv_primeiras_linhas` mostra as 3 primeiras. Saída do trainer (A28), resumida: `ParserError: Error tokenizing data. C error: Expected 1 fields in line 6, saw 8` com o CSV; com o XLSX, `[FEATURES] 13 preditores ...` e `INICIANDO SPATIAL K-FOLD ... (LOCO - K=4)` (4 folds de 1 amostra, `AUC: nan`).

## Apêndice E. Config do vitest usado para as sondas (fora do repositório)

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  root: "/home/user/localizador-erosao-v02",
  resolve: { alias: { "@": "/home/user/localizador-erosao-v02/src" } },
  server: { fs: { strict: false } },
  test: { environment: "node", include: ["/tmp/claude-0/-home-user-localizador-erosao-v02/4dadb7a8-6091-5cc0-a607-2333b2f57b00/scratchpad/SINTETICO_TESTE_ENCANAMENTO_tmp/*.probe.test.ts"], reporters: ["verbose"] },
});
```

O diretório de teste tinha um *symlink* `node_modules` apontando para o do repositório, para o `vitest` ser resolvido; foi removido (`unlink`) antes do `rm -rf`.
