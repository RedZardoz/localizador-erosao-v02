# Material de Decisão — Organização da Interface do SAREL

**Data:** 11/11/2026 · **Base:** commit `38932a3` · **Autor:** planejador, por levantamento direto do código
**Natureza:** material para decisão do pesquisador. **Nenhuma alteração foi feita.**

---

## 1. A pergunta

A interface parece desconexa das funcionalidades atuais: o sorteio não é encontrável, não há onde
baixar polígonos nem planos de voo, e o tour recém-atualizado aponta para elementos que não existem.

A decisão é: **reformar a interface existente, construir uma nova casca de navegação sobre ela, ou
refazê-la.**

---

## 2. O levantamento

### 2.1 Arquitetura atual

Aplicação de página única: `src/app/page.tsx` monta `Header`, `Sidebar` e `MapViewer`, e sobre eles
**oito modais**. Não há rotas; tudo é modal sobre o mapa.

| Camada | Arquivos | Linhas |
|---|---:|---:|
| Interface (`src/components` + `src/app`) | 62 | 15.036 |
| Motor (`src/lib`, sem testes) | 167 | 24.098 |
| Suíte de testes | 112 | — |

Maiores componentes: `PainelCampanha` (919), `RegionRequestModal` (916), `MapViewer` (786),
`InspetorPonto` (769), `Header` (602).

### 2.2 O achado central

**Quase tudo existe. A organização é que esconde.** A navegação do cabeçalho está ordenada por
**módulo técnico** — Amostragem GEE, Campanha & Rótulos, Matriz de Treino, Governança — e não pelo
**fluxo de trabalho da pesquisa**. Daí a impressão de desconexão.

Dois exemplos medidos:

- **O sorteio de D16 existe e é renderizado**, mas dentro de `DecisoesModal.tsx:105` — um modal
  chamado "Decisões da Pesquisa". Quem procura o sorteio não abre "Decisões".
- **A ingestão de campo existe e está ligada**: `PainelCampanha.tsx` importa `ingestaoKobo` e tem
  duas entradas de arquivo (`type="file"`, linhas 725 e 879), com 45 menções ao Coletor e 23 ao
  Kobo. Está dentro de "Campanha & Rótulos", que é razoável, mas não é óbvio que ali se *importa*.

### 2.3 O fluxo operacional e onde cada etapa vive hoje

| # | Etapa da pesquisa | Onde está | Encontrável? |
|---|---|---|---|
| 1 | Delimitar a área de interesse | `RegionRequestModal` | sim — botão próprio |
| 2 | Triar candidatos por critério espectral | Amostragem GEE | sim — botão próprio |
| 3 | Medir declividade, erodibilidade e exposição de solo | parcial | **Ê não tem superfície** |
| 4 | Estratificar e sortear os polígonos | `PainelSorteioD16` | **enterrado em "Decisões"** |
| 5 | Planejar os voos de VANT | — | **ausente da interface** |
| 6 | Coletar em campo (SAREL Coletor / Kobo) | `PainelCampanha` | sim, mas pouco óbvio |
| 7 | Montar a matriz e treinar | `PainelMatrizModal` | sim — botão próprio |
| 8 | Auditar, selar e exportar | `AuditDossierModal`, `ExportModal` | sim |

### 2.4 O que está genuinamente ausente

1. **Planos de voo.** `git grep` por `plano de voo`, `planoVoo`, `.plan`, `QGroundControl` e
   `waypoint` em `src/components` não devolve **nenhum** resultado. Os arquivos `.plan` são gerados
   por `src/lib/drone/planoVooNControl.ts` e por script. **A interface não os gera nem os baixa.**
2. **Download dos polígonos sorteados.** A exportação oferece XLSX, CSV, GeoJSON e ZIP, mas o
   GeoJSON é **de pontos amostrais**, não dos 67 polígonos do selo.
3. **Quatro âncoras do tour.** Os passos `mascara-solo-geos3`, `frequencia-solo-nu-e`,
   `sorteio-d16-realizado` e `cadeia-verificacao` apontam para `data-metodologia` que não existe em
   componente algum. Na apresentação, o holofote não terá o que destacar.
4. **Superfície para a dimensão Ê e para a máscara GEOS3** — o trabalho central das últimas duas
   semanas não aparece em tela.

---

## 3. Reformar, encapar ou refazer

### 3.1 O que está em jogo

