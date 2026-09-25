# Roteiro Cronometrado de Gravação do Vídeo (~7 Minutos) — Simpósio Estudantil

**Arquivo PowerPoint (`.pptx`):** `docs/Apresentacao_Simposio_7min_SAREL.pptx` (e cópia na raiz `Apresentacao_Simposio_7min_SAREL.pptx`)  
**Estratégia de Conteúdo:** Apresentar o problema, a fundamentação territorial híbrida da Bacia do Paraná 3 e o motor científico de **seleção dos pontos de erosão laminar provável** (sem expor os detalhes internos da arquitetura preditiva dual ou configurações proprietárias do classificador).

---

## Guia Rápido dos 5 Espaços Reservados para Prints / Vídeo do App

Nos **Slides 3, 4, 5, 6 e 7**, a metade direita do slide ($6,68'' \times 5,45''$) possui uma moldura de janela estilizada (`SAREL v2.0 — ESPAÇO PARA TELA DO APP`). Basta tirar o print do navegador (`Win + Shift + S`) e dar **`Ctrl + V`** sobre o quadro:

| Slide | Tempo | Qual Tela do App Colar no Quadro Direito |
| :---: | :---: | :--- |
| **Slide 3** | `1:40 – 2:35` | **Tela #1 (Visão Geral 3D):** Tela principal do SAREL com o Mapa 3D (Google Earth + Relevo 3D ativado) e a barra lateral esquerda visível. |
| **Slide 4** | `2:35 – 3:35` | **Tela #2 (Bacia do Paraná 3 Híbrida):** Modal *"Gerenciar Áreas (AOI)"* na aba *Microbacias Hidrográficas* (mostrando o **Combo Híbrido BP3** e os **28 municípios**) ou o mapa exibindo o Divisor IAT (rosa), os 28 municípios (verde/tracejado) e o Corredor Foz–Céu Azul (âmbar). |
| **Slide 5** | `3:35 – 4:40` | **Tela #3 (Evidências Biofísicas do Ponto):** Aba *"Inspetor de Ponto"* (ou Popup do ponto no mapa) exibindo a declividade, o código oficial do imóvel no **SICAR/CAR**, o solo da **Embrapa** e o gráfico da série histórica **NDVI / BSI**. |
| **Slide 6** | `4:40 – 5:45` | **Tela #4 (Eleição Amostral no GEE):** Janela *"Eleição Amostral no Google Earth Engine (GEE)"* destacando a **Partição nas 3 Escalas (80% Bacia Toda / 20% Subamostra In-Loco no Corredor Foz–Céu Azul)** e os pontos candidatos sorteados no mapa. |
| **Slide 7** | `5:45 – 6:30` | **Tela #5 (Rastreabilidade e Sítios de Drone):** Mapa aproximado nos polígonos cianos dos **4 Sítios Padrão-Ouro de Voo de Drone (~50 ha em Medianeira e Céu Azul)** ou a janela de **Exportação da Planilha de Campo Cega / Selo de Proveniência**. |

---

## Roteiro de Fala Slide a Slide (Total: 7m00s)

> *(Observação: Este mesmo texto já está inserido dentro das **Notas do Apresentador** de cada slide no arquivo `.pptx`, caso você utilize o Modo de Exibição do Apresentador durante a gravação).*

### Slide 1 — Capa Institucional (`0:00 a 0:45` | 45 segundos)
> "Olá a todos. Meu nome é **Luis Alfredo da Silva**, sou mestrando do Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (**PPGTCA**) da **UTFPR — Campus Medianeira**.  
> Neste vídeo, vou apresentar os avanços da nossa pesquisa de mestrado: o desenvolvimento de um arcabouço computacional auditável — o sistema **SAREL** — voltado para a amostragem estratificada e localização automatizada de **focos prováveis de erosão hídrica laminar** na **Bacia Hidrográfica do Paraná 3**, integrando sensoriamento remoto orbital e bases territoriais oficiais."

### Slide 2 — Contextualização e o Desafio da Erosão Laminar (`0:45 a 1:40` | 55 segundos)
> "Por que investigar a erosão laminar na Bacia do Paraná 3? Embora o Oeste do Paraná seja referência em **Sistema Plantio Direto**, a combinação de relevo ondulado com eventos extremos de chuva gera escoamento superficial concentrado, como demonstrado por Dieckow e colaboradores (2009).  
> Diferente das voçorocas, a erosão laminar é **silenciosa**: ela remove seletivamente a camada mais fértil de argila e matéria orgânica sem abrir crateras visíveis de imediato, reduzindo a produtividade e levando sedimentos para o **Reservatório de Itaipu**.  
> Como os modelos tradicionais baseados em médias cartográficas não apontam qual propriedade ou rampa específica está erodindo, nós criamos o **SAREL** para filtrar 10 anos de dados de satélite e localizar, em escala de 10 metros, onde estão os **pontos de erosão provável**."

