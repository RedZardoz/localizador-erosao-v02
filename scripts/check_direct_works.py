import json
import sys

with open('data/acervo_sanitizado_111.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

output = []
output.append(f"Total de itens: {len(items)}\n")

output.append("=== OBRAS QUE TRATAM ESPECIFICAMENTE DE EROSÃO LAMINAR / INTERRILL / SHEET EROSION ===")
for it in items:
    t = str(it.get('title', '')).lower()
    fn = str(it.get('fname', '')).lower()
    eixo = str(it.get('eixo', '')).lower()
    if any(k in t or k in fn or k in eixo for k in ['sheet', 'interrill', 'laminar', 'entressulcos']):
        output.append(f"[{it['num']}] Cat: {it['cat']} | Autores: {it['authors']}\n   Título: {it['title']}\n   Arquivo: {it['fname']}\n   Eixo: {it['eixo']}\n")

output.append("\n=== OBRAS DIRETAS (PREDIÇÃO COM MACHINE LEARNING) ===")
for it in items:
    if it.get('cat') == 'Direta':
        output.append(f"[{it['num']}] {it['authors']} | {it['title']} ({it['fname']})")

with open('data/analise_obras_lacuna.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output))

print("Arquivo salvo em data/analise_obras_lacuna.txt")
