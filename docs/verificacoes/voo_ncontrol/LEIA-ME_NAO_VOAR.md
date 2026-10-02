# ⚠ OS ARQUIVOS `.plan` DESTE DIRETÓRIO NÃO PODEM SER VOADOS

**Data deste aviso:** 30/09/2026 · **Verificado por:** Claude Opus 5

## O que há aqui

`jornada_01_terrainfollow.plan` e `jornada_01_altfixa.plan` são **artefatos de demonstração**
do exportador implementado em `src/lib/drone/planoVooNControl.ts`. São arquivos QGroundControl
`.plan` válidos, carregáveis no NControl e **indistinguíveis de um plano real** ao abrir.

**Eles não descrevem voo algum que deva ser executado.**

## Por quê

### 1. As altitudes são sintéticas

As altitudes por waypoint — de 90,14 m a 94,49 m no `jornada_01_terrainfollow.plan` — foram
geradas pelo amostrador de elevação definido em `src/lib/drone/planoVooNControl.test.ts:264`:

```ts
const amostradorGLO30 = (lat, lon) =>
  380.0 + Math.sin(lat * 120.0) * 35.0 + Math.cos(lon * 120.0) * 25.0;
```

É uma função trigonométrica da coordenada. **Não é o Copernicus DEM GLO-30**, apesar do nome
da variável. Os valores caem na faixa de 320 a 440 m, que é plausível para a Bacia do Paraná 3
— o que torna o arquivo mais perigoso, não menos, porque nada nele parece errado.

**Não existe leitor real do GLO-30 no repositório.** `AmostradorElevacaoGLO30` é apenas um
tipo em `planoVooNControl.ts`; nenhuma implementação o satisfaz fora dos testes.

### 2. Os polígonos são sintéticos

O sorteio de D16 sobre dados reais **não foi executado** — corretamente, porque está travado.
Os 72 polígonos destes arquivos foram fabricados para exercitar a estrutura. As coordenadas
caem na bacia e parecem reais.

### 3. O ponto de decolagem é sugestão

`plannedHomePosition` é o centro do primeiro polígono da jornada, sem qualquer dado de acesso
viário, linha de visada ou obstáculo.

## O risco concreto

Um arquivo `.plan` é **executável**: carrega-se na estação, arma-se e voa. Estes carregam
altitudes de seguimento de terreno inventadas. Voá-los significaria seguir um relevo que não
existe, com a aeronave subindo e descendo por uma senoide da longitude.

## O que precisa acontecer antes de existir plano voável

1. **Implementar o amostrador real do Copernicus GLO-30** e injetá-lo no exportador.
2. **Renomear** o amostrador sintético do teste, para que nenhum fixture se chame como a fonte
   de dados real.
3. **Guarda em código**: o exportador deve recusar emitir plano com altitude por waypoint
   quando o amostrador não declarar proveniência real, ou carimbar o nome do arquivo como
   sintético.
4. **Executar o sorteio de D16** sobre candidatos reais, o que ainda está travado.

Enquanto os quatro não estiverem feitos, nada neste diretório vai a campo.

## O que está correto e não deve ser refeito

O exportador em si foi verificado e está bom. O teste de aceite de Y1 **lê o arquivo de
referência real** `docs/Plano de voo exemplo/MissaoCalculoMica.plan` e confronta a saída contra
ele — não é auto-confirmação. A aritmética fotogramétrica confere: 62 itens, 48 waypoints, 14
disparos, trigger de 10,652403 m, AdjustedFootprintSide de 28,48 m. E o caminho sem amostrador
tem fallback seguro: altitude constante, sem inventar terreno.

O defeito está nos **artefatos comitados**, não na lógica que os produziu.
