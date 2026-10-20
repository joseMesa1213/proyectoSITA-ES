import { pedir } from "./cliente.js";

export const listarMaterias = (q) => pedir("/materias", { consulta: { q } });
// Solo tutor
export const listarMisMaterias = () => pedir("/materias/mias");
export const asociarMateria = (idMateria) => pedir(`/materias/${idMateria}/tutor`, { metodo: "POST" });
export const desasociarMateria = (idMateria) =>
  pedir(`/materias/${idMateria}/tutor`, { metodo: "DELETE" });
