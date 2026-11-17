import { useRef, useState } from "react";
import { useCierreExterno } from "../utils/useCierreExterno.js";
import { archivoIcs, descargarIcs, enlaceGoogleCalendar, nombreArchivo } from "../utils/calendario.js";

/**
 * "Agregar a mi calendario" para una sesión. Menú con:
 * - Google Calendar (abre el evento ya lleno; la persona solo pulsa Guardar);
 * - archivo .ics (Outlook, Apple Calendar y otros), con recordatorio 30 minutos antes.
 * evento: { uid, titulo, fecha, hora_inicio, hora_fin, lugar?, detalles?, url? } (ver utils/calendario.js)
 */
export default function BotonCalendario({ evento, className = "btn-secundario px-3 py-1.5" }) {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef(null);
  const menu = useRef(null);
  const cerrar = () => setAbierto(false);
  useCierreExterno(abierto, cerrar, [menu, boton], boton);

  const descargar = () => {
    cerrar();
    descargarIcs(`${nombreArchivo(evento.titulo)}-${evento.fecha}.ics`, archivoIcs([evento]));
  };

  const opcion = "block w-full px-4 py-2 text-left text-sm hover:bg-texto/5 focus-visible:bg-texto/5";

  return (
    <div className="relative">
      <button ref={boton} type="button" className={className} aria-haspopup="menu" aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}>
        Agregar al calendario
      </button>
      {abierto && (
        <div ref={menu} role="menu" aria-label="Agregar al calendario"
          className="absolute left-0 z-30 mt-2 w-64 overflow-hidden rounded-control border border-borde bg-superficie-elevada py-1 shadow-[var(--sombra-flotante)]">
          <a role="menuitem" className={opcion} href={enlaceGoogleCalendar(evento)} target="_blank" rel="noreferrer" onClick={cerrar}>
            Google Calendar
          </a>
          <button type="button" role="menuitem" className={opcion} onClick={descargar}>
            Outlook, Apple u otro (.ics)
          </button>
        </div>
      )}
    </div>
  );
}
