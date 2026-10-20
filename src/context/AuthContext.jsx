import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.js";
import { borrarToken, configurarSesionExpirada, guardarToken, obtenerToken } from "../api/cliente.js";

// Contexto de autenticación: cualquier componente puede saber quién está conectado
// con useAuth() y llamar a login, registro o logout.

const CLAVE_USUARIO = "sita_usuario";
const AuthContext = createContext(null);

function leerUsuarioGuardado() {
  try {
    return obtenerToken() ? JSON.parse(localStorage.getItem(CLAVE_USUARIO)) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // Se arranca con el usuario guardado para no mostrar la app "sin sesión" por un instante
  const [usuario, setUsuario] = useState(leerUsuarioGuardado);
  // Mientras se verifica el token con el backend, las rutas protegidas esperan
  const [verificando, setVerificando] = useState(() => Boolean(obtenerToken()));
  const [avisoSesion, setAvisoSesion] = useState("");

  const guardarSesion = useCallback(({ token, usuario }) => {
    guardarToken(token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    setUsuario(usuario);
    setAvisoSesion("");
    return usuario;
  }, []);

  const logout = useCallback(() => {
    borrarToken();
    localStorage.removeItem(CLAVE_USUARIO);
    setUsuario(null);
  }, []);

  useEffect(() => {
    // El cliente de API llama a esto cuando el backend responde 401 (token vencido)
    configurarSesionExpirada(() => {
      logout();
      setAvisoSesion("Su sesión expiró. Inicie sesión de nuevo.");
    });

    // Al abrir la app con un token guardado, se confirma con el backend que sigue vigente
    if (!obtenerToken()) return;
    authApi
      .obtenerPerfil()
      .then((perfil) => {
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(perfil));
        setUsuario(perfil);
      })
      // Si el error es 401 el cliente ya cerró la sesión; si el backend está caído
      // se conserva el usuario guardado y las pantallas mostrarán el error de conexión.
      .catch(() => {})
      .finally(() => setVerificando(false));
  }, [logout]);

  const login = useCallback(
    async (correo, contrasena) => guardarSesion(await authApi.iniciarSesion(correo, contrasena)),
    [guardarSesion]
  );

  const registro = useCallback(
    async (datos) => guardarSesion(await authApi.registrar(datos)),
    [guardarSesion]
  );

  const valor = useMemo(
    () => ({ usuario, verificando, avisoSesion, login, registro, logout }),
    [usuario, verificando, avisoSesion, login, registro, logout]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return contexto;
}
