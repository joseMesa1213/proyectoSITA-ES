import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { actualizarTutoria, listarMisTutorias } from "../../api/tutorias.js";
import { listarReservasRecibidas } from "../../api/reservas.js";
import Alerta from "../../components/Alerta.jsx";
import Cargando from "../../components/Cargando.jsx";
import BotonEstadoTutoria from "../../components/BotonEstadoTutoria.jsx";
import FormularioTutoria from "../../components/FormularioTutoria.jsx";
import HorariosTutoria from "../../components/HorariosTutoria.jsx";
import { InsigniaEstado } from "../../components/Insignias.jsx";
import { ESTADO } from "../../utils/constantes.js";
import { reservasActivasFuturas } from "../../utils/reservas.js";

// Editar una tutoría propia y administrar sus horarios.
// Se usa GET /tutorias/mias (y no GET /tutorias/:id) porque trae también los horarios inactivos.
export default function GestionTutoria() {
  const { id } = useParams();
  const ubicacion = useLocation();
  const [tutoria, setTutoria] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(ubicacion.state?.aviso ?? "");

  useEffect(() => {
    Promise.all([listarMisTutorias(), listarReservasRecibidas()])
      .then(([tutorias, reservas]) => {
        const encontrada = tutorias.find((t) => t.id === Number(id));
        if (!encontrada) throw new Error("No se encontró la tutoría entre las suyas");
        setTutoria(encontrada);
        setReservas(reservas);
      })
      .catch(setError);
  }, [id]);

  if (!tutoria) {
    return error ? (
      <div className="space-y-4">
        <Alerta error={error} />
        <Link to="/tutor/tutorias" className="btn-secundario">← Mis tutorías</Link>
      </div>
    ) : (
      <Cargando />
    );
  }

  const activa = tutoria.id_estado === ESTADO.ACTIVO;
  const futuras = reservasActivasFuturas(reservas, (r) => r.tutoria.id === tutoria.id).length;

  const guardar = async (datos) => {
    setTutoria(await actualizarTutoria(tutoria.id, datos));
    setAviso("Cambios guardados.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cambioDeEstado = (actualizada) => {
    setTutoria(actualizada);
    setAviso(actualizada.id_estado === ESTADO.ACTIVO ? "Tutoría reactivada." : "Tutoría inactivada.");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/tutor/tutorias" className="text-sm font-medium text-bosque/70 hover:text-bosque">← Mis tutorías</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-bosque/60">{tutoria.materia.nombre}</p>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold">
            {tutoria.titulo}
            <InsigniaEstado idEstado={tutoria.id_estado} nombre={activa ? "Activa" : "Inactiva"} />
          </h1>
        </div>
        <div className="flex gap-2">
          {activa && <Link to={`/tutorias/${tutoria.id}`} className="btn-secundario">Ver en el catálogo</Link>}
          <BotonEstadoTutoria tutoria={tutoria} reservasFuturas={futuras} onCambiada={cambioDeEstado} onError={setError} />
        </div>
      </div>

      {aviso && <Alerta tipo="exito" onCerrar={() => setAviso("")}>{aviso}</Alerta>}
      <Alerta error={error} />
      {!activa && <Alerta>Esta tutoría está inactiva: no aparece en el catálogo ni se puede reservar.</Alerta>}

      <section className="tarjeta space-y-3">
        <h2 className="text-lg font-semibold">Horarios semanales</h2>
        <HorariosTutoria tutoria={tutoria} reservas={reservas} onCambio={(horarios) => setTutoria({ ...tutoria, horarios })} />
      </section>

      <section className="tarjeta space-y-3">
        <h2 className="text-lg font-semibold">Datos de la tutoría</h2>
        {/* key: si la tutoría cambia (guardar), el formulario se reinicia con los datos nuevos */}
        <FormularioTutoria key={JSON.stringify([tutoria.titulo, tutoria.descripcion, tutoria.nivel, tutoria.modalidad, tutoria.cupo])}
          tutoria={tutoria} reservasActivas={futuras} onGuardar={guardar} />
      </section>
    </div>
  );
}
