# Prompt de Correção — Fabricação de Fatores RUSLE no Pacote de Reprodutibilidade e Card RUSLE no Inspetor

**Sistema de Amostragem e Rotulagem para Erosão Laminar (SAREL)** — PPGTCA 2026
**Versão:** 26/09/2026
**Branch de trabalho:** `sarel/v2`
**Governa:** `docs/planejamento/PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md` (9 Regras Invioláveis) e `docs/design.md`
**Natureza:** correção de conformidade com a Regra 1 (Sem Valores Fabricados) e a Regra 3 (Rastreabilidade), mais implementação de interface auditável. **Não altera física, não toma decisão metodológica, não destrava decisão pendente.**

---

> ## Como usar
>
> Abra uma sessão nova do agente na raiz do repositório `geolocalizacao-erosao-propriedade` e cole o bloco abaixo como primeira mensagem.
>
> ```
> Execute docs/planejamento/PROMPT_CORRECAO_FABRICACAO_RUSLE_2026-09-26.md.
>
> Leia o arquivo inteiro antes de qualquer ação, e leia também docs/design.md
> (Regras 1 a 9 e Invariantes 1 e 2).
>
> Antes de editar qualquer arquivo:
> 1. reproduza os 4 achados da PARTE I e cole a evidência bruta de cada um
>    (trecho do arquivo com número de linha, e a saída do vitest);
> 2. se algum achado não se reproduzir exatamente como descrito, PARE e me
>    informe a divergência — não prossiga com a correção baseada em suposição;
> 3. declare o escopo que vai tocar, arquivo por arquivo, e aguarde minha
>    autorização.
>
> As PROIBIÇÕES ABSOLUTAS da PARTE III não admitem exceção, nem se eu pedir
> depois na mesma sessão sem registrar a decisão formal em src/config/decisoes.ts.
> ```

---

# PARTE I — DIAGNÓSTICO VERIFICADO

Os quatro achados abaixo foram confirmados por leitura direta do código e por execução de teste em 26/09/2026. Cada um traz a âncora exata. **Reproduza cada achado antes de corrigir.** Se a linha não corresponder, o repositório mudou: pare e reporte.

## Achado 1 — O Pacote de Reprodutibilidade fabrica os cinco fatores RUSLE

**Arquivo:** `src/lib/export/pacoteReprodutibilidade.ts`, linhas 147 a 153, dentro de `gerarCsvMatrizTreinamento`.

```ts
Ordem_Solo: valorOuNulo(p.solo?.ordem) ?? "Latossolo Vermelho",
Erodibilidade_Classe: valorOuNulo(p.solo?.erodibilidadeClasse) ?? "Baixa",
RUSLE_Fator_K: valorOuNulo(p.linhaDeBase?.fatorK) ?? "0.0117",
RUSLE_Fator_R: valorOuNulo(p.linhaDeBase?.fatorR) ?? "7500",
RUSLE_Fator_LS: valorOuNulo(p.linhaDeBase?.fatorLS) ?? "1.45",
RUSLE_Fator_C: valorOuNulo(p.linhaDeBase?.fatorC) ?? "0.12",
RUSLE_Fator_P: valorOuNulo(p.linhaDeBase?.fatorP) ?? "1.0",
```

**Gravidade máxima.** `src/lib/rusle/linhaDeBase.ts` retém `fatorR` e `fatorLS` como `indisponivel` em **100% dos pontos**, porque `REGISTRO_DECISOES.D13.estado` e `D15.estado` valem `"pendente"` (`src/config/decisoes.ts:139` e `:156`). Consequência aritmética: o **Arquivo 01 do Pacote de Reprodutibilidade emite hoje `R = 7500` e `LS = 1,45` para todos os pontos amostrais**, sem que nenhuma fonte tenha medido ou modelado esses valores.

O mesmo vale para `Ordem_Solo = "Latossolo Vermelho"` e `Erodibilidade_Classe = "Baixa"` sempre que a carta pedológica da Embrapa não cobrir o ponto — isto é, o sistema afirma a ordem do solo por omissão.

