// Esqueletos de carga: la forma gris de lo que va a aparecer mientras llegan los datos.
// Así la página no "salta" al cargar y la persona ya ve dónde estará cada cosa.
// Los bloques son decorativos (aria-hidden); a los lectores de pantalla se les anuncia "Cargando...".

function Bloque({ className = "" }) {
  return <span className={`block rounded-control bg-texto/10 animate-pulse motion-reduce:animate-none ${className}`} />;
}

const repetir = (cantidad, crear) => Array.from({ length: cantidad }, (_, i) => crear(i));

function Contenedor({ className, texto, children }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">{texto}</span>
      {children}
    </div>
  );
}

// Tarjetas en cuadrícula, como las del catálogo y "Mis tutorías"
export function EsqueletoTarjetas({ cantidad = 6, className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", texto = "Cargando..." }) {
  return (
    <Contenedor className={className} texto={texto}>
      {repetir(cantidad, (i) => (
        <div key={i} className="tarjeta flex flex-col gap-3" aria-hidden="true">
          <Bloque className="h-3 w-2/5" />
          <Bloque className="h-5 w-4/5" />
          <Bloque className="h-3 w-1/3" />
          <div className="flex gap-2">
            <Bloque className="h-6 w-16 rounded-full" />
            <Bloque className="h-6 w-20 rounded-full" />
            <Bloque className="h-6 w-24 rounded-full" />
          </div>
          <div className="space-y-2 border-t border-borde pt-3">
            <Bloque className="h-3 w-full" />
            <Bloque className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </Contenedor>
  );
}

// Tarjetas una debajo de otra con encabezado y filas, como la agenda y las solicitudes
export function EsqueletoLista({ cantidad = 3, filas = 2, texto = "Cargando..." }) {
  return (
    <Contenedor className="space-y-4" texto={texto}>
      {repetir(cantidad, (i) => (
        <div key={i} className="tarjeta space-y-4" aria-hidden="true">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Bloque className="h-3 w-1/4" />
              <Bloque className="h-5 w-1/2" />
              <Bloque className="h-3 w-1/3" />
            </div>
            <Bloque className="h-6 w-24 rounded-full" />
          </div>
          {repetir(filas, (j) => (
            <div key={j} className="flex items-center justify-between gap-3 border-t border-borde pt-3">
              <div className="flex-1 space-y-2">
                <Bloque className="h-4 w-2/5" />
                <Bloque className="h-3 w-3/5" />
              </div>
              <Bloque className="h-9 w-24" />
            </div>
          ))}
        </div>
      ))}
    </Contenedor>
  );
}
