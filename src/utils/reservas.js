import { ESTADO } from "./constantes.js";
import { formatearFechaCorta, horaActual, hoy } from "./fechas.js";
import { sumarDias } from "./horarioSemanal.js";

// El backend completa solas las reservas ACTIVAS 24 h después de terminar la sesión
// (HORAS_PARA_AUTOCOMPLETAR en reservas/autocompletar.js). Siempre es un día después a la misma hora.
export const HORAS_AUTOCOMPLETAR = 24;

// "Sáb, 21 de nov a las 19:30": cuándo se completa sola una sesión que terminó y nadie marcó
export const textoAutocompletado = (fecha, horaFin) =>
  `${formatearFechaCorta(sumarDias(fecha, HORAS_AUTOCOMPLETAR / 24))} a las ${horaFin}`;

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
