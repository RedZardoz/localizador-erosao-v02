# Prompt de Execução — Exportação de planos de voo para o NControl

**Data:** 29/09/2026
**Objetivo:** ao sortear os polígonos, emitir planos de voo `.plan` carregáveis diretamente no NControl, com seguimento de terreno resolvido no arquivo, itinerário de visita agrupado e a tabela de autorizações.
**Depende de:** o sorteio de D16 existir. Pode ser construído antes, mas só produz saída real depois.

---

# PARTE 0 — O FORMATO, DECODIFICADO E VERIFICADO

Não há nada a adivinhar aqui. Decodifiquei o formato a partir de dois planos reais do pesquisador, em `docs/Plano de voo exemplo/`.

## É QGroundControl `.plan`, versão 1

```
fileType: "Plan" · version: 1 · groundStation: "QGroundControl"
geoFence: {circles: [], polygons: [], version: 2}
rallyPoints: {points: [], version: 2}
mission: {version, firmwareType: 3, vehicleType: 2, cruiseSpeed: 15, hoverSpeed: 12,
          plannedHomePosition: [lat, lon, alt], items: [...]}
```

`firmwareType: 3` é ArduPilot; `vehicleType: 2` é multirrotor. Os itens de missão são, em ordem: **SimpleItem comando 22** (decolagem), um ou mais **ComplexItem `survey`**, e **SimpleItem comando 20** (pouso).

**Vários polígonos cabem numa só missão.** `MissaoCalculoMica.plan` tem **dois** `survey` com ângulos diferentes, 0 e 66. Isso é o que permite emitir um arquivo por jornada de campo em lugar de 72 arquivos.

## A câmera, lida da própria estação e CONFIRMADA contra medição

Do segundo `survey` de `MissaoCalculoMica.plan`:

```
CameraName    "Micasense Altum"
FocalLength   8        SensorWidth  7.12      SensorHeight 5.33
ImageWidth    2064     ImageHeight  1544
FrontalOverlap 80      SideOverlap  60        Landscape true
DistanceToSurface 80   DistanceToSurfaceRelative true   →  ImageDensity 3.4496
```

Passo de pixel 3,4496 µm. Aritmética conferida: (7,12/2064) × 80 / 8 = 3,4496 cm.

**Validação independente**, e é o que autoriza confiar nestes números: os GSD nativos que medi nos ortomosaicos das missões reais correspondem, com esta câmera, a altitudes plausíveis — **3,59 cm → 83,3 m** e **3,96 cm → 91,8 m**. O preset descreve o equipamento que voou.

**Use ESTES valores. Não os do `Coleta 01b.plan`**, que são de um FLIR Duo Pro R e planejariam 72 voos para a câmera errada.

## Parâmetros derivados para o alvo de 4 cm de D16

| Grandeza | Valor |
|---|---|
| Altitude para GSD 4,0 cm | **92,8 m** |
| Pegada no solo | 82,6 x 61,8 m |
| Espaçamento de faixa (60% lateral) | **33,0 m** |
| Distância de disparo (80% frontal) | **12,4 m** |
| Polígono de 224 m | ~7 linhas, ~123 disparos |
| Tempo de voo a 8,7–9,2 m/s medidos | ~3 min + curvas |

**A velocidade planejada não se cumpre:** o plano traz `cruiseSpeed: 15`, e eu medi 8,7 a 9,2 m/s nos logs reais. Use a medida para estimar tempo; mantenha 15 no campo `cruiseSpeed` para não alterar o comportamento da aeronave.

## Como os waypoints são guardados

Dentro de `TransectStyleComplexItem.Items`:

- **comando 16**, `frame: 3` (relativa), `params: [0, 0, 0, null, lat, lon, ALTITUDE]` — a altitude é o **7º parâmetro**;
- **comando 206**, `frame: 2`, `params: [distância, 0, 1, 0, 0, 0, 0]` — disparo por distância.

No exemplo do Altum: **62 itens, 48 waypoints, 14 disparos, trigger 10,652403 m**. Confere com 1544 × 3,4496 cm × 20% = 10,65 m.

---

# PARTE I — Y1: O GERADOR DE TRANSECTOS, COM TESTE DE ACEITE FALSIFICÁVEL

Construa o gerador que, a partir de polígono, câmera, ângulo e sobreposições, produz `Items` e `VisualTransectPoints`.

