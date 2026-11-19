import { useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import BotonTema from "./BotonTema.jsx";
import Campanita from "./Campanita.jsx";
import { useCierreExterno } from "../utils/useCierreExterno.js";
import { NOMBRE_ROL, ROL } from "../utils/constantes.js";

// Enlaces del panel del tutor: el tutor los ve sueltos y el administrador, agrupados en «Tutor»
const ENLACES_TUTOR = [
  { a: "/tutor/tutorias", texto: "Mis tutorías" },
  { a: "/tutor/horario", texto: "Mi horario" },
  { a: "/tutor/reservas", texto: "Agenda de tutorías" },
  { a: "/tutor/materias", texto: "Mis materias" },
];

// Enlaces del menú según el rol. null = visitante sin sesión.
// Un elemento con «grupo» es un desplegable en escritorio y una sección con título en el celular.
const ENLACES = {
  invitado: [{ a: "/tutorias", texto: "Tutorías" }],
  // "Mi perfil" está a la vista del estudiante porque desde ahí solicita ser tutor
  [ROL.ESTUDIANTE]: [
    { a: "/tutorias", texto: "Tutorías" },
    { a: "/mis-reservas", texto: "Mi agenda" },
    { a: "/solicitudes", texto: "Pedir tutoría" },
    { a: "/perfil", texto: "Mi perfil" },
  ],
  // El tutor también reserva tutorías de otros, por eso tiene "Mi agenda" además de su panel
  [ROL.TUTOR]: [
    { a: "/tutorias", texto: "Tutorías" },
    ...ENLACES_TUTOR,
    { a: "/mis-reservas", texto: "Mi agenda" },
  ],
  // El administrador es superusuario: reserva como estudiante, ofrece tutorías como tutor y además
  // gestiona los catálogos. Sus menús van agrupados para que quepan.
  [ROL.ADMINISTRADOR]: [
    { a: "/tutorias", texto: "Tutorías" },
    { a: "/mis-reservas", texto: "Mi agenda" },
    { grupo: "Tutor", base: "/tutor", enlaces: ENLACES_TUTOR },
    {
      grupo: "Administración",
      base: "/admin",
      enlaces: [
        { a: "/admin/materias", texto: "Materias" },
        { a: "/admin/recursos", texto: "Recursos" },
        { a: "/admin/solicitudes", texto: "Solicitudes" },
        { a: "/admin/estadisticas", texto: "Estadísticas" },
      ],
    },
  ],
};

// whitespace-nowrap: un enlace nunca se parte en dos líneas; si no caben, se usa el menú (ver xl abajo)
// Desde qué ancho cabe el menú de escritorio. El del tutor (6 enlaces) necesita ~1100 px: con lg
// (1024) los enlaces se apretaban; por debajo de xl (1280) usa el menú de hamburguesa.
// Clases completas (no armadas por partes) para que Tailwind las encuentre.
const DISTRIBUCION = {
  lg: { nav: "hidden flex-1 items-center gap-1 lg:flex", cuenta: "hidden items-center gap-2 lg:flex", soloMovil: "lg:hidden" },
  xl: { nav: "hidden flex-1 items-center gap-1 xl:flex", cuenta: "hidden items-center gap-2 xl:flex", soloMovil: "xl:hidden" },
};

const claseEnlace = ({ isActive }) =>
  `whitespace-nowrap rounded-control px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-barra-texto/10 text-barra-texto" : "text-barra-texto/75 hover:bg-barra-texto/5 hover:text-barra-texto"
  }`;

// Desplegable de escritorio (patrón «disclosure»): botón con aria-expanded y una lista de enlaces.
// Se cierra al elegir un enlace, con Escape (el foco vuelve al botón) o con un clic fuera.
function Desplegable({ grupo, base, enlaces }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);
  const boton = useRef(null);
  const { pathname } = useLocation();
  const cerrar = () => setAbierto(false);
  useCierreExterno(abierto, cerrar, [caja], boton);
  const id = `menu-${base.slice(1)}`;
  return (
    <div ref={caja} className="relative">
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((a) => !a)}
        className={`${claseEnlace({ isActive: pathname.startsWith(`${base}/`) })} inline-flex items-center gap-1`}
      >
        {grupo}
        <svg viewBox="0 0 20 20" className={`size-4 transition-transform ${abierto ? "rotate-180" : ""}`} fill="currentColor" aria-hidden="true">
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
        </svg>
      </button>
      {abierto && (
        <div id={id} className="absolute left-0 top-full z-30 mt-1 flex min-w-48 flex-col gap-1 rounded-control bg-barra p-1 shadow-lg ring-1 ring-barra-texto/10">
          {enlaces.map((e) => (
            <NavLink key={e.a} to={e.a} className={claseEnlace} onClick={cerrar}>
              {e.texto}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BarraNavegacion() {
  const { usuario, logout } = useAuth();
  const navegar = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const barra = useRef(null);
  const botonMenu = useRef(null);

  const enlaces = ENLACES[usuario?.id_rol ?? "invitado"] ?? ENLACES.invitado;
  const d = DISTRIBUCION[usuario?.id_rol === ROL.TUTOR ? "xl" : "lg"];
  const cerrarMenu = () => setMenuAbierto(false);
  // Menú del celular: se cierra con Escape (el foco vuelve al botón) o con un clic fuera de la barra
  useCierreExterno(menuAbierto, cerrarMenu, [barra], botonMenu);

  const cerrarSesion = () => {
    logout();
    cerrarMenu();
    navegar("/login");
  };

  const enlace = (e) => (
    <NavLink key={e.a} to={e.a} className={claseEnlace} onClick={cerrarMenu}>
      {e.texto}
    </NavLink>
  );
  // Escritorio: los grupos son desplegables
  const navegacion = enlaces.map((e) => (e.grupo ? <Desplegable key={e.grupo} {...e} /> : enlace(e)));
  // Celular: los grupos son secciones con título (todo a la vista, sin desplegables anidados)
  const navegacionCelular = enlaces.map((e) =>
    e.grupo ? (
      <div key={e.grupo} role="group" aria-labelledby={`titulo-${e.base.slice(1)}`} className="mt-2 flex flex-col gap-1 border-t border-barra-texto/10 pt-2">
        <p id={`titulo-${e.base.slice(1)}`} className="px-3 text-xs font-semibold uppercase tracking-wide text-barra-texto/60">{e.grupo}</p>
        {e.enlaces.map(enlace)}
      </div>
    ) : (
      enlace(e)
    ),
  );

  const cuenta = usuario ? (
    <>
      {/* El nombre lleva a "Mi perfil" (para todos los roles) */}
      <Link to="/perfil" onClick={cerrarMenu} title="Mi perfil"
        className="whitespace-nowrap rounded-control px-2 py-1 text-sm text-barra-texto/90 hover:bg-barra-texto/10 hover:text-barra-texto">
        {usuario.nombre}{" "}
        <span className="insignia ml-1 bg-acento text-sobre-acento">{NOMBRE_ROL[usuario.id_rol]}</span>
      </Link>
      <button type="button" onClick={cerrarSesion} className="whitespace-nowrap rounded-control px-3 py-2 text-sm font-medium text-barra-texto/75 hover:text-barra-texto">
        Cerrar sesión
      </button>
    </>
  ) : (
    // Un solo botón: se entra con Google y, si es la primera vez, ahí mismo se completa el registro
    <Link to="/login" onClick={cerrarMenu} className="btn bg-acento text-sobre-acento hover:bg-acento/90">
      Iniciar sesión
    </Link>
  );

  return (
    <header ref={barra} className="border-b border-transparent bg-barra text-barra-texto dark:border-borde">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight" onClick={cerrarMenu}>
          <img src="/favicon.svg" alt="" className="size-8" />
          SITA-ES
        </Link>

        {/* Escritorio */}
        <nav className={d.nav}>{navegacion}</nav>

        <div className="flex items-center gap-2">
          {/* Modo claro/oscuro: siempre visible, también en celular y sin sesión (también en el login) */}
          <BotonTema />
          {/* Avisos: solo con sesión; visible también en celular (fuera del menú) */}
          {usuario && <Campanita />}
          <div className={d.cuenta}>{cuenta}</div>

          {/* Móvil: botón de menú */}
          <button
            ref={botonMenu}
            type="button"
            className={`rounded-control p-2 text-barra-texto/80 transition-colors duration-150 hover:bg-barra-texto/10 ${d.soloMovil}`}
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
        <div id="menu-celular" className={`animate-[aparecer_160ms_ease-out] border-t border-barra-texto/10 px-4 pb-4 ${d.soloMovil}`}>
          <nav className="flex flex-col gap-1 py-2">{navegacionCelular}</nav>
          <div className="flex flex-wrap items-center gap-2 border-t border-barra-texto/10 pt-3">{cuenta}</div>
        </div>
      )}
    </header>
  );
}
