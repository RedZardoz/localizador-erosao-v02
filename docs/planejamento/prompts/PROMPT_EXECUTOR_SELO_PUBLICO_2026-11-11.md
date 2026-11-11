# PROMPT L — EXECUTOR SAREL — selo público redigido do sorteio D16

**O que este prompt resolve.** O selo completo (`docs/verificacoes/sorteio/sorteio_d16_*.json`) é
o registro probatório do desenho amostral **e** a tabela reversa que quebraria o cegamento duplo.
Por isso está sob `.gitignore` (guarda K2, commit `f0b2026`), e a guarda está certa. Mas a
consequência é que **hoje não existe nenhum registro versionado do sorteio**: se a banca perguntar
onde está, a resposta é um arquivo no disco de uma máquina.

Este prompt separa os dois papéis: um **selo público redigido**, versionado, com tudo que é
auditável e nada que identifique polígono.

**Não executa sorteio. Não altera o selo completo. Não remove a guarda K2.**

---

## 0. LEITURA E PROTOCOLO

1. `docs/DESENVOLVIMENTO.md` integralmente.
2. `src/lib/gee/sorteioPoligonosTipos.ts` — `SeloSorteioD16` e `PoligonoSorteadoD16`.
3. `docs/planejamento/PROMPT_CODIGOS_OPACOS_NO_SELO_E_MARCA_SINTETICA_2026-10-02.md` — as regras K1 a K3.
4. `.gitignore`, linhas 128-134.
5. `npm run estado:verificar`.

Informe o branch e permaneça nele. **PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: saídas em
`docs/verificacoes/execucao/2026-11-11l/`. **Commit escrito depois do fato. `git push` confirmado.**

---

## TAREFA 1 — o que entra e o que não entra

### 1.1 Entra (auditável, não identifica polígono)

Do nível superior do selo: `versaoEsquema`, `geradoEm`, `semente`, `politicaSemente`, `gitCommit`,
`sha256ConjuntoCandidatos`, `hashIntegridade`, `totalCandidatosEntrada`, `totalPoligonosSorteados`,
`totalTreino`, `totalHeldOut`, `areaTotalHectares`, `limiaresS`, `limiaresE`,
`contagemCandidatosPorEstrato`, `estratosCenso`, `estratosVazios`, `invariantesVerificados`,
`decisoesVigentes`.

E uma **tabela por estrato**, agregada — não por polígono:

| campo | significado |
|---|---|
| `estratoId` | o identificador do estrato |
| `nCandidatos` (N_h) | população do estrato |
| `nSorteados` (n_h) | polígonos alocados |
| `pi_i`, `w_i` | idênticos para todo polígono do estrato, por construção |
| `regime` | `amostra`, `censo` ou `vazio` |
| `nTreino`, `nHeldOut` | repartição dentro do estrato |
| `areaHectares` | `nSorteados × 5,02` |

### 1.2 NÃO entra, em hipótese alguma

`idPoligono`, `idCandidatoOrigem`, `codigoOpacoVant`, `centroide`, `geometria`, `declividadePct`,
`frequenciaSoloNu`, `nivelK`, `kAmbiguoAssociacao`, `unidadeDeterminanteK2024`, e **qualquer
lista por polígono**.

**Por que agregado por estrato e não linha a linha, mesmo sem identificadores:** linhas anônimas
preservam a ordem do selo completo, e ordem é informação. Quem tivesse qualquer pista parcial
poderia correlacionar. Agregar elimina o canal. E não se perde auditoria: π_i e w_i são constantes
dentro do estrato, então a tabela por estrato contém tudo que os oito invariantes verificam.

### 1.3 Vínculo de integridade com o selo completo

O selo público traz também `sha256SeloCompleto`: o SHA-256 do **arquivo** do selo completo. Assim,
quem tiver o selo completo em mãos — você, o orientador em visita, a banca sob sigilo — confirma em
um comando que é exatamente o arquivo que o selo público descreve. Sem isso, o público é
afirmação; com isso, é afirmação verificável.

### 1.4 Declaração de natureza

O selo público traz, em campo próprio e em texto:

```
Este e um documento DERIVADO, redigido, do selo de sorteio D16. NAO e um sorteio, NAO confere
probabilidades de inclusao e NAO substitui o selo completo para fins de execucao. O selo
completo permanece fora do controle de versao pela guarda K2 (cegamento duplo da campanha de
campo) e pode ser liberado apos o encerramento da campanha.
```

---

## TAREFA 2 — o gerador

`scripts/auditoria/gerar_selo_publico_d16.mjs` (ou `.ts`, conforme o idioma dos demais):

- lê o selo completo de `docs/verificacoes/sorteio/sorteio_d16_*.json`;
- **recusa**, com mensagem explícita, se não houver selo, se houver mais de um, ou se o selo não
  passar em `validarInvariantesSeloD16`. Não gere público a partir de selo que não se valida;
- escreve `docs/verificacoes/selo_publico_d16_<AAAA-MM-DD>.json`;
- **confirme com `git check-ignore -v <caminho>` que o destino NÃO é ignorado** e grave a saída. A
  regra K2 cobre o diretório `docs/verificacoes/sorteio/`; o público fica fora dele, mas isso tem
  de ser verificado, não suposto;
- é idempotente: rodar duas vezes com o mesmo selo completo produz arquivo idêntico. Para isso,
  **não** inclua carimbo de tempo da geração — use o `geradoEm` do selo completo.

---

## TAREFA 3 — a trava que protege o cegamento

Em teste próprio:

1. **Lista de proibidos, recursiva.** Varra o selo público inteiro, em qualquer profundidade, e
   **falhe** se encontrar qualquer chave da lista de 1.2. Use lista de proibidos, não de
   permitidos: chave nova que surja no selo completo no futuro deve ser **barrada por omissão**,
   não passar por não estar prevista.
2. **Nenhuma coordenada.** Falhe se qualquer valor numérico do público estiver na faixa plausível
   de latitude da BP3 (−26 a −23) ou de longitude (−55 a −53). É grosseiro de propósito: pega
   vazamento de centroide mesmo sob nome de campo diferente.
3. **Equivalência de totais.** Os totais do público batem com o selo completo, e a soma de
   `nSorteados` da tabela por estrato é igual a `totalPoligonosSorteados`.
4. **Vínculo íntegro.** `sha256SeloCompleto` do público confere com o SHA-256 recalculado do
   arquivo completo.
5. **Idempotência.** Gerar duas vezes produz bytes idênticos.

**Os testes 3, 4 e 5 só rodam onde o selo completo existe.** Num clone limpo ele não existe — e é
assim que deve ser. Faça-os pular com mensagem explícita nomeando o motivo, no padrão que o
projeto já usa para `*.vivo.test.ts`, em vez de falhar. **Os testes 1 e 2 rodam sempre**, contra o
selo público versionado, porque são eles que protegem o cegamento e precisam valer em qualquer
clone.

---

## TAREFA 4 — evidência e commit

`docs/verificacoes/2026-11-11l_selo_publico_d16.md`:

1. Por que o selo completo não é versionado (K2) e por que o público resolve o vão de auditoria.
2. A lista do que entra e do que não entra, e **por que agregado por estrato**.
3. A tabela por estrato, legível, com os 18 estratos — é o que a banca vai ler.
4. A saída de `git check-ignore -v` provando que o destino é versionável.
5. O resultado das cinco travas, dizendo quais pularam e por quê.
6. Que o selo completo não foi alterado e a guarda K2 não foi tocada.

**Commite o selo público.** É o artefato que faltava.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] T1 — campos de 1.2 ausentes do público; tabela é por estrato, não por polígono
- [ ] T1 — `sha256SeloCompleto` presente e correto
- [ ] T1 — declaração de natureza presente
- [ ] T2 — gerador recusa sem selo, com selo múltiplo e com selo inválido
- [ ] T2 — `git check-ignore -v` do destino gravado; destino **não** ignorado
- [ ] T2 — idempotente (bytes idênticos em duas gerações)
- [ ] T3 — trava 1 (proibidos recursiva) e trava 2 (coordenadas) rodam **sempre** e passam
- [ ] T3 — travas 3, 4 e 5 passam aqui; pulam com motivo em clone sem selo completo
- [ ] T4 — evidência escrita; **selo público commitado**
- [ ] Selo completo **não** alterado; `.gitignore` **não** alterado
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
- [ ] **`git push` confirmado contra o remoto**
