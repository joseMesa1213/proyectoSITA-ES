import { pedir } from "./cliente.js";

// Avisos del usuario autenticado (campanita): { no_leidas, notificaciones: [...] }
export const listarNotificaciones = () => pedir("/notificaciones");
export const marcarNotificacionLeida = (id) => pedir(`/notificaciones/${id}/leer`, { metodo: "PATCH" });
export const marcarTodasLeidas = () => pedir("/notificaciones/leer-todas", { metodo: "PATCH" });
