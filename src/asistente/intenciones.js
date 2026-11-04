import { listarMisReservas, listarReservasRecibidas } from "../api/reservas.js";
import { ESTADO, ROL } from "../utils/constantes.js";
import { formatearFechaCorta, hoy } from "../utils/fechas.js";
import { contarReservas, reservasActivasFuturas } from "../utils/reservas.js";

// Catálogo del asistente. Cada intención tiene:
//   id        identificador único
//   etiqueta  texto del botón en el menú (sin etiqueta no aparece en el menú, solo se detecta escribiendo)
//   roles     quién la ve; sin `roles` la ven todos. INVITADO = visitante sin sesión
//   frases    ejemplos de cómo lo escribiría alguien (sin tildes ni mayúsculas: el motor normaliza)
//   respuesta { texto, enlaces? }  o  responder(usuario) → Promise<respuesta> si consulta la API
//
// Para agregar una pregunta frecuente basta con agregar un objeto a INTENCIONES.
// El asistente solo orienta: las acciones (reservar, cancelar, calificar) se hacen en sus pantallas.

export const INVITADO = "invitado";
const QUIENES_RESERVAN = [ROL.ESTUDIANTE, ROL.TUTOR];

// Orden por fecha y hora de inicio (las reservas llegan de la más reciente a la más antigua)
const porFechaYHora = (a, b) =>
  `${a.fecha_sesion} ${a.horario.hora_inicio}`.localeCompare(`${b.fecha_sesion} ${b.horario.hora_inicio}`);

const tarjetaReserva = (r) => ({
  titulo: r.tutoria.titulo,
  subtitulo: `${r.tutoria.materia.nombre} · con ${r.tutoria.tutor.nombre} ${r.tutoria.tutor.apellido}`,
  detalle: `${formatearFechaCorta(r.fecha_sesion)} · ${r.horario.hora_inicio} – ${r.horario.hora_fin}`,
  a: `/tutorias/${r.tutoria.id}`,
});

