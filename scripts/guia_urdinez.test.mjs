import { describe, it, expect } from 'vitest'
import { casosDe, media as mediaDe, porcentaje as pctDe } from './lib/combinada.mjs'

/**
 * Contrasta la base canónica contra las cifras que ICLAC publica de sus tres oleadas.
 *
 * Fuente: «Guía de contexto para el visualizador ICLAC», Francisco Urdinez, 02-09-2026,
 * recibida por correo y archivada con su procedencia en el repositorio de documentación
 * interna (`encuesta/material_cliente/`).
 *
 * Por qué existe: hasta el 02-09 **solo la oleada 2023 tenía cifras publicadas** contra las
 * cuales contrastar, las dieciocho del Policy Paper 03 que verifica `informe_2023.test.mjs`.
 * Para 2024 y 2025 no había ninguna, y 2025 es justo la oleada que tuvo tres cifras distintas
 * circulando para el mismo dato. Esta guía publica más de veinte cifras de las tres oleadas y
 * cierra ese hueco.
 *
 * Qué prueba y qué no. Mide sobre el .xlsx canónico con el mismo módulo que
 * `informe_2023.test.mjs`, así que las dos pruebas no pueden discrepar entre sí por diferencias
 * de conteo. Lo que verifica es que la base entregada produce las cifras que su propio autor
 * publica: es la prueba de aceptación de 2024 y 2025, que hasta el 02-09 no tenían ninguna.
 *
 * De paso deja cerrado `C8`: estas cifras solo cuadran sobre la entrega original de 1.228 casos.
 * Si ICLAC hubiera calculado sobre la base derivada de 662, ninguna daría.
 *
 * **Una cifra de la guía no se sostiene y está documentada abajo**: el no alineamiento de `p26`.
 * Las pruebas afirman lo que dicen los datos, no lo que dice la guía.
 */

/**
 * Las respuestas se nombran **por código y no por etiqueta**, al revés que en
 * `informe_2023.test.mjs`, y no es una inconsistencia: la hoja `valores` de la base combinada
 * trae 537 etiquetas para 2023 y 656 para 2025, pero **solo 5 para 2024** (`C12`). Como esta
 * prueba recorre las tres oleadas, el código es lo único que existe en todas. Cada bloque deja
 * escrito qué significa cada número.
 */
const media = (ola, columna) => mediaDe(ola, columna).media
const nEfectivo = (ola, columna) => mediaDe(ola, columna).base
const porcentaje = (ola, variable, etiquetas, opciones) => pctDe(ola, variable, etiquetas, opciones).porcentaje

const casi = (valor, esperado, tolerancia = 0.05) => expect(Math.abs(valor - esperado)).toBeLessThan(tolerancia)

