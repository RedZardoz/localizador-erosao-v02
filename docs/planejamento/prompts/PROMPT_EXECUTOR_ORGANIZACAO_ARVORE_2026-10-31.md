# Tarefa: reorganizar a árvore do repositório SAREL

**Substitui** `PROMPT_EXECUTOR_ORGANIZACAO_ARVORE_2026-10-30.md`, cujos achados foram medidos antes das rodadas de correção. Todos os números abaixo foram **remedidos em 31/10/2026 sobre `e018748`**.

**Objetivo do pesquisador:** deixar o repositório navegável por pares e pelo orientador, com o material fora de uso arquivado em `legado/` de forma categorizada, e com a reorganização **documentada e verificável**.

---

## Caminhos e push — leia primeiro

```bash
git fetch origin
git checkout -B sarel/executor-2026-10-09 origin/sarel/executor-2026-10-09
```

Trabalhe e empurre **direto em `sarel/executor-2026-10-09`**. Não crie branch nova. **Não espere notificação de push** — ele é síncrono. Confirme com um comando e encerre o turno:

```bash
git push origin sarel/executor-2026-10-09 && git log --oneline -1 origin/sarel/executor-2026-10-09
```

Se o push falhar por credencial, diga isso no relatório e **encerre** — o pesquisador empurra pelo terminal dele. Não fique em espera.

**Ponto de retorno:** o estado atual `e018748` está verde e verificado (92 arquivos, 725 testes). Anote esse hash; `git reset --hard e018748` desfaz tudo se a reorganização der errado.

---

## 1. Princípios (justifique por eles, não por gosto)

1. **A raiz contém apenas o que uma ferramenta lê.** Build, manifesto de pacote, `README.md` e `CLAUDE.md`.
2. **Um documento, um lugar canônico.** Cópia idêntica em dois caminhos é defeito.
3. **Nome de diretório sem espaço e sem acento.** Quebra script, `grep`, URL e citação em documento.
4. **`legado/` é o único depósito de material fora de uso**, sempre com data e motivo.
5. **Nada é apagado por organização.** As únicas remoções permitidas: duplicata byte-idêntica cujo conteúdo permanece na cópia canônica, e atalho `.lnk` do Windows.
6. **Todo movimento é `git mv`.** O histórico do arquivo sustenta a rastreabilidade perante a banca.

---

## 2. Estado medido em 31/10/2026

**783 arquivos versionados, 174,9 MB.**

### 2.1 Duplicação: 38 arquivos redundantes, 3,2 MB

Trinta delas são a cópia integral de `Auditoria_Pacotes_Fracionados/` dentro de `docs/auditorias/Audotoria Externa A/` (note o erro de grafia). As outras oito:

| MB | Caminhos byte-idênticos |
| ---: | :--- |
| 0,89 | `docs/verificacoes/fontes/agisprocedure...JSWC1996.pdf` ≡ `fontes/desmet1996/desmet_govers_1996_jswc.pdf` |
| 0,29 | `assets/icon.png` ≡ `public/icon.png` |
| 0,13 | `assets/icon.ico` ≡ `public/favicon.ico` |
| 0,06 | `Apresentacao_Simposio_7min_SAREL.pptx` (raiz) ≡ `docs/Apresentacao_Simposio_7min_SAREL.pptx` |
| 0,06 | `Relatorio_Mudancas_...pdf` (raiz) ≡ `docs/relatorios/Relatorio_Mudancas_...pdf` |
| 0,05 | **três** cópias do mesmo prompt (abaixo) |
| 0,03 | `docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/*.py` ≡ `scripts/d25/*.py` (4 arquivos) |
| 0,01 | `docs/planejamento/PROMPT_EXECUTOR_MANIFESTO_E_DEFLACAO_2026-10-31.md` em dois caminhos |

> **Mudou desde 30/10, para melhor:** as duas apresentações do simpósio e as duas cópias do relatório de mudanças, que antes divergiam em conteúdo, **hoje são byte-idênticas**. Deixaram de ser decisão e viraram remoção simples. A versão de 26,5 MB da apresentação sumiu — é o que explica o repositório ter caído de 196,4 MB para 174,9 MB.

