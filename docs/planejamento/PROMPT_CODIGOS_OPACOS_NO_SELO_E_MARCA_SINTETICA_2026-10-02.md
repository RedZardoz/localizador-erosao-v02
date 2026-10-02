# Prompt de Execução — Códigos opacos no selo, e marca de sintético nos artefatos irmãos

**Data:** 02/10/2026
**Natureza:** três itens pequenos e bem delimitados. **Nenhum é urgente hoje; os três são obrigatórios antes do sorteio real**, porque depois dele não há como refazer.
**Origem:** observação do pesquisador sobre o manifesto do intérprete mudando por inteiro entre execuções.

---

# PARTE 0 — O QUE FOI OBSERVADO

Uma execução da exportação produziu **72 inserções e 72 deleções** em
`docs/verificacoes/voo_ncontrol/manifesto_interprete_cego_72poligonos.csv`: todos os códigos
opacos mudaram — `VANT-BLIND-02520E0C32` virou `VANT-BLIND-040E68FFC0`, e assim os 72.

**Isso é a correção Z5 funcionando como especificada.** Sem a chave do pesquisador, os códigos
nascem de entropia nova, logo não são reproduzíveis a partir do repositório. O requisito está
cumprido.

Mas revela que os códigos são **efêmeros**, e isso é incompatível com o uso que terão.

---

# PARTE I — K1: OS CÓDIGOS NASCEM UMA VEZ, NO SELO

## O problema

Hoje o código é gerado em `src/lib/drone/planoVooNControl.ts:1764`, **dentro da exportação**.
Cada execução gera um conjunto novo.

Quando o sorteio real ocorrer, o fluxo será: o intérprete recebe ortomosaicos identificados por
código opaco, delineia a erosão e devolve resultados **chaveados por esses códigos**. O
pesquisador remapeia para polígonos pela tabela de correspondência.

Se a exportação for reexecutada por qualquer motivo — e será, porque jornadas se replanejam —
**os códigos mudam e as delineações devolvidas deixam de casar com os polígonos.** O trabalho de
interpretação, que é a parte mais cara e mais lenta de toda a campanha, se perde sem recuperação.

## O que fazer

1. **O código opaco passa a nascer no momento do sorteio**, quando o selo é escrito, e não na
   exportação. Um código por polígono, com a entropia que Z5 exige.
2. A **correspondência código ↔ polígono** é gravada no selo. O esquema de `SeloSorteioD16`
   (`src/lib/gee/sorteioPoligonos.ts:110`) ganha o campo; **suba `versaoEsquema`** para refletir
   a mudança.
3. **A exportação passa a LER o código do selo**, nunca a gerá-lo. Se o selo não existir, a
   exportação do manifesto do intérprete **recusa** — não invente código para polígono que não
   foi sorteado.
4. **Teste:** duas execuções consecutivas da exportação sobre o mesmo selo produzem **códigos
   idênticos**; e, sem selo, a exportação do manifesto é recusada com mensagem nomeando a causa.

Note a simetria com Z5, para não desfazê-la: **não reproduzível a partir do repositório**
continua valendo — o segredo vive no selo, que não é versionado. O que muda é que passa a ser
**estável a partir do selo**.

---

# PARTE II — K2: O SELO NÃO PODE SER VERSIONADO

Testei: `docs/verificacoes/sorteio/` **não está no `.gitignore`**, e um arquivo ali seria
rastreado pelo git.

Como o selo passará a conter a correspondência código ↔ polígono, commitá-lo colocaria **a
tabela reversa do cegamento dentro do repositório** — exatamente o defeito que W2 corrigiu ao
remover `codigoOpacoInterprete` do roteiro, reaparecendo em outro arquivo.

## O que fazer

1. **Acrescente `docs/verificacoes/sorteio/` ao `.gitignore`**, antes de qualquer selo existir.
2. **Guarda em código:** antes de escrever o selo, verificar que o caminho está efetivamente
   ignorado pelo git, e **recusar a escrita** se não estiver. É a mesma lógica da guarda de
   credenciais em `credenciaisSeguras.ts`, que recusa caminho dentro do repositório.
