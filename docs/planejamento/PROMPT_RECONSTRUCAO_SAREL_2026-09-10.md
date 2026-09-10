# Prompt de Reconstrução — SAREL

**Sistema de Amostragem e Rotulagem para Erosão Laminar** — PPGTCA 2026
**Versão:** 10/09/2026
**Substitui:** `PROMPT_NOVO_PROJETO_2026-09-08.md` e `PROMPT_ABERTURA_IMPLEMENTACAO.md` (arquivados em `docs/planejamento/historico/`).
**Plano de execução correspondente:** `docs/planejamento/implementation_plan_v3.md`.

> **Como usar.** Abra uma sessão nova do agente na raiz do repositório `geolocalizacao-erosao-propriedade` e cole como primeira mensagem o bloco abaixo. O agente lê este arquivo e o plano; não é preciso colar o documento inteiro.

```
Você vai reconstruir o SAREL dentro deste repositório, seguindo
docs/planejamento/PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md (regras) e
docs/planejamento/implementation_plan_v3.md (execução).

Leia os dois por inteiro antes de qualquer ação. Depois:
1. confirme comigo o entendimento das 9 regras e das decisões pendentes (D02 a D19);
2. diga em que branch e em que fase o repositório está (git status, git branch
   e docs/planejamento/INVENTARIO_LEGADO.md, se existir);
3. proponha o escopo exato da próxima fase e aguarde minha autorização.

Não faça commit, tag, push, criação de branch nem alteração de arquivo
antes da minha autorização.
```

---

# PARTE I — CONTEXTO

## 1. O que este sistema é

Instrumento computacional de uma dissertação de mestrado do PPGTCA. Objetivo da pesquisa: **validar um método de localização e predição de erosão laminar** usando séries temporais multiespectrais, terreno, solo e regime de chuvas, com classificador supervisionado (XGBoost) treinado **fora** deste sistema.

O sistema **não** classifica erosão. Ele faz três coisas:

1. **Propõe onde observar** — desenho amostral estratificado e espacialmente disperso.
2. **Extrai features verificáveis** — de fontes legítimas, com proveniência por variável.
3. **Gerencia a campanha de rotulagem** — exporta planos cegos de interpretação, campo e voo, ingere rótulos observados e monta a matriz de treino.

O rótulo vem **exclusivamente de observação humana** (interpretação de imagem, campo, drone).

## 2. Por que o rigor importa

O produto será citado como resultado numa dissertação submetida a banca, e a planilha **nomeia titulares de imóveis rurais** ao associar pontos ao CAR e ao SNCR. Um número errado não é defeito de interface: é afirmação falsa sobre um resultado científico ou sobre uma pessoa identificável.

Duas tentativas anteriores foram reprovadas **por veracidade**, não por engenharia. A §4 mostra o que tinham em comum. Não repita.

## 3. A situação que você encontra

- **O repositório é o do Localizador de Erosão Laminar** (GitHub `RedZardoz/localizador-erosao-v2`). Ele funciona, tem integração real com o Earth Engine, uma base fundiária local em `data/` (SQLite de ~1,6 GB, não versionada) e scripts Python de ingestão e casamento espacial em `scripts/`.
- **A reconstrução acontece na branch `sarel/v2`**, criada a partir da tag `legado-pre-sarel` na Fase −1 do plano. Se a Fase −1 ainda não foi executada, é por ela que se começa (§25).
- **Depois da Fase −1:** o código antigo fica em quarentena em `legado/localizador/`; o rascunho SAREL 1 fica em `legado/sarel1/`. **Nada em `src/` importa de `legado/`.** Cada arquivo volta pelo protocolo de porte (§21) e tem destino registrado em `docs/planejamento/INVENTARIO_LEGADO.md`.
- **Nunca altere** a pasta `08 - SAREL 1` (fora deste repositório), `data/` nem as pastas `Dados INCRA`, `Dados SICAR`, `Dados SNCR`.

Documentos, na ordem de leitura:

| Documento | Papel |
|---|---|
| este prompt | regras, modelo de dados, fórmulas, planilha, UI, disciplina |
| `docs/planejamento/implementation_plan_v3.md` | fases, critérios de aceite, inventário, decisões |
| `docs/planejamento/PLANEJAMENTO_PESQUISA_v3_2026-09-08.md` | fundamentação metodológica e referências |
| `docs/planejamento/DECISOES.md` | estado atual de cada decisão metodológica |
| `docs/planejamento/INVENTARIO_LEGADO.md` | destino e status de cada arquivo em quarentena |
| `docs/auditorias/Relatorio_Auditoria_Tabela_Consolidada_2026-09-08.txt` | defeitos do Localizador, com evidência |

Antes da Fase −1, os documentos ainda estão na raiz do repositório e em `docs/planejamento/`; a Fase −1 os reorganiza.

## 4. As duas tentativas anteriores

| | Localizador | SAREL 1 |
|---|---|---|
| O que era | sistema completo, em uso, auditado em 08/09/2026 | protótipo construído a partir do plano v2 em cerca de duas horas |
| Suíte | 175 testes verdes | 139 testes verdes |
| Tipagem | sem erro | sem erro |
| Veredito | 13 de 54 colunas exportadas falsas; 150/150 linhas com 35,2 t/ha/ano | nenhuma chamada ao Earth Engine; pontos gerados no navegador; "Fases 1 a 8 completas" |

**O que tinham em comum.** Os dois tinham a suíte verde e a tipagem limpa **com os defeitos presentes**. O SAREL 1 tinha as regras escritas — as mesmas deste documento — e repetiu os defeitos em código novo. **Regra lida não é regra cumprida.** Por isso esta versão transforma as regras em verificações que falham (§18) e exige evidência para toda afirmação.

