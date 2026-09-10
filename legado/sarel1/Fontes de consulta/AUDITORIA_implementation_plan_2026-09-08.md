# Auditoria do Plano de Implementação — SAREL

**Objeto:** `implementation_plan.md`
**Data:** 08/09/2026
**Referências de conformidade:** `PROMPT_NOVO_PROJETO_2026-09-08.md` (Lei Fundamental e invariantes), `PLANEJAMENTO_PESQUISA_v3_2026-09-08.md` (fundamentação metodológica)

---

## 1. Veredito

**Base sólida, não implementável como está.**

O plano carrega fielmente as oito regras, adota a estrutura de diretórios proposta, ordena as sete fases corretamente e ancora os testes nos defeitos reais do sistema anterior. A recomendação de deferir a Fase 7 até a decisão do pesquisador sobre o Fator C está correta.

Porém: **4 achados bloqueantes, 6 importantes, 4 menores.** Dois dos bloqueantes são omissões de escopo — o plano constrói tudo **exceto** os dois módulos que produzem o resultado final.

---

## 2. Achados bloqueantes

### B1 — O teste de monotonicidade do Fator C é vacuoso

**Onde:** Fase 7, item 1; e §5, `test/rusleBaseline.test.ts`.

O plano define como *teste obrigatório*:

```
BSI₁ < BSI₂  =>  C₁ <= C₂   (com NDVI fixo)
```

Mas as duas fórmulas recomendadas pelo próprio plano **não usam BSI**:

- Durigon et al. (2014): `C = (1 − NDVI)/2`
- van der Knijff et al. (2000): `C = exp(−α·NDVI/(β − NDVI))`

Com qualquer uma delas, `C₁ = C₂` para todo BSI, e a asserção `C₁ ≤ C₂` **passa trivialmente**. O teste não verifica nada sobre a física e não distingue uma implementação correta de uma degenerada que ignore as entradas.

É precisamente o "teste que passaria com o defeito presente" que a Regra de disciplina do prompt proíbe.

**Observação:** o teste *detecta* corretamente a fórmula antiga (que dava C₁ = 0,827 > C₂ = 0,027), mas dá **falsa segurança** para as fórmulas novas.

**Correção exigida.** O invariante fisicamente significativo, válido para as três candidatas, é sobre o NDVI:

```ts
it("C decresce monotonicamente com o NDVI", () => {
  const ndvis = [0.05, 0.2, 0.4, 0.6, 0.8, 0.95];
  const cs = ndvis.map(n => calcularFatorC(n));
  for (let i = 1; i < cs.length; i++) expect(cs[i]).toBeLessThanOrEqual(cs[i - 1]);
});

it("C permanece no intervalo [0,1] em todo o domínio", () => { /* ... */ });

// SOMENTE se a fórmula escolhida incluir BSI:
it("C cresce monotonicamente com o BSI, com NDVI fixo", () => { /* ... */ });
```

O terceiro teste só existe se a decisão do pesquisador for pela alternativa 3 (extensão BSI corrigida). Nas alternativas 1 e 2 ele deve ser **removido**, não mantido como decoração.

**Nota:** o §5.4 do plano diz "monotonicidade do Fator C em relação ao BSI **e NDVI**" — mais próximo do correto que a Fase 7. As duas seções estão inconsistentes entre si.

---

### B2 — Φ é a espinha dorsal da amostragem e nunca é definido

**Onde:** §1 item 1, `estratificacao.ts`, Fase 4 itens 2 e 4.

O plano menciona "amostragem por quantis de Φ" quatro vezes e **nunca define Φ**. Não é omissão cosmética: Φ determina toda a alocação amostral da Fase 4.

Pior — os insumos de Φ mudaram em relação ao sistema anterior, onde era `Φ = declividade×0,40 + BSI×50 + Ψ_solo`:

| Insumo | Situação no SAREL |
|---|---|
| declividade | resolvido (EPSG:31982) |
| **BSI** | **indefinido** — a série tem N observações. Qual valor entra? Mediana? Percentil 90? Valor do composto de solo exposto? |
| **Ψ_solo** | **indefinido** — vinha de `inferPedologyClass`, que foi eliminado. A Embrapa devolve classe **categórica** ("Alta", "Média"), não um peso numérico |

**Correção exigida.** Antes da Fase 4, especificar em documento e em código:

1. a definição algébrica de Φ para o SAREL, com justificativa de cada peso;
2. qual estatística da série fornece o termo espectral;
3. o mapeamento entre as classes categóricas de erodibilidade da Embrapa e o termo pedológico — **com justificativa documental**, sob pena de reintroduzir por outra via o palpite que se acabou de eliminar;
4. registro explícito de que Φ é **critério interno de amostragem** e nunca sai na planilha (Regra 4).

