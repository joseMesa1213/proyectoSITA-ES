import { useEffect, useRef, useState } from "react";

/**
 * Pase de lista al completar una sesión: el tutor desmarca a quien no asistió.
 * Todos empiezan marcados, así que el caso normal es un solo clic.
 * Usa el <dialog> nativo con showModal(), como el diálogo de confirmación (Escape y clic afuera cierran).
 * Se abre al montarse: renderícelo solo mientras deba estar abierto.
 *
 *   {abierto && <PaseDeLista titulo="Derivadas" subtitulo="Jue, 19 de nov · 14:00 – 16:00"
 *     estudiantes={[{ id: 50, nombre: "Ana Pérez" }]}
 *     onConfirmar={({ asistieron, faltaron }) => ...}   // listas de id de reserva
 *     onCerrar={() => ...} />}
 */
export default function PaseDeLista({ titulo, subtitulo, estudiantes, onConfirmar, onCerrar }) {
  const dialogo = useRef(null);
  const [marcados, setMarcados] = useState(() => new Set(estudiantes.map((e) => e.id))); // todos marcados

  useEffect(() => {
    if (!dialogo.current.open) dialogo.current.showModal();
  }, []);

  const cerrar = () => {
    dialogo.current?.close();
    onCerrar();
  };

  const alternar = (id) =>
    setMarcados((actuales) => {
      const nuevos = new Set(actuales);
      if (nuevos.has(id)) nuevos.delete(id);
      else nuevos.add(id);
      return nuevos;
    });

  const asistieron = estudiantes.filter((e) => marcados.has(e.id)).map((e) => e.id);
  const faltaron = estudiantes.filter((e) => !marcados.has(e.id)).map((e) => e.id);

  const textoBoton = [
    asistieron.length > 0 && `Completar ${asistieron.length}`,
    faltaron.length > 0 && `Marcar ${faltaron.length} como no asistió`,
  ].filter(Boolean).join(" · ");

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="pase-titulo"
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
      onClick={(evento) => evento.target === dialogo.current && cerrar()}
      className="fixed inset-0 m-auto h-fit w-[min(30rem,calc(100vw-2rem))] rounded-tarjeta border border-borde bg-superficie-elevada p-0 text-texto shadow-flotante backdrop:bg-black/50 open:animate-[aparecer_160ms_ease-out]"
    >
      <div className="space-y-4 p-5">
        <div>
          <h2 id="pase-titulo" className="titulo-seccion">Completar sesión · {titulo}</h2>
          <p className="text-sm text-texto-suave">{subtitulo}</p>
        </div>
        <p className="text-sm text-texto-suave">
          Desmarque a quien no asistió. Quienes asistieron podrán valorar la sesión; a quienes no, se les avisa
          la inasistencia.
        </p>
        <ul className="max-h-72 divide-y divide-borde overflow-y-auto rounded-control border border-borde">
          {estudiantes.map((e) => (
            <li key={e.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-texto/5">
                <input type="checkbox" className="size-4 accent-primario" checked={marcados.has(e.id)} onChange={() => alternar(e.id)} />
                <span className={marcados.has(e.id) ? "" : "text-texto-suave line-through"}>{e.nombre}</span>
                {!marcados.has(e.id) && <span className="ml-auto text-xs font-medium text-peligro">No asistió</span>}
              </label>
            </li>
          ))}
        </ul>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secundario" onClick={cerrar}>Cancelar</button>
          <button type="button" className="btn-primario" autoFocus
            onClick={() => {
              dialogo.current?.close();
              onConfirmar({ asistieron, faltaron });
            }}>
            {textoBoton}
          </button>
        </div>
      </div>
    </dialog>
  );
}
