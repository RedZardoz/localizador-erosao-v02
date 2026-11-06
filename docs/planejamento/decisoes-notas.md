# Notas e Contextualizações Metodológicas — SAREL

Este arquivo armazena notas extensas, contextualizações históricas e análises de sensibilidade por decisão de `src/config/decisoes.ts`.
O script `scripts/gerar_decisoes_md.mjs` lê este arquivo e incorpora notas registradas sob cada cabeçalho de decisão (`## D01`, `## D02`, etc.) ao espelho auditável `docs/planejamento/DECISOES.md`.

## D01 — Fórmula do Fator C: Durigon et al. (2014)

### 1. Limitações Declaradas e Análise de Viés Estrutural

A adoção da formulação linear de Durigon et al. (2014), expressa por C = (1 - NDVI) / 2, apresenta duas limitações simétricas e contrapostas na escala biofísica:

1. **Saturação sob Dossel Vegetal Fechado (Viés de Subestimação Superior):**
   Para valores de NDVI > 0.80, típicos de matas ciliares e culturas no auge do desenvolvimento vegetativo, o Fator C tende assintoticamente a zero (C <= 0.10). O índice satura e não discrimina estratos adicionais de biomassa florestal densa.

2. **O Viés Oposto: Palhada Residual Seca em Sistema Plantio Direto (Superestimação Sistemática da Perda de Solo):**
   No contexto edafoclimático do Estado do Paraná, particularmente na Bacia do Paraná 3 (BP3), o Sistema Plantio Direto (SPD) consolidado mantém a superfície do solo coberta por resíduos culturais secos (palhada de milho, trigo ou aveia, tipicamente 3 a 6 t/ha de matéria seca) durante a entressafra.
   Como a palhada senescente não possui atividade fotossintética, a absorção na banda vermelha (B4) é reduzida e o espalhamento no infravermelho próximo (B8) diminui, resultando em valores baixos de NDVI.

   - **Demonstração Aritmética:**
     Assumindo a faixa empírica de NDVI em [0.20; 0.35]:
     - Para NDVI = 0.20:
       C = (1 - 0.20) / 2 = 0.80 / 2 = 0.400
     - Para NDVI = 0.35:
       C = (1 - 0.35) / 2 = 0.65 / 2 = 0.325
     Logo, para NDVI em [0.20; 0.35], o Fator C calculado situa-se estritamente na faixa [0.325; 0.400].

   - **Consequência Metodológica:**
     Um valor de C em [0.325; 0.400] é indistinguível de solo parcialmente exposto ou degradado em manejo convencional. Disso decorre a superestimação sistemática da perda de solo pela RUSLE em áreas conservacionistas de alta proteção superficial por palhada.

   - **Ressalva de Governança Epistêmica (§23.8 / Regra 8):**
     A premissa da faixa empírica de NDVI em [0.20; 0.35] para talhões em SPD na entressafra paranaense NÃO POSSUI REFERÊNCIA BIBLIOGRÁFICA CONFERIDA NA FONTE no momento deste levantamento. Encontra-se registrada formalmente como hipótese pendente de sustentação bibliográfica e remetida para a sessão dedicada de bibliografia. É vedado apresentá-la como fato referenciado e é vedado citar "Metodologia PPGTCA 2026" como fonte de autoridade.

### 2. Análise de Sensibilidade e Segregação do Caminho Analítico
Formulações alternativas (a função exponencial de Van der Knijff et al., 2000 e a modulação espectral exploratória por BSI) estão segregadas em funções explícitas de sensibilidade (calcularFatorCVanDerKnijff e calcularFatorCSensibilidadeBsi) e não integram a linha de base analítica oficial da pesquisa.
