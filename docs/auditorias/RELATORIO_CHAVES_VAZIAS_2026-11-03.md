# Relatório: Resolução do Achado S1-1 — Vazio Não É `false`

**Data:** 3 de novembro de 2026  
**Tarefa:** Fechar a interação entre o contrato da matriz e o D25 (S1-1)  
**Branch:** `correcoes/contencao-2026-11-02`  
**Origem:** Achado `S1-1` de `AUDITORIA_PROGRAMA_COERENCIA_2026-11-03.md`  

---

## 1. Baseline Antes e Depois

### Quatro Comandos Canônicos

| Comando | Antes da Correção | Depois da Correção |
|---|---|---|
| `npm run typecheck` | exit 0 (`tsc --noEmit`) | **exit 0** (`tsc --noEmit`) |
| `npm test` | 94 arquivos, 794 passaram, 3 pulados | **95 arquivos, 797 passaram, 3 pulados** |
| `npm test src/lib/seguranca/padroesProibidos.test.ts` | 34 passaram (0 violações) | **34 passaram (0 violações)** |
| `python -u -m unittest discover -s scripts/d25 -p "test_*.py"` | 49 testes OK | **55 testes OK** |

> *Nota sobre os 3 testes pulados:* Permanecem exclusivamente os 3 testes legítimos de `src/lib/fundiario/matcher.test.ts`, condicionados ao provisionamento da base fundiária SQLite local (`fundiario_brasil.db`).

---

## 2. Reprodução do Defeito Antes e Depois

### Script de Reprodução Canônico

Executado contra uma matriz representativa de 6 linhas (4 treino, 2 held-out) contendo `Incluida = ""` e `Pixel_ID = ""` — exatamente o artefato exportado antes de voo selado e antes de delineação D26:

```python
import pandas as pd
from scripts.d25.avaliacao_d25_referencia import _so_incluidas, _checar_pixels_disjuntos, ErroAvaliacao

df = pd.DataFrame({
    'Incluida': ['', '', '', '', '', ''],
    'Pixel_ID': ['', '', '', '', '', ''],
    'Poligono_ID': [1, 1, 2, 2, 3, 4],
    'Papel_Conjunto': ['treino', 'treino', 'treino', 'treino', 'held-out', 'held-out']
})

print('linhas antes de _so_incluidas :', len(df))
df_inc = _so_incluidas(df)
print('linhas depois de _so_incluidas:', len(df_inc))

tr = df[df['Papel_Conjunto'] == 'treino']
te = df[df['Papel_Conjunto'] == 'held-out']
try:
    _checar_pixels_disjuntos(tr, te)
    print('_checar_pixels_disjuntos NAO LANCOU (ausencia de insumo)')
except ErroAvaliacao as e:
    print('_checar_pixels_disjuntos LANCOU: ErroAvaliacao ->', e)
```

### Saída ANTES da Correção (Defeito Confirmado)

```
linhas antes de _so_incluidas : 6
linhas depois de _so_incluidas: 0        <-- Matriz esvaziada por tratar "" como false
_checar_pixels_disjuntos LANCOU: ErroAvaliacao -> 1 pixel(is) de 10 m em treino e held-out (vazamento espacial)
```

### Saída DEPOIS da Correção (Defeito Sanado)

```
linhas antes de _so_incluidas : 6
UserWarning: [AVISO S1-1] Coluna 'Incluida' presente mas 100 % vazia: filtro de cobertura minima (P11) nao tem insumo e nao foi aplicado.
linhas depois de _so_incluidas: 6        <-- Matriz preservada integralmente (6 linhas)
UserWarning: [AVISO S1-1] 'Pixel_ID' sem pixels validos preenchidos em treino (0/4) ou held-out (0/2): checagem de vazamento espacial nao realizada (ausencia de insumo nao e vazamento).
_checar_pixels_disjuntos NAO LANCOU (ausencia de insumo)
```

