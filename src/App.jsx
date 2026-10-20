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
import MisMaterias from "./pages/tutor/MisMaterias.jsx";
import MisTutorias from "./pages/tutor/MisTutorias.jsx";
import NuevaTutoria from "./pages/tutor/NuevaTutoria.jsx";
import GestionTutoria from "./pages/tutor/GestionTutoria.jsx";
import AgendaTutorias from "./pages/tutor/AgendaTutorias.jsx";
import AdminMaterias from "./pages/AdminMaterias.jsx";
import AdminRecursos from "./pages/AdminRecursos.jsx";
import { ROL, ROLES_QUE_RESERVAN } from "./utils/constantes.js";

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

        {/* Panel del tutor */}
        <Route path="tutor" element={<RutaProtegida roles={[ROL.TUTOR]} />}>
          <Route index element={<Navigate to="tutorias" replace />} />
          <Route path="materias" element={<MisMaterias />} />
          <Route path="tutorias" element={<MisTutorias />} />
          <Route path="tutorias/nueva" element={<NuevaTutoria />} />
          <Route path="tutorias/:id" element={<GestionTutoria />} />
          <Route path="reservas" element={<AgendaTutorias />} />
        </Route>

        {/* Panel del administrador */}
        <Route path="admin" element={<RutaProtegida roles={[ROL.ADMINISTRADOR]} />}>
          <Route index element={<Navigate to="materias" replace />} />
          <Route path="materias" element={<AdminMaterias />} />
          <Route path="recursos" element={<AdminRecursos />} />
        </Route>

        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
