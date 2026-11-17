/**
 * Medidor: una proporción contra su total (0 a 1), como barra fina. El número va al lado, en texto
 * (nunca del color de la barra). Se usa en filas alineadas ("lista de medidores").
 * fraccion null → pista vacía y "—".
 */
export default function Medidor({ fraccion, texto, etiqueta, ancho = "w-24", anchoTexto = "" }) {
  const valor = fraccion === null || fraccion === undefined ? null : Math.max(0, Math.min(1, fraccion));
  return (
    <span className="flex w-full items-center gap-2">
      <span className={`relative h-2 shrink-0 overflow-hidden rounded-full bg-texto/10 ${ancho}`}
        role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={valor === null ? undefined : Math.round(valor * 100)}
        aria-label={etiqueta}>
        {valor !== null && (
          <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${valor * 100}%`, backgroundColor: "var(--serie-1)" }} />
        )}
      </span>
      <span className={`text-sm tabular-nums text-texto ${anchoTexto}`}>{texto}</span>
    </span>
  );
}
