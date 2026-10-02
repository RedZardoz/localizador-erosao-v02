import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import {
  validarCaminhoArquivoCredencial,
  obterCaminhoCredencialServiceAccountLote,
  carregarCredenciaisServiceAccountLote,
  NOME_VAR_ENV_GEE_SERVICE_ACCOUNT,
} from "./credenciaisSeguras";

describe("Guarda de Segurança de Credenciais Fora do Repositório (Regra C1)", () => {
  const raizFake = path.resolve(process.cwd());
  const envOriginal = process.env[NOME_VAR_ENV_GEE_SERVICE_ACCOUNT];
  let tempDirForaDoRepo: string;

  beforeEach(() => {
    delete process.env[NOME_VAR_ENV_GEE_SERVICE_ACCOUNT];
    // Cria diretório temporário fora da raiz do repositório
    tempDirForaDoRepo = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-cred-test-"));
  });

  afterEach(() => {
    if (envOriginal !== undefined) {
      process.env[NOME_VAR_ENV_GEE_SERVICE_ACCOUNT] = envOriginal;
    } else {
      delete process.env[NOME_VAR_ENV_GEE_SERVICE_ACCOUNT];
    }
    try {
      fs.rmSync(tempDirForaDoRepo, { recursive: true, force: true });
    } catch {
      // Ignora erro de limpeza
    }
  });

  it("recusa caminho relativo que resolve dentro da árvore do repositório", () => {
    expect(() =>
      validarCaminhoArquivoCredencial("./credentials/gee-key.json", raizFake)
    ).toThrow(/\[VIOLAÇÃO REGRA C1\]/);
  });

  it("recusa caminho absoluto dentro da árvore do repositório, mesmo com subdiretórios", () => {
    const caminhoDentro = path.join(raizFake, "data", "gee-sa.json");
    expect(() => validarCaminhoArquivoCredencial(caminhoDentro, raizFake)).toThrow(
      /resolve dentro da árvore do repositório/
    );
  });

  it("recusa navegação com '..' que ainda assim termine dentro do repositório", () => {
    const caminhoComPontoPonto = path.join(raizFake, "src", "..", "service_account.json");
    expect(() =>
      validarCaminhoArquivoCredencial(caminhoComPontoPonto, raizFake)
    ).toThrow(/\[VIOLAÇÃO REGRA C1\]/);
  });

  it("recusa quando o valor for o próprio diretório raiz do repositório", () => {
    expect(() => validarCaminhoArquivoCredencial(raizFake, raizFake)).toThrow(
      /\[VIOLAÇÃO REGRA C1\]/
    );
  });

  it("recusa string vazia ou inválida", () => {
    expect(() => validarCaminhoArquivoCredencial("", raizFake)).toThrow(
      /não fornecido ou vazio/
    );
    expect(() => validarCaminhoArquivoCredencial("   ", raizFake)).toThrow(
      /não fornecido ou vazio/
    );
  });

  it("recusa conteúdo JSON passado diretamente no lugar de um caminho de arquivo", () => {
    const jsonFake = '{"project_id": "meu-projeto", "client_email": "sa@gcp.iam"}';
    expect(() => validarCaminhoArquivoCredencial(jsonFake, raizFake)).toThrow(
      /deve conter exclusivamente o CAMINHO para o arquivo, nunca o segredo ou conteúdo JSON/
    );
  });

  it("aceita caminho estritamente fora da árvore do repositório", () => {
    const caminhoValidoFora = path.join(tempDirForaDoRepo, "gee-sa.json");
    const res = validarCaminhoArquivoCredencial(caminhoValidoFora, raizFake);
    expect(res).toBe(path.resolve(caminhoValidoFora));
  });

  it("obterCaminhoCredencialServiceAccountLote retorna null quando variável não está definida", () => {
    delete process.env[NOME_VAR_ENV_GEE_SERVICE_ACCOUNT];
    expect(obterCaminhoCredencialServiceAccountLote(raizFake)).toBeNull();
  });

  it("obterCaminhoCredencialServiceAccountLote valida a variável de ambiente", () => {
    const arquivoFora = path.join(tempDirForaDoRepo, "gee-key.json");
    process.env[NOME_VAR_ENV_GEE_SERVICE_ACCOUNT] = arquivoFora;
    expect(obterCaminhoCredencialServiceAccountLote(raizFake)).toBe(arquivoFora);
  });

  it("carrega com sucesso credenciais válidas de arquivo fora do repositório", () => {
    const arquivoFora = path.join(tempDirForaDoRepo, "gee-valid.json");
    const jsonValido = {
      type: "service_account",
      project_id: "projeto-pesquisa-ppgtca",
      client_email: "sarel-sa@projeto-pesquisa-ppgtca.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqh...\\n-----END PRIVATE KEY-----\\n",
    };
    fs.writeFileSync(arquivoFora, JSON.stringify(jsonValido), "utf-8");
    process.env[NOME_VAR_ENV_GEE_SERVICE_ACCOUNT] = arquivoFora;

    const creds = carregarCredenciaisServiceAccountLote(raizFake);
    expect(creds).not.toBeNull();
    expect(creds?.project_id).toBe("projeto-pesquisa-ppgtca");
    expect(creds?.client_email).toBe("sarel-sa@projeto-pesquisa-ppgtca.iam.gserviceaccount.com");
  });

  it("lança erro se o arquivo apontado pela variável de ambiente não existir", () => {
    const arquivoInexistente = path.join(tempDirForaDoRepo, "inexistente.json");
    process.env[NOME_VAR_ENV_GEE_SERVICE_ACCOUNT] = arquivoInexistente;

    expect(() => carregarCredenciaisServiceAccountLote(raizFake)).toThrow(
      /não foi encontrado no disco/
    );
  });
});
