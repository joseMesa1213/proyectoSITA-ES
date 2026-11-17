// Utilidades de la pantalla de Estadísticas (funciones puras, para probarlas)

export const PERIODOS = [4, 8, 12, 26];

// 0.4166 → "42 %"; null → "—"
export const porcentaje = (fraccion) =>
  fraccion === null || fraccion === undefined ? "—" : `${Math.round(fraccion * 100)} %`;

// 4.38 → "4,4"; null → "—"
export const decimal = (n, digitos = 1) =>
  n === null || n === undefined ? "—" : n.toLocaleString("es-CO", { minimumFractionDigits: digitos, maximumFractionDigits: digitos });

// Tope "redondo" del eje: 56 → 60, 7 → 8, 0 → 4 (para que la escala tenga marcas legibles)
export function techo(maximo) {
  if (maximo <= 0) return 4;
  const magnitud = 10 ** Math.floor(Math.log10(maximo));
  const paso = [1, 2, 2.5, 5, 10].find((p) => p * magnitud >= maximo / 4) * magnitud;
  return Math.ceil(maximo / paso) * paso;
}

// Marcas del eje entre 0 y el tope (4 divisiones)
export const marcas = (tope) => [0, 1, 2, 3, 4].map((i) => (tope * i) / 4);

// "2026-11-16" → "16 nov"
export const etiquetaSemana = (fecha) =>
  new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(`${fecha}T00:00:00Z`))
    .replace(/\.$/, "")
    .replace(" de ", " ");

// Columnas que llevan el número visible: la más alta y la última (la semana en curso). El resto, al pasar el cursor.
export function columnasConEtiqueta(valores) {
  if (valores.length === 0) return new Set();
  const maximo = Math.max(...valores);
  const indices = new Set([valores.length - 1]);
  if (maximo > 0) indices.add(valores.indexOf(maximo));
  return indices;
}
