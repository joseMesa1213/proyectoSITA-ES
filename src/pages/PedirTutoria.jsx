import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { listarMaterias } from "../api/materias.js";
import {
  crearSolicitudTutoria,
  listarMisSolicitudesTutoria,
  retirarSolicitudTutoria,
} from "../api/solicitudesTutoria.js";
import Alerta from "../components/Alerta.jsx";
import { useAvisos } from "../components/Avisos.jsx";
import { useConfirmar } from "../components/Confirmar.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import { EsqueletoLista } from "../components/Esqueletos.jsx";
import {
  ESTADO_SOLICITUD_TUTORIA as SOL,
  MAXIMO_SOLICITUDES_ABIERTAS,
  NOMBRE_ESTADO_SOLICITUD_TUTORIA,
} from "../utils/constantes.js";
import { formatearMarcaDeTiempo } from "../utils/fechas.js";

const VACIA = { id_materia: "", tema: "", descripcion: "", disponibilidad: "" };

const ESTILO_ESTADO = {
  [SOL.ABIERTA]: "bg-acento/20 text-texto",
  [SOL.ATENDIDA]: "bg-exito/10 text-exito",
  [SOL.RETIRADA]: "bg-texto/10 text-texto-suave",
  [SOL.VENCIDA]: "bg-texto/10 text-texto-suave",
};

/**
 * "Pedir una tutoría": quien no encuentra lo que necesita en el catálogo la pide; los tutores de esa
 * materia reciben un aviso y la atienden con una tutoría suya. Aquí se pide y se sigue cada solicitud.
 * ?id_materia=3 (desde el catálogo) deja la materia elegida.
 */
