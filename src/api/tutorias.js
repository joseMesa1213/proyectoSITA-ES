import { pedir } from "./cliente.js";

// Públicos. filtros: { id_materia, nivel, modalidad }
export const listarTutorias = (filtros) => pedir("/tutorias", { consulta: filtros });
export const obtenerTutoria = (id) => pedir(`/tutorias/${id}`);

// Solo el tutor dueño
export const listarMisTutorias = () => pedir("/tutorias/mias");
export const crearTutoria = (datos) => pedir("/tutorias", { metodo: "POST", cuerpo: datos });
export const actualizarTutoria = (id, datos) => pedir(`/tutorias/${id}`, { metodo: "PUT", cuerpo: datos });
export const agregarHorario = (idTutoria, horario) =>
  pedir(`/tutorias/${idTutoria}/horarios`, { metodo: "POST", cuerpo: horario });
export const desactivarHorario = (idTutoria, idHorario) =>
  pedir(`/tutorias/${idTutoria}/horarios/${idHorario}/desactivar`, { metodo: "PATCH" });
