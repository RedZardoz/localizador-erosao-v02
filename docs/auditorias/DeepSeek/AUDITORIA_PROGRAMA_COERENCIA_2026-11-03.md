# Auditoria do programa, funcionalidade e coerência científica — SAREL v2

**Data:** 3 de novembro de 2026
**Commit auditado:** a058954 (branch correcoes/contencao-2026-11-02)
**Base de comparação:** f63d8a5 (auditorias de 31/10 e 01/11/2026)
**Natureza:** auditoria independente, somente leitura. Nenhum código, decisão ou parâmetro foi alterado; nenhum commit ou push foi feito.

---

## 1. Veredito

A branch de correções é a resposta mais consistente já produzida às auditorias: 62 arquivos alterados, 7.341 inserções, cinco frentes (contenção, contrato de matriz, lastro, material de decisão e simulação de poder), 794 testes relatados e páginas de decisão para os gates. O avanço é real, não cosmético.

Mas a cadeia científica continua bloqueada. O padrão mudou: antes o problema era “o código contradiz a decisão”; agora é “o contrato existe, mas os dados do desenho não chegam até ele, e o avaliador ainda aceita a matriz incompleta”. O projeto está mais auditável, não ainda executável.

**Contagem:** 6 achados S1 e 10 S2; os achados menores de documentação e operação permanecem na matriz de status. O achado novo mais grave é a interação entre o contrato da matriz e o D25: as chaves do desenho são exportadas vazias, e o D25 as interpreta como filtro e como vazamento de pixel.

---

## 2. Baseline e execução

| Verificação | Resultado |
|---|---|
| Branch / commit | correcoes/contencao-2026-11-02 / a058954; árvore limpa |
| Typecheck | passa (tsc --noEmit, exit 0) |
| Lint | falha com 2 warnings pré-existentes: MapViewer.tsx:526 e PointPopup.tsx:69 |
| Testes | não iniciam neste ambiente (spawn EPERM no config do Vitest, caminho com acentos + restrição de child_process). O relatório da branch afirma 794 testes, 3 pulados |
| Build | não executado |
| Dados | sem fundiario_brasil.db, sem selo D16 real e sem CSV de D26 |
| Decisões | decisoes.ts não foi tocado; G-01, G-08, G-12, G-13 e G-15 aguardam decisão |

Os números de teste da branch não puderam ser confirmados aqui; o lint confirma que o CI continua vermelho. A ausência de dado de desfecho permanece.

---

## 3. O que melhorou de fato

### 3.1 Contenção (P-0)

- Alvo sem default: InspetorPonto deixou o slider com 0,00; fração inicia nula, observador e confiança iniciam vazios; rotuloHumano recusa fração ausente, não numérica, fora de [0,1] e confiança vazia. Zero explícito é aceito como observação.
- Semente registrada: o 42 da rota e o 20260928 do CLI foram removidos; semente explícita ou criptográfica, registrada no relatório e no selo.
- Fabricações numéricas: NDVI/BSI retornam null em denominador nulo e fora de [-1,1]; o clamp de solo nu foi removido; BLOCO_INDEFINIDO foi eliminado; confiança fabricada do JEV foi removida.
- JEV: coordenadas, município e código do ponto saíram do payload; opt-in explícito; laudo marcado como heurístico.
- Legado: a rotina de 36 polígonos foi removida; os chamadores de produção já usavam a de 72.

### 3.2 Contrato da matriz (P-M)

- Esquema 2.0.0 com Estrato_ID, Pi_i, W_i, N_Candidatos_Estrato, Incluida, Cobertura_Celula, Area_Delineada_m2, Pixel_ID, Modelo, Data_Referencia e Fim_Janela.
- Identidade Pi_i * W_i = 1; Modelo único por artefato; domínios; Incluida como texto para não colidir com o Invariante 7; dicionário de dados.
- Teste que demonstra a colisão de Incluida numérica com o Invariante 7: boa decisão de engenharia.

### 3.3 Lastro (P-L)

