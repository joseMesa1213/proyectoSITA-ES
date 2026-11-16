import { listarMaterias } from "../api/materias.js";
import { listarTutorias } from "../api/tutorias.js";
import { ROL } from "../utils/constantes.js";
import { diaDeLaSemana, horaActual } from "../utils/fechas.js";
import { intencionesDe } from "./intenciones.js";
import { clasificar } from "./clasificador.js";

const MAX_TARJETAS = 4;

// Motor del asistente: arma la RESPUESTA. Usa clasificador.js para entender el texto
// y consulta la API (tutorías, reservas) cuando la respuesta lo necesita.

// Las materias se piden una sola vez; si falla, se reintenta en la siguiente pregunta
let materiasEnCache = null;
function cargarMaterias() {
  materiasEnCache ??= listarMaterias().catch((error) => {
    materiasEnCache = null;
    throw error;
  });
  return materiasEnCache;
}

// Las tutorías activas se usan para buscar temas en su título y descripción.
// Se guardan 5 minutos para no pedirlas en cada pregunta, sin quedar desactualizadas mucho tiempo.
const VIGENCIA_TUTORIAS = 5 * 60 * 1000;
let tutoriasEnCache = null;
function cargarTutorias() {
  if (!tutoriasEnCache || Date.now() - tutoriasEnCache.desde > VIGENCIA_TUTORIAS) {
    const promesa = listarTutorias();
    tutoriasEnCache = { desde: Date.now(), promesa };
    promesa.catch(() => (tutoriasEnCache = null));
  }
  return tutoriasEnCache.promesa;
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

// --- Filtros (modalidad, nivel, día) ----------------------------------------------

// "hoy" y "mañana" se convierten en el día de la semana (en Bogotá)
const resolverDia = (dia) => (dia === "hoy" ? diaDeLaSemana(0) : dia === "manana" ? diaDeLaSemana(1) : dia);

/**
 * Deja solo las tutorías con horario ese día, y de cada una solo esos horarios.
 * Para "hoy" se descartan las sesiones que ya empezaron.
 */
function filtrarPorDia(tutorias, dia) {
  if (!dia) return tutorias;
  const nombre = resolverDia(dia);
  const ahora = horaActual();
  return tutorias
    .map((t) => ({
      ...t,
      horarios: t.horarios.filter((h) => h.dia === nombre && (dia !== "hoy" || h.hora_inicio > ahora)),
    }))
    .filter((t) => t.horarios.length > 0);
}

// Describe los filtros para la frase de respuesta, en dos partes para que suene natural:
// "Encontré 2 tutorías{ virtuales de nivel Básico} de Cálculo{ los lunes}"
// cantidad: para que el adjetivo concuerde ("1 tutoría virtual", "2 tutorías virtuales")
const MODALIDAD_SINGULAR = { Virtual: "virtual", Presencial: "presencial", Híbrida: "híbrida" };
const MODALIDAD_PLURAL = { Virtual: "virtuales", Presencial: "presenciales", Híbrida: "híbridas" };
function describirFiltros({ modalidad, nivel, dia } = {}, cantidad = 2) {
  const antes = [];
  if (modalidad) antes.push((cantidad === 1 ? MODALIDAD_SINGULAR : MODALIDAD_PLURAL)[modalidad]);
  if (nivel) antes.push(`de nivel ${nivel}`);
  const despues = !dia ? "" : dia === "hoy" ? " para hoy" : dia === "manana" ? " para mañana" : ` los ${resolverDia(dia).toLowerCase()}`;
  return { antes: antes.length ? ` ${antes.join(" ")}` : "", despues };
}

const hayFiltros = (filtros) => Object.keys(filtros).length > 0;

// Enlace al catálogo con los mismos filtros: /tutorias?id_materia=2&modalidad=Virtual&dia=Lunes
function enlaceCatalogo({ modalidad, nivel, dia } = {}, idMateria) {
  const parametros = new URLSearchParams();
  if (idMateria) parametros.set("id_materia", idMateria);
  if (nivel) parametros.set("nivel", nivel);
  if (modalidad) parametros.set("modalidad", modalidad);
  if (dia) parametros.set("dia", resolverDia(dia));
  return `/tutorias${parametros.size ? `?${parametros}` : ""}`;
}

const cumpleFiltros = (t, { modalidad, nivel } = {}) =>
  (!modalidad || t.modalidad === modalidad) && (!nivel || t.nivel === nivel);

// --- Respuestas con tutorías ---------------------------------------------------------

const tarjetaTutoria = (t) => ({
  titulo: t.titulo,
  subtitulo: `${t.materia.nombre} · con ${t.tutor.nombre} ${t.tutor.apellido}`,
  detalle: `${t.nivel} · ${t.modalidad} · ${resumirHorarios(t.horarios)}`,
  a: `/tutorias/${t.id}`,
});

const contarTutorias = (n) => `${n} ${n === 1 ? "tutoría" : "tutorías"}`;

/**
 * Tutorías de esas materias (o de todas, si materias es null) que cumplen los filtros.
 * Con una sola materia el backend filtra por id_materia; con varias ("mate") se pide el
 * catálogo una vez y se filtra aquí, en vez de hacer una petición por materia.
 */
async function tutoriasDeMaterias(materias, filtros, usuario) {
  const { nivel, modalidad } = filtros;
  const unaMateria = materias?.length === 1 ? materias[0].id : undefined;
  const ids = new Set(materias?.map((m) => m.id));
  const delCatalogo = await listarTutorias({ id_materia: unaMateria, nivel, modalidad });
  const encontradas = filtrarPorDia(delCatalogo.filter((t) => !materias || ids.has(t.materia.id)), filtros.dia);
  const { antes, despues } = describirFiltros(filtros, encontradas.length);
  const deQue = materias ? ` de ${materias.map((m) => m.nombre).join(", ")}` : "";

  if (encontradas.length === 0) {
    const sugerirPublicar = usuario?.id_rol === ROL.TUTOR && materias && !hayFiltros(filtros);
    return {
      texto:
        `Por ahora no hay tutorías${antes}${deQue}${despues}.` +
        (sugerirPublicar
          ? " ¿Usted la domina? Asóciese a la materia y publique una tutoría."
          : hayFiltros(filtros) ? " Pruebe sin esos filtros en el catálogo." : " Vuelva a consultar pronto."),
      enlaces: [
        ...(sugerirPublicar ? [{ a: "/tutor/materias", texto: "Ir a Mis materias" }] : []),
        // Con una materia, el enlace la deja elegida (sin los demás filtros) para ver qué sí hay
        materias?.length === 1
          ? { a: enlaceCatalogo({}, materias[0].id), texto: `Ver ${materias[0].nombre} en el catálogo` }
          : { a: "/tutorias", texto: "Ver todo el catálogo" },
      ],
    };
  }

  // Solo se nombran y enlazan las materias que sí tienen tutorías
  const conTutorias = materias ? materias.filter((m) => encontradas.some((t) => t.materia.id === m.id)) : [];
  return {
    texto:
      `Encontré ${contarTutorias(encontradas.length)}${antes}` +
      (conTutorias.length ? ` de ${conTutorias.map((m) => m.nombre).join(", ")}` : "") + `${despues}:`,
    tarjetas: encontradas.slice(0, MAX_TARJETAS).map(tarjetaTutoria),
    enlaces: conTutorias.length
      ? conTutorias.slice(0, 3).map((m) => ({ a: enlaceCatalogo(filtros, m.id), texto: `Ver ${m.nombre} en el catálogo` }))
      : [{ a: enlaceCatalogo(filtros), texto: "Ver en el catálogo" }],
  };
}

// Tutorías encontradas por su título o descripción ("runge kutta"): los filtros se aplican aquí
function tutoriasPorTexto(tutorias, filtros) {
  const encontradas = filtrarPorDia(tutorias.filter((t) => cumpleFiltros(t, filtros)), filtros.dia);
  if (encontradas.length === 0) {
    // "ninguna virtual" (singular)
    const { antes, despues } = describirFiltros(filtros, 1);
    return {
      texto: `Encontré tutorías sobre ese tema, pero ninguna${antes}${despues}:`,
      tarjetas: tutorias.slice(0, MAX_TARJETAS).map(tarjetaTutoria),
    };
  }
  return {
    // "Estas tutorías virtuales" (plural)
    texto: `Estas tutorías${describirFiltros(filtros).antes} tratan ese tema${describirFiltros(filtros).despues}:`,
    tarjetas: encontradas.slice(0, MAX_TARJETAS).map(tarjetaTutoria),
    enlaces: [{ a: enlaceCatalogo(filtros), texto: "Ver todo el catálogo" }],
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
    // Sin datos (backend caído) igual se pueden responder las preguntas frecuentes
    const [materias, tutorias] = await Promise.all([
      cargarMaterias().catch(() => []),
      cargarTutorias().catch(() => []),
    ]);
    const resultado = clasificar(texto, intencionesDe(usuario), materias, tutorias);
    if (resultado.intencion) return responderIntencion(resultado.intencion, usuario);
    if (resultado.materias) return tutoriasDeMaterias(resultado.materias, resultado.filtros, usuario);
    if (resultado.tutorias) return tutoriasPorTexto(resultado.tutorias, resultado.filtros);
    if (resultado.filtros) return tutoriasDeMaterias(null, resultado.filtros, usuario);
    return NO_ENTENDI;
  });
