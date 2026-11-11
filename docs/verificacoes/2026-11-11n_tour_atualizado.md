# Relatório de Atualização e Blindagem do Tour Metodológico (Prompt N)
**Data:** 2026-11-11  
**Branch:** `correcoes/contencao-2026-11-02`  
**Escopo:** `src/config/tourMetodologico.ts`, `src/config/tourMetodologico.test.ts`, `src/lib/gee/seloPublicoD16.ts`

---

## 1. Contexto e Motivação

O arquivo `src/config/tourMetodologico.ts` constitui o catálogo oficial do **Modo de Apresentação e Tour Metodológico** do SAREL v2.0, servindo como roteiro interativo para a defesa de dissertação perante a banca examinadora do PPGTCA 2026 (UTFPR).

O catálogo descrevia o sistema em estado anterior aos trabalhos consolidados entre 09 e 11 de novembro de 2026. Identificaram-se três defeitos metodológicos no texto e código ilustrativo, além da omissão dos quatro marcos empíricos centrais recentemente conquistados pela pesquisa: a máscara GEOS3 em Sentinel-2, a medição contínua da dimensão temporal de solo exposto ($\hat{E}$), o desenho amostral estratificado probabilístico realizado sob o selo D16, e a cadeia criptográfica de custódia e cegamento.

Este trabalho realizou a atualização integral do catálogo sem alterar qualquer decisão metodológica, sem reexecutar sorteios e sem violar os invariantes do selo público.

---

## 2. Tabela Antes / Depois dos Três Defeitos Corrigidos

| Item | Passo / Linhas | Antes (Defeito) | Depois (Corrigido) | Fundamentação Metodológica |
| :--- | :--- | :--- | :--- | :--- |
| **Defeito 1: Preditores e Alvo da Matriz** | Passo `matriz-treino` (linhas ~433-444) | Retornava `fator_c`, `fator_ls` e alvo obsoleto `rotulo_classe: ponto.classe === 'erosao' ? 1 : 0`. | Remove `fator_c` (preditor proibido) e `fator_ls` (removido por escolha). Mantém `RUSLE_Fator_K` e `RUSLE_Fator_R`. Alvo canônico passa a `Fracao_Erodida` (D26, contínuo em $[0, 1]$, `reg:tweedie`), com `Classe_Alvo_Binaria` secundário. | **D25 / D26:** `PROIBIDOS_COMO_PREDITOR` veda saídas do competidor RUSLE (`RUSLE_Fator_C`, `RUSLE_Fator_P`, `RUSLE_A`). `RUSLE_Fator_LS` foi retirado da matriz de modelagem por decisão metodológica (permanecendo na linha de base e na planilha). |
| **Defeito 2: Triagem vs Definição** | Passo `amostragem-gee` (linhas ~183, ~203) | `"Erosão laminar ativa exige BSI > 0.10 e NDVI < 0.40... Controle sob SPD exige BSI < 0.00 e NDVI > 0.65"` e variável `candidatos = bsi.gt(0.10)...` | Substituído por linguagem de candidatura: `"Candidato espectral a feição erosiva (BSI > 0,10 e NDVI < 0,40 · triagem D02)"`. Cortes declarados explicitamente como **convenção operacional do projeto**, com análise de sensibilidade pré-registrada e pendente. Código corrigido para `candidatos_espectrais_erosao`. | **D02 (Emenda 06/10/2026):** Cortes espectrais são triagem e auxílio visual ao intérprete, nunca rótulo (Regra 4: nada calculado vira rótulo). Rikimaru et al. (2002) formula o BSI, mas não prescreve limiares. |
| **Defeito 3: Contagem de Decisões** | Passo `decisoes-metodologicas` (linhas ~460, ~467) | Título estático `"Livro de Decisões Metodológicas (D01 a D19)"` e corpo fixando 19 decisões. | Derivação 100% dinâmica em tempo de execução via `DECISOES` e `PARAMETROS` importados de `src/config/decisoes.ts`: `faixaDecisoes` (`"D01 a D26"`), `TOTAL_DECISOES` (26) e `TOTAL_PARAMETROS` (16). | **D01 a D26 / P01 a P24:** Elimina obsolescência de documentação. O catálogo adapta-se automaticamente a qualquer adição de decisão. |

---

## 3. Os Quatro Passos Conquistados e Acrescentados ao Tour

A sequência ordenada (`PASSOS_TOUR_APRESENTACAO`) foi expandida de 11 para **15 passos didáticos**, incorporando os avanços científicos da dissertação:

