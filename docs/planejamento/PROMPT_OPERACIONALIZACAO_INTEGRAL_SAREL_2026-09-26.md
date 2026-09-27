# Prompt de Operacionalização Integral — Tornar o SAREL Executável Conforme Proposto

**Sistema de Amostragem e Rotulagem para Erosão Laminar (SAREL)** — PPGTCA 2026
**Versão:** 26/09/2026
**Branch de trabalho:** `sarel/v2`, a partir do commit `4ea31ba`
**Auditoria que originou este programa:** `docs/auditorias/Relatorio_Auditoria_Integral_Coerencia_Efetividade_2026-09-26.md`
**Etapas anteriores concluídas:** commits `53693a8`, `2774932`, `46bf35f`, `396c50e`, `207dca2`, `82bd7e7`, `903805a`, `4383d76`, `bb7e192`, `28b78e5`, `4ea31ba`
**Governa:** `docs/design.md` (9 Regras Invioláveis, 7 Invariantes)

**Objetivo declarado pelo pesquisador:** não entregar versão reduzida. Tornar executável o método que a dissertação descreve — série espectro-temporal, terreno bidimensional completo, regime pluviométrico episódico e linha de base RUSLE íntegra.

**Natureza deste programa:** ele **não decide** D13 nem D15. Ele constrói as pré-condições materiais que hoje tornam essas decisões impossíveis de tomar, e as devolve decidíveis ao pesquisador.

---

> ## Como usar
>
> Abra uma sessão nova do agente na raiz do repositório e cole o bloco abaixo.
>
> ```
> Execute docs/planejamento/PROMPT_OPERACIONALIZACAO_INTEGRAL_SAREL_2026-09-26.md.
>
> Leia o arquivo inteiro antes de qualquer ação, começando pela PARTE 0, e leia
> docs/design.md e o relatório de auditoria citado no cabeçalho.
>
> Este é um programa em 6 fases com dependências rígidas. NÃO execute fora de ordem.
>
> Antes de qualquer edição:
> 1. reproduza os bloqueios da PARTE II e cole a evidência bruta literal;
> 2. responda às QUESTÕES ABERTAS Q1 a Q4 com recomendação fundamentada e
>    aguarde as decisões — Q1 determina a viabilidade de D15 e é a mais grave;
> 3. para Q1, verifique de fato o que instala no ambiente Windows 11 deste
>    repositório antes de recomendar, e relate o que testou;
> 4. declare o escopo da FASE 0 arquivo por arquivo e aguarde autorização.
>
> Entregue um relatório ao fim de CADA fase e aguarde autorização para a seguinte.
> Não encadeie fases sem confirmação.
> ```

---

# PARTE 0 — POSTURA DE EXECUÇÃO

Contrato permanente. Não é crítica: as três execuções anteriores foram corretas e uma delas encontrou, por iniciativa própria, um código morto que o revisor não vira. Os treze itens consolidam o padrão.

1. **Não herde o escopo da ferramenta que você audita.** O varredor cobre `src/lib`, `src/app/api`, `src/store` e `src/config`; isso é objeto de auditoria, não escopo de busca. Varra `src` inteiro, `scripts/` e `data/` quando procurar um padrão.
2. **Procure a implementação correta antes de escrever uma nova.** Este programa existe em boa parte porque capacidade já implementada não está ligada. Antes de criar função, confirme que não existe.
3. **Toda correção declara o novo modo de falha que introduz.** Entre duas saídas honestas, prefira falha proporcional — descartar registro com contagem declarada — à falha total.
4. **Quando um número piora, entregue o número**, com casas decimais.
5. **Citação literal, nunca paráfrase**, em registro citável em defesa.
6. **Registre o achado incidental no instante em que o vê**, com âncora `arquivo:linha`, em bloco que cresce durante a execução.
7. **Duas leituras plausíveis com resultados diferentes: pergunte** — e execute o que não depende da resposta.
8. **Não afirme conclusão sem o artefato.**
9. **Prefira tornar o defeito visível a torná-lo ausente.** Nunca preencher, imputar, rotular por omissão ou arredondar.
10. **Mudança de assinatura ou contrato público é decisão declarada.**
11. **Coerência entre artefatos é parte da correção.** Ao mudar quantos registros um artefato emite, verifique todo artefato do mesmo pacote que declara essa contagem.
12. **Comentário normativo em código canônico é norma**, e norma pede busca por quem a viola.
13. **Critério de aceite que dispara sobre conteúdo correto é falso positivo a relatar, nunca conteúdo a alterar.** Se um `grep` deste prompt acusar algo legítimo, **pare e relate**; não edite documentação, rótulo de figura ou literal ilustrativo para deixar o instrumento verde. O mecanismo `// permitido:` exige justificativa científica com fonte — nunca prazo, nunca pendência.

