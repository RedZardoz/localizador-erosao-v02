# PROMPT H — EXECUTOR SAREL — guarda de D11.2, decisão de desenho e destrave do sorteio

**Decisão do pesquisador (10/11/2026):** manter a **opção (a)** — três regimes de Ê, 18 estratos
com 4 polígonos, documentando a ausência estrutural. Material:
`docs/planejamento/MATERIAL_DECISAO_ESTRATIFICACAO_E_2026-11-10.md`.

Este prompt torna o sorteio **correto e executável**. **Não executa o sorteio.**

---

## 0. LEITURA OBRIGATÓRIA

1. `docs/DESENVOLVIMENTO.md` integralmente.
2. `docs/planejamento/MATERIAL_DECISAO_ESTRATIFICACAO_E_2026-11-10.md`.
3. `src/config/decisoes.ts`, blocos **D11**, **D12**, **D16** e **D23**.
4. `docs/auditorias/DeepSeek/AUDITORIA_FUNCIONAL_METODOLOGICA_2026-11-09.md`, achado **S1-1**.
5. `npm run estado:verificar`.

Informe o branch e permaneça nele. **PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: saídas em
`docs/verificacoes/execucao/2026-11-10h/`, citadas por caminho. **Commit escrito depois do fato.**

A ordem das tarefas é **sequencial e cada uma destrava a seguinte**. Não pule.

---

## OS NÚMEROS QUE SUSTENTAM ESTE PROMPT

Medidos sobre os 677 candidatos (commit `af6cf47`), tercis globais Ŝ em 5,12%/8,46% e Ê em
0,0116/0,0488:

```
K̂=1    S1: E1=41  E2=86  E3=91        K̂=2    S1: E1=6   E2=3   E3=0
       S2: E1=43  E2=80  E3=88               S2: E1=6   E2=4   E3=4
       S3: E1=79  E2=50  E3=35               S3: E1=51  E2=4   E3=6
```

- Os 9 estratos de K̂=1 estão folgados (35 a 91).
- Em K̂=2: duas células deficientes (3 e 0) e **três exatamente em 4**.
- **Total alcançável: 67 de 72 polígonos.**

---

## TAREFA 1 — registrar a decisão ANTES de mexer no código

Regra 9: nada se calcula sem decisão registrada.

Em `src/config/decisoes.ts`, acrescente **EMENDA DE 10/11/2026** aos campos apropriados de **D12**
(tercis/estratos) e **D16** (sorteio), declarando:

1. **Três regimes de Ê mantidos.** Os tercis empíricos globais permanecem a partição de Ê; a opção
   de colapsar em duas classes foi examinada com os dados e **rejeitada pelo pesquisador**, porque
   a hipótese da pesquisa exige distinguir SPD consolidado, exposição sazonal e exposição crônica.
2. **Ausência estrutural declarada.** O estrato Ŝ₁ × Ê₃ × K̂₂ é **vazio no universo da BP3**. A
   bacia tem 9 candidatos de relevo plano com solo de alta erodibilidade, e seus valores de Ê são
   `0, 0, 0, 0, 0, 0,0093, 0,0207, 0,0212, 0,0331` — o máximo está abaixo do corte t₂ = 0,0488.
   Relevo plano com solo frágil sob SPD consolidado não expõe solo. É achado sobre a bacia, não
   falha do método.
3. **Pendência honesta:** não se verificou se o thinning a 2.450 m contribuiu para a escassez;
   seria verificável relaxando o raio apenas em Ŝ₁ × K̂₂. Declare como não verificado.
4. **Regra para estrato deficiente** (ver Tarefa 3), com o tratamento de π_i.
5. **Pré-registro:** esta emenda é anterior a qualquer dado de desfecho — **nenhum rótulo de campo
   existe** (Nosek et al., 2018; D25).

Transcreva a decisão em `docs/planejamento/DECISOES_DE_CONVERSA.md`, no formato das demais.