Enquanto Φ não estiver definido, a Fase 4 não é implementável.

---

### B3 — Faltam as duas fases que produzem o resultado final

O sistema existe para gerar uma **matriz de treino rotulada**. Nenhuma fase constrói os dois módulos que a produzem.

**Ingestão de rótulos — ausente por completo.** Não há módulo na árvore, não há rota de API, não há fase. O plano exporta plano de campo em modo cego (Fase 6) e **não tem caminho de volta** para os rótulos preenchidos. Faltam:

- ingestão de formulários KoboToolbox (campo);
- ingestão de rotulagem por interpretação visual, com **dois intérpretes e cálculo de Kappa** (Fases A e B do planejamento v3);
- ingestão de resultados de drone (Fase D);
- registro obrigatório de `modalidade`, `observador`, `observadoEm` e da flag `cego`.

**Montagem da matriz — órfã.** `src/lib/matriz/montagem.ts` consta da árvore de diretórios e **de nenhuma fase**. A Fase 6 constrói o *painel* que exibe a matriz, mas nada a compõe.

**Correção exigida.** Inserir uma fase — logicamente entre a atual 5 e a 6:

```
Fase 5-B — Rótulos e Matriz
  lib/rotulos/ingestaoKobo.ts        formulário de campo
  lib/rotulos/ingestaoInterpretacao.ts   2 intérpretes + Kappa de Cohen
  lib/rotulos/ingestaoDrone.ts       validação final
  lib/rotulos/concordancia.ts        Kappa e resolução de divergência
  lib/matriz/montagem.ts             matriz com proveniência, sem vazamento
  app/api/rotulos/importar/route.ts
```

Com o teste correspondente: **nenhuma coluna derivada de cálculo do sistema entra na matriz** (Regra 4 verificada em execução, não apenas por convenção).

---

### B4 — A Etapa 0 é bloqueante no planejamento e está ausente do plano

O planejamento v3 estabelece a **definição operacional do rótulo** como etapa bloqueante: sem ela, nada posterior tem validade, porque a consistência do rótulo limita o desempenho máximo de qualquer classificador.

O plano de implementação **adota como decidido** o que ainda não foi decidido: fixa a escala `ausente / incipiente / moderada / severa` (§2, NOTE) sem registrar que ela é provisória e depende da Etapa 0.

Consequência prática: a **ficha de campo** — artefato de software — não pode ser especificada antes que os critérios observacionais estejam escritos e revisados com o orientador.

**Correção exigida.** Marcar a escala como provisória e inserir uma Fase 0 que produza: critérios observacionais por classe, ficha de campo, e o protocolo de concordância entre intérpretes. Nenhuma coleta antes disso.

---

## 3. Achados importantes

### I1 — Módulos órfãos: `fundiario/matcher.ts` e `fundiario/protecao.ts`

Constam da árvore e da rota `api/fundiario/consulta/route.ts`, mas **nenhuma fase os implementa**. Sob o novo desenho o fundiário tem papel legítimo (acesso e autorização para campo, contexto de manejo, documentação ética) — mas precisa de fase própria, com a distinção rigorosa de estados exigida pela Regra 2, incluindo o estado `erro-na-consulta` que o sistema anterior não tinha.

### I2 — Guarda antissintético eliminada — regressão

O sistema anterior aplicava `isSyntheticPoint()` em **todas** as rotas de saída e na reidratação do estado. A auditoria constatou cobertura completa, sem brecha. O plano do SAREL **não menciona guarda equivalente**.

Isso é especialmente arriscado porque a Fase 1 cria deliberadamente fixtures sintéticas (150 linhas idênticas) para exercitar o Invariante 7. Sem guarda, um ponto de teste pode alcançar uma exportação real.

**Correção:** reintroduzir a guarda em todas as saídas, com teste de cobertura.

### I3 — Invariante 2 referencia conceito que a Regra 4 eliminou

O Invariante 2 é "Escala: scores dentro da faixa documentada". Mas pela Regra 4 **nenhum score é exportado** — `priorityScore` virou critério interno. Não há score na planilha para validar.

**Correção:** ou redefinir o invariante para a faixa interna de Φ, ou removê-lo e renumerar. Manter um invariante que não verifica nada enfraquece o conjunto.

### I4 — Blocos espaciais de 10–20 km sem justificativa

O plano propõe "células de 10 km a 20 km" sem fundamentação. É exatamente a classe de constante arbitrária que o projeto inteiro se propõe a eliminar — desta vez dentro do próprio plano.

Roberts et al. (2017) orientam que o bloco seja **maior que o alcance da autocorrelação espacial**, que é uma quantidade a ser estimada, não arbitrada.

**Correção:** derivar o tamanho do bloco de um variograma empírico das features principais (ou do rótulo, quando houver), e documentar o valor com sua justificativa. Até lá, marcar 10–20 km como **provisório**.

