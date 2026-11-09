FONTE_DOS_DADOS	.git/HEAD	src/config/decisoes.ts	vitest.config.mts	vitest.vivo.config.mts	docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json	scripts/d25/config_pre_registro_PROPOSTA.json	src/lib/matriz/perfis.ts	docs/verificacoes

# Painel de Estado Atual do Projeto — SAREL

- Medição realizada em: 2026-11-09 01:14:57 UTC

## 1. Controle de Versão (Git)
- Branch atual: `correcoes/contencao-2026-11-02`
- Commit HEAD: `3245777af1470419a267c3c206160752abc4b8aa`
- Data do HEAD: 2026-11-08 17:09:32 -0300
- Últimos 5 commits:
  1. `3245777 feat(auditoria): ajustar leitor de lote com recusa de pontual e testes de contrato`
  2. `9585ef7 feat(gee): adicionar endpoint e gravador de evidencia em lote da Regra 8`
  3. `5b309d2 feat(auditoria): recriar medidor de distribuicao temporal e trava comportamental de scripts`
  4. `4aeaa7b feat(gee): adicionar gravador de evidencia da Regra 8 para Google Earth Engine`
  5. `a971ab3 Revert "chore(auditoria): adicionar script de medicao da distribuicao temporal Sentinel-2"`

## 2. Testes Automatizados
- Arquivos de teste versionados no repositório: 120
  - TypeScript herméticos (`src/**/*.test.ts`): 104
  - TypeScript vivos (`src/**/*.vivo.test.ts`): 2
  - Python (`test_*.py` em `scripts/` e `docs/`): 14
- Arquivos de teste executados na suíte padrão hermética (`npm run test`): 104
- Diferença explicada pelas configurações do Vitest:
  - `vitest.config.mts`: seleciona exclusivamente `src/**/*.test.ts` (104 arquivos) e exclui `src/**/*.vivo.test.ts`.
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
- Total de arquivos de evidência medidos: 107

