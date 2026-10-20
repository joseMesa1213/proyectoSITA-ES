import { pedir } from "./cliente.js";

// Estudiante o tutor. datos: { id_horario, id_recurso, fecha_sesion: "YYYY-MM-DD" }
export const crearReserva = (datos) => pedir("/reservas", { metodo: "POST", cuerpo: datos });
export const listarMisReservas = () => pedir("/reservas/mias");
export const cancelarReserva = (id) => pedir(`/reservas/${id}/cancelar`, { metodo: "PATCH" });

// Solo tutor: reservas recibidas en sus tutorías (fecha_sesion opcional)
export const listarReservasRecibidas = (fecha_sesion) =>
  pedir("/reservas/tutor", { consulta: { fecha_sesion } });
export const completarReserva = (id) => pedir(`/reservas/${id}/completar`, { metodo: "PATCH" });
