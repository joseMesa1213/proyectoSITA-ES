import { Component } from "react";

/**
 * Si una pantalla falla al dibujarse, React desmonta toda la aplicación y solo queda el fondo
 * (así quedó "Mi agenda" en producción el 2026-11-18). Este límite atrapa el error y muestra un
 * aviso con salida en vez de la pantalla vacía.
 *
 * Se usa en dos niveles:
 * - En el Layout, alrededor de cada página, con key = ruta: la barra y el menú siguen sirviendo,
 *   y al ir a otra pantalla el límite se reinicia solo.
 * - En main.jsx, alrededor de todo (completo): por si lo que falla es la barra o un provider.
 *
 * Los enlaces son <a> normales (no <Link>): recargan la aplicación desde cero y funcionan
 * aunque el router sea justo lo que falló.
 */
export default class LimiteDeError extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // React ya lo muestra en la consola; esto deja además en qué componente fue
    console.error("Error al dibujar la pantalla:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <AvisoDeError completo={this.props.completo} />;
  }
}

function AvisoDeError({ completo = false }) {
  const aviso = (
    <div role="alert" className="tarjeta mx-auto flex max-w-lg flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="text-lg font-semibold text-texto">Algo salió mal al mostrar esta pantalla</p>
      <p className="text-sm text-texto-suave">
        Sus datos no se perdieron: lo que haya guardado (por ejemplo, una reserva) quedó registrado.
        Pruebe recargar o vuelva al catálogo.
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button type="button" className="btn-primario" onClick={() => window.location.reload()}>Recargar</button>
        <a href="/tutorias" className="btn-secundario">Ir al catálogo</a>
      </div>
    </div>
  );
  // Sin la barra de navegación alrededor: centrado en toda la pantalla
  return completo ? <div className="flex min-h-screen items-center bg-fondo px-4">{aviso}</div> : aviso;
}
