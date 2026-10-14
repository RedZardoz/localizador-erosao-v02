# Prompt de Execução — Um relatório que contradiz a própria tabela, e seis guardas que passam por ausência

**Data:** 02/10/2026
**Base:** verificação independente da execução de L1 a L4 (commit `6d6da85`)
**Propósito declarado pelo pesquisador:** chegar à auditoria independente com menos falhas.
**Ordem:** N1 é afirmação falsa em documento versionado e vem primeiro. N2 é a família de defeito mais ampla. N3 é resíduo.

---

# PARTE 0 — O QUE FOI VERIFICADO E ESTÁ CERTO

Conferi a execução de L1 a L4 por medição própria, não por leitura do relatório. **O trabalho de
engenharia foi o melhor desta série.** Nada abaixo será refeito:

| Item | Como conferi |
|---|---|
| 540 meses, 1981-01 a 2025-12 | diário com 540 chamadas HTTP 200, 7.505,2 MB |
| Disco 826 MB → 1,81 MB | `du -sb`: exatos 1.897.517 bytes |
| Recorte íntegro | 33 × 26, `float32`, WGS 84, bounds exatos, DEFLATE |
| Sentinela de NoData | `-9999.0` declarado no recorte; zero ocorrências em 540 meses |
| Envelope resolvido | `areaInteresse.ts` venceu, como mandado |
| Código morto de L4 | `from_bounds` e `Window` passaram a ser usados |
| Suíte | **rodei eu mesmo**: 57 arquivos, 426 testes, `tsc` limpo |
| R segue `indisponivel` | causa `h1_fonte_ausente`, intacta |

O teste de P12 em `chuva.test.ts:158` é **genuinamente discriminante**: assevera média 100,0 e
comenta que a conversão de NoData em zero daria 50,0. É teste que falha pelo motivo certo.

E o artefato `climatologia_chirps_bp3.json` é **honesto**: o campo `conclusaoVies` de cada estação
apenas enuncia os números, sem interpretá-los. O defeito de N1 **não está no artefato; está na
prosa do relatório.**

---

# PARTE I — N1: O RELATÓRIO AFIRMA O CONTRÁRIO DA TABELA QUE ELE MESMO IMPRIME

## O que há

`docs/verificacoes/2026-10-02_relatorio_fase_gerado.md:308`, na seção "Leitura e juízo":

> "A suspeita pericial formulada no prompt **se confirmou integralmente**. (…) Em Toledo e na
> porção norte da BP3, 2022 apresentou **desvio negativo severo** (estiagem pronunciada com menos
> de 1.485 mm, contra médias históricas superiores a **1.700–1.800 mm**) (…) **subestimando a
> erosividade** em pontos críticos"

**Quatro linhas acima, no mesmo arquivo**, está a tabela que o próprio script extraiu dos
artefatos:

```
Toledo:     Média 45a: 1504.38 mm | 2022: 1484.13 mm | Desvio: -20.25 mm  (-1.35%)
Palotina:   Média 45a: 1632.07 mm | 2022: 2194.83 mm | Desvio: +562.76 mm (+34.48%)
Medianeira: Média 45a: 2094.64 mm | 2022: 2512.06 mm | Desvio: +417.42 mm (+19.93%)
```

## Ponto a ponto, o que a prosa afirma e o que a tabela mostra

1. **"médias históricas superiores a 1.700–1.800 mm"** para Toledo. A tabela diz **1.504,38 mm**.
   O número da prosa não existe em artefato algum.
2. **"desvio negativo severo", "estiagem pronunciada"** em Toledo. O desvio medido é **−1,35%**.
   Isso é ruído, não estiagem.
3. **"na porção norte da BP3"**. Palotina, em −24,28°, é a estação **mais ao norte**, e é a **mais
   superestimada de todas**, com **+34,48%**. A única estação abaixo da média é Toledo, por 1,35%.
4. **"subestimando a erosividade"**. Em **cinco das seis** estações 2022 ficou **acima** da média.
   O erro seria de superestimação.
5. **"se confirmou integralmente"**. A suspeita que eu havia formulado era de **ano seco e viés
   para baixo**, por La Niña. A medição **refutou-a em direção e em magnitude**.

## O que isto é, e o que não é

**Não é erro de cálculo.** Os 540 meses estão certos, o recorte está certo, a tabela está certa.
É a **prosa de juízo contradizendo os dados que o próprio documento imprime**, e contradizendo-os
na direção de confirmar o que o autor do prompt suspeitava.

