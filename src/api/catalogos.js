import { pedir } from "./cliente.js";

// { dias, niveles, modalidades, tiposRecurso }
export const obtenerOpciones = () => pedir("/catalogos/opciones");
// [{ id, nombre }]
export const listarTiposDocumento = () => pedir("/catalogos/tipos-documento");
