# Auditoria do SAREL v2 — Parte 2 de 2 (má interpretação e entrada do prompt de correção)

Auditoria, não correção. Nenhum arquivo do código, dos dados nem dos relatórios existentes foi editado. Os dois únicos arquivos novos são este relatório e `docs/planejamento/PROMPT_CORRECAO_POS_AUDITORIA_2026-10-05.md`.

**Legenda de evidência.** **[M]** medido: executei o comando nesta sessão e colei a saída. **[L]** lido: li o arquivo, sem executá-lo. **[S]** suposto: inferência minha, que o pesquisador deve conferir. Todo `arquivo:linha` foi conferido nesta sessão com `grep -n` ou `sed -n`; onde minha lembrança estava deslocada, usei a linha real.

**Gravidade** usa exatamente: *bloqueia a função* / *bloqueia a dissertação* / *precisa de decisão do pesquisador* / *induz má interpretação* / *cosmético*.

---

## 1. Commit auditado e conferência com a Parte 1

### 1.1 Estado base (Etapa 0) **[M]**

```
$ git status -sb        ->  ## claude/affectionate-galileo-8abtjo...origin/claude/affectionate-galileo-8abtjo
$ git log --oneline -5
1459000 docs(auditoria): relatorio da Parte 1 (funcao e hipoteses B1..B7, C1..C7)
5f7c033 docs(planejamento): prompts de auditoria honesta em duas partes
fd613e3 fix(pericial): saneamento N1, N2 e N3 - derivacao mecanica de vies, pisos contra falsos positivos e eliminacao de residuo
b84cda0 docs(planejamento): prompt do relatorio contraditorio e das guardas vacuas
4ed3825 docs(auditoria): registra a refutacao da minha hipotese sobre 2022
$ git rev-parse HEAD    ->  1459000a86eb64def9623b392fdad302f60d624e
```

- **HEAD auditado: `1459000a86eb64def9623b392fdad302f60d624e`.**
- **Commit declarado na Parte 1: `5f7c033fff918fa99783939d7a218ac9f4d5b582`** (`AUDITORIA_PARTE1...md:15`).
- O prompt manda parar quando o commit auditado na Parte 1 difere do HEAD. **Eles diferem**, então conferi o que mudou **[M]**:

```
$ git diff --name-status 5f7c033 HEAD
A	docs/auditorias/AUDITORIA_PARTE1_2026-10-05.md
$ git diff --stat 5f7c033 HEAD        ->  1 file changed, 966 insertions(+)
$ git diff --name-only fd613e3 HEAD | grep -v '^docs/' | wc -l   ->  0
```

A única diferença é o próprio relatório da Parte 1 (que só poderia estar nesta branch), e **nenhum arquivo fora de `docs/` mudou desde `fd613e3`**. Concluí que o código auditado é idêntico e **segui adiante**. Se você entende que a regra exigia parar nesse caso, trate toda esta Parte 2 como rascunho.

### 1.2 Ambiente **[M]**

`node v22.22.0`; `node_modules` com 457 pacotes (instalado na Parte 1); libs Python numpy 2.4.6, pandas 3.0.6, scikit-learn 1.9.1, xgboost 3.2.0, shap 0.51.0 (instaladas na Parte 1, versões diferentes de `requirements.txt`).

### 1.3 Achados da Parte 1 (A01..A30) com a gravidade que ela deu **[M]**

Extraídos por `grep` da tabela do arquivo da Parte 1:

| ID | Conclusão (Parte 1) | Gravidade (Parte 1) |
|---|---|---|
| A01 | CONFIRMADO | bloqueia a função |
| A02 | CONFIRMADO | induz má interpretação |
| A03 | CONFIRMADO | cosmético |
| A04 | PARCIAL | precisa de decisão do pesquisador |
| A05 | PARCIAL | induz má interpretação |
| A06 | CONFIRMADO | bloqueia a dissertação |
| A07 | CONFIRMADO | induz má interpretação |
| A08 | CONFIRMADO | induz má interpretação |
| A09 | CONFIRMADO | induz má interpretação |
| A10 | REFUTADO | cosmético |
| A11 | CONFIRMADO | induz má interpretação |
| A12 | CONFIRMADO | induz má interpretação |
| A13 | PARCIAL | precisa de decisão do pesquisador |
| A14 | CONFIRMADO | precisa de decisão do pesquisador |
| A15 | CONFIRMADO | bloqueia a dissertação |
| A16 | CONFIRMADO | bloqueia a dissertação |
| A17 | PARCIAL | precisa de decisão do pesquisador |
| A18 | CONFIRMADO | induz má interpretação |
| A19 | REFUTADO (CPF/CNPJ) / PARCIAL (CAR) | precisa de decisão do pesquisador |
| A20 | CONFIRMADO | bloqueia a função |
| A21 | REFUTADO (nos padrões buscados) | cosmético |
| A22 | CONFIRMADO | bloqueia a função |
| A23 | CONFIRMADO | induz má interpretação |
| A24 | CONFIRMADO | bloqueia a função |
| A25 | CONFIRMADO | bloqueia a função |
| A26 | CONFIRMADO | bloqueia a dissertação |
| A27 | CONFIRMADO | bloqueia a função |
| A28 | PARCIAL | bloqueia a função |
| A29 | CONFIRMADO | bloqueia a dissertação |
| A30 | CONFIRMADO | induz má interpretação |

---

## 2. Bloco D (D1..D8): conclusões, evidências, gravidade

Identificadores novos **A31..A54**. **Último usado: A54.**

### Quadro-resumo

| ID | Bloco | Indício | Conclusão | Gravidade |
|---|---|---|---|---|
| A31 | D1 | Planos `.plan` sintéticos sem marca dentro do arquivo | **CONFIRMADO** | induz má interpretação (risco operacional alto) |
| A32 | D2 | `classeAmostral` (limiar de BSI/NDVI) mostrada como "Erosão Laminar (Classe 1)" | **CONFIRMADO** | induz má interpretação |
| A33 | D2/D3 | "Macrobacia IAT" atribuída por retângulos quando o ponto cai fora dos polígonos simplificados | **PARCIAL** | induz má interpretação |
| A34 | D2 | `fonte: "COPERNICUS/DEM/GLO30 (EPSG:31982)"` | **PARCIAL** | cosmético |
| A35 | D3/D4 | Janela e máscara de nuvem da extração GEE ≠ comentário e ≠ D05 | **CONFIRMADO** | bloqueia a dissertação |
| A36 | D3 | Textos de interface, manual, LEIA-ME e comentário da rota defasados | **CONFIRMADO** | induz má interpretação |
| A37 | D4 | UI segue D16 emendada; `montagem.ts` e `sitiosReferencia.ts` seguem a regra antiga | **CONFIRMADO** | precisa de decisão do pesquisador |
| A38 | D4 | Linha de base RUSLE (competidor de D25) nunca é calculada no fluxo do app | **CONFIRMADO** | bloqueia a dissertação |
| A39 | D5 | Ingestão fundiária troca erro/ausência por valor-padrão (`100.0`, `0.0`, `0`, `[]`, `None`) | **CONFIRMADO** | induz má interpretação |
| A40 | D5 | `inspect-point` engole falhas de consulta e responde `ok: true` | **CONFIRMADO** | induz má interpretação |
| A41 | D7/D2 | Metadados do rótulo por padrão: `observadoEm` = data do clique (UTC) no Inspetor; na Coletor também `observador` e `confianca = "alta"` | **CONFIRMADO** | induz má interpretação |
| A42 | D7 | Datas de consulta em UTC (`toISOString().split("T")[0]`): 18 ocorrências | **CONFIRMADO** | induz má interpretação |
| A43 | D7 | NDVI/BSI sem validação de faixa em `classificarPontoEspectral` | **CONFIRMADO** | induz má interpretação |
| A44 | D7 | CRS fixo EPSG:31982; distorção medida só na BP3 | **NÃO VERIFICADO** | induz má interpretação (provisória) |
| A45 | D8 | PDFs/PPTX duplicados com versões diferentes; `docs/relatorios/` guarda a versão antiga | **CONFIRMADO** | induz má interpretação |
| A46 | D8 | Três lógicas de treino diferentes (CLI, pacote ZIP, dry-run) | **CONFIRMADO** | precisa de decisão do pesquisador |
| A47 | D8 | `calcularKappaCohen` ×3 e `calcularCorrelacaoPearson` ×2 | **CONFIRMADO** | cosmético |
| A48 | D6 | `Instalador_SAREL.exe` (2,18 MB) versionado | **NÃO VERIFICADO** | induz má interpretação (provisória) |
| A49 | D6 | `docs/Plano de voo exemplo/*.plan` sem marca de exemplo | **NÃO VERIFICADO** | induz má interpretação (provisória) |
| A50 | D5 | Testes que só verificam "não lançou" | **REFUTADO** | — |
| A51 | D6 | Estado padrão da flag de dry-run | **REFUTADO** | — |
| A52 | D7 | Mistura de % e graus na declividade | **REFUTADO** | — |
| A53 | D1 | Resultados de `docs/verificacoes/` sem selo de natureza | **REFUTADO** | — |
| A54 | D6 | `--dados` padrão do trainer aponta para planilha que a auditoria interna do projeto classificou como inválida; o relatório de dry-run não registra o arquivo de entrada | **CONFIRMADO** (uso no dry-run: corroborado, não medido) | induz má interpretação |

---

### D1. Resultado que parece achado e é artefato

Inventário **[M]**: `git ls-files docs/relatorios docs/verificacoes docs/figuras_manual docs/images "docs/Plano de voo exemplo"`, e para cada arquivo textual a busca de marca (`SINTETICO`, `dry-run`, `sintético`, `demonstra`, `simulad`, `mock`, `NAO_VOAR`) no **nome** e no **conteúdo**.