- As duas travas foram estendidas: caminhos declarados no inventário precisam existir; obras arquivadas precisam estar declaradas; LASTRO_NAO_CONFERIDO separa “tem citação” de “a citação sustenta”.
- Rikimaru (D02), Roberts (P02) e Zanaga (P05) foram reabertos como não conferidos; a distinção entre 9,81 reproduzido e interpretação física como hipótese foi registrada; a marca de pendência de R passou a existir no tipo e no censo.

### 3.4 Decisão e poder (P-D/P-S)

- Páginas G-01, G-08, G-12, G-13 e G-15 com opções, custos, lastro e o que fica impedido.
- Simulação de poder reprodutível, com conferência contra scipy e cenários de 36/30/28/24 clusters.
- A simulação corrige, com razão, a afirmação anterior de que “0,10 está perto do ruído” de forma incondicional: o poder depende da heterogeneidade da vantagem entre polígonos, não apenas do número de clusters.

**Crédito devido:** a branch não escondeu os problemas; transformou-os em gates e testes. Isso é o comportamento correto.

---

## 4. Achados S1

### S1-1 — As chaves do desenho são exportadas vazias; o D25 as interpreta como filtro e como vazamento (NOVO, crítico)

**Evidência.**
- O perfil da matriz agora inclui Incluida e Pixel_ID (perfis.ts; planilha.ts:315-322).
- Mas as três rotas de produção chamam montarMatrizTreino sem seloD16 e sem delineacaoD26:
  - planilha.ts:291: montarMatrizTreino(pontos, rotulosConsolidados, { modeloJanela: "D" });
  - pacoteReprodutibilidade.ts:136 e :709: mesma chamada;
  - PainelMatrizTreino.tsx:21: mesma chamada.
- OpcoesExportacao (planilha.ts:19-25) não tem campos seloD16 nem exigirDelineacaoD26; o pacote também não.
- Sem selo, Pi_i, W_i e Estrato_ID saem vazios; sem delineacao, Incluida, Cobertura_Celula, Area_Delineada_m2 e Pixel_ID saem vazios.

**O que o D25 faz com isso.**
- _so_incluidas (avaliacao_d25_referencia.py:176-181) considera incluída apenas “true”/“1”/“verdadeiro”. Com Incluida vazia, o resultado é zero linhas.
- _checar_pixels_disjuntos (:184-195) monta o conjunto de Pixel_ID e compara treino e held-out. Com todos os Pixel_ID vazios, o conjunto é {""} e o teste acusa vazamento espacial falso.

**Demonstração executada nesta auditoria.** DataFrame com 4 linhas, Incluida e Pixel_ID vazios:
- _so_incluidas retornou 0 de 4 linhas.
- _checar_pixels_disjuntos lançou: “1 pixel(is) de 10 m em treino e held-out (vazamento espacial)”.

**Impacto.** O contrato parece pronto e o export passa pelo esquema, mas o artefato que chega ao D25 é inutilizável: ou é filtrado a zero, ou é acusado de vazamento que não existe. O A-05 fechou a estrutura, não a integração. As chaves estão sempre ausentes enquanto não houver selo e CSV, e não há caminho de produção para injetá-las.

**Recomendação.**
1. Adicionar seloD16 e delineacaoD26 às opções de exportação e ao Painel da Matriz; carregar o selo D16 e o CSV de D26 de forma explícita.
2. No D25, distinguir ausente de false: se Incluida estiver vazia em modo probatório, falhar com “delineação D26 ausente”, não filtrar para zero; se Pixel_ID estiver vazio, ignorar ou falhar com causa própria, nunca acusar vazamento.
3. Teste de integração com matriz exportada pela rota real, não apenas com DataFrame de teste.

### S1-2 — O D25 continua permissivo (A-06 não implementado)

