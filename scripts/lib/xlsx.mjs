// Lector mínimo de .xlsx, sin dependencias.
//
// Existe porque las bases canónicas de las tres oleadas son .xlsx y el ETL tiene que leerlas.
// Las alternativas de npm no convencen: la versión de SheetJS que está publicada en el registro
// arrastra una vulnerabilidad conocida y el proyecto se mudó a su propio CDN, y las demás traen
// un árbol de dependencias grande para lo poco que hace falta acá. Un .xlsx es un ZIP con XML
// adentro, y Node ya tiene zlib.
//
// Lee lo que el ETL necesita y nada más: hojas por nombre, celdas con su valor, cadenas
// compartidas y cadenas en línea. No interpreta fórmulas (usa el último valor calculado que
// Excel dejó guardado), no aplica formatos de celda y no convierte fechas: una fecha vuelve como
// el número de serie de Excel, que es lo que hay en el archivo.
//
// Lo que sí importa y no es evidente:
//
//  - Las filas y las celdas vacías no existen en el XML. Una fila con datos solo en la columna D
//    trae una sola celda, con r="D7". Por eso hay que ubicar cada celda por su referencia y
//    rellenar los huecos, en vez de leer las celdas en orden.
//  - El ZIP se recorre por su directorio central, no buscando firmas de encabezado local: los
//    datos comprimidos pueden contener esa misma secuencia de bytes por casualidad.

import { readFileSync } from 'node:fs'
import { inflateRawSync } from 'node:zlib'

const FIN_DIRECTORIO = 0x06054b50
const ENTRADA_DIRECTORIO = 0x02014b50
const ENCABEZADO_LOCAL = 0x04034b50

// --- ZIP ---------------------------------------------------------------

function abrirZip(ruta) {
  const buf = readFileSync(ruta)

  // El fin del directorio central está al final, después de un comentario de largo variable.
  let fin = -1
  for (let i = buf.length - 22; i >= 0 && i >= buf.length - 22 - 65535; i--) {
    if (buf.readUInt32LE(i) === FIN_DIRECTORIO) { fin = i; break }
  }
  if (fin < 0) throw new Error(`${ruta}: no es un ZIP (falta el fin del directorio central)`)

  const cantidad = buf.readUInt16LE(fin + 10)
  let pos = buf.readUInt32LE(fin + 16)

  const entradas = new Map()
  for (let i = 0; i < cantidad; i++) {
    if (buf.readUInt32LE(pos) !== ENTRADA_DIRECTORIO) {
      throw new Error(`${ruta}: entrada ${i} del directorio central corrupta`)
    }
    const metodo = buf.readUInt16LE(pos + 10)
    const comprimido = buf.readUInt32LE(pos + 20)
    const largoNombre = buf.readUInt16LE(pos + 28)
    const largoExtra = buf.readUInt16LE(pos + 30)
    const largoComentario = buf.readUInt16LE(pos + 32)
    const offsetLocal = buf.readUInt32LE(pos + 42)
    const nombre = buf.toString('utf8', pos + 46, pos + 46 + largoNombre)
    entradas.set(nombre, { metodo, comprimido, offsetLocal })
    pos += 46 + largoNombre + largoExtra + largoComentario
  }

  return {
    nombres: () => [...entradas.keys()],
    leer(nombre) {
      const e = entradas.get(nombre)
      if (!e) throw new Error(`${ruta}: no contiene ${nombre}`)
      if (buf.readUInt32LE(e.offsetLocal) !== ENCABEZADO_LOCAL) {
        throw new Error(`${ruta}: encabezado local corrupto en ${nombre}`)
      }
      // El encabezado local repite el nombre y los extras, con largos propios que pueden
      // diferir de los del directorio central. Hay que leerlos de acá.
      const largoNombre = buf.readUInt16LE(e.offsetLocal + 26)
      const largoExtra = buf.readUInt16LE(e.offsetLocal + 28)
      const inicio = e.offsetLocal + 30 + largoNombre + largoExtra
      const datos = buf.subarray(inicio, inicio + e.comprimido)
      if (e.metodo === 0) return datos
      if (e.metodo === 8) return inflateRawSync(datos)
      throw new Error(`${ruta}: método de compresión ${e.metodo} no soportado en ${nombre}`)
    },
  }
}

// --- XML ---------------------------------------------------------------

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function desescapar(s) {
  if (!s.includes('&')) return s
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (todo, cuerpo) => {
    if (cuerpo[0] === '#') {
      const cod = cuerpo[1] === 'x' || cuerpo[1] === 'X'
        ? parseInt(cuerpo.slice(2), 16)
        : parseInt(cuerpo.slice(1), 10)
      return Number.isFinite(cod) ? String.fromCodePoint(cod) : todo
    }
    return ENTIDADES[cuerpo] ?? todo
  })
}

// Concatena el texto de todos los <t> del fragmento. Es lo que hace falta para las cadenas
// compartidas, donde una sola cadena puede venir partida en varios <t> por cambios de formato.
function textoDeT(fragmento) {
  let out = ''
  const re = /<t(?:\s[^>]*)?(?:\/>|>([\s\S]*?)<\/t>)/g
  let m
  while ((m = re.exec(fragmento)) !== null) out += desescapar(m[1] ?? '')
  return out
}

