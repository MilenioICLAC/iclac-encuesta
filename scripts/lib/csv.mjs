// Parser de CSV según RFC 4180: comillas, comas dentro del campo y saltos de línea
// dentro de un campo entrecomillado.
//
// No se usa `split(",")` porque las preguntas abiertas ("¿qué es lo primero que se le
// viene a la cabeza cuando le dicen China?") traen comas en la respuesta.

export function parsearCsv (texto, separador = ',') {
  const sinBom = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto
  const filas = []
  let fila = []
  let campo = ''
  let entreComillas = false

  for (let i = 0; i < sinBom.length; i++) {
    const c = sinBom[i]

    if (entreComillas) {
      if (c === '"') {
        if (sinBom[i + 1] === '"') { campo += '"'; i++ } else { entreComillas = false }
      } else {
        campo += c
      }
      continue
    }

    if (c === '"') { entreComillas = true } else if (c === separador) {
      fila.push(campo); campo = ''
    } else if (c === '\n') {
      fila.push(campo); filas.push(fila); fila = []; campo = ''
    } else if (c !== '\r') {
      campo += c
    }
  }
  if (campo !== '' || fila.length > 0) { fila.push(campo); filas.push(fila) }
  return filas
}

/** Detecta el separador mirando el encabezado. Excel en configuración española escribe `;`. */
export function detectarSeparador (texto) {
  const [cabecera = ''] = texto.split(/\r?\n/, 1)
  return (cabecera.match(/;/g) ?? []).length > (cabecera.match(/,/g) ?? []).length ? ';' : ','
}
