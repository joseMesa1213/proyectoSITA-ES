import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listarMisTutorias } from "../../api/tutorias.js";
import { listarMisReservas, listarReservasRecibidas } from "../../api/reservas.js";
import Alerta from "../../components/Alerta.jsx";
import EstadoVacio from "../../components/EstadoVacio.jsx";
import { EsqueletoLista } from "../../components/Esqueletos.jsx";
import { formatearFechaCorta, horaActual, hoy } from "../../utils/fechas.js";
import { aMinutos, armarSemana, lunesDe, sumarDias } from "../../utils/horarioSemanal.js";
import { archivoIcs, descargarIcs, eventosDelHorario } from "../../utils/calendario.js";

// Alto de una hora en la grilla (px)
const ALTO_HORA = 56;

// Color de cada tutoría: borde del color y fondo con un toque del mismo (paleta --serie-N de index.css)
const estiloColor = (n) => ({
  borderLeftColor: `var(--serie-${n})`,
  backgroundColor: `color-mix(in srgb, var(--serie-${n}) 16%, var(--superficie))`,
});

const textoReservas = (b) => `${b.reservas}/${b.cupo} ${b.reservas === 1 ? "reserva" : "reservas"}`;

// Ya pasó: un día anterior, o hoy después de la hora de fin
const yaPaso = (fecha, horaFin, ahora) => fecha < hoy() || (fecha === hoy() && horaFin <= ahora);

/**
 * "Mi horario": grilla semanal (lunes a domingo) con todo lo que ocupa el tiempo del tutor:
 * - las tutorías que dicta (horarios activos), cada una de un color, con las reservas de esa fecha;
 * - las tutorías que reservó como estudiante (borde punteado).
 * Se navega por semanas. En celular se muestra como lista por día.
 */
export default function MiHorario() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [lunes, setLunes] = useState(() => lunesDe(hoy()));
  const [ahora, setAhora] = useState(horaActual);

  useEffect(() => {
    Promise.all([listarMisTutorias(), listarReservasRecibidas(), listarMisReservas()])
      .then(([tutorias, recibidas, mias]) => setDatos({ tutorias, recibidas, mias }))
      .catch(setError);
  }, []);

  // La línea de "ahora" avanza cada minuto
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(horaActual()), 60_000);
    return () => clearInterval(intervalo);
  }, []);

  const estaSemana = lunesDe(hoy());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo-pagina">Mi horario</h1>
          <p className="mt-1 text-texto-suave">Las tutorías que dicta y las que reservó, semana a semana.</p>
        </div>
        <nav aria-label="Cambiar de semana" className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secundario px-3" onClick={() => setLunes(sumarDias(lunes, -7))}
            aria-label="Semana anterior">←</button>
          <button type="button" className="btn-secundario" disabled={lunes === estaSemana}
            onClick={() => setLunes(estaSemana)}>Esta semana</button>
          <button type="button" className="btn-secundario px-3" onClick={() => setLunes(sumarDias(lunes, 7))}
            aria-label="Semana siguiente">→</button>
        </nav>
      </div>

      <Alerta error={error} />

      {!datos ? (
        !error && <EsqueletoLista texto="Cargando su horario..." />
      ) : (
        <>
          <Semana {...armarSemana({ ...datos, lunes })} lunes={lunes} ahora={ahora} />
          <ExportarHorario tutorias={datos.tutorias} />
        </>
      )}
    </div>
  );
}

