import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { listarTutorias } from "../api/tutorias.js";
import { listarMaterias } from "../api/materias.js";
import { obtenerOpciones } from "../api/catalogos.js";
import Alerta from "../components/Alerta.jsx";
import Cargando from "../components/Cargando.jsx";
import TarjetaTutoria from "../components/TarjetaTutoria.jsx";

// Catálogo público de tutorías con filtros por materia, nivel y modalidad.
// Los filtros viven en la URL (?id_materia=3&nivel=Básico): se conservan al volver
// desde el detalle y se pueden compartir como enlace.
export default function Catalogo() {
  const [parametros, setParametros] = useSearchParams();
  const filtros = {
    id_materia: parametros.get("id_materia") ?? "",
    nivel: parametros.get("nivel") ?? "",
    modalidad: parametros.get("modalidad") ?? "",
  };

  const [materias, setMaterias] = useState([]);
  const [opciones, setOpciones] = useState({ niveles: [], modalidades: [] });
  const [tutorias, setTutorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Datos de los selects: se cargan una sola vez
  useEffect(() => {
    Promise.all([listarMaterias(), obtenerOpciones()])
      .then(([materias, opciones]) => {
        setMaterias(materias);
        setOpciones(opciones);
      })
      .catch(setError);
  }, []);

  // Tutorías: se vuelven a pedir cada vez que cambia un filtro
  const { id_materia, nivel, modalidad } = filtros;
  useEffect(() => {
    // Si el usuario cambia los filtros rápido, se ignora la respuesta vieja
    let vigente = true;
    setCargando(true);
    setError(null);
    listarTutorias({ id_materia, nivel, modalidad })
      .then((datos) => vigente && setTutorias(datos))
      .catch((err) => vigente && setError(err))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [id_materia, nivel, modalidad]);

  const cambiarFiltro = (evento) => {
    const nuevos = new URLSearchParams(parametros);
    if (evento.target.value) nuevos.set(evento.target.name, evento.target.value);
    else nuevos.delete(evento.target.name);
    setParametros(nuevos, { replace: true });
  };

  const hayFiltros = Boolean(id_materia || nivel || modalidad);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tutorías disponibles</h1>
        <p className="mt-1 text-bosque/70">Encuentre un compañero que le ayude con la materia que necesita.</p>
      </div>

      <div className="tarjeta grid gap-4 p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
        <Filtro etiqueta="Materia" name="id_materia" value={id_materia} onChange={cambiarFiltro} todas="Todas las materias"
          opciones={materias.map((m) => ({ valor: m.id, texto: `${m.nombre} (${m.codigo})` }))} />
        <Filtro etiqueta="Nivel" name="nivel" value={nivel} onChange={cambiarFiltro} todas="Todos"
          opciones={opciones.niveles.map((n) => ({ valor: n, texto: n }))} />
        <Filtro etiqueta="Modalidad" name="modalidad" value={modalidad} onChange={cambiarFiltro} todas="Todas"
          opciones={opciones.modalidades.map((m) => ({ valor: m, texto: m }))} />
        <button type="button" className="btn-secundario" disabled={!hayFiltros}
          onClick={() => setParametros({}, { replace: true })}>
          Limpiar
        </button>
      </div>

      <Alerta error={error} />

      {cargando ? (
        <Cargando texto="Buscando tutorías..." />
      ) : (
        !error && (
          <>
            <p className="text-sm text-bosque/60">
              {tutorias.length} {tutorias.length === 1 ? "tutoría encontrada" : "tutorías encontradas"}
            </p>
            {tutorias.length === 0 ? (
              <div className="tarjeta py-12 text-center text-bosque/70">
                {hayFiltros ? "No hay tutorías con esos filtros." : "Todavía no hay tutorías publicadas."}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tutorias.map((t) => (
                  <TarjetaTutoria key={t.id} tutoria={t} />
                ))}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}

function Filtro({ etiqueta, name, value, onChange, opciones, todas }) {
  return (
    <div>
      <label htmlFor={name} className="etiqueta">{etiqueta}</label>
      <select id={name} name={name} className="campo" value={value} onChange={onChange}>
        <option value="">{todas}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>{o.texto}</option>
        ))}
      </select>
    </div>
  );
}