Isto viola a Regra 1 em sua formulação literal (`docs/design.md:14`): *"É terminantemente proibido o uso de números mágicos (`|| 16`, `?? 0.035`) ou preenchimentos arbitrários."*

O agravante é o destino do artefato: o Pacote de Reprodutibilidade é o documento que a dissertação oferece à banca como prova de honestidade metodológica. É o único artefato do sistema que fabrica dado.

Fabricações adicionais na mesma função, de menor gravidade mas mesma natureza: `Bacia_Hidrografica ?? "Paraná 3"` (linha 138), `Bloco_Espacial ?? "bloco_central"` (139), `Municipio ?? "não determinado"` (136).

## Achado 2 — O varredor de padrões proibidos não detecta numeral entre aspas

**Arquivo:** `src/lib/seguranca/padroesProibidos.test.ts`, linha 25.

```ts
{ id: "coalescencia-com-numero", regex: /\?\?\s*\d+(\.\d+)?\b/ },
```

O regex exige dígito imediatamente após `??`. Em `?? "7500"` o caractere seguinte é a aspa, então **não casa**. Toda a família de magic numbers escapa da guarda pela simples aspa. O mesmo furo existe em `ou-logico-com-numero` (linha 24).

**Evidência de execução (26/09/2026):**

```
npx vitest run src/lib/seguranca/padroesProibidos.test.ts
 Test Files  1 passed (1)
      Tests  12 passed (12)
```

Doze asserções verdes com as sete fabricações do Achado 1 presentes no código. A guarda da Regra 1 está cega para a violação mais grave do repositório.

Ocorrências adicionais que o regex corrigido deve expor, e que também precisam de tratamento honesto: `src/lib/export/planilha.ts:144-145`, `Janela_Inicio ?? "2018-01-01"` e `Janela_Fim ?? "2023-12-31"` — janela temporal afirmada por omissão.

## Achado 3 — O script de auditoria imputa zero em variável física ausente

**Arquivo:** `src/lib/export/pacoteReprodutibilidade.ts`, linha 543, dentro do Python do Arquivo 05.

```python
X = df[cols_existentes].apply(pd.to_numeric, errors="coerce").fillna(0.0)
```

Com `colunas_preditoras = ["Elevacao_m", "Declividade_pct", "Curvatura_Perfil", "Curvatura_Plana", "Acumulo_Fluxo", "TWI", "RUSLE_Fator_K", "RUSLE_Fator_R"]` (linhas 535-538).

Hoje `curvaturaPerfil`, `curvaturaPlana`, `acumuloFluxo` e `twi` são `indisponivel` na origem (`src/app/api/gee/select-candidates/route.ts:802-820`). Portanto o XGBoost do pacote de auditoria **treina com o número 0 no lugar de curvatura, acúmulo de fluxo e TWI** — e zero não é neutro: é um valor físico específico (vertente retilínea, nenhuma área contribuinte). Imputação não declarada, dentro do núcleo estatístico.

**Acoplamento crítico com o Achado 1.** Se o Achado 1 for corrigido isoladamente — célula vazia no CSV —, então `to_numeric(errors="coerce")` produz `NaN` e `fillna(0.0)` converte em `0.0`. A fabricação **muda de 7500 para 0 e migra do CSV para dentro do modelo**, onde é menos visível. Os Achados 1 e 3 formam uma única correção atômica e devem ser corrigidos no mesmo commit.

## Achado 4 — O Inspetor não expõe a Linha de Base RUSLE

`montarLinhaDeBaseRUSLE` é chamado em `src/app/api/gee/inspect-point/route.ts:267` e `src/app/api/gee/select-candidates/route.ts:942`, e `ponto.linhaDeBase` já é consumido por `PointPopup.tsx:95`, `AuditDossierModal.tsx:39-41` e `StatsOverview.tsx:55`.

