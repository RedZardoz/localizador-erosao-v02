# Decisões propostas D27 e D28 — 2026-10-06

**Estado: `proposta`.** Nenhuma das duas está decidida. Só o pesquisador marca `decidida`, com data e assinatura, conforme a Regra 9.

Este arquivo é rascunho de verbete. Não escrevi em `src/config/decisoes.ts` nem em `docs/planejamento/DECISOES.md` porque a auditoria da Parte 1 (achado A11) encontrou divergência de estado entre os dois: nove decisões constam `proposta` no `.md` e `decidida` no `.ts`, e D20 a D26 não existem no `.md`. Escrever em só um dos lados agravaria a divergência. Quando você decidir, os dois recebem o mesmo texto na mesma mudança.

**Origem:** verificação das 9 Regras Invioláveis contra as decisões vigentes, em 2026-10-06, sobre o commit `5f7c033`. As duas questões abaixo são conflitos entre regra e decisão que o código não tem como resolver sozinho.

---

## D27 — Mecanismo de segregação entre treino e teste depois da inversão de papéis da D16

> **ABSORVIDA EM 2026-10-06 PELA DEC-4 do prompt de correção.** Depois de escrever este verbete, li `docs/planejamento/PROMPT_CORRECAO_POS_AUDITORIA_2026-10-05.md` (branch `claude/affectionate-galileo-8abtjo`). A DEC-4 cobre o mesmo conflito e está mais bem construída: traz três opções e cita `papelConjunto`, `sitiosReferencia.ts` e `PainelCampanha.tsx:377-404`, que mostram que a interface já segue a D16 emendada enquanto o `montagem.ts` segue a regra antiga — âncoras que eu não tinha.
>
> **Não abra uma D27 separada.** Duas decisões concorrentes sobre a mesma questão produziriam exatamente a divergência que o achado A11 registra. Decida pela DEC-4.
>
> O que este verbete acrescentou e já foi transportado para a DEC-4, opção (a), no commit `f589670`: a lista de polígonos held-out precisa ser **congelada e registrada com hash antes de qualquer treino**. As palavras "congelar", "pré-registrar" e "antes de qualquer treino" tinham zero ocorrências no prompt original.
>
> O texto abaixo fica como registro do raciocínio. A **D28 continua de pé** e virou a DEC-17 no mesmo commit.

### O conflito, medido

| Fonte | O que diz |
|---|---|
| Regra 6 (`docs/design.md:19`) | Segregação cega de exportação; o drone é held-out |
| Tabela de design (`docs/design.md:41`) | "Conjunto Held-Out \| Voo de drone \| ... nunca entra no treino" |
| Código (`src/lib/matriz/montagem.ts:195-198`) | `if (rotulo.modalidade === "drone") { heldOutDrone.push(linha); continue; }` |
| **D16, decidida (`src/config/decisoes.ts:208`)** | "o VANT **deixa de ser exclusivamente held-out e passa a ser a MASSA DE TREINO e o TESTE INDEPENDENTE**" |

A regra, a tabela e o código dizem uma coisa. A decisão vigente diz outra. Com a D16 em vigor, a matriz de treino exclui exatamente o dado que deveria treiná-la.

### O que está realmente em jogo

O propósito da Regra 6 continua válido: **não treinar e testar sobre a mesma unidade espacial**. O que caducou foi o mecanismo. Separar por *modalidade* fazia sentido quando o drone era só held-out. Com a D16, a unidade que precisa ser separada é o *polígono*.

### Opções

**Opção A — segregação por polígono.** A Regra 6 passa a dizer que o que separa treino de teste é a lista congelada de polígonos held-out da D25, não a modalidade do rótulo. Reescrever `design.md:19` e `design.md:41`; `montagem.ts:195-198` passa a rotear por lista de polígonos em vez de descartar por modalidade.

- *Ganho:* o desenho da D16 passa a ser executável. Entram na ordem de 1.800 unidades independentes, contra 200 positivos do desenho por pontos, o que tira o classificador do regime subdimensionado que a D24 registra.
- *Custo:* perde-se uma salvaguarda simples e mecânica ("drone nunca entra") e passa-se a depender de uma lista. Lista pode ser escolhida depois de ver resultado, e esse risco é pior do que o que a Regra 6 evitava.
- *Salvaguarda obrigatória se escolher A:* a lista dos polígonos held-out é **congelada e registrada com hash no repositório antes de qualquer treino**, e a D25 já exige avaliação uma única vez. Sem a lista congelada e datada, a Opção A degrada a garantia em vez de trocá-la.

**Opção B — manter a Regra 6 e revisar a D16.** O drone volta a ser held-out exclusivo e a massa de treino volta ao campo e à fotointerpretação.

- *Ganho:* a salvaguarda mecânica permanece, e nada no código muda.
- *Custo:* descarta as três medições que sustentam a D16 — CE90 de 1,47 m contra 3 a 8 m do GNSS de campo, acerto de atribuição ao pixel subindo de cerca de 37% para cerca de 78%, e o volume de unidades independentes. Volta ao regime subdimensionado da D24 e reabre a necessidade de dois intérpretes e da maquinaria de concordância que a D16 aposentou.

### O que não decide nada

Qualquer que seja a escolha, **regra, tabela e código passam a dizer a mesma coisa**. Hoje não dizem, e isso é defeito em qualquer das duas hipóteses.

### Verbete para `decisoes.ts` quando decidir

```ts
  D27: {
    id: "D27",
    titulo: "Mecanismo de segregação treino/teste após a inversão de papéis da D16",
    estado: "proposta" as EstadoDecisao,
    valor: "<A OU B, redigido depois da escolha>",
    justificativa: "<a redigir>",
    referencia:
      "docs/design.md:19 e :41 (Regra 6 e tabela do held-out); src/lib/matriz/montagem.ts:195-198; D16 (inversão de papéis); D25 (avaliação única sobre os polígonos held-out); docs/auditorias/AUDITORIA_PARTE1_2026-10-05.md, achado A29",
    decididoPor: "",
    decididoEm: "",
  },
```

