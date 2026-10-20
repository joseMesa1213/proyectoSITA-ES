import { useEffect, useState } from "react";
import { Link } from "react-router";
import { cancelarReserva, completarReserva, listarReservasRecibidas } from "../../api/reservas.js";
import { listarMisTutorias } from "../../api/tutorias.js";
import Alerta from "../../components/Alerta.jsx";
import Cargando from "../../components/Cargando.jsx";
import { InsigniaEstado } from "../../components/Insignias.jsx";
import { ESTADO } from "../../utils/constantes.js";
import { formatearFecha } from "../../utils/fechas.js";
import { sesionTermino } from "../../utils/reservas.js";

// Pestañas: cada una decide qué reservas muestra y en qué orden van las sesiones
const PESTANAS = [
  {
    id: "proximas",
    texto: "Próximas",
    incluye: (r) => r.id_estado === ESTADO.ACTIVO && !sesionTermino(r.fecha_sesion, r.horario.hora_fin),
    ascendente: true,
  },
  {
    id: "por-completar",
    texto: "Por completar",
    // Activas cuya sesión ya terminó: el tutor debe marcarlas como completadas (o canceladas)
    incluye: (r) => r.id_estado === ESTADO.ACTIVO && sesionTermino(r.fecha_sesion, r.horario.hora_fin),
    ascendente: true,
  },
  {
    id: "historial",
    texto: "Historial",
    incluye: (r) => r.id_estado !== ESTADO.ACTIVO,
    ascendente: false,
  },
];

/**
 * Agrupa las reservas por sesión (misma tutoría, fecha y horario).
 * Así el tutor ve cada sesión con su lista de estudiantes y los cupos ocupados.
 */
function agruparPorSesion(reservas, ascendente) {
  const sesiones = new Map();
  for (const r of reservas) {
    const clave = `${r.fecha_sesion}|${r.horario.hora_inicio}|${r.horario.id}`;
    if (!sesiones.has(clave)) {
      sesiones.set(clave, { clave, fecha: r.fecha_sesion, horario: r.horario, tutoria: r.tutoria, reservas: [] });
    }
    sesiones.get(clave).reservas.push(r);
  }
  // La clave empieza por fecha y hora, así que ordenarla ordena las sesiones en el tiempo
  const lista = [...sesiones.values()].sort((a, b) => a.clave.localeCompare(b.clave));
  return ascendente ? lista : lista.reverse();
}

