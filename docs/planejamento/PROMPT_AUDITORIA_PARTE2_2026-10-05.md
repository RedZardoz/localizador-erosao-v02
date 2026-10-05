# Prompt de auditoria do SAREL v2 — Parte 2 de 2 (má interpretação e prompt de correção)

Execute só depois de revisar `docs/auditorias/AUDITORIA_PARTE1_2026-10-05.md`. Esta parte audita D1..D8 (indícios de má interpretação) e gera o prompt de correção. Origem: ver PROMPT_AUDITORIA_HONESTA_2026-10-05.md.

```
Você é auditor do repositório SAREL v2 (branch sarel/v2). Esta é a PARTE 2 de 2 da auditoria.
Sua tarefa é auditar, não corrigir. Você não edita nenhum arquivo do código, dos dados nem
dos relatórios existentes. Você só cria DOIS arquivos novos no repositório:
  - docs/auditorias/AUDITORIA_PARTE2_2026-10-05.md
  - docs/planejamento/PROMPT_CORRECAO_POS_AUDITORIA_2026-10-05.md
Para as execuções de teste (D1) você pode usar um diretório temporário FORA do repositório;
ver MATERIAL DE TESTE.

PERGUNTA DA PARTE 2: existe algo no repositório que induza a MÁ INTERPRETAÇÃO e, por isso,
a mau funcionamento ou a conclusão errada: resultado que parece achado e é artefato, nome
que diz uma coisa e o código faz outra, documento defasado, dado sintético ou contaminado
em local de dado real? Cada indício vira achado, mesmo que o código esteja tecnicamente
correto. Depois, transformar todos os achados das duas partes em um prompt de correção.

ENTRADA: docs/auditorias/AUDITORIA_PARTE1_2026-10-05.md. Leia-o inteiro. NÃO herde suas
conclusões: ele foi escrito por outro agente, e relatórios de agentes costumam errar em
detalhes plausíveis. Reconfira com comando e saída cada achado que você levar ao prompt de
correção (em especial arquivo:linha, que muda entre commits). Se refutar um achado da
PARTE 1, registre a refutação em vez de apagá-lo. Se o relatório da PARTE 1 não existir, ou
o commit auditado nele for diferente do HEAD atual, pare e avise; não improvise.

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

Etapa 0 — Estado base e conferência da PARTE 1.
  git status; git log --oneline -5; hash completo do HEAD; compare com o commit declarado
  na PARTE 1. Liste os achados A01..An da PARTE 1 com a gravidade que ela deu.

Etapa 1 — Bloco D (abaixo). Comece pelos "Pontos para a PARTE 2" que a PARTE 1 listou.

BLOCO D — INDÍCIOS DE MÁ INTERPRETAÇÃO E DE MAU FUNCIONAMENTO

Registre qualquer indício, mesmo que o código não esteja "errado". Procure ativamente:

D1. Resultado que parece achado e é artefato: relatórios, imagens, JSON e tabelas
  gerados por dry-run, mock ou dado sintético que estão em pastas de resultado sem
  marca visível (nome do arquivo, cabeçalho da imagem, legenda). Verifique todos os
  arquivos em docs/relatorios/ e pastas semelhantes, não só o de modelagem. Para cada
  um: tem selo de natureza (real / dry-run / sintético) legível por quem só vê o
  arquivo, sem abrir o script?
D2. Nome que mente: variáveis, colunas, perfis, funções ou arquivos cujo nome sugere
  uma coisa e o código faz outra (ex.: "perda_solo" que é sorteio uniforme; "controle"
  que é sintético; "validação" que não separa conjunto independente).
D3. Comentário ou documento defasado em relação ao código: README, DECISOES.md,
  decisoes.ts, comentários "permitido:", cabeçalhos de script, textos de relatório.
  Liste o par (afirmação, o que o código faz).
D4. Estado ambíguo de decisão: decisão marcada como decidida cujo código ainda segue
  a regra antiga, ou pendente cujo código já assumiu um lado.
D5. Falhas silenciosas: try/except que engole erro, retornos vazios tratados como
  sucesso, "indisponível" que vira 0 ou média mais adiante, filtros que descartam
  linhas sem registrar a contagem, warnings ignorados, testes que só verificam que não
  lançou exceção.
D6. Contaminação entre função e dado: dado de teste, fixture, exemplo ou sintético
  versionado em pastas que o app ou o treino leem como dado real; caminho padrão
  (default) de script apontando para dados de exemplo; flags (dry-run) cujo estado
  padrão não seja o mais seguro.
D7. Unidades, escalas e sistemas de referência: mistura de % e graus, metros e
  graus, CRS não declarado, janelas de data sem fuso, índices (NDVI, BSI) sem faixa
  validada, valores acima do intervalo físico.
D8. Cópias e versões duplicadas da mesma lógica (TypeScript e Python, legado e novo)
  que possam divergir. Se houver, diga qual delas é a que o fluxo realmente usa.


MATERIAL DE TESTE (vale para D1; o pesquisador autorizou a execução, com estas travas):
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
  - O dry-run do treinar_xgboost_loco.py só deve ser executado se D1 precisar dele, e com saída redirecionada
    ao diretório temporário, nunca sobrescrevendo docs/relatorios/modelagem/. Confira
    com hash (Get-FileHash) antes e depois que os arquivos existentes não mudaram.


Etapa 2 — Relatório. Estrutura obrigatória de docs/auditorias/AUDITORIA_PARTE2_2026-10-05.md:
  1. Commit auditado e conferência com a PARTE 1.
  2. D1..D8: conclusão (CONFIRMADO / REFUTADO / PARCIAL / NÃO VERIFICADO), evidência,
     gravidade. Identificadores novos a partir do último usado na PARTE 1.
  3. Reconferência dos achados da PARTE 1 que vão ao prompt de correção: cada um com
     veredicto (mantido / refutado / alterado) e evidência desta sessão.
  4. "O que eu não consegui verificar e por quê".
  5. "Onde eu posso ter errado".
  6. "Material de teste": o que criou, onde, e a prova de que foi apagado.
  7. Nenhuma correção aplicada.

Etapa 3 — Prompt de correção. Gere docs/planejamento/PROMPT_CORRECAO_POS_AUDITORIA_2026-10-05.md
para outro agente executar depois que o pesquisador revisar. Regras de elaboração:
  - Um bloco por achado (A01, A02...) das DUAS partes, na ordem de dependência: primeiro o
    que bloqueia a função, depois o que induz má interpretação, depois o cosmético.
  - Cada bloco traz: o achado (com arquivo:linha e commit), como REPRODUZIR o defeito ANTES
    de editar (comando e saída esperada hoje), a mudança pretendida em texto (sem código
    pronto), as âncoras (arquivo:linha) conferidas abrindo o arquivo, e um aceite
    falsificável: o comando que antes falha e depois passa, ou a saída que muda, mais o
    teste de regressão a criar.
  - Achados que dependem de decisão metodológica (D02, D03, D13, D14, D15, divergências de
    C6) NÃO entram como correção: entram na seção "Decisões que só o pesquisador pode
    tomar", com as opções e a consequência de cada uma, sem recomendar a de sua preferência
    como se fosse técnica.
  - Achados NÃO VERIFICADOS entram numa seção própria, como "verificar antes de corrigir".
  - Termine o prompt com a instrução ao executor de relatar também o que NÃO fez, o que
    falhou e o que não verificou, e de não afirmar "corrigido" sem saída colada.
  - Não execute o prompt de correção, nem parcialmente.

CRITÉRIOS DE ACEITE (falsificáveis):
  - Todo achado tem arquivo:linha ou comando+saída, conferidos abrindo o arquivo.
  - `git status --porcelain` ao final mostra somente os dois arquivos novos (mais a pasta
    docs/auditorias, se nova); hashes dos relatórios de modelagem existentes iguais antes
    e depois.
  - Cada achado das duas partes aparece no prompt de correção (como correção, decisão do
    pesquisador ou "verificar antes de corrigir"); nenhum fica sem destino. Mostre a
    tabela de rastreio achado → destino.
  - As seções 4 e 5 do relatório estão preenchidas.
  - O diretório temporário foi apagado e a prova está no relatório.
  - Nenhum dado de teste foi citado como evidência científica.
  - Nenhuma frase afirma que algo "passa", "está correto" ou "foi corrigido" sem saída
    colada da mesma sessão.
  - Nenhum commit, push, merge ou rebase. Você entrega os dois arquivos e para.
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
