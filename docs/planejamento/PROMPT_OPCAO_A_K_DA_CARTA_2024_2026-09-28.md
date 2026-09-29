# Prompt de Execução — Opção A: K̂ da carta de 2024, ambiguidade na fonte, heurística aposentada

**Data:** 28/09/2026
**Natureza:** implementa as emendas de **D08 e D12**, registradas no commit `f629451`.
**Posição:** é o **último trabalho antes do sorteio**. As emendas declaram o sorteio liberado; ele depende desta implementação e **não é seu**.

---

# PARTE 0 — DE ONDE VEIO ESTA DECISÃO

Eu mesmo executei a campanha de medição que a fundamenta, porque era medição e não implementação. Você **não precisa repeti-la**; precisa implementar o que ela concluiu. Dados em `docs/verificacoes/fontes/wfs_erodibilidade/amostra_dirigida_associacoes_2026-09-28.{md,json}` e script em `amostra_dirigida_associacoes.py`.

**Desenho:** as duas caracterizações anteriores da discordância entre cartas em unidades compostas tinham base de 3 e depois de 2 pontos incidentais. Fiz amostra **dirigida e estratificada**: a bacia tem **193 polígonos de associação** em **8 unidades de mapeamento** (`RRe12` 90, `LVef2` 37, `NVef4` 34, `PVe3` 16, `RRe9` 9, `NVdf4` 4, `LVdf11` 2, `RRd7` 1). Até 5 polígonos por unidade, **32 pontos**, ponto interior por `shapely.representative_point()`, atribuição por ponto-em-polígono. Os 32 confirmados como `tipo_unida='associacao'` pela própria consulta.

## Os três achados que mudaram as decisões

**1. A carta nacional generaliza.** Em **16 de 32** pontos a carta de 2024 mapeia unidade **simples** onde a estadual mapeia associação. A correspondência estrita de sequência, de **2 em 32 (6,2%)**, não era problema de ordenação de componentes: é diferença de granularidade entre levantamento estadual e nacional a 1:250.000.

**2. A correspondência de sequência era a métrica errada.** D08 pergunta se os níveis **dentro da unidade** atravessam a fronteira de D09 — e os próprios `erod_c1..erod_c4` respondem isso **sem casar a ordem dos componentes entre cartas**. Reenquadrada assim: 16/32 (50%) determináveis na fonte, dos quais **4 (25%) oficialmente K-ambíguos**; 16/32 indetermináveis.

**3. Duas das oito unidades recebem níveis de K̂ DIFERENTES em pontos distintos:** `RRe12` (nível 2 em `SG21RLm4`, nível 1 em `SG22NVef3`) e `RRe9` (nível 2 em `SG22CXvef` e `SG22RLm2`, nível 1 em `SG22NVef3`). O `k_solos` varia dentro da mesma unidade estadual por fator de até **2,8**. E a `RRe12` sozinha é **47%** dos polígonos de associação da bacia.

**As emendas estão em `src/config/decisoes.ts`. Leia o `valor` de D08 e de D12 no arquivo — é normativo e este prompt não o repete.**

---

# PARTE I — W1: A AMBIGUIDADE PASSA A SER LIDA NA FONTE, EM DOIS RAMOS

A heurística taxonômica de enquadramento por ordem e subordem está **aposentada** por D08 emendada. Ela nunca foi conferida contra a fonte primária, e a medição mostrou que é dispensável.

Implemente `kAmbiguoAssociacao` em dois ramos, a partir da feição da carta de 2024 que **contém** o ponto:

**Ramo (a) — dois ou mais componentes em `erod_c1..erod_c4`.** Converta cada classe ao nível de D09 — `{Muito baixa, Baixa, Média}` → 1; `{Alta, Muito alta, Extremamente alta}` → 2 — e compare. Se os níveis atravessarem a fronteira, `true`; se todos caírem do mesmo lado, `false`. Proveniência **`tabelado`**, com `tabela` e `chave` da feição. **Sem heurística em nenhum dos dois desfechos.**

**Ramo (b) — um único componente na carta de 2024, com `tipo_unida = 'associacao'` na carta estadual.** A composição **não está resolvida na fonte**. O marcador é **`indisponivel`** com causa **`insuficiente`**.

## O ponto em que esta tarefa se perde, se você errar

**É proibido devolver `false` no ramo (b).** Seria confortável: metade das associações deixaria de ser marcada e o resultado pareceria mais limpo. Mas a carta estadual, de maior detalhe, diz que há mais de um solo ali; o silêncio da carta nacional é **generalização de escala, não negativa**. Converter esse silêncio em `false` é produzir informação a partir de ausência de informação — o mesmo defeito que converter `indisponivel` em valor, por P12.

`false` significa "conferido na fonte e não é ambíguo". `indisponivel` significa "a fonte não se pronuncia". Os dois são respostas; confundi-los não é.

## Remoção da heurística

Localize a função de enquadramento taxonômico — `classificarNivelEstratoKComponente` e o que dela dependa — e **relate antes de remover** quem ainda a chama. Se ficar sem uso, remova-a citando a emenda de D08 no commit. Se algum chamador permanecer por outra razão legítima, **relate em lugar de remover**, e diga qual razão.

Os testes existentes que exercitam a heurística devem ser **substituídos** pelos dos dois ramos novos, não apenas apagados. E é obrigatório um teste que assevere o ramo (b) devolvendo `indisponivel` e **não** `false` — é a asserção que protege a decisão.

---

