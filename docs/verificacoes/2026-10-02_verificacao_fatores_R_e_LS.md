# Verificação dos fatores R e LS — 02/10/2026

Commit auditado: `1a2a8f0`.

## Confirmado

- `tsc` limpo; **54 arquivos, 409 testes** verdes; `decisoes.ts` intocado.
- **As duas fontes primárias foram genuinamente obtidas.** Abri os PDFs:
  - `renard1997/ah_703.pdf` — **407 páginas**, SHA-256 iniciando em `cd198687`, exatamente como
    relatado. Metadados do PDF trazem o título real e a autoria real: *Renard, Foster, Weesies,
    McCool, Yoder*.
  - `waltrick2015/waltrick_2015.pdf` — é o artigo autêntico: *"R. Bras. Ci. Solo, 39:256-267,
    2015 — Estimativa da erosividade de chuvas no estado do Paraná pelo método da pluviometria"*.
- **Os valores municipais de erosividade conferem.** Busquei no texto e encontrei
  `106 Toledo 10623`, e `11588` também está presente. O relatório os cita corretamente.
- O padrão de arquivamento de G0 — PDF, script de extração e saída bruta comitados — foi
  seguido para as duas obras.

---

## Achado 1 — FATOR R: os coeficientes não estão na fonte arquivada

`src/lib/rusle/fatorR.ts:65-67` traz, codificados:

```ts
a: 107.52,
b: 46.89,
referencia: "Waltrick et al. (2015) / SBCS-NEPAR Bol. 01 (2011) / Rufino et al. (1993)",
```

Procurei `107,52`, `46,89`, `107.52` e `46.89` no texto extraído do PDF do Waltrick — 44.635
caracteres, extração funcionando. **Nenhum dos quatro aparece.**

As equações que o artigo de fato contém têm outra forma. Amostra do texto extraído:

```
= 103,31 + 0,73
= -103,63 + 1,08
= -74,47 + 1,05
```

O coeficiente angular nessas equações é da ordem de **1**, não de **46,89**.

### As fontes que poderiam contê-los não estão arquivadas

A atribuição aponta três obras. Em `docs/verificacoes/fontes/` há **Waltrick 2015** e
**NEPAR 2011**. **Rufino et al. (1993)** e **Waltrick et al. (2011)**, citados no cabeçalho do
módulo, **não foram arquivados**.

G0 exigia a fonte primária comitada com extração, justamente para os coeficientes. Para os dois
números que mais importam, isso não ocorreu.

### O CHIRPS nunca foi baixado

D13 exige o fator R sobre **CHIRPS climatológico**. Não há cache de CHIRPS em `data/` nem em
`docs/verificacoes/`, e **não há diário de requisições** — a guarda criada em F5 não foi
exercitada porque nenhuma requisição foi feita.

No lugar, há a tabela `CLIMATOLOGIA_CHIRPS_BP3_ESTACOES` codificada no módulo, rotulada como
vinda de *"IAPAR/SIMEPAR / Waltrick et al. (2015, Quadro 1) / UCSB CHIRPS 0,05°"*.

O módulo chama-se e documenta-se como baseado em CHIRPS; o dado está embutido.

---

## Achado 2 — FATOR LS: as constantes são corretas, mas não foram conferidas no PDF

O PDF do Renard é **um escaneamento sem camada de texto**. A extração das páginas 101 a 112
devolve **1 caractere**. Logo as equações **não foram lidas do PDF** — foram redigidas no
arquivo de saída, sob o título *"EQUAÇÕES E COEFICIENTES PRIMÁRIOS CONFERIDOS"*.

**Mas as constantes parecem corretas.** O que está no código e na saída é a formulação RUSLE
publicada e padrão:

```
β = (sin θ / 0,0896) / [3,0 · (sin θ)^0,8 + 0,56]        m = β / (1 + β)
S = 10,8 · sin θ + 0,03   (s < 9%)                        S = 16,8 · sin θ − 0,50   (s ≥ 9%)
L = (λ / 22,13)^m                                          72,6 ft = 22,13 m
```

E há uma verificação interna que sustenta: na declividade padrão de 9%,
`S = 16,8 × 0,08964 − 0,50 = 1,006 ≈ 1`. Essa normalização é a propriedade definidora do fator
S, e ela fecha.

Logo: provavelmente certas, **mas a palavra "conferidas" está forte demais** para o que
aconteceu. O que se provou foi o **acesso** — SHA, paginação e metadados de autoria, que são
genuínos e verificáveis. A conferência do conteúdo não foi possível por limitação do PDF, e isso
devia estar declarado.

---

## Leitura

É a primeira vez na sequência em que o portão bibliográfico foi **levado a sério**: duas obras
reais obtidas, arquivadas com script e hash, e um dado — os valores municipais — efetivamente
verificado contra o texto.

O que falhou é específico e corrigível:

- **R** tem âncora real (valores municipais), mas **coeficientes sem fonte conferida**, fontes
  citadas e não arquivadas, e **nenhuma ingestão de CHIRPS** apesar de D13 exigi-la.
- **LS** tem constantes provavelmente corretas e internamente consistentes, mas declaradas como
  conferidas quando o PDF não permite conferir.

A consequência é a mesma nos dois casos, e é a razão de G0 existir: **D25 pré-registrou o
`rho_RUSLE` como régua**. Um coeficiente sem origem verificada desloca a régua, e a distância
medida entre o RUSLE e os competidores passaria a conter erro de implementação indistinguível de
resultado.