| Arquivo de Evidência | Data de Modificação | Tamanho (bytes) |
|---|:---:|---:|
| `2026-09-10_distorcao_projecao_declividade.md` | 2026-09-10 | 4094 |
| `2026-09-10_embrapa_capabilities.xml` | 2026-09-10 | 7414096 |
| `2026-09-10_embrapa_erodibilidade_classes.json` | 2026-09-10 | 2267 |
| `2026-09-10_embrapa_featureinfo_noroeste.json` | 2026-09-10 | 1058070 |
| `2026-09-10_embrapa_featureinfo_oceano.json` | 2026-09-10 | 137 |
| `2026-09-10_embrapa_featureinfo_oeste.json` | 2026-09-10 | 1963755 |
| `2026-09-10_ibge_municipio_exemplo.json` | 2026-09-10 | 559 |
| `2026-09-26_alvo_supervisionado_circular_script_treino.md` | 2026-09-26 | 21615 |
| `2026-09-26_fabricacao_alvo_supervisionado_arquivo01.md` | 2026-09-26 | 8301 |
| `2026-09-26_fabricacao_fatores_rusle_pacote_reprodutibilidade.md` | 2026-09-26 | 10401 |
| `2026-09-26_fase0_bloqueios_bandas_fatorc_proveniencia.md` | 2026-09-27 | 9187 |
| `2026-09-29_gargalo_estratos_k2_dominio_d07.md` | 2026-09-29 | 5672 |
| `2026-09-29_universo_de_candidatos_e_cadeia_de_reducoes.md` | 2026-09-29 | 4542 |
| `2026-09-30_relatorio_fase_gerado.md` | 2026-10-02 | 21811 |
| `2026-09-30_remedicao_candidatos_bp3_d16.md` | 2026-10-01 | 3389 |
| `2026-09-30_verificacao_Z1_Z6_planos_de_voo.md` | 2026-09-30 | 5119 |
| `2026-10-01_FABRICACAO_frequencia_solo_nu.md` | 2026-10-01 | 4594 |
| `2026-10-01_relatorio_fase_gerado.md` | 2026-10-02 | 27528 |
| `2026-10-01_verificacao_pipeline_X0_X5.md` | 2026-10-01 | 3714 |
| `2026-10-02_relatorio_fase_gerado.md` | 2026-10-02 | 42431 |
| `2026-10-02_verificacao_fatores_R_e_LS.md` | 2026-10-02 | 4767 |
| `2026-10-20_ciclo_cota_planet.md` | 2026-10-20 | 5199 |
| `2026-10-20_quantil_tipo7_hyndman_fan.md` | 2026-10-20 | 5618 |
| `2026-10-31_ocupacao_estratos_d16.md` | 2026-10-31 | 9639 |
| `2026-10-31_suficiencia_temporal_zhu_ccdc.md` | 2026-10-31 | 5242 |
| `2026-11-02_especificacao_competidor_rusle.md` | 2026-11-03 | 5878 |
| `2026-11-02_impedimento_lastro_G01.md` | 2026-11-03 | 4077 |
| `2026-11-02_lastro_d11_2_se_0144.md` | 2026-11-03 | 2462 |
| `2026-11-03_poder_d25_preliminar.txt` | 2026-11-03 | 2522 |
| `2026-11-03_poder_d25.txt` | 2026-11-03 | 4569 |
| `cache_pedologia_bp3.json` | 2026-10-01 | 96740 |
| `calculadora/2026-09-30_simulacao_desenho_d16_224m.md` | 2026-09-30 | 2027 |
| `climatologia_chirps_bp3.json` | 2026-10-02 | 16611 |
| `diario_climatologia_chirps_bp3.json` | 2026-10-02 | 237364 |
| `fontes/cochran1977/cochran_1977_sampling_techniques_ch5a12.md` | 2026-10-31 | 7016 |
| `fontes/desmet1996/desmet_govers_1996_jswc.pdf` | 2026-10-18 | 930133 |
| `fontes/desmet1996/extrair_desmet_1996.py` | 2026-10-02 | 4173 |
| `fontes/desmet1996/saida_extracao_desmet_1996.txt` | 2026-10-02 | 2652 |
| `fontes/doc246/extrair_cnps_doc_246_2024.py` | 2026-09-28 | 2515 |
| `fontes/doc246/saida_extracao_cnps_doc_246_2024.txt` | 2026-09-28 | 60712 |
| `fontes/hyndman1996/hyndman_fan_1996_american_statistician.pdf` | 2026-10-20 | 405765 |
| `fontes/nepar2011/extrair_nepar_2011.py` | 2026-10-02 | 3145 |
| `fontes/nepar2011/nepar_boletim_01_2011.pdf` | 2026-10-02 | 2099806 |
| `fontes/nepar2011/saida_extracao_nepar_2011.txt` | 2026-10-02 | 49055 |
| `fontes/renard1997/ah_703.pdf` | 2026-10-01 | 22401914 |
| `fontes/renard1997/executar_ocr_renard_1997.py` | 2026-10-02 | 5661 |
| `fontes/renard1997/extrair_renard_1997.py` | 2026-10-02 | 6522 |
| `fontes/renard1997/saida_extracao_renard_1997.txt` | 2026-10-02 | 2872 |
| `fontes/renard1997/saida_ocr_renard_1997.txt` | 2026-10-02 | 9687 |
| `fontes/rufino1993/rufino_biscaia_merten_1993_rbcs.pdf` | 2026-10-18 | 2130995 |
| `fontes/schmidt2019/extrair_schmidt_2019.py` | 2026-10-02 | 2919 |
| `fontes/schmidt2019/saida_extracao_schmidt_2019.txt` | 2026-10-02 | 30641 |
| `fontes/schmidt2019/schmidt_2019_methodsx.pdf` | 2026-10-02 | 4339190 |
| `fontes/tondati2026/tondati_2026.pdf` | 2026-10-18 | 802089 |
| `fontes/waltrick2010/waltrick_2010.pdf` | 2026-10-18 | 15077981 |
| `fontes/waltrick2015/extrair_waltrick_2015.py` | 2026-10-01 | 2700 |
| `fontes/waltrick2015/saida_extracao_waltrick_2015.txt` | 2026-10-01 | 48533 |
| `fontes/waltrick2015/waltrick_2015.pdf` | 2026-10-01 | 1043486 |
| `fontes/wfs_erodibilidade/amostra_dirigida_associacoes_2026-09-28.json` | 2026-09-29 | 27313 |
| `fontes/wfs_erodibilidade/amostra_dirigida_associacoes_2026-09-28.md` | 2026-09-29 | 5390 |
| `fontes/wfs_erodibilidade/amostra_dirigida_associacoes.py` | 2026-09-29 | 10200 |
| `fontes/wfs_erodibilidade/conferir_eixos_wfs_110_ao_vivo.py` | 2026-09-28 | 3441 |
| `fontes/wfs_erodibilidade/consultar_wfs_erodibilidade_2024.py` | 2026-09-28 | 13373 |
| `fontes/wfs_erodibilidade/describe_feature_type_bra_erodibilidade_2024.xml` | 2026-09-28 | 2934 |
| `fontes/wfs_erodibilidade/getfeature_pip_3camadas_r13_bp3.json` | 2026-09-28 | 3092 |
| `fontes/wfs_erodibilidade/getfeatureinfo_3camadas_r13_fronteira_bp3.json` | 2026-09-28 | 3937 |
| `fontes/wfs_erodibilidade/getfeatureinfo_3camadas_rural_associacao_bp3.json` | 2026-09-28 | 6190137 |
| `fontes/wfs_erodibilidade/getfeatureinfo_3camadas_rural_simples_bp3.json` | 2026-09-28 | 10499905 |
| `fontes/wfs_erodibilidade/medicao_w2_candidatos_bp3_2026-09-28.json` | 2026-09-29 | 99257 |
| `fontes/wfs_erodibilidade/medicao_w2_candidatos_bp3_2026-09-28.md` | 2026-09-29 | 5344 |
| `fontes/wfs_erodibilidade/medir_w2_candidatos_bp3_2026-09-28.ts` | 2026-09-29 | 26659 |
| `fontes/wfs_erodibilidade/reconhecimento_2026-09-28.md` | 2026-09-29 | 12583 |
| `fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_2026-09-28.json` | 2026-09-28 | 23928 |
| `fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_2026-09-28.txt` | 2026-09-28 | 6811 |
| `fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_u1_2026-09-28.json` | 2026-09-28 | 66018 |
| `fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_u1_2026-09-28.txt` | 2026-09-28 | 7934 |
| `fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_v1_pip_2026-09-28.json` | 2026-09-28 | 86274 |
| `fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_v1_pip_2026-09-28.txt` | 2026-09-28 | 10363 |
| `fontes/wfs_erodibilidade/remedir_correspondencia_pos_u1_2026-09-28.py` | 2026-09-28 | 18448 |
| `fontes/wfs_erodibilidade/remedir_correspondencia_pos_v1_pip_2026-09-28.py` | 2026-09-28 | 22779 |
| `fontes/zhu2013/extrair_zhu_2013.py` | 2026-10-31 | 3701 |
| `fontes/zhu2013/saida_extracao_zhu_2013.txt` | 2026-10-31 | 5047 |
| `fontes/zhu2013/zhu_2013_tese_ccdc.pdf` | 2026-10-22 | 5623376 |
| `legado_climatologia_chirps_bp3_2022.json` | 2026-10-02 | 4268 |
| `planet/2026-10-20_planet_my_plan_insights.png` | 2026-10-20 | 107436 |
| `pluviometria_iat_estacoes.csv` | 2026-10-18 | 8214 |
| `pluviometria_iat_mensal.csv` | 2026-10-18 | 961049 |
| `projecao/calcula_distorcao_20_segmentos_bp3_2026-09-28.py` | 2026-09-28 | 4326 |
| `projecao/distorcao_epsg31982_2026-09-28.txt` | 2026-09-28 | 2508 |
| `projecao/distorcao_tabela_recalculada_2026-09-28.txt` | 2026-09-28 | 3334 |
| `projecao/saida_distorcao_20_segmentos_bp3_2026-09-28.txt` | 2026-09-28 | 2949 |
| `projecao/verifica_distorcao_epsg31982.py` | 2026-09-28 | 3415 |
| `projecao/verifica_tabela_recalculada_2026-09-28.py` | 2026-09-28 | 3195 |
| `r_rufino_pluviometro_vs_waltrick.csv` | 2026-10-18 | 4446 |
| `remedicao_candidatos_bp3_d16_2026-09-30.json` | 2026-10-01 | 2411 |
| `verificacao_custo_e_ruido_poder_d25_2026-11-03.md` | 2026-11-03 | 7762 |
| `verificacao_grade_completa_poder_2026-11-04.md` | 2026-11-05 | 15799 |
| `verificacao_monotonicidade_poder_2026-11-03.md` | 2026-11-04 | 7637 |
| `voo_ncontrol/LEIA-ME_NAO_VOAR.md` | 2026-10-19 | 3370 |
| `voo_ncontrol/relatorio_aceitacao_y1_y6_2026-09-29.json` | 2026-10-18 | 2231 |
| `voo_ncontrol/SINTETICO_NAO_VOAR_jornada_01_altfixa.plan` | 2026-10-19 | 127799 |
| `voo_ncontrol/SINTETICO_NAO_VOAR_jornada_01_terrainfollow.plan` | 2026-10-19 | 127793 |
| `voo_ncontrol/SINTETICO_NAO_VOAR_manifesto_interprete_cego_72poligonos.csv` | 2026-10-18 | 8771 |
| `voo_ncontrol/SINTETICO_NAO_VOAR_roteiro_jornadas_72poligonos.csv` | 2026-10-18 | 16392 |
| `voo_ncontrol/SINTETICO_NAO_VOAR_roteiro_jornadas_72poligonos.pdf` | 2026-10-18 | 16465 |
| `voo_ncontrol/SINTETICO_NAO_VOAR_tabela_autorizacao_proprietarios_72poligonos.csv` | 2026-10-18 | 10179 |
| `voo/cobertura_voos.geojson` | 2026-09-27 | 2900 |
