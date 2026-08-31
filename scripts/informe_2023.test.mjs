import { describe, it, expect } from 'vitest'
import { procesarOleada } from './etl.mjs'

/**
 * Contrasta nuestro ETL contra las cifras que ICLAC ya publicó de la oleada 2023.
 *
 * Fuente: «Monitor de Opinión Pública 2023: ¿Qué piensan los chilenos sobre China?»,
 * Jenne, Labarca, Montt y Urdinez, Policy Paper ICLAC 03, julio de 2024.
 * DOI 10.5281/zenodo.12700686
 *
 * Por qué existe: el ETL traduce un pipeline en R que no podemos ejecutar, resolviendo
 * etiquetas desde un .dta y normalizando nombres de columna a mano. Nada de eso se
 * verifica solo. El informe del cliente es la única fuente independiente que dice qué
 * tienen que dar estos datos, y hace de prueba de aceptación: si mañana alguien cambia
 * la normalización de nombres, el manejo de perdidos o la base del porcentaje, esto se
 * cae y dice dónde.
 *
 * De paso deja medido algo que veníamos suponiendo: **el informe calcula sus porcentajes
 * sobre respuestas efectivas, no sobre los 664 casos.** Se ve en `p11`, donde 157 personas
 * no contestaron y las cifras solo cuadran sobre las 507 restantes. Es la misma base que
 * usa el visualizador.
 *
 * La tolerancia es de 1 punto porque el informe redondea a entero en la mayoría de sus
 * cifras. Donde publica un decimal, calza al decimal.
 */

const oleada = procesarOleada('2023')

function porcentaje (nombre, ...etiquetas) {
  const variable = oleada.variables.find((v) => v.nombre === nombre)
  if (!variable?.categorias) throw new Error(`${nombre} no es categórica`)

  const desconocidas = etiquetas.filter((e) => !variable.categorias.some((c) => c.etiqueta === e))
  if (desconocidas.length) throw new Error(`etiquetas inexistentes en ${nombre}: ${desconocidas.join(', ')}`)

  const codigos = new Set(
    variable.categorias.filter((c) => etiquetas.includes(c.etiqueta)).map((c) => c.codigo)
  )
  const base = variable.categorias.filter((c) => !c.sentinela).map((c) => c.codigo)
  const enBase = new Set(base)

  let numerador = 0
  let denominador = 0
  for (const caso of oleada.casos) {
    const v = caso[nombre]
    if (v === null || !enBase.has(Number(v))) continue
    denominador++
    if (codigos.has(Number(v))) numerador++
  }
  return (100 * numerador) / denominador
}

describe('el ETL de 2023 reproduce el informe publicado por ICLAC', () => {
  it('trae los 664 casos de la entrega (el informe redondea a «660 participantes»)', () => {
    expect(oleada.n).toBe(664)
  })

  // Las cuatro que el informe publica con decimal calzan al decimal.
  it.each([
    ['p12 vive a menos de diez cuadras de un mall chino', 54.8, ['p12', 'Si']],
    ['p7 en desacuerdo', 32.5, ['p7', 'En desacuerdo']],
    ['p7 muy en desacuerdo', 6.9, ['p7', 'Muy en desacuerdo']],
    ['p8 China es un inversor importante', 18.5, ['p8', 'Un inversor importante']]
  ])('%s = %s %%', (_titulo, esperado, [variable, ...etiquetas]) => {
    expect(porcentaje(variable, ...etiquetas)).toBeCloseTo(esperado, 1)
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
    ['p26 Chile debería tomar posición por alguno', 23, ['p26', 'A favor de China', 'A favor de EE. UU.']]
  ])('%s ≈ %s %%', (_titulo, esperado, [variable, ...etiquetas]) => {
    // Un punto de tolerancia, no medio. El informe redacta estas cifras en prosa y con
    // aproximadores («aproximadamente un 77%», «alrededor del 65%»), y dos de ellas no son
    // el redondeo de la nuestra: p9 da 76,4 contra su 77 y p21 da 11,9 contra su 11. La
    // explicación más probable es que ahí dividieran por los «660 participantes» que
    // declara el resumen en vez de por los 664 casos que trae el archivo: 507/660 da 76,8,
    // que sí redondea a 77. No es algo que podamos resolver desde este lado.
    const calculado = porcentaje(variable, ...etiquetas)
    expect(Math.abs(calculado - esperado), `${variable}: informe ${esperado}%, nuestro ${calculado.toFixed(1)}%`)
      .toBeLessThanOrEqual(1)
  })

  it('p11 solo cuadra con el informe sobre respuestas efectivas, no sobre los 664 casos', () => {
    const variable = oleada.variables.find((v) => v.nombre === 'p11')
    expect(variable.faltantes).toBe(157)
    const sobreElTotal = (100 * oleada.casos.filter((c) => [4, 5].includes(Number(c.p11))).length) / oleada.n
    expect(sobreElTotal).toBeLessThan(45) // el informe dice «más de la mitad»
    expect(porcentaje('p11', 'Buena', 'Muy buena')).toBeGreaterThan(50)
  })

  /**
   * El informe publica «un promedio de 61.4 puntos» de opinión sobre China, y 71.8 para
   * Japón, en la escala de 0 a 100 de la pregunta P5. Esa cifra **no se puede reproducir
   * con los datos publicados**: `p5_1` a `p5_5` solo guardan si la persona respondió.
   *
   * Esta prueba fija el hueco. Cuando llegue el archivo que falta (C9), la columna va a
   * aparecer y esta prueba va a fallar: ahí se reemplaza por el contraste contra 61,4,
   * que es la verdadera prueba de aceptación de la serie del termómetro.
   */
  it('el termómetro 0-100 sigue ausente de la entrega publicada', () => {
    const columnasValue = oleada.variables.filter((v) => /value$/.test(v.nombre))
    expect(columnasValue).toHaveLength(0)

    const p5 = oleada.variables.find((v) => v.nombre === 'p5_1')
    expect(p5.categorias.map((c) => c.etiqueta)).toEqual(['Opinión del 0 al 100', 'Prefiero no responder'])
    expect(oleada.revisiones.filter((r) => r.startsWith('p5_'))).toHaveLength(5)
  })
})
