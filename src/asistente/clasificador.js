import Fuse from "fuse.js";
import { TEMAS } from "./temas.js";

// Clasificador del asistente: decide QUÉ quiso decir el usuario, sin IA y sin servicios externos.
// Es una función pura (no llama a la API): recibe el texto y los datos, y devuelve un resultado.
// Por eso se puede probar sola (clasificador.test.js). motor.js usa el resultado para responder.
//
// Pasos de clasificar():
//   1. Normaliza el texto (minúsculas, sin tildes ni signos) y lo parte en palabras.
//   2. Separa los FILTROS: modalidad ("virtual"), nivel ("básico") y día ("hoy", "lunes").
//   3. Busca QUÉ ESTUDIAR, en este orden:
//        a. un tema exacto del diccionario (temas.js): "derivadas", "sql", "mate"
//        b. el nombre o código de una materia, con tolerancia a errores: "kalkulo" ≈ "cálculo"
//        c. un tema parecido del diccionario: "derivdas" ≈ "derivadas"
//        d. palabras del título o la descripción de las tutorías: "runge kutta"
//   4. Busca la PREGUNTA FRECUENTE (intención) cuya frase de ejemplo comparte más palabras.
//   5. Decide: gana lo que comparta más palabras; los saludos solo ganan si es TODO el mensaje.

// Fuse puntúa de 0 (idéntico) a 1 (nada que ver): por encima del umbral la palabra no cuenta
const UMBRAL_PALABRA = 0.3;
// Materias igual de parecidas que la mejor también se muestran ("cálculo" → Diferencial e Integral)
const MARGEN_MATERIAS = 0.1;
const MAX_MATERIAS = 3;
const MAX_TUTORIAS = 4;

// Palabras que no distinguen una pregunta de otra
const VACIAS = new Set([
  "a", "al", "algo", "como", "con", "de", "del", "el", "en", "es", "esta", "este", "esto", "hay", "la", "las", "le", "lo",
  "los", "me", "mi", "mis", "o", "para", "por", "puedo", "que", "quiero", "se", "su", "sus", "un", "una", "y", "yo",
]);

// Palabras que acompañan el tema o la materia y no ayudan a encontrarlos
const RELLENO = new Set([
  ...VACIAS, "tutoria", "tutorias", "monitoria", "monitorias", "tutor", "tutores", "clase", "clases", "materia", "materias",
  "busco", "buscar", "necesito", "tienen", "alguna", "alguien", "ayuda", "ayudar", "ver", "favor", "nivel", "modalidad",
  "horario", "horarios", "sesion", "sesiones", "tema", "temas", "duda", "dudas", "sobre", "entender", "aprender", "estudiar",
  "quien", "cual", "cuales", "dan", "dictan", "ofrecen",
]);

// Verbos y palabras muy generales: cuentan como coincidencia, pero no bastan solas para elegir una
// pregunta frecuente ("cómo CAMBIO mi contraseña" no es "CAMBIAR cupo")
const GENERICAS = new Set([
  "cambiar", "cambio", "crear", "nuevo", "nueva", "agregar", "editar", "ver", "hacer", "tener", "tengo", "necesito",
  "busco", "buscar", "poner", "dar", "saber",
]);

// Palabras frecuentes en las descripciones de las tutorías que no identifican un tema
const COMUNES_TUTORIAS = new Set([
  "ejercicios", "parcial", "parciales", "tipo", "taller", "repaso", "primer", "primero", "primeros", "segundo", "orden",
  "pasos", "reglas", "metodos", "operaciones", "estructuras", "diseno", "pruebas", "control", "teoria",
]);

