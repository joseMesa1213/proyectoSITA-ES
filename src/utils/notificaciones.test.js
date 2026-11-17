import { describe, expect, test } from "vitest";
import { haceCuanto, textoInsignia } from "./notificaciones.js";

const AHORA = new Date("2026-11-18T15:00:00Z");
const antes = (segundos) => new Date(AHORA.getTime() - segundos * 1000).toISOString();

describe("notificaciones", () => {
  test("haceCuanto: momento, minutos, horas, días y fecha", () => {
    expect(haceCuanto(antes(20), AHORA)).toBe("hace un momento");
    expect(haceCuanto(antes(5 * 60), AHORA)).toBe("hace 5 min");
    expect(haceCuanto(antes(3 * 3600), AHORA)).toBe("hace 3 h");
    expect(haceCuanto(antes(86400), AHORA)).toBe("hace 1 día");
    expect(haceCuanto(antes(3 * 86400), AHORA)).toBe("hace 3 días");
    expect(haceCuanto("2026-11-02T15:00:00Z", AHORA)).toMatch(/^2 de nov/);
  });

  test("una fecha un poco en el futuro (relojes desfasados) no da tiempos negativos", () => {
    expect(haceCuanto(new Date(AHORA.getTime() + 5000).toISOString(), AHORA)).toBe("hace un momento");
  });

  test("insignia hasta 9, luego 9+", () => {
    expect(textoInsignia(3)).toBe("3");
    expect(textoInsignia(10)).toBe("9+");
  });
});
