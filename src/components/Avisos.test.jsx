// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AvisosProvider, useAvisos } from "./Avisos.jsx";

function Botones() {
  const avisos = useAvisos();
  return (
    <>
      <button type="button" onClick={() => avisos.exito("Reserva cancelada.")}>Éxito</button>
      <button type="button" onClick={() => avisos.error(new Error("No quedan cupos"))}>Error</button>
    </>
  );
}

const montar = () =>
  render(<MemoryRouter><AvisosProvider><Botones /></AvisosProvider></MemoryRouter>);

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("avisos tipo toast", () => {
  test("el de éxito se anuncia como status y desaparece solo", () => {
    montar();
    fireEvent.click(screen.getByText("Éxito"));
    expect(screen.getByRole("status").textContent).toContain("Reserva cancelada.");
    act(() => vi.advanceTimersByTime(4100));
    expect(screen.queryByRole("status")).toBeNull();
  });

  test("el de error usa el mensaje del Error y se anuncia como alert", () => {
    montar();
    fireEvent.click(screen.getByText("Error"));
    expect(screen.getByRole("alert").textContent).toContain("No quedan cupos");
  });

  test("se cierra con la X", () => {
    montar();
    fireEvent.click(screen.getByText("Éxito"));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  test("Escape los cierra todos", () => {
    montar();
    fireEvent.click(screen.getByText("Éxito"));
    fireEvent.click(screen.getByText("Error"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("un clic afuera los cierra; un clic sobre el aviso no", () => {
    montar();
    fireEvent.click(screen.getByText("Éxito"));
    fireEvent.pointerDown(screen.getByRole("status"));
    expect(screen.getByRole("status")).toBeTruthy();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("status")).toBeNull();
  });

  test("con el ratón encima no desaparece", () => {
    montar();
    fireEvent.click(screen.getByText("Éxito"));
    fireEvent.mouseEnter(screen.getByRole("status"));
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.getByRole("status")).toBeTruthy();
  });
});
