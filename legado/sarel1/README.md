# SAREL — Sistema de Amostragem e Rotulagem para Predição de Erosão Laminar

Instrumento computacional de dissertação de mestrado do **Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)**.

## Objetivo da Pesquisa
Validar um método de localização e predição de erosão laminar a partir de séries temporais multiespectrais, variáveis de terreno e solo, e regime de chuvas, utilizando um classificador supervisionado (XGBoost).

> **Atenção:** O sistema **não classifica erosão**. Ele:
> 1. **Propõe onde observar** — desenho de amostragem estratificado e espacialmente disperso por quantis.
> 2. **Extrai features verificáveis** — de fontes públicas legítimas com proveniência por variável (`Proveniencia<T>`).
> 3. **Gerencia a campanha de rotulagem** — exporta plano de campo em modo cego, ingere rótulos de observação humana e monta a matriz de treino.
> O rótulo vem exclusivamente de observação humana.

---

## A Lei Fundamental (8 Regras Invioláveis)

1. **Dado verdadeiro ou ausência declarada:** Lacuna nunca vira constante, média ou valor típico. Se o dado não existe, o valor é `null` / `indisponivel` e o motivo é registrado.
2. **Nunca colapsar estados distintos:** "Consultado e não há" $\neq$ "não foi possível consultar" $\neq$ "fora da área de cobertura". Todo cliente de dados retorna enumeração fechada de status.
3. **Proveniência viaja junto com o valor:** Nenhum número solto no sistema. Todo dado científico é encapsulado em `Proveniencia<T>`.
4. **Nada calculado pelo sistema vira rótulo:** Severidade, score de prioridade, perda de solo, $\Phi_{diag}$ e tipologia são critérios internos de amostragem. NUNCA saem como resultado, NUNCA entram na matriz de treino.
5. **Zero é um valor:** Verificação explícita de nulidade (`??`, `=== null`, `=== undefined`), nunca `||` para defaults numéricos.
6. **Respeitar as fontes legítimas:** Apenas sensores e cartas calibradas (Sentinel-1/2, Landsat, Copernicus DEM, CHIRPS, GPM IMERG, Embrapa GeoInfo, PlanetScope, bases cadastrais oficiais). Mapbox/Google servem estritamente para navegação visual.
7. **Preservar o mascaramento do Earth Engine:** Proibido o uso de `.unmask(constante)` sobre bandas físicas. Píxels de nuvem devem permanecer nulos para descarte por `dropNulls`.
8. **Verificar antes de afirmar:** Registrar capacidades observadas de APIs externas com data em comentário antes de integrar.

---

## Fases do Projeto

- **Fase 0 — Definição Operacional do Rótulo:** Bloqueante, alinhamento dos critérios de observação com o orientador.
- **Fase 1 — Fundação:** Tipos de proveniência, modelo do ponto amostral, guarda antissintético, os 7 invariantes e escritor de planilhas XLSX (3 abas) e CSV (com LGPD). *(Concluída)*
- **Fase 2 — Fontes Verificadas:** Embrapa GeoInfo, GEE terreno em projeção métrica (EPSG:31982), chuvas CHIRPS/IMERG e fundiário local.
- **Fase 3 — Séries Temporais e Composto:** Séries multibanda sem unmask de nuvens, harmônicos com qualidade de ajuste e composto de solo descoberto.
- **Fase 4 — Amostragem e Blocos Espaciais:** Estratificação multivariada $\hat{S} \times \hat{E} \times \hat{K}$ e blocos espaciais via variograma empírico.
- **Fase 5 — PlanetScope e Pares de Evento:** UDM2, clipping, cota e montagem retrospectiva $T^-$, $T_0$, $T^+$.
- **Fase 6 — Rótulos e Matriz de Treino:** Ingestão de KoboToolbox, interpretação com Kappa de Cohen, drone held-out e montagem da matriz de treino sem vazamento.
- **Fase 7 — Interface do Usuário:** Mapa MapLibre GL, Inspetor de Ponto com selos de proveniência, Matriz, Campanha, Comparador e Relatórios.
- **Fase 8 — Linha de Base RUSLE:** Cálculo de comparação clássica após definição formal do Fator C com o pesquisador.

---

## Comandos de Verificação
```bash
npm run test       # Executa a suíte de testes unitários (Vitest)
npx tsc --noEmit   # Verificação estrita de tipagem TypeScript
npm run lint       # Validação de código com ESLint
```
