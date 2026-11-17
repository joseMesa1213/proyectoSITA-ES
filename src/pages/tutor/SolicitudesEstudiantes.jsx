import { useEffect, useState } from "react";
import { Link } from "react-router";
import { atenderSolicitudTutoria, listarSolicitudesParaMi } from "../../api/solicitudesTutoria.js";
import { listarMisTutorias } from "../../api/tutorias.js";
import Alerta from "../../components/Alerta.jsx";
import { useAvisos } from "../../components/Avisos.jsx";
import EstadoVacio from "../../components/EstadoVacio.jsx";
import { EsqueletoLista } from "../../components/Esqueletos.jsx";
import { ESTADO } from "../../utils/constantes.js";
import { haceCuanto } from "../../utils/notificaciones.js";

/**
 * Tutor: solicitudes ABIERTAS de las materias que tiene asociadas (la que más lleva esperando, primero).
 * Se atienden de dos formas:
 * - "Publicar una tutoría nueva": abre Nueva tutoría con la materia y el tema ya puestos (?solicitud=id);
 * - "Ofrecer una de mis tutorías": elige una suya, activa y de esa materia.
 * En ambos casos quien la pidió recibe un aviso con el enlace a la tutoría.
 */
export default function SolicitudesEstudiantes() {
  const avisos = useAvisos();
  const [solicitudes, setSolicitudes] = useState(null);
  const [tutorias, setTutorias] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([listarSolicitudesParaMi(), listarMisTutorias()])
      .then(([solicitudes, tutorias]) => {
        setSolicitudes(solicitudes);
        setTutorias(tutorias.filter((t) => t.id_estado === ESTADO.ACTIVO));
      })
      .catch(setError);
  }, []);

  const atendida = (id, mensaje) => {
    setSolicitudes((lista) => lista.filter((s) => s.id !== id));
    avisos.exito(mensaje);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-pagina">Solicitudes de estudiantes</h1>
        <p className="mt-1 text-texto-suave">
          Tutorías que piden en las materias que usted dicta. Al atender una, el estudiante recibe un aviso.
        </p>
      </div>

      <Alerta error={error} />

      {!solicitudes ? (
        !error && <EsqueletoLista texto="Cargando solicitudes..." />
      ) : solicitudes.length === 0 ? (
        <EstadoVacio titulo="No hay solicitudes abiertas en sus materias"
          accion={<Link to="/tutor/materias" className="btn-secundario">Revisar mis materias</Link>}>
          Cuando alguien pida una tutoría de una materia que usted tiene asociada, aparecerá aquí y le llegará un aviso.
        </EstadoVacio>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {solicitudes.map((s) => (
            <TarjetaSolicitud key={s.id} solicitud={s}
              tutorias={tutorias.filter((t) => t.materia.id === s.materia.id)}
              onAtendida={atendida} onError={avisos.error} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TarjetaSolicitud({ solicitud: s, tutorias, onAtendida, onError }) {
  const [idTutoria, setIdTutoria] = useState(tutorias.length === 1 ? String(tutorias[0].id) : "");
  const [enviando, setEnviando] = useState(false);

  const ofrecer = async () => {
    setEnviando(true);
    try {
      const tutoria = tutorias.find((t) => String(t.id) === idTutoria);
      await atenderSolicitudTutoria(s.id, Number(idTutoria));
      onAtendida(s.id, `Le ofreció «${tutoria.titulo}» a ${s.estudiante.nombre}. Ya recibió el aviso.`);
    } catch (err) {
      onError(err);
      setEnviando(false);
    }
  };

  return (
    <li className="tarjeta flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold tracking-wide text-texto-suave uppercase">{s.materia.nombre}</p>
        <h2 className="titulo-seccion">{s.tema}</h2>
        <p className="text-sm text-texto-suave">
          {s.estudiante.nombre} {s.estudiante.apellido} · {haceCuanto(s.fecha)}
        </p>
      </div>
      {s.descripcion && <p className="text-sm whitespace-pre-line">{s.descripcion}</p>}
      {s.disponibilidad && (
        <p className="rounded-control bg-superficie-hundida px-3 py-2 text-sm">
          <span className="text-texto-suave">Disponibilidad: </span>{s.disponibilidad}
        </p>
      )}

      <div className="mt-auto space-y-3 border-t border-borde pt-3">
        <Link to={`/tutor/tutorias/nueva?solicitud=${s.id}`} className="btn-primario w-full sm:w-auto">
          Publicar una tutoría nueva
        </Link>
        {tutorias.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor={`ofrecer-${s.id}`} className="etiqueta">O ofrezca una de sus tutorías</label>
              <select id={`ofrecer-${s.id}`} className="campo" value={idTutoria} onChange={(e) => setIdTutoria(e.target.value)}>
                <option value="">Seleccione...</option>
                {tutorias.map((t) => <option key={t.id} value={t.id}>{t.titulo}</option>)}
              </select>
            </div>
            <button type="button" className="btn-secundario" disabled={!idTutoria || enviando} aria-busy={enviando} onClick={ofrecer}>
              {enviando ? "Enviando..." : "Ofrecer"}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
