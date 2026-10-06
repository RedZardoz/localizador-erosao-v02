# Emendas propostas ao registro de decisões (06/10/2026)

**Status.** Texto redigido a pedido do pesquisador, que **aceitou as recomendações** correspondentes na conversa de 06/10/2026 (ressalvas R-A a R-G, DEC-5, DEC-6, DEC-7, DEC-9, DEC-11 a DEC-13, DEC-16, P10, otimização dos preditores e opção (c) para DEC-10). O executor aplica cada emenda em `src/config/decisoes.ts` **acrescentando** o parágrafo ao final do campo `valor` (e, quando indicado, ao campo `referencia`) da decisão, **sem apagar nem reescrever o texto original** e **sem alterar `estado`, `decididoPor` ou `decididoEm`**. O parágrafo começa por `EMENDA DE 06/10/2026 (proposta do assistente, aceita pelo pesquisador em conversa; pré-dados):`. Nenhuma decisão passa a "decidida" por este arquivo. Todas as emendas são **anteriores a qualquer resultado**: nenhum dado real foi ajustado ou avaliado.

Fontes verificadas nesta sessão: PDF primário de Renard et al. (1997) em `docs/verificacoes/fontes/renard1997/ah_703.pdf` (páginas 105 e 107 do volume impresso, lidas como imagem); PDF de Waltrick et al. (2015) em `docs/verificacoes/fontes/waltrick2015/waltrick_2015.pdf`; ficha catalográfica do Documentos 246 na extração `docs/verificacoes/fontes/doc246/saida_extracao_cnps_doc_246_2024.txt`.

---

## E-D25 — D25 (critério de refutação)

**Parágrafo a acrescentar a `valor`:**

> EMENDA DE 06/10/2026 (proposta do assistente, aceita pelo pesquisador em conversa; pré-dados): (1) CORREÇÃO NUMÉRICA — onde o texto diz "18 AGRUPAMENTOS, não por 918 unidades", leia-se 36 agrupamentos e cerca de 920 unidades efetivas de held-out (36 polígonos × 5,02 ha = 180,7 ha; n_ef = A / (π · (r/2)²) com r = 50 m); piso (0,40), margem (0,10), métrica primária, unidade de bootstrap e demais critérios permanecem INALTERADOS. (2) DESFECHO ADICIONAL INCONCLUSIVA_MARGEM — se a estimativa pontual de rho_XGBoost atinge o piso de 0,40 e é maior ou igual a rho_RUSLE, mas a diferença é menor que 0,10, o resultado é INCONCLUSIVA_MARGEM: utilidade sem vantagem demonstrada sobre a RUSLE; não é refutação nem corroboração, e é vedado reclassificá-lo depois. (3) As métricas secundárias (AUC maior ou igual a 0,70 e delta de AUC maior ou igual a 0,05) são reportadas e NÃO condicionam o desfecho; a primária permanece a de D26. (4) A AUC é calculada sobre o escore contínuo de cada competidor; "RUSLE limiarizado" não altera a AUC, que depende só da ordenação. (5) O quarto desfecho (regressão penalizada empata ou vence o XGBoost dentro do intervalo) é avaliado sobre o IC de 95 % da diferença emparelhada rho_XGBoost menos rho_penalizada: se o limite inferior não excede zero, a hipótese sobre ensembles de árvores fica refutada. (6) SENSIBILIDADES PRÉ-REGISTRADAS adicionais, reportadas junto do principal e nunca escolhidas depois: XGBoost sem restrições de monotonicidade (mesmos hiperparâmetros) e, por D08, exclusão das células com marcador verdadeiro ou indisponível.

## E-D24 — D24 (regime de dados)

> EMENDA DE 06/10/2026 (proposta do assistente, aceita pelo pesquisador em conversa; pré-dados): as unidades efetivas do held-out resultam, pela fórmula do próprio D24, em cerca de 920 (e não 936); o total de 72 polígonos de 5,02 ha resulta em cerca de 1.841 (D24 diz 1.845; diferença inferior a 0,3 %, mantendo-se "cerca de"). Os tetos de preditores por bloco permanecem inalterados. O número de preditores do bloco espectro-temporal é um TETO, não uma cota: a declaração a priori (mitigação 3) usa 5 preditores espectro-temporais, 3 de terreno, 1 de solo e 1 de chuva (total 10). O expoente de Tweedie p é escolhido apenas por validação interna agrupada dentro da grade pré-registrada {1,2; 1,5; 1,8}.

