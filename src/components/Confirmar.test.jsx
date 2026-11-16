// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ConfirmarProvider, useConfirmar } from "./Confirmar.jsx";

// jsdom no implementa showModal()/close(): se simulan con el atributo "open" (en el navegador son nativos)
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(cleanup);

// Botón de prueba que pide confirmación y guarda la respuesta
function Prueba({ alResponder }) {
  const confirmar = useConfirmar();
  return (
    <button type="button" onClick={async () => alResponder(await confirmar({
      titulo: "Cancelar reserva", mensaje: "¿Seguro?", textoConfirmar: "Sí, cancelar", peligro: true,
    }))}>
      Abrir
    </button>
  );
}

const abrir = () => {
  const alResponder = vi.fn();
  render(<ConfirmarProvider><Prueba alResponder={alResponder} /></ConfirmarProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
  return { alResponder, dialogo: document.querySelector("dialog") };
};

describe("diálogo de confirmación", () => {
  test("se abre con el título, el mensaje y el texto del botón", () => {
    const { dialogo } = abrir();
    expect(dialogo.hasAttribute("open")).toBe(true);
    expect(screen.getByText("Cancelar reserva")).toBeTruthy();
    expect(screen.getByText("¿Seguro?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sí, cancelar", hidden: true })).toBeTruthy();
  });

  test("confirmar → responde true y se cierra", async () => {
    const { alResponder, dialogo } = abrir();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Sí, cancelar", hidden: true })));
    expect(alResponder).toHaveBeenCalledWith(true);
    expect(dialogo.hasAttribute("open")).toBe(false);
  });

  test("botón Cancelar → responde false", async () => {
    const { alResponder } = abrir();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Cancelar", hidden: true })));
    expect(alResponder).toHaveBeenCalledWith(false);
  });

  test("Escape (evento cancel del <dialog>) → responde false y se cierra", async () => {
    const { alResponder, dialogo } = abrir();
    await act(async () => fireEvent(dialogo, new Event("cancel", { cancelable: true })));
    expect(alResponder).toHaveBeenCalledWith(false);
    expect(dialogo.hasAttribute("open")).toBe(false);
  });

  test("clic afuera (en el fondo, es decir, en el propio <dialog>) → responde false", async () => {
    const { alResponder } = abrir();
    await act(async () => fireEvent.click(document.querySelector("dialog")));
    expect(alResponder).toHaveBeenCalledWith(false);
  });

  test("clic dentro del contenido no lo cierra", async () => {
    const { alResponder, dialogo } = abrir();
    await act(async () => fireEvent.click(screen.getByText("¿Seguro?")));
    expect(alResponder).not.toHaveBeenCalled();
    expect(dialogo.hasAttribute("open")).toBe(true);
  });
});
