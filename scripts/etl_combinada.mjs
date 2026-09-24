// ETL de la base combinada: las tres oleadas en un solo artefacto para el navegador.
//
//   node scripts/etl_combinada.mjs [--out public/data/encuesta.json]
//
// Lee `data/sources/combinada/ICLAC_2023_2025_combinada.xlsx`, que es la base canónica que
// ICLAC rehízo el 01-09-2026 sobre los 1.228 casos completos de 2025. Emite los microdatos
// anonimizados y el diccionario, y **no calcula ni un porcentaje**: eso vive en
// `src/nucleo/agregar.ts`, en un solo lugar, para que la prueba de aceptación y la app no
// puedan divergir.
//
// Anonimización, que acá no es cortesía sino requisito: los microdatos viajan al navegador,
// así que salen los identificadores, las marcas de tiempo, la comuna (347 categorías, que
// cruzada con edad y educación identifica personas en celdas de un caso) y los verbatim de
// las respuestas abiertas. Queda `olas_panelista` como número, que permite filtrar los 159
// panelistas repetidos sin permitir seguirlos.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { registros } from './lib/xlsx.mjs'
import { impacto, macrozona, nombreCorto, orden } from './lib/regiones.mjs'
import { contar, etiquetas as etiquetasDePalabras, palabrasDe } from './lib/texto.mjs'
import { contrastes } from './lib/contrastes.mjs'
import { validarPreguntas } from './lib/preguntas_explorador.mjs'
import { campo, indiceRegional, FUENTE_INDICE } from './lib/ficha.mjs'

const FUENTE = 'data/sources/combinada/ICLAC_2023_2025_combinada.xlsx'

// Columnas que no viajan al navegador.
const FUERA = new Set([
  'key', 'codpanelista', 'numericalid', 'accesscount', 'status', 'type',
  'starttime', 'endtime', 'duration', 'device', 'badwordsvariables',
  'rotacion_1', 'rotacion_2', 'rotacion_3', 'rotacion_4',
  'comuna', 'ppi_tp',
  // Bloque experimental: fuera del visualizador por decisión del equipo (guía de Urdinez).
  'p29_a_size', 'p29_b_size', 'p23_size', 'p28_size',
])

const ES_VERBATIM = (nombre) => nombre.endsWith('_txt') || nombre.endsWith('_texto')

// El bloque experimental completo, que la guía deja fuera del visualizador.
const EXPERIMENTAL = new Set([
  'p29a_1', 'p29a_2', 'p29a_3', 'p29a_4', 'p29b_1', 'p29b_2', 'p29b_3', 'p29b_4',
  'p30', 'p31', 'p32', 'p33', 'p34',
])

/**
 * Preguntas de selección múltiple. En la base cada opción es una columna binaria
 * (`p20_1`, `p20_2`, …) y la etiqueta del diccionario trae la opción y el enunciado pegados:
 * «del cobre - ¿Cuáles sectores le parece que son más importantes limitar inversiones…?».
 *
 * El ETL las agrupa y separa la opción del enunciado, que es lo mismo que hace
 * `iclac_multiples()` en el monitor en R. Sin esto no se pueden graficar: son las dos
 * preguntas que cruzan con el repositorio de inversiones.
 */
const MULTIPLES = [
  { id: 'p20', prefijo: 'p20_', titulo: 'Sectores donde limitar la inversión extranjera' },
  { id: 'p22', prefijo: 'p22_', titulo: 'Efectos observados de la inversión china en su comuna' },
  { id: 'p18a', prefijo: 'p18a_', titulo: 'Cómo se informa de asuntos internacionales' },
  { id: 'p6b', prefijo: 'p6b_', titulo: 'Países visitados' },
]

/** «del cobre - ¿Cuáles sectores…?» → «del cobre». */
function opcionDe (etiqueta) {
  return String(etiqueta ?? '').split(' - ')[0].trim().replace(/\s*:$/, '')
}

/**
 * Respuestas abiertas que alimentan las nubes de palabras.
 *
 * **El verbatim no viaja al navegador.** Se tokeniza y se cuenta acá, y al artefacto van
 * conteos agregados, que es lo que permite tener nubes sin romper la anonimización. Van por
 * oleada y sin cortes: los cortes los usaba el tablero, que salió de la app (22-09-2026).
 */
