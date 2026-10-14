using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows.Forms;

namespace SarelInstaller
{
    public class MainForm : Form
    {
        private const string OFFICIAL_GDRIVE_URL = "https://drive.google.com/drive/folders/1S6UsUYGM3dUh7w_hLrmvcsuh0nSfjyYR?usp=sharing";

        private string currentExeDir;
        private string targetInstallDir;
        private string configPath;

        private TextBox txtInstallDir;
        private Label lblNodeStatus;
        private Label lblPythonStatus;
        private Label lblDbStatus;
        private TextBox txtGDriveFolder;
        private TextBox txtGDriveFile;
        private ProgressBar progressBar;
        private Label lblProgress;
        private Button btnInstallSystem;
        private Button btnDownloadDb;
        private Button btnOpenGDrive;
        private Button btnOpenDataFolder;
        private Button btnLaunchApp;

        public MainForm()
        {
            currentExeDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');

            // Se o .exe foi aberto na pasta do projeto já extraída, usa a própria pasta.
            // Se o usuário recebeu APENAS o arquivo Instalador_SAREL.exe avulso (ex.: em Downloads),
            // instala automaticamente em C:\SAREL.
            if (File.Exists(Path.Combine(currentExeDir, "package.json")) &&
                File.Exists(Path.Combine(currentExeDir, "Iniciar_Localizador_Erosao.bat")))
            {
                targetInstallDir = currentExeDir;
            }
            else
            {
                targetInstallDir = @"C:\SAREL";
            }

            configPath = Path.Combine(targetInstallDir, "config_instalador.json");

            InitializeComponents();
            CarregarConfiguracao();
            AtualizarDiagnostico();
        }