// "Agenda de tutorías": reservas que otros hicieron en las tutorías del tutor
export default function AgendaTutorias() {
  const [reservas, setReservas] = useState(null);
  const [cupos, setCupos] = useState({}); // id de tutoría → cupo (la reserva no trae el cupo)
  const [fecha, setFecha] = useState("");
  const [pestana, setPestana] = useState("proximas");
  const [error, setError] = useState(null);

  // El filtro por fecha lo aplica el backend (GET /reservas/tutor?fecha_sesion=)
  useEffect(() => {
    let vigente = true;
    setReservas(null);
    setError(null);
    Promise.all([listarReservasRecibidas(fecha || undefined), listarMisTutorias()])
      .then(([reservas, tutorias]) => {
        if (!vigente) return;
        setReservas(reservas);
        setCupos(Object.fromEntries(tutorias.map((t) => [t.id, t.cupo])));
      })
      .catch((err) => vigente && setError(err));
    return () => {
      vigente = false;
    };
  }, [fecha]);

  // Completar/cancelar devuelven la reserva SIN los datos del estudiante: se combinan con los que ya había
  const actualizar = (nueva) => setReservas((lista) => lista.map((r) => (r.id === nueva.id ? { ...r, ...nueva } : r)));

  const pestanaActual = PESTANAS.find((p) => p.id === pestana);
  const sesiones = reservas ? agruparPorSesion(reservas.filter(pestanaActual.incluye), pestanaActual.ascendente) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agenda de tutorías</h1>
        <p className="mt-1 text-bosque/70">Reservas que otros estudiantes hicieron en sus tutorías.</p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {PESTANAS.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={pestana === p.id} onClick={() => setPestana(p.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                pestana === p.id ? "bg-bosque text-white" : "bg-white text-bosque hover:bg-bosque/5"
              }`}>
              {p.texto} ({reservas ? reservas.filter(p.incluye).length : "…"})
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="fecha" className="etiqueta">Fecha de la sesión</label>
            <input id="fecha" type="date" className="campo" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          {fecha && <button type="button" className="btn-secundario" onClick={() => setFecha("")}>Todas</button>}
        </div>
      </div>

      <Alerta error={error} />

      {!reservas ? (
        !error && <Cargando />
      ) : sesiones.length === 0 ? (
        <div className="tarjeta py-12 text-center text-bosque/70">
          {fecha ? `No hay reservas en esta sección para el ${formatearFecha(fecha).toLowerCase()}.` : "No hay reservas en esta sección."}
          {pestana === "proximas" && !fecha && (
            <p className="mt-2 text-sm">
              ¿Sus tutorías tienen horarios activos? Revíselas en <Link to="/tutor/tutorias" className="underline decoration-acento underline-offset-4">Mis tutorías</Link>.
            </p>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {sesiones.map((s) => (
            // En el historial el conteo de cupos no aporta: las sesiones ya pasaron
            <TarjetaSesion key={s.clave} sesion={s} cupo={pestana === "historial" ? undefined : cupos[s.tutoria.id]}
              ocupados={reservas.filter((r) => r.horario.id === s.horario.id && r.fecha_sesion === s.fecha && r.id_estado === ESTADO.ACTIVO).length}
              onActualizada={actualizar} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TarjetaSesion({ sesion, cupo, ocupados, onActualizada }) {
  const { fecha, horario, tutoria, reservas } = sesion;
  const termino = sesionTermino(fecha, horario.hora_fin);

  return (
    <li className="tarjeta space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-bosque/60 uppercase">{tutoria.materia.nombre}</p>
          <h2 className="text-lg font-semibold">{tutoria.titulo}</h2>
          <p className="text-sm text-bosque/70">{formatearFecha(fecha)} · {horario.hora_inicio} – {horario.hora_fin}</p>
        </div>
        {cupo !== undefined && (
          <span className={`insignia ${ocupados >= cupo ? "bg-acento text-bosque" : "bg-bosque/5 text-bosque"}`}>
            {ocupados}/{cupo} cupos ocupados
          </span>
        )}
      </div>

      <ul className="divide-y divide-bosque/10 rounded-lg border border-bosque/10">
        {reservas.map((r) => (
          <FilaReserva key={r.id} reserva={r} termino={termino} onActualizada={onActualizada} />
        ))}
      </ul>
    </li>
  );
}

function FilaReserva({ reserva, termino, onActualizada }) {
  const { estudiante, recurso } = reserva;
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const activa = reserva.id_estado === ESTADO.ACTIVO;
  const nombre = `${estudiante.nombre} ${estudiante.apellido}`;

  const ejecutar = async (accion, confirmacion) => {
    if (!window.confirm(confirmacion)) return;
    setError(null);
    setProcesando(true);
    try {
      onActualizada(await accion(reserva.id));
    } catch (err) {
      setError(err);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{nombre}</p>
          <p className="truncate text-sm text-bosque/70">
            <a href={`mailto:${estudiante.correo}`} className="underline decoration-bosque/30 underline-offset-2">{estudiante.correo}</a>
            {" · "}{recurso.nombre}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!activa && <InsigniaEstado idEstado={reserva.id_estado} nombre={reserva.estado} />}
          {activa && termino && (
            <button type="button" className="btn-primario px-3 py-1" disabled={procesando}
              onClick={() => ejecutar(completarReserva, `¿Marcar como completada la sesión de ${nombre}? Así podrá valorarla.`)}>
              Completar
            </button>
          )}
          {activa && (
            <button type="button" className="btn-peligro px-3 py-1" disabled={procesando}
              onClick={() => ejecutar(cancelarReserva, `¿Cancelar la reserva de ${nombre}?`)}>
              Cancelar
            </button>
          )}
          {activa && !termino && <span className="text-xs text-bosque/50">Completar se habilita al terminar la sesión</span>}
        </div>
      </div>
      <Alerta error={error} />
    </li>
  );
}
