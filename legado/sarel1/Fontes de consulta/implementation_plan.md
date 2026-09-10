# Plano de Implementação: Sistema de Amostragem e Rotulagem para Predição de Erosão Laminar (PPGTCA 2026)

## 1. Contexto e Justificativa Científica

O sistema a ser construído é o instrumento computacional de uma dissertação de mestrado do Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026).
O objetivo da pesquisa é **validar um método de localização e predição de erosão laminar** usando séries temporais multiespectrais, terreno, solo e regime de chuvas com um classificador supervisionado (XGBoost).

### O que o sistema faz (e o que NÃO faz):
1. **Propõe onde observar:** desenho amostral estratificado e espacialmente disperso (por quantis de $\Phi$, e não Top-N), garantindo cobertura de toda a faixa do critério e inclusão de negativos no mesmo frame de elegibilidade.
2. **Extrai features verificáveis:** provenientes de fontes públicas e legítimas (Copernicus DEM, Sentinel-1/2, Landsat, CHIRPS, GPM IMERG, Embrapa GeoInfo, SICAR/SIGEF/SNCR), com proveniência explícita rastreável por variável.
3. **Gerencia a campanha de rotulagem:** exporta planos de campo em **modo cego** (sem qualquer predição ou score visível), ingere rótulos de observação humana (interpretação visual Planet 3–5 m, KoboToolbox em campo, drone multiespectral) e compõe a matriz de treino.
4. **NÃO classifica erosão:** o rótulo de erosão vem exclusivamente da observação humana; nenhum número calculado pelo sistema pode virar rótulo (evitando vazamento de alvo).

### A Lei Fundamental (Parte II do documento):
- **Regra 1 — Dado verdadeiro ou ausência declarada:** Nunca preencher lacunas com constante, média ou valor típico. Se o dado não existe, o valor é `null` / `indisponivel` e o motivo é registrado.
- **Regra 2 — Nunca colapsar estados distintos:** "Consultado e não há" $\neq$ "não foi possível consultar" $\neq$ "fora da área de cobertura". Todo cliente externo retorna uma enumeração fechada.
- **Regra 3 — Proveniência viaja junto com o valor:** Todo valor científico é envolvido no tipo `Proveniencia<T>`.
- **Regra 4 — Nada calculado pelo sistema pode virar rótulo:** Severidade, score de prioridade, perda de solo e tipologia são critérios internos de amostragem; nunca saem como resultado, nunca entram na matriz de treino.
- **Regra 5 — Zero é um valor:** Verificação explícita de nulidade (`??`, `=== null`, `=== undefined`), nunca `||` para defaults numéricos.
- **Regra 6 — Respeitar as fontes legítimas:** Apenas sensores e cartas calibradas (Sentinel, Landsat, Copernicus DEM, CHIRPS, IMERG, Embrapa GeoInfo, PlanetScope). Mapbox Satellite e Google Maps servem exclusivamente como contexto visual de navegação, jamais para extração de features ou fotointerpretação temporal.
- **Regra 7 — Preservar o mascaramento do Earth Engine:** Máscaras de nuvem/sombra não podem ser desfeitas com `.unmask(constante)` sobre bandas físicas.
- **Regra 8 — Verificar antes de afirmar:** Registrar capacidades reais das APIs externas com data de checagem em comentário de código.

---

## 2. Decisões Metodológicas & Questões Abertas (Revisão do Usuário)

