// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AvisosProvider } from "./Avisos.jsx";
import BotonCompartir, { datosParaCompartir } from "./BotonCompartir.jsx";

const TUTORIA = { id: 17, titulo: "Modelo relacional y SQL", materia: { nombre: "Bases de Datos" } };

const montar = () =>
  render(<MemoryRouter><AvisosProvider><BotonCompartir tutoria={TUTORIA} /></AvisosProvider></MemoryRouter>);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete navigator.share;
});

describe("datosParaCompartir", () => {
  test("enlace al detalle público y mensaje de WhatsApp codificado", () => {
    const datos = datosParaCompartir(TUTORIA, "https://sita.test");
    expect(datos.url).toBe("https://sita.test/tutorias/17");
    expect(datos.texto).toBe("Tutoría de Bases de Datos: «Modelo relacional y SQL» en SITA-ES");
    expect(datos.whatsapp).toBe(`https://wa.me/?text=${encodeURIComponent(`${datos.texto} ${datos.url}`)}`);
  });
});

describe("BotonCompartir", () => {
  test("el menú abre con Copiar enlace y WhatsApp; sin share nativo no ofrece 'Compartir…'", () => {
    montar();
    fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
    expect(screen.getByRole("menuitem", { name: "Copiar enlace" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "WhatsApp" }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(screen.queryByRole("menuitem", { name: "Compartir…" })).toBeNull();
  });

  test("Copiar enlace lo pone en el portapapeles y avisa", async () => {
    const writeText = vi.fn().mockResolvedValue();
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    montar();
    fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Copiar enlace" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Enlace copiado"));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/tutorias/17`);
  });

  test("con share nativo lo usa, y cancelarlo no muestra error", async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error("cancelado"), { name: "AbortError" }));
    navigator.share = share;
    montar();
    fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Compartir…" }));
    await waitFor(() => expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: `${window.location.origin}/tutorias/17` })));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
