import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { listarTiposDocumento } from "../api/catalogos.js";
import Alerta from "../components/Alerta.jsx";
import { ROL } from "../utils/constantes.js";

const FORMULARIO_INICIAL = {
  nombre: "",
  apellido: "",
  id_tipo_documento: "",
  num_documento: "",
  correo: "",
  celular: "",
  contrasena: "",
  confirmacion: "",
  id_rol: String(ROL.ESTUDIANTE),
  nombre_programa: "",
  semestre: "",
};

// El registro solo permite estos dos roles (el administrador se crea en la BD)
const ROLES_REGISTRO = [
  { id: ROL.ESTUDIANTE, nombre: "Estudiante", descripcion: "Busco y reservo tutorías" },
  { id: ROL.TUTOR, nombre: "Tutor", descripcion: "Ofrezco tutorías (también puedo reservar)" },
];

export default function Registro() {
  const { registro } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    listarTiposDocumento().then(setTiposDocumento).catch(setError);
  }, []);

  // Un solo manejador para todos los campos: usa el atributo name del input
  const cambiar = (evento) => setFormulario({ ...formulario, [evento.target.name]: evento.target.value });

  const enviar = async (evento) => {
    evento.preventDefault();
    setError(null);
    // Validaciones rápidas en el navegador; el backend vuelve a validar todo
    if (formulario.contrasena.length < 8) {
      return setError(new Error("La contraseña debe tener al menos 8 caracteres"));
    }
    if (formulario.contrasena !== formulario.confirmacion) {
      return setError(new Error("Las contraseñas no coinciden"));
    }

    const { confirmacion, ...datos } = formulario;
    setEnviando(true);
    try {
      await registro({
        ...datos,
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        nombre_programa: datos.nombre_programa.trim(),
        celular: datos.celular.trim() || null,
        id_tipo_documento: Number(datos.id_tipo_documento),
        id_rol: Number(datos.id_rol),
        semestre: Number(datos.semestre),
      });
      navegar(ubicacion.state?.desde ?? "/", { replace: true });
    } catch (err) {
      setError(err);
      setEnviando(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="tarjeta p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <p className="mt-1 text-sm text-bosque/70">Todos los campos son obligatorios, excepto el celular.</p>

        <form onSubmit={enviar} className="mt-6 space-y-6">
          <Alerta error={error} />

          <fieldset>
            <legend className="etiqueta">¿Cómo usará SITA-ES?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLES_REGISTRO.map((rol) => (
                <label key={rol.id}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                    formulario.id_rol === String(rol.id) ? "border-acento bg-acento/10" : "border-bosque/15 hover:border-bosque/30"
                  }`}>
                  <input type="radio" name="id_rol" value={rol.id} className="sr-only"
                    checked={formulario.id_rol === String(rol.id)} onChange={cambiar} />
                  <span className="block font-semibold">{rol.nombre}</span>
                  <span className="text-sm text-bosque/70">{rol.descripcion}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombre" name="nombre" value={formulario.nombre} onChange={cambiar} autoComplete="given-name" />
            <Campo etiqueta="Apellido" name="apellido" value={formulario.apellido} onChange={cambiar} autoComplete="family-name" />

            <div>
              <label htmlFor="id_tipo_documento" className="etiqueta">Tipo de documento</label>
              <select id="id_tipo_documento" name="id_tipo_documento" className="campo" required
                value={formulario.id_tipo_documento} onChange={cambiar}>
                <option value="">Seleccione...</option>
                {tiposDocumento.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <Campo etiqueta="Número de documento" name="num_documento" value={formulario.num_documento} onChange={cambiar} inputMode="numeric" />

            <Campo etiqueta="Correo" name="correo" type="email" value={formulario.correo} onChange={cambiar} autoComplete="email" />
            <Campo etiqueta="Celular (opcional)" name="celular" type="tel" value={formulario.celular} onChange={cambiar} required={false} autoComplete="tel" />

            <Campo etiqueta="Programa académico" name="nombre_programa" value={formulario.nombre_programa} onChange={cambiar}
              placeholder="Ej. Ingeniería de Sistemas" />
            <Campo etiqueta="Semestre" name="semestre" type="number" min="1" max="12" value={formulario.semestre} onChange={cambiar} />

            <Campo etiqueta="Contraseña" name="contrasena" type="password" value={formulario.contrasena} onChange={cambiar}
              minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
            <Campo etiqueta="Confirmar contraseña" name="confirmacion" type="password" value={formulario.confirmacion} onChange={cambiar}
              minLength={8} autoComplete="new-password" />
          </div>

          <button type="submit" className="btn-primario w-full" disabled={enviando}>
            {enviando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-bosque/70">
          ¿Ya tiene cuenta?{" "}
          <Link to="/login" state={ubicacion.state} className="font-semibold text-bosque underline decoration-acento underline-offset-4">
            Inicie sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

// Campo de texto con su etiqueta. Por defecto es obligatorio.
function Campo({ etiqueta, name, required = true, type = "text", ...resto }) {
  return (
    <div>
      <label htmlFor={name} className="etiqueta">{etiqueta}</label>
      <input id={name} name={name} type={type} required={required} className="campo" {...resto} />
    </div>
  );
}
