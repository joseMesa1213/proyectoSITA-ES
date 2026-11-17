import { useState } from "react";
import { columnasConEtiqueta, marcas, techo } from "../../utils/estadisticas.js";

const ALTO = 200; // alto del área de dibujo (px)

/**
 * Columnas de UNA serie (sin leyenda: el título la nombra), en HTML para que sea accesible y se adapte.
 * datos: [{ clave, etiqueta (eje x), valor, descripcion (texto completo para el tooltip y lectores) }]
 * - Columnas de máx. 24 px, borde redondeado de 4 px arriba y recto en la base; color --serie-1.
 * - Número visible solo en la columna más alta y en la última; el resto, al pasar el cursor o con el teclado
 *   (cada columna es enfocable y su zona activa es toda la franja, más grande que la barra).
 * - Cuadrícula tenue; etiquetas del eje x espaciadas para que no se encimen.
 * - "Ver datos" muestra la misma información como tabla.
 */
export default function GraficoColumnas({ datos, titulo, nombreValor = "Valor" }) {
  const [activa, setActiva] = useState(null);
  const valores = datos.map((d) => d.valor);
  const tope = techo(Math.max(0, ...valores));
  const conNumero = columnasConEtiqueta(valores);
  // Como mucho ~7 etiquetas en el eje x
  const cadaCuantas = Math.ceil(datos.length / 7);

  return (
    <figure className="space-y-3">
      <figcaption className="sr-only">{titulo}</figcaption>
      <div className="flex gap-2">
        {/* Eje y */}
        <div className="relative w-8 shrink-0 text-right text-xs text-texto-suave tabular-nums" style={{ height: ALTO }} aria-hidden="true">
          {marcas(tope).map((m) => (
            <span key={m} className="absolute right-0 -translate-y-1/2" style={{ top: ALTO - (m / tope) * ALTO }}>{m}</span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {/* Área de dibujo */}
          <div className="relative" style={{ height: ALTO }}>
            {marcas(tope).map((m) => (
              <div key={m} aria-hidden="true"
                className={`absolute inset-x-0 border-t ${m === 0 ? "border-borde-fuerte" : "border-borde/70"}`}
                style={{ top: ALTO - (m / tope) * ALTO }} />
            ))}
            <ul className="absolute inset-0 flex items-end" aria-label={titulo}>
              {datos.map((d, i) => {
                const alto = tope ? (d.valor / tope) * ALTO : 0;
                return (
                  <li key={d.clave} tabIndex={0} aria-label={d.descripcion}
                    onMouseEnter={() => setActiva(i)} onMouseLeave={() => setActiva(null)}
                    onFocus={() => setActiva(i)} onBlur={() => setActiva(null)}
                    className="group relative flex h-full flex-1 cursor-default items-end justify-center outline-none">
                    {/* Fondo de la franja al pasar el cursor: indica qué columna se lee */}
                    <span aria-hidden="true" className={`absolute inset-x-0.5 inset-y-0 rounded-control ${activa === i ? "bg-texto/5" : ""} group-focus-visible:ring-2 group-focus-visible:ring-acento`} />
                    {conNumero.has(i) && d.valor > 0 && (
                      <span aria-hidden="true" className="absolute text-xs font-semibold tabular-nums text-texto" style={{ bottom: alto + 4 }}>
                        {d.valor}
                      </span>
                    )}
                    <span aria-hidden="true" className="relative w-[min(24px,70%)] rounded-t-[4px]"
                      style={{ height: Math.max(alto, d.valor > 0 ? 2 : 0), backgroundColor: "var(--serie-1)" }} />
                    {activa === i && (
                      <span role="tooltip"
                        className={`pointer-events-none absolute z-10 w-max max-w-56 rounded-control border border-borde bg-superficie-elevada px-3 py-2 text-xs text-texto shadow-flotante ${
                          i > datos.length / 2 ? "right-0" : "left-0"
                        }`}
                        style={{ bottom: Math.min(alto + 8, ALTO - 40) }}>
                        {d.descripcion}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          {/* Eje x */}
          <div className="mt-1 flex text-xs text-texto-suave" aria-hidden="true">
            {datos.map((d, i) => (
              <span key={d.clave} className="flex-1 text-center whitespace-nowrap">
                {i % cadaCuantas === (datos.length - 1) % cadaCuantas ? d.etiqueta : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-texto-suave hover:text-texto">Ver datos</summary>
        <table className="mt-2 w-full text-left">
          <thead><tr className="border-b border-borde text-texto-suave"><th className="py-1 font-medium">Semana</th><th className="py-1 text-right font-medium">{nombreValor}</th></tr></thead>
          <tbody>
            {datos.map((d) => (
              <tr key={d.clave} className="border-b border-borde/60">
                <td className="py-1">{d.etiqueta}</td>
                <td className="py-1 text-right tabular-nums">{d.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
