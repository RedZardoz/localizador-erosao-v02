import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  validarEquipe,
  carregarEquipeLocal,
  listarPseudonimos,
  resolverAutor,
  ErroEquipeInvalida,
  ErroEquipeNaoIgnoradaGit,
  MembroEquipe,
} from "./equipe";
import {
  pareceIdentificadorInstitucional,
  validarRegistroAutorizacao,
  ingestarRegistrosAutorizacao,
  RegistroAutorizacao,
} from "./logRecusas";

const EQUIPE: MembroEquipe[] = [
  { pseudonimo: "bolsista-1", nome: "Fulana de Tal", ra: "20231234567" },
  { pseudonimo: "bolsista-2", nome: "Beltrano de Tal", ra: "20239876543" },
];

function registro(): RegistroAutorizacao {
  return {
    codigoPonto: "PT-0001",
    estratoId: "E_2_3_1",
    solicitadoEm: "2026-10-01",
    respondidoEm: "2026-10-05",
    desfecho: "autorizada",
    motivoRecusa: null,
    motivoLivre: null,
    registradoPor: "bolsista-1",
    autorizacaoId: "AUT-0001",
    substituidoPor: null,
  };
}

describe("Relação local da equipe (pseudônimo ↔ nome + RA)", () => {
  describe("Guarda contra identificador institucional no log publicável", () => {
    it("reconhece RA e CPF, e deixa passar pseudônimo de papel e nome", () => {
      expect(pareceIdentificadorInstitucional("20231234567")).toBe(true);
      expect(pareceIdentificadorInstitucional("123.456.789-00")).toBe(true);
      expect(pareceIdentificadorInstitucional("bolsista-1")).toBe(false);
      expect(pareceIdentificadorInstitucional("bolsista-12")).toBe(false);
      expect(pareceIdentificadorInstitucional("Ana Souza")).toBe(false);
    });

    it("o log recusa RA em registradoPor", () => {
      const causa = validarRegistroAutorizacao({ ...registro(), registradoPor: "20231234567" });
      expect(causa).toMatch(/identificador institucional/);
      expect(causa).toMatch(/bolsista-1/);
    });

    it("limite declarado: nome próprio NÃO é barrado por formato", () => {
      // É política, não formato. Quem resolve é a relação da equipe, não regex.
      expect(validarRegistroAutorizacao({ ...registro(), registradoPor: "Ana Souza" })).toBeNull();
    });
  });

  describe("Validação da relação (Regra 1)", () => {
    it("aceita uma relação íntegra", () => {
      expect(validarEquipe(EQUIPE)).toHaveLength(2);
    });

    it("rejeita entrada sem nome, sem ra ou sem pseudonimo", () => {
      expect(() => validarEquipe([{ pseudonimo: "bolsista-1", ra: "1" }])).toThrow(/nome ausente/);
      expect(() => validarEquipe([{ pseudonimo: "bolsista-1", nome: "X" }])).toThrow(/ra ausente/);
      expect(() => validarEquipe([{ nome: "X", ra: "1" }])).toThrow(/pseudonimo ausente/);
    });

    it("rejeita pseudônimo com cara de RA — ele vai para o arquivo publicável", () => {
      expect(() =>
        validarEquipe([{ pseudonimo: "20231234567", nome: "X", ra: "20231234567" }])
      ).toThrow(/identificador institucional/);
    });

    it("rejeita pseudônimo duplicado e relação vazia", () => {
      expect(() => validarEquipe([...EQUIPE, EQUIPE[0]])).toThrow(/duplicado/);
      expect(() => validarEquipe([])).toThrow(ErroEquipeInvalida);
      expect(() => validarEquipe({})).toThrow(/lista de membros/);
    });
  });

  describe("Guarda K2 — recusa caminho versionado", () => {
    it("recusa carregar de caminho NÃO coberto pelo .gitignore", () => {
      // src/ é versionado: carregar daí exporia nome e RA no repositório.
      const versionado = path.resolve(process.cwd(), "src/lib/autorizacao/equipe.ts");
      expect(() => carregarEquipeLocal(versionado)).toThrow(ErroEquipeNaoIgnoradaGit);
    });

    it("em caminho ignorado, a ausência do arquivo aponta o modelo", () => {
      const ignorado = path.resolve(process.cwd(), "data/equipe_local.json");
      if (fs.existsSync(ignorado)) return; // há relação real na máquina: nada a afirmar
      expect(() => carregarEquipeLocal(ignorado)).toThrow(/equipe_local_MODELO\.json/);
    });
  });

  describe("O modelo entregue à equipe", () => {
    it("docs/modelos/equipe_local_MODELO.json tem estrutura válida", () => {
      const caminho = path.resolve(process.cwd(), "docs/modelos/equipe_local_MODELO.json");
      const equipe = validarEquipe(JSON.parse(fs.readFileSync(caminho, "utf-8")));
      expect(listarPseudonimos(equipe)).toEqual(["bolsista-1", "bolsista-2"]);
    });

    it("o modelo traz marcadores, não cadastro plausível (Regra 5)", () => {
      const caminho = path.resolve(process.cwd(), "docs/modelos/equipe_local_MODELO.json");
      const equipe = validarEquipe(JSON.parse(fs.readFileSync(caminho, "utf-8")));
      for (const m of equipe) {
        expect(m.nome).toMatch(/^<.*>$/);
        expect(m.ra).toMatch(/^<.*>$/);
      }
    });
  });

  describe("Ingestão cruzada com a relação", () => {
    it("recusa autor fora da relação", () => {
      const r = ingestarRegistrosAutorizacao(
        [{ ...registro(), registradoPor: "bolsista-9" }],
        listarPseudonimos(EQUIPE)
      );
      expect(r.aceitos).toHaveLength(0);
      expect(r.rejeitados[0].causa).toMatch(/não consta da relação local/);
    });

    it("aceita autor cadastrado", () => {
      const r = ingestarRegistrosAutorizacao([registro()], listarPseudonimos(EQUIPE));
      expect(r.aceitos).toHaveLength(1);
      expect(r.rejeitados).toHaveLength(0);
    });

    it("sem relação informada, só a heurística de dígitos se aplica", () => {
      const r = ingestarRegistrosAutorizacao([{ ...registro(), registradoPor: "bolsista-9" }]);
      expect(r.aceitos).toHaveLength(1);
    });

    it("resolve o autor para a pessoa, fora do log", () => {
      expect(resolverAutor(EQUIPE, "bolsista-2")?.nome).toBe("Beltrano de Tal");
      expect(resolverAutor(EQUIPE, "bolsista-9")).toBeNull();
    });
  });
});
