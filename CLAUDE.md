# CLAUDE.md — Diretrizes do SAREL (PPGTCA 2026)

## As 9 Regras Invioláveis da Lei Fundamental
1. **Regra 1 — Dado verdadeiro ou ausência declarada:** Nunca preencha lacuna com constante, média ou valor típico; ausência carrega causa formal. Cortes/pisos silenciosos são proibidos.
2. **Regra 2 — Nunca colapsar estados distintos:** "Não há" ≠ "falha de consulta" ≠ "fora da cobertura". Respostas externas e indisponibilidades usam enumeração discriminada fechada.
3. **Regra 3 — Proveniência viaja junto com o valor:** Todo valor científico trafega como `Proveniencia<T>` (`medido`, `modelado`, `tabelado`, `indisponivel`).
4. **Regra 4 — Nada calculado pelo sistema vira rótulo:** Modelos (RUSLE), índices e estratos jamais atuam como gabarito. Rótulo provém exclusivamente de observação humana.
5. **Regra 5 — Zero é um valor:** Verificação estrita de nulidade (`null`/`undefined`). Nunca `||` nem `??` para fallback numérico.
6. **Regra 6 — Respeitar as fontes legítimas:** Só entram no caminho analítico e fotointerpretação fontes com calibração, data por pixel e termos compatíveis com pesquisa.
7. **Regra 7 — Preservar o mascaramento do Earth Engine:** Máscaras removem dados inválidos; proibido `.unmask()` com constante sobre banda física.
8. **Regra 8 — Verificar antes de afirmar, com evidência arquivada:** Procedimento de 4 passos antes de integrar serviço externo; selo VERIFICADO exige arquivo em `docs/verificacoes/`.
9. **Regra 9 — Todo parâmetro metodológico tem dono e registro:** Parâmetros vivem em `src/config/decisoes.ts`; pendências geram `indisponivel`; só o pesquisador aprova.

Texto integral da Lei Fundamental: `docs/planejamento/PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md` (Parte II).

## Três Verdes Obrigatórios
Ao fim de cada fase, os três comandos devem passar sem asserções afrouxadas ou testes pulados:
- Testes herméticos: `npm run test`
- Verificação de tipos: `npx tsc --noEmit`
- Linter: `npm run lint`

## Disciplina Metodológica e Governança (§23.4 e §23.6)
- **Parar e perguntar (§23.4):** Diante de decisões 🛑 e de qualquer parâmetro metodológico fora do Registro de Decisões (`src/config/decisoes.ts`), pare e pergunte. O assistente propõe com alternativas e demonstração numérica, mas nunca aprova.
- **Isolamento do legado:** Código em `src/` NUNCA importa de `legado/` (fiscalizado por teste e ESLint).
- **Controle de versão (§23.6):** Nenhum `git commit`, `tag`, `branch` ou `push` sem autorização explícita do pesquisador.
