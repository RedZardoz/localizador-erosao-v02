# Prompt de Saneamento — SAREL

**Data:** 06/11/2026
**Origem:** levantamento integral do repositório (código, Registro de Decisões, documentação, suíte, higiene)
**Regra que governa este documento:** `docs/planejamento/PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md` (Lei Fundamental). Em qualquer conflito, a Lei Fundamental vence este arquivo.

---

## Como usar

Cada sessão abaixo é **uma sessão de agente**, na ordem. Abra uma sessão nova na raiz do repositório e cole o bloco da sessão correspondente como primeira mensagem. Não acumule duas sessões num commit.

Vale, para todas as sessões, a disciplina da §23 da Lei Fundamental:

- Uma sessão por fase; ao fim, o **Relatório de Fase** no formato da §22, e só então a proposta da próxima.
- Diffs cirúrgicos. Nenhuma dependência nova. Nenhuma reformatação de arquivo inteiro.
- Três verdes ao fim: `npm run test && npx tsc --noEmit && npm run lint`. **Nunca** desative teste, use `skip` ou afrouxe asserção.
- Nada de `commit`, `tag`, `branch` ou `push` sem autorização explícita.
- Descreva o código **lendo o código**. Não descreva o plano.
- O relatório não qualifica o próprio trabalho. Sem "robusto", "aprovado", "com louvor".

### Por que a ordem importa

As Sessões 0 e 1 são pré-requisito das demais. Hoje o repositório tem **quatro fontes de verdade que se contradizem** (código, `src/config/decisoes.ts`, `docs/planejamento/DECISOES.md`, `docs/design.md`/`README.md`) e **a suíte está vermelha num clone limpo**. Mandar corrigir código antes disso faz o executor escolher entre duas numerações rivais das 9 Regras e entregar contra a regra errada — que é exatamente como os defeitos descritos na Sessão 3 entraram.

---

## Decisões do pesquisador registradas em 06/11/2026

Transcritas literalmente. Servem de insumo às Sessões 1 e 3. O agente **não as reinterpreta**.

> **(a) Fator C** — "Vamos manter Durigon, manter NDVI e BSI separados ao XGBoost e ele constrói o produto se ele existir."
>
> **(b) Rótulo** — "Vamos com a Regra 4 estrita: triagem é triagem, rótulo é humano."

Consequências diretas, a implementar na Sessão 3:

1. `C = (1 − NDVI) / 2` (Durigon et al., 2014) é a **única** formulação no caminho analítico. A variante `× (1 + BSI)` sai do caminho analítico e vira função de análise de sensibilidade.
2. NDVI e BSI entram na matriz de treino **como variáveis separadas**. O produto não é pré-calculado e entregue ao modelo: árvores aprendem interação nativamente, e impor `(1 + BSI)` a priori fixa a forma funcional sem evidência.
3. Fator C **sai** da matriz de treino. Sob Durigon puro é transformação monótona de NDVI, logo informação zero além do NDVI — e manter uma saída de modelo RUSLE como feature reabre a circularidade que o commit `575467f` começou a fechar.
4. A classificação espectral (`BSI`/`NDVI`) é **triagem de candidatos**, nunca rótulo. O rótulo vem só de observação humana (interpretação cega, campo, drone). A separação passa a ser garantida por teste que falha, não por comentário.

---

# SESSÃO 0 — Verdade única

