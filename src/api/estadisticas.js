import { pedir } from "./cliente.js";

// Solo administrador. semanas: 4–52 (por defecto 12)
export const obtenerEstadisticas = (semanas) => pedir("/estadisticas", { consulta: { semanas } });
