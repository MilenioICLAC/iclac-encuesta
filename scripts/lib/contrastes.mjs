// Qué diferencias del producto se contrastan, y con qué números quedan publicadas.
//
// La lista está acá y no repartida por el código porque es lo que hay que poder auditar de un
// vistazo: son las comparaciones que el visualizador muestra, y cada una viaja con su prueba.
// La maquinaria estadística vive en `contraste.mjs`; esto es qué se le pide.

import { bootstrap, bootstrapMedia, estandarizada, generador, media, permutacion, permutacionPareada, RONDAS, SEMILLA } from './contraste.mjs'

/** Las medidas que el recorrido y el tablero comparan entre oleadas. */
export const MEDIDAS = [
  { id: 'termometro-china', etiqueta: 'Opinión sobre China', unidad: 'puntos', tipo: 'media', campo: 'p5_1_val' },
  { id: 'termometro-eeuu', etiqueta: 'Opinión sobre Estados Unidos', unidad: 'puntos', tipo: 'media', campo: 'p5_2_val' },
  { id: 'termometro-corea', etiqueta: 'Opinión sobre Corea del Sur', unidad: 'puntos', tipo: 'media', campo: 'p5_3_val' },
  { id: 'termometro-francia', etiqueta: 'Opinión sobre Francia', unidad: 'puntos', tipo: 'media', campo: 'p5_4_val' },
  { id: 'termometro-japon', etiqueta: 'Opinión sobre Japón', unidad: 'puntos', tipo: 'media', campo: 'p5_5_val' },
  { id: 'confianza-china', etiqueta: 'Mucha confianza en China', unidad: '%', tipo: 'proporcion', campo: 'p24', codigos: [1] },
  { id: 'confianza-eeuu', etiqueta: 'Mucha confianza en Estados Unidos', unidad: '%', tipo: 'proporcion', campo: 'p25', codigos: [1] },
  // **La caja de arriba no es «confiar».** `p24` y `p25` tienen cuatro categorías ordenadas, y
  // resumirlas en un número pide un corte. Con «mucha» sola, China pasa a Estados Unidos en 2025;
  // con «mucha o algo», China venía arriba desde 2023. Las dos versiones se calculan y se
  // publican, porque una afirmación cuyo signo depende de un umbral no declarado es exactamente
  // el defecto que ya nos costó tres cifras de opinión circulando (hecho 6 del CLAUDE.md).
  { id: 'confia-china', etiqueta: 'Confía en China (mucha o algo)', unidad: '%', tipo: 'proporcion', campo: 'p24', codigos: [1, 2] },
  { id: 'confia-eeuu', etiqueta: 'Confía en Estados Unidos (mucha o algo)', unidad: '%', tipo: 'proporcion', campo: 'p25', codigos: [1, 2] },
  // La comparación **dentro de la persona**: las dos preguntas las contesta el mismo encuestado,
  // así que se puede decir a cuál de las dos potencias le tiene más confianza cada uno. No
  // necesita umbral, que es lo que la hace la medida más firme de la escena.
  {
    id: 'mas-confianza-china',
    etiqueta: 'Confía más en China que en Estados Unidos',
    unidad: '%',
    tipo: 'proporcion',
    valor: (c) => { const d = brechaConfianza(c); return d === null ? null : (d > 0 ? 100 : 0) },
  },
  {
    id: 'mas-confianza-eeuu',
    etiqueta: 'Confía más en Estados Unidos que en China',
    unidad: '%',
    tipo: 'proporcion',
    valor: (c) => { const d = brechaConfianza(c); return d === null ? null : (d < 0 ? 100 : 0) },
  },
  // El empate importa tanto como los dos lados: la escena afirma que la ventaja de China crece
  // **sacándole gente al empate**, y sin medirlo esa frase sería una lectura a ojo de la figura.
  {
    id: 'empate-confianza',
    etiqueta: 'Les tiene la misma confianza a las dos potencias',
    unidad: '%',
    tipo: 'proporcion',
    valor: (c) => { const d = brechaConfianza(c); return d === null ? null : (d === 0 ? 100 : 0) },
  },
  { id: 'no-alineamiento', etiqueta: 'No alineamiento', unidad: '%', tipo: 'proporcion', campo: 'p26', codigos: [3, 4] },
  { id: 'pro-china', etiqueta: 'Prefiere alinearse con China', unidad: '%', tipo: 'proporcion', campo: 'p26', codigos: [1] },
  { id: 'pro-eeuu', etiqueta: 'Prefiere alinearse con Estados Unidos', unidad: '%', tipo: 'proporcion', campo: 'p26', codigos: [2] },
  // **Las dos mitades del no alineamiento, cada una por su cuenta.** Estaban solo sumadas, y con
  // el agregado no se puede afirmar nada sobre ellas: el guion viejo de la escena 5 decía que el
  // no alineamiento se erosiona, y lo que hay que poder probar es que **ninguna de las dos se
  // mueve sola**, o sea que el hallazgo dependía de sumarlas. Sin estas dos, la prueba que dice
  // eso estaría midiendo otra cosa.
  { id: 'distancia-ambos', etiqueta: 'Prefiere mantener distancia de ambas potencias', unidad: '%', tipo: 'proporcion', campo: 'p26', codigos: [3] },
  { id: 'relacionarse-ambos', etiqueta: 'Prefiere relacionarse con ambas potencias', unidad: '%', tipo: 'proporcion', campo: 'p26', codigos: [4] },
]