// Filtros que entiende el catálogo (/tutorias?modalidad=&nivel=&dia=). [campo, valor, palabras]
const FILTROS = [
  ["modalidad", "Virtual", ["virtual", "virtuales", "remoto", "remota", "remotos", "remotas", "online", "linea"]],
  ["modalidad", "Presencial", ["presencial", "presenciales"]],
  ["modalidad", "Híbrida", ["hibrida", "hibridas", "hibrido", "hibridos"]],
  ["nivel", "Básico", ["basico", "basica", "basicos", "basicas", "principiante", "principiantes", "facil", "faciles"]],
  ["nivel", "Intermedio", ["intermedio", "intermedia", "intermedios", "intermedias"]],
  ["nivel", "Avanzado", ["avanzado", "avanzada", "avanzados", "avanzadas", "dificil", "dificiles"]],
  // "hoy" y "mañana" dependen de la fecha: el motor los convierte en el día de la semana
  ["dia", "hoy", ["hoy"]],
  ["dia", "manana", ["manana"]],
  ["dia", "Lunes", ["lunes"]],
  ["dia", "Martes", ["martes"]],
  ["dia", "Miércoles", ["miercoles"]],
  ["dia", "Jueves", ["jueves"]],
  ["dia", "Viernes", ["viernes"]],
  ["dia", "Sábado", ["sabado", "sabados"]],
  ["dia", "Domingo", ["domingo", "domingos"]],
];

// "¿Qué es híbrida?" pide una explicación, no una búsqueda
const PIDE_DEFINICION = /\b(que (es|son|significa|significan)|diferencia|explica)\b/;

// "¿Cálculo   Diferencial?" → "calculo diferencial"
export const normalizar = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const palabrasSin = (texto, excluidas) => normalizar(texto).split(" ").filter((p) => p && !excluidas.has(p));

// Fuse también encuentra una palabra dentro de otra ("dias" en "derivadas"): solo cuentan
// palabras de largo parecido ("cancelo" ≈ "cancelar", "tutoria" ≈ "tutorias")
const largoParecido = (a, b) => Math.abs(a.length - b.length) <= Math.max(2, Math.floor(a.length * 0.3));

// Singular y plural cuentan como la misma palabra: "integral" = "integrales", "arbol" = "arboles"
const mismaPalabra = (a, b) => a === b || a === `${b}s` || b === `${a}s` || a === `${b}es` || b === `${a}es`;

// Devuelve una función que dice qué tan parecida es una palabra a alguna del usuario
// (puntaje de Fuse, o undefined si no se parece a ninguna). Memoriza cada palabra.
function comparador(delUsuario) {
  const buscador = new Fuse(delUsuario, { threshold: UMBRAL_PALABRA, ignoreLocation: true, includeScore: true });
  const puntajes = new Map();
  return (palabra) => {
    if (!puntajes.has(palabra)) {
      const parecida = buscador.search(palabra).find((r) => largoParecido(palabra, r.item));
      puntajes.set(palabra, parecida?.score);
    }
    return puntajes.get(palabra);
  };
}

const sumar = (palabras, puntaje) => palabras.reduce((suma, p) => suma + puntaje(p), 0);

// Desempates: más palabras halladas → frase completa → palabras más parecidas
const esMejor = (a, b) =>
  a.aciertos !== b.aciertos ? a.aciertos > b.aciertos
  : a.completa !== b.completa ? a.completa
  : a.diferencia < b.diferencia;

// --- Filtros -------------------------------------------------------------------

// Saca de las palabras las que son filtros. Devuelve { filtros: { modalidad?, nivel?, dia? }, resto }
function separarFiltros(palabras) {
  const filtros = {};
  const resto = [];
  for (const palabra of palabras) {
    const filtro = FILTROS.find(([, , variantes]) => variantes.includes(palabra));
    if (filtro) filtros[filtro[0]] = filtro[1];
    else resto.push(palabra);
  }
  return { filtros, resto };
}

// --- Preguntas frecuentes (intenciones) ----------------------------------------

/**
 * Intención cuya frase de ejemplo comparte más palabras con el texto.
 * Una frase cuenta si coincide al menos la mitad de sus palabras y una de ellas no es genérica y
 * es de 4 letras o más (o hay dos coincidencias), para que "hoy" o "cambiar" no decidan solas.
 * Devuelve { intencion, aciertos, completa, diferencia } o null.
 */
