FONTE_DOS_DADOS	.git/HEAD	src/config/decisoes.ts	vitest.config.mts	vitest.vivo.config.mts	docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json	scripts/d25/config_pre_registro_PROPOSTA.json	src/lib/matriz/perfis.ts	docs/verificacoes

# Painel de Estado Atual do Projeto — SAREL

## 1. Controle de Versão (Git)
- Commit HEAD: `193da3b35929d80fa700db671915308fcf7799d9`
- Data do HEAD: 2026-11-10 02:52:01 +0000
- Últimos 5 commits:
  1. `193da3b docs(planejamento): adicionar prompt F com quatro correcoes do E-linha e a calibracao de E-hat`
  2. `76db730 feat(D16): persistir universo de candidatos e provar reprodutibilidade do funil`
  3. `bbee1e9 docs(planejamento): avisar que o E-linha roda sem credencial do GEE`
  4. `512978d docs(planejamento): substituir prompt E por E-linha, restrito ao universo de candidatos`
  5. `ddaeb7e docs(planejamento): adicionar prompt E da guarda D11.2 e do universo de candidatos`

## 2. Testes Automatizados
- Arquivos de teste versionados no repositório: 123
  - TypeScript herméticos (`src/**/*.test.ts`): 107
  - TypeScript vivos (`src/**/*.vivo.test.ts`): 2
  - Python (`test_*.py` em `scripts/` e `docs/`): 14
- Arquivos de teste executados na suíte padrão hermética (`npm run test`): 107
- Diferença explicada pelas configurações do Vitest:
  - `vitest.config.mts`: seleciona exclusivamente `src/**/*.test.ts` (107 arquivos) e exclui `src/**/*.vivo.test.ts`.
  - `vitest.vivo.config.mts`: seleciona exclusivamente os 2 testes vivos (`src/**/*.vivo.test.ts`), executados via `npm run test:vivo` por dependerem de infraestrutura pesada local fora do Git (`data/fundiario_brasil.db` e DEM Copernicus GLO-30 em `data/dem_cache/`).
  - Testes em Python (14 arquivos): executados no ambiente Python (`pytest` / runners em `scripts/`), desacoplados da suíte Vitest.

## 3. Decisões Metodológicas (`src/config/decisoes.ts`)
- Maior ID existente: `D26`
- Total de decisões registradas: 26
- Decisões agrupadas por estado:
  - Decididas (26): D01, D02, D03, D04, D05, D06, D07, D08, D09, D10, D11, D12, D13, D14, D15, D16, D17, D18, D19, D20, D21, D22, D23, D24, D25, D26
  - Propostas (0): (nenhuma)
  - Pendentes (0): (nenhuma)

## 4. Parâmetros Operacionais (`PARAMETROS`)
- Maior ID existente: `P24`
- Total de parâmetros registrados: 16
- Parâmetros agrupados por estado:
  - Decididos (4): P02, P03, P05, P07
  - Propostos (11): P01, P04, P08, P09, P10, P11, P20, P21, P22, P23, P24
  - Pendentes (1): P06

## 5. Sorteio D16 e Funil de Candidatos (`docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json`)
- `statusSorteio`: BLOQUEADO — Dimensão Ê não foi medida; as 9 células de K̂=2 e os 18 estratos tridimensionais não podem ser povoados sem observações reais de satélite (P12)
- `funilContagem`:
  | Etapa do Funil | Contagem Medida |
  |---|---|
  | imoveisEnvelopeBP3 | 8651 |
  | imoveisDivisorBP3ForaUC | 4679 |
  | candidatosPosThinning | 687 |
  | candidatosComTerrenoD07 | 680 |
  | candidatosRealocadosParteElegivelX3 | 139 |
  | candidatosValidosPedologia | 677 |
  | candidatosComSoloNuMedido | 0 |

## 6. Preditores Pré-Registrados vs Perfis de Matriz
- Configuração de pré-registro: `scripts/d25/config_pre_registro_PROPOSTA.json`
- Definição de perfis: `src/lib/matriz/perfis.ts`