> [!IMPORTANT]
> **Decisão sobre a Fórmula do Fator C da RUSLE (Linha de Base de Comparação - §7.1 do PDF)**
> Na versão anterior do sistema, a fórmula utilizada era:
> $$C = \left(\frac{1 - \text{NDVI}}{2}\right)^{1 + \text{BSI}}$$
> Como a base $\frac{1 - \text{NDVI}}{2} < 1$, elevar a um expoente menor produz um número maior. BSI negativo (solo protegido por vegetação) reduzia o expoente e **aumentava** $C$, gerando uma perda de solo calculada 52% maior na vegetação do que no solo exposto (inversão física completa).
> 
> Apresentamos ao pesquisador as alternativas documentadas na literatura para a Fase 7:
> 1. **Durigon et al. (2014)**: modelo baseado em série temporal de NDVI para bacias tropicais:
>    $$C = \frac{1 - \text{NDVI}}{2}$$
>    (Simples, robusto e monotonicamente decrescente com a cobertura vegetal).
> 2. **Van der Knijff et al. (2000)**: formulação exponencial amplamente adotada na Europa e América Latina:
>    $$C = \exp\left(-\alpha \cdot \frac{\text{NDVI}}{\beta - \text{NDVI}}\right)$$
>    (onde $\alpha=2$ e $\beta=1$).
> 3. **Extensão BSI corrigida (com sinal invertido no expoente ou formulação aditiva calibrada)**:
>    Exigiria calibração empírica própria com parcelas experimentais da Embrapa/IAPAR.
> 
> *Recomendação do agente:* Adotar **Durigon et al. (2014)** ou **Van der Knijff et al. (2000)** para a linha de base RUSLE, mantendo $C$ estritamente no intervalo $[0, 1]$ com teste de monotonicidade obrigatório. A Fase 7 só será codificada após a validação desta escolha pelo pesquisador.

> [!NOTE]
> **Definição Operacional de Rótulo e Validação Cruzada Espacial**
> Conforme o `PLANEJAMENTO_PESQUISA_v3_2026-09-08.md`, o sistema gerenciará rótulos graduados: `ausente`, `incipiente`, `moderada`, `severa`.
> Os blocos espaciais serão atribuídos com base em grid de sub-bacias ou quadrículas UTM (ex.: células de 10 km a 20 km) para impedir contaminação por dependência espacial no particionamento da validação cruzada do XGBoost.

---

## 3. Arquitetura e Estrutura do Repositório

### Stack Tecnológica
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript 5.x (Strict Mode absoluto, `noImplicitAny: true`, `strictNullChecks: true`)
- **UI:** React 18 + Tailwind CSS + Lucide React
- **Mapas:** MapLibre GL (execução client-side)
- **Estado Global:** Zustand (armazenamento de objetos tipados com `Proveniencia<T>`, sem perda de atributos de origem)
- **Validação:** Zod
- **Testes Unitários:** Vitest
- **Exportação:** Gerador de XLSX com 3 abas e CSV com cabeçalho de procedência + bloco LGPD

