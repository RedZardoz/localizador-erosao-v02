# Inventário do Legado — SAREL

**Última atualização:** 2026-09-10 (Fase −1)
**Contagem:** 97 arquivos em `legado/localizador/src/` · 88+ arquivos em `legado/sarel1/`

> **Protocolo de porte (§21).** Cada arquivo que sai de `legado/` passa por: leitura do inventário → conferência contra a Lei Fundamental → teste que falharia com o defeito → `git mv` sem alteração → adaptação em commit separado → atualização deste inventário.

> **Ações:** **portar** (volta quase intacto) · **adaptar** (volta com correções listadas) · **reescrever** (código novo; antigo é referência) · **descartar** (não volta; motivo registrado) · **avaliar** (decisão na fase indicada)

---

## A.1 — Localizador (`legado/localizador/src/`)

### Tipos

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `types/erosion.ts` | descartar | — | −1 | Substituído pela tríade `proveniencia.ts`, `ponto.ts`, `rotulo.ts` (prompt §7) |

### App / Rotas API

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `app/layout.tsx` | reescrever | `src/app/layout.tsx` | 7 | Novo layout SAREL |
| `app/page.tsx` | reescrever | `src/app/page.tsx` | 7 | Nova página principal SAREL |
| `app/globals.css` | adaptar | `src/app/globals.css` | 7 | Remover estilos de severidade |
| `app/favicon.ico` | portar | `src/app/favicon.ico` | 7 | — |
| `app/icon.png` | portar | `src/app/icon.png` | 7 | — |
| `app/api/auth/gee-session/route.ts` | adaptar | `src/app/api/auth/session/route.ts` | 1 | Unificar sessão; usar `sessaoEfemera.ts` |
| `app/api/auth/gee-test/route.ts` | avaliar | — | 1 | Verificar utilidade para rota de verificação |
| `app/api/auth/token-test/route.ts` | avaliar | — | 1 | Verificar utilidade para rota de verificação |
| `app/api/fundiario/match/route.ts` | adaptar | `src/app/api/fundiario/consulta/route.ts` | 2 | Não mascarar erro como "sem-correspondencia" |
| `app/api/fundiario/batch-match/route.ts` | adaptar | `src/app/api/fundiario/consulta/route.ts` | 2 | Unificar com rota acima |
| `app/api/fundiario/fontes/route.ts` | adaptar | `src/app/api/fundiario/fontes/route.ts` | 2 | Reportar "disponíveis nesta instalação" |
| `app/api/fundiario/polygon/route.ts` | adaptar | `src/app/api/fundiario/poligono/route.ts` | 2 | — |
| `app/api/gee/analyze-point/route.ts` | descartar | — | −1 | Fonte de C3 (NDVI 0,32 + BSI 0,45); defaults em 4 caminhos divergentes |
| `app/api/gee/select-candidates/route.ts` | descartar | — | −1 | Fonte de C3, C4, C6 e A7 |
| `app/api/gee/replace-candidate/route.ts` | descartar | — | −1 | Acoplado aos anteriores |
| `app/api/gee/token-test/route.ts` | avaliar | — | 1 | Verificar utilidade |

