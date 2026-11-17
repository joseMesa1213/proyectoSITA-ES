import { useState } from "react";
import { useConfirmar } from "./Confirmar.jsx";
import { useAvisos } from "./Avisos.jsx";
import { desactivarHorario } from "../api/tutorias.js";
import FormularioHorario from "./FormularioHorario.jsx";
import { ESTADO } from "../utils/constantes.js";
import { contarReservas, reservasActivasFuturas } from "../utils/reservas.js";

/**
 * Horarios semanales de una tutoría: agregar un bloque (ej. Lunes 10:00–12:00 en el Salón 101) y desactivar.
 * - Agregar: ver FormularioHorario (validaciones, sala Jitsi de las Virtuales, cruces).
 * - Desactivar cancela las reservas de sesiones que aún no empiezan.
 * - No existe "reactivar horario": para volver a ofrecerlo se agrega uno nuevo.
 * onCambio(horarios, reservasCanceladas) recibe la lista actualizada.
 */
export default function HorariosTutoria({ tutoria, reservas, onCambio }) {
  const confirmar = useConfirmar();
  const avisos = useAvisos();
  const [procesando, setProcesando] = useState(false);

  const activos = tutoria.horarios.filter((h) => h.id_estado === ESTADO.ACTIVO);
  const inactivos = tutoria.horarios.filter((h) => h.id_estado !== ESTADO.ACTIVO);

  const desactivar = async (horario) => {
    const pendientes = reservasActivasFuturas(reservas, (r) => r.horario.id === horario.id).length;
    const mensaje =
      `¿Desactivar el horario ${horario.dia} ${horario.hora_inicio} – ${horario.hora_fin}?\n\n` +
      "Ya no se podrá reservar y no se puede reactivar (tendría que agregarlo de nuevo)." +
      (pendientes > 0
        ? `\n\nAtención: tiene ${contarReservas(pendientes)} futuras activas. ` +
          "Las de sesiones que aún no empiezan se cancelarán."
        : "");
    const confirmado = await confirmar({
      titulo: "Desactivar horario",
      mensaje,
      textoConfirmar: "Sí, desactivar",
      peligro: true,
    });
    if (!confirmado) return;

    setProcesando(true);
    try {
      const { reservas_canceladas, ...actualizado } = await desactivarHorario(tutoria.id, horario.id);
      onCambio(tutoria.horarios.map((h) => (h.id === actualizado.id ? actualizado : h)), reservas_canceladas);
      avisos.exito(reservas_canceladas > 0
        ? `Horario desactivado. Se cancelaron ${contarReservas(reservas_canceladas)}.`
        : "Horario desactivado.");
    } catch (err) {
      // Es el resultado de un botón, no de un formulario: va como aviso
      avisos.error(err);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-4">
      {activos.length === 0 ? (
        <p className="text-sm text-texto-suave">No tiene horarios activos: nadie puede reservar esta tutoría todavía.</p>
      ) : (
        <ul className="divide-y divide-borde">
          {activos.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                <span className="font-medium">{h.dia}</span> {h.hora_inicio} – {h.hora_fin}
                <span className="text-sm text-texto-suave"> · {h.recurso.nombre}</span>
              </span>
              <button type="button" className="btn-peligro px-3 py-1" disabled={procesando} onClick={() => desactivar(h)}>
                Desactivar
              </button>
            </li>
          ))}
        </ul>
      )}

      <FormularioHorario tutoria={tutoria} onAgregado={(horario) => onCambio([...tutoria.horarios, horario])} />

      {inactivos.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-texto-suave">Horarios desactivados ({inactivos.length})</summary>
          <p className="mt-2 text-xs text-texto-suave">No se pueden reactivar; para ofrecerlos de nuevo agréguelos otra vez.</p>
          <ul className="mt-1 space-y-1 text-texto-suave">
            {inactivos.map((h) => (
              <li key={h.id} className="line-through">{h.dia} {h.hora_inicio} – {h.hora_fin} · {h.recurso.nombre}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
