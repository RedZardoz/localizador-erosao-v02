# Prompt de Execução — Atualização do front-end à metodologia vigente

**Data:** 02/10/2026
**Escopo:** `src/components/` e `src/app/page.tsx`. 31 componentes, aplicação de página única.
**Levantamento:** feito antes de escrever; os achados estão na PARTE 0 com arquivo e linha.

**Ordem:** J1 é defeito de integridade e vem primeiro. J2 e J3 alinham a interface à metodologia. J4 é a generalização pedida pelo pesquisador, e é escopada à parte de propósito.

---

# PARTE 0 — O LEVANTAMENTO

## J1 — A tela de rótulo viola o protocolo cego, e se declara cega

**É o achado mais grave, e não é desatualização.**

`src/components/inspetor/InspetorPonto.tsx:35` define `salvarRotuloHumano()`, que **grava o rótulo**:

```ts
const novoRotulo = {
  classe: classeRotuloInput,
  observador: observadorInput.trim() || "Pesquisador PPGTCA",
  observadoEm: hoje,
  cego: true,                    // literal
  confianca: confiancaInput,
};
definirRotuloConsolidado(ponto.codigo, {
  final: novoRotulo,
  papelConjunto: "treino",       // literal
  kappa: null,
  divergencia: "nenhuma",
});
```

E a **mesma tela** exibe:

- linha **136**: `Estrato: {ponto.estratoId}`
- linha **143**: `Ponto amostral estratificado (S tercil … × E tercil … × K nível …)`
- linha **511**: `Cego: Sim`

Quem registra o rótulo vê a estratificação completa, e o rótulo sai **certificado como cego**. Isso é pior que não certificar, porque nada a jusante voltará a questionar.

Há ainda três literais que afirmam o que não foi estabelecido: `papelConjunto: "treino"` manda todo rótulo desta tela para o treino, contornando a designação de D16; e `kappa: null` com `divergencia: "nenhuma"` afirmam concordância sem haver segunda observação.

É o mesmo defeito que o prompt do coletor Android já apontou — `cego` fixo em código torna a afirmação não verificável — e que no aplicativo web nunca foi corrigido.

## J2 — A campanha reflete o desenho anterior à inversão de D16

`src/components/campanha/PainelCampanha.tsx`:

- aba `"kobo"` com download de template e `ingestarSubmissoesKobo` — **D16 item 5 substituiu o KoboCollect pelo SAREL Coletor**;
- aba padrão `"padrao-ouro"`, rotulada *"Validação Padrão-Ouro (VANT Multiespectral Spectral 2)"* — sob D16 **o VANT deixou de ser padrão-ouro de validação e passou a ser a MASSA DE TREINO**;
- `fotointerpret` aparece em 2 arquivos — **D16 item 4 aposentou a fotointerpretação**.

A interface descreve o estudo anterior à inversão de papéis.

## J3 — O alvo contínuo de D26 não existe na interface

Busquei nos 31 componentes:

| Termo | Ocorrências |
|---|---|
| `fracaoErodida` | **0** |
| `Tweedie` | **0** |
| `Spearman` | **0** |

D26 fixou como **alvo primário** a fração contínua da célula delineada como erodida, com objetivo Tweedie e comparação por correlação de postos. **Nada disso aparece.** A interface ainda pressupõe rótulo de classe.

## J4 — O acoplamento à bacia é modesto e concentrado

Ocorrências de coordenadas da BP3 ou do nome da bacia:

```
region/RegionRequestModal.tsx      14
map/MapViewer.tsx                   3
campanha/PainelCampanha.tsx         3
mapa/MapaAmostral.tsx               2
region/CandidateSelectionModal.tsx  2
decisoes/CalculadoraDesenhoAmostral.tsx  1
```

São 25 ocorrências em 6 arquivos, metade num só modal. A generalização é viável.

---

# PARTE I — J1: A TELA DE RÓTULO

**Primeiro, porque pode contaminar rótulo assim que a coleta começar.**

