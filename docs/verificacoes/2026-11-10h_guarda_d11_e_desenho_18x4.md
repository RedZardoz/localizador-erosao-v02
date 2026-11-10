# Relatório de Verificação — Guarda de D11.2, Desenho 18×4 e Destrave do Sorteio D16

**Data:** 2026-11-10  
**Referência:** Prompt H — Executor SAREL (`media_1794335011073_79750901.md`)  
**Branch:** `correcoes/contencao-2026-11-02`  
**Status da Suíte:** 108/108 arquivos de teste aprovados (907 testes passando, 3 pulados, 0 falhas)  
**TypeScript (`tsc --noEmit`):** 0 erros  
**Auditoria de Estado (`npm run estado:verificar`):** OK (sincronizado)  

---

## 1. Decisão Registrada e Onde

A formalização da decisão do pesquisador referente à estratificação tridimensional de D12 e ao desenho amostral de D16 foi implementada e sincronizada nos seguintes locais canônicos:

1. **`src/config/decisoes.ts`**:
   - **Emenda D12 (2026-11-10):** Registro da opção (a) do pesquisador — manutenção do particionamento tridimensional $3 \times 3 \times 2 = 18$ estratos com tercis empíricos de declividade ($\hat{S}$) e frequência de solo nu ($\hat{E}$), mantendo declarada a ausência estrutural da célula $S_1 \times E_3 \times K_2$ ($N_h = 0$).
   - **Emenda D16 (2026-11-10):** Regra amostral para estratos deficientes:
     - $N_h \ge 4$: sorteia 4 candidatos sem reposição ($\pi_i = 4/N_h$, $w_i = N_h/4$). Se $N_h = 4$, $\pi_i = 1$ e o estrato é marcado como censo.
     - $0 < N_h < 4$: censo do estrato ($\pi_i = 1$, $w_i = 1$, sem suplentes).
     - $N_h = 0$: estrato vazio declarado; não contribui com polígonos.
     - Preservação estrita da não-tendenciosidade de Horvitz-Thompson: $\pi_i \times w_i = 1$ em todos os casos.
     - Meta amostral no universo atual da Bacia do Paraná 3: **67 polígonos** ($16 \times 4 + 1 \times 3 + 1 \times 0 = 67$), sendo 34 para treino e 33 para held-out.
2. **`docs/planejamento/DECISOES_DE_CONVERSA.md`**:
   - Transcrição integral como Entrada 13, documentando a escolha formal da opção (a) contra opções de colapso de regimes ou fabricação de candidatos.
3. **`docs/planejamento/DECISOES.md`**:
   - Sincronizado automaticamente via script de espelho `npm run decisoes:md`.
4. **`docs/planejamento/ESTADO.md`**:
   - Atualizado e validado pelo script de auditoria `npm run estado` / `npm run estado:verificar`.

---

## 2. As Três Camadas do Defeito de D11.2 (Antes, Depois e Defesa em Profundidade)

### 2.1 Diagnóstico do Defeito Original
A guarda pré-registrada de governabilidade D11.2 proíbe que frequências de solo nu obtidas sob regime de fallback de janela curta ($n < 12$, erro padrão $\approx 0{,}20$) entrem na estratificação de D12. No entanto, a implementação anterior possuía três furos estruturais:
1. Verificava apenas se `estado === "modelado"` e ignorava quando `estado === "medido"`, permitindo que um ponto medido com apenas $n = 6$ passasse livremente.
2. Não armazenava nem exigia o bloco estruturado `qualidade` com o número real de observações ($n_{\text{obs}}$) na proveniência.
3. Na rota de API e no particionamento, o campo `provenienciaE` era opcional e podia ser omitido ou passado sem verificação, gerando curto-circuito silencioso.

### 2.2 Implementação das Três Camadas (Antes vs. Depois)

