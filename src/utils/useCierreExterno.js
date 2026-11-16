import { useEffect, useRef } from "react";

/**
 * Cierra un panel abierto (menú del celular, asistente) con Escape o con un clic fuera de él.
 *   const panel = useRef(null); const boton = useRef(null);
 *   useCierreExterno(abierto, cerrar, [panel, boton], boton);
 * - refs: zonas donde un clic NO cierra (el panel y el botón que lo abre/cierra).
 * - foco: con Escape el foco vuelve a este elemento (normalmente el botón que lo abrió),
 *   para que quien usa el teclado no pierda su lugar. Con un clic afuera no se mueve el foco.
 */
export function useCierreExterno(abierto, cerrar, refs, foco) {
  // La función más reciente sin volver a registrar los eventos en cada render
  const alCerrar = useRef(cerrar);
  alCerrar.current = cerrar;

  useEffect(() => {
    if (!abierto) return;
    const conTecla = (evento) => {
      if (evento.key !== "Escape") return;
      alCerrar.current();
      foco?.current?.focus();
    };
    const conClic = (evento) => {
      const adentro = refs.some((ref) => ref.current?.contains(evento.target));
      if (!adentro) alCerrar.current();
    };
    document.addEventListener("keydown", conTecla);
    document.addEventListener("pointerdown", conClic);
    return () => {
      document.removeEventListener("keydown", conTecla);
      document.removeEventListener("pointerdown", conClic);
    };
    // refs y foco son objetos de useRef: no cambian entre renders, no hace falta incluirlos
  }, [abierto]);
}