O **motor não é afetado** por nenhuma das opções: 167 arquivos e 24 mil linhas em `src/lib`, com a
maior parte dos 112 arquivos de teste. Ele fica onde está.

O que está em jogo são as **15 mil linhas da interface** — e, dentro delas, guardas que levaram
meses para existir: a recusa de pontos sintéticos na exportação, o tratamento de proveniência nos
popups, os modos cegos de campo e de interpretação, a via de credencial da Regra C1 pelo painel, a
trava de paridade G08/G09 recém-instalada e as âncoras do tour.

### 3.2 As três opções

**(A) Reforma mínima.** Renomear e reagrupar botões do cabeçalho, promover o sorteio a item próprio,
construir as três ausências reais (planos de voo, polígonos, âncoras do tour).

- *Custo:* baixo. *Risco:* baixo. *Resultado:* funcional, mas a organização continua por módulo.

**(B) Nova casca de navegação sobre os painéis existentes.** Criar uma barra de fluxo operacional
com as oito etapas da seção 2.3, numeradas, cada uma indicando seu estado — concluída, disponível,
bloqueada e por quê. Os painéis existentes são **reaproveitados sem alteração interna**; a casca
apenas os abre na ordem certa e mostra onde a pesquisa está.

- *Custo:* médio. *Risco:* baixo — nada do que existe é removido.
- *Resultado:* a interface passa a ensinar o método enquanto é operada, que é o que se pede de uma
  apresentação de dissertação.

**(C) Refazer a interface.** Reconstruir do zero com a organização desejada.

- *Custo:* alto — 15 mil linhas. *Risco:* **alto**.
- O risco não é de prazo, é de **perder guardas sem perceber**. Cada uma das proteções da seção 3.1
  existe porque um problema real apareceu. Numa reconstrução, elas não se perdem por decisão; se
  perdem por omissão, e o sintoma aparece meses depois, em dado já coletado.

### 3.3 Recomendação

**Opção (B).** A funcionalidade está completa; o defeito é de navegação, e defeito de navegação se
corrige com navegação. Refazer trocaria um problema de organização, que é visível e barato, por um
risco de regressão silenciosa, que é invisível e caro.

A casca de fluxo entrega o que se pediu — prático, visual e didático — porque o fluxo **é** o
método: quem percorre as oito etapas na ordem está percorrendo a metodologia da dissertação. E o
tour deixa de ser um roteiro paralelo à interface para virar a narração dela.

---

## 4. Esboço da casca de fluxo, caso a opção (B) seja escolhida

Uma barra horizontal com oito etapas numeradas, sempre visível, cada uma com rótulo curto,
indicador de estado e acesso ao painel correspondente:

```
1 Área  →  2 Triagem  →  3 Medição  →  4 Sorteio  →  5 Voos  →  6 Campo  →  7 Matriz  →  8 Auditoria
```

Três regras de desenho que valem declarar antes de construir:

1. **Estado honesto.** Cada etapa mostra se está concluída, disponível ou bloqueada, e **por quê**.
   "4 Sorteio — concluído: 67 polígonos, selo de 10/11/2026" é informação; um ícone verde não é.
2. **Nenhum número repetido.** Os valores vêm do leitor único do selo público e do registro de
   decisões, nunca escritos no componente — é o que a trava G08 passou a exigir.
3. **A etapa 5 precisa ser construída**, não apenas exposta. É a única ausência funcional real do
   fluxo.

---

## 5. O que decidir

1. **(A), (B) ou (C)?** A recomendação é (B).
2. **A etapa 5 gera os planos de voo na interface, ou apenas baixa os que o script produziu?**
   Gerar na interface é mais útil e mais trabalhoso; baixar é imediato.
3. **O download dos polígonos sorteados é do selo público redigido ou do selo completo?** O
   completo contém a tabela reversa do cegamento; o público não identifica polígono. Para levar a
   campo é preciso identificar — logo este download é **operação cega**, e deve seguir as regras
   K1-K3, não a do selo público.
4. **O tour passa a narrar a casca de fluxo?** Se sim, os quatro passos novos ganham âncora natural
   e o problema das âncoras ausentes se resolve junto.

---

## 6. Observação sobre o momento

O tour já referencia quatro elementos inexistentes. Enquanto isso não se resolver, a apresentação
tem quatro pontos em que o holofote não encontra alvo. Qualquer das três opções corrige isso; a
(A) corrige só isso.
