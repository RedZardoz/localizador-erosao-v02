using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace SarelVitrineLauncher
{
    public class VitrineHttpServer : IDisposable
    {
        private readonly Dictionary<string, byte[]> arquivos;
        private TcpListener listener;
        private volatile bool ativo;
        private Thread acceptThread;

        public int Porta { get; private set; }
        public string UrlBase
        {
            get { return string.Format("http://127.0.0.1:{0}/", Porta); }
        }
        public int TotalArquivos
        {
            get { return arquivos.Count; }
        }

        public VitrineHttpServer(Dictionary<string, byte[]> arquivosEmMemoria)
        {
            arquivos = arquivosEmMemoria;
            listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            Porta = ((IPEndPoint)listener.LocalEndpoint).Port;
            ativo = true;

            acceptThread = new Thread(AceitarConexoes)
            {
                IsBackground = true,
                Name = "VitrineHttpAcceptThread"
            };
            acceptThread.Start();
        }

        private void AceitarConexoes()
        {
            while (ativo)
            {
                TcpClient client = null;
                try
                {
                    client = listener.AcceptTcpClient();
                }
                catch
                {
                    if (!ativo) break;
                    continue;
                }

                if (client != null)
                {
                    ThreadPool.QueueUserWorkItem(ProcessarCliente, client);
                }
            }
        }

        private void ProcessarCliente(object state)
        {
            TcpClient client = (TcpClient)state;
            try
            {
                client.ReceiveTimeout = 5000;
                client.SendTimeout = 10000;
                using (NetworkStream stream = client.GetStream())
                {
                    string requestLine = LerLinhaRequisicao(stream);
                    if (string.IsNullOrEmpty(requestLine)) return;

                    string[] partes = requestLine.Split(' ');
                    string metodo = partes.Length >= 1 ? partes[0].ToUpperInvariant() : "GET";
                    string alvoRaw = partes.Length >= 2 ? partes[1] : "/";

                    if (metodo != "GET" && metodo != "HEAD")
                    {
                        EnviarResposta(stream, 405, "Method Not Allowed", "text/plain; charset=utf-8",
                            Encoding.UTF8.GetBytes("Method Not Allowed"), metodo == "HEAD");
                        return;
                    }

                    int idxQuery = alvoRaw.IndexOf('?');
                    if (idxQuery >= 0) alvoRaw = alvoRaw.Substring(0, idxQuery);

                    string caminhoDecodificado = Uri.UnescapeDataString(alvoRaw ?? "/").Replace('\\', '/');
                    if (caminhoDecodificado.Contains(".."))
                    {
                        EnviarResposta(stream, 403, "Forbidden", "text/plain; charset=utf-8",
                            Encoding.UTF8.GetBytes("Forbidden"), metodo == "HEAD");
                        return;
                    }

                    string rel = caminhoDecodificado.TrimStart('/');
                    if (string.IsNullOrEmpty(rel))
                    {
                        rel = "index.html";
                    }
                    else if (rel.EndsWith("/", StringComparison.Ordinal))
                    {
                        rel = rel + "index.html";
                    }

                    byte[] payload;
                    string caminhoServido = rel;
                    if (!arquivos.TryGetValue(caminhoServido, out payload))
                    {
                        string comIndex = rel.TrimEnd('/') + "/index.html";
                        if (arquivos.TryGetValue(comIndex, out payload))
                        {
                            caminhoServido = comIndex;
                        }
                        else
                        {
                            byte[] errBytes;
                            string errMime = "text/plain; charset=utf-8";
                            if (arquivos.TryGetValue("404.html", out errBytes))
                            {
                                errMime = "text/html; charset=utf-8";
                            }
                            else
                            {
                                errBytes = Encoding.UTF8.GetBytes("Not Found");
                            }
                            EnviarResposta(stream, 404, "Not Found", errMime, errBytes, metodo == "HEAD");
                            return;
                        }
                    }

                    string mime = ObterMimeType(caminhoServido);
                    EnviarResposta(stream, 200, "OK", mime, payload, metodo == "HEAD");
                }
            }
            catch
            {
                // Ignora quedas normais de socket do navegador
            }
            finally
            {
                try { client.Close(); } catch { }
            }
        }

        private static string LerLinhaRequisicao(NetworkStream stream)
        {
            byte[] buffer = new byte[32768];
            int total = 0;
            while (total < buffer.Length)
            {
                int lidos = stream.Read(buffer, total, buffer.Length - total);
                if (lidos <= 0) break;
                total += lidos;
                string texto = Encoding.ASCII.GetString(buffer, 0, total);
                if (texto.IndexOf("\r\n\r\n", StringComparison.Ordinal) >= 0 ||
                    texto.IndexOf("\n\n", StringComparison.Ordinal) >= 0)
                {
                    int idxCr = texto.IndexOf("\r\n", StringComparison.Ordinal);
                    if (idxCr >= 0) return texto.Substring(0, idxCr);
                    int idxLf = texto.IndexOf('\n');
                    return idxLf >= 0 ? texto.Substring(0, idxLf).TrimEnd('\r') : texto;
                }
            }
            if (total <= 0) return string.Empty;
            string parcial = Encoding.ASCII.GetString(buffer, 0, total);
            int idxFim = parcial.IndexOf("\r\n", StringComparison.Ordinal);
            return idxFim >= 0 ? parcial.Substring(0, idxFim) : parcial;
        }

        private static void EnviarResposta(
            NetworkStream stream,
            int statusCode,
            string statusText,
            string contentType,
            byte[] body,
            bool onlyHead)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendFormat("HTTP/1.1 {0} {1}\r\n", statusCode, statusText);
            sb.AppendFormat("Content-Type: {0}\r\n", contentType);
            sb.AppendFormat("Content-Length: {0}\r\n", body.Length);
            sb.Append("Cache-Control: no-store, no-cache, must-revalidate\r\n");
            sb.Append("X-Content-Type-Options: nosniff\r\n");
            sb.Append("Connection: close\r\n");
            sb.Append("\r\n");

            byte[] headerBytes = Encoding.ASCII.GetBytes(sb.ToString());
            stream.Write(headerBytes, 0, headerBytes.Length);
            if (!onlyHead && body.Length > 0)
            {
                stream.Write(body, 0, body.Length);
            }
            stream.Flush();
        }

        private static string ObterMimeType(string caminho)
        {
            string ext = Path.GetExtension(caminho).ToLowerInvariant();
            switch (ext)
            {
                case ".html":
                case ".htm":
                    return "text/html; charset=utf-8";
                case ".js":
                case ".mjs":
                    return "application/javascript; charset=utf-8";
                case ".css":
                    return "text/css; charset=utf-8";
                case ".json":
                    return "application/json; charset=utf-8";
                case ".txt":
                    return "text/plain; charset=utf-8";
                case ".md":
                    return "text/markdown; charset=utf-8";
                case ".svg":
                    return "image/svg+xml";
                case ".png":
                    return "image/png";
                case ".jpg":
                case ".jpeg":
                    return "image/jpeg";
                case ".ico":
                    return "image/x-icon";
                case ".woff":
                    return "font/woff";
                case ".woff2":
                    return "font/woff2";
                default:
                    return "application/octet-stream";
            }
        }

        public void Dispose()
        {
            ativo = false;
            try
            {
                if (listener != null) listener.Stop();
            }
            catch { }
        }
    }

    public class MainForm : Form
    {
        private readonly VitrineHttpServer servidor;
        private Label lblStatusCopia;

        public MainForm(VitrineHttpServer srv)
        {
            servidor = srv;
            InicializarComponentes();
        }

        private void InicializarComponentes()
        {
            this.Text = "[MOCKUP DEMONSTRATIVO] SAREL v2.0 — Demonstração Offline (11/11/2026)";
            this.Size = new Size(560, 355);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(248, 250, 252);
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            try
            {
                this.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch { }

            Panel header = new Panel
            {
                Dock = DockStyle.Top,
                Height = 72,
                BackColor = Color.FromArgb(15, 23, 42)
            };

            Label lblBadge = new Label
            {
                Text = "MOCKUP DEMONSTRATIVO • OFFLINE",
                ForeColor = Color.FromArgb(24, 24, 27),
                BackColor = Color.FromArgb(245, 158, 11),
                Font = new Font("Segoe UI", 7.5f, FontStyle.Bold),
                Location = new Point(20, 12),
                Padding = new Padding(6, 2, 6, 2),
                AutoSize = true
            };

            Label lblTitle = new Label
            {
                Text = "SAREL v2.0 — Interface Estática (PPGTCA 2026)",
                ForeColor = Color.White,
                Font = new Font("Segoe UI Semibold", 12.5f, FontStyle.Bold),
                Location = new Point(20, 36),
                AutoSize = true
            };

            header.Controls.Add(lblBadge);
            header.Controls.Add(lblTitle);
            this.Controls.Add(header);

            Panel avisoBox = new Panel
            {
                Location = new Point(20, 88),
                Size = new Size(504, 118),
                BackColor = Color.FromArgb(255, 251, 235),
                BorderStyle = BorderStyle.FixedSingle
            };

            Label lblAviso = new Label
            {
                Location = new Point(12, 10),
                Size = new Size(480, 98),
                Font = new Font("Segoe UI", 9f, FontStyle.Regular),
                ForeColor = Color.FromArgb(120, 53, 15),
                Text = string.Format(
                    "Servidor local autônomo em memória ativo: {0} ({1} arquivos embutidos).\n\n" +
                    "• Estado retratado: 11/11/2026 • Dados 100% sintéticos (SINTETICO_NAO_VOAR_).\n" +
                    "• Zero rede externa, zero credenciais, zero rotas de API e operação desabilitada.\n" +
                    "• Mantenha esta janela aberta durante a navegação no navegador; ao fechá-la, o servidor local é encerrado.",
                    servidor.UrlBase,
                    servidor.TotalArquivos)
            };
            avisoBox.Controls.Add(lblAviso);
            this.Controls.Add(avisoBox);

            lblStatusCopia = new Label
            {
                Location = new Point(20, 214),
                Size = new Size(504, 20),
                Font = new Font("Consolas", 8.5f, FontStyle.Regular),
                ForeColor = Color.FromArgb(71, 85, 105),
                Text = "URL local: " + servidor.UrlBase
            };
            this.Controls.Add(lblStatusCopia);

            Button btnAbrir = new Button
            {
                Text = "Abrir / Reabrir no Navegador",
                Font = new Font("Segoe UI Semibold", 9.5f, FontStyle.Bold),
                BackColor = Color.FromArgb(5, 150, 105),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Location = new Point(20, 246),
                Size = new Size(218, 42),
                Cursor = Cursors.Hand
            };
            btnAbrir.FlatAppearance.BorderSize = 0;
            btnAbrir.Click += (s, e) => Program.AbrirNoNavegador(servidor.UrlBase);
            this.Controls.Add(btnAbrir);

            Button btnCopiar = new Button
            {
                Text = "Copiar URL",
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                BackColor = Color.FromArgb(226, 232, 240),
                ForeColor = Color.FromArgb(30, 41, 59),
                FlatStyle = FlatStyle.Flat,
                Location = new Point(248, 246),
                Size = new Size(118, 42),
                Cursor = Cursors.Hand
            };
            btnCopiar.FlatAppearance.BorderSize = 0;
            btnCopiar.Click += (s, e) =>
            {
                try
                {
                    Clipboard.SetText(servidor.UrlBase);
                    lblStatusCopia.Text = "URL copiada: " + servidor.UrlBase;
                }
                catch { }
            };
            this.Controls.Add(btnCopiar);

            Button btnEncerrar = new Button
            {
                Text = "Encerrar Demonstração",
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                BackColor = Color.FromArgb(225, 29, 72),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Location = new Point(376, 246),
                Size = new Size(148, 42),
                Cursor = Cursors.Hand
            };
            btnEncerrar.FlatAppearance.BorderSize = 0;
            btnEncerrar.Click += (s, e) => this.Close();
            this.Controls.Add(btnEncerrar);
        }
    }

    internal static class Program
    {
        private static Dictionary<string, byte[]> CarregarPayloadEmMemoria()
        {
            Assembly asm = Assembly.GetExecutingAssembly();
            using (Stream resourceStream = asm.GetManifestResourceStream("VitrinePayload.zip"))
            {
                if (resourceStream == null)
                {
                    throw new InvalidOperationException("Recurso embutido VitrinePayload.zip não encontrado no executável.");
                }

                Dictionary<string, byte[]> mapa = new Dictionary<string, byte[]>(StringComparer.Ordinal);
                using (ZipArchive zip = new ZipArchive(resourceStream, ZipArchiveMode.Read))
                {
                    foreach (ZipArchiveEntry entry in zip.Entries)
                    {
                        if (string.IsNullOrEmpty(entry.Name) && entry.FullName.EndsWith("/", StringComparison.Ordinal))
                        {
                            continue;
                        }
                        string chave = entry.FullName.Replace('\\', '/').TrimStart('/');
                        using (Stream es = entry.Open())
                        using (MemoryStream ms = new MemoryStream())
                        {
                            es.CopyTo(ms);
                            mapa[chave] = ms.ToArray();
                        }
                    }
                }
                return mapa;
            }
        }

        internal static void AbrirNoNavegador(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch
            {
                MessageBox.Show(
                    "Não foi possível abrir o navegador automaticamente.\nAcesse manualmente no navegador:\n\n" + url,
                    "SAREL — Mockup Demonstrativo",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
            }
        }

        [STAThread]
        private static int Main(string[] args)
        {
            bool modoHeadless = args != null && args.Length > 0 &&
                string.Equals(args[0], "--headless-server", StringComparison.OrdinalIgnoreCase);

            Dictionary<string, byte[]> arquivos = CarregarPayloadEmMemoria();
            using (VitrineHttpServer servidor = new VitrineHttpServer(arquivos))
            {
                if (modoHeadless)
                {
                    Console.WriteLine("LISTENING=" + servidor.UrlBase);
                    Console.WriteLine("FILES=" + servidor.TotalArquivos);
                    Console.Out.Flush();
                    // Aguarda encerramento via EOF no stdin ou sinal externo do verificador
                    while (Console.In.Read() != -1) { }
                    return 0;
                }

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                AbrirNoNavegador(servidor.UrlBase);
                using (MainForm form = new MainForm(servidor))
                {
                    Application.Run(form);
                }
            }
            return 0;
        }
    }
}
