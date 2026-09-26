# Verificação Formal — Eliminação do Alvo Supervisionado Circular no Script de Treino, Bloco LOCO Fabricado e Fila Remanescente

- **Data de execução:** 2026-09-26
- **Branch:** `sarel/v2`
- **Governa:** `docs/design.md` (Regras Invioláveis 1, 2, 3, 4, 5, 6, 8 e 9; Invariantes 1 e 2)
- **Escopo:** `docs/planejamento/PROMPT_CORRECAO_ALVO_TREINO_E_FILA_2026-09-26.md` + Ajustes 1 e 2 (T1 a T7 e T9)

---

## 1. Tabela de Proveniência do Alvo Supervisionado ($y$) nos Dois Caminhos

| Caminho de Exportação / Treinamento | Antes da Correção | Depois da Correção (Commits `396c50e`..`28b78e5`) | Variáveis Proibidas de Produzir $y$ (Regra 4 & Invariante 1) |
| :--- | :--- | :--- | :--- |
| **Caminho A — Pacote de Reprodutibilidade** (`src/lib/export/pacoteReprodutibilidade.ts` Arquivo 01 via `montarMatrizTreino` $\to$ Arquivo 05 `05_Script_Reprodutivel_XGBoost_LOCO.py`) | Corrigido na etapa anterior (`4ae6d3c`, `e66d3a9`), porém o Arquivo 04 (`04_Datasheet_Gebru_Metadados_Cientificos.json`) declarava `pontos.length` (ex.: `10`) em vez de `linhasTreino.length` (ex.: `2`), divergindo do Arquivo 01 (**D0**). | `gerarJsonDatasheetMetadados(totalAmostrasRecebidas, totalAmostrasTreinamento)` declara `totalAmostrasTreinamento = resMatriz.linhas.length` (idêntico ao `N` do Arquivo 01) e documenta `amostrasExcluidasOuSemRotulo = N_total - N_treino` (**T1**, commit `396c50e`). | `classeAmostral`, `phiDiag`, `nivelK`, `tercilS`, `tercilE`, `estratoId`, `Tipologia_Feicao`, constantes `0`/`1`, ou linhas de template Kobo não editadas (**T9**). |
| **Caminho B — Exportação de Planilha / CSV** (`src/lib/export/planilha.ts` `extrairLinhasPorPerfil("matriz-treino")` e `src/lib/export/csv.ts`) | Extraía todos os `pontos` sem filtrar por `rotulosConsolidados` e omitia a coluna de classe humana (`Rotulo_Classe` / `Classe_Alvo_Binaria`), forçando `scripts/treinar_xgboost_loco.py` a cair nos fallbacks proibidos (**D5**). | Delega integralmente a `montarMatrizTreino(pontos, rotulosConsolidados, { modeloJanela })` + pós-condição `assegurarSegregacaoTreino`, exigindo `rotulosConsolidados` não vazio quando `pontos.length > 0` e emitindo `Rotulo_Classe`, `Classe_Alvo_Binaria`, `Rotulo_Modalidade`, `Rotulo_Observador`, `Rotulo_Data` e `Rotulo_Cego` (**T5**, commit `4383d76`). | Qualquer ponto sem rótulo humano consolidado (`final: null` ou ausente em `rotulosConsolidados`) ou com modalidade `"drone"` (`held-out`, D16). |
| **Caminho C — Script Avulso de Treinamento** (`scripts/treinar_xgboost_loco.py`) | 1. Aceitava `classeAmostral` como $y$ (`'erosao'` $\to 1$, demais $\to 0$), fabricando circularidade determinística $\text{RUSLE/GEE} \to \hat{S},\hat{E},K \to \text{classeAmostral} \to y$ (**D1**).<br>2. Aceitava heurística textual sobre `Tipologia_Feicao` (`'laminar' in t or 'sulco' in t or 'eros' in t`), onde `'sulco'` (erosão linear concentrada, fora do domínio da RUSLE — Wischmeier & Smith, 1978) e `"sem erosão"` (`'eros' in "sem erosão"` $\to$ `True`) viravam $y = 1$ (**Ajuste 1**).<br>3. Imputava `NaN` em $y$ com `.fillna(1)` (linha 239) e `.fillna(0)` (linhas 330, 431, 438, 441, 446, 452) (**D3**). | 1. Aceita exclusivamente coluna de rótulo humano explícito (`Classe_Alvo_Binaria`, `rotuloClasse` ou `Rotulo_Classe`) nos domínios positivos `{1, "1", "erosao", "erosão", "presente", "incipiente", "moderada", "severa"}` e negativos `{0, "0", "controle", "ausente", "spd"}`.<br>2. Aborta com `sys.exit(1)` citando a Regra 4 e `src/lib/matriz/montagem.ts:137-138` se `classeAmostral` ou `Tipologia_Feicao` estiverem presentes sem coluna de rótulo humano (**T2**, commit `207dca2`).<br>3. Zero `.fillna(...)` sobre `Classe_Alvo_Binaria`; descarta registros sem rótulo válido com contagem explícita e aborta se uma classe ficar com $< 2$ amostras (**T4**, commit `903805a`). | `classeAmostral`, `Tipologia_Feicao` (`'sulco'`, `'eros'`), `.fillna(1)`, `.fillna(0)`, e qualquer valor fora dos conjuntos explícitos `DOMINIO_POSITIVO_EXPLICITO` / `DOMINIO_NEGATIVO_EXPLICITO`. |

