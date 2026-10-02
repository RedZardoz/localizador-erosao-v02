# ✅ [SUCESSO - SUÍTE 100% APROVADA] RELATÓRIO PERICIAL DE FASE

> [!NOTE]
> Relatório gerado integralmente por script mecânico (`scripts/gerar_relatorio_fase.ts`).
> Todos os números e tabelas provêm de extração direta de artefatos auditados no disco.

---

## Evidência gerada (Produzida pelo script)

### 1. Execução Real da Suíte de Testes

- **TypeScript (npx tsc --noEmit)**: ✅ OK (código 0)
- **Vitest (npx vitest run)**: ✅ OK (código 0)

<details>
<summary><b>Clique para expandir a saída real do Vitest</b></summary>

```text
[1m[30m[46m RUN [49m[39m[22m [36mv4.1.11 [39m[90mC:/Users/lalfr/Docs Fora do Ar/LUIS ALFREDO/01 - MESTRADO PPGTCA 2026/02 - PESQUISA EROSÃO LAMINAR/geolocalizacao-erosao-propriedade[39m

 [32m✓[39m src/lib/seguranca/verificacoes.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 248[2mms[22m[39m
 [32m✓[39m src/lib/gee/amostragemSoloNuLote.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 101[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/importacoes.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 359[2mms[22m[39m
       [33m[2m✓[22m[39m nenhum arquivo em src/ importa de legado/ [33m 351[2mms[22m[39m
 [32m✓[39m src/lib/export/pacoteReprodutibilidade.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 108[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/padroesProibidos.test.ts [2m([22m[2m17 tests[22m[2m)[22m[33m 667[2mms[22m[39m
 [32m✓[39m src/lib/gee/copernicusGeeClient.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 59[2mms[22m[39m
 [32m✓[39m src/lib/gee/sorteioPoligonos.test.ts [2m([22m[2m12 tests[22m[2m)[22m[32m 98[2mms[22m[39m
 [32m✓[39m src/lib/embrapa/embrapaSoilClient.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 57[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/gerarRelatorioFase.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 83[2mms[22m[39m
 [32m✓[39m src/lib/export/planilha.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 52[2mms[22m[39m
 [32m✓[39m src/lib/fundiario/calculadoraDesenho.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 42[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/cegamentoArtefatos.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m src/lib/planet/planet.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 43[2mms[22m[39m
 [32m✓[39m src/lib/chuva/chuva.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 28[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/credenciaisSeguras.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 32[2mms[22m[39m
 [32m✓[39m src/lib/gee/compostoSoloNu.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 25[2mms[22m[39m
 [32m✓[39m src/lib/matriz/montagemTemporal.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 30[2mms[22m[39m
 [32m✓[39m src/lib/gee/auth.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m src/components/inspetor/InspetorPonto.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 33[2mms[22m[39m
 [32m✓[39m src/lib/gee/persistenciaTemporal.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 27[2mms[22m[39m
 [32m✓[39m src/lib/rusle/rusle.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/provenienciaCaminhos.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 32[2mms[22m[39m
 [32m✓[39m src/lib/rotulos/rotulos.test.ts [2m([22m[2m17 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m src/lib/jev/jevClient.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m src/lib/padraoOuro/validacaoMatricial.test.ts [2m([22m[2m14 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m src/lib/gee/estratificacao.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m src/config/decisoes.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m src/lib/rusle/fatorK.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/localOnly.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m src/config/tourMetodologico.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m src/lib/gee/terreno.test.ts [2m([22m[2m12 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m src/lib/fundiario/selecaoPontoElegivel.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m src/lib/localizacao/localizacao.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m src/lib/gee/blocosEspaciais.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m src/lib/gee/serieTemporal.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m src/lib/gee/thinning.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m src/lib/matriz/invariantes.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m src/lib/gee/elegibilidade.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m src/lib/gee/versaoMotor.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m src/store/interfaceIntegration.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/sessaoEfemera.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m src/store/useSarelStore.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m src/lib/gee/estatisticasSerie.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m src/lib/gee/harmonicos.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m src/lib/gee/aoiTiling.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/guardaSintetico.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m src/lib/export/dms.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m src/lib/gee/amostragemBiofisica.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m src/lib/fundiario/matcher.test.ts [2m([22m[2m14 tests[22m[2m)[22m[33m 8741[2mms[22m[39m
     [33m[2m✓[22m[39m deve encontrar uma propriedade rural oficial indexada no SQLite local [33m 2555[2mms[22m[39m
     [33m[2m✓[22m[39m deve retornar status sem-correspondencia para coordenada fora de qualquer perímetro cadastrado [33m 2072[2mms[22m[39m
     [33m[2m✓[22m[39m deve retornar status base-nao-disponivel para UF fora da cobertura (ex: BA) [33m 2460[2mms[22m[39m
     [33m[2m✓[22m[39m deve executar batchMatchRuralProperties em lote com integridade de status [33m 1638[2mms[22m[39m
 [32m✓[39m src/lib/drone/planoVooNControl.test.ts [2m([22m[2m8 tests[22m[2m)[22m[33m 9792[2mms[22m[39m
     [33m[2m✓[22m[39m Z1 & W3: amostrador real do Copernicus DEM GLO-30 lê os tiles oficiais com isolamento de PROJ_LIB, confere cota contra benchmark independente e recusa NoData / fora de borda (P12) [33m 9630[2mms[22m[39m

[2m Test Files [22m [1m[32m50 passed[39m[22m[90m (50)[39m
[2m      Tests [22m [1m[32m374 passed[39m[22m[90m (374)[39m
[2m   Start at [22m 18:04:18
[2m   Duration [22m 10.71s[2m (transform 3.45s, setup 0ms, import 7.14s, tests 21.05s, environment 13ms)[22m


[33mThe plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the [1mresolve.tsconfigPaths[22m option. You can remove the plugin and set [1mresolve.tsconfigPaths: true[22m in your Vite config instead.[39m
```
</details>

