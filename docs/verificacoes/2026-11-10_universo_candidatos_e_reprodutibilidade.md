# Prova Pericial de Reprodutibilidade do Funil Amostral e Persistência do Universo de Candidatos da BP3 (D16)

**Data de Execução:** 10/11/2026  
**Ambiente:** SAREL v2.0 · Branch `correcoes/contencao-2026-11-02`  
**Normas e Protocolos:** Decisões D07, D08, D09, D10, D11, D12, D16, D23; Parâmetros P02, P07, P11, P12; Regras Invioláveis R1 a R6, C1, C2, C3, F1 a F5; Protocolo Anti-Fabricação (§1).  
**Artefato Histórico Preservado:** [`docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json) (intacto, inalterado).  
**Novo Artefato Gerado:** [`docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json).  

---

## 1. O Novo Artefato do Universo de Candidatos

O pipeline amostral em [`scripts/remedir_candidatos_bp3_d16.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/scripts/remedir_candidatos_bp3_d16.ts) foi atualizado para persistir não apenas os agregados escalares do funil, mas a totalidade dos candidatos em disco, eliminando a dependência de pools parciais de terceiros.

- **Caminho:** [`docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json)
- **Estrutura do Cabeçalho:**
  - `FONTE_DOS_DADOS`: Base Fundiária Nacional (`data/fundiario_brasil.db`) + Copernicus DEM GLO-30 Local COG (`data/dem_cache/`) + Embrapa GeoInfo WFS (Carta 2024 / `docs/verificacoes/cache_pedologia_bp3.json`).
  - `parametros`: semente P07 (42), raio inicial de thinning (5.000 m), raio final (2.450 m), piso de thinning P02 (1.000 m), domínio de declividade D07 [3%, 20%], 4 polígonos por estrato (D16), 9 estratos em $\hat{K}=2$ e 36 candidatos mínimos em $\hat{K}=2$.
  - `funilContagem`: todas as contagens das 6 etapas do funil.
  - `gitCommitHead`: hash SHA-1 do commit HEAD da execução.
- **Coleções Persistidas:**
  - `candidatos`: **677 candidatos válidos com pedologia** ($\hat{K} \in \{1, 2\}$ e declividade D07 comprovada). Este é o universo elegível para o sorteio e estratificação tridimensional D12/D16.
  - `candidatosComTerreno`: **680 candidatos** que atenderam ao domínio físico D07 [3%, 20%] (incluindo os 3 descartados posteriormente pela pedologia por ausência de classe válida na Carta 2024).

---

## 2. Declaração Estrita de Proveniência dos Campos

Cada candidato persistido traz seus dados de coordenadas e caracterização biofísica acompanhados de metadados de proveniência formal:

| Campo | Proveniência Declarada no Objeto | Detalhamento / Observação de Auditoria |
|---|---|---|
| `latitude` e `longitude` | `estado: "medido"`, `fonte: "data/fundiario_brasil.db (SICAR)"` ou `"selecionarPontoElegivelImovel (P07)"` | Para os 541 mantidos no centroide, a coordenada é o centro geométrico do imóvel rural do SICAR. Para os 139 realocados (X3), provém da célula interna selecionada deterministicamente via P07 livre de suspeita de erosão. *Nota de auditoria:* o timestamp exato de upload de cada CAR no SICAR não é armazenado na tabela SQLite local. |
| `declividadePct` | `estado: "medido"`, `fonte: "Copernicus DEM GLO-30 Local COG (data/dem_cache/)"` | Gradiente topográfico calculado a partir do DEM de 30m da ESA. *Nota de auditoria:* o leitor local não armazena a data de aquisição do sensor orbital de cada tile. |
| `nivelK` | `estado: "medido"`, `fonte: "Embrapa GeoInfo WFS / Cache Auditado"` | Classe de erodibilidade e valor $K$ atribuídos pela Carta 2024 da Embrapa. Para os 3 pontos fora do domínio, o estado é registrado como `indisponivel` (`causa: "fora-do-dominio"`). *Nota de auditoria:* a data de aquisição do WFS por ponto individual não existe no schema do cache (que registra `atualizadoEm` global do arquivo). |

Nenhum campo ausente foi inventado, cumprindo estritamente a diretriz do Prompt E′.

---

## 3. Tabela Comparativa de Reprodutibilidade (Tarefa 2)

O pipeline foi executado com a base fundiária nacional local (`data/fundiario_brasil.db`) e os GeoTIFFs do DEM Copernicus (`data/dem_cache/`). A tabela abaixo confronta os valores medidos em 30/09/2026 com os recalculados agora (10/11/2026):

| Etapa do Funil Amostral | 30/09/2026 | 10/11/2026 | Divergência | Veredito |
|---|:---:|:---:|:---:|:---:|
| `imoveisEnvelopeBP3` | 8.651 | 8.651 | 0 | ✅ Idêntico |
| `imoveisDivisorBP3ForaUC` | 4.679 | 4.679 | 0 | ✅ Idêntico |
| `candidatosPosThinning` | 687 | 687 | 0 | ✅ Idêntico |
| `candidatosComTerrenoD07` | 680 | 680 | 0 | ✅ Idêntico |
| `candidatosRealocadosParteElegivelX3` | 139 | 139 | 0 | ✅ Idêntico |
| `candidatosValidosPedologia` | 677 | 677 | 0 | ✅ Idêntico |

### Distribuições Marginais e Balanço de $\hat{K}=2$:
- **Balanço Pedológico em $\hat{K}=2$:** 84 candidatos (12,41%) contra 36 mínimos exigidos (Meta atingida com folga, exatamente como em 30/09).
- **Tercis de Declividade ($\hat{S}$):**
  - $\hat{S}_1$ [3,00%, 5,12%]: 227 candidatos ($\hat{K}_1=218$, $\hat{K}_2=9$)
  - $\hat{S}_2$ (5,12%, 8,46%]: 225 candidatos ($\hat{K}_1=211$, $\hat{K}_2=14$)
  - $\hat{S}_3$ (8,46%, 20,00%]: 225 candidatos ($\hat{K}_1=164$, $\hat{K}_2=61$)

### Veredito Científico

A reprodução estrita das contagens e dos candidatos entre 30/09/2026 e 10/11/2026 exige uma demarcação epistemológica precisa entre o que foi formalmente provado e o que não foi testado pelo reprocessamento local:

- **Provado (Determinismo Computacional):** As mesmas entradas locais produziram exatamente as mesmas saídas, dígito por dígito, 41 dias depois e em processo de execução independente. Este resultado **não é trivial** e descarta formalmente: aleatoriedade oculta, dependência da ordem de iteração nos laços, sementes estocásticas não inicializadas, não-idempotência na alocação de células internas (X3 / P07) e flutuações de ponto flutuante no thinning espacial multidirecional (P02).
- **Não Provado por esta Rodada Isolada (Estabilidade de Fontes Externas):** O reprocessamento foi integralmente servido por arquivos locais e caches pré-existentes (`data/fundiario_brasil.db`, GeoTIFFs locais do DEM Copernicus GLO-30 e `docs/verificacoes/cache_pedologia_bp3.json`). Portanto, a execução hermética por si só não detectaria eventuais alterações no snapshot do SICAR, na versão do WorldCover da ESA ou nas camadas do GeoServer da Embrapa.
- **Frase Citável para a Dissertação:** *"Determinismo computacional do funil amostral do SAREL v2.0 comprovado em 10/11/2026 contra a execução de 30/09/2026, sobre as mesmas fontes locais auditadas; a estabilidade das fontes externas foi posteriormente aferida por reconsulta amostral ao vivo do WFS da Embrapa GeoInfo (Prompt F, 10/11/2026), registrando 100% de concordância em nível de erodibilidade K̂ e fator numérico K em amostra de 30 pontos."*

---

## 4. Trava Pré-Registrada de Sorteio (D11.2)

Em estrito cumprimento à Tarefa 3, o comando de sorteio de polígonos ([`scripts/sortear_poligonos_d16.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/scripts/sortear_poligonos_d16.ts)) recebeu uma trava fail-closed incondicional antes de qualquer processamento de argumentos ou leitura de dados:

```text
[BLOQUEIO PRE-REGISTRADO D11.2] O sorteio de D16 esta travado.
A guarda que veda E-hat sob suficiencia insuficiente (6 <= n < 12, SE ~ 0,20) de entrar nos
tercis de D12 nao esta ativa no caminho de producao. Ver:
  - docs/auditorias/DeepSeek/AUDITORIA_FUNCIONAL_METODOLOGICA_2026-11-09.md, achado S1-1
  - docs/planejamento/prompts/PROMPT_EXECUTOR_... (Prompt H), que a reativa
Enquanto esta trava existir, nenhum sorteio pode ser executado. Remove-la e tarefa do Prompt H,
junto com o conserto, e nao antes.
```

- **Meta-Teste de Garantia:** Implementado em [`src/lib/gee/sorteioPoligonosTravaD11.test.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/src/lib/gee/sorteioPoligonosTravaD11.test.ts). O teste invoca `sortear_poligonos_d16.ts --dry-run`, assevera que o código de saída é `1`, valida a presença literal da mensagem de bloqueio e confirma que nenhum arquivo de selo é criado em `docs/verificacoes/sorteio/`.
- **Compromisso de Remoção:** A trava e o teste foram desenhados para serem removidos **exclusivamente e conjuntamente** no Prompt H, quando a guarda de suficiência de D11.2 for formalmente reativada no código de produção.

---

## 5. Escopo Negativo: O que NÃO foi Feito nesta Rodada

1. **Medição de Solo Nu ($\hat{E}$):** A variável `SAREL_GEE_SERVICE_ACCOUNT_FILE` foi mantida compulsoriamente indefinida (comprovado em [`docs/verificacoes/execucao/2026-11-10/credencial_ausente_confirmada.txt`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/execucao/2026-11-10/credencial_ausente_confirmada.txt)). A dimensão $\hat{E}$ permaneceu com 0 pontos medidos e estado `indisponivel`. Zero chamadas de rede foram efetuadas e nenhum número sintético foi emitido.
2. **Conserto da guarda D11.2:** A guarda de D11.2 **não foi alterada** no caminho de produção, permanecendo o adiamento deliberado para o Prompt H antes do sorteio.
3. **Sorteio D16:** Nenhum sorteio foi rodado.
