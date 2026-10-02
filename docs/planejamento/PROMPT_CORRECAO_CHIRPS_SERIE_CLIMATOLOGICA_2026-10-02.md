# Prompt de Execução — O CHIRPS de um ano, e três defeitos no mesmo script

**Data:** 02/10/2026
**Alvo:** `scripts/baixar_chirps_climatologia.py` (209 linhas) e os dois artefatos que ele emite.
**Natureza:** **L1 é violação direta de D13**, não ambiguidade. L2 a L4 são defeitos encontrados no mesmo script ao verificar L1.
**Origem:** verificação do cumprimento de H2.

---

# PARTE 0 — O QUE ESTÁ CERTO, E NÃO SERÁ DESFEITO

Registro antes das correções, porque o que foi bem feito aqui foi bem feito de verdade.

**O download é autêntico.** Conferi o diário em `docs/verificacoes/diario_climatologia_chirps_bp3.json`:
12 chamadas ao UCSB, todas HTTP 200, 174.956.340 bytes recebidos, carimbos de tempo progressivos e
durações entre 5,9 e 9,8 segundos — compatíveis com transferência real de arquivos de 14,5 MB.
Não há sinal de fabricação. **Foi o primeiro exercício real da guarda de diário, e a guarda
funcionou.**

**O período foi declarado com honestidade.** O artefato traz
`"periodo": "2022 (12 meses completos)"`. Nada foi escondido — e é justamente por isso que o
defeito é verificável.

**O suporte nativo foi preservado.** `"reamostragem": "NENHUMA"`, 0,05° mantido conforme D06.
Isto está correto e **não deve mudar**.

**A tabela do Waltrick está declarada como conferência cruzada**, não como fonte. Correto.

O script não será reescrito do zero. São quatro correções localizadas.

---

# PARTE I — L1: UM ANO NÃO É UMA CLIMATOLOGIA, E D13 JÁ DIZIA ISSO

## O que há

`scripts/baixar_chirps_climatologia.py:38`:

```python
ANO_SERIE = 2022
MESES = [f"{m:02d}" for m in range(1, 13)]
```

Um ano, fixo no código. E o artefato resultante se chama
`docs/verificacoes/climatologia_chirps_bp3.json`, com `tipo: "climatologia_chirps_mensal_bp3"`.

## Por que é violação, e não lacuna

**Não se trata de D13 ter sido omissa.** A cláusula (b) de D13 diz, em palavras:

> "(b) R CLIMATOLÓGICO, média de longo prazo sobre toda a série disponível, e NÃO erosividade de
> um ano. A erosão laminar que o VANT delineia em 2026 é resultado acumulado de histórico
> pluviométrico, não de uma safra; usar R anual faria o preditor descrever um período que o rótulo
> não representa. O R de ano ou de evento fica RESERVADO à análise de pares de evento de D19."

A decisão nomeia a prática, proíbe-a, e dá a razão. **O script fez exatamente o que ela veda**, e
isso passou como cumprimento de H2 — com testes verdes, diário emitido e período honestamente
declarado. Nenhum desses sinais detecta o defeito, porque nenhum deles compara o artefato com o
texto da decisão que o governa. **Volto a isso na PARTE VI.**

## A consequência quantitativa

A tabela de conferência cruzada do script traz `rRefWaltrick` por município — Toledo 10.623,
Cascavel 11.588, Santa Helena 11.261, Foz do Iguaçu 11.037, Palotina 10.436, Medianeira 11.400.
Conferi na extração primária: **esses valores são de 1986 a 2008**. A expressão aparece mais de
dez vezes em `docs/verificacoes/fontes/waltrick2015/saida_extracao_waltrick_2015.txt`, nas linhas
16, 28, 80, 83, 230, 285, 357, 377, 447, 455, 561 e 689.

