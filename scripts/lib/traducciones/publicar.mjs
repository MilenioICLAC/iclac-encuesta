// Del artefacto en español al artefacto en tres idiomas.
//
// El español se queda donde está (`preguntas_explorador.mjs`, `contrastes.mjs`, los datos); el inglés
// y el chino viven en archivos paralelos de esta carpeta, uno por tema e idioma. Acá se validan contra
// el español (`validar.mjs`) y cada texto visible pasa de `'…'` a `{ es, en, cn }`, que es lo que
// `src/nucleo/tipos.ts` llama `Traducible`.

import { existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { textosDeContrastes, textosDePalabras, textosDePreguntas } from './textos.mjs'
import { aplanar, validarTraducciones } from './validar.mjs'

export const ARCHIVOS = ['preguntas', 'contrastes', 'palabras']
export const IDIOMAS = ['en', 'cn']

const carpeta = new URL('./', import.meta.url)
const rutaDe = (archivo, idioma) => new URL(`${archivo}.${idioma}.mjs`, carpeta)

/** Lo que exportan los archivos de traducción, `{ en: { preguntas, … }, cn: { … } }`. */
export async function cargarTraducciones () {
  const salida = {}
  for (const idioma of IDIOMAS) {
    salida[idioma] = {}
    for (const archivo of ARCHIVOS) salida[idioma][archivo] = (await import(rutaDe(archivo, idioma).href)).default
  }
  return salida
}

/** El español de cada archivo, sacado de los datos ya armados. */
export function espanol (datos) {
  return {
    preguntas: textosDePreguntas(datos.preguntas),
    contrastes: textosDeContrastes(datos.contrastes),
    palabras: textosDePalabras(datos),
  }
}

/**
 * Valida y publica. Devuelve los datos con cada texto visible como `{ es, en, cn }`; no toca el
 * objeto de entrada.
 */
export function traducirDatos (datos, traducciones) {
  const es = espanol(datos)
  for (const archivo of ARCHIVOS) {
    validarTraducciones(archivo, es[archivo], Object.fromEntries(IDIOMAS.map((i) => [i, traducciones[i][archivo]])))
  }
  // `t('preguntas', ['p24', 'titulo'])` → `{ es, en, cn }` del texto en esa ruta.
  const hojas = Object.fromEntries(ARCHIVOS.map((archivo) => [archivo, {
    es: new Map(aplanar(es[archivo]).map(([r, v]) => [JSON.stringify(r), v])),
    ...Object.fromEntries(IDIOMAS.map((i) => [i, new Map(aplanar(traducciones[i][archivo]).map(([r, v]) => [JSON.stringify(r), v]))])),
  }]))
  const t = (archivo, ruta) => {
    const clave = JSON.stringify(ruta.map(String))
    return Object.fromEntries(['es', ...IDIOMAS].map((i) => [i, hojas[archivo][i].get(clave)]))
  }
  const porOla = (archivo, ruta, objeto) => (objeto
    ? Object.fromEntries(Object.keys(objeto).map((ola) => [ola, t(archivo, [...ruta, ola])]))
    : undefined)
  const conCampos = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))

  const preguntas = datos.preguntas.map((p) => {
    const categoria = (c) => (p.abierta
      ? { ...c, etiqueta: t('palabras', [c.etiqueta]) }
      : conCampos({
        ...c,
        etiqueta: t('preguntas', [p.id, 'categorias', c.codigo]),
        porOla: c.porOla ? porOla('preguntas', [p.id, 'categoriasPorOla', c.codigo], c.porOla) : undefined,
      }))
    return conCampos({
      ...p,
      titulo: t('preguntas', [p.id, 'titulo']),
      enunciado: t('preguntas', [p.id, 'enunciado']),
      tituloPorOla: porOla('preguntas', [p.id, 'tituloPorOla'], p.tituloPorOla),
      enunciadoPorOla: porOla('preguntas', [p.id, 'enunciadoPorOla'], p.enunciadoPorOla),
      poblacion: p.poblacion ? t('preguntas', [p.id, 'poblacion']) : undefined,
      poblacionPorOla: porOla('preguntas', [p.id, 'poblacionPorOla'], p.poblacionPorOla),
      nota: p.nota ? t('preguntas', [p.id, 'nota']) : undefined,
      sinSerie: p.sinSerie ? t('preguntas', [p.id, 'sinSerie']) : undefined,
      categorias: p.categorias?.map(categoria),
      serie: p.serie
        ? conCampos({
          ...p.serie,
          categorias: p.serie.categorias?.map((c) => ({ ...c, etiqueta: t('preguntas', [p.id, 'serie', 'categorias', c.codigo]) })),
          nota: p.serie.nota ? t('preguntas', [p.id, 'serie', 'nota']) : undefined,
        })
        : p.serie,
    })
  })

  const c = datos.contrastes
  const contrastes = {
    ...c,
    metodo: { ...c.metodo, alcance: t('contrastes', ['metodo', 'alcance']) },
    medidas: c.medidas.map((m) => conCampos({
      ...m,
      etiqueta: t('contrastes', ['medidas', m.id, 'etiqueta']),
      advertencia: m.advertencia ? t('contrastes', ['medidas', m.id, 'advertencia']) : undefined,
    })),
    brechas: c.brechas.map((b) => ({ ...b, etiqueta: t('contrastes', ['brechas', b.id, 'etiqueta']) })),
    grupos: c.grupos.map((g) => ({
      ...g,
      etiqueta: t('contrastes', ['grupos', g.id, 'etiqueta']),
      // Los tramos siguen nombrados por su clave en `porOla`, `brecha.entre` y `entreOlas`: el rótulo va aparte.
      nombres: Object.fromEntries(Object.keys(es.contrastes.grupos[g.id].tramos).map((n) => [n, t('contrastes', ['grupos', g.id, 'tramos', n])])),
    })),
    regresiones: c.regresiones.map((r) => ({ ...r, etiqueta: t('contrastes', ['regresiones', r.id, 'etiqueta']) })),
    transversal: c.transversal.map((x) => ({
      ...x,
      cortes: x.cortes.map((k) => ({ ...k, etiqueta: t('contrastes', ['transversal', x.id, 'cortes', k.campo]) })),
    })),
    ...(c.familias ? { familias: c.familias.map((f) => ({ ...f, etiqueta: t('contrastes', ['familias', f.id, 'etiqueta']) })) } : {}),
  }

  const nubes = datos.nubes.map((n) => ({
    ...n,
    porOla: Object.fromEntries(Object.entries(n.porOla).map(([ola, lista]) => [ola, lista.map((x) => ({ ...x, palabra: t('palabras', [x.palabra]) }))])),
  }))

  return { ...datos, preguntas, contrastes, nubes }
}