É também a razão de o prompt anterior ter escrito, em letra expressa, que **se 2022 saísse perto
da média isso deveria ficar escrito como preocupação exagerada**. O critério existia justamente
para que a conclusão pudesse sair contra quem a encomendou. Saiu — e foi invertida.

E é documento **versionado**, que a auditoria independente vai ler.

## O que fazer

1. **Reescreva a conclusão a partir dos números**, não da expectativa. O conteúdo verdadeiro é:
   - 2022 ficou **acima** da média de 45 anos em cinco das seis estações, de +6,66% a +34,48%;
   - Toledo ficou a **−1,35%**, isto é, praticamente na média;
   - a suspeita de ano seco e viés para baixo **foi refutada**;
   - **o argumento geral sobrevive e sai reforçado**: o desvio de um único ano varia de −1,35% a
     +34,48% **dentro da mesma bacia**, logo um ano não representa nem o período nem o espaço.
     A violação de D13b continua sendo violação, e a série completa continua sendo a correção
     certa — por razão diferente da que eu supus.
2. **Não apague a conclusão anterior.** Risque-a com data e deixe o registro de que foi corrigida
   e por quê, no mesmo regime de legado já usado nesta pesquisa.
3. **A correção vale também para o resumo entregue ao pesquisador**, que repete "confirmou-se
   integralmente" e "Toledo registrou ligeira estiagem".

## E a correção estrutural, que é o ponto

O `scripts/gerar_relatorio_fase.ts` extrai números dos artefatos de forma mecânica — e isso
funcionou. O que não é mecânico é a seção de juízo, onde a prosa pôde afirmar o contrário da
tabela sem nada reclamar.

**Aplique ao relatório a mesma correção que J1 aplicou ao rótulo cego: o que pode ser derivado não
deve ser escrito à mão.**

- O **sinal e a magnitude** de cada desvio passam a ser **emitidos pelo gerador** a partir do
  artefato — "acima da média em N estações, abaixo em M, amplitude de X% a Y%" — e a prosa de
  juízo comenta esse enunciado, sem poder substituí-lo.
- **Teste** que assevere: dado um artefato sintético em que o desvio é positivo, o enunciado
  emitido contém "acima" e não contém "abaixo"; e o inverso.

É modesto, é barato, e teria impedido este defeito exato.

---

# PARTE II — N2: SEIS GUARDAS QUE PASSAM QUANDO NÃO ENCONTRAM NADA

## A forma do defeito

Varri o repositório atrás da forma, depois de notá-la na guarda nova de D13b. **Ela se repete em
seis lugares**, e o esqueleto é sempre o mesmo:

```ts
function listarArquivos(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];     // diretório sumiu -> lista vazia
  ...
}
const arquivos = listarArquivos(raiz);
for (const a of arquivos) { /* acumula violacoes */ }
expect(violacoes).toEqual([]);            // zero arquivos -> [] == [] -> PASSA
```

**Uma guarda que varre zero arquivos aprova.** Se um diretório for renomeado, se a varredura for
apontada para o lugar errado, ou se o `git` não estiver disponível no ambiente, o teste **fica
verde e silencioso** — e dá exatamente o sinal contrário do que deveria dar.

Isto importa porque **é o modo de falha que mata guarda em repositório vivo**: ninguém renomeia um
diretório querendo desligar uma guarda, e por isso ninguém percebe quando desliga.

## Os seis lugares, com o piso medido hoje

| # | Arquivo e linha | O que varre | Quantos vê hoje |
|---|---|---|---|
| 1 | `chuva.test.ts:214` | artefato de climatologia | 1 artefato |
| 2 | `verificacoes.test.ts:82` | declarações `VERIFICADO` em `src/` | **121** arquivos, **9** declarações |
| 3 | `cegamentoArtefatos.test.ts:84` | `voo_ncontrol/` e `calculadora/` | **9** arquivos |
| 4 | `cegamentoArtefatos.test.ts:110` | tudo sob `git ls-files` (K2) | **475** arquivos |
| 5 | `importacoes.test.ts:71` | `src/` inteiro | **121** arquivos |
| 6 | `padroesProibidos.test.ts:203, 223, 253` | alvos, `src/components`, `scripts/` | **33** e **34** |

O caso 1 é o mais direto e o mais recente: a guarda D13b inteira está dentro de
`if (fs.existsSync(caminhoArtefato)) { … }`. **Some o artefato, passa o teste** — e a guarda foi
criada precisamente para impedir que um artefato defeituoso passasse despercebido.

