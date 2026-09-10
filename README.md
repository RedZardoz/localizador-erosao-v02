# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar

**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)**  
*Pesquisa de Mestrado: Validação de Método de Localização e Predição de Erosão Laminar no Paraná*

---

## Estado Atual: Em Reconstrução (Branch `sarel/v2`)

O sistema está passando por reconstrução metodológica e de engenharia conforme estabelecido nos documentos de planejamento:
- [Plano de Implementação v3](docs/planejamento/implementation_plan_v3.md)
- [Prompt de Reconstrução e Lei Fundamental](docs/planejamento/PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md)
- [Planejamento de Pesquisa v3](docs/planejamento/PLANEJAMENTO_PESQUISA_v3_2026-09-08.md)
- [Registro de Decisões Metodológicas](docs/planejamento/DECISOES.md)
- [Inventário do Código Legado em Quarentena](docs/planejamento/INVENTARIO_LEGADO.md)

---

## O que o SAREL faz

1. **Propõe onde observar:** Desenho amostral estratificado e espacialmente disperso ($18$ estratos multivariados $\hat{S} \times \hat{E} \times \hat{K}$).
2. **Extrai features verificáveis:** Sensoriamento remoto multiespectral (Sentinel-2 L2A / Landsat), DEM Copernicus GLO-30, cartas pedológicas da Embrapa GeoInfo e dados pluviométricos (CHIRPS / GPM IMERG) com proveniência estrita.
3. **Gerencia a campanha de rotulagem:** Exporta planos cegos de interpretação, campo e voo de drone, ingere rótulos de observação humana e consolida a matriz de treino para modelagem supervisionada externa.

*O SAREL não classifica erosão: o rótulo provém exclusivamente de observadores humanos.*

---

## Como usar o Localizador de Erosão (Legado) durante a transição

O código do Localizador anterior está congelado na tag `legado-pre-sarel`. Para executá-lo:

```bash
git switch --detach legado-pre-sarel
npm run build && npm run start
```

Para retornar à reconstrução do SAREL:

```bash
git switch sarel/v2
```

Os manuais de operação e documentação histórica do Localizador estão arquivados em `docs/legado/`.
