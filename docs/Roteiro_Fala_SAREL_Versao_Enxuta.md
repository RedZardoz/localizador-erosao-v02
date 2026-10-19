# Roteiro de fala: SAREL como selecionador amostral (versão enxuta, 12 slides, cerca de 13 min)

Arquivo de apoio: `Apresentacao_SAREL_Plataforma_Metodo_Desafios_Versao_enxuta_selecao_amostral.pptx`. O texto está escrito para ser dito em voz alta. Os números vêm do registro de decisões e das verificações do projeto; o que ainda não foi medido está dito como tal.

| Slide | Tema | Tempo |
|---|---|---|
| 1 a 3 | Abertura, desafio e a tela | 3 min |
| 4 a 6 | Sequência justificada e estratos | 4,5 min |
| 7 e 8 | Dificuldades: imóvel e voos | 3 min |
| 9 a 11 | Rótulo, campo e estado atual | 3 min |
| 12 | Referências (consulta) | fora do tempo |

## Slide 1: Título (cerca de 1 min)

Bom dia. Vou apresentar o SAREL, uma plataforma que escolhe, de forma auditável, onde amostrar erosão laminar. Não vou falar de resultados, porque ainda não existem. Vou mostrar como o aplicativo funciona, em que ordem as etapas acontecem e por que essa ordem, e quais dificuldades reais apareceram para obter e coordenar as amostras.

## Slide 2: O desafio (cerca de 1 min)

Três restrições moldam tudo. Primeira: a erosão laminar é uma mancha contínua na vertente, não uma ocorrência pontual. Um ponto de campo representa mal esse fenômeno. Segunda: o rótulo só vale se vier de observação humana sobre imagem de alta resolução. O que é calculado, como um índice espectral, nunca vira rótulo. Terceira: o acesso depende de proprietários de áreas pequenas. A mediana dos imóveis rurais da bacia é de 11,7 hectares. A pergunta do trabalho é: como obter uma amostra defensável sob essas restrições e registrar cada passo de forma que alguém possa auditar.

## Slide 3: O SAREL em uma tela (cerca de 1 min)

Esta é a tela inicial. No topo, os módulos na ordem de uso: Amostragem no Google Earth Engine, Campanha e Rótulos, Matriz de Treino, Exportar, e ainda Configurações e Governança. À esquerda, as áreas de amostragem. No mapa, a legenda deixa explícito que os índices BSI e NDVI geram apenas candidatos espectrais, nunca rótulos. O aplicativo elege candidatos, planeja a campanha, monta a matriz com a origem de cada valor e exporta um pacote que uma banca consegue verificar.

## Slide 4: Sequência justificada, parte 1 (cerca de 1,5 min)

Este é o núcleo da justificativa da ordem. Cada linha diz o que se faz e por que vem naquele ponto. Primeiro, o domínio: só se amostra onde o método vale, declividade de 3 a 20%, lavoura ou pastagem. Sem domínio não existe candidato válido. Segundo, a eleição de candidatos no Earth Engine, com espaçamento mínimo entre eles. Terceiro, a estratificação em 18 estratos, que explico já no slide 6. Quarto, a checagem do pool: contar candidatos por estrato antes de selar, porque o sorteio é irreversível e só se sela com pool que comporte quatro titulares. Quinto, o sorteio selado, com probabilidade de inclusão registrada. Ele vem antes do contato com os proprietários, para que o local não seja escolhido por conveniência nem por suspeita de erosão.

## Slide 5: Sequência justificada, parte 2 (cerca de 1,5 min)

A segunda metade. Sexto, a autorização dos proprietários: só depois do selo se sabe quem contatar. A recusa precisa de um protocolo que não refaça o sorteio. Esse protocolo ainda está por definir. Sétimo, o voo e a delineação são cegos: o intérprete não vê o estrato nem o papel do polígono. Oitavo, o campo é âncora de prevalência, não massa de treino. Nono, a matriz com proveniência: sete invariantes bloqueiam a exportação se forem violados, e cada valor declara sua origem. Décimo, a avaliação é única e vem por último, com o critério fixado antes dos dados.

## Slide 6: Como se chega aos 18 estratos (cerca de 1,5 min)