function buscarIntencion(palabras, intenciones) {
  if (palabras.length === 0) return null;
  const puntaje = comparador(palabras);

  let mejor = null;
  for (const intencion of intenciones) {
    for (const frase of intencion.frases) {
      const claves = palabrasSin(frase, VACIAS);
      const halladas = claves.filter((p) => puntaje(p) !== undefined);
      const decisiva = halladas.some((p) => !GENERICAS.has(p) && (p.length >= 4 || halladas.length >= 2));
      if (halladas.length * 2 < claves.length || !decisiva) continue;
      const candidata = {
        intencion,
        aciertos: halladas.length,
        completa: halladas.length === claves.length,
        diferencia: sumar(halladas, puntaje),
      };
      if (!mejor || esMejor(candidata, mejor)) mejor = candidata;
    }
  }
  return mejor;
}

/**
 * Saludos y agradecimientos: solo cuentan si TODAS las palabras del mensaje son de saludo.
 * Así "ayuda" muestra el menú, pero "necesito ayuda con mate" busca matemáticas.
 */
function buscarConversacion(palabras, intenciones) {
  if (palabras.length === 0) return null;
  return intenciones.find((intencion) => {
    const vocabulario = [...new Set(intencion.frases.flatMap((f) => palabrasSin(f, VACIAS)))];
    const buscador = new Fuse(vocabulario, { threshold: UMBRAL_PALABRA, ignoreLocation: true });
    return palabras.every((p) => buscador.search(p).some((r) => largoParecido(p, r.item)));
  });
}

// --- Qué estudiar: materias, temas y tutorías ----------------------------------

/**
 * Materias cuyo nombre comparte palabras (de 4 letras o más) con el texto, o cuyo código aparece exacto.
 * Devuelve la mejor { materias, aciertos, diferencia } (con las igual de parecidas) o null.
 */
function buscarMateriasPorNombre(palabras, materias) {
  if (palabras.length === 0) return null;
  const puntaje = comparador(palabras);

  const [mejor, ...otras] = materias
    .map((materia) => {
      const halladas = palabrasSin(materia.nombre, VACIAS).filter((p) => p.length >= 4 && puntaje(p) !== undefined);
      const porCodigo = palabras.includes(materia.codigo) ? 1 : 0;
      return { materia, aciertos: halladas.length + porCodigo, diferencia: sumar(halladas, puntaje) };
    })
    .filter((m) => m.aciertos > 0)
    .sort((a, b) => (esMejor(a, b) ? -1 : esMejor(b, a) ? 1 : 0));
  if (!mejor) return null;

  const parecidas = otras.filter((m) => m.aciertos === mejor.aciertos && m.diferencia <= mejor.diferencia + MARGEN_MATERIAS);
  return {
    materias: [mejor, ...parecidas].slice(0, MAX_MATERIAS).map((m) => m.materia),
    aciertos: mejor.aciertos,
    diferencia: mejor.diferencia,
  };
}

/**
 * Materias del diccionario de temas (temas.js).
 * exacto = true: solo la palabra idéntica o su plural ("derivadas", "sql").
 * exacto = false: también palabras parecidas de 5 letras o más ("derivdas").
 */
function buscarMateriasPorTema(palabras, materias, exacto) {
  const aciertosPorCodigo = new Map();
  let diferencia = 0;
  for (const palabra of palabras) {
    for (const tema of TEMAS) {
      let puntaje = tema.palabras.some((t) => mismaPalabra(palabra, t)) ? 0 : undefined;
      if (puntaje === undefined && !exacto && palabra.length >= 5) {
        const parecida = new Fuse(tema.palabras, { threshold: UMBRAL_PALABRA, includeScore: true })
          .search(palabra)
          .find((r) => r.item.length >= 5 && largoParecido(palabra, r.item));
        puntaje = parecida?.score;
      }
      if (puntaje === undefined) continue;
      diferencia += puntaje;
      for (const codigo of tema.codigos) aciertosPorCodigo.set(codigo, (aciertosPorCodigo.get(codigo) ?? 0) + 1);
    }
  }
  if (aciertosPorCodigo.size === 0) return null;

  // Primero las materias que coinciden con más palabras; las que no existen en la BD se ignoran
  const maximo = Math.max(...aciertosPorCodigo.values());
  const encontradas = materias.filter((m) => aciertosPorCodigo.get(m.codigo) === maximo);
  if (encontradas.length === 0) return null;
  return { materias: encontradas, aciertos: maximo, diferencia };
}