### Componentes

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `components/layout/Header.tsx` | adaptar | `src/components/layout/Header.tsx` | 7 | Renomear para SAREL |
| `components/map/MapViewer.tsx` | adaptar | `src/components/mapa/MapaAmostral.tsx` | 7 | Remover camadas de severidade e calor |
| `components/map/MapControls.tsx` | adaptar | `src/components/mapa/` | 7 | — |
| `components/map/PointPopup.tsx` | reescrever | `src/components/inspetor/InspetorPonto.tsx` | 7 | Inspetor com 4 selos de proveniência |
| `components/sidebar/Sidebar.tsx` | adaptar | `src/components/mapa/SidebarAmostral.tsx` | 7 | — |
| `components/sidebar/FiltersPanel.tsx` | adaptar | `src/components/mapa/` | 7 | Filtros por estrato e completude |
| `components/sidebar/PointCardList.tsx` | adaptar | `src/components/mapa/` | 7 | — |
| `components/sidebar/StatsOverview.tsx` | reescrever | `src/components/matriz/PainelMatrizTreino.tsx` | 7 | Sem severidade, com balanço de classes |
| `components/sidebar/BatchGeeCalculator.tsx` | descartar | — | −1 | Processamento em lote com defaults |
| `components/sidebar/RegionAndTopNSelector.tsx` | descartar | — | −1 | Top-N baseado em severidade |
| `components/audit/AuditDossierModal.tsx` | reescrever | `src/components/relatorios/DossiePonto.tsx` | 7 | Dossiê sem score nem perda |
| `components/config/ApiTokensManager.tsx` | adaptar | `src/components/config/` | 7 | — |
| `components/config/DataIngestionDropzone.tsx` | adaptar | `src/components/config/` | 7 | — |
| `components/config/GcpCredentialsManager.tsx` | adaptar | `src/components/config/` | 7 | — |
| `components/config/KoboFieldImport.tsx` | adaptar | `src/components/config/` | 6 | — |
| `components/config/SettingsModal.tsx` | adaptar | `src/components/config/` | 7 | — |
| `components/data/DataManagerModal.tsx` | reescrever | — | 7 | — |
| `components/diagnostics/SystemLogCapture.tsx` | portar | `src/components/diagnostico/` | 7 | — |
| `components/diagnostics/SystemLogsModal.tsx` | portar | `src/components/diagnostico/` | 7 | — |
| `components/export/ExportModal.tsx` | reescrever | `src/components/campanha/` | 7 | Exportação por perfil cego |
| `components/polygon/DrawingToolbar.tsx` | adaptar | `src/components/aoi/` | 7 | — |
| `components/polygon/PolygonManagerModal.tsx` | adaptar | `src/components/aoi/` | 7 | — |
| `components/region/CandidateSelectionModal.tsx` | reescrever | `src/components/aoi/` | 7 | Sem Top-N nem severidade |
| `components/region/RegionRequestModal.tsx` | adaptar | `src/components/aoi/` | 7 | — |
| `components/saved/SavedDatasetsModal.tsx` | adaptar | `src/components/` | 7 | — |

### Lib — Embrapa

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `lib/embrapa/embrapaSoilClient.ts` | **portado** ✅ | `src/lib/embrapa/embrapaSoilClient.ts` | −1 | 19 testes preservados |
| `lib/embrapa/embrapaSoilClient.test.ts` | **portado** ✅ | `src/lib/embrapa/embrapaSoilClient.test.ts` | −1 | — |
| `lib/embrapa/smartSolosClient.ts` | descartar | — | −1 | Decorativo: token validado para serviço nunca chamado |

### Lib — GEE

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `lib/gee/googleAuth.ts` | portar | `src/lib/gee/auth.ts` | 1 | JWT RS256 nativo |
| `lib/gee/googleAuth.test.ts` | portar | `src/lib/gee/auth.test.ts` | 1 | — |
| `lib/gee/sessionStore.ts` | adaptar | `src/lib/seguranca/sessaoEfemera.ts` | 1 | — |
| `lib/gee/sessionStore.test.ts` | adaptar | `src/lib/seguranca/sessaoEfemera.test.ts` | 1 | — |
| `lib/gee/aoiTiling.ts` | portar | `src/lib/gee/aoiTiling.ts` | 4 | — |
| `lib/gee/aoiTiling.test.ts` | portar | `src/lib/gee/aoiTiling.test.ts` | 4 | — |
| `lib/gee/calcEngineVersion.ts` | portar | `src/lib/gee/versaoMotor.ts` | 1 | — |
| `lib/gee/calcEngineVersion.test.ts` | portar | `src/lib/gee/versaoMotor.test.ts` | 1 | — |
| `lib/gee/eligibilityMask.ts` | adaptar | `src/lib/gee/elegibilidade.ts` | 4 | Corrigir EPSG:3857 → 31982; usar função única de declividade |
| `lib/gee/eligibilityMask.test.ts` | adaptar | `src/lib/gee/elegibilidade.test.ts` | 4 | — |
| `lib/gee/eligibilityConstants.ts` | adaptar | `src/lib/gee/elegibilidade.ts` | 4 | Unificar constantes |
| `lib/gee/spatialThinning.ts` | adaptar | `src/lib/gee/thinning.ts` | 4 | — |
| `lib/gee/spatialThinning.test.ts` | adaptar | `src/lib/gee/thinning.test.ts` | 4 | — |
| `lib/gee/candidateSelector.ts` | descartar | — | −1 | Fonte de C3, C4, C6, A7, M5; defaults numéricos |
| `lib/gee/earthEngineClient.ts` | adaptar | `src/lib/gee/client.ts` | 2 | Remover `unmask`; corrigir projeção |
| `lib/gee/stratification.ts` | descartar | — | −1 | Inferência espúria de solos; limites rígidos |
| `lib/gee/stratification.test.ts` | descartar | — | −1 | Testes de código descartado |
| `lib/gee/stratificationConstants.ts` | descartar | — | −1 | Limites arbitrários |
| `lib/gee/verifyEarthEngineAccess.ts` | avaliar | — | 1 | Verificar utilidade |

