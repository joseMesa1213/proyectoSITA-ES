import { ESTADO } from "./constantes.js";
import { horaActual, hoy } from "./fechas.js";

// ¿La sesión ya terminó? (fecha pasada, u hoy con la hora de fin ya cumplida)
// Es la misma regla que aplica el backend al completar.
export const sesionTermino = (fecha, horaFin) =>
  fecha < hoy() || (fecha === hoy() && horaFin <= horaActual());

// Reservas ACTIVAS cuya sesión todavía no termina, opcionalmente filtradas.
//   reservasActivasFuturas(reservas, (r) => r.tutoria.id === 3)
export const reservasActivasFuturas = (reservas, filtro = () => true) =>
  reservas.filter(
    (r) => r.id_estado === ESTADO.ACTIVO && !sesionTermino(r.fecha_sesion, r.horario.hora_fin) && filtro(r)
  );

// "1 reserva" / "3 reservas"
export const contarReservas = (n) => `${n} ${n === 1 ? "reserva" : "reservas"}`;
