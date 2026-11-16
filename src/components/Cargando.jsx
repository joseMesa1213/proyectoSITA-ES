export default function Cargando({ texto = "Cargando..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-texto-suave" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-borde-fuerte border-t-acento" />
      {texto}
    </div>
  );
}
