import { pedir } from "./cliente.js";

// Solicitudes para ser tutor. Estados: "Pendiente" → "Aprobado" | "Rechazado"

// Estudiante: pide ser tutor desde su perfil. motivo es opcional
export const solicitarSerTutor = (motivo) => pedir("/solicitudes-tutor", { metodo: "POST", cuerpo: { motivo } });
// Su última solicitud, o null si nunca ha solicitado
export const obtenerMiSolicitud = () => pedir("/solicitudes-tutor/mia");

// Administrador. estado: "pendientes" (por defecto) | "historial"
export const listarSolicitudes = (estado) => pedir("/solicitudes-tutor", { consulta: { estado } });
export const aprobarSolicitud = (id, observacion) =>
  pedir(`/solicitudes-tutor/${id}/aprobar`, { metodo: "PATCH", cuerpo: { observacion } });
// observacion es obligatoria: el usuario la ve en su perfil
export const rechazarSolicitud = (id, observacion) =>
  pedir(`/solicitudes-tutor/${id}/rechazar`, { metodo: "PATCH", cuerpo: { observacion } });
