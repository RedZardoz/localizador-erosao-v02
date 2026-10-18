import unittest
import os
import sys
import tempfile
import subprocess
import hashlib
from pathlib import Path

SCRIPT_PATH = str(Path(__file__).resolve().parent / "verificar_integridade_pacote.py")

def _sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

class TestVerificarIntegridadePacote(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        # Arquivos padrão
        self.f1 = self.dir / "01_dados.csv"
        self.f1.write_bytes(b"col1,col2\n1,2\n")
        self.f2 = self.dir / "02_notas.txt"
        self.f2.write_bytes(b"texto de teste\n")
        self.manifesto = self.dir / "06_manifesto_integridade_sha256.txt"

    def tearDown(self):
        self.tmp.cleanup()

    def _executar(self, *args):
        cmd = [sys.executable, SCRIPT_PATH]
        if args:
            cmd.extend(args)
        else:
            cmd.append(str(self.dir))
        res = subprocess.run(cmd, capture_output=True, text=True)
        return res.returncode, res.stdout, res.stderr

    def test_01_pacote_integro_retorna_0_e_confirma(self):
        conteudo = f"{_sha256(self.f1.read_bytes())}  01_dados.csv\n{_sha256(self.f2.read_bytes())}  02_notas.txt\n"
        self.manifesto.write_text(conteudo, encoding="utf-8")
        code, stdout, stderr = self._executar()
        self.assertEqual(code, 0, f"stdout: {stdout}, stderr: {stderr}")
        self.assertIn("RESULTADO: INTEGRIDADE CONFIRMADA", stdout)
        self.assertIn("2 arquivos", stdout)

    def test_02_um_byte_alterado_retorna_1_e_cita_arquivo(self):
        conteudo = f"{_sha256(self.f1.read_bytes())}  01_dados.csv\n{_sha256(self.f2.read_bytes())}  02_notas.txt\n"
        self.manifesto.write_text(conteudo, encoding="utf-8")
        # Corrompe um byte de 01_dados.csv
        self.f1.write_bytes(b"col1,col2\n1,3\n")
        code, stdout, stderr = self._executar()
        self.assertEqual(code, 1, f"stdout: {stdout}, stderr: {stderr}")
        self.assertIn("RESULTADO: FALHA DE INTEGRIDADE", stdout)
        self.assertIn("01_dados.csv", stdout)

    def test_03_arquivo_listado_ausente_retorna_1_e_cita_arquivo(self):
        conteudo = f"{_sha256(self.f1.read_bytes())}  01_dados.csv\n{_sha256(self.f2.read_bytes())}  02_notas.txt\n"
        self.manifesto.write_text(conteudo, encoding="utf-8")
        self.f2.unlink()
        code, stdout, stderr = self._executar()
        self.assertEqual(code, 1, f"stdout: {stdout}, stderr: {stderr}")
        self.assertIn("RESULTADO: FALHA DE INTEGRIDADE", stdout)
        self.assertIn("02_notas.txt", stdout)

    def test_04_manifesto_ausente_retorna_2(self):
        code, stdout, stderr = self._executar()
        self.assertEqual(code, 2, f"stdout: {stdout}, stderr: {stderr}")
        self.assertIn("RESULTADO: FALHA DE INTEGRIDADE", stdout + stderr)

    def test_05_manifesto_sem_entradas_retorna_2(self):
        self.manifesto.write_text("", encoding="utf-8")
        code, stdout, stderr = self._executar()
        self.assertEqual(code, 2, f"stdout: {stdout}, stderr: {stderr}")
        self.assertIn("RESULTADO: FALHA DE INTEGRIDADE", stdout + stderr)

    def test_06_hash_com_tamanho_errado_retorna_2(self):
        conteudo = "abcdef  01_dados.csv\n"
        self.manifesto.write_text(conteudo, encoding="utf-8")
        code, stdout, stderr = self._executar()
        self.assertEqual(code, 2, f"stdout: {stdout}, stderr: {stderr}")
        self.assertIn("RESULTADO: FALHA DE INTEGRIDADE", stdout + stderr)

    def test_07_nome_com_ponto_ponto_e_absoluto_retorna_2(self):
        # Caminho relativo com ..
        h = "a" * 64
        self.manifesto.write_text(f"{h}  ../fora.txt\n", encoding="utf-8")
        code, stdout, stderr = self._executar()
        self.assertEqual(code, 2, f"stdout: {stdout}, stderr: {stderr}")
        self.assertIn("RESULTADO: FALHA DE INTEGRIDADE", stdout + stderr)

        # Caminho absoluto
        self.manifesto.write_text(f"{h}  /etc/passwd\n", encoding="utf-8")
        code, stdout, stderr = self._executar()
        self.assertEqual(code, 2, f"stdout: {stdout}, stderr: {stderr}")
        self.assertIn("RESULTADO: FALHA DE INTEGRIDADE", stdout + stderr)

    def test_08_manifesto_com_crlf_retorna_0(self):
        conteudo = f"{_sha256(self.f1.read_bytes())}  01_dados.csv\r\n{_sha256(self.f2.read_bytes())}  02_notas.txt\r\n"
        self.manifesto.write_bytes(conteudo.encode("utf-8"))
        code, stdout, stderr = self._executar()
        self.assertEqual(code, 0, f"stdout: {stdout}, stderr: {stderr}")
        self.assertIn("RESULTADO: INTEGRIDADE CONFIRMADA", stdout)

    def test_09_formato_com_asterisco_retorna_0(self):
        conteudo = f"{_sha256(self.f1.read_bytes())} *01_dados.csv\n{_sha256(self.f2.read_bytes())} *02_notas.txt\n"
        self.manifesto.write_text(conteudo, encoding="utf-8")
        code, stdout, stderr = self._executar()
        self.assertEqual(code, 0, f"stdout: {stdout}, stderr: {stderr}")
        self.assertIn("RESULTADO: INTEGRIDADE CONFIRMADA", stdout)

    def test_10_hash_em_maiusculas_retorna_0(self):
        h1 = _sha256(self.f1.read_bytes()).upper()
        h2 = _sha256(self.f2.read_bytes()).upper()
        conteudo = f"{h1}  01_dados.csv\n{h2}  02_notas.txt\n"
        self.manifesto.write_text(conteudo, encoding="utf-8")
        code, stdout, stderr = self._executar()
        self.assertEqual(code, 0, f"stdout: {stdout}, stderr: {stderr}")
        self.assertIn("RESULTADO: INTEGRIDADE CONFIRMADA", stdout)

    def test_11_arquivo_extra_retorna_0_com_aviso(self):
        conteudo = f"{_sha256(self.f1.read_bytes())}  01_dados.csv\n"
        self.manifesto.write_text(conteudo, encoding="utf-8")
        # f2 existe no diretório mas não está no manifesto
        code, stdout, stderr = self._executar()
        self.assertEqual(code, 0, f"stdout: {stdout}, stderr: {stderr}")
        self.assertIn("RESULTADO: INTEGRIDADE CONFIRMADA", stdout)
        self.assertIn("AVISO: arquivo não listado no manifesto: 02_notas.txt", stdout)
        self.assertIn("1 arquivos não listados", stdout)

    def test_12_manifesto_so_com_comentarios_retorna_2(self):
        conteudo = "# manifesto apenas com comentarios\n# linha 2\n\n"
        self.manifesto.write_text(conteudo, encoding="utf-8")
        code, stdout, stderr = self._executar()
        self.assertEqual(code, 2, f"stdout: {stdout}, stderr: {stderr}")
        self.assertIn("RESULTADO: FALHA DE INTEGRIDADE", stdout + stderr)

if __name__ == "__main__":
    unittest.main()