const TEXTOS = [
  { id: 'p4_1', titulo: 'China', columnas: ['p4_1'] },
  { id: 'p4_2', titulo: 'Estados Unidos', columnas: ['p4_2'] },
  { id: 'p4_3', titulo: 'Corea del Sur', columnas: ['p4_3'] },
  { id: 'p4_4', titulo: 'Francia', columnas: ['p4_4'] },
  { id: 'p4_5', titulo: 'Japón', columnas: ['p4_5'] },
  { id: 'p16', titulo: 'Contextos de interacción', columnas: ['p16'] },
  { id: 'p17_texto', titulo: 'Cómo fueron las interacciones', columnas: ['p17_texto'] },
  { id: 'p6a', titulo: 'Marcas chinas mencionadas', columnas: ['p6a_2_txt', 'p6a_3_txt', 'p6a_4_txt'] },
]

export function procesar () {
  const { datos: filas } = registros(FUENTE, 'datos')
  const { datos: dicc } = registros(FUENTE, 'diccionario')
  const { datos: valores } = registros(FUENTE, 'valores')

  // Etiquetas de respuesta. La hoja las trae por ola porque el enunciado puede cambiar; nos
  // quedamos con la más reciente de cada código, que es la que usa el visualizador, y
  // dejamos anotado si difieren entre olas.
  const etiquetas = new Map()
  for (const v of valores) {
    const variable = String(v.variable ?? '').trim()
    if (!variable) continue
    if (!etiquetas.has(variable)) etiquetas.set(variable, new Map())
    const porCodigo = etiquetas.get(variable)
    const previa = porCodigo.get(v.codigo)
    porCodigo.set(v.codigo, {
      codigo: v.codigo,
      etiqueta: String(v.etiqueta ?? '').trim(),
      difiereEntreOlas: previa !== undefined && previa.etiqueta !== String(v.etiqueta ?? '').trim(),
    })
  }

  const variables = []
  for (const d of dicc) {
    const nombre = String(d.variable ?? '').trim()
    if (!nombre || FUERA.has(nombre) || ES_VERBATIM(nombre)) continue
    if (EXPERIMENTAL.has(nombre)) continue

    const categorias = etiquetas.has(nombre)
      ? [...etiquetas.get(nombre).values()].sort((a, b) => a.codigo - b.codigo)
      : null

    variables.push({
      nombre,
      etiqueta: d.etiqueta ?? null,
      tipo: d.tipo ?? null,
      olas: [2023, 2024, 2025].filter((a) => d[`ola_${a}`] === 'sí'),
      // La columna con la que ICLAC decide qué se puede comparar entre oleadas. Es su
      // criterio metodológico, no el nuestro.
      serie: d.uso_serie_longitudinal === 'sí',
      comparabilidad: d.comparabilidad ?? null,
      nota: d.nota ?? null,
      categorias,
    })
  }

  // Grupos de selección múltiple, con la opción de cada columna ya separada del enunciado.
  const multiples = MULTIPLES.map((m) => {
    const opciones = dicc
      .map((d) => String(d.variable ?? '').trim())
      .filter((n) => n.startsWith(m.prefijo) && !n.endsWith('_txt'))
      .map((n) => {
        const d = dicc.find((x) => String(x.variable ?? '').trim() === n)
        return {
          columna: n,
          opcion: opcionDe(d.etiqueta),
          olas: [2023, 2024, 2025].filter((a) => d[`ola_${a}`] === 'sí'),
        }
      })
    return { ...m, opciones }
  }).filter((m) => m.opciones.length > 0)

  const columnasMultiples = new Set(multiples.flatMap((m) => m.opciones.map((o) => o.columna)))

  // Nubes de palabras, ya contadas. El texto crudo se queda acá.
  const nubes = TEXTOS.map((t) => {
    const disponibles = t.columnas.filter((c) => dicc.some((d) => String(d.variable ?? '').trim() === c))
    if (disponibles.length === 0) return null

    // **Un elemento por persona**, con todas sus casillas: el conteo es de personas, no de menciones.
    const conTexto = (f) => disponibles.some((c) => typeof f[c] === 'string' && f[c].trim())
    const personasDe = (filas) => filas.filter(conTexto).map((f) => disponibles.map((c) => f[c]))

    // Cuánta gente contestó la pregunta. Sin esto no se puede comparar entre oleadas: 2025
    // tiene 1.227 casos contra 664 de 2023, así que un conteo crudo dice más sobre el tamaño
    // de la muestra que sobre la palabra.
    const respondieron = (filas) => filas.filter(conTexto).length
    const olasCon = [2023, 2024, 2025].filter((a) => filas.some((f) => f.ola === a && disponibles.some((c) => f[c])))
    // La forma visible de cada palabra se decide una vez, con todas las oleadas: si no, la misma
    // raíz podía llamarse distinto en dos oleadas.
    const nombres = etiquetasDePalabras(personasDe(filas))

    // **Nada suma oleadas** (decisión de Felipe, 22-09-2026): tres muestras de tamaño distinto
    // sumadas dan un número en que 2025 pesa el doble y que no describe a ninguna.
    const nube = {
      id: t.id,
      titulo: t.titulo,
      olas: olasCon,
      porOla: Object.fromEntries(olasCon.map((a) => [a, contar(personasDe(filas.filter((f) => f.ola === a)), { nombres }).slice(0, 60)])),
      baseOla: Object.fromEntries(olasCon.map((a) => [a, respondieron(filas.filter((f) => f.ola === a))])),
    }

    return nube
  }).filter(Boolean)

  // **Las respuestas abiertas no viajan en `casos`.** Se cuentan arriba y de ellas solo sale el
  // conteo y las columnas de `PALABRAS` (`lib/texto.mjs`). Hasta el 22-09-2026 las de `p4_1` a `p4_5` y `p16` se
  // colaban, porque sus nombres no terminan en `_txt`: el filtro va por lista, no por sufijo.
  const abiertas = new Set(TEXTOS.flatMap((t) => t.columnas))
  const publicadas = new Set(variables.map((v) => v.nombre).filter((n) => !abiertas.has(n)))
  const casos = filas.map((f) => {
    const caso = { ola: f.ola }
    for (const [k, v] of Object.entries(f)) {
      if (k === 'ola' || !(publicadas.has(k) || columnasMultiples.has(k))) continue
      caso[k] = v === '' ? null : v
    }
    // Número de oleadas en que participó la persona. Sin identificador: permite filtrar el
    // solapamiento sin permitir seguir a nadie.
    caso.olas_panelista = typeof f.olas_panelista === 'number' ? f.olas_panelista : 1
    // De las respuestas abiertas viaja solo si la persona escribió cada palabra contrastada.
    Object.assign(caso, palabrasDe(f))

    // Educación en cuatro niveles y nivel socioeconómico en cinco. Las categorías originales
    // son diez y siete, y sus grupos más chicos tienen 7 y 35 casos: un porcentaje sobre siete
    // personas no dice nada, y diez colores en una figura tampoco. Es la misma regla que ya
    // aplica a las regiones: agrupar antes de ofrecer.
    if (typeof f.educacion === 'number' && f.educacion <= 9) {
      caso.educacion_rec = f.educacion <= 4
        ? 'Media incompleta o menos'
        : f.educacion === 5
          ? 'Media completa'
          : f.educacion <= 7
            ? 'Técnica o universitaria incompleta'
            : 'Universitaria completa o más'
    }

    if (typeof f.nse === 'number' && f.nse <= 7) {
      caso.nse_rec = f.nse <= 3 ? 'AB · C1' : f.nse === 4 ? 'C2' : f.nse === 5 ? 'C3' : f.nse === 6 ? 'D' : 'E'
    }

    // Edad en cinco tramos: el ramo de color no distingue más de seis pasos, y el tramo 0-17
    // de la variable original está vacío.
    if (typeof f.edadr === 'number' && f.edadr >= 2) {
      caso.edad_rec = f.edadr <= 3 ? '18 a 34' : f.edadr === 4 ? '35 a 44' : f.edadr === 5 ? '45 a 54' : f.edadr === 6 ? '55 a 64' : '65 o más'
    }

    // Ideología en tres tramos. La escala cruda de 1 a 10 no sirve como corte: diez grupos
    // en una figura son ilegibles, y varios quedan con menos de cien casos. El monitor
    // tampoco la usa cruda, corta en tres.
    if (typeof f.p3 === 'number') {
      caso.p3_3 = f.p3 <= 4 ? 'Izquierda' : f.p3 <= 6 ? 'Centro' : 'Derecha'
    }

    // Agrupaciones de región: la muestra no aguanta cortar por las dieciséis.
    if (typeof f.region === 'number') {
      caso.region_macrozona = macrozona(f.region)
      caso.region_impacto = impacto(f.region)
    }
    return caso
  })

  const porOla = {}
  for (const c of casos) porOla[c.ola] = (porOla[c.ola] ?? 0) + 1

  // Qué pregunta muestra el explorador y cómo: el catálogo, cruzado con los datos. Si no cuadra,
  // el ETL se detiene antes de escribir nada.
  const preguntas = validarPreguntas({ variables, multiples, valores, casos })
  const comparaciones = contrastes(casos)
  const conAdvertencia = new Set(comparaciones.medidas.filter((m) => m.advertencia).map((m) => m.id))
  for (const p of preguntas) {
    if (p.advertencia && !conAdvertencia.has(p.advertencia)) {
      throw new Error(`explorador · ${p.id}: la advertencia «${p.advertencia}» no es una medida con advertencia en contrastes`)
    }
  }

  return {
    generado: new Date().toISOString(),
    fuente: FUENTE,
    procedencia: 'Base combinada rehecha por ICLAC el 01-09-2026 sobre los 1.228 casos de terreno de 2025, menos un panelista duplicado.',
    olas: Object.keys(porOla).map(Number).sort(),
    n: porOla,
    multiples,
    preguntas,
    nubes,
    // Regiones de norte a sur, con el número romano fuera del nombre: ocupa eje y no aporta.
    regiones: (etiquetas.get('region') ? [...etiquetas.get('region').values()] : [])
      .filter((c) => c.codigo <= 16)
      .map((c) => ({ codigo: c.codigo, etiqueta: nombreCorto(c.etiqueta), orden: orden(c.codigo) }))
      .sort((a, b) => a.orden - b.orden),
    variables,
    casos,
    // Qué diferencias entre oleadas superan el azar de la propia muestra. Se calcula acá y no en
    // la aplicación porque son diez mil permutaciones por comparación: es trabajo del artefacto,
    // no del navegador de nadie. Ver `lib/contraste.mjs` para el método y su alcance.
    contrastes: comparaciones,
    // Lo que la «Ficha técnica» describe y no está en los casos: el campo de cada oleada (de `endtime`
    // y `duration`, que no viajan) y el índice con que se estratificó la muestra.
    ficha: { campo: campo(filas), indice: indiceRegional(), fuenteIndice: FUENTE_INDICE },
  }
}

