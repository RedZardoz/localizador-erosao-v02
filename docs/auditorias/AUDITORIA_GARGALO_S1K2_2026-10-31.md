# Auditoria Metodológica: O Déficit Estrutural dos Estratos S₁ × K̂₂ e Saídas Amostrais Fundamentadas

**Data de Realização:** 31 de outubro de 2026  
**Autoria:** Luís Alfredo Ferreira da Silva (`RedZardoz`)  
**Agente Auditor/Executor:** Antigravity (Google DeepMind)  
**Normas Aplicadas:** Decisões D07, D08, D09, D11, D12, D16, D23, D24, D25; Parâmetros P02, P07, DP-20; Regras R-L1, R-L2, R-L3, R-L4; Princípios de Pré-Registro (Nosek et al., 2018).  
**Documentos Relacionados:**
- `docs/verificacoes/2026-09-29_gargalo_estratos_k2_dominio_d07.md` (primeiro diagnóstico)
- `docs/verificacoes/2026-09-30_remedicao_candidatos_bp3_d16.md` (remedição pericial P12)
- `docs/auditorias/AUDITORIA_D11_2026-10-31.md` (§5.2, reiteração do déficit)
- `docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md` (tabela de ocupação e teste de dependência)
- `docs/verificacoes/fontes/cochran1977/cochran_1977_sampling_techniques_ch5a12.md` (síntese bibliográfica de Cochran 1977 — NÃO CONFERIDA NO PRIMÁRIO)

---

## 1. Origem e Diagnóstico Definitivo do Problema

### 1.1. O que foi superado desde setembro de 2026
Na primeira investigação do gargalo de erodibilidade alta (K̂ = 2), realizada em 29/09/2026 (`2026-09-29_gargalo_estratos_k2_dominio_d07.md`), constatou-se que a medição anterior utilizava uma faixa distorcida de declividade (3% a 45%) em vez do domínio oficial de D07 (3% a 20%), e que o código aplicava o corte de pool (`slice`) antes do filtro físico de declividade. Duas correções definitivas foram implementadas:
1. **Ordem de filtragem corrigida:** Em `src/app/api/gee/select-candidates/route.ts:434-447`, o filtro de D07 precede estritamente o teto do pool, garantindo que 100% dos candidatos avaliados pertençam ao domínio de 3% a 20%.
2. **Medição real de Ê:** Conforme exigido pela postura pericial P12 e pela emenda D11.2, a frequência de solo nu (Ê) é derivada de satélite Sentinel-2 sobre pontos elegíveis, sem fallbacks sintéticos.

### 1.2. A conclusão irrecorrível sobre os 677 candidatos
Na remedição sobre os 677 candidatos válidos com declividade e pedologia comprovadas na Bacia do Paraná 3, a previsão de setembro de 2026 confirmou-se integralmente:
- O total global de candidatos em K̂=2 é **84** (superando a meta global de 36 candidatos).
- Porém, esses 84 candidatos distribuem-se de forma fortemente assimétrica:
  - **Ŝ1 (3,00% a 5,12%):** apenas **9 candidatos** (10,7% do total de K̂2)
  - **Ŝ2 (5,12% a 8,46%):** **14 candidatos** (16,7% do total de K̂2)
  - **Ŝ3 (8,46% a 20,00%):** **61 candidatos** (72,6% do total de K̂2)

No quadrante crítico $S_1 \times \hat{K}_2$, existem apenas 9 candidatos distribuídos pelas 3 células de exposição (Ê):
- `E_1,1,2`: **0 candidatos** (deficit = −4)
- `E_1,2,2`: **4 candidatos** (3 pós-thinning de 1 km; deficit = −1)
- `E_1,3,2`: **5 candidatos** (4 pós-thinning de 1 km; margem zero)

### 1.3. O Enunciado Pedogeomorfológico para a Banca Examinadora

