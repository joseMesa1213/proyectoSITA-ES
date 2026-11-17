// Utilidades de la campanita (funciones puras, para probarlas)

// Cada cuánto se consultan los avisos mientras la pestaña está visible
export const INTERVALO_CONSULTA_MS = 60_000;

// Número de la insignia: "9+" a partir de 10
export const textoInsignia = (n) => (n > 9 ? "9+" : String(n));

// "hace un momento" · "hace 5 min" · "hace 3 h" · "hace 2 días" · "12 de nov" (más de una semana)
export function haceCuanto(iso, ahora = new Date()) {
  const segundos = Math.max(0, (ahora.getTime() - new Date(iso).getTime()) / 1000);
  if (segundos < 60) return "hace un momento";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "America/Bogota" }).format(new Date(iso));
}
