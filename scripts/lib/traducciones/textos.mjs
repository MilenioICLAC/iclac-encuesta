// Qué textos del artefacto se traducen, y con qué clave.
//
// Cada función devuelve el **español**, con la misma forma que tienen los archivos de traducción
// (`preguntas.en.mjs`, `contrastes.cn.mjs`, `palabras.en.mjs`…). Esa forma es el contrato: el ETL
// valida que cada idioma tenga exactamente estas claves (`validar.mjs`) y después publica cada texto
// como `{ es, en, cn }` (`publicar.mjs`). Un texto nuevo en el catálogo sin su traducción detiene el ETL.
//
// Las claves son estables y legibles: id de pregunta y código de categoría, id de medida, la palabra
// en español. **Nunca la posición**: un orden que cambia no puede mover una traducción a otra fila.

const siHay = (objeto) => (Object.keys(objeto).length > 0 ? objeto : undefined)
const conCampos = (campos) => Object.fromEntries(Object.entries(campos).filter(([, v]) => v !== undefined))

/**
 * El catálogo del explorador, por id de pregunta. `categorias` va por código y `categoriasPorOla`
 * por código y oleada (las etiquetas que cambian de sentido, `p4`, `p15`). En una abierta las
 * categorías son palabras y viven en el archivo de palabras, no acá.
 */
export function textosDePreguntas (preguntas) {
  const salida = {}
  for (const p of preguntas) {
    const categorias = {}
    const categoriasPorOla = {}
    if (!p.abierta) {
      for (const c of p.categorias ?? []) {
        categorias[c.codigo] = c.etiqueta
        if (c.porOla) categoriasPorOla[c.codigo] = { ...c.porOla }
      }
    }
    const serie = p.serie
      ? conCampos({
          nota: p.serie.nota,
          categorias: siHay(Object.fromEntries((p.serie.categorias ?? []).map((c) => [c.codigo, c.etiqueta]))),
        })
      : {}
    salida[p.id] = conCampos({
      titulo: p.titulo,
      enunciado: p.enunciado,
      tituloPorOla: p.tituloPorOla,
      enunciadoPorOla: p.enunciadoPorOla,
      poblacion: p.poblacion,
      poblacionPorOla: p.poblacionPorOla,
      nota: p.nota,
      sinSerie: p.sinSerie,
      categorias: siHay(categorias),
      categoriasPorOla: siHay(categoriasPorOla),
      serie: siHay(serie),
    })
  }
  return salida
}

/**
 * Los contrastes, por id: las etiquetas de medidas, brechas, grupos, regresiones y familias, las
 * advertencias, los nombres de los tramos de cada grupo, los de los cortes de `transversal` y el
 * alcance del método. Las unidades (`%`, `puntos`) no: son claves que la interfaz lee.
 */
export function textosDeContrastes (c) {
  const porId = (lista, campos) => Object.fromEntries(lista.map((x) => [x.id, campos(x)]))
  return {
    metodo: { alcance: c.metodo.alcance },
    medidas: porId(c.medidas, (m) => conCampos({ etiqueta: m.etiqueta, advertencia: m.advertencia })),
    brechas: porId(c.brechas, (b) => ({ etiqueta: b.etiqueta })),
    grupos: porId(c.grupos, (g) => ({
      etiqueta: g.etiqueta,
      tramos: Object.fromEntries([...new Set(g.porOla.flatMap((o) => o.tramos.map((t) => t.nombre)))].map((n) => [n, n])),
    })),
    regresiones: porId(c.regresiones, (r) => ({ etiqueta: r.etiqueta })),
    transversal: porId(c.transversal, (t) => ({ cortes: Object.fromEntries(t.cortes.map((k) => [k.campo, k.etiqueta])) })),
    familias: porId(c.familias ?? [], (f) => ({ etiqueta: f.etiqueta })),
  }
}

/**
 * Las palabras de las respuestas abiertas y de las nubes, por la palabra en español: la misma
 * palabra se traduce una vez aunque salga en varias preguntas. Ordenadas, para que el esqueleto no
 * cambie de orden entre corridas.
 */
export function textosDePalabras ({ preguntas, nubes }) {
  const palabras = new Set()
  for (const p of preguntas) if (p.abierta) for (const c of p.categorias ?? []) palabras.add(c.etiqueta)
  for (const n of nubes) for (const lista of Object.values(n.porOla)) for (const x of lista) palabras.add(x.palabra)
  return Object.fromEntries([...palabras].sort((a, b) => a.localeCompare(b, 'es')).map((p) => [p, p]))
}
