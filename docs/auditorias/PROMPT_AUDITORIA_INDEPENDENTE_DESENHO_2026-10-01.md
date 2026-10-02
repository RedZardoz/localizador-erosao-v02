# Auditoria Independente do Desenho de Pesquisa — SAREL / PPGTCA 2026

**Para:** Claude Opus 5.5, em sessão de nuvem, sobre o repositório clonado.
**Data:** 01/10/2026, **atualizado em 02/10/2026** · **Branch:** `sarel/v2`
**Atualização:** acrescentada a seção datada ao fim do item 1 e corrigidos os números que
envelheceram. O corpo original de 01/10 não foi reescrito.
**Natureza:** auditoria de **desenho e decisões**, não caça a bug de implementação.

---

# 1. POR QUE VOCÊ FOI CHAMADO

Esta pesquisa é conduzida pelo mestrando **Luís Alfredo Ferreira da Silva** (PPGTCA, UTFPR), com dois agentes de IA declarados academicamente:

- **Antigravity** — agente executor, escreve o código sob prompt especificado.
- **Claude Opus 5** — escreve as especificações, verifica os relatórios do executor e registra as decisões.

O problema é estrutural: **o Opus 5 escreveu as especificações e depois verificou a execução contra elas.** Isso detecta bem os erros do executor — e detectou muitos — mas é cego para os erros do próprio Opus 5, porque a verificação confere contra a especificação que ele mesmo redigiu.

**Você está aqui para auditar o que ele não consegue auditar.** Conteste nominalmente os juízos dele. A execução do Antigravity já foi verificada fase a fase, e os registros estão em `docs/verificacoes/` — 58 arquivos. Repetir aquilo tem retorno baixo.

## Calibragem: erros que o Opus 5 cometeu e corrigiu sozinho

Para você entender o tipo de falha a procurar, e o tipo que já foi pego:

- Afirmou que a ausência de `.env` significava falta de credenciais do Earth Engine. Era falso: o `.env.example` documenta que as credenciais vão pela interface.
- Acusou o executor de anexar sufixo ao campo `cod_um2`; na verdade existe um campo `cod_um` ao lado, e os valores relatados eram dele.
- Suspeitou que um ponto de controle fosse falsa inclusão numa represa; medindo, as duas cartas diziam solo.
- Levantou a hipótese de câmera Altum-PT a partir de "7 bandas"; a especificação da estação dizia Altum simples.

Em todos ele se corrigiu **porque resolveu medir**. Os que não lhe ocorreu checar seguem no repositório. Esse é o seu alvo.

## O padrão que mais apareceu: valor fabricado com nome da fonte real

**Três vezes, em três fases diferentes**, surgiu um valor produzido sem a sua fonte, carregando
metadado que afirma a fonte. Os três foram encontrados e corrigidos, mas você deve supor que
há um quarto.

| Onde | O que foi fabricado | Nome que usava |
|---|---|---|
| Planos de voo | altitudes por trigonometria da coordenada | `amostradorGLO30` |
| Planos de voo | dois `.plan` com altitudes sintéticas, sem marcação | `jornada_01_*.plan` |
| Pipeline amostral | a dimensão Ê inteira, por contador | `definicao: s2_sr_harmonized_2016_2026_...` |

O terceiro foi o pior: `frequenciaSoloNu` tinha **correlação de +0,9999 com o índice no
arquivo** e de −0,12 com a latitude. Era um contador, apresentado como *"Distribuição Real
Medida"*, e teria estratificado a campanha inteira. Registro completo em
`docs/verificacoes/2026-10-01_FABRICACAO_frequencia_solo_nu.md`.

**O teste que os revela é barato e você deve rodá-lo em todo artefato numérico:** correlação da
série com o índice do arquivo, e com latitude e longitude. Medição de campo não correlaciona com
a ordem do arquivo. Verifique também se a amplitude é fisicamente plausível — no caso do Ê, toda
a bacia cabia entre 7,01% e 7,68% de solo nu.

Existem agora cinco guardas contra isso, listadas na seção datada acima. **Teste se elas
funcionam de fato**; não as aceite por existirem. O diário de requisições, que em 01/10 ainda não
tinha sido exercitado por medição alguma, foi exercitado em 02/10 pelo download real do CHIRPS —
**é o primeiro caso em que a guarda operou sobre dado externo verdadeiro, e vale conferir se
operou direito.**

Há também um detalhe que ilustra o quanto o padrão é persistente: ao declarar o cache pedológico
autêntico — e ele **é**, confirmei por medição independente — o relatório afirmou que as entradas
continham os campos `ogc_fid` e `cod_um`. Elas têm quatro campos, e nenhum é esses. A conclusão
estava certa e a evidência oferecida para ela era inventada.

