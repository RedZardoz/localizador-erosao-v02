# Prompt de Correção — Relato da FASE A0/A1 e disciplina permanente de relato

**Data:** 28/09/2026
**Natureza:** correção pontual sobre trabalho **já aceito**. Não refaz a FASE A0 nem a A1.
**Escopo:** cinco itens. Quatro são correções; o quinto é a disciplina que evita a repetição.

---

# PARTE 0 — O QUE FICA COMO ESTÁ

Verifiquei a FASE A0 e a A1 de forma independente. **O código está correto no essencial, e não será refeito.** Registro o que confirmei, porque a correção adiante é de relato e não de implementação, e a distinção importa:

- `npx tsc --noEmit` limpo; **42 arquivos e 308 testes** aprovados.
- `src/config/decisoes.ts` e `src/config/decisoes.test.ts` intocados. P8 respeitado.
- **Nenhum sorteio executado**: `docs/verificacoes/sorteio/` não existe.
- `terreno.test.ts` assevera as **três propriedades** exigidas por C1 — máximo abaixo de 0,5%, sinal positivo nos 20 segmentos, crescimento monotônico com a distância transversal — e não valores por segmento. Era exatamente o pedido.
- Os sete testes de `sorteioPoligonos.test.ts` cobrem as sete pré-condições, inclusive a idempotência do selo e a guarda anticircularidade de D16.
- **A pré-condição 4 está certa no código:** rejeita `kAmbiguoAssociacao === undefined`, e **não** `=== true`. Se rejeitasse `true`, violaria D08, que manda as unidades marcadas **permanecerem** no quadro amostral. Você implementou o certo.
- O mapeamento de níveis em `embrapaSoilClient.ts:255` está certo: `{"Muito baixa", "Baixa", "Média"}` para Nível 1. Confere com D09.
- Commits assinados com `Agente-Executor: Antigravity (Google DeepMind)`. Identidade própria, como pedido.

A tabela de distorção recalculada também melhorou de forma decisiva: **sinais todos corretos** e máximo conferindo (+0,1234% recomputado contra +0,1237% relatado). O problema remanescente nela é de terceira decimal, tratado na Tarefa T1.

---

# PARTE I — T1: REFAZER O RELATÓRIO

O relatório descreve coisas que o repositório não contém. Nenhuma delas afeta o código; todas afetam o registro, que é o que vai à banca.

## T1.1 — Os sete testes descritos não são os sete que existem

Você relatou: determinismo sob a mesma semente com `hashIntegridade` bit-a-bit; sensibilidade à semente; rejeição por distância elipsoidal inferior a 1.000 m atribuída a D12; e invariante numérica `pi_i * w_i = 1`.

**`hashIntegridade` não existe** em `src/lib/gee/sorteioPoligonos.ts`. **Não há regra de distância mínima** no arquivo. E o piso de 1.000 m é do **P02**, não de D12 — D12 trata das dimensões da estratificação.

Os sete testes que de fato existem, em `src/lib/gee/sorteioPoligonos.test.ts`, são os das linhas 41, 52, 76, 88, 100, 114 e 127: aprovação das sete pré-condições; recusa por selo anterior; recusa por `worldcover_duas_epocas`; recusa por `k_ambiguo_associacao_booleano` quando `undefined`; recusa por `minimo_2_candidatos_por_estrato`; recusa pela guarda anticircularidade; e o sorteio de 36 polígonos com `pi_i = 2 / N_h`, invariante à ordem de entrada.

**O conjunto real é melhor que o descrito.** Reescreva a descrição a partir da saída de `npx vitest run src/lib/gee/sorteioPoligonos.test.ts --reporter=verbose`, copiando os nomes, e não da memória.

## T1.2 — A tabela de distorção: retirar a quarta decimal

Recomputei os seus 20 segmentos com `pyproj`, geodésica sobre GRS80 contra projeção em EPSG:31982. **A conclusão está confirmada** e as três propriedades valem de qualquer forma. Mas **18 das 20 linhas divergem**, com viés sistemático de cerca de **−0,015 pp** — os seus valores saem altos — e os seus comprimentos geodésicos diferem dos meus em até **8 m no S06** (1301,298 contra 1293,090).

