# SAREL — Relatório Oficial de Auditoria de Integridade Científica e Conformidade com a Lei Fundamental

**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA 2026)**  
**Projeto:** Sistema de Amostragem e Rotulagem para Predição de Erosão Laminar (SAREL 1)  
**Data da Auditoria:** 10 de Setembro de 2026  
**Status:** Auditado e Corrigido com Estrita Observância à Lei Fundamental  

---

## 1. Princípio Reitor da Auditoria

> *"Quando houver conflito entre entregar um número e dizer a verdade, diz-se a verdade. Dado verdadeiro ou ausência declarada."* (Regra Inviolável nº 7)

A presente auditoria teve como escopo verificar a fidedignidade de todas as ligações de API, funções analíticas e aderência estrita às 8 Regras Invioláveis da Lei Fundamental e aos 7 Invariantes de Exportação da Matriz de Dados.

---

## 2. Diagnóstico da Conexão com o Google Earth Engine (GEE)

### Pergunta de Auditoria:
*O aplicativo está calculando os pontos amostrais por chamadas reais à API do Google Earth Engine?*

### Veredito Técnico:
**NÃO. O aplicativo NÃO está realizando chamadas reais ao Google Earth Engine.**

### Evidências Concretas:
1. **Ausência de Bibliotecas Especializadas:** O arquivo `package.json` não lista `@google/earthengine` nem bibliotecas de autenticação Google Cloud (ex: `google-auth-library`).
2. **Ausência de Requisições HTTP:** Não há chamadas de rede para o endpoint `earthengine.googleapis.com` em nenhum trecho do código-fonte.
3. **Rotas de Backend Inexistentes:** As rotas planejadas (`/api/gee/amostragem`, `/api/gee/serie`, `/api/auth/session`) não estão criadas no diretório `src/app/api/`.
4. **Comportamento do Upload de Credenciais:** No componente `SettingsModal.tsx`, o upload do arquivo JSON de Service Account apenas lê o texto no navegador via `FileReader` para preencher os campos `project_id` e `client_email` no estado Zustand. Nenhum token OAuth2 é gerado e nenhuma validação de credencial é realizada contra os servidores do Google.
5. **Mecanismo Real de Geração de Pontos:** Ao selecionar uma Área de Interesse (AOI), os pontos são gerados localmente no navegador por funções em `src/lib/dados/pontosExemplo.ts` (`gerarAmostragemParaAoi` e `gerarPontosDemonstrativos`), utilizando um gerador congruencial linear pseudoaleatório (`LCG: (seed * 16807) % 2147483647`).
6. **Classificação dos Dados Atuais:** Os pontos gerados no cliente são identificados com `origemSintetica: true`, prefixo `SINT-` e identificadores `SYNTHETIC-...`. Trata-se de uma simulação matemática local estruturada em 18 estratos, porém **sem sensoriamento remoto real do Sentinel-2 ou SRTM**.

---

## 3. Matriz de Não-Conformidades e Vulnerabilidades Identificadas

| ID | Categoria | Gravidade | Arquivo(s) Afetado(s) | Descrição do Desvio |
|---|---|---|---|---|
| **NC-01** | Fabricação de Dados | **Crítica** | `src/lib/fundiario/cadastre_service.py:155-178` | Em caso de ausência da tabela `sncr_imoveis`, o bloco `except` fabricava registros com `time.time()`, denominava `Gleba Rural {municipio}` e simulava um titular `J*** S*** (Protegido LGPD)`. Violação frontal da Regra 1 (*Zero fabricação*). |
| **NC-02** | Brecha Antissintética | **Crítica** | `src/components/modais/ExportModal.tsx:63`<br>`src/lib/export/geoConversao.ts:56` | A função `exportarGeoJson()` convertia e baixava pontos sintéticos sem acionar `assegurarApenasPontosReais(pontos)`, permitindo o vazamento de pontos simulados em arquivo GeoJSON. |
| **NC-03** | Segurança de Rede | **Alta** | `src/app/api/fundiario/consulta/route.ts` | A rota de consulta cadastral fundiária não executava `assegurarRequisicaoLocal(request)`, permitindo consultas originadas fora de `localhost`. |
| **NC-04** | Casamento Espacial | **Média** | `src/lib/fundiario/cadastre_service.py:277` | Na rotina de fallback de polígonos aproximados, o código referenciava `id_cand` (variável remanescente de loop anterior) em vez de `candidatos[0]`. |
| **NC-05** | Alinhamento Visual | **Baixa** | `src/components/relatorios/RelatorioQualidade.tsx:142-147` | Rótulos visuais dos Invariantes 1, 4 e 5 estavam invertidos em relação à implementação canônica em `src/lib/matriz/invariantes.ts`. |
| **NC-06** | Inspeção Temporal | **Baixa** | `src/components/inspetor/InspetorPonto.tsx:240` | O componente `<GraficoSerieTemporal />` era chamado sem parâmetros descritivos do ponto inspecionado. |
| **NC-07** | Linting de Hooks | **Baixa** | `src/components/mapa/MapaAmostral.tsx:320` | Efeito de inicialização única do mapa MapLibre sem anotação explícita de dependências vazias (`react-hooks/exhaustive-deps`). |