---

## TAREFA 2 — reativar a guarda de D11.2 (três camadas)

Verificado em 10/11/2026: a guarda que veda Ê sob suficiência insuficiente falha em **três pontos
independentes**, e consertar um só não resolve.

### Camada A — a proveniência do lote não declara qualidade

`amostragemSoloNuLote.ts` usa `avaliarSuficienciaAmostralD11`, cujo piso é o genérico
`LIMIAR_MINIMO_OBSERVACOES_D11 = 6` (`copernicusGeeClient.ts:29`), não o
`N_MINIMO_OBSERVACOES_SOLO_NU_D11_2 = 12` de D11.2. E a `Proveniencia` gravada **não traz bloco
`qualidade`**.

A `Proveniencia<number>` de `frequenciaSoloNu` passa a gravar sempre `nObservacoes`, `regime`
(`padrao_pleno` ou `fallback_janela_curta`), `erroPadrao` e `elegivelD12`. Confirme os nomes de
campo contra o tipo `Proveniencia` antes de escrever; se o tipo não comportar algum, estenda-o e
diga no relatório.

### Camada B — `podeEntrarEstratificacaoD12` não checa `medido`

`montagemTemporal.ts:77-90`: a checagem de `n >= 12` roda **apenas para `modelado`**. O caminho de
produção grava `medido` e passa direto. Pior, a condição
`prov.qualidade?.nObservacoes !== undefined && ...` faz com que **qualidade não declarada passe** —
a única guarda do projeto que falha aberta.

Conserte: a checagem vale para `medido` **e** `modelado`, e **ausência de qualidade declarada é
inelegível**.

### Camada C — a rota não passa a proveniência, e a guarda só roda se ela existir

`select-candidates/route.ts` monta o candidato sem `provenienciaE`, e `estratificacao.ts:167` é
`if (c.provenienciaE && ...)` — curto-circuito permanente.

Conserte: a rota passa `provenienciaE`; `executarAmostragemEstratificada` **exige** e falha com
erro que nomeia D11.2; o tipo `CandidatoEstratificacao` torna `provenienciaE` obrigatório, de modo
que a omissão vire erro de compilação.

### Travas obrigatórias

1. Integração pela rota: candidato com `nObservacoes = 6` **não** é estratificado.
2. `medido` com n=6 é recusado por `podeEntrarEstratificacaoD12`.
3. Qualidade ausente é recusada.
4. Candidato sem `provenienciaE` falha nomeando D11.2.
5. `n = 12` exatamente é **aceito** (fronteira inclusiva).
6. O lote grava `qualidade.nObservacoes` igual à contagem real.

**Verificação com dado real:** os 677 medidos têm `nObservacoes` entre 148 e 1.011. Confirme, após
o conserto, que **nenhum** dos 677 é barrado pela guarda — se algum for, relate qual e por quê.

---

## TAREFA 3 — regra de estrato deficiente, e a consequência em π_i

`sorteioPoligonos.test.ts:155` registra que o sorteio **lança** para `nH = 2` ou `3`, em vez de
devolver `π_i > 1`. Está correto, e por isso **o sorteio hoje não roda** com este universo: há uma
célula com 3 e uma com 0.

A opção (a) exige regra explícita. Implemente, conforme registrado na Tarefa 1:

| Situação | Tratamento |
|---|---|
| `N_h ≥ 4` | sorteia 4; `π_i = 4 / N_h`; `w_i = N_h / 4` |
| `0 < N_h < 4` | **censo do estrato**: toma todos os `N_h`; `π_i = 1`; `w_i = 1` |
| `N_h = 0` | estrato **vazio declarado**; não contribui; registrado no selo com `N_h = 0` |

Em todos os casos `π_i × w_i = 1`, preservando a não-tendenciosidade de Horvitz-Thompson (D23).

### 3.1 Consequência que precisa ser declarada

