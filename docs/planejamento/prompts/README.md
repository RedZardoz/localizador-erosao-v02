# Índice dos prompts do executor

Este diretório guarda os prompts escritos pelo planejador e executados pelo agente executor na
máquina do pesquisador. As **letras** (A, B, C…) são a convenção de referência usada nas conversas
de planejamento; os nomes de arquivo trazem assunto e data, não a letra. Esta tabela faz a ponte.

**Situação** é `executado` ou `pendente`. **Commits** são os da execução, não os da escrita do
prompt. **Evidência** é o documento da Regra 8 produzido pela rodada.

---

## Sequência de 09 a 11 de novembro de 2026

| Letra | Arquivo | Assunto | Situação | Commits | Evidência |
|---|---|---|---|---|---|
| **A** | `PROMPT_EXECUTOR_LASTRO_E_MASCARA_GEOS3_2026-11-09.md` | Conferência de lastro no primário de Demattê 2018, Rikimaru 2002 e Safanelli 2021 | executado | `a1b89eb`, `a5528a0` | `2026-11-09_lastro_d02_d10_e_mascara_geos3.md` |
| **B** | `PROMPT_EXECUTOR_ESTADO_VERIFICAR_2026-11-09.md` | Liga o modo somente-leitura do painel de estado à Regra 3 | executado | `1289ec4` | — |
| **C** | `PROMPT_EXECUTOR_MASCARA_GEOS3_2018_2026-11-09.md` | Adota a máscara de solo exposto de Demattê et al. (2018) em Ê | executado | `90959b7` | `2026-11-09b_adocao_mascara_geos3_2018.md` |
| **D** | `PROMPT_EXECUTOR_RETOMADA_INGESTAO_2026-11-09.md` | Retomada da ingestão; corrige a definição da métrica | executado com recusa fechada por falta de credencial | `bca0e50` | `2026-11-09d_calibracao_30_pontos_solo_nu.md` |
| **E′** | `PROMPT_EXECUTOR_UNIVERSO_CANDIDATOS_2026-11-10.md` | Persiste o universo de candidatos e prova o determinismo do funil | executado | `76db730` | `2026-11-10_universo_candidatos_e_reprodutibilidade.md` |
| **F** | `PROMPT_EXECUTOR_CALIBRACAO_E_CORRECOES_2026-11-10.md` | Quatro correções do E′ e calibração de 30 pontos de Ê | executado em duas partes | `75ceffa`, `df1df04`, `8d6bd48` | `2026-11-10f_calibracao_e_estabilidade_fontes.md` |
| **G** | `PROMPT_EXECUTOR_INGESTAO_680_2026-11-10.md` | Ingestão dos 677 candidatos e caracterização da distribuição de Ê | executado | `af6cf47` | `2026-11-10g_ingestao_680_e_distribuicao_e.md` |
| **H** | `PROMPT_EXECUTOR_GUARDA_D11_E_DESENHO_2026-11-10.md` | Reativa a guarda de D11.2 em três camadas; regra de estrato deficiente | executado | `da2abf9` | `2026-11-10h_guarda_d11_e_desenho_18x4.md` |
| **I** | `PROMPT_EXECUTOR_INVARIANTE_SELO_2026-11-10.md` | Oito invariantes do selo, com teste de adulteração por invariante | executado | `bb949cf` | `2026-11-10i_invariante_selo.md` |
| **J** | `PROMPT_EXECUTOR_SORTEIO_D16_2026-11-10.md` | Execução do sorteio de D16 sob semente pré-registrada | executado | `e67fc90`, `f475eed`, `b368b50` | `2026-11-10j_sorteio_d16_executado.md` |
| **K** | `PROMPT_EXECUTOR_JUNCAO_E_NO_CLI_2026-11-10.md` | Junta Ê no CLI do sorteio; remove fallback silencioso | executado — **rodou antes do J** | `74b138e` | `2026-11-10k_juncao_e_no_cli.md` |
| **L** | `PROMPT_EXECUTOR_SELO_PUBLICO_2026-11-11.md` | Selo público redigido, que preserva o cegamento | executado | `0272204`, `0133f4c` | `2026-11-11l_selo_publico_d16.md` |
| **M** | `PROMPT_EXECUTOR_INTERFACE_2026-11-11.md` | Alinha a interface ao desenho realizado; trava de paridade G08/G09 | executado | `ecaea6c`, `8f4a4b1` | `2026-11-11m_interface_alinhada.md` |
| **N** | `PROMPT_EXECUTOR_TOUR_2026-11-11.md` | Atualiza o tour metodológico e acrescenta travas de conteúdo | executado | `da2102a`, `dd6ab81` | `2026-11-11n_tour_atualizado.md` |
| **O** | `PROMPT_EXECUTOR_D02_D20_COERENCIA_2026-11-11.md` | Coerência de D02 e D20 — achado S1-8 da auditoria DeepSeek | executado | `5298f4e`, `7325853` | — |
| **P** | `PROMPT_EXECUTOR_CASCA_FLUXO_2026-11-11.md` | Casca de fluxo operacional sobre os painéis existentes | executado | `ce8e782`, `b5885b9`, `d7284c9`, `cadc359` | `2026-11-11p_casca_fluxo.md` |
| **Q** | `PROMPT_EXECUTOR_CEGAMENTO_DISTRIBUICAO_2026-11-11.md` | Cegamento por distribuição: pacotes por papel, diário e travas | executado | `6c1484c`, `b56bac0` | `2026-11-11q_cegamento_distribuicao.md` |
| **R** | `PROMPT_EXECUTOR_MODELO_P_2026-11-11.md` | Retira a alegação de predição prospectiva (Modelo P, achado S1-6) | **escrito, não executado** | `3673379` | — |
| **S** | `PROMPT_EXECUTOR_APRESENTACAO_2026-11-11.md` | Apresentação (PPTX) e documento (DOCX) didáticos | executado | `35bc056`, `a5277df` | `2026-11-11s/` |
| **T** | `PROMPT_EXECUTOR_MOCKUP_2026-11-11.md` | Mockup distribuível para navegador, não operacional | **em execução** | `7b3ad9a` | — |
| **U** | `PROMPT_EXECUTOR_TEXTO_FOTOINTERPRETACAO_2026-11-11.md` | Corrige o texto sobre fotointerpretação humana; fecha quem delineia | **escrito, não executado** | `702ff2c`, `b776a00` | — |
| **V** | `PROMPT_EXECUTOR_INGESTAO_DELINEACAO_2026-11-11.md` | Instrumenta a ingestão da delineação de D26: grade nativa, recusa de P11, importador | **escrito, não executado** | — | — |

