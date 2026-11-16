import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";

// Botón "Continuar con Google" (Google Identity Services, script oficial: sin librerías extra).
// 1. Google muestra su botón y, al elegir la cuenta, entrega un ID token (credential).
// 2. Se envía al backend (POST /auth/google), que lo verifica.
// 3. Si la persona ya tiene cuenta → entra. Si es nueva → va a "Completa tu registro".
// Sin VITE_GOOGLE_CLIENT_ID el botón no aparece y el login con correo sigue igual.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const URL_SCRIPT = "https://accounts.google.com/gsi/client";

// El script de Google se carga una sola vez para toda la app
let cargaDelScript = null;
function cargarScriptGoogle() {
  cargaDelScript ??= new Promise((resolver, rechazar) => {
    const script = document.createElement("script");
    script.src = URL_SCRIPT;
    script.async = true;
    script.onload = () => resolver(window.google);
    script.onerror = () => {
      cargaDelScript = null; // se reintenta la próxima vez
      rechazar(new Error("No se pudo cargar el botón de Google. Revise su conexión e intente de nuevo."));
    };
    document.head.appendChild(script);
  });
  return cargaDelScript;
}

/**
 * onError(error | null): la página muestra el error con su <Alerta> (null = limpiar).
 * texto: el texto que Google pone en su botón ("continue_with" = "Continuar con Google").
 *        Se usa el mismo en Login y Registro: "signup_with" Google lo traduce como "Acceder con Google".
 */
export default function ContinuarConGoogle({ onError, texto = "continue_with" }) {
  const { loginConGoogle } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const contenedor = useRef(null);
  const [procesando, setProcesando] = useState(false);

  // Google llama a esta función al elegir la cuenta. Se guarda en una ref para que use
  // siempre los valores actuales sin tener que volver a dibujar el botón.
  const alRecibirCredencial = useRef(null);
  alRecibirCredencial.current = async ({ credential }) => {
    onError?.(null);
    setProcesando(true);
    try {
      const respuesta = await loginConGoogle(credential);
      const desde = ubicacion.state?.desde;
      if (respuesta.registro_pendiente) {
        // Los datos de Google y el token de registro viajan en memoria (no en localStorage)
        navegar("/registro/google", { state: { registro: respuesta, desde } });
      } else {
        navegar(desde ?? "/", { replace: true });
      }
    } catch (error) {
      onError?.(error);
    } finally {
      setProcesando(false);
    }
  };

  useEffect(() => {
    if (!CLIENT_ID) return;
    let vigente = true;
    cargarScriptGoogle()
      .then((google) => {
        const caja = contenedor.current;
        if (!vigente || !caja) return;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (respuesta) => alRecibirCredencial.current(respuesta),
        });
        caja.replaceChildren(); // evita botones duplicados si el componente se vuelve a montar
        google.accounts.id.renderButton(caja, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: texto,
          locale: "es",
          width: Math.min(400, caja.offsetWidth || 320), // Google acepta hasta 400 px
        });
      })
      .catch((error) => vigente && onError?.(error));
    return () => {
      vigente = false;
    };
    // onError no va en las dependencias: si cambia, no hace falta volver a dibujar el botón
  }, [texto]);

  if (!CLIENT_ID) return null;

  return (
    <div>
      {/* Google dibuja aquí su botón; min-h evita que la página "salte" mientras carga */}
      <div ref={contenedor} className="flex min-h-11 justify-center" />
      {procesando && (
        <p className="mt-2 text-center text-sm text-bosque/70" role="status">Verificando su cuenta de Google...</p>
      )}
    </div>
  );
}

// Línea "o" entre el botón de Google y el formulario. Solo aparece si el botón está activo.
export function SeparadorGoogle({ texto = "o" }) {
  if (!CLIENT_ID) return null;
  return (
    <div className="flex items-center gap-3 text-xs text-bosque/50" aria-hidden="true">
      <span className="h-px flex-1 bg-bosque/15" />
      {texto}
      <span className="h-px flex-1 bg-bosque/15" />
    </div>
  );
}

export const googleDisponible = Boolean(CLIENT_ID);