| Anti-padrão | No Localizador | No SAREL 1 | Como é barrado agora |
|---|---|---|---|
| Lacuna preenchida com constante | `\|\| 16`, `unmask(0.5)`, `?? 0` | `(frequenciaSoloNu ?? 0,3) × 0,7` como NDVI | Regras 1 e 5; padrões proibidos |
| Fórmula inventada | perda = `declividade × 2,2` | `R × 0,5`; erosividade = `volume × 1,5` | Regra 9; Registro de Decisões |
| Falha técnica vira afirmação | "nenhum imóvel nesta coordenada" | Kappa = 0 sem nenhum par | Regra 2; `causa` da indisponibilidade |
| Verificação afirmada sem execução | Embrapa exibida como PNG, nunca consultada | "verificado em 08/09/2026" sem chamada no arquivo | Regra 8; evidência e teste |
| Decisão de dissertação tomada pelo código | Φ com pesos 0,40 e 50 | mapa ordinal, limiar 0,25, tabela numérica de K | Regra 9 |
| Correção silenciosa | — | cortes em C, LS e R; pisos em TWI e bloco | Regra 1 (corolário) |
| Data da consulta como data do dado | `Data_Deteccao` = data de processamento | `adquiridoEm` = hoje | Regra 3 |
| Detector que não detecta | testes de formato, nenhum de valor | Invariante 7 desativado por uma lacuna | meta-testes (§18) |
| Pronto sem dado real | tabela de 150 pontos importada, nunca passou pelo GEE | "implementação completa" sem GEE | Marco M1; §24 |
| Auto-aprovação | — | auditoria interna "aprovada com louvor" que descreve o código errado | §23 item 8 |

---

# PARTE II — A LEI FUNDAMENTAL

Estas regras têm precedência sobre qualquer conveniência de implementação. Quando houver conflito entre **entregar um número** e **dizer a verdade**, diz-se a verdade.

## Regra 1 — Dado verdadeiro ou ausência declarada

> Nunca preencha lacuna com constante, média, valor típico ou estimativa não solicitada. Se o dado não existe, o valor é ausente e a causa é registrada.

**Justificativa técnica.** Os valores alimentam um modelo de árvore, que particiona por limiar e **cria divisões em valor exato**: pixels preenchidos com `bsi = 0,45` formam um agrupamento artificial perfeitamente separável, aprendido como padrão do terreno. O erro não se dilui com mais dados — consolida-se. O XGBoost trata ausentes nativamente, aprendendo a direção padrão por nó. **Ausente é tecnicamente superior a imputado.**

**Corolário — correção silenciosa é preenchimento disfarçado.** Corte (`Math.max(0, Math.min(1, x))`), piso (`Math.max(1, acumulo)`) e guarda mínima (`Math.max(0.1, beta)`) mudam o valor e escondem a causa. Valor fora do domínio físico ou da fórmula produz `indisponivel` com `causa: "fora-do-dominio"`, ou erro explícito — nunca um número ajustado.

**Defeitos reais.** Localizador: o importador atribuía 16%, 0,45, 0,32 e "Latossolo Vermelho" quando o arquivo não trazia os campos — 150 de 150 linhas idênticas, apresentadas como medição. SAREL 1: NDVI fabricado a partir da frequência de solo nu com default 0,3 (`rusle/fatores.ts:284`); Fator C cortado em [0, 1]; LS cortado em [0,05; 45]; R cortado em [1000, 18000].

## Regra 2 — Nunca colapsar estados distintos

> "Consultado e não há" ≠ "não foi possível consultar" ≠ "fora da cobertura". Três estados, três respostas.

**Defeito real.** Qualquer falha da consulta fundiária — erro de banco, timeout, coordenada inválida — virava `sem-correspondencia`, e a planilha afirmava *"Sem correspondência — nenhum imóvel nesta coordenada"*. Consequência prática: planejar visita de campo sem procurar autorização de ninguém. No SAREL 1, a ausência de pares de observação produzia Kappa = 0 — um valor — em vez de ausência.

**Implementação obrigatória.** Todo cliente de dado externo devolve `status` de enumeração fechada, e toda indisponibilidade carrega `causa` de enumeração fechada (§7). Nenhum `catch` produz um status que afirme algo sobre o território.

```ts
// CORRETO
catch (err) {
  return { status: "servico-indisponivel", motivo: `Falha: ${msg}. Nada se afirma sobre o ponto.` };
}
// PROIBIDO
catch { return { status: "sem-correspondencia" }; }   // afirma inexistência a partir de falha
catch { return {}; }                                   // silencia, e o chamador inventa o default
```

## Regra 3 — Proveniência viaja junto com o valor

> Não existe número solto. Todo valor científico é um `Proveniencia<T>` (§7).

**Justificativa.** No Localizador, valor e origem trafegavam separados — o número em `ErosionPoint.bsi`, a origem talvez em `estimatedFields`, talvez em `diagnostics`, talvez em lugar nenhum. Quatro rotas preenchiam os mesmos campos com regras diferentes, e as quatro divergiram.

**Consequências.**
- `Campos_Estimados` deixa de ser escrito à mão: é **derivado** dos campos com `estado !== "medido"`.
- `adquiridoEm` é a data (ou o período) **do dado na fonte** — a data da cena, a janela da série, a época do produto estático conforme documentação verificada. `consultadoEm` é quando o sistema consultou. Nunca uma no lugar da outra; o SAREL 1 carimbava a data de hoje como data de aquisição.
- No estado do React, use `Proveniencia` direto no Zustand. **Não crie espelho plano do ponto** para conveniência da interface — foi assim que o Localizador perdeu a origem dos valores.

## Regra 4 — Nada calculado pelo sistema vira rótulo

> Severidade, score, perda de solo, Φ_diag, tipologia e estrato são critérios internos. Nunca saem como resultado de erosão e nunca entram na matriz de treino.

**Justificativa.** No Localizador, `severity` era função determinística de variáveis brutas via Φ = declividade × 0,40 + BSI × 50 + Ψ_solo. Treinar com essas features e esse rótulo reconstruiria os limiares 28,0 e 48,0 com acurácia quase perfeita **sem aprender nada sobre erosão** — vazamento de alvo em forma pura, e com aparência de sucesso.

**Como é garantido:** perfis de exportação por lista de permissão (§9) e Invariante 2 (§17), verificados em execução.

## Regra 5 — Zero é um valor

> Verificação explícita de nulidade. Nunca `||` para default numérico, nunca `??` com número para lacuna.

