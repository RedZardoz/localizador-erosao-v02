# Auditoria funcional e de coerência metodológica — SAREL v2

**Data:** 9 de novembro de 2026
**Commit auditado:** bca0e50 (branch correcoes/contencao-2026-11-02)
**Base anterior:** 3a9828e / 99b0e33
**Natureza:** auditoria independente, somente leitura.

---

## 1. Veredito

O programa avançou de verdade. A máscara GEOS3 de solo exposto foi adotada e conferida no primário; D02 passou a declarar os cortes como convenção e a restringir Rikimaru ao BSI; D01 virou Durigon puro, com o híbrido rebaixado a sensibilidade; LS saiu da matriz; os alvos foram declarados; e a definição de Ê passou a refletir os quatro testes da máscara, com invalidação de cache. Isso é trabalho real.

Mas a cadeia não está fechada. O avanço mais importante — medir Ê com a máscara GEOS3 — não foi executado: a rodada de 30 pontos parou por falta de credencial e registrou 0 pontos. E a guarda de D11.2, que deveria impedir que Ê com 6 a 11 observações entrasse nos estratos, é contornada no caminho de produção. O desenho pré-registrado pode ser violado sem que nenhum teste falhe.

**Contagem: 8 S1 e 8 S2, além de duas ressalvas metodológicas.** O projeto está melhor, mas ainda não está executável com o rigor que declara.

---

## 2. Baseline e verificações obrigatórias

| Verificação | Resultado |
|---|---|
| HEAD real | bca0e50 (09/11/2026 17:49) |
| Branch | correcoes/contencao-2026-11-02; árvore limpa |
| ESTADO.md | declara HEAD 2ba8e86 — um commit atrás do HEAD real |
| npm run estado:verificar | falha com spawnSync de cmd.exe EPERM; não foi possível comparar painel e estado medido pela via oficial |
| npm run typecheck | passa (tsc --noEmit, exit 0) |
| npm run lint -- --max-warnings 0 | falha com 2 warnings: MapViewer.tsx:526 e PointPopup.tsx:69 |
| npm test | não inicia: erro de startup do Vitest, spawn EPERM no config; não é falha de asserção |
| Dados | nenhum; candidatosComSoloNuMedido = 0; sorteio BLOQUEADO |

A verificação oficial do estado não rodou e o painel está um commit atrás. O painel é a fonte que a próxima sessão deve consultar; um commit de atraso já é suficiente para uma sessão propor algo feito.

---

## 3. O que melhorou

### 3.1 D10 — máscara GEOS3 adotada e conferida

D10 deixou de ser um limiar isolado de NDVI e passou a ser a conjunção de cinco testes da máscara GEOS3: NDVI em [0,00; 0,25], NBR2 em [0,00; 0,075], B4 >= B3 e B3 >= B2, em Sentinel-2 MSI L2A. Demattê et al. (2018) foi conferido no primário em 09/11/2026; a transposição de Landsat 5 TM para Sentinel-2 está declarada como hipótese.

O NBR2 é o componente que separa palhada de solo mineral; a decisão agora reconhece que 0,25 não é um corte univariado. A implementação em mascaraSoloNuGeos3.ts segue os cinco testes e recusa valores fora do domínio em vez de cortar.

### 3.2 D02 — cortes declarados como convenção

D02 agora afirma que os cortes BSI > 0,10, NDVI < 0,40, BSI < 0,00 e NDVI > 0,65 são convenção operacional do projeto e não são atribuídos a Rikimaru. A obra é citada exclusivamente pelo índice BSI, e a conferência no primário está registrada. O LASTRO_NAO_CONFERIDO não lista mais D02.

Resta uma incoerência de forma: o título de D02 continua “Critérios observacionais”, enquanto o valor é uma regra espectral de triagem. O registro de conversa 02 já diz que D02 deveria voltar a pendente e que os limiares deveriam migrar para parâmetro operacional. A correção de conteúdo foi feita; a separação conceitual, não.

