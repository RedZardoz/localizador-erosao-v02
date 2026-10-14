# Prompt de Execução — Integração dos fatores R e LS da linha de base RUSLE

**Data:** 01/10/2026
**Decisões a implementar:** **D13** (fator R) e **D15** (fator LS), ambas decididas em 27/09/2026 e **nunca integradas**.
**Por que agora:** verifiquei, e **nenhuma das duas depende do Earth Engine**. São o único trabalho de software grande que avança com o GEE bloqueado.

---

# PARTE 0 — O ESTADO, VERIFICADO

`src/lib/rusle/linhaDeBase.ts` ainda devolve, para R e para LS, `indisponivel` com causa `nao-calculado`. Em consequência, **`perdaSolo` nunca é calculada**, retida pelo Invariante 1 — comportamento correto, e é o que precisa mudar.

Sem linha de base RUSLE, **D25 não é avaliável**: o `rho_RUSLE` que ela pré-registra como referência de comparação não existe.

## O que já há

| | Estado |
|---|---|
| `src/lib/rusle/fatorC.ts` | implementado |
| `src/lib/rusle/fatorK.ts` | implementado, com `k_solos` da carta de 2024 (D14 emendada) |
| Fator P | tabelado por D22, com ressalva registrada |
| **Fator R** | **não existe** |
| **Fator LS** | **não existe** |
| `src/lib/chuva/chirps.ts` | **só processa** série que lhe entregam; **não busca**. A coleção nomeada é o asset do GEE. |
| `src/lib/chuva/imerg.ts`, `eventos.ts` | existem; IMERG é reservado a D19 por D13 |

## O que verifiquei, e que destrava o trabalho

**CHIRPS mensal é acessível diretamente, sem credencial.** Testei:
`https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_monthly/tifs/` responde **HTTP 200**, com arquivos `chirps-v2.0.AAAA.MM.tif` desde 1981.

**`whitebox` 2.3.6 está instalado**, junto de `rasterio` 1.5.1 e `numpy` 2.4.6. Os 4 tiles do Copernicus GLO-30 estão em `data/dem_cache/` e cobrem a bacia inteira.

Logo: **R e LS não precisam do Earth Engine.**

## Uma obrigação de D15 já cumprida — não a refaça

D15 exige medir a distorção de projeção antes de aceitar `EPSG:31982`, com tolerância de 0,5%. **Já foi medido**: máximo de **+0,1237%** sobre 20 segmentos da bacia, bem abaixo da tolerância. Scripts e saídas em `docs/verificacoes/projecao/`. A `EPSG:31982` está confirmada; use-a.

---

# PARTE I — G0: O PORTÃO BIBLIOGRÁFICO, QUE VEM ANTES DE QUALQUER CÓDIGO

**Leia esta parte inteira antes de escrever uma linha.**

Tanto D13 quanto D15 foram registradas com **ressalva de verificação explícita**:

> D13: *"a forma funcional e os coeficientes da equação regional NÃO foram conferidos contra a fonte primária nesta data. A conferência é OBRIGATÓRIA antes da implementação"*

> D15: *"os valores exatos dos patamares de m e a forma da função de S NÃO foram conferidos contra a fonte primária nesta data e devem ser lidos em Renard et al. (1997), Agriculture Handbook 703, antes de qualquer código"*

## As regras, sem exceção

1. **Nenhum coeficiente entra no código vindo de memória** — nem sua, nem minha, nem "o valor usualmente adotado", nem de artigo secundário que cite a fonte.
2. Para cada número, registre **onde** foi conferido: obra, edição e localização interna — tabela, equação numerada, página.
3. **Se não conseguir acessar a fonte primária, PARE.** Relate qual fonte e qual coeficiente faltou, deixe o fator como `indisponivel` com causa `nao-calculado`, e **não implemente com valor plausível**.
4. Comete o **script de extração e a saída bruta**, como foi feito com o Documentos 246 em `docs/verificacoes/fontes/doc246/`. Se a fonte for PDF, inclua os metadados gratuitos — número de páginas, título, autoria — como prova de acesso.

## Por que esta parte é intransigente

Três vezes nesta pesquisa um valor foi fabricado e apresentado como medido: altitudes por trigonometria da coordenada, dois planos de voo sintéticos sem marcação, e a dimensão Ê inteira por contador. Registro em `docs/verificacoes/2026-10-01_FABRICACAO_frequencia_solo_nu.md`.

E há razão científica direta, além da integridade: **D25 pré-registrou o `rho_RUSLE` como linha de base de comparação.** Um coeficiente errado em R ou em LS **desloca a linha de base**, e parte da distância medida entre o RUSLE e os competidores viria do erro de implementação, não do modelo físico. Isso corromperia o critério de refutação inteiro — e de forma invisível, porque o resultado pareceria plausível.

**Fontes a conferir:** Waltrick et al. (2015), *Revista Brasileira de Ciência do Solo*, para a erosividade do Paraná; Renard et al. (1997), *Agriculture Handbook 703*, para os patamares de `m` e a forma de `S`; Desmet & Govers (1996), *JSWC* 51(5):427-433, para a área de contribuição específica.

---

# PARTE II — G1: FATOR R

D13 está em `src/config/decisoes.ts`. **Leia o `valor` dela** — é normativo e este prompt não o repete. Em resumo do que governa a implementação:

1. **Equação de erosividade regional do Paraná** aplicada a totais pluviométricos, com os coeficientes conferidos conforme G0.
2. **R CLIMATOLÓGICO** — média de longo prazo sobre toda a série disponível, **não** erosividade de um ano. O rótulo do VANT é estado acumulado, não de uma safra.
3. **Proveniência `modelado`**, jamais `medido`. É equação calibrada em pluviógrafo aplicada a estimativa de satélite.
4. **CHIRPS para a climatologia; IMERG fica reservado a D19.**

## Ingestão

`chirps.ts` processa mas não busca. Construa a ingestão pela via direta do UCSB, que verifiquei estar acessível — **não** pelo asset do GEE, que está bloqueado.

- Baixe os mensais para a extensão da bacia e cacheie localmente, no mesmo espírito de `data/dem_cache/`.
- **O cache fica fora do versionamento**, como o DEM. Confirme no `.gitignore`.
- **Emita diário de requisições**, conforme a guarda de F5 em `src/lib/seguranca/diarioRequisicoes.ts`. Artefato de medição sem diário é inválido — e esta é a primeira medição real desde que a guarda existe, logo é também o primeiro teste dela.

## A limitação que D13 manda declarar, e que você não deve contornar

O EI30 do RUSLE exige intensidade em 30 minutos. **O CHIRPS é diário.** O EI30 verdadeiro **não é obtenível dele**, e a equação regional sobre totais mensais é **sucedâneo declarado**, não o EI30.

Isso entra no selo de proveniência e na limitação reportada. **Não apresente o resultado como EI30.**

## Suporte espacial

A grade do CHIRPS é de 0,05°, cerca de 5,5 km. Declare esse suporte nativo conforme a emenda de D06 — é por isso que o bloco de chuva tem teto de 1 preditor em D24. **Não reamostre para 10 m fingindo resolução que não existe.**

---

# PARTE III — G2: FATOR LS

D15 está no registro. Em resumo:

1. **Desmet & Govers (1996)**, área de contribuição específica bidimensional, com os expoentes conferidos conforme G0.
2. Sobre o **Copernicus GLO-30 a 30 m**, conforme D21, **sem reamostragem para 10 m**. O LS carrega suporte nativo de 30 m e é atribuído às células de 10 m nele contidas, conforme D06. É por isso que o bloco de terreno tem cerca de 11 unidades efetivas por polígono em D24 — **não "conserte" isso reamostrando.**
3. **Projeção `EPSG:31982`**, já confirmada pela medição de +0,1237%.
4. **Expoente `m` dependente da declividade**, não valor fixo, porque o domínio de 3% a 20% de D07 atravessa o ponto de quebra da formulação.
5. **Proveniência `modelado`.**

## Implementação

Use o `whitebox` já instalado para o acúmulo de fluxo sobre os tiles locais. **Reaproveite o acesso ao DEM que já existe** — `criarAmostradorCopernicusGLO30Real`, `identificarTileCopernicus`, `verificarCoberturaGLO30Poligonos` em `src/lib/drone/planoVooNControl.ts`.

