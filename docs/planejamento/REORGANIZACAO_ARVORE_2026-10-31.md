# Registro Formal da Reorganização da Árvore do Repositório SAREL

**Data de Execução:** 31 de outubro de 2026  
**Ramo de Trabalho:** `sarel/executor-2026-10-09`  
**Hash de Partida (Verificado):** `efbd5b7` (sobre `e018748`, com 92 arquivos de teste e 725 testes verdes)  
**Objetivo:** Estabelecer uma estrutura canônica, reprodutível e navegável por pares e pela banca de mestrado (PPGTCA/UTFPR), eliminando duplicações, esvaziando a raiz, unificando o arquivo morto em `legado/` e padronizando nomes de diretórios sem espaços e sem caracteres acentuados.

---

## 1. Antes e Depois em Números

| Métrica | Antes (`efbd5b7`) | Depois | Variação / Observação |
| :--- | :---: | :---: | :--- |
| **Total de arquivos versionados** | 784 | 750 | −34 arquivos (remoção de cópias redundantes e atalhos) |
| **Tamanho total do repositório** | 174,9 MB (183.392.675 bytes) | 172,1 MB (180.435.064 bytes) | −2,96 MB de bytes redundantes expurgados |
| **Documentos de pesquisa na raiz** | 5 | 0 | 100% transferidos para `docs/metodologia/` e `docs/dissertacao/` |
| **Atalhos `.lnk` no repositório** | 2 | 0 | 100% expurgados (inúteis fora da máquina de origem) |
| **Diretórios com espaço ou acento** | 19 | 0 | 100% convertidos para minúsculas sem acento e com `_` |
| **Cópias idênticas não declaradas** | 38 | 0 | Eliminadas (apenas duplicatas técnicas intencionais mantidas) |
| **Diretórios de legado concorrentes** | 2 (`legado/` e `docs/legado/`) | 1 (`legado/`) | Unificado em `legado/documentacao_pre_v2/` |

---

## 2. Lista de Remoções e Prova de Não-Perda de Conteúdo

Todas as 34 remoções efetuadas correspondem estritamente a duplicatas byte-idênticas comprovadas por hash de blob Git ou a atalhos descartáveis de sistema operacional:

| Caminho Removido | Hash do Blob (Git SHA-1) | Cópia Canônica Remanescente | Motivo da Remoção |
| :--- | :---: | :--- | :--- |
| `Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf` (raiz) | `1d2fa9a1eea713868ad3cfb1e13de591603d9fc2` | `docs/relatorios/Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf` | Duplicata exata do relatório canônico |
| `Apresentacao_Simposio_7min_SAREL.pptx` (raiz) | `5def41ea94564a605e0994a7e474c64ddee4d2b6` | `docs/apresentacoes/Apresentacao_Simposio_7min_SAREL.pptx` | Duplicata exata da apresentação canônica |
| `docs/verificacoes/fontes/agisprocedureforautomaticallycalculatingtheUSLELSfactorontopographicallycompleslandscapsJSWC1996.pdf` | `7bcb624b549444dcb3d807ec0e2e225aac8ac1fb` | `docs/verificacoes/fontes/desmet1996/desmet_govers_1996_jswc.pdf` | Duplicata exata do artigo de Desmet & Govers (1996) |
| `docs/planejamento/PROMPT_EXECUTOR_CORRECOES_METODOLOGICAS_2026-10-30.md` | `e1ce294671d1004b3c014c255ea7cd5893493af4` | `docs/planejamento/prompts/PROMPT_EXECUTOR_CORRECOES_METODOLOGICAS_2026-10-30.md` | Cópia redundante fora da pasta canônica de prompts |
| `docs/planejamento/PROMPT_EXECUTOR_SAREL_correcoes.md` | `e1ce294671d1004b3c014c255ea7cd5893493af4` | `docs/planejamento/prompts/PROMPT_EXECUTOR_CORRECOES_METODOLOGICAS_2026-10-30.md` | Cópia redundante fora da pasta canônica de prompts |
| `docs/planejamento/PROMPT_EXECUTOR_MANIFESTO_E_DEFLACAO_2026-10-31.md` | `e3f6db522e5582303e03f089fb1335ba71dabe91` | `docs/planejamento/prompts/PROMPT_EXECUTOR_MANIFESTO_E_DEFLACAO_2026-10-31.md` | Cópia redundante fora da pasta canônica de prompts |
| `Selecao Bibliografica.lnk` (raiz) | `0507d359bfe00c8b671a53b5fa7c8aa917966eb1` | *(nenhuma)* | Atalho do Windows, inútil fora da máquina do autor |
| `docs/Selecao Bibliografica/geolocalizacao-erosao-propriedade.lnk` | `f3126ec177a4128f73e7d581ff2ef25bfbc94e2d` | *(nenhuma)* | Atalho do Windows, inútil fora da máquina do autor |
| `docs/auditorias/Audotoria Externa A/Auditoria_Pacotes_Fracionados/*` (26 arquivos de lotes de código e documentação) | *(26 blobs coincidentes)* | `docs/auditorias/pacotes_fracionados/*` | Subárvore integralmente duplicada (todos os 26 arquivos byte-idênticos à pasta canônica) |