### Justificativa Científica da Remoção de `Tipologia_Feicao` (Ajuste 1)

1. **Incompatibilidade física entre erosão em sulcos (`'sulco'`) e erosão laminar (RUSLE):** A Equação Universal de Perda de Solo Revisada (Wischmeier & Smith, 1978; Renard et al., 1997) modela exclusivamente o destacamento e transporte por impacto de gotas (*interrill*) e escoamento superficial difuso em lâmina (*sheet/rill* incipiente), não abrangendo feições lineares concentradas de entalhe hidráulico profundo (sulcos estabelecidos, ravinas e voçorocas). Converter `'sulco' in t` em alvo positivo ($y = 1$) de erosão laminar contamina o treinamento supervisionado com outro processo geomorfológico.
2. **Defeito léxico determinístico (`'eros' in t`):** A expressão booleana `'eros' in str(t).lower()` avaliava como `True` para descrições negativas de controle tais como `"sem erosão"`, `"ausência de erosão"` ou `"erosão ausente"`, invertendo o rótulo negativo ($0$) para positivo ($1$).

---

## 2. Prova de Aborto de `scripts/treinar_xgboost_loco.py` (T2, T3 e T4)

Saídas literais produzidas pela execução real de `carregar_e_preparar_dados()` em `scripts/treinar_xgboost_loco.py`:

