import { useEffect, useState } from "react";
import { aprobarSolicitud, listarSolicitudes, rechazarSolicitud } from "../api/solicitudes.js";
import Alerta from "../components/Alerta.jsx";
import Cargando from "../components/Cargando.jsx";
import { InsigniaEstado } from "../components/Insignias.jsx";
import { formatearMarcaDeTiempo } from "../utils/fechas.js";

const PESTANAS = [
  { id: "pendientes", texto: "Pendientes" },
  { id: "historial", texto: "Historial" },
];

const nombreDe = (u) => `${u.nombre} ${u.apellido}`;

// Administrador: revisa las solicitudes para ser tutor. Aprobar convierte al estudiante en tutor
// (puede publicar tutorías desde su siguiente acción, sin volver a iniciar sesión).
export default function AdminSolicitudes() {
  const [pestana, setPestana] = useState("pendientes");
  const [solicitudes, setSolicitudes] = useState(null);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    let vigente = true;
    setSolicitudes(null);
    setError(null);
    listarSolicitudes(pestana)
      .then((datos) => vigente && setSolicitudes(datos))
      .catch((err) => vigente && setError(err));
    return () => {
      vigente = false;
    };
  }, [pestana]);

  // La solicitud revisada sale de "Pendientes" (queda en el historial)
  const alRevisar = (revisada) => {
    setSolicitudes((lista) => lista.filter((s) => s.id !== revisada.id));
    const persona = nombreDe(revisada.usuario);
    setAviso(revisada.estado === "Aprobado"
      ? `${persona} ahora es tutor: ya puede asociarse a materias y publicar tutorías.`
      : `Se rechazó la solicitud de ${persona}. Verá el motivo en su perfil y podrá volver a solicitar.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-pagina">Solicitudes de tutor</h1>
        <p className="mt-1 text-texto-suave">Estudiantes que pidieron ofrecer tutorías. Al aprobar, siguen siendo estudiantes y además pueden ser tutores.</p>
      </div>

      {aviso && <Alerta tipo="exito" onCerrar={() => setAviso("")}>{aviso}</Alerta>}

      <div className="flex flex-wrap gap-2" role="tablist">
        {PESTANAS.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={pestana === p.id}
            onClick={() => { setPestana(p.id); setAviso(""); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              pestana === p.id ? "bg-primario text-primario-texto" : "bg-superficie text-texto hover:bg-texto/5"
            }`}>
            {p.texto}{pestana === p.id && solicitudes ? ` (${solicitudes.length})` : ""}
          </button>
        ))}
      </div>

      <Alerta error={error} />

      {!solicitudes ? (
        !error && <Cargando />
      ) : solicitudes.length === 0 ? (
        <div className="tarjeta py-12 text-center text-texto-suave">
          {pestana === "pendientes" ? "No hay solicitudes pendientes." : "Todavía no se ha revisado ninguna solicitud."}
        </div>
      ) : (
        <ul className="space-y-4">
          {solicitudes.map((s) => (
            <TarjetaSolicitud key={s.id} solicitud={s} onRevisada={alRevisar} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TarjetaSolicitud({ solicitud, onRevisada }) {
  const { usuario } = solicitud;
  const pendiente = solicitud.estado === "Pendiente";
  const [rechazando, setRechazando] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const ejecutar = async (accion) => {
    setError(null);
    setProcesando(true);
    try {
      onRevisada(await accion());
    } catch (err) {
      setError(err);
      setProcesando(false);
    }
  };

  const aprobar = () => {
    if (window.confirm(`¿Aprobar a ${nombreDe(usuario)} como tutor?`)) ejecutar(() => aprobarSolicitud(solicitud.id));
  };

  const rechazar = (evento) => {
    evento.preventDefault();
    ejecutar(() => rechazarSolicitud(solicitud.id, observacion.trim()));
  };

  return (
    <li className="tarjeta space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold">{nombreDe(usuario)}</p>
          <p className="truncate text-sm text-texto-suave">
            <a href={`mailto:${usuario.correo}`} className="underline decoration-borde-fuerte underline-offset-2">{usuario.correo}</a>
            {usuario.estudiante && ` · ${usuario.estudiante.nombre_programa}, semestre ${usuario.estudiante.semestre}`}
          </p>
        </div>
        <InsigniaEstado idEstado={solicitud.id_estado} nombre={solicitud.estado} />
      </div>

      <div className="rounded-control bg-superficie-hundida px-4 py-3 text-sm">
        <p className="text-texto-suave">Solicitada el {formatearMarcaDeTiempo(solicitud.fecha_solicitud)}</p>
        <p className="mt-1">{solicitud.motivo ? `«${solicitud.motivo}»` : <span className="text-texto-suave">Sin motivo escrito.</span>}</p>
      </div>

      {!pendiente && (
        <p className="text-sm text-texto-suave">
          {solicitud.revisor ? `Revisada por ${nombreDe(solicitud.revisor)}` : "Revisada"}
          {solicitud.fecha_revision && ` el ${formatearMarcaDeTiempo(solicitud.fecha_revision)}`}
          {solicitud.observacion && `: «${solicitud.observacion}»`}
        </p>
      )}

      <Alerta error={error} />

      {pendiente && !rechazando && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primario" onClick={aprobar} disabled={procesando}>Aprobar como tutor</button>
          <button type="button" className="btn-peligro" onClick={() => setRechazando(true)} disabled={procesando}>Rechazar</button>
        </div>
      )}

      {pendiente && rechazando && (
        <form onSubmit={rechazar} className="space-y-3 rounded-control border border-peligro/30 p-4">
          <div>
            <label htmlFor={`observacion-${solicitud.id}`} className="etiqueta">Motivo del rechazo (lo verá el estudiante)</label>
            <textarea id={`observacion-${solicitud.id}`} rows={2} maxLength={500} required className="campo"
              value={observacion} onChange={(e) => setObservacion(e.target.value)}
              placeholder="Ej.: indique qué materias domina y vuelva a enviar la solicitud" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-peligro" disabled={procesando || !observacion.trim()}>Confirmar rechazo</button>
            <button type="button" className="btn-secundario" onClick={() => setRechazando(false)}>Cancelar</button>
          </div>
        </form>
      )}
    </li>
  );
}