### 2.2 Prompts duplicados em três caminhos

```
docs/planejamento/PROMPT_EXECUTOR_CORRECOES_METODOLOGICAS_2026-10-30.md
docs/planejamento/PROMPT_EXECUTOR_SAREL_correcoes.md
docs/planejamento/prompts/PROMPT_EXECUTOR_CORRECOES_METODOLOGICAS_2026-10-30.md   ← canônico
```

E `PROMPT_EXECUTOR_MANIFESTO_E_DEFLACAO_2026-10-31.md` em dois. **Canônico é `docs/planejamento/prompts/`**, com o padrão `PROMPT_EXECUTOR_<ASSUNTO>_<AAAA-MM-DD>.md`. Remova as cópias fora dele.

### 2.3 Dois lugares para a mesma função

| Função | Lugares concorrentes |
| :--- | :--- |
| Arquivo morto | `legado/` (raiz) **e** `docs/legado/` |
| Acervo bibliográfico | `docs/Selecao Bibliografica/` (índice de arquivos que **não estão** no repositório) **e** `docs/verificacoes/fontes/` (os primários de verdade, organizados por `autor+ano`) |
| Mesmo documento, dois formatos, duas pastas | `docs/apresentacoes/Mudanca_Radical_...pptx` e `docs/metodologia/Mudanca_Radical_...pdf` |

### 2.4 Dezenove diretórios com espaço ou acento

`docs/BASES PARA A DISSERTAÇÃO`, `docs/Selecao Bibliografica` (+2 subpastas), `docs/Seminario prov`, `docs/Plano de voo exemplo`, `docs/auditorias/Audotoria Externa A` (+1), e **9 subpastas de `docs/pluviometria/`** (`Céu Azul`, `Corbélia`, `Foz do Iguaçu`, `Quedas do Iguaçu`, `São Miguel do Iguaçu`, `Assis Chateaubriand`, `Santa Helena`, `Santa Isabel do Oeste`, `Terra Roxa`).

### 2.5 Raiz poluída — sete arquivos

```
Apresentacao_Simposio_7min_SAREL.pptx          Justificativa_Uso_e_Alternativa_Jev_SAREL.pdf
Instalador_SAREL.exe                            Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf
Justificativa_Recorte_Espacial_Parana3_SAREL.pdf  SAREL_Field_Collector_Especificacao_Tecnica.pdf
Selecao Bibliografica.lnk
```

### 2.6 Primários soltos onde há convenção

`docs/verificacoes/fontes/` organiza por `autor+ano`, mas três PDFs estão soltos:

- `agisprocedure...JSWC1996.pdf` — **duplicata exata** de `desmet1996/`;
- `2010_04_20_waltrick.pdf` (14,4 MB) — é o **Waltrick de 2010**, e existe a pasta `waltrick2015/`. Arquive como `waltrick2010/`;
- `79071_en.pdf` — obra não identificada.

### 2.7 Peso

36,9 MB (21% do repositório) são **um zip da ScienceDirect nunca descompactado** em `docs/Selecao Bibliografica/Pesquisas Machine Learning/`. Mais 2,1 MB de `Instalador_SAREL.exe`, binário compilado versionado.

---

## 3. Estrutura-alvo

```
raiz/                        só configuração, manifesto, README e CLAUDE.md
├── data/                    MANIFESTO_FUNDIARIO.json e PARAMETROS_DEFLACAO.json — NÃO MOVER
├── docs/
│   ├── README.md            ← NOVO: mapa da documentação
│   ├── dissertacao/         ← era "BASES PARA A DISSERTAÇÃO"
│   ├── metodologia/         norma, design, ficha técnica, justificativas, notas temáticas
│   ├── manuais/             manuais vigentes
│   ├── apresentacoes/       apresentações vigentes + roteiros
│   ├── relatorios/          relatórios vigentes (+ modelagem/)
│   ├── auditorias/
│   │   ├── externa_a/       ← era "Audotoria Externa A", sem a cópia duplicada
│   │   └── pacotes_fracionados/
│   ├── verificacoes/
│   │   └── fontes/<autor><ano>/
│   ├── bibliografia/        ← era "Selecao Bibliografica"
│   ├── planejamento/
│   │   ├── prompts/         ← canônico dos prompts
│   │   ├── historico/
│   │   └── anexos_2026-10-06/
│   ├── submissoes/sbproppg_2026/   ← era "Seminario prov"
│   ├── dados/
│   │   ├── pluviometria/<municipio_sem_acento>/
│   │   └── planos_de_voo/   ← era "Plano de voo exemplo"
│   ├── figuras/{formulas,manual,interface}/
│   └── modelos/
└── legado/
    ├── README.md            ← NOVO: índice do arquivado, com data e motivo
    ├── pre_sarel/
    ├── versoes_anteriores/<data>_<motivo>/
    ├── documentacao_pre_v2/     ← era docs/legado/
    ├── apresentacoes_superadas/
    └── manuais_superados/
```