### Estrutura de Diretórios
```
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/session/route.ts
│   │   │   ├── embrapa/solo/route.ts
│   │   │   ├── chuva/historico/route.ts
│   │   │   ├── gee/amostragem/route.ts
│   │   │   ├── gee/serie/route.ts
│   │   │   ├── fundiario/consulta/route.ts
│   │   │   └── exportar/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── mapa/
│   │   │   ├── MapaAmostral.tsx
│   │   │   └── ControlesMapa.tsx
│   │   ├── inspetor/
│   │   │   ├── InspetorPonto.tsx
│   │   │   ├── SeloProveniencia.tsx
│   │   │   └── GraficoSerieTemporal.tsx
│   │   ├── matriz/
│   │   │   ├── PainelMatrizTreino.tsx
│   │   │   └── DiagnosticoMatriz.tsx
│   │   ├── campanha/
│   │   │   ├── PainelCampanha.tsx
│   │   │   └── ExportacaoCegaModal.tsx
│   │   ├── comparador/
│   │   │   └── ComparadorEvento.tsx
│   │   └── relatorios/
│   │       ├── RelatorioQualidade.tsx
│   │       └── RelatorioAmostragem.tsx
│   ├── lib/
│   │   ├── embrapa/
│   │   │   └── embrapaSoilClient.ts      # Verificado e importado de Fontes de consulta
│   │   ├── gee/
│   │   │   ├── auth.ts                   # Sessão efêmera e credenciais em memória
│   │   │   ├── client.ts                 # Helpers de reduceRegion e inicialização
│   │   │   ├── terreno.ts                # Projeção métrica EPSG:31982, declividade, curvatura, TWI
│   │   │   ├── elegibilidade.ts          # Máscaras de uso, declividade 3-20%, buffers, cobertura temporal
│   │   │   ├── estratificacao.ts         # Amostragem estratificada por quantis de Phi
│   │   │   ├── serieTemporal.ts          # Extração Sentinel-2 / Landsat sem unmask espúrio
│   │   │   ├── harmonicos.ts             # Regressão harmônica (senoide anual/semianual + tendência)
│   │   │   └── compostoSoloNu.ts         # Mosaico de reflectância de solo descoberto
│   │   ├── chuva/
│   │   │   ├── chirps.ts                 # Série diária de precipitação
│   │   │   ├── imerg.ts                  # Intensidade sub-horária e aproximação do I30
│   │   │   └── eventos.ts                # Detecção e índice de mecanismo (sum(erosividade * soloNu))
│   │   ├── planet/
│   │   │   ├── dataApi.ts                # Busca com filtro UDM2
│   │   │   ├── ordersApi.ts              # Pedidos com clipping e harmonização
│   │   │   └── paresEvento.ts            # Montagem retrospectiva T-, T0, T+
│   │   ├── fundiario/
│   │   │   ├── matcher.ts                # Consulta local SICAR/SIGEF/SNCR (LGPD-compliant)
│   │   │   └── protecao.ts               # Mascaramento rígido e guardas locais
│   │   ├── matriz/
│   │   │   ├── montagem.ts               # Composição da matriz de treino sem vazamento de alvo
│   │   │   └── invariantes.ts            # Os 7 invariantes bloqueantes da exportação
│   │   ├── export/
│   │   │   ├── xlsxWriter.ts             # Escritor XLSX robusto sem corrupção
│   │   │   └── planilha.ts               # Geração das 3 abas e CSV sincronizado com LGPD
│   │   └── rusle/
│   │       ├── baselineCalculator.ts     # Linha de base estrita (Renard et al., 1997)
│   │       └── fatores.ts                # Cálculo com teste de monotonicidade de C
│   ├── store/
│   │   └── useAmostragemStore.ts         # Zustand com serialização direta de Proveniencia
│   └── types/
│       ├── proveniencia.ts               # Tipo discriminado e helpers (Regra 3)
│       └── ponto.ts                      # PontoAmostral completo (pág. 6 do PDF)
├── test/
│   ├── invariantes.test.ts
│   ├── proveniencia.test.ts
│   ├── planilhaExport.test.ts
│   ├── embrapaSoilClient.test.ts
│   ├── terreno.test.ts
│   ├── rusleBaseline.test.ts
│   └── estratificacao.test.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vitest.config.ts
└── README.md
```

---

## 4. Plano de Execução em 7 Fases

### Fase 1 — Fundação (Tipos, Invariantes, Escritor de Planilha)
1. **Configuração do Projeto:** Inicializar `package.json`, TypeScript estrito, Vitest, Tailwind, scripts de verificação (`vitest`, `tsc --noEmit`).
2. **`src/types/proveniencia.ts`:**
   - Tipo union discriminado `Proveniencia<T>` (`medido`, `modelado`, `tabelado`, `indisponivel`).
   - Funções auxiliares `valorOuNulo<T>()` e `ehMedido()`.
3. **`src/types/ponto.ts`:**
   - Interface `PontoAmostral` exatamente conforme especificação da página 6 do PDF (IDs estáveis, coordenadas, estrato interno, variáveis de terreno, solo, série, chuva, rótulo observado cego, contexto fundiário).
4. **`src/lib/matriz/invariantes.ts`:**
   - Implementar os 7 invariantes do §10 do PDF:
     1. Coerência RUSLE: Perda_Solo preenchida $\iff$ 5 fatores preenchidos $\iff$ memória com equação.
     2. Escala: Scores dentro da faixa documentada.
     3. Proveniência derivada: `Campos_Estimados` lista exatamente campos com `estado !== "medido"`.
     4. Coerência de origem: Origem satélite $\implies$ cena, data de cálculo e versão preenchidas.
     5. Afirmação negativa: "Sem correspondência" só após consulta com sucesso sem match.
     6. Lista negra de literais geográficos: Nenhum "Custom", "Bacia Local", "Área Amostral GEE".
     7. **Detector de constante disfarçada:** Nenhuma coluna numérica tem valor idêntico em 100% das linhas quando $n > 20$.
5. **`src/lib/export/xlsxWriter.ts` e `src/lib/export/planilha.ts`:**
   - Aba 1: Dados com colunas adjacentes `[Variavel] | [Variavel_Origem]`. Célula ausente numérica fica vazia (nunca 0); célula ausente textual recebe motivo explicativo. DMS deriva do mesmo número arredondado com rollover correto de 60.0".
   - Aba 2: Procedência e Conformidade (data de emissão, filtros ativos, janela temporal, contagem real por fonte, bloco LGPD).
   - Aba 3: Qualidade do Dado (% medido, % modelado, % tabelado, % indisponível por variável).
   - Exportação CSV sincronizada recebendo os mesmos metadados e bloco LGPD.