```text
=== CENARIO A: CSV apenas com classeAmostral (sem rotulo humano) ===
EXIT_CODE: 1
📋 Carregando matriz de feições de: C:\Users\lalfr\.gemini\antigravity\brain\30a23f57-b68b-47d6-92ea-7f50f5ccf2ed\scratch\cenario_a.csv
   [PROVENIÊNCIA DO ALVO SUPERVISIONADO (y)]
   • Origem do dataframe: C:\Users\lalfr\.gemini\antigravity\brain\30a23f57-b68b-47d6-92ea-7f50f5ccf2ed\scratch\cenario_a.csv
   • Total de registros carregados: 3
❌ ERRO METODOLÓGICO BLOQUEANTE (Regra 4 & Invariante 1 — Alvo Supervisionado Circular):
   Nenhuma coluna de rótulo humano consolidado ('Classe_Alvo_Binaria', 'rotuloClasse' ou 'Rotulo_Classe') foi encontrada no CSV.
   O arquivo contém 'classeAmostral'/'Tipologia_Feicao', mas a Regra 4 ('Nada Calculado Vira Rótulo') e
   src/lib/matriz/montagem.ts:137-138 proíbem terminantemente converter 'classeAmostral' (estratificação S^/E^/K)
   ou heurísticas textuais de 'Tipologia_Feicao' (ex.: 'sulco' ou 'eros' em 'sem erosão') em alvo supervisionado (y).
   Exporte a matriz de treino com rótulos humanos consolidados (Arquivo 01 ou perfil 'matriz-treino').

=== CENARIO B1: CSV com Rotulo_Classe contendo linhas NaN (descarte proporcional) ===
EXIT_CODE: 0, LEN_DF: 6
📋 Carregando matriz de feições de: C:\Users\lalfr\.gemini\antigravity\brain\30a23f57-b68b-47d6-92ea-7f50f5ccf2ed\scratch\cenario_b1.csv
   [PROVENIÊNCIA DO ALVO SUPERVISIONADO (y)]
   • Origem do dataframe: C:\Users\lalfr\.gemini\antigravity\brain\30a23f57-b68b-47d6-92ea-7f50f5ccf2ed\scratch\cenario_b1.csv
   • Total de registros carregados: 8
   • Coluna de rótulo humano utilizada: 'Rotulo_Classe'
   ⚠️ [REGRA 4 — DESCARTE DE REGISTROS SEM RÓTULO VÁLIDO]: 2 de 8 registro(s) descartado(s) por 'Rotulo_Classe' ausente/NaN ou fora do domínio válido (restaram 6 amostras rotuladas).
   • Contagem final por classe: Positivos (y=1) = 3 | Controles (y=0) = 3 | Descartados = 2
   ✅ Agrupamento espacial LOCO derivado da coluna 'Bloco_Espacial' (2 grupos válidos).

=== CENARIO B2: CSV com Rotulo_Classe onde uma classe tem < 2 amostras apos descarte ===
EXIT_CODE: 1
📋 Carregando matriz de feições de: C:\Users\lalfr\.gemini\antigravity\brain\30a23f57-b68b-47d6-92ea-7f50f5ccf2ed\scratch\cenario_b2.csv
   [PROVENIÊNCIA DO ALVO SUPERVISIONADO (y)]
   • Origem do dataframe: C:\Users\lalfr\.gemini\antigravity\brain\30a23f57-b68b-47d6-92ea-7f50f5ccf2ed\scratch\cenario_b2.csv
   • Total de registros carregados: 5
   • Coluna de rótulo humano utilizada: 'Rotulo_Classe'
   ⚠️ [REGRA 4 — DESCARTE DE REGISTROS SEM RÓTULO VÁLIDO]: 1 de 5 registro(s) descartado(s) por 'Rotulo_Classe' ausente/NaN ou fora do domínio válido (restaram 4 amostras rotuladas).
   • Contagem final por classe: Positivos (y=1) = 3 | Controles (y=0) = 1 | Descartados = 1
❌ ERRO METODOLÓGICO BLOQUEANTE (Regra 4): Quantidade insuficiente de amostras rotuladas por classe após descarte de não-rotulados (Positivos y=1: 3, Controles y=0: 1). São necessárias ao menos 2 amostras em cada classe.

=== CENARIO C1: CSV sem coluna de agrupamento espacial ===
EXIT_CODE: 1
📋 Carregando matriz de feições de: C:\Users\lalfr\.gemini\antigravity\brain\30a23f57-b68b-47d6-92ea-7f50f5ccf2ed\scratch\cenario_c1.csv
   [PROVENIÊNCIA DO ALVO SUPERVISIONADO (y)]
   • Origem do dataframe: C:\Users\lalfr\.gemini\antigravity\brain\30a23f57-b68b-47d6-92ea-7f50f5ccf2ed\scratch\cenario_c1.csv
   • Total de registros carregados: 4
   • Coluna de rótulo humano utilizada: 'Rotulo_Classe'
   • Contagem final por classe: Positivos (y=1) = 2 | Controles (y=0) = 2 | Descartados = 0
❌ ERRO METODOLÓGICO BLOQUEANTE (Regra 1 & Roberts et al., 2017):
   Nenhuma coluna de agrupamento espacial ('Bloco_Espacial', 'blocoEspacial', 'bacia', 'Bacia_Hidrografica')
   ou par de coordenadas ('Latitude'/'Longitude') foi encontrada no dataset.
   É proibido fabricar bloco espacial constante (ex.: 'Bacia do Rio Ivaí') para o GroupKFold LOCO.

=== CENARIO C2: CSV com K_LOCO = 1 grupo espacial ===
EXIT_CODE: 1
📋 Carregando matriz de feições de: C:\Users\lalfr\.gemini\antigravity\brain\30a23f57-b68b-47d6-92ea-7f50f5ccf2ed\scratch\cenario_c2.csv
   [PROVENIÊNCIA DO ALVO SUPERVISIONADO (y)]
   • Origem do dataframe: C:\Users\lalfr\.gemini\antigravity\brain\30a23f57-b68b-47d6-92ea-7f50f5ccf2ed\scratch\cenario_c2.csv
   • Total de registros carregados: 4
   • Coluna de rótulo humano utilizada: 'Rotulo_Classe'
   • Contagem final por classe: Positivos (y=1) = 2 | Controles (y=0) = 2 | Descartados = 0
   ✅ Agrupamento espacial LOCO derivado da coluna 'Bloco_Espacial' (1 grupos válidos).
❌ ERRO METODOLÓGICO BLOQUEANTE (Roberts et al., 2017 — Spatial Cross-Validation):
   Validação espacial LOCO (GroupKFold) requer pelo menos 2 grupos espaciais distintos,
   mas restaram apenas 1 grupo(s) válido(s): ['BLOCO_R01_C01'].
   É proibido degradar silenciosamente para KFold aleatório ou fabricar blocos espaciais.
```

