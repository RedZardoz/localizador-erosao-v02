# Prompt de abertura — implementação do SAREL

> Cole o texto abaixo como primeira mensagem da sessão de implementação, na raiz do projeto SAREL.

---

Você vai construir o **SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar**, instrumento computacional de uma dissertação de mestrado do PPGTCA 2026.

Existe uma versão anterior deste sistema que foi auditada e **reprovada por veracidade**: 13 das 54 colunas exportadas apresentavam valores falsos. Toda a documentação abaixo existe para que esses defeitos não se repitam.

## Leia estes documentos, nesta ordem, antes de escrever a primeira linha de código

**1. `PROMPT_NOVO_PROJETO_2026-09-08.md` — a Lei Fundamental**
As oito regras que governam o projeto, cada uma com sua justificativa técnica e o defeito real que a originou. Os 7 invariantes de exportação. A especificação de UI. **Estas regras têm precedência sobre qualquer conveniência de implementação.**

**2. `PLANEJAMENTO_PESQUISA_v3_2026-09-08.md` — a fundamentação**
Por que cada decisão metodológica foi tomada, com referências. Leia para entender *o motivo* de cada exigência do plano — sem isso, várias delas parecerão excesso de zelo.

**3. `implementation_plan_v2.md` — o plano de execução**
O que construir, em nove fases (0 a 8). É o documento que você segue. Substitui o `implementation_plan.md` (v1), que **não deve ser usado**.

**4. `AUDITORIA_implementation_plan_2026-09-08.md` — por que o v1 falhou**
Os 14 defeitos do plano anterior. Consulte quando uma exigência do v2 parecer arbitrária: cada uma corrige um problema concreto listado aqui.

**Implementação de referência:** `embrapaSoilClient.ts` — já verificado ao vivo contra o serviço da Embrapa, com 19 testes. É a filosofia do projeto em código: distingue `encontrado` / `sem-cobertura` / `servico-indisponivel`, registra proveniência completa e nunca devolve valor inventado. **Use-o como modelo para todo cliente de dado externo.**

Evidência de apoio, se disponível: `Relatorio_Auditoria_Tabela_Consolidada_2026-09-08.txt` documenta os defeitos originais com os dados reais.

## O princípio que resolve qualquer dúvida

> Quando houver conflito entre **entregar um número** e **dizer a verdade**, diz-se a verdade.
>
> Dado verdadeiro ou ausência declarada. Nunca um valor plausível de origem desconhecida.

## Como trabalhar

- **Siga a ordem das fases.** A Fase 0 é bloqueante e depende do pesquisador — a Fase 1 pode correr em paralelo, exceto o enum `ClasseRotulo`.
- **Pare e pergunte** nos itens marcados 🛑. São nove decisões listadas na §15 do plano: critérios de rótulo, mapa ordinal da erodibilidade, fórmula do Fator C, buffer do Planet, entre outras. **Não decida sozinho o que vai para uma dissertação.**
- **Verifique antes de afirmar** (Regra 8). Todo serviço externo: consulte capacidades, execute chamada real, registre o esquema observado em comentário **com data**. Nada é declarado pronto sem isso.
- **Teste antes de declarar pronto.** Cada correção com um teste que falharia se o defeito estivesse presente. Um teste que passaria com o bug não conta — a auditoria encontrou exatamente esse padrão no plano v1.
- **Ao fim de cada fase:** `npm run test && npx tsc --noEmit && npm run lint`, os três verdes. Nunca desative teste nem afrouxe asserção para passar.
- **Relate com honestidade.** Se algo ficou parcial, diga qual parte. Se não verificou, diga que não verificou.

## Comece por aqui

Leia os quatro documentos. Depois **confirme comigo** o entendimento das oito regras e dos nove pontos de decisão, e proponha o escopo exato da Fase 1 antes de codificar.

Duas advertências para a Fase 5, que já estão no plano mas merecem destaque. O plano **Trial do Planet expirou em 29/04/2026** e a Statistical API vinha vinculada a ele — verifique se ainda responde antes de projetar qualquer coisa sobre ela; o plano Education and Research Basic é separado e está ativo. E a **cota de 3.000 km² parece ser mensal** (o painel indica ciclo por mês), mas isso é leitura de rótulo, não documentação: confirme antes de dimensionar a campanha, porque se for alocação total o orçamento muda por um fator de 24.

## Chaves de acesso

Nunca peça, exiba ou registre credencial em log, mensagem de erro ou commit. As chaves ficam em setor próprio da aplicação, em sessão de servidor efêmera com cookie `httpOnly`, nunca em disco. O padrão foi auditado e está correto — replique-o.
