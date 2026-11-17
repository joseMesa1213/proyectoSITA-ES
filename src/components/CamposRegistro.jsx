// Piezas del formulario de "Completa tu registro" (CompletarRegistroGoogle): el registro es solo con Google.
// El rol NO se elige: todos entran como estudiantes. Quien quiere ser tutor marca la casilla y queda
// una solicitud pendiente que revisa un administrador (mientras tanto, usa todo lo de estudiante).

// Valores iniciales de los campos académicos y de la solicitud de tutor
export const CAMPOS_ACADEMICOS = {
  id_tipo_documento: "",
  num_documento: "",
  nombre_programa: "",
  semestre: "",
  celular: "",
  quiero_ser_tutor: false,
  motivo_tutor: "",
};

// Manejador común: las casillas guardan true/false; el resto, el texto escrito
export const cambiarCampo = (formulario, setFormulario) => (evento) => {
  const { name, type, checked, value } = evento.target;
  setFormulario({ ...formulario, [name]: type === "checkbox" ? checked : value });
};

// "Quiero ser tutor" + motivo opcional (solo aparece si la casilla está marcada)
export function CasillaTutor({ formulario, onChange }) {
  return (
    <div className={`rounded-control border p-4 transition-colors ${formulario.quiero_ser_tutor ? "border-acento bg-acento/10" : "border-borde"}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" name="quiero_ser_tutor" checked={formulario.quiero_ser_tutor} onChange={onChange}
          className="mt-1 size-4 accent-primario" aria-describedby="ayuda-tutor" />
        <span>
          <span className="block font-semibold">Quiero ser tutor</span>
          <span id="ayuda-tutor" className="text-sm text-texto-suave">
            Todos entran como estudiantes. Si la marca, un administrador revisará su solicitud; mientras tanto puede
            buscar y reservar tutorías. También puede solicitarlo después desde «Mi perfil».
          </span>
        </span>
      </label>
      {formulario.quiero_ser_tutor && (
        <div className="mt-3">
          <label htmlFor="motivo_tutor" className="etiqueta">¿Qué materias domina? (opcional)</label>
          <textarea id="motivo_tutor" name="motivo_tutor" rows={2} maxLength={500} className="campo"
            placeholder="Ej.: me fue muy bien en Cálculo Diferencial y Álgebra Lineal"
            value={formulario.motivo_tutor} onChange={onChange} />
        </div>
      )}
    </div>
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

// Convierte los campos del formulario (todo texto) a lo que espera el backend. Sin id_rol.
export const datosAcademicos = (f) => ({
  id_tipo_documento: Number(f.id_tipo_documento),
  num_documento: f.num_documento.trim(),
  nombre_programa: f.nombre_programa.trim(),
  semestre: Number(f.semestre),
  celular: f.celular.trim() || null,
  quiero_ser_tutor: f.quiero_ser_tutor,
  motivo_tutor: f.quiero_ser_tutor ? f.motivo_tutor.trim() || null : null,
});

// Aviso después de registrarse con la casilla marcada
export const AVISO_SOLICITUD =
  "¡Bienvenido! Su solicitud para ser tutor quedó en revisión. Mientras tanto puede buscar y reservar tutorías; " +
  "aquí verá cuando un administrador la responda.";
