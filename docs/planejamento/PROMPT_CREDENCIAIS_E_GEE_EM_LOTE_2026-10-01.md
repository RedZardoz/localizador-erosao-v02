# Prompt de Execução — Credenciais fora do repositório, APIs do painel vivas, e GEE em lote

**Data:** 01/10/2026
**Objetivo:** destravar a medição de Ê, que é o único item no caminho crítico, com credenciais que nunca tocam o repositório e com um padrão de consulta ao GEE economicamente viável para 680 candidatos.

---

# PARTE 0 — O ESTADO, LEVANTADO

## Correção de um diagnóstico errado, que eu repeti

O relatório anterior afirmou que faltavam credenciais do GEE porque `.env` e `.env.local` estão ausentes, e eu repeti isso. **Está errado.** O `.env.example` diz com todas as letras que a aplicação *"funciona 100% no modo padrão sem nenhuma variável de ambiente obrigatória"* e que as credenciais do GEE *"podem ser fornecidas diretamente na interface (Configurações → Conexão & Dados)"*.

A ausência de `.env` é o comportamento projetado, não uma falha.

## O problema real é arquitetural

As credenciais vivem numa **sessão em memória do processo Node** — `global.__sarelSessionStore`, um `Map`, TTL de **12 horas**, id em cookie `httpOnly` (`src/lib/seguranca/sessaoEfemera.ts:27-37`).

Consequência: a rota `/api/gee/select-candidates` **pode** usar a credencial, porque roda dentro do servidor. Mas `scripts/remedir_candidatos_bp3_d16.ts` roda **pela linha de comando, fora do servidor** — não tem sessão, não tem cookie, e por isso **nunca chamou o GEE**. As linhas 240-241 daquele script são `console.log` narrativos sobre o X2, não chamadas reais.

É por isso que `frequenciaSoloNu`, `solo_nu` e `tercilE` aparecem **zero vezes** no artefato da remedição, e que a tabela das 9 células é a marginal de Ŝ dividida por três.

## Inventário dos serviços

| Serviço | No painel | Consumidores em `src/lib` e `src/app/api` | Papel |
|---|---|---|---|
| Google Earth Engine | `GcpCredentialsManager` | 8 arquivos, 4 rotas | **Caminho crítico** |
| Planet | `ApiTokensManager` | 9 arquivos | Excluído da matriz por D05 |
| JEV | `ApiTokensManager` | 12 arquivos, 2 rotas | Diagnóstico; `scoreJev` já proibido na matriz |
| Embrapa AgroAPI / SmartSolos | `ApiTokensManager` | **0** | Órfão |
| Mapbox | `ApiTokensManager` | **0** | Órfão |
| CARTO | só `.env` | 4 arquivos | Base cartográfica, fora do painel |
| Google Maps | `ApiTokensManager` | — | Atalho de Street View |

---

# PARTE I — C1: CREDENCIAIS NUNCA NO REPOSITÓRIO

Exigência do pesquisador, e ela vale para todos os serviços, não só o GEE.

## Duas vias, e só duas

**Via interativa**, que já existe e permanece: painel → sessão efêmera em memória. Nada é persistido. Mantenha.

**Via de lote**, nova: uma variável de ambiente que guarda o **caminho** de um arquivo de chave, e o arquivo fica **fora da árvore do repositório**.

```
SAREL_GEE_SERVICE_ACCOUNT_FILE=C:\Users\<usuario>\.sarel\gee-service-account.json
```

A variável carrega **caminho**, nunca o segredo. O arquivo vive onde o pesquisador escolher, fora do projeto.

## A guarda que torna a exigência verificável

**Recuse qualquer caminho de credencial que resolva dentro da árvore do repositório.** Compare o caminho canônico com a raiz do projeto e lance erro explícito se estiver contido nela — mesmo que o arquivo esteja no `.gitignore`.

A razão: `.gitignore` impede o commit, não impede o arquivo de existir no diretório, de entrar num backup, num zip ou numa cópia do projeto. A exigência do pesquisador é mais forte que "não comitado".

