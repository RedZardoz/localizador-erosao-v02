# Manual de Instalação e Configuração de Ambiente

### Plataforma de Triagem Espacial e Auditoria de Erosão Laminar (Paraná / Brasil)
**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)**  
**Linha de Pesquisa:** Sensoriamento Remoto, Inteligência Geoespacial e Conservação de Solos

---

## 1. Visão Geral e Pré-requisitos de Sistema

Este documento descreve o procedimento completo para instalação, compilação e execução da plataforma a partir da clonagem direta do repositório Git.

### 1.1. Requisitos de Software
| Componente | Versão Mínima | Versão Recomendada | Finalidade |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.17.0` | `v20.x` LTS ou `v22.x` | Ambiente de execução JavaScript/TypeScript |
| **npm** | `v9.x` | `v10.x` | Gerenciador de pacotes padrão |
| **Python** | `v3.10+` | `v3.11` a `v3.14` | Processamento geoespacial local e merge fundiário |
| **Git** | `v2.30+` | Mais recente | Controle de versão e clonagem do código |
| **Navegador Web** | Moderno com suporte a WebGL 2.0 | Google Chrome, Edge, Firefox ou Brave | Renderização do mapa 3D (MapLibre GL JS) |

### 1.2. Requisitos Mínimos de Hardware
- **Processador:** Dual-Core de 2.0 GHz ou superior (Intel Core i3/i5/i7, AMD Ryzen ou Apple Silicon).
- **Memória RAM:** Mínimo de 4 GB (8 GB recomendados para renderização 3D suave e manipulação de tiles no GEE).
- **Placa Gráfica (GPU):** Suporte a aceleração por hardware e WebGL 2.0 (placas integradas Intel UHD/Iris ou dedicadas NVIDIA/AMD).
- **Armazenamento:** 500 MB de espaço em disco para o código-fonte e dependências. Se desejar indexar as bases fundiárias completas (SICAR, SIGEF, SNCR), recomenda-se 5 GB de espaço livre em disco.
- **Conexão com a Internet:** Banda larga estável para consulta e streaming de imagens Sentinel-2, DEM Copernicus e APIs da NASA POWER e ISRIC SoilGrids.

---

## 2. Instalação Passo a Passo a Partir do Repositório

### Passo 1: Clonar o Repositório Git
Abra o terminal (PowerShell, Prompt de Comando ou Bash do Git no Windows; Terminal no Linux/macOS) e execute:

```bash
git clone https://github.com/SEU_USUARIO/localizador-erosao-parana.git
cd localizador-erosao-parana
```

*(Caso você já tenha recebido a pasta do projeto descompactada, abra o terminal diretamente dentro do diretório raiz).*

---

### Passo 2: Instalar as Dependências do Projeto (Node.js & Python)
No diretório raiz da aplicação, instale todas as dependências JavaScript listadas no `package.json`:

```bash
npm install
```

Em seguida, instale as dependências Python para o motor espacial e geração de apresentações:
```bash
pip install pyshp shapely python-pptx
```

> [!NOTE]
> O processo de instalação instalará o **Next.js 14**, **React 18**, **MapLibre GL**, **Zustand**, **Lucide React**, **jsPDF**, **TailwindCSS**, e as ferramentas de teste **Vitest**. No Python, instala as bibliotecas para leitura de Shapefiles (`pyshp`), geometria computacional (`shapely`) e geração de slides (`python-pptx`).

---

### Passo 3: Ingestão das Bases Fundiárias Oficiais (Opcional, mas Recomendado)
A plataforma possui um banco de dados local de alta velocidade (`data/fundiario_brasil.db`) indexado com SQLite R\*Tree. Caso você baixe os dados abertos oficiais dos órgãos governamentais:

1. **SICAR (Cadastro Ambiental Rural - SFB/MMA):**
   - Baixe os shapefiles estaduais (ex: PR, SC, SP) e coloque em `Dados SICAR/`.
   - Execute: `python scripts/ingest_sicar_official.py` (indexa mais de 1,46M de propriedades).
2. **SIGEF (Sistema de Gestão Fundiária - INCRA):**
   - Baixe os shapefiles de parcelas certificadas no Acervo Fundiário e coloque em `Dados INCRA/`.
   - Execute: `python scripts/ingest_sigef_official.py` (indexa mais de 501 mil parcelas certificadas com Matrícula CRI e ART).
3. **SNCR (Sistema Nacional de Cadastro Rural - INCRA / Receita Federal):**
   - Baixe os arquivos CSV de dados abertos e coloque em `Dados SNCR/`.
   - Execute: `python scripts/ingest_sncr_official.py` (indexa mais de 2,46M de titulares para o Database Merge).
4. **Auditoria de Cobertura e Integridade (Obrigatório após ingestão):**
   - Execute: `python scripts/verificar_cobertura.py`
   - O script confere as 27 UFs nas três camadas (SICAR, SIGEF, SNCR), a presença dos caches geométricos em disco (`data/sicar_cache/` e `data/sigef_cache/`) e valida que não existem registros órfãos ou desindexados no SQLite R*Tree. Retorna código de saída 0 se a base estiver íntegra.
5. **Conferência de Metadados Oficiais das Fontes:**
   - Execute: `python scripts/conferir_fontes.py`
   - Confere se as contagens registradas em `fontes_dados` batem exatamente com as linhas reais das tabelas no banco de dados. Retorna código 0 com divergências: 0.
6. **Gerar Apresentação em PowerPoint (PPTX):**
   - Execute: `python scripts/generate_presentation.py` para gerar o arquivo `Apresentacao_Localizador_Erosao_PPGTCA.pptx`.

---

### Passo 4: Configurar Variáveis de Ambiente (Opcional)
A plataforma foi projetada com arquitetura *zero-config*: ela funciona integralmente no modo padrão sem nenhuma chave de API obrigatória no arquivo `.env`.

Se você desejar definir tokens prévios para serviços externos, copie o modelo de exemplo:

```bash
# No Windows (PowerShell):
Copy-Item .env.example .env.local

