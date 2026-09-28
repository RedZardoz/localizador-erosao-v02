# Reconhecimento do WFS de erodibilidade da Embrapa — 28/09/2026

Consultas reais a `https://geoinfo.dados.embrapa.br/geoserver/ows`, feitas para fundamentar
`docs/planejamento/PROMPT_FECHAMENTO_DIVIDA_WFS_ERODIBILIDADE_2026-09-28.md`.

## F1 — `geonode:parana_solos_20201105` nao tem campo `erod_*`

38 campos, nenhum comecando por `erod`:

area_km2, familia_11, familia_12, familia_13, familia_14, familia_1_, familia_21,
familia_23, familia_24, familia_26, familia_2_, familia_31, familia_33, familia_34,
familia_36, familia_3_, fase_rel_1, fase_rel_2, fase_relev, fase_veg_1, fase_veg_2,
fase_veget, grande_g_1, grande_g_2, grande_gru, legenda, objectid, ogc_fid,
ordem_1, ordem_2, ordem_3, sbcs, sub_grup_1, sub_grupo1, sub_grupo_,
sub_orde_1, sub_ordem1, sub_ordem_, tipo_unida

Consequencia: `embrapaSoilClient.ts:385` le `props["erod_c1"]` da feicao de solos, onde o
campo nao existe; logo `erodAtributoExplicito` nunca e passado e a heuristica taxonomica
opera sempre. O ramo das linhas 279-286 e codigo morto.

## F2 — `geonode:bra_erodibilidade_2024_sirgas2000` existe e traz erodibilidade por componente

DescribeFeatureType respondeu com sucesso. Campos (lista truncada em 14 na extracao):

ogc_fid, cd_fcim, nom_unidad, cod_um, cod_um2, legenda,
legenda_c1, legenda_c2, legenda_c3, legenda_c4, erod_c1, erod_c2, erod_c3, [...]

`erod_c4` NAO confirmado nesta extracao. `legenda_c1..legenda_c4` permitem verificar a
correspondencia de componentes entre as duas cartas, em lugar de parear por posicao.

## F3 — `geonode:brasil_erodibilidade_solo` (a camada hoje consultada) e de classe unica

Campos: ogc_fid, codnum, classe, area_km2, geometry.

| Coordenada | parana_solos | brasil_erodibilidade_solo |
|---|---|---|
| Toledo rural (-24.6200, -53.7100) | `LVef1 - LATOSSOLO VERMELHO Eutroferrico`, tipo_unida=simples | classe="Muito baixa", codnum=1 |
| Santa Helena (-24.8531, -54.3622) | idem LVef1, simples | classe="Baixa", codnum=2 |
| Palotina (-24.2860, -53.8400) | `Area Urbana`, tipo_unida=null | classe="Area urbana", codnum=0 |
| Cascavel (-24.9558, -53.4550) | `Area Urbana` | (feicao retornada) |
| Medianeira (-25.2950, -54.0950) | `Area Urbana` | (feicao retornada) |

Classe unica por ponto serve ao nivel de K no ponto, mas NAO resolve a comparacao
dominante-contra-subordinado exigida por D08.

## F4 — o vocabulario de `classe` inclui categorias que nao sao solo

Observados `"Area urbana"` e `"Corpos dagua"` ao lado das seis classes do Documentos 246.
Nao tem nivel de K e nao podem ser convertidos em nivel.

## F5 — o comentario da divida erra uma atribuicao

`embrapaSoilClient.ts:269` afirma que o cliente ativo usa `geonode:brasil_solos_5m_20201104`.
Usa `geonode:brasil_erodibilidade_solo`.

## Metodo

WMS 1.1.1 GetFeatureInfo, `info_format=application/json`, bbox de meio-lado 0.0005 grau,
grade 3x3 no pixel central (x=1,y=1), `feature_count=5` — mesmo padrao de
`buildGetFeatureInfoUrl` em `src/lib/embrapa/embrapaSoilClient.ts:198`.
WFS 1.1.0 DescribeFeatureType para os conjuntos de campos.

---

# Verificacao independente do relatorio de fechamento — 28/09/2026