6. **Testes da Fase 1:**
   - Teste de rejeição de exportação sintética com constantes (ex.: 150 linhas com 35.2 t/ha/ano) disparando o Invariante 7.
   - Teste de coerência do Bloco F e Campos_Estimados derivados.

### Fase 2 — Fontes Verificadas (Embrapa, GEE Terreno, Chuva CHIRPS/IMERG)
1. **`src/lib/embrapa/embrapaSoilClient.ts`:**
   - Integrar a implementação de referência já testada e verificada de `Fontes de consulta/embrapaSoilClient.ts` com seus tipos e mapeamento de componentes pedológicos e erodibilidade categórica.
2. **`src/lib/gee/auth.ts` e `src/lib/gee/client.ts`:**
   - Autenticação efêmera por Service Account em memória / cookie httpOnly, restrição a chamadas locais (`127.0.0.1` / `localhost`).
3. **`src/lib/gee/terreno.ts`:**
   - Projeção métrica local `EPSG:31982` (UTM 22S, Paraná) sobre o Copernicus DEM GLO-30 (eliminando o erro de ~10% de subestimação gerado por EPSG:3857).
   - Guarda de plausibilidade estrita: declividade rejeitada fora de $[0^\circ, 75^\circ]$.
   - Curvatura de perfil, curvatura plana e TWI calculados em metros.
4. **`src/lib/chuva/chirps.ts` e `src/lib/chuva/imerg.ts`:**
   - Ingestão de série diária CHIRPS (precipitação acumulada 30d, 90d) e intensidade GPM IMERG semi-horária para cálculo do $I_{30}$.
   - `src/lib/chuva/eventos.ts`: cálculo do índice de mecanismo $\sum (\text{erosividade}_t \times \text{soloNu}_t)$.
5. **Testes da Fase 2:**
   - Testes unitários com fixtures de satélite e dados de terreno verificando rejeição de projeções incorretas e plausibilidade.

### Fase 3 — Séries Temporais e Composto de Solo Exposto
1. **`src/lib/gee/serieTemporal.ts`:**
   - Extração da série multibanda Sentinel-2 / Landsat preservando máscaras de nuvem reais (Regra 7: sem `.unmask(constante)` que reintroduza nuvem como medição).
2. **`src/lib/gee/harmonicos.ts`:**
   - Regressão harmônica por banda (offset, amplitude anual, fase, tendência linear) sem interpolação forçada sobre vazios.
3. **`src/lib/gee/compostoSoloNu.ts`:**
   - Construção do composto de solo exposto baseado apenas em pixels com solo descoberto comprovado.
4. **Testes da Fase 3:**
   - Garantir que lacunas permaneçam marcadas como `NaN` ou `indisponivel` ao longo de toda a transformação.

### Fase 4 — Amostragem para Treino & Blocos Espaciais
1. **`src/lib/gee/elegibilidade.ts`:**
   - Elegibilidade: ESA WorldCover (classes 30/40/60), declividade 3–20%, exclusão de corpos d'água (buffer 30m) e áreas urbanas (buffer 150m), e requisito de **cobertura temporal mínima**.
2. **`src/lib/gee/estratificacao.ts`:**
   - Amostragem estratificada **por quantis** de $\Phi$ e solo/clima (em vez de Top-N), garantindo alocação uniforme sobre todo o gradiente e amostras negativas dentro do mesmo frame.
3. **Blocos Espaciais:**
   - Identificação e associação do `blocoEspacial` para validação cruzada espacial independente (Roberts et al., 2017).
4. **Testes da Fase 4:**
   - Verificação de cobertura de todo o espectro do índice $\Phi$ na amostra gerada.

### Fase 5 — Ingestão Planet e Pareamento de Eventos
1. **`src/lib/planet/dataApi.ts`:**
   - Busca no catálogo PlanetScope com leitura da máscara UDM2 para cálculo da fração limpa específica do alvo.
