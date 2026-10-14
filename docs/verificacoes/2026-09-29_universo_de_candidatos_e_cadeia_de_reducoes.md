# O universo de candidatos, e por que o gargalo de K̂=2 é artefato de pipeline — 29/09/2026

Complementa `2026-09-29_gargalo_estratos_k2_dominio_d07.md`. O pesquisador confirmou que o
universo é imóvel rural identificado por **necessidade de autorização** — para sobrevoar e
para visitar, é preciso saber a quem pedir.

## A restrição é IDENTIFICAÇÃO DO PROPRIETÁRIO, não o centroide

O centroide do imóvel não é exigido pela autorização: um polígono de 10 ha pode ficar em
**qualquer parte** de um imóvel identificado, e se pede autorização ao mesmo dono. O centroide
é ponto arbitrário que pode cair em declividade inferior a 3% enquanto o mesmo imóvel tem
área elegível em outro lugar. Foi o que produziu 52 de 90 centroides fora do domínio de D07.

## Medição do universo real (`data/fundiario_brasil.db`, somente leitura)

Imóveis de UF = PR com centro no envelope da BP3 (lat −25,65 a −24,00; lon −54,65 a −53,35):
**73.643** com área declarada.

| Estatística | Valor |
|---|---|
| mediana | **11,7 ha** |
| média | 23,6 ha |
| percentis | p10 = 2,7 · p25 = 5,3 · p50 = 11,7 · p75 = 21,9 · p90 = 38,1 · p99 = 219,5 |
| área ≥ 10 ha | 40.464 (54,9%) |
| área ≥ 20 ha | 20.150 (27,4%) |
| área ≥ 30 ha | 10.232 (13,9%) |

É o padrão de minifúndio do oeste do Paraná. Um polígono de 10 ha tem **316 m de lado**:

| Teste | Imóveis | % |
|---|---|---|
| envelope comporta quadrado de 316 m | 40.271 | 54,7% |
| idem **e** área ≥ 10 ha | **31.962** | **43,4%** |
| envelope comporta quadrado de 158 m (2,5 ha) | 63.690 | 86,5% |

O teste de envelope é condição **necessária e não suficiente** — imóvel em faixa alongada ou
em L pode ter envelope de 316 m sem comportar o quadrado. Ainda assim, cerca de **32 mil**
imóveis da bacia podem plausivelmente hospedar um polígono de 10 ha.

## A cadeia de reduções: 5 etapas, nenhuma exigida pela autorização

| Etapa | Restam | Causa |
|---|---|---|
| Imóveis no envelope da bacia | 73.643 | — |
| Dentro do divisor hidrográfico (bacia ≈ 8.000 km² contra envelope ≈ 26.500 km²) | ~22.000 (estimado) | geografia, legítimo |
| Após thinning | **593** | **`raioThinningKm = 5.0`** em `select-candidates/route.ts:178` |
| Teto operacional | **90** | `slice(0, max(ceil(tamanhoAmostra*1.8), 90))` na linha 340, **antes** do filtro físico |
| Domínio de D07 (3–20%) | **29** | centroide arbitrário, não a parte elegível do imóvel |
| Nível K̂ = 2 | **5** | assimetria pedológica real |

**O thinning parte de 5.000 m**, e o laço da linha 323 só relaxa enquanto o pool está abaixo
da meta, parando cedo. O piso de **P02 é 1.000 m** — registrado como valor numérico, não
string. Relaxar de 5.000 m para o piso permitido multiplica o pool por até ~25x, **sem tocar
em decisão alguma**.

## Conclusão

O gargalo de K̂=2 é **artefato de pipeline**, e não consequência da restrição de autorização
nem da assimetria pedológica da bacia. Três correções, todas dentro de parâmetros já
registrados:

1. **Relaxar o thinning** do padrão de 5.000 m em direção ao piso de 1.000 m de P02.
2. **Aplicar o teto operacional DEPOIS** do filtro de domínio de D07, não antes.
3. **Escolher o ponto candidato dentro da parte ELEGÍVEL do imóvel**, não o centroide — mesmo
   proprietário, mesma autorização, mas respeitando o domínio físico.

## Guarda obrigatória na correção 3

Escolher o ponto dentro do imóvel **por elegibilidade** é legítimo. Escolhê-lo **por suspeita
de erosão** reintroduz pela porta de trás a circularidade que D16 barra: sortear onde o
rastreio espectral de D02 aponta erosão faria o modelo aprender a concordar com o rastreio.

Portanto o ponto deve ser sorteado **ao acaso entre as células elegíveis do imóvel**, com a
semente registrada conforme P07, e **jamais** por escore de suscetibilidade, `scoreJev`,
`severidade` ou `scorePrioridade`.

## Limitação a declarar, que a correção não remove

Exigir que o polígono de 10 ha caiba dentro de um único imóvel retém 43,4% dos imóveis e
**enviesa a amostra para os maiores**. Tamanho de propriedade correlaciona com prática de
manejo — terraceamento, rotação, mecanização — que é justamente o que os fatores C e P do
RUSLE capturam. É viés sobre variável que importa ao desfecho, e deve constar como limitação
declarada; alternativamente, polígono menor que 10 ha ampliaria o universo (86,5% comportam
158 m) ao custo de alterar D16, D24 e a aritmética de voo.
