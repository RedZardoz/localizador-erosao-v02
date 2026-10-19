# Roteiro de fala: SAREL como selecionador amostral (sua versão enxuta, 14 slides, cerca de 15 min)

Arquivo de apoio: `Apresentacao_SAREL_Plataforma_Metodo_Desafios_Versao_enxuta_selecao_amostral.pptx`, na ordem em que você a enviou. O texto é para ser dito em voz alta, em primeira pessoa. Os números vêm do registro de decisões e das verificações do projeto; o que ainda não foi medido está dito como tal. Não há resultados empíricos, e o roteiro não os afirma.

| Slide | Tema | Tempo |
|---|---|---|
| 1 e 2 | Abertura e desafio | 2 min |
| 3 e 4 | Como foi construído e a tela do SAREL | 2 min |
| 5 e 6 | Sequência justificada | 3 min |
| 7 | Estratificação | 1,5 min |
| 8 e 9 | Dificuldades: imóvel e voos | 3 min |
| 10 a 12 | Rótulo, campo e Coletor | 3 min |
| 13 | Estado atual | 1 min |
| 14 | Referências (consulta) | fora do tempo |

## Slide 1: Título (cerca de 1 min)

Bom dia. Vou apresentar o SAREL, o Sistema de Amostragem e Rotulagem para Erosão Laminar, na sua versão 2. Esta não é uma apresentação de resultados, porque ainda não existem. É a apresentação do arcabouço: como desenhar a amostragem e o teste para que cada número seja rastreável e para que o critério de sucesso seja fixado antes dos dados. Vou mostrar como o aplicativo funciona, em que ordem as etapas acontecem e por quê, e quais dificuldades reais apareceram para obter e coordenar as amostras.

## Slide 2: O desafio (cerca de 1 min)

Três restrições moldam tudo. A primeira é o fenômeno: a erosão laminar é uma mancha contínua na vertente, não uma ocorrência pontual. É sutil e de difícil localização, e por isso um ponto de campo a representa mal. A segunda é o rótulo: só vale observação humana sobre imagem de alta resolução, aqui a de drone, com cerca de 4 centímetros. O que é calculado, como um índice espectral, nunca vira rótulo. A terceira é o acesso: cada polígono voado exige a autorização do proprietário, em imóveis pequenos, com mediana de 11,7 hectares na bacia, de acordo com o levantamento de 29 de setembro sobre 73.643 imóveis rurais. Então a pergunta do trabalho é: como obter uma amostra defensável sob essas restrições e registrar cada passo de forma auditável.

## Slide 3: Linguagens e tecnologias (cerca de 1 min)

Antes de mostrar o aplicativo, uma palavra sobre como ele foi construído, para quem perguntar. A interface e as regras do método estão em TypeScript, com Next.js e React: cerca de 36 mil linhas em 138 arquivos, mais 85 arquivos de teste automatizado, o que sustenta a ideia de arcabouço auditável, porque as regras são testadas. O Python cuida dos dados geoespaciais: a ingestão das bases fundiárias, SICAR, SIGEF e SNCR, para um banco SQLite local, a chuva do CHIRPS, o relevo Copernicus, o verificador do pacote exportado e a geração de relatórios. O aplicativo de campo, o SAREL Coletor, é um app Android em Kotlin, que funciona offline; o código dele não está neste repositório. Há ainda um instalador do Windows em C#, lançadores em PowerShell e Batch, e o Google Earth Engine para o Sentinel-2. O sistema roda localmente no Windows, e a rede só é necessária para o Earth Engine. As contagens de linhas incluem comentários.

*Transição:* "Vamos ver agora o aplicativo em funcionamento."

## Slide 4: O SAREL em uma tela (cerca de 1 min)

Esta é a tela inicial, na versão atual. No topo estão os módulos na ordem de uso: Amostragem no Google Earth Engine, Campanha e Rótulos, Matriz de Treino, Exportar, e ainda Configurações e Governança. À esquerda, as áreas de amostragem e os filtros; no mapa, a legenda deixa explícito que os índices BSI e NDVI geram apenas candidatos espectrais, nunca rótulos. Em resumo, o aplicativo elege candidatos à amostra com imagens de satélite, planeja e integra a campanha de voo e de campo, monta a matriz de treino com a origem de cada valor, e exporta um pacote que uma banca consegue verificar.

## Slide 5: Sequência justificada, parte 1 (cerca de 1,5 min)