Verificações estáticas em `scripts/`:
- `grep -n "Bacia do Rio Ivaí" scripts/` $\to$ **0 ocorrências**.
- `grep -nE "Classe_Alvo_Binaria.*fillna" scripts/treinar_xgboost_loco.py` $\to$ **0 ocorrências**.

---

## 3. Coerência Arquivo 01 ↔ Arquivo 04 no Pacote de Reprodutibilidade (T1)

O teste automatizado `"mantém igualdade estrita entre o número de linhas de dados do Arquivo 01 e totalAmostrasTreinamento do Arquivo 04 em rotulagem parcial (T1)"` em [`src/lib/export/pacoteReprodutibilidade.test.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/src/lib/export/pacoteReprodutibilidade.test.ts) constrói $10$ pontos elegíveis e $2$ rótulos humanos consolidados, comprovando que:
- `linhasDadosArquivo01.length === 2`
- `datasheet.composition.instancias_totais_no_dataset_de_treino === 2`
- `datasheet.composition.instancias_totais_recebidas_na_campanha === 10`
- `datasheet.composition.instancias_excluidas_ou_sem_rotulo_consolidado === 8`

---

## 4. Simetria `pacoteReprodutibilidade.ts` ↔ `planilha.ts` no Perfil `matriz-treino` (T5 / Q1)

Os testes em [`src/lib/export/planilha.test.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/src/lib/export/planilha.test.ts) comprovam:
1. Com $10$ pontos e $2$ rótulos consolidados (`1` `"erosao"` e `1` `"controle"`), `extrairLinhasPorPerfil(pontos, "matriz-treino", "D", rotulos)` retorna exatamente $2$ linhas com `Rotulo_Classe` (`"erosao"`, `"controle"`) e `Classe_Alvo_Binaria` (`1`, `0`), sem qualquer chave proibida (`latitude`, `longitude`, `phiDiag`, `estratoId`, `tercilS`, `tercilE`, `nivelK`, `bacia`, `municipio`, `codigoIbge`).
2. Chamada a `extrairLinhasPorPerfil(pontos, "matriz-treino", "D")` sem `rotulosConsolidados` ou com `{}` lança erro explícito (`Perfil 'matriz-treino' exige o mapa 'rotulosConsolidados' não vazio`), impedindo exportação silenciosamente vazia (Postura 9).
3. Pontos com modalidade `"drone"` (`held-out`) são estritamente segregados e nunca entram nas linhas emitidas.