**Não crie segunda via de leitura do DEM.** Se a cota usada no LS divergir da usada no plano de voo, isso é defeito.

Trate a isolação de `PROJ_LIB`, pela colisão conhecida com o PostGIS neste ambiente.

## Depressões e bordas

Acúmulo de fluxo exige decisão sobre depressões — preencher, romper, ou tratar como sumidouro — e sobre a borda do recorte, onde a área de contribuição é truncada porque o fluxo vem de fora.

**Declare o tratamento adotado** e, para as células cuja área de contribuição seja truncada pela borda do mosaico, marque o LS como `indisponivel` com causa nomeada, em lugar de reportar valor subestimado. Área de contribuição truncada produz LS baixo com aparência válida — é a mesma família de defeito do `k_solos = 0`.

---

# PARTE IV — G3: LIGAR À LINHA DE BASE E DESTRAVAR O INVARIANTE 1

Com R e LS disponíveis, `montarLinhaDeBaseRUSLE` passa a calcular `perdaSolo` quando **os cinco fatores** estiverem simultaneamente disponíveis com valor finito.

1. Atualize `linhaDeBase.ts` para consumir os dois fatores novos.
2. **O Invariante 1 permanece intacto**: faltando qualquer um dos cinco, `perdaSolo` segue `indisponivel`, com a causa nomeada. Não relaxe.
3. **A memória de cálculo** deve registrar os cinco fatores com suas proveniências individuais — dois `modelado`, um `tabelado`, e assim por diante — de modo que a composição do número seja auditável.
4. Atualize o teste de `rusle.test.ts` que hoje assevera `causa: "insuficiente"` com R e LS em `nao-calculado`. **Mantenha o teste do caminho retido** por injeção de fator substituto; acrescente o caminho calculado.

## Validação de domínio

O produto `A = R·K·LS·C·P` precisa de validação de domínio de saída, como foi feito com o fator C. Perda de solo negativa, infinita ou de ordem implausível para a bacia é `indisponivel`, não valor.

Declare a faixa plausível adotada e **de onde ela vem** — não a invente.

---

# PARTE V — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `decisoes.ts` proibido. D13 e D15 já estão decididas; leia e implemente.
- **G0 é bloqueante.** Sem fonte conferida, não há coeficiente, e o fator fica `indisponivel`.
- **P12** — `indisponivel` não vira valor, em nenhum ponto: nem R sem CHIRPS, nem LS em borda truncada, nem `perdaSolo` com fator faltando.
- **Não use o GEE** para o CHIRPS. A via direta está verificada.
- **Não reamostre** o LS de 30 m para 10 m.
- **Não crie segunda leitura do DEM.**
- **Não execute o sorteio.**

---

# PARTE VI — RELATÓRIO

Gerado por `scripts/gerar_relatorio_fase.ts`, conforme W5. Na seção de juízo:

1. **G0 primeiro:** quais fontes foram abertas, com os metadados gratuitos como prova, e a localização interna de cada coeficiente. Se alguma não foi conferida, qual, e o que ficou `indisponivel` por causa disso.
2. A ingestão do CHIRPS: período coberto, número de arquivos, e o **diário de requisições** emitido.
3. O tratamento de depressões e de borda no LS, e quantas células ficaram `indisponivel` por truncamento.
4. A faixa plausível adotada para `A`, e a fonte dela.
5. Quantos pontos do conjunto de candidatos passam a ter `perdaSolo` calculada, e quantos seguem retidos, por qual fator.

---

## Nota

Este é o único trabalho de software grande que não depende da credencial do Earth Engine, e por isso é o que faz sentido fazer agora.

Mas note o que ele destrava: com R e LS integrados, a **linha de base RUSLE passa a existir** — e ela é metade da hipótese que D25 testa. Sem ela, mesmo que todo o resto estivesse pronto, não haveria contra o que comparar o XGBoost.

O portão bibliográfico de G0 é desproporcionalmente importante justamente por isso: o número que sair daqui é a régua.