Quando `N_h = 4` e se sorteiam 4, então `π_i = 1`: **o estrato é censo, não amostra.** Nos dados
atuais isso ocorre em **três** células de K̂=2 — (Ŝ₂,Ê₂), (Ŝ₂,Ê₃) e (Ŝ₃,Ê₂) — somadas às duas
deficientes. Portanto **cinco dos nove estratos de K̂=2 são censo ou inferiores a ele**, e apenas
três têm folga: (Ŝ₁,Ê₁) com 6, (Ŝ₃,Ê₁) com 51 e (Ŝ₃,Ê₃) com 6.

Duas consequências a registrar no selo e na evidência:

- **Não existe lista de reserva possível** nos estratos de censo. Se um polígono se perder em campo
  — acesso negado, imóvel inacessível —, **não há candidato suplente dentro daquele estrato**. A
  única mitigação seria gerar novos candidatos relaxando o thinning naquelas células, o que é
  decisão do pesquisador e **não é tarefa deste prompt**.
- Estratos com `π_i = 1` não têm variância de amostragem; contribuem com peso 1. Isso muda a
  contabilidade de D23 e deve constar explicitamente do selo.

### 3.2 Travas

- `N_h = 3` produz censo com `π_i = 1`, `w_i = 1`, e **não** lança.
- `N_h = 0` produz estrato vazio declarado, e **não** lança.
- `N_h = 4` produz `π_i = 1` e é **marcado como censo** no selo.
- `N_h = 51` produz `π_i = 4/51`, `w_i = 51/4`, e `π_i × w_i = 1`.
- Total sorteado sobre o universo atual: **67**, não 72.

---

## TAREFA 4 — remover a trava do sorteio

A trava de `scripts/sortear_poligonos_d16.ts` foi posta no Prompt E′ com a condição explícita de
sair **junto** com o conserto da guarda, e `src/lib/gee/sorteioPoligonosTravaD11.test.ts` existe
para impedir que saiam separados.

Com as Tarefas 2 e 3 verdes, remova **a trava e o seu meta-teste, no mesmo commit**. Se as Tarefas
2 ou 3 não ficarem completas, **a trava fica** e você diz isso no relatório.

**NÃO execute o sorteio.** D23 proíbe sobrescrever π_i já registrados: a execução é irreversível e
é decisão própria do pesquisador, em rodada própria.

---

## TAREFA 5 — evidência e commit

`docs/verificacoes/2026-11-10h_guarda_d11_e_desenho_18x4.md`:

1. A decisão registrada e onde (D12, D16, registro de conversa).
2. As três camadas do defeito de D11.2, antes e depois, e por que uma só não bastaria.
3. A confirmação de que nenhum dos 677 é barrado pela guarda reativada.
4. A regra de estrato deficiente, com a tabela de π_i.
5. **Os cinco estratos de censo ou déficit em K̂=2**, e a declaração de que não há reserva possível.
6. O total de 67 de 72, com a decomposição.
7. O que **não** foi feito: o sorteio, e a geração de candidatos suplementares.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] T1 — emenda em D12 e D16; transcrição no registro de conversa
- [ ] T2-A — `qualidade` gravada com `nObservacoes` real
- [ ] T2-B — `podeEntrarEstratificacaoD12` checa `medido`; qualidade ausente é **inelegível**
- [ ] T2-C — rota passa `provenienciaE`; curto-circuito removido; omissão vira erro de compilação
- [ ] T2 — as 6 travas passam
- [ ] T2 — dos 677 medidos, barrados pela guarda: ______ (esperado: 0)
- [ ] T3 — regra implementada; as 5 travas de π_i passam
- [ ] T3 — selo marca estratos de censo (`π_i = 1`) e estrato vazio
- [ ] T4 — trava e meta-teste removidos **no mesmo commit**, ou trava mantida com motivo: ______
- [ ] T4 — sorteio **não** executado
- [ ] T5 — evidência escrita
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