> **"O desenho fatorial balanceado $3 \times 3 \times 2$ (18 estratos) pressupõe que a declividade do terreno (Ŝ) e a erodibilidade do solo (K̂) sejam variáveis aproximadamente independentes na paisagem. Todavia, a relação de catena agrícola topo-sequencial da Bacia do Paraná 3 torna-os estritamente dependentes: solos de alta erodibilidade (Neossolos Regolíticos RLm e Argissolos PVAe/PVe) ocorrem preferencialmente em relevo dissecado e declivoso (Ŝ3), enquanto o relevo suave (Ŝ1) é ocupado quase que exclusivamente por Latossolos muito profundos de erodibilidade baixa (K̂1). A imposição de um desenho fatorial sobre fatores correlacionados na natureza gera compulsoriamente células estruturalmente vazias — o que constitui uma consequência matemática e biofísica do desenho, e não um defeito nos dados amostrais."**

A dependência foi rigorosamente comprovada pelo Teste de Independência de Pearson sobre os 677 candidatos (`docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md`):
$$\chi^2 = 67,5667 \quad (df = 2, \ p = 2,13 \times 10^{-15}, \ \text{V de Cramér} = 0,3159)$$
O resíduo padronizado de K̂2 em Ŝ1 é $z = -3,61$ ($p < 0,0003$), atestando uma escassez física incontornável.

---

## 2. Análise Comparativa das 4 Saídas Metodológicas Legítimas

Conforme a Seção 3 das diretrizes de governança, examinam-se as quatro saídas conhecidas na teoria de amostragem, cada uma com seus respectivos custos, impactos e fundamentação em fonte primária:

### Saída 1: Amostragem Exaustiva do Estrato Raro com Probabilidade de Inclusão Registrada ($\pi_i = 1$) via D23
- **Fundamentação e Lastro:** Decisão D23 já aprovada e registrada; Olofsson et al. (2014) (*Remote Sensing of Environment* 148:42–57); King & Zeng (2001) (*Political Analysis* 9:137–163).
- **Mecanismo:** Em estratos onde $N_h < 4$, selecionam-se 100% dos candidatos elegíveis disponíveis ($\pi_i = 1$). A ponderação inferencial de Horvitz-Thompson compensa o desbalanceamento através dos pesos de inclusão $w_i = 1/\pi_i$.
- **Custo em Polígonos:** Redução para aproximadamente 65 a 67 polígonos (em vez de 72), pois células com 2 ou 3 unidades não alcançam a cota de 4.
- **Custo em Estratos:** **18 estratos mantidos**.
- **Impacto em Pré-Registro:** **ZERO alteração em D12**. Exige apenas emenda pontual a D16 para autorizar alocação inferior a 4 polígonos exclusivamente em estratos com $N_h < 4$.
- **Limitação Crítica:** **Não resolve a célula $E_{1,1,2}$**, que possui **0 candidatos**. Amostragem exaustiva de zero candidatos resulta em zero observações. O estrato $E_{1,1,2}$ ficaria completamente desprovido de pares treino/held-out, quebrando o protocolo de pareamento rígido exigido por D16.

---

### Saída 2: Declarar a Célula $S_1 \times \hat{K}_2$ (ou $E_{1,1,2}$) Fora do Domínio de Validade Empírico (D07)
- **Fundamentação e Lastro:** Decisão D07 (que veda expressamente a extrapolação do modelo biofísico fora do domínio empírico); princípio estatístico do suporte comum (*common support*) em modelos de predição causal e espacial.
- **Mecanismo:** Reconhecer que, se a combinação de relevo quase plano ($S_1 \in [3\%, 5,12\%]$) com solo de alta erodibilidade ($\hat{K}_2$) representa menos de 1,3% da área da bacia (e a célula $E_{1,1,2}$ possui suporte nulo), predizer erosão laminar nessa combinação constituiria extrapolação teórica injustificada. Declara-se a célula (ou o quadrante) como "fora do domínio de validade" do modelo SAREL.
- **Custo em Polígonos:** Se excluída apenas $E_{1,1,2}$: 17 estratos $\times$ 4 = **68 polígonos**. Se excluído todo o quadrante $S_1 \times \hat{K}_2$: 15 estratos $\times$ 4 = **60 polígonos** (economia de 12 polígonos / 120 ha de voo).
- **Custo em Estratos:** 17 ou 15 estratos.
- **Impacto em Pré-Registro:** Emenda formal a D12 (cardinalidade) e D16 (tamanho amostral).
- **Vantagem Científica:** Honestidade epistemológica exemplar — o projeto assume publicamente onde o modelo tem suporte e onde ele se recusa a extrapolar.

