# PROMPT V — EXECUTOR SAREL — instrumentar a ingestão da delineação (D26)

**Escopo: fechar a cadeia que leva a delineação do ortomosaico até a matriz.** Hoje ela está
cortada em três pontos e contraditória em um quarto. Este prompt instrumenta os três e
**apenas declara** o quarto — o quarto é decisão da pesquisadora, não tarefa de execução.

---

## 0. PROTOCOLO

`docs/DESENVOLVIMENTO.md`. Informe o branch e permaneça nele. Saídas de comando em
`docs/verificacoes/execucao/2026-11-11v/`, citadas **por caminho**, nunca transcritas de memória.
**Commit escrito depois do fato. `git push` confirmado e o hash conferido no remoto.**

Se qualquer tarefa não terminar, **declare não terminada**. Entregar três tarefas inteiras e uma
declarada incompleta é um resultado melhor que quatro alegadas completas.

---

## 1. O ESTADO MEDIDO — leia antes de escrever qualquer linha

Confira cada item por conta própria antes de agir. Se alguma medição abaixo não se confirmar,
**pare e relate a divergência**: o prompt foi escrito sobre ela.

**Existe:**
- `scripts/d25/fracao_erodida_celulas_referencia.py` — implementação de referência. Recebe
  `--voo` (GeoJSON dos polígonos), `--delineacao` (GeoJSON das feições erodidas) e `--grade`
  (JSON com CRS e origem da grade nativa S2), e emite CSV com
  `Poligono_ID, Celula_ID, Pixel_ID, Grade_X, Grade_Y, Lon, Lat, Cobertura_Celula,
  Fracao_Erodida, Area_Delineada_m2, Incluida` mais um JSON de conferência de área.
  Tem teste: `scripts/d25/test_fracao_erodida_celulas_referencia.py`.
- `src/types/ponto.ts:193` — `delineacaoD26?: { coberturaCelula, incluida, areaDelineadaM2, pixelId }`,
  o destino tipado.
- `src/lib/matriz/montagem.ts:335-344` — lê `ponto.delineacaoD26` e, com `exigirDelineacaoD26`,
  exclui a célula sem correspondência.
- `src/lib/rotulos/ingestaoColetor.ts` (312 linhas) — **o modelo a seguir**: colunas canônicas
  fixadas, retorno `{processados, rejeitados}` com motivo por rejeição, gerador de template.

**Não existe (a cadeia cortada):**
1. **Nada produz o `--grade`.** O docstring do script manda ler CRS e transform da banda B4 do
   tile no GEE (`image.projection()`) e diz literalmente **"NUNCA assumir EPSG:31982"**.
   `git grep` por `origem_x|projection()|crsTransform|gradeNativa` em `src` e `scripts` acha
   **somente o próprio script e seu teste**. O insumo obrigatório do script é inexistente.
2. **`COBERTURA_MIN = 0.95` está codificado como default no Python**, e `P11`
   (`src/config/decisoes.ts:693`) está `estado: "proposta"` — **não decidida**. A coluna
   `Incluida` sai de um parâmetro não decidido, em Python, fora do alcance de `exigirParametro`.
3. **Ninguém escreve `ponto.delineacaoD26`.** `git grep delineacaoD26 -- src` retorna quatro
   ocorrências: a leitura em `montagem.ts`, a declaração do tipo, e **dois arquivos de teste**.
   O elo CSV → ponto não existe. O mesmo vale para `ponto.celulaId`, cujo comentário em
   `montagem.ts:27` diz `// produtor pendente (DP-18)`.

**Contraditório (tarefa 4, não resolver):** `Fracao_Erodida` tem duas origens incompatíveis.

---

## 2. TAREFA 1 — instrumentar a grade nativa do Sentinel-2

Sem isso o script não roda, e um chute de EPSG é proibido pelo próprio script.

Crie um módulo e um CLI que **meçam** a grade, nunca a assumam:

- Leia, para cada tile Sentinel-2 que a pesquisa efetivamente usa, a projeção da banda **B4**
  via GEE (`image.projection()` → `crs` e `transform`). **Enumere os tiles a partir do que está
  no repositório** (os `PRODUCT_ID` / `cenas` em `rastreio`, ou o universo de candidatos), não de
  uma lista sua. Relate quais tiles apareceram e de onde você os tirou.
