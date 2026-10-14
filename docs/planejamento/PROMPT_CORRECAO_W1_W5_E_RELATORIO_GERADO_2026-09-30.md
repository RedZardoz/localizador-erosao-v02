# Prompt de Correção — Cinco itens pequenos, e o relatório de fase passa a ser gerado

**Data:** 30/09/2026
**Natureza:** cinco correções pontuais sobre trabalho **verificado e em boa parte correto**, mais uma mudança no regime de relato.
**Base:** `docs/verificacoes/2026-09-30_verificacao_Z1_Z6_planos_de_voo.md`, commit `2ec5579`.

---

# PARTE 0 — O QUE ESTÁ CERTO

Verifiquei Z1 a Z6 e confirmo, por conferência independente:

- **Z1 tem substância.** Amostrei o tile eu mesmo com `rasterio`, isolando `PROJ_LIB`, e obtive **555,89 m** em SBTD Toledo — exatamente o valor relatado. O amostrador lê dado real do Copernicus GLO-30.
- **Z2**, a chave `SAREL_D16_BLIND_PROTOCOL_2026` está expurgada do `src`.
- **Z4**, os dois `.plan` renomeados com o prefixo, `LEIA-ME_NAO_VOAR.md` preservado.
- **Z5, no lado do manifesto**, correto: o manifesto do intérprete traz só código opaco, câmera, GSD, AGL, área, formato e protocolo.
- **Z6, correto**: aspecto 17,55° → faixas 107,55°; aspecto 329,05° → faixas 59,05°. Exatamente +90° com normalização, e as três grandezas em colunas separadas.
- `tsc` limpo, `decisoes.ts` intocado.

**Nada disso será refeito.** Os cinco itens abaixo são pequenos.

---

# PARTE I — W1: A SUÍTE ESTÁ VERMELHA

`npx vitest run` devolve **44 arquivos, 336 testes, 1 falhou**. O que falha é o de Z1:

```
Error: Test timed out in 5000ms.
 ❯ src/lib/drone/planoVooNControl.test.ts:123
```

É timeout, não erro de lógica — a chamada ao GDAL estoura o padrão do Vitest. Acrescente `testTimeout` suficiente **nesse teste**, não globalmente, para que a lentidão fique localizada e visível.

---

# PARTE II — W2: A TABELA REVERSA DO CEGAMENTO ESTÁ NO REPOSITÓRIO

Este é o item que importa. A chave saiu do código, mas `roteiro_jornadas_72poligonos.csv`, **comitado**, traz na mesma linha:

```
codigoOpacoInterprete , estratoId , papelConjunto
VANT-BLIND-DC8CEA1E2D , E_1_1_1  , treino
```

Quem tem acesso ao repositório lê o cegamento direto da tabela. **A chave mudou de lugar; a correspondência ficou.**

## A regra, e não apenas a correção deste arquivo

**Nenhum artefato emitido pode conter, ao mesmo tempo, o código opaco do intérprete e qualquer atributo de desenho** — estrato, papel treino/held-out, nível de K̂, coordenada, código do polígono.

1. **Remova `codigoOpacoInterprete` do roteiro.** O piloto já tem `idPoligono`; não precisa do código cego.
2. **Audite todos os artefatos emitidos**, e não só o roteiro: a tabela de autorizações, o JSON de aceitação, o PDF. Relate quais continham o par.
3. A correspondência entre código opaco e polígono vai **exclusivamente para o selo do sorteio**, que é registro do pesquisador e **não é comitado**.
4. **Teste obrigatório, sobre todos os artefatos emitidos**: asseverar que nenhum contém simultaneamente um `VANT-BLIND-*` e um `estratoId`, `papelConjunto`, `nivelK` ou coordenada. Escreva-o de forma que **falhe automaticamente** quando um artefato novo violar a regra — é o mesmo padrão do teste de caminhos da proveniência, que funcionou.

---

# PARTE III — W3: O GUARDA DE `nodata` NÃO FOI TESTADO NO CASO QUE IMPORTA

Os três tiles declaram `nodata: None`. Demonstrei que leitura fora dos limites devolve **0,00 m** silenciosamente — valor de aparência perfeitamente válida.

O guarda existe no Python, nas linhas 185 e 206, e o TypeScript envolve em `ErroTerrenoForaDeCoberturaGLO30`. Mas a única evidência oferecida foi a coordenada **(0, 0) no Atlântico**, que é o caso trivial: nenhum tile corresponde e a seleção falha logo.

O caso perigoso é outro: **ponto imediatamente fora de um tile que foi selecionado**. Ali `terreno = 0` produziria altitude relativa de `92,76 + (0 − 550) ≈ −457 m` — plano que comanda a aeronave centenas de metros abaixo do solo.

**Teste obrigatório:** coordenada a poucos metros da borda de um tile em cache, fora dele, asseverando que lança `ErroTerrenoForaDeCoberturaGLO30` e **não** devolve 0. E, se a busca remota cobrir esse ponto, então o teste deve ser feito com a rede indisponível, para exercitar o caminho de falha.

---

# PARTE IV — W4: A COBERTURA DECLARADA ESTÁ ERRADA, E A GERAÇÃO EXIGE REDE

O relatório afirma "3 tiles cobrindo 100% da Bacia do Paraná 3". **É falso.** Conferido pelos limites dos próprios arquivos:

| Tile | lon | lat |
|---|---|---|
| S25_00_W054_00 | [−54, −53] | [−25, −24] |
| S25_00_W055_00 | [−55, −54] | [−25, −24] |
| S26_00_W054_00 | [−54, −53] | [−26, −25] |

