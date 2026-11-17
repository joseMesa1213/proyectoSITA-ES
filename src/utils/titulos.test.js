import { describe, expect, test } from "vitest";
import { tituloCompleto, tituloDeRuta } from "./titulos.js";

describe("título de la pestaña según la ruta", () => {
  test.each([
    ["/tutorias", "Tutorías disponibles"],
    ["/tutorias/7", "Detalle de la tutoría"],
    ["/tutorias/7/reservar", "Reservar"],
    ["/registro/google", "Completa tu registro"],
    ["/mis-reservas", "Mi agenda"],
    ["/tutor/tutorias", "Mis tutorías"],
    ["/tutor/tutorias/nueva", "Nueva tutoría"],
    ["/tutor/tutorias/3", "Gestionar tutoría"],
    ["/tutor/reservas", "Agenda de tutorías"],
    ["/tutor/horario", "Mi horario"],
    ["/admin/solicitudes", "Solicitudes de tutor"],
    ["/no-existe", "Página no encontrada"],
  ])("%s → %s", (ruta, titulo) => {
    expect(tituloDeRuta(ruta)).toBe(titulo);
  });

  test("agrega el nombre de la aplicación", () => {
    expect(tituloCompleto("Mi agenda")).toBe("Mi agenda · SITA-ES");
    expect(tituloCompleto()).toBe("SITA-ES");
  });
});
