# Depósito de Material Fora de Uso (Legado)

Este diretório é o **único depósito oficial** de artefatos descontinuados, versões históricas superadas e documentações de protótipos anteriores do projeto SAREL.

Nenhum arquivo deste diretório integra o pipeline ativo de produção nem pode ser importado por código de produção em `src/` (conforme verificado e blindado por `src/lib/seguranca/importacoes.test.ts`).

---

## Índice do Acervo Arquivado

| Subdiretório | O que é | Data de Origem | Motivo do Arquivamento | O que o substituiu |
| :--- | :--- | :---: | :--- | :--- |
| [`documentacao_pre_v2/`](documentacao_pre_v2/) | Documentação técnica, manual de operação e design do protótipo "Localizador de Erosão v1" (antigo `docs/legado/`). | 2026-09-10 (e anteriores) | Descreve a interface e fluxos do software original; continha formulações descontinuadas (como Fator C invertido e métricas afirmativas sem padrão-ouro). | Documentação canônica em `docs/metodologia/` e `docs/manuais/`. |
| [`pre_sarel/`](pre_sarel/) | Scripts Python e apresentações do protótipo inicial de mestrado antes da Lei Fundamental. | 2026-08 a 2026-09-08 | Modelos conceituais embrionários substituídos pela reconstrução formal de zero-trust. | Código modular em `src/lib/` e scripts em `scripts/`. |
| [`versoes_anteriores/2026-09-17_pre_compensacoes/`](versoes_anteriores/2026-09-17_pre_compensacoes/) | Apresentação em PPTX/PDF e relatório de mudanças prévios à rodada pericial de compensações. | 2026-09-17 | Superado pela reformulação amostral e estatística do projeto. | `docs/apresentacoes/` e `docs/relatorios/`. |
| [`versoes_anteriores/2026-09-22_pre_multiespectral/`](versoes_anteriores/2026-09-22_pre_multiespectral/) | Apresentações e scripts geradores anteriores à integração do sensoriamento multiespectral VANT. | 2026-09-22 | Superado pela adoção do sensor multiespectral MicaSense Altum e desenho amostral D16. | Apresentações vigentes em `docs/apresentacoes/`. |
| *`manuais_superados/`* *(pendente)* | Manuais de instalação e operação defasados. | - | Reservado para arquivamento de manuais descontinuados após decisão formal do pesquisador (Q1). | Manuais vigentes em `docs/manuais/`. |
| *`apresentacoes_superadas/`* *(pendente)* | Apresentações com versões desatualizadas de dados. | - | Reservado para arquivamento de slides históricos após classificação por finalidade (Q2). | Apresentações vigentes em `docs/apresentacoes/`. |