**Falta o quadrante S26/W055**, que contém **Medianeira** (−25,295, −54,095), **Foz do Iguaçu** (−25,516, −54,588) e **Santa Terezinha de Itaipu** — todo o sudoeste da bacia e a margem do reservatório de Itaipu, inclusive onde uma das missões existentes foi voada.

O amostrador **funciona** lá — devolveu 413,63 m e 187,04 m, plausíveis — mas **sem acrescentar tile ao cache**, por busca remota no S3 da AWS.

**O que fazer:**

1. **Corrija a afirmação** onde ela estiver escrita, em comentário, documentação ou artefato.
2. **Registre explicitamente que a geração de planos exige rede** enquanto o cache estiver incompleto. Quem acreditar na cobertura completa e gerar os 72 planos offline falhará nos polígonos do sudoeste — e falhará **no meio**, depois de já ter emitido parte.
3. **Preferível:** baixe o tile faltante para o cache e verifique a cobertura por cálculo, não por afirmação. Emita, junto dos planos, a lista de tiles efetivamente usados.
4. Acrescente **verificação de cobertura antes de gerar**: dado o conjunto de polígonos, checar que todos caem em tiles disponíveis **antes** de emitir qualquer arquivo, e abortar com a lista dos descobertos. Falhar cedo e inteiro é melhor que falhar no meio.

---

# PARTE V — W5: O RELATÓRIO DE FASE PASSA A SER GERADO

Esta parte substitui a disciplina R1 por mecanismo, porque a disciplina já falhou cinco vezes no mesmo ponto.

## O que aconteceu, para que a razão fique clara

O CSV apresentado no último relatório **não existe**. O cabeçalho real começa em `idJornada, ordemNaJornada, idPoligono, codigoOpacoInterprete, estratoId`; o apresentado trazia `jornada, ordem_voo, codigo_poligono, tipo_estrato` e colunas de sobreposição que não existem em arquivo algum — com **75/70** contra o preset da Altum, que é **80/60**, e 18,5 min e 1,2 baterias por polígono de 5 ha contra os **3,79 a 4,01 min** que o arquivo real registra.

**O artefato estava certo. A prosa inventou.** Quinta vez, sempre no mesmo lugar. E desta vez a saída da suíte — que denunciaria o teste vermelho — simplesmente não foi incluída.

## O mecanismo

Implemente `scripts/gerar_relatorio_fase.ts` (ou `.py`, como preferir), que **produz** o relatório de fase a partir dos artefatos, em lugar de ele ser redigido.

O documento gerado tem duas partes visualmente separadas:

**`## Evidência gerada`** — produzida pelo script, e **nenhum número do relatório pode estar fora dela**:

1. **Resultado da suíte, primeiro de tudo.** O script **executa** `npx tsc --noEmit` e `npx vitest run` e cola a saída real. Não aceita valor passado por parâmetro.
2. **Se a suíte estiver vermelha, o script marca o relatório como `FALHA` no topo e não permite escondê-lo.** Foi exatamente o que faltou desta vez.
3. Para cada artefato citado: caminho, existência, tamanho e **SHA-256**.
4. Tabelas **renderizadas a partir do CSV e do JSON**, com o cabeçalho real, e nunca redigidas.
5. Cada grandeza numérica acompanhada do **ponteiro de origem** — arquivo e coluna, ou arquivo e chave.

**`## Leitura e juízo`** — escrita por você, com narrativa, decisões tomadas, dificuldades e o que ficou por fazer. **Sem números novos**: o que for numérico se refere ao que a seção gerada já mostrou.

## A regra, em uma frase

**O que não sair de um artefato não entra no relatório.**

Se um número é importante e não existe em artefato, a resposta é **produzir o artefato**, não digitar o número.

## Teste

O script é exercitado por teste que asseverar que: ele executa a suíte de fato; que marca `FALHA` quando ela está vermelha; e que a seção gerada contém o SHA-256 de cada artefato listado.

---

# PARTE VI — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `decisoes.ts` proibido. Nenhuma emenda é necessária aqui.
- **P12** — `nodata` não vira 0.
- **Não execute o sorteio.**
- **Não amplie o `testTimeout` globalmente** para esconder lentidão de outros testes.
- **Não remova** `estratoId` nem `papelConjunto` do roteiro do piloto — o que sai de lá é o **código opaco**.

---

# PARTE VII — RELATÓRIO

**Este relatório já deve ser produzido pelo mecanismo de W5.** É o primeiro teste dele.

Além do que o script gerar, a seção de juízo deve trazer:

1. Quais artefatos continham o par código opaco + atributo de desenho, e o que foi feito com cada um.
2. Se o tile S26/W055 foi baixado, e como a cobertura passou a ser verificada por cálculo.
3. O que a verificação prévia de cobertura faz quando encontra polígono descoberto.
4. Por que o `testTimeout` escolhido é suficiente, e se ele foi aplicado só ao teste de Z1.

Assine com a sua identidade. `author` é Luís Alfredo Ferreira da Silva (`RedZardoz`). Atualize `docs/PROVENIENCIA_ASSISTENCIA_IA.md`.

---

## Nota

Os cinco itens são pequenos — um `testTimeout`, uma coluna a remover, um teste de rejeição, um tile a baixar. O sexto não é.

Cinco relatórios seguidos tiveram o mesmo defeito, sempre na parte redigida à mão, e sempre com o artefato correto ao lado. Pedir mais cuidado não funcionou, porque o erro não é de cuidado: é de reconstruir de memória algo que já existe em arquivo. A única correção que resta é tirar a reconstrução do caminho — e é o que W5 faz.

O código que você escreveu nesta sequência é bom. O relato é que precisa parar de ser escrito.