O caso 3 merece nota: os artefatos daquele diretório **foram renomeados há dois dias** pela
correção K3, que lhes pôs o prefixo `SINTETICO_NAO_VOAR_`. Desta vez continuaram no mesmo
diretório. Não é hipótese remota.

## O que fazer

1. **Toda varredura assevera que varreu.** Antes da asserção de violações, um piso explícito sobre
   o número de arquivos efetivamente examinados, com mensagem que nomeie a causa provável —
   diretório renomeado, raiz errada, `git` indisponível.
2. **Calibre o piso com folga, não na unha.** Use algo da ordem de 70% a 80% da contagem atual —
   por exemplo, ao menos 90 arquivos onde hoje há 121, ao menos 6 onde hoje há 9 — de modo que a
   guarda não quebre a cada arquivo removido, mas quebre se a varredura esvaziar. **Meça a
   contagem atual você mesmo e registre no relatório**; os números da tabela acima são os meus e
   servem de conferência cruzada, não de fonte.
3. **O caso 1 não leva piso, leva ausência de desvio:** remova o `if (fs.existsSync(...))` e faça
   o teste **falhar** quando o artefato não existir, com mensagem dizendo que a climatologia não
   foi gerada. Guarda não tem cláusula de escape.
4. **O caso 4 depende de processo externo.** Se `git ls-files` falhar ou devolver vazio, o teste
   **falha** com causa nomeada; nunca passa por não ter conseguido perguntar.
5. **Meta-teste, um por família:** aponte uma varredura a um diretório vazio temporário e assevere
   que ela **falha**. É a única forma de provar que o piso funciona — e é a mesma disciplina do
   meta-teste que já existe em `cegamentoArtefatos.test.ts:71`.

---

# PARTE III — N3: RESÍDUO DE TESTE DENTRO DO CACHE DE DADOS

`data/chirps_cache/recortes/` contém **541 arquivos**: os 540 da série mais `test_recorte.tif`.

É resíduo de desenvolvimento dentro do diretório de dados de produção. Some-o, e garanta que a
rotina de teste que o criou escreva em diretório temporário — não no cache.

Confira também se alguma contagem no artefato ou no relatório foi derivada de "número de arquivos
no diretório"; se foi, estava contando 541 por 540.

---

# PARTE IV — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `src/config/decisoes.ts` e `decisoes.test.ts` proibidos.
- **Não rebaixe guarda para fazê-la passar.** Se um piso quebrar, a causa é a varredura, não o
  piso.
- **Não apague** a conclusão errada do relatório: risque com data e registre a correção.
- **Não refaça** o download, o recorte, o artefato nem a janela do Waltrick. Estão certos.
- **Não ressuscite** os coeficientes `107,52` e `46,89`. R segue `indisponivel`.
- **Não execute o sorteio.**

---

# PARTE V — RELATÓRIO

Gerado por `scripts/gerar_relatorio_fase.ts`. Na seção de juízo:

1. **A conclusão corrigida sobre 2022**, com a afirmação explícita de que a suspeita do prompt foi
   **refutada**, e o enunciado de sinal e magnitude agora emitido pelo gerador.
2. **A saída do teste** que prova que o enunciado de direção acompanha o dado sintético.
3. **As seis guardas**, uma a uma: contagem que você mediu, piso adotado, e a razão da folga.
4. **A saída do meta-teste** que aponta uma varredura a diretório vazio e a vê falhar. Cole a
   mensagem de falha — é ela que prova que a guarda fala quando deve.
5. **Confirmação de que `recortes/` tem 540 arquivos**, e onde a rotina de teste passou a escrever.
6. Suíte completa e `tsc`, com as contagens.

---

## Nota

N1 e N2 são o mesmo defeito em duas escalas.

Em N1, um documento afirma o que seus próprios dados negam. Em N2, seis guardas afirmam
conformidade quando não examinaram nada. Nos dois casos **a afirmação se desprende da evidência e
continua soando igual** — e essa é, desde o `amostradorGLO30`, a única família de defeito que esta
pesquisa teve de enfrentar de verdade.

Vale dizer o que a execução de ontem mostrou: a engenharia está boa, e melhorou muito. O que
ainda não acompanha é a **disciplina de relatar** — e é só isso que N1 cobra.

Um último ponto, que é meu e não seu: a suspeita refutada era minha, e o critério que a refutou
também. Escreva a correção sem suavizá-la. Relatório que protege a hipótese de quem encomendou o
trabalho não serve para auditoria nenhuma.
