# Relatório Final — Prompt T: Mockup Distribuível para Navegador (SAREL v2.0)

**Data de conclusão:** 11/11/2026  
**Data do estado retratado no pacote:** 11/11/2026  
**Branch:** `correcoes/contencao-2026-11-02`  
**Logs brutos de execução:** `docs/verificacoes/execucao/2026-11-11t/`  
**Pacote estático publicado:** `docs/apresentacoes/mockup/`  

---

## Checklist Consolidado (Prompt T)

- [x] **Branch:** `correcoes/contencao-2026-11-02`
- [x] **T1 — build estático em config própria; produção não alterada; comando:** `npm run mockup:build` (`node scripts/build_mockup.mjs` usando `next.config.mockup.mjs`)
- [x] **T2 — conjunto sintético com marcação; coordenadas deslocadas; sem CAR, sem proprietário**
- [x] **T2 — nenhuma guarda antissintética desligada; caminho usado:** `carregarPontosDemonstracaoVitrine` (`src/store/useSarelStore.ts`) acionado por `VitrineDemonstracaoController` sobre `src/data/demonstracao_sintetica.json` (`PONTOS_DEMONSTRACAO_VITRINE`)
- [x] **T3 — faixa permanente, marca nos dados, título e tela inicial**
- [x] **T4 — tour completo com as 17 âncoras resolvendo; todas as telas abrem**
- [x] **T5 — ações operacionais desabilitadas e explicadas; botões não removidos**
- [x] **T6 — as seis verificações gravadas, em especial a de abrir sem rede**
- [x] **T7 — README dentro do pacote; forma de abrir e tamanho no relatório**
- [x] **`npm test` e `npx tsc --noEmit` (e `npm run lint`) gravados**
- [ ] **`git push` confirmado contra o remoto** *(executado ao término do commit final)*

---

## T1 — Exportação Estática em Configuração Própria e Proteção da Produção

1. **Configuração estática dedicada:** criada em `next.config.mockup.mjs` (`output: "export"`, `images: { unoptimized: true }`, `reactStrictMode: false`, `trailingSlash: true`).
2. **Script npm dedicado:** `"mockup:build": "node scripts/build_mockup.mjs"` adicionado em `package.json`.
3. **Isolamento garantido sem alterar produção:**
   - `scripts/build_mockup.mjs` move temporariamente `next.config.mjs` e `src/app/api/` para um diretório temporário fora da árvore durante a compilação, aplica `next.config.mockup.mjs` com `NEXT_PUBLIC_SAREL_MOCKUP="true"`, publica os artefatos de `out/` em `docs/apresentacoes/mockup/` sem `fs.cpSync` (usando `readdirSync`/`copyFileSync`), grava `docs/apresentacoes/mockup/README.md` com convergência exata de tamanho/contagem de arquivos, e restaura `next.config.mjs` e todas as 13 rotas de servidor em bloco `finally`.
   - Conferido após o build final: `git diff next.config.mjs` retornou vazio e todas as **13 rotas `src/app/api/**/route.ts`** permanecem intactas na árvore de trabalho (log `04_check_rotas_api.txt`).
   - Adicionalmente, `MapViewer.tsx` e `ApiTokensManager.tsx` verificam diretamente `process.env.NEXT_PUBLIC_SAREL_MOCKUP === "true"` nos pontos que montavam parâmetro de consulta remota, permitindo eliminação de código morto na compilação estática e garantindo resultado **`LIMPO`** na busca por strings de credencial no pacote final (`01_check_credenciais.txt`).

---

## T2 — Conjunto Sintético e Preservação Integral das Guardas