---

## 3. Tabela Completa de Movimentações (Origem → Destino)

| Origem | Destino | Motivo da Movimentação |
| :--- | :--- | :--- |
| `Justificativa_Recorte_Espacial_Parana3_SAREL.pdf` | `docs/metodologia/Justificativa_Recorte_Espacial_Parana3_SAREL.pdf` | Limpeza da raiz; documento de sustenta do recorte territorial D07 |
| `Justificativa_Uso_e_Alternativa_Jev_SAREL.pdf` | `docs/metodologia/Justificativa_Uso_e_Alternativa_Jev_SAREL.pdf` | Limpeza da raiz; nota técnica de justificativa do modelo biofísico |
| `SAREL_Field_Collector_Especificacao_Tecnica.pdf` | `docs/dissertacao/SAREL_Field_Collector_Especificacao_Tecnica.pdf` | Limpeza da raiz; especificação de engenharia do instrumento de campo |
| `docs/legado/*` (6 arquivos) | `legado/documentacao_pre_v2/*` | Eliminação do diretório legado concorrente; consolidação em `legado/` |
| `docs/auditorias/Audotoria Externa A/*` (6 arquivos únicos) | `docs/auditorias/externa_a/*` | Correção ortográfica de diretório e minúsculas sem espaço |
| `docs/auditorias/Auditoria_Pacotes_Fracionados/*` | `docs/auditorias/pacotes_fracionados/*` | Padronização sem maiúsculas em diretório |
| `docs/verificacoes/fontes/2010_04_20_waltrick.pdf` | `docs/verificacoes/fontes/waltrick2010/waltrick_2010.pdf` | Enquadramento na convenção canônica `<autor><ano>/` |
| `docs/verificacoes/fontes/79071_en.pdf` | `docs/verificacoes/fontes/tondati2026/tondati_2026.pdf` | Identificação pericial (Tondati & Morais, 2026; DOI 10.14393/SN-v38-2026-79071x) |
| `docs/verificacoes/fontes/zhu2013/extrair_zhu_2014.py` | `docs/verificacoes/fontes/zhu2013/extrair_zhu_2013.py` | Conclusão da disciplina R-L2 de citação honesta da tese de 2013 |
| `docs/verificacoes/fontes/zhu2013/saida_extracao_zhu_2014.txt` | `docs/verificacoes/fontes/zhu2013/saida_extracao_zhu_2013.txt` | Conclusão da disciplina R-L2 de citação honesta da tese de 2013 |
| `docs/BASES PARA A DISSERTAÇÃO/` | `docs/dissertacao/` | Eliminação de espaços e acentos; nome canônico conciso |
| `docs/dissertacao/Metodologia_Integrada_..._Revisado.*` | `docs/dissertacao/Metodologia_Integrada_Dissertacao_SAREL.*` | Supressão de sufixo `_Revisado` redundante |
| `docs/Selecao Bibliografica/` | `docs/bibliografia/` | Eliminação de espaços e acentos no acervo bibliográfico |
| `docs/bibliografia/Para Revisar/` | `docs/bibliografia/para_revisar/` | Minúsculas sem espaços em subpasta |
| `docs/bibliografia/Pesquisas Machine Learning/` | `docs/bibliografia/pesquisas_machine_learning/` | Minúsculas sem espaços em subpasta |
| `docs/Seminario prov/` | `docs/submissoes/sbproppg_2026/` | Eliminação de diretório provisório; categorização por evento |
| `docs/Plano de voo exemplo/` | `docs/dados/planos_de_voo/` | Categorização como dado de missão fotogramétrica sem espaços |
| `docs/pluviometria/` | `docs/dados/pluviometria/` | Categorização sob a pasta unificada de dados |
| `docs/dados/pluviometria/<16 subpastas>` | `docs/dados/pluviometria/<municipio_sem_acento>/` | Padronização de todas as 16 pastas em minúsculas sem acento |
| `docs/figuras_formulas/` | `docs/figuras/formulas/` | Agrupamento modular de figuras sob pasta mãe `docs/figuras/` |
| `docs/figuras_manual/` | `docs/figuras/manual/` | Agrupamento modular de figuras sob pasta mãe `docs/figuras/` |
| `docs/images/` | `docs/figuras/interface/` | Agrupamento de capturas de tela da UI e tradução do nome em inglês |
| `docs/metodologia/Mudanca_Radical_...pdf` | `docs/apresentacoes/Mudanca_Radical_...pdf` | Reunião dos formatos `.pptx` e `.pdf` da mesma apresentação |
| `docs/Apresentacao_Simposio_7min_SAREL.pptx` | `docs/apresentacoes/Apresentacao_Simposio_7min_SAREL.pptx` | Consolidação na pasta canônica de apresentações |
| `docs/APRESENTACAO_SAREL.md` | `docs/apresentacoes/APRESENTACAO_SAREL.md` | Consolidação na pasta canônica de apresentações |
| `docs/Roteiro_Video_7min_Simposio_SAREL.md` | `docs/apresentacoes/Roteiro_Video_7min_Simposio_SAREL.md` | Consolidação na pasta canônica de apresentações |
| `docs/design.md` | `docs/metodologia/design.md` | Consolidação de nota de arquitetura em metodologia |
| `docs/FICHA_TECNICA_SAREL.md` | `docs/metodologia/FICHA_TECNICA_SAREL.md` | Consolidação de ficha técnica em metodologia |
| `docs/NORMA_LASTRO_CIENTIFICO.md` / `.pdf` | `docs/metodologia/NORMA_LASTRO_CIENTIFICO.md` / `.pdf` | Consolidação de norma em metodologia |
| `docs/PROVENIENCIA_ASSISTENCIA_IA.md` | `docs/metodologia/PROVENIENCIA_ASSISTENCIA_IA.md` | Consolidação de proveniência em metodologia |
| `docs/Delimitacao_Territorial_...md` | `docs/metodologia/Delimitacao_Territorial_...md` | Consolidação de nota de amostragem em metodologia |
| `docs/Demonstracao_Transparencia_...md` | `docs/metodologia/Demonstracao_Transparencia_...md` | Consolidação de nota de explicabilidade em metodologia |
| `docs/Ingestao_Processamento_...md` | `docs/metodologia/Ingestao_Processamento_...md` | Consolidação de nota técnica VANT em metodologia |
| `docs/Pacote_Reprodutibilidade_...md` | `docs/metodologia/Pacote_Reprodutibilidade_...md` | Consolidação de pacote de auditoria em metodologia |

