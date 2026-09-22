import type { Encuesta, NubePalabras } from '../nucleo/tipos'
import { numero } from '../locale'

/**
 * Lectura de los contrastes que el ETL dejó en el artefacto.
 *
 * **El recorrido solo afirma lo que pasa el contraste** (ver `CLAUDE.md`, «Cuándo un cambio entre
 * oleadas es un cambio»), así que las frases no describen la diferencia: describen el resultado de
 * la prueba. Si el artefacto viene sin contrastes, cada función devuelve `null` y la frase cae a
 * una versión que solo dice lo que se ve en la figura.
 */
export function lector (encuesta: Encuesta) {
  const c = encuesta.contrastes
  return {
    /** La brecha entre dos países dentro de la misma persona, en una oleada. */
    brecha: (ola: number) =>
      c?.brechas.find((b) => b.id === 'brecha-china-eeuu')?.porOla.find((x) => x.ola === ola) ?? null,
    entre: (id: string, desde: number, hasta: number) =>
      c?.medidas.find((m) => m.id === id)?.comparaciones.find((x) => x.desde === desde && x.hasta === hasta) ?? null,
    /** Si ningún país del termómetro se distingue del ruido entre dos oleadas. */
    todosQuietos: (desde: number, hasta: number) => {
      const suyas = c?.medidas.filter((m) => m.id.startsWith('termometro-')) ?? []
      const comparaciones = suyas
        .map((m) => m.comparaciones.find((x) => x.desde === desde && x.hasta === hasta))
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
      return comparaciones.length === suyas.length && comparaciones.length > 0 &&
        comparaciones.every((x) => x.p >= 0.05)
    },
    paises: (c?.medidas.filter((m) => m.id.startsWith('termometro-')).length) ?? 0,
    /** La opinión sobre China por tramo ideológico, oleada por oleada. */
    ideologia: c?.grupos.find((g) => g.id === 'ideologia-china') ?? null,
    /** La misma pregunta sobre la escala entera de 1 a 10, con la recta y el punto que la sostiene. */
    regresion: c?.regresiones.find((r) => r.id === 'ideologia-china') ?? null,
    /** En cuántos grupos de cada corte sube la opinión sobre China, entre las dos últimas oleadas. */
    transversal: c?.transversal.find((t) => t.id === 'opinion-china') ?? null,
    /**
     * La ventaja de una potencia sobre la otra en `p26`, **dentro de la persona**.
     *
     * Es lo que sostiene el titular de la escena 5. Va por acá y no restando dos porcentajes
     * sueltos porque `p26` es una elección única: quien contesta «China» está a la vez no
     * contestando «Estados Unidos», y la prueba de signo usa esa dependencia.
     */
    ventajaP26: (ola: number) =>
      c?.brechas.find((b) => b.id === 'ventaja-china-p26')?.porOla.find((x) => x.ola === ola) ?? null,
  }
}

/**
 * Los números chicos se escriben con letra dentro de una frase.
 *
 * Sale de los datos (son las medidas del termómetro que trae el artefacto), así que no se puede
 * escribir a mano, pero «ninguno de los 5 países» en medio de una oración se lee como una planilla.
 */
export function cardinal (n: number): string {
  return ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'][n] ?? numero(n)
}

/**
 * Cómo se describe una brecha según lo que dice su prueba.
 *
 * Tres estados y no dos: además de «China arriba» y «Estados Unidos arriba» está **«parejos»**,
 * que es lo que corresponde cuando el intervalo contiene el cero. La escena decía que en 2023 y
 * 2024 Estados Unidos estaba mejor evaluado; en 2023 la brecha es de 2,1 puntos con un intervalo
 * que cruza el cero, así que esa mitad de la frase afirmaba de más.
 */
export function describir (brecha: { diferencia: number, p: number } | null) {
  if (!brecha) return null
  if (brecha.p >= 0.05) return { estado: 'parejos' as const, puntos: Math.abs(brecha.diferencia) }
  return { estado: brecha.diferencia > 0 ? 'china' as const : 'eeuu' as const, puntos: Math.abs(brecha.diferencia) }
}


/**
 * Las cuatro series del bloque `cotidiana` que cuenta la historia, leídas del artefacto.
 *
 * Cada medida viaja como comparaciones entre oleadas; la escena necesita el nivel de cada oleada,
 * así que se reconstruye desde ellas y **no se vuelve a calcular sobre los casos**: el número de
 * la frase y el de la barra salen del mismo lugar, que es la única forma de que no diverjan.
 */
export function serieDeMedida (encuesta: Encuesta, id: string) {
  const medida = encuesta.contrastes?.medidas.find((m) => m.id === id)
  if (!medida || medida.comparaciones.length === 0) return null
  const valores = new Map<number, number>()
  const enes = new Map<number, number>()
  for (const c of medida.comparaciones) {
    valores.set(c.desde, c.a); valores.set(c.hasta, c.b)
    enes.set(c.desde, c.n[0]); enes.set(c.hasta, c.n[1])
  }
  const olas = [...valores.keys()].sort((a, b) => a - b)
  const primera = olas[0]
  const ultima = olas[olas.length - 1]
  return {
    etiqueta: medida.etiqueta,
    advertencia: medida.advertencia ?? '',
    puntos: olas.map((ola) => ({ ola, valor: valores.get(ola)!, n: enes.get(ola)! })),
    /** La comparación entre las dos puntas, que es la que el titular afirma. */
    punta: medida.comparaciones.find((c) => c.desde === primera && c.hasta === ultima) ?? null,
    /** Las comparaciones de un año al siguiente. */
    consecutivas: medida.comparaciones.filter((c) => olas.indexOf(c.hasta) === olas.indexOf(c.desde) + 1),
  }
}

/** Cuántas personas hay detrás de un porcentaje, para el pie: baja la proporción, no la gente. */
export function casosDe (pct: number, n: number) {
  return numero(Math.round((pct * n) / 100))
}


/**
 * Las palabras de una respuesta abierta como filas de `Puntos`: una fila por palabra y un valor por
 * oleada, en **porcentaje de las personas que contestaron** esa oleada (el ETL cuenta personas, no
 * menciones). Ordenadas por la última oleada, que es la que la frase nombra.
 *
 * `fuera` saca palabras que repiten la pregunta («chino» en «dónde tiene contacto con personas
 * chinas») y no dicen nada. Una palabra ausente de una oleada va como `null`: no está entre las
 * que el ETL publica, no es un cero medido.
 */
export function filasDePalabras (nube: NubePalabras, { tope = 5, fuera = [] as string[] } = {}) {
  const ultima = String(nube.olas[nube.olas.length - 1])
  const pct = (ola: string, palabra: string) => {
    const n = nube.porOla[ola]?.find((p) => p.palabra === palabra)?.n
    const base = nube.baseOla?.[ola] ?? 0
    return n === undefined || base === 0 ? null : (100 * n) / base
  }
  const palabras = (nube.porOla[ultima] ?? []).map((p) => p.palabra).filter((p) => !fuera.includes(p)).slice(0, tope)
  return palabras.map((palabra) => ({ clave: palabra, etiqueta: palabra, valores: nube.olas.map((o) => pct(String(o), palabra)) }))
}
