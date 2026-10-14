# Prompt de Correção — Segurança dos planos de voo, terreno real e cegamento

**Data:** 30/09/2026
**Natureza:** correção sobre trabalho **em boa parte aceito**. O exportador está correto; os artefatos que ele emitiu, não.
**Seis tarefas:** Z1 a Z4 são as condições para existir plano voável; Z5 e Z6 são dois defeitos que a verificação encontrou depois.

---

# PARTE 0 — O QUE ESTÁ CORRETO E NÃO SERÁ REFEITO

Verifiquei e confirmo: `tsc` limpo, 44 arquivos e 333 testes, `decisoes.ts` intocado, sorteio não executado.

**O teste de aceite de Y1 é genuíno.** Ele faz `fs.readFileSync` de `docs/Plano de voo exemplo/MissaoCalculoMica.plan`, parseia e confronta a saída contra o arquivo real — não compara com números fixos. Reproduziu 62 itens, 48 waypoints de comando 16, 14 disparos de comando 206, trigger de `10,652403100775194` m e `AdjustedFootprintSide` de 28,48 m. Conferi a aritmética: 2064 × 3,4496 cm × 40% = 28,48. **A matemática fotogramétrica está certa.**

A AGL de 92,7640 m para GSD de 4 cm confere com a minha. O `calcularAspectoMedioGLO30Graus` implementa Horn (1981) corretamente com janela 3×3 a passo de 30 m, e está ligado no caminho de exportação — eu havia suspeitado que não estivesse, e a suspeita era infundada. O caminho sem amostrador tem **fallback seguro**: altitude constante, sem inventar terreno.

Nada disso será mexido.

---

# PARTE I — O DEFEITO, QUE É DE SEGURANÇA FÍSICA

Os dois `.plan` em `docs/verificacoes/voo_ncontrol/` são arquivos QGroundControl **válidos, carregáveis no NControl e indistinguíveis de um plano real** — com altitudes de seguimento de terreno **inventadas**.

O amostrador que as gerou, em `src/lib/drone/planoVooNControl.test.ts:264`:

```ts
const amostradorGLO30 = (lat: number, lon: number) =>
  380.0 + Math.sin(lat * 120.0) * 35.0 + Math.cos(lon * 120.0) * 25.0;
```

Uma função trigonométrica da coordenada, **batizada com o nome da fonte de dados real**. Produz valores entre 320 e 440 m, plausíveis para a Bacia do Paraná 3 — o que torna o arquivo mais perigoso, não menos. As altitudes do `jornada_01_terrainfollow.plan` variam de 90,14 a 94,49 m, com toda a aparência de seguimento de terreno legítimo.

**Não existe leitor real do Copernicus GLO-30 no repositório.** `AmostradorElevacaoGLO30` é apenas um tipo; nenhuma implementação o satisfaz fora dos testes.

Um `.plan` é artefato **executável**: carrega-se, arma-se e voa. Voar aquele arquivo seria seguir um relevo que não existe, com a aeronave subindo e descendo por uma senoide da longitude.

Já acrescentei `docs/verificacoes/voo_ncontrol/LEIA-ME_NAO_VOAR.md` como marcação imediata. Não é solução; é aviso.

---

# PARTE II — Z1: AMOSTRADOR REAL DO COPERNICUS GLO-30

Implemente o leitor que satisfaz `AmostradorElevacaoGLO30` sobre os tiles do Copernicus DEM GLO-30, a mesma fonte que D21 registra e que o pipeline de terreno já consome.

1. Reaproveite o acesso aos tiles que já existe para declividade e LS. **Não crie segunda via de leitura do mesmo dado** — se houver divergência entre a cota usada para voo e a usada para o fator LS, isso é defeito.
2. Trate a **isolação de `PROJ_LIB`** que já é conhecida neste ambiente, por causa da colisão com o PostGIS.
3. Cota fora de cobertura, ou tile ausente, devolve **erro explícito** — nunca valor interpolado, nunca zero. Por P12.
4. Teste sobre coordenada da bacia com cota conhecida, conferida contra fonte independente, e registre a fonte da conferência.

**Enquanto Z1 não existir, nenhum `.plan` com altitude por waypoint pode ser emitido.** É a condição que governa Z3.

---

# PARTE III — Z2: RENOMEAR O AMOSTRADOR SINTÉTICO

