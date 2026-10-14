# Verificação do pipeline amostral X0–X5 — 01/10/2026

Commit verificado: `64bcc8f`.

## Confirmado

- `tsc` limpo; **48 arquivos, 355 testes, todos passando**; `decisoes.ts` intocado (P8).
- **X0 corrigido e com guarda dupla**, como especificado: limiar `< 4` na pré-condição
  (`sorteioPoligonos.ts:240`), condição renomeada para `minimo_4_candidatos_por_estrato`, e
  **segunda guarda dentro do sorteio** (`:444`, `nCandidatosEstrato < 4`), independente da
  pré-condição.
- **X1**: thinning relaxado de 5.000 m e **parado em 2.450 m**, com folga de 1.450 m sobre o
  piso de 1.000 m de P02 — parou por ter atingido a meta de pool, não por bater no piso.
  P02 respeitado.
- **X3**: 139 imóveis recuperados por seleção de ponto na parte elegível, de 687 candidatos
  pós-thinning para 680 elegíveis em D07.
- 84 candidatos em K̂=2 sobre 677 com pedologia válida, isto é 12,4%.
- O documento `2026-09-30_remedicao_candidatos_bp3_d16.md` **declara honestamente** a limitação:
  intitula a seção "Distribuição **Estimada**", rotula a coluna "Contagem **Estimada**" e marca
  `E_1_1_2 | 3 | ⚠️ DEFICIENTE`.

## O sorteio continua bloqueado, por duas razões

### 1. Três estratos abaixo do mínimo

Do artefato `remedicao_candidatos_bp3_d16_2026-09-30.json`, campo `estratosK2Estimados`:

| | Ê₁ | Ê₂ | Ê₃ |
|---|---|---|---|
| **Ŝ₁** | **3** | **3** | **3** |
| **Ŝ₂** | 4 | 4 | 4 |
| **Ŝ₃** | 20 | 20 | 20 |

Os três estratos de Ŝ₁ têm **3 candidatos**, abaixo do mínimo de 4 de D16 emendada. A
pré-condição corrigida em X0 **recusará o sorteio**, que é o comportamento certo.

O campo `pedologia.metaK2Atingida: true` refere-se à meta **global** de 36 — 84 a atingiu com
folga de 2,3x. Mas a restrição que de fato governa não é a global: é **4 em cada uma das 9
células**, e essa não foi atingida.

### 2. A dimensão Ê nunca foi medida, e os números da tabela são uma suposição

`frequenciaSoloNu`, `solo_nu` e `tercilE` aparecem **zero vezes** no artefato da remedição. Os
valores por célula são a marginal de Ŝ **dividida igualmente por três**: 9/3 = 3, 14/3 → 4,
61/3 → 20. Não há medição de Ê alguma por trás deles.

A causa é conhecida e persiste: **não há credenciais do Google Earth Engine** — `.env` e
`.env.local` ausentes — e Ê é a frequência de solo nu derivada da série Sentinel-2.

**Consequência:** sem Ê, os 18 estratos de D12 não podem ser povoados, a partição que o sorteio
exige não existe, e nenhum número por célula é verificável.

## Por que a margem é menor do que a tabela sugere

A divisão uniforme é a hipótese **mais favorável** possível. A frequência de solo nu correlaciona
com uso e com relevo, de modo que a distribuição real será desigual. Então:

- **Ŝ₁ (9 candidatos)**: já deficiente sob reparto uniforme; sob reparto desigual, pode render
  células com 1 ou 2.
- **Ŝ₂ (14 candidatos)**: os "4" são `floor(14/3) = 4`, com resto. Sob reparto desigual, uma
  célula pode cair abaixo de 4.
- **Ŝ₃ (61 candidatos)**: única faixa com margem real.

Ou seja: **apenas o tercil superior de declividade tem folga verdadeira**, e isso é consistente
com o que já se sabia — solos de erodibilidade alta ocorrem preferencialmente em relevo
declivoso.

## O que falta, em uma frase

O desenho amostral está pronto; o que falta é **acesso ao Earth Engine** para medir Ê. Sem ele
não há 18 estratos, e com ele a contagem por célula pode ainda exigir mais candidatos no tercil
inferior de declividade — o que `X1` pode fornecer relaxando o thinning abaixo dos 2.450 m em
que parou, já que o piso de P02 é 1.000 m e há folga de 1.450 m.