## Confirmado por consulta propria

- Esquema de `bra_erodibilidade_2024_sirgas2000`: exatamente os 20 campos relatados, `erod_c4` existe.
  Alem de `erod_c1..c4` e `legenda_c1..c4`, a camada traz `erod_um`, **`fator_k_um`** e **`k_solos`**.
- Ponto de associacao (-25.066904, -53.688038): confere integralmente —
  PR `sbcs=RRe12`, `tipo_unida=associacao`, ordens `[NEOSSOLO, CHERNOSSOLO, NITOSSOLO]`;
  camada antiga `classe=Alta`, `codnum=4`;
  2024 `erod_c1..c4 = [Baixa, Alta, Muito alta, Alta]`, legendas com ordens
  `[NITOSSOLO, NEOSSOLO, NEOSSOLO, CHERNOSSOLO]`.

## F6 (NOVO) — a selecao da primeira feicao descarta unidade de solo valida

`embrapaSoilClient.ts:788` usa `if (id.startsWith("parana_solos_") && !propsSoloPr)`, isto e,
toma a PRIMEIRA feicao da camada de solos e ignora as seguintes.

Em (-24.8800, -54.2600) — o ponto `R13` do relatorio — a camada devolve **duas** feicoes:

1. `sbcs = "agua"`, `tipo_unida = null`, `ordem_1 = null`
2. `sbcs = "NVef2"`, `tipo_unida = "simples"`, `ordem_1 = "NITOSSOLO"`

A primeira vence, o ponto recebe `foraDoDominioSolo = true` e e excluido — e o relatorio
concluiu que as cartas DIVERGEM ali. Na verdade elas **concordam** em NITOSSOLO quando se
toma a feicao de solo: a 2024 devolve `cod_um2 = SG21NVef1`, `erod_c1 = Baixa`, legenda
`D NITOSSOLO VERMELHO Eutroferrico`.

Consequencia amostral: a margem oeste da bacia e o reservatorio de Itaipu, de modo que
pontos ao longo de toda essa borda podem ser excluidos por caixa de consulta que encosta
no poligono de agua, ainda que haja unidade de solo mapeada na coordenada. E `R13` deveria
entrar no denominador da medicao de correspondencia, provavelmente como correspondente,
deslocando `10/19` para cerca de `11/20`.

## F7 — dois valores de campo relatados errados

| Campo | Relatado | Medido |
|---|---|---|
| `cod_um2` (associacao) | `SG22NVef2NV` | `SG22NVef7` |
| `cod_um2` (R13) | `SG21NVef1NV` | `SG21NVef1` |
| `erod_um` (associacao) | `Baixa` | `Media` |

O sufixo `NV` aparece anexado sistematicamente em `cod_um2`. Sem consequencia para o nivel
de K (`Media` e `Baixa` sao ambos Nivel 1), mas errado no registro.

---

# Correcao de F7 e novo achado F8 — 28/09/2026 (segunda verificacao)

## F7 estava PARCIALMENTE ERRADO — correcao

Eu havia registrado que o executor anexava um sufixo de duas letras a `cod_um2`
(`SG21NVef1NV` contra `SG21NVef1` medido). **Estava errado.** A camada tem DOIS campos:

| ponto | `cod_um` | `cod_um2` |
|---|---|---|
| R13 / C02 | `SG21NVef1NV` | `SG21NVef1` |
| R01 Toledo | `SG22LVef1LV` | `SG22LVef1` |

Os valores que ele relatou sao os de **`cod_um`**, corretos, apenas rotulados como
`cod_um2`. E erro de rotulo de campo, nao valor inventado. A parte de F7 que permanece sem
explicacao e o ponto de associacao (`SG22NVef2NV` relatado contra `cod_um2 = SG22NVef7`
medido, padrao que nao encaixa) e o `erod_um` da associacao (`Baixa` relatado contra
`Media` medido).

## C02 nao era falsa inclusao — minha suspeita era infundada

