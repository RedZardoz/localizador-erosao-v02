# Plano de Implementação v2 — SAREL

**Sistema de Amostragem e Rotulagem para Erosão Laminar** — PPGTCA 2026

**Substitui:** `implementation_plan.md` (v1), mantido para referência.
**Corrige:** os 4 achados bloqueantes, 6 importantes e 4 menores registrados em `AUDITORIA_implementation_plan_2026-09-08.md`.
**Data:** 08/09/2026

---

## 0. Como usar este plano

Documentos de apoio, a ler antes da primeira linha de código:

| Documento | Papel |
|---|---|
| `PROMPT_NOVO_PROJETO_2026-09-08.md` | Lei Fundamental (8 regras), invariantes, especificação de UI |
| `PLANEJAMENTO_PESQUISA_v3_2026-09-08.md` | fundamentação metodológica e referências |
| `Relatorio_Auditoria_Tabela_Consolidada_2026-09-08.txt` | os defeitos do sistema anterior, com evidência |
| `embrapaSoilClient.ts` | implementação de referência já verificada ao vivo |

**Regra de trabalho que prevalece sobre todas as outras:** quando houver conflito entre "entregar um número" e "dizer a verdade", diz-se a verdade.

**Quando parar e perguntar.** Nas decisões marcadas 🛑 o agente **não decide sozinho**: apresenta as alternativas com demonstração numérica e aguarda o pesquisador. São decisões de dissertação, não de implementação.

---

## 1. O que o sistema é

Instrumento computacional de uma dissertação de mestrado. Objetivo da pesquisa: **validar um método de localização e predição de erosão laminar** com séries temporais multiespectrais, terreno, solo e chuva, usando XGBoost (treinado **fora** deste sistema).

O SAREL faz três coisas:

1. **Propõe onde observar** — desenho amostral estratificado e espacialmente disperso.
2. **Extrai features verificáveis** — de fontes legítimas, com proveniência por variável.
3. **Gerencia a campanha de rotulagem** — exporta plano de campo cego, **ingere rótulos observados**, monta a matriz de treino.

**NÃO classifica erosão.** O rótulo vem exclusivamente de observação humana.

---

## 2. A Lei Fundamental

Reproduzida integralmente do prompt. Cada regra nasceu de um defeito real e documentado.

| # | Regra | Defeito de origem |
|---|---|---|
| 1 | **Dado verdadeiro ou ausência declarada** — lacuna nunca vira constante; valor é `null` com motivo | 150/150 linhas com declividade 16%, BSI 0,45, NDVI 0,32 apresentados como medição |
| 2 | **Nunca colapsar estados distintos** — "não há" ≠ "não pude consultar" ≠ "fora de cobertura" | falha de banco virava "Sem correspondência — nenhum imóvel nesta coordenada" |
| 3 | **Proveniência viaja junto com o valor** — todo valor científico em `Proveniencia<T>` | valor e origem trafegavam separados; 4 rotas divergiram |
| 4 | **Nada calculado pelo sistema vira rótulo** — Φ, score e perda são critérios internos | `severity` era função determinística das próprias features |
| 5 | **Zero é um valor** — nulidade explícita, nunca `\|\|` para default numérico | `{slope: 0}` virava 16 sem ser marcado como estimado |
| 6 | **Respeitar as fontes legítimas** — só sensores e cartas calibradas no caminho analítico | Mapbox/Google não têm calibração nem data por pixel |
| 7 | **Preservar o mascaramento do GEE** — nunca `.unmask(constante)` em banda física | `unmask(0.0)` no BSI reintroduzia nuvem como medição |
| 8 | **Verificar antes de afirmar** — capacidade real da API, com data em comentário | Embrapa estava no app como PNG decorativo, nunca consultada |

---

## 3. Decisões metodológicas

### 3.1 Fórmula do Fator C da RUSLE — **DECIDIDA em 08/09/2026**

> **Decisão do pesquisador, após revisão bibliográfica: Durigon et al. (2014).**
>
> $$C = \frac{1 - NDVI}{2}$$
>
> A Fase 8 está **desbloqueada**. O teste de monotonicidade em BSI deve ser **removido**, não mantido (§13.1) — a fórmula não usa BSI.

**Justificativa registrada para a dissertação:**

1. **Validade regional.** Desenvolvida e validada em bacia tropical brasileira. Os parâmetros α = 2 e β = 1 de van der Knijff et al. (2000) são calibração europeia; adotá-los sem recalibração para o Paraná seria constante arbitrária — exatamente o defeito que o projeto combate.
2. **Concebida para série temporal**, que é a arquitetura do SAREL.
3. **Sem parâmetros livres e sem truncamento.** C ∈ [0,1] naturalmente para NDVI ∈ [−1,1]. A formulação de van der Knijff ultrapassa 1 para NDVI negativo (C = 1,396 em NDVI = −0,2) e colapsa numericamente perto de β = 1, exigindo guardas — demérito num sistema cujos invariantes proíbem correções silenciosas.
4. **Não anula o sinal sob dossel.** Verificado numericamente: em NDVI = 0,75, van der Knijff produz A ≈ 0,47 t·ha⁻¹·ano⁻¹, ou seja, erosão praticamente nula sob cultura vigorosa. Isso contradiz a premissa do próprio projeto, que estuda **erosão laminar sob lavoura**. Durigon preserva o gradiente (A ≈ 23,9 no mesmo ponto).
5. **Proveniência limpa.** A fórmula legada era exatamente esta elevada a um expoente derivado do BSI. Adotar Durigon é **remover a extensão defeituosa**, não trocar de método. Redação sugerida: *"adotou-se a formulação original de Durigon et al. (2014), sem a extensão por BSI presente na versão legada, que invertia o comportamento físico do fator"*.

**Limitação a declarar.** A resposta é linear em NDVI, enquanto a proteção por cobertura tende a saturar. Somado à saturação do próprio NDVI sob biomassa densa, isso comprime a faixa de C em dossel fechado. A limitação deve constar da dissertação, com a análise de sensibilidade da §13.2 como resposta antecipada.

<details>
<summary>Registro do problema que motivou a decisão</summary>

A fórmula anterior era `C = ((1 − NDVI)/2)^(1 + BSI)`. Como a base é menor que 1, elevar a expoente menor produz número maior: BSI negativo (solo protegido) **aumentava** C.