### 3.3 D01/D20 — Durigon puro e híbrido como sensibilidade

O código passou a usar calcularFatorC(ndvi) = (1 - NDVI)/2, com um único argumento e consulta a D01. A variante com BSI foi renomeada para calcularFatorCSensibilidadeBsi e ficou fora do caminho analítico. LS saiu da matriz de treino e held-out, permanecendo na planilha e na linha de base RUSLE. Os alvos foram declarados: Fracao_Erodida primário, Classe_Alvo_Binaria secundário, Rotulo_Classe escala de origem.

A decisão de conversa 01 registra que o híbrido foi superado. O problema é que D20 continua no registro como “Fórmula do Fator C híbrido SPD”, estado decidida. O código não a usa, mas o registro canônico ainda apresenta duas fórmulas decididas para o mesmo fator.

### 3.4 E-hat — definição corrigida

A constante DEFINICAO_METRICA_SOLO_NU foi corrigida: antes dizia ndvi_lt_0.25; agora é construída a partir dos quatro limiares de D10 e inclui geos3_dematte2018, com hash que muda se qualquer limiar mudar. Isso fecha um risco real de cache misturar medições sob regras espectrais diferentes. A correção é boa e está testada.

---

## 4. Achados S1

### S1-1 — D11.2 é contornado no caminho de produção (novo, crítico)

**Evidência.**
- amostragemSoloNuLote.ts:650-698 usa avaliarSuficienciaAmostralD11(nObservacoes), que aceita n >= 6 (copernicusGeeClient.ts:29). O valor é gravado como medido, sem qualidade.nObservacoes.
- select-candidates/route.ts:605-621 monta CandidatoEstratificacao apenas com id, coordenadas, declividade, frequência e K. Não passa provenienciaE.
- estratificacao.ts:166-173 só executa a guarda de D11.2 se c.provenienciaE existir.
- montagemTemporal.ts:77-89 libera qualquer proveniência medida, mesmo sem qualidade; só bloqueia modelado com qualidade explícita.
- Resultado: Ê medido com 6 a 11 observações entra nos tercis e nos 18 estratos, apesar de D11.2 exigir 12 e SE <= 0,144.

**Impacto.** A dimensão Ê define os estratos. Com 6 a 11 observações, o erro-padrão pode chegar a ~0,20, da ordem de um tercil. O sorteio pode ser feito sobre estratos que o pré-registro proíbe. Nenhum teste falha porque a guarda existe, mas não é chamada com o insumo que a ativa. É o mesmo padrão de “guarda que se desliga”, agora na camada de proveniência.

**Recomendação.**
1. Fazer amostragemSoloNuLote usar N_MINIMO_OBSERVACOES_SOLO_NU_D11_2 = 12, não o piso genérico 6, e gravar qualidade.regime/nObservacoes/erroPadrao.
2. Passar provenienciaE no CandidatoEstratificacao da rota.
3. Fazer executarAmostragemEstratificada exigir provenienciaE e falhar se n < 12 ou se a qualidade não estiver declarada.
4. Teste de integração que monta candidato com n=6 e prova que a rota não o estratifica.

### S1-2 — A calibração de 30 pontos não foi executada (novo, crítico)

**Evidência.** O relatório 2026-11-09d_calibracao_30_pontos_solo_nu.md registra: execução interrompida por ausência de SAREL_GEE_SERVICE_ACCOUNT_FILE; 0 pontos com Ê medido; 30 indisponíveis; nenhuma chamada de rede; cache inexistente. O ESTADO.md confirma candidatosComSoloNuMedido = 0 e statusSorteio BLOQUEADO. O commit bca0e50 tem assunto “medir calibracao de 30 pontos”, mas o que foi medido foi a recusa fail-closed, não o tempo por ponto.

