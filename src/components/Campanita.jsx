import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { listarNotificaciones, marcarNotificacionLeida, marcarTodasLeidas } from "../api/notificaciones.js";
import { useCierreExterno } from "../utils/useCierreExterno.js";
import { haceCuanto, INTERVALO_CONSULTA_MS, textoInsignia } from "../utils/notificaciones.js";

/**
 * Campanita de avisos (solo con sesión). Muestra cuántos hay sin leer y, al abrirla, la lista.
 * - Consulta GET /notificaciones cada minuto mientras la pestaña está visible, al volver a ella,
 *   al cambiar de pantalla y al abrir el panel. Si falla, no molesta: lo intenta en la siguiente.
 * - Pulsar un aviso lo marca como leído y lleva a su pantalla.
 * - En celular el panel ocupa el ancho de la pantalla (con margen); en escritorio cuelga de la campana.
 */
export default function Campanita() {
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [datos, setDatos] = useState({ no_leidas: 0, notificaciones: [] });
  const [cargado, setCargado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const boton = useRef(null);
  const panel = useRef(null);
  const cerrar = () => setAbierto(false);
  useCierreExterno(abierto, cerrar, [panel, boton], boton);

  const consultar = useCallback(() => {
    if (document.hidden) return;
    listarNotificaciones()
      .then((d) => {
        setDatos(d);
        setCargado(true);
      })
      .catch(() => {}); // sin conexión o servidor dormido: se reintenta en la próxima consulta
  }, []);

  useEffect(() => {
    consultar();
  }, [consultar, pathname]);

  useEffect(() => {
    const intervalo = setInterval(consultar, INTERVALO_CONSULTA_MS);
    document.addEventListener("visibilitychange", consultar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", consultar);
    };
  }, [consultar]);

  const alternar = () => {
    if (!abierto) consultar();
    setAbierto(!abierto);
  };

  // Se marca en pantalla de inmediato; si el servidor falla, la próxima consulta lo corrige
  const abrirAviso = (aviso) => {
    cerrar();
    if (!aviso.leida) {
      setDatos((d) => ({
        no_leidas: Math.max(0, d.no_leidas - 1),
        notificaciones: d.notificaciones.map((n) => (n.id === aviso.id ? { ...n, leida: true } : n)),
      }));
      marcarNotificacionLeida(aviso.id).catch(() => {});
    }
    if (aviso.enlace) navegar(aviso.enlace);
  };

  const leerTodas = () => {
    setDatos((d) => ({ no_leidas: 0, notificaciones: d.notificaciones.map((n) => ({ ...n, leida: true })) }));
    marcarTodasLeidas().catch(() => {});
  };

  const { no_leidas, notificaciones } = datos;
  const etiqueta = no_leidas > 0 ? `Notificaciones: ${no_leidas} sin leer` : "Notificaciones";

  return (
    <div className="relative">
      <button ref={boton} type="button" onClick={alternar} aria-label={etiqueta} title="Notificaciones"
        aria-expanded={abierto} aria-controls="panel-notificaciones"
        className="relative rounded-control p-2 text-barra-texto/80 transition-colors duration-150 hover:bg-barra-texto/10 hover:text-barra-texto">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {no_leidas > 0 && (
          <span aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-acento px-1 text-[11px] font-bold leading-none text-sobre-acento">
            {textoInsignia(no_leidas)}
          </span>
        )}
      </button>

      {abierto && (
        <section ref={panel} id="panel-notificaciones" aria-label="Notificaciones"
          className="fixed inset-x-4 top-16 z-40 animate-[aparecer_160ms_ease-out] overflow-hidden rounded-tarjeta border border-borde bg-superficie-elevada text-texto shadow-flotante sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between gap-3 border-b border-borde px-4 py-3">
            <h2 className="font-semibold">Notificaciones</h2>
            {no_leidas > 0 && (
              <button type="button" onClick={leerTodas} className="text-sm font-medium text-texto-suave underline-offset-4 hover:text-texto hover:underline">
                Marcar todas como leídas
              </button>
            )}
          </div>

          {!cargado ? (
            <p className="px-4 py-6 text-center text-sm text-texto-suave">Cargando...</p>
          ) : notificaciones.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-texto-suave">No tiene notificaciones.</p>
          ) : (
            <ul className="max-h-[min(28rem,70vh)] divide-y divide-borde overflow-y-auto">
              {notificaciones.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => abrirAviso(n)}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-texto/5 focus-visible:bg-texto/5 ${n.leida ? "" : "bg-acento/5"}`}>
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.leida ? "bg-transparent" : "bg-acento"}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${n.leida ? "text-texto-suave" : "font-semibold"}`}>
                        {!n.leida && <span className="sr-only">Sin leer: </span>}
                        {n.titulo}
                      </span>
                      {n.mensaje && <span className="mt-0.5 block text-sm text-texto-suave">{n.mensaje}</span>}
                      <span className="mt-1 block text-xs text-texto-suave">{haceCuanto(n.fecha)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
