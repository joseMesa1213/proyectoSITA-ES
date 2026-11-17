import { beforeEach, describe, expect, test, vi } from "vitest";

// API simulada: el motor y las respuestas dinámicas consultan estas funciones
vi.mock("../api/materias.js", () => ({
  listarMaterias: vi.fn().mockResolvedValue([{ id: 9, nombre: "Química General", codigo: "2530101" }]),
}));
vi.mock("../api/tutorias.js", () => ({ listarTutorias: vi.fn().mockResolvedValue([]) }));
vi.mock("../api/solicitudesTutoria.js", () => ({ listarMisSolicitudesTutoria: vi.fn(), listarSolicitudesParaMi: vi.fn() }));
vi.mock("../api/estadisticas.js", () => ({ obtenerEstadisticas: vi.fn() }));
vi.mock("../api/reservas.js", () => ({ listarMisReservas: vi.fn(), listarReservasRecibidas: vi.fn() }));
vi.mock("../api/solicitudes.js", () => ({ listarSolicitudes: vi.fn(), obtenerMiSolicitud: vi.fn() }));

const { responder } = await import("./motor.js");
const api = await import("../api/solicitudesTutoria.js");
const { obtenerEstadisticas } = await import("../api/estadisticas.js");

const ESTUDIANTE = { id: 7, nombre: "Camila", id_rol: 1 };
const TUTOR = { id: 2, nombre: "Ana", id_rol: 2 };
const ADMIN = { id: 1, nombre: "Admin", id_rol: 3 };
const destinos = (r) => (r.enlaces ?? []).map((e) => e.a);

beforeEach(() => vi.clearAllMocks());

describe("búsqueda sin resultados: ofrece pedir la tutoría", () => {
  test("estudiante: enlace con la materia ya elegida", async () => {
    const r = await responder("química general", ESTUDIANTE);
    expect(r.texto).toContain("Por ahora no hay tutorías de Química General");
    expect(r.texto).toContain("pídala");
    expect(r.enlaces[0]).toEqual({ a: "/solicitudes?id_materia=9", texto: "Pedir una tutoría de Química General" });
  });

  test("visitante también (lo llevará a iniciar sesión); el administrador no", async () => {
    expect(destinos(await responder("química general", null))).toContain("/solicitudes?id_materia=9");
    expect(destinos(await responder("química general", ADMIN))).not.toContain("/solicitudes?id_materia=9");
  });
});

describe("respuestas que consultan la API", () => {
  test("pedir una tutoría: cuántas tiene abiertas y las atendidas con su tutoría", async () => {
    api.listarMisSolicitudesTutoria.mockResolvedValue([
      { id: 1, id_estado: 3, tema: "Series", materia: { nombre: "Cálculo" } },
      { id: 2, id_estado: 5, tema: "Integrales", materia: { nombre: "Cálculo" }, tutoria: { id: 12, titulo: "Integrales sin miedo" } },
    ]);
    const r = await responder("pedir una tutoría", ESTUDIANTE);
    expect(r.texto).toContain("Usted tiene 1 abierta y 1 atendida.");
    expect(r.tarjetas).toEqual([expect.objectContaining({ titulo: "Integrales sin miedo", a: "/tutorias/12" })]);
    expect(destinos(r)).toEqual(["/solicitudes"]);
  });

  test("pedir una tutoría sin sesión: explica y pide iniciar sesión, sin consultar", async () => {
    const r = await responder("pedir una tutoría", null);
    expect(destinos(r)).toEqual(["/login"]);
    expect(api.listarMisSolicitudesTutoria).not.toHaveBeenCalled();
  });

  test("tutor: solicitudes abiertas de sus materias", async () => {
    api.listarSolicitudesParaMi.mockResolvedValue([
      { id: 4, tema: "Normalización", materia: { nombre: "Bases de Datos" }, estudiante: { nombre: "Camila", apellido: "Gómez" }, disponibilidad: "martes" },
    ]);
    const r = await responder("solicitudes de estudiantes", TUTOR);
    expect(r.texto).toContain("Hay 1 solicitud abierta");
    expect(r.tarjetas[0]).toMatchObject({ titulo: "Normalización", subtitulo: "Bases de Datos · Camila Gómez", detalle: "Disponibilidad: martes" });
  });

  test("administrador: cifras y materias con demanda sin tutorías", async () => {
    obtenerEstadisticas.mockResolvedValue({
      periodo: { semanas: 12 },
      resumen: { reservas: 341, valoracion_promedio: 4.38, solicitudes_abiertas: 4 },
      demanda_sin_oferta: [{ nombre: "Química General", solicitudes_abiertas: 3, solicitudes_vencidas: 2, tutores: 0 }],
    });
    const r = await responder("¿dónde faltan tutores?", ADMIN);
    expect(r.texto).toContain("341 reservas");
    expect(r.texto).toContain("Esta materia pide tutorías");
    expect(r.tarjetas[0]).toMatchObject({ titulo: "Química General", detalle: "Sin tutores asociados", a: "/admin/estadisticas" });
  });

  test("si la API falla, el error se muestra como un mensaje del chat", async () => {
    api.listarSolicitudesParaMi.mockRejectedValue(new Error("No se pudo conectar con el servidor."));
    const r = await responder("solicitudes de estudiantes", TUTOR);
    expect(r.texto).toBe("No se pudo conectar con el servidor.");
  });
});