# PARTE II — W2: K̂ DA CARTA DE 2024, E A CONSEQUÊNCIA DECLARADA

Por D12 emendada, o nível de K̂ vem de `erod_um` — ou equivalentemente da faixa de `k_solos` — da unidade que **contém** o ponto na carta de 2024, por ponto-em-polígono. **Não vem mais do componente dominante da carta estadual nem de regra taxonômica.**

1. Ligue o nível de K̂ da estratificação a essa fonte. O `nivelK: 1 | 2` que `src/lib/gee/estratificacao.ts` consome passa a ser derivado dela.
2. Categoria não-pedológica — área urbana, corpo d'água — **não tem nível de K̂** e retira o ponto do domínio, conforme D07 e D14. Não a converta em nível, e não a deixe cair em nenhum ramo de fallback.
3. **Registre, por ponto, a unidade de 2024 que determinou o K̂** — `cod_um` ou `cod_um2` e o `ogc_fid` — no pacote de reprodutibilidade. Sem isso o estrato de cada polígono sorteado não é auditável depois, e `pi_i` registrado por D23 é irreversível.

## A consequência que você não deve tentar corrigir

Células dentro da **mesma** unidade de mapeamento estadual **podem cair em estratos de K̂ diferentes**, porque a carta de erodibilidade tem suas próprias unidades. **Isso é intencional e está declarado em D12.**

Não implemente reconciliação alguma: não faça voto majoritário por unidade estadual, não propague o K̂ da unidade estadual dominante, não suavize por vizinhança. Reconciliar produziria um terceiro mapa que não existe em fonte alguma — exatamente a fabricação que D08 veda. Se a variação intra-unidade lhe parecer defeito, **relate e não conserte**.

## O que medir e relatar

Sobre o conjunto de candidatos, e não sobre os meus 32 pontos:

- distribuição dos 18 estratos, com a contagem por estrato;
- quantos candidatos ficaram em cada nível de K̂;
- quantos foram retirados por categoria não-pedológica;
- quantas unidades estaduais distintas aparecem com **mais de um** nível de K̂ entre seus candidatos — é a medida da dispersão intra-unidade sobre o quadro real, e o meu número de 2 em 8 vale apenas para associações.

---

# PARTE III — W3: A SENSIBILIDADE PRÉ-REGISTRADA MUDOU DE DEFINIÇÃO

D08 emendada atualizou a análise de sensibilidade de D25: ela remove as células cujo marcador seja **`true` OU `indisponivel`** — as duas condições.

A razão está na decisão e é substantiva: o que a sensibilidade mede é o **custo de não saber a composição da célula**, e não saber por indeterminação vale tanto quanto saber que é ambígua. A definição anterior removia só as `true`.

**Não implemente a análise agora** — ela pertence à avaliação de D25, que não existe. O que se exige aqui é que **o marcador seja persistido e exportado nos três estados** — `true`, `false`, `indisponivel` — de modo que a sensibilidade seja possível depois. Marcador booleano de dois estados torna a análise irrealizável, e é o erro a evitar.

O marcador continua **fora da matriz de treino** por Invariante 2. Mantenha-o em `CAMPOS_PROIBIDOS_MATRIZ_TREINO`.

---

# PARTE IV — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `src/config/decisoes.ts` e `src/config/decisoes.test.ts` proibidos. As emendas de D08 e D12 **já estão feitas** em `f629451`; leia e implemente. Se discordar de alguma, relate.
- **P12** — `indisponivel` não vira valor. É o núcleo de W1 e de W2.
- **Não reconcilie** a discordância de K̂ entre cartas por regra alguma.
- **Não devolva `false`** quando a fonte não se pronuncia.
- **Não execute o sorteio.** Ele é o passo seguinte e não é seu, ainda que as emendas o declarem liberado.
- **Não reexecute** a minha campanha de 32 pontos; ela está cometida e é insumo, não tarefa.

---

# PARTE V — RELATÓRIO

Vale a disciplina **R1 a R6**. Lembrete, porque se repetiu em três relatórios: **cole do artefato, não do texto.** Nas três rodadas o JSON estava certo e a tabela redigida à mão errava. Considere **gerar** a tabela do relatório a partir do JSON em lugar de redigi-la ao lado.

1. Como ficaram os dois ramos de W1, e a saída do teste que assevera `indisponivel` e não `false` no ramo (b).
2. Quem chamava a heurística taxonômica, o que você fez com ela, e quais testes foram substituídos.
3. Como o nível de K̂ passou a ser derivado, e onde a unidade de 2024 determinante ficou registrada por ponto.
4. As quatro medições de W2 sobre o conjunto de candidatos.
5. Confirmação de que o marcador é persistido e exportado nos **três** estados.
6. Confirmação da passagem de autoconferência de R5 e o que ela pegou.

Assine com a sua identidade. `author` é Luís Alfredo Ferreira da Silva (`RedZardoz`). Atualize `docs/PROVENIENCIA_ASSISTENCIA_IA.md`.

---

## Nota

Esta é a última troca de regra nossa por leitura de fonte oficial antes do sorteio, e é a que mais importa das três, porque incide sobre a dimensão que **define os estratos**. Depois dela, nenhuma parte do quadro amostral depende de heurística não conferida: o domínio vem de D07, a posição vem de ponto-em-polígono, o K vem tabelado da carta de 2024, e o que a fonte não responde fica declarado como não respondido em lugar de preenchido.

É a condição para registrar `pi_i` sem dívida oculta — e, por D23, `pi_i` registrado não se descarta.
