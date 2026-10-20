// Cliente único de la API: TODAS las peticiones al backend pasan por aquí.
// Se encarga de: armar la URL, enviar el token JWT, interpretar el formato
// { ok, data } / { ok: false, error: { mensaje, detalles } } y cerrar la sesión ante un 401.

const URL_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
const CLAVE_TOKEN = "sita_token";

// --- Token en localStorage -------------------------------------------------
export const obtenerToken = () => localStorage.getItem(CLAVE_TOKEN);
export const guardarToken = (token) => localStorage.setItem(CLAVE_TOKEN, token);
export const borrarToken = () => localStorage.removeItem(CLAVE_TOKEN);

// El AuthContext registra aquí qué hacer cuando el backend rechaza el token (401).
let alExpirarSesion = () => {};
export function configurarSesionExpirada(funcion) {
  alExpirarSesion = funcion;
}

// Error con el mensaje en español que redacta el backend, más el código HTTP y los detalles.
export class ErrorApi extends Error {
  constructor(mensaje, status, detalles) {
    super(mensaje);
    this.name = "ErrorApi";
    this.status = status;
    this.detalles = detalles;
  }
}

/**
 * Hace una petición a la API y devuelve directamente `data`.
 * Si la respuesta es un error, lanza ErrorApi con `error.mensaje` del backend.
 *
 *   pedir("/tutorias", { consulta: { nivel: "Básico" } })
 *   pedir("/reservas", { metodo: "POST", cuerpo: { id_horario: 7, ... } })
 */
export async function pedir(ruta, { metodo = "GET", cuerpo, consulta } = {}) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(consulta ?? {})) {
    // Los filtros vacíos no se envían
    if (valor !== undefined && valor !== null && valor !== "") parametros.append(clave, valor);
  }
  const url = `${URL_BASE}${ruta}${parametros.size ? `?${parametros}` : ""}`;

  const token = obtenerToken();
  const headers = {};
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    // fetch solo falla así cuando no hay conexión (backend apagado, CORS, sin red)
    throw new ErrorApi(
      "No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.",
      0
    );
  }

  // Algunas respuestas podrían no traer JSON; en ese caso json queda en null
  const json = await respuesta.json().catch(() => null);

  // 401 con token = token vencido o inválido → se cierra la sesión.
  // (Un 401 sin token, como "Credenciales inválidas" en el login, no cierra nada.)
  if (respuesta.status === 401 && token) {
    borrarToken();
    alExpirarSesion();
  }

  if (!respuesta.ok || !json?.ok) {
    throw new ErrorApi(
      json?.error?.mensaje ?? `Error inesperado del servidor (${respuesta.status})`,
      respuesta.status,
      json?.error?.detalles
    );
  }
  return json.data;
}