---

## 5. Prova do Defeito D6.b no Inspetor e Correção do Template Kobo (T6 e T9)

### 5.1. Inspetor de Ponto (`src/components/inspetor/InspetorPonto.tsx:118` — D6.a / D6.b)

- **Antes da correção:** A expressão `rotulosConsolidados[ponto.id] ?? rotulosConsolidados[ponto.codigo]` indexava `rotulosConsolidados` pela chave errada (`ponto.id`, UUID) antes da chave canônica (`ponto.codigo`, ex.: `"P-01"`). Além disso, na linha 118, o fallback `(rotuloConsolidado as any)?.classe` lia uma propriedade inexistente em `RotuloConsolidado` (cuja estrutura é `{ final: Rotulo | null, origens, kappa, divergencia, papelConjunto }`), ou vazava rótulo caso um objeto legado possuísse `.classe` na raiz mesmo com `final: null` (`divergencia: "pendente"`).
- **Depois da correção (commit `bb7e192`):** Indexação direta e exclusiva por `rotulosConsolidados[ponto.codigo]` e leitura exclusiva de `rotuloConsolidado?.final?.classe ?? null`. Quando `final === null`, o badge renderiza `"Pendente / Divergência entre observadores"` sem exibir classe; quando `final` está presente, renderiza a classe consolidada (`"severa"`). Provado em [`src/components/inspetor/InspetorPonto.test.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/src/components/inspetor/InspetorPonto.test.ts).

### 5.2. Template Kobo CSV e Validação de Ingestão (`PainelCampanha.tsx`, `ingestaoKobo.ts`, `concordancia.ts` — T9)

- **Antes da correção:** `baixarTemplateKoboCsv` em `src/components/campanha/PainelCampanha.tsx:96-99` pré-preenchia `const classeSugestao = i % 2 === 0 ? "erosao" : "controle"`, `observador = Equipe_Campo_PPGTCA`, `data_observacao = hoje`, `confianca = alta` e `cego = true`. Qualquer linha não editada em campo e reimportada no CSV convertia um ponto jamais visitado em verdade terrestre de campo (`cego: true`) em `rotulosConsolidados`.
- **Depois da correção (commit `28b78e5`):**
  1. `baixarTemplateKoboCsv` emite `classe`, `observador`, `data_observacao`, `confianca` e `cego` vazios (`${p.codigo},,,,${p.latitude.toFixed(6)},${p.longitude.toFixed(6)},,`).
  2. `ingestarSubmissoesKobo` (`src/lib/rotulos/ingestaoKobo.ts`) rejeita imediatamente qualquer linha com `classe` vazia antes de instanciar `Rotulo`.
  3. `validarRotulo` (`src/lib/rotulos/concordancia.ts`) valida que `rotulo.classe` pertence estritamente a `CLASSES_ROTULO_VALIDAS` (`"erosao"`, `"erosão"`, `"presente"`, `"incipiente"`, `"moderada"`, `"severa"`, `"1"`, `"controle"`, `"ausente"`, `"spd"`, `"0"`), rejeitando sentinelas (`"PREENCHER_EM_CAMPO"`, `"indefinido"`, etc.). Provado em [`src/lib/rotulos/rotulos.test.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/src/lib/rotulos/rotulos.test.ts).

---

## 6. Fechamento da Fila Remanescente e Achados Registrados sem Execução