Viés sistemático não é erro de arredondamento; indica método diferente do declarado. Você disse ter usado `pyproj`; o resíduo sugere que parte das linhas veio da fórmula de Krüger/Redfearn digitada à mão, do relatório anterior.

**O que fazer:** reportar a distorção com **duas casas decimais**, que é a precisão que o método sustenta, e **cometer o script** que produziu os números junto com sua saída bruta, em `docs/verificacoes/projecao/`. A minha recomputação já está lá, em `verifica_tabela_recalculada_2026-09-28.py`, para confronto direto.

## T1.3 — Três atribuições erradas

- `src/lib/bacias.ts` **não existe**. É `src/lib/localizacao/bacias.ts`.
- A ressalva dos envelopes esquemáticos de bacia está atribuída ao **P07**, que é a semente aleatória da amostragem. Ela não vem de parâmetro algum: é limitação que o prompt da Tarefa 1 mandou declarar.
- O relatório põe **"Média" no Nível 2**. D09 põe Média no **Nível 1**, e o seu próprio código acerta isso em `embrapaSoilClient.ts:255`. Corrija o relatório, não o código.

---

# PARTE II — T2: DESMARCAR A AFIRMAÇÃO DE CONFERÊNCIA DA FONTE

Esta é a correção mais importante das cinco, e é a única com consequência científica.

## O que foi verificado

Você respondeu **"Sim"** a ter aberto `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/CNPS-DOC-246-2024.pdf` por `pypdf.PdfReader`, citando `scratch/read_doc246.py` como evidência, e citou a obra como *"Godoy, Silva, Melo & Marinho, 2024, Mapa de erodibilidade dos solos do Brasil, ISSN 1517-2627, 29 p."*.

Abri o PDF. A capa e a folha de autores dizem:

> **Coelho, M. R.; Lumbreras, J. F.; Amaral, A. J. do; Vasques, G. M.; Mansilla Baca, J. F.; Dart, R. de O. & Pedreira, J. P. das N. C. (2024). Erodibilidade dos solos do Brasil.** Rio de Janeiro: Embrapa Solos, Documentos 246, **40 p.**

Nenhum dos quatro nomes que você citou aparece na obra. O título é *Erodibilidade dos solos do Brasil*, não *Mapa de*. E o documento tem **40 páginas**, não 29 — número que `len(reader.pages)` devolve de graça a quem abre o arquivo. O script `scratch/read_doc246.py` **não existe no disco nem no histórico do Git**. O seu próprio comentário em `embrapaSoilClient.ts:252` cita Coelho, contradizendo o seu relatório.

Não peço explicação e não há repreensão nisto. Peço a correção do registro, porque o registro é o que sobra.

## O que fazer

**Opção A, preferida — conferir de verdade.** Abra o PDF, extraia as páginas relevantes, e **cometa o script de extração e sua saída bruta** em `docs/verificacoes/fontes/doc246/`. O relatório deve incluir, como prova de acesso, os metadados que a leitura dá de graça: número de páginas, título e a linha de autoria tal como extraída. Só então o comentário pode dizer "verificada".

**Opção B — desmarcar.** Se não for conferir agora, altere `src/lib/embrapa/embrapaSoilClient.ts` nas linhas **252** e **256-257**, onde hoje se lê *"verificada em"* e *"verificadas em"*, para declarar **explicitamente não conferido**, no mesmo regime em que D13 e D15 estão registradas — e a marca **propaga ao selo de proveniência** do pacote de reprodutibilidade, exatamente como nelas.

**Em qualquer das duas opções**, a mesma exigência vale para a segunda afirmação de conferência do mesmo comentário: a camada WFS `geonode:bra_erodibilidade_2024_sirgas2000` e seus atributos `erod_c1..erod_c4`. Se a camada foi consultada, cometa a consulta e a resposta; se não, desmarque.

**Já corrigi a citação nas três decisões que a usam** — D08, D09 e D14 — com a citação completa conferida na capa, e retirei o "Tabela 5", que era afirmação não verificada. Commit `a34c86a`. A autoria que já constava, "Coelho et al.", estava **correta**: ele é o primeiro autor. **Não altere `decisoes.ts`** por causa disto (P8); apenas alinhe os comentários de código à citação que agora está lá.

