import { describe, expect, it } from 'vitest'
import { pasoActivo } from './pasos'

/**
 * La decisión del paso activo, sin DOM.
 *
 * Lo que se fija acá es que **el resultado no dependa del orden de las entradas**: es el fallo que
 * el navegador puede provocar y que en pantalla se ve como un salto de la figura, no como un error.
 */
describe('pasoActivo', () => {
  it('toma el paso que entró a la banda', () => {
    expect(pasoActivo([{ paso: 1, dentro: true }], 0)).toBe(1)
  })

  it('no cambia si nada intersecta', () => {
    expect(pasoActivo([{ paso: 0, dentro: false }, { paso: 1, dentro: false }], 1)).toBe(1)
  })

  it('ignora las entradas que salieron de la banda', () => {
    expect(pasoActivo([{ paso: 0, dentro: false }, { paso: 1, dentro: true }], 0)).toBe(1)
  })

  it('da lo mismo con dos pasos dentro, sin importar el orden en que lleguen', () => {
    const entradas = [{ paso: 1, dentro: true }, { paso: 2, dentro: true }]
    expect(pasoActivo(entradas, 1)).toBe(1)
    expect(pasoActivo([...entradas].reverse(), 1)).toBe(1)
  })

  it('con dos pasos igual de lejos, avanza', () => {
    const entradas = [{ paso: 0, dentro: true }, { paso: 2, dentro: true }]
    expect(pasoActivo(entradas, 1)).toBe(2)
    expect(pasoActivo([...entradas].reverse(), 1)).toBe(2)
  })

  it('retrocede cuando el lector sube', () => {
    expect(pasoActivo([{ paso: 0, dentro: true }], 3)).toBe(0)
  })

  it('descarta un índice que no es número: una pista sin `data-paso` no mueve la figura', () => {
    expect(pasoActivo([{ paso: NaN, dentro: true }], 2)).toBe(2)
  })
})
