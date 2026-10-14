# Relatório de Simulação de Desenho Amostral — SAREL v2.0
Data da Simulação: 2026-09-30
Metodologia: PPGTCA 2026 (Decisões D12, D16, D24 e D26)
Finalidade: Demonstração e Avaliação de Trade-offs de Amostragem

## 1. Parâmetros de Entrada Simulados
- Lado de referência: 224 m (faixa admitida: 100 a 400 m)
- Razão de aspecto máxima: 1:2 (faixa: 1:1 a 1:3)
- Área total levantada: 361 ha (faixa: 100 a 800 ha)
- Estratos biofísicos (D12): 18 estratos (imutável)
- Alcance de autocorrelação (D24): 50 m (imutável)

## 2. Saídas e Métricas Derivadas
- Área por polígono: 5.02 ha (50.176 m²)
- Dimensões do retângulo equivalente: 158.39 x 316.78 m
- Total de polígonos necessários: 72 polígonos
- Polígonos por estrato: 4
- Unidades espacialmente independentes totais: 1845
- Unidades espacialmente independentes no held-out: 923
- Teto de preditores admitido (D24 - 200 obs/var): 9 preditores
- Autorizações de proprietário exigidas: 72
- Fração de imóveis rurais elegíveis na BP3: 70.4%

## 3. Comparativo contra o Desenho Registrado em D16
| Variável | D16 Registrada | Simulação | Delta |
|---|---|---|---|
| Lado de referência | 224 m | 224 m | 0 m |
| Área por polígono | 5,02 ha | 5.02 ha | 0.00 ha |
| Total de polígonos | 72 | 72 | 0 |
| Polígonos por estrato | 4 (2+2) | 4 | 0 |
| Unidades efetivas | 1.845 | 1845 | 0 |
| Teto preditores D24 | 9 | 9 | 0 |
| Autorizações | 72 | 72 | 0 |
| Fração elegível BP3 | 71,8% | 70.4% | -1.4% |

## 4. Diagnóstico de Alertas
- Status de Admissibilidade: ADMISSÍVEL (Dentro dos Limites Teóricos)
- Nenhum alerta emitido. Parâmetros em conformidade técnica.

## 5. Salvaguarda Metodológica e Auditabilidade
ESTA CALCULADORA É EXCLUSIVAMENTE EXPLORATÓRIA. Ela NÃO altera nem alimenta o motor de sorteio. O sorteio utiliza unicamente os parâmetros fixados em D16 por exigirDecisao. A adoção de qualquer parâmetro simulado exige emenda formal de decisão pelo pesquisador (sendo src/config/decisoes.ts proibido por P8).
