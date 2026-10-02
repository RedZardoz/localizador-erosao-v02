# Prompt para Google AI Studio — Correção e Melhoria do SAREL Coletor (Android)

**Uso:** colar o bloco inteiro abaixo no Google AI Studio, junto com o código-fonte do aplicativo (`sarel-coletor.zip`). O prompt é autocontido: não pressupõe acesso ao repositório do SAREL.

**Data:** 27/09/2026 · **Alvo:** app Android Kotlin/Jetpack Compose, `minSdk 24`, `targetSdk 36`

---

```
Você vai modificar um aplicativo Android de coleta de dados de campo para uma
pesquisa de mestrado em erosão laminar (PPGTCA 2026, UTFPR). O app é escrito em
Kotlin com Jetpack Compose e Room. Estou anexando o código-fonte completo.

CONTEXTO CIENTÍFICO — leia antes de programar, porque muda o que é aceitável.

O app registra a "verdade terrestre" de uma pesquisa: um observador vai a um
ponto sorteado estatisticamente e anota se há erosão laminar. Esse rótulo será o
alvo supervisionado de um modelo de aprendizado de máquina. A unidade de análise
é o pixel de 10 x 10 m do satélite Sentinel-2.

Disso decorrem três regras inegociáveis:

1. NENHUM VALOR PODE SER FABRICADO. Se um dado não existe, o app declara que não
   existe. Jamais preenche com valor plausível, padrão, exemplo ou estimativa.
   Isso vale especialmente para coordenadas e para a acurácia do posicionamento.

2. A PRECISÃO POSICIONAL É O FATOR LIMITANTE DA PESQUISA. Com pixel de 10 m e
   erro gaussiano isotrópico, a probabilidade de o ponto registrado cair no mesmo
   pixel que a posição verdadeira é:
        sigma 8 m -> 19,6%      sigma 3,0 m -> 57,9%
        sigma 5 m -> 37,2%      sigma 2,0 m -> 70,6%
   O aparelho de campo é um Galaxy M13 (Exynos 850, GNSS multiconstelação de
   FREQUÊNCIA ÚNICA, sem L5), que entrega tipicamente 3 a 8 m em campo aberto.
   Melhorar esse número é o objetivo central desta tarefa.

3. O PROTOCOLO É CEGO. O observador não pode ver nenhuma predição, escore,
   estrato ou qualquer indício do que se espera encontrar no ponto. Ele vê
   apenas código do ponto, município e coordenadas.

DEFEITO 1 — CRÍTICO: coordenada fabricada por padrão

Em util/LocationTracker.kt, a data class GpsState tem valores padrão que
declaram um fix válido inexistente:

    val hasFix: Boolean = false   // mas é instanciado com true
    val latitude: Double = -24.9578
    val longitude: Double = -53.4590
    val accuracyMeters: Float = 4.2f

e o estado inicial do tracker é criado com:

    GpsState(
        hasFix = true,  // "Default to Paraná Cascavel coords for instant usability"
        latitude = -24.9578, longitude = -53.4590,
        accuracyMeters = 3.5f,
        statusMessage = "Sinal GPS Ativo (Cascavel-PR)"
    )

Antes de qualquer sinal real o app afirma ter fix em Cascavel com 3,5 m de
acurácia. Se o operador salvar nesse estado, grava coordenada inventada
apresentada como medição. Corrija: sem fix real, hasFix = false, latitude e
longitude nulas (use tipos anuláveis), acurácia nula, e o salvamento BLOQUEADO.
Remova todos os valores de simulação (4.2f, 3.5f, 2.5f) dos caminhos que possam
alcançar um registro real; se mantiver modo de simulação, ele deve marcar o
registro de forma indelével.

DEFEITO 2 — tolerância de posicionamento desatualizada

util/GeoUtils.kt tem:

    const val P03_MAX_TOLERANCE_METERS = 150.0

São 15 pixels do Sentinel-2. A regra vigente da pesquisa é outra, e tem TRÊS
critérios independentes, não um limiar:

 (a) TETO DE ERRO GROSSEIRO: 30 m entre a coordenada observada e a planejada.
     Acima disso, rejeitar — indica ponto errado visitado ou código digitado
     errado, não qualidade de GPS.

 (b) TRAVA DE QUALIDADE POSICIONAL, pela acurácia informada pelo aparelho:
        <= 5 m          aceita
        > 5 m e <= 10 m aceita, com marcação de qualidade que acompanha o registro
        > 10 m          rejeita e exige remedição no local

 (c) Um terceiro critério (pertinência ao estrato amostral) é verificado fora do
     app, no sistema em servidor. O app não o implementa, mas deve exportar a
     coordenada observada para que ele possa ser verificado.

Implemente (a) e (b) como constantes nomeadas e documentadas, e reflita ambos na
interface. O componente ui/components/P03ToleranceBadge.kt exibe hoje
"Tolerância máx: 150m" — atualize.

DEFEITO 3 — cegueira afirmada e não verificada

model/FieldCollection.kt tem:

    val cego: Boolean = true,   // "Protocolo cego inviolável (sempre true)"

Fixar em código torna a afirmação não verificável. Torne o campo DERIVADO do que
a interface efetivamente exibiu durante a coleta. E adicione uma salvaguarda: o
model/PlannedPoint.kt tem um campo "prioridade" ("alta"/"normal") que não vem do
plano cego; se ele for preenchido com base em suspeita de erosão, quebra a
cegueira. Ou remova o campo, ou impeça que ele seja exibido na tela de coleta.

MELHORIA PRINCIPAL — MODO DE MEDIÇÃO ESTÁTICA POR MÉDIA

Esta é a mudança de maior valor científico do trabalho todo. Implemente um modo
em que o operador permanece parado sobre o ponto e o app acumula fixes por um
período, gravando a POSIÇÃO MÉDIA em vez de um fix isolado.

Especificação:
 - duração configurável, padrão 60 s, a 1 Hz (cerca de 60 amostras);
 - descartar os primeiros fixes até a convergência (ver abaixo);
 - calcular média das coordenadas e o ERRO PADRÃO da média;
 - exibir em tempo real: tempo restante, número de amostras aceitas, acurácia
   instantânea e acurácia média acumulada, para o operador ver a convergência;
 - gravar no registro: posição média, erro padrão, número de amostras, duração
   efetiva e acurácia mediana das amostras.

Ganho esperado: erros de GNSS são temporalmente correlacionados (multipath,
ionosfera), então a redução não é raiz de 60. Com 4 a 9 amostras efetivamente
independentes em 60 s, sigma cai de 5 m para 1,7 a 2,5 m — o que leva o acerto
do pixel de 10 m de 37% para 64% a 71%. É quase o dobro.

OUTRAS MELHORIAS DE QUALIDADE GNSS — implemente todas

 1. REJEITAR FIX QUE NÃO SEJA GNSS. O FusedLocationProvider pode devolver
    posição derivada de wi-fi ou torre de celular, muito pior. Verifique o
    provedor e aceite apenas GPS/GNSS.

 2. REJEITAR POSIÇÃO SIMULADA. Use Location.isMock (API 31+) ou
    isFromMockProvider(). Posição simulada jamais pode virar registro de campo.
    Isto é requisito de integridade científica, não de segurança.

 3. GUARDA DE CONVERGÊNCIA. Não habilite o salvamento até que, simultaneamente:
    exista fix GNSS real; a acurácia esteja dentro do critério (b); e a acurácia
    tenha estabilizado — por exemplo, variação menor que 0,5 m ao longo de 10
    fixes consecutivos. Exiba o motivo do bloqueio ao operador.

 4. TELEMETRIA DE SATÉLITES. Registre via GnssStatus.Callback o número de
    satélites usados no fix, as constelações presentes (GPS, GLONASS, Galileo,
    BeiDou) e a relação sinal-ruído média (C/N0). São metadados de qualidade
    auditáveis e ajudam a diagnosticar pontos ruins depois.

 5. DETECÇÃO DE DUPLA FREQUÊNCIA. Use GnssStatus.hasCarrierFrequencyHz() para
    detectar se o aparelho recebe L5/E5a e registre isso. O M13 não recebe, mas
    o campo documenta a condição e prepara o caminho para um aparelho melhor.

 6. REJEITAR FIX VELHO. Compare Location.getElapsedRealtimeNanos() com o relógio
    atual e descarte fixes mais antigos que poucos segundos.

 7. Em AndroidManifest.xml, considere marcar
    android.hardware.location.gps como required="true" — é um app de campo.

CONTRATO DE EXPORTAÇÃO — não quebre, apenas estenda

util/SarelExportEngine.kt gera CSV separado por PONTO-E-VÍRGULA com 28 colunas
nesta ordem exata, que um sistema em servidor consome:

codigoPonto; classe; confianca; modalidade; observador; observadoEm;
dataHoraCompleta; latitude; longitude; altitude; acuraciaGps;
distanciaPlanejadaMetros; dentroToleranciaP03; cego; pedestais_raizes_expostas;
exposicao_horizonte_b; espessura_horizonte_a_cm; crosta_selamento_superficial;
microssulcos_iniciais; sedimentacao_sope; sistema_manejo;
cobertura_vegetal_pct; presenca_terraco; estado_conservacao_terraco;
sentido_plantio; observacoes; foto_nadir; foto_panoramica

MANTENHA essas 28 colunas, com esses nomes e nessa ordem. ACRESCENTE ao final as
novas colunas de qualidade posicional, por exemplo: metodo_posicao
("fix_unico" ou "media_estatica"); n_amostras; erro_padrao_m; duracao_media_s;
satelites_usados; constelacoes; cn0_medio_dbhz; dupla_frequencia;
qualidade_p03 ("aceito", "aceito_com_ressalva", "rejeitado"); e
fix_simulado (booleano).

Acrescentar ao final preserva a compatibilidade com o consumidor atual.

REQUISITOS GERAIS

 - Preserve tudo o que já está correto: os marcadores diagnósticos de erosão
   laminar, as variáveis de manejo, as fotos nadir e panorâmica, o banco Room, a
   navegação por radar/bússola e a importação de pontos planejados.
 - Escreva testes unitários para: a média estática (com série sintética de
   fixes), as três faixas do critério (b), a rejeição de posição simulada, e a
   geração do CSV com as colunas novas.
 - Comente em português as partes de lógica científica, explicando o porquê.
 - Não introduza dependência de rede: o app opera offline em campo.

ENTREGUE

 1. Os arquivos modificados, completos.
 2. Um resumo do que mudou em cada arquivo e por quê.
 3. A lista final de colunas do CSV.
 4. Quais dos sete itens de melhoria GNSS você implementou e, se algum ficou de
    fora, por qual limitação técnica.
```

---

## Notas para o pesquisador, fora do prompt

**Sobre reescrever versus corrigir.** O app tem boa arquitetura e coleta as variáveis certas. Recomendo **corrigir**, não refazer. Os marcadores diagnósticos de erosão laminar e as variáveis de manejo que ele já coleta são a parte difícil e estão certas.

**Sobre o ganho esperado.** A média estática é a única mudança que altera a ordem de grandeza do problema posicional. As demais são higiene necessária, mas é ela que leva a atribuição de pixel de 37% para perto de 70%.

**Sobre o limite do aparelho.** Nada em software supera a ausência de L5. Se a média estática não chegar aos 2 m em campo, o caminho seguinte é receptor externo por Bluetooth com correção NTRIP do RBMC-IP do IBGE, que é gratuito e tem estações em Foz do Iguaçu (ITAI) e Cascavel (PRCL) — as duas emoldurando o corredor.

**Sobre a ingestão no SAREL.** Quando o app mudar, a ingestão no servidor muda junto: hoje ela espera 8 colunas separadas por vírgula e vai receber 38 separadas por ponto-e-vírgula. Isso está previsto na FASE A do prompt de execução consolidado.
