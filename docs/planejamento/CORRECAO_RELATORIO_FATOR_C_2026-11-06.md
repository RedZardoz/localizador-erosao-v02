Este documento corrige as Tarefas 4 e 8 do relatório da sessão de 06/11/2026 (Fator C); a implementação daquela sessão, registrada no commit 992cec0, foi verificada e permanece válida.

## 1. Saída Bruta Integral — Tarefa C1 (`scripts/auditoria/listar_excecoes.mjs`)

```text
TOTAL_DE_EXCECOES	38
#	linha	id	arquivo	padrao	trecho	justificativa	autorizadoPor
1	30	EXC-DRYRUN-SINTETICO-XGBOOST	scripts/treinar_xgboost_loco.py	(sem tag)	bsi_spd = float(np.random.uniform	Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada	Auditoria 2026-10-05 / C06
2	37	EXC-DRYRUN-SINTETICO-XGBOOST	scripts/treinar_xgboost_loco.py	(sem tag)	ndvi_spd = float(np.random.uniform	Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada	Auditoria 2026-10-05 / C06
3	44	EXC-DRYRUN-SINTETICO-XGBOOST	scripts/treinar_xgboost_loco.py	(sem tag)	decliv = float(np.random.uniform	Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada	Auditoria 2026-10-05 / C06
4	51	EXC-DRYRUN-SINTETICO-XGBOOST	scripts/treinar_xgboost_loco.py	(sem tag)	elev = float(np.random.uniform	Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada	Auditoria 2026-10-05 / C06
5	58	EXC-DRYRUN-SINTETICO-XGBOOST	scripts/treinar_xgboost_loco.py	(sem tag)	perda_solo_spd = float(np.random.uniform	Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada	Auditoria 2026-10-05 / C06
6	67	EXC-UI-MAPVIEWER-ZOOM	src/components/map/MapViewer.tsx	coalescencia-com-numero	zoom: zoom ?? 14	Fallback de nível de zoom padrão da câmera do Mapbox na interface do usuário	Auditoria 2026-10-05 / C06
7	75	EXC-UI-MAPVIEWER-PITCH	src/components/map/MapViewer.tsx	coalescencia-com-numero	pitch: pitch ?? 50	Fallback de inclinação de perspectiva (pitch) da câmera 3D na interface do usuário	Auditoria 2026-10-05 / C06
8	83	EXC-UI-MAPVIEWER-BEARING	src/components/map/MapViewer.tsx	coalescencia-com-numero	bearing: bearing ?? 0	Fallback de rotação azimutal (bearing) da câmera do mapa na interface do usuário	Auditoria 2026-10-05 / C06
9	91	EXC-UI-FILTERSPANEL-DECLIVIDADE	src/components/sidebar/FiltersPanel.tsx	coalescencia-com-numero	value={filtros.declividadeMin ?? 0}	Piso numérico inicial do controle deslizante (slider) de filtro de declividade mínima na UI	Auditoria 2026-10-05 / C06
10	99	EXC-UI-GRAFICO-SERIE-GUARDA	src/components/inspetor/GraficoSerieTemporal.tsx	default-numerico-desestruturacao	GOV-5-DESTRUTURACAO-PROVISORIA	Fallback visual padrão de 12 meses para gráfico de série temporal	GOV-5 / 2026-10-30
11	107	EXC-UI-MAPA-CLAMP	src/components/mapa/MapaAmostral.tsx	corte-math-max-min-com-literal	clamp de posicao percentual na interface	Clamp de coordenadas de posicionamento percentual de elementos na interface do mapa	Auditoria 2026-10-30
12	115	EXC-UI-SPOTLIGHT-CLAMP	src/components/presentation/ApresentacaoSpotlight.tsx	corte-math-max-min-com-literal	clamp de coordenadas de tela para spotlight	Clamp de coordenadas de tela para renderização de overlay do spotlight	Auditoria 2026-10-30
13	123	EXC-UI-MODAL-COTA	src/components/region/CandidateSelectionModal.tsx	corte-math-max-min-com-literal	subtracao aritmetica de cota amostral inteira nao negativa	Cálculo de cota amostral remanescente inteira e validação de input de interface [0, 100]	Auditoria 2026-10-30
14	133	EXC-API-SELECT-CANDIDATES-LIMITE	src/app/api/gee/select-candidates/route.ts	(sem tag)	limite computacional de busca inicial de centroides no indice SQLite	Limite computacional de busca inicial de centroides no índice SQLite	Auditoria 2026-10-05 / C06
15	140	EXC-API-SELECT-CANDIDATES-NORMALIZACAO	src/app/api/gee/select-candidates/route.ts	(sem tag)	normalizacao de percentual de alocacao de subamostra da interface [0, 100]	Normalização de percentual de alocação de subamostra da interface [0, 100]	Auditoria 2026-10-05 / C06
16	147	EXC-API-SELECT-CANDIDATES-POOL	src/app/api/gee/select-candidates/route.ts	(sem tag)	criterio minimo de tamanho de pool elegivel para selecao de candidatos	Critério mínimo de tamanho de pool elegível para seleção de candidatos	Auditoria 2026-10-05 / C06
17	154	EXC-API-SELECT-CANDIDATES-COTA	src/app/api/gee/select-candidates/route.ts	(sem tag)	subtracao aritmetica de cota amostral inteira nao negativa entre subconjuntos	Subtração aritmética de cota amostral inteira não negativa entre subconjuntos	Auditoria 2026-10-05 / C06
18	161	EXC-API-SELECT-CANDIDATES-DESTRUTURACAO	src/app/api/gee/select-candidates/route.ts	default-numerico-desestruturacao	GOV-5-DESTRUTURACAO-PROVISORIA	Defaults provisórios de destruturação para amostragem no GEE (tamanhoAmostra, raioThinningKm, frequenciaSoloNuMin, declividadeMin, declividadeMax)	GOV-5 / 2026-10-30
19	169	EXC-LIB-ESTATISTICAS-SERIE-NMINIMO	src/lib/gee/estatisticasSerie.ts	default-numerico-desestruturacao	GOV-5-DESTRUTURACAO-PROVISORIA	Piso amostral mínimo nMinimo = 3 para cálculo de estatísticas de banda	GOV-5 / 2026-10-30
20	177	EXC-LIB-MONTAGEM-TEMPORAL-JANELA	src/lib/matriz/montagemTemporal.ts	default-numerico-desestruturacao	GOV-5-DESTRUTURACAO-PROVISORIA	Parâmetros de janela temporal intervaloGuardaMeses e duracaoJanelaAnos	GOV-5 / 2026-10-30
21	185	EXC-DEMO-PAINEL	src/components/campanha/PainelCampanha.tsx	(sem tag)	EXC-DEMO-PAINEL	Demonstração de cálculo matricial na interface com dados ilustrativos declarados	Auditoria 2026-10-30
22	192	EXC-FALLBACK-OFFLINE	src/lib/planet/ordersApi.ts	(sem tag)	EXC-FALLBACK-OFFLINE	Fallback de pedido simulado para desenvolvimento offline sem chave Planet	Auditoria 2026-10-30
23	199	EXC-LIB-AMOSTRAGEM-CLAMP-SOLO-NU	src/lib/gee/amostragemSoloNuLote.ts	(sem tag)	clamp de seguranca numerica para fracao normalizada de satelite no intervalo 0 a 1	Clamp de segurança numérica para fração normalizada de satélite no intervalo 0 a 1	Auditoria 2026-10-05 / C06
24	206	EXC-LIB-AMOSTRAGEM-TIMEOUT-REDE	src/lib/gee/amostragemSoloNuLote.ts	(sem tag)	timeout de rede de requisicao http em milissegundos para conexao gee	Timeout de rede de requisição HTTP em milissegundos para conexão GEE	Auditoria 2026-10-05 / C06
25	213	EXC-LIB-AMOSTRAGEM-REQUISICOES-EVITADAS	src/lib/gee/amostragemSoloNuLote.ts	(sem tag)	metrica contavel de requisicoes http poupadas no processamento em lote	Métrica contável de requisições HTTP poupadas no processamento em lote	Auditoria 2026-10-05 / C06
26	220	EXC-LIB-AUTH-SEGUNDOS-VALIDADE	src/lib/gee/auth.ts	(sem tag)	fallback de protocolo oauth2 rfc6749 para token expiravel	Fallback de protocolo OAuth2 RFC6749 para token expirável	Auditoria 2026-10-05 / C06
27	227	EXC-LIB-PLANET-QUOTA-TIMESTAMP	src/lib/planet/quota.ts	(sem tag)	auditoria de timestamp do livro-razao local	Auditoria de timestamp do livro-razao local	Auditoria 2026-10-05 / C06
28	234	EXC-LIB-RUSLE-FATOR-LS-DIVISOR	src/lib/rusle/fatorLS.ts	(sem tag)	divisor de aguas no topo da vertente sem area de montante afluente (A_in = 0)	Divisor de águas no topo da vertente sem área de montante afluente (A_in = 0)	Auditoria 2026-10-05 / C06
29	241	EXC-STORE-PAGINACAO-TOUR	src/store/useSarelStore.ts	(sem tag)	controle de indice de paginacao de interface do tour metodologico (>= 0)	Controle de índice de paginação de interface do tour metodológico (>= 0)	Auditoria 2026-10-05 / C06
30	248	EXC-TESTE-UNMASK-JRC	teste.ts	(sem tag)	const water = jrc.unmask(0);	Camada de exclusão booleana JRC sem dado no teste unitário	Auditoria 2026-10-05 / C06
31	255	EXC-DRONE-PLAN-TURNAROUND	src/lib/drone/planoVooNControl.ts	default-numerico-desestruturacao	turnAroundDistanceMeters = 10	Fallback de distância de manobra (turnaround) no formato .plan do NControl	GOV-5 / 2026-10-19
32	263	EXC-DRONE-PLAN-ENTRYLOCATION	src/lib/drone/planoVooNControl.ts	default-numerico-desestruturacao	entryLocation = 0	Vértice de entrada padrão (entryLocation) de survey no formato .plan	GOV-5 / 2026-10-19
33	272	EXC-UI-INSPETOR-GRAFICO	src/components/inspetor/InspetorPonto.tsx	coalescencia-com-colecao-vazia	janelaAtiva.observacoes ?? []	Fallback visual de coleção vazia para renderização de gráfico temporal na interface quando observações ainda não foram carregadas	Auditoria 2026-10-31 / Portões e Paridade
34	280	EXC-EMBRAPA-WFS-PROPS-BBOX	src/lib/embrapa/embrapaSoilClient.ts	coalescencia-com-colecao-vazia	const props = (f?.properties ?? {})	Extração defensiva de propriedades em feição GeoJSON retornada pelo serviço WFS GetFeatureInfo em BBOX da Embrapa	Auditoria 2026-10-31 / Portões e Paridade
35	288	EXC-EMBRAPA-WFS-PROPS-PONTO	src/lib/embrapa/embrapaSoilClient.ts	coalescencia-com-colecao-vazia	const props = (f?.properties ?? {})	Extração defensiva de propriedades em feição GeoJSON retornada pelo serviço WFS GetFeatureInfo pontual da Embrapa	Auditoria 2026-10-31 / Portões e Paridade
36	296	EXC-ROTULOS-HELDOUT-SET	src/lib/rotulos/ingestaoDrone.ts	coalescencia-com-colecao-vazia	new Set(param3 ?? [])	Normalização do conjunto de polígonos held-out para verificação de segregação quando conjunto não é informado	Auditoria 2026-10-31 / Portões e Paridade
37	304	EXC-SCRIPT-CACHE-PEDOLOGIA	scripts/remedir_candidatos_bp3_d16.ts	coalescencia-com-colecao-vazia	parsedCache.itens ?? {}	Fallback para cache vazio quando arquivo local cache_pedologia_bp3.json não possui chave itens, forçando re-medição	Auditoria 2026-10-31 / Portões e Paridade
38	312	EXC-DRONE-PLAN-STARTDOJUMPID	src/lib/drone/planoVooNControl.ts	default-numerico-desestruturacao	startDoJumpId = 2	Identificador de comando DO_JUMP no formato .plan do NControl	GOV-5 / 2026-10-19

CONTAGEM_POR_TAG
19	(sem tag)
7	default-numerico-desestruturacao
5	coalescencia-com-colecao-vazia
4	coalescencia-com-numero
3	corte-math-max-min-com-literal
```