### 2. Inventário Pericial de Artefatos, Integridade e SHA-256

| Caminho Relativo | Existe? | Tamanho (Bytes) | SHA-256 |
|---|:---:|---:|---|
| `src/lib/drone/planoVooNControl.ts` | Sim | 71.239 | `1ef9b02f3ded33a3614a115be5bc3d75d14e2c12568ddceb651b87222f3e1ccf` |
| `src/lib/drone/planoVooNControl.test.ts` | Sim | 22.302 | `240c686fde6547e5807defa59751dce81c3e0c6bfb875e4ed168907fdf9d95a8` |
| `src/lib/seguranca/cegamentoArtefatos.test.ts` | Sim | 4.243 | `886459e136f896f6cb32d639d18072d7c4ed90145d0c0c1e6dcad142bbc8b13f` |
| `src/lib/fundiario/selecaoPontoElegivel.ts` | Sim | 6.767 | `9883d9b657b6d6fcbfa2c51d9d23e9fafa250f5dc1ead731c5035ef1c0631938` |
| `src/lib/fundiario/selecaoPontoElegivel.test.ts` | Sim | 6.038 | `c34351b7bab327e812d20724fdf12c1c6a64b09f0682bb40cf13283347b09e50` |
| `src/lib/fundiario/calculadoraDesenho.ts` | Sim | 18.879 | `ea67941455230e9cf666e33b41d8d3d04a790ea5ade194f5532e40e65c32f617` |
| `src/lib/fundiario/calculadoraDesenho.test.ts` | Sim | 4.228 | `c48d79ebf04445e7b6da159f56413376ca73d10c2a6ce800618afeee96b2e8dc` |
| `scripts/reduzir_terreno_copernicus.py` | Sim | 24.349 | `18ef1d978d4a861725ab6cfcf6bac55b9e88eb14e74a4b5ac6dc09458c9a7c1f` |
| `scripts/remedir_candidatos_bp3_d16.ts` | Sim | 32.034 | `469a13977ddc1fc910620d1aadc3cc12b244fb917a9e72385ba17cf1e3333a34` |
| `docs/verificacoes/voo_ncontrol/LEIA-ME_NAO_VOAR.md` | Sim | 3.247 | `cb350d6cf639fca9f9a6fc9a041c289e8e408147d488af80ff045ac84a9f496e` |
| `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_jornada_01_terrainfollow.plan` | Sim | 127.750 | `791e49af00d8ed06ff5a42175effe6179414d7636c28f5aabbeca96ac912f779` |
| `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_jornada_01_altfixa.plan` | Sim | 127.756 | `81e8536a5c1a65fe2de1b299fcdd37abc7034a436ad87fdc8bbafb47e7c875b8` |
| `docs/verificacoes/voo_ncontrol/relatorio_aceitacao_y1_y6_2026-09-29.json` | Sim | 2.231 | `c6c5ba0cd6c2b13e21532e23626297ad4717765eed6e470ee645490bbb3cf77d` |
| `docs/verificacoes/voo_ncontrol/roteiro_jornadas_72poligonos.csv` | Sim | 16.325 | `2af484250487948becf7be9ddbfeaa47a0da4ffb83c395e151084f440902c609` |
| `docs/verificacoes/voo_ncontrol/tabela_autorizacao_proprietarios_72poligonos.csv` | Sim | 10.112 | `40048f02026254dd1ced149cc396708aa0bd76bb4bee65c254333dab2266f805` |
| `docs/verificacoes/voo_ncontrol/manifesto_interprete_cego_72poligonos.csv` | Sim | 8.704 | `49471e7c20b53b5d06b1fdf35380c53bef2c57c9ff0386b2f5a71e4010832308` |
| `docs/verificacoes/voo_ncontrol/roteiro_jornadas_72poligonos.pdf` | Sim | 16.155 | `58eda8e604bc96918d9f282ad568dd555bafce654e2974f2dbc2735146aeb11a` |
| `docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json` | Sim | 1.567 | `20f0240b070dddb2ec8697189ea31a3ee9053c8c6b2f77d99f34bb8bdb702f99` |
| `docs/verificacoes/2026-09-30_remedicao_candidatos_bp3_d16.md` | Sim | 3.439 | `a42d10703e0333ac4b487bd09224c5b9f5efa5cac770db17f6eb07b6157367d6` |
| `docs/verificacoes/cache_frequencia_solo_nu_bp3.json` | Sim | 328.230 | `3216120615527be4e82ec46b63a77a8afbb6859b97ab7e8449bcd4b2dcbe77df` |
| `docs/verificacoes/cache_pedologia_bp3.json` | Sim | 96.740 | `1f03c945a3b40436f24b17f33d23866e1e78f5a4ba6a0f27a04a80eb5e8f8d66` |
| `docs/verificacoes/calculadora/2026-09-30_simulacao_desenho_d16_224m.md` | Sim | 2.027 | `533e67a8f88abea3f62655a9e40376cb01ed1da7f84923ec7fab1f063e5485ee` |
| `src/lib/seguranca/credenciaisSeguras.ts` | Sim | 5.644 | `c23b000ab9f6aac8c3ff1589055db15490bd244c6a19bcaad6de9c769d977cfa` |
| `src/lib/seguranca/credenciaisSeguras.test.ts` | Sim | 4.955 | `9be518f3002c6908d9e958dc117fd4d5724e53c5771e0d962042d743c5d3e190` |
| `src/lib/gee/amostragemSoloNuLote.ts` | Sim | 18.581 | `1ad806ecbb87e94bfac2b63e0d6bd6291c8b84eb5bfa27dce6a00b6c251446ba` |
| `src/lib/gee/amostragemSoloNuLote.test.ts` | Sim | 9.244 | `ef18fac267d9eb824406dfa2a97c38e067445cbd469d846e01fc8e0fe6ebcef7` |
| `src/components/config/ApiTokensManager.tsx` | Sim | 19.715 | `91c9b03d0efa610f1ea6e9273b9a0eb96b0523e000ee5786f1a30546feba2a6e` |
| `src/components/map/MapViewer.tsx` | Sim | 22.149 | `4743293153f0f6b5bddbf8d8517f07f9492e025f8d039f3d49b2bdfa44b37ff3` |
| `data/dem_cache/Copernicus_DSM_COG_10_S25_00_W054_00_DEM.tif` | Sim | 41.986.866 | `bbc2fda763ca444d53b32090787b50cd9500bd6f328f54c9ef049d8f8eb9f231` |
| `data/dem_cache/Copernicus_DSM_COG_10_S25_00_W055_00_DEM.tif` | Sim | 39.996.560 | `2076dda84be86eb264ef6115332b472b2fad2558f12b76878dc9f9342a616d16` |
| `data/dem_cache/Copernicus_DSM_COG_10_S26_00_W054_00_DEM.tif` | Sim | 43.766.657 | `463002fe797eb327d011ed563e216de09c4827402d3ea58aa070366aa5382251` |
| `data/dem_cache/Copernicus_DSM_COG_10_S26_00_W055_00_DEM.tif` | Sim | 41.136.564 | `220474710e884aa26b4777b642b4e2e005cbab5f714b30f83252e9ea6e099bce` |

