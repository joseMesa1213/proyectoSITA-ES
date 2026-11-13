import { describe, expect, test } from "vitest";
import { clasificar } from "./clasificador.js";
import { intencionesDe } from "./intenciones.js";
import { ROL } from "../utils/constantes.js";

// Datos fijos copiados de la semilla del backend (prisma/seed.js): las pruebas no dependen de la BD.
const MATERIAS = [
  ["2555101", "Álgebra y Trigonometría"],
  ["2555131", "Cálculo Diferencial"],
  ["2555121", "Geometría Vectorial y Analítica"],
  ["2555231", "Cálculo Integral"],
  ["2555221", "Álgebra Lineal"],
  ["2508207", "Matemáticas Discretas I"],
  ["2508303", "Matemáticas Discretas II"],
  ["2508407", "Ecuaciones Diferenciales y Métodos Numéricos"],
  ["2508308", "Teoría de la Probabilidad y Colas"],
  ["2508408", "Métodos Estadísticos"],
  ["2536101", "Descubriendo la Física"],
  ["2536201", "Física Mecánica"],
  ["2508208", "Lógica y Representación I"],
  ["2508307", "Técnicas de Programación y Laboratorio"],
  ["2508507", "Estructura de Datos y Laboratorio"],
  ["2508609", "Bases de Datos y Laboratorio"],
].map(([codigo, nombre], i) => ({ id: i + 1, codigo, nombre }));

const materia = (codigo) => MATERIAS.find((m) => m.codigo === codigo);

// Tutorías activas de la semilla (solo los campos que usa el clasificador)
const TUTORIAS = [
  ["2555131", "Repaso de límites y derivadas", "Límites, continuidad y reglas de derivación con ejercicios tipo parcial."],
  ["2555231", "Técnicas de integración", "Sustitución, por partes, fracciones parciales y sustitución trigonométrica."],
  ["2536201", "Cinemática y leyes de Newton", "Movimiento en una y dos dimensiones, diagramas de cuerpo libre y dinámica."],
  ["2555121", "Vectores, rectas y planos", "Producto punto y cruz, ecuaciones de rectas y planos en el espacio."],
  ["2555221", "Matrices, determinantes y sistemas", "Operaciones con matrices, eliminación de Gauss-Jordan y determinantes."],
  ["2508407", "Taller de EDO para parciales", "Ecuaciones de primer y segundo orden, Laplace y métodos de Euler y Runge-Kutta."],
  ["2508208", "Primeros pasos en algoritmia", "Diagramas de flujo, estructuras de control y pruebas de escritorio."],
  ["2508507", "Listas, pilas y árboles", "Implementación y recorridos de estructuras lineales y árboles binarios."],
  ["2508207", "Lógica proposicional y conjuntos", "Tablas de verdad, equivalencias lógicas, cuantificadores y teoría de conjuntos."],
  ["2508609", "Modelo relacional y SQL", "Diseño entidad-relación, normalización y consultas SQL con JOIN y agregaciones."],
].map(([codigo, titulo, descripcion], i) => ({ id: i + 1, titulo, descripcion, materia: materia(codigo) }));

const USUARIOS = {
  invitado: null,
  estudiante: { id_rol: ROL.ESTUDIANTE },
  tutor: { id_rol: ROL.TUTOR },
  admin: { id_rol: ROL.ADMINISTRADOR },
};

// Resume el resultado en algo fácil de comparar: id de la intención, códigos de materias,
// títulos de tutorías y filtros detectados
function resumir(resultado) {
  if (resultado.intencion) return { intencion: resultado.intencion.id };
  const resumen = {};
  if (resultado.materias) resumen.materias = resultado.materias.map((m) => m.codigo).sort();
  if (resultado.tutorias) resumen.tutorias = resultado.tutorias.map((t) => t.titulo);
  if (resultado.filtros && Object.keys(resultado.filtros).length) resumen.filtros = resultado.filtros;
  return resumen;
}

const MATEMATICAS = expect.arrayContaining(["2555101", "2555131", "2555221", "2555231", "2508207"]);

