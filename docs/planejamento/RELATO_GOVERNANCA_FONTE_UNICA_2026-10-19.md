# Relatório de Execução — Governança e Fonte Única de Parâmetros

**Data:** 20/10/2026  
**Branch:** `sarel/executor-2026-10-09`  
**Base inicial verificada:** `30681d0` (descendente de `9a45ed9` e `6af6dc8`)  
**Status geral:** GOV-1, GOV-2 e GOV-3 concluídos e commitados localmente. GOV-4 relatado sem edições. GOV-5 e GOV-6 com artefatos preparados e paradas formais executadas nos portões previstos (DP-24 e C28).

---

## 1. Verificação de Baseline Inicial

Antes de qualquer modificação, a suíte e ferramentas estáticas foram executadas em worktree limpo:

| Comando | Resultado Medido na Sessão |
|---|---|
| `npm run typecheck` | Limpo (exit code 0) |
| `npm test` | **86 arquivos, 663 testes passando** |
| `npm test src/lib/seguranca/padroesProibidos.test.ts` | 23/23 testes passando |
| `npm run lint` | **2 warnings** (`MapViewer.tsx:526:6`, `PointPopup.tsx:69:6` — bloco C28 pendente) |

---

## 2. Portões "Esperado Hoje"

Todos os comandos `REPRODUZIR` foram executados na sessão antes de qualquer edição e confrontados com os valores esperados pelo prompt:

| Bloco | Comando REPRODUZIR | Esperado | Medido | Status |
|---|---|---|---|---|
| **GOV-1** | `git ls-files CLAUDE.md AGENTS.md` | `CLAUDE.md` (1 linha) | `CLAUDE.md` (1 linha) | **Idêntico** |
| **GOV-2** | `git grep -nE "D10\|0\.40\|0\.25" -- src/components/inspetor/GraficoSerieTemporal.tsx` | 4 linhas (30, 245, 321, 338) | 4 linhas (30, 245, 321, 338) | **Idêntico** |
| **GOV-3** | `git grep -nE "NDVI_MAX: \|NDVI_MIN: \|BSI_MIN: \|BSI_MAX: \|limiarNdviSoloNu: \|limiarNdviSoloNu = \|limiarNdviDosselFechado: " -- src/lib src/app src/store src/config` | 11 linhas exatas | 11 linhas exatas | **Idêntico** |
| **GOV-4** | Âncoras D01 em `decisoes.ts`, `decisoes.test.ts` e `fatorC.ts` | 3 linhas | 3 linhas | **Idêntico** (linhas 66, 9 e 68) |
| **GOV-5** | `git grep -nE "^\s+[a-zA-Z][a-zA-Z0-9]*\s*=\s*[0-9]+(\.[0-9]+)?,?\s*$" -- "src/**/*.ts"` | 12 linhas | 12 linhas (11 após GOV-3) | **Idêntico** |
| **GOV-6** | `git ls-files .github` e `git ls-files .husky .pre-commit-config.yaml` | 0 linhas | 0 linhas | **Idêntico** |

---

## 3. Bloco GOV-1 — CLAUDE.md na Raiz

### REPRODUZIR
```
$ git ls-files CLAUDE.md AGENTS.md
CLAUDE.md
```

### O que foi feito
1. As Seções 1 ("Autorização de operações de git") e 2 ("O que o assistente não decide") foram **preservadas integralmente**, sem nenhuma alteração de caractere.
2. A Seção 3 ("Seções a preencher") foi substituída por:
   - **Seção 3 — Princípios Norteadores e as 9 Regras Invioláveis**: transcritas literalmente de `docs/design.md` §1.
   - **Seção 4 — Invariantes do Sistema**: transcritos literalmente de `docs/design.md` §4 (Invariantes 1 a 7).
   - **Seção 5 — Onde vivem os números**: tabela estruturada [Grandeza | Decisão | Arquivo que é a fonte | Como ler], preenchida a partir da refatoração de GOV-3.
   - **Seção 6 — Antes de editar**: documentação dos comandos de checagem (`npm run typecheck`, `npm test`, `padroesProibidos`), da regra de leitura do registro de decisões e das guardas CI / pre-commit.

