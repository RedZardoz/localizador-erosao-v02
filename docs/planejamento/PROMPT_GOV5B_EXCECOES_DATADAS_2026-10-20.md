# Prompt do agente executor — GOV-5b: exceções datadas para devolver a suíte ao verde

**Para quem é.** O mesmo agente executor que rodou GOV-1 a GOV-6. Este é um bloco único, pequeno e cirúrgico.

**Estado: NÃO EXECUTADO.**

**Branch de trabalho:** `sarel/executor-2026-10-09`. Um commit **local**. **Sem push, sem PR, sem tag.**

**Base verificada:** `e435948`, medido em 20/10/2026 num clone limpo com dependências instaladas.

---

## 1. Situação, e por que este bloco existe

O bloco GOV-5 fez a coisa certa: implementou o padrão `default-numerico-desestruturacao`, o detector capturou **8 ocorrências** da Classe (ii) — científico e **não** registrado — e o executor **parou** em vez de conceder exceção a parâmetro científico. Essa parada foi correta e não deve ser revertida.

A consequência é que o commit `4deb7ed` deixou a suíte **vermelha**:

```
FAIL src/lib/seguranca/padroesProibidos.test.ts
  > nenhum arquivo em src/lib, src/app/api, src/store ou src/config
    deve conter padrões proibidos
Tests  1 failed | 673 passed (674)
```

As 8 ocorrências:

```
src/lib/gee/estatisticasSerie.ts:57          nMinimo = 3
src/lib/matriz/montagemTemporal.ts:109       intervaloGuardaMeses = 24,
src/lib/matriz/montagemTemporal.ts:110       duracaoJanelaAnos = 3,
src/app/api/gee/select-candidates/route.ts:188  tamanhoAmostra = 50,
src/app/api/gee/select-candidates/route.ts:189  raioThinningKm = 5.0,
src/app/api/gee/select-candidates/route.ts:190  frequenciaSoloNuMin = 0.15,
src/app/api/gee/select-candidates/route.ts:191  declividadeMin = 3.0,
src/app/api/gee/select-candidates/route.ts:192  declividadeMax = 20.0,
```

**O detector está certo; o código é que viola a Regra 1.** A solução definitiva é DP-24 — registrar cada número como parâmetro e roteá-lo por `exigirParametro`. Isso é decisão do pesquisador e **não é tarefa deste bloco**.

### Por que não simplesmente deixar vermelho

Porque suíte permanentemente vermelha ensina a equipe a ignorar vermelho, e é assim que guarda morre. Passa a existir "o vermelho conhecido", e o próximo vermelho real se esconde atrás dele. Este bloco devolve o verde **declarando a dívida no código**, não na cabeça de alguém — e instala a trava que impede a exceção de virar permanente.

---

## 2. O prompt (copie o bloco inteiro)