---

## 4. Movimentos

### 4.1 Esvaziar a raiz

| Origem | Destino | Motivo |
| :--- | :--- | :--- |
| `Relatorio_Mudancas_...pdf` | **remover** | byte-idêntico ao de `docs/relatorios/`, que fica como canônico |
| `Apresentacao_Simposio_7min_SAREL.pptx` | **remover** | byte-idêntico ao de `docs/`, que vai para `docs/apresentacoes/` |
| `Justificativa_Recorte_Espacial_Parana3_SAREL.pdf` | `docs/metodologia/` | sustenta o recorte de D07 |
| `Justificativa_Uso_e_Alternativa_Jev_SAREL.pdf` | `docs/metodologia/` | idem |
| `SAREL_Field_Collector_Especificacao_Tecnica.pdf` | `docs/dissertacao/` | especificação do instrumento |
| `Selecao Bibliografica.lnk` | **remover** | atalho do Windows, inútil fora da máquina de origem |
| `Instalador_SAREL.exe` | ver §5 Q3 | decisão do pesquisador |

Os `.bat` da raiz (`Iniciar_Localizador_Erosao.bat`, `Instalar_Atalho_Windows.bat`, `Desinstalar_Atalho_Windows.bat`, `Gerar_Pacote_Portatil.bat`, `Gerar_Zip_Banco_GoogleDrive.bat`) **permanecem na raiz**: são ponto de entrada do usuário final no Windows. Registre a exceção no `docs/README.md`.

### 4.2 Unificar o legado

`docs/legado/` → `legado/documentacao_pre_v2/` (os 6 arquivos juntos). Depois disso não pode existir mais de um diretório de legado.

### 4.3 Resolver duplicatas

| Ação | Alvo |
| :--- | :--- |
| **Remover** subárvore duplicada | `docs/auditorias/Audotoria Externa A/Auditoria_Pacotes_Fracionados/` — 30 arquivos byte-idênticos. Confirme blob a blob antes |
| **Renomear** | `docs/auditorias/Audotoria Externa A/` → `docs/auditorias/externa_a/`, preservando os **6 arquivos únicos** (entre eles `ESTUDO_CRITICO_BIBLIOGRAFIA_SAREL.md` e o relatório de conciliação bibliográfica — material relevante à auditoria de lastro, não perca) |
| **Remover** | `docs/verificacoes/fontes/agisprocedure...JSWC1996.pdf` |
| **Remover** | as duas cópias de prompt fora de `docs/planejamento/prompts/` (§2.2) |
| **Reescrever** | `docs/bibliografia/README.md` hoje é cópia byte-idêntica do inventário; torne-o um índice curto apontando para o inventário, o manifesto e `docs/verificacoes/fontes/` |
| **Verificar antes** | `assets/icon.png` ≡ `public/icon.png` e `assets/icon.ico` ≡ `public/favicon.ico`: cheque qual caminho o build consome. Se ambos forem necessários, **não** remova — registre como duplicação intencional |
| **Não mexer** | `docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/*.py` ≡ `scripts/d25/*.py` são cópias **congeladas** junto da proposta. Mantenha e registre a intenção no README dos anexos |

### 4.4 Arquivar primários soltos