1. **`cego` deixa de ser literal e passa a ser DERIVADO** do que a tela efetivamente exibiu durante o registro. Se a tela mostrou estrato, tercil, nível de K, escore de suscetibilidade, `scoreJev` ou predição, então `cego` é **falso** — e o rótulo carrega isso.
2. **Separe as duas telas.** Registrar rótulo e inspecionar o ponto são atividades incompatíveis:
   - **Modo de registro** — mostra código do ponto, coordenada, imagem e os campos de observação. **Nada mais.**
   - **Modo de inspeção** — mostra tudo: estrato, proveniências, série temporal, laudo. **Não permite gravar rótulo.**
   O mesmo componente pode servir aos dois, desde que o modo seja explícito e o botão de salvar **não exista** no modo de inspeção.
3. **`papelConjunto` deixa de ser literal.** Vem da designação de D16 registrada no selo do sorteio, ou é `indisponivel`. Nunca `"treino"` por padrão.
4. **`kappa: null` com `divergencia: "nenhuma"`** é afirmação sem base. Sem segunda observação, a divergência é `indisponivel`, não `"nenhuma"`.
5. **Teste** que assevere: no modo de registro, nenhum campo de `CAMPOS_PROIBIDOS_MATRIZ_TREINO` nem `estratoId` é renderizado; e que `cego` só sai verdadeiro quando isso se verifica.

---

# PARTE II — J2: ALINHAR A CAMPANHA A D16

1. **Remova a aba Kobo** e o acoplamento a `ingestaoKobo`. O instrumento é o **SAREL Coletor**, cujo CSV tem 28 colunas mais as de qualidade posicional. A ingestão passa a ser a dele.
2. **Reenquadre a aba "padrão-ouro".** Sob D16 o VANT é a **massa de treino e o teste independente**; o campo é **âncora de prevalência e confirmação prospectiva**. A aba deve refletir os três conjuntos de D16:
   - **72 polígonos de VANT**, 4 por estrato, 2 de treino e 2 de held-out
   - **60 a 80 pontos de campo**, fora dos polígonos, para prevalência
   - **confirmação prospectiva**, posterior ao modelo
3. **Retire a fotointerpretação** dos 2 arquivos em que aparece, com nota de que D16 item 4 a aposentou — não apague em silêncio, porque alguém vai procurar.
4. Nada disso deve apagar histórico: se houver dado antigo de Kobo ou de fotointerpretação, mova para visualização de legado e marque como superado, conforme a orientação de legado que o pesquisador já deu.

---

# PARTE III — J3: TRAZER O ALVO CONTÍNUO E O CRITÉRIO DE REFUTAÇÃO

A interface precisa mostrar o que a pesquisa de fato mede hoje.

**Fração erodida (D26).** Onde hoje há classe de rótulo, passe a exibir a **fração contínua [0, 1]** da célula delineada, com o binário derivado a 25% como **secundário e assim rotulado**. A hierarquia entre primário e secundário é fixada por D26 e não pode ser invertida na interface.

**Critério de refutação (D25).** Um painel que mostre, quando houver avaliação: ρ de Spearman dos três competidores, o piso de 0,40, a margem de 0,10, e **qual dos três desfechos** — corroborada, inconclusiva, refutada — com o intervalo de confiança por bootstrap agrupado por polígono.

Enquanto não houver avaliação, o painel diz **"não avaliado"**. Não antecipe resultado.

**Regime de dados (D24).** Mostrar o teto de preditores por bloco — espectro-temporal 8, terreno 4, solo 1, chuva 1 — e as unidades efetivas correntes. É o que torna visível, para quem avalia, que três dos quatro blocos operam abaixo do regime recomendado.

**Estado do sorteio.** `PainelSorteioD16.tsx` já existe. Garanta que ele exibe o estado real — hoje **BLOQUEADO**, por Ê não medido — lendo do artefato, não de literal.

---