function Semana({ dias, rango, resumen, leyenda, lunes, ahora }) {
  // "Lun, 16 de nov" → "16 de nov"
  const sinDia = (fecha) => formatearFechaCorta(fecha).split(", ")[1];
  return (
    <>
      <p className="text-lg font-semibold" aria-live="polite">
        Semana del {sinDia(lunes)} al {sinDia(sumarDias(lunes, 6))}
      </p>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Dato titulo="Horas de tutoría por semana" valor={resumen.horasSemanales.toLocaleString("es-CO", { maximumFractionDigits: 1 })} />
        <Dato titulo="Sesiones con reservas" valor={`${resumen.conReservas} de ${resumen.sesiones}`} />
        <Dato titulo="Reservas recibidas" valor={resumen.reservas} />
        <Dato titulo="Días libres" valor={resumen.diasLibres} />
      </dl>

      {leyenda.length === 0 && (
        <EstadoVacio titulo="Aún no tiene horarios activos"
          accion={<Link to="/tutor/tutorias" className="btn-primario">Ir a mis tutorías</Link>}>
          Cuando agregue horarios a sus tutorías aparecerán resaltados aquí.
        </EstadoVacio>
      )}

      {(leyenda.length > 0 || resumen.comoEstudiante > 0) && (
        <ul className="flex flex-wrap gap-2 text-sm" aria-label="Leyenda">
          {leyenda.map((t) => (
            <li key={t.id} className="flex items-center gap-2 rounded-full border border-borde bg-superficie px-3 py-1">
              <span className="size-3 rounded-full" style={{ backgroundColor: `var(--serie-${t.color})` }} aria-hidden="true" />
              {t.titulo}
            </li>
          ))}
          <li className="flex items-center gap-2 rounded-full border border-dashed border-borde-fuerte bg-superficie px-3 py-1">
            Reservada como estudiante
          </li>
        </ul>
      )}

      <Grilla dias={dias} rango={rango} ahora={ahora} />
      <ListaPorDia dias={dias} ahora={ahora} />
    </>
  );
}

function Dato({ titulo, valor }) {
  return (
    <div className="tarjeta py-3">
      <dt className="text-xs font-medium text-texto-suave">{titulo}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{valor}</dd>
    </div>
  );
}