# No Linux / macOS:
cp .env.example .env.local
```

Abra o arquivo `.env.local` e configure os campos conforme necessário:
```env
# Porta do servidor (opcional, padrão: 3000)
PORT=3000

# Token Mapbox para imagens de satélite Ultra-HD (opcional)
NEXT_PUBLIC_MAPBOX_TOKEN=seu_token_aqui

# Chave Google Maps para visualização de satélite auxiliar (opcional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

> [!IMPORTANT]
> **Credenciais do Google Earth Engine:** As credenciais da Service Account do Google Cloud (arquivo JSON) **NÃO** precisam ser colocadas no arquivo `.env`. Elas podem ser carregadas de forma segura e criptografada diretamente pela interface gráfica da aplicação (Menu *Configurações*), ficando protegidas por um cookie de sessão com flag `httpOnly`.

---

### Passo 5: Executar a Suíte de Testes Automatizados
Antes de iniciar o servidor, verifique a integridade de todos os módulos de cálculo e rotas executando a suíte de testes unitários:

```bash
npm test
```

O Vitest executará todos os 17 arquivos de teste (`119 testes unitários`). O resultado esperado é:
```
Test Files  17 passed (17)
     Tests  119 passed (119)
```

Para verificar a conformidade estrita de tipagem TypeScript:
```bash
npx tsc --noEmit
```

---

## 3. Modos de Execução da Aplicação

### Modo A: Execução em Desenvolvimento (Hot-Reload)
Ideal para realização de pesquisas, testes de novas fórmulas e customização de código:

```bash
npm run dev
```

Após a inicialização do Next.js, o sistema informará:
```
▲ Next.js 14.2.35
- Local:        http://localhost:3000
- Environments: .env.local
```
Abra o navegador e acesse: **`http://localhost:3000`** (ou `http://127.0.0.1:3000`).