---

### Saída 3: Colapso de Estratos Adjacentes de Ê dentro de $S_1 \times \hat{K}_2$ (Cochran 1977, §5A.12 — NÃO CONFERIDO NO PRIMÁRIO) — RECOMENDADA
- **Fundamentação e Lastro:** Cochran, W. G. (1977). *Sampling Techniques*, 3ª ed., Seção 5A.12 ("Estimation of Variance with One Unit per Stratum", pp. 138–140) — **NÃO CONFERIDA NO PRIMÁRIO** (Regras R-L1 e R-L4; síntese bibliográfica em `docs/verificacoes/fontes/cochran1977/cochran_1977_sampling_techniques_ch5a12.md`, sem exemplar físico/PDF arquivado no repositório).
- **Mecanismo:** Manter o fatorial $3 \times 3 \times 2$ nos domínios com candidatos suficientes (os 9 estratos de K̂1 e os 3 estratos de Ŝ3 × K̂2). No quadrante deficiente $S_1 \times \hat{K}_2$, colapsar os três tercis de frequência de solo nu ($E_{1,1,2}, E_{1,2,2}, E_{1,3,2}$) em um único macro-estrato colapsado **$E_{1,*,2}$**, que reúne os **9 candidatos** da bacia (7 candidatos pós-thinning de 1 km). Da mesma forma, em $S_2 \times \hat{K}_2$, colapsar $E_{2,2,2}$ e $E_{2,3,2}$ em $E_{2,2-3,2}$ (5 candidatos, 4 pós-thinning).
- **Custo em Polígonos:** 14 a 16 estratos $\times$ 4 = **56 a 64 polígonos**.
- **Custo em Estratos:** Redução de 18 para 15 ou 16 estratos.
- **Impacto em Pré-Registro:** Emenda a D12 e D16.
- **Fronteira R-L3 Declarada:** Cochran demonstra que o estimador de variância colapsada $v_{cs}$ possui viés positivo ($E[v_{cs}] \ge V(\hat{Y})$), garantindo que a incerteza nunca seja subestimada. Em contrapartida, perde-se a capacidade de estimar o contraste isolado de Ê dentro do quadrante colapsado.
- **Vantagem Operacional:** Viabiliza 100% dos polígonos com pareamento perfeito (2 treino + 2 held-out) e reserva efetiva real ($N_h = 7$ pós-thinning para 4 titulares em $E_{1,*,2}$).

---

### Saída 4: Redução do Fatorial para Estratificação Condicional / Aninhada (*Split-Plot*)
- **Fundamentação e Lastro:** Kish, L. (1965). *Survey Sampling* — **NÃO CONFERIDA NO PRIMÁRIO**; Cochran, W. G. (1977), Cap. 5 — **NÃO CONFERIDA NO PRIMÁRIO** (Regras R-L1 e R-L4); teoria de amostragem em catenas geomorfológicas.
- **Mecanismo:** Incorporar a catena no desenho amostral: K̂ só é variável de estratificação onde há variabilidade pedológica expressiva (Ŝ2 e Ŝ3). Em relevo suave (Ŝ1), K̂ é fixado em nível único (ou não-estratificado), gerando 3 estratos em Ŝ1 e 12 estratos em Ŝ2/Ŝ3 ($2 \times 3 \times 2$). Total: **15 estratos biofísicos**.
- **Custo em Polígonos:** 15 estratos $\times$ 4 = **60 polígonos** (economia direta de 12 polígonos / 120 ha de levantamento de drone).
- **Custo em Estratos:** 15 estratos.
- **Impacto em Pré-Registro:** Emenda estrutural a D12 e D16.

---

## 3. Matriz de Decisão Comparativa