---

# PARTE I — O QUE "OPERACIONAL CONFORME PROPOSTO" SIGNIFICA

Estado medido em 26/09/2026. O Arquivo 05 ajusta o XGBoost sobre **3 preditores**: `Elevacao_m`, `Declividade_pct` e `RUSLE_Fator_K`.

| Dimensão proposta | Estado hoje | Fase |
|---|---|---|
| Elevação, declividade | **medido** | — |
| Curvatura de perfil e plana | implementado em Python, **não ligado** | F1 |
| Acúmulo de fluxo / $A_s$ | **não implementado** | F1 |
| TWI | implementado, **bloqueado por $A_s$** | F1 |
| Bandas B2, B4, B8, NDVI, BSI (ponto) | **medido** | — |
| Banda B12 (SWIR-2) | **mede B11 e rotula B12** | F0 |
| Harmônicos, estatísticas de banda, composto de solo exposto | implementado, testado, **desconectado** | F3 |
| Chuva: acumulados, $I_{30}$, eventos erosivos, índice de mecanismo | implementado, **sem chamadores** | F2 |
| Solo, erodibilidade K | **medido / tabelado** | — |
| Fator C | modelado, **fora do domínio e sem teste do caminho ativo** | F0 |
| Fator R | retido por D13 — **impossível decidir sem série pluviométrica** | F2 → decisão |
| Fator LS | retido por D15 — **impossível decidir sem $A_s$** | F1 → decisão |
| Perda de solo $A$ | retida pelo Invariante 1 | consequência |

**Ativos já existentes que este programa liga, em vez de reescrever:**

- `scripts/reduzir_terreno_copernicus.py` (416 linhas) baixa tiles do Copernicus GLO-30 do AWS S3 para `data/dem_cache`, lê com `rasterio` e **já calcula curvaturas por Zevenbergen & Thorne (1987)** (linha 216) e **TWI por Beven & Kirkby (1979)** (linha 235), em EPSG:31982, devolvendo objetos `Proveniencia`. Hoje é chamado apenas por `scripts/verificacao/test_reduzir_terreno.py`.
- **A ponte Python↔aplicação já existe e é padrão do repositório:** `src/app/api/gee/select-candidates/route.ts:119-129` e `src/lib/fundiario/matcher.ts:134-146` usam `execFile(process.env.PYTHON_PATH || "python", args, { timeout, maxBuffer })`. Siga esse padrão; não invente arquitetura nova.
- `src/lib/chuva/` tem os contratos prontos: `RegistroChuvaDiaria { data, precipitacaoMm }` (`chirps.ts:17`) e `RegistroImergSemiHorario { timestamp, taxaMmH }` (`imerg.ts:19`), consumidos por `construirBlocoChuva` (`eventos.ts:117`). Falta apenas o cliente de ingestão.
- `src/lib/matriz/montagemTemporal.ts` expõe `montarPreditoresTemporais(cenas: ObservacaoCena[], tipoModelo, opcoes)` (linha 101). Falta apenas alguém que produza `ObservacaoCena[]`.

---

# PARTE II — BLOQUEIOS VERIFICADOS

Reproduza cada um antes de corrigir. Divergência de linha exige parada e relato.

## Bloqueio 1 — CRÍTICO: o sistema mede B11 e declara B12

`src/lib/gee/copernicusGeeClient.ts:227` solicita ao Earth Engine exatamente quatro bandas:

```ts
bandSelectors: { constantValue: ["B2", "B4", "B8", "B11"] },
```

E ambas as rotas gravam o valor de B11 no campo `b12`:

```ts
// src/app/api/gee/select-candidates/route.ts:711-717
const b12Proveniencia = medicaoS2
  ? { estado: "medido" as const, valor: medicaoS2.b11, ... }

// src/app/api/gee/inspect-point/route.ts:160-166
b12: { estado: "medido" as const, valor: medicaoS2.b11, ... }
```