## 2. Saída Bruta Integral — Tarefa C2 (`scripts/auditoria/mapear_citacao_metodologia.mjs`)

```text
OCORRENCIAS_EM_decisoes.ts
linha	id	titulo
86	D02	Critérios observacionais de presente/ausente e negativo explícito
121	D03	Escala do rótulo: coleta ordinal com binarização declarada
144	D05	Série de treino: Sentinel-2 exclusivo; Landsat só como camada de tendência, nunca preditor
158	D06	Unidade de predição: pixel 10m calibrado por VANT Multiespectral
171	D07	Domínio de validade: declividade 3 a 20%, WorldCover 30 e 40, concordância entre épocas
306	D16	Campanha: polígonos de VANT como massa de treino e teste, campo como âncora e confirmação
589	P03	Critério de casamento geodésico de campo com o ponto planejado

MAIOR_ID_D_NO_REGISTRO	D26

OCORRENCIAS_NO_RESTO_DO_REPOSITORIO
docs/auditorias/AUDITORIA_D11_2026-10-31.md	13
docs/auditorias/AUDITORIA_REFERENCIAS_2026-10-20.md	54
docs/auditorias/AUDITORIA_REFERENCIAS_2026-10-20.md	55
docs/auditorias/AUDITORIA_REFERENCIAS_2026-10-20.md	56
docs/auditorias/AUDITORIA_REFERENCIAS_2026-10-30.md	30
docs/auditorias/AUDITORIA_REFERENCIAS_2026-10-30.md	108
docs/auditorias/externa_a/CONTEXTO_ESTRUTURA_E_CODIGOS_SAREL.txt	2566
docs/auditorias/externa_a/CONTEXTO_ESTRUTURA_E_CODIGOS_SAREL.txt	5712
docs/auditorias/externa_a/CONTEXTO_ESTRUTURA_E_CODIGOS_SAREL.txt	5713
docs/auditorias/externa_a/CONTEXTO_ESTRUTURA_E_CODIGOS_SAREL.txt	5714
docs/auditorias/externa_a/CONTEXTO_ESTRUTURA_E_CODIGOS_SAREL.txt	10090
docs/auditorias/externa_a/CONTEXTO_ESTRUTURA_E_CODIGOS_SAREL.txt	10103
docs/auditorias/externa_a/CONTEXTO_ESTRUTURA_E_CODIGOS_SAREL.txt	10129
docs/auditorias/externa_a/CONTEXTO_ESTRUTURA_E_CODIGOS_SAREL.txt	10142
docs/auditorias/externa_a/CONTEXTO_ESTRUTURA_E_CODIGOS_SAREL.txt	10155
docs/auditorias/externa_a/CONTEXTO_ESTRUTURA_E_CODIGOS_SAREL.txt	10207
docs/auditorias/externa_a/CONTEXTO_ESTRUTURA_E_CODIGOS_SAREL.txt	10272
docs/auditorias/externa_a/CONTEXTO_ESTRUTURA_E_CODIGOS_SAREL.txt	10442
docs/auditorias/externa_a/CONTEXTO_ESTRUTURA_E_CODIGOS_SAREL.txt	52018
docs/auditorias/pacotes_fracionados/LOTE1_AUDITORIAS_E_DECISOES_PARTE2.txt	840
docs/auditorias/pacotes_fracionados/LOTE1_AUDITORIAS_E_DECISOES_PARTE2.txt	841
docs/auditorias/pacotes_fracionados/LOTE1_AUDITORIAS_E_DECISOES_PARTE2.txt	842
docs/auditorias/pacotes_fracionados/LOTE2_SEGURANCA_TIPOS_E_INVARIANTES_TS_PARTE2.txt	96
docs/auditorias/pacotes_fracionados/LOTE2_SEGURANCA_TIPOS_E_INVARIANTES_TS_PARTE2.txt	131
docs/auditorias/pacotes_fracionados/LOTE2_SEGURANCA_TIPOS_E_INVARIANTES_TS_PARTE2.txt	154
docs/auditorias/pacotes_fracionados/LOTE2_SEGURANCA_TIPOS_E_INVARIANTES_TS_PARTE2.txt	168
docs/auditorias/pacotes_fracionados/LOTE2_SEGURANCA_TIPOS_E_INVARIANTES_TS_PARTE2.txt	181
docs/auditorias/pacotes_fracionados/LOTE2_SEGURANCA_TIPOS_E_INVARIANTES_TS_PARTE2.txt	233
docs/auditorias/pacotes_fracionados/LOTE2_SEGURANCA_TIPOS_E_INVARIANTES_TS_PARTE3.txt	34
docs/auditorias/pacotes_fracionados/LOTE2_SEGURANCA_TIPOS_E_INVARIANTES_TS_PARTE3.txt	204
docs/auditorias/pacotes_fracionados/LOTE2_SEGURANCA_TIPOS_E_INVARIANTES_TS_PARTE3.txt	551
docs/auditorias/pacotes_fracionados/LOTE2_SEGURANCA_TIPOS_E_INVARIANTES_TS_PARTE4.txt	232
docs/auditorias/pacotes_fracionados/LOTE3_MOTORES_CIENTIFICOS_TS_PARTE2.txt	30
docs/auditorias/pacotes_fracionados/LOTE3_MOTORES_CIENTIFICOS_TS_PARTE3.txt	1400
docs/auditorias/pacotes_fracionados/LOTE4_API_STORE_E_COMPONENTES_CRITICOS_TSX_PARTE1.txt	776
docs/auditorias/pacotes_fracionados/LOTE4_API_STORE_E_COMPONENTES_CRITICOS_TSX_PARTE2.txt	28
docs/auditorias/pacotes_fracionados/LOTE5_PIPELINE_PYTHON_CIENTIFICO_PARTE1.txt	55
docs/metodologia/NORMA_LASTRO_CIENTIFICO.md	18
docs/planejamento/DECISOES.md	77
docs/planejamento/DECISOES.md	89
docs/planejamento/DECISOES.md	102
docs/planejamento/DECISOES.md	128
docs/planejamento/DECISOES.md	141
docs/planejamento/DECISOES.md	154
docs/planejamento/DECISOES.md	271
docs/planejamento/DECISOES.md	441
docs/planejamento/decisoes-notas.md	31
docs/planejamento/prompts/PROMPT_EXECUTOR_CORRECOES_METODOLOGICAS_2026-10-30.md	443
docs/planejamento/prompts/PROMPT_EXECUTOR_D11_SUFICIENCIA_TEMPORAL_2026-10-31.md	18
scripts/remedir_candidatos_bp3_d16.ts	99
scripts/treinar_xgboost_loco.py	17
src/app/api/gee/select-candidates/route.ts	4
src/app/api/jev/auditar/route.ts	4
src/config/lastroCientifico.test.ts	250
src/config/tourMetodologico.ts	208
src/lib/gee/amostragemBiofisica.test.ts	7
src/lib/gee/copernicusGeeClient.ts	4
src/lib/jev/fallbackLocal.ts	4
```

