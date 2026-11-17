// "Agregar a mi calendario": enlaces de Google Calendar y archivos .ics (Outlook, Apple, Google…).
// Sin API ni credenciales: el calendario de cada persona se encarga de los recordatorios.
// Las horas de SITA-ES son de Bogotá (UTC−5, sin horario de verano); se pasan a UTC para que
// cualquier calendario las muestre bien en su zona.

import { ESTADO } from "./constantes.js";
import { DIAS } from "./fechas.js";
import { sumarDias } from "./horarioSemanal.js";

// "2026-11-20", "14:00" → "20261120T190000Z"
export const aUtc = (fecha, hora) =>
  new Date(`${fecha}T${hora}:00-05:00`).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/**
 * Enlace "Agregar a Google Calendar" para un evento:
 * { titulo, fecha: "YYYY-MM-DD", hora_inicio, hora_fin, lugar?, detalles? }
 */
export function enlaceGoogleCalendar({ titulo, fecha, hora_inicio, hora_fin, lugar = "", detalles = "" }) {
  const parametros = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo,
    dates: `${aUtc(fecha, hora_inicio)}/${aUtc(fecha, hora_fin)}`,
    details: detalles,
    location: lugar,
  });
  return `https://calendar.google.com/calendar/render?${parametros}`;
}

// Texto de un campo .ics: se escapan \ ; , y los saltos de línea (RFC 5545 §3.3.11)
const escapar = (texto = "") =>
  String(texto).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Las líneas de un .ics no deben pasar de 75 bytes: se parten y la continuación empieza con un espacio
function plegar(linea) {
  const codificador = new TextEncoder();
  const partes = [];
  let actual = "";
  let bytes = 0;
  for (const caracter of linea) {
    const tamano = codificador.encode(caracter).length;
    const limite = partes.length === 0 ? 75 : 74;
    if (bytes + tamano > limite) {
      partes.push(actual);
      actual = "";
      bytes = 0;
    }
    actual += caracter;
    bytes += tamano;
  }
  partes.push(actual);
  return partes.join("\r\n ");
}

/**
 * Contenido de un archivo .ics con uno o varios eventos:
 * { uid, titulo, fecha, hora_inicio, hora_fin, lugar?, detalles?, url?, semanal? }
 * - semanal: el evento se repite cada semana (horario del tutor).
 * - Cada evento trae un recordatorio 30 minutos antes.
 * - uid fijo por evento: si se importa otra vez, el calendario lo actualiza en lugar de duplicarlo.
 */
export function archivoIcs(eventos, ahora = new Date()) {
  const marca = ahora.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lineas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SITA-ES//Tutorias//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const e of eventos) {
    lineas.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${marca}`,
      `DTSTART:${aUtc(e.fecha, e.hora_inicio)}`,
      `DTEND:${aUtc(e.fecha, e.hora_fin)}`,
      ...(e.semanal ? ["RRULE:FREQ=WEEKLY"] : []),
      `SUMMARY:${escapar(e.titulo)}`,
      ...(e.lugar ? [`LOCATION:${escapar(e.lugar)}`] : []),
      ...(e.detalles ? [`DESCRIPTION:${escapar(e.detalles)}`] : []),
      ...(e.url ? [`URL:${e.url}`] : []),
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapar(e.titulo)}`,
      "TRIGGER:-PT30M",
      "END:VALARM",
      "END:VEVENT"
    );
  }
  lineas.push("END:VCALENDAR");
  return lineas.map(plegar).join("\r\n") + "\r\n";
}

// Descarga el .ics en el navegador
export function descargarIcs(nombreArchivo, contenido) {
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/calendar;charset=utf-8" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Lugar legible: un enlace (sala virtual) se deja tal cual; un salón, "Aula 19-101 — Bloque 19"
export const lugarDeRecurso = (recurso) => {
  if (!recurso) return "";
  if (/^https?:\/\//i.test(recurso.ubicacion ?? "")) return recurso.ubicacion;
  return recurso.ubicacion ? `${recurso.nombre} — ${recurso.ubicacion}` : recurso.nombre;
};

// Nombre de archivo seguro: "Cálculo I: límites" → "calculo-i-limites"
export const nombreArchivo = (texto) =>
  String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "sita-es";

/**
 * Horario semanal del tutor como eventos que se repiten cada semana (uno por horario activo de
 * cada tutoría activa), empezando en el día correspondiente de la semana de `lunesActual`.
 * uid por horario: al exportar de nuevo, el calendario actualiza los eventos en lugar de duplicarlos.
 */
export function eventosDelHorario(tutorias, lunesActual) {
  return tutorias
    .filter((t) => t.id_estado === ESTADO.ACTIVO)
    .flatMap((t) =>
      t.horarios
        .filter((h) => h.id_estado === ESTADO.ACTIVO)
        .map((h) => ({
          uid: `horario-${h.id}@sita-es`,
          titulo: `Dictar: ${t.titulo}`,
          fecha: sumarDias(lunesActual, (DIAS.indexOf(h.dia) + 6) % 7),
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          lugar: t.enlace_reunion ?? h.recurso?.nombre ?? "",
          detalles: `Tutoría de ${t.materia?.nombre ?? ""} en SITA-ES (cupo ${t.cupo})`,
          semanal: true,
        }))
    );
}