**Impacto.** Sem Ê medido, não há tercis, não há estratos povoados e não há sorteio. O gargalo que o projeto tenta resolver desde 30/09 continua no mesmo lugar. A recusa foi correta — não houve número sintético —, mas o commit não entrega o que o título sugere.

**Recomendação.** Executar a rodada com credencial real; registrar tempoPorPontoMs, p95, nObservacoes e taxa de falha; não tratar a rodada como amostra científica; só depois decidir o lote de 680. Corrigir o relatório para “tentativa de calibração”, não “calibração medida”.

### S1-3 — O 12 x 6 continua não sorteável

O sorteio segue hardcoded em 18 estratos x 4 polígonos, com pi_i = 4/N_h (sorteioPoligonos.ts:228, :250, :263). O tipo do selo aceita 36|72 (sorteioPoligonosTipos.ts:103). O cenário 12 x 6 está no material de G-01, mas não no algoritmo. Se G-01 escolher 12 x 6, o selo não pode ser gerado.

Recomendação: generalizar o sorteio uma vez para 12x6, 14x4 e 12x4, com n_h, split treino/held-out e pi_i/w_i paramétricos; teste que sorteia os três desenhos.

### S1-4 — Selo e D26 continuam fora do ZIP e da Campanha

ExportModal.tsx:56 e :104 chamam gerarPlanilhaXLSX e gerarPacoteReprodutibilidadeZip sem selo/D26. PainelCampanha.tsx:121 chama gerarPlanilhaXLSX com perfil e rótulos, mas sem selo/D26. O pacote continua levando 01_matriz_treinamento.csv com Pi_i, W_i, Estrato_ID, Incluida e Pixel_ID vazios. O teste 9 confere as chamadas internas, não a UI.

Recomendação: passar as opções na UI, carregar o CSV D26 e falhar sem eles na exportação probatória; teste de integração do ZIP real.

### S1-5 — A-06 continua ausente no D25

O D25 em modo probatório ainda aceita held-out >= 2 e treino >= 4 (avaliacao_d25_referencia.py:544-545), não exige RUSLE_A, Modelo, Data_Referencia, Estrato_ID, monotonicidade não vazia nem hash. O config segue “PROPOSTA NAO CONGELADA”, com pre_registro null. O S1-1 anterior (vazio não é false) está corrigido no avaliador, mas a exigência de preenchimento não.

Recomendação: implementar A-06 fail-closed, em duas etapas se necessário: primeiro chaves, n, RUSLE_A e hash; depois Modelo/Data e monotonicidade.

### S1-6 — Modelo P continua não exportável

planilha.ts:315, pacoteReprodutibilidade.ts:151 e :729 e PainelMatrizTreino.tsx:42 fixam modeloJanela: "D". O tipo aceita D | P, a coluna Modelo existe, mas nenhuma rota de produção emite P. Se a dissertação alegar predição prospectiva, não há matriz que a sustente.

Recomendação: implementar P com features pré-janela e avaliação separada, ou retirar a alegação de predição. Não se deve alegar predição sem a matriz P.

### S1-7 — Classe e fração ainda podem se contradizer

InspetorPonto.tsx:38 inicia a classe como “erosao”; rotuloHumano.ts:66-90 valida fração, mas não compara com a classe. “Erosao” + 0,00 é aceito e a matriz grava o ponto como negativo. O default 0,00 foi removido, mas a contradição explícita continua.

Recomendação: validação dura — erosão exige fração > 0; controle exige 0; transição aceita 0–1. Teste que recusa erosão+0 e controle+0,3.

### S1-8 — D02 e D20 ainda criam duas verdades no registro

D02 tem título “Critérios observacionais”, mas o valor é uma regra espectral de triagem; o registro de conversa 02 declara que D02 deveria voltar a pendente e que os limiares deveriam migrar para parâmetro operacional. D20 continua “Fórmula do Fator C híbrido”, estado decidida, enquanto o código usa Durigon puro (D01) e a decisão de conversa 01 diz que o híbrido foi superado. Um leitor do registro vê duas fórmulas decididas para C e duas naturezas para D02.

