import { describe, expect, test } from "vitest";
import intenciones from "./intenciones.js?raw";
import motor from "./motor.js?raw";
import { tituloDeRuta } from "../utils/titulos.js";

// Cada enlace del asistente debe llevar a una pantalla que existe. Si se renombra o se quita una ruta
// (App.jsx + titulos.js), esta prueba avisa antes de que el asistente quede con enlaces rotos.
// Se leen los archivos fuente: así se revisan también los enlaces que arman las respuestas dinámicas.

// a: "/ruta"  ·  a: `/ruta/${id}?x=${y}`  → "/ruta", "/ruta/1"
function enlacesDe(fuente) {
  const rutas = [...fuente.matchAll(/\ba:\s*(["`])(\/[^"`]*)\1/g)].map(([, , ruta]) => ruta);
  return rutas.map((ruta) => ruta.replace(/\$\{[^}]*\}/g, "1").split("?")[0]);
}

const RUTAS = [...new Set([...enlacesDe(intenciones), ...enlacesDe(motor)])].sort();

describe("enlaces del asistente", () => {
  test("encuentra los enlaces en el código (la prueba no está vacía)", () => {
    expect(RUTAS.length).toBeGreaterThan(10);
    expect(RUTAS).toEqual(expect.arrayContaining(["/solicitudes", "/tutor/solicitudes", "/admin/estadisticas", "/tutor/horario"]));
  });

  test.each(RUTAS)("%s existe", (ruta) => {
    expect(tituloDeRuta(ruta)).not.toBe("Página no encontrada");
  });
});
