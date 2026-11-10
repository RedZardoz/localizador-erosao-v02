# PROMPT E′ — EXECUTOR SAREL — 10/11/2026
## Persistir o universo de candidatos e provar que o funil é reprodutível

**Substitui o Prompt E, que foi descartado.** O E trazia como tarefa bloqueante o conserto da
guarda de D11.2. Verificou-se depois que `MedicaoSoloNuLote.nObservacoes`
(`amostragemSoloNuLote.ts:78`) **é persistido por ponto no cache**, de modo que medir antes do
conserto não perde informação: a filtragem por suficiência pode ser aplicada depois, sem remedir.
A guarda saiu do caminho crítico e vai para o Prompt H, **antes do sorteio de D16**.

**O que não saiu:** sem as coordenadas dos candidatos não existe ingestão possível. É isto aqui.

---

## 0. LEITURA OBRIGATÓRIA

1. `docs/DESENVOLVIMENTO.md` integralmente.
2. `docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json` — o artefato histórico.
3. `npm run estado:verificar`.

Informe o branch e permaneça nele.

**Vale o PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: toda saída de comando vai para
`docs/verificacoes/execucao/2026-11-10/` e é citada por caminho, nunca transcrita.

**Disciplina de mensagem de commit:** a mensagem se escreve **depois do fato**, descrevendo o que
aconteceu. O Prompt D trouxe mensagem pronta pressupondo sucesso, a rodada recusou, e o commit
`bca0e50` ficou afirmando "calibracao de 30 pontos medida", que não ocorreu. Não repita.

---

## AVISO OPERACIONAL — rode esta execução SEM a credencial do GEE

Verificado em `scripts/remedir_candidatos_bp3_d16.ts`:

- `:384` carrega a credencial de lote; `:395` registra que, **sem** `SAREL_GEE_SERVICE_ACCOUNT_FILE`,
  segue com `credenciaisGeeAuth = null` e usa o cache persistente. O pipeline **não aborta**: chega
  normalmente ao `:664`, onde o artefato é gravado. Logo o E′ roda sem credencial e entrega tudo o
  que pede.
- `:411`, porém, chama `medirFrequenciaSoloNuEmLoteGeeRest` sobre **todos** os `candidatosComTerreno`,
  em blocos de 100, com `salvarCache: true`. **Com a credencial definida, esta execução mediria os
  680 pontos** — a ingestão completa, por acidente, antes da calibração de 30, antes de o desenho do
  lote estar decidido e com a guarda de D11.2 ainda morta.

**Portanto: garanta que `SAREL_GEE_SERVICE_ACCOUNT_FILE` NÃO está definida nesta execução.**
Confirme antes de rodar e grave a confirmação:

```
node -e "console.log('SAREL_GEE_SERVICE_ACCOUNT_FILE=', process.env.SAREL_GEE_SERVICE_ACCOUNT_FILE ?? '(nao definida)')" > docs/verificacoes/execucao/2026-11-10/credencial_ausente_confirmada.txt 2>&1
```

Se a saída mostrar um caminho, **pare**: desdefina a variável nesta sessão de terminal e rode de
novo. Ê deve sair desta rodada com 0 pontos medidos — isso é o esperado, não falha.

---

## TAREFA 1 — persistir o universo de candidatos

`scripts/remedir_candidatos_bp3_d16.ts` tem os candidatos em memória (`candidatosComTerreno`,
`candidatosValidos`, `candidatosComSoloNuMedido`) e grava no artefato **apenas o `.length` de cada
lista**. As coordenadas são descartadas ao fim da execução. É por isso que o Prompt D não teve o
que medir e acabou sorteando de um pool de 90 pontos de outra medição.

### 1.1 O artefato novo

O pipeline passa a gravar `docs/verificacoes/universo_candidatos_bp3_d16_<AAAA-MM-DD>.json`.

**Cabeçalho**, para que o arquivo se baste sem consultar o código:

- `FONTE_DOS_DADOS` (no padrão dos demais scripts de auditoria);
- a semente P07 e os raios de thinning inicial, final e o piso de P02 **efetivamente usados**;
- o domínio de declividade de D07 aplicado;
- o `funilContagem` completo;
- a data e o commit HEAD da execução.

**Por candidato**: `id`, `latitude`, `longitude`, `declividadePct`, `nivelK`, e a **proveniência de
cada um desses valores** — não o número cru. Se a proveniência de um campo não existir hoje no
objeto em memória, diga no relatório em vez de inventar um estado.

### 1.2 Invioláveis

- **Não** sobrescreva `remedicao_candidatos_bp3_d16_2026-09-30.json`. É registro histórico.
- O artefato novo é **descritivo**: ele registra o que a execução produziu. Não é ocasião para
  mudar thinning, domínio de D07, pedologia ou qualquer limiar. Se algo no caminho exigir decisão,
  **pare e relate**.
- Nenhum número sintético, em nenhuma circunstância. Falha é falha declarada.

---

## TAREFA 2 — provar que o funil é reprodutível

Esta é a tarefa de maior valor científico do prompt, e sai de graça na mesma execução: os números
de 30/09 já estão registrados e nunca foram reconferidos.

