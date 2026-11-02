# PROMPT — Executor Antigravity

## Correção e validação científica do SAREL v2 — frente XGBoost (D24/D25/D26)

**Versão:** 1.0 — 1 de novembro de 2026
**Commit de partida:** f63d8a5 (branch sarel/executor-2026-10-09)
**Contexto obrigatório:** docs/auditorias/AUDITORIA_FUNCIONALIDADES_COERENCIA_E_LASTRO_2026-10-31.md; docs/auditorias/AUDITORIA_CIENTIFICA_DESENHO_VALIDACAO_ALVO_2026-11-01.md; docs/planejamento/PROPOSTA_CORRECOES_POS_AUDITORIAS_2026-11-01.md.

> Leia este arquivo inteiro antes de editar. O objetivo não é fazer o XGBoost vencer; é tornar a pergunta “o XGBoost supera a linha de base física?” respondível com honestidade.

---

## 1. Papel e limites

Você é o executor técnico, não o pesquisador.

- Pode: implementar código, testes, scripts, documentação e correções de coerência; refatorar sem mudar semântica.
- Não pode: decidir metodologia, alterar limiar científico, promover decisão a “decidida”, escolher desenho amostral, mudar a métrica primária, a margem de D25 ou o alvo.
- Toda mudança que exija nova decisão está na Trilha B e só pode ser executada após aprovação na seção 11.
- Sem aprovação, execute apenas a Trilha A e entregue o relatório de gates pendentes.

### Git (CLAUDE.md §1)

- Não faça git commit, git push, branch, tag, PR ou reescrita de histórico sem autorização explícita do pesquisador, para aquela operação.
- Se um hook exigir commit/push, pare, reporte em uma linha e pergunte.
- Ao final, diga quais arquivos foram escritos e quais ficaram pendentes.

---

## 2. Leitura obrigatória

1. CLAUDE.md — regras de git, lastro, 9 Regras, 7 Invariantes, onde vivem os números.
2. docs/auditorias/AUDITORIA_CIENTIFICA_DESENHO_VALIDACAO_ALVO_2026-11-01.md.
3. docs/planejamento/PROPOSTA_CORRECOES_POS_AUDITORIAS_2026-11-01.md.
4. src/config/decisoes.ts; src/lib/matriz/perfis.ts; src/lib/matriz/montagem.ts; src/lib/export/planilha.ts; src/lib/export/pacoteReprodutibilidade.ts.
5. src/app/api/gee/select-candidates/route.ts; src/lib/gee/estratificacao.ts; src/lib/gee/sorteioPoligonos.ts.
6. src/lib/rotulos/rotuloHumano.ts; src/components/inspetor/InspetorPonto.tsx.
7. scripts/d25/avaliacao_d25_referencia.py; scripts/d25/fracao_erodida_celulas_referencia.py; scripts/d25/config_pre_registro_PROPOSTA.json.

---

## 3. Estado atual

- Não há dado de desfecho; nenhum voo D16 foi selado; os artefatos de 72 polígonos são sintéticos e marcados.
- O software está à frente do dado: a cadeia de candidatos, estratificação, matriz e exportação existe; a cadeia científica (amostra executável, alvo confiável, validação espacial, RUSLE) não está fechada.
- Bloqueios: 4 estratos com N_h < 4 (um com zero); alvo manual com default 0,00; só Modelo D exportado; held-out aleatório dentro do estrato; matriz sem Estrato_ID, pi_i, Incluida, Pixel_ID; D25 sem config congelado e sem RUSLE_A.
- npm run typecheck passa; npm run lint -- --max-warnings 0 falha com 2 warnings; npm test pode falhar por infraestrutura. Não mascare.

---

## 4. Missão e sucesso

Deixar a frente XGBoost/D25 cientificamente viável:

P1 — amostra/estrutura: matriz com Estrato_ID, pi_i, w_i, Poligono_ID, Papel_Conjunto, Incluida, Pixel_ID.
P2 — alvo: fração erodida com origem rastreável (D26 ou importação), sem default 0,00, com P11 e coerência.
P3 — validação: D25 falha sem chave, sem config congelado, sem 18/36 (ou número aprovado) ou sem RUSLE_A.
P4 — comparação: XGBoost primário, competidores declarados, uma única avaliação do held-out, sensibilidades pré-registradas, relatório com limites.

Não otimize para “XGBoost > RUSLE”; otimize para que o resultado — corroborado, inconclusivo ou refutado — seja defensável.

---

## 5. Trilha A — execute agora

### A-01 — D11.2: piso de Ê por estimando e guarda de D12 efetiva

Onde: src/lib/gee/copernicusGeeClient.ts; src/app/api/gee/select-candidates/route.ts; src/lib/gee/estratificacao.ts; src/lib/matriz/montagemTemporal.ts.

Faça:
1. Substituir o piso escalar de 6 por: N_MIN_D11_1=6 (triagem), N_MIN_D11_2=12 e SE_MAX_D11_2=0.144 (Ê decenal/bienal), N_MIN_D11_3=9 (percentis de cauda), N_MIN_D11_4=12 (harmônicos), N_FALLBACK_D11_2=6 e SE_FALLBACK≈0.20 (só janela <120 dias).
2. Criar avaliarSuficienciaD11({n, janelaDias, estimando}) retornando {suficiente, regime, se, elegivelD12, causa, motivo}.
3. A rota deve enviar provenienciaE com qualidade: {nObservacoes, regime, elegivelD12, erroPadrao}. Ê de fallback entra como medido com elegivelD12:false.
4. Em estratificacao.ts, a guarda de D12 é obrigatória: se provenienciaE faltar, lançar erro; se podeEntrarEstratificacaoD12 for falso, lançar erro nomeando o candidato.
5. Em montagemTemporal.ts, podeEntrarEstratificacaoD12 retorna false para medido sem qualidade ou com nObservacoes < 12.
6. Testes: 6 não entra; 11 fallback não entra; 12 com SE <= 0,144 entra; sem proveniência a estratificação falha.

Aceite: não é possível produzir 18 estratos com Ê de 6 observações.

### A-02 — P03: três critérios de campo

Onde: src/lib/rotulos/ingestaoKobo.ts e testes.

Faça:
1. Substituir 15/25 m por: teto de 30 m; integridade de estrato (estratoEsperado vs estratoObservado em S, E, K); GNSS <=5 m aceito, 5–10 m marcado, >10 m rejeitado.
2. Features extraídas na coordenada observada; se não for possível, indisponivel e não aceitar como rótulo.
3. Testes: 29 m aceito; 31 m rejeitado; mudança de estrato rejeitada; GNSS 8 m marcado; 12 m rejeitado.

### A-03 — P07: semente registrada

Onde: select-candidates/route.ts; scripts/sortear_poligonos_d16.ts; sorteioPoligonos.ts.

Faça:
1. Remover const semente = 42.
2. Aceitar semente explícita; se ausente, gerar com crypto.randomInt(1, 2**31 - 1).
3. Registrar no relatório, no critério de seleção e no selo D16.
4. No CLI D16, exigir --semente para --confirmar.
5. Testes: sementes diferentes → sorteios diferentes; mesma semente → mesmo resultado e registro.

### A-04 — D20: atribuição correta do Fator C

Onde: src/lib/rusle/fatorC.ts; StatsOverview.tsx; testes.

Faça:
1. BSI válido → modelo “Híbrido SPD (D20)” e decisoes [“D20”]; BSI ausente → “Durigon puro (D01)” e decisoes [“D01”].
2. Corrigir comentários e o rótulo “RUSLE (Durigon C)” quando híbrido.
3. Teste: BSI presente cita D20; ausente cita D01.

### A-05 — Contrato de dados da matriz

