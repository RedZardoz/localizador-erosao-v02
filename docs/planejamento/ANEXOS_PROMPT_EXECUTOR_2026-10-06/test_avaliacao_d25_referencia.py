# -*- coding: utf-8 -*-
"""Testes da implementacao de referencia D25. TODO dado aqui e SINTETICO_TESTE_ENCANAMENTO:
nenhum resultado e evidencia cientifica."""
import json, math, os, tempfile, unittest
import numpy as np
import pandas as pd
import avaliacao_d25_referencia as m


def sintetico(seed=7, n_pol_estrato=4, cel=60):
    """18 estratos x 4 poligonos; 2 treino + 2 held-out por estrato. SINTETICO_TESTE_ENCANAMENTO."""
    rng = np.random.default_rng(seed)
    linhas, pid = [], 0
    for est in range(18):
        for k in range(n_pol_estrato):
            pid += 1
            papel = "treino" if k < 2 else "held-out"
            loc_k = rng.normal(0, 1)
            loc_r = rng.normal(0, 1)
            for _ in range(cel):
                e1, e2, e3 = rng.normal(size=3)
                t1, t2 = rng.normal(size=2)
                lin = 0.9 * e1 - 0.5 * e2 + 0.4 * t1 + 0.3 * loc_k
                f = max(0.0, min(1.0, 0.12 + 0.18 * lin + rng.normal(0, 0.12))) if rng.random() < 0.7 else 0.0
                linhas.append(dict(Poligono_ID=f"SINT_{pid:03d}", Papel_Conjunto=papel, Estrato_ID=est,
                                   Fracao_Erodida=f, E1=e1, E2=e2, E3=e3, T1=t1, T2=t2, K=loc_k, Chuva=loc_r,
                                   R=1 + abs(loc_r), KK=1 + abs(loc_k), LS=1 + abs(t1), C=0.3 + abs(e2) * 0.1, P=1.0))
    return pd.DataFrame(linhas)


GRADE_PEQUENA = {"p": [1.2, 1.5], "xgb": [dict(max_depth=2, learning_rate=0.1, n_estimators=100, min_child_weight=5)],
                 "alpha": [1e-2, 1.0]}
CFG = {"grade": GRADE_PEQUENA, "alvo": "Fracao_Erodida", "grupo": "Poligono_ID",
       "blocos": {"espectro": ["E1", "E2", "E3"], "terreno": ["T1", "T2"], "solo": ["K"], "chuva": ["Chuva"]},
       "monotonicidade": {"E1": 1, "E2": -1}, "rusle": {"R": "R", "K": "KK", "LS": "LS", "C": "C", "P": "P"}}


class Estatistica(unittest.TestCase):
    def test_spearman_oraculo(self):
        # oraculo calculado com scipy.stats.spearmanr em 06/10/2026
        x = [1, 2, 3, 4, 5]
        y = [5, 6, 7, 8, 7]
        self.assertAlmostEqual(m.spearman_rapido(x, y), 0.8207826816681233, places=12)
    def test_spearman_empates_e_constante(self):
        self.assertAlmostEqual(m.spearman_rapido([0, 0, 0, 1, 2, 3], [0, 0, 1, 1, 2, 5]),
                               float(__import__("scipy.stats").stats.spearmanr([0,0,0,1,2,3],[0,0,1,1,2,5])[0]), places=12)
        self.assertTrue(math.isnan(m.spearman_rapido([1, 1, 1, 1], [1, 2, 3, 4])))
    def test_auc_oraculo(self):
        # AUC de Mann-Whitney com empate: pos=[0.8,0.6,0.6], neg=[0.6,0.2] -> (2*1... ) calculado a mao
        y = [1, 1, 1, 0, 0]
        s = [0.8, 0.6, 0.6, 0.6, 0.2]
        # pares: 0.8>0.6 (1), 0.8>0.2 (1), 0.6=0.6 (.5), 0.6>0.2 (1), 0.6=0.6 (.5), 0.6>0.2 (1) = 5/6
        self.assertAlmostEqual(m.auc_postos(y, s), 5 / 6, places=12)
        self.assertTrue(math.isnan(m.auc_postos([1, 1], [0.1, 0.2])))
    def test_n_efetivo_reproduz_d24(self):
        self.assertAlmostEqual(m.n_efetivo(100000, 50), 50.93, places=2)         # ~51 por poligono de 10 ha (D24)
        n = m.n_efetivo(72 * 5.02 * 1e4, 50)
        self.assertAlmostEqual(n, 1840.9, delta=0.5)                              # D24 diz ~1.845 (diferenca < 0,3 %)
        self.assertLess(abs(n - 1845) / 1845, 0.01)
    def test_preditor_saida_do_rusle_proibido(self):
        for proibido in ("RUSLE_A", "RUSLE_Perda_Solo_t_ha_ano", "RUSLE_Fator_C", "RUSLE_Fator_P"):
            with self.assertRaises(m.ErroAvaliacao):
                m.validar_teto_blocos({"terreno": [proibido]})
        m.validar_teto_blocos({"terreno": ["RUSLE_Fator_LS"], "solo": ["RUSLE_Fator_K"], "chuva": ["RUSLE_Fator_R"]})
    def test_rusle_coluna_pronta(self):
        df = pd.DataFrame({"A": [0.5, np.nan]})
        a = m.rusle_a(df, {"A": "A"}); self.assertEqual(a[0], 0.5); self.assertTrue(np.isnan(a[1]))
    def test_teto_blocos(self):
        m.validar_teto_blocos({"espectro": list("abcdefgh"), "terreno": list("abcd"), "solo": ["k"], "chuva": ["r"]})
        with self.assertRaises(m.ErroAvaliacao):
            m.validar_teto_blocos({"espectro": list("abcdefghi")})
        with self.assertRaises(m.ErroAvaliacao):
            m.validar_teto_blocos({"solo": ["k", "k2"]})
        with self.assertRaises(m.ErroAvaliacao):
            m.validar_teto_blocos({"outro": ["x"]})


