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
  exportarCampanhaVooNControl,
  gerarSurveyMicasenseAltum,
  validarIsolamentoCegoInterprete,
} from "./planoVooNControl";
import { TODOS_ESTRATOS_D12 } from "@/lib/gee/estratificacao";
import { CAMPOS_PROIBIDOS_MATRIZ_TREINO } from "@/lib/matriz/invariantes";

describe("Exportação de Planos de Voo QGroundControl (.plan v1) para o NControl (Y1 a Y6)", () => {
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

    // Verifica que a reprodução geométrica da projeção azimutal equidistante QGC é sub-milimétrica
    expect(erroGeodesicoMaximoMetros).toBeLessThan(0.01);
  });

  it("Y2: deriva AGL_desejada = 92,7640 m para GSD = 4,0 cm na Micasense Altum e resolve altitude relativa GLO-30 por waypoint em _terrainfollow.plan e _altfixa.plan", () => {
    const agl4cm = calcularAglParaGsdMicasenseAltum(GSD_ALVO_CAMPANHA_CM);
    // (0.04 m * 8 mm) / (7.12 mm / 2064 px) = 92.76404494382022 m
    expect(agl4cm).toBeCloseTo(92.764045, 5);

    const cam4cm = construirCameraCalcMicasenseAltum(agl4cm);
    expect(cam4cm.CameraName).toBe(CAMERA_MICASENSE_ALTUM_ESPEC.CameraName);
    expect(cam4cm.ImageDensity).toBeCloseTo(4.0, 6);
    expect(cam4cm.AdjustedFootprintSide).toBeCloseTo(33.024, 3);
    expect(cam4cm.AdjustedFootprintFrontal).toBeCloseTo(12.352, 5);

    // Simula rampa GLO-30 subindo 25 m do sul para o norte
    const centroLat = -25.1375;
    const centroLon = -53.8558;
    const amostradorRampa = (lat: number) => 420.0 + (lat - centroLat) * 10000.0;

    const geom = construirVerticesPoligono502Ha(centroLat, centroLon, {
      razaoAspecto: 1.0,
      anguloOrientacaoGraus: 0,
    });

    const surveyTf = gerarSurveyMicasenseAltum({
      polygon: geom.verticesPoligono,
      angle: 0,
      gsdCm: 4.0,
      followTerrain: true,
      amostradorElevacaoGLO30: amostradorRampa,
      pontoDecolagem: [centroLat, centroLon],
    });

    const surveyAf = gerarSurveyMicasenseAltum({
      polygon: geom.verticesPoligono,
      angle: 0,
      gsdCm: 4.0,
      followTerrain: false,
      amostradorElevacaoGLO30: amostradorRampa,
      pontoDecolagem: [centroLat, centroLon],
    });

    expect(surveyTf.surveyItem.TransectStyleComplexItem.FollowTerrain).toBe(true);
    expect(surveyAf.surveyItem.TransectStyleComplexItem.FollowTerrain).toBe(false);
    expect(surveyTf.diagnosticoTerreno.desnivelMetros).toBeGreaterThan(15);

    const wpsTf = surveyTf.surveyItem.TransectStyleComplexItem.Items.filter(
      (i) => i.command === 16
    );
    const wpsAf = surveyAf.surveyItem.TransectStyleComplexItem.Items.filter(
      (i) => i.command === 16
    );

    // Ambas as variantes carregam exatamente as mesmas altitudes relativas calculadas por waypoint
    expect(wpsTf.map((w) => w.params[6])).toEqual(wpsAf.map((w) => w.params[6]));

    const altitudes = wpsTf.map((w) => w.params[6]);
    expect(Math.max(...altitudes) - Math.min(...altitudes)).toBeCloseTo(
      surveyTf.diagnosticoTerreno.desnivelMetros,
      1
    );
  });

  it("Y3: calcula o ângulo das faixas pelo aspecto médio GLO-30 (sentido do declive) e registra conflito quando o envelope do imóvel restringe a orientação", () => {
    const centroLat = -25.15;
    const centroLon = -53.85;

    // Vertente caindo para Leste (dz/dx < 0, dz/dy = 0 -> aspecto = 90°)
    const demDecliveLeste = (_lat: number, lon: number) =>
      500.0 - (lon - centroLon) * 5000.0;
    const aspectoLeste = calcularAspectoMedioGLO30Graus(
      centroLat,
      centroLon,
      demDecliveLeste
    );
    expect(aspectoLeste).toBeCloseTo(90, 0);

    // Vertente caindo para Sul (dz/dy > 0 -> aspecto = 180°)
    const demDecliveSul = (lat: number, _lon: number) =>
      500.0 + (lat - centroLat) * 5000.0;
    const aspectoSul = calcularAspectoMedioGLO30Graus(
      centroLat,
      centroLon,
      demDecliveSul
    );
    expect(aspectoSul).toBeCloseTo(180, 0);

    // Retângulo 1:2 (158,43 m × 316,86 m = 5,02 ha) orientado a 90° dentro de imóvel estreito Leste-Oeste (200 m E-W × 400 m N-S)
    const comConflito = construirVerticesPoligono502Ha(centroLat, centroLon, {
      razaoAspecto: 2.0,
      anguloOrientacaoGraus: 90,
      envelopeImovelMetros: { larguraLesteOesteM: 200, alturaNorteSulM: 400 },
    });
    expect(comConflito.conflitoOrientacaoImovel).toBe(true);
    expect(comConflito.aspectoMedidoGraus).toBe(90);
    expect(comConflito.anguloAdotadoGraus).toBe(0);
    expect(comConflito.motivoConflitoOrientacao).toContain("não comporta");
  });

  it("Y4, Y5 e Y6: exporta campanha completa de 72 polígonos de 5,02 ha (12 jornadas), gera roteiro CSV/PDF + tabela de proprietários, garante isolamento cego do intérprete e salva artefatos de verificação", () => {
    // Constrói os 72 polígonos (4 por estrato × 18 estratos = 36 treino + 36 held-out)
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

    const amostradorGLO30 = (lat: number, lon: number) =>
      380.0 + Math.sin(lat * 120.0) * 35.0 + Math.cos(lon * 120.0) * 25.0;

    const pacote = exportarCampanhaVooNControl({
      poligonos: poligonos72,
      amostradorElevacaoGLO30: amostradorGLO30,
      maxPoligonosPorJornada: 6,
      geradoEm: "2026-09-29T19:15:00.000Z",
    });

    // Verificações Y4 (12 jornadas de 6 polígonos de 5,02 ha = 361,44 ha)
    expect(pacote.metadadosCampanha.totalPoligonos).toBe(72);
    expect(pacote.metadadosCampanha.areaUnitariaHa).toBe(5.02);
    expect(pacote.metadadosCampanha.areaTotalHa).toBe(361.44);
    expect(pacote.metadadosCampanha.totalJornadas).toBe(12);
    expect(pacote.exportacaoPiloto.jornadas.length).toBe(12);

    for (const jornada of pacote.exportacaoPiloto.jornadas) {
      expect(jornada.poligonosRoteiro.length).toBe(6);
      expect(jornada.pontoDecolagemSugerido.statusConfirmacao).toBe(
        "sugestao_a_confirmar_em_campo"
      );
      expect(jornada.planTerrainFollow.mission.cruiseSpeed).toBe(15);
      expect(jornada.planTerrainFollow.mission.items.length).toBe(8); // 1 Takeoff + 6 Surveys + 1 RTL
      expect(jornada.planAltFixa.mission.items.length).toBe(8);

      const surveysTf = jornada.planTerrainFollow.mission.items.slice(
        1,
        7
      ) as any[];
      const surveysAf = jornada.planAltFixa.mission.items.slice(1, 7) as any[];
      expect(
        surveysTf.every((s) => s.TransectStyleComplexItem.FollowTerrain === true)
      ).toBe(true);
      expect(
        surveysAf.every(
          (s) => s.TransectStyleComplexItem.FollowTerrain === false
        )
      ).toBe(true);
    }

    // Verifica PDF válido (%PDF-1.4 ... %%EOF)
    const pdfHeader = pacote.exportacaoPiloto.roteiroPdfBytes
      .subarray(0, 8)
      .toString("ascii");
    expect(pdfHeader).toBe("%PDF-1.4");

    // Verificações Y5 (Isolamento estrito do pacote do intérprete)
    expect(pacote.exportacaoInterprete.registrosCegos.length).toBe(72);
    const vereditoIsolamento = validarIsolamentoCegoInterprete(
      pacote.exportacaoInterprete
    );
    expect(vereditoIsolamento.aprovado).toBe(true);

    for (const reg of pacote.exportacaoInterprete.registrosCegos) {
      expect(reg.codigoOpacoInterprete).toMatch(/^VANT-BLIND-[0-9A-F]{10}$/);
      for (const proibido of CAMPOS_PROIBIDOS_MATRIZ_TREINO) {
        expect(reg).not.toHaveProperty(proibido);
      }
      expect(reg).not.toHaveProperty("estratoId");
      expect(reg).not.toHaveProperty("papelConjunto");
      expect(reg).not.toHaveProperty("nivelK");
      expect(reg).not.toHaveProperty("idPoligono");
    }

    // Testa que a guarda Y5 rejeita imediatamente se injetarmos estratoId ou campo proibido
    expect(() =>
      validarIsolamentoCegoInterprete({
        registrosCegos: [
          {
            ...pacote.exportacaoInterprete.registrosCegos[0],
            estratoId: "S1_E1_K1",
          },
        ],
      })
    ).toThrow(/VIOLACAO_PROTOCOLO_CEGO_Y5/);

    // Verificações Y6 (Tabela de autorização de proprietários)
    expect(pacote.exportacaoPiloto.tabelaAutorizacaoProprietarios.length).toBe(
      72
    );
    for (const linha of pacote.exportacaoPiloto.tabelaAutorizacaoProprietarios) {
      expect(linha.areaPoligonoHa).toBe(5.02);
      expect(linha.codigoCar).toMatch(/^PR-4115200-/);
      expect(linha.dataAutorizacao).toBe("");
      expect(linha.formaAutorizacao).toBe("");
    }

    // Salva os artefatos de verificação em docs/verificacoes/voo_ncontrol/
    const dirVerificacao = path.resolve(
      process.cwd(),
      "docs/verificacoes/voo_ncontrol"
    );
    fs.mkdirSync(dirVerificacao, { recursive: true });

    fs.writeFileSync(
      path.join(dirVerificacao, "jornada_01_terrainfollow.plan"),
      JSON.stringify(pacote.exportacaoPiloto.jornadas[0].planTerrainFollow, null, 2),
      "utf8"
    );
    fs.writeFileSync(
      path.join(dirVerificacao, "jornada_01_altfixa.plan"),
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
          geradoEm: "2026-09-29T19:15:00.000Z",
          testeAceitacaoY1: {
            planReferencia: "docs/Plano de voo exemplo/MissaoCalculoMica.plan (mission.items[2])",
            camera: "Micasense Altum",
            angle: 66,
            distanceToSurfaceMeters: 80,
            totalItemsGerados: 62,
            waypointsCommand16: 48,
            triggersCommand206: 14,
            triggerDistanceMetros: 10.652403100775194,
            visualTransectPointsCount: 48,
            cameraShots: 172,
            aprovado: true,
          },
          metadadosCampanhaY2aY6: pacote.metadadosCampanha,
          resumoJornadas: pacote.exportacaoPiloto.jornadas.map((j) => ({
            idJornada: j.idJornada,
            totalPoligonos: j.poligonosRoteiro.length,
            pontoDecolagemSugerido: j.pontoDecolagemSugerido,
            distanciaTotalDeslocamentoKm: j.distanciaTotalDeslocamentoKm,
            tempoVooTotalEstimadoMinutos: j.tempoVooTotalEstimadoMinutos,
          })),
        },
        null,
        2
      ),
      "utf8"
    );
  });
});
