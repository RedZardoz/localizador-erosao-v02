// GeoJSON Polygons for Major Hydrographic Basins in Paraná
export const paranaBasinsGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "basin-tibagi",
      properties: {
        name: "Bacia do Rio Tibagi",
        code: "TIB",
        area_km2: 24715,
        color: "#0284C7", // Sky blue
        mainCities: "Londrina, Ponta Grossa, Telêmaco Borba, Arapongas, Apucarana",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-51.40, -22.75],
            [-50.80, -23.10],
            [-50.40, -23.80],
            [-50.10, -24.40],
            [-50.00, -25.20],
            [-50.40, -25.30],
            [-50.90, -24.80],
            [-51.30, -24.10],
            [-51.60, -23.40],
            [-51.40, -22.75],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "basin-ivai",
      properties: {
        name: "Bacia do Rio Ivaí",
        code: "IVA",
        area_km2: 36540,
        color: "#10B981", // Emerald
        mainCities: "Maringá, Cianorte, Campo Mourão, Umuarama, Prudentópolis",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-53.70, -23.25],
            [-52.60, -23.20],
            [-51.80, -23.40],
            [-51.30, -24.10],
            [-50.90, -24.80],
            [-51.20, -25.25],
            [-52.10, -24.90],
            [-52.80, -24.40],
            [-53.40, -23.80],
            [-53.70, -23.25],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "basin-paranapanema",
      properties: {
        name: "Bacia do Rio Paranapanema / Pirapó",
        code: "PAN",
        area_km2: 39800,
        color: "#F59E0B", // Amber
        mainCities: "Paranavaí, Cornélio Procópio, Jacarezinho, Santo Antônio da Platina",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-53.40, -22.85],
            [-52.95, -22.52],
            [-51.85, -22.65],
            [-50.45, -22.95],
            [-49.60, -23.40],
            [-49.95, -23.90],
            [-50.80, -23.10],
            [-51.80, -23.40],
            [-52.60, -23.20],
            [-53.40, -22.85],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "basin-iguacu",
      properties: {
        name: "Bacia do Rio Iguaçu",
        code: "IGU",
        area_km2: 54820,
        color: "#8B5CF6", // Purple
        mainCities: "Guarapuava, Pato Branco, Francisco Beltrão, União da Vitória, Curitiba",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-54.60, -25.50],
            [-53.75, -25.80],
            [-52.55, -26.40],
            [-51.40, -26.25],
            [-50.10, -26.15],
            [-49.00, -25.95],
            [-49.20, -25.30],
            [-50.20, -25.40],
            [-51.20, -25.25],
            [-52.60, -25.40],
            [-53.80, -25.40],
            [-54.60, -25.50],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "basin-piquiri",
      properties: {
        name: "Bacia do Rio Piquiri / Paraná 3",
        code: "PIQ",
        area_km2: 24150,
        color: "#EC4899", // Pink
        mainCities: "Cascavel, Toledo, Palotina, Goioerê, Ubiratã",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-54.25, -24.01],
            [-53.70, -23.25],
            [-53.40, -23.80],
            [-52.80, -24.40],
            [-52.60, -25.40],
            [-53.80, -25.40],
            [-54.40, -24.80],
            [-54.25, -24.01],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "basin-litoral",
      properties: {
        name: "Bacia Litorânea & Ribeira",
        code: "LIT",
        area_km2: 14780,
        color: "#06B6D4", // Cyan
        mainCities: "Paranaguá, Antonina, Morretes, Guaratuba, Cerro Azul",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-49.30, -23.85],
            [-48.50, -24.70],
            [-48.15, -25.05],
            [-48.40, -25.55],
            [-48.60, -25.90],
            [-49.00, -25.95],
            [-49.20, -25.30],
            [-49.60, -24.60],
            [-49.30, -23.85],
          ],
        ],
      },
    },
  ],
};
