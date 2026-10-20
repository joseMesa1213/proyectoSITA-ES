import { useEffect, useState } from "react";
import { obtenerOpciones } from "../api/catalogos.js";
import Alerta from "./Alerta.jsx";
import { contarReservas } from "../utils/reservas.js";

/**
 * Formulario para crear o editar una tutoría.
 * - Crear:  <FormularioTutoria materias={misMaterias} onGuardar={...} />
 * - Editar: <FormularioTutoria tutoria={tutoria} reservasActivas={n} onGuardar={...} />
 *   Al editar la materia es fija (el backend no permite cambiarla).
 * onGuardar(datos) debe devolver una promesa; si falla, aquí se muestra el error.
 */
export default function FormularioTutoria({ tutoria, materias = [], reservasActivas = 0, onGuardar, textoBoton }) {
  const editando = Boolean(tutoria);
  const [opciones, setOpciones] = useState({ niveles: [], modalidades: [] });
  const [formulario, setFormulario] = useState(() => ({
    id_materia: "",
    titulo: tutoria?.titulo ?? "",
    descripcion: tutoria?.descripcion ?? "",
    nivel: tutoria?.nivel ?? "",
    modalidad: tutoria?.modalidad ?? "",
    cupo: tutoria?.cupo ?? 1,
  }));
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerOpciones().then(setOpciones).catch(setError);
  }, []);

  const cambiar = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });

  // Cambiar modalidad o cupo no afecta las reservas que ya existen: se advierte al tutor
  const cambiaModalidad = editando && formulario.modalidad !== tutoria.modalidad;
  const cambiaCupo = editando && Number(formulario.cupo) !== tutoria.cupo;
  const advertir = reservasActivas > 0 && (cambiaModalidad || cambiaCupo);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (advertir && !window.confirm(
      `Hay ${contarReservas(reservasActivas)} activas que no se modifican con este cambio. ¿Guardar de todos modos?`
    )) return;

    setError(null);
    setEnviando(true);
    const datos = {
      titulo: formulario.titulo.trim(),
      descripcion: formulario.descripcion.trim() || null,
      nivel: formulario.nivel,
      modalidad: formulario.modalidad,
      cupo: Number(formulario.cupo),
    };
    if (!editando) datos.id_materia = Number(formulario.id_materia);
    try {
      await onGuardar(datos);
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Alerta error={error} />

      {editando ? (
        <div>
          <p className="etiqueta">Materia</p>
          <p className="rounded-lg bg-crema px-3 py-2 text-sm">
            {tutoria.materia.nombre} ({tutoria.materia.codigo})
            <span className="block text-xs text-bosque/60">La materia no se puede cambiar; para otra materia cree una tutoría nueva.</span>
          </p>
        </div>
      ) : (
        <Selector etiqueta="Materia" name="id_materia" value={formulario.id_materia} onChange={cambiar}
          opciones={materias.map((m) => ({ valor: m.id, texto: `${m.nombre} (${m.codigo})` }))} />
      )}

      <div>
        <label htmlFor="titulo" className="etiqueta">Título</label>
        <input id="titulo" name="titulo" className="campo" required maxLength={200}
          placeholder="Ej. Repaso de derivadas para el parcial" value={formulario.titulo} onChange={cambiar} />
      </div>
      <div>
        <label htmlFor="descripcion" className="etiqueta">Descripción (opcional)</label>
        <textarea id="descripcion" name="descripcion" rows={3} className="campo"
          placeholder="Temas, qué traer, requisitos..." value={formulario.descripcion} onChange={cambiar} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Selector etiqueta="Nivel" name="nivel" value={formulario.nivel} onChange={cambiar}
          opciones={opciones.niveles.map((n) => ({ valor: n, texto: n }))} />
        <Selector etiqueta="Modalidad" name="modalidad" value={formulario.modalidad} onChange={cambiar}
          opciones={opciones.modalidades.map((m) => ({ valor: m, texto: m }))} />
        <div>
          <label htmlFor="cupo" className="etiqueta">Cupo por sesión</label>
          <input id="cupo" name="cupo" type="number" min="1" className="campo" required value={formulario.cupo} onChange={cambiar} />
        </div>
      </div>

      {advertir && (
        <Alerta>
          Esta tutoría tiene {contarReservas(reservasActivas)} activas.{" "}
          {cambiaModalidad && "Si cambia la modalidad, esas reservas conservan el salón o enlace que eligieron. "}
          {cambiaCupo && "Si baja el cupo, las reservas que ya existen no se cancelan. "}
          Revise la Agenda de tutorías después de guardar.
        </Alerta>
      )}

      <button type="submit" className="btn-primario" disabled={enviando}>
        {enviando ? "Guardando..." : textoBoton ?? (editando ? "Guardar cambios" : "Publicar tutoría")}
      </button>
    </form>
  );
}

function Selector({ etiqueta, name, value, onChange, opciones }) {
  return (
    <div>
      <label htmlFor={name} className="etiqueta">{etiqueta}</label>
      <select id={name} name={name} className="campo" required value={value} onChange={onChange}>
        <option value="">Seleccione...</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>{o.texto}</option>
        ))}
      </select>
    </div>
  );
}
