# Evidência de Conferência no Primário, Lastro de D02/D10 e Diagnóstico da Máscara GEOS3

**Data:** 09/11/2026  
**Autor:** Agente Executor SAREL  
**Vinculação:** Regra 8 da Lei Fundamental (Verificar antes de afirmar, com evidência arquivada) e Norma de Lastro Científico (`docs/metodologia/NORMA_LASTRO_CIENTIFICO.md`).  
**Branch:** `correcoes/contencao-2026-11-02`

---

## 1. O Que Foi Conferido no Primário e Arquivamento

Nesta rodada, **três obras** foram conferidas diretamente a partir dos seus arquivos digitais integrais presentes na máquina local:

| Obra | Veículo / Identificador | Hash SHA-256 | PDF no Git? | Justificativa de Arquivamento |
|---|---|---|:---:|---|
| **Demattê et al. (2018)** | *Remote Sens. Environ.* 212:161-175, DOI: `10.1016/j.rse.2018.04.047` | `f6dc34d82c5bcd9165c78f32fe6efd2926275d1d5f81f4e037e43e4f4185ab87` | **Não** | Padrão `doc246`: publicação comercial proprietária da Elsevier B.V. (ScienceDirect). O PDF integral é mantido localmente em `docs/bibliografia/01_pesquisas_diretamente_relacionadas/1-s2.0-S0034425718302049-main.pdf` (desindexado via `.gitignore:103`); no Git versionam-se o script de extração `extrair_dematte_2018.py`, a saída textual integral e a nota `conferencia_dematte_2018.md` em `docs/verificacoes/fontes/dematte2018/`. |
| **Rikimaru, Roy & Miyatake (2002)** | *Tropical Ecology* 43(1):39-47, ISSN 0564-3295 | `80e9e9fe884282860c1be461d08017515da18130d08531268b0d6c054b71885f` | **Não** | Padrão `doc246`: cópia re-hospedada em repositório de terceiros (Yumpu). Como a licença explícita de redistribuição da cópia não pôde ser atestada com certeza jurídica, o PDF permanece fora do Git em `docs/bibliografia/01_pesquisas_diretamente_relacionadas/`; o repositório Git armazena extração, saída e nota de conferência em `docs/verificacoes/fontes/rikimaru2002/`. |
| **Safanelli et al. (2021)** | *Rev. Bras. Cienc. Solo* 45:e0210080, DOI: `10.36783/18069657rbcs20210080` | `1f05f84f32e3114a6cf3e1729396f9f08e8952c3c5fd01e2f3358982dfd93715` | **Sim** | Padrão `renard1997`/`zhu2013`: periódico de acesso aberto sob licença Creative Commons Attribution (**CC BY**), que autoriza expressamente redistribuição irrestrita com atribuição da fonte. O PDF foi arquivado diretamente no repositório em `docs/verificacoes/fontes/safanelli2021/safanelli_2021_rbcs.pdf`. |

---

## 2. O Que Cada Fonte NÃO Sustenta

### 2.1 Demattê et al. (2018)
- **NÃO sustenta o índice VNSIR nem o limiar 0,90:** o termo e o índice `VNSIR` têm zero ocorrências no artigo seminal de 2018. O artigo utilizava testes booleanos diretos sobre canais do visível ($B3 - B2 > 0$ e $B2 - B1 > 0$). O VNSIR só foi formulado posteriormente em Demattê et al. (2020, *Scientific Reports* 10:4461).
- **NÃO sustenta limites inferiores negativos estendidos:** a máscara de 2018 fixou NDVI entre $0$ e $0,25$ e NBR2 entre $0$ e $0,075$ (não $-0,25$ nem $-0,30$).
- **NÃO trata de erosão laminar:** o foco é a recuperação de curvas de refletância de solo para pedologia e mapeamento digital.
- **NÃO calibra sobre Sentinel-2:** o estudo utilizou exclusivamente Landsat 5 TM.

### 2.2 Rikimaru, Roy & Miyatake (2002)
- **NÃO sustenta cortes numéricos de triagem espectral:** os limiares `BSI > 0,10`, `NDVI < 0,40`, `BSI < 0,00` e `NDVI > 0,65` associados a D02 não constam em nenhum ponto da obra.
- **NÃO trata de erosão:** a obra modela a densidade de dossel florestal tropical (*Forest Canopy Density* — FCD) na Ásia/Pacífico.
- **NÃO usa cortes discretos:** o modelo FCD integra índices contínuos (AVI, BI, SI, TI) via PCA, sem limiares fixos de solo nu.

### 2.3 Safanelli et al. (2021)
- **NÃO sustenta o limiar NDVI $\le 0,25$ de D10:** o estudo aplicou no Estado de São Paulo a faixa regional de NDVI entre $-0,05$ e $0,30$.
- **NÃO trata do índice BSI de Rikimaru:** a menção a `BSI` na obra refere-se unicamente à *bare soil image* (imagem composta multitemporal de solo exposto).
- **NÃO trata de processos erosivos:** a aplicação é estritamente pedométrica (predição de argila, ferro e cátions trocáveis).

---

## 3. Ponto de Parada Metodológico (§ 1.6) e Pergunta Aberta