| Bloco | Preditor Declarado | Coluna em `matriz-treino` | Coluna em `matriz-heldout` | Coluna em `planilha` |
|---|---|:---:|:---:|:---:|
| espectro | `Frequencia_Solo_Nu` | SIM | SIM | SIM |
| espectro | `Composto_Solo_Nu_B12` | SIM | SIM | NÃO |
| espectro | `Composto_Solo_Nu_Razao_B4_B2` | SIM | SIM | NÃO |
| espectro | `Taxa_Degradacao_SWIR_Anual` | SIM | SIM | NÃO |
| espectro | `NDVI_Maximo_Mediano` | NÃO | NÃO | NÃO |
| terreno | `Declividade_pct` | SIM | SIM | SIM |
| terreno | `Curvatura_Perfil` | SIM | SIM | SIM |
| terreno | `TWI` | SIM | SIM | SIM |
| solo | `RUSLE_Fator_K` | SIM | SIM | SIM |
| chuva | `RUSLE_Fator_R` | SIM | SIM | SIM |

## 7. Arquivos de Evidência em `docs/verificacoes/`
- Total de arquivos de evidência medidos: 145

| Arquivo de Evidência | Data no Nome | Tamanho (bytes) |
|---|:---:|---:|
| `2026-09-10_distorcao_projecao_declividade.md` | 2026-09-10 | 4093 |
| `2026-09-10_embrapa_capabilities.xml` | 2026-09-10 | 7414096 |
| `2026-09-10_embrapa_erodibilidade_classes.json` | 2026-09-10 | 2267 |
| `2026-09-10_embrapa_featureinfo_noroeste.json` | 2026-09-10 | 1058070 |
| `2026-09-10_embrapa_featureinfo_oceano.json` | 2026-09-10 | 137 |
| `2026-09-10_embrapa_featureinfo_oeste.json` | 2026-09-10 | 1963755 |
| `2026-09-10_ibge_municipio_exemplo.json` | 2026-09-10 | 559 |
| `2026-09-26_alvo_supervisionado_circular_script_treino.md` | 2026-09-26 | 21615 |
| `2026-09-26_fabricacao_alvo_supervisionado_arquivo01.md` | 2026-09-26 | 8301 |
| `2026-09-26_fabricacao_fatores_rusle_pacote_reprodutibilidade.md` | 2026-09-26 | 10401 |
| `2026-09-26_fase0_bloqueios_bandas_fatorc_proveniencia.md` | 2026-09-26 | 9187 |
| `2026-09-29_gargalo_estratos_k2_dominio_d07.md` | 2026-09-29 | 5672 |
| `2026-09-29_universo_de_candidatos_e_cadeia_de_reducoes.md` | 2026-09-29 | 4542 |
| `2026-09-30_relatorio_fase_gerado.md` | 2026-09-30 | 21811 |
| `2026-09-30_remedicao_candidatos_bp3_d16.md` | 2026-09-30 | 3389 |
| `2026-09-30_verificacao_Z1_Z6_planos_de_voo.md` | 2026-09-30 | 5119 |
| `2026-10-01_FABRICACAO_frequencia_solo_nu.md` | 2026-10-01 | 4594 |
| `2026-10-01_relatorio_fase_gerado.md` | 2026-10-01 | 27528 |
| `2026-10-01_verificacao_pipeline_X0_X5.md` | 2026-10-01 | 3714 |
| `2026-10-02_relatorio_fase_gerado.md` | 2026-10-02 | 42431 |
| `2026-10-02_verificacao_fatores_R_e_LS.md` | 2026-10-02 | 4767 |
| `2026-10-20_ciclo_cota_planet.md` | 2026-10-20 | 5111 |
| `2026-10-20_quantil_tipo7_hyndman_fan.md` | 2026-10-20 | 5536 |
| `2026-10-31_ocupacao_estratos_d16.md` | 2026-10-31 | 9639 |
| `2026-10-31_suficiencia_temporal_zhu_ccdc.md` | 2026-10-31 | 5242 |
| `2026-11-02_especificacao_competidor_rusle.md` | 2026-11-02 | 5827 |
| `2026-11-02_impedimento_lastro_G01.md` | 2026-11-02 | 4026 |
| `2026-11-02_lastro_d11_2_se_0144.md` | 2026-11-02 | 2431 |
| `2026-11-03_poder_d25_preliminar.txt` | 2026-11-03 | 2474 |
| `2026-11-03_poder_d25.txt` | 2026-11-03 | 4492 |
| `2026-11-09_lastro_d02_d10_e_mascara_geos3.md` | 2026-11-09 | 8444 |
| `2026-11-09b_adocao_mascara_geos3_2018.md` | 2026-11-09 | 8652 |
| `2026-11-09d_calibracao_30_pontos_solo_nu.md` | 2026-11-09 | 10582 |
| `2026-11-10_universo_candidatos_e_reprodutibilidade.md` | 2026-11-10 | 8963 |
| `cache_pedologia_bp3.json` | sem data no nome | 96740 |
| `calculadora/2026-09-30_simulacao_desenho_d16_224m.md` | 2026-09-30 | 2027 |
| `climatologia_chirps_bp3.json` | sem data no nome | 16112 |
| `diario_climatologia_chirps_bp3.json` | sem data no nome | 231414 |
| `execucao/2026-11-09/git_log.txt` | sem data no nome | 236 |
| `execucao/2026-11-09/git_status.txt` | sem data no nome | 1003 |
| `execucao/2026-11-09/grep_b11.txt` | sem data no nome | 3819 |
| `execucao/2026-11-09/grep_ndvi_025_scripts.txt` | sem data no nome | 1988 |
| `execucao/2026-11-09/grep_rigoros_inicial.txt` | sem data no nome | 35978 |
| `execucao/2026-11-09/grep_rigoros.txt` | sem data no nome | 35716 |
| `execucao/2026-11-09/grep_selecao_bibliografica.txt` | sem data no nome | 72880 |
| `execucao/2026-11-09/ls_selecao_bibliografica.txt` | sem data no nome | 228 |
| `execucao/2026-11-09/npm_test.txt` | sem data no nome | 12595 |
| `execucao/2026-11-09d/git_log.txt` | sem data no nome | 400 |
| `execucao/2026-11-09d/git_status.txt` | sem data no nome | 736 |
| `execucao/2026-11-09d/inspecao_candidatos_json.txt` | sem data no nome | 3738 |
| `execucao/2026-11-09d/npm_test.txt` | sem data no nome | 19999 |
| `execucao/2026-11-09d/recusa_sem_credencial.txt` | sem data no nome | 1295 |
| `execucao/2026-11-09d/rodada_30_pontos.txt` | sem data no nome | 1295 |
| `execucao/2026-11-09d/sorteio_30_pontos.txt` | sem data no nome | 2544 |
| `execucao/2026-11-10/credencial_ausente_confirmada.txt` | sem data no nome | 47 |
| `execucao/2026-11-10/estado_verificar.txt` | sem data no nome | 67 |
| `execucao/2026-11-10/git_log.txt` | sem data no nome | 263 |
| `execucao/2026-11-10/git_status.txt` | sem data no nome | 723 |
| `execucao/2026-11-10/npm_test.txt` | sem data no nome | 19532 |
| `execucao/2026-11-10/rodada_remedicao_pipeline.txt` | sem data no nome | 4219 |
| `execucao/2026-11-10/tsc_noemit.txt` | sem data no nome | 69 |
| `fontes/cochran1977/cochran_1977_sampling_techniques_ch5a12.md` | sem data no nome | 7016 |
| `fontes/dematte2018/conferencia_dematte_2018.md` | sem data no nome | 6725 |
| `fontes/dematte2018/extrair_dematte_2018.py` | sem data no nome | 2091 |
| `fontes/dematte2018/saida_extracao_dematte_2018.txt` | sem data no nome | 64034 |
| `fontes/desmet1996/desmet_govers_1996_jswc.pdf` | sem data no nome | 930133 |
| `fontes/desmet1996/extrair_desmet_1996.py` | sem data no nome | 4173 |
| `fontes/desmet1996/saida_extracao_desmet_1996.txt` | sem data no nome | 2614 |
| `fontes/doc246/extrair_cnps_doc_246_2024.py` | sem data no nome | 2515 |
| `fontes/doc246/saida_extracao_cnps_doc_246_2024.txt` | sem data no nome | 59283 |
| `fontes/hyndman1996/hyndman_fan_1996_american_statistician.pdf` | sem data no nome | 405765 |
| `fontes/nepar2011/extrair_nepar_2011.py` | sem data no nome | 3145 |
| `fontes/nepar2011/nepar_boletim_01_2011.pdf` | sem data no nome | 2099806 |
| `fontes/nepar2011/saida_extracao_nepar_2011.txt` | sem data no nome | 48197 |
| `fontes/renard1997/ah_703.pdf` | sem data no nome | 22401914 |
| `fontes/renard1997/executar_ocr_renard_1997.py` | sem data no nome | 5661 |
| `fontes/renard1997/extrair_renard_1997.py` | sem data no nome | 6522 |
| `fontes/renard1997/saida_extracao_renard_1997.txt` | sem data no nome | 2872 |
| `fontes/renard1997/saida_ocr_renard_1997.txt` | sem data no nome | 9539 |
| `fontes/rikimaru2002/conferencia_rikimaru_2002.md` | sem data no nome | 5232 |
| `fontes/rikimaru2002/extrair_rikimaru_2002.py` | sem data no nome | 2069 |
| `fontes/rikimaru2002/saida_extracao_rikimaru_2002.txt` | sem data no nome | 19513 |
| `fontes/rufino1993/rufino_biscaia_merten_1993_rbcs.pdf` | sem data no nome | 2130995 |
| `fontes/safanelli2021/conferencia_safanelli_2021.md` | sem data no nome | 6195 |
| `fontes/safanelli2021/extrair_safanelli_2021.py` | sem data no nome | 2119 |
| `fontes/safanelli2021/safanelli_2021_rbcs.pdf` | sem data no nome | 2945488 |
| `fontes/safanelli2021/saida_extracao_safanelli_2021.txt` | sem data no nome | 68303 |
| `fontes/schmidt2019/extrair_schmidt_2019.py` | sem data no nome | 2919 |
| `fontes/schmidt2019/saida_extracao_schmidt_2019.txt` | sem data no nome | 30208 |
| `fontes/schmidt2019/schmidt_2019_methodsx.pdf` | sem data no nome | 4339190 |
| `fontes/tondati2026/tondati_2026.pdf` | sem data no nome | 802089 |
| `fontes/waltrick2010/waltrick_2010.pdf` | sem data no nome | 15077981 |
| `fontes/waltrick2015/extrair_waltrick_2015.py` | sem data no nome | 2700 |
| `fontes/waltrick2015/saida_extracao_waltrick_2015.txt` | sem data no nome | 47557 |
| `fontes/waltrick2015/waltrick_2015.pdf` | sem data no nome | 1043486 |
| `fontes/wfs_erodibilidade/amostra_dirigida_associacoes_2026-09-28.json` | 2026-09-28 | 25962 |
| `fontes/wfs_erodibilidade/amostra_dirigida_associacoes_2026-09-28.md` | 2026-09-28 | 5390 |
| `fontes/wfs_erodibilidade/amostra_dirigida_associacoes.py` | sem data no nome | 10200 |
| `fontes/wfs_erodibilidade/conferir_eixos_wfs_110_ao_vivo.py` | sem data no nome | 3441 |
| `fontes/wfs_erodibilidade/consultar_wfs_erodibilidade_2024.py` | sem data no nome | 13373 |
| `fontes/wfs_erodibilidade/describe_feature_type_bra_erodibilidade_2024.xml` | sem data no nome | 2902 |
| `fontes/wfs_erodibilidade/getfeature_pip_3camadas_r13_bp3.json` | sem data no nome | 3001 |
| `fontes/wfs_erodibilidade/getfeatureinfo_3camadas_r13_fronteira_bp3.json` | sem data no nome | 3800 |
| `fontes/wfs_erodibilidade/getfeatureinfo_3camadas_rural_associacao_bp3.json` | sem data no nome | 5950930 |
| `fontes/wfs_erodibilidade/getfeatureinfo_3camadas_rural_simples_bp3.json` | sem data no nome | 10093900 |
| `fontes/wfs_erodibilidade/medicao_w2_candidatos_bp3_2026-09-28.json` | 2026-09-28 | 99257 |
| `fontes/wfs_erodibilidade/medicao_w2_candidatos_bp3_2026-09-28.md` | 2026-09-28 | 5344 |
| `fontes/wfs_erodibilidade/medir_w2_candidatos_bp3_2026-09-28.ts` | 2026-09-28 | 26659 |
| `fontes/wfs_erodibilidade/reconhecimento_2026-09-28.md` | 2026-09-28 | 12583 |
| `fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_2026-09-28.json` | 2026-09-28 | 23126 |
| `fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_2026-09-28.txt` | 2026-09-28 | 6751 |
| `fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_u1_2026-09-28.json` | 2026-09-28 | 63759 |
| `fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_u1_2026-09-28.txt` | 2026-09-28 | 7895 |
| `fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_v1_pip_2026-09-28.json` | 2026-09-28 | 83842 |
| `fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_v1_pip_2026-09-28.txt` | 2026-09-28 | 10320 |
| `fontes/wfs_erodibilidade/remedir_correspondencia_pos_u1_2026-09-28.py` | 2026-09-28 | 18448 |
| `fontes/wfs_erodibilidade/remedir_correspondencia_pos_v1_pip_2026-09-28.py` | 2026-09-28 | 22779 |
| `fontes/zhu2013/extrair_zhu_2013.py` | sem data no nome | 3701 |
| `fontes/zhu2013/saida_extracao_zhu_2013.txt` | sem data no nome | 4976 |
| `fontes/zhu2013/zhu_2013_tese_ccdc.pdf` | sem data no nome | 5623376 |
| `legado_climatologia_chirps_bp3_2022.json` | sem data no nome | 4103 |
| `planet/2026-10-20_planet_my_plan_insights.png` | 2026-10-20 | 107436 |
| `pluviometria_iat_estacoes.csv` | sem data no nome | 8214 |
| `pluviometria_iat_mensal.csv` | sem data no nome | 961049 |
| `projecao/calcula_distorcao_20_segmentos_bp3_2026-09-28.py` | 2026-09-28 | 4326 |
| `projecao/distorcao_epsg31982_2026-09-28.txt` | 2026-09-28 | 2467 |
| `projecao/distorcao_tabela_recalculada_2026-09-28.txt` | 2026-09-28 | 3291 |
| `projecao/saida_distorcao_20_segmentos_bp3_2026-09-28.txt` | 2026-09-28 | 2920 |
| `projecao/verifica_distorcao_epsg31982.py` | sem data no nome | 3415 |
| `projecao/verifica_tabela_recalculada_2026-09-28.py` | 2026-09-28 | 3195 |
| `r_rufino_pluviometro_vs_waltrick.csv` | sem data no nome | 4414 |
| `remedicao_candidatos_bp3_d16_2026-09-30.json` | 2026-09-30 | 2411 |
| `universo_candidatos_bp3_d16_2026-11-10.json` | 2026-11-10 | 1837396 |
| `verificacao_custo_e_ruido_poder_d25_2026-11-03.md` | 2026-11-03 | 7762 |
| `verificacao_grade_completa_poder_2026-11-04.md` | 2026-11-04 | 15799 |
| `verificacao_monotonicidade_poder_2026-11-03.md` | 2026-11-03 | 7637 |
| `voo_ncontrol/LEIA-ME_NAO_VOAR.md` | sem data no nome | 3302 |
| `voo_ncontrol/relatorio_aceitacao_y1_y6_2026-09-29.json` | 2026-09-29 | 2231 |
| `voo_ncontrol/SINTETICO_NAO_VOAR_jornada_01_altfixa.plan` | sem data no nome | 127799 |
| `voo_ncontrol/SINTETICO_NAO_VOAR_jornada_01_terrainfollow.plan` | sem data no nome | 127793 |
| `voo_ncontrol/SINTETICO_NAO_VOAR_manifesto_interprete_cego_72poligonos.csv` | sem data no nome | 8771 |
| `voo_ncontrol/SINTETICO_NAO_VOAR_roteiro_jornadas_72poligonos.csv` | sem data no nome | 16392 |
| `voo_ncontrol/SINTETICO_NAO_VOAR_roteiro_jornadas_72poligonos.pdf` | sem data no nome | 16465 |
| `voo_ncontrol/SINTETICO_NAO_VOAR_tabela_autorizacao_proprietarios_72poligonos.csv` | sem data no nome | 10179 |
| `voo/cobertura_voos.geojson` | sem data no nome | 2788 |