Onde: src/types/ponto.ts; src/lib/matriz/perfis.ts; src/lib/matriz/montagem.ts; src/lib/export/planilha.ts; src/lib/export/pacoteReprodutibilidade.ts.

Faça:
1. Adicionar aos perfis matriz-treino/matriz-heldout: Estrato_ID, Pi_i, W_i, Incluida, Cobertura_Celula, Pixel_ID, Modelo, Data_Referencia, Fim_Janela.
2. Popular Pi_i/W_i do selo D16 por Poligono_ID; Incluida/Cobertura_Celula/Pixel_ID do CSV D26; Modelo D/P; datas.
3. Criar src/lib/matriz/esquema.ts com colunas obrigatórias por perfil e validarEsquemaMatriz (Zod já existe).
4. Teste: a matriz contém as colunas; o esquema rejeita matriz sem Estrato_ID.

### A-06 — D25 fail-closed

Onde: scripts/d25/avaliacao_d25_referencia.py; config e testes.

Faça:
1. Em --probatorio, exigir Incluida, Pixel_ID, Estrato_ID, Modelo, Data_Referencia; n_poligonos_heldout e n_estratos no config (padrão 36/18, salvo B-01); monotonicidade não vazia; pre_registro completo e hash válido; RUSLE_A disponível.
2. _so_incluidas e _checar_pixels_disjuntos falham se as colunas faltarem em modo probatório; em dry-run, avisam.
3. Testes: 35 polígonos falha; sem Incluida falha; monotonicidade vazia falha; hash divergente falha; sem RUSLE_A falha.

### A-07 — Alvo D26: sem default e com origem

Onde: InspetorPonto.tsx; rotuloHumano.ts; ingestaoDrone.ts; planilha.ts.

Faça:
1. Remover default 0,00; campo inicia vazio; salvar exige valor explícito.
2. Remover observador/confiança padrão.
3. Coerência mínima: “erosao” com 0,00 rejeita; “controle” com >=0,25 rejeita; intermediários avisam e registram.
4. Criar importação do CSV D26 (Fracao_Erodida, Incluida, Cobertura_Celula, Pixel_ID, Area_Delineada_m2, Poligono_ID) e associar por Celula_ID/Pixel_ID.
5. Se Incluida=false, não entra no treino principal; pode entrar em sensibilidade.
6. Testes: não salva “erosao” com 0,00; importa CSV e preserva chaves; rejeita sem cobertura.

### A-08 — Remover fabricações numéricas

Onde: serieTemporal.ts; amostragemSoloNuLote.ts; montagem.ts; fallbackLocal.ts; jevClient.ts.

Faça:
1. NDVI/BSI: null quando denominador nulo; não retornar 0; não clampar ±1; chamador marca indisponivel/fora-do-dominio.
2. Remover clamp [0,1] da fração de solo nu; fora do domínio é erro.
3. Remover “BLOCO_INDEFINIDO”; ponto sem bloco não entra no treino.
4. Remover confiança default 0,95 e confianças fixas do JEV; laudo é heurístico.
5. Testes: 0/0 → indisponível; BSI fora de [-1,1] → indisponível; sem bloco → rejeitado; JEV sem confiança numérica.

### A-09 — JEV: sem coordenadas e sem confiança fabricada

Onde: jevClient.ts; api/jev/auditar/route.ts.

Faça:
1. Remover latitude/longitude/município do payload externo.
2. Exigir opt-in; registrar requisição de saída no diário local.
3. Marcar laudo como “HEURISTICA”; não usar como rótulo/target/métrica.
4. Teste: payload sem coordenadas; laudo não entra em montarMatrizTreino.

### A-10 — CI, textos e registro

Onde: CI; decisoes.ts; README.md; FICHA_TECNICA_SAREL.md; docs/bibliografia/README.md.

