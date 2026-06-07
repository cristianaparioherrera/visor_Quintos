// ======================================================
// VISOR TFG - QUINTOS DE MORA
// ArcGIS Maps SDK for JavaScript 4.34
// ======================================================

// Control de carga para comprobar que el navegador está leyendo esta versión
console.log("Visor Quintos - main.js v5 cargado");

// Imports principales
const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer.js");

// ------------------------------------------------------
// Referencia al componente arcgis-map del HTML
// ------------------------------------------------------

const arcgisMap = document.querySelector("arcgis-map");

// ------------------------------------------------------
// URLs del servicio publicado en ArcGIS Online
// ------------------------------------------------------

const URL_BASE =
  "https://services5.arcgis.com/zZdalPw2d0tQx8G1/arcgis/rest/services/Visor_Quintos_Capas/FeatureServer";

const URL_PLANTAS = `${URL_BASE}/0`;
const URL_PARCHES = `${URL_BASE}/1`;
const URL_CERCADOS = `${URL_BASE}/2`;

// ------------------------------------------------------
// Renderers
// ------------------------------------------------------

const rendererEspecies = {
  type: "unique-value",
  field: "Nom_Esp",
  uniqueValueInfos: [
    {
      value: "Quercus ilex",
      label: "Quercus ilex",
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [56, 168, 0, 0.95],
        size: 7,
        outline: {
          color: [255, 255, 255, 0.95],
          width: 0.8,
        },
      },
    },
    {
      value: "Cistus ladanifer",
      label: "Cistus ladanifer",
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [190, 80, 220, 0.95],
        size: 7,
        outline: {
          color: [255, 255, 255, 0.95],
          width: 0.8,
        },
      },
    },
    {
      value: "Salvia rosmarinus",
      label: "Salvia rosmarinus",
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [80, 150, 255, 0.95],
        size: 7,
        outline: {
          color: [255, 255, 255, 0.95],
          width: 0.8,
        },
      },
    },
    {
      value: "Erica arborea",
      label: "Erica arborea",
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [255, 155, 70, 0.95],
        size: 7,
        outline: {
          color: [255, 255, 255, 0.95],
          width: 0.8,
        },
      },
    },
    {
      value: "Erica australis",
      label: "Erica australis",
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [255, 90, 190, 0.95],
        size: 7,
        outline: {
          color: [255, 255, 255, 0.95],
          width: 0.8,
        },
      },
    },
    {
      value: "Erica scoparia",
      label: "Erica scoparia",
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [80, 220, 190, 0.95],
        size: 7,
        outline: {
          color: [255, 255, 255, 0.95],
          width: 0.8,
        },
      },
    },
  ],
  defaultSymbol: null,
};

const rendererParches = {
  type: "simple",
  symbol: {
    type: "simple-fill",
    color: [255, 214, 0, 0.25],
    outline: {
      color: [255, 170, 0, 0.95],
      width: 1.4,
    },
  },
};

const rendererCercados = {
  type: "simple",
  symbol: {
    type: "simple-fill",
    color: [235, 25, 25, 0],
    outline: {
      color: [235, 25, 25, 1],
      width: 1.8,
    },
  },
};

const rendererPlantasSuave = {
  type: "simple",
  symbol: {
    type: "simple-marker",
    style: "circle",
    color: [255, 255, 255, 0.65],
    size: 5,
    outline: {
      color: [40, 40, 40, 0.65],
      width: 0.5,
    },
  },
};

// ------------------------------------------------------
// Popups: funciones auxiliares
// ------------------------------------------------------

const indicesPopup = ["NDVI", "PRI", "SR", "SIPI", "SRPI", "NDPI", "WI"];

function safeText(value, fallback = "Sin dato") {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "NA" ||
    value === "NaN"
  ) {
    return fallback;
  }

  return value;
}

function formatValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "NA" ||
    value === "NaN"
  ) {
    return "Sin dato";
  }

  const numberValue = Number(String(value).replace(",", "."));

  if (!Number.isFinite(numberValue)) {
    return "Sin dato";
  }

  return numberValue.toFixed(3).replace(".", ",");
}