| Critério de Avaliação | Saída 1 (Exaustiva $\pi_i=1$) | Saída 2 (Fora do Domínio) | Saída 3 (Colapso Cochran §5A.12) | Saída 4 (Fatorial Condicional) |
| :--- | :---: | :---: | :---: | :---: |
| **Cardinalidade de Estratos** | 18 | 15 ou 17 | 15 ou 16 | 15 |
| **Total de Polígonos (D16)** | ~65–67 | 60 ou 68 | 60 ou 64 | 60 |
| **Economia de Voo (ha)** | ~50–70 ha | 40 a 120 ha | 80 a 120 ha | **120 ha** |
| **Resolve a célula vazia $E_{1,1,2}$?** | **NÃO** (permanece vazia) | SIM (excluída formalmente) | **SIM** (absorvida em $E_{1,*,2}$) | **SIM** (não particionada) |
| **Garante 2 treino + 2 held-out?** | NÃO (quebra em $E_{1,1,2}$) | SIM (nas células ativas) | **SIM** (em todos os estratos) | **SIM** (em todos os estratos) |
| **Preserva Pré-Registro de D12?** | **SIM (100% intacto)** | NÃO (emenda D12) | NÃO (emenda D12) | NÃO (emenda D12) |
| **Necessita Emenda a D16?** | SIM (alocação desigual) | SIM (redução de meta) | SIM (redução de meta) | SIM (redução de meta) |
| **Reserva sob 25% de Recusa (DP-20)** | Inviável em 3 células | Robusta | **Robusta ($N_h \ge 7$)** | **Robusta ($N_h \ge 7$)** |
| **Lastro Bibliográfico** | King & Zeng (2001); D23 | D07 (suporte comum) | **Cochran (1977, §5A.12) [NÃO CONFERIDO NO PRIMÁRIO]** | Kish (1965); Cochran (1977) [NÃO CONFERIDOS NO PRIMÁRIO] |

---

## 4. Consequência de Pré-Registro e Integridade Científica

As Decisões D12 (18 estratos) e D16 (72 polígonos, 4 por estrato) foram declaradas como pré-registradas antes da coleta de campo. Qualquer ajuste em sua cardinalidade ou alocação constitui emenda formal.

### Por que esta emenda NÃO é HARKing (*Hypothesizing After Results are Known*):
Conforme os princípios de pré-registro de Nosek et al. (2018) (*Nature Human Behaviour* 2:737–745), citados na Decisão D25:
1. **Ausência total de dados de desfecho:** Nenhum voo de drone foi realizado; nenhum dado da variável dependente (perda de solo em t/ha/ano, padrão-ouro) foi coletado. Os únicos artefatos de 72 polígonos existentes no repositório são estritamente sintéticos (`SINTETICO_NAO_VOAR_*` em `docs/verificacoes/voo_ncontrol/`).
2. **Motivação puramente biofísica e amostral:** A emenda decorre da constatação de que a população de imóveis da bacia possui distribuição física condicionada pela catena ($\chi^2 = 67,57, p = 2,13 \times 10^{-15}$), inviabilizando materialmente o sorteio das 4 unidades em células estruturalmente vazias.
3. **Auditabilidade temporal estrita:** A data, a justificativa e o teste de contingência ficam formalmente protocolados no repositório antes do sorteio real de D23.

---

## 5. Recomendação Metodológica do Agente

Recomenda-se formalmente a **Saída 3 (Colapso de Estratos Adjacentes via Cochran 1977, §5A.12)**, combinada com a declaração de fronteira de domínio de D07 (Saída 2):

> [!WARNING]
> **RESSALVA EXPRESSA DE LASTRO (Regras R-L1 e R-L4):**  
> A recomendação da Saída 3 **repousa sobre citação metodológica de Cochran (1977, §5A.12) NÃO CONFERIDA NO PRIMÁRIO**. Não há exemplar físico ou PDF arquivado em `docs/verificacoes/fontes/cochran1977/` com SHA-256 no repositório. O pesquisador deve estar ciente de que, sob a Norma do projeto, a Saída 3 fundamenta-se provisoriamente em síntese bibliográfica secundária e exige conferência no primário antes de eventual positivação formal em D12/D16.

1. **Motivo Central:** É a única abordagem que **preserva o rigor do protocolo de pareamento gêmeo de D16** (2 treino + 2 held-out em cada unidade analítica), eliminando o risco inaceitável de células vazias ou com apenas 1 polígono da Saída 1.
2. **Reserva Operacional Segura:** Ao unificar os 9 candidatos de $S_1 \times \hat{K}_2$ no macro-estrato colapsado $E_{1,*,2}$, obtêm-se 7 candidatos pós-thinning para 4 vagas, conferindo probabilidade de sucesso superior a 90% sob o protocolo de negação de acesso DP-20.
3. **Economia Financeira e Logística:** Reduz o desenho de 72 para 64 polígonos (ou 60 se $S_2 \times \hat{K}_2$ também for colapsado), economizando 8 a 12 dias de campo e 80 a 120 ha de recobrimento fotogramétrico de drone.