/**
 * La brecha entre dos países **dentro de cada persona**.
 *
 * Es el estadístico correcto para «en 2025 evalúan mejor a China que a Estados Unidos»: la misma
 * persona pone las dos notas, así que restar dentro del encuestado saca del medio que una oleada
 * use la escala más generosa que otra.
 */
export const BRECHAS = [
  { id: 'brecha-china-eeuu', etiqueta: 'Opinión sobre China menos opinión sobre Estados Unidos', unidad: 'puntos', campos: ['p5_1_val', 'p5_2_val'] },
  // La escena 1 afirma además que un tercer país encabeza la serie. Es la misma clase de
  // afirmación y se contrasta igual, en vez de quedar como la única del tramo sin prueba.
  { id: 'brecha-japon-china', etiqueta: 'Opinión sobre Japón menos opinión sobre China', unidad: 'puntos', campos: ['p5_5_val', 'p5_1_val'] },
  // La misma idea sobre una escala ordinal de cuatro categorías: cuántos escalones de confianza
  // separan a China de Estados Unidos **dentro de cada persona**. La unidad es «escalones» y no
  // porcentaje: no se publica como cifra en el recorrido, sirve para probar que el balance de una
  // oleada se inclina hacia un lado y no es el reparto que cabría esperar del azar.
  { id: 'brecha-confianza', etiqueta: 'Confianza en China menos confianza en Estados Unidos', unidad: 'escalones', valor: brechaConfianza },
  // **La ventaja de una potencia sobre la otra en `p26`, dentro de la persona.** Es la que
  // sostiene el titular de la escena 5, y va acá y no como dos proporciones sueltas porque `p26`
  // es una elección **única**: quien contesta «China» está a la vez no contestando «Estados
  // Unidos», así que restar dos porcentajes independientes tira esa dependencia a la basura. La
  // permutación de signo es la prueba exacta para esto, y es la misma que ya usa la brecha del
  // termómetro. Quien no elige bando entra con cero: no inclina la balanza, pero cuenta en el
  // denominador, que es lo que hace que la cifra sea comparable con las proporciones publicadas.
  { id: 'ventaja-china-p26', etiqueta: 'Prefiere alinearse con China menos prefiere alinearse con Estados Unidos', unidad: 'puntos porcentuales', valor: ventajaP26 },
]

/** +100 si prefiere a China, −100 si prefiere a Estados Unidos, 0 si no elige bando. */
function ventajaP26 (c) {
  const v = numero(c.p26)
  if (v === null) return null
  return v === 1 ? 100 : v === 2 ? -100 : 0
}

/**
 * La escala de `p24` y `p25`, de menos a más, con la distancia entre escalones dada por igual.
 *
 * **Los códigos no están ordenados**: 1 es «Mucha», 3 es «Poca» y 99 es «Ninguna», así que restar
 * los códigos crudos daría cualquier cosa. Es el mismo cuidado del hecho 7: los centinelas se
 * reconocen por la etiqueta y no por el número.
 */
const ESCALON = { 99: 0, 3: 1, 2: 2, 1: 3 }

/** Cuántos escalones de confianza separan a China de Estados Unidos en una misma persona. */
function brechaConfianza (c) {
  const a = ESCALON[Number(c.p24)]
  const b = ESCALON[Number(c.p25)]
  return a === undefined || b === undefined ? null : a - b
}

/**
 * Comparaciones **entre grupos dentro de una misma oleada**, además de entre oleadas.
 *
 * La escena 1 afirma que el eje político no ordena la opinión sobre China, y eso es una
 * comparación entre tramos ideológicos en cada año, no entre años. Los tramos son los mismos que
 * usa el ETL para `p3_3`, escritos acá con la escala cruda para que la prueba funcione igual sobre
 * la base canónica, que no trae la derivada.
 */
