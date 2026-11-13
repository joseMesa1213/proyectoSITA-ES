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

Stack: React + Vite, Tailwind CSS v4, React Router y Vitest (pruebas).

Estructura de `src/`:
- `api/`: `cliente.js` (única puerta a la API: token, formato `{ ok, data | error }` y 401) y un archivo por módulo del backend.
- `context/`: `AuthContext.jsx` (usuario actual, login, registro y logout).
- `components/`: piezas reutilizables (barra de navegación, rutas protegidas, alertas, tarjetas).
- `pages/`: una pantalla por ruta.
- `utils/`: constantes de roles/estados y manejo de fechas en America/Bogota.
- `asistente/`: lógica del Asistente SITA (ver abajo).

## Asistente SITA

Chat guiado (botón flotante en todas las páginas) que responde preguntas frecuentes y busca tutorías.
No usa IA ni servicios externos: no tiene costo por uso. Solo orienta y consulta con los endpoints existentes;
las acciones (reservar, cancelar, calificar) se hacen en sus pantallas, así todas las reglas de negocio siguen en el backend.

| Archivo | Qué hace |
|---|---|
| `asistente/clasificador.js` | Entiende el texto (función pura, sin API). Usa búsqueda difusa con [Fuse.js](https://www.fusejs.io/): tolera tildes y errores ("kalkulo" → Cálculo). |
| `asistente/temas.js` | Diccionario tema → materia ("derivadas" → Cálculo Diferencial, "sql" → Bases de Datos, "mate" → materias de matemáticas). **Para que entienda un tema nuevo, agregar la palabra aquí.** |
| `asistente/intenciones.js` | Preguntas frecuentes por rol (frases de ejemplo y respuesta). **Para agregar una pregunta, agregar un objeto aquí.** |
| `asistente/motor.js` | Arma la respuesta: consulta tutorías y reservas, aplica los filtros y crea los enlaces al catálogo. |
| `asistente/clasificador.test.js` | Pruebas: tabla de frases → resultado esperado por rol. |
| `components/Asistente.jsx` | La ventana del chat. |

Cómo decide (`clasificar()`):
1. Normaliza el texto y separa los **filtros**: modalidad ("virtual"), nivel ("básico") y día ("hoy", "mañana", "lunes").
2. Busca **qué estudiar**, en orden de confianza: tema exacto del diccionario → nombre o código de la materia →
   tema parecido → palabras del título o la descripción de las tutorías ("runge kutta").
3. Busca la **pregunta frecuente** cuya frase de ejemplo comparte más palabras. Los verbos genéricos ("cambiar", "crear")
   no bastan solos, y los saludos solo ganan si todo el mensaje es un saludo ("ayuda" sí; "ayuda con mate" no).
4. Gana lo que comparta más palabras. Con filtros, la búsqueda gana salvo que se pida una definición ("¿qué es híbrida?").

Los enlaces del asistente abren el catálogo con los mismos filtros: `/tutorias?id_materia=&nivel=&modalidad=&dia=`.

### Pruebas

```bash
npm test             # corre las pruebas una vez
npm run test:watch   # las vuelve a correr al guardar
```

Las materias y tutorías de las pruebas son una copia fija de la semilla del backend, así no dependen de la base de datos.
Al cambiar el clasificador, los temas o las frases de una intención, agregar el caso a la tabla de `clasificador.test.js`.

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