**Evidência.**
- _so_incluidas e _checar_pixels_disjuntos continuam retornando em silêncio quando as colunas faltam (o novo contrato as torna presentes, mas vazias; ver S1-1).
- O modo probatório aceita held-out >= 2 e treino >= 4 (avaliacao_d25_referencia.py:394-395), não 36/18 nem o número de G-01.
- Não exige Modelo, Data_Referencia, Estrato_ID, monotonicidade não vazia, nem RUSLE_A antes do ajuste.
- O config continua “PROPOSTA NAO CONGELADA”, com pre_registro null (config_pre_registro_PROPOSTA.json:2, :50).
- Os blocos incluem NDVI_Maximo_Mediano, Curvatura_Perfil e TWI; a matriz tem NDVI_P90_Serie e as duas últimas saem sempre indisponíveis. O config reconhece isso, mas não foi corrigido.

**Impacto.** O avaliador pode rodar com matriz incompleta, sem RUSLE_A e sem o número de clusters decidido. O resultado não seria probatório, mas o relatório poderia parecer. A guarda que existe não protege o que diz proteger.

### S1-3 — D11.2 continua em 6 observações

**Evidência.** copernicusGeeClient.ts:29 mantém LIMIAR_MINIMO_OBSERVACOES_D11 = 6; avaliarSuficienciaAmostralD11 (:59) só verifica n < 6; não há SE, regime ou estimando. A D11.2 decidida em 31/10 exige 12 e SE <= 0,144, com fallback 6–11 inelegível para D12.

**Impacto.** Os tercis de Ê e os 18 estratos podem ser calculados com 6 observações; a guarda de D12 continua sem receber proveniência; o desenho pré-registrado não é o desenho executado. É o S1 mais antigo e continua aberto.

### S1-4 — G-01 sem decisão, tipo do selo bloqueia as alternativas e Cochran não conferido

**Evidência.**
- G-01 está “aguardando decisão do pesquisador” (docs/planejamento/decisao/G-01.md:5).
- O tipo do selo ainda declara areaHectares: 10 | 5.02; totalPoligonosSorteados: 36 | 72; totalTreino: 18 | 36; totalHeldOut: 18 | 36; areaTotalHectares: 360 | 361.44 (sorteioPoligonosTipos.ts:73, :103-106). As opções viáveis de G-01 dão 56, 60 ou 48 polígonos; nenhuma compila.
- A opção 1 (colapso) recomendada nos documentos de 01/11 depende de Cochran §5A.12, cujo acervo é uma síntese que se autodeclara NÃO CONFERIDA NO PRIMÁRIO. A G-01 registra o impedimento; a opção 1-v (14 estratos, 56 polígonos) tem 92,9% de chance de preencher sob 25% de recusa, contra 31,6% da opção 1, mas também depende do colapso.

**Impacto.** Não há como sortear a amostra. O sorteio de 72 recusa corretamente; qualquer alternativa viável não compila. O projeto está bloqueado no primeiro elo da cadeia.

### S1-5 — Modelo P continua não exportável

**Evidência.** planilha.ts:291, pacoteReprodutibilidade.ts:136 e :709 e PainelMatrizTreino.tsx:21 fixam modeloJanela: "D". O tipo aceita "D" | "P" e a coluna Modelo existe, mas nenhuma rota de produção emite P. D04 diz “ambos os modelos integrados”.

**Impacto.** A evidência é de detecção contemporânea, não de predição prospectiva. Se a dissertação alegar predição, não há matriz nem avaliação que a sustente.

### S1-6 — Classe e fração ainda podem se contradizer

**Evidência.** InspetorPonto.tsx:38 inicia classeRotuloInput como "erosao"; a fração inicia null, mas o usuário pode digitar 0,00. rotuloHumano.ts:66-90 exige fração presente e no domínio, mas não compara com a classe. Assim, “erosao” + 0,00 é aceito; montarMatrizTreino usa a fração como alvo e grava o ponto como negativo.

**Impacto.** O default 0,00 foi removido, o que é um avanço real, mas a contradição classe↔fração continua possível com um valor explícito. É um falso negativo induzido por erro de preenchimento, não por observação.

---

## 5. Achados S2