# PARTE IV — J4: GENERALIZAÇÃO, ESCOPADA

O pesquisador quer que isto sirva de **pré-modelo para um aplicativo preditivo de uso mais geral**, aplicável a outras áreas caso a hipótese se valide. É objetivo legítimo e vale preparar o terreno — **sem** transformar a pesquisa num produto antes de a pesquisa terminar.

## A distinção que estrutura tudo

Separe, de forma explícita no código e na interface:

**O MÉTODO**, que é invariante e vale em qualquer área: os cinco fatores do RUSLE, a disciplina de proveniência, o protocolo cego, a estratificação por Ŝ × Ê × K̂, a avaliação em held-out agrupado, e as guardas anticircularidade.

**OS PARÂMETROS DESTE ESTUDO**, que são da Bacia do Paraná 3: o recorte espacial, os limiares de tercil, o tamanho do polígono, as cartas pedológicas usadas, o domínio de declividade.

Hoje os dois estão misturados — inclusive dentro de `decisoes.ts`, onde decisões de método carregam valores específicos da bacia.

## O que fazer agora, e só isso

1. **Área de interesse como parâmetro de primeira classe.** Extraia as 25 ocorrências de coordenadas da BP3 para uma configuração única de área, com a BP3 como instância. Concentre-se em `RegionRequestModal.tsx`, que tem 14 das 25.
2. **Na interface, rotule o que é do estudo.** Onde um número vier dos parâmetros da BP3, mostre-o como tal — "nesta bacia" em lugar de apresentá-lo como propriedade do método.
3. **Não generalize `decisoes.ts`.** É território do pesquisador por P8, e separar método de parâmetro ali é decisão metodológica, não refatoração. **Relate** onde a mistura ocorre e deixe a proposta; não execute.
4. **Não construa o modo preditivo para outras áreas agora.** Ele depende de um modelo validado, que depende de D25, que depende da campanha. Construí-lo antes seria construir sobre hipótese não testada.

## A linha de funcionamento permanece

O pesquisador pediu explicitamente para **manter a mesma linha de funcionamento**. Não redesenhe a navegação, não troque a biblioteca de mapa, não reorganize a barra lateral. As mudanças são de **conteúdo e de integridade**, não de forma.

---

# PARTE V — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `src/config/decisoes.ts` proibido, inclusive em J4.
- **Não apague histórico** de Kobo ou fotointerpretação; mova para legado e marque.
- **Não exiba** estrato, tercil, nível de K ou escore na tela de registro de rótulo.
- **Não antecipe resultado** de D25 em painel algum.
- **Não redesenhe** a navegação nem a identidade visual.
- **Não construa** o modo preditivo para outras áreas.
- **Não execute o sorteio.**

---

# PARTE VI — RELATÓRIO

Gerado por `scripts/gerar_relatorio_fase.ts`. Na seção de juízo:

1. Como `cego` passou a ser derivado, e a saída do teste que assevera a separação entre registro e inspeção.
2. O que foi feito com `papelConjunto`, `kappa` e `divergencia`.
3. O destino do que era Kobo e fotointerpretação, e onde o legado ficou acessível.
4. Como a fração contínua e o critério de refutação aparecem, e o que a interface mostra enquanto não há avaliação.
5. Quantas das 25 ocorrências da BP3 foram extraídas para configuração, e onde a mistura entre método e parâmetro permanece — com a proposta, sem execução.

---

## Nota

J1 não é desatualização: é a mesma família de defeito que esta pesquisa vem corrigindo há duas semanas — **afirmar uma propriedade em lugar de estabelecê-la**. `cego: true` escrito à mão numa tela que exibe o estrato é exatamente o `amostradorGLO30` em outra forma.

E a ambição de generalizar é boa, mas tem ordem: **o que torna este sistema reaproveitável não é a interface, é a disciplina de proveniência.** Um aplicativo que diga "não medido" quando não mediu vale para qualquer bacia. Um que preencha a lacuna não vale nem para esta.
