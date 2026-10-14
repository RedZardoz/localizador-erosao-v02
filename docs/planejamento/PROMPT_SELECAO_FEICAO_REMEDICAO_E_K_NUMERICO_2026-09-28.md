# Prompt de Execução — Seleção de feição, remedição da correspondência e K numérico

**Data:** 28/09/2026
**Natureza:** continuação do fechamento da dívida do WFS. O trabalho anterior foi **aceito**; isto corrige um defeito que a verificação encontrou e aproveita um campo que ninguém havia notado.
**Três tarefas:** U1 corrige a seleção de feição; U2 remede a correspondência depois da correção; U3 implementa o fator K numérico conforme a **emenda de D14**, já registrada no commit `147a42e`.

---

# PARTE 0 — O QUE A VERIFICAÇÃO CONFIRMOU E O QUE ENCONTROU

## Confirmado, e não será refeito

Conferi por consulta própria ao GeoServer: o esquema de `bra_erodibilidade_2024_sirgas2000` tem **exatamente os 20 campos** que você relatou e `erod_c4` existe; e o ponto de associação em (−25,066904, −53,688038) confere **integralmente** — `sbcs=RRe12`, `tipo_unida=associacao`, ordens `[NEOSSOLO, CHERNOSSOLO, NITOSSOLO]` na carta do Paraná, `classe=Alta / codnum=4` na camada antiga, e `erod_c1..c4 = [Baixa, Alta, Muito alta, Alta]` com as quatro legendas encabeçadas por NITOSSOLO na de 2024.

A nova assinatura devolvendo `Proveniencia<1 | 2>` com `fora-do-dominio`, a exclusão em `select-candidates/route.ts:498`, o censo de descarte, o comportamento de não parear por posição quando as cartas divergem — tudo correto. 43 arquivos, 315 testes, `decisoes.ts` intocado, sorteio não executado.

**A medição que você entregou produziu o resultado científico mais importante desta etapa:** `0 de 3` associações correspondem. Associação é exatamente o caso para o qual D08 existe, de modo que a marcação de ambiguidade **continua governada pela heurística não conferida**. Você acertou em manter as duas marcas abertas.

## U1 — o defeito: a primeira feição vence e descarta solo válido

`src/lib/embrapa/embrapaSoilClient.ts:788` faz:

```ts
if (id.startsWith("parana_solos_") && !propsSoloPr) {
```

O `&& !propsSoloPr` toma a **primeira** feição da camada de solos e ignora as seguintes. Em **(−24,8800, −54,2600)** — o seu ponto `R13` — a camada devolve **duas**:

1. `sbcs = "agua"`, `tipo_unida = null`, `ordem_1 = null`
2. `sbcs = "NVef2"`, `tipo_unida = "simples"`, `ordem_1 = "NITOSSOLO"`

A primeira vence, o ponto recebe `foraDoDominioSolo = true` e é excluído — e o relatório concluiu que ali as cartas **divergem**. Elas **concordam** em NITOSSOLO quando se toma a feição de solo: a de 2024 devolve `cod_um2 = SG21NVef1`, `erod_c1 = Baixa`, legenda `D NITOSSOLO VERMELHO Eutroférrico`.

**A consequência é amostral, e é séria.** A margem oeste da bacia é o reservatório de Itaipu. Uma caixa de consulta de cerca de 110 m que encoste no polígono de água exclui o ponto ainda que haja unidade de solo mapeada na coordenada — o que pode remover sistematicamente a borda oeste inteira do quadro amostral, justamente onde os estratos precisam de cobertura.

## U2 — duas imprecisões de registro, e um padrão

| Campo | Você relatou | Medido |
|---|---|---|
| `cod_um2` (associação) | `SG22NVef2NV` | `SG22NVef7` |
| `cod_um2` (R13) | `SG21NVef1NV` | `SG21NVef1` |
| `cod_um2` (R01) | `SG22LVef1LV` | `SG22LVef1` |
| `erod_um` (associação) | `Baixa` | **`Média`** |
| `fator_k_um` (R01) | `0,0117 (+-0,0070)` | **`0.0020`** |
| Coordenada do ponto simples | (−24,7150, −53,7400) | o artefato diz **(−24,62, −53,71)** |

O sufixo de duas letras em `cod_um2` aparece nas **três** ocorrências — é sistemático, não lapso. O `fator_k_um` com incerteza **não existe em registro algum** que eu tenha amostrado. E a coordenada citada no texto não é a do artefato: o JSON cometido diz `R01_Toledo_Rural_Norte` em (−24,62, −53,71), e nessa coordenada os valores conferem. **O artefato estava honesto; o texto do relatório é que divergiu dele.**

Nada disso muda o código. Mas note o padrão: quando o número vem do artefato, confere; quando vem do texto, erra. É a razão de R1 existir — colar, não digitar.

