import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAvisoDeNavegacion } from "../components/Avisos.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { obtenerMiSolicitud, solicitarSerTutor } from "../api/solicitudes.js";
import Alerta from "../components/Alerta.jsx";
import Cargando from "../components/Cargando.jsx";
import { InsigniaEstado } from "../components/Insignias.jsx";
import { ESTADO, NOMBRE_ROL, ROL } from "../utils/constantes.js";
import { formatearMarcaDeTiempo } from "../utils/fechas.js";

// "Mi perfil": datos de la cuenta y, para estudiantes, la solicitud para ser tutor (pedirla y ver su estado).
const PUEDE = {
  [ROL.ESTUDIANTE]: "Buscar y reservar tutorías (estudiante)",
  [ROL.TUTOR]: "Reservar tutorías y ofrecer tutorías (estudiante y tutor)",
  [ROL.ADMINISTRADOR]: "Todo lo de un estudiante y un tutor, y además administrar la plataforma",
};

export default function Perfil() {
  const { usuario, refrescarPerfil } = useAuth();
  // Aviso que llega desde el registro ("su solicitud quedó en revisión")
  useAvisoDeNavegacion();

  // Al entrar se pide el perfil de nuevo: si un administrador aprobó la solicitud, aquí aparece como tutor
  useEffect(() => {
    refrescarPerfil().catch(() => {});
  }, [refrescarPerfil]);

  const fila = (etiqueta, valor) =>
    valor ? (
      <div className="grid gap-1 py-2 sm:grid-cols-[12rem_1fr]">
        <dt className="text-sm text-texto-suave">{etiqueta}</dt>
        <dd className="font-medium">{valor}</dd>
      </div>
    ) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="titulo-pagina">Mi perfil</h1>
        <p className="mt-1 text-texto-suave">Datos de su cuenta en SITA-ES.</p>
      </div>


      <section className="tarjeta">
        <dl className="divide-y divide-borde">
          {fila("Nombre", `${usuario.nombre} ${usuario.apellido}`)}
          {fila("Correo", usuario.correo)}
          {fila("Documento", usuario.tipoDocumento && `${usuario.tipoDocumento.nombre} ${usuario.num_documento}`)}
          {fila("Celular", usuario.celular)}
          {fila("Programa", usuario.estudiante?.nombre_programa)}
          {fila("Semestre", usuario.estudiante?.semestre)}
          {fila("Puede", PUEDE[usuario.id_rol] ?? NOMBRE_ROL[usuario.id_rol])}
        </dl>
      </section>

      {usuario.id_rol !== ROL.ADMINISTRADOR && (
        <SeccionTutor key={usuario.id_rol} esTutor={usuario.id_rol === ROL.TUTOR} onAprobada={() => refrescarPerfil().catch(() => {})} />
      )}
    </div>
  );
}

// Estado de la solicitud para ser tutor y formulario para pedirla (o volver a pedirla tras un rechazo)
function SeccionTutor({ esTutor, onAprobada }) {
  const [solicitud, setSolicitud] = useState(undefined); // undefined = cargando; null = nunca ha solicitado
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerMiSolicitud().then(setSolicitud).catch(setError);
  }, []);

  // Aprobada pero el perfil guardado aún dice estudiante: se actualiza para mostrar el menú de tutor
  const aprobada = solicitud?.id_estado === ESTADO.APROBADO;
  useEffect(() => {
    if (aprobada && !esTutor) onAprobada();
  }, [aprobada, esTutor, onAprobada]);

  return (
    <section className="tarjeta space-y-4">
      <h2 className="titulo-seccion">Ser tutor</h2>
      <Alerta error={error} />

      {esTutor ? (
        <>
          <p className="text-texto">
            Usted es <strong>estudiante y tutor</strong>: puede reservar tutorías y también ofrecerlas.
            {solicitud?.fecha_revision && ` Aprobado el ${formatearMarcaDeTiempo(solicitud.fecha_revision)}.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/tutor/materias" className="btn-secundario">Mis materias</Link>
            <Link to="/tutor/tutorias" className="btn-primario">Mis tutorías</Link>
          </div>
        </>
      ) : solicitud === undefined && !error ? (
        <Cargando texto="Consultando su solicitud..." />
      ) : solicitud?.id_estado === ESTADO.PENDIENTE ? (
        <div className="space-y-2">
          <p className="flex flex-wrap items-center gap-2">
            Su solicitud está <InsigniaEstado idEstado={solicitud.id_estado} nombre="en revisión" />
            <span className="text-sm text-texto-suave">desde el {formatearMarcaDeTiempo(solicitud.fecha_solicitud)}</span>
          </p>
          {solicitud.motivo && <p className="text-sm text-texto-suave">Lo que escribió: «{solicitud.motivo}»</p>}
          <p className="text-sm text-texto-suave">
            Un administrador la revisará. Mientras tanto puede buscar y reservar tutorías como siempre.
          </p>
        </div>
      ) : aprobada ? (
        <Cargando texto="Su solicitud fue aprobada. Actualizando su cuenta..." />
      ) : (
        <>
          {solicitud?.id_estado === ESTADO.RECHAZADO && (
            <Alerta>
              Su solicitud del {formatearMarcaDeTiempo(solicitud.fecha_solicitud)} fue rechazada: «{solicitud.observacion}».
              Puede enviar una nueva.
            </Alerta>
          )}
          <FormularioSolicitud onEnviada={setSolicitud} />
        </>
      )}
    </section>
  );
}

function FormularioSolicitud({ onEnviada }) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      onEnviada(await solicitarSerTutor(motivo.trim() || undefined));
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-3">
      <p className="text-texto">
        ¿Quiere ofrecer tutorías? Envíe una solicitud: un administrador la revisará. Seguirá siendo estudiante
        (podrá reservar) y, si la aprueban, además podrá publicar tutorías.
      </p>
      <div>
        <label htmlFor="motivo" className="etiqueta">¿Qué materias domina? (opcional)</label>
        <textarea id="motivo" rows={3} maxLength={500} className="campo" value={motivo} onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej.: me fue muy bien en Cálculo Diferencial y quiero ayudar a otros" />
      </div>
      <Alerta error={error} />
      <button type="submit" className="btn-primario" aria-busy={enviando} disabled={enviando}>
        {enviando ? "Enviando..." : "Solicitar ser tutor"}
      </button>
    </form>
  );
}
