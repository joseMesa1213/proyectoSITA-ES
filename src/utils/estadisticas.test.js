import { describe, expect, test } from "vitest";
import { columnasConEtiqueta, decimal, etiquetaSemana, marcas, porcentaje, techo } from "./estadisticas.js";

describe("estadísticas (front)", () => {
  test("porcentaje y decimal, con guion si no hay dato", () => {
    expect(porcentaje(0.4166)).toBe("42 %");
    expect(porcentaje(null)).toBe("—");
    expect(decimal(4.38)).toBe("4,4");
    expect(decimal(null)).toBe("—");
  });

  test("techo redondo del eje y sus marcas", () => {
    expect(techo(56)).toBe(60);
    expect(techo(7)).toBe(8);
    expect(techo(0)).toBe(4);
    expect(techo(100)).toBe(100);
    expect(marcas(60)).toEqual([0, 15, 30, 45, 60]);
  });

  test("etiqueta corta de la semana", () => {
    expect(etiquetaSemana("2026-11-16")).toBe("16 nov");
  });

  test("solo la columna más alta y la última llevan número", () => {
    expect([...columnasConEtiqueta([0, 56, 41, 53])].sort()).toEqual([1, 3]);
    expect([...columnasConEtiqueta([0, 0, 0])]).toEqual([2]);
    expect([...columnasConEtiqueta([])]).toEqual([]);
  });
});
