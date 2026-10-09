# Revisão global do SAREL v2 — 09/10/2026

**Base:** `HEAD` 6adc958 (branch `claude/affectionate-galileo-8abtjo`). **Método:** quatro revisões independentes e somente leitura, cada uma com um escopo (pipeline estatístico; fatores RUSLE e dados; front-end, exportações e segurança; coerência entre documentos e código), mais verificação própria dos achados mais graves. Nada foi aplicado ao código do app. Foram corrigidos apenas os anexos de referência (`ANEXOS_PROMPT_EXECUTOR_2026-10-06/`), o prompt do executor (agora v3), a apresentação e o manual.

**Placar de baseline, medido hoje:** `typecheck` exit 0; `lint` exit 0 com 2 avisos (`MapViewer.tsx:476`, `PointPopup.tsx:64`); `npm run test`: 3 arquivos e 6 testes falham, 429 passam (435), como na v2; os 49 testes Python dos anexos passam. Build e `dev` (exit 1 e HTTP 500 na v2) **não foram reexecutados**.

**Honestidade sobre o que foi verificado.** Os 62 achados abaixo vêm de quatro relatórios. Os que tenho como CONFIRMADOS reproduzi eu mesmo (comando ou leitura do código, na mesma sessão). Os demais estão como RELATADOS: o revisor colou prova no seu relatório, mas não refiz. HIPÓTESE = sem prova por execução ou leitura. Um achado foi **parcialmente refutado** por mim (tercis, abaixo). Nenhuma fonte bibliográfica nova foi citada de memória.

## 1. Correções a afirmações minhas anteriores

| O que eu disse | O que é verdade |
|---|---|
| "Fator 10, inferido empiricamente" | O fator é **9,81**. Fonte primária: dissertação de Waltrick (2010), Tabelas 1.1 a 1.8, equações de Rufino "convertidas para o SI" (Região 1: 182,86 + 56,21·X = 18,64 × 9,81 e 5,73 × 9,81). O 10 só se aproximava porque a CHIRPS subestima a chuva |
| "12 estações a −0,03% a −0,25%" (apresentação, manual, emenda, pergunta à revista) | Esses números eram do cálculo com g = 9,80665, que deixei no texto depois de mudar o script para 9,81. Com 9,81: **−0,004% a +0,004%**. Corrigido em todos os lugares |
| "Palotina: Quadro 1 = 11.036" | 11.036 é o valor ANTIGO de Rufino (Tabela 1.9 da dissertação). O de Waltrick é 10.436 (Quadro 1) ou 10.433 (Tabela 1.9) |
| Coeficientes 107,52/46,89 "sem fonte" | Têm fonte: são a **Região 6** em SI (Tabela 1.6). Região errada para a BP3 (Região 1) |
| "Quadro 2 × Figura 2 divergem em R2 a R6, sem como decidir" | A dissertação resolve R3, R4 (a = 16,73), R6 a favor do Quadro 2 e confirma R7 e R8; R2 e R5 ficam em aberto (fora do escopo BP3) |

## 2. Achados por gravidade, com destino

Destino: **Nxx** = bloco novo ou alterado no prompt v3; **DP-n** = decisão do pesquisador (seção 3-B do prompt); **anexo** = já corrigido por mim nos anexos; **doc** = já corrigido em documento.

### CRÍTICO

| # | Achado | Estado | Destino |
|---|---|---|---|
| B1 | A CLI `sortear_poligonos_d16.ts` e a rota `/api/gee/sorteio-d16` chamam `sortearPoligonosDroneD16` (36 × 10 ha, pi = 2/N_h). `sortear72PoligonosD16` (72 × 5,02 ha, o desenho vigente de D16) **não tem chamador** e ainda grava constantes no lugar de hashes (`sha256-72-poligonos-502ha`, `sha256-selo-72-<semente>`). Rodar `--confirmar` sela, de forma irreversível (D23), o desenho errado | CONFIRMADO (grep e leitura de `sorteioPoligonos.ts:439,707,842-851`) | **N10** |
| B2 | Pixel de cultura vigorosa com ~15% de cenas contaminadas por nuvem vira "solo exposto": o composto de percentis (p15/p50/p85 por banda) substitui a mediana por árvore de decisão com constantes sem fonte (0,14; −0,02; 0,38; …) e entra com selo `medido`; C sai 15× maior na sonda. A frequência real de contaminação é HIPÓTESE | CONFIRMADO o caminho de código (`copernicusGeeClient.ts:269,540-575`); o efeito numérico é do revisor, com entrada ilustrativa | **DP-3** |
| B3 | D09 diz "domínio agrícola [1..5]"; a carta de 2024 tem **seis** classes (a 6ª, "extremamente alta", K de 0,06 a 0,11). D08, o código e as medições de 29/09 a tratam como nível 2; `fatorK.ts` não a conhece. Muda a fração de K̂ = 2 de 16,7% para 31,1% e, portanto, o sorteio | CONFIRMADO (extração do Doc. 246, linhas 126-130 e 277-278; `decisoes.ts:130`). O efeito no WFS não foi verificado (HIPÓTESE) | **DP-1** |

