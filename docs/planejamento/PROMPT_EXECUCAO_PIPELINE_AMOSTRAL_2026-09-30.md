# Ordem de Execução — Pipeline amostral, com um defeito novo a corrigir antes

**Data:** 30/09/2026
**Corpo principal:** `docs/planejamento/PROMPT_PIPELINE_AMOSTRAL_E_CALCULADORA_DE_DESENHO_2026-09-29.md`, commit `52f8d5a`, **nunca executado**. Ele continua valendo e **não é repetido aqui**.
**Este documento:** autoriza a execução daquele prompt, corrige o que envelheceu nele, e acrescenta **X0**, um defeito encontrado hoje que precede tudo.

---

# PARTE 0 — X0: DEFEITO NO MOTOR DE SORTEIO, A CORRIGIR PRIMEIRO

Encontrado ao conferir o estado antes de autorizar. **Não é um dos três itens de pipeline; é anterior a eles**, e está no caminho de uma operação irreversível.

## O que há

Em `src/lib/gee/sorteioPoligonos.ts`, a pré-condição e o sorteio **discordam sobre quantos candidatos um estrato precisa**:

```ts
// linha 239 — pré-condição
const estratosDeficientes = TODOS_ESTRATOS_D12.filter(
  (idEstrato) => contagemCandidatosPorEstrato[idEstrato] < 2
);

// linhas 669, 674, 680 — sorteio
const pi_i = 4 / nH;
const w_i = nH / 4;
for (let i = 0; i < 4; i++) { /* Fisher-Yates parcial */ }
const quarteto = pool.slice(0, 4);
```

A pré-condição aceita estrato com **2** candidatos; o sorteio precisa de **4**, conforme D16 emendada. Com `nH = 2` ou `3`, a pré-condição **passa** e então:

1. **`pi_i = 4 / 2 = 2,0`** — probabilidade de inclusão maior que 1, matematicamente inválida. E `w_i = 0,5`, isto é, o polígono passa a contar como meia observação em toda estimativa de Horvitz-Thompson.
2. **O Fisher-Yates escreve fora do array.** Com `pool.length = 2` e `i = 2`, tem-se `j = 2 + Math.floor(prng() * 0) = 2`, e `pool[2] = undefined`. Em `i = 3`, `pool[3] = undefined`. O `slice(0, 4)` devolve `[a, b, undefined, undefined]`.
3. O estrato entra no selo com **dois polígonos indefinidos** e um `pi_i` inválido.

A mensagem de erro e o identificador da condição ainda dizem "2", e falam do "par treino/held-out" — texto da versão anterior de D16, que pedia 2 por estrato. O teste existente **consagra o limiar errado** e por isso passa.

## Por que é grave agora

Este defeito só se manifesta em estrato com 2 ou 3 candidatos — e é exatamente o que a medição de K̂=2 prevê. Dos 9 estratos de K̂=2, a contagem atual é de **5 candidatos no total**; conforme o pool crescer com as correções X1 a X3, vários estratos passarão por 2 e 3 antes de chegar a 4.

E o selo de D23 é **irreversível**: `pi_i` registrado não se descarta. Um sorteio com `pi_i = 2,0` e polígonos `undefined` contaminaria de forma permanente toda estimativa de prevalência.

## O que fazer

1. Limiar da pré-condição passa de `< 2` para **`< 4`**.
2. Renomeie a condição de `minimo_2_candidatos_por_estrato` para **`minimo_4_candidatos_por_estrato`**, e corrija a mensagem: são quatro por estrato para formar **dois de treino e dois de held-out**, conforme D16 emendada.
3. **Guarda de sanidade no próprio sorteio**, independente da pré-condição: se `nH < 4`, lançar. Defesa em profundidade — a pré-condição pode ser contornada por outro chamador.
4. **Asseverar `0 < pi_i <= 1`** para todo polígono sorteado, e falhar de imediato se violado. É invariante de amostragem e nunca deve sair pelo selo.
5. Corrija o Fisher-Yates para não indexar além do array.
6. **Testes:** estrato com 2 e com 3 candidatos deve ser **recusado** pela pré-condição; e, chamando o sorteio diretamente com `nH = 2`, deve lançar em lugar de devolver `undefined`. Atualize o teste que hoje consagra o limiar 2.

---

# PARTE I — A ARITMÉTICA DO PROMPT PRINCIPAL ENVELHECEU

O prompt `52f8d5a` foi escrito quando D16 pedia **2 polígonos por estrato**. A emenda de geometria, em `f5be525`, passou para **4**. Logo:

| | No prompt `52f8d5a` | Correto agora |
|---|---|---|
| Polígonos por estrato | 2 | **4** |
| Estratos de K̂=2 | 9 | 9 |
| Candidatos necessários em K̂=2 | 18 | **36** |
| Medidos hoje (domínio 3–20%) | 5 | 5 |
| Fração de K̂=2 no pool medido | 5,6% | 5,6% |
| Candidatos a medir, estimativa | ~320 | **~648** |