class Desfechos(unittest.TestCase):
    def test_corroborada(self):
        r = m.classificar_desfecho(0.55, 0.40, 0.45, (0.03, 0.27), (0.01, 0.2))
        self.assertEqual(r["desfecho"], "CORROBORADA"); self.assertFalse(r["hipotese_ensemble_refutada"])
    def test_inconclusiva(self):
        r = m.classificar_desfecho(0.55, 0.40, 0.45, (-0.05, 0.30), (0.01, 0.2))
        self.assertEqual(r["desfecho"], "INCONCLUSIVA")
    def test_refutada_piso(self):
        self.assertEqual(m.classificar_desfecho(0.39, 0.10, 0.3, (0.1, 0.4), (0.0, 0.2))["desfecho"], "REFUTADA")
    def test_refutada_abaixo_rusle(self):
        self.assertEqual(m.classificar_desfecho(0.50, 0.55, 0.3, (-0.2, 0.1), (0.0, 0.2))["desfecho"], "REFUTADA")
    def test_quarto_desfecho(self):
        r = m.classificar_desfecho(0.55, 0.40, 0.54, (0.03, 0.27), (-0.04, 0.06))
        self.assertTrue(r["hipotese_ensemble_refutada"])
    def test_lacuna_d25_vira_inconclusiva_margem(self):
        r = m.classificar_desfecho(0.45, 0.40, 0.3, (-0.1, 0.2), (0.0, 0.2))
        self.assertEqual(r["desfecho"], "INCONCLUSIVA_MARGEM")
    def test_nao_avaliavel(self):
        self.assertEqual(m.classificar_desfecho(float("nan"), float("nan"), 0.1, None, None)["desfecho"], "NAO_AVALIAVEL")
    def test_limites_exatos(self):
        # piso e margem sao >= (D25): rho=0.40 e margem exatamente 0.10 contam como atingidos
        r = m.classificar_desfecho(0.50, 0.40, 0.2, (0.01, 0.2), (0.0, 0.2))
        self.assertEqual(r["desfecho"], "CORROBORADA")


class Bootstrap(unittest.TestCase):
    def setUp(self):
        rng = np.random.default_rng(1)
        self.g = np.repeat([f"P{i}" for i in range(20)], 40)
        self.y = np.clip(rng.normal(0.2, 0.2, 800), 0, 1)
        self.bom = self.y + rng.normal(0, 0.05, 800)
        self.ruim = rng.normal(0, 1, 800)
    def test_determinismo_e_ic(self):
        a = m.bootstrap_diferenca(self.y, self.bom, self.ruim, self.g, B=500, seed=3)
        b = m.bootstrap_diferenca(self.y, self.bom, self.ruim, self.g, B=500, seed=3)
        self.assertEqual(a.ic95, b.ic95)
        self.assertTrue(a.exclui_zero and a.ic95[0] > 0)
    def test_unidade_e_poligono(self):
        # com 1 poligono nao ha bootstrap por poligono
        with self.assertRaises(m.ErroAvaliacao):
            m.bootstrap_diferenca(self.y[:40], self.bom[:40], self.ruim[:40], self.g[:40], B=10)
    def test_identicos_dif_zero(self):
        r = m.bootstrap_diferenca(self.y, self.bom, self.bom, self.g, B=300, seed=5)
        self.assertEqual(r.ic95, (0.0, 0.0)); self.assertFalse(r.exclui_zero)


class Carga(unittest.TestCase):
    def test_csv_do_app_com_bom_e_metadados(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "SINTETICO_TESTE_ENCANAMENTO.csv")
            with open(p, "w", encoding="utf-8", newline="") as fh:
                fh.write("﻿# SAREL v2 SINTETICO_TESTE_ENCANAMENTO\n# Emissao: x\n# LGPD: y\n\nA,B\n1,2\n3,#4\n")
            df = m.carregar_csv_sarel(p)
            self.assertEqual(list(df.columns), ["A", "B"]); self.assertEqual(df.shape, (2, 2))
            self.assertEqual(df["B"].tolist(), ["2", "#4"])   # '#' no meio da linha de dados e preservado