`src/components/inspetor/InspetorPonto.tsx` **não exibe nenhum dos cinco fatores**. A única menção a RUSLE no arquivo é o bloco de auditoria dual-engine Jev (linha 282), que é outra coisa. O pesquisador não tem, na tela, como ver que `R` e `LS` estão retidos nem por qual causa — precisa abrir a planilha exportada.

Não é violação de regra: é lacuna de transparência, com o dado já pronto e o componente de selo já existente.

---

# PARTE II — TAREFAS AUTORIZADAS

Ordem obrigatória. Não inicie uma tarefa antes de a anterior passar em seu critério de aceite.

## T1 — Eliminar a fabricação no Arquivo 01 e declarar a ausência (Achados 1 e 3, commit único)

### T1.a — Células honestas

Em `gerarCsvMatrizTreinamento` (`src/lib/export/pacoteReprodutibilidade.ts`), substituir **todos** os fallbacks fabricados por célula vazia, seguindo o idioma já vigente em `src/lib/export/planilha.ts:103-107`:

| Linha | Antes | Depois |
|---|---|---|
| 135 | `?? "não determinado"` | `?? ""` |
| 137 | `?? "Paraná 3"` | `?? ""` |
| 138 | `?? "bloco_central"` | `?? ""` |
| 147 | `?? "Latossolo Vermelho"` | `?? ""` |
| 148 | `?? "Baixa"` | `?? ""` |
| 149 | `?? "0.0117"` | `?? ""` |
| 150 | `?? "7500"` | `?? ""` |
| 151 | `?? "1.45"` | `?? ""` |
| 152 | `?? "0.12"` | `?? ""` |
| 153 | `?? "1.0"` | `?? ""` |

Atenção ao caso `Bloco_Espacial`: ele alimenta `grupos` (linha 545), consumido pelo `GroupKFold` do Arquivo 05 (linha 554), com `np.zeros` como alternativa silenciosa já presente no código. Se a célula ficar vazia, o agrupamento espacial degrada silenciosamente. Trate no Arquivo 05 (T1.c): ausência de bloco espacial deve **interromper** a validação cruzada espacial com mensagem explícita, nunca cair em grupo único.

### T1.b — Censo de proveniência no cabeçalho

O Arquivo 01 já emite cabeçalho comentado com `#` (linhas 76-80) e o leitor Python já usa `comment="#"` (linha 531). Portanto **comentários adicionais não quebram o parser e não alteram o esquema de colunas**.

Acrescentar, após a linha de emissão, um censo por variável crítica, computado dos dados reais — não redigido à mão:

```
# CENSO DE PROVENIENCIA (Regra 3) — contagem sobre N pontos emitidos
# RUSLE_Fator_R: 0/124 disponiveis | indisponivel: decisao-pendente=124 (D13)
# RUSLE_Fator_K: 118/124 disponiveis | tabelado=118 | indisponivel: insuficiente=6
# RUSLE_Fator_LS: 0/124 disponiveis | indisponivel: decisao-pendente=124 (D15)
# RUSLE_Fator_C: 124/124 disponiveis | modelado=124 (D01)
# RUSLE_Fator_P: 124/124 disponiveis | tabelado=124
# RUSLE_Perda_Solo_A: 0/124 disponiveis | retido pelo Invariante 1
# Acumulo_Fluxo: 0/124 disponiveis | indisponivel: fora-do-dominio=124
# TWI: 0/124 disponiveis | indisponivel: fora-do-dominio=124
```

Requisitos: contagens derivadas do array `pontos` recebido, agregando `estado` e, quando `indisponivel`, a `causa`; zero literais de contagem no código; o censo cobre no mínimo os cinco fatores, a perda de solo, e todas as colunas listadas em `colunas_preditoras` do Arquivo 05.

Justificativa científica: a célula vazia informa que o dado falta; o censo informa **por que** falta e **quantos** faltam, que é o que um parecerista precisa para julgar a linha de base. Isto converte a retenção de achado em declaração metodológica.