```
Leia por inteiro, antes de qualquer alteração:
- docs/planejamento/PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md (a Lei Fundamental)
- docs/design.md
- docs/planejamento/DECISOES.md
- src/config/decisoes.ts
- README.md
- docs/planejamento/INVENTARIO_LEGADO.md
- legado/pre_sarel/README.md

Esta sessão NÃO altera nada em src/lib/, src/app/, src/components/ nem src/store/.
Ela só resolve contradições documentais. Se encontrar defeito de código,
registre no Relatório de Fase e NÃO corrija aqui.

TAREFA 0.1 — Uma única definição das 9 Regras
docs/design.md linhas 13-21 renumera e reescreve as 9 Regras, divergindo da
Lei Fundamental em quatro pontos:
  - Regra 2 canônica ("Nunca colapsar estados distintos") foi substituída pelo
    corolário da Regra 1 ("Sem Cortes Silenciosos");
  - Regra 5 canônica ("Zero é um valor") foi substituída por "Guarda Antissintético";
  - Regra 6 canônica ("Respeitar as fontes legítimas") foi substituída por
    "Segregação Cega de Exportação";
  - Regra 9 canônica ("Todo parâmetro metodológico tem dono e registro") foi
    substituída por "Preservação do Histórico (tag git)".
Remova a lista de design.md. No lugar dela, uma referência de uma linha à
Lei Fundamental, Parte II. design.md descreve arquitetura; ele não legisla.

TAREFA 0.2 — CLAUDE.md na raiz
Crie CLAUDE.md na raiz com, no máximo, 60 linhas:
  - as 9 Regras canônicas em forma curta (título + uma linha cada), na
    numeração da Lei Fundamental;
  - o caminho do texto integral;
  - os Três Verdes e o comando de cada um;
  - a regra §23.4: parar e perguntar diante de qualquer parâmetro
    metodológico fora do Registro de Decisões;
  - o aviso de que src/ nunca importa de legado/.
Não duplique o texto integral da Lei Fundamental. CLAUDE.md é índice, não cópia.

TAREFA 0.3 — DECISOES.md deixa de ser escrito à mão
docs/planejamento/DECISOES.md declara-se "Espelho legível de
src/config/decisoes.ts" e divergiu em seis decisões: D02, D03, D04, D06, D10
e D11 estão "decidida" no código e "pendente" ou "implementado" no espelho.
  - escreva scripts/gerar_decisoes_md.mjs, que gera DECISOES.md a partir de
    src/config/decisoes.ts (DECISOES e PARAMETROS), preservando um cabeçalho
    fixo e as notas longas por decisão num bloco separado e versionado
    (ex.: docs/planejamento/decisoes-notas.md), lido pelo gerador;
  - adicione "decisoes:md" ao package.json;
  - crie src/config/decisoes.espelho.test.ts, que regenera em memória e FALHA
    se DECISOES.md no disco divergir. Inclua meta-teste: a função de comparação
    precisa detectar uma divergência plantada.
Nenhuma decisão muda de estado nesta sessão. O espelho reflete o código como
ele está hoje, inclusive onde está errado — corrigir o conteúdo é a Sessão 3.

TAREFA 0.4 — A tag legado-pre-sarel
README.md manda "git checkout legado-pre-sarel" e INVENTARIO_LEGADO.md afirma
que o histórico está "preservado de forma perpétua e imutável na tag
legado-pre-sarel". A tag NÃO EXISTE: nem local, nem em origin
(git tag -l e git ls-remote --tags origin devolvem vazio).
  1. Determine, com git log --all --diff-filter=D --name-only, se o conteúdo de
     legado/localizador/ e legado/sarel1/ existe em algum commit alcançável.
  2. Se existir: identifique o commit imediatamente anterior à remoção e
     RELATE o hash. NÃO crie a tag — criar e empurrar tag exige autorização
     explícita (§23.6).
  3. Se não existir: diga isso sem rodeio no relatório e corrija README.md e
     INVENTARIO_LEGADO.md para afirmar apenas o que é verdade.
Em nenhuma hipótese deixe no repositório uma afirmação de preservação sem
evidência. É a Regra 8 aplicada ao próprio projeto.

TAREFA 0.5 — INVENTARIO_LEGADO.md diz que legado/ foi removida
O arquivo afirma "Pasta legado/ removida do repositório (git rm -r)".
legado/pre_sarel/ existe, com 9 arquivos, reintroduzida pelos commits a57cf9b
e 6636650. Corrija a afirmação e descreva o que legado/pre_sarel/ contém hoje,
lendo o diretório.

TAREFA 0.6 — legado/pre_sarel/README.md
O item 1 descreve "Tabela_Consolidada_Parana_Todo_o_Estado_150focos_2026-09-04.xlsx"
que não está no diretório. Confira cada um dos 6 itens contra o conteúdo real
e corrija.

TAREFA 0.7 — README.md: o sistema não é instalável pelo README
README.md não menciona Python, requirements.txt, a base SQLite
data/fundiario_brasil.db (obrigatória, ~1,67 GB, não versionada), os arquivos
.bat da raiz, nem scripts/. Hoje o guia real de instalação é
Iniciar_Localizador_Erosao.bat:24-40, que checa node, python e o .db.
Acrescente ao README:
  - pré-requisitos reais (Node >= 18.17, Python >= 3.10, requirements.txt);
  - que a base fundiária é local, não versionada, e como o sistema se comporta
    sem ela (status "base-nao-disponivel", nunca "sem-correspondencia");
  - o que cada .bat faz;
  - o papel de scripts/ (ingestão fundiária, geradores de PDF, treino XGBoost,
    scripts de verificação em scripts/verificacao/).
Corrija também a seção "Linha de Base RUSLE": ela descreve Durigon puro, que é
o que a decisão (a) de 06/11 manda manter — confira que o texto continua
coerente depois da Sessão 3 e não antecipe mudança aqui.

TAREFA 0.8 — Metadado defasado do package-lock.json
package-lock.json ainda declara "name": "localizador-erosao-laminar" e
"version": "1.0.0", contra "sarel"/"2.0.0" em package.json. Corrija com
`npm install --package-lock-only` e confira, no diff, que SOMENTE name e version
mudaram. Se o diff remover restrições "libc" dos pacotes opcionais, reverta e
relate: isso é regressão de plataforma e quebra instalação fora do Linux.

CRITÉRIOS DE ACEITE
- docs/design.md não contém mais nenhuma lista numerada de regras próprias.
- CLAUDE.md existe, numeração idêntica à Lei Fundamental.
- npm run decisoes:md não produz diff; decisoes.espelho.test.ts verde, com meta-teste.
- Nenhuma afirmação sobre a tag legado-pre-sarel sem evidência no repositório.
- README permite instalar e operar o sistema do zero.
- Três verdes (os 3 testes vermelhos de matcher.test.ts são PRÉ-EXISTENTES:
  relate-os, NÃO os conserte aqui — é a Sessão 1).

RELATÓRIO
Além do formato §22, liste explicitamente toda contradição documental que você
encontrou e NÃO corrigiu, com arquivo e linha.
```

---

# SESSÃO 1 — Suíte confiável, CI e varredor com alcance real

