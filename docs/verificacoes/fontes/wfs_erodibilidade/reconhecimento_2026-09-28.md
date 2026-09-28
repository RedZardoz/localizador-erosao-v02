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
