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

 [32m✓[39m src/lib/seguranca/verificacoes.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 740[2mms[22m[39m
       [33m[2m✓[22m[39m toda afirmação VERIFICADO em código deve apontar para arquivo existente em docs/verificacoes/ [33m 718[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/detectorSequencia.test.ts [2m([22m[2m6 tests[22m[2m)[22m[33m 724[2mms[22m[39m
       [33m[2m✓[22m[39m nenhum artefato JSON ativo em docs/verificacoes deve conter séries numéricas com |r| > 0.95 [33m 705[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/importacoes.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 952[2mms[22m[39m
       [33m[2m✓[22m[39m nenhum arquivo em src/ importa de legado/ [33m 944[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/padroesProibidos.test.ts [2m([22m[2m18 tests[22m[2m)[22m[33m 1990[2mms[22m[39m
       [33m[2m✓[22m[39m nenhum arquivo em src/lib, src/app/api, src/store ou src/config deve conter padrões proibidos [33m 473[2mms[22m[39m
       [33m[2m✓[22m[39m nenhum componente em src/components/**/*.tsx deve conter literais de data/código entre aspas ou adquiridoEm fabricado [33m 324[2mms[22m[39m
       [33m[2m✓[22m[39m nenhum script em scripts/ deve conter geração sintética não documentada ou padrões proibidos [33m 382[2mms[22m[39m
       [33m[2m✓[22m[39m assevera que nenhum artefato JSON de medição em docs/verificacoes/ contém séries numéricas correlacionadas com a ordem do arquivo [33m 493[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/gerarRelatorioFase.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 325[2mms[22m[39m
 [32m✓[39m src/lib/gee/sorteioPoligonos.test.ts [2m([22m[2m12 tests[22m[2m)[22m[32m 142[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/cegamentoArtefatos.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 3128[2mms[22m[39m
     [33m[2m✓[22m[39m nenhum arquivo sob controle de versão (git) deve conter simultaneamente código opaco VANT-BLIND-* e identificador de polígono D16_E_* (K2) [33m 3033[2mms[22m[39m
 [32m✓[39m src/lib/jev/jevClient.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 233[2mms[22m[39m
 [32m✓[39m src/lib/embrapa/embrapaSoilClient.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 136[2mms[22m[39m
 [32m✓[39m src/lib/gee/amostragemSoloNuLote.test.ts [2m([22m[2m8 tests[22m[2m)[22m[33m 361[2mms[22m[39m
 [32m✓[39m src/lib/planet/planet.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 157[2mms[22m[39m
 [32m✓[39m src/lib/export/pacoteReprodutibilidade.test.ts [2m([22m[2m15 tests[22m[2m)[22m[33m 583[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/diarioRequisicoes.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 214[2mms[22m[39m
 [32m✓[39m src/lib/gee/copernicusGeeClient.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 73[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/credenciaisSeguras.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 62[2mms[22m[39m
 [32m✓[39m src/lib/rusle/fatorR.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m src/lib/export/planilha.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 99[2mms[22m[39m
 [32m✓[39m src/components/inspetor/InspetorPonto.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 65[2mms[22m[39m
 [32m✓[39m src/lib/fundiario/calculadoraDesenho.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 63[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/provenienciaCaminhos.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 67[2mms[22m[39m
 [32m✓[39m src/lib/gee/auth.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 33[2mms[22m[39m
 [32m✓[39m src/lib/chuva/chuva.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 37[2mms[22m[39m
 [32m✓[39m src/lib/gee/amostragemBiofisica.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m src/lib/matriz/montagemTemporal.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 34[2mms[22m[39m
 [32m✓[39m src/lib/gee/compostoSoloNu.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m src/lib/rusle/rusle.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 31[2mms[22m[39m
 [32m✓[39m src/lib/gee/persistenciaTemporal.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 30[2mms[22m[39m
 [32m✓[39m src/lib/rotulos/ingestaoColetor.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m src/lib/rotulos/rotulos.test.ts [2m([22m[2m17 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/localOnly.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 29[2mms[22m[39m
 [32m✓[39m src/config/decisoes.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 29[2mms[22m[39m
 [32m✓[39m src/lib/gee/estratificacao.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 129[2mms[22m[39m
 [32m✓[39m src/lib/rusle/fatorLS.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m src/lib/matriz/invariantes.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m src/lib/rusle/fatorK.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 36[2mms[22m[39m
 [32m✓[39m src/config/tourMetodologico.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m src/lib/gee/serieTemporal.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 29[2mms[22m[39m
 [32m✓[39m src/lib/gee/versaoMotor.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m src/lib/padraoOuro/validacaoMatricial.test.ts [2m([22m[2m14 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m src/lib/gee/terreno.test.ts [2m([22m[2m12 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m src/lib/fundiario/selecaoPontoElegivel.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m src/components/decisoes/PainelCriterioRefutacaoD25.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m src/lib/gee/blocosEspaciais.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/sessaoEfemera.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m src/lib/seguranca/guardaSintetico.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m src/lib/localizacao/localizacao.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m src/lib/gee/harmonicos.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m src/config/areaInteresse.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m src/lib/gee/elegibilidade.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m src/lib/gee/thinning.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m src/store/interfaceIntegration.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m src/store/useSarelStore.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m src/lib/gee/aoiTiling.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m src/lib/export/dms.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 33[2mms[22m[39m
 [32m✓[39m src/lib/gee/estatisticasSerie.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m src/lib/fundiario/matcher.test.ts [2m([22m[2m14 tests[22m[2m)[22m[33m 19097[2mms[22m[39m
     [33m[2m✓[22m[39m deve encontrar uma propriedade rural oficial indexada no SQLite local [33m 5253[2mms[22m[39m
     [33m[2m✓[22m[39m deve retornar status sem-correspondencia para coordenada fora de qualquer perímetro cadastrado [33m 4568[2mms[22m[39m
     [33m[2m✓[22m[39m deve retornar status base-nao-disponivel para UF fora da cobertura (ex: BA) [33m 5217[2mms[22m[39m
     [33m[2m✓[22m[39m deve executar batchMatchRuralProperties em lote com integridade de status [33m 4033[2mms[22m[39m
 [32m✓[39m src/lib/drone/planoVooNControl.test.ts [2m([22m[2m9 tests[22m[2m)[22m[33m 22780[2mms[22m[39m
     [33m[2m✓[22m[39m Z1 & W3: amostrador real do Copernicus DEM GLO-30 lê os tiles oficiais com isolamento de PROJ_LIB, confere cota contra benchmark independente e recusa NoData / fora de borda (P12) [33m 22515[2mms[22m[39m

[2m Test Files [22m [1m[32m57 passed[39m[22m[90m (57)[39m
[2m      Tests [22m [1m[32m423 passed[39m[22m[90m (423)[39m
[2m   Start at [22m 16:25:03
[2m   Duration [22m 25.04s[2m (transform 7.95s, setup 0ms, import 15.51s, tests 52.85s, environment 18ms)[22m


[33mThe plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the [1mresolve.tsconfigPaths[22m option. You can remove the plugin and set [1mresolve.tsconfigPaths: true[22m in your Vite config instead.[39m
```
</details>

### 2. Inventário Pericial de Artefatos, Integridade e SHA-256

| Caminho Relativo | Existe? | Tamanho (Bytes) | SHA-256 |
|---|:---:|---:|---|
| `src/lib/drone/planoVooNControl.ts` | Sim | 73.696 | `35c685f6277ef381b3f108ce3e5fa4e8459739fc1a4819a40e35f2650c42136b` |
| `src/lib/drone/planoVooNControl.test.ts` | Sim | 27.802 | `acc496c379e1eec9b3dd64ebc2439ed58c81db319315c153704a13b8a7a48830` |
| `src/lib/seguranca/cegamentoArtefatos.test.ts` | Sim | 6.411 | `1751f8538f1f0e60bc3d05620aab57c0f0c6d80fcedecdab14be1e773a50cfdd` |
| `src/lib/fundiario/selecaoPontoElegivel.ts` | Sim | 6.767 | `9883d9b657b6d6fcbfa2c51d9d23e9fafa250f5dc1ead731c5035ef1c0631938` |
| `src/lib/fundiario/selecaoPontoElegivel.test.ts` | Sim | 6.038 | `c34351b7bab327e812d20724fdf12c1c6a64b09f0682bb40cf13283347b09e50` |
| `src/lib/fundiario/calculadoraDesenho.ts` | Sim | 17.129 | `c3df5f02e7287e03179e738bd5fd4ac034a90f73aa2e409553552d9ee5dbefb5` |
| `src/lib/fundiario/calculadoraDesenho.test.ts` | Sim | 4.228 | `c48d79ebf04445e7b6da159f56413376ca73d10c2a6ce800618afeee96b2e8dc` |
| `scripts/reduzir_terreno_copernicus.py` | Sim | 24.349 | `18ef1d978d4a861725ab6cfcf6bac55b9e88eb14e74a4b5ac6dc09458c9a7c1f` |
| `scripts/remedir_candidatos_bp3_d16.ts` | Sim | 31.776 | `7ad4371cbec2bc570cc33220ff01e251b12b36b4945ac2d3af9b710ce6afb1fe` |
| `docs/verificacoes/voo_ncontrol/LEIA-ME_NAO_VOAR.md` | Sim | 3.247 | `cb350d6cf639fca9f9a6fc9a041c289e8e408147d488af80ff045ac84a9f496e` |
| `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_jornada_01_terrainfollow.plan` | Sim | 127.750 | `791e49af00d8ed06ff5a42175effe6179414d7636c28f5aabbeca96ac912f779` |
| `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_jornada_01_altfixa.plan` | Sim | 127.756 | `81e8536a5c1a65fe2de1b299fcdd37abc7034a436ad87fdc8bbafb47e7c875b8` |
| `docs/verificacoes/voo_ncontrol/relatorio_aceitacao_y1_y6_2026-09-29.json` | Sim | 2.231 | `c6c5ba0cd6c2b13e21532e23626297ad4717765eed6e470ee645490bbb3cf77d` |
| `src/lib/gee/sorteioPoligonos.ts` | Sim | 31.572 | `4006bd628c1d78dc6da6b15448e3099e145e62ec515540b32ee2514ef71d7c5f` |
| `src/app/api/gee/sorteio-d16/route.ts` | Sim | 6.227 | `52b1799064b85b1cd108bb54e00a08974c2d702ae6dd1f0c439cd41186d591e2` |
| `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_roteiro_jornadas_72poligonos.csv` | Sim | 16.392 | `d6913fd6fa8b8c2eb92a8ed6360c7e7ba981f191ac0da80c630f7ba706dcefb6` |
| `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_tabela_autorizacao_proprietarios_72poligonos.csv` | Sim | 10.179 | `e1e70d931f244c8b453caeaceaf5ecc8c4fdf0b0ce3b5f8353d6b8754cecbbed` |
| `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_manifesto_interprete_cego_72poligonos.csv` | Sim | 8.771 | `fd61a60717eaa9081e96fb8d9cd81365364990290880010f1e08414d567fec46` |
| `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_roteiro_jornadas_72poligonos.pdf` | Sim | 16.465 | `f81d99f836f26f164057e6164dce0f79dc63538169370d7688b7eddc3c41d3ff` |
| `docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json` | Sim | 2.411 | `c456b095ab746e8fcc935a45a77331c9fd0dfa72ec2bb8fe7d6cac5e0b91dbf8` |
| `docs/verificacoes/2026-09-30_remedicao_candidatos_bp3_d16.md` | Sim | 3.389 | `06de7d30a798a9ab7d2735222ea17a7b2985c43aebef4a40471f3c6b17d39ee3` |
| `docs/verificacoes/cache_pedologia_bp3.json` | Sim | 96.740 | `1f03c945a3b40436f24b17f33d23866e1e78f5a4ba6a0f27a04a80eb5e8f8d66` |
| `docs/verificacoes/calculadora/2026-09-30_simulacao_desenho_d16_224m.md` | Sim | 2.027 | `533e67a8f88abea3f62655a9e40376cb01ed1da7f84923ec7fab1f063e5485ee` |
| `src/lib/seguranca/credenciaisSeguras.ts` | Sim | 5.644 | `c23b000ab9f6aac8c3ff1589055db15490bd244c6a19bcaad6de9c769d977cfa` |
| `src/lib/seguranca/credenciaisSeguras.test.ts` | Sim | 4.955 | `9be518f3002c6908d9e958dc117fd4d5724e53c5771e0d962042d743c5d3e190` |
| `src/lib/seguranca/diarioRequisicoes.ts` | Sim | 9.670 | `f5c9fe2bd87b4bdaa850d19d919e0622867817c998a0beac33037415ef3ab754` |
| `src/lib/seguranca/diarioRequisicoes.test.ts` | Sim | 6.311 | `5f8e4fb0203b1e6264d7fe13d7245525388a19e85c037140ba1761a649c23212` |
| `src/lib/seguranca/detectorSequencia.ts` | Sim | 7.936 | `253a7853825ff302283d829694d6c174ef17b99522e3003844dbc2bc22d0afd5` |
| `src/lib/seguranca/detectorSequencia.test.ts` | Sim | 3.684 | `7c17e5a21133010d2d64a8e23e5cdd3995539901856a6fb3eeae6131e7a26b43` |
| `src/lib/gee/amostragemSoloNuLote.ts` | Sim | 22.070 | `00491abfa76f1d5139a985f207343f4ed981cc73b34fe134c6b28b69de806b9f` |
| `src/lib/gee/amostragemSoloNuLote.test.ts` | Sim | 12.423 | `e48a2a1fb6a3edfb2246c5dae514835c7fe4df1ecbcfa780b91a8c1ce8aea6b8` |
| `src/components/config/ApiTokensManager.tsx` | Sim | 20.012 | `e1d5b7b53b2f175fc98db1136eec24e9832c57a22c49ce1b6aa97ebd29355870` |
| `src/components/map/MapViewer.tsx` | Sim | 22.393 | `9e6797f15170d798064ad706fb6580be3fa942b30d7a0537188cb18d0332b43b` |
| `data/dem_cache/Copernicus_DSM_COG_10_S25_00_W054_00_DEM.tif` | Sim | 41.986.866 | `bbc2fda763ca444d53b32090787b50cd9500bd6f328f54c9ef049d8f8eb9f231` |
| `data/dem_cache/Copernicus_DSM_COG_10_S25_00_W055_00_DEM.tif` | Sim | 39.996.560 | `2076dda84be86eb264ef6115332b472b2fad2558f12b76878dc9f9342a616d16` |
| `data/dem_cache/Copernicus_DSM_COG_10_S26_00_W054_00_DEM.tif` | Sim | 43.766.657 | `463002fe797eb327d011ed563e216de09c4827402d3ea58aa070366aa5382251` |
| `data/dem_cache/Copernicus_DSM_COG_10_S26_00_W055_00_DEM.tif` | Sim | 41.136.564 | `220474710e884aa26b4777b642b4e2e005cbab5f714b30f83252e9ea6e099bce` |
| `docs/verificacoes/fontes/renard1997/ah_703.pdf` | Sim | 22.401.914 | `cd19868766e04132e9d764eacd92aa09cdc1d1abe1567b677734f5940d3018a1` |
| `docs/verificacoes/fontes/renard1997/executar_ocr_renard_1997.py` | Sim | 5.661 | `2aa58e663afd8818c9e9f091fed98de14035989ab9782a1e4f4b25fa10bfc5b3` |
| `docs/verificacoes/fontes/renard1997/saida_ocr_renard_1997.txt` | Sim | 9.687 | `3a1212869f3e9105f3459ce3804a3c90b01736090380556b462828057d56ad17` |
| `docs/verificacoes/fontes/renard1997/saida_extracao_renard_1997.txt` | Sim | 2.872 | `d2c411852239aa4b9d17646e8c8d882d6c95d8fb387635b20883d33acba31580` |
| `docs/verificacoes/fontes/waltrick2015/waltrick_2015.pdf` | Sim | 1.043.486 | `fcb8e330d9900d4e753ae0df368f47eef35d92b1b366c5c82ecca3d4eebabee3` |
| `docs/verificacoes/fontes/waltrick2015/saida_extracao_waltrick_2015.txt` | Sim | 48.533 | `f4f79067eb17c227c6a2bed6fa3d766e9cd2e0b8e87a3a70f4675b484ed7b4b4` |
| `docs/verificacoes/fontes/nepar2011/nepar_boletim_01_2011.pdf` | Sim | 2.099.806 | `c7391c1a9007d4d08eda1238a36347e8b89b437c7d8a078457ce939eeb2a3e20` |
| `docs/verificacoes/fontes/nepar2011/saida_extracao_nepar_2011.txt` | Sim | 49.055 | `eb04e5affb0e8beca7505df4e5eaac6b4c2b591a3d8c305a72e8bdb61d68543a` |
| `docs/verificacoes/climatologia_chirps_bp3.json` | Sim | 4.073 | `be8d8b8a419cdfc7a189b007307228e75a79ae16ba8ec0341a0e8a3d08998c7d` |
| `docs/verificacoes/diario_climatologia_chirps_bp3.json` | Sim | 5.569 | `251051db242037700b657bff53354bcf5a07cc0a613b206ba06085831fe5c0e1` |
| `scripts/baixar_chirps_climatologia.py` | Sim | 8.416 | `41adeba1529915899b6719277f3dff994d29d0b8133f351ff1ff5ab1157cf3aa` |
| `src/components/inspetor/InspetorPonto.tsx` | Sim | 38.244 | `701993f9c193df898c96c439eaa6aace5b47dfd24627bcf8d5a726776173e24e` |
| `src/components/inspetor/InspetorPonto.test.ts` | Sim | 8.435 | `6226bbd3bb05115d5fc5db2927c4968feb9ed16cc0590558b03be30fc91d225f` |
| `src/lib/rotulos/ingestaoColetor.ts` | Sim | 9.778 | `261ad57b29961e4ed26dab524d84b76f7fd2a0ff6d107c7fd098d26e45389dd1` |
| `src/lib/rotulos/ingestaoColetor.test.ts` | Sim | 3.908 | `1c64b97570488504d130507e25de9d272a86efc3e053a9da6aad8d2a4e3eb867` |
| `src/components/decisoes/PainelCriterioRefutacaoD25.tsx` | Sim | 18.741 | `408287e2467fc7411f5f1846e3ce4a2c4028af6cb774c18b66aeaa736c1165ba` |
| `src/components/decisoes/PainelCriterioRefutacaoD25.test.ts` | Sim | 1.508 | `abed98f6eb74ff4b8b73672d59ed39d7f543fa8569508b189b30dc810db9aed5` |
| `src/config/areaInteresse.ts` | Sim | 2.445 | `c2979f8ee6c138fc7b9883efc963a398d507891d7639a1bf4cb88536a6e7eaac` |
| `src/config/areaInteresse.test.ts` | Sim | 642 | `ab32b6aefce47eade977b4ac06d405b3b987df561bf61b5a6c3a2d3abbdd1c7c` |
| `src/components/campanha/PainelCampanha.tsx` | Sim | 40.232 | `f374f3f60508a7be561570c0332a5dbbb049658a0cccb0a69f39b7069dbc5e22` |
| `src/components/campanha/PainelCampanhaModal.tsx` | Sim | 2.360 | `c50b1294e6f785ab200a09bb6be9e43cc1cc436ae75c7413ddb0687c8e855a86` |
| `src/components/decisoes/DecisoesModal.tsx` | Sim | 6.946 | `afe70307af6222216e9954fc34ad863b6373ac2cbb25127b04e3148f34312694` |
| `src/components/decisoes/PainelSorteioD16.tsx` | Sim | 13.862 | `ea1fb48f7614d963dc45a5efcc39b708dcfc9fb6596fb07c6844e71342fb4f07` |
| `src/components/region/RegionRequestModal.tsx` | Sim | 40.223 | `5e933b29e82e23e036b137b265ba74feeef8758a1f7e4480d441ddde09e99a41` |
| `src/components/sidebar/FiltersPanel.tsx` | Sim | 7.128 | `7b5dd09512a2fbb7971961a0dfb35fafbba769e2f18658dd6c9c6d76d660b56a` |

### 3. Extração Direta dos Artefatos de Voo

#### 3.1 Roteiro do Piloto (`docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_roteiro_jornadas_72poligonos.csv`)
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

#### 3.2 Manifesto Cego do Intérprete (`docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_manifesto_interprete_cego_72poligonos.csv`)
- **Total de linhas de registros cegos**: 72 (esperado: 72)
- **Cabeçalho autêntico no arquivo:**
```csv
codigoOpacoInterprete,cameraName,gsdAlvoCm,aglNominalMetros,areaPoligonoHa,formatoEntregaOrtomosaico,protocoloDelineacao,dataColetaCampo
```
- **Amostra real das duas primeiras linhas (com código opaco mascarado para proteção pericial):**
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
| Total de Polígonos | `72` | `SINTETICO_NAO_VOAR_roteiro_jornadas_72poligonos.csv` (72 registros) |
| Total de Jornadas | `12` | `relatorio_aceitacao_y1_y6_2026-09-29.json` -> `metadadosCampanha.totalJornadas` |
| Polígonos por Jornada | `6` | `relatorio_aceitacao_y1_y6_2026-09-29.json` -> `metadadosCampanha.maxPoligonosPorJornada` |
| Tiles DEM Utilizados | `S25_W054, S25_W055, S26_W054, S26_W055` | `relatorio_aceitacao_y1_y6_2026-09-29.json` -> `metadadosCampanha.tilesDEMUtilizados` |
| Relação Curva de Nível | `anguloFaixas = (aspecto + 90°) % 360` | `SINTETICO_NAO_VOAR_roteiro_jornadas_72poligonos.csv` -> colunas `aspectoMedidoGraus`, `orientacaoPoligonoGraus`, `anguloFaixasGraus` |

---

## Leitura e juízo

### 1. Diretriz K1 — Origem dos Códigos Opacos no Selo de Sorteio e Determinismo Estrito
- **Migração do Nascimento do Código Opaco:**
  - O código opaco `VANT-BLIND-*` deixou de ser gerado de forma estocástica e efêmera na exportação dos planos de voo. Ele passa a nascer compulsoriamente no sorteio formal (`src/lib/gee/sorteioPoligonos.ts`), com entropia criptográfica segura (`crypto.randomBytes(5)`), sendo registrado no próprio selo de auditoria (`SeloSorteioD16`) sob o campo `tabelaCorrespondenciaOpaca: Record<string, string>` e no atributo `codigoOpacoVant` de cada polígono sorteado.
  - A versão do esquema do selo foi formalmente elevada para `"1.2.0"`.
- **Determinismo Pericial na Exportação:**
  - Em `src/lib/drone/planoVooNControl.ts`, a exportação passa a **ler** o código opaco exclusivamente a partir do selo fornecido (`seloSorteioD16?.tabelaCorrespondenciaOpaca` ou `tabelaCorrespondenciaOpaca` ou `item.codigoOpacoVant`).
  - Duas exportações consecutivas a partir do mesmo selo produzem manifestos rigorosamente idênticos byte a byte, garantindo que o intérprete cego receba o mesmo identificador estável em qualquer momento do ciclo de vida da pesquisa.
  - Evidência por teste automatizado aprovado em `src/lib/drone/planoVooNControl.test.ts` (`K1: código opaco nasce no selo de sorteio e é determinístico em sucessivas exportações sobre o mesmo selo, recusando exportação sem selo`).

### 2. Diretriz K1 — Comportamento da Exportação na Ausência de Selo de Sorteio
- **Recusa Tipada e Falha Cedo (P12):**
  - Quando a exportação de campanha for invocada sem um selo de sorteio auditado ou sem correspondência opaca registrada para qualquer polígono da lista, o sistema **recusa compulsoriamente a operação** disparando a exceção `ErroManifestoSemSeloSorteio`.
  - Mensagem pericial: `[CEGAMENTO_SELO_RECUSADO] Exportação do manifesto cego do intérprete recusada: selo de sorteio D16 ausente ou código opaco não registrado para o polígono '...'. É expressamente proibido inventar códigos opacos na exportação para polígonos sem correspondência no selo (K1).`
  - Nenhum plano de voo, roteiro, tabela de autorização ou manifesto é emitido pela metade. É terminantemente proibido inventar códigos opacos efêmeros na exportação.

### 3. Diretriz K2 — Blindagem do Selo no Git e Guarda Ativa em Código
- **Exclusão do Selo no Controle de Versão:**
  - O diretório `docs/verificacoes/sorteio/` foi formalmente inserido no `.gitignore`. A exclusão foi verificada e atestada com sucesso via comando `git check-ignore -v docs/verificacoes/sorteio/selo_sorteio_d16_exemplo.json`.
  - Essa segregação garante que a chave reversa de decodificação (`D16_E_* ↔ VANT-BLIND-*`) nunca seja comitada no repositório público ou privado, preservando o cegamento absoluto do intérprete humano (Z5).
- **Guarda Compulsória em Tempo de Execução:**
  - Implementada a função pericial `asseverarCaminhoSeloIgnoradoGit(caminhoSeloAbsoluto)` em `src/lib/gee/sorteioPoligonos.ts`, acionada na API `src/app/api/gee/sorteio-d16/route.ts` antes de criar pastas ou gravar qualquer arquivo de selo no disco.
  - A guarda invoca `git check-ignore` de forma síncrona. Se o caminho não estiver coberto pelo `.gitignore`, a gravação é imediatamente abortada com `ErroSeloNaoIgnoradoGit`, impedindo a criação do arquivo antes que ocorra risco de vazamento acidental.

### 4. Diretriz K3 — Marca de Sintético em Todos os Artefatos Irmãos da Campanha
- **Nomes Finais dos Artefatos de Demonstração:**
  - Os quatro artefatos gerados a partir de polígonos sintéticos foram padronizados com o prefixo inequívoco `SINTETICO_NAO_VOAR_`:
    1. `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_roteiro_jornadas_72poligonos.csv`
    2. `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_roteiro_jornadas_72poligonos.pdf`
    3. `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_tabela_autorizacao_proprietarios_72poligonos.csv`
    4. `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_manifesto_interprete_cego_72poligonos.csv`
  - A renomeação foi executada no Git via `git mv`, preservando o histórico de auditoria.
- **Marcação no Conteúdo Interno:**
  - **Nos arquivos CSV:** A primeira linha contém compulsoriamente o comentário pericial:
    `# SINTETICO_NAO_VOAR - DADOS DE DEMONSTRACAO (NAO OPERAR EM CAMPO)`
    Isso impede que uma cópia do conteúdo desprovida do nome de arquivo original seja acidentalmente utilizada em campo para contato com proprietários rurais do CAR.
  - **No arquivo PDF:** O topo da primeira página estampa a faixa destacada:
    `*** SINTETICO_NAO_VOAR - DADOS DE DEMONSTRACAO (NAO OPERAR EM CAMPO) ***`
- **Generalização da Guarda Z3:**
  - A guarda de segurança de Z3 em `exportarCampanhaVooNControl` foi expandida: se a origem for sintética e a opção explícita `permitirPlanoSinteticoDemonstracao: true` não for informada, **toda a exportação é abortada** com `ErroEmissaoPlanoSinteticoRecusada`, impedindo a geração de qualquer um dos quatro artefatos irmãos.

### 5. Auditoria de Cegamento Estendida em Arquivos Versionados
- **Varredura Completa com `git ls-files`:**
  - O teste `src/lib/seguranca/cegamentoArtefatos.test.ts` foi estendido com a suíte `"Auditoria Estrita de Cegamento em Arquivos Versionados (K2)"`.
  - O teste executa `git ls-files`, lê cada arquivo sob controle de versão e verifica a ocorrência simultânea de códigos opacos `VANT-BLIND-*` e identificadores de polígono `D16_E_*` / `D16_S*`.
  - **Resultado da Varredura:** 100% aprovado. Nenhum arquivo versionado contém o par de correspondência.
- **Saneamento Preventivo dos Relatórios de Fase:**
  - As amostras do manifesto cego exibidas nos relatórios periciais de fase (`2026-09-30`, `2026-10-01` e `2026-10-02`) tiveram os códigos literais substituídos por `VANT-BLIND-***[OMITIDO_CEGAMENTO]***`, eliminando qualquer possibilidade de correspondência visual entre os artefatos de documentação e as tabelas de campo.

---
**Identificação do Agente-Executor:** Antigravity (Google DeepMind)  
**Autor do Repositório:** Luís Alfredo Ferreira da Silva (RedZardoz)