## E-D06 / E-D16 — cifra de 78 % de acerto de atribuição

**Parágrafo a acrescentar a `valor` de D06 e de D16:**

> EMENDA DE 06/10/2026 (proposta do assistente, aceita pelo pesquisador em conversa; pré-dados): a cifra "cerca de 78 %" de acerto de atribuição do rótulo à célula de 10 m, associada ao CE90 de 1,47 m, NÃO se reproduz pelo modelo declarado (erro gaussiano isotrópico por eixo, ponto verdadeiro uniforme na célula): para σ = 3, 5 e 8 m o modelo dá 57,9 %, 37,2 % e 19,6 % (idênticos a P03), mas CE90 = 1,47 m corresponde a σ = 1,47 / 2,146 = 0,685 m por eixo e dá 89,4 %; 78 % corresponde a σ ≈ 1,46 m. A cifra fica EM VERIFICAÇÃO e não deve ser citada como resultado. Será medido o erro conjunto rótulo→célula (VANT, Sentinel-2 e delineação) por comparação do ortomosaico das missões já voadas com o Sentinel-2 em feições identificáveis. A inversão de papéis de D16 permanece fundamentada qualitativamente (CE90 de 1,47 m do VANT contra 3 a 8 m do GNSS de frequência única) e o alvo contínuo por célula é pouco sensível ao erro de borda; o desenho não depende da cifra.

## E-D02 — D02 (critérios de Classe 1/Classe 0)

> EMENDA DE 06/10/2026 (proposta do assistente, aceita pelo pesquisador em conversa; pré-dados): os limiares de BSI e NDVI de D02 definem um CRITÉRIO DE TRIAGEM DE CANDIDATOS e uma ajuda visual, NÃO um rótulo (Regra 4: nada calculado vira rótulo). Por D16 os polígonos de VANT são sorteados pelos estratos biofísicos e nunca pelo rastreio espectral; logo estes limiares não têm papel na seleção de polígonos nem no alvo do modelo (D26). Onde o texto original diz "Classe 1" e "Classe 0", leia-se "candidato espectral a erosão" e "candidato espectral a controle".

## E-D09 / E-D10 — citação de Mannigel et al. (2002)

**Parágrafo a acrescentar a `referencia` de D09 e de D10:**

> EMENDA DE 06/10/2026 (proposta do assistente, aceita pelo pesquisador em conversa): a citação "Mannigel et al. (2002), RBCS 26:1039-1049" NÃO foi confirmada; a obra encontrada com esses autores e ano é Mannigel, Carvalho, Moreti e Medeiros, "Fator erodibilidade e tolerância de perda dos solos do Estado de São Paulo", Acta Scientiarum, Maringá, v. 24, n. 5, p. 1335-1340, 2002, que trata de solos de São Paulo e não sustenta, por si, as classes de erodibilidade do Paraná. A citação fica SUSPENSA até conferência; a sustentação normativa de D09 é o Documentos 246 da Embrapa Solos.

(No caso de D10, a citação adicional de Demattê et al. (2018) e Safanelli et al. (2021) não foi verificada nesta sessão.)

## E-D14 — páginas do Documentos 246

> EMENDA DE 06/10/2026: a ficha catalográfica do Documentos 246 (extração arquivada em `docs/verificacoes/fontes/doc246/saida_extracao_cnps_doc_246_2024.txt`, linha 77) registra "PDF (38 p.)"; onde este registro diz "40 p.", leia-se 38 p., a conferir contra a capa do PDF.

## E-D13 — Fator R: o que a leitura de Waltrick et al. (2015) mostrou

