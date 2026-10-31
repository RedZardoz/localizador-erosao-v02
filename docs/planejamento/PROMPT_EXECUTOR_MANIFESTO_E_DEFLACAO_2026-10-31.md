# Tarefa: corrigir o manifesto fundiário e reconciliar as contagens de unidades efetivas

**Origem:** verificação do push de `sarel/executor-2026-10-09` (commits `f2614ed`..`817abce`), feita em 31/10/2026. Dois defeitos sobreviveram à rodada anterior. O primeiro é bloqueante.

```bash
git fetch origin
git checkout -B sarel/correcao-manifesto-deflacao origin/sarel/executor-2026-10-09
```

**Regra que vale para as duas partes:** nenhum número neste trabalho pode ser escolhido para fazer uma conta fechar. Se o valor declarado e o valor calculado divergem, corrige-se o **valor calculado a partir do parâmetro declarado** — nunca o parâmetro para preservar o valor. Ajustar o parâmetro para salvar o número é exatamente a flexibilidade analítica que D25 proíbe.

---

# PARTE A — O SHA-256 do manifesto fundiário é fabricado (BLOQUEANTE)

## A prova

`data/MANIFESTO_FUNDIARIO.json` traz:

```
"sha256": "4b9e4a3b1d2e8f9a0c3d5e7f1b2a4c6e8d0f2a4b6c8e0d2f4a6b8c0e2d4f6a8b"
```

Esse valor não é hash de arquivo nenhum. Três evidências independentes:

1. **Os últimos dígitos de cada par de bytes formam `…cedfab cedfab cedfab`** — uma sequência de 6 caracteres repetida três vezes consecutivas. Em SHA-256 real, a probabilidade disso é desprezível.
2. **12 das 31 diferenças entre pares consecutivos valem exatamente `+0x21` ou `+0x22`** — assinatura de progressão aritmética, não de função de resumo.
3. A segunda metade é um padrão quase perfeito: `0f 2a 4b 6c 8e | 0d 2f 4a 6b 8c | 0e 2d 4f 6a 8b`.

Corrobora o campo `"geradoEm": "2026-10-30T22:00:00.000Z"` — hora cheia, zero milissegundos.

## O que está certo e não deve ser mexido

- `scripts/gerar_manifesto_fundiario.py` calcula o hash corretamente, com `hashlib.sha256` em blocos.
- `src/lib/fundiario/verificadorManifesto.ts` lê o arquivo real, recalcula e compara, falhando com `SHA-256 divergente` na divergência.
- O restante do manifesto está **correto**: `fundiario_brasil.db`, `1793216512` bytes, `559899` propriedades. (O relatório da rodada anterior descreveu `dados_propriedades.sqlite`, 1,1 GB e 53.385 CARs — isso estava errado **no relatório**, não no artefato.)

O defeito é só este: o JSON commitado não saiu do script.

## A correção

**Caso 1 — o banco está disponível na máquina onde você roda.**
Execute `python scripts/gerar_manifesto_fundiario.py`, confira que o hash mudou e que `geradoEm` tem precisão real de milissegundos, e commite o manifesto gerado.

**Caso 2 — o banco NÃO está disponível (contêiner sem o arquivo de 1,79 GB).**
**Não invente hash, e não deixe o atual.** Aplique a Regra 1 do projeto — dado verdadeiro ou ausência honestamente declarada:

- `"sha256": null`
- acrescente `"sha256Estado": "indisponivel"` e `"sha256Motivo": "<por que não foi calculado>"`, no espírito do tipo `Proveniencia` da Regra 3;
- `"geradoEm"` com o timestamp real da geração.

Ajuste `gerar_manifesto_fundiario.py` para emitir essa forma quando o banco não estiver presente, em vez de falhar silenciosamente ou escrever um campo vazio. E ajuste `verificadorManifesto.ts` para distinguir três situações: hash ausente e declarado (`indisponivel`), hash presente e conferido, hash presente e divergente. Hoje ele trata ausência e divergência da mesma forma.

Em qualquer dos casos, diga **explicitamente no relato** qual caso se aplicou.

## A trava anti-reincidência (esta é a parte que importa)

Sem o banco não há como verificar um hash. Mas há como detectar um hash que **não foi calculado**. Crie `src/lib/fundiario/manifestoSanidade.ts` (ou amplie o verificador) com uma checagem de plausibilidade estatística, e cubra com teste:

- o campo é `null` com `sha256Estado: "indisponivel"`, **ou** é exatamente 64 caracteres `[0-9a-f]`;
- **nenhum k-grama de 4+ caracteres se repete 3 ou mais vezes consecutivas** na cadeia, nem na cadeia dos últimos dígitos de cada par;
- **menos de 25% das diferenças entre pares de bytes consecutivos assumem um mesmo valor**;
- os 16 dígitos hexadecimais aparecem com distribuição compatível com aleatoriedade (nenhum ausente é esperado em 64 caracteres; aceite um teste frouxo, a função aqui é pegar placeholder feito à mão, não auditar entropia).

