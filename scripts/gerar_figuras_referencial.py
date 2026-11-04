import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.makedirs('docs/dissertacao/figuras_referencial', exist_ok=True)
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#333333'

# 2. Figura 2: Confluencia dos Elementos
fig, ax = plt.subplots(figsize=(7, 7), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis('off')

c1 = patches.Circle((4.0, 6.2), 2.2, ec='#1B365D', fc='#93C5FD', alpha=0.5, lw=2)
c2 = patches.Circle((6.0, 6.2), 2.2, ec='#B45309', fc='#FDE68A', alpha=0.5, lw=2)
c3 = patches.Circle((5.0, 4.2), 2.2, ec='#0D9488', fc='#99F6E4', alpha=0.5, lw=2)
ax.add_patch(c1)
ax.add_patch(c2)
ax.add_patch(c3)

ax.text(2.9, 7.0, 'Erosão Laminar\ne Modelagem\nFísica (RUSLE)', ha='center', va='center', fontsize=9, fontweight='bold', color='#1E3A8A')
ax.text(7.1, 7.0, 'Sensoriamento\nRemoto Multifonte\n(S2, Planet, VANT)', ha='center', va='center', fontsize=9, fontweight='bold', color='#92400E')
ax.text(5.0, 2.7, 'Machine Learning\ne Validação Espacial\n(XGBoost, Block CV)', ha='center', va='center', fontsize=9, fontweight='bold', color='#115E59')

ax.text(5.0, 5.5, '"AND"', ha='center', va='center', fontsize=12, fontweight='bold', color='#DC2626')

ax.annotate('', xy=(5.0, 1.4), xytext=(5.0, 2.1), arrowprops=dict(facecolor='#DC2626', edgecolor='#DC2626', width=2.5, headwidth=8))
bx_res = patches.FancyBboxPatch((1.8, 0.4), 6.4, 0.85, boxstyle='round,pad=0.1', ec='#DC2626', fc='#FEF2F2', lw=1.5)
ax.add_patch(bx_res)
ax.text(5.0, 0.82, 'Lacuna de Pesquisa: 0 a 1 artigo com\nvalidação cega centimétrica e desassociação de preditores', ha='center', va='center', fontsize=8, fontweight='bold', color='#B91C1C')

plt.tight_layout()
fig.savefig('docs/dissertacao/figuras_referencial/figura_2_confluencia_elementos.png', dpi=300, bbox_inches='tight')
plt.close()

# 3. Figura 3: Escopo da Pesquisa
fig, ax = plt.subplots(figsize=(7.5, 7.5), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis('off')

e_outer = patches.Ellipse((5, 5), 9.2, 8.5, ec='#374151', fc='#F9FAFB', lw=2, linestyle='--')
ax.add_patch(e_outer)
ax.text(5, 9.0, 'Ambiente de Produção Agrícola — Bacia do Paraná III (BP3)', ha='center', va='center', fontsize=10.5, fontweight='bold', color='#111827')

ax.text(1.2, 7.2, 'Solos Tropicais:\nLatossolos e\nNitossolos Eutróficos', ha='left', va='center', fontsize=8, color='#4B5563')
ax.text(8.8, 7.2, 'Manejo Conservacionista:\nPlantio Direto,\nPalhada e Solo Nu', ha='right', va='center', fontsize=8, color='#4B5563')
ax.text(1.2, 3.0, 'Relevo Ondulado:\nDeclividade 3% a 20%\n(Fator LS Crítico)', ha='left', va='center', fontsize=8, color='#4B5563')
ax.text(8.8, 3.0, 'Estrutura Fundiária:\nMalha SICAR / CAR,\nLimites de Talhão', ha='right', va='center', fontsize=8, color='#4B5563')

c_a = patches.Circle((4.2, 5.5), 1.9, ec='#1B365D', fc='#BFDBFE', alpha=0.6, lw=1.5)
c_b = patches.Circle((5.8, 5.5), 1.9, ec='#B45309', fc='#FED7AA', alpha=0.6, lw=1.5)
c_c = patches.Circle((5.0, 4.0), 1.9, ec='#0D9488', fc='#99F6E4', alpha=0.6, lw=1.5)
ax.add_patch(c_a)
ax.add_patch(c_b)
ax.add_patch(c_c)

ax.text(3.5, 6.2, 'Modelagem\nFísica (RUSLE)', ha='center', va='center', fontsize=8.5, fontweight='bold', color='#1E3A8A')
ax.text(6.5, 6.2, 'Sensoriamento\nRemoto (S2/VANT)', ha='center', va='center', fontsize=8.5, fontweight='bold', color='#9A3412')
ax.text(5.0, 2.7, 'Machine Learning\n(XGBoost / Tweedie)', ha='center', va='center', fontsize=8.5, fontweight='bold', color='#115E59')

c_center = patches.Circle((5.0, 5.0), 0.9, ec='#7C3AED', fc='#EDE9FE', alpha=0.9, lw=1.5)
ax.add_patch(c_center)
ax.text(5.0, 5.0, 'Ambiente de\nPesquisa\nSAREL', ha='center', va='center', fontsize=8, fontweight='bold', color='#5B21B6')

plt.tight_layout()
fig.savefig('docs/dissertacao/figuras_referencial/figura_3_escopo_pesquisa.png', dpi=300, bbox_inches='tight')
plt.close()

# 4. Figura 4: Palavras-chave da Pesquisa (Triangular graph)
fig, ax = plt.subplots(figsize=(7, 6.5), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 9)
ax.axis('off')

n1 = patches.FancyBboxPatch((2.6, 6.8), 4.8, 1.4, boxstyle='round,pad=0.15', ec='#1B365D', fc='#EFF6FF', lw=2)
n2 = patches.FancyBboxPatch((0.4, 1.2), 4.0, 1.4, boxstyle='round,pad=0.15', ec='#B45309', fc='#FFF7ED', lw=2)
n3 = patches.FancyBboxPatch((5.6, 1.2), 4.0, 1.4, boxstyle='round,pad=0.15', ec='#0D9488', fc='#F0FDFA', lw=2)
ax.add_patch(n1)
ax.add_patch(n2)
ax.add_patch(n3)

ax.text(5.0, 7.5, 'Erosão Laminar e\nModelagem Física (RUSLE)', ha='center', va='center', fontsize=9.5, fontweight='bold', color='#1E3A8A')
ax.text(2.4, 1.9, 'Sensoriamento Remoto\nMultifonte (S2, VANT)', ha='center', va='center', fontsize=9, fontweight='bold', color='#9A3412')
ax.text(7.6, 1.9, 'Machine Learning e\nExplicabilidade (XGBoost)', ha='center', va='center', fontsize=9, fontweight='bold', color='#115E59')

ax.annotate('', xy=(2.4, 2.7), xytext=(3.8, 6.7), arrowprops=dict(arrowstyle='<->', color='#1B365D', lw=2))
ax.text(2.6, 5.0, '"AND"', ha='center', va='center', fontsize=10, fontweight='bold', color='#1B365D', bbox=dict(boxstyle='square,pad=0.2', fc='white', ec='#1B365D', lw=1))

ax.annotate('', xy=(7.6, 2.7), xytext=(6.2, 6.7), arrowprops=dict(arrowstyle='<->', color='#0D9488', lw=2))
ax.text(7.4, 5.0, '"AND"', ha='center', va='center', fontsize=10, fontweight='bold', color='#0D9488', bbox=dict(boxstyle='square,pad=0.2', fc='white', ec='#0D9488', lw=1))

ax.annotate('', xy=(5.5, 1.9), xytext=(4.5, 1.9), arrowprops=dict(arrowstyle='<->', color='#B45309', lw=2))
ax.text(5.0, 1.9, '"AND"', ha='center', va='center', fontsize=10, fontweight='bold', color='#B45309', bbox=dict(boxstyle='square,pad=0.2', fc='white', ec='#B45309', lw=1))

plt.tight_layout()
fig.savefig('docs/dissertacao/figuras_referencial/figura_4_palavras_chave.png', dpi=300, bbox_inches='tight')
plt.close()

# 5. Figura 5: Funil de Filtragem
fig, ax = plt.subplots(figsize=(8, 8.5), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 11)
ax.axis('off')

stages = [
    ('Total de artigos pesquisados nas bases científicas — 1.850', 9.5, 8.4, '#1E40AF', '#DBEAFE'),
    ('Total de artigos não repetidos (após remoção de duplicidades) — 1.140', 7.5, 7.4, '#1D4ED8', '#EFF6FF'),
    ('Total de artigos pós-leitura dos títulos (relevância preliminar) — 410', 5.5, 6.4, '#047857', '#D1FAE5'),
    ('Total de artigos pós-leitura dos resumos (aderência metodológica) — 145', 3.5, 5.4, '#B45309', '#FEF3C7'),
    ('Total de artigos pós-leitura completa e auditoria forense — 112', 1.5, 6.8, '#4338CA', '#EEF2FF'),
]

for label, y, width, ec_c, fc_c in stages:
    bx = patches.FancyBboxPatch((5 - width/2, y - 0.55), width, 1.1, boxstyle='round,pad=0.15', ec=ec_c, fc=fc_c, lw=2)
    ax.add_patch(bx)
    ax.text(5, y, label, ha='center', va='center', fontsize=8.5, fontweight='bold', color=ec_c)

for y_top, y_bot in [(8.95, 8.05), (6.95, 6.05), (4.95, 4.05), (2.95, 2.05)]:
    ax.annotate('', xy=(5, y_bot), xytext=(5, y_top), arrowprops=dict(facecolor='#4B5563', edgecolor='#4B5563', width=2, headwidth=6))

p_det = patches.FancyBboxPatch((0.8, 0.1), 8.4, 0.65, boxstyle='round,pad=0.1', ec='#4338CA', fc='white', lw=1, linestyle=':')
ax.add_patch(p_det)
ax.text(5, 0.42, '35 Diretamente Relacionadas  |  53 Relacionadas (RUSLE/SIG)  |  22 Em Triagem (CAR/PPGTCA)  |  2 Seminais', ha='center', va='center', fontsize=7.5, fontweight='bold', color='#374151')

plt.tight_layout()
fig.savefig('docs/dissertacao/figuras_referencial/figura_5_funil_filtragem.png', dpi=300, bbox_inches='tight')
plt.close()

print('Figuras geradas com sucesso.')
