// Estado vacío: en lugar de solo "no hay nada", dice qué pasó y ofrece el siguiente paso
// (limpiar filtros, buscar tutorías, ver otra pestaña...).
export default function EstadoVacio({ titulo, children, accion }) {
  return (
    <div className="tarjeta flex flex-col items-center gap-2 px-6 py-12 text-center">
      <svg viewBox="0 0 24 24" className="mb-1 size-10 text-texto-suave" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 13h5l1.5 3h5L16 13h5M5.5 5h13L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z" />
      </svg>
      <p className="font-semibold text-texto">{titulo}</p>
      {children && <p className="max-w-md text-sm text-texto-suave">{children}</p>}
      {accion && <div className="mt-3 flex flex-wrap justify-center gap-2">{accion}</div>}
    </div>
  );
}