**Impacto.** Não é bug de execução, mas é incoerência metodológica no documento que a banca lê. A tese pode ser questionada por ter duas definições vigentes para o mesmo fator.

**Recomendação.** Separar D02 em decisão observacional (rótulo humano) e parâmetro operacional de triagem espectral; reclassificar D20 como proposta/sensibilidade, ou revogá-la explicitamente, mantendo D01 como única fórmula analítica.

---

## 5. Achados S2

### S2-1 — O painel ESTADO.md está um commit atrás

O painel declara HEAD 2ba8e86; o HEAD real é bca0e50. A verificação oficial não rodou por EPERM. O painel é a fonte de leitura da próxima sessão; um commit de atraso é suficiente para uma sessão propor algo já feito.

Recomendação: rodar npm run estado (não estado:verificar) em commit próprio, ou corrigir o script para não depender de spawnSync de cmd.exe.

### S2-2 — D08/NDVI_Maximo_Mediano continua divergente

persistenciaTemporal.ts:43 e :196 calculam o P90 de toda a série, mas o campo se chama ndviMaximoMediano. A matriz usa NDVI_P90_Serie (perfis.ts:291); o config do D25 pede NDVI_Maximo_Mediano. A decisão de conversa 08 (mediana dos máximos por safra) está pendente e bloqueada pela ausência de definição de fronteira de safra.

Recomendação: decidir a fronteira de safra e implementar o estimador, ou renomear a coluna e o config para NDVI_P90_Serie.

### S2-3 — P03 continua 15/25 m, sem estrato e sem GNSS

ingestaoKobo.ts:82 mantém 15 m nominal; o código não verifica estrato nem GNSS 5/10. A decisão exige 30 m, mesmo estrato e GNSS. O impacto é a atribuição do rótulo à célula errada e a mistura de estratos.

Recomendação: 30 m, mesmo estrato, GNSS 5/10; teste que recusa ponto fora do estrato ou acima de 10 m.

### S2-4 — Top-up, estratos vazios e default 50 continuam

select-candidates/route.ts:707 completa a amostra por ordem de chegada quando a estratificação não atinge tamanhoAmostra; estratificacao.ts:265 calcula cota só sobre estratos ocupados; tamanhoAmostra = 50 (:196). A âncora não tem pi_i próprio. Top-up silencioso é amostragem de conveniência disfarçada.

Recomendação: remover o top-up, falhar se a cota não fechar, âncora de 60–80 com pi_i; decisão dependente de G-01.

### S2-5 — Geometria sem contenção, orientação ou re-thinning

construirPoligono502Ha continua quadrado alinhado aos eixos (sorteioPoligonos.ts:136), sem contenção no imóvel, sem orientação no declive e sem novo thinning após realocação. Um polígono pode atravessar a vertente ou sair da propriedade.

Recomendação: conter, orientar e re-thin; teste geométrico.

### S2-6 — Config do D25 não casa com a matriz

O config pede NDVI_Maximo_Mediano, Curvatura_Perfil e TWI; a matriz tem NDVI_P90_Serie e as duas últimas saem sempre indisponíveis; RUSLE_A não está no config. O próprio arquivo, em _pendencias_para_o_pesquisador, reconhece quatro das cinco divergências.

Recomendação: alinhar o config ao que existe; implementar Curvatura/TWI ou retirá-los; exigir RUSLE_A antes do ajuste.

### S2-7 — Kappa: código 0,61+IC, documentos 0,60

O código exige 0,61 com IC inferior; os documentos dizem 0,60 pontual. O portão duplo é quase inalcançável perto de 0,65; a decisão G-08 continua aberta. O código não pode ser mais rigoroso que a decisão sem que isso esteja escrito.

