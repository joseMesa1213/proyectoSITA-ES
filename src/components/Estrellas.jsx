// Calificación de 1 a 5 con estrellas.
//   Solo lectura:  <Estrellas valor={4.3} />
//   Para elegir:   <Estrellas valor={calificacion} onCambiar={setCalificacion} />
export default function Estrellas({ valor = 0, onCambiar, tamano = "text-lg" }) {
  const redondeado = Math.round(valor);

  if (!onCambiar) {
    return (
      <span className={`${tamano} tracking-tight`} aria-label={`${valor} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= redondeado ? "text-acento" : "text-bosque/15"}>★</span>
        ))}
      </span>
    );
  }

  return (
    <span className="inline-flex gap-1" role="radiogroup" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={n === valor} aria-label={`${n} de 5`}
          onClick={() => onCambiar(n)}
          className={`text-2xl leading-none transition-transform hover:scale-110 ${n <= valor ? "text-acento" : "text-bosque/20"}`}>
          ★
        </button>
      ))}
    </span>
  );
}