---

# PARTE I — U1: PREFERIR A FEIÇÃO DE SOLO QUANDO HOUVER MAIS DE UMA

1. No laço de dispatch da linha 788, deixe de aceitar a primeira feição de `parana_solos_` e passe a **coletar todas** as feições dessa camada devolvidas na resposta.
2. Entre elas, **prefira a que tem solo mapeado** — aquela cujo `sbcs` não é categoria não-pedológica e cujo `ordem_1` não é nulo. Aplique o mesmo critério às feições de `bra_erodibilidade_2024_sirgas2000` e às da camada antiga.
3. **Registre quantas feições vieram e qual foi escolhida**, como metadado de qualidade que acompanha o ponto e entra no pacote de reprodutibilidade. Mais de uma feição significa que a coordenada está sobre **fronteira cartográfica**, e isso é informação sobre o ponto, não ruído.
4. **Só declare `foraDoDominioSolo = true` quando NENHUMA das feições tiver solo mapeado.** Hoje basta a primeira não ter.
5. Acrescente marcador de **ponto em fronteira**, verdadeiro quando houver mais de uma feição de solos na resposta. Ele é metadado de qualidade: **nunca entra na matriz de treino** por Invariante 2 — some-o a `CAMPOS_PROIBIDOS_MATRIZ_TREINO`.

**O que NÃO fazer:** não reduza a caixa de consulta para escapar do problema. Ela tem cerca de 110 m e amostra o pixel central de uma grade 3x3, o que está correto e é deliberado; encolhê-la trocaria um viés por outro, e a fronteira continuaria existindo.

**Teste exigido:** caso sintético com duas feições de solos, a primeira não-pedológica e a segunda com `ordem_1` preenchido, asseverando que a segunda é a escolhida, que `foraDoDominioSolo` é falso e que o marcador de fronteira é verdadeiro. E o caso real de (−24,8800, −54,2600) como teste de integração, se houver forma de fixá-lo sem depender de rede.

---

# PARTE II — U2: REMEDIR A CORRESPONDÊNCIA

Depois de U1, **a medição anterior está inválida** — pelo menos `R13` muda de classificação, e qualquer outro ponto sobre fronteira pode mudar.

1. Reexecute a campanha sobre as **mesmas 20 coordenadas**, para que a comparação antes/depois seja direta, e cometa os dois relatórios com sufixo de data nova, **sem sobrescrever** os de 28/09 — a diferença entre as duas medições é resultado.
2. Reporte: pontos com solo em ambas as cartas; correspondência estrita de sequência; correspondência apenas do componente dominante; divergência; e o recorte das associações. Os mesmos indicadores, para que sejam comparáveis.
3. **Diga explicitamente quais pontos mudaram de classificação por causa de U1**, e quantos deles eram de fronteira.
4. Se `R13` passar a corresponder, o denominador vira 20 e não 19. **Relate o antes e o depois**, sem substituir um pelo outro.

Esta remedição importa além da higiene: é ela que dirá se a carta de 2024 serve como fonte de K̂ nesta bacia, e a taxa de correspondência em **associações** é o que decide se a heurística não conferida continua governando D08.

---

# PARTE III — U3: FATOR K NUMÉRICO, CONFORME A EMENDA DE D14

**D14 foi emendada e está registrada no commit `147a42e`. Leia o `valor` da decisão no arquivo — ele é normativo e este prompt não o repete.** O que segue é apenas o roteiro de implementação.

## O que medi, e que fundamenta a emenda

Amostrei 15 coordenadas da bacia. O campo `k_solos` (`xsd:decimal`) devolveu **0,0020, 0,0084, 0,0120, 0,0225, 0,0285 e 0,0315**. São valores discretos, compatíveis com os 48 da Tabela 5, e — o ponto decisivo — **variam dentro de uma mesma classe ordinal**: `Muito baixa` apareceu como 0,0020 **e** como 0,0084; `Média` como 0,0225 **e** como 0,0285.

Logo `k_solos` não é representante de classe. Carrega mais informação que a classe ordinal, e duas unidades ambas classificadas como Muito baixa podem diferir por um fator de quatro em K — informação que a conversão por faixa da D14 original apagava.

## Implementação

1. Ler `k_solos` da feição de `bra_erodibilidade_2024_sirgas2000` e usá-lo como fator K, com proveniência **`tabelado`**: `tabela` = Tabela 5 do Documentos 246 acessada pela camada oficial, `chave` = `cod_um` ou `ogc_fid` da feição.
2. **Fallback** quando `k_solos` estiver ausente: a conversão por faixa de classe da D14 original permanece, com proveniência **distinta**, declarada como derivada de classe. O registro de cada ponto deve dizer **qual das duas vias operou**.
3. Ligar ao `fatorK` de `montarLinhaDeBaseRUSLE`. Hoje ele depende de `erodibilidadeProveniencia` ser informada; passe a alimentá-lo desta fonte.