```
Você é o EXECUTOR do repositório SAREL v2 (PPGTCA 2026). Trabalhe SOMENTE no que
está escrito. Faltou informação: PARE e relate; nunca preencha lacuna com suposição.

════════════════════════════════════════════════════════════════════════════════════
1. REGRAS INVIOLÁVEIS
════════════════════════════════════════════════════════════════════════════════════
R1.  Faça apenas o que este bloco descreve. Achou outro problema: registre, não conserte.
R2.  Antes de editar: rode o comando REPRODUZIR e cole a saída. Diferiu do esperado: PARE.
R3.  Reabra cada âncora (arquivo:linha) antes de editar; linhas se deslocam.
R4.  Você NÃO decide metodologia. A que decisão cada número pertence é DP-24, do
     pesquisador. Este bloco NÃO registra parâmetro e NÃO chama exigirParametro.
R5.  Nunca escreva "passa" ou "verde" sem a saída do comando, da MESMA sessão.
R6.  Proibido pular, desativar ou quarentenar teste para obter verde.
R7.  PROIBIDO ALTERAR QUALQUER VALOR NUMÉRICO. Os 8 números ficam exatamente como
     estão. Este bloco mexe em metadados de exceção, não em código científico.
R8.  Proibido: push, PR, tag; reescrever histórico; tocar em legado/pre_sarel/;
     consumir cota PlanetScope; criar tarefa no Earth Engine; rodar com credencial real.
R9.  Um commit LOCAL, mensagem iniciando por "GOV-5b:". Antes dele: npm run typecheck
     e a suíte inteira.
R10. Comandos portáveis para Windows/PowerShell: git grep e node, nunca grep, sed ou
     python3 (use python). Cole a saída literal, sem "...".

════════════════════════════════════════════════════════════════════════════════════
2. BLOCO GOV-5b — exceções datadas, temporárias e autodenunciantes
════════════════════════════════════════════════════════════════════════════════════

REPRODUZIR:
  npm test src/lib/seguranca/padroesProibidos.test.ts

ESPERADO HOJE: 1 teste falhando, com as 8 ocorrências de
"default-numerico-desestruturacao" listadas (5 em route.ts, 2 em montagemTemporal.ts,
1 em estatisticasSerie.ts). Se o número for diferente de 8, PARE e relate.

AÇÃO (a) — acrescentar 8 entradas a LISTA_EXCECOES_AUTORIZADAS, uma por ocorrência.
  Cada entrada segue a forma já existente no arquivo e obedece a TODAS estas regras:

  - `id` começa por "EXC-DP24-PENDENTE-" seguido do módulo e do nome do parâmetro.
    Exemplo: "EXC-DP24-PENDENTE-ROUTE-TAMANHO-AMOSTRA".
    O id precisa anunciar que é temporário já na leitura, sem abrir a justificativa.
  - `justificativa` diz, nesta ordem: que o parâmetro é científico e NÃO está
    registrado; que a atribuição a decisão depende de DP-24; e a data de abertura
    da dívida, "20/10/2026". Não escreva justificativa que faça o número parecer
    legítimo: ele não é. A exceção suspende o alarme, não absolve o código.
  - `autorizadoPor`: "GOV-5b / DP-24 pendente desde 20/10/2026".
  - `padrao`: "default-numerico-desestruturacao".
  - `trecho`: o texto exato da linha, copiado do arquivo.

AÇÃO (b) — acrescentar o teste que impede a exceção de virar permanente.
  Hoje não existe nenhum: uma exceção cuja linha-alvo desaparece fica no arquivo
  para sempre, e ninguém percebe. Acrescente, no mesmo arquivo de teste, um caso que:

  1. percorre LISTA_EXCECOES_AUTORIZADAS;
  2. para cada entrada, abre o arquivo que ela cita e verifica se alguma linha ainda
     contém o seu `trecho`;
  3. reprova listando as entradas OBSOLETAS, com a mensagem de que a exceção deve ser
     REMOVIDA porque o código que ela isentava não existe mais.

  Efeito pretendido: quando DP-24 for decidido e os 8 defaults passarem a ser lidos
  por exigirParametro, estas 8 entradas deixam de casar e o teste reprova, exigindo a
  limpeza. A exceção se autodenuncia ao envelhecer, em vez de apodrecer em silêncio.

  Se alguma entrada JÁ EXISTENTE na lista aparecer como obsoleta ao rodar este teste
  novo, NÃO a remova: registre no relatório e PARE nesse item. Exceção antiga obsoleta
  é achado para o pesquisador, não limpeza de passagem (R1).

PROIBIDO:
  - registrar qualquer um dos 8 como parâmetro, ou roteá-lo por exigirParametro (R4);
  - alterar valor (R7);
  - usar o marcador "// permitido:" no código-fonte em vez da lista de exceções: o
    marcador some do radar; a lista é inventário auditável, com id e autoria;
  - acrescentar exceção para qualquer ocorrência fora das 8 listadas.

ACEITE (cole as três saídas):
  1. npm test src/lib/seguranca/padroesProibidos.test.ts  -> verde, com o teste novo
     de exceções obsoletas incluído na contagem.
  2. npm test  -> suíte INTEIRA verde, com contagem IGUAL OU MAIOR que 674 testes
     (baseline de e435948: 674, sendo 1 falhando). Menor que isso significa teste
     perdido pelo caminho: PARE e relate (R6).
  3. git diff --stat  -> deve tocar APENAS
     src/lib/seguranca/padroesProibidos.test.ts. Qualquer outro arquivo no diff
     significa que o bloco saiu do escopo: PARE.

════════════════════════════════════════════════════════════════════════════════════
3. RELATÓRIO FINAL
════════════════════════════════════════════════════════════════════════════════════
Escreva docs/planejamento/RELATO_GOV5B_2026-10-20.md com:
  - a saída do REPRODUZIR, colada;
  - as 8 entradas criadas, com id e justificativa;
  - o teste novo e o que ele reprova;
  - as três saídas do aceite;
  - a dívida declarada: as 8 exceções são TEMPORÁRIAS e morrem quando DP-24 for
    decidido; enquanto existirem, a Regra 1 está suspensa nesses 8 pontos e isso é
    conhecido, não esquecido;
  - qualquer item em que você PAROU, e por quê.
```

---

## 3. Antes de entregar ao executor

1. Isto **não substitui DP-24**. Suspende o alarme para que o CI do GOV-6 possa ser ligado; a dívida continua. Decidido o DP-24, as 8 exceções devem ser removidas — e o teste novo vai cobrar isso.
2. **GOV-6 continua bloqueado por C28** mesmo depois deste bloco. São duas travas distintas: a suíte vermelha (que este bloco resolve) e os 2 warnings de lint (que só C28 resolve).
3. Se preferir decidir DP-24 esta semana, **não rode este bloco**: registrar os 8 de uma vez é mais limpo do que criar 8 exceções para removê-las em seguida.