### Aceite
- Contagem total de linhas: **95 linhas** (critério: $\le 200$).
- Contagem de "Regra": `git grep -c "Regra" CLAUDE.md` retornou **11**.
- `git diff` do commit `b30126e` confirmou que as linhas 1 a 42 (Seções 1 e 2 do pesquisador) não foram tocadas.

Commit: `b30126e GOV-1: documenta regras inviolaveis e invariantes na raiz`

---

## 4. Bloco GOV-2 — Desambiguação D02 × D10 e UI

### REPRODUZIR
```
$ git grep -nE "D10|0\.40|0\.25" -- src/components/inspetor/GraficoSerieTemporal.tsx
src/components/inspetor/GraficoSerieTemporal.tsx:30: *    - NDVI = 0.40 (Solo Exposto / Degradação - Decisão D10)
src/components/inspetor/GraficoSerieTemporal.tsx:245:            <span>Solo Exposto (NDVI &lt; 0.40 · D10)</span>
src/components/inspetor/GraficoSerieTemporal.tsx:321:            {/* Linha Biofísica: Limiar de Solo Exposto (NDVI = 0.40 - D10) */}
src/components/inspetor/GraficoSerieTemporal.tsx:338:                Solo Exposto (NDVI &lt; 0.40 · D10)
```

### O que foi feito
1. Nas 4 âncoras de `src/components/inspetor/GraficoSerieTemporal.tsx`, a atribuição errônea a D10 e o rótulo foram corrigidos para:
   - Linha 30: `NDVI = 0.40 (Candidato Espectral / Triagem - Decisão D02)`
   - Linha 245: `<span>Candidato Espectral (NDVI &lt; 0.40 · D02)</span>`
   - Linha 321: `{/* Linha Biofísica: Limiar de Triagem de Candidato Espectral (NDVI = 0.40 - D02) */}`
   - Linha 338: `Candidato Espectral (NDVI &lt; 0.40 · D02)`
2. Em `src/lib/gee/amostragemBiofisica.ts:15`, a âncora de cabeçalho foi corrigida de `(SEÇÃO 3.1 & DECISÕES D02, D10)` para `(SEÇÃO 3.1 & DECISÃO D02)`.
3. Todos os valores numéricos (`0.40` e `0.4`) permaneceram estritamente intactos (R7).
4. A linha de D10 (`NDVI <= 0.25`) **não** foi adicionada ao gráfico, respeitando a prerrogativa metodológica do pesquisador (DP-22).
5. **Relato sobre `persistenciaTemporal.test.ts:9`:** O teste instancia `const OPCOES_PADRAO: OpcoesPersistencia = { limiarNdviSoloNu: 0.40, ... }`. Trata-se de fixture de teste unitário onde o valor 0.40 (da triagem D02) foi adotado por engano ou como valor arbitrário para exercitar o cálculo do mecanismo de persistência de D10 (que por padrão utiliza 0.25). O valor foi preservado sem alteração (R7).

### Aceite
- `git grep -n "D10" -- src/components/inspetor/GraficoSerieTemporal.tsx` retornou vazio (código de saída 1).
- Testes de componentes: 9 arquivos e 32 testes passando.
- `git diff --stat`:
  ```
  src/components/inspetor/GraficoSerieTemporal.tsx | 8 ++++----
  src/lib/gee/amostragemBiofisica.ts               | 2 +-
  2 files changed, 5 insertions(+), 5 deletions(-)
  ```
  Nenhum dígito foi alterado.

Commit: `48b27f7 GOV-2: desambigua D02 e D10 e corrige atribuicao de rotulo na UI`

---

## 5. Bloco GOV-3 — Fonte Única Legível por Máquina (Fase 1: Limiares Biofísicos)

