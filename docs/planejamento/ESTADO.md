FONTE_DOS_DADOS	.git/HEAD	src/config/decisoes.ts	vitest.config.mts	vitest.vivo.config.mts	docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json	scripts/d25/config_pre_registro_PROPOSTA.json	src/lib/matriz/perfis.ts	docs/verificacoes

# Painel de Estado Atual do Projeto — SAREL

## 1. Controle de Versão (Git)
- Commit HEAD: `bb260e179ae13862d893fa7ebc00e77cff1868ed`
- Data do HEAD: 2026-11-11 11:16:39 +0000
- Últimos 5 commits:
  1. `bb260e1 docs(planejamento): mandar o prompt Q fechar as pendencias que ele proprio resolve`
  2. `cadc359 docs(planejamento): sincronizar ESTADO.md pos emenda de papeis (Prompt P)`
  3. `d7284c9 docs(planejamento): registrar emenda de papeis da equipe e 4 pendencias da etapa 5 (Prompt P)`
  4. `fc8feca docs(planejamento): adicionar prompt Q do cegamento por distribuicao`
  5. `d228f2c docs(planejamento): material de decisao sobre onde vive o cegamento da campanha`

## 2. Testes Automatizados
- Arquivos de teste versionados no repositório: 128
  - TypeScript herméticos (`src/**/*.test.ts`): 112
  - TypeScript vivos (`src/**/*.vivo.test.ts`): 2
  - Python (`test_*.py` em `scripts/` e `docs/`): 14
- Arquivos de teste executados na suíte padrão hermética (`npm run test`): 112
- Diferença explicada pelas configurações do Vitest:
  - `vitest.config.mts`: seleciona exclusivamente `src/**/*.test.ts` (112 arquivos) e exclui `src/**/*.vivo.test.ts`.
  - `vitest.vivo.config.mts`: seleciona exclusivamente os 2 testes vivos (`src/**/*.vivo.test.ts`), executados via `npm run test:vivo` por dependerem de infraestrutura pesada local fora do Git (`data/fundiario_brasil.db` e DEM Copernicus GLO-30 em `data/dem_cache/`).
  - Testes em Python (14 arquivos): executados no ambiente Python (`pytest` / runners em `scripts/`), desacoplados da suíte Vitest.