O campo é exportado como coluna `Banda_B12` (`src/lib/export/planilha.ts:213`), consta da lista de permissão da matriz de treino, e `src/types/ponto.ts:25` nomeia harmônicos `"B12_amplitudeAnual"` e `"B12_tendencia"`.

No Sentinel-2 MSI, **B11 é SWIR-1 (~1610 nm)** e **B12 é SWIR-2 (~2190 nm)** — bandas fisicamente distintas, com feições de absorção diferentes. A metodologia do projeto invoca especificamente a degradação no SWIR B12 como sinal de solo exposto. Toda afirmação da dissertação sobre B12 seria, hoje, sobre B11.

**Ressalva de justiça, a preservar:** o uso de B11 no cálculo do BSI (`copernicusGeeClient.ts:365-366`) está **correto** — o BSI canônico emprega SWIR-1. O defeito é exclusivamente o rótulo `b12`, não o BSI.

Este bloqueio vem antes de F3: ligar harmônicos nomeados `B12_*` alimentados por B11 propagaria o erro para as features temporais.

## Bloqueio 2 — CRÍTICO: o Fator C excede o domínio físico e seu caminho ativo não tem teste

`src/lib/rusle/fatorC.ts:58-68` executa `((1 - ndvi) / 2) * (1 + bsiNum)`. Com $\text{BSI} \in [-1,1]$, o multiplicador $(1+\text{BSI}) \in [0,2]$:

| NDVI | BSI | C |
|---:|---:|---:|
| −1,00 | 1,00 | **2,0000** |
| 0,10 | 0,50 | 0,6750 |

O fator $C$ da RUSLE é razão adimensional em $[0,1]$ por construção (Renard et al., 1997). `calcularFatorC` valida **apenas as entradas**. Um $C = 2{,}0$ dobraria $A$.

`rusle.test.ts` exercita `calcularFatorC` com **um único argumento** nas linhas 30-32 e testa domínio de entrada nas 36-39. Nenhuma asserção passa BSI: o caminho que executa em produção é o único descoberto.

**Mérito a preservar:** o selo declara honestamente `"Híbrido SPD: C = ((1 - NDVI) / 2) * (1 + BSI) (Durigon et al., 2014 modulado por BSI)"` (`fatorC.ts:121`). Não há atribuição falsa. Conferi a publicação — Durigon et al. (2014), IJRS 35(2):441-453 — e o termo $(1+\text{BSI})$ não consta dela, mas o selo não afirma que consta.

## Bloqueio 3 — CRÍTICO: `adquiridoEm` é literal fixo em 31 selos `medido`

Datas de aquisição fixas em código nas duas rotas GEE: `"2023-10-31"` (10×), `"2023-12-31"` (2×), `"2022-01-01"` (6×), `"2023-01-01"` (2×), `"2020-11-05"` (8×), `"2020-01-01"` (1×). O mesmo Copernicus GLO-30 aparece como adquirido em `2022-01-01` e `2023-01-01`.

Os `PRODUCT_ID` reais existem em `ponto.rastreio.cenas` (exigidos pelo Invariante 4) e não propagam para o selo.

## Bloqueio 4 — GRAVE: $A_s$ não existe, e é o que trava TWI e LS

`scripts/reduzir_terreno_copernicus.py:249-252` devolve TWI `indisponivel` com motivo literal:

```
"TWI aguarda mapa de acúmulo de fluxo e área de contribuição específica real (Beven & Kirkby, 1979)."
```

Não há implementação de direção de fluxo D8 nem de área de contribuição em nenhum lugar do repositório. Isto bloqueia simultaneamente:
- **TWI** — $\text{TWI} = \ln(a / \tan\beta)$ exige $a$ = área de contribuição específica;
- **Fator LS por D15** — Desmet & Govers (1996) exige $A_s$ real em m²/m, e o planejamento veta constante silenciosa (`PROMPT_NOVO_PROJETO_2026-09-08.md:324`).

Ver **Q1**.

## Bloqueio 5 — GRAVE: o subsistema temporal não tem produtor de `ObservacaoCena[]`

