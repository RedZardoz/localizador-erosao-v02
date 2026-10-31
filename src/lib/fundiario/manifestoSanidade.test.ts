import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { verificarSanidadeHashSha256 } from "./manifestoSanidade";

describe("Trava Anti-Reincidência de Sanidade e Plausibilidade Estatística de SHA-256", () => {
  // Fixture de reprovação obrigatória: o hash fabricado na rodada anterior
  const HASH_FABRICADO = "4b9e4a3b1d2e8f9a0c3d5e7f1b2a4c6e8d0f2a4b6c8e0d2f4a6b8c0e2d4f6a8b";

  it("REPROVA com precisão o hash fabricado detectado pela auditoria", () => {
    const res = verificarSanidadeHashSha256(HASH_FABRICADO);
    expect(res.valido).toBe(false);
    expect(res.motivo).toBeDefined();
    // Confirma que pegou o k-grama 'cedfab' repetido 3x nos dígitos de baixa ordem
    expect(res.motivo).toContain("repete-se 3 ou mais vezes consecutivas");
    expect(res.detalhes?.kGramaRepetido).toBe("cedfab");
  });

  it("APROVA com segurança hashes SHA-256 reais calculados a partir de arquivos do repositório", () => {
    const arquivos = ["package.json", "tsconfig.json", "README.md"];
    expect(arquivos.length).toBeGreaterThanOrEqual(3);

    for (const arq of arquivos) {
      const conteudo = fs.readFileSync(path.join(process.cwd(), arq));
      const hashReal = crypto.createHash("sha256").update(conteudo).digest("hex");
      const res = verificarSanidadeHashSha256(hashReal);

      expect(res.valido, `Hash real de ${arq} (${hashReal}) foi rejeitado: ${res.motivo}`).toBe(true);
      expect(res.motivo).toBeUndefined();
    }
  });

  it("aceita valor nulo quando honestamente acompanhado de sha256Estado = 'indisponivel' (Caso 2)", () => {
    const res = verificarSanidadeHashSha256(null, "indisponivel");
    expect(res.valido).toBe(true);
  });

  it("recusa valor nulo ou indefinido se sha256Estado não for 'indisponivel'", () => {
    const res1 = verificarSanidadeHashSha256(null);
    expect(res1.valido).toBe(false);
    expect(res1.motivo).toContain("sha256Estado não é 'indisponivel'");

    const res2 = verificarSanidadeHashSha256(undefined, "conferido");
    expect(res2.valido).toBe(false);
  });

  it("reprova hashes com comprimento divergente de 64 caracteres ou caracteres inválidos", () => {
    const curto = "4b9e4a3b1d2e8f9a";
    expect(verificarSanidadeHashSha256(curto).valido).toBe(false);

    const longo = "a".repeat(65);
    expect(verificarSanidadeHashSha256(longo).valido).toBe(false);

    const caracteresInvalidos = "g".repeat(64);
    expect(verificarSanidadeHashSha256(caracteresInvalidos).valido).toBe(false);
  });

  it("reprova hashes com progressão aritmética consecutiva superior a 25% das diferenças", () => {
    // Constrói hash artificial com 15 diferenças consecutivas iguais a +0x01
    const bytes = [0x10];
    for (let i = 1; i < 32; i++) {
      if (i <= 15) {
        bytes.push((bytes[i - 1] + 1) % 256); // 15 diferenças idênticas (+1) => 15/31 = 48.4% >= 25%
      } else {
        bytes.push((bytes[i - 1] + i * 7) % 256);
      }
    }
    const hashAritmetico = Buffer.from(bytes).toString("hex");
    const res = verificarSanidadeHashSha256(hashAritmetico);
    expect(res.valido).toBe(false);
    expect(res.motivo).toContain("Assinatura de progressão aritmética artificial");
  });

  it("reprova hashes com k-grama de 4+ caracteres repetido 3x na cadeia principal", () => {
    // 012301230123 repetido 3x na cadeia
    const hashRepetido = "012301230123" + "abcdef0123456789abcdef0123456789abcdef01234567890123";
    const res = verificarSanidadeHashSha256(hashRepetido.slice(0, 64));
    expect(res.valido).toBe(false);
    expect(res.motivo).toContain("K-grama fabricado '0123'");
  });
});
