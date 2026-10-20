import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { cancelarReserva, listarMisReservas } from "../api/reservas.js";
import { crearValoracion } from "../api/valoraciones.js";
import Alerta from "../components/Alerta.jsx";
import Cargando from "../components/Cargando.jsx";
import Estrellas from "../components/Estrellas.jsx";
import { InsigniaEstado } from "../components/Insignias.jsx";
import { ESTADO } from "../utils/constantes.js";
import { formatearFecha } from "../utils/fechas.js";

const PESTANAS = [
  { valor: ESTADO.ACTIVO, texto: "Próximas" },
  { valor: ESTADO.COMPLETADO, texto: "Completadas" },
  { valor: ESTADO.CANCELADO, texto: "Canceladas" },
  { valor: null, texto: "Todas" },
];

// "Mi agenda": reservas hechas por el usuario (estudiante o tutor que reserva)
export default function MisReservas() {
  const ubicacion = useLocation();
  const [reservas, setReservas] = useState(null);
  const [error, setError] = useState(null);
  const [pestana, setPestana] = useState(ESTADO.ACTIVO);
  // Mensaje que llega desde Reservar ("Reserva confirmada...")
  const [aviso, setAviso] = useState(ubicacion.state?.aviso ?? "");

  useEffect(() => {
    listarMisReservas().then(setReservas).catch(setError);
  }, []);

  // Reemplaza una reserva de la lista por su versión actualizada (tras cancelar o valorar)
  const actualizar = (reservaNueva) =>
    setReservas((lista) => lista.map((r) => (r.id === reservaNueva.id ? reservaNueva : r)));

  if (error && !reservas) return <Alerta error={error} />;
  if (!reservas) return <Cargando />;

  // Las próximas se muestran de la más cercana a la más lejana (el backend las trae al revés)
  const visibles = reservas.filter((r) => pestana === null || r.id_estado === pestana);
  if (pestana === ESTADO.ACTIVO) visibles.reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi agenda</h1>
        <p className="mt-1 text-bosque/70">Sus reservas de tutorías.</p>
      </div>

      {aviso && <Alerta tipo="exito" onCerrar={() => setAviso("")}>{aviso}</Alerta>}

      <div className="flex flex-wrap gap-2" role="tablist">
        {PESTANAS.map((p) => {
          const cantidad = reservas.filter((r) => p.valor === null || r.id_estado === p.valor).length;
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

      {visibles.length === 0 ? (
        <div className="tarjeta py-12 text-center text-bosque/70">
          <p>No tiene reservas en esta sección.</p>
          <Link to="/tutorias" className="btn-primario mt-4">Buscar tutorías</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {visibles.map((r) => (
            <TarjetaReserva key={r.id} reserva={r} onActualizada={actualizar} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TarjetaReserva({ reserva, onActualizada }) {
  const { tutoria, horario, recurso } = reserva;
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [valorando, setValorando] = useState(false);

  const cancelar = async () => {
    if (!window.confirm(`¿Cancelar la reserva de "${tutoria.titulo}" del ${formatearFecha(reserva.fecha_sesion)}?`)) return;
    setError(null);
    setProcesando(true);
    try {
      onActualizada(await cancelarReserva(reserva.id));
    } catch (err) {
      setError(err);
    } finally {
      setProcesando(false);
    }
  };

  // Recurso virtual: la ubicación es el enlace de la reunión
  const esEnlace = /^https?:\/\//i.test(recurso.ubicacion);

  return (
    <li className="tarjeta space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-bosque/60 uppercase">{tutoria.materia.nombre}</p>
          <Link to={`/tutorias/${tutoria.id}`} className="text-lg font-semibold hover:underline hover:decoration-acento hover:underline-offset-4">
            {tutoria.titulo}
          </Link>
          <p className="text-sm text-bosque/70">con {tutoria.tutor.nombre} {tutoria.tutor.apellido}</p>
        </div>
        <InsigniaEstado idEstado={reserva.id_estado} nombre={reserva.estado} />
      </div>

      <div className="grid gap-2 rounded-lg bg-crema px-4 py-3 text-sm sm:grid-cols-3">
        <p><span className="text-bosque/60">Fecha: </span><span className="font-medium">{formatearFecha(reserva.fecha_sesion)}</span></p>
        <p><span className="text-bosque/60">Hora: </span><span className="font-medium">{horario.hora_inicio} – {horario.hora_fin}</span></p>
        <p className="min-w-0 truncate">
          <span className="text-bosque/60">{recurso.tipo === "Virtual" ? "Enlace: " : "Lugar: "}</span>
          {esEnlace ? (
            <a href={recurso.ubicacion} target="_blank" rel="noreferrer" className="font-medium underline decoration-acento underline-offset-2">
              {recurso.nombre}
            </a>
          ) : (
            <span className="font-medium">{recurso.nombre} — {recurso.ubicacion}</span>
          )}
        </p>
      </div>

      <Alerta error={error} />

      {/* Acciones según el estado */}
      {reserva.id_estado === ESTADO.ACTIVO && (
        <button type="button" className="btn-peligro" onClick={cancelar} disabled={procesando}>
          {procesando ? "Cancelando..." : "Cancelar reserva"}
        </button>
      )}

      {reserva.id_estado === ESTADO.COMPLETADO &&
        (reserva.valoracion ? (
          <p className="flex items-center gap-2 text-sm">
            <span className="text-bosque/60">Su valoración:</span>
            <Estrellas valor={reserva.valoracion.calificacion} />
          </p>
        ) : valorando ? (
          <FormularioValoracion
            idReserva={reserva.id}
            onCancelar={() => setValorando(false)}
            onValorada={(valoracion) =>
              onActualizada({ ...reserva, valoracion: { id: valoracion.id, calificacion: valoracion.calificacion } })
            }
          />
        ) : (
          <button type="button" className="btn-primario" onClick={() => setValorando(true)}>Valorar sesión</button>
        ))}
    </li>
  );
}

function FormularioValoracion({ idReserva, onValorada, onCancelar }) {
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!calificacion) return setError(new Error("Elija una calificación de 1 a 5 estrellas"));
    setError(null);
    setEnviando(true);
    try {
      onValorada(await crearValoracion({ id_reserva: idReserva, calificacion, comentario: comentario.trim() || undefined }));
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-lg border border-acento/40 p-4">
      <div>
        <p className="etiqueta">¿Cómo le pareció la sesión?</p>
        <Estrellas valor={calificacion} onCambiar={setCalificacion} />
      </div>
      <div>
        <label htmlFor={`comentario-${idReserva}`} className="etiqueta">Comentario (opcional)</label>
        <textarea id={`comentario-${idReserva}`} rows={3} className="campo" maxLength={500}
          value={comentario} onChange={(e) => setComentario(e.target.value)} />
      </div>
      <Alerta error={error} />
      <div className="flex gap-2">
        <button type="submit" className="btn-primario" disabled={enviando}>{enviando ? "Enviando..." : "Enviar valoración"}</button>
        <button type="button" className="btn-secundario" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}
