import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { listarTiposDocumento } from "../api/catalogos.js";
import Alerta from "../components/Alerta.jsx";
import ContinuarConGoogle from "../components/ContinuarConGoogle.jsx";
import { Campo, SelectorRol, SelectorTipoDocumento, datosAcademicos } from "../components/CamposRegistro.jsx";
import { ROL } from "../utils/constantes.js";

// "Completa tu registro": la persona entró con Google pero aún no tiene cuenta en SITA-ES.
// El correo viene de Google y no se puede cambiar (el backend lo toma del token, no de este formulario).
// Nombre y apellido llegan llenos pero se pueden corregir: algunas cuentas de Google no traen apellido.
export default function CompletarRegistroGoogle() {
  const ubicacion = useLocation();
  // Llega desde ContinuarConGoogle. Si se recarga la página se pierde (vive en memoria) y hay que volver a empezar.
  const registro = ubicacion.state?.registro;

  if (!registro) {
    return (
      <div className="mx-auto max-w-md">
        <div className="tarjeta space-y-4 p-8">
          <h1 className="text-2xl font-bold">Completa tu registro</h1>
          <Alerta>Para completar el registro, primero continúe con su cuenta de Google.</Alerta>
          <Link to="/registro" className="btn-primario w-full">Ir a crear cuenta</Link>
        </div>
      </div>
    );
  }
  // key: con otra cuenta de Google el formulario empieza de cero; con la misma (por ejemplo, al
  // renovar un token vencido) conserva lo que ya se escribió
  return <FormularioCompletar key={registro.perfil.correo} registro={registro} desde={ubicacion.state?.desde} />;
}

function FormularioCompletar({ registro, desde }) {
  const { registroConGoogle } = useAuth();
  const navegar = useNavigate();

  const [formulario, setFormulario] = useState(() => ({
    nombre: registro.perfil.nombre ?? "",
    apellido: registro.perfil.apellido ?? "",
    id_rol: String(ROL.ESTUDIANTE),
    id_tipo_documento: "",
    num_documento: "",
    nombre_programa: "",
    semestre: "",
    celular: "",
  }));
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    listarTiposDocumento().then(setTiposDocumento).catch(setError);
  }, []);

  const cambiar = (evento) => setFormulario({ ...formulario, [evento.target.name]: evento.target.value });

  const enviar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await registroConGoogle({
        token_registro: registro.token_registro,
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        ...datosAcademicos(formulario),
      });
      navegar(desde ?? "/", { replace: true });
    } catch (err) {
      setError(err);
      setEnviando(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // 401 = pasaron los 15 minutos o el token no sirve: se puede volver a continuar con Google
  // sin perder lo escrito (el formulario conserva su estado y llega un token nuevo)
  const vencido = error?.status === 401;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="tarjeta p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Completa tu registro</h1>
        <p className="mt-1 text-sm text-bosque/70">
          Ya verificamos su cuenta de Google. Faltan unos datos académicos (tiene 15 minutos para terminar).
        </p>

        <form onSubmit={enviar} className="mt-6 space-y-6">
          <Alerta error={error} />
          {vencido && <ContinuarConGoogle onError={setError} />}

          <SelectorRol value={formulario.id_rol} onChange={cambiar} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="correo-google" className="etiqueta">Correo (de su cuenta de Google)</label>
              <input id="correo-google" className="campo cursor-not-allowed bg-crema text-bosque/70" value={registro.perfil.correo}
                readOnly aria-describedby="correo-google-ayuda" />
              <p id="correo-google-ayuda" className="mt-1 text-xs text-bosque/60">
                Con esta cuenta entrará siempre con el botón de Google.
              </p>
            </div>
            <Campo etiqueta="Nombre" name="nombre" value={formulario.nombre} onChange={cambiar} autoComplete="given-name" />
            <Campo etiqueta="Apellido" name="apellido" value={formulario.apellido} onChange={cambiar} autoComplete="family-name" />

            <SelectorTipoDocumento value={formulario.id_tipo_documento} onChange={cambiar} tipos={tiposDocumento} />
            <Campo etiqueta="Número de documento" name="num_documento" value={formulario.num_documento} onChange={cambiar} inputMode="numeric" />

            <Campo etiqueta="Programa académico" name="nombre_programa" value={formulario.nombre_programa} onChange={cambiar}
              placeholder="Ej. Ingeniería de Sistemas" />
            <Campo etiqueta="Semestre" name="semestre" type="number" min="1" max="12" value={formulario.semestre} onChange={cambiar} />

            <Campo etiqueta="Celular (opcional)" name="celular" type="tel" value={formulario.celular} onChange={cambiar}
              required={false} autoComplete="tel" />
          </div>

          <button type="submit" className="btn-primario w-full" disabled={enviando}>
            {enviando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