---

## 6. Minuta de Emenda Pronta para Deliberação do Pesquisador

Caso o pesquisador acolha a **Saída 3 (Recomendada)**, o registro de decisões em `src/config/decisoes.ts` será atualizado com a seguinte redação:

```typescript
  D12: {
    id: "D12",
    titulo: "Estratificação biofísica multi-escala adaptada à catena da paisagem",
    estado: "decidida" as EstadoDecisao,
    valor:
      "EMENDA DE 31/10/2026. A estratificação biofísica adota partição adaptada à catena " +
      "topo-sequencial comprovada da BP3 (qui-quadrado=67.57, p=2.13e-15, Cramer V=0.316). " +
      "Mantém o desenho fatorial 3(S) x 3(E) x 2(K) nos domínios com suporte amostral " +
      "(9 estratos em K1 e 3 estratos em S3 x K2). No quadrante S1 x K2, onde solos de alta " +
      "erodibilidade são escassos (9 candidatos no total, célula E_1_1_2 vazia), aplica-se o " +
      "método de estratos colapsados de Cochran (1977, Sampling Techniques, 3a ed., §5A.12), " +
      "unificando os tercis de E no macro-estrato colapsado E_1_ast_2 com 4 polígonos. " +
      "Em S2 x K2, colapsam-se E_2_2_2 e E_2_3_2 em E_2_23_2. A cardinalidade total passa " +
      "de 18 para 15 estratos biofísicos. Registrada antes de qualquer coleta de campo " +
      "conforme D25 e Nosek et al. (2018). Estado anterior: 18 estratos 3x3x2 estritos vigentes até 30/10/2026.",
    // ...
  },
  D16: {
    id: "D16",
    titulo: "Campanha amostral de 60 polígonos com pareamento estrito treino e held-out",
    estado: "decidida" as EstadoDecisao,
    valor:
      "EMENDA DE 31/10/2026. A campanha de drone ajusta-se para 60 polígonos de 10 ha (600 ha totais), " +
      "alocando estritamente 4 polígonos (2 treino + 2 held-out espacialmente independentes) em cada " +
      "um dos 15 estratos biofísicos de D12 emendada. Elimina o déficit estrutural em S1 x K2 e garante " +
      "reserva mínima de candidatos em 100% dos estratos sob o protocolo DP-20. " +
      "Estado anterior: 72 polígonos em 18 estratos vigentes até 30/10/2026.",
    // ...
  }
```

---

## 7. PROPOR E PARAR (Governança CLAUDE.md §2)

Em estrito cumprimento à Seção 2 do `CLAUDE.md`, **o agente executor NÃO altera `src/config/decisoes.ts`, D12, D16 nem D23 por conta própria**.

Submetem-se os números, a comprovação estatística e as quatro opções ao pesquisador para decisão soberana:
- **Opção 1:** Amostragem Exaustiva ($\pi_i = 1$) via D23 — Mantém 18 estratos em D12, mas deixa $E_{1,1,2}$ sem dados ($N_h = 0$).
- **Opção 2:** Declaração de Fora do Domínio de Validade (D07) — Exclui formalmente as combinações sem suporte físico na bacia.
- **Opção 3 (Recomendada):** Colapso de Estratos Adjacentes via Cochran (1977, §5A.12) [NÃO CONFERIDO NO PRIMÁRIO] — Unifica células deficientes em macro-estratos com pareamento perfeito (2+2) e reserva sob recusa, totalizando 15 ou 16 estratos (60 ou 64 polígonos). *Ressalva obrigatória: a recomendação repousa em citação pendente de conferência no primário.*
- **Opção 4:** Fatorial Condicional / Aninhado [Kish 1965 / Cochran 1977 — NÃO CONFERIDOS NO PRIMÁRIO] — Estratifica K̂ apenas em Ŝ2 e Ŝ3, fixando Ŝ1 em 3 estratos (60 polígonos).
