import { useEffect, useState } from "react";
import { useConfirmar } from "../../components/Confirmar.jsx";
import { useAvisos } from "../../components/Avisos.jsx";
import { Link } from "react-router";
import { cancelarReserva, completarReserva, listarReservasRecibidas } from "../../api/reservas.js";
import { listarMisTutorias } from "../../api/tutorias.js";
import Alerta from "../../components/Alerta.jsx";
import EstadoVacio from "../../components/EstadoVacio.jsx";
import { EsqueletoLista } from "../../components/Esqueletos.jsx";
import { InsigniaEstado } from "../../components/Insignias.jsx";
import BotonCalendario from "../../components/BotonCalendario.jsx";
import { lugarDeRecurso } from "../../utils/calendario.js";
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
        <h1 className="titulo-pagina">Agenda de tutorías</h1>
        <p className="mt-1 text-texto-suave">Reservas que otros estudiantes hicieron en sus tutorías.</p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {PESTANAS.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={pestana === p.id} onClick={() => setPestana(p.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                pestana === p.id ? "bg-primario text-primario-texto" : "bg-superficie text-texto hover:bg-texto/5"
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
        !error && <EsqueletoLista texto="Cargando la agenda..." />
      ) : sesiones.length === 0 ? (
        fecha ? (
          <EstadoVacio titulo={`No hay reservas en esta sección para el ${formatearFecha(fecha).toLowerCase()}`}
            accion={<button type="button" className="btn-secundario" onClick={() => setFecha("")}>Ver todas las fechas</button>} />
        ) : pestana === "proximas" ? (
          <EstadoVacio titulo="No hay reservas próximas"
            accion={<Link to="/tutor/tutorias" className="btn-primario">Revisar mis tutorías</Link>}>
            Para recibir reservas, sus tutorías necesitan horarios activos.
          </EstadoVacio>
        ) : (
          <EstadoVacio titulo="No hay reservas en esta sección" />
        )
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
  const activas = reservas.filter((r) => r.id_estado === ESTADO.ACTIVO);

  return (
    <li className="tarjeta space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-texto-suave uppercase">{tutoria.materia.nombre}</p>
          <h2 className="titulo-seccion">{tutoria.titulo}</h2>
          <p className="text-sm text-texto-suave">{formatearFecha(fecha)} · {horario.hora_inicio} – {horario.hora_fin}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cupo !== undefined && (
            <span className={`insignia ${ocupados >= cupo ? "bg-acento text-sobre-acento" : "bg-texto/5 text-texto"}`}>
              {ocupados}/{cupo} cupos ocupados
            </span>
          )}
          {!termino && activas.length > 0 && (
            <BotonCalendario evento={{
              uid: `sesion-${horario.id}-${fecha}@sita-es`,
              titulo: `Dictar: ${tutoria.titulo}`,
              fecha,
              hora_inicio: horario.hora_inicio,
              hora_fin: horario.hora_fin,
              lugar: lugarDeRecurso(activas[0].recurso),
              detalles: `${tutoria.materia.nombre}\nEstudiantes: ${activas.map((r) => `${r.estudiante.nombre} ${r.estudiante.apellido}`).join(", ")}`,
              url: `${window.location.origin}/tutor/reservas`,
            }} />
          )}
        </div>
      </div>

      <ul className="divide-y divide-borde border-t border-borde">
        {reservas.map((r) => (
          <FilaReserva key={r.id} reserva={r} termino={termino} onActualizada={onActualizada} />
        ))}
      </ul>
    </li>
  );
}

function FilaReserva({ reserva, termino, onActualizada }) {
  const confirmar = useConfirmar();
  const avisos = useAvisos();
  const { estudiante, recurso } = reserva;
  const [procesando, setProcesando] = useState(false);
  const activa = reserva.id_estado === ESTADO.ACTIVO;
  const nombre = `${estudiante.nombre} ${estudiante.apellido}`;

  // confirmacion: opciones del diálogo de confirmación (título, mensaje, botón); exito: texto del aviso
  const ejecutar = async (accion, confirmacion, exito) => {
    if (!(await confirmar(confirmacion))) return;
    setProcesando(true);
    try {
      onActualizada(await accion(reserva.id));
      avisos.exito(exito);
    } catch (err) {
      avisos.error(err);
    } finally {
      setProcesando(false);
    }
  };

  return (
    // En el celular: datos arriba y botones abajo, a lo ancho; desde sm, en una sola fila
    <li className="py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">{nombre}</p>
          <p className="text-sm break-words text-texto-suave">
            <a href={`mailto:${estudiante.correo}`} className="underline decoration-borde-fuerte underline-offset-2">{estudiante.correo}</a>
          </p>
          <p className="text-sm text-texto-suave">{recurso.nombre}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {!activa && <InsigniaEstado idEstado={reserva.id_estado} nombre={reserva.estado} />}
          {activa && termino && (
            <button type="button" className="btn-primario flex-1 px-3 py-1.5 sm:flex-none sm:py-1" disabled={procesando}
              onClick={() => ejecutar(completarReserva, {
                titulo: "Completar sesión",
                mensaje: `¿Marcar como completada la sesión de ${nombre}? Así podrá valorarla.`,
                textoConfirmar: "Sí, completar",
              }, `Sesión de ${nombre} completada: ya puede valorarla.`)}>
              Completar
            </button>
          )}
          {activa && (
            <button type="button" className="btn-peligro flex-1 px-3 py-1.5 sm:flex-none sm:py-1" disabled={procesando}
              onClick={() => ejecutar(cancelarReserva, {
                titulo: "Cancelar reserva",
                mensaje: `¿Cancelar la reserva de ${nombre}? Se le liberará el cupo.`,
                textoConfirmar: "Sí, cancelar la reserva",
                textoCancelar: "No, mantenerla",
                peligro: true,
              }, `Reserva de ${nombre} cancelada.`)}>
              Cancelar
            </button>
          )}
          {activa && !termino && <span className="w-full text-xs text-texto-suave sm:order-first sm:w-auto">Completar se habilita al terminar la sesión</span>}
        </div>
      </div>
    </li>
  );
}
