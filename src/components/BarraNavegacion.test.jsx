// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ROL } from "../utils/constantes.js";

let usuario = null;
vi.mock("../context/AuthContext.jsx", () => ({ useAuth: () => ({ usuario, verificando: false, logout: vi.fn() }) }));
vi.mock("./Campanita.jsx", () => ({ default: () => null }));
vi.mock("./BotonTema.jsx", () => ({ default: () => null }));

const { default: BarraNavegacion } = await import("./BarraNavegacion.jsx");
const { default: RutaProtegida } = await import("./RutaProtegida.jsx");

afterEach(cleanup);

const montarBarra = (ruta = "/tutorias") =>
  render(<MemoryRouter initialEntries={[ruta]}><BarraNavegacion /></MemoryRouter>);

describe("menú del administrador (superusuario)", () => {
  test("agrupa el panel del tutor y la administración en desplegables", () => {
    usuario = { id: 1, nombre: "Ana", id_rol: ROL.ADMINISTRADOR };
    montarBarra();
    const escritorio = screen.getAllByRole("navigation")[0];
    expect(within(escritorio).getByRole("link", { name: "Mi agenda" })).toBeTruthy();
    expect(within(escritorio).queryByRole("link", { name: "Mis tutorías" })).toBeNull();

    const tutor = within(escritorio).getByRole("button", { name: "Tutor" });
    expect(tutor.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(tutor);
    expect(tutor.getAttribute("aria-expanded")).toBe("true");
    expect(within(escritorio).getByRole("link", { name: "Mis tutorías" })).toBeTruthy();

    // Abrir el otro cierra el primero (clic afuera)
    const admin = within(escritorio).getByRole("button", { name: "Administración" });
    fireEvent.pointerDown(admin);
    fireEvent.click(admin);
    expect(tutor.getAttribute("aria-expanded")).toBe("false");
    expect(within(escritorio).getByRole("link", { name: "Estadísticas" })).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(admin.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(admin);
  });

  test("en el celular los grupos son secciones con título", () => {
    usuario = { id: 1, nombre: "Ana", id_rol: ROL.ADMINISTRADOR };
    montarBarra();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    const grupo = screen.getByRole("group", { name: "Tutor" });
    expect(within(grupo).getByRole("link", { name: "Mi horario" })).toBeTruthy();
    expect(within(screen.getByRole("group", { name: "Administración" })).getByRole("link", { name: "Recursos" })).toBeTruthy();
  });

  test("el desplegable se marca activo dentro de su sección", () => {
    usuario = { id: 1, nombre: "Ana", id_rol: ROL.ADMINISTRADOR };
    montarBarra("/admin/recursos");
    expect(screen.getByRole("button", { name: "Administración" }).className).toContain("bg-barra-texto/10");
    expect(screen.getByRole("button", { name: "Tutor" }).className).not.toContain("bg-barra-texto/10");
  });

  test("el tutor sigue con sus enlaces sueltos, sin desplegables", () => {
    usuario = { id: 2, nombre: "Luis", id_rol: ROL.TUTOR };
    montarBarra();
    const escritorio = screen.getAllByRole("navigation")[0];
    expect(within(escritorio).getByRole("link", { name: "Mis tutorías" })).toBeTruthy();
    expect(within(escritorio).queryByRole("button")).toBeNull();
  });
});

describe("RutaProtegida", () => {
  const montarRuta = (roles) =>
    render(
      <MemoryRouter initialEntries={["/privada"]}>
        <Routes>
          <Route path="/" element={<p>Inicio</p>} />
          <Route element={<RutaProtegida roles={roles} />}>
            <Route path="/privada" element={<p>Contenido</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

  test("el administrador entra también a las rutas de tutor y de quien reserva", () => {
    usuario = { id: 1, id_rol: ROL.ADMINISTRADOR };
    montarRuta([ROL.TUTOR]);
    expect(screen.getByText("Contenido")).toBeTruthy();
  });

  test("un estudiante no entra al panel del tutor ni del administrador", () => {
    usuario = { id: 3, id_rol: ROL.ESTUDIANTE };
    montarRuta([ROL.TUTOR]);
    expect(screen.getByText("Inicio")).toBeTruthy();
    cleanup();
    montarRuta([ROL.ADMINISTRADOR]);
    expect(screen.getByText("Inicio")).toBeTruthy();
  });
});