Estratificar é dividir os candidatos em grupos parecidos e amostrar cada grupo, para que as combinações raras também entrem. Usamos três dimensões. Declividade, em três faixas: é a energia do relevo. Solo nu, em três faixas: é o tempo em que o solo fica descoberto e exposto à chuva. Erodibilidade, em dois níveis, pela carta da Embrapa de 2024: o nível 1 reúne as classes de muito baixa a média, e o nível 2, de alta para cima. A classe extremamente alta entra por uma emenda que aprovei em 19 de outubro e que está em registro. As faixas de declividade e de solo nu são tercis calculados sobre os próprios candidatos, e empates no corte caem no grupo mais baixo, então os grupos podem diferir um pouco em tamanho. Três vezes três vezes dois dão 18 estratos, e em cada um quatro polígonos: dois de treino e dois de teste. A série temporal entra no solo nu: é a fração de cenas Sentinel-2 válidas, de 2016 a 2026, em que a célula aparece exposta, com um mínimo de seis observações válidas. Essa frequência ainda não foi medida, porque falta a credencial do Earth Engine.

## Slide 7: Dificuldade, o polígono precisa caber em um imóvel (cerca de 1,5 min)

Para voar é preciso autorização, e para pedir autorização o polígono tem de caber dentro de um só imóvel. Sobre os 73.643 imóveis rurais do envelope da bacia, um quadrado de 10 hectares cabia em apenas 43,4%. Reduzindo para 5,02 hectares, sobe a 64,7%, e a 71,8% se admitirmos um retângulo de razão até 1 para 2. São limites superiores, porque o teste usa a caixa envolvente do imóvel. O custo foi dobrar as autorizações, de 36 para 72. E fica um viés que declaro: a amostra tende a cair em imóveis maiores, que podem ter outro manejo.

## Slide 8: Dificuldade, quantos voos e quanto tempo (cerca de 1,5 min)

A aeronave é o Spectral 2, da Nuvem UAV, com a câmera multiespectral MicaSense Altum, e temos três baterias. São 72 polígonos de 5,02 hectares, ou seja, 72 missões de mapeamento, uma por polígono. Por que 72: são 18 estratos vezes 4 polígonos. A área total, de cerca de 361 hectares, é o que o custo de voo suporta. O plano para 4 centímetros de resolução usa 92,8 metros de altitude, cerca de 7 linhas e 123 disparos por polígono, o que dá cerca de 3 minutos de mapeamento, mais as curvas. São pelo menos 3,6 horas de mapeamento nos 72 polígonos, sem contar decolagem, pouso, troca de bateria e deslocamento, que dominam a campanha. Com seis polígonos por jornada são cerca de 12 jornadas, e dois polígonos por bateria. Isso é compatível com as duas missões já voadas, de 9 a 13 minutos, mas a autonomia útil de cada bateria ainda precisa ser confirmada. E as duas missões medidas tiveram produtividades bem diferentes, 2,3 e 0,53 hectares por minuto, então o tempo real pode passar do planejado.

## Slide 9: Voo cego, delineação e rótulo por fração (cerca de 1 min)

O rótulo não é uma classe, e sim a fração de cada célula de 10 metros que foi delineada como erodida, de 0 a 1, obtida por rasterização da delineação feita sobre o ortomosaico. O binário, fração a partir de 25%, é derivado e secundário. O intérprete recebe só um código opaco, sem estrato nem papel. Isso impede a circularidade de voar onde o rastreio espectral aponta erosão. Planos de voo só saem com terreno real; os de demonstração são marcados como sintéticos.

## Slide 10: Âncora de campo (cerca de 1 min)

O campo deixou de ser massa de treino e virou âncora: 60 a 80 pontos dispersos pela bacia, fora dos polígonos, sorteados com probabilidade conhecida e coletados no aplicativo SAREL Coletor, em Android, sob protocolo cego. A função é estimar a prevalência real, com um estimador ponderado, e calibrar a acurácia posicional do aparelho. São duas ondas, e os 30 primeiros pontos são um lote piloto. A fotointerpretação foi aposentada porque o rótulo centimétrico do voo é mais fiel ao fenômeno.

## Slide 11: Estado atual, limites e próximos passos (cerca de 1 min)

Honestidade sobre o estágio. Pronto: a plataforma com os módulos do fluxo e a recusa de dado sintético, o desenho amostral e o critério de avaliação pré-registrados, a ferramenta de checagem do pool, e o pacote de reprodutibilidade. Pendente: nenhum resultado empírico ainda; medir o pool real por estrato e decidir reservas e número mínimo; decisões minhas antes do sorteio, como solo nu, declividade e empates dos tercis; as autorizações, os voos e a delineação; e o acerto de atribuição de posição, antes citado como cerca de 78%, que segue em verificação. O sorteio ainda não foi realizado. Obrigado.

