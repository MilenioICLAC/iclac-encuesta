import type { Encuesta, Variable } from './tipos'
import type { Traducible } from '../locale'

/*
 * Lo que queda de los módulos del tablero, que salió de la app el 22-09-2026: los países del
 * termómetro, los cortes de la barra de estado del explorador y la búsqueda de una variable.
 */

/**
 * Los países del termómetro, en el orden en que la guía los compara. `id` es lo que compara el
 * código (`pais.id === 'china'`); `pais` es el rótulo, en los tres idiomas.
 */
export const TERMOMETRO: { nombre: string, id: 'china' | 'eeuu' | 'corea' | 'francia' | 'japon', pais: Traducible }[] = [
  { nombre: 'p5_1_val', id: 'china', pais: { es: 'China', en: 'China', cn: '中国' } },
  { nombre: 'p5_2_val', id: 'eeuu', pais: { es: 'Estados Unidos', en: 'United States', cn: '美国' } },
  { nombre: 'p5_3_val', id: 'corea', pais: { es: 'Corea del Sur', en: 'South Korea', cn: '韩国' } },
  { nombre: 'p5_4_val', id: 'francia', pais: { es: 'Francia', en: 'France', cn: '法国' } },
  { nombre: 'p5_5_val', id: 'japon', pais: { es: 'Japón', en: 'Japan', cn: '日本' } },
]

/**
 * Los estratos de exposición económica a China del diseño muestral, del de mayor exposición al de
 * menor: Q1 es «Muy alto». La clave es el valor que el ETL guarda en `region_impacto`; `nombre` es
 * el rótulo del corte y `nivel` cómo se dice con «exposición», que es femenino («Muy alta»).
 *
 * **Un solo mapa**: antes estaba dos veces, en `ficha.ts` y en `territorio.tsx`, con mayúsculas
 * distintas.
 */
export const ESTRATOS: [clave: 'Muy alto' | 'Alto' | 'Medio' | 'Bajo', rotulo: { nombre: Traducible, nivel: Traducible }][] = [
  ['Muy alto', { nombre: { es: 'Muy alto', en: 'Very high', cn: '很高' }, nivel: { es: 'Muy alta', en: 'Very high', cn: '很高' } }],
  ['Alto', { nombre: { es: 'Alto', en: 'High', cn: '高' }, nivel: { es: 'Alta', en: 'High', cn: '高' } }],
  ['Medio', { nombre: { es: 'Medio', en: 'Medium', cn: '中' }, nivel: { es: 'Media', en: 'Medium', cn: '中' } }],
  ['Bajo', { nombre: { es: 'Bajo', en: 'Low', cn: '低' }, nivel: { es: 'Baja', en: 'Low', cn: '低' } }],
]
export type Estrato = typeof ESTRATOS[number][0]

/** El rótulo de un estrato por su clave. */
export function estrato (clave: string): { nombre: Traducible, nivel: Traducible } | undefined {
  return ESTRATOS.find(([k]) => k === clave)?.[1]
}

/**
 * Los cortes que ofrece la barra de estado. **Uno a la vez, nunca dos**: la muestra no
 * aguanta cruzar dos variables, con 110 celdas de mediana 6,5 casos en región × educación.
 *
 * Quedan fuera a propósito dos que el monitor actual sí ofrece: `p4`, porque sus códigos
 * cambian de significado entre oleadas, y `p26`, porque cruzar dos preguntas de opinión no
 * es un corte de caracterización.
 */
/**
 * Con qué color se pinta cada grupo en el explorador (`paletaDeCorte`, en `explorador.ts`). `rampa`
 * va de claro a oscuro en el orden de `orden`, de menos a más, y lleva además punto creciente; las
 * demás, no. Macrozona también es una rampa (de norte a sur), pero propia y sin tamaño.
 */
export type PaletaCorte = 'rampa' | 'genero' | 'ideologia' | 'macrozona'

/**
 * `grupos` va en orden, de menos a más en los ordenados. **La clave es el valor que guarda el caso**
 * (`'18 a 34'`, `'Izquierda'`), en español y sin traducir: con ella se agrupa, se ordena y se elige
 * el color. El rótulo, en los tres idiomas, es solo para dibujar.
 */
export interface Corte {
  nombre: string | null
  etiqueta: Traducible
  grupos?: [clave: string, etiqueta: Traducible][]
  nominal?: boolean
  paleta?: PaletaCorte
}