        private void InitializeComponents()
        {
            this.Text = "Instalador Autônomo (Arquivo Único) — SAREL v2.0 (PPGTCA 2026)";
            this.Size = new Size(750, 645);
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

            // Cabeçalho
            Panel header = new Panel
            {
                Dock = DockStyle.Top,
                Height = 76,
                BackColor = Color.FromArgb(15, 23, 42)
            };
            Label lblTitle = new Label
            {
                Text = "SAREL — Instalador Completo e Bancos do Google Drive",
                ForeColor = Color.White,
                Font = new Font("Segoe UI Semibold", 14f, FontStyle.Bold),
                Location = new Point(20, 14),
                AutoSize = true
            };
            Label lblSub = new Label
            {
                Text = "Executável Autônomo com o Sistema Embutido + Diretório Oficial do Google Drive (PPGTCA 2026)",
                ForeColor = Color.FromArgb(148, 163, 184),
                Font = new Font("Segoe UI", 9f, FontStyle.Regular),
                Location = new Point(22, 44),
                AutoSize = true
            };
            header.Controls.Add(lblTitle);
            header.Controls.Add(lblSub);
            this.Controls.Add(header);

            // Seção 1: Instalação do Sistema e Ambiente Local
            GroupBox grpEnv = new GroupBox
            {
                Text = " 1. Instalação do Sistema SAREL no Computador ",
                Font = new Font("Segoe UI Semibold", 10f, FontStyle.Bold),
                ForeColor = Color.FromArgb(30, 41, 59),
                Location = new Point(20, 88),
                Size = new Size(695, 170)
            };

            Label lblDir = new Label
            {
                Text = "Pasta de Instalação do Sistema:",
                Font = new Font("Segoe UI Semibold", 9f),
                Location = new Point(16, 26),
                Size = new Size(210, 20)
            };
            txtInstallDir = new TextBox
            {
                Text = targetInstallDir,
                Font = new Font("Segoe UI", 9f),
                Location = new Point(226, 23),
                Size = new Size(340, 24)
            };
            txtInstallDir.TextChanged += (s, e) =>
            {
                targetInstallDir = txtInstallDir.Text.Trim();
                configPath = Path.Combine(targetInstallDir, "config_instalador.json");
            };

            Button btnBrowse = new Button
            {
                Text = "Alterar...",
                Font = new Font("Segoe UI", 8.5f),
                Location = new Point(574, 22),
                Size = new Size(102, 26),
                BackColor = Color.FromArgb(226, 232, 240),
                FlatStyle = FlatStyle.Flat
            };
            btnBrowse.FlatAppearance.BorderSize = 0;
            btnBrowse.Click += (s, e) =>
            {
                using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                {
                    fbd.SelectedPath = targetInstallDir;
                    if (fbd.ShowDialog() == DialogResult.OK)
                    {
                        txtInstallDir.Text = fbd.SelectedPath;
                    }
                }
            };

            lblNodeStatus = new Label
            {
                Font = new Font("Segoe UI", 9f),
                Location = new Point(16, 56),
                Size = new Size(445, 22)
            };
            lblPythonStatus = new Label
            {
                Font = new Font("Segoe UI", 9f),
                Location = new Point(16, 80),
                Size = new Size(445, 22)
            };
            lblDbStatus = new Label
            {
                Font = new Font("Segoe UI Semibold", 9.2f, FontStyle.Bold),
                Location = new Point(16, 106),
                Size = new Size(660, 22)
            };

            btnInstallSystem = new Button
            {
                Text = "1. Instalar Sistema\ne Criar Atalhos",
                Font = new Font("Segoe UI Semibold", 9.5f, FontStyle.Bold),
                BackColor = Color.FromArgb(37, 99, 235),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Location = new Point(470, 54),
                Size = new Size(206, 48),
                Cursor = Cursors.Hand
            };
            btnInstallSystem.FlatAppearance.BorderSize = 0;
            btnInstallSystem.Click += (s, e) => ExecutarInstalacaoCompleta();

            Label lblHint = new Label
            {
                Text = "Dica: Este executável já traz o código do SAREL embutido. Clique no botão azul para instalar tudo em C:\\SAREL.",
                Font = new Font("Segoe UI", 8.2f),
                ForeColor = Color.FromArgb(100, 116, 139),
                Location = new Point(16, 136),
                Size = new Size(660, 20)
            };

            grpEnv.Controls.Add(lblDir);
            grpEnv.Controls.Add(txtInstallDir);
            grpEnv.Controls.Add(btnBrowse);
            grpEnv.Controls.Add(lblNodeStatus);
            grpEnv.Controls.Add(lblPythonStatus);
            grpEnv.Controls.Add(lblDbStatus);
            grpEnv.Controls.Add(btnInstallSystem);
            grpEnv.Controls.Add(lblHint);
            this.Controls.Add(grpEnv);

            // Seção 2: Google Drive e Bancos de Dados Complementares
            GroupBox grpGDrive = new GroupBox
            {
                Text = " 2. Bancos de Dados Complementares — Diretório Oficial do Google Drive ",
                Font = new Font("Segoe UI Semibold", 10f, FontStyle.Bold),
                ForeColor = Color.FromArgb(30, 41, 59),
                Location = new Point(20, 268),
                Size = new Size(695, 265)
            };

            Label lblDesc = new Label
            {
                Text = "Após instalar o sistema, acesse o diretório recomendado do Google Drive para baixar os bancos de dados\n" +
                       "(Dados INCRA, Dados SICAR, Dados SIGEF, Dados SNCR e fundiario_brasil.db):",
                Font = new Font("Segoe UI", 9f),
                ForeColor = Color.FromArgb(51, 65, 85),
                Location = new Point(16, 26),
                Size = new Size(660, 38)
            };

            Label lblFolderUrl = new Label
            {
                Text = "Diretório Oficial no Google Drive (Dados INCRA, SICAR, SIGEF, SNCR):",
                Font = new Font("Segoe UI Semibold", 9f),
                Location = new Point(16, 68),
                Size = new Size(470, 18)
            };
            txtGDriveFolder = new TextBox
            {
                Font = new Font("Segoe UI", 9f),
                Location = new Point(16, 88),
                Size = new Size(480, 25)
            };
            btnOpenGDrive = new Button
            {
                Text = "Abrir Google Drive",
                Font = new Font("Segoe UI Semibold", 9f),
                BackColor = Color.FromArgb(22, 163, 74),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Location = new Point(505, 86),
                Size = new Size(172, 28),
                Cursor = Cursors.Hand
            };
            btnOpenGDrive.FlatAppearance.BorderSize = 0;
            btnOpenGDrive.Click += (s, e) => AbrirPastaGoogleDrive();

            Label lblFileUrl = new Label
            {
                Text = "Link para Download Automático do Banco Consolidado (fundiario_brasil.db / .zip):",
                Font = new Font("Segoe UI Semibold", 9f),
                Location = new Point(16, 120),
                Size = new Size(480, 18)
            };
            txtGDriveFile = new TextBox
            {
                Font = new Font("Segoe UI", 9f),
                Location = new Point(16, 140),
                Size = new Size(480, 25)
            };
            btnOpenDataFolder = new Button
            {
                Text = "Abrir Pasta 'data\\'",
                Font = new Font("Segoe UI", 9f),
                BackColor = Color.FromArgb(226, 232, 240),
                ForeColor = Color.FromArgb(30, 41, 59),
                FlatStyle = FlatStyle.Flat,
                Location = new Point(505, 138),
                Size = new Size(172, 28),
                Cursor = Cursors.Hand
            };
            btnOpenDataFolder.FlatAppearance.BorderSize = 0;
            btnOpenDataFolder.Click += (s, e) => AbrirPastaDataLocal();

            btnDownloadDb = new Button
            {
                Text = "2. Baixar Banco Automaticamente do Google Drive para a pasta 'data\\'",
                Font = new Font("Segoe UI Semibold", 10f, FontStyle.Bold),
                BackColor = Color.FromArgb(14, 116, 144),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Location = new Point(16, 174),
                Size = new Size(661, 34),
                Cursor = Cursors.Hand
            };
            btnDownloadDb.FlatAppearance.BorderSize = 0;
            btnDownloadDb.Click += (s, e) => IniciarDownloadAutomatico();

            progressBar = new ProgressBar
            {
                Location = new Point(16, 216),
                Size = new Size(661, 16),
                Minimum = 0,
                Maximum = 100,
                Value = 0
            };

            lblProgress = new Label
            {
                Text = "Clique em '1. Instalar Sistema e Criar Atalhos' para iniciar.",
                Font = new Font("Segoe UI", 8.5f),
                ForeColor = Color.FromArgb(71, 85, 105),
                Location = new Point(16, 236),
                Size = new Size(661, 20)
            };

            grpGDrive.Controls.Add(lblDesc);
            grpGDrive.Controls.Add(lblFolderUrl);
            grpGDrive.Controls.Add(txtGDriveFolder);
            grpGDrive.Controls.Add(btnOpenGDrive);
            grpGDrive.Controls.Add(lblFileUrl);
            grpGDrive.Controls.Add(txtGDriveFile);
            grpGDrive.Controls.Add(btnOpenDataFolder);
            grpGDrive.Controls.Add(btnDownloadDb);
            grpGDrive.Controls.Add(progressBar);
            grpGDrive.Controls.Add(lblProgress);
            this.Controls.Add(grpGDrive);

            // Rodapé
            btnLaunchApp = new Button
            {
                Text = "Concluir e Iniciar o SAREL Agora",
                Font = new Font("Segoe UI Semibold", 10.5f, FontStyle.Bold),
                BackColor = Color.FromArgb(15, 23, 42),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Location = new Point(20, 546),
                Size = new Size(525, 42),
                Cursor = Cursors.Hand
            };
            btnLaunchApp.FlatAppearance.BorderSize = 0;
            btnLaunchApp.Click += (s, e) =>
            {
                SalvarConfiguracao();
                string batPath = Path.Combine(targetInstallDir, "Iniciar_Localizador_Erosao.bat");
                if (!File.Exists(batPath))
                {
                    MessageBox.Show(
                        "Clique primeiro no botão '1. Instalar Sistema e Criar Atalhos' para extrair o sistema na pasta de destino.",
                        "Instalação Necessária",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Information
                    );
                    return;
                }
                Process.Start(new ProcessStartInfo
                {
                    FileName = batPath,
                    WorkingDirectory = targetInstallDir,
                    UseShellExecute = true
                });
                this.Close();
            };

            Button btnClose = new Button
            {
                Text = "Fechar",
                Font = new Font("Segoe UI", 9.5f),
                BackColor = Color.FromArgb(226, 232, 240),
                ForeColor = Color.FromArgb(30, 41, 59),
                FlatStyle = FlatStyle.Flat,
                Location = new Point(555, 546),
                Size = new Size(160, 42),
                Cursor = Cursors.Hand
            };
            btnClose.FlatAppearance.BorderSize = 0;
            btnClose.Click += (s, e) =>
            {
                SalvarConfiguracao();
                this.Close();
            };

            this.Controls.Add(btnLaunchApp);
            this.Controls.Add(btnClose);
        }

