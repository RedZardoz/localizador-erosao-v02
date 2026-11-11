# Material de Decisão — Onde vive o cegamento da campanha

**Data:** 11/11/2026 · **Base:** commit `5c861dd` · **Autor:** planejador, por levantamento do código
**Natureza:** material para decisão do pesquisador. **Nenhuma alteração foi feita.**

---

## 1. A pergunta, reformulada

A pergunta inicial era: *como a interface impede que a pessoa errada baixe a saída errada?*

O levantamento mostra que **essa pergunta não tem resposta dentro do SAREL**, e que formulá-la
assim leva a uma solução que parece proteger sem proteger. A pergunta correta é:

**Onde fica a fronteira do cegamento, e como ela se demonstra?**

---

## 2. O que foi medido

### 2.1 O SAREL é uma aplicação local, monousuária

`package.json` expõe `next dev -H 127.0.0.1` e `next start -H 127.0.0.1`: o servidor atende
**apenas a máquina local**. Não há autenticação, não há sessão, não há conceito de usuário — a
busca por `signIn`, `NextAuth`, `session.user` ou senha devolve apenas atributos `role=` de
acessibilidade.

**Consequência:** quem opera o SAREL tem acesso a tudo. Qualquer controle de papel dentro da
interface é **lembrete, não trava**. Um seletor de papel que o próprio usuário escolhe não impede
nada: basta escolher outro.

### 2.2 A separação de papéis já existe — na forma dos artefatos

| Papel | Perfil | O que carrega |
|---|---|---|
| Interpretação | `interpretacao-cega` | Código, coordenadas, janela temporal, tile — 6 colunas |
| Campo | `campo-cego` | Código, coordenadas, município, CAR, **`Titular_Mascarado`**, rota — 11 colunas |
| Voo | `voo-cego` | Código, coordenadas, área do polígono — 4 colunas |
| Autorização | **não existe perfil** | o artefato de script traz `nomeProprietario`, `codigoCar`, município |

O desenho está correto: cada perfil carrega o mínimo do seu papel, e o de campo **mascara o
titular**. O código opaco (`codigoOpacoVant`) substitui o identificador real.

### 2.3 Mas os cinco perfis saem do mesmo painel, para a mesma pessoa

`PainelCampanha.tsx` oferece `campo-cego`, `voo-cego`, `interpretacao-cega`, `matriz-treino` e
`planilha` — todos, da mesma tela, sem distinção de quem opera.

**O cegamento hoje é uma propriedade dos arquivos, não do acesso.**

### 2.4 Exportações não são registradas

Não há diário de exportação. Não se sabe, nem se saberá, qual perfil foi gerado, quando, nem para
quem foi entregue. O projeto já tem o padrão de diário em outros pontos — `logRecusas.ts`,
`criarDiarioRequisicoes` — mas ele não foi aplicado à exportação.

---

## 3. O que o cegamento precisa provar

Para a dissertação, o que importa não é que o SAREL tenha travas. É que **o intérprete estava
cego** — isto é, que a pessoa que atribuiu o rótulo de erosão a partir da imagem **não sabia** o
estrato do polígono nem a razão de ele ter sido sorteado.

Isso se demonstra por **o que a pessoa recebeu**, não por o que o software impediu. Um registro de
que o intérprete recebeu um arquivo de seis colunas, sem estrato e sem titular, com hash e data, é
prova. Um seletor de papel na interface do coordenador não é.

---

## 4. As quatro opções

### (A) Seletor de papel na interface

Quem abre o SAREL escolhe o papel, e a interface oferece apenas as saídas daquele papel.

- *Protege?* **Não.** O próprio usuário escolhe o papel; trocar é um clique.
- *Serve para?* Reduzir erro acidental do coordenador. Não é desprezível, mas não é cegamento.
- *Risco:* **alto, e do pior tipo** — cria aparência de controle. Alguém pode afirmar na defesa que
  "o sistema impede", e não impede.

### (B) Pacotes por papel, com diário de distribuição

O SAREL gera um **pacote selado por papel** — arquivo com apenas as colunas daquele papel, nome que
identifica o papel, e hash. Cada geração é registrada em diário: papel, data, hash, destinatário
declarado pelo coordenador.

- *Protege?* Não impede o coordenador de ver tudo — e não precisa: ele é o coordenador.
- *Prova?* **Sim.** O diário mais o hash demonstram o que cada pessoa recebeu.
- *Custo:* médio. O gerador por perfil já existe; falta o selamento, o diário e o perfil de autorização.

### (C) Instâncias separadas por papel

Cada papel opera uma instalação própria, com apenas os dados do seu papel.

- *Protege?* Sim, tecnicamente.
- *Custo:* alto, e desproporcional para uma equipe pequena. Multiplica instalação, credencial,
  versão e suporte, e cria risco novo: divergência de versão entre instâncias.

### (D) Declarar a fronteira e não fingir que ela está no software

Registrar, em decisão, que **o SAREL é o console do coordenador** e que o cegamento se dá na
**distribuição** dos artefatos, não no acesso ao sistema.

- *Protege?* A declaração não protege; ela **impede a alegação falsa**, que é o risco real na defesa.
- *Custo:* baixo. É uma decisão e uma emenda.

---

## 5. Recomendação

**(B) combinado com (D).** Não são alternativas: são as duas metades da mesma resposta.

(D) estabelece a verdade — o SAREL é a ferramenta de quem coordena, e o cegamento vive na
distribuição. (B) torna essa verdade **demonstrável**, com pacote por papel, hash e diário.

**Contra (A), explicitamente.** Um seletor de papel sem autenticação é teatro de controle. Pior que
não ter: convida a afirmar na defesa uma proteção que não existe, e essa afirmação não sobrevive a
uma pergunta direta. Se for desejado por conveniência do coordenador, que seja rotulado como
**auxílio operacional**, nunca como trava de cegamento.

**Contra (C)** no estágio atual: o custo não se justifica para a escala da equipe, e o risco de
divergência de versão entre instâncias é real e novo.

---

## 6. Se (B) + (D) forem escolhidas, o que precisa existir

1. **Perfil `autorizacao`** em `perfis.ts` — o único papel que vê `nomeProprietario`. Decidir se
   `estrato_id` entra: quem pede autorização não interpreta, mas ausência é sempre mais segura.
2. **Pacote selado por papel** — um arquivo por papel, com nome que declara o papel, cabeçalho com
   o papel e a data, e hash do conteúdo.
3. **Diário de distribuição** — papel, data, hash, destinatário declarado. No padrão de
   `logRecusas.ts`, que já existe.
4. **Ligar `csvAutorizacoes.ts`** — registra desfecho de autorização e hoje não tem consumidor.
5. **Emenda registrando a fronteira** — que o SAREL é console do coordenador, que o cegamento é de
   distribuição, e que o que se afirma na dissertação é o que o diário prova.
6. **Trava** que impeça um perfil de ganhar coluna fora do seu mínimo — hoje nada impede que
   `voo-cego` receba `estrato_id` numa edição distraída.

O item 6 é o que mais me preocupa a médio prazo: os perfis estão corretos **hoje**, e nada os
mantém corretos amanhã.

---

## 7. O que decidir

1. **(A), (B), (C) ou (B)+(D)?** A recomendação é **(B)+(D)**.
2. O perfil de autorização inclui ou omite o estrato?
3. O diário de distribuição registra o destinatário **nominalmente** ou por papel apenas? Nominal
   prova mais e levanta questão de dado pessoal da própria equipe.
4. A trava do item 6 entra agora ou depois da campanha começar?
