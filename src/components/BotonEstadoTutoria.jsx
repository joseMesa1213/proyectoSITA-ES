import { useState } from "react";
import { actualizarTutoria } from "../api/tutorias.js";
import { ESTADO } from "../utils/constantes.js";
import { contarReservas } from "../utils/reservas.js";

/**
 * Inactivar o reactivar una tutoría (PUT /tutorias/:id con id_estado).
 * Al inactivar, avisa cuántas reservas futuras activas quedan: el backend NO las cancela.
 * onCambiada(tutoriaActualizada) recibe la respuesta; onError(error) si falla.
 */
export default function BotonEstadoTutoria({ tutoria, reservasFuturas = 0, onCambiada, onError }) {
  const [procesando, setProcesando] = useState(false);
  const activa = tutoria.id_estado === ESTADO.ACTIVO;

  const cambiar = async () => {
    const mensaje = activa
      ? `¿Inactivar «${tutoria.titulo}»?\n\nDejará de aparecer en el catálogo y nadie podrá reservarla.` +
        (reservasFuturas > 0
          ? `\n\nAtención: tiene ${contarReservas(reservasFuturas)} futuras activas que NO se cancelan automáticamente. ` +
            "Cancélelas desde la Agenda de tutorías si la sesión no se va a dictar."
          : "")
      : `¿Reactivar «${tutoria.titulo}»? Volverá a aparecer en el catálogo.`;
    if (!window.confirm(mensaje)) return;

    setProcesando(true);
    try {
      onCambiada(await actualizarTutoria(tutoria.id, { id_estado: activa ? ESTADO.INACTIVO : ESTADO.ACTIVO }));
    } catch (err) {
      onError?.(err);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <button type="button" className={activa ? "btn-peligro" : "btn-secundario"} onClick={cambiar} disabled={procesando}>
      {procesando ? "Guardando..." : activa ? "Inactivar" : "Reactivar"}
    </button>
  );
}
