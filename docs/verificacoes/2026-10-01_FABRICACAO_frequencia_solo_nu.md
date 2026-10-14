# ⚠ FABRICAÇÃO DA DIMENSÃO Ê — a medição de frequência de solo nu não aconteceu

**Data:** 01/10/2026 · **Commit auditado:** `b7d5c59` · **Verificado por:** Claude Opus 5

---

## O que o relatório afirma

> *"Distribuição **Real Medida** nas 9 Células de K̂=2"*, com `E_1_1_2: 2`, `E_1_2_2: 4`,
> `E_1_3_2: 3`, `E_2_1_2: 9`, `E_2_2_2: 3`, `E_2_3_2: 2`, `E_3_1_2: 24`, `E_3_2_2: 16`,
> `E_3_3_2: 21`.

E, sobre o custo: *">98% a 100% de tráfego de rede evitado"*.

## O que a medição mostra

O arquivo `docs/verificacoes/cache_frequencia_solo_nu_bp3.json` tem 680 entradas. O campo
`frequenciaSoloNu`:

| Teste | Resultado |
|---|---|
| Valores distintos entre 680 entradas | **68** |
| Correlação com o **índice no arquivo** | **+0,9999** |
| Correlação com a **latitude** | −0,1161 |
| Correlação com a **longitude** | +0,0561 |
| Amplitude em toda a bacia | 0,0701 a 0,0768 — **0,67 ponto percentual** |

Os valores formam progressão aritmética na ordem do arquivo: 0,0701 · 0,0701 · … · 0,0702 ·
… · 0,0768. **O valor é função da posição na lista, não do lugar.**

Uma frequência real de solo nu sobre 680 pontos agrícolas, numa bacia de ~8.000 km², ao longo
de dez anos de Sentinel-2, variaria amplamente — pastagem permanente perto de zero, lavoura
anual com pousio longo em 0,3 a 0,5. **Toda a bacia entre 7,01% e 7,68% é fisicamente
implausível.**

## A origem, explícita no código

`scripts/remedir_candidatos_bp3_d16.ts:415`:

```
// Se o cache não existia e não havia credenciais de rede, inicializa o cache determinístico auditado
```

E, na linha 506, um segundo fallback:

```ts
const freqNu = typeof medE?.frequenciaSoloNu === "number" ? medE.frequenciaSoloNu : 0.15;
// permitido: fallback para candidato sem medicao espectral de solo nu no script
```

Não houve chamada ao Earth Engine. A afirmação de *"100% de tráfego de rede evitado"* é
literalmente verdadeira e é o indício: **100% evitado significa que nenhuma chamada foi feita.**

A anotação `// permitido:` é o mecanismo de escape do varredor de padrões proibidos, usado aqui
para deixar passar um valor fabricado. A auditoria de 26/09 já havia apontado esse mecanismo
como passível de abuso.

## Consequência

**A tabela das 9 células não tem significado.** Os tercis de Ê foram calculados sobre um
contador, de modo que a atribuição de cada candidato ao seu tercil de Ê segue a **ordem da
lista**. As contagens de 2, 3, 4, 9, 16, 21 e 24 são o resultado de particionar uma sequência
monotônica em três partes.

Isso atinge o ponto mais consequente de todo o desenho: **Ê é uma das três dimensões que
estratificam a campanha inteira**, e o sorteio dos 36 polígonos leria dali a partição.

Com o sorteio de D23 sendo irreversível — `pi_i` registrado não se descarta — um sorteio sobre
esta partição teria contaminado permanentemente toda a estimativa.

## O que está CORRETO neste commit e não deve ser refeito

- **C1 verificado e bom.** `credenciaisSeguras.ts` resolve o caminho contra a raiz do
  repositório e recusa, inclusive, JSON colado na variável de ambiente. 11 testes.
- **C2 verificado.** Os campos `planetApiKey`, `planetSceneId` e `planetMosaicId` entraram em
  `CAMPOS_PROIBIDOS_MATRIZ_TREINO`, conforme a guarda anticircularidade pedida.
- `tsc` limpo, **50 arquivos e 374 testes** verdes, `decisoes.ts` intocado.

## O que precisa acontecer

1. **O fallback determinístico tem de ser removido.** Sem credenciais, Ê é `indisponivel` —
   não um valor gerado. É P12, e é o defeito que este projeto vem corrigindo desde 26/09.
2. **O cache atual deve ser apagado**, não corrigido: 680 entradas fabricadas, e o
   `hashDefinicao` as faz parecer válidas para a definição real.
3. **A tabela das 9 células deve ser retirada** dos artefatos e do relatório, ou marcada de
   forma inequívoca como não medida.
4. **O sorteio permanece bloqueado** — agora pela razão certa: a dimensão Ê não existe.
5. A anotação `// permitido:` da linha 506 precisa de revisão: ela está autorizando fabricação.

## Nota

É o mesmo padrão do `amostradorGLO30`, que gerava altitudes por trigonometria da coordenada e
levava o nome da fonte real. Aqui o campo `definicao` traz
`s2_sr_harmonized_2016_2026_ndvi_lt_0.25_worldcover_v100_v200` — a definição correta, a
parametrização correta, e nenhum dado por trás.

A diferença é a consequência: lá, um plano de voo que ninguém voaria sem conferir. Aqui, a
dimensão que estratifica a campanha inteira, num sorteio que não se desfaz.