### ALTO

| # | Achado | Estado | Destino |
|---|---|---|---|
| A1 | A pasta do Drive que o instalador usa está aberta a "qualquer pessoa com o link" e pertence a **outra conta**; o ID está versionado em 4 arquivos. O passo 8 de N07 mandava subir o ZIP com os proprietários a ela | RELATADO (consulta de permissões, só leitura) | **DP-15**; N07 alterado |
| A2 | O argumento dos tetos de D24 usa o n efetivo TOTAL (≈ 1.841); só os 36 polígonos de treino ajustam o modelo (≈ 920), e "evento" depende da prevalência | CONFIRMADO (aritmética A/(π·25²)) | **DP-9**; anexo (config PROPOSTA) |
| A3 | `--probatorio` aceitava qualquer texto em `sha256_config_congelada` | RELATADO e corrigido, com teste | **anexo** |
| A4 | A trava do held-out era gravada no fim: falha no bootstrap deixava rodar de novo; outro `--saida` contornava | RELATADO e corrigido, com teste | **anexo** |
| A5 | Persistência temporal devolve 0 (não nulo) com < 6 observações; N02(d) exportaria isso como preditor | CONFIRMADO (`persistenciaTemporal.ts:94-103,166,180`) | **N11** |
| A6 | A guarda de preditores não barrava `Fracao_Erodida`, `Poligono_ID`, `Estrato_ID`… | RELATADO e corrigido, com teste | **anexo** |
| A7 | Células de borda aparecem em dois polígonos com `Celula_ID` diferentes; nada filtrava `Incluida`; `Celula_ID` expunha índices da grade; falta a ponte que liga ~36.000 células a covariáveis | RELATADO; corrigido o que é do anexo (`Pixel_ID` opaco, filtro, disjunção) | **anexo**, **DEC-17**, **DP-18** |
| A8 | Declividade: estêncil de Horn a ±30 m com vizinho mais próximo numa grade de 1″ (≈ 28 × 30,9 m): ≈14% dos pontos com erro > 10% (simulação do revisor, relevo liso) | RELATADO; é simulação | **DP-4** |
| A9 | Fallback silencioso para Open-Meteo rotulado "Copernicus DEM GLO-30 / EPSG:31982"; a resolução servida NÃO foi verificada | RELATADO | **N17**, DP-4 |
| A10 | "Frequência de solo nu" do fluxo pontual = nº de 3 testes heurísticos ÷ 3 (valores 0; 0,33; 0,67; 1), selo `medido`; o fluxo em lote usa outra definição; comparadores `<` e `<=` misturados | RELATADO | **DP-3** |
| A11 | Suficiência D11: contagem ausente vira 6 ("exatamente suficiente") no fluxo pontual; no lote vira 0 e a frequência continua `medido` | RELATADO (sonda) | **N17** |
| A12 | Datas fabricadas: literal `S2B_…20231031…` e janela fixa 2018-2023; três períodos diferentes para o mesmo dado | CONFIRMADO (grep `route.ts:781,1150`) | **N17** (+C08, C10, C26) |
| A13 | `fatorR.ts` tem uma tabela de precipitação mensal sem fonte, 5% a 21% acima da climatologia medida; o lookup por lat/lon a usa; o par 107,52/46,89 (Região 6) ainda é constante exportada | CONFIRMADO (`fatorR.ts:94,111,169,256-284`; números de P do revisor reproduzidos com o JSON) | **N09** |
| A14 | R aceita vetor de um ano (2022) sem rejeitar: R sai 12% a 53% acima da climatologia; R tem ≤ 6 estações e funciona quase como identificador de lugar | RELATADO (sonda); o efeito de R como preditor é HIPÓTESE | **N09**, **DP-5** |
| A15 | `P0.1` do prompt v2 falha hoje (aspas do git em caminhos com acento; `scripts/pluviometria/`) | CONFIRMADO | **doc** (P0.1) |
| A16 | A salvaguarda "lista held-out congelada com hash" e a "DEC-17" citadas em `DECISOES_PROPOSTAS_D27_D28` apontam para um commit (`f589670`) que não existe neste repositório | RELATADO | **DEC-17** nova no prompt |
| A17 | `DECISOES.md` é espelho obsoleto de `decisoes.ts` (9 estados diferentes, D20-D26 ausentes, fórmulas de D13 e LS antigas) | RELATADO | C13 (movido para antes de N06) |
| A18 | Ordem de fases com duas dependências invertidas; pares de blocos que editam as mesmas linhas | RELATADO | **doc** (seção 5, E10, E11) |
| A19 | Cifras de R/E-D13 do prompt, da emenda e da pergunta à revista não saíam do script | CONFIRMADO (era erro meu, item 1) | **doc** |

