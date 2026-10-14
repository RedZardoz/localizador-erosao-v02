# Prompt de Execução — Desenho de Pesquisa Consolidado

**Sistema de Amostragem e Rotulagem para Erosão Laminar (SAREL)** — PPGTCA 2026
**Versão:** 27/09/2026
**Branch:** `sarel/v2`, a partir de `8e9f56e`
**Supersede a ordem de fases de:** `PROMPT_OPERACIONALIZACAO_INTEGRAL_SAREL_2026-09-26.md` (a FASE 0 daquele prompt está concluída no commit `b83c5b7`; as demais são reordenadas aqui)
**Governa:** `docs/design.md` (9 Regras, 7 Invariantes)

**Por que este prompt existe.** O desenho de pesquisa mudou substancialmente depois da FASE 0, por três razões: (i) a auditoria integral de 26/09 revelou que a predição depende de uma cadeia inteiramente desconectada; (ii) a análise estatística do desenho amostral mostrou que o balanceamento 50/50 nunca foi implementado e que o XGBoost opera fora do seu regime de dados; (iii) três missões de VANT já executadas foram incorporadas e analisadas, o que substituiu premissas por medições.

---

> ## Como usar
>
> Sessão nova na raiz do repositório. Cole como primeira mensagem:
>
> ```
> Execute docs/planejamento/PROMPT_EXECUCAO_DESENHO_CONSOLIDADO_2026-09-27.md.
>
> Leia o arquivo inteiro antes de agir, mais docs/design.md e a PARTE 0 do
> prompt de operacionalizacao de 26/09 (as 13 posturas valem integralmente
> aqui e nao serao repetidas).
>
> A PARTE I e um portao: nenhuma fase comeca antes de o pesquisador registrar
> as decisoes ali listadas. Voce NAO edita src/config/decisoes.ts (P8).
>
> Antes de qualquer edicao:
> 1. confirme que as decisoes da PARTE I estao registradas com estado
>    "decidida"; se alguma faltar, PARE e informe qual;
> 2. reproduza os achados da PARTE II e cole a evidencia bruta;
> 3. declare o escopo da FASE A arquivo por arquivo e aguarde autorizacao.
>
> Relatorio ao fim de CADA fase. Nao encadeie fases sem confirmacao.
> ```

---

# PARTE 0 — POSTURA

Valem **integralmente** as 13 posturas da PARTE 0 de `PROMPT_OPERACIONALIZACAO_INTEGRAL_SAREL_2026-09-26.md`. Não são repetidas aqui para não divergirem entre cópias. Leia-as antes de prosseguir.

Reforço de duas, por serem as que mais falharam nesta sequência:

- **Postura 2** — procure a implementação correta antes de escrever outra. Boa parte do trabalho abaixo é *ligar* capacidade que já existe, não criar.
- **Postura 13** — critério de aceite que dispara sobre conteúdo correto é falso positivo a relatar, nunca conteúdo a alterar.

---

# PARTE I — PORTÃO: DECISÕES A REGISTRAR PELO PESQUISADOR

O agente **não executa nada** antes de estas constarem em `src/config/decisoes.ts` com `estado: "decidida"`. O agente **não as edita** — quem registra é o pesquisador, ou o agente de auditoria a pedido dele.