Faça:
1. Corrigir os 2 warnings ou registrar exceção datada; CI verde.
2. Atualizar D07/P05 (divergência que não existe), D23 (36→72/4), Ficha §7.2 (invariantes), Ficha P03 (30 m/estrato/GNSS), README P=1,0 (estado atual, não decisão), README bibliográfico D01–D28→D01–D26, Header D01–D19→D01–D26.
3. Teste de paridade dos números e do intervalo de decisões.

### A-11 — Geometria, realocação e âncora

Onde: sorteioPoligonos.ts; select-candidates/route.ts; sorteioPoligonosTipos.ts.

Faça:
1. Verificar contenção do polígono no imóvel/domínio antes do selo; sem geometria, falhar com geometria-indisponivel.
2. Reaplicar thinning após realocação; registrar distância mínima.
3. Implementar âncora D23 separada, com pi_i próprio, fora dos polígonos.

Aceite: selo não aprova polígono que cruza divisa; âncora tem pi_i.

---

## 6. Trilha B — gates (não execute sem aprovação)

Sem a linha marcada na seção 11, não altere D12, D16, D23, D25, D26, D04, P11, P10 nem o limiar de kappa. Pode preparar relatório de opções e patch isolado, mas não aplicar.

### B-01 — Fatorial inviável

Pergunta: como lidar com 4 estratos com N_h < 4 e E_1_1_2 = 0?

Opções:
1. Colapsar Ê no quadrante deficiente (E_1_*,2 e E_2_2-3,2): 14–16 estratos, 56–64 polígonos; mantém 2+2; Cochran §5A.12; perde o contraste de Ê no quadrante.
2. Declarar S1×K2 fora do domínio D07: 15–17 estratos, 60–68 polígonos.
3. Desenho condicional/aninhado: K só onde há variabilidade; 15 estratos.
4. Exaustão do estrato raro (pi=1): não resolve a célula zero.

Recomendação: opção 1 + declarar que o contraste de Ê no quadrante colapsado não é estimável; emenda a D12/D16 antes do sorteio.
Lastro: Cochran (1977) §5A.12; Olofsson et al. (2014).

### B-02 — Estimando: área ou polígono

Pergunta: o produto é “área da BP3” ou “desempenho na população de polígonos elegíveis”?
Opções: (1) limitar ao polígono; (2) novo desenho de área; (3) dois produtos separados.
Recomendação: opção 1; nunca usar pi_i=4/N_h como peso de área.
Lastro: D16/D23; Olofsson et al. (2014); Cochran (1977); King & Zeng (2001).

### B-03 — Validação espacial

Pergunta: o hold-out aleatório dentro do estrato sustenta generalização espacial?
Opções: (1) renomear para “hold-out por polígono, não espacial”; (2) bloco espacial; (3) sensibilidade por buffer.
Recomendação: opção 1 + opção 3; opção 2 se a cobertura por estrato permitir.
Lastro: Roberts et al. (2017); Ploton et al. (2020); D24.

### B-04 — Modelo P

Pergunta: a dissertação alega predição prospectiva (P) ou só detecção (D)?
Opções: (1) D only; (2) D+P; (3) P only.
Recomendação: opção 2 se predição é a contribuição central; senão 1 com emenda a D04.
Lastro: D04; Kaufman et al. (2012); TRIPOD+AI (2024).

### B-05 — Estado vs evento e P11

Pergunta: o alvo é cicatriz (estado) ou erosão nova (incidente)? Qual cobertura P11?
Opções: estado ou incidente; P11 0,95 / 0,90 / sem filtro com covariável.
Recomendação: estado para a dissertação atual; P11 0,95 com sensibilidade 0,90.
Lastro: D26; Altman & Royston (2006); Ferrari & Cribari-Neto (2004).

### B-06 — Tweedie, beta ou dois estágios