const esEjecutable = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())
if (esEjecutable) {
  const { values } = parseArgs({ options: { out: { type: 'string' } } })
  const salida = resolve(values.out ?? 'public/data/encuesta.json')
  const datos = procesar()
  mkdirSync(dirname(salida), { recursive: true })
  writeFileSync(salida, JSON.stringify(datos), 'utf8')

  console.log(`\nOleadas: ${datos.olas.map((o) => `${o} (${datos.n[o]})`).join(' · ')}`)
  console.log(`Variables publicadas: ${datos.variables.length}`)
  console.log(`Grupos de selección múltiple: ${datos.multiples.map((m) => `${m.id} (${m.opciones.length})`).join(' · ')}`)
  console.log(`Preguntas del explorador: ${datos.preguntas.length} (${datos.preguntas.filter((p) => p.serie).length} se comparan entre oleadas)`)
  console.log(`Nubes de palabras: ${datos.nubes.map((n) => `${n.id} (${n.olas.join(", ")})`).join(' · ')}`)
  console.log(`En serie longitudinal: ${datos.variables.filter((v) => v.serie).length}`)
  const comparaciones = datos.contrastes.medidas.flatMap((m) => m.comparaciones)
  console.log(`Contrastes: ${comparaciones.length} comparaciones, ${comparaciones.filter((c) => c.p < 0.05).length} por encima del ruido (p < 0,05)`)
  console.log(`\nEscrito en ${salida}\n`)
}