**Teste obrigatório:** caminho dentro do repositório é recusado com mensagem nomeando a regra; caminho fora é aceito.

## Varredura adicional

O `.gitignore` já cobre `.env`, `.env*.local`, `*.key`, `*credential*.json`, `*credentials*.json`, `*service-account*.json` e `*service_account*.json`. **Confirme que basta** e estenda se encontrar lacuna.

Estenda `src/lib/seguranca/padroesProibidos.test.ts` para falhar se aparecer no código literal com cara de credencial: `-----BEGIN PRIVATE KEY-----`, `"private_key"`, `PLAK`, `AIzaSy`, `pk.eyJ`, `ts_` seguido de hexadecimal longo, e `Bearer eyJ`. É a mesma família de guarda que já funcionou duas vezes neste projeto.

---

# PARTE II — C2: CADA SERVIÇO GANHA PAPEL DECLARADO, OU SAI DO PAINEL

O pesquisador pediu todas as APIs do painel **funcionais e vivas**. Cumpra isso com uma ressalva que considero necessária: **ligar um serviço que não tem para que serve é pior do que removê-lo**, porque o campo no painel promete efeito que não existe, e alguém vai preencher e esperar resultado.

Então: cada serviço recebe **papel declarado e consumidor real**, ou **sai do painel**. Minhas recomendações, que o pesquisador pode sobrepor:

**Google Earth Engine** — vivo e crítico. Tratado na PARTE III.

**Planet** — tem 9 arquivos de código, mas **D05 excluiu PlanetScope da matriz de treino**. Papel admissível: **contexto visual no Inspetor**, imagem de alta resolução para o pesquisador olhar. Ligue com **guarda dura**: nenhum dado derivado de Planet entra na matriz nem em preditor algum, e os campos correspondentes vão para `CAMPOS_PROIBIDOS_MATRIZ_TREINO`. Se o pesquisador quiser Planet como preditor, isso exige emenda de D05 e não é seu.

**JEV** — já está corretamente escopado: `scoreJev` está proibido na matriz e a rota é de auditoria. Deixe vivo e **verifique que o token flui do painel até a rota**, com teste.

**Embrapa AgroAPI / SmartSolos** — **recomendo remover do painel**. Zero consumidores, e não há uso: o SmartSolos classifica solo a partir de dados analíticos de perfil, que esta pesquisa não coleta. Lemos o levantamento pronto pelo WFS público, sem autenticação. Se o pesquisador discordar, o serviço precisa primeiro de um papel declarado.

**Mapbox** — zero consumidores. **Ou ligue como provedor de base cartográfica**, ao lado do CARTO que já funciona, **ou remova do painel.** Recomendo ligar, porque é barato e o campo já existe.

**CARTO** — funciona, mas a chave vem só de `.env`. **Traga para o painel**, para que haja uma via única de credencial. Duas vias para a mesma coisa é como se perde o rastro de onde um segredo está.

**Google Maps** — verifique se o atalho de Street View funciona com o token do painel; se não houver consumidor, mesma regra dos órfãos.

## Em todos os casos

- O painel deve mostrar, por serviço, **o estado real**: configurado, não configurado, ou configurado e com teste de conexão falhando.
- Serviço sem consumidor **não aparece como configurável**.
- Nenhum token é persistido em disco pelo aplicativo; tudo vai para a sessão efêmera.

---

# PARTE III — C3: GEE EM LOTE, E BARATO

É aqui que está o resultado do projeto, e o pesquisador pediu explicitamente economia.

## O problema do padrão atual

`src/lib/gee/copernicusGeeClient.ts` usa o endpoint REST v1 `value:compute` com lotes e concorrência, mas **avalia a expressão por ponto**. Para medir Ê — a frequência de solo nu sobre a série Sentinel-2 de 2016 a 2026 — isso significa **recomputar a redução temporal da série uma vez por candidato**.

Com 680 candidatos, é a mesma redução de dez anos feita 680 vezes. O custo dominante não é a leitura do pixel: é a redução temporal.

## O padrão econômico

