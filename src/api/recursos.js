import { pedir } from "./cliente.js";

// Requiere sesión. tipo: "Físico" | "Virtual" (opcional). Los no administradores solo ven los ACTIVOS.
export const listarRecursos = (tipo) => pedir("/recursos", { consulta: { tipo } });

// Solo administrador. datos: { nombre, tipo, ubicacion, capacidad } (+ id_estado al actualizar)
export const crearRecurso = (datos) => pedir("/recursos", { metodo: "POST", cuerpo: datos });
export const actualizarRecurso = (id, datos) => pedir(`/recursos/${id}`, { metodo: "PUT", cuerpo: datos });
