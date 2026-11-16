import { useEffect } from "react";
import { matchPath } from "react-router";

// Título de la pestaña del navegador para cada pantalla ("Mi agenda · SITA-ES").
// Sirve para ubicarse entre varias pestañas, en el historial y, sobre todo, para los lectores de
// pantalla: el título es lo primero que anuncian al cambiar de página.
//
// Para una pantalla nueva basta con agregar su ruta aquí. Las rutas más específicas van primero
// ("/tutor/tutorias/nueva" antes de "/tutor/tutorias/:id").
const TITULOS = [
  ["/tutorias", "Tutorías disponibles"],
  ["/tutorias/:id/reservar", "Reservar"],
  ["/tutorias/:id", "Detalle de la tutoría"],
  ["/login", "Iniciar sesión"],
  ["/registro/google", "Completa tu registro"],
  ["/registro", "Crear cuenta"],
  ["/perfil", "Mi perfil"],
  ["/mis-reservas", "Mi agenda"],
  ["/tutor/materias", "Mis materias"],
  ["/tutor/tutorias/nueva", "Nueva tutoría"],
  ["/tutor/tutorias/:id", "Gestionar tutoría"],
  ["/tutor/tutorias", "Mis tutorías"],
  ["/tutor/reservas", "Agenda de tutorías"],
  ["/admin/materias", "Materias"],
  ["/admin/recursos", "Recursos"],
  ["/admin/solicitudes", "Solicitudes de tutor"],
];

export const NOMBRE_APP = "SITA-ES";

export const tituloCompleto = (texto) => (texto ? `${texto} · ${NOMBRE_APP}` : NOMBRE_APP);

// Función pura (fácil de probar): ruta → texto del título
export function tituloDeRuta(ruta) {
  const encontrado = TITULOS.find(([patron]) => matchPath(patron, ruta));
  return encontrado ? encontrado[1] : "Página no encontrada";
}

// Para las pantallas cuyo título depende de los datos (el nombre de la tutoría).
// Se llama con undefined mientras carga: entonces se queda el título general de la ruta.
export function useTituloPagina(texto) {
  useEffect(() => {
    if (texto) document.title = tituloCompleto(texto);
  }, [texto]);
}
