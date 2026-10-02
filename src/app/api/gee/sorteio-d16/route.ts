import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import {
  CandidatoSorteioD16,
  verificarPreCondicoesSorteioD16,
  sortearPoligonosDroneD16,
  asseverarCaminhoSeloIgnoradoGit,
} from "@/lib/gee/sorteioPoligonos";

const DIRETORIO_SELOS = path.join(process.cwd(), "docs", "verificacoes", "sorteio");

function localizarSeloExistente(): { caminhoRelativo: string; conteudo: unknown } | null {
  if (!fs.existsSync(DIRETORIO_SELOS)) return null;
  const arquivos = fs
    .readdirSync(DIRETORIO_SELOS)
    .filter((f) => /^sorteio_d16_\d{4}-\d{2}-\d{2}\.json$/i.test(f))
    .sort();
  if (arquivos.length === 0) return null;
  const absPath = path.join(DIRETORIO_SELOS, arquivos[0]);
  const caminhoRelativo = path.relative(process.cwd(), absPath).replace(/\\/g, "/");
  try {
    const conteudo = JSON.parse(fs.readFileSync(absPath, "utf-8"));
    return { caminhoRelativo, conteudo };
  } catch {
    return { caminhoRelativo, conteudo: null };
  }
}

const CAMINHO_ARTEFATO_REMEDICAO = path.join(
  process.cwd(),
  "docs",
  "verificacoes",
  "remedicao_candidatos_bp3_d16_2026-09-30.json"
);

function localizarArtefatoRemedicao(): {
  caminhoRelativo: string;
  conteudo: {
    statusSorteio?: string;
    dimensoesMedidas?: {
      S?: { estado: string; fonte?: string };
      K?: { estado: string; fonte?: string };
      E?: { estado: string; motivo?: string; fonte?: string };
    };
    [chave: string]: unknown;
  } | null;
} | null {
  if (!fs.existsSync(CAMINHO_ARTEFATO_REMEDICAO)) return null;
  try {
    const conteudo = JSON.parse(fs.readFileSync(CAMINHO_ARTEFATO_REMEDICAO, "utf-8"));
    const caminhoRelativo = path
      .relative(process.cwd(), CAMINHO_ARTEFATO_REMEDICAO)
      .replace(/\\/g, "/");
    return { caminhoRelativo, conteudo };
  } catch {
    return null;
  }
}

function obterGitCommitAtual(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "indisponivel";
  }
}

export async function GET() {
  const existente = localizarSeloExistente();
  const remedicao = localizarArtefatoRemedicao();
  return NextResponse.json({
    ok: true,
    seloExistenteCaminho: existente?.caminhoRelativo ?? null,
    selo: existente?.conteudo ?? null,
    artefatoRemedicao: remedicao?.conteudo ?? null,
    artefatoRemedicaoCaminho: remedicao?.caminhoRelativo ?? null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const candidatos: CandidatoSorteioD16[] = Array.isArray(body?.candidatos)
      ? body.candidatos
      : [];
    const semente: number =
      typeof body?.semente === "number" && Number.isInteger(body.semente) && body.semente > 0
        ? body.semente
        : 20260928;
    const confirmar = body?.confirmar === true;

    const existente = localizarSeloExistente();

    if (existente) {
      return NextResponse.json(
        {
          ok: false,
          condicaoFalha: "nenhum_selo_anterior",
          motivo: `Selo de sorteio D16 já existe em '${existente.caminhoRelativo}'. A Decisão D23 proíbe descartar ou sobrescrever probabilidades de inclusão (pi_i) já registradas.`,
          seloExistenteCaminho: existente.caminhoRelativo,
          selo: existente.conteudo,
        },
        { status: 409 }
      );
    }

    const remedicao = localizarArtefatoRemedicao();
    if (remedicao?.conteudo?.dimensoesMedidas?.E?.estado === "indisponivel") {
      return NextResponse.json(
        {
          ok: false,
          condicaoFalha: "e_nao_medido",
          motivo:
            remedicao.conteudo.statusSorteio ??
            "Dimensão Ê (Frequência de Solo Nu) não medida no satélite (P12). O sorteio segue compulsoriamente bloqueado.",
          artefatoRemedicao: remedicao.conteudo,
        },
        { status: 422 }
      );
    }

    const relatorio = verificarPreCondicoesSorteioD16(candidatos, {
      seloExistenteCaminho: null,
      lancarErro: false,
    });

    if (!relatorio.aprovado) {
      return NextResponse.json(
        {
          ok: false,
          condicaoFalha: relatorio.condicaoFalha,
          motivo: relatorio.motivoFalha,
          relatorio,
        },
        { status: 422 }
      );
    }

    if (!confirmar) {
      return NextResponse.json({
        ok: true,
        modo: "dry-run",
        relatorio,
      });
    }

    if (
      body?.origemSintetica === true ||
      candidatos.some(
        (c) =>
          String(c.id).startsWith("DRY-CAND-") ||
          c.isSynthetic === true ||
          c.origemSintetica === true
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          condicaoFalha: "origem_sintetica_proibida",
          motivo:
            "O selo de D23 jamais pode nascer de candidato sintético/fabricado, mesmo com confirmar=true (T4.3).",
        },
        { status: 422 }
      );
    }

    const sha256 = crypto
      .createHash("sha256")
      .update(JSON.stringify(candidatos))
      .digest("hex");
    const gitCommit = obterGitCommitAtual();
    const dataHoje = new Date().toISOString().slice(0, 10);
    const caminhoSeloAbs = path.join(DIRETORIO_SELOS, `sorteio_d16_${dataHoje}.json`);
    const caminhoRelativo = path
      .relative(process.cwd(), caminhoSeloAbs)
      .replace(/\\/g, "/");

    const selo = sortearPoligonosDroneD16(candidatos, {
      semente,
      gitCommit,
      sha256ConjuntoCandidatos: sha256,
      seloExistenteCaminho: null,
    });

    // Guarda de segurança física K2: recusa escrita se o diretório/caminho não estiver no .gitignore
    asseverarCaminhoSeloIgnoradoGit(caminhoSeloAbs);

    fs.mkdirSync(DIRETORIO_SELOS, { recursive: true });
    fs.writeFileSync(caminhoSeloAbs, JSON.stringify(selo, null, 2), "utf-8");

    return NextResponse.json({
      ok: true,
      modo: "selado",
      seloExistenteCaminho: caminhoRelativo,
      selo,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, motivo: msg }, { status: 500 });
  }
}
