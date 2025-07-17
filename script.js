// Elementos DOM principales
const searchInput = document.getElementById("search");
const suggestions = document.getElementById("suggestions");
const table = document.getElementById("result-table");
const tableHead = document.getElementById("table-head");
const tableBody = document.getElementById("table-body");

const pistaContainer = document.getElementById("pistas");
const pistaTexto = document.getElementById("pista-texto");
let fallos = 0;

const canonFilter = document.getElementById("canon-filter");

//Generación de slot actual (cada 12 h un slot único)
const slot = getCurrentSlot();
const filtro = canonFilter.value;

//Claves para acceder fácilmente al objeto de personaje
const nombreKey = "Nombre Pirata";
const fotoKey = "Enlace Foto";

//Claves numéricas que pueden mostrar flechas
const numericKeys = [
  "Altura",
  "Recompensa",
  "Edad",
  "Capitulo de Aparición",
  "Año de Aparición",
  "Arco Capitulo",
  "Saga Capitulo"
];

//Campos que NO se muestran en la tabla
const camposOcultos = [
  "Enlace",
  "Enlace Foto",
  "Significado Fruta",
  "Status",
  "Nombre Fruta",
  "Episodio de Aparición",
  "Arco Numero Capitulo",
  "Saga Capitulo Numero",
  "Arco Episodeo",
  "Arco Numero Episodeo",
  "Saga Episodeo",
  "Saga Episodeo Numero",
];

//Orden de columnas que mostrará la tabla
const columnasOrdenadas = [
  "Nombre Pirata",
  "Género",
  "Año de Aparición",
  "Capitulo de Aparición",
  "Arco Capitulo",
  "Saga Capitulo",
  "Edad",
  "Aniversario",
  "Altura",
  "Tipo Fruta",
  "Afiliación",
  "Ocupación",
  "Origen",
  "Sangre",
  "Recompensa",
  "Haki",
  "Canon"
];

const personajesUsados = [];

// Control de pistas por número de fallos
const pistasOrdenadas = [
  "Año de Aparición",
  "Ocupación",
  "Capitulo de Aparición",
  "Nombre Fruta",
  "Significado Fruta",
  "Afiliación",
  "letraInicial"
];
const umbrales = [3, 6, 9, 12, 15, 18, 21];

//Traducción para cabeceras en varios idiomas
const traducciones = {
  es: {
    "Nombre Pirata": "Nombre",
    "Año de Aparición": "Año",
    "Capitulo de Aparición": "Capítulo",
    "Arco Capitulo": "Arco",
    "Saga Capitulo": "Saga",
    "Tipo Fruta": "Fruta",
    "Afiliación": "Banda",
    "Ocupación": "Rol",
    "Altura": "Altura",
    "Recompensa": "Recompensa",
    "Canon": "¿Canon?",
    "Haki": "Haki 🧠"
  },
  en: {
    "Nombre Pirata": "Name",
    "Año de Aparición": "Year",
    "Capitulo de Aparición": "Chapter",
    "Arco Capitulo": "Arc",
    "Saga Capitulo": "Saga",
    "Tipo Fruta": "Fruit",
    "Afiliación": "Affiliation",
    "Ocupación": "Role",
    "Altura": "Height",
    "Recompensa": "Bounty",
    "Canon": "Canon?",
    "Haki": "Haki 🧠"
  },
  fr: {
    "Nombre Pirata": "Nom",
    "Año de Aparición": "Année",
    "Capitulo de Aparición": "Chapitre",
    "Arco Capitulo": "Arc",
    "Saga Capitulo": "Saga",
    "Tipo Fruta": "Fruit",
    "Afiliación": "Équipage",
    "Ocupación": "Rôle",
    "Altura": "Taille",
    "Recompensa": "Prime",
    "Canon": "Canon ?",
    "Haki": "Haki 🧠"
  },
  jp: {
    "Nombre Pirata": "名前",
    "Año de Aparición": "登場年",
    "Capitulo de Aparición": "話数",
    "Arco Capitulo": "編",
    "Saga Capitulo": "サーガ",
    "Tipo Fruta": "実の種類",
    "Afiliación": "所属",
    "Ocupación": "職業",
    "Altura": "身長",
    "Recompensa": "懸賞金",
    "Canon": "カノン？",
    "Haki": "覇気"
  }
};