| ID | Título | Valor a registrar |
|---|---|---|
| **P03** (emenda) | Critério de casamento geodésico de campo | Substitui o limiar único de 15/25 m por três critérios independentes: (a) teto de erro grosseiro em **30 m**, que detecta ponto errado visitado e não qualidade; (b) critério real de integridade — o ponto observado permanece no **mesmo estrato** $\hat{S}$, $\hat{E}$, `nivelK` do sorteado, verificado por reextração de covariáveis na coordenada observada; (c) **acurácia GNSS ≤ 5 m** (meio pixel) como trava de qualidade, com aviso entre 5 e 10 m e rejeição acima de 10 m |
| **D03** (emenda) | Escala do rótulo | A coleta é **ordinal em 4 níveis** (`ausente`, `incipiente`, `moderada`, `severa`); a binarização canônica para o alvo é `ausente → 0` e os demais `→ 1`, conforme `montagem.ts:139-148`. Registrar explicitamente que **incipiente conta como positivo**, o que alarga a classe positiva e a torna mais heterogênea |
| **D06** (confirmação) | Unidade de análise | Permanece o **pixel de 10 m** do Sentinel-2, por decisão do pesquisador em 27/09. Consequência declarada: com acurácia posicional de campo de 3 a 8 m, a atribuição a pixel único é confiável em 37% a 58% dos casos; por isso a trava de meio pixel de P03 e a preferência por delineação sobre ortomosaico, cuja acurácia medida é de 1,47 m |
| **D16** (emenda) | Campanha de campo e voo | Instrumento de campo passa de KoboCollect para **SAREL Coletor** (Android, Galaxy M13, GNSS multiconstelação de frequência única). Os três grupos amostrais passam a ter funções e tamanhos distintos: **Fase A fotointerpretação 300 a 400 pontos** (treino), **Fase B campo 60 a 120 pontos** (medir a taxa de erro da Fase A), **Fase D voo 6 a 8 polígonos de ~20 ha** (teste independente). Antecede tudo um **lote piloto de 30 a 40 pontos** |
| **D22** (nova) | Fator P medido em campo | O fator P da RUSLE deixa de ser constante tabelada 1,0 nos pontos visitados e passa a ser derivado das variáveis coletadas pelo app: `presenca_terraco`, `estado_conservacao_terraco`, `sentido_plantio`, conforme Renard et al. (1997). Onde não houver visita, P permanece tabelado |
| **D23** (nova) | Regime amostral e correção de prevalência | Amostragem **estratificada desproporcional com probabilidade de inclusão $\pi_i$ registrada por ponto**, substituindo o balanceamento 50/50 nunca implementado. A alocação é calibrada pelo lote piloto. Toda afirmação sobre a bacia usa os estimadores de Olofsson et al. (2014); toda probabilidade predita exige correção a priori (King & Zeng, 2001), ancorada na prevalência estimada no piloto |
| **D24** (nova) | Regime de dados do XGBoost e mitigações | Declara que o tamanho amostral atingível fica abaixo do regime em que ensembles de árvores são estáveis (van der Ploeg, Austin & Steyerberg, 2014: RF exige EPV > 200; LR estabiliza em 20 a 50). Mitigações obrigatórias: **três competidores** (linha de base RUSLE, regressão logística penalizada, XGBoost), **restrições de monotonicidade** física no XGBoost, **dimensionalidade declarada antes** de ver resultado, e **validação cruzada aninhada e agrupada** por bloco espacial e por polígono |
| **D25** (nova) | Critério de refutação pré-registrado | Registrado **antes** da campanha: a hipótese é corroborada se, no conjunto held-out, a AUC atingir o limiar X **e** superar a linha de base RUSLE por margem Y; caso contrário é refutada. Os valores de X e Y são fixados pelo pesquisador neste registro e não são alterados depois |

**Pendente de decisão separada, não bloqueia as fases:** o vetor territorial oficial (IAT/ANA) em lugar dos polígonos simplificados, cujo erro de área medido vai de −24,8% a +33,0%.

---

# PARTE II — ESTADO VERIFICADO

Reproduza cada item antes de corrigir. Divergência exige parada.

## A — O aplicativo de campo (`sarel-coletor`, Kotlin/Compose)

Pontos fortes a preservar: coleta marcadores diagnósticos corretos de erosão laminar (pedestais e raízes expostas, exposição do horizonte B, espessura do horizonte A, crosta de selamento, microssulcos, sedimentação no sopé), grava `acuraciaGpsMetros`, coordenada observada, distância ao planejado e fotos nadir e panorâmica, e a cadeia cega é sólida — `PlannedPoint` carrega apenas código, município e coordenadas, coerente com o perfil `campo-cego`.

Defeitos:

- **A1** `GeoUtils.kt:6` — `P03_MAX_TOLERANCE_METERS = 150.0`. É a tolerância **superada**; a própria justificativa de P03 registra "readequado de 150 m para 15 m". 150 m são 15 pixels do Sentinel-2.
- **A2** `FieldCollection.kt` — `cego: Boolean = true` com o comentário "sempre true". A cegueira é de fato preservada hoje pelo modelo de dados, mas fixá-la em código a torna afirmação não verificável. Risco latente: `PlannedPoint.prioridade` ("alta"/"normal") não tem origem no perfil `campo-cego` e, se preenchido com base em suspeita de erosão, quebra a cegueira sem que nada acuse.
- **A3** Não há trava de acurácia no salvamento, nem espera de convergência do GNSS.
- **A4** `LocationTracker.kt` — valores de simulação (`4.2f`, `3.5f`, `2.5f`) podem alcançar registros reais.

## B — A ingestão no SAREL

O app exporta **28 colunas separadas por ponto-e-vírgula**; `ingestaoKobo.ts` espera 8 colunas por vírgula, e `data_observacao` virou `observadoEm`. **Vinte campos novos seriam descartados**, incluindo os que alimentam D22.

## C — Missões de VANT já executadas (medido em 27/09)

Sensor identificado pelos `cameras.json` do ODM: **MicaSense Altum** (2064 × 1544 multiespectral, térmica 160 × 120 — Altum original, não PT).

| Missão | Município | GSD nativo | Área reconstruída | Disparos | Reprojeção | GPS CE90 | Produtividade |
|---|---|---|---|---|---|---|---|
| 000 | Céu Azul | 3,59 cm | 6,84 ha | 159/164 | 0,692 px | **1,47 m** | 0,53 ha/min |
| 002 | Céu Azul | **737 cm** | inválida | 80/86 | 2,227 px | **1.979 m** | — |
| 009 | Medianeira | 3,96 cm | 21,56 ha | **200/200** | **0,585 px** | 7,04 m | **2,32 ha/min** |

Registro em `docs/verificacoes/voo/cobertura_voos.geojson` (commit `8e9f56e`).

- **C1** A Missão 002 é inutilizável: ortomosaico de 26 × 42 px a 6,3 m, 12 de 80 câmeras reconstruídas a 6 km a 5.400 km do bloco.
- **C2** A Missão 009 teve **60 de 260 capturas ignoradas** no processamento: `0000SET/000` traz IMG_0000 a IMG_0199 (processadas) e `0000SET/001` traz IMG_0200 a IMG_0259, com horários contínuos — é o mesmo voo, a câmera apenas rolou de pasta.
- **C3** As duas missões válidas estão em **zonas UTM diferentes** (32722 e 32721), pois o meridiano −54° as separa. Análise conjunta exige reprojeção ao padrão do projeto, EPSG:31982.
- **C4** A Missão 009 tem a melhor qualidade interna e o **pior georreferenciamento absoluto** (CE90 7,04 m contra 1,47 m da 000), com LE90 vertical menor que o horizontal — padrão que sugere deslocamento sistemático, não ruído.
- **C5** `PROJ_LIB` do PostGIS 3.6 quebra `rasterio` neste ambiente. Corrigido em `reduzir_terreno_copernicus.py` (F0.5); **qualquer script novo que use rasterio precisa da mesma isolação**.

## D — Cadeias desconectadas (da auditoria de 26/09)

Sem importadores: `montagemTemporal.ts`, `estatisticasSerie.ts`; e por consequência `harmonicos.ts` e `compostoSoloNu.ts`. Sem chamadores: todo o módulo `src/lib/chuva/` e todo o `src/lib/planet/` exceto `quota.ts`. Não existe rota `src/app/api/planet/`.

---

# PARTE III — FASES

Ordem determinada por **trava de calendário** primeiro, dependência técnica depois.

## FASE A — Coletor de campo utilizável

Bloqueia a campanha inteira. Duas bases de código.

**A.1 — App (Kotlin).** Alinhar `P03_MAX_TOLERANCE_METERS` ao valor registrado em P03, lendo de uma única constante documentada. Implementar os três critérios: teto de 30 m, trava de acurácia ≤ 5 m com aviso até 10 m e bloqueio acima, e espera de convergência do GNSS antes de habilitar o salvamento. Tornar `cego` **derivado**, não fixo, e impedir que a tela exiba qualquer covariável, estrato ou predição. Garantir que os valores de simulação não alcancem registros reais.

