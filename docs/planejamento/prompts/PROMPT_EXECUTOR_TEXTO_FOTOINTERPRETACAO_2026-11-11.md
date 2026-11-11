# PROMPT U — EXECUTOR SAREL — corrigir o texto sobre fotointerpretação humana

**Escopo estrito: correção de texto.** O método não está em questão e **não muda**. D16 item 4
aposentou a fotointerpretação da Fase A, e a decisão permanece como está.

O que se corrige: trechos que **descrevem a fotointerpretação humana como se estivesse em uso**.
O que se preserva: todo trecho que **registra que ela foi aposentada**, e todo registro histórico.

---

## 0. PROTOCOLO

`docs/DESENVOLVIMENTO.md`. Informe o branch e permaneça nele. Saídas em
`docs/verificacoes/execucao/2026-11-11u/`. **Commit escrito depois do fato. `git push` confirmado.**

---

## 1. A DISTINÇÃO QUE GOVERNA ESTA RODADA

Três grupos. Trate cada um de modo diferente, e **classifique cada ocorrência no relatório**:

**(i) Descreve como ativo** — "a fotointerpretação é realizada por dois intérpretes independentes",
"ingestão de fotointerpretação da Fase A". → **corrigir**, para o passado e apontando D16 item 4.

**(ii) Registra a aposentadoria** — "a fotointerpretação humana sobre pixels de 10 m do Sentinel-2
foi aposentada pela Decisão D16 item 4". → **preservar intacto**. Um método que declara o que
descartou, e por quê, é mais forte que um que apaga.

**(iii) Registro histórico** — prompts antigos, inventário de legado, auditorias. →
**não tocar**. São o que aconteceu, não o que se afirma hoje.

Em caso de dúvida entre (i) e (ii), **preserve e relate**. Apagar registro de decisão é pior que
deixar um texto ambíguo.

---

## TAREFA 1 — varredura e classificação

```
git grep -n -i "fotointerpret" -- src docs
```

Grave a saída. O levantamento do planejador encontrou ocorrências em onze arquivos, entre eles:
`src/config/decisoes.ts`, `docs/planejamento/DECISOES.md`, `src/lib/rotulos/taxaErro.ts`,
`src/lib/rotulos/ingestaoInterpretacao.ts`, `src/components/campanha/PainelCampanha.tsx`,
`src/components/campanha/PainelCampanhaModal.tsx`, `src/components/sidebar/FiltersPanel.tsx`,
`docs/metodologia/FICHA_TECNICA_SAREL.md`, `src/lib/planet/quota.ts`, e documentos históricos.

**Já verificado pelo planejador — não precisa reclassificar:**

- `PainelCampanha.tsx:894,898,905`, `PainelCampanhaModal.tsx:39` e `FiltersPanel.tsx:125` são do
  **grupo (ii)**: a interface já declara a aposentadoria corretamente. **Não altere.**
- `PROMPT_ATUALIZACAO_FRONTEND_2026-10-02.md`, `PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md` e
  `INVENTARIO_LEGADO.md` são do **grupo (iii)**. **Não toque.**
- Em `decisoes.ts` e `DECISOES.md`, o texto de D16 que declara a aposentadoria é **(ii)**.
  **Preserve.** Verifique se há outra ocorrência nesses arquivos que seja (i).

**A classificar e corrigir:** `docs/metodologia/FICHA_TECNICA_SAREL.md`, os cabeçalhos de
`src/lib/rotulos/taxaErro.ts` e `src/lib/rotulos/ingestaoInterpretacao.ts`, e
`src/lib/planet/quota.ts`. Mais o que a varredura revelar em `docs/metodologia` e
`docs/dissertacao`.

---

## TAREFA 2 — os dois módulos da Fase A

`src/lib/rotulos/ingestaoInterpretacao.ts` e `src/lib/rotulos/taxaErro.ts` servem exclusivamente à
fase aposentada. `ingestaoInterpretacao` **não tem consumidor algum**.

