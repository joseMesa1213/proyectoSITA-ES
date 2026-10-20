import { Outlet } from "react-router";
import BarraNavegacion from "./BarraNavegacion.jsx";

// Estructura común a todas las páginas: barra arriba, contenido al centro, pie abajo
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <BarraNavegacion />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-bosque/10 py-4 text-center text-xs text-bosque/60">
        SITA-ES · Proyecto Integrador I · Universidad de Antioquia
      </footer>
    </div>
  );
}