Este é o núcleo da justificativa da ordem: cada linha diz o que se faz e por que vem naquele ponto. Primeiro, o domínio: só se amostra onde o método vale, com declividade de 3 a 20%, em lavoura e pastagem. Sem domínio não existe candidato válido, então ele vem antes de tudo. Segundo, eleger candidatos no Earth Engine, com filtros de solo nu, declividade e espaçamento mínimo de 1 quilômetro; isso produz o universo de onde se sorteia. Terceiro, a estratificação em 18 estratos, que explico já no slide 7. Quarto, a checagem do pool: contar candidatos por estrato antes de selar. Esse é o ponto crítico, porque o sorteio é irreversível, e só se sela com um pool que comporte quatro titulares e reservas. Quinto, o sorteio selado, de 72 polígonos, com a probabilidade de inclusão registrada. Ele vem antes do contato com os proprietários para que ninguém escolha os locais por conveniência nem por suspeita de erosão.

## Slide 6: Sequência justificada, parte 2 (cerca de 1,5 min)

A segunda metade. Sexto, a autorização dos proprietários: só depois do selo se sabe quem contatar, e a recusa não pode refazer o sorteio. Por isso a recusa precisa de um protocolo, que no momento é uma proposta: reservas em ordem. Esse protocolo ainda está por decidir. Sétimo, o voo e a delineação são cegos: o intérprete não vê o estrato nem o papel do polígono, e o rótulo é uma fração. Oitavo, o campo é âncora, não treino: 60 a 80 pontos fora dos polígonos, para estimar prevalência e acurácia posicional. Nono, a matriz com proveniência: sete invariantes bloqueiam a exportação se forem violados, e cada valor declara sua origem. Décimo, a avaliação é única e vem por último: o critério foi fixado antes dos dados e o conjunto de teste é usado uma só vez. O sorteio selado e a avaliação única são os dois pontos sem volta.

## Slide 7: Estratificação (cerca de 1,5 min)

Estratificar é dividir os candidatos em grupos parecidos e amostrar cada grupo, para que as combinações raras também entrem. Uso três dimensões. Declividade, em três faixas: é a energia do relevo. Solo nu, em três faixas: é o tempo em que o solo fica descoberto e exposto à chuva. Erodibilidade, em dois níveis, pela carta da Embrapa de 2024: o nível 1 reúne as classes de muito baixa a média, e o nível 2, de alta para cima. A classe extremamente alta entra por uma emenda que aprovei em 19 de outubro e que está em registro. As faixas de declividade e de solo nu são tercis calculados sobre os próprios candidatos, e empates no corte caem no grupo mais baixo, então os grupos podem diferir um pouco em tamanho. Três vezes três vezes dois dão 18 estratos; em cada um, quatro polígonos, dois de treino e dois de teste, o chamado held-out: 72 polígonos. A série temporal entra no solo nu: é a fração de cenas Sentinel-2 válidas, de 2016 a 2026, em que a célula aparece exposta, com um mínimo de seis observações válidas. Essa frequência ainda não foi medida, porque falta a credencial do Earth Engine.

## Slide 8: Dificuldade, o polígono precisa caber em um imóvel (cerca de 1,5 min)

Para voar é preciso autorização, e para pedir autorização o polígono tem de caber dentro de um só imóvel. Dos 73.643 imóveis rurais do envelope da bacia, um quadrado de 10 hectares cabia em apenas 43,4%; reduzindo para 5,02 hectares, sobe a 64,7%, e a 71,8% se admitirmos um retângulo de razão até 1 para 2. São limites superiores, porque o teste usa a caixa envolvente do imóvel. O custo foi dobrar as autorizações, de 36 para 72. E fica um viés que declaro: a amostra tende a cair em imóveis maiores, que podem ter outro manejo.

## Slide 9: Dificuldade, quantos voos e quanto tempo (cerca de 1,5 min)

A aeronave é o Spectral 2, da Nuvem UAV, com a câmera multiespectral MicaSense Altum, e tenho três baterias. São 72 polígonos de 5,02 hectares, ou seja, 72 missões de mapeamento, uma por polígono; eram 36. Por que 72: são 18 estratos vezes 4 polígonos. A área total, de cerca de 361 hectares, é o que o custo de voo suporta, e rende cerca de 1.845 unidades espacialmente independentes. O plano para 4 centímetros usa 92,8 metros de altitude, cerca de 7 linhas e 123 disparos por polígono, com velocidade medida de 8,7 a 9,2 metros por segundo; dá cerca de 3 minutos de mapeamento por polígono, mais as curvas. São pelo menos 3,6 horas de mapeamento nos 72 polígonos, sem contar decolagem, pouso, troca de bateria e deslocamento, que dominam a campanha. Com seis polígonos por jornada são cerca de 12 jornadas e dois polígonos por bateria, o que é compatível com as duas missões já voadas, de 9 a 13 minutos; a autonomia útil de cada bateria ainda precisa ser confirmada. E a produtividade medida nas duas missões foi bem diferente, 2,3 e 0,53 hectares por minuto, então o tempo real pode passar do planejado. Há ainda as 72 autorizações a obter.