### (a) Máscara de Solo Exposto GEOS3 (Sentinel-2) (`mascara-solo-geos3`)
- **Módulo:** 3. Sensoriamento Remoto & Espectrometria
- **O que afirma:** Conjunção estrita de 5 testes espectrais em Sentinel-2 MSI L2A:
  $$\text{SoloMineral} \iff (0{,}00 \le \text{NDVI} \le 0{,}25) \land (0{,}00 \le \text{NBR2} \\le 0{,}075) \land (\rho_{\text{B4}} \ge \rho_{\text{B3}}) \land (\rho_{\text{B3}} \ge \rho_{\text{B2}})$$
  com $\text{NBR2} = \frac{\rho_{\text{B11}} - \rho_{\text{B12}}}{\rho_{\text{B11}} + \rho_{\text{B12}}}$.
- **Fundamentação:** O NBR2 no SWIR (bandas 11 e 12) discrimina palhada agrícola/cobertura morta sob SPD de solo mineral exposto por absorção de celulose e lignina em 2,1–2,3 µm, separação impossível apenas com NDVI (Daughtry et al., 2001, 2004; Hively et al., 2021).
- **Salvaguarda Epistemológica:** Declara formalmente a transposição dos limiares de Landsat 5 TM (Demattê et al., 2018) para Sentinel-2 como **hipótese experimental não validada** (Decisão D10 / Emenda de 09/11/2026).

### (b) Frequência Temporal de Solo Exposto - Dimensão $\hat{E}$ (`frequencia-solo-nu-e`)
- **Módulo:** 4. Estatística Espacial & Amostragem
- **O que afirma:** Medição multitemporal dos 677 candidatos de entrada na Bacia Paraná 3. Contabiliza entre 148 e 1.011 observações válidas e desobstruídas por ponto (mediana 477), com nenhum candidato abaixo do piso estrito de 12 passagens (D11.2).
- **Distribuição Empírica:** Distribuição altamente assimétrica com 181 pontos (26,7%) em zero exato (ausência total de solo nu detectado na série, denotando SPD ininterrupto ou pastagem densa).
- **Tercis Empíricos:** Partição nos tercis calculados em $t_1 = 0,0116$ e $t_2 = 0,0490$, com ocupação perfeitamente balanceada nos três estratos: 226 pontos em $\hat{E}_1$, 225 em $\hat{E}_2$ e 226 em $\hat{E}_3$.

### (c) Desenho Amostral Realizado sob o Selo D16 (`sorteio-d16-realizado`)
- **Módulo:** 5. Desenho Amostral & Planejamento de Campo
- **O que afirma:** Utiliza o leitor único centralizado `src/lib/gee/seloPublicoD16.ts` (`obterComparativoDesenhoD16()`). Confronta o desenho nominal (72 polígonos, 18 estratos $\times$ 4, ~361 ha: 36 treino + 36 held-out) com o desenho realizado (67 polígonos, 336,34 ha: 34 treino + 33 held-out).
- **Achado Biofísico da Bacia:** O estrato $E\_1\_3\_2$ ($\hat{S}_1 \times \hat{E}_3 \times \hat{K}_2$) é nulo porque a BP3 possui apenas 9 candidatos de relevo plano com erodibilidade elevada, e o maior $\hat{E}$ observado entre eles foi de 0,0331 (abaixo do corte de 0,0490) — um achado da geomorfologia e pedologia da bacia, e não falha metodológica.
- **Regime de Censo:** Cinco dos nove estratos de $\hat{K}=2$ operam em regime de censo ou déficit sem suplentes ($E\_1\_3\_2$ vazio e $E\_1\_2\_2, E\_2\_2\_2, E\_2\_3\_2, E\_3\_2\_2$ com $N \le 4$).

### (d) Cadeia de Verificação e Cegamento Amostral (`cadeia-verificacao`)
- **Módulo:** 8. Governança Epistemológica & Auditoria
- **O que afirma:** Custódia criptográfica do sorteio realizado com a semente pré-registrada 20261110. Cumprimento compulsório dos 8 invariantes matemáticos (INV-1 a INV-8). Selo público redigido preservando o cegamento dos avaliadores na camada K2. Reprodutibilidade independente atestada em clone limpo.
- **Apontamento Oficial:** Vincula formalmente ao documento `docs/dissertacao/Verificacao_e_Validacao_SAREL_2026-11-11.docx`.

---

