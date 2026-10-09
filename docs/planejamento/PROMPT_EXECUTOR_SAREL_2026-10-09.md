# Prompt do agente executor — SAREL v2 (versão 3, 2026-10-09; substitui a de 2026-10-06)

**Para quem é.** Um agente executor (modelo de custo menor) que aplica, em ordem e com portões verificáveis, (1) as correções da auditoria de 05/10/2026, (2) o alinhamento do código às decisões **já decididas** D16, D24, D25 e D26, (3) as **emendas aceitas pelo pesquisador em 06/10/2026** (arquivo `EMENDAS_PROPOSTAS_2026-10-06.md`), (4) a **opção (c)** para os sítios de aferição (código CAR e perímetros reais fora do git) (5) os ajustes de front-end medidos em 06/10/2026 e (6) as correções da **revisão global de 09/10/2026** (blocos N10 a N17, mais o Fator R com o fator 9,81 e a tolerância ±10% já fixada pelo pesquisador).

**Estado: NÃO EXECUTADO.** Nada aqui foi aplicado ao código. Os anexos (`ANEXOS_PROMPT_EXECUTOR_2026-10-06/`) foram testados por quem redigiu o prompt: **49 testes Python passam** (38 da v2 + 11 da revisão de 09/10) e o script de UI reprova 21 itens no estado atual (esperado: é o critério de aceite do front-end). O extrator de sítios locais foi executado uma vez e o arquivo gerado foi apagado do contêiner.

## O que mudou em 09/10/2026 (v3)

| Mudança | Onde |
|---|---|
| **Tolerância do R fixada pelo pesquisador: ±10%** (CHIRPS contra o Quadro 1 de Waltrick, só BP3/Região 1; ±0,5% com pluviômetro da mesma estação é teste de encanamento) | N09; E-D13 |
| **Fator de unidade do R = 9,81** (era "10 inferido"): a dissertação de Waltrick (2010) traz as equações de Rufino já em SI (182,86 + 56,21·X = 18,64 × 9,81 e 5,73 × 9,81) e os pluviômetros do IAT reproduzem 12 estações do Quadro 1 a ±0,004% | N09; E-D13 |
| **Revisão global** por 4 revisores independentes (estatística, fatores e dados, front-end e segurança, coerência documental): 62 achados relatados; os que o redator confirmou por conta própria e os que não estão cobertos viraram os blocos **N10 a N17** e ajustes em N02, N03, N04, N06, N07, N08 e N09 | `docs/planejamento/REVISAO_GLOBAL_2026-10-09.md` |
| **Anexos corrigidos** (49 testes): hash do pré-registro verificado, trava gravada ANTES do ajuste, alvo/chaves proibidos como preditor, chave de monotonicidade validada, coluna 100% ausente recusada, `Incluida` filtrada, `Pixel_ID` opaco disjunto entre treino e held-out | N03 |
| **Ordem de fases corrigida** (duas dependências estavam invertidas) e **IDs de parâmetros novos P20..P24** (os P12..P15 da v2 colidiam com a "proibição P12" já citada em `decisoes.ts` e nos painéis) | seção 5; DEC-7 |
| **Portão P0.1 corrigido** (o comando da v2 falhava hoje: `core.quotepath` e `scripts/pluviometria/`) | P0.1 |
| **19 decisões do pesquisador (DP-1..DP-19)** que o executor NÃO toma; a lista está na seção 3-B | seção 3-B |

## O que o pesquisador aceitou em 06/10/2026 (e onde está registrado)

| Item | Resolução | Onde |
|---|---|---|
| R-A (18/918 × 36/936 × 922) | texto de D25/D24 corrigido para 36 agrupamentos e ≈ 920 unidades; a tela passa a ler o cálculo | `EMENDAS…` E-D25, E-D24; N04/U04 |
| R-B (lacuna de D25) | novo desfecho **INCONCLUSIVA_MARGEM**; secundárias não condicionam; AUC sobre o escore contínuo | E-D25; anexo `avaliacao_d25_referencia.py` |
| R-C (Mannigel 2002) | citação suspensa até conferência | E-D09/E-D10 |
| R-D (D02 × Regra 4) | D02 = triagem de candidatos, sem papel na seleção nem no alvo | E-D02 |
| R-E (38 × 40 páginas) | a própria ficha catalográfica arquivada diz **38 p.** (extração do Doc. 246, linha 77) | E-D14 |
| R-F (78 %) | cifra **em verificação**; medir o erro conjunto rótulo→célula nas missões já voadas | E-D06/E-D16; manual P6 |
| R-G (FICHA_TECNICA) | só listar (N05/F3); redação vigente é do pesquisador | N05 |
| DEC-10 | **opção (c)** aplicada em N07 | N07 |
| DEC-5, 6, 7, 9, 11, 12, 13 | padrões da seção 3 aprovados (DEC-5 ajustado: κ sobre o binário por célula, em piloto antes da delineação em escala) | seção 3 |
| DEC-16 e P10 | máscara SCL {4, 5} e janela D05; expoente de Tweedie escolhido por validação interna na grade {1,2; 1,5; 1,8} | seção 3; anexo |
| Preditores | 5 espectro-temporais + 3 de terreno + K + R = 10 (teto 14); monotonicidade só onde o sinal é inequívoco | `config_pre_registro_PROPOSTA.json` |

### Leitura da bibliografia (D13 e D15) — resultado
- **D15, Renard et al. (1997):** equações [4-1] a [4-5] **conferidas na imagem do PDF primário** (pp. 105 e 107). O expoente m é função **contínua** da declividade (não há "patamares"); a quebra de 9 % é do fator S e o domínio de 3–20 % a atravessa.
- **D15, Desmet e Govers (1996) — conferido em 09/10/2026** no PDF enviado pelo pesquisador (8 páginas escaneadas; agora em `docs/verificacoes/fontes/desmet1996/desmet_govers_1996_jswc.pdf`): o fator L é a **Eq. (9)** (p. 429), com A_out = A_in + D², comprimento de contorno D·x e x = sen α + cos α (p. 428); m e S vêm da RUSLE. O código usa x com **módulos** (leitura do implementador, a declarar) e cita "Eq. 2" (errado: a Eq. 2 distribui o fluxo). O artigo mostra que o LS **depende da resolução** do MDE e sua validação é a 5 m numa bacia belga; **não há validação a 30 m**. Achado novo: `fatorLS.ts` trata A_in ausente como **0** (bloco N08).
- **D13, Rufino, Biscaia e Merten (1993) — lido em 09/10/2026** no PDF obtido pelo pesquisador junto à revista (6 páginas, arquivado em `docs/verificacoes/fontes/rufino1993/`). Waltrick (2015) usa as **oito equações regionais de Rufino**, regressões lineares Y = a + b·x com x = p²/P (Quadro 2, p. 443). **Bacia do Paraná 3 = Região 1: a = 18,64; b = 5,73** (Thiessen: os 918 nós de uma grade de 0,05° sobre o envelope da BP3 caem em células de estações da Região 1; Quadro 2 e Figura 2 coincidem nessa região).
- **Problemas achados em Rufino/Waltrick:** (i) a Figura 2 e o Quadro 2 do próprio artigo **divergem em 5 de 8 regiões** (R2 a R6); (ii) a equação impressa (p e P em mm) **não reproduz a escala do R**: falta um fator de unidade; (iii) **RESOLVIDO em 09/10/2026 com pluviômetros do IAT (SIH/AGUASPARANÁ), 1986–2008**: o fator é **9,81** (e não 10), aplicado a R = 9,81 × Σ₁₂(a + b·p̄²/P̄), com p̄ e P̄ **médias da série** (não ano a ano). Em 12 de 31 estações cujo nome coincide com o município do Quadro 1 de Waltrick, o R calculado cai a **−0,03% … −0,25%** do publicado (razão publicado/Σ = 9,810 em 9 delas); nas demais a diferença (até +30%) vem de Waltrick ter usado outra estação do mesmo município. A origem física do 9,81 (g, conversão kgf·m → J) é **hipótese**: não consta de fonte lida. Script e dados: `scripts/pluviometria/r_rufino_vs_waltrick.py`, `docs/verificacoes/r_rufino_pluviometro_vs_waltrick.csv`. Com a climatologia CHIRPS 1981–2025 a razão ao R de Waltrick é 0,912 / 0,990 / 0,976 / 0,974 / 0,997 (Toledo, Cascavel, Santa Helena, Foz do Iguaçu, Palotina): CHIRPS subestima P em Toledo (1.504 contra 1.696–1.821 mm nos pluviômetros). (iv) a referência "Medianeira, R = 11.400" da climatologia **não consta** do Quadro 1 de Waltrick: sem fonte (achado A57); com 9,81 a CHIRPS dá 1,113 vezes esse número.
- **Consequência:** as equações de LS e os coeficientes e a unidade de R da Região 1 estão lidos na fonte ou reproduzidos nos dados; a decisão sobre as regiões 2 a 8 fica fora do escopo declarado (**BP3 por praticidade metodológica, não por limitação da fonte**). A **tolerância do R por CHIRPS está FIXADA pelo pesquisador em ±10%** (09/10/2026; observado: −8,8% a −0,3% em 5 estações; folga de só 1,2 ponto percentual no pior caso, Toledo). Marca "unidade reproduzida" (bloco N09).

- **D13, Waltrick (2010), dissertação UFPR — lida em 09/10/2026** (`docs/verificacoes/fontes/2010_04_20_waltrick.pdf`, 107 p.): diz que as oito equações de Rufino foram "convertidas para o Sistema Internacional" e as traz nas Tabelas 1.1 a 1.8. Região 1: Y = 182,86 + 56,21·X; Regiões 3, 4, 6, 7, 8 = Quadro 2 de Rufino × 9,81 (isto resolve a divergência Quadro 2 × Figura 2 a favor do Quadro 2 nessas regiões; R2 e R5 ficam em aberto, fora do escopo). Os coeficientes **107,52 e 46,89** que o código já teve são a **Região 6** em SI (Tabela 1.6): a fonte existe, mas a região é a errada para a BP3 (Região 1). O "Palotina 11.036" que circulou aqui é o valor ANTIGO de Rufino (Tabela 1.9 da dissertação); o de Waltrick é 10.436.

### Ressalva (R-H) — Google Drive: CONFIRMADA em 09/10/2026
O instalador baixa o banco por **link compartilhado** (`embeddedfolderview` e `drive.usercontent`, em `scripts/download_gdrive_db.py`). A revisão consultou as permissões da pasta (somente leitura, sem baixar nada): está **aberta a "qualquer pessoa com o link"** e pertence a **outra conta, não à do pesquisador**; o ID da pasta está versionado em `config_instalador.json`, `scripts/download_gdrive_db.py`, `Iniciar_Localizador_Erosao.bat` e `scripts/installer/InstaladorSAREL.cs`. Consequências: (i) quem tiver o repositório ou o histórico baixa o `fundiario_brasil.db` (SICAR/SNCR/SIGEF) e os perímetros; (ii) o ZIP com `sitios_referencia_local.json` (identifica proprietários) **NÃO deve ser subido a essa pasta** enquanto ela for pública; (iii) isso é decisão e ação do pesquisador (DP-15); o executor não toca no Drive nem no instalador e o passo 8 de N07 foi alterado para não instruir o upload.

### Antes de entregar este arquivo ao executor
1. Confira a **seção 3**: onde a "Base" diz PROPOSTA, o padrão vale como decisão sua porque você aceitou as recomendações; edite o que quiser mudar.
2. Confirme que o `HEAD` é descendente do commit que contém estes arquivos (o executor confere os SHA-256 dos anexos).
3. Atenção: o **histórico do git já contém** os códigos CAR e perímetros (commits anteriores). A opção (c) tira o dado da árvore atual; **não reescreve o histórico**. Se o repositório puder ficar público ou ser compartilhado, limpe o histórico (`git filter-repo`) como passo separado, sob sua decisão.

## O prompt (copie o bloco inteiro)