---

# PARTE III — T3: OS DOIS TESTES QUE FALTAM

Você descreveu dois testes que não existem e que são **genuinamente valiosos**. É a única lacuna real de cobertura. Escreva-os em `src/lib/gee/sorteioPoligonos.test.ts`:

**T3.1 — Determinismo e sensibilidade à semente.** Duas execuções com a **mesma** semente produzem seleção idêntica: mesmos `idPoligono`, mesmo `estratoId`, mesmo papel treino/held-out e mesmo `pi_i`. Uma execução com semente **diferente** produz seleção diferente, **preservando** os invariantes de partição: 36 polígonos, 18 treino e 18 held-out, um par por estrato.

Sem determinismo verificado, o selo de D23 não vale nada: ele registra a semente justamente para permitir reproduzir o sorteio, e essa promessa precisa de teste.

Se quiser a comparação bit-a-bit que descreveu, implemente de fato o `hashIntegridade` — hash estável sobre a lista ordenada de polígonos sorteados com seus `pi_i` — e inclua-o no selo. É útil e não estava lá.

**T3.2 — A identidade `pi_i * w_i = 1`.** Com `pi_i = 2 / N_h` e peso de Horvitz-Thompson `w_i = N_h / 2`, o produto é 1 para todos os 36 polígonos. Asseverar isso protege contra o erro clássico de estimação: usar o peso errado silenciosamente enviesa toda estimativa de prevalência, e o erro não aparece em teste algum que não olhe para essa identidade.

Asseverar sobre **estratos de tamanho `N_h` diferente**, não todos iguais, senão o teste passa por coincidência aritmética.

---

# PARTE IV — T4: RÓTULO DE SINTÉTICO NO DRY-RUN

`scripts/sortear_poligonos_d16.ts:133` define a origem como `"inspecao-estrutural-dry-run (sem arquivo --candidatos informado)"`. O rótulo é honesto, mas a saída imprime **limiares empíricos de tercil** (`t1=4,4030%`, `t2=15,8010%`) e **`pi_i` por estrato** com aparência de achado sobre a Bacia do Paraná 3. São 90 candidatos fabricados.

Alguém que leia aquela saída fora de contexto — ou a cole num relatório seis meses depois — tomará `t1=4,4030%` por limiar medido da bacia. É o defeito de fabricação por leitura errada, e o custo de evitá-lo é uma linha.

**O que fazer:**

1. Quando a origem for sintética, prefixar **toda** linha numérica com marca inequívoca, do tipo `[SINTETICO]`, e não apenas anunciar o modo no cabeçalho.
2. Imprimir, imediatamente antes e depois do bloco de números, aviso explícito de que **os limiares e as contagens não descrevem a Bacia do Paraná 3** e servem apenas para exercitar a estrutura.
3. Quando a origem for sintética, **recusar** a gravação do selo mesmo com `--confirmar`. O selo de D23 jamais pode nascer de candidato fabricado, e essa garantia pertence ao código, não à lembrança do operador.

---

# PARTE V — DISCIPLINA PERMANENTE DE RELATO

Esta parte não é sobre a FASE A0. É o que evita a repetição, e é a razão pela qual este prompt existe.

Os erros de relato desta fase, e os cinco da declaração anterior, têm **um só padrão**: *detalhe plausível afirmado como verificado*. Caminho de diretório que soa certo, campo de tipo que faria sentido existir, número de decisão vizinho, valor numérico coerente com a tendência, nome de função que deveria existir, casos de teste que descrevem o que seria razoável ter escrito. Nenhum é invenção grosseira. Todos são **preenchimento de lacuna por plausibilidade** — e é precisamente o modo de falha contra o qual este projeto foi endurecido, porque é o mesmo que produziu os fatores RUSLE fabricados que a auditoria de 26/09 encontrou.

Instrução de "seja rigoroso" não corrige isso, porque o preenchimento não é deliberado. O que corrige é **derivar em lugar de recordar**. A partir de agora, em todo relatório de fase:

**R1 — Nome não se digita, se cola.** Todo nome de teste vem da saída de `--reporter=verbose`. Todo caminho de arquivo vem de `ls` ou de `git status`. Todo identificador de função, campo ou constante vem de `grep`. Se você está digitando de memória, está adivinhando.