let idiomaActual = "es";

// Personaje objetivo del slot actual
let target = null;
seleccionarTargetAleatorio();

//Estado de inicialización para evitar dobles cabeceras
let tableInitialized = false;

//Desplegable con dificultad
const difficultyFilter = document.getElementById("difficulty-filter");
actualizarVisibilidadDificultad();

// Variables Degradado tabla
const wrapper = document.querySelector('.table-wrapper');

let isDown = false;
let startX;
let scrollLeft;

//Para moverse en el buscador
let highlightedIndex = -1;

/* ---------------------------
   GESTIÓN DEL BUSCADOR
--------------------------- */
// 1. Input: no cambia highlightedIndex
searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  suggestions.innerHTML = "";
  highlightedIndex = -1;
  if (!term) return;
  const matches = filtrarPorCanon(personajes).filter(p =>
    !personajesUsados.includes(p[nombreKey]) &&
    p[nombreKey]?.toLowerCase().includes(term)
  );
  matches.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("suggestion");
    const img = document.createElement("img");
    img.src = p[fotoKey] || "https://via.placeholder.com/40";
    img.alt = p[nombreKey];
    img.classList.add("mini-foto");
    const name = document.createElement("span");
    name.textContent = p[nombreKey];
    div.append(img, name);
    div.onclick = () => { searchInput.value = ""; suggestions.innerHTML = ""; procesarIntento(p); };
    suggestions.append(div);
  });
});

// 2. Scroll: detecta el primer visible
let scrollTimeout;
let isManualScroll = false;

suggestions.addEventListener("wheel", () => {
  isManualScroll = true;
});

suggestions.addEventListener("scroll", () => {
  if (!isManualScroll) return;
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    const items = suggestions.querySelectorAll(".suggestion");
    if (items.length === 0) return;

    items.forEach(item => item.classList.remove("highlighted"));

    let best = -1, minDist = Infinity;
    const contRect = suggestions.getBoundingClientRect();

    items.forEach((item, i) => {
      const rect = item.getBoundingClientRect();
      const dist = Math.abs((rect.top + rect.bottom)/2 - (contRect.top + contRect.bottom)/2);
      if (dist < minDist) { minDist = dist; best = i; }
    });

    if (best !== -1) {
      highlightedIndex = best;
      updateHighlighted(items);
    }

    isManualScroll = false;
  }, 150);
});


// 3. Key navigation
searchInput.addEventListener("keydown", (e) => {
  const items = suggestions.querySelectorAll(".suggestion");
  if (items.length === 0) return;

  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (highlightedIndex === -1) {
      // comenzamos desde lo visible actualmente
      const st = suggestions.scrollTop;
      highlightedIndex = [...items].findIndex(item => item.offsetTop >= st);
      if (highlightedIndex === -1) highlightedIndex = 0;
    } else {
      highlightedIndex = e.key === "ArrowDown"
        ? Math.min(highlightedIndex + 1, items.length - 1)
        : Math.max(highlightedIndex - 1, 0);
    }
    updateHighlighted(items);
  } else if (e.key === "Enter") {
    e.preventDefault();
    const items = suggestions.querySelectorAll(".suggestion");
    if (highlightedIndex === -1 && items.length > 0) {
      highlightedIndex = 0;
      items[0].click();
    }else if (highlightedIndex >= 0 && items[highlightedIndex]) {
      items[highlightedIndex].click();
    }
  }
});

// Colorea y auto-scroll al resaltado
function updateHighlighted(items) {
  items.forEach((item, i) => item.classList.toggle("highlighted", i === highlightedIndex));
  const current = items[highlightedIndex];
  if (current) current.scrollIntoView({ block: "nearest" });
}

