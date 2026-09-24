import { describe, it, expect } from 'vitest'
import { radioSiguiente } from './teclado'

describe('el teclado de un grupo de radios', () => {
  it('las flechas avanzan y retroceden dando la vuelta', () => {
    expect(radioSiguiente('ArrowRight', 2, [true, true, true])).toBe(0)
    expect(radioSiguiente('ArrowLeft', 0, [true, true, true])).toBe(2)
    expect(radioSiguiente('ArrowDown', 0, [true, true, true])).toBe(1)
  })

  it('se salta las opciones apagadas', () => {
    expect(radioSiguiente('ArrowRight', 0, [true, false])).toBe(0)
    expect(radioSiguiente('End', 0, [true, false, true, false])).toBe(2)
  })

  it('otras teclas no son suyas', () => {
    expect(radioSiguiente('Tab', 0, [true, true])).toBeNull()
    expect(radioSiguiente('Enter', 0, [true, true])).toBeNull()
  })
})