### S2-1 — P03 continua 15/25 m
ingestaoKobo.ts:82-83 mantém 15/25; a decisão exige 30 m, mesmo estrato e GNSS 5/10 m. O código não verifica estrato nem GNSS. A Ficha repete 15/25.

### S2-2 — Fator C continua atribuído a D01
fatorC.ts:133 fixa decisoes: ["D01"] nos dois ramos; o modelo híbrido é D20. O rótulo da UI “RUSLE (Durigon C)” permanece.

### S2-3 — Top-up e estratos vazios continuam
select-candidates/route.ts:706-739 ainda completa a amostra por ordem de chegada, sem pi_i, quando a estratificação não atinge tamanhoAmostra. estratificacao.ts:263-293 continua calculando cota só sobre estratos ocupados. O default tamanhoAmostra = 50 (:196) não é os 60–80 de D23. A âncora não tem pi_i próprio.

### S2-4 — Geometria e realocação continuam sem verificação
construirPoligono502Ha continua quadrado alinhado aos eixos (sorteioPoligonos.ts:136-...), sem contenção no imóvel, sem orientação no declive e sem novo thinning após a realocação. As pré-condições do sorteio não olham geometria.

### S2-5 — Config do D25 não casa com a matriz
O config pede NDVI_Maximo_Mediano, Curvatura_Perfil e TWI; a matriz tem NDVI_P90_Serie e as duas últimas saem indisponíveis. O config também não tem RUSLE_A. O D25 falharia por preditor ausente/100% vazio antes de qualquer resultado, mas o erro não é claro.

### S2-6 — G-12: a margem de 0,10 não é invariante à prevalência de zeros
A G-12 mostra que o teto atingível de Spearman cai de 0,94 (50% de zeros) para 0,42 (95%); 0,10 representa 10,6% do espaço útil em um caso e 23,8% no outro. A decisão está aberta. Não é bug; é escala de métrica não resolvida antes do dado.

### S2-7 — G-13: a simulação de poder é condicional e possivelmente otimista
A simulação mostra 100% de poder para SD da vantagem <= 0,10 e 80% em SD ~0,126 com 36 clusters; é um resultado importante e corrige a afirmação incondicional anterior. Mas ela gera os scores com ruído i.i.d. em 502 células por polígono; D24 estima ~25,6 unidades efetivas por polígono. Se a autocorrelação espacial dos resíduos reduzir a informação efetiva, o poder real será menor. A G-13 declara algumas limitações, mas não essa. Recomenda-se uma sensibilidade com 25,6 unidades efetivas (ou resíduos espacialmente correlacionados) antes de tratar “100%” como definitivo.

### S2-8 — G-08: kappa continua com duas regras
O código exige 0,61 com IC inferior; os documentos dizem 0,60 pontual. A G-08 mostra que o portão duplo é praticamente inalcançável perto do limiar (kappa 0,65 exige n acima de 1.200). A decisão está aberta; o estado atual é o pior dos dois.

### S2-9 — Lint e CI
O lint continua falhando com os 2 warnings; o workflow com --max-warnings 0 continua vermelho. O relatório de contenção reconhece que os warnings são pré-existentes e fora do escopo, mas o CI não fica verde.

### S2-10 — Lastro: guardas melhoraram, decisões ainda em dívida
As travas agora verificam caminhos e arquivos, e Rikimaru/P02/P05 foram reabertos. Mas D02 continua citando Rikimaru para cortes que a obra não sustenta; D22 continua com tabela de origem em IA não conferida; Cochran continua sem primário. A dívida está declarada — o que é correto — mas ainda não quitada.

---

## 6. Coerência científica: o que a branch mudou e o que não mudou

### 6.1 O elo que ainda falta

A branch fechou o contrato de dados e a contenção, mas não fechou a integração entre:

1. o selo D16 (pi_i, W_i, N_h, papéis);
2. o CSV de D26 (Incluida, Cobertura, Pixel_ID, área);
3. a matriz exportada;
4. o D25 estrito.

