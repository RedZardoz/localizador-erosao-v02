# Nota de Correção — Retificação de Defeitos Factuais nos Documentos de Dívidas (P-8)

**Data da retificação:** 06/11/2026  
**Origem:** Prompt Executor P-8  
**Documentos alvos retificados:**
1. `docs/auditorias/DeepSeek/dividas-bibliograficas-metodologicas-05_11_26.docx`
2. `docs/auditorias/DeepSeek/estado-projeto-05_11_26.docx`
3. `docs/auditorias/DeepSeek/estado-projeto-05_11_26.pptx`

---

## 1. Contexto e Motivação

Os três documentos de decisão emitidos em 05/11/2026 em `docs/auditorias/DeepSeek/` são robustos e suas recomendações metodológicas e técnicas permanecem plenamente válidas. No entanto, foram identificados dois defeitos factuais que, se mantidos, chegariam à reunião com o orientador e à dissertação:

1. **Defeito 1 — DOI de Riley invertido:** citação do DOI da Parte II (`sim.7992`) emparelhado com a referência da Parte I (desfechos contínuos, p. 1262–1275), além de menção equivocada no item M-05 alegando que o inventário citaria a Parte II.
2. **Defeito 2 — Números de poder defasados:** citação de valores preliminares de simulação a $R = 80$ réplicas em vez dos valores consolidados a $R = 500$ réplicas de 04/11/2026 (`81b2e0f`).

Nenhuma recomendação de decisão, veredito, prioridade ou código de simulação foi alterado.

---

## 2. Detalhamento das Retificações

### 2.1. Defeito 1 — Retificação do DOI de Riley e esclarecimento sobre M-05

- **Fato bibliográfico:**
  - `10.1002/sim.7993`: **Parte I** (desfechos contínuos), *Statistics in Medicine* 38(7):1262–1275, 2019.
  - `10.1002/sim.7992`: **Parte II** (binários e tempo-até-evento), *Statistics in Medicine* 38(7):1276–1296, 2019.
- **Evidências no repositório:**
  - `docs/bibliografia/INVENTARIO_SELECAO_BIBLIOGRAFICA.md` (L406): já cita `10.1002/sim.7993` (Parte I).
  - `src/config/decisoes.ts` (L455, D24): já cita `Statistics in Medicine 38(7):1262-1275` (Parte I).
- **Alterações efetuadas:**
  1. Em `dividas-bibliograficas-metodologicas-05_11_26.docx`:
     - **Lista de referências:** alterado o DOI de `10.1002/sim.7992` para `10.1002/sim.7993`.
     - **Item M-05:** removida a afirmação falsa *"O inventário cita a Parte II"*; registrado que o inventário e o registro de decisões já citam a Parte I corretamente, esclarecendo que a dívida de D24 é estritamente metodológica (aplicação de critério de 200 EPV de desfecho dicotômico para alvo contínuo), e não bibliográfica.
  2. Em `estado-projeto-05_11_26.docx`:
     - **Seção 11.2 (Referências de apoio):** alterado o DOI de `10.1002/sim.7992` para `10.1002/sim.7993`.
  3. Em `estado-projeto-05_11_26.pptx`:
     - **Slide 23:** alterado o DOI de `10.1002/sim.7992` para `10.1002/sim.7993`.

---

### 2.2. Defeito 2 — Atualização da Tabela e Valores de Poder ($R = 500$)

- **Evidência primária:** `docs/verificacoes/verificacao_grade_completa_poder_2026-11-04.md` (consolidada em `81b2e0f`).
- **Alterações efetuadas:**
  1. Em `dividas-bibliograficas-metodologicas-05_11_26.docx` (Item M-09):
     - Texto descritivo: atualizado para *"36 clusters dão 98,0% de poder se a vantagem for homogênea (DP ≤ 0,10), 63,2% em DP 0,15 e 32,4% em DP 0,20"*.
     - Tabela de opções (Opção B): atualizado de *"Aumenta clusters ou aceita 70%"* para *"Aumenta clusters ou aceita 63,2%"*.
  2. Em `estado-projeto-05_11_26.docx` (Seção 7.5, Tabela 14):
     - Substituída a grade completa pelos valores vigentes de $R = 500$, $B = 100$:

| Desvio-padrão da vantagem | 36 clusters | 28 clusters | 24 clusters |
|---:|:---:|:---:|:---:|
| 0,10 | 98,0% | 94,8% | 93,8% |
| 0,12 | 85,8% | 83,0% | 77,2% |
| 0,15 | 63,2% | 54,0% | 52,2% |
| 0,20 | 32,4% | 29,8% | 30,0% |

     - Nota incluída imediatamente após a tabela: *"Nota: valores de R = 500 réplicas, B = 100, conforme docs/verificacoes/verificacao_grade_completa_poder_2026-11-04.md."*
     - Observação mantida: no patamar de ruído (SD 0,20), $k = 28$ (29,8%) permanece ligeiramente inferior a $k = 24$ (30,0%), variação dentro do erro padrão da estimativa (0,07 EP).

---

## 3. Resultado da Varredura Textual Integrada (Item 4.3)

Foi realizada varredura automatizada nos três arquivos buscando `70,0`, `70%`, `100%`, `32,5`, `86,2`, `sim.7992` e valores da simulação anterior:
- As ocorrências encontradas correspondiam estritamente aos pontos corrigidos e a menções temáticas descorrelacionadas (ex.: preenchimento de voo de drone com "100% fill" na Tabela 10 de dívidas; e "perseguir 100%" na redação da recomendação M-09 preservada).
- Nenhuma outra ocorrência residual de dados superados ou DOIs incorretos permanece nos documentos.

---

## 4. Rastreabilidade e Não-Violação

- A recomendação M-09 (Opção C) e a recomendação M-05 (A + C) foram mantidas inalteradas.
- A integridade da suíte de testes do projeto e os requisitos de segurança e padrões proibidos foram revalidados sem regressões.