## Teste de aceite, obrigatório e primeiro

Alimente o gerador com **o polígono, a câmera e o ângulo 66 do `survey` do Altum em `MissaoCalculoMica.plan`** e asseverar que ele reproduz a saída da própria estação:

- **62 itens**, sendo **48** de comando 16 e **14** de comando 206;
- distância de disparo **10,652403 m**, com tolerância de 1e-4;
- `VisualTransectPoints` com **48** pontos;
- coordenadas dos waypoints com tolerância de **0,5 m** em distância geodésica.

**Se não reproduzir, a matemática está errada e o trabalho para aí.** Relate a discrepância em lugar de ajustar tolerância — P11.

Só depois de passar, gere para os polígonos de D16.

---

# PARTE II — Y2: SEGUIMENTO DE TERRENO RESOLVIDO NO ARQUIVO

O pesquisador informou que o NControl **faz** seguimento de terreno, mas que na hora de programar **não conseguiu comunicação com as bases de altitude**. Como a altitude de cada waypoint está gravada no próprio arquivo, isso é resolúvel sem depender do serviço.

## Cálculo

Para cada waypoint, a altitude relativa gravada no 7º parâmetro é:

```
alt_relativa = AGL_desejada + (terreno_no_waypoint − terreno_na_decolagem)
```

- `AGL_desejada` = 92,8 m para GSD de 4 cm, derivada da câmera e não digitada.
- O terreno vem do **Copernicus DEM GLO-30**, o mesmo de D21, que o pipeline já consome.
- **Por que a diferença e não o valor absoluto:** sendo diferença, o datum vertical se cancela, e não há risco de confundir altura geoidal com elipsoidal. É a formulação segura.

## Ressalvas a declarar no cabeçalho do arquivo e no relatório

- O GLO-30 é modelo de **superfície**, não de terreno: inclui vegetação e construções. Sobre lavoura a diferença é pequena e o erro é **conservador**, porque superestimar a altura do solo dá mais folga. Perto de mata ciliar comandaria subir mais que o necessário.
- O GLO-30 tem **30 m** de resolução, de modo que o perfil seguido é suavizado em relação ao relevo real.
- Nenhum modelo digital contém obstáculo pontual — torre, silo, linha de transmissão. A responsabilidade de inspeção visual do sítio permanece do piloto, e isso deve estar escrito no relatório de voo emitido.

## Duas variantes, porque há uma incerteza que não resolvo por leitura

Não sei se o NControl, ao abrir plano com `FollowTerrain: true` sem alcançar a base de altitude, **aceita as altitudes gravadas** ou **tenta recalcular e falha**.

Emita as duas para cada agrupamento:

- `<nome>_terrainfollow.plan` com `FollowTerrain: true`
- `<nome>_altfixa.plan` com `FollowTerrain: false`

**Ambas com as altitudes por waypoint já calculadas do GLO-30.** A segunda voa seguindo o terreno de fato, ainda que a estação não a rotule assim.

O pesquisador carrega uma de cada no NControl, no escritório, e a que abrir limpa vira o padrão. **Não escolha por você** — relate que as duas foram emitidas e que o teste de carga cabe a ele.

## Ganho a registrar

Sem seguimento de terreno, num polígono de 224 m a 20% de declividade o desnível é de 45 m, e o GSD varia de **3,0 a 5,0 cm** dentro do mesmo polígono — fator de 1,6, justamente ao longo da vertente, que é a direção em que o fenômeno varia. Com as altitudes embutidas, o GSD fica constante. Registre o desnível de cada polígono no pacote de reprodutibilidade.

---

# PARTE III — Y3: ÂNGULO DAS FAIXAS PELO DECLIVE

O campo `angle` do `survey` existe e é respeitado — o exemplo usa 0 e 66.

Calcule o ângulo por polígono a partir do **aspecto médio do terreno** no GLO-30, de modo que as faixas corram **no sentido do declive**, conforme a emenda de geometria de D16. Registre o ângulo adotado e o aspecto medido que o gerou.

Quando o polígono for retângulo com razão de aspecto até 1:2, oriente o **lado maior** no sentido do declive, quando a geometria do imóvel permitir. Se não permitir, registre o conflito em lugar de resolvê-lo em silêncio.

---

# PARTE IV — Y4: AGRUPAMENTO POR JORNADA E ITINERÁRIO

