# Auditoria pós-correções — programa, funcionalidade e coerência científica

**Data:** 3 de novembro de 2026
**Commit auditado:** 3a9828e (branch correcoes/contencao-2026-11-02), com alterações não commitadas em docs
**Base:** auditoria anterior de a058954
**Natureza:** auditoria independente, somente leitura. Nenhum código, decisão ou parâmetro foi alterado; nenhum commit ou push foi feito.

---

## 1. Veredito

O executor respondeu aos achados com trabalho real: corrigiu a semântica de vazio no D25, criou opções de selo/D26 na camada de exportação, acrescentou o cenário 12 x 6 ao material de G-01 e retificou, com razão, a crítica anterior à simulação de poder.

Mas a resposta ficou na camada da biblioteca, não na ponta da interface, e o 12 x 6 ficou no material de decisão, não no algoritmo de sorteio. A cadeia científica continua bloqueada por seis S1: o 12 x 6 não é sorteável, o selo/D26 não chega às exportações principais, o D25 ainda não é estrito, D11.2 continua em 6, o Modelo P não é exportado e classe/fração ainda podem se contradizer.

**Contagem: 6 achados S1 e 11 S2.**

---

## 2. Baseline

| Verificação | Resultado |
|---|---|
| Branch / commit | correcoes/contencao-2026-11-02 / 3a9828e; 3 arquivos modificados e 3 novos não rastreados em docs |
| Typecheck | passa (exit 0) |
| Lint | falha com os mesmos 2 warnings: MapViewer.tsx:526 e PointPopup.tsx:69 |
| Testes JS | não iniciam neste ambiente (spawn EPERM no config do Vitest); a branch relata 95 arquivos, 797 testes, 3 pulados |
| Testes D25 | a branch relata 55 testes Python OK; não executados aqui |
| Dados | sem base fundiária, sem selo D16 real e sem CSV D26 |

---

## 3. O que foi corrigido

### 3.1 S1-1 — vazio não é false

O D25 agora distingue Incluida ausente, 100% vazia, parcialmente vazia e preenchida; não filtra sem insumo e emite aviso. Pixel_ID vazio é descartado antes da checagem. Reproduzi o caso de 6 linhas com campos vazios: _so_incluidas preservou 6 de 6 e avisou; _checar_pixels_disjuntos não lançou erro e avisou. O falso vazamento e o filtro para zero foram sanados. A branch relata 6 testes novos e 55 testes D25.

### 3.2 Selo e D26 na biblioteca

OpcoesExportacao ganhou seloD16 e exigirDelineacaoD26; planilha.ts, csv.ts e pacoteReprodutibilidade.ts repassam as opções; PainelMatrizTreino carrega o selo para a prévia; o script D25 gerado foi regerado com novo hash.

### 3.3 Cenário 12 x 6 no material de G-01

O cenário foi acrescentado a scripts/cenarios_g01.py e à página G-01: 12 estratos, 6 polígonos por estrato (3+3), 72 polígonos, 36 held-out, 361,4 ha, min(N_h)=12 e 98,6% de preenchimento sob 25% de recusa. Os sete cenários originais permaneceram idênticos. O relatório argumenta, corretamente, que a agregação de K não é o colapso de Cochran 5A.12.

### 3.4 Retificação da simulação de poder

A retificação é procedente: a versão oficial modela o efeito de polígono no alvo (SD 0,8 em logito; ICC 0,0371; ~25,6 unidades efetivas por polígono), e a execução com R=500 eliminou as inversões de monotonicidade; a largura do IC escala com 1/sqrt(k). Minha crítica anterior de i.i.d. puro descrevia a versão preliminar e deve ser retirada. A ressalva restante é que os scores ainda usam ruído i.i.d. dentro do polígono; se os erros do modelo forem espacialmente correlacionados, o poder real pode ser menor. A G-13 não trata essa fonte.

---

## 4. Achados S1

### S1-A — O 12 x 6 não é sorteável pelo algoritmo atual

