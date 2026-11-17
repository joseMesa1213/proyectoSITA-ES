import { pedir } from "./cliente.js";

// Estudiante o tutor (las propias). datos: { id_materia, tema, descripcion?, disponibilidad? }
export const crearSolicitudTutoria = (datos) => pedir("/solicitudes-tutoria", { metodo: "POST", cuerpo: datos });
export const listarMisSolicitudesTutoria = () => pedir("/solicitudes-tutoria/mias");
export const retirarSolicitudTutoria = (id) => pedir(`/solicitudes-tutoria/${id}/retirar`, { metodo: "PATCH" });

// Solo tutor: abiertas de sus materias, y atenderlas con una tutoría suya
export const listarSolicitudesParaMi = () => pedir("/solicitudes-tutoria/para-mi");
export const atenderSolicitudTutoria = (id, idTutoria) =>
  pedir(`/solicitudes-tutoria/${id}/atender`, { metodo: "PATCH", cuerpo: { id_tutoria: idTutoria } });
