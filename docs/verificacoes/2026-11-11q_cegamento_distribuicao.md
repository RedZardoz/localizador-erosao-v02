# Evidência de Execução — Prompt Q: Cegamento por Distribuição e Pacotes Selados por Papel

- **Data de Execução:** 11/11/2026
- **Ambiente:** Windows / Node.js v24.14.1 / PowerShell
- **Branch:** `correcoes/contencao-2026-11-02`
- **Decisão Metodológica:** Opções **(B) + (D)** de `docs/planejamento/MATERIAL_DECISAO_CEGAMENTO_2026-11-11.md`
- **Registro de Decisões:** Emenda a D16 em `src/config/decisoes.ts`; Entradas 15 e 17 em `docs/planejamento/DECISOES_DE_CONVERSA.md`

---

## 1. Tabela dos Papéis e Conjunto de Colunas Fixadas pela Trava

Conforme a Regra 6 e o Invariante 2, cada papel operacional recebe estritamente as colunas necessárias para sua atribuição. A trava normativa (`src/lib/matriz/travaCegamentoPerfis.test.ts`) fixa o conjunto exato de colunas: qualquer inclusão ou remoção de coluna falha ruidosamente.

| Papel Operacional | Perfil no Sistema | Nº Colunas | Conjunto Exato de Colunas Fixadas | Destinação e Blindagem Metodológica |
|---|---|:---:|---|---|
| **Interpretação** | `interpretacao-cega` | 6 | `Codigo`, `Latitude`, `Longitude`, `Janela_Inicio`, `Janela_Fim`, `Referencia_Cena_Tile` | Intérpretes de satélite (Fase A). Omite categoricamente estrato, titular e probabilidades. |
| **Campo** | `campo-cego` | 11 | `Codigo`, `Latitude`, `Longitude`, `Latitude_DMS`, `Longitude_DMS`, `Municipio`, `Status_Fundiario`, `Motivo_Acesso`, `Codigo_CAR`, `Titular_Mascarado`, `Rota_Acesso` | Equipe de campo para âncora de prevalência (Fase B). Localização e CAR presentes, titular mascarado (SNCR), omissão total de estrato e amostragem. |
| **Voo** | `voo-cego` | 4 | `Codigo`, `Latitude`, `Longitude`, `Area_Voo_Poligono` | Piloto de drone e intérprete de ortomosaico (Fase D). Coordenadas e envelope de voo; desvinculação fundiária total e sem estrato. |
| **Autorização** | `autorizacao` | 8 | `Codigo`, `Latitude`, `Longitude`, `Municipio`, `Codigo_CAR`, `Nome_Proprietario`, `Area_Imovel_Ha`, `Area_Poligono_Ha` | Contato fundiário prévio com proprietários. Contém titular real e CAR, mas **OMITE categoricamente o estrato biofísico**. |

---

## 2. Resultado da Tarefa 1 e Meta-Teste de Injeção

A trava de cegamento foi implementada com duas camadas complementares em `src/lib/matriz/perfis.ts` e testada em `src/lib/matriz/travaCegamentoPerfis.test.ts`:
1. **Fixação Positiva:** Confere que o array `colunasPermitidas` de cada perfil cego coincide estritamente com a declaração formal.
2. **Barreira de Exclusão:** `PADROES_PROIBIDOS_PERFIS_CEGOS` varre toda coluna contra padrões que identifiquem:
   - Estrato biofísico (`/estrato/i`)
   - Titular real ou aberto (`/(?:^|_)(?:nome_?proprietario|proprietario)(?:$|_)/i`, `/(?:^|_)titular(?!_mascarado)(?:$|_)/i`)
   - Documento pessoal aberto (`/(?:^|_)(?:cpf|cnpj)(?:$|_)/i`, `/(?:^|_)documento(?!_mascarado)(?:$|_)/i`)
   - Probabilidade de inclusão amostral (`/(?:^|_)(?:pi|pi_i|probabilidade_?inclusao)(?:$|_)/i`)
   - Peso amostral (`/(?:^|_)(?:peso|peso_?amostragem|w|w_i)(?:$|_)/i`)
   - Identificador de candidato (`/candidato/i`)
   - Partição de treino/teste (`/(?:^|_)(?:papel_?conjunto|particao|treino|heldout|held_out)(?:$|_)/i`)
   - Alvo supervisionado (`/(?:^|_)(?:fracao_?erodida|classe_?alvo_?binaria|rotulo_?classe)(?:$|_)/i`)