Verificado numericamente, NDVI fixo em 0,70:

| BSI | C obtido | esperado fisicamente |
|---|---|---|
| −0,9 | **0,8272** | próximo de 0 |
| 0,0 | 0,1500 | intermediário |
| +0,9 | **0,0272** | próximo de 1 |

Efeito: pixel vegetado (NDVI 0,85 / BSI −0,70) recebia C = 0,4597 contra 0,3019 do solo nu — perda 52% **maior** na vegetação.

**Observação que simplifica a justificativa:** a fórmula antiga é exatamente a de **Durigon et al. (2014) elevada a um expoente derivado do BSI**. Adotar Durigon puro é *remover a extensão que causou a inversão*, não trocar de método. Redação sugerida para a dissertação: *"adotou-se a formulação original de Durigon et al. (2014), sem a extensão por BSI, que invertia o comportamento físico do fator"*.

Alternativas a submeter ao pesquisador:

1. **Durigon et al. (2014):** `C = (1 − NDVI)/2` — simples, monotonicamente decrescente com a cobertura.
2. **van der Knijff et al. (2000):** `C = exp(−α · NDVI/(β − NDVI))`, com α = 2 e β = 1.
3. **Extensão BSI corrigida** — exigiria calibração empírica com parcelas experimentais.

</details>

### 3.2 🛑 Definição operacional do rótulo *(Fase 0, bloqueante)*

A escala `ausente / incipiente / moderada / severa` é **provisória** até a Fase 0. Ver §5.

### 3.3 Definição de Φ e da estratificação *(corrige B2)*

**Problema do plano v1:** referia "quantis de Φ" quatro vezes sem definir Φ, cujos insumos mudaram — o BSI agora vem de uma série, e o Ψ_solo vinha do `inferPedologyClass`, eliminado.

**Decisão: substituir o escalar Φ por estratificação multivariada.**

**Justificativa técnica.** Um escalar composto colapsa três dimensões em uma: dois pontos com perfis muito diferentes podem ter o mesmo Φ, e estratificar por quantis de Φ **não garante** cobertura de cada dimensão isoladamente. Além disso, um Φ escalar exige pesos, e pesos exigem justificativa que não existe — seria reintroduzir constante arbitrária, exatamente o defeito que o projeto combate.

A estratificação por **terços cruzados** elimina a necessidade de pesos e garante cobertura marginal de cada gradiente.

**As três dimensões:**

| Dimensão | Insumo | Origem |
|---|---|---|
| **Ŝ** — terreno | declividade em % | Copernicus DEM em EPSG:31982 (Fase 2) |
| **Ê** — exposição de solo | **frequência de solo descoberto na série** (fração de observações válidas com NDVI < limiar) | série temporal (Fase 3) |
| **K̂** — erodibilidade | classe da carta da Embrapa, mapeada para ordinal | `embrapaSoilClient` (Fase 2) |

**Ê usa a estatística da série, não o BSI de data única.** É coerente com a própria metodologia: o que distingue solo erodido de solo recém-gradeado é a *persistência* da exposição, não um instante.

**Estratos:** 3 terços de Ŝ × 3 terços de Ê × 2 níveis de K̂ = **18 estratos**. Terços calculados sobre a distribuição empírica **dentro do frame de elegibilidade da AOI**, não sobre limiares absolutos.

**Alocação:** uniforme entre estratos ocupados. Estrato vazio é registrado como vazio no relatório de amostragem — nunca preenchido por vizinho.

**Classe negativa:** emerge naturalmente das células de Ŝ e Ê baixos, dentro do mesmo frame de elegibilidade. É o requisito do planejamento v3 satisfeito pelo desenho, não por regra à parte.

**Φ permanece definido, mas rebaixado a diagnóstico.** Média aritmética simples das três componentes normalizadas em [0,1]:

```
Φ_diag = (Ŝ_norm + Ê_norm + K̂_norm) / 3
```

Serve **exclusivamente** para ordenação dentro do estrato e para o relatório. Peso igual é declarado como escolha de conveniência sem alegação física. **Nunca é exportado, nunca é feature, nunca é rótulo** (Regra 4).

#### 3.3.1 Mapeamento das classes de erodibilidade da Embrapa

A camada `brasil_erodibilidade_solo` devolve `classe` **categórica** e um `codnum`. Verificado em 08/09/2026: `codnum 4 = "Alta"`, `codnum 9 = "Area urbana"`. A presença de categoria não-pedológica prova que **`codnum` não é uma escala ordinal contínua** e não pode ser usado diretamente.

**Procedimento obrigatório, primeira tarefa da Fase 2:**

1. **Enumerar o domínio completo** da camada (WFS `GetFeature` com `propertyName=classe,codnum`, ou requisição de legenda). Registrar em comentário com data (Regra 8).
2. **Mapear explicitamente** cada classe pedológica para um ordinal, com justificativa documental.
3. **Excluir do frame** as categorias não-pedológicas ("Area urbana" e similares) — já removidas pela máscara de elegibilidade, mas a exclusão deve ser explícita e testada.
4. Se surgir classe fora do mapa, o resultado é `Proveniencia` com `estado: "indisponivel"` e motivo — **nunca** um ordinal arbitrado.

🛑 **Submeter o mapa ordinal ao pesquisador antes de usar.**

### 3.4 Blocos espaciais *(corrige I4)*

**Problema do plano v1:** propunha "células de 10 km a 20 km" sem justificativa — constante arbitrária, a classe de defeito que o projeto combate.

**Procedimento correto.** Roberts et al. (2017) orientam que o bloco seja **maior que o alcance da autocorrelação espacial**, quantidade a ser estimada e não arbitrada.

1. Após a Fase 4 gerar a amostra e extrair as features, calcular o **variograma empírico** das features principais disponíveis antes da rotulagem — declividade, frequência de solo descoberto e o ordinal de erodibilidade.
2. Adotar como aresta do bloco o **maior alcance** entre elas, arredondado para cima.
3. Registrar o valor, o variograma e a data no Relatório de Amostragem.
4. Reavaliar após a rotulagem, com o variograma do próprio rótulo.