Pergunta: fração [0,1] com muitos zeros pede Tweedie?
Opções: (1) Tweedie e declarar ordenador; (2) beta inflado de zeros como sensibilidade; (3) dois estágios (logistic + beta).
Recomendação: manter Tweedie primário; acrescentar beta inflado/dois estágios como sensibilidade; calibrar se probabilidade.
Lastro: Tweedie (1984); Ferrari & Cribari-Neto (2004); Ospina & Ferrari (2010, 2012); Brier (1950); Niculescu-Mizil & Caruana (2005).

### B-07 — Kappa

Pergunta: 0,60 ou 0,61? Com IC inferior ou só pontual?
Opções: 0,60 pontual; 0,61 pontual; 0,61 + IC inferior; 0,60 + IC inferior.
Recomendação: uma única regra em D03/D16; se portão duplo, declarar n e potência.
Lastro: Cohen (1960); Landis & Koch (1977); Congalton & Green (2019).

### B-08 — Poder e margem de D25

Pergunta: 36 clusters resolvem a margem de 0,10?
Opções: manter 0,10 e aceitar INCONCLUSIVA; aumentar held-out (72 fixos); mudar margem; desenho pareado.
Recomendação: manter 0,10; reportar poder; aceitar INCONCLUSIVA; não alterar após ver dados.
Lastro: Riley et al. (2019, 2020); van der Ploeg et al. (2014); D25.

### B-09 — Não resposta e âncora

Pergunta: como tratar recusas e a âncora de prevalência?
Opções: supor MCAR e reportar; pesos de resposta; sensibilidade; substituição com pi_i atualizado.
Recomendação: protocolo pré-registrado + sensibilidade; âncora separada com pi_i.
Lastro: D23; Olofsson et al. (2014); King & Zeng (2001); Cochran (1977).

### B-10 — Bake-off de modelos

Pergunta: testar GAM/EBM, CatBoost, BART ou stacking?
Opções: (1) XGBoost + penalizado (já no D25); (2) bake-off secundário pré-registrado na validação interna; (3) stacking.
Recomendação: opção 2; não selecionar no held-out; não trocar o primário. Opção 3 só se o objetivo for desempenho, não a hipótese.
Lastro: Chen & Guestrin (2016); Dietterich (1998); Demšar (2006); Wolpert (1996); Cawley & Talbot (2010); Lou et al. (2013).

### B-11 — D22 (tabela de P provisória)

Pergunta: implementar a tabela de P de D22 ou manter P=1,0?
Opções: implementar com status provisorio; manter P=1,0 e declarar D22 não operacional; verificar Bertoni/Lombardi antes.
Recomendação: verificar a fonte primeiro; se não houver, manter P=1,0 com limitação escrita e D22 “não operacional”.
Lastro: D22; R-L4; Wischmeier & Smith (1978); Bertoni & Lombardi Neto (a conferir).

### B-12 — Lastro de Rikimaru, D02 e D13

Pergunta: como citar os limiares de D02 e o fator 9,81 de D13?
Opções: citar Rikimaru só para o BSI e declarar cortes como convenção; buscar fonte dos cortes; declarar 9,81 como calibração com incerteza.
Recomendação: não atribuir os cortes a Rikimaru; declarar convenção + sensibilidade; propagar a marca de 9,81.
Lastro: Rikimaru et al. (2002); Renard et al. (1997); Rufino et al. (1993); R-L2/R-L4.

---

## 7. Trilha C — análise e relatório

1. scripts/d25/poder_d25.py: simular 36 clusters, ~25 unidades efetivas, alvo zero-inflado, diferença de Spearman 0,10, bootstrap por cluster; reportar poder e largura do IC. Não é resultado científico.
2. Plano de sensibilidades pré-registradas: com/sem monotonicidade; com/sem Frequencia_Solo_Nu; P11 0,95/0,90; Tweedie vs beta; buffer espacial; ablação R/K/LS; com/sem peso; limiar 0,20/0,25/0,30.
3. docs/relatorios/model_card_xgboost_2026-11-01.md: uso, população, features, target, desempenho/IC, calibração, limitações, riscos (PROBAST adaptado).
4. docs/metodologia/DICIONARIO_MATRIZ_TREINO.md: coluna, unidade, suporte, origem, decisão.