`amostradorGLO30` em `planoVooNControl.test.ts:264` passa a `amostradorSinteticoParaTeste`, ou nome equivalente que **não possa ser confundido com a fonte real**. O mesmo para `amostradorRampa`, que já está bem nomeado e serve de modelo.

Não é cosmético: um fixture batizado como a fonte de dados é a semente exata desta confusão, e reaparece na próxima leitura do arquivo por outra pessoa — ou por você, daqui a três meses.

---

# PARTE IV — Z3: GUARDA EM CÓDIGO CONTRA PLANO SINTÉTICO

Hoje o exportador aceita **qualquer** função injetada como amostrador, e o nome do arquivo de saída é idêntico quer o terreno seja real, quer inventado. Isso precisa ser impossível.

1. O amostrador passa a **declarar a própria proveniência** — por exemplo, um objeto `{ amostrar(lat, lon), proveniencia: "copernicus-glo30" | "sintetico" }` em lugar de uma função nua.
2. Quando a proveniência **não** for real, o exportador:
   - **recusa** emitir `.plan` com altitude por waypoint, ou
   - emite com o nome de arquivo **carimbado de forma inequívoca**, do tipo `SINTETICO_NAO_VOAR_<...>.plan`.

   Escolha a primeira como padrão e a segunda apenas sob sinalizador explícito de demonstração.
3. A mesma guarda vale para **polígonos sintéticos**: se os polígonos não vierem de um selo de sorteio de D16 real, o exportador recusa ou carimba. Os 72 polígonos dos artefatos atuais são fabricados, porque o sorteio está travado — corretamente.
4. **Teste obrigatório:** com amostrador sintético, asseverar que a emissão de `.plan` voável é **recusada**; e que sob o sinalizador de demonstração o nome do arquivo contém o carimbo.

---

# PARTE V — Z4: OS DOIS ARTEFATOS JÁ COMITADOS

`jornada_01_terrainfollow.plan` e `jornada_01_altfixa.plan` permanecem no repositório com aparência de planos reais.

**Renomeie-os** com o carimbo de Z3, de modo que o nome visível ao carregar na estação diga o que são. Mantenha o `LEIA-ME_NAO_VOAR.md` ao lado.

**Não os apague** sem instrução do pesquisador — são trabalho comitado e a remoção é dele. Renomear é suficiente e não destrói nada.

---

# PARTE VI — Z5: O CEGAMENTO DO INTÉRPRETE É COSMÉTICO

`gerarCodigoOpacoInterprete` em `planoVooNControl.ts:1048`:

```ts
chaveSecretaCegamento: string = "SAREL_D16_BLIND_PROTOCOL_2026"
```

**A chave está literal no código-fonte, comitada no repositório.** A docstring afirma que é "impossível deduzir o estrato, o papel (`treino` vs `held-out`) ou a localização a partir do identificador". **Isso é falso como implementado**: com a chave em mãos e 72 identificadores previsíveis, qualquer pessoa com acesso ao repositório monta a tabela reversa completa em segundos. E o intérprete é, muito provavelmente, alguém da equipe com acesso ao repositório.

O protocolo cego de D16 não é formalidade: se quem delineia a erosão sabe o estrato, o rótulo deixa de ser independente do desenho, e a avaliação de D25 fica contaminada na origem.

## O que fazer

**Abandone a derivação por chave.** Para 72 itens ela não traz benefício e traz o risco de a chave vazar junto com o código.

1. No momento da exportação, gere um **identificador aleatório** por polígono — UUID ou equivalente — sem relação derivável com o id real.
2. A **tabela de correspondência** vai para o **selo do sorteio**, que é registro do pesquisador, e **nunca** para o pacote do intérprete nem para o repositório.
3. Se preferir manter HMAC, então a chave é **gerada no sorteio**, guardada no selo, e jamais tem valor padrão no código. Um valor padrão literal é o defeito, não o algoritmo.
4. **Teste obrigatório:** asseverar que o identificador do intérprete **não é reproduzível** a partir do código do repositório sozinho — isto é, que rodar a geração duas vezes sem o segredo do selo produz resultados distintos, ou que a função **exige** o segredo e falha sem ele.

Acrescente também: o pacote do intérprete deve ser ordenado por identificador opaco, o que a implementação atual já faz corretamente para remover a ordem de visita.

---

