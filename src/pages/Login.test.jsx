// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";

// Login lee VITE_LOGIN_CONTRASENA y VITE_GOOGLE_CLIENT_ID al cargarse (igual que al compilar):
// cada prueba fija las variables, vuelve a cargar el módulo y lo dibuja.
const login = vi.fn();
vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => ({ avisoSesion: null, login, loginConGoogle: vi.fn() }),
}));

async function montar({ contrasena, google = "id-de-prueba.apps.googleusercontent.com" } = {}) {
  vi.stubEnv("VITE_LOGIN_CONTRASENA", contrasena ?? "");
  vi.stubEnv("VITE_GOOGLE_CLIENT_ID", google);
  vi.resetModules();
  const { default: Login } = await import("./Login.jsx");
  render(<MemoryRouter><Login /></MemoryRouter>);
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  login.mockReset();
});

describe("Login (solo Google @udea.edu.co)", () => {
  test("por defecto: sin formulario de contraseña ni enlace de registro", async () => {
    await montar();
    expect(screen.getByText("@udea.edu.co")).toBeTruthy();
    expect(screen.queryByLabelText("Contraseña")).toBeNull();
    expect(screen.queryByText(/Solo desarrollo/)).toBeNull();
    expect(screen.queryByRole("link", { name: /regístrese|registrarse|crear cuenta/i })).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("solo «true» exacto muestra el formulario", async () => {
    await montar({ contrasena: "1" });
    expect(screen.queryByLabelText("Contraseña")).toBeNull();
  });

  test("con VITE_LOGIN_CONTRASENA=true aparece el formulario marcado «Solo desarrollo»", async () => {
    await montar({ contrasena: "true" });
    expect(screen.getByText("Solo desarrollo")).toBeTruthy();
    expect(screen.getByLabelText("Correo")).toBeTruthy();
    expect(screen.getByLabelText("Contraseña")).toBeTruthy();
  });

  test("el formulario de desarrollo muestra el error del backend (por ejemplo, el 403 «use Google»)", async () => {
    login.mockRejectedValue(new Error("El ingreso con correo y contraseña está desactivado."));
    await montar({ contrasena: "true" });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "camila.gomez@demo.sita-es.test" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Udea123." } });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("está desactivado"));
    expect(login).toHaveBeenCalledWith("camila.gomez@demo.sita-es.test", "Udea123.");
  });

  test("sin Google ni formulario avisa que falta la configuración", async () => {
    await montar({ google: "" });
    expect(screen.getByRole("alert").textContent).toContain("VITE_GOOGLE_CLIENT_ID");
  });
});