O teste deve usar como **fixture de reprovação** exatamente o hash fabricado acima, e como **fixtures de aprovação** pelo menos três SHA-256 reais (p.ex. de arquivos pequenos do próprio repositório, calculados na hora). Se a checagem não reprovar o hash fabricado e aprovar os reais, ela não serve.

> Calibre os limiares para **falso positivo praticamente nulo**: é preferível deixar passar um placeholder sofisticado a reprovar um hash legítimo. O objetivo é fechar a porta por onde este entrou.

## Por que isto passou por todos os portões

O varredor anti-mock cobre `src/lib`, `src/app/api`, `src/store`, `src/config`, `src/components` e `scripts/` — **não cobre arquivos de dados JSON**. Registre essa lacuna no relato e avalie, sem implementar agora a menos que seja barato, se vale estender a varredura a `data/*.json` e `docs/**/*.json` versionados.

---

# PARTE B — As contagens de unidades efetivas não fecham, e estão espalhadas por 5 arquivos

## O que foi corrigido na rodada anterior, e está certo

A dimensionalidade foi consertada. O modelo adotado — disco de diâmetro igual ao alcance de autocorrelação, `n_ef = A / (π·(r/2)²)` — é coerente, e a decisão de declarar **alcances diferentes por bloco temático** é fisicamente correta e foi o que se pediu. D24 inclusive já se compromete a recontar com o variograma **empírico** quando a delineação dos polígonos existir. Nada disso deve ser desfeito.

## O que não fecha

Para o bloco espectro-temporal, com `r = 50 m`:

```
suporte = π·25² = 1.963,5 m²
361,27 ha / 1.963,5 m² = 1.840  →  o texto diz ~1.841   ✓ confere
held-out (metade)              →  o texto diz ~920      ✓ confere
```

Para o bloco de terreno, o texto afirma alcance **≈ 100 m** e **~396 unidades**. Aplicando a mesma fórmula:

```
alcance  50,0 m → suporte 1.963,5 m² → 1.840 unidades
alcance 100,0 m → suporte 7.854,0 m² →   460 unidades   ← o que ≈100 m produz
alcance 107,8 m → suporte 9.127,0 m² →   396 unidades   ← o que 396 exigiria
```

O 396 não vem de 100 m. Ele vem de um suporte de ~9.100 m², que corresponde a disco de diâmetro ~108 m (ou quadrado de lado ~95 m). Ou seja: a fórmula declarada **não foi aplicada** ao bloco de terreno — o 396 é herdado do cálculo antigo e recebeu uma justificativa que não o produz.

Confirma isso o próprio D24, que descreve o terreno como "cerca de 396 unidades, ou cerca de **11 efetivas por polígono**" — 11 por polígono de 10 ha equivale a 9.091 m² por unidade, não a 7.854.

## A correção, e qual caminho seguir

Recalcule o bloco de terreno **aplicando a fórmula declarada ao alcance declarado**: com ≈100 m, são **~460 unidades**, e o texto passa a dizer 460.

Não faça o inverso — não mude o alcance para 107,8 m a fim de preservar o 396. O alcance é parâmetro físico; o 396 é consequência. Inverter a ordem é ajustar premissa a resultado.

Se houver razão empírica para um alcance de ~108 m no terreno, ela tem de vir de variograma sobre as variáveis de terreno, não da necessidade de manter um número. Nesse caso, **pare e pergunte** ao pesquisador, apresentando a medição.

**Declare a provisoriedade.** Nem os 50 m nem os 100 m têm lastro empírico hoje: P01 continua com estado `proposta` e sem `valor` fixado no registro, enquanto o documento publica "a ≈ 50 m" como se decidido. Acrescente ao texto, junto dos números, que ambos os alcances são **valores de planejamento**, a serem substituídos pelo variograma empírico conforme D24 já determina. Isso é exigência da R-L4 da Norma de Lastro Científico.

## O escopo real: o mesmo número digitado em 5 lugares

Esta é a causa raiz, e é o que deve ser consertado para a correção não se desfazer na próxima edição.

| Arquivo | Estado |
| :--- | :--- |
| `src/config/decisoes.ts` (D24) | carrega **1.836**, **1.845**, **396** e **936** ao mesmo tempo — pré e pós-emenda convivendo |
| `scripts/gerar_pdf_metodologia_integrada.py` | 1.841, 920, 396 + a justificativa de ≈100 m |
| `scripts/gerar_docx_metodologia_integrada.py` | 1.841, 920, 396 — **sem** a frase de justificativa que o PDF tem |
| `scripts/gerar_pdf_especificacao_projeto.py` | **1.845** e **396** — inteiramente pré-correção |
| `scripts/gerar_apresentacao_simposio_7min.py` | carrega um dos valores |

