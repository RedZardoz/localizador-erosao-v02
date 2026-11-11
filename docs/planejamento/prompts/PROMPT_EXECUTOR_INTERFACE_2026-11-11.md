# PROMPT M — EXECUTOR SAREL — alinhar a interface ao desenho medido

**Por que agora.** O sorteio foi executado e o **selo público** (`docs/verificacoes/selo_publico_d16_2026-11-10.json`)
está versionado. A interface ainda anuncia o desenho **nominal** — 72 polígonos, 361 ha, 36 treino,
36 held-out — enquanto o desenho **realizado** é 67 / 336,34 ha / 34 / 33. A apresentação da
dissertação será feita nessa interface.

**Não executa sorteio. Não altera selo algum. Não toca a guarda K2.**

---

## 0. LEITURA E PROTOCOLO

1. `docs/DESENVOLVIMENTO.md` integralmente.
2. `docs/verificacoes/selo_publico_d16_2026-11-10.json` — a fonte desta rodada.
3. `src/config/decisoes.ts`, bloco **D02** — a EMENDA DE 06/10/2026.
4. `npm run estado:verificar`.

Informe o branch e permaneça nele. **PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: saídas em
`docs/verificacoes/execucao/2026-11-11m/`. **Commit escrito depois do fato. `git push` confirmado.**

---

## TAREFA 1 — leitor único do selo público

Crie um módulo — por exemplo `src/lib/gee/seloPublicoD16.ts` — que leia
`docs/verificacoes/selo_publico_d16_*.json` e exponha os números do desenho **realizado**:
total sorteado, treino, held-out, área, nº de estratos, estratos em censo, estratos vazios,
limiares de Ŝ e Ê, e a tabela por estrato.

**Invioláveis:**

- **Nenhum componente lê o arquivo diretamente.** Um leitor, um ponto de verdade. O defeito que
  esta rodada corrige nasceu de números repetidos em quatro arquivos.
- Se o selo público não existir, o leitor devolve estado **indisponível declarado**, e a interface
  mostra isso em vez de número inventado. Não use valor padrão.
- Distinga **nominal** de **realizado**. O nominal (72, 18 × 4) vem de `DECISOES`/`CONFIGURACAO_REGISTRADA_D16`;
  o realizado vem do selo. São grandezas diferentes e a interface deve nomear as duas.

---

## TAREFA 2 — corrigir os textos da interface

| Arquivo e linha | Hoje | Deve passar a |
|---|---|---|
| `PainelSorteioD16.tsx:235` | "18 estratos de D12, totalizando **361 ha**: **36** para treino e **36** em held-out" | os valores realizados do selo, com o nominal declarado ao lado |
| `PainelCampanha.tsx:350`, `:429`, `:891` | "**72 Polígonos**" | nominal **72**, realizado **67** — ambos visíveis |
| `PainelCampanhaModal.tsx:39` | "72 Polígonos de VANT" | idem |
| `PainelCampanha.tsx:432` | "4 polígonos por estrato nos 18 estratos de D12" | acrescentar que dois estratos de K̂=2 não atingem o piso e um é vazio |
| `CalculadoraDesenhoAmostral.tsx:238` | "(18 estratos D12)" | conferir se é nominal; se for, manter e rotular como tal |

`PainelCriterioRefutacaoD25.tsx:64` já diz "72 polígonos **nominais**" — **não altere**: a redação
está correta e é o modelo a seguir nas demais.

**Onde houver déficit, diga o motivo em uma linha.** O estrato vazio não é falha: a bacia tem
apenas nove candidatos que conjugam relevo plano e erodibilidade elevada, e o maior valor de Ê
entre eles é 0,0331, abaixo do corte de 0,0488. Isso é achado sobre a bacia e **deve aparecer na
tela**, não só na evidência — é o tipo de resultado que sustenta a defesa.

---

## TAREFA 3 — rótulos de D02 conforme a emenda

`src/lib/gee/amostragemBiofisica.ts`, linhas 11-12, 40 e 46, ainda usa:

```
Classe 1 (Erosão Laminar Ativa)      Classe 0 (Controle / SPD Pleno)
rotulo: "Erosão Laminar (Classe 1)"  rotulo: "Controle / SPD (Classe 0)"
```

A EMENDA DE 06/10/2026 a D02 é literal: *"Onde o texto original diz 'Classe 1' e 'Classe 0',
leia-se 'candidato espectral a erosão' e 'candidato espectral a controle'."* Chamar de "Erosão
Laminar Ativa" o que a emenda define como triagem é rótulo calculado, vedado pela Regra 4.

Aplique a emenda. `src/components/inspetor/GraficoSerieTemporal.tsx` já usa a linguagem correta —
**siga-o**. Atualize `candidatoEspectral.test.ts`, que fixa as cadeias antigas; o teste deve passar
a **proibir** "Classe 1" e "Classe 0" como rótulo de ponto.

---

## TAREFA 4 — trava de paridade entre registro e interface

É a tarefa que impede a próxima deriva. Só 3 dos 62 componentes leem `decisoes.ts`; o resto repete
números, e foi assim que o 72 congelou em quatro arquivos.

Estenda `src/config/paridadeArtefatos.test.ts`, ou crie trava irmã, que:

1. varra `src/components` em busca de números de desenho escritos à mão — 72, 36, 18, 361, 360, 67,
   34, 33, 336 — **em contexto metodológico**, isto é, na mesma linha de "polígono", "estrato",
   "hectare", "ha", "treino" ou "held-out";
2. **falhe** listando arquivo e linha, salvo se a ocorrência estiver numa lista de exceções
   declarada no próprio teste, com justificativa por item (por exemplo, "72 nominal, rotulado como
   tal em `PainelCriterioRefutacaoD25.tsx:64`");
3. tenha **meta-teste**: injete uma linha sintética com número de desenho fixo e prove que a trava
   acusa. Sem isso não há como saber se ela funciona.

A lista de exceções é o registro explícito do que é nominal. Quem acrescentar número novo terá de
justificá-lo ali, o que é exatamente o atrito desejado.

---

## TAREFA 5 — evidência e commit

`docs/verificacoes/2026-11-11m_interface_alinhada.md`: o leitor único e por que existe; a tabela
antes/depois de cada texto corrigido; os rótulos de D02 aplicados; a trava de paridade com a lista
de exceções e o resultado do meta-teste; e captura ou transcrição do painel de sorteio já corrigido.

**O tour (`src/config/tourMetodologico.ts`) não é desta rodada.** Ele tem quatro defeitos próprios
já levantados — a matriz ilustrativa mostra preditores que o pré-registro de D25 proíbe, os cortes
de D02 aparecem como definição de erosão, o passo das decisões diz "D01 a D19" quando são 26
decisões e 16 parâmetros, e nada da máscara GEOS3, de Ê, dos estratos ou do sorteio consta. Fica
para o Prompt N.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] T1 — leitor único criado; nenhum componente lê o selo diretamente
- [ ] T1 — selo ausente devolve indisponível declarado, sem valor padrão
- [ ] T1 — nominal e realizado distinguidos e ambos nomeados
- [ ] T2 — os cinco pontos corrigidos; `PainelCriterioRefutacaoD25.tsx:64` **intocado**
- [ ] T2 — motivo do estrato vazio visível na interface
- [ ] T3 — emenda de D02 aplicada em `amostragemBiofisica.ts`; teste passa a proibir as cadeias antigas
- [ ] T4 — trava de paridade com lista de exceções justificada; meta-teste prova que acusa
- [ ] T5 — evidência escrita; tour **não** alterado
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
- [ ] **`git push` confirmado contra o remoto**