1. **Conjunto sintético (`src/data/demonstracao_sintetica.json` + `src/config/pontosDemonstracao.ts`):**
   - Cabeçalho declara `"ehPlanoSinteticoDemonstracao": true` e `"__SAREL_AVISO__": "SINTETICO_NAO_VOAR - DADOS EXCLUSIVOS PARA DEMONSTRACAO ESTATICA NA INTERFACE WEB"`.
   - Contém **12 registros** (`SINTETICO_NAO_VOAR_01` a `SINTETICO_NAO_VOAR_12`), todos com `origemSintetica: true`, `__SAREL_AVISO__: "SINTETICO_NAO_VOAR"`, `codigoCar: null`, `titularMascarado: "OMITIDO_MOCKUP_SINTETICO"` e sem vínculo a candidato real.
   - **Coordenadas deslocadas:** varredura geodésica em memória contra os 67 centroides reais sorteados em `docs/verificacoes/sorteio/sorteio_d16_2026-11-10.json` mediu distância mínima de **3.964,9 m (3,96 km)**, sem coincidência com nenhum ponto do universo (`02_check_coordenadas_677.txt`).
2. **Guardas antissintéticas intactas (e reforçadas):**
   - `assegurarApenasPontosReais` em `src/lib/seguranca/guardaSintetico.ts` **não foi desligada nem contornada**; ao contrário, passou a reconhecer explicitamente também o prefixo `SINTETICO_NAO_VOAR_` em `id` e `codigo` além de `origemSintetica === true`.
   - Todos os caminhos reais (`carregarPontosProvisorios`, exportações científicas e `montarMatrizTreino`) mantêm `assegurarApenasPontosReais` ativa — fato visível na própria vitrine ao abrir a **Etapa 7 (`PainelMatrizTreino`)**, que exibe *"Matriz de Treino Vazia"* e alerta que a guarda bloqueou os 12 pontos sintéticos.
   - **Caminho explícito usado pela vitrine:** ação `carregarPontosDemonstracaoVitrine` (`src/store/useSarelStore.ts`), chamada por `VitrineDemonstracaoController`, que recusa executar fora de `IS_VITRINE_DEMONSTRACAO === true` e exige simultaneamente `origemSintetica === true`, `__SAREL_AVISO__ === "SINTETICO_NAO_VOAR"` e prefixo `SINTETICO_NAO_VOAR_` em todos os itens.
3. **Selo Público D16 mantido na forma redigida:** `src/lib/gee/seloPublicoD16.ts` lê o artefato derivado redigido `docs/verificacoes/selo_publico_d16_2026-11-10.json` (com os agregados por estrato e hashes de integridade, sem coordenadas nem tabela reversa `K2`).

---

## T3 — Marcação Inequívoca em Todas as Telas

1. **Faixa permanente superior (`VitrineDemonstracaoBanner`):** visível continuamente em toda a navegação (`[MOCKUP DEMONSTRATIVO] DEMONSTRAÇÃO ESTÁTICA • SAREL v2.0 • OPERAÇÃO DESABILITADA • DADOS SINTÉTICOS • ESTADO: 11/11/2026`), com atalhos diretos para `Iniciar Tour (17 Etapas)` e `Sobre este Mockup`.
2. **Marca d'água e rótulos nos dados:**
   - Mapa (`MapViewer.tsx`): selo sobreposto (`aria-label="Marca d'água de demonstração estática"`) indicando `MOCKUP DEMONSTRATIVO • PONTOS SINTÉTICOS (NÃO VOAR) • 11/11/2026`.
   - Modais e painéis: componente `VitrineAvisoModal` em destaque no topo de `RegionRequestModal`, `CandidateSelectionModal`, `PainelMedicaoModal`, `PainelSorteioModal`, `PainelCampanhaModal` / `PainelCampanha`, `PainelMatrizModal`, `AuditDossierModal`, `ExportModal`, `SettingsModal`, `CalculadoraDesenhoAmostral`, `DecisoesModal` e `SystemLogsModal`.
   - Cartões, pop-up e dossiê: `PointCardList`, `InspetorPonto`, `PointPopup` e `AuditDossierModal` declaram o prefixo `SINTETICO_NAO_VOAR_` e exibem `OMITIDO_MOCKUP_SINTETICO` no campo fundiário.
