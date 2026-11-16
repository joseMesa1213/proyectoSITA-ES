// @vitest-environment jsdom
import { afterEach, describe, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { useCierreExterno } from "./useCierreExterno.js";

function Panel() {
  const [abierto, setAbierto] = useState(false);
  const panel = useRef(null);
  const boton = useRef(null);
  useCierreExterno(abierto, () => setAbierto(false), [panel, boton], boton);
  return (
    <>
      <button ref={boton} type="button" onClick={() => setAbierto((a) => !a)}>Menú</button>
      {abierto && <div ref={panel}>Contenido</div>}
      <p>Afuera</p>
    </>
  );
}

afterEach(cleanup);

describe("cierre con Escape o clic afuera", () => {
  test("Escape cierra y devuelve el foco al botón", () => {
    render(<Panel />);
    fireEvent.click(screen.getByText("Menú"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Contenido")).toBeNull();
    expect(document.activeElement).toBe(screen.getByText("Menú"));
  });

  test("un clic adentro no cierra; uno afuera sí", () => {
    render(<Panel />);
    fireEvent.click(screen.getByText("Menú"));
    fireEvent.pointerDown(screen.getByText("Contenido"));
    expect(screen.getByText("Contenido")).toBeTruthy();
    fireEvent.pointerDown(screen.getByText("Afuera"));
    expect(screen.queryByText("Contenido")).toBeNull();
  });

  test("el botón que lo abre no cuenta como clic afuera", () => {
    render(<Panel />);
    fireEvent.click(screen.getByText("Menú"));
    fireEvent.pointerDown(screen.getByText("Menú"));
    fireEvent.click(screen.getByText("Menú"));
    expect(screen.queryByText("Contenido")).toBeNull();
  });
});