**Fallback documentado:** se o variograma for inconclusivo (poucos pares, efeito pepita dominante), adotar 20 km e **registrar explicitamente** que é provisório e por quê. Nunca silenciosamente.

---

## 4. Arquitetura

### 4.1 Stack

Next.js 14 (App Router) · TypeScript 5 strict (`noImplicitAny`, `strictNullChecks`) · React 18 · Tailwind · Lucide · MapLibre GL · Zustand · Zod · Vitest.

Node ≥ 18.17. Execução **local**: rotas que tocam base fundiária ou credenciais recusam requisição não-local.

### 4.2 Estrutura de diretórios

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
│   │   │   ├── rotulos/importar/route.ts        # NOVO (corrige B3)
│   │   │   └── exportar/route.ts
│   │   ├── globals.css · layout.tsx · page.tsx
│   ├── components/
│   │   ├── mapa/          MapaAmostral.tsx · ControlesMapa.tsx
│   │   ├── inspetor/      InspetorPonto.tsx · SeloProveniencia.tsx · GraficoSerieTemporal.tsx
│   │   ├── matriz/        PainelMatrizTreino.tsx · DiagnosticoMatriz.tsx
│   │   ├── campanha/      PainelCampanha.tsx · ExportacaoCegaModal.tsx · ImportarRotulosModal.tsx
│   │   ├── comparador/    ComparadorEvento.tsx
│   │   └── relatorios/    RelatorioQualidade.tsx · RelatorioAmostragem.tsx · DossiePonto.tsx
│   ├── lib/
│   │   ├── embrapa/       soilClient.ts (+ .test.ts colocalizado)
│   │   ├── gee/           auth · client · terreno · elegibilidade · estratificacao
│   │   │                  serieTemporal · harmonicos · compostoSoloNu
│   │   ├── chuva/         chirps · imerg · eventos
│   │   ├── planet/        dataApi · ordersApi · statisticalApi · quota
│   │   │                  features · paresEvento
│   │   ├── fundiario/     matcher · protecao
│   │   ├── rotulos/       ingestaoKobo · ingestaoInterpretacao · ingestaoDrone
│   │   │                  concordancia                              # NOVO (corrige B3)
│   │   ├── matriz/        montagem · invariantes
│   │   ├── export/        xlsxWriter · planilha
│   │   ├── seguranca/     localOnly · guardaSintetico              # NOVO (corrige I2)
│   │   └── rusle/         baselineCalculator · fatores
│   ├── store/             useAmostragemStore.ts
│   └── types/             proveniencia.ts · ponto.ts · rotulo.ts
├── package.json · tsconfig.json · tailwind.config.js · vitest.config.ts · README.md
```

**Testes colocalizados** *(corrige I6)*: `modulo.ts` + `modulo.test.ts` no mesmo diretório. O `embrapaSoilClient.test.ts` já verificado importa por caminho relativo (`from "./embrapaSoilClient"`) e quebraria em `/test/`.

### 4.3 Tipos centrais

```ts
// src/types/proveniencia.ts
export type Proveniencia<T> =
  | { estado: "medido";       valor: T; fonte: string; adquiridoEm: string; detalhe?: string }
  | { estado: "modelado";     valor: T; modelo: string; insumos: string[]; qualidade?: QualidadeAjuste }
  | { estado: "tabelado";     valor: T; tabela: string; chave: string }
  | { estado: "indisponivel"; motivo: string };

// corrige M2 — coeficiente harmônico carrega a qualidade do ajuste
export interface QualidadeAjuste {
  nObservacoes: number;
  r2?: number;
  erroPadrao?: number;
}

export function valorOuNulo<T>(p?: Proveniencia<T>): T | null {
  return p && p.estado !== "indisponivel" ? p.valor : null;
}
export function ehMedido(p?: Proveniencia<unknown>): boolean {
  return p?.estado === "medido";
}
```

```ts
// src/types/rotulo.ts — SEMPRE de observação, nunca de cálculo
export type ClasseRotulo = "ausente" | "incipiente" | "moderada" | "severa"; // PROVISÓRIO até a Fase 0
export type ModalidadeRotulo = "interpretacao-visual" | "campo" | "drone";

export interface Rotulo {
  classe: ClasseRotulo;
  modalidade: ModalidadeRotulo;
  observador: string;
  observadoEm: string;
  confianca?: "alta" | "media" | "baixa";
  observacoes?: string;
  cego: boolean;              // o observador desconhecia qualquer predição ou score
}

