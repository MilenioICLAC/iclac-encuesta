import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { figuraTermometro, unidadEje } from './termometro'

/**
 * La figura del termómetro es una sola, la use quien la use.
 *
 * El recorrido y el tablero mostraban la misma pregunta y no se parecían en nada (07-09-2026), así
 * que acá se fija lo común: la escala sale de los datos y no de quién la pide, las filas se ordenan
 * por la última oleada, y el eje declara el recorte. La última prueba vigila que la historia siga
 * pasando por acá.
 */

const filas = [
  { clave: 'China', etiqueta: 'China', valores: [61.4, 60.9, 65.8] },
  { clave: 'EE. UU.', etiqueta: 'Estados Unidos', valores: [63.4, 64.2, 58.7] },
  { clave: 'Japón', etiqueta: 'Japón', valores: [71.8, 72.8, 74.1] },
]

describe('la figura del termómetro', () => {
  it('ordena por la última oleada, no por el promedio de la serie', () => {
    // Estados Unidos tiene mejor promedio que China y peor última oleada: manda la última.
    expect(figuraTermometro(filas).filas.map((f) => f.clave)).toEqual(['Japón', 'China', 'EE. UU.'])
  })

  it('usa una escala sola para todas las filas', () => {
    const { escala } = figuraTermometro(filas)
    expect(escala.min).toBeLessThanOrEqual(58.7)
    expect(escala.max).toBeGreaterThanOrEqual(74.1)
  })

  it('la escala no depende de qué filas se muestren primero', () => {
    const alReves = figuraTermometro([...filas].reverse())
    expect(alReves.escala).toEqual(figuraTermometro(filas).escala)
    expect(alReves.unidadEje).toEqual(figuraTermometro(filas).unidadEje)
  })

  it('el eje declara el recorte cuando no arranca en cero', () => {
    expect(unidadEje({ min: 55, max: 75 })).toMatch(/eje recortado a 55-75/)
    expect(unidadEje({ min: 0, max: 100 })).toBe('Evaluación de 0 a 100')
  })

  it('las filas sin dato en una oleada no rompen el orden ni la escala', () => {
    const conHuecos = [
      { clave: 'A', etiqueta: 'A', valores: [null, null, 70] },
      { clave: 'B', etiqueta: 'B', valores: [50, 60, null] },
    ]
    const { filas: orden, escala } = figuraTermometro(conHuecos)
    // B se ordena por su último dato disponible (60), no por el hueco.
    expect(orden.map((f) => f.clave)).toEqual(['A', 'B'])
    expect(escala.min).toBeLessThanOrEqual(50)
    expect(escala.max).toBeGreaterThanOrEqual(70)
  })

  // **La prueba que vigila que no se separen.** El tablero, la otra vista que dibujaba esta
  // pregunta, salió de la app el 22-09-2026; si otra vista vuelve a dibujarla, se suma acá.
  it('la historia arma su figura con esta función', () => {
    const historia = readFileSync('src/historias/recorrido.tsx', 'utf8').match(/figuraTermometro\(/g) ?? []
    expect(historia.length, 'la historia «La mirada» tiene que pasar por figuraTermometro').toBeGreaterThanOrEqual(1)
  })
})