**(a) `docs/relatorios/modelagem/` (o dry-run).** O selo existe em dois lugares e falta em dois: o JSON traz `natureza_execucao = BENCHMARK_INFRAESTRUTURA_DRY_RUN` e `dados_100pct_empiricos = false` (marca no conteúdo = 2); cada PNG traz o banner vermelho `[AVISO: BENCHMARK DE INFRAESTRUTURA - DADOS NÃO EMPÍRICOS]` (abertos na Parte 1). **Nenhum nome de arquivo nem o nome da pasta** (`docs/relatorios/modelagem/`, `curva_roc_loco.png`, `relatorio_modelagem_xgboost_loco.json`) diz "dry-run". Quem só vê a lista de arquivos, ou copia o PNG para outro lugar, vê um resultado normal; quem vê o PNG vê o banner; quem vê só o JSON vê o campo. **PARCIAL** (já registrado como A05). O estado padrão do script reforça o problema: `--saida` tem `default=docs/relatorios/modelagem` (`treinar_xgboost_loco.py:885`), então um dry-run novo cairia na pasta de resultados (A05, correção "saída do dry-run").

**(b) `docs/figuras_manual/tela1..5_*.png`.** `scripts/gerar_manual_pdf.py:69` documenta que são "5 telas demonstrativas esquemáticas", e o código desenha séries "simuladas" (`:185`, `:198`). Nenhuma das cinco traz, desenhado, o texto "esquemático/ilustrativo/simulado" (`grep -nE "(ax|fig|plt)\.(text|suptitle|title)\(.*(esquem|ilustr|simul|demonstr|exemplo|fict)"` → vazio **[M]**). Os nomes (`tela1_triagem_mapa3d.png`) sugerem captura de tela. `tela5_xgboost_decisoes.png` (aberto na Parte 1) mostra "Acurácia Global: 89.3%", "ROC-AUC Global: 0.924", barras SHAP e `D02 ... Decidida (>= 500 m)` inventados. **Exposição atual:** o `Manual_Instalacao_e_Operacao_SAREL.pdf` usa os 7 screenshots reais de `docs/images/` e não as `tela*` **[M]**: comparei pixel a pixel as 16 imagens extraídas do PDF com `docs/images/*.png` e `docs/figuras_manual/*.png`; **8 coincidências, todas em `docs/images/`**, nenhuma em `figuras_manual/`. **CONFIRMADO** (A07 mantido, escopo ampliado de `tela5` para as cinco figuras).

**(c) `docs/images/*.png`.** São screenshots reais da interface. Abri `05-Matriz-de-treino.png` (matriz vazia, "Matriz de Treino Vazia") e `04-Central-de-campanha.png` (sítios com 49,94 e 49,54 ha, "GSD 7.5 cm"). Não mostram resultado numérico de modelo. O texto da `04` está **defasado** em relação à interface atual (A36).

**(d) `docs/verificacoes/voo_ncontrol/*.plan` — A31.** **[M]**

```
SINTETICO_NAO_VOAR_jornada_01_altfixa.plan:       fileType: Plan | groundStation: QGroundControl | 'SINTETICO'/'NAO_VOAR' no texto: False
SINTETICO_NAO_VOAR_jornada_01_terrainfollow.plan: fileType: Plan | groundStation: QGroundControl | 'SINTETICO'/'NAO_VOAR' no texto: False
   items: 8 | plannedHomePosition: [-24.75, -53.72, 92.76]
```

O aviso existe **só no nome** do arquivo e no `LEIA-ME_NAO_VOAR.md`. O JSON interno é um `.plan` válido do QGroundControl, sem nenhum marcador. O próprio LEIA-ME diz que são "indistinguíveis de um plano real ao abrir" e que as altitudes vêm de `380.0 + Math.sin(lat * 120.0) * 35.0 + Math.cos(lon * 120.0) * 25.0` (`LEIA-ME_NAO_VOAR.md`, trecho sobre altitudes sintéticas). Basta renomear ou copiar o arquivo para o aviso desaparecer. O risco é operacional (voo com altitudes que não vêm de DEM real). **CONFIRMADO.** **Gravidade: induz má interpretação (risco operacional alto).**

**(e) Demais arquivos de `docs/verificacoes/` — A53 (REFUTADO).** Os `.md` gerados trazem a natureza no nome ou no cabeçalho (`..._FABRICACAO_frequencia_solo_nu.md`, `calculadora/2026-09-30_simulacao_desenho_d16_224m.md`, `..._relatorio_fase_gerado.md`). `legado_climatologia_chirps_bp3_2022.json` tem as chaves `status` e `notaLegado`. Os JSON da Embrapa e do IBGE são capturas de API com `fonte` e `dataVerificacao`. Não achei resultado sintético sem selo nessa pasta além dos `.plan` (A31). **REFUTADO** para o restante.

**(f)** `docs/Plano de voo exemplo/*.plan`: ver A49.

---

### D2. Nome que mente

**A32 — `classeAmostral` apresentada como classe de erosão (CONFIRMADO).** `classificarPontoEspectral(bsi, ndvi)` (`src/lib/gee/amostragemBiofisica.ts:62`) devolve `"erosao"` se `bsi > 0.10 && ndvi < 0.40`, `"controle"` se `bsi < 0.00 && ndvi > 0.65`, senão `"indefinido"`. É função de **dois índices calculados**, chamada em `select-candidates/route.ts:916` e `inspect-point/route.ts:150-153`. O resultado vira o campo `classeAmostral`, que `PointPopup.tsx:169` exibe como **"Erosão Laminar (Classe 1)"** (e "Controle / SPD (Classe 0)"), num banner colorido de vermelho/verde (`PointPopup.tsx:146-160`), e que `MapViewer.tsx:351` usa para colorir o ponto. O nome e o texto dizem que o ponto *é* erosão; o código só diz que BSI e NDVI passaram de um limiar. A Regra 4 do projeto ("nada calculado vira rótulo") e A13 (D02 define essas classes por índices) tornam isso um indício de má interpretação: um leitor da tela toma a classe espectral por observação. **Gravidade: induz má interpretação.** (A decisão sobre o que D02 significa continua com o pesquisador: A13.)

**A33 — "Macrobacia IAT" por retângulos (PARCIAL).** `identificar_bacia_real` (`treinar_xgboost_loco.py:123-163`) diz no docstring que associa a coordenada "a uma das 6 macrobacias hidrográficas oficiais do Estado ... com base nos limites vetoriais simplificados do IAT". **[M]**: `BACIAS_PARANA` tem 6 polígonos de 8 a 12 vértices (`Tibagi 10, Ivaí 10, Paranapanema 10, Iguaçu 12, Piquiri/PR3 8, Litorânea/Ribeira 9`). O mesmo método tem um *fallback* (`:151`, "Enquadramento geográfico determinístico por quadrante") que, para um ponto **fora** dos polígonos mas dentro de um retângulo do Paraná, devolve um nome de bacia por cortes de latitude e longitude (`lat < -25.3` ⟹ "Iguaçu"; `lon < -53.2` ⟹ "Piquiri"; ...). O `else` final atribui `"Macrobacia Ivai (IAT)"`. Esse nome é então usado como grupo da validação cruzada e impresso como `[MACROBACIAS] Distribuição por Bacia do Paraná` (`:600`). Os 5 pontos artificiais que testei (coordenadas redondas, `SINTETICO_TESTE_ENCANAMENTO`) caíram **todos dentro de polígonos**, então o fallback **não foi exercitado**. **NÃO VERIFICADO** com que frequência um ponto real cai nele. Relação com a Parte 1: A14 já registra que "LOCO" é `KFold` sobre blocos (`:638`). **Gravidade: induz má interpretação.**

**A34 — Fonte do DEM rotulada com o CRS de projeção (PARCIAL).** `scripts/reduzir_terreno_copernicus.py:86`: `FONTE_OFICIAL = "COPERNICUS/DEM/GLO30 (EPSG:31982)"`. O produto é amostrado e as distâncias são projetadas para EPSG:31982 (`:26`, `:214`); o rótulo faz o produto parecer nativo nesse CRS. Que o GLO-30 seja distribuído em WGS84 é conhecimento meu **[S]**, não verificado nesta sessão. O mesmo rótulo é testado em `scripts/verificacao/test_reduzir_terreno.py:107`. **Gravidade: cosmético.**

**(Já cobertos na Parte 1)** `Area_Voo_Poligono` com a área do imóvel (A20), `rusle_perda_solo` gerado por `np.random.uniform(0.5, 4.5)` (`treinar_xgboost_loco.py:340,351`, A04/A05; o nome da coluna é o mesmo da coluna real, só a linha do controle traz `Tipologia_Feicao: 'Controle / SPD (Dry-Run)'` e `Codigo: CTRL-DRYRUN-xxxx`, e o trainer descarta essas colunas antes de ajustar), `[MACROBACIAS]`/"LOCO" (A14), "validação matricial": ver A09 reconferido (3.4).

---

### D3. Comentário ou documento defasado em relação ao código

Pares (afirmação, o que o código faz). Os de A08, A11 e A12 já estavam na Parte 1; os demais são novos. **[L]** salvo onde há **[M]**.