```
Leia antes: CLAUDE.md, a Lei Fundamental §6, §18 e §23.9,
src/lib/seguranca/padroesProibidos.test.ts, src/lib/fundiario/matcher.test.ts,
vitest.config.mts, package.json.

Esta sessão NÃO corrige nenhum defeito científico. Ela torna o verde confiável
e faz o varredor VER o que hoje ele não vê. Os defeitos vão para uma lista de
dívida explícita, zerada na Sessão 2.

TAREFA 1.1 — Testes que exigem ambiente saem da suíte unitária
npm run test falha hoje com 3 testes em src/lib/fundiario/matcher.test.ts, que
exigem data/fundiario_brasil.db (~1,67 GB, gitignorada). A §6 da Lei Fundamental
já manda: "Testes que exigem rede ou credencial terminam em .vivo.test.ts e
rodam só com npm run test:vivo". A infraestrutura existe (test:vivo em
package.json, exclusão em vitest.config.mts) e nenhum arquivo .vivo.test.ts foi
criado.
  - crie src/lib/fundiario/matcher.vivo.test.ts e mova para lá TODO teste cujo
    resultado depende da presença da base;
  - atenção ao teste de matcher.test.ts:98, que espera "sem-correspondencia" em
    (0,0): sem a base, a resposta CORRETA é "base-nao-disponivel" (Invariante 5
    e Regra 2). O teste, como está, afirma o errado quando o ambiente muda.
    Ele vai para o arquivo vivo sem alteração de asserção;
  - em matcher.test.ts fica só o que roda sem base: máscaras LGPD,
    toContextoFundiario, "erro-na-consulta" para coordenada inválida, e
    "base-nao-disponivel" com caminho de banco inexistente;
  - varra src/ inteiro e mova qualquer outro teste dependente de rede, banco ou
    credencial pelo mesmo critério. Liste no relatório cada um, com o motivo.
NÃO altere asserção nenhuma para ficar verde. Mover é permitido; afrouxar não.

TAREFA 1.2 — CI
Crie .github/workflows/tres-verdes.yml: em push e pull_request, Node 18.17,
npm ci, e os quatro passos em sequência — npm run test, npx tsc --noEmit,
npm run lint, npm run build. Sem continue-on-error em nenhum passo. Não inclua
test:vivo no CI: ele depende de base local e de credencial.

TAREFA 1.3 — O varredor precisa alcançar src/ inteiro
padroesProibidos.test.ts varre src/lib/** (raiz = path.resolve(__dirname, ".."))
e scripts/**. Ficam de fora src/app/**, src/components/**, src/store/** e
src/config/** — ou seja, justamente a orquestração, onde default disfarçado faz
mais dano. Estenda a raiz para src/ inteiro, mantendo a exclusão de *.test.ts
e de *.vivo.test.ts.

TAREFA 1.4 — Três pontos cegos confirmados do varredor
Os regexes atuais não detectam:
  (a) default por operador || com STRING literal. Exemplo real em
      src/app/api/gee/select-candidates/route.ts:333 —
      `valor: areas[0]?.codigoIbge || "4113700"` dentro de um campo marcado
      `estado: "medido"`;
  (b) o idioma Python `or <literal>`. Exemplo real em
      scripts/query_real_properties.py:33-36 — `r[1] or 'Paraná'` e
      `float(r[4] or 0)`, sendo que a Lei Fundamental §7 determina
      "areaImovelHa: ausente = null, nunca 0";
  (c) default por ternário. Exemplo real em src/lib/rusle/fatorC.ts:75 —
      `const bsiNum = bsi !== undefined ? bsi : 0;`.
Acrescente um padrão para cada, e um META-TESTE para cada, usando exatamente os
trechos acima como caso plantado. Varredor sem meta-teste é teste vacuoso (§18).
Para (a), restrinja o alvo a campos de valor científico para não acusar
`err.message || "texto de erro"`, que é uso legítimo em caminho de erro de UI;
documente o critério que você usou no próprio arquivo.

TAREFA 1.5 — Dívida técnica visível, em vez de verde falso
Estender o varredor vai acusar violações pré-existentes. NÃO as corrija aqui e
NÃO deixe a suíte vermelha. Crie src/lib/seguranca/divida-tecnica.json com a
lista EXATA das violações hoje existentes (arquivo, linha, padrão, trecho) e
faça o teste:
  - FALHAR se aparecer violação fora da lista;
  - FALHAR se a lista crescer;
  - imprimir a lista a cada execução, para que ela não seja esquecida.
A Sessão 2 esvazia esse arquivo. Um item só sai da lista corrigido, nunca
"aceito".

TAREFA 1.6 — BOM UTF-8 em 36 arquivos
36 arquivos versionados começam com EF BB BF, entre eles
src/lib/gee/terreno.ts, src/lib/gee/harmonicos.ts, src/lib/chuva/chirps.ts,
src/lib/fundiario/matcher.ts e scripts/query_real_properties.py. Liste-os com:
  git ls-files '*.ts' '*.tsx' '*.py' '*.mjs' | while read f; do \
    [ "$(od -An -tx1 -N3 "$f" | tr -d ' \n')" = "efbbbf" ] && echo "$f"; done
Remova o BOM (`sed -i '1s/^\xEF\xBB\xBF//'`) e crie um teste que falhe se
qualquer arquivo versionado de código voltar a ter BOM. Commit separado, só com
a remoção do BOM, para não contaminar o diff das outras tarefas.

TAREFA 1.7 — Regra 8 está verde por silêncio
verificacoes.test.ts funciona, mas há UM único selo VERIFICADO em todo o código
(src/lib/embrapa/embrapaSoilClient.ts:22). CHIRPS, IMERG, Sentinel-1, Planet e
IBGE não têm nenhum — o teste passa porque ninguém afirma nada. Há evidência
arquivada de IBGE em docs/verificacoes/2026-09-10_ibge_municipio_exemplo.json
que o código não cita.
Nesta sessão, apenas: acrescente ao relatório a tabela
"módulo × tem ingestão real? × tem evidência arquivada? × tem selo VERIFICADO?"
preenchida por leitura do código. NÃO invente selo para módulo que não faz
chamada — carimbar sem chamada é o defeito S1-02 do SAREL 1. Ligar ingestão é
a Sessão 4.

CRITÉRIOS DE ACEITE
- npm run test VERDE num clone limpo, sem data/ e sem credencial.
- npm run test:vivo existe e tem pelo menos um arquivo.
- CI configurado, com os quatro passos obrigatórios.
- Varredor alcança src/ inteiro; os três novos padrões têm meta-teste com caso
  plantado real.
- divida-tecnica.json lista as violações pré-existentes e o teste barra novas.
- Nenhum arquivo de código versionado com BOM.
- Nenhuma asserção afrouxada, nenhum skip, nenhum teste desativado.
```

