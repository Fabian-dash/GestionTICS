/**
 * horarioUtils.js
 * Utilidades para cálculo de fecha fin basado en horario y duración del programa.
 */

/**
 * Dado una fecha inicio, un array de días de la semana, horas por sesión y horas totales,
 * calcula la fecha fin estimada avanzando día a día.
 *
 * @param {string}   fechaInicio   - 'YYYY-MM-DD'
 * @param {string[]} dias          - ['Lunes','Martes',...]
 * @param {string}   horaInicio    - 'HH:MM'
 * @param {string}   horaFin       - 'HH:MM'
 * @param {number}   duracionHoras - duración total del programa en horas
 * @returns {string} 'YYYY-MM-DD' o '' si no se puede calcular
 */
export const calcularFechaFin = (fechaInicio, dias, horaInicio, horaFin, duracionHoras) => {
  if (!fechaInicio || !dias?.length || !horaInicio || !horaFin || !duracionHoras) return '';

  const [hIni, mIni] = horaInicio.split(':').map(Number);
  const [hFin, mFin] = horaFin.split(':').map(Number);
  const minutosPorSesion = (hFin * 60 + mFin) - (hIni * 60 + mIni);
  if (minutosPorSesion <= 0) return '';

  const horasPorSesion = minutosPorSesion / 60;
  const totalHoras = Number(duracionHoras);
  if (totalHoras <= 0) return '';

  const MAP_DIAS = {
    'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3,
    'Jueves': 4, 'Viernes': 5, 'Sábado': 6
  };

  const diasNums = dias.map(d => MAP_DIAS[d]).filter(n => n !== undefined);
  if (!diasNums.length) return '';

  let horasAcumuladas = 0;
  let fecha = new Date(fechaInicio + 'T12:00:00');

  const maxIteraciones = 365 * 5;
  let iteracion = 0;

  while (horasAcumuladas < totalHoras && iteracion < maxIteraciones) {
    if (diasNums.includes(fecha.getDay())) {
      horasAcumuladas += horasPorSesion;
    }
    if (horasAcumuladas < totalHoras) {
      fecha.setDate(fecha.getDate() + 1);
    }
    iteracion++;
  }

  if (iteracion >= maxIteraciones) return '';

  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};