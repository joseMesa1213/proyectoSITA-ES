import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { obtenerTutoria } from "../api/tutorias.js";
import { listarRecursos } from "../api/recursos.js";
import { crearReserva } from "../api/reservas.js";
import { useAuth } from "../context/AuthContext.jsx";
import Alerta from "../components/Alerta.jsx";
import Cargando from "../components/Cargando.jsx";
import { ESTADO, RECURSO_POR_MODALIDAD } from "../utils/constantes.js";
import { esHoy, formatearFecha, formatearFechaCorta, proximasFechas } from "../utils/fechas.js";

/**
 * Reserva en 3 pasos + confirmación:
 *   1. Horario semanal (ej. Lunes 10:00–12:00)
 *   2. Una de las próximas fechas que caen ese día (no un calendario libre)
 *   3. Recurso compatible con la modalidad (Presencial → Físico, Virtual → Virtual, Híbrida → cualquiera)
 * El backend vuelve a validar todo (cupo, duplicado, capacidad) y si algo falla muestra su mensaje.
 */
export default function Reservar() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navegar = useNavigate();

  const [tutoria, setTutoria] = useState(null);
  const [recursos, setRecursos] = useState([]);
  const [errorCarga, setErrorCarga] = useState(null);

  const [idHorario, setIdHorario] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [idRecurso, setIdRecurso] = useState(null);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // Primero la tutoría, porque su modalidad define qué tipo de recurso se pide
    obtenerTutoria(id)
      .then(async (tutoria) => {
        setTutoria(tutoria);
        setRecursos(await listarRecursos(RECURSO_POR_MODALIDAD[tutoria.modalidad]));
      })
      .catch(setErrorCarga);
  }, [id]);

  if (errorCarga) return <ConVolver id={id}><Alerta error={errorCarga} /></ConVolver>;
  if (!tutoria) return <Cargando />;

  // Las mismas protecciones del detalle, por si se entra escribiendo la URL
  if (tutoria.id_estado !== ESTADO.ACTIVO) return <ConVolver id={id}><Alerta>Esta tutoría no está disponible.</Alerta></ConVolver>;
  if (tutoria.id_tutor === usuario.id) return <ConVolver id={id}><Alerta>No puede reservar su propia tutoría.</Alerta></ConVolver>;
  if (tutoria.horarios.length === 0) return <ConVolver id={id}><Alerta>Esta tutoría no tiene horarios disponibles.</Alerta></ConVolver>;

  const horario = tutoria.horarios.find((h) => h.id === idHorario);
  const recurso = recursos.find((r) => r.id === idRecurso);
  const fechas = horario ? proximasFechas(horario.dia, horario.hora_inicio) : [];
  const tipoRequerido = RECURSO_POR_MODALIDAD[tutoria.modalidad];

  const elegirHorario = (idNuevo) => {
    setIdHorario(idNuevo);
    setFecha(null); // las fechas dependen del día del horario
    setError(null);
  };

  const confirmar = async () => {
    setError(null);
    setEnviando(true);
    try {
      await crearReserva({ id_horario: idHorario, id_recurso: idRecurso, fecha_sesion: fecha });
      navegar("/mis-reservas", {
        state: { aviso: `Reserva confirmada: ${tutoria.titulo}, ${formatearFecha(fecha)} a las ${horario.hora_inicio}.` },
      });
    } catch (err) {
      // Ej. 409 "No quedan cupos para esta sesión" o "Ya tiene una reserva activa para esta sesión"
      setError(err);
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={`/tutorias/${id}`} className="text-sm font-medium text-bosque/70 hover:text-bosque">← Volver al detalle</Link>
      <div>
        <p className="text-sm text-bosque/60">{tutoria.materia.nombre} · {tutoria.modalidad}</p>
        <h1 className="text-2xl font-bold">Reservar: {tutoria.titulo}</h1>
      </div>

      <Paso numero={1} titulo="Elija un horario">
        <div className="grid gap-2 sm:grid-cols-2">
          {tutoria.horarios.map((h) => (
            <Opcion key={h.id} activa={h.id === idHorario} onClick={() => elegirHorario(h.id)}>
              <span className="font-semibold">{h.dia}</span>
              <span className="text-sm">{h.hora_inicio} – {h.hora_fin}</span>
            </Opcion>
          ))}
        </div>
      </Paso>

      <Paso numero={2} titulo="Elija la fecha de la sesión" bloqueado={!horario} ayuda="Primero elija un horario.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {fechas.map((f) => (
            <Opcion key={f} activa={f === fecha} onClick={() => setFecha(f)}>
              <span className="font-semibold">{formatearFechaCorta(f)}</span>
              {esHoy(f) && <span className="text-xs">Hoy</span>}
            </Opcion>
          ))}
        </div>
      </Paso>

      <Paso numero={3} titulo={tipoRequerido ? `Elija el recurso (${tipoRequerido})` : "Elija el recurso (salón o enlace)"}
        bloqueado={!fecha} ayuda="Primero elija la fecha.">
        {recursos.length === 0 ? (
          <Alerta>No hay recursos disponibles para esta modalidad. Contacte al administrador.</Alerta>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {recursos.map((r) => (
              <Opcion key={r.id} activa={r.id === idRecurso} onClick={() => setIdRecurso(r.id)}>
                <span className="font-semibold">{r.nombre}</span>
                <span className="text-xs">{r.tipo} · capacidad {r.capacidad}</span>
                <span className="truncate text-xs opacity-80">{r.ubicacion}</span>
              </Opcion>
            ))}
          </div>
        )}
      </Paso>

      {horario && fecha && recurso && (
        <section className="tarjeta space-y-4 border-acento/50 p-6">
          <h2 className="font-semibold">Confirme su reserva</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6">
            <dt className="text-bosque/60">Tutoría</dt>
            <dd className="font-medium">{tutoria.titulo} — {tutoria.tutor.nombre} {tutoria.tutor.apellido}</dd>
            <dt className="text-bosque/60">Fecha</dt>
            <dd className="font-medium">{formatearFecha(fecha)}</dd>
            <dt className="text-bosque/60">Hora</dt>
            <dd className="font-medium">{horario.hora_inicio} – {horario.hora_fin}</dd>
            <dt className="text-bosque/60">Recurso</dt>
            <dd className="font-medium">{recurso.nombre} ({recurso.ubicacion})</dd>
          </dl>
          <Alerta error={error} />
          <button type="button" className="btn-primario w-full sm:w-auto" onClick={confirmar} disabled={enviando}>
            {enviando ? "Reservando..." : "Confirmar reserva"}
          </button>
        </section>
      )}
    </div>
  );
}

function Paso({ numero, titulo, bloqueado = false, ayuda, children }) {
  return (
    <section className={`tarjeta space-y-3 ${bloqueado ? "opacity-60" : ""}`}>
      <h2 className="flex items-center gap-3 font-semibold">
        <span className="flex size-7 items-center justify-center rounded-full bg-bosque text-sm text-white">{numero}</span>
        {titulo}
      </h2>
      {bloqueado ? <p className="text-sm text-bosque/60">{ayuda}</p> : children}
    </section>
  );
}

// Botón seleccionable (horario, fecha o recurso)
function Opcion({ activa, onClick, children }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activa}
      className={`flex min-w-0 flex-col items-start gap-0.5 rounded-lg border px-4 py-3 text-left transition-colors ${
        activa ? "border-bosque bg-bosque text-white" : "border-bosque/15 bg-white hover:border-acento"
      }`}>
      {children}
    </button>
  );
}

function ConVolver({ id, children }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {children}
      <Link to={`/tutorias/${id}`} className="btn-secundario">← Volver al detalle</Link>
    </div>
  );
}