## A proibição que é o coração desta tarefa

Para `Área urbana` e `Corpo d'água`, a camada devolve **`k_solos = 0`**.

Zero é um número válido que **não é um valor de K**. Levado à RUSLE, produz `A = R * 0 * LS * C * P = 0` — isto é, **"sem erosão" em lugar de "fora do domínio"** — e atravessa silenciosamente qualquer validação que apenas verifique se o número é finito. O efeito é pior que um valor errado: faz uma represa ou uma cidade aparecer como terreno sem perda de solo, resultado plausível que não dispara alarme algum.

Portanto:

- **É vedado ler `k_solos` numericamente sem antes verificar `erod_um`.** Categoria não-pedológica obriga `indisponivel` com causa `fora-do-dominio`.
- **É vedado interpretar `fator_k_um` como número.** É `xsd:string` que carrega ora o valor, ora o nome da categoria — foi exatamente aí que o relatório anterior leu uma incerteza que não existe. O número vem de `k_solos`; o domínio vem de `erod_um`.
- **Teste obrigatório:** `k_solos = 0` com `erod_um = "Área urbana"` devolve `indisponivel / fora-do-dominio`, e `perdaSolo` permanece retida pelo Invariante 1. Asseverar que **não** devolve K = 0.

## Não recuse `k_solos` por causa de D08

Se você reencontrar a vedação de D08 contra ponderar K pela área dos componentes e concluir que `k_solos` é proibido, **é erro de categoria, e a emenda o trata explicitamente**: D08 proíbe **nós** misturarmos valores e apresentarmos o resultado como K da célula, porque aí o número não existe em fonte alguma. `k_solos` é a ponderação calculada e **publicada** pela autoridade cartográfica por método documentado — é leitura de fonte, não fabricação. A distinção é de proveniência, não de aritmética.

## Limitação a declarar

Nos 15 registros amostrados, **nenhum** trouxe incerteza associada ao K, e a forma `valor (+-erro)` não aparece na camada. Enquanto a incerteza não for lida na Tabela 5 do próprio Documentos 246, o fator K entra como **valor pontual sem incerteza declarada**, e isso deve constar no selo de proveniência — porque D25 compara os competidores contra a linha de base RUSLE, e a incerteza de K integra o orçamento de erro dessa linha.

---

# PARTE IV — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `src/config/decisoes.ts` e `src/config/decisoes.test.ts` proibidos. A emenda de D14 **já está feita**; leia-a e implemente, não a edite. Se discordar dela, relate.
- **P12** — não converter `indisponivel` em valor. `k_solos = 0` é o caso exemplar.
- **Não execute o sorteio.** Segue travado à espera de candidatos reais, e agora também da remedição de U2.
- **Não reduza a caixa de consulta** para contornar U1.
- **Não sobrescreva** os relatórios de correspondência de 28/09.

---

# PARTE V — RELATÓRIO

Vale a disciplina **R1 a R6**, que funcionou. Em especial: **cole do artefato, não do texto** — foi a única fonte de erro do relatório anterior.

1. Como ficou a seleção de feição, e o resultado do teste sintético e do caso de (−24,8800, −54,2600).
2. Quantos dos 20 pontos são de fronteira, isto é, devolvem mais de uma feição de solos.
3. A remedição completa de U2, com o **antes e o depois** lado a lado, e quais pontos mudaram por U1.
4. A taxa de correspondência em **associações** depois da correção — o número que decide o estado da dívida de D08.
5. Como `k_solos` foi ligado ao `fatorK`, e a saída do teste de `k_solos = 0` com categoria não-solo.
6. Em quantos dos pontos a via `tabelado` operou e em quantos operou o fallback por faixa.
7. O que mudou no selo de proveniência, e o que continua marcado.
8. Confirmação da passagem de autoconferência de R5 e o que ela pegou.

Assine com a sua identidade. `author` é Luís Alfredo Ferreira da Silva (`RedZardoz`). Atualize `docs/PROVENIENCIA_ASSISTENCIA_IA.md`, que o seu próprio teste de caminhos vai conferir.

---

## Nota

O campo `k_solos` esteve disponível desde o início e ninguém o viu — nem eu, ao escrever o prompt anterior, que pedia a camada e não olhou o esquema inteiro. Apareceu porque a verificação foi além de confrontar o que você afirmou e listou os 20 campos por conta própria. Vale como argumento a favor do método: conferir não é só procurar erro no relatório alheio, é olhar a fonte com atenção suficiente para encontrar o que o relatório não menciona.