---

## 3. O Que Mudou em Cada Arquivo

### 3.1 Python (`scripts/d25/`)

1. **`scripts/d25/avaliacao_d25_referencia.py`**:
   - `_so_incluidas`: Implementada distinção estrita dos 4 estados de `Incluida` (ausente, 100% vazia, parcialmente vazia, preenchida). Vazio não é coagido nem interpretado como `false`. Emite avisos via `warnings.warn` nomeando explicitamente o achado `S1-1`.
   - `_extrair_pixels_validos`: Função auxiliar que descarta `""`, `NaN`, `None`, `"nan"`, `"none"` e `"null"` antes de compor o conjunto de identidades.
   - `_checar_pixels_disjuntos`: Se após o descarte de sentinelas de ausência qualquer conjunto de pixels ficar sem elementos válidos, emite aviso e retorna sem lançar falso vazamento. Mantém checagem e emissão de erro estrito para interseção de pixels reais.
   - Comentários didáticos documentando a aplicação da Regra 1 e a referência ao achado `S1-1`.

2. **`scripts/d25/test_avaliacao_d25_referencia.py`**:
   - Adicionada classe `TestDistincaoVazioEValorS11` contendo 6 novos testes de unidade que cobrem:
     1. `Incluida` 100% vazia preserva linhas e avisa;
     2. `Incluida` parcialmente vazia decide apenas sobre preenchidas e avisa;
     3. `Pixel_ID` 100% vazio não lança erro de vazamento e avisa;
     4. `Pixel_ID` com `NaN` em todas não lança e avisa;
     5. `Pixel_ID` com duplicata real entre treino e held-out continua lançando `ErroAvaliacao`;
     6. `Incluida` com valores reais mistos (`"true"`/`"false"`) filtra normalmente.

### 3.2 TypeScript (`src/`)

1. **`src/lib/export/planilha.ts`**:
   - Interface `OpcoesExportacao` recebeu os campos opcionais `seloD16?: { poligonos: Array<{ idPoligono: string; estratoId: string; pi_i: number; w_i: number; nCandidatosEstrato: number; }> }` e `exigirDelineacaoD26?: boolean`.
   - `extrairLinhasPorPerfil` agora aceita `opcoes?: Pick<OpcoesExportacao, "seloD16" | "exigirDelineacaoD26">` e repassa `seloD16` e `exigirDelineacaoD26` para `montarMatrizTreino`.
   - `gerarPlanilhaXLSX` repassa `opcoes` para `extrairLinhasPorPerfil`.

2. **`src/lib/export/csv.ts`**:
   - `gerarCsvCientifico` atualizado para receber `opcoes?: Pick<OpcoesExportacao, "seloD16" | "exigirDelineacaoD26">` e repassar para `extrairLinhasPorPerfil`.

3. **`src/lib/export/pacoteReprodutibilidade.ts`**:
   - Criada interface `OpcoesPacoteReprodutibilidade` com `seloD16` e `exigirDelineacaoD26`.
   - `gerarCsvMatrizTreinamento` (chamada 1) repassa `opcoes` a `montarMatrizTreino` e utiliza `linhaCanonica.estratoId ?? p.estratoId ?? ""` na projeção.
   - `gerarConteudoPacoteReprodutibilidade` (chamada 2) e `gerarPacoteReprodutibilidadeZip` repassam `opcoes` a `montarMatrizTreino` e a `gerarCsvMatrizTreinamento`.

4. **`src/components/matriz/PainelMatrizTreino.tsx`**:
   - Adicionado hook de carregamento do selo D16 existente via `GET /api/gee/sorteio-d16`, utilizando o mesmo contrato de `PainelSorteioD16.tsx`.
   - Repassa `seloD16: selo` a `montarMatrizTreino` quando existente.