| # | Afirmação (arquivo:linha) | O que o código faz | ID |
|---|---|---|---|
| 1 | `README.md:35`: D13/D14/D15 são "guardas ativas para decisões pendentes" | `decisoes.ts`: D13 `:169`, D14 e D15 **decididas**. A rota ainda comenta "D13 (R pendente) ... D15 (LS pendente)" (`select-candidates/route.ts:1206`). A ramificação `REGISTRO_DECISOES.D13.estado === "pendente"` de `linhaDeBase.ts:80` é código morto **[M]**: sonda D4 imprime `D13: decidida, D14: decidida, D15: decidida` | A12/A36 |
| 2 | `README.md:39`: "Invariantes 1 a 7 verificados em tempo de execução"; `PainelMatrizModal.tsx:25`: "verificação dos **10** invariantes matemáticos" | `invariantes.ts` numera 1, 2, 5, 6, 7; o 3 só gera a coluna, o 4 não existe (A24) **[M]**; a especificação (`PROMPT_RECONSTRUCAO...md:541-550`) fala em **7**, não 10 | A12/A36 |
| 3 | `README.md:100`: `git checkout legado-pre-sarel` | a tag não existe (A30) **[M]** | A30 |
| 4 | `montagem.ts:5-12`: coordenadas "isoladas no arquivo de chaves", drone "segregada em arquivo próprio" | nenhum arquivo é gerado (A27); o cabeçalho também lista os fatores RUSLE R e K como exclusões invioláveis, e a linha exporta ambos (A04) | A27/A04 |
| 5 | `validacaoMatricial.ts` (cabeçalho, ponto 2): drone "estritamente mantidos como teste cego held-out. NUNCA entram na matriz de treino" | D16 (`decisoes.ts:208`) diz o contrário; `PainelCampanha.tsx:377-404` (UI atual) já diz "o VANT deixou de ser exclusivamente held-out ... 2 vão para treino e 2 para held-out" | A37 |
| 6 | `sitiosReferencia.ts:5-8` e `:105-115`: 4 sítios de "10 a 50 hectares", `papelConjunto: "held-out"`, `resolucaoVantGsdCm: 7.5` | D16 emendada (`decisoes.ts:208`): 72 polígonos de 5,02 ha, GSD 4 cm (D26) | A37 |
| 7 | `DECISOES.md` ("espelho legível") | 9 decisões divergem em estado e D20..D26 faltam (A11) **[M]** | A11 |
| 8 | `select-candidates/route.ts:11`: "janela 2016-2026 ... filtragem de nuvens e sombras pela máscara SCL" | `copernicusGeeClient.ts:345-346`: `"2023-01-01"` a `"2023-12-31"`; `:361-362`: só `CLOUDY_PIXEL_PERCENTAGE < 20` (por cena); `grep -nE "SCL\|QA60\|MSK_CLD\|updateMask"` em `src/lib/gee` e `src/app/api/gee` não acha máscara de pixel | **A35** |
| 9 | `LEIA-ME_NAO_VOAR.md:29`: "**Não existe leitor real do GLO-30 no repositório**" | `scripts/reduzir_terreno_copernicus.py` (commit `8e10661`, 30/09 17:28) e `planoVooNControl.ts:282` (usa o script) vieram **depois** do LEIA-ME (`89cc3af`, 30/09 14:44) **[M, git log]**. O aviso sobre os `.plan` **continua válido** (os arquivos foram gerados com a função trigonométrica); a frase sobre o leitor é que ficou velha | A36/A31 |
| 10 | `scripts/gerar_manual_pdf.py:282,948` e o texto do `Manual_Instalacao...pdf`: "35 suites / 231 testes vitest"; `Relatorio_Mudancas...pdf`: "35 passed", "AUC 0,82-0,91" | hoje: 57 arquivos, 435 testes, 6 falhando **[M]** | A08/A36 |
| 11 | `docs/images/04-Central-de-campanha.png` (usada no manual): "papel estritamente HELD-OUT (nunca integram a matriz de treino)" e "10 a 50 hectares" | a UI atual (`PainelCampanha.tsx:377`) já descreve D16 emendada; o screenshot é de antes | A36 |
| 12 | `# permitido: geracao explicita de benchmark ... quando solicitado via flag dry-run` (`treinar_xgboost_loco.py:331,333,335,337,339`) | é só texto; o código que barra é o `raise` de `:283` (A06) **[M]** | A06 |
| 13 | `treinar_xgboost_loco.py:20`: preditores "Fator K, Fator R e Perda RUSLE estimada (A)" | a matriz do app já não exporta a perda (A04) **[M]** | A04 |
| 14 | `montagem.ts:17`: "Ausente = célula vazia / null (XGBoost trata nativamente ausência)" | o trainer imputa a mediana (`:676-677,748,788`) (A14) | A14 |
| 15 | `docs/Ingestao_Processamento_Dados_Drone_Spectral2.md:107`: dados do VANT "estritamente HELD-OUT (validação independente e cega)" | D16 emendada | A37 |
| 16 | `treinar_xgboost_loco.py:23,128`: "6 macrobacias ... limites vetoriais simplificados do IAT" | há 6 polígonos de 8 a 12 vértices e um fallback por retângulos (A33) | A33 |

**A35 — o item 8 merece destaque (CONFIRMADO).** O comentário de `select-candidates/route.ts:11` e a decisão D05 (`decisoes.ts`, `D05: decidida`, "período de 2016 a 2026") descrevem uma série de 10 anos com máscara de pixel. **[M, leitura das expressões GEE]:**

- `copernicusGeeClient.ts:345-346` (consulta pontual de NDVI/BSI/bandas): **um único ano, 2023**.
- `amostragemSoloNuLote.ts:356-357` (frequência de solo nu em lote): `2016-01-01` a `2026-06-30`, de acordo com D05.
- Nos dois: filtro de **cena** `CLOUDY_PIXEL_PERCENTAGE < 20` (`copernicusGeeClient.ts:361-362`, `amostragemSoloNuLote.ts:372-373`) e **nenhuma máscara de pixel** (SCL, QA60 ou probabilidade de nuvem). D11 exige "observações orbitais válidas (livres de nuvem/sombra)"; P09 (método da máscara) está **proposta**, não decidida.
- O resultado: as bandas, NDVI e BSI de cada ponto candidato vêm de um ano, e a frequência de solo nu de dez, e nenhuma delas mascara nuvem por pixel, apesar do comentário.

**Gravidade: bloqueia a dissertação.** (A parte "qual máscara" é decisão P09: ver o prompt de correção, DEC-16.)

**A36 — conjunto de textos defasados (CONFIRMADO).** Itens 1, 2, 9, 10 e 11 acima, mais o comentário de rota do item 1. **Gravidade: induz má interpretação.**

---

### D4. Estado ambíguo de decisão

**Decidida, código ainda na regra antiga.**

| Decisão | O código | ID |
|---|---|---|
| **D16** (`decisoes.ts:208`): VANT é massa de treino e teste independente; polígonos de 5,02 ha | `montagem.ts:196-197` manda toda modalidade `drone` para `heldOutDrone`; `sitiosReferencia.ts` mantém 4 sítios `held-out` a 7,5 cm; **a UI atual (`PainelCampanha.tsx:377-404`) já descreve D16 emendada**, então o app **discorda de si mesmo** | **A37** |
| **D26**, **D24**, **D25** | `binary:logistic`, acurácia/AUC; nada de Tweedie, Spearman, 3 competidores, bootstrap por polígono (A29) | A29 |
| **D03** | binarização por texto, ignora `fracaoErodida` (A26) | A26 |
| **D05** (2016-2026, L2A) | consulta pontual usa só 2023 (A35) | A35 |
| **D04** (guarda de 24 meses) | `definirJanelasModelo` só em módulo sem chamador; `planilha.ts:204` fixa `modeloJanela: "D"` (A22/A29) | A22/A29 |
| **D13**, **D15** (R e LS decididos) | **A38** abaixo | **A38** |

**A38 — a linha de base RUSLE nunca é calculada no app (CONFIRMADO).** **[M]** Sonda D4 (apêndice A): chamei `montarLinhaDeBaseRUSLE` com **os mesmos parâmetros que `select-candidates/route.ts:1207-1228` passa** (NDVI, BSI, erodibilidade e camada 2024; nenhum `insumoFatorR`, nenhum `insumoFatorLS`):

```
PROBE|D4.linhaDeBase.estados|{"R":"indisponivel(insuficiente)","K":"tabelado","LS":"indisponivel(insuficiente)","C":"modelado","P":"tabelado","perdaSolo":"indisponivel(insuficiente)"}
PROBE|D4.decisoes.estado|{"D13":"decidida","D15":"decidida","D14":"decidida"}
```

`linhaDeBase.ts:78-93` e `:107-122` só calculam R e LS se receberem `insumoFatorR` e `insumoFatorLS`; a rota não os passa. Logo, **para todo ponto, R, LS e a perda de solo saem `indisponivel`**. O competidor "linha de base RUSLE" de D24 e D25 não existe nos dados do app, e a mensagem de causa (`insuficiente`) é a única pista. O comentário da rota (`:1206`) diz "R pendente / LS pendente", que já não é verdade. **Efeito em C5:** no fluxo real, `RUSLE_Fator_R` sai vazio e `RUSLE_Fator_K` pode sair preenchido, de modo que o trainer receberia R sem valor **[S: não executei a rota; a conclusão vem da sonda sobre a função, com os parâmetros que li na rota]**. **Gravidade: bloqueia a dissertação** (o critério D25 compara contra uma linha de base que o app não produz).

**Pendente/proposta, código já assumiu um lado.**

- **P01** (aresta do bloco, proposta): o código usa o fallback de 20 km e **declara** que é provisório (`blocosEspaciais.ts:16-17,60`). Honesto: não é achado.
- **P09** (máscara de nuvem, proposta): o comentário da rota afirma SCL, o código não mascara por pixel (A35).
- **P04** (buffers água/urbano), **P06** (UDM2 ≥ 80%, **pendente**), **P08** (limiar de variância 1e-4): não achei constantes correspondentes por `grep` em `src/lib` e `src/app` (`BUFFER_`, `udm`, `clear_percent`, `1e-4`, `0.0001`). **NÃO VERIFICADO** se estão em outro formato (no prompt de correção: V8).

**A37 — D16 em dois sentidos dentro do app (CONFIRMADO).** Ver D4 acima e D3 itens 5, 6 e 15. A correção de código **depende de como D16/D26 devem alimentar o treino**, que é decisão do pesquisador (mesmo bloco de A29). **Gravidade: precisa de decisão do pesquisador.**

---

### D5. Falhas silenciosas

