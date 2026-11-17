import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listarMisTutorias } from "../../api/tutorias.js";
import { listarMisMaterias } from "../../api/materias.js";
import { listarReservasRecibidas } from "../../api/reservas.js";
import { listarSolicitudesParaMi } from "../../api/solicitudesTutoria.js";
import Alerta from "../../components/Alerta.jsx";
import { useAvisos } from "../../components/Avisos.jsx";
import { EsqueletoTarjetas } from "../../components/Esqueletos.jsx";
import BotonEstadoTutoria from "../../components/BotonEstadoTutoria.jsx";
import { InsigniaEstado, InsigniaModalidad, InsigniaNivel } from "../../components/Insignias.jsx";
import { ESTADO } from "../../utils/constantes.js";
import { contarReservas, reservasActivasFuturas } from "../../utils/reservas.js";

// Tutorías del tutor (activas e inactivas), con acceso a editar, horarios e inactivar/reactivar
export default function MisTutorias() {
  const avisos = useAvisos();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [solicitudesAbiertas, setSolicitudesAbiertas] = useState(0);

  useEffect(() => {
    // Solicitudes de estudiantes en sus materias: solo para el contador del botón (si falla, no estorba)
    listarSolicitudesParaMi().then((lista) => setSolicitudesAbiertas(lista.length)).catch(() => {});
    // Las reservas se piden para contar cuántas reservas próximas tiene cada tutoría
    Promise.all([listarMisTutorias(), listarMisMaterias(), listarReservasRecibidas()])
      .then(([tutorias, materias, reservas]) => setDatos({ tutorias, materias, reservas }))
      .catch(setError);
  }, []);

  // Mientras carga se muestra el título y la forma de las tarjetas
  if (!datos) {
    return (
      <div className="space-y-6">
        <Encabezado />
        {error ? <Alerta error={error} /> : <EsqueletoTarjetas cantidad={4} className="grid gap-4 md:grid-cols-2" texto="Cargando sus tutorías..." />}
      </div>
    );
  }

  const { tutorias, materias, reservas } = datos;
  // Activas primero; dentro de cada grupo se respeta el orden del backend (más recientes primero)
  const ordenadas = [...tutorias].sort((a, b) => (a.id_estado === ESTADO.ACTIVO ? 0 : 1) - (b.id_estado === ESTADO.ACTIVO ? 0 : 1));

  const reemplazar = async ({ reservas_canceladas, ...actualizada }) => {
    // Inactivar cancela reservas en el backend: se vuelven a pedir para el conteo de próximas
    const nuevasReservas = reservas_canceladas > 0 ? await listarReservasRecibidas().catch(() => reservas) : reservas;
    setDatos({ ...datos, reservas: nuevasReservas, tutorias: tutorias.map((t) => (t.id === actualizada.id ? actualizada : t)) });
  };

  return (
    <div className="space-y-6">
      <Encabezado puedePublicar={materias.length > 0} solicitudes={solicitudesAbiertas} />

      <Alerta error={error} />

      <PrimerosPasos
        tieneMaterias={materias.length > 0}
        tieneTutorias={tutorias.length > 0}
        tieneHorarios={tutorias.some((t) => t.horarios.some((h) => h.id_estado === ESTADO.ACTIVO))}
      />

      {tutorias.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {ordenadas.map((t) => {
            const activa = t.id_estado === ESTADO.ACTIVO;
            const horariosActivos = t.horarios.filter((h) => h.id_estado === ESTADO.ACTIVO);
            const proximas = reservasActivasFuturas(reservas, (r) => r.tutoria.id === t.id).length;
            return (
              <li key={t.id} className={`tarjeta flex flex-col gap-3 ${activa ? "" : "bg-superficie/60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-texto-suave uppercase">{t.materia.nombre}</p>
                    <h2 className="titulo-seccion">{t.titulo}</h2>
                  </div>
                  <InsigniaEstado idEstado={t.id_estado} nombre={activa ? "Activa" : "Inactiva"} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <InsigniaNivel nivel={t.nivel} />
                  <InsigniaModalidad modalidad={t.modalidad} />
                  <span className="insignia bg-texto/5 text-texto">Cupo {t.cupo}</span>
                </div>
                <p className="text-sm text-texto-suave">
                  {horariosActivos.length === 0
                    ? "Sin horarios activos: nadie puede reservarla todavía."
                    : horariosActivos.map((h) => `${h.dia} ${h.hora_inicio}–${h.hora_fin}`).join(" · ")}
                </p>
                <p className="text-sm font-medium">{contarReservas(proximas)} {proximas === 1 ? "próxima" : "próximas"}</p>
                <div className="mt-auto flex flex-wrap gap-2 border-t border-borde pt-3">
                  <Link to={`/tutor/tutorias/${t.id}`} className="btn-primario">Editar y horarios</Link>
                  <BotonEstadoTutoria tutoria={t} reservasFuturas={proximas} onCambiada={(actualizada) => {
                    reemplazar(actualizada);
                    avisos.exito(`Tutoría «${actualizada.titulo}» ${actualizada.id_estado === ESTADO.ACTIVO ? "reactivada" : "inactivada"}.`);
                  }} onError={avisos.error} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Guía para el tutor nuevo: el orden en que el backend exige hacer las cosas
function PrimerosPasos({ tieneMaterias, tieneTutorias, tieneHorarios }) {
  if (tieneMaterias && tieneTutorias && tieneHorarios) return null;
  const pasos = [
    { hecho: tieneMaterias, texto: "Asóciese a las materias que domina", a: "/tutor/materias" },
    { hecho: tieneTutorias, texto: "Publique una tutoría de una de esas materias", a: "/tutor/tutorias/nueva" },
    { hecho: tieneHorarios, texto: "Agregue horarios semanales para que puedan reservarla" },
  ];
  // El primer paso pendiente es el único que se muestra como enlace
  const siguiente = pasos.findIndex((p) => !p.hecho);

  return (
    <section className="tarjeta border-acento/50">
      <h2 className="font-semibold">Primeros pasos</h2>
      <ol className="mt-3 space-y-2 text-sm">
        {pasos.map((p, i) => (
          <li key={p.texto} className="flex items-center gap-3">
            <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              p.hecho ? "bg-exito text-primario-texto" : i === siguiente ? "bg-acento text-sobre-acento" : "bg-texto/10"
            }`}>
              {p.hecho ? "✓" : i + 1}
            </span>
            {i === siguiente && p.a ? (
              <Link to={p.a} className="font-medium underline decoration-acento underline-offset-4">{p.texto}</Link>
            ) : (
              <span className={p.hecho ? "text-texto-suave line-through" : ""}>{p.texto}</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Encabezado({ puedePublicar = false, solicitudes = 0 }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="titulo-pagina">Mis tutorías</h1>
        <p className="mt-1 text-texto-suave">Publique tutorías y administre sus horarios.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Las solicitudes de estudiantes se llegan desde aquí y desde la campanita (no caben en el menú) */}
        <Link to="/tutor/solicitudes" className="btn-secundario">
          Solicitudes de estudiantes
          {solicitudes > 0 && (
            <span className="ml-2 rounded-full bg-acento px-2 py-0.5 text-xs font-bold text-sobre-acento">
              {solicitudes}<span className="sr-only"> abiertas</span>
            </span>
          )}
        </Link>
        {puedePublicar && <Link to="/tutor/tutorias/nueva" className="btn-primario">+ Nueva tutoría</Link>}
      </div>
    </div>
  );
}