> EMENDA DE 06/10/2026 (proposta do assistente, aceita pelo pesquisador em conversa; resultado da leitura do PDF de Waltrick et al., 2015): (1) Waltrick et al. (2015) NÃO apresentam equações de erosividade próprias: usam as OITO equações regionais de correlação de Rufino, Biscaia e Merten (1993), R. Bras. Ci. Solo, 17:439-444, que relacionam o EI30 ao coeficiente de chuva Rc = p²/P (p = precipitação média mensal em mm; P = precipitação média anual em mm; adaptado de Lombardi Neto, 1977), e as revalidam com dados de 1986 a 2008 em três localidades (r maior ou igual a 0,92). Os COEFICIENTES das oito equações NÃO constam de Waltrick et al. (2015) e Rufino et al. (1993) NÃO foi obtido: a forma funcional e os coeficientes continuam NÃO CONFERIDOS, e o Fator R permanece pendente de verificação bibliográfica. (2) O EI30 pluviográfico de referência é EI = [28,814 + (10,800 + 7,896 log I30)] · P · I30 · 10⁻³ (Castro Filho et al., 1982), com I30 em mm/h e P em mm; unidade de R: MJ mm ha⁻¹ h⁻¹ ano⁻¹. (3) CHECAGEM EXTERNA disponível: o Quadro 1 de Waltrick et al. (2015) traz o R anual (1986-2008) de 114 localidades; para localidades do oeste do Paraná (a conferir quais pertencem à Bacia do Paraná 3) constam Céu Azul 12.121, Foz do Iguaçu 11.037, Santa Helena 11.261, Matelândia 11.531, Santa Izabel do Oeste 11.573 e Cascavel 11.588 MJ mm ha⁻¹ h⁻¹ ano⁻¹ (faixa estadual: 5.449 a 12.581). Quando o R climatológico por CHIRPS for calculado, será comparado a esses valores; a tolerância de aceitação deve ser fixada pelo pesquisador ANTES da comparação.

## E-D15 — Fator LS: o que a leitura de Renard et al. (1997) mostrou

> EMENDA DE 06/10/2026 (proposta do assistente, aceita pelo pesquisador em conversa; resultado da leitura das páginas 105 e 107 do PDF de Renard et al., 1997): CONFERIDAS na fonte primária: L = (λ / 72,6)^m, com λ em pés e a projeção horizontal [4-1]; m = β / (1 + β) [4-2]; β = (sen θ / 0,0896) / [3,0 (sen θ)^0,8 + 0,56] [4-3]; S = 10,8 sen θ + 0,03 para declividade menor que 9 % [4-4]; S = 16,8 sen θ − 0,50 para declividade maior ou igual a 9 % [4-5]. A conversão SI usa 72,6 ft = 22,13 m (72,6 × 0,3048 = 22,128; o Apêndice A, p. 325, usa 22,1 m). CORREÇÃO DE REDAÇÃO: o expoente m NÃO tem "patamares": é função contínua da declividade (0,311 em 3 %; 0,401 em 5 %; 0,501 em 9 %; 0,546 em 12 %; 0,614 em 20 %); o ponto de quebra de 9 % pertence ao fator S (descontinuidade de cerca de 0,8 % em S), e o domínio de 3 % a 20 % de D07 o atravessa. A equação [4-6] vale para encostas menores que 15 ft e não se aplica à célula de 30 m. NÃO CONFERIDA: a forma bidimensional de Desmet e Govers (1996) para o fator L (área de contribuição específica, fator de largura de contorno x = |sen α| + |cos α|): não há PDF da fonte no repositório e a extração arquivada em `docs/verificacoes/fontes/desmet1996/` foi feita sem o artigo; o Fator LS permanece pendente de verificação até o pesquisador arquivar o PDF de Desmet e Govers (1996).

---

## Resumo do que o executor faz com este arquivo

1. Aplica cada parágrafo acima nas decisões indicadas, exatamente como escrito, em um commit por decisão (`EMENDA D25`, `EMENDA D24`, `EMENDA D06+D16`, `EMENDA D02`, `EMENDA D09+D10`, `EMENDA D14`, `EMENDA D13`, `EMENDA D15`).
2. Não altera nenhum outro campo e não marca nada como "decidida".
3. Regenera `docs/planejamento/DECISOES.md` (bloco C13) e roda o teste de paridade.
4. Se o texto original de uma decisão tiver mudado e o parágrafo não fizer mais sentido, PARA e relata.
