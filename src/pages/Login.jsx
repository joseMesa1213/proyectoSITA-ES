import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import Alerta from "../components/Alerta.jsx";
import ContinuarConGoogle, { googleDisponible } from "../components/ContinuarConGoogle.jsx";

// En SITA-ES solo se entra con Google @udea.edu.co (también los administradores). La primera vez,
// ContinuarConGoogle lleva a "Completa tu registro": no hay página de registro aparte.
// El formulario de correo y contraseña es SOLO PARA DESARROLLO (cuentas de la semilla): aparece con
// VITE_LOGIN_CONTRASENA=true en el .env local y necesita LOGIN_CONTRASENA=true en el backend.
// En producción no se define, y aunque alguien lo encendiera, el backend respondería 403.
export const loginConContrasena = import.meta.env.VITE_LOGIN_CONTRASENA === "true";

export default function Login() {
  const { avisoSesion } = useAuth();
  const [error, setError] = useState(null);

  return (
    <div className="mx-auto max-w-md">
      <div className="tarjeta p-8">
        <h1 className="titulo-pagina">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-texto-suave">
          Ingrese con su cuenta de Google <strong className="font-semibold text-texto">@udea.edu.co</strong>.
          Si es la primera vez, después completará sus datos.
        </p>

        <div className="mt-6 space-y-4">
          {avisoSesion && !error && <Alerta>{avisoSesion}</Alerta>}
          <Alerta error={error} />
        </div>

        {googleDisponible && (
          <div className="mt-4">
            <ContinuarConGoogle onError={setError} />
          </div>
        )}

        {/* Sin VITE_GOOGLE_CLIENT_ID (y sin el formulario de desarrollo) no habría ninguna forma de entrar */}
        {!googleDisponible && !loginConContrasena && (
          <div className="mt-4">
            <Alerta tipo="error">
              El inicio de sesión con Google no está configurado (falta VITE_GOOGLE_CLIENT_ID). Avise a la coordinación.
            </Alerta>
          </div>
        )}

        {loginConContrasena && <FormularioDesarrollo onError={setError} />}
      </div>
    </div>
  );
}

// Correo y contraseña: solo desarrollo (ver arriba)
function FormularioDesarrollo({ onError }) {
  const { login } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    onError(null);
    setEnviando(true);
    try {
      await login(correo, contrasena);
      // Si venía de una página protegida (ej. Reservar), vuelve a ella
      navegar(ubicacion.state?.desde ?? "/", { replace: true });
    } catch (err) {
      onError(err);
      setEnviando(false);
    }
  };

  return (
    <section aria-labelledby="titulo-desarrollo" className="mt-8 rounded-control border border-dashed border-borde p-4">
      <h2 id="titulo-desarrollo" className="flex items-center gap-2 text-sm font-semibold text-texto">
        <span className="insignia bg-acento text-sobre-acento">Solo desarrollo</span>
        Correo y contraseña
      </h2>
      <p className="mt-1 text-xs text-texto-suave">
        Para las cuentas de la semilla. Necesita LOGIN_CONTRASENA=true en el backend; en producción no existe.
      </p>
      <form onSubmit={enviar} className="mt-4 space-y-4">
        <div>
          <label htmlFor="correo" className="etiqueta">Correo</label>
          <input id="correo" type="email" className="campo" autoComplete="email" required
            value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </div>
        <div>
          <label htmlFor="contrasena" className="etiqueta">Contraseña</label>
          <input id="contrasena" type="password" className="campo" autoComplete="current-password" required
            value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
        </div>
        <button type="submit" className="btn-primario w-full" aria-busy={enviando} disabled={enviando}>
          {enviando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </section>
  );
}
