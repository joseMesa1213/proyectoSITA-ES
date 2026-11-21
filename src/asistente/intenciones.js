import { listarMisReservas, listarReservasRecibidas } from "../api/reservas.js";
import { listarSolicitudes, obtenerMiSolicitud } from "../api/solicitudes.js";
import { listarMisSolicitudesTutoria, listarSolicitudesParaMi } from "../api/solicitudesTutoria.js";
import { obtenerEstadisticas } from "../api/estadisticas.js";
import { ESTADO, ESTADO_SOLICITUD_TUTORIA, MAXIMO_SOLICITUDES_ABIERTAS, ROL, ROLES_QUE_RESERVAN, puedeEnsenar } from "../utils/constantes.js";
import { diaDeLaSemana, formatearFechaCorta, hoy } from "../utils/fechas.js";
import { contarReservas, reservasActivasFuturas } from "../utils/reservas.js";

// Catálogo del asistente. Cada intención tiene:
//   id        identificador único
//   icono     emoji del botón (decorativo: el lector de pantalla no lo lee)
//   etiqueta  texto del botón en el menú (sin etiqueta no aparece en el menú, solo se detecta escribiendo)
//   roles     quién la ve; sin `roles` la ven todos. INVITADO = visitante sin sesión
//   frases    ejemplos de cómo lo escribiría alguien (sin tildes ni mayúsculas: el motor normaliza)
//   respuesta { texto, enlaces? }  o  responder(usuario) → respuesta (o Promise si consulta la API)
//   cedeAFiltros  si el texto trae modalidad, nivel o día, se busca con esos filtros en vez de responder
//                 esto ("tutorías virtuales" busca; "buscar tutoría" explica cómo buscar)
//   conversacion  saludos y agradecimientos: solo ganan si TODO el mensaje es eso
//
// Para agregar una pregunta frecuente basta con agregar un objeto a INTENCIONES.
// El asistente solo orienta: las acciones (reservar, cancelar, calificar) se hacen en sus pantallas.

