"use client";

import React, { useState, useEffect } from "react";
import { useSarelStore } from "@/store/useSarelStore";
import {
  Settings,
  Key,
  Database,
  FileCode,
  ClipboardCheck,
  X,
  UploadCloud,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Map,
  Globe,
  Layers,
  Sprout,
  ExternalLink,
  Lock,
} from "lucide-react";

export function SettingsModal() {
  const {
    fecharModal,
    geeCredenciais,
    definirGeeCredenciais,
    limparGeeCredenciais,
    apiTokens,
    definirApiToken,
    definirStatusApiToken,
  } = useSarelStore();

  const [abaAtiva, setAbaAtiva] = useState<"gee" | "vetores" | "tokens" | "campo">("gee");
  const [modoInsercaoGee, setModoInsercaoGee] = useState<"upload" | "manual">("upload");

  // Estado local para inputs manuais de GEE
  const [inputProjectId, setInputProjectId] = useState(geeCredenciais.projectId || "");
  const [inputClientEmail, setInputClientEmail] = useState(geeCredenciais.clientEmail || "");
  const [inputPrivateKey, setInputPrivateKey] = useState(geeCredenciais.privateKey || "");
  const [tipoArmazenamento, setTipoArmazenamento] = useState<"local" | "sessao">(geeCredenciais.armazenamento || "local");

  // Estados de teste assíncrono
  const [testandoGee, setTestandoGee] = useState(false);
  const [erroGee, setErroGee] = useState<string | null>(null);
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false);

  // Estados dos tokens de mapas
  const [testandoToken, setTestandoToken] = useState<Record<string, boolean>>({});

  // Sincroniza sessão ativa do servidor ao montar o modal
  useEffect(() => {
    async function checarSessaoServidor() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.sessaoAtiva && geeCredenciais.status !== "ativo") {
            definirGeeCredenciais({
              status: "ativo",
              projectId: data.projectId || geeCredenciais.projectId,
              clientEmail: data.clientEmail || geeCredenciais.clientEmail,
              scopes: data.scopes,
              respostaValidacao: data,
            });
          }
        }
      } catch {
        // Modo offline ou local
      }
    }
    checarSessaoServidor();
  }, [definirGeeCredenciais, geeCredenciais.projectId, geeCredenciais.clientEmail, geeCredenciais.status]);

  // Manipulador de leitura do arquivo credentials.json
  function processarArquivoJson(conteudo: string) {
    try {
      const json = JSON.parse(conteudo);
      const projectId = json.project_id || json.quota_project_id || "earth-engine-project";
      const clientEmail = json.client_email || "";
      const privateKey = json.private_key || "";

      if (!clientEmail || !privateKey) {
        setErroGee("O arquivo JSON não contém as propriedades 'client_email' ou 'private_key' necessárias de uma Service Account.");
        return;
      }

      setInputProjectId(projectId);
      setInputClientEmail(clientEmail);
      setInputPrivateKey(privateKey);
      setErroGee(null);

      definirGeeCredenciais({
        status: "carregado",
        projectId,
        clientEmail,
        privateKey,
        armazenamento: tipoArmazenamento,
        respostaValidacao: undefined,
      });
    } catch {
      setErroGee("Arquivo JSON inválido ou corrompido. Certifique-se de que é a chave oficial exportada do Google Cloud Console.");
    }
  }

  function handleDropFile(e: React.DragEvent) {
    e.preventDefault();
    setArrastandoArquivo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          processarArquivoJson(ev.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  }

  function handleSelectFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          processarArquivoJson(ev.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  }

  // Ação de Testar Autenticação e Ativar Sessão GEE
  async function testarEAtivarGee() {
    setTestandoGee(true);
    setErroGee(null);

    const email = geeCredenciais.clientEmail || inputClientEmail;
    const key = geeCredenciais.privateKey || inputPrivateKey;
    const proj = geeCredenciais.projectId || inputProjectId || "imposing-muse-506616-i7";

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "gee",
          projectId: proj,
          clientEmail: email,
          privateKey: key,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro || data.mensagem || "Falha na validação com o Google Earth Engine.");
      }

      definirGeeCredenciais({
        status: "ativo",
        projectId: proj,
        clientEmail: email,
        privateKey: key,
        scopes: data.scopes,
        respostaValidacao: {
          projectId: data.projectId,
          clientEmail: data.clientEmail,
          scopes: data.scopes,
        },
      });
    } catch (err: any) {
      setErroGee(err.message || "Erro desconhecido durante a autenticação com o GEE.");
    } finally {
      setTestandoGee(false);
    }
  }

  // Encerrar sessão ativa
  async function encerrarSessaoGee() {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {}
    definirGeeCredenciais({
      status: "carregado",
      respostaValidacao: undefined,
    });
  }

  // Testar token individual na aba Tokens de Mapas
  async function testarTokenApi(servico: "mapbox" | "google" | "carto" | "embrapa") {
    const valor = apiTokens[servico];
    if (!valor || valor.trim().length === 0) {
      definirStatusApiToken(servico, "erro", "Insira uma chave ou token antes de testar.");
      return;
    }

    setTestandoToken((prev) => ({ ...prev, [servico]: true }));
    definirStatusApiToken(servico, "testando");

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "testar_token",
          servico,
          token: valor,
        }),
      });

      const data = await res.json();
      if (res.ok && data.sucesso) {
        definirStatusApiToken(servico, "valido", data.mensagem);
      } else {
        definirStatusApiToken(servico, "erro", data.erro || data.mensagem || "Token recusado.");
      }
    } catch (err: any) {
      definirStatusApiToken(servico, "erro", `Erro de comunicação: ${err.message}`);
    } finally {
      setTestandoToken((prev) => ({ ...prev, [servico]: false }));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-slate-700/60 bg-[#0b1222] text-slate-100 shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-[#0d162a]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Configurações &amp; Gestão de Dados</h2>
              <p className="text-xs text-slate-400">
                Credenciais da nuvem (GEE), tokens de mapas e ingestão de vetores
              </p>
            </div>
          </div>
          <button
            onClick={fecharModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-800/80 px-6 bg-[#090f1d] text-xs font-semibold select-none overflow-x-auto">
          <button
            onClick={() => setAbaAtiva("gee")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all shrink-0 ${
              abaAtiva === "gee"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Key className="h-4 w-4" />
            GEE Service Account
          </button>
          <button
            onClick={() => setAbaAtiva("vetores")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all shrink-0 ${
              abaAtiva === "vetores"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="h-4 w-4" />
            Ingestão de Dados Vetoriais
          </button>
          <button
            onClick={() => setAbaAtiva("tokens")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all shrink-0 ${
              abaAtiva === "tokens"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCode className="h-4 w-4" />
            Tokens de Mapas
          </button>
          <button
            onClick={() => setAbaAtiva("campo")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all shrink-0 ${
              abaAtiva === "campo"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            Validação de Campo
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* ============================================================== */}
          {/* ABA 1: GEE SERVICE ACCOUNT                                     */}
          {/* ============================================================== */}
          {abaAtiva === "gee" && (
            <div className="space-y-4">
              {/* Card de Apresentação */}
              <div className="rounded-xl border border-slate-800 bg-[#0e1628] p-4 flex items-start gap-3.5">
                <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Google Earth Engine (GEE) Service Account</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Faça o upload do arquivo <code className="text-emerald-400 font-mono">credentials.json</code> da sua Service Account com permissões no projeto Earth Engine para consultas em tempo real de imagens de satélite.
                  </p>
                </div>
              </div>

              {/* Banner de Aviso de Segurança (Exibido quando desconectado) */}
              {geeCredenciais.status === "desconectado" && (
                <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-3.5 text-xs text-amber-300 leading-relaxed">
                  Por segurança, a chave privada não fica salva no navegador entre sessões — apenas o projeto/e-mail da Service Account foram lembrados. Envie o <span className="font-mono font-bold">credentials.json</span> novamente para reativar os cálculos reais via Earth Engine.
                </div>
              )}

              {/* ESTADO 1: DESCONECTADO (Upload ou Entrada Manual) */}
              {geeCredenciais.status === "desconectado" && (
                <div className="space-y-4">
                  {/* Botões de Alternância */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setModoInsercaoGee("upload")}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        modoInsercaoGee === "upload"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                          : "bg-slate-900 border border-slate-700/80 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <FileCode className="h-4 w-4" />
                      Subir credentials.json
                    </button>
                    <button
                      onClick={() => setModoInsercaoGee("manual")}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        modoInsercaoGee === "manual"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                          : "bg-slate-900 border border-slate-700/80 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <Key className="h-4 w-4" />
                      Inserir Dados da API
                    </button>
                  </div>

                  {modoInsercaoGee === "upload" ? (
                    /* Área de Drag & Drop */
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setArrastandoArquivo(true);
                      }}
                      onDragLeave={() => setArrastandoArquivo(false)}
                      onDrop={handleDropFile}
                      className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                        arrastandoArquivo
                          ? "border-emerald-500 bg-emerald-950/20"
                          : "border-slate-700/80 bg-slate-900/30 hover:border-slate-600"
                      }`}
                    >
                      <UploadCloud className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-200">
                        Arraste seu arquivo <span className="text-emerald-400 font-mono font-bold">credentials.json</span> aqui
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">ou clique no botão abaixo</p>

                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        id="gee-file-input"
                        onChange={handleSelectFileInput}
                      />
                      <label
                        htmlFor="gee-file-input"
                        className="mt-3.5 inline-flex items-center gap-2 cursor-pointer rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-colors shadow-sm"
                      >
                        <FileCode className="h-4 w-4 text-emerald-400" />
                        Selecionar Chave JSON
                      </label>
                    </div>
                  ) : (
                    /* Formulário Manual */
                    <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4 space-y-3 text-xs">
                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">PROJECT_ID:</label>
                        <input
                          type="text"
                          value={inputProjectId}
                          onChange={(e) => setInputProjectId(e.target.value)}
                          placeholder="imposing-muse-506616-i7"
                          className="w-full rounded-lg border border-slate-700 bg-[#070c18] px-3 py-1.5 font-mono text-emerald-400 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">CLIENT_EMAIL:</label>
                        <input
                          type="text"
                          value={inputClientEmail}
                          onChange={(e) => setInputClientEmail(e.target.value)}
                          placeholder="sua-conta@projeto.iam.gserviceaccount.com"
                          className="w-full rounded-lg border border-slate-700 bg-[#070c18] px-3 py-1.5 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">PRIVATE_KEY (PEM):</label>
                        <textarea
                          rows={3}
                          value={inputPrivateKey}
                          onChange={(e) => setInputPrivateKey(e.target.value)}
                          placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                          className="w-full rounded-lg border border-slate-700 bg-[#070c18] px-3 py-1.5 font-mono text-slate-300 text-xs"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!inputClientEmail || !inputPrivateKey) {
                            setErroGee("Preencha o e-mail e a chave privada.");
                            return;
                          }
                          definirGeeCredenciais({
                            status: "carregado",
                            projectId: inputProjectId || "earth-engine-project",
                            clientEmail: inputClientEmail,
                            privateKey: inputPrivateKey,
                            armazenamento: tipoArmazenamento,
                          });
                        }}
                        className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 text-xs transition-colors"
                      >
                        Carregar Dados da Service Account
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ESTADO 2 OU 3: CHAVE CARREGADA OU SESSÃO ATIVA */}
              {(geeCredenciais.status === "carregado" || geeCredenciais.status === "ativo") && (
                <div className="space-y-3.5">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {geeCredenciais.status === "ativo" ? (
                        <>
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-emerald-400">Sessão GEE Ativa</span>
                        </>
                      ) : (
                        <>
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                          <span className="text-amber-400">Chave Carregada — Aguardando Teste</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        limparGeeCredenciais();
                        setInputPrivateKey("");
                        setErroGee(null);
                      }}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remover
                    </button>
                  </div>

                  {/* Terminal / Code Box */}
                  <div className="rounded-xl border border-slate-700/80 bg-[#070c18] p-4 text-xs font-mono space-y-3">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-sans font-semibold">PROJECT_ID:</span>
                      <span className="text-emerald-400 font-bold block mt-0.5">
                        {geeCredenciais.projectId || "imposing-muse-506616-i7"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-sans font-semibold">CLIENT_EMAIL:</span>
                      <span className="text-slate-100 font-medium break-all block mt-0.5">
                        {geeCredenciais.clientEmail}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-sans font-semibold">PRIVATE_KEY:</span>
                      <span className="text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        ••••••••••••••••••••••••••••••••
                        <span className="text-[10px] text-slate-500 font-sans">(oculta nesta tela; nunca gravada em localStorage)</span>
                      </span>
                    </div>
                  </div>

                  {/* Opções de Armazenamento */}
                  <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
                    <span className="font-semibold text-slate-400">Armazenamento:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="armazenamento"
                        checked={tipoArmazenamento === "local"}
                        onChange={() => {
                          setTipoArmazenamento("local");
                          definirGeeCredenciais({ armazenamento: "local" });
                        }}
                        className="text-emerald-500 focus:ring-0"
                      />
                      Persistir Localmente
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="armazenamento"
                        checked={tipoArmazenamento === "sessao"}
                        onChange={() => {
                          setTipoArmazenamento("sessao");
                          definirGeeCredenciais({ armazenamento: "sessao" });
                        }}
                        className="text-emerald-500 focus:ring-0"
                      />
                      Apenas na Sessão
                    </label>
                  </div>

                  {/* Ações conforme o estado */}
                  {geeCredenciais.status === "carregado" ? (
                    <button
                      onClick={testarEAtivarGee}
                      disabled={testandoGee}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 text-xs transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
                    >
                      {testandoGee ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Validando com Earth Engine...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Testar Autenticação e Ativar Sessão GEE
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>Sessão ativa no servidor (cookie httpOnly) — a chave não trafega mais</span>
                      </div>
                      <button
                        onClick={encerrarSessaoGee}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold py-2.5 px-4 text-xs transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Encerrar Sessão GEE
                      </button>
                    </div>
                  )}

                  {/* Box de Confirmação de Comunicação Real (Sessão Ativa) */}
                  {geeCredenciais.status === "ativo" && (
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2.5">
                      <div className="flex items-start gap-2 text-xs font-semibold text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Autenticação real validada com o Google Earth Engine! Sessão criada no servidor — a chave não será reenviada.</span>
                      </div>
                      <pre className="rounded-lg bg-[#060b16] border border-emerald-900/40 p-3 text-[11px] font-mono text-emerald-200 overflow-x-auto leading-relaxed">
                        {JSON.stringify(
                          geeCredenciais.respostaValidacao || {
                            projectId: geeCredenciais.projectId,
                            clientEmail: geeCredenciais.clientEmail,
                            scopes: [
                              "https://www.googleapis.com/auth/earthengine",
                              "https://www.googleapis.com/auth/devstorage.read_only",
                              "https://www.googleapis.com/auth/cloud-platform",
                            ],
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Exibição de Erro */}
              {erroGee && (
                <div className="rounded-xl border border-rose-800/60 bg-rose-950/20 p-3.5 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Erro de Autenticação:</p>
                    <p className="mt-0.5">{erroGee}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* ABA 2: INGESTÃO DE DADOS VETORIAIS                             */}
          {/* ============================================================== */}
          {abaAtiva === "vetores" && (
            <div className="space-y-3.5">
              <div className="rounded-xl border border-slate-800 bg-[#0e1628] p-4 flex items-start gap-3.5">
                <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400 border border-cyan-500/20 shrink-0">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Bases Vetoriais Fundiárias &amp; Cartográficas</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Gerenciamento dos acervos oficiais do SICAR/MMA, SIGEF/INCRA e bases pedológicas da Embrapa indexadas localmente via R-Tree no SQLite.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  {
                    nome: "SICAR / CAR Paraná (Oficial MMA)",
                    arquivo: "AREA_IMOVEL_PR.zip (ou .shp/.dbf)",
                    status: "Instalado e Indexado",
                    detalhes: "Polígonos de imóveis rurais com índice espacial R-Tree ativo em SQLite.",
                    ativo: true,
                  },
                  {
                    nome: "SIGEF Brasil — Parcelas Certificadas",
                    arquivo: "Sigef Brasil_PR.zip",
                    status: "Pronto para Cruzamento",
                    detalhes: "Vértices georreferenciados de alta precisão do INCRA.",
                    ativo: true,
                  },
                  {
                    nome: "SNCR — Cadastro Nacional de Imóveis Rurais",
                    arquivo: "sncr_imoveis (tabela SQLite)",
                    status: "Aguardando Carga Completa",
                    detalhes: "Mapeamento de titularidade sob LGPD (retorna nulo honestamente se ausente).",
                    ativo: false,
                  },
                  {
                    nome: "Embrapa GeoInfo — Pedologia Paraná",
                    arquivo: "parana_solos_20201105.geojson",
                    status: "Integrado ao SoilClient",
                    detalhes: "Classificação SiBCS (ordem, grande grupo e textura para fator K).",
                    ativo: true,
                  },
                ].map((base, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{base.nome}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            base.ativo
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {base.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{base.detalhes}</p>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">{base.arquivo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ABA 3: TOKENS DE MAPAS (Fiel à Imagem 4)                        */}
          {/* ============================================================== */}
          {abaAtiva === "tokens" && (
            <div className="space-y-3.5">
              {/* 1. Mapbox */}
              <div className="rounded-xl border border-slate-800 bg-[#0e1628] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">Mapbox Access Token (Opcional)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">pk.eyJ1...</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Para habilitar estilos vetoriais customizados e imagens aéreas de ultra-resolução da Mapbox.
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="password"
                    value={apiTokens.mapbox}
                    onChange={(e) => definirApiToken("mapbox", e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••••••••••"
                    className="flex-1 rounded-lg border border-slate-700/80 bg-[#070c18] px-3 py-1.5 font-mono text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => testarTokenApi("mapbox")}
                    disabled={testandoToken.mapbox}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {testandoToken.mapbox ? "Testando..." : "Testar"}
                  </button>
                </div>
                {apiTokens.status.mapbox && (
                  <p
                    className={`text-[11px] font-semibold mt-1 ${
                      apiTokens.status.mapbox === "valido" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {apiTokens.mensagens.mapbox}
                  </p>
                )}
              </div>

              {/* 2. Google Maps */}
              <div className="rounded-xl border border-slate-800 bg-[#0e1628] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-teal-400" />
                    <span className="text-xs font-bold text-white">Google Maps JavaScript API Key (Opcional)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">AIzaSy...</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Para integração direta com Street View e geocodificação reversa de municípios.
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="password"
                    value={apiTokens.google}
                    onChange={(e) => definirApiToken("google", e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••••••••••"
                    className="flex-1 rounded-lg border border-slate-700/80 bg-[#070c18] px-3 py-1.5 font-mono text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => testarTokenApi("google")}
                    disabled={testandoToken.google}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {testandoToken.google ? "Testando..." : "Testar"}
                  </button>
                </div>
                {apiTokens.status.google && (
                  <p
                    className={`text-[11px] font-semibold mt-1 ${
                      apiTokens.status.google === "valido" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {apiTokens.mensagens.google}
                  </p>
                )}
              </div>

              {/* 3. CARTO */}
              <div className="rounded-xl border border-slate-800 bg-[#0e1628] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">CARTO Basemaps API Key (Opcional)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">cb1_...</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Remove a marca d&apos;água <em className="text-slate-300">&quot;API key required&quot;</em> das camadas raster da CARTO (Dark GIS, Voyager e Positron). Gratuito até 5 milhões de requisições/mês.{" "}
                  <a
                    href="https://carto.com/help/glossary/api-keys/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline hover:text-amber-300 inline-flex items-center gap-0.5"
                  >
                    Obter chave gratuita no site da CARTO
                    <ExternalLink className="h-3 w-3 inline" />
                  </a>
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="password"
                    value={apiTokens.carto}
                    onChange={(e) => definirApiToken("carto", e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••••••••••"
                    className="flex-1 rounded-lg border border-slate-700/80 bg-[#070c18] px-3 py-1.5 font-mono text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => testarTokenApi("carto")}
                    disabled={testandoToken.carto}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {testandoToken.carto ? "Testando..." : "Testar"}
                  </button>
                </div>
                {apiTokens.status.carto && (
                  <p
                    className={`text-[11px] font-semibold mt-1 ${
                      apiTokens.status.carto === "valido" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {apiTokens.mensagens.carto}
                  </p>
                )}
              </div>

              {/* 4. Embrapa */}
              <div className="rounded-xl border border-slate-800 bg-[#0e1628] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Embrapa AgroAPI / SmartSolos Token (Opcional)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Bearer ey...</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Para classificação taxonômica oficial de solos segundo o SiBCS da Embrapa Agricultura Digital a partir de amostras de campo.{" "}
                  <a
                    href="https://agroapi.cnptia.embrapa.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 underline hover:text-emerald-300 inline-flex items-center gap-0.5"
                  >
                    Acessar o portal AgroAPI Embrapa
                    <ExternalLink className="h-3 w-3 inline" />
                  </a>
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="password"
                    value={apiTokens.embrapa}
                    onChange={(e) => definirApiToken("embrapa", e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••••••••••"
                    className="flex-1 rounded-lg border border-slate-700/80 bg-[#070c18] px-3 py-1.5 font-mono text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => testarTokenApi("embrapa")}
                    disabled={testandoToken.embrapa}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {testandoToken.embrapa ? "Testando..." : "Testar"}
                  </button>
                </div>
                {apiTokens.status.embrapa && (
                  <p
                    className={`text-[11px] font-semibold mt-1 ${
                      apiTokens.status.embrapa === "valido" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {apiTokens.mensagens.embrapa}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ABA 4: VALIDAÇÃO DE CAMPO                                      */}
          {/* ============================================================== */}
          {abaAtiva === "campo" && (
            <div className="space-y-3.5">
              <div className="rounded-xl border border-slate-800 bg-[#0e1628] p-4 flex items-start gap-3.5">
                <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/20 shrink-0">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Parâmetros de Auditoria &amp; Coleta de Campo</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Configuração de tolerância espacial e protocolos cegos para rotulagem humana independente (conforme §11 do Plano de Implementação).
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Tolerância de Pareamento GPS (metros):
                  </label>
                  <input
                    type="number"
                    defaultValue={50}
                    min={5}
                    max={500}
                    className="w-32 rounded-lg border border-slate-700 bg-[#070c18] px-3 py-1.5 text-white font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Distância máxima entre o ponto da malha amostral estratificada e a coordenada registrada pelo operador no KoboToolbox / GNSS.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                    <span className="font-bold text-white">Exigir Protocolo Duplo-Cego</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Impede que os formulários de campo exibam o estrato predito ou o cálculo da perda de solo RUSLE, eliminando viés confirmatório na rotulagem observacional.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Fiel às Imagens */}
        <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-3.5 bg-[#090f1d]">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Suas credenciais são processadas de forma segura e não compartilhadas.</span>
          </div>
          <button
            onClick={fecharModal}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 text-xs transition-colors shadow-md shadow-emerald-950/30"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
