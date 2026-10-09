# -*- coding: utf-8 -*-
"""Testes (dado SINTETICO_TESTE_ENCANAMENTO; nada aqui e resultado cientifico)."""
import unittest
from pyproj import Transformer
import fracao_erodida_celulas_referencia as f

CRS = "EPSG:32722"
OX, OY = 300000.0, 7000000.0           # origem sintetica multipla de 10 m
GRADE = {"crs": CRS, "origem_x": OX, "origem_y": OY, "tamanho_m": 10}
T = Transformer.from_crs(CRS, "EPSG:4326", always_xy=True)


def retangulo(x0, y0, x1, y1):
    pts = [(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)]
    return {"type": "Polygon", "coordinates": [[list(T.transform(x, y)) for x, y in pts]]}


def fc(*geoms, pid="SINT_001"):
    return {"type": "FeatureCollection", "features": [
        {"type": "Feature", "properties": {"Poligono_ID": pid}, "geometry": g} for g in geoms]}


class Celulas(unittest.TestCase):
    def test_metade_esquerda(self):
        voo = fc(retangulo(OX + 1000, OY + 1000, OX + 1100, OY + 1100))
        de = fc(retangulo(OX + 1000, OY + 1000, OX + 1050, OY + 1100))
        df, conf = f.calcular_celulas(voo, de, GRADE)
        self.assertEqual(len(df), 100); self.assertTrue(df["Incluida"].all())
        self.assertAlmostEqual(df["Fracao_Erodida"].mean(), 0.5, places=6)
        self.assertAlmostEqual(df["Area_Delineada_m2"].sum(), 5000.0, places=3)
        self.assertAlmostEqual(conf[0]["residuo_conservacao_m2"], 0.0, places=3)
    def test_25_m2_numa_celula(self):
        voo = fc(retangulo(OX + 1000, OY + 1000, OX + 1010, OY + 1010))
        de = fc(retangulo(OX + 1000, OY + 1000, OX + 1005, OY + 1005))
        df, _ = f.calcular_celulas(voo, de, GRADE)
        self.assertEqual(len(df), 1); self.assertAlmostEqual(df.iloc[0]["Fracao_Erodida"], 0.25, places=6)
        self.assertTrue(df.iloc[0]["Fracao_Erodida"] >= 0.25 - 1e-9)       # binario D26: >= 25 %
    def test_sem_dupla_contagem(self):
        voo = fc(retangulo(OX + 1000, OY + 1000, OX + 1010, OY + 1010))
        a = retangulo(OX + 1000, OY + 1000, OX + 1006, OY + 1010)
        b = retangulo(OX + 1004, OY + 1000, OX + 1010, OY + 1010)            # sobrepoe 2 m
        df, _ = f.calcular_celulas(voo, fc(a, b), GRADE)
        self.assertAlmostEqual(df.iloc[0]["Fracao_Erodida"], 1.0, places=6)
    def test_cobertura_parcial_excluida_e_conservacao(self):
        voo = fc(retangulo(OX + 1003, OY + 1003, OX + 1103, OY + 1103))    # fora da grade em 3 m
        de = fc(retangulo(OX + 1003, OY + 1003, OX + 1103, OY + 1103))
        df, conf = f.calcular_celulas(voo, de, GRADE)
        self.assertTrue((df["Incluida"] == (df["Cobertura_Celula"] >= 0.95)).all())
        self.assertGreater((~df["Incluida"]).sum(), 0)
        self.assertAlmostEqual(conf[0]["residuo_conservacao_m2"], 0.0, places=3)
        self.assertAlmostEqual(df["Area_Delineada_m2"].sum(), 10000.0, places=3)
    def test_delineacao_fora_do_voo_e_reportada(self):
        voo = fc(retangulo(OX + 1000, OY + 1000, OX + 1100, OY + 1100))
        de = fc(retangulo(OX + 1050, OY + 1000, OX + 1150, OY + 1100))
        _, conf = f.calcular_celulas(voo, de, GRADE)
        self.assertAlmostEqual(conf[0]["area_delineada_fora_voo_m2"], 5000.0, places=2)
    def test_sem_delineacao_fracao_zero_nao_ausente(self):
        voo = fc(retangulo(OX + 1000, OY + 1000, OX + 1020, OY + 1020))
        df, _ = f.calcular_celulas(voo, {"type": "FeatureCollection", "features": []}, GRADE)
        self.assertTrue((df["Fracao_Erodida"] == 0.0).all() and len(df) == 4)
    def test_pixel_id_opaco_estavel_e_compartilhado_entre_poligonos_vizinhos(self):
        a = retangulo(OX + 1000, OY + 1000, OX + 1020, OY + 1020)
        b = retangulo(OX + 1020, OY + 1000, OX + 1040, OY + 1020)
        voo = {"type": "FeatureCollection", "features": [
            {"type": "Feature", "properties": {"Poligono_ID": "OPACO_A"}, "geometry": a},
            {"type": "Feature", "properties": {"Poligono_ID": "OPACO_B"}, "geometry": retangulo(OX + 1010, OY + 1000, OX + 1030, OY + 1020)}]}
        df, _ = f.calcular_celulas(voo, {"type": "FeatureCollection", "features": []}, GRADE)
        self.assertTrue((df["Pixel_ID"].str.len() == 12).all())
        self.assertFalse(df["Celula_ID"].str.contains(r"_\d+_\d+$").any())      # nao expoe indices da grade
        comum = set(df[df.Poligono_ID == "OPACO_A"].Pixel_ID) & set(df[df.Poligono_ID == "OPACO_B"].Pixel_ID)
        self.assertEqual(len(comum), 2)           # o pixel de borda aparece nos dois poligonos, com o MESMO Pixel_ID
        self.assertEqual(f.pixel_id_opaco(CRS, 3, 4), f.pixel_id_opaco(CRS, 3, 4))
        self.assertNotEqual(f.pixel_id_opaco(CRS, 3, 4), f.pixel_id_opaco(CRS, 4, 3))
    def test_grade_sem_padrao(self):
        with self.assertRaises(f.ErroGrade):
            f.calcular_celulas(fc(), fc(), {"crs": CRS})
        with self.assertRaises(f.ErroGrade):
            f.calcular_celulas(fc(), fc(), dict(GRADE, tamanho_m=30))
    def test_escala_utm_medianeira(self):
        k22 = f.fator_escala_utm(-54.1, -25.3, "EPSG:32722")
        k21 = f.fator_escala_utm(-54.1, -25.3, "EPSG:32721")
        self.assertAlmostEqual(k22, 1.0008, delta=3e-4)       # zona 22S, 3,1 graus do meridiano central
        self.assertLess(abs(k21 - 1) , abs(k22 - 1) + 0.0004)   # 21S: 2,9 graus do central, k similar
        self.assertLess(abs(k22 - 1), 0.005)                  # tolerancia D15: 0,5 %


if __name__ == "__main__":
    unittest.main(verbosity=2)
