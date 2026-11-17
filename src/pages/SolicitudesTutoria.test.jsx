// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AvisosProvider } from "../components/Avisos.jsx";
import { ConfirmarProvider } from "../components/Confirmar.jsx";

vi.mock("../api/solicitudesTutoria.js", () => ({
  crearSolicitudTutoria: vi.fn(),
  listarMisSolicitudesTutoria: vi.fn(),
  retirarSolicitudTutoria: vi.fn(),
  listarSolicitudesParaMi: vi.fn(),
  atenderSolicitudTutoria: vi.fn(),
}));
vi.mock("../api/materias.js", () => ({
  listarMaterias: vi.fn().mockResolvedValue([{ id: 3, nombre: "Cálculo Integral", codigo: "2555211" }]),
}));
vi.mock("../api/tutorias.js", () => ({ listarMisTutorias: vi.fn() }));

const api = await import("../api/solicitudesTutoria.js");
const { listarMisTutorias } = await import("../api/tutorias.js");
const { default: PedirTutoria } = await import("./PedirTutoria.jsx");
const { default: SolicitudesEstudiantes } = await import("./tutor/SolicitudesEstudiantes.jsx");

const MATERIA = { id: 3, nombre: "Cálculo Integral", codigo: "2555211" };
const solicitud = (cambios = {}) => ({
  id: 40, id_estado: 3, estado: "Pendiente", tema: "Integrales por partes", materia: MATERIA, descripcion: null,
  disponibilidad: "martes en la tarde", fecha: new Date().toISOString(), estudiante: { id: 7, nombre: "Camila", apellido: "Gómez" },
  tutor: null, tutoria: null, ...cambios,
});

const montar = (pantalla, ruta = "/") =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <AvisosProvider><ConfirmarProvider>{pantalla}</ConfirmarProvider></AvisosProvider>
    </MemoryRouter>
  );

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("Pedir una tutoría", () => {
  test("publica la solicitud con la materia del enlace del catálogo y la agrega a la lista", async () => {
    api.listarMisSolicitudesTutoria.mockResolvedValue([]);
    api.crearSolicitudTutoria.mockResolvedValue(solicitud());
    montar(<PedirTutoria />, "/solicitudes?id_materia=3");

    await screen.findByRole("option", { name: "Cálculo Integral (2555211)" });
    expect(screen.getByLabelText("Materia").value).toBe("3");
    fireEvent.change(screen.getByLabelText("Tema"), { target: { value: " Integrales por partes " } });
    fireEvent.change(screen.getByLabelText("Disponibilidad (opcional)"), { target: { value: "martes en la tarde" } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar solicitud" }));

    await waitFor(() => expect(api.crearSolicitudTutoria).toHaveBeenCalledWith({
      id_materia: 3, tema: "Integrales por partes", descripcion: null, disponibilidad: "martes en la tarde",
    }));
    expect(await screen.findByText("Abierta")).toBeTruthy();
  });

  test("con 3 abiertas no muestra el formulario; una atendida enlaza a la tutoría", async () => {
    api.listarMisSolicitudesTutoria.mockResolvedValue([
      solicitud({ id: 1 }), solicitud({ id: 2 }), solicitud({ id: 3 }),
      solicitud({ id: 4, id_estado: 5, tutor: { nombre: "Ana", apellido: "Ruiz" }, tutoria: { id: 12, titulo: "Integrales sin miedo" } }),
    ]);
    montar(<PedirTutoria />, "/solicitudes");
    expect(await screen.findByText(/Ya tiene 3 solicitudes abiertas/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Publicar solicitud" })).toBeNull();
    expect(screen.getByRole("link", { name: "«Integrales sin miedo»" }).getAttribute("href")).toBe("/tutorias/12");
  });
});

describe("Solicitudes de estudiantes (tutor)", () => {
  test("ofrece una tutoría propia de esa materia y la quita de la lista", async () => {
    api.listarSolicitudesParaMi.mockResolvedValue([solicitud()]);
    listarMisTutorias.mockResolvedValue([
      { id: 12, titulo: "Integrales sin miedo", id_estado: 1, materia: MATERIA },
      { id: 13, titulo: "De otra materia", id_estado: 1, materia: { id: 9 } },
      { id: 14, titulo: "Inactiva", id_estado: 2, materia: MATERIA },
    ]);
    api.atenderSolicitudTutoria.mockResolvedValue({});
    montar(<SolicitudesEstudiantes />);

    expect(await screen.findByText("Integrales por partes")).toBeTruthy();
    // Solo la activa de la misma materia; al ser una sola, queda elegida
    const selector = screen.getByLabelText("O ofrezca una de sus tutorías");
    expect([...selector.options].map((o) => o.textContent)).toEqual(["Seleccione...", "Integrales sin miedo"]);
    expect(screen.getByRole("link", { name: "Publicar una tutoría nueva" }).getAttribute("href")).toBe("/tutor/tutorias/nueva?solicitud=40");

    fireEvent.click(screen.getByRole("button", { name: "Ofrecer" }));
    await waitFor(() => expect(api.atenderSolicitudTutoria).toHaveBeenCalledWith(40, 12));
    expect(await screen.findByText("No hay solicitudes abiertas en sus materias")).toBeTruthy();
  });
});