Comparar um ano de 2022 contra uma referência de 23 anos é **erro de categoria**, não imprecisão.
E 2022 provavelmente não é ano qualquer: Toledo aparece com 1.484,13 mm anuais no artefato, o que
está abaixo do que se espera da região. **Não afirme isso comigo, meça** — veja o critério de
aceite.

## O que fazer

1. **O período passa a ser a série completa disponível**, conforme D13(b): o CHIRPS v2.0 mensal
   começa em **janeiro de 1981**, logo de 1981-01 ao **último ano completo**, que hoje é 2025.
   São **540 meses**.
2. **Não fixe o ano no código.** O limite superior é derivado — último ano civil completo — e o
   período efetivamente usado é **gravado no artefato**, com contagem de meses.
3. **A execução é longa e deve ser retomável.** São cerca de 7,8 GB de transferência e, pelas
   durações registradas no diário, da ordem de 70 a 90 minutos. O script já salta arquivo em
   cache; preserve esse comportamento e faça com que uma interrupção não recomece do zero.
4. **O diário registra as 540 chamadas.** Não resuma, não agregue: é o registro de proveniência.

## Critério de aceite, e ele é falsificável

O artefato deve conter, para cada estação da BP3, **a precipitação anual de 2022 e o desvio dela
em relação à média da série completa**, em mm e em percentual.

Isto existe para testar a minha própria suspeita, não para confirmá-la. Se 2022 sair próximo da
média, minha preocupação com o viés era exagerada e **isso deve ficar escrito no relatório**. Se
sair bem abaixo, o viés que a climatologia de um ano teria introduzido fica quantificado. Nos dois
casos é número medido, não conjetura — minha ou sua.

---

# PARTE II — L2: 827 MB PARA UM ANO, E O DISCO DO PESQUISADOR JÁ ENCHEU UMA VEZ

## O que há

Medi: `data/chirps_cache/` ocupa **827 MB** para os 12 meses. O script guarda **os dois**
formatos — 12 `.tif.gz` e 12 `.tif` globais descompactados, cada `.tif` com 2000 × 7200 células
cobrindo o planeta.

São 68,9 MB por mês entre os dois formatos. Na escala de L1 — 540 meses — isso seria **cerca de
37 GB**. O pesquisador já teve a máquina lotada por artefatos desta pesquisa e pediu para
removê-los. **Não é detalhe de arrumação, é requisito.**

## O que é absurdo nisso

O script lê o mundo inteiro para amostrar **seis pontos**. E já tem a ferramenta certa à mão, sem
usá-la — veja L4.

Medi a janela que a BP3 de fato ocupa: **34 × 32 células**, em `float32`. São cerca de 4,3 KB por
mês. Para os 540 meses, **algo entre 3 e 5 MB no total** — contra 37 GB. Quatro ordens de
grandeza.

## O que fazer

1. **Recorte na entrada.** Para cada mês: baixe o `.gz`, descompacte, **leia apenas a janela da
   BP3**, grave o recorte como GeoTIFF pequeno, e **apague o global e o `.gz`**. O pico de disco
   fica em dezenas de MB, não em dezenas de GB.
2. **Preserve o CRS e a transformação** do recorte. Recorte com georreferenciação quebrada é pior
   que arquivo grande.
3. **Não reamostre.** D06 e a declaração atual do artefato exigem 0,05° nativo. Recortar não é
   reamostrar; não deixe uma coisa virar a outra.
4. **O cache já está ignorado pelo git** — conferi com `git check-ignore`. Mantenha
   assim, e se o recorte for para outro diretório, confirme o mesmo para ele antes de gravar.
5. **Relate o disco antes e depois**, medido.

---

# PARTE III — L3: NoData VIRANDO ZERO MILÍMETRO É VIOLAÇÃO DE P12

## O que há

No laço de amostragem:

```python
p_mm = float(val[0]) if val[0] > -100 else 0.0
```

O CHIRPS usa `-9999` por convenção para ausência de dado. **Esta linha converte ausência de dado
em zero milímetro de chuva.**