```
docs/verificacoes/fontes/2010_04_20_waltrick.pdf → docs/verificacoes/fontes/waltrick2010/
docs/verificacoes/fontes/79071_en.pdf            → identificar e arquivar em <autor><ano>/
```

Se não identificar `79071_en.pdf`, **não invente**: mova para `fontes/nao_identificados/` e registre. Pela R-L2, fonte não identificada é declarada como tal.

### 4.5 Terminar a renomeação R-L2 de Zhu

A pasta e o PDF já foram renomeados; os dois arquivos de extração mantiveram o nome da obra errada:

```
docs/verificacoes/fontes/zhu2013/extrair_zhu_2014.py        → extrair_zhu_2013.py
docs/verificacoes/fontes/zhu2013/saida_extracao_zhu_2014.txt → saida_extracao_zhu_2013.txt
```

Atualize as referências em `docs/auditorias/AUDITORIA_D11_2026-10-31.md` e `docs/verificacoes/2026-10-31_suficiencia_temporal_zhu_ccdc.md`.

### 4.6 Renomear diretórios

| De | Para |
| :--- | :--- |
| `docs/BASES PARA A DISSERTAÇÃO/` | `docs/dissertacao/` |
| `docs/Selecao Bibliografica/` | `docs/bibliografia/` |
| `└─ Para Revisar/` · `└─ Pesquisas Machine Learning/` | `para_revisar/` · `pesquisas_machine_learning/` |
| `docs/Seminario prov/` | `docs/submissoes/sbproppg_2026/` |
| `docs/Plano de voo exemplo/` | `docs/dados/planos_de_voo/` |
| `docs/pluviometria/` | `docs/dados/pluviometria/` |
| as 16 subpastas de município | minúsculas, sem acento, com `_`: `ceu_azul`, `corbelia`, `foz_do_iguacu`, `quedas_do_iguacu`, `sao_miguel_do_iguacu`, `assis_chateaubriand`, `santa_helena`, `santa_isabel_do_oeste`, `terra_roxa`, e as demais por coerência |

Remova também `docs/Selecao Bibliografica/geolocalizacao-erosao-propriedade.lnk`.

> **Antes de renomear pluviometria:** procure leitores desses caminhos em `scripts/pluviometria/` e em `src/`. Se algum código monta o caminho a partir do nome do município com acento, ele quebra — ajuste no mesmo commit.

### 4.7 Consolidar figuras

```
docs/figuras_formulas/ → docs/figuras/formulas/
docs/figuras_manual/   → docs/figuras/manual/
docs/images/           → docs/figuras/interface/
```

### 4.8 Juntar o que está partido

`Mudanca_Radical_Metodologia_SAREL_v2` em `.pptx` e `.pdf` está em duas pastas; deixe os dois em `docs/apresentacoes/`.

Reúna em **`docs/metodologia/`** as notas hoje soltas em `docs/`: `design.md`, `FICHA_TECNICA_SAREL.md`, `NORMA_LASTRO_CIENTIFICO.md`/`.pdf`, `PROVENIENCIA_ASSISTENCIA_IA.md`, `Delimitacao_Territorial_e_Selecao_Amostral_MultiEscala_BP3.md`, `Demonstracao_Transparencia_Explicabilidade_Calculos.md`, `Ingestao_Processamento_Dados_Drone_Spectral2.md`, `Pacote_Reprodutibilidade_Auditoria_Cientifica.md`.

Reúna em **`docs/apresentacoes/`**: `APRESENTACAO_SAREL.md`, `Roteiro_Video_7min_Simposio_SAREL.md` e os `.pptx`.

Reúna em **`docs/manuais/`**: os `Manual_*.pdf` que o pesquisador declarar vigentes (§5 Q1).

### 4.9 A metodologia canônica

`docs/BASES PARA A DISSERTAÇÃO/` hoje contém **apenas**:

```
Metodologia_Integrada_Dissertacao_SAREL_Revisado.pdf      ← canônica
Metodologia_Integrada_Dissertacao_SAREL_Revisado.docx     ← canônica
Especificacao_Metodologica_Projeto_Dissertacao_SAREL.pdf
Defesa_Metodologica_Replicabilidade_e_Vies_Espectral.pdf
```

