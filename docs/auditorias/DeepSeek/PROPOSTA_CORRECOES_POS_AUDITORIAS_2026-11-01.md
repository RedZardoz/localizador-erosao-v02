# Proposta de Correções após as Auditorias — SAREL v2

**Data:** 1 de novembro de 2026
**Base:** [Auditoria de funcionalidades, coerência e lastro](../auditorias/AUDITORIA_FUNCIONALIDADES_COERENCIA_E_LASTRO_2026-10-31.md) e [Auditoria científica do desenho, validação e alvo](../auditorias/AUDITORIA_CIENTIFICA_DESENHO_VALIDACAO_ALVO_2026-11-01.md).
**Natureza:** proposta técnica para decisão do pesquisador. Não é emenda, não é commit e não altera nenhum arquivo de código ou decisão.

> **Regra de ouro desta proposta:** separar o que é **implementação de decisão já tomada** do que exige **nova decisão metodológica**. A primeira pode ser executada por engenharia; a segunda não pode ser resolvida por código, porque o código apenas tornaria a escolha invisível.

---

## 0. Cinco princípios que orientam as correções

1. **Falhar é melhor que fingir.** Uma guarda que se desliga quando falta a coluna é pior que a ausência de guarda: ela produz confiança falsa. Toda verificação crítica deve recusar a execução, não ignorar o insumo.
2. **Default é valor.** Um campo não preenchido com 0,00 não é “sem dado”: é uma observação de zero. Onde zero é um valor científico válido (fração erodida), o default não pode existir.
3. **Cada afirmação tem um desenho.** “Área da BP3”, “previsão”, “validação espacial” e “acurácia” exigem desenhos distintos. Se o desenho não identifica a afirmação, a correção é reduzir a afirmação, não maquiar o número.
4. **Medir o alvo antes de ajustar o modelo.** A incerteza do rótulo é o maior limitante; nenhum hiperparâmetro compensa um alvo mal medido. Confiabilidade do alvo vem antes de tunagem.
5. **Não lavar fonte não conferida.** Implementar uma tabela provisória de origem em IA (D22) transforma um débito declarado em número de sistema. Primeiro se verifica a fonte; depois se implementa — ou se declara o estado não operacional.

---

## 1. Sumário

| Classe | O que é | Pode começar? | Itens |
|---|---|---|---|
| **A** | Implementação de decisão vigente ou correção de bug/coerência | **Sim**, sem nova decisão | A-01 a A-11 |
| **B** | Exige decisão do pesquisador (metodologia, valor, desenho) | **Não** antes da decisão | B-01 a B-15 |
| **C** | Governança para impedir reincidência | Sim, em paralelo | C-01 a C-07 |

**Ordem recomendada:** B-01 a B-04 primeiro (são bloqueantes); A-01 a A-06 em paralelo; B-05 a B-12 antes da campanha; C-01 a C-03 desde o primeiro commit.

---

## 2. Classe A — correções que implementam decisão vigente

### A-01 — D11.2: alinhar o piso de Ê e fazer a guarda de D12 valer

**O que corrigir.**
- Trocar o piso escalar de 6 por uma avaliação por estimando: Ê com **n ≥ 12** e **SE ≤ 0,144** para D12; fallback 6–11 apenas em janela curta, marcado e **inelegível** para tercis.
- Fazer a rota transportar `provenienciaE` com `qualidade.nObservacoes`, `regime` e `elegivelD12`.
- Tornar `podeEntrarEstratificacaoD12` fail-closed para `medido` sem qualidade.
- Testes: 6, 11 e 12 observações; 6 não entra; 11 de fallback não entra; 12 com qualidade entra.

**Argumento.** D11.2 foi decidida em 31/10/2026 e o código ainda usa o piso antigo de 6. Não é uma escolha de engenharia: é uma decisão já tomada que o código não cumpre. A guarda de D12 existe, mas nunca executa porque a rota não envia a proveniência; uma guarda que não recebe o dado que a aciona é decoração. O custo de corrigir é baixo; o custo de não corrigir é refazer a estratificação depois de qualquer resultado, com perda de credibilidade do pré-registro.

