import { pedir } from "./cliente.js";

// Devuelven { token, usuario }
export const registrar = (datos) => pedir("/auth/registro", { metodo: "POST", cuerpo: datos });
export const iniciarSesion = (correo, contrasena) =>
  pedir("/auth/login", { metodo: "POST", cuerpo: { correo, contrasena } });

// Usuario autenticado (sirve para comprobar que el token sigue vigente)
export const obtenerPerfil = () => pedir("/auth/perfil");