As versões divergentes já foram excluídas na rodada de correções. Ao mover para `docs/dissertacao/`, **remova o sufixo `_Revisado`** — ele deixou de distinguir qualquer coisa. Atualize no mesmo commit os dois geradores que escrevem nesse caminho: `scripts/gerar_pdf_metodologia_integrada.py` e `scripts/gerar_docx_metodologia_integrada.py`.

---

## 5. Decisões do pesquisador — PERGUNTE, não escolha

Execute tudo da §4 que não dependa destas.

**Q1 — Quais manuais estão vigentes?**
`Manual_Procedimentos_SAREL_2026-10-06.pdf` (09/10), `Manual_Instalacao_e_Operacao_SAREL.pdf` (24/09, **defasado**: `scripts/gerar_manual_pdf.py` mudou em 18/10), `Manual_Metodologico_e_Calculos_SAREL.pdf` (22/09). *Recomendação:* vigentes → `docs/manuais/`; superados → `legado/manuais_superados/`; o defasado deve ser **regenerado** antes de classificado.

**Q2 — Qual apresentação é a vigente de cada finalidade?**
`Apresentacao_Pesquisa_SAREL_2026-10-06.pptx` (09/10), `Mudanca_Radical_Metodologia_SAREL_v2.pptx` (02/10), `Apresentacao_Simposio_7min_SAREL.pptx` (25/09), `Apresentacao_SAREL_PPGTCA_2026.pptx` (24/09). Classifique por finalidade; superadas → `legado/apresentacoes_superadas/`.

**Q3 — `Instalador_SAREL.exe` continua versionado?**
2,1 MB de binário compilado, com fonte em `scripts/installer/InstaladorSAREL.cs`. *Recomendação:* tirar do versionamento (`.gitignore`) e publicar como release, mantendo a fonte e o `config_instalador.json`. Binário compilado no repositório não é auditável — justamente o que a banca cobra.

**Q4 — O que fazer com o zip de 36,9 MB da ScienceDirect?**
21% do repositório, nunca descompactado. *Recomendação:* descompactar, inventariar com autor/ano/título/DOI — que é exatamente o **C8** da auditoria de lastro, ainda aberto — e então decidir se os PDFs ficam versionados ou só o inventário, como já ocorre com o resto do acervo.

---

## 6. Reapontar referências — a parte que não pode faltar

```bash
grep -rn "Selecao Bibliografica\|BASES PARA A DISSERTA\|Seminario prov\|Plano de voo exemplo\|Audotoria Externa A\|docs/legado\|docs/images\|docs/figuras_formulas\|docs/figuras_manual\|docs/pluviometria\|_Revisado\|zhu_2014" \
  --include="*.md" --include="*.py" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.mts" --include="*.bat" .
```

Pontos conhecidos:

1. **`scripts/gerar_pdf_metodologia_integrada.py`** — a seção 6 do documento cita literalmente `docs/Selecao Bibliografica/Pesquisas Machine Learning/`, `docs/Selecao Bibliografica/Para Revisar/` e `docs/verificacoes/fontes/`. Atualize os textos **e regenere PDF e DOCX no mesmo commit**, senão o documento publicado aponta para pastas inexistentes.
2. **`scripts/gerar_relatorio_mudancas_pdf.py`** — confirme o `output_path` após a remoção da cópia da raiz.
3. **`CLAUDE.md` e `README.md`** — mapeiam a árvore para toda sessão de assistente.
4. **`.gitignore`** — ajuste padrões que citam caminhos movidos, e acrescente o do Q3 se aceito.
5. **`docs/NORMA_LASTRO_CIENTIFICO.md`** e as auditorias citam `docs/verificacoes/fontes/<pasta>/`.
6. **`src/config/deflacao.test.ts`** varre os cinco geradores por caminho; **`src/lib/seguranca/padroesProibidos.test.ts`** tem piso mínimo de arquivos em `src/components`. Renomeação pode derrubá-los.
7. **`data/MANIFESTO_FUNDIARIO.json`** e **`data/PARAMETROS_DEFLACAO.json`** são lidos por caminho fixo em `verificadorManifesto.ts`, `deflacao.ts` e nos cinco geradores. **Permanecem em `data/`.**