## 3. Afirmações do Relatório Original Refutadas pela Medição

- A afirmação de que existiam as exceções `EXC-API-SITIOS-REF-PADRAO-RAIO`, `EXC-LIB-GEE-SERIE-FALLBACK-ZEROS`, `EXC-LIB-MATRIZ-TEMPORAL-MEDIA-ZERO` e `EXC-LIB-GEE-AMOSTRAGEM-SOLO-NU-MIN-ZERO` é REFUTADA pela saída de C1, linhas 1 a 38 da tabela (nenhum desses quatro identificadores consta na lista de exceções autorizadas).
- A afirmação de que exceções em `src/lib/gee/estatisticasSerie.ts` e `src/lib/matriz/montagemTemporal.ts` continham os trechos `media = 0, desvio = 0` e `media = 0` imputando valores a dados ausentes é REFUTADA pela saída de C1, linha 19 (id `EXC-LIB-ESTATISTICAS-SERIE-NMINIMO`, trecho `GOV-5-DESTRUTURACAO-PROVISORIA`, justificativa "Piso amostral mínimo nMinimo = 3 para cálculo de estatísticas de banda") e linha 20 (id `EXC-LIB-MONTAGEM-TEMPORAL-JANELA`, trecho `GOV-5-DESTRUTURACAO-PROVISORIA`, justificativa "Parâmetros de janela temporal intervaloGuardaMeses e duracaoJanelaAnos").
- A afirmação de que a linha 86 de `src/config/decisoes.ts` corresponde a D03 (Fator LS) é REFUTADA pela saída de C2, linha 3 de OCORRENCIAS_EM_decisoes.ts (`86	D02	Critérios observacionais de presente/ausente e negativo explícito`).
- A afirmação de que a linha 121 de `src/config/decisoes.ts` corresponde a D04 (Fator P) é REFUTADA pela saída de C2, linha 4 de OCORRENCIAS_EM_decisoes.ts (`121	D03	Escala do rótulo: coleta ordinal com binarização declarada`).
- A afirmação de que a linha 144 de `src/config/decisoes.ts` tem título "Binarização" é REFUTADA pela saída de C2, linha 5 de OCORRENCIAS_EM_decisoes.ts (`144	D05	Série de treino: Sentinel-2 exclusivo; Landsat só como camada de tendência, nunca preditor`).
- A afirmação de que a linha 158 de `src/config/decisoes.ts` tem título "Buffer de Borda" é REFUTADA pela saída de C2, linha 6 de OCORRENCIAS_EM_decisoes.ts (`158	D06	Unidade de predição: pixel 10m calibrado por VANT Multiespectral`).
- A afirmação de que a linha 171 de `src/config/decisoes.ts` tem título "Composição Temporal" é REFUTADA pela saída de C2, linha 7 de OCORRENCIAS_EM_decisoes.ts (`171	D07	Domínio de validade: declividade 3 a 20%, WorldCover 30 e 40, concordância entre épocas`).
- A afirmação de que a linha 306 de `src/config/decisoes.ts` tem título "Amostragem Estratificada" é REFUTADA pela saída de C2, linha 8 de OCORRENCIAS_EM_decisoes.ts (`306	D16	Campanha: polígonos de VANT como massa de treino e teste, campo como âncora e confirmação`).
- A afirmação de que a linha 589 de `src/config/decisoes.ts` corresponde a D29 ("Threshold de Solo Exposto") é REFUTADA pela saída de C2, linha 9 de OCORRENCIAS_EM_decisoes.ts (`589	P03	Critério de casamento geodésico de campo com o ponto planejado`) e pela linha `MAIOR_ID_D_NO_REGISTRO	D26`.
- A afirmação de que a string "Metodologia PPGTCA 2026" ocorre em `src/app/api/sitios-referencia/route.ts` na linha 4 é REFUTADA pela saída de C2 (o arquivo não consta em OCORRENCIAS_NO_RESTO_DO_REPOSITORIO).
- A afirmação de que havia 10 ocorrências da string no repositório é REFUTADA pela saída de C2 (há 7 ocorrências em `src/config/decisoes.ts` e 58 ocorrências em OCORRENCIAS_NO_RESTO_DO_REPOSITORIO, totalizando 65 ocorrências em 28 arquivos únicos sob `src`, `scripts` e `docs`).