`montarPreditoresTemporais` (`montagemTemporal.ts:101`) consome `cenas: ObservacaoCena[]` — série por cena. O cliente GEE devolve agregados de ponto: `MedicaoEspectralReal { b2, b4, b8, b11, ndvi, bsi, frequenciaSoloNu, classeWorldCover, ehFlorestaOuInelegivel, fonte }` (`copernicusGeeClient.ts:31-45`). Não há série por cena em nenhum ponto do caminho vivo.

Sem um produtor de `ObservacaoCena[]`, toda a subárvore temporal permanece morta, com 14 asserções verdes sobre código que não roda.

## Bloqueio 6 — GRAVE: D11 não é aplicada, o raio de thinning não é registrado

- D11 (`decidida`, mínimo de 6 observações válidas) é verificada em `persistenciaTemporal.ts:94` e `harmonicos.ts:62`, ambos fora do caminho vivo. `copernicusGeeClient.ts` não tem guarda de suficiência.
- `select-candidates/route.ts:291-294` relaxa `raioMetros` em 35% por iteração até piso de 800 m, abaixo do 1 km de P02, e `criterioSelecao` (`route.ts:578-584`) **não grava o raio efetivo** — apenas tercis, `nivelK`, `phiDiag` e semente.
- `route.ts:292` carrega `// permitido: registrado sem execucao na auditoria (... pendente revisao)`, usando o supressor da guarda para estacionar pendência.

## Bloqueio 7 — GRAVE: polígonos territoriais simplificados decidem pertencimento

Erro de área entre a geometria e a área que cada feature declara: `basin-parana3` **+20,6%** (149 vértices, declara 7.979 km², encerra 9.625 km²), `basin-corredor-foz-ceu-azul` **+33,0%**, `paranapanema` −24,8%, `piquiri` −16,7%, `litoral` −12,9%, `tibagi` +12,1%, `iguacu` +10,1%, `ivai` −5,1%. Método validado: os 28 polígonos municipais somam 14.053 km² contra 14.054 km² do agregado (concordância 0,0%), e os erros ocorrem nos dois sentidos.

Usados analiticamente em `select-candidates/route.ts:603` — `identificarBacia(lat, lon) || "Bacia Hidrográfica do Paraná 3"`, cujo fallback **afirma BP3** para ponto fora de todos os polígonos — e em `identificar_bacia_real` para definir `bloco_loco` da validação LOCO.

---

# PARTE III — QUESTÕES ABERTAS

## Q1 — Estratégia de área de contribuição específica ($A_s$). **A mais grave: determina a viabilidade de D15.**

Três caminhos, com custo e consequência metodológica distintos.

**(i) D8 local sobre os tiles Copernicus GLO-30 já cacheados.** `reduzir_terreno_copernicus.py` já baixa e lê os tiles com `rasterio`; acrescentar preenchimento de depressões, direção D8 e acumulação produz $A_s$ verdadeiro por pixel a 30 m:
$$A_s = \frac{N_{\text{células acumuladas}} \times \text{área da célula}}{\text{largura da célula}}$$
Casa com a premissa de 30 m de D15 e atende literalmente Desmet & Govers (1996) e Beven & Kirkby (1979). Custo: nova dependência de hidrologia. Candidatas a verificar **no ambiente Windows 11 deste repositório**: `pysheds`, `richdem`, `whitebox` (WhiteboxTools). **Teste a instalação de fato antes de recomendar** e relate o que funcionou e o que falhou.

**(ii) `MERIT/Hydro/v1_0_1`, banda `upa`, via Earth Engine.** Existe no catálogo, 3 arco-segundos (~90 m), `upa` em km² (float32, oceano = −9999), erro relativo de área de drenagem < 0,05 em 90% dos postos GRDC (Yamazaki et al., 2019). Imediato e citável.
**Ressalva técnica que você deve declarar ao pesquisador:** `upa` é **área de drenagem a montante** (bacia total), **não** a área de contribuição específica por largura unitária de contorno. Usar `upa` diretamente como $A_s$ seria substituição metodológica incorreta — converter exige largura de fluxo, que MERIT fornece apenas para rios (`wth`). Além disso, 90 m contra os 30 m declarados é degradação de escala em terreno com terraços de 15 a 40 m.

**(iii) Híbrido: (i) para produzir $A_s$, (ii) como camada independente de validação**, cruzando a rede de drenagem local contra MERIT. Posição científica mais forte: parâmetro na escala declarada, com verificação externa.