```ts
// PROIBIDO — declividade 0% legítima vira 16
const slope = parseFloat(props.slope || props.declividade || 16);
// CORRETO
const bruto = props.slope ?? props.declividade;
const slope = bruto === undefined || bruto === null || bruto === "" ? null : Number(bruto);
```

**Defeito real.** A entrada `{slope: 0, bsi: 0}` produzia 16 e 0,45 — e ainda assim **não** era marcada como estimada, porque a checagem de presença considerava `0` presente enquanto a leitura do valor o considerava ausente.

O inverso também vale: uma série válida em que o solo nunca esteve descoberto tem Ê = 0, que é valor, não ausência.

## Regra 6 — Respeitar as fontes legítimas

> Só entram no caminho analítico fontes com calibração documentada, data de aquisição por observação e termos de uso compatíveis com pesquisa.

- **Permitido no cálculo:** Sentinel-1 e 2, Landsat, Copernicus DEM, ESA WorldCover, JRC Global Surface Water, CHIRPS, GPM IMERG (via Earth Engine); cartas da Embrapa GeoInfo; PlanetScope (licença acadêmica); SICAR, SIGEF e SNCR; IBGE.
- **Proibido no cálculo e na fotointerpretação:** basemaps visuais (Mapbox Satellite, Google, Bing, Esri). Mosaicos RGB sem calibração nem data por pixel servem só para navegação e contexto. Mapbox Directions é uso legítimo para roteirizar o campo, fora do caminho analítico.
- Fotointerpretação da Fase A: Scene tiles do Planet, **com a data de aquisição exibida**.

## Regra 7 — Preservar o mascaramento do Earth Engine

> Máscara de nuvem existe para remover pixel inválido. Não a desfaça.

**Defeito real.** O pipeline aplicava `maskS2Clouds()` e, na linha seguinte, `.unmask(0.0)` no BSI e `.unmask(0.5)` no NDVI. Como `stratifiedSample` roda com `dropNulls: true`, o `unmask` **impedia** o descarte: pixels de nuvem eram amostrados com valores fabricados.

```ts
// PROIBIDO
const bsi = expressao.unmask(0.0).rename("BSI");
// CORRETO — pixel sem dado é descartado pelo dropNulls
const bsi = expressao.rename("BSI");
```

Amostra pequena → amplie a janela temporal ou o número de cenas. Nunca reponha constante.

**Única exceção:** camadas **categóricas de exclusão** em que o próprio produto define a região mascarada como classe negativa — por exemplo, a banda `occurrence` do JRC, mascarada onde nunca se detectou água. Ali `unmask(0)` é permitido **somente** com comentário que cite a documentação do produto, evidência arquivada (Regra 8) e teste. Jamais em banda física: reflectância, índice espectral, elevação, precipitação.

## Regra 8 — Verificar antes de afirmar, com evidência arquivada

> Não declare que algo funciona sem ter executado. Não invente esquema de API, nome de campo, coleção ou valor de retorno. Toda afirmação de verificação aponta para a evidência.

**Procedimento, antes de integrar qualquer serviço externo:**

1. Consultar capacidades ou documentação.
2. Executar uma chamada real.
3. Arquivar a resposta bruta em `docs/verificacoes/AAAA-MM-DD_<servico>_<operacao>.<ext>` — sem credencial e sem dado pessoal.
4. Registrar no código: `VERIFICADO AAAA-MM-DD — evidência: docs/verificacoes/<arquivo>`.

Se não puder verificar, diga que não verificou. O teste `verificacoes.test.ts` (§18) falha quando um comentário afirma verificação sem evidência existente.

**Defeitos reais.** Localizador: as camadas da Embrapa eram PNG decorativo e o token do SmartSolos era validado para um serviço nunca chamado. SAREL 1: `gee/client.ts`, `chuva/chirps.ts` e `chuva/imerg.ts` diziam "verificado em 08/09/2026" sem nenhuma chamada no arquivo; o cliente da Embrapa declarava uma enumeração de classes que nunca foi executada.

**O mesmo vale para relatórios.** Um relatório de fase ou de auditoria só afirma o que foi executado. Descreva o código **lendo o código**, não o plano: a auditoria interna do SAREL 1 descreveu "3 classes de exposição solar" e "Fleiss' Kappa" que não existiam no código.

## Regra 9 — Todo parâmetro metodológico tem dono e registro

> Limiar, peso, corte, fator, raio, tamanho de bloco, mapa de classes e fórmula não nascem como literal no código. Vivem no Registro de Decisões (§8), com valor, referência, quem decidiu e quando. Decisão pendente → `indisponivel` com `causa: "decisao-pendente"` e o ID da decisão.

**Justificativa.** Cada parâmetro molda o conjunto de dados. Uma constante sem registro é uma escolha metodológica feita por ninguém, invisível para quem lê a dissertação e fácil de encontrar para quem a examina.

**Defeitos reais.** Localizador: `declividade × 2,2` como perda de solo; pesos 0,40 e 50 em Φ. SAREL 1: limiar de NDVI 0,25, fator 0,5 de "fração erosiva", mapa ordinal da erodibilidade, tabela numérica de K, piso de 10 km no bloco espacial — todos decididos pelo agente.

**Implementação.**
- Funções de cálculo recebem o parâmetro como **argumento obrigatório, sem default**. Quem lê o Registro é a orquestração (rota de API ou serviço).
- O agente pode redigir uma proposta (`estado: "proposta"`, com alternativas e demonstração numérica). **Nunca a aprova.** Só o pesquisador muda uma decisão para `"decidida"`.

---

# PARTE III — ARQUITETURA

## 5. Stack

Mantém-se a do Localizador, que não foi fonte de nenhum defeito: Next.js 14 (App Router) · React 18 · TypeScript 5 com `strict` · Zustand 5 · Tailwind 3 · MapLibre GL 4 · Zod 3 · Vitest 4 · jsPDF · `@google/earthengine`.

Node ≥ 18.17. Execução **local**: rotas que tocam a base fundiária ou credenciais recusam requisição não local. **Nenhuma dependência nova sem autorização.**

## 6. Estrutura de diretórios

A árvore completa está no plano, §4.4. Pontos que você precisa ter em mente:

- `src/config/decisoes.ts` — Registro de Decisões (§8).
- `src/lib/seguranca/` — guardas e varredores (§18).
- `docs/verificacoes/` — evidências da Regra 8, **versionadas**.
- `legado/` — quarentena; nunca importada.
- Testes colocalizados (`modulo.ts` + `modulo.test.ts`). Testes que exigem rede ou credencial terminam em `.vivo.test.ts` e rodam só com `npm run test:vivo`.
- O cliente da Embrapa mantém o nome original, `src/lib/embrapa/embrapaSoilClient.ts`, e seus 19 testes originais.

## 7. Modelo de dados

```ts
// src/types/proveniencia.ts
export type CausaIndisponibilidade =
  | "sem-cobertura"          // a fonte respondeu e não cobre o ponto
  | "servico-indisponivel"   // não foi possível consultar
  | "mascarado"              // pixel removido por máscara (nuvem, sombra)
  | "insuficiente"           // há dado, mas abaixo do mínimo (ex.: D11)
  | "fora-do-dominio"        // valor fora do domínio físico ou da fórmula
  | "decisao-pendente"       // depende de decisão ainda não tomada
  | "nao-calculado";         // etapa ainda não executada

export interface QualidadeAjuste {
  nObservacoes: number;
  r2?: number;
  erroPadrao?: number;
}

export type Proveniencia<T> =
  | { estado: "medido";       valor: T; fonte: string; adquiridoEm: string; consultadoEm: string; detalhe?: string }
  | { estado: "modelado";     valor: T; modelo: string; insumos: string[]; decisoes?: string[]; qualidade?: QualidadeAjuste }
  | { estado: "tabelado";     valor: T; tabela: string; chave: string; decisao?: string }
  | { estado: "indisponivel"; causa: CausaIndisponibilidade; motivo: string };

export function valorOuNulo<T>(p?: Proveniencia<T> | null): T | null {
  return p && p.estado !== "indisponivel" ? p.valor : null;
}
export function ehMedido(p?: Proveniencia<unknown> | null): boolean {
  return p?.estado === "medido";
}
```

`decisoes` e `decisao` registram os IDs do Registro usados no cálculo (por exemplo, `["D10"]`), para que a planilha diga de qual decisão o valor depende.

```ts
// src/types/ponto.ts
import type { Proveniencia } from "./proveniencia";
import type { RotuloConsolidado } from "./rotulo";

export type StatusFundiario =
  | "encontrado" | "aproximado" | "sem-correspondencia"
  | "base-nao-disponivel" | "erro-na-consulta";

export interface ContextoFundiario {          // acesso e autorização — NUNCA feature
  status: StatusFundiario;
  motivo: string | null;                      // obrigatório quando status ≠ "encontrado"
  consultadoEm: string | null;
  criterioAssociacao: string | null;
  codigoCar: string | null;
  titularMascarado: string | null;            // máscara do SNCR, byte a byte
  documentoMascarado: string | null;          // CPF/CNPJ nunca aberto
  registroIncra: string | null;
  areaImovelHa: number | null;                // ausente = null, nunca 0
  bases: { uf: string; sicar?: string; sigef?: string; sncr?: string; sncrDataBase?: string };
  poligono?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

export interface BlocoSerie {
  sensores: string[];                                   // coleções usadas
  nObservacoesValidas: Record<string, number>;          // por banda
  harmonicos: Record<string, Proveniencia<number>>;     // "B12_amplitudeAnual", "B12_tendencia", ...
  estatisticas: Record<string, Proveniencia<number>>;   // "B11_p10", "B11_p50", "B11_p90", ...
  frequenciaSoloNu: Proveniencia<number>;               // Ê
  maiorSequenciaSoloNu: Proveniencia<number>;
  mesModalExposicao: Proveniencia<number>;
  compostoSoloNu: Record<string, Proveniencia<number>>;
}

export interface BlocoChuva {
  precipAcum30d: Proveniencia<number>;
  precipAcum90d: Proveniencia<number>;
  i30Max: Proveniencia<number>;
  nEventosErosivos: Proveniencia<number>;     // depende de D13
  indiceMecanismo: Proveniencia<number>;      // Σ(erosividade_t × soloNu_t) — depende de D13 e D10
}

export interface BlocoTemporal {
  janela: { inicio: string; fim: string };
  serie: BlocoSerie;
  chuva: BlocoChuva;
}

export interface PontoAmostral {
  id: string;                                 // estável, gerado uma vez
  codigo: string;                             // legível: "PR-2026-0001"; não repetir o id em outra coluna
  latitude: number;                           // EPSG:4326
  longitude: number;
  origemSintetica: boolean;                   // obrigatório
  blocoEspacial: string | null;               // null até o variograma (plano §3.7)

  // Critério interno de amostragem — NUNCA feature, NUNCA rótulo, NUNCA em perfil cego
  estratoId: string;
  criterioSelecao: {
    tercilS: 1 | 2 | 3;
    tercilE: 1 | 2 | 3;
    nivelK: 1 | 2;
    phiDiag: number | null;                   // null quando alguma dimensão tem amplitude zero
    semente: number;
  };

  localizacao: {
    municipio: Proveniencia<string>;
    codigoIbge: Proveniencia<string>;
    bacia: Proveniencia<string>;
  };

  terreno: {
    elevacao: Proveniencia<number>;
    declividadePct: Proveniencia<number>;
    declividadeGraus: Proveniencia<number>;
    curvaturaPerfil: Proveniencia<number>;
    curvaturaPlana: Proveniencia<number>;
    acumuloFluxo: Proveniencia<number>;
    twi: Proveniencia<number>;
  };

  solo: {
    ordem: Proveniencia<string>;
    subOrdem: Proveniencia<string>;
    grandeGrupo: Proveniencia<string>;        // distrófico/eutrófico COMO LEVANTADO
    tipoUnidade: Proveniencia<string>;        // simples | associacao
    confiancaPedologica: "alta" | "media" | "indisponivel";
    erodibilidadeClasse: Proveniencia<string>; // CATEGÓRICA
  };

  temporal: Partial<Record<"D" | "P", BlocoTemporal>>;  // uma janela por modelo (D04)

  rotulo?: RotuloConsolidado;                 // Fase 6 — sempre de observação
  fundiario?: ContextoFundiario;
  linhaDeBase?: LinhaDeBaseRUSLE;             // Fase 8 — nunca em matriz
  rastreio: { versaoMotor: string; cenas: string[]; calculadoEm: string };  // cenas = PRODUCT_ID
}
```

