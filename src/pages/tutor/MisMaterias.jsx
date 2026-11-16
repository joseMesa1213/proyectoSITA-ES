import { useEffect, useState } from "react";
import { useConfirmar } from "../../components/Confirmar.jsx";
import { Link } from "react-router";
import { asociarMateria, desasociarMateria, listarMaterias, listarMisMaterias } from "../../api/materias.js";
import Alerta from "../../components/Alerta.jsx";
import Cargando from "../../components/Cargando.jsx";

// El tutor declara qué materias domina: solo puede publicar tutorías de estas materias.
export default function MisMaterias() {
  const confirmar = useConfirmar();
  const [todas, setTodas] = useState(null);
  const [mias, setMias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState("");
  const [procesando, setProcesando] = useState(null); // id de la materia en proceso

  useEffect(() => {
    Promise.all([listarMaterias(), listarMisMaterias()])
      .then(([todas, mias]) => {
        setTodas(todas);
        setMias(mias);
      })
      .catch(setError);
  }, []);

  if (!todas) return error ? <Alerta error={error} /> : <Cargando />;

  const idsMias = new Set(mias.map((m) => m.id));
  // La lista completa es corta, así que se filtra en el navegador mientras se escribe
  const texto = busqueda.trim().toLowerCase();
  const resultados = todas.filter(
    (m) => !idsMias.has(m.id) && (!texto || `${m.nombre} ${m.codigo}`.toLowerCase().includes(texto))
  );

  // Ejecuta la acción en el backend y muestra el resultado
  const ejecutar = async (materia, accion, mensaje) => {
    setError(null);
    setAviso("");
    setProcesando(materia.id);
    try {
      await accion(materia.id);
      setMias(await listarMisMaterias());
      setAviso(mensaje);
    } catch (err) {
      setError(err);
    } finally {
      setProcesando(null);
    }
  };

  const asociar = (materia) => ejecutar(materia, asociarMateria, `Ahora puede publicar tutorías de ${materia.nombre}.`);

  const desasociar = async (materia) => {
    const confirmado = await confirmar({
      titulo: "Quitar materia",
      mensaje: `¿Quitar ${materia.nombre} de sus materias?\n\n` +
        "Sus tutorías ya creadas de esta materia no cambian, pero no podrá publicar nuevas.",
      textoConfirmar: "Sí, quitar",
      peligro: true,
    });
    if (confirmado) ejecutar(materia, desasociarMateria, `Se quitó ${materia.nombre} de sus materias.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-pagina">Mis materias</h1>
        <p className="mt-1 text-texto-suave">Solo puede publicar tutorías de las materias que tenga asociadas.</p>
      </div>

      {aviso && <Alerta tipo="exito" onCerrar={() => setAviso("")}>{aviso}</Alerta>}
      <Alerta error={error} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="tarjeta space-y-3">
          <h2 className="font-semibold">Materias asociadas ({mias.length})</h2>
          {mias.length === 0 ? (
            <p className="text-sm text-texto-suave">Todavía no tiene materias. Búsquelas en la lista y asóciese.</p>
          ) : (
            <>
              <ul className="divide-y divide-borde">
                {mias.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                    <FilaMateria materia={m} />
                    <button type="button" className="btn-peligro px-3 py-1" disabled={procesando === m.id} onClick={() => desasociar(m)}>
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
              <Link to="/tutor/tutorias/nueva" className="btn-primario">Publicar una tutoría</Link>
            </>
          )}
        </section>

        <section className="tarjeta space-y-3">
          <h2 className="font-semibold">Asociarme a una materia</h2>
          <input type="search" className="campo" placeholder="Buscar por nombre o código..."
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar materia" />
          {todas.length === 0 ? (
            <Alerta>Aún no hay materias registradas. Solo el administrador puede crearlas.</Alerta>
          ) : resultados.length === 0 ? (
            <p className="text-sm text-texto-suave">
              {texto ? "Ninguna materia coincide. Si no existe, pídale al administrador que la cree." : "Ya está asociado a todas las materias."}
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-borde overflow-y-auto">
              {resultados.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                  <FilaMateria materia={m} />
                  <button type="button" className="btn-secundario px-3 py-1" disabled={procesando === m.id} onClick={() => asociar(m)}>
                    Asociarme
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function FilaMateria({ materia }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium">{materia.nombre}</p>
      <p className="text-xs text-texto-suave">{materia.codigo} · {materia.creditos} créditos</p>
    </div>
  );
}