### A-02 — P03: implementar os três critérios decididos

**O que corrigir.**
- Substituir 15/25 m por: teto de 30 m; permanência no mesmo estrato (S, E, K); GNSS ≤ 5 m aceito, 5–10 m aceito com marca, > 10 m rejeitado.
- Extrair as features na coordenada observada, não na planejada.
- Testes: 29 m dentro, 31 m fora; mudança de estrato invalida; GNSS 8 m marca; GNSS 12 m rejeita.

**Argumento.** P03 foi emendada para três critérios independentes, e o código e a Ficha ficaram no limiar antigo. O critério de estrato é a parte cientificamente mais forte: ele verifica se o ponto observado ainda pertence à população sorteada, o que nenhum raio métrico garante. Manter 15/25 m é aceitar um critério que a própria decisão já declarou incoerente.

### A-03 — P07: remover a semente fixa 42

**O que corrigir.**
- Exigir semente explícita ou gerar uma semente criptográfica por execução; registrar a semente no relatório, no selo D16 e na proveniência dos pontos.
- Reproduzir uma execução apenas quando a mesma semente for fornecida e registrada.
- Teste: duas execuções com sementes diferentes produzem sorteios diferentes; a mesma semente reproduz o mesmo sorteio e o registro.

**Argumento.** P07 decidiu “dinâmica-registrada”, não “constante 42”. A reprodutibilidade científica exige que a semente seja **registrada**, não que seja **fixa**: uma constante global torna todas as execuções idênticas e impede que o sorteio seja o ato probabilístico que D23 descreve. O registro é o que permite replicar; a constante apenas esconde a ausência de registro.

### A-04 — Fator C: atribuir D20 quando o BSI entra

**O que corrigir.**
- `obterFatorCComProveniencia` deve devolver `decisoes: ["D20"]` quando o BSI é válido e `["D01"]` quando não é; o `modelo` deve dizer “híbrido SPD (D20)” ou “Durigon puro (D01)”.
- Corrigir comentários e o rótulo “RUSLE (Durigon C)” da UI quando o valor for híbrido.
- Teste: BSI presente cita D20; BSI ausente cita D01.

**Argumento.** A fórmula híbrida não é a de Durigon; é D20. O selo atual diz D01, o que torna a proveniência falsa e impede um auditor de saber qual fórmula gerou o número. Não é uma mudança de fórmula; é a correção da etiqueta da fórmula que já está no código.

### A-05 — Levar as chaves do desenho para a matriz

**O que corrigir.** Adicionar ao perfil `matriz-treino`/`matriz-heldout`, e ao tipo do ponto quando aplicável:
- `Estrato_ID`, `pi_i`, `w_i`, `Incluida`, `Cobertura_Celula`, `Pixel_ID` (opaco), `Modelo`, `Data_Referencia`, `Fim_Janela`.
- Validar o esquema com Zod; versão do esquema no cabeçalho.
- Teste: a matriz exportada contém as colunas; o D25 falha se faltarem.

**Argumento.** Sem `Estrato_ID` não há avaliação estratificada; sem `pi_i` não há inferência de D23; sem `Incluida` o filtro P11 é perdido; sem `Pixel_ID` a checagem de pixel compartilhado é vácuo; sem `Modelo` e `Data_Referencia` não se distingue D de P. São metadados baratos; a ausência deles é que é caríssima, porque invalida guardas que parecem existir.

### A-06 — D25 fail-closed

**O que corrigir.**
- Em modo `--probatorio`: exigir 36 polígonos held-out, 18 estratos representados, `Estrato_ID`, `Incluida`, `Pixel_ID`, `monotonicidade` não vazia, config congelado com hash e `RUSLE_A` disponível. Se faltar, erro tipado, não resultado.
- Se `RUSLE_A` indisponível, o desfecho deve ser `NAO_AVALIAVEL` **antes** de ajustar, e o relatório deve dizer que a comparação não foi feita.
- Testes: matriz sem `Incluida` falha; 35 polígonos falha; monotonicidade vazia falha; hash divergente falha.