**A.2 — Ingestão (TypeScript).** Renomear `ingestaoKobo.ts` para `ingestaoColetorSarel.ts`, parsear ponto-e-vírgula, mapear `observadoEm`, e **ingerir os 20 campos novos**: os marcadores diagnósticos como evidência auditável do rótulo, e as variáveis de manejo para D22. Extrair features na **coordenada observada**, não na planejada. Implementar a verificação de integridade de estrato de P03(b).

**A.3 — Fator P medido (D22).** Derivar P de `presenca_terraco`, `estado_conservacao_terraco` e `sentido_plantio` conforme Renard et al. (1997), com selo `medido` onde houver visita e `tabelado` onde não houver.

**Aceite:** `grep -n "150" GeoUtils.kt` → zero; teste provando rejeição acima de 10 m de acurácia; teste provando que os 20 campos chegam ao ponto; teste provando P medido distinto de 1,0 onde há terraço.

## FASE B — Chuva e eventos erosivos

**Única fase travada por calendário.** Eventos não se agendam; quanto antes rodar, mais eventos entram na janela do mestrado.

CHIRPS diário e IMERG semi-horário via o padrão REST já existente em `copernicusGeeClient.ts:298-308`. Confirme o identificador exato da coleção IMERG no catálogo antes de escrever. Alimentar `RegistroChuvaDiaria[]` e `RegistroImergSemiHorario[]`, invocar `construirBlocoChuva`. Sem série suficiente, cada variável permanece `indisponivel` com causa formal.

**Após esta fase, D13 torna-se decidível.** Reporte a série obtida. **Não decida D13, não calcule R.**

## FASE C — Aproveitar os voos existentes

O ativo mais subutilizado do projeto.

**C.1** Reprocessar a Missão 009 com as **260 capturas**, não 200.
**C.2** Reprocessar a Missão 002 do zero, excluindo os quadros que impediram a convergência.
**C.3** Investigar o CE90 de 7,04 m da Missão 009 e verificar se o PPK foi aplicado — o `average_gps_std` de 3 m horizontal sugere que não.
**C.4** Implementar a **agregação zonal** de 5 cm para a grade de 10 m do Sentinel-2, conforme `docs/Ingestao_Processamento_Dados_Drone_Spectral2.md`, reprojetando ambas as missões a EPSG:31982.
**C.5** Com a delineação de erosão sobre os ortomosaicos, **medir o alcance $r$ do variograma sobre erosão real** — é o número que decide entre 11 e 118 polígonos no desenho da Fase D, e hoje é chute.

**Aceite:** ortomosaico da 009 com cobertura ampliada; 002 recuperada ou declarada perdida com evidência; tabela de agregação zonal com contagem de micropixels por célula; valor de $r$ medido e registrado em `docs/verificacoes/`.

## FASE D — Terreno bidimensional

Conforme a FASE 1 do prompt de 26/09, que permanece válida: `whitebox` como núcleo produtor de $A_s$ a 30 m sobre os tiles Copernicus, MERIT Hydro como validação externa, TWI destravado, curvaturas ligadas pelo padrão `execFile`. Acrescentar a isolação de `PROJ_LIB` (C5) a qualquer script novo.

**Após esta fase, D15 torna-se decidível.** **Não decida D15, não calcule LS.**

## FASE E — Série espectro-temporal e Planet

Conforme as FASES 2 e 3 do prompt de 26/09, com uma correção: o `dataReferencia` de `montarPreditoresTemporais` deve ser ancorado na **data do evento de chuva** vinda da FASE B, nunca em `observadoEm` ou `calculadoEm`. Ancorar errado faz a guarda de 24 meses de D04 vazar silenciosamente.

## FASE F — Higiene documental

Reorganizar `docs/legado/` em categorias, com três tratamentos distintos: superado e historicamente valioso move com entrada datada no índice; **contraditório e ainda em caminho ativo** recebe cabeçalho de superação dizendo o que o substituiu; atual fica e passa por varredura de alegações vencidas.

Alegações vencidas já identificadas: o balanceamento 50/50 afirmado como implementado; a validação LOCO por macrobacia, inviável num recorte de bacia única; as referências a Kobo; as menções a SRTM e ALOS como MDE, hoje fixado por D21. O índice registra **caminho antigo → caminho novo** para não deixar citação órfã.

