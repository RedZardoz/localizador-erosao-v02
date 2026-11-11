from PIL import Image, ImageEnhance
import os
base = r"C:\Users\lalfr\Docs Fora do Ar\LUIS ALFREDO\01 - MESTRADO PPGTCA 2026\02 - PESQUISA EROSÃO LAMINAR\geolocalizacao-erosao-propriedade"
src = os.path.join(base, "docs", "figuras", "interface", "01-tela-principal.png")
out = os.path.join(base, "docs", "assets")
os.makedirs(out, exist_ok=True)
im = Image.open(src).convert("RGB")
print("source", im.size)
specs = {
  "satelite-projeto.jpg": ((390, 120, 1900, 760), (1500, 640)),
  "satelite-amostragem.jpg": ((650, 150, 1500, 760), (1200, 860)),
  "satelite-campo.jpg": ((850, 220, 1350, 720), (900, 900)),
}
for name, (box, size) in specs.items():
    crop = im.crop(box).resize(size, Image.LANCZOS)
    crop = ImageEnhance.Contrast(crop).enhance(1.05)
    p = os.path.join(out, name)
    crop.save(p, "JPEG", quality=88, optimize=True)
    print(name, crop.size, os.path.getsize(p))