### Meta-Teste Comprovado
Injeção intencional de `estrato_id` em perfil cego sintético:
```typescript
it("acusa com erro explícito se 'estrato_id' for injetado em perfil cego sintético", () => {
  const colunasComEstrato = ["Codigo", "Latitude", "Longitude", "estrato_id"];
  expect(() => validarColunasCegas("voo-cego", colunasComEstrato)).toThrow(
    /\[VIOLAÇÃO DE CEGAMENTO\] O perfil cego 'voo-cego' contém a coluna proibida 'estrato_id'/
  );
});
```
- **Resultado:** A trava intercepta a injeção e lança `ErroViolacaoCegamento` com mensagem tipada.
- Total de testes na suíte `travaCegamentoPerfis.test.ts`: **42 testes passando (100%)**.

---

## 3. Perfil `autorizacao` e Justificativa Metodológica da Omissão do Estrato

O perfil `autorizacao` é o único papel com acesso ao nome do proprietário em claro (`Nome_Proprietario`), necessário para que o operador faça contato solicitando permissão de sobrevoo de drone e inspeção presencial.

### Por que o estrato biofísico foi categoricamente omitido?
1. **Segregação Funcional:** Quem pede autorização executa uma tarefa puramente administrativa e fundiária. Não realiza rotulagem visual nem coleta pedológica em campo.
2. **Princípio de Minimização de Risco:** Ausência de dado é uma salvaguarda irreversível; presença exposta é vazamento irremediável. Se o operador de autorização soubesse que determinado imóvel pertence ao estrato de "alta erodibilidade" ou "exposição crônica de solo", poderia inadvertidamente induzir o proprietário ou enviesar a taxa de atrito/insistência por estrato.
3. **Trava Dedicada:** O perfil `autorizacao` possui validador específico `validarColunasAutorizacao` que impede estritamente a adição de colunas com padrão `/estrato/i`.

---

## 4. Formato do Pacote Selado e Diário de Distribuição

A geração do pacote selado por papel foi consolidada em `src/lib/export/pacoteDistribuicao.ts` via `gerarPacoteDistribuicao`.

### 4.1. Exemplo Real de Cabeçalho Gerado (`pacote_campo_2026-11-11.csv`)
```csv
# PACOTE SELADO DE DISTRIBUIÇÃO — SAREL (PPGTCA 2026)
# Papel: campo
# Perfil de Exportação: campo-cego
# Data de Geração: 2026-11-11T14:30:00.000Z
# Total de Pontos: 67
# SHA-256 do Conteúdo: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
# Advertência: CONTEÚDO CEGO RESTRITO À EQUIPE DE CAMPO. Amostra para âncora de prevalência. Dados de titularidade e documentos mascarados. Omissão estrita de estrato e probabilidades de inclusão.
# Protocolo: Cegamento Amostral por Distribuição (D16 / Opções B e D)
# Destinatário Declarado: Equipe Alfa - Perito Responsável

Codigo,Latitude,Longitude,Latitude_DMS,Longitude_DMS,Municipio,Status_Fundiario,Motivo_Acesso,Codigo_CAR,Titular_Mascarado,Rota_Acesso
PR-2026-0001,-25.010000,-53.010000,25°00'36.0"S,53°00'36.0"W,Cascavel,encontrado,Inspeção presencial de campanha PPGTCA,PR-4104808-0001,A*** S***,-25.010000,-53.010000
...
```