### 3. Extração Direta dos Artefatos de Voo

#### 3.1 Roteiro do Piloto (`docs/verificacoes/voo_ncontrol/roteiro_jornadas_72poligonos.csv`)
- **Total de linhas de polígonos**: 72 (esperado: 72)
- **Cabeçalho autêntico no arquivo:**
```csv
idJornada,ordemNaJornada,idPoligono,estratoId,papelConjunto,municipio,codigoCar,centroideLat,centroideLon,areaPoligonoHa,formaPoligono,aspectoMedidoGraus,orientacaoPoligonoGraus,anguloFaixasGraus,anguloAdotadoGraus,conflitoOrientacaoImovel,desnivelMetros,aglDesejadaMetros,altitudeRelativaMinMetros,altitudeRelativaMaxMetros,distanciaDesdeAnteriorKm,comprimentoVooMetros,tempoVooEstimadoMinutosMin,tempoVooEstimadoMinutosMax,numeroTransectos,cameraShots
```
- **Amostra real das duas primeiras linhas:**
```csv
JORNADA_01,1,D16_E_1_1_1_Q01,E_1_1_1,treino,"Toledo",PR-4115200-1001A9B8C7D6E5F4,-24.750000,-53.720000,5.02,retangulo_158x317m,17.55,17.55,107.55,107.55,false,3.91,92.76,90.28,94.19,0.000,2090.6,3.79,4.01,9,170
JORNADA_01,2,D16_E_1_1_1_Q02,E_1_1_1,treino,"Cascavel",PR-4115200-1002A9B8C7D6E5F4,-24.795000,-53.728000,5.02,quadrado_224x224m,329.05,329.05,59.05,59.05,false,8.41,92.76,59.08,67.49,5.069,1906.5,3.45,3.65,7,155
```
- **Auditoria de Cegamento no Roteiro:**
  - ✅ **APROVADO:** Roteiro do piloto livre de códigos opacos de intérprete (W2).