3. **Título da aba e pacote:** `src/app/layout.tsx` (`metadata.title`) e `VitrineDemonstracaoController` (`document.title`) definem `[MOCKUP DEMONSTRATIVO] SAREL v2.0 — Demonstração Estática (PPGTCA 2026)`; o diretório do pacote chama-se `docs/apresentacoes/mockup/`.
4. **Tela inicial (`VitrineDemonstracaoController`):** modal de abertura (`#titulo-boas-vindas-vitrine`) explicando em termos diretos o que é o pacote, o que mostra, o que **não** faz por trava estática, e a data do estado retratado (`11/11/2026`).

---

## T4 & T5 — Tour Completo (17 Etapas), Abertura de Todas as Telas e Botões Desabilitados com Explicação

1. **Tour metodológico (17/17 etapas):** validado ponta a ponta em navegador headless offline (Playwright, `05_check_offline_tour_17_etapas.txt`). Todas as 17 etapas resolveram o holofote (`#spotlight-cutout-mask rect[fill="black"]` e contorno `#F59E0B` com dimensões reais em tela > 12 × 12 px) e avançaram até o Passo 17/17 sem erros.
2. **Todas as telas da casca e modais abrem e navegam:**
   - Casca `BarraFluxoOperacional`: Etapas 1 (`Área`), 2 (`Triagem`), 3 (`Medição`), 4 (`Sorteio`), 5 (`Voos — Não implementada`), 6 (`Campo` com as 4 abas internas: `VANT & Desenho Amostral`, `SAREL Coletor`, `Exportação Cega por Perfil` e `Legado Superado`), 7 (`Matriz`) e 8 (`Auditoria`).
   - Modais auxiliares e popup: `ExportModal`, `SettingsModal` (abas `Google Earth Engine`, `Chaves de API & Mapas` e `Base Fundiária Local`), `DecisoesModal` (`D01..D26`), `SystemLogsModal` e `PointPopup` (`SINTETICO_NAO_VOAR_01`).
3. **Botões operacionais preservados, visivelmente desabilitados e explicados (T5):**
   - `DrawingToolbar`: `Delimitar Talhão / Polígono` visível, desabilitado (`Desab. Mockup`) e explicado via `title`.
   - `RegionRequestModal` e `CandidateSelectionModal`: ações de consulta/triagem GEE desabilitadas e explicadas (`VitrineAvisoModal` + `title`).
   - `PainelSorteioD16`: controle de disparo do sorteio visível, desabilitado e acompanhado de nota explicando que a execução pertence apenas ao sistema operacional.
   - `PainelCampanha`: `Ver no Mapa` (sem dados locais), download de template/upload em `SAREL Coletor`, todos os **10 botões CSV/XLSX** dos 5 perfis em `Exportação Cega por Perfil`, e `Consultar Arquivo Legado Kobo` desabilitados e explicados. A demonstração aritmética ilustrativa offline em tela exibe expressamente `"Dados Fictícios / Sem Valor Científico"` e `"DEMONSTRAÇÃO — pixels fictícios, não é validação"`, operando em memória sem nenhuma chamada de rede.
   - `AuditDossierModal` e `ExportModal`: `Imprimir Dossiê (.pdf)` e os 4 exportadores de pacote/dados (`.csv`, `.xlsx`, `.kml`, `.gpx` / `Gerar Pacote`) desabilitados e explicados.
   - `SettingsModal` (`GcpCredentialsManager`, `ApiTokensManager`, `Base Fundiária Local`): entradas e botões de teste (`Testar Conexão GEE` e 5 botões `Testar`) desabilitados; status exibido como `DESABILITADA NO MOCKUP` / `desabilitado no mockup (offline)`.
   - `PointPopup`: links para `Google Earth` e `Google Maps` renderizados como botões desabilitados com legenda explícita abaixo (*"Links externos desabilitados: coordenadas sintéticas demonstrativas (não voar)."*).