**Não os remova nesta rodada.** Corrija apenas o cabeçalho de cada um, para declarar que
implementam a Fase A **aposentada por D16 item 4**, que são mantidos como registro da arquitetura
construída, e que não participam do fluxo vigente.

A remoção, se desejada, é decisão do pesquisador e pode ser registrada como pendência — mas há
argumento para mantê-los, pelo mesmo motivo que se mantém o código do Modelo P: é parte do que o
trabalho construiu.

---

## TAREFA 3 — o perfil `interpretacao-cega`

A trava instalada no Prompt Q documenta esse perfil como *"destina-se aos fotointérpretes de
imagens de satélite (Fase A)"* — papel aposentado.

**Não remova o perfil nem altere suas colunas.** Corrija apenas a descrição, e acrescente nota de
que o papel de interpretação vigente é a **delineação sobre ortomosaico de VANT**, cujo perfil é
`voo-cego`.

**A pergunta foi respondida pelo pesquisador em 11/11/2026: é a mesma pessoa.** Quem voa é quem
delineia sobre o ortomosaico. Portanto:

- **`voo-cego` cobre o papel.** Suas quatro colunas — `Codigo`, `Latitude`, `Longitude`,
  `Area_Voo_Poligono` — bastam para voar e para delinear, e não revelam estrato, titular,
  probabilidade de inclusão nem partição treino/held-out. O cegamento do desfecho está preservado:
  quem atribui a fração erodida não sabe de que estrato o polígono veio.
- **`interpretacao-cega` não tem ocupante.** O papel de fotointerpretação de satélite da Fase A foi
  aposentado por D16 item 4, e a interpretação vigente é a delineação sobre ortomosaico, coberta
  por `voo-cego`.

**Registre isso em `DECISOES_DE_CONVERSA.md`**, entrada nova datada, com as duas consequências
acima, e **não remova o perfil** — a decisão sobre removê-lo ou mantê-lo como arquitetura
construída é do pesquisador, como a do Modelo P e a dos módulos da Fase A.

**Registre também, como pendência separada, um achado do levantamento:** a delineação ocorre **fora
do SAREL**. O sistema apenas exige a presença de `Area_Delineada_m2` na exportação
(`exigirDelineacaoD26`); não há rota nem módulo de ingestão de resultado de delineação. Como D26
define o alvo do modelo **por delineação de VANT**, o desfecho entra por um caminho que o sistema
não instrumenta — o que merece decisão própria antes da campanha.

---

## TAREFA 4 — trava

Trava que falhe se algum documento de `docs/metodologia` ou `docs/dissertacao` descrever
fotointerpretação **como procedimento vigente** — por exemplo "a fotointerpretação é realizada",
"os fotointérpretes avaliam", "dois intérpretes independentes classificam".

**Não** faça a trava acusar a mera palavra "fotointerpretação": ela precisa aparecer, no registro
da aposentadoria. Detecte a afirmação de vigência, não o termo. Declare os limites da heurística no
próprio teste e inclua **meta-teste** com frase sintética.

---

## TAREFA 5 — evidência e commit

`docs/verificacoes/2026-11-11u_texto_fotointerpretacao.md`: a varredura com **cada ocorrência
classificada** em (i), (ii) ou (iii); o antes e depois de cada correção; os cabeçalhos dos dois
módulos; a nota do perfil; a pendência da Tarefa 3; e o resultado da trava com o meta-teste.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] T1 — varredura gravada; cada ocorrência classificada em (i), (ii) ou (iii)
- [ ] T1 — ocorrências (ii) e (iii) **intactas**; interface **não alterada**
- [ ] T2 — cabeçalhos dos dois módulos corrigidos; **nenhum código removido**
- [ ] T3 — descrição do perfil corrigida; colunas **inalteradas**; perfil **não** removido
- [ ] T3 — resposta do pesquisador registrada: mesma pessoa voa e delineia; `voo-cego` cobre
- [ ] T3 — registrada a pendência da ingestão de delineação, que ocorre fora do sistema
- [ ] T4 — trava detecta vigência, não o termo; meta-teste acusa frase sintética
- [ ] T5 — evidência escrita
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] **`git push` confirmado contra o remoto**
