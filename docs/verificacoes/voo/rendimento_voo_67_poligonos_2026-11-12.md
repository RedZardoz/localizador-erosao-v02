# Rendimento de voo para os 67 polígonos sorteados — 12/11/2026

Cálculo derivado **apenas** das missões de VANT já executadas, registradas em
`docs/verificacoes/voo/cobertura_voos.geojson`. Nenhum valor é estimado de catálogo
de fabricante ou de memória.

## Insumo medido

| Missão | Município | Área bruta | Área reconstruída | Recuperação | GSD nativo | Duração | Produtividade | CE90 |
|---|---|---|---|---|---|---|---|---|
| Missao_000 | Céu Azul | 12,20 ha | 6,84 ha | 56 % | 3,59 cm | 13,0 min | **0,53 ha/min** | 1,47 m |
| Missao_009 | Medianeira | 30,01 ha | 21,56 ha | 72 % | 3,96 cm | 9,3 min | **2,32 ha/min** | 7,04 m |

A produtividade registrada é **área reconstruída por minuto**, não área sobrevoada.
É a métrica correta, porque área que não reconstrói não vira ortomosaico e não rende rótulo.

## Alvo

67 polígonos × 5,02 ha = **336,34 ha** (selo de D16, 10/11/2026; 34 treino, 33 held-out).

## Rendimento

| Cenário | Produtividade | Tempo de voo | Por polígono |
|---|---|---|---|
| Melhor caso medido (Missao_009) | 2,32 ha/min | **145 min** (2,4 h) | 2,17 min |
| Pior caso medido (Missao_000) | 0,53 ha/min | **639 min** (10,7 h) | 9,54 min |

O valor de 2,2 min por polígono citado em D16 reproduz-se aqui a partir do dado bruto.

## Sortidas de bateria

As duas missões duraram **13,0 min** e **9,3 min** de voo. Tomando essa faixa como
comprimento de sortida, os 145 min de mapeamento do melhor caso exigem **11 a 16 sortidas**.

**Não medido:** o repositório não registra capacidade nominal de bateria, número de baterias
disponíveis nem tempo de troca e de recarga. As 11 a 16 sortidas saem da duração observada
dos dois voos, não de uma especificação. Enquanto o dado não existir, o número de baterias
necessário por jornada permanece indeterminado.

## O que domina a campanha — e não é a bateria

D16 registra a correção de uma subestimação anterior: a cifra de 3 jornadas de voo derivava
da produtividade de **mapeamento**, mas uma campanha de sítios dispersos é dominada por
**deslocamento e montagem**, não por bateria. O número de dias de campo é portanto maior que
o tempo de voo sugere, e não foi medido.

## O risco real: reconstrução, não tempo de voo

A diferença entre 0,53 e 2,32 ha/min não é velocidade de aeronave: é sucesso de reconstrução
fotogramétrica (56 % contra 72 % de recuperação). O fator de 4,4× entre o melhor e o pior caso
vem daí. Planejar pelo melhor caso sem controlar sobreposição e condição de iluminação é
planejar por um número que uma das duas missões já não entregou.

---
Fonte única: `docs/verificacoes/voo/cobertura_voos.geojson` (2 feições) e o selo de D16.
