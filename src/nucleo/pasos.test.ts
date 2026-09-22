import { describe, expect, it } from 'vitest'
import { pasoActivo } from './pasos'

/**
 * La decisión del paso activo, sin DOM.
 *
 * Lo que se fija acá es que **el resultado dependa solo de qué pasos están dentro de la banda**: ni
 * del orden en que lleguen las entradas ni de hacia dónde va el scroll.
 */
const estado = (pares: [number, boolean][]) => new Map(pares)

describe('pasoActivo', () => {
  it('toma el paso que entró a la banda', () => {
    expect(pasoActivo(estado([[0, false], [1, true]]), 0)).toBe(1)
  })

  it('no cambia si nada intersecta', () => {
    expect(pasoActivo(estado([[0, false], [1, false]]), 1)).toBe(1)
  })

  it('con dos pasos dentro gana el mayor: el scroll acaba de pasar su marca', () => {
    expect(pasoActivo(estado([[1, true], [2, true]]), 1)).toBe(2)
    expect(pasoActivo(estado([[2, true], [1, true]]), 1)).toBe(2)
  })

  it('vuelve al anterior cuando el nuevo sale y el anterior nunca dejó la banda', () => {
    // El caso que la regla vieja perdía: la entrega trae solo la salida del 1.
    expect(pasoActivo(estado([[0, true], [1, false]]), 1)).toBe(0)
  })

  it('retrocede cuando el lector sube', () => {
    expect(pasoActivo(estado([[0, true], [3, false]]), 3)).toBe(0)
  })

  it('descarta un índice que no es número: una pista sin `data-paso` no mueve la figura', () => {
    expect(pasoActivo(estado([[NaN, true]]), 2)).toBe(2)
  })
})
