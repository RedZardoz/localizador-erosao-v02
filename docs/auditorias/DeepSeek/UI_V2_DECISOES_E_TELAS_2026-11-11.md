# UI v2 do SAREL — diagnóstico aplicado, decisões de design e telas

**Data:** 11 de novembro de 2026
**Commit de referência:** 264bf5c (análise da interface) + selo D16 de 10/11/2026
**Natureza:** proposta de interface e documento de decisão. Não altera o aplicativo, as decisões ou os parâmetros.
**Protótipo:** ui-v2-sarel.html, nesta mesma pasta.

---

## 1. O que este documento faz

A proposta anterior acertou o diagnóstico e a direção geral, mas continha erros de mockup e não fechava a conta entre o D16 realizado (67/34/33) e a avaliação ainda escrita para 72/36. Este documento:

1. mantém o que a proposta tinha de bom: pipeline enxuto, Configuração e Auditoria como centros, 67/34/33, selo público e LGPD;
2. corrige os defeitos de informação: pipeline de 6 etapas em vez de 5 comprimidas, D25 como etapa final, censo e estrato vazio explícitos, D24/D25/G-13 marcados como desatualizados;
3. aplica a linguagem visual do SAREL original: console escuro, azul-marinho, esmeralda, roxo e âmbar;
4. entrega um protótipo navegável de 5 telas, com legendas e estados de bloqueio.

**O que é real:** 67 polígonos, 34 treino, 33 held-out, 336,34 ha, semente 20261110, um censo (E_1_2_2) e um estrato vazio (E_1_3_2).
**O que é ilustrativo:** os demais números, mapas, pontos, kappa, poder e estados de campo.

---

## 2. O que foi aproveitado do SAREL original

| Elemento | Como aparece na UI v2 |
|---|---|
| Console escuro | Fundo azul-marinho quase preto, cards em ardósia, bordas frias. |
| Esmeralda como ação | Botões primários, etapas concluídas, “ok”, selo D16. |
| Roxo como função científica | Auditoria, censo, D25, perfis e estados “info”. |
| Âmbar como atenção | Falta de dado, pendência, censo sem reserva, recálculo. |
| Vermelho como bloqueio | D25 bloqueado, A-06, D11.2, estrato vazio. |
| Mapa como centro | O mapa é o canvas comum; os painéis são contexto. |
| Chips e status | Estado sempre visível, com frase curta e motivo. |
| Linguagem do projeto | D16, D25, D26, Ê, K̂, π_i, w_i, held-out, censo. |

Não usei o verde-claro e o papel do protótipo anterior. O SAREL original é um console científico escuro; a UI v2 preserva essa identidade.

---

## 3. O que foi corrigido da proposta anterior

| Problema da proposta | Correção na UI v2 |
|---|---|
| 5 etapas comprimindo medição, sorteio, campo e D25 | 6 etapas: Recorte, Triagem, Medição, Sorteio D16, Campo & Voos, Matriz/D25/Export. |
| D25 apenas como aba de auditoria | D25 é a etapa final da Análise, com poder, desfechos e bloqueio A-06. |
| “7 invariantes” com 5 itens na tela | A tela de governança fala em 5 gates e não mistura com os 7 invariantes da matriz. |
| “França-SP” no mapa | Nenhum topônimo inventado; o mapa é o recorte do acervo, com BP3 no contexto. |
| Pipeline com “Starpo”, “Autonição”, “Contundiva” | Pipeline com 6 rótulos estáveis e sem duplicação. |
| Alvo_Binario_25 no contrato 2.0.0 | A UI v2 não usa essa coluna; o alvo é D26. |
| 67/34/33 exibido sem consequência | A tela mostra 33 held-out, censo em E_1_2_2, vazio em E_1_3_2 e aviso de que D24/D25 ainda dizem 36/920. |
| Remover parâmetros antigos só da UI | O documento registra que a remoção precisa ocorrer também na rota e no store; a UI não esconde o default. |
| Top-N removido só da sidebar | O documento registra que o corte está em usePontosVisiveis/export; a UI não trata isso como resolvido. |
| InspetorPonto removido sem substituto | A UI v2 tem um formulário D26 próprio na tela de Campo; o Inspetor antigo não é necessário para o fluxo. |

