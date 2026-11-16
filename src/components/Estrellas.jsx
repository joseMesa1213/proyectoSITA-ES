// Calificación de 1 a 5 con estrellas.
//   Solo lectura:  <Estrellas valor={4.3} />
//   Para elegir:   <Estrellas valor={calificacion} onCambiar={setCalificacion} />
// Las estrellas son SVG: las llenas en color estrella (acento algo más oscuro en modo claro) y las vacías solo con contorno en texto-suave,
// que contrasta bien con el fondo en modo claro y oscuro (antes eran casi del color del fondo).

const PUNTAS = "M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L2.9 9.4l6.3-.9z";

function Estrella({ llena }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-[1em] ${llena ? "text-estrella" : "text-texto-suave"}`}
      fill={llena ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d={PUNTAS} />
    </svg>
  );
}

export default function Estrellas({ valor = 0, onCambiar, tamano = "text-lg" }) {
  const redondeado = Math.round(valor);

  if (!onCambiar) {
    return (
      <span className={`${tamano} inline-flex gap-0.5 align-[-0.125em]`} role="img" aria-label={`${valor} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => <Estrella key={n} llena={n <= redondeado} />)}
      </span>
    );
  }

  return (
    <span className="inline-flex gap-1" role="radiogroup" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={n === valor} aria-label={`${n} de 5`}
          onClick={() => onCambiar(n)}
          className="rounded-control p-0.5 text-2xl leading-none transition-transform hover:scale-110">
          <Estrella llena={n <= valor} />
        </button>
      ))}
    </span>
  );
}
