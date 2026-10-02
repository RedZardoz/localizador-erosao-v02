# Prompt de Execução — Correções do pipeline amostral e Calculadora de Desenho

**Data:** 29/09/2026
**Natureza:** três correções de pipeline que desfazem o gargalo de K̂=2, mais a **Calculadora de Desenho Amostral**, painel que torna a escolha do tamanho do polígono demonstrável a quem avalia.
**Emendas a implementar:** **D16** (geometria dos polígonos) e a nota de **D24**, registradas em `f5be525`.
**Posição:** último trabalho antes do sorteio.

---

# PARTE 0 — O DIAGNÓSTICO, MEDIDO

A sua medição W2 encontrou apenas 5 candidatos em K̂=2 para abastecer 9 estratos que precisam de 18 — e concluiu, corretamente, que o mínimo de 2 por estrato era impossível. Verifiquei e o quadro é este:

## Correção de um erro seu, que piora o número

Você mediu o domínio de declividade em **3 a 45%**, e a chave do próprio artefato é `filtroDeclividadeD07_3a45pct`. Mas **D07 fixa 3 a 20%**, e o código traz `maxSlopePercent: 20.0` em `src/lib/gee/elegibilidade.ts:33`. A faixa de 45% não é domínio de decisão alguma. Recalculei sobre os seus 90 candidatos:

| Faixa | Elegíveis | K̂=1 | K̂=2 | Falta para 18 |
|---|---|---|---|---|
| 3–45% (como mediu) | 38 | 29 | 9 | 9 |
| **3–20% (D07 real)** | **29** | **24** | **5** | **13** |

## A causa que você apontou está correta, e há mais duas

| Etapa | Restam | Causa |
|---|---|---|
| Imóveis no envelope da bacia | 73.643 | medido em `data/fundiario_brasil.db` |
| Dentro do divisor hidrográfico | ~22.000 | geografia, legítimo |
| Após thinning | **593** | **`raioThinningKm = 5.0`** em `select-candidates/route.ts:178` |
| Teto operacional | **90** | `slice(...)` na linha 340, **antes** do filtro físico |
| Domínio de D07 | **29** | **centroide** do imóvel, não a parte elegível |
| K̂ = 2 | **5** | assimetria pedológica real da bacia |

O thinning parte de **5.000 m** e o laço da linha 323 só relaxa enquanto o pool está abaixo da meta, parando cedo. O piso de **P02 é 1.000 m**, valor numérico registrado. Relaxar até o piso permitido multiplica o pool por até ~25x **sem tocar em decisão alguma**.

**Conclusão: o gargalo é artefato de pipeline.** Não decorre da restrição de autorização nem da assimetria da bacia.

## Sobre a sua proposta de recortar a dicotomia de K̂: RECUSADA

Mover "Média" de K̂=1 para K̂=2 contraria D09, que fixa a fronteira entre classe 3 e 4 conforme a Tabela 5 do Documentos 246, conferida na fonte. Mas a objeção principal não é formal: **é ajuste pós-hoc de limiar físico para acomodar a amostra**, o que torna a estratificação função dos dados em lugar do fenômeno — exatamente a flexibilidade analítica que o pré-registro de D25 existe para impedir. Se a bacia tem poucos solos de erodibilidade alta no domínio agrícola, isso é achado sobre a bacia, e o desenho acomoda o achado.

Com as três correções abaixo, a proposta também fica **desnecessária**.

---

# PARTE I — X1: RELAXAR O THINNING ATÉ O PISO DE P02

O padrão de `raioThinningKm = 5.0` (linha 178) é cinco vezes o piso registrado. Faça o laço de relaxamento perseguir uma meta de pool **derivada do que o desenho precisa depois dos filtros**, e não do tamanho da amostra final.

