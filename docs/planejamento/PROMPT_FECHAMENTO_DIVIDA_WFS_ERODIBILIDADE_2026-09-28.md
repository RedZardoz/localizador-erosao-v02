# Prompt de Execução — Fechamento da dívida do WFS de erodibilidade

**Data:** 28/09/2026
**Objetivo:** fechar as duas dívidas declaradas `NÃO CONFERIDO` em `src/lib/embrapa/embrapaSoilClient.ts:267-273` e propagadas ao selo em `src/lib/export/pacoteReprodutibilidade.ts:552`.
**Precede:** a FASE A do prompt consolidado, por decisão do pesquisador.

**Aviso sobre o achado principal:** consultei o GeoServer da Embrapa antes de escrever isto, e a dívida **não é apenas de conferência** — há um defeito de implementação por trás dela. Leia a PARTE 0 inteira antes de planejar, porque ela muda o que a tarefa é.

---

# PARTE 0 — O QUE EU MEDI, E QUE VOCÊ NÃO PRECISA REDESCOBRIR

Tudo abaixo foi obtido por requisição real ao endpoint `https://geoinfo.dados.embrapa.br/geoserver/ows` em 28/09/2026. Trate como `conferido`; reconfirme o que for barato e relate divergência.

## F1 — `erod_c1..erod_c4` NÃO existem na camada de solos do Paraná

A tabela de atributos de `geonode:parana_solos_20201105` tem 38 campos, e **nenhum** começa por `erod`:

```
area_km2, familia_11, familia_12, familia_13, familia_14, familia_1_, familia_21,
familia_23, familia_24, familia_26, familia_2_, familia_31, familia_33, familia_34,
familia_36, familia_3_, fase_rel_1, fase_rel_2, fase_relev, fase_veg_1, fase_veg_2,
fase_veget, grande_g_1, grande_g_2, grande_gru, legenda, objectid, ogc_fid,
ordem_1, ordem_2, ordem_3, sbcs, sub_grup_1, sub_grupo1, sub_grupo_,
sub_orde_1, sub_ordem1, sub_ordem_, tipo_unida
```

**Consequência, e é o defeito:** `embrapaSoilClient.ts:385` faz `texto(props["erod_c1"])` sobre as propriedades da feição de **solos**, onde o campo não existe. Logo `erodAtributoExplicito` **nunca** é passado, e `classificarNivelEstratoKComponente` cai **sempre** na heurística taxonômica. O ramo das linhas 279-286, que leria a classe oficial, é **código morto**.

Isto não é dívida de conferência. É o caminho oficial nunca ter sido exercitado.

## F2 — A camada de 2024 existe, e é exatamente a que serve

`DescribeFeatureType` de `geonode:bra_erodibilidade_2024_sirgas2000` responde com sucesso. Campos confirmados:

```
ogc_fid, cd_fcim, nom_unidad, cod_um, cod_um2, legenda,
legenda_c1, legenda_c2, legenda_c3, legenda_c4, erod_c1, erod_c2, erod_c3, [...]
```

**É aqui que `erod_c1..erod_c4` vivem** — e, decisivo para D08, ela traz também `legenda_c1..legenda_c4`, isto é, **erodibilidade por componente da unidade de mapeamento**. É precisamente o dado que a marcação de ambiguidade exige e que a heurística tenta adivinhar.

Confirmei até `erod_c3`; a lista que extraí foi truncada. **Confirme o conjunto exato de campos** por `DescribeFeatureType` e relate se `erod_c4` existe.

## F3 — A camada hoje consultada é outra, e é de classe única

O cliente ativo consulta `geonode:brasil_erodibilidade_solo` (constante `LAYER_ERODIBILIDADE_BR`, linha 47), junto com a de solos, numa só requisição `GetFeatureInfo` (linha 198). Ela **funciona**, mas devolve apenas quatro campos — `ogc_fid, codnum, classe, area_km2` — com **uma** classe textual por polígono. Exemplos reais que obtive:

| Coordenada | `parana_solos` | `brasil_erodibilidade_solo` |
|---|---|---|
| Toledo rural (−24,6200, −53,7100) | `LVef1 - LATOSSOLO VERMELHO Eutroferrico`, `tipo_unida = simples` | `classe = "Muito baixa"`, `codnum = 1` |
| Santa Helena (−24,8531, −54,3622) | idem `LVef1`, `simples` | `classe = "Baixa"`, `codnum = 2` |
| Palotina (−24,2860, −53,8400) | `Area Urbana`, `tipo_unida = null` | `classe = "Area urbana"`, `codnum = 0` |

**Por que ela não fecha a dívida sozinha:** classe única por ponto **não** resolve a pergunta de D08, que é comparar o componente dominante com os subordinados. Para o nível de K̂ no ponto ela serve; para a ambiguidade, não.

## F4 — O vocabulário da classe inclui categorias que não são solo

Os valores observados incluem `"Area urbana"` e `"Corpos dagua"`, ao lado das seis classes do Documentos 246. Guarde isto: são valores que **não têm nível de K** e não podem ser tratados como se tivessem.

## F5 — O comentário que documenta a dívida erra duas atribuições

Em `embrapaSoilClient.ts:267-273` está escrito que os atributos `erod_c1..erod_c4` pertencem a `bra_erodibilidade_2024_sirgas2000` — **certo**, e é justamente por isso que lê-los da feição de solos não funciona — mas também que *"o cliente WFS ativo usa `geonode:brasil_solos_5m_20201104`"*. **Ele usa `geonode:brasil_erodibilidade_solo`.** Corrija.

---

# PARTE I — T1: ACRESCENTAR A CAMADA DE 2024 À REQUISIÇÃO EXISTENTE

Não construa cliente novo. `buildGetFeatureInfoUrl` (linha 198) já consulta **duas** camadas numa requisição só, por `layers` e `query_layers` separados por vírgula. Acrescente a terceira.

1. Declare `LAYER_ERODIBILIDADE_2024 = "geonode:bra_erodibilidade_2024_sirgas2000"` junto às constantes das linhas 44-47.
2. Inclua-a em `layers` e `query_layers`. Mantenha `info_format: application/json`, a bbox mínima e a grade 3x3 do pixel central — não altere a geometria de consulta, que já está correta.
3. Eleve `feature_count` se necessário para que três camadas caibam na resposta, e **relate o valor adotado**.
4. No laço de dispatch da linha 506, acrescente o ramo `id.startsWith("bra_erodibilidade_2024")`.
5. **Mantenha `brasil_erodibilidade_solo`.** Ela não é redundante: é o corroborante independente de classe no ponto. Divergência entre as duas é informação, não problema a esconder.

Se a camada de 2024 estiver indisponível em rede, **registre a requisição exata e a resposta ou o erro** em `docs/verificacoes/fontes/wfs_erodibilidade/`, mantenha a dívida aberta com a tentativa documentada, e **não** apague as marcas de não conferido. Tentativa documentada é resultado; silêncio não é.

---

# PARTE II — T2: ALIMENTAR `erod_cN` DA FEIÇÃO CERTA, COM VERIFICAÇÃO DE CORRESPONDÊNCIA

## O que fazer

Em `parseSoilFeature`, `erod_c1` deixa de ser lido de `props` da feição de solos e passa a vir das propriedades da feição de **2024**. A comparação de D08 permanece idêntica em forma: nível do dominante contra nível de cada subordinado, marcando quando atravessarem a fronteira de D09.

A proveniência da classe muda de inferida para **`tabelado`**, com `tabela` sendo a camada e `chave` sendo o `ogc_fid` ou `cod_um` da feição. Isso é ganho real: sai de regra operacional para leitura de fonte oficial derivada do próprio Documentos 246 que D09 cita.

## O risco que você precisa tratar, e não presumir resolvido

As duas camadas são **levantamentos diferentes**: a de solos é estadual do Paraná; a de 2024 é nacional. As unidades de mapeamento **não são necessariamente as mesmas**, e nada garante que o `erod_c2` da unidade nacional corresponda ao `ordem_2` da unidade paranaense. Atribuir a classe do componente *n* de uma carta ao componente *n* da outra, por posição, é suposição — e é exatamente o tipo de suposição que este projeto passou a proibir.

