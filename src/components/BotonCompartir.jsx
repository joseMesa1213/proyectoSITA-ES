import { useRef, useState } from "react";
import { useAvisos } from "./Avisos.jsx";
import { useCierreExterno } from "../utils/useCierreExterno.js";

// Texto y enlace con que se comparte una tutoría (función pura, para probarla)
export function datosParaCompartir(tutoria, origen = window.location.origin) {
  const url = `${origen}/tutorias/${tutoria.id}`;
  const texto = `Tutoría de ${tutoria.materia.nombre}: «${tutoria.titulo}» en SITA-ES`;
  return { url, texto, whatsapp: `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}` };
}

/**
 * Botón "Compartir" de una tutoría (divulgación). Abre un menú con:
 * - "Compartir…": el menú nativo del teléfono o del sistema (solo si el navegador lo tiene);
 * - "Copiar enlace" al portapapeles;
 * - "WhatsApp" con el texto y el enlace listos.
 * El enlace lleva al detalle público de la tutoría (no hace falta sesión para verla).
 */
export default function BotonCompartir({ tutoria, className = "btn-secundario" }) {
  const avisos = useAvisos();
  const [abierto, setAbierto] = useState(false);
  const boton = useRef(null);
  const menu = useRef(null);
  const cerrar = () => setAbierto(false);
  useCierreExterno(abierto, cerrar, [menu, boton], boton);

  const { url, texto, whatsapp } = datosParaCompartir(tutoria);
  const puedeCompartirNativo = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const compartirNativo = async () => {
    cerrar();
    try {
      await navigator.share({ title: tutoria.titulo, text: texto, url });
    } catch (err) {
      // Cerrar el menú del sistema sin elegir nada no es un error
      if (err?.name !== "AbortError") avisos.error("No se pudo abrir el menú para compartir.");
    }
  };

  const copiar = async () => {
    cerrar();
    try {
      await navigator.clipboard.writeText(url);
      avisos.exito("Enlace copiado. Péguelo donde quiera compartirlo.");
    } catch {
      avisos.error(`No se pudo copiar. El enlace es: ${url}`);
    }
  };

  const opcion = "block w-full px-4 py-2 text-left text-sm hover:bg-texto/5 focus-visible:bg-texto/5";

  return (
    <div className="relative">
      <button ref={boton} type="button" className={className} aria-haspopup="menu" aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}>
        Compartir
      </button>
      {abierto && (
        <div ref={menu} role="menu" aria-label="Compartir tutoría"
          className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-control border border-borde bg-superficie-elevada py-1 shadow-[var(--sombra-flotante)]">
          {puedeCompartirNativo && (
            <button type="button" role="menuitem" className={opcion} onClick={compartirNativo}>Compartir…</button>
          )}
          <button type="button" role="menuitem" className={opcion} onClick={copiar}>Copiar enlace</button>
          <a role="menuitem" className={opcion} href={whatsapp} target="_blank" rel="noreferrer" onClick={cerrar}>
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