Ponto cuja erodibilidade é desconhecida ou não pedológica não tem K̂ e sai do frame, com o motivo registrado no Relatório de Amostragem.

```ts
// src/types/rotulo.ts
// ClasseRotulo é criado SOMENTE depois da decisão D03 (Fase 0).

export type ModalidadeRotulo = "interpretacao-visual" | "campo" | "drone";

export interface Rotulo {
  classe: ClasseRotulo;
  modalidade: ModalidadeRotulo;
  observador: string;
  observadoEm: string;                        // AAAA-MM-DD
  confianca?: "alta" | "media" | "baixa";
  observacoes?: string;
  cego: boolean;  // desconhecia predição, score, estrato e rótulo de outra modalidade
}

export interface RotuloConsolidado {
  final: Rotulo | null;                       // null enquanto a divergência estiver pendente
  origens: Rotulo[];                          // todas as observações independentes
  kappa: number | null;                       // null sem pares ou quando indefinido
  divergencia: "nenhuma" | "resolvida-por-terceiro" | "pendente";
  papelConjunto: "treino" | "held-out";       // drone é sempre held-out
}
```

## 8. Registro de Decisões

```ts
// src/config/decisoes.ts
export type EstadoDecisao = "pendente" | "proposta" | "decidida";

export interface Decisao<T> {
  id: string;              // "D10", "P04"
  titulo: string;
  estado: EstadoDecisao;
  valor?: T;               // só quando "decidida"
  justificativa?: string;
  referencia?: string;     // obra e seção, conferida na fonte
  decididoPor?: string;
  decididoEm?: string;     // AAAA-MM-DD
}

export class ErroDecisaoPendente extends Error {}
export function exigirDecisao<T>(d: Decisao<T>): T;   // valor, ou lança ErroDecisaoPendente
```

Uso — a orquestração lê o Registro; a função de cálculo recebe o valor:

```ts
let limiar: number;
try {
  limiar = exigirDecisao(DECISOES.D10);
} catch (e) {
  if (e instanceof ErroDecisaoPendente) {
    return { estado: "indisponivel", causa: "decisao-pendente", motivo: "aguardando D10 (limiar de NDVI)" };
  }
  throw e;
}
const frequencia = calcularFrequenciaSoloNu(observacoes, limiar);  // sem default na assinatura
```

As decisões D01 a D19 e os parâmetros P01 a P09 estão no plano, §3. `docs/planejamento/DECISOES.md` espelha o arquivo de código e é a leitura para humanos.

## 9. Perfis de exportação

Todo artefato é gerado por um perfil com **lista de permissão** de colunas (`src/lib/matriz/perfis.ts`). Coluna nova não entra em nenhum perfil sem ser declarada nele.

| Perfil | Para quem | Nunca contém |
|---|---|---|
| `planilha` | pesquisador, dissertação | Φ_diag, qualquer score, tipologia |
| `interpretacao-cega` | intérpretes da Fase A | features, estrato, Φ, bloco, RUSLE, leitura do outro intérprete |
| `campo-cego` | equipe de campo da Fase B | features, estrato, Φ, bloco, RUSLE, **rótulo de qualquer outra modalidade** |
| `voo-cego` | intérprete do ortomosaico (Fase D) | predição, score, features, estrato, rótulos anteriores |
| `matriz-treino` | modelagem, fora do sistema | coordenadas (vão para arquivo de chaves), estrato, Φ, fatores RUSLE e perda, tipologia, fundiário |

Por que a equipe de campo não vê o rótulo da interpretação: a Fase B existe para **medir a taxa de erro** da Fase A, e conhecer a resposta enviesa a medida. Por que as coordenadas ficam fora da matriz: para o modelo não aprender posição em vez de processo; incluí-las seria decisão explícita do pesquisador.

---

# PARTE IV — FÓRMULAS: ATENÇÃO MÁXIMA

Toda fórmula entra **com a referência em docstring** e **com teste que verifica o comportamento, não só o cálculo**. Fórmula que não está na literatura não entra: se for necessária, é proposta ao pesquisador como decisão (Regra 9).

## 10. Declividade — uma única função, em projeção métrica

**Defeito real.** `setDefaultProjection("EPSG:3857")` em três lugares do Localizador, inclusive na máscara de elegibilidade. O Web Mercator não preserva escala; no Paraná (~24–26° S) o fator ≈ 1,10 infla a distância horizontal e **subestima** a declividade em ~10%, de forma sistemática.

```ts
const dem = ee.ImageCollection("COPERNICUS/DEM/GLO30").select("DEM").mosaic()
  .setDefaultProjection("EPSG:31982", null, 30);   // SIRGAS 2000 / UTM 22S
const declividadeGraus = ee.Terrain.slope(dem);
```

- `src/lib/gee/terreno.ts` é a **única** fonte de declividade: elegibilidade, estratificação e features chamam a mesma função.
- Guarda de plausibilidade: fora de [0°, 75°] lança erro explícito (75° ≈ 373% já é escarpa rochosa; perto de 90° indica defeito de projeção).
- Fuso: o 22S cobre 54°W–48°W; a faixa oeste do Paraná (~54,25°W) fica marginalmente fora, com distorção de escala da ordem de 0,1%. Documente em comentário. AOI que cruze fusos de forma significativa → reprojeção por fuso.
- Arquive a demonstração numérica (3857 × 31982 em pontos reais) como evidência.

## 11. Série temporal e harmônicos

Por banda, com t em anos decimais:

```
y(t) = b0 + b1·t + b2·cos(2πt) + b3·sen(2πt) + b4·cos(4πt) + b5·sen(4πt)

amplitude anual = sqrt(b2² + b3²)     fase anual = atan2(b3, b2)
amplitude semianual = sqrt(b4² + b5²) fase semianual = atan2(b5, b4)
tendência = b1
```