export const GRUPOS = [
  {
    id: 'ideologia-china',
    etiqueta: 'Opinión sobre China por tramo ideológico',
    unidad: 'puntos',
    campo: 'p5_1_val',
    tramos: [
      ['Izquierda', (c) => typeof c.p3 === 'number' && c.p3 <= 4],
      ['Centro', (c) => typeof c.p3 === 'number' && c.p3 >= 5 && c.p3 <= 6],
      ['Derecha', (c) => typeof c.p3 === 'number' && c.p3 >= 7],
    ],
    // Las dos puntas: es la brecha que el relato afirma o niega.
    puntas: ['Izquierda', 'Derecha'],
  },
]

/**
 * Regresiones de una variable continua sobre una escala, con lo que hace falta para **contar el
 * experimento**: el promedio y el número de casos de cada punto de la escala, la recta con el
 * intervalo de su pendiente, y qué punto la sostiene.
 *
 * El último dato es el que importa y no es decorativo: una pendiente que se apaga al sacar una
 * celda de treinta personas no es un hallazgo, es esa celda. Se calcula sacando cada punto de la
 * escala por turno y quedándose con el que más mueve la pendiente.
 */
export const REGRESIONES = [
  {
    id: 'ideologia-china',
    etiqueta: 'Opinión sobre China según autoubicación ideológica',
    x: 'p3',
    y: 'p5_1_val',
    rango: [1, 10],
    minimoPorPunto: 10,
  },
]

/**
 * En cuántos grupos de cada corte se mueve una medida entre dos oleadas.
 *
 * Responde «¿el cambio viene de un sector o de todos?» sin pedirle al lector que mire veinte
 * figuras. **No afirma que cada grupo por separado supere el ruido**: con cien casos por celda casi
 * ninguno lo haría. Afirma algo más débil y verificable: en cuántos el promedio se movió en la
 * misma dirección.
 */
export const TRANSVERSAL = [
  { id: 'opinion-china', campo: 'p5_1_val', cortes: [
    ['nse_rec', 'niveles socioeconómicos'],
    ['region_macrozona', 'macrozonas'],
    ['edad_rec', 'tramos de edad'],
  ] },
]

const numero = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null)

function ajustar (xy) {
  const n = xy.length
  const mx = media(xy.map((q) => q[0]))
  const my = media(xy.map((q) => q[1]))
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (const [x, y] of xy) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2 }
  return { b: sxy / sxx, a: my - (sxy / sxx) * mx, centro: [mx, my], r2: (sxy * sxy) / (sxx * syy), n }
}

/** Pendiente con intervalo bootstrap y su prueba de permutación (se baraja la variable dependiente). */
function pendiente (xy, { rondas, semilla }) {
  const { b, a, centro, r2, n } = ajustar(xy)
  const azar = generador(semilla + 31)
  const bs = new Float64Array(rondas)
  for (let r = 0; r < rondas; r++) {
    const m = new Array(n)
    for (let i = 0; i < n; i++) m[i] = xy[Math.floor(azar() * n)]
    bs[r] = ajustar(m).b
  }
  bs.sort()
  const azar2 = generador(semilla + 57)
  const ys = xy.map((q) => q[1])
  let extremos = 0
  for (let r = 0; r < rondas; r++) {
    const mezcla = ys.slice()
    for (let i = mezcla.length - 1; i > 0; i--) {
      const j = Math.floor(azar2() * (i + 1))
      const t = mezcla[i]; mezcla[i] = mezcla[j]; mezcla[j] = t
    }
    if (Math.abs(ajustar(xy.map((q, i) => [q[0], mezcla[i]])).b) >= Math.abs(b) - 1e-12) extremos++
  }
  return {
    b, a, centro, r2: r2 * 100, n,
    ic: [bs[Math.floor(0.025 * rondas)], bs[Math.floor(0.975 * rondas)]],
    p: (extremos + 1) / (rondas + 1),
  }
}

/**
 * El valor de una medida en un caso, o `null` si esa persona no contesta.
 *
 * **La medida puede traer su propia función** (`valor`) en vez de una columna: hace falta cuando el
 * número no está en la base y se arma con dos preguntas, como la confianza comparada entre las dos
 * potencias. Con columna, `proporcion` cuenta 100 o 0 según si el código está en la lista.
 */
