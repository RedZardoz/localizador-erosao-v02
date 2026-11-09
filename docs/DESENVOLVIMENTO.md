# Diretrizes de Desenvolvimento — SAREL (PPGTCA 2026)

## Leitura Obrigatória no Início de Toda Sessão
Antes de propor ou executar qualquer ação no repositório:
1. `docs/planejamento/ESTADO.md` — estado medido, nunca de memória;
2. `docs/planejamento/DECISOES_DE_CONVERSA.md` — o que já foi decidido;
3. Rodar `npm run estado:verificar` e conferir antes de propor qualquer coisa. Este comando
   SOMENTE LÊ: compara o painel em disco com o estado medido do repositorio e sai com codigo 1
   se divergirem. NAO use `npm run estado` para conferir — ele reescreve o painel avancando-o
   para o HEAD vivo e suja a arvore de trabalho. `npm run estado` e para quando voce QUER
   avancar o painel, e a alteracao resultante entra em commit proprio.

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

## Ambiente de Desenvolvimento — Armadilhas Críticas
- **Instalação de Dependências:** Usar sempre `npm ci` e nunca `npm install` (evita adulteração silenciosa do `package-lock.json`).
- **Servidor Next.js e Rotas de API:** O `next start` indexa rotas na inicialização, de modo que rota nova exige reinício do servidor.

## Restrição técnica: consulta de série temporal ao Earth Engine
- A série temporal por ponto exige `ImageCollection.getRegion`, que devolve uma linha por cena; `Image.reduceRegions` NÃO serve, porque agrega e devolve um valor por ponto — adequado a escalares como a frequência de solo nu, usada em `src/lib/gee/amostragemSoloNuLote.ts`, e inadequado a séries.
- Por isso `medirSerieSentinel2EmLoteGeeRest` (`src/lib/gee/copernicusGeeClient.ts:1204-1228`) emite UMA requisição por ponto, com no máximo 15 simultâneas. O termo "lote" ali designa paralelismo do lado do cliente, não operação em lote no servidor do GEE.
- O teto de concorrência existe por limite de taxa do GEE.
- Um eventual teto de tamanho de resposta em `getRegion` é hipótese a confirmar por medição ao vivo, nunca fato verificado.