5. **`src/lib/export/scriptAvaliacaoD25.generated.ts`**:
   - Regenerado sincronizadamente via `node scripts/gerar_script_pacote.mjs` com o novo hash SHA-256 de `avaliacao_d25_referencia.py`.

6. **`src/lib/matriz/contratoMatrizS11.test.ts`** *(Novo arquivo de teste)*:
   - Teste 7: Exportação com `seloD16` projeta `Estrato_ID`, `Pi_i`, `W_i` e `N_Candidatos_Estrato` preenchidos, com `Pi_i * W_i = 1` e validação pelo esquema `ESQUEMA_MATRIZ_VERSAO = "2.0.0"`.
   - Teste 8: Exportação sem `seloD16` emite chaves vazias `""`, aceitas como ausência declarada pelo esquema.
   - Teste 9: Auditoria estática e funcional que confirma que exatamente as 4 rotas de produção chamam `montarMatrizTreino` e todas repassam `seloD16`, falhando imediatamente se uma 5ª chamada for acrescentada sem repasse.

---

## 4. Matriz de Estados das Guardas do D25

| Guarda / Coluna | Ausente | Presente e 100% Vazia | Presente e Parcialmente Vazia | Preenchida |
|---|---|---|---|---|
| **`_so_incluidas`** (`Incluida`) | Emite aviso `[AVISO S1-1]` no dry-run e não filtra (preserva todas as linhas). | Emite aviso `[AVISO S1-1]` de que não há insumo de cobertura e não filtra. | Emite aviso `[AVISO S1-1]` com a contagem de vazias e opera apenas sobre as preenchidas (mantém `true`, exclui `false`, preserva vazias). | Filtra mantendo apenas as linhas verdadeiras (`true`, `1`, `verdadeiro`). |
| **`_checar_pixels_disjuntos`** (`Pixel_ID`) | Emite aviso `[AVISO S1-1]` de identificadores ausentes e retorna sem erro. | Descarta `""`/`NaN`. Como nenhum pixel sobra, emite aviso `[AVISO S1-1]` e retorna sem acusar vazamento. | Descarta vazios, emite aviso `[AVISO S1-1]` com contagem de vazios em treino/held-out e compara a interseção dos pixels reais preenchidos. | Compara os conjuntos de pixels reais; se houver interseção, lança `ErroAvaliacao`. |

---

## 5. Confirmação da Guarda de Pixel Real

A guarda contra vazamento espacial entre treino e held-out **permanece plenamente ativa e rigorosa**. Ela foi testada tanto isoladamente quanto integrada à avaliação:

- Quando um pixel real (ex: `"px_real_2"`) ocorre simultaneamente em polígonos de treino e held-out, a função `_checar_pixels_disjuntos` lança:
  ```
  ErroAvaliacao: 1 pixel(is) de 10 m em treino e held-out (vazamento espacial)
  ```
- O teste `test_pixel_id_com_pixel_real_repetido_lanca_erro_avaliacao` assevera que a correção não desarmou a guarda espacial para identidades reais.

---

## 6. Pendências de `A-06` e `G-01` (Fora de Escopo)

Conforme deliberado nas seções 2 e 6 do documento de tarefa:

1. **`A-06` (Exigência Estrita do Modo Probatório):** A presente tarefa corrigiu a **interpretação** de vazio (evitando que ausência seja lida como falso valor). A **exigência** incondicional de preenchimento (`Incluida`, `Pixel_ID`, `Estrato_ID`, contagem de clusters, config congelado e `RUSLE_A`) no modo `--probatorio` permanece sob o escopo do prompt `P-V`.
2. **`G-01` (Decisão de Desenho Amostral):** Permanece pendente de decisão explícita pelo pesquisador (gate `G-01` aguarda opção entre desenho clássico de 72 polígonos vs. alternativos).
3. **`G-06` (Limiar P11 de Cobertura de Célula):** O filtro de cobertura no gerador de matriz continua sem corte rígido a montante, viajando como metadado para avaliação a jusante.
