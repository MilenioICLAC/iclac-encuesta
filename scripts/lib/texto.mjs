// Tokenización de las respuestas abiertas.
//
// Portado de `iclac_texto_tokenizar()` del monitor en R, con una diferencia declarada: donde
// el original lematiza con el stemmer español de `corpus` (Snowball), acá se normalizan los
// sufijos más frecuentes del español a mano. **Las nubes no van a ser idénticas a las del
// sitio.** El diccionario de correcciones sí es el suyo, porque no se deriva de ninguna regla:
// son cuarenta y tantas grafías concretas de estos datos («moll» a «mall», seis formas de
// escribir «eiffel»), y perderlo sería perder el trabajo de limpieza que ya está hecho.
//
// Corre en el ETL, no en el navegador, y por eso **el verbatim nunca sale de esta máquina**:
// al artefacto viajan conteos agregados, no lo que la persona escribió. Eso es lo que permite
// tener nubes de palabras sin romper la anonimización.

/** Stopwords del español, más las que el monitor descarta a mano en la nube de contactos. */
const VACIAS = new Set(`a al algo algun alguna algunas alguno algunos ante antes aquel aquella
aquellas aquello aquellos aqui asi aun aunque cada casi como con contra cual cuales cuando cuanto
de del desde donde dos el ella ellas ello ellos en entre era eran es esa esas ese eso esos esta
estaba estan estas este esto estos fue fueron ha hace hacia han hasta hay la las le les lo los mas
me mi mis mucho muy nada ni no nos nosotros nuestra nuestro o otra otras otro otros para pero poco
por porque que quien quienes se ser si sin sobre solo son su sus tambien tan tanto te tiene tienen
toda todas todo todos tu tus un una unas uno unos ya yo
ninguna voy como interaccion hace etc nose tengo tener tenido hacer hecho ser sido estar estado`.split(/\s+/).filter(Boolean))

/**
 * Correcciones de grafía, portadas del monitor. No se derivan de ninguna regla: son errores
 * concretos de estos datos, y por eso se conservan tal cual.
 */
const EXACTAS = {
  economia: 'economía', inversor: 'inversión', poblacion: 'población', pais: 'país',
  bejim: 'beijing', cobrr: 'cobre', comen: 'comida', malls: 'mall', moll: 'mall',
  gran: 'grande', buenas: 'buena', avance: 'avanzado', cosad: 'cosas',
  innovacion: 'innovación', industrializado: 'industrial', confucionismo: 'confucianismo',
  "aliexpress's": 'aliexpress',
  infel: 'eiffel', eisfel: 'eiffel', iffel: 'eiffel', aifel: 'eiffel', eifel: 'eiffel', ifel: 'eiffel',
  nads: 'nada', nose: 'nada',
  milenaria: 'antiguo', ancestral: 'antiguo',
}

/** Correcciones por patrón, en orden: la primera que calza gana. */
const PATRONES = [
  [/industrializaci[oó]n/, 'industrial'],
  [/tecno/, 'tecnología'],
  [/comuni/, 'comunismo'],
  [/comer/, 'comercio'],
  [/.liexp/, 'aliexpress'],
  [/autom.vil/, 'auto'],
  [/cult|cuktura/, 'cultura'],
  [/producci/, 'producción'],
  [/importac/, 'importación'],
  [/export/, 'exportación'],
  [/comida/, 'comida'],
  [/restau|resto|rest.*ran/, 'restaurante'],
  [/tienda/, 'tienda'],
  [/amigo|amiga|amistad/, 'amistad'],
  [/persona/, 'persona'],
  [/alg(u|ú)n/, 'alguno'],
  [/vecino|vecina/, 'vecinos'],
  [/client/, 'cliente'],
  [/vendedor/, 'vendedores'],
  [/local/, 'local'],
  [/familia/, 'familiar'],
  [/hij(o|a)/, 'hijos'],
  [/atiende/, 'atención'],
  [/compra|compro/, 'compras'],
  [/comprad/, 'comprador'],
  [/compl/, 'complicación'],
  [/covid/, 'coronavirus'],
]

const sinTilde = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

/**
 * Raíz aproximada, para agrupar formas de la misma palabra.
 *
 * **No es Snowball.** Recorta los sufijos más frecuentes del español, en orden de largo, y
 * exige que quede una raíz de al menos cuatro letras. Agrupa bien plurales y géneros, que es
 * el grueso de lo que hay en respuestas de una o dos palabras; no agrupa formas verbales
 * conjugadas tan bien como el original.
 */
function raiz (palabra) {
  const base = sinTilde(palabra)
  const sufijos = [
    'aciones', 'iciones', 'amiento', 'imiento', 'aciones',
    'antes', 'ancia', 'encia', 'cion', 'sion',
    'ando', 'iendo', 'ador', 'edor', 'idor',
    'osos', 'osas', 'ista', 'ismo',
    'es', 'os', 'as', 'a', 'o', 's',
  ]
  for (const s of sufijos) {
    if (base.length - s.length >= 4 && base.endsWith(s)) return base.slice(0, -s.length)
  }
  return base
}

function corregir (palabra) {
  if (EXACTAS[palabra]) return EXACTAS[palabra]
  for (const [patron, reemplazo] of PATRONES) {
    if (patron.test(palabra)) return reemplazo
  }
  return palabra
}

/** Separa una respuesta abierta en palabras ya corregidas y sin stopwords. */
export function tokenizar (texto) {
  if (typeof texto !== 'string') return []
  return texto
    .toLowerCase()
    .split(/[^\p{L}\p{N}'']+/u)
    .filter(Boolean)
    .map(corregir)
    .filter((p) => p.length > 2 && !VACIAS.has(sinTilde(p)))
}

/**
 * Cuenta palabras sobre un conjunto de respuestas, agrupando por raíz.
 *
 * La etiqueta del grupo es **la forma más frecuente**, no la raíz: la raíz de «inversión» es
 * «invers», que no se puede mostrar. Es el mismo criterio del monitor.
 */
export function contar (textos, { minimo = 2 } = {}) {
  const grupos = new Map()

  for (const texto of textos) {
    for (const palabra of tokenizar(texto)) {
      const clave = raiz(palabra)
      if (!grupos.has(clave)) grupos.set(clave, { total: 0, formas: new Map() })
      const g = grupos.get(clave)
      g.total += 1
      g.formas.set(palabra, (g.formas.get(palabra) ?? 0) + 1)
    }
  }

  return [...grupos.values()]
    .map((g) => {
      const [forma] = [...g.formas.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))[0]
      return { palabra: forma, n: g.total }
    })
    .filter((p) => p.n >= minimo)
    .sort((a, b) => b.n - a.n || a.palabra.localeCompare(b.palabra, 'es'))
}