### 6.1. Ampliação do Varredor de Padrões Proibidos (Q2 — Commit `bb7e192`)
- `src/lib/seguranca/padroesProibidos.test.ts` percorre recursivamente `src/lib`, `src/app/api`, `src/store` e `src/config` para extensões `.ts` e `.tsx`, além de aplicar regra restrita sobre `src/components/**/*.{ts,tsx}` proibindo datas/códigos literais em fallbacks e `adquiridoEm` fora do GEE.
- As fabricações `Number(propriedadeOficial.areaHa) || 0` e `Number(propriedadeOficial.modFiscal) || 0` em `src/app/api/gee/select-candidates/route.ts:523-524` foram substituídas por conversão finita honesta (`Number.isFinite(...) ? Number(...) : null`).

### 6.2. Descarte de Candidatos Incompletos na Estratificação dos 18 Estratos (Q3 — Commit `bb7e192`)
- Em `src/app/api/gee/select-candidates/route.ts:449-475`, candidatos com falha em `medTerreno`, `medS2.frequenciaSoloNu` ou `convK` são descartados antes do cálculo dos tercis empíricos de $\hat{S}$ e $\hat{E}$ (`estratificarCandidatos`), evitando fabricar `frequenciaSoloNu = 0` ($E_1$) ou `nivelK = 1` ($K_1$).
- O efeito sobre o universo amostral é registrado em `diagnosticoAmostral.censoDescarteEstratificacao`:
  - `universoAntesDescarte`: total de pontos amostrados após o thinning espacial;
  - `descartadosSemTerreno`, `descartadosSemFrequenciaSoloNu`, `descartadosSemFatorK`, `totalDescartados`;
  - `universoEfetivoTercisSE`: tamanho do universo efetivo sobre o qual os tercis de $\hat{S}$ e $\hat{E}$ foram computados.

### 6.3. Diferimento Formal de Q4 (`ausente_no_json_de_entrada`)
- Conforme deliberação do usuário, a alternativa (ii) de Q4 (emitir chave com valor `null` e `"proveniencia": "ausente_no_json_de_entrada"` no JSON consolidado do Arquivo 03, preservando o contrato da Regra 3 para `nEventosErosivos` e `indiceMecanismo` sob D13 pendente) foi aprovada em princípio e **diferida para rodada própria após T7**.

### 6.4. Achados Registrados Sem Execução (Escopo Deliberado e Leitura Incidental)
1. **Relaxamento iterativo do raio de thinning espacial (`src/app/api/gee/select-candidates/route.ts:290` — Regra 2):** O laço `for (let tentativa = 0; tentativa < 5; tentativa++)` reduz `raioMetros` em 35% por iteração até o piso de `800` m (`raioMetros = Math.max(800, Math.floor(raioMetros * 0.65))`), abaixo da distância mínima configurada de `2000` m (`D11 = 2000 m`). Registrado sem alteração de código nesta rodada.
2. **`noUncheckedIndexedAccess` desabilitado em `tsconfig.json`:** `tsconfig.json` possui `"strict": true`, mas não ativa `"noUncheckedIndexedAccess": true`, fazendo com que acessos indexados `Record<string, T>[chave]` sejam tipados como `T` em vez de `T | undefined` em todo o projeto. Registrado sem alteração de código nesta rodada.
3. **Imputação de preditores ($X$) por mediana em `scripts/treinar_xgboost_loco.py:676-677, 748, 788` (Achado Incidental — Postura 6):** Enquanto o Arquivo 05 (`src/lib/export/pacoteReprodutibilidade.ts`) delega valores ausentes de $X$ ao algoritmo nativo *sparsity-aware split* do XGBoost (`missing=np.nan`, Chen & Guestrin, 2016), o script `scripts/treinar_xgboost_loco.py` ainda executa `X_train.fillna(mediana_treino)` no laço LOCO e `X.fillna(X.median())` no ajuste final/SHAP. Registrado para tratamento em rodada futura sem edição fora do escopo autorizado.

---

## 7. Saída Literal da Suíte de Testes e Compilação