1. A meta de pool deve considerar a taxa de sobrevivência aos filtros. Medida agora: **29 de 90** sobrevivem ao domínio de D07, isto é 32%; e **5 de 90** caem em K̂=2, isto é 5,6%. Para obter 18 candidatos em K̂=2 é preciso ordem de **320 candidatos medidos**, e com margem, mais.
2. Relaxe até o piso de **1.000 m** de P02 se necessário. **Nunca abaixo** — o piso é inviolável e `exigirDecisao(P02)` deve governar, jamais um literal.
3. Registre no relatório o raio final efetivamente alcançado e quantos candidatos ele produziu.

---

# PARTE II — X2: TETO OPERACIONAL DEPOIS DO FILTRO FÍSICO

`select-candidates/route.ts:340` aplica `poolParaMedicaoReal = candidatosAposThinning.slice(0, max(ceil(tamanhoAmostra*1.8), 90))` **antes** do filtro de declividade, que está na linha 482.

O teto existe por razão legítima — limitar requisições simultâneas à API REST do Earth Engine, e está anotado como tal. Mas aplicá-lo antes do filtro de domínio desperdiça o orçamento de requisições em candidatos que serão descartados.

**Reordene:** filtre por domínio físico de D07 **primeiro**, e aplique o teto operacional ao que sobrevive. Se o filtro de domínio exigir medição de terreno por candidato, e portanto requisição, então o teto precisa ser aplicado em **lotes sucessivos** até que o número de candidatos elegíveis seja suficiente — não num corte único no início.

Relate o número de requisições consumidas antes e depois da reordenação.

---

# PARTE III — X3: PONTO NA PARTE ELEGÍVEL DO IMÓVEL, NÃO NO CENTROIDE

O pesquisador confirmou que o universo é imóvel rural identificado por **necessidade de autorização** de sobrevoo e de visita. Mas a restrição é **identificação do proprietário**, e não o centroide: o polígono pode ficar em qualquer parte do imóvel, e se pede autorização ao mesmo dono.

O centroide é ponto arbitrário que pode cair abaixo de 3% de declividade enquanto o mesmo imóvel tem área elegível cem metros ao lado. Foi isso que produziu 52 de 90 centroides fora do domínio.

**Implemente:** o candidato de cada imóvel passa a ser um ponto **dentro da parte elegível** do imóvel — declividade de 3 a 20%, WorldCover 30 ou 40 com concordância entre épocas, fora de água e de área urbana, com K̂ definido.

## GUARDA ANTICIRCULARIDADE — a parte que não pode ser errada

Escolher o ponto **por elegibilidade** é legítimo. Escolhê-lo **por suspeita de erosão** reintroduz pela porta de trás a circularidade que D16 barra: sortear onde o rastreio espectral de D02 aponta erosão faria o modelo aprender a concordar com o rastreio, em lugar de detectar erosão — o defeito eliminado em `207dca2` reentrando por outra porta.

Portanto o ponto é **sorteado ao acaso entre as células elegíveis do imóvel**, com a semente registrada conforme P07, e **jamais** por `scoreSuscetibilidade`, `scoreJev`, `severidade`, `scorePrioridade` ou qualquer índice espectral. Reaproveite `CAMPOS_PROIBIDOS_MATRIZ_TREINO` como base da lista de proibidos, e **aborte** se algum desses campos alcançar a função de escolha.

Teste obrigatório: dado um imóvel com células elegíveis e um escore de suscetibilidade presente nos dados, asseverar que a escolha **não** correlaciona com o escore — por exemplo, que duas sementes diferentes produzem pontos diferentes e que o ponto escolhido não é o de escore máximo.

---

# PARTE IV — X4: GEOMETRIA NOVA DOS POLÍGONOS (D16 EMENDADA)

D16 foi emendada em `f5be525`. **Leia o `valor` no arquivo.** Em resumo do que muda no código:

- **72 polígonos de 5,02 ha**, quatro por estrato sobre os 18 estratos, em lugar de 36 de 10 ha, dois por estrato.
- **Dois de treino e dois de held-out** por estrato, em lugar de um e um.
- Forma: **quadrado de ~224 x 224 m**, ou **retângulo de mesma área com razão de aspecto até 1:2** — por exemplo 160 x 314 m — orientado preferencialmente no sentido do declive quando a geometria do imóvel permitir.
- Área total praticamente igual: **361 ha** contra 360 ha.

**Por que isto não altera D24:** as unidades efetivas resultam da **área total** dividida pelo alcance de autocorrelação, e não do tamanho de cada polígono. O total vai de 1.836 para 1.845, de modo que o teto de 8 preditores espectro-temporais permanece **sem recálculo**. A nota já está registrada em D24.

O motor de sorteio de `src/lib/gee/sorteioPoligonos.ts` precisa passar de 2 para 4 por estrato, e a designação treino/held-out de 1+1 para 2+2 — **sorteada com a semente registrada**, nunca por ordem. Atualize a pré-condição de mínimo de candidatos por estrato de 2 para **4**, e os testes correspondentes.

---

# PARTE V — X5: CALCULADORA DE DESENHO AMOSTRAL

O pesquisador pediu um painel que torne a escolha do tamanho do polígono **demonstrável a quem avalia**, com a perda e o risco visíveis. É exequível e é bom para a defesa: transforma uma escolha de desenho em algo que a banca pode explorar em vez de aceitar por afirmação.

## Entradas, com valores pré-setados

| Campo | Pré-set | Faixa |
|---|---|---|
| Lado do polígono (m) | **224** | 100 a 400 |
| Razão de aspecto máxima | **1:2** | 1:1 a 1:3 |
| Área total voada (ha) | **361** | 100 a 800 |
| Estratos de D12 | 18 (somente leitura, de D12) | — |
| Alcance de autocorrelação (m) | 50 (de D24) | — |

## Saídas calculadas

1. **Área por polígono**, derivada do lado.
2. **Número de polígonos** para a área total, e **por estrato**.
3. **Fração de imóveis elegíveis**, calculada ao vivo sobre `data/fundiario_brasil.db` com o teste de caixa envolvente, admitindo retângulo até a razão informada.
4. **Unidades espacialmente independentes**, total e no held-out.
5. **Teto de preditores espectro-temporais** ao critério de 200 observações por variável de D24.
6. **Número de autorizações** de proprietário necessárias, igual ao número de polígonos.
7. **Delta contra o desenho registrado** em D16, campo por campo — é o que demonstra a perda.

## Alertas — críticos e de atenção

**CRÍTICOS**, que devem bloquear visualmente a configuração como inadmissível:

- polígonos por estrato **< 4** — quebra a replicação 2+2 de D16 emendada; e **< 2** quebra qualquer pareamento treino/held-out;
- unidades efetivas totais **< 1.600** — o teto de 8 preditores de D24 deixa de se sustentar, e a decisão precisaria ser emendada;
- teto de preditores calculado **< 8** — mesma consequência, exibida pelo outro lado;
- fração de imóveis elegíveis tal que os candidatos esperados em **K̂=2** fiquem abaixo de 2 por estrato — é exatamente o gargalo que este prompt corrige, e a calculadora deve saber reproduzi-lo.

**ATENÇÃO**, que devem ser exibidos sem bloquear:

- fração de imóveis elegíveis **< 60%** — viés de tamanho de propriedade, que correlaciona com prática de manejo e portanto com os fatores C e P do RUSLE;
- lado **< 200 m** — efeito de borda na delineação de D26, porque a proporção de células de 10 m que tocam o contorno do polígono cresce e a fração erodida dessas células é medida sobre área truncada;
- autorizações **> 72** — viabilidade de campo, que a emenda de D16 já registra como o custo assumido;
- razão de aspecto **> 1:2** — a orientação do retângulo passa a determinar se a catena é atravessada ou acompanhada, e a decisão deixa de ser indiferente à forma.

