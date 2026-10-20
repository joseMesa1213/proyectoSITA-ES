import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { listarMisMaterias } from "../../api/materias.js";
import { crearTutoria } from "../../api/tutorias.js";
import Alerta from "../../components/Alerta.jsx";
import Cargando from "../../components/Cargando.jsx";
import FormularioTutoria from "../../components/FormularioTutoria.jsx";

// Crear tutoría: solo se ofrecen las materias asociadas al tutor (el backend responde 403 si no)
export default function NuevaTutoria() {
  const navegar = useNavigate();
  const [materias, setMaterias] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    listarMisMaterias().then(setMaterias).catch(setError);
  }, []);

  if (!materias) return error ? <Alerta error={error} /> : <Cargando />;

  const guardar = async (datos) => {
    const tutoria = await crearTutoria(datos);
    // Siguiente paso natural: agregar horarios
    navegar(`/tutor/tutorias/${tutoria.id}`, {
      state: { aviso: "Tutoría publicada. Ahora agregue sus horarios para que puedan reservarla." },
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/tutor/tutorias" className="text-sm font-medium text-bosque/70 hover:text-bosque">← Mis tutorías</Link>
      <h1 className="text-3xl font-bold">Nueva tutoría</h1>

      {materias.length === 0 ? (
        <div className="tarjeta space-y-3">
          <Alerta>Para publicar una tutoría primero debe asociarse a la materia.</Alerta>
          <Link to="/tutor/materias" className="btn-primario">Ir a Mis materias</Link>
        </div>
      ) : (
        <div className="tarjeta">
          <FormularioTutoria materias={materias} onGuardar={guardar} />
        </div>
      )}
    </div>
  );
}