/* ---------------------------
   PROCESAMIENTO DE INTENTOS
--------------------------- */
function procesarIntento(p) {
    const camposFormateados = ["Altura", "Recompensa"];

    // Si es el primer intento, genera cabecera y muestra tabla
    if (!tableInitialized) {
        generarCabecera();
        table.classList.remove("hidden");
        tableInitialized = true;
    }

    const fila = document.createElement("tr");
    const celdas = [];

    // Añadir imagen del personaje
    const tdImg = document.createElement("td");
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = p[fotoKey];
    img.alt = p[nombreKey];
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.borderRadius = "4px";
    img.style.display = "block";
    img.style.margin = "0 auto";
    tdImg.appendChild(img);
    tdImg.classList.add("invisible-cell");
    fila.appendChild(tdImg);
    celdas.push(tdImg);

    // Añadimos las columnas dinámicas según columnasOrdenadas
    columnasOrdenadas.forEach(k => {
        if (camposOcultos.includes(k)) return;

        // Columna especial: HAKI
        if (k === "Haki") {
        const hakiTD = document.createElement("td");
        hakiTD.classList.add("invisible-cell");

        const valoresJugador = {
            Armadura: p["Armadura"] === "1",
            Observación: p["Observación"] === "1",
            Rei: p["Rei"] === "1"
        };

        const valoresObjetivo = {
            Armadura: target["Armadura"] === "1",
            Observación: target["Observación"] === "1",
            Rei: target["Rei"] === "1"
        };

        const hakiWrapper = document.createElement("div");
        hakiWrapper.classList.add("haki-icons");

        if (valoresJugador.Armadura) {
            const img = document.createElement("img");
            img.src = "images/icons/armadura.png";
            img.alt = "Armadura";
            hakiWrapper.appendChild(img);
        }
        if (valoresJugador.Observación) {
            const img = document.createElement("img");
            img.src = "images/icons/observacion.png";
            img.alt = "Observación";
            hakiWrapper.appendChild(img);
        }
        if (valoresJugador.Rei) {
            const img = document.createElement("img");
            img.src = "images/icons/rei.png";
            img.alt = "Rei";
            hakiWrapper.appendChild(img);
        }

        hakiTD.appendChild(hakiWrapper);

        const iguales =
            valoresJugador.Armadura === valoresObjetivo.Armadura &&
            valoresJugador.Observación === valoresObjetivo.Observación &&
            valoresJugador.Rei === valoresObjetivo.Rei;

        const coincidencias = Object.keys(valoresJugador).filter(key =>
            valoresJugador[key] && valoresObjetivo[key]
        ).length;

        const esParcial = !iguales && coincidencias > 0;

        if (iguales) {
            hakiTD.classList.add("correct-cell");
        } else if (esParcial) {
            hakiTD.style.backgroundColor = "radial-gradient(circle, rgb(255,190,82) 15%, rgb(150,102,36) 100%)";
        } else {
            hakiTD.classList.add("wrong-cell");
        }

        fila.appendChild(hakiTD);
        celdas.push(hakiTD);
        return;
        }

        const v = p[k];
        const td = document.createElement("td");
        let texto = v;

        const esCorrecto = v === target[k];
        const esNumero = numericKeys.includes(k);
        const esFormateable = camposFormateados.includes(k);

        if (esFormateable && v !== "Unknown") {
        texto = formatearNumeroBonito(v, k);
        }

        // Comparación numérica con posibles flechas
        let valJugador = null;
        let valObjetivo = null;

        if (k === "Arco Capitulo") {
          valJugador = parseFloat(p["Arco Numero Capitulo"]);
          valObjetivo = parseFloat(target["Arco Numero Capitulo"]);
        } else if (k === "Saga Capitulo") {
          valJugador = parseFloat(p["Saga Capitulo Numero"]);
          valObjetivo = parseFloat(target["Saga Capitulo Numero"]);
        } else if (esNumero) {
          valJugador = parseFloat(v);
          valObjetivo = parseFloat(target[k]);
        }

        if (valJugador !== null && valObjetivo !== null && !isNaN(valJugador) && !isNaN(valObjetivo) && valJugador !== valObjetivo) {
          const claseFlecha = valJugador < valObjetivo ? "flecha-arriba" : "flecha-abajo";
          td.classList.add(claseFlecha);
        }

        td.textContent = texto;
        td.classList.add(esCorrecto ? "correct-cell" : "wrong-cell");
        td.classList.add("invisible-cell");
        fila.appendChild(td);
        celdas.push(td);
    });

    // Añadir la fila y revelar con animación escalonada
    tableBody.prepend(fila);

    celdas.forEach((td, index) => {
        setTimeout(() => {
        td.classList.add("reveal");
        }, index * 80);
    });

    //Si el personaje es correcto: marcar, bloquear buscador y lanzar confeti
    if (p[nombreKey] === target[nombreKey]) {
        celdas.forEach(td => {
        td.classList.remove("wrong-cell");
        td.classList.add("correct-cell");
        });
        searchInput.disabled = true;
        searchInput.placeholder = "¡Has acertado!";
        suggestions.innerHTML = "";
       
        //Confeti

        confetti({
          particleCount: 200,
          angle: 45,
          spread: 70,
          ticks: 225,
          scalar: 1.5,
          startVelocity: 70,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 200,
          angle: 135,
          spread: 70,
          ticks: 225,
          scalar: 1.5,
          startVelocity: 70,
          origin: { x: 1 }
        });

        const duration = 3 * 1000;
        const end = Date.now() + duration;

        (function frame() {
          confetti({
            particleCount: 5,
            angle: 90,
            spread: 70,
            startVelocity: 25,
            ticks: 350,
            scalar: 1.4,
            origin: { x: Math.random(), y: 0 }
          });
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();

        ///

    }else {
        registrarFallosYActualizarPistas();
    }

    const currentTerm = searchInput.value.trim().toLowerCase();
    if (currentTerm) populateSuggestions(currentTerm);
    else suggestions.innerHTML = "";

    personajesUsados.push(p[nombreKey]);
}

/* ---------------------------
   GENERACIÓN DE CABECERA
--------------------------- */
function generarCabecera() {
  const headerRow = document.createElement("tr");

  // Columna fija de imagen
  const thImg = document.createElement("th");
  thImg.textContent = "Foto";
  headerRow.appendChild(thImg);

  // Cabeceras según idioma y columnas visibles
  columnasOrdenadas.forEach(key => {
    if (camposOcultos.includes(key)) return;
    const th = document.createElement("th");
    th.textContent = traducciones[idiomaActual][key] || key;
    headerRow.appendChild(th);
  });

  tableHead.appendChild(headerRow);
}

/* ---------------------------
   FORMATEO DE NÚMEROS (altura, recompensa)
--------------------------- */
function formatearNumeroBonito(valor, tipo) {
  const num = parseFloat(valor);
  if (isNaN(num)) return valor;

  if (tipo === "Altura") {
    if (num >= 100000) return (num / 100000).toFixed(2) + " km";
    if (num >= 100) return (num / 100).toFixed(2) + " m";
    return num + " cm";
  }

  if (tipo === "Recompensa") {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B ฿";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M ฿";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K ฿";
    return num + " ฿";
  }

  return num;
}

/* ---------------------------
   PISTAS DE FALLo
--------------------------- */
// Handler para mostrar texto de pista al clicar
document.querySelectorAll(".pista-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.key;
    let texto = "";

    if (key === "letraInicial") {
      texto = `La inicial es: "${target[nombreKey][0].toUpperCase()}"`;
    } else {
      texto = `Pista: ${key} → ${target[key]}`;
    }

    pistaTexto.textContent = texto;
    pistaTexto.classList.remove("hidden");
  });
});

