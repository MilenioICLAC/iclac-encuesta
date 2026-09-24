/**
 * El teclado de un grupo de botones con `role="radio"`: las flechas mueven la elección, Inicio y
 * Fin van a las puntas, y se saltan las opciones apagadas. Es el patrón que esos roles prometen a
 * un lector de pantalla; sin él, cada botón era una parada de tabulación y las flechas no hacían
 * nada (Codex, 24-09-2026).
 *
 * Devuelve el índice nuevo, o `null` si la tecla no es de este patrón.
 */
export function radioSiguiente (tecla: string, actual: number, habilitados: boolean[]): number | null {
  const n = habilitados.length
  const validos = habilitados.map((h, i) => (h ? i : -1)).filter((i) => i >= 0)
  if (validos.length === 0) return null
  if (tecla === 'Home') return validos[0]
  if (tecla === 'End') return validos[validos.length - 1]
  const paso = tecla === 'ArrowRight' || tecla === 'ArrowDown' ? 1 : tecla === 'ArrowLeft' || tecla === 'ArrowUp' ? -1 : 0
  if (paso === 0) return null
  for (let k = 1; k <= n; k++) {
    const i = (((actual + paso * k) % n) + n) % n
    if (habilitados[i]) return i
  }
  return null
}

/** Mueve el foco al radio `i` del grupo donde ocurrió el evento. */
export function enfocarRadio (grupo: HTMLElement, i: number) {
  const radios = grupo.querySelectorAll<HTMLElement>('[role="radio"]')
  radios[i]?.focus()
}
