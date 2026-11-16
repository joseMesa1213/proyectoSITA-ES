// Modo claro / oscuro.
// - La primera vez se usa la preferencia del sistema (prefers-color-scheme).
// - Si la persona elige un modo con el botón, se recuerda en localStorage.
// - El modo se aplica con la clase "dark" en <html>; los colores salen de las variables de index.css.
//
// IMPORTANTE: index.html tiene una copia mínima de temaInicial() en un <script> que corre ANTES de
// pintar la página (así no hay un parpadeo blanco). Si cambia la clave o los valores, cambiar también allá.

export const CLAVE_TEMA = "sita_tema";
export const OSCURO = "oscuro";
export const CLARO = "claro";

// localStorage puede fallar (navegación privada, almacenamiento bloqueado): nunca debe romper la página
export function leerTemaGuardado() {
  try {
    const tema = localStorage.getItem(CLAVE_TEMA);
    return tema === OSCURO || tema === CLARO ? tema : null;
  } catch {
    return null;
  }
}

export function guardarTema(tema) {
  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    // Sin almacenamiento el modo funciona igual; solo no se recuerda al recargar
  }
}

export const sistemaPrefiereOscuro = () =>
  typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;

// El modo guardado o, si no hay, el del sistema
export const temaInicial = () => leerTemaGuardado() ?? (sistemaPrefiereOscuro() ? OSCURO : CLARO);

export const temaActual = () => (document.documentElement.classList.contains("dark") ? OSCURO : CLARO);

export function aplicarTema(tema) {
  document.documentElement.classList.toggle("dark", tema === OSCURO);
}
