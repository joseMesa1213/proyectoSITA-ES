import { describe, expect, test } from "vitest";
import { aMinutos, armarSemana, lunesDe, sumarDias } from "./horarioSemanal.js";

const horario = (id, dia, hora_inicio, hora_fin, cambios = {}) => ({
  id, dia, hora_inicio, hora_fin, id_estado: 1, recurso: { nombre: "Aula 19-101" }, ...cambios,
});
const tutoria = (id, horarios, cambios = {}) => ({
  id, titulo: `Tutoría ${id}`, modalidad: "Presencial", cupo: 5, id_estado: 1, horarios, ...cambios,
});
const recibida = (idHorario, fecha_sesion, id_estado = 1) => ({ horario: { id: idHorario }, fecha_sesion, id_estado });

// Semana del lunes 16 al domingo 22 de noviembre de 2026
const LUNES = "2026-11-16";

describe("fechas de la semana", () => {
  test("lunesDe: cualquier día da el lunes de su semana (el domingo cierra la semana)", () => {
    expect(lunesDe("2026-11-16")).toBe(LUNES);
    expect(lunesDe("2026-11-19")).toBe(LUNES);
    expect(lunesDe("2026-11-22")).toBe(LUNES);
    expect(lunesDe("2026-11-23")).toBe("2026-11-23");
  });

  test("sumarDias cruza meses y aMinutos convierte HH:MM", () => {
    expect(sumarDias("2026-11-30", 1)).toBe("2026-12-01");
    expect(sumarDias(LUNES, -7)).toBe("2026-11-09");
    expect(aMinutos("14:30")).toBe(870);
  });
});

describe("armarSemana", () => {
  test("días de lunes a domingo con su fecha", () => {
    const { dias } = armarSemana({ lunes: LUNES });
    expect(dias.map((d) => d.dia)).toEqual(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]);
    expect(dias[6].fecha).toBe("2026-11-22");
  });

  test("solo horarios activos de tutorías activas; cuenta reservas de esa fecha sin las canceladas", () => {
    const tutorias = [
      tutoria(1, [horario(10, "Lunes", "10:00", "12:00"), horario(11, "Jueves", "14:00", "15:30", { id_estado: 2 })]),
      tutoria(2, [horario(20, "Martes", "08:00", "09:00")], { id_estado: 2 }),
    ];
    const recibidas = [
      recibida(10, "2026-11-16"), recibida(10, "2026-11-16", 5), recibida(10, "2026-11-16", 4), // 2 cuentan
      recibida(10, "2026-11-23"), // otra semana
    ];
    const { dias, resumen } = armarSemana({ tutorias, recibidas, lunes: LUNES });

    expect(dias[0].bloques).toHaveLength(1);
    expect(dias[0].bloques[0]).toMatchObject({ tipo: "dictada", id_tutoria: 1, reservas: 2, lugar: "Aula 19-101", color: 1 });
    expect(dias[1].bloques).toHaveLength(0);
    expect(dias[3].bloques).toHaveLength(0);
    expect(resumen).toMatchObject({ horasSemanales: 2, sesiones: 1, conReservas: 1, reservas: 2 });
  });

  test("reservas propias como estudiante: solo activas o completadas de esa semana", () => {
    const mias = [
      { id: 1, id_estado: 1, fecha_sesion: "2026-11-18", tutoria: { id: 9, titulo: "SQL" }, horario: { hora_inicio: "18:00", hora_fin: "19:00" }, recurso: { nombre: "Sala" } },
      { id: 2, id_estado: 4, fecha_sesion: "2026-11-18", tutoria: { id: 9, titulo: "SQL" }, horario: { hora_inicio: "07:00", hora_fin: "08:00" } },
      { id: 3, id_estado: 1, fecha_sesion: "2026-11-25", tutoria: { id: 9, titulo: "SQL" }, horario: { hora_inicio: "18:00", hora_fin: "19:00" } },
    ];
    const { dias, resumen } = armarSemana({ mias, lunes: LUNES });
    expect(dias[2].bloques).toEqual([expect.objectContaining({ tipo: "estudiante", titulo: "SQL", lugar: "Sala" })]);
    expect(resumen.comoEstudiante).toBe(1);
    expect(resumen.diasLibres).toBe(6);
  });

  test("rango: horas en punto alrededor de los bloques; 8–18 si la semana está vacía", () => {
    const tutorias = [tutoria(1, [horario(1, "Lunes", "07:30", "09:00"), horario(2, "Viernes", "16:00", "17:15")])];
    expect(armarSemana({ tutorias, lunes: LUNES }).rango).toEqual({ inicio: 7, fin: 18 });
    expect(armarSemana({ lunes: LUNES }).rango).toEqual({ inicio: 8, fin: 18 });
  });

  test("color estable por tutoría (por id) y leyenda solo con las que tienen horarios activos", () => {
    const tutorias = [
      tutoria(5, [horario(1, "Lunes", "10:00", "11:00")]),
      tutoria(3, [horario(2, "Martes", "10:00", "11:00")]),
      tutoria(4, []),
    ];
    const { dias, leyenda } = armarSemana({ tutorias, lunes: LUNES });
    expect(dias[1].bloques[0].color).toBe(1); // id 3 es la primera
    expect(dias[0].bloques[0].color).toBe(3); // id 5 es la tercera
    expect(leyenda.map((l) => l.id)).toEqual([3, 5]);
  });

  test("bloques del día ordenados por hora de inicio", () => {
    const tutorias = [tutoria(1, [horario(1, "Lunes", "15:00", "16:00"), horario(2, "Lunes", "08:00", "09:00")])];
    const { dias } = armarSemana({ tutorias, lunes: LUNES });
    expect(dias[0].bloques.map((b) => b.hora_inicio)).toEqual(["08:00", "15:00"]);
  });
});
