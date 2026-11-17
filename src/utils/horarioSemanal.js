import { DIAS } from "./fechas.js";
import { ESTADO } from "./constantes.js";

// Lógica de la grilla "Mi horario" del tutor. Funciones puras (sin React ni API) para poder probarlas.
// Fechas "YYYY-MM-DD" manejadas como medianoche UTC, igual que en utils/fechas.js.

const aFecha = (texto) => new Date(`${texto}T00:00:00Z`);
const aTexto = (fecha) => fecha.toISOString().slice(0, 10);

export function sumarDias(texto, dias) {
  const fecha = aFecha(texto);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return aTexto(fecha);
}

// Lunes de la semana a la que pertenece la fecha (la semana va de lunes a domingo)
export const lunesDe = (texto) => sumarDias(texto, -((aFecha(texto).getUTCDay() + 6) % 7));

// "14:30" → 870
export const aMinutos = (hora) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

// Cantidad de colores de la paleta (--serie-1 … --serie-6 en index.css)
export const COLORES = 6;

/**
 * Arma la semana que empieza en `lunes`:
 * - tutorias: GET /tutorias/mias. Cada horario ACTIVO de una tutoría ACTIVA es un bloque "dictada"
 *   en su día, con las reservas recibidas para esa fecha (sin contar las canceladas).
 * - recibidas: GET /reservas/tutor (reservas de otros en sus tutorías).
 * - mias: GET /reservas/mias. Las ACTIVAS o COMPLETADAS de esa semana son bloques "estudiante".
 * Devuelve { dias, rango, resumen, leyenda }.
 */
export function armarSemana({ tutorias = [], recibidas = [], mias = [], lunes }) {
  const activas = tutorias
    .filter((t) => t.id_estado === ESTADO.ACTIVO)
    .sort((a, b) => a.id - b.id);
  // Color fijo por tutoría (por id, así no cambia al navegar entre semanas)
  const colorDe = new Map(activas.map((t, i) => [t.id, (i % COLORES) + 1]));

  const dias = Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(lunes, i);
    return { fecha, dia: DIAS[aFecha(fecha).getUTCDay()], bloques: [] };
  });
  const porDia = new Map(dias.map((d) => [d.dia, d]));
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));

  let minutosSemanales = 0;
  for (const t of activas) {
    for (const h of t.horarios.filter((x) => x.id_estado === ESTADO.ACTIVO)) {
      const dia = porDia.get(h.dia);
      if (!dia) continue;
      const reservas = recibidas.filter(
        (r) => r.horario.id === h.id && r.fecha_sesion === dia.fecha && r.id_estado !== ESTADO.CANCELADO
      ).length;
      minutosSemanales += aMinutos(h.hora_fin) - aMinutos(h.hora_inicio);
      dia.bloques.push({
        tipo: "dictada",
        clave: `h${h.id}`,
        id_tutoria: t.id,
        titulo: t.titulo,
        modalidad: t.modalidad,
        cupo: t.cupo,
        lugar: h.recurso?.nombre ?? "",
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
        reservas,
        color: colorDe.get(t.id),
      });
    }
  }

  for (const r of mias) {
    if (r.id_estado !== ESTADO.ACTIVO && r.id_estado !== ESTADO.COMPLETADO) continue;
    const dia = porFecha.get(r.fecha_sesion);
    if (!dia) continue;
    dia.bloques.push({
      tipo: "estudiante",
      clave: `r${r.id}`,
      id_tutoria: r.tutoria.id,
      titulo: r.tutoria.titulo,
      modalidad: r.tutoria.modalidad,
      lugar: r.recurso?.nombre ?? "",
      hora_inicio: r.horario.hora_inicio,
      hora_fin: r.horario.hora_fin,
    });
  }

  for (const d of dias) d.bloques.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  const todos = dias.flatMap((d) => d.bloques);
  const dictadas = todos.filter((b) => b.tipo === "dictada");
  // Rango visible: de la hora en punto anterior al primer bloque a la siguiente al último (8–18 si no hay nada)
  const rango = todos.length
    ? {
        inicio: Math.floor(Math.min(...todos.map((b) => aMinutos(b.hora_inicio))) / 60),
        fin: Math.ceil(Math.max(...todos.map((b) => aMinutos(b.hora_fin))) / 60),
      }
    : { inicio: 8, fin: 18 };

  return {
    dias,
    rango,
    resumen: {
      horasSemanales: minutosSemanales / 60,
      sesiones: dictadas.length,
      conReservas: dictadas.filter((b) => b.reservas > 0).length,
      reservas: dictadas.reduce((total, b) => total + b.reservas, 0),
      comoEstudiante: todos.length - dictadas.length,
      diasLibres: dias.filter((d) => d.bloques.length === 0).length,
    },
    leyenda: activas
      .filter((t) => t.horarios.some((h) => h.id_estado === ESTADO.ACTIVO))
      .map((t) => ({ id: t.id, titulo: t.titulo, color: colorDe.get(t.id) })),
  };
}