---

## 4. Arquitetura de informação

### 4.1 Cinco workspaces

1. Projeto — visão geral, pipeline, fontes, gates e próxima ação.
2. Amostragem — D16, 67/34/33, censo, estrato vazio, filtros e tabela.
3. Campo — D26, parcela de 30 m, dupla observação, offline, voos e autorizações.
4. Análise — matriz, preditores, poder, D25 e pacote.
5. Governança — gates, registro, LGPD e auditoria.

Configuração e Auditoria não são botões concorrentes no topo: são funções transversais dentro de Governança, com abas e busca. O topo mantém apenas projeto/AOI, Tour, tema, ajuda e avatar.

### 4.2 Seis etapas do pipeline

| Etapa | Estado atual | O que a UI mostra |
|---:|---|---|
| 1. Recorte | concluído | BP3, 677 candidatos |
| 2. Triagem | concluído | 677 válidos |
| 3. Medição | concluído | 677 com Ê; 0 abaixo de 12 |
| 4. Sorteio D16 | concluído | 67; 34 treino; 33 held-out |
| 5. Campo & Voos | bloqueado | VANT não implementado; campo 0/33 |
| 6. Matriz, D25 & Export | bloqueado | matriz prévia; D25 bloqueado por A-06 e 33 clusters |

A separação é deliberada: cada etapa tem um estado próprio. Não se colapsa medição concluída com sorteio concluído, nem campo com voos.

---

## 5. As telas

### 5.1 Projeto

**Pergunta:** em que ponto o projeto está e o que eu faço agora?

- Pipeline de 6 etapas no topo.
- Mapa do D16 com 67 polígonos, treino/held-out/censo.
- Cartão “próxima ação”: revisar o D16, declarar censo/vazio e recalcular D25 para 33 clusters.
- Quatro indicadores: 67, 34/33, 677, 5 gates.
- Fontes: GEE, SQLite, Embrapa, Planet.
- “O que a UI não pode esconder”: D25/A-06, D11.2, 67/33 × 72/36.

**Decisão de design:** o usuário não precisa abrir cinco modais para saber o estado. A tela responde à pergunta em um relance.

### 5.2 Amostragem

**Pergunta:** o D16 está correto e o que ele deixou de fora?

- Mapa com 67 polígonos, cores por papel.
- Censo E_1_2_2 (N_h=3, 2 treino + 1 held-out, π=1, sem reserva).
- Estrato vazio E_1_3_2 (N_h=0).
- Tabela nominal × realizado: 33 held-out, não 36.
- Filtros de papel, estrato e cobertura; o filtro “≥12” aparece, mas o documento avisa que a guarda de produção ainda usa 6.

**Decisão de design:** a UI não arredonda 67 para 72. O número realizado é o número que a banca vê.

### 5.3 Campo

**Pergunta:** como a visita vira rótulo D26 sem default e sem vazamento?

- Lista de 33 held-out; papel oculto no coletor.
- Mapa da parcela de 30 m, buffer e ponto central.
- Formulário D26: fração 0–1, classe, confiança, observações.
- Validação dura: erosão + 0,00 é recusada; zero é observação.
- Dupla observação, kappa e discrepâncias.
- Voos e autorizações: VANT “não implementado”; autorização como CSV separado; pacote cego por papel.

**Decisão de design:** o formulário D26 é extraído do InspetorPonto; não se remove o único caminho de rótulo sem substituto.

### 5.4 Análise

**Pergunta:** o modelo supera a física em 33 clusters?

- Matriz 1.841; D16 67/34/33; D25 bloqueado; Modelo P não exportado.
- Preditores com estado: NDVI_Maximo_Mediano divergente, Curvatura/TWI indisponíveis, RUSLE_A ausente.
- Poder: 36/28/24 são a tabela antiga; 33 não está simulado.
- D25: cinco desfechos, A-06 pendente, IC por polígono.
- Pacote de reprodutibilidade.

**Decisão de design:** D25 é etapa final, não auditoria. O poder é mostrado como pendente de recálculo, não como número inventado.

### 5.5 Governança

**Pergunta:** o que está decidido, o que está aberto e o que a banca pode verificar?

