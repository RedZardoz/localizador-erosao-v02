# Diretrizes do SAREL (PPGTCA 2026)
LEITURA OBRIGATÓRIA: Leia integralmente [docs/DESENVOLVIMENTO.md](docs/DESENVOLVIMENTO.md) antes de qualquer ação.
No início de toda sessão, consulte obrigatoriamente:
1. `docs/planejamento/ESTADO.md` — estado medido, nunca de memória;
2. `docs/planejamento/DECISOES_DE_CONVERSA.md` — o que já foi decidido;
3. Rodar `npm run estado:verificar` e conferir antes de propor qualquer coisa. Este comando SOMENTE LÊ: compara o painel em disco com o estado medido do repositorio e sai com codigo 1 se divergirem. NAO use `npm run estado` para conferir — ele reescreve o painel avancando-o para o HEAD vivo e suja a arvore de trabalho. `npm run estado` e para quando voce QUER avancar o painel, e a alteracao resultante entra em commit proprio.
As 9 Regras Invioláveis, governança e ambiente vivem em `docs/DESENVOLVIMENTO.md`.
