# Acervo Bibliográfico e Arquitetura Documental — Projeto SAREL v2.0

**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA / UTFPR - 2026)**  
**Dissertação de Mestrado:** Validação e Predição de Erosão Laminar usando Sensoriamento Remoto e Algoritmos de Gradiente Impulsionado (XGBoost)  
**Mestrando:** Luis Alfredo  
**Data de Consolidação:** Novembro de 2026  
**Documento Formal da Pesquisa:** [`Estrutura_Referencial_Teorico_SAREL.docx`](Estrutura_Referencial_Teorico_SAREL.docx)  
**Diretriz Normativa:** [Norma de Lastro Científico (`NORMA_LASTRO_CIENTIFICO.md`)](../metodologia/NORMA_LASTRO_CIENTIFICO.md) (Regras R-L1 a R-L5)

---

## 1. Organização do Acervo Conforme o Referencial Teórico Formal

O diretório `docs/bibliografia/` reflete com 100% de correspondência a classificação formal estabelecida no documento `Estrutura_Referencial_Teorico_Dissertacao_SAREL.docx` (Seção 2.3, Capítulo 3 e Tabela 2), totalizando **115 trabalhos externos catalogados** (109 canônicos auditados + 6 adições de sensoriamento espectral, solo nu e resíduos de cultura) e preservando sem descarte todas as fontes complementares:

| Subdiretório | Categoria / Escopo | Total de Obras | Descrição / Eixo Metodológico |
|:---|:---:|:---:|---|
| [`01_pesquisas_diretamente_relacionadas/`](01_pesquisas_diretamente_relacionadas/) | **Direta** | 41 | Machine Learning (XGBoost, Ensembles), sensoriamento orbital, GEOS3, guarda temporal e Spatial Block CV (Itens 001 a 041). |
| [`02_pesquisas_relacionadas/`](02_pesquisas_relacionadas/) | **Relacionada** | 53 | Modelagem física determinística (USLE/RUSLE), erodibilidade (Fator K), erosividade (Fator R) e Fator LS (Itens 036 a 088). |
| [`03_contexto_regional_e_triagem/`](03_contexto_regional_e_triagem/) | **Triagem** | 19 | Dissertações regionais do PPGTCA/UTFPR Medianeira, UNIOESTE (BP3), UNESP e estrutura fundiária no CAR (Itens 089 a 107). |
| [`04_obras_seminais_fundacionais/`](04_obras_seminais_fundacionais/) | **Seminal** | 2 | Hickey (2000) para Fator LS contínuo e Rufino, Biscaia & Merten (1993) para erosividade no Paraná (Itens 108 e 109). |
| [`05_fundamentacao_teorica_dos_eixos/`](05_fundamentacao_teorica_dos_eixos/) | **Fundamentação** | 7 | Obras seminais citadas nominalmente no texto dos Eixos I, II e III (Wischmeier & Smith 1978, Zhu 2013, Chen & Guestrin 2016, Altman & Royston 2006, Durigon 2014, Kirkby 2004, Nosek 2018). |
| [`06_pesquisas_machine_learning/`](06_pesquisas_machine_learning/) | **Exploratório** | 18 | Acervo complementar de 17 PDFs e 1 arquivo ZIP de proveniência (`ScienceDirect_articles_22Oct2026_13-13-36.639.zip`). |

---

## 2. Princípios de Governança e Rastreabilidade Criptográfica

- **Zero Descarte de Artigos:** 100% dos arquivos previamente presentes em disco foram preservados e reclassificados em pastas canônicas padronizadas sem espaços ou acentos;
- **Ausência de Arquivos Soltos na Raiz:** A raiz de `docs/bibliografia/` contém exclusivamente os artefatos de inventário e metadados, eliminando a poluição de PDFs avulsos;
- **Rastreabilidade SHA-256:** Cada obra canônica está indexada por seu hash criptográfico único em [`data/acervo_sanitizado_109.json`](../../data/acervo_sanitizado_109.json);
- **Lastro Externo (Regra R-L1):** Todas as 109 obras canônicas constituem literatura científica externa de autoridade reconhecida, isentas de autorreferência a relatórios internos do projeto.