## Slide 12: Referências (consulta, sem fala)

Se pedirem, diga que as marcadas com † tiveram a fonte conferida no projeto (Coelho et al. 2024, Rufino et al. 1993, Waltrick, Desmet e Govers 1996, Renard et al. 1997) e que as demais constam do registro e aguardam conferência completa antes da dissertação.

## Perguntas prováveis e respostas honestas

**Por que 72 polígonos?** É a estrutura de 18 estratos com 4 polígonos, dois de treino e dois de teste em cada um, porque com um só por estrato haveria estratos sem treino e outros sem teste. A área total, cerca de 361 hectares, é o que o custo de voo suporta e rende cerca de 1.845 unidades espacialmente independentes, no limite para o que o algoritmo pediria. O número foi definido pela estrutura e pelo custo, e a necessidade de dados foi conferida depois.

**O pool de candidatos comporta o desenho?** Na medição de 30/09 (677 candidatos válidos na pedologia), 84 estão no nível 2 de erodibilidade, contra 36 necessários. Mas a frequência de solo nu não foi medida, então não sei se cada um dos nove estratos do nível 2 tem quatro titulares. Só o tercil de menor declividade tem 9 candidatos no nível 2, e os 18 estratos ainda dependem da medição ao vivo.

**E se o proprietário recusar?** O sorteio selado é irreversível por desenho, para que ninguém escolha o sorteio que favoreça o resultado. O protocolo de recusa e de reservas ainda está por definir, e o número de reservas, o mínimo por estrato e a taxa de recusa esperada são decisões minhas pendentes.

**Por que a classe extremamente alta entra no nível 2?** Porque o critério numérico do projeto, K a partir de 0,0300, já a abrange, e a fonte, o Documentos 246 da Embrapa, não a exclui do uso agrícola. Considerei excluí-la por risco de sulcos e voçorocas contaminarem o rótulo, e rejeitei: a faixa de declividade de 3 a 20% já retira o relevo onde esses processos dominam. Quando se aplica essa classe, o K do ponto pode ficar indisponível se a camada não trouxer valor pontual; não se usa o ponto médio da faixa.

**Os tercis têm o mesmo tamanho?** Aproximadamente. O corte é calculado sobre os candidatos da própria área, e empates caem no grupo mais baixo. A regra definitiva para empates é uma decisão minha ainda pendente.

**Já tem resultado?** Não. O que apresento é o método, a plataforma e o que foi medido sobre a viabilidade da amostragem.

**Quantos voos e quanto tempo?** 72 missões de mapeamento, cerca de 12 jornadas se forem seis polígonos por dia. O plano dá cerca de 3 minutos por polígono, mais as curvas. A produtividade real medida varia, e a autonomia útil de cada uma das 3 baterias ainda precisa ser confirmada.

## Não afirmar (porque não está verificado)

- Que o número de baterias ou de decolagens por jornada está fechado: a autonomia útil por bateria não está registrada.
- Que o 78% de acerto de atribuição de posição já está confirmado: está em verificação. O CE90 de 1,47 m vem de uma das duas missões medidas, e a outra registra 7,04 m no mesmo campo; a origem desses valores não está esclarecida.
- Que o pool por estrato é suficiente: só o pool total foi contado, e a frequência de solo nu não foi medida.
- Que a emenda da classe extremamente alta já está no sistema: está aprovada, mas só será gravada quando o executor concluir a fase correspondente.
- Que o sorteio foi feito: nenhum selo de sorteio foi criado.
- Qualquer detalhe sobre o modelo de aprendizado ou sobre a comparação de algoritmos: esta versão não os apresenta.

## Números para ter à mão

- 18 estratos: 3 × 3 × 2.
- 72 polígonos de 5,02 hectares, cerca de 361 hectares, cerca de 1.845 unidades independentes.
- 11,7 hectares: mediana dos imóveis. 73.643 imóveis no envelope. 43,4%, 64,7% e 71,8% de elegibilidade (limites superiores).
- 72 autorizações (eram 36).
- Voo: 92,8 m, cerca de 7 linhas, 123 disparos, 8,7 a 9,2 m/s, cerca de 3 min por polígono, pelo menos 3,6 h no total, cerca de 12 jornadas, 3 baterias.
- Campo: 60 a 80 pontos, duas ondas, lote piloto de 30.
- 30/09: 677 candidatos, 84 no nível 2, 36 necessários.
