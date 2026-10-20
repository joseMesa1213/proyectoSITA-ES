import { Navigate, Route, Routes } from "react-router";
import Layout from "./components/Layout.jsx";
import RutaProtegida from "./components/RutaProtegida.jsx";
import SoloInvitados from "./components/SoloInvitados.jsx";
import Login from "./pages/Login.jsx";
import Registro from "./pages/Registro.jsx";
import Catalogo from "./pages/Catalogo.jsx";
import DetalleTutoria from "./pages/DetalleTutoria.jsx";
import Reservar from "./pages/Reservar.jsx";
import MisReservas from "./pages/MisReservas.jsx";
import NoEncontrada from "./pages/NoEncontrada.jsx";
import { ROLES_QUE_RESERVAN } from "./utils/constantes.js";

// Mapa de rutas de la aplicación
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/tutorias" replace />} />

        {/* Públicas */}
        <Route path="tutorias" element={<Catalogo />} />
        <Route path="tutorias/:id" element={<DetalleTutoria />} />

        {/* Solo sin sesión */}
        <Route element={<SoloInvitados />}>
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Registro />} />
        </Route>

        {/* Quienes reservan: Estudiante y Tutor (el administrador no) */}
        <Route element={<RutaProtegida roles={ROLES_QUE_RESERVAN} />}>
          <Route path="tutorias/:id/reservar" element={<Reservar />} />
          <Route path="mis-reservas" element={<MisReservas />} />
        </Route>

        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