## 4. Contagem Dinâmica de Decisões e Parâmetros (Tarefa 3)

Comandos executados sobre `src/config/decisoes.ts`:

```bash
$ grep -cE "^  D[0-9]+:" src/config/decisoes.ts
26

$ grep -cE "^  P[0-9]+:" src/config/decisoes.ts
16
```

Lista completa verificada:
- **Decisões (26):** D01 a D26
- **Parâmetros (16):** P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P20, P21, P22, P23, P24.

O passo `decisoes-metodologicas` foi parametrizado para derivar esses quantitativos em tempo de execução via `Object.keys(DECISOES).length` e `Object.keys(PARAMETROS).length`, eliminando hardcodes.

---

## 5. Travas de Conteúdo no Test Suite (Tarefa 5)

O arquivo `src/config/tourMetodologico.test.ts` foi expandido para conter 7 testes (sendo 5 travas de conteúdo novas):

1. **Trava 1 (Termos Desautorizados):** Nenhum passo do catálogo contém as cadeias `"D01 a D19"`, `"Classe 1"`, `"Classe 0"`, `"fator_ls"` ou `"rotulo_classe"`.
   - *Resultado:* **APROVADO (0 violações)**.
2. **Trava 2 (Preditor Proibido D25):** Lê `PROIBIDOS_COMO_PREDITOR` diretamente de `scripts/d25/avaliacao_d25_referencia.py` em tempo de execução e garante que nenhuma coluna proibida (`RUSLE_Fator_C`, `RUSLE_Fator_P`, `RUSLE_Perda_Solo_t_ha_ano`, `RUSLE_A` ou aliases como `fator_c`) seja retornada como preditor no código de `matriz-treino`.
   - *Resultado:* **APROVADO**.
3. **Trava 3 (Paridade Decisões e Parâmetros):** Verifica que o título e o texto de `decisoes-metodologicas` coincidem dinamicamente com as 26 decisões e 16 parâmetros exportados de `src/config/decisoes.ts`.
   - *Resultado:* **APROVADO**.
4. **Trava 4 (Consistência com Leitor do Selo Público):** Verifica que os quantitativos citados em `sorteio-d16-realizado` (67 polígonos, 34 treino, 33 held-out, 336,34 ha, 72 nominais, ~361 ha nominais, menção ao estrato $E\_1\_3\_2$ e regime de censo) coincidem com o leitor canônico `obterComparativoDesenhoD16()`.
   - *Resultado:* **APROVADO**.
5. **Trava 5 (Meta-teste de Violação Sintética):** Injeta intencionalmente cada um dos termos proibidos em um passo sintético e demonstra que a trava acusa e captura todas as violações.
   - *Resultado:* **APROVADO**.

---

## 6. Correção de Redação em `src/lib/gee/seloPublicoD16.ts` (Tarefa 6)

Em `src/lib/gee/seloPublicoD16.ts`, o cabeçalho foi corrigido para refletir com exatidão o comportamento do código:
- **Antes:** afirmava que se o selo estivesse ausente, devolvia estado indisponível em execução.
- **Depois:** explicita que o módulo faz **import estático** do JSON — logo, selo ausente é um **erro de compilação** (a salvaguarda mais forte do ecossistema TypeScript); o caminho de estado indisponível em execução é reservado exclusivamente para o caso de o arquivo estar presente porém com estrutura corrompida ou inválida.
- **Código:** Nenhuma linha de lógica foi alterada, preservando a pureza do módulo.

---

## 7. Registros de Verificação e Execução

Os logs brutos foram persistidos no diretório de auditoria:
- `docs/verificacoes/execucao/2026-11-11n/00_pre_git_status.txt`
- `docs/verificacoes/execucao/2026-11-11n/01_pre_git_branch.txt`
- `docs/verificacoes/execucao/2026-11-11n/02_pre_estado_verificar.txt`
- `docs/verificacoes/execucao/2026-11-11n/03_contagem_decisoes_parametros.txt`
- `docs/verificacoes/execucao/2026-11-11n/04_tsc_check.txt`
- `docs/verificacoes/execucao/2026-11-11n/05_npm_test.txt`
- `docs/verificacoes/execucao/2026-11-11n/06_vitest_tour.txt`
- `docs/verificacoes/execucao/2026-11-11n/07_grep_termos_proibidos.txt`

Todos os 110 arquivos de teste (945 testes aprovados, 3 ignorados, 0 falhas) e a compilação do TypeScript (`tsc --noEmit`) foram aprovados integralmente.
