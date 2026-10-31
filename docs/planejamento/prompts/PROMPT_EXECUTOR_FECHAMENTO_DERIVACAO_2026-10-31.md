# Tarefa: fechar a derivação dos parâmetros de deflação

**Origem:** verificação do push `817abce..0940c64` em `sarel/executor-2026-10-09`, feita em 31/10/2026.

A rodada anterior está substancialmente correta: o hash fabricado foi removido e substituído pela forma do Caso 2, a trava `manifestoSanidade.ts` reprova o hash fabricado por dois critérios independentes, o 460 foi derivado corretamente do alcance declarado, e `PARAMETROS_DEFLACAO.json` + `deflacao.ts` + a emenda de 31/10 em D24 criaram a fonte única. **Nada disso deve ser desfeito.**

Faltam dois acabamentos. São pequenos e cirúrgicos — não ampliem o escopo.

```bash
git fetch origin
git checkout -B sarel/fechamento-derivacao origin/sarel/executor-2026-10-09
```

---

## Ajuste 1 — Seis valores ainda digitados à mão

O relatório anterior afirmou que a derivação ficou "100% implementada". Não ficou. Seis ocorrências continuam como literal no texto dos geradores — e em dois casos o literal está **ao lado** da versão interpolada, no mesmo par de parágrafos:

| Arquivo : linha | Trecho atual | Valor a interpolar |
| :--- | :--- | :--- |
| `scripts/gerar_pdf_metodologia_integrada.py:694` | `Teto de até <b>8 preditores</b> (~1.841 unidades espacialmente independentes...` | `espectroTemporal.unidadesEfetivasTotal` |
| `scripts/gerar_pdf_metodologia_integrada.py:704` | `...held-out lacrado</b> (cerca de 920 unidades efetivas independentes; D16, D25)` | `espectroTemporal.unidadesEfetivasHeldOut` |
| `scripts/gerar_docx_metodologia_integrada.py:554` | `...held-out lacrado (cerca de 920 unidades efetivas independentes; D16)` | `espectroTemporal.unidadesEfetivasHeldOut` |
| `scripts/gerar_pdf_mudanca_metodologica.py:473` | `...probabilística. Com ~1.841 unidades espacialmente independentes` | `espectroTemporal.unidadesEfetivasTotal` |
| `scripts/gerar_pptx_mudanca_metodologica.py:513` | `72 polígonos x 25,6 unidades = <b>~1.841 unidades independentes</b>` | `espectroTemporal.unidadesEfetivasTotal` |
| `scripts/gerar_pptx_mudanca_metodologica.py:551` | `Com ~1.841 unidades independentes e prevalência esperada de 10% a 15%:` | `espectroTemporal.unidadesEfetivasTotal` |

O caso mais ilustrativo é o par de bullets do PDF da metodologia: a linha **694** (espectro-temporal) traz `~1.841` cravado, enquanto a linha **695** (terreno), logo abaixo, já usa `f"...~{PARAM_DEFLACAO['terreno']['unidadesEfetivasTotal']}..."`. Duas linhas consecutivas, dois regimes diferentes.

**`scripts/gerar_pdf_mudanca_metodologica.py` e `scripts/gerar_pptx_mudanca_metodologica.py` não carregam `PARAM_DEFLACAO` de forma alguma** — zero ocorrências. Conecte-os replicando o carregador que já existe em `scripts/gerar_pdf_especificacao_projeto.py` (linhas 17-23, função `carregar_parametros_deflacao()` com fallback de caminho).

Atenção ao `gerar_pptx_mudanca_metodologica.py:513`: além do total, ele traz `25,6 unidades` por polígono, que também é derivado (área do polígono ÷ área de suporte). Interpole os dois ou reescreva a frase para não repetir a aritmética no texto.

### O que NÃO mudar

`scripts/d25/test_avaliacao_d25_referencia.py:58` — `self.assertAlmostEqual(n, 1840.9, delta=0.5)`.

Eu havia listado isso como sétimo ponto a interpolar. **Estava errado.** É um teste de regressão: o valor esperado cravado é exatamente o que faz o teste alertar quando o parâmetro muda. Se ele ler o mesmo JSON que o código, vira tautologia e deixa de testar qualquer coisa.

Deixe o número onde está. Apenas atualize o comentário ao lado para apontar a fonte canônica — algo como `# valor canonico em data/PARAMETROS_DEFLACAO.json (espectroTemporal.unidadesEfetivasTotal)` — para que, ao falhar, quem lê saiba onde conferir.

---

## Ajuste 2 — A trava anti-deriva está voltada para o passado

`src/config/deflacao.test.ts` proíbe `~1.845`, `~396 unidades` e `936 unidades` — os valores **antigos**. Não proíbe `~1.841` nem `920 unidades` cravados à mão. Por isso ela passa verde hoje, com os seis literais acima no lugar.

