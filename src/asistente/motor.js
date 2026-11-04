import Fuse from "fuse.js";
import { listarMaterias } from "../api/materias.js";
import { listarTutorias } from "../api/tutorias.js";
import { ROL } from "../utils/constantes.js";
import { intencionesDe } from "./intenciones.js";

// Motor del asistente: decide qué responder a un texto libre, sin IA y sin servicios externos.
//   1. Normaliza el texto (minúsculas, sin tildes ni signos).
//   2. Compara sus palabras, una a una y con búsqueda difusa (Fuse.js), con los nombres de las
//      materias ("kalkulo" ≈ "calculo") y con las frases de ejemplo de las intenciones del rol.
//   3. Gana lo que comparta más palabras; si nada se parece lo suficiente, ofrece el menú.

// Fuse puntúa de 0 (idéntico) a 1 (nada que ver): por encima del umbral la palabra no cuenta
const UMBRAL_PALABRA = 0.3;
// Materias igual de parecidas que la mejor también se muestran ("cálculo" → Diferencial e Integral)
const MARGEN_MATERIAS = 0.1;
const MAX_MATERIAS = 3;
const MAX_TARJETAS = 4;

// Palabras que no distinguen una pregunta de otra
const VACIAS = new Set([
  "a", "al", "como", "con", "de", "del", "el", "en", "es", "esta", "este", "esto", "hay", "la", "las", "le", "lo", "los",
  "me", "mi", "mis", "o", "para", "por", "puedo", "que", "quiero", "se", "su", "sus", "un", "una", "y", "yo",
]);

// Palabras que acompañan el nombre de la materia y no ayudan a encontrarla
const RELLENO = new Set([
  ...VACIAS, "tutoria", "tutorias", "monitoria", "monitorias", "tutor", "tutores", "clase", "clases", "materia",
  "busco", "buscar", "necesito", "tienen", "alguna", "alguien", "ayuda", "ver", "favor",
]);

// "¿Cálculo   Diferencial?" → "calculo diferencial"
export const normalizar = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const palabrasSin = (texto, excluidas) => normalizar(texto).split(" ").filter((p) => p && !excluidas.has(p));

// Fuse también encuentra una palabra dentro de otra ("dias" en "derivadas"): solo cuentan
// palabras de largo parecido ("cancelo" ≈ "cancelar", "tutoria" ≈ "tutorias")
const largoParecido = (a, b) => Math.abs(a.length - b.length) <= Math.max(2, Math.floor(a.length * 0.3));

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

/**
 * Intención cuya frase de ejemplo comparte más palabras con el texto.
 * Una frase cuenta si coincide al menos la mitad de sus palabras y una de ellas es de 4 letras o más,
 * para que palabras cortas como "hoy" no decidan solas. Devuelve { intencion, aciertos, diferencia } o null.
 */
