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

## Baterias e autonomia

**Proveniência: informado pelo pesquisador que executou os voos (12/11/2026).** Não é medição
extraída de arquivo deste repositório, e fica distinguido do que está acima.

- 3 baterias, autonomia de cerca de **40 min** cada → **120 min por carga completa do conjunto**.

| Cenário | Tempo de voo | Cargas completas |
|---|---|---|
| Melhor caso medido (2,32 ha/min) | 145 min | **1,2** |
| Pior caso medido (0,53 ha/min) | 639 min | **5,3** |

### A conclusão que esse dado inverte

Mapear um polígono custa **2,17 min**, ou **5,4 % de uma bateria de 40 min**. Só de mapeamento,
uma bateria cobriria cerca de **18 polígonos**.

Logo, a energia **não é o gargalo**. Com 67 sítios dispersos pela bacia, cada bateria é trocada
porque a equipe se desloca, não porque descarregou. O que consome a bateria em campo não é o
mapeamento: é decolagem, subida, posicionamento, retorno e pouso a cada sítio — e esse custo por
sítio **não foi medido**.

As duas missões já voadas confirmam o ponto: duraram 13,0 e 9,3 min contra 40 min disponíveis,
isto é, pousaram com cerca de dois terços da carga intactos.

## O que domina a campanha — e não é a bateria

O dado de autonomia reforça o que D16 já registrava. D16 corrige uma subestimação anterior: a cifra de 3 jornadas de voo derivava
da produtividade de **mapeamento**, mas uma campanha de sítios dispersos é dominada por
**deslocamento e montagem**, não por bateria. O número de dias de campo é portanto maior que
o tempo de voo sugere, e não foi medido — nem o tempo de troca e recarga das três baterias.

## O risco real: reconstrução, não tempo de voo

A diferença entre 0,53 e 2,32 ha/min não é velocidade de aeronave: é sucesso de reconstrução
fotogramétrica (56 % contra 72 % de recuperação). O fator de 4,4× entre o melhor e o pior caso
vem daí. Planejar pelo melhor caso sem controlar sobreposição e condição de iluminação é
planejar por um número que uma das duas missões já não entregou.

---
Fonte única: `docs/verificacoes/voo/cobertura_voos.geojson` (2 feições) e o selo de D16.

---

# Cronograma de campo — cenário moderado e cenário pessimista

Atualização de 12/11/2026, após decidir-se que **o corredor Foz–Céu Azul não se aplica aos
67 polígonos**: eles vêm do divisor hidrológico inteiro (`imoveisDivisorBP3ForaUC` = 4.679
imóveis), e o deslocamento é o de bacia inteira.

## Dispersão dos sítios

Coordenadas dos 67 estão fora do Git por cegamento K2, então a dispersão é **estimada**, pela
fórmula para N pontos uniformes numa área — e os polígonos não são uniformes, são estratificados
em 18 estratos e restritos a caber em um único imóvel. Ordem de grandeza, não medida.

| Recorte | Área | Vizinho mais próximo | Perna de rota | Rota total |
|---|---|---|---|---|
| Corredor Foz–Céu Azul (não se aplica) | 3.865 km² | ~3,8 km | ~5,3 km | ~356 km |
| **Bacia BP3 (o que vale)** | 7.979 km² | ~5,5 km | **~7,6 km** | **~512 km** |

## Perda por clima — medida

Estações AGUASPARANÁ **FLORIANO** (2553020) e **MATELÂNDIA** (2554005), ambas em Matelândia,
1986–2025, 40 anos cada, agrupadas:

- **84 dias de chuva por ano em média = 23 % dos dias.**
- Janela mais seca, abril a setembro: 4,2 a 6,4 dias/mês, média de 5,6 = **18 %**.
- Mês pior, janeiro: 9,8 dias = 32 %.

Fonte: `docs/dados/pluviometria/matelandia/Dias de Chuva - 1986 a 2025.xls`. **Ressalva:** dia de
chuva não é o único dia perdido — vento e nebulosidade também impedem voo e **não** estão nesta
série. A perda real é maior que 23 %.

## Orçamento de tempo por sítio

| Componente | Valor | Proveniência |
|---|---|---|
| Mapeamento, pior caso medido (0,53 ha/min) | 9,5 min | **medido** |
| Deslocamento entre sítios (7,6 km a 25 km/h) | 18 min | **arbitrado** |
| Acesso: contato, porteira, montagem | 20 min | **arbitrado** |
| Decolagem, subida, retorno, pouso, recolher | 15 min | **arbitrado** |
| **Total por sítio** | **63 min** | |

Três dos quatro componentes são arbitrados por quem **não** voou. Quem executou as missões deve
substituí-los; o cálculo abaixo é refeito trocando esta tabela.

## Os dois cenários

| | Moderado | **Pessimista** |
|---|---|---|
| Re-voo por falha de reconstrução | — | 25 % dos sítios |
| Visita perdida (ausência, acesso, lavoura) | — | 20 % |
| Tempo efetivo por sítio | 63 min | **94 min** |
| Total de campo | 70 h | **105 h** |
| Jornada útil (descontado trajeto base–campo) | 6 h | **5 h** |
| Dias úteis de voo | 11,7 | **21,0** |
| Perda por clima | 23 % | 30 % |
| **Dias de calendário** | **15** | **30 (~6 semanas)** |

O re-voo de 25 % não é arbitrário: a Missão 000 recuperou apenas 56 % da área sobrevoada, contra
72 % da Missão 009. Sítio que não reconstrói tem de ser voado de novo.

## Bateria segue sem ser o gargalo

A seis sítios por dia, o mapeamento consome 57 min dos 120 min das três baterias. Sobra folga em
qualquer cenário. O que fixa o cronograma é deslocamento, acesso e clima — nunca energia.

## Recomendação para dimensionamento

Pedir recursos pelo **extremo pessimista: 30 dias de campo, cerca de 6 semanas de calendário**,
preferencialmente na janela de abril a setembro, quando a perda por chuva cai de 23 % para 18 %.
Os três parâmetros arbitrados devem ser medidos nas primeiras jornadas e o cálculo, refeito.
