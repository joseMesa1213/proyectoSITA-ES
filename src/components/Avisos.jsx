import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

// Avisos tipo "toast" para el RESULTADO de una acción ("Reserva cancelada", "No se pudo aprobar").
// Los errores de un formulario NO van aquí: se quedan junto al formulario, donde la persona los
// necesita mientras corrige los datos.
//
// Uso:
//   const avisos = useAvisos();
//   avisos.exito("Reserva cancelada.");
//   avisos.error(err);            // un Error (usa err.message) o un texto
//
// - Desaparecen solos (más tiempo si el texto es largo); el tiempo se detiene con el ratón encima.
// - Se cierran con la X, con Escape o con un clic afuera.
// - Los de éxito se anuncian con role="status"; los errores con role="alert".

const AvisosContext = createContext(null);
const MAXIMO_VISIBLES = 3;
let siguienteId = 0;

// 4 s como mínimo y ~60 ms por letra, hasta 10 s: da tiempo a leer los mensajes largos
const duracionPara = (texto) => Math.min(10000, Math.max(4000, texto.length * 60));

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const region = useRef(null);

  const cerrar = useCallback((id) => setAvisos((lista) => lista.filter((a) => a.id !== id)), []);

  const agregar = useCallback((tipo, contenido) => {
    const texto = contenido instanceof Error ? contenido.message : String(contenido);
    const id = ++siguienteId;
    setAvisos((lista) => [...lista.slice(-(MAXIMO_VISIBLES - 1)), { id, tipo, texto }]);
    return id;
  }, []);

  const api = useMemo(
    () => ({ exito: (texto) => agregar("exito", texto), error: (error) => agregar("error", error) }),
    [agregar]
  );

  // Escape o un clic fuera de los avisos los cierran todos
  const hayAvisos = avisos.length > 0;
  useEffect(() => {
    if (!hayAvisos) return;
    const conTecla = (evento) => evento.key === "Escape" && setAvisos([]);
    const conClic = (evento) => !region.current?.contains(evento.target) && setAvisos([]);
    document.addEventListener("keydown", conTecla);
    document.addEventListener("pointerdown", conClic);
    return () => {
      document.removeEventListener("keydown", conTecla);
      document.removeEventListener("pointerdown", conClic);
    };
  }, [hayAvisos]);

  return (
    <AvisosContext.Provider value={api}>
      {children}
      {/* Arriba, debajo de la barra: abajo a la derecha está el botón del asistente */}
      <div ref={region} aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-20 z-[60] flex flex-col gap-2 sm:left-auto sm:w-96">
        {avisos.map((aviso) => (
          <Aviso key={aviso.id} aviso={aviso} onCerrar={() => cerrar(aviso.id)} />
        ))}
      </div>
    </AvisosContext.Provider>
  );
}

function Aviso({ aviso, onCerrar }) {
  const [pausado, setPausado] = useState(false);
  const esError = aviso.tipo === "error";

  useEffect(() => {
    if (pausado) return;
    const temporizador = setTimeout(onCerrar, duracionPara(aviso.texto));
    return () => clearTimeout(temporizador);
  }, [pausado, aviso.texto, onCerrar]);

  return (
    <div role={esError ? "alert" : "status"}
      onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}
      className={`pointer-events-auto flex items-start gap-3 rounded-control border border-l-4 border-borde bg-superficie-elevada p-3 text-sm text-texto shadow-flotante animate-[aparecer_180ms_ease-out] ${
        esError ? "border-l-peligro" : "border-l-exito"
      }`}>
      <svg viewBox="0 0 24 24" className={`mt-0.5 size-5 shrink-0 ${esError ? "text-peligro" : "text-exito"}`} fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {esError ? <path d="M12 8v5M12 16.5v.5M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          : <path d="M20 6 9 17l-5-5" />}
      </svg>
      <p className="flex-1">{aviso.texto}</p>
      <button type="button" onClick={onCerrar} aria-label="Cerrar aviso"
        className="-m-1 rounded-control p-1 text-texto-suave transition-colors hover:bg-texto/5 hover:text-texto">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

export function useAvisos() {
  const avisos = useContext(AvisosContext);
  if (!avisos) throw new Error("useAvisos debe usarse dentro de <AvisosProvider>");
  return avisos;
}

// Avisos que llegan desde otra pantalla en el estado de la navegación
// (por ejemplo, Reservar → Mi agenda con { aviso: "Reserva confirmada..." }).
// Se muestran una sola vez y se quitan del historial, para que no reaparezcan al recargar.
const yaMostrados = new Set(); // en desarrollo, StrictMode ejecuta los efectos dos veces

export function useAvisoDeNavegacion() {
  const avisos = useAvisos();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const texto = ubicacion.state?.aviso;

  useEffect(() => {
    if (!texto || yaMostrados.has(ubicacion.key)) return;
    yaMostrados.add(ubicacion.key);
    avisos.exito(texto);
    const { aviso, ...resto } = ubicacion.state;
    navegar(`${ubicacion.pathname}${ubicacion.search}`, { replace: true, state: resto });
  }, [texto, ubicacion, navegar, avisos]);
}
