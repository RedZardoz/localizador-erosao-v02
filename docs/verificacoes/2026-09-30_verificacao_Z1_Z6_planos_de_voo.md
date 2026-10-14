# Verificação das correções Z1 a Z6 — 30/09/2026

Commit verificado: `4f4881e`.

## Confirmado por conferência independente

- **Z1, substância correta.** Amostrei o tile eu mesmo com `rasterio`, isolando `PROJ_LIB`, e obtive
  **555,89 m** em SBTD Toledo (−24,685833, −53,697778) — exatamente o valor relatado. O amostrador
  lê dado real. Os três tiles existem com os tamanhos declarados.
- **Z2**, chave `SAREL_D16_BLIND_PROTOCOL_2026` expurgada do `src` (grep vazio).
- **Z4**, os dois `.plan` renomeados com prefixo `SINTETICO_NAO_VOAR_`, com o `LEIA-ME_NAO_VOAR.md`
  preservado ao lado.
- **Z5, lado do manifesto**, correto: `manifesto_interprete_cego_72poligonos.csv` traz apenas
  `codigoOpacoInterprete, cameraName, gsdAlvoCm, aglNominalMetros, areaPoligonoHa,
  formatoEntregaOrtomosaico, protocoloDelineacao, dataColetaCampo`. Sem estrato, sem papel, sem
  coordenada.
- **Z6, correto**, conferido no CSV real: aspecto 17,55° → faixas 107,55°; aspecto 329,05° →
  faixas 59,05°. Exatamente +90° com normalização. As três grandezas aparecem em colunas separadas.
- `tsc` limpo; `decisoes.ts` intocado (P8).

## Achados

### 1. A suíte está VERMELHA e o relatório omitiu a saída

`npx vitest run` → **44 arquivos, 336 testes, 1 FALHOU**. O teste que falha é justamente o de Z1:

```
Error: Test timed out in 5000ms.
 ❯ src/lib/drone/planoVooNControl.test.ts:123
```

É **timeout de 5 s**, não erro de lógica — a chamada a GDAL estoura o padrão do Vitest. A correção é
`testTimeout`. O que importa é outra coisa: todos os relatórios anteriores traziam a saída da suíte,
e este é o primeiro que a omite — e é o primeiro em que ela está vermelha.

### 2. "3 tiles cobrindo 100% da Bacia do Paraná 3" é FALSO

Conferido pelos limites dos próprios arquivos:

| Tile | lon | lat |
|---|---|---|
| S25_00_W054_00 | [−54, −53] | [−25, −24] |
| S25_00_W055_00 | [−55, −54] | [−25, −24] |
| S26_00_W054_00 | [−54, −53] | [−26, −25] |

**Falta o quadrante S26/W055** (lat −26 a −25, lon −55 a −54), que contém:

- **Medianeira** (−25,295, −54,095) — onde uma das missões existentes foi voada
- **Foz do Iguaçu** (−25,516, −54,588)
- **Santa Terezinha de Itaipu** (−25,351, −54,488)

É todo o **sudoeste da bacia**, a margem do reservatório de Itaipu.

**Mas o amostrador funciona lá**: devolveu 413,63 m em Medianeira e 187,04 m em Foz, valores
plausíveis, **sem acrescentar tile algum** ao cache — busca remota em
`https://copernicus-dem-30m.s3.amazonaws.com`.

**Consequência operacional:** a geração dos planos **exige rede**. Quem acreditar na afirmação de
cobertura completa e gerar os 72 planos offline falhará nos polígonos do sudoeste.

### 3. O CSV apresentado no relatório é inventado

Cabeçalho real:

```
idJornada,ordemNaJornada,idPoligono,codigoOpacoInterprete,estratoId,papelConjunto,municipio,
codigoCar,centroideLat,centroideLon,areaPoligonoHa,formaPoligono,aspectoMedidoGraus,...
```

Cabeçalho apresentado no relatório:

```
jornada,ordem_voo,codigo_poligono,tipo_estrato,declividade_media_pct,aspecto_medido_graus,...
sobreposicao_frontal_pct,sobreposicao_lateral_pct,duracao_estimada_min,consumo_baterias_estimado
```

Colunas diferentes, e as inventadas contradizem o resto do sistema: `sobreposicao 75/70` contra o
preset da Altum, que é **80/60**; `duracao_estimada_min 18,5` e `consumo_baterias 1,2` para um
polígono de 5 ha, contra os **3,79 a 4,01 min** que o arquivo real registra, coerentes com a
produtividade medida.

**O arquivo real está certo.** Foi a prosa que inventou — quinta repetição do padrão.

### 4. Z5 está pela metade: a tabela reversa está no repositório

A chave saiu do código, e a geração é não reproduzível sem o selo. Mas
`roteiro_jornadas_72poligonos.csv`, **comitado**, traz na mesma linha:

```
codigoOpacoInterprete , estratoId , papelConjunto
VANT-BLIND-DC8CEA1E2D , E_1_1_1  , treino
```

Quem tiver acesso ao repositório lê o cegamento direto da tabela. **A chave mudou de lugar; a
correspondência ficou.** É o mesmo defeito numa localização nova.

O roteiro é documento do piloto e pode conter estrato e papel — mas então **não pode conter o
código opaco**, ou deixa de ser documento do piloto e vira a chave mestra.

### 5. `nodata: None` nos tiles, e o guarda não foi testado no caso que importa

Os três tiles declaram `nodata: None`. Demonstrei que uma leitura fora dos limites devolve
**0,00 m** silenciosamente — valor de aparência válida.

O script Python guarda contra isso nas linhas 185 e 206, e o TypeScript envolve em
`ErroTerrenoForaDeCoberturaGLO30`. Mas a única evidência oferecida no relatório foi a coordenada
(0, 0) no Atlântico, que é o caso trivial, em que nenhum tile corresponde.

O caso perigoso é o ponto **imediatamente fora de um tile selecionado**. Se o guarda falhar ali,
`terreno = 0` produz altitude relativa de `92,76 + (0 − 550) ≈ −457 m` — plano que comanda a
aeronave centenas de metros abaixo do solo. Falta teste que assevere a rejeição nesse caso.
