import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ConfirmarProvider } from "./components/Confirmar.jsx";
import { AvisosProvider } from "./components/Avisos.jsx";
import LimiteDeError from "./components/LimiteDeError.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Último recurso si falla algo fuera de las páginas (barra, providers); las páginas tienen el suyo en el Layout */}
    <LimiteDeError completo>
      <BrowserRouter>
        <AuthProvider>
          <AvisosProvider>
            <ConfirmarProvider>
              <App />
            </ConfirmarProvider>
          </AvisosProvider>
        </AuthProvider>
      </BrowserRouter>
    </LimiteDeError>
  </StrictMode>
);
