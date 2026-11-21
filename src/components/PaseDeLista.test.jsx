// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PaseDeLista from "./PaseDeLista.jsx";

// jsdom no implementa showModal()/close(): se simulan con el atributo "open"
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(cleanup);

const ESTUDIANTES = [{ id: 1, nombre: "Ana Pérez" }, { id: 2, nombre: "Luis Gómez" }, { id: 3, nombre: "Sara Ríos" }];

const abrir = () => {
  const onConfirmar = vi.fn();
  const onCerrar = vi.fn();
  render(<PaseDeLista titulo="Derivadas" subtitulo="Jue, 19 de nov · 14:00 – 16:00" estudiantes={ESTUDIANTES}
    onConfirmar={onConfirmar} onCerrar={onCerrar} />);
  return { onConfirmar, onCerrar, dialogo: document.querySelector("dialog") };
};
const casilla = (nombre) => screen.getByRole("checkbox", { name: new RegExp(nombre), hidden: true });
const boton = (nombre) => screen.getByRole("button", { name: nombre, hidden: true });

describe("pase de lista", () => {
  test("se abre con todos marcados: un clic completa a todos", () => {
    const { onConfirmar, dialogo } = abrir();
    expect(dialogo.hasAttribute("open")).toBe(true);
    ESTUDIANTES.forEach((e) => expect(casilla(e.nombre).checked).toBe(true));
    fireEvent.click(boton("Completar 3"));
    expect(onConfirmar).toHaveBeenCalledWith({ asistieron: [1, 2, 3], faltaron: [] });
  });

  test("al desmarcar a alguien, va a «faltaron» y el botón lo dice", () => {
    const { onConfirmar } = abrir();
    fireEvent.click(casilla("Sara Ríos"));
    expect(screen.getByText("No asistió")).toBeTruthy();
    fireEvent.click(boton("Completar 2 · Marcar 1 como no asistió"));
    expect(onConfirmar).toHaveBeenCalledWith({ asistieron: [1, 2], faltaron: [3] });
  });

  test("Cancelar cierra sin confirmar", () => {
    const { onConfirmar, onCerrar, dialogo } = abrir();
    fireEvent.click(boton("Cancelar"));
    expect(onCerrar).toHaveBeenCalled();
    expect(onConfirmar).not.toHaveBeenCalled();
    expect(dialogo.hasAttribute("open")).toBe(false);
  });
});
