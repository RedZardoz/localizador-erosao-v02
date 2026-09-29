# Gargalo nos estratos de K̂=2, e correção do domínio de declividade — 29/09/2026

Verificação do relatório da Opção A (commit `3953871`).

## Implementação: aprovada

`tsc` limpo, 43 arquivos e 328 testes, `decisoes.ts` intocado (P8). A heurística
`classificarNivelEstratoKComponente` foi **genuinamente removida** — só resta menção em
comentário documentando a aposentadoria. `MarcadorKAmbiguoD08 = true | false | "indisponivel"`
confirma os três estados. `derivarNivelKDaCarta2024` e `avaliarAmbiguidadeKAssociacaoD08`
existem e operam nos dois ramos de D08.

## ERRO DE DOMÍNIO: a medição usou 3–45%, e D07 fixa 3–20%

A chave do próprio artefato é `filtroDeclividadeD07_3a45pct`. Mas **D07 fixa declividade de
3% a 20%**, e o código traz `maxSlopePercent: 20.0` em `OPCOES_ELEGIBILIDADE_PADRAO`
(`src/lib/gee/elegibilidade.ts:33`). A faixa de 45% não é o domínio de validade de decisão
alguma.

Recalculei sobre os 90 candidatos do artefato dele:

| Faixa | Elegíveis | K̂=1 | K̂=2 | Necessário (9 estratos x 2) | Falta |
|---|---|---|---|---|---|
| 3–45% (como ele mediu) | 38 | 29 | 9 | 18 | **9** |
| **3–20% (D07 real)** | **29** | **24** | **5** | 18 | **13** |

**O gargalo é pior do que o relatado**, não melhor.

## A causa apontada por ele está CORRETA

`src/app/api/gee/select-candidates/route.ts:340` aplica
`poolParaMedicaoReal = candidatosAposThinning.slice(0, max(ceil(tamanhoAmostra*1.8), 90))`
**antes** do filtro de declividade, que está na linha 482. O teto operacional precede o
filtro de domínio físico, de modo que o pool de 90 é cortado sobre o universo inteiro e só
depois se descobre que a maioria está fora de D07.

## Proposta 1 dele (elevar o teto, filtrar antes): correta e necessária

Escala: 5 de 90 no pool estão em K̂=2 dentro de 3–20%, isto é 5,6%. Sobre os 593 imóveis do
divisor hidrográfico, a proporção renderia cerca de 33 — acima dos 18 necessários, mas com
margem de apenas 1,8x, e não com a folga que os números de 3–45% sugeriam.

Ressalva importante: os 18 precisam se distribuir por **9 células** (3 tercis de Ŝ x 3 de Ê)
DENTRO de K̂=2, e os solos de erodibilidade alta ocorrem preferencialmente em relevo mais
declivoso — ele mesmo mediu N(S1,K2)=3 contra N(S3,K2)=4 na faixa larga. Logo a distribuição
dentro de K̂=2 é enviesada para o tercil superior de declividade, e as células (S1, *, K2)
podem seguir magras mesmo com 593. Além disso Ê ainda não foi medido, por falta de
credenciais GEE, de modo que a distribuição em Ê é desconhecida.

**Conclusão: elevar o teto é necessário, pode ser suficiente, e não está garantido.**

## Proposta 2 dele (mover "Média" para K̂=2): RECUSADA

Ele propõe recortar a dicotomia entre {Muito baixa, Baixa} e {Média, Alta, Muito alta,
Extremamente alta}, elevando a fração de K̂=2 de 16,7% para 31,1%.

Três razões para recusar:

1. **Contraria D09**, que fixa a fronteira entre classe 3 e classe 4 — K menor ou igual a
   0,0285 contra K maior ou igual a 0,0300 — conforme a Tabela 5 do Documentos 246. "Média" é
   nível 1 por decisão registrada e conferida na fonte.
2. **É ajuste pós-hoc de limiar físico para acomodar a amostra.** A justificativa oferecida é
   aritmética amostral: mover a fronteira porque de um lado há candidatos demais e do outro de
   menos. Isso torna a estratificação função dos dados em lugar do fenômeno, e é exatamente a
   flexibilidade analítica que o pré-registro de D25 existe para impedir.
3. Mudaria retroativamente o sentido de toda afirmação sobre K̂ já registrada, inclusive a
   medição de dispersão intra-unidade e a emenda de D14.

**Não se move um limiar físico para resolver um problema amostral.** Se a bacia tem poucos
solos de erodibilidade alta no domínio agrícola, isso é achado sobre a bacia, e o desenho
acomoda o achado — não o contrário.

## Alternativas legítimas, se a falta sobreviver à medição completa

**(A) Colapsar K̂ para um nível, indo de 18 para 9 estratos.** Honesto e sustentado pela
própria medição: no domínio agrícola de 3–20% a bacia é quase homogênea em erodibilidade
(24 de 29 em nível 1), de modo que K̂ tem pouco poder estratificador aqui. Custa MENOS voo —
9 estratos x 2 polígonos = 18 polígonos, 180 ha. Custo a declarar: o bloco de solo de D24
cairia de 36 para 18 unidades efetivas, agravando o bloco já mais fraco.

**(B) Alocação desproporcional com pi_i registrado**, que D23 já autoriza. Mas D16 exige dois
polígonos por estrato para o pareamento treino/held-out, e estrato com um só quebra o
pareamento — o que D16 rejeitou explicitamente e por boa razão.

**(C) Rever o UNIVERSO de candidatos, que ninguém questionou ainda.** Os candidatos são
**centroides de imóveis rurais** — 593 no divisor hidrográfico. Mas os polígonos de D16 são de
10 ha, e a bacia tem milhares de localizações elegíveis de 10 ha dentro de 3–20%, em lavoura
ou pastagem, fora de água e de área urbana. Um centroide por imóvel é restrição severa, e
pode ser herança do desenho anterior, baseado em propriedade, e não necessidade do desenho
atual. Se houver razão vinculante — autorização de acesso e de sobrevoo, vínculo com o CAR —
ela precisa estar declarada como tal; se for herança, ampliar o quadro para localizações
elegíveis provavelmente dissolve a falta sem tocar em decisão alguma.

## Recomendação

Elevar o teto, filtrar por D07 **antes** do corte, e remedir sobre os 593 — **antes** de
decidir qualquer coisa. Não se decide desenho sobre amostra de 90 candidatos medida na faixa
de declividade errada.