export const INTENCIONES = [
  // --- Generales -------------------------------------------------------------
  {
    id: "buscar-tutoria",
    etiqueta: "🔎 Buscar tutoría",
    frases: ["buscar tutoria", "busco tutoria", "necesito una tutoria", "quiero una tutoria", "que tutorias hay", "busco un tutor", "monitoria"],
    respuesta: {
      texto: "Escriba el nombre o el código de la materia (por ejemplo: Cálculo, Física o 2508208) y le muestro las tutorías disponibles.",
      enlaces: [{ a: "/tutorias", texto: "Ver todo el catálogo" }],
    },
  },
  {
    id: "como-funciona",
    etiqueta: "❓ ¿Cómo funciona SITA-ES?",
    frases: ["como funciona", "que es sita", "que es esto", "para que sirve", "como se usa la plataforma"],
    respuesta: {
      texto:
        "SITA-ES conecta estudiantes con tutores de la universidad:\n" +
        "• Los tutores publican tutorías por materia con horarios semanales.\n" +
        "• Usted elige una tutoría, un horario y la fecha de la sesión, y reserva su cupo.\n" +
        "• Después de la sesión, el tutor la marca como completada y usted puede calificarla.",
      enlaces: [{ a: "/tutorias", texto: "Ver tutorías" }],
    },
  },
  {
    id: "registro",
    etiqueta: "📝 ¿Cómo me registro?",
    roles: [INVITADO],
    frases: ["como me registro", "crear cuenta", "registrarme", "no tengo cuenta", "como inicio sesion", "olvide mi contrasena"],
    respuesta: {
      texto:
        "Regístrese con su correo institucional y elija si entra como Estudiante o como Tutor. " +
        "Con la cuenta creada ya puede reservar. Si ya tiene cuenta, inicie sesión. " +
        "Si olvidó su contraseña, comuníquese con la coordinación: la plataforma aún no tiene recuperación de contraseña.",
      enlaces: [
        { a: "/registro", texto: "Registrarme" },
        { a: "/login", texto: "Iniciar sesión" },
      ],
    },
  },
  {
    id: "ser-tutor",
    etiqueta: "🎓 ¿Cómo ser tutor?",
    roles: [INVITADO, ROL.ESTUDIANTE],
    frases: ["como ser tutor", "quiero ser tutor", "quiero dar tutorias", "puedo ser monitor", "ensenar una materia"],
    respuesta: {
      texto:
        "Al registrarse elija el rol Tutor. Luego:\n" +
        "1. En «Mis materias» asóciese a las materias que domina.\n" +
        "2. En «Mis tutorías» publique una tutoría con nivel, modalidad y cupo.\n" +
        "3. Agregue sus horarios semanales con el salón o enlace.\n" +
        "Si ya tiene cuenta de estudiante, la coordinación puede cambiar su rol.",
    },
  },
  {
    id: "modalidades",
    frases: ["que es hibrida", "modalidad virtual", "modalidad presencial", "diferencia entre presencial y virtual", "niveles de tutoria"],
    respuesta: {
      texto:
        "Modalidades:\n• Presencial: en un salón de la universidad.\n• Virtual: por un enlace de reunión.\n• Híbrida: puede usar salón o enlace.\n" +
        "Niveles: Básico, Intermedio y Avanzado, según lo que ya domine de la materia.\n" +
        "El salón o enlace de cada sesión aparece en «Mi agenda» cuando ya tiene la reserva.",
    },
  },

  // --- Quienes reservan (estudiante y tutor) ---------------------------------
  {
    id: "mis-reservas",
    etiqueta: "📅 Mis próximas reservas",
    roles: QUIENES_RESERVAN,
    frases: ["mis reservas", "mis proximas reservas", "que tutorias tengo", "cuando es mi tutoria", "mi agenda", "donde es mi tutoria", "enlace de la reunion"],
    async responder() {
      const proximas = reservasActivasFuturas(await listarMisReservas()).sort(porFechaYHora);
      if (proximas.length === 0) {
        return {
          texto: "No tiene reservas próximas. ¿Buscamos una tutoría? Escriba el nombre de la materia.",
          enlaces: [{ a: "/tutorias", texto: "Ver catálogo" }],
        };
      }
      return {
        texto: `Tiene ${contarReservas(proximas.length)} ${proximas.length === 1 ? "próxima" : "próximas"}:`,
        tarjetas: proximas.slice(0, 3).map(tarjetaReserva),
        enlaces: [{ a: "/mis-reservas", texto: "Ver Mi agenda (salón o enlace)" }],
      };
    },
  },
  {
    id: "como-reservar",
    etiqueta: "🗓️ ¿Cómo reservo?",
    roles: [INVITADO, ...QUIENES_RESERVAN],
    frases: ["como reservo", "como hago una reserva", "reservar un cupo", "quiero reservar", "apartar cupo"],
    respuesta: {
      texto:
        "1. Busque la tutoría en el catálogo y ábrala.\n" +
        "2. Pulse «Reservar un cupo».\n" +
        "3. Elija el horario semanal y la fecha de la sesión, y confirme.\n" +
        "La reserva queda en «Mi agenda». Necesita una sesión iniciada como Estudiante o Tutor.",
      enlaces: [{ a: "/tutorias", texto: "Ir al catálogo" }],
    },
  },
  {
    id: "no-pude-reservar",
    etiqueta: "⚠️ ¿Por qué no pude reservar?",
    roles: QUIENES_RESERVAN,
    frases: ["no pude reservar", "no me deja reservar", "error al reservar", "por que no puedo reservar", "sin cupo", "no hay cupo"],
    respuesta: {
      texto:
        "Las causas más comunes:\n" +
        "• La sesión de esa fecha ya no tiene cupo.\n" +
        "• Ya tiene otra reserva activa ese día que se cruza en horas.\n" +
        "• La sesión es hoy y ya empezó.\n" +
        "• Si es tutor: es su propia tutoría o está dictando una tutoría suya en esa franja.\n" +
        "El mensaje de error de la pantalla le indica cuál fue. Pruebe con otra fecha u otro horario.",
    },
  },
  {
    id: "como-cancelar",
    etiqueta: "✖️ ¿Cómo cancelo?",
    roles: QUIENES_RESERVAN,
    frases: ["como cancelo", "cancelar reserva", "no puedo ir a la tutoria", "anular reserva", "no voy a asistir"],
    respuesta: {
      texto:
        "En «Mi agenda», pestaña «Próximas», pulse «Cancelar» en la reserva. " +
        "Solo se cancelan reservas activas; así libera el cupo para otra persona.",
      enlaces: [{ a: "/mis-reservas", texto: "Ir a Mi agenda" }],
    },
  },
  {
    id: "reserva-cancelada",
    roles: QUIENES_RESERVAN,
    frases: ["me cancelaron la tutoria", "me cancelaron la reserva", "por que se cancelo mi reserva", "reserva cancelada"],
    respuesta: {
      texto:
        "Si el tutor desactiva un horario o inactiva la tutoría, las reservas de las sesiones que aún no empiezan se cancelan solas. " +
        "El tutor también puede cancelar una reserva desde su agenda. Las verá en «Mi agenda» → «Canceladas».",
      enlaces: [
        { a: "/mis-reservas", texto: "Ir a Mi agenda" },
        { a: "/tutorias", texto: "Buscar otra tutoría" },
      ],
    },
  },
  {
    id: "por-calificar",
    etiqueta: "⭐ ¿Qué me falta calificar?",
    roles: QUIENES_RESERVAN,
    frases: ["como califico", "calificar tutoria", "valorar sesion", "dejar comentario", "que me falta calificar", "estrellas"],
    async responder() {
      const pendientes = (await listarMisReservas()).filter(
        (r) => r.id_estado === ESTADO.COMPLETADO && !r.valoracion
      );
      const comoCalificar =
        "Cuando el tutor marca la sesión como completada, en «Mi agenda» → «Completadas» aparece «Valorar sesión» " +
        "para calificarla de 1 a 5 estrellas (una vez por reserva).";
      if (pendientes.length === 0) {
        return { texto: `No tiene sesiones pendientes por calificar. ${comoCalificar}` };
      }
      return {
        texto: `Tiene ${pendientes.length} ${pendientes.length === 1 ? "sesión" : "sesiones"} por calificar. ${comoCalificar}`,
        tarjetas: pendientes.slice(0, 3).map(tarjetaReserva),
        enlaces: [{ a: "/mis-reservas", texto: "Ir a Mi agenda" }],
      };
    },
  },

  // --- Tutor -----------------------------------------------------------------
  {
    id: "agenda-hoy",
    etiqueta: "👥 Mi agenda de hoy",
    roles: [ROL.TUTOR],
    frases: ["agenda de hoy", "quien viene hoy", "mis sesiones de hoy", "tutorias que doy hoy", "estudiantes inscritos"],
    async responder() {
      const activas = (await listarReservasRecibidas(hoy())).filter((r) => r.id_estado === ESTADO.ACTIVO);
      if (activas.length === 0) {
        return {
          texto: "Hoy no tiene estudiantes inscritos en sus tutorías.",
          enlaces: [{ a: "/tutor/reservas", texto: "Ver Agenda de tutorías" }],
        };
      }
      // Una tarjeta por sesión (mismo horario) con cuántos estudiantes vienen
      const sesiones = new Map();
      for (const r of activas.sort(porFechaYHora)) {
        const sesion = sesiones.get(r.horario.id) ?? { reserva: r, cantidad: 0 };
        sesion.cantidad++;
        sesiones.set(r.horario.id, sesion);
      }
      return {
        texto: `Hoy tiene ${contarReservas(activas.length)} en ${sesiones.size} ${sesiones.size === 1 ? "sesión" : "sesiones"}:`,
        tarjetas: [...sesiones.values()].map(({ reserva, cantidad }) => ({
          titulo: reserva.tutoria.titulo,
          subtitulo: reserva.tutoria.materia.nombre,
          detalle: `${reserva.horario.hora_inicio} – ${reserva.horario.hora_fin} · ${contarReservas(cantidad)}`,
          a: "/tutor/reservas",
        })),
        enlaces: [{ a: "/tutor/reservas", texto: "Ver Agenda de tutorías" }],
      };
    },
  },
  {
    id: "publicar-tutoria",
    etiqueta: "➕ ¿Cómo publico una tutoría?",
    roles: [ROL.TUTOR],
    frases: ["como publico una tutoria", "crear tutoria", "nueva tutoria", "ofrecer tutoria", "agregar horario", "asociar materia"],
    respuesta: {
      texto:
        "1. En «Mis materias» asóciese a la materia (solo puede publicar de materias asociadas).\n" +
        "2. En «Mis tutorías» pulse «Nueva tutoría»: título, nivel, modalidad y cupo.\n" +
        "3. En «Editar y horarios» agregue los bloques semanales con su salón o enlace.",
      enlaces: [
        { a: "/tutor/materias", texto: "Mis materias" },
        { a: "/tutor/tutorias/nueva", texto: "Nueva tutoría" },
      ],
    },
  },
  {
    id: "error-horario",
    etiqueta: "⚠️ ¿Por qué no me deja crear el horario?",
    roles: [ROL.TUTOR],
    frases: ["no me deja crear el horario", "error al agregar horario", "horario se cruza", "salon ocupado", "capacidad del salon", "recurso no compatible"],
    respuesta: {
      texto:
        "Un horario nuevo se rechaza si:\n" +
        "• La tutoría está inactiva.\n" +
        "• El recurso no corresponde a la modalidad (Presencial → salón, Virtual → enlace).\n" +
        "• La capacidad del salón o enlace es menor que el cupo de la tutoría.\n" +
        "• Se cruza con otro horario suyo o con otro horario en el mismo salón.\n" +
        "• Se cruza con una reserva que usted hizo como estudiante.",
    },
  },
  {
    id: "completar-sesion",
    roles: [ROL.TUTOR],
    frases: ["completar sesion", "marcar completada", "como completo una reserva", "no me deja completar"],
    respuesta: {
      texto:
        "En «Agenda de tutorías», pestaña «Por completar», marque la sesión como completada. " +
        "Solo se puede cuando la sesión ya terminó; así sus estudiantes pueden calificarla.",
      enlaces: [{ a: "/tutor/reservas", texto: "Ir a Agenda de tutorías" }],
    },
  },
  {
    id: "inactivar-tutoria",
    roles: [ROL.TUTOR],
    frases: ["inactivar tutoria", "desactivar horario", "cerrar tutoria", "que pasa si desactivo", "cambiar cupo", "cambiar modalidad"],
    respuesta: {
      texto:
        "Al desactivar un horario o inactivar una tutoría, se cancelan las reservas de las sesiones que aún no empiezan " +
        "(inactivar la tutoría también desactiva sus horarios). El cupo no puede quedar por debajo de las reservas de una sesión futura " +
        "ni superar la capacidad del salón, y la modalidad debe seguir siendo compatible con sus recursos.",
    },
  },

  // --- Administrador ---------------------------------------------------------
  {
    id: "admin-materias",
    etiqueta: "📚 ¿Cómo gestiono materias?",
    roles: [ROL.ADMINISTRADOR],
    frases: ["crear materia", "nueva materia", "editar materia", "codigo de materia"],
    respuesta: {
      texto: "En «Materias» pulse «Nueva materia» con nombre, código (único) y créditos. Desde la misma lista puede editarlas.",
      enlaces: [{ a: "/admin/materias", texto: "Ir a Materias" }],
    },
  },
  {
    id: "admin-recursos",
    etiqueta: "🏫 ¿Cómo gestiono recursos?",
    roles: [ROL.ADMINISTRADOR],
    frases: ["crear recurso", "nuevo salon", "agregar enlace", "inactivar recurso", "no puedo inactivar el salon", "capacidad del recurso"],
    respuesta: {
      texto:
        "En «Recursos» pulse «Nuevo recurso»: tipo (Físico o Virtual), nombre, ubicación o enlace y capacidad.\n" +
        "Si un recurso tiene horarios activos no se puede inactivar ni cambiar de tipo, y su capacidad no puede quedar " +
        "por debajo del cupo de esas tutorías.",
      enlaces: [{ a: "/admin/recursos", texto: "Ir a Recursos" }],
    },
  },

  // --- Conversación ----------------------------------------------------------
  {
    id: "saludo",
    frases: ["hola", "buenos dias", "buenas tardes", "buenas noches", "hey", "ayuda", "menu"],
    respuesta: { texto: "¡Hola! Estas son algunas cosas en las que puedo ayudarle:", menu: true },
  },
  {
    id: "gracias",
    frases: ["gracias", "muchas gracias", "listo", "perfecto", "ok gracias", "chao"],
    respuesta: { texto: "¡Con gusto! Si necesita algo más, aquí estoy. 🎓" },
  },
];

// Intenciones que puede usar el usuario actual (null = visitante)
export const intencionesDe = (usuario) => {
  const rol = usuario?.id_rol ?? INVITADO;
  return INTENCIONES.filter((i) => !i.roles || i.roles.includes(rol));
};
