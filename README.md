# proyectoSITA-ES
Frontend de SITA-ES (Sistema de Tutorías Académicas): mínimo producto viable de una plataforma de tutorías entre estudiantes.

| | URL |
|---|---|
| Aplicación | https://proyectosita-es.onrender.com |
| API (backend) | https://proyectosita-es-backend.onrender.com/api/salud |
| Repositorio del backend | https://github.com/joseMesa1213/proyectoSITA-ES_backend |
| Manual de usuario | [docs/manual-usuario.md](docs/manual-usuario.md) |

Estado final, cuentas de prueba y pendientes: [documento de cierre](https://github.com/joseMesa1213/proyectoSITA-ES_backend/blob/main/docs/cierre.md).

## Cómo ejecutar el frontend

Requisitos: Node.js 20.19 o superior y el backend (`proyectoSITA-ES_backend`) corriendo en `http://localhost:3000`.

```bash
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000/api
npm run dev               # http://localhost:5173 (el CORS_ORIGIN del backend local permite este puerto)
```

Para usar el backend **local** sin tocar `.env` (por ejemplo, si `.env` apunta a producción), crear
`.env.api-local.local` (ignorado por git) con `VITE_API_URL=http://localhost:3000/api` y correr
`npm run dev -- --mode api-local`.

**Solo se entra con Google @udea.edu.co.** Para entrar en local con las cuentas de la semilla (correo y contraseña),
poner `VITE_LOGIN_CONTRASENA=true` en el `.env` local (ya viene en `.env.example`) y `LOGIN_CONTRASENA=true` en el
backend local. En producción ninguna de las dos se define.

Stack: React + Vite, Tailwind CSS v4, React Router, Vitest (pruebas) y Google Identity Services (login con Google).

Estructura de `src/`:
- `api/`: `cliente.js` (única puerta a la API: token, formato `{ ok, data | error }` y 401) y un archivo por módulo del backend.
- `context/`: `AuthContext.jsx` (usuario actual, entrar con Google o —solo en desarrollo— con contraseña, registro con Google y logout).
- `components/`: piezas reutilizables (barra de navegación, rutas protegidas, alertas, tarjetas).
- `pages/`: una pantalla por ruta.
- `utils/`: constantes de roles/estados y manejo de fechas en America/Bogota.
- `asistente/`: lógica del Asistente SITA (ver abajo).

## Inicio de sesión con Google

**Es la única forma de entrar y de registrarse**, también para los administradores. `/login` muestra solo
**"Continuar con Google"** (script oficial de Google Identity Services, sin librerías extra). No hay página de registro:
`/registro` lleva a `/login` y el backend responde 403 a `POST /auth/registro`.

1. Google entrega un ID token (`credential`) y `components/ContinuarConGoogle.jsx` lo envía a `POST /auth/google`.
2. Si la persona ya tiene cuenta, entra. Si es nueva, pasa a **Completa tu registro** (`/registro/google`,
   `pages/CompletarRegistroGoogle.jsx`): el correo viene de Google y no se edita; nombre y apellido llegan llenos y se
   pueden corregir; faltan documento, programa y semestre (y, si quiere, «Quiero ser tutor»). Tiene 15 minutos para terminar.
3. Solo se aceptan cuentas institucionales `@udea.edu.co` (lo decide el backend con `GOOGLE_DOMINIO`).

Las cuentas guardan una contraseña aleatoria que nadie conoce: no hay contraseña que cambiar ni recuperar. Quien no
pueda entrar a su correo institucional acude al soporte de la Universidad.

**Formulario de correo y contraseña (solo desarrollo):** aparece debajo del botón, marcado «Solo desarrollo», cuando
`VITE_LOGIN_CONTRASENA=true` (solo `true` exacto). Sirve para las cuentas de la semilla y necesita
`LOGIN_CONTRASENA=true` en el backend; si no, el backend responde 403 «Use «Continuar con Google»…». En Render no se
define. Pruebas en `pages/Login.test.jsx`.

Configuración:
- `VITE_GOOGLE_CLIENT_ID` en `.env`: el ID de cliente OAuth (es público, no es un secreto). Debe ser **el mismo**
  `GOOGLE_CLIENT_ID` del backend. Si se deja vacío, no hay forma de entrar y el login avisa que falta.
- En Google Cloud Console → *APIs y servicios → Credenciales* → ese ID de cliente → **Orígenes autorizados de JavaScript**:
  `http://localhost:5173` y `https://proyectosita-es.onrender.com`. Sin eso, Google rechaza el botón.
- El proyecto de Google Cloud es **interno** de la UdeA: Google solo deja elegir cuentas institucionales.
- Los **administradores** también entran con Google (su correo @udea.edu.co). El rol sale de la BD y solo
  `npm run crear-admin` (backend) lo asigna.
- Las cuentas de demostración (`@demo.sita-es.test`) no son cuentas de Google: solo entran en local con el formulario
  de desarrollo. En producción están inactivas.

## Estudiante y tutor con una sola cuenta

`usuario.id_rol` es un **nivel de permisos**, no algo que se elige: 1 Estudiante (todos), 2 Estudiante + Tutor,
3 Administrador.

- **Registro** (solo con Google): no hay selector de rol. Todos entran como estudiantes; la casilla
  **«Quiero ser tutor»** (`components/CamposRegistro.jsx`) crea una solicitud que revisa un administrador. Con la
  casilla marcada, al terminar se llega a *Mi perfil* con el aviso de que la solicitud está en revisión.
- **Mi perfil** (`/perfil`, `pages/Perfil.jsx`): datos de la cuenta y, para estudiantes, el estado de la solicitud
  (en revisión, aprobada o rechazada con su motivo) y el botón **Solicitar ser tutor** (también para volver a pedirlo).
- **Solicitudes de tutor** (`/admin/solicitudes`, `pages/AdminSolicitudes.jsx`): el administrador aprueba o rechaza
  (el rechazo exige un motivo que el estudiante ve). Pestañas *Pendientes* e *Historial*.
- **Sin volver a iniciar sesión:** el backend lee el rol de la BD en cada petición y `AuthContext.refrescarPerfil()`
  vuelve a pedir el perfil al abrir *Mi perfil* y al volver a la pestaña. Así, cuando aprueban la solicitud, el menú de
  tutor aparece solo.
- **Administrador = superusuario:** `RutaProtegida` siempre lo deja pasar y `ROLES_QUE_RESERVAN` / `puedeEnsenar()`
  (`utils/constantes.js`) lo incluyen, igual que `autorizar` en el backend. En la barra, sus menús van agrupados en los
  desplegables **Tutor** y **Administración** (en el celular, secciones con título). El asistente le ofrece las
  intenciones del tutor, menos «ser tutor» y «estado de mi solicitud».
- **Menú del tutor:** lo de estudiante va suelto (Tutorías, Mi agenda, Pedir tutoría) y su panel en el desplegable
  **Tutor** (`components/BarraNavegacion.jsx`, mismo componente que el admin). Así cabe desde 1024 px; el admin, con dos
  desplegables, usa el menú de escritorio desde 1280 px (por debajo, el de hamburguesa).
- `SoloInvitados` (Login y Completa tu registro) solo redirige a quien entra con la sesión ya iniciada; si la persona inicia sesión
  o se registra ahí mismo, la página decide a dónde ir (por ejemplo, a *Mi perfil*).

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
| `asistente/clasificador.test.js` | Pruebas: tabla de frases → resultado esperado por rol (incluye frases parecidas que no deben cambiar de destino). |
| `asistente/motor.test.js` | Pruebas de las respuestas que consultan la API (con la API simulada). |
| `asistente/enlaces.test.js` | Revisa que **cada enlace del asistente lleve a una ruta que existe** (según `utils/titulos.js`). |
| `components/Asistente.jsx` | La ventana del chat. |

Cómo decide (`clasificar()`):
1. Normaliza el texto y separa los **filtros**: modalidad ("virtual"), nivel ("básico") y día ("hoy", "mañana", "lunes").
2. Busca **qué estudiar**, en orden de confianza: tema exacto del diccionario → nombre o código de la materia →
   tema parecido → palabras del título o la descripción de las tutorías ("runge kutta").
3. Busca la **pregunta frecuente** cuya frase de ejemplo comparte más palabras. Los verbos genéricos ("cambiar", "crear")
   no bastan solos, y los saludos solo ganan si todo el mensaje es un saludo ("ayuda" sí; "ayuda con mate" no).
4. Gana lo que comparta más palabras. Con filtros, la búsqueda gana salvo que se pida una definición ("¿qué es híbrida?").

Los enlaces del asistente abren el catálogo con los mismos filtros: `/tutorias?id_materia=&nivel=&modalidad=&dia=`.
Si la búsqueda no encuentra tutorías, ofrece **«Pedir una tutoría»** con la materia ya elegida (`/solicitudes?id_materia=`).

**Cada funcionalidad nueva → revisar el asistente**: corregir las respuestas que la mencionen, agregar su pregunta en
`intenciones.js` con casos en `clasificador.test.js` (también frases parecidas a otras intenciones) y correr `npm test`.
Si se agrega una pantalla, registrarla en `utils/titulos.js`: `enlaces.test.js` falla si el asistente enlaza a una ruta que no existe.

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
| Variable `VITE_GOOGLE_CLIENT_ID` | El mismo `GOOGLE_CLIENT_ID` del backend (ver *Inicio de sesión con Google*). Obligatoria: es la única forma de entrar |
| Variable `VITE_LOGIN_CONTRASENA` | **No se define** (solo desarrollo) |

- Las variables `VITE_` se leen **al compilar**: si cambian, hay que volver a desplegar (*Clear build cache & deploy*).
- Pasos y orden para publicar «solo Google» (administrador, backend, frontend, cuentas de demostración): ver
  `docs/despliegue-solo-google.md` en el repositorio del backend.
- La URL del frontend debe estar en `CORS_ORIGIN` del backend; si no, el navegador bloquea las peticiones.
- **Rutas internas:** la app usa React Router, así que el servidor debe responder `index.html` en cualquier ruta.
  En Render → *Redirects/Rewrites* agregar la regla **Source** `/*` → **Destination** `/index.html` → **Action** `Rewrite`.
  Sin ella, abrir o recargar `/tutorias/3` o `/mis-reservas` devuelve `Not Found` (navegar desde el inicio sí funciona).
- En el plan gratuito el backend se duerme tras unos 15 minutos sin uso: la primera petición tarda entre 30 y 50 s.
  Antes de una demostración, abrir `/api/salud` del backend para despertarlo.
