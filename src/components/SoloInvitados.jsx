import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";

// Login y "Completa tu registro": si ya hay sesión no tiene sentido mostrarlos.
// Solo redirige a quien ENTRA a estas páginas con la sesión ya iniciada. Si la persona inicia sesión
// o se registra aquí mismo, la propia página decide a dónde ir (por ejemplo, a "Mi perfil" cuando
// quedó una solicitud de tutor en revisión): así las dos redirecciones no compiten.
export default function SoloInvitados() {
  const { usuario } = useAuth();
  const ubicacion = useLocation();
  const [entroConSesion] = useState(() => Boolean(usuario));
  return entroConSesion ? <Navigate to={ubicacion.state?.desde ?? "/"} replace /> : <Outlet />;
}