O esquema exige as colunas, mas as rotas não as alimentam; o D25 não exige que estejam preenchidas. O resultado é um artefato que passa no esquema e falha no uso. É o mesmo padrão de “guarda que se desliga” que a auditoria de 01/11 apontou, agora na camada de integração.

### 6.2 O que a branch acertou na ciência

- Poder: a simulação mostrou que a afirmação anterior era condicional; o poder depende da heterogeneidade da vantagem, não só do número de clusters.
- G-12: a descoberta de que 0,10 não é a mesma margem em diferentes prevalências de zeros é um achado de primeira ordem; deve ser decidido antes do primeiro rótulo.
- G-01: a análise mostrou que as opções 2 e 3 puras não resolvem o problema e que a opção 1-v domina a opção 1 em reserva e área.
- Lastro: a distinção entre “tem citação” e “a citação sustenta” foi incorporada; Rikimaru/P02/P05 foram reabertos.

### 6.3 O que a branch não resolveu

- D11.2, P03, D20, Modelo P, D25 estrito, classe↔fração, geometria, top-up.
- A validade espacial do held-out continua não resolvida (V-02). O D25 ainda agrupa por polígono, não por bloco; a G-13 não modela autocorrelação entre polígonos. A dissertação deve declarar “hold-out por polígono”, não “spatial CV”.
- A distinção estado vs evento (T-03) continua: o alvo é a cicatriz na data do voo; “predição” prospectiva não está demonstrada.
- A área da BP3 (D-02) continua não identificada pelo pi_i de imóvel.

---

## 7. Matriz de status dos achados anteriores

| Achado | Status em 03/11 | Evidência |
|---|---|---|
| F-01 / D11.2 | Aberto | copernicusGeeClient.ts:29; piso 6 |
| F-02 / D25 e RUSLE | Parcial | contrato criado; D25 estrito e RUSLE_A ausentes |
| F-03 / amostragem | Parcial | semente corrigida; top-up, pi_i e âncora abertos |
| F-04 / P03 | Aberto | ingestaoKobo.ts:82-83 |
| F-05 / D22 | Aberto | P=1,0; tabela não verificada |
| F-06 / D20 | Aberto | fatorC.ts:133 |
| F-07 / fabricações | Resolvido em boa parte | NDVI/BSI/BLOCO/JEV; classe↔fração aberto |
| F-08 / JEV | Resolvido | payload sem coordenadas; opt-in |
| F-09 / kappa | Gate aberto | G-08; código 0,61+IC |
| F-10 / Shapefile e VIF | Aberto | sem mudança |
| F-11 / persistência | Aberto | sem mudança |
| F-12 / Invariante 6 | Parcial | BLOCO_INDEFINIDO removido; Ficha ainda descreve outro conjunto |
| F-13 / registro defasado | Aberto | D07/P05/D23/Ficha |
| F-14 / tercis | Aberto | estratificacao.ts |
| F-15 / p10 e harmônicos | Aberto | estatisticasSerie/harmonicos |
| F-16 / variograma | Aberto | blocosEspaciais |
| F-17 / lastro | Parcial | travas melhores; dívidas abertas |
| F-18 / R 9,81 | Resolvido | marca propagada |
| F-19 / CI | Aberto | lint 2 warnings |
| F-20 / overlay, sessão, benchmark | Aberto | sem mudança |

---

## 8. Prioridades

### P0 — antes de qualquer resultado probatório

1. Integrar selo D16 e CSV D26 às rotas de exportação e corrigir o D25 para distinguir vazio de false (S1-1).
2. Implementar A-06: 18/36 ou número de G-01, Modelo/Data, monotonicidade, config congelado, RUSLE_A (S1-2).
3. Implementar D11.2 (S1-3).
4. Decidir G-01 e corrigir o tipo do selo para aceitar 4 × número de estratos; obter Cochran no primário (S1-4).
5. Exportar e avaliar o Modelo P ou retirar a alegação de predição (S1-5).
6. Coerência classe↔fração (S1-6).

### P1 — antes da campanha

