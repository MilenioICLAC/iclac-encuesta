import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { CATEGORIAS, extremoDe, figuraBalanza, figuraConfianza, brechaPersonal } from './confianza'
import { CONFIANZA } from './paleta'
import type { Caso, Encuesta, Variable } from './tipos'

/**
 * La escena 2 muestra las cuatro categorías de `p24` y `p25` a los dos lados de un cero común, y
 * cierra comparando dentro de la persona. Lo que estas pruebas fijan es lo que ninguna revisión de
 * código ve: que la escala no dependa de lo que está encendido, que las filas sumen lo que dicen
 * sumar, y que la comparación pareada use la escala y no los códigos crudos.
 */

const encuesta: Encuesta = JSON.parse(readFileSync('public/data/encuesta.json', 'utf8'))
const variable = (nombre: string): Variable =>
  encuesta.variables.find((v) => v.nombre === nombre) as Variable
const casosDe = (ola: number): Caso[] => encuesta.casos.filter((c) => Number(c.ola) === ola)

describe('las figuras de confianza', () => {
  const figura = figuraConfianza(
    [{ grupo: 'China', variable: variable('p24') }, { grupo: 'Estados Unidos', variable: variable('p25') }],
    encuesta.olas,
    casosDe,
  )

  it('trae una fila por oleada y potencia, y cada una suma 100', () => {
    expect(figura.filas).toHaveLength(encuesta.olas.length * 2)
    for (const fila of figura.filas) {
      expect(fila.valores.reduce((s, v) => s + v, 0), fila.clave).toBeCloseTo(100, 6)
      expect(fila.base).toBeGreaterThan(0)
    }
  })

  it('la escala cubre la fila más larga de las dos potencias', () => {
    for (const fila of figura.filas) {
      const izquierda = fila.valores.reduce((s, v, i) => s + (CATEGORIAS[i].lado === -1 ? v : 0), 0)
      const derecha = fila.valores.reduce((s, v, i) => s + (CATEGORIAS[i].lado === 1 ? v : 0), 0)
      expect(Math.max(izquierda, derecha), fila.clave).toBeLessThanOrEqual(figura.extremo)
    }
  })

  it('la escala no depende de qué filas estén encendidas', () => {
    // Regla 1 de `nucleo/pasos.ts`: si la escala se recalculara con lo visible, un segmento
    // cambiaría de largo al aparecer el resto, que es mentir con una animación. El primer paso de
    // la escena muestra solo China, y con esas tres filas la escala sería otra.
    const soloChina = figura.filas.filter((f) => f.grupo === 'China')
    expect(extremoDe(soloChina, CATEGORIAS)).toBeLessThanOrEqual(figura.extremo)
    expect(figura.extremo).toBe(extremoDe(figura.filas, CATEGORIAS))
  })

  it('pinta la escala con los colores de la paleta, no con hexadecimales sueltos', () => {
    // Así cualquier vista pinta la misma pregunta igual sin que nadie repita un color.
    expect(CATEGORIAS.map((c) => c.color)).toEqual([
      CONFIANZA.ninguna, CONFIANZA.poca, CONFIANZA.algo, CONFIANZA.mucha,
    ])
    expect(CATEGORIAS.map((c) => c.lado)).toEqual([-1, -1, 1, 1])
  })
})

describe('la comparación dentro de la persona', () => {
  it('ordena la escala y no los códigos', () => {
    // El código 1 es «Mucha», el 3 «Poca» y el 99 «Ninguna»: restar los códigos daría al revés.
    expect(brechaPersonal({ p24: 1, p25: 99 } as unknown as Caso)).toBe(3)
    expect(brechaPersonal({ p24: 99, p25: 1 } as unknown as Caso)).toBe(-3)
    expect(brechaPersonal({ p24: 3, p25: 3 } as unknown as Caso)).toBe(0)
    expect(brechaPersonal({ p24: 2, p25: null } as unknown as Caso)).toBeNull()
  })

  it('reparte cada oleada en los tres estados, sin perder a nadie', () => {
    const balanza = figuraBalanza(encuesta.olas, casosDe)
    expect(balanza.filas).toHaveLength(encuesta.olas.length)
    for (const fila of balanza.filas) {
      expect(fila.valores.reduce((s, v) => s + v, 0), fila.clave).toBeCloseTo(100, 6)
    }
    // Y el empate va a caballo del cero: es lo que hace que la fila quede centrada cuando los dos
    // lados pesan lo mismo.
    expect(balanza.categorias.map((c) => c.lado)).toEqual([-1, 0, 1])
  })

  it('en la última oleada más gente confía en China que en Estados Unidos', () => {
    const balanza = figuraBalanza(encuesta.olas, casosDe)
    const ultima = balanza.filas[balanza.filas.length - 1]
    expect(ultima.valores[2]).toBeGreaterThan(ultima.valores[0])
  })
})
