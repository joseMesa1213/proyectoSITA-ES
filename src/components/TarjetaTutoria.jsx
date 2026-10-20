import { Link } from "react-router";
import { InsigniaModalidad, InsigniaNivel } from "./Insignias.jsx";

// Tarjeta del catálogo: tutor, materia, nivel, modalidad, cupo y horarios semanales
export default function TarjetaTutoria({ tutoria }) {
  const { id, titulo, materia, tutor, nivel, modalidad, cupo, horarios } = tutoria;

  return (
    <Link to={`/tutorias/${id}`}
      className="tarjeta group flex flex-col gap-3 transition-shadow hover:border-acento/50 hover:shadow-md">
      <div>
        <p className="text-xs font-semibold tracking-wide text-bosque/60 uppercase">
          {materia.nombre} · {materia.codigo}
        </p>
        <h2 className="mt-1 text-lg leading-snug font-semibold group-hover:underline group-hover:decoration-acento group-hover:underline-offset-4">
          {titulo}
        </h2>
        <p className="mt-1 text-sm text-bosque/70">
          con {tutor.nombre} {tutor.apellido}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <InsigniaNivel nivel={nivel} />
        <InsigniaModalidad modalidad={modalidad} />
        <span className="insignia bg-bosque/5 text-bosque">
          {cupo} {cupo === 1 ? "cupo" : "cupos"} por sesión
        </span>
      </div>

      <ul className="mt-auto space-y-1 border-t border-bosque/10 pt-3 text-sm">
        {horarios.length === 0 && <li className="text-bosque/50">Sin horarios publicados</li>}
        {horarios.map((h) => (
          <li key={h.id} className="flex justify-between">
            <span className="font-medium">{h.dia}</span>
            <span className="text-bosque/70">{h.hora_inicio} – {h.hora_fin}</span>
          </li>
        ))}
      </ul>
    </Link>
  );
}
