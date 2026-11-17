// Mismos IDs que proyectoSITA-ES_backend/src/constants/catalogos.js (sembrados en la BD).

// id_rol es un NIVEL de permisos: 1 Estudiante (todos al registrarse), 2 Estudiante + Tutor
// (solicitud aprobada por un administrador), 3 Administrador. Nadie lo elige al registrarse.
export const ROL = Object.freeze({
  ESTUDIANTE: 1,
  TUTOR: 2,
  ADMINISTRADOR: 3,
});

export const NOMBRE_ROL = Object.freeze({
  [ROL.ESTUDIANTE]: "Estudiante",
  [ROL.TUTOR]: "Tutor",
  [ROL.ADMINISTRADOR]: "Administrador",
});

// Roles que pueden reservar (el administrador no reserva)
export const ROLES_QUE_RESERVAN = [ROL.ESTUDIANTE, ROL.TUTOR];

export const ESTADO = Object.freeze({
  ACTIVO: 1,
  INACTIVO: 2,
  PENDIENTE: 3,
  CANCELADO: 4,
  COMPLETADO: 5,
  APROBADO: 6, // solicitud de tutor
  RECHAZADO: 7, // solicitud de tutor
});

// Tipo de recurso que acepta cada modalidad (Híbrida: cualquiera → undefined)
export const RECURSO_POR_MODALIDAD = Object.freeze({
  Presencial: "Físico",
  Virtual: "Virtual",
});

// Las tutorías Virtuales tienen su propia sala de Jitsi Meet, creada por el backend.
// Cupo máximo que admite esa sala (CAPACIDAD_SALA_JITSI en el backend).
export const CUPO_MAXIMO_VIRTUAL = 100;

// Solicitudes de tutoría ("pedir una tutoría"): el backend reutiliza estados del catálogo
export const ESTADO_SOLICITUD_TUTORIA = Object.freeze({
  ABIERTA: ESTADO.PENDIENTE,
  ATENDIDA: ESTADO.COMPLETADO,
  RETIRADA: ESTADO.CANCELADO,
  VENCIDA: ESTADO.INACTIVO,
});
export const NOMBRE_ESTADO_SOLICITUD_TUTORIA = Object.freeze({
  [ESTADO.PENDIENTE]: "Abierta",
  [ESTADO.COMPLETADO]: "Atendida",
  [ESTADO.CANCELADO]: "Retirada",
  [ESTADO.INACTIVO]: "Vencida",
});
export const MAXIMO_SOLICITUDES_ABIERTAS = 3; // igual que MAXIMO_ABIERTAS en el backend