function normalizarTexto(value) {
  return String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getCodigoCercado(value) {
  const texto = normalizarTexto(value);

  if (
    /(^|[\s_\-])CG($|[\s_\-])/.test(texto) ||
    texto.includes("CONTROL GRANDE")
  ) {
    return "CG";
  }

  const textoLimpio = texto
    .replace("CERCADO", "")
    .replace("PARCHE", "")
    .replace("HIPERESPECTRAL", "")
    .replace("VUELO", "")
    .trim();

  if (/(^|[\s_\-])A($|[\s_\-])/.test(textoLimpio) || textoLimpio === "A") {
    return "A";
  }

  if (/(^|[\s_\-])B($|[\s_\-])/.test(textoLimpio) || textoLimpio === "B") {
    return "B";
  }

  if (/(^|[\s_\-])C($|[\s_\-])/.test(textoLimpio) || textoLimpio === "C") {
    return "C";
  }

  return null;
}

function getCercadoInfo(value) {
  const codigo = getCodigoCercado(value);

  if (codigo === "CG") {
    return {
      codigo: "CG",
      nombre: "Cercado CG",
      densidad: "Control grande",
      descripcion:
        "Cercado experimental correspondiente al tratamiento de control grande.",
    };
  }

  if (codigo === "A") {
    return {
      codigo: "A",
      nombre: "Cercado A",
      densidad: "Densidad alta",
      descripcion:
        "Cercado experimental asociado a una situación de densidad alta de ciervos.",
    };
  }

  if (codigo === "B") {
    return {
      codigo: "B",
      nombre: "Cercado B",
      densidad: "Hiperdensidad",
      descripcion:
        "Cercado experimental asociado a una situación de hiperdensidad de ciervos.",
    };
  }

  if (codigo === "C") {
    return {
      codigo: "C",
      nombre: "Cercado C",
      densidad: "Control",
      descripcion:
        "Cercado experimental correspondiente al tratamiento de control.",
    };
  }

  return {
    codigo: null,
    nombre: safeText(value, "Cercado experimental"),
    densidad: "Sin clasificar",
    descripcion: "Cercado experimental sin clasificación asignada.",
  };
}

function aplicarEstilos(elemento, estilos) {
  Object.assign(elemento.style, estilos);
  return elemento;
}

function crearDiv(estilos = {}) {
  return aplicarEstilos(document.createElement("div"), estilos);
}

function crearTexto(texto, estilos = {}) {
  const div = crearDiv(estilos);
  div.textContent = texto;
  return div;
}

function crearFilaInfo(etiqueta, valor, opciones = {}) {
  const fila = crearDiv({
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    columnGap: "16px",
    alignItems: "start",
    marginBottom: "7px",
  });

  const label = crearTexto(etiqueta, {
    fontWeight: "700",
    color: "#7cc7ff",
    fontSize: "12px",
    letterSpacing: "0.1px",
  });

  const value = crearDiv({
    color: "#eeeeee",
    fontSize: "12px",
    lineHeight: "1.35",
  });

  if (opciones.italica) {
    const em = document.createElement("em");
    em.textContent = safeText(valor);
    value.appendChild(em);
  } else {
    value.textContent = safeText(valor);
  }

  fila.appendChild(label);
  fila.appendChild(value);

  return fila;
}

function crearSeccion(titulo, colorBorde = "#7cc7ff") {
  const seccion = crearDiv({
    marginBottom: "12px",
    padding: "10px 12px",
    borderLeft: `4px solid ${colorBorde}`,
    background: "rgba(255, 255, 255, 0.06)",
    borderRadius: "7px",
  });

  const tituloEl = crearTexto(titulo, {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "9px",
  });

  seccion.appendChild(tituloEl);
  return seccion;
}

function crearTablaIndices(attributes) {
  const contenedor = crearDiv({
    padding: "10px 12px",
    background: "rgba(255, 255, 255, 0.045)",
    borderRadius: "7px",
    borderLeft: "4px solid #9be37a",
  });

  const titulo = crearTexto("Índices espectrales por sensor", {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "9px",
  });

  const tabla = document.createElement("table");
  aplicarEstilos(tabla, {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
  });

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  ["Índice", "Dron", "Radiómetro"].forEach((texto, index) => {
    const th = document.createElement("th");
    th.textContent = texto;
    aplicarEstilos(th, {
      padding: "6px 8px",
      textAlign: index === 0 ? "left" : "right",
      color: "#9be37a",
      fontWeight: "700",
      borderBottom: "1px solid rgba(255,255,255,0.28)",
      whiteSpace: "nowrap",
    });
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  tabla.appendChild(thead);

  const tbody = document.createElement("tbody");

  indicesPopup.forEach((indice) => {
    const tr = document.createElement("tr");

    const tdIndice = document.createElement("td");
    tdIndice.textContent = indice;
    aplicarEstilos(tdIndice, {
      padding: "6px 8px",
      fontWeight: "700",
      color: "#ffffff",
      borderBottom: "1px solid rgba(255,255,255,0.12)",
    });

    const tdDron = document.createElement("td");
    tdDron.textContent = formatValue(attributes[`${indice}_DRON`]);
    aplicarEstilos(tdDron, {
      padding: "6px 8px",
      textAlign: "right",
      color: "#d7d7d7",
      fontVariantNumeric: "tabular-nums",
      borderBottom: "1px solid rgba(255,255,255,0.12)",
    });

    const tdRad = document.createElement("td");
    tdRad.textContent = formatValue(attributes[`${indice}_RAD`]);
    aplicarEstilos(tdRad, {
      padding: "6px 8px",
      textAlign: "right",
      color: "#d7d7d7",
      fontVariantNumeric: "tabular-nums",
      borderBottom: "1px solid rgba(255,255,255,0.12)",
    });

    tr.appendChild(tdIndice);
    tr.appendChild(tdDron);
    tr.appendChild(tdRad);
    tbody.appendChild(tr);
  });

  tabla.appendChild(tbody);

  contenedor.appendChild(titulo);
  contenedor.appendChild(tabla);

  return contenedor;
}

// ------------------------------------------------------
// Popups
// ------------------------------------------------------

const popupPlantas = {
  title: "Planta {id}",
  outFields: ["*"],
  content: function (feature) {
    const a = feature.graphic.attributes;
    const infoCercado = getCercadoInfo(a.Cercado);

    const card = crearDiv({
      width: "350px",
      maxWidth: "100%",
      boxSizing: "border-box",
      fontFamily: "Arial, Helvetica, sans-serif",
    });

    const seccionInfo = crearSeccion("Información de la planta", "#7cc7ff");

    seccionInfo.appendChild(crearFilaInfo("ID planta", a.id));
    seccionInfo.appendChild(crearFilaInfo("Especie", a.Nom_Esp, { italica: true }));
    seccionInfo.appendChild(crearFilaInfo("Código especie", a.Especie));
    seccionInfo.appendChild(crearFilaInfo("Cercado", infoCercado.nombre));
    seccionInfo.appendChild(crearFilaInfo("Densidad", infoCercado.densidad));
    seccionInfo.appendChild(crearFilaInfo("Ramoneo", a.RAMONEO_CAT));

    card.appendChild(seccionInfo);
    card.appendChild(crearTablaIndices(a));

    return card;
  },
};

const popupParches = {
  title: "{Nom_Parche}",
  outFields: ["*"],
  content: function (feature) {
    const a = feature.graphic.attributes;
    const infoCercado = getCercadoInfo(a.Cercado || a.Nom_Parche || a.Name);

    const card = crearDiv({
      width: "330px",
      maxWidth: "100%",
      boxSizing: "border-box",
      fontFamily: "Arial, Helvetica, sans-serif",
    });

    const seccion = crearSeccion("Cobertura hiperespectral", "#ffd94d");

    seccion.appendChild(
      crearFilaInfo("Nombre", safeText(a.Nom_Parche, "Parche hiperespectral"))
    );
    seccion.appendChild(crearFilaInfo("Cercado asociado", infoCercado.nombre));
    seccion.appendChild(crearFilaInfo("Densidad", infoCercado.densidad));
    seccion.appendChild(
      crearFilaInfo("Tipo", "Cobertura de vuelo hiperespectral")
    );

    card.appendChild(seccion);
    return card;
  },
};

const popupCercados = {
  title: "{Name}",
  outFields: ["*"],
  content: function (feature) {
    const a = feature.graphic.attributes;
    const info = getCercadoInfo(a.Name || a.NOM_CERCADO || a.Cercado);

    const card = crearDiv({
      width: "330px",
      maxWidth: "100%",
      boxSizing: "border-box",
      fontFamily: "Arial, Helvetica, sans-serif",
    });

    const seccion = crearSeccion(info.nombre, "#ff6868");

    seccion.appendChild(crearFilaInfo("Tipo", "Cercado experimental"));
    seccion.appendChild(crearFilaInfo("Densidad", info.densidad));
    seccion.appendChild(crearFilaInfo("Descripción", info.descripcion));

    card.appendChild(seccion);
    return card;
  },
};

// ------------------------------------------------------
// Funciones auxiliares del visor
// ------------------------------------------------------

function setListMode(layer, shouldShow) {
  layer.listMode = shouldShow ? "show" : "hide";
}

function updateButtonState(activeMode) {
  const btnEspecies = document.getElementById("btnEspecies");
  const btnIndices = document.getElementById("btnIndices");
  const btnExperimental = document.getElementById("btnExperimental");

  btnEspecies.appearance = activeMode === "especies" ? "solid" : "outline";
  btnIndices.appearance = activeMode === "indices" ? "solid" : "outline";
  btnExperimental.appearance =
    activeMode === "experimental" ? "solid" : "outline";
}

function getIndexField() {
  const indice = document.getElementById("selectIndice").value;
  const sensor = document.getElementById("selectSensor").value;

  return `${indice}_${sensor}`;
}

async function createIndexRenderer(layer, fieldName) {
  const query = layer.createQuery();

  query.where = `${fieldName} IS NOT NULL`;
  query.outFields = [fieldName];
  query.returnGeometry = false;
  query.num = 2000;

  const results = await layer.queryFeatures(query);

  const values = results.features
    .map((feature) =>
      Number(String(feature.attributes[fieldName]).replace(",", "."))
    )
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    console.warn(`No hay valores válidos para el campo ${fieldName}.`);
    return rendererEspecies;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const b1 = min + range * 0.2;
  const b2 = min + range * 0.4;
  const b3 = min + range * 0.6;
  const b4 = min + range * 0.8;

  return {
    type: "class-breaks",
    valueExpression: `Number(Replace(Text($feature.${fieldName}), ',', '.'))`,
    valueExpressionTitle: fieldName,
    classBreakInfos: [
      {
        minValue: min,
        maxValue: b1,
        label: "Muy bajo",
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: [215, 48, 39, 0.95],
          size: 7,
          outline: {
            color: [255, 255, 255, 0.9],
            width: 0.8,
          },
        },
      },
      {
        minValue: b1,
        maxValue: b2,
        label: "Bajo",
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: [252, 141, 89, 0.95],
          size: 7,
          outline: {
            color: [255, 255, 255, 0.9],
            width: 0.8,
          },
        },
      },
      {
        minValue: b2,
        maxValue: b3,
        label: "Medio",
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: [255, 255, 191, 0.95],
          size: 7,
          outline: {
            color: [60, 60, 60, 0.9],
            width: 0.6,
          },
        },
      },
      {
        minValue: b3,
        maxValue: b4,
        label: "Alto",
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: [166, 217, 106, 0.95],
          size: 7,
          outline: {
            color: [255, 255, 255, 0.9],
            width: 0.8,
          },
        },
      },
      {
        minValue: b4,
        maxValue: max,
        label: "Muy alto",
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: [26, 150, 65, 0.95],
          size: 7,
          outline: {
            color: [255, 255, 255, 0.9],
            width: 0.8,
          },
        },
      },
    ],
  };
}