---

## D28 — Identificador de polígono na matriz de treino

> **MANTIDA. Virou a DEC-17 do prompt de correção em 2026-10-06 (commit `f589670`).** O prompt original não tratava desta questão: a palavra "bootstrap" tinha zero ocorrências nele, e uma só no relatório da Parte 2. A Parte 1 havia registrado a ausência na linha D25 do achado A29, mas o A29 foi roteado para DEC-3 e DEC-4, e nenhuma das duas trata da unidade de reamostragem. A tabela de rastreio ficou satisfeita no nível do número do achado, enquanto este componente se perdia dentro dele.

### O conflito, medido

A D25 exige "bootstrap cuja unidade é o polígono". As 30 colunas do perfil `matriz-treino` (`src/lib/matriz/perfis.ts:135-168`) são:

`Ponto_ID, Bloco_Espacial, Elevacao_m, Declividade_pct, Declividade_graus, Curvatura_Perfil, Curvatura_Plana, Acumulo_Fluxo, TWI, Ordem_Solo, Subordem_Solo, Grande_Grupo_Solo, Erodibilidade_Classe, Frequencia_Solo_Nu, Banda_B2, Banda_B4, Banda_B8, Banda_B12, NDVI, BSI, RUSLE_Fator_K, RUSLE_Fator_R, Precip_Acum_30d_mm, Precip_Acum_90d_mm, I30_Max_mm_h, N_Eventos_Erosivos, Indice_Mecanismo, Classe_Alvo_Binaria, Rotulo_Classe, Rotulo_Modalidade`

Não há identificador de polígono. Sem ele, o bootstrap da D25 não tem unidade de reamostragem.

### A leitura que está bloqueando

A Regra 6 diz que "coordenadas não entram na matriz de treino tabular para evitar que o algoritmo aprenda localização espacial em vez de processo físico". A ausência de identificador de polígono vem de ler isso como "nenhum identificador espacial entra".

Essa leitura é mais restritiva do que o texto exige e não compra pureza: um identificador **opaco** de polígono não é coordenada, não é preditor e não ensina localização ao modelo. É chave de agrupamento, exatamente como `Bloco_Espacial`, que já está na matriz e já é espacial. O precedente está no próprio perfil.

### Independência em relação à D27

Esta decisão **não depende** de como a D27 se resolve. Na Opção B da D27 a avaliação continua sendo sobre os polígonos held-out da D25, e a unidade do bootstrap continua sendo o polígono. O que muda é só o artefato onde a coluna precisa estar: a matriz de treino na Opção A, o artefato de avaliação na Opção B.

### Opções

**Opção A — incluir coluna opaca `Poligono_ID`.** Acrescentar à lista de permissão do perfil, atualizar o Invariante 2 e excluí-la explicitamente de X no script de treino, como já se faz com `Bloco_Espacial`.

- *Condições para que não vire porta de vazamento:*
  1. O identificador é opaco e não permite reconstruir localização, nem por ordenação, nem por faixa numérica, nem por correspondência com o `Codigo` do sorteio.
  2. Teste de regressão que falha se a coluna entrar como preditor.
  3. Teste de regressão que falha se a coordenada for reconstruível a partir do identificador.
- *Custo:* mexe na lista de permissão do Invariante 2, que é barreira de exportação. Toda mudança ali precisa de teste.

**Opção B — não incluir.** O bootstrap por polígono fica inviável e a D25 precisa ser revisada, trocando a unidade de reamostragem por outra, ou abrindo mão do bootstrap.

- *Custo:* a D25 é o critério de refutação pré-registrado. Alterá-la depois de ver resultado compromete o pré-registro, então, se for esta a escolha, ela precisa ser feita **antes** de qualquer avaliação.

### Verbete para `decisoes.ts` quando decidir

```ts
  D28: {
    id: "D28",
    titulo: "Identificador de polígono na matriz de treino como unidade de agrupamento",
    estado: "proposta" as EstadoDecisao,
    valor: "<A OU B, redigido depois da escolha>",
    justificativa: "<a redigir>",
    referencia:
      "src/lib/matriz/perfis.ts:135-168 (30 colunas do perfil matriz-treino); docs/design.md:19 (Regra 6, coordenadas fora da matriz); D25 (bootstrap cuja unidade é o polígono); precedente de Bloco_Espacial no mesmo perfil; docs/auditorias/AUDITORIA_PARTE1_2026-10-05.md, achado A29",
    decididoPor: "",
    decididoEm: "",
  },
```

---

## O que eu verifiquei e o que não verifiquei

**Verificado em 2026-10-06, sobre `5f7c033`:** as linhas das regras em `design.md` (14 a 22), a linha 41 da tabela do held-out, o descarte por modalidade em `montagem.ts:195-198`, o título e o trecho de abertura da D16 em `decisoes.ts:208`, as 30 colunas do perfil `matriz-treino` e a ausência de qualquer `Poligono_ID` em `src/lib/matriz/`.

**Não verificado:** o texto integral da D25 e da D16, que li só em parte; se a UI ou alguma rota já carrega identificador de polígono fora da matriz; e os números citados na justificativa da D16 (CE90 de 1,47 m, 37% para 78%, cerca de 1.800 unidades), que reproduzo como constam na decisão, sem conferir contra `docs/verificacoes/voo/cobertura_voos.geojson`.

**Correção de âncora:** em conversa anterior citei a linha da tabela do held-out como `design.md:38`. O correto é `design.md:41`.
