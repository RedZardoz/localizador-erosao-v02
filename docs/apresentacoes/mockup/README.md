# [MOCKUP DEMONSTRATIVO] SAREL v2.0 — Demonstração Estática Offline

**Data do estado retratado:** 11/11/2026  
**Branch de origem:** Pesquisa de Mestrado PPGTCA 2026 — Erosão Laminar (BP3 / Paraná)  
**Tamanho aproximado do pacote:** 3.47 MB (28 arquivos)

## O que é este pacote

Este diretório contém uma **exportação estática e autossuficiente** (`output: "export"`) da interface web do **SAREL v2.0** em modo de demonstração para navegador, destinada a orientadores, avaliadores e financiadores conhecerem toda a arquitetura metodológica do projeto **sem necessidade de backend, servidor de banco ou credenciais**.

## Como abrir

Porque o Next.js App Router referencia ativos sob `/_next/static/`, a abertura direta via `file://` pode falhar ao resolver caminhos absolutos no sistema de arquivos. Sirva a pasta em um servidor HTTP estático local (sem acesso externo):

```bash
# Opção 1 (Node.js / npx):
npx serve docs/apresentacoes/mockup -l 4173

# Opção 2 (Python 3):
python -m http.server -d docs/apresentacoes/mockup 4173
```

Depois acesse no navegador: `http://127.0.0.1:4173/`

## O que mostra

- **Todas as 8 etapas da casca operacional** (`BarraFluxoOperacional`) e todos os modais do fluxo científico (Região, Candidatos, Medição Biofísica, Sorteio Estratificado D16, Calculadora Desenho Amostral, Campanha VANT & Coletor, Matriz de Treino D16/D26, Decisões D01–D26, Dossiê de Auditoria, Diagnóstico e Configurações).
- **Tour Metodológico completo (17 etapas)** com holofote (`ApresentacaoSpotlight`) guiando cada decisão do pipeline.
- **Mapa em grade local offline** com **12 pontos declaradamente sintéticos** (`SINTETICO_NAO_VOAR_01` a `SINTETICO_NAO_VOAR_12`, marcados com `__SAREL_AVISO__: "SINTETICO_NAO_VOAR"`), deslocados dentro da Bacia do Paraná 3 sem coincidir com os 677 imóveis reais.
- **Selo Público D16 redigido** (`selo_publico_d16`) mantendo apenas agregados por estrato e o hash criptográfico de integridade.

## O que NÃO faz (por construção e marcação de interface)

- **Zero rotas de API no pacote:** as 13 rotas `/api/*` de servidor foram omitidas na exportação estática; não há comunicação com Google Earth Engine, Embrapa, Mapbox remoto, Jev AI ou SQLite local.
- **Zero dados reais restritos ou segredos:** não contém coordenadas dos 677 candidatos reais, não contém códigos CAR, não contém nomes de proprietários e não embute chaves privadas ou tokens de acesso.
- **Botões operacionais preservados porém desabilitados:** todas as ações de gravação de rótulo, disparo de sorteio, medição no GEE, upload de planilhas, alteração de credenciais e exportação CSV/XLSX/KML/GPX permanecem visíveis para fins expositivos, desabilitadas com aviso explícito de que pertencem apenas ao ambiente operacional autenticado.