| Camada | Arquivo | Comportamento Anterior | Comportamento Corrigido (Fail-Closed) |
|---|---|---|---|
| **Camada A (Geração/Cache)** | `src/lib/gee/amostragemSoloNuLote.ts` | Registrava medição sem bloco `qualidade` estruturado ou perdia $n_{\text{obs}}$ ao salvar/carregar cache. | Popula obrigatoriamente `qualidade: QualidadeAjuste` com $n_{\text{obs}}$ real extraído da série temporal GEE, define `regime: "padrao_pleno"` se $n \ge 12$, calcula `erroPadrao: 0.5 / sqrt(n)`, e re-hidrata essa estrutura perfeitamente ao ler o cache. |
| **Camada B (Predicado de Elegibilidade)** | `src/lib/matriz/montagemTemporal.ts` (`podeEntrarEstratificacaoD12`) | Avaliava apenas `modelado`. Se `estado === "medido"`, retornava `true` sem inspecionar suficiência amostral. | Inspeciona rigorosamente tanto `medido` quanto `modelado`. Exige a presença do bloco `qualidade` (se ausente, rejeita imediatamente). Exige `elegivelD12 !== false`, `regime !== "fallback_janela_curta"` e $n_{\text{obs}} \ge 12$. |
| **Camada C (Contrato de Tipos e Particionamento)** | `src/lib/gee/estratificacao.ts` e `src/app/api/gee/select-candidates/route.ts` | `provenienciaE` era opcional em `CandidatoEstratificacao`. Particionamento rodava sem validar proveniência dos candidatos. | `provenienciaE: Proveniencia<number>` é obrigatória. `particionarCandidatosEm18Estratos` itera sobre todos os candidatos antes do cálculo de tercis e lança exceção com citação expressa a D11.2 se algum for inelegível. A rota valida `podeEntrarEstratificacaoD12` antes de qualquer particionamento. |

### 2.3 Por que Uma Camada Isolada Não Bastaria
- **Apenas Camada A:** Protegeria apenas o fluxo de lote. Uma chamada direta via API ou outra ferramenta poderia injetar medições sem $n_{\text{obs}}$ que passariam despercebidas.
- **Apenas Camada B:** Sem a Camada A fornecendo dados de qualidade reais, a Camada B operaria sobre hipóteses ou barraria dados legítimos. Sem a Camada C, nada forçaria os desenvolvedores a invocar o predicado antes da partição.
- **Apenas Camada C:** Sem o contrato estrito de tipos e a validação profunda de B, a verificação na partição seria superficial e sujeita a omissões de propriedade.
A coexistência das três camadas estabelece uma cadeia de custódia ininterrupta da proveniência da medição até a partição amostral.

As 6 travas obrigatórias foram formalizadas em `src/lib/gee/guardaD11_2.test.ts` e aprovadas com sucesso.

---

## 3. Confirmação do Universo de Candidatos Real (BP3)

Foi realizada a conferência completa sobre o universo real de 677 candidatos válidos da Bacia do Paraná 3, armazenados em `docs/verificacoes/cache_frequencia_solo_nu_bp3.json`:
- **Total de candidatos no cache:** 677.
- **Variação de $n_{\text{obs}}$ observada:** de 148 a 1011 observações multitemporais válidas por ponto (média de 447 observações), ordens de grandeza acima do piso metodológico $n=12$.
- **Erro padrão de $\hat{E}$:** entre 0,0157 e 0,0411 (muito abaixo do teto de 0,144 de D11.2).
- **Candidatos barrados pela guarda reativada:** **EXATAMENTE 0 de 677** (100% de aprovação no padrão pleno).

---

## 4. Regra de Estrato Deficiente e Tabela de Probabilidades ($\pi_i$) e Pesos ($w_i$)

Em cumprimento a D16 e D23, a regra operacional de amostragem comporta as três situações possíveis de ocupação populacional $N_h$:

| Situação Populacional | Condição Amostral | Probabilidade de Inclusão ($\pi_i$) | Peso de Amostragem ($w_i$) | Invariante Horvitz-Thompson |
|---|---|---|---|---|
| Regular ($N_h \ge 4$) | Amostra de 4 polígonos | $\pi_i = \frac{4}{N_h}$ | $w_i = \frac{N_h}{4}$ | $\pi_i \times w_i = 1$ |
| Censo Limítrofe ($N_h = 4$) | Amostra de 4 (todos) | $\pi_i = 1{,}0$ | $w_i = 1{,}0$ | $\pi_i \times w_i = 1$ |
| Censo Deficitário ($0 < N_h < 4$) | Censo do estrato ($N_h$ polígonos) | $\pi_i = 1{,}0$ | $w_i = 1{,}0$ | $\pi_i \times w_i = 1$ |
| Vazio Estrutural ($N_h = 0$) | Estrato vazio declarado | Não aplicável ($0$ polígonos) | Não aplicável | Não aplicável |

---

## 5. Os Cinco Estratos de Censo ou Déficit em $\hat{K}=2$ e Ausência de Reserva

A estratificação sobre os 677 candidatos de BP3 revelou um afunilamento estrutural agudo na classe de erodibilidade $\hat{K}=2$ (total de 84 candidatos na bacia inteira):