export interface RotuloConsolidado {
  final: Rotulo;
  origens: Rotulo[];          // todas as observações independentes
  kappa?: number;             // concordância quando houver 2+ intérpretes
  divergencia?: "nenhuma" | "resolvida-por-terceiro" | "pendente";
}
```

`PontoAmostral` conforme a página 6 do prompt, com `estratoId` derivado do trio (Ŝ, Ê, K̂) e `criterioSelecao: { tercilS, tercilE, nivelK, phiDiag }`.

---

## 5. Fase 0 — Definição operacional do rótulo 🛑 *(corrige B4 — BLOQUEANTE)*

Nenhuma coleta antes desta fase. O desempenho máximo de qualquer classificador é limitado pela consistência do rótulo; ruído sistemático de rotulagem é aprendido pelo modelo como se fosse sinal, e nenhum hiperparâmetro compensa.

**Produtos:**

1. **Documento de critérios observacionais** por classe, escrito e revisado com o orientador. Requisitos: observável pelo instrumento, reprodutível entre observadores, registrado antes de olhar os dados.
2. **Critério de negativo tão explícito quanto o de positivo.** Confirmar ausência é mais difícil que confirmar presença — a erosão laminar é difusa. Sem critério explícito, "não observei" será registrado como "não há".
3. **Ficha de campo** (formulário KoboToolbox) derivada dos critérios — artefato de software, não pode ser especificado antes.
4. **Protocolo de concordância:** dois intérpretes independentes, Kappa de Cohen (1960) com patamares de Landis & Koch (1977), e regra de desempate. **Kappa < 0,60 significa que o critério não está operacional** e precisa ser reescrito antes da coleta em escala.

**Indicadores candidatos** (planejamento v3 §3): espessura do horizonte A, exposição do horizonte B, pedestais e raízes expostas, início de sulcos, deposição em sopé, vigor diferencial da cultura.

**Dependência de código:** o enum `ClasseRotulo` é o **último item da Fase 1**. Todo o resto da Fase 1 pode ser construído em paralelo à Fase 0.

---

## 6. Fase 1 — Fundação

### 6.1 Configuração
`package.json`, TypeScript estrito, Vitest, Tailwind. Scripts: `test`, `typecheck` (`tsc --noEmit`), `lint`.

### 6.2 Tipos
`proveniencia.ts` e `ponto.ts` conforme §4.3. `rotulo.ts` sem o enum `ClasseRotulo` até a Fase 0 concluir.

### 6.3 Guarda antissintético *(corrige I2)*
`src/lib/seguranca/guardaSintetico.ts` — o sistema anterior aplicava essa guarda em **todas** as saídas e na reidratação do estado, com cobertura completa e sem brecha. Reintroduzir:

- todo ponto de teste recebe marca inequívoca (`origemSintetica: true`);
- **toda** rota de saída (planilha, CSV, dossiê, exportação cega, matriz) filtra e **recusa** exportação contendo ponto sintético, com mensagem explícita;
- teste de cobertura verifica que nenhuma rota de saída escapa da guarda.

Crítico porque a Fase 1 cria deliberadamente fixtures de 150 linhas idênticas para exercitar o Invariante 7.

### 6.4 Invariantes *(corrige I3)*
`src/lib/matriz/invariantes.ts`, executados **antes** de gerar qualquer arquivo. Falha em qualquer um: recusa a exportação com mensagem explícita.

| # | Invariante | Observação |
|---|---|---|
| 1 | `perdaSolo` preenchida **se e somente se** os 5 fatores preenchidos **se e somente se** memória com a equação | inerte até a Fase 8 — registrar isso, para que verde não seja lido como cobertura *(corrige M4)* |
| 2 | **Φ_diag dentro de [0,1] na faixa interna** | **redefinido**: pela Regra 4 nenhum score é exportado, logo não há score na planilha para validar. O invariante passa a checar a faixa interna de Φ_diag |
| 3 | `Campos_Estimados` lista **exatamente** os campos com `estado !== "medido"` | derivado, nunca escrito à mão |
| 4 | origem satélite ⟹ cena, data de cálculo e versão do motor preenchidas | |
| 5 | "Sem correspondência" só após consulta bem-sucedida sem match | |
| 6 | nenhuma coluna geográfica com `"Custom"`, `"Bacia Local"`, `"Área Amostral GEE"` | lista negra |
| 7 | **nenhuma coluna numérica com valor idêntico em 100% das linhas quando n > 20** | **implementar primeiro** — sozinho teria capturado o defeito principal do sistema anterior |

### 6.5 Exportação
`xlsxWriter.ts` e `planilha.ts`:

- **Aba 1 — Dados:** cada variável científica em **duas colunas adjacentes**, `[Variavel]` e `[Variavel]_Origem`. Origem recebe `medido (COPERNICUS/DEM/GLO30, 2026-09-08)`, `tabelado (...)` ou `indisponível — <motivo>`.
- **Aba 2 — Procedência e Conformidade:** data de emissão, filtros, janela temporal, **contagem real** de consultas por fonte, bloco LGPD. Cabeçalho das fontes diz **"disponíveis nesta instalação"**, não "consultadas".
- **Aba 3 — Qualidade do Dado:** por variável, % medido / modelado / tabelado / indisponível.
- **CSV** recebe os mesmos metadados e o bloco LGPD.
- Célula numérica ausente fica **vazia**, nunca `0`. Célula textual ausente recebe **texto explicativo**.
- Coordenada decimal e DMS derivam do **mesmo número arredondado**, com tratamento de *rollover* de 60,0″.

### 6.6 Testes da Fase 1
- rejeição de exportação com 150 linhas idênticas (35,2 t/ha/ano, 16%, 0,45) pelo Invariante 7;
- `Campos_Estimados` derivado corretamente de `Proveniencia`;
- `0` numérico preservado como `0`, nunca convertido em ausência nem em default;
- DMS síncrono com a decimal, incluindo *rollover*;
- CSV com bloco LGPD;
- guarda antissintético cobrindo todas as rotas de saída.

---

## 7. Fase 2 — Fontes verificadas

**Primeira tarefa de toda fase que toque serviço externo** *(corrige I5)*: consultar capacidades, executar chamada real, registrar o esquema observado em comentário **com data**. Regra 8. Nada é declarado pronto sem isso.

### 7.1 Embrapa
Integrar `embrapaSoilClient.ts` — já verificado ao vivo, 19 testes. Distingue `encontrado` / `sem-cobertura` / `servico-indisponivel` e nunca devolve valor inventado. `tipo_unida = associacao` propaga `confianca: "media"` até a planilha.

**Acrescentar:** enumeração do domínio de erodibilidade e o mapa ordinal (§3.3.1), com o resultado da enumeração em comentário datado.

### 7.2 GEE — autenticação e terreno
`auth.ts` / `client.ts`: Service Account em sessão efêmera, cookie `httpOnly`, nunca em disco. Restrição a chamadas locais.

`terreno.ts`:
- **Projeção métrica `EPSG:31982`** (SIRGAS 2000 / UTM 22S) sobre o Copernicus DEM GLO-30, eliminando a subestimação de ~10% causada por EPSG:3857.
- *(corrige M1)* **Documentar em comentário** que o fuso 22S cobre 54°W–48°W e que a faixa oeste do Paraná (~54,25°W, região de Guaíra) fica marginalmente fora, com distorção residual da ordem de 0,1% — desprezível frente aos ~10% do Mercator. Se a AOI cruzar fusos de forma significativa, reprojetar por fuso.
- Guarda de plausibilidade: declividade fora de [0°, 75°] lança erro explícito.
- Curvatura de perfil, curvatura plana e TWI em unidades métricas.

### 7.3 Chuva
`chirps.ts` — série diária, acumulados de 30 e 90 dias.
`imerg.ts` — intensidade sub-horária, aproximação do **I30** (termo de intensidade do EI30, que a climatologia mensal não fornece).
`eventos.ts` — detecção de evento erosivo e índice de mecanismo `Σ(erosividade_t × soloNu_t)`.

### 7.4 Fundiário *(corrige I1)*
`matcher.ts` — consulta local SICAR/SIGEF/SNCR. **Papel: acesso e autorização para campo, contexto de manejo, documentação ética. Nunca feature.**

Enumeração fechada de status, com o estado que faltava no sistema anterior:

```ts
type StatusFundiario =
  | "encontrado" | "aproximado" | "sem-correspondencia"
  | "base-nao-disponivel" | "erro-na-consulta";   // NOVO