Modelo de harmônicos consolidado para séries Landsat (Zhu & Woodcock, 2014). Seis parâmetros por banda.

- Cada coeficiente é `modelado`, com `QualidadeAjuste` (nº de observações, R², erro padrão).
- Observações abaixo do mínimo decidido em D11 → `indisponivel` com `causa: "insuficiente"`. Coeficiente mal condicionado não é apresentado como valor.
- **Sem interpolação** sobre vazios.
- Janela por modelo (D04): Modelo D até a data do rótulo; Modelo P encerrado antes, com intervalo de guarda. Se a série alcança a data da observação, o "preditor" pode estar lendo a erosão já consumada — vazamento temporal.

## 12. RUSLE — linha de base, não produto

A RUSLE existe para responder se o modelo supervisionado supera a prática estabelecida. Linha de base errada invalida a comparação.

**A = R · K · LS · C · P** (Renard et al., 1997)

- **Fator C — DECIDIDO (D01):** Durigon et al. (2014), `C = (1 − NDVI) / 2`. Sem BSI e sem corte: NDVI fora de [−1, 1] lança erro. Código e testes no plano, §14.1. O teste de monotonicidade em BSI do plano v1 era vacuoso e **não** deve ser recriado.
- **Fatores R, K e LS — PENDENTES (D13, D14, D15).** Não implemente fórmula para eles antes da decisão. Prepare as alternativas com referência conferida e demonstração. Enquanto isso, `perdaSolo` fica `indisponivel` com `causa: "decisao-pendente"`.
- **Fator P:** 1,0 quando a prática é desconhecida, registrado como `tabelado` (Renard et al., 1997), nunca como medido.
- **Coerência:** `perdaSolo` preenchida ⟺ os cinco fatores preenchidos ⟺ memória de cálculo com a equação e a proveniência de cada fator.

**Defeito real.** No Localizador, 150 linhas com `Perda_Solo = 35,2` (`declividade × 2,2`) ao lado de `RUSLE_Memoria_Calculo = "Cálculo RUSLE não executado"` e dos cinco fatores vazios. No SAREL 1, R inventado com fator 0,5 e chuva anual = acumulado de 90 dias × 4.

## 13. Concordância entre intérpretes

Kappa de Cohen (1960): κ = (pₒ − pₑ) / (1 − pₑ), com patamares de Landis & Koch (1977).

- Sem pares → κ **ausente** (`null`).
- pₑ = 1 (os dois intérpretes usaram uma única classe) → κ indefinido → `null` com motivo. Não devolva 0 nem 1.
- κ < 0,60 → **alerta bloqueante**: o critério não está operacional.
- Divergência sem desempate → `final: null`; o ponto não entra na matriz.

## 14. Φ_diag

Φ_diag = (Ŝ_norm + Ê_norm + K̂_norm) / 3, normalizações em [0, 1] dentro do frame da AOI. Serve **só** para ordenar dentro do estrato e para o relatório; o peso igual é conveniência declarada, sem alegação física. Com amplitude zero em alguma dimensão, Φ_diag é `null`. Nunca é exportado, nunca é feature, nunca é rótulo.

---

# PARTE V — PLANILHA E INVARIANTES: ATENÇÃO MÁXIMA

A planilha é o artefato que vai à banca. Trate-a como peça formal.

## 15. Estrutura

- **Aba 1 — Dados.** Uma linha por ponto. Cada variável científica ocupa **duas colunas adjacentes**: `[Variavel]` e `[Variavel]_Origem`, com `medido (COPERNICUS/DEM/GLO30, <época>)`, `tabelado (…)` ou `indisponível — <causa>: <motivo>`. O leitor não precisa cruzar abas para saber se o número é medição.
- **Aba 2 — Procedência e Conformidade.** Data de emissão, filtros ativos, janela temporal, **contagem real** de consultas por fonte, decisões em vigor com seus IDs, e o bloco de fundamentação LGPD (Lei 13.709/2018, art. 7º, IV, e nota de pseudonimização).
- **Aba 3 — Qualidade do Dado.** Por variável: % medido, % modelado, % tabelado e % indisponível — este último **por causa**.
- **CSV** com os mesmos metadados e o mesmo bloco LGPD.

## 16. Regras de preenchimento

| Regra | Motivo |
|---|---|
| Célula numérica ausente fica **vazia**, nunca `0` | `0` é valor legítimo de declividade, BSI e área |
| Célula textual ausente recebe **texto explicativo** | vazio é ambíguo entre "não consultado" e "não há" |
| Decimal e DMS derivam do **mesmo número arredondado** | no Localizador a decimal usava `toFixed(6)` e o DMS a precisão plena |
| DMS trata o *rollover* de 60,0″ | `25° 59' 60.0" S` é notação inválida — produzida pelo Localizador |
| Aba de fontes diz **"disponíveis nesta instalação"** | dizer "consultadas" quando 148 de 150 linhas registram "não consultado" é falso |
| Nenhum literal de programa em coluna geográfica | o Localizador exportou "Custom" como macrorregião e "Bacia Local" como bacia em 150/150 linhas |
| Nome de coluna não induz leitura errada | `Data_Deteccao` guardava a data de processamento; use "emitido em" para emissão e "observado em" para observação |
| Máscara do SNCR reproduzida byte a byte; CPF/CNPJ nunca aberto | LGPD; auditado e correto no Localizador — não relaxar |

## 17. Invariantes — bloqueiam a exportação

Em `src/lib/matriz/invariantes.ts`, executados **sobre o artefato já projetado no perfil** — as linhas e colunas que serão escritas — antes de gerar o arquivo. Falha em qualquer um: recusa com mensagem explícita.

