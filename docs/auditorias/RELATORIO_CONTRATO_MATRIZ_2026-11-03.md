# Relatório de execução — Contrato de dados da matriz (P-M)

**Data:** 3 de novembro de 2026
**Prompt executado:** [`PROMPT_EXECUTOR_CONTRATO_MATRIZ_2026-11-02.md`](../planejamento/prompts/PROMPT_EXECUTOR_CONTRATO_MATRIZ_2026-11-02.md)
**Branch:** `correcoes/contencao-2026-11-02`
**Natureza:** implementação de `A-05`, `C-02` e `C-07`. Nenhuma decisão metodológica; nenhum limiar alterado; `decisoes.ts` não tocado.

---

## 1. Baseline e estado final

| Verificação | Antes | Depois |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | **exit 0** |
| `npm test` | 93 arquivos, **770** passaram, 3 pulados | 94 arquivos, **794** passaram, 3 pulados |
| varredor de padrões proibidos | 34 | **34** |

**+24 testes**, nenhuma regressão. Os três achados S1 de causa raiz única — `V-01`, `V-03`, `T-02` — ficam fechados pela mesma mudança.

---

## 2. Colunas acrescentadas, e a origem efetiva de cada uma

Acrescentadas aos perfis `matriz-treino` **e** `matriz-heldout`:

| Coluna | Origem efetiva | Observação |
|---|---|---|
| `Estrato_ID` | **selo D16**, prevalecendo sobre `ponto.estratoId` | o tipo da linha já declarava o campo como *"produtor pendente (DP-18)"*; o produtor existia, faltava a coluna no perfil |
| `Pi_i` | **selo D16**, junção por `Poligono_ID` | |
| `W_i` | **selo D16** | contrato assevera `Pi_i × W_i = 1` |
| `N_Candidatos_Estrato` | **selo D16** | permite auditar `Pi_i` sem o selo em mãos |
| `Incluida` | CSV de D26, via `ponto.delineacaoD26` | **texto**, não `1`/`0` — ver §4 |
| `Cobertura_Celula` | CSV de D26 | |
| `Area_Delineada_m2` | CSV de D26 | |
| `Pixel_ID` | CSV de D26 | hash opaco; jamais derivado de coordenada |
| `Modelo` | opção de montagem (`"D"` hoje em todas as rotas) | |
| `Data_Referencia` | opção explícita, ou `rotulo.observadoEm` | a opção prevalece |
| `Fim_Janela` | `BlocoTemporal.janela.fim` | |

**Decisão de desenho: junção, não campo editável.** `Pi_i` é produto do ato probabilístico, e o selo de D16 é irreversível por construção (D23). Lê-lo do selo por `Poligono_ID` impede que um campo no ponto divirja da probabilidade efetivamente selada. Há teste que confirma: quando o ponto traz `estratoId` divergente do selo, **o selo prevalece**.

**Novo bloco no tipo do ponto:** `delineacaoD26?: { coberturaCelula, incluida, areaDelineadaM2, pixelId }`. `fracaoErodida` **não** vive nele — é o alvo e pertence ao rótulo humano (D26 / C25).

---

## 3. Como o esquema trata cada caso

`src/lib/matriz/esquema.ts`, `ESQUEMA_MATRIZ_VERSAO = "2.0.0"`, gravada no cabeçalho do artefato ("Versão do Esquema da Matriz", aba de Procedência). Chamado em `planilha.ts` **depois** dos invariantes e antes de qualquer escrita.

| Caso | Comportamento |
|---|---|
| **Coluna ausente** | `ErroEsquemaMatriz` com a coluna nomeada. Falha estrutural interrompe antes de validar valores |
| **Domínio violado** | erro com linha, coluna, motivo e valor recebido. `Pi_i ∉ (0,1]`, `Fracao_Erodida ∉ [0,1]`, `Cobertura_Celula ∉ [0,1]`, `Area_Delineada_m2 < 0` |
| **Célula vazia** | **aceita** como ausência declarada. Nunca coagida a zero (Regra 1) |
| **`Pi_i` sem `W_i`** | recusado: peso sem probabilidade não permite auditar a ponderação |
| **`Pi_i × W_i ≠ 1`** | recusado, com o produto no erro, tolerância `1e-6` |
| **`Modelo` misturado** | recusado: D e P nunca compartilham a mesma matriz (`V-01`) |
| **`Incluida` numérica** | recusada pelo tipo — ver §4 |

Lança erro tipado; não avisa, não corrige, não preenche.

---

## 4. O Invariante 7 e a tipagem de `Incluida`

O alerta do prompt se confirmou e está agora coberto por teste nas duas pontas.

Se `Incluida` fosse exportada como `1`/`0`, após qualquer filtragem a montante **toda** linha valeria `1` — coluna numérica constante com `n ≥ 21` — e o detector de constante disfarçada (`invariantes.ts:333-360`) **bloquearia** a exportação de uma coluna que é legitimamente uniforme.

Ela é exportada como **texto** `"true"`/`"false"`, que é também o que o avaliador D25 já reconhece em `_so_incluidas`. Três testes demonstram a escolha:

1. `Incluida: "true"` uniforme em 25 linhas → exportação **passa**;
2. `Incluida: 1` uniforme em 25 linhas → exportação **bloqueia** (a colisão que o texto evita);
3. `Cobertura_Celula: 1` constante em 25 linhas → **bloqueia**, confirmando que o invariante segue ativo para coluna numérica genuinamente constante.