**Por isso a camada de 2024 traz `legenda_c1..legenda_c4`.** Use-as:

1. Compare a sequência de componentes declarada em `legenda_c1..legenda_c4` com a de `ordem_1..ordem_3` da carta do Paraná, por ordem taxonômica normalizada.
2. **Se corresponderem**, atribua `erod_cN` ao componente *n* e marque a proveniência como `tabelado`.
3. **Se NÃO corresponderem**, não force o pareamento por posição. Marque `kAmbiguoAssociacao = true` de forma conservadora, registre marcador próprio de **divergência entre cartas**, e declare a classe como não atribuível por correspondência. Divergência entre levantamentos é achado a reportar, não ruído a normalizar.
4. Registre, no pacote de reprodutibilidade, **com que frequência** houve correspondência e com que frequência houve divergência, sobre os pontos efetivamente consultados. Essa frequência é o que dirá se a carta de 2024 é utilizável como fonte de K̂ nesta bacia, e é resultado de interesse por si.

## A heurística taxonômica não se apaga

Ela desce a **fallback declarado**, para o caso de a camada de 2024 não cobrir o ponto ou não trazer classe. Quando ela operar, a proveniência é a de regra operacional **não conferida**, como está hoje. Quando a camada operar, é `tabelado`. **O registro precisa dizer qual dos dois valeu em cada ponto** — sem isso não se sabe depois o que foi lido e o que foi inferido.

Os 22 testes de `embrapaSoilClient.test.ts` devem continuar passando. Se algum depender de a heurística ser o caminho ativo, ajuste-o para exercitar o fallback explicitamente, dizendo no nome do teste que é fallback.

---

# PARTE III — T3: CLASSES QUE NÃO SÃO SOLO NÃO PODEM VIRAR NÍVEL DE K

`"Area urbana"` e `"Corpos dagua"` aparecem como valor de `classe`, e valores análogos podem aparecer em `erod_cN`.

Hoje, `classificarNivelEstratoKComponente` normaliza a string e, se não casar com nenhuma das seis classes, **cai na heurística** — que devolve `1` ou `2` sempre, porque o tipo de retorno é `1 | 2`. Ou seja: uma área urbana pode receber nível de erodibilidade por via indireta.

**O que fazer:**

1. Reconhecer explicitamente os valores que não são solo e tratá-los como **fora do domínio**, nunca como nível.
2. Como o retorno é `1 | 2` e não admite ausência, isto exige mudança de assinatura — devolver `1 | 2 | null`, ou `Proveniencia<1 | 2>` com `estado: "indisponivel"` e causa `fora-do-dominio`, que é o padrão do projeto e o que eu recomendo. Propague ao chamador.
3. Ponto cuja classe não é solo **não entra no quadro amostral**. Isso reforça, por outra via, a exclusão que D07 já faz pelo WorldCover — e os dois filtros devem concordar. **Relate qualquer ponto em que discordem**: classe `"Area urbana"` com WorldCover em `[30, 40]`, ou o inverso, é discordância entre fontes oficiais e merece registro.

Este item é P12 aplicado: não converter `indisponivel` em valor.

---

# PARTE IV — T4: CORRIGIR O COMENTÁRIO E FECHAR NO SELO SÓ O QUE FECHOU

1. Em `embrapaSoilClient.ts:267-273`, corrija a atribuição errada de F5 (`brasil_solos_5m_20201104` → `brasil_erodibilidade_solo`) e registre o achado F1: os campos `erod_cN` não existem na carta de solos, e por isso o ramo oficial nunca era exercitado.
2. Em `pacoteReprodutibilidade.ts:552`, `statusConferenciaCamadaWfs2024` deixa de ser `nao_conferido` **somente na parte que foi de fato consultada**. Seja específico, e não global: a consulta em rede à camada de 2024 fecha; a correspondência de componentes entre cartas fecha ou não conforme a medição de T2.4.
3. **O que permanece aberto** — e deve continuar marcado, no regime de D13 e D15:
   - o enquadramento por ordem/subordem das classes cuja distribuição na Figura 1 abrange múltiplas faixas (`NITOSSOLO`, `ORGANOSSOLO`, `ARGISSOLO`, `CAMBISSOLO`, `GLEISSOLO` não-sálico, `PLINTOSSOLO` não-pétrico, `NEOSSOLO LITOLICO`/`FLUVICO`), **sempre que a heurística de fallback for quem operar**;
   - qualquer ponto em que as duas cartas divergirem na composição da unidade.