O cenário existe em scripts/cenarios_g01.py e na página G-01, mas sortear72PoligonosD16 continua hardcoded para 18 estratos, 4 por estrato e 2+2 papéis:
- loop em TODOS_ESTRATOS_D12 (18) em sorteioPoligonos.ts:228 e :250;
- mínimo nH < 4 em :257;
- pi_i = 4 / nH e w_i = nH / 4 em :263-264;
- Fisher-Yates de 4 e papéis ["treino","treino","held-out","held-out"] em :280-293.

Não há parâmetro de número de estratos, de polígonos por estrato nem de 3+3. O tipo do selo só aceita 36|72 (sorteioPoligonosTipos.ts:103-106); a compatibilidade do 12 x 6 com 72 é aritmética, não funcional.

**Impacto:** se G-01 escolher 12 x 6, o sorteio não executa. O relatório do cenário diz “compatível com o tipo do selo” e não menciona que o algoritmo é 18 x 4. A conclusão “12 x 6 está na mesa” é verdadeira como material de decisão, falsa como capacidade do programa.

**Recomendação:** generalizar sortear72PoligonosD16 para receber número de estratos, polígonos por estrato e split treino/held-out; recalcular pi_i = n_h/N_h e w_i = N_h/n_h; ajustar o tipo do selo; teste que sorteia 12 x 6.

### S1-B — O selo e o D26 não chegam às exportações principais da interface

A biblioteca aceita seloD16 e exigirDelineacaoD26, mas os chamadores da interface não os passam:
- ExportModal.tsx:56: gerarPlanilhaXLSX(pontosVisiveis) — sem opções;
- ExportModal.tsx:104: gerarPacoteReprodutibilidadeZip(pontosVisiveis, rotulosConsolidados) — sem opções; o pacote inclui 01_matriz_treinamento.csv;
- PainelCampanha.tsx:121: gerarPlanilhaXLSX(pontosAtivos, { perfil, rotulosConsolidados }) — sem selo/D26;
- PainelMatrizTreino.tsx:41-43 carrega o selo apenas para a prévia; não exporta.

O teste 9 de contratoMatrizS11.test.ts verifica chamadas a montarMatrizTreino em planilha.ts, pacoteReprodutibilidade.ts e PainelMatrizTreino.tsx, mas não percorre ExportModal/PainelCampanha. Ele conclui “as 4 rotas de produção repassam seloD16”, o que é verdade no nível da biblioteca e falso no nível do usuário.

**Impacto:** o usuário que exporta a matriz pelo pacote ou pela Central de Campanha continua recebendo Pi_i, W_i, Estrato_ID, Incluida e Pixel_ID vazios. O D25 atual trata vazio como ausência e avisa — mas, sem A-06, não falha.

**Recomendação:** passar seloD16 e exigirDelineacaoD26 em ExportModal/PainelCampanha; carregar o CSV D26 explicitamente; ampliar o teste para as chamadas de UI; teste de integração exportando o ZIP real.

### S1-C — A-06 continua ausente: o D25 avisa, mas não exige

O D25 em modo probatório ainda aceita:
- held-out >= 2 e treino >= 4 (avaliacao_d25_referencia.py:544-545), não 36/18 ou o número de G-01;
- Incluida vazia e Pixel_ID vazio: agora avisa, mas não falha;
- ausência de Modelo, Data_Referencia, Estrato_ID, monotonicidade não vazia e RUSLE_A antes do ajuste;
- config não congelado (pre_registro null; config_pre_registro_PROPOSTA.json:50).

O relatório de chaves vazias declara A-06 fora de escopo e remete ao prompt P-V.

**Impacto:** o D25 pode rodar em modo probatório com matriz sem cobertura, sem pixel, sem 36 clusters e sem RUSLE_A. O resultado não seria probatório, mas o avaliador não impede.

**Recomendação:** implementar A-06: em --probatorio, falhar com causas tipadas para cada ausência; exigir n_poligonos_heldout e n_estratos do config; exigir RUSLE_A antes de ajustar; exigir monotonicidade; exigir hash. Em dry-run, avisar.

### S1-D — D11.2 continua em 6 observações