describe('la base canónica reproduce las cifras que ICLAC publica de sus tres oleadas', () => {
  it('trae las tres oleadas con el tamaño que declara la guía', () => {
    expect(casosDe(2023)).toHaveLength(664)
    expect(casosDe(2024)).toHaveLength(668)
    // 1.228 de terreno menos un panelista que respondió dos veces.
    expect(casosDe(2025)).toHaveLength(1227)
  })

  // El termómetro de 0 a 100 es la cifra que ICLAC cita y la que abre el monitor.
  describe('p5 · evaluación de países de 0 a 100', () => {
    it.each([
      ['China 2023', 2023, 'p5_1_val', 61.4],
      ['China 2024', 2024, 'p5_1_val', 60.9],
      ['China 2025', 2025, 'p5_1_val', 65.8],
      ['EE.UU. 2023', 2023, 'p5_2_val', 63.4],
      ['EE.UU. 2024', 2024, 'p5_2_val', 64.2],
      ['EE.UU. 2025', 2025, 'p5_2_val', 58.7],
      ['Japón 2025', 2025, 'p5_5_val', 74.1],
    ])('%s da %d', (_, ola, columna, esperado) => {
      casi(media(ola, columna), esperado)
    })

    it('los 65,8 de China en 2025 salen de 1.046 respuestas, no de los 1.227 casos', () => {
      expect(nEfectivo(2025, 'p5_1_val')).toBe(1046)
      // 181 personas eligieron «prefiero no responder», que en p5_1 viene como 999.
      expect(casosDe(2025).filter((d) => d.p5_1 === 999)).toHaveLength(1227 - 1046)
    })

    it('Japón sigue siendo el mejor evaluado de los cinco en 2025', () => {
      const paises = ['p5_1_val', 'p5_2_val', 'p5_3_val', 'p5_4_val', 'p5_5_val']
      const medias = paises.map((c) => media(2025, c))
      expect(Math.max(...medias)).toBe(media(2025, 'p5_5_val'))
    })
  })

  describe('p24 · confianza en China para lidiar con los problemas de América Latina', () => {
    // 1 Mucha · 2 Algo · 3 Poca · 99 Ninguna
    it('mucha confianza pasa de 10,8 a 22,7 por ciento', () => {
      casi(porcentaje(2023, 'p24', [1]), 10.8)
      casi(porcentaje(2025, 'p24', [1]), 22.7)
    })

    it('poca o ninguna cae de 47 a 28 por ciento', () => {
      casi(porcentaje(2023, 'p24', [3, 99]), 47.0, 0.1)
      casi(porcentaje(2025, 'p24', [3, 99]), 28.0, 0.2)
    })

    it('la confianza en EE.UU. no se mueve igual: la brecha se abre por un lado solo', () => {
      const china = porcentaje(2025, 'p24', [1]) - porcentaje(2023, 'p24', [1])
      const eeuu = porcentaje(2025, 'p25', [1]) - porcentaje(2023, 'p25', [1])
      expect(china).toBeGreaterThan(10)
      expect(eeuu).toBeLessThan(5)
    })
  })

  describe('p26 · posicionamiento de Chile entre EE.UU. y China', () => {
    // 1 A favor de China · 2 A favor de EE.UU. · 3 Distancia de ambos · 4 Relacionarse con ambos
    it('la minoría que sí quiere elegir se da vuelta', () => {
      casi(porcentaje(2023, 'p26', [1]), 8.3)
      casi(porcentaje(2025, 'p26', [1]), 16.3)
      casi(porcentaje(2023, 'p26', [2]), 14.9)
      casi(porcentaje(2025, 'p26', [2]), 11.9)
    })

    /**
     * La guía dice que el no alineamiento «no se movió» y que «ronda el 72 por ciento en las
     * tres olas». No se sostiene: cae cinco puntos, de forma monótona, y el 72 describe solo a
     * 2025. La prueba afirma los datos y deja escrita la diferencia, porque ese es uno de los
     * tres hallazgos con los que la guía propone ordenar la narrativa del recorrido.
     *
     * El hallazgo no se cae, cambia de forma: la mayoría no alineada sigue siendo mayoría pero
     * se erosiona, y todo lo que pierde se va a China.
     */
    it('el no alineamiento cae de 76,8 a 71,8, no se mantiene en 72', () => {
      casi(porcentaje(2023, 'p26', [3, 4]), 76.8, 0.1)
      casi(porcentaje(2024, 'p26', [3, 4]), 75.1, 0.1)
      casi(porcentaje(2025, 'p26', [3, 4]), 71.8, 0.1)
    })
  })

  describe('p8 · qué rol cumple China en la comuna', () => {
    // 1 Inversor · 2 Comprador · 3 Proveedor · 4 Competidor
    it('proveedor cae de 54,5 a 49,0 e inversor sube de 18,5 a 20,4', () => {
      casi(porcentaje(2023, 'p8', [3]), 54.5)
      casi(porcentaje(2025, 'p8', [3]), 49.0)
      casi(porcentaje(2023, 'p8', [1]), 18.5)
      casi(porcentaje(2025, 'p8', [1]), 20.4)
    })
  })

  describe('p19 · una institución que pueda bloquear inversiones estratégicas', () => {
    // Es la cifra más estable de la encuesta y la más útil para el debate legislativo en curso.
    it.each([[2023, 73.9], [2024, 73.1], [2025, 75.6]])('en %d apoya el %d por ciento', (ola, esperado) => {
      casi(porcentaje(ola, 'p19', [1]), esperado)
    })
  })

  describe('la China cotidiana', () => {
    it('la cercanía comercial crece y la personal no se mueve', () => {
      // Vive a menos de diez cuadras de un mall chino.
      casi(porcentaje(2023, 'p12', [1]), 54.8)
      casi(porcentaje(2025, 'p12', [1]), 60.8)
      // Conoce personalmente a alguien de China o de ascendencia china.
      casi(porcentaje(2023, 'p14', [1]), 36.1)
      casi(porcentaje(2025, 'p14', [1]), 35.0)
    })

    it('haber visto algo racista baja de 16,6 a 11,4', () => {
      casi(porcentaje(2023, 'p18', [1]), 16.6)
      casi(porcentaje(2025, 'p18', [1]), 11.4)
    })

    it('el 60 por ciento calificó sus interacciones como buenas o muy buenas en 2023', () => {
      casi(porcentaje(2023, 'p17_escala', [1, 2]), 60.2, 0.1)
    })

    it('el 57 por ciento no sabía que los buses eléctricos son de marcas chinas', () => {
      casi(porcentaje(2025, 'p18e', [2]), 57.0, 0.1)
      // Y aun así el 82 por ciento evalúa bien la electrificación de la flota.
      casi(porcentaje(2025, 'p18d', [1, 2]), 82.6, 0.1)
    })
  })

  describe('p9 · vacunas Sinovac, y el precio de una categoría nueva', () => {
    it.each([[2023, 76.4], [2024, 77.1]])('en %d declara haberla recibido el %d por ciento', (ola, esperado) => {
      casi(porcentaje(ola, 'p9', [1, 2]), esperado)
    })

    /**
     * En 2025 se agregó «No recuerdo» y se llevó al 17 por ciento de la muestra. Los 74,9 de la
     * guía salen de sacar esa categoría del denominador; sobre todas las respuestas efectivas da
     * 62,1. Las dos cifras son correctas y describen cosas distintas, así que **la figura tiene
     * que decir sobre qué base está calculada**. El olvido es en sí mismo un hallazgo.
     */
    it('en 2025 la cifra depende de qué se haga con «No recuerdo»', () => {
      casi(porcentaje(2025, 'p9', [4]), 17.0, 0.1)
      casi(porcentaje(2025, 'p9', [1, 2], { excluir: [4] }), 74.9, 0.1)
      casi(porcentaje(2025, 'p9', [1, 2]), 62.1, 0.1)
    })
  })

  describe('p4 · el voto hipotético de 2025 contra el resultado real', () => {
    /**
     * La ola 2025 se levantó entre el 7 y el 18 de octubre, un mes antes de la primera vuelta.
     * No fue diseñada como encuesta electoral, y aun así el reparto entre los dos nombres quedó
     * cerca del resultado de la segunda vuelta del 14 de diciembre (58,6 contra 41,4).
     */
    it('reparte 55 a 45 a favor de Kast entre quienes eligen uno de los dos', () => {
      // Por código y no por etiqueta a propósito: en 2025 el 1 es Kast y el 2 es Jara, al
      // revés que en 2023. Escribirlo con el número deja el cambio a la vista.
      const kast = casosDe(2025).filter((d) => d.p4 === 1).length
      const jara = casosDe(2025).filter((d) => d.p4 === 2).length
      casi((100 * kast) / (kast + jara), 55.0, 0.1)
      expect(kast + jara).toBe(876)
    })
  })

  describe('lo que condiciona cualquier comparación entre oleadas', () => {
    it('159 panelistas participan en más de una oleada, 338 filas en total', () => {
      const veces = new Map()
      for (const d of [2023, 2024, 2025].flatMap((o) => casosDe(o))) {
        if (d.codpanelista === null || d.codpanelista === undefined) continue
        veces.set(d.codpanelista, (veces.get(d.codpanelista) ?? 0) + 1)
      }
      const repetidos = [...veces.values()].filter((n) => n > 1)
      expect(repetidos.length).toBe(159)
      expect(repetidos.reduce((a, b) => a + b, 0)).toBe(338)
    })

    it('p20 solo existe en 2023 y 2024, con el cobre primero y la eléctrica tercera', () => {
      expect(casosDe(2025).every((d) => d.p20_1 === null)).toBe(true)
      const sectores = { p20_1: 'distribución eléctrica', p20_2: 'cobre', p20_3: 'litio', p20_7: 'bancario' }
      const anteriores = [...casosDe(2023), ...casosDe(2024)]
      const conteo = Object.keys(sectores).map((c) => ({
        sector: sectores[c],
        n: anteriores.filter((d) => d[c] === 1).length,
      })).sort((a, b) => b.n - a.n)
      expect(conteo.map((x) => x.sector)).toEqual(['cobre', 'litio', 'distribución eléctrica', 'bancario'])
    })
  })
})