---

## 4. O que NÃO Foi Movido e Justificativa

1. **Scripts `.bat` da Raiz (`Iniciar_Localizador_Erosao.bat`, `Instalar_Atalho_Windows.bat`, etc.):**
   - *Motivo:* São pontos de entrada executáveis do usuário final em ambiente Microsoft Windows. A sua permanência na raiz é uma convenção ergonômica indispensável e declarada formalmente no `docs/README.md`.
2. **Arquivos Canônicos de Governança em `data/` (`MANIFESTO_FUNDIARIO.json` e `PARAMETROS_DEFLACAO.json`):**
   - *Motivo:* Consumidos por caminhos fixos e imutáveis em testes de integridade (`deflacao.test.ts`, `verificadorManifesto.ts`) e geradores oficiais. Permanecem estritamente em `data/`.
3. **Anexos Congelados da Proposta em `docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/`:**
   - *Motivo:* São cópias congeladas e comitadas no marco temporal de 06/10/2026 da proposta de emenda de D25. Devem permanecer preservados intactos para fins de auditoria forense do histórico da proposta.
4. **Duplicação Intencional de Ícones (`assets/icon.*` e `public/*`):**
   - *Motivo:* `public/favicon.ico` e `public/icon.png` são exigidos e servidos nativamente pelo servidor Next.js para o navegador web, enquanto `assets/icon.ico` é consumido pelo script de atalhos do Windows Explorer (`Instalar_Atalho_Windows.bat`). Ambos são mantidos deliberadamente.
5. **Artefatos e Binários Submetidos à Deliberação Formal (Q1–Q4):**
   - *Motivo:* Conforme a Seção 5 das instruções, o executor tem proibição estrita de tomar decisões unilaterais sobre classificação de vigência de manuais, apresentações concorrentes, binário do instalador e o arquivo zip volumoso da ScienceDirect.