### REPRODUZIR
```
$ git grep -nE "NDVI_MAX: |NDVI_MIN: |BSI_MIN: |BSI_MAX: |limiarNdviSoloNu: |limiarNdviSoloNu = |limiarNdviDosselFechado: " -- src/lib src/app src/store src/config
src/lib/gee/amostragemBiofisica.ts:37:    BSI_MIN: 0.10,
src/lib/gee/amostragemBiofisica.ts:38:    NDVI_MAX: 0.40,
src/lib/gee/amostragemBiofisica.ts:43:    BSI_MAX: 0.00,
src/lib/gee/amostragemBiofisica.ts:44:    NDVI_MIN: 0.65,
src/lib/gee/persistenciaTemporal.test.ts:9:  limiarNdviSoloNu: 0.40,
src/lib/gee/persistenciaTemporal.test.ts:10:  limiarNdviDosselFechado: 0.65,
src/lib/gee/persistenciaTemporal.ts:54:  limiarNdviSoloNu: 0.25,
src/lib/gee/persistenciaTemporal.ts:55:  limiarNdviDosselFechado: 0.65,
src/lib/gee/persistenciaTemporal.ts:83:  const limiarNdviSoloNu = opcoes.limiarNdviSoloNu ?? OPCOES_PERSISTENCIA_PADRAO.limiarNdviSoloNu;
src/lib/matriz/montagemTemporal.ts:110:    limiarNdviSoloNu = 0.25,
src/lib/matriz/montagemTemporal.ts:203:    limiarNdviDosselFechado: 0.65,
```

### O que foi feito
1. Em `src/config/decisoes.ts`:
   - Adicionado campo opcional `parametros` ao tipo `Decisao<T>` com `valor: number`, `operador: "<" | "<=" | ">" | ">="`, `finalidade: string` e `unidade?: string`.
   - Adicionada classe de erro `ErroParametroAusente`.
   - Adicionada função fail-closed `exigirParametro(d, chave)`. Lança `ErroDecisaoPendente` se `d.estado !== "decidida"` e `ErroParametroAusente` se a chave não existir.
   - Preenchidos os parâmetros em D02 e D10 preservando todos os textos e campos existentes (R7, R8, R9).
2. Refatoração dos consumidores:
   - `CRITERIOS_ESPECTRAIS` (`amostragemBiofisica.ts:37-44`) lê `bsiMin`, `ndviMax`, `bsiMax`, `ndviMin` de `DECISOES.D02`.
   - `OPCOES_PERSISTENCIA_PADRAO.limiarNdviSoloNu` (`persistenciaTemporal.ts:54`) lê `ndviSoloNu` de `DECISOES.D10`.
   - Default de `limiarNdviSoloNu` em `montagemTemporal.ts:110` lê `ndviSoloNu` de `DECISOES.D10`.
3. Criado `src/config/decisoes.parametros.test.ts` com 10 testes cobrindo recusa fail-closed e verificação de comportamento estrito de fronteira (fronteiras abertas `>` e `<` em D02 vs fronteira inclusiva `<=` em D10).
4. Preenchida a tabela na seção 5 de `CLAUDE.md`.

### Relato de Limiares Fora de Escopo
- `src/lib/gee/persistenciaTemporal.ts:55` (`limiarNdviDosselFechado: 0.65`): Utilizado para avaliar se após um ciclo de solo exposto houve recuperação rápida da cobertura vegetal (vigor vegetativo do Sistema Plantio Direto), separando pousio temporário de erosão crônica.
- `src/lib/matriz/montagemTemporal.ts:203` (`limiarNdviDosselFechado: 0.65`): Passado como opção para alimentar a chamada de `analisarPersistenciaTemporal`.  
Ambos foram mantidos inalterados conforme R7 e R8 para decisão futura do pesquisador.

