import { pedir } from "./cliente.js";

// Requiere sesión. tipo: "Físico" | "Virtual" (opcional). Los no administradores solo ven los ACTIVOS.
export const listarRecursos = (tipo) => pedir("/recursos", { consulta: { tipo } });