## A salvaguarda que a calculadora precisa ter, e é a parte mais importante

**A calculadora é somente de exploração. Ela NÃO pode alterar o desenho que o sorteio usa.**

- O sorteio lê a geometria de **D16**, sempre, por `exigirDecisao`. A calculadora **nunca** alimenta o motor de sorteio.
- A tela deve distinguir, de forma inequívoca, **"configuração registrada em D16"** de **"configuração simulada"**, e exibir as duas lado a lado.
- Se a configuração simulada diferir da registrada, exibir aviso de que **adotá-la exige emenda de decisão pelo pesquisador**, com a indicação de que `src/config/decisoes.ts` é proibido ao agente executor por P8.
- Nenhum valor da calculadora é persistido como parâmetro de execução. Ela pode exportar um **relatório** da simulação, para anexar à dissertação ou à defesa, e nada mais.

Sem isso, a calculadora se torna um botão que contorna o registro de decisões — e o registro é o que sustenta a auditabilidade de toda a pesquisa.

## Onde colocar

No painel do pesquisador, junto ao comando de sorteio, e **nunca** em tela alcançável durante coleta de campo, por causa do protocolo cego. Exportação do relatório de simulação em formato que sirva de anexo.

---

# PARTE VI — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `src/config/decisoes.ts` e `src/config/decisoes.test.ts` proibidos. As emendas de D16 e D24 **já estão feitas**; leia e implemente. A calculadora **jamais** escreve ali.
- **P02** — o piso de thinning de 1.000 m é inviolável, e vem de `exigirDecisao(P02)`, nunca de literal.
- **P11** — não relaxe critério declarado para fazer teste passar. Se o pool ainda não bastar após X1 a X3, **relate com os números** em lugar de ajustar limiar.
- **P12** — `indisponivel` não vira valor.
- **Não execute o sorteio.**
- **Não escolha o ponto do imóvel por suspeita de erosão**, em nenhuma forma.

---

# PARTE VII — RELATÓRIO

Vale a disciplina **R1 a R6**. Lembrete com razão empírica: em **três relatórios seguidos** o artefato JSON estava certo e a tabela redigida à mão errava. **Gere** a tabela a partir do JSON.

1. Raio de thinning final alcançado e candidatos produzidos (X1).
2. Requisições ao Earth Engine consumidas antes e depois da reordenação (X2).
3. Como o ponto elegível é sorteado dentro do imóvel, e a saída do teste de anticircularidade (X3).
4. **A remedição completa**: candidatos por estrato, contagem em K̂=1 e K̂=2, e se os 4 por estrato de D16 emendada são atingidos — com a faixa de declividade **3 a 20%**, e não 45%.
5. Motor de sorteio em 4 por estrato com designação 2+2, e os testes atualizados.
6. Calculadora: captura de tela ou descrição das saídas com o pré-set de 224 m, e demonstração de que um valor crítico dispara o alerta.
7. Confirmação de que a calculadora **não** alimenta o sorteio nem persiste parâmetro.
8. Passagem de autoconferência de R5 e o que ela pegou.

Assine com a sua identidade. `author` é Luís Alfredo Ferreira da Silva (`RedZardoz`). Atualize `docs/PROVENIENCIA_ASSISTENCIA_IA.md`.

---

## Nota

As três correções de pipeline não mudam decisão alguma — são parâmetros operacionais mal calibrados, e o piso de P02 já autorizava o que falta fazer. A emenda de geometria de D16 mudou desenho, e mudou porque a medição do universo fundiário mostrou que a restrição de autorização, combinada com a mediana de 11,7 ha dos imóveis da bacia, tornava 57% deles inelegíveis por um motivo que não era metodológico.

A calculadora existe para que a próxima pessoa que perguntar "por que 5 ha e não 10?" possa mover o campo e ver a resposta, em lugar de confiar nesta medição.
