import { ESTADO } from "../utils/constantes.js";

// Etiquetas pequeñas reutilizables (nivel, modalidad, estado de una reserva)

export function InsigniaNivel({ nivel }) {
  if (!nivel) return null;
  return <span className="insignia bg-acento/15 text-bosque">{nivel}</span>;
}

export function InsigniaModalidad({ modalidad }) {
  if (!modalidad) return null;
  return <span className="insignia border border-bosque/15 text-bosque">{modalidad}</span>;
}

const ESTILO_ESTADO = {
  [ESTADO.ACTIVO]: "bg-bosque text-white",
  [ESTADO.COMPLETADO]: "bg-exito/10 text-exito",
  [ESTADO.CANCELADO]: "bg-peligro/10 text-peligro",
};

// La reserva trae id_estado (número) y estado (nombre: "Activo", "Completado"...)
export function InsigniaEstado({ idEstado, nombre }) {
  return <span className={`insignia ${ESTILO_ESTADO[idEstado] ?? "bg-bosque/10 text-bosque"}`}>{nombre}</span>;
}