```

`"sem-correspondencia"` exige prova positiva: consulta executada, base cobre a UF, nenhum polígono contém o ponto. Nenhum `catch` pode produzi-lo. O campo `motivo` é exportado.

`protecao.ts` — máscara do SNCR reproduzida byte a byte, CPF/CNPJ nunca divulgado, guarda de execução local.

### 7.5 Testes da Fase 2
Fixtures de terreno verificando a projeção e a guarda de plausibilidade; enumeração de erodibilidade coberta; **os três estados de falha do fundiário produzindo status distintos**, e nenhum deles gerando a string "Sem correspondência".

---

## 8. Fase 3 — Séries temporais e composto de solo exposto

### 8.1 `serieTemporal.ts`
Extração multibanda Sentinel-2 / Landsat **preservando as máscaras de nuvem** (Regra 7). Proibido `.unmask(constante)` sobre banda física — se a amostra ficar pequena, ampliar a janela temporal ou o número de cenas.

Bandas: B2, B3, B4, B5, B6, B7, B8, B8A, **B11, B12**. Descartar B1 e B9.

### 8.2 `harmonicos.ts`
Regressão harmônica por banda: offset, amplitude anual e semianual, fase, **tendência linear**. Sem interpolação forçada sobre vazios.

*(corrige M2)* Cada coeficiente carrega em sua `Proveniencia` o objeto `QualidadeAjuste` com `nObservacoes` e `r2`. Série com muitas lacunas produz coeficientes mal condicionados; a qualidade do ajuste precisa ser auditável, não apenas o valor.

### 8.3 `compostoSoloNu.ts`
Composto usando **apenas observações com solo comprovadamente descoberto** (NDVI abaixo do limiar), ao longo de todos os anos. Fornece também **Ê** — a frequência de exposição usada na estratificação (§3.3).

### 8.4 Testes da Fase 3
Lacuna permanece `NaN` / `indisponivel` ao longo de toda a transformação, do pixel à planilha. Nenhuma constante substitui pixel mascarado.

---

## 9. Fase 4 — Amostragem e blocos espaciais

### 9.1 `elegibilidade.ts`
ESA WorldCover classes 30/40/60; declividade 3–20%; exclusão de água (buffer 30 m) e de área urbana (buffer 150 m); **cobertura temporal mínima** — número mínimo de observações válidas na série, porque ponto com muitas lacunas produz harmônicos mal condicionados que entram no modelo como ruído com aparência de sinal.

### 9.2 `estratificacao.ts`
Estratificação multivariada conforme §3.3: terços cruzados de Ŝ × Ê × K̂ = 18 estratos, terços sobre a distribuição empírica dentro do frame, alocação uniforme entre estratos ocupados, estrato vazio registrado como vazio.

Semente aleatória fixada e **registrada**.

### 9.3 Blocos espaciais
Conforme §3.4: variograma empírico das features disponíveis → maior alcance → aresta do bloco. Valor, variograma e data no Relatório de Amostragem.

### 9.4 Testes da Fase 4
- a amostra cobre **todos os terços de cada dimensão**, não apenas o topo;
- existem pontos nas células de Ŝ e Ê baixos (candidatos a negativo);
- Φ_diag não aparece em nenhuma saída exportada (Regra 4 verificada em execução);
- semente reproduz a mesma amostra.

---

## 10. Fase 5 — Planet e pares de evento

**Verificação Regra 8 antes de codificar:** acesso da conta à Orders API, **unidade de contabilização da cota**, versão da API. Registrar em comentário datado. O plano assume filtragem por UDM2, clipping e harmonização — nada disso é fato até ser exercitado.

### 10.0 Direitos de acesso reais da conta

Verificado no painel da conta (captura de 08/09/2026). **Estes números são a restrição dominante do desenho da Fase 5.**

#### 10.0.1 Plano ativo — Education and Research Basic

`Plan ID 798565` · Status **Active** · Vigência **06/04/2026 a 05/04/2028** · Organização institucional UTFPR.

| Produto | Cota | Consumo atual | Overage |
|---|---|---|---|
| Scene downloads *(preferred)* | **3.000 km²** | 0% | **OFF** |
| Scene tiles | **100.000 tiles** | 0% | OFF |
| Basemap tiles | 100.000 tiles | 0% | OFF |

**Ciclo da cota: mensal.** Os três blocos exibem `23 DAYS LEFT IN MONTH`, indicando reinício mensal. A vigência de 06/04/2026 a 05/04/2028 é a validade **do plano**, não da cota. Sob essa leitura, o teto ao longo da vigência é da ordem de 3.000 km²/mês × 24 meses.

🛑 **Confirmar antes de dimensionar a campanha.** A leitura é inferida do rótulo do painel, não de documentação. Verificar por uma destas vias: consulta à Reports API, documentação do plano Education and Research, ou observação do contador na virada do mês. **Não planejar consumo agressivo antes da confirmação** — se a cota for total e não mensal, o orçamento cai para 3.000 km² no projeto inteiro.

**`OVERAGE: OFF` — implicação de implementação.** Não há cobrança por excedente: ao esgotar a cota, as requisições **falham**. Isso é desejável numa conta acadêmica, mas exige que o cliente trate erro de cota esgotada como estado explícito e informativo, nunca como falha genérica de rede — e jamais como ausência de dado (Regra 2).

#### 10.0.2 🛑 O plano Trial está EXPIRADO

O painel registra `Trial — EXPIRED ON: APRIL 29, 2026`, e a seção de produtos do plano mostra **"No active products"**. O plano Trial trazia:

- Catalog API, **Statistical API**, Process API, OGC Streaming
- 30.000 Processing Units/mês e 30.000 Requests/mês
- Planet Sandbox Data e Bring Your Own Data

**Consequência a verificar antes de qualquer decisão de arquitetura:** a Statistical API — que devolveria estatísticas sem consumir download — vinha vinculada ao Trial. Com o Trial expirado, **pode não estar mais acessível**. O mesmo vale para os limites de Processing Units e Requests.

**Primeira tarefa da Fase 5, antes de escrever qualquer código:**

1. autenticar e chamar a Statistical API sobre um ponto — responde ou retorna 401/403?
2. o mesmo para Catalog API e Process API;
3. confirmar quais *item types* e assets o produto Education and Research Basic libera;
4. confirmar se há **área mínima faturável** por pedido na Orders API;
5. confirmar se `Scene tiles` e `Scene downloads` consomem cotas independentes.

Registrar cada resposta em comentário datado (Regra 8). **Não construir sobre a Statistical API antes da resposta de (1).**

#### 10.0.3 Orçamento de cota e dimensionamento do buffer

Sob a leitura mensal (§10.0.1), reservando 20% de contingência para refazer pares e corrigir pedidos:

```
3.000 km2/mes
  -600 km2   contingencia (20%)