export const INVITADO = "invitado";
const QUIENES_RESERVAN = ROLES_QUE_RESERVAN;

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
    cedeAFiltros: true,
    icono: "🔎",
    etiqueta: "Buscar tutoría",
    frases: ["buscar tutoria", "busco tutoria", "necesito una tutoria", "quiero una tutoria", "que tutorias hay", "busco un tutor", "monitoria"],
    respuesta: {
      texto: "Escriba el nombre o el código de la materia (por ejemplo: Cálculo, Física o 2508208) y le muestro las tutorías disponibles.",
      enlaces: [{ a: "/tutorias", texto: "Ver todo el catálogo" }],
    },
  },
  {
    id: "como-funciona",
    icono: "❓",
    etiqueta: "¿Cómo funciona SITA-ES?",
    frases: ["como funciona", "que es sita", "que es esto", "para que sirve", "como se usa la plataforma"],
    respuesta: {
      texto:
        "SITA-ES conecta estudiantes con tutores de la universidad:\n" +
        "• Los tutores publican tutorías por materia con horarios semanales.\n" +
        "• Usted elige una tutoría, un horario y la fecha de la sesión, y reserva su cupo.\n" +
        "• Después de la sesión puede calificarla (el tutor la marca como completada, o se completa sola a las 24 horas).\n" +
        "• ¿No encuentra lo que necesita? Pida una tutoría y los tutores de esa materia reciben un aviso.\n" +
        "• La campana de arriba le avisa de reservas, cancelaciones y respuestas.",
      enlaces: [{ a: "/tutorias", texto: "Ver tutorías" }],
    },
  },
  {
    // "Pedir una tutoría" (solicitudes de tutoría): el visitante necesita iniciar sesión
    id: "pedir-tutoria",
    icono: "🙋",
    etiqueta: "Pedir una tutoría",
    roles: [INVITADO, ...QUIENES_RESERVAN],
    frases: ["pedir una tutoria", "como pido una tutoria", "solicitar una tutoria", "no encuentro la tutoria que necesito", "no encuentro lo que busco",
      "nadie dicta esa materia", "que abran una tutoria", "mis pedidos de tutoria", "me respondieron mi pedido"],
    async responder(usuario) {
      const comoFunciona =
        "Si no encuentra en el catálogo lo que necesita, pídala: elija la materia, escriba el tema y, si quiere, su disponibilidad. " +
        "Los tutores de esa materia reciben un aviso y, cuando uno la atiende, le llega una notificación con el enlace a la tutoría. " +
        `Puede tener hasta ${MAXIMO_SOLICITUDES_ABIERTAS} abiertas; vencen a los 30 días sin respuesta.`;
      if (!usuario) {
        return { texto: `${comoFunciona} Para pedirla necesita iniciar sesión.`, enlaces: [{ a: "/login", texto: "Iniciar sesión" }] };
      }
      const solicitudes = await listarMisSolicitudesTutoria();
      const abiertas = solicitudes.filter((x) => x.id_estado === ESTADO_SOLICITUD_TUTORIA.ABIERTA);
      const atendidas = solicitudes.filter((x) => x.id_estado === ESTADO_SOLICITUD_TUTORIA.ATENDIDA && x.tutoria);
      const estado =
        abiertas.length === 0 && atendidas.length === 0
          ? ""
          : `\nUsted tiene ${abiertas.length} ${abiertas.length === 1 ? "abierta" : "abiertas"}` +
            (atendidas.length ? ` y ${atendidas.length} ${atendidas.length === 1 ? "atendida" : "atendidas"}.` : ".");
      return {
        texto: comoFunciona + estado,
        tarjetas: atendidas.slice(0, 3).map((x) => ({
          titulo: x.tutoria.titulo,
          subtitulo: `${x.materia.nombre} · respondió a «${x.tema}»`,
          a: `/tutorias/${x.tutoria.id}`,
        })),
        enlaces: [{ a: "/solicitudes", texto: abiertas.length >= MAXIMO_SOLICITUDES_ABIERTAS ? "Ver mis solicitudes" : "Pedir una tutoría" }],
      };
    },
  },
  {
    id: "compartir",
    frases: ["compartir tutoria", "compartir el enlace de una tutoria", "enviar tutoria por whatsapp", "recomendar tutoria a un amigo", "divulgar mi tutoria"],
    respuesta: {
      texto:
        "Abra la tutoría en el catálogo y pulse «Compartir»: puede copiar el enlace, enviarlo por WhatsApp o usar el menú " +
        "de compartir del teléfono. Quien lo abra ve el detalle sin necesidad de iniciar sesión.",
      enlaces: [{ a: "/tutorias", texto: "Ir al catálogo" }],
    },
  },
  {
    id: "registro",
    icono: "📝",
    etiqueta: "¿Cómo entro o me registro?",
    roles: [INVITADO],
    frases: ["como me registro", "crear cuenta", "registrarme", "no tengo cuenta", "como inicio sesion",
      "como entro", "como ingreso", "entrar con google", "iniciar sesion con google"],
    // Solo se entra con Google @udea.edu.co: la primera vez, ahí mismo se completa el registro
    respuesta: {
      texto:
        "Se entra con su cuenta de Google @udea.edu.co: en «Iniciar sesión» elija «Continuar con Google». " +
        "La primera vez completa sus datos (documento, programa y semestre) y queda como estudiante: puede " +
        "reservar de inmediato. Si quiere ofrecer tutorías, marque «Quiero ser tutor».",
      enlaces: [{ a: "/login", texto: "Iniciar sesión" }],
    },
  },
  {
    id: "ser-tutor",
    icono: "🎓",
    etiqueta: "¿Cómo ser tutor?",
    roles: [INVITADO, ROL.ESTUDIANTE],
    frases: ["como ser tutor", "quiero ser tutor", "quiero dar tutorias", "puedo ser monitor", "ensenar una materia"],
    // Ser tutor se SOLICITA: un administrador la revisa y, mientras tanto, se sigue siendo estudiante
    responder: (usuario) => ({
      texto:
        (usuario
          ? "Pídalo desde «Mi perfil» → «Solicitar ser tutor» (puede contar qué materias domina). "
          : "Al completar su registro con Google marque «Quiero ser tutor» (o pídalo después desde «Mi perfil»). ") +
        "Un administrador revisa la solicitud; mientras tanto puede reservar como siempre. Cuando la aprueben:\n" +
        "1. En «Mis materias» asóciese a las materias que domina.\n" +
        "2. En «Mis tutorías» publique una tutoría con nivel, modalidad y cupo.\n" +
        "3. Agregue sus horarios semanales con el salón (las tutorías virtuales reciben su propia sala de Jitsi).\n" +
        "Seguirá siendo estudiante: una sola cuenta para reservar y para ofrecer tutorías.",
      enlaces: usuario ? [{ a: "/perfil", texto: "Ir a Mi perfil" }] : [{ a: "/login", texto: "Iniciar sesión" }],
    }),
  },
  {
    id: "modalidades",
    cedeAFiltros: true,
    frases: ["que es hibrida", "modalidad virtual", "modalidad presencial", "diferencia entre presencial y virtual", "niveles de tutoria", "que modalidades hay"],
    respuesta: {
      texto:
        "Modalidades:\n• Presencial: en un salón de la universidad.\n• Virtual: cada tutoría tiene su propia sala de Jitsi Meet.\n• Híbrida: puede usar salón o enlace.\n" +
        "Niveles: Básico, Intermedio y Avanzado, según lo que ya domine de la materia.\n" +
        "El salón o enlace de cada sesión aparece en «Mi agenda» cuando ya tiene la reserva.",
    },
  },

  {
    id: "horarios",
    cedeAFiltros: true,
    frases: ["que horarios hay", "horarios disponibles", "a que hora son las tutorias", "horarios de las tutorias", "cuando hay tutorias"],
    responder: () => ({
      texto:
        "Cada tutoría tiene sus propios horarios semanales (por ejemplo, lunes de 10:00 a 12:00). " +
        "Escríbame la materia y el día, por ejemplo «cálculo el martes» o «qué hay hoy», y le muestro las opciones.",
      enlaces: [
        { a: `/tutorias?dia=${encodeURIComponent(diaDeLaSemana())}`, texto: "Ver tutorías de hoy" },
        { a: "/tutorias", texto: "Ver todo el catálogo" },
      ],
    }),
  },
  {
    id: "mejor-tutor",
    frases: ["quien es el mejor tutor", "mejor tutor", "tutor recomendado", "mejores tutorias", "tutoria mejor calificada", "que tutor me recomiendas"],
    respuesta: {
      texto:
        "No tengo un ranking de tutores, pero cada tutoría muestra su promedio de estrellas y los comentarios " +
        "de quienes ya asistieron. Ábrala desde el catálogo y revise «Valoraciones» antes de reservar.",
      enlaces: [{ a: "/tutorias", texto: "Ver el catálogo" }],
    },
  },
  {
    // Para todos los roles: SITA-ES no tiene contraseña propia, se entra con la cuenta de Google @udea.edu.co
    id: "contrasena",
    frases: ["olvide mi contrasena", "como cambio mi contrasena", "cambiar contrasena", "recuperar contrasena", "restablecer contrasena", "cambiar la clave", "olvide la clave",
      "no puedo entrar", "no puedo ingresar"],
    responder: (usuario) => ({
      texto:
        "SITA-ES no usa contraseña propia: se entra con la cuenta de Google @udea.edu.co («Continuar con Google»). " +
        "Si no puede entrar a su correo institucional, comuníquese con el soporte de la Universidad.",
      enlaces: usuario ? [] : [{ a: "/login", texto: "Iniciar sesión" }],
    }),
  },

  // --- Quienes reservan (estudiante y tutor) ---------------------------------
  {
    id: "mis-reservas",
    icono: "📅",
    etiqueta: "Mis próximas reservas",
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
    icono: "🗓️",
    etiqueta: "¿Cómo reservo?",
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
    icono: "⚠️",
    etiqueta: "¿Por qué no pude reservar?",
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
    icono: "✖️",
    etiqueta: "¿Cómo cancelo?",
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
        "El tutor también puede cancelar una reserva desde su agenda. En cualquier caso le llega un aviso a la campana, " +
        "y las verá en «Mi agenda» → «Canceladas».",
      enlaces: [
        { a: "/mis-reservas", texto: "Ir a Mi agenda" },
        { a: "/tutorias", texto: "Buscar otra tutoría" },
      ],
    },
  },
  {
    id: "por-calificar",
    icono: "⭐",
    etiqueta: "¿Qué me falta calificar?",
    roles: QUIENES_RESERVAN,
    frases: ["como califico", "calificar tutoria", "valorar sesion", "dejar comentario", "que me falta calificar", "estrellas"],
    async responder() {
      const pendientes = (await listarMisReservas()).filter(
        (r) => r.id_estado === ESTADO.COMPLETADO && !r.valoracion
      );
      const comoCalificar =
        "Cuando la sesión se completa (la marca el tutor, o sola 24 horas después de terminar), le llega un aviso y en " +
        "«Mi agenda» → «Completadas» aparece «Valorar sesión» para calificarla de 1 a 5 estrellas (una vez por reserva).";
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

  {
    id: "sesion-virtual",
    roles: QUIENES_RESERVAN,
    frases: ["enlace de jitsi", "como entro a la sesion virtual", "jitsi me pide iniciar sesion", "sala virtual",
      "link de la reunion", "donde esta el link", "no puedo entrar a la reunion"],
    responder: (usuario) => ({
      texto:
        "Cada tutoría virtual tiene su propia sala de Jitsi Meet (la misma para todos sus horarios).\n" +
        "• Estudiante: el enlace aparece en «Mi agenda», en su reserva.\n" +
        (puedeEnsenar(usuario) ? "• Tutor: lo ve en «Mis tutorías» → «Editar y horarios».\n" : "") +
        "Quien abre la sala primero debe iniciar sesión en Jitsi (por ejemplo, con Google); los demás entran solo con el enlace. " +
        "Por eso conviene que el tutor entre unos minutos antes.",
      enlaces: [
        { a: "/mis-reservas", texto: "Ir a Mi agenda" },
        ...(puedeEnsenar(usuario) ? [{ a: "/tutor/tutorias", texto: "Mis tutorías" }] : []),
      ],
    }),
  },
  {
    id: "calendario",
    roles: QUIENES_RESERVAN,
    frases: ["agregar al calendario", "google calendar", "recordatorio de la tutoria", "que me recuerde la tutoria",
      "exportar mi horario", "outlook", "alarma antes de la sesion"],
    responder: (usuario) => ({
      texto:
        "En «Mi agenda», cada reserva tiene «Agregar al calendario»: Google Calendar o un archivo .ics (Outlook, Apple), " +
        "con un recordatorio 30 minutos antes." +
        (puedeEnsenar(usuario)
          ? " Como tutor, también puede agregar cada sesión desde «Agenda de tutorías», o llevar todo su horario semanal " +
            "con «Exportar horario (.ics)» en «Mi horario»."
          : ""),
      enlaces: [
        { a: "/mis-reservas", texto: "Ir a Mi agenda" },
        ...(puedeEnsenar(usuario) ? [{ a: "/tutor/horario", texto: "Mi horario" }] : []),
      ],
    }),
  },
  {
    // Todos los que tienen sesión reciben avisos (el administrador, de solicitudes para ser tutor)
    id: "notificaciones",
    roles: [ROL.ESTUDIANTE, ROL.TUTOR, ROL.ADMINISTRADOR],
    frases: ["notificaciones", "avisos", "campana", "no me llegan los avisos", "que significa la campana", "marcar como leidas"],
    responder: (usuario) => ({
      texto:
        "La campana de arriba muestra cuántos avisos tiene sin leer. " +
        (usuario?.id_rol === ROL.ADMINISTRADOR
          ? "Le avisa de cada solicitud nueva para ser tutor y, como en cualquier cuenta, de lo que pase con sus reservas y sus tutorías."
          : "Le avisa cuando reservan o cancelan en sus tutorías (tutor), cuando cancelan su reserva, cuando una sesión " +
            "se completa y ya puede valorarla, y cuando responden sus solicitudes.") +
        " Al pulsar un aviso se marca como leído y lo lleva a la pantalla correspondiente. Los leídos se borran a los 30 días.",
    }),
  },
  {
    id: "estado-solicitud",
    roles: [ROL.ESTUDIANTE, ROL.TUTOR],
    sinAdministrador: true,
    frases: ["estado de mi solicitud", "mi solicitud de tutor", "ya me aprobaron", "cuando me aprueban como tutor",
      "por que me rechazaron", "solicitud rechazada"],
    async responder(usuario) {
      if (usuario.id_rol === ROL.TUTOR) {
        return { texto: "Su solicitud ya fue aprobada: usted es estudiante y tutor.", enlaces: [{ a: "/tutor/tutorias", texto: "Ir a Mis tutorías" }] };
      }
      const solicitud = await obtenerMiSolicitud();
      const enlaces = [{ a: "/perfil", texto: "Ir a Mi perfil" }];
      if (!solicitud) return { texto: "Todavía no ha solicitado ser tutor. Puede hacerlo desde «Mi perfil».", enlaces };
      if (solicitud.id_estado === ESTADO.PENDIENTE) {
        return { texto: "Su solicitud está en revisión. Un administrador la responderá; mientras tanto puede reservar como siempre.", enlaces };
      }
      if (solicitud.id_estado === ESTADO.RECHAZADO) {
        return { texto: `Su solicitud fue rechazada: «${solicitud.observacion}». Puede enviar una nueva desde «Mi perfil».`, enlaces };
      }
      return { texto: "Su solicitud fue aprobada. Abra «Mi perfil» para actualizar su menú de tutor.", enlaces };
    },
  },

  // --- Tutor -----------------------------------------------------------------
  {
    id: "solicitudes-estudiantes",
    icono: "📬",
    etiqueta: "Solicitudes de estudiantes",
    roles: [ROL.TUTOR],
    frases: ["solicitudes de estudiantes", "que tutorias piden", "que piden los estudiantes", "pedidos de los estudiantes",
      "atender una solicitud", "alguien pidio una tutoria"],
    async responder() {
      const solicitudes = await listarSolicitudesParaMi();
      const enlaces = [{ a: "/tutor/solicitudes", texto: "Ver Solicitudes de estudiantes" }];
      if (solicitudes.length === 0) {
        return {
          texto: "No hay solicitudes abiertas en sus materias. Cuando alguien pida una, le llega un aviso a la campana.",
          enlaces,
        };
      }
      return {
        texto:
          `Hay ${solicitudes.length} ${solicitudes.length === 1 ? "solicitud abierta" : "solicitudes abiertas"} en sus materias. ` +
          "Atiéndalas publicando una tutoría nueva (con los datos ya puestos) u ofreciendo una de las suyas:",
        tarjetas: solicitudes.slice(0, 3).map((x) => ({
          titulo: x.tema,
          subtitulo: `${x.materia.nombre} · ${x.estudiante.nombre} ${x.estudiante.apellido}`,
          detalle: x.disponibilidad ? `Disponibilidad: ${x.disponibilidad}` : undefined,
          a: "/tutor/solicitudes",
        })),
        enlaces,
      };
    },
  },
  {
    id: "mi-horario",
    roles: [ROL.TUTOR],
    frases: ["mi horario", "ver mi semana", "grilla de horarios", "mi horario semanal", "cuantas horas dicto"],
    respuesta: {
      texto:
        "«Mi horario» muestra su semana en una grilla: sus tutorías resaltadas (cada una de un color, con las reservas de cada " +
        "sesión) y las que usted reservó como estudiante. Haga clic en un espacio libre para agregar un horario ese día y a esa hora, " +
        "y con «Exportar horario (.ics)» lo lleva a su calendario.",
      enlaces: [{ a: "/tutor/horario", texto: "Ir a Mi horario" }],
    },
  },
  {
    id: "agenda-hoy",
    icono: "👥",
    etiqueta: "Mi agenda de hoy",
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
    icono: "➕",
    etiqueta: "¿Cómo publico una tutoría?",
    roles: [ROL.TUTOR],
    frases: ["como publico una tutoria", "crear tutoria", "nueva tutoria", "ofrecer tutoria", "agregar horario", "asociar materia"],
    respuesta: {
      texto:
        "1. En «Mis materias» asóciese a la materia (solo puede publicar de materias asociadas).\n" +
        "2. En «Mis tutorías» pulse «Nueva tutoría»: título, nivel, modalidad y cupo.\n" +
        "3. En «Editar y horarios» agregue los bloques semanales con su salón (o haga clic en un hueco de «Mi horario»). " +
        "Si es virtual no elige enlace: se le crea su sala de Jitsi automáticamente.",
      enlaces: [
        { a: "/tutor/materias", texto: "Mis materias" },
        { a: "/tutor/tutorias/nueva", texto: "Nueva tutoría" },
      ],
    },
  },
  {
    id: "error-horario",
    icono: "⚠️",
    etiqueta: "¿Por qué no me deja crear el horario?",
    roles: [ROL.TUTOR],
    frases: ["no me deja crear el horario", "error al agregar horario", "horario se cruza", "salon ocupado", "capacidad del salon", "recurso no compatible"],
    respuesta: {
      texto:
        "Un horario nuevo se rechaza si:\n" +
        "• La tutoría está inactiva.\n" +
        "• El salón no corresponde a la modalidad (las virtuales usan su sala de Jitsi; no se elige recurso).\n" +
        "• La capacidad del salón es menor que el cupo de la tutoría (una virtual admite hasta 100 cupos).\n" +
        "• Se cruza con otro horario suyo o con otro horario en el mismo salón.\n" +
        "• Se cruza con una reserva que usted hizo como estudiante.",
    },
  },
  {
    id: "completar-sesion",
    roles: [ROL.TUTOR],
    frases: ["completar sesion", "marcar completada", "como completo una reserva", "no me deja completar", "no asistio", "marcar inasistencia", "valoraciones de mi sesion"],
    respuesta: {
      texto:
        "En «Agenda de tutorías», pestaña «Por completar», use «Completar sesión» (solo cuando ya terminó) y desmarque a " +
        "quien no asistió: quienes asistieron pueden calificarla y a los demás se les avisa la inasistencia. Si no lo " +
        "hace, se completa sola 24 horas después con todos como asistentes. En el «Historial» verá la asistencia y las " +
        "valoraciones de cada sesión.",
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
        "(inactivar la tutoría también desactiva sus horarios) y cada estudiante recibe un aviso. El cupo no puede quedar por debajo de las reservas de una sesión futura " +
        "ni superar la capacidad del salón, y la modalidad debe seguir siendo compatible con sus recursos.",
    },
  },

  // --- Administrador ---------------------------------------------------------
  {
    id: "admin-materias",
    icono: "📚",
    etiqueta: "¿Cómo gestiono materias?",
    roles: [ROL.ADMINISTRADOR],
    frases: ["crear materia", "nueva materia", "editar materia", "codigo de materia"],
    respuesta: {
      texto: "En «Materias» pulse «Nueva materia» con nombre, código (único) y créditos. Desde la misma lista puede editarlas.",
      enlaces: [{ a: "/admin/materias", texto: "Ir a Materias" }],
    },
  },
  {
    id: "admin-recursos",
    icono: "🏫",
    etiqueta: "¿Cómo gestiono recursos?",
    roles: [ROL.ADMINISTRADOR],
    frases: ["crear recurso", "nuevo salon", "agregar enlace", "inactivar recurso", "no puedo inactivar el salon", "capacidad del recurso"],
    respuesta: {
      texto:
        "En «Recursos» pulse «Nuevo recurso»: tipo (Físico o Virtual), nombre, ubicación o enlace y capacidad.\n" +
        "Si un recurso tiene horarios activos no se puede inactivar ni cambiar de tipo, y su capacidad no puede quedar " +
        "por debajo del cupo de esas tutorías.\n" +
        "Las tutorías virtuales no usan estos enlaces: cada una recibe su sala de Jitsi automáticamente (no aparecen en la lista). " +
        "Los enlaces que cree aquí sirven para las híbridas.",
      enlaces: [{ a: "/admin/recursos", texto: "Ir a Recursos" }],
    },
  },

  {
    id: "admin-rol",
    icono: "👥",
    etiqueta: "Solicitudes de tutor",
    roles: [ROL.ADMINISTRADOR],
    frases: ["como cambio el rol de un usuario", "cambiar rol", "convertir estudiante en tutor", "asignar rol",
      "hacer administrador a un usuario", "aprobar tutores", "solicitudes de tutor", "crear administrador"],
    async responder() {
      const pendientes = (await listarSolicitudes("pendientes")).length;
      return {
        texto:
          (pendientes === 0 ? "No hay solicitudes pendientes. " : `Hay ${pendientes} ${pendientes === 1 ? "solicitud pendiente" : "solicitudes pendientes"}. `) +
          "Para hacer tutor a alguien, apruebe su solicitud en «Solicitudes»: el cambio aplica de inmediato, " +
          "sin que tenga que volver a iniciar sesión (los estudiantes la piden desde su perfil o al registrarse).\n" +
          "Los administradores no se crean desde la aplicación: el dueño de la base de datos usa el comando " +
          "npm run crear-admin en el backend, con el correo @udea.edu.co de la persona (entra con Google).",
        enlaces: [{ a: "/admin/solicitudes", texto: "Ir a Solicitudes" }],
      };
    },
  },

  {
    id: "estadisticas",
    icono: "📊",
    etiqueta: "¿Dónde faltan tutores?",
    roles: [ROL.ADMINISTRADOR],
    // "estadísticas" sola también es el nombre de una materia (Métodos Estadísticos): en empate gana la búsqueda
    frases: ["estadisticas de la plataforma", "ver estadisticas de uso", "reportes", "donde faltan tutores", "que materias necesitan tutores", "demanda sin tutor",
      "cuantas reservas hay", "ocupacion de las tutorias", "indicadores"],
    async responder() {
      const { resumen, demanda_sin_oferta: faltan, periodo } = await obtenerEstadisticas();
      const cifras =
        `En las últimas ${periodo.semanas} semanas: ${resumen.reservas} reservas` +
        (resumen.valoracion_promedio === null ? "" : `, valoración promedio ${resumen.valoracion_promedio.toLocaleString("es-CO")} / 5`) +
        ` y ${resumen.solicitudes_abiertas} ${resumen.solicitudes_abiertas === 1 ? "solicitud de tutoría abierta" : "solicitudes de tutoría abiertas"}.`;
      return {
        texto:
          cifras +
          (faltan.length === 0
            ? " Ninguna materia tiene demanda sin tutorías."
            : ` ${faltan.length === 1 ? "Esta materia pide" : "Estas materias piden"} tutorías y no tiene${faltan.length === 1 ? "" : "n"} ninguna activa:`),
        tarjetas: faltan.slice(0, 4).map((m) => ({
          titulo: m.nombre,
          subtitulo: `${m.solicitudes_abiertas} ${m.solicitudes_abiertas === 1 ? "abierta" : "abiertas"}` +
            (m.solicitudes_vencidas ? ` · ${m.solicitudes_vencidas} vencidas` : ""),
          detalle: m.tutores === 0 ? "Sin tutores asociados" : `${m.tutores} ${m.tutores === 1 ? "tutor asociado" : "tutores asociados"}`,
          a: "/admin/estadisticas",
        })),
        enlaces: [{ a: "/admin/estadisticas", texto: "Ver Estadísticas" }],
      };
    },
  },

  // --- Conversación ----------------------------------------------------------
  {
    id: "saludo",
    conversacion: true,
    frases: ["hola", "buenos dias", "buenas tardes", "buenas noches", "hey", "ayuda", "menu"],
    respuesta: { texto: "¡Hola! Estas son algunas cosas en las que puedo ayudarle:", menu: true },
  },
  {
    id: "gracias",
    conversacion: true,
    frases: ["gracias", "muchas gracias", "listo", "perfecto", "ok gracias", "chao"],
    respuesta: { texto: "¡Con gusto! Si necesita algo más, aquí estoy. 🎓" },
  },
];

// Visitante sin sesión: las preguntas sobre SUS reservas se responden pidiendo iniciar sesión.
// Las frases se toman de esas intenciones, así una pregunta nueva de ese tipo queda cubierta sola.
const REQUIEREN_SESION = ["mis-reservas", "no-pude-reservar", "como-cancelar", "reserva-cancelada", "por-calificar",
  "sesion-virtual", "calendario", "notificaciones"];
INTENCIONES.push({
  id: "requiere-sesion",
  roles: [INVITADO],
  frases: INTENCIONES.filter((i) => REQUIEREN_SESION.includes(i.id)).flatMap((i) => i.frases),
  respuesta: {
    texto:
      "Para ver o gestionar sus reservas necesita iniciar sesión con su cuenta de Google @udea.edu.co. " +
      "Si es la primera vez, ahí mismo completa su registro.",
    enlaces: [{ a: "/login", texto: "Iniciar sesión" }],
  },
});

// Intenciones que puede usar el usuario actual (null = visitante).
// El administrador es superusuario: también usa las del tutor (y por tanto las del estudiante que
// reserva). Se excluyen las que solo tienen sentido para quien aún no es tutor (ser tutor, estado de
// la solicitud), que se marcan con «sinAdministrador».
export const intencionesDe = (usuario) => {
  const rol = usuario?.id_rol ?? INVITADO;
  if (rol === ROL.ADMINISTRADOR) {
    return INTENCIONES.filter((i) => !i.roles || i.roles.includes(rol) || (i.roles.includes(ROL.TUTOR) && !i.sinAdministrador));
  }
  return INTENCIONES.filter((i) => !i.roles || i.roles.includes(rol));
};