3. **Estenda o teste de cegamento** `src/lib/seguranca/cegamentoArtefatos.test.ts` para falhar
   se um arquivo **versionado** contiver, ao mesmo tempo, um código `VANT-BLIND-*` e um
   identificador de polígono `D16_E_*`. Hoje ele varre o diretório; passe a varrer também o que
   está sob controle de versão.

---

# PARTE III — K3: A MARCA DE SINTÉTICO FICOU SÓ NOS PLANOS

A correção Z4 prefixou os dois planos de voo com `SINTETICO_NAO_VOAR_`. Mas estes três vieram da
**mesma exportação sintética** e não carregam marca alguma — verifiquei, zero ocorrências de
"sintético", "NAO_VOAR" ou "demonstração" nos três:

```
docs/verificacoes/voo_ncontrol/manifesto_interprete_cego_72poligonos.csv
docs/verificacoes/voo_ncontrol/roteiro_jornadas_72poligonos.csv   (e o .pdf)
docs/verificacoes/voo_ncontrol/tabela_autorizacao_proprietarios_72poligonos.csv
```

## Por que importa, e qual preocupa mais

A **tabela de autorizações** tem a forma exata de um documento operacional de campo: código do
polígono, código do CAR, município, área, e colunas em branco para data e forma da autorização.
Alguém pode começar a usá-la para pedir autorização a proprietários sobre polígonos que não
existem.

Verifiquei e **não há dado real de terceiros exposto** — os titulares são
`"Titular Sicar #N (A consultar na matrícula/CAR)"` e os códigos CAR seguem padrão sequencial.
Mas a forma convida ao uso.

## O que fazer

1. **Aplique a mesma regra de Z3** aos três: quando a origem dos polígonos for sintética, o nome
   do arquivo recebe o prefixo `SINTETICO_NAO_VOAR_`, exatamente como os `.plan`.
2. **Acrescente marca no conteúdo**, não só no nome: no CSV, uma primeira linha de comentário; no
   PDF, marca d'água ou faixa. O nome do arquivo se perde quando alguém copia o conteúdo para
   outro lugar.
3. **Generalize a guarda:** a recusa de Z3 hoje cobre a emissão de `.plan`. Passe a cobrir
   **toda a exportação de campanha** — se a origem for sintética e o sinalizador de demonstração
   não estiver ativo, nenhum dos artefatos é emitido.
4. **Teste** que assevere: com origem sintética e sem sinalizador, a exportação dos três é
   recusada; e com o sinalizador, os três saem prefixados e com marca no conteúdo.

---

# PARTE IV — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `decisoes.ts` proibido. Nenhuma emenda é necessária: D23 já manda registrar `pi_i` no
  selo, e guardar ali a correspondência é detalhe de implementação que ela não fixa.
- **Não comite o selo**, nem um selo de exemplo, nem um de teste.
- **Não enfraqueça Z5**: o código continua não reproduzível a partir do repositório.
- **Não apague** os artefatos sintéticos atuais; renomeie e marque, como foi feito com os `.plan`.
- **Não execute o sorteio.**

---

# PARTE V — RELATÓRIO

Gerado por `scripts/gerar_relatorio_fase.ts`. Na seção de juízo:

1. Onde o código opaco passou a nascer, e a saída do teste que mostra duas exportações
   produzindo códigos idênticos a partir do mesmo selo.
2. O que a exportação faz quando não há selo.
3. Confirmação de que `docs/verificacoes/sorteio/` está ignorado, e o que a guarda em código faz
   se não estiver.
4. Os nomes finais dos três artefatos e como ficou a marca no conteúdo.
5. O que o teste de cegamento estendido encontrou ao varrer o que está versionado.

---

## Nota

Os três itens são pequenos e nenhum urge hoje — o sorteio está bloqueado, o selo não existe e os
polígonos são sintéticos.

Mas os três são de uma categoria específica: **só doem depois.** O código efêmero só se revela
quando as delineações voltarem e não casarem; o selo versionado só se revela quando alguém ler o
repositório procurando a correspondência; e a tabela sem marca só se revela quando um
proprietário for procurado por causa de um polígono que não existe.

É o momento certo de resolver os três, justamente porque ainda não custam nada.
