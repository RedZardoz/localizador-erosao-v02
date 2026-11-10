# PROMPT E — EXECUTOR SAREL — 10/11/2026
## Reativar a guarda de D11.2 e persistir o universo de candidatos

**Por que antes da ingestão.** A guarda que impede Ê com 6 a 11 observações de entrar nos tercis
de D12 está **morta no caminho de produção**. Se a rodada de 680 for feita antes do conserto, os
valores entram nos estratos sem passar por ela e a medição terá de ser descartada. Como
`candidatosComSoloNuMedido` ainda é 0, consertar agora não descarta nada — mesmo argumento que
valeu para a máscara GEOS3 e para o hash da métrica.

---

## 0. LEITURA OBRIGATÓRIA

1. `docs/DESENVOLVIMENTO.md` integralmente.
2. `src/config/decisoes.ts`, bloco **D11** — em especial a EMENDA DE 31/10/2026, que é
   pré-registrada e explícita sobre o veto.
3. `docs/auditorias/DeepSeek/AUDITORIA_FUNCIONAL_METODOLOGICA_2026-11-09.md`, achado **S1-1**.
4. `npm run estado:verificar`.

Informe o branch e permaneça nele. **Vale o PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: toda
saída de comando vai para `docs/verificacoes/execucao/2026-11-10/` e é citada por caminho.

### 0.1 Disciplina de mensagem de commit (corrige um erro do Prompt D)

O Prompt D trazia mensagem de commit pronta que **pressupunha que a rodada daria certo**. A rodada
recusou corretamente por falta de credencial, e o commit `bca0e50` ficou afirmando "calibracao de
30 pontos medida" — o que não aconteceu. Isso é dívida permanente no histórico.

**Regra, daqui em diante:** a mensagem de commit descreve **o que aconteceu**, escrita depois do
fato. Modelo em prompt é esqueleto, não texto a copiar. Se uma tarefa não foi concluída, a mensagem
diz isso. Nenhum assunto de commit afirma resultado que o relatório não sustenta.

---

## TAREFA 1 — reativar a guarda de D11.2 (três camadas; consertar uma só não resolve)

Verificado no código em 10/11/2026. A guarda falha em **três pontos independentes**, e qualquer
um deles sozinho já a anula:

### Camada A — a proveniência do lote não declara qualidade

`src/lib/gee/amostragemSoloNuLote.ts:654` usa `avaliarSuficienciaAmostralD11(nObservacoes)`, cujo
piso é o genérico `LIMIAR_MINIMO_OBSERVACOES_D11 = 6` (`copernicusGeeClient.ts:29`) — não o
`N_MINIMO_OBSERVACOES_SOLO_NU_D11_2 = 12` de D11.2. E a `Proveniencia` gravada **não traz bloco
`qualidade`**.

**Conserto.** A `Proveniencia<number>` de `frequenciaSoloNu` passa a gravar sempre:

```ts
qualidade: {
  nObservacoes,                       // contagem real de cenas validas
  regime: nObservacoes >= N_MINIMO_OBSERVACOES_SOLO_NU_D11_2 ? "padrao_pleno" : "fallback_janela_curta",
  erroPadrao,                         // 0.5 / sqrt(nObservacoes)
  elegivelD12: nObservacoes >= N_MINIMO_OBSERVACOES_SOLO_NU_D11_2,
}
```

Confirme os nomes de campo contra o tipo `Proveniencia` antes de escrever; **não invente campo**.
Se o tipo não comportar algum deles, estenda o tipo e diga no relatório.

### Camada B — `podeEntrarEstratificacaoD12` não checa `medido`

`src/lib/matriz/montagemTemporal.ts:77-90`:

```ts
if (prov.estado !== "medido" && prov.estado !== "modelado") return false;
if (prov.estado === "modelado") { ...checagens de n >= 12... }
return true;
```

A checagem de `n >= 12` roda **apenas para `modelado`**. O caminho de produção do GEE grava
`medido` — logo passa direto, sem checagem alguma. Mesmo que a Camada C fosse consertada, um
`medido` com n=6 entraria nos estratos.

**Conserto.** A checagem de suficiência vale para `medido` **e** `modelado`, e é **fail-closed na
ausência**: se `qualidade.nObservacoes` for `undefined`, a função retorna `false`. Hoje a condição
`prov.qualidade?.nObservacoes !== undefined && ...` faz o contrário — ausência de qualidade declarada
**passa**. Inverta: qualidade não declarada é inelegível.

### Camada C — a rota não passa a proveniência, e a guarda só roda se ela existir

`src/app/api/gee/select-candidates/route.ts` monta o candidato com
`{ id, latitude, longitude, declividadePct, frequenciaSoloNu, nivelK }` — **sem `provenienciaE`**.
E `src/lib/gee/estratificacao.ts:167` é `if (c.provenienciaE && !podeEntrarEstratificacaoD12(...))`.
Com `provenienciaE` sempre `undefined`, o `&&` curto-circuita e a guarda nunca dispara.

**Conserto.**
1. A rota passa `provenienciaE` no `CandidatoEstratificacao`.
2. `executarAmostragemEstratificada` **exige** `provenienciaE`: candidato sem ela é erro explícito
   nomeando D11.2, não um `if` que se cala. Remova o curto-circuito `c.provenienciaE &&`.
