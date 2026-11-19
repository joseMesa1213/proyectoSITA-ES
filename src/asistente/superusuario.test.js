import { describe, expect, test } from "vitest";
import { intencionesDe } from "./intenciones.js";
import { ROL } from "../utils/constantes.js";

const ids = (usuario) => intencionesDe(usuario).map((i) => i.id);
const ADMIN = { id: 1, id_rol: ROL.ADMINISTRADOR };
const TUTOR = { id: 2, id_rol: ROL.TUTOR };

describe("el administrador es superusuario en el asistente", () => {
  test("tiene todas las intenciones del tutor (que ya incluyen las de quien reserva)", () => {
    const delAdmin = ids(ADMIN);
    for (const id of ids(TUTOR).filter((id) => id !== "estado-solicitud")) expect(delAdmin).toContain(id);
  });

  test("conserva las suyas y no recibe las de quien todavía no es tutor", () => {
    const delAdmin = ids(ADMIN);
    expect(delAdmin).toEqual(expect.arrayContaining(["admin-materias", "admin-rol", "estadisticas", "publicar-tutoria", "mis-reservas"]));
    expect(delAdmin).not.toContain("ser-tutor");
    expect(delAdmin).not.toContain("estado-solicitud");
    expect(delAdmin).not.toContain("registro");
  });

  test("el tutor sigue sin las del administrador", () => {
    expect(ids(TUTOR)).not.toContain("admin-materias");
  });
});
