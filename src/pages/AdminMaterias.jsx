import { useEffect, useState } from "react";
import { actualizarMateria, crearMateria, listarMaterias } from "../api/materias.js";
import Alerta from "../components/Alerta.jsx";
import Cargando from "../components/Cargando.jsx";

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre);
const VACIA = { nombre: "", codigo: "", creditos: "" };

// Normaliza el formulario al formato del backend (el backend guarda el código en mayúsculas)
const aCuerpo = (datos) => ({
  nombre: datos.nombre.trim(),
  codigo: datos.codigo.trim(),
  creditos: Number(datos.creditos),
});

// Administrador: catálogo de materias. Los tutores eligen de aquí las materias que dominan.
export default function AdminMaterias() {
  const [materias, setMaterias] = useState(null);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState("");
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    listarMaterias().then(setMaterias).catch(setError);
  }, []);

  const alCrear = (materia) => {
    setMaterias((lista) => [...lista, materia].sort(porNombre));
    setAviso(`Materia "${materia.nombre}" creada.`);
  };

  const alActualizar = (materia) =>
    setMaterias((lista) => lista.map((m) => (m.id === materia.id ? materia : m)).sort(porNombre));

  if (error) return <Alerta error={error} />;
  if (!materias) return <Cargando />;

  const texto = filtro.trim().toLowerCase();
  const visibles = materias.filter(
    (m) => !texto || m.nombre.toLowerCase().includes(texto) || m.codigo.toLowerCase().includes(texto)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Materias</h1>
        <p className="mt-1 text-bosque/70">Los tutores solo pueden ofrecer tutorías de las materias de este catálogo.</p>
      </div>

      {aviso && <Alerta tipo="exito" onCerrar={() => setAviso("")}>{aviso}</Alerta>}

      <FormularioNuevaMateria onCreada={alCrear} />

      <section className="tarjeta space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Catálogo ({materias.length})</h2>
          <input type="search" className="campo sm:max-w-xs" placeholder="Filtrar por nombre o código"
            value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        </div>
        {visibles.length === 0 ? (
          <p className="py-6 text-center text-sm text-bosque/60">
            {materias.length === 0 ? "Aún no hay materias. Cree la primera arriba." : "Ninguna materia coincide con el filtro."}
          </p>
        ) : (
          <ul className="divide-y divide-bosque/10">
            {visibles.map((m) => (
              <FilaMateria key={m.id} materia={m} onActualizada={alActualizar} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CamposMateria({ datos, onCambio, prefijo }) {
  const cambiar = (evento) => onCambio({ ...datos, [evento.target.name]: evento.target.value });
  return (
    <>
      <div className="sm:col-span-3">
        <label htmlFor={`${prefijo}-nombre`} className="etiqueta">Nombre</label>
        <input id={`${prefijo}-nombre`} name="nombre" className="campo" required maxLength={200}
          placeholder="Ej. Cálculo Diferencial" value={datos.nombre} onChange={cambiar} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${prefijo}-codigo`} className="etiqueta">Código</label>
        <input id={`${prefijo}-codigo`} name="codigo" className="campo uppercase" required maxLength={50}
          placeholder="Ej. MAT101" value={datos.codigo} onChange={cambiar} />
      </div>
      <div>
        <label htmlFor={`${prefijo}-creditos`} className="etiqueta">Créditos</label>
        <input id={`${prefijo}-creditos`} name="creditos" type="number" min={1} max={20} className="campo" required
          value={datos.creditos} onChange={cambiar} />
      </div>
    </>
  );
}

function FormularioNuevaMateria({ onCreada }) {
  const [datos, setDatos] = useState(VACIA);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      onCreada(await crearMateria(aCuerpo(datos)));
      setDatos(VACIA);
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="tarjeta space-y-4">
      <h2 className="text-lg font-semibold">Nueva materia</h2>
      <div className="grid gap-4 sm:grid-cols-6">
        <CamposMateria datos={datos} onCambio={setDatos} prefijo="nueva" />
      </div>
      {error?.status === 409 ? <Alerta tipo="error">Ya existe una materia con ese código.</Alerta> : <Alerta error={error} />}
      <button type="submit" className="btn-primario" disabled={enviando}>{enviando ? "Creando..." : "Crear materia"}</button>
    </form>
  );
}

function FilaMateria({ materia, onActualizada }) {
  const [editando, setEditando] = useState(false);
  const [datos, setDatos] = useState(materia);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const abrir = () => {
    setDatos({ ...materia, creditos: String(materia.creditos) });
    setError(null);
    setEditando(true);
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      onActualizada(await actualizarMateria(materia.id, aCuerpo(datos)));
      setEditando(false);
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  if (!editando) {
    return (
      <li className="flex items-center justify-between gap-3 py-3">
        <div>
          <p className="font-medium">{materia.nombre}</p>
          <p className="text-xs text-bosque/60">{materia.codigo} · {materia.creditos} créditos</p>
        </div>
        <button type="button" className="btn-secundario" onClick={abrir}>Editar</button>
      </li>
    );
  }

  return (
    <li className="py-3">
      <form onSubmit={guardar} className="space-y-3 rounded-lg border border-acento/40 p-4">
        <div className="grid gap-4 sm:grid-cols-6">
          <CamposMateria datos={datos} onCambio={setDatos} prefijo={`materia-${materia.id}`} />
        </div>
        {error?.status === 409 ? <Alerta tipo="error">Ya existe otra materia con ese código.</Alerta> : <Alerta error={error} />}
        <div className="flex gap-2">
          <button type="submit" className="btn-primario" disabled={enviando}>{enviando ? "Guardando..." : "Guardar"}</button>
          <button type="button" className="btn-secundario" onClick={() => setEditando(false)}>Cancelar</button>
        </div>
      </form>
    </li>
  );
}