function valorDe (medida) {
  if (typeof medida.valor === 'function') return medida.valor
  return (c) => {
    const v = numero(c[medida.campo])
    if (v === null) return null
    return medida.tipo === 'proporcion' ? (medida.codigos.includes(v) ? 100 : 0) : v
  }
}

function valoresDe (casos, medida) {
  const salida = []
  const valor = valorDe(medida)
  for (const c of casos) {
    const v = valor(c)
    if (v !== null) salida.push(v)
  }
  return salida
}

// La celda de estandarización. Edad y sexo y no región: son las dos que el reclutamiento por
// cuotas controla, y con la región las celdas quedan con menos de diez casos (hecho 5).
const celda = (c) => `${c.edadr ?? 'sd'}|${c.sexo ?? 'sd'}`

function comparar (casosA, casosB, medida, opciones) {
  const a = valoresDe(casosA, medida)
  const b = valoresDe(casosB, medida)
  if (a.length < 30 || b.length < 30) return null
  return {
    a: media(a),
    b: media(b),
    n: [a.length, b.length],
    diferencia: media(b) - media(a),
    ic: bootstrap(a, b, opciones),
    p: permutacion(a, b, opciones),
    // Con la composición de edad y sexo fija: dice si el cambio es de opinión o de quién contestó.
    estandarizada: estandarizada(casosA, casosB, valorDe(medida), celda),
  }
}

/**
 * Todos los contrastes del producto, listos para el artefacto.
 *
 * Se calculan las oleadas consecutivas y además la primera contra la última: el recorrido usa las
 * dos cosas, «qué se movió este año» y «qué se movió en la serie».
 */
