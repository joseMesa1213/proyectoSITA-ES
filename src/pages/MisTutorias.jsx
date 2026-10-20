import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { listarMisTutorias } from "../api/tutorias.js";
import Alerta from "../components/Alerta.jsx";
import Cargando from "../components/Cargando.jsx";
import { InsigniaModalidad, InsigniaNivel } from "../components/Insignias.jsx";
import { ESTADO } from "../utils/constantes.js";

// Tutor: sus tutorías publicadas (activas e inactivas)
export default function MisTutorias() {
  const ubicacion = useLocation();
  const [tutorias, setTutorias] = useState(null);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(ubicacion.state?.aviso ?? "");

  useEffect(() => {
    listarMisTutorias().then(setTutorias).catch(setError);
  }, []);

  if (error) return <Alerta error={error} />;
  if (!tutorias) return <Cargando />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mis tutorías</h1>
          <p className="mt-1 text-bosque/70">Las tutorías activas con horarios aparecen en el catálogo.</p>
        </div>
        <Link to="/tutor/tutorias/nueva" className="btn-primario">+ Nueva tutoría</Link>
      </div>

      {aviso && <Alerta tipo="exito" onCerrar={() => setAviso("")}>{aviso}</Alerta>}

      {tutorias.length === 0 ? (
        <div className="tarjeta py-12 text-center text-bosque/70">
          <p>Aún no ha publicado tutorías.</p>
          <p className="mt-1 text-sm">
            Primero asocie sus <Link to="/tutor/materias" className="underline decoration-acento underline-offset-2">materias</Link> y luego cree la tutoría.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {tutorias.map((t) => (
            <TarjetaMiTutoria key={t.id} tutoria={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TarjetaMiTutoria({ tutoria }) {
  const { id, titulo, materia, nivel, modalidad, cupo, horarios, id_estado } = tutoria;
  const activa = id_estado === ESTADO.ACTIVO;
  const horariosActivos = horarios.filter((h) => h.id_estado === ESTADO.ACTIVO);

  // Avisa por qué la tutoría no se ve en el catálogo
  const advertencia = !activa
    ? "Oculta: no aparece en el catálogo."
    : horariosActivos.length === 0
      ? "Sin horarios activos: nadie puede reservarla."
      : null;

  return (
    <li className={`tarjeta flex flex-col gap-3 ${activa ? "" : "opacity-70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-bosque/60 uppercase">
            {materia.nombre} · {materia.codigo}
          </p>
          <h2 className="mt-1 text-lg leading-snug font-semibold">{titulo}</h2>
        </div>
        <span className={`insignia ${activa ? "bg-exito/10 text-exito" : "bg-bosque/10 text-bosque"}`}>
          {activa ? "Activa" : "Inactiva"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <InsigniaNivel nivel={nivel} />
        <InsigniaModalidad modalidad={modalidad} />
        <span className="insignia bg-bosque/5 text-bosque">{cupo} {cupo === 1 ? "cupo" : "cupos"}</span>
      </div>

      <ul className="space-y-1 border-t border-bosque/10 pt-3 text-sm">
        {horariosActivos.map((h) => (
          <li key={h.id} className="flex justify-between">
            <span className="font-medium">{h.dia}</span>
            <span className="text-bosque/70">{h.hora_inicio} – {h.hora_fin}</span>
          </li>
        ))}
      </ul>

      {advertencia && <p className="text-sm text-peligro">{advertencia}</p>}

      <Link to={`/tutor/tutorias/${id}`} className="btn-secundario mt-auto self-start">
        Editar y gestionar horarios
      </Link>
    </li>
  );
}
