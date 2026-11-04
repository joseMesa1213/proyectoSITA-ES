# proyectoSITA-ES
Proyecto orientado al minimo producto viable de una plataforma de monitorias dedicadas para estudiantes

## Cómo ejecutar el frontend

Requisitos: Node.js 20.19 o superior y el backend (`proyectoSITA-ES_backend`) corriendo en `http://localhost:3000`.

```bash
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000/api
npm run dev               # http://localhost:5173 (el backend solo acepta CORS desde este puerto)
```

Stack: React + Vite, Tailwind CSS v4 y React Router.

Estructura de `src/`:
- `api/`: `cliente.js` (única puerta a la API: token, formato `{ ok, data | error }` y 401) y un archivo por módulo del backend.
- `context/`: `AuthContext.jsx` (usuario actual, login, registro y logout).
- `components/`: piezas reutilizables (barra de navegación, rutas protegidas, alertas, tarjetas).
- `pages/`: una pantalla por ruta.
- `utils/`: constantes de roles/estados y manejo de fechas en America/Bogota.
- `asistente/`: lógica del Asistente SITA (ver abajo).

## Asistente SITA

Chat guiado (botón flotante en todas las páginas) que responde preguntas frecuentes y busca tutorías por materia.
No usa IA ni servicios externos: no tiene costo por uso.

- `asistente/intenciones.js`: catálogo de preguntas por rol (frases de ejemplo y respuesta). **Para agregar una pregunta, agregar un objeto aquí.**
- `asistente/motor.js`: entiende el texto con búsqueda difusa ([Fuse.js](https://www.fusejs.io/)): tolera tildes y errores de escritura ("kalkulo" → Cálculo).
- `components/Asistente.jsx`: la ventana del chat.

Solo orienta y consulta con los endpoints existentes; las acciones (reservar, cancelar, calificar) se hacen en sus pantallas,
así todas las reglas de negocio siguen en el backend.
