# Auditoria Independente do Desenho de Pesquisa — SAREL / PPGTCA 2026

**Para:** Claude Opus 5.5, em sessão de nuvem, sobre o repositório clonado.
**Data:** 01/10/2026 · **Branch:** `sarel/v2`
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

Piso de ρ de Spearman ≥ 0,40, margem de 0,10 sobre o RUSLE, AUC ≥ 0,70, e **três desfechos** — corroborada, inconclusiva, refutada — com bootstrap cuja unidade de reamostragem é o polígono, logo com potência governada por 18 agrupamentos.

Questione: a calibragem de 0,40 e 0,10, escolhida entre uma estrita e uma permissiva com argumento que você deve julgar; se a potência com 18 agrupamentos torna o critério praticamente infalsificável, isto é, se "inconclusiva" será o desfecho quase certo; e se a estrutura ternária é rigor ou é porta de saída.

## 3.3 — D12 e D14: K̂ da carta de 2024, e não da estadual

O Opus 5 recomendou a "Opção A": o nível de erodibilidade vem de `erod_um` / `k_solos` da carta nacional `bra_erodibilidade_2024_sirgas2000`, e não do componente dominante da carta estadual do Paraná.

A medição que sustenta isso está em `docs/verificacoes/fontes/wfs_erodibilidade/amostra_dirigida_associacoes_2026-09-28.{md,json}` — 32 pontos, 8 unidades de associação — e **você pode reproduzi-la**, porque o GeoServer da Embrapa é público.

Questione: trocar um levantamento estadual por um nacional a 1:250.000 na dimensão que define os estratos; o fato, medido, de que duas das oito unidades recebem **níveis diferentes em pontos distintos**, sendo uma delas 47% das associações da bacia; e se registrar a discordância como limitação é suficiente ou se compromete a estratificação.

## 3.4 — D16: geometria de 224 m

Polígonos de 5,02 ha, 72 deles, quatro por estrato, em quadrado de 224 m ou retângulo até 1:2, substituindo 36 de 10 ha. O argumento: a elegibilidade de imóveis sobe de 43,4% para 71,8%, e as unidades efetivas se preservam porque dependem da **área total**, não do tamanho do polígono.

**Esta é a que você menos pode verificar**, porque depende do banco fundiário ausente. Mas você pode auditar o **raciocínio**: se unidades efetivas realmente dependem só da área total sob autocorrelação espacial; se o argumento de que a catena é preservada por mais polígonos menores se sustenta; e se o custo de 72 autorizações contra 36 foi pesado honestamente.

---

# 4. ALVO SECUNDÁRIO: COERÊNCIA GLOBAL DO REGISTRO

São 26 decisões, e **seis foram emendadas** — D06, D08, D12, D14, D16, D24 — algumas mais de uma vez. O Opus 5 as emendou uma a uma, conferindo localmente a cada emenda.

**Uma checagem de coerência entre todas não é feita desde 26/09**, e o desenho mudou muito depois: inversão de papéis entre VANT e campo, alvo contínuo, mudança de fonte de K̂, mudança de geometria.

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
- **Não execute o sorteio dos 36 polígonos**, nem em simulação. É operação irreversível por D23.
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

O estado atual: 48 arquivos de teste, 355 testes, suíte verde, `tsc` limpo. O sorteio dos 36 polígonos **ainda não ocorreu** e está travado à espera da medição da dimensão Ê, que depende de credenciais do Earth Engine.