### Lib — Segurança

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `lib/security/localOnly.ts` | portar | `src/lib/seguranca/localOnly.ts` | 1 | — |
| `lib/security/localOnly.test.ts` | portar | `src/lib/seguranca/localOnly.test.ts` | 1 | — |

### Lib — RUSLE

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `lib/rusle/rusleCalculator.ts` | descartar | — | −1 | Fator C invertido (1+BSI); severidade acoplada |
| `lib/rusle/rusleCalculator.test.ts` | descartar | — | −1 | Testes de código descartado |
| `lib/rusle/rainfallErosivity.ts` | descartar | — | −1 | Climatologia grosseira sem D13 |
| `lib/rusle/rainfallErosivity.test.ts` | descartar | — | −1 | — |
| `lib/rusle/soilErodibility.ts` | descartar | — | −1 | Sem referência; SoilGrids vazio |
| `lib/rusle/soilErodibility.test.ts` | descartar | — | −1 | — |
| `lib/rusle/soilGridsClient.ts` | descartar | — | −1 | Serviço sem dados para o Brasil |

### Lib — Fundiário

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `lib/fundiario/spatialMatcher.ts` | adaptar | `src/lib/fundiario/matcher.ts` | 2 | Nunca mascarar erro como "sem-correspondencia" |
| `lib/fundiario/spatialMatcher.test.ts` | adaptar | `src/lib/fundiario/matcher.test.ts` | 2 | — |

### Lib — Store

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `lib/store/useErosionStore.ts` | reescrever | `src/store/useSarelStore.ts` | 7 | Proveniência direto no Zustand; sem espelho plano |
| `lib/store/useErosionStore.test.ts` | reescrever | `src/store/useSarelStore.test.ts` | 7 | — |

### Lib — Utils

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `lib/utils/xlsxWriter.ts` | portar | `src/lib/export/xlsxWriter.ts` | 1 | — |
| `lib/utils/auditTableExport.ts` | adaptar | `src/lib/export/planilha.ts` e `csv.ts` | 1 | Aba dupla (valor+origem); regras §16 |
| `lib/utils/auditTableExport.test.ts` | adaptar | `src/lib/export/planilha.test.ts` | 1 | — |
| `lib/utils/geoUtils.ts` | adaptar | `src/lib/export/dms.ts` e `localizacao/` | 1 | Corrigir rollover 60,0" |
| `lib/utils/geoUtils.test.ts` | adaptar | `src/lib/export/dms.test.ts` | 1 | — |
| `lib/utils/koboParser.ts` | adaptar | `src/lib/rotulos/ingestaoKobo.ts` | 6 | — |
| `lib/utils/koboParser.test.ts` | adaptar | `src/lib/rotulos/ingestaoKobo.test.ts` | 6 | — |
| `lib/utils/exportUtils.ts` | avaliar | — | 1 | Verificar o que é útil |
| `lib/utils/batchEnrichment.ts` | descartar | — | −1 | Fonte dos 150 valores constantes (16%, 0,45, 35,2) |
| `lib/utils/batchEnrichment.test.ts` | descartar | — | −1 | Testes de código descartado |
| `lib/utils/parsers.ts` | descartar | — | −1 | Defaults numéricos `|| 16`, `|| 0,45` |
| `lib/utils/parsers.test.ts` | descartar | — | −1 | — |
| `lib/utils/shapefileExport.ts` | avaliar | — | 7 | — |
| `lib/utils/shapefileExport.test.ts` | avaliar | — | 7 | — |

