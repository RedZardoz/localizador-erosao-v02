# Guia de Configuração de Credenciais & Chaves de API

Este guia fornece instruções detalhadas para que qualquer pesquisador, estudante ou desenvolvedor possa configurar e utilizar a plataforma **Localizador de Erosão 2D/3D (Paraná & Brasil)** em seu próprio ambiente, com ou sem credenciais próprias de computação em nuvem.

---

## 🟢 1. Modo Padrão (Sem Nenhuma Credencial Obrigatória)

A plataforma foi desenvolvida para ser **100% utilizável imediatamente logo após a instalação**, sem a necessidade obrigatória de criar contas ou fornecer chaves de API:

- **150 Focos de Erosão do Paraná**: Já embutidos no sistema com dados de declividade, BSI, RUSLE e pedologia.
- **Camadas de Satélite de Alta Resolução**: Esri World Imagery integrada nativamente.
- **Relevo 3D Real (DEM)**: Modelo Digital de Elevação global (Terrarium AWS) ativo sem custos ou tokens.
- **Exportação Geoespacial**: Geração instantânea de GeoJSON, KML 3D e CSV.
- **Ingestão Vetorial Própria**: Suporte completo para arrastar seus próprios arquivos `.geojson`, `.kml`, `.kmz` e `.csv`.

---

## 🛰️ 2. Google Earth Engine (GEE) - Service Account (Opcional)

A integração com o **Google Earth Engine (GEE)** permite processamento em tempo real de imagens de satélite multiespectrais (Sentinel-2 MSI e Landsat-8/9) e cálculo dinâmico de novos índices (BSI, NDVI, MNDWI).

### Como Obter a Chave da Service Account no Google Cloud:

1. **Acessar o Google Cloud Console**:
   - Acesse [https://console.cloud.google.com/](https://console.cloud.google.com/) e faça login com sua conta Google.
2. **Criar ou Selecionar um Projeto**:
   - Crie um novo projeto (ex: `pesquisa-erosao-2026`).
3. **Habilitar a API do Google Earth Engine**:
   - No menu lateral, acesse **APIs e Serviços** > **Biblioteca**.
   - Pesquise por `Earth Engine API` e clique em **Ativar**.
   - Certifique-se de que sua conta/projeto tenha acesso habilitado no [Earth Engine](https://earthengine.google.com/signup/).
4. **Criar a Service Account (Conta de Serviço)**:
   - Acesse **IAM e Administração** > **Contas de Serviço**.
   - Clique em **+ Criar Conta de Serviço**.
   - Defina um nome (ex: `gee-erosion-processor`).
   - Conceda o papel/função: `Visualizador do Earth Engine` ou `Usuário do Earth Engine`.
5. **Gerar a Chave Privada em JSON**:
   - Clique na conta de serviço recém-criada > aba **Chaves**.
   - Clique em **Adicionar Chave** > **Criar Nova Chave** > selecione o tipo **JSON**.
   - O download do arquivo `credentials.json` será realizado no seu computador.

### Como Inserir na Aplicação:

Existem **duas formas** de utilizar essa chave:

#### Opção A: Pela Interface Web (Mais Fácil)
1. Abra a aplicação no navegador (`http://localhost:3000`).
2. Clique no botão de engrenagem **Configurações** (no cabeçalho superior).
3. Na aba **GEE Service Account**, arraste o arquivo `credentials.json` baixado.
4. Clique em **Testar Autenticação GEE** para validar a conexão.
5. Escolha se deseja manter a credencial salva no navegador (*Persistir Localmente*) ou apenas durante a navegação atual (*Apenas na Sessão*).

#### Opção B: Via Variáveis de Ambiente (`.env.local`)
1. Crie uma cópia do arquivo `.env.example` nomeada como `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Abra o `.env.local` e preencha os campos correspondentes aos dados do seu JSON:
   ```env
   GEE_PROJECT_ID="seu-project-id"
   GEE_CLIENT_EMAIL="sua-service-account@seu-project.iam.gserviceaccount.com"
   GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...-----END PRIVATE KEY-----\n"
   ```

---

## 🗺️ 3. Mapbox Access Token (Opcional)

Permite habilitar basemaps adicionais de ultra-alta resolução e estilos cartográficos customizados da Mapbox.

### Como Obter:
1. Cadastre-se gratuitamente em [https://account.mapbox.com/](https://account.mapbox.com/).
2. No painel principal (*Tokens*), copie seu **Default public token** (começa com `pk.eyJ1...`).

### Como Inserir:
- **Pela Interface Web**: No modal de **Configurações** > aba **Tokens de Mapas**, cole o token no campo *Mapbox Access Token* e clique em *Testar*.
- **Ou pelo `.env.local`**:
  ```env
  NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1..."
  ```

---

## 🌐 4. Google Maps API Key (Opcional)

Permite geocodificação reversa de endereços e integração direta com o Google Street View nos focos de erosão.

### Como Obter:
1. No [Google Cloud Console](https://console.cloud.google.com/), acesse **APIs e Serviços** > **Biblioteca**.
2. Ative a **Maps JavaScript API** e a **Geocoding API**.
3. Em **Credenciais**, clique em **Criar Credenciais** > **Chave de API**.
4. Copie a chave gerada (formato `AIzaSy...`).

### Como Inserir:
- **Pela Interface Web**: No modal de **Configurações** > aba **Tokens de Mapas**, cole a chave no campo *Google Maps JavaScript API Key* e clique em *Testar*.
- **Ou pelo `.env.local`**:
  ```env
  NEXT_PUBLIC_GOOGLE_MAPS_KEY="AIzaSy..."
  ```

---

## 🗺️ 5. CARTO Basemaps API Key (Opcional)

Permite remover a marca d'água (*"API key required"*) das camadas de mapa base raster da CARTO (**CARTO Dark GIS** e **CARTO Voyager**). A cota gratuita cobre até 5 milhões de requisições de tiles por mês.

### Como Obter:
1. Acesse o formulário oficial em [https://carto.com/basemaps/apikey](https://carto.com/basemaps/apikey).
2. Preencha seus dados de pesquisador ou desenvolvedor.
3. Você receberá por e-mail sua chave de API (formato com prefixo `cb1_...`).

### Como Inserir:
- **Pela Interface Web**: No modal de **Configurações** (ícone de engrenagem) > aba **Tokens de Mapas**, cole a chave no campo *CARTO Basemaps API Key* e clique em *Testar*.
- **Ou pelo `.env.local`**:
  ```env
  NEXT_PUBLIC_CARTO_API_KEY="cb1_..."
  ```

---

## 🔒 6. Segurança & Boas Práticas (Prevenção de Vazamento de Dados)

> [!IMPORTANT]
> **Nunca comite chaves privadas ou tokens no repositório Git público:**
> - O arquivo `.gitignore` do projeto já está configurado para ignorar automaticamente `.env`, `.env.local`, `*.key`, `*.pem` e qualquer arquivo `*credentials*.json`.
> - Se você criar o arquivo `.env.local` para testes no seu computador, certifique-se de que ele permaneça ignorado pelo Git (`git status` não deve listá-lo).
> - Se for hospedar a aplicação (ex: Vercel, Render ou AWS), cadastre as variáveis de ambiente diretamente no painel seguro de *Environment Variables* da plataforma de hospedagem.
