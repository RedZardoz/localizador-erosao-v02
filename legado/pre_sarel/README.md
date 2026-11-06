# Artefatos Pré-SAREL (Histórico e Preservação)

Este diretório armazena artefatos, scripts e planilhas de rascunho utilizados durante as etapas exploratórias e protótipos anteriores à reconstrução metodológica do **SAREL v2.0**.

Eles foram mantidos exclusivamente para preservação histórica da pesquisa e integridade do repositório, não integrando a matriz de dados oficial da dissertação de mestrado.

---

## Conteúdo Versionado

1. **`Apresentacao_Localizador_Erosao_PPGTCA.pptx`:**
   - Apresentação inicial de slides do protótipo Localizador de Erosão.

2. **`generate_pdf.py` & `generate_pptx.py`:**
   - Scripts geradores de relatórios e apresentações do sistema preliminar.

3. **`generate_plano_hibrido_pdf.py` & `generate_plano_hibrido_pptx.py`:**
   - Scripts preliminares de plano de amostragem híbrido.

4. **`generate_presentation.py`:**
   - Script antecessor que gerava a apresentação com retórica não auditada. Substituído por `scripts/gerar_apresentacao_pdf.py` e `scripts/gerar_apresentacao_pptx.py`.

5. **`create_shortcut.ps1`:**
   - Script PowerShell legado de criação de atalho na Área de Trabalho com o nome do protótipo anterior ("Localizador de Erosao"). Substituído por `scripts/install_shortcut.ps1`.

---

## Artefatos Locais Não Versionados

- **`Tabela_Consolidada_Parana_Todo_o_Estado_150focos_2026-09-04.xlsx`:**
  - Planilha de teste de engenharia com 150 coordenadas do CAR do Paraná.
  - Os atributos biofísicos (`Declividade_Pct = 16%`, `BSI = 0.45`, `NDVI = 0.32`) continham valores estáticos preenchidos por importador legado.
  - Não integra o repositório Git (ignorada no `.gitignore` pela regra `Tabela_Consolidada_*`), existindo apenas localmente quando gerada/copiada para testes de mock de infraestrutura.