- Emita, por tile, `docs/verificacoes/grade_nativa_s2_<TILE>.json` **exatamente na forma que
  `--grade` espera**: `{"crs": ..., "origem_x": ..., "origem_y": ..., "tamanho_m": 10}`.
  A origem vem do `transform` medido; `tamanho_m` deve sair medido igual a 10 e o módulo deve
  **recusar** qualquer outro valor (D06: a unidade de análise é a célula de 10 m).
- Cada arquivo carrega a proveniência: qual imagem, qual data de consulta, qual asset.
  `estado: "medido"`. Nenhum campo modelado ou tabelado.
- **Declare o caso de fronteira.** Se mais de um tile cobre a BP3, polígonos sobre a divisa caem
  em duas grades nativas distintas, com origens diferentes — a mesma área física seria recortada
  em duas malhas incompatíveis. **Não resolva isso.** Meça quantos polígonos sorteados estão a
  menos de 10 m de uma divisa de tile e registre o número. Se for zero, o problema é teórico e
  você o declara como tal. Se não for zero, é uma pendência a registrar na tarefa 4.

Teste: um caso com `tamanho_m` diferente de 10 recusado; um caso sem `transform` recusado em vez
de preenchido com padrão.

---

## 3. TAREFA 2 — fazer o Python recusar parâmetro não decidido

O script hoje roda com 0,95 por omissão. Isso materializa em silêncio um parâmetro que o registro
declara `proposta`. Pior: `Incluida` é um **filtro** — o limiar decide quais células entram no
modelo. Fixá-lo depois de ver as delineações é escolher o corte à vista do resultado. O limiar
tem de estar decidido **antes** da primeira delineação ser processada, e não por conformidade
formal: por pré-registro.

Faça:

1. **Remova o default** de `--cobertura-min`: o flag passa a ser obrigatório.
2. Gere `scripts/d25/parametros_decididos.json` **a partir de `src/config/decisoes.ts`**, por
   script npm, com `{id, estado}` de cada decisão — uma única fonte de verdade, sem transcrição
   manual. O arquivo entra em commit.
3. O Python lê esse JSON e **aborta com código de saída 2** quando a decisão que governa o
   parâmetro usado não está `decidida`, com a mensagem dizendo qual decisão e qual estado. É o
   espelho de `exigirParametro` em Python.
4. O JSON de conferência passa a registrar `cobertura_min` usado **e** o estado lido de `P11`.

**Consequência que você deve escrever no relatório, em letras claras:** depois desta tarefa o
script **não roda** até `P11` ser decidida. Isso é o comportamento correto e é o ponto da tarefa.
Não contorne, não crie flag de bypass, não deixe caminho alternativo.

Rode `scripts/d25/test_fracao_erodida_celulas_referencia.py` — ele existe e nunca foi relatado
como executado. Se as dependências (`pandas`, `pyproj`, `shapely`) não estiverem instaladas,
**declare não executado**; não substitua por um teste caseiro.

---

## 4. TAREFA 3 — o importador

Novo módulo `src/lib/delineacao/ingestaoDelineacaoD26.ts`, modelado em `ingestaoColetor.ts`.
Pasta nova porque esta é uma cadeia de proveniência geométrica, vinda de GeoJSON por Python —
não é rótulo humano, e manter as duas separadas mantém a história do cegamento legível.

Contrato:

- `COLUNAS_CANONICAS_DELINEACAO_D26` fixadas e conferidas contra o cabeçalho real.
- Lê o CSV do script e escreve
  `ponto.delineacaoD26 = { coberturaCelula, incluida, areaDelineadaM2, pixelId }` e
  `ponto.celulaId` (fecha DP-18).
- **`Grade_X` e `Grade_Y` são aceitas na entrada e nunca armazenadas.** O docstring do script é
  explícito: ficam só no CSV intermediário e **nunca** vão a uma exportação do app (Regra 6).
  Escreva um teste que falha se qualquer uma delas chegar a um ponto ou a um perfil de exportação.
- **`incluida` é booleano, nunca 1/0** (Invariante 7 — `Incluida` numérica constante colidiria com
  o detector de constante disfarçada). Atenção: `pandas.to_csv` escreve booleano Python como
  `True`/`False`, com maiúscula. **Pine o parsing contra uma fixture gerada pelo próprio script**,
  não contra um CSV escrito à mão — é exatamente onde a suposição erra em silêncio.
