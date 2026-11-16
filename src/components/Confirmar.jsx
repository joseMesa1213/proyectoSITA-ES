import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// Diálogo de confirmación propio, en lugar de window.confirm (que no se puede personalizar ni
// se ve igual en todos los navegadores). Usa el <dialog> nativo con showModal(), que ya trae:
// - Escape para cerrar, foco atrapado dentro del diálogo y foco devuelto al botón que lo abrió.
// Además se cierra al hacer clic afuera (en el fondo oscuro).
//
// Uso:
//   const confirmar = useConfirmar();
//   if (!(await confirmar({ titulo: "Cancelar reserva", mensaje: "...", textoConfirmar: "Sí, cancelar", peligro: true }))) return;

const ConfirmarContext = createContext(null);

export function ConfirmarProvider({ children }) {
  const dialogo = useRef(null);
  const resolver = useRef(null);
  const [opciones, setOpciones] = useState(null);

  // Devuelve una promesa que se resuelve en true (confirmó) o false (canceló, Escape o clic afuera)
  const confirmar = useCallback(
    (nuevas) =>
      new Promise((resolve) => {
        resolver.current?.(false); // si había otro abierto, cuenta como cancelado
        resolver.current = resolve;
        setOpciones(typeof nuevas === "string" ? { mensaje: nuevas } : nuevas);
      }),
    []
  );

  useEffect(() => {
    if (opciones && !dialogo.current.open) dialogo.current.showModal();
  }, [opciones]);

  const responder = (respuesta) => {
    resolver.current?.(respuesta);
    resolver.current = null;
    dialogo.current?.close();
    setOpciones(null);
  };

  const {
    titulo = "¿Está seguro?",
    mensaje,
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    peligro = false,
  } = opciones ?? {};

  return (
    <ConfirmarContext.Provider value={confirmar}>
      {children}
      <dialog
        ref={dialogo}
        aria-labelledby="confirmar-titulo"
        aria-describedby="confirmar-mensaje"
        // Escape dispara "cancel": se maneja aquí para resolver la promesa
        onCancel={(evento) => {
          evento.preventDefault();
          responder(false);
        }}
        // El contenido ocupa todo el diálogo: un clic cuyo destino es el <dialog> fue en el fondo
        onClick={(evento) => evento.target === dialogo.current && responder(false)}
        className="fixed inset-0 m-auto h-fit w-[min(28rem,calc(100vw-2rem))] rounded-tarjeta border border-borde bg-superficie-elevada p-0 text-texto shadow-flotante backdrop:bg-black/50 open:animate-[aparecer_160ms_ease-out]"
      >
        {opciones && (
          <div className="space-y-4 p-5">
            <h2 id="confirmar-titulo" className="titulo-seccion">{titulo}</h2>
            <p id="confirmar-mensaje" className="text-sm whitespace-pre-line text-texto-suave">{mensaje}</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {/* En acciones peligrosas el foco empieza en "Cancelar": un Enter por error no borra nada */}
              <button type="button" className="btn-secundario" onClick={() => responder(false)} autoFocus={peligro}>
                {textoCancelar}
              </button>
              <button type="button" className={peligro ? "btn bg-peligro text-white hover:bg-peligro/90 dark:text-sobre-acento" : "btn-primario"}
                onClick={() => responder(true)} autoFocus={!peligro}>
                {textoConfirmar}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmarContext.Provider>
  );
}

export function useConfirmar() {
  const confirmar = useContext(ConfirmarContext);
  if (!confirmar) throw new Error("useConfirmar debe usarse dentro de <ConfirmarProvider>");
  return confirmar;
}