**Recomendação esperada:** (iii), com (i) como núcleo. Fundamente, não repita.

## Q2 — B11 e B12

Confirmar com o pesquisador que a metodologia exige SWIR-2 (B12), como declara. Recomendação: **acrescentar B12** ao `bandSelectors`, popular `b11` e `b12` cada um com sua banda, e **manter B11 no BSI**, que é o correto. A alternativa — renomear tudo para `Banda_B11` — preservaria o dado mas contrariaria a metodologia escrita e exigiria corrigir a nomenclatura dos harmônicos e o texto da dissertação.

## Q3 — Vetor territorial oficial

Substituir os polígonos simplificados pelo vetor oficial (shapefile IAT ou ottobacias ANA) para uso analítico — moldura amostral, `Bacia_Hidrografica`, `bloco_loco` — mantendo os simplificados para exibição. Alternativa provisória: declarar a tolerância de cada `area_km2` e eliminar o fallback da linha 603. Recomende, considerando o esforço de ingestão do vetor.

## Q4 — Emenda a D01

O código roda o híbrido $((1-\text{NDVI})/2)\cdot(1+\text{BSI})$ citando `decisoes: ["D01"]`, mas D01 decidiu $(1-\text{NDVI})/2$. Opções: emendar D01 para contemplar explicitamente o híbrido SPD com sua justificativa, ou criar decisão própria (ex.: D20) e fazer o selo citá-la. **Decisão do pesquisador; não execute.**

---

# PARTE IV — FASES

Dependências rígidas. **Relatório e autorização ao fim de cada fase.**

## FASE 0 — Correções de bloqueio (pré-requisito de tudo)

Nada de F1 a F5 começa antes de F0 estar verde.

**F0.1 — Identidade de banda (Bloqueio 1, conforme Q2).** Acrescentar `"B12"` ao `bandSelectors` (`copernicusGeeClient.ts:227`), estender `MedicaoEspectralReal` com `b12: number`, popular `b11` e `b12` cada um com sua banda nas duas rotas, e **preservar B11 no BSI**. Teste que asseverar `b11 !== b12` numa medição real ou mockada com valores distintos.

**F0.2 — Domínio do Fator C (Bloqueio 2).** Verificar a **saída**: $C \notin [0,1]$ devolve `indisponivel` com causa `"fora-do-dominio"` e motivo nomeando os insumos. **Proibido `Math.min`/`Math.max`** — Regra 2. Testes obrigatórios: o caso $C = 2{,}0$ (NDVI = −1, BSI = 1) resultando em indisponível; ao menos três pontos do caminho híbrido com BSI presente; e o caminho puro preservado.

**F0.3 — `adquiridoEm` verdadeiro (Bloqueio 3).** Derivar do `PRODUCT_ID` da cena para dados Sentinel-2; para produto estático (Copernicus GLO-30, carta pedológica Embrapa) usar a data de publicação da coleção, **uma única constante nomeada por coleção, documentada com fonte**, não literal repetido em 31 pontos. Acrescentar ao varredor a regra `adquiridoEm` com literal de data.

**F0.4 — D11 no caminho vivo e raio de thinning auditável (Bloqueio 6).** Guarda de suficiência amostral em `copernicusGeeClient.ts`: menos de 6 observações válidas devolve `indisponivel` com causa `"insuficiente"` citando D11. Gravar `raioThinningEfetivoMetros` em `criterioSelecao` e registrar cada iteração de relaxamento no log. Remover o `// permitido:` da linha 292 — se a violação da Regra 2 persistir até decisão de P02, ela **falha** a guarda, e isso é o comportamento correto (Postura 13).

### Aceite de F0
- `grep -n 'adquiridoEm: "' src/app src/lib -r` → zero linhas.
- `grep -nE 'Math\.(min|max)' src/lib/rusle/fatorC.ts` → zero linhas.
- Teste provando `C = 2.0` → `indisponivel`; teste provando `b11 !== b12`.
- `npx vitest run`, `npx tsc --noEmit`, `npm run build` verdes, com saídas coladas.

## FASE 1 — Terreno bidimensional completo (Bloqueio 4, conforme Q1)

