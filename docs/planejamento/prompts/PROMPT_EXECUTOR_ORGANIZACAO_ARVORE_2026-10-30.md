# Tarefa: reorganizar a árvore do repositório SAREL

**Objetivo declarado pelo pesquisador:** deixar o repositório navegável por pares e pelo orientador, com o material fora de uso arquivado em `legado/` de forma categorizada, e com a documentação organizada de modo que a reorganização fique **documentada e verificável**.

**Branch:** parta de `origin/sarel/executor-2026-10-09` (é onde está o trabalho vivo).

```bash
git fetch origin
git checkout -B sarel/organizacao-arvore origin/sarel/executor-2026-10-09
```

---

## ⚠ SEQUENCIAMENTO — leia antes de começar

Existe outra tarefa em curso: `docs/planejamento/prompts/PROMPT_EXECUTOR_CORRECOES_METODOLOGICAS_2026-10-30.md` (Partes A, B e C). Ela **edita** vários dos arquivos que esta tarefa **move**: os geradores de PDF, os PDFs da metodologia e do relatório de mudanças, `src/config/decisoes.ts`, `src/lib/seguranca/padroesProibidos.test.ts` e o inventário bibliográfico.

**Rodar as duas em paralelo produz conflito garantido.** Execute esta tarefa **depois** que a das correções terminar e estiver mesclada. Se por algum motivo esta vier primeiro, avise: as âncoras de caminho da outra tarefa precisarão ser reescritas antes de rodá-la.

Há ainda um **acoplamento direto**: a seção 6 do PDF da metodologia afirma que o acervo está em `docs/Selecao Bibliografica/Pesquisas Machine Learning/`, `docs/Selecao Bibliografica/Para Revisar/` e `docs/verificacoes/fontes/`. Renomear esses diretórios **invalida o texto publicado**. Portanto, toda renomeação de diretório citado em documento gerado exige **regenerar o documento** no mesmo commit (ver §6).

---

## 1. Princípios da organização (justifique por eles, não por gosto)

1. **A raiz contém apenas o que uma ferramenta lê.** Configuração de build, manifesto de pacote, README e CLAUDE.md. Documento de pesquisa na raiz é ruído para quem clona.
2. **Um documento, um lugar canônico.** Cópia idêntica em dois caminhos é defeito, não redundância útil.
3. **Nome de diretório sem espaço e sem acento.** Espaço e acento quebram script de shell, caminho em `grep`, URL do GitHub e citação em documento. É a causa de três dos achados abaixo.
4. **`legado/` é o único depósito de material fora de uso**, sempre com **data** e **motivo** no caminho ou no README.
5. **Nada é apagado por organização.** O que sai de circulação vai para `legado/`. As únicas remoções permitidas são: (a) duplicata byte-idêntica cujo conteúdo permanece na cópia canônica, e (b) atalho `.lnk` do Windows, que não funciona fora da máquina de origem.
6. **Todo movimento é `git mv`**, nunca copiar-e-apagar: o histórico do arquivo tem de sobreviver, porque é ele que sustenta a rastreabilidade perante a banca.

---

## 2. Achados que motivam a reorganização (todos verificados em `e6fc6e8`)

Repositório: **757 arquivos versionados, 196,4 MB**.

### 2.1 Duplicação

| Achado | Evidência |
| :--- | :--- |
| **36 arquivos redundantes, 3,1 MB** | 30 deles são a cópia integral de `Auditoria_Pacotes_Fracionados/` dentro de `docs/auditorias/Audotoria Externa A/` (note o erro de grafia em "Audotoria") |
| **O relatório de mudanças "oficial" é a versão arquivada** | `docs/relatorios/Relatorio_Mudancas_...pdf` tem blob `c75bddae`, **byte-idêntico** ao de `legado/versoes_anteriores/2026-09-17_pre_compensacoes/`. A versão corrente (`0e7a3346`) está **solta na raiz**. Os papéis estão invertidos |
| **Duas apresentações com o mesmo nome e conteúdos diferentes** | `Apresentacao_Simposio_7min_SAREL.pptx`: raiz = 26,5 MB (01/10); `docs/` = 0,1 MB (25/09). Mesmo nome, 265× de diferença |
| `README.md` do acervo é cópia byte-idêntica do inventário | `docs/Selecao Bibliografica/README.md` = `INVENTARIO_SELECAO_BIBLIOGRAFICA.md` |
| Ícones duplicados | `assets/icon.png` = `public/icon.png`; `assets/icon.ico` = `public/favicon.ico` |