## O que mudou entre 01/10 e 02/10, e que você deve conhecer

Esta seção é acrescentada por data. O que vier depois soma-se a ela, sem reescrever o resto.

**A linha de base RUSLE não existe.** D13 e D15 foram implementadas, mas o **fator R está
`indisponivel`**: os coeficientes `107,52` e `46,89` não foram encontrados em fonte arquivada —
procurei no PDF do Waltrick et al. (2015), que está no repositório, e eles não estão lá — e os
coeficientes foram desativados em lugar de mantidos sem procedência. Isso é o comportamento certo,
e significa que **o `rho_RUSLE` de D25 ainda não pode ser calculado**. Não audite D25 supondo que
a régua existe.

**O fator LS teve suas constantes conferidas por OCR** sobre o `ah_703.pdf`, que é escaneamento
sem camada de texto. A saída bruta do OCR está em
`docs/verificacoes/fontes/renard1997/saida_ocr_renard_1997.txt`. É a primeira conferência real de
coeficiente contra fonte primária nesta pesquisa — **verifique-a**.

**O CHIRPS foi efetivamente baixado**: 12 arquivos mensais em `data/chirps_cache/` (não
versionados), com diário de requisições em `docs/verificacoes/diario_climatologia_chirps_bp3.json`
— 12 chamadas, HTTP 200, 175 MB, carimbos de tempo coerentes. Foi o primeiro exercício real da
guarda de diário, e o download é autêntico.

**Mas os 12 meses são todos de 2022, e o artefato se chama climatologia.** O título de D13 diz
*"CHIRPS climatológico"*, e `docs/verificacoes/climatologia_chirps_bp3.json` tem
`tipo: "climatologia_chirps_mensal_bp3"` com `periodo: "2022 (12 meses completos)"`. **Um ano não
é uma climatologia.** O período está declarado com honestidade, o que afasta fabricação — mas o
rótulo afirma uma propriedade que o dado não tem, que é a família de defeito que esta pesquisa
vem perseguindo.

**CORRIGIDO EM 02/10, E A CORREÇÃO É CONTRA MIM.** Ao escrever isto eu supus que 2022 fora ano
seco, por La Niña, e que a climatologia de um ano enviesaria a erosividade **para baixo**. A série
completa foi baixada no mesmo dia — 540 meses, 1981-01 a 2025-12 — e **mediu o contrário**: 2022
foi mais chuvoso que a média de 45 anos em cinco das seis estações, até **+34,5% em Palotina**,
+19,9% em Medianeira, +19,0% em Santa Helena. Toledo, a estação de que eu me vali, ficou a
**−1,35%** da média, isto é, praticamente nela. **Minha hipótese foi refutada em direção e em
magnitude.** O viés existiria e seria grande, mas **para cima**.

O que sobrevive, e sai reforçado, é o argumento geral: o desvio de um ano varia de −1,35% a
+34,5% **dentro da mesma bacia**, de modo que um ano não representa nem o período nem o espaço.
Registro a refutação porque o prompt pedia conclusão falsificável e a minha conjetura foi a coisa
falsificada. Hoje nada disso propaga número, porque R está `indisponivel`; **propagaria assim que
os coeficientes aparecessem.**

E não é lacuna da decisão: **D13 proíbe isto em palavras.** A cláusula (b) diz "R CLIMATOLÓGICO,
média de longo prazo sobre toda a série disponível, e NÃO erosividade de um ano", e explica a
razão — "usar R anual faria o preditor descrever um período que o rótulo não representa". O
executor fez exatamente o que a decisão veda. **Audite, então, por que a violação não foi
detectada:** o script passou nos testes, emitiu diário, declarou o período com honestidade e foi
relatado como cumprimento de H2. Nenhuma guarda compara o artefato produzido contra o texto da
decisão que o governa — e essa ausência é mais interessante que o erro em si.

**O protocolo cego estava violado na interface web, e foi corrigido.** `InspetorPonto.tsx` gravava
rótulo carimbando `cego: true` como literal numa tela que exibia o estrato e os tercis. Hoje
`cego` é derivado do modo, e há separação testada entre modo de registro e modo de inspeção.
**Verifique se a separação é real**, não apenas declarada.

**As guardas acumuladas são estas**, e nenhuma deve ser aceita por existir — todas em
`src/lib/seguranca/`, salvo a última:

| Guarda | Contra o que |
|---|---|
| `detectorSequencia.ts` | série fabricada que correlaciona com índice ou coordenada |
| `diarioRequisicoes.ts` | medição externa afirmada sem requisição registrada |
| `credenciaisSeguras.ts` | caminho de credencial resolvendo dentro da árvore do repositório |
| `guardaSintetico.ts` | artefato de campanha sintético emitido sem marca |
| `localOnly.ts` | saída de rede onde a decisão exige processamento local |
| `sessaoEfemera.ts` | credencial persistida além da sessão |
| `cegamentoArtefatos.test.ts` | código opaco e identificador de polígono no mesmo arquivo versionado |
| `sorteioPoligonos.ts:88` | gravação do selo em caminho não coberto pelo `.gitignore` |

**Teste todas.** A última usa `git check-ignore`; pergunte-se o que ela faz quando o comando não
está disponível no ambiente.

**Os códigos opacos do intérprete passaram a nascer no selo do sorteio**, que é ignorado pelo git
por conter a tabela reversa do cegamento. Antes nasciam na exportação e mudavam a cada execução.

**O front-end foi alinhado** à metodologia vigente: Kobo e fotointerpretação movidos para legado
marcado, fração contínua de D26 presente, painel do critério de D25 com os três desfechos, e a
área de interesse extraída para `src/config/areaInteresse.ts`.

---

# 2. O QUE VOCÊ TEM, E O QUE NÃO TEM

Verificado antes de escrever este prompt.

## Disponível no clone

- Todo o código-fonte. 419 arquivos versionados.
- **`src/config/decisoes.ts`** — 26 decisões (D01 a D26) e 9 parâmetros (P01 a P09), com `valor`, `justificativa`, `referencia`, autor e data. É o documento normativo central.
- **`docs/verificacoes/`** — 58 arquivos: registros de verificação do Opus 5, scripts de medição e seus artefatos brutos.
- **16 artefatos JSON de medição**, com os dados que sustentam as decisões.
- `docs/verificacoes/fontes/doc246/` — script de extração do *Documentos 246* da Embrapa **e sua saída bruta**, de modo que a cadeia de citação é verificável sem o PDF.
- `docs/planejamento/` — todos os prompts executivos.
- `docs/auditorias/Relatorio_Auditoria_Integral_Coerencia_Efetividade_2026-09-26.md` — a auditoria anterior, de 26/09. **O desenho mudou substancialmente depois dela.**
- Rede, para os serviços públicos: GeoServer da Embrapa (`https://geoinfo.dados.embrapa.br/geoserver/ows`) e os tiles do Copernicus DEM no S3 da AWS.

## NÃO disponível

- **`data/fundiario_brasil.db`** — 1,6 GB, não versionado. Logo você **não pode reproduzir** as medições de imóveis rurais: os 73.643 imóveis do envelope, a mediana de 11,7 ha, as frações de elegibilidade de 43,4% e 71,8%.
- **`data/dem_cache/*.tif`** — 4 tiles, não versionados. Você pode baixá-los do S3 se quiser recomputar terreno.
- **Credenciais do Earth Engine.** Nenhuma medição que dependa do GEE pode ser reproduzida.

**Quando um número depender de fonte indisponível, diga isso.** Não o aceite por confiança nem o conteste por suposição: classifique como *não reproduzível neste ambiente* e, se for material, indique a consulta exata que o pesquisador deve rodar na máquina dele.

---

# 3. ALVO PRIMÁRIO: OS QUATRO JUÍZOS DO OPUS 5

São escolhas dele que viraram decisão registrada. **Ninguém além dele as examinou.** Ataque o raciocínio, não só a aritmética.

## 3.1 — D24: tetos de preditores por bloco

Afirma que as unidades espacialmente independentes são cerca de 1.836 no bloco espectro-temporal, 396 no terreno a 30 m, e 36 em solo e em chuva; e fixa tetos de 8, 4, 1 e 1 preditores, invocando van der Ploeg, Austin e Steyerberg (2014) e o critério de 200 observações por variável.

Questione: o fator de deflação por autocorrelação (alcance assumido de 50 m, não medido); se o critério de observações por variável se aplica como usado, dado que o alvo primário de D26 é **contínuo** e não binário; e se os tetos de terreno, solo e chuva — que a própria decisão admite excederem o que o critério suportaria, por necessidade física do Invariante 1 — são defensáveis ou são racionalização.

## 3.2 — D25: critério de refutação

Piso de ρ de Spearman ≥ 0,40, margem de 0,10 sobre o RUSLE, AUC ≥ 0,70, e **três desfechos** — corroborada, inconclusiva, refutada — com bootstrap cuja unidade de reamostragem é o polígono, logo com potência governada pelo número de agrupamentos do held-out, hoje **36**.