Rode o pipeline com o banco fundiário local e compare, etapa a etapa:

| Etapa | 30/09/2026 | Agora |
|---|---|---|
| `imoveisEnvelopeBP3` | 8651 | |
| `imoveisDivisorBP3ForaUC` | 4679 | |
| `candidatosPosThinning` | 687 | |
| `candidatosComTerrenoD07` | 680 | |
| `candidatosRealocadosParteElegivelX3` | 139 | |
| `candidatosValidosPedologia` | 677 | |

**Se todas baterem:** o universo é demonstradamente reprodutível. Registre na evidência — é uma
propriedade que o projeto afirma e nunca tinha provado, e passa a ser citável na dissertação.

**Se qualquer uma divergir: PARE.** Não ajuste número nenhum, de nenhum dos lados, e não siga para
a Tarefa 3. Relate:

- qual etapa divergiu e em quanto;
- se a divergência é a montante (muda tudo o que vem depois) ou isolada;
- as causas candidatas, com o que você conseguiu observar de cada uma: banco fundiário alterado
  desde 28/09, cache do DEM Copernicus, WFS da Embrapa, versão do WorldCover, ou não-determinismo
  no thinning ou na seleção de ponto elegível (P07).

Divergência aqui é achado maior que as duas tarefas deste prompt somadas: significaria que o funil
não é determinístico, e isso muda o que a dissertação pode afirmar sobre reprodutibilidade. É
resultado legítimo e importante, não fracasso seu.

---

## TAREFA 3 — travar o sorteio até a guarda de D11.2 ser reativada

A guarda que veda Ê com 6 a 11 observações nos tercis de D12 está **morta no caminho de produção**,
em três camadas independentes (achado S1-1 da auditoria DeepSeek de 09/11, verificado e ampliado em
10/11). O conserto foi adiado para o Prompt H porque não bloqueia a medição — mas **bloqueia o
sorteio**, e o modo de falha é silencioso: o sorteio funcionaria, produzindo estratos que o
pré-registro de D11.2 proíbe, sem nenhum teste vermelho.

Adiar sem trava é adiar para nunca. Portanto:

Em `scripts/sortear_poligonos_d16.ts`, no início da execução, antes de qualquer trabalho,
acrescente uma recusa no mesmo idioma das guardas que já existem ali (`process.exit(1)` com
mensagem explícita), dizendo, em substância:

```
[BLOQUEIO PRE-REGISTRADO D11.2] O sorteio de D16 esta travado.
A guarda que veda E-hat sob suficiencia insuficiente (6 <= n < 12, SE ~ 0,20) de entrar nos
tercis de D12 nao esta ativa no caminho de producao. Ver:
  - docs/auditorias/DeepSeek/AUDITORIA_FUNCIONAL_METODOLOGICA_2026-11-09.md, achado S1-1
  - docs/planejamento/prompts/PROMPT_EXECUTOR_... (Prompt H), que a reativa
Enquanto esta trava existir, nenhum sorteio pode ser executado. Remove-la e tarefa do Prompt H,
junto com o conserto, e nao antes.
```

Acrescente um teste que **prove que a trava existe e impede a execução**. Quando o Prompt H
reativar a guarda, esse teste e a trava saem juntos — e o teste falhando é o que garante que não
saiam separados.

**Não** conserte a guarda nesta rodada. Só trave.

---

## TAREFA 4 — evidência e commit

### 4.1 `docs/verificacoes/2026-11-10_universo_candidatos_e_reprodutibilidade.md`

1. O artefato novo: caminho, o que contém, quantos candidatos.
2. A tabela da Tarefa 2 preenchida, com o veredicto explícito de reprodutível ou não.
3. Se divergiu: a análise pedida, e o registro de que as Tarefas 3 e 4 foram feitas mesmo assim ou
   não, conforme o caso.
4. A trava do sorteio: por que existe, e que sua remoção é tarefa do Prompt H.
5. O que **não** foi feito: a medição de Ê, que segue à espera de credencial, e o conserto da
   guarda de D11.2.

### 4.2 Commit

Mensagem escrita **depois do fato**. Se a Tarefa 2 divergiu, a mensagem diz isso e **não** afirma
reprodutibilidade.

---

## CHECKLIST

Cada item cita o arquivo gravado em `docs/verificacoes/execucao/2026-11-10/`:

- [ ] Branch: ______
- [ ] AVISO — `credencial_ausente_confirmada.txt` gravado, mostrando a variável NÃO definida
- [ ] T1 — artefato do universo criado; nº de candidatos: ______; o de 30/09 intacto
- [ ] T1 — cada campo por candidato traz proveniência, ou o relatório diz qual não traz e por quê
- [ ] T2 — tabela preenchida. Bateram as seis? ______ Se não, qual etapa e em quanto: ______
- [ ] T2 — se divergiu, a análise de causas candidatas está na evidência
- [ ] T3 — trava do sorteio acrescentada; teste que a prova passa
- [ ] T3 — a guarda de D11.2 **não** foi consertada nesta rodada
- [ ] T4 — evidência escrita; mensagem de commit escrita após o fato
- [ ] `npm test` e `npx tsc --noEmit` — saídas gravadas
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
