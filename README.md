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
   - Fatores físicos da RUSLE parametrizados pelas decisões metodológicas vigentes: Fator R por equação regional do Paraná (Rufino et al., 1993 / Waltrick, 2010; D13) sobre CHIRPS climatológico; Fator K por erodibilidade oficial da Embrapa Solos (Doc. 246/2024; D14); Fator LS bidimensional de Desmet & Govers (1996) com m e S da RUSLE (Renard et al., 1997; D15) sobre MDE Copernicus GLO-30 a 30 m (D21); e cálculo da perda de solo A = R·K·LS·C·P estritamente vinculado ao Invariante 1.
5. **Ingestão e Matriz de Treino (`src/lib/rotulos/`, `src/lib/matriz/`):**
   - Concordância entre intérpretes via Kappa de Cohen com alerta bloqueante para $\kappa < 0{,}60$.
   - Segregação mandatória de voos de drone como conjunto de teste independente (*held-out*).
   - Invariantes verificados em tempo de execução com bloqueio de exportação caso violados (Invariantes 1 a 7: Coerência RUSLE, Lista de Permissão, Campos Estimados, Rastreabilidade de Satélite, Negativa Fundiária, Literais Proibidos e Variância Física / Constante Disfarçada).

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

### Sítios de Aferição (Dado Local)

- **O que é:** O arquivo `data/sitios_referencia_local.json` (e seu hash de integridade `data/sitios_referencia_local.json.sha256`) armazena os códigos cadastrais e as geometrias vetoriais reais dos 4 sítios contínuos de aferição com drone (10 a 50 ha) em Céu Azul e Medianeira (Bacia Paraná 3).
- **Por que não está no Git:** Os códigos CAR e perímetros cadastrais identificam proprietários e imóveis rurais privados reais, sujeitos à proteção de dados pessoais pela LGPD (Lei nº 13.709/2018). Por decisão metodológica do projeto (DEC-10, Opção C), esses dados confidenciais permanecem estritamente fora do controle de versão Git.
- **Como chega:** É empacotado de forma restrita no arquivo ZIP do Google Drive (`Banco_Consolidado_SAREL_GoogleDrive.zip`) e extraído automaticamente na pasta `data/` pelo Instalador ou manualmente por pesquisadores autorizados.
- **Operação sem o arquivo local:** O sistema funciona perfeitamente sem o arquivo local: os sítios de referência são apresentados na interface com identificadores opacos (`CAR-OPACO-0n`), metadados técnicos preservados e aviso informativo no painel, omitindo a projeção vetorial no mapa sem falhas ou erros de execução.

---

### Opção 2: Instalação via Git / Ambiente de Desenvolvimento

#### Pré-requisitos
- **Node.js:** $\ge 18.17.0$ e `npm`
- **Python:** $\ge 3.10$
- **Dependências Python:** instaladas via `pip install -r requirements.txt`
- **Base Fundiária Local (`data/fundiario_brasil.db`):** Banco de dados SQLite local (~1,67 GB, não versionado no Git). O arquivo deve ser posicionado em `data/fundiario_brasil.db`. Caso o banco não esteja presente, o sistema opera de forma segura e degradada, emitindo estritamente o status `"base-nao-disponivel"` nas consultas fundiárias — garantindo pelas Regras 1 e 2 e pelo Invariante 5 que falha de infraestrutura jamais seja colapsada em `"sem-correspondencia"`.

#### Instalação
```bash
npm install
pip install -r requirements.txt
```

#### Scripts em Lote do Windows (`.bat` na raiz)
A raiz do repositório disponibiliza scripts para inicialização e manutenção rápida no Windows:
- **`Iniciar_Localizador_Erosao.bat`:** Inicializador principal do sistema. Executa diagnóstico de ambiente (Node.js, Python e presença de `data/fundiario_brasil.db`), inicia o servidor Next.js em `127.0.0.1:3000` e abre o navegador automaticamente quando o serviço estiver pronto.
- **`Instalar_Atalho_Windows.bat`:** Cria atalhos oficiais do SAREL na Área de Trabalho e no Menu Iniciar do Windows via PowerShell.
- **`Desinstalar_Atalho_Windows.bat`:** Remove os atalhos instalados no sistema.
- **`Gerar_Pacote_Portatil.bat`:** Empacota a distribuição portátil (`dist\SAREL_Instalador_Portatil`) com runtimes embutidos e compila o `Instalador_SAREL.exe`.
- **`Gerar_Zip_Banco_GoogleDrive.bat`:** Compacta `data\fundiario_brasil.db` e os caches do SICAR em arquivo ZIP para sincronização com o Google Drive oficial.

#### Papel do Diretório `scripts/`
O diretório `scripts/` organiza utilitários científicos e de infraestrutura do projeto:
- **Ingestão e casamento fundiário:** Scripts Python (`ingest_sicar_official.py`, `ingest_sigef_official.py`, `ingest_sncr_official.py`, `spatial_owner_matcher.py`, `query_real_properties.py`) que consolidam dados públicos fundiários no SQLite local `data/fundiario_brasil.db`.
- **Geradores de relatórios e documentação:** Scripts que compilam manuais, apresentações e o espelho de decisões (`gerar_manual_pdf.py`, `gerar_compendio_metodologico_pdf.py`, `gerar_apresentacao_pdf.py`, `gerar_relatorio_mudancas_pdf.py`, `gerar_decisoes_md.mjs`).
- **Modelagem externa (XGBoost):** Rotinas de calibração e treinamento externo fora do fluxo web (`treinar_xgboost_loco.py`, subdiretório `scripts/d25/` para inferência sob o critério pré-registrado D25).
- **Verificação e integridade:** Scripts de auditoria hermética (`scripts/verificacao/` e `verificar_integridade_pacote.py`).

#### Disciplina dos "Três Verdes"
O projeto adota verificação contínua automatizada:
```bash
# 1. Suíte de testes unitários e de integração hermética (Vitest)
npm run test

# 1.1 Testes vivos com dependência de dados locais (SQLite fundiário e Copernicus DEM GLO-30)
# Exige data/fundiario_brasil.db e tiles em data/dem_cache/:
npm run test:vivo

# Para regenerar artefatos de voo em docs/verificacoes/voo_ncontrol/:
# (por padrão os testes apenas comparam os hashes sem sobrescrever arquivos existentes)
# SAREL_REGERAR_VOO=1 npm run test

# 2. Verificação estrita de tipagem TypeScript
npx tsc --noEmit

# 3. Linter sem advertências
npm run lint

# 4. Compilação de produção
npm run build
```

#### Executar a Aplicação
Dê duplo clique em **`Iniciar_Localizador_Erosao.bat`** (ou execute `npm run dev` no terminal) e acesse `http://127.0.0.1:3000`.

---

## Preservação Histórica

O código legado original pré-reconstrução encontra-se congelado na tag Git local `legado-pre-sarel` (commit `5d33d188bbc830e7f95984d708de424c99a5e03d`). As pastas de quarentena intermediárias (`legado/localizador/` e `legado/sarel1/`) foram 100% resolvidas e removidas no commit `67d8750a1d6eab0a35d047e189d09771e6625525`, permanecendo acessíveis no commit imediatamente anterior `a8431620d6ba05769b05747418fd23d576dab74f`. O diretório `legado/` atual no disco preserva artefatos de rascunho em `legado/pre_sarel/`, documentação em `legado/documentacao_pre_v2/` e versões históricas em `legado/versoes_anteriores/`.
A documentação metodológica, relatórios de auditoria e históricos de planejamento estão organizados no diretório `docs/`.
