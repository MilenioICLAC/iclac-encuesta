/**
 * Los datos del laboratorio de las series del tablero (`laboratorio/tablero-series.html`).
 *
 * Calcula con las mismas funciones de la app (`filtrar`, `distribucion`, `proporcion`) y escribe
 * el resultado dentro del bloque `<script id="datos">` del laboratorio, así que las cifras no se
 * copian a mano. Se corre desde la raíz del repositorio:
 *
 *   npx vite-node laboratorio/datos-series.ts && npm run lab:series
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { distribucion, filtrar, proporcion } from '../src/nucleo/agregar'
import { MODULOS } from '../src/nucleo/modulos'
import type { Encuesta } from '../src/nucleo/tipos'

const LABORATORIO = 'laboratorio/tablero-series.html'
const IDS = ['screening', 'mall', 'restaurante', 'conoce', 'racismo', 'marcas', 'sinovac']
const BLOQUES = ['inversion', 'cotidiana', 'vacunas']

const encuesta = JSON.parse(readFileSync('public/data/encuesta.json', 'utf8')) as Encuesta

const modulos = IDS.map((id) => {
  const def = MODULOS.find((m) => m.id === id)
  if (!def) throw new Error(`No existe el módulo ${id}`)
  // `marcas` sigue en la app el código 1 de `p6a_1`, que es la casilla «No»: sus conteos son el
  // complemento exacto de `p6a_2` en las dos oleadas. El laboratorio usa `p6a_2` («Sí»).
  const nombre = id === 'marcas' ? 'p6a_2' : def.variable
  const variable = encuesta.variables.find((v) => v.nombre === nombre)
  if (!variable) throw new Error(`No existe la variable ${nombre}`)

  const olas = encuesta.olas.map((ola) => {
    if (!variable.olas.includes(ola)) return { ola, dato: null }
    const casos = filtrar(encuesta, { olas: [ola] })
    const completa = distribucion(casos, variable)
    const app = proporcion(casos, variable, def.codigos ?? [], { excluidos: def.excluidos })
    return {
      ola,
      dato: {
        app: { porcentaje: app.porcentaje, base: app.base },
        segmentos: completa.segmentos.map((s) => ({ codigo: s.codigo, etiqueta: s.etiqueta, n: s.n, porcentaje: s.porcentaje })),
        base: completa.base,
      },
    }
  })

  return {
    id,
    variable: nombre,
    titulo: def.titulo,
    bajada: def.bajada,
    ancho: def.ancho,
    bloque: def.bloque,
    advertencia: def.advertencia ?? null,
    enunciado: variable.etiqueta,
    olasPregunta: variable.olas,
    serie: variable.serie,
    olas,
  }
})

const datos = {
  generado: encuesta.generado,
  bloques: encuesta.bloques.filter((b) => BLOQUES.includes(b.id)).map((b) => ({ id: b.id, titulo: b.titulo })),
  // Todos los módulos de esos bloques, en el orden de la rejilla, para que los anchos y los
  // saltos de fila sean los de la app.
  rejilla: MODULOS.filter((m) => BLOQUES.includes(m.bloque)).map((m) => ({ id: m.id, bloque: m.bloque, titulo: m.titulo, ancho: m.ancho, forma: m.forma })),
  modulos,
}

const bloque = /(<script type="application\/json" id="datos">)[\s\S]*?(<\/script>)/
const html = readFileSync(LABORATORIO, 'utf8')
if (!bloque.test(html)) throw new Error(`${LABORATORIO} no tiene el bloque <script id="datos">`)
// `<` escapado: un `</script>` dentro de una etiqueta cerraría el bloque antes de tiempo.
const json = JSON.stringify(datos).replace(/</g, '\\u003c')
writeFileSync(LABORATORIO, html.replace(bloque, (_, abre: string, cierra: string) => abre + json + cierra))

for (const m of modulos) {
  console.log(m.id.padEnd(12), m.olas.map((o) => (o.dato ? `${o.ola} ${o.dato.app.porcentaje.toFixed(1)}` : `${o.ola} —`)).join('  '))
}
