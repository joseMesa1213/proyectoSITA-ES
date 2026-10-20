export default function Cargando({ texto = "Cargando..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-bosque/70" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-bosque/20 border-t-acento" />
      {texto}
    </div>
  );
}