Questione: a calibragem de 0,40 e 0,10, escolhida entre uma estrita e uma permissiva com argumento que você deve julgar; se a potência com 36 agrupamentos torna o critério praticamente infalsificável, isto é, se "inconclusiva" será o desfecho quase certo; e se a estrutura ternária é rigor ou é porta de saída.

**Contexto que o Opus 5 já corrigiu, e que você deve auditar como DECISÃO e não como aritmética:** quando D25 foi redigida o held-out tinha 18 agrupamentos, e a justificativa da estrutura ternária repousava nisso. A emenda de geometria de D16 elevou-o a 36 — de faixa claramente problemática para faixa de fronteira. A premissa **enfraqueceu sem desaparecer**, e a estrutura foi **mantida** de forma deliberada, sob o argumento de que afrouxar critério pré-registrado porque a potência melhorou é a flexibilidade analítica que o pré-registro existe para impedir. **Julgue esse argumento.** Os números já foram corrigidos no commit `4d2919c`; o que resta auditar é a escolha.

## 3.3 — D12 e D14: K̂ da carta de 2024, e não da estadual

O Opus 5 recomendou a "Opção A": o nível de erodibilidade vem de `erod_um` / `k_solos` da carta nacional `bra_erodibilidade_2024_sirgas2000`, e não do componente dominante da carta estadual do Paraná.

A medição que sustenta isso está em `docs/verificacoes/fontes/wfs_erodibilidade/amostra_dirigida_associacoes_2026-09-28.{md,json}` — 32 pontos, 8 unidades de associação — e **você pode reproduzi-la**, porque o GeoServer da Embrapa é público.

Questione: trocar um levantamento estadual por um nacional a 1:250.000 na dimensão que define os estratos; o fato, medido, de que duas das oito unidades recebem **níveis diferentes em pontos distintos**, sendo uma delas 47% das associações da bacia; e se registrar a discordância como limitação é suficiente ou se compromete a estratificação.

## 3.4 — D16: geometria de 224 m

Polígonos de 5,02 ha, 72 deles, quatro por estrato, em quadrado de 224 m ou retângulo até 1:2, substituindo 36 de 10 ha. O argumento: a elegibilidade de imóveis sobe de 43,4% para 71,8%, e as unidades efetivas se preservam porque dependem da **área total**, não do tamanho do polígono.

**Esta é a que você menos pode verificar**, porque depende do banco fundiário ausente. Mas você pode auditar o **raciocínio**: se unidades efetivas realmente dependem só da área total sob autocorrelação espacial; se o argumento de que a catena é preservada por mais polígonos menores se sustenta; e se o custo de 72 autorizações contra 36 foi pesado honestamente.

---

# 4. ALVO SECUNDÁRIO: COERÊNCIA GLOBAL DO REGISTRO

São 26 decisões, e **sete foram emendadas** — D06, D08, D12, D14, D16, D24, D25 — algumas mais de uma vez. O Opus 5 as emendou uma a uma, conferindo localmente a cada emenda.

**Uma checagem de coerência entre todas continua não feita desde 26/09**, e o desenho mudou muito depois: inversão de papéis entre VANT e campo, alvo contínuo, mudança de fonte de K̂, mudança de geometria.

**Delimite o crédito desta ressalva, porque ela é estreita de propósito.** Em 02/10 o Opus 5 encontrou e corrigiu uma incoerência deste tipo: D24 e D25 ainda diziam 18 agrupamentos held-out e 918 unidades efetivas depois que a emenda de geometria de D16 os havia levado a 36 e 936 — e o corpo de D24 contradizia a nota que a própria emenda lhe acrescentara. Foi corrigido em `4d2919c`. **Mas essa checagem cobriu UMA grandeza, a contagem de agrupamentos, e foi disparada por acaso, ao preparar este prompt.** Nenhuma varredura sistemática do registro foi feita. Presuma que há outras defasagens do mesmo tipo e **procure-as**: é exatamente o modo de falha que a revisão local decisão-por-decisão não pega.

Procure:

- decisão que ficou **órfã** — referenciada por outra que já mudou de pressuposto;
- decisão que **contradiz** outra sem que a contradição esteja declarada;
- número citado em duas decisões com **valores diferentes**;
- dependência declarada que **deixou de existir**, ou que existe e não está declarada;
- limitação declarada numa decisão que **invalida** afirmação feita em outra.

Confira também os **9 invariantes** e as **9 Regras Invioláveis** em `docs/design.md` contra o estado atual do código e das decisões.