export function contrastes (casos, { rondas = RONDAS, semilla = SEMILLA } = {}) {
  const opciones = { rondas, semilla }
  const olas = [...new Set(casos.map((c) => Number(c.ola)))].sort()
  const de = (ola) => casos.filter((c) => Number(c.ola) === ola)

  const pares = []
  for (let i = 1; i < olas.length; i++) pares.push([olas[i - 1], olas[i]])
  if (olas.length > 2) pares.push([olas[0], olas[olas.length - 1]])

  const medidas = MEDIDAS.map((medida) => ({
    id: medida.id,
    etiqueta: medida.etiqueta,
    unidad: medida.unidad,
    comparaciones: pares
      .map(([desde, hasta]) => {
        const r = comparar(de(desde), de(hasta), medida, opciones)
        return r === null ? null : { desde, hasta, ...r }
      })
      .filter(Boolean),
  })).filter((m) => m.comparaciones.length > 0)

  const brechas = BRECHAS.map((brecha) => ({
    id: brecha.id,
    etiqueta: brecha.etiqueta,
    unidad: brecha.unidad,
    porOla: olas.map((ola) => {
      // La resta puede venir de dos columnas numéricas o de una función, cuando la escala hay que
      // recodificarla antes de restar (ver `brechaConfianza`).
      const diferencia = typeof brecha.valor === 'function'
        ? brecha.valor
        : (c) => (numero(c[brecha.campos[0]]) === null || numero(c[brecha.campos[1]]) === null
            ? null
            : c[brecha.campos[0]] - c[brecha.campos[1]])
      const pares = de(ola).map(diferencia).filter((v) => v !== null)
      if (pares.length < 30) return null
      return {
        ola,
        n: pares.length,
        diferencia: media(pares),
        ic: bootstrapMedia(pares, opciones),
        p: permutacionPareada(pares, opciones),
      }
    }).filter(Boolean),
  }))

  const grupos = GRUPOS.map((grupo) => {
    const valores = (casos, tramo) => casos.filter(tramo[1]).map((c) => numero(c[grupo.campo])).filter((v) => v !== null)
    const porOla = olas.map((ola) => {
      const casos = de(ola)
      const tramos = grupo.tramos.map(([nombre, filtro]) => {
        const v = valores(casos, [nombre, filtro])
        return { nombre, media: v.length > 0 ? media(v) : null, n: v.length }
      })
      const [izq, der] = grupo.puntas.map((nombre) => valores(casos, grupo.tramos.find((t) => t[0] === nombre)))
      const brecha = izq.length >= 30 && der.length >= 30
        ? { entre: grupo.puntas, diferencia: media(izq) - media(der), ic: bootstrap(der, izq, opciones), p: permutacion(izq, der, opciones) }
        : null
      return { ola, tramos, brecha }
    })
    // Cada tramo consigo mismo entre oleadas: es lo que dice quién se movió.
    const entreOlas = []
    for (const [nombre, filtro] of grupo.tramos) {
      for (const [desde, hasta] of pares) {
        const a = valores(de(desde), [nombre, filtro])
        const b = valores(de(hasta), [nombre, filtro])
        if (a.length < 30 || b.length < 30) continue
        entreOlas.push({
          tramo: nombre, desde, hasta, n: [a.length, b.length],
          diferencia: media(b) - media(a), ic: bootstrap(a, b, opciones), p: permutacion(a, b, opciones),
        })
      }
    }
    return { id: grupo.id, etiqueta: grupo.etiqueta, unidad: grupo.unidad, porOla, entreOlas }
  })

  const regresiones = REGRESIONES.map((def) => {
    const porOla = olas.map((ola) => {
      const xy = de(ola)
        .map((c) => [numero(c[def.x]), numero(c[def.y])])
        .filter(([x, y]) => x !== null && y !== null)
      if (xy.length < 60) return null

      // El peso de cada punto **sobre la pendiente**, que es la parte del apalancamiento que
      // depende de la posición: `n_k (x_k − x̄)² / Σ(x − x̄)²`. Los puntos del centro de la escala
      // casi no la inclinan aunque tengan mucha gente, porque están donde la recta gira; los del
      // borde mandan aunque sean pocos. Es lo que explica por qué el resultado es frágil, y va
      // calculado acá para que la página no tenga que rehacerlo.
      const mediaX = media(xy.map((q) => q[0]))
      const sxx = xy.reduce((s, [x]) => s + (x - mediaX) ** 2, 0)

      const puntos = []
      for (let x = def.rango[0]; x <= def.rango[1]; x++) {
        const v = xy.filter((q) => q[0] === x).map((q) => q[1])
        puntos.push({
          x,
          n: v.length,
          media: v.length >= def.minimoPorPunto ? media(v) : null,
          ic: v.length >= def.minimoPorPunto ? bootstrapMedia(v, opciones) : null,
          peso: sxx > 0 ? (100 * v.length * (x - mediaX) ** 2) / sxx : 0,
        })
      }

      const recta = pendiente(xy, opciones)
      // El punto que sostiene la recta: el que más la mueve al salir. Con él y sin él se cuenta
      // el experimento, y la comparación es la que dice si la pendiente es un hallazgo o una celda.
      let sostiene = null
      for (const q of puntos) {
        if (q.n === 0) continue
        const resto = xy.filter((r) => r[0] !== q.x)
        if (resto.length < 60) continue
        const cambio = Math.abs(ajustar(resto).b - recta.b)
        if (!sostiene || cambio > sostiene.cambio) sostiene = { x: q.x, n: q.n, cambio }
      }
      if (sostiene) sostiene.recta = pendiente(xy.filter((r) => r[0] !== sostiene.x), opciones)

      return { ola, puntos, recta, sostiene }
    }).filter(Boolean)

    return { id: def.id, etiqueta: def.etiqueta, x: def.x, y: def.y, rango: def.rango, porOla }
  })

  // De dónde viene el alza: en cuántos grupos de cada corte se mueve, entre las dos últimas oleadas.
  const transversal = olas.length >= 2
    ? TRANSVERSAL.map((def) => {
      const [antes, despues] = [olas[olas.length - 2], olas[olas.length - 1]]
      const cortes = def.cortes.map(([campo, etiqueta]) => {
        const grupos = [...new Set(casos.map((c) => c[campo]).filter((v) => v != null))]
        const medidos = grupos.map((g) => {
          const de2 = (ola) => casos
            .filter((c) => Number(c.ola) === ola && c[campo] === g)
            .map((c) => numero(c[def.campo])).filter((v) => v !== null)
          const a = de2(antes)
          const b = de2(despues)
          return a.length >= 30 && b.length >= 30 ? { grupo: String(g), diferencia: media(b) - media(a) } : null
        }).filter(Boolean)
        return {
          campo,
          etiqueta,
          total: medidos.length,
          suben: medidos.filter((g) => g.diferencia > 0).length,
          grupos: medidos,
        }
      }).filter((c) => c.total > 0)
      return { id: def.id, desde: antes, hasta: despues, cortes }
    })
    : []

  return {
    metodo: {
      prueba: 'permutación a dos colas',
      rondas,
      semilla,
      intervalo: 'bootstrap percentil del 95 %',
      // Va en el artefacto y no solo en el código: quien lea el JSON tiene que encontrar el
      // límite de lo que estos números afirman, sin depender de que abra el repositorio.
      alcance: 'La muestra no es probabilística: estos contrastes comparan las oleadas entre sí y no estiman a la población. No son margen de error.',
    },
    medidas,
    brechas,
    grupos,
    regresiones,
    transversal,
  }
}
