# Correção do Bloco de Medição de Testes do Levantamento de 06/11/2026

## 1. Abertura

Este documento corrige o bloco de medição de `npm run test` do levantamento de 06/11/2026 (docs/planejamento/LEVANTAMENTO_2026-11-06.md), e os demais achados daquele documento foram verificados pelo planejador e permanecem válidos, nomeadamente: a linhagem das branches remotas; o CI que nunca dispara em correcoes/** e reprova por --max-warnings 0; o hook de pre-commit do husky inoperante por falta de instalação; a fórmula híbrida do Fator C com dispensa no varredor; a lacuna de orquestração da linha de base RUSLE; e o peso e o licenciamento de docs/.

A existência dos dois arquivos .vivo.test.ts com configuração própria e script `test:vivo` encerra, com evidência, um achado que estava pendente desde o levantamento: a suíte dependente da base fundiária local foi segregada e a suíte hermética passa num clone limpo. Item resolvido.

---

## 2. Saída Bruta dos Comandos de Medição

### Comando 1: `git ls-files '*.test.ts' '*.test.tsx' | sort`
```text
src/app/api/fundiario/status/route.test.ts
src/app/api/gee/select-candidates/chuvaDecisao.test.ts
src/app/api/sitios-referencia/route.test.ts
src/components/campanha/PainelCampanhaSelo.test.ts
src/components/config/ApiTokensManagerN15.test.ts
src/components/config/SettingsModalN15.test.ts
src/components/decisoes/PainelCriterioRefutacaoD25.test.ts
src/components/inspetor/InspetorPonto.test.ts
src/components/layout/acessibilidadeAlvosERotulos.test.ts
src/components/layout/acoesCabecalho.test.ts
src/components/map/PointPopupAvisos.test.ts
src/components/map/candidatoEspectral.test.ts
src/config/areaInteresse.test.ts
src/config/decisoes.espelho.test.ts
src/config/decisoes.parametros.test.ts
src/config/decisoes.test.ts
src/config/decisoesEmendas.test.ts
src/config/decisoesParidade.test.ts
src/config/deflacao.test.ts
src/config/inventarioBibliografico.test.ts
src/config/lastroCientifico.test.ts
src/config/paridadeArtefatos.test.ts
src/config/readmeIntegridade.test.ts
src/config/textosDefasadosC22.test.ts
src/config/tourMetodologico.test.ts
src/hooks/useModalA11y.test.ts
src/lib/autorizacao/csvAutorizacoes.test.ts
src/lib/autorizacao/equipe.test.ts
src/lib/autorizacao/logRecusas.test.ts
src/lib/chuva/chuva.test.ts
src/lib/drone/planoVooNControl.test.ts
src/lib/drone/planoVooNControl.vivo.test.ts
src/lib/embrapa/embrapaSoilClient.test.ts
src/lib/export/dms.test.ts
src/lib/export/pacoteReprodutibilidade.test.ts
src/lib/export/planilha.test.ts
src/lib/fundiario/calculadoraDesenho.test.ts
src/lib/fundiario/manifestoSanidade.test.ts
src/lib/fundiario/matcher.test.ts
src/lib/fundiario/matcher.vivo.test.ts
src/lib/fundiario/selecaoPontoElegivel.test.ts
src/lib/fundiario/verificadorManifesto.test.ts
src/lib/gee/amostragemBiofisica.test.ts
src/lib/gee/amostragemSoloNuLote.test.ts
src/lib/gee/aoiTiling.test.ts
src/lib/gee/auth.test.ts
src/lib/gee/blocosEspaciais.test.ts
src/lib/gee/compostoSoloNu.test.ts
src/lib/gee/consolidacaoInspecao.test.ts
src/lib/gee/copernicusGeeClient.test.ts
src/lib/gee/elegibilidade.test.ts
src/lib/gee/estatisticasSerie.test.ts
src/lib/gee/estratificacao.test.ts
src/lib/gee/harmonicos.test.ts
src/lib/gee/persistenciaTemporal.test.ts
src/lib/gee/poolEstratos.test.ts
src/lib/gee/serieTemporal.test.ts
src/lib/gee/sorteioPoligonos.test.ts
src/lib/gee/terreno.test.ts
src/lib/gee/thinning.test.ts
src/lib/gee/verificarPoolEstratosCli.test.ts
src/lib/gee/versaoMotor.test.ts
src/lib/jev/jevClient.test.ts
src/lib/localizacao/localizacao.test.ts
src/lib/matriz/contratoMatrizS11.test.ts
src/lib/matriz/esquema.test.ts
src/lib/matriz/invariantes.test.ts
src/lib/matriz/montagemD16.test.ts
src/lib/matriz/montagemRotulo.test.ts
src/lib/matriz/montagemTemporal.test.ts
src/lib/matriz/perfisIntegridade.test.ts
src/lib/matriz/travaAlvosPreRegistro.test.ts
src/lib/padraoOuro/sitiosLocais.test.ts
src/lib/padraoOuro/validacaoMatricial.test.ts
src/lib/planet/planet.test.ts
src/lib/rotulos/binarizacao.test.ts
src/lib/rotulos/ingestaoColetor.test.ts
src/lib/rotulos/rotuloHumano.test.ts
src/lib/rotulos/rotulos.test.ts
src/lib/rusle/fatorK.test.ts
src/lib/rusle/fatorLS.test.ts
src/lib/rusle/fatorR.test.ts
src/lib/rusle/rusle.test.ts
src/lib/seguranca/cegamentoArtefatos.test.ts
src/lib/seguranca/credenciaisSeguras.test.ts
src/lib/seguranca/detectorSequencia.test.ts
src/lib/seguranca/diarioRequisicoes.test.ts
src/lib/seguranca/gerarRelatorioFase.test.ts
src/lib/seguranca/guardaImputacaoMediana.test.ts
src/lib/seguranca/guardaSintetico.test.ts
src/lib/seguranca/importacoes.test.ts
src/lib/seguranca/localOnly.test.ts
src/lib/seguranca/padroesProibidos.test.ts
src/lib/seguranca/provenienciaCaminhos.test.ts
src/lib/seguranca/sessaoEfemera.test.ts
src/lib/seguranca/verificacoes.test.ts
src/lib/tempo/datas.test.ts
src/store/interfaceIntegration.test.ts
src/store/useSarelStore.test.ts
src/types/proveniencia.test.ts
```

### Comando 2: `git ls-files '*.test.ts' '*.test.tsx' | wc -l`
```text
100
```

### Comando 3: `git ls-files 'src/lib/*' | cut -d/ -f3 | sort -u`
```text
autorizacao
chuva
drone
embrapa
export
fundiario
gee
jev
localizacao
matriz
padraoOuro
planet
rotulos
rusle
seguranca
tempo
```

### Comando 4: `git ls-files 'src/lib/geo/*' | wc -l`
```text
0
```

### Comando 5: `git ls-files 'src/lib/amostragem/*' | wc -l`
```text
0
```

### Comando 6: `git ls-files 'src/lib/estatistica/*' | wc -l`
```text
0
```

### Comando 7: `git ls-files 'src/lib/chuva/*' | sort`
```text
src/lib/chuva/chirps.ts
src/lib/chuva/chuva.test.ts
src/lib/chuva/eventos.ts
src/lib/chuva/imerg.ts
```

### Comando 7b: `git ls-files '*.vivo.test.ts' | sort`
```text
src/lib/drone/planoVooNControl.vivo.test.ts
src/lib/fundiario/matcher.vivo.test.ts
```

### Comando 8: `npm ci`
```text
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
npm warn deprecated google-p12-pem@3.1.4: Package is no longer maintained
npm warn deprecated tsconfck@3.1.6: unmaintained
npm warn deprecated uuid@8.3.2: uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).
npm warn deprecated glob@10.3.10: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.

added 549 packages, and audited 550 packages in 2m

181 packages are looking for funding
  run `npm fund` for details

26 vulnerabilities (14 moderate, 9 high, 3 critical)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
npm warn install-scripts 2 packages have install scripts not yet covered by allowScripts:
npm warn install-scripts   core-js@3.50.0 (postinstall: node -e "try{require('./postinstall')}catch(e){}")
npm warn install-scripts   unrs-resolver@1.12.2 (postinstall: node postinstall.js)
npm warn install-scripts
npm warn install-scripts Run `npm install-scripts ls` to review, or `npm install-scripts approve <pkg>` to allow.
```

### Comando 9: `npm run test`
```text
> sarel@2.0.0 test
> vitest run

The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.

 RUN  v4.1.11 C:/Users/lalfr/Docs Fora do Ar/LUIS ALFREDO/01 - MESTRADO PPGTCA 2026/02 - PESQUISA EROSÃO LAMINAR/geolocalizacao-erosao-propriedade

 ✓ src/config/lastroCientifico.test.ts (15 tests) 16ms
 ✓ src/lib/embrapa/embrapaSoilClient.test.ts (33 tests) 126ms
 ✓ src/lib/matriz/invariantes.test.ts (33 tests) 59ms
 ✓ src/lib/rotulos/rotulos.test.ts (19 tests) 28ms
 ✓ src/lib/drone/planoVooNControl.test.ts (10 tests) 531ms
     ✓ Y4, Y5 e Y6 sob Z1–Z6: exporta campanha completa com terreno real GLO-30 e segregação cega estrita  474ms
 ✓ src/lib/gee/sorteioPoligonos.test.ts (19 tests) 96ms
 ✓ src/lib/gee/amostragemSoloNuLote.test.ts (10 tests) 129ms
 ✓ src/lib/matriz/montagemD16.test.ts (17 tests) 34ms
 ✓ src/lib/rusle/rusle.test.ts (20 tests) 383ms
       ✓ nenhum módulo em src/ (exceto fatorC.ts e testes) importa ou chama calcularFatorCSensibilidadeBsi nem calcularFatorCHibrido  352ms
 ✓ src/config/paridadeArtefatos.test.ts (7 tests) 58ms
 ✓ src/lib/matriz/montagemRotulo.test.ts (13 tests) 18ms
 ✓ src/lib/jev/jevClient.test.ts (11 tests) 84ms
 ✓ src/lib/export/pacoteReprodutibilidade.test.ts (20 tests) 3566ms
     ✓ INTEGRAÇÃO A5(c): extrai ZIP e roda 07_verificar_integridade.py via Python (exit 0 em íntegro, exit 1 se corrompido)  3405ms
 ✓ src/lib/seguranca/padroesProibidos.test.ts (34 tests) 4141ms
       ✓ nenhum arquivo em src/lib, src/app, src/store, src/config, src/components ou src/types deve conter padrões proibidos  1310ms
       ✓ nenhum script em scripts/ deve conter geração sintética não documentada ou padrões proibidos  603ms
       ✓ assevera que nenhum JSON versionado em data/ e docs/ contém hash implausível ou timestamp suspeito  1379ms
       ✓ assevera que nenhum artefato JSON de medição em docs/verificacoes/ contém séries numéricas correlacionadas com a ordem do arquivo  522ms
 ✓ src/lib/chuva/chuva.test.ts (17 tests) 49ms
 ✓ src/lib/export/planilha.test.ts (14 tests) 110ms
 ✓ src/lib/matriz/travaAlvosPreRegistro.test.ts (7 tests) 11ms
 ✓ src/lib/rusle/fatorK.test.ts (16 tests) 16ms
 ✓ src/lib/gee/terreno.test.ts (12 tests) 15ms
 ✓ src/lib/rusle/fatorLS.test.ts (13 tests) 24ms
 ✓ src/lib/planet/planet.test.ts (15 tests) 101ms
 ✓ src/lib/gee/poolEstratos.test.ts (15 tests) 21ms
 ✓ src/lib/padraoOuro/validacaoMatricial.test.ts (16 tests) 20ms
 ✓ src/lib/matriz/montagemTemporal.test.ts (9 tests) 38ms
 ✓ src/lib/rusle/fatorR.test.ts (6 tests) 67ms
 ✓ src/components/inspetor/InspetorPonto.test.ts (4 tests) 57ms
 ✓ src/config/deflacao.test.ts (7 tests) 1431ms
     ✓ audita os geradores de documentos contra deriva: exige PARAM_DEFLACAO e proíbe literais derivados ou defasados  1421ms
 ✓ src/lib/gee/copernicusGeeClient.test.ts (9 tests) 56ms
 ✓ src/lib/matriz/contratoMatrizS11.test.ts (3 tests) 741ms
     ✓ 9. As quatro rotas repassam a opção quando ela é fornecida — falha se houver 5ª chamada sem repassar  671ms
 ✓ src/config/inventarioBibliografico.test.ts (5 tests) 33ms
 ✓ src/lib/matriz/esquema.test.ts (16 tests) 39ms
 ✓ src/lib/gee/consolidacaoInspecao.test.ts (4 tests) 74ms
 ✓ src/lib/gee/compostoSoloNu.test.ts (4 tests) 26ms
 ✓ src/lib/fundiario/matcher.test.ts (16 tests | 3 skipped) 73ms
 ✓ src/lib/autorizacao/logRecusas.test.ts (16 tests) 15ms
 ✓ src/lib/gee/estratificacao.test.ts (8 tests) 28ms
 ✓ src/lib/seguranca/cegamentoArtefatos.test.ts (5 tests) 4616ms
     ✓ nenhum arquivo sob controle de versão (git) deve conter simultaneamente código opaco VANT-BLIND-* e identificador de polígono D16_E_* (K2)  4367ms
 ✓ src/lib/padraoOuro/sitiosLocais.test.ts (8 tests) 79ms
stdout | src/lib/seguranca/provenienciaCaminhos.test.ts > Verificação automatizada de caminhos em docs/PROVENIENCIA_ASSISTENCIA_IA.md (Disciplina R1 / Regra 9) > todos os caminhos de repositório citados em docs/PROVENIENCIA_ASSISTENCIA_IA.md devem existir no disco
[C02] Caminhos citados em docs/PROVENIENCIA_ASSISTENCIA_IA.md ignorados pelo .gitignore (dado local legítimo fora do git): 2 [
  'docs/bibliografia/Pesquisas diretamente relacionadas/CNPS-DOC-246-2024.pdf',
  'data/dem_cache/Copernicus_DSM_COG_10_S26_00_W055_00_DEM.tif'
]

 ✓ src/lib/seguranca/provenienciaCaminhos.test.ts (3 tests) 851ms
     ✓ ehCaminhoIgnoradoGit: caminho com metacaracteres de shell não executa comando e conta como não ignorado  476ms
     ✓ todos os caminhos de repositório citados em docs/PROVENIENCIA_ASSISTENCIA_IA.md devem existir no disco  367ms
 ✓ src/lib/seguranca/diarioRequisicoes.test.ts (5 tests) 112ms
 ✓ src/lib/autorizacao/csvAutorizacoes.test.ts (15 tests) 20ms
 ✓ src/lib/fundiario/selecaoPontoElegivel.test.ts (7 tests) 14ms
 ✓ src/config/decisoes.parametros.test.ts (10 tests) 31ms
 ✓ src/lib/gee/persistenciaTemporal.test.ts (6 tests) 24ms
 ✓ src/lib/autorizacao/equipe.test.ts (15 tests) 519ms
 ✓ src/lib/rotulos/ingestaoColetor.test.ts (5 tests) 16ms
 ✓ src/lib/gee/serieTemporal.test.ts (12 tests) 46ms
 ✓ src/hooks/useModalA11y.test.ts (6 tests) 41ms
 ✓ src/lib/seguranca/verificacoes.test.ts (4 tests) 756ms
       ✓ toda afirmação VERIFICADO em código deve apontar para arquivo existente em docs/verificacoes/  737ms
 ✓ src/lib/fundiario/verificadorManifesto.test.ts (5 tests) 75ms
 ✓ src/lib/rotulos/rotuloHumano.test.ts (8 tests) 8ms
 ✓ src/lib/seguranca/gerarRelatorioFase.test.ts (6 tests) 59ms
 ✓ src/lib/fundiario/calculadoraDesenho.test.ts (5 tests) 48ms
 ✓ src/lib/seguranca/credenciaisSeguras.test.ts (11 tests) 78ms
 ✓ src/lib/seguranca/guardaSintetico.test.ts (3 tests) 11ms
 ✓ src/config/decisoes.test.ts (5 tests) 27ms
 ✓ src/lib/localizacao/localizacao.test.ts (8 tests) 13ms
 ✓ src/app/api/fundiario/status/route.test.ts (5 tests) 41ms
 ✓ src/lib/seguranca/importacoes.test.ts (4 tests) 792ms
       ✓ nenhum arquivo em src/ importa de legado/  773ms
 ✓ src/lib/tempo/datas.test.ts (4 tests) 385ms
     ✓ varre src e falha se sobrar toISOString().split('T')[0] ou .slice(0, 10) fora do utilitário e da lista fechada de exceções UTC  344ms
stderr | src/lib/gee/auth.test.ts > getGoogleAccessToken > nao repete error_description ao cliente quando a troca de token falha
[AUTH] Erro retornado pelo Google OAuth: invalid_grant Invalid grant: account not found

stderr | src/lib/gee/auth.test.ts > getGoogleAccessToken > nao repete error_description ao cliente quando a troca de token falha
[AUTH] Erro retornado pelo Google OAuth: invalid_grant Invalid grant: account not found

 ✓ src/lib/gee/auth.test.ts (4 tests) 68ms
 ✓ src/lib/fundiario/manifestoSanidade.test.ts (7 tests) 24ms
 ✓ src/lib/seguranca/detectorSequencia.test.ts (6 tests) 445ms
       ✓ nenhum artefato JSON ativo em docs/verificacoes deve conter séries numéricas com |r| > 0.95  432ms
 ✓ src/lib/seguranca/guardaImputacaoMediana.test.ts (2 tests) 1395ms
     ✓ varre scripts/ e src/ e falha se houver imputação por mediana fora de scripts/d25/ e do legado deprecado  1372ms
 ✓ src/lib/gee/versaoMotor.test.ts (8 tests) 26ms
 ✓ src/store/useSarelStore.test.ts (2 tests) 8ms
 ✓ src/components/layout/acoesCabecalho.test.ts (8 tests) 13ms
 ✓ src/components/layout/acessibilidadeAlvosERotulos.test.ts (6 tests) 39ms
 ✓ src/lib/gee/harmonicos.test.ts (3 tests) 10ms
 ✓ src/lib/rotulos/binarizacao.test.ts (9 tests) 15ms
 ✓ src/lib/matriz/perfisIntegridade.test.ts (19 tests) 13ms
 ✓ src/lib/seguranca/localOnly.test.ts (9 tests) 46ms
 ✓ src/lib/gee/estatisticasSerie.test.ts (4 tests) 9ms
 ✓ src/lib/gee/elegibilidade.test.ts (7 tests) 10ms
 ✓ src/app/api/gee/select-candidates/chuvaDecisao.test.ts (3 tests) 12ms
 ✓ src/lib/gee/blocosEspaciais.test.ts (5 tests) 13ms
 ✓ src/components/map/candidatoEspectral.test.ts (2 tests) 93ms
 ✓ src/lib/gee/thinning.test.ts (6 tests) 11ms
 ✓ src/config/decisoes.espelho.test.ts (4 tests) 95ms
 ✓ src/app/api/sitios-referencia/route.test.ts (4 tests) 194ms
 ✓ src/lib/gee/amostragemBiofisica.test.ts (5 tests) 8ms
 ✓ src/components/campanha/PainelCampanhaSelo.test.ts (4 tests) 29ms
 ✓ src/components/config/ApiTokensManagerN15.test.ts (2 tests) 27ms
 ✓ src/types/proveniencia.test.ts (3 tests) 409ms
     ✓ garante que nenhum chamador de produção em src/lib passa literal de data constante '2024-01-01'  349ms
 ✓ src/config/decisoesEmendas.test.ts (3 tests) 13ms
 ✓ src/components/map/PointPopupAvisos.test.ts (1 test) 21ms
 ✓ src/store/interfaceIntegration.test.ts (4 tests) 11ms
 ✓ src/config/decisoesParidade.test.ts (3 tests) 7ms
 ✓ src/components/decisoes/PainelCriterioRefutacaoD25.test.ts (3 tests) 23ms
 ✓ src/config/textosDefasadosC22.test.ts (3 tests) 19ms
 ✓ src/lib/gee/verificarPoolEstratosCli.test.ts (10 tests) 17917ms
     ✓ recusa execução sem --candidatos (exit code != 0)  2355ms
     ✓ recusa execução sem --reservas (exit code != 0)  1707ms
     ✓ recusa execução sem --n-minimo (exit code != 0)  1513ms
     ✓ recusa execução sem --taxas (exit code != 0)  1472ms
     ✓ recusa arquivo JSON sem lista de candidatos (objeto sem chave 'candidatos'), nomeando as chaves presentes  1466ms
     ✓ recusa arquivo JSON com lista de candidatos vazia (array raiz vazio ou propriedade vazia)  2862ms
     ✓ aceita JSON contendo objeto com propriedade candidatos povoada e executa com sucesso  1521ms
     ✓ recusa candidato sintético com a MESMA mensagem do sorteio D23  1483ms
     ✓ executa com conjunto de verificação, exibe aviso obrigatório no topo, não imprime coordenadas/CAR e NÃO grava em docs/verificacoes/sorteio  1877ms
     ✓ recusa argumento --saida apontando para docs/verificacoes/sorteio  1653ms
 ✓ src/config/tourMetodologico.test.ts (2 tests) 19ms
 ✓ src/config/readmeIntegridade.test.ts (2 tests) 7ms
 ✓ src/lib/seguranca/sessaoEfemera.test.ts (4 tests) 11ms
 ✓ src/lib/export/dms.test.ts (3 tests) 10ms
 ✓ src/lib/gee/aoiTiling.test.ts (3 tests) 8ms
 ✓ src/components/config/SettingsModalN15.test.ts (2 tests) 7ms
 ✓ src/config/areaInteresse.test.ts (1 test) 5ms

 Test Files  98 passed (98)
      Tests  831 passed | 3 skipped (834)
   Start at  14:09:08
   Duration  21.80s (transform 10.47s, setup 0ms, import 21.75s, tests 42.06s, environment 23ms)
```

---

## 3. Arquivos de Configuração do Vitest

### `vitest.config.mts`
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.vivo.test.ts"],
  },
});
```

### `vitest.vivo.config.mts`
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.vivo.test.ts"],
  },
});
```

---

## 4. Afirmações do Bloco Original Refutadas pela Medição

- Afirmação de que o comando de teste executado foi `vitest run --exclude "**/*.vivo.test.ts"` (linha 53): refutada pelo Comando 9 (`npm run test` executa `vitest run`, conforme script em package.json).
- Afirmação de versão `RUN v2.1.9` (linha 55): refutada pelo Comando 9 (executa `RUN v4.1.11`).
- Afirmação de existência e execução de testes sob `src/lib/geo/` (linhas 64, 67, 69, 77, 85, 101, 106, 108, 112, 113, 129, 144): refutada pelo Comando 4 (`git ls-files 'src/lib/geo/*' | wc -l` devolve 0), pelo Comando 3 (`geo` ausente de `src/lib/*`) e pelo Comando 1.
- Afirmação de existência e execução de testes sob `src/lib/amostragem/` (linhas 73, 76, 81, 82, 88, 92, 93, 94, 95, 99, 102, 103, 116, 117, 123, 130, 143, 147): refutada pelo Comando 5 (`git ls-files 'src/lib/amostragem/*' | wc -l` devolve 0), pelo Comando 3 (`amostragem` ausente de `src/lib/*`) e pelo Comando 1.
- Afirmação de existência e execução de testes sob `src/lib/estatistica/` (linha 79): refutada pelo Comando 6 (`git ls-files 'src/lib/estatistica/*' | wc -l` devolve 0), pelo Comando 3 (`estatistica` ausente de `src/lib/*`) e pelo Comando 1.
- Afirmação de existência e execução de `chirpsClient.test.ts`, `pluviometriaIat.test.ts` e `serieTemporalChirps.test.ts` sob `src/lib/chuva/` (linhas 60, 78, 100): refutada pelo Comando 7 (`src/lib/chuva/*` contém apenas `chirps.ts`, `chuva.test.ts`, `eventos.ts`, `imerg.ts`) e pelo Comando 1.
- Afirmação de que a árvore continha 96 arquivos de teste passando sob aquela listagem (linhas 154-155): refutada pelos Comandos 1, 2 e 9 (a contagem de arquivos de teste no repositório é 100, dos quais 98 são executados por `npm run test`, totalizando 831 aprovados e 3 pulados).

---

## 5. Explicação da Diferença 100 versus 98 Arquivos

- O Comando 2 registra 100 arquivos `*.test.ts` e `*.test.tsx` rastreados pelo repositório.
- O Comando 7b lista 2 arquivos com a terminação `.vivo.test.ts`: `src/lib/drone/planoVooNControl.vivo.test.ts` e `src/lib/fundiario/matcher.vivo.test.ts`.
- O arquivo `vitest.config.mts` (utilizado por `npm run test` / `vitest run`) define a regra `exclude: ["src/**/*.vivo.test.ts"]`.
- Consequentemente, `npm run test` executa 100 − 2 = 98 arquivos de teste, conforme registrado na saída do Comando 9 (`Test Files 98 passed (98)`).
- Os 2 arquivos com a terminação `.vivo.test.ts` são direcionados ao arquivo `vitest.vivo.config.mts`, que define `include: ["src/**/*.vivo.test.ts"]`, acionado pelo script `npm run test:vivo`.
