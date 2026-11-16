import { useState } from "react";
import { CLARO, OSCURO, aplicarTema, guardarTema, temaActual } from "../utils/tema.js";

// Botón de la barra para cambiar entre modo claro y oscuro.
// Muestra una luna en modo claro (para pasar a oscuro) y un sol en modo oscuro (para volver a claro).
// Es un <button>: funciona con Enter y Espacio, y el aria-label dice qué hace al presionarlo.
export default function BotonTema({ className = "" }) {
  // El modo ya lo aplicó index.html antes de pintar: aquí solo se lee
  const [tema, setTema] = useState(temaActual);
  const oscuro = tema === OSCURO;

  const cambiar = () => {
    const nuevo = oscuro ? CLARO : OSCURO;
    aplicarTema(nuevo);
    guardarTema(nuevo);
    setTema(nuevo);
  };

  return (
    <button type="button" onClick={cambiar} aria-label={oscuro ? "Activar modo claro" : "Activar modo oscuro"}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className={`rounded-control p-2 text-barra-texto/80 transition-colors duration-150 hover:bg-barra-texto/10 hover:text-barra-texto ${className}`}>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true">
        {oscuro ? (
          // Sol
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </>
        ) : (
          // Luna
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        )}
      </svg>
    </button>
  );
}