Se a camada de 2024 cobrir a bacia com correspondência alta, a heurística deixa de operar na prática e essa dívida fica inerte — mas **inerte não é fechada**, e a marca continua até que se demonstre que o fallback não é acionado em ponto algum do quadro amostral.

---

# PARTE V — O QUE NÃO FAZER

Valem P1 a P12. Em especial:

- **P8** — `src/config/decisoes.ts` e `src/config/decisoes.test.ts` seguem proibidos. **Não é necessária emenda de decisão para este trabalho**: D09 já cita o Documentos 246 como fonte das classes, e D08 já manda marcar quando os componentes atravessam a fronteira — ler a classe oficial em lugar de inferi-la é cumprir as duas decisões melhor, não alterá-las. A confiança `media` da associação também permanece, porque a carta continua não dizendo **qual** componente ocorre na coordenada. Se você concluir que alguma decisão precisa de emenda, **relate e não edite**.
- **Não remova** `brasil_erodibilidade_solo` nem a heurística. A primeira é corroborante independente; a segunda é fallback necessário.
- **Não pareie componentes por posição** sem a verificação de correspondência de T2.
- **Não execute o sorteio.** Ele segue travado à espera de candidatos reais.

---

# PARTE VI — RELATÓRIO

Vale a disciplina **R1 a R6** do prompt anterior, que funcionou. Em especial R2 — script cometido junto da saída bruta — e R3, os três rótulos com o silêncio contando como `não conferido`.

1. Conjunto exato de campos de `bra_erodibilidade_2024_sirgas2000` por `DescribeFeatureType`, com a resposta bruta cometida, e se `erod_c4` existe.
2. A requisição `GetFeatureInfo` com as três camadas, e uma resposta real completa cometida, sobre coordenada **rural** da bacia — não urbana, que é o que as minhas duas primeiras tentativas pegaram.
3. **A medição de correspondência de T2.4**: sobre quantos pontos, quantos corresponderam, quantos divergiram. É o número que decide se a carta de 2024 serve nesta bacia.
4. Que valor de `feature_count` foi adotado e por quê.
5. Como ficou a assinatura de `classificarNivelEstratoKComponente` e o que foi propagado ao chamador.
6. Quais pontos, se algum, tiveram discordância entre a classe não-solo e o WorldCover de D07.
7. O que exatamente saiu de `nao_conferido` no selo, e o que **continua** marcado, com a razão.
8. Confirmação da passagem de autoconferência de R5 e o que ela pegou.

Assine com a sua identidade. `author` é Luís Alfredo Ferreira da Silva (`RedZardoz`). Atualize `docs/PROVENIENCIA_ASSISTENCIA_IA.md` — e o teste de caminhos que você criou vai conferi-la.

---

## Nota sobre por que esta dívida valia o desvio

O pesquisador escolheu fechar isto antes da FASE A, e a reconhecimento confirmou que a escolha estava certa por uma razão que não estava visível quando a dívida foi registrada: a **Bacia do Paraná 3 é dominada por Latossolos e Nitossolos** — as duas primeiras consultas rurais que fiz devolveram `LATOSSOLO VERMELHO Eutroferrico` — e o `NITOSSOLO` está justamente na lista de ordens cujo enquadramento **não** foi conferido. A dívida não era periférica: ela recaía sobre uma das ordens dominantes da área de estudo, e portanto sobre a dimensão K̂ que estratifica o sorteio dos 36 polígonos.

Fechá-la agora, com a carta oficial alimentando a classe em lugar da heurística, muda a proveniência de K̂ de regra operacional inferida para leitura tabelada — antes de o sorteio acontecer, que é a única hora em que isso ainda pode ser feito sem descartar `pi_i` registrado.