function cadenasCompartidas(zip) {
  if (!zip.nombres().includes('xl/sharedStrings.xml')) return []
  const xml = zip.leer('xl/sharedStrings.xml').toString('utf8')
  const out = []
  const re = /<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g
  let m
  while ((m = re.exec(xml)) !== null) out.push(textoDeT(m[1]))
  return out
}

// "BC12" -> 54 (índice de columna, base 0)
function indiceColumna(ref) {
  let n = 0
  for (let i = 0; i < ref.length; i++) {
    const c = ref.charCodeAt(i)
    if (c < 65 || c > 90) break
    n = n * 26 + (c - 64)
  }
  return n - 1
}

// --- API ---------------------------------------------------------------

/** Nombres de las hojas, en el orden del libro. */
export function hojas(ruta) {
  const zip = abrirZip(ruta)
  const xml = zip.leer('xl/workbook.xml').toString('utf8')
  return [...xml.matchAll(/<sheet\s[^>]*name="([^"]*)"/g)].map((m) => desescapar(m[1]))
}

/**
 * Filas de una hoja, como arreglos de valores. Los números vuelven como number, el texto como
 * string, las celdas vacías como null. `hoja` es el nombre; si se omite, la primera.
 */
export function filas(ruta, hoja) {
  const zip = abrirZip(ruta)
  const libro = zip.leer('xl/workbook.xml').toString('utf8')

  const declaradas = [...libro.matchAll(/<sheet\s[^>]*?name="([^"]*)"[^>]*?r:id="([^"]*)"|<sheet\s[^>]*?r:id="([^"]*)"[^>]*?name="([^"]*)"/g)]
    .map((m) => (m[1] !== undefined ? { nombre: desescapar(m[1]), rid: m[2] } : { nombre: desescapar(m[4]), rid: m[3] }))
  if (declaradas.length === 0) throw new Error(`${ruta}: el libro no declara hojas`)

  const elegida = hoja === undefined ? declaradas[0] : declaradas.find((d) => d.nombre === hoja)
  if (!elegida) {
    throw new Error(`${ruta}: no tiene la hoja "${hoja}". Tiene: ${declaradas.map((d) => d.nombre).join(', ')}`)
  }

  // El nombre del archivo de la hoja sale de las relaciones del libro, no del orden de <sheet>.
  const rels = zip.leer('xl/_rels/workbook.xml.rels').toString('utf8')
  const destinos = new Map(
    [...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => {
      const id = /Id="([^"]*)"/.exec(m[0])?.[1]
      const target = /Target="([^"]*)"/.exec(m[0])?.[1]
      return [id, target]
    }),
  )
  let destino = destinos.get(elegida.rid)
  if (!destino) throw new Error(`${ruta}: la hoja "${elegida.nombre}" no tiene relación ${elegida.rid}`)
  destino = destino.replace(/^\//, '')
  if (!destino.startsWith('xl/')) destino = `xl/${destino}`

  const compartidas = cadenasCompartidas(zip)
  const xml = zip.leer(destino).toString('utf8')

  const out = []
  const reFila = /<row(?:\s[^>]*)?(?:\/>|>([\s\S]*?)<\/row>)/g
  let mFila
  while ((mFila = reFila.exec(xml)) !== null) {
    const cuerpo = mFila[1]
    if (!cuerpo) { out.push([]); continue }

    const celdas = new Map()
    const reCelda = /<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g
    let mCelda
    while ((mCelda = reCelda.exec(cuerpo)) !== null) {
      const atributos = mCelda[1]
      const interior = mCelda[2] ?? ''
      const ref = /r="([A-Z]+\d+)"/.exec(atributos)?.[1]
      if (!ref) continue
      const tipo = /t="([^"]*)"/.exec(atributos)?.[1]

      let valor = null
      if (tipo === 'inlineStr') {
        valor = textoDeT(interior)
      } else {
        const v = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(interior)?.[1]
        if (v !== undefined) {
          const crudo = desescapar(v)
          if (tipo === 's') valor = compartidas[Number(crudo)] ?? ''
          else if (tipo === 'str') valor = crudo
          else if (tipo === 'b') valor = crudo === '1'
          else if (tipo === 'e') valor = null // celda de error de Excel
          else {
            const n = Number(crudo)
            valor = Number.isNaN(n) ? crudo : n
          }
        }
      }
      celdas.set(indiceColumna(ref), valor)
    }

    if (celdas.size === 0) { out.push([]); continue }
    const ancho = Math.max(...celdas.keys()) + 1
    const fila = new Array(ancho).fill(null)
    for (const [i, v] of celdas) fila[i] = v
    out.push(fila)
  }
  return out
}

/**
 * La hoja como objetos, usando la primera fila de encabezado. Las columnas sin nombre se
 * descartan; los nombres repetidos se quedan con la última columna, que es lo que hace Excel al
 * abrir el mismo archivo.
 */
export function registros(ruta, hoja) {
  const todas = filas(ruta, hoja)
  if (todas.length === 0) return { columnas: [], datos: [] }

  const columnas = todas[0].map((c) => (c === null ? '' : String(c).trim()))
  const datos = todas.slice(1).map((f) => {
    const o = {}
    for (let i = 0; i < columnas.length; i++) {
      if (columnas[i] === '') continue
      o[columnas[i]] = i < f.length ? f[i] : null
    }
    return o
  })
  return { columnas, datos }
}