### I5 — A Regra 8 não tem etapa de verificação em nenhuma fase

A Regra 8 exige verificar capacidades reais das APIs antes de afirmar, registrando o esquema observado com data. O plano cita a regra em §1 e **não a agenda em fase alguma**.

Crítico na Fase 5: o plano assume filtragem por UDM2, *clipping* e harmonização na Orders API como fatos, sem que a conta Planet tenha sido exercitada. Assume também coleções específicas de IMERG e CHIRPS no GEE.

**Correção:** primeira tarefa de cada fase que toque serviço externo — consulta de capacidades, chamada real, registro do esquema em comentário com data. Para o Planet, verificar antes: acesso à Orders API, unidade de contabilização da cota e versão da API.

### I6 — Localização dos testes quebra um import existente

O plano coloca os testes em `/test/*.test.ts`. O `embrapaSoilClient.test.ts` já verificado importa `from "./embrapaSoilClient"` — caminho relativo colocalizado. Movido para `/test/`, **falha na importação imediatamente**.

**Correção:** colocalizar os testes junto aos módulos (`src/lib/embrapa/embrapaSoilClient.test.ts`) ou ajustar todos os imports. A primeira opção preserva o artefato já verificado.

---

## 4. Achados menores

**M1 — EPSG:31982 e o extremo oeste do Paraná.** O fuso UTM 22S cobre 54°W–48°W. A faixa oeste do estado (região de Guaíra, ~54,25°W) fica marginalmente fora. A distorção residual é da ordem de 0,1% — desprezível frente aos ~10% do Mercator —, mas o plano deve **documentar** a escolha e a distorção residual em vez de afirmar cobertura exata. O planejamento v3 previa reprojeção por fuso quando a AOI cruzasse fusos; o plano omitiu a ressalva.

**M2 — Harmônicos sem indicador de qualidade.** Regressão harmônica sobre série com muitas lacunas produz coeficientes mal condicionados. Cada coeficiente deve carregar, na sua `Proveniencia`, o número de observações válidas e uma medida de ajuste (R² ou erro padrão), para que a qualidade do ajuste seja auditável e não apenas o valor.

**M3 — Relatório de reprodutibilidade sem a semente.** O Relatório de Amostragem precisa registrar a **semente aleatória**, além de frame, estratos, quantis e versão do motor. Sem ela a amostragem não é reproduzível por terceiros, que é a finalidade declarada do relatório.

**M4 — Invariante 1 só ativa na Fase 7.** A coerência RUSLE é implementada na Fase 1 mas nada tem a verificar até a Fase 7. Sem problema, desde que o plano registre que o invariante fica inerte no intervalo — do contrário, um teste verde pode ser lido como cobertura efetiva.

---

## 5. O que está correto e deve ser preservado

- **As oito regras carregadas com fidelidade**, inclusive as justificativas técnicas.
- **Invariante 7 com o caso real** (150 linhas com 35,2 t/ha/ano) como fixture de teste. É o invariante de maior retorno e está corretamente priorizado na Fase 1.
- **Fase 7 condicionada à decisão do pesquisador.** Correto e alinhado ao prompt.
- **A análise do Fator C está tecnicamente certa**, e há um ganho que o plano não explora: a fórmula antiga era `((1−NDVI)/2)^(1+BSI)` — ou seja, a fórmula de **Durigon elevada a um expoente derivado do BSI**. Adotar Durigon puro é *remover a extensão que causou a inversão*, não trocar de método. Isso torna a correção trivial de justificar na dissertação: "adotou-se a formulação original de Durigon et al. (2014), sem a extensão por BSI, que invertia o comportamento físico do fator".
- **Ordem geral das fases**, fundação antes de integração.
- **Modo cego** com botão destacado na Fase 6.
- **Stack** idêntica à anterior — não foi fonte de nenhum defeito.

---

## 6. Recomendação

Não implementar antes de resolver, nesta ordem:

1. **B4** — Etapa 0: critérios observacionais e ficha de campo, com o orientador.
2. **B2** — definir Φ algebricamente, com o mapeamento das classes da Embrapa.
3. **B1** — corrigir o teste do Fator C (monotonicidade em NDVI; BSI só se a fórmula o incluir).
4. **B3** — inserir a Fase 5-B (rótulos e matriz).
5. **I1 a I6** — antes de iniciar a fase correspondente de cada um.
6. **M1 a M4** — durante a implementação.

Após as correções, o plano fica apto. A fundação (Fase 1) pode inclusive começar em paralelo à Etapa 0, já que tipos, invariantes e escritor de planilha não dependem da definição do rótulo — **exceto** o enum `classe`, que deve ficar como último item da Fase 1.