-------------
 2.400 km2/mes disponiveis para pares de evento
```

**O tamanho do buffer é a alavanca dominante do consumo:**

| Buffer | Área/ponto | 100 pontos × 3 momentos | Eventos por mês em 2.400 km² |
|---|---|---|---|
| 500 m | 1,00 km² | 300 km² | 8 |
| **250 m** | **0,25 km²** | **75 km²** | **32** |
| 150 m | 0,09 km² | 27 km² | 88 |

**Recomendação: buffer de 250 m**, salvo se a verificação de área mínima faturável (§10.0.2, item 4) indicar valor maior.

*Justificativa técnica:* a 3–5 m de resolução, uma janela de 500 × 500 m fornece de 100×100 a 166×166 pixels — contexto amplo para situar o ponto na vertente e enxergar deposição em sopé, sem desperdício de cota. O buffer de 500 m quadruplica o consumo sem ganho interpretativo proporcional.

**A margem só é confortável se a cota for mesmo mensal.** Caso a verificação revele alocação total, o buffer de 250 m passa a permitir 32 eventos **no projeto inteiro**, e o número de pontos com par de evento precisa ser reduzido. Por isso a confirmação precede o dimensionamento da campanha.

**Exigência de implementação — `planet/quota.ts`:**

- mantém o orçamento do ciclo corrente e contabiliza cada pedido;
- **bloqueia** submissão que ultrapasse o saldo, com mensagem explícita;
- exige estimativa prévia e **confirmação explícita do usuário** antes de qualquer envio;
- trata `cota esgotada` como estado próprio e informativo — nunca como falha de rede, nunca como ausência de dado (Regra 2), já que `OVERAGE: OFF` faz a requisição falhar em vez de cobrar excedente;
- o Painel de Campanha exibe consumo do ciclo, saldo e dias restantes.

#### 10.0.4 Estratégia: tiles para interpretar, download para medir

A distinção entre as duas cotas resolve o problema central da Fase A do planejamento.

> **Fotointerpretação não precisa de download.** O intérprete *olha* a imagem; não precisa dos valores de pixel. Para isso servem os **100.000 Scene tiles**, que não consomem os 3.000 km².

| Necessidade | Recurso | Cota |
|---|---|---|
| **Fase A — rotulagem por interpretação visual** | Scene tiles via Tiles API / OGC Streaming | tiles |
| Contexto temporal amplo | Basemap tiles | tiles |
| **Pares de evento com valores de pixel** | Scene downloads com clipping | km² |
| Features espectrais da matriz | **GEE** (Sentinel-2, Landsat) | nenhuma |

**Consequência para a arquitetura:** as features espectrais da matriz de treino vêm do **Earth Engine**, não do Planet. O Planet cobre o que o GEE não alcança — revisita diária para pares de evento e resolução de 3–5 m para interpretação visual. Isso já era a orientação do planejamento v3; os números da conta agora a tornam obrigatória.

#### 10.0.5 Demais APIs

| API | Uso no SAREL |
|---|---|
| **Data API** | busca no catálogo, `PSScene`, assets e `udm2` |
| **Orders API** | pedido com clipping e harmonização |
| **Tiles API / OGC Streaming** | visualização para fotointerpretação (Fase A) |
| **Features API** | registrar as AOIs uma vez e referenciá-las nas demais chamadas — evita divergência entre a AOI da busca e a do pedido |
| **Quota Reservations API** | estimar antes de pedir, se acessível no produto atual |
| **Reports API** | acompanhar o consumo durante a campanha |
| Statistical API | 🛑 vinculada ao Trial expirado — verificar antes de considerar |
| Subscriptions / Basemaps / Tasking / Analytics | fora do escopo |

### 10.1 `dataApi.ts`
Busca no catálogo (`PSScene`, assets `ortho_analytic_8b_sr` e `udm2`). Filtro pela **fração limpa dentro da AOI** segundo o UDM2, não pelo percentual de nuvem da cena: uma cena com 60% de nuvem pode estar limpa sobre o talhão.

### 10.2 `ordersApi.ts`
Pedidos com **clipping** ao buffer do ponto e **harmonização com Sentinel-2**. Sem clipping, um download consome a cota do mês.

### 10.3 `paresEvento.ts`
Montagem retrospectiva:

```
T-   cena limpa mais proxima anterior ao evento
T0   0-2 dias   Sentinel-1 garantido + Planet se houver janela
T+   7-15 dias  solo ja seco, padrao de redistribuicao
```

Requisito de comparabilidade: mesmo sensor, geometria próxima, estágio fenológico semelhante — caso contrário a diferença medida é crescimento da cultura.

### 10.4 Script de viabilidade — antes de tudo
Cruzar eventos CHIRPS/IMERG com o arquivo disponível e **contar quantos pares utilizáveis existem**. Decide se o eixo de eventos é central ou ilustrativo. Rodar **antes** de comprometer o desenho.

---

## 11. Fase 6 — Rótulos e matriz *(corrige B3 — NOVA)*

Esta fase produz o resultado final do sistema. O plano v1 exportava plano de campo cego e **não tinha caminho de volta** para os rótulos.

### 11.1 `lib/rotulos/ingestaoKobo.ts`
Importa formulários KoboToolbox preenchidos em campo; casa por identificador de ponto e coordenada; preserva as observações como vieram do formulário.

### 11.2 `lib/rotulos/ingestaoInterpretacao.ts`
Ingere rotulagem por interpretação visual de **dois intérpretes independentes**, mantendo as duas leituras separadas.

### 11.3 `lib/rotulos/concordancia.ts`
Kappa de Cohen entre intérpretes, patamares de Landis & Koch, registro de divergências e fluxo de desempate por terceiro. **Kappa abaixo de 0,60 emite alerta bloqueante** — o critério não está operacional.

### 11.4 `lib/rotulos/ingestaoDrone.ts`
Rótulos da validação final (Fase D do planejamento). Registra `modalidade: "drone"` e mantém o conjunto marcado como **held-out**, jamais misturado ao treino.

### 11.5 `lib/matriz/montagem.ts`
Compõe a matriz de treino: features com proveniência + rótulo consolidado + bloco espacial.

**Exclusões obrigatórias, verificadas em teste:** `Φ_diag`, qualquer score, perda de solo, tipologia, `estratoId`, e os cinco fatores RUSLE. São funções determinísticas das brutas — colineares e sem informação adicional.

### 11.6 `app/api/rotulos/importar/route.ts`
Rota de ingestão, restrita a execução local.

### 11.7 Testes da Fase 6
- **nenhuma coluna derivada de cálculo do sistema entra na matriz** — Regra 4 verificada em execução, não por convenção;
- rótulo sem `modalidade`, `observador` ou `observadoEm` é recusado;
- rótulo com `cego: false` é aceito mas **sinalizado** no Relatório de Qualidade;
- Kappa calculado corretamente contra caso conhecido;
- conjunto de drone permanece segregado do treino.

---

## 12. Fase 7 — Interface

### 12.1 Mapa
MapLibre GL, pontos coloridos **por estrato** (nunca por severidade — severidade não é resultado). Filtros por estrato, declividade, status de rotulagem e bloco espacial. Alternador "colorir por completude de dado".

### 12.2 Inspetor de Ponto — a tela central
Todas as variáveis com selo de proveniência:

- ● `medido` — verde, sólido
- ◊ `modelado` — azul, losango
- □ `tabelado` — amarelo, quadrado
- ○ `indisponivel` — cinza, círculo aberto

Unidade pedológica em associação exibe a ressalva de confiança média.

**Gráfico de série temporal com lacuna representada como descontinuidade real.** Interpolar visualmente é mentir na tela.

### 12.3 Painel da Matriz de Treino
Completude por feature, **balanço de classes com prevalência explícita**, distribuição por estrato e por bloco, e **alerta ativo de baixa variância** — o Invariante 7 em tempo real.

### 12.4 Painel de Campanha
Status (a rotular / em campo / rotulado / validado), por observador e modalidade. **Botão destacado de Exportação Cega**, com aviso de que colunas de predição e score serão omitidas. Importação de rótulos. Roteirização da visita (Mapbox Directions — uso legítimo, fora do caminho analítico).

### 12.5 Comparador de Evento
T− e T+ lado a lado, evento de chuva marcado na linha do tempo com o valor do I30, cursor sincronizado.

### 12.6 Relatórios
1. **Qualidade do Dado** — completude e proveniência por variável.
2. **Reprodutibilidade da Amostragem** — frame, estratos, terços, **semente aleatória** *(corrige M3)*, variograma e aresta do bloco, versão do motor. É o documento que torna a amostragem reproduzível por terceiros.
3. **Dossiê do Ponto** (PDF) — ficha completa para anexo de dissertação.

---

## 13. Fase 8 — Linha de base RUSLE

**Desbloqueada.** Fator C decidido em 08/09/2026: **Durigon et al. (2014)**, `C = (1 − NDVI)/2` (§3.1).

### 13.1 Implementação e testes *(corrige B1)*

```ts
/**
 * Fator C de uso e manejo do solo.
 * Durigon, V. L. et al. (2014). NDVI time series for monitoring RUSLE cover
 * management factor in a tropical watershed. Int. J. of Remote Sensing, 35(2).
 *
 * C = (1 - NDVI) / 2
 *
 * Não usa BSI. A versão legada deste sistema empregava esta mesma expressão
 * elevada a (1 + BSI), o que invertia a resposta física: BSI negativo (solo
 * coberto) reduzia o expoente e AUMENTAVA C. A extensão foi removida.
 */
