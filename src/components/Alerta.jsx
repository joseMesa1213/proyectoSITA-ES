const ESTILOS = {
  error: "border-peligro/30 bg-peligro/5 text-peligro",
  exito: "border-exito/30 bg-exito/5 text-exito",
  info: "border-bosque/15 bg-white text-bosque",
};

/**
 * Muestra un mensaje. Con `error` (un ErrorApi) usa el mensaje que redactó el backend
 * y, si vienen, los detalles útiles (campos faltantes o valores permitidos).
 *   <Alerta error={error} />     <Alerta tipo="exito">Reserva creada</Alerta>
 */
export default function Alerta({ tipo = "info", error, children, onCerrar }) {
  if (!error && !children) return null;
  const estilo = ESTILOS[error ? "error" : tipo];
  const detalles = error?.detalles;

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${estilo}`} role="alert">
      <div className="flex-1">
        <p className="font-medium">{error ? error.message : children}</p>
        {detalles?.faltantes && <p className="mt-1">Campos faltantes: {detalles.faltantes.join(", ")}</p>}
        {detalles?.permitidos && <p className="mt-1">Valores permitidos: {detalles.permitidos.join(", ")}</p>}
      </div>
      {onCerrar && (
        <button type="button" onClick={onCerrar} className="text-lg leading-none opacity-60 hover:opacity-100" aria-label="Cerrar">
          ×
        </button>
      )}
    </div>
  );
}