**Argumento.** O D25 é o melhor artefato do projeto, mas hoje aceita matrizes incompletas e um config não congelado. Uma guarda que retorna sem erro quando a coluna falta é pior que nenhuma: ela dá ao leitor a impressão de que a checagem foi feita. O modo probatório precisa ser o mais restritivo, não o mais permissivo.

### A-07 — Remover fabricações numéricas de baixo nível

**O que corrigir.**
- `calcularNdvi`/`calcularBsi`: retornar `null` (ou `indisponivel` com causa) quando o denominador for nulo; não retornar 0; não clampar para ±1; registrar `fora-do-dominio`.
- `amostragemSoloNuLote`: remover o clamp `[0,1]`; se a fração sair do domínio, é erro, não ajuste.
- `montagem`: remover `"BLOCO_INDEFINIDO"`; rejeitar ponto sem bloco no perfil de treino.
- JEV: remover confiança default 0,95 e as confianças fixas do fallback; o laudo é heurístico, não probabilístico.
- Testes: NDVI 0/0 retorna indisponível; BSI fora de [-1,1] retorna indisponível; ponto sem bloco é rejeitado.

**Argumento.** Regra 1 e Regra 2 são explícitas: valor ausente permanece indisponível; valor fora do domínio não é cortado. Um NDVI 0 por denominador nulo é indistinguível de um NDVI 0 real; um bloco “INDEFINIDO” entra na validação como grupo; uma confiança 0,95 sem calibração é um número inventado com aparência de probabilidade. O varredor atual não pega esses casos porque eles não usam `?? 0`.

### A-08 — JEV: retirar coordenadas do payload externo e marcar o laudo como heurístico

**O que corrigir.**
- Remover latitude/longitude e município do estado enviado à API; enviar apenas índices, classe de solo e declividade, se necessários.
- Exigir opt-in explícito; registrar a requisição de saída no diário local.
- Marcar o laudo como “auditoria heurística, não rótulo, não probabilidade”; remover confiança numérica.
- Teste: o payload não contém coordenadas; o laudo não é aceito como rótulo.

**Argumento.** O projeto trata coordenadas como dado sensível (Invariante 2, D16 cego, LGPD). Enviar coordenada a uma API externa contradiz essa postura. Além disso, um “grau de suscetibilidade” de LLM não é uma medida calibrada; apresentá-lo com confiança 0,95 é o tipo de número que a banca pergunta “de onde veio?”. O JEV pode continuar como apoio visual, sem sair do local e sem virar evidência.

### A-09 — CI verde e textos defasados