export const CORTES: Corte[] = [
  { nombre: null, etiqueta: { es: 'Sin corte', en: 'No breakdown', cn: '不分组' } },
  // El único sin orden: va con colores de identidad, no con la rampa (`paleta.ts`).
  // El orden es solo para que el color siga al grupo (`paletaDeCorte`): género no tiene orden.
  {
    nombre: 'sexo',
    etiqueta: { es: 'Género', en: 'Gender', cn: '性别' },
    // `sexo` es la única codificada: su clave es el código que guarda el caso, no un texto.
    grupos: [['1', { es: 'Masculino', en: 'Male', cn: '男性' }], ['2', { es: 'Femenino', en: 'Female', cn: '女性' }]],
    nominal: true,
    paleta: 'genero',
  },
  // Los tres van agrupados, no con sus categorías originales. Educación venía con diez
  // niveles y su grupo más chico tenía siete casos; nivel socioeconómico con siete. Un
  // porcentaje sobre siete personas no dice nada, y la rampa de color no distingue más de
  // seis pasos. Es la misma regla que obliga a ofrecer macrozonas en vez de dieciséis
  // regiones: agrupar antes de ofrecer.
  {
    nombre: 'edad_rec',
    etiqueta: { es: 'Edad', en: 'Age', cn: '年龄' },
    grupos: [['18 a 34', { es: '18 a 34', en: '18–34', cn: '18–34岁' }], ['35 a 44', { es: '35 a 44', en: '35–44', cn: '35–44岁' }], ['45 a 54', { es: '45 a 54', en: '45–54', cn: '45–54岁' }], ['55 a 64', { es: '55 a 64', en: '55–64', cn: '55–64岁' }], ['65 o más', { es: '65 o más', en: '65 or older', cn: '65岁及以上' }]],
    paleta: 'rampa',
  },
  {
    nombre: 'educacion_rec',
    etiqueta: { es: 'Educación', en: 'Education', cn: '教育水平' },
    grupos: [
      ['Media incompleta o menos', { es: 'Media incompleta o menos', en: 'Did not complete secondary education', cn: '中等教育未完成' }],
      ['Media completa', { es: 'Media completa', en: 'Completed secondary education', cn: '中等教育毕业' }],
      ['Técnica o universitaria incompleta', { es: 'Técnica o universitaria incompleta', en: 'Technical education or some university', cn: '技术教育或大学肄业' }],
      ['Universitaria completa o más', { es: 'Universitaria completa o más', en: 'University degree or higher', cn: '大学毕业及以上' }],
    ],
    paleta: 'rampa',
  },
  // De menos a más, como los otros cortes ordenados: AB · C1, el de más poder adquisitivo, al final.
  // Los nombres de los grupos socioeconómicos son siglas chilenas y no se traducen.
  {
    nombre: 'nse_rec',
    etiqueta: { es: 'Nivel socioeconómico', en: 'Socioeconomic status', cn: '社会经济水平' },
    grupos: [['E', { es: 'E', en: 'E', cn: 'E' }], ['D', { es: 'D', en: 'D', cn: 'D' }], ['C3', { es: 'C3', en: 'C3', cn: 'C3' }], ['C2', { es: 'C2', en: 'C2', cn: 'C2' }], ['AB · C1', { es: 'AB · C1', en: 'AB · C1', cn: 'AB · C1' }]],
    paleta: 'rampa',
  },
  // En tres tramos, no la escala cruda de 1 a 10: diez grupos en una figura son ilegibles.
  {
    nombre: 'p3_3',
    etiqueta: { es: 'Ideología', en: 'Ideology', cn: '政治倾向' },
    grupos: [['Izquierda', { es: 'Izquierda', en: 'Left', cn: '左派' }], ['Centro', { es: 'Centro', en: 'Center', cn: '中间派' }], ['Derecha', { es: 'Derecha', en: 'Right', cn: '右派' }]],
    paleta: 'ideologia',
  },
  // Los dos territoriales son derivados del ETL y sus valores son texto, así que llevan su
  // orden explícito: alfabéticamente, «Alto, Bajo, Medio, Muy alto» sugiere una escala falsa.
  {
    nombre: 'region_macrozona',
    etiqueta: { es: 'Macrozona', en: 'Macro-region', cn: '地理分区' },
    grupos: [['Norte', { es: 'Norte', en: 'North', cn: '北部' }], ['Centro', { es: 'Centro', en: 'Central', cn: '中部' }], ['Centro sur', { es: 'Centro sur', en: 'South-central', cn: '中南部' }], ['Sur', { es: 'Sur', en: 'South', cn: '南部' }]],
    paleta: 'macrozona',
  },
  // De menos a más: los estratos al revés, con el rótulo de `ESTRATOS`.
  {
    nombre: 'region_impacto',
    etiqueta: { es: 'Impacto económico de China', en: 'Economic exposure to China', cn: '对华经济关联度' },
    grupos: [...ESTRATOS].reverse().map(([clave, r]) => [clave, r.nombre]),
    paleta: 'rampa',
  },
]

/** El corte de la barra de estado por su variable (`null` es «Sin corte»). */
export function corteDe (nombre: string | null): Corte | undefined {
  return CORTES.find((c) => c.nombre === nombre)
}

export function variableDe (encuesta: Encuesta, nombre: string): Variable | undefined {
  return encuesta.variables.find((v) => v.nombre === nombre)
}