// Activa botones según número de fallos
function registrarFallosYActualizarPistas() {
  fallos++;
  umbrales.forEach((umbral, idx) => {
    if (fallos >= umbral) {
      const key = pistasOrdenadas[idx];
      const btn = document.querySelector(`.pista-btn[data-key="${key}"]`);
      if (btn) {
        btn.disabled = false;
      } else {
        console.warn(`No se encontró botón con data-key="${key}"`);
      }
    }
  });
}

/* ---------------------------
   FILTROS CANON Y SELECCIÓN OBJETIVO
--------------------------- */
// Filtra personajes según filtro Canon/No/Ambos
/*function filtrarPorCanon(personajes) {
  const valor = canonFilter.value;
  if (valor === "ambos") return personajes;
  return personajes.filter(p => p["Canon"] === valor);
}*/

function filtrarPorCanon(lista) {
  const canonVal = canonFilter.value;
  const dificultad = document.getElementById("difficulty-filter")?.value || "dificil";

  // Si canon es "ambos" o "0" (No), devolvemos sin aplicar dificultad
  if (canonVal !== "1") return lista.filter(p => p["Canon"] === canonVal || canonVal === "ambos");

  // Canon es "1", filtramos por dificultad
  let filtrados = lista.filter(p => p["Canon"] === "1");

  if (dificultad === "facil") {
    filtrados = filtrados.filter(p =>
      p["Origen"]?.trim() &&
      p["Afiliación"]?.trim()
    );
  } else if (dificultad === "medio") {
    filtrados = filtrados.filter(p =>
      p["Capitulo de Aparición"] !== "Unknown" &&
      p["Afiliación"]?.trim() &&
      p["Ocupación"]?.trim() &&
      p["Género"] !== "Unknown"
    );
  }
  // dificultad === "dificil": no filtramos más

  return filtrados;
}

