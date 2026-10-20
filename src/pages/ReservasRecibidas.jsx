import { useEffect, useState } from "react";
import { Link } from "react-router";
import { cancelarReserva, completarReserva, listarReservasRecibidas } from "../api/reservas.js";
import Alerta from "../components/Alerta.jsx";
import Cargando from "../components/Cargando.jsx";
import Estrellas from "../components/Estrellas.jsx";
import { InsigniaEstado } from "../components/Insignias.jsx";
import { ESTADO } from "../utils/constantes.js";
import { formatearFecha, hoy } from "../utils/fechas.js";

const PESTANAS = [
  { valor: ESTADO.ACTIVO, texto: "Por realizar" },
  { valor: ESTADO.COMPLETADO, texto: "Completadas" },
  { valor: ESTADO.CANCELADO, texto: "Canceladas" },
  { valor: null, texto: "Todas" },
];

// Por realizar: de la más cercana a la más lejana (fecha y luego hora)
const porFechaYHora = (a, b) =>
  a.fecha_sesion.localeCompare(b.fecha_sesion) || a.horario.hora_inicio.localeCompare(b.horario.hora_inicio);

// Tutor: reservas que los estudiantes hicieron en sus tutorías
export default function ReservasRecibidas() {
  const [reservas, setReservas] = useState(null);
  const [error, setError] = useState(null);
  const [pestana, setPestana] = useState(ESTADO.ACTIVO);
  const [fecha, setFecha] = useState("");

  useEffect(() => {
    setReservas(null);
    listarReservasRecibidas(fecha || undefined).then(setReservas).catch(setError);
  }, [fecha]);

  const actualizar = (reservaNueva) =>
    setReservas((lista) => lista.map((r) => (r.id === reservaNueva.id ? { ...r, ...reservaNueva } : r)));

  if (error && !reservas) return <Alerta error={error} />;

  const visibles = (reservas ?? []).filter((r) => pestana === null || r.id_estado === pestana);
  if (pestana === ESTADO.ACTIVO) visibles.sort(porFechaYHora);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reservas recibidas</h1>
        <p className="mt-1 text-bosque/70">
          Después de cada sesión márquela como completada: así el estudiante puede valorarla.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {PESTANAS.map((p) => {
            const cantidad = (reservas ?? []).filter((r) => p.valor === null || r.id_estado === p.valor).length;
            return (
              <button key={p.texto} type="button" role="tab" aria-selected={pestana === p.valor}
                onClick={() => setPestana(p.valor)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  pestana === p.valor ? "bg-bosque text-white" : "bg-white text-bosque hover:bg-bosque/5"
                }`}>
                {p.texto} ({cantidad})
              </button>
            );
          })}
        </div>

        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="fecha" className="etiqueta">Fecha de la sesión</label>
            <input id="fecha" type="date" className="campo" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <button type="button" className="btn-secundario" onClick={() => setFecha(hoy())}>Hoy</button>
          {fecha && <button type="button" className="btn-secundario" onClick={() => setFecha("")}>Todas</button>}
        </div>
      </div>

      {!reservas ? (
        <Cargando />
      ) : visibles.length === 0 ? (
        <div className="tarjeta py-12 text-center text-bosque/70">
          <p>No hay reservas en esta sección{fecha && ` para el ${formatearFecha(fecha)}`}.</p>
          <Link to="/tutor/tutorias" className="btn-secundario mt-4">Ver mis tutorías</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {visibles.map((r) => (
            <TarjetaReservaRecibida key={r.id} reserva={r} onActualizada={actualizar} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TarjetaReservaRecibida({ reserva, onActualizada }) {
  const { tutoria, horario, recurso, estudiante } = reserva;
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const activa = reserva.id_estado === ESTADO.ACTIVO;
  // El backend solo permite completar sesiones de hoy o anteriores
  const yaOcurrio = reserva.fecha_sesion <= hoy();

  const ejecutar = async (accion) => {
    setError(null);
    setProcesando(true);
    try {
      onActualizada(await accion());
    } catch (err) {
      setError(err);
    } finally {
      setProcesando(false);
    }
  };

  const completar = () => ejecutar(() => completarReserva(reserva.id));
  const cancelar = () => {
    if (!window.confirm(`¿Cancelar la reserva de ${estudiante.nombre} ${estudiante.apellido}? El estudiante verá la reserva como cancelada.`)) return;
    ejecutar(() => cancelarReserva(reserva.id));
  };

  return (
    <li className="tarjeta space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{estudiante.nombre} {estudiante.apellido}</p>
          <a href={`mailto:${estudiante.correo}`} className="text-sm text-bosque/70 hover:underline">{estudiante.correo}</a>
        </div>
        <InsigniaEstado idEstado={reserva.id_estado} nombre={reserva.estado} />
      </div>

      <div className="grid gap-2 rounded-lg bg-crema px-4 py-3 text-sm sm:grid-cols-3">
        <p className="sm:col-span-3"><span className="text-bosque/60">Tutoría: </span><span className="font-medium">{tutoria.titulo}</span></p>
        <p><span className="text-bosque/60">Fecha: </span><span className="font-medium">{formatearFecha(reserva.fecha_sesion)}</span></p>
        <p><span className="text-bosque/60">Hora: </span><span className="font-medium">{horario.hora_inicio} – {horario.hora_fin}</span></p>
        <p className="min-w-0 truncate"><span className="text-bosque/60">Recurso: </span><span className="font-medium">{recurso.nombre}</span></p>
      </div>

      <Alerta error={error} />

      {activa && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-primario" onClick={completar} disabled={procesando || !yaOcurrio}>
            Marcar como completada
          </button>
          <button type="button" className="btn-peligro" onClick={cancelar} disabled={procesando}>Cancelar</button>
          {!yaOcurrio && <span className="text-xs text-bosque/60">Podrá completarla desde el día de la sesión.</span>}
        </div>
      )}

      {reserva.valoracion && (
        <p className="flex items-center gap-2 text-sm">
          <span className="text-bosque/60">Valoración del estudiante:</span>
          <Estrellas valor={reserva.valoracion.calificacion} />
        </p>
      )}
    </li>
  );
}