Suspeitei que a regra de U1 "preferir a feicao com solo" pudesse admitir ponto realmente
dentro da represa. Testei por ponto-em-poligono e **as duas cartas dizem SOLO** na
coordenada (-24.8531, -54.3622): PR `LVef1 LATOSSOLO`, 2024 `SG21NVef1 Baixa k=0.012`. O
rotulo `C02_SantaHelena_CorpoDagua` e que e impropio — a coordenada esta em terra. A
leitura "Corpo d'agua" que eu obtive antes era artefato do meu proprio metodo, que tomava
a primeira feicao do GetFeatureInfo.

## F8 (NOVO) — ponto-em-poligono por CQL resolve a ambiguidade de forma determinística

O mecanismo de U1 acerta nos pontos conferidos, mas por heuristica sobre consulta com
buffer: a ordem das feicoes do GeoServer NAO e ordem de contencao. Em C02 o poligono de
agua vem primeiro na camada de 2024; em R13 vem primeiro na camada do PR. A regra
"preferir solo" chega a resposta certa sem garantia de chegar.

Existe caminho determinístico, **testado nesta data**: WFS `GetFeature` com filtro
espacial de contencao, que devolve exatamente o poligono que contem o ponto.

    service=WFS&version=2.0.0&request=GetFeature&typeNames=<camada>
    &outputFormat=application/json
    &CQL_FILTER=INTERSECTS(geometry, POINT(<lat> <lon>))

**Ordem de eixos importa:** na versao 2.0.0 o ponto vai como `POINT(lat lon)`; com
`POINT(lon lat)` devolve 0 feicoes. A versao 1.0.0 aceita `POINT(lon lat)`. Testadas as
cinco variantes; apenas essas duas funcionam.

Resultado em quatro pontos, sempre **uma** feicao por camada:

| ponto | PR | 2024 |
|---|---|---|
| C02 (-24.8531, -54.3622) | LVef1 LATOSSOLO | SG21NVef1, Baixa, k=0.012 |
| R13 (-24.8800, -54.2600) | NVef2 NITOSSOLO | SG21NVef1, Baixa, k=0.012 |
| R01 (-24.62, -53.71) | LVef1 LATOSSOLO | SG22LVef1, Muito baixa, k=0.002 |
| C01 (-24.286, -53.84) | Area Urbana | SG22Ar, Area urbana, k=0 |

Ganho: elimina a categoria "ponto em fronteira" como fonte de arbitrio — sao 7 de 20
pontos, 35%, cuja classificacao hoje depende da heuristica. Ressalva: ponto sobre lacuna
ou sobre poligono de agua devolve ZERO feicoes, o que deve mapear para `indisponivel` e
NUNCA para "solo nao encontrado, usar fallback".

## F9 — ponto-em-poligono nas TRES camadas numa unica requisicao (testado)

O custo nao aumenta: continua uma requisicao por ponto, como o GetFeatureInfo de hoje.

    service=WFS&version=1.1.0&request=GetFeature
    &typeName=<L1>,<L2>,<L3>
    &outputFormat=application/json
    &CQL_FILTER=INTERSECTS(geometry, POINT(<lat> <lon>));INTERSECTS(...);INTERSECTS(...)

Um filtro por camada, separados por ponto e virgula, na mesma ordem de typeName.
Medido em (-24.8800, -54.2600) -> 3 feicoes, uma por camada:
parana_solos_20201105.2807 (NVef2), bra_erodibilidade_2024_sirgas2000.102154 (SG21NVef1),
brasil_erodibilidade_solo.75362 (Baixa).

NAO funciona: WFS 2.0.0 com varias typeNames -> HTTP 500, "Join query must specify a
filter". Com camada unica a 2.0.0 funciona, mas exigiria tres requisicoes.

ORDEM DE EIXOS, inverte entre versoes e falha em silencio:
  1.1.0 -> POINT(lat lon);  1.0.0 -> POINT(lon lat);  2.0.0 (camada unica) -> POINT(lat lon)
Com a ordem errada a consulta devolve ZERO feicoes sem erro algum, para todos os pontos —
o que faria todo candidato virar "sem solo mapeado" e esvaziaria o quadro amostral em
silencio. E o modo de falha mais perigoso da troca.