---

## 8. Contrato de dados

A matriz matriz-treino/matriz-heldout deve ter:

- Identificadores: Celula_ID, Ponto_ID, Poligono_ID, Pixel_ID (opaco).
- Desenho: Estrato_ID, Pi_i, W_i, Papel_Conjunto, Bloco_Espacial.
- Modelo/tempo: Modelo (D/P), Data_Referencia, Fim_Janela.
- Cobertura: Incluida, Cobertura_Celula, Area_Delineada_m2.
- Alvo: Fracao_Erodida, Alvo_Binario_25, Classe_Alvo_Binaria, Rotulo_N_Observadores.
- Preditores: os blocos do config D25 (máx. D24).

Regras: sem coordenadas no treino; Pixel_ID é hash opaco; Pi_i em (0,1]; W_i > 0; Fracao_Erodida em [0,1]; vazio é ausente, nunca 0; Modelo explícito; D e P nunca misturados; esquema versionado 2.0.0.

---

## 9. Protocolo de validação

1. Primário: XGBoost reg:tweedie com monotonicidade; alvo Fracao_Erodida; métrica primária Spearman; piso/margem de D25.
2. Competidores: RUSLE (A = R·K·LS·C·P) e regressão penalizada Tweedie. Secundário: GAM/EBM/CatBoost só se B-10.
3. Divisão: 36 polígonos held-out (ou número aprovado), 2 por estrato; treino e held-out nunca compartilham Poligono_ID nem Pixel_ID.
4. Validação interna: GroupKFold por Poligono_ID; hiperparâmetros e p de Tweedie só no treino.
5. Held-out: uma única avaliação; nenhuma escolha depois de vê-lo.
6. Espacial: sensibilidade por bloco/buffer, pré-registrada; não substitui o principal sem B-03.
7. Calibração: se probabilidade, Brier e calibration slope/intercept.
8. Poder: simulação C-01; IC largo → INCONCLUSIVA é resultado.
9. Multiplicidade: um desfecho primário; quarto desfecho e sensibilidades são secundários/não confirmatórios.
10. Reporte: TRIPOD+AI adaptado; PROBAST adaptado; model card.

---

## 10. Testes, entregáveis e formato

Comandos: npm run typecheck; npm run lint -- --max-warnings 0; npm test; python -m unittest discover -s scripts/d25 -p "test_*.py".

Se npm test falhar por caminho/acento/spawn EPERM, registre a saída e não conclua que passou.

Entregáveis:
1. Código/testes da Trilha A.
2. docs/auditorias/RELATORIO_EXECUCAO_VALIDACAO_XGBOOST_2026-11-01.md com arquivos, comandos/resultados, achados resolvidos, gates, riscos e próximos passos.
3. Se B aprovado: código/testes e atualização do registro com assinatura do pesquisador.
4. Nenhum commit/push sem autorização.

Resposta final: resumo de 5–10 linhas; tabela A-01..A-11 e B-01..B-12; testes comando→resultado; 3–5 riscos; pendências do pesquisador.

---

## 11. Termo de aprovação

Se a linha não estiver marcada [x], o gate não está aprovado. Sem aprovação, execute apenas a Trilha A.

- [ ] B-01 — Fatorial: opção ____ (1/2/3/4).
- [ ] B-02 — Estimando: opção ____ (1/2/3).
- [ ] B-03 — Validação espacial: opção ____ (1/2/3).
- [ ] B-04 — Modelo P: opção ____ (1/2/3).
- [ ] B-05 — Estado/evento e P11: opção ____.
- [ ] B-06 — Tweedie/beta: opção ____ (1/2/3).
- [ ] B-07 — Kappa: regra ____.
- [ ] B-08 — Poder/margem: opção ____.
- [ ] B-09 — Não resposta/âncora: opção ____.
- [ ] B-10 — Bake-off: opção ____ (1/2/3).
- [ ] B-11 — D22: opção ____.
- [ ] B-12 — Lastro Rikimaru/D13: opção ____.

