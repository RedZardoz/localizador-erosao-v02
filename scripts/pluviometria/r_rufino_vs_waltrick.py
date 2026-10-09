"""Fator R pelo metodo de Waltrick et al. (2015) com pluviometros do IAT/SIH, 1986-2008.

Metodo (texto de Waltrick, p. 258-259): Rc_mes = p^2/P com p = precipitacao MEDIA do mes
na serie e P = precipitacao MEDIA anual; EI_mes = a + b*Rc (Rufino et al. 1993, Regiao 1:
a=18,64; b=5,73); R = soma dos 12 EI_mes; resultado multiplicado por g=9,80665 (hipotese
testada aqui: conversao kgf.m -> J). Compara com o Quadro 1 de Waltrick por nome de municipio
(so vale quando a estacao usada por Waltrick coincide com a do IAT: ver coluna razao).
"""
import pandas as pd, numpy as np, unicodedata
A, B, G = 18.64, 5.73, 9.81  # 9,81 reproduz Waltrick a <0,04%; 9,80665 daria -0,00%+0,03%
m = pd.read_csv("docs/verificacoes/pluviometria_iat_mensal.csv", sep=";")
est = pd.read_csv("docs/verificacoes/pluviometria_iat_estacoes.csv", sep=";")
w = pd.read_csv("docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/waltrick2015_quadro1_R_anual.csv", comment="#")
norm = lambda s: unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower().strip()
w["k"] = w.localidade.map(norm)
m = m[(m.ano >= 1986) & (m.ano <= 2008)]
rows = []
for cod, g in m.groupby("codigo"):
    full = [h.sort_values("mes").chuva_mm.values for _, h in g.groupby("ano") if len(h) == 12 and h.chuva_mm.notna().all()]
    if len(full) < 15: continue
    pm = np.mean(full, axis=0); P = pm.sum()
    ei = A + B * pm**2 / P
    rows.append(dict(codigo=cod, anos_completos=len(full), P_mm=P, EI_anual_sem_fator=ei.sum(), R_com_g=G * ei.sum()))
r = pd.DataFrame(rows).merge(est[["codigo", "nome", "municipio"]], on="codigo")
r["k"] = r.municipio.map(norm)
r = r.merge(w[["k", "R_MJ_mm_ha_h_ano"]], on="k", how="left")
r["razao_waltrick_sobre_EI"] = r.R_MJ_mm_ha_h_ano / r.EI_anual_sem_fator
r["dif_pct_com_g"] = 100 * (r.R_com_g / r.R_MJ_mm_ha_h_ano - 1)
r = r.drop(columns="k")
pd.set_option("display.width", 250)
print(r.round(3).to_string())
x = r.razao_waltrick_sobre_EI.dropna()
print("razao: n=%d mediana=%.4f min=%.3f max=%.3f; g=%.5f" % (len(x), x.median(), x.min(), x.max(), G))
exatos = r[(r.dif_pct_com_g.abs() < 0.1)]
print("estacoes com |dif|<0,1%% (provavel mesma estacao de Waltrick): %d" % len(exatos))
r.to_csv("docs/verificacoes/r_rufino_pluviometro_vs_waltrick.csv", sep=";", index=False)