### Lib — PDF

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `lib/pdf/auditPdfGenerator.ts` | reescrever | `src/components/relatorios/` | 7 | Dossiê sem score; defaults `k ?? 0,035`, `c ?? 0,28` descartados |
| `lib/pdf/auditPdfGenerator.test.ts` | reescrever | — | 7 | — |

### Lib — API

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `lib/api/ibgeClient.ts` | adaptar | `src/lib/localizacao/municipio.ts` | 2 | — |

### Data

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `data/paranaBasins.ts` | avaliar | `src/lib/localizacao/dados/` | 2 | Verificar proveniência |
| `data/paranaBoundary.ts` | avaliar | `src/lib/localizacao/dados/` | 2 | — |
| `data/regionsData.ts` | avaliar | `src/lib/localizacao/dados/` | 2 | — |

---

## A.2 — SAREL 1 (`legado/sarel1/`)

### Arquivos a Aproveitar (após revisão)

| Arquivo | Ação | Destino | Fase | Observação |
|---|---|---|---|---|
| `src/types/proveniencia.ts` | adaptar | `src/types/proveniencia.ts` | 1 | Referência para tipos; conferir contra prompt §7 |
| `src/types/ponto.ts` | adaptar | `src/types/ponto.ts` | 1 | Conferir contra prompt §7 |
| `src/types/rotulo.ts` | adaptar | `src/types/rotulo.ts` | 1 | Conferir contra prompt §7 |
| `src/lib/seguranca/guardaSintetico.ts` | adaptar | `src/lib/seguranca/guardaSintetico.ts` | 1 | Corrigir cobertura (testar todas as saídas) |
| `src/lib/seguranca/guardaSintetico.test.ts` | adaptar | `src/lib/seguranca/guardaSintetico.test.ts` | 1 | — |
| `src/lib/matriz/invariantes.ts` | adaptar | `src/lib/matriz/invariantes.ts` | 1 | Corrigir Inv. 7 (S1-12): percorrer todas as colunas; vazios não desativam |
| `src/lib/matriz/invariantes.test.ts` | adaptar | `src/lib/matriz/invariantes.test.ts` | 1 | Adicionar meta-teste |
| `src/lib/matriz/montagem.ts` | adaptar | `src/lib/matriz/montagem.ts` | 6 | — |
| `src/lib/matriz/montagem.test.ts` | adaptar | `src/lib/matriz/montagem.test.ts` | 6 | — |
| `src/lib/rotulos/concordancia.ts` | adaptar | `src/lib/rotulos/concordancia.ts` | 6 | Corrigir S1-13: Kappa null sem pares; pₑ=1 → null |
| `src/lib/rotulos/concordancia.test.ts` | adaptar | `src/lib/rotulos/concordancia.test.ts` | 6 | — |
| `src/lib/rotulos/ingestaoKobo.ts` | adaptar | `src/lib/rotulos/ingestaoKobo.ts` | 6 | — |
| `src/lib/rotulos/ingestaoInterpretacao.ts` | adaptar | `src/lib/rotulos/ingestaoInterpretacao.ts` | 6 | — |
| `src/lib/rotulos/ingestaoDrone.ts` | adaptar | `src/lib/rotulos/ingestaoDrone.ts` | 6 | — |
| `src/lib/rotulos/ingestao.test.ts` | adaptar | — | 6 | — |
| `src/components/inspetor/InspetorPonto.tsx` | adaptar | `src/components/inspetor/InspetorPonto.tsx` | 7 | Esboço; selos de proveniência |
| `src/components/inspetor/SeloProveniencia.tsx` | adaptar | `src/components/inspetor/SeloProveniencia.tsx` | 7 | — |
| `src/components/inspetor/GraficoSerieTemporal.tsx` | adaptar | `src/components/inspetor/GraficoSerieTemporal.tsx` | 7 | Lacunas como lacunas |
| `src/lib/export/planilha.ts` | adaptar | `src/lib/export/planilha.ts` | 1 | Referência para colunas duplas |
| `src/lib/export/planilha.test.ts` | adaptar | `src/lib/export/planilha.test.ts` | 1 | — |
| `src/lib/export/geoConversao.ts` | adaptar | `src/lib/export/dms.ts` | 1 | Conferir rollover 60,0" |
| `src/lib/export/geoConversao.test.ts` | adaptar | `src/lib/export/dms.test.ts` | 1 | — |
| `src/lib/export/xlsxWriter.ts` | avaliar | — | 1 | Comparar com original do Localizador |