function populateSuggestions(term) {
  suggestions.innerHTML = "";
  const matches = filtrarPorCanon(personajes)
  .filter(p =>
    !personajesUsados.includes(p[nombreKey]) &&
    p[nombreKey]?.toLowerCase().includes(term)
  );

  matches.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("suggestion");

    const img = document.createElement("img");
    img.src = p[fotoKey] || "https://via.placeholder.com/40";
    img.alt = p[nombreKey];
    img.classList.add("mini-foto");

    const name = document.createElement("span");
    name.textContent = p[nombreKey];

    div.appendChild(img);
    div.appendChild(name);

    div.onclick = () => {
      searchInput.value = "";
      suggestions.innerHTML = "";
      procesarIntento(p);
    };

    suggestions.appendChild(div);
  });
}

document.addEventListener("click", (e) => {
  // Si el clic ocurre fuera del input o de las sugerencias
  if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
    searchInput.value = "";
    suggestions.innerHTML = "";
  }
});

// Selecciona personaje objetivo para slot actual
function seleccionarTargetAleatorio() {
  target = seleccionarTarget();
}

// Al cambiar filtro reinicia estado y selecciona nuevo objetivo
canonFilter.addEventListener("change", () => {
  actualizarVisibilidadDificultad();
  
  seleccionarTargetAleatorio();         // Nuevo target filtrado
  tableBody.innerHTML = "";             // Borrar tabla
  personajesUsados.length = 0;          // Reiniciar usados
  pistaTexto.classList.add("hidden");   // Ocultar texto de pistas
  pistaTexto.textContent = "";
  fallos = 0;                            // Reiniciar fallos

  searchInput.disabled = false;
  searchInput.placeholder = "Busca un personaje...";

  // Reiniciar botones de pistas
  document.querySelectorAll(".pista-btn").forEach(btn => {
    btn.disabled = true;
  });
});

/* ---------------------------
   LÓGICA DE SLOT Y SELECCIÓN DETERMINISTA
--------------------------- */
// Calcula el número de slot (cada 12h)
function getCurrentSlot() {
  const msPerSlot = 12 * 60 * 60 * 1000;
  const base = Date.UTC(2025, 0, 1, 0, 0, 0);  // Enero = 0
  const now = Date.now();
  const utcNow = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
    new Date().getUTCHours(),
    new Date().getUTCMinutes(),
    new Date().getUTCSeconds(),
    new Date().getUTCMilliseconds()
  );
  return Math.floor((utcNow - base) / msPerSlot);
}