4. **Contenção offline em tempo de execução:** além da ausência de rotas `/api/*`, `MapViewer.tsx` renderiza fundo cartográfico local (`vitrine-bg`) sem requisições de tiles e `src/app/page.tsx` instala bloqueio defensivo em `window.fetch` contra origens externas ou `/api/*`.

---

## T6 — Resumo das Seis Verificações Gravadas (`docs/verificacoes/execucao/2026-11-11t/`)

| Verificação | Arquivo de Log | Resultado Medido |
|---|---|---|
| **T6.1** Credenciais / tokens | `01_check_credenciais.txt` | **`LIMPO`** — 0 ocorrências para `private_key \| service_account \| access_token \| BEGIN PRIVATE KEY` em todos os 26 arquivos de texto/JS/HTML do pacote; 0 ocorrências de chaves reais (`pk.eyJ...`, `AIza...`, `PLAK...`, `ts_...`, `BEGIN * PRIVATE KEY`). |
| **T6.2** Coordenadas dos 677 | `02_check_coordenadas_677.txt` | **0 ocorrências** para 3 coordenadas reais amostradas do sorteio (`docs/verificacoes/sorteio/sorteio_d16_2026-11-10.json`) e para varredura exaustiva sobre todos os 67 centroides reais (6d/5d isolados e par `lat4`/`lon4`); distância mínima dos 12 pontos sintéticos = **3.964,9 m (3,96 km)**. |
| **T6.3** CAR e proprietários | `03_check_car_proprietarios.txt` | **0 ocorrências** de padrão CAR SICAR (`PR-\d{7}-[0-9A-F]{32}`), `cand-NNN`, `VANT-BLIND-*` ou dos 201 tokens da correspondência opaca/polígonos reais; confirmada presença de `SINTETICO_NAO_VOAR_` e `OMITIDO_MOCKUP_SINTETICO`. |
| **T6.4** Zero rotas de API | `04_check_rotas_api.txt` | **0 arquivos de rota ou diretórios `/api/`** dentro de `docs/apresentacoes/mockup/`; 13 rotas `src/app/api/**/route.ts` de produção preservadas na íntegra. |
| **T6.5** Execução sem rede + tour completo | `05_check_offline_tour_17_etapas.txt` | **17/17 passos do tour** com holofote resolvido + todas as etapas da casca, modais, abas e `PointPopup` validados em Chromium headless sem internet; **0 tentativas externas**, **0 chamadas `/api/*`**, **0 `pageerror`**, **0 `console.error`**. |
| **T6.6** Selo público redigido | `06_check_selo_redigido.txt` | `hashIntegridade` (`15a5f1f38a3cf512`), `sha256SeloCompleto` (`ee1a8d82dbdbe4ae...`), `sha256ConjuntoCandidatos` (`0de2e0e3b313091a...`) e `declaracaoNatureza` presentes; chave `tabelaCorrespondenciaOpaca` e polígonos individuais ausentes (`opacaHits = 0`). |

---

## T7 — Entrega, Forma de Abertura e Tamanho do Pacote

- **Localização do pacote distribuível:** `docs/apresentacoes/mockup/`
- **Documentação interna incluída:** `docs/apresentacoes/mockup/README.md` (o que é, como abrir, o que mostra, o que não faz e data do estado `11/11/2026`).
- **Tamanho medido do pacote pronto:** **3,47 MB (3.637.381 bytes)** distribuídos em **28 arquivos** (adequado para compartilhamento direto por e-mail compactado ou nuvem).
- **Forma de abrir (exige servidor HTTP estático simples):**
  - Porque a exportação estática do Next.js App Router (`output: "export"`) referencia os chunks e folhas de estilo sob o caminho absoluto da raiz (`/_next/static/...`), a abertura direta via protocolo `file://` no sistema de arquivos não resolve a raiz `/` corretamente.
  - Deve-se servir o diretório em um servidor HTTP estático local (offline), por exemplo:
    ```bash
    npx serve docs/apresentacoes/mockup -l 4173
    # ou com Python 3:
    python -m http.server -d docs/apresentacoes/mockup 4173
    ```
  - E acessar `http://127.0.0.1:4173/` no navegador.

