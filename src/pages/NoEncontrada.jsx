import { Link } from "react-router";

export default function NoEncontrada() {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl font-bold text-acento">404</p>
      <h1 className="mt-2 text-xl font-semibold">Página no encontrada</h1>
      <Link to="/" className="btn-primario mt-6">
        Volver al inicio
      </Link>
    </div>
  );
}
