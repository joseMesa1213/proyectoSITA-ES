import { ROL } from "../utils/constantes.js";

// Piezas del formulario de registro que comparten Registro y CompletarRegistroGoogle.

// El registro solo permite estos dos roles (el administrador se crea en la BD)
const ROLES_REGISTRO = [
  { id: ROL.ESTUDIANTE, nombre: "Estudiante", descripcion: "Busco y reservo tutorías" },
  { id: ROL.TUTOR, nombre: "Tutor", descripcion: "Ofrezco tutorías (también puedo reservar)" },
];

// Tarjetas para elegir Estudiante o Tutor (radio buttons con estilo)
export function SelectorRol({ value, onChange }) {
  return (
    <fieldset>
      <legend className="etiqueta">¿Cómo usará SITA-ES?</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {ROLES_REGISTRO.map((rol) => (
          <label key={rol.id}
            className={`cursor-pointer rounded-lg border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-acento/50 ${
              value === String(rol.id) ? "border-acento bg-acento/10" : "border-bosque/15 hover:border-bosque/30"
            }`}>
            <input type="radio" name="id_rol" value={rol.id} className="sr-only"
              checked={value === String(rol.id)} onChange={onChange} />
            <span className="block font-semibold">{rol.nombre}</span>
            <span className="text-sm text-bosque/70">{rol.descripcion}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SelectorTipoDocumento({ value, onChange, tipos }) {
  return (
    <div>
      <label htmlFor="id_tipo_documento" className="etiqueta">Tipo de documento</label>
      <select id="id_tipo_documento" name="id_tipo_documento" className="campo" required value={value} onChange={onChange}>
        <option value="">Seleccione...</option>
        {tipos.map((t) => (
          <option key={t.id} value={t.id}>{t.nombre}</option>
        ))}
      </select>
    </div>
  );
}

// Campo de texto con su etiqueta. Por defecto es obligatorio.
export function Campo({ etiqueta, name, required = true, type = "text", ...resto }) {
  return (
    <div>
      <label htmlFor={name} className="etiqueta">{etiqueta}</label>
      <input id={name} name={name} type={type} required={required} className="campo" {...resto} />
    </div>
  );
}

// Convierte los campos del formulario (todo texto) a lo que espera el backend
export const datosAcademicos = (f) => ({
  id_rol: Number(f.id_rol),
  id_tipo_documento: Number(f.id_tipo_documento),
  num_documento: f.num_documento.trim(),
  nombre_programa: f.nombre_programa.trim(),
  semestre: Number(f.semestre),
  celular: f.celular.trim() || null,
});
