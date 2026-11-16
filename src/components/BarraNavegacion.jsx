import { useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import BotonTema from "./BotonTema.jsx";
import { useCierreExterno } from "../utils/useCierreExterno.js";
import { NOMBRE_ROL, ROL } from "../utils/constantes.js";

// Enlaces del menú según el rol. null = visitante sin sesión.
const ENLACES = {
  invitado: [{ a: "/tutorias", texto: "Tutorías" }],
  // "Mi perfil" está a la vista del estudiante porque desde ahí solicita ser tutor
  [ROL.ESTUDIANTE]: [
    { a: "/tutorias", texto: "Tutorías" },
    { a: "/mis-reservas", texto: "Mi agenda" },
    { a: "/perfil", texto: "Mi perfil" },
  ],
  // El tutor también reserva tutorías de otros, por eso tiene "Mi agenda" además de su panel
  [ROL.TUTOR]: [
    { a: "/tutorias", texto: "Tutorías" },
    { a: "/tutor/tutorias", texto: "Mis tutorías" },
    { a: "/tutor/reservas", texto: "Agenda de tutorías" },
    { a: "/tutor/materias", texto: "Mis materias" },
    { a: "/mis-reservas", texto: "Mi agenda" },
  ],
  // El administrador no reserva: gestiona los catálogos que usan tutores y estudiantes
  [ROL.ADMINISTRADOR]: [
    { a: "/tutorias", texto: "Tutorías" },
    { a: "/admin/materias", texto: "Materias" },
    { a: "/admin/recursos", texto: "Recursos" },
    { a: "/admin/solicitudes", texto: "Solicitudes" },
  ],
};

const claseEnlace = ({ isActive }) =>
  `rounded-control px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-barra-texto/10 text-barra-texto" : "text-barra-texto/75 hover:bg-barra-texto/5 hover:text-barra-texto"
  }`;

export default function BarraNavegacion() {
  const { usuario, logout } = useAuth();
  const navegar = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const barra = useRef(null);
  const botonMenu = useRef(null);

  const enlaces = ENLACES[usuario?.id_rol ?? "invitado"] ?? ENLACES.invitado;
  const cerrarMenu = () => setMenuAbierto(false);
  // Menú del celular: se cierra con Escape (el foco vuelve al botón) o con un clic fuera de la barra
  useCierreExterno(menuAbierto, cerrarMenu, [barra], botonMenu);

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
      {/* El nombre lleva a "Mi perfil" (para todos los roles) */}
      <Link to="/perfil" onClick={cerrarMenu} title="Mi perfil"
        className="rounded-control px-2 py-1 text-sm text-barra-texto/90 hover:bg-barra-texto/10 hover:text-barra-texto">
        {usuario.nombre}{" "}
        <span className="insignia ml-1 bg-acento text-sobre-acento">{NOMBRE_ROL[usuario.id_rol]}</span>
      </Link>
      <button type="button" onClick={cerrarSesion} className="rounded-control px-3 py-2 text-sm font-medium text-barra-texto/75 hover:text-barra-texto">
        Cerrar sesión
      </button>
    </>
  ) : (
    <>
      <NavLink to="/login" className={claseEnlace} onClick={cerrarMenu}>
        Iniciar sesión
      </NavLink>
      <Link to="/registro" onClick={cerrarMenu} className="btn bg-acento text-sobre-acento hover:bg-acento/90">
        Registrarse
      </Link>
    </>
  );

  return (
    <header ref={barra} className="border-b border-transparent bg-barra text-barra-texto dark:border-borde">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight" onClick={cerrarMenu}>
          <img src="/favicon.svg" alt="" className="size-8" />
          SITA-ES
        </Link>

        {/* Escritorio */}
        <nav className="hidden flex-1 items-center gap-1 lg:flex">{navegacion}</nav>

        <div className="flex items-center gap-2">
          {/* Modo claro/oscuro: siempre visible, también en celular y sin sesión (login y registro) */}
          <BotonTema />
          <div className="hidden items-center gap-2 lg:flex">{cuenta}</div>

          {/* Móvil: botón de menú */}
          <button
            ref={botonMenu}
            type="button"
            className="rounded-control p-2 text-barra-texto/80 transition-colors duration-150 hover:bg-barra-texto/10 lg:hidden"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-expanded={menuAbierto}
            aria-controls="menu-celular"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={menuAbierto ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>

      {menuAbierto && (
        <div id="menu-celular" className="animate-[aparecer_160ms_ease-out] border-t border-barra-texto/10 px-4 pb-4 lg:hidden">
          <nav className="flex flex-col gap-1 py-2">{navegacion}</nav>
          <div className="flex flex-wrap items-center gap-2 border-t border-barra-texto/10 pt-3">{cuenta}</div>
        </div>
      )}
    </header>
  );
}
