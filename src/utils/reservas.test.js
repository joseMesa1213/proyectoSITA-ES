import { describe, expect, test } from "vitest";
import { ESTADO } from "./constantes.js";
import { nombreEstadoReserva, resumenSesion } from "./reservas.js";

const completada = (calificacion) => ({
  id_estado: ESTADO.COMPLETADO, estado: "Completado", no_asistio: false,
  valoracion: calificacion ? { id: calificacion, calificacion, comentario: null } : null,
});
const inasistencia = { id_estado: ESTADO.CANCELADO, estado: "Cancelado", no_asistio: true, valoracion: null };
const canceladaAntes = { id_estado: ESTADO.CANCELADO, estado: "Cancelado", no_asistio: false, valoracion: null };

describe("nombreEstadoReserva", () => {
  test("una inasistencia se muestra como «No asistió»", () => {
    expect(nombreEstadoReserva(inasistencia)).toBe("No asistió");
  });
  test("las demás muestran su estado", () => {
    expect(nombreEstadoReserva(canceladaAntes)).toBe("Cancelado");
    expect(nombreEstadoReserva(completada(5))).toBe("Completado");
  });
});

describe("resumenSesion", () => {
  test("asistentes, valoraciones y promedio con un decimal; las canceladas antes no cuentan", () => {
    expect(resumenSesion([completada(5), completada(4), completada(4), completada(null), inasistencia, canceladaAntes]))
      .toEqual({ esperados: 5, asistieron: 4, valoraron: 3, promedio: 4.3 });
  });
  test("sin valoraciones → promedio null", () => {
    expect(resumenSesion([completada(null), inasistencia])).toEqual({ esperados: 2, asistieron: 1, valoraron: 0, promedio: null });
  });
  test("nadie marcado todavía (solo activas o canceladas antes) → esperados 0", () => {
    expect(resumenSesion([{ id_estado: ESTADO.ACTIVO, no_asistio: false }, canceladaAntes]).esperados).toBe(0);
  });
});