## 4. Respostas em Prosa (Derivadas Exclusivamente das Saídas)

### Respostas relativas à Tarefa C1
- A tag `preditor-cientifico-de-limiar-ou-zero` não aparece na seção `CONTAGEM_POR_TAG` da saída de C1 (aparecem apenas: 19 sem tag, 7 default-numerico-desestruturacao, 5 coalescencia-com-colecao-vazia, 4 coalescencia-com-numero e 3 corte-math-max-min-com-literal). Isso confirma que a entrada `EXC-LIB-RUSLE-FATORC-BSINUM`, removida no commit 992cec0, era a única exceção do repositório cadastrada com essa tag.
- Entre as 38 entradas reais listadas na saída de C1: nenhuma. Nenhuma entrada imputa valor numérico a dado ausente em variável científica (Regra 1). As 38 entradas compreendem:
  * geração sintética declarada em modo dry-run com flag de teste (linhas 1 a 5 da saída);
  * fallbacks de câmera e controles de interface gráfica (linhas 6 a 10, 21 e 33 da saída);
  * clamp de coordenadas de interface, tela e cotas inteiras de formulário (linhas 11 a 13 e 29 da saída);
  * limites computacionais, percentuais de alocação de subamostra e critérios de cota em rotas de API (linhas 14 a 18 da saída);
  * piso amostral `nMinimo = 3` e parâmetros de janela temporal de agregação (linhas 19 e 20 da saída);
  * simulação de resposta offline para teste de API sem chave externa (linha 22 da saída);
  * clamp de fração física ao intervalo numérico [0, 1] (linha 23 da saída);
  * timeout de requisição HTTP e métrica contadora de chamadas evitadas (linhas 24 e 25 da saída);
  * expiração de protocolo OAuth2 e auditoria de timestamp de livro-razao (linhas 26 e 27 da saída);
  * condição física de divisor de águas sem área de montante afluente no topo da vertente (linha 28 da saída);
  * teste unitário com método de máscara booleana (linha 30 da saída);
  * parâmetros de formato de especificação de arquivo de plano de voo (linhas 31, 32 e 38 da saída);
  * extração defensiva em propriedades GeoJSON de serviços WFS, conjunto held-out e cache vazio de script (linhas 34 a 37 da saída).

### Respostas relativas à Tarefa C2
- Total de ocorrências de "Metodologia PPGTCA 2026": 65 ocorrências distribuídas em 28 arquivos únicos (7 ocorrências em `src/config/decisoes.ts` e 58 ocorrências nos demais arquivos listados em `OCORRENCIAS_NO_RESTO_DO_REPOSITORIO`).
- O identificador "D29" não aparece em nenhuma linha da saída de C2; a saída registra explicitamente `MAIOR_ID_D_NO_REGISTRO	D26`, e a linha 589 de `src/config/decisoes.ts` corresponde a P03.
- O caminho "src/app/api/sitios-referencia/route.ts" não aparece em nenhuma linha da saída de C2.
