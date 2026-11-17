import { Navigate, Route, Routes } from "react-router";
import Layout from "./components/Layout.jsx";
import RutaProtegida from "./components/RutaProtegida.jsx";
import SoloInvitados from "./components/SoloInvitados.jsx";
import Login from "./pages/Login.jsx";
import CompletarRegistroGoogle from "./pages/CompletarRegistroGoogle.jsx";
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
import MiHorario from "./pages/tutor/MiHorario.jsx";
import SolicitudesEstudiantes from "./pages/tutor/SolicitudesEstudiantes.jsx";
import PedirTutoria from "./pages/PedirTutoria.jsx";
import AdminEstadisticas from "./pages/AdminEstadisticas.jsx";
import AdminMaterias from "./pages/AdminMaterias.jsx";
import AdminRecursos from "./pages/AdminRecursos.jsx";
import AdminSolicitudes from "./pages/AdminSolicitudes.jsx";
import Perfil from "./pages/Perfil.jsx";
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
          {/* El registro es con Google: la página de formulario ya no existe (enlaces viejos van al login) */}
          <Route path="registro" element={<Navigate to="/login" replace />} />
          <Route path="registro/google" element={<CompletarRegistroGoogle />} />
        </Route>

        {/* Quienes reservan: Estudiante y Tutor (el administrador no) */}
        {/* Cualquier usuario con sesión */}
        <Route element={<RutaProtegida />}>
          <Route path="perfil" element={<Perfil />} />
        </Route>

        <Route element={<RutaProtegida roles={ROLES_QUE_RESERVAN} />}>
          <Route path="tutorias/:id/reservar" element={<Reservar />} />
          <Route path="mis-reservas" element={<MisReservas />} />
          <Route path="solicitudes" element={<PedirTutoria />} />
        </Route>

        {/* Panel del tutor */}
        <Route path="tutor" element={<RutaProtegida roles={[ROL.TUTOR]} />}>
          <Route index element={<Navigate to="tutorias" replace />} />
          <Route path="materias" element={<MisMaterias />} />
          <Route path="tutorias" element={<MisTutorias />} />
          <Route path="tutorias/nueva" element={<NuevaTutoria />} />
          <Route path="tutorias/:id" element={<GestionTutoria />} />
          <Route path="reservas" element={<AgendaTutorias />} />
          <Route path="horario" element={<MiHorario />} />
          <Route path="solicitudes" element={<SolicitudesEstudiantes />} />
        </Route>

        {/* Panel del administrador */}
        <Route path="admin" element={<RutaProtegida roles={[ROL.ADMINISTRADOR]} />}>
          <Route index element={<Navigate to="materias" replace />} />
          <Route path="materias" element={<AdminMaterias />} />
          <Route path="recursos" element={<AdminRecursos />} />
          <Route path="solicitudes" element={<AdminSolicitudes />} />
          <Route path="estadisticas" element={<AdminEstadisticas />} />
        </Route>

        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
