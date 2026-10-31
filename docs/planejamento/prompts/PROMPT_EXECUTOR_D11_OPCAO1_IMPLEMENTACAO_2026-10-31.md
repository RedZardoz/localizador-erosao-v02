# Tarefa: implementar a Opção 1 de D11 (decomposição modular por estimando)

**Decisão do pesquisador, 31/10/2026:** adotada a **Opção 1** da `docs/auditorias/AUDITORIA_D11_2026-10-31.md` — decomposição de D11 em quatro pisos por estimando, cada um com o seu lastro.

A auditoria está aprovada. Esta tarefa é de **implementação**, não de investigação: o inventário, o lastro e a medição já foram feitos e validados. Não refaça nenhum dos três.

---

## ⚠ PRIMEIRO: os caminhos, para você não ficar pendurado

Nas quatro rodadas anteriores você anunciou push para uma branch nomeada, empurrou de fato para `sarel/executor-2026-10-09`, e então ficou esperando a notificação de push de uma branch que nunca existiu. Da última vez ficou 3 horas pendurado com o trabalho já concluído e salvo.

**Regras desta rodada, sem exceção:**

1. Trabalhe e empurre **direto em `sarel/executor-2026-10-09`**. Não crie branch nova.
   ```bash
   git fetch origin
   git checkout -B sarel/executor-2026-10-09 origin/sarel/executor-2026-10-09
   ```
2. **Não espere notificação de push.** Não pause a execução aguardando confirmação assíncrona. O push é síncrono: ou o comando retorna sucesso, ou retorna erro.
3. Depois do push, confirme com **um comando** e **encerre o turno**:
   ```bash
   git push origin sarel/executor-2026-10-09 && git log --oneline -1 origin/sarel/executor-2026-10-09
   ```
   Se essa linha imprimir o seu commit, acabou. Escreva o relatório e termine.
4. Se o push falhar por credencial, **diga isso no relatório e encerre** — não fique em espera.

---

## O que implementar

### 1. Emenda de D11 em `src/config/decisoes.ts`

Use a minuta já redigida na **Seção 7** da auditoria (`docs/auditorias/AUDITORIA_D11_2026-10-31.md`). Os quatro patamares:

| Piso | Valor | Estimando | Lastro |
| :--- | ---: | :--- | :--- |
| **D11.1** | **6** | admissão e triagem geral do candidato | convenção operacional declarada |
| **D11.2** | **12** | frequência de solo nu **Ê** em janelas plurianuais (D04/D05) | Agresti & Coull (1998); Brown, Cai & DasGupta (2001) — SE ≤ 0,144 |
| **D11.3** | **9** | percentis de cauda `ndvi_p10` / `ndvi_p90` | DP-24; Hyndman & Fan (1996) — já implementado |
| **D11.4** | **12** | decomposição harmônica OLS de B12 e B8 | Zhu (2013), tese, Cap. 4 (CCDC), p. 121 — já é o default do módulo |

Registre a emenda com data, motivo, e a observação de que foi feita **antes de existir qualquer dado de desfecho** — o sorteio de D16 não ocorreu (os artefatos de 72 polígonos são os `SINTETICO_NAO_VOAR_*`). É o que a distingue de HARKing (Nosek et al., 2018, já citada em D25). Emende **D12** na mesma linha, por ser ela que depende dos tercis de Ê.

Mantenha legível o histórico: o valor único de 6 vigente até 30/10 permanece citado como estado anterior, não apagado.

### 2. Código — onde cada piso atua

- **D11.1 (6):** `LIMIAR_MINIMO_OBSERVACOES_D11` em `src/lib/gee/copernicusGeeClient.ts:29` permanece **6**. Os consumidores em `consolidacaoInspecao.ts:220,374` e `src/app/api/gee/select-candidates/route.ts:793` seguem como estão.
- **D11.2 (12):** novo piso aplicado **no ponto em que Ê é calculado**. Hoje `frequenciaSoloNu` sai de `src/lib/matriz/montagemTemporal.ts` sem piso algum — só há a guarda `nValidas === 0`. Crie uma constante nomeada, no padrão de `N_MINIMO_PERCENTIS_CAUDA_DP24`, e abaixo dela Ê sai como `indisponivel` com causa, nunca como número.
- **D11.3 (9):** nada a fazer. Já implementado em `montagemTemporal.ts:34`. Apenas confirme.
- **D11.4 (12):** já é o default de `nMinimoObservacoes` em `src/lib/gee/harmonicos.ts:44`. Torne-o explícito e rastreável a D11.4 — constante nomeada em vez de literal no parâmetro default.

### 3. O fallback de janela curta precisa ser rastreável

A Opção 1 admite, em janelas sazonais abaixo de 120 dias, fallback de Ê para n ≥ 6 "com anotação formal de incerteza". Implemente isso de modo que o fallback **não seja silencioso**:

- o Ê produzido sob fallback carrega `Proveniencia` que declara o regime e o erro-padrão correspondente (SE ≈ 0,20), distinguível em máquina — não apenas num texto;
- **diga explicitamente, no código e no relatório, se esse Ê degradado pode ou não entrar no cálculo dos tercis de D12.** Minha leitura é que não deve: os estratos são pré-registrados e exigem atribuição estável, e um SE de 0,20 é da ordem da largura de um tercil. Se você implementar de outro modo, justifique.

### 4. Divergência dos harmônicos — recomendação com razão

Documento e código discordam: a §3.4 publica dois harmônicos (p = 6), o código ajusta um (p = 4, `usarDoisHarmonicos ?? false`, nunca passado por chamador).

**Recomendação: manter o código em p = 4 e corrigir o texto da §3.4.** A razão vem da própria fonte que acabamos de adotar — Zhu, p. 121: *"when there are too many parameters to estimate, it may start to fit to noise. To make the model robust to noise, the CCDC algorithm only uses two parameters to capture the intra-annual change."* O lastro novo argumenta a favor de menos termos intra-anuais, não mais. Com p = 4 e n ≥ 12 ficam N/p = 3,0 e df = 8; com p = 6, N/p = 2,0 e df = 6.

Acrescente que não há, no projeto, evidência empírica de que o segundo harmônico melhore algo na BP3 — e adicionar complexidade de modelo sem evidência é a direção errada sob pré-registro.

Regenere PDF e DOCX da metodologia com a §3.4 corrigida. Se o pesquisador preferir ativar o segundo harmônico, é decisão dele; implemente a correção textual e registre a alternativa no relatório.

### 5. Correção de citação — R-L2 (pequena, mas de princípio)

A auditoria cita *"Zhu & Woodcock (2014, CCDC, p. 156 / p. 121)"*. O que foi lido e arquivado é a **tese de Zhu (2013)**, 178 páginas, SHA-256 `4789edc1...`. O artigo de 2014 na *Remote Sensing of Environment* **não foi conferido** — a página 156 é asserida sem leitura.

O lastro não está comprometido: a tese é fonte primária legítima e a regra foi lida nela, na p. 121. O que não se sustenta é a página do artigo companheiro. Corrija:

- renomeie `docs/verificacoes/fontes/zhu2014/` para `zhu2013/`, e o PDF para refletir a obra que é (`zhu_2013_tese_ccdc.pdf`), com `git mv`;
- nas citações (auditoria, `decisoes.ts`, motivo da dívida), escreva a forma honesta: **"Zhu, Z. (2013), tese de doutorado, Boston University, Cap. 4, p. 121 (lida no primário); Zhu & Woodcock (2014), RSE 144:152-171 — não conferida no primário"**. É exatamente o padrão que D13 já usa para Waltrick;
- atualize os caminhos citados na auditoria e no arquivo de verificação para os novos nomes.

### 6. Fechar a dívida

Com lastro externo em D11.2, D11.3 e D11.4, **remova D11 de `DIVIDA_DECLARADA`** em `src/config/lastroCientifico.test.ts`. A trava já exige essa remoção e reprova se a entrada ficar obsoleta — confirme rodando o teste.

Se julgar que D11.1 (o 6 da admissão) permanece sem lastro externo e merece dívida própria, crie uma entrada nova e específica para ela, com motivo e data. Não deixe a entrada antiga de D11 cobrindo os quatro patamares.

---

## Fora de escopo

- **Não** altere o piso de DP-24 (D11.3), que já tem lastro primário.
- **Não** reexecute a estratificação nem o sorteio de D16.
- **Não** mexa nas outras dívidas (D03, D17, D18, P07).
- O **déficit estrutural em 3 estratos** (`E_1,1,2`, `E_1,2,2`, `E_1,3,2`) que a auditoria encontrou de passagem é achado relevante e independente do piso. **Registre-o no relatório** como pendência aberta para D16; não tente corrigi-lo aqui.

---

## Verificação antes do push

```bash
# 1. os quatro pisos existem como constantes nomeadas e rastreaveis
grep -rnE "LIMIAR_MINIMO_OBSERVACOES_D11|N_MINIMO_.*D11|N_MINIMO_PERCENTIS|nMinimoObservacoes" src/lib --include="*.ts" | grep -v test

# 2. E^ nao sai mais como numero abaixo do piso
grep -nE "frequenciaSoloNu|indisponivel" src/lib/matriz/montagemTemporal.ts | head

# 3. a divida de D11 saiu da lista
npx vitest run src/config/lastroCientifico.test.ts

# 4. nada quebrou
npx vitest run && npm run typecheck && npm run lint

# 5. a pasta da fonte reflete a obra arquivada
git ls-files docs/verificacoes/fontes/zhu2013/

# 6. documentos regenerados
python scripts/gerar_pdf_metodologia_integrada.py && python scripts/gerar_docx_metodologia_integrada.py
```

Commits separados por natureza (emenda das decisões, pisos no código, correção de citação, documentos regenerados). Rodapé obrigatório em cada um:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0124eRLwbTVuEsVKcsq67486
```

---

## Relatório final

Cada afirmação numérica ou de caminho acompanhada do comando que a produziu e da saída real colada. Nome de arquivo confirmado com `ls` ou `git show`, não lembrado.

Deve conter, explicitamente:

- os quatro pisos, onde cada um ficou no código, e a saída do comando 1;
- se o Ê de fallback entra ou não nos tercis de D12, e por quê;
- o que foi feito com a divergência dos harmônicos, e se o texto da §3.4 foi corrigido;
- a renomeação `zhu2014/` → `zhu2013/` e a forma final da citação;
- confirmação de que D11 saiu de `DIVIDA_DECLARADA`, com a saída do teste;
- o déficit estrutural nos 3 estratos, repetido como pendência aberta;
- **a linha de confirmação do push** (`git log --oneline -1 origin/sarel/executor-2026-10-09`).

Depois disso, **encerre o turno**. Não aguarde notificação.