### MÉDIO

| # | Achado | Estado | Destino |
|---|---|---|---|
| M1 | "sem-correspondencia" fabricado quando o fundiário nunca foi consultado (`planilha.ts:179`, `PointPopup.tsx:92`, `AuditDossierModal.tsx:193`) | CONFIRMADO | **N14** |
| M2 | `Campos_Estimados` diz "Nenhum (100% medido)" para campo ausente (`planilha.ts:137`) | CONFIRMADO (texto); o mecanismo (`testar()`) é relatado | **N14** |
| M3 | A exportação GeoJSON não passa por perfis nem invariantes e exporta `estrato` e CAR (`ExportModal.tsx:121-134`) | CONFIRMADO | **N14** |
| M4 | Planet "validada" sem validar nada (rota inexistente); Jev "ATIVADA" com `offline: true`; painel fundiário com rótulos fixos; "~78%" e "1.845" em `PainelCampanha.tsx:379-380` | CONFIRMADO (leitura) | **N15** |
| M5 | SSRF por `token_uri` (`auth.ts:81`); rotas de escrita sem checagem de `Origin` nem de `Content-Type` (CSRF cego a `127.0.0.1:3000`); só a rota fundiária usa `isLocalRequest` | CONFIRMADO (código); o alcance prático é do revisor | **N16** |
| M6 | A verificação de integridade do sítio local (N07.4) era inócua: o `.sha256` viaja no mesmo ZIP | RELATADO (raciocínio sobre o desenho do bloco) | **N07** alterado |
| M7 | TWI e `Curvatura_Perfil` do pré-registro saem sempre `indisponivel`: o bloco de terreno efetivo teria 1 preditor, não 3 | RELATADO; o avaliador agora recusa coluna 100% ausente | **DP-14**, anexo |
| M8 | Chave de monotonicidade com nome errado era ignorada em silêncio | RELATADO e corrigido | **anexo** |
| M9 | Tercis de D12: NaN cai no tercil 3; empates não são tratados. **Parcialmente refutado:** o revisor disse que o índice 9.999 em n = 30.000 estava errado; ele está certo (`ceil(n/3) − 1`). O deslocamento por usar 0,3333/0,6667 é desprezível | CONFIRMADO só o NaN e os empates | **N12**, **DP-6** |
| M10 | Kappa 2×2 devolve 1 quando só há uma classe e 0 quando n = 0; C30 mandava preservar | CONFIRMADO (`validacaoMatricial.ts:144,154`) | **N13** |
| M11 | `NDVI_Maximo_Mediano` é o P90 de toda a série, não a mediana dos máximos | CONFIRMADO (leitura de `:162-163`) | **N11** (renomeia a coluna), **DP-13** |
| M12 | Sem pesos de Horvitz-Thompson nem regra de distância entre polígonos sorteados | HIPÓTESE (leitura do código; não foi provado com dados) | **DP-7** |
| M13 | Acumulados de chuva por contagem de registros, não por janela; -9999 não tratado (acumulado negativo na sonda) | RELATADO (sonda) | **N17** |
| M14 | Defaults silenciosos no script de remedição (nível de K indeterminado → 1; classe ausente → "Média"); 126 de 680 candidatos com classe "Alta" e nível 1 | RELATADO (cache) | **N17** |
| M15 | Selos que não correspondem ao cálculo (K de fallback `tabelado`; CHIRPS/IMERG `medido`; "EPSG:31982" sem cálculo; P = 1 `tabelado`); tabela de classes de K duplicada; NDVI/BSI com 0 ou truncamento | RELATADO | **DP-19** |
| M16 | LS sem produtor de A_in e sem teto | CONFIRMADO (`git grep` só acha `fatorLS.ts`) | **N08** (nota) |
| M17 | Cinco cifras de unidades efetivas do held-out (918, 920, 922, 923, 936) | CONFIRMADO (`Math.round(1845·0,5)` = 923) | **DP-16**, U04 |
| M18 | "36 polígonos de 10 ha" ainda em D06, D12, D19, D23, D24, D26; "34.800 células" em D16 (72 × 5,02 ha = 36.144) | RELATADO | **DP-8** |
| M19 | Âncoras do Planejamento v3 em D17, D18 e D19 (§11.1-11.3, §10.4, §10.5) não existem | RELATADO | **DP-12** |
| M20 | Vocabulário de rótulo: "controle", "spd" e "0" aceitos pelo validador e não mapeados por D03 | RELATADO | **DP-10**, N02(a) |
| M21 | Premissas falsas em N02(d) (nome de função, `grep` do aceite casa 5 pontos) | RELATADO | **doc** (N02) |
| M22 | IDs P12..P15 colidem com a "proibição P12" já usada em `decisoes.ts` e em 8 pontos de `src` | CONFIRMADO | **doc** (P20..P24) |
| M23 | Doc. 246: 38 p. ou 40 p. em quatro decisões | RELATADO | **DP-11** |
| M24 | O Tour tem números e atribuições defasados (D01-D19, K por classe, "mais de 15 preditores", `decisaoId`) | RELATADO | U11 ampliado; **DP-17** |
| M25 | Numeração dos invariantes da FICHA_TECNICA não bate com `invariantes.ts`; README afirma "1 a 7" mas não há implementação do 4 | RELATADO | N14(e), N05/F3 |
| M26 | `gerar_manual_pdf.py:233-237` traz áreas e prefixos de CAR que não coincidem com `sitiosReferencia.ts` | RELATADO | **N07** alterado |

