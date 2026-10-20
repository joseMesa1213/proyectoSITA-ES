import { useEffect, useState } from "react";
import { agregarHorario, desactivarHorario } from "../api/tutorias.js";
import { obtenerOpciones } from "../api/catalogos.js";
import Alerta from "./Alerta.jsx";
import { ESTADO } from "../utils/constantes.js";
import { contarReservas, reservasActivasFuturas } from "../utils/reservas.js";

/**
 * Horarios semanales de una tutoría: agregar un bloque (ej. Lunes 10:00–12:00) y desactivar.
 * - Si el bloque se cruza con otro horario activo del tutor, el backend responde 409 y Alerta
 *   muestra con cuál se cruza.
 * - No existe "reactivar horario": para volver a ofrecerlo se agrega uno nuevo.
 * onCambio(horarios) recibe la lista actualizada.
 */
export default function HorariosTutoria({ tutoria, reservas, onCambio }) {
  const [dias, setDias] = useState([]);
  const [nuevo, setNuevo] = useState({ dia: "", hora_inicio: "", hora_fin: "" });
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState("");
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    // El backend guarda Domingo primero; en la interfaz se muestra Lunes primero
    obtenerOpciones()
      .then(({ dias }) => setDias([...dias.slice(1), dias[0]]))
      .catch(setError);
  }, []);

  const activos = tutoria.horarios.filter((h) => h.id_estado === ESTADO.ACTIVO);
  const inactivos = tutoria.horarios.filter((h) => h.id_estado !== ESTADO.ACTIVO);

  const cambiar = (e) => setNuevo({ ...nuevo, [e.target.name]: e.target.value });

  const agregar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setAviso("");
    if (nuevo.hora_fin <= nuevo.hora_inicio) {
      return setError(new Error("La hora de fin debe ser posterior a la hora de inicio"));
    }
    setProcesando(true);
    try {
      const horario = await agregarHorario(tutoria.id, nuevo);
      onCambio([...tutoria.horarios, horario]);
      setAviso(`Horario agregado: ${horario.dia} ${horario.hora_inicio} – ${horario.hora_fin}.`);
      setNuevo({ dia: "", hora_inicio: "", hora_fin: "" });
    } catch (err) {
      setError(err);
    } finally {
      setProcesando(false);
    }
  };

  const desactivar = async (horario) => {
    const pendientes = reservasActivasFuturas(reservas, (r) => r.horario.id === horario.id).length;
    const mensaje =
      `¿Desactivar el horario ${horario.dia} ${horario.hora_inicio} – ${horario.hora_fin}?\n\n` +
      "Ya no se podrá reservar y no se puede reactivar (tendría que agregarlo de nuevo)." +
      (pendientes > 0
        ? `\n\nAtención: tiene ${contarReservas(pendientes)} futuras activas que NO se cancelan automáticamente. ` +
          "Cancélelas desde la Agenda de tutorías si no va a dictar esas sesiones."
        : "");
    if (!window.confirm(mensaje)) return;

    setError(null);
    setAviso("");
    setProcesando(true);
    try {
      const actualizado = await desactivarHorario(tutoria.id, horario.id);
      onCambio(tutoria.horarios.map((h) => (h.id === actualizado.id ? actualizado : h)));
    } catch (err) {
      setError(err);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-4">
      {aviso && <Alerta tipo="exito" onCerrar={() => setAviso("")}>{aviso}</Alerta>}
      <Alerta error={error} />

      {activos.length === 0 ? (
        <p className="text-sm text-bosque/60">No tiene horarios activos: nadie puede reservar esta tutoría todavía.</p>
      ) : (
        <ul className="divide-y divide-bosque/10">
          {activos.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                <span className="font-medium">{h.dia}</span> {h.hora_inicio} – {h.hora_fin}
              </span>
              <button type="button" className="btn-peligro px-3 py-1" disabled={procesando} onClick={() => desactivar(h)}>
                Desactivar
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={agregar} className="grid gap-3 rounded-lg bg-crema p-4 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="dia" className="etiqueta">Día</label>
          <select id="dia" name="dia" className="campo" required value={nuevo.dia} onChange={cambiar}>
            <option value="">Seleccione...</option>
            {dias.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="hora_inicio" className="etiqueta">Desde</label>
          <input id="hora_inicio" name="hora_inicio" type="time" className="campo" required value={nuevo.hora_inicio} onChange={cambiar} />
        </div>
        <div>
          <label htmlFor="hora_fin" className="etiqueta">Hasta</label>
          <input id="hora_fin" name="hora_fin" type="time" className="campo" required value={nuevo.hora_fin} onChange={cambiar} />
        </div>
        <button type="submit" className="btn-primario" disabled={procesando}>Agregar</button>
      </form>

      {inactivos.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-bosque/60">Horarios desactivados ({inactivos.length})</summary>
          <p className="mt-2 text-xs text-bosque/60">No se pueden reactivar; para ofrecerlos de nuevo agréguelos otra vez.</p>
          <ul className="mt-1 space-y-1 text-bosque/60">
            {inactivos.map((h) => (
              <li key={h.id} className="line-through">{h.dia} {h.hora_inicio} – {h.hora_fin}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