---

## 7. Documentação a produzir

### 7.1 `docs/README.md` (novo)
Mapa da documentação: uma linha por diretório dizendo **o que vive ali e o que não vive**. Inclua a regra dos `.bat` na raiz e o apontamento para `legado/`. É a porta de entrada; escreva para quem abre o repositório pela primeira vez.

### 7.2 `legado/README.md` (novo)
Para cada subpasta: **o que é, de quando é, por que saiu de circulação e o que a substituiu**. Sem isso, `legado/` vira depósito.

### 7.3 `docs/planejamento/REORGANIZACAO_ARVORE_2026-10-31.md` (novo)
O registro verificável:

- **tabela completa origem → destino**, uma linha por arquivo, com o motivo em uma frase;
- **lista das remoções**, cada uma com o hash do blob e o caminho da cópia que permanece — a prova de que nada se perdeu;
- **as respostas do pesquisador** a Q1–Q4, com data;
- **antes e depois em números**: arquivos na raiz, diretórios com espaço/acento, duplicatas, tamanho do repositório;
- **o que NÃO foi movido e por quê** (os `.bat`, os anexos congelados do D25, os JSON de `data/`, eventuais ícones duplicados por necessidade de build);
- o comando de verificação que qualquer revisor pode rodar.

### 7.4 Commits, separados por natureza
1. `chore(arvore): remover duplicatas exatas e atalhos .lnk`
2. `chore(arvore): unificar legado e arquivar material superado`
3. `chore(arvore): renomear diretorios sem espaco e sem acento`
4. `chore(arvore): esvaziar a raiz e consolidar docs`
5. `fix(geradores): reapontar caminhos de saida e citacoes apos a reorganizacao`
6. `docs(arvore): mapa da documentacao, indice do legado e registro da reorganizacao`

Rodapé obrigatório em cada um:
```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0124eRLwbTVuEsVKcsq67486
```

---

## 8. Verificação

**Rode `npx vitest run` ANTES de começar** e anote o número de partida (esperado: 92 arquivos, 725 aprovados, 3 pulados). Rode de novo **após cada bloco de movimentos**, não só no fim — esta é a rodada com maior risco de quebra por caminho.

```bash
# 1. nada perdido
git ls-tree -r --name-only HEAD | wc -l
git ls-tree -r -l HEAD | awk '{s+=$4} END {printf "%.1f MB\n", s/1048576}'

# 2. nenhum diretorio com espaco ou acento
git ls-tree -r --name-only HEAD | sed 's#/[^/]*$##' | sort -u | grep -E ' |\\3' && echo "AINDA HA" || echo "OK"

# 3. nenhuma duplicata exata nao declarada
git ls-tree -r -l HEAD | awk '{print $3}' | sort | uniq -d

# 4. raiz limpa de documento de pesquisa
git ls-tree --name-only HEAD | grep -iE '\.(pdf|pptx|docx|exe|lnk)$' && echo "AINDA HA" || echo "OK"

# 5. nada quebrou
npx vitest run && npm run typecheck && npm run lint

# 6. geradores produzem nos caminhos certos
python scripts/gerar_pdf_metodologia_integrada.py
python scripts/gerar_docx_metodologia_integrada.py
python scripts/gerar_relatorio_mudancas_pdf.py
git status --short
```

---

## 9. Relato final

Cada afirmação numérica ou de caminho acompanhada do comando que a produziu e da **saída real colada**. Nome de arquivo confirmado com `ls` ou `git show`, não lembrado.

- tabela origem → destino (pode remeter ao arquivo da §7.3);
- remoções, com blob e cópia remanescente;
- respostas de Q1–Q4 e o que foi feito com cada uma;
- antes e depois em números;
- saída real dos seis comandos da §8;
- o que ficou pendente, e por quê;
- registro de que `docs/auditorias/externa_a/` contém material bibliográfico relevante à auditoria de lastro (C8, ainda aberto);
- **a linha de confirmação do push.**

Depois disso, **encerre o turno**. Não aguarde notificação.