7. P03 (S2-1).
8. D20 (S2-2).
9. Top-up, pi_i e âncora (S2-3).
10. Geometria/encaixe/thinning (S2-4).
11. Corrigir o config do D25 (S2-5).
12. Decidir G-12 e G-13; declarar a limitação da simulação de poder (S2-6/S2-7).
13. Decidir G-08 (S2-8).
14. CI verde (S2-9).

### P2 — antes da defesa

15. Lastro D02/D22/Cochran (S2-10).
16. Textos e Ficha; documentação de “hold-out por polígono, não espacial”.

---

## 9. O que não pude verificar

- Os 794 testes relatados: a suíte não inicia neste ambiente por spawn EPERM no config do Vitest. O relatório da branch é a única evidência.
- Nenhum dado real, selo D16 ou CSV D26; não há como medir acurácia, prevalência ou superioridade.
- Nenhuma execução GEE/Planet/Embrapa.
- Nenhuma decisão de gate foi assinada; G-01, G-08, G-12, G-13 e G-15 seguem abertas.

---

## 10. Conclusão

A branch melhorou o programa de forma substancial: o alvo não tem mais default, a semente é registrada, as fabricações numéricas foram removidas, o JEV não envia coordenadas, o contrato da matriz existe, o lastro ficou mais honesto e o poder foi simulado. Isso deve ser reconhecido.

Mas o que a evidência permite afirmar hoje é limitado: o artefato ainda não é uma matriz de treino válida para D25, porque as chaves do desenho chegam vazias e o avaliador as interpreta mal; as decisões estruturais (G-01), de escala (G-12), de poder (G-13), de kappa (G-08) e de depósito (G-15) estão abertas; e D11.2, P03, D20, Modelo P e a coerência classe↔fração continuam pendentes.

O caminho é claro e não exige mais código do que decisão: fechar os gates, integrar selo e CSV, endurecer o D25 e só então olhar para o modelo. A branch atual é uma boa base para isso — desde que não se confunda “contrato criado” com “dados integrados”, nem “teste de esquema” com “validação científica”.

---

## Anexo A — Evidências de execução

- Typecheck: npm run typecheck -> exit 0.
- Lint: npm run lint -- --max-warnings 0 -> exit 1; 2 warnings em MapViewer.tsx:526 e PointPopup.tsx:69.
- Testes: npm test -> falha no carregamento do config (spawn EPERM); não é falha de asserção.
- D25 com chaves vazias: _so_incluidas -> 0/4; _checar_pixels_disjuntos -> ErroAvaliacao “1 pixel(is) de 10 m em treino e held-out (vazamento espacial)”.
- Git: árvore limpa; commit a058954; branch correcoes/contencao-2026-11-02.

## Anexo B — Arquivos-chave

- Contrato: src/lib/matriz/esquema.ts; src/lib/matriz/perfis.ts; src/lib/export/planilha.ts; src/lib/export/pacoteReprodutibilidade.ts.
- Alvo: src/components/inspetor/InspetorPonto.tsx; src/lib/rotulos/rotuloHumano.ts.
- D25: scripts/d25/avaliacao_d25_referencia.py; scripts/d25/config_pre_registro_PROPOSTA.json.
- D11: src/lib/gee/copernicusGeeClient.ts; src/app/api/gee/select-candidates/route.ts.
- Sorteio: src/lib/gee/sorteioPoligonos.ts; src/lib/gee/sorteioPoligonosTipos.ts.
- Gates: docs/planejamento/decisao/G-01.md, G-08.md, G-12.md, G-13.md, G-15.md.
- Relatórios da branch: docs/auditorias/RELATORIO_CONTENCAO_2026-11-02.md, RELATORIO_CONTRATO_MATRIZ_2026-11-03.md, RELATORIO_LASTRO_2026-11-02.md, RELATORIO_SIMULACAO_PODER_2026-11-03.md.

---

**Fim do relatório.** Nenhum código, decisão ou parâmetro foi alterado por esta auditoria.
