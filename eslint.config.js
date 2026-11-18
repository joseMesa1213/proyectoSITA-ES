import js from "@eslint/js";
import globals from "globals";

// Lo importante aquí es no-undef: atrapa componentes o funciones usados sin importar
// (un merge que borró dos imports dejó "Mi agenda" en blanco en producción, 2026-11-18).
// `npm run build` corre el lint primero, así que un error así ya no llega a Render.
export default [
  { ignores: ["dist/"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    // `const { aviso, ...resto } = obj` es la forma de quitar una clave: no cuenta como sin usar
    rules: { "no-unused-vars": ["error", { ignoreRestSiblings: true }] },
  },
  {
    files: ["vite.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
];