### Slide 3 — Visão Geral da Plataforma SAREL (`1:40 a 2:35` | 55 segundos) — *[Apontar para a Tela #1 do App]*
> "Aqui à direita vocês visualizam a interface principal do sistema **SAREL v2.0**.  
> Ele foi projetado como um ambiente WebGIS tridimensional que conecta quatro fontes de dados oficiais em tempo real:  
> 1. O **Google Earth Engine**, para processar séries temporais da constelação **Sentinel-2**;  
> 2. As malhas territoriais oficiais do **IBGE** e do **Instituto Água e Terra (IAT)**;  
> 3. Um banco de dados geoespacial com os perímetros de imóveis rurais do **SICAR/CAR e SIGEF**; e  
> 4. Os dados de erodibilidade pedológica da **Embrapa Solos**.  
> O objetivo dessa arquitetura é guiar o pesquisador desde a delimitação da área até a seleção dos pontos de erosão provável."

### Slide 4 — Recorte Espacial Híbrido da Bacia do Paraná 3 (`2:35 a 3:35` | 60 segundos) — *[Apontar para a Tela #2 do App]*
> "Um avanço importante do nosso trabalho foi estabelecer a delimitação cartográfica exata da **Bacia Hidrográfica do Paraná 3** em três camadas sobrepostas, como vocês veem na tela do aplicativo:  
> - A primeira é o **Divisor Hidrológico Oficial do IAT**, com cerca de **7.979 km²**, que abrange todas as microbacias que drenam diretamente para o Lago de Itaipu;  
> - A segunda camada traz os **limites legais oficiais do IBGE para os 28 municípios** que integram a região da bacia, de Guaíra e Cascavel até Foz do Iguaçu;  
> - E a terceira destaca o nosso **Corredor Experimental de 6 municípios — de Foz do Iguaçu a Céu Azul** — que sintetiza em 80 km todo o gradiente de altitude (de 180 a 750 metros) e de solos da bacia para as verificações presenciais."

### Slide 5 — Como Localizamos um Ponto de Erosão Provável? (`3:35 a 4:40` | 65 segundos) — *[Apontar para a Tela #3 do App]*
> "E como o SAREL identifica que um ponto tem alta probabilidade de erosão laminar? O satélite não enxerga a lâmina de solo perdida isoladamente, mas enxerga a **assinatura biofísica** que a erosão deixa ao longo dos anos.  
> Como mostrado no Inspetor de Ponto à direita, o sistema cruza três critérios físicos:  
> 1. **Energia do Relevo:** usando o modelo digital **Copernicus DEM de 30 metros** em projeção métrica UTM 22S, filtramos rampas agrícolas entre **3% e 20% de declividade**;  
> 2. **Exposição Recorrente de Solo Nu:** analisamos a série histórica do **Sentinel-2 (10 m)** através do índice de solo exposto (**BSI**) e da queda de cobertura vegetal (**NDVI / Fator C de Durigon et al., 2014**), detectando onde a enxurrada expõe o horizonte subsuperficial;  
> 3. **Susceptibilidade do Solo e Vínculo CAR:** cruzamos cada coordenada com a erodibilidade oficial da **Embrapa (Coelho et al., 2024)** e exigimos que o ponto pertença a um imóvel agrícola registrado no **SICAR**."

### Slide 6 — Eleição Amostral: 18 Estratos e Thinning Espacial (`4:40 a 5:45` | 65 segundos) — *[Apontar para a Tela #4 do App]*
> "Para eleger esses pontos candidatos sem viés estatístico, desenvolvemos este motor de **Eleição Amostral no Google Earth Engine**.  
> Primeiro, o algoritmo cruza 3 faixas de declividade, 3 faixas de frequência de solo exposto e 2 classes de erodibilidade, formando **18 estratos biofísicos ortogonais** — garantindo representantes tanto de focos críticos de erosão quanto de áreas conservadas de controle.  
> Segundo, aplicamos o **Thinning Geodésico de Haversine**: seguindo a Primeira Lei da Geografia de Tobler (1970), o sistema impõe uma distância mínima de **1 a 5 km** entre pontos, impedindo que duas amostras caiam coladas no mesmo talhão.  
> E terceiro, observe no painel da janela: ao sortear os pontos totais na Bacia do Paraná 3, o sistema já particiona automaticamente uma proporção — por padrão **20% dos candidatos** — dentro do **Corredor Foz do Iguaçu – Céu Azul** para a auditoria presencial *in-loco*."

### Slide 7 — Rastreabilidade Pericial e Próximas Etapas (`5:45 a 6:30` | 45 segundos) — *[Apontar para a Tela #5 do App]*
> "Toda essa infraestrutura é protegida por **270 testes automatizados** e uma trava estrita contra dados sintéticos: cada variável exibida no sistema possui selo de proveniência com a fonte oficial e a data exata de aquisição.  
> A partir dessa seleção de pontos de erosão provável, as próximas etapas da pesquisa compreendem a ida a campo sob **protocolo duplo-cego** no corredor Foz–Céu Azul e a calibração radiométrica fina com **VANT multiespectral (GSD de 3 a 7,5 cm e RTK/PPK)** sobre quatro sítios contínuos de referência em Medianeira e Céu Azul."

### Slide 8 — Considerações Finais e Agradecimentos (`6:30 a 7:00` | 30 segundos)
> "Em conclusão, o arcabouço SAREL entrega uma solução reprodutível e pericialmente auditável para triagem territorial na Bacia do Paraná 3, reduzindo drasticamente o custo de encontrar focos de erosão laminar no campo e apoiando o manejo conservacionista de precisão.  
> Agradeço ao **PPGTCA da UTFPR — Campus Medianeira**, ao meu orientador, e à **CAPES** pelo apoio à pesquisa. Muito obrigado pela atenção!"