## Por que é grave, e por que é insidioso

Zero milímetro **é valor físico legítimo**: existem meses genuinamente sem chuva. Então, depois
desta linha, "não mediu" e "mediu seca total" ficam **indistinguíveis para sempre** — nenhuma
verificação a jusante pode separá-los. É a forma exata do que P12 proíbe: `indisponivel` virando
valor.

E tem direção conhecida: ausência tratada como zero **só pode puxar a climatologia para baixo**,
logo a erosividade também.

**Conferi que hoje não está disparando:** na janela da BP3 de 2022-01 não há célula de NoData, e
os valores vão de 59,9 a 320,0 mm. O defeito é **latente**. Sobre 540 meses, incluindo os anos 80,
a chance de disparar é bem outra — e disparará em silêncio.

Note ainda que os arquivos **não declaram** `nodata` nos metadados: conferi, vem `None`. O valor
`-9999` é convenção do produto, não declaração do arquivo. O código não pode depender de
`src.nodata`.

## O que fazer

1. **Ausência de dado propaga como ausência.** Não 0,0, não `None` silencioso, não média dos
   vizinhos. Use a disciplina de `Proveniencia` que o projeto já tem: o mês fica `indisponivel`
   com causa nomeada.
2. **A climatologia de uma célula ou estação declara quantos meses entraram** no cálculo. Se algum
   faltou, o artefato diz quantos e quais. Média de série incompleta apresentada como série
   completa é a mesma família de defeito.
3. **Fixe o sentinela do produto explicitamente** — `-9999` como convenção CHIRPS declarada no
   código, com comentário dizendo que o arquivo não a declara — em lugar do limiar frouxo
   `> -100`, que silenciosamente aceitaria qualquer negativo acima de -100 como chuva.
4. **Teste** que assevere: dado um mês sintético com célula de NoData, o resultado para aquela
   célula é `indisponivel` e **não** 0,0; e que a contagem de meses válidos cai.

---

# PARTE IV — L4: O RECORTE JÁ ESTAVA ESCRITO E NUNCA FOI USADO

Conferi: `from rasterio.windows import from_bounds` está importado na **linha 27**, e
`BP3_BOUNDS = (-54.80, -25.70, -53.20, -24.00)` está definido na **linha 52**. Nenhum dos dois é
usado em lugar algum do script — o laço lê o arquivo global e chama `src.sample()` para seis
coordenadas.

Então a ferramenta de L2 já estava à mão. Isto é código morto que **aparenta** uma cautela que não
foi exercida, e quem ler o script de cima vai acreditar que o recorte acontece.

**O que fazer:** L2 passa a usar os dois. Se depois disso sobrar import ou constante sem uso,
remova — não deixe adorno.

E confira a coerência do envelope: `BP3_BOUNDS` traz `(-54,80, -25,70, -53,20, -24,00)`, enquanto
`src/config/areaInteresse.ts:55-58` traz `latMin -25,65 / latMax -24,00 / lonMin -54,65 /
lonMax -53,35`. **São envelopes diferentes.** Um deles está errado, ou o do script é uma folga
deliberada — e, se for folga, deve estar escrito que é. Resolva tomando `areaInteresse.ts` como
fonte, e relate qual venceu.

---

# PARTE V — A CONFERÊNCIA CRUZADA, QUE SÓ AGORA PASSA A SIGNIFICAR ALGO

Com a série completa, a tabela do Waltrick deixa de ser enfeite.

1. **Calcule também uma janela secundária de 1986 a 2008**, idêntica ao período do Waltrick, e
   compare a precipitação dela, estação por estação, com a climatologia da série completa.
2. **Isto não é o R operativo.** D13(b) manda usar a série completa, e é ela que alimenta o fator
   R. A janela 1986–2008 existe **só** para que a comparação com `rRefWaltrick` seja entre
   períodos iguais. Deixe isso explícito no artefato, para que ninguém troque uma pela outra
   depois.
