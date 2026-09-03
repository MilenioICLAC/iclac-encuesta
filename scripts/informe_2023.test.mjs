import { describe, it, expect } from 'vitest'
import { procesarOleada } from './etl.mjs'
import { casosDe, media, porcentaje } from './lib/combinada.mjs'

/**
 * Contrasta la base canónica contra las cifras que ICLAC publicó de la oleada 2023.
 *
 * Fuente: «Monitor de Opinión Pública 2023: ¿Qué piensan los chilenos sobre China?»,
 * Jenne, Labarca, Montt y Urdinez, Policy Paper ICLAC 03, julio de 2024.
 * DOI 10.5281/zenodo.12700686
 *
 * Es la prueba de aceptación de 2023, y su par para las tres oleadas es
 * `guia_urdinez.test.mjs`. Entre las dos fijan lo que el producto tiene que dar.
 *
 * **Corre sobre la base combinada, que es la que usa el producto.** Antes corría sobre la
 * microdata publicada de 55 columnas, y ahí el termómetro de 0 a 100 no existe: la prueba
 * afirmaba su ausencia. Ahora lo contrasta contra las cifras del informe, que era el trabajo
 * pendiente desde el 31-08. La diferencia entre las dos fuentes no se perdió: está fijada
 * abajo, en el bloque de `C9b`.
 */

const OLA = 2023

const pct = (variable, ...etiquetas) => porcentaje(OLA, variable, etiquetas).porcentaje