copernicusGeeClient.ts:29 mantém LIMIAR_MINIMO_OBSERVACOES_D11 = 6; avaliarSuficienciaAmostralD11 (:64) só verifica n < 6. A D11.2 decidida em 31/10 exige 12 e SE <= 0,144, com fallback 6–11 inelegível para D12. É o S1 mais antigo e continua aberto.

### S1-E — Modelo P continua não exportável

planilha.ts:309-310 e PainelMatrizTreino.tsx:42 fixam modeloJanela: "D". O tipo aceita "D" | "P" e a coluna Modelo existe, mas nenhuma rota de produção emite P. D04 diz “ambos os modelos integrados”. A evidência é de detecção contemporânea, não de predição prospectiva.

### S1-F — Classe e fração ainda podem se contradizer

InspetorPonto.tsx:38 inicia classeRotuloInput como "erosao"; a fração inicia null, mas o usuário pode digitar 0,00. rotuloHumano.ts:66-90 exige fração presente e no domínio, mas não compara com a classe. “Erosao” + 0,00 é aceito; montarMatrizTreino usa a fração como alvo e grava o ponto como negativo. O teste aceita 0 explícito apenas com classe “controle” (rotuloHumano.test.ts:86-99); não testa “erosao” + 0.

---

## 5. Achados S2

1. P03 continua 15/25 m; não verifica estrato nem GNSS (ingestaoKobo.ts:82).
2. Fator C continua atribuído a D01; o híbrido é D20 (fatorC.ts:133).
3. Top-up, estratos vazios e tamanho 50 continuam (select-candidates/route.ts:707; estratificacao.ts:263-293; :196). A âncora não tem pi_i.
4. Geometria, contenção e realocação continuam sem verificação (sorteioPoligonos.ts:136; pré-condições).
5. Config do D25 não casa com a matriz: pede NDVI_Maximo_Mediano, Curvatura_Perfil e TWI; a matriz tem NDVI_P90_Serie e as duas últimas saem indisponíveis; RUSLE_A ausente.
6. G-01 continua sem decisão e Cochran não conferido; o tipo do selo só aceita 36|72 e bloqueia 56/60/48.
7. G-12: a margem de 0,10 não é invariante à prevalência de zeros; com 95% de zeros o teto de Spearman cai para 0,42.
8. G-13: retificação aceita; a ressalva restante é que os scores usam ruído i.i.d. dentro do polígono; se os erros forem espacialmente correlacionados, o poder real pode ser menor.
9. G-08: kappa continua com duas regras — código 0,61 + IC inferior; documentos 0,60 pontual.
10. Lint/CI: os 2 warnings continuam; o workflow com --max-warnings 0 continua vermelho.
11. Lastro: as travas melhoraram, mas D02, D22 e Cochran seguem em dívida.

---

## 6. Coerência científica

O 12 x 6 é, do ponto de vista científico, a melhor alternativa para uma tese cujo objetivo primário é o desempenho global do modelo: mantém 72 polígonos, 361,4 ha, 36 clusters held-out, 3+3 por estrato e 98,6% de preenchimento sob 25% de recusa. Perde o contraste de K em S1 e S2, mas o 18 x 4 também não estima esse contraste por estrato, porque só tem 2 held-out por estrato.

O problema é de capacidade, não de mérito: o algoritmo é 18 x 4 e o tipo do selo é 36|72. O 12 x 6 só existe no material de decisão. Se G-01 escolhê-lo, a implementação precisa ser generalizada antes do selo.

O D25 ainda não é o avaliador que diz ser. O S1-1 corrigiu a semântica de vazio; isso é importante. Mas a exigência de preenchimento é o que separa “matriz incompleta” de “matriz probatória”. Sem A-06, o D25 avisa e segue; com A-06, ele falha.

A sequência continua: lastro (Cochran/P02) → G-08 → G-01 → G-12 → G-13 → G-15 → piloto separado → D16/D26/D25. A branch avançou em G-01 (12 x 6) e G-13 (retificação), mas não fechou G-01, G-12, G-08 nem G-15. O piloto separado continua ausente.

---

## 7. Prioridades

### P0 — antes de qualquer resultado probatório