São 72 polígonos de 5,02 ha. O mapeamento leva ~3 min cada; **o que domina a campanha é deslocamento**.

1. Agrupe os 72 por **proximidade geográfica**, respeitando um teto de polígonos por jornada que o pesquisador possa ajustar, com padrão de 6.
2. Emita **um `.plan` por agrupamento**, contendo os `survey` daquele dia — é para isso que serve a missão com múltiplos `survey`.
3. `plannedHomePosition`: proponha um ponto de decolagem por agrupamento. Se não houver dado de acesso viário no repositório, use o centro do primeiro polígono e **marque como sugestão a confirmar em campo** — não o apresente como definitivo.
4. Emita um **itinerário** por jornada, em CSV e em PDF, com ordem de visita, distâncias, tempo estimado de voo pela produtividade medida, e o desnível de cada polígono.

---

# PARTE V — Y5: DUAS EXPORTAÇÕES, PELO PROTOCOLO CEGO

Esta parte não é burocracia. Errá-la contamina o rótulo.

**Exportação do PILOTO** — `.plan`, itinerário, tabela de autorizações. Pode conter estrato, papel treino/held-out, código do polígono, tudo. O piloto não rotula erosão.

**Exportação do INTÉRPRETE**, que recebe o ortomosaico para delinear conforme D26 — **não pode conter** estrato, nível de K̂, papel treino/held-out, escore de suscetibilidade, nem qualquer indício do que se espera encontrar. Só identificador opaco do polígono e a imagem.

Se as duas saírem do mesmo pacote, garanta por **teste** que a do intérprete não carrega nenhum campo de `CAMPOS_PROIBIDOS_MATRIZ_TREINO` nem os campos de estrato — e que o identificador entregue a ele **não é decodificável** para o estrato.

---

# PARTE VI — Y6: TABELA DE AUTORIZAÇÕES

São 72 autorizações de proprietário, e a emenda de D16 as registra como o custo assumido do desenho.

Emita, junto do itinerário, uma tabela com: código do polígono, **código do CAR**, nome do proprietário, município, área do imóvel, área do polígono, e espaço para data e forma da autorização obtida. É o documento de campo que torna a campanha administrável, e serve de anexo de proveniência.

---

# PARTE VII — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `src/config/decisoes.ts` proibido. A câmera e a geometria vêm de D16 e do preset da estação; a AGL é **derivada** da câmera, nunca digitada.
- **Não use o `CameraCalc` do FLIR.** É a armadilha óbvia deste trabalho.
- **Não invente constante de câmera.** Tudo vem de `MissaoCalculoMica.plan`, item 2.
- **P11** — se o teste de aceite de Y1 não reproduzir os 62 itens, relate. Não relaxe a tolerância.
- **Não escolha** entre as duas variantes de seguimento de terreno; emita as duas.
- **Não apresente o ponto de decolagem como definitivo** sem dado de acesso.
- **Não execute o sorteio.**

---

# PARTE VIII — RELATÓRIO

Vale **R1 a R6**. Gere as tabelas a partir dos artefatos, não da memória.

1. Resultado do teste de aceite de Y1, com os quatro números confrontados contra o exemplo.
2. Um `.plan` gerado, completo, cometido como artefato, para um polígono de teste.
3. Como a altitude por waypoint é calculada, e o desnível medido nos polígonos de teste.
4. Ângulo adotado por polígono e o aspecto que o gerou.
5. Agrupamentos formados, com o teto usado e a quilometragem estimada.
6. Confirmação, por teste, de que a exportação do intérprete não vaza estrato nem papel.
7. Passagem de autoconferência de R5 e o que ela pegou.

Assine com a sua identidade. `author` é Luís Alfredo Ferreira da Silva (`RedZardoz`). Atualize `docs/PROVENIENCIA_ASSISTENCIA_IA.md`.

---

## Nota

Este trabalho não depende de decisão nova: a câmera veio da estação do próprio pesquisador, a geometria veio de D16 emendada, o terreno veio de D21, e a AGL é derivada e não escolhida. O único juízo é o agrupamento por jornada, que é logístico e ajustável.

O teste de aceite contra o plano existente é o que separa isto de um gerador plausível. Reproduzir 62 itens e um trigger de 10,652403 m calculados pela própria estação é prova de que a matemática fotogramétrica está certa — e é barato, porque o arquivo de confronto já está no repositório.