export function calcularFatorC(ndvi: number): number {
  return (1 - ndvi) / 2;
}
```

**O teste do plano v1 era vacuoso.** Afirmava `BSI₁ < BSI₂ ⟹ C₁ ≤ C₂`, mas Durigon não usa BSI — `C₁ = C₂` e a asserção passaria trivialmente, sem verificar nada. **Removido**, conforme a instrução do próprio plano. O invariante com conteúdo é sobre o NDVI:

```ts
it("C decresce monotonicamente com o NDVI", () => {
  const ndvis = [-0.2, 0.05, 0.2, 0.4, 0.6, 0.8, 0.95];
  const cs = ndvis.map(calcularFatorC);
  for (let i = 1; i < cs.length; i++) {
    expect(cs[i]).toBeLessThan(cs[i - 1]);   // estrito: Durigon é linear
  }
});

it("C permanece em [0,1] em todo o domínio de NDVI", () => {
  for (const n of [-1, -0.5, 0, 0.5, 0.99, 1]) {
    const c = calcularFatorC(n);
    expect(c).toBeGreaterThanOrEqual(0);
    expect(c).toBeLessThanOrEqual(1);
  }
});

it("reproduz os valores de referência da formulação", () => {
  expect(calcularFatorC(0.0)).toBeCloseTo(0.5, 6);
  expect(calcularFatorC(0.5)).toBeCloseTo(0.25, 6);
  expect(calcularFatorC(1.0)).toBeCloseTo(0.0, 6);
});

