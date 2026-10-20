import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { NOMBRE_ROL, ROL } from "../utils/constantes.js";

// Enlaces del menú según el rol. null = visitante sin sesión.
const ENLACES = {
  invitado: [{ a: "/tutorias", texto: "Tutorías" }],
  [ROL.ESTUDIANTE]: [
    { a: "/tutorias", texto: "Tutorías" },
    { a: "/mis-reservas", texto: "Mi agenda" },
  ],
  // El tutor también reserva tutorías de otros, por eso tiene "Mi agenda" además de su panel
  [ROL.TUTOR]: [
    { a: "/tutorias", texto: "Tutorías" },
    { a: "/tutor/tutorias", texto: "Mis tutorías" },
    { a: "/tutor/reservas", texto: "Reservas recibidas" },
    { a: "/tutor/materias", texto: "Mis materias" },
    { a: "/mis-reservas", texto: "Mi agenda" },
    { a: "/tutor/materias", texto: "Mis materias" },
    { a: "/tutor/tutorias", texto: "Mis tutorías" },
    { a: "/tutor/reservas", texto: "Agenda de tutorías" },
  ],
  // El administrador no reserva: gestiona los catálogos que usan tutores y estudiantes
  [ROL.ADMINISTRADOR]: [
    { a: "/tutorias", texto: "Tutorías" },
    { a: "/admin/materias", texto: "Materias" },
    { a: "/admin/recursos", texto: "Recursos" },
  ],
};

const claseEnlace = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/5 hover:text-white"
  }`;

export default function BarraNavegacion() {
  const { usuario, logout } = useAuth();
  const navegar = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlaces = ENLACES[usuario?.id_rol ?? "invitado"] ?? ENLACES.invitado;
  const cerrarMenu = () => setMenuAbierto(false);

  const cerrarSesion = () => {
    logout();
    cerrarMenu();
    navegar("/login");
  };

  const navegacion = enlaces.map((e) => (
    <NavLink key={e.a} to={e.a} className={claseEnlace} onClick={cerrarMenu}>
      {e.texto}
    </NavLink>
  ));

  const cuenta = usuario ? (
    <>
      <span className="text-sm text-white/90">
        {usuario.nombre}{" "}
        <span className="insignia ml-1 bg-acento text-bosque">{NOMBRE_ROL[usuario.id_rol]}</span>
      </span>
      <button type="button" onClick={cerrarSesion} className="rounded-md px-3 py-2 text-sm font-medium text-white/75 hover:text-white">
        Cerrar sesión
      </button>
    </>
  ) : (
    <>
      <NavLink to="/login" className={claseEnlace} onClick={cerrarMenu}>
        Iniciar sesión
      </NavLink>
      <Link to="/registro" onClick={cerrarMenu} className="btn bg-acento text-bosque hover:bg-acento/90">
        Registrarse
      </Link>
    </>
  );

  return (
    <header className="bg-bosque text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight" onClick={cerrarMenu}>
          <img src="/favicon.svg" alt="" className="size-8" />
          SITA-ES
        </Link>

        {/* Escritorio */}
        <nav className="hidden flex-1 items-center gap-1 lg:flex">{navegacion}</nav>
        <div className="hidden items-center gap-2 lg:flex">{cuenta}</div>

        {/* Móvil: botón de menú */}
        <button
          type="button"
          className="rounded-md p-2 text-white/80 hover:bg-white/10 lg:hidden"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-expanded={menuAbierto}
          aria-label="Abrir menú"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={menuAbierto ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
          </svg>
        </button>
      </div>

      {menuAbierto && (
        <div className="border-t border-white/10 px-4 pb-4 lg:hidden">
          <nav className="flex flex-col gap-1 py-2">{navegacion}</nav>
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">{cuenta}</div>
        </div>
      )}
    </header>
  );
}