/**
 * `C17`: el gradiente ideológico que la guía presenta como característica del caso chileno
 * es de la oleada 2023, y no se sostiene en las otras dos.
 *
 * La guía dice que «la evaluación de China cae de manera ordenada a medida que uno se mueve
 * hacia la derecha del espectro, con una diferencia cercana a quince puntos entre los
 * extremos», y con eso argumenta que Chile es un caso desviado frente a Morgenstern y
 * Bohigues, que no encuentran estructura ideológica en las actitudes hacia China.
 *
 * Los quince puntos existen, en 2023. En 2024 el signo se invierte y en 2025 el gradiente
 * queda en menos de la mitad. Sobre las tres oleadas juntas el efecto desaparece.
 *
 * Estas pruebas afirman lo que dicen los datos. Si una oleada futura devuelve el gradiente,
 * fallan, que es cuando conviene volver a mirar el argumento.
 */
describe('C17 · el gradiente ideológico no es estable entre oleadas', () => {
  const extremos = (ola) => {
    const casos = casosDe(ola).filter((d) => typeof d.p3 === 'number' && typeof d.p5_1_val === 'number')
    const media = (filtro) => {
      const g = casos.filter(filtro)
      return g.reduce((s, d) => s + d.p5_1_val, 0) / g.length
    }
    return media((d) => d.p3 <= 2) - media((d) => d.p3 >= 9)
  }

  it('en 2023 la izquierda evalúa a China 14,5 puntos mejor que la derecha', () => {
    casi(extremos(2023), 14.5, 0.1)
  })

  it('en 2024 el signo se invierte: la derecha evalúa mejor', () => {
    expect(extremos(2024)).toBeLessThan(0)
    casi(extremos(2024), -4.3, 0.1)
  })

  it('en 2025 el gradiente es menos de la mitad del de 2023', () => {
    casi(extremos(2025), 5.7, 0.1)
    expect(extremos(2025)).toBeLessThan(extremos(2023) / 2)
  })
})
