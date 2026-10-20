import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { obtenerOpciones } from "../api/catalogos.js";
import { listarMisMaterias } from "../api/materias.js";
import { actualizarTutoria, agregarHorario, crearTutoria, desactivarHorario, listarMisTutorias } from "../api/tutorias.js";
import Alerta from "../components/Alerta.jsx";
import Cargando from "../components/Cargando.jsx";
import { ESTADO } from "../utils/constantes.js";

// Tutor: crear una tutoría (/tutor/tutorias/nueva) o editarla y gestionar sus horarios (/tutor/tutorias/:id)
export default function EditarTutoria() {
  const { id } = useParams();
  const esNueva = !id;
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [opciones, setOpciones] = useState(null);
  const [misMaterias, setMisMaterias] = useState(null);
  const [tutoria, setTutoria] = useState(null);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState("");

  // Al pasar de "nueva" a ":id" React reutiliza este componente: por eso se recarga según id
  useEffect(() => {
    let vigente = true;
    setError(null);
    setTutoria(null);
    setAviso(ubicacion.state?.aviso ?? "");
    Promise.all([obtenerOpciones(), listarMisMaterias(), esNueva ? null : listarMisTutorias()])
      .then(([op, materias, tutorias]) => {
        if (!vigente) return;
        setOpciones(op);
        setMisMaterias(materias);
        if (!esNueva) {
          const encontrada = tutorias.find((t) => t.id === Number(id));
          if (encontrada) setTutoria(encontrada);
          else setError(new Error("Tutoría no encontrada o no le pertenece"));
        }
      })
      .catch((err) => vigente && setError(err));
    return () => {
      vigente = false;
    };
  }, [id, esNueva, ubicacion.state]);

  // Trae la versión actual (con todos sus horarios) después de agregar o desactivar uno
  const recargar = async () => {
    const tutorias = await listarMisTutorias();
    setTutoria(tutorias.find((t) => t.id === Number(id)));
  };

  const alGuardar = (guardada) => {
    if (esNueva) {
      navegar(`/tutor/tutorias/${guardada.id}`, {
        replace: true,
        state: { aviso: "Tutoría creada. Agregue al menos un horario para que los estudiantes puedan reservarla." },
      });
    } else {
      setTutoria(guardada);
      setAviso("Cambios guardados.");
    }
  };

  if (error && !tutoria) {
    return (
      <div className="space-y-4">
        <Alerta error={error} />
        <Link to="/tutor/tutorias" className="btn-secundario">← Mis tutorías</Link>
      </div>
    );
  }
  if (!opciones || (!esNueva && !tutoria)) return <Cargando />;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/tutor/tutorias" className="text-sm text-bosque/70 hover:underline">← Mis tutorías</Link>
        <h1 className="mt-2 text-3xl font-bold">{esNueva ? "Nueva tutoría" : tutoria.titulo}</h1>
        {!esNueva && (
          <p className="mt-1 text-bosque/70">{tutoria.materia.nombre} · {tutoria.materia.codigo}</p>
        )}
      </div>

      {aviso && <Alerta tipo="exito" onCerrar={() => setAviso("")}>{aviso}</Alerta>}

      {esNueva && misMaterias.length === 0 ? (
        <div className="tarjeta py-10 text-center text-bosque/70">
          <p>Para publicar una tutoría primero debe asociar al menos una materia.</p>
          <Link to="/tutor/materias" className="btn-primario mt-4">Ir a mis materias</Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <FormularioDatos key={tutoria?.id ?? "nueva"} opciones={opciones} misMaterias={misMaterias}
              tutoria={tutoria} onGuardada={alGuardar} />
          </div>
          {!esNueva && (
            <div className="space-y-6 lg:col-span-2">
              <SeccionHorarios tutoria={tutoria} dias={opciones.dias} onCambio={recargar} />
              <SeccionVisibilidad tutoria={tutoria} onCambio={alGuardar} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FormularioDatos({ opciones, misMaterias, tutoria, onGuardada }) {
  const esNueva = !tutoria;
  const [datos, setDatos] = useState({
    id_materia: "",
    titulo: tutoria?.titulo ?? "",
    descripcion: tutoria?.descripcion ?? "",
    nivel: tutoria?.nivel ?? "",
    modalidad: tutoria?.modalidad ?? "",
    cupo: tutoria?.cupo ?? 5,
  });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (evento) => setDatos((d) => ({ ...d, [evento.target.name]: evento.target.value }));

  const enviar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    const cuerpo = {
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim() || null,
      nivel: datos.nivel,
      modalidad: datos.modalidad,
      cupo: Number(datos.cupo),
    };
    try {
      onGuardada(
        esNueva
          ? await crearTutoria({ ...cuerpo, id_materia: Number(datos.id_materia) })
          : await actualizarTutoria(tutoria.id, cuerpo)
      );
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="tarjeta space-y-4">
      <h2 className="text-lg font-semibold">Datos de la tutoría</h2>

      {esNueva && (
        <div>
          <label htmlFor="id_materia" className="etiqueta">Materia</label>
          <select id="id_materia" name="id_materia" className="campo" required value={datos.id_materia} onChange={cambiar}>
            <option value="" disabled>Seleccione una materia</option>
            {misMaterias.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="titulo" className="etiqueta">Título</label>
        <input id="titulo" name="titulo" className="campo" required maxLength={200}
          placeholder="Ej. Repaso para el primer parcial" value={datos.titulo} onChange={cambiar} />
      </div>

      <div>
        <label htmlFor="descripcion" className="etiqueta">Descripción (opcional)</label>
        <textarea id="descripcion" name="descripcion" rows={4} className="campo"
          placeholder="Temas que se verán, qué deben traer los estudiantes..." value={datos.descripcion} onChange={cambiar} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="nivel" className="etiqueta">Nivel</label>
          <select id="nivel" name="nivel" className="campo" required value={datos.nivel} onChange={cambiar}>
            <option value="" disabled>Seleccione</option>
            {opciones.niveles.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="modalidad" className="etiqueta">Modalidad</label>
          <select id="modalidad" name="modalidad" className="campo" required value={datos.modalidad} onChange={cambiar}>
            <option value="" disabled>Seleccione</option>
            {opciones.modalidades.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cupo" className="etiqueta">Cupo por sesión</label>
          <input id="cupo" name="cupo" type="number" min={1} max={100} className="campo" required
            value={datos.cupo} onChange={cambiar} />
        </div>
      </div>

      <Alerta error={error} />

      <button type="submit" className="btn-primario" disabled={enviando}>
        {enviando ? "Guardando..." : esNueva ? "Crear tutoría" : "Guardar cambios"}
      </button>
    </form>
  );
}

// Lunes primero (el catálogo del backend empieza en Domingo)
const ordenarSemana = (dias) => [...dias.slice(1), dias[0]];

function SeccionHorarios({ tutoria, dias, onCambio }) {
  const [nuevo, setNuevo] = useState({ dia: "Lunes", hora_inicio: "", hora_fin: "" });
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const activos = tutoria.horarios.filter((h) => h.id_estado === ESTADO.ACTIVO);
  const cambiar = (evento) => setNuevo((h) => ({ ...h, [evento.target.name]: evento.target.value }));

  const ejecutar = async (accion) => {
    setError(null);
    setProcesando(true);
    try {
      await accion();
      await onCambio();
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setProcesando(false);
    }
  };

  const agregar = async (evento) => {
    evento.preventDefault();
    const agregado = await ejecutar(() => agregarHorario(tutoria.id, nuevo));
    if (agregado) setNuevo((h) => ({ ...h, hora_inicio: "", hora_fin: "" }));
  };

  const desactivar = (horario) => {
    if (!window.confirm(`¿Desactivar el horario del ${horario.dia} ${horario.hora_inicio}–${horario.hora_fin}? Las reservas ya hechas se mantienen.`)) return;
    ejecutar(() => desactivarHorario(tutoria.id, horario.id));
  };

  // 409 por cruce: el backend indica con qué horario choca
  const cruce = error?.detalles?.tutoria ? error.detalles : null;

  return (
    <section className="tarjeta space-y-4">
      <h2 className="text-lg font-semibold">Horarios semanales</h2>

      {activos.length === 0 ? (
        <p className="text-sm text-peligro">Sin horarios activos: los estudiantes no pueden reservar.</p>
      ) : (
        <ul className="divide-y divide-bosque/10">
          {activos.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span><span className="font-medium">{h.dia}</span> · {h.hora_inicio} – {h.hora_fin}</span>
              <button type="button" className="text-xs font-medium text-peligro hover:underline" onClick={() => desactivar(h)} disabled={procesando}>
                Desactivar
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={agregar} className="space-y-3 border-t border-bosque/10 pt-4">
        <p className="etiqueta">Agregar horario</p>
        <div className="grid grid-cols-3 gap-2">
          <select name="dia" className="campo" value={nuevo.dia} onChange={cambiar} aria-label="Día">
            {ordenarSemana(dias).map((d) => <option key={d}>{d}</option>)}
          </select>
          <input name="hora_inicio" type="time" className="campo" required value={nuevo.hora_inicio} onChange={cambiar} aria-label="Hora de inicio" />
          <input name="hora_fin" type="time" className="campo" required value={nuevo.hora_fin} onChange={cambiar} aria-label="Hora de fin" />
        </div>
        <Alerta error={error} />
        {cruce && (
          <p className="text-xs text-peligro">
            Choca con «{cruce.tutoria}»: {cruce.dia} {cruce.hora_inicio} – {cruce.hora_fin}.
          </p>
        )}
        <button type="submit" className="btn-primario" disabled={procesando}>
          {procesando ? "Guardando..." : "Agregar horario"}
        </button>
      </form>
    </section>
  );
}

function SeccionVisibilidad({ tutoria, onCambio }) {
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const activa = tutoria.id_estado === ESTADO.ACTIVO;

  const alternar = async () => {
    setError(null);
    setProcesando(true);
    try {
      onCambio(await actualizarTutoria(tutoria.id, { id_estado: activa ? ESTADO.INACTIVO : ESTADO.ACTIVO }));
    } catch (err) {
      setError(err);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <section className="tarjeta space-y-3">
      <h2 className="text-lg font-semibold">Visibilidad</h2>
      <p className="text-sm text-bosque/70">
        {activa
          ? "Activa: aparece en el catálogo y se puede reservar."
          : "Inactiva: no aparece en el catálogo. Las reservas existentes se mantienen."}
      </p>
      <Alerta error={error} />
      <button type="button" className={activa ? "btn-peligro" : "btn-primario"} onClick={alternar} disabled={procesando}>
        {activa ? "Ocultar del catálogo" : "Publicar de nuevo"}
      </button>
    </section>
  );
}
