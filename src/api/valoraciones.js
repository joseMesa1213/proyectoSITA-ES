import { pedir } from "./cliente.js";

// datos: { id_reserva, calificacion: 1..5, comentario? }
export const crearValoracion = (datos) => pedir("/valoraciones", { metodo: "POST", cuerpo: datos });
// Público: { promedio, total, valoraciones: [...] }
export const listarValoraciones = (idTutoria) => pedir(`/valoraciones/tutoria/${idTutoria}`);
