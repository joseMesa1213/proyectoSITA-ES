import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import Alerta from "../components/Alerta.jsx";
import ContinuarConGoogle, { SeparadorGoogle, googleDisponible } from "../components/ContinuarConGoogle.jsx";

export default function Login() {
  const { login, avisoSesion } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(correo, contrasena);
      // Si venía de una página protegida (ej. Reservar), vuelve a ella
      navegar(ubicacion.state?.desde ?? "/", { replace: true });
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="tarjeta p-8">
        <h1 className="titulo-pagina">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-texto-suave">Ingrese con su correo institucional.</p>

        <div className="mt-6 space-y-4">
          {avisoSesion && !error && <Alerta>{avisoSesion}</Alerta>}
          <Alerta error={error} />
        </div>

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

        {/* Primero el formulario (lo que usa la mayoría); Google queda como alternativa debajo */}
        {googleDisponible && (
          <div className="mt-6 space-y-4">
            <SeparadorGoogle />
            <ContinuarConGoogle onError={setError} />
            {/* Quien se registró con Google no tiene contraseña: su cuenta guarda una aleatoria */}
            <p className="text-center text-xs text-texto-suave">Si se registró con Google, ingrese siempre con este botón.</p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-texto-suave">
          ¿No tiene cuenta?{" "}
          <Link to="/registro" state={ubicacion.state} className="font-semibold text-texto underline decoration-acento underline-offset-4">
            Regístrese
          </Link>
        </p>
      </div>
    </div>
  );
}
