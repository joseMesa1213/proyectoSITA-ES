import { useEffect, useState } from "react";
import { obtenerEstadisticas } from "../api/estadisticas.js";
import Alerta from "../components/Alerta.jsx";
import { EsqueletoTarjetas } from "../components/Esqueletos.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import GraficoColumnas from "../components/graficos/GraficoColumnas.jsx";
import Medidor from "../components/graficos/Medidor.jsx";
import { formatearFechaCorta } from "../utils/fechas.js";
import { decimal, etiquetaSemana, PERIODOS, porcentaje } from "../utils/estadisticas.js";

/**
 * Estadísticas (administrador): cómo se usa la plataforma y dónde hacen falta tutores.
 * Datos de GET /estadisticas (ver el README del backend para la definición de cada cifra).
 * El período (últimas N semanas) se elige arriba y aplica a reservas, ocupación, valoraciones y
 * solicitudes; la oferta (tutorías activas, horas) es la de hoy.
 */
export default function AdminEstadisticas() {
  const [semanas, setSemanas] = useState(12);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vigente = true;
    setError(null);
    obtenerEstadisticas(semanas)
      .then((d) => vigente && setDatos(d))
      .catch((err) => vigente && setError(err));
    return () => {
      vigente = false;
    };
  }, [semanas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo-pagina">Estadísticas</h1>
          <p className="mt-1 text-texto-suave">
            {datos
              ? `Del ${sinDia(datos.periodo.desde)} al ${sinDia(datos.periodo.hasta)} · la oferta es la de hoy.`
              : "Cómo se usa SITA-ES y dónde hacen falta tutores."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Período">
          {PERIODOS.map((p) => (
            <button key={p} type="button" aria-pressed={semanas === p} onClick={() => setSemanas(p)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                semanas === p ? "bg-primario text-primario-texto" : "bg-superficie text-texto hover:bg-texto/5"
              }`}>
              {p} semanas
            </button>
          ))}
        </div>
      </div>

      <Alerta error={error} />

      {!datos ? (
        !error && <EsqueletoTarjetas cantidad={4} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" texto="Calculando estadísticas..." />
      ) : (
        <Contenido datos={datos} />
      )}
    </div>
  );
}

// "2026-11-16" → "16 de nov"
const sinDia = (fecha) => formatearFechaCorta(fecha).split(", ")[1];

function Contenido({ datos }) {
  const { resumen: r, reservas_por_semana, por_materia, demanda_sin_oferta, valoraciones } = datos;
  const maximoValoraciones = Math.max(1, ...valoraciones.map((v) => v.cantidad));

  return (
    <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Dato titulo="Reservas" valor={r.reservas}
          nota={r.tasa_cancelacion === null ? "sin reservas en el período" : `${porcentaje(r.tasa_cancelacion)} canceladas`} />
        <Dato titulo="Ocupación de los cupos" valor={porcentaje(r.ocupacion_promedio)}
          nota={`en ${r.sesiones_con_reservas} ${r.sesiones_con_reservas === 1 ? "sesión" : "sesiones"} con reservas`} />
        <Dato titulo="Valoración promedio" valor={r.valoracion_promedio === null ? "—" : `${decimal(r.valoracion_promedio)} / 5`}
          nota={`${r.valoraciones} ${r.valoraciones === 1 ? "valoración" : "valoraciones"}`} />
        <Dato titulo="Oferta actual" valor={`${decimal(r.horas_semanales)} h`}
          nota={`por semana · ${r.tutorias_activas} tutorías, ${r.tutores_con_horarios} tutores`} />
      </dl>

      {demanda_sin_oferta.length > 0 && (
        <section className="tarjeta space-y-3 border-acento/60">
          <div>
            <h2 className="titulo-seccion">Materias que piden y no tienen tutorías</h2>
            <p className="text-sm text-texto-suave">
              Hay estudiantes pidiendo tutorías y nadie las ofrece. Conviene invitar a tutores de estas materias.
            </p>
          </div>
          <ul className="divide-y divide-borde">
            {demanda_sin_oferta.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span><span className="font-medium">{m.nombre}</span> <span className="text-texto-suave">({m.codigo})</span></span>
                <span className="text-texto-suave">
                  {m.solicitudes_abiertas} {m.solicitudes_abiertas === 1 ? "abierta" : "abiertas"}
                  {m.solicitudes_vencidas > 0 && ` · ${m.solicitudes_vencidas} vencidas sin respuesta`}
                  {" · "}{m.tutores === 0 ? "ningún tutor asociado" : `${m.tutores} ${m.tutores === 1 ? "tutor asociado" : "tutores asociados"} sin tutorías activas`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="tarjeta space-y-3">
          <div>
            <h2 className="titulo-seccion">Reservas por semana</h2>
            <p className="text-sm text-texto-suave">Por la fecha de la sesión, sin las canceladas.</p>
          </div>
          <GraficoColumnas titulo="Reservas por semana" nombreValor="Reservas"
            datos={reservas_por_semana.map((s) => ({
              clave: s.semana,
              etiqueta: etiquetaSemana(s.semana),
              valor: s.reservas,
              descripcion: `Semana del ${etiquetaSemana(s.semana)}: ${s.reservas} ${s.reservas === 1 ? "reserva" : "reservas"}${
                s.canceladas ? ` · ${s.canceladas} ${s.canceladas === 1 ? "cancelada" : "canceladas"}` : ""}`,
            }))} />
        </section>

        <section className="tarjeta space-y-3">
          <div>
            <h2 className="titulo-seccion">Valoraciones</h2>
            <p className="text-sm text-texto-suave">Cuántas sesiones recibieron cada calificación.</p>
          </div>
          {r.valoraciones === 0 ? (
            <p className="text-sm text-texto-suave">Aún no hay valoraciones en este período.</p>
          ) : (
            <ul className="space-y-2">
              {[...valoraciones].reverse().map((v) => (
                <li key={v.calificacion} className="grid grid-cols-[4.5rem_1fr] items-center gap-2 text-sm">
                  <span className="tabular-nums">{v.calificacion} {v.calificacion === 1 ? "estrella" : "estrellas"}</span>
                  {/* Texto de ancho fijo: todas las barras comparten la misma pista */}
                  <Medidor fraccion={v.cantidad / maximoValoraciones} ancho="flex-1" anchoTexto="w-20 shrink-0 text-right"
                    etiqueta={`${v.calificacion} estrellas: ${v.cantidad} de ${r.valoraciones}`}
                    texto={`${v.cantidad} (${porcentaje(v.cantidad / r.valoraciones)})`} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="tarjeta space-y-3 p-0 sm:p-0">
        <div className="px-5 pt-5">
          <h2 className="titulo-seccion">Por materia</h2>
          <p className="text-sm text-texto-suave">Ordenadas por reservas en el período. Ocupación: reservas sobre el cupo, en las sesiones con reservas.</p>
        </div>
        {por_materia.length === 0 ? (
          <div className="px-5 pb-5"><EstadoVacio titulo="Todavía no hay actividad en ninguna materia" /></div>
        ) : (
          <>
          {/* Celular: una tarjeta por materia (la tabla de 7 columnas no cabe) */}
          <ul className="divide-y divide-borde border-t border-borde sm:hidden">
            {por_materia.map((m) => (
              <li key={m.id} className="space-y-2 px-5 py-3 text-sm">
                <p className="font-medium">{m.nombre} <span className="text-xs font-normal text-texto-suave">{m.codigo}</span></p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <dt className="text-texto-suave">Tutorías · tutores</dt><dd className="text-right tabular-nums">{m.tutorias_activas} · {m.tutores}</dd>
                  <dt className="text-texto-suave">Horas / sem.</dt><dd className="text-right tabular-nums">{decimal(m.horas_semanales)}</dd>
                  <dt className="text-texto-suave">Reservas</dt><dd className="text-right tabular-nums">{m.reservas}</dd>
                  <dt className="text-texto-suave">Valoración</dt><dd className="text-right tabular-nums">{m.valoracion === null ? "—" : `${decimal(m.valoracion)} (${m.valoraciones})`}</dd>
                  <dt className="text-texto-suave">Pedidas (abiertas)</dt>
                  <dd className="text-right tabular-nums">{m.solicitudes_periodo === 0 && m.solicitudes_abiertas === 0 ? "—" : `${m.solicitudes_periodo}${m.solicitudes_abiertas ? ` (${m.solicitudes_abiertas})` : ""}`}</dd>
                </dl>
                <div className="flex items-center gap-2">
                  <span className="text-texto-suave">Ocupación</span>
                  <Medidor fraccion={m.ocupacion} texto={porcentaje(m.ocupacion)} etiqueta={`Ocupación de ${m.nombre}`} ancho="flex-1" anchoTexto="w-12 shrink-0 text-right" />
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto pb-2 sm:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-borde text-texto-suave">
                  <th scope="col" className="px-5 py-2 font-medium">Materia</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Tutorías</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Horas / sem.</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Reservas</th>
                  <th scope="col" className="px-3 py-2 font-medium">Ocupación</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Valoración</th>
                  <th scope="col" className="px-5 py-2 text-right font-medium">Pedidas <span className="font-normal">(abiertas)</span></th>
                </tr>
              </thead>
              <tbody>
                {por_materia.map((m) => (
                  <tr key={m.id} className="border-b border-borde/60 last:border-0">
                    <th scope="row" className="px-5 py-2 font-medium">
                      {m.nombre}
                      <span className="block text-xs font-normal text-texto-suave">
                        {m.codigo} · {m.tutores} {m.tutores === 1 ? "tutor" : "tutores"}
                      </span>
                    </th>
                    <td className="px-3 py-2 text-right tabular-nums">{m.tutorias_activas}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{decimal(m.horas_semanales)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.reservas}</td>
                    <td className="px-3 py-2">
                      <Medidor fraccion={m.ocupacion} texto={porcentaje(m.ocupacion)} etiqueta={`Ocupación de ${m.nombre}`} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {m.valoracion === null ? "—" : <>{decimal(m.valoracion)} <span className="text-xs text-texto-suave">({m.valoraciones})</span></>}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums">
                      {m.solicitudes_periodo === 0 && m.solicitudes_abiertas === 0 ? "—" : (
                        <>
                          {m.solicitudes_periodo}
                          {m.solicitudes_abiertas > 0 && <span className="font-semibold"> ({m.solicitudes_abiertas})</span>}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    </>
  );
}

function Dato({ titulo, valor, nota }) {
  return (
    <div className="tarjeta py-3">
      <dt className="text-xs font-medium text-texto-suave">{titulo}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{valor}</dd>
      {nota && <dd className="mt-0.5 text-xs text-texto-suave">{nota}</dd>}
    </div>
  );
}