## Slide 10: Voo cego, delineação e rótulo por fração (cerca de 1 min)

O rótulo não é uma classe, e sim a fração de cada célula de 10 metros que foi delineada como erodida, de 0 a 1, obtida por rasterização da delineação feita sobre o ortomosaico. O binário, a partir de 25%, é derivado e secundário. O intérprete recebe só um código opaco, sem estrato nem papel, e a exportação é cega por perfil. Os polígonos são sorteados pelos estratos biofísicos, nunca pelo rastreio espectral, o que evita a circularidade de voar onde o rastreio aponta erosão. Os planos de voo só saem com terreno real; os de demonstração são marcados como sintéticos e não voáveis.

## Slide 11: Âncora de campo (cerca de 1 min)

O campo deixou de ser massa de treino e virou âncora: de 60 a 80 pontos dispersos pela bacia, fora dos polígonos, sorteados com probabilidade de inclusão conhecida. A função é estimar a prevalência real, com um estimador ponderado, e calibrar a acurácia posicional do aparelho; não é para treinar o modelo. São duas ondas, e os 30 primeiros pontos são um lote piloto, para validar o protocolo e medir a acurácia do aparelho. O instrumento é o SAREL Coletor, em Android, no lugar do KoboCollect. A fotointerpretação foi aposentada, porque o rótulo centimétrico do voo é mais fiel à mancha contínua da erosão.

## Slide 12: SAREL Coletor, o que se registra (cerca de 1 min)

O Coletor é um aplicativo Android que funciona offline; cada ponto vira uma linha de um CSV de 28 colunas, que o SAREL lê e valida. São seis grupos. Um, identificação e protocolo: um código opaco, o observador, data e hora, e a coleta cega, sem estrato nem predição. Dois, a posição GNSS: latitude, longitude, altitude, a acurácia do aparelho e a distância ao ponto planejado; a posição simulada é rejeitada, e o método pode ser média estática ou fix único. Três, o rótulo: uma escala de quatro níveis, ausente, incipiente, moderada e severa, com a confiança do observador; o binário é derivado, com ausente igual a zero e o resto igual a um. Quatro, o diagnóstico de erosão laminar: pedestais e raízes expostas, exposição do horizonte B, espessura do horizonte A, crosta e selamento, microssulcos iniciais e sedimentação no sopé. Cinco, manejo e conservação: sistema de manejo, cobertura vegetal, sentido de plantio e terraço, que alimentam o fator P do RUSLE, com coeficientes ainda provisórios. Seis, as evidências: foto nadir, foto panorâmica e observações.

## Slide 13: Estado atual, limites e próximos passos (cerca de 1 min)

Honestidade sobre o estágio. Pronto: a plataforma com os módulos do fluxo e a recusa de dado sintético; o desenho amostral e o critério de avaliação pré-registrados; a ferramenta de checagem do pool por estrato; e o pacote de reprodutibilidade com verificador de integridade. Pendente: nenhum resultado empírico ainda; medir o pool real por estrato e decidir reservas e número mínimo; decisões minhas antes do sorteio, como solo nu, declividade e empates dos tercis; as autorizações, os voos e a delineação; e o acerto de atribuição de posição, antes citado como cerca de 78%, que segue em verificação. O sorteio ainda não foi realizado. Obrigado.

## Slide 14: Referências (consulta, sem fala)

Se pedirem, diga que as marcadas com † tiveram a fonte conferida no projeto (Coelho et al. 2024, Rufino et al. 1993, Waltrick, Desmet e Govers 1996, Renard et al. 1997) e que as demais constam do registro e aguardam conferência completa antes da dissertação.

## Perguntas prováveis e respostas honestas

**Por que 72 polígonos?** É a estrutura de 18 estratos com 4 polígonos, dois de treino e dois de teste em cada um, porque com um só por estrato haveria estratos sem treino e outros sem teste. A área total, cerca de 361 hectares, é o que o custo de voo suporta e rende cerca de 1.845 unidades espacialmente independentes. O número foi definido pela estrutura e pelo custo; a necessidade de dados foi conferida depois.

**O que é held-out? É a reserva?** Não. Held-out são os polígonos de teste, retidos e avaliados uma única vez no final. A reserva é outra coisa, ainda proposta: candidatos extras, ordenados no mesmo estrato, que só entram se um proprietário recusar o acesso, herdando o papel de quem saiu.