**Dezoito dos vinte e dois prompts foram executados** (A–Q e S). **R**, **T** e **U** estão
escritos e aguardando execução — **T** em execução em 11/11 — e **V** acaba de ser escrito.
As travas introduzidas por M, N, O, P e Q foram
verificadas por **teste de mutação** conduzido pelo planejador em clone limpo — quebra-se a
propriedade de propósito e confere-se que a trava acusa:

| Trava | Mutação aplicada | Resultado |
|---|---|---|
| Cegamento de perfis (Q) | `estrato_id` acrescentado a `voo-cego` | falhou em **dois** pontos: fixação exata de colunas e barreira de proibidos |
| Fórmula única do Fator C (O) | D20 promovida de volta a `decidida` | falhou com `expected 'decidida' to be 'proposta'` |
| Seletores do tour (P) | — | as quatro âncoras antes ausentes passaram a resolver |

Trava que não foi testada por mutação é trava que ninguém sabe se funciona. Três já passaram neste
projeto sem nunca disparar: a de D11.2, a de `toContain("npm run estado")` e a de conteúdo do tour.

---

## Prompts que foram descartados

| Letra | Motivo |
|---|---|
| **E** | Substituído pelo **E′**. Tratava o conserto da guarda de D11.2 como bloqueante da ingestão; verificou-se que `MedicaoSoloNuLote.nObservacoes` é persistido por ponto, de modo que medir antes do conserto não perde informação. A guarda foi para o **H**. |

---

## Convenções adotadas nesta sequência

Os prompts a partir do **C** carregam um **protocolo anti-fabricação**, criado depois de um
relatório conter citações bibliográficas e saídas de `git grep` inventadas, enquanto os arquivos
escritos em disco estavam corretos. O protocolo tem três regras:

1. **Saída de comando não se transcreve, se grava.** Todo comando cuja saída o relatório mencionar
   é redirecionado para arquivo em `docs/verificacoes/execucao/<data>/` e commitado; o relatório
   cita o caminho.
2. **Citação bibliográfica não se escreve de memória.** Vem da folha de rosto na extração arquivada
   ou do resolvedor DOI. Onde nenhum dos dois for possível, escreve-se `CITAÇÃO NÃO CONFERIDA`.
3. **Tarefa não concluída é declarada como não concluída.**

A partir do **E′**, a mensagem de commit passou a ser **escrita depois do fato**. O **D** trazia
mensagem pronta que pressupunha o sucesso da rodada; a rodada recusou corretamente por falta de
credencial, e o commit `bca0e50` ficou afirmando uma calibração que não ocorreu.

---

## Como ler uma rodada

Cada rodada deixa três rastros, e eles se conferem entre si:

- o **prompt**, aqui, dizendo o que foi pedido;
- a **evidência** em `docs/verificacoes/`, dizendo o que foi feito e o que não foi;
- as **saídas de execução** em `docs/verificacoes/execucao/<data>/`, cruas, dizendo o que os
  comandos de fato devolveram.

Divergência entre os três é informação, não ruído. Foi assim que se descobriu que o relatório de
uma rodada afirmava conclusão enquanto o trabalho não havia sido empurrado para o repositório.