#### 3.2 Manifesto Cego do Intérprete (`docs/verificacoes/voo_ncontrol/manifesto_interprete_cego_72poligonos.csv`)
- **Total de linhas de registros cegos**: 72 (esperado: 72)
- **Cabeçalho autêntico no arquivo:**
```csv
codigoOpacoInterprete,cameraName,gsdAlvoCm,aglNominalMetros,areaPoligonoHa,formatoEntregaOrtomosaico,protocoloDelineacao,dataColetaCampo
```
- **Amostra real das duas primeiras linhas:**
```csv
VANT-BLIND-***[OMITIDO_CEGAMENTO]***,Micasense Altum,4.0,92.76,5.02,GeoTIFF_5Bandas_Refletancia_Calibrada,D26_FracaoAreaErodida_Cego,
VANT-BLIND-***[OMITIDO_CEGAMENTO]***,Micasense Altum,4.0,92.76,5.02,GeoTIFF_5Bandas_Refletancia_Calibrada,D26_FracaoAreaErodida_Cego,
```

#### 3.3 Metadados e Relatório de Aceitação JSON (`docs/verificacoes/voo_ncontrol/relatorio_aceitacao_y1_y6_2026-09-29.json`)
```json
{
  "geradoEm": "2026-09-30T15:00:00.000Z",
  "correcoesPericiaisZ1aZ6": {
    "Z1_amostradorRealGLO30": "Implementado via criarAmostradorCopernicusGLO30Real e testado contra aeroporto SBTD (555,89 m vs 562 m ROTAER)",
    "Z2_fixturesSinteticosRenomeados": "amostradorSinteticoParaTeste com proveniencia: 'sintetico'",
    "Z3_guardaCodigoPlanoSintetico": "ErroEmissaoPlanoSinteticoRecusada por padrão; prefixo SINTETICO_NAO_VOAR_ sob flag de demonstração",
    "Z4_artefatosComitadosRenomeados": "SINTETICO_NAO_VOAR_jornada_01_terrainfollow.plan e SINTETICO_NAO_VOAR_jornada_01_altfixa.plan mantidos com LEIA-ME_NAO_VOAR.md",
    "Z5_cegamentoNaoDerivavel": "gerarCodigoOpacoInterprete sem chave padrão literal no código, estocástico sem segredo externo",
    "Z6_faixasCurvaDeNivel": "anguloFaixasGraus = (aspectoMedidoGraus + 90°) % 360, com eixo maior do polígono mantido no sentido do declive"
  },
  "metadadosCampanha": {
    "versaoExportador": "1.0.0",
    "geradoEm": "2026-09-30T15:00:00.000Z",
    "totalPoligonos": 72,
    "areaUnitariaHa": 5.02,
    "areaTotalHa": 361.44,
    "totalJornadas": 12,
    "maxPoligonosPorJornada": 6,
    "camera": "Micasense Altum",
    "gsdAlvoCm": 4,
    "aglDesejadaMetros": 92.764,
    "velocidadeCruzeiroPlanMs": 15,
    "velocidadeEfetivaMedidaMs": [
      8.7,
      9.2
    ],
    "ressalvasTerrenoGLO30": [
      "1. Modelo Digital de Superfície (DSM), não de terreno nu (DTM): onde houver mata ciliar, quebra-vento ou reflorestamento, a cota do GLO-30 reflete o topo do dossel e não o solo.",
      "2. Resolução espacial de 30 m (suavização intra-célula): ravinas estreitas, terraços agrícolas ou quebras abruptas de vertente menores que 30 m são suavizados pela grade.",
      "3. Obstáculos pontuais ausentes: torres de transmissão, postes, fios, silos e árvores isoladas crescidas após a aquisição radar não constam no modelo; a conferência visual do horizonte de voo e a segurança contra colisão permanecem responsabilidade indelegável do piloto em campo."
    ],
    "ehPlanoSinteticoDemonstracao": true,
    "tilesDEMUtilizados": [
      "S25_00_W054_00",
      "S25_00_W055_00",
      "S26_00_W054_00",
      "S26_00_W055_00"
    ]
  }
}
```