### Aceite
#### 1. Tabela Antes / Depois de Literais Movidos (Preservação de Valores - R7)
| Arquivo : Linha | Chave no Registro | `valor_antigo` | `valor_novo` | Situação |
|---|---|---|---|---|
| `src/lib/gee/amostragemBiofisica.ts:37` | `D02.parametros.bsiMin` | `0.10` | `0.10` | Idêntico |
| `src/lib/gee/amostragemBiofisica.ts:38` | `D02.parametros.ndviMax` | `0.40` | `0.40` | Idêntico |
| `src/lib/gee/amostragemBiofisica.ts:43` | `D02.parametros.bsiMax` | `0.00` | `0.00` | Idêntico |
| `src/lib/gee/amostragemBiofisica.ts:44` | `D02.parametros.ndviMin` | `0.65` | `0.65` | Idêntico |
| `src/lib/gee/persistenciaTemporal.ts:54` | `D10.parametros.ndviSoloNu` | `0.25` | `0.25` | Idêntico |
| `src/lib/matriz/montagemTemporal.ts:110` | `D10.parametros.ndviSoloNu` | `0.25` | `0.25` | Idêntico |

#### 2. Execução da Suíte Inteira
```
 Test Files  87 passed (87)
      Tests  673 passed (673)
   Duration  10.78s
```
Baseline: 86 arquivos e 663 testes. Aumento de 1 arquivo de teste e 10 testes (todos novos de GOV-3). Nenhum teste perdido.

#### 3. Varredura de Literais Removidos
```
$ git grep -nE "NDVI_MAX: 0|NDVI_MIN: 0|BSI_MIN: 0|BSI_MAX: 0" -- src/lib
(zero ocorrências — saída vazia, exit code 1)
```

Commit: `dd5266a GOV-3: fonte unica de parametros legivel por maquina para D02 e D10`

---

## 6. Bloco GOV-4 — Contradição Metodológica D01 × Fator C (Somente Relato)

### REPRODUZIR
```
$ git grep -n "valor: .(1 - NDVI) / 2." -- src/config/decisoes.ts
src/config/decisoes.ts:66:    valor: "(1 - NDVI) / 2",

$ git grep -n "expect(val).toBe" -- src/config/decisoes.test.ts
src/config/decisoes.test.ts:9:    expect(val).toBe("(1 - NDVI) / 2");

$ git grep -nE "const c = \(\(1 - ndvi\)" -- src/lib/rusle/fatorC.ts
src/lib/rusle/fatorC.ts:68:  const c = ((1 - ndvi) / 2) * (1 + bsiNum);
```

### Análise da Contradição (DP-21)
Existe uma contradição tripartite entre o registro de decisões, o teste e a implementação em produção:
1. **Registro D01 (`decisoes.ts:66`):** Registra `valor: "(1 - NDVI) / 2"`, citando Durigon et al. (2014) com a justificativa de ser formulação regionalizada, sem parâmetros livres e sem cortes.
2. **Teste unitário (`decisoes.test.ts:9`):** Assevera unicamente a igualdade da *string* do registro (`expect(val).toBe("(1 - NDVI) / 2")`).
3. **Código de cálculo (`fatorC.ts:68`):** Calcula `const c = ((1 - ndvi) / 2) * (1 + bsiNum)`. Além disso, a função `obterFatorCComProveniencia` declara formalmente `decisoes: ["D01"]` no objeto de retorno mesmo quando calcula a variante híbrida modulada por BSI.

A formulação híbrida multiplicativa **não é** Durigon et al. (2014). O próprio cabeçalho de `fatorC.ts` (linhas 13–35) argumenta extensamente contra a aplicação puramente linear de Durigon no Paraná devido ao "Paradoxo do Sistema Plantio Direto" (em que talhões com solo 100% coberto por palhada seca apresentam NDVI baixo, sendo falsamente penalizados pela fórmula clássica).

### Saídas Metodológicas (Decisão Exclusiva do Pesquisador)
- **Opção A (Emendar D01):** Registrar formalmente em D01 a formulação híbrida $C = \frac{1 - \text{NDVI}}{2} \cdot (1 + \text{BSI})$. Implica que essa formulação nova deve ser detalhada na dissertação como contribuição/adaptação metodológica do mestrado, com justificativa e análise de sensibilidade documentadas.
- **Opção B (Alinhar o código a Durigon puro):** Alterar o código para calcular estritamente $(1 - \text{NDVI}) / 2$. Com isso, a argumentação do cabeçalho de `fatorC.ts` perde objeto e talhões em SPD na entressafra com palhada seca sofrerão superestimação teórica do Fator C.