function buscarIntencion(texto, intenciones) {
  const delUsuario = palabrasSin(texto, VACIAS);
  if (delUsuario.length === 0) return null;
  const puntaje = comparador(delUsuario);

  let mejor = null;
  for (const intencion of intenciones) {
    for (const frase of intencion.frases) {
      const claves = palabrasSin(frase, VACIAS);
      const halladas = claves.filter((p) => puntaje(p) !== undefined);
      if (halladas.length * 2 < claves.length || !halladas.some((p) => p.length >= 4)) continue;
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
 * Materias cuyo nombre comparte palabras (de 4 letras o más) con el texto, o cuyo código aparece exacto.
 * Devuelve [{ materia, aciertos, diferencia }] de la más a la menos parecida.
 */
function buscarMaterias(texto, materias) {
  const delUsuario = palabrasSin(texto, RELLENO);
  if (delUsuario.length === 0) return [];
  const puntaje = comparador(delUsuario);

  return materias
    .map((materia) => {
      const halladas = palabrasSin(materia.nombre, VACIAS).filter((p) => p.length >= 4 && puntaje(p) !== undefined);
      const porCodigo = delUsuario.includes(materia.codigo) ? 1 : 0;
      return { materia, aciertos: halladas.length + porCodigo, diferencia: sumar(halladas, puntaje) };
    })
    .filter((m) => m.aciertos > 0)
    .sort((a, b) => (esMejor(a, b) ? -1 : esMejor(b, a) ? 1 : 0));
}

/**
 * Clasifica un texto. Función pura (sin API) para poder probarla aparte.
 * Devuelve { intencion } | { materias: [...] } | {} si no entendió.
 * Gana quien comparta más palabras y, si empatan, la materia cuando se parece igual o más:
 * "tutoría de bases de datos" coincide con "tutorías" (buscar-tutoria), pero busca la materia;
 * "cómo cancelo" se parece algo a "cálculo", pero es idéntico a la frase de cancelar.
 */
export function clasificar(texto, intenciones, materias) {
  const intencion = buscarIntencion(texto, intenciones);
  const [mejor, ...otras] = buscarMaterias(texto, materias);

  const ganaMateria =
    mejor && (!intencion || mejor.aciertos > intencion.aciertos ||
      (mejor.aciertos === intencion.aciertos && mejor.diferencia <= intencion.diferencia));
  if (ganaMateria) {
    const parecidas = otras.filter(
      (m) => m.aciertos === mejor.aciertos && m.diferencia <= mejor.diferencia + MARGEN_MATERIAS
    );
    return { materias: [mejor, ...parecidas].slice(0, MAX_MATERIAS).map((m) => m.materia) };
  }
  if (intencion) return { intencion: intencion.intencion };
  return {};
}

// Las materias se piden una sola vez; si falla, se reintenta en la siguiente pregunta
let materiasEnCache = null;
function cargarMaterias() {
  materiasEnCache ??= listarMaterias().catch((error) => {
    materiasEnCache = null;
    throw error;
  });
  return materiasEnCache;
}

// Botones del menú para el rol del usuario
export const opcionesMenu = (usuario) => intencionesDe(usuario).filter((i) => i.etiqueta);

export const saludo = (usuario) => ({
  texto: `¡Hola${usuario ? `, ${usuario.nombre}` : ""}! Soy el asistente de SITA-ES. Escriba el nombre de una materia o elija una opción:`,
  menu: true,
});

// Horarios semanales → "Lun 10:00, Mié 14:00…"
const resumirHorarios = (horarios) =>
  horarios.length === 0
    ? "Sin horarios publicados"
    : horarios
        .slice(0, 2)
        .map((h) => `${h.dia.slice(0, 3)} ${h.hora_inicio}`)
        .join(", ") + (horarios.length > 2 ? "…" : "");

async function tutoriasDe(materias, usuario) {
  const porMateria = await Promise.all(materias.map((m) => listarTutorias({ id_materia: m.id })));
  const tutorias = porMateria.flat();

  if (tutorias.length === 0) {
    return {
      texto: `Por ahora no hay tutorías activas de ${materias.map((m) => m.nombre).join(", ")}.` +
        (usuario?.id_rol === ROL.TUTOR ? " ¿Usted la domina? Asóciese a la materia y publique una tutoría." : " Vuelva a consultar pronto."),
      enlaces: usuario?.id_rol === ROL.TUTOR ? [{ a: "/tutor/materias", texto: "Ir a Mis materias" }] : [],
    };
  }
  // Solo se nombran y enlazan las materias que sí tienen tutorías
  const conTutorias = materias.filter((_, i) => porMateria[i].length > 0);
  return {
    texto: `Encontré ${tutorias.length} ${tutorias.length === 1 ? "tutoría" : "tutorías"} de ${conTutorias.map((m) => m.nombre).join(", ")}:`,
    tarjetas: tutorias.slice(0, MAX_TARJETAS).map((t) => ({
      titulo: t.titulo,
      subtitulo: `${t.materia.nombre} · con ${t.tutor.nombre} ${t.tutor.apellido}`,
      detalle: `${t.nivel} · ${t.modalidad} · ${resumirHorarios(t.horarios)}`,
      a: `/tutorias/${t.id}`,
    })),
    enlaces: conTutorias.map((m) => ({ a: `/tutorias?id_materia=${m.id}`, texto: `Ver ${m.nombre} en el catálogo` })),
  };
}

const NO_ENTENDI = {
  texto: "No le entendí 🤔. Escriba el nombre o código de una materia, o elija una opción:",
  menu: true,
};

// Los errores de la API (sin conexión, sesión vencida) se muestran como un mensaje más del chat
async function sinErrores(obtenerRespuesta) {
  try {
    return await obtenerRespuesta();
  } catch (error) {
    return { texto: error.message || "Ocurrió un error inesperado. Intente de nuevo." };
  }
}

// Respuesta a un botón del menú: fija o consultando la API
export const responderIntencion = (intencion, usuario) =>
  sinErrores(async () => (intencion.responder ? intencion.responder(usuario) : intencion.respuesta));

// Respuesta a un texto libre: { texto, tarjetas?, enlaces?, menu? }
export const responder = (texto, usuario) =>
  sinErrores(async () => {
    // Sin materias (backend caído) igual se pueden responder las preguntas frecuentes
    const materias = await cargarMaterias().catch(() => []);
    const resultado = clasificar(texto, intencionesDe(usuario), materias);
    if (resultado.intencion) return responderIntencion(resultado.intencion, usuario);
    if (resultado.materias) return tutoriasDe(resultado.materias, usuario);
    return NO_ENTENDI;
  });
