# Prompt de auditoria do SAREL v2 — Parte 1 de 2 (função e hipóteses)

Execute esta parte primeiro. Ela audita B1..B7 (hipóteses) e C1..C7 (aptidão para a função). Quando terminar, revise o relatório antes de liberar a PARTE 2. Origem e conferências prévias: ver PROMPT_AUDITORIA_HONESTA_2026-10-05.md.

```
Você é auditor do repositório SAREL v2 (branch sarel/v2). Esta é a PARTE 1 de 2 da auditoria.
Sua tarefa é auditar, não corrigir. Você não edita nenhum arquivo do código, dos dados nem
dos relatórios existentes. Você só cria UM arquivo novo no repositório:
  - docs/auditorias/AUDITORIA_PARTE1_2026-10-05.md
A PARTE 2 (indícios de má interpretação e prompt de correção) é feita depois, por outra
execução, a partir do seu relatório. Por isso, tudo o que você escrever precisa ser
verificável por quem não viu sua sessão. Para as execuções de teste (C2, C3, C5) você pode
usar um diretório temporário FORA do repositório; ver MATERIAL DE TESTE.

PERGUNTA DA PARTE 1: o programa cumpre a função para a qual foi proposto (localizar,
amostrar, rotular e montar matriz de treino auditável, de ponta a ponta)? Ele não precisa
validar o método científico com dados reais; precisa mostrar, por evidência, o que funciona,
o que só foi implementado e o que não existe. Hipóteses específicas estão em B1..B7.

REGRA-MÃE: relate o que você mediu, separado do que você leu e do que você supôs.
Um achado ruim bem documentado vale mais do que um repositório "aprovado" sem prova.
Se algo falhar, diga que falhou e cole a saída. Se você não conseguiu verificar, escreva
"NÃO VERIFICADO" e o motivo. Nunca escreva "verificado", "passa" ou "limpo" sem ter
rodado o comando nesta sessão e colado a saída.

CONTEXTO QUE RECEBI DE OUTRO AGENTE — TRATE COMO HIPÓTESE, NÃO COMO FATO:
Um relatório anterior (Sonnet 5.5) descreveu o repositório. Já verifiquei três
afirmações dele: duas estavam erradas (disse que o HEAD era o merge do PR #2; o HEAD é
fd613e3. Disse que node_modules não existia; existe). Portanto esse relatório erra em
detalhes que parecem plausíveis. Não herde nenhuma afirmação dele sem conferir. Se você
confirmar algo que ele disse, confirme com comando e saída. Se refutar, registre a
refutação.


ORDEM DE TRABALHO (cada etapa só começa depois de colar a saída da anterior):

Etapa 0 — Estado base, sem editar.
  git status; git log --oneline -10; git log --merges --oneline -5; node --version;
  existência de node_modules e de package-lock.json; versão do Python e das libs
  importadas por scripts/*.py (xgboost, shap, sklearn, pandas...), se instaladas.
  Registre o commit exato auditado (hash completo). Tudo que você afirmar vale para
  esse hash.

Etapa 1 — Rodar o que existe e relatar o resultado cru.
  npm run (liste os scripts de package.json e rode os de teste, typecheck, lint e build).
  Para cada um: comando, código de saída, contagem de testes passados/falhados/pulados
  e as primeiras 30 linhas de qualquer falha. Se um comando não rodar por falta de
  dependência ou de credencial (Google Earth Engine, Planet), diga qual e pare nele,
  sem contornar. Testes pulados (skip, todo, only) são achados: liste-os.
  Se tudo passar, isso NÃO prova que o método está certo; só prova que os testes que
  existem passam. Diga isso na conclusão.

Etapa 2 — Verificar cada hipótese abaixo, uma por vez, com prova.

B1. RUSLE como preditor no treino (hipótese: circularidade e contradição interna).
  O pesquisador decidiu que RUSLE é linha de base a ser comparada, não preditor.
  Confira: (a) scripts/treinar_xgboost_loco.py linhas ~20, 351, 389-417, 578-580:
  quais colunas entram em X? (b) o README e DECISOES.md/decisoes.ts dizem o quê sobre
  fatores R, K, LS e sobre usar RUSLE como preditor? (c) o commit 575467f removeu a
  perda RUSLE só do lado TypeScript (src/lib/matriz/montagem.ts e perfis.ts), então o
  script Python ficou defasado em relação à matriz que ele deveria consumir? Mostre as
  linhas e diga: contradição confirmada, refutada ou parcial. Se confirmada, estime em
  texto (sem rodar nada novo) o que isso implica para a hipótese central da dissertação.

B2. Dry-run e artefatos (hipótese: resultado perfeito é artefato e pode vazar para a dissertação).
  (a) Leia scripts/treinar_xgboost_loco.py ~linhas 300-360 e diga exatamente quais
  atributos da classe 0 são sintéticos e como a classe 1 é montada. (b) Explique por que
  AUC = 1,0 é esperado nessa construção (as duas classes saem de distribuições
  diferentes por construção?), com os intervalos de np.random.uniform. (c) Procure no
  repositório inteiro (docs/, README, apresentações, .md, .tex, .docx, .pptx, .html)
  qualquer menção às imagens ROC/SHAP/matriz_confusao desse relatório, ou aos números
  1,0 / 1.000 dele, fora da pasta docs/relatorios/modelagem. Liste cada ocorrência
  com caminho:linha, ou diga "nenhuma ocorrência encontrada" e o comando de busca usado.
  (d) Os PNGs trazem marca d'água ou legenda de dry-run? Abra e descreva. (e) As guardas
  em src/lib/seguranca/ cobrem scripts Python, ou só TypeScript? Prove com o
  teste/regra que cobre (ou não) o `np.random.uniform` de scripts/. Uma guarda que só
  olha para src/ e deixa passar dados sintéticos em scripts/ é um achado.
  (f) O comentário "permitido: geracao explicita de benchmark... flag dry-run" é só
  texto? Mostre o código que realmente barra a execução sem a flag.

B3. Texto do relatório de modelagem com caracteres corrompidos.
  O JSON mostra "�" em "PPGTCA 2026 � XGBoost", "Iguaçu", "Ivaí", "Litorânea",
  "dissertação". Verifique a codificação real do arquivo (bytes), se o problema está no
  arquivo ou só na sua leitura, e qual linha do script grava sem encoding='utf-8'
  ou com ensure_ascii inadequado. Registre apenas; não corrija.

B4. Decisões e estado dos rótulos.
  Liste todas as decisões de src/config/decisoes.ts com id e estado (decidida,
  pendente...). Cruze com docs/planejamento/DECISOES.md: há alguma divergência de
  estado entre os dois? Em especial D02, D03, D13, D14, D15 e D26.
  Responda: a descrição "rótulos vêm de campo, fotointerpretação de PlanetScope e
  drone" ainda vale depois de D26? Cite o trecho que sustenta cada lado.
  Você não decide nada: só o pesquisador marca decisões. Se achar o código fazendo
  uma escolha metodológica que deveria ser decisão, registre como achado.

B5. As 9 Regras Invioláveis, conferidas por busca, não por leitura de README.
  Procure no código e nos scripts (excluindo legado/pre_sarel/, testes e fixtures
  declaradas) por: `?? 0`, `|| 0`, `fillna(0)`, `np.random`, `Math.random`,
  `faker`, constantes numéricas soltas sem selo de proveniência. Para cada ocorrência
  suspeita: arquivo:linha, trecho, e classificação (viola / justificada / só teste).
  Mostre o comando usado e a contagem total, para que se saiba que a busca foi
  exaustiva e não amostral.

B6. Dados pessoais (LGPD).
  Há dados fundiários reais (SIGEF, SNCR, SICAR) versionados no git, em data/, docs/,
  fixtures de teste ou nas imagens/relatórios? CPF, CNPJ, nome de proprietário,
  matrícula? Rode git ls-files para as pastas de dados e git grep por padrões de CPF
  (\d{3}\.\d{3}\.\d{3}-\d{2}) e CNPJ. Liste só caminhos e contagens; não cole dados
  pessoais no relatório.

B7. Segredos.
  git grep por tokens/chaves (PLANET, API_KEY, service account, .json de credencial
  do Earth Engine, KoboToolbox token) e verifique .gitignore. Reporte caminho e tipo,
  nunca o valor.

MATERIAL DE TESTE (vale para C2, C3 e C5; o pesquisador autorizou a execução, com estas travas):
  - Dado de teste só pode ser criado em diretório temporário fora do repositório
    (informe o caminho). Nunca em data/, docs/, src/, scripts/, nem versionado.
  - Todo arquivo de teste leva "SINTETICO_TESTE_ENCANAMENTO" no nome e no conteúdo
    (coluna, campo ou cabeçalho), para que ninguém o confunda com dado real.
  - Nenhum resultado produzido com dado de teste (AUC, acurácia, SHAP, mapa, contagem)
    pode ser citado como evidência científica. Ele prova no máximo que o encanamento
    liga, e o relatório deve dizer isso na mesma frase em que o citar.
  - Ao terminar, apague o diretório temporário e prove: ls do caminho ("não existe")
    e `git status --porcelain` sem arquivo novo além dos dois documentos.
  - Se para rodar algo você precisaria gerar dado que imite dado real (coordenadas de
    propriedade, polígonos de erosão plausíveis, rótulos), pare e registre como
    "NÃO VERIFICADO: exigiria dado realista". Prefira entradas mínimas e obviamente
    artificiais (ex.: 4 linhas com valores 1, 2, 3, 4).
  - O dry-run do treinar_xgboost_loco.py pode ser executado, mas com saída redirecionada
    ao diretório temporário, nunca sobrescrevendo docs/relatorios/modelagem/. Confira
    com hash (Get-FileHash) antes e depois que os arquivos existentes não mudaram.


BLOCO C — APTIDÃO PARA A FUNÇÃO (o programa faz o que se propõe?)

C1. Mapa de ponta a ponta. Para cada etapa (região e candidatos → estratificação em 18
  estratos e thinning → série temporal e biofísica → pares T−/T0/T+ → cotas Planet →
  campanha e rótulos → RUSLE linha de base → matriz e invariantes → exportação por
  perfil → treino LOCO/SHAP), informe: módulo que a implementa (caminho), o que recebe,
  o que entrega, e qual teste cobre a passagem à etapa seguinte. Marque cada elo como
  CONECTADO E TESTADO, CONECTADO SEM TESTE, DESCONECTADO ou NÃO IMPLEMENTADO. Não
  aceite "está no README" como prova de que existe.

C2. Encanamento com entrada mínima. Com entrada artificial mínima (regras acima), exercite
  o trecho que for possível sem Earth Engine nem Planet: ex.: matriz → invariantes →
  exportação em cada perfil. Relate o que entrou, o que saiu e o que foi recusado.

C3. Barreiras que bloqueiam de fato. Para cada um dos 7 invariantes e para o bloqueio de
  Kappa < 0,60, entregue um caso inválido e mostre a recusa (ou prove que ela não
  ocorre). Se só existir teste do caso feliz, é achado. Verifique também o mascaramento
  LGPD: algum perfil exporta campo fundiário sem máscara?

C4. Vazamento de rótulo e de teste. Os perfis cegos (planilha, interpretacao-cega,
  campo-cego, voo-cego, matriz-treino) realmente omitem o que prometem? Algum perfil
  de treino carrega rótulo, dado dos voos (conjunto de teste independente), identificador
  que permita reconstruir o rótulo, ou coluna derivada do alvo? Mostre as colunas de cada
  perfil e justifique.

C5. Elo matriz → modelo. O que o app exporta (perfil matriz-treino) é exatamente o que
  scripts/treinar_xgboost_loco.py consome? Compare nomes de colunas, tipos, unidade,
  presença do alvo e da macrobacia usada no LOCO. Responda em uma frase: "o treino
  consome a saída do app" SIM / NÃO / PARCIAL, com a evidência. Se NÃO, é o achado de
  maior gravidade da auditoria.

C6. Fidelidade ao método declarado. Compare o que o código faz com as decisões
  vigentes (D02, D03, D24, D25, D26 e as que governam alvo, métrica e linha de base).
  Ex.: D26 fixa alvo contínuo, reg:tweedie e Spearman como métrica primária; o script
  atual usa Classe_Alvo_Binaria e acurácia/AUC? Registre cada divergência com
  decisão (trecho) e código (arquivo:linha). Você não decide qual lado está certo.

C7. Tabela final "função proposta → estado", com exatamente estes quatro valores:
  FUNCIONA E FOI DEMONSTRADO / IMPLEMENTADO MAS NÃO DEMONSTRADO / NÃO IMPLEMENTADO /
  BLOQUEADO POR DECISÃO OU DADO EXTERNO. Para "FUNCIONA E FOI DEMONSTRADO" exija
  evidência executada nesta sessão. Escreva que nenhuma etapa que depende de GEE,
  Planet, campo ou voo reais foi validada cientificamente; isso fica fora do alcance
  de uma auditoria de código.


Etapa 3 — Relatório. Estrutura obrigatória de docs/auditorias/AUDITORIA_PARTE1_2026-10-05.md:
  1. Commit auditado (hash completo) e saídas do estado base.
  2. Resultado cru das execuções (Etapa 1), incluindo falhas e skips.
  3. Para B1..B7 e C1..C6: conclusão (CONFIRMADO / REFUTADO / PARCIAL / NÃO VERIFICADO),
     evidência (comando + saída ou arquivo:linha) e gravidade (bloqueia a função /
     bloqueia a dissertação / precisa de decisão do pesquisador / induz má interpretação /
     cosmético). Identificadores estáveis A01, A02... (a PARTE 2 continuará a numeração
     a partir de onde você parar; informe o último usado).
  4. Tabela C7 "função proposta → estado".
  5. Tabela "Afirmações do relatório do Sonnet 5.5": cada afirmação, veredicto, evidência.
     Inclua as duas já refutadas (HEAD e node_modules).
  6. "O que eu não consegui verificar e por quê".
  7. "Onde eu posso ter errado": suposições em que sua conclusão depende de ter lido certo
     e como o pesquisador pode conferir.
  8. "Material de teste": o que você criou, onde, e a prova de que foi apagado.
  9. "Pontos para a PARTE 2": qualquer indício de má interpretação que você notou de
     passagem (nomes enganosos, documento defasado, resultado sem selo), sem investigar
     a fundo; a PARTE 2 faz isso.
  10. Nenhuma correção aplicada e nenhum prompt de correção: isso é da PARTE 2.

CRITÉRIOS DE ACEITE (falsificáveis):
  - Todo achado tem arquivo:linha ou comando+saída; os números de linha foram conferidos
    abrindo o arquivo, não lembrados.
  - `git status --porcelain` ao final mostra somente o relatório novo (e a pasta
    docs/auditorias se for nova); hashes dos relatórios de modelagem existentes iguais
    antes e depois.
  - As seções 6 e 7 estão preenchidas; se vazias, o relatório é rejeitado, porque ninguém
    verifica tudo.
  - A tabela C7 existe, e toda linha "FUNCIONA E FOI DEMONSTRADO" cita evidência executada.
  - O diretório temporário foi apagado e a prova está no relatório.
  - Nenhum dado de teste foi citado como evidência científica.
  - Nenhuma frase afirma que algo "passa", "está correto" ou "foi corrigido" sem saída
    colada da mesma sessão.
  - Nenhum commit, push, merge ou rebase. Você entrega o arquivo e para.
  - Não assine nada nem preencha docs/PROVENIENCIA_ASSISTENCIA_IA.md.

PROIBIDO:
  - Corrigir "de passagem" um problema que encontrou.
  - Apagar, mover ou renomear o relatório de dry-run ou suas imagens.
  - Tocar em legado/pre_sarel/ e na tag legado-pre-sarel.
  - Escrever que o repositório está "pronto", "limpo" ou "robusto" como veredicto geral.
  - Criar dado de teste dentro do repositório ou que imite dado real.
  - Deixar saída de dry-run em docs/relatorios/ ou em qualquer pasta de resultado.
  - Rodar comandos que consumam cota PlanetScope ou criem tarefas no Earth Engine.
```