- Recusa, com motivo por linha, sem descartar em silêncio:
  - `Poligono_ID` que **não está no selo de D16** — delineação de polígono que nunca foi sorteado;
  - `Cobertura_Celula` fora de [0, 1];
  - `Area_Delineada_m2` negativa, ou maior que a área observada da célula
    (`100 m² × Cobertura_Celula`, com a tolerância de D15);
  - `Pixel_ID` ausente ou repetido dentro do mesmo `Poligono_ID`;
  - qualquer coluna de estrato, titular, π_i ou partição treino/held-out presente no arquivo —
    o importador **não aceita** entrada que carregue cegamento rompido.
- Retorno `{processados, rejeitados}`, cada rejeição com código e motivo legível.
- **Não sobrescreve** em silêncio um `delineacaoD26` já gravado com valor diferente: recusa e
  relata. Dado registrado não é substituído sem decisão explícita (vizinho de D23).
- O mesmo `Pixel_ID` pode aparecer em dois polígonos vizinhos — é precisamente o caso que o
  `pixelId` opaco existe para detectar. O importador **registra** a ocorrência e não a resolve:
  a separação treino/held-out por pixel disjunto é do avaliador de D25, não daqui.

---

## 5. TAREFA 4 — declarar a contradição, sem resolvê-la

Medição: `Fracao_Erodida` tem duas origens que não podem valer ao mesmo tempo.

- **Geométrica:** `fracao_erodida_celulas_referencia.py` calcula
  `frac = a_del / parte.area` por célula, por rasterização do vetor delineado.
- **Digitada:** `src/components/inspetor/InspetorPonto.tsx:37` mantém `fracaoErodidaInput` como
  estado React iniciado em `null`, e `src/lib/rotulos/rotuloHumano.ts:90` grava
  `Number(insumos.fracaoErodida.toFixed(3))` vindo desse campo.
- **O texto de D26** define o alvo como "fração contínua da área da célula de 10 m delineada como
  erodida, no intervalo [0, 1], **obtida por rasterização da delineação vetorial** feita sobre o
  ortomosaico".
- **O docstring de `types/ponto.ts:187`** diz que o dado de delineação vem do CSV de referência,
  "**nunca de digitação**" — e, na mesma frase, que "`fracaoErodida` NÃO vive aqui: é o alvo e
  pertence ao rótulo humano".

Ou seja: a decisão diz *rasterização*, o caminho implementado diz *digitação*, e o próprio tipo
afirma as duas coisas em parágrafos consecutivos. É contradição sobre **a variável-alvo do modelo**.

**Sua tarefa é registrá-la, não decidi-la.** Acrescente entrada em
`docs/planejamento/DECISOES_DE_CONVERSA.md` como **pendência**, com:
- as quatro evidências acima, cada uma com `arquivo:linha` que você conferiu;
- a consequência de cada saída, sem recomendar nenhuma: se o alvo é geométrico, o campo do
  inspetor passa a não ser fonte do alvo; se é digitado, D26 precisa de emenda porque seu texto
  diz rasterização.

**Não altere** `rotuloHumano.ts`, `InspetorPonto.tsx` nem o texto de D26. **Não escolha.**

Se a tarefa 1 achou polígonos sobre divisa de tile, registre isso como segunda pendência, na
mesma entrada.

---

## 6. TESTES E TESTE DE MUTAÇÃO

Cada guarda nova precisa ter disparado ao menos uma vez. Quebre deliberadamente, uma por vez, e
confirme a falha:

1. `tamanho_m` ≠ 10 aceito → o teste da tarefa 1 deve falhar;
2. `P11` lido como `decidida` quando é `proposta` → o aborto da tarefa 2 deve falhar;
3. `Grade_X` gravada no ponto → o teste de Regra 6 deve falhar;
4. `Incluida` aceita como `1` → o teste de Invariante 7 deve falhar;
5. `Poligono_ID` fora do selo aceito → a recusa deve falhar.

Saída de cada mutação em `docs/verificacoes/execucao/2026-11-11v/`, com o diff da quebra e a
falha correspondente. Reverta cada mutação antes da seguinte. Três guardas deste projeto já
passaram sem nunca ter disparado — é por isso que esta seção existe.

Rode `npm test` e `npm run build` e registre a saída por caminho.

---

## 7. RELATÓRIO

Diga, por tarefa: feita, parcial ou não feita, e por quê. Sem arredondar.

Em particular: quantos tiles mediu e de onde tirou a lista; se o teste Python rodou ou se faltou
dependência; se o script ficou bloqueado por `P11` (resposta esperada: sim); quantas rejeições
cada guarda do importador produziu na fixture; e as cinco mutações, uma a uma.

**Nenhuma citação bibliográfica, nenhuma saída de comando transcrita de memória.** O que você não
rodou, você não relata.