1. Generalizar o sorteio para 12 x 6 (estratos, polígonos por estrato, 3+3, pi_i e w_i) e ajustar o tipo do selo (S1-A).
2. Passar selo/D26 em ExportModal e PainelCampanha; teste de integração do ZIP real (S1-B).
3. Implementar A-06: D25 fail-closed (S1-C).
4. Implementar D11.2 (S1-D).
5. Exportar/avaliar Modelo P ou retirar a alegação de predição (S1-E).
6. Coerência classe↔fração (S1-F).

### P1 — antes da campanha

7. P03; 8. D20; 9. top-up/âncora; 10. geometria; 11. config D25; 12. decidir G-01/G-12/G-13/G-08/G-15; 13. CI verde.

### P2 — antes da defesa

14. Lastro D02/D22/Cochran; 15. textos e Ficha; documentação de “hold-out por polígono, não espacial”.

---

## 8. O que não pude verificar

- Os 797 testes JS e os 55 testes D25: a suíte JS não inicia neste ambiente por spawn EPERM; os números são os relatados pela branch.
- Nenhum dado real, selo D16 ou CSV D26; não há como medir acurácia, prevalência ou superioridade.
- Nenhuma execução GEE/Planet/Embrapa.
- Nenhuma decisão de gate assinada; G-01, G-08, G-12, G-13 e G-15 seguem abertas.

---

## 9. Conclusão

A branch melhorou o programa de forma concreta: o D25 não trata mais vazio como false, o selo/D26 existe na biblioteca, o 12 x 6 entrou no material de decisão e a simulação de poder foi corrigida com honestidade. O executor respondeu aos achados.

Mas a resposta ainda não chegou ao ponto de uso: o 12 x 6 não é sorteável, o selo/D26 não chega ao pacote e à campanha, o D25 avisa mas não exige, D11.2 continua em 6, o Modelo P não é exportado e classe/fração ainda se contradizem. O projeto está mais perto de ser executável do que estava, mas ainda não é.

O próximo passo é menos código novo e mais fechamento de ponta: generalizar o sorteio, ligar o selo/D26 à UI, implementar A-06, decidir G-01/G-12/G-13/G-08 e fazer um piloto separado. Sem isso, o 12 x 6 continua uma boa ideia no papel — e o papel não faz voo.

---

## Anexo A — Evidências

- Typecheck: npm run typecheck -> exit 0.
- Lint: npm run lint -- --max-warnings 0 -> exit 1; 2 warnings (MapViewer.tsx:526, PointPopup.tsx:69).
- Testes JS: npm test -> falha no carregamento do config (spawn EPERM); não é falha de asserção.
- D25 com chaves vazias após a correção: _so_incluidas -> 6 de 6, com aviso; _checar_pixels_disjuntos -> passou, com aviso.
- Git: 3a9828e; 3 arquivos modificados e 3 novos não rastreados em docs; sem commit/push desta auditoria.

## Anexo B — Arquivos-chave

- Sorteio: src/lib/gee/sorteioPoligonos.ts; src/lib/gee/sorteioPoligonosTipos.ts; scripts/cenarios_g01.py.
- Exportação: src/lib/export/planilha.ts; src/lib/export/pacoteReprodutibilidade.ts; src/components/export/ExportModal.tsx; src/components/campanha/PainelCampanha.tsx; src/components/matriz/PainelMatrizTreino.tsx.
- D25: scripts/d25/avaliacao_d25_referencia.py; scripts/d25/config_pre_registro_PROPOSTA.json.
- D11: src/lib/gee/copernicusGeeClient.ts.
- Alvo: src/components/inspetor/InspetorPonto.tsx; src/lib/rotulos/rotuloHumano.ts.
- Gates: docs/planejamento/decisao/G-01.md, G-08.md, G-12.md, G-13.md, G-15.md.
- Relatórios: docs/auditorias/RELATORIO_CHAVES_VAZIAS_2026-11-03.md; RELATORIO_CENARIO_12X6_2026-11-03.md; RELATORIO_RETIFICACOES_2026-11-03.md.

---

**Fim do relatório.** Nenhum código, decisão ou parâmetro foi alterado por esta auditoria.