---

# 5. ALVO TERCIÁRIO: O DESENHO CONTRA A LITERATURA

Era o combinado original com o pesquisador, e é o item de maior valor para a banca.

A pesquisa quer **localizar e predizer erosão laminar** na Bacia do Paraná 3 por aprendizado de máquina sobre sensoriamento remoto, testando se o XGBoost supera a linha de base RUSLE. O rótulo vem de delineação sobre ortomosaico de VANT a ~4 cm; a unidade é a célula Sentinel-2 de 10 m; o alvo primário é a fração erodida contínua.

Avalie com a literatura em mãos, e **cite o que conferir**:

- o desenho amostral estratificado e a estimação por Horvitz-Thompson, dada a alocação desproporcional de D23;
- a validação cruzada agrupada por polígono e o risco de otimismo por autocorrelação espacial;
- a escolha do alvo contínuo com objetivo Tweedie, e se a correlação de postos é a métrica de comparação certa entre RUSLE e modelos aprendidos;
- o regime de dados para ensembles de árvores, que D24 admite estar abaixo do recomendado em três dos quatro blocos;
- se a comparação com o RUSLE é justa, dado que D13 declara que o EI30 verdadeiro **não é obtenível** do CHIRPS diário e usa sucedâneo.

---

# 6. COMO AUDITAR, E COMO RELATAR

## Medir, não ler

Quase todo achado útil desta pesquisa veio de **rodar algo**, não de ler. Recompute. Consulte o GeoServer. Baixe um tile. Abra o artefato bruto e confira contra a prosa que o descreve.

Há precedente: em três rodadas seguidas, o artefato JSON estava correto e a tabela redigida à mão ao lado dele estava errada.

## Separe defeito de limitação declarada

Este repositório tem **muitas limitações declaradas de propósito**, escritas dentro das decisões — EI30 por sucedâneo, viés de tamanho de propriedade, discordância entre cartas pedológicas, ausência de incerteza no fator K, truncamento do domínio de declividade.

**Sinalizar uma limitação declarada como se fosse defeito descoberto é ruído**, e ruído caro, porque obriga o pesquisador a reler o que já sabia. Antes de apontar algo, procure se já está declarado — e, se estiver, a pergunta certa é se a declaração é **suficiente**, não se o problema existe.

## Cada achado com como verificar

Para cada um: o que está errado, onde, qual a consequência para o resultado da pesquisa, e **o comando ou a consulta que demonstra**. Achado sem forma de conferir não é útil a quem vai defender a dissertação.

## Classifique por consequência

- **Compromete o resultado** — invalida conclusão, ou produz estimativa enviesada.
- **Compromete a defesa** — é defensável, mas a banca vai perguntar e não há resposta pronta.
- **Compromete a reprodutibilidade** — o resultado está certo, mas outro pesquisador não conseguiria repetir.
- **Observação** — melhoria sem consequência das três acima.

Ordene por consequência, não por quantidade.

---

# 7. O QUE VOCÊ NÃO DEVE FAZER

- **Não edite nada.** Esta é auditoria. `src/config/decisoes.ts` é do pesquisador e nenhum agente o altera.
- **Não execute o sorteio dos 72 polígonos**, nem em simulação. É operação irreversível por D23.
- **Não refaça a verificação de código do executor** sem razão específica; está em `docs/verificacoes/`.
- **Não invente número.** Se a fonte não está disponível neste ambiente, diga.
- **Não suavize.** O pesquisador pediu auditoria sincera e tem histórico de aceitar achado desconfortável — inclusive quando contraria escolha dele.

---

# 8. CONTEXTO MÍNIMO PARA COMEÇAR

Leia nesta ordem:

1. `src/config/decisoes.ts` — inteiro. É o documento normativo.
2. `docs/design.md` — as 9 Regras Invioláveis e os 7 Invariantes.
3. `docs/auditorias/Relatorio_Auditoria_Integral_Coerencia_Efetividade_2026-09-26.md` — a auditoria anterior, para não repetir o que já foi corrigido.
4. `docs/verificacoes/` — os registros, em ordem cronológica. Os de 28/09 a 01/10 cobrem as mudanças de desenho mais recentes.
5. `docs/planejamento/` — os prompts, se quiser entender por que algo foi feito assim.

O estado atual, em 02/10/2026: **57 arquivos de teste, 423 testes**, suíte verde, `tsc` limpo. O sorteio dos **72 polígonos** de 5,02 ha **ainda não ocorreu** e está travado à espera da medição da dimensão Ê, que depende de credenciais do Earth Engine.
