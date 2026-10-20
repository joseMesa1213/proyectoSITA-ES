import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { obtenerTutoria } from "../api/tutorias.js";
import { listarValoraciones } from "../api/valoraciones.js";
import { useAuth } from "../context/AuthContext.jsx";
import Alerta from "../components/Alerta.jsx";
import Cargando from "../components/Cargando.jsx";
import Estrellas from "../components/Estrellas.jsx";
import { InsigniaModalidad, InsigniaNivel } from "../components/Insignias.jsx";
import { ESTADO, ROLES_QUE_RESERVAN } from "../utils/constantes.js";
import { formatearMarcaDeTiempo } from "../utils/fechas.js";

export default function DetalleTutoria() {
  const { id } = useParams();
  const [tutoria, setTutoria] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // La tutoría y sus valoraciones se piden en paralelo
    Promise.all([obtenerTutoria(id), listarValoraciones(id)])
      .then(([tutoria, resumen]) => {
        setTutoria(tutoria);
        setResumen(resumen);
      })
      .catch(setError);
  }, [id]);

  if (error) {
    return (
      <div className="space-y-4">
        <Alerta error={error} />
        <Link to="/tutorias" className="btn-secundario">← Volver al catálogo</Link>
      </div>
    );
  }
  if (!tutoria) return <Cargando />;

  const { titulo, descripcion, materia, tutor, nivel, modalidad, cupo, horarios } = tutoria;

  return (
    <div className="space-y-6">
      <Link to="/tutorias" className="text-sm font-medium text-bosque/70 hover:text-bosque">← Volver al catálogo</Link>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Información principal */}
        <section className="tarjeta space-y-4 p-6">
          <div>
            <p className="text-xs font-semibold tracking-wide text-bosque/60 uppercase">{materia.nombre} · {materia.codigo}</p>
            <h1 className="mt-1 text-3xl font-bold">{titulo}</h1>
            <p className="mt-1 text-bosque/70">Tutor: {tutor.nombre} {tutor.apellido}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <InsigniaNivel nivel={nivel} />
            <InsigniaModalidad modalidad={modalidad} />
            <span className="insignia bg-bosque/5 text-bosque">{cupo} {cupo === 1 ? "cupo" : "cupos"} por sesión</span>
          </div>
          {descripcion && <p className="whitespace-pre-line text-bosque/80">{descripcion}</p>}

          <div>
            <h2 className="mb-2 font-semibold">Horarios semanales</h2>
            {horarios.length === 0 ? (
              <p className="text-sm text-bosque/60">Esta tutoría aún no tiene horarios publicados.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {horarios.map((h) => (
                  <li key={h.id} className="flex justify-between rounded-lg bg-crema px-4 py-2 text-sm">
                    <span className="font-medium">{h.dia}</span>
                    <span>{h.hora_inicio} – {h.hora_fin}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Reservar */}
        <aside className="tarjeta h-fit space-y-3 p-6">
          <h2 className="font-semibold">Reservar un cupo</h2>
          <AccionReservar tutoria={tutoria} />
        </aside>
      </div>

      <Valoraciones resumen={resumen} />
    </div>
  );
}

// Decide qué mostrar en lugar del botón cuando el usuario no puede reservar
function AccionReservar({ tutoria }) {
  const { usuario } = useAuth();

  if (tutoria.id_estado !== ESTADO.ACTIVO) {
    return <Aviso>No disponible: el tutor desactivó esta tutoría.</Aviso>;
  }
  if (tutoria.horarios.length === 0) {
    return <Aviso>No hay horarios disponibles para reservar.</Aviso>;
  }
  if (!usuario) {
    return (
      <>
        <p className="text-sm text-bosque/70">Inicie sesión para reservar.</p>
        <Link to="/login" state={{ desde: `/tutorias/${tutoria.id}/reservar` }} className="btn-primario w-full">
          Iniciar sesión para reservar
        </Link>
      </>
    );
  }
  if (!ROLES_QUE_RESERVAN.includes(usuario.id_rol)) {
    return <Aviso>Los administradores no realizan reservas.</Aviso>;
  }
  if (tutoria.id_tutor === usuario.id) {
    return <Aviso>Esta es una de sus tutorías: no puede reservarla.</Aviso>;
  }
  return (
    <>
      <p className="text-sm text-bosque/70">Elija un horario, la fecha de la sesión y el lugar o enlace.</p>
      <Link to={`/tutorias/${tutoria.id}/reservar`} className="btn-primario w-full">Reservar</Link>
    </>
  );
}

function Aviso({ children }) {
  return <p className="rounded-lg bg-crema px-4 py-3 text-sm text-bosque/80">{children}</p>;
}

function Valoraciones({ resumen }) {
  const { promedio, total, valoraciones } = resumen;
  return (
    <section className="tarjeta space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Valoraciones</h2>
        {promedio !== null && (
          <span className="flex items-center gap-2">
            <Estrellas valor={promedio} />
            <span className="font-semibold">{promedio.toFixed(1)}</span>
            <span className="text-sm text-bosque/60">({total} {total === 1 ? "valoración" : "valoraciones"})</span>
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-sm text-bosque/60">Esta tutoría todavía no tiene valoraciones.</p>
      ) : (
        <ul className="divide-y divide-bosque/10">
          {valoraciones.map((v) => (
            <li key={v.id} className="py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Estrellas valor={v.calificacion} tamano="text-base" />
                <span className="font-medium">{v.evaluador.nombre}</span>
                {v.fecha && <span className="text-bosque/50">· {formatearMarcaDeTiempo(v.fecha)}</span>}
              </div>
              {v.comentario && <p className="mt-1 text-bosque/80">{v.comentario}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