Busca **[M]** em `src` e `scripts` (sem testes, `gerar_*`, `generate_*`, `verificacao/`): `catch {}` vazio **5** (todas em `scripts/installer/InstaladorSAREL.cs`); `catch → return null/false` **1** (`InstaladorSAREL.cs:399`); `.catch(() => null|undefined|[])` **12**; `except Exception` em Python **39**; `except ...: pass` numa só linha **0**, mas **8** casos de `except Exception:` seguido de `pass`/valor-padrão em linhas seguintes (abaixo).

**A39 — ingestão fundiária troca erro por valor-padrão (CONFIRMADO).** Leitura do corpo de cada `except` **[L]**:

| Arquivo:linha | O que acontece no erro |
|---|---|
| `scripts/ingest_sncr_official.py:155-157` | `area_total = 0.0` |
| `scripts/ingest_sncr_official.py:163-167` | **`perc_det = 100.0`** quando a coluna falta ou não converte (o percentual detido de um titular vira 100%) |
| `scripts/ingest_sigef_official.py:181-183` | `mun_ibge = 0` |
| `scripts/ingest_sicar_official.py:207-208` | `area`, `mod_fiscal` = `0.0` (A18) |
| `scripts/ingest_data.py:120-121` | `pass` |
| `scripts/ingest_data.py:239-241` e `:398-400` | devolve `None` / `0` (ingestão com falha indistinguível de "nada a ingerir") |
| `scripts/get_fontes_dados.py:45-47` | erro vai para `stderr` e imprime **`[]`** como saída válida |
| `scripts/get_property_polygon.py:93-94` | `pass` |

O mascaramento na leitura (`matcher.ts:48-49`: área ≤ 0 vira `null`) cobre só a área. `perc_det = 100.0` e `mun_ibge = 0` não têm mitigação conhecida **[L]**. **NÃO VERIFICADO** onde `perc_det` é lido. **Gravidade: induz má interpretação.**

**A40 — `inspect-point` engole falhas e responde `ok: true` (CONFIRMADO).** `src/app/api/gee/inspect-point/route.ts:58-70` aplica `.catch(() => null)` à consulta Embrapa, à consulta fundiária e à obtenção do token GEE. `:322-324`: `fundiario: fundiarioRes ? toContextoFundiario(...) : point.fundiario`, ou seja, se a consulta fundiária falhar, **mantém o estado anterior sem registrar que falhou**, e a resposta é `{ ok: true, ponto, geeDebug }` (`:328-332`). A Regra 2 pede `erro-na-consulta` com causa. **[L]** (não executei a rota). **Gravidade: induz má interpretação.**

**A50 — testes que só verificam "não lançou" (REFUTADO).** `grep -nE "not\.toThrow\(\)"` → **8** ocorrências, todas em testes que **também** têm casos de lançamento (`versaoMotor.test.ts:12-16`, `validacaoMatricial.test.ts:183`, `planet.test.ts:55`, `guardaSintetico.test.ts:58`). Heurística por script **[M]**: dos 435 blocos `it/test`, **0** não têm `expect`/`assert`/`fail(` no corpo. Limite: a heurística olha o texto do bloco, não se o `expect` é significativo. **REFUTADO.**

Filtros que descartam linhas: o trainer imprime a contagem de descarte (`[DESCARTE ALVO (Regra 4)]`, `[DESCARTE] n/N pontos sem bloco`) e `montarMatrizTreino` devolve `exclusoes` **[L]**. Não é achado.

---

### D6. Contaminação entre função e dado

