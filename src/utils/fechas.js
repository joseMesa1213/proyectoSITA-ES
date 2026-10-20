// Fechas "YYYY-MM-DD" y horas "HH:MM", siempre en la zona horaria de la universidad.
// Truco: las fechas se manejan como medianoche UTC para que sumar días no se corra
// por el cambio de zona horaria del navegador.

const ZONA_HORARIA = "America/Bogota";

// Índice = getUTCDay() (0 = Domingo), igual que en el backend
export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// "2026-10-20" de hoy en Bogotá (en-CA formatea como YYYY-MM-DD)
export const hoy = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(new Date());

// "14:05" de ahora en Bogotá
export const horaActual = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());

const textoAFecha = (texto) => new Date(`${texto}T00:00:00Z`);
const fechaATexto = (fecha) => fecha.toISOString().slice(0, 10);

/**
 * Próximas `cantidad` fechas que caen en `dia` (ej. "Lunes"), empezando hoy.
 * Si hoy es ese día pero la sesión ya empezó (horaInicio <= ahora), hoy se salta.
 * Así el usuario solo elige fechas que el backend va a aceptar.
 */
export function proximasFechas(dia, horaInicio, cantidad = 6) {
  const indiceDia = DIAS.indexOf(dia);
  if (indiceDia === -1) return [];

  const fecha = textoAFecha(hoy());
  let diasHastaElPrimero = (indiceDia - fecha.getUTCDay() + 7) % 7;
  if (diasHastaElPrimero === 0 && horaInicio <= horaActual()) diasHastaElPrimero = 7;
  fecha.setUTCDate(fecha.getUTCDate() + diasHastaElPrimero);

  const fechas = [];
  for (let i = 0; i < cantidad; i++) {
    fechas.push(fechaATexto(fecha));
    fecha.setUTCDate(fecha.getUTCDate() + 7);
  }
  return fechas;
}

// Solo la primera letra en mayúscula (la clase CSS capitalize las pondría todas: "De Octubre")
const primeraMayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// "2026-10-26" → "Lunes, 26 de octubre de 2026"
export const formatearFecha = (texto) =>
  primeraMayuscula(
    new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeZone: "UTC" }).format(textoAFecha(texto))
  );

// "2026-10-26" → "Lun, 26 de oct"
export const formatearFechaCorta = (texto) =>
  primeraMayuscula(
    new Intl.DateTimeFormat("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(textoAFecha(texto))
  );

// Fecha y hora completas (timestamps del backend) → "20 oct 2026"
export const formatearMarcaDeTiempo = (iso) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: ZONA_HORARIA }).format(new Date(iso));

export const esHoy = (texto) => texto === hoy();