// ------------------------------------------------------
// Inicio del visor cuando el mapa está listo
// ------------------------------------------------------

arcgisMap.addEventListener("arcgisViewReadyChange", async () => {
  const view = arcgisMap.view;

  // Configuración visual del popup
  view.popup.dockEnabled = false;

  view.popup.visibleElements = {
    closeButton: true,
    collapseButton: true,
    featureNavigation: true,
    actionBar: false,
  };

  // ----------------------------------------------------
  // Capas
  // ----------------------------------------------------

  const parchesFL = new FeatureLayer({
    url: URL_PARCHES,
    title: "Parches hiperespectrales",
    renderer: rendererParches,
    popupTemplate: popupParches,
    opacity: 1,
    outFields: ["*"],
  });

  const cercadosFL = new FeatureLayer({
    url: URL_CERCADOS,
    title: "Cercados experimentales",
    renderer: rendererCercados,
    popupTemplate: popupCercados,
    outFields: ["*"],
  });

  const plantasFL = new FeatureLayer({
    url: URL_PLANTAS,
    title: "Plantas muestreadas",
    outFields: ["*"],
    renderer: rendererEspecies,
    popupTemplate: popupPlantas,
  });

  arcgisMap.map.addMany([parchesFL, cercadosFL, plantasFL]);

  // Encuadre inicial sobre las capas
  await plantasFL.when();

  try {
    const extent = await plantasFL.queryExtent();
    if (extent.extent) {
      view.goTo(extent.extent.expand(1.35));
    }
  } catch (error) {
    console.warn("No se pudo ajustar la extensión inicial.", error);
  }

  // ----------------------------------------------------
  // Botones y selectores
  // ----------------------------------------------------

  const btnEspecies = document.getElementById("btnEspecies");
  const btnIndices = document.getElementById("btnIndices");
  const btnExperimental = document.getElementById("btnExperimental");
  const selectIndice = document.getElementById("selectIndice");
  const selectSensor = document.getElementById("selectSensor");

  const controlBlock = document.querySelector(".control-block");

  async function setMode(mode) {
    const isEspecies = mode === "especies";
    const isIndices = mode === "indices";
    const isExperimental = mode === "experimental";

    updateButtonState(mode);

    // Visibilidad general
    plantasFL.visible = true;
    parchesFL.visible = true;
    cercadosFL.visible = true;

    // Lista de capas
    setListMode(plantasFL, true);
    setListMode(parchesFL, isExperimental || isEspecies || isIndices);
    setListMode(cercadosFL, isExperimental || isEspecies || isIndices);

    // Mostrar controles de índices solo en modo índices
    if (controlBlock) {
      controlBlock.style.display = isIndices ? "grid" : "none";
    }

    // Comportamiento por modo
    if (isEspecies) {
      plantasFL.title = "Plantas por especie";
      plantasFL.renderer = rendererEspecies;
      plantasFL.opacity = 1;
      parchesFL.opacity = 0.9;
      cercadosFL.opacity = 1;
    }

    if (isIndices) {
      const fieldName = getIndexField();
      plantasFL.title = `Plantas según ${fieldName}`;
      plantasFL.renderer = await createIndexRenderer(plantasFL, fieldName);
      plantasFL.opacity = 1;
      parchesFL.opacity = 0.85;
      cercadosFL.opacity = 1;
    }

    if (isExperimental) {
      plantasFL.title = "Plantas muestreadas";
      plantasFL.renderer = rendererPlantasSuave;
      plantasFL.opacity = 0.75;
      parchesFL.opacity = 1;
      cercadosFL.opacity = 1;
    }
  }

  btnEspecies.addEventListener("click", () => setMode("especies"));
  btnIndices.addEventListener("click", () => setMode("indices"));
  btnExperimental.addEventListener("click", () => setMode("experimental"));

  selectIndice.addEventListener("calciteSelectChange", () => {
    setMode("indices");
  });

  selectSensor.addEventListener("calciteSelectChange", () => {
    setMode("indices");
  });

  // Modo inicial
  setMode("especies");
});