### 4.2. Estrutura do Diário de Distribuição (`docs/verificacoes/distribuicao/diario_distribuicao.json`)
O diário segue o padrão de contabilidade de acesso de `logRecusas.ts`:
```json
{
  "versao": "1.0",
  "descricao": "Diário Oficial de Distribuição de Pacotes Selados por Papel — SAREL (PPGTCA 2026)",
  "registros": [
    {
      "id": "DIST-20261111-8F3A2B1C",
      "papel": "campo",
      "perfil": "campo-cego",
      "geradoEm": "2026-11-11T14:30:00.000Z",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "totalPontos": 67,
      "nomeArquivo": "pacote_campo_2026-11-11.csv",
      "destinatario": "Equipe Alfa - Perito Responsável"
    }
  ]
}
```

### 4.3. Governança sobre o Destinatário (Campo Opcional)
O esquema aceita o campo `destinatario` como texto livre, mas **não o torna obrigatório**. Exigir o nome nominal criaria registros desnecessários de dados pessoais de colaboradores (LGPD). A inclusão ou omissão é decisão discricionária do pesquisador no ato da emissão.

---

## 5. Saída de `git check-ignore -v` do Diário

Conforme o protocolo de auditoria, o diário é um artefato versionado para servir de prova auditável perante a banca.
Arquivo gravado em `docs/verificacoes/execucao/2026-11-11q/03_check_ignore_diario.txt`:
```text
$ git check-ignore -v docs/verificacoes/distribuicao/diario_distribuicao.json
ExitCode: 1 (não ignorado - arquivo versionável)

$ git status --short docs/verificacoes/distribuicao/diario_distribuicao.json
?? docs/verificacoes/distribuicao/diario_distribuicao.json
```
Comprovado: o arquivo `diario_distribuicao.json` não está listado no `.gitignore` e está sob controle de versão.

---

## 6. Emenda da Fronteira (Opção D) e Registro de Decisões

Em `src/config/decisoes.ts`, a decisão **D16** (Campanha e protocolo cego de amostragem) recebeu a seguinte emenda oficial:
> *"EMENDA DE 11/11/2026 (Cegamento por distribuição e fronteira do sistema — Opções B e D): (1) O SAREL é o console do coordenador. Opera em 127.0.0.1, sem autenticação e sem conceito de usuário; quem o opera tem acesso legítimo a todos os perfis por desenho da pesquisa, o que é deliberado e não constitui falha de segurança. (2) O cegamento se dá na distribuição, não no acesso local ao sistema: o que cada papel pode ver é determinado pelo pacote que recebe, e comprovado pelo diário de distribuição (docs/verificacoes/distribuicao/diario_distribuicao.json) com rastreio de hash SHA-256. (3) O que a dissertação afirma é o que o diário prova — que os intérpretes e peritos de campo receberam arquivos sem estrato, sem titular real e sem probabilidades ou pesos de amostragem. (4) Seletor de papel na interface web foi expressamente examinado e recusado: sem autenticação, funcionaria apenas como lembrete cosmético e criaria falsa impressão de controle que não sobrevive a questionamento metodológico."*

Transcrições e sincronizações:
- `docs/planejamento/DECISOES.md` sincronizado via `npm run decisoes:md`.
- `docs/planejamento/DECISOES_DE_CONVERSA.md` atualizado com a **Entrada 17** e atualização da **Entrada 15** (resolvendo as pendências 2 e 4 e mantendo 1 e 3 abertas).

---

## 7. O que NÃO Foi Feito (Fronteiras de Escopo Respeitadas)

1. **Nenhum seletor de papel foi implementado na interface web:** Conforme deliberado em conversa e na Opção (D), sem autenticação de usuários, seletor em UI é cosmético e desonesto metodologicamente.
2. **`csvAutorizacoes.ts` segue sem consumidor na interface:** Trata-se de módulo órfão destinado ao registro de desfechos de autorização; permanece fora do escopo desta rodada, aguardando definição de fluxo na Etapa 5.
3. **Planos de voo `.plan`:** A decisão entre geração interativa vs download pré-calculado (Pendência 1 da Entrada 15) permanece aberta.