### Desdobramentos Dependentes (DP-23 e DP-25)
- **DP-23:** Em `fatorC.ts:67`, `bsiNum = bsi !== undefined ? bsi : 0` faz com que, na ausência de BSI, a fórmula degenere silenciosamente em Durigon puro. Se a metodologia for a híbrida (Opção A), a ausência de BSI deveria tornar o Fator C `indisponivel` em vez de sofrer substituição silenciosa.
- **DP-25:** Em `calcularFatorCVanDerKnijff`, para $\text{NDVI} \le 0$ o código retorna fixo `1.0`. Para $\text{NDVI} < 0$, a fórmula original resultaria em $C > 1.0$. O corte em 1.0 é um teto físico imposto pelo código. Deve ser formalizado como limite do modelo ou tratado como fora-do-domínio.

`git diff` deste bloco: **Vazio** (nenhuma linha editada).

---

## 7. Bloco GOV-5 — Fechamento das Lacunas do Varredor de Padrões Proibidos

### REPRODUZIR
```
$ git grep -nE "^\s+[a-zA-Z][a-zA-Z0-9]*\s*=\s*[0-9]+(\.[0-9]+)?,?\s*$" -- "src/**/*.ts"
src/app/api/gee/select-candidates/route.ts:188:      tamanhoAmostra = 50,
src/app/api/gee/select-candidates/route.ts:189:      raioThinningKm = 5.0,
src/app/api/gee/select-candidates/route.ts:190:      frequenciaSoloNuMin = 0.15,
src/app/api/gee/select-candidates/route.ts:191:      declividadeMin = 3.0,
src/app/api/gee/select-candidates/route.ts:192:      declividadeMax = 20.0,
src/lib/drone/planoVooNControl.ts:545:    turnAroundDistanceMeters = 10,
src/lib/drone/planoVooNControl.ts:550:    entryLocation = 0,
src/lib/drone/planoVooNControl.ts:553:    startDoJumpId = 2,
src/lib/gee/estatisticasSerie.ts:57:  nMinimo = 3
src/lib/matriz/montagemTemporal.ts:109:    intervaloGuardaMeses = 24,
src/lib/matriz/montagemTemporal.ts:110:    duracaoJanelaAnos = 3,
```
*(Nota: a 12ª ocorrência de baseline, `montagemTemporal.ts:110: limiarNdviSoloNu = 0.25`, foi eliminada em GOV-3 pelo roteamento a `exigirParametro`).*

### Classificação das 12 Ocorrências
Conforme critérios estritos do prompt:
- **(i) CIENTÍFICO E JÁ REGISTRADO:**
  1. `src/lib/matriz/montagemTemporal.ts:110` (`limiarNdviSoloNu = 0.25`): **Classe (i)**. Roteado em GOV-3 via `exigirParametro(DECISOES.D10, "ndviSoloNu").valor`.

