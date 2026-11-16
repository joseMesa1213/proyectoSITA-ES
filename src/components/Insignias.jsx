import { ESTADO } from "../utils/constantes.js";

// Etiquetas pequeñas reutilizables (nivel, modalidad, estado de una reserva o de una solicitud de tutor)

export function InsigniaNivel({ nivel }) {
  if (!nivel) return null;
  return <span className="insignia bg-acento/15 text-texto">{nivel}</span>;
}

export function InsigniaModalidad({ modalidad }) {
  if (!modalidad) return null;
  return <span className="insignia border border-borde text-texto">{modalidad}</span>;
}

const ESTILO_ESTADO = {
  [ESTADO.ACTIVO]: "bg-primario text-primario-texto",
  [ESTADO.COMPLETADO]: "bg-exito/10 text-exito",
  [ESTADO.CANCELADO]: "bg-peligro/10 text-peligro",
  [ESTADO.PENDIENTE]: "bg-acento/20 text-texto",
  [ESTADO.APROBADO]: "bg-exito/10 text-exito",
  [ESTADO.RECHAZADO]: "bg-peligro/10 text-peligro",
};

// La reserva trae id_estado (número) y estado (nombre: "Activo", "Completado"...)
export function InsigniaEstado({ idEstado, nombre }) {
  return <span className={`insignia ${ESTILO_ESTADO[idEstado] ?? "bg-texto/10 text-texto"}`}>{nombre}</span>;
}
