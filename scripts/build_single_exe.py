# -*- coding: utf-8 -*-
"""
Construtor do executável único auto-suficiente (Instalador_SAREL.exe).
Compacta o código completo da aplicação (src, public, scripts, assets, configurações)
em um recurso SarelPayload.zip e compila dentro do próprio Instalador_SAREL.exe.
"""

import os
import subprocess
import sys
import zipfile


def main() -> int:
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    dist_dir = os.path.join(root_dir, "dist")
    os.makedirs(dist_dir, exist_ok=True)

    payload_zip = os.path.join(dist_dir, "SarelPayload.zip")

    pastas_incluir = ["src", "public", "scripts", "assets"]
    arquivos_raiz = [
        "package.json",
        "package-lock.json",
        "next.config.mjs",
        "postcss.config.mjs",
        "tailwind.config.ts",
        "tsconfig.json",
        "vitest.config.mts",
        "requirements.txt",
        "config_instalador.json",
        "Iniciar_Localizador_Erosao.bat",
        "Instalar_Atalho_Windows.bat",
        "Desinstalar_Atalho_Windows.bat",
        ".eslintrc.json",
    ]

    print("[1/2] Empacotando codigo-fonte do SAREL em SarelPayload.zip...")
    with zipfile.ZipFile(payload_zip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for arq in arquivos_raiz:
            caminho = os.path.join(root_dir, arq)
            if os.path.exists(caminho):
                zf.write(caminho, arcname=arq)

        for pasta in pastas_incluir:
            pasta_abs = os.path.join(root_dir, pasta)
            if not os.path.exists(pasta_abs):
                continue
            for dirpath, dirnames, filenames in os.walk(pasta_abs):
                dirnames[:] = [d for d in dirnames if d not in ("__pycache__", ".git")]
                for fn in filenames:
                    if fn.endswith((".pyc", ".pyo")):
                        continue
                    full_p = os.path.join(dirpath, fn)
                    rel_p = os.path.relpath(full_p, root_dir).replace("\\", "/")
                    zf.write(full_p, arcname=rel_p)

    tam_payload_kb = os.path.getsize(payload_zip) / 1024.0
    print(f"      -> Payload gerado: {tam_payload_kb:.1f} KB")

    csc_exe = r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
    cs_file = os.path.join(root_dir, "scripts", "installer", "InstaladorSAREL.cs")
    out_exe = os.path.join(root_dir, "Instalador_SAREL.exe")
    icon_file = os.path.join(root_dir, "assets", "icon.ico")

    print("[2/2] Compilando Instalador_SAREL.exe (Arquivo Unico com Payload Embutido)...")
    cmd = [
        csc_exe,
        "/target:winexe",
        f"/out:{out_exe}",
        f"/win32icon:{icon_file}",
        f"/resource:{payload_zip},SarelPayload.zip",
        "/r:System.Windows.Forms.dll",
        "/r:System.Drawing.dll",
        "/r:System.IO.Compression.dll",
        "/r:System.IO.Compression.FileSystem.dll",
        cs_file,
    ]
    res = subprocess.run(cmd, cwd=root_dir, capture_output=True, text=True)
    if res.returncode != 0:
        print(res.stdout)
        print(res.stderr)
        return res.returncode

    tam_exe_mb = os.path.getsize(out_exe) / (1024.0 * 1024.0)
    print(f"[SUCESSO] Instalador_SAREL.exe compilado ({tam_exe_mb:.2f} MB)!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
