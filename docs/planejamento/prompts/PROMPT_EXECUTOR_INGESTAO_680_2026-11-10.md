# PROMPT G — EXECUTOR SAREL — ingestão completa de Ê e caracterização da distribuição

**Contexto.** A calibração de 30 pontos (commit `8d6bd48`) mediu Ê de verdade pela primeira vez.
O piso de D11.2 não está em risco: `nObservacoes` ficou entre 237 e 1.003, zero pontos abaixo de 12.
Mas a distribuição revelou outra coisa: **8 dos 29 pontos medidos (27,6%) têm Ê exatamente zero**,
e 11 estão abaixo de 0,02. Com 29 pontos esse percentual tem intervalo de confiança largo
(aproximadamente 13% a 47%), e a decisão sobre como estratificar Ê precisa da distribuição real
dos 677.

**Esta rodada mede e caracteriza. Não decide nada.**

---

## 0. LEITURA OBRIGATÓRIA

1. `docs/DESENVOLVIMENTO.md` integralmente.
2. `docs/verificacoes/2026-11-10f_calibracao_e_estabilidade_fontes.md`.
3. `npm run estado:verificar`.

Informe o branch e permaneça nele. **Vale o PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: saída de
comando gravada em `docs/verificacoes/execucao/2026-11-10g/` e citada por caminho.
**Mensagem de commit escrita depois do fato.**

A credencial `SAREL_GEE_SERVICE_ACCOUNT_FILE` é necessária. Confirme antes e grave a confirmação.

**NÃO rode `scripts/remedir_candidatos_bp3_d16.ts`** — com credencial definida ele faria a
ingestão por um caminho que não é o desta rodada. Use o CLI dedicado.

---

## TAREFA 1 — teste de fumaça com um bloco, antes de comprometer a rodada inteira

A calibração rodou com `--tamanho-bloco 1`, de propósito, para medir latência por ponto: mediana
de 5,5 s, p95 de 11,8 s, e **um ponto estourou o timeout de 30 s**.

Em bloco, a expressão monta `features_pontos` com todos os pontos numa única `Image.reduceRegions`.
O custo não deve ser proporcional ao número de pontos, porque a filtragem e a composição temporal
são compartilhadas — mas **isso é hipótese, não medida**. Um bloco de 100 pode estourar o timeout.

Antes da rodada completa:

1. Rode **um** bloco de 25 pontos e cronometre.
2. Se o timeout de 30 s for insuficiente, **aumente-o** para o modo de bloco e diga no relatório
   qual valor usou e por quê. Não reduza o bloco sem antes tentar o timeout maior.
3. Com o tempo de um bloco de 25 medido, projete para 677 e **escolha o tamanho de bloco**
   (25, 50 ou 100), justificando com o número.

Grave a saída. Se o bloco de 25 falhar mesmo com timeout ampliado, **pare e relate** — rodar 677
sob um modo que falha é desperdício.

---

## TAREFA 2 — ingestão dos 677

Universo: a chave `candidatos` de `docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json`
— os **677 elegíveis com pedologia**, não os 680. Os 3 excedentes não têm K̂ válido e não podem
ser estratificados; medi-los seria medir o que não entra.

Use `--retomar`: os 29 pontos da calibração estão no cache sob o mesmo hash de definição
(`6a63a17c...`) e devem ser reaproveitados, não remedidos. Confirme no relatório quantos vieram do
cache e quantos foram medidos agora.

**Passe de recuperação.** A calibração teve 1 timeout em 30 (3,3%). Em 677 isso projeta ~23 falhas.
Depois da rodada principal, rode `--retomar` novamente para capturar as que falharam, até **3
tentativas no total**. Relate quantos pontos permanecem `indisponivel` ao fim e por qual causa.

**Invioláveis.** Falha é `indisponivel` com causa declarada, nunca `0`. `Ê = 0` é medida real e
legítima — não confunda os dois. O cache salva a cada bloco: se a rodada morrer no bloco 5, os
anteriores sobrevivem.

---

## TAREFA 3 — caracterizar a distribuição de Ê (o entregável desta rodada)

Crie `scripts/auditoria/caracterizar_distribuicao_e.mjs`, que lê o cache e emite, **sem decidir
nada**:

1. **Contagem**: medidos, indisponíveis por causa, total.
2. **Quantis**: mínimo, p10, t₁ (33%), mediana, t₂ (67%), p90, máximo.
3. **Massa em zero**: quantos pontos com `Ê == 0`, a fração, e o **intervalo de confiança de
   Wilson a 95%** dessa fração. É o número que decide se tercis são viáveis.
4. **Empates**: quantos valores distintos existem entre os 677, e qual o maior grupo de pontos
   com valor idêntico. Tercis não repartem empates.
5. **Precisão**: erro-padrão binomial por ponto (`sqrt(p(1-p)/n)`), com mediana e máximo, e a razão
   entre o SE típico e a largura do tercil central.