### 2.2 Dois lugares para a mesma função

| Função | Lugares concorrentes |
| :--- | :--- |
| Arquivo morto | `legado/` (raiz) **e** `docs/legado/` |
| Acervo bibliográfico | `docs/Selecao Bibliografica/` (índice de arquivos que **não estão no repositório**) **e** `docs/verificacoes/fontes/` (os primários de verdade, organizados por `autor+ano`) |
| Mesmo documento em dois formatos, em pastas diferentes | `docs/apresentacoes/Mudanca_Radical_...pptx` e `docs/metodologia/Mudanca_Radical_...pdf` |

### 2.3 Nomes que quebram ferramenta

`docs/BASES PARA A DISSERTAÇÃO`, `docs/Selecao Bibliografica`, `docs/Seminario prov`, `docs/Plano de voo exemplo`, `docs/auditorias/Audotoria Externa A`, e **5 subpastas de `docs/pluviometria/`** com acento (`Céu Azul`, `Corbélia`, `Foz do Iguaçu`, `Quedas do Iguaçu`, `São Miguel do Iguaçu`).

### 2.4 Raiz poluída

Fora de lugar na raiz: `Apresentacao_Simposio_7min_SAREL.pptx`, `Justificativa_Recorte_Espacial_Parana3_SAREL.pdf`, `Justificativa_Uso_e_Alternativa_Jev_SAREL.pdf`, `Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf`, `SAREL_Field_Collector_Especificacao_Tecnica.pdf`, `Selecao Bibliografica.lnk`, `Instalador_SAREL.exe`.

### 2.5 Arquivos soltos onde há convenção

`docs/verificacoes/fontes/` organiza primários em pastas `autor+ano` (`desmet1996/`, `hyndman1996/`, `renard1997/`, `rufino1993/`, `waltrick2015/`…), mas **três PDFs estão soltos** na raiz da pasta:

- `agisprocedureforautomaticallycalculatingtheUSLELSfactorontopographicallycompleslandscapsJSWC1996.pdf` — **duplicata exata** de `desmet1996/desmet_govers_1996_jswc.pdf`;
- `2010_04_20_waltrick.pdf` (14,4 MB) — é o **Waltrick de 2010**, enquanto existe a pasta `waltrick2015/`. **Este arquivo é evidência material do conflito de citação apontado em C4 da outra tarefa** (o registro cita Waltrick 2015/RBCS; a metodologia cita Waltrick 2010/RBRH). Não o perca: arquive-o como `waltrick2010/` e aponte-o na resolução de C4;
- `79071_en.pdf` — nome opaco, obra não identificada.

### 2.6 Documento publicado defasado do seu gerador

`docs/Manual_Instalacao_e_Operacao_SAREL.pdf` foi gerado pela última vez em **24/09**, mas `scripts/gerar_manual_pdf.py` foi alterado em **18/10**. O manual publicado não reflete o próprio código que o produz.

### 2.7 Peso

36,9 MB (19% do repositório) são **um zip da ScienceDirect nunca descompactado**: `docs/Selecao Bibliografica/Pesquisas Machine Learning/ScienceDirect_articles_22Oct2026_13-13-36.639.zip`. Mais 2,1 MB de `Instalador_SAREL.exe`, binário compilado versionado.

### 2.8 Observação que não é de organização, mas apareceu aqui

`docs/auditorias/Audotoria Externa A/` contém **seis arquivos únicos**, dois deles diretamente relevantes à auditoria de lastro bibliográfico (Parte C da outra tarefa): `ESTUDO_CRITICO_BIBLIOGRAFIA_SAREL.md` e `relat_rio_definitivo_de_auditoria_e_concilia_o_bibliogr_fica_sarel_v2.md`. Preserve-os e **registre no relato** que existem, para que a Parte C os consulte.

---

## 3. Estrutura-alvo