3. Estenda o tipo `CandidatoEstratificacao` para tornar `provenienciaE` obrigatório, de modo que a
   omissão vire erro de compilação e não bug silencioso.

### 1.4 Travas obrigatórias

1. **Integração pela rota**: monta candidato com `nObservacoes = 6` e prova que a rota **não** o
   estratifica. É o teste que o S1-1 pede e que não existe.
2. **`medido` com n=6 é recusado** por `podeEntrarEstratificacaoD12` — pega a Camada B.
3. **Qualidade ausente é recusada** — pega a inversão fail-closed.
4. **Candidato sem `provenienciaE` falha** com erro que nomeia D11.2 — pega a Camada C.
5. **n=12 exatamente é aceito** — fronteira inclusiva, coerente com o texto de D11.2.
6. Teste que o lote grava `qualidade.nObservacoes` igual à contagem real de cenas.

---

## TAREFA 2 — persistir o universo de candidatos

`scripts/remedir_candidatos_bp3_d16.ts` tem os candidatos em memória (`candidatosComTerreno`,
`candidatosValidos`, `candidatosComSoloNuMedido`) e grava **apenas `.length` de cada um** no
artefato. As coordenadas dos 680 são descartadas ao fim da execução. É por isso que o Prompt D não
teve lista para medir e caiu num pool de 90 pontos de outra medição.

**Conserto.** O pipeline passa a gravar um artefato próprio com a lista:

`docs/verificacoes/universo_candidatos_bp3_d16_<AAAA-MM-DD>.json`, contendo, por candidato:
`id`, `latitude`, `longitude`, `declividadePct`, `nivelK`, e a proveniência de cada um desses
valores. Mais um cabeçalho com `FONTE_DOS_DADOS`, a semente P07, os raios de thinning efetivos e as
contagens do funil — de modo que o arquivo se baste.

**Não** sobrescreva `remedicao_candidatos_bp3_d16_2026-09-30.json`: ele é registro histórico.

---

## TAREFA 3 — provar que o funil é reprodutível

Esta é a tarefa de maior valor científico do prompt, e ela é de graça: os números de 30/09 já estão
registrados.

Rode o pipeline de remedição com o banco fundiário local e **compare**, um a um, contra o
`funilContagem` do artefato de 30/09:

| Etapa | 30/09/2026 | Agora |
|---|---|---|
| `imoveisEnvelopeBP3` | 8651 | |
| `imoveisDivisorBP3ForaUC` | 4679 | |
| `candidatosPosThinning` | 687 | |
| `candidatosComTerrenoD07` | 680 | |
| `candidatosRealocadosParteElegivelX3` | 139 | |
| `candidatosValidosPedologia` | 677 | |

**Se todos baterem**, o universo é reprodutível e passa a ser artefato versionado e confiável.
Registre isso na evidência: é uma propriedade que o projeto afirma e nunca tinha demonstrado.

**Se algum divergir, PARE.** Não "corrija" o número novo nem o antigo. Relate qual etapa divergiu,
em quanto, e as causas candidatas — banco fundiário alterado, cache do DEM, WFS da Embrapa, versão
do WorldCover. Divergência aqui significa que o funil não é determinístico, o que é achado maior que
qualquer tarefa deste prompt e muda o que a dissertação pode afirmar sobre reprodutibilidade.

Grave a saída completa conforme o protocolo.

---

## TAREFA 4 — evidência e commit

### 4.1 `docs/verificacoes/2026-11-10_guarda_d11_e_universo_candidatos.md`

1. As três camadas do defeito de D11.2, com arquivo e linha, antes e depois.
2. Por que consertar uma só não bastaria — em especial que o caminho de produção grava `medido`,
   que a Camada B não checava.
3. A tabela de reprodutibilidade da Tarefa 3, com o veredicto.
4. O artefato novo do universo de candidatos e o que ele contém.
5. O que **não** foi feito nesta rodada: a medição de Ê, que continua à espera de credencial.

### 4.2 Commit

**Escreva a mensagem depois do fato, descrevendo o que aconteceu** (ver §0.1). Se a Tarefa 3
divergir e você parar, a mensagem diz isso e o commit não afirma reprodutibilidade.

---

## CHECKLIST

Cada item cita o arquivo gravado em `docs/verificacoes/execucao/2026-11-10/`:

- [ ] Branch: ______
- [ ] T1-A — `qualidade` gravada na proveniência do lote, com `nObservacoes` real
- [ ] T1-B — `podeEntrarEstratificacaoD12` checa `medido`; ausência de qualidade é **inelegível**
- [ ] T1-C — rota passa `provenienciaE`; curto-circuito removido; tipo tornou a omissão erro de compilação
- [ ] T1 — as 6 travas passam, incluindo a de integração pela rota com n=6
- [ ] T2 — artefato do universo criado, com coordenadas e proveniências; o de 30/09 intacto
- [ ] T3 — tabela de reprodutibilidade preenchida. Bateu tudo? ______ Se não, qual etapa: ______
- [ ] T4 — evidência escrita; mensagem de commit escrita após o fato
- [ ] `npm test` e `npx tsc --noEmit` — saídas gravadas
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
