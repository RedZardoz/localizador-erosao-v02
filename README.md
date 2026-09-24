# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar

**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)**  
*Pesquisa de Mestrado: Validação de Método de Localização e Predição de Erosão Laminar no Paraná*

---

## Visão Geral

O **SAREL** é um sistema computacional concebido para garantir o rigor científico, a reprodutibilidade metodológica e a integridade de dados na geração de matrizes de treino e campanhas de validação de erosão laminar.

O sistema opera sob as **9 Regras Invioláveis da Lei Fundamental** (`docs/planejamento/PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md`), garantindo que:
- **Nada calculado vira rótulo:** O rótulo de erosão provém exclusivamente de observadores humanos e sensores primários (campo, fotointerpretação PlanetScope, ortomosaicos de drone).
- **Sem valores fabricados ou defaults disfarçados:** Parâmetros ausentes permanecem como `indisponivel` acompanhados da causa real.
- **Rastreabilidade e proveniência científica total:** Cada variável do sistema possui selo de proveniência (`● medido`, `◊ modelado`, `□ tabelado`, `○ indisponível`).
- **Segregação cega e proteção LGPD:** Dados fundiários mascarados byte a byte e exportações cegas por perfil operacional (`planilha`, `interpretacao-cega`, `campo-cego`, `voo-cego`, `matriz-treino`).

---

## Arquitetura e Módulos Principais

1. **Amostragem e Blocos Espaciais (`src/lib/gee/`):**
   - Estratificação multivariada em 18 estratos $\hat{S} \times \hat{E} \times \hat{K}$ com garantia de candidatos à classe negativa.
   - *Spatial Thinning* geodésico determinístico (Fisher-Yates) com raio mínimo de 1,0 km (P02).
   - Validação cruzada espacial com blocos espaciais determinados por variograma empírico sem cortes artificiais.
2. **Sensoriamento e Harmonização:**
   - Decomposição harmônica multivariada (OLS de 1 e 2 harmônicos) com métricas de qualidade de ajuste ($R^2$, erro-padrão).
   - Frequência de solo exposto ($\hat{E}$), maior sequência temporal de solo nu e mês modal de exposição.
   - Modelagem de pares de eventos ($T_-$, $T_0$, $T_+$) PlanetScope e radar Sentinel-1 GRD banda C para datas chuvosas sob nuvem.
3. **Controle de Cotas PlanetScope (`src/lib/planet/quota.ts`):**
   - Livro-razão persistente em disco (`livroRazao.json`) com segregação de cotas de download e tiles, e política estrita de recusa a sobretaxa (`OVERAGE: OFF`).
4. **Linha de Base RUSLE (`src/lib/rusle/`):**
   - Fator C regional tropical por **Durigon et al. (2014)**: $C = (1 - \text{NDVI}) / 2$, com análise de sensibilidade por **van der Knijff et al. (2000)**.
   - Fator P tabelado ($1{,}0$) por **Renard et al. (1997)**.
   - Guardas ativas para decisões metodológicas pendentes (D13 para Fator R, D14 para Fator K, D15 para Fator LS), com perda de solo estritamente vinculada ao Invariante 1.
5. **Ingestão e Matriz de Treino (`src/lib/rotulos/`, `src/lib/matriz/`):**
   - Concordância entre intérpretes via Kappa de Cohen com alerta bloqueante para $\kappa < 0{,}60$.
   - Segregação mandatória de voos de drone como conjunto de teste independente (*held-out*).
   - Invariantes 1 a 7 verificados em tempo de execução antes de qualquer exportação de arquivo.

---

## Instalação, Distribuição Autônoma e Execução

O **SAREL** oferece duas formas de instalação: **Instalador Executável Autônomo (`.exe` para usuários sem GitHub)** e **Instalação via Repositório Git (para desenvolvedores/pesquisadores)**.

### Opção 1: Instalador Executável Autônomo (`Instalador_SAREL.exe` — Sem necessidade de GitHub)
Para instalar o sistema em máquinas de pesquisadores, avaliadores ou técnicos que não acessam o GitHub:
1. Envie apenas o arquivo único **[`Instalador_SAREL.exe`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/Instalador_SAREL.exe)** (`~2,0 MB`, que já contém todo o código-fonte do SAREL embutido).
2. Ao executar o `Instalador_SAREL.exe` e clicar em **"1. Instalar Sistema e Criar Atalhos"**:
   - O sistema é extraído automaticamente para `C:\SAREL` (ou diretório escolhido);
   - Os motores **Node.js** e **Python** e suas bibliotecas (`npm` / `pip`) são verificados e instalados automaticamente caso não existam na máquina;
   - Os atalhos oficiais são criados na **Área de Trabalho** e no **Menu Iniciar** com o ícone oficial (`assets/icon.ico`).
3. **Bancos de Dados Complementares (Google Drive Oficial):**
   - Diretório oficial recomendado: **[Acessar Repositório no Google Drive](https://drive.google.com/drive/folders/1S6UsUYGM3dUh7w_hLrmvcsuh0nSfjyYR?usp=sharing)** (`Dados INCRA`, `Dados SICAR`, `Dados SIGEF`, `Dados SNCR` e `fundiario_brasil.db`).
   - Na **Seção 2** do `Instalador_SAREL.exe`, o usuário pode clicar em **"2. Baixar Banco Automaticamente do Google Drive para a pasta `data\`"** (download direto com barra de progresso e descompactação automática) ou em **"Abrir Google Drive"** para acessar a pasta oficial no navegador.
4. **Utilitários de Empacotamento (para o mantenedor):**
   - `Gerar_Pacote_Portatil.bat`: Gera a distribuição `dist\SAREL_Instalador_Portatil` com runtimes `runtime\node` e `runtime\python` embutidos e recompila o `Instalador_SAREL.exe`.
   - `Gerar_Zip_Banco_GoogleDrive.bat`: Compacta o banco SQLite consolidado (`data\fundiario_brasil.db`, com 4,4 milhões de registros SICAR/SIGEF/SNCR para PR, SC e SP) junto às geometrias `.shp/.shx/.prj` de `data\sicar_cache\` em `dist\Banco_Consolidado_SAREL_GoogleDrive.zip`.

---

### Opção 2: Instalação via Git / Ambiente de Desenvolvimento

#### Pré-requisitos
- Node.js $\ge 18.17.0$ e `npm`
- Python $\ge 3.10$ (`pip install -r requirements.txt`)

#### Instalação
```bash
npm install
pip install -r requirements.txt
```

#### Disciplina dos "Três Verdes"
O projeto adota verificação contínua automatizada:
```bash
# 1. Suíte de testes unitários e de integração (Vitest)
npm run test

# 2. Verificação estrita de tipagem TypeScript
npm run typecheck

# 3. Linter sem advertências
npm run lint

# 4. Compilação de produção
npm run build
```

#### Executar a Aplicação
Dê duplo clique em **`Iniciar_Localizador_Erosao.bat`** (ou execute `npm run dev` no terminal) e acesse `http://127.0.0.1:3000`.

---

## Preservação Histórica

O código legado original do Localizador e protótipos prévios encontram-se permanentemente arquivados e congelados na tag Git:
```bash
git checkout legado-pre-sarel
```
A documentação metodológica, relatórios de auditoria e históricos de planejamento estão organizados no diretório `docs/`.