Uma guarda contra deriva precisa vigiar o que vem, não o que já foi corrigido. Se amanhã o alcance mudar de 50 m para o variograma empírico, os seis literais não acompanham e nada avisa.

Há ainda duas fragilidades na verificação positiva atual:

```ts
expect(text.includes("PARAM_DEFLACAO") || text.includes("460"), ...).toBe(true);
```

- o `|| text.includes("460")` torna a asserção satisfazível por um literal cravado — exatamente o que ela deveria impedir;
- a checagem é por **arquivo**, não por ocorrência: basta uma interpolação em qualquer linha para o arquivo inteiro passar. Foi o que aconteceu com o PDF da metodologia.

### Como inverter

Reescreva o teste para que a lista de proibições seja **derivada do JSON**, não digitada:

1. Leia `data/PARAMETROS_DEFLACAO.json`.
2. Para cada valor derivado (`1841`, `920`, `460`, `230` e o que mais existir), formate-o como aparece no texto — com separador de milhar — e **proíba a ocorrência literal** em todos os cinco geradores. Ancore no contexto para evitar falso positivo: exija o número colado à sua unidade, com limite de palavra, p.ex. `/~?\s*1\.841\s+unidades/` e `/\b920\s+unidades/`, não o número solto.
3. Mantenha a lista negra dos valores superados (`1.845`, `396`, `936`, `1.836`, `918`). É barata e pega cópia antiga reintroduzida.
4. Troque a verificação positiva por uma exigência firme: **todo** gerador da lista deve carregar `PARAM_DEFLACAO`. Remova o `|| text.includes("460")`.
5. Mensagem de falha informativa: nomeie o arquivo, a linha e o valor que deveria estar interpolado.

A vantagem é que, mudando o parâmetro no JSON, a guarda passa a proibir o novo valor automaticamente, sem manutenção.

---

## Verificação antes de empurrar

```bash
# 1. nenhum literal derivado sobrou nos geradores
grep -nE "~?1\.841|920 unidades|~460|230 unidades|25,6 unidades" scripts/*.py

# 2. os cinco geradores carregam o parametro canonico
for f in gerar_pdf_metodologia_integrada gerar_docx_metodologia_integrada \
         gerar_pdf_especificacao_projeto gerar_pdf_mudanca_metodologica \
         gerar_pptx_mudanca_metodologica; do
  printf "%-42s " "$f"; grep -c PARAM_DEFLACAO "scripts/$f.py"; done

# 3. a guarda falha se alguem cravar um literal (teste negativo manual)
#    insira temporariamente "~1.841 unidades" num gerador, rode o teste,
#    confirme que REPROVA, e desfaça.
npx vitest run src/config/deflacao.test.ts

# 4. suite completa
npx vitest run && npm run typecheck && npm run lint

# 5. documentos regenerados trazem os mesmos numeros
python scripts/gerar_pdf_metodologia_integrada.py
python scripts/gerar_docx_metodologia_integrada.py
python scripts/gerar_pdf_especificacao_projeto.py
python scripts/gerar_pdf_mudanca_metodologica.py
python scripts/gerar_pptx_mudanca_metodologica.py
```

O passo 3 não é opcional: uma guarda que nunca se viu reprovar não foi verificada.

Empurre com `git push -u origin sarel/fechamento-derivacao`. As duas últimas rodadas foram empurradas direto em `sarel/executor-2026-10-09`, apesar de o prompt pedir branch própria — desta vez use a branch nomeada. Não abra pull request sem pedido explícito.

Rodapé obrigatório em cada commit:
```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0124eRLwbTVuEsVKcsq67486
```

---

## Exigência sobre o relatório final

Nas duas últimas rodadas o código entregue estava **melhor** do que o relatório o descrevia. Três afirmações não corresponderam ao diff:

- o manifesto foi descrito como `dados_propriedades.sqlite`, 1,1 GB, 53.385 CARs — o artefato real é `fundiario_brasil.db`, 1.793.216.512 bytes, 559.899;
- os tetos de D24 foram descritos como `≤6` e `≤3` — o código mantém `≤4` e `1`, corretos;
- o portão do Kappa foi descrito como piso de `0,40` no limite inferior, em `src/lib/rotulos/rotulos.ts` — **esse arquivo não existe**, e o código em `src/lib/rotulos/concordancia.ts` usa `ciInferior >= LIMIAR_KAPPA_SUBSTANCIAL`, que vale **0,61**. O portão implementado é mais estrito que o descrito.

A terceira ocorreu dentro da seção criada para corrigir as duas primeiras.

Para esta rodada, **cada afirmação numérica ou de caminho de arquivo no relatório deve vir acompanhada do comando que a produziu e da saída real colada**. Se não houver comando, a afirmação não entra. Nome de arquivo citado deve ter sido confirmado com `ls` ou `git show`, não lembrado.

O relatório é o documento que chega ao orientador e à banca. Ele precisa ser tão verificável quanto o código.