Recomendação: decidir G-08 e alinhar código/documento; se o critério for 0,60 + IC inferior >= 0,50, o n da dupla observação muda.

### S2-8 — Lastro: P02 e P05 continuam não conferidos

P02 e P05 permanecem em LASTRO_NAO_CONFERIDO. D02 e D10 saíram porque foram conferidos; P02 e P05 não. O thinning de 1 km continua sendo atribuído a Roberts, que não o prescreve; o WorldCover continua com a versão v100/v200 a esclarecer.

Recomendação: declarar 1 km como calibração e testar sensibilidade; arquivar v100/v200 com as duas citações. Não remover a dívida sem a fonte.

---

## 6. Coerência metodológica

### 6.1 O que a mudança de D10 resolve e o que não resolve

A adoção da máscara GEOS3 é a mudança mais importante desta rodada. Ela substitui um limiar univariado por uma conjunção com NBR2 e inclinações no visível, o que é fisicamente mais defensável para separar palhada de solo mineral. A conferência no primário e a declaração da transposição Landsat -> Sentinel-2 são exemplos do padrão que a norma pede.

O que não resolve: a transposição para Sentinel-2 não foi validada experimentalmente. A própria D10 diz que é hipótese. O teste de 30 pontos mediria tempo, não acurácia espectral; ele não substitui uma validação da máscara. A dissertação deve declarar isso e, se possível, medir a máscara contra uma amostra de campo ou de alta resolução.

### 6.2 D11.2: a guarda existe, mas não governa o caminho

O código tem duas camadas: amostragemSoloNuLote mede Ê com piso 6; montagemTemporal exige 12 para a matriz; estratificacao tem uma guarda que só roda se provenienciaE existir. No caminho de produção, a rota passa apenas o número. O resultado é que a camada mais rígida nunca vê o dado. É um exemplo de “defesa em profundidade” que virou “defesa em nenhuma profundidade”.

A correção não é só trocar 6 por 12 em um lugar. É fazer a proveniência viajar com o número até a partição, e fazer a partição recusar a ausência de qualidade. Sem isso, o próximo chamador repete o mesmo erro.

### 6.3 O painel de estado

O painel é uma boa ideia e a Diretriz de Desenvolvimento o coloca como leitura obrigatória. Mas ele está um commit atrás e a verificação oficial não roda. Um painel que não pode ser verificado é pior que um painel ausente, porque dá confiança falsa. O npm run estado deve ser executado em commit próprio; o estado:verificar precisa de um caminho que não dependa de cmd.exe sob sandbox.

### 6.4 O que a tese ainda não pode afirmar

- Não pode afirmar que Ê foi medido: 0 pontos.
- Não pode afirmar que o sorteio foi feito: status BLOQUEADO.
- Não pode afirmar que o D25 é probatório: A-06 ausente.
- Não pode afirmar que o 12x6 está implementado: só material.
- Não pode afirmar que o modelo P foi avaliado: só D.
- Não pode afirmar que a classe e a fração são coerentes: a validação não compara.
- Não pode afirmar que o painel de estado está atualizado: está um commit atrás.

---

## 7. Matriz de status

