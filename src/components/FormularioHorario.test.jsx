// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AvisosProvider } from "./Avisos.jsx";

vi.mock("../api/tutorias.js", () => ({ agregarHorario: vi.fn() }));
vi.mock("../api/catalogos.js", () => ({
  obtenerOpciones: vi.fn().mockResolvedValue({
    dias: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  }),
}));
vi.mock("../api/recursos.js", () => ({
  listarRecursos: vi.fn().mockResolvedValue([
    { id: 2, nombre: "Aula 19-101", capacidad: 30 },
    { id: 3, nombre: "Aula pequeña", capacidad: 2 },
  ]),
}));

const { agregarHorario } = await import("../api/tutorias.js");
const { listarRecursos } = await import("../api/recursos.js");
const { default: FormularioHorario } = await import("./FormularioHorario.jsx");

const HUECO = { dia: "Martes", hora_inicio: "10:00", hora_fin: "11:00" };
const montar = (tutoria, onAgregado = vi.fn()) =>
  render(
    <MemoryRouter>
      <AvisosProvider>
        <FormularioHorario tutoria={tutoria} inicial={HUECO} onAgregado={onAgregado} apilado />
      </AvisosProvider>
    </MemoryRouter>
  );

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("FormularioHorario", () => {
  test("llega con el hueco elegido en la grilla", async () => {
    montar({ id: 1, modalidad: "Presencial", cupo: 5 });
    await screen.findByRole("option", { name: "Martes" });
    expect(screen.getByLabelText("Día").value).toBe("Martes");
    expect(screen.getByLabelText("Desde").value).toBe("10:00");
    expect(screen.getByLabelText("Hasta").value).toBe("11:00");
  });

  test("Presencial: solo salones con capacidad para el cupo, y envía id_recurso", async () => {
    agregarHorario.mockResolvedValue({ id: 9, dia: "Martes", hora_inicio: "10:00", hora_fin: "11:00", recurso: { nombre: "Aula 19-101" } });
    const onAgregado = vi.fn();
    montar({ id: 1, modalidad: "Presencial", cupo: 5 }, onAgregado);

    await screen.findByRole("option", { name: "Aula 19-101 (cap. 30)" });
    expect(screen.queryByRole("option", { name: /Aula pequeña/ })).toBeNull();
    expect(listarRecursos).toHaveBeenCalledWith("Físico");

    fireEvent.change(screen.getByLabelText("Salón o enlace"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar horario" }));

    await waitFor(() => expect(onAgregado).toHaveBeenCalled());
    expect(agregarHorario).toHaveBeenCalledWith(1, { ...HUECO, id_recurso: 2 });
  });

  test("Virtual: sin selector ni id_recurso (usa su sala de Jitsi)", async () => {
    agregarHorario.mockResolvedValue({ id: 9, dia: "Martes", hora_inicio: "10:00", hora_fin: "11:00", recurso: { nombre: "Sala Jitsi" } });
    montar({ id: 4, modalidad: "Virtual", cupo: 10 });

    await screen.findByRole("option", { name: "Martes" });
    expect(screen.queryByLabelText("Salón o enlace")).toBeNull();
    expect(listarRecursos).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Agregar horario" }));
    await waitFor(() => expect(agregarHorario).toHaveBeenCalledWith(4, HUECO));
  });

  test("hora de fin no posterior → error sin llamar al backend", async () => {
    render(
      <MemoryRouter><AvisosProvider>
        <FormularioHorario tutoria={{ id: 4, modalidad: "Virtual", cupo: 1 }}
          inicial={{ dia: "Martes", hora_inicio: "11:00", hora_fin: "10:00" }} onAgregado={vi.fn()} />
      </AvisosProvider></MemoryRouter>
    );
    await screen.findByRole("option", { name: "Martes" });
    fireEvent.click(screen.getByRole("button", { name: "Agregar horario" }));
    expect((await screen.findByRole("alert")).textContent).toContain("posterior");
    expect(agregarHorario).not.toHaveBeenCalled();
  });
});