/**
 * Tutorías cuyo título o descripción contiene palabras del texto ("runge kutta", "cuerpo libre").
 * Solo palabras exactas de 4 letras o más que no sean comunes: así se evitan falsos positivos.
 */
function buscarEnTutorias(palabras, tutorias) {
  const buscadas = palabras.filter((p) => p.length >= 4 && !COMUNES_TUTORIAS.has(p));
  if (buscadas.length === 0) return null;

  const conAciertos = tutorias
    .map((tutoria) => {
      const texto = palabrasSin(`${tutoria.titulo} ${tutoria.descripcion ?? ""}`, VACIAS);
      return { tutoria, aciertos: buscadas.filter((b) => texto.some((t) => mismaPalabra(b, t))).length };
    })
    .filter((t) => t.aciertos > 0);
  if (conAciertos.length === 0) return null;

  const maximo = Math.max(...conAciertos.map((t) => t.aciertos));
  return {
    tutorias: conAciertos.filter((t) => t.aciertos === maximo).slice(0, MAX_TUTORIAS).map((t) => t.tutoria),
    aciertos: maximo,
    diferencia: 0,
  };
}

// Qué estudiar, en orden de confianza: tema exacto → nombre de materia → tema parecido → tutorías
function buscarQueEstudiar(palabras, materias, tutorias) {
  if (palabras.length === 0) return null;
  return (
    buscarMateriasPorTema(palabras, materias, true) ??
    buscarMateriasPorNombre(palabras, materias) ??
    buscarMateriasPorTema(palabras, materias, false) ??
    buscarEnTutorias(palabras, tutorias)
  );
}

// --- Decisión final --------------------------------------------------------------

/**
 * Clasifica un texto. Devuelve uno de:
 *   { intencion }                     una pregunta frecuente
 *   { materias, filtros }             tutorías de esas materias (con filtros opcionales)
 *   { tutorias, filtros }             tutorías encontradas por su título o descripción
 *   { filtros }                       solo filtros: "tutorías virtuales", "qué hay hoy"
 *   {}                                no entendió
 * filtros = { modalidad?, nivel?, dia? } con dia = "Lunes"…"Domingo", "hoy" o "manana".
 *
 * Desempates: gana quien comparta más palabras; si empatan, la búsqueda cuando se parece igual o más
 * ("tutoría de bases de datos" busca la materia; "cómo cancelo" se parece algo a "cálculo", pero es
 * idéntico a la frase de cancelar). Las intenciones con `cedeAFiltros` (buscar tutoría, horarios,
 * modalidades), o las que coinciden a medias cuando hay filtros, le ceden el turno a la búsqueda,
 * salvo que se pida una definición ("¿qué es híbrida?").
 */
export function clasificar(texto, intenciones, materias, tutorias = []) {
  const palabras = palabrasSin(texto, VACIAS);
  const { filtros, resto } = separarFiltros(palabras);
  const hayFiltros = Object.keys(filtros).length > 0;

  const intencion = buscarIntencion(palabras, intenciones.filter((i) => !i.conversacion));
  const busqueda = buscarQueEstudiar(resto.filter((p) => !RELLENO.has(p)), materias, tutorias);
  // La intención le cede el turno a la búsqueda si es de las que ceden ("tutorías virtuales") o si
  // hay filtros y la frase solo coincide a medias ("clases los sábados" no es "cambiar la clave")
  const cede =
    intencion &&
    (intencion.intencion.cedeAFiltros || (hayFiltros && !intencion.completa)) &&
    !PIDE_DEFINICION.test(normalizar(texto));

  if (busqueda) {
    const ganaBusqueda =
      !intencion || cede || busqueda.aciertos > intencion.aciertos ||
      (busqueda.aciertos === intencion.aciertos && busqueda.diferencia <= intencion.diferencia);
    if (ganaBusqueda) {
      return busqueda.tutorias ? { tutorias: busqueda.tutorias, filtros } : { materias: busqueda.materias, filtros };
    }
  }
  if (hayFiltros && (!intencion || cede)) return { filtros };
  if (intencion) return { intencion: intencion.intencion };

  const conversacion = buscarConversacion(palabras, intenciones.filter((i) => i.conversacion));
  return conversacion ? { intencion: conversacion } : {};
}
