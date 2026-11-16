import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { listarTiposDocumento } from "../api/catalogos.js";
import Alerta from "../components/Alerta.jsx";
import ContinuarConGoogle, { SeparadorGoogle } from "../components/ContinuarConGoogle.jsx";
import {
  AVISO_SOLICITUD, CAMPOS_ACADEMICOS, Campo, CasillaTutor, SelectorTipoDocumento, cambiarCampo, datosAcademicos,
} from "../components/CamposRegistro.jsx";

// Sin rol: todos entran como estudiantes ("Quiero ser tutor" crea una solicitud que revisa un administrador)
const FORMULARIO_INICIAL = {
  nombre: "",
  apellido: "",
  correo: "",
  contrasena: "",
  confirmacion: "",
  ...CAMPOS_ACADEMICOS,
};

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
  const cambiar = cambiarCampo(formulario, setFormulario);

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
      const { solicitud_tutor_pendiente } = await registro({
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        correo: datos.correo.trim(),
        contrasena: datos.contrasena,
        ...datosAcademicos(datos),
      });
      // Con solicitud de tutor: a "Mi perfil", donde verá el estado de la solicitud
      if (solicitud_tutor_pendiente) navegar("/perfil", { replace: true, state: { aviso: AVISO_SOLICITUD } });
      else navegar(ubicacion.state?.desde ?? "/", { replace: true });
    } catch (err) {
      setError(err);
      setEnviando(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="tarjeta p-6 sm:p-8">
        <h1 className="titulo-pagina">Crear cuenta</h1>
        <p className="mt-1 text-sm text-texto-suave">Todos los campos son obligatorios, excepto el celular.</p>

        <div className="mt-6 space-y-4">
          <Alerta error={error} />
          {/* Con Google se ahorra el correo y la contraseña; después pide solo los datos académicos */}
          <ContinuarConGoogle onError={setError} />
          <SeparadorGoogle texto="o con correo y contraseña" />
        </div>

        <form onSubmit={enviar} className="mt-4 space-y-6">

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombre" name="nombre" value={formulario.nombre} onChange={cambiar} autoComplete="given-name" />
            <Campo etiqueta="Apellido" name="apellido" value={formulario.apellido} onChange={cambiar} autoComplete="family-name" />

            <SelectorTipoDocumento value={formulario.id_tipo_documento} onChange={cambiar} tipos={tiposDocumento} />
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

          <CasillaTutor formulario={formulario} onChange={cambiar} />

          <button type="submit" className="btn-primario w-full" aria-busy={enviando} disabled={enviando}>
            {enviando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-texto-suave">
          ¿Ya tiene cuenta?{" "}
          <Link to="/login" state={ubicacion.state} className="font-semibold text-texto underline decoration-acento underline-offset-4">
            Inicie sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