Assinatura do pesquisador: ______________________  Data: ____/____/______

---

## 12. Referências de lastro

Use estas referências; não invente outras.

### Amostragem, alvo e pré-registro
- Cochran, W. G. (1977). Sampling Techniques, 3rd ed. Wiley. ISBN 0-471-16240-X.
- Olofsson, P. et al. (2014). Good practices for estimating area and assessing accuracy of land change. Remote Sensing of Environment 148:42–57. https://doi.org/10.1016/j.rse.2014.02.015
- King, G. & Zeng, L. (2001). Logistic regression in rare events data. Political Analysis 9(2):137–163. https://doi.org/10.1093/oxfordjournals.pan.a004868
- Nosek, B. A. et al. (2018). The preregistration revolution. PNAS 115(11):2600–2606. https://doi.org/10.1073/pnas.1708274114
- Kaufman, S. et al. (2012). Leakage in data mining. ACM TKDD 6(4):15. https://doi.org/10.1145/2382577.2382579

### Validação, modelo e incerteza
- Roberts, D. R. et al. (2017). Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure. Ecography 40(8):913–929. https://doi.org/10.1111/ecog.02881
- Ploton, P. et al. (2020). Spatial validation reveals poor predictive performance of large-scale ecological mapping models. Nature Communications 11:4540. https://doi.org/10.1038/s41467-020-18321-y
- Cawley, G. C. & Talbot, N. L. C. (2010). On over-fitting in model selection and subsequent selection bias in performance evaluation. JMLR 11:2079–2107. https://jmlr.csail.mit.edu/papers/v11/cawley10a.html
- van der Ploeg, T., Austin, P. C. & Steyerberg, E. W. (2014). Modern modelling techniques are data hungry. BMC Medical Research Methodology 14:137. https://doi.org/10.1186/1471-2288-14-137
- Riley, R. D. et al. (2019). Minimum sample size for developing a multivariable prediction model: Part II. Statistics in Medicine 38(7):1276–1296. https://doi.org/10.1002/sim.7993
- Riley, R. D. et al. (2020). Calculating the sample size required for developing a clinical prediction model. BMJ 368:m441. https://doi.org/10.1136/bmj.m441
- Dietterich, T. G. (1998). Approximate statistical tests for comparing supervised classification learning algorithms. Neural Computation 10(7):1895–1923. https://doi.org/10.1162/089976698300017197
- Demšar, J. (2006). Statistical comparisons of classifiers over multiple data sets. JMLR 7:1–30. https://jmlr.org/papers/v7/demsar06a.html
- Wolpert, D. H. (1996). The lack of a priori distinctions between learning algorithms. Neural Computation 8(7):1341–1390. https://doi.org/10.1162/neco.1996.8.7.1341