**F1.1** Declarar as dependências que faltam em `requirements.txt`: `rasterio` já é importado por `reduzir_terreno_copernicus.py:50` e **não está declarado**; acrescentar também `numpy` explicitamente e a biblioteca de hidrologia escolhida em Q1.

**F1.2** Implementar, no script existente, preenchimento de depressões, direção D8 e acumulação de fluxo, derivando $A_s$ em m²/m por pixel. Não criar script novo.

**F1.3** Destravar o TWI já codificado (linha 235), substituindo o `indisponivel` da linha 249 pelo cálculo com $A_s$ real, **preservando o Invariante 5** (declividade nula → TWI `indisponivel`, causa `"fora-do-dominio"`).

**F1.4** Ligar o script à aplicação pelo padrão `execFile` já existente (`select-candidates/route.ts:119-129`, `matcher.ts:134-146`), populando `curvaturaPerfil`, `curvaturaPlana`, `acumuloFluxo` e `twi` com selo `medido` e proveniência real (fonte, tile, data da coleção, resolução).

**F1.5** Se Q1 escolher o híbrido (iii), acrescentar a camada MERIT como verificação independente e registrar a concordância em `docs/verificacoes/`.

### Aceite de F1
- Um ponto real inspecionado devolve as quatro variáveis com `estado: "medido"`.
- Ponto em superfície plana devolve TWI `indisponivel` por Invariante 5.
- Documento em `docs/verificacoes/` com a validação numérica: comparar $A_s$ local contra MERIT `upa` em ao menos 20 pontos, declarando a divergência e sua causa de escala.
- O censo de proveniência do Arquivo 01 passa a mostrar `Curvatura_Perfil`, `Curvatura_Plana`, `Acumulo_Fluxo` e `TWI` com contagem maior que zero.

**Após F1, D15 torna-se decidível.** Reporte isso ao pesquisador com os valores de $A_s$ obtidos. **Não decida D15, não calcule LS.**

## FASE 2 — Regime pluviométrico (Bloqueio A2)

**F2.1** Cliente de ingestão seguindo o padrão REST já usado (`copernicusGeeClient.ts:298-308`): série diária de `UCSB-CHG/CHIRPS/DAILY` e série semi-horária de IMERG. **Confirme o identificador exato da coleção IMERG no catálogo do Earth Engine antes de escrever** — não presuma versão — e declare no relatório qual usou e por quê.

**F2.2** Alimentar `RegistroChuvaDiaria[]` e `RegistroImergSemiHorario[]` e invocar `construirBlocoChuva` (`eventos.ts:117`), populando `Precip_Acum_30d_mm`, `Precip_Acum_90d_mm`, `I30_Max_mm_h`, `N_Eventos_Erosivos` e `Indice_Mecanismo` com proveniência real.

**F2.3** Sem série suficiente, cada variável permanece `indisponivel` com causa formal. Nenhum acumulado presumido.

### Aceite de F2
- Um ponto real devolve os cinco campos com selo `medido` e a janela temporal efetivamente consultada.
- Teste com série vazia e com série parcial, provando indisponibilidade formal em vez de zero.

**Após F2, D13 torna-se decidível** pela rota registrada (Waltrick et al., 2015, a partir de série pluviométrica). Reporte a série obtida. **Não decida D13, não calcule R.**

## FASE 3 — Série espectro-temporal por cena (Bloqueio 5)

**F3.1** Estender o cliente GEE com função que devolva série por cena — `ObservacaoCena[]` conforme `src/lib/gee/serieTemporal.ts:17` — com `PRODUCT_ID`, data, bandas e marcação de nuvem/sombra por cena, preservando as máscaras como descontinuidades reais (Regra 7).

**F3.2** Ligar `montarPreditoresTemporais` ao caminho vivo, o que aciona `definirJanelasModelo`, `ajustarHarmonicosBanda`, `construirEstatisticasBloco`, `extrairMetricasSoloExposto` e `analisarPersistenciaTemporal`.

**F3.3** Respeitar a guarda temporal de D04 no Modelo P (24 meses), que `montagemTemporal.ts` já implementa. **Não relaxe essa janela** — é a proteção contra vazamento temporal (Kaufman et al., 2012).

**F3.4** Harmônicos nomeados `B12_*` só depois de F0.1, para não nomear B12 sobre valor de B11.