A verificação no primário de Demattê et al. (2018) revelou que **o índice VNSIR não existe nesta publicação seminal**, enquadrando a execução no **Cenário 3 do § 1.6**:
> *"O primário não traz a máscara, ou não traz o VNSIR (`NÃO CONSTA NO PRIMÁRIO`): PARE a Tarefa 3 e relate. Conclua as Tarefas 1, 2, 4, 6 e 7, que não dependem disso, e deixe a 3 e a 5 pendentes com a pergunta explícita."*

Simultaneamente, a investigação revelou que a formulação completa proposta no prompt (`NDVI ∈ [−0,25; 0,25]`, `NBR2 ∈ [−0,30; 0,10]`, `VNSIR < 0,90` com $VNSIR = 1 - [(2\cdot\text{Red} - \text{Green} - \text{Blue}) + 3\cdot(\text{SWIR2} - \text{NIR})]$) encontra-se descrita na evolução do GEOS3 publicada em **Demattê et al. (2020)** (*Scientific Reports* 10:4461, p. 8, Equações 1 a 3), obra já presente no acervo (`docs/bibliografia/01_pesquisas_diretamente_relacionadas/41598_2020_Article_61408.pdf`).

### Pergunta explícita aberta para decisão do pesquisador:
> **"Considerando que o artigo seminal de Demattê et al. (2018) define a máscara GEOS3 com NDVI [0; 0,25], NBR2 [0; 0,075] e gradientes visuais sobre Landsat 5 TM sem VNSIR, enquanto a máscara com NDVI [−0,25; 0,25], NBR2 [−0,30; 0,10] e VNSIR < 0,90 foi introduzida na evolução do GEOS3 em Demattê et al. (2020, Scientific Reports 10:4461, p. 8): deve o projeto formalizar a emenda de D10 adotando a máscara de Demattê et al. (2020) em conjunto com a de 2018, procedendo à implementação das bandas B3/VNSIR no código e no contrato GEE?"**

---

## 4. Defeitos Corrigidos nesta Sessão

1. **`src/config/decisoes.ts` (D02, linha 86):**
   - *Antes:* Atribuía limiares de D02 a `Rikimaru, T. et al. (2002)` e citava metadados bibliográficos imprecisos.
   - *Depois:* Retificada autoria para `A. Rikimaru, P. S. Roy & S. Miyatake (2002)`, veículo para `Tropical Ecology 43(1):39-47`, declarando expressamente que a fonte sustenta apenas o índice biofísico BSI/BI e que os cortes numéricos são convenção operacional autônoma do SAREL.
2. **`src/config/lastroCientifico.test.ts` (linhas 90-134 e 454-468):**
   - *Antes:* Mantinha `D02` como dívida em `LASTRO_NAO_CONFERIDO`.
   - *Depois:* D02 removida da lista de dívida após arquivamento da conferência em `docs/verificacoes/fontes/rikimaru2002/`; asserção de quitação por cruzamento ajustada para verificar o arquivamento efetivo da obra.
3. **`docs/bibliografia/README.md` (linha 18):**
   - *Antes:* Indicava `Itens 001 a 041` colidindo com `Itens 036 a 088` da pasta 02.
   - *Depois:* Retificado para `Itens 001 a 035 e Adições 110 a 115`, eliminando a ambiguidade numérica.
4. **`docs/bibliografia/01_pesquisas_diretamente_relacionadas/README.md`:**
   - *Antes:* Numerava as 6 adições como 036 a 041.
   - *Depois:* Numeradas como 110 a 115 (continuando das 109 obras canônicas).
5. **`docs/bibliografia/INVENTARIO_SELECAO_BIBLIOGRAFICA.md`:**
   - *Tabela 4 (Linhas 375, 383, 384):* Corrigidas as incoerências bibliográficas de Rikimaru 2002, Demattê 2018 e Safanelli 2021 (título, DOI `rbcs20210080`, e declaração dos caminhos em `docs/verificacoes/fontes/`).
   - *Seção 6:* Tabela atualizada com itens 110 a 115, retificação do veículo de Daughtry et al. (2001) para os Anais do 10th JPL AVIRIS Workshop e inclusão das colunas de rastreabilidade `URL de Origem` e `Data de Obtenção`.
6. **`docs/planejamento/DECISOES.md` e `docs/planejamento/ESTADO.md`:**
   - Regenerados para paridade exata com o código versionado.

---

## 5. Linha de Impacto

- `candidatosComSoloNuMedido: 0` (medido em `ESTADO.md:53`).
- **Nenhuma medição física ou analítica foi invalidada**, pois a dimensão Ê permanece em estado bloqueado aguardando parametrização e consulta de satélite.

---

## 6. Nota de Proveniência

- A cópia digital de **Rikimaru et al. (2002)** provém de re-hospedagem em plataforma de terceiros (Yumpu), mantendo-se a nota de advertência sobre fidelidade tipográfica em relação à publicação física impressa em *Tropical Ecology*.
- A cópia digital de **Daughtry et al. (2001)** provém do repositório público da NASA/JPL (`aviris.jpl.nasa.gov`), correspondendo às atas oficiais do workshop.