| Estrato | Dimensões ($S \times E \times K$) | População ($N_h$) | Regime Amostral | $\pi_i$ | Polígonos Alocados | Suplentes Disponíveis |
|---|---|---|---|---|---|---|
| **`E_1_3_2`** | $S_1 \times E_3 \times K_2$ | **0** | **Vazio Declarado** | — | **0** | **0** |
| **`E_1_2_2`** | $S_1 \times E_2 \times K_2$ | **3** | **Censo Deficitário** | 1,0 | **3** | **0** |
| **`E_2_2_2`** | $S_2 \times E_2 \times K_2$ | **4** | **Censo Limítrofe** | 1,0 | **4** | **0** |
| **`E_2_3_2`** | $S_2 \times E_3 \times K_2$ | **4** | **Censo Limítrofe** | 1,0 | **4** | **0** |
| **`E_3_2_2`** | $S_3 \times E_2 \times K_2$ | **4** | **Censo Limítrofe** | 1,0 | **4** | **0** |
| `E_1_1_2` | $S_1 \times E_1 \times K_2$ | 6 | Amostra | 4/6 (0,6667) | 4 | 2 |
| `E_2_1_2` | $S_2 \times E_1 \times K_2$ | 8 | Amostra | 4/8 (0,5000) | 4 | 4 |
| `E_3_1_2` | $S_3 \times E_1 \times K_2$ | 51 | Amostra | 4/51 (0,0784) | 4 | 47 |
| `E_3_3_2` | $S_3 \times E_3 \times K_2$ | 6 | Amostra | 4/6 (0,6667) | 4 | 2 |

### Declaração Obrigatória sobre a Lista de Reserva
> **DECLARAÇÃO METODOLÓGICA FORMAL:**
> Nos cinco estratos identificados acima (`E_1_3_2`, `E_1_2_2`, `E_2_2_2`, `E_2_3_2` e `E_3_2_2`), **NÃO EXISTE LISTA DE RESERVA POSSÍVEL**. Todos os candidatos elegíveis existentes no território da Bacia do Paraná 3 foram integralmente esgotados pela alocação amostral. Caso ocorra perda de polígono em campo por recusa de proprietário, barreiras fundiárias ou inviabilidade de acesso, **não há candidato suplente dentro do estrato**. Qualquer reposição exigiria decisão deliberada do pesquisador para alteração de parâmetros de thinning ou redefinição de limites de classe, o que não foi executado.

---

## 6. Decomposição do Total Amostral: 67 Polígonos de 72 Previstos

A meta teórica nominal de D16 previa 72 polígonos ($18 \times 4$). Com o censo deficitário de `E_1_2_2` e o estrato vazio `E_1_3_2`, a contabilidade amostral exata é:

$$N_{\text{total}} = (16 \times 4) + (1 \times 3) + (1 \times 0) = 64 + 3 + 0 = 67 \text{ polígonos}$$

- **Papel Treino:** 34 polígonos.
- **Papel Held-Out:** 33 polígonos.
- **Área total amostrada:** $67 \times 5{,}02\text{ ha} \approx 336{,}34\text{ ha}$.

---

## 7. O Que NÃO Foi Feito (Protocolo de Contenção e Anti-Fabricação)

1. **O sorteio real NÃO foi executado:** O script CLI `scripts/sortear_poligonos_d16.ts` com a flag `--confirmar` **jamais foi invocado**. Nenhum selo criptográfico de sorteio foi gerado na pasta `docs/verificacoes/sorteio/`, preservando a irrevogabilidade exigida pela Decisão D23.
2. **Nenhum candidato suplementar foi fabricado:** Não foi realizada criação artificial de pontos sintéticos, não foram relaxados os critérios de thinning espacial e não foram ajustadas as coordenadas para inflar artificialmente as células vazias ou deficitárias de $\hat{K}=2$.
3. **A destrava do CLI ocorreu estritamente em conjunto com os testes verdes:** A trava provisória `TRAVA_D11_2_ATIVA` foi removida de `scripts/sortear_poligonos_d16.ts` e o arquivo `src/lib/gee/sorteioPoligonosTravaD11.test.ts` foi excluído simultaneamente à validação de todas as pré-condições.

---

## 8. Evidências de Execução no Disco

Os arquivos brutos de execução encontram-se arquivados em `docs/verificacoes/execucao/2026-11-10h/`:
- `tsc_noemit.txt`: Saída da compilação do TypeScript (0 erros).
- `npm_test.txt`: Saída da suíte de 108 arquivos de teste Vitest (100% de sucesso).
- `estado_verificar.txt`: Saída da validação de sincronia de `ESTADO.md`.
- `git_status.txt`: Lista de arquivos modificados e criados.
- `git_log.txt`: Histórico dos commits mais recentes.