---

# SESSÃO 2 — Os defeitos que reprovam

```
Leia antes: CLAUDE.md, a Lei Fundamental Regras 1, 2, 5 e 9 e §17,
src/app/api/gee/select-candidates/route.ts por inteiro,
src/lib/gee/estratificacao.ts, scripts/query_real_properties.py,
src/lib/seguranca/divida-tecnica.json.

Antes de cada correção, escreva o teste que FALHARIA com o defeito presente
(§21.3). Teste que passaria com o defeito não conta.

TAREFA 2.1 — O desenho amostral é alimentado por constantes
src/app/api/gee/select-candidates/route.ts:224-245 atribui, a TODO candidato:
  declividadePct:   declividadeMin         (3.0 para todos)
  declividadeGraus: derivada da constante
  elevacao:         0                      (0 m para todos)
  frequenciaSoloNu: frequenciaSoloNuMin    (0.15 para todos)
  nivelK:           1                      (nível 1 para todos)
Esses valores vão direto ao thinning e a executarAmostragemEstratificada.
Com variância zero, calcularLimiaresTercis devolve t1 == t2, classificarTercil
devolve 1 para todos, nivelK é 1, e TODOS os pontos caem em E_1_1_1:
1 estrato ocupado de 18. A "estratificação multivariada em 18 estratos
Ŝ×Ê×K̂" que README, design.md, Compêndio e apresentação anunciam é, hoje,
numericamente vazia.
É o defeito que reprovou o Localizador (Declividade = 16,00%, desvio padrão
0,00 em 150/150 linhas) renascido, agora parametrizado pelo mínimo do filtro da
interface, o que o faz parecer dinâmico.
Correção:
  - nenhum desses campos recebe constante. Cada um vira indisponivel com causa
    "nao-calculado" e motivo que diga o que falta (redução pontual no Earth
    Engine — Sessão 4);
  - a consequência é que a estratificação NÃO PODE RODAR. Isso é o resultado
    correto: é preferível recusar a entregar 18 estratos fictícios. A rota deve
    responder com recusa explícita, dizendo qual variável falta e por quê;
  - NÃO invente caminho alternativo, não use valor "típico", não derive
    declividade de outra coisa.

TAREFA 2.2 — estratificacao.ts aceita entrada sem variância
O módulo está correto no que faz (phiDiag vira null em amplitude zero, déficit
é reportado) e não é o culpado — o defeito é da rota. Mas ele não deveria
aceitar silenciosamente uma entrada em que amplitudeSValida e amplitudeEValida
são ambas falsas: estratificar por tercis sobre constante não tem significado.
Faça executarAmostragemEstratificada recusar essa entrada com erro explícito
que nomeie as dimensões sem amplitude. Acrescente teste com entrada constante
e teste que confirma que entrada com variância continua funcionando igual.

TAREFA 2.3 — Literais geográficos e default carimbado como medido
  - route.ts:333 — `areas[0]?.codigoIbge || "4113700"` dentro de um campo
    `estado: "medido"`. Código do IBGE inventado, apresentado como medição.
    Sem o código, o campo é indisponivel com causa "sem-cobertura".
  - route.ts:287 — `identificarBacia(lat, lng) || "Bacia do Rio Ivaí"`. Literal
    de programa em coluna geográfica: é a classe exata que o Invariante 6
    proíbe ("Custom", "Bacia Local"...). Acrescente também "Bacia do Rio Ivaí"
    à lista de literais barrados do Invariante 6, com teste.
  - route.ts:185-188 — quando a bbox das áreas é inválida, o código substitui
    silenciosamente pela bbox do Paraná inteiro. Troque por recusa explícita:
    AOI inválida é erro do pedido, não convite a amostrar o estado todo.

TAREFA 2.4 — Regra 2 na rota: estados colapsados
  - route.ts:100-109 — buscarImoveisReaisPython devolve resolve([]) para
    QUALQUER falha: base ausente, python ausente, timeout, JSON inválido.
    "Consultado e não há" fica indistinguível de "não foi possível consultar".
    Devolva união discriminada com status fechado, e propague a causa real.
    A rota, hoje, responde 404 "Nenhum imóvel rural cadastrado... foi
    localizado na área" (route.ts:193-200) até quando o problema é o Python
    não estar instalado. Isso é afirmação falsa sobre o território.
  - route.ts:293-298 — `catch { soloEmbrapa = null }` colapsa falha de serviço
    em ausência de dado. Separe os dois estados.

TAREFA 2.5 — Defaults em Python
scripts/query_real_properties.py:33-36:
  'municipio': r[1] or 'Paraná'          -> ausente é null, com causa
  'area_ha': round(float(r[4] or 0), 2)  -> Lei Fundamental §7: "ausente = null,
                                            nunca 0". Área 0 ha é valor legítimo
                                            e indistinguível do default.
Varra os outros scripts de scripts/ pelo mesmo padrão e corrija o que
alimentar o caminho analítico. Scripts puramente geradores de PDF não entram.

TAREFA 2.6 — Zerar a dívida
Ao fim, src/lib/seguranca/divida-tecnica.json deve estar vazio. Se algum item
não puder ser corrigido nesta sessão, ele FICA na lista com justificativa e a
sessão em que será resolvido, e isso vai no relatório — não some.

CRITÉRIOS DE ACEITE
- Nenhum campo de PontoAmostral recebe constante na rota de amostragem.
- Teste que falha se declividadePct, elevacao, frequenciaSoloNu ou nivelK
  voltarem a ser preenchidos por constante na rota.
- Invariante 6 barra "Bacia do Rio Ivaí", com meta-teste.
- Clientes de dado externo da rota devolvem status fechado com causa real.
- divida-tecnica.json vazio, ou cada item remanescente justificado no relatório.
- Três verdes.

ESPERE UMA REGRESSÃO APARENTE
Depois desta sessão a interface vai mostrar "indisponível" onde hoje mostra
número, e a amostragem vai recusar executar. Isso é o comportamento correto:
o número de hoje é falso. Registre no relatório, com clareza, tudo que deixou
de ser produzido e por quê.
```