**O que corrigir.**
- Resolver os dois warnings de lint ou registrar uma exceção nomeada com prazo; um CI que nasce vermelho é ignorado.
- Atualizar D07/P05 (não há mais divergência de classes), D23 (36 vs 72), Ficha `7.2 (invariantes), Ficha P03 (15/25), README P=1.0, README bibliográfico “D01–D28”, Header “D01–D19”.
- Teste de paridade: o texto “N invariantes” e o número de invariantes do código; o texto “D01–DNN” e o registro.

**Argumento.** Um registro que declara “o código usa [30,40,60]” quando o código já usa [30,40] destrói a confiança no próprio registro: o leitor não sabe se a divergência existe ou se é texto velho. Texto defasado é dívida de auditoria; não é cosmético.

### A-10 — Correções operacionais

- Persistir pontos/rótulos (arquivo local versionado ou SQLite) com autosave; hoje um `F5` perde a campanha.
- Remover a promessa de Shapefile ou implementar o escritor; idem VIF.
- Remover a supressão do overlay de erro e o `preventDefault` global; manter o log interno, mas não esconder a falha.
- Remover o fallback de sessão GEE “último token” (`sessaoEfemera.ts:52-61`); exigir cookie de sessão.
- Corrigir a guarda antissintética para reconhecer o prefixo `DRYRUN-BP3-` do próprio dry-run, além de `DRY-CAND-`.

**Argumento.** São correções de confiabilidade operacional e de auditabilidade. Nenhuma altera metodologia; todas reduzem a chance de o pesquisador perder trabalho ou de um artefato sintético virar selo.

### A-11 — Geometria, realocação e âncora

**O que corrigir (sem decidir o desenho).**
- Verificar contenção do polígono no imóvel e no domínio antes do selo.
- Reaplicar o thinning após a realocação; registrar a distância mínima realizada.
- Implementar a âncora de D23 como seleção separada, com `pi_i` próprio, fora dos polígonos; registrar no selo.
- Se a âncora ainda não puder ser implementada, não usar a rota de candidatos como se fosse ela.

**Argumento.** D16 já exige encaixe e orientação; D23 já exige âncora com `pi_i`. O que falta é implementação, não decisão. O risco de não fazer é o selo aprovar polígono que cruza divisa e a âncora virar uma amostra de conveniência disfarçada de probabilística.

---

## 3. Classe B — decisões que precisam do pesquisador

> Estas não devem ser“corrigidas” por código antes da decisão. Abaixo, opções e argumentos; a escolha é do pesquisador.

### B-01 — O fatorial inviável (D-01)

**Opções.**
1. **Colapsar Ê no quadrante deficiente** (Cochran 1977, `5A.12`): `E_1_*,2` e `E_2_2-3,2`; 14–16 estratos; 56–64 polígonos; mantém 2+2 e reserva; perde o contraste de Ê no quadrante colapsado; exige emenda a D12.
2. **Declarar S1×K2 fora do domínio de D07**: 15–17 estratos; 60–68 polígonos; epistemicamente honesto; remove do mapa uma combinação real (relevo suave + solo alta erodibilidade), que pode ser justamente a de interesse.
3. **Desenho condicional/aninhado**: K só onde há variabilidade; 15 estratos; 60 polígonos; muda o fatorial e perde o efeito principal de K em S1.
4. **Amostragem exaustiva do estrato raro (π=1)**: não resolve a célula vazia; quebra o 2+2; 65–67 polígonos.

**Argumento.** A opção 1 é a única que (a) mantém uma amostra probabilística em todos os estratos, (b) preserva 2 treino + 2 held-out, (c) usa um estimador de variância conhecido (Cochran, viés positivo) e (d) resolve a célula vazia absorvendo-a em um macro-estrato com 9 candidatos. A opção 2 é mais simples, mas exclui um domínio real; a 3 muda mais o desenho; a 4 não resolve o zero. **Recomendação de auditoria:** opção 1 combinada com declaração explícita de que o contraste de Ê no quadrante colapsado não é estimável; emenda a D12/D16 antes do sorteio. Não é uma correção de código: é uma decisão de desenho.

### B-02 — O estimando: área ou polígono (D-02)

**Opções.**
1. **Limitar a afirmação**: o produto é “desempenho do modelo na população de polígonos elegíveis”; sem estimativa de área da BP3.
2. **Novo desenho de área**: amostra de células/polígonos com probabilidade proporcional à área, ou pesos de área; responde E2, mas é outro desenho e outro esforço.
3. **Dois produtos**: modelo (E1) + estimativa de área (E2) com desenhos separados; o mais completo, mas o mais caro.

**Argumento.** O `pi_i = 4/N_h` atual é de imóvel, não de hectare; usá-lo para área é um erro de unidade, não de precisão. A opção 1 é o mínimo honesto e não impede a dissertação: o modelo pode ser excelente sem estimar área. A opção 2 só vale se a área for uma pergunta central. A opção 3 é a mais defensável se a banca exigir as duas. **Recomendação:** opção 1 para o produto atual; registrar a área como trabalho futuro ou desenho separado; nunca apresentar `4/N_h` como peso de área.

### B-03 — Validação espacial (V-02)

**Opções.**
1. **Manter o hold-out aleatório por polígono** e renomear: “hold-out por polígono, não espacial”; declarar a limitação; não usar “spatial CV”.
2. **Hold-out por blocos espaciais**: agrupar polígonos por blocos (variograma/buffer), treinar em alguns blocos e testar em outros; mede generalização espacial, mas com 36 held-out pode deixar estratos sem cobertura.
3. **Sensibilidade por buffer**: manter o principal e repetir com treino/held-out separados por ≥ alcance; reportar como sensibilidade pré-registrada.

**Argumento.** A partição atual mede generalização para novos polígonos na mesma paisagem, não para novas regiões. Se o texto diz “spatial CV”, a afirmação é falsa; se diz “hold-out por polígono”, é honesta. A opção 2 é a padrão, mas o desenho de 2+2 por estrato pode inviabilizar blocos com cobertura; a 3 é o compromisso. **Recomendação:** opção 1 como rótulo obrigatório; opção 3 como sensibilidade; opção 2 se o pesquisador aceitar reduzir a cobertura por estrato.

### B-04 — O Modelo P está no escopo? (V-01)

**Opções.**
1. **D only**: declarar que a evidência é de detecção contemporânea; emendar D04 e retirar “predição” do texto.
2. **D + P**: exportar duas matrizes, avaliar P com a guarda de 24 meses e um D25 separado; mais trabalho, mas cumpre D04.
3. **P only**: se a pergunta é prognóstico, o D vira diagnóstico; exige mudar o alvo e a narrativa.

**Argumento.** D04 diz “ambos os modelos integrados”, mas o app só exporta D. A opção 1 é honesta e suficiente para uma dissertação de detecção/localização; a 2 é a única que sustenta “predição” no sentido prospectivo; a 3 é uma tese diferente. **Recomendação:** opção 2 se “predição” for a contribuição central; caso contrário, 1 com emenda. Não apresentar D como P.

### B-05 — Estado vs evento (T-03)

**Opções.**
1. **Alvo de estado**: “predição espacial da presença de erosão”; ajustar o vocabulário; D19 fica secundária.
2. **Alvo de incidente**: duas datas, nova erosão entre t1 e t2; exige novo rótulo e novo desenho; D19 deixa de ser secundária.
3. **Dois alvos**: estado (principal) + incidente (exploratório); reportar separadamente.

**Argumento.** O alvo atual é a cicatriz, não o evento. Chamar isso de “previsão de erosão futura” é uma extrapolação semântica que a banca cobra. A opção 1 é a mais barata e verdadeira; a 2 é outra pesquisa; a 3 é possível, mas não no mesmo D25. **Recomendação:** opção 1 para a dissertação atual; 2 como trabalho futuro.

### B-06 — Cobertura P11 (T-02)

**Opções.** 0,95 (proposta); 0,90; nenhum filtro, com `Cobertura_Celula` como covariável/peso.

**Argumento.** O script de referência já usa 0,95 como se decidido; P11 ainda é proposta. O pior estado é usar 0,95 sem decidir e sem registrar. Se a cobertura for usada como filtro, a fração das células excluídas deve ser reportada; se for covariável, o modelo aprende o artefato de borda. **Recomendação:** decidir P11 antes da geração do alvo; 0,95 é defensável; incluir sensibilidade 0,90 e 0,95.

### B-07 — Tweedie, beta e calibração (T-04)

**Opções.** Manter Tweedie e declarar “ordenador”; beta/zero-inflada para fração; Tweedie com clip e calibração.

**Argumento.** Para Spearman/AUC, Tweedie é adequado; para “fração predita”, não é limitado. Se a saída for ranking, declarar; se for probabilidade/fração, usar família limitada e calibrar. A escolha precisa ser feita **antes** de ver resultados; depois seria flexibilidade analítica.

### B-08 — Kappa: 0,60, 0,61 ou IC (F-09)

**Opções.** 0,60 pontual; 0,61 pontual; 0,61 com IC inferior; 0,60 com IC inferior.

**Argumento.** 0,61 é a fronteira “substancial” de Landis & Koch; 0,60 é a convenção do texto. O portão duplo (IC inferior ≥ 0,61) é muito mais exigente e, com n pequeno, quase sempre reprova; se for mantido, precisa de cálculo de potência e de um n mínimo. O pior estado é o atual: código 0,61 + IC, documentos 0,60. **Recomendação:** escolher uma regra e escrevê-la em D03/D16; se o portão duplo ficar, declarar o n necessário.

### B-09 — Não resposta (D-05)

**Opções.** Supor MCAR e reportar; pesos de resposta; análise de sensibilidade com cenários; substituição com `pi_i` atualizado.

**Argumento.** A recusa independente é uma simplificação declarada, mas com 25% e estratos de 4 candidatos a chance de preencher os titulares cai a 31,6%; se a recusa correlaciona com erosão, o viés é direcional. A opção mais barata é reportar a taxa e fazer sensibilidade; a mais defensável é pesos de resposta. **Recomendação:** protocolo pré-registrado de não resposta + sensibilidade; não tratar recusa como se fosse aleatória por decreto.

### B-10 — D22: implementar a tabela provisória? (F-05)

**Opções.** Implementar com `status: provisorio` e proveniência explícita; manter P=1,0 e declarar D22 não operacional; verificar Bertoni/Lombardi antes de implementar.

**Argumento.** A tabela veio de saída de IA, atribuída a Bertoni & Lombardi/Wischmeier, e não foi conferida no primário. Implementá-la agora transformaria um débito em número de sistema — exatamente o que a norma R-L4 quer evitar. Manter P=1,0 é conservador e declarado, mas superestima a perda em áreas terraceadas e pode favorecer o XGBoost na comparação. **Recomendação:** verificar a fonte primeiro; se não houver fonte, manter P=1,0 com a limitação escrita e D22 “não operacional”; não implementar uma tabela não conferida só para cumprir a decisão.

### B-11 — P10 e grade de Tweedie

**Opções.** Congelar a grade {1,2; 1,5; 1,8}; decidir um valor único; exigir a grade no config e falhar sem ela.

**Argumento.** P10 é proposta; o D25 usa uma grade padrão quando o config não a declara. Um parâmetro não decidido não deve ter default em pipeline probatório. **Recomendação:** exigir a grade no config congelado; se P10 não for decidido, o modo probatório falha.

### B-12 — Poder e margem (V-05)

**Opções.** Manter 0,10 e aceitar `INCONCLUSIVA`; aumentar o held-out (72 fixos); mudar a margem (mais fraca); usar um desenho pareado mais potente.

**Argumento.** Com 36 clusters, 0,10 está próximo do ruído; o resultado mais provável é inconclusivo. Isso não é motivo para afrouxar o critério depois de ver os dados; é motivo para declarar a limitação de potência e aceitar o desfecho. Se a margem for alterada, tem de ser **antes** de qualquer dado. **Recomendação:** manter 0,10; reportar poder; aceitar INCONCLUSIVA como resultado; não reclassificar.

### B-13 — Sítios contínuos (V-06)

**Opções.** Rotular como aferição local; corrigir IC por block bootstrap; não reportar acurácia como generalização.

**Argumento.** Os sítios não são amostra probabilística; o IC ingênuo assume pixels independentes. A correção é de rótulo e de método de IC, não de desenho. **Recomendação:** rótulo “aferição local” e IC por bloco; não usar para superioridade.

### B-14 — Rikimaru e os limiares de D02

**Opções.** Manter a citação para o índice e declarar os cortes como convenção; buscar fonte que sustente os cortes; recalibrar os cortes com dados.

**Argumento.** Rikimaru é um trabalho de densidade de dossel florestal; não prescreve 0,10/0,40/0,65 para erosão. Atribuir-lhe os cortes é uma citação que não sustenta a afirmação — mais grave que ausência. **Recomendação:** citar Rikimaru apenas para o BSI e declarar os cortes como convenção do projeto, com análise de sensibilidade; ou substituir por fonte que os sustente.

### B-15 — D13 e o fator 9,81

**Opções.** Arquivar a fonte do fator; declarar o fator como calibração empírica com incerteza; remover a marca morta e escrever a limitação no modelo.

**Argumento.** O R depende de 9,81 para reproduzir a escala; a origem física não está na fonte lida. A marca `pendenteVerificacao` existe no código, mas não no tipo, não é renderizada e não chega ao CSV. **Recomendação:** propagar a marca ou declarar a calibração no `modelo`; não deixar a incerteza invisível.

---

## 4. Classe C — governança para não repetir

### C-01 — Campo `estadoImplementacao` nas decisões

Adicionar a cada decisão/parâmetro: `implementado | parcial | nao-implementado | divergente`, com commit e data. Um teste verifica que toda “divergência declarada” ainda existe. **Argumento:** o registro atual diz que o código usa [30,40,60] quando ele já usa [30,40]; e diz que P03 é 30 m quando o código usa 15/25. Sem estado de implementação, o registro não é confiável.

### C-02 — Esquema da matriz versionado

Definir a matriz com Zod/JSON Schema, versão e campos obrigatórios; a exportação falha se faltar uma chave do desenho. **Argumento:** as guardas do D25 só funcionam se as colunas existirem; o esquema impede que uma refatoração as remova em silêncio.

### C-03 — CI com testes de decisão

Testes críticos no CI: D11.2 (6/11/12), P03 (30 m/estrato/GNSS), P07 (semente registrada), D20 (atribuição), D22 (estado), matriz (chaves), D25 (fail-closed). **Argumento:** o CI atual roda typecheck/lint/testes, mas não verifica a correspondência decisão×código; um teste específico transforma a decisão em restrição executável.

### C-04 — Pré-registro operacional

Congelar o config D25 com hash, autor e data; nenhuma alteração após o primeiro dado; registrar a versão no relatório. **Argumento:** sem hash, o “pré-registro” é um arquivo editável; a força de D25 depende de o config não mudar depois.

### C-05 — Lastro bibliográfico verificável

Reconstruir o inventário com caminho existente, DOI e status de conferência; o teste deve verificar arquivo/DOI, não apenas o ID da decisão. Corrigir Rikimaru (veículo e limiares), arquivar Olofsson/King & Zeng/Cochran ou marcar dívida, e adicionar “o que a fonte NÃO sustenta” em cada verificação. **Argumento:** as duas travas atuais são vácuas; a matriz tem 7 de 41 caminhos existentes. Uma citação que não sustenta o número é pior que a ausência.

### C-06 — Rasto de auditoria das correções

Cada correção referencia o achado (A-01, B-02...) no commit e no teste; o relatório de mudanças lista o que foi feito e o que ficou pendente. **Argumento:** o projeto já tem histórico de correções que reabrem; o vínculo achado→commit→teste evita a reincidência.

### C-07 — Dicionário de dados e unidades

Documentar cada coluna da matriz, unidade, suporte, origem e decisão; incluir `pi_i`, `w_i`, `Estrato_ID`, `Incluida`, `Pixel_ID`. **Argumento:** a confusão de unidade (imóvel vs área) e a perda de colunas vêm da ausência de dicionário; o dicionário é barato e serve à banca.

---

## 5. Sequência recomendada

| Fase | O que fazer | Por quê |
|---|---|---|
| **0 — decisões bloqueantes** | B-01 (fatorial), B-02 (estimando), B-03 (validação), B-04 (P) | Sem elas, qualquer código novo pode ser refeito. |
| **1 — correções seguras** | A-01 a A-07, A-09, C-01 a C-03 | Implementam decisões vigentes e fecham riscos de fabricação/guardas. |
| **2 — alvo e campanha** | B-05, B-06, B-08, B-09, B-10; A-11 | O alvo e a não resposta precisam estar definidos antes de voar/coletar. |
| **3 — validação e modelo** | B-07, B-11, B-12, B-13; A-05/A-06 | Fecham D25 e a interpretação. |
| **4 — lastro e documentação** | B-14, B-15, A-09, C-05 | Deixam a dissertação defensável. |

**Dependências duras:** A-05/A-06 dependem de B-02/B-03 (quais chaves e qual validação); B-04 depende de B-02 e B-05; B-06 depende de B-05; A-11 depende de B-01/B-02.

---

## 6. Critérios de aceite (exemplos)

- **D11:** 6 observações não entram nos tercis; 11 de fallback não entram; 12 com `SE ≤ 0,144` entram; o teste falha se a rota não enviar proveniência.
- **P03:** 29 m aceito; 31 m rejeitado; mudança de estrato rejeitada; GNSS 8 m marcado; GNSS 12 m rejeitado.
- **Semente:** duas execuções com sementes diferentes divergem; a mesma semente reproduz; o selo contém a semente.
- **Matriz:** contém `Estrato_ID`, `pi_i`, `Incluida`, `Pixel_ID`, `Modelo`; o D25 falha se faltar.
- **Alvo:** não é possível salvar “erosao” com fração 0,00; o default é vazio; a fração importada tem origem e área.
- **D25:** 35 polígonos falha; sem `RUSLE_A` falha; sem monotonicidade falha; hash divergente falha.
- **Lastro:** toda obra citada tem caminho existente e status; Rikimaru não é citado pelos cortes.

---

## 7. O que não fazer

1. **Não preencher lacuna com 0, 1 ou “média”.** A Regra 1 existe por um motivo; um zero em NDVI ou em fração é um valor científico, não um marcador de ausência.
2. **Não chamar o hold-out atual de “spatial CV”.** Se não há bloco/buffer, é hold-out por polígono.
3. **Não usar `pi_i = 4/N_h` como peso de área.** A unidade é imóvel, não hectare.
4. **Não implementar a tabela de D22 antes de conferir a fonte.** Implementar uma tabela de IA transforma débito em número de sistema.
5. **Não afrouxar D25 depois de ver o resultado.** A margem de 0,10 é pré-registrada; se a potência é baixa, o resultado é `INCONCLUSIVA`, não um novo critério.
6. **Não adicionar preditor depois do congelamento.** D24 e D25 existem para impedir isso.
7. **Não “consertar” D11 baixando o piso para 6.** O piso 12 foi decidido; o código é que está atrasado.
8. **Não declarar área da BP3 com o desenho de polígonos.** A afirmação precisa de desenho de área ou de redução de escopo.

---

## 8. Rastreabilidade achado → correção

| Achado | Correção |
|---|---|
| F-01 / D-01 | A-01, C-01, C-03 |
| F-02 / V-04 | A-05, A-06, B-02, B-04 |
| F-03 / D-03 | A-03, A-11, B-02, B-09 |
| F-04 / P03 | A-02 |
| F-05 / D22 | B-10 |
| F-06 / D20 | A-04 |
| F-07 / T-01 | A-07, B-05, B-06 |
| F-08 / JEV | A-08 |
| F-09 / kappa | B-08 |
| F-10 / shapefile/VIF | A-10 |
| F-11 / persistência | A-10 |
| F-12 / invariante 6 | A-07, A-09 |
| F-13 / registro defasado | A-09, C-01 |
| F-14 / tercis | A-01, B-01 |
| F-15 / pisos | A-01, B-07 |
| F-16 / variograma | B-03 |
| F-17 / lastro | C-05, B-14, B-15 |
| F-18 / R 9,81 | B-15 |
| F-19 / CI | A-09 |
| F-20 / overlay/sessão/benchmark | A-10 |
| D-01 / V-02 | B-01, B-03 |
| T-02 / P11 | B-06, A-05 |
| V-01 / P | B-04 |
| V-05 / poder | B-12 |
| V-06 / sítios | B-13 |

---

**Fim da proposta.** Nenhum código, decisão ou parâmetro foi alterado. As decisões de classe B são do pesquisador; as de classe A podem ser executadas por engenharia, com os testes de aceite acima.