### `npx vitest run`
```text
 RUN  v4.1.11 C:/Users/lalfr/Docs Fora do Ar/LUIS ALFREDO/01 - MESTRADO PPGTCA 2026/02 - PESQUISA EROSÃO LAMINAR/geolocalizacao-erosao-propriedade

 ✓ src/lib/seguranca/importacoes.test.ts (3 tests) 139ms
 ✓ src/lib/seguranca/verificacoes.test.ts (3 tests) 115ms
 ✓ src/lib/seguranca/padroesProibidos.test.ts (14 tests) 220ms
 ✓ src/lib/planet/planet.test.ts (15 tests) 43ms
 ✓ src/lib/export/pacoteReprodutibilidade.test.ts (14 tests) 117ms
 ✓ src/lib/export/planilha.test.ts (7 tests) 54ms
 ✓ src/lib/matriz/montagemTemporal.test.ts (3 tests) 34ms
 ✓ src/lib/embrapa/embrapaSoilClient.test.ts (19 tests) 25ms
 ✓ src/lib/chuva/chuva.test.ts (10 tests) 79ms
 ✓ src/lib/gee/compostoSoloNu.test.ts (4 tests) 26ms
 ✓ src/lib/gee/persistenciaTemporal.test.ts (4 tests) 32ms
 ✓ src/lib/rotulos/rotulos.test.ts (17 tests) 22ms
 ✓ src/lib/gee/auth.test.ts (3 tests) 52ms
 ✓ src/lib/jev/jevClient.test.ts (6 tests) 15ms
 ✓ src/lib/rusle/fatorK.test.ts (12 tests) 18ms
 ✓ src/lib/rusle/rusle.test.ts (12 tests) 17ms
 ✓ src/lib/padraoOuro/validacaoMatricial.test.ts (14 tests) 16ms
 ✓ src/components/inspetor/InspetorPonto.test.ts (2 tests) 24ms
 ✓ src/lib/gee/serieTemporal.test.ts (7 tests) 11ms
 ✓ src/config/decisoes.test.ts (5 tests) 13ms
 ✓ src/lib/gee/versaoMotor.test.ts (8 tests) 13ms
 ✓ src/lib/seguranca/localOnly.test.ts (6 tests) 45ms
 ✓ src/lib/gee/thinning.test.ts (6 tests) 12ms
 ✓ src/lib/localizacao/localizacao.test.ts (8 tests) 14ms
 ✓ src/lib/gee/estratificacao.test.ts (6 tests) 13ms
 ✓ src/lib/matriz/invariantes.test.ts (8 tests) 12ms
 ✓ src/lib/seguranca/sessaoEfemera.test.ts (4 tests) 10ms
 ✓ src/config/tourMetodologico.test.ts (2 tests) 14ms
 ✓ src/lib/gee/harmonicos.test.ts (3 tests) 12ms
 ✓ src/lib/gee/elegibilidade.test.ts (7 tests) 10ms
 ✓ src/lib/gee/terreno.test.ts (9 tests) 9ms
 ✓ src/lib/gee/blocosEspaciais.test.ts (5 tests) 10ms
 ✓ src/lib/export/dms.test.ts (3 tests) 6ms
 ✓ src/lib/seguranca/guardaSintetico.test.ts (3 tests) 9ms
 ✓ src/lib/gee/aoiTiling.test.ts (3 tests) 8ms
 ✓ src/store/useSarelStore.test.ts (2 tests) 9ms
 ✓ src/store/interfaceIntegration.test.ts (4 tests) 10ms
 ✓ src/lib/gee/amostragemBiofisica.test.ts (4 tests) 8ms
 ✓ src/lib/gee/estatisticasSerie.test.ts (4 tests) 7ms
 ✓ src/lib/fundiario/matcher.test.ts (14 tests) 8882ms

 Test Files  40 passed (40)
      Tests  283 passed (283)
```

### `npx tsc --noEmit`
```text
Exit code: 0 (sem erros de tipagem)
```

### `npm run build`
```text
> sarel@2.0.0 build
> next build

  ▲ Next.js 14.2.35
   Creating an optimized production build ...
 ✓ Compiled successfully
 ✓ Generating static pages (7/7)
```