```
raiz/                        só configuração, manifesto, README e CLAUDE.md
├── docs/
│   ├── README.md            ← NOVO: mapa da documentação (porta de entrada do orientador)
│   ├── dissertacao/         ← era "BASES PARA A DISSERTAÇÃO"
│   ├── metodologia/         norma, design, ficha técnica, justificativas, notas temáticas
│   ├── manuais/             manuais vigentes
│   ├── apresentacoes/       apresentações vigentes + roteiros
│   ├── relatorios/          relatórios vigentes (+ modelagem/)
│   ├── auditorias/
│   │   ├── externa_a/       ← era "Audotoria Externa A" (sem a cópia duplicada)
│   │   └── pacotes_fracionados/
│   ├── verificacoes/
│   │   └── fontes/<autor><ano>/        primários arquivados (R-L3)
│   ├── bibliografia/        ← era "Selecao Bibliografica"
│   ├── planejamento/
│   │   ├── prompts/         ← prompts do executor (exigência do pesquisador)
│   │   ├── historico/
│   │   └── anexos_2026-10-06/
│   ├── submissoes/          ← era "Seminario prov"
│   │   └── sbproppg_2026/
│   ├── dados/
│   │   ├── pluviometria/<municipio_sem_acento>/
│   │   └── planos_de_voo/   ← era "Plano de voo exemplo"
│   ├── figuras/
│   │   ├── formulas/  manual/  interface/
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

## 4. Movimentos a executar

### 4.1 Esvaziar a raiz

| Origem (raiz) | Destino | Motivo |
| :--- | :--- | :--- |
| `Relatorio_Mudancas_Metodologicas_...pdf` (blob `0e7a3346`) | `docs/relatorios/` | é a versão **corrente**; substitui a cópia arquivada hoje ali |
| `Apresentacao_Simposio_7min_SAREL.pptx` (26,5 MB, 01/10) | `docs/apresentacoes/` | é a versão real; ver §5 Q3 |
| `Justificativa_Recorte_Espacial_Parana3_SAREL.pdf` | `docs/metodologia/` | sustenta o recorte de D07 |
| `Justificativa_Uso_e_Alternativa_Jev_SAREL.pdf` | `docs/metodologia/` | idem |
| `SAREL_Field_Collector_Especificacao_Tecnica.pdf` | `docs/dissertacao/` | especificação técnica do instrumento |
| `Selecao Bibliografica.lnk` | **remover** | atalho do Windows; não funciona fora da máquina de origem |
| `Instalador_SAREL.exe` | ver §5 Q4 | decisão do pesquisador |

Os `.bat` da raiz (`Iniciar_Localizador_Erosao.bat`, `Instalar_Atalho_Windows.bat`, `Desinstalar_Atalho_Windows.bat`, `Gerar_Pacote_Portatil.bat`, `Gerar_Zip_Banco_GoogleDrive.bat`) **permanecem na raiz**: são ponto de entrada do usuário final no Windows e movê-los quebra o fluxo de instalação. Registre essa exceção no `docs/README.md`.

### 4.2 Unificar o legado

```
docs/legado/            → legado/documentacao_pre_v2/
```
Os 6 arquivos (`MANUAL_INSTALACAO.md`, `MANUAL_OPERACAO.md`, `GUIA_CONFIGURACAO_CREDENCIAIS.md`, `MAPA_DOCUMENTACAO_CALCULOS.md`, `README.md`, `design.md`) vão juntos. Depois disso **não pode existir mais de um diretório de legado**.

### 4.3 Resolver as duplicatas

| Ação | Alvo |
| :--- | :--- |
| **Remover** a subárvore duplicada | `docs/auditorias/Audotoria Externa A/Auditoria_Pacotes_Fracionados/` — 30 arquivos byte-idênticos aos de `docs/auditorias/Auditoria_Pacotes_Fracionados/`. Confirme blob a blob **antes** de remover |
| **Renomear** | `docs/auditorias/Audotoria Externa A/` → `docs/auditorias/externa_a/` (corrige a grafia), preservando os 6 arquivos únicos |
| **Remover** | `docs/verificacoes/fontes/agisprocedure...JSWC1996.pdf` (duplicata exata de `desmet1996/`) |
| **Transformar em índice de verdade** | `docs/bibliografia/README.md` hoje é cópia do inventário; reescreva como índice curto apontando para o inventário, o manifesto e `docs/verificacoes/fontes/` |
| **Decidir** | `assets/icon.png` = `public/icon.png` e `assets/icon.ico` = `public/favicon.ico`. Verifique qual caminho o build consome antes de mexer; se ambos forem necessários, **não** remova — registre a duplicação como intencional |
| **Não mexer** | `docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/*.py` duplicam `scripts/d25/*.py`. Parecem cópias **congeladas** junto da proposta. Mantenha e registre a intenção no README dos anexos |

### 4.4 Arquivar os primários soltos

```
docs/verificacoes/fontes/2010_04_20_waltrick.pdf → docs/verificacoes/fontes/waltrick2010/
docs/verificacoes/fontes/79071_en.pdf            → identificar a obra e arquivar em <autor><ano>/
```
Se não conseguir identificar `79071_en.pdf`, **não invente**: mova para `docs/verificacoes/fontes/nao_identificados/` e registre no relato. Pela R-L2 da norma, fonte não identificada é declarada como tal.

### 4.5 Renomear diretórios (sem espaço, sem acento)

| De | Para |
| :--- | :--- |
| `docs/BASES PARA A DISSERTAÇÃO/` | `docs/dissertacao/` |
| `docs/Selecao Bibliografica/` | `docs/bibliografia/` |
| `docs/Selecao Bibliografica/Para Revisar/` | `docs/bibliografia/para_revisar/` |
| `docs/Selecao Bibliografica/Pesquisas Machine Learning/` | `docs/bibliografia/pesquisas_machine_learning/` |
| `docs/Seminario prov/` | `docs/submissoes/sbproppg_2026/` |
| `docs/Plano de voo exemplo/` | `docs/dados/planos_de_voo/` |
| `docs/pluviometria/` | `docs/dados/pluviometria/` |
| `docs/pluviometria/Céu Azul/` etc. | `ceu_azul/`, `corbelia/`, `foz_do_iguacu/`, `quedas_do_iguacu/`, `sao_miguel_do_iguacu/` — e, por coerência, **todos** os 16 municípios em minúsculas com `_` |

Em `docs/bibliografia/`, remova também `geolocalizacao-erosao-propriedade.lnk` (atalho do Windows).

> **Atenção ao renomear as pastas de pluviometria:** procure antes por leitores desses caminhos em `scripts/pluviometria/` e em `src/`. Se algum código monta o caminho a partir do nome do município com acento, ele quebra — ajuste no mesmo commit.

### 4.6 Consolidar figuras

```
docs/figuras_formulas/ → docs/figuras/formulas/
docs/figuras_manual/   → docs/figuras/manual/
docs/images/           → docs/figuras/interface/
```
`docs/images/` são capturas de tela da interface; o nome em inglês destoa do resto da árvore.

### 4.7 Juntar o que está partido

`docs/apresentacoes/Mudanca_Radical_Metodologia_SAREL_v2.pptx` e `docs/metodologia/Mudanca_Radical_Metodologia_SAREL_v2.pdf` são o mesmo documento em dois formatos, em duas pastas. Deixe os dois em `docs/apresentacoes/`.

Reúna em `docs/metodologia/` as notas temáticas hoje soltas em `docs/`: `design.md`, `FICHA_TECNICA_SAREL.md`, `NORMA_LASTRO_CIENTIFICO.md`/`.pdf`, `PROVENIENCIA_ASSISTENCIA_IA.md`, `Delimitacao_Territorial_e_Selecao_Amostral_MultiEscala_BP3.md`, `Demonstracao_Transparencia_Explicabilidade_Calculos.md`, `Ingestao_Processamento_Dados_Drone_Spectral2.md`, `Pacote_Reprodutibilidade_Auditoria_Cientifica.md`.

Reúna em `docs/apresentacoes/`: `APRESENTACAO_SAREL.md`, `Roteiro_Video_7min_Simposio_SAREL.md`, os `.pptx` de apresentação.

Reúna em `docs/manuais/`: os três `Manual_*.pdf` que o pesquisador declarar vigentes (§5 Q2).

### 4.8 Criar a pasta de prompts

`docs/planejamento/prompts/` já recebeu os dois prompts desta rodada. Mantenha a convenção `PROMPT_EXECUTOR_<ASSUNTO>_<AAAA-MM-DD>.md`.

---

## 5. Decisões que são do pesquisador — PERGUNTE, não escolha

Execute tudo da §4 que não dependa destas. Para estas, pare e pergunte; cada uma traz a recomendação com a evidência que a sustenta.

**Q1 — Qual `Metodologia_Integrada_Dissertacao_SAREL` é a canônica?**
Há três PDFs com conteúdos diferentes em `docs/BASES PARA A DISSERTAÇÃO/`. *Recomendação:* `_Revisado` — é o único com glossário normativo e seção de referências (12 páginas). As outras duas → `legado/versoes_anteriores/2026-10-22_metodologia/`. Renomeie a canônica sem o sufixo `_Revisado`, que deixa de fazer sentido quando é a única.

**Q2 — Quais manuais estão vigentes?**
`Manual_Procedimentos_SAREL_2026-10-06.pdf` (09/10), `Manual_Instalacao_e_Operacao_SAREL.pdf` (24/09, **defasado do gerador** — ver §2.6), `Manual_Metodologico_e_Calculos_SAREL.pdf` (22/09). *Recomendação:* vigentes → `docs/manuais/`; superados → `legado/manuais_superados/`; o defasado deve ser **regenerado** antes de ser classificado.

**Q3 — Qual apresentação é a vigente de cada finalidade?**
Candidatas: `Apresentacao_Pesquisa_SAREL_2026-10-06.pptx` (09/10), `Mudanca_Radical_Metodologia_SAREL_v2.pptx` (02/10), `Apresentacao_Simposio_7min_SAREL.pptx` (raiz, 01/10, 26,5 MB), `Apresentacao_SAREL_PPGTCA_2026.pptx` (24/09), `docs/Apresentacao_Simposio_7min_SAREL.pptx` (25/09, 0,1 MB). *Recomendação:* a da raiz é a real do simpósio (mais nova e com a mídia embutida); a de `docs/` com 0,1 MB vai para `legado/apresentacoes_superadas/`. As demais, o pesquisador classifica.

**Q4 — `Instalador_SAREL.exe` continua versionado?**
2,1 MB de binário compilado em git, com fonte em `scripts/installer/InstaladorSAREL.cs`. *Recomendação:* tirar do versionamento (`.gitignore`) e publicar como release, mantendo a fonte e o `config_instalador.json`. Binário compilado no repositório não é auditável, que é justamente o que a banca vai cobrar.

**Q5 — O que fazer com o zip de 36,9 MB da ScienceDirect?**
É 19% do repositório e nunca foi descompactado. *Recomendação:* descompactar, inventariar as obras com autor/ano/título/DOI (é exatamente o que a Parte C **C8** pede) e então decidir se os PDFs ficam versionados ou se apenas o inventário fica, como já acontece com o resto do acervo.

---

## 6. Reapontar as referências — a parte que não pode ser esquecida

Mover arquivo sem corrigir quem o cita transforma organização em quebra. Depois de cada bloco de movimentos:

```bash
# para cada caminho antigo, procure citações em todo o repositório
grep -rn "Selecao Bibliografica\|BASES PARA A DISSERTA\|Seminario prov\|Plano de voo exemplo\|Audotoria Externa A\|docs/legado\|docs/images\|docs/figuras_formulas\|docs/figuras_manual\|docs/pluviometria" \
  --include="*.md" --include="*.py" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.mts" --include="*.bat" .
```

Pontos de atenção conhecidos:

1. **`scripts/gerar_pdf_metodologia_integrada.py`** — a seção 6 do documento cita literalmente `docs/Selecao Bibliografica/Pesquisas Machine Learning/`, `docs/Selecao Bibliografica/Para Revisar/` e `docs/verificacoes/fontes/`. Atualize os textos **e regenere o PDF e o DOCX** no mesmo commit, senão o documento publicado passa a apontar para pastas inexistentes.
2. **`scripts/gerar_relatorio_mudancas_pdf.py`** — o `output_path` padrão escreve na **raiz**. Aponte para `docs/relatorios/`.
3. **`scripts/gerar_pdf_metodologia_integrada.py`** escreve em dois caminhos (`...SAREL.pdf` e `..._Revisado.pdf`); depois de Q1, deve escrever em **um**.
4. **`CLAUDE.md` e `README.md`** — mapeiam a árvore para toda sessão de assistente; se ficarem desatualizados, o erro se propaga.
5. **`.gitignore`** — ajuste os padrões que citam caminhos movidos e acrescente o do Q4, se aceito.
6. **`docs/NORMA_LASTRO_CIENTIFICO.md`** e as auditorias citam `docs/verificacoes/fontes/<pasta>/`; confira que os caminhos citados continuam válidos.
7. **`scripts/pluviometria/`** e `src/` — procure construção de caminho por nome de município antes de renomear as 16 pastas.

---

## 7. Documentação a produzir — é o que seus pares e o orientador vão ler

### 7.1 `docs/README.md` (novo)
Mapa da documentação: uma linha por diretório dizendo **o que vive ali e o que não vive**. Inclua a regra dos `.bat` na raiz (§4.1) e o apontamento para `legado/`. É a porta de entrada; escreva para quem abre o repositório pela primeira vez.

### 7.2 `legado/README.md` (novo)
Índice do arquivado: para cada subpasta, **o que é, de quando é, por que saiu de circulação e o que a substituiu**. Sem isso, `legado/` vira depósito e a reorganização perde o sentido.

### 7.3 `docs/planejamento/REORGANIZACAO_ARVORE_2026-10-30.md` (novo)
O registro verificável da mudança. Deve conter:

- **Tabela completa origem → destino**, uma linha por arquivo movido, com o motivo em uma frase;
- **Lista das remoções**, cada uma com o hash do blob e o caminho da cópia que permanece — a prova de que nada se perdeu;
- **As respostas do pesquisador** a Q1–Q5, com data;
- **Antes e depois em números**: arquivos na raiz, diretórios com espaço/acento, duplicatas, tamanho do repositório;
- **O que NÃO foi movido e por quê** (os `.bat`, os anexos congelados do D25, eventuais ícones duplicados por necessidade de build);
- **Comando de verificação** que qualquer revisor pode rodar para conferir que nenhum conteúdo sumiu (§8).

### 7.4 Commits
Separe por natureza, nesta ordem, para que a revisão seja legível:

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

## 8. Verificação antes de empurrar

```bash
# 1. nenhum conteúdo perdido: o conjunto de blobs só pode encolher pelas remoções declaradas
git ls-tree -r --name-only HEAD | wc -l
git ls-tree -r -l HEAD | awk '{s+=$4} END {printf "%.1f MB\n", s/1048576}'

# 2. nenhum diretório com espaço ou acento
git ls-tree -r --name-only HEAD | sed 's#/[^/]*$##' | sort -u | grep -nE ' |\\3' && echo "AINDA HA" || echo "OK"

# 3. nenhuma duplicata exata remanescente não declarada
git ls-tree -r -l HEAD | awk '{print $3}' | sort | uniq -d

# 4. raiz limpa de documento de pesquisa
git ls-tree --name-only HEAD | grep -iE '\.(pdf|pptx|docx|exe|lnk)$' && echo "AINDA HA" || echo "OK"

# 5. nada quebrou
npx vitest run && npm run typecheck && npm run lint

# 6. os geradores ainda produzem nos caminhos certos
python scripts/gerar_relatorio_mudancas_pdf.py && python scripts/gerar_pdf_metodologia_integrada.py
git status --short
```

O item 5 é obrigatório: há teste que varre diretórios por caminho (`padroesProibidos.test.ts` tem piso mínimo de arquivos em `src/components`, e `lastroCientifico.test.ts` lê o registro de decisões). Renomeação de pasta pode derrubá-los.

Empurre com `git push -u origin sarel/organizacao-arvore`. Em falha de rede, repita até 4 vezes com espera de 2s, 4s, 8s, 16s. **Não abra pull request sem pedido explícito.**

---

## 9. Relato final esperado

- A tabela origem → destino completa (pode remeter ao arquivo da §7.3).
- As remoções, com blob e cópia remanescente.
- As respostas de Q1–Q5 e o que foi feito com cada uma.
- Antes e depois em números.
- Saída real dos seis comandos da §8, colada, não parafraseada.
- O que ficou pendente, e por quê.
- O registro de que `docs/auditorias/externa_a/` contém material bibliográfico relevante à Parte C (§2.8).
