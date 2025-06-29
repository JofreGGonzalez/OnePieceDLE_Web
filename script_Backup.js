const searchInput = document.getElementById("search");
const suggestions = document.getElementById("suggestions");
const table = document.getElementById("result-table");
const tableHead = document.getElementById("table-head");
const tableBody = document.getElementById("table-body");

const pistaContainer = document.getElementById("pistas");
const pistaTexto = document.getElementById("pista-texto");
let fallos = 0;

const canonFilter = document.getElementById("canon-filter");

const slot = getCurrentSlot();
const filtro = canonFilter.value;

const nombreKey = "Nombre Pirata";
const fotoKey = "Enlace Foto";

const numericKeys = [
  "Altura",
  "Recompensa",
  "Edad",
  "Capitulo de Aparición",
  "Año de Aparición",
  "Arco Capitulo",
  "Saga Capitulo"
];

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

// Keys y umbrales
const pistasOrdenadas = [
  "Año de Aparición",
  "Ocupación",
  "Afiliación",
  "Nombre Fruta",
  "Significado Fruta",
  "Capitulo de Aparición",
  "letraInicial"
];
const umbrales = [3, 6, 9, 12, 15, 18, 21];

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

let target = null;
seleccionarTargetAleatorio();

let tableInitialized = false;

searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  suggestions.innerHTML = "";
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

    div.appendChild(img);
    div.appendChild(name);

    div.onclick = () => {
      searchInput.value = "";
      suggestions.innerHTML = "";
      procesarIntento(p);
    };

    suggestions.appendChild(div);
  });
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const primer = suggestions.querySelector(".suggestion");
    if (primer) primer.click();
  }
});

function procesarIntento(p) {
    const camposFormateados = ["Altura", "Recompensa"];

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

    columnasOrdenadas.forEach(k => {
        if (camposOcultos.includes(k)) return;

        // 🔶 Columna especial: HAKI
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
            hakiTD.style.backgroundColor = "orange";
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

    tableBody.prepend(fila);

    celdas.forEach((td, index) => {
        setTimeout(() => {
        td.classList.add("reveal");
        }, index * 80);
    });

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

    personajesUsados.push(p[nombreKey]);
}

function generarCabecera() {
  const headerRow = document.createElement("tr");

  const thImg = document.createElement("th");
  thImg.textContent = "Foto";
  headerRow.appendChild(thImg);

  columnasOrdenadas.forEach(key => {
    if (camposOcultos.includes(key)) return;
    const th = document.createElement("th");
    th.textContent = traducciones[idiomaActual][key] || key;
    headerRow.appendChild(th);
  });

  tableHead.appendChild(headerRow);
}

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

// Inicializar listeners en botones
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

// Al registrar un fallo, sumar y habilitar botón si toca
function registrarFallosYActualizarPistas() {
  fallos++;
  umbrales.forEach((umbral, idx) => {
    if (fallos >= umbral) {
      const key = pistasOrdenadas[idx];
      const btn = document.querySelector(`.pista-btn[data-key="${key}"]`);
      btn.disabled = false;
    }
  });
}

function filtrarPorCanon(personajes) {
  const valor = canonFilter.value;
  if (valor === "ambos") return personajes;
  return personajes.filter(p => p["Canon"] === valor);
}

/*function seleccionarTargetAleatorio() {
  const candidatos = filtrarPorCanon(personajes);
  target = candidatos[Math.floor(Math.random() * candidatos.length)];
}*/

function seleccionarTargetAleatorio() {
  target = seleccionarTarget();
}

canonFilter.addEventListener("change", () => {
  seleccionarTargetAleatorio();         // Nuevo target filtrado
  tableBody.innerHTML = "";             // Borrar tabla
  personajesUsados.length = 0;          // Reiniciar usados
  pistaTexto.classList.add("hidden");   // Ocultar texto de pistas
  pistaTexto.textContent = "";
  fallos = 0;                            // Reiniciar fallos

  // Reiniciar botones de pistas
  document.querySelectorAll(".pista-btn").forEach(btn => {
    btn.disabled = true;
  });
});

function getCurrentSlot() {
  const msPerSlot = 12 * 60 * 60 * 1000;
  const base = new Date("2025-01-01T00:00:00Z").getTime();
  const now = Date.now();
  return Math.floor((now - base) / msPerSlot);
}

function seleccionarTarget() {
  const slot = getCurrentSlot(); // cambia cada 12h
  const filtro = canonFilter.value;

  const candidatos = filtrarPorCanon(personajes);
  if (candidatos.length === 0) return null;

  // Crear semilla única para slot + filtro
  const seed = `${slot}_${filtro}`;
  const hash = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Evitar repeticiones recientes:
  const recent = getRecentHistory(slot, filtro, candidatos);
  const disponibles = candidatos.filter(p => !recent.includes(p[nombreKey]));

  const lista = disponibles.length > 0 ? disponibles : candidatos;
  const index = hash % lista.length;

  const elegido = lista[index];

  saveToHistory(slot, filtro, elegido[nombreKey]);
  return elegido;
}

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

function saveToHistory(slot, filtro, nombre) {
  const raw = localStorage.getItem("historialGlobal") || "{}";
  const hist = JSON.parse(raw);
  hist[`slot_${slot}_${filtro}`] = nombre;
  localStorage.setItem("historialGlobal", JSON.stringify(hist));
}

document.getElementById("lang-select").addEventListener("change", (e) => {
  idiomaActual = e.target.value;
  if (tableInitialized) {
    tableHead.innerHTML = "";
    generarCabecera();
  }
});