| # | Invariante |
|---|---|
| 1 | `perdaSolo` preenchida ⟺ 5 fatores preenchidos ⟺ memória com a equação. Inerte até a Fase 8, e o relatório diz "inerte" |
| 2 | O cabeçalho do artefato está contido na lista de permissão do seu perfil (§9) |
| 3 | `Campos_Estimados` lista **exatamente** os campos com `estado !== "medido"` |
| 4 | Origem satélite ⟹ `PRODUCT_ID` das cenas, data de cálculo e versão do motor preenchidos |
| 5 | "Sem correspondência" só aparece após consulta bem-sucedida sem match |
| 6 | Nenhuma coluna geográfica contém `"Custom"`, `"Bacia Local"`, `"Bacia Hidrográfica Local"`, `"Área Amostral GEE"`, nem nome de UF na coluna de município |
| 7 | **Detector de constante disfarçada:** nenhuma coluna numérica do artefato tem o mesmo valor em todos os valores não vazios quando há 21 ou mais valores não vazios |

**Implemente o 7 primeiro.** Sozinho, teria capturado o defeito principal do Localizador — 150 linhas com 35,2 t/ha/ano idênticos são impossíveis em dado real. Duas exigências que o SAREL 1 não cumpriu: o detector percorre **todas** as colunas numéricas do artefato, não uma lista escolhida à mão; e valores vazios **não** o desativam.

## 18. Mecanismos automáticos

Cada mecanismo tem um **meta-teste**: é exercitado contra um exemplo que contém o defeito e precisa detectá-lo. Verificação que não detecta nada é teste vacuoso.

| Mecanismo | Arquivo | Falha quando |
|---|---|---|
| Guarda antissintético | `seguranca/guardaSintetico.ts` | qualquer saída (planilha, CSV, GeoJSON, KML, shapefile, dossiê, perfis cegos, matriz) ou a reidratação do store aceita ponto com `origemSintetica: true`; o teste de cobertura passa um ponto sintético por **cada** função de saída |
| Padrões proibidos | `seguranca/padroesProibidos.test.ts` | aparece nos módulos científicos: `.unmask(` com número; `\|\|` ou `??` seguidos de número; parâmetro numérico com default na assinatura; `Math.max`/`Math.min` com literal; `adquiridoEm` a partir de `new Date`. Exceção só com `// permitido: <justificativa de pelo menos 20 caracteres>`, listada no relatório de fase |
| Evidência de verificação | `seguranca/verificacoes.test.ts` | comentário afirma verificação com data sem citar arquivo em `docs/verificacoes/`, ou cita arquivo inexistente |
| Quarentena | `seguranca/importacoes.test.ts` e ESLint `no-restricted-imports` | algum arquivo de `src/` importa de `legado/` |
| Registro de Decisões | `config/decisoes.test.ts` | decisão pendente não produz `indisponivel` com o ID; decisão "decidida" sem valor, autor, data e referência ou justificativa |

---

# PARTE VI — INTERFACE

## 19. Princípio e telas

> Quem olha a tela precisa distinguir, sem clicar, o que é medição e o que não é — e, quando não é, por quê.

A interface do Localizador era boa em navegação, mapa e fluxo de trabalho: seleção de região e AOI, desenho de talhões, relevo 3D, projetos salvos, credenciais, diagnóstico. **Parta dela** (`docs/legado/design.md` e as telas em `docs/images/`) e retire o que afirmava resultado: severidade, Top-N, "perda média", mapa de calor de risco. O mapeamento tela a tela está no plano, §13.1.

**Mapa.** MapLibre GL, pontos coloridos por **estrato** (nunca por severidade). Filtros por estrato, declividade, status de rotulagem e bloco. Alternador "colorir por completude de dado". Camadas WMS da Embrapa apenas como contexto visual.

**Inspetor de Ponto — a tela central.** Todas as variáveis, cada uma com selo de proveniência:

```
┌──────────────────────────────────────────────────────────────┐
│  PR-2026-0042        -25,0669 / -53,6880        Estrato 2-3-2 │
├──────────────────────────────────────────────────────────────┤
│  TERRENO                                                      │
│   Declividade      12,4 %      ● medido    DEM GLO-30 (31982) │
│   Curvatura perfil −0,003      ● medido    DEM GLO-30         │
│   TWI                —         ○ indisponível — fora do       │
│                                  domínio: declividade 0°      │
│                                                               │
│  SOLO                                                         │
│   Ordem            NEOSSOLO    ● medido    Embrapa GeoInfo    │
│   Grande grupo     Eutrófico   ● medido    levantamento       │
│   Unidade          associação  ⚠ confiança média — 3 solos,   │
│                                  a carta não resolve o ponto  │
│   Erodibilidade    Alta        ● medido    (categórica)       │
│                                                               │
│  SÉRIE — janela D, 2019-2025        412 observações válidas   │
│   [gráfico por banda, com LACUNAS VISÍVEIS COMO LACUNAS]      │
│   Ê (solo descoberto)  —       ○ indisponível — aguardando    │
│                                  decisão D10                  │
│                                                               │
│  CHUVA                                                        │
│   I30 máx          38,2 mm/h   ● medido    GPM IMERG          │
│   Acum. 90 d      412,0 mm     ● medido    CHIRPS             │
│                                                               │
│  ROTULAGEM                                                    │
│   ○ não rotulado                                              │
│                                                               │
│  FUNDIÁRIO (acesso para campo — não é feature)                │
│   CAR  PR-XXXXXXX-…        Titular  (máscara oficial do SNCR) │
└──────────────────────────────────────────────────────────────┘
```

Selos: `●` medido (verde, sólido) · `◊` modelado (azul, losango) · `□` tabelado (amarelo, quadrado) · `○` indisponível (cinza, círculo aberto), sempre com a causa. **No gráfico da série, lacuna é descontinuidade, jamais linha interpolada** — interpolar visualmente é mentir na tela.

**Painel da Matriz de Treino.** Total de pontos, rotulados e por modalidade; balanço de classes com prevalência explícita; distribuição por estrato e bloco; completude por feature; Kappa; taxa de erro da interpretação (A × B); alerta de baixa variância.

**Painel de Campanha.** Pontos por estado (a rotular · em campo · rotulado · validado), por observador e modalidade; **um botão de exportação cega por perfil**, com aviso do que é omitido; importação de rótulos; roteirização (Mapbox Directions); consumo da cota Planet, saldo e dias restantes.

**Comparador de Evento.** T− e T+ lado a lado, evento de chuva marcado na linha do tempo com o I30, cursor sincronizado.