### 4. Ponteiros de Origem Numérica

| Parâmetro / Grandeza | Valor Extraído | Ponteiro de Origem |
|---|---|---|
| Câmera do Voo | `Micasense Altum` | `relatorio_aceitacao_y1_y6_2026-09-29.json` -> `metadadosCampanha.camera` |
| GSD Alvo | `4.0 cm` | `relatorio_aceitacao_y1_y6_2026-09-29.json` -> `metadadosCampanha.gsdAlvoCm` |
| AGL Nominal Desejada | `92.764 m` | `relatorio_aceitacao_y1_y6_2026-09-29.json` -> `metadadosCampanha.aglDesejadaMetros` |
| Total de Polígonos | `72` | `roteiro_jornadas_72poligonos.csv` (72 registros) |
| Total de Jornadas | `12` | `relatorio_aceitacao_y1_y6_2026-09-29.json` -> `metadadosCampanha.totalJornadas` |
| Polígonos por Jornada | `6` | `relatorio_aceitacao_y1_y6_2026-09-29.json` -> `metadadosCampanha.maxPoligonosPorJornada` |
| Tiles DEM Utilizados | `S25_W054, S25_W055, S26_W054, S26_W055` | `relatorio_aceitacao_y1_y6_2026-09-29.json` -> `metadadosCampanha.tilesDEMUtilizados` |
| Relação Curva de Nível | `anguloFaixas = (aspecto + 90°) % 360` | `roteiro_jornadas_72poligonos.csv` -> colunas `aspectoMedidoGraus`, `orientacaoPoligonoGraus`, `anguloFaixasGraus` |

---

## Leitura e juízo