**A meta dobrou.** E 648 é piso, não alvo: os 36 precisam se distribuir com **pelo menos 4 em cada uma das 9 células** (tercil de Ŝ × tercil de Ê) dentro de K̂=2, e os solos de erodibilidade alta ocorrem preferencialmente em relevo declivoso, de modo que as células de tercil inferior de declividade serão as escassas.

Onde o prompt principal disser 18 ou ~320, leia **36** e **~648**.

---

# PARTE II — O QUE MUDOU NO REPOSITÓRIO E DEVE SER REAPROVEITADO

O prompt principal foi escrito antes do exportador de planos de voo. Hoje existem, em `src/lib/drone/planoVooNControl.ts`, coisas que a tarefa deve usar em lugar de recriar:

- **`criarAmostradorCopernicusGLO30Real`** — leitor real do DEM, com isolamento de `PROJ_LIB` e rejeição estrita de borda, já verificado.
- **`identificarTileCopernicus`** e **`verificarCoberturaGLO30Poligonos`** — verificação de cobertura por cálculo.
- O cache de 4 tiles em `data/dem_cache/`, que cobre a bacia inteira.

**Não crie segunda via de leitura do DEM.** Se a calculadora ou o pipeline precisarem de cota ou de declividade, venham daí.

## A regra de cegamento de W2 vale para tudo que a calculadora emitir

Nenhum artefato pode conter, ao mesmo tempo, código opaco do intérprete e atributo de desenho. O teste `src/lib/seguranca/cegamentoArtefatos.test.ts` já varre `docs/verificacoes/voo_ncontrol/`. **Se a calculadora emitir relatório de simulação em outro diretório, estenda a varredura àquele diretório** — senão a guarda tem um ponto cego novo.

---

# PARTE III — ORDEM DE EXECUÇÃO

1. **X0**, o defeito do motor de sorteio. Antes de tudo.
2. **X1**, relaxar o thinning até o piso de P02, com a meta recalculada da PARTE I.
3. **X2**, teto operacional depois do filtro de D07.
4. **X3**, ponto na parte elegível do imóvel, com a guarda anticircularidade.
5. **Remedição**, na faixa **3 a 20%** — e não 45% — reportando candidatos por estrato e a contagem em K̂=2 contra os 36 necessários.
6. **X5**, a Calculadora de Desenho, com pré-set de 224 m e razão 1:2.

Se, depois de X1 a X3, a contagem em K̂=2 ainda não alcançar 4 por estrato nos 9 estratos, **pare e relate com os números**. Não ajuste limiar, não recorte a dicotomia de K̂, não reduza o número de polígonos por estrato. A decisão sobre o que fazer nesse caso é do pesquisador, e as alternativas já estão levantadas em `docs/verificacoes/2026-09-29_gargalo_estratos_k2_dominio_d07.md`.

---

# PARTE IV — REGIME DE RELATO

**Substitui a PARTE VII do prompt principal.** O relatório desta fase é **gerado** por `scripts/gerar_relatorio_fase.ts`, conforme W5, que já funcionou.

Vale a regra: **o que não sair de um artefato não entra no relatório.** A seção de juízo não traz número novo.

Acrescente à seção de juízo, além do que o script gerar:

1. O raio de thinning final e quantos candidatos ele produziu.
2. Requisições ao Earth Engine antes e depois da reordenação de X2.
3. Como o ponto elegível é sorteado dentro do imóvel, e o resultado do teste de anticircularidade.
4. A contagem em K̂=2 por estrato, contra os **4** exigidos.
5. O que a calculadora mostra no pré-set de 224 m, e a demonstração de que um valor crítico dispara o alerta.
6. Confirmação de que a calculadora **não** alimenta o sorteio nem persiste parâmetro.

---

# PARTE V — PROIBIÇÕES

Valem P1 a P12 e as do prompt principal.

- **P8** — `decisoes.ts` proibido. X0 não exige emenda: D16 já diz 4 por estrato, e o código é que está atrasado.
- **P02** — o piso de thinning de 1.000 m vem de `exigirDecisao(P02)`, nunca de literal.
- **P11** — se o pool não bastar, relate com números. Não ajuste critério.
- **Não execute o sorteio.** Nem depois de X0 corrigido, nem para testar. O `--dry-run` é o limite.
- **Não crie segunda leitura do DEM.**

---

## Nota

X0 é o tipo de defeito que só aparece quando alguém confere antes de autorizar: o motor passa nos testes, porque os testes consagram o limiar antigo, e o erro só se manifesta num estrato com 2 ou 3 candidatos — situação que não existia enquanto o pool era pequeno demais para chegar lá, e que **as três correções de pipeline vão produzir**.

Ou seja: corrigir o pipeline sem corrigir X0 antes é o que torna o defeito alcançável. Daí a ordem.
