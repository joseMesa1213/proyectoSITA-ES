// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

vi.mock("../api/notificaciones.js", () => ({
  listarNotificaciones: vi.fn(),
  marcarNotificacionLeida: vi.fn().mockResolvedValue({}),
  marcarTodasLeidas: vi.fn().mockResolvedValue({}),
}));
const api = await import("../api/notificaciones.js");
const { default: Campanita } = await import("./Campanita.jsx");

const AVISOS = {
  no_leidas: 2,
  notificaciones: [
    { id: 1, titulo: "Nueva reserva en «SQL»", mensaje: "Ana reservó", enlace: "/tutor/reservas", leida: false, fecha: new Date().toISOString() },
    { id: 2, titulo: "Valore su sesión", mensaje: null, enlace: "/mis-reservas", leida: false, fecha: new Date().toISOString() },
    { id: 3, titulo: "Aviso viejo", mensaje: null, enlace: null, leida: true, fecha: "2026-11-01T12:00:00Z" },
  ],
};

const montar = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Campanita />
      <Routes>
        <Route path="/" element={<p>Inicio</p>} />
        <Route path="/tutor/reservas" element={<p>Pantalla de reservas</p>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  api.listarNotificaciones.mockResolvedValue(structuredClone(AVISOS));
});
afterEach(cleanup);

describe("Campanita", () => {
  test("muestra cuántas hay sin leer en la etiqueta y la insignia", async () => {
    montar();
    const boton = await screen.findByRole("button", { name: "Notificaciones: 2 sin leer" });
    expect(boton.textContent).toContain("2");
  });

  test("al pulsar un aviso lo marca como leído y lleva a su pantalla", async () => {
    // Al cambiar de pantalla la campanita vuelve a consultar: el servidor ya lo tiene como leído
    const leido = structuredClone(AVISOS);
    leido.no_leidas = 1;
    leido.notificaciones[0].leida = true;
    // (dos consultas antes del clic: al montar y al abrir el panel)
    api.listarNotificaciones.mockResolvedValueOnce(structuredClone(AVISOS)).mockResolvedValueOnce(structuredClone(AVISOS)).mockResolvedValue(leido);
    montar();
    fireEvent.click(await screen.findByRole("button", { name: "Notificaciones: 2 sin leer" }));
    fireEvent.click(await screen.findByRole("button", { name: /Nueva reserva en «SQL»/ }));
    expect(api.marcarNotificacionLeida).toHaveBeenCalledWith(1);
    expect(await screen.findByText("Pantalla de reservas")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Notificaciones: 1 sin leer" })).toBeTruthy();
  });

  test("marcar todas deja el contador en cero", async () => {
    montar();
    fireEvent.click(await screen.findByRole("button", { name: "Notificaciones: 2 sin leer" }));
    fireEvent.click(await screen.findByRole("button", { name: "Marcar todas como leídas" }));
    expect(api.marcarTodasLeidas).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Notificaciones" })).toBeTruthy());
  });

  test("si la consulta falla no muestra errores y sigue funcionando", async () => {
    api.listarNotificaciones.mockRejectedValue(new Error("sin conexión"));
    montar();
    await waitFor(() => expect(api.listarNotificaciones).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Notificaciones" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("sin avisos: mensaje vacío", async () => {
    api.listarNotificaciones.mockResolvedValue({ no_leidas: 0, notificaciones: [] });
    montar();
    fireEvent.click(await screen.findByRole("button", { name: "Notificaciones" }));
    expect(await screen.findByText("No tiene notificaciones.")).toBeTruthy();
  });
});
