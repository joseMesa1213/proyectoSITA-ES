import { useEffect, useState } from "react";
import { obtenerOpciones } from "../api/catalogos.js";
import { actualizarRecurso, crearRecurso, listarRecursos } from "../api/recursos.js";
import Alerta from "../components/Alerta.jsx";
import Cargando from "../components/Cargando.jsx";
import { ESTADO } from "../utils/constantes.js";

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre);
const VACIO = { nombre: "", tipo: "", ubicacion: "", capacidad: "" };

const aCuerpo = (datos) => ({
  nombre: datos.nombre.trim(),
  tipo: datos.tipo,
  ubicacion: datos.ubicacion.trim(),
  capacidad: Number(datos.capacidad),
});

// Administrador: salones y enlaces virtuales que los estudiantes eligen al reservar
export default function AdminRecursos() {
  const [recursos, setRecursos] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  useEffect(() => {
    // Como administrador, el backend devuelve activos e inactivos
    Promise.all([listarRecursos(), obtenerOpciones()])
      .then(([lista, opciones]) => {
        setRecursos(lista);
        setTipos(opciones.tiposRecurso);
      })
      .catch(setError);
  }, []);

  const alCrear = (recurso) => {
    setRecursos((lista) => [...lista, recurso].sort(porNombre));
    setAviso(`Recurso "${recurso.nombre}" creado.`);
  };

  const alActualizar = (recurso) =>
    setRecursos((lista) => lista.map((r) => (r.id === recurso.id ? recurso : r)).sort(porNombre));

  if (error) return <Alerta error={error} />;
  if (!recursos) return <Cargando />;

  const visibles = recursos.filter((r) => !filtroTipo || r.tipo === filtroTipo);
  const activos = recursos.filter((r) => r.id_estado === ESTADO.ACTIVO).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recursos</h1>
        <p className="mt-1 text-bosque/70">
          Salones y enlaces virtuales. Los estudiantes eligen uno activo al reservar, según la modalidad de la tutoría.
        </p>
      </div>

      {aviso && <Alerta tipo="exito" onCerrar={() => setAviso("")}>{aviso}</Alerta>}

      <FormularioNuevoRecurso tipos={tipos} onCreado={alCrear} />

      <section className="tarjeta space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Recursos ({activos} activos de {recursos.length})
          </h2>
          <select className="campo sm:max-w-48" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} aria-label="Filtrar por tipo">
            <option value="">Todos los tipos</option>
            {tipos.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        {visibles.length === 0 ? (
          <p className="py-6 text-center text-sm text-bosque/60">
            {recursos.length === 0 ? "Aún no hay recursos. Cree el primero arriba." : "No hay recursos de este tipo."}
          </p>
        ) : (
          <ul className="divide-y divide-bosque/10">
            {visibles.map((r) => (
              <FilaRecurso key={r.id} recurso={r} tipos={tipos} onActualizado={alActualizar} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CamposRecurso({ datos, onCambio, tipos, prefijo }) {
  const cambiar = (evento) => onCambio({ ...datos, [evento.target.name]: evento.target.value });
  const esVirtual = datos.tipo === "Virtual";
  return (
    <>
      <div className="sm:col-span-2">
        <label htmlFor={`${prefijo}-nombre`} className="etiqueta">Nombre</label>
        <input id={`${prefijo}-nombre`} name="nombre" className="campo" required maxLength={200}
          placeholder={esVirtual ? "Ej. Sala Meet Monitorías" : "Ej. Salón 301"} value={datos.nombre} onChange={cambiar} />
      </div>
      <div>
        <label htmlFor={`${prefijo}-tipo`} className="etiqueta">Tipo</label>
        <select id={`${prefijo}-tipo`} name="tipo" className="campo" required value={datos.tipo} onChange={cambiar}>
          <option value="" disabled>Seleccione</option>
          {tipos.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${prefijo}-ubicacion`} className="etiqueta">{esVirtual ? "Enlace de la reunión" : "Ubicación"}</label>
        <input id={`${prefijo}-ubicacion`} name="ubicacion" className="campo" required maxLength={255}
          type={esVirtual ? "url" : "text"}
          placeholder={esVirtual ? "https://meet.google.com/..." : "Ej. Bloque 19 - 301"} value={datos.ubicacion} onChange={cambiar} />
      </div>
      <div>
        <label htmlFor={`${prefijo}-capacidad`} className="etiqueta">Capacidad</label>
        <input id={`${prefijo}-capacidad`} name="capacidad" type="number" min={1} max={500} className="campo" required
          value={datos.capacidad} onChange={cambiar} />
      </div>
    </>
  );
}

function FormularioNuevoRecurso({ tipos, onCreado }) {
  const [datos, setDatos] = useState(VACIO);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      onCreado(await crearRecurso(aCuerpo(datos)));
      setDatos(VACIO);
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="tarjeta space-y-4">
      <h2 className="text-lg font-semibold">Nuevo recurso</h2>
      <div className="grid gap-4 sm:grid-cols-6">
        <CamposRecurso datos={datos} onCambio={setDatos} tipos={tipos} prefijo="nuevo" />
      </div>
      <Alerta error={error} />
      <button type="submit" className="btn-primario" disabled={enviando}>{enviando ? "Creando..." : "Crear recurso"}</button>
    </form>
  );
}

function FilaRecurso({ recurso, tipos, onActualizado }) {
  const [editando, setEditando] = useState(false);
  const [datos, setDatos] = useState(recurso);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const activo = recurso.id_estado === ESTADO.ACTIVO;

  const ejecutar = async (cuerpo) => {
    setError(null);
    setEnviando(true);
    try {
      onActualizado(await actualizarRecurso(recurso.id, cuerpo));
      setEditando(false);
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  const abrir = () => {
    setDatos({ ...recurso, capacidad: String(recurso.capacidad) });
    setError(null);
    setEditando(true);
  };

  const guardar = (evento) => {
    evento.preventDefault();
    ejecutar(aCuerpo(datos));
  };

  const alternarEstado = () => {
    if (activo && !window.confirm(`¿Desactivar "${recurso.nombre}"? No se podrá elegir en nuevas reservas; las existentes se mantienen.`)) return;
    ejecutar({ id_estado: activo ? ESTADO.INACTIVO : ESTADO.ACTIVO });
  };

  if (editando) {
    return (
      <li className="py-3">
        <form onSubmit={guardar} className="space-y-3 rounded-lg border border-acento/40 p-4">
          <div className="grid gap-4 sm:grid-cols-6">
            <CamposRecurso datos={datos} onCambio={setDatos} tipos={tipos} prefijo={`recurso-${recurso.id}`} />
          </div>
          <Alerta error={error} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primario" disabled={enviando}>{enviando ? "Guardando..." : "Guardar"}</button>
            <button type="button" className="btn-secundario" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Solo se atenúa el texto: los botones deben seguir viéndose habilitados */}
        <div className={`min-w-0 ${activo ? "" : "opacity-60"}`}>
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {recurso.nombre}
            <span className="insignia border border-bosque/15 text-bosque">{recurso.tipo}</span>
            {!activo && <span className="insignia bg-bosque/10 text-bosque">Inactivo</span>}
          </p>
          <p className="truncate text-xs text-bosque/60">{recurso.ubicacion} · capacidad {recurso.capacidad}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secundario" onClick={abrir} disabled={enviando}>Editar</button>
          <button type="button" className={activo ? "btn-peligro" : "btn-primario"} onClick={alternarEstado} disabled={enviando}>
            {activo ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>
      <Alerta error={error} />
    </li>
  );
}
