import { useEffect, useState } from "react";
import { useAvisos } from "./Avisos.jsx";
import { agregarHorario } from "../api/tutorias.js";
import { obtenerOpciones } from "../api/catalogos.js";
import { listarRecursos } from "../api/recursos.js";
import Alerta from "./Alerta.jsx";
import { RECURSO_POR_MODALIDAD } from "../utils/constantes.js";

const VACIO = { dia: "", hora_inicio: "", hora_fin: "", id_recurso: "" };

/**
 * Formulario para agregar un horario semanal a una tutoría. Se usa en "Gestionar tutoría" y en el
 * diálogo de "Mi horario" (clic en un hueco de la grilla), que lo abre con día y horas ya puestos.
 * - Solo se ofrecen recursos compatibles con la modalidad y con capacidad para el cupo.
 * - Tutoría Virtual: no hay selector; todos sus horarios usan su sala de Jitsi (la crea el backend).
 * - Si el bloque se cruza con otro horario del tutor o el salón ya está ocupado, el backend
 *   responde 409 y Alerta muestra con cuál se cruza.
 * Props: tutoria, inicial? ({ dia, hora_inicio, hora_fin }), onAgregado(horario), apilado? (en columna).
 */
export default function FormularioHorario({ tutoria, inicial, onAgregado, apilado = false }) {
  const avisos = useAvisos();
  const [dias, setDias] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [nuevo, setNuevo] = useState({ ...VACIO, ...inicial });
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const esVirtual = tutoria.modalidad === "Virtual";

  useEffect(() => {
    // El backend guarda Domingo primero; en la interfaz se muestra Lunes primero
    obtenerOpciones()
      .then(({ dias }) => setDias([...dias.slice(1), dias[0]]))
      .catch(setError);
  }, []);

  useEffect(() => {
    if (esVirtual) return;
    listarRecursos(RECURSO_POR_MODALIDAD[tutoria.modalidad])
      .then((lista) => setRecursos(lista.filter((r) => r.capacidad >= tutoria.cupo)))
      .catch(setError);
  }, [esVirtual, tutoria.modalidad, tutoria.cupo]);

  const cambiar = (e) => setNuevo({ ...nuevo, [e.target.name]: e.target.value });

  const agregar = async (evento) => {
    evento.preventDefault();
    setError(null);
    if (nuevo.hora_fin <= nuevo.hora_inicio) {
      return setError(new Error("La hora de fin debe ser posterior a la hora de inicio"));
    }
    setProcesando(true);
    try {
      const { id_recurso, ...franja } = nuevo;
      const horario = await agregarHorario(tutoria.id, esVirtual ? franja : { ...franja, id_recurso: Number(id_recurso) });
      avisos.exito(`Horario agregado: ${horario.dia} ${horario.hora_inicio} – ${horario.hora_fin}${esVirtual ? "" : ` en ${horario.recurso.nombre}`}.`);
      setNuevo(VACIO);
      onAgregado(horario);
    } catch (err) {
      setError(err);
    } finally {
      setProcesando(false);
    }
  };

  const id = (campo) => `${campo}-${tutoria.id}`;
  const distribucion = apilado
    ? "grid gap-3 sm:grid-cols-3"
    : "grid gap-3 rounded-control bg-superficie-hundida p-4 sm:grid-cols-[1.3fr_1fr_1fr_1.5fr_auto] sm:items-end";

  return (
    <div className="space-y-3">
      <Alerta error={error} />
      <form onSubmit={agregar} className={distribucion}>
        <div>
          <label htmlFor={id("dia")} className="etiqueta">Día</label>
          <select id={id("dia")} name="dia" className="campo" required value={nuevo.dia} onChange={cambiar}>
            <option value="">Seleccione...</option>
            {dias.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={id("hora_inicio")} className="etiqueta">Desde</label>
          <input id={id("hora_inicio")} name="hora_inicio" type="time" className="campo" required value={nuevo.hora_inicio} onChange={cambiar} />
        </div>
        <div>
          <label htmlFor={id("hora_fin")} className="etiqueta">Hasta</label>
          <input id={id("hora_fin")} name="hora_fin" type="time" className="campo" required value={nuevo.hora_fin} onChange={cambiar} />
        </div>
        {esVirtual ? (
          <div className={apilado ? "sm:col-span-3" : ""}>
            <p className="etiqueta">Lugar</p>
            <p className="rounded-control px-3 py-2 text-sm text-texto-suave">Sala de Jitsi de la tutoría</p>
          </div>
        ) : (
          <div className={apilado ? "sm:col-span-3" : ""}>
            <label htmlFor={id("id_recurso")} className="etiqueta">Salón o enlace</label>
            <select id={id("id_recurso")} name="id_recurso" className="campo" required value={nuevo.id_recurso} onChange={cambiar}>
              <option value="">{recursos.length ? "Seleccione..." : "No hay recursos disponibles"}</option>
              {recursos.map((r) => <option key={r.id} value={r.id}>{r.nombre} (cap. {r.capacidad})</option>)}
            </select>
          </div>
        )}
        <button type="submit" className={`btn-primario ${apilado ? "sm:col-span-3 sm:justify-self-end" : ""}`} disabled={procesando}>
          {procesando ? "Agregando..." : "Agregar horario"}
        </button>
      </form>
    </div>
  );
}