### Arquivos a Descartar

| Arquivo | Ação | Motivo |
|---|---|---|
| `src/lib/embrapa/soilClient.ts` | descartar | Removeu testes críticos (S1-05); classes não verificadas (S1-03) |
| `src/lib/embrapa/soilClient.test.ts` | descartar | 13 testes vs 19 do original |
| `src/lib/dados/pontosExemplo.ts` | descartar | Geração de dados falsos no navegador (S1-01) |
| `src/lib/fundiario/cadastre_service.py` | descartar | Duplicava matcher; fabricava SNCR (S1-18) |
| `src/lib/fundiario/cadastreService.test.ts` | descartar | — |
| `src/lib/rusle/fatores.ts` | descartar | R inventado (S1-08); NDVI fabricado (S1-06); cortes (S1-10) |
| `src/lib/rusle/baseline.test.ts` | descartar | Testes de fórmulas inventadas |
| `src/lib/chuva/eventos.ts` | descartar | Erosividade inventada (S1-09); limiar sem referência |
| `src/lib/chuva/eventos.test.ts` | descartar | — |
| `src/lib/chuva/chirps.ts` | descartar | "verificado" sem chamada (S1-02); adquiridoEm = hoje (S1-11) |
| `src/lib/chuva/imerg.ts` | descartar | "verificado" sem chamada (S1-02) |
| `src/lib/gee/auth.ts` | descartar | Sem chamada real ao GEE |
| `src/lib/gee/client.ts` | descartar | "verificado" sem chamada (S1-02) |
| `src/lib/gee/blocosEspaciais.ts` | descartar | Piso 10 km arbitrário (S1-15) |
| `src/lib/gee/blocosEspaciais.test.ts` | descartar | — |
| `src/lib/gee/compostoSoloNu.ts` | descartar | Default limiarNdvi=0,25 (S1-16) |
| `src/lib/gee/elegibilidade.ts` | descartar | Reescrever na Fase 4 |
| `src/lib/gee/estratificacao.ts` | descartar | Default meta, semente (S1-16) |
| `src/lib/gee/estratificacao.test.ts` | descartar | — |
| `src/lib/gee/harmonicos.ts` | descartar | Reescrever com QualidadeAjuste |
| `src/lib/gee/serieTemporal.ts` | descartar | Reescrever com preservação de máscara |
| `src/lib/gee/serieTemporal.test.ts` | descartar | — |
| `src/lib/gee/terreno.ts` | descartar | Cortes silenciosos em TWI (S1-10); adquiridoEm = hoje (S1-11) |
| `src/lib/gee/terreno.test.ts` | descartar | — |
| `src/lib/planet/quota.ts` | descartar | Cota em memória, ciclo fixo (S1-14) |
| `src/lib/planet/dataApi.ts` | descartar | Fração limpa 80% sem justificativa (S1-14) |
| `src/store/useSarelStore.ts` | descartar | Usa pontosExemplo (S1-01) |
| `src/store/useSarelStore.test.ts` | descartar | — |
| `docs/AUDITORIA_INTEGRIDADE_2026.md` | descartar | Auto-auditoria incorreta (S1-17) |

### Restantes (avaliar nas fases pertinentes)

Componentes de UI, modais, relatórios, ibgeService, planet/ordersApi, planet/paresEvento, planet/tiles, fundiário/matcher, fundiário/protecao, dados/* — a avaliar nas fases 2, 5, 6 e 7.

---

## Estatísticas

| Origem | Total | Portar | Adaptar | Reescrever | Descartar | Avaliar | Portado ✅ |
|---|---|---|---|---|---|---|---|
| Localizador | 97 | ~12 | ~22 | ~8 | ~25 | ~12 | 2 (Embrapa) |
| SAREL 1 | ~88 | 0 | ~22 | 0 | ~30 | ~36 | 0 |
