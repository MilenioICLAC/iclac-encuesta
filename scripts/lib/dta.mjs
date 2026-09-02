// Lector del libro de códigos de un archivo Stata .dta (release 117 y 118).
//
// Lee solo la documentación: nombres de variable, enunciado de cada pregunta y las
// etiquetas de las categorías de respuesta. No decodifica la matriz de datos, que se
// toma del CSV de la misma entrega.
//
// Existe porque de la oleada 2023 no llegó el export etiquetado de cuatro hojas que sí
// llegó de 2025, y el .dta es la única fuente legible por máquina de esas etiquetas.
// Registro interno: C9.
//
// Dos cosas del formato que cuestan si no se saben:
//
//  - La codificación la fija el release, no un sniffer: 117 es latin-1 y 118 es utf-8.
//    Adivinarla mirando los bytes da latin-1 en un archivo utf-8, porque el relleno de
//    los campos no es texto (ver el punto siguiente). Es el mismo tropiezo que hace que
//    `pandas.read_stata` caiga a latin-1 y devuelva todos los acentos como mojibake.
//  - **El relleno de los campos de ancho fijo trae basura del escritor.** El primer
//    nombre de variable de la entrega 2023 es `key\0ricalId\0…`: restos de
//    `numericalId` que quedaron después del terminador. Por eso cada campo se corta en
//    el primer NUL **antes** de decodificar, nunca después.

const ANCHOS = {
  117: { nombre: 33, etiquetaVar: 81, nombreEtiquetas: 33, codificacion: 'latin1' },
  118: { nombre: 129, etiquetaVar: 321, nombreEtiquetas: 129, codificacion: 'utf-8' }
}

function hastaNul (buf) {
  const corte = buf.indexOf(0)
  return corte === -1 ? buf : buf.subarray(0, corte)
}

function campo (buf, codificacion) {
  return new TextDecoder(codificacion).decode(hastaNul(buf)).trim()
}

// Los enunciados de la entrega 2023 vienen recortados a 80 bytes, que es el ancho del
// campo en el release 117 aunque el archivo se declare 118. El corte cae a mitad de un
// carácter multibyte y deja un U+FFFD al final; se saca, y la variable queda marcada
// como truncada para que nadie publique media pregunta creyendo que es la pregunta.
const TOPE_ENUNCIADO = 80

function campoConMedida (buf, codificacion) {
  const crudo = hastaNul(buf)
  const texto = new TextDecoder(codificacion).decode(crudo).replace(/�+$/, '').trim()
  return { texto, bytes: crudo.length }
}

function contenidoDe (buf, etiqueta) {
  const abre = buf.indexOf(`<${etiqueta}>`, 0, 'latin1')
  const cierra = buf.indexOf(`</${etiqueta}>`, 0, 'latin1')
  if (abre === -1 || cierra === -1) throw new Error(`falta la sección <${etiqueta}> en el .dta`)
  return buf.subarray(abre + etiqueta.length + 2, cierra)
}

function trocear (buf, ancho, codificacion, conMedida = false) {
  if (buf.length % ancho !== 0) {
    throw new Error(`sección de ${buf.length} bytes no divisible por el ancho de campo ${ancho}`)
  }
  const salida = []
  for (let i = 0; i < buf.length; i += ancho) {
    const trozo = buf.subarray(i, i + ancho)
    salida.push(conMedida ? campoConMedida(trozo, codificacion) : campo(trozo, codificacion))
  }
  return salida
}

// Cada bloque <lbl> es: int32 largo, nombre del conjunto, 3 bytes de relleno, int32 n,
// int32 largo del texto, n offsets, n valores, y el blob con las etiquetas separadas
// por NUL.
function leerConjuntosDeEtiquetas (buf, anchos) {
  const conjuntos = {}
  const marca = Buffer.from('<lbl>', 'latin1')
  let pos = buf.indexOf(marca)

  while (pos !== -1) {
    let p = pos + marca.length
    p += 4 // largo del bloque, redundante con </lbl>
    const nombre = campo(buf.subarray(p, p + anchos.nombreEtiquetas), anchos.codificacion)
    p += anchos.nombreEtiquetas + 3 // + relleno
    const n = buf.readInt32LE(p); p += 4
    const largoTexto = buf.readInt32LE(p); p += 4

    const offsets = []
    for (let i = 0; i < n; i++) { offsets.push(buf.readInt32LE(p)); p += 4 }
    const valores = []
    for (let i = 0; i < n; i++) { valores.push(buf.readInt32LE(p)); p += 4 }
    const blob = buf.subarray(p, p + largoTexto)

    const entradas = []
    for (let i = 0; i < n; i++) {
      entradas.push({
        codigo: valores[i],
        etiqueta: campo(blob.subarray(offsets[i]), anchos.codificacion)
      })
    }
    entradas.sort((a, b) => a.codigo - b.codigo)
    conjuntos[nombre] = entradas

    pos = buf.indexOf(marca, p + largoTexto)
  }
  return conjuntos
}

/**
 * Devuelve el libro de códigos del .dta: una variable por entrada, con su enunciado y
 * sus categorías de respuesta ya resueltas.
 *
 * `sospechas` lista los textos que quedaron con el carácter de reemplazo U+FFFD, que es
 * la señal de que la codificación declarada por el release no calza con los bytes. Está
 * vacío en las entregas conocidas y sirve para que un archivo futuro no pase callado.
 */
export function leerLibroDeCodigos (buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
  const release = Number(campo(contenidoDe(buf, 'release'), 'latin1'))
  const anchos = ANCHOS[release]
  if (!anchos) throw new Error(`release ${release} del .dta no soportado (solo 117 y 118)`)

  const nombres = trocear(contenidoDe(buf, 'varnames'), anchos.nombre, anchos.codificacion)
  const enunciados = trocear(contenidoDe(buf, 'variable_labels'), anchos.etiquetaVar, anchos.codificacion, true)
  const conjuntoDe = trocear(contenidoDe(buf, 'value_label_names'), anchos.nombreEtiquetas, anchos.codificacion)
  const conjuntos = leerConjuntosDeEtiquetas(contenidoDe(buf, 'value_labels'), anchos)

  const variables = nombres.map((nombre, i) => {
    const { texto, bytes } = enunciados[i]
    // Stata deja el enunciado vacío cuando la pregunta no lo trae, y en 2024 lo llena
    // con el propio nombre de la columna. Las dos formas se tratan como "no hay".
    const hay = texto && texto.toLowerCase() !== nombre.toLowerCase()
    return {
      nombre,
      enunciado: hay ? texto : null,
      enunciadoTruncado: hay ? bytes >= TOPE_ENUNCIADO : false,
      conjuntoEtiquetas: conjuntoDe[i] || null,
      categorias: conjuntoDe[i] ? (conjuntos[conjuntoDe[i]] ?? null) : null
    }
  })

  const sospechas = []
  for (const v of variables) {
    if (v.enunciado?.includes('�')) sospechas.push(`enunciado de ${v.nombre}`)
    for (const c of v.categorias ?? []) {
      if (c.etiqueta.includes('�')) sospechas.push(`categoría ${c.codigo} de ${v.nombre}`)
    }
  }

  return {
    release,
    codificacion: anchos.codificacion,
    casos: Number(buf.readBigUInt64LE(buf.indexOf('<N>', 0, 'latin1') + 3)),
    variables,
    conjuntos,
    sospechas
  }
}
