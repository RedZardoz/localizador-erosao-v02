# Tarefa: sanear divergências entre a documentação metodológica e o código do SAREL v2

Repositório: `RedZardoz/localizador-erosao-v02`.

## ⚠ Branch — leia antes de qualquer coisa

A verificação que originou esta tarefa foi feita primeiro em `claude/trusting-mendel-c3mozf` (no merge do PR #2, `d2a7b5a`). Essa branch está **244 commits atrás** de `origin/sarel/executor-2026-10-09`, onde está o trabalho vivo (governança GOV-1/2/3, livro-razão de achados, auditoria bibliográfica, metodologia da BP3).

**Trabalhe sobre `origin/sarel/executor-2026-10-09`.** Crie a branch de trabalho a partir dela:

```bash
git fetch origin
git checkout -B sarel/correcoes-metodologicas origin/sarel/executor-2026-10-09
```

Se o pesquisador determinar outra branch, siga a dele — mas **não** aplique estas correções sobre `claude/trusting-mendel-c3mozf`: boa parte já está obsoleta ali.

Os números de linha abaixo vêm de `origin/sarel/executor-2026-10-09` e podem ter deslizado. Localize sempre pelo **texto âncora** citado, não pela linha.

## Estado já corrigido naquela branch (não refaça)

- `--dados` já é `required=True` em `scripts/treinar_xgboost_loco.py` — o default para a planilha condenada **já foi removido**.
- O varredor anti-mock já cobre `src/lib`, `src/app/api`, `src/store` e `src/config`, já existe `LISTA_EXCECOES_AUTORIZADAS` documentando as exceções de `MapViewer.tsx`, `FiltersPanel.tsx` e `select-candidates/route.ts`, e já há uma varredura restrita de `src/components/**/*.tsx` (apenas literais de data/código e `adquiridoEm` fabricado) com piso mínimo de arquivos.

O que **permanece** aberto está detalhado abaixo. Reverifiquei cada ponto contra essa branch.

## Regras invioláveis desta tarefa

1. **Nunca** enfraqueça um regex, remova uma asserção ou marque um teste como `skip` para obter suíte verde. Se um teste novo pega código existente, corrija o código ou anote-o com justificativa auditável.
2. **Nunca** deixe um documento afirmar o que o código não cumpre. Se não der para implementar, corrija o texto — e diga qual caminho escolheu.
3. Onde a tarefa pedir uma **decisão do pesquisador**, pare e pergunte. Não escolha sozinho em M1, nem na ativação do BSI (item 5).
4. Commits separados por item, em português, no estilo do repositório (`fix(escopo): texto em minusculas sem acentos`).
5. Ao final de cada mensagem de commit:
   ```
   Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_0124eRLwbTVuEsVKcsq67486
   ```
6. Não abra pull request a menos que seja explicitamente pedido.

## Preparação do ambiente

```bash
npm ci
pip install -r requirements.txt reportlab python-pptx
```

- `reportlab` e `python-pptx` **não estão** em `requirements.txt`, embora todos os geradores de documento dependam deles. Adicione os dois como parte do item 0.
- `data/` não existe em clone limpo (`.gitignore` ignora `data/*.db*`). O banco fundiário (~1,67 GB) só existe na máquina do pesquisador.
- Baseline esperado da suíte sem o banco: 3 falhas em `src/lib/fundiario/matcher.test.ts` com status `base-nao-disponivel`. Não é regressão sua; o item 6 resolve.

---

# PARTE A — Documento de metodologia da dissertação

Arquivo: `docs/BASES PARA A DISSERTAÇÃO/Metodologia_Integrada_Dissertacao_SAREL_Revisado.pdf`
Gerador: `scripts/gerar_pdf_metodologia_integrada.py` (o `.docx` sai de `scripts/gerar_docx_metodologia_integrada.py`).

**Comece pelo que está certo.** Este documento é metodologicamente muito superior ao relatório de mudanças: alvo contínuo Tweedie (D26), pré-registro contra HARKing, held-out lacrado de 36 polígonos, validação cruzada por bloco espacial ancorada no variograma, teto de preditores por bloco físico, desacoplamento VANT-como-rótulo. As equações de display renderizam corretamente (somatório com limites i=1 a 2; expoente 0,8522 sobrescrito) — **não** há o defeito de LaTeX cru que afeta o outro relatório. Não mexa na substância; corrija o que segue.

## M1 — Contradição no Nível 2 de K̂ (BLOQUEANTE — exige decisão do pesquisador)

D09, §3.2 e a Tabela 1 definem: **Nível 1 = K ≤ 0,0285** e **Nível 2 = K ≥ 0,0300** Mg h MJ⁻¹ mm⁻¹.

§3.6 declara, para a própria BP3: "os Latossolos Vermelhos apresentam erodibilidade K na faixa de **0,0130 a 0,0170** […] enquanto os Nitossolos Vermelhos variam entre **0,0240 e 0,0280**".

As duas faixas estão **inteiramente dentro do Nível 1**. Pelos números do próprio documento, o Nível 2 é vazio na área de estudo. Consequências:

- A dimensão K̂ colapsa: **9 estratos efetivos, não 18**.
- D16 fica inexequível: 36 dos 72 polígonos ficariam sem estrato elegível.
- §3.2 afirma que o Nível 2 tem "predomínio de Nitossolos e Neossolos", contradizendo diretamente a faixa que §3.6 atribui aos Nitossolos.
- A faixa 0,0285 < K < 0,0300 não pertence a nenhum nível (lacuna entre os cortes).

É a mesma patologia de estratificação degenerada que existe no código (ver item 3d), agora na metodologia.

**Ação.** Antes de qualquer edição de texto, **meça**: extraia a distribuição real do campo `k_solos` da carta Embrapa Solos (Doc. 246/2024) dentro da máscara de elegibilidade D07 na BP3 — o sistema já integra essa camada via `embrapaSoilClient`. Reporte mínimo, máximo, mediana, tercis e a contagem de polígonos com K ≥ 0,0300.

Com o número em mãos, **pergunte ao pesquisador** qual caminho seguir:
- (a) redefinir o corte de D09 pela mediana empírica do K na BP3, mantendo 18 estratos;
- (b) aposentar K̂ como dimensão, reduzindo a 9 estratos e recalculando o tamanho amostral de D16;
- (c) substituir K̂ por outra dimensão pedológica discriminante na bacia (p.ex. textura ou ordem).

Não escolha sozinho: muda o desenho amostral pré-registrado e o número de voos. Enquanto não houver decisão, **não** publique nova versão afirmando 18 estratos operantes.

## M2 — As contagens de unidades independentes não são reproduzíveis

§3.7 justifica os tetos de D24 com: "~1.845 unidades espacialmente independentes nos 72 polígonos", "~396 unidades independentes a 30 m" e "cerca de 936 unidades efetivas independentes" nos 36 held-out. O único parâmetro de deflação declarado é o alcance do variograma, **a ≈ 50 m** (P01).

Os números não fecham. Com 72 polígonos de 224 × 224 m (50.176 m² = 5,0176 ha; total 361,27 ha):

| Bloco de deflação | 72 polígonos | 36 polígonos |
| :--- | ---: | ---: |
| 50 m (declarado) | 1.445 | 723 |
| 44 m (implícito) | 1.866 | 933 |
| células de 30 m | 4.014 | 2.007 |

1.845 e 936 são mutuamente coerentes, mas implicam bloco de **≈ 44 m**, não 50 m. E 396 não reconcilia com nenhum dos dois (implicaria ≈ 95 m). Como os tetos 8/4/1/1 de D24 **derivam** dessas contagens, a cadeia de justificativa fica inverificável — num documento cuja tese central é reprodutibilidade.

**Ação.** Exiba a fórmula de deflação usada (área efetiva ÷ área do bloco, ou o estimador de tamanho amostral efetivo adotado), com o alcance aplicado a cada bloco temático. Se o terreno usa alcance diferente do espectral — o que é fisicamente razoável —, declare-o explicitamente em P01 em vez de um único "a ≈ 50 m". Depois recalcule e corrija os três números.

## M3 — A Tabela 2 excede os tetos que D24 impõe

| Bloco | Teto D24 | Variáveis listadas na Tabela 2 | Contagem |
| :--- | :--- | :--- | ---: |
| Espectro-Temporal | **≤ 8** | B2, B3, B4, B8, B11, B12, NDVI, BSI, c0, c1, a1, b1, Ê | **13** |
| Morfometria | **≤ 4** | Declividade, Aspect, Curvatura de Perfil, Curvatura de Plano, LS | **5** |

Um avaliador lê "Máx. 8 variáveis" ao lado de 13 nomes. Pior: o documento pré-registra contra flexibilidade analítica (Pilar 3, D25, NOSEK et al., 2018), e escolher 8 de 13 **depois** de ver os dados é exatamente a flexibilidade que esse pré-registro declara eliminar.

**Ação.** Uma das duas, não ambas:
- enxugar as listas para exatamente 8 e 4, fixando o vetor final; ou
- rotular a Tabela 2 explicitamente como **pool de candidatos** e pré-registrar a **regra de seleção** (p.ex. seleção por importância em validação cruzada apenas sobre as dobras de treino, jamais no held-out), descrevendo-a em D24.

## M4 — GSD do VANT: 3,8 cm ou 4 cm?

§2.2 e §3.5 usam "ortomosaico de 4 cm" e derivam "cerca de 62.500 micropixels" por célula de 10 × 10 m. §3.5 e a Tabela 2 declaram "GSD médio **medido** de 3,8 cm".

62.500 = 100 m² ÷ (0,04 m)². Com o GSD medido de 3,8 cm, são 100 ÷ 0,038² ≈ **69.252** micropixels.

**Ação.** Declare 4 cm como GSD **nominal de projeto de voo** e 3,8 cm como **medido**, e derive a contagem do valor medido (≈ 69.000), ou padronize tudo em 4 cm e remova a menção a 3,8 cm. Mantenha a coerência com a Tabela 2.

## M5 — Provável troca de referência na equação do Fator C

Corpo (§3.6), D01 e D20 atribuem **C = (1 − NDVI)/2** a "Durigon et al. (2014)". A referência listada na seção 6 é:

> DURIGON, C. A.; CARVALHO JÚNIOR, O. A. de; ANTUNES, M. A. H.; OLIVEIRA, S. N. de; MARTINS, E. S. *Índices de vegetação derivados do sensor MODIS…* Revista Brasileira de Ciência do Solo, v. 38, n. 6, p. 1814-1824, 2014.

A formulação C = (1 − NDVI)/2 é atribuída na literatura a **DURIGON, V. L.; CARVALHO, D. F.; ANTUNES, M. A. H.; OLIVEIRA, P. T. S.; FERNANDES, M. M.** *NDVI time series for monitoring RUSLE cover management factor in a tropical watershed.* **International Journal of Remote Sensing**, v. 35, n. 2, p. 441-453, 2014 — iniciais de autor, periódico, volume e título distintos. Parece haver conflação de duas obras.

Sinal corroborante: é uma das poucas referências **sem** marcador `[Arquivo local: …]`, ou seja, não foi conferida contra cópia primária arquivada.

**Ação.** Conferir no primário e corrigir a referência, ou — se a obra citada realmente trouxer a equação — acrescentar o arquivo local e manter. Não resolva por memória nem por citação de terceiros; abra o PDF.

## M6 — Coeficientes do Fator R atribuídos a Rufino et al. / Waltrick et al.

A equação `EI30,mês = 67,355 · (p²/P)^0,8522` é atribuída a Rufino, Biscaia e Merten (1993), atualizada por Waltrick et al. (2010). O par **67,355 / ≈0,85** é a forma clássica da equação de **Lombardi Neto & Moldenhauer (1992) para Campinas-SP**, amplamente reutilizada. Rufino et al. (1993) — "terceira aproximação" — regionalizaram o Paraná em regiões homogêneas com **coeficientes próprios por região**.

Aplicar um par único a toda a BP3 pode estar correto, mas precisa ser justificado.

**Ação.** O PDF primário já está arquivado (`rufino_biscaia_merten_1993...pdf`). Abra-o, identifique em qual região da terceira aproximação a BP3 recai, e ou (a) adote os coeficientes dessa região, ou (b) mantenha o par atual declarando explicitamente a origem (Lombardi Neto & Moldenhauer, se for o caso) e o motivo da adoção. Ajuste D13 na mesma linha.

## M7 — Higiene da seção de referências

- Sem marcador `[Arquivo local: …]`: **BAZZI et al. (2022)**, **CAMERON; GELBACH; MILLER (2008)**, **DURIGON et al. (2014)**, **WISCHMEIER; SMITH (1978)**, **ZHU; WOODCOCK (2014)**. São justamente as não conferidas no primário — priorize-as na auditoria bibliográfica já em curso na branch.
- **EMBRAPA SOLOS, 2018 (SiBCS, 5ª ed.)**: conferir autoria (a 5ª edição é catalogada por **SANTOS, H. G. dos et al.**) e a paginação declarada de 356 p. Confira na cópia e corrija.
- Uso de `et al.` é inconsistente: algumas entradas listam todos os autores (DURIGON, RENARD, NOSEK, WALTRICK), outras abreviam (ALVAREZ-VANHARD, PINEAU, PLOTON, ROBERTS, BAZZI). A NBR 6023 admite as duas formas, mas exige consistência dentro da lista. Padronize.

## M8 — Cabeçalho sobreposto em todas as páginas

Em `scripts/gerar_pdf_metodologia_integrada.py`, dentro do canvas numerado:

- âncora `"PPGTCA / UTFPR — PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO"` — `drawString(20*mm, …)`
- âncora `"METODOLOGIA INTEGRADA & GLOSSÁRIO • SAREL"` — `drawRightString(page_w - 20*mm, …)`

As duas strings são desenhadas na **mesma altura** e não cabem na faixa útil de 170 mm do A4 no corpo atual. Resultado: texto ilegível sobreposto no topo de **todas** as páginas (verificado em imagem renderizada das páginas 5 e 6, não só na extração de texto).

**Ação.** Abrevie a string da esquerda (p.ex. "PPGTCA / UTFPR"), reduza o corpo, ou mova a identificação da direita para uma segunda linha. **Verifique renderizando em imagem**, não por `pdftotext`:

```bash
pdftoppm -f 1 -l 3 -r 150 -png "docs/BASES PARA A DISSERTAÇÃO/Metodologia_Integrada_Dissertacao_SAREL_Revisado.pdf" /tmp/pg
```

Aproveite e verifique o aproveitamento vertical: páginas 5 e 6 terminam em ~45% da altura, com metade da folha em branco. Se houver `PageBreak` fixo por seção, troque por quebra natural.

## M9 — Unidades em ASCII no corpo do texto

"Mg ha^-1 ano^-1" e "Mg h MJ^-1 mm^-1" aparecem com acento circunflexo literal, enquanto as equações de display usam sobrescrito correto. Padronize com `⁻¹` (ou `<super>-1</super>` do ReportLab) em todo o corpo, inclusive nas Tabelas 1 e 3A.

## M10 — Três cópias divergentes do mesmo documento

Na mesma pasta `docs/BASES PARA A DISSERTAÇÃO/` convivem:

| Arquivo | md5 | Conteúdo |
| :--- | :--- | :--- |
| `..._Revisado.pdf` | `9f367f68…` | **12 páginas, com glossário normativo e referências** |
| `... 22_10_26.pdf` | `cc9b41dc…` | layout distinto |
| `....pdf` | `85536e4e…` | sem a seção de glossário |

São conteúdos diferentes, não cópias. E o gerador escreve **duas** dessas rotas na mesma execução (âncoras `pdf_path = …SAREL.pdf` e `alt_path = …SAREL_Revisado.pdf`), o que significa que as cópias versionadas já divergiram da saída do script.

**Ação.** Defina **uma** canônica (a mais completa é a `_Revisado`), regenere as demais a partir do mesmo gerador ou remova-as, e gere o `.docx` pelo gerador correspondente na mesma execução. Documente no script qual é a canônica. Três versões concorrentes de uma metodologia pré-registrada é risco de proveniência: ninguém sabe qual foi defendida.

## M11 — Divergência entre a metodologia e o script de treino (registrar, não corrigir agora)

O documento fixa: alvo **contínuo** y ∈ [0,1] com `reg:tweedie` (D26), validação por **GroupKFold por polígono** sobre blocos de ~50 m (D25), preditores **exclusivamente** Sentinel-2 + Copernicus DEM + cartas de solo e chuva (§2.2, Tabela 2, Regra 4, Invariante 2).

`scripts/treinar_xgboost_loco.py` implementa outro desenho: alvo **binário** (`Classe_Alvo_Binaria`), validação **LOCO por macrobacia** (K=5), e — ver item 1 — ainda aceita a perda RUSLE como preditor.

Isso é um desenho **superado**, não apenas um bug. Reescrevê-lo está fora do escopo desta tarefa. **Registre a divergência explicitamente** no relato final e no corpo do commit do item 1, para que o pesquisador decida quando portar o script para D24/D25/D26.

---

# PARTE B — Código

## Item 0 — LaTeX cru impresso no relatório de mudanças

**Este defeito é do outro documento**, `Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf`, gerado por `scripts/gerar_relatorio_mudancas_pdf.py`. Não confunda com a metodologia da Parte A, que está correta nesse aspecto.

O ReportLab não renderiza LaTeX, e o PDF publicado imprime o código-fonte. Confirmado por `pdftotext -layout`: 15 ocorrências de `\sqrt|\frac|\kappa|\text|\implies|\quad`. São as duas equações centrais:

```
$$SE_\kappa = \sqrt{\frac{P_o(1 - P_o)}{N (1 - P_e)^2}} \quad \implies \quad IC_{95\%} = [\kappa - 1{,}96 \cdot SE_\kappa, \; \kappa + 1{,}96 \cdot SE_\kappa]$$
$$\text{BSI} = \frac{(B_{11} + B_4) - (B_8 + B_2)}{(B_{11} + B_4) + (B_8 + B_2)}$$
```

mais os trechos inline `$SE_\kappa$`, `$IC_{95\%}$` e `$\kappa \ge 0{,}61$`.

**Correção.**
- Equações de display: renderize com `matplotlib` mathtext para PNG (`dpi >= 300`, `transparent=True`, `bbox_inches="tight"`), salve em `docs/figuras_relatorio/` (commitado) e embuta como `reportlab.platypus.Image`, dimensionada em pontos para caber na largura útil do A4 com margens de 20 mm.
- Alternativa se o mathtext destoar da Helvetica do documento: fração como `Table` de duas linhas com `HRFlowable` entre numerador e denominador. Não deixe fração em linha única com barra.
- Inline: `SE<sub>κ</sub>`, `IC<sub>95%</sub>`, `κ ≥ 0,61`. Confirme que a fonte registrada tem o glifo `κ`; se não tiver, registre uma que tenha ou escreva "kappa". Não deixe caixa preta no PDF.
- Preserve as citações (Cohen, 1960; Fleiss et al., 1969) e as legendas existentes.

**Duas cópias.** O PDF está commitado na raiz **e** em `docs/relatorios/`. Regenere e sincronize ambas; considere fazer o script escrever nas duas rotas.

**Aceitação.**

```bash
python scripts/gerar_relatorio_mudancas_pdf.py
for f in Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf docs/relatorios/Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf; do
  pdftotext -layout "$f" - | grep -cE '\\[a-zA-Z]+|\$\$'   # deve imprimir 0
done
```

Inspecione a página das equações em imagem antes de dar por pronto.

## Item 1 — circularidade (target leakage) ainda ativa no script que treina

O relatório afirma que a perda de solo RUSLE foi "compulsoriamente removida" e que "o classificador agora é alimentado estritamente por preditores biofísicos observáveis". A remoção no TypeScript é real e correta. No Python, não:

| Âncora em `scripts/treinar_xgboost_loco.py` | Situação |
| :--- | :--- |
| `'rusle_perda_solo',` em `candidatos_preditores` (~linha 639) | presente |
| `'Perda_Solo_t_ha_ano': 'rusle_perda_solo',` (~linha 464) | presente — cabeçalho exato da planilha condenada |
| `'RUSLE_Perda_Solo': 'rusle_perda_solo',` | presente |
| `'perdaSoloRUSLE': 'rusle_perda_solo',` | presente |
| docstring do cabeçalho: "Fator K, Fator R e **Perda RUSLE estimada (A)**" | presente |
| geração de `perda_solo_spd` e chave `'rusle_perda_solo'` no bloco dry-run | presente |

Além de contradizer o relatório, contradiz a Tabela 2 e a Regra 4 da metodologia da Parte A.

**Correção.**
1. Remova `'rusle_perda_solo'` de `candidatos_preditores`.
2. Remova os três aliases — são a via de regressão: qualquer planilha legada com `Perda_Solo_t_ha_ano` reintroduz a circularidade em silêncio.
3. Corrija o docstring: preditores são bandas (B2, B4, B8, B12), NDVI, BSI, declividade, elevação, Fator K e Fator R. Acrescente que a perda RUSLE (A) é **excluída** por ser derivada de fórmula fechada sobre os mesmos insumos, permanecendo apenas como linha de base comparativa independente.
4. Remova a geração de `perda_solo_spd` e a chave correspondente no dry-run.
5. **Trava dura**, espelhando `CAMPOS_PROIBIDOS_MATRIZ_TREINO` do TypeScript: conjunto `COLUNAS_PROIBIDAS_CIRCULARIDADE` com nomes normalizados (minúsculas, sem separadores) de `rusle_perda_solo`, `perda_solo_t_ha_ano`, `perdasolorusle`, `score_prioridade`, `phi`, `phi_diag`, `severidade`. Após montar `X`, levante `RuntimeError` nomeando a coluna e o motivo. A trava roda **depois** da renomeação, sobre `X.columns` finais, e tem teste.

**Higiene.** `src/lib/matriz/invariantes.ts` lista `"RUSLE_Perda_Solo"` em `CAMPOS_PROIBIDOS_MATRIZ_TREINO`, mas a verificação em `src/lib/matriz/montagem.ts` usa `proibido in l` sobre objetos de chaves **camelCase** — esse nome nunca casa. É garantia falsa: remova a entrada morta ou normalize a comparação.

**Aceitação.** Teste que monta um DataFrame com `Perda_Solo_t_ha_ano` e confirma que o treino **aborta**.

## Item 2 — alertas de variância não bloqueiam, e o selo probatório não degrada

O `--dados` obrigatório **já está feito**. Falta o resto:

- `auditar_variancia_preditores` existe e está bem escrita, mas o chamador apenas **imprime** os alertas e segue o treino.
- Âncora `'natureza_execucao': 'BENCHMARK_INFRAESTRUTURA_DRY_RUN' if eh_modo_dryrun else 'PROBATORIO_CIENTIFICO'` — o selo "probatório científico" é aplicado sempre que não é dry-run, **mesmo com alertas de variância zero**.
- A marca d'água dos gráficos depende só de `eh_dryrun`. Um treino sobre dados constantes gera figuras limpas, prontas para a dissertação.

**Correção.**
1. `auditar_variancia_preditores` passa a **abortar** por padrão, com `RuntimeError` nomeando as colunas e quantos valores idênticos há.
2. Exceção controlada, espelhando o Invariante 7: flag `--preditores-tabelados col1,col2` (default vazio). Coluna nomeada não aborta, mas é **removida de `X`** (preditor constante carrega informação zero e só polui o SHAP) e o fato entra em `alertas_rigor` e no JSON. Documente no `--help`.
3. Derive e use em lugar de `eh_dryrun`:
   ```python
   sem_valor_probatorio = eh_modo_dryrun or bool(alertas_rigor)
   ```
   `natureza_execucao` passa a ter três estados: `'PROBATORIO_CIENTIFICO'` só quando não há dry-run **nem** alertas; `'BENCHMARK_INFRAESTRUTURA_DRY_RUN'`; `'INVALIDO_ALERTAS_DE_RIGOR'`.
4. Passe `sem_valor_probatorio` à plotagem e marque as figuras em **todos** os pontos onde hoje se testa `eh_dryrun`, com texto distinto para cada causa. Não remova a marca d'água de dry-run existente.

**Preserve** o gate `--permitir-dryrun-sintetico`, a marca `CTRL-DRYRUN-`, a tipologia "Controle / SPD (Dry-Run)" e o campo `dados_100pct_empiricos`. É engenharia honesta.

## Item 3 — o varredor anti-mock não pega o modo de falha real

A varredura já cobre `src/lib`, `src/app/api`, `src/store`, `src/config` e, de forma **restrita**, `src/components/**/*.tsx` (só literais de data/código e `adquiridoEm`). O problema é outro: **os padrões existentes não detectam fabricação de dado científico**. Medi — eles não pegam nenhum dos defeitos reais abaixo.

### 3a. Extraia o varredor para módulo de produção

`ViolacaoPadrao`, `REGEX_PADROES`, `varrerLinha` e `varrerCodigo` estão declarados **dentro do arquivo de teste** `src/lib/seguranca/padroesProibidos.test.ts`, o que impede qualquer outra ferramenta de importá-los. Mova para `src/lib/seguranca/padroesProibidos.ts` e faça o teste importar de lá, preservando a válvula `// permitido:` / `# permitido:` com justificativa ≥ 20 caracteres e a `LISTA_EXCECOES_AUTORIZADAS` já existente.

### 3b. Acrescente três padrões (testados — use como estão)

```ts
{ id: "grade-cientifica-fabricada",
  regex: /Array\s*\.\s*from\s*\(\s*\{\s*length\s*:\s*\d+/ },
{ id: "preditor-cientifico-de-limiar-ou-zero",
  regex: /\b(declividade|elevacao|frequenciaSoloNu|ndvi|bsi|erodibilidade)[A-Za-z]*\s*:\s*(\w+(Min|Max)|0)\s*[,}]/ },
{ id: "identificador-admite-simulacao",
  regex: /\b([A-Za-z]*[Ss]imulad[ao]s?|[A-Za-z]*[Dd]emonstracao|[A-Za-z]*[Ff]icticio?s?|[A-Za-z]*[Mm]ock[A-Za-z]*)\b/ },
```

Validados contra os alvos reais e contra controles benignos: pegam as linhas-problema e **não** disparam em `zoom: zoom ?? 14`, `Math.min(90, Math.max(10, topPct))`, `frequenciaSoloNu: valorOuNulo(…)` nem `Array.from(mapaAbas.keys())`.

Refinamento obrigatório: `identificador-admite-simulacao` deve **ignorar linhas de comentário** (trim iniciando por `//`, `*`, `/*` ou `{/*`). Sem isso dispara em dois falsos positivos puramente textuais — `src/types/ui.ts` (que é o enunciado da Regra 5) e um comentário JSX em `src/components/mapa/MapaAmostral.tsx`. Acrescente meta-testes para os três, no estilo do bloco "Meta-testes" existente.

### 3c. Amplie a varredura de `src/components`

A passagem atual sobre `.tsx` é restrita a literais de data/código. Aplique nela **também** os três padrões novos, mantendo o piso mínimo de arquivos já implementado.

### 3d. Trate os achados — corrigir, não anotar

- **`src/components/campanha/PainelCampanha.tsx`** (âncora `Array.from({ length: 250 }`, ~linha 300) — o mais grave. `calcularMetricasDemonstracao` fabrica uma grade de 250 pixels com matriz de confusão escolhida à mão (70 TP, 2 FP, 5 FN, 173 TN) em coordenadas reais de Céu Azul, e o resultado é exibido sob o título **"Resultado da Validação Matricial Pixel-a-Pixel (GSD 7.5 cm vs 10 m)"**, sem selo de demonstração. O PR #2 ainda acrescentou IC 95% a esses números, dando aparência estatística a dado fictício.
  Correção: mantenha o painel, torne a natureza inequívoca. Retitule para "Demonstração do Cálculo Matricial — dados fictícios, sem valor científico"; selo visual destacado (não `text-[9px]` cinza) dentro do painel; retitule o botão. Mantenha os identificadores `metricasSimuladas`/`pixelsDemonstracao` (são honestos) e anote as linhas com `// permitido:` + justificativa. Mantenha o IC 95% — sob rótulo correto, é parte da demonstração.
- **`src/app/api/gee/select-candidates/route.ts`** (âncoras `declividadePct: declividadeMin`, `elevacao: 0`, `frequenciaSoloNu: frequenciaSoloNuMin`) — limiares do filtro usados como se fossem medições, alimentando thinning e estratificação. Com S e E constantes, `src/lib/gee/estratificacao.ts` joga todos os candidatos num único estrato: dos 18 estratos, 1 ocupado e 17 vazios. É a contraparte em código do problema M1.
  Correção mínima: renomeie para explicitar placeholder (`declividadePctPlaceholderFiltro` etc.), anote com justificativa, e **exponha na resposta da API** um diagnóstico `estratificacao_degenerada` com contagem de estratos ocupados e vazios, para que nenhuma camada acima possa afirmar 18 estratos operantes. Os campos `Proveniencia` exportados já declaram `indisponivel` corretamente — **não** altere isso.
- **`src/lib/planet/ordersApi.ts`** (âncora `SIMULATED-ORDER-`) — dentro de `src/lib`, o diretório que o portão alega cobrir. Em "modo offline / simulação controlada" gera um id falso, **registra consumo de cota** e retorna `status: "queued"` indistinguível de pedido real.
  Correção: mantenha o modo offline, acrescente ao tipo de retorno um campo explícito (`simulado: true`) para que nenhum chamador confunda, e anote com justificativa. Remover o modo offline é decisão de produto — pergunte antes.
- **`src/lib/gee/persistenciaTemporal.ts`** (`frequenciaExposicao: 0`, `ndviMaximoMediano: 0`) e **`src/lib/matriz/montagemTemporal.ts`** (`frequenciaSoloNu: 0`) — ramos de retorno antecipado por dados insuficientes, onde os campos vizinhos usam `null`. Nesses ramos **não houve medição**, então `0` é placeholder, e um Ê = 0 por ausência fica indistinguível de um Ê = 0 medido — sendo que `compostoSoloNu.ts` documenta explicitamente que o zero **medido** é valor real.
  Correção preferida: trocar por `null`, alargando o tipo. Se a propagação passar de ~5 arquivos, pare, anote com justificativa e registre a pendência no corpo do commit.

## Item 4 — o portão do Kappa não existe como o relatório descreve

O relatório afirma que "o sistema **exige** que tanto a estimativa pontual **quanto o limite inferior** do IC95% satisfaçam κ ≥ 0,61". O código (`src/lib/rotulos/concordancia.ts`, âncora `const operacional = kappa >= 0.6;`) usa só a estimativa pontual, e com limiar 0,6, não 0,61. O IC é calculado e exibido na mensagem, mas não bloqueia.

**Correção.**
1. Exporte `LIMIAR_KAPPA_SUBSTANCIAL = 0.61` com a citação de Landis & Koch (1977) em comentário.
2. `const operacional = kappa >= LIMIAR_KAPPA_SUBSTANCIAL && ciInferior >= LIMIAR_KAPPA_SUBSTANCIAL;`
3. `alertaBloqueante` deve dizer **qual** critério falhou: pontual, limite inferior, ou ambos. Mantenha o IC na mensagem.
4. `grep -rn "0\.6\b" src/lib/rotulos src/lib/padraoOuro` e alinhe qualquer outra comparação de κ.
5. Atualize `src/lib/rotulos/rotulos.test.ts` com o caso que distingue a implementação nova: κ pontual acima de 0,61 com limite inferior abaixo → **não** operacional.

**Declare o efeito.** O portão fica estritamente mais rigoroso: amostras pequenas reprovam mesmo com κ pontual bom. É o comportamento prometido ao parecerista, mas tem custo de campo. Meça e registre no commit qual N mínimo aproximado passa a ser necessário para κ real ≈ 0,75 cruzar o portão.

**Acréscimo necessário.** Em `src/lib/padraoOuro/validacaoMatricial.ts`, o IC do Kappa usa N = número de células de 10 m. Pixels vizinhos são espacialmente autocorrelacionados — o erro-padrão assintótico subestima a incerteza e o intervalo fica artificialmente estreito. Não implemente a correção estatística agora (tamanho amostral efetivo ou *block bootstrap*); **documente a limitação** em comentário no ponto do cálculo e verifique se a seção de limitações do relatório a menciona. É pergunta provável de banca, ainda mais num projeto que já adota bootstrap agrupado em D25.

## Item 5 — a discriminação de palhada por BSI está dormente (exige decisão)

O relatório de mudanças afirma que "o pipeline temporal **incorporou** o Índice de Solo Exposto (BSI)… mitigando drasticamente a ocorrência de falsos positivos". Na prática:

- `limiarMinBsi` é **opcional** em `src/lib/gee/compostoSoloNu.ts` e só é passado em `src/lib/gee/compostoSoloNu.test.ts`;
- `extrairMetricasSoloExposto` é **importada e nunca chamada** em `src/lib/matriz/montagemTemporal.ts` — import morto;
- o Ê do pipeline sai de limiar puro de NDVI dentro do próprio `montagemTemporal.ts`.

**O ponto crítico, que decide o caminho:** a metodologia da Parte A define **D10** como "fração de cenas orbitais válidas com índice **NDVI ≤ 0,25**" — sem BSI. O código está alinhado a D10; é o **relatório** que está errado. E D10 alimenta Ê, que é uma das três dimensões dos 18 estratos **pré-registrados**. Ligar o filtro de BSI muda Ê, muda os tercis, muda os estratos e invalida a amostragem já pré-registrada.

Portanto **não ative o BSI por iniciativa própria.** Faça:

1. Corrija o texto do relatório de mudanças para descrever o que existe: capacidade implementada e coberta por teste, **não ativada** no pipeline, porque Ê segue D10 (NDVI ≤ 0,25).
2. Remova o import morto em `montagemTemporal.ts`, ou — se preferir manter a função como ponto de extensão — chame-a de fato passando `undefined` e documente. Não deixe import não utilizado; verifique por que o lint não o pegou e corrija a regra se for o caso.
3. Documente em `compostoSoloNu.ts` que `limiarMinBsi` é ponto de extensão experimental, dependente de nova decisão metodológica.
4. **Pergunte ao pesquisador** se deseja abrir uma decisão nova (D27) para o gating de Ê por BSI, registrando que isso exige reexecutar a estratificação e reabrir o pré-registro de D12/D16.

## Item 7 — Invariante 7 não cruza proveniência, ao contrário do que o relatório afirma

O relatório afirma que a verificação "cruza… o status de proveniência e os metadados oficiais de exportação", isentando colunas "formalmente anotadas como `estado: 'tabelado'`". O código (`src/lib/matriz/invariantes.ts`, âncoras `COLUNAS_EXCECAO_CONSTANTE_TABELADA` e o `continue` no laço de colunas) usa uma **lista fixa de nomes** — `RUSLE_Fator_P` e variantes — sem olhar proveniência alguma.

Consequência dupla, e ambas importam:
- uma coluna **chamada** `RUSLE_Fator_P` preenchida com constante fabricada passa sem verificação;
- um Fator K legitimamente tabelado da literatura continua **bloqueado**, porque não está na lista.

**A boa notícia: o dado de proveniência existe.** A Regra 3 encapsula toda grandeza em `Proveniencia`, e os perfis de exportação já emitem a coluna irmã `<Coluna>_Origem`, formatada por `formatarDescricaoOrigem` em `src/types/proveniencia.ts`, cuja saída **começa pelo estado**: `"tabelado (<tabela>, chave: <chave>…)"`, `"medido (…)"`, `"modelado (…)"`, `"indisponível — …"`.

**Correção.**
1. No Invariante 7, antes de bloquear a coluna `X` por variância zero, procure a coluna irmã `X_Origem` no mesmo artefato. Se **todas** as linhas não vazias de `X_Origem` começarem por `tabelado (`, isente `X` e registre a isenção no resultado (não isente em silêncio).
2. Mantenha a lista de nomes **apenas** como fallback explícito para colunas cuja proveniência não é projetada no artefato, documentando por que cada nome está lá. Se, após (1), a lista ficar vazia, remova-a.
3. Testes obrigatórios, os três:
   - coluna `RUSLE_Fator_P` com `_Origem` **não** tabelada e variância zero → **bloqueia**;
   - coluna `RUSLE_Fator_K` com `_Origem` tabelada e variância zero → **passa**;
   - coluna sem `_Origem` e variância zero → **bloqueia** (comportamento conservador padrão).
4. Alinhe o texto do relatório ao mecanismo implementado. Se optar por não implementar (1), então corrija o relatório para dizer "lista de exceções por nome" — mas a opção (1) é factível e é o que o documento promete.

## Item 6 — banco fundiário sem manifesto e testes não reproduzíveis

A auditoria certifica `data/fundiario_brasil.db` (1,67 GB) como "100% Real — 559.899 propriedades". O arquivo não é versionado, não tem checksum, e nenhum script de ingestão (`ingest_sicar_official.py`, `ingest_data.py`, `ingest_sigef_official.py`, `ingest_sncr_official.py`) grava `sha256` ou manifesto. A afirmação não é auditável por terceiros. E 3 testes de `src/lib/fundiario/matcher.test.ts` falham em clone limpo, enquanto o relatório afirma "35 arquivos… 100% de sucesso; 235 asserções… sem qualquer falha".

**Correção.**
1. **Manifesto.** `scripts/gerar_manifesto_fundiario.py` produzindo `data/MANIFESTO_FUNDIARIO.json`, **commitado** (o `.gitignore` só ignora `data/*.db*` e caches). Campos mínimos: `sha256` e tamanho do `.db`; contagem de linhas por tabela; conjuntos de origem com URL oficial e data de download; script de ingestão e commit git; timestamp; versão de esquema. Sem o `.db` presente, o script falha com mensagem clara — não gera manifesto vazio.
2. **Verificação.** Função em `src/lib/fundiario/` (ou script em `scripts/verificacao/`) que, com o banco presente, recalcula o `sha256` e compara com o manifesto, falhando em divergência. Com teste.
3. **Testes condicionais.** Os 3 casos dependentes passam a `it.skipIf(!baseDisponivel)` com motivo impresso. **Não** apague asserções nem relaxe expectativas. Acrescente um teste que, com banco presente, falha se o manifesto estiver ausente ou inconsistente — para a condicionalidade não virar porta de fuga.
4. **Texto do relatório.** Atualize o bloco de status da suíte para a verdade pós-mudança: números reais de passados e pulados, e a frase de que N casos exigem o banco provisionado, verificável pelo manifesto. Corrija "235 Asserções de Integridade" → **"235 casos de teste"** (são casos `it()`; há mais asserções que casos). Regenere as duas cópias do PDF.

**Aceitação.** `npx vitest run` em clone limpo, sem `data/`, deve terminar **sem falhas**, com os pulos declarados. Cole o sumário real no corpo do commit.

---

# PARTE C — Lastro bibliográfico das decisões

O projeto já tem norma (`docs/NORMA_LASTRO_CIENTIFICO.md`, regras R-L1 a R-L5), trava automatizada (`src/config/lastroCientifico.test.ts`) e uma auditoria de lastro de 20/10/2026 (`docs/auditorias/AUDITORIA_REFERENCIAS_2026-10-20.md`) que achou 7 lacunas e um achado estrutural. **Não refaça esse trabalho — continue de onde ele parou.** Reverifiquei o estado atual na branch; o que segue é o que permanece aberto, mais o que aquela auditoria declarou fora do seu alcance.

Mantenha a disciplina da norma em tudo que fizer: R-L2 (citação não conferida no primário é declarada como tal), R-L3 (fonte arquivada e **limite declarado** — o que ela não sustenta), R-L4 (sem fonte vira dívida nomeada, não maquiagem) e R-L5 (obra citada entra no acervo com metadados). E a regra de ouro da Seção 5 da norma: **"na dúvida sobre se a fonte sustenta a afirmação, ela não sustenta."**

## C1 — As 8 dívidas de 20/10 continuam todas abertas

Nenhuma foi fechada: **D02, D03, D11, D17, D18, P02, P05, P07**. Três delas a própria auditoria classificou como "falta de cruzamento, não falta de fonte" — a obra externa **já está no registro**, citada em outra decisão:

| Dívida | Lastro que já existe no registro |
| :--- | :--- |
| **D02** (limiares de triagem) | **Rikimaru et al. (2002)**, já citada em **D20** para o BSI |
| **P05** (classes WorldCover 30 e 40) | **Zanaga et al. (2021/2022)**, já citada em **D07** para a mesma base |
| **P02** (espaçamento do thinning) | **Roberts et al. (2017)**, já citada em **P01** para autocorrelação espacial |

Faça essas três primeiro: custo mínimo, risco nulo, e tire-as de `DIVIDA_DECLARADA` — a trava já exige a remoção de dívida que recebeu lastro, então ela valida a correção sozinha.

**D03, D18 e P07** exigem busca de fonte. Se não encontrar, mantenha a dívida pela R-L4 e **atualize o motivo** com o que foi buscado e onde — dívida sem rastro de busca apodrece.

## C2 — A trava não enxerga `proposta`, e são justamente as publicadas como método

`lastroCientifico.test.ts` filtra `d.estado === "decidida"`. Tudo em `proposta`/`pendente` escapa. Dois casos são graves porque a **metodologia publicada os apresenta como método consolidado**:

- **P01 — aresta do bloco espacial.** Estado `proposta`, **sem `valor` fixado**, justificativa "Derivada do alcance do variograma empírico; fallback provisório de 20 km". A metodologia publica "a ≈ 50 m (ROBERTS et al., 2017)" em §2.2, §3.7 e na Tabela 4, como se decidido. Pior: **toda a aritmética de unidades independentes de M2, e com ela os tetos de D24, repousa nesse valor**. Não há no repositório variograma empírico calculado que o sustente.
- **P04 — buffers de exclusão** (água 30 m, urbano 150 m, ocorrência hídrica > 10%). Estado `proposta`, referência: *"Constantes herdadas de `eligibilityConstants.ts`"* — herança de código, que a R-L1 recusa explicitamente. A metodologia publica os três valores em §3.1 e na Tabela 4.

**Ação.** (a) Estenda a trava a `proposta` e `pendente`, com dívida própria para não reprovar o mundo de uma vez; e (b) crie a trava que falta: **nenhum parâmetro citado na metodologia publicada pode estar em `proposta`/`pendente` sem marcação explícita de provisoriedade no próprio documento**. Para P01, ou calcule o variograma empírico da BP3 e decida o valor, ou marque "a ≈ 50 m" como provisório no documento — não deixe os tetos de D24 pendurados num parâmetro não decidido.

## C3 — Autorreferência nova entre as propostas

Não coberta pela auditoria de 20/10 (que só varreu as `decidida`). Referenciam **apenas** documentos internos (`DEC-7`, `DEC-16`, `ANEXOS_PROMPT_EXECUTOR_2026-10-06`): **P10** (expoente de Tweedie), **P11** (cobertura mínima da célula), **P20**, **P21** (tolerâncias de janela temporal), **P22** (ângulo off-nadir), **P23** (área mínima sem nuvem). Seis entradas. Classifique cada uma: busca de fonte, cruzamento com obra já no registro, ou dívida R-L4 declarada.

## C4 — O registro e a metodologia publicada citam obras diferentes para a mesma decisão

Três conflitos, todos verificáveis sem sair do repositório:

| Decisão | `src/config/decisoes.ts` | PDF da metodologia |
| :--- | :--- | :--- |
| **D01 / D20** — Fator C | Durigon et al. (2014), **International Journal of Remote Sensing 35(2):441-453** | DURIGON, C. A.; CARVALHO JÚNIOR… **Revista Brasileira de Ciência do Solo 38(6):1814-1824** |
| **D13** — Fator R | Waltrick, P. C. et al. (**2015**), **RBCS** | WALTRICK, P. C. et al. (**2010**), **Revista Brasileira de Recursos Hídricos 15(3):115-125** |
| Equação do R | Rufino **não consta** da referência de D13 | equação atribuída a **Rufino, Biscaia & Merten (1993)** |

**Isto resolve M5 da Parte A:** o registro tem a referência **correta** de D01 — é o artigo do IJRS que propõe C = (1 − NDVI)/2 — e o PDF da metodologia tem a errada. Não é mais "conferir no primário": é o projeto contradizendo a si mesmo. Corrija o PDF pela referência do registro, após confirmar no primário.

Para **D13**, há de fato dois trabalhos distintos de Waltrick (2010 na RBRH e 2015 na RBCS). Determine qual sustenta a equação efetivamente implementada, unifique registro e documento, e resolva junto a pendência **M6** (os coeficientes 67,355 / 0,8522 e a regionalização de Rufino). Note que D13 **já traz** a marcação de citação não conferida no primário — é a boa prática que a auditoria de 20/10 mandou generalizar; preserve-a.

## C5 — D09 é a decisão de maior carga com o lastro mais fraco

Três problemas somados, no parâmetro que o M1 da Parte A mostrou ser degenerado na BP3:

1. A citação **Mannigel et al. (2002), RBCS 26:1039-1049** está **SUSPENSA** por emenda de 06/10/2026: a obra encontrada com esses autores e ano é de *Acta Scientiarum* 24(5):1335-1340 e trata de **solos de São Paulo** — não sustenta classes de erodibilidade do Paraná.
2. Resta o **Documentos 246 da Embrapa Solos**, que sustenta **valores** de K por classe — mas **não prescreve** o corte em dois níveis em 0,0285 / 0,0300. O corte é escolha do projeto, hoje **sem fonte**.
3. A própria referência declara: *"a localização interna da tabela de erodibilidade NÃO foi conferida"*. E é dessa tabela que saem as faixas de Latossolos e Nitossolos citadas na metodologia — as mesmas que, em M1, deixam o Nível 2 vazio.

**Ação, nesta ordem:** conferir a tabela do Doc 246 no primário (R-L2/R-L3, registrando o que ela sustenta e o que não sustenta); extrair a distribuição real de `k_solos` na BP3 (é a medição já pedida em M1); só então redecidir o corte — com lastro, ou com dívida R-L4 explícita dizendo que o corte é operacional e de autoria do projeto.

## C6 — Números obsoletos da emenda de D16 não foram propagados

A emenda de geometria de D16 (de 18 polígonos de 10 ha para **72 polígonos de 5,02 ha**) não chegou a todas as entradas:

- **D26** ainda afirma *"um polígono de 10 ha contém 1.000 células"*. Com 5,02 ha são **502** células de 10 m.
- **D25** traz no cabeçalho *"cerca de 936 unidades efetivas"*, enquanto a sua **própria emenda de 06/10/2026**, no mesmo registro, manda ler *"36 agrupamentos e cerca de **920** unidades"*. A metodologia publica **936**.

Três valores para a mesma grandeza, dentro do critério pré-registrado de refutação. **É a origem documental de M2.** Propague a emenda, unifique o número, e refaça a conta a partir da fórmula de deflação que M2 exige explicitar.

## C7 — D11 (n ≥ 6) contra DP-24 (n ≥ 9), e o código que não aplica nenhum dos dois

- **D11** fixa "mínimo de 6 observações orbitais válidas", com referência *"Metodologia PPGTCA 2026, Seção 6.1"* — autorreferência pura, dívida aberta, e a auditoria de 20/10 já a apontou como "a de maior consequência sem fonte: governa suficiência amostral".
- **DP-24** fixou **n ≥ 9** para percentis de cauda, com **Hyndman & Fan (1996)** lido no primário e arquivado com SHA-256 (`docs/verificacoes/fontes/hyndman1996/`). É o **melhor lastro do projeto**: fonte primária, raciocínio explícito (Definição 6, Pr(X < X₍₁₎) = 1/(n+1) ⇒ 1/(n+1) ≤ 0,10 ⇒ n ≥ 9) e fronteira declarada.
- **O código não aplica nem um nem outro.** Em `src/lib/matriz/montagemTemporal.ts`, a função que produz `ndvi_p10`, `ndvi_p50` e `ndvi_p90` guarda apenas `nValidas === 0`. Com **uma** observação válida ela já emite percentis de cauda.

**Ação.** Aplique o piso de DP-24 aos percentis de cauda: abaixo de n = 9, `ndvi_p10` e `ndvi_p90` saem como `indisponivel` com causa, nunca como número. Reconcilie D11 com DP-24 — ou explique por escrito por que a cobertura temporal mínima (6) difere do mínimo para percentis (9), que é uma justificativa legítima se declarada. Cubra com teste. Esta é a correção de melhor relação custo-benefício da Parte C: usa o lastro que o projeto já pagou para obter.

## C8 — R-L5 é a única regra da norma sem trava

A norma exige que "toda obra citada entre no acervo, com metadados". Mas `docs/Selecao Bibliografica/INVENTARIO_SELECAO_BIBLIOGRAFICA.md` tem as colunas `Nº | Arquivo | Origem Prévia | Metodologia/Algoritmo | Relevância` — **sem autor, ano, título ou DOI**. A auditoria de 20/10 registrou isso como achado estrutural, mostrou que a conferência "toda citação tem obra no acervo" é hoje **inexecutável**, e propôs a correção. Não foi feita.

**Ação.** (a) Acrescente ao inventário as colunas **autor, ano, título, DOI** e **decisão vinculada** (D01, D09, …); (b) crie a trava que confronta os campos `referencia` do registro com o inventário, reprovando citação sem obra correspondente — nos moldes do varredor de padrões proibidos; (c) confirme se o pacote `ScienceDirect_articles_22Oct2026_*.zip` (38 MB, adicionado em 22/10) foi descompactado e inventariado — acervo sem metadados agrava a R-L5 em vez de atenuá-la.

Enquanto (a) e (b) não existirem, qualquer afirmação de que "todas as citações estão lastreadas" é inverificável, e deve ser declarada como tal.

## C9 — O que a auditoria de 20/10 declarou fora do seu alcance

Dois buracos que ela nomeou e não cobriu. **Ambos ficam nesta tarefa.**

1. **Os PDFs nunca foram varridos.** A auditoria auditou apenas `src/config/decisoes.ts`: *"Não auditei a apresentação, o compêndio metodológico, o manual nem os relatórios — onde o pesquisador relatou ter visto autorreferência."* Varra todos com `pdftotext -layout` procurando autorreferência ("Metodologia PPGTCA", "Planejamento V3", "Decisão D", caminhos `docs/`, "conforme o sistema") usada como se fosse lastro externo. Reporte por documento e por trecho.
2. **Referência mista não foi avaliada quanto ao mérito.** Onde há fonte externa **e** documento interno, a auditoria contou como conforme pelo critério adotado, mas registrou: *"vale conferir se a fonte externa sustenta de fato a decisão, ou se só acompanha."* São **D05, D06, D12, D16, D17, D19 e P03**. Avalie cada uma pela regra de ouro da norma e reclassifique o que for ornamento. Dois casos para começar, porque a assimetria já é visível:
   - **D12** cita Cochran (1977) — que sustenta **amostragem estratificada** como método, mas não o produto fatorial 3 × 3 × 2 nem os tercis empíricos desta bacia;
   - **D25** cita Nosek et al. (2018) — que sustenta **pré-registro** como prática, mas **nenhum** dos valores calibrados (ρ ≥ 0,40; Δρ ≥ 0,10; AUC ≥ 0,70; ΔAUC ≥ 0,05). O próprio registro os chama de "calibragem adotada (intermediária, entre três consideradas)", o que é honesto — mas, pela R-L4, precisa de fonte **ou** de dívida declarada. Hoje não tem nem uma nem outra.

   Não transforme isto em caça às bruxas: uma fonte que sustenta o **método** e não o **valor** é lastro legítimo do método. O que a norma exige é que a distinção esteja escrita.

## Entregáveis da Parte C

1. `docs/auditorias/AUDITORIA_REFERENCIAS_<data>.md` — continuação, **não** substituição, citando a de 20/10 e dizendo o que mudou desde então.
2. `src/config/decisoes.ts` atualizado: os três cruzamentos de C1, a propagação da emenda de D16 (C6), e a reclassificação de C9.2.
3. `src/config/lastroCientifico.test.ts` ampliado: cobertura de `proposta`/`pendente` (C2) e dívidas atualizadas.
4. Inventário com metadados e a trava de R-L5 (C8).
5. O piso de DP-24 aplicado no código, com teste (C7).
6. Lista explícita do que **permanece** em dívida, com motivo e data — pela R-L4.

---

## Fora de escopo — não faça, mas não finja que está resolvido

1. **Extração GEE real** (`reduceRegion` em `src/app/api/gee/select-candidates/route.ts`): é a Ação 2 da auditoria de 2026-09-13 e a única correção de fundo para a estratificação degenerada (item 3d e M1). Sem ela, o diagnóstico `estratificacao_degenerada` continuará verdadeiro.
2. **Porte do script de treino para D24/D25/D26** (alvo Tweedie contínuo, GroupKFold por polígono): ver M11.
3. **Correção estatística do IC do Kappa pixel-a-pixel** (tamanho amostral efetivo ou block bootstrap): ver item 4.

## Verificação final antes de empurrar

```bash
npx vitest run
npm run typecheck
npm run lint
python scripts/gerar_relatorio_mudancas_pdf.py
pdftotext -layout Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf - | grep -cE '\\[a-zA-Z]+|\$\$'
python scripts/gerar_pdf_metodologia_integrada.py
pdftoppm -f 1 -l 3 -r 150 -png "docs/BASES PARA A DISSERTAÇÃO/Metodologia_Integrada_Dissertacao_SAREL_Revisado.pdf" /tmp/meto
git log --oneline -10
```

Empurre com `git push -u origin <sua-branch>`. Em falha de rede, repita até 4 vezes com espera de 2s, 4s, 8s, 16s.

## Relato final esperado

- O que mudou, por item, com caminho e âncora.
- Saída real de `npx vitest run` (passados/pulados/falhados), não paráfrase.
- A medição de K na BP3 (M1) com os números, e a pergunta feita ao pesquisador.
- A fórmula de deflação adotada em M2 e os três números corrigidos.
- Confirmação visual (imagem, não `pdftotext`) de que o cabeçalho da metodologia parou de sobrepor e de que as equações do relatório não têm mais LaTeX cru.
- O N mínimo medido no item 4.
- Toda decisão tomada por conta própria onde o prompt oferecia alternativa.
- Os três pontos fora de escopo e as decisões pendentes (M1, item 5), repetidos como pendência aberta.
- Da Parte C: quais dívidas foram fechadas, quais permanecem e por quê; o resultado da varredura de autorreferência nos PDFs (C9.1); e a reclassificação das sete referências mistas (C9.2), separando o que a fonte sustenta como **método** do que ela não sustenta como **valor**.