**R2 — Número não se estima, se executa.** Toda medição numérica vem da saída de um script, e **o script é cometido junto com a saída bruta**, sob `docs/verificacoes/<assunto>/`. Relatório que traz número sem script cometido é relatório sem medição.

**R3 — Três rótulos, e o silêncio conta como o pior deles.** Toda afirmação factual leva um de três rótulos: `conferido`, com o ponteiro da evidência (comando, arquivo e linha, ou página da fonte); `inferido`, quando é plausível mas não foi checado; `não conferido`, explicitamente. **Afirmação sem rótulo será lida como `não conferido`.** Não há penalidade em `inferido` nem em `não conferido` — os dois são respostas profissionais. A ambiguidade é o único erro.

**R4 — Fonte bibliográfica prova acesso pelos metadados gratuitos.** Ao alegar ter conferido uma obra, inclua o número de páginas, o título e a linha de autoria **tal como extraídos**, e cometa o script de extração. São os dados que quem abriu o arquivo tem sem esforço e quem não abriu erra — foi o que ocorreu aqui, em três campos ao mesmo tempo.

**R5 — Passagem de autoconferência antes de enviar.** Antes de entregar o relatório: `ls` em cada caminho citado, `grep` em cada identificador citado, e nova execução de cada script que produziu número. **Declare no relatório que a passagem foi feita.** Ela custa minutos e teria pegado todos os erros desta fase.

**R6 — Separe o que está no código do que está no relatório.** Quando corrigir algo, diga se o defeito estava no código ou apenas na descrição. Nesta fase, todos estavam na descrição — e saber disso é o que impede refazer código que está certo.

## Verificação automatizada de R1

Implemente, em `src/lib/seguranca/` ou como script em `scripts/`, uma checagem que **extraia todos os caminhos de arquivo do repositório citados em `docs/PROVENIENCIA_ASSISTENCIA_IA.md` e falhe se algum não existir no disco.** Rode-a como teste na suíte.

É mecanismo modesto e teria pegado `src/components/inspecao/`, `src/lib/exportacao/` e `src/lib/bacias.ts` sem intervenção humana. O documento de proveniência é a fonte autoritativa que vai à banca; caminho inexistente nele é rastreabilidade quebrada, que a Regra 9 protege.

---

# PARTE VI — PROIBIÇÕES E RELATÓRIO

Valem P1 a P12. Reforço:

- **P8** — `src/config/decisoes.ts` e `src/config/decisoes.test.ts` permanecem proibidos. A citação do Documentos 246 já foi corrigida lá por mim; alinhe os comentários de código a ela.
- **P11** — não relaxe critério para fazer teste passar.
- **P12** — não converta `indisponivel` em valor.
- **Não refaça** o que a PARTE 0 declara correto. Em particular, não altere a pré-condição 4 nem o mapeamento de níveis da linha 255: os dois estão certos, e foi o relatório que os descreveu errado.

Assine com a sua identidade. `author` é Luís Alfredo Ferreira da Silva (`RedZardoz`). Atualize `docs/PROVENIENCIA_ASSISTENCIA_IA.md`.

## Relatório exigido

1. Por item T1 a T4: o que mudou, com o ponteiro da evidência.
2. Qual opção escolheu na PARTE II — conferir ou desmarcar — e, se conferiu, os metadados extraídos e o caminho do script cometido.
3. Saída de `--reporter=verbose` dos testes do sorteio, com os dois novos.
4. Saída do `--dry-run` já com os rótulos de sintético.
5. Confirmação de que a passagem de autoconferência de **R5** foi feita, e o que ela pegou.
6. Se a checagem automatizada de caminhos foi implementada, e o que ela encontrou na primeira execução sobre o documento de proveniência atual.

Nada nesta correção é motivo de constrangimento: o código que você entregou nas FASES A0 e A1 é bom, as sete pré-condições estão bem construídas, e a decisão de recusar em lugar de prosseguir parcialmente está implementada com cuidado. O que falta é a disciplina de relatar apenas o que foi olhado — e, ao contrário do código, ela não se resolve pensando melhor, e sim colando saída de comando em vez de escrever de memória.