// Calcula y devuelve un personaje objetivo único por slot + filtro
function seleccionarTarget() {
  const slot = getCurrentSlot(); // cambia cada 12h
  const filtro = canonFilter.value + "_" + difficultyFilter.value;

  const candidatos = filtrarPorCanon(personajes);
  if (candidatos.length === 0) return null;

  // Crear semilla única para slot + filtro
  const seed = `${slot}_${filtro}`;
  //const hash = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hash = simpleHash(seed);

  // Evitar repeticiones recientes:
  const recent = getRecentHistory(slot, filtro, candidatos);
  const disponibles = candidatos.filter(p => !recent.includes(p[nombreKey]));

  const lista = disponibles.length > 0 ? disponibles : candidatos;
  const index = hash % lista.length;

  const elegido = lista[index];

  saveToHistory(slot, filtro, elegido[nombreKey]);
  return elegido;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Recupera los últimos 14 slots para evitar repetición semanal
function getRecentHistory(currentSlot, filtro, pool) {
  const raw = localStorage.getItem("historialGlobal") || "{}";
  const hist = JSON.parse(raw);
  const recent = [];

  for (let i = currentSlot - 14; i < currentSlot; i++) {
    const key = `slot_${i}_${filtro}`;
    if (hist[key]) recent.push(hist[key]);
  }

  return recent;
}

// Guarda en localStorage el personaje asignado a este slot
function saveToHistory(slot, filtro, nombre) {
  const raw = localStorage.getItem("historialGlobal") || "{}";
  const hist = JSON.parse(raw);
  hist[`slot_${slot}_${filtro}`] = nombre;
  localStorage.setItem("historialGlobal", JSON.stringify(hist));
}

/* ---------------------------
   CONTADOR DE IDIOMA
--------------------------- */
// Al cambiar idioma, regenera cabecera si ya había tabla
document.getElementById("lang-select").addEventListener("change", (e) => {
  idiomaActual = e.target.value;
  if (tableInitialized) {
    tableHead.innerHTML = "";
    generarCabecera();
  }
});

// Mostrar u ocultar el selector de dificultad según Canon
function actualizarVisibilidadDificultad() {
  difficultyFilter.parentElement.style.display = canonFilter.value === "1" ? "block" : "none";
}

// Fuerza recarga de la tabla igual que se hace al cambiar el desplegable de Canon
difficultyFilter.addEventListener("change", () => {
  canonFilter.dispatchEvent(new Event("change"));
});


/* Poner fondo pantalla aleatorio */
document.addEventListener("DOMContentLoaded", () => {
  const maxFondos = 195;
  const numero = Math.floor(Math.random() * (maxFondos + 1));
  const url = `images/wallpaper/ColorSpread_${numero}.webp`;

  const img = new Image();
  img.crossOrigin = "anonymous"; // Necesario para evitar el canvas taint
  img.src = url;
  img.style.display = "none"; 
  document.body.appendChild(img); 

  img.addEventListener("load", () => {
    document.body.style.backgroundImage = `url('${url}')`;
    document.body.style.backgroundSize = "contain";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundPosition = "center top";

    try {
      //Para color predominante
      const colorThief = new ColorThief();
      const [r, g, b] = colorThief.getColor(img);
      
      //Para media de colores
      //const [r, g, b] = getAverageRGB(img);

      document.body.style.backgroundColor = `rgb(${r},${g},${b})`;
    } catch (err) {
      console.error('ColorThief error:', err);
    }
  });
});


//Promedio de color en una imagen
function getAverageRGB(imgEl) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const width = canvas.width = imgEl.naturalWidth;
  const height = canvas.height = imgEl.naturalHeight;

  context.drawImage(imgEl, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  let r = 0, g = 0, b = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  r = Math.floor(r / count);
  g = Math.floor(g / count);
  b = Math.floor(b / count);

  return [r, g, b];
}



/* CONTROL DEGRADADO TABLA */
function updateGradientMask() {
  const scrollLeft = wrapper.scrollLeft;
  const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;

  const atStart = scrollLeft < 2;
  const atEnd = scrollLeft >= maxScroll - 2;

  let offset = 0;
  if (!atStart && !atEnd) {
    offset = (scrollLeft / maxScroll) * 100;
  }

  wrapper.style.setProperty('--mask-offset', `${offset}%`);

  if (atStart) {
    wrapper.style.webkitMaskImage = `linear-gradient(to right,
      black 0%,
      black 95%,
      transparent 100%)`;
  } else if (atEnd) {
    wrapper.style.webkitMaskImage = `linear-gradient(to right,
      transparent 0%,
      black 5%,
      black 100%)`;
  } else {
    wrapper.style.webkitMaskImage = `linear-gradient(to right,
      transparent 0%,
      black 5%,
      black 95%,
      transparent 100%)`;
  }

  // Para otros navegadores
  wrapper.style.maskImage = wrapper.style.webkitMaskImage;
}

wrapper.addEventListener('scroll', updateGradientMask);

// También llamar cuando se muestre la tabla por primera vez
setTimeout(updateGradientMask, 100);


/* para mover el scroll de la tabla con el mouse */
wrapper.addEventListener('mousedown', (e) => {
  isDown = true;
  wrapper.classList.add('dragging');
  startX = e.pageX - wrapper.offsetLeft;
  scrollLeft = wrapper.scrollLeft;
});

wrapper.addEventListener('mouseleave', () => {
  isDown = false;
  wrapper.classList.remove('dragging');
});

wrapper.addEventListener('mouseup', () => {
  isDown = false;
  wrapper.classList.remove('dragging');
});

wrapper.addEventListener('mousemove', (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - wrapper.offsetLeft;
  const walk = (x - startX) * 1.5; // velocidad de desplazamiento
  wrapper.scrollLeft = scrollLeft - walk;
});