- **(ii) CIENTÍFICO E NÃO REGISTRADO (DP-24 & Parada de Governança):**
  2. `src/app/api/gee/select-candidates/route.ts:188` (`tamanhoAmostra = 50`): **Classe (ii)**. Tamanho amostral default de candidatos da rota API. Não há decisão que fixe 50 como valor normativo.
  3. `src/app/api/gee/select-candidates/route.ts:189` (`raioThinningKm = 5.0`): **Classe (ii)**. Raio inicial de partida do relaxamento iterativo de thinning (P02 decide piso de 1.000 m e cita 5.000 m na justificativa; P02 está em estado "proposta").
  4. `src/app/api/gee/select-candidates/route.ts:190` (`frequenciaSoloNuMin = 0.15`): **Classe (ii)**. Filtro de corte mínimo de solo nu na seleção preliminar.
  5. `src/app/api/gee/select-candidates/route.ts:191` (`declividadeMin = 3.0`): **Classe (ii)**. Limite inferior de declividade (relacionado ao domínio de D07, mas injetado como default na rota).
  6. `src/app/api/gee/select-candidates/route.ts:192` (`declividadeMax = 20.0`): **Classe (ii)**. Limite superior de declividade (relacionado a D07).
  7. `src/lib/gee/estatisticasSerie.ts:57` (`nMinimo = 3`): **Classe (ii)**. Mínimo de observações válidas para cálculo de percentis de banda espectral; diverge de D11 ($n \ge 6$).
  8. `src/lib/matriz/montagemTemporal.ts:108` (`intervaloGuardaMeses = 24`): **Classe (ii)**. Guarda temporal do Modelo P (citado na prosa de D04, mas não estruturado em parâmetros de máquina na Fase 1).
  9. `src/lib/matriz/montagemTemporal.ts:109` (`duracaoJanelaAnos = 3`): **Classe (ii)**. Janela temporal do stacking multi-ano.

- **(iii) APRESENTAÇÃO OU PROTOCOLO:**
  10. `src/lib/drone/planoVooNControl.ts:545` (`turnAroundDistanceMeters = 10`): **Classe (iii)**. Parâmetro de manobra de curva de drone do formato de missão .plan.
  11. `src/lib/drone/planoVooNControl.ts:550` (`entryLocation = 0`): **Classe (iii)**. Vértice inicial padrão do survey no formato .plan.
  12. `src/lib/drone/planoVooNControl.ts:553` (`startDoJumpId = 2`): **Classe (iii)**. Identificador de comando `DO_JUMP` no formato .plan.
  - *Constante auxiliar:* `src/lib/autorizacao/logRecusas.ts` (`LIMITE_DIGITOS_IDENTIFICADOR = 6`): **Classe (iii)** (heurística de higiene de dados para barrar CPF/RA).

### Parada Obrigatória de Governança em GOV-5
O padrão `default-numerico-desestruturacao` foi implementado e testado em `src/lib/seguranca/padroesProibidos.test.ts` juntamente com seu meta-teste e com o registro das exceções da Classe (iii).

Ao executar a varredura contra o código ativo, o detector capturou com precisão as **8 ocorrências ativas da Classe (ii)** listadas acima. Conforme regra expressa do prompt:
> *"Na dúvida entre (ii) e (iii), classifique como (ii) e pare. Errar para o lado de parar é barato; errar para o lado de conceder exceção a um valor científico reabre exatamente o buraco que este bloco fecha."*  
> *"PROIBIDO: conceder exceção a limiar científico para obter verde; alterar valor (R7); decidir a que decisão pertence um número não registrado (R4, DP-24)."*

**Motivo da Parada:** Conceder exceção às 8 linhas científicas mascararia parâmetros não governados; remover os defaults violaria R7; e inventar registros em `decisoes.ts` violaria R4/R9 e DP-24. Por essa razão, o executor **PAROU** no portão de GOV-5 e manteve a alteração pronta na árvore de trabalho, aguardando a decisão metodológica do pesquisador sobre DP-24 e Fase 2.

---

## 8. Bloco GOV-6 — Guardas Bloqueantes (CI e Pre-commit)

### REPRODUZIR
```
$ git ls-files .github
(vazio)
$ git ls-files .husky .pre-commit-config.yaml
(vazio)
```

### O que foi feito
1. Criado `.github/workflows/guardas_cientificas.yml` com pipeline completa em `ubuntu-latest`, Node 20 LTS, passos `npm ci`, `npm run typecheck`, `npm run lint -- --max-warnings 0` e `npm test`. Autocontido, sem segredos e sem dependência de `data/`.
2. Criado hook de pre-commit em `.husky/pre-commit` executando `npm run typecheck` e `npm test src/lib/seguranca/padroesProibidos.test.ts`.
   - **Justificativa da escolha de Husky:** Em um repositório Node.js com desenvolvedores em ambiente Windows/PowerShell, o Husky utiliza os hooks nativos do Git executados pelo shell padrão do Git (`sh.exe`), dispensando a instalação de interpretadores Python adicionais ou pacotes `pip`.
