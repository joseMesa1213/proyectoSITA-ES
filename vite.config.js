import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // El backend solo acepta CORS desde http://localhost:5173: si el puerto está ocupado,
  // Vite falla en lugar de cambiarse a otro puerto en silencio.
  server: { port: 5173, strictPort: true },
});
