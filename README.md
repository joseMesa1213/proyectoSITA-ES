# proyectoSITA-ES
Frontend de SITA-ES (Sistema de Tutorías Académicas): mínimo producto viable de una plataforma de tutorías entre estudiantes.

| | URL |
|---|---|
| Aplicación | https://proyectosita-es.onrender.com |
| API (backend) | https://proyectosita-es-backend.onrender.com/api/salud |
| Repositorio del backend | https://github.com/joseMesa1213/proyectoSITA-ES_backend |

Estado final, cuentas de prueba y pendientes: [documento de cierre](https://github.com/joseMesa1213/proyectoSITA-ES_backend/blob/main/docs/cierre.md).

## Cómo ejecutar el frontend

Requisitos: Node.js 20.19 o superior y el backend (`proyectoSITA-ES_backend`) corriendo en `http://localhost:3000`.

```bash
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000/api
npm run dev               # http://localhost:5173 (el CORS_ORIGIN del backend local permite este puerto)
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

## Despliegue (Render)

Se publica como **Static Site** en Render, conectado a la rama `main` (cada push despliega).

| Campo | Valor |
|---|---|
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Variable `VITE_API_URL` | `https://proyectosita-es-backend.onrender.com/api` |

- `VITE_API_URL` se lee **al compilar**: si cambia, hay que volver a desplegar.
- La URL del frontend debe estar en `CORS_ORIGIN` del backend; si no, el navegador bloquea las peticiones.
- **Rutas internas:** la app usa React Router, así que el servidor debe responder `index.html` en cualquier ruta.
  En Render → *Redirects/Rewrites* agregar la regla **Source** `/*` → **Destination** `/index.html` → **Action** `Rewrite`.
  Sin ella, abrir o recargar `/tutorias/3` o `/mis-reservas` devuelve `Not Found` (navegar desde el inicio sí funciona).
- En el plan gratuito el backend se duerme tras unos 15 minutos sin uso: la primera petición tarda entre 30 y 50 s.
  Antes de una demostración, abrir `/api/salud` del backend para despertarlo.
