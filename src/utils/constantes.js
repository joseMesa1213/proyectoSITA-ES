// Mismos IDs que proyectoSITA-ES_backend/src/constants/catalogos.js (sembrados en la BD).

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
});

// Tipo de recurso que acepta cada modalidad (Híbrida: cualquiera → undefined)
export const RECURSO_POR_MODALIDAD = Object.freeze({
  Presencial: "Físico",
  Virtual: "Virtual",
});
