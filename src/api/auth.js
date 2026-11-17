import { pedir } from "./cliente.js";

// Correo y contraseña: SOLO DESARROLLO (el backend necesita LOGIN_CONTRASENA=true; si no, responde 403).
// Devuelve { token, usuario }. No hay registro por formulario: POST /auth/registro responde 403.
export const iniciarSesion = (correo, contrasena) =>
  pedir("/auth/login", { metodo: "POST", cuerpo: { correo, contrasena } });

// Google. Con usuario existente devuelve { token, usuario }; con usuario nuevo,
// { registro_pendiente: true, token_registro, perfil: { correo, nombre, apellido } }
export const iniciarConGoogle = (credential) => pedir("/auth/google", { metodo: "POST", cuerpo: { credential } });
// Única forma de registrarse. Sin rol: { token_registro, id_tipo_documento, num_documento, nombre_programa, semestre,
//          celular?, nombre?, apellido?, quiero_ser_tutor?, motivo_tutor? } → { token, usuario, solicitud_tutor_pendiente }
export const registrarConGoogle = (datos) => pedir("/auth/google/registro", { metodo: "POST", cuerpo: datos });

// Usuario autenticado (sirve para comprobar que el token sigue vigente)
export const obtenerPerfil = () => pedir("/auth/perfil");
