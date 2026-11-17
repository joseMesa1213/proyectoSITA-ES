import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { listarMisMaterias } from "../../api/materias.js";
import { crearTutoria } from "../../api/tutorias.js";
import { listarSolicitudesParaMi } from "../../api/solicitudesTutoria.js";
import Alerta from "../../components/Alerta.jsx";
import Cargando from "../../components/Cargando.jsx";
import FormularioTutoria from "../../components/FormularioTutoria.jsx";

// Crear tutoría: solo se ofrecen las materias asociadas al tutor (el backend responde 403 si no).
// ?solicitud=id (desde "Solicitudes de estudiantes"): materia y tema ya puestos, y al publicar la
// solicitud queda atendida y el estudiante recibe un aviso.
export default function NuevaTutoria() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const idSolicitud = Number(parametros.get("solicitud")) || null;
  const [materias, setMaterias] = useState(null);
  const [solicitud, setSolicitud] = useState(undefined); // undefined = cargando; null = no hay
  const [error, setError] = useState(null);

  useEffect(() => {
    listarMisMaterias().then(setMaterias).catch(setError);
    if (!idSolicitud) return setSolicitud(null);
    listarSolicitudesParaMi()
      .then((lista) => setSolicitud(lista.find((s) => s.id === idSolicitud) ?? null))
      .catch(() => setSolicitud(null));
  }, [idSolicitud]);

  if (!materias || solicitud === undefined) return error ? <Alerta error={error} /> : <Cargando />;

  const guardar = async (datos) => {
    const tutoria = await crearTutoria(solicitud ? { ...datos, id_solicitud: solicitud.id } : datos);
    const respuesta = solicitud
      ? tutoria.solicitud_atendida
        ? ` ${solicitud.estudiante.nombre} recibió un aviso con su tutoría.`
        : " La solicitud ya la había atendido otro tutor o la retiraron."
      : "";
    // Siguiente paso natural: agregar horarios
    navegar(`/tutor/tutorias/${tutoria.id}`, {
      state: { aviso: `Tutoría publicada.${respuesta} Ahora agregue sus horarios para que puedan reservarla.` },
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/tutor/tutorias" className="text-sm font-medium text-texto-suave hover:text-texto">← Mis tutorías</Link>
      <h1 className="titulo-pagina">Nueva tutoría</h1>

      {materias.length === 0 ? (
        <div className="tarjeta space-y-3">
          <Alerta>Para publicar una tutoría primero debe asociarse a la materia.</Alerta>
          <Link to="/tutor/materias" className="btn-primario">Ir a Mis materias</Link>
        </div>
      ) : (
        <div className="tarjeta space-y-4">
          {idSolicitud && !solicitud && (
            <Alerta>Esa solicitud ya no está abierta (otro tutor la atendió, la retiraron o venció). Puede publicar la tutoría igual.</Alerta>
          )}
          {solicitud && (
            <div className="rounded-control border border-acento/40 bg-acento/10 px-4 py-3 text-sm">
              <p className="font-medium">
                Respondiendo a {solicitud.estudiante.nombre} {solicitud.estudiante.apellido}: «{solicitud.tema}»
              </p>
              {solicitud.disponibilidad && <p className="mt-1 text-texto-suave">Disponibilidad: {solicitud.disponibilidad}</p>}
            </div>
          )}
          <FormularioTutoria materias={materias} onGuardar={guardar}
            inicial={solicitud ? { id_materia: solicitud.materia.id, titulo: solicitud.tema, descripcion: solicitud.descripcion ?? "" } : undefined} />
        </div>
      )}
    </div>
  );
}
