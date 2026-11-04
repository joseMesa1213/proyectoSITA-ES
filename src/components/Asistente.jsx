import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { INVITADO } from "../asistente/intenciones.js";
import { opcionesMenu, responder, responderIntencion, saludo } from "../asistente/motor.js";

// Asistente SITA: botón flotante con un chat guiado que orienta y consulta,
// pero no ejecuta acciones (para eso enlaza a las pantallas de la app).
export default function Asistente() {
  const { usuario } = useAuth();
  // Al iniciar o cerrar sesión la conversación empieza de nuevo con el menú del nuevo rol
  return <Chat key={usuario?.id ?? INVITADO} usuario={usuario} />;
}

function Chat({ usuario }) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState(() => [{ id: 0, de: "bot", ...saludo(usuario) }]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const siguienteId = useRef(1);
  const finDeLista = useRef(null);
  const campo = useRef(null);

  const agregar = (mensaje) => setMensajes((lista) => [...lista, { id: siguienteId.current++, ...mensaje }]);

  // Muestra lo que escribió o eligió el usuario y, cuando llega, la respuesta del asistente
  const conversar = async (textoUsuario, obtenerRespuesta) => {
    agregar({ de: "usuario", texto: textoUsuario });
    setPensando(true);
    agregar({ de: "bot", ...(await obtenerRespuesta()) });
    setPensando(false);
  };

  const enviar = (evento) => {
    evento.preventDefault();
    const pregunta = texto.trim();
    if (!pregunta || pensando) return;
    setTexto("");
    conversar(pregunta, () => responder(pregunta, usuario));
  };

  const elegir = (intencion) => conversar(intencion.etiqueta, () => responderIntencion(intencion, usuario));

  // En el celular el chat tapa la página: se cierra al seguir un enlace
  const alNavegar = () => {
    if (window.matchMedia("(max-width: 639px)").matches) setAbierto(false);
  };

  useEffect(() => {
    if (abierto) finDeLista.current?.scrollIntoView({ block: "end" });
  }, [abierto, mensajes, pensando]);

  useEffect(() => {
    if (!abierto) return;
    campo.current?.focus();
    const cerrarConEscape = (evento) => evento.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [abierto]);

  return (
    <>
      {abierto && (
        <section role="dialog" aria-label="Asistente SITA"
          className="fixed right-4 bottom-22 z-50 flex h-[min(34rem,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-bosque/10 bg-white shadow-xl">
          <header className="flex items-center justify-between bg-bosque px-4 py-3 text-white">
            <div>
              <p className="font-semibold">Asistente SITA</p>
              <p className="text-xs text-white/70">Respuestas al instante sobre la plataforma</p>
            </div>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar asistente"
              className="rounded-md p-1.5 text-white/80 hover:bg-white/10 hover:text-white">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          <ul className="flex-1 space-y-3 overflow-y-auto bg-crema/60 px-4 py-4" aria-live="polite">
            {mensajes.map((m) => (
              <Mensaje key={m.id} mensaje={m} opciones={m.menu ? opcionesMenu(usuario) : []}
                onElegir={elegir} onNavegar={alNavegar} deshabilitado={pensando} />
            ))}
            {pensando && (
              <li className="flex items-center gap-2 text-sm text-bosque/60" role="status">
                <span className="size-4 animate-spin rounded-full border-2 border-bosque/20 border-t-acento" />
                Buscando...
              </li>
            )}
            <li ref={finDeLista} aria-hidden="true" />
          </ul>

          <form onSubmit={enviar} className="flex items-center gap-2 border-t border-bosque/10 p-3">
            <label htmlFor="pregunta-asistente" className="sr-only">Escriba su pregunta</label>
            <input id="pregunta-asistente" ref={campo} className="campo" placeholder="Ej.: tutorías de cálculo"
              maxLength={200} autoComplete="off" value={texto} onChange={(e) => setTexto(e.target.value)} />
            <button type="submit" className="btn-primario px-3" disabled={pensando || !texto.trim()} aria-label="Enviar">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setAbierto((a) => !a)}
        aria-label={abierto ? "Cerrar asistente" : "Abrir asistente"} aria-expanded={abierto}
        className="fixed right-4 bottom-4 z-50 flex size-14 items-center justify-center rounded-full bg-bosque text-white shadow-lg ring-2 ring-acento/60 transition-colors hover:bg-bosque-claro">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2">
          <path d={abierto ? "M6 6l12 12M18 6L6 18" : "M4 5h16v11H8l-4 4V5zM8 10h.01M12 10h.01M16 10h.01"} />
        </svg>
      </button>
    </>
  );
}

// Un mensaje del chat: texto y, si es del asistente, tarjetas, enlaces y botones del menú
function Mensaje({ mensaje, opciones, onElegir, onNavegar, deshabilitado }) {
  if (mensaje.de === "usuario") {
    return (
      <li className="ml-auto w-fit max-w-[85%] rounded-lg rounded-br-sm bg-bosque px-3 py-2 text-sm text-white">
        {mensaje.texto}
      </li>
    );
  }

  const { texto, tarjetas = [], enlaces = [] } = mensaje;
  return (
    <li className="max-w-[92%] space-y-2">
      <p className="rounded-lg rounded-bl-sm border border-bosque/10 bg-white px-3 py-2 text-sm whitespace-pre-line">{texto}</p>

      {tarjetas.map((t) => (
        <Link key={`${t.a}|${t.titulo}|${t.detalle}`} to={t.a} onClick={onNavegar}
          className="block rounded-lg border border-bosque/10 bg-white px-3 py-2 transition-colors hover:border-acento/50">
          <p className="text-sm font-semibold">{t.titulo}</p>
          <p className="text-xs text-bosque/70">{t.subtitulo}</p>
          <p className="mt-1 text-xs font-medium">{t.detalle}</p>
        </Link>
      ))}

      {enlaces.length > 0 && (
        <div className="flex flex-col items-start gap-1">
          {enlaces.map((e) => (
            <Link key={e.a} to={e.a} onClick={onNavegar}
              className="text-sm font-medium underline decoration-acento underline-offset-4 hover:text-bosque-claro">
              {e.texto} →
            </Link>
          ))}
        </div>
      )}

      {opciones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {opciones.map((o) => (
            <button key={o.id} type="button" onClick={() => onElegir(o)} disabled={deshabilitado}
              className="rounded-full border border-bosque/20 bg-white px-3 py-1 text-left text-xs font-medium hover:bg-bosque/5 disabled:opacity-50">
              {o.etiqueta}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