**O pool de candidatos comporta o desenho?** Na medição de 30/09 (677 candidatos válidos na pedologia), 84 estão no nível 2 de erodibilidade, contra 36 necessários. Mas a frequência de solo nu não foi medida, então não sei se cada estrato comporta 4 titulares. Só o tercil de menor declividade tem 9 candidatos no nível 2.

**E se o proprietário recusar?** O sorteio selado é irreversível, para que ninguém escolha o sorteio que favoreça o resultado. O protocolo de recusa e de reservas é proposta; número de reservas, mínimo por estrato e taxa de recusa esperada são decisões minhas pendentes.

**Por que a classe extremamente alta entra no nível 2?** O critério numérico do projeto, K a partir de 0,0300, já a abrange, e a fonte, o Documentos 246 da Embrapa, não a exclui do uso agrícola. Considerei excluí-la por risco de sulcos e voçorocas contaminarem o rótulo e rejeitei: a faixa de declividade de 3 a 20% já retira o relevo onde esses processos dominam. A emenda está aprovada e em registro.

**Os tercis têm o mesmo tamanho?** Aproximadamente. O corte é calculado sobre os candidatos da própria área, e empates caem no grupo mais baixo. A regra definitiva para empates é decisão minha ainda pendente.

**Qual a tolerância de posição dos pontos de campo?** O critério decidido (P03) tem três partes: erro acima de 30 metros em relação ao ponto planejado rejeita; acurácia GNSS até 5 metros aceita, de 5 a 10 metros aceita com marcação, acima de 10 metros rejeita; e o ponto deve permanecer no mesmo estrato. A ingestão do SAREL ainda usa um limiar antigo, a alinhar depois da apresentação.

**Quantos voos e quanto tempo?** 72 missões de mapeamento, cerca de 12 jornadas de até 6 polígonos; cerca de 3 minutos por polígono mais curvas, pelo menos 3,6 horas no total, com 3 baterias; autonomia útil por confirmar.

**Já tem resultado?** Não. O que apresento é o método, a plataforma e o que foi medido sobre a viabilidade da amostragem.

**Em que linguagens foi feito?** Principalmente TypeScript (cerca de 36 mil linhas, com 85 arquivos de teste), Python (dados fundiários, chuva, relevo; cerca de 17 mil linhas), Kotlin no aplicativo Android, C# no instalador, PowerShell e Batch nos lançadores, SQLite e Google Earth Engine.

**Como garantir que o pacote não foi alterado?** O manifesto traz SHA-256 de cada arquivo e há verificador. Prova integridade, não autoria.

## Não afirmar (porque não está verificado)

- Que o número de baterias ou de decolagens por jornada está fechado: a autonomia útil por bateria não está registrada.
- Que o 78% de acerto de atribuição de posição está confirmado: está em verificação. O CE90 de 1,47 m vem de uma das duas missões medidas, e a outra registra 7,04 m no mesmo campo.
- Que o pool por estrato é suficiente: só o pool total foi contado, e o solo nu não foi medido.
- Que a emenda da classe extremamente alta já está gravada no sistema: está aprovada, mas só será gravada quando o executor concluir a fase correspondente.
- Que o sorteio foi feito: nenhum selo foi criado.
- Que a erosão laminar causa "prejuízo agrícola considerável" (frase que você acrescentou ao slide 2): não consta do material de decisões deste projeto; se for dita, cite uma fonte sua.
- Que o aplicativo Android atual já implementa a média estática e as métricas de satélites: não foi verificado; o slide 12 só cita "média estática ou fix único".
- Qualquer detalhe sobre a comparação de algoritmos: esta versão não os apresenta.

## Números para ter à mão

- 18 estratos: 3 × 3 × 2. 72 polígonos de 5,02 hectares, cerca de 361 hectares, cerca de 1.845 unidades independentes. 36 de treino e 36 de teste.
- 11,7 hectares: mediana dos imóveis. 73.643 imóveis no envelope. 43,4%, 64,7% e 71,8% de elegibilidade (limites superiores). 72 autorizações (eram 36).
- Voo: 92,8 m, cerca de 7 linhas, 123 disparos, 8,7 a 9,2 m/s, cerca de 3 min por polígono, pelo menos 3,6 h no total, cerca de 12 jornadas, 3 baterias.
- Campo: 60 a 80 pontos, duas ondas, lote piloto de 30. Coletor: CSV de 28 colunas.
- 30/09: 677 candidatos, 84 no nível 2, 36 necessários.
- Código: cerca de 36 mil linhas TypeScript em 138 arquivos, 85 arquivos de teste, cerca de 17 mil linhas Python em 46 scripts.