export default function PedirTutoria() {
  const avisos = useAvisos();
  const confirmar = useConfirmar();
  const [parametros] = useSearchParams();
  const [materias, setMaterias] = useState([]);
  const [solicitudes, setSolicitudes] = useState(null);
  const [formulario, setFormulario] = useState({ ...VACIA, id_materia: parametros.get("id_materia") ?? "" });
  const [error, setError] = useState(null);
  const [errorLista, setErrorLista] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    listarMaterias().then(setMaterias).catch(setError);
    listarMisSolicitudesTutoria().then(setSolicitudes).catch(setErrorLista);
  }, []);

  const abiertas = solicitudes?.filter((s) => s.id_estado === SOL.ABIERTA).length ?? 0;
  const alLimite = abiertas >= MAXIMO_SOLICITUDES_ABIERTAS;
  const cambiar = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });

  const enviar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const nueva = await crearSolicitudTutoria({
        id_materia: Number(formulario.id_materia),
        tema: formulario.tema.trim(),
        descripcion: formulario.descripcion.trim() || null,
        disponibilidad: formulario.disponibilidad.trim() || null,
      });
      setSolicitudes((lista) => [nueva, ...(lista ?? [])]);
      setFormulario(VACIA);
      avisos.exito("Solicitud publicada. Le avisaremos cuando un tutor la atienda.");
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  const retirar = async (solicitud) => {
    const confirmado = await confirmar({
      titulo: "Retirar solicitud",
      mensaje: `¿Retirar la solicitud «${solicitud.tema}»? Los tutores ya no la verán.`,
      textoConfirmar: "Sí, retirarla",
      textoCancelar: "No, mantenerla",
      peligro: true,
    });
    if (!confirmado) return;
    try {
      const actualizada = await retirarSolicitudTutoria(solicitud.id);
      setSolicitudes((lista) => lista.map((s) => (s.id === actualizada.id ? actualizada : s)));
      avisos.exito("Solicitud retirada.");
    } catch (err) {
      avisos.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="titulo-pagina">Pedir una tutoría</h1>
        <p className="mt-1 text-texto-suave">
          ¿No encuentra en el <Link to="/tutorias" className="underline decoration-acento underline-offset-2">catálogo</Link> lo
          que necesita? Cuéntelo aquí: los tutores de esa materia recibirán un aviso y podrán ofrecerle una tutoría.
        </p>
      </div>

      <section className="tarjeta space-y-4">
        <h2 className="titulo-seccion">Nueva solicitud</h2>
        <Alerta error={error} />
        {alLimite ? (
          <Alerta>
            Ya tiene {MAXIMO_SOLICITUDES_ABIERTAS} solicitudes abiertas. Espere a que las atiendan o retire una para pedir otra.
          </Alerta>
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            <div>
              <label htmlFor="id_materia" className="etiqueta">Materia</label>
              <select id="id_materia" name="id_materia" className="campo" required value={formulario.id_materia} onChange={cambiar}>
                <option value="">Seleccione...</option>
                {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="tema" className="etiqueta">Tema</label>
              <input id="tema" name="tema" className="campo" required maxLength={200}
                placeholder="Ej. Integrales por partes" value={formulario.tema} onChange={cambiar} />
            </div>
            <div>
              <label htmlFor="descripcion" className="etiqueta">¿Qué necesita? (opcional)</label>
              <textarea id="descripcion" name="descripcion" rows={3} className="campo" maxLength={2000}
                placeholder="Para qué la necesita, qué le cuesta, si tiene parcial pronto..." value={formulario.descripcion} onChange={cambiar} />
            </div>
            <div>
              <label htmlFor="disponibilidad" className="etiqueta">Disponibilidad (opcional)</label>
              <input id="disponibilidad" name="disponibilidad" className="campo" maxLength={300}
                placeholder="Ej. martes y jueves en la tarde, virtual" value={formulario.disponibilidad} onChange={cambiar} />
            </div>
            <button type="submit" className="btn-primario" aria-busy={enviando} disabled={enviando}>
              {enviando ? "Publicando..." : "Publicar solicitud"}
            </button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="titulo-seccion">Mis solicitudes</h2>
        <Alerta error={errorLista} />
        {!solicitudes ? (
          !errorLista && <EsqueletoLista cantidad={2} texto="Cargando sus solicitudes..." />
        ) : solicitudes.length === 0 ? (
          <EstadoVacio titulo="Aún no ha pedido ninguna tutoría">
            Las solicitudes que publique aparecerán aquí con su estado.
          </EstadoVacio>
        ) : (
          <ul className="space-y-3">
            {solicitudes.map((s) => (
              <li key={s.id} className="tarjeta space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-texto-suave uppercase">{s.materia.nombre}</p>
                    <p className="font-semibold">{s.tema}</p>
                    <p className="text-xs text-texto-suave">Publicada el {formatearMarcaDeTiempo(s.fecha)}</p>
                  </div>
                  <span className={`insignia ${ESTILO_ESTADO[s.id_estado] ?? "bg-texto/10"}`}>
                    {NOMBRE_ESTADO_SOLICITUD_TUTORIA[s.id_estado] ?? s.estado}
                  </span>
                </div>
                {s.disponibilidad && <p className="text-sm text-texto-suave">Disponibilidad: {s.disponibilidad}</p>}
                {s.id_estado === SOL.ATENDIDA && s.tutoria && (
                  <p className="rounded-control bg-exito/5 px-3 py-2 text-sm">
                    {s.tutor ? `${s.tutor.nombre} ${s.tutor.apellido}` : "Un tutor"} la atendió con{" "}
                    <Link to={`/tutorias/${s.tutoria.id}`} className="font-medium underline decoration-acento underline-offset-2">
                      «{s.tutoria.titulo}»
                    </Link>
                    . Reserve uno de sus horarios.
                  </p>
                )}
                {s.id_estado === SOL.VENCIDA && (
                  <p className="text-sm text-texto-suave">Pasaron 30 días sin respuesta. Puede publicarla de nuevo.</p>
                )}
                {s.id_estado === SOL.ABIERTA && (
                  <button type="button" className="btn-secundario px-3 py-1.5" onClick={() => retirar(s)}>Retirar</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
