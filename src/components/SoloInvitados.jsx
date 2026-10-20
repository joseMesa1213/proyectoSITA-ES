import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";

// Login y Registro: si ya hay sesión no tiene sentido mostrarlos
export default function SoloInvitados() {
  const { usuario } = useAuth();
  const ubicacion = useLocation();
  return usuario ? <Navigate to={ubicacion.state?.desde ?? "/"} replace /> : <Outlet />;
}
