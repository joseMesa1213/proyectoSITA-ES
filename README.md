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

## Pendientes del backend

Riesgos encontrados al construir el panel del tutor. El frontend los mitiga con avisos, pero la regla debería vivir en el backend.

1. **Inactivar una tutoría no cancela sus reservas activas futuras** (`PUT /tutorias/:id` con `id_estado: 2`).
   Los estudiantes siguen viendo la reserva como activa en su agenda.
   *Frontend:* la confirmación indica cuántas reservas futuras activas quedan y sugiere cancelarlas desde la Agenda de tutorías.
   *Propuesta:* cancelarlas en la misma transacción, o rechazar con 409 si existen.
2. **Cambiar la modalidad o bajar el cupo no valida las reservas existentes** (`PUT /tutorias/:id`).
   Si una tutoría pasa de Presencial a Virtual, sus reservas conservan un recurso Físico; si el cupo baja por debajo
   de las reservas activas de una sesión, ninguna se cancela.
   *Frontend:* advertencia y confirmación al guardar si la tutoría tiene reservas activas.
   *Propuesta:* rechazar con 409 el cambio de modalidad o un cupo menor que las reservas activas de alguna sesión futura.
3. **Se puede completar una sesión de hoy antes de que termine** (`PATCH /reservas/:id/completar`).
   El backend solo valida `fecha_sesion <= hoy`, no la hora.
   *Frontend:* el botón "Completar" aparece solo cuando ya pasó la hora de fin de la sesión.
   *Propuesta:* validar también `hora_fin <= hora actual` cuando la fecha es hoy (zona America/Bogota).
