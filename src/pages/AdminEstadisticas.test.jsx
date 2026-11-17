// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

vi.mock("../api/estadisticas.js", () => ({ obtenerEstadisticas: vi.fn() }));
const { obtenerEstadisticas } = await import("../api/estadisticas.js");
const { default: AdminEstadisticas } = await import("./AdminEstadisticas.jsx");

const DATOS = {
  periodo: { semanas: 12, desde: "2026-08-31", hasta: "2026-11-22", hoy: "2026-11-18" },
  resumen: { tutorias_activas: 10, tutores_con_horarios: 5, horas_semanales: 36, reservas: 150, canceladas: 18, tasa_cancelacion: 0.107,
    ocupacion_promedio: 0.346, sesiones_con_reservas: 36, valoracion_promedio: 4.38, valoraciones: 65, solicitudes_abiertas: 1 },
  reservas_por_semana: [{ semana: "2026-11-09", reservas: 41, canceladas: 15 }, { semana: "2026-11-16", reservas: 53, canceladas: 3 }],
  por_materia: [
    { id: 1, nombre: "Cálculo Integral", codigo: "2555231", tutores: 1, tutorias_activas: 1, horas_semanales: 4, reservas: 18,
      ocupacion: 0.35, valoracion: 4.29, valoraciones: 7, solicitudes_abiertas: 0, solicitudes_vencidas: 0, solicitudes_periodo: 0 },
  ],
  demanda_sin_oferta: [{ id: 20, nombre: "Química General", codigo: "2530101", tutores: 0, solicitudes_abiertas: 3, solicitudes_vencidas: 2 }],
  valoraciones: [1, 2, 3, 4, 5].map((c) => ({ calificacion: c, cantidad: [0, 0, 8, 24, 33][c - 1] })),
};

afterEach(cleanup);

describe("Estadísticas", () => {
  test("muestra el resumen, la demanda sin oferta, las columnas accesibles y la tabla por materia", async () => {
    obtenerEstadisticas.mockResolvedValue(DATOS);
    render(<AdminEstadisticas />);
    expect(await screen.findByText("150")).toBeTruthy();
    expect(screen.getAllByText("35 %").length).toBeGreaterThan(0); // resumen y fila de la materia
    expect(screen.getByText("4,4 / 5")).toBeTruthy();
    expect(screen.getByText("Química General")).toBeTruthy();
    expect(screen.getByText(/ningún tutor asociado/)).toBeTruthy();
    // Cada columna tiene su texto completo para lectores de pantalla
    const grafico = screen.getByRole("list", { name: "Reservas por semana" });
    expect(within(grafico).getAllByRole("listitem").map((c) => c.getAttribute("aria-label"))).toEqual([
      "Semana del 9 nov: 41 reservas · 15 canceladas", "Semana del 16 nov: 53 reservas · 3 canceladas",
    ]);
    // Tooltip al enfocar con el teclado
    fireEvent.focus(within(grafico).getAllByRole("listitem")[0]);
    expect(screen.getByRole("tooltip").textContent).toContain("41 reservas");
    expect(screen.getByRole("rowheader", { name: /Cálculo Integral/ })).toBeTruthy();
  });

  test("cambiar el período vuelve a pedir los datos", async () => {
    obtenerEstadisticas.mockResolvedValue(DATOS);
    render(<AdminEstadisticas />);
    await screen.findByText("150");
    fireEvent.click(screen.getByRole("button", { name: "4 semanas" }));
    await waitFor(() => expect(obtenerEstadisticas).toHaveBeenLastCalledWith(4));
    expect(screen.getByRole("button", { name: "4 semanas" }).getAttribute("aria-pressed")).toBe("true");
  });
});