- Gates G-01, G-08, G-12, G-13, G-15.
- G-01 marcado como “página antiga”: ainda descreve 4 estratos inviáveis de 30/09, enquanto o selo de 10/11 tem 67/34/33.
- G-13 marcado como “recalcular” para 33 clusters.
- Registro de decisões, LGPD (cofre × matriz) e auditoria (selo/hash/D25).
- Exportação bloqueada sem selo/D26/A-06.

**Decisão de design:** a UI não finge que o gate está fechado porque o selo existe. O gate e o selo são estados diferentes.

---

## 6. O que a UI não resolve

A UI v2 é honesta sobre os bloqueios, mas não os corrige:

1. D24/D25 ainda assumem 72/36/920. A UI mostra 67/33; a avaliação precisa de emenda formal e recálculo de poder para 33 clusters.
2. A-06 ainda não existe. O D25 aceita 2/4, não exige RUSLE_A e não tem hash. A tela bloqueia, o backend precisa falhar.
3. D11.2 ainda tem piso 6 no caminho de produção. O selo atual tem 677/677 ≥ 12, mas a guarda não está no chamador.
4. top-up, tamanhoAmostra=50, 0.15 e 20% continuam na rota. Remover da UI não remove o default.
5. Top-N continua no store/export. A sidebar não é o único lugar.
6. Modelo P não é exportado. A UI não pode prometer predição.
7. G-01 está defasado. A página precisa ser atualizada/arquivada antes de ser usada como decisão.

---

## 7. Plano de implementação

### Fase 0 — fechar a conta científica

- Emenda D16: 67/34/33, censo e vazio.
- Atualizar D24/D25/G-13 para 33 clusters e cerca de 843 unidades efetivas.
- Atualizar G-01 e G-13; decidir G-08/G-12/G-15.
- Implementar A-06 e D11.2 no backend.
- Corrigir top-up, 50, 0.15, Top-N e o formulário D26.

### Fase 1 — casca e design system

- Tokens de cor, tipografia, espaçamento e componentes.
- Shell com 5 workspaces e pipeline de 6 etapas.
- Rotas /projeto, /amostragem, /campo, /analise, /governanca.
- Testes de acessibilidade e de estado.

### Fase 2 — migrar por fluxo

1. Projeto + Amostragem (menor risco, maior confusão atual).
2. Campo (D26 + dupla + offline).
3. Análise/D25.
4. Governança/Configuração/Auditoria.

### Fase 3 — cortar o antigo

- Só remover Header de 9 ações, BarraFluxo de 8 cartões e modais antigos depois que os testes E2E dos 5 fluxos passarem.
- Manter Tour/Defesa como overlay, não como navegação principal.
- Manter vitrine separada.

**Esforço:** 4–6 semanas em tempo integral; 6–9 semanas em tempo parcial. A fase 0 é pré-requisito, não pode ser feita depois.

---

## 8. Como abrir o protótipo

O arquivo ui-v2-sarel.html é autossuficiente:

- Abra com dois cliques no navegador.
- Barra da esquerda: 5 workspaces.
- Números âmbar: legenda da tela; atalho L.
- Botões: simulam ações; Sortear/Executar D25 mostram o bloqueio.
- Dados: 67/34/33 e D16 reais; o restante é ilustrativo.
- Imagens: recortes do acervo do projeto; verificar licença antes de publicação.

---

## 9. Veredito

**Conceito:** 9/10. A arquitetura de 5 workspaces + 6 etapas + centros transversais resolve a confusão sem esconder o pipeline.

**Fidelidade ao SAREL:** 9/10. O console escuro, o esmeralda, o roxo e o âmbar são os do sistema original, não uma pele genérica.

**Prontidão para implementação:** 6/10. A UI está pronta como especificação de intenção; o backend e a conta D16/D25 ainda precisam ser fechados antes de a tela ser ligada ao sistema real.

**Recomendação:** usar esta UI v2 como destino visual e de informação; implementar a Fase 0 primeiro. A tela deve continuar mostrando 33 held-out e “D25 bloqueado” até que a emenda e a trava existam. Não transformar a honestidade da tela em promessa de resultado.

---

**Fim do documento.** Nenhum código do aplicativo, decisão ou parâmetro foi alterado.
