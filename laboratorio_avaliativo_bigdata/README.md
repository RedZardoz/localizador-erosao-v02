# Laboratório Avaliativo 1 — Exploração de Dados Agrícolas

Atividade da Semana 2 (Big Data no Agronegócio). Integra duas bases públicas de naturezas
distintas para analisar soja, milho e cana-de-açúcar em MT, PR e SP, de 2013 a 2025.

## Arquivos

| Arquivo | Descrição |
|---|---|
| `Laboratorio_Avaliativo_1_Dados_Agricolas.ipynb` | Notebook completo, já executado (saídas e gráficos preservados) |
| `base_integrada_agro.csv` | Base integrada resultante — 117 observações, 24 colunas |

## Fontes

- **IBGE / Agregados v3** — tabela 1612 (Produção Agrícola Municipal): produção, área plantada,
  área colhida e rendimento médio. Sem autenticação.
- **NASA POWER** — API diária (comunidade AG): precipitação corrigida e temperaturas média,
  máxima e mínima a 2 m, em 9 pontos (3 por estado). Sem autenticação.

## Como executar

Abrir no Google Colab ou em Jupyter e rodar todas as células na ordem. As dependências
(`requests`, `pandas`, `numpy`, `matplotlib`, `scipy`) já existem no Colab. Os dados são
baixados das APIs no momento da execução — nenhum número está digitado no código.

Tempo típico de execução completa: cerca de 40 segundos.

Para alterar o recorte (culturas, estados ou período), editar apenas a célula de parâmetros
da seção 1; todo o restante se ajusta automaticamente.

## Requisito de rede

As duas APIs precisam estar acessíveis:

```
servicodados.ibge.gov.br
power.larc.nasa.gov
```

Em ambientes com política de egresso restritiva, ambos precisam ser liberados. O notebook
inclui uma célula de diagnóstico de conectividade que falha cedo e com mensagem clara caso
alguma das fontes esteja inacessível.

Observação: o endpoint clássico `apisidra.ibge.gov.br` **não** funciona por script — está
atrás de um desafio anti-bot do Cloudflare. A API Agregados v3 expõe o mesmo agregado 1612
sem esse bloqueio.