### BAIXO

CAR em doc legado fora do regex (**N07**); download do banco sem hash e `requirements.txt` sem versões fixas (**DP-15**); `verificar_ui.cjs` com guarda que nunca casava (**anexo**); números mágicos do avaliador; `localeCompare` no sorteio (**N10**); semente padrão silenciosa; "2019 a 2025" e "GPM IMERG" literais na planilha (**N14**); pendências menores em anexos (corrigidas as de `extrair_sitios_locais.ts`, `config_pre_registro_PROPOSTA.json` e o SHA da pergunta à revista).

## 3. O que o executor NÃO resolve e você precisa decidir

As 19 decisões estão na seção 3-B do prompt v3. As quatro que **mudam o sorteio irreversível** e por isso precisam de resposta antes de qualquer `--confirmar`: **DP-1** (classes de erodibilidade), **DP-3** (frequência de solo nu e composto), **DP-4** (declividade) e **DP-6** (empates dos tercis). As que bloqueiam o pré-registro: **DP-9**, **DP-13**, **DP-14**, **DP-18**.

## 4. Áreas verificadas e limpas (segundo os revisores)

Estatística do avaliador (Spearman com postos médios, AUC com empates, bootstrap por polígono emparelhado, `GroupKFold` só no treino, imputação dentro do `Pipeline`); o gerador de fração por célula (conservação de área); as equações de LS (m, β, S, L) contra os valores do aceite de N08; a matemática do R e a climatologia CHIRPS (540 meses por estação, sem NoData); `derivarNivelKDaCarta2024`; ausência de segredos em arquivos versionados; nenhuma credencial em `localStorage`; as rotas não leem caminho vindo do cliente; os `.bat` só chamam scripts locais. Mais de 50 âncoras do prompt v2 conferidas e corretas.

## 5. Limites

Não executei `npm run build`, `npm run dev` nem `verificar_ui.cjs` (as "21 falhas" da UI e o HTTP 500 são medições anteriores). Não rodei nada contra GEE, Planet, Drive (além da leitura de permissões pelo revisor) nem dados locais. As cifras de simulação (14% de erro de declividade; C de 0,051 para 0,771) são dos revisores, sobre entradas ilustrativas. O número de achados (62) soma os quatro relatórios sem remover possíveis sobreposições.