### Aceite de F3
- Um ponto real devolve harmônicos, estatísticas de banda e diagnóstico de persistência com selo e `nObservacoesValidas` declarado.
- Ponto com menos de 6 observações válidas devolve indisponibilidade por D11.
- Nenhum módulo do subsistema temporal permanece sem importador: comprovar com a mesma varredura de importadores usada na auditoria.

## FASE 4 — Devolver D13 e D15 decidíveis

Não executa cálculo. Produz, para o pesquisador:

1. Distribuição de $A_s$ obtida em F1, com estatísticas e comparação MERIT.
2. Série pluviométrica obtida em F2, com cobertura temporal e lacunas.
3. Para D15: quadro comparativo entre Desmet & Govers (1996) e McCool et al. (1989) **sobre os dados reais**, com sensibilidade dos expoentes $m$ e $n$.
4. Para D13: as alternativas registradas em `DECISOES.md:223` avaliadas contra a série efetivamente disponível.

Depois disso, **pare**. D13 e D15 são atos do pesquisador em `src/config/decisoes.ts`.

## FASE 5 — Delimitação territorial (Bloqueio 7, conforme Q3)

**F5.1** Eliminar o fallback `|| "Bacia Hidrográfica do Paraná 3"` (`route.ts:603`): fora de todos os polígonos, `Bacia_Hidrografica` é `indisponivel` com causa `"sem-cobertura"`.
**F5.2** Conforme Q3, ingerir o vetor oficial para uso analítico, mantendo os simplificados para exibição.
**F5.3** Se a substituição for diferida, declarar a tolerância medida junto de cada `area_km2` — os erros de −24,8% a +33,0% da PARTE II.

### Aceite de F5
- Ponto fora de cobertura não recebe BP3 presumida.
- Documento em `docs/verificacoes/` com a comparação de área antes e depois.

---

# PARTE V — PROIBIÇÕES ABSOLUTAS

**P1 — Não decidir nem calcular R, LS e $A$.** D13 e D15 seguem `pendente` (`decisoes.ts:139`, `:156`). A trava de `linhaDeBase.ts:66-105` permanece intacta. Continuam válidas as rejeições das etapas anteriores: `R` por latitude/longitude/elevação (proxy de coordenada, Regra 6) e `LS` por rampa fixa de 30 m (constante silenciosa vetada em `PROMPT_NOVO_PROJETO_2026-09-08.md:324`).

**P2 — Não tocar na geração dry-run sintética** de `scripts/treinar_xgboost_loco.py:300-329`. Está correta: opt-in por flag, recusa por padrão na linha 252, marca d'água `CTRL-DRYRUN-`, `# permitido:` justificado, propagação de `eh_dryrun` ao relatório.

**P3 — `montagem.ts` e `ingestaoDrone.ts` são referência, não alvo.** Defeito neles: registrar e parar.

**P4 — Fonte única de rótulo.** `rotulosConsolidados`. Proibido fallback entre fontes de verdade em qualquer arquivo.

**P5 — Não alterar `src/lib/matriz/perfis.ts`** sem decisão explícita. Ao ligar chuva e terreno, as colunas **já existem** na lista de permissão: você as popula, não as cria.

**P6 — Nenhuma imputação.** Média, mediana, moda, zero ou constante em variável biofísica estão proibidas, com ou sem declaração. Fica registrado, **sem execução**: `treinar_xgboost_loco.py:676-677, 748, 788` ainda aplica `.fillna(mediana_treino)` sobre $X$ — item de rodada própria.

**P7 — Não relaxar guarda temporal nem espacial** para fazer dado caber: nem a janela de 24 meses de D04, nem o mínimo de 6 observações de D11, nem o raio de thinning.

**P8 — Q4 é do pesquisador.** Não emende D01 nem D02 por iniciativa própria.

**P9 — Não tocar em `legado/`, `docs/legado/` ou dados de SAREL 1** (Regra 9).

**P10 — Nenhuma asserção sem prova** em `docs/verificacoes/` (Regra 8), nenhum teste relatado verde sem saída colada.