**Compute a imagem de frequência de solo nu uma vez e amostre muitos pontos por chamada.**

1. Construa, no grafo de expressão, **uma imagem de banda única** cujo valor por pixel é a **fração de cenas válidas** em que a célula aparece com solo exposto — fração, e não contagem absoluta, conforme D05 exige por causa da densidade desigual da série antes de 2017.
2. Restrinja a computação ao **domínio de validade de D07** antes de reduzir. Não compute onde o resultado será descartado.
3. **Amostre em blocos de pontos** — cem por chamada, por exemplo — em lugar de um por chamada. São ~7 chamadas em vez de 680, e a redução temporal é recomputada ~7 vezes em vez de 680.

**Meça, não presuma.** Registre tempo de parede e número de requisições **antes e depois**, sobre o mesmo conjunto de candidatos. Minha estimativa de redução de duas ordens de grandeza é hipótese; o relatório deve trazer o número medido.

## Retomada e cache

Medir 680 candidatos é trabalho de lote, e a sessão do painel expira em 12 horas.

- **Persista o resultado parcial** em artefato sob `docs/verificacoes/`, de modo que uma interrupção não obrigue a recomeçar.
- **Chave de cache por candidato e por definição de Ê**: se a definição mudar, o cache invalida. Cache que sobrevive a mudança de definição é pior que cache nenhum.
- O resultado final de Ê por candidato vira artefato, e é dele que a estratificação lê — não de chamada ao vivo.

## O que fazer com a remedição

`scripts/remedir_candidatos_bp3_d16.ts` deve passar a **medir Ê de fato**, pela via de lote da PARTE I, e a emitir a tabela das 9 células **com contagem medida** em lugar da marginal dividida por três.

Se, com Ê medido, algum dos 9 estratos de K̂=2 ficar abaixo de 4, **pare e relate com os números**. Não ajuste limiar, não recorte a dicotomia, não reduza polígonos por estrato. A decisão é do pesquisador, e as alternativas estão em `docs/verificacoes/2026-09-29_gargalo_estratos_k2_dominio_d07.md`.

Lembre que há folga: o thinning parou em **2.450 m** e o piso de P02 é **1.000 m**. Se faltarem candidatos no tercil inferior de declividade, relaxar mais é o caminho — e é decisão sua, dentro do parâmetro já registrado.

---

# PARTE IV — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `decisoes.ts` proibido. Nada aqui exige emenda: D05 já exclui Planet da matriz, e o papel de contexto visual não contraria decisão alguma.
- **Nenhuma credencial no repositório**, em nenhuma forma, nem em teste, nem em fixture, nem em exemplo. Use valores manifestamente falsos nos testes.
- **Não persista token em disco** pelo aplicativo.
- **Não ligue serviço sem papel declarado.**
- **Não execute o sorteio.**
- **P11** — se Ê medido mostrar estrato deficiente, relate. Não ajuste critério.

---

# PARTE V — RELATÓRIO

Gerado por `scripts/gerar_relatorio_fase.ts`, conforme W5. Na seção de juízo:

1. Caminho de credencial de lote adotado, e a saída do teste que recusa caminho dentro do repositório.
2. Decisão por serviço: vivo com papel declarado, ou removido do painel, e por quê.
3. **Requisições e tempo de parede do GEE, antes e depois** do padrão em lote, sobre o mesmo conjunto.
4. A tabela das 9 células de K̂=2 **com Ê medido**, e se os 4 por estrato foram atingidos.
5. Se não foram: quais estratos, com quantos, e o que falta.

---

## Nota sobre economia

A economia aqui não é de dinheiro — o GEE é gratuito para pesquisa — é de **cota e de tempo**, e sobretudo de **retrabalho**. Um padrão que recomputa dez anos de série 680 vezes não é apenas lento: é frágil, porque qualquer interrupção no meio obriga a recomeçar, e a sessão expira em 12 horas.

O ganho real de medir Ê uma vez e amostrar em bloco é que a medição **termina**, e termina em artefato que a estratificação lê sem voltar ao GEE. Depois disso, o sorteio depende só de números que já estão em disco.