2. **`src/lib/planet/ordersApi.ts`:**
   - Mecanismo de submissão de pedidos com buffer/clipping estrito e harmonização espectral com Sentinel-2.
3. **`src/lib/planet/paresEvento.ts`:**
   - Montagem retrospectiva dos trios de evento: $T^-$ (pré-evento limpo), $T_0$ (0–2 dias pós-chuva), $T^+$ (7–15 dias pós-chuva para solo seco).
   - Script de viabilidade prévio para contabilização de pares existentes.

### Fase 6 — Interface do Usuário (Next.js App Router + MapLibre GL)
1. **Mapa Cartográfico (`src/components/mapa/`):**
   - MapLibre GL com pontos coloridos por estrato amostral (nunca por severidade).
   - Alternador para visualização por completude de dados.
2. **Inspetor de Ponto (`src/components/inspetor/`):**
   - Painel de detalhe do ponto apresentando os selos visuais de proveniência:
     - ● `medido` (verde/sólido)
     - ◊ `modelado` (azul/losango)
     - □ `tabelado` (amarelo/quadrado)
     - ○ `indisponivel` (cinza/círculo aberto)
   - Gráfico de série temporal com lacunas representadas como quebras reais de linha (descontinuidade estrita, sem interpolação enganosa).
3. **Painel da Matriz de Treino (`src/components/matriz/`):**
   - Estatísticas de completude, balanço de classes, distribuição espacial e alerta ativo de baixa variância / constante (Invariante 7 em tempo real).
4. **Painel de Campanha & Exportação Cega (`src/components/campanha/`):**
   - Controle de status (a rotular, em campo, rotulado, validado).
   - Botão destacado de **Exportação Cega** para envio a campo e fotointerpretação, omitindo qualquer dado de predição.
5. **Relatórios Científicos (`src/components/relatorios/`):**
   - Relatório de Qualidade do Dado, Relatório de Reprodutibilidade da Amostragem e Dossiê do Ponto.

### Fase 7 — Linha de Base RUSLE
1. **Implementação da fórmula acordada para o Fator C:**
   - Após decisão do pesquisador, codificar `src/lib/rusle/baselineCalculator.ts` e `fatores.ts`.
   - Adicionar o teste obrigatório de monotonicidade:
     $$BSI_1 < BSI_2 \implies C_1 \le C_2 \quad (\text{com NDVI fixo})$$
   - Bloquear o preenchimento de `perdaSolo` a menos que todos os 5 fatores e a memória de cálculo estejam completos.

---

## 5. Plano de Verificação

### Testes Automatizados (Vitest)
Executar comandos após cada etapa de código:
```bash
npm run test
npx tsc --noEmit
npm run lint
```
1. **`test/invariantes.test.ts`:**
   - Validar que a tentativa de exportar 150 linhas com valores idênticos (como no artefato anterior reprovado: 35.2 t/ha/ano, 16% slope, 0.45 BSI) é imediatamente abortada pelo Invariante 7.
   - Validar que `Campos_Estimados` identifica precisamente os campos não-medidos.
   - Validar rejeição de literais proibidos ("Custom", "Bacia Local", "Área Amostral GEE").
2. **`test/planilhaExport.test.ts`:**
   - Conferência de estrutura de 3 abas no XLSX.
   - Verificação de que zero numérico (`0`) não é transformado em ausência ou 16.
   - Verificação de que coordenadas DMS e decimais são estritamente síncronas e tratam rollover de 60.0".
   - Conferência de que o CSV recebe o bloco LGPD e metadados de procedência.
3. **`test/terreno.test.ts`:**
   - Garantir que declividades calculadas sobre EPSG:31982 respeitam a escala métrica real sem distorção do Mercator.
   - Garantir que a guarda de plausibilidade dispara erro para declividades fora de $[0^\circ, 75^\circ]$.
4. **`test/rusleBaseline.test.ts`:**
   - Teste de monotonicidade do Fator C em relação ao BSI e NDVI.
   - Teste da regra de coerência da perda de solo (só preenche se os 5 fatores existirem).

### Verificação Manual e Validação Científica
- Inspecionar a interface e o Inspetor de Ponto, verificando se os selos de proveniência refletem com exatidão a origem de cada feature.
- Executar teste de exportação em modo cego e verificar que nenhuma coluna preditiva ou interna vaza para o arquivo de campo.