---

# SESSÃO 3 — Reconciliação metodológica (decisões do pesquisador de 06/11/2026)

```
Leia antes: CLAUDE.md, a Lei Fundamental Regras 4 e 9 e §12,
o bloco "Decisões do pesquisador registradas em 06/11/2026" de
docs/planejamento/PROMPT_SANEAMENTO_2026-11-06.md,
src/config/decisoes.ts, src/lib/rusle/fatorC.ts, src/lib/rusle/linhaDeBase.ts,
src/lib/rusle/rusle.test.ts, src/lib/gee/amostragemBiofisica.ts,
src/lib/matriz/perfis.ts, src/lib/matriz/montagem.ts.

Você NÃO decide nada nesta sessão. As duas decisões estruturais estão tomadas
pelo pesquisador e transcritas no documento acima. Qualquer VALOR numérico que
ainda não tenha referência conferida permanece como está, com o estado que o
Registro exige — e você prepara a proposta, sem aprovar (Regra 9).

CONTEXTO VERIFICADO — leia antes de agir
A fórmula híbrida NUNCA RODOU no caminho de produção:
  route.ts:482      -> montarLinhaDeBaseRUSLE()                     // zero argumentos
  linhaDeBase.ts:56 -> obterFatorCComProveniencia(ndviProveniencia)  // UM argumento
  fatorC.ts:107     -> temBsi = false -> ramo "Durigon et al. (2014)"
calcularFatorCHibrido tem ZERO chamadores em todo o repositório, nem em teste.
calcularFatorC com dois argumentos só aparece em rusle.test.ts:44-55.
Logo: nenhum artefato já produzido contém valor de C derivado da híbrida, e
não há planilha, relatório ou PDF a retratar. O problema é documental, não
numérico. Confirme isso você mesmo, lendo o código, antes de prosseguir.

TAREFA 3.1 — Fator C: código alinhado a D01
src/lib/rusle/fatorC.ts hoje implementa C = ((1-NDVI)/2) × (1+BSI) e carimba
decisoes: ["D01"], contra:
  - src/config/decisoes.ts:33, D01, "decidida" pelo pesquisador em 2026-09-08,
    valor "(1 - NDVI) / 2";
  - Lei Fundamental §12: "Durigon et al. (2014) ... Sem BSI e sem corte";
  - README.md e docs/design.md, que já dizem Durigon puro.
Faça:
  - calcularFatorC(ndvi: number): um argumento, OBRIGATÓRIO, sem `?`. Isso
    elimina o default por ternário de fatorC.ts:75;
  - a função passa a obter a fórmula via exigirDecisao(DECISOES.D01) em vez de
    tê-la hardcoded. Hoje o Registro é decorativo: nada no caminho de cálculo
    o consulta. Se D01 estiver pendente, o retorno é indisponivel com causa
    "decisao-pendente" e o ID, como manda o §8;
  - renomeie a variante para calcularFatorCSensibilidadeBsi(ndvi, bsi),
    com docstring dizendo em uma frase que ela é exploratória e NÃO integra o
    caminho analítico, ao lado de calcularFatorCVanDerKnijff, que a §12 já
    prevê como análise de sensibilidade da Fase 8;
  - o docstring de fatorC.ts cita Durigon et al. (2014) diretamente e PARA de
    citar "Metodologia PPGTCA 2026, Seção 2.1 e Tabela 1". Esse documento
    existe no repositório apenas como docs/Compendio_Metodologico_SAREL_PPGTCA_2026.pdf,
    gerado por scripts/gerar_compendio_metodologico_pdf.py — isto é, pelo
    próprio projeto. Citação circular não é referência. Varra o código por
    outras ocorrências dessa citação (src/config/decisoes.ts,
    src/app/api/gee/select-candidates/route.ts,
    src/lib/gee/amostragemBiofisica.test.ts, scripts/treinar_xgboost_loco.py)
    e liste todas no relatório; a substituição por referência externa conferida
    é a Sessão 5.

TAREFA 3.2 — Limitação declarada de D01 está incompleta
D01 declara como limitação "resposta linear em NDVI e saturação do NDVI sob
biomassa densa comprimem a faixa de C em dossel fechado". Isso descreve o viés
de DOSSEL FECHADO. Falta o viés oposto, que é o relevante no Paraná:
palhada residual seca em Sistema Plantio Direto não é fotossinteticamente
ativa, logo NDVI cai mesmo com cobertura do solo próxima de 100%, e
C = (1-NDVI)/2 devolve valor na faixa de 0,32 a 0,40 — indistinguível de solo
exposto. Resultado: superestimação sistemática da perda de solo em área
conservacionista.
Acrescente essa limitação ao campo de limitação declarada de D01, em
src/config/decisoes.ts e no bloco de notas lido pelo gerador do espelho.
A aritmética (NDVI 0,20-0,35 -> C 0,325-0,40) é verificável e você deve
conferi-la. A premissa empírica (faixa de NDVI do SPD paranaense em entressafra)
AINDA NÃO TEM REFERÊNCIA CONFERIDA: registre-a como pendente de citação e
remeta à Sessão 5. Não a apresente como fato referenciado.

TAREFA 3.3 — Regra 4 estrita: separar triagem de rótulo
src/config/decisoes.ts:42-48, D02, cujo título é "Critérios observacionais de
presente/ausente", foi preenchida com uma regra de limiar espectral
("Classe 1: BSI > 0.10 e NDVI < 0.40 vs Classe 0: BSI < 0.00 e NDVI > 0.65").
src/lib/gee/amostragemBiofisica.ts:57-64 afirma o CONTRÁRIO, num docstring:
que a classificação espectral não define rótulo e serve só para triagem.
As duas coisas não podem ser verdade. A decisão do pesquisador é a Regra 4
estrita. Portanto:
  - D02 volta a "pendente", com a trava original (ficha KoboToolbox, Fase 0) e
    uma nota dizendo que o critério espectral foi movido, e para onde. O
    critério OBSERVACIONAL humano não foi definido ainda — e registrar uma
    regra espectral no lugar dele é o que criou a contradição;
  - crie o parâmetro operacional P10 — "Critério espectral de triagem de
    candidatos" — em PARAMETROS, com o par de limiares EXATAMENTE como está
    hoje, estado "proposta" (não "decidida": a referência disponível é o
    Compêndio autogerado), e o texto deixando explícito que P10 governa
    seleção de candidatos no mapa e NUNCA rotulagem;
  - D10 — "Limiar de NDVI para solo descoberto" — governa a frequência de solo
    exposto Ê, que é FEATURE, não rótulo. Hoje seu valor é "NDVI < 0.40
    combinado com BSI > 0.10", misturando o limiar de Ê com o par de triagem.
    Separe: D10 fica com o limiar de NDVI; a conjunção com BSI pertence a P10.
    O valor numérico não muda nesta sessão;
  - confira D03, D04, D06 e D11 pelo mesmo critério e relate se alguma outra
    decisão guarda, no campo de valor, algo que não corresponde ao seu título.

TAREFA 3.4 — A demarcação passa a ser teste, não comentário
O docstring de amostragemBiofisica.ts:57-64 está correto e precisa deixar de
ser só promessa. Toda verificação exige meta-teste (§18). Crie
src/lib/seguranca/circularidade.test.ts que FALHE se:
  - a saída de classificarPontoEspectral alcançar RotuloConsolidado.final,
    RotuloConsolidado.origens ou qualquer campo consumido pela projeção
    "matriz-treino" em src/lib/matriz/montagem.ts;
  - ClasseAmostral aparecer na lista de permissão de qualquer perfil cego ou
    do perfil matriz-treino em src/lib/matriz/perfis.ts.
Inclua o caso plantado: construa um ponto cujo rótulo foi preenchido a partir
de classificarPontoEspectral e confirme que o teste o detecta.

TAREFA 3.5 — Matriz de treino: NDVI e BSI separados, Fator C fora
Decisão (a) do pesquisador: "manter NDVI e BSI separados ao XGBoost e ele
constrói o produto se ele existir". Em src/lib/matriz/perfis.ts:
  - remova RUSLE_Fator_C (e demais fatores RUSLE, se presentes) da lista de
    permissão do perfil "matriz-treino". Sob Durigon puro, C é transformação
    monótona de NDVI: informação zero além do NDVI, e manter saída de modelo
    RUSLE como feature reabre a circularidade que o commit 575467f começou a
    fechar removendo rusle_perda_solo;
  - garanta que NDVI e BSI constem como variáveis SEPARADAS, sem nenhum termo
    de produto pré-calculado;
  - o perfil "planilha" continua podendo exibir os fatores RUSLE: ali eles são
    linha de base para comparação, não feature. Não confunda os dois perfis.
Confira o Invariante 2 contra a nova lista e acrescente teste que falhe se
Fator C voltar a entrar em matriz-treino.

TAREFA 3.6 — rusle.test.ts
rusle.test.ts:44-55 testa a híbrida como se fosse D01. Reclassifique esses
casos como testes de calcularFatorCSensibilidadeBsi, com o nome do describe
dizendo que é análise de sensibilidade. Os testes de D01 (linhas 30-39) ficam
como estão: eles já verificam Durigon puro e o domínio.
Acrescente teste que falhe se linhaDeBase.ts passar a chamar a variante com BSI.

TAREFA 3.7 — Documentação
Depois das tarefas acima, regenere DECISOES.md (npm run decisoes:md) e confira
que README.md e docs/design.md continuam coerentes. Eles já afirmam Durigon
puro — é o indício de que esta era a opção de menor entropia: de quatro fontes
de verdade, três já diziam Durigon. Corrija docs/design.md onde ele afirma
"guarda para n < 12 obs" nos harmônicos, contra D11 em src/config/decisoes.ts,
que diz 6. Verifique qual dos dois o código implementa
(src/lib/gee/harmonicos.ts) e alinhe o documento ao código, relatando a
divergência — NÃO mude o código para servir ao documento.

CRITÉRIOS DE ACEITE
- calcularFatorC tem um argumento obrigatório; nenhum default por ternário.
- O caminho de cálculo consulta exigirDecisao(DECISOES.D01).
- Nenhuma citação a "Metodologia PPGTCA 2026" permanece como ÚNICA referência
  de fórmula (as remanescentes estão listadas no relatório para a Sessão 5).
- D02 "pendente"; P10 criado como "proposta"; D10 sem a conjunção de BSI.
- circularidade.test.ts existe, com caso plantado, e passa.
- Fator C fora de matriz-treino; NDVI e BSI presentes e separados.
- DECISOES.md regenerado sem diff manual.
- Três verdes.

PROPOSTAS PARA O PESQUISADOR (prepare, não aprove)
- P10: alternativas de limiar com demonstração numérica sobre dado real, quando
  a Sessão 4 tiver dado real. Hoje, só a formalização e a referência pendente.
- D10: o limiar de NDVI para solo descoberto precisa de referência conferida e
  de análise de sensibilidade a +/- 0,05, como o próprio DECISOES.md já pedia.
```