describe('la base canónica reproduce el informe publicado de 2023', () => {
  it('trae los 664 casos de la entrega (el informe redondea a «660 participantes»)', () => {
    expect(casosDe(OLA)).toHaveLength(664)
  })

  // Las cuatro que el informe publica con decimal calzan al decimal.
  it.each([
    ['p12 vive a menos de diez cuadras de un mall chino', 54.8, ['p12', 'Si']],
    ['p7 en desacuerdo', 32.5, ['p7', 'En desacuerdo']],
    ['p7 muy en desacuerdo', 6.9, ['p7', 'Muy en desacuerdo']],
    ['p8 China es un inversor importante', 18.5, ['p8', 'Un inversor importante']],
  ])('%s = %s %%', (_titulo, esperado, [variable, ...etiquetas]) => {
    expect(pct(variable, ...etiquetas)).toBeCloseTo(esperado, 1)
  })

  // Las que el informe publica redondeadas a entero.
  it.each([
    ['p13 vive cerca de un restaurante chino', 46, ['p13', 'Si']],
    ['p9 recibió al menos una vacuna Sinovac', 77, ['p9', 'Si (solo una)', 'Si (dos)']],
    ['p11 opinión buena o muy buena de Sinovac', 55, ['p11', 'Buena', 'Muy buena']],
    ['p19 el Estado debería poder limitar inversiones', 74, ['p19', 'Debería poder limitarse inversiones en ciertos sectores estratégicos']],
    ['p21 más inversión china sería beneficiosa', 65, ['p21', 'Beneficioso', 'Muy beneficioso']],
    ['p21 más inversión china sería perjudicial', 11, ['p21', 'Perjudicial', 'Muy perjudicial']],
    ['p8 China es un comprador importante', 15, ['p8', 'Un comprador importante']],
    ['p6 le importa poco que el socio sea democrático', 13, ['p6', 'Me importa poco']],
    ['p6 le es indiferente', 22, ['p6', 'Me es indifierente / no me importa']],
    ['p26 Chile debería posicionarse a favor de EE. UU.', 15, ['p26', 'A favor de EE. UU.']],
    ['p26 Chile debería posicionarse a favor de China', 8, ['p26', 'A favor de China']],
    ['p26 Chile debería tomar posición por alguno', 23, ['p26', 'A favor de China', 'A favor de EE. UU.']],
  ])('%s ≈ %s %%', (_titulo, esperado, [variable, ...etiquetas]) => {
    // Un punto de tolerancia, no medio. El informe redacta estas cifras en prosa y con
    // aproximadores («aproximadamente un 77 %», «alrededor del 65 %»), y dos de ellas no son
    // el redondeo de la nuestra: p9 da 76,4 contra su 77 y p21 da 11,9 contra su 11. La
    // explicación más probable es que ahí dividieran por los «660 participantes» que declara
    // el resumen en vez de por los 664 casos del archivo: 507/660 da 76,8, que sí redondea a
    // 77. No es algo que podamos resolver desde este lado.
    const calculado = pct(variable, ...etiquetas)
    expect(Math.abs(calculado - esperado), `${variable}: informe ${esperado} %, nuestro ${calculado.toFixed(1)} %`)
      .toBeLessThanOrEqual(1)
  })

  /**
   * El termómetro de 0 a 100, que es lo que abre el monitor y la variable dependiente de su
   * gráfico de «predicción».
   *
   * Esta prueba **reemplaza a la que afirmaba su ausencia**. Era cierta sobre la microdata
   * publicada, donde `p5_1` solo guarda si la persona respondió, y dejó de serlo al pasar a
   * la base canónica. Es la prueba de aceptación de la serie del termómetro.
   */
  it('reproduce los 61,4 puntos de China y los 71,8 de Japón, al decimal', () => {
    const china = media(OLA, 'p5_1_val')
    expect(china.media).toBeCloseTo(61.4, 1)
    expect(china.base).toBe(543)

    const japon = media(OLA, 'p5_5_val')
    expect(japon.media).toBeCloseTo(71.8, 1)
    expect(japon.base).toBe(540)
  })

  it('los porcentajes van sobre respuestas efectivas, no sobre los 664 casos', () => {
    // Se ve en p11: 157 personas no contestaron, y las cifras del informe solo cuadran
    // sobre las 507 restantes. Es lo que fija el criterio de denominador del producto.
    const { base } = porcentaje(OLA, 'p11', ['Buena', 'Muy buena'])
    expect(base).toBe(507)
    expect(casosDe(OLA).length - base).toBe(157)

    const sobreElTotal = (100 * porcentaje(OLA, 'p11', ['Buena', 'Muy buena']).n) / 664
    expect(sobreElTotal).toBeLessThan(45) // el informe dice «más de la mitad»
    expect(pct('p11', 'Buena', 'Muy buena')).toBeGreaterThan(50)
  })
})

/**
 * `C9b`: lo que ICLAC publica en su sitio no permite reproducir su propia serie.
 *
 * La microdata publicada de 2023 guarda de `P5_1` a `P5_5` **solo si la persona respondió**,
 * no el número que escribió. Nosotros tenemos el archivo bueno porque llegó por correo; quien
 * baje los datos del sitio, no.
 *
 * Sigue fijado como prueba, y no como nota en un documento, porque es un hecho sobre los
 * archivos del cliente que conviene que falle si algún día lo corrigen: ahí se le puede
 * cerrar la corrección en vez de arrastrarla.
 */
describe('C9b · la microdata publicada no trae el termómetro', () => {
  const publicada = procesarOleada('2023')

  it('no tiene ninguna columna con el valor de 0 a 100', () => {
    expect(publicada.variables.filter((v) => /value$/.test(v.nombre))).toHaveLength(0)
  })

  it('p5_1 solo registra si la persona respondió', () => {
    const p5 = publicada.variables.find((v) => v.nombre === 'p5_1')
    expect(p5.categorias.map((c) => c.etiqueta)).toEqual(['Opinión del 0 al 100', 'Prefiero no responder'])
  })

  it('y la base canónica sí lo trae, para las mismas 664 personas', () => {
    expect(publicada.n).toBe(casosDe(OLA).length)
    expect(media(OLA, 'p5_1_val').base).toBe(543)
  })
})