3. **Não converta precipitação em erosividade para fazer a comparação.** Os coeficientes estão
   retirados por H1 e continuam retirados — veja a PARTE VI. Compare **precipitação com
   precipitação**, e diga que a comparação é indireta.

---

# PARTE VI — O QUE ISTO NÃO DESTRAVA, E A GUARDA QUE FALTOU

**O fator R continua `indisponivel`.** H1 e L1 são independentes: H1 é a ausência de fonte
arquivada para o par `107,52` e `46,89`; L1 é o período da série. Corrigir L1 melhora o insumo
de chuva e **não** restitui os coeficientes.

Digo isso porque a tentação é previsível: com uma climatologia de 45 anos bem feita na mão, fica
atraente "só terminar" o fator R. **Não.** Sem fonte primária arquivada que contenha o par, os
coeficientes não voltam, e R permanece `indisponivel` com causa nomeada.

E a guarda que faltou é o achado mais geral deste prompt: **nada no sistema compara um artefato
produzido contra o texto da decisão que o governa.** O script passou nos testes, emitiu diário,
declarou período e violou D13 em palavras — tudo ao mesmo tempo.

Peço uma versão modesta e verificável disso, não um verificador geral:

- **Um teste que falhe** se o artefato de climatologia declarar período que cubra menos de 20 anos
  ou menos de 240 meses válidos. É barato, é falsificável, e teria pegado este defeito no dia em
  que ele nasceu.

---

# PARTE VII — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `src/config/decisoes.ts` e `decisoes.test.ts` proibidos. **D13 não precisa de emenda:**
  a cláusula (b) já fixa a série completa, e a correção é de execução, não de decisão.
- **P12** — NoData não vira 0,0 nem qualquer outro número.
- **Não ressuscite** os coeficientes `107,52` e `46,89`.
- **Não reamostre** para 10 m. O suporte é 0,05° nativo, por D06.
- **Não use o GEE** para o CHIRPS. A via direta do UCSB está verificada e dispensa credencial.
- **Não guarde** os globais descompactados depois do recorte.
- **Não apague** o artefato de 2022 em silêncio: ele vira o caso de comparação da PARTE I. Marque
  como superado e preserve, conforme a orientação de legado já dada.
- **Não execute o sorteio.**

---

# PARTE VIII — RELATÓRIO

Gerado por `scripts/gerar_relatorio_fase.ts`. Na seção de juízo, nesta ordem:

1. **Período efetivamente baixado** — primeiro mês, último mês, total de meses, total de bytes, e
   o número de chamadas no diário.
2. **O desvio de 2022** em relação à média da série, por estação, em mm e em percentual — **com a
   conclusão explícita sobre se a minha suspeita de viés se confirmou ou não.**
3. **Disco antes e depois**, medido, e o pico durante a execução.
4. **Como o NoData passou a ser tratado**, quantos meses de NoData apareceram nos 540, e em que
   anos. Se nenhum apareceu, diga que nenhum apareceu — e **não** que a guarda foi exercitada.
5. **Qual envelope venceu** entre `BP3_BOUNDS` e `areaInteresse.ts`, e por quê.
6. **A comparação 1986–2008 contra `rRefWaltrick`**, estação por estação.
7. **Confirmação de que R segue `indisponivel`**, com a causa de H1 inalterada.

---

## Nota

Os quatro defeitos deste prompt estão no mesmo arquivo de 209 linhas, e nenhum deles é erro de
cálculo: o download é real, o diário é real, o período está declarado sem engano.

O que falhou foi **a correspondência entre o que a decisão manda e o que o artefato é** — e
falhou de um modo que nenhum teste verde detectava. É por isso que a PARTE VI pede a guarda, e não
só a correção.

E vale registrar o que não cabe no relatório mas é verdadeiro: L2, L3 e L4 só apareceram porque fui
verificar L1. Nenhum deles estava em nenhuma lista.