**P11 — Assine os commits com a sua própria identidade, nunca com a de outro agente.** Cada mensagem de commit termina com `Co-Authored-By: <nome e versão do agente executor> <identificador>`. **Proibido usar `Claude Opus 5`**, que identifica o agente de auditoria e especificação desta sequência e não escreve o código das fases. O pesquisador declarará academicamente o uso de cada ferramenta, e atribuir a um agente o trabalho de outro corrompe esse registro. Use a mesma identidade em todos os seus commits — por exemplo `Co-Authored-By: Antigravity (Advanced Agentic Pair Programmer) <noreply@antigravity>`. A proveniência consolidada por commit está em `docs/PROVENIENCIA_ASSISTENCIA_IA.md`; ao concluir cada fase, acrescente ali as suas linhas.

---

# PARTE VI — RELATÓRIO POR FASE

Ao fim de **cada** fase, entregue e aguarde autorização:

1. Reprodução dos bloqueios da fase, com evidência literal e linha real.
2. Diff completo por arquivo.
3. Saídas literais de `npx vitest run`, `npx tsc --noEmit`, `npm run build` e das execuções Python pertinentes.
4. Prova de cada critério de aceite, com o artefato.
5. **Números concretos** (Postura 4): quantas variáveis passaram de `indisponivel` a `medido`, com contagem por ponto; preditores ativos no Arquivo 05 antes e depois.
6. Novos modos de falha introduzidos (Postura 3), um por correção.
7. Bloco de achados incidentais acumulado (Postura 6), com âncora.
8. Falsos positivos de critério de aceite encontrados (Postura 13), relatados e **não** contornados por edição de conteúdo.
9. Declaração de que D13 e D15 seguem `pendente` e que nenhum valor de R, LS ou $A$ foi produzido.
10. O que não foi feito e por qual proibição.

Ao fim de F3, acrescente o **quadro de efetividade**: a tabela da PARTE I atualizada, coluna a coluna, com o estado real medido.

---

## Referências normativas

- Regras e Invariantes: `docs/design.md:14-22` e `:70-79`
- Auditoria de origem: `docs/auditorias/Relatorio_Auditoria_Integral_Coerencia_Efetividade_2026-09-26.md`
- Decisões e parâmetros: `src/config/decisoes.ts`
- Implementação canônica da matriz: `src/lib/matriz/montagem.ts:93-234`
- Padrão de ponte Python: `src/app/api/gee/select-candidates/route.ts:119-129`, `src/lib/fundiario/matcher.ts:134-146`
- Padrão REST do Earth Engine: `src/lib/gee/copernicusGeeClient.ts:298-308`
- Terreno em Python: `scripts/reduzir_terreno_copernicus.py`

## Referências científicas

- Beven, K. J. & Kirkby, M. J. (1979). A physically based, variable contributing area model of basin hydrology. *Hydrological Sciences Bulletin*, 24(1), 43-69.
- Chen, T. & Guestrin, C. (2016). XGBoost: A Scalable Tree Boosting System. *Proceedings of KDD 2016*, 785-794.
- Desmet, P. J. J. & Govers, G. (1996). A GIS procedure for automatically calculating the USLE LS factor on topographically complex landscape units. *Journal of Soil and Water Conservation*, 51(5), 427-433.
- Durigon, V. L. et al. (2014). NDVI time series for monitoring RUSLE cover management factor in a tropical watershed. *International Journal of Remote Sensing*, 35(2), 441-453.
- Kaufman, S. et al. (2012). Leakage in data mining: formulation, detection, and avoidance. *ACM TKDD*, 6(4), 1-21.
- McCool, D. K. et al. (1989). Revised slope length factor for the Universal Soil Loss Equation. *Transactions of the ASAE*, 32(5), 1571-1576.
- Renard, K. G. et al. (1997). *Predicting Soil Erosion by Water: RUSLE*. USDA-ARS, Agriculture Handbook 703.
- Roberts, D. R. et al. (2017). Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure. *Ecography*, 40(8), 913-929.
- Waltrick, P. C. et al. (2015). Erosividade de chuvas no Paraná. *Revista Brasileira de Ciência do Solo*, 39(1), 256-267.
- Yamazaki, D. et al. (2019). MERIT Hydro: A high-resolution global hydrography map based on latest topography dataset. *Water Resources Research*, 55(6), 5053-5073.
- Zevenbergen, L. W. & Thorne, C. R. (1987). Quantitative analysis of land surface topography. *Earth Surface Processes and Landforms*, 12(1), 47-56.