// Grilla de escritorio: una columna por día, una fila por hora; los bloques se ubican por su hora
function Grilla({ dias, rango, ahora }) {
  const horas = Array.from({ length: rango.fin - rango.inicio }, (_, i) => rango.inicio + i);
  const alto = horas.length * ALTO_HORA;
  const posicion = (inicio, fin) => ({
    top: ((aMinutos(inicio) - rango.inicio * 60) / 60) * ALTO_HORA,
    height: Math.max(((aMinutos(fin) - aMinutos(inicio)) / 60) * ALTO_HORA, 24),
  });
  const minutoAhora = aMinutos(ahora);
  const ahoraVisible = minutoAhora >= rango.inicio * 60 && minutoAhora <= rango.fin * 60;

  return (
    <section className="tarjeta hidden overflow-x-auto p-0 sm:block" aria-label="Grilla semanal">
      <div className="grid min-w-[760px] grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
        {/* Encabezado: día y fecha */}
        <div className="border-b border-borde" />
        {dias.map((d) => {
          const esHoy = d.fecha === hoy();
          return (
            <div key={d.fecha} className={`border-b border-l border-borde px-2 py-2 text-center ${esHoy ? "bg-acento/15" : ""}`}>
              <p className={`text-sm ${esHoy ? "font-bold" : "font-semibold"}`}>{d.dia}</p>
              <p className="text-xs text-texto-suave">{formatearFechaCorta(d.fecha).split(", ")[1]}{esHoy && " · hoy"}</p>
            </div>
          );
        })}

        {/* Columna de horas */}
        <div className="relative" style={{ height: alto }} aria-hidden="true">
          {horas.map((h, i) => (
            <span key={h} className="absolute right-2 text-xs text-texto-suave tabular-nums"
              style={{ top: i * ALTO_HORA + 2 }}>
              {`${String(h).padStart(2, "0")}:00`}
            </span>
          ))}
        </div>

        {dias.map((d) => {
          const esHoy = d.fecha === hoy();
          return (
            <div key={d.fecha} className={`relative border-l border-borde ${esHoy ? "bg-acento/5" : ""}`} style={{
              height: alto,
              // Una línea por hora
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${ALTO_HORA - 1}px, var(--borde) ${ALTO_HORA - 1}px, var(--borde) ${ALTO_HORA}px)`,
            }}>
              {d.bloques.map((b) => (
                <Bloque key={b.clave} bloque={b} fecha={d.fecha} ahora={ahora} style={posicion(b.hora_inicio, b.hora_fin)} />
              ))}
              {esHoy && ahoraVisible && (
                <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-peligro"
                  style={{ top: ((minutoAhora - rango.inicio * 60) / 60) * ALTO_HORA }}>
                  <span className="sr-only">Hora actual: {ahora}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Bloque({ bloque: b, fecha, ahora, style }) {
  const pasado = yaPaso(fecha, b.hora_fin, ahora);
  const comun = `absolute inset-x-1 overflow-hidden rounded-control px-2 py-1 text-xs leading-tight transition-shadow hover:shadow-md focus-visible:z-20 ${pasado ? "opacity-55" : ""}`;
  const horas = `${b.hora_inicio}–${b.hora_fin}`;
  // Bloques de una hora o menos: solo título y una línea con horas (y reservas)
  const corto = aMinutos(b.hora_fin) - aMinutos(b.hora_inicio) <= 60;

  if (b.tipo === "estudiante") {
    return (
      <Link to="/mis-reservas" style={style}
        aria-label={`Reservada como estudiante: ${b.titulo}, ${horas}${b.lugar ? `, ${b.lugar}` : ""}`}
        className={`${comun} border border-dashed border-borde-fuerte bg-superficie-hundida`}>
        {!corto && <p className="font-semibold text-texto-suave">Como estudiante</p>}
        <p className="truncate font-medium">{b.titulo}</p>
        <p className="text-texto-suave">{horas}</p>
      </Link>
    );
  }

  return (
    <Link to={`/tutor/tutorias/${b.id_tutoria}`} style={{ ...style, ...estiloColor(b.color) }}
      aria-label={`${b.titulo}, ${horas}${b.lugar ? `, ${b.lugar}` : ""}, ${textoReservas(b)}`}
      className={`${comun} border-l-4`}>
      <p className="truncate font-semibold">{b.titulo}</p>
      {corto ? (
        <p className="truncate tabular-nums">{horas} · <span className="font-medium">{b.reservas}/{b.cupo}</span></p>
      ) : (
        <>
          <p className="tabular-nums">{horas}</p>
          {b.lugar && <p className="truncate text-texto-suave">{b.lugar}</p>}
          <p className="font-medium">{textoReservas(b)}</p>
        </>
      )}
    </Link>
  );
}

// Celular: la misma semana como lista por día (sin desplazamiento horizontal)
function ListaPorDia({ dias, ahora }) {
  return (
    <section className="space-y-3 sm:hidden" aria-label="Horario por día">
      {dias.map((d) => (
        <div key={d.fecha} className={`tarjeta py-3 ${d.fecha === hoy() ? "border-acento" : ""}`}>
          <h2 className="font-semibold">
            {formatearFechaCorta(d.fecha)}{d.fecha === hoy() && <span className="text-texto-suave"> · hoy</span>}
          </h2>
          {d.bloques.length === 0 ? (
            <p className="mt-1 text-sm text-texto-suave">Libre</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {d.bloques.map((b) => (
                <li key={b.clave} className={yaPaso(d.fecha, b.hora_fin, ahora) ? "opacity-55" : ""}>
                  {b.tipo === "estudiante" ? (
                    <Link to="/mis-reservas" className="block rounded-control border border-dashed border-borde-fuerte bg-superficie-hundida px-3 py-2 text-sm">
                      <span className="tabular-nums">{b.hora_inicio}–{b.hora_fin}</span> · {b.titulo}
                      <span className="block text-xs text-texto-suave">Reservada como estudiante</span>
                    </Link>
                  ) : (
                    <Link to={`/tutor/tutorias/${b.id_tutoria}`} style={estiloColor(b.color)}
                      className="block rounded-control border-l-4 px-3 py-2 text-sm">
                      <span className="tabular-nums">{b.hora_inicio}–{b.hora_fin}</span> · <span className="font-semibold">{b.titulo}</span>
                      <span className="block text-xs text-texto-suave">{b.lugar ? `${b.lugar} · ` : ""}{textoReservas(b)}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}

// Exporta el horario semanal a un .ics (ver eventosDelHorario en utils/calendario.js)
function ExportarHorario({ tutorias }) {
  const eventos = eventosDelHorario(tutorias, lunesDe(hoy()));
  if (eventos.length === 0) return null;
  return (
    <section className="tarjeta flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-texto-suave">
        Lleve su horario a Google Calendar, Outlook o Apple: cada bloque se repite cada semana y le avisa 30 minutos antes.
      </p>
      <button type="button" className="btn-secundario shrink-0"
        onClick={() => descargarIcs("mi-horario-sita-es.ics", archivoIcs(eventos))}>
        Exportar horario (.ics)
      </button>
    </section>
  );
}
