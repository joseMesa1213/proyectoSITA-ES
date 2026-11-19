import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import Cargando from "./Cargando.jsx";
import { ROL } from "../utils/constantes.js";

/**
 * Envuelve rutas que requieren sesión (y opcionalmente ciertos roles).
 *   <Route element={<RutaProtegida roles={[ROL.TUTOR]} />}> ...rutas hijas... </Route>
 * Sin sesión → /login (y al entrar vuelve a la página que intentaba abrir).
 * Con un rol no permitido → página de inicio. El administrador pasa siempre (superusuario).
 */
export default function RutaProtegida({ roles }) {
  const { usuario, verificando } = useAuth();
  const ubicacion = useLocation();

  if (verificando) return <Cargando texto="Verificando sesión..." />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  // El administrador es superusuario: entra a todas las rutas
  if (roles && usuario.id_rol !== ROL.ADMINISTRADOR && !roles.includes(usuario.id_rol)) return <Navigate to="/" replace />;
  return <Outlet />;
}