### T1.c — Remover a imputação por zero no Arquivo 05

No Python embutido (`src/lib/export/pacoteReprodutibilidade.ts`, linha 543 e arredores):

1. Remover `.fillna(0.0)`. O `XGBClassifier` trata `NaN` nativamente por aprendizado da direção de ausência (`missing=np.nan` é o padrão); declare isso em comentário no script, com a referência: Chen & Guestrin (2016), *XGBoost: A Scalable Tree Boosting System*, KDD 2016, seção 3.4 "Sparsity-aware Split Finding".
2. Antes do ajuste, descartar as colunas **integralmente ausentes** e imprimir o descarte de forma inequívoca, por exemplo: `[RETIDA] Curvatura_Perfil: 0/124 observações válidas — excluída dos preditores (indisponível na origem)`.
3. Imprimir, para cada preditor mantido, a fração de ausência: `Acumulo_Fluxo: 61/124 válidas (49,2% ausentes) — NaN preservado, tratado por sparsity-aware split`.
4. Se após o descarte restarem menos de 3 preditores, abortar com mensagem explícita em vez de ajustar modelo.
5. `Bloco_Espacial` ausente ou vazio: abortar a validação cruzada espacial com mensagem, nunca substituir por `np.zeros`.

Proibido: qualquer imputação por média, mediana, moda ou constante em variável biofísica, com ou sem declaração. Se a imputação vier a ser necessária, é decisão metodológica do pesquisador e exige registro em `src/config/decisoes.ts`.

### Aceite de T1

- `grep -nE '\?\?\s*"[0-9]' src/lib/export/pacoteReprodutibilidade.ts` → zero linhas.
- `grep -n 'fillna' src/lib/export/pacoteReprodutibilidade.ts` → zero linhas.
- Teste novo em `src/lib/export/pacoteReprodutibilidade.test.ts`: dado um ponto com `linhaDeBase` de fatores todos `indisponivel`, o CSV gerado **não contém** as cadeias `7500`, `1.45`, `0.0117`, `0.12`, `Latossolo Vermelho` nem `Baixa` em nenhuma linha de dado, e contém `RUSLE_Fator_R: 0/1 disponiveis` no censo.
- Os 9 testes preexistentes do arquivo continuam passando. Se a asserção de colunas quebrar pelo censo, ela é ajustada **sem afrouxar** a verificação de esquema.

## T2 — Fechar o furo do varredor (Achado 2)

Em `src/lib/seguranca/padroesProibidos.test.ts`, acrescentar ao array `REGEX_PADROES`:

```ts
{ id: "coalescencia-com-numero-entre-aspas", regex: /\?\?\s*["'`]\s*[0-9]/ },
{ id: "ou-logico-com-numero-entre-aspas", regex: /\|\|\s*["'`]\s*[0-9]/ },
```

Mantenha intacto o mecanismo de exceção por comentário `// permitido:` com motivo de 20 caracteres ou mais (linhas 36-51) — ele é a válvula legítima e auditável.

Rodar o varredor sobre todo o `src`. **Toda** ocorrência exposta deve ser resolvida por uma das duas vias, nunca por supressão silenciosa:

- **via honesta:** trocar por `""` ou por `indisponivel` com causa e motivo formais;
- **via declarada:** manter com `// permitido: <motivo científico com fonte>`, quando o valor for efetivamente tabelado ou normativo.

Ocorrências já conhecidas a tratar: `src/lib/export/planilha.ts:144-145` (`Janela_Inicio`, `Janela_Fim`). A janela temporal de um ponto é metadado de aquisição, não constante do sistema: se `p.temporal?.D?.janela` não existe, a célula é vazia.

### Aceite de T2

- `npx vitest run src/lib/seguranca/padroesProibidos.test.ts` passa **com os dois novos padrões ativos**.
- Teste unitário do próprio varredor provando que `varrerLinha('x: a ?? "7500",', 1, 'f.ts')` retorna violação — a guarda deve ter prova de que detecta o que deixou passar.
- `npx vitest run` completo em verde.

## T3 — Card "Linha de Base RUSLE" no Inspetor (Achado 4)

Em `src/components/inspetor/InspetorPonto.tsx`, inserir um bloco após o grid de blocos biofísicos (após a linha 222, fechamento do grid Terreno/Pedologia) e antes de `{/* Série Temporal e Composto de Solo Exposto */}`.

**Reutilizar obrigatoriamente `SeloProveniencia`** (`src/components/inspetor/SeloProveniencia.tsx`), que já implementa os quatro selos da Regra 3 com a causa de indisponibilidade no expansor. Não criar componente de selo novo, não reimplementar ícones, não formatar valor por conta própria.

Idioma a seguir, idêntico ao bloco TERRENO (linhas 192-204):

```tsx
{/* Linha de Base RUSLE (Fase 8 — Invariante 1) */}
<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-3">
    LINHA DE BASE RUSLE — A = R · K · LS · C · P
  </h3>
  <div className="grid grid-cols-2 gap-3">
    <SeloProveniencia label="Fator R (erosividade)" proveniencia={ponto.linhaDeBase?.fatorR} unidade="MJ·mm·ha⁻¹·h⁻¹·ano⁻¹" />
    <SeloProveniencia label="Fator K (erodibilidade)" proveniencia={ponto.linhaDeBase?.fatorK} unidade="t·h·MJ⁻¹·mm⁻¹" />
    <SeloProveniencia label="Fator LS (topográfico)" proveniencia={ponto.linhaDeBase?.fatorLS} />
    <SeloProveniencia label="Fator C (cobertura)" proveniencia={ponto.linhaDeBase?.fatorC} />
    <SeloProveniencia label="Fator P (prática)" proveniencia={ponto.linhaDeBase?.fatorP} />
    <SeloProveniencia label="Perda de Solo A" proveniencia={ponto.linhaDeBase?.perdaSolo} unidade="t·ha⁻¹·ano⁻¹" />
  </div>
  {/* memória de cálculo quando existir; quando não existir, a causa do Invariante 1 */}
</div>
```

Requisitos de conteúdo:

1. Os seis campos sempre renderizados, inclusive quando `indisponivel` — a ausência é informação de defesa e não deve ser escondida.
2. `ponto.linhaDeBase?.memoriaCalculo` exibido em bloco monoespaçado quando não for `null`. Quando for `null`, exibir o `motivo` de `perdaSolo`, que já traz a lista de fatores retidos montada em `linhaDeBase.ts:149`.
3. Nota fixa de rodapé do card, citando a trava real: a retenção de `A` decorre do **Invariante 1** (`docs/design.md:73`), e as pendências de `R` e `LS` são as **Decisões D13 e D15**, com o texto lido de `REGISTRO_DECISOES.D13.titulo` e `.D15.titulo` — não redigido em literal no componente.
4. Se `ponto.linhaDeBase` for `undefined`, o card informa que a linha de base não foi montada para este ponto. Não renderizar card vazio sem explicação.
5. Nenhum cálculo no componente. Camada de apresentação apenas: qualquer aritmética de RUSLE em `.tsx` é rejeição imediata desta tarefa.

### Aceite de T3

- `npx tsc --noEmit` sem erro novo.
- `npm run build` conclui.
- Com um ponto selecionado, o card mostra `○ indisponível` em R, LS e A, cada um com sua causa (`decisao-pendente`) visível ao expandir o selo, e `□ tabelado` em P.
- Nenhuma string `RUSLE` nova com valor numérico fixo no componente.

## T4 — Evidência de verificação (Regra 8)

A Regra 8 (`docs/design.md:21`) exige arquivo físico de prova em `docs/verificacoes/`. Criar:

`docs/verificacoes/2026-09-26_fabricacao_fatores_rusle_pacote_reprodutibilidade.md`

Seguir o formato de `docs/verificacoes/2026-09-10_distorcao_projecao_declividade.md`: título, **Data**, **Contexto**, **Assunto**, seções numeradas com fundamentação.

Conteúdo mínimo:

1. O trecho original das linhas 147-153 com a fabricação, como registro histórico do estado anterior.
2. Demonstração de que `R = 7500` e `LS = 1,45` eram emitidos em 100% dos pontos, com a cadeia causal: `D13/D15 = "pendente"` → `linhaDeBase.ts` retém → `valorOuNulo` retorna `null` → `??` ativa o literal.
3. Demonstração quantitativa do efeito no produto final: com $K = 0{,}0117$, $C$ típico de Sistema Plantio Direto e $P = 1{,}0$, o valor de $A$ que um terceiro teria reconstruído a partir do CSV fabricado, versus a retenção correta. Mostre a conta.
4. A saída do varredor **antes** (12 testes verdes com a violação presente) e **depois** (violação detectada), colada literalmente.
5. Fundamentação da remoção do `fillna(0.0)`, com a referência de Chen & Guestrin (2016) e a razão física: zero em curvatura e em acúmulo de fluxo não é ausência, é afirmação de vertente retilínea sem área contribuinte.
6. Declaração explícita de que nenhuma decisão metodológica (D13, D15) foi tomada nesta correção.

## T5 — Commit

Um commit para T1 (Achados 1 e 3, atômicos), um para T2, um para T3 e T4. Mensagens em português, imperativo, escopo entre parênteses, corpo explicando a regra restaurada. Padrão do repositório: ver `git log --oneline -5`.

Sugestão para T1:

```
fix(reprodutibilidade): elimina fabricacao dos fatores RUSLE no Arquivo 01 e imputacao por zero no Arquivo 05 (Regra 1)
```

Cada mensagem de commit termina com a identificação do **executor real** — o nome e a versão do agente que de fato escreveu o código:

```
Co-Authored-By: <nome e versão do agente executor> <identificador>
```

**Proibido assinar com a identidade de outro agente.** Em particular, não use `Claude Opus 5`: esse identificador pertence ao agente de auditoria e especificação desta sequência, que não escreve o código das fases. Atribuir a ele trabalho que você executou corrompe o registro de proveniência que o pesquisador declarará academicamente. Use sempre a sua identidade, de forma idêntica em todos os seus commits — por exemplo `Co-Authored-By: Antigravity (Advanced Agentic Pair Programmer) <noreply@antigravity>`.

Não fazer `push`, não criar tag, não abrir PR sem autorização explícita do pesquisador.

---

# PARTE III — PROIBIÇÕES ABSOLUTAS

Estas proibições valem para toda a execução. Não são preferências de estilo: cada uma protege uma regra da Lei Fundamental ou uma decisão que pertence ao pesquisador, não ao agente.

## P1 — Não implementar o Fator R, o Fator LS nem a Perda de Solo A

`D13` e `D15` estão `pendente` em `src/config/decisoes.ts:139` e `:156`. A trava em `src/lib/rusle/linhaDeBase.ts:66-105` (bloco do Fator R na linha 66, bloco do Fator LS na linha 92) **é o comportamento correto e deve permanecer intacta**. Destravá-la exige que o pesquisador altere `estado` para `"decidida"` e preencha `valor`, `justificativa`, `referencia`, `decididoPor` e `decididoEm` — ato dele, registrado em commit próprio.

Não alterar `linhaDeBase.ts`, `fatorC.ts`, `fatorK.ts` nem `rusle.test.ts` nesta execução.

## P2 — Não adotar a formulação de R por latitude, longitude e elevação

Foi proposta ao pesquisador uma ativação de `R` por equação multivariada atribuída a Mello et al. (2013), função de latitude, longitude e elevação. **Rejeitada**, por três razões que o agente deve conhecer para não reintroduzi-la.

Registre-se antes: essa referência chegou por sugestão externa e **não foi conferida contra a fonte primária** nesta análise — ela não consta de `src/config/decisoes.ts` nem de `docs/planejamento/DECISOES.md`. O agente não deve tratá-la como referência validada do projeto.

1. **Contradiz a proposta madura já registrada.** `D13` documenta erosividade regional do Paraná por série pluviométrica CHIRPS/IMERG — Waltrick et al. (2015) e Oliveira et al. (2013) (`src/config/decisoes.ts:144`; `docs/planejamento/DECISOES.md:223`; `docs/planejamento/implementation_plan_v3.md:185`).
2. **Injetaria coordenada na matriz de treino.** `RUSLE_Fator_R` é coluna permitida em `matriz-treino` (`src/lib/matriz/perfis.ts:153-154`) e preditor efetivo do Arquivo 05 (`pacoteReprodutibilidade.ts:537`). Um `R` que seja $f(\text{lat}, \text{lon}, \text{elev})$ é proxy de coordenada e viola a **Regra 6**: *"Coordenadas não entram na matriz de treino tabular para evitar que o algoritmo aprenda localização espacial em vez de processo físico"* (`docs/design.md:20`). A rota CHIRPS/IMERG não tem esse defeito, pois deriva de chuva medida.
3. Um $R$ climatológico derivado de posição não é grandeza medida no ponto, e seu selo `◊ modelado` não sanaria o vazamento espacial no classificador.

## P3 — Não calcular LS com comprimento de rampa constante

Foi proposto `LS` por Moore & Burch (1986) com rampa fixa $L_0 = 30\text{ m}$ (pixel do Copernicus GLO-30). **Rejeitado.**

`D15` registra Desmet & Govers (1996) com área de contribuição específica bidimensional em EPSG:31982 e expoentes de McCool et al. (1989) (`src/config/decisoes.ts:160-161`). E o planejamento veta o atalho em letra: *"`As` real do acúmulo de fluxo. **Não** usar constante de 10 m²/m como padrão silencioso"* (`docs/planejamento/historico/PROMPT_NOVO_PROJETO_2026-09-08.md:324`).

**Pré-condição material:** `acumuloFluxo` é `indisponivel` na origem, com motivo *"Direção de fluxo D8 em processamento"* (`src/app/api/gee/select-candidates/route.ts:812-815`), e `twi` idem. Sem $A_s$ real não existe Desmet & Govers. A rampa constante é contorno do insumo ausente, não escolha de modelagem. Sequência obrigatória: **D8 e $A_s$ no GEE → decisão D15 → Fator LS → Perda de Solo A.**

## P4 — Não alterar as listas de permissão de exportação

`src/lib/matriz/perfis.ts` materializa o Invariante 2. Não acrescentar nem remover coluna de `matriz-treino`, `planilha` ou qualquer perfil nesta execução.

## P5 — Não remover Latitude e Longitude do Arquivo 01 por iniciativa própria

Achado colateral, **a decidir pelo pesquisador, não pelo agente**: `gerarCsvMatrizTreinamento` declara lista própria de colunas (linhas 82-118) em vez de consumir `obterColunasPermitidas("matriz-treino")`, e inclui `Latitude`, `Longitude`, `Latitude_DMS`, `Longitude_DMS`, `Municipio`, `Codigo_IBGE`, `RUSLE_Fator_LS` e `RUSLE_Fator_C` — nenhuma delas presente na lista de permissão de `matriz-treino` (`perfis.ts:130-161`).

Atenuante verificado: o Arquivo 05 seleciona explicitamente `colunas_preditoras` sem coordenada, sem `LS` e sem `C` (linhas 535-538), portanto **a matriz $X$ efetivamente ajustada não contém coordenada**. O risco é de nomenclatura e de uso por terceiro: o arquivo se chama "Matriz de Preditores para Treinamento" e entrega coordenada a uma equipe de modelagem externa.

Remover as colunas pode prejudicar a reprodutibilidade FAIR do compêndio; mantê-las com esse nome convida a crítica de vazamento espacial. As duas saídas são legítimas e a escolha é metodológica:

- **(i)** renomear o artefato para "Compêndio de Reprodutibilidade" e declarar no cabeçalho que coordenada é metadado de rastreio, **não** preditor; ou
- **(ii)** cindir em dois arquivos: compêndio com coordenada, e matriz de treino estrita derivada de `obterColunasPermitidas("matriz-treino")`.

**Ação do agente:** apenas registrar o achado no relatório final com as duas alternativas e o custo de cada uma. Não executar nenhuma das duas.

## P6 — Não tocar em SAREL 1 e em dados legados

Nada em `legado/`, `docs/legado/` ou em dados de SAREL 1. A reconstrução vive em `sarel/v2` (Regra 9).

## P7 — Nenhuma asserção sem prova

Proibido escrever, em comentário, mensagem de commit ou relatório, que algo foi verificado sem o artefato correspondente em `docs/verificacoes/` (Regra 8). Proibido relatar teste como passando sem colar a saída do `vitest`.

---

# PARTE IV — RELATÓRIO FINAL EXIGIDO

Ao concluir, entregue em uma única mensagem:

1. **Reprodução dos 4 achados** — evidência bruta de cada um, com linha, antes de qualquer edição.
2. **Diff completo** por arquivo tocado.
3. **Saída literal** de `npx vitest run`, `npx tsc --noEmit` e `npm run build`.
4. **Prova do Achado 1 corrigido** — CSV gerado a partir de um ponto com todos os fatores `indisponivel`, mostrando células vazias e o censo de proveniência.
5. **Censo real** dos fatores sobre o conjunto de pontos de teste do repositório.
6. **Registro do achado colateral P5**, com as duas alternativas e sem execução.
7. **Declaração explícita** de que D13 e D15 permanecem `pendente` e que nenhum valor de R, LS ou A foi produzido.
8. **Lista do que não foi feito** e por qual proibição.

Se qualquer item não puder ser cumprido, diga qual e por quê. Relato de conclusão parcial é aceitável; relato de conclusão inexistente não é.

---

## Referências normativas do sistema

- **Regras 1 a 9 e Invariantes 1 e 2:** `docs/design.md:14-22` e `:73-74`
- **Registro de decisões:** `src/config/decisoes.ts`
- **Ficha técnica:** `docs/FICHA_TECNICA_SAREL.md:177-178`
- **Prompt de reconstrução:** `docs/planejamento/PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md`

## Referências científicas citadas neste prompt

- Chen, T. & Guestrin, C. (2016). XGBoost: A Scalable Tree Boosting System. *Proceedings of KDD 2016*, 785-794. (Seção 3.4, tratamento nativo de ausência)
- Desmet, P. J. J. & Govers, G. (1996). A GIS procedure for automatically calculating the USLE LS factor on topographically complex landscape units. *Journal of Soil and Water Conservation*, 51(5), 427-433.
- McCool, D. K. et al. (1989). Revised slope length factor for the Universal Soil Loss Equation. *Transactions of the ASAE*, 32(5), 1571-1576.
- Mannigel, A. R. et al. (2002). Fator erodibilidade e tolerância de perda dos solos do Estado de São Paulo. *Revista Brasileira de Ciência do Solo*, 26, 1039-1049.
- Renard, K. G. et al. (1997). *Predicting Soil Erosion by Water: RUSLE*. USDA-ARS, Agriculture Handbook 703.
- Waltrick, P. C. et al. (2015). Erosividade de chuvas no Paraná: atualização, influência do El Niño e La Niña e estimativa para cenários climáticos futuros. *Revista Brasileira de Ciência do Solo*, 39(1), 256-267.
- Wilkinson, M. D. et al. (2016). The FAIR Guiding Principles for scientific data management and stewardship. *Scientific Data*, 3, 160018.