6. **Histograma** em texto, com faixas de 0,01, para leitura direta.
7. **O que `calcularLimiaresTercis` de fato retorna** nestes dados, e **quantos pontos caem em cada
   tercil** com esses limiares. Se os tercis saírem desbalanceados por causa dos empates em zero,
   **mostre o desbalanço em números** — é exatamente o que precisa ser visto.

Grave `FONTE_DOS_DADOS` no cabeçalho. O script **só lê**.

---

## TAREFA 4 — ocupação dos 18 estratos e das 9 células de K̂=2

Esta é a pergunta que `statusSorteio` carrega como BLOQUEADO desde 30/09.

Com Ŝ (já medido), Ê (agora medido) e K̂ (já medido), produza a tabulação cruzada **em modo de
leitura**:

- ocupação dos **18 estratos** tridimensionais (Ŝ × Ê × K̂);
- ocupação das **9 células de K̂=2**, com destaque para quantas têm **≥ 4 candidatos**, que é o
  mínimo de D16;
- a lista das células deficientes, se houver, com a contagem exata de cada uma.

**Não execute o sorteio.** A trava de `scripts/sortear_poligonos_d16.ts` permanece e **não deve ser
removida** — isso é tarefa do Prompt H, junto com o conserto da guarda de D11.2. Tabulação de
ocupação não é sorteio; se o caminho que você precisar usar esbarrar na trava, relate em vez de
contorná-la.

**Nota técnica:** a guarda de D11.2 continua inativa no caminho de produção. Nesta amostra isso é
inócuo, porque o mínimo de `nObservacoes` foi 237. Confirme que isso se mantém nos 677 — se algum
ponto vier com `n < 12`, **registre quantos e quais**, pois passariam pela guarda morta.

---

## TAREFA 5 — declarar a janela temporal real

O cache registra `adquiridoEm: "2016-01-01 a 2026-06-30"`, que é a janela **pedida** (D05). A
coleção `COPERNICUS/S2_SR_HARMONIZED` (L2A) não cobre o Brasil desde 2016 — a cobertura efetiva
começa depois.

Apure a **data da observação válida mais antiga efetivamente usada** e a mais recente, e declare-as
ao lado da janela pedida. Se divergirem, o rótulo de proveniência deve dizer as duas coisas:
janela solicitada e janela efetivamente coberta. É a mesma correção de rito que já fizemos no
`DEFINICAO_METRICA_SOLO_NU` e na data fixa do pipeline.

Se a informação não estiver disponível na resposta atual do GEE, diga isso em vez de estimar.

---

## TAREFA 6 — evidência e commit

`docs/verificacoes/2026-11-10g_ingestao_680_e_distribuicao_e.md`, contendo:

1. A escolha do tamanho de bloco e o número que a sustenta (Tarefa 1).
2. Totais da ingestão: medidos, do cache, indisponíveis por causa, tentativas de recuperação.
3. **A caracterização completa da Tarefa 3**, com a massa em zero e seu IC de Wilson em destaque.
4. A ocupação dos 18 estratos e das 9 células de K̂=2 (Tarefa 4), com as deficientes nomeadas.
5. A janela temporal real (Tarefa 5).
6. **As perguntas em aberto, formuladas para o pesquisador decidir** — não respondidas por você:
   - Ê deve ser estratificado por tercis empíricos, por cortes fixos, ou Ê₁ deve ser tratado como
     classe qualitativa "nunca exposto"?
   - a ocupação permite os 18 estratos com 4 polígonos em cada célula de K̂=2?
7. O que **não** foi feito: sorteio, conserto da guarda de D11.2, e qualquer alteração de limiar.

**Inviolável desta rodada:** não altere `nbr2Max` nem nenhum outro limiar de D10. Se a distribuição
sugerir que 0,075 é restritivo demais para a BP3, isso é **achado a relatar**, não ação a tomar.
Ajustar o limiar para melhorar o histograma seria escolher parâmetro metodológico pelo resultado,
exatamente o que o pré-registro de D25 impede.

---

## CHECKLIST

Cada item cita o arquivo gravado em `docs/verificacoes/execucao/2026-11-10g/`:

- [ ] Branch: ______ · credencial confirmada presente
- [ ] T1 — bloco de 25 cronometrado: ___ ms; timeout usado: ___ ; bloco escolhido: ___
- [ ] T2 — do cache: ___ · medidos agora: ___ · indisponíveis ao fim: ___ (causas: ______)
- [ ] T3 — pontos com `Ê == 0`: ___ de ___ (___%), IC Wilson 95%: [___ ; ___]
- [ ] T3 — valores distintos: ___ · maior grupo de empates: ___
- [ ] T3 — limiares de tercil retornados: t₁ = ___ , t₂ = ___ ; ocupação: ___ / ___ / ___
- [ ] T4 — células de K̂=2 com ≥ 4 candidatos: ___ de 9; deficientes: ______
- [ ] T4 — pontos com `nObservacoes < 12`: ___
- [ ] T4 — sorteio **não** executado; trava **não** removida
- [ ] T5 — janela efetiva: de ______ a ______ (pedida: 2016-01-01 a 2026-06-30)
- [ ] T6 — evidência escrita; nenhum limiar de D10 alterado
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