class Pipeline(unittest.TestCase):
    def test_rusle_nan_nunca_zero(self):
        df = pd.DataFrame({"R": [1, np.nan], "K": [1, 1], "LS": [1, 1], "C": [1, 1], "P": [1, 1]})
        a = m.rusle_a(df, {k: k for k in "R K LS C P".split()})
        self.assertEqual(a[0], 1.0); self.assertTrue(np.isnan(a[1]))
    def test_ponta_a_ponta_dryrun_e_trava(self):
        df = sintetico()
        with tempfile.TemporaryDirectory() as d:
            rel = m.avaliar_held_out(df, CFG, d, dryrun_sintetico=True, B=200, seed=11)
            self.assertIn(rel["desfecho"]["desfecho"], {"CORROBORADA", "INCONCLUSIVA", "INCONCLUSIVA_MARGEM", "REFUTADA"})
            self.assertEqual(rel["n_poligonos_heldout"], 36)
            self.assertTrue(os.path.exists(os.path.join(d, "DRYRUN_SINTETICO_avaliacao_d25.json")))
            self.assertIn("nenhum numero", rel["aviso"])
            with self.assertRaises(m.ErroAvaliacao):           # avaliacao unica (D25)
                m.avaliar_held_out(df, CFG, d, dryrun_sintetico=True, B=200, seed=11)
    def test_sensibilidades_e_p_escolhido_no_treino(self):
        df = sintetico(); df["Marcador_D08"] = ["false" if i % 3 else "true" for i in range(len(df))]
        cfg = json.loads(json.dumps(CFG)); cfg["coluna_marcador_d08"] = "Marcador_D08"
        with tempfile.TemporaryDirectory() as d:
            rel = m.avaliar_held_out(df, cfg, d, dryrun_sintetico=True, B=100, seed=5)
        sens = rel["sensibilidades_pre_registradas"]
        self.assertIn("xgb_sem_monotonicidade", sens); self.assertIn("d08_sem_marcador_verdadeiro_ou_indisponivel", sens)
        self.assertIn(rel["hiperparametros"]["xgb_p_tweedie"], [1.2, 1.5])
        self.assertNotIn("xgb_livre", rel["rho_spearman"])
    def test_p_fora_de_1_2_recusado(self):
        cfg = json.loads(json.dumps(CFG)); cfg["grade"] = {"p": [1.5, 2.0]}
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(m.ErroAvaliacao):
                m.avaliar_held_out(sintetico(), cfg, d, dryrun_sintetico=True, B=50)
    def test_determinismo_ponta_a_ponta(self):
        df = sintetico()
        with tempfile.TemporaryDirectory() as d1, tempfile.TemporaryDirectory() as d2:
            a = m.avaliar_held_out(df, CFG, d1, dryrun_sintetico=True, B=200, seed=11)
            b = m.avaliar_held_out(df, CFG, d2, dryrun_sintetico=True, B=200, seed=11)
            self.assertEqual(a["rho_spearman"], b["rho_spearman"])
    def test_vazamento_poligono_recusado(self):
        df = sintetico()
        df.loc[df.index[0], "Papel_Conjunto"] = "held-out"      # mesmo poligono nos dois papeis
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(m.ErroAvaliacao):
                m.avaliar_held_out(df, CFG, d, dryrun_sintetico=True, B=50)
    def test_alvo_fora_de_faixa_recusado(self):
        df = sintetico(); df.loc[df.index[0], "Fracao_Erodida"] = 1.5
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(m.ErroAvaliacao):
                m.avaliar_held_out(df, CFG, d, dryrun_sintetico=True, B=50)
    def test_teto_no_pipeline(self):
        df = sintetico(); cfg = json.loads(json.dumps(CFG)); cfg["blocos"]["solo"] = ["K", "Chuva"]
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(m.ErroAvaliacao):
                m.avaliar_held_out(df, cfg, d, dryrun_sintetico=True, B=50)
    def test_probatorio_exige_pre_registro(self):
        df = sintetico()
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(m.ErroAvaliacao):
                m.avaliar_held_out(df, CFG, d, dryrun_sintetico=False, B=50)
    def test_linha_de_base_por_celula_id(self):
        df = pd.DataFrame({"Celula_ID": ["a", "b", "c"], "x": [1, 2, 3]})
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "lb.csv")
            with open(p, "w", encoding="utf-8") as fh:
                fh.write("# SINTETICO_TESTE_ENCANAMENTO\n\nCelula_ID,RUSLE_A,Marcador_K_Ambiguo_D08\na,0.5,false\nb,,true\n")
            out = m.juntar_linha_de_base(df, p)
        self.assertEqual(out.loc[0, "RUSLE_A"], 0.5)
        self.assertTrue(out["RUSLE_A"].iloc[1:].isna().all())     # vazio e sem correspondencia: NaN, nunca 0
        self.assertIn("Marcador_K_Ambiguo_D08", out.columns)
    def test_cli_exige_modo_e_sem_padrao_de_dados(self):
        with self.assertRaises(SystemExit):
            m.main(["--config", "x", "--saida", "y"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
