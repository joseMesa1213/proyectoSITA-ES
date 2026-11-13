import { Outlet } from "react-router";
import Asistente from "./Asistente.jsx";
import BarraNavegacion from "./BarraNavegacion.jsx";

// Estructura común a todas las páginas: barra arriba, contenido al centro, pie abajo
// y el asistente flotante en la esquina
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <BarraNavegacion />
      {/* pb-24: espacio para que el botón flotante del asistente no tape lo último de la página */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-24">
        <Outlet />
      </main>
      <footer className="border-t border-bosque/10 py-4 text-center text-xs text-bosque/60">
        SITA-ES · Proyecto Integrador I · Universidad de Antioquia
      </footer>
      <Asistente />
    </div>
  );
}