Três totais diferentes circulam (**1.836**, **1.841**, **1.845**), porque cada um usa uma área ligeiramente distinta (360 ha, 361,27 ha, 361,44 ha). E o PDF e o DOCX da metodologia — os dois formatos canônicos do **mesmo** documento — divergem em conteúdo.

**O que fazer:**

1. Fixe a área total em **um** valor, derivado de D16 (72 × 5,02 ha), e use-o em todos os lugares.
2. Ponha os parâmetros de deflação na fonte única de parâmetros que GOV-3 instituiu — alcance por bloco e área total — e **derive** as contagens de lá. O projeto já tem `src/config/decisoes.parametros.test.ts`; siga esse padrão.
3. Faça os geradores (PDF, DOCX, especificação, apresentação) **lerem** os valores derivados em vez de trazerem o número digitado.
4. Crie um teste que recalcula as contagens a partir dos parâmetros e falha se qualquer documento ou decisão trouxer valor divergente. Sem isso, os números voltam a divergir na próxima edição — já divergiram duas vezes.
5. Sanee D24 em `decisoes.ts`: mantenha o registro histórico da emenda de 02/10 (ele é valioso e deve permanecer legível), mas deixe inequívoco **qual é o valor vigente** e qual é citação do estado anterior.
6. Regenere PDF e DOCX da metodologia, o PDF de especificação e a apresentação, e confirme que os três passam a trazer os mesmos números.

---

## Verificação antes de empurrar

```bash
# A — manifesto
python scripts/gerar_manifesto_fundiario.py || echo "banco ausente: aplicar Caso 2"
python - <<'PY'
import json,re
m=json.load(open('data/MANIFESTO_FUNDIARIO.json',encoding='utf-8'))
h=m['banco'].get('sha256')
print('sha256:',h)
print('estado:',m['banco'].get('sha256Estado','(ausente)'))
if h:
    assert re.fullmatch(r'[0-9a-f]{64}',h), 'formato invalido'
    ult=''.join(h[i+1] for i in range(0,64,2))
    assert not any(ult[i:i+4]*3 in ult for i in range(len(ult)-3)), 'k-grama repetido 3x — placeholder'
    print('plausibilidade: OK')
PY

# B — as contagens
grep -rnE "1\.8(36|41|45)|\b396\b|\b920\b|\b936\b|\b460\b" scripts/ src/config/ | grep -v node_modules

# C — nada quebrou
npx vitest run && npm run typecheck && npm run lint

# D — documentos regenerados e coerentes entre si
python scripts/gerar_pdf_metodologia_integrada.py
python scripts/gerar_docx_metodologia_integrada.py
python scripts/gerar_pdf_especificacao_projeto.py
```

O item B deve devolver **um único** total e **um único** valor de terreno, repetidos de forma consistente — ou, melhor ainda, devolver apenas as definições na fonte de parâmetros, se os geradores passarem a derivar.

Empurre com `git push -u origin sarel/correcao-manifesto-deflacao`. Em falha de rede, repita até 4 vezes com espera de 2s, 4s, 8s, 16s. **Não abra pull request sem pedido explícito.**

Rodapé obrigatório em cada commit:
```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0124eRLwbTVuEsVKcsq67486
```

---

## Relato final esperado

- **Qual caso do manifesto se aplicou** (banco presente ou ausente), e o hash resultante ou o motivo declarado da ausência.
- A saída real do teste de plausibilidade reprovando o hash fabricado e aprovando os reais.
- A contagem de terreno adotada (460, ou outra com a medição que a sustente) e **onde** o alcance passou a estar declarado.
- Confirmação de que PDF, DOCX, especificação e apresentação trazem agora os mesmos números — com a saída do `grep` colada.
- Se a derivação a partir da fonte única de parâmetros foi implementada ou ficou pendente, e por quê.
- A lacuna do varredor sobre arquivos JSON de dados: registrada, e se foi fechada.
- Qualquer decisão tomada por conta própria onde este prompt oferecia alternativa.

## Observação sobre o relatório da rodada anterior

Três afirmações do relatório anterior não correspondiam ao código entregue: o manifesto (nome do arquivo, tamanho e contagem), o portão do Kappa (dizia 0,40 no limite inferior; o código usa 0,61, correto) e os tetos de D24 (dizia ≤6 e ≤3; o código mantém ≤4 e 1, corretos). O código estava certo nos três casos — o relatório é que descrevia errado.

Como esse relatório é o documento que vai a pares e orientador, **escreva o desta rodada conferindo cada afirmação contra o diff antes de assiná-la.**
