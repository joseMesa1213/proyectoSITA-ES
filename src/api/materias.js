import { pedir } from "./cliente.js";

export const listarMaterias = (q) => pedir("/materias", { consulta: { q } });
// Solo tutor
export const listarMisMaterias = () => pedir("/materias/mias");
export const asociarMateria = (idMateria) => pedir(`/materias/${idMateria}/tutor`, { metodo: "POST" });
export const desasociarMateria = (idMateria) =>
  pedir(`/materias/${idMateria}/tutor`, { metodo: "DELETE" });

// Solo administrador. datos: { nombre, codigo, creditos }
export const crearMateria = (datos) => pedir("/materias", { metodo: "POST", cuerpo: datos });
export const actualizarMateria = (id, datos) => pedir(`/materias/${id}`, { metodo: "PUT", cuerpo: datos });