Mover `docs/relatorios/modelagem/` para o legado: é benchmark *dry-run* corretamente marcado, mas está onde alguém procura resultados.

---

# PARTE IV — PROIBIÇÕES

**P1** Não decidir nem calcular R, LS e A. D13 e D15 seguem `pendente`. Permanecem rejeitadas a formulação de R por latitude/longitude/elevação (proxy de coordenada, Regra 6) e LS por rampa fixa de 30 m.

**P2** Não tocar na geração dry-run sintética de `treinar_xgboost_loco.py:300-329`, que está correta.

**P3** `montagem.ts` e `ingestaoDrone.ts` são referência, não alvo. Defeito neles: registrar e parar.

**P4** Fonte única de rótulo: `rotulosConsolidados`. Proibido fallback entre fontes de verdade.

**P5** Não alterar `src/lib/matriz/perfis.ts`. Ao ligar chuva e terreno você **popula** colunas que já existem.

**P6** Nenhuma imputação em variável biofísica. Fica registrado, sem execução: `treinar_xgboost_loco.py:676-677, 748, 788` ainda aplica `.fillna(mediana_treino)` sobre $X$.

**P7** Não relaxar guarda temporal nem espacial para fazer dado caber: nem os 24 meses de D04, nem o mínimo de 6 observações de D11, nem o piso de thinning de P02.

**P8** **Não editar `src/config/decisoes.ts`.** Nenhuma decisão, em nenhuma circunstância.

**P9** Nada commitado de `Dados de voo/` — 40 GB, ignorados desde `9c0f266`. Produtos derivados leves vão para `docs/verificacoes/voo/`.

**P10** Não tocar em `legado/`, `docs/legado/` ou dados de SAREL 1 fora da FASE F.

**P11** Assine os commits com **a sua própria identidade**, nunca com `Claude Opus 5`, e acrescente suas linhas à §3 de `docs/PROVENIENCIA_ASSISTENCIA_IA.md`.

**P12** Nenhuma asserção sem prova em `docs/verificacoes/`.

---

# PARTE V — RELATÓRIO POR FASE

1. Reprodução dos achados da fase, com evidência literal e linha real.
2. Diff completo por arquivo.
3. Saídas literais de `npx vitest run`, `npx tsc --noEmit`, `npm run build` e dos scripts Python pertinentes.
4. Prova de cada critério de aceite.
5. **Números concretos**: variáveis que passaram de `indisponivel` a `medido`; preditores ativos no Arquivo 05 antes e depois.
6. Novos modos de falha introduzidos, um por correção.
7. Bloco de achados incidentais acumulado, com âncora `arquivo:linha`.
8. Falsos positivos de critério de aceite, relatados e **não** contornados por edição de conteúdo.
9. Declaração de que D13 e D15 seguem `pendente`.
10. O que não foi feito e por qual proibição.
11. Suas linhas na §3 de `docs/PROVENIENCIA_ASSISTENCIA_IA.md`.

---

## Referências científicas do desenho

- King, G. & Zeng, L. (2001). Logistic Regression in Rare Events Data. *Political Analysis*, 9, 137-163.
- Minasny, B. & McBratney, A. B. (2006). A conditioned Latin hypercube method for sampling in the presence of ancillary information. *Computers & Geosciences*, 32, 1378-1388.
- Olofsson, P. et al. (2014). Good practices for estimating area and assessing accuracy of land change. *Remote Sensing of Environment*, 148, 42-57.
- Pontius, R. G. & Millones, M. (2011). Death to Kappa. *International Journal of Remote Sensing*, 32(15), 4407-4429.
- Renard, K. G. et al. (1997). *Predicting Soil Erosion by Water: RUSLE*. USDA-ARS Handbook 703.
- Riley, R. D. et al. (2019). Minimum sample size for developing a multivariable prediction model: PART II. *Statistics in Medicine*.
- Roberts, D. R. et al. (2017). Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure. *Ecography*, 40(8), 913-929.
- van der Ploeg, T., Austin, P. C. & Steyerberg, E. W. (2014). Modern modelling techniques are data hungry. *BMC Medical Research Methodology*, 14:137.