---

# SESSÃO 4 — Ingestão orbital (provavelmente mais de uma sessão)

```
Leia antes: CLAUDE.md, Lei Fundamental Regras 6, 7 e 8 e §10 e §11,
src/lib/gee/auth.ts, src/app/api/gee/select-candidates/route.ts,
src/lib/gee/terreno.ts, src/lib/gee/serieTemporal.ts, src/lib/gee/harmonicos.ts.

CONTEXTO VERIFICADO
Não existe UMA chamada de computação ao Earth Engine em src/.
  - reduceRegion aparece só dentro de uma STRING de código exibida em
    src/components/audit/AuditDossierModal.tsx:101-102. Não é executada.
  - @google/earthengine está em package.json e NUNCA é importado (zero imports).
  - src/lib/gee/auth.ts só troca o JWT por um access_token e para ali.
  - chuva/chirps.ts, chuva/imerg.ts, gee/sentinel1.ts, gee/serieTemporal.ts,
    gee/terreno.ts e planet/dataApi.ts têm ZERO chamadas de rede: são funções
    puras aguardando dado que ninguém entrega.
  - só IBGE (localizacao/municipio.ts, 8 chamadas) e Embrapa
    (embrapaSoilClient.ts, 3 chamadas) fazem ingestão real.
São ÓRFÃOS — implementados, testados, e sem nenhum chamador em produção:
estatisticasSerie, sentinel1, eventos (e com ele chirps e imerg),
montagemTemporal (e com ele harmonicos e compostoSoloNu), paresEvento,
ordersApi, tiles (todo o subsistema PlanetScope), taxaErro, ingestaoKobo,
ingestaoInterpretacao (todo o pipeline de ingestão de rótulos).
Confirme esse mapa você mesmo antes de agir, e corrija-o no relatório se
divergir.

ESCOPO DESTA SESSÃO — proponha, não execute de uma vez
Não tente ligar tudo. Entregue, nesta ordem, e PARE ao fim de cada item para
relatar:
  4.1 Terreno pontual real: elevação e declividade do Copernicus DEM GLO30 via
      API REST do Earth Engine, usando o access_token que auth.ts já produz.
      Projeção EPSG:31982 (§10), função única em terreno.ts, guarda de
      plausibilidade [0, 75] graus. Arquive a evidência bruta em
      docs/verificacoes/AAAA-MM-DD_gee_reduceregion_dem.json e carimbe o selo
      "VERIFICADO AAAA-MM-DD — evidência: <arquivo>". Arquive também a
      demonstração numérica EPSG:3857 x EPSG:31982 em pontos reais que a §10
      exige.
  4.2 Série Sentinel-2 por ponto, com máscara preservada (Regra 7: nenhum
      unmask em banda física), alimentando serieTemporal e harmonicos.
  4.3 CHIRPS e IMERG, alimentando eventos.
Para CADA um: antes de integrar, execute o procedimento de 4 passos da Regra 8
(consultar capacidades, executar chamada real, arquivar resposta bruta sem
credencial, registrar o selo no código). Se não puder verificar, DIGA que não
verificou — não carimbe. Carimbar sem chamada é o defeito S1-02 do SAREL 1.
Só depois de 4.1 estar verde é que a recusa da Sessão 2.1 deixa de valer para
declividade e elevação.
Os órfãos de rotulagem (ingestaoKobo, ingestaoInterpretacao, taxaErro) dependem
de D02, que está pendente desde a Sessão 3. NÃO os ligue antes de D02.
O subsistema PlanetScope depende de D17, D18 e D19, pendentes. Não o ligue.
```

