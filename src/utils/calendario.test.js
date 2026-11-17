import { describe, expect, test } from "vitest";
import { aUtc, archivoIcs, enlaceGoogleCalendar, eventosDelHorario, lugarDeRecurso, nombreArchivo } from "./calendario.js";

const EVENTO = {
  uid: "reserva-12@sita-es",
  titulo: "Tutoría: SQL, joins; y más",
  fecha: "2026-11-20",
  hora_inicio: "18:00",
  hora_fin: "19:30",
  lugar: "https://meet.jit.si/SITA-ES-SQL-abc",
  detalles: "Con Ana Tutora\nMateria: Bases de Datos",
};

describe("calendario", () => {
  test("aUtc: hora de Bogotá a UTC (+5 h), cruzando la medianoche", () => {
    expect(aUtc("2026-11-20", "14:00")).toBe("20261120T190000Z");
    expect(aUtc("2026-11-20", "21:30")).toBe("20261121T023000Z");
  });

  test("enlace de Google Calendar con título, fechas en UTC y lugar", () => {
    const url = new URL(enlaceGoogleCalendar(EVENTO));
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe(EVENTO.titulo);
    expect(url.searchParams.get("dates")).toBe("20261120T230000Z/20261121T003000Z");
    expect(url.searchParams.get("location")).toBe(EVENTO.lugar);
  });

  test(".ics: evento con recordatorio de 30 min, texto escapado y líneas CRLF", () => {
    const ics = archivoIcs([EVENTO], new Date("2026-11-17T12:00:00Z"));
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics).toContain("UID:reserva-12@sita-es\r\n");
    expect(ics).toContain("DTSTAMP:20261117T120000Z");
    expect(ics).toContain("DTSTART:20261120T230000Z");
    expect(ics).toContain("SUMMARY:Tutoría: SQL\\, joins\\; y más");
    expect(ics).toContain("DESCRIPTION:Con Ana Tutora\\nMateria: Bases de Datos");
    expect(ics).toContain("TRIGGER:-PT30M");
    expect(ics).not.toContain("RRULE");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  test(".ics semanal (horario del tutor) y líneas largas plegadas a 75 bytes", () => {
    const ics = archivoIcs([{ ...EVENTO, semanal: true, detalles: "á".repeat(100) }]);
    expect(ics).toContain("RRULE:FREQ=WEEKLY");
    for (const linea of ics.split("\r\n")) {
      expect(new TextEncoder().encode(linea).length).toBeLessThanOrEqual(75);
    }
    // Al desplegar (quitar CRLF + espacio) vuelve el texto original
    expect(ics.replace(/\r\n /g, "")).toContain(`DESCRIPTION:${"á".repeat(100)}`);
  });

  test("lugar legible y nombre de archivo seguro", () => {
    expect(lugarDeRecurso({ nombre: "Sala", ubicacion: "https://meet.jit.si/x" })).toBe("https://meet.jit.si/x");
    expect(lugarDeRecurso({ nombre: "Aula 19-101", ubicacion: "Bloque 19" })).toBe("Aula 19-101 — Bloque 19");
    expect(lugarDeRecurso(undefined)).toBe("");
    expect(nombreArchivo("Cálculo I: límites")).toBe("calculo-i-limites");
  });
});

describe("eventosDelHorario", () => {
  test("un evento semanal por horario activo de tutoría activa, en el día de esta semana", () => {
    const tutorias = [
      { id: 1, id_estado: 1, titulo: "SQL", cupo: 10, enlace_reunion: "https://meet.jit.si/x", materia: { nombre: "BD" },
        horarios: [
          { id: 5, id_estado: 1, dia: "Domingo", hora_inicio: "10:00", hora_fin: "11:00", recurso: { nombre: "Sala" } },
          { id: 6, id_estado: 2, dia: "Lunes", hora_inicio: "10:00", hora_fin: "11:00", recurso: { nombre: "Sala" } },
        ] },
      { id: 2, id_estado: 2, titulo: "Inactiva", cupo: 1, horarios: [{ id: 7, id_estado: 1, dia: "Lunes", hora_inicio: "08:00", hora_fin: "09:00" }] },
    ];
    const eventos = eventosDelHorario(tutorias, "2026-11-16");
    expect(eventos).toEqual([expect.objectContaining({
      uid: "horario-5@sita-es", fecha: "2026-11-22", semanal: true, lugar: "https://meet.jit.si/x", titulo: "Dictar: SQL",
    })]);
  });
});