- **Dado padrão do treino — A54 (CONFIRMADO).** `treinar_xgboost_loco.py:879`: `--dados` padrão = `legado/pre_sarel/Tabela_Consolidada_Parana_Todo_o_Estado_150focos_2026-09-04.xlsx`, fora do git. **[L]** A auditoria interna do próprio projeto classifica esse arquivo como **"🔴 Inválido / Espúrio"** (`docs/auditorias/Relatorio_Auditoria_Cientifica_Veracidade_2026-09-13.md:33`) e registra (`:40-48`) que **150 de 150 linhas** trazem `Declividade_Pct = 16.00`, `BSI = 0.450`, `NDVI = 0.320` e `Perda_Solo_t_ha_ano = 35.20` (desvio padrão 0,00). `PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md:74,105,500` descreve o mesmo defeito do Localizador ("150/150 linhas com 35,2 t/ha/ano"). O default continua apontando para ele. **Relação com o dry-run (A05):** as faixas sintéticas da classe 0 (`:332-340`: declividade 3-14, BSI −0,25 a −0,02, NDVI 0,68-0,88, perda 0,5-4,5) **não contêm** nenhum dos quatro valores constantes da classe 1 (16,0; 0,45; 0,32; 35,2). Por construção, qualquer um dos quatro preditores separa as classes sem erro; e o JSON do dry-run tem `total_amostras_avaliadas: 300` e matriz `[[150, 0], [0, 150]]`, ou seja, **150 + 150**, compatível com as 150 linhas do arquivo. Isso **corrobora a explicação do AUC=1,0 que a Parte 1 só levantava como hipótese (A05b)**, mas **não foi medido**: a planilha não existe neste clone, e o JSON **não registra o caminho de `--dados`** (o dicionário `relatorio_final`, `:910-928`, não tem campo de origem). Hoje o script só prossegue com esse arquivo se ele trouxer as duas classes ou se a flag de dry-run for passada (A51). **Gravidade: induz má interpretação.**
- **Flag de dry-run — A51 (REFUTADO).** `treinar_xgboost_loco.py:883-884`: `--permitir-dryrun-sintetico` com `action='store_true', default=False`. O estado padrão é o mais seguro, e o `raise` de `:283` recusa sem a flag **[M]** (executado de novo: `exit=1`). **REFUTADO.**
- **Saída padrão (A05).** `--saida` padrão é `docs/relatorios/modelagem` (`:885`): ver D1(a).
- **Sítios padrão-ouro no código (A19, A37).** `src/lib/padraoOuro/sitiosReferencia.ts` embute 4 `codigoCar` no formato real de 43 caracteres (`:101,377,513,629`) e geometrias de imóveis. **[M]** As áreas declaradas batem com as das geometrias (declaradas 49,94 / 49,54 / 49,54 / 49,54 ha; pela geometria, cálculo aproximado, 49,74 / 49,35 / 49,36 / 49,36 ha), o que sugere perímetros reais, e não áreas preenchidas à mão. Minha suspeita de "três áreas idênticas" ser sinal de fabricação **foi refutada** pela geometria. O arquivo traz `papelConjunto: "held-out"` literal (A37).
- **`.plan` sintéticos (A31)** e **`Plano de voo exemplo` — A49:** `docs/Plano de voo exemplo/Coleta 01b.plan` e `MissaoCalculoMica.plan` (commit `8b44fae`, 29/09, autor RedZardoz) são planos QGC com `plannedHomePosition: [-25.1387069063065, -53.854901513732, 50]` e 4 itens cada, **sem** marcador dentro do arquivo; a pasta se chama "exemplo" mas os arquivos não **[M]**. **NÃO VERIFICADO** se são missões reais voáveis ou modelos. **Gravidade: induz má interpretação (provisória).**
- **`Instalador_SAREL.exe` — A48:** executável de 2.181.120 bytes na raiz, ao lado de `scripts/installer/InstaladorSAREL.cs` e `config_instalador.json` **[M]**. Não consegui reproduzir o binário a partir do fonte (sem compilador C#), então **NÃO VERIFICADO** que o `.exe` corresponde ao `.cs`. O `.cs` tem 5 `catch { }` vazios (D5). **Gravidade: induz má interpretação (provisória).**
- **Dados de teste versionados em pastas de dado real:** `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_*.csv` são dados fictícios (rótulos `Titular Sicar #N`, CAR de 27 caracteres, A19 da Parte 1) **com aviso na primeira linha de cada CSV** (`# SINTETICO_NAO_VOAR - DADOS DE DEMONSTRACAO`); os `.plan` não (A31).

---

### D7. Unidades, escalas e sistemas de referência

**A41 — metadados do rótulo preenchidos por padrão do sistema (CONFIRMADO).** `src/components/inspetor/InspetorPonto.tsx:49`: `const hoje = new Date().toISOString().split("T")[0];` e `:71`: `observadoEm: hoje`. O tipo `Rotulo.observadoEm` é "AAAA-MM-DD" da **observação** (`types/rotulo.ts`). Pela interface do Inspetor, o rótulo recebe a data em que o usuário cadastrou o rótulo no sistema, e em UTC (A42), não a data do campo ou do voo. **O caminho SAREL Coletor tem o mesmo padrão e mais dois** **[L]**: `ingestaoColetor.ts:225` `observador = ... || "Perito SAREL Coletor"` (observador ausente vira um nome de perito), `:226` `observadoEm = String(reg.observadoEm ?? new Date().toISOString().split("T")[0])` (data ausente vira a data de hoje, em UTC), e `:227-231` `confianca` ausente ou inválida vira **`"alta"`**. Essa ingestão ainda calcula a **quarta** binarização do projeto (`:215-222`: `fracaoErodida >= 0.25` ou, sem fração, `classeNormalizada === "erosao"`). O caminho Kobo (`ingestaoKobo.ts:119`) **não** preenche padrão: deixa `""` quando falta data. Os três valores-padrão da Coletor aparecem depois como se fossem informados pelo observador (Regras 1 e 3). **Fere a Regra 3** (data do dado ≠ data do processamento). **Gravidade: induz má interpretação.**

**A42 — datas de consulta em UTC (CONFIRMADO).** `git grep -nE "toISOString\(\)\.(split|slice|substring)"` → **18** ocorrências em código não-teste, entre elas `inspect-point/route.ts:50`, `select-candidates/route.ts:284`, `sorteio-d16/route.ts:175`, `InspetorPonto.tsx:49`, `chuva/eventos.ts:120`. **[M]**

```
$ TZ=America/Sao_Paulo node -e '... new Date("2026-10-05T23:30:00-03:00") ...'
hora local: 05/10/2026, 23:30:00 | toISOString().split("T")[0] = 2026-10-06
```

Depois das 21 h em Brasília, a "data da consulta" avança um dia. Em `chuva/chirps.ts:61` e `chuva/imerg.ts:48`, o **valor padrão** de `adquiridoEm` é a data de hoje (`adquiridoEm = new Date().toISOString().split("T")[0]`): a data de aquisição do dado vira a data da consulta (Regra 3); os dois módulos não têm chamador (A22), então hoje não produzem valor. **Gravidade: induz má interpretação.**

**A43 — NDVI/BSI sem faixa física em `classificarPontoEspectral` (CONFIRMADO).** **[M]** Sonda D7:

```
PROBE|D7.classe(bsi=5, ndvi=-3) [fora de -1..1]|erosao
PROBE|D7.classe(bsi=-5, ndvi=3)|controle
PROBE|D7.classe(bsi=0.2, ndvi=0.3)|erosao
PROBE|D7.classe(bsi=0.05, ndvi=0.5) [faixa entre criterios]|indefinido
```

Valores fora de [−1, 1] são classificados como "erosao"/"controle". Outras partes validam a faixa (`rusle/fatorC.ts:59-62`, `jev/fallbackLocal.ts:38-41`), mas a classificação que colore o mapa (A32) não. **Gravidade: induz má interpretação.**

**A44 — CRS fixo (NÃO VERIFICADO).** O terreno é amostrado e o fator LS calculado em EPSG:31982 (UTM 22S) para qualquer ponto (`reduzir_terreno_copernicus.py:26,214`; `decisoes.ts` D15/D21). O Paraná se estende de cerca de 54,6°O a 48,0°O, e o meridiano de 54°O separa as zonas 21S e 22S. A distorção foi medida **na BP3**: `src/config/areaInteresse.ts:61`: `distorcaoProjecaoUtmMaxPct: 0.11, // Extremo oeste UTM 22S medido em 0,11%`, e há registro em `docs/verificacoes/projecao/`. Para outras regiões do estado, **NÃO VERIFICADO**. **Gravidade: induz má interpretação (provisória).**

**A52 — mistura de % e graus (REFUTADO).** `declividadePct = tan(graus·π/180)·100` (`terreno.ts:13,43`); a plausibilidade é checada em graus (`versaoMotor.ts:18`, 75°); os filtros de elegibilidade e de estratificação usam `declividadePct` (`elegibilidade.ts:143-148`, `estratificacao.ts:25,126,138`). Não achei troca de unidade no caminho principal. (O trainer não consome `Declividade_graus`: A28.) **REFUTADO.**

---

### D8. Cópias e versões duplicadas

**A45 — PDFs e PPTX duplicados com conteúdo diferente (CONFIRMADO).** **[M]** Comparação de hash dos arquivos rastreados que têm o mesmo nome em pastas diferentes (excluindo `docs/verificacoes/fontes/`):

```
Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf
     716d1b32bf  Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf              (raiz)
     982912f4d2  docs/relatorios/Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf
     982912f4d2  legado/versoes_anteriores/2026-09-17_pre_compensacoes/Relatorio_Mudancas_...pdf
Apresentacao_Simposio_7min_SAREL.pptx:  0bb3341fd2 (raiz)  ×  ad147a82ce (docs/)  -> DIFERENTES
Apresentacao_SAREL_PPGTCA_2026.pptx:    12565cd821 (docs/) ×  8685f88c4c, abd9900771 (legado/)  -> DIFERENTES
design.md: 111975cfa5 (docs/)  ×  bf008f66e6 (docs/legado/)   -> DIFERENTES
```

O ponto relevante: **a cópia de `docs/relatorios/` (onde alguém procura relatórios) é byte a byte a versão antiga arquivada em `legado/versoes_anteriores/2026-09-17_pre_compensacoes/`**, e a da raiz é outra. `pdftotext` mostra que as duas dizem "AUC 0,82-0,91" (linha 337) e "35 passed" (linhas 362 e 363 na raiz; 363 e 364 em `docs/relatorios/`) **[M]**. Qual é a versão vigente não consta em nenhum arquivo que eu tenha lido. **Gravidade: induz má interpretação.**

**A46 — três lógicas de treino diferentes (CONFIRMADO).** **[L]**

| Lógica | Onde | Validação | Observação |
|---|---|---|---|
| CLI | `scripts/treinar_xgboost_loco.py` | `KFold(n_splits=min(5, n_blocos), shuffle=True)` sobre os **nomes** dos blocos (`:638`) | `binary:logistic`, imputação por mediana |
| Pacote ZIP (exportado pela UI) | `src/lib/export/pacoteReprodutibilidade.ts:679-823` (script Python em string) | `GroupKFold(n_splits=min(3, n_grupos))` (`:803,812`) | `XGBClassifier` com `random_state=42`; deixa `NaN` ao XGBoost (`:757`) |
| Dry-run existente | `docs/relatorios/modelagem/*` | do CLI | AUC=1,0 por construção (A05) |

Os dois scripts divergem em k (5 × 3), em esquema de validação (`KFold` embaralhado × `GroupKFold`) e no tratamento de ausentes (mediana × `NaN`). **Nenhum implementa D24/D25/D26.** O usuário que baixa o ZIP da UI recebe uma lógica; quem roda o CLI usa outra. Qual é a canônica é decisão do pesquisador. **Gravidade: precisa de decisão do pesquisador.**

**A47 — funções duplicadas (CONFIRMADO).** `calcularKappaCohen`: `rotulos/concordancia.ts:59` (pares de rótulos, com IC 95% e alerta), `padraoOuro/validacaoMatricial.ts:142` e `config/tourMetodologico.ts:375` (assinatura `(tp, fp, fn, tn)`). `calcularCorrelacaoPearson`: `padraoOuro/validacaoMatricial.ts:165` e `seguranca/detectorSequencia.ts:32`. **O fluxo da tela usa a versão de `validacaoMatricial.ts`** (via `executarValidacaoMatricial`, cujo único chamador é o demo com pixels inventados: A09); a de `concordancia.ts` só é chamada por módulo órfão (A25). **Gravidade: cosmético** (risco de divergência futura).

---

## 3. Reconferência dos achados da Parte 1 que vão ao prompt de correção

**Método.** Todos os comandos desta seção foram rodados **nesta sessão** no HEAD `1459000`. Quando a sonda foi repetida, usei o mesmo código da Parte 1 (apêndice A da Parte 1, copiado) em diretório temporário novo (seção 6). **Veredicto:** *mantido* (mesma conclusão, âncora reconferida) / *alterado* (conclusão ajustada) / *refutado*.

### 3.1 Execuções repetidas **[M]**

```
$ npm run typecheck   -> exit 0
$ npm run lint        -> 2 warnings (MapViewer.tsx:476, PointPopup.tsx:64), 0 erros
$ npm run test        -> Test Files  3 failed | 54 passed (57) / Tests  6 failed | 429 passed (435)
$ npm run build       -> exit 1; 2 UnhandledSchemeError (node:child_process, node:crypto);
                         import trace: sorteioPoligonos.ts <- PainelSorteioD16.tsx <- DecisoesModal.tsx <- page.tsx
$ python3 scripts/treinar_xgboost_loco.py --dados <so classe 1>        -> line 283 raise ValueError, exit=1
$ python3 scripts/treinar_xgboost_loco.py --dados <CSV do app>         -> pandas.errors.ParserError: ... Expected 1 fields in line 6, saw 8
$ XLSX do app -> (4, 30), 13 preditores consumidos, dry_run False
sonda do guarda (A06): A=1, B=0, C=0, D=0 violações
sonda vitest (C2/C3/C4/C6/D4/D7): 23 passed (23)   [passou = a sonda rodou, não que o comportamento seja o desejado]
```

### 3.2 Veredictos por achado

| ID | Veredicto | Evidência desta sessão |
|---|---|---|
| A01 | **mantido** | `npm run build` → `exit=1`, 2 `UnhandledSchemeError`; trace acima. |
| A02 | **mantido** | 6 falhas / 435, nos mesmos 3 arquivos (`provenienciaCaminhos`, `matcher`, `planoVooNControl`); `ls data` → não existe no clone. |
| A03 | **mantido** | typecheck `exit 0`; lint: 2 warnings, 0 erros (linhas `476:6` e `64:6`). |
| A04 | **mantido** | `treinar_xgboost_loco.py:20,340,351,578,580`; `montagem.ts:11,62,186`; `perfis.ts:82,158`; `invariantes.ts:46`; C5: 13 preditores, K e R entram. |
| A05 | **alterado** | Âncoras ok: `:283` (o `raise ValueError(` do dry-run; o traceback da execução aponta essa linha), `:332-340`, `:879`, `:883-884`; hashes inalterados (seção 6). **Acréscimo:** a hipótese A05b (AUC=1,0 pela construção) fica **corroborada** por documento do repositório e pelo `150 + 150` do JSON (A54), sem medição. |
| A06 | **mantido** | Sonda do guarda: `1 / 0 / 0 / 0`; `padroesProibidos.test.ts:26,49,57,275`. |
| A07 | **alterado** | Âncoras ok (`gerar_manual_pdf.py:366,423`). **Escopo ampliado:** as **cinco** `tela*` são esquemáticas sem selo (D1b); **nenhuma** está no PDF atual do manual (pixel hash: 8 de 8 coincidências em `docs/images/`). |
| A08 | **mantido** | `pdftotext`: `AUC 0,82-0,91` na linha 337 das duas cópias; `35 passed` nas linhas 362/363 (raiz) e 363/364 (`docs/relatorios/`); `gerar_relatorio_mudancas_pdf.py:578`. Ver A45 sobre qual cópia vale. |
| A09 | **alterado** | Âncoras ok (`PainelCampanha.tsx:56,267,273,543`). **Acréscimo:** `executarValidacaoMatricial` tem **um** chamador (`PainelCampanha.tsx:296`), o demo; `predicaoSatelite` só recebe valor ali (`:283`). A "validação" nunca é alimentada com predição real. |
| A10 | **mantido** (refutação da hipótese B3) | UTF-8 estrito OK, `U+FFFD: 0`; `treinar_xgboost_loco.py:931-932` grava com `encoding='utf-8'`, `ensure_ascii=False`. |
| A11 | **mantido** | Parser: divergentes `['D05','D07','D08','D12','D13','D15','D17','D18','D19']`, só no TS `['D20'..'D26']`; `DECISOES.md:67`, `decisoes.ts:51,337`. |
| A12 | **mantido** | `README.md:35,39,100`. |
| A13 | **mantido** | `decisoes.ts:41`; `LIMIAR_EROSAO_*`/`LIMIAR_CONTROLE_*`: 4 ocorrências no script, todas definição (`:61-64`), nenhuma de uso. |
| A14 | **mantido** | `:676,692,638`; `amostragemSoloNuLote.ts:422`. |
| A15 | **mantido** | `PainelSorteioD16.tsx:63-64`; `padroesProibidos.test.ts:26,275`. Efeito no sorteio continua NÃO VERIFICADO. |
| A16 | **mantido** | `proveniencia.ts:33`; `embrapaSoilClient.ts:1166-1169`, `:1274`, `:1397` (todos com 2 argumentos). |
| A17 | **mantido** | `fatorC.ts:67`. |
| A18 | **mantido** | `ingest_sicar_official.py:207-208`, `ingest_sigef_official.py:181`, `query_real_properties.py:109`; mitigação de área em `matcher.ts:48-49`. (Linha `matcher.ts` na Parte 1 não tinha número; é `:48`.) |
| A19 | **alterado** | CPF pontuado agora em 2 arquivos: `matcher.test.ts` (2) **e `docs/auditorias/AUDITORIA_PARTE1...md` (4)**, porque o relatório da Parte 1 cita os valores de exemplo (fictícios) do teste; CAR em formato real, 9 ocorrências em 3 arquivos (`sitiosReferencia.ts:101,377,513,629`). **Acréscimo:** as áreas dos 4 sítios batem com suas geometrias, ou seja, os perímetros têm aparência de reais (D6). |
| A20 | **mantido** | Matriz da sonda idêntica (planilha: titular e CPF em claro; campo-cego: titular; voo-cego: área); `planilha.ts:119,182,192`. |
| A21 | **mantido** (refutação nos padrões) | `git grep` de chaves → só `padroesProibidos.test.ts:209` (placeholder). |
| A22 | **mantido** | 12 funções com **0** usos fora do próprio arquivo e dos testes (lista em 3.3). |
| A23 | **mantido** | `select-candidates/route.ts:1150,1160,1181`; `decisoes.ts:169`. |
| A24 | **alterado** | `derivarCamposNaoMedidos` **é chamada** pelo exportador (`planilha.ts:4,32`) para **gerar** `Campos_Estimados` (`:137`); o que falta é o **validador** conferir a coluna. Inv. 4: 0 ocorrências de "Invariante 4" em `src`. Casos da sonda reproduzidos: Inv. 3 e 4 não recusam; Inv. 5 só com `"erro"`; Inv. 6 não pega `PR`. |
| A25 | **mantido** | Sonda do Kappa: `{"kappa":-0.3333,"operacional":false,"alertaBloqueante":"ALERTA BLOQUEANTE ..."}`; 0 consumidores fora de `concordancia.ts`. (A linha `C3.kappa.resultado ... "kappa":1` na saída bruta vem da **primeira** sonda, com formato de entrada errado, descartada na Parte 1; a válida é a de `ParRotulo`.) |
| A26 | **mantido** | `'Sem erosão' => 1`, `'indeterminado' => 0`, `fracaoErodida_na_linha: ["classeAlvoBinaria"]`; `montagem.ts:141`; `InspetorPonto.tsx:65`. |
| A27 | **mantido** | `chavesCoordenadas`/`heldOutDrone` só em `PainelMatrizTreino.tsx:39,53` e `pacoteReprodutibilidade.ts:161`. |
| A28 | **mantido** | CSV `ParserError`; XLSX `(4, 30)`, 13 preditores; `csv.ts:44`, `:188`, `:431`. |
| A29 | **mantido** | `:646`; `decisoes.ts:208,311,324`; `montagem.ts:196`; `monoton` no script: 0; `planilha.ts:204`. |
| A30 | **mantido** | `git tag \| wc -l` → 0; `git ls-remote --tags origin` → 0 linhas. |

### 3.3 Funções órfãs (A22) **[M]**

`git grep -lwI <função> -- src scripts ':!*.test.ts' ':!*.test.tsx' ':!<arquivo de definição>' | wc -l` → **0** para: `montarPreditoresTemporais`, `construirBlocoChuva`, `calcularIndiceMecanismo`, `buscarCenaSentinel1T0`, `montarTrioEvento`, `avaliarViabilidadeParesAOI`, `montarPedidoPlanetComClipping`, `submeterPedidoPlanet`, `obterUrlSceneTile`, `ingestarInterpretacaoVisual`, `calcularTaxaErroInterpretacao`, `construirEstatisticasBloco`.

### 3.4 Achados da Parte 1 que ficam **fora** do prompt de correção como correção

Vão para decisão do pesquisador ou "verificar antes de corrigir" (ver tabela de rastreio no prompt): A04, A11 (conteúdo de D03), A13, A14, A16 (data), A17, A19, A22, A25, A27, A29, A30, A37, A46, parte de A26, A28 e A35. O prompt traz as opções.

### 3.5 Tabela de rastreio: achado → destino no prompt de correção

Cópia da seção 2 de `docs/planejamento/PROMPT_CORRECAO_POS_AUDITORIA_2026-10-05.md` (conferida por script: os 54 achados A01..A54 aparecem, sem duplicata; todo `C`, `DEC` e `V` citado existe). **C** = correção (30 blocos); **DEC** = decisão que só o pesquisador toma (16); **V** = verificar antes de corrigir (13); **—** = refutado, sem ação.

```
 A01 -> C01                 A19 -> DEC-10, V13        A37 -> DEC-4, V8
 A02 -> C02, V10            A20 -> C05, V6            A38 -> C11, DEC-6, V12
 A03 -> C28                 A21 -> —                  A39 -> C23
 A04 -> DEC-1               A22 -> DEC-6              A40 -> C24
 A05 -> C12, DEC-12, V9     A23 -> C15                A41 -> C25, V7
 A06 -> C06                 A24 -> C03                A42 -> C26
 A07 -> C17                 A25 -> DEC-5              A43 -> C27
 A08 -> C18, DEC-13         A26 -> C09, DEC-3         A44 -> V1
 A09 -> C19                 A27 -> DEC-4              A45 -> DEC-13
 A10 -> —                   A28 -> C04, DEC-15        A46 -> DEC-14
 A11 -> C13, DEC-3          A29 -> DEC-3, DEC-4       A47 -> C30
 A12 -> C14, C22            A30 -> DEC-11             A48 -> V2
 A13 -> DEC-2               A31 -> C16                A49 -> V3
 A14 -> DEC-7               A32 -> C20                A50 -> —
 A15 -> C07, V5             A33 -> C21, V4            A51 -> —
 A16 -> C08, DEC-9          A34 -> C29                A52 -> —
 A17 -> DEC-8               A35 -> C10, DEC-16, V11   A53 -> —
 A18 -> C23                 A36 -> C22                A54 -> C12
```

Estatística: 54 achados; 30 com correção (C01..C30); 6 sem ação (A10, A21, A50, A51, A52, A53) mais a parte refutada de A19; os demais vão para decisão ou verificação, e vários têm mais de um destino (parte técnica em C, parte metodológica em DEC).

---

## 4. O que eu não consegui verificar e por quê

1. **Qualquer etapa com GEE, Planet, campo ou voo reais.** Sem credencial e, pelas regras, sem consumir cota ou criar tarefa no Earth Engine. Em particular, **o que a consulta GEE de `copernicusGeeClient.ts` devolve** (A35): li as expressões, não as executei.
2. **A frequência com que um ponto real cai no *fallback* por retângulos das "macrobacias"** (A33). Meus 5 pontos artificiais caíram dentro de polígonos.
3. **Se `Instalador_SAREL.exe` corresponde ao fonte `InstaladorSAREL.cs`** (A48). Sem compilador C#.
4. **Se os `.plan` de `docs/Plano de voo exemplo/` são missões reais** (A49).
5. **Distorção de projeção fora da BP3** (A44).
6. **Onde `perc_det` e `mun_ibge` são lidos** depois da ingestão, e se há mitigação (A39).
7. **Efeito dos `?? 0` de `PainelSorteioD16.tsx` no sorteio** (A15). Não executei o sorteio.
8. **Se P04, P06 e P08 já viraram constantes no código em formato que minha busca não cobre** (D4).
9. **Se a interface mostra os textos que li no código** (A32, A36): não subi `npm run dev` nem abri o app no navegador. Li o `.tsx`; os screenshots de `docs/images/` são da versão anterior.
10. **Com que frequência os registros reais da Coletor chegam sem `observadoEm`, `observador` ou `confianca`** (A41), o que decide quanto do dado já ingerido tem valor-padrão. Li o código, não os dados.
11. **Se os 6 testes que falham passam com os dados presentes** (`data/`, bibliografia em PDF).
12. **Se o rótulo `Instalador` e demais binários** além do `.exe` têm origem identificável.
13. **O texto integral dos PDFs de relatório e apresentações:** fiz busca de padrões (`pdftotext`, extração de XML de PPTX/DOCX), não leitura integral.
14. **Qual versão de cada PDF/PPTX duplicado é a vigente** (A45): isso só o pesquisador sabe.
15. **O conteúdo da planilha `150focos`** (A54): não existe neste clone. Os valores constantes vêm do relatório interno de 13/09, **não de leitura minha** do arquivo.

---

## 5. Onde eu posso ter errado

| Suposição em que a conclusão depende | Como conferir |
|---|---|
| **HEAD ≠ commit da Parte 1**: tratei como equivalente porque só o relatório mudou. Se a regra era parar, esta Parte 2 é rascunho. | `git diff --stat 5f7c033 HEAD` |
| **A35**: li as duas expressões GEE REST (`copernicusGeeClient.ts:340-365`, `amostragemSoloNuLote.ts:350-375`). Pode haver **outra** rota de extração que mascare por pixel e que eu não achei (`grep` por `SCL|QA60|MSK_CLD|updateMask` em `src/lib/gee` e `src/app/api/gee` → só o comentário da rota). | `git grep -nE "SCL\|QA60\|MSK_CLD\|updateMask\|CLOUDY_PIXEL" -- src scripts` |
| **A38**: a sonda chamou `montarLinhaDeBaseRUSLE` com os parâmetros **como eu li** em `route.ts:1207-1228`. Se a rota em execução montar `insumoFatorR` em outro lugar (variável fora do trecho que li), o resultado muda. | `sed -n 1200,1232p src/app/api/gee/select-candidates/route.ts` e rodar a rota com um ponto (precisa de credencial GEE). |
| **A32/A36**: li o código da interface, não a tela. | Abrir o app e clicar num ponto. |
| **A42**: o `node -e` usa o fuso do shell (`TZ=America/Sao_Paulo`). O servidor pode rodar em UTC, e aí não há deslocamento; no navegador do usuário (`InspetorPonto.tsx:49` é componente de cliente) a data usa o relógio dele, mas a conversão `toISOString` continua UTC. | Rodar `new Date().toISOString()` no console do navegador depois das 21 h. |
| **A45**: comparei por **nome de arquivo** e por hash. Duas cópias com nomes diferentes não entram. Excluí `docs/verificacoes/fontes/`. | `git ls-files \| xargs sha256sum \| sort \| uniq -w64 -d` |
| **A46**: li o script embutido do pacote como texto; não o extraí nem o executei. | Exportar o ZIP pela UI e abrir o `.py`. |
| **A33**: os polígonos têm 8 a 12 vértices; chamar de "simplificados" é do docstring, não medi a simplificação. | Comparar com o shapefile oficial do IAT. |
| **A50**: a heurística de blocos `it(` lê texto; blocos com `expect` sem significado passam por ela. | Rodar mutação (`stryker`) ou ler uma amostra. |
| **A41**: a Regra 3 trata a data do dado, mas pode ser decisão de produto que o Inspetor registre "data do cadastro". O tipo diz "observadoEm". | Perguntar ao pesquisador qual é a semântica pretendida do campo. |
| **A19/A31/A49**: "parece real" ou "parece sintético" é inferência de forma (comprimento do CAR, rótulos `Titular Sicar #N`), não de procedência. | Conferir com a origem do dado (SICAR, voo). |
| **Ids novos (A31..A54)**: a classificação de gravidade é minha. A31, A44, A48 e A49 levam "provisória". | Reclassificar à luz do uso real. |

---

## 6. Material de teste

- **Criei** o diretório `…/scratchpad/SINTETICO_TESTE_ENCANAMENTO_tmp2/`, **fora do repositório**. Dentro: cópias das sondas da Parte 1 (`*_c.probe.test.ts`, `*_k.probe.test.ts`, `guarda_probe.mjs`), a sonda nova `SINTETICO_TESTE_ENCANAMENTO_d.probe.test.ts` (D4 e D7), `vitest.probe.config.mts`, `hash_antes.txt`, `SINTETICO_TESTE_ENCANAMENTO_so_classe1.csv` (4 linhas, valores 1-4), 5 CSV + 1 XLSX gerados pelo próprio app a partir de **4 pontos artificiais** (valores 1-4) e um *symlink* `node_modules` para o do repositório. Todos têm `SINTETICO_TESTE_ENCANAMENTO` no nome e no conteúdo. Nenhum em `data/`, `docs/`, `src/` ou `scripts/`.
- **Execuções dentro do material de teste:** `vitest` com as sondas (23 testes); `node guarda_probe.mjs`; `treinar_xgboost_loco.py` pela CLI com `--saida <tmp>/out` (2 vezes: sem flag; com o CSV do app) e importado para ler o XLSX; função `identificar_bacia_real` com 5 coordenadas redondas artificiais. **Nenhum número desses testes é evidência científica**; onde aparecem (A24, A28, A38, A43), a frase diz que provam só o encanamento ou o comportamento da função.
- **Execuções no repositório que criam arquivos ignorados pelo git:** `npm run build` (cria `.next/`, no `.gitignore:` `/.next/`) e `npm run test`/`typecheck`/`lint`. Nenhuma altera arquivo rastreado.
- **Hashes SHA-256** dos 5 arquivos de `docs/relatorios/modelagem/` antes e depois de **todas** as execuções:

```
bb557dada06e630d6ea2e4d3ceae9fb030682dcf857bf4a4073f76c415c718f5  curva_roc_loco.png
20a713c60bf2fe7ff1dee6dbd91542b1dd707cd1b2214ea32853ef4e9d01ae63  matriz_confusao_loco.png
755bbd4e173340f29d117eef5c55ac446af2bde89f47b5018ffd83bbf101caa3  relatorio_modelagem_xgboost_loco.json
cf85dcf0558865b305fb7492fab7d243712d8a6a635ef73ee957cdd427b2a12b  shap_feature_importance.png
37aae950f90117254a18cbb6ccf950c4bf55f035093cc4c10f5a2b3c6593ac1f  shap_summary_beeswarm.png
$ sha256sum -c hash_antes.txt  ->  os 5 arquivos: OK (conferido antes de apagar)
$ git diff --stat HEAD -- docs/relatorios/modelagem  ->  (vazio)
$ ls <tmp>/out | wc -l  ->  0   (nenhuma saída de dry-run em lugar nenhum)
```

(O prompt pede `Get-FileHash`, do PowerShell; o ambiente é Linux e usei `sha256sum`, que calcula o mesmo SHA-256.)

- **Prova de remoção:**

```
$ unlink <tmp>/node_modules && rm -rf <tmp>
$ ls -d <tmp>
ls: cannot access '.../scratchpad/SINTETICO_TESTE_ENCANAMENTO_tmp2': No such file or directory
$ ls node_modules | wc -l   ->  457   (a instalação do repositório não foi tocada)
$ git status --porcelain    ->  (vazio antes de criar os dois documentos)
```

- **Fora do diretório temporário:** `/tmp/_pm` (extração de imagens do PDF do manual), apagado no mesmo comando. O rascunho deste relatório e os apêndices ficaram na pasta de rascunho da sessão (`…/scratchpad/`), fora do repositório.

**Estado final (conferido depois de gravar os dois arquivos):**

```
$ git status --porcelain
?? docs/auditorias/AUDITORIA_PARTE2_2026-10-05.md
?? docs/planejamento/PROMPT_CORRECAO_POS_AUDITORIA_2026-10-05.md
$ git diff --stat HEAD   ->  (vazio: nenhum arquivo rastreado alterado)
```

`docs/auditorias/` e `docs/planejamento/` já existiam. Nenhum commit, push, merge ou rebase.

---

## 7. Nenhuma correção aplicada

Não corrigi nada, não executei o prompt de correção (nem parcialmente), não fiz commit nem push, não assinei nada e não preenchi `docs/PROVENIENCIA_ASSISTENCIA_IA.md`. Não toquei em `legado/pre_sarel/` nem em tag.

**O que as duas partes, juntas, sustentam (sem veredito de "pronto/limpo/robusto").**

- O programa **tem encanamento que liga** (exportação por perfil, invariantes 1, 2, 6 e 7 que recusam, guarda de pontos sintéticos por flag), mas várias garantias descritas nos documentos **não são barreiras** (A24, A25) e **parte do fluxo prometido não está ligada** (A22, A38).
- Há **resultados e figuras com aparência de achado** sem selo legível (A05, A07, A09, A31).
- Há **pelo menos três pontos em que o que o código mede diverge do que o texto afirma** em dado que alimenta a matriz de treino: janela e máscara GEE (A35), data do rótulo (A41), classe espectral exibida como classe de erosão (A32).
- O desenho de treino **segue a regra anterior** a D16/D24/D25/D26 (A29, A37, A46), e quem decide como religá-lo é o pesquisador.

**Último identificador usado: A54.**

---

# Apêndices (reprodutibilidade)

Todo dado dos apêndices é artificial e leva `SINTETICO_TESTE_ENCANAMENTO`. **Nenhum resultado das sondas é evidência científica**; provam só que a função se comporta de determinada forma.

## Apêndice A. Sonda D (D4 e D7): `SINTETICO_TESTE_ENCANAMENTO_d.probe.test.ts`

Executada com `vitest` e um config fora do repositório (o mesmo do apêndice E da Parte 1: `root` = repositório, alias `@` → `src`, `include` = o diretório temporário, `server.fs.strict = false`; com um *symlink* `node_modules`). Linhas de saída com prefixo `PROBE|`.

```ts
// SINTETICO_TESTE_ENCANAMENTO — sondas da Parte 2 (D2, D4, D7). Valores artificiais. NAO e evidencia cientifica.
import { it } from "vitest";
import { medido, tabelado } from "@/types/proveniencia";
import { montarLinhaDeBaseRUSLE } from "@/lib/rusle/linhaDeBase";
import { classificarPontoEspectral } from "@/lib/gee/amostragemBiofisica";
import { REGISTRO_DECISOES } from "@/config/decisoes";
const log = (k: string, v: unknown) => console.log(`PROBE|${k}|${typeof v === "string" ? v : JSON.stringify(v)}`);
const P = (v: number) => medido(v, "SINTETICO_TESTE_ENCANAMENTO", "2000-01-01", "2000-01-01T00:00:00Z");
it("D4: linha de base com os parametros que select-candidates/route.ts passa (ndvi, bsi, erodibilidade, camada)", () => {
  const lb: any = montarLinhaDeBaseRUSLE({
    ndviProveniencia: P(0.5), bsiProveniencia: P(0.1),
    erodibilidadeProveniencia: { estado: "tabelado", valor: "SINTETICO_TESTE_ENCANAMENTO", tabela: "x", chave: "x" } as any,
    camadaErodibilidade2024: { kSolos: 0.03, erodUm: "SINTETICO_TESTE_ENCANAMENTO", codUm: "x", ogcFid: 1, temUnidadeSoloMapeada: true, fronteiraCompartilhadaExata: false, causaZeroFeicoes: null } as any,
  });
  const est = (f: any) => f.estado === "indisponivel" ? `indisponivel(${f.causa})` : f.estado;
  log("D4.linhaDeBase.estados", { R: est(lb.fatorR), K: est(lb.fatorK), LS: est(lb.fatorLS), C: est(lb.fatorC), P: est(lb.fatorP), perdaSolo: est(lb.perdaSolo) });
  log("D4.decisoes.estado", { D13: (REGISTRO_DECISOES as any).D13?.estado, D15: (REGISTRO_DECISOES as any).D15?.estado, D14: (REGISTRO_DECISOES as any).D14?.estado });
});
it("D7: classificarPontoEspectral aceita valores fora do intervalo fisico?", () => {
  log("D7.classe(bsi=5, ndvi=-3) [fora de -1..1]", classificarPontoEspectral(5, -3));
  log("D7.classe(bsi=-5, ndvi=3)", classificarPontoEspectral(-5, 3));
  log("D7.classe(bsi=0.2, ndvi=0.3)", classificarPontoEspectral(0.2, 0.3));
  log("D7.classe(bsi=0.05, ndvi=0.5) [faixa entre criterios]", classificarPontoEspectral(0.05, 0.5));
});
```

## Apêndice B. Saída bruta das sondas (linhas `PROBE|`, truncadas a 600 caracteres)

Inclui as sondas da Parte 1 repetidas (C2, C3, C4, C6) e as novas (D4, D7). Uma observação: a linha `C3.kappa.resultado ... "kappa":1` vem da primeira sonda de Kappa, com formato de entrada errado (descartada na Parte 1); a válida é `PROBE|C3.kappa|...`.

```
PROBE|C3.kappa|{"kappa":-0.3333,"operacional":false,"alertaBloqueante":"ALERTA BLOQUEANTE: Índice Kappa de Cohen (-0.333, IC 95% [-1.00, 0.42]"}
PROBE|D4.linhaDeBase.estados|{"R":"indisponivel(insuficiente)","K":"tabelado","LS":"indisponivel(insuficiente)","C":"modelado","P":"tabelado","perdaSolo":"indisponivel(insuficiente)"}
PROBE|D4.decisoes.estado|{"D13":"decidida","D15":"decidida","D14":"decidida"}
PROBE|D7.classe(bsi=5, ndvi=-3) [fora de -1..1]|erosao
PROBE|D7.classe(bsi=-5, ndvi=3)|controle
PROBE|D7.classe(bsi=0.2, ndvi=0.3)|erosao
PROBE|D7.classe(bsi=0.05, ndvi=0.5) [faixa entre criterios]|indefinido
PROBE|C2.planilha.n_linhas|4
PROBE|C2.planilha.colunas|["Ponto_ID","Codigo","Latitude","Longitude","Latitude_DMS","Longitude_DMS","Municipio","Municipio_Origem","Codigo_IBGE","Codigo_IBGE_Origem","Bacia_Hidrografica","Bacia_Hidrografica_Origem","Bloco_Espacial","Estrato_ID","Elevacao_m","Elevacao_m_Origem","Declividade_pct","Declividade_pct_Origem","Declividade_graus","Declividade_graus_Origem","Curvatura_Perfil","Curvatura_Perfil_Origem","Curvatura_Plana","Curvatura_Plana_Origem","Acumulo_Fluxo","Acumulo_Fluxo_Origem","TWI","TWI_Origem","Ordem_Solo","Ordem_Solo_Origem","Subordem_Solo","Subordem_Solo_Origem","Grande_Grupo
PROBE|C2.planilha.csv_primeiras_linhas|["﻿# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar","# Emissão: 2026-10-06T14:23:29.384Z","# Total de registros recebidos: 4 | Emitidos no perfil: 4"]
PROBE|C2.interpretacao-cega.n_linhas|4
PROBE|C2.interpretacao-cega.colunas|["Codigo","Latitude","Longitude","Janela_Inicio","Janela_Fim","Referencia_Cena_Tile"]
PROBE|C2.interpretacao-cega.csv_primeiras_linhas|["﻿# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar","# Emissão: 2026-10-06T14:23:29.386Z","# Total de registros recebidos: 4 | Emitidos no perfil: 4"]
PROBE|C2.campo-cego.n_linhas|4
PROBE|C2.campo-cego.colunas|["Codigo","Latitude","Longitude","Latitude_DMS","Longitude_DMS","Municipio","Status_Fundiario","Motivo_Acesso","Codigo_CAR","Titular_Mascarado","Rota_Acesso"]
PROBE|C2.campo-cego.csv_primeiras_linhas|["﻿# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar","# Emissão: 2026-10-06T14:23:29.387Z","# Total de registros recebidos: 4 | Emitidos no perfil: 4"]
PROBE|C2.voo-cego.n_linhas|4
PROBE|C2.voo-cego.colunas|["Codigo","Latitude","Longitude","Area_Voo_Poligono"]
PROBE|C2.voo-cego.csv_primeiras_linhas|["﻿# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar","# Emissão: 2026-10-06T14:23:29.388Z","# Total de registros recebidos: 4 | Emitidos no perfil: 4"]
PROBE|C2.matriz-treino.n_linhas|4
PROBE|C2.matriz-treino.colunas|["Ponto_ID","Bloco_Espacial","Elevacao_m","Declividade_pct","Declividade_graus","Curvatura_Perfil","Curvatura_Plana","Acumulo_Fluxo","TWI","Ordem_Solo","Subordem_Solo","Grande_Grupo_Solo","Erodibilidade_Classe","Frequencia_Solo_Nu","Banda_B2","Banda_B4","Banda_B8","Banda_B12","NDVI","BSI","RUSLE_Fator_K","RUSLE_Fator_R","Precip_Acum_30d_mm","Precip_Acum_90d_mm","I30_Max_mm_h","N_Eventos_Erosivos","Indice_Mecanismo","Classe_Alvo_Binaria","Rotulo_Classe","Rotulo_Modalidade"]
PROBE|C2.matriz-treino.csv_primeiras_linhas|["﻿# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar","# Emissão: 2026-10-06T14:23:29.390Z","# Total de registros recebidos: 4 | Emitidos no perfil: 4"]
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

## Apêndice C. Comparação de pixels das figuras do manual (D1b)

```python
import subprocess,glob,os,hashlib,io
from PIL import Image
def ph(b):
    try: return hashlib.sha256(Image.open(io.BytesIO(b)).convert('RGB').tobytes()).hexdigest()
    except Exception: return None
cands={ph(open(f,'rb').read()):f for f in glob.glob('docs/images/*.png')+glob.glob('docs/figuras_manual/*.png')}
os.makedirs('/tmp/_pm',exist_ok=True)
subprocess.run('rm -rf /tmp/_pm/*; pdfimages -png docs/Manual_Instalacao_e_Operacao_SAREL.pdf /tmp/_pm/x',shell=True)
for p in sorted(glob.glob('/tmp/_pm/x*.png')):
    h=ph(open(p,'rb').read())
    if h in cands: print("igual a",cands[h])
subprocess.run('rm -rf /tmp/_pm',shell=True)
```

Saída: `igual a docs/images/SAREL.png`, `.../01-tela-principal.png` ... `.../07-Exportacao.png` (8 linhas, nenhuma de `docs/figuras_manual/`).

## Apêndice D. Arquivos com o mesmo nome e hash diferente (D8, A45)

```python
import subprocess,hashlib,os,collections
fs=[f for f in subprocess.check_output(['git','ls-files'],text=True).split('\n') if f and not f.startswith('docs/verificacoes/fontes')]
by=collections.defaultdict(list)
for f in fs: by[os.path.basename(f)].append(f)
for b,l in sorted(by.items()):
    if len(l)>1 and not b.endswith(('.py','.ts','.tsx')):
        hs=[hashlib.sha256(open(x,'rb').read()).hexdigest()[:10] for x in l]
        print("IGUAL    " if len(set(hs))==1 else "DIFERENTE",b,list(zip(hs,l)))
```

## Apêndice E. Polígonos de macrobacia (D2, A33)

```python
import importlib.util
spec=importlib.util.spec_from_file_location('t','scripts/treinar_xgboost_loco.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
print(len(m.BACIAS_PARANA),{k:len(v) for k,v in m.BACIAS_PARANA.items()})
for lat,lon in [(-24.0,-52.0),(-23.0,-51.0),(-26.0,-52.0),(-24.5,-50.5),(-25.0,-49.0)]:   # SINTETICO_TESTE_ENCANAMENTO
    print(lat,lon,m.identificar_bacia_real(lat,lon),any(m.ponto_em_poligono(lon,lat,a) for a in m.BACIAS_PARANA.values()))
```

Saída: `6 {'Bacia do Rio Tibagi': 10, 'Macrobacia Ivai (IAT)': 10, 'Bacia do Paranapanema': 10, 'Bacia do Rio Iguaçu': 12, 'Bacia do Rio Piquiri / PR 3': 8, 'Bacia Litorânea / Ribeira': 9}` e os 5 pontos artificiais dentro de polígonos (`True`): o *fallback* por retângulos **não** foi exercitado.
