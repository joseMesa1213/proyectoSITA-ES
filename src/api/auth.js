import { pedir } from "./cliente.js";

// Devuelven { token, usuario }
export const registrar = (datos) => pedir("/auth/registro", { metodo: "POST", cuerpo: datos });
export const iniciarSesion = (correo, contrasena) =>
  pedir("/auth/login", { metodo: "POST", cuerpo: { correo, contrasena } });

// Google. Con usuario existente devuelve { token, usuario }; con usuario nuevo,
// { registro_pendiente: true, token_registro, perfil: { correo, nombre, apellido } }
export const iniciarConGoogle = (credential) => pedir("/auth/google", { metodo: "POST", cuerpo: { credential } });
// datos: { token_registro, id_rol, id_tipo_documento, num_documento, nombre_programa, semestre, celular?, nombre?, apellido? }
export const registrarConGoogle = (datos) => pedir("/auth/google/registro", { metodo: "POST", cuerpo: datos });

// Usuario autenticado (sirve para comprobar que el token sigue vigente)
export const obtenerPerfil = () => pedir("/auth/perfil");