```
Você é o EXECUTOR do repositório SAREL v2 (PPGTCA 2026). Trabalhe SOMENTE no que está escrito.
Quando faltar informação, PARE e relate; nunca preencha lacuna com suposição. Este prompt é
longo de propósito: siga a ordem, cole a saída de cada comando e não pule portões.

════════════════════════════════════════════════════════════════════════════════════════
1. REGRAS INVIOLÁVEIS
════════════════════════════════════════════════════════════════════════════════════════
R1.  Faça apenas o que o bloco descreve. Achou outro problema: registre no relatório, não conserte.
R2.  Antes de editar um bloco: rode o comando "REPRODUZIR" e cole a saída. Se diferir do
     "esperado hoje", PARE nesse bloco e relate.
R3.  Reabra cada âncora (arquivo:linha) antes de editar; linhas se deslocam.
R4.  Você NÃO decide metodologia. As decisões estão na seção 3. Fora dela, PARE e pergunte.
R5.  Nunca escreva "corrigido", "passa" ou "limpo" sem a saída do comando, da MESMA sessão.
R6.  Proibido pular, desativar, quarentenar ou apagar teste para obter verde. Teste que
     contradiz uma decisão registrada (ex.: "drone é sempre held-out" × D16) pode ser
     REESCRITO só nos blocos que o autorizam (N02; N09 para `fatorR.test.ts`/`chuva.test.ts`; N11 para `persistenciaTemporal.test.ts`; N13 para `validacaoMatricial.test.ts`; N14 para planilha/invariantes), com a lista antes/depois no relatório.
R7.  Proibido: tocar em `legado/pre_sarel/`; apagar/mover/renomear `docs/relatorios/modelagem/`;
     editar `docs/PROVENIENCIA_ASSISTENCIA_IA.md`; consumir cota PlanetScope; criar tarefa no
     Earth Engine; rodar qualquer coisa com credencial real; executar `Instalador_SAREL.exe`; rodar `scripts/sortear_poligonos_d16.ts --confirmar` ou chamar `/api/gee/sorteio-d16` com `confirmar: true` (selo IRREVERSÍVEL, D23); subir qualquer arquivo ao Google Drive;
     fazer push, abrir PR, criar tag; reescrever o histórico do git (rebase, filter-repo, amend de
     commit antigo); mexer em `Instalador_SAREL.exe`, `InstaladorSAREL.cs` ou no Google Drive; marcar
     algo como "decidida". EXCEÇÃO ÚNICA em `src/config/decisoes.ts`: (i) acrescentar, ao FINAL do
     campo indicado, os parágrafos de `EMENDAS_PROPOSTAS_2026-10-06.md` (bloco N06), sem apagar nem
     reescrever o texto original e sem tocar em `estado`, `decididoPor`, `decididoEm`; (ii) acrescentar
     parâmetros P10, P11 e P20..P24 com estado "proposta" e sem `valor`.
R8.  Dado de teste: só sintético, óbvio, com `SINTETICO_TESTE_ENCANAMENTO` no nome e no
     conteúdo, em diretório temporário FORA do repositório (ou fixture de teste nomeada).
     Nenhum número produzido com ele (AUC, rho, SHAP, contagens) é evidência científica; diga
     isso na mesma frase em que citá-lo.
R9.  Um commit LOCAL por bloco, mensagem iniciando pelo ID ("C03 (A24): ..."). Branch de
     trabalho: `sarel/executor-2026-10-09`, criada a partir do HEAD verificado. Antes de cada
     commit: `npm run typecheck` e os testes do bloco; antes do último: a suíte inteira.
R10. Estes SHA-256 devem permanecer idênticos ao fim de TODOS os blocos (confira com
     `sha256sum -c`; arquivo de conferência em /tmp, fora do repositório):
       bb557dada06e630d6ea2e4d3ceae9fb030682dcf857bf4a4073f76c415c718f5  docs/relatorios/modelagem/curva_roc_loco.png
       20a713c60bf2fe7ff1dee6dbd91542b1dd707cd1b2214ea32853ef4e9d01ae63  docs/relatorios/modelagem/matriz_confusao_loco.png
       755bbd4e173340f29d117eef5c55ac446af2bde89f47b5018ffd83bbf101caa3  docs/relatorios/modelagem/relatorio_modelagem_xgboost_loco.json
       cf85dcf0558865b305fb7492fab7d243712d8a6a635ef73ee957cdd427b2a12b  docs/relatorios/modelagem/shap_feature_importance.png
       37aae950f90117254a18cbb6ccf950c4bf55f035093cc4c10f5a2b3c6593ac1f  docs/relatorios/modelagem/shap_summary_beeswarm.png
R11. Os ANEXOS são código de referência testado. Copie-os BYTE A BYTE (confira SHA-256);
     se um teste de anexo falhar no seu ambiente, PARE e relate; NÃO edite o anexo.
R12. Limite de estrago: se um bloco exigir alterar mais de 6 testes existentes além dos
     listados no próprio bloco, ou mais de 15 arquivos de `src/`, PARE e relate.
R13. Honestidade de saída: relate o que NÃO rodou (GEE, Planet, dados locais ausentes) e por quê.
R14. Se um comando travar por mais de 10 minutos, interrompa, registre e siga para o próximo bloco
     independente.

════════════════════════════════════════════════════════════════════════════════════════
2. PRÉ-VOO (Fase 0) — nada é editado antes de todos os itens passarem
════════════════════════════════════════════════════════════════════════════════════════
P0.1 `git rev-parse HEAD` e `git log --oneline -3`. O HEAD deve ser 4834cf0 ou descendente cujo diff,
     fora de `docs/` e de `scripts/pluviometria/`, seja vazio:
       git -c core.quotepath=off diff --name-only 4834cf0 HEAD | grep -v '^docs/' | grep -v '^scripts/pluviometria/'
     -> vazio (o `core.quotepath=off` é obrigatório: caminhos com acento, como `docs/pluviometria/Corbélia/…`,
     saem entre aspas e não casariam com `^docs/`). Se não for vazio, PARE.
P0.2 `git status --porcelain` -> vazio, exceto (opcionalmente) a pasta de anexos e este prompt.
P0.3 `git checkout -b sarel/executor-2026-10-09`.
P0.4 Ferramentas: `node -v` (>=18.17), `npm -v`, `python3 --version`. Instale dependências JS
     com `npm ci` (não `npm install`). Python (somente para os anexos e testes): numpy, pandas,
     scipy, scikit-learn, xgboost, shapely, pyproj; xlrd só para `scripts/pluviometria/ler_iat.py` (testado com numpy 2.4.6, pandas 3.0.6,
     scipy 1.17.1, scikit-learn 1.9.1, xgboost 3.2.0, shapely 2.1.2, pyproj 3.7.2). Se faltar uma,
     instale em venv FORA do repositório; relate versões.
P0.5 Baseline (cole as saídas; devem coincidir com o esperado):
       npm run typecheck -> exit 0
       npm run lint      -> exit 0, 2 warnings (MapViewer.tsx:476, PointPopup.tsx:64)
       npm run test      -> exit 1; "Test Files 3 failed | 54 passed (57)"; "Tests 6 failed | 429 passed (435)"
       npm run build     -> exit 1; 2 UnhandledSchemeError (node:child_process, node:crypto)
       curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ (com `npm run dev`) -> 500
     Se qualquer número diferir, PARE e relate o novo valor (o repositório mudou).
P0.6 SHA-256 do prompt de correção e dos anexos (devem coincidir):
       b9484ae62b3ab16fe9ba5b13eea4cd26e1bbd276bbc63d86f28f8cf3c6f96de7  docs/planejamento/PROMPT_CORRECAO_POS_AUDITORIA_2026-10-05.md
     Anexos: os SHA-256 estão em `docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/SHA256SUMS.txt`;
     rode `cd docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06 && sha256sum -c SHA256SUMS.txt`.
P0.7 Rode os testes dos anexos e cole a saída (devem dar "OK"; 49 testes no total):
       cd docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06
       python3 -m unittest test_avaliacao_d25_referencia test_fracao_erodida_celulas_referencia
     (a linha "error: the following arguments are required: --dados" no stderr é esperada: é o
     teste que prova que o CLI não tem dado padrão.) Apague `__pycache__` depois.
P0.8 Leia INTEGRALMENTE `docs/planejamento/PROMPT_CORRECAO_POS_AUDITORIA_2026-10-05.md`
     (blocos C01..C30, V1..V13, receita R-TS e baseline). Os blocos C01..C30 são NORMATIVOS neste
     prompt, com duas substituições: (i) a SEÇÃO 6 daquele arquivo (DEC-1..16) é substituída pela
     seção 3 deste; (ii) as ERRATA da seção 4 deste prompt prevalecem sobre qualquer texto dele.

════════════════════════════════════════════════════════════════════════════════════════
3. DECISÕES (substituem a seção 6 do prompt de correção)
════════════════════════════════════════════════════════════════════════════════════════
Coluna "Base": REGISTRADA = já consta como decidida em `src/config/decisoes.ts`; PROPOSTA =
padrão conservador do redator, vale como decisão do pesquisador somente se este arquivo for
entregue sem edição. O executor aplica a coluna "Padrão" e NÃO a reinterpreta.

 DEC-1  RUSLE como preditor   Padrão: K (`RUSLE_Fator_K`) e R (`RUSLE_Fator_R`) entram como preditores
        (blocos solo e chuva de D24); LS no bloco terreno; C, P, perda de solo e `RUSLE_A` NUNCA entram.
        A linha de base RUSLE (A=R·K·LS·C·P) é o competidor 1 e é calculada fora da matriz de
        predição. Base: REGISTRADA (D24 blocos; D25).
 DEC-2  O que D02 define      Padrão: critério de TRIAGEM DE CANDIDATOS. Rótulo vem só de
        observação humana; nenhuma tela chama o resultado de limiar de "classe" ou "rótulo". D02 é
        emendada por N06 (E-D02), sem apagar o texto original. Base: ACEITA pelo pesquisador (Regra 4; D16).
 DEC-3  Alvo/binarização      Padrão: (c) D26 primário (`Fracao_Erodida`, [0,1]); binário derivado
        `>= 0,25` para VANT; D03 governa rótulos ordinais de campo (ausente→0; incipiente,
        moderada, severa→1; aliases legados "presente","erosao","erosão","1"→1; qualquer outro
        texto, inclusive "Sem erosão" e "indeterminado" → RECUSADO). UMA função única. Base: REGISTRADA.
 DEC-4  Papel do VANT         Padrão: (a) alinhar o código a D16 emendada: o rótulo de VANT alimenta
        treino OU held-out conforme `papelConjunto` do polígono sorteado (2 treino + 2 held-out por
        estrato, 72 polígonos de 5,02 ha); held-out sai em ARQUIVO SEPARADO. A lista de polígonos held-out é
        CONGELADA com hash pelo pesquisador, no ato do sorteio e antes de qualquer treino (DEC-17).
        Base: REGISTRADA (+ congelamento: PROPOSTA).
 DEC-5  Kappa < 0,60          Padrão: (a) bloquear a exportação dos perfis `matriz-treino` e
        `matriz-heldout` se existir par com 2 observadores e κ < 0,60. O κ de Cohen vale para rótulo
        CATEGÓRICO: sobre VANT aplica-se ao BINÁRIO por célula (fração ≥ 0,25) entre dois delineadores
        em subamostra-piloto, e a correlação das frações é reportada em paralelo. O tamanho do piloto é
        decisão do pesquisador (o executor não o fixa). Observador único é aceito e marcado
        `Rotulo_N_Observadores = 1`. Base: ACEITA (Planejamento v3 §3: κ < 0,60 = critério não operacional).
 DEC-6  Módulos sem chamador  Padrão: (b) a linha de base RUSLE é calculada no script de avaliação
        (anexo D25), não no app. No app, R/LS/chuva ficam `indisponivel` com causa honesta
        (C11, C15). NÃO ligue chuva/Planet/harmônicos. Base: PROPOSTA (sem GEE o executor não valida).
 DEC-7  Escolhas do código    Padrão por item: imputação por mediana no CLI legado → aposentada (ver
        DEC-14); AUC=0,5 em falha → NaN com motivo; `KFold(shuffle)` chamado de LOCO → o CLI legado
        passa a recusar modo probatório (DEC-14); clamp [0,1] mantido, com CONTAGEM de valores
        corrigidos exibida; tolerâncias 30 d, 45 d, 75°, 0,95 → registradas como P20..P23 com
        estado "proposta" (sem `valor`), sem mudar comportamento. Base: PROPOSTA.
 DEC-8  Fator C sem BSI       Padrão: D20 já diz: forma pura de D01 COM selo explícito de que não é a
        híbrida. Base: REGISTRADA (D20).
 DEC-9  `adquiridoEm`         Padrão: a data vem de uma constante nomeada com a obra/versão da fonte
        (ex.: Embrapa Documentos 246, 2024); aceite "AAAA" ou "AAAA-MM" quando só isso é conhecido;
        se desconhecida → proveniência `indisponivel` (causa "data-da-fonte-desconhecida"). Nunca a
        data de hoje, nunca "2024-01-01". Base: PROPOSTA.
 DEC-10 CAR/perímetros reais  Padrão: **(c)** identificadores opacos no repositório; código CAR real e
        perímetros em `data/sitios_referencia_local.json`, FORA do git, instalado só na máquina do
        pesquisador pelo Google Drive (a identificação do proprietário serve à autorização de visita).
        Executa-se em N07. NÃO reescrever o histórico. Base: ACEITA pelo pesquisador (06/10/2026).
 DEC-11 Tag `legado-pre-sarel` Padrão: (b) remover do README a instrução `git checkout legado-pre-sarel`
        e apontar para a pasta `legado/` e para o hash do commit onde ela foi criada (descubra com
        `git log --diff-filter=A --format=%h -1 -- legado`). NÃO crie tag. Base: PROPOSTA.
 DEC-12 `docs/relatorios/modelagem/` Padrão: (a) manter onde está. Base: PROPOSTA.
 DEC-13 PDF/PPTX vigentes    Padrão: NÃO mover, apagar ou deduplicar. Em C18, corrija o GERADOR e
        regere SOMENTE a cópia da raiz (`Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf`),
        se o ambiente tiver as dependências do gerador; senão relate. Base: PROPOSTA.
 DEC-14 Lógica de treino canônica Padrão: (c) a canônica passa a ser `scripts/d25/` (anexos). O CLI
        legado `scripts/treinar_xgboost_loco.py` recebe banner DEPRECATED e RECUSA o modo
        probatório (só dry-run sintético). O pacote ZIP passa a embutir o script novo (bloco N03).
        Base: REGISTRADA (D24/D25/D26 não são cumpridos pelo legado).
 DEC-15 Colunas consumidas    Padrão: (c) teto por bloco de D24 (≤8 espectro-temporal, ≤4 terreno,
        1 solo, 1 chuva), declarados pelo pesquisador em `config_pre_registro`. PROPOSTA otimizada
        (anexo `config_pre_registro_PROPOSTA.json`): 5 espectro-temporais de SÉRIE (Frequencia_Solo_Nu,
        Composto_Solo_Nu_B12, Composto_Solo_Nu_Razao_B4_B2, Taxa_Degradacao_SWIR_Anual,
        NDVI_P90_Serie) + Declividade_pct, Curvatura_Perfil, TWI + K + R = 10; monotonicidade só em
        declividade, K, R, frequência de solo nu (+) e NDVI_P90_Serie (−). O executor NÃO preenche
        nem congela o pré-registro. Base: REGISTRADA (D24) + PROPOSTA ACEITA.
 DEC-16 Máscara de nuvem/janela Padrão: (a) máscara de pixel por SCL do Sentinel-2 L2A mantendo as
        classes 4 (vegetação) e 5 (não vegetado), descartando 0,1,2,3,6,7,8,9,10,11 (as classes 4, 5, 8, 9 e 10 foram confirmadas por busca no catálogo do GEE; a conferência das demais contra o catálogo é do pesquisador); janela de D05
        (2016-01-01..2026-06-30, constante única). P09 permanece "proposta" em `decisoes.ts`.
        Sem GEE, valide só a expressão (teste de construção). Fica PENDENTE DO PESQUISADOR uma consulta
        barata no GEE: quantas células ficam abaixo do mínimo de 6 observações válidas de D11 com esta
        máscara; o executor lista isso no relatório como "não rodado". Base: ACEITA (+ D05 REGISTRADA para a janela).
 DEC-17 Identificadores   Padrão: `Poligono_ID` na matriz = `codigoOpacoVant` do selo (nunca `D16_<estrato>_Qnn`,
        que revela o estrato: Regra 6); `Celula_ID` e `Pixel_ID` são códigos OPACOS (anexo
        `fracao_erodida_celulas_referencia.py`: hash dos índices da grade). Os três são só CHAVES de agrupamento e
        junção: nunca preditor (o avaliador os recusa), nunca coordenada reconstruível; `Grade_X`/`Grade_Y` ficam
        só no CSV intermediário local e NUNCA em exportação do app. Base: PROPOSTA (D28 do rascunho de 06/10,
        com as condições daquele rascunho; D27 segue com o pesquisador, DP-2).

3-B. DECISÕES QUE O EXECUTOR NÃO TOMA (DP-1..DP-19; só o pesquisador decide e registra)
 DP-1  D09/D14 e as classes de erodibilidade: o Doc. 246 (extração, linhas 126-130, 277-278) tem SEIS classes
       (a 6ª, "extremamente alta", K de 0,0600 a 0,1100); D09 diz "domínio agrícola [1..5]" e "nível 2 = classes 4-5",
       a tabela de D14 termina em "muito alta", `fatorK.ts:92` não tem a classe 6, mas D08, `embrapaSoilClient.ts:503`
       e a medição de 29/09 a incluem no nível 2 (muda a fração de K̂ = 2 de 16,7% para 31,1%). Alterar D09/D14
       muda o sorteio irreversível: decidir ANTES do selo.
 DP-2  D27: segregação por polígono (A) ou por modalidade (B); `docs/design.md:19,41` ainda dizem "drone nunca entra no treino".
 DP-3  Frequência de Solo Nu (Ê): UMA definição (D10: `<` ou `<=`; papel do BSI "quando aplicável") e o composto de
       percentis que substitui a mediana por árvore de decisão com constantes sem fonte
       (`copernicusGeeClient.ts:269,501-575`; sonda do revisor: pixel de cultura vigorosa com ~15% de cenas nubladas
       sai "solo exposto", C de 0,051 para 0,771; a frequência de contaminação real é HIPÓTESE); máscara de nuvem e janela (C10/DEC-16).
 DP-4  Declividade: o estêncil de Horn a ±30 m amostra a grade de 1″ (≈28 × 30,9 m) por vizinho mais próximo
       (`planoVooNControl.ts:938-985`, `reduzir_terreno_copernicus.py:450-451`): em simulação do revisor (plano
       inclinado, relevo liso, grade de 1″ assumida) ≈14% dos pontos têm erro de declividade > 10%; o Python tem
       outro caminho (9 pixels nativos, dx = 30,922·cosφ). Decidir o método e a fonte (GLO-30 local ou Open-Meteo).
 DP-5  R como preditor (DEC-1/DEC-6): R vem de ≤ 6 estações / células CHIRPS de ~5,5 km, quase um identificador de lugar;
       `types/ponto.ts:180` diz "linhaDeBase: nunca em matriz" e `montagem.ts:187` coloca `fatorR` na matriz.
 DP-6  Regra de empate dos tercis de D12 (massa em zero de Ê): N12 só relata as contagens.
 DP-7  Pesos de Horvitz-Thompson (`pi_i = 4/N_h`) e distância mínima entre polígonos sorteados (P02 vale para pontos): ρ
       não ponderado estima a amostra, não a bacia; polígonos vizinhos quebram a independência do n efetivo.
 DP-8  Textos de decisão com "36 polígonos de 10 ha" ainda vigentes em D06, D12, D19, D23, D24 e D26, e "~34.800 células"
       em D16 (72 × 5,02 ha = 36.144): emendar por acréscimo (E-D16bis); N06 NÃO cobre.
 DP-9  Argumento dos tetos de D24: o n efetivo de TREINO (36 polígonos, ≈ 920) e a prevalência, não o total (≈ 1.841).
 DP-10 D03 × `CLASSES_ROTULO_VALIDAS` (`concordancia.ts:165`): "controle", "spd" e "0" são aceitos pelo validador e não
       mapeados por D03 (0 ou recusar).
 DP-11 Doc. 246: 38 p. (ficha) ou 40 (PDF) em D09, D14 e outras (`decisoes.ts:122,132,165,191`; `fatorK.ts:29`).
 DP-12 Âncoras "§11.1-11.3", "§10.4", "§10.5" (D17, D18, D19) e o "alcance de 50 m adotado no planejamento" (D24) não existem
       no Planejamento v3 (só §10.1 e §11 sem subseções): trocar a fonte ou marcar "origem não localizada".
 DP-13 `NDVI_P90_Serie` (estimador atual) ou mediana dos máximos por safra (a justificativa física vale para esta).
 DP-14 TWI e `Curvatura_Perfil` saem sempre `indisponivel` no app (sem produtor de A_in/fluxo): implementar ou retirar do pré-registro.
 DP-15 Google Drive: a pasta é pública e de outra conta (R-H): restringir, tirar o ID do git, só então subir o ZIP; limpeza do histórico (já contém CAR).
 DP-16 Cifras de unidades efetivas do held-out (918, 920, 922, 923, 936): fixar "cerca de 920" derivado do cálculo.
 DP-17 Tour (`tourMetodologico.ts`): `decisaoId` e textos defasados (D01–D19, K por classe 0,0052…0,0518 e `default: 0.020`,
       "mais de 15 preditores", "BSI>0.10"): o executor corrige só fórmulas e números verificáveis (U11); atribuição e redação são do pesquisador.
 DP-18 Ponte de covariáveis por CÉLULA: o alvo de D26 é por célula de 10 m (~36.000 células), mas o app e o GEE só medem covariáveis por
       PONTO (`PontoAmostral`); nada liga as células do anexo `fracao_erodida_celulas_referencia.py` a Sentinel-2/terreno/K/R, e o executor
       não liga o GEE (R13). Decidir onde essa extração roda (script GEE do pesquisador) e o contrato do CSV que o avaliador consome.
 DP-19 Selos de proveniência que não correspondem ao cálculo: K de fallback = ponto médio exato da faixa da classe, selo `tabelado`
       (`fatorK.ts:67-91,340-347`); acumulados de CHIRPS/IMERG `medido` (D13(a) manda `modelado` para equação sobre satélite);
       `fatorLS.ts:319,327` grava "EPSG:31982" sem calcular nele; P = 1 por padrão com selo `tabelado` satisfaz o Invariante 1
       (`linhaDeBase.ts:44-52,75,126`); tabela única de classes de K (a classe "extremamente alta" é aceita em
       `embrapaSoilClient.ts:503` e rejeitada em `fatorK.ts`); `calcularNdvi`/`calcularBsi` devolvem 0 ou truncam em ±1
       (`serieTemporal.ts:51,53,78,80`). O executor NÃO muda selo nem classificação.

════════════════════════════════════════════════════════════════════════════════════════
4. ERRATA DO PROMPT DE CORREÇÃO (prevalecem sobre ele)
════════════════════════════════════════════════════════════════════════════════════════
E1. C22 (iii) e o Relatório Parte 2 citam `scripts/gerar_manual_pdf.py:282,948`. A linha 282 é
    `plt.tight_layout()`; a frase "35 suites / 231 testes vitest" está APENAS em `:948`.
E2. C20 e C27: a âncora `amostragemBiofisica.ts:62-90` deve ser `:62-88` (o arquivo tem 88 linhas); reabra o arquivo.
E3. C10: o `grep` de REPRODUZIR precisa de `-r` (`grep -rnE ... src/gee ...`) para varrer diretórios.
E4. C23: o padrão de `grep` do REPRODUZIR é ruidoso. Use, por arquivo e sem `-E` genérico:
    `grep -nE "(area_total|perc_det|mun_ibge|area|mod_fiscal) *= *(0\.0|100\.0|0)\b" <arquivo>`
    e confira linha a linha com as âncoras do bloco.
E5. C02 (aceite): `grep -rnE "\.(skip|todo|only)\(" src` não discrimina. Aceite correto:
    `git diff 4834cf0..HEAD -- 'src/**/*.test.ts' | grep -E '^\+.*\.(skip|todo|only)\('` -> vazio
    (nenhum skip/todo/only ADICIONADO). ATENÇÃO: hoje NÃO existe nenhum arquivo `*.vivo.test.ts`
    (`git ls-files | grep -c vivo.test.ts` -> 0); a convenção só existe em `vitest.config.mts:10`
    (exclude) e `package.json:17` (`test:vivo` = `vitest run --include 'src/**/*.vivo.test.ts'`).
    Como o `exclude` do config pode prevalecer sobre o `--include` da linha de comando, ao criar o
    primeiro `*.vivo.test.ts` PROVE que `npm run test:vivo` o coleta (a saída deve listar o arquivo
    e falhar com a mensagem "dado local ausente: <caminho>"). Se não coletar, crie
    `vitest.vivo.config.mts` (include só `*.vivo.test.ts`, sem exclude) e aponte `test:vivo` para
    ele; relate a mudança.
E6. C16 conflita com `src/lib/drone/planoVooNControl.test.ts:600-655`: o teste REESCREVE em
    `docs/verificacoes/voo_ncontrol/` os arquivos `SINTETICO_NAO_VOAR_*` (nomes fixos, `.plan`,
    CSV, PDF, relatório JSON) a cada execução, e lê os CSV existentes (`:520-535`) para manter os
    códigos opacos estáveis. Execute N01 ANTES de C16. Em C16 use a opção "marcador DENTRO do JSON"
    (campo de topo `"__SAREL_AVISO__": "SINTETICO_NAO_VOAR"` que o QGroundControl ignora) em vez
    de renomear a extensão; se o QGC rejeitar campo desconhecido NÃO é verificável aqui: relate.
E7. C18: não gere o PDF em dois lugares (DEC-13). C17: regerar as 5 figuras exige matplotlib; se
    ausente, relate sem regerar.
E8. C13: o `.md` é espelho; o teste de paridade compara id e estado de D01..D26 e P01..P09. Ao
    acrescentar P20..P24 (DEC-7 e N09) e P10/P11 (anexos), regere o `.md` antes do teste.
E9. C09: use o vocabulário canônico para o rótulo ORDINAL e a função única de N02 para o binário; por isso C09 roda DEPOIS de N02 (Fase 4).
E10. C30 é executado DEPOIS de N13 (kappa indefinido vira `null`: exceção à regra "não mudar números de saída").
E11. C19 e U07, C20 e U06, C22/C03 e U08 tocam as mesmas linhas: em F5 o bloco C faz a mudança; em F6 o bloco U só VERIFICA e registra "feito em Cxx" (não edite duas vezes).

════════════════════════════════════════════════════════════════════════════════════════
5. FASES E ORDEM
════════════════════════════════════════════════════════════════════════════════════════
Cada fase termina com `npm run typecheck`, `npm run lint` e `npm run test` (cole as saídas) e
com `sha256sum -c` dos 5 hashes de R10.

FASE 1 — baseline confiável:  C01, N01, C02.
FASE 2 — bloqueiam a função:   C03, N14 (depois de C03), N13, C04, C05, N07 (sítios de aferição: opção c), N10 (sorteio D16: 72 × 5,02 ha).
FASE 3 — bloqueiam a dissertação: C06, C07, C08, C10 (+ DEC-16), C11, C12, N08 (LS), N09 (Fator R), N11, N12, N16, N17.
FASE 4 — contrato de dados e emendas: N02 (usa N11), C09 (depois de N02), C13 (gerador do .md e teste de paridade: ANTES de N06),
          N06 (emendas aceitas), N03 (script D25).
FASE 5 — interpretação:        C14, C15, C16 (com E6), C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, N15.
FASE 6 — front-end (N04; verifica o que a F5 já fez, E11).
FASE 7 — cosmético e fechamento: C28, C29, C30 (depois de N13), N05 (conferência final).
Blocos que a seção 3 manda NÃO EXECUTAR: registre "não executado: aguarda DEC-n".
Verificações V1..V13: rode só as que NÃO exigem dado local, credencial ou ação do pesquisador
(V8, V11 e a parte estática de V6); as demais ficam "não rodada" com o motivo.

────────────────────────────────────────────────────────────────────────────────────────
N01 (A55) — o teste de voo reescreve arquivos versionados
────────────────────────────────────────────────────────────────────────────────────────
ACHADO. `src/lib/drone/planoVooNControl.test.ts:600-655` grava, a cada `npm run test`, 7 arquivos
  em `docs/verificacoes/voo_ncontrol/` (dois `.plan`, três CSV, um PDF e o relatório
  `relatorio_aceitacao_y1_y6_2026-09-29.json`). Um teste que altera arquivo versionado torna a
  suíte não hermética e pode mascarar divergência.
REPRODUZIR. `npx vitest run src/lib/drone/planoVooNControl.test.ts; git status --porcelain
  docs/verificacoes/voo_ncontrol; git diff --stat docs/verificacoes/voo_ncontrol`. Cole a saída
  (pode ser vazia se o conteúdo for idêntico: relate isso; o defeito é o ato de escrever).
MUDANÇA. O teste passa a escrever em um diretório temporário (`fs.mkdtempSync(path.join(os.tmpdir(),
  "sarel-voo-"))`) e a COMPARAR com os arquivos versionados (hash), sem sobrescrevê-los. A
  regeneração dos arquivos versionados só ocorre com a variável de ambiente
  `SAREL_REGERAR_VOO=1` (documente no README, seção de testes). A leitura dos CSV existentes
  (`:520-535`) permanece (códigos opacos estáveis). Não mude o conteúdo gerado.
ACEITE. Após `npm run test`, `git status --porcelain docs/verificacoes` -> vazio. Teste novo:
  sem a variável, nenhum arquivo de `docs/verificacoes/voo_ncontrol/` tem mtime alterado.

────────────────────────────────────────────────────────────────────────────────────────
N02 — Contrato de dados D16/D26 no código (DEC-3c, DEC-4a, DEC-1, DEC-5)
────────────────────────────────────────────────────────────────────────────────────────
ACHADO (A27, A29, A37, A26). `src/lib/matriz/montagem.ts:196-197` envia todo rótulo de drone para
  `heldOutDrone`; a matriz de treino é por PONTO, não por célula; `Classe_Alvo_Binaria` é decidida
  por substring; há 4 binarizações divergentes (`montagem.ts:139-148`, `InspetorPonto.tsx:65`,
  `ingestaoColetor.ts:215-222`, trainer); não há arquivo de held-out nem coluna de polígono. D16 e
  D26 (decididas) mandam: rótulo de VANT contínuo por célula de 10 m, treino e held-out por polígono.
PASSO 1 (testes primeiro, devem FALHAR): crie `src/lib/rotulos/binarizacao.test.ts` e
  `src/lib/matriz/montagemD16.test.ts` afirmando o contrato abaixo. Cole a falha.
PASSO 2 (implementação):
  (a) `src/lib/rotulos/binarizacao.ts` — ÚNICA fonte de binarização, exporta:
      `LIMIAR_FRACAO_D26 = 0.25`; `binarizarFracao(f)` (f em [0,1] e finito; `>=` 0.25 → 1; f fora de
      faixa ou NaN → lança erro, NUNCA 0); `binarizarOrdinal(classe)` pelo vocabulário canônico de
      `CLASSES_ROTULO_VALIDAS` (`concordancia.ts:165`): ausente→0; incipiente|moderada|severa→1;
      aliases legados exatos ("presente","erosao","erosão","1")→1; qualquer outro texto → lança
      `ErroRotuloInvalido`, INCLUSIVE "controle", "spd" e "0", que `CLASSES_ROTULO_VALIDAS` aceita mas D03 não
      mapeia (DP-10): NÃO altere `CLASSES_ROTULO_VALIDAS`; liste no relatório onde `validarRotulo` ainda os aceita. Comparação EXATA após normalizar caixa/acentos/espaços.
      Os 4 pontos antigos passam a chamar estas funções. Além disso: `ingestaoColetor.ts:208-218` hoje descarta em silêncio fração fora
      de [0,1] ou não numérica (vira `undefined` e o binário cai para o texto da classe): passa a REJEITAR o rótulo com motivo registrado;
      `InspetorPonto.tsx:65` binariza a partir do valor ARMAZENADO (`toFixed(3)`), nunca do valor bruto (0,2496 gravado como 0,250 daria 1).
  (b) Tipos: `LinhaMatrizTreino` ganha `celulaId`, `poligonoId`, `papelConjunto`
      ("treino"|"held-out"), `estratoId` (SOMENTE na matriz de avaliação, nunca como preditor),
      `fracaoErodida` (number|null), `alvoBinario25` (0|1|null), `rotuloNObservadores` (number|null).
      `estratoId` e `poligonoId` NÃO são preditores (DEC-17: `poligonoId` = `codigoOpacoVant`; `celulaId` e `pixelId` opacos; `Pixel_ID` entra nas chaves permitidas; `Grade_X`/`Grade_Y` e coordenadas NUNCA em exportação): o script D25 só consome as colunas declaradas
      em `blocos`. Atualize `CAMPOS_PROIBIDOS_MATRIZ_TREINO` (invariantes.ts) de modo que
      `Poligono_ID`, `Papel_Conjunto`, `Estrato_ID`, `Celula_ID`, `Pixel_ID` sejam permitidos como CHAVES,
      mantendo proibidos: coordenadas, fundiário, `phi*`, perda de solo, `RUSLE_A`, C, P.
  (c) `montarMatrizTreino`: rótulo de modalidade "drone" deixa de ir sempre a held-out: vai para
      `linhas` se `papelConjunto === "treino"` e para `heldOut` se `"held-out"`; `"indisponivel"`
      → EXCLUSÃO REGISTRADA em `exclusoes` com motivo (nunca silencioso). `assegurarSegregacaoTreino`
      passa a garantir que um MESMO `poligonoId` nunca esteja nos dois conjuntos (lança se estiver).
      Rótulos de campo (D03) entram só como âncora/confirmação: modalidade "campo" NUNCA vai ao
      treino do modelo de D26 (D16: campo = âncora de prevalência e confirmação prospectiva).
      Reabra `ingestaoDrone.ts` e `rotulos.test.ts`/`montagem*.test.ts` e liste cada teste que
      assertava "drone sempre held-out" com o novo texto.
  (d) `perfis.ts`: `matriz-treino` ganha `Celula_ID`, `Poligono_ID`, `Papel_Conjunto`,
      `Fracao_Erodida`, `Alvo_Binario_25`, `Rotulo_N_Observadores`, `RUSLE_Fator_LS` e as 4 métricas de
      SÉRIE do pré-registro proposto: `Composto_Solo_Nu_B12`, `Composto_Solo_Nu_Razao_B4_B2`,
      `Taxa_Degradacao_SWIR_Anual`, `NDVI_P90_Serie` (origem "modelado"; `indisponivel` com causa
      quando ausentes). Elas já são calculadas por `src/lib/gee/compostoSoloNu.ts` (função
      `extrairMetricasSoloExposto`, `:65`; campo `compostoSoloNu`, `:42,:200`) e `persistenciaTemporal.ts`
      (`taxaDegradacaoSwirAnual`, `ndviMaximoMediano` = P90 da série; com `null` de N11 → `indisponivel`, causa "insuficiente"; execute N11 ANTES); a razão B4/B2 é
      derivada do composto (ambos os termos presentes e B2 > 0; senão indisponível). Se o modelo do ponto
      (`src/types/ponto.ts`) não guardar esses valores, ACRESCENTE campos `Proveniencia<number>` e a
      projeção; NÃO ligue o GEE (R13). NÃO exporte `regime`/`confianca` de `analisarPersistenciaTemporal`
      (classificação por limiares = quase-rótulo, Regra 4) nem `maiorSequenciaSoloNu` ou
      `mesModalExposicao` como preditores. NÃO ganha C, P, perda, A. Novo perfil `matriz-heldout` (mesmas colunas; só linhas held-out) exportado em
      arquivo SEPARADO (`ExportModal` e `planilha.ts`/`csv.ts` conforme o padrão dos outros
      perfis). O perfil `matriz-treino` NUNCA contém linha held-out (teste).
  (e) DEC-5: se existir par de rótulos com 2 observadores e κ < 0,60, a exportação de
      `matriz-treino` e `matriz-heldout` é RECUSADA com mensagem que lista os pares; observador
      único é aceito e marcado. A ausência de κ não bloqueia.
  (f) Linha de base: crie `perfil "linha-de-base-rusle"` com `Celula_ID`, R, K, LS, C, P, `Marcador_K_Ambiguo_D08`, `RUSLE_A`
      = produto SOMENTE se os 5 fatores estiverem `medido|modelado|tabelado`; qualquer fator
      `indisponivel` → `RUSLE_A` vazio (nunca 0). Hoje R e LS saem indisponíveis (A38): o arquivo
      sai com `RUSLE_A` vazio e o relatório de exportação diz isso.
ACEITE. Os testes do PASSO 1 passam; `grep -rn "includes(\"erosao\")" src/lib/matriz` -> vazio;
  `git grep -nE ">= *0\.25|>= *0,25" -- src ':!*.test.ts'` -> só `binarizacao.ts`, o limiar de FREQUÊNCIA Ê de
  `persistenciaTemporal.ts:65,76` (outro 0,25, não é binarização) e comentários; NÃO podem sobrar `InspetorPonto.tsx:65,304,309`,
  `ingestaoColetor.ts:217` nem `types/rotulo.ts:27` (hoje casam); suíte inteira verde exceto os 3 arquivos de dados locais (C02).

────────────────────────────────────────────────────────────────────────────────────────
N03 — Pipeline estatístico D24/D25/D26 (DEC-14c, DEC-15c)
────────────────────────────────────────────────────────────────────────────────────────
PASSO 1. Crie `scripts/d25/` e copie, byte a byte, de `docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/`:
  `avaliacao_d25_referencia.py`, `fracao_erodida_celulas_referencia.py`,
  `test_avaliacao_d25_referencia.py`, `test_fracao_erodida_celulas_referencia.py`,
  `config_pre_registro_PROPOSTA.json`. O avaliador aceita `--linha-de-base <csv do perfil
  linha-de-base-rusle>` (junta por `Celula_ID`: `RUSLE_A` e `Marcador_K_Ambiguo_D08`) e a grade
  pré-registrada de p e de hiperparâmetros em `cfg["grade"]`. Confira os SHA-256 com `sha256sum -c`. Crie
  `scripts/d25/requirements.txt` (numpy, pandas, scipy, scikit-learn, xgboost, shapely, pyproj) e
  `scripts/d25/LEIA-ME.md` (3 parágrafos: o que é, que NÃO é evidência com dado sintético, como rodar).
PASSO 2. `cd scripts/d25 && python3 -m unittest discover -s . -p "test_*.py"` -> OK, 49 testes (cole).
PASSO 3. Prova de recusa (cole as saídas, exit != 0):
    python3 scripts/d25/avaliacao_d25_referencia.py --saida /tmp/x                    # sem --dados
    python3 scripts/d25/avaliacao_d25_referencia.py --dados a --config b --saida /tmp/x   # sem modo
PASSO 4 (pacote ZIP, A46). `pacoteReprodutibilidade.ts:679-823` embute um script de treino
  diferente (GroupKFold ≤3). Gere `src/lib/export/scriptAvaliacaoD25.generated.ts` por um script
  versionado `scripts/gerar_script_pacote.mjs` que lê `scripts/d25/avaliacao_d25_referencia.py` e
  exporta `SCRIPT_AVALIACAO_D25` (string) e `SCRIPT_AVALIACAO_D25_SHA256`. O ZIP passa a conter
  `05_avaliacao_d25.py` com esse texto e `requirements.txt`; o manifesto SHA-256 (`06_...`) continua
  sendo gerado pela mesma rotina. Teste: o conteúdo da constante é IGUAL ao arquivo (hash) e o
  ZIP gerado em teste lista `05_avaliacao_d25.py`.
PASSO 5 (legado, DEC-14c/DEC-7). Em `scripts/treinar_xgboost_loco.py`: banner DEPRECATED no
  docstring; recusa de modo probatório (`PROBATORIO_CIENTIFICO` → `sys.exit(2)` com mensagem
  apontando `scripts/d25/`); `auc = 0.5` em falha (`:691-692`) → `float("nan")` + motivo no log.
  Não remova o dry-run. Mantenha C04 e C12 como descritos.
PASSO 6 (guarda). Teste TS/Python que falha se alguém reintroduzir imputação por mediana FORA de
  `scripts/d25/` no caminho probatório (varredura de texto `fillna(` / `median(` em `scripts/*.py`
  fora de `scripts/d25` e do legado deprecado, com lista fechada de exceções).
O avaliador (versão de 09/10) verifica o hash do pré-registro (`hash_config`: JSON canônico da configuração SEM a chave
  `pre_registro`), grava a TRAVA antes do ajuste (uma segunda ao lado do arquivo de dados), recusa alvo/chaves/`Pixel_ID` como
  preditor, chave de monotonicidade inexistente e preditor 100% ausente ou constante, e usa só células `Incluida`.
LIMITES. NÃO rode o avaliador em modo `--probatorio`. NÃO apague nenhuma `*.TRAVA*.json`. NÃO preencha `pre_registro`. NÃO crie nem
  edite `config_pre_registro.json` (o pesquisador o congela). Resultado de `--dryrun-sintetico` é
  só teste de encanamento.
ACEITE. Passos 2 e 3 com saída colada; `git grep -n "KFold(" -- scripts ':!scripts/d25'` mostra
  só o legado deprecado; hashes R10 iguais.

────────────────────────────────────────────────────────────────────────────────────────
N04 — Front-end (medido em 06/10/2026 sobre cópia do app com patch só de build)
────────────────────────────────────────────────────────────────────────────────────────
INSTRUMENTO. `docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/verificar_ui.cjs`
  (Playwright). Depois de C01, rode `npm run dev` (porta 3000) e, com `NODE_PATH` apontando para o
  `node_modules` global do Playwright (ou `npm i -D playwright` FORA do repo, não versionado):
    node docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/verificar_ui.cjs http://127.0.0.1:3000 /tmp/ui_antes.json
  Esperado HOJE (medido na cópia): 21 falhas (lista abaixo; a guarda "Padrão-Ouro 10-50" daquela medição nunca casava e foi corrigida
  no anexo: o número real pode ser 22-23 se a legenda "Sítios Padrão-Ouro" aparecer; relate o número e a lista). Se `npm run dev` não subir, PARE.
  Falhas medidas: cabeçalho com botões fora da tela em 1440/1280/1024/768/390 px ("Exportar" e
  "Configurações…" ficam fora da tela já em 1440 px); 4–5 alvos < 24×24 px em todas as larguras;
  5 modais sem `role="dialog"`; controles sem nome acessível (Amostragem GEE: 7; Campanha, Matriz,
  Exportar: 1 cada); texto "Calcular Métricas Matriciais" sem selo; "10 invariantes" no modal da Matriz.
U01 Cabeçalho (`src/app/page.tsx` e o componente de cabeçalho): nenhum controle interativo pode
    ficar fora da janela em 390..1440 px e a página não pode ter rolagem horizontal. Implementação
    livre dentro de: quebra de linha OU menu "Mais ações" acessível por teclado (botão com
    `aria-expanded`, `aria-controls`). Em ≤768 px mostre rótulos curtos ou só ícones COM `aria-label`.
U02 Modais (12 arquivos: `presentation/ModalExplicativaMetodologica`, `presentation/ApresentacaoSpotlight`,
    `polygon/DrawingToolbar`, `config/SettingsModal`, `matriz/PainelMatrizModal`,
    `campanha/PainelCampanhaModal`, `export/ExportModal`, `audit/AuditDossierModal`,
    `diagnostics/SystemLogsModal`, `decisoes/DecisoesModal`, `region/CandidateSelectionModal`,
    `region/RegionRequestModal`): contêiner com `role="dialog"`, `aria-modal="true"`,
    `aria-labelledby` apontando para o título; `Escape` fecha; o foco entra no modal ao abrir e
    volta ao botão de origem ao fechar; Tab não escapa do modal. Crie UM hook compartilhado
    (`src/hooks/useModalA11y.ts`) e use-o nos 12; não duplique lógica. (`DrawingToolbar` e
    `ApresentacaoSpotlight` podem não ser modais: abra, confirme, e só marque se forem.)
U03 Rótulos: todo `input/select/textarea` ganha `<label htmlFor>`/`id` ou `aria-label`; botões só
    com ícone ganham `aria-label`. Alvo mínimo 24×24 px (WCAG 2.2, critério 2.5.8).
U04 Textos que contradizem decisões REGISTRADAS (troque por valor derivado de constante ou remova o
    número; não invente): 
      `region/CandidateSelectionModal.tsx:335-341` ("Fase D — VANT/Drone (Held-Out) 4 Sítios (~198,5 ha)
        ... GSD 7,5 cm") → D16: 72 polígonos de 5,02 ha, ~361 ha, 36 treino + 36 held-out, GSD ~4 cm;
      `campanha/PainelCampanha.tsx:373,456` ("GSD ~3,8 cm") e `map/MapViewer.tsx:244,514,709`,
        `map/MapControls.tsx:154` ("Sítios Padrão-Ouro ... 10 a 50 ha") → são as MISSÕES DE AFERIÇÃO
        (D06: GSD medido 3,59 e 3,96 cm); rotule-as como "missões de aferição instrumental", não
        como "padrão-ouro", e use "GSD 3,59–3,96 cm (medido)";
      `decisoes/CalculadoraDesenhoAmostral.tsx:252` ("1.845 (922 held-out)" fixo) → ler do cálculo
        (`saidas.*`), nunca literal; relate as CINCO cifras do held-out que coexistem: 918 e 936 (`decisoes.ts:316,329`),
        920 (emenda E-D24), 922 (`CalculadoraDesenhoAmostral.tsx:252`) e 923 (`src/lib/fundiario/calculadoraDesenho.ts:33`,
        `round(1845·0,5)`) (DP-16; ressalva R-A). `PainelCampanha.tsx:379-380` e `PainelCriterioRefutacaoD25.tsx:56-66`
        entram em N15.
    A UI de partição 80/20 (40 pts Fase A / 10 pts Fase B) do `CandidateSelectionModal`: se não
    houver constante de D16 que a sustente (D16 fala em 60–80 pontos de campo e fotointerpretação
    aposentada), marque o bloco como "PARÂMETRO DE TRIAGEM, não é D16" e relate a divergência.
U05 `InspetorPonto.tsx:34`: `fracaoErodidaInput` inicia em 0,0 e permite gravar rótulo "ausente"
    sem ação do perito. Inicie `null`, exija interação explícita e desabilite "Gravar" até haver valor
    e data da observação (C25). Teste de componente/texto.
U06 Legenda do mapa: "Erosão (Classe 1)" / "Controle / SPD (Classe 0)" com limiares → "Candidato
    espectral (BSI/NDVI) — não é rótulo" (C20), inclusive `MapViewer.tsx:351,637` e a legenda.
U07 `PainelCampanha.tsx:267-300,543-581` (C19) — selo DEMONSTRAÇÃO nos cartões e no botão.
U08 `PainelMatrizModal.tsx:25` (C22/C03) — número de invariantes lido do código.
U09 Modo Defesa/Tour: confirme que `Escape` e o botão fecham o Tour e que o foco volta; se o banner
    persistir após fechar, corrija (reproduza antes: a sonda mostrou o banner "MODO DEFESA /
    APRESENTAÇÃO ATIVO" presente em capturas seguintes; confirme com 1 teste antes de editar).
U10 Estados vazios e erros: nenhum painel mostra número ou métrica sem origem; "—" ou texto de
    ausência com causa. Procure `?? 0`, `|| 0`, `.toFixed(` aplicado a valor possivelmente nulo
    em `src/components` (`grep -rnE "\?\? 0|\|\| 0" src/components`) e relate cada ocorrência
    (corrija só as da lista de C06/C07).
U11 `src/config/tourMetodologico.ts:118-130` (o LS está em `:122-127`) exibe "Moore & Burch" `(A_s/22,13)^0,4 · (sen θ/0,0896)^1,3`, que NÃO é a fórmula de D15; o texto do Tour deve mostrar o LS de D15 (bloco N08, item 4).
    Corrija TAMBÉM só o que é verificável sem decisão: "D01 a D19" (`:452,459,468,488`) → "D01 a D26" (`DecisoesModal.tsx:41` já diz D26);
    "mais de 15 preditores" (`:406`) → "até 14 (D24); o pré-registro propõe 10"; o código de Kappa exibido (`:375-382`, ver N13);
    K por classe (0,0052…0,0518) e `default: return 0.020` (`:317,327-336`): se contradizem D14, troque por "ver D14 (`k_solos` e faixa por classe)"
    sem inventar valor. NÃO reatribua `decisaoId` (`:101,147,259,343,442`) nem reescreva a prosa metodológica (DP-17); LISTE-as no relatório.
ACEITE N04. `node .../verificar_ui.cjs http://127.0.0.1:3000 /tmp/ui_depois.json` -> "UI OK" e exit 0
  (cole o texto e o JSON de medidas). Capturas de tela em 1440 e 390 px de cada modal, salvas em
  `/tmp/ui_shots/` (fora do repo), e descreva em 1 frase o que vê em cada uma. O mapa base pode
  estar em branco sem internet: isso não é falha. Se uma largura não puder passar, PARE e explique.

────────────────────────────────────────────────────────────────────────────────────────
N08 — Fator LS: área de contribuição ausente não é zero; citações e texto do Tour (A56)
────────────────────────────────────────
ACHADO. (1) `src/lib/rusle/fatorLS.ts` (`calcularFatorLS`) converte `areaContribuicaoMontanteM2` ausente ou não
  numérica em `0.0` (A_in = 0, célula de divisor de águas), com o comentário "permitido:" (isenção por texto livre, A06):
  sem acumulação de fluxo o L sai como o de uma crista e o LS sai SUBESTIMADO, com selo de valor calculado (Regras 1 e 5).
  (2) O cabeçalho cita "Desmet & Govers (1996, Eq. 2)" para o fator L; no artigo é a Eq. (9) (Eqs. 6-8 são passos; a Eq. 2
  distribui o fluxo). (3) O cabeçalho diz "VERIFICADO 2026-10-01 — evidência: …/desmet1996/saida_extracao_desmet_1996.txt":
  aquela extração foi feita sem o artigo; o PDF só foi arquivado em 09/10/2026. (4) `src/config/tourMetodologico.ts:118-130`
  mostra ao usuário o LS de Moore & Burch, não o de D15.
REPRODUZIR. Sonda R-TS: `calcularFatorLS({ declividadeGraus: 8 })` SEM `areaContribuicaoMontanteM2` -> devolve LS finito
  (hoje); `git grep -n "Eq. 2" -- src/lib/rusle/fatorLS.ts`; `grep -n "permitido:" src/lib/rusle/fatorLS.ts`;
  `sed -n 118,130p src/config/tourMetodologico.ts` (cole tudo).
MUDANÇA. (a) `areaContribuicaoMontanteM2` passa a ser OBRIGATÓRIA e finita: `undefined`/`null`/NaN → `ErroForaDoDominio`
  (ou `indisponivel` com causa "insuficiente", conforme o padrão do chamador em `linhaDeBase.ts`); `0` EXPLÍCITO continua
  válido (divisor de águas). Remova o comentário "permitido:" e ajuste os chamadores e testes. (b) Troque "Eq. 2" por
  "Eqs. 6 a 9 (p. 429); x na p. 428" e, onde o texto define x, acrescente "x = |sen α| + |cos α| (leitura do implementador;
  o artigo imprime sen α + cos α, p. 428)". (c) Troque a linha VERIFICADO por "VERIFICADO 2026-10-09 — evidência:
  docs/verificacoes/fontes/desmet1996/desmet_govers_1996_jswc.pdf (pp. 428-429)". (d) No Tour mostre o LS de D15 (L pela
  Eq. 9, m pela Eq. [4-2]/[4-3] e S pelas [4-4]/[4-5] de Renard) em vez de Moore & Burch. NÃO altere m, S, β nem 22,13.
ACEITE. Testes novos em `fatorLS.test.ts` (valores calculados na sessão de 09/10/2026; teste de encanamento, não evidência):
  m(9 %) = 0,5012; S(tan θ = 0,09) = 1,0059; S(tan θ = 0,0899) = 0,9970; m(12 %) = 0,5457 e S(12 %) = 1,5016;
  L com A_in = 0, D = 30 m, x = 1 e m(9 %): 1,1647 (com m = 0,5: 1,1643); L com A_in = 900 m², D = 30, x = 1, m(9 %):
  2,1324; A_in ausente → erro/indisponível; `grep -n "permitido:" src/lib/rusle/fatorLS.ts` -> vazio;
  `git grep -n "Moore & Burch" -- src/config/tourMetodologico.ts` -> vazio (ou texto explicitamente "ilustração").
  Suíte `src/lib/rusle/*.test.ts` verde.
NOTA (A_in sem produtor). `git grep -n "areaContribuicaoMontanteM2" -- src ':!*.test.ts'` só acha `fatorLS.ts:61,230-232`: NENHUM módulo
  produz a área de contribuição (`reduzir_terreno_copernicus.py` devolve `acumuloFluxo: indisponivel`). Depois deste bloco o LS é
  `indisponivel` até que D15 tenha implementação de fluxo; o Tour e os manuais devem dizer isso. NÃO produza A_in e NÃO invente
  teto para L (sem teto, A_in = 9·10⁶ m² dá LS ≈ 644 a 8°; o domínio de A_in é decisão do pesquisador).

────────────────────────────────────────
N09 — Fator R: coeficientes de Rufino (Região 1), fator 9,81 e teste de reprodução (D13; A57)
────────────────────────────────────────
ACHADO. `src/lib/rusle/fatorR.ts` devolve R `indisponivel` (os coeficientes a = 107,52 e b = 46,89 foram retirados em
  02/10/2026 por não terem fonte: correto). Com Rufino et al. (1993) lido, o par para a BP3 (Região 1) é a = 18,64 e
  b = 5,73. A climatologia `docs/verificacoes/climatologia_chirps_bp3.json` traz 6 estações com `rReferenciaWaltrick`; a de
  Medianeira (11.400) NÃO está no Quadro 1 de Waltrick (A57).
REPRODUZIR. `grep -n "107,52\|46,89\|indisponivel" src/lib/rusle/fatorR.ts` (cole). Depois, em Python sem dependências, para cada
  estação de `estacoesReferenciaBP3` (exceto Medianeira), com `p` = `serieCompleta1981_2025.climatologiaMensalMediaMm` e `P` = Σp:
  `R = 9.81 * sum(18.64 + 5.73 * pm*pm / P for pm in p)`; razão a `rReferenciaWaltrick` esperada: 0,912 (Toledo), 0,990 (Cascavel),
  0,976 (Santa Helena), 0,974 (Foz do Iguaçu), 0,997 (Palotina). E rode `python3 scripts/pluviometria/ler_iat.py` seguido de
  `python3 scripts/pluviometria/r_rufino_vs_waltrick.py` (cole as 3 últimas linhas: mediana 9,8100; "12" estações com |dif| < 0,1%). ATENÇÃO:
  os dois scripts REGRAVAM CSV em `docs/verificacoes/`; depois rode `git status --porcelain docs/verificacoes` (esperado: vazio, saídas
  idênticas) e, se divergirem, `git checkout -- docs/verificacoes/pluviometria_iat_*.csv docs/verificacoes/r_rufino_*.csv` e relate.
MUDANÇA. (1) Em `fatorR.ts` acrescente a tabela `COEFICIENTES_RUFINO_1993` SOMENTE com a Região 1 (a 18,64; b 5,73; fonte
  "Rufino et al. (1993), Quadro 2, p. 443"); as regiões 2 a 8 NÃO entram (Quadro 2 e Figura 2 divergem; retorno
  `indisponivel`, causa "regiao-nao-implementada"). (2) Constante nomeada `FATOR_UNIDADE_RUFINO = 9.81` com o comentário
  "REPRODUZIDO nos dados (pluviômetros IAT 1986-2008 reproduzem Waltrick 2015, Quadro 1, a <0,3% em 12 estações); origem física
  (g, kgf.m -> J) é hipótese, não consta de fonte lida; a equação impressa com p e P em mm dá ≈ 1/9,81 do R (D13)". (3) A função
  devolve R = FATOR_UNIDADE_RUFINO × Σ_{m=1..12} (a + b · p_m² / P), P = Σp_m, onde p_m são as MÉDIAS MENSAIS DA SÉRIE (climatologia),
  exigindo 12 valores finitos e não negativos e P > 0 (senão `indisponivel`, causa "insuficiente"); fora do envelope de
  `src/config/areaInteresse.ts` devolve `indisponivel`, causa "fora-do-dominio" (a região só foi verificada para a BP3, e o escopo
  BP3 é escolha de praticidade declarada). Proveniência "modelado", `tabela` = "Rufino et al. (1993), Q2, Região 1, x 9,81
  (unidade reproduzida em pluviômetros IAT)"; a marca "pendente de verificação" PERMANECE (retirá-la é decisão do pesquisador).
  (4) NÃO edite o JSON de climatologia: registre no relatório que a referência de Medianeira não tem fonte; o teste a ignora. NÃO
  ligue R ao app nem à rota (DEC-6b); NÃO use dado de data única. (5) NÃO calcule Rc ano a ano: Waltrick usa médias da série.
  (6) REMOVA `TABELA_CONFERENCIA_CRUZADA_BP3`, `CLIMATOLOGIA_CHIRPS_BP3_ESTACOES`, `obterPrecipitacaoClimatologicaChirps` e
  `COEFICIENTES_TESTE_CALIBRACAO` (`fatorR.ts:94,111,169,256-284`): são precipitações mensais sem fonte, 5% a 21% acima da
  climatologia medida (Toledo: P = 1.820 mm contra 1.504 no JSON; R sairia 4% a 7% acima de Waltrick), e o par 107,52/46,89 é a
  Região 6, errada para a BP3. Reescreva `fatorR.test.ts` (R6, lista antes/depois) para ler
  `docs/verificacoes/climatologia_chirps_bp3.json`. (7) `InsumoFatorR` (`:49-58`) passa a EXIGIR `periodoInicio`, `periodoFim`,
  `nAnosSerie` e coordenadas dentro do envelope (`:295-326` hoje só checa o domínio se lat/lon vierem); sem eles, ou com
  `nAnosSerie < MIN_ANOS_SERIE_R`, devolve `indisponivel` (causa "insuficiente"). `MIN_ANOS_SERIE_R = 20` é PROPOSTA do redator
  (Waltrick usou 23 anos; registre P24 "proposta" em N06): o vetor mensal de 2022 do JSON (`criterioAceiteAno2022`) com
  `nAnosSerie: 1` DEVE ser recusado (sem a guarda, R sai 12% a 53% acima da climatologia). `FAIXA_FISICA_R_PARANA` (`:104`, sem fonte)
  deixa de ser usada como validação ou ganha comentário "sem fonte; não barra nada".
TESTES (valores calculados em 09/10/2026; teste de encanamento e de regressão, NÃO critério de aceitação científica): (i) com a
  climatologia CHIRPS existente, razão R_calculado / R_Waltrick nas 5 estações dentro de ±0,005 dos valores acima; (ii) com
  `docs/verificacoes/pluviometria_iat_mensal.csv` (médias 1986-2008 de anos completos), R das estações 2453003 (Palotina, exp.),
  2453023 (Cascavel-OCEPAR), 2454006 (Terra Roxa), 2554002 (Salto Cataratas), 2554006 (São Miguel do Iguaçu), 2553010 (Santa Izabel
  d'Oeste) dentro de ±0,5% de 10436, 11588, 10415, 11037, 10701, 11573 (Waltrick, Quadro 1); (iii) o CSV
  `ANEXOS…/waltrick2015_quadro1_R_anual.csv` tem 114 linhas, mínimo 5449 e máximo 12581 e contém Toledo = 10623, Cascavel =
  11588, Foz do Iguaçu = 11037, Palotina = 10436 e NÃO contém Medianeira; (iv) 12 valores com P = 0 → `indisponivel`; vetor com
  11 valores → `indisponivel`; ponto fora do envelope → `fora-do-dominio`; (v) o antigo par 107,52/46,89 não aparece em
  nenhum arquivo versionado de `src/` (`git grep -n "107,52\|107.52" -- src` -> vazio, testes incluídos); (vi) TOLERÂNCIA FIXADA pelo pesquisador
  em 09/10/2026 (E-D13): constante de teste `TOLERANCIA_R_CHIRPS = 0.10` com esse comentário; a razão R_CHIRPS / R_Waltrick de cada
  uma das 5 estações está em [0,90; 1,10] (hoje 0,912 a 0,997); Medianeira fica de fora; (vii) vetor mensal de um ano com
  `nAnosSerie: 1` → `indisponivel`.
ACEITE. `npm run test` (rusle e chuva) verde; os cinco números do REPRODUZIR coincidem e estão colados; relatório final cita a
  tolerância ±10% como FIXADA pelo pesquisador (E-D13) e o fator 9,81 como REPRODUZIDO (fonte: Waltrick 2010, Tabelas 1.1-1.8; a razão física, g, não é declarada no texto).

────────────────────────────────────────
N06 — Emendas aceitas pelo pesquisador (decisões D02, D06, D09, D10, D13, D14, D15, D16, D24, D25)
────────────────────────────────────────────────────────────────────────────────────────
ACHADO. O pesquisador aceitou, em 06/10/2026, as emendas redigidas em
  `docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/EMENDAS_PROPOSTAS_2026-10-06.md`. Elas corrigem
  inconsistências numéricas, fecham a lacuna de D25 e registram o resultado da leitura bibliográfica de D13 e
  D15. Todas são anteriores a qualquer dado.
REPRODUZIR. `git grep -n "918 unidades\|NAO_PREVISTO\|Mannigel" -- src/config/decisoes.ts` (cole) e
  `grep -c "EMENDA DE 06/10/2026" src/config/decisoes.ts` -> 0.
MUDANÇA. Para cada emenda E-… do arquivo, na decisão indicada, ACRESCENTE o parágrafo EXATAMENTE como
  escrito ao FINAL do campo `valor` (ou `referencia`, onde o arquivo diz) como novo trecho da MESMA string,
  precedido de um espaço. Não apague nem reescreva texto original; não toque em `estado`, `decididoPor`,
  `decididoEm`. Um commit por decisão ("EMENDA D25: ..."). Depois: (a) regere `docs/planejamento/DECISOES.md`
  (bloco C13) e rode o teste de paridade; (b) acrescente P10 (expoente de Tweedie, grade {1,2; 1,5; 1,8}),
  P11 (cobertura mínima da célula, 0,95), P20..P23 (tolerâncias de DEC-7: 30 d, 45 d, 75°, 0,95) e P24 (mínimo de anos da série de R, N09) com
  `estado: "proposta"`, sem `valor`. (P12..P15 NÃO são usados: P12 já é a "proibição" citada em D14 e em 8 pontos de `src`.)
ACEITE. (1) ANTES de editar, gere `/tmp/decisoes_antes.json` com um script Node que importe `DECISOES` e
  `PARAMETROS` por `node --import ./scripts/ts-loader.mjs` e grave `{id: {estado, decididoPor, decididoEm, valor,
  referencia}}`; depois das emendas gere `/tmp/decisoes_depois.json` e rode um script Python que prove, para TODAS
  as decisões e parâmetros pré-existentes: `estado`, `decididoPor` e `decididoEm` idênticos; `valor` e `referencia`
  novos COMEÇAM exatamente com os antigos (prefixo); e só as 10 decisões listadas (D25, D24, D06, D16, D02, D09,
  D10, D14, D13, D15) mudaram, cada uma com `EMENDA DE 06/10/2026` presente. (2) `grep -c "EMENDA DE 06/10/2026"
  src/config/decisoes.ts` conta 10 parágrafos (ou 11 se D09 e D10 tiverem os dois campos). (3) P10, P11 e P20..P24 existem com
  `estado: "proposta"` e sem `valor`. (4) `npm run test` verde, incluindo o teste de paridade de C13.
LIMITE. Se o texto original de uma decisão tiver mudado e o parágrafo não fizer mais sentido, PARE e relate.

────────────────────────────────────────────────────────────────────────────────────────
N07 — Sítios de aferição: código CAR e perímetros reais FORA do git (DEC-10, opção c)
────────────────────────────────────────────────────────────────────────────────────────
ACHADO. `src/lib/padraoOuro/sitiosReferencia.ts` embute 4 códigos CAR de 43 caracteres (linhas 101, 377, 513,
  629) e os perímetros cadastrais de 4 imóveis rurais (Medianeira e Céu Azul); `docs/Delimitacao_Territorial_e_
  Selecao_Amostral_MultiEscala_BP3.md:120-123` repete os códigos; `scripts/gerar_manual_pdf.py` tem o prefixo
  "PR-41158". O pesquisador precisa da identificação do proprietário para a autorização de visita, mas SÓ na sua
  máquina: os bancos já estão no Google Drive e o instalador os baixa para `data/` (verificado:
  `scripts/download_gdrive_db.py:191-194` faz `extractall` do ZIP em `data/`; `gerar_zip_banco_gdrive.py` monta
  o ZIP). Importante: o instalador escolhe UM arquivo da pasta do Drive (ZIP de nome conhecido, senão o `.db`);
  se a pasta só tiver o `.db`, o arquivo local de sítios NÃO chega.
REPRODUZIR. `git grep -nIE "[A-Z]{2}-[0-9]{7}-[0-9A-F]{32}" -- . ':!*.pack'` -> 9 ocorrências (4 em
  `sitiosReferencia.ts`, 4 em `Delimitacao_…md`, 1 em `docs/legado/MANUAL_OPERACAO.md:187`, marcada "ex:"); e
  `git grep -nI "PR-4105309\|PR-4115803\|PR-41158" -- scripts docs src` (cole; `scripts/gerar_manual_pdf.py:233-237`). Não use
  `grep` em `.next/` (cache não versionado).
MUDANÇA (nesta ordem; um commit por passo; NUNCA imprima ou cole um código CAR completo no relatório):
  1. EXTRAIR para o arquivo local ANTES de esvaziar o módulo:
       node --import ./scripts/ts-loader.mjs docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/extrair_sitios_locais.ts
     (recusa sobrescrever; saída esperada: "[OK] 4 sítios gravados"). Confirme `data/sitios_referencia_local.json`
     e `.sha256` e que NÃO aparecem em `git status`.
  2. `.gitignore`: acrescente `data/sitios_referencia_local.json*` e prove com
     `git check-ignore -v data/sitios_referencia_local.json`.
  3. ESVAZIAR o módulo: em `sitiosReferencia.ts` remova `codigoCar`, `bbox` e `geometry` reais; cada sítio
     fica com metadados não identificantes (`id` "sitio-ouro-0n", `nomeIdentificador`, `municipio`,
     `baciaHidrografica`, `areaHa`, GSD, bandas, instrumento) e `identificadorOpaco: "CAR-OPACO-0n"`.
     Atualize a interface (sem `codigoCar`). O comentário de cabeçalho deixa de afirmar vínculo a "código
     imobiliário oficial" e diz que o dado real é local. `SITIOS_PADRAO_OURO_GEOJSON` deixa de existir no módulo.
  4. CARREGADOR LOCAL (servidor): `src/lib/padraoOuro/sitiosLocais.ts` exporta
     `carregarSitiosLocais(): { estado: "disponivel"|"indisponivel"; causa?: string; sitios: SitioLocal[] }`.
     Lê `data/sitios_referencia_local.json` (caminho configurável por `process.env.SAREL_DATA_DIR`, para teste),
     valida com zod (id, codigoCar não vazio, geometry Polygon com ≥ 4 pontos), EXIGE um `.sha256` e confere o
     SHA-256 (sem `.sha256` ou divergência ⇒ `indisponivel`, causa "integridade"); o hash ESPERADO também pode vir de
     `SAREL_SITIOS_SHA256` (um `.sha256` dentro do mesmo ZIP não prova nada: quem altera o JSON altera o hash; o gerador imprime
     o hash para o pesquisador anotar fora do ZIP) e NUNCA lança: arquivo ausente ⇒
     `indisponivel`, causa "dado-local-ausente". Rota `src/app/api/sitios-referencia/route.ts` (GET) devolve
     o objeto; não faz rede.
  5. UI: `PainelCampanha.tsx` (linhas 252, 460-486) e `MapViewer.tsx` (linhas 244-247, 514, 709) passam a usar o
     retorno da rota. Sem dado local: a lista mostra o identificador opaco e os metadados, "Ver no Mapa" fica
     desabilitado, a camada do mapa e a entrada da legenda não aparecem e um aviso diz "Sítios de aferição:
     dado local ausente (instale o banco pelo Instalador/Google Drive)". Com dado local: comportamento atual.
     O código CAR só é exibido quando o dado local está carregado. Estado vazio NÃO é erro de console.
  6. `pacoteReprodutibilidade.ts` (importa `SITIOS_PADRAO_OURO`): o ZIP nunca contém `codigoCar` nem geometria;
     use só o identificador opaco. Teste.
  7. DOCUMENTAÇÃO: em `docs/Delimitacao_Territorial_…BP3.md:120-123` troque cada código por "CAR-OPACO-0n (dado em
     `data/sitios_referencia_local.json`, fora do git)"; em `scripts/gerar_manual_pdf.py:233-237` os 4 cartões trazem áreas (28,4; 34,1; 18,7; 42,0 ha) e prefixos (4105309, 4115803) que NÃO coincidem com `sitiosReferencia.ts` (49,94 e 3 × 49,54 ha; 4115804 e 4105300): troque o conteúdo por "identificador opaco" e "área: ver dado local" e relate; troque também o exemplo de `docs/legado/MANUAL_OPERACAO.md:187` por "CAR-OPACO-0n"; e, SEM editar
     imagens, abra `docs/images/04-Central-de-campanha.png` e relate se mostra código CAR legível.
  8. DRIVE/INSTALADOR (sem tocar no C# nem no `.exe`): em `scripts/gerar_zip_banco_gdrive.py` inclua
     `data/sitios_referencia_local.json` e `.sha256` no ZIP quando existirem (mesmo `arcname`, na raiz) e
     imprima o SHA-256 do ZIP e este aviso final: "NÃO suba este ZIP a uma pasta com link público (R-H, DP-15): restrinja a pasta a pessoas específicas antes". README:
     seção "Sítios de aferição (dado local)" com: o que é, por que não está no git, como chega (ZIP do Drive →
     `data/`), que sem ele o app funciona sem os sítios, e que o arquivo identifica proprietários (LGPD).
     Teste Python em `scripts/verificacao/` para o gerador de ZIP com diretório temporário sintético.
  9. NÃO reescreva o histórico (R7). No relatório: "o histórico contém os códigos; limpeza é decisão do pesquisador".
TESTES. Fixture local SINTÉTICA (`SINTETICO_TESTE_ENCANAMENTO`, códigos "CAR-SINTETICO-0n", geometria quadrada
  fictícia) em diretório temporário via `SAREL_DATA_DIR`: (i) carregador `disponivel` com fixture, `indisponivel`
  sem arquivo, `indisponivel`/"integridade" com hash errado, nunca lança; (ii) varredura de texto: nenhum arquivo
  versionado de `src/`, `scripts/` ou `docs/` casa `[A-Z]{2}-[0-9]{7}-[0-9A-F]{32}`; (iii) a rota devolve
  `indisponivel` sem arquivo; (iv) o ZIP de reprodutibilidade não contém `codigoCar`.
ACEITE. `git grep -nIE "[A-Z]{2}-[0-9]{7}-[0-9A-F]{32}" -- . ':!*.pack'` -> VAZIO; `git check-ignore -v` mostra a
  regra; `npm run build` exit 0; `verificar_ui.cjs` sem os itens de sítios, com e sem a fixture local (capturas
  de 1440 px descritas em 1 frase). Relate: o app abre SEM o arquivo local (obrigatório) e COM ele.

────────────────────────────────────────────────────────────────────────────────────────
N10 — Sorteio D16: a CLI e a rota selam o desenho ANTIGO (36 × 10 ha); o de 72 × 5,02 ha não tem chamador (REVISAO_GLOBAL B1, CRÍTICO)
────────────────────────────────────────────────────────────────────────────────────────
ACHADO. `sortear72PoligonosD16` (`src/lib/gee/sorteioPoligonos.ts:707`) é o desenho vigente de D16 emendada
  (4 por estrato, 2 treino + 2 held-out, pi_i = 4/N_h). Quem sela é `sortearPoligonosDroneD16` (`:439`: 36
  polígonos, `areaHectares: 10`, pi_i = 2/N_h), chamada por `scripts/sortear_poligonos_d16.ts:215` e por
  `src/app/api/gee/sorteio-d16/route.ts:181`. O selo é IRREVERSÍVEL (D23): rodar `--confirmar` hoje sela um
  desenho que contradiz D16. Além disso `sortear72PoligonosD16` ainda não pode selar: usa
  `gitCommit ?? "HEAD"` (`:842`), grava constantes no lugar de hashes (`:850` `"sha256-72-poligonos-502ha"`,
  `:851` `sha256-selo-72-${semente}`) e não tem as guardas da versão antiga (semente inteira positiva;
  recusa de candidato sintético `DRY-CAND-`/`isSynthetic`/`origemSintetica`). As duas funções ordenam por
  `localeCompare` (`:491`, `:739`), que depende de locale e de versão do ICU.
REPRODUZIR (cole):
    grep -rn "sortear72PoligonosD16" src scripts --include=*.ts --include=*.tsx | grep -v "\.test\."   # esperado hoje: 1 linha (a definição)
    grep -rn "sortearPoligonosDroneD16" src scripts --include=*.ts --include=*.tsx | grep -v "\.test\." # esperado hoje: 5 linhas
    grep -n "sha256-72-poligonos-502ha\|sha256-selo-72" src/lib/gee/sorteioPoligonos.ts               # esperado hoje: 2 linhas
PASSO 1 (testes primeiro, devem FALHAR; em `sorteioPoligonos.test.ts`): (i) `sortear72PoligonosD16` com
  `semente` 0, negativa, fracionária ou NaN → lança; (ii) com candidato `DRY-CAND-…`, `isSynthetic: true` ou
  `origemSintetica: true` → lança (mesma mensagem da versão antiga); (iii) sem `gitCommit` ou sem
  `sha256ConjuntoCandidatos` nas opções → lança (nada de "HEAD" nem constante); (iv) o selo devolvido tem
  `sha256ConjuntoCandidatos` igual ao informado e `hashIntegridade` DIFERENTE para sementes diferentes e para
  conjuntos de polígonos diferentes (hash do conteúdo, não da semente); (v) a ordem de chegada dos candidatos
  não altera o resultado (embaralhe o vetor de entrada e compare os IDs sorteados); (vi) `totalPoligonosSorteados`
  = 72, `totalTreino` = 36, `totalHeldOut` = 36.
PASSO 2 (implementação). (a) Em `sortear72PoligonosD16` torne `gitCommit` e `sha256ConjuntoCandidatos`
  OBRIGATÓRIOS (como na versão antiga), copie as duas guardas (semente; sintético) e calcule
  `hashIntegridade` com a MESMA rotina de hash de conteúdo que a versão antiga usa (`:~580-600`; é
  JavaScript puro, não importe `node:crypto` aqui: o build já quebra por esse motivo, ver P0.5), sobre o selo
  inteiro menos o próprio campo. (b) Troque `localeCompare` por comparação de unidades de código
  (`a < b ? -1 : a > b ? 1 : 0`) nos dois lugares. (c) `scripts/sortear_poligonos_d16.ts` e
  `src/app/api/gee/sorteio-d16/route.ts` passam a chamar `sortear72PoligonosD16`; textos da CLI e da rota
  ("36 polígonos de 10 ha = 360 ha, 18 treino + 18 held-out") → "72 polígonos de 5,02 ha (~361 ha), 36 treino
  + 36 held-out". (d) Marque `sortearPoligonosDroneD16` com `@deprecated` (não apague: há testes). Não
  mude a ordem dos sorteios do PRNG (o resultado com a mesma semente não pode mudar por causa do refator,
  exceto pela troca do comparador; registre se mudar).
NÃO FAÇA. NÃO rode `sortear_poligonos_d16.ts --confirmar` nem chame a rota com `confirmar: true` (selo
  irreversível: só o pesquisador). Teste de rota só com `confirmar` ausente (modo prévia).
ACEITE. Passos 1 e 2 com saída colada (falha antes, verde depois); `grep -rn "sortearPoligonosDroneD16" scripts
  src/app` → vazio; `grep -n "localeCompare" src/lib/gee/sorteioPoligonos.ts` → vazio; suíte
  `sorteioPoligonos.test.ts` verde com os testes antigos que cobrem a função antiga mantidos.

────────────────────────────────────────────────────────────────────────────────────────
N11 — Ausente não é zero na persistência temporal (REVISAO_GLOBAL A5)
────────────────────────────────────────────────────────────────────────────────────────
ACHADO. `src/lib/gee/persistenciaTemporal.ts:94-103`: com menos de 6 observações válidas devolve
  `frequenciaExposicao: 0`, `ndviMaximoMediano: 0`, `taxaDegradacaoSwirAnual: 0` (`:98,101,102`); `:166` e
  `:180` deixam `taxaDegradacaoSwirAnual` em 0 com menos de 6 pontos de B12 ou `den <= 1e-6`.
  `montagemTemporal.ts:135` devolve `frequenciaSoloNu: 0` sem observações. O bloco N02(d) exporta
  `Taxa_Degradacao_SWIR_Anual` e a coluna de vigor desses campos, e proíbe exportar `regime`/`confianca`,
  que são os campos que sinalizam o caso insuficiente: o ausente viraria 0 válido (Regras 1 e 5), com viés
  correlacionado à nebulosidade (vigor 0 com monotonicidade negativa lê como "mais erosão").
  Também: (i) o campo `ndviMaximoMediano` é o PERCENTIL 90 de toda a série de NDVI (`:162-163`,
  `idxP90 = floor(n·0,9)`), não a mediana dos máximos por safra; (ii) o comentário `:42` diz "% ao ano" mas o
  valor é a inclinação da reflectância B12 [0–1] por ano.
REPRODUZIR (cole): `grep -n "frequenciaExposicao: 0\|ndviMaximoMediano: 0\|let taxaDegradacaoSwirAnual = 0\|frequenciaSoloNu: 0"
  src/lib/gee/persistenciaTemporal.ts src/lib/matriz/montagemTemporal.ts` → esperado hoje: 4 linhas (`:98,101,166` e `:135`).
MUDANÇA. (1) Em `ResultadoPersistencia` os campos `ndviMaximoMediano` e `taxaDegradacaoSwirAnual` passam a
  `number | null`; `null` quando `nObservacoesValidas < 6`, quando há menos de 6 pontos de B12 e quando `den <= 1e-6`;
  `frequenciaExposicao` idem quando `< 6`. (2) Ajuste os consumidores que o `typecheck` apontar
  (`GraficoSerieTemporal.tsx` e testes): `null` aparece como "—" com a causa, nunca como 0. (3) Corrija o
  comentário `:42` (unidade). (4) NÃO renomeie o campo TypeScript; a coluna EXPORTADA do bloco N02(d) chama-se
  `NDVI_P90_Serie` (no lugar de `NDVI_Maximo_Mediano`) e o anexo `config_pre_registro_PROPOSTA.json` já usa esse
  nome. (5) `montagemTemporal.ts:135` → `null` (tipo `number | null`; função sem chamador hoje: só tipos e teste).
  (6) Na projeção de N02(d): `null` → proveniência `indisponivel` com causa "insuficiente".
TESTES (primeiro): série com 5 observações válidas → os três campos `null` (hoje 0); série com 6 pontos de B12
  idênticos (`den` ≈ 0) → `taxaDegradacaoSwirAnual` `null`; série longa → valores numéricos iguais aos de hoje
  (regressão: copie os números dos testes existentes).
ACEITE. Testes novos e `persistenciaTemporal.test.ts` verdes; `git grep -n "ndviMaximoMediano: 0" -- src` → vazio.

────────────────────────────────────────────────────────────────────────────────────────
N12 — Tercis de D12: não finito e empates (REVISAO_GLOBAL M9)
────────────────────────────────────────────────────────────────────────────────────────
ACHADO. `src/lib/gee/estratificacao.ts:82-83` usa `Math.floor(n * 0.3333)` e `Math.floor(n * 0.6667)`;
  `classificarTercil(NaN, …)` devolve 3 sem erro; com massa em zero (Frequencia_Solo_Nu discreta) os "tercis"
  saem desiguais (medido pelo revisor com 50% de zeros: contagens 500/167/333). O deslocamento de índice por
  usar 0,3333/0,6667 é desprezível (≤ 2 elementos em 30.000); NÃO o trate como defeito grave.
  Os 18 estratos de D12 e os `pi_i` dependem disso, e o sorteio é irreversível.
MUDANÇA. (1) `calcularLimiaresTercis` ignora valores não finitos e devolve, além de `t1`/`t2`, os campos
  `nValidos`, `nNaoFinitos`, `nEmpatesEmT1`, `nEmpatesEmT2` (campos novos; não quebre os chamadores:
  `select-candidates/route.ts`, `remedir_candidatos_bp3_d16.ts`, `estratificacao.test.ts`). Use índices
  `ceil(n/3)-1` e `ceil(2n/3)-1` sobre os valores finitos ordenados. (2) `classificarTercil` LANÇA erro para
  valor não finito (nunca devolve 3). (3) Os chamadores acima registram `nNaoFinitos` no relatório que já
  emitem e excluem esses candidatos com motivo. NÃO mude a regra de empate (`<=`): é decisão do pesquisador
  (ver DP-6); só relate as contagens.
TESTES (primeiro): `[0,0,0,0,1,2]` → `nEmpatesEmT1` ≥ 2; `[NaN,1,2,3]` ignora o NaN; `classificarTercil(NaN)` lança;
  n = 30.000 distintos → contagens 10.000 ± 2 por tercil.
ACEITE. `estratificacao.test.ts` e os testes dos chamadores verdes; relatório cola as contagens de empate.

────────────────────────────────────────────────────────────────────────────────────────
N13 — Kappa: sem variância é indefinido, não 1 nem 0 (REVISAO_GLOBAL M10; altera C30)
────────────────────────────────────────────────────────────────────────────────────────
ACHADO. `src/lib/padraoOuro/validacaoMatricial.ts:144` devolve 0 para n = 0 e `:154` devolve 1 quando pe ≥ 1
  (todas as células numa classe só); `src/config/tourMetodologico.ts:377` repete o código como exemplo. A versão
  de pares (`rotulos/concordancia.ts`) devolve `null` para o mesmo caso. κ = 1 para amostra sem variância é o
  oposto da Regra 1 (ausente não é zero nem um). O bloco C30 mandava "manter o comportamento de cada uma":
  ESTE bloco abre a exceção.
REPRODUZIR (cole): `grep -n "if (pe >= 1) return 1\|if (n === 0) return 0" src/lib/padraoOuro/validacaoMatricial.ts
  src/config/tourMetodologico.ts` → esperado hoje: 3 linhas (`:144`, `:154`, `:377`).
MUDANÇA. A versão 2×2 devolve `number | null`: `null` para n = 0 e para pe ≥ 1 (e `kappa`/`kappaIC` do relatório
  matricial passam a `null` nesses casos, exibidos como "—" com a causa "sem variância"); mantenha o clamp
  [-1, 1] só para erro de ponto flutuante. Execute C30 DEPOIS deste bloco, com a exceção: "números de saída
  inalterados, exceto kappa quando indefinido". Atualize o trecho de código exibido no Tour (`:375-382`).
TESTES (primeiro): `(0,0,0,10)` → `null`; `(0,0,0,0)` → `null`; `(5,1,1,5)` → número igual ao de hoje;
  concordância perfeita COM as duas classes presentes → 1.
ACEITE. `validacaoMatricial.test.ts` (ajustado, com lista antes/depois dos testes mudados, R6) e `rotulos.test.ts` verdes.

────────────────────────────────────────────────────────────────────────────────────────
N14 — Exportações: a negativa fabricada, "100% medido" para ausente, GeoJSON fora dos perfis (REVISAO_GLOBAL M1-M3, M25)
────────────────────────────────────────────────────────────────────────────────────────
ACHADO. (1) Invariante 5 (afirmação negativa fundiária): `planilha.ts:179` `Status_Fundiario: p.fundiario?.status ??
  "sem-correspondencia"`, `PointPopup.tsx:92` e `AuditDossierModal.tsx:193` fabricam "sem correspondência" quando o
  fundiário nunca foi consultado; `invariantes.ts:258-270` só olha `CAR_Status` e a palavra "erro". (2) Invariante 3:
  `planilha.ts:137` `"Nenhum (100% medido)"`; `testar()` (`invariantes.ts:99-102`) só inclui campo com
  `p && !ehMedido(p)`: campo AUSENTE sai como medido. (3) `ExportModal.tsx:121-134` (GeoJSON) não passa por
  `extrairLinhasPorPerfil` nem por `assegurarInvariantesArtefato`; exporta `estrato: p.estratoId` (Regra 6, segregação
  cega) e `car_codigo` sem máscara (C05). (4) `planilha.ts:286` literal `"2019 a 2025"` (D05 = 2016-01-01..2026-06-30) e
  `:292` "CHIRPS Diário e GPM IMERG" como bases disponíveis (R e chuva são `indisponivel`, DEC-6). (5) README `:39`
  diz "Invariantes 1 a 7 verificados em tempo de execução", mas `git grep -in "invariante 4" -- src` não acha
  implementação (o validador cobre 1, 2, 3, 5, 6 e 7 em `invariantes.ts:97-290`; o 3 só no caso "modelado").
REPRODUZIR (cole):
    grep -n "sem-correspondencia\|Sem correspondência" src/lib/export/planilha.ts src/components/map/PointPopup.tsx src/components/audit/AuditDossierModal.tsx   # 3 linhas
    grep -rn "Nenhum (100% medido)" src                                     # 1 linha (planilha.ts:137)
    grep -n "2019 a 2025\|GPM IMERG" src/lib/export/planilha.ts             # 2 linhas
    grep -n "estrato: p.estratoId\|car_codigo" src/components/export/ExportModal.tsx   # 2 linhas
MUDANÇA. (a) O default de `Status_Fundiario`, do popup e do dossiê passa a `"nao-consultado"` (texto de tela:
  "não consultado"); o vocabulário aceito pelo validador inclui esse valor e o Invariante 5 vale também para
  `Status_Fundiario`. (b) `testar()` trata campo ausente (`undefined`/`null`) como NÃO medido e a lista
  `Campos_Estimados` nunca diz "100% medido" se algum campo estiver ausente; derive a lista das colunas `*_Origem`
  do próprio artefato (C03(1)) e INCLUA o caso ausente no teste de aceite de C03. (c) Crie o perfil `geojson-pontos`
  com lista de permissão (id, codigo, município, bacia, elevação, declividade, solo) SEM `estrato` e SEM CAR; o
  `ExportModal` o usa e passa por `assegurarInvariantesArtefato`. (d) A "Janela Temporal" vem da constante única de
  D05 (`amostragemSoloNuLote.ts:356-357`; exporte-a); a linha de bases lista só o que existe no estado real
  (hoje: "indisponível (DEC-6)" para chuva). (e) README `:39`: troque a frase pela lista dos invariantes
  realmente implementados (leia `invariantes.ts`), sem afirmar o 4.
TESTES (primeiro): ponto sem `fundiario` → planilha `campo-cego` diz "nao-consultado", nunca "sem-correspondencia";
  ponto sem `terreno` → `Campos_Estimados` lista "terreno" ou "ausente: terreno"; GeoJSON de um ponto com estrato
  e CAR → nenhuma das duas chaves presentes; planilha sem `opcoes.janelaTemporal` → "2016-01-01 a 2026-06-30".
ACEITE. Testes novos e `planilha`, `invariantes`, `perfis` verdes; os 4 `grep` de REPRODUZIR → vazios.

────────────────────────────────────────────────────────────────────────────────────────
N15 — A tela não pode afirmar o que não foi verificado (REVISAO_GLOBAL M4)
────────────────────────────────────────────────────────────────────────────────────────
ACHADO. (1) `ApiTokensManager.tsx:50-60`: chama `/api/planet/quota` (rota inexistente: `git ls-files src/app/api |
  grep planet` → vazio), engole o erro com `.catch(() => null)` e mostra "Chave Planet validada" se a chave tiver
  mais de 15 caracteres; o teste do CARTO (`:68`) busca um tile público sem usar a chave e afirma "Camadas Dark Matter
  ativas"; `api/jev/test/route.ts:80-85` responde `ok: true, offline: true` ("Chave Jev registrada") quando a rede
  falha e a tela mostra "ATIVADA". (2) `SettingsModal.tsx:~105-125`: "SICAR Ativo", "SIGEF Ativo", "SNCR Protegido LGPD"
  e "Casamento espacial verificado sem geração de dados sintéticos…" são literais (nada lê se `data/fundiario_brasil.db`
  existe). (3) `PainelCampanha.tsx:379-380` afirma "~78% (contra ~37% do GNSS)" e "1.845 unidades espacialmente
  independentes": a cifra de 78% está "em verificação" (R-F) e 1.845 é o total efetivo dos blocos de D24, não unidades do
  VANT; `PainelCriterioRefutacaoD25.tsx:56-66` mostra `unidadesEfetivasEstimadas: 72` (nominal) como "efetivas".
MUDANÇA. (1) Chave Planet: sem resposta do serviço o estado é "formato aceito; NÃO verificada" (nunca "validada"). CARTO: o
  texto diz "conectividade com o servidor de mapas verificada" (não fala em chave). Jev com `offline: true`: estado
  "NÃO verificada (sem rede)", nunca "ATIVADA". (2) O painel fundiário lê o estado real (crie `GET /api/fundiario/status`
  com `isLocalRequest`, que informa só `{ existe: boolean, tabelas: number }` sem nenhum dado pessoal) ou, se não for
  possível, troca os rótulos por "não verificado nesta sessão". (3) Em `PainelCampanha.tsx:379-380` retire "~78%" e
  "~37%" (ou rotule "em verificação — R-F") e leia o total de `saidas.*` do cálculo em vez do literal; em
  `PainelCriterioRefutacaoD25.tsx` rotule o `72` como "polígonos nominais" e mostre o n efetivo calculado.
TESTES. Texto/componente: nenhum estado "validada/ativada/Ativo/verificado" sem fonte; `grep -rn "validada\b" src/components/config`
  só em ramos que dependem de resposta de rede (liste).
ACEITE. `grep -n "~78%\|1.845 unidades" src/components/campanha/PainelCampanha.tsx` → vazio; `grep -n "Chave Planet validada"
  src/components/config/ApiTokensManager.tsx` → só dentro de ramo com `res.ok`; U04 do N04 passa a citar estas linhas.

────────────────────────────────────────────────────────────────────────────────────────
N16 — Segurança local: SSRF por `token_uri` e escrita sem checagem de origem (REVISAO_GLOBAL M5)
────────────────────────────────────────────────────────────────────────────────────────
ACHADO. (1) `src/lib/gee/auth.ts:81` faz `fetch(credentials.token_uri || GOOGLE_TOKEN_URI, { method: "POST" … })` e
  `:63` usa o mesmo `token_uri` como `aud`; o valor vem do JSON enviado em `app/api/auth/gee-session/route.ts:30` sem
  validação, e `error_description` volta ao cliente (`:~91`): sonda parcial de serviços internos. (2) Só
  `app/api/fundiario/consulta/route.ts` usa `isLocalRequest` (que olha o cabeçalho `Host`, não `Origin`); não há
  `src/middleware.ts`; `request.json()` aceita `Content-Type: text/plain`, então qualquer página aberta no navegador
  pode fazer um POST cego a `http://127.0.0.1:3000/api/...` sem preflight (CSRF). Efeitos: trocar a conta GEE da sessão
  (`gee-session`), disparar chamadas ao Jev (`jev/test`) e acionar `gee/sorteio-d16` (bloqueado por pré-condições e por
  `confirmar`; não foi provado que um atacante as satisfaça).
REPRODUZIR (cole): `grep -n "token_uri || GOOGLE_TOKEN_URI" src/lib/gee/auth.ts` → 2 linhas (`:63`, `:81`);
  `git grep -ln "isLocalRequest" -- src ':!*.test.ts'` → 2 arquivos; `ls src/middleware.ts` → "No such file".
MUDANÇA. (a) `auth.ts`: `token_uri` só é aceito se for exatamente `https://oauth2.googleapis.com/token`; qualquer outro
  valor → erro (sem fetch). (b) Crie `exigirRequisicaoLocalConfiavel(req)` em `src/lib/seguranca/localOnly.ts`:
  `isLocalRequest(req)` E (`Origin` ausente OU `Origin` com host local) E, para POST/PUT/PATCH/DELETE,
  `Content-Type: application/json`. (c) Aplique-a a TODAS as rotas de escrita de `src/app/api/{auth,gee,jev,embrapa}/**`
  (resposta 403 com mensagem fixa, sem eco da entrada); mantenha `isLocalRequest` na rota fundiária. (d) A mensagem de
  erro de `auth.ts` não repete `error_description` ao cliente (registre no servidor).
TESTES (primeiro; estendem `localOnly.test.ts`): Origin `https://exemplo.com` + Host local → 403; Content-Type
  `text/plain` → 403; Origin `http://localhost:3000` + JSON → passa; `token_uri` = `http://127.0.0.1:9/x` → erro sem
  chamar `fetch` (espione `fetch`).
ACEITE. `auth.test.ts` e `localOnly.test.ts` verdes; o front-end continua funcionando (as chamadas do próprio app
  enviam JSON e Origin local: confira em `src/components/config/*` e `src/components/**` com `fetch(`).

────────────────────────────────────────────────────────────────────────────────────────
N17 — Guardas dos dados GEE e de chuva que podem ser corrigidas sem decisão do pesquisador (REVISAO_GLOBAL A9, A11, A12, M13, M14)
────────────────────────────────────────────────────────────────────────────────────────
ACHADO. (1) Suficiência D11: `copernicusGeeClient.ts:456-459` usa `LIMIAR_MINIMO_OBSERVACOES_D11` (6) como contagem
  quando a resposta não traz `B4_count`/`B2_count`/`nObservacoesValidas` ("exatamente suficiente"); no lote
  (`amostragemSoloNuLote.ts:413-435`) a contagem ausente vira 0 e a frequência continua `medido`, sem comparar com 6.
  (2) Data inventada: `select-candidates/route.ts:781` usa o literal `"S2B_MSIL2A_20231031T134209_N0509_R124_T21JYM"`
  quando `adquiridoEm` é nulo e `:1150` grava `janela: { inicio: "2018-01-01", fim: "2023-12-31" }` fixa; há três
  períodos para o mesmo dado (pontual 2023, lote 2016-01-01..2026-06-30, selo 2018-2023). (3) Elevação:
  `copernicusGeeClient.ts:111-183` cai para `api.open-meteo.com/v1/elevation` quando não há `data/dem_cache/*.tif`, mas
  rotula `"Copernicus DEM GLO-30 (ESA 30m / EPSG:31982)"` (`:173`); a resolução servida por essa API NÃO foi verificada
  (HIPÓTESE: pode ser 90 m); `catch` (`:177`) descarta o lote inteiro sem aviso. (4) `chuva/chirps.ts:36-49` e
  `imerg.ts:30-42`: `slice(0,30)` pega os 30 registros mais recentes, não a janela de calendário; o sentinela -9999 não é
  tratado (acumulado negativo, medido em sonda: -9941); `extrairI30Maximo` devolve 0 `medido` com todos os valores de
  preenchimento. (5) `scripts/remedir_candidatos_bp3_d16.ts:300-303`: nível de K indeterminado → nível 1; classe ausente
  → "Média"; mistura a classe da camada antiga com o nível da carta de 2024 (126 de 680 candidatos do cache têm classe
  "Alta" e nível 1 no mesmo registro).
MUDANÇA. (1) Contagem ausente → `indisponivel("insuficiente")`; aplique `avaliarSuficienciaAmostralD11` em
  `processarRespostaGeeReduceRegions` também (lote). (2) Remova o literal da cena; sem data real `adquiridoEm` fica
  `indisponivel` (causa "data-da-fonte-desconhecida", DEC-9); a janela gravada vem de UMA constante exportada (D05) e é a
  janela efetivamente consultada. (3) Sem cache local de DEM: ou devolve `indisponivel("servico-indisponivel")` ou grava
  `fonte: "Open-Meteo (resolução não verificada)"` e NÃO rotula GLO-30/EPSG:31982; falha por ponto não descarta o lote.
  (4) Acumulados por janela `[dataRef − 30 d, dataRef]` com contagem de dias distintos; descarte valores `<= -9000` e não
  finitos; IMERG/I30 sem valor válido → `null`. (5) Nível de K indeterminado → candidato DESCARTADO (a contagem
  `descartadosSemK` já existe) e removido de `cachePedologia`; grave `fonteClasse` separado de `nivelK`.
TESTES (primeiro): resposta sem contagem → `indisponivel`; lote com `nObservacoes` 1 ou ausente → não `medido`; vetor com
  -9999 não vira acumulado negativo; janela de 60 dias com 26 registros → `null`; candidato sem `k_solos` não-urbano
  → descartado.
NÃO FAÇA (decisão do pesquisador, ver DP-3 e DP-4): NÃO troque o composto de percentis por mediana, NÃO redefina
  Frequência de Solo Nu, NÃO mude o estêncil de declividade, NÃO mude selos de CHIRPS/K/LS.
ACEITE. Testes novos verdes; relatório lista o que NÃO foi tocado e por quê.

────────────────────────────────────────────────────────────────────────────────────────
N05 — Conferência final (somente leitura)
────────────────────────────────────────────────────────────────────────────────────────
F1. `docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/` não foi alterada (`sha256sum -c`).
F2. Há no repositório uma apresentação e um manual de procedimentos entregues pelo pesquisador
    (`docs/Apresentacao_Pesquisa_SAREL_2026-10-06.pptx`, `docs/Manual_Procedimentos_SAREL_2026-10-06.pdf`),
    se existirem. NÃO os edite. Extraia deles (pdftotext / python-pptx) cada AFIRMAÇÃO NUMÉRICA
    sobre o código (nº de invariantes, contagem de testes, colunas exportadas, nome de arquivo) e
    liste as que deixaram de ser verdadeiras depois dos seus commits. Só liste.
F3. Liste (sem editar) as frases de `README.md` e `docs/FICHA_TECNICA_SAREL.md` (§7.1–7.2) que contradizem D16/D26 (ex.: "Invariante 4: VANT sempre held-out") ou a lista real de invariantes após C03.
F4. Liste, sem editar, as frases da apresentação e do manual de procedimentos que contradizem o código depois dos seus commits
    (ex.: números de invariantes; "36 polígonos de 10 ha"; "LS calculado").
F5. Varreduras finais (cole): `git grep -nIE "[A-Z]{2}-[0-9]{7}-[0-9A-F]{32}" -- . ':!*.pack'` (vazio); `grep -rn "sortearPoligonosDroneD16" scripts src/app`
    (vazio); `grep -rn "localeCompare" src/lib/gee/sorteioPoligonos.ts` (vazio); `git grep -n "107,52\|107.52" -- src` (vazio);
    `git grep -n "sem-correspondencia" -- src ':!*.test.ts'` (vazio).
F6. `git diff --stat 4834cf0..HEAD` e `git status --porcelain`.

════════════════════════════════════════════════════════════════════════════════════════
6. CONDIÇÕES DE PARADA (pare e relate, sem improvisar)
════════════════════════════════════════════════════════════════════════════════════════
 S1  Baseline diferente do esperado (P0.5).      S2  Âncora não encontrada ou texto diferente.
 S3  Teste de anexo falha no seu ambiente.       S4  Mais de 6 testes extras a reescrever (R12).
 S5  Bloco exige credencial, rede ou dado local.  S6  Dúvida sobre origem de um valor (data, área,
     fonte): não invente, declare `indisponivel` ou pare.   S7  Decisão fora da seção 3.
 S8  Qualquer hash de R10 mudou.                  S9  Mudança tocaria `decisoes.ts` além de acrescentar P10, P11 e P20..P24 "proposta".
 S10 Um bloco exigiria resolver um dos DP-1..DP-19 (seção 3-B): PARE nesse item, relate e siga para o próximo bloco independente.

════════════════════════════════════════════════════════════════════════════════════════
7. RELATÓRIO FINAL (obrigatório)
════════════════════════════════════════════════════════════════════════════════════════
Entregue em `docs/auditorias/RELATORIO_EXECUCAO_2026-10-09.md` (arquivo novo, não commite se o
pesquisador não autorizou). Conteúdo:
 (1) tabela bloco → executado | parcial | não executado (motivo) | commit local | saídas coladas
     de REPRODUZIR (antes) e ACEITE (depois), da mesma sessão;
 (2) o que NÃO foi feito: V não rodadas, a consulta de contagem D11 no GEE (DEC-16), Fator R (D13: fator 9,81 reproduzido em pluviômetros, origem física a confirmar com a revista; regiões 2 a 8 fora do escopo BP3), pré-registro (do pesquisador), partes que exigem GEE,
     Planet ou dado local (`npm run test:vivo`);
 (3) o que FALHOU: comando, exit code, 30 primeiras linhas;
 (4) o que NÃO VERIFICOU e por quê;
 (5) placar final de typecheck, lint, test, build e de `verificar_ui.cjs`, contra o baseline de P0.5,
     e a confirmação dos 5 hashes de R10 e dos anexos;
 (6) lista dos testes REESCRITOS (R6) com o texto antes/depois;
 (7) as ressalvas R-A..R-H confirmadas ou refutadas pelo que você viu no código; e a confirmação de que N07 não deixou código CAR legível em arquivo versionado;
 (8) `git status --porcelain` e `git log --oneline 4834cf0..HEAD`.
NÃO declare o repositório "pronto". NÃO afirme resultado científico: nenhum dado real foi usado.
NÃO faça push.
```

## Notas de quem redigiu (não fazem parte do prompt)

- O prompt **não** manda o executor rodar o avaliador D25 em modo probatório, preencher o pré-registro, ligar R/LS/chuva ao app, mexer em `decisoes.ts` (além das emendas aceitas e de parâmetros `proposta`), reescrever o histórico, tocar no instalador ou no Drive, apagar arquivos ou fazer push.
- O que o executor **não consegue** validar sem você: GEE (máscara SCL, janela D05), `test:vivo` (dados locais), V4/V5/V7/V9/V10/V12/V13, mover/renomear PDFs (DEC-13), CAR/perímetros reais: limpeza do histórico do git e permissões da pasta do Drive (R-H).
- Custo/risco: N02 é o bloco mais invasivo (contrato de dados). O limite R12 existe para o executor parar em vez de espalhar mudanças.