---

## 4. Auditoria de Funções e Módulos em Conformidade

Apesar da necessidade de implementação do backend GEE real, os seguintes módulos foram auditados e aprovados com louvor científico:

1. **Estratificação Hipercubo Latino / 18 Classes (`src/lib/gee/estratificacao.ts`):**
   - Respeita rigorosamente a partição de 18 estratos combinatórios (3 classes de declividade × 3 classes de exposição solar × 2 classes de solo).
   - Não utiliza dados cadastrais nem scores diagnósticos como features.
2. **Equações Físicas RUSLE (`src/lib/rusle/fatores.ts`):**
   - Fator R calculado via métodos de precipitação consagrados (Oliveira et al., 2013; Lombardi Neto, 1977).
   - Fator LS com formulação de Desmet & Govers (1996) e McCool et al. (1987).
   - Invariante 1 rigorosamente aplicado: `perdaSolo` só existe se todos os 5 fatores e a memória de cálculo existirem.
3. **Climatologia de Precipitação (`src/lib/chuva/chirps.ts` e `imerg.ts`):**
   - Agregação móvel de 30 e 90 dias, cálculo de $I_{30}$ e contagem honesta de eventos erosivos (> 25 mm).
4. **Concordância e Rótulos (`src/lib/rotulos/concordancia.ts`):**
   - Métricas de confiabilidade inter-observador: Kappa de Cohen, Fleiss' Kappa e Índice de Vulnerabilidade de Superfície (IVS ponderado).
5. **7 Invariantes de Exportação da Matriz (`src/lib/matriz/invariantes.ts`):**
   - Bloqueio imediato da exportação em caso de constantes disfarçadas (Invariante 7), literais geográficos genéricos proibidos (Invariante 6) ou estados fundiários inválidos (Invariante 5).
6. **Bases Vetoriais Fundiárias do Paraná:**
   - O arquivo `src/lib/fundiario/cadastre_service.py` lê com extrema velocidade e exatidão geométrica os polígonos reais do shapefile oficial do SICAR/MMA para o Estado do Paraná via índice espacial R-Tree em SQLite.

---

## 5. Medidas de Correção Imediata Aplicadas

1. **Eliminação de Mocks no SNCR:** O serviço Python agora retorna estritamente `None` para registros de titularidade quando a tabela do SNCR não estiver carregada, com declaração explícita de ausência de dado público.
2. **Correção do Ponteiro de Candidatos Fundiários:** Utilização estrita do identificador indexado `cand_id = candidatos[0]`.
3. **Blindagem Dupla de Exportação GeoJSON:** Bloqueio mandatário através de `assegurarApenasPontosReais()` tanto no utilitário de conversão quanto no modal de download.
4. **Enforcement de Rede Local:** A rota `/api/fundiario/consulta` passa a invocar `assegurarRequisicaoLocal()`, rejeitando conexões externas com status 403.
5. **Harmonização do Relatório de Qualidade:** Correção de todos os títulos dos invariantes de exportação.

---

## 6. Roteiro para Ativação do GEE Real

Para que a extração de dados espectrais e topográficos passe a operar contra o Google Earth Engine em ambiente de produção:
1. Instalar `@google/earthengine` ou configurar worker Python com `earthengine-api`.
2. Implementar a rota de API `/api/gee/amostragem` para receber a geometria GeoJSON do AOI e autenticar a Service Account via chave privada efêmera em memória.
3. Executar o pipeline de amostragem diretamente sobre a coleção `COPERNICUS/S2_SR_HARMONIZED` e o DEM `COPERNICUS/DEM/GLO30`.