> 🔒 **Segurança e Privacidade (LGPD):** A aplicação é configurada intencionalmente para vincular-se estritamente ao endereço de loopback (`127.0.0.1`), impedindo conexões externas advindas de outros dispositivos da rede local. Essa medida protege os dados cadastrais da base fundiária local (CAR/SICAR, SIGEF e SNCR) contra exposição indevida, em estrita observância à Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

---

### Modo B: Compilação e Execução de Produção (Alta Performance)
Para apresentações científicas, bancas de defesa e uso em campo, compile o projeto em modo otimizado de produção:

```bash
# 1. Gera os pacotes estáticos e dinâmicos compilados
npm run build

# 2. Inicia o servidor de produção otimizado
npm run start
```

O servidor de produção oferece carregamento instantâneo de páginas, menor consumo de memória e respostas ultrarrápidas das rotas de cálculo.

---

### Modo C: Inicialização com 1 Clique no Windows (Script Batch)
O repositório já inclui um script executável para usuários do Windows:

1. Dê um duplo-clique no arquivo **`Iniciar_Localizador_Erosao.bat`** presente na pasta raiz.
2. O script verifica automaticamente o Node.js, sobe o servidor local e abre o navegador padrão automaticamente em `http://localhost:3000`.

#### Instalar Atalho na Área de Trabalho do Windows:
Caso deseje criar um atalho na Área de Trabalho com o ícone oficial da pesquisa:
- Dê um duplo-clique no script: **`Instalar_Atalho_Windows.bat`**.
- Um atalho intitulado **"Localizador de Erosão Laminar"** será criado na sua Área de Trabalho.
- Para remover futuramente, basta executar **`Desinstalar_Atalho_Windows.bat`**.

---

## 4. Diagnóstico e Resolução de Problemas Comuns (Troubleshooting)

### Problema 1: Erro de Porta em Uso (`EADDRINUSE: port 3000`)
**Causa:** Outro processo ou uma instância anterior do Node.js está ocupando a porta 3000.  
**Solução:**
- *Opção 1 (Liberar a porta no Windows):*
  Abra o PowerShell como Administrador e execute:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
  ```
- *Opção 2 (Executar em outra porta):*
  ```bash
  npm run dev -- -p 3001
  ```

---

### Problema 2: O Navegador Exibe Versão Antiga de Funções ou do PDF
**Causa:** O navegador manteve em cache os bundles JavaScript anteriores, ou o servidor foi iniciado via `npm run start` sem que `npm run build` tivesse sido executado após uma modificação de código.  
**Solução:**
1. No navegador, force o recarregamento com limpeza de cache: **`Ctrl + F5`** (Windows/Linux) ou **`Cmd + Shift + R`** (macOS).
2. Se estiver executando em produção, recompile o projeto:
   ```bash
   npm run build
   npm run start
   ```

---

### Problema 3: O Mapa 3D Não Carrega ou Fica com Tela Preta
**Causa:** Aceleração de hardware desativada no navegador ou incompatibilidade com drivers de vídeo WebGL.  
**Solução:**
1. No Google Chrome / Edge, acesse: `chrome://settings/system`.
2. Certifique-se de que a opção **"Usar aceleração de hardware quando disponível"** está **ativada**.
3. Verifique se o WebGL 2.0 está ativo acessando `chrome://gpu`.

---

### Problema 4: Falha de Autenticação com o Google Earth Engine
**Causa:** O arquivo de credenciais da Service Account do Google Cloud expirou, foi revogado ou a API do Earth Engine não foi habilitada no projeto do Google Cloud.  
**Solução:**
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Verifique se a API **"Earth Engine API"** está com status **Enabled**.
3. Gere uma nova chave de Service Account em formato `.json` e carregue-a na aplicação através do menu **Configurações > Conexão Earth Engine**.
4. Consulte o documento [`GUIA_CONFIGURACAO_CREDENCIAIS.md`](./GUIA_CONFIGURACAO_CREDENCIAIS.md) para instruções detalhadas.
