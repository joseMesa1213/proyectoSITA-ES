import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router";
import Asistente from "./Asistente.jsx";
import BarraNavegacion from "./BarraNavegacion.jsx";
import { tituloCompleto, tituloDeRuta } from "../utils/titulos.js";

// Estructura común a todas las páginas: barra arriba, contenido al centro, pie abajo
// y el asistente flotante en la esquina
export default function Layout() {
  const contenido = useRef(null);
  useCambioDePantalla(contenido);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Primer elemento al presionar Tab: permite saltarse la barra de navegación */}
      {/* El relleno va en el span: not-sr-only pone el padding del enlace en 0 */}
      <a href="#contenido"
        className="sr-only z-[70] rounded-control bg-superficie-elevada font-semibold text-texto shadow-flotante focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        <span className="block px-4 py-2">Saltar al contenido</span>
      </a>
      <BarraNavegacion />
      {/* pb-24: espacio para que el botón flotante del asistente no tape lo último de la página.
          tabIndex={-1}: recibe el foco por código al cambiar de pantalla, pero no al tabular */}
      <main id="contenido" ref={contenido} tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-24 outline-none">
        <Outlet />
      </main>
      <footer className="border-t border-borde py-4 text-center text-xs text-texto-suave">
        SITA-ES · Proyecto Integrador I · Universidad de Antioquia
      </footer>
      <Asistente />
    </div>
  );
}

// Al pasar a otra pantalla (cambia la ruta, no los filtros del catálogo):
// 1. Título de la pestaña según la ruta (las pantallas con datos lo afinan con useTituloPagina).
// 2. Vuelve arriba: sin esto, la página nueva se abre a la altura donde iba la anterior.
// 3. El foco pasa al contenido, para que el teclado y el lector de pantalla empiecen en la
//    pantalla nueva y no en el enlace del menú que se acaba de usar.
// En la primera carga no se mueve el foco: el navegador ya empieza desde el principio.
// Se compara con la ruta anterior (y no con un "primera vez") porque en desarrollo StrictMode
// ejecuta los efectos dos veces al montar.
export function useCambioDePantalla(contenido) {
  const { pathname } = useLocation();
  const rutaAnterior = useRef(pathname);

  useEffect(() => {
    document.title = tituloCompleto(tituloDeRuta(pathname));
    if (rutaAnterior.current === pathname) return;
    rutaAnterior.current = pathname;
    window.scrollTo(0, 0);
    contenido.current?.focus({ preventScroll: true });
  }, [pathname, contenido]);
}