---

## Portões Obrigatórios (Após a Edição Final e Reconstrução)

| Comando | Arquivo de Log | Resultado Observado |
|---|---|---|
| `npm run mockup:build` | `00_mockup_build.txt` | **exit 0** — 28 arquivos (3,47 MB / 3.637.381 bytes) |
| `npm test` (`vitest run`) | `07_npm_test.txt` | **exit 0** — **114** arquivos de teste aprovados (`1007 passed`, `3 skipped` pré-existentes em `src/lib/fundiario/matcher.test.ts` por ausência do SQLite local fora do git) |
| `npx tsc --noEmit` | `08_tsc_noEmit.txt` | **exit 0** — zero erros de tipagem |
| `npm run lint` (`next lint`) | `09_npm_lint.txt` | **exit 0** — apenas os 2 avisos pré-existentes de `react-hooks/exhaustive-deps` em `MapViewer.tsx:601` e `PointPopup.tsx:77` |

---

## Empacotamento em Executável Único Windows (`.exe` e `.zip`)

Atendendo à solicitação de distribuição simplificada em arquivo único para Windows (sem exigir Node.js, Python ou extração prévia do servidor estático):

1. **Gerador e Lançador:**
   - Código-fonte do lançador Windows (.NET Framework 4.x / WinForms + servidor HTTP em memória restrito a `127.0.0.1`): `scripts/installer/VitrineMockupLauncher.cs`
   - Script de empacotamento: `scripts/build_mockup_exe.mjs` (comando npm: `npm run mockup:exe`, log em `10_mockup_exe_build.txt`)
   - Empacota exclusivamente os 28 arquivos auditados de `docs/apresentacoes/mockup/` dentro do recurso `VitrinePayload.zip` (1,26 MB comprimido), servidos em RAM sem gravação temporária no disco e encerrados ao fechar a janela do lançador.
2. **Artefatos Gerados:**
   - **Executável único Windows:** `docs/apresentacoes/SAREL_Mockup_Demonstrativo_2026-11-11.exe` (**1,41 MB / 1.481.728 bytes**)
   - **Pacote compactado para envio por e-mail (Gmail/Outlook bloqueiam `.exe` solto):** `docs/apresentacoes/SAREL_Mockup_Demonstrativo_2026-11-11.zip` (**1,40 MB / 1.470.586 bytes**), contendo o `.exe` e instruções curtas (`LEIA-ME_MOCKUP_EXE.txt`, incluindo orientação do aviso SmartScreen por ausência de certificado comercial).
3. **Verificação Isolada do Executável (`11_check_exe_isolado_offline.txt`):**
   - O arquivo `SAREL_Mockup_Demonstrativo_2026-11-11.exe` foi copiado para diretório temporário isolado fora do repositório (`%TEMP%\sarel-exe-isolado-*`), iniciado no servidor em memória (`127.0.0.1`, 28 arquivos) e navegado via Playwright Chromium sem acesso externo: **17/17 etapas do tour**, modais e botões desabilitados validados com **0 requisições externas**, **0 `/api/*`**, **0 `pageerror`** e **0 `console.error`**.
4. **Portões obrigatórios reexecutados com o `.exe` no repositório (`07_npm_test.txt`, `08_tsc_noEmit.txt`, `09_npm_lint.txt`):**
   - `npm test`: **exit 0** (`114` arquivos aprovados, `1007 passed`, `3 skipped` pré-existentes sem SQLite local).
   - `npx tsc --noEmit`: **exit 0**.
   - `npm run lint`: **exit 0**.