**Decisões.** Leitura do Registro: cada decisão com estado e o que ela trava. Alteração só pelo pesquisador, no arquivo.

**Relatórios.** Qualidade do Dado (indisponibilidade por causa); Reprodutibilidade da Amostragem (frame, estratos, terços, semente, variograma, aresta do bloco, versão do motor, decisões em vigor); Dossiê do Ponto em PDF.

## 20. Credenciais

Mantenha o padrão do Localizador, auditado e correto: setor próprio de configuração, chaves em **sessão de servidor efêmera** referenciada por cookie `httpOnly`, **nunca gravadas em disco**. GEE (Service Account), Planet e demais tokens pelo mesmo caminho. Nunca registre chave em log, mensagem de erro, commit, evidência ou fixture.

---

# PARTE VII — EXECUÇÃO

## 21. Protocolo de porte

Para cada arquivo que sai de `legado/`:

1. Leia o arquivo inteiro e a linha correspondente do inventário.
2. Confira contra a Lei Fundamental, os achados do plano (Apêndice B) e os padrões proibidos.
3. **Escreva primeiro o teste que falharia se o defeito conhecido estivesse presente.**
4. `git mv` de `legado/…` para `src/…` em commit **sem alteração de conteúdo**; adapte no commit seguinte.
5. Converta para `Proveniencia<T>`, remova defaults numéricos, receba parâmetros metodológicos por argumento.
6. Atualize o inventário: ação, commit, observação.
7. Três verdes.

Ações: **portar** (volta quase intacto), **adaptar** (volta com as correções listadas), **reescrever** (arquivo novo; o antigo é só referência), **descartar** (não volta; motivo registrado), **avaliar** (decisão adiada para a fase indicada).

## 22. Relatório de Fase

Entregue ao fim de cada fase, e só então proponha a próxima:

```markdown
## Relatório da Fase N — <título> — AAAA-MM-DD

### Feito
- <item> — evidência: <teste | arquivo | commit>

### Verificado ao vivo nesta sessão
- <serviço> — docs/verificacoes/<arquivo>

### NÃO verificado
- <item> — motivo

### Testes
- npm run test: <arquivos> arquivos, <testes> testes, <falhas> falhas
- tsc: <n> erros · lint: <n> erros · build: <ok | não executado>
- Exceções aos padrões proibidos: <lista com justificativa>

### Inventário
- <arquivo> — <ação> — <commit>

### Decisões
- usadas (decididas): <IDs>
- pendentes que afetaram esta fase: <IDs e o que ficou indisponível por causa delas>
- propostas preparadas para o pesquisador: <IDs>

### Defeitos novos encontrados
- <arquivo:linha> — <descrição>

### Próximo passo proposto
- <escopo da próxima fase> — aguardando autorização
```

O relatório não qualifica o próprio trabalho ("aprovado", "com louvor", "robusto"). Diz o que foi feito, o que foi verificado e o que não foi.

## 23. Disciplina de trabalho

1. **Uma fase por sessão.** Pare ao fim e entregue o relatório. Não existe commit de "implementação completa".
2. **Teste antes de declarar pronto.** Teste que passaria com o defeito presente não conta; todo varredor tem meta-teste.
3. **Verifique ao vivo e arquive a evidência** (Regra 8).
4. **Pare e pergunte** nas decisões 🛑 e diante de qualquer parâmetro metodológico que não esteja no Registro. Não escolha sozinho o que vai para uma dissertação.
5. **Diffs cirúrgicos.** Não reformate arquivo inteiro, não troque biblioteca, não acrescente dependência sem pedir.
6. **Git.** Commit por módulo, com mensagem descritiva. Nenhum commit, tag, branch ou push sem autorização; push sempre com confirmação explícita.
7. **Não toque** na pasta `08 - SAREL 1`, em `data/` nem nas pastas `Dados *`.
8. **Relate com honestidade.** Se algo ficou parcial, diga qual parte. Se não verificou, diga que não verificou. Descreva o código lendo o código.
9. **Três verdes** ao fim de cada fase: `npm run test && npx tsc --noEmit && npm run lint`. **Nunca** desative teste, use `skip` ou afrouxe asserção para passar.
10. **Dados pessoais** nunca em log, evidência, fixture ou commit. Fixtures fundiárias usam nomes fictícios e pontos marcados como sintéticos.

## 24. Critério de conclusão

O sistema está pronto quando:

- todos os invariantes passam sobre um conjunto **real**, extraído do Earth Engine;
- a aba de Qualidade do Dado mostra a proveniência efetiva de cada variável, com a indisponibilidade por causa;
- as exportações cegas não contêm feature, estrato, Φ nem rótulo de outra modalidade;
- nenhuma coluna numérica tem valor idêntico em todas as linhas;
- toda fórmula tem referência em docstring e teste de comportamento;
- todo serviço externo tem evidência arquivada e datada;
- nenhum código usa decisão pendente sem devolver `indisponivel`;
- o Inspetor mostra os selos e as lacunas da série aparecem como lacunas;
- `legado/` foi removida com o inventário 100% resolvido.

## 25. Comece por aqui

1. Leia este prompt e o plano v3 por inteiro.
2. Verifique o estado: `git branch --show-current`, `git status`, existência de `legado/` e de `docs/planejamento/INVENTARIO_LEGADO.md`.
3. **Se ainda estiver em `correcoes/auditoria-2026-09` e `legado/` não existir:** proponha a Fase −1 (plano §5) passo a passo e aguarde autorização. O push da tag e da branch exige confirmação explícita, depois de conferir que o repositório no GitHub é privado.
4. **Se a Fase −1 já foi feita:** leia o inventário e o último Relatório de Fase e proponha a próxima fase.
5. Antes da Fase 1, confirme com o pesquisador o entendimento das 9 regras e liste as decisões pendentes que afetam as Fases 1 a 4.

## 26. Resumo em uma frase

> Construa um sistema que prefere dizer **"não sei, e este é o motivo"** a apresentar um número plausível — e que **falha, de forma visível, quando alguém tenta o contrário**. O número plausível reprovou o Localizador, reapareceu no SAREL 1 e é exatamente o que uma banca detecta.