### 1. Auditoria do Par Código Opaco + Atributo de Desenho (W2)
- **Diagnóstico da Violação Prévia:** Conforme identificado pelo pesquisador, o arquivo `docs/verificacoes/voo_ncontrol/roteiro_jornadas_72poligonos.csv` continha na mesma linha o código opaco de cegamento (coluna `codigoOpacoInterprete`) e os atributos metodológicos de desenho (`idPoligono`, `estratoId`, `papelConjunto`, `centroideLat`, `centroideLon`, `codigoCar`). Isso quebrava o protocolo cego de Y5/Z5 para qualquer observador com acesso ao repositório.
- **Ações Corretivas Executadas:**
  1. A propriedade `codigoOpacoInterprete` foi formalmente expurgada da interface `ItemRoteiroJornadaPoligono` e das colunas do roteiro do piloto em CSV e PDF. O piloto opera estritamente com `idPoligono` e dados operacionais de voo.
  2. O mapeamento reverso foi removido de `exportacaoPiloto`. A correspondência entre código opaco e polígono é tratada como segredo de auditoria restrito ao selo criptográfico do pesquisador, não sendo comitada em nenhum artefato.
  3. Foi implementado o verificador automatizado `src/lib/seguranca/cegamentoArtefatos.test.ts`, que varre todos os arquivos de `docs/verificacoes/voo_ncontrol/` e falha se qualquer artefato contiver simultaneamente `VANT-BLIND-*` e identificadores de estrato, treino/held-out ou coordenadas.

### 2. Download do Tile S26/W055 e Verificação de Cobertura por Cálculo (W4)
- **Download do Quadrante Faltante:** Foi baixado do repositório AWS Open Data da ESA o arquivo `data/dem_cache/Copernicus_DSM_COG_10_S26_00_W055_00_DEM.tif` (41.136.564 bytes, ~39,2 MB), cobrindo Medianeira, São Miguel do Iguaçu e Foz do Iguaçu.
- **Retificação da Cobertura da Bacia do Paraná 3:** A cobertura real da BP3 é composta por **quatro tiles de 1° x 1°** (S25_W054, S25_W055, S26_W054 e S26_W055), e não três. A afirmação anterior foi retificada.
- **Verificação por Cálculo:** As funções `identificarTileCopernicus(lat, lon)` e `verificarCoberturaGLO30Poligonos(poligonos)` verificam geometricamente o tile necessário para cada centroide e garantem a presença do arquivo no cache local antes da emissão.

### 3. Comportamento da Verificação Prévia de Cobertura (W4)
- Caso um ou mais polígonos caiam em quadrantes não presentes no cache local, o exportador aborta imediatamente antes de produzir qualquer plano de voo, lançando `ErroTerrenoForaDeCoberturaGLO30` com a lista dos polígonos e tiles faltantes. Falhar cedo e por completo evita a geração de campanhas truncadas ou corrompidas no meio do processamento.

### 4. Justificativa do Timeout no Teste de Z1 (W1)
- O timeout de 35.000 ms foi aplicado estritamente ao teste unitário `Z1 & W3` em `src/lib/drone/planoVooNControl.test.ts`, sem ampliação global no `vitest.config.ts`. O teste realiza 5 chamadas completas ao pipeline raster GDAL/Python no Windows (SBTD, Cascavel, Medianeira, coordenada fora de borda e oceano), demandando ~10 a 14 segundos de CPU/disco. A janela de 35s garante estabilidade contra gargalos de I/O locais.

### 5. Guarda Estrita de Borda Física e Bloqueio de NoData (W3)
- Em `scripts/reduzir_terreno_copernicus.py`, foi adicionada checagem matemática contra `src.bounds` e limites da matriz raster. Pontos localizados a poucos metros fora da borda do tile (ex: `lat = -24.99990, lon = -53.5000` ou `lat = -24.0010, lon = -52.9990`) e leituras espúrias com valor `0.0 m` em rasters sem tag NoData explícita são barrados com lançamento de exceção, impedindo a geração de cotas relativas negativas catastróficas (-457 m).

---
**Identificação do Agente-Executor:** Antigravity (Google DeepMind)  
**Autor do Repositório:** Luís Alfredo Ferreira da Silva (RedZardoz)