---

## 5. Deliberações do Pesquisador (Seção 5: Q1–Q4)

Em cumprimento estrito ao princípio de que **decisões substantivas pertencem ao pesquisador**, as questões foram formuladas com suas respectivas recomendações técnicas e submetidas para chancela:

### Q1 — Vigência dos Manuais de Usuário
- **Situação Atual:** Existem três manuais: `Manual_Procedimentos_SAREL_2026-10-06.pdf` (09/10), `Manual_Instalacao_e_Operacao_SAREL.pdf` (24/09; defasado em relação a `scripts/gerar_manual_pdf.py` modificado em 18/10), e `Manual_Metodologico_e_Calculos_SAREL.pdf` (22/09).
- **Recomendação:** Regenerar o manual de instalação e operação defasado para harmonização de código; classificar os vigentes para `docs/manuais/` e arquivar versões superadas em `legado/manuais_superados/`.
- **Status:** *Aguardando deliberação formal do pesquisador.*

### Q2 — Vigência das Apresentações por Finalidade
- **Situação Atual:** Quatro arquivos de apresentação coexistem: `Apresentacao_Pesquisa_SAREL_2026-10-06.pptx` (09/10), `Mudanca_Radical_Metodologia_SAREL_v2.pptx` (02/10), `Apresentacao_Simposio_7min_SAREL.pptx` (25/09; consolidada em `docs/apresentacoes/`), e `Apresentacao_SAREL_PPGTCA_2026.pptx` (24/09).
- **Recomendação:** Categorizar formalmente por finalidade (ex.: banca de qualificação, defesa preliminar, simpósio) e arquivar as versões intermediárias superadas em `legado/apresentacoes_superadas/`.
- **Status:** *Aguardando deliberação formal do pesquisador.*

### Q3 — Versionamento do Binário Compilado `Instalador_SAREL.exe`
- **Situação Atual:** O arquivo executável compilado de 2,1 MB reside na raiz. O código-fonte em C# está totalmente preservado e auditável em `scripts/installer/InstaladorSAREL.cs` acompanhado de `scripts/installer/config_instalador.json`.
- **Recomendação:** Remover o executável compilado do controle de versão Git, adicioná-lo ao `.gitignore` e publicá-lo via GitHub Releases/Assets. Binários compilados no repositório não são passíveis de diff/auditoria por pares acadêmicos.
- **Status:** *Aguardando deliberação formal do pesquisador.*

### Q4 — Tratamento do Zip de 36,9 MB da ScienceDirect
- **Situação Atual:** O arquivo `ScienceDirect_files_26Aug2025_00-09-54.768.zip` (36,9 MB, correspondente a ~21% do peso do repositório) reside compactado e nunca aberto sob `docs/bibliografia/pesquisas_machine_learning/`.
- **Recomendação:** Descompactar os artigos, catalogá-los com autor, ano, título e DOI no inventário bibliográfico (fechando a pendência C8 da auditoria de lastro), e avaliar se os PDFs brutos devem residir fora do Git sob a regra do `.gitignore` já aplicada ao resto da bibliografia.
- **Status:** *Aguardando deliberação formal do pesquisador.*

---

## 6. Procedimento de Verificação Automatizada por Pares

Qualquer auditor ou membro da banca examinadora pode reproduzir e validar a integridade da árvore por meio dos comandos:

```bash
# 1. Contagem e volume total de arquivos
git ls-tree -r --name-only HEAD | wc -l
git ls-tree -r -l HEAD | awk '{s+=$4} END {printf "%.1f MB\n", s/1048576}'

# 2. Ausência total de diretórios com espaço ou caracteres acentuados
git -c core.quotepath=false ls-tree -r --name-only HEAD | sed 's#/[^/]*$##' | sort -u | grep -E ' |[^a-zA-Z0-9_/.-]' && echo "AINDA HA" || echo "OK"

# 3. Ausência de documentos de pesquisa soltos na raiz
git ls-tree --name-only HEAD | grep -iE '\.(pdf|pptx|docx|lnk)$' && echo "AINDA HA" || echo "OK"

# 4. Execução da suíte completa de testes e tipagem
npx vitest run && npm run typecheck && npm run lint

# 5. Validação de compilação dos geradores nos caminhos canônicos
python scripts/gerar_pdf_metodologia_integrada.py
python scripts/gerar_docx_metodologia_integrada.py
python scripts/gerar_relatorio_mudancas_pdf.py
```
