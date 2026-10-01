# Remedição Pericial dos Candidatos da BP3 na Faixa 3% a 20% (D07 Real)
**Data:** 30/09/2026 (Retificado em 01/10/2026 conforme Auditoria Pericial P12)  
**Autoria:** Luís Alfredo Ferreira da Silva (`RedZardoz`)  
**Agente Executor:** Antigravity (Google DeepMind)  
**Normas Aplicadas:** Decisões D07, D08, D09, D10, D12, D16, D23, D24; Parâmetros P02, P07, P11, P12; Regras R1 a R6, C1, C2, C3, F1 a F5.

---

## 1. Funil Metodológico da Amostragem
| Etapa | Candidatos | Justificativa Metodológica |
|---|---|---|
| Imóveis no Envelope da BP3 | 8651 | Consulta oficial em `data/fundiario_brasil.db` |
| Dentro do Divisor Hidrográfico BP3 | 4679 | Divisor oficial IAT e exclusão de UCs Integrais |
| Pós-Thinning Espacial Determinístico (P02) | **687** | Raio relaxado de 5.000 m até o piso de **2450 m** (`exigirDecisao(P02)`) |
| Domínio Físico D07 [3%, 20%] com Ponto Elegível (X3) | **680** | Amostragem estocástica interna no imóvel rural |
| Imóveis Recuperados por Ponto Elegível (X3) | 139 | Seleção ao acaso (P07) livre de suspeita de erosão |
| Pedologia Validada (Embrapa WFS / Cache Auditado) | **677** | Erodibilidade oficial K̂ medida (593 em K̂=1, 84 em K̂=2) |
| Frequência de Solo Nu (Ê via GEE REST) | **0** (NÃO MEDIDO — P12) | Credencial GEE ausente no ambiente — 0 chamadas de rede |

---

## 2. Balanço Pedológico em K̂=2 contra os 36 Necessários
- **Candidatos em K̂=1 (Erodibilidade Baixa/Muito Baixa/Média):** 593 (87.6%)
- **Candidatos em K̂=2 (Erodibilidade Alta/Muito Alta):** **84** (12.4%)
- **Meta de D16 Emendada (4 por estrato × 9 estratos de K̂=2):** **36 candidatos**
- **Veredito Global:** **META GLOBAL ATINGIDA COM SUCESSO (84 >= 36)**

---

## 3. Distribuição por Tercis de Declividade (Ŝ)
- **Ŝ1 (3,00% a 5.12%):** 227 candidatos (K̂=1: 218 | K̂=2: 9)
- **Ŝ2 (5.12% a 8.46%):** 225 candidatos (K̂=1: 211 | K̂=2: 14)
- **Ŝ3 (8.46% a 20,00%):** 225 candidatos (K̂=1: 164 | K̂=2: 61)

---

## 4. Estado Pericial da Dimensão Frequência de Solo Nu (Ê) e Partição de K̂=2
> [!IMPORTANT]
> **DECLARAÇÃO DE INDISPONIBILIDADE PERICIAL (POSTURA P12):**
> A dimensão de **Frequência de Solo Nu (Ê)** **NÃO FOI MEDIDA** devido à ausência da credencial oficial do Google Earth Engine no ambiente (`SAREL_GEE_SERVICE_ACCOUNT_FILE`).
> 
> Em estrita conformidade com a determinação pericial de 01/10/2026 e com a regra fundamental **P12**:
> 1. Todo fallback sintético, determinístico ou fixo (0,15) foi **integralmente expurgado**.
> 2. O arquivo de cache sintético anterior foi **definitivamente apagado**.
> 3. A tabela das 9 células de K̂=2 e dos 18 estratos tridimensionais **NÃO FOI POVOADA** e é declarada como **NÃO MEDIDA**.
> 4. O sorteio dos 36 polígonos segue **COMPULSORIAMENTE BLOQUEADO** até que ocorra medição espectral autêntica via rede autenticada com diário comprobatório.

---

## 5. Auditoria de Requisições e Governança de Rede (Guarda Estrutural F5)
- **Status do Serviço GEE:** Offline / Sem Credenciais
- **Requisições HTTP GEE Realizadas:** 0
- **Itens Indisponíveis Registrados:** 680
- **Diário de Requisições:** Nenhuma chamada externa efetuada (0 requisições)
- **Guarda Inviolável:** Nenhum artefato de medição externa é aceito sem o respectivo diário de requisições contendo código HTTP 2xx e contagem de itens compatível.