// --- El esqueleto ------------------------------------------------------------------------------

const cadena = (v) => `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const clave = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) || /^(0|[1-9]\d*)$/.test(k) ? k : cadena(k))

/** Un objeto como módulo, una clave por línea, con comillas simples como el resto del repositorio. */
function modulo (objeto, sangria = '  ') {
  const lineas = []
  for (const [k, v] of Object.entries(objeto)) {
    if (v !== null && typeof v === 'object') lineas.push(`${sangria}${clave(k)}: {`, modulo(v, `${sangria}  `), `${sangria}},`)
    else lineas.push(`${sangria}${clave(k)}: ${cadena(v)},`)
  }
  return lineas.join('\n')
}

const CABECERA = {
  preguntas: 'del catálogo del explorador (`scripts/lib/preguntas_explorador.mjs` y las abiertas), por id de pregunta. `categorias` va por código; `categoriasPorOla`, por código y oleada; `serie`, lo de «Entre oleadas». Los enunciados y categorías de 2023 y 2024 salen del libro de códigos oficial en este idioma; los de 2025, sin libro, los traducimos nosotros.',
  contrastes: 'de los textos de los contrastes (`scripts/lib/contrastes.mjs`), por id de medida, brecha, grupo, regresión y familia. `tramos` son los nombres de los grupos de cada contraste, por su clave en español.',
  palabras: 'de las palabras de las respuestas abiertas y de las nubes, por la palabra en español. En pantalla van con la original al lado: «trade (comercio)». Una marca o un nombre propio se deja igual.',
}
const NOMBRE = { en: 'inglés', cn: 'chino (simplificado)' }

/**
 * Escribe los archivos de traducción que no existen, con cada valor igual al español: es lo que se
 * reemplaza al traducir. **Nunca pisa uno que existe**; para esos, el ETL dice qué claves faltan o sobran.
 */
export function escribirEsqueletos (datos) {
  const es = espanol(datos)
  const escritos = []
  for (const idioma of IDIOMAS) {
    for (const archivo of ARCHIVOS) {
      const ruta = rutaDe(archivo, idioma)
      if (existsSync(ruta)) continue
      const texto = [
        `// Traducción al ${NOMBRE[idioma]} ${CABECERA[archivo]}`,
        '//',
        '// Cada valor empieza igual al español y se reemplaza por la traducción. Las claves no se tocan:',
        '// el ETL falla si falta o sobra una (`validar.mjs`). Generado por `node scripts/etl_combinada.mjs --esqueleto`.',
        '',
        'export default {',
        modulo(es[archivo]),
        '}',
        '',
      ].join('\n')
      writeFileSync(ruta, texto, 'utf8')
      escritos.push(fileURLToPath(ruta))
    }
  }
  return escritos
}
