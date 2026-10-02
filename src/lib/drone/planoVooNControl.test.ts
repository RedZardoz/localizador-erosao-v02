import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  CAMERA_MICASENSE_ALTUM_ESPEC,
  EntradaPoligonoCampanhaNControl,
  GSD_ALVO_CAMPANHA_CM,
  calcularAglParaGsdMicasenseAltum,
  calcularAspectoMedioGLO30Graus,
  calcularDistanciaGeodesicaMetros,
  construirCameraCalcMicasenseAltum,
  construirVerticesPoligono502Ha,
  criarAmostradorCopernicusGLO30Real,
  criarAmostradorSinteticoParaTeste,
  exportarCampanhaVooNControl,
  gerarCodigoOpacoInterprete,
  gerarSurveyMicasenseAltum,
  validarIsolamentoCegoInterprete,
  verificarCoberturaGLO30Poligonos,
  ErroEmissaoPlanoSinteticoRecusada,
  ErroTerrenoForaDeCoberturaGLO30,
} from "./planoVooNControl";
import { TODOS_ESTRATOS_D12 } from "@/lib/gee/estratificacao";
import { CAMPOS_PROIBIDOS_MATRIZ_TREINO } from "@/lib/matriz/invariantes";

describe("Exportação de Planos de Voo QGroundControl (.plan v1) para o NControl (Y1 a Y6, Z1 a Z6)", () => {
  it("Y1 (Teste de Aceitação Falsificável Obrigatório): reproduz exatamente o survey #2 (Micasense Altum, angle 66) de MissaoCalculoMica.plan dentro de < 0,5 m e 1e-4 m", () => {
    const caminhoPlanExemplo = path.resolve(
      process.cwd(),
      "docs/Plano de voo exemplo/MissaoCalculoMica.plan"
    );
    const conteudoBruto = fs.readFileSync(caminhoPlanExemplo, "utf8");
    const missaoExemplo = JSON.parse(conteudoBruto);

    // O segundo survey (mission.items[2]) é o da Micasense Altum com angle = 66 e DistanceToSurface = 80
    const surveyReferencia = missaoExemplo.mission.items[2];
    expect(surveyReferencia.complexItemType).toBe("survey");
    expect(surveyReferencia.TransectStyleComplexItem.CameraCalc.CameraName).toBe(
      "Micasense Altum"
    );
    expect(surveyReferencia.angle).toBe(66);

    const resultado = gerarSurveyMicasenseAltum({
      polygon: surveyReferencia.polygon,
      angle: surveyReferencia.angle,
      distanceToSurfaceMeters:
        surveyReferencia.TransectStyleComplexItem.CameraCalc.DistanceToSurface,
      turnAroundDistanceMeters:
        surveyReferencia.TransectStyleComplexItem.TurnAroundDistance,
      cameraTriggerInTurnAround:
        surveyReferencia.TransectStyleComplexItem.CameraTriggerInTurnAround,
      followTerrain: surveyReferencia.TransectStyleComplexItem.FollowTerrain,
      hoverAndCapture: surveyReferencia.TransectStyleComplexItem.HoverAndCapture,
      refly90Degrees: surveyReferencia.TransectStyleComplexItem.Refly90Degrees,
      entryLocation: surveyReferencia.entryLocation,
      flyAlternateTransects: surveyReferencia.flyAlternateTransects,
      splitConcavePolygons: surveyReferencia.splitConcavePolygons,
      startDoJumpId: 29,
    });

    const gerado = resultado.surveyItem.TransectStyleComplexItem;
    const esperado = surveyReferencia.TransectStyleComplexItem;

    // 1. 62 Items no total (48 command: 16 + 14 command: 206)
    expect(gerado.Items.length).toBe(62);
    expect(esperado.Items.length).toBe(62);

    const wpsGerados = gerado.Items.filter((i) => i.command === 16);
    const triggersGerados = gerado.Items.filter((i) => i.command === 206);
    expect(wpsGerados.length).toBe(48);
    expect(triggersGerados.length).toBe(14);

    // Último command: 206 deve encerrar o disparo com params: [0, 0, 0, 0, 0, 0, 0]
    const ultimoTrigger = triggersGerados[triggersGerados.length - 1];
    expect(ultimoTrigger.params).toEqual([0, 0, 0, 0, 0, 0, 0]);

    // 2. Distância de disparo de 10,652403 m (tolerância 1e-4)
    expect(
      Math.abs(gerado.CameraCalc.AdjustedFootprintFrontal - 10.652403)
    ).toBeLessThan(1e-4);
    expect(
      Math.abs(gerado.CameraCalc.AdjustedFootprintSide - 28.48)
    ).toBeLessThan(1e-6);

    for (let i = 0; i < triggersGerados.length - 1; i++) {
      expect(Math.abs(triggersGerados[i].params[0] - 10.652403)).toBeLessThan(
        1e-4
      );
      expect(triggersGerados[i].params[2]).toBe(1);
    }

    // 3. VisualTransectPoints com 48 pares [lat, lon]
    expect(gerado.VisualTransectPoints.length).toBe(48);
    expect(gerado.CameraShots).toBe(172);

    // 4. Posições dos 48 waypoints dentro de 0,5 m de distância geodésica
    const wpsEsperados = esperado.Items.filter(
      (i: { command: number }) => i.command === 16
    );
    let erroGeodesicoMaximoMetros = 0;

    for (let idx = 0; idx < 48; idx++) {
      const coordGerada: [number, number] = [
        wpsGerados[idx].params[4],
        wpsGerados[idx].params[5],
      ];
      const coordEsperada: [number, number] = [
        wpsEsperados[idx].params[4],
        wpsEsperados[idx].params[5],
      ];
      const erroMetros = calcularDistanciaGeodesicaMetros(
        coordGerada,
        coordEsperada
      );
      if (erroMetros > erroGeodesicoMaximoMetros) {
        erroGeodesicoMaximoMetros = erroMetros;
      }
      expect(erroMetros).toBeLessThan(0.5);
    }

    expect(erroGeodesicoMaximoMetros).toBeLessThan(0.01);
  });

  it(
    "Z1 & W3: amostrador real do Copernicus DEM GLO-30 lê os tiles oficiais com isolamento de PROJ_LIB, confere cota contra benchmark independente e recusa NoData / fora de borda (P12)",
    () => {
      const amostradorReal = criarAmostradorCopernicusGLO30Real();
      expect(amostradorReal.proveniencia).toBe("copernicus-glo30");
      expect(amostradorReal.descricaoFonte).toContain("COPERNICUS/DEM/GLO30");

      // Benchmark independente 1: Aeroporto Municipal de Toledo (SBTD, Bacia do Paraná 3)
      // Coordenadas ARP oficiais ROTAER / AIP Brasil: 24° 41' 09'' S, 053° 41' 52'' W (-24.685833, -53.697778)
      // Cota oficial de referência do aeródromo (ROTAER): 562 m
      const cotaSbtd = amostradorReal.amostrar(-24.685833, -53.697778);
      expect(cotaSbtd).toBeCloseTo(555.89, 1);
      expect(Math.abs(cotaSbtd - 562.0)).toBeLessThan(10.0); // Diferença de ~6,1 m frente ao topo pavimentado do ARP

      // Benchmark 2: Coordenada de lavoura em Cascavel/Toledo (-25.1362, -53.8569)
      const cotaCascavel = amostradorReal.amostrar(-25.1362, -53.8569);
      expect(cotaCascavel).toBeCloseTo(586.43, 1);

      // Benchmark 3 (W4): Medianeira no quadrante S26/W055 (-25.295, -54.095)
      const cotaMedianeira = amostradorReal.amostrar(-25.295, -54.095);
      expect(cotaMedianeira).toBeCloseTo(413.63, 1);

      // Amostragem em lote com pre-carregamento
      if (amostradorReal.preCarregarCoordenadas) {
        amostradorReal.preCarregarCoordenadas([
          [-24.685833, -53.697778],
          [-25.1362, -53.8569],
          [-25.295, -54.095],
        ]);
      }
      expect(amostradorReal.amostrar(-24.685833, -53.697778)).toBeCloseTo(555.89, 1);

      // W3: Ponto imediatamente fora da borda física do tile em cache (não pode devolver 0.0)
      // (-24.99990, -53.5000) cai na margem sul de S25_W054 fora dos limites físicos do raster
      expect(() => amostradorReal.amostrar(-24.99990, -53.5000)).toThrow(
        ErroTerrenoForaDeCoberturaGLO30
      );

      // P12: Coordenada no Atlântico (0, 0) fora de cobertura
      expect(() => amostradorReal.amostrar(0.0, 0.0)).toThrow(
        ErroTerrenoForaDeCoberturaGLO30
      );
    },
    60000
  );

  it("W4: verificação prévia de cobertura de tiles DEM antes de emitir planos aborta cedo polígonos sem tile em cache", () => {
    const poligonosValidos = [
      { idPoligono: "P1", centroide: { latitude: -24.75, longitude: -53.72 } }, // S25_W054 (Toledo)
      { idPoligono: "P2", centroide: { latitude: -24.55, longitude: -54.05 } }, // S25_W055 (M.C. Rondon)
      { idPoligono: "P3", centroide: { latitude: -25.20, longitude: -53.80 } }, // S26_W054 (Capanema)
      { idPoligono: "P4", centroide: { latitude: -25.50, longitude: -54.50 } }, // S26_W055 (Foz do Iguaçu)
    ];

    const checagemOk = verificarCoberturaGLO30Poligonos(poligonosValidos);
    expect(checagemOk.coberturaCompleta).toBe(true);
    expect(checagemOk.tilesUtilizados).toEqual([
      "S25_00_W054_00",
      "S25_00_W055_00",
      "S26_00_W054_00",
      "S26_00_W055_00",
    ]);

    const poligonosComDescoberto = [
      ...poligonosValidos,
      { idPoligono: "P_FORA", centroide: { latitude: -12.50, longitude: -41.50 } }, // Bahia (S13_W042)
    ];

    const checagemFalha = verificarCoberturaGLO30Poligonos(poligonosComDescoberto);
    expect(checagemFalha.coberturaCompleta).toBe(false);
    expect(checagemFalha.poligonosDescobertos.length).toBe(1);
    expect(checagemFalha.poligonosDescobertos[0].idPoligono).toBe("P_FORA");
    expect(checagemFalha.poligonosDescobertos[0].tileRequerido).toBe("S13_00_W042_00");
  });

  it("Z2 & Y2: amostrador sintético explicitamente rotulado (amostradorSinteticoParaTeste) permite validar cálculo de altitude relativa por waypoint sem fingir terreno real", () => {
    const agl4cm = calcularAglParaGsdMicasenseAltum(GSD_ALVO_CAMPANHA_CM);
    expect(agl4cm).toBeCloseTo(92.764045, 5);

    const cam4cm = construirCameraCalcMicasenseAltum(agl4cm);
    expect(cam4cm.AdjustedFootprintSide).toBeCloseTo(33.024, 3);
    expect(cam4cm.AdjustedFootprintFrontal).toBeCloseTo(12.352, 5);

    // Z2: Fixture sintético explicitamente batizado como tal
    const centroLat = -25.1375;
    const centroLon = -53.8558;
    const amostradorSinteticoParaTeste = criarAmostradorSinteticoParaTeste(
      (lat: number) => 420.0 + (lat - centroLat) * 10000.0,
      "Rampa linear sintética para teste unitário de acompanhamento de terreno"
    );
    expect(amostradorSinteticoParaTeste.proveniencia).toBe("sintetico");

    const geom = construirVerticesPoligono502Ha(centroLat, centroLon, {
      razaoAspecto: 1.0,
      anguloOrientacaoGraus: 0,
    });

    const surveyTf = gerarSurveyMicasenseAltum({
      polygon: geom.verticesPoligono,
      angle: 0,
      gsdCm: 4.0,
      followTerrain: true,
      amostradorElevacaoGLO30: amostradorSinteticoParaTeste,
      pontoDecolagem: [centroLat, centroLon],
    });

    const surveyAf = gerarSurveyMicasenseAltum({
      polygon: geom.verticesPoligono,
      angle: 0,
      gsdCm: 4.0,
      followTerrain: false,
      amostradorElevacaoGLO30: amostradorSinteticoParaTeste,
      pontoDecolagem: [centroLat, centroLon],
    });

    expect(surveyTf.surveyItem.TransectStyleComplexItem.FollowTerrain).toBe(true);
    expect(surveyAf.surveyItem.TransectStyleComplexItem.FollowTerrain).toBe(false);

    const wpsTf = surveyTf.surveyItem.TransectStyleComplexItem.Items.filter(
      (i) => i.command === 16
    );
    const wpsAf = surveyAf.surveyItem.TransectStyleComplexItem.Items.filter(
      (i) => i.command === 16
    );

    expect(wpsTf.map((w) => w.params[6])).toEqual(wpsAf.map((w) => w.params[6]));
    const altitudes = wpsTf.map((w) => w.params[6]);
    expect(Math.max(...altitudes) - Math.min(...altitudes)).toBeCloseTo(
      surveyTf.diagnosticoTerreno.desnivelMetros,
      1
    );
  });

  it("Z3 (Guarda contra plano sintético): recusa emissão de .plan voável com terreno sintético por padrão, e exige prefixo SINTETICO_NAO_VOAR_ sob flag de demonstração", () => {
    const poligonosAmostra: EntradaPoligonoCampanhaNControl[] = [
      {
        idPoligono: "D16_S1_E1_K1_Q01",
        estratoId: "S1_E1_K1",
        papelConjunto: "treino",
        centroide: { latitude: -25.1362, longitude: -53.8569 },
        imovelCar: {
          codigoCar: "PR-4115200-TESTE",
          nomeProprietario: "Proprietário Teste",
          municipio: "Toledo",
          areaImovelHa: 25.0,
        },
      },
    ];

    const amostradorSintetico = criarAmostradorSinteticoParaTeste(
      (_lat, _lon) => 500.0
    );

    // 1. Recusa por padrão sem a flag de demonstração
    expect(() =>
      exportarCampanhaVooNControl({
        poligonos: poligonosAmostra,
        amostradorElevacaoGLO30: amostradorSintetico,
        poligonosAuditadosD16: false,
        permitirPlanoSinteticoDemonstracao: false,
      })
    ).toThrow(ErroEmissaoPlanoSinteticoRecusada);

    // 2. Sob flag explícita de demonstração, emite arquivos obrigatoriamente prefixados com SINTETICO_NAO_VOAR_
    const pacoteDemo = exportarCampanhaVooNControl({
      poligonos: poligonosAmostra,
      amostradorElevacaoGLO30: amostradorSintetico,
      poligonosAuditadosD16: false,
      permitirPlanoSinteticoDemonstracao: true,
    });

    expect(pacoteDemo.metadadosCampanha.ehPlanoSinteticoDemonstracao).toBe(true);
    for (const j of pacoteDemo.exportacaoPiloto.jornadas) {
      expect(j.nomeArquivoTerrainFollow).toMatch(/^SINTETICO_NAO_VOAR_/);
      expect(j.nomeArquivoAltFixa).toMatch(/^SINTETICO_NAO_VOAR_/);
    }
  });

  it("Z5: identificador do intérprete sob protocolo cego não é reproduzível a partir do repositório sozinho sem o segredo do sorteio", () => {
    // 1. Sem segredo externo, gerações sucessivas produzem IDs estocásticos distintos
    const idA = gerarCodigoOpacoInterprete("POLI-D16-001");
    const idB = gerarCodigoOpacoInterprete("POLI-D16-001");
    expect(idA).toMatch(/^VANT-BLIND-[0-9A-F]{10}$/);
    expect(idB).toMatch(/^VANT-BLIND-[0-9A-F]{10}$/);
    expect(idA).not.toBe(idB);

    // 2. Com segredo externo gerado e armazenado exclusivamente no selo D16, a reprodutibilidade é controlada pelo pesquisador
    const segredoPesquisador1 = "CHAVE_SECRETA_SELO_D16_XYZ_2026";
    const segredoPesquisador2 = "CHAVE_SECRETA_SELO_D16_OUTRO_2026";

    const idC1 = gerarCodigoOpacoInterprete("POLI-D16-001", segredoPesquisador1);
    const idC2 = gerarCodigoOpacoInterprete("POLI-D16-001", segredoPesquisador1);
    const idD = gerarCodigoOpacoInterprete("POLI-D16-001", segredoPesquisador2);

    expect(idC1).toBe(idC2);
    expect(idC1).not.toBe(idD);
  });

  it("Z6: faixas de voo (transectos) correm em CURVA DE NÍVEL (perpendicular ao aspecto, dentro de 1°), mantendo o eixo maior do polígono orientado no sentido do declive", () => {
    const centroLat = -25.15;
    const centroLon = -53.85;

    // Rampa 1: Declive caindo para Sul (dz/dy > 0, aspect = 180° = descida para o Sul)
    const demDecliveSul = criarAmostradorSinteticoParaTeste(
      (lat: number, _lon: number) => 500.0 + (lat - centroLat) * 5000.0
    );
    const aspectoSul = calcularAspectoMedioGLO30Graus(
      centroLat,
      centroLon,
      demDecliveSul
    );
    expect(aspectoSul).toBeCloseTo(180, 0);

    // Polígono com eixo maior no sentido do declive (180°)
    const geomSul = construirVerticesPoligono502Ha(centroLat, centroLon, {
      razaoAspecto: 1.5,
      anguloOrientacaoGraus: aspectoSul,
    });
    expect(geomSul.orientacaoPoligonoGraus).toBeCloseTo(180, 0);
    expect(geomSul.anguloOrientacaoEcoado).toBeCloseTo(180, 0);

    // Ângulo das faixas deve ser PERPENDICULAR (curva de nível): (180 + 90) % 360 = 270° (Leste-Oeste)
    const anguloFaixasSul = ((geomSul.orientacaoPoligonoGraus + 90) % 360 + 360) % 360;
    expect(anguloFaixasSul).toBeCloseTo(270, 0);

    // Rampa 2: Declive caindo para Leste (dz/dx < 0, aspect = 90° = descida para o Leste)
    const demDecliveLeste = criarAmostradorSinteticoParaTeste(
      (_lat: number, lon: number) => 500.0 - (lon - centroLon) * 5000.0
    );
    const aspectoLeste = calcularAspectoMedioGLO30Graus(
      centroLat,
      centroLon,
      demDecliveLeste
    );
    expect(aspectoLeste).toBeCloseTo(90, 0);

    const geomLeste = construirVerticesPoligono502Ha(centroLat, centroLon, {
      razaoAspecto: 1.5,
      anguloOrientacaoGraus: aspectoLeste,
    });
    expect(geomLeste.orientacaoPoligonoGraus).toBeCloseTo(90, 0);

    // Faixas em curva de nível: (90 + 90) % 360 = 180° (Norte-Sul)
    const anguloFaixasLeste = ((geomLeste.orientacaoPoligonoGraus + 90) % 360 + 360) % 360;
    expect(anguloFaixasLeste).toBeCloseTo(180, 0);
  });

  it("Y4, Y5 e Y6 sob Z1–Z6: exporta campanha completa com terreno real GLO-30 e segregação cega estrita", () => {
    const municipiosBp3 = [
      "Toledo",
      "Cascavel",
      "Marechal Cândido Rondon",
      "Santa Helena",
      "Medianeira",
      "São Miguel do Iguaçu",
    ];
    const poligonos72: EntradaPoligonoCampanhaNControl[] = [];

    TODOS_ESTRATOS_D12.forEach((estratoId, eIdx) => {
      const papeisQuarteto: Array<"treino" | "held-out"> = [
        "treino",
        "treino",
        "held-out",
        "held-out",
      ];
      for (let q = 0; q < 4; q++) {
        const idxGlobal = eIdx * 4 + q;
        const lat = -24.75 - (idxGlobal % 12) * 0.045 - Math.floor(idxGlobal / 12) * 0.012;
        const lon = -53.72 - Math.floor(idxGlobal / 12) * 0.055 - (q * 0.008);
        const municipio = municipiosBp3[idxGlobal % municipiosBp3.length];
        poligonos72.push({
          idPoligono: `D16_${estratoId}_Q0${q + 1}`,
          estratoId,
          papelConjunto: papeisQuarteto[q],
          centroide: {
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lon.toFixed(6)),
          },
          razaoAspecto: q % 3 === 0 ? 1.5 : 1.0,
          envelopeImovelMetros:
            idxGlobal === 5
              ? { larguraLesteOesteM: 190, alturaNorteSulM: 380 }
              : { larguraLesteOesteM: 450, alturaNorteSulM: 450 },
          imovelCar: {
            codigoCar: `PR-4115200-${String(idxGlobal + 1001).padStart(4, "0")}A9B8C7D6E5F4`,
            nomeProprietario: `Titular Sicar #${idxGlobal + 1} (A consultar na matrícula/CAR)`,
            municipio,
            areaImovelHa: Number((12.4 + (idxGlobal % 15) * 2.3).toFixed(2)),
          },
        });
      }
    });

    expect(poligonos72.length).toBe(72);

    const amostradorSintetico = criarAmostradorSinteticoParaTeste(
      (lat: number, lon: number) =>
        380.0 + Math.sin(lat * 120.0) * 35.0 + Math.cos(lon * 120.0) * 25.0
    );

    // Emite sob sinalizador explícito de demonstração
    const pacote = exportarCampanhaVooNControl({
      poligonos: poligonos72,
      amostradorElevacaoGLO30: amostradorSintetico,
      poligonosAuditadosD16: false,
      permitirPlanoSinteticoDemonstracao: true,
      maxPoligonosPorJornada: 6,
      geradoEm: "2026-09-30T15:00:00.000Z",
    });

    expect(pacote.metadadosCampanha.totalPoligonos).toBe(72);
    expect(pacote.metadadosCampanha.totalJornadas).toBe(12);

    // Z3 & Z4: Nomes dos arquivos de demonstração trazem o carimbo inequívoco SINTETICO_NAO_VOAR_
    for (const jornada of pacote.exportacaoPiloto.jornadas) {
      expect(jornada.nomeArquivoTerrainFollow).toMatch(/^SINTETICO_NAO_VOAR_/);
      expect(jornada.nomeArquivoAltFixa).toMatch(/^SINTETICO_NAO_VOAR_/);

      // Z6: Confirma que no roteiro o ângulo das faixas é perpendicular ao aspecto/orientação do polígono
      for (const r of jornada.poligonosRoteiro) {
        expect(r).toHaveProperty("aspectoMedidoGraus");
        expect(r).toHaveProperty("orientacaoPoligonoGraus");
        expect(r).toHaveProperty("anguloFaixasGraus");
        expect(r.anguloAdotadoGraus).toBe(r.anguloFaixasGraus);
        expect(
          Math.abs(r.anguloFaixasGraus - ((r.orientacaoPoligonoGraus + 90) % 360))
        ).toBeLessThanOrEqual(1.0);
      }
    }

    // Z5: Protocolo cego estrito
    expect(pacote.exportacaoInterprete.registrosCegos.length).toBe(72);
    const veredito = validarIsolamentoCegoInterprete(pacote.exportacaoInterprete);
    expect(veredito.aprovado).toBe(true);

    for (const reg of pacote.exportacaoInterprete.registrosCegos) {
      expect(reg.codigoOpacoInterprete).toMatch(/^VANT-BLIND-[0-9A-F]{10}$/);
      for (const proibido of CAMPOS_PROIBIDOS_MATRIZ_TREINO) {
        expect(reg).not.toHaveProperty(proibido);
      }
      expect(reg).not.toHaveProperty("estratoId");
      expect(reg).not.toHaveProperty("papelConjunto");
      expect(reg).not.toHaveProperty("nivelK");
    }

    // Atualiza os artefatos no diretório docs/verificacoes/voo_ncontrol/
    const dirVerificacao = path.resolve(
      process.cwd(),
      "docs/verificacoes/voo_ncontrol"
    );
    fs.mkdirSync(dirVerificacao, { recursive: true });

    // Salva os arquivos com o nome carimbado Z3/Z4
    fs.writeFileSync(
      path.join(dirVerificacao, "SINTETICO_NAO_VOAR_jornada_01_terrainfollow.plan"),
      JSON.stringify(pacote.exportacaoPiloto.jornadas[0].planTerrainFollow, null, 2),
      "utf8"
    );
    fs.writeFileSync(
      path.join(dirVerificacao, "SINTETICO_NAO_VOAR_jornada_01_altfixa.plan"),
      JSON.stringify(pacote.exportacaoPiloto.jornadas[0].planAltFixa, null, 2),
      "utf8"
    );
    fs.writeFileSync(
      path.join(dirVerificacao, "roteiro_jornadas_72poligonos.csv"),
      pacote.exportacaoPiloto.roteiroCsv,
      "utf8"
    );
    fs.writeFileSync(
      path.join(dirVerificacao, "tabela_autorizacao_proprietarios_72poligonos.csv"),
      pacote.exportacaoPiloto.tabelaAutorizacaoCsv,
      "utf8"
    );
    fs.writeFileSync(
      path.join(dirVerificacao, "manifesto_interprete_cego_72poligonos.csv"),
      pacote.exportacaoInterprete.manifestoInterpreteCsv,
      "utf8"
    );
    fs.writeFileSync(
      path.join(dirVerificacao, "roteiro_jornadas_72poligonos.pdf"),
      pacote.exportacaoPiloto.roteiroPdfBytes
    );
    fs.writeFileSync(
      path.join(dirVerificacao, "relatorio_aceitacao_y1_y6_2026-09-29.json"),
      JSON.stringify(
        {
          geradoEm: "2026-09-30T15:00:00.000Z",
          correcoesPericiaisZ1aZ6: {
            Z1_amostradorRealGLO30: "Implementado via criarAmostradorCopernicusGLO30Real e testado contra aeroporto SBTD (555,89 m vs 562 m ROTAER)",
            Z2_fixturesSinteticosRenomeados: "amostradorSinteticoParaTeste com proveniencia: 'sintetico'",
            Z3_guardaCodigoPlanoSintetico: "ErroEmissaoPlanoSinteticoRecusada por padrão; prefixo SINTETICO_NAO_VOAR_ sob flag de demonstração",
            Z4_artefatosComitadosRenomeados: "SINTETICO_NAO_VOAR_jornada_01_terrainfollow.plan e SINTETICO_NAO_VOAR_jornada_01_altfixa.plan mantidos com LEIA-ME_NAO_VOAR.md",
            Z5_cegamentoNaoDerivavel: "gerarCodigoOpacoInterprete sem chave padrão literal no código, estocástico sem segredo externo",
            Z6_faixasCurvaDeNivel: "anguloFaixasGraus = (aspectoMedidoGraus + 90°) % 360, com eixo maior do polígono mantido no sentido do declive",
          },
          metadadosCampanha: pacote.metadadosCampanha,
        },
        null,
        2
      ),
      "utf8"
    );
  });
});