it("NÃO aceita BSI como parâmetro — a extensão legada foi removida", () => {
  expect(calcularFatorC.length).toBe(1);
});
```

O último teste é uma guarda de regressão: impede que alguém reintroduza a extensão por BSI sem que a suíte reclame.

### 13.2 Análise de sensibilidade da linha de base *(recomendado)*

Calcular a linha de base **também** com van der Knijff et al. (2000) e reportar quanto a comparação com o XGBoost muda. Custo baixo, e antecipa a pergunta óbvia da banca sobre a escolha da formulação.

Se o modelo supervisionado superar a RUSLE sob **as duas** formulações, a conclusão é robusta à escolha — e essa robustez é, em si, um resultado a declarar.

Diferença verificada numericamente (R = 6800, K = 0,020, LS = 1,405, P = 1,0):

| NDVI | A — Durigon | A — van der Knijff |
|---|---|---|
| 0,15 | 81,21 | 134,26 |
| 0,35 | 62,10 | 65,09 |
| 0,55 | 42,99 | 16,58 |
| 0,75 | 23,89 | **0,47** |

As duas formulações **ordenam o Fator C de forma idêntica** (ambas estritamente decrescentes em NDVI), mas comprimem a faixa de modo muito diferente — o que pode alterar a ordenação de A quando os demais fatores variam.

### 13.2 Demais fatores

| Fator | Forma | Referência | Cuidado |
|---|---|---|---|
| **R** | EI30 acumulado | Wischmeier & Smith (1978) | usar IMERG para a intensidade |
| **K** | classe da Embrapa | Santos et al. (2018) | **categórica** — não converter em número sem respaldo documental |
| **LS** | `(As/22,13)^m · (sen β/0,0896)^n` | Desmet & Govers (1996); Moore & Burch (1986) | `As` real do acúmulo de fluxo, nunca constante silenciosa de 10 m²/m |
| **P** | 1,0 quando desconhecido | Renard et al. (1997) | registrar como `tabelado`, nunca como medido |

### 13.3 Coerência
`perdaSolo` só é preenchida se os cinco fatores e a memória de cálculo existirem. Invariante 1 passa a estar ativo a partir daqui.

**Nunca criar fórmula ausente da literatura.** Se necessária, marcar `{estado: "modelado", modelo: "<descrição>"}` e submeter ao pesquisador.

---

## 14. Plano de verificação

Após cada fase:

```bash
npm run test && npx tsc --noEmit && npm run lint
```

Os três verdes. **Nunca** desativar teste, usar `skip` ou afrouxar asserção para passar.

### 14.1 Testes por módulo

| Arquivo | Verifica |
|---|---|
| `matriz/invariantes.test.ts` | 150 linhas idênticas abortadas pelo Invariante 7; `Campos_Estimados` derivado; literais proibidos rejeitados |
| `export/planilha.test.ts` | 3 abas; `0` preservado; DMS síncrono com *rollover*; CSV com bloco LGPD |
| `seguranca/guardaSintetico.test.ts` | nenhuma rota de saída escapa da guarda |
| `gee/terreno.test.ts` | escala métrica correta em EPSG:31982; guarda de plausibilidade dispara fora de [0°,75°] |
| `gee/estratificacao.test.ts` | cobertura de todos os terços; presença de candidatos a negativo; reprodutibilidade por semente |
| `embrapa/soilClient.test.ts` | já existente, 19 testes; acrescentar cobertura do mapa ordinal |
| `fundiario/matcher.test.ts` | três estados de falha distintos; nenhum gera "Sem correspondência" |
| `rotulos/concordancia.test.ts` | Kappa contra caso conhecido; alerta abaixo de 0,60 |
| `matriz/montagem.test.ts` | nenhuma coluna calculada pelo sistema entra na matriz |
| `rusle/baseline.test.ts` | monotonicidade em NDVI; faixa [0,1]; coerência da perda de solo |

### 14.2 Verificação manual
- Inspetor de Ponto com selos refletindo a origem real de cada feature;
- lacunas da série aparecendo como descontinuidade;
- **exportação cega** sem nenhuma coluna preditiva, de score ou de estrato;
- Relatório de Amostragem contendo semente, variograma e aresta do bloco.

### 14.3 Critério de conclusão
- todos os invariantes passam sobre conjunto **real** extraído do GEE;
- Aba de Qualidade do Dado mostra a proveniência efetiva de cada variável;
- nenhuma coluna numérica com valor idêntico em todas as linhas;
- toda fórmula com referência em docstring e teste **de comportamento**;
- todo serviço externo com esquema verificado e datado em comentário.

---

## 15. Ordem de execução

```
Fase 0  Definicao do rotulo                  BLOQUEANTE - com o orientador
        (Fase 1 pode correr em paralelo, exceto o enum ClasseRotulo)
Fase 1  Fundacao: tipos, guarda, invariantes, planilha
Fase 2  Fontes verificadas: Embrapa, GEE terreno, chuva, fundiario
Fase 3  Series temporais e composto de solo exposto
Fase 4  Amostragem multivariada e blocos espaciais
Fase 5  Planet e pares de evento (script de viabilidade primeiro)
Fase 6  Rotulos e matriz de treino
Fase 7  Interface
Fase 8  Linha de base RUSLE                  apos decisao sobre o Fator C
```

### Decisões que exigem o pesquisador 🛑

| # | Decisão | Trava |
|---|---|---|
| 1 | Critérios observacionais de presente/ausente | Fase 0 — tudo |
| 2 | Binário ou ordinal | enum e ficha de campo |
| 3 | Mapa ordinal das classes de erodibilidade da Embrapa | Fase 2 e a dimensão K̂ |
| 4 | ~~Fórmula do Fator C~~ — **RESOLVIDA 08/09/2026: Durigon et al. (2014)** | — |
| 5 | Extensão da série: só Sentinel-2 (~2017+) ou incluir Landsat (1984+) | Fase 3 |
| 6 | Unidade de predição: pixel 10 m, 30 m ou talhão | Fases 3, 4 e 6 |
| 7 | Domínio de validade a declarar (3–20% de declividade, uso agrícola) | redação da dissertação |
| 8 | **Ciclo da cota Planet: mensal ou total?** — confirmar antes de dimensionar; altera o orçamento por fator de 24 | Fase 5 e cronograma |
| 9 | **Buffer do recorte Planet** (recomendado 250 m) — define quantos eventos cabem em 3.000 km² | Fase 5 |
| 10 | **Nº de pontos que recebem par de evento** — depende de (8) e (9) | Fase 5 |

---

*Plano v2 — incorpora as correções B1–B4, I1–I6 e M1–M4 da auditoria de 08/09/2026.*
