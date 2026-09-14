# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar

**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)**  
*Pesquisa de Mestrado: Validação de Método de Localização e Predição de Erosão Laminar no Paraná*

---

## Visão Geral

O **SAREL** é um sistema computacional concebido para garantir o rigor científico, a reprodutibilidade metodológica e a integridade de dados na geração de matrizes de treino e campanhas de validação de erosão laminar.

O sistema opera sob as **9 Regras Invioláveis da Lei Fundamental** (`docs/planejamento/PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md`), garantindo que:
- **Nada calculado vira rótulo:** O rótulo de erosão provém exclusivamente de observadores humanos e sensores primários (campo, fotointerpretação PlanetScope, ortomosaicos de drone).
- **Sem valores fabricados ou defaults disfarçados:** Parâmetros ausentes permanecem como `indisponivel` acompanhados da causa real.
- **Rastreabilidade e proveniência científica total:** Cada variável do sistema possui selo de proveniência (`● medido`, `◊ modelado`, `□ tabelado`, `○ indisponível`).
- **Segregação cega e proteção LGPD:** Dados fundiários mascarados byte a byte e exportações cegas por perfil operacional (`planilha`, `interpretacao-cega`, `campo-cego`, `voo-cego`, `matriz-treino`).

---

## Arquitetura e Módulos Principais

1. **Amostragem e Blocos Espaciais (`src/lib/gee/`):**
   - Estratificação multivariada em 18 estratos $\hat{S} \times \hat{E} \times \hat{K}$ com garantia de candidatos à classe negativa.
   - *Spatial Thinning* geodésico determinístico (Fisher-Yates) com raio mínimo de 1,0 km (P02).
   - Validação cruzada espacial com blocos espaciais determinados por variograma empírico sem cortes artificiais.
2. **Sensoriamento e Harmonização:**
   - Decomposição harmônica multivariada (OLS de 1 e 2 harmônicos) com métricas de qualidade de ajuste ($R^2$, erro-padrão).
   - Frequência de solo exposto ($\hat{E}$), maior sequência temporal de solo nu e mês modal de exposição.
   - Modelagem de pares de eventos ($T_-$, $T_0$, $T_+$) PlanetScope e radar Sentinel-1 GRD banda C para datas chuvosas sob nuvem.
3. **Controle de Cotas PlanetScope (`src/lib/planet/quota.ts`):**
   - Livro-razão persistente em disco (`livroRazao.json`) com segregação de cotas de download e tiles, e política estrita de recusa a sobretaxa (`OVERAGE: OFF`).
4. **Linha de Base RUSLE (`src/lib/rusle/`):**
   - Fator C regional tropical por **Durigon et al. (2014)**: $C = (1 - \text{NDVI}) / 2$, com análise de sensibilidade por **van der Knijff et al. (2000)**.
   - Fator P tabelado ($1{,}0$) por **Renard et al. (1997)**.
   - Guardas ativas para decisões metodológicas pendentes (D13 para Fator R, D14 para Fator K, D15 para Fator LS), com perda de solo estritamente vinculada ao Invariante 1.
5. **Ingestão e Matriz de Treino (`src/lib/rotulos/`, `src/lib/matriz/`):**
   - Concordância entre intérpretes via Kappa de Cohen com alerta bloqueante para $\kappa < 0{,}60$.
   - Segregação mandatória de voos de drone como conjunto de teste independente (*held-out*).
   - Invariantes 1 a 7 verificados em tempo de execução antes de qualquer exportação de arquivo.

---

## Execução e Testes

### Pré-requisitos
- Node.js $\ge 18.17.0$
- npm

### Instalação
```bash
npm install
```

### Disciplina dos "Três Verdes"
O projeto adota verificação contínua automatizada:
```bash
# 1. Suíte de testes unitários e de integração (Vitest)
npm run test

# 2. Verificação estrita de tipagem TypeScript
npm run typecheck

# 3. Linter sem advertências
npm run lint

# 4. Compilação de produção
npm run build
```

### Executar em Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação em `http://127.0.0.1:3000`.

---

## Preservação Histórica

O código legado original do Localizador e protótipos prévios encontram-se permanentemente arquivados e congelados na tag Git:
```bash
git checkout legado-pre-sarel
```
A documentação metodológica, relatórios de auditoria e históricos de planejamento estão organizados no diretório `docs/`.