3. Documentadas ambas as guardas em `CLAUDE.md`, Seção 6.

### Parada Obrigatória de Governança em GOV-6 (Portão C28)
Ao testar a instrução estrita de lint:
```
$ npm run lint -- --max-warnings 0
./src/components/map/MapViewer.tsx
526:6  Warning: React Hook useEffect has a missing dependency: 'credenciais.mapboxToken'
./src/components/map/PointPopup.tsx
69:6   Warning: React Hook useEffect has missing dependencies: 'atualizarPontoIndividual' and 'point'
```
O comando reprova com exit code 1 devido aos **dois warnings conhecidos do bloco C28**.  
Conforme portão explícito de GOV-6:
> *"Se `--max-warnings 0` reprovar por causa dos dois warnings acima, PARE e relate: corrigi-los é o bloco C28, NÃO este bloco. Misturar os dois é o retroajuste que este prompt existe para evitar."*

**Motivo da Parada:** O pipeline bloqueante no CI só atingirá verde após a execução autorizada do bloco C28 pelo pesquisador. Os arquivos `.github/workflows/guardas_cientificas.yml` e `.husky/pre-commit` foram criados e estão prontos na árvore de trabalho.

---

## 9. Dívida Declarada

1. **O que o varredor deliberadamente não detecta (Precisão > Cobertura):**
   - Ternários com literais numéricos como `bsiNum = bsi !== undefined ? bsi : 0` (`fatorC.ts:67` — DP-23). Regexes genéricas de ternário geram falsos positivos maciços na UI.
   - Retornos constantes de fronteira física em funções analíticas, como `return 1.0` para $\text{NDVI} \le 0$ em `calcularFatorCVanDerKnijff` (`fatorC.ts:97` — DP-25).
2. **Parâmetros em estado "proposta" cujos valores seguem em prosa:**
   - Parâmetros $P01$ a $P09$ (ex.: $P02$ com raio de 1.000 m, $P01$ com blocos de 20 km) continuam com valores em prosa no campo `justificativa`, aguardando promoção pelo pesquisador na Fase 2 de governança.
3. **Defaults da rota `select-candidates` e módulos científicos pendentes de DP-24:**
   - `tamanhoAmostra = 50`
   - `raioThinningKm = 5.0`
   - `frequenciaSoloNuMin = 0.15`
   - `declividadeMin = 3.0`
   - `declividadeMax = 20.0`
   - `nMinimo = 3` (`estatisticasSerie.ts:57`)
   - `intervaloGuardaMeses = 24` e `duracaoJanelaAnos = 3` (`montagemTemporal.ts:108-109`)

---

## 10. Histórico de Commits Locais Criados

```
dd5266a GOV-3: fonte unica de parametros legivel por maquina para D02 e D10
48b27f7 GOV-2: desambigua D02 e D10 e corrige atribuicao de rotulo na UI
b30126e GOV-1: documenta regras inviolaveis e invariantes na raiz
```
*(Total: 3 commits locais sobre a base inicial. Sem push, sem PR, sem tag).*

---

## 11. Resumo dos Blocos com Parada e Próximos Passos do Pesquisador

1. **DP-21 (Fator C):** Definir se a metodologia é Durigon puro ou a formulação híbrida SPD, emendando D01 se necessário.
2. **DP-24 (Defaults de Rota):** Associar formalmente os 5 defaults de `select-candidates` (e os defaults de `estatisticasSerie` e `montagemTemporal`) a decisões decididas em `parametros` para que possam ser roteados por `exigirParametro`.
3. **C28 (Lint Warnings):** Autorizar a execução do commit de saneamento de dependências de `useEffect` em `MapViewer.tsx` e `PointPopup.tsx` para zerar warnings e habilitar o CI bloqueante de GOV-6.