## 3. Decisões Metodológicas (`src/config/decisoes.ts`)
- Maior ID existente: `D26`
- Total de decisões registradas: 26
- Decisões agrupadas por estado:
  - Decididas (25): D01, D02, D03, D04, D05, D06, D07, D08, D09, D10, D11, D12, D13, D14, D15, D16, D17, D18, D19, D21, D22, D23, D24, D25, D26
  - Propostas (1): D20
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
- Total de arquivos de evidência medidos: 259

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
| `2026-11-10_universo_candidatos_e_reprodutibilidade.md` | 2026-11-10 | 10193 |
| `2026-11-10f_calibracao_e_estabilidade_fontes.md` | 2026-11-10 | 15604 |
| `2026-11-10g_ingestao_680_e_distribuicao_e.md` | 2026-11-10 | 22153 |
| `2026-11-10h_guarda_d11_e_desenho_18x4.md` | 2026-11-10 | 11166 |
| `2026-11-10i_invariante_selo.md` | 2026-11-10 | 7230 |
| `2026-11-10j_sorteio_d16_executado.md` | 2026-11-10 | 7679 |
| `2026-11-10k_juncao_e_no_cli.md` | 2026-11-10 | 8850 |
| `2026-11-11l_selo_publico_d16.md` | 2026-11-11 | 9478 |
| `2026-11-11m_interface_alinhada.md` | 2026-11-11 | 10940 |
| `2026-11-11n_tour_atualizado.md` | 2026-11-11 | 10845 |
| `2026-11-11p_casca_fluxo.md` | 2026-11-11 | 15842 |
| `cache_frequencia_solo_nu_bp3.json` | sem data no nome | 687981 |
| `cache_pedologia_bp3.json` | sem data no nome | 96740 |
| `calculadora/2026-09-30_simulacao_desenho_d16_224m.md` | 2026-09-30 | 2027 |
| `calibracao_30_pontos_solo_nu.json` | sem data no nome | 1464 |
| `climatologia_chirps_bp3.json` | sem data no nome | 16112 |
| `diario_climatologia_chirps_bp3.json` | sem data no nome | 231414 |
| `diario_requisicoes_solo_nu_calibracao.json` | sem data no nome | 10267 |
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
| `execucao/2026-11-10f/conferencia_estabilidade_wfs.txt` | sem data no nome | 3851 |
| `execucao/2026-11-10f/estado_verificar.txt` | sem data no nome | 162 |
| `execucao/2026-11-10f/git_log.txt` | sem data no nome | 313 |
| `execucao/2026-11-10f/git_status.txt` | sem data no nome | 644 |
| `execucao/2026-11-10f/npm_test.txt` | sem data no nome | 20013 |
| `execucao/2026-11-10f/recusa_sem_credencial.txt` | sem data no nome | 2535 |
| `execucao/2026-11-10f/rodada_30_pontos_calibracao.txt` | sem data no nome | 3506 |
| `execucao/2026-11-10f/tsc_noemit.txt` | sem data no nome | 0 |
| `execucao/2026-11-10f/varredura_datas_fixas.txt` | sem data no nome | 1816 |
| `execucao/2026-11-10g/bloco_25_teste_fumaca.txt` | sem data no nome | 6832 |
| `execucao/2026-11-10g/cache_teste_fumaca.json` | sem data no nome | 21651 |
| `execucao/2026-11-10g/caracterizacao_distribuicao_e.txt` | sem data no nome | 7204 |
| `execucao/2026-11-10g/confirmacao_credencial.txt` | sem data no nome | 428 |
| `execucao/2026-11-10g/diario_ingestao_677_recuperacao1.json` | sem data no nome | 5308 |
| `execucao/2026-11-10g/diario_ingestao_677_recuperacao2.json` | sem data no nome | 944 |
| `execucao/2026-11-10g/diario_ingestao_677_rodada1.json` | sem data no nome | 9016 |
| `execucao/2026-11-10g/diario_teste_fumaca_25.json` | sem data no nome | 614 |
| `execucao/2026-11-10g/escolha_bloco.txt` | sem data no nome | 1430 |
| `execucao/2026-11-10g/estado_verificar.txt` | sem data no nome | 326 |
| `execucao/2026-11-10g/git_log.txt` | sem data no nome | 568 |
| `execucao/2026-11-10g/git_status.txt` | sem data no nome | 886 |
| `execucao/2026-11-10g/ingestao_677_recuperacao1.txt` | sem data no nome | 7714 |
| `execucao/2026-11-10g/ingestao_677_recuperacao2.txt` | sem data no nome | 6240 |
| `execucao/2026-11-10g/ingestao_677_rodada1.txt` | sem data no nome | 8882 |
| `execucao/2026-11-10g/janela_temporal_real.txt` | sem data no nome | 2462 |
| `execucao/2026-11-10g/npm_test.txt` | sem data no nome | 41266 |
| `execucao/2026-11-10g/ocupacao_estratos_d16.txt` | sem data no nome | 16414 |
| `execucao/2026-11-10g/teste_bloco_25.json` | sem data no nome | 1331 |
| `execucao/2026-11-10h/estado_verificar.txt` | sem data no nome | 326 |
| `execucao/2026-11-10h/git_log.txt` | sem data no nome | 538 |
| `execucao/2026-11-10h/git_status.txt` | sem data no nome | 1810 |
| `execucao/2026-11-10h/npm_test.txt` | sem data no nome | 39880 |
| `execucao/2026-11-10h/tsc_noemit.txt` | sem data no nome | 2406 |
| `execucao/2026-11-10i/estado_verificar.txt` | sem data no nome | 162 |
| `execucao/2026-11-10i/git_log.txt` | sem data no nome | 286 |
| `execucao/2026-11-10i/git_status.txt` | sem data no nome | 280 |
| `execucao/2026-11-10i/npm_test.txt` | sem data no nome | 40316 |
| `execucao/2026-11-10i/tsc_noemit.txt` | sem data no nome | 0 |
| `execucao/2026-11-10j/dry_run.txt` | sem data no nome | 5476 |
| `execucao/2026-11-10j/estado_verificar.txt` | sem data no nome | 162 |
| `execucao/2026-11-10j/git_log.txt` | sem data no nome | 244 |
| `execucao/2026-11-10j/git_status.txt` | sem data no nome | 1066 |
| `execucao/2026-11-10j/npm_test_pos_sorteio.txt` | sem data no nome | 21522 |
| `execucao/2026-11-10j/precondicao_git_status.txt` | sem data no nome | 239 |
| `execucao/2026-11-10j/precondicao_ls_sorteio.txt` | sem data no nome | 78 |
| `execucao/2026-11-10j/precondicao_npm_test.txt` | sem data no nome | 20067 |
| `execucao/2026-11-10j/precondicao_tsc_noemit.txt` | sem data no nome | 0 |
| `execucao/2026-11-10j/sorteio_execucao.txt` | sem data no nome | 5198 |
| `execucao/2026-11-10j/tsc_noemit_pos_sorteio.txt` | sem data no nome | 0 |
| `execucao/2026-11-10j/verificacao_selo.txt` | sem data no nome | 7198 |
| `execucao/2026-11-10k/defeito_medido.txt` | sem data no nome | 2316 |
| `execucao/2026-11-10k/estado_verificar.txt` | sem data no nome | 162 |
| `execucao/2026-11-10k/git_log.txt` | sem data no nome | 301 |
| `execucao/2026-11-10k/git_status.txt` | sem data no nome | 240 |
| `execucao/2026-11-10k/grep_provenienciaE.txt` | sem data no nome | 2719 |
| `execucao/2026-11-10k/npm_test.txt` | sem data no nome | 20294 |
| `execucao/2026-11-10k/tsc_noemit.txt` | sem data no nome | 0 |
| `execucao/2026-11-11l/check_ignore_selo_publico.txt` | sem data no nome | 29 |
| `execucao/2026-11-11l/estado_verificar.txt` | sem data no nome | 162 |
| `execucao/2026-11-11l/gerar_selo_publico_saida.txt` | sem data no nome | 414 |
| `execucao/2026-11-11l/git_log.txt` | sem data no nome | 280 |
| `execucao/2026-11-11l/git_status.txt` | sem data no nome | 91 |
| `execucao/2026-11-11l/npm_test.txt` | sem data no nome | 20974 |
| `execucao/2026-11-11l/precondicao_estado_verificar.txt` | sem data no nome | 162 |
| `execucao/2026-11-11l/precondicao_git_status.txt` | sem data no nome | 46 |
| `execucao/2026-11-11l/precondicao_ls_sorteio.txt` | sem data no nome | 550 |
| `execucao/2026-11-11l/tsc_noemit.txt` | sem data no nome | 0 |
| `execucao/2026-11-11m/00_pre_estado_verificar.txt` | sem data no nome | 162 |
| `execucao/2026-11-11m/00_pre_git_status.txt` | sem data no nome | 46 |
| `execucao/2026-11-11m/01_git_branch.txt` | sem data no nome | 34 |
| `execucao/2026-11-11m/02_tsc_check.txt` | sem data no nome | 0 |
| `execucao/2026-11-11m/03_vitest_selo_publico.txt` | sem data no nome | 582 |
| `execucao/2026-11-11m/04_vitest_candidato_espectral.txt` | sem data no nome | 594 |
| `execucao/2026-11-11m/05_vitest_paridade_artefatos.txt` | sem data no nome | 587 |
| `execucao/2026-11-11m/06_vitest_total_suite.txt` | sem data no nome | 21616 |
| `execucao/2026-11-11m/07_estado_verificar.txt` | sem data no nome | 162 |
| `execucao/2026-11-11m/08_git_diff_stat.txt` | sem data no nome | 567 |
| `execucao/2026-11-11m/09_final_git_status.txt` | sem data no nome | 533 |
| `execucao/2026-11-11m/10_final_git_diff_stat.txt` | sem data no nome | 567 |
| `execucao/2026-11-11m/11_final_estado_verificar.txt` | sem data no nome | 162 |
| `execucao/2026-11-11n/00_pre_git_status.txt` | sem data no nome | 46 |
| `execucao/2026-11-11n/01_pre_git_branch.txt` | sem data no nome | 34 |
| `execucao/2026-11-11n/02_pre_estado_verificar.txt` | sem data no nome | 162 |
| `execucao/2026-11-11n/03_contagem_decisoes_parametros.txt` | sem data no nome | 272 |
| `execucao/2026-11-11n/04_tsc_check.txt` | sem data no nome | 100 |
| `execucao/2026-11-11n/05_npm_test.txt` | sem data no nome | 21373 |
| `execucao/2026-11-11n/06_vitest_tour.txt` | sem data no nome | 584 |
| `execucao/2026-11-11n/07_grep_termos_proibidos.txt` | sem data no nome | 103 |
| `execucao/2026-11-11n/08_pos_estado_verificar.txt` | sem data no nome | 162 |
| `execucao/2026-11-11n/09_pos_git_status.txt` | sem data no nome | 235 |
| `execucao/2026-11-11p/00_pre_git_status.txt` | sem data no nome | 318 |
| `execucao/2026-11-11p/01_pre_git_branch.txt` | sem data no nome | 34 |
| `execucao/2026-11-11p/02_pre_estado_verificar.txt` | sem data no nome | 162 |
| `execucao/2026-11-11p/03_vitest_casca.txt` | sem data no nome | 601 |
| `execucao/2026-11-11p/04_tsc_check.txt` | sem data no nome | 100 |
| `execucao/2026-11-11p/05_npm_test.txt` | sem data no nome | 21070 |
| `execucao/2026-11-11p/06_vitest_paridade_g08.txt` | sem data no nome | 585 |
| `execucao/2026-11-11p/07_pos_estado_verificar.txt` | sem data no nome | 162 |
| `execucao/2026-11-11p/08_pos_git_status.txt` | sem data no nome | 1093 |
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
| `ingestao_677_solo_nu.json` | sem data no nome | 12254 |
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
| `selo_publico_d16_2026-11-10.json` | 2026-11-10 | 7179 |
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
