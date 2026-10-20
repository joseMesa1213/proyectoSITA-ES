import { useEffect, useState } from "react";
import { asociarMateria, desasociarMateria, listarMaterias, listarMisMaterias } from "../api/materias.js";
import Alerta from "../components/Alerta.jsx";
import Cargando from "../components/Cargando.jsx";

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre);

// Tutor: materias que domina. Solo puede publicar tutorías de las materias asociadas aquí.
export default function MisMaterias() {
  const [mias, setMias] = useState(null);
  const [disponibles, setDisponibles] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(null); // id de la materia en proceso

  useEffect(() => {
    Promise.all([listarMisMaterias(), listarMaterias()])
      .then(([misMaterias, todas]) => {
        setMias(misMaterias);
        setDisponibles(todas);
      })
      .catch(setError);
  }, []);

  const buscar = async (evento) => {
    evento.preventDefault();
    setError(null);
    try {
      setDisponibles(await listarMaterias(busqueda.trim()));
    } catch (err) {
      setError(err);
    }
  };

  // Ejecuta una acción sobre una materia mostrando el estado "procesando" en su botón
  const conMateria = async (materia, accion) => {
    setError(null);
    setProcesando(materia.id);
    try {
      await accion();
    } catch (err) {
      setError(err);
    } finally {
      setProcesando(null);
    }
  };

  const asociar = (materia) =>
    conMateria(materia, async () => {
      await asociarMateria(materia.id);
      setMias((lista) => [...lista, materia].sort(porNombre));
    });

  const quitar = (materia) => {
    if (!window.confirm(`¿Quitar "${materia.nombre}" de sus materias? Sus tutorías ya publicadas no se modifican.`)) return;
    conMateria(materia, async () => {
      await desasociarMateria(materia.id);
      setMias((lista) => lista.filter((m) => m.id !== materia.id));
    });
  };

  if (error && !mias) return <Alerta error={error} />;
  if (!mias) return <Cargando />;

  const idsMias = new Set(mias.map((m) => m.id));
  const sinAsociar = disponibles.filter((m) => !idsMias.has(m.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis materias</h1>
        <p className="mt-1 text-bosque/70">Solo puede publicar tutorías de las materias que tenga asociadas.</p>
      </div>

      <Alerta error={error} onCerrar={() => setError(null)} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="tarjeta space-y-4">
          <h2 className="text-lg font-semibold">Asociadas ({mias.length})</h2>
          {mias.length === 0 ? (
            <p className="text-sm text-bosque/60">Aún no tiene materias. Agréguelas desde la lista de la derecha.</p>
          ) : (
            <ul className="divide-y divide-bosque/10">
              {mias.map((m) => (
                <FilaMateria key={m.id} materia={m}>
                  <button type="button" className="btn-peligro" onClick={() => quitar(m)} disabled={procesando === m.id}>
                    Quitar
                  </button>
                </FilaMateria>
              ))}
            </ul>
          )}
        </section>

        <section className="tarjeta space-y-4">
          <h2 className="text-lg font-semibold">Agregar materias</h2>
          <form onSubmit={buscar} className="flex gap-2">
            <input type="search" className="campo" placeholder="Buscar por nombre o código"
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <button type="submit" className="btn-secundario">Buscar</button>
          </form>
          {sinAsociar.length === 0 ? (
            <p className="text-sm text-bosque/60">
              {disponibles.length === 0
                ? "No hay materias que coincidan. Si falta alguna, pídale al administrador que la cree."
                : "Ya tiene asociadas todas las materias de esta búsqueda."}
            </p>
          ) : (
            <ul className="divide-y divide-bosque/10">
              {sinAsociar.map((m) => (
                <FilaMateria key={m.id} materia={m}>
                  <button type="button" className="btn-primario" onClick={() => asociar(m)} disabled={procesando === m.id}>
                    {procesando === m.id ? "Agregando..." : "Agregar"}
                  </button>
                </FilaMateria>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function FilaMateria({ materia, children }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="font-medium">{materia.nombre}</p>
        <p className="text-xs text-bosque/60">{materia.codigo} · {materia.creditos} créditos</p>
      </div>
      {children}
    </li>
  );
}