        private bool ComandoExiste(string cmd)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "where.exe",
                    Arguments = cmd,
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                using (Process p = Process.Start(psi))
                {
                    p.WaitForExit(3000);
                    return p.ExitCode == 0;
                }
            }
            catch { return false; }
        }

        private void AtualizarDiagnostico()
        {
            bool hasPortableNode = File.Exists(Path.Combine(targetInstallDir, "runtime", "node", "node.exe"));
            bool hasSysNode = ComandoExiste("node");
            if (hasPortableNode || hasSysNode)
            {
                lblNodeStatus.Text = "✔ Motor Node.js: Detectado e pronto para execução";
                lblNodeStatus.ForeColor = Color.FromArgb(21, 128, 61);
            }
            else
            {
                lblNodeStatus.Text = "ℹ Motor Node.js: Será instalado automaticamente na Etapa 1";
                lblNodeStatus.ForeColor = Color.FromArgb(37, 99, 235);
            }

            bool hasPortablePy = File.Exists(Path.Combine(targetInstallDir, "runtime", "python", "python.exe"));
            bool hasSysPy = ComandoExiste("python");
            if (hasPortablePy || hasSysPy)
            {
                lblPythonStatus.Text = "✔ Motor Python: Detectado e pronto para execução";
                lblPythonStatus.ForeColor = Color.FromArgb(21, 128, 61);
            }
            else
            {
                lblPythonStatus.Text = "ℹ Motor Python: Será instalado automaticamente na Etapa 1";
                lblPythonStatus.ForeColor = Color.FromArgb(37, 99, 235);
            }

            string dbPath = Path.Combine(targetInstallDir, "data", "fundiario_brasil.db");
            if (File.Exists(dbPath))
            {
                FileInfo fi = new FileInfo(dbPath);
                double mb = fi.Length / (1024.0 * 1024.0);
                lblDbStatus.Text = string.Format("✔ Banco Fundiário Localizado: data\\fundiario_brasil.db ({0:F1} MB)", mb);
                lblDbStatus.ForeColor = Color.FromArgb(21, 128, 61);
            }
            else
            {
                lblDbStatus.Text = "⚠ Banco complementar pendente — Após instalar na Etapa 1, acesse o Google Drive na Etapa 2";
                lblDbStatus.ForeColor = Color.FromArgb(180, 83, 9);
            }
        }

        private void ExtrairPayloadEmbutido(string destFolder)
        {
            Assembly asm = Assembly.GetExecutingAssembly();
            using (Stream s = asm.GetManifestResourceStream("SarelPayload.zip"))
            {
                if (s == null) return;
                if (!Directory.Exists(destFolder)) Directory.CreateDirectory(destFolder);

                string tempZip = Path.Combine(Path.GetTempPath(), "sarel_payload_" + Guid.NewGuid().ToString("N") + ".zip");
                try
                {
                    using (FileStream fs = new FileStream(tempZip, FileMode.Create, FileAccess.Write))
                    {
                        s.CopyTo(fs);
                    }
                    using (ZipArchive archive = ZipFile.OpenRead(tempZip))
                    {
                        foreach (ZipArchiveEntry entry in archive.Entries)
                        {
                            string fullPath = Path.Combine(destFolder, entry.FullName.Replace('/', '\\'));
                            string dir = Path.GetDirectoryName(fullPath);
                            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                            {
                                Directory.CreateDirectory(dir);
                            }
                            if (!string.IsNullOrEmpty(entry.Name))
                            {
                                entry.ExtractToFile(fullPath, true);
                            }
                        }
                    }
                }
                finally
                {
                    if (File.Exists(tempZip))
                    {
                        try { File.Delete(tempZip); } catch { }
                    }
                }
            }

            // Também copia o próprio Instalador_SAREL.exe para dentro da pasta instalada
            try
            {
                string destExe = Path.Combine(destFolder, "Instalador_SAREL.exe");
                if (!string.Equals(Application.ExecutablePath, destExe, StringComparison.OrdinalIgnoreCase))
                {
                    File.Copy(Application.ExecutablePath, destExe, true);
                }
            }
            catch { }
        }

        private void ExecutarComandoSincrono(string cmd, string args, string workDir)
        {
            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = cmd,
                Arguments = args,
                WorkingDirectory = workDir,
                CreateNoWindow = true,
                UseShellExecute = false
            };
            using (Process p = Process.Start(psi))
            {
                p.WaitForExit();
            }
        }

        private void ExecutarInstalacaoCompleta()
        {
            btnInstallSystem.Enabled = false;
            progressBar.Value = 10;
            lblProgress.Text = "Extraindo arquivos do sistema SAREL para " + targetInstallDir + "...";

            System.Threading.ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    if (!Directory.Exists(targetInstallDir))
                    {
                        Directory.CreateDirectory(targetInstallDir);
                    }
                    Directory.CreateDirectory(Path.Combine(targetInstallDir, "data"));

                    // 1. Extrai o código do sistema embutido no .exe caso não esteja na pasta
                    if (!File.Exists(Path.Combine(targetInstallDir, "package.json")))
                    {
                        ExtrairPayloadEmbutido(targetInstallDir);
                    }

                    this.BeginInvoke((MethodInvoker)delegate
                    {
                        progressBar.Value = 35;
                        lblProgress.Text = "Verificando Node.js e Python no sistema...";
                    });

                    // 2. Verifica Node.js e Python; se ausentes, tenta instalar via winget
                    if (!ComandoExiste("node") && !File.Exists(Path.Combine(targetInstallDir, "runtime", "node", "node.exe")))
                    {
                        this.BeginInvoke((MethodInvoker)delegate
                        {
                            lblProgress.Text = "Instalando Node.js LTS automaticamente via Windows Package Manager (winget)...";
                        });
                        ExecutarComandoSincrono("winget.exe", "install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent", targetInstallDir);
                    }

                    if (!ComandoExiste("python") && !File.Exists(Path.Combine(targetInstallDir, "runtime", "python", "python.exe")))
                    {
                        this.BeginInvoke((MethodInvoker)delegate
                        {
                            lblProgress.Text = "Instalando Python 3 automaticamente via Windows Package Manager (winget)...";
                        });
                        ExecutarComandoSincrono("winget.exe", "install Python.Python.3.12 --accept-package-agreements --accept-source-agreements --silent", targetInstallDir);
                    }

                    // 3. Instala dependências npm se node_modules não existir na pasta destino
                    if (!Directory.Exists(Path.Combine(targetInstallDir, "node_modules")))
                    {
                        this.BeginInvoke((MethodInvoker)delegate
                        {
                            progressBar.Value = 55;
                            lblProgress.Text = "Instalando pacotes da aplicação (npm install)... Isso pode levar de 1 a 3 minutos.";
                        });
                        ExecutarComandoSincrono("cmd.exe", "/c npm install --no-audit --no-fund", targetInstallDir);
                    }

                    // 4. Garante pacotes Python (shapely, pyshp, etc.)
                    if (File.Exists(Path.Combine(targetInstallDir, "requirements.txt")))
                    {
                        this.BeginInvoke((MethodInvoker)delegate
                        {
                            progressBar.Value = 80;
                            lblProgress.Text = "Verificando bibliotecas geoespaciais Python (shapely, pyshp)...";
                        });
                        ExecutarComandoSincrono("cmd.exe", "/c python -m pip install -r requirements.txt --quiet", targetInstallDir);
                    }

                    // 5. Cria atalhos na Área de Trabalho e no Menu Iniciar
                    this.BeginInvoke((MethodInvoker)delegate
                    {
                        progressBar.Value = 92;
                        lblProgress.Text = "Criando atalhos na Área de Trabalho e no Menu Iniciar...";
                    });

                    string psScript = Path.Combine(targetInstallDir, "scripts", "install_shortcut.ps1");
                    if (File.Exists(psScript))
                    {
                        ExecutarComandoSincrono(
                            "powershell.exe",
                            "-NoProfile -ExecutionPolicy Bypass -File \"" + psScript + "\"",
                            targetInstallDir
                        );
                    }

                    SalvarConfiguracao();

                    this.BeginInvoke((MethodInvoker)delegate
                    {
                        btnInstallSystem.Enabled = true;
                        progressBar.Value = 100;
                        lblProgress.Text = "✔ Sistema SAREL e atalhos instalados em " + targetInstallDir + "!";
                        AtualizarDiagnostico();

                        DialogResult dr = MessageBox.Show(
                            "O sistema SAREL e os atalhos na Área de Trabalho foram instalados com sucesso em:\n" +
                            targetInstallDir + "\n\n" +
                            "PRÓXIMO PASSO RECOMENDADO (Bancos de Dados Complementares):\n" +
                            "Deseja abrir agora o diretório oficial do Google Drive (" + OFFICIAL_GDRIVE_URL + ") " +
                            "para baixar os bancos de dados complementares?",
                            "Instalação Concluída — Recomendação do Google Drive",
                            MessageBoxButtons.YesNo,
                            MessageBoxIcon.Information
                        );

                        if (dr == DialogResult.Yes)
                        {
                            AbrirPastaGoogleDrive();
                            AbrirPastaDataLocal();
                        }
                    });
                }
                catch (Exception ex)
                {
                    this.BeginInvoke((MethodInvoker)delegate
                    {
                        btnInstallSystem.Enabled = true;
                        lblProgress.Text = "Erro durante a instalação: " + ex.Message;
                        MessageBox.Show("Erro durante a instalação: " + ex.Message, "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    });
                }
            });
        }

        private string ExtrairCampoJson(string json, string chave, string padrao)
        {
            Match m = Regex.Match(json, "\"" + chave + "\"\\s*:\\s*\"([^\"]*)\"");
            return m.Success ? m.Groups[1].Value : padrao;
        }

        private void CarregarConfiguracao()
        {
            if (File.Exists(configPath))
            {
                try
                {
                    string json = File.ReadAllText(configPath, Encoding.UTF8);
                    txtGDriveFolder.Text = ExtrairCampoJson(json, "googleDriveFolderUrl", OFFICIAL_GDRIVE_URL);
                    txtGDriveFile.Text = ExtrairCampoJson(json, "googleDriveDbFileUrl", OFFICIAL_GDRIVE_URL);
                    return;
                }
                catch { }
            }
            txtGDriveFolder.Text = OFFICIAL_GDRIVE_URL;
            txtGDriveFile.Text = OFFICIAL_GDRIVE_URL;
        }

        private void SalvarConfiguracao()
        {
            try
            {
                if (!File.Exists(configPath)) return;
                string json = File.ReadAllText(configPath, Encoding.UTF8);
                json = Regex.Replace(
                    json,
                    "(\"googleDriveFolderUrl\"\\s*:\\s*\")([^\"]*)(\")",
                    "$1" + txtGDriveFolder.Text.Trim().Replace("\\", "\\\\") + "$3"
                );
                json = Regex.Replace(
                    json,
                    "(\"googleDriveDbFileUrl\"\\s*:\\s*\")([^\"]*)(\")",
                    "$1" + txtGDriveFile.Text.Trim().Replace("\\", "\\\\") + "$3"
                );
                File.WriteAllText(configPath, json, Encoding.UTF8);
            }
            catch { }
        }

        private string LocalizarPython()
        {
            string portablePy = Path.Combine(targetInstallDir, "runtime", "python", "python.exe");
            if (File.Exists(portablePy)) return portablePy;
            return "python";
        }

        private void AbrirPastaGoogleDrive()
        {
            SalvarConfiguracao();
            string url = txtGDriveFolder.Text.Trim();
            if (string.IsNullOrEmpty(url)) url = OFFICIAL_GDRIVE_URL;
            Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true });
        }

        private void AbrirPastaDataLocal()
        {
            string dataDir = Path.Combine(targetInstallDir, "data");
            if (!Directory.Exists(dataDir)) Directory.CreateDirectory(dataDir);
            Process.Start(new ProcessStartInfo { FileName = dataDir, UseShellExecute = true });
        }

        private void IniciarDownloadAutomatico()
        {
            if (!File.Exists(Path.Combine(targetInstallDir, "scripts", "download_gdrive_db.py")))
            {
                ExtrairPayloadEmbutido(targetInstallDir);
            }

            SalvarConfiguracao();
            string url = txtGDriveFile.Text.Trim();
            if (string.IsNullOrEmpty(url)) url = OFFICIAL_GDRIVE_URL;

            btnDownloadDb.Enabled = false;
            progressBar.Value = 2;
            lblProgress.Text = "Conectando ao Google Drive...";

            string pyExe = LocalizarPython();
            string scriptPy = Path.Combine(targetInstallDir, "scripts", "download_gdrive_db.py");
            string destDb = Path.Combine(targetInstallDir, "data", "fundiario_brasil.db");

            System.Threading.ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = pyExe,
                        Arguments = "\"" + scriptPy + "\" \"" + url + "\" \"" + destDb + "\"",
                        WorkingDirectory = targetInstallDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        StandardOutputEncoding = Encoding.UTF8
                    };

                    using (Process proc = Process.Start(psi))
                    {
                        string line;
                        while ((line = proc.StandardOutput.ReadLine()) != null)
                        {
                            if (line.StartsWith("PROGRESS:"))
                            {
                                string[] parts = line.Split(new char[] { ':' }, 3);
                                if (parts.Length == 3)
                                {
                                    int pct = 0;
                                    int.TryParse(parts[1], out pct);
                                    string msg = parts[2];
                                    this.BeginInvoke((MethodInvoker)delegate
                                    {
                                        progressBar.Value = Math.Max(0, Math.Min(100, pct));
                                        lblProgress.Text = msg;
                                    });
                                }
                            }
                        }
                        proc.WaitForExit();
                        int code = proc.ExitCode;

                        this.BeginInvoke((MethodInvoker)delegate
                        {
                            btnDownloadDb.Enabled = true;
                            AtualizarDiagnostico();
                            if (code == 0)
                            {
                                MessageBox.Show(
                                    "Banco de dados baixado e instalado automaticamente em '" + destDb + "' com sucesso!",
                                    "Download Concluído",
                                    MessageBoxButtons.OK,
                                    MessageBoxIcon.Information
                                );
                            }
                            else
                            {
                                DialogResult dr = MessageBox.Show(
                                    "Abrindo o diretório oficial do Google Drive (" + OFFICIAL_GDRIVE_URL + ") no seu navegador e a pasta local do sistema para você baixar os bancos de dados complementares.\n\n" +
                                    "Deseja abrir o Google Drive e a pasta local agora?",
                                    "Acessar Diretório do Google Drive",
                                    MessageBoxButtons.YesNo,
                                    MessageBoxIcon.Information
                                );
                                if (dr == DialogResult.Yes)
                                {
                                    AbrirPastaGoogleDrive();
                                    AbrirPastaDataLocal();
                                }
                            }
                        });
                    }
                }
                catch (Exception ex)
                {
                    this.BeginInvoke((MethodInvoker)delegate
                    {
                        btnDownloadDb.Enabled = true;
                        lblProgress.Text = "Erro ao iniciar download: " + ex.Message;
                    });
                }
            });
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