### Modelos e calibração
- Chen, T. & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. KDD 785–794. https://doi.org/10.1145/2939672.2939785
- XGBoost — monotonic constraints: https://xgboost.readthedocs.io/en/stable/tutorials/monotonic.html
- XGBoost — parameters (reg:tweedie): https://xgboost.readthedocs.io/en/stable/parameter.html
- Tweedie, M. C. K. (1984). An index which distinguishes between some important exponential families. In Statistics: Applications and New Directions, ISI, pp. 579–604. (sem DOI)
- Ferrari, S. L. P. & Cribari-Neto, F. (2004). Beta regression for modelling rates and proportions. Journal of Applied Statistics 31(7):799–815. https://doi.org/10.1080/0266476042000214501
- Ospina, R. & Ferrari, S. L. P. (2010). Inflated beta distributions. Statistical Papers 51:111–126. https://doi.org/10.1007/s00362-008-0125-4
- Ospina, R. & Ferrari, S. L. P. (2012). A general class of zero-or-one inflated beta regression models. Computational Statistics & Data Analysis 56(6):1609–1623. https://doi.org/10.1016/j.csda.2011.10.005
- Brier, G. W. (1950). Verification of forecasts expressed in terms of probability. Monthly Weather Review 78(1):1–3. https://doi.org/10.1175/1520-0493(1950)078%3C0001:VOFEIT%3E2.0.CO;2
- Niculescu-Mizil, A. & Caruana, R. (2005). Predicting good probabilities with supervised learning. ICML 625–632. https://doi.org/10.1145/1102351.1102430
- Lou, Y. et al. (2013). Accurate intelligible models with pairwise interactions. KDD 623–631. https://doi.org/10.1145/2487575.2487579
- Lundberg, S. M. & Lee, S.-I. (2017). A unified approach to interpreting model predictions. NeurIPS. https://arxiv.org/abs/1705.07874

### Obras citadas nas decisões e no protocolo

- Altman, D. G. & Royston, P. (2006). The cost of dichotomising continuous variables. BMJ 332(7549):1080. https://doi.org/10.1136/bmj.332.7549.1080
- Congalton, R. G. & Green, K. (2019). Assessing the Accuracy of Remotely Sensed Data: Principles and Practices, 3rd ed. CRC Press. https://doi.org/10.1201/9780429052729
- Rikimaru, T. et al. (2002). Tropical forest cover density mapping. Tropical Ecology 43(1):39–47. (sem DOI no acervo; obra a conferir; usar apenas para o índice BSI, não para os cortes de D02 — ver B-12)
- Renard, K. G. et al. (1997). Predicting Soil Erosion by Water: A Guide to Conservation Planning with the Revised Universal Soil Loss Equation (RUSLE). USDA Agriculture Handbook 703.
- Rufino, R. L., Biscaia, R. C. M. & Merten, G. H. (1993). Determinação do potencial erosivo das chuvas no Estado do Paraná: terceira aproximação. Revista Brasileira de Ciência do Solo 17:439–444.
- Wischmeier, W. H. & Smith, D. D. (1978). Predicting Rainfall Erosion Losses: A Guide to Conservation Planning. USDA Agriculture Handbook 537.
- Bertoni, J. & Lombardi Neto, F. Conservação do Solo. (Obra a conferir; D22 declara a tabela de P como provisória e não verificada no primário; não usar como lastro confirmado.)
- Registro do projeto: D01–D26 e P01–P24 em src/config/decisoes.ts.

### Rótulo, concordância e reporte
- Cohen, J. (1960). A coefficient of agreement for nominal scales. Educational and Psychological Measurement 20(1):37–46. https://doi.org/10.1177/001316446002000104
- Landis, J. R. & Koch, G. G. (1977). The measurement of observer agreement for categorical data. Biometrics 33(1):159–174. https://doi.org/10.2307/2529310
- Frénay, B. & Verleysen, M. (2014). Classification in the presence of label noise: a survey. IEEE TNNLS 25(5):845–869. https://doi.org/10.1109/TNNLS.2013.2292894
- Collins, G. S. et al. (2024). TRIPOD+AI statement. BMJ 385:e078378. https://doi.org/10.1136/bmj-2023-078378
- Moons, K. G. M. et al. (2019). PROBAST: explanation and elaboration. Annals of Internal Medicine 170(1):51–58. https://doi.org/10.7326/M18-1377
- Saito, T. & Rehmsmeier, M. (2015). The precision-recall plot is more informative than the ROC plot. PLOS ONE 10(3):e0118432. https://doi.org/10.1371/journal.pone.0118432

---

**Fim do prompt.** Nenhuma alteração de código, decisão ou parâmetro foi feita por este arquivo.