**A lista `COLUNAS_EXCECAO_CONSTANTE_TABELADA` não foi ampliada.** Ela é a exceção nominal do fator P, com lastro em Renard et al. (1997), e ampliá-la por conveniência enfraqueceria o invariante.

---

## 5. Exclusões: contagem e motivo

Duas exclusões novas, ambas **condicionais** e com motivo registrado em `exclusoes`:

| Gatilho | Condição | Motivo registrado |
|---|---|---|
| Polígono ausente do selo | `seloD16` fornecido | *"não consta do selo D16 fornecido: sem probabilidade de inclusão selada, a linha não entra na matriz (D23 / Regra 1)"* |
| Célula sem delineação de D26 | `exigirDelineacaoD26: true` | *"sem cobertura e sem Pixel_ID, as guardas de cobertura e de pixel disjunto do D25 não têm insumo (T-02)"* |

**Por que condicionais, e não sempre ativas.** Nenhum voo foi selado: com exigência incondicional, a matriz sairia **vazia** hoje. A exigência estrita pertence ao modo probatório do D25 (`A-06`), que é onde a matriz incompleta tem de deixar de ser aceita — e é o prompt `P-V`. Aqui são opções declaradas, prontas para a campanha ativar quando o primeiro selo e o primeiro CSV existirem.

**O filtro de cobertura (P11) não foi aplicado** nem na montagem nem na exportação: `Incluida` viaja como coluna e o filtro é do D25, porque o limiar é decisão pendente (`G-06`).

---

## 6. Nenhuma cardinalidade foi codificada — e onde o número é lido

**Confirmado por teste automatizado.** `esquema.test.ts` lê o próprio `esquema.ts`, remove comentários e assevera que o corpo **não contém** `18`, `36`, `72`, `56` nem `60`. Há também teste que valida artefatos de 1 e de 57 linhas, com 14 estratos distintos, sem reclamar.

Onde o número é lido, agora:

| Quantidade | Fonte |
|---|---|
| número de estratos, de polígonos, de held-out | **selo D16** (`opcoes.seloD16.poligonos`), e a verificação do modo probatório em `A-06` |
| `N_h` de cada estrato | `selo.nCandidatosEstrato`, coluna `N_Candidatos_Estrato` |
| limiar de cobertura | **nenhum lugar** — é `G-06`, aplicado pelo D25 |

### Achado novo: o tipo do selo tem cardinalidade literal e **bloqueia** o resultado de `G-01`

`src/lib/gee/sorteioPoligonosTipos.ts`:

```
areaHectares: 10 | 5.02;
totalPoligonosSorteados: 36 | 72;
totalTreino: 18 | 36;
totalHeldOut: 18 | 36;
areaTotalHectares: 360 | 361.44;
```

Pela aritmética de `G-01` já registrada, as saídas viáveis dão **14, 15 ou 12 estratos**, isto é **56, 60 ou 48 polígonos**, com **28, 30 ou 24** held-out e **281,1 / 301,2 / 241,0 ha**. **Nenhum desses valores é aceito pelo tipo.** Decidido o gate, o selo não compila.

**Não alterei.** Relaxar para `number` remove uma guarda, e a guarda correta seria "consistente com `4 × número de estratos`" — isso é desenho, e o número de estratos é justamente o que `G-01` decide. É escopo do gate e de `A-06`, não do contrato de dados. Fica registrado como bloqueio a resolver junto com `G-01`.

---

## 7. Dicionário de dados (`C-07`)

`docs/metodologia/DICIONARIO_MATRIZ_TREINO.md` — 52 colunas, por grupo, com tipo, unidade, suporte, origem, decisão de referência e se admite vazio.

Duas entradas receberam redação explícita, porque a confusão de unidade é o que o achado `D-02` descreve:

- **`Pi_i`** — probabilidade de inclusão do **polígono** no seu estrato, `n_h/N_h`, com `N_h` em **número de candidatos, não hectares**. **Não é peso de área.** Um imóvel de 10 ha e outro de 1.000 ha contribuem com o mesmo polígono e têm a mesma probabilidade.
- **`W_i`** — peso de Horvitz-Thompson, `1/Pi_i`, com a mesma ressalva.

O dicionário traz também a seção **"o que nunca entra na matriz"** (coordenadas, identificadores fundiários, `phiDiag`, `RUSLE_Perda_Solo`, laudo do JEV) e a seção sobre o que o contrato valida e o que deliberadamente não valida.

---

## 8. Pendências, por gate

| Pendência | Gate |
|---|---|
| exigir contagens no modo probatório (`A-06`) | **G-01** — e o tipo do selo precisa aceitar o número decidido (§6) |
| exportar a segunda matriz (Modelo P) | **G-04** — o caminho está pronto: `Modelo` é parâmetro e o contrato recusa mistura, mas nenhuma rota de produção emite `P` |
| aplicar o limiar de cobertura | **G-06** |
| trocar a partição treino/held-out | **G-03** — `Papel_Conjunto` não muda de forma |
| ativar `seloD16` e `exigirDelineacaoD26` nas rotas de produção | campanha: depende do primeiro selo e do primeiro CSV de D26 existirem |

**Fim do relatório.** Nenhuma decisão, parâmetro científico ou norma foi alterado.