---

# SESSÃO 5 — Fundamentação bibliográfica

```
Pré-requisito: Sessões 0, 1, 2 e 3 concluídas. Antes delas, fundamentar é
escrever referência para alvo móvel: havia quatro fontes de verdade em
contradição, e decisões marcadas "decididas" divergiam do código que as
implementa.

TAREFA 5.1 — O Compêndio precisa virar texto versionado
docs/Compendio_Metodologico_SAREL_PPGTCA_2026.pdf existe SÓ como PDF binário,
e o texto metodológico está embutido em scripts/gerar_compendio_metodologico_pdf.py
(950 linhas). Consequências: não é revisável em diff, não é citável por linha,
e é a "referência" que o código invoca sobre si mesmo.
Migre o texto para docs/metodologia/COMPENDIO.md versionado, e faça o script
GERAR o PDF a partir do Markdown. Mesmo tratamento para
scripts/gerar_manual_pdf.py (1.248 linhas) e
scripts/gerar_relatorio_mudancas_pdf.py (651 linhas).

TAREFA 5.2 — Referência conferida para cada decisão
Para cada item abaixo, entregue PROPOSTA com alternativas da literatura,
referência conferida NA FONTE (obra, ano, seção/página) e demonstração
numérica quando a decisão admitir sensibilidade. Nenhuma passa a "decidida"
por sua mão (Regra 9).
  pendentes de valor:     D05, D07, D08, D09, D12, D13, D14, D15, D16, D17,
                          D18, D19, P06, P08
  pendentes de REFERÊNCIA (valor já em uso, citação circular hoje):
                          D02, D03, D04, D06, D10, D11, P10
  pendente de citação:    a limitação do SPD acrescentada a D01 na Sessão 3
D13, D14 e D15 travam a perda de solo RUSLE e são o caminho crítico da linha
de base. A Lei Fundamental já nomeia os candidatos a conferir:
Brown & Foster (1987) e Waltrick et al. (2015) para R; Moore & Burch (1986) e
Desmet & Govers (1996) para LS. Para K, a §12 registra o problema que a
proposta tem de resolver: a carta da Embrapa dá CLASSE, a RUSLE exige NÚMERO.
```

---

# SESSÃO 6 — Limpeza

```
Deliberadamente por último: é a fase que menos reduz risco científico, e fazê-la
antes consome atenção sem resolver nada do que reprova.

- Duplicatas idênticas por hash:
  Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf está na raiz E em
  docs/relatorios/ (mesmo hash); icon.png (296 KB) em assets/, public/ e
  src/app/; .ico nos mesmos três lugares. Mantenha um de cada, no lugar que o
  Next.js exige, e avalie se assets/ ainda tem função.
- Raiz: 2 PDFs, 1 PPTX e 3 .bat. O .pptx é artefato GERADO versionado como
  fonte — decida com o pesquisador se sai do versionamento ou se migra para
  docs/, e documente a escolha.
- Dependências declaradas e não importadas em src/: canvas-confetti, clsx,
  jspdf, papaparse, zod, tailwind-merge, @google/earthengine. Antes de remover,
  confira caso a caso: @google/earthengine pode voltar a ser necessário depois
  da Sessão 4; zod e jspdf estão no stack previsto pela Lei Fundamental §5 e a
  ausência de uso indica FEATURE FALTANDO (validação de schema e dossiê em PDF),
  não dependência sobrando. Relate a distinção; remova só o que for realmente
  morto. xmlhttprequest é dependência de @google/earthengine — declará-la
  explicitamente é redundante, não errado.
- requirements.txt usa >= em todas as linhas. Para dissertação, fixe com == e
  gere lockfile (pip freeze ou pip-compile). Registre a versão de Python usada.
- docs/legado/ mantém design.md, README.md e manuais do sistema antigo
  misturados à documentação viva. Avalie mover para fora de docs/ ou marcar o
  diretório como histórico, de forma que nenhum leitor confunda com doc atual.
- Acrescente LICENSE (pergunte ao pesquisador qual) e CONTRIBUTING.md curto
  apontando para CLAUDE.md.
```

---

## Rastreio deste documento

| Sessão | Objetivo | Bloqueia |
|---|---|---|
| 0 | Fonte única de verdade documental | 1, 2, 3 |
| 1 | Verde confiável, CI, varredor com alcance | 2 |
| 2 | Defeitos de Lei Fundamental vivos no código | 4 |
| 3 | Decisões (a) e (b) de 06/11/2026 implementadas | 4, 5 |
| 4 | Ingestão orbital real | 5 |
| 5 | Fundamentação bibliográfica | — |
| 6 | Higiene | — |
