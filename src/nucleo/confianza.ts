import type { Caso, Variable } from './tipos'
import { distribucion } from './agregar'
import { CONFIANZA, POSICION } from './paleta'
import i18n from '../i18n'

const rotulo = (clave: string): string => i18n.t(`confianza.${clave}`, { ns: 'explorador' })

/**
 * El trato de las figuras de confianza (`p24` y `p25`), en un solo lugar.
 *
 * **La pregunta no da un número, da cuatro categorías ordenadas.** Resumirla en una serie obliga a
 * elegir un corte, y el corte cambia la conclusión: con «mucha» sola, China pasa a Estados Unidos
 * en 2025; con «mucha o algo», China venía arriba desde 2023 (53,0 contra 47,9). Una afirmación
 * cuyo signo depende de un umbral que la figura no declara es el mismo defecto que dejó tres
 * cifras de opinión sobre China circulando (hecho 6 del `CLAUDE.md`).
 *
 * Por eso el recorrido no elige umbral: muestra las cuatro categorías a los dos lados de un cero
 * común, y cierra con la comparación **dentro de la persona**, que no necesita ninguno.
 */

/** La escala de `p24` y `p25`, de menos a más. Los códigos **no** están ordenados: 1 es «Mucha»,
 *  3 es «Poca» y 99 es «Ninguna», así que restar los códigos crudos daría cualquier cosa. */
export const ESCALON: Record<number, number> = { 99: 0, 3: 1, 2: 2, 1: 3 }

export interface CategoriaConfianza {
  clave: string
  etiqueta: string
  color: string
  lado: -1 | 0 | 1
}

export interface FilaConfianza {
  clave: string
  etiqueta: string
  grupo?: string
  valores: number[]
  base: number
}

export interface FiguraDivergente {
  categorias: CategoriaConfianza[]
  filas: FilaConfianza[]
  extremo: number
}

/**
 * Las cuatro categorías en orden visual, del extremo izquierdo al derecho.
 *
 * El color sale de `CONFIANZA` (`paleta.ts`), el mismo que `SEMANTICOS` le da a `p24` y `p25` por
 * código: cualquier vista que pinte la misma pregunta usa los mismos colores sin que nadie los repita.
 */
export const CATEGORIAS: CategoriaConfianza[] = ([
  ['ninguna', CONFIANZA.ninguna, -1],
  ['poca', CONFIANZA.poca, -1],
  ['algo', CONFIANZA.algo, 1],
  ['mucha', CONFIANZA.mucha, 1],
] as const).map(([clave, color, lado]) => ({
  clave,
  // **Se lee al dibujar, no al cargar el módulo:** una etiqueta fijada al importar quedaría en el
  // idioma de ese momento y no seguiría al selector.
  get etiqueta () { return rotulo(clave) },
  color,
  lado,
}))

const CODIGOS = [99, 3, 2, 1]

/**
 * El semiancho de la escala: cuánto se aleja del cero el lado más largo de todas las filas.
 *
 * **Se calcula sobre todas las filas, encendidas o no.** Si dependiera de lo visible, un segmento
 * cambiaría de largo al aparecer el resto, que es la manera más limpia de mentir con una animación
 * (regla 1 de `nucleo/pasos.ts`). Se redondea hacia arriba de a cinco puntos para que las marcas
 * del eje caigan en números redondos.
 */
export function extremoDe (filas: FilaConfianza[], categorias: CategoriaConfianza[]): number {
  let mayor = 0
  for (const fila of filas) {
    let izquierda = 0
    let derecha = 0
    fila.valores.forEach((v, i) => {
      const lado = categorias[i].lado
      if (lado === -1) izquierda += v
      else if (lado === 1) derecha += v
      else { izquierda += v / 2; derecha += v / 2 }
    })
    mayor = Math.max(mayor, izquierda, derecha)
  }
  return Math.max(5, Math.ceil(mayor / 5) * 5)
}

/**
 * La distribución de las dos preguntas, una fila por oleada y un bloque por potencia.
 *
 * Las oleadas van de la más vieja a la más nueva dentro de cada bloque: leyendo hacia abajo se ve
 * el lado de la desconfianza achicarse, que es lo que la escena afirma.
 */
export function figuraConfianza (
  paises: { grupo: string, variable: Variable }[],
  olas: number[],
  casosDe: (ola: number) => Caso[],
): FiguraDivergente {
  const filas: FilaConfianza[] = []
  for (const pais of paises) {
    for (const ola of olas) {
      const d = distribucion(casosDe(ola), pais.variable)
      const porCodigo = new Map(d.segmentos.map((s) => [s.codigo, s.porcentaje]))
      filas.push({
        clave: `${pais.variable.nombre}-${ola}`,
        etiqueta: String(ola),
        grupo: pais.grupo,
        valores: CODIGOS.map((codigo) => porCodigo.get(codigo) ?? 0),
        base: d.base,
      })
    }
  }
  return { categorias: CATEGORIAS, filas, extremo: extremoDe(filas, CATEGORIAS) }
}

/** Cuántos escalones de confianza separan a China de Estados Unidos **en una misma persona**. */
export function brechaPersonal (caso: Caso): number | null {
  const a = ESCALON[Number(caso.p24)]
  const b = ESCALON[Number(caso.p25)]
  return a === undefined || b === undefined ? null : a - b
}

/**
 * La comparación **dentro de la persona**: a cuál de las dos potencias le tiene más confianza cada
 * encuestado.
 *
 * Es la única lectura de esta pregunta que no necesita elegir un umbral, y la única que puede decir
 * que la ventaja de China crece a costa del empate. El empate va **a caballo del cero**: mitad y
 * mitad, que es la convención de las escalas con punto medio y evita inventarle un lado a quien no
 * se inclina.
 */
export function figuraBalanza (
  olas: number[],
  casosDe: (ola: number) => Caso[],
): FiguraDivergente {
  const categorias: CategoriaConfianza[] = [
    { clave: 'eeuu', etiqueta: rotulo('masEeuu'), color: POSICION.eeuu, lado: -1 },
    { clave: 'igual', etiqueta: rotulo('igual'), color: POSICION.distancia, lado: 0 },
    { clave: 'china', etiqueta: rotulo('masChina'), color: POSICION.china, lado: 1 },
  ]
  const filas = olas.map((ola) => {
    const diferencias = casosDe(ola).map(brechaPersonal).filter((d): d is number => d !== null)
    const base = diferencias.length
    const parte = (filtro: (d: number) => boolean) =>
      base > 0 ? (100 * diferencias.filter(filtro).length) / base : 0
    return {
      clave: `balanza-${ola}`,
      etiqueta: String(ola),
      valores: [parte((d) => d < 0), parte((d) => d === 0), parte((d) => d > 0)],
      base,
    }
  })
  return { categorias, filas, extremo: extremoDe(filas, categorias) }
}
