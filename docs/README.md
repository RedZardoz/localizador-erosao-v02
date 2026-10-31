# Mapa da Documentação do SAREL

Este diretório centraliza toda a documentação científica, técnica, operacional e probatória do arcabouço **SAREL** (Sistema de Amostragem e Rastreabilidade da Erosão Laminar).

> [!NOTE]
> **Regra da Raiz:** A raiz do repositório contém estritamente manifestos de build, pacotes, documentação de topo (`README.md`, `CLAUDE.md`) e os scripts de inicialização do Windows (`.bat`). Todos os documentos acadêmicos, laudos, relatórios e apresentações residem obrigatoriamente sob `docs/` ou, quando fora de circulação, arquivados sob `legado/`.

---

## 1. Mapa de Diretórios

| Diretório | O que vive aqui | O que NÃO vive aqui |
| :--- | :--- | :--- |
| [`apresentacoes/`](apresentacoes/) | Apresentações oficiais em `.pptx` e `.pdf`, roteiros de vídeo e apresentações para bancas/simpósios. | Rascunhos informais ou apresentações superadas (vivem em `legado/apresentacoes_superadas/`). |
| [`auditorias/`](auditorias/) | Relatórios de auditoria metodológica pericial (`AUDITORIA_*.md`), pacotes fracionados de auditoria e auditorias externas. | Código-fonte ou logs efêmeros de depuração. |
| [`auditorias/externa_a/`](auditorias/externa_a/) | Laudos e estudos da Auditoria Externa A (incluindo estudo crítico e conciliação bibliográfica). | Cópias duplicadas de pacotes fracionados. |
| [`auditorias/pacotes_fracionados/`](auditorias/pacotes_fracionados/) | Lotes de código e documentação organizados para auditoria pericial offline independente. | Binários ou arquivos executáveis. |
| [`bibliografia/`](bibliografia/) | Inventário bibliográfico oficial ([`INVENTARIO_SELECAO_BIBLIOGRAFICA.md`](bibliografia/INVENTARIO_SELECAO_BIBLIOGRAFICA.md)), manifesto de seleção e subpastas temáticas. | Arquivos primários conferidos com anotação pericial (vivem em `verificacoes/fontes/`). |
| [`dados/planos_de_voo/`](dados/planos_de_voo/) | Missões reais e referências fotogramétricas de planos de voo QGroundControl (`.plan`) para validação. | Planos sintéticos de teste/demonstração com selo `NAO_VOAR` (vivem em `verificacoes/voo_ncontrol/`). |
| [`dados/pluviometria/`](dados/pluviometria/) | Dados oficiais históricos de pluviometria do IAT (ÁguasParaná) organizados por município sem acento. | Tabelas derivadas ou agregadas (vivem em `verificacoes/`). |
| [`dissertacao/`](dissertacao/) | Documentos formais constitutivos da dissertação de mestrado (Metodologia Integrada, Especificação do Projeto, Defesa Metodológica, Especificação do Field Collector). | Artigos de terceiros ou manuais de uso rápido. |
| [`figuras/formulas/`](figuras/formulas/) | Renders vetoriais e raster em alta resolução (300 DPI) das 12 formulações matemáticas canônicas. | Capturas de tela da interface ou fotos de campo. |
| [`figuras/interface/`](figuras/interface/) | Capturas de tela oficiais e atualizadas da interface do sistema SAREL v2. | Desenhos esquemáticos fictícios sem comprovação de código. |
| [`figuras/manual/`](figuras/manual/) | Diagramas esquemáticos e fluxogramas utilizados nos manuais de usuário. | Formulações matemáticas isoladas. |
| [`manuais/`](manuais/) | Manuais de instalação, operação, procedimentos e manuais metodológicos vigentes. | Manuais defasados ou históricos (vivem em `legado/manuais_superados/`). |
| [`metodologia/`](metodologia/) | Notas técnicas, fichas metodológicas, especificações de design, normas de lastro e declaração de proveniência de IA. | Apresentações em slides ou arquivos binários de modelo. |
| [`modelos/`](modelos/) | Arquiteturas, definições e hiperparâmetros canônicos de modelos estatísticos e aprendizado de máquina. | Pesos treinados pesados ou artefatos transitórios. |
| [`planejamento/`](planejamento/) | Histórico de planejamento, governança, decisões, emendas e prompts canônicos de auditoria/execução. | Prompts duplicados fora de `prompts/`. |
| [`planejamento/prompts/`](planejamento/prompts/) | Diretório canônico exclusivo de todos os prompts de planejamento e execução pericial. | Notas avulsas ou anexos de código. |
| [`relatorios/`](relatorios/) | Relatórios técnicos consolidados de mudanças metodológicas e conciliações científicas. | Apresentações em slides ou planos de voo. |
| [`submissoes/sbproppg_2026/`](submissoes/sbproppg_2026/) | Artigos, resumos expandidos e modelos para submissão no Seminário de Pesquisa e Pós-Graduação (SBPROPPG). | Material não relacionado a eventos científicos externos. |
| [`verificacoes/`](verificacoes/) | Evidências físicas, relatórios de verificação e saídas brutas exigidas pela Regra 8 da Lei Fundamental. | Dados primários brutos de terceiros (vivem em `verificacoes/fontes/`). |
| [`verificacoes/fontes/`](verificacoes/fontes/) | Acervo de obras primárias conferidas integralmente e arquivadas por pasta `<autor><ano>/`. | Artigos não auditados ou sem script de extração associado. |

---

## 2. Ponto de Entrada para Usuários no Windows

Os arquivos em lote (`.bat`) na raiz do repositório constituem os pontos de entrada do pesquisador e de usuários finais no ambiente Windows:
- `Iniciar_Localizador_Erosao.bat` — Inicia os servidores locais do sistema.
- `Instalar_Atalho_Windows.bat` — Cria os atalhos de Área de Trabalho e Menu Iniciar apontando para `assets/icon.ico`.
- `Desinstalar_Atalho_Windows.bat` — Remove os atalhos criados.
- `Gerar_Pacote_Portatil.bat` — Empacota a aplicação portátil para distribuição.
- `Gerar_Zip_Banco_GoogleDrive.bat` — Gera arquivo compactado das bases pesadas.

---

## 3. Material Fora de Uso

Qualquer artefato metodológico superado, documentação de versões pré-v2 ou códigos de protótipos anteriores reside exclusivamente em [`legado/`](../legado/), com catalogação explicativa de data e motivo em [`legado/README.md`](../legado/README.md).
