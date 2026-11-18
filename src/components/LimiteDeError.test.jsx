// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router";
import LimiteDeError from "./LimiteDeError.jsx";

// Una página con un error como el de "Mi agenda": un componente usado sin importar
function PaginaRota() {
  // eslint-disable-next-line no-undef -- a propósito: así falló en producción
  return <ComponenteSinImportar />;
}

// Igual que el Layout: barra fija y el límite alrededor de la página, con key = ruta
function Marco() {
  const { pathname } = useLocation();
  return (
    <>
      <nav>
        <Link to="/tutorias">Catálogo</Link>
      </nav>
      <LimiteDeError key={pathname}>
        <Outlet />
      </LimiteDeError>
    </>
  );
}

const montar = (ruta) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route element={<Marco />}>
          <Route path="/tutorias" element={<p>Lista de tutorías</p>} />
          <Route path="/mis-reservas" element={<PaginaRota />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {}); // React y el límite registran el error
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("límite de error", () => {
  test("si la página falla, muestra el aviso y la barra sigue ahí", () => {
    montar("/mis-reservas");
    expect(screen.getByRole("alert").textContent).toContain("Algo salió mal");
    expect(screen.getByRole("button", { name: "Recargar" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ir al catálogo" }).getAttribute("href")).toBe("/tutorias");
    expect(screen.getByRole("link", { name: "Catálogo" })).toBeTruthy();
  });

  test("al ir a otra pantalla desde la barra, se recupera", () => {
    montar("/mis-reservas");
    fireEvent.click(screen.getByRole("link", { name: "Catálogo" }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Lista de tutorías")).toBeTruthy();
  });

  test("sin errores, muestra la página normal", () => {
    montar("/tutorias");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Lista de tutorías")).toBeTruthy();
  });

  test("completo: ocupa toda la pantalla (cuando falla algo fuera de las páginas)", () => {
    render(<LimiteDeError completo><PaginaRota /></LimiteDeError>);
    expect(screen.getByRole("alert").parentElement.className).toContain("min-h-screen");
  });
});