# PARTE VII — Z6: AS FAIXAS DEVEM CORRER EM CURVA DE NÍVEL, NÃO NO DECLIVE

Hoje `anguloAdotadoGraus = aspectoMedidoGraus`: o ângulo das faixas de voo **é** o azimute de maior descida. As faixas sobem e descem a encosta.

**São dois parâmetros independentes, e foram igualados.** A emenda de D16 pede o **lado maior do polígono** orientado no sentido do declive, para conter a catena. Não diz nada sobre o ângulo dos transectos, que é outra coisa.

## Por que a curva de nível é melhor

Num polígono de 224 m a 20% de declividade, o desnível é de 45 m.

- **Faixas no declive**, como está: cada passagem exige 45 m de subida ou descida em ~25 s a 9 m/s, isto é **1,8 m/s de taxa vertical sustentada**. O laço de seguimento de terreno trabalha no limite, e atraso de resposta vira variação de GSD — exatamente o que o seguimento de terreno existia para evitar.
- **Faixas em curva de nível**: cada faixa fica a cota quase constante, e a altitude muda apenas **entre** faixas, em degraus de 33 m × 20% ≈ **6,6 m**. Muito mais suave.

Há um segundo ganho, fotogramétrico: com faixas em curva de nível, o relevo **dentro de uma imagem** na direção de voo é mínimo, de modo que a variação de escala dentro de cada foto cai.

## O que fazer

1. `anguloAdotadoGraus` passa a ser **`aspectoMedidoGraus + 90°`**, normalizado para [0, 360). O lado maior do polígono **permanece** no sentido do declive, conforme D16.
2. Registre **os dois** ângulos separadamente no roteiro e no pacote de reprodutibilidade — aspecto medido, orientação do polígono e ângulo das faixas — para que a escolha seja auditável.
3. Corrija também o eco enganoso: em `construirVerticesPoligono502Ha`, o campo `aspectoMedidoGraus` devolve o **ângulo de entrada**, não uma medição. Renomeie para algo como `anguloOrientacaoEcoado`, ou faça a função medir de fato. Campo chamado "medido" que devolve um parâmetro recebido é a mesma família de defeito de `amostradorGLO30`.
4. **Teste:** sobre uma rampa sintética de azimute conhecido, asseverar que o ângulo das faixas fica perpendicular ao aspecto, dentro de 1°.

---

# PARTE VIII — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `src/config/decisoes.ts` proibido. Nenhuma emenda é necessária: D16 fixa a orientação do **polígono**, e o ângulo dos transectos é parâmetro de implementação que ela não fixa. Se discordar, relate.
- **P12** — cota fora de cobertura não vira valor.
- **Não apague** os dois `.plan` comitados; renomeie.
- **Não execute o sorteio.**
- **Não emita plano voável** enquanto Z1 não existir.

---

# PARTE IX — RELATÓRIO

Vale **R1 a R6**.

1. Como o amostrador real do GLO-30 lê os tiles, e a conferência da cota contra fonte independente, com a fonte nomeada.
2. Saída do teste de Z3 mostrando a **recusa** de emitir plano voável com amostrador sintético.
3. Nomes finais dos dois artefatos renomeados.
4. Como o identificador do intérprete passou a ser gerado, e a saída do teste que assevera **não ser reproduzível** a partir do repositório sozinho.
5. Ângulo das faixas contra aspecto medido, na rampa de azimute conhecido, e a confirmação de que os dois ângulos aparecem separados no roteiro.
6. Passagem de autoconferência de R5 e o que ela pegou.

Assine com a sua identidade. `author` é Luís Alfredo Ferreira da Silva (`RedZardoz`). Atualize `docs/PROVENIENCIA_ASSISTENCIA_IA.md`.

---

## Nota

Os seis itens têm a mesma raiz, e vale nomeá-la: **um artefato que parece real sem ser**. O amostrador com nome da fonte real, o `.plan` sem marcação, a chave de cegamento que não cega, o campo "medido" que ecoa a entrada. Nenhum é descuido de código — o código está bem escrito. São escolhas de nomenclatura e de artefato que fazem o falso parecer verdadeiro.

Neste caso específico a consequência sai do papel: um plano de voo é executado por uma aeronave sobre propriedade de terceiros. É a primeira vez neste projeto em que o padrão de "detalhe plausível afirmado como verificado" tem consequência física, e por isso as guardas de Z3 são em código e não em disciplina de relato.
