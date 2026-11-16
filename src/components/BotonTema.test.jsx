// @vitest-environment jsdom
// (Solo este archivo usa un navegador simulado: las demás pruebas siguen corriendo en Node)
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import BotonTema from "./BotonTema.jsx";
import { CLAVE_TEMA, temaInicial } from "../utils/tema.js";

// jsdom no trae matchMedia: se simula la preferencia del sistema
const simularSistema = (prefiereOscuro) => {
  window.matchMedia = vi.fn().mockImplementation((consulta) => ({
    matches: prefiereOscuro && consulta.includes("dark"),
    media: consulta,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

const html = () => document.documentElement;

beforeEach(() => {
  localStorage.clear();
  html().classList.remove("dark");
  simularSistema(false);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("botón de modo oscuro", () => {
  test("en modo claro muestra «Activar modo oscuro»; al presionarlo activa el modo oscuro y lo guarda", () => {
    render(<BotonTema />);
    const boton = screen.getByRole("button", { name: "Activar modo oscuro" });

    fireEvent.click(boton);

    expect(html().classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(CLAVE_TEMA)).toBe("oscuro");
    expect(screen.getByRole("button", { name: "Activar modo claro" })).toBe(boton);
  });

  test("al presionarlo otra vez vuelve al modo claro y guarda esa preferencia", () => {
    render(<BotonTema />);
    fireEvent.click(screen.getByRole("button", { name: "Activar modo oscuro" }));
    fireEvent.click(screen.getByRole("button", { name: "Activar modo claro" }));

    expect(html().classList.contains("dark")).toBe(false);
    expect(localStorage.getItem(CLAVE_TEMA)).toBe("claro");
    expect(screen.getByRole("button", { name: "Activar modo oscuro" })).toBeTruthy();
  });

  test("si la página ya cargó en modo oscuro, el botón ofrece volver al claro", () => {
    html().classList.add("dark");
    render(<BotonTema />);
    expect(screen.getByRole("button", { name: "Activar modo claro" })).toBeTruthy();
  });

  test("es un botón nativo: funciona con el teclado (Enter y Espacio lo activan)", () => {
    render(<BotonTema />);
    const boton = screen.getByRole("button", { name: "Activar modo oscuro" });
    expect(boton.tagName).toBe("BUTTON");
    expect(boton.getAttribute("type")).toBe("button");
  });

  test("si localStorage falla (navegación privada), el modo cambia igual y no se rompe", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("almacenamiento bloqueado");
    });
    render(<BotonTema />);
    fireEvent.click(screen.getByRole("button", { name: "Activar modo oscuro" }));
    expect(html().classList.contains("dark")).toBe(true);
  });
});

describe("modo inicial", () => {
  test("sin preferencia guardada usa la del sistema", () => {
    simularSistema(true);
    expect(temaInicial()).toBe("oscuro");
    simularSistema(false);
    expect(temaInicial()).toBe("claro");
  });

  test("la preferencia guardada manda sobre la del sistema", () => {
    simularSistema(true);
    localStorage.setItem(CLAVE_TEMA, "claro");
    expect(temaInicial()).toBe("claro");
  });

  test("un valor guardado inválido se ignora", () => {
    localStorage.setItem(CLAVE_TEMA, "morado");
    expect(temaInicial()).toBe("claro");
  });
});
