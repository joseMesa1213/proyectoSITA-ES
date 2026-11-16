// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { useCambioDePantalla } from "./Layout.jsx";

// Una versión mínima del Layout: el menú y el contenido que cambia
function Marco() {
  const contenido = useRef(null);
  useCambioDePantalla(contenido);
  return (
    <>
      <nav>
        <Link to="/mis-reservas">Mi agenda</Link>
        <Link to="/tutorias?modalidad=Virtual">Solo virtuales</Link>
      </nav>
      <main ref={contenido} tabIndex={-1}>
        <Routes>
          <Route path="/tutorias" element={<p>Catálogo</p>} />
          <Route path="/mis-reservas" element={<p>Agenda</p>} />
        </Routes>
      </main>
    </>
  );
}

const montar = () => render(<MemoryRouter initialEntries={["/tutorias"]}><Marco /></MemoryRouter>);

beforeEach(() => {
  window.scrollTo = vi.fn(); // jsdom no implementa scrollTo
});
afterEach(cleanup);

describe("al cambiar de pantalla", () => {
  test("en la primera carga pone el título pero no mueve el foco ni el scroll", () => {
    montar();
    expect(document.title).toBe("Tutorías disponibles · SITA-ES");
    expect(document.activeElement).toBe(document.body);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  test("al navegar cambia el título, sube al inicio y el foco pasa al contenido", () => {
    montar();
    fireEvent.click(screen.getByText("Mi agenda"));
    expect(document.title).toBe("Mi agenda · SITA-ES");
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(document.activeElement).toBe(screen.getByRole("main"));
  });

  test("cambiar solo los filtros (la búsqueda de la URL) no mueve el foco", () => {
    montar();
    const enlace = screen.getByText("Solo virtuales");
    enlace.focus();
    fireEvent.click(enlace);
    expect(document.activeElement).toBe(enlace);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
