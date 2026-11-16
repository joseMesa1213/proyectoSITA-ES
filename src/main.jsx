import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ConfirmarProvider } from "./components/Confirmar.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfirmarProvider>
          <App />
        </ConfirmarProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