| Achado | Status em 09/11 | Evidência |
|---|---|---|
| D10 máscara GEOS3 | Resolvido no código e no lastro | mascaraSoloNuGeos3.ts; conferência 09/11 |
| D02 citação | Resolvido no conteúdo; pendente na forma | decisoes.ts:83-116; DECISOES_DE_CONVERSA 02 |
| D01/D20 | D01 resolvido; D20 incoerente no registro | fatorC.ts:52-80; D20 :413 |
| D11.2 | Aberto; guarda contornada | amostragemSoloNuLote.ts:650; route.ts:605 |
| Calibração 30 pontos | Não executada | 2026-11-09d; 0 pontos |
| 12x6 | Aberto | sorteioPoligonos.ts:228 |
| Selo/D26 UI | Aberto | ExportModal.tsx:56, :104 |
| A-06 | Aberto | D25:544-545 |
| Modelo P | Aberto | planilha.ts:315 |
| Classe/fração | Aberto | rotuloHumano.ts:66 |
| P03 | Aberto | ingestaoKobo.ts:82 |
| Top-up/âncora | Aberto | route.ts:707 |
| Geometria | Aberto | sorteioPoligonos.ts:136 |
| D25 config | Aberto | config_pre_registro_PROPOSTA.json |
| Kappa | Aberto | G-08 |
| P02/P05 | Aberto | LASTRO_NAO_CONFERIDO |
| ESTADO.md | Desatualizado | 2ba8e86 vs bca0e50 |

---

## 8. Prioridades

### P0 — antes de qualquer campanha

1. Corrigir D11.2 no caminho de produção (S1-1), com proveniência até a partição e teste de integração.
2. Executar a calibração de 30 pontos com credencial real (S1-2); corrigir o título do relatório.
3. Generalizar o sorteio para 12x6/14x4/12x4 (S1-3).
4. Ligar selo/D26 à UI e ao ZIP (S1-4).
5. Implementar A-06 (S1-5).
6. Decidir Modelo P ou retirar a alegação de predição (S1-6).
7. Validação dura classe/fração (S1-7).
8. Separar D02 e reclassificar D20 (S1-8).

### P1 — antes da análise

9. D08/NDVI_P90 (S2-2).
10. P03 (S2-3).
11. Top-up/âncora (S2-4).
12. Geometria (S2-5).
13. Config D25 (S2-6).
14. G-08/kappa (S2-7).
15. P02/P05 (S2-8).

### P2 — antes da defesa

16. Atualizar ESTADO.md e consertar estado:verificar (S2-1).
17. CI verde (lint) e suíte executável no ambiente de auditoria.

---

## 9. Limitações

- npm test não iniciou neste ambiente por spawn EPERM no config do Vitest; não há resultado de teste para reportar. O typecheck passou; o lint falhou com 2 warnings.
- npm run estado:verificar não rodou pelo mesmo motivo; a comparação foi feita manualmente pelo HEAD.
- Não há dado de campo, Ê medido ou selo real.
- Não abri todos os arquivos alterados; priorizei os que governam D10, D11.2, D01/D20, D02, D25 e o sorteio.
- Não decido G-01, G-08, G-12, G-13 ou G-15; apenas mostro onde o código não acompanha a decisão.

---

## Anexo — Evidências principais

- D11.2: src/lib/gee/amostragemSoloNuLote.ts:650-698; src/app/api/gee/select-candidates/route.ts:605-621; src/lib/gee/estratificacao.ts:166-173; src/lib/matriz/montagemTemporal.ts:77-89.
- Calibração: docs/verificacoes/2026-11-09d_calibracao_30_pontos_solo_nu.md:107-131; docs/planejamento/ESTADO.md:42-53.
- Sorteio: src/lib/gee/sorteioPoligonos.ts:228, :250, :263; src/lib/gee/sorteioPoligonosTipos.ts:103.
- Exportação: src/components/export/ExportModal.tsx:56, :104; src/components/campanha/PainelCampanha.tsx:121.
- D25: scripts/d25/avaliacao_d25_referencia.py:544-545; scripts/d25/config_pre_registro_PROPOSTA.json.
- Alvos: src/lib/matriz/perfis.ts:22-41.
- C: src/lib/rusle/fatorC.ts:52-80; src/config/decisoes.ts:413-424.
- D10: src/lib/gee/mascaraSoloNuGeos3.ts; src/config/decisoes.ts:205-247.
- Estado: docs/planejamento/ESTADO.md:6; npm run estado:verificar (EPERM).

---

**Fim do relatório.** Nenhum código, decisão ou parâmetro foi alterado por esta auditoria.