// [rol, frase, resultado esperado]. {} = "no entendí" (ofrece el menú)
const CASOS = {
  "ya funcionaban (no deben romperse)": [
    ["estudiante", "kalkulo", { materias: ["2555131", "2555231"] }],
    ["estudiante", "bases de dato", { materias: ["2508609"] }],
    ["estudiante", "2508609", { materias: ["2508609"] }],
    ["estudiante", "tutoría de cálculo integral", { materias: ["2555231"] }],
    ["estudiante", "algebra", { materias: ["2555101", "2555221"] }],
    ["estudiante", "física", { materias: ["2536101", "2536201"] }],
    ["estudiante", "programacion", { materias: ["2508307"] }],
    ["estudiante", "probabilidad", { materias: ["2508308"] }],
    ["tutor", "error al agregar horario", { intencion: "error-horario" }],
    ["estudiante", "me cancelaron la tutoría", { intencion: "reserva-cancelada" }],
    ["invitado", "¿qué es SITA?", { intencion: "como-funciona" }],
    ["estudiante", "como cancelo", { intencion: "como-cancelar" }],
    ["estudiante", "¿Cómo reservo?", { intencion: "como-reservar" }],
    ["estudiante", "no me deja reservar", { intencion: "no-pude-reservar" }],
    ["tutor", "quien viene hoy", { intencion: "agenda-hoy" }],
    ["tutor", "como publico una tutoria", { intencion: "publicar-tutoria" }],
    ["tutor", "cambiar cupo", { intencion: "inactivar-tutoria" }],
    ["admin", "crear materia", { intencion: "admin-materias" }],
    ["invitado", "hola", { intencion: "saludo" }],
    ["estudiante", "ayuda", { intencion: "saludo" }],
    ["estudiante", "hola, ¿cómo cancelo?", { intencion: "como-cancelar" }],
    ["estudiante", "muchas gracias", { intencion: "gracias" }],
    ["estudiante", "asdfgh qwerty", {}],
  ],

  "1. temas: sinónimos y texto de las tutorías": [
    ["estudiante", "derivadas", { materias: ["2555131"] }],
    ["estudiante", "sql", { materias: ["2508609"] }],
    ["estudiante", "programar en python", { materias: ["2508307"] }],
    ["estudiante", "integrales por partes", { materias: ["2555231"] }],
    ["estudiante", "arboles binarios", { materias: ["2508507"] }],
    ["estudiante", "leyes de newton", { materias: ["2536201"] }],
    ["estudiante", "derivdas", { materias: ["2555131"] }],
    ["estudiante", "pilas y colas", { materias: ["2508507"] }],
    // No está en los sinónimos: se encuentra en la descripción de la tutoría
    ["estudiante", "runge kutta", { tutorias: ["Taller de EDO para parciales"] }],
    ["estudiante", "diagramas de cuerpo libre", { tutorias: ["Cinemática y leyes de Newton"] }],
  ],

  "2. 'mate' y 'ayuda' no deben ganar como saludo": [
    ["estudiante", "necesito ayuda con mate", { materias: MATEMATICAS }],
    ["estudiante", "matemáticas", { materias: MATEMATICAS }],
    ["invitado", "ayuda con fisica", { materias: ["2536101", "2536201"] }],
  ],

  "3. modalidad, nivel y día": [
    ["estudiante", "tutorías virtuales", { filtros: { modalidad: "Virtual" } }],
    ["estudiante", "algo presencial para el lunes", { filtros: { modalidad: "Presencial", dia: "Lunes" } }],
    ["estudiante", "tutorías de nivel básico", { filtros: { nivel: "Básico" } }],
    ["estudiante", "tutorías para hoy", { filtros: { dia: "hoy" } }],
    ["invitado", "qué hay mañana", { filtros: { dia: "manana" } }],
    ["estudiante", "cálculo virtual", { materias: ["2555131", "2555231"], filtros: { modalidad: "Virtual" } }],
    ["estudiante", "sql avanzado", { materias: ["2508609"], filtros: { nivel: "Avanzado" } }],
    // Si pregunta qué significa, se explica en vez de filtrar
    ["estudiante", "¿qué es híbrida?", { intencion: "modalidades" }],
    ["estudiante", "quién es el mejor tutor", { intencion: "mejor-tutor" }],
    // "clases" se parece a "clave" (contraseña), pero el día pesa más
    ["estudiante", "clases los sábados", { filtros: { dia: "Sábado" } }],
    ["estudiante", "tutorías de cálculo para el jueves", { materias: ["2555131", "2555231"], filtros: { dia: "Jueves" } }],
  ],

  "4. horarios": [
    ["estudiante", "qué horarios hay", { intencion: "horarios" }],
    ["invitado", "horarios del martes", { filtros: { dia: "Martes" } }],
    ["estudiante", "horarios de física", { materias: ["2536101", "2536201"] }],
  ],

  "5. contraseña para todos los roles": [
    ["invitado", "olvidé mi contraseña", { intencion: "contrasena" }],
    ["estudiante", "olvide mi contrasena", { intencion: "contrasena" }],
    ["tutor", "como cambio mi contraseña", { intencion: "contrasena" }],
    ["admin", "cambiar la clave", { intencion: "contrasena" }],
  ],

  "6. sin sesión: pedir que inicie sesión": [
    ["invitado", "mis reservas", { intencion: "requiere-sesion" }],
    ["invitado", "cómo cancelo", { intencion: "requiere-sesion" }],
    ["invitado", "qué me falta calificar", { intencion: "requiere-sesion" }],
    ["invitado", "cómo reservo", { intencion: "como-reservar" }],
  ],

  "7. administrador: cambiar el rol": [
    ["admin", "cómo cambio el rol de un usuario", { intencion: "admin-rol" }],
    ["admin", "convertir un estudiante en tutor", { intencion: "admin-rol" }],
  ],
};

for (const [grupo, casos] of Object.entries(CASOS)) {
  describe(grupo, () => {
    test.each(casos)("%s: «%s»", (rol, frase, esperado) => {
      const resultado = resumir(clasificar(frase, intencionesDe(USUARIOS[rol]), MATERIAS, TUTORIAS));
      if (Object.keys(esperado).length === 0) expect(resultado).toEqual({});
      else expect(resultado).toMatchObject(esperado);
    });
  });
}
