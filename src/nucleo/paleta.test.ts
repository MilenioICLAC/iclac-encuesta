import { describe, it, expect } from 'vitest'
import { GENERO, GRUPOS, IDENTIDAD, ORDEN, SEMANTICOS, pasosDeGrupo, pasosDeOrden } from './paleta'

/**
 * La paleta pasó por el validador de la skill `dataviz`, que no se puede correr desde acá.
 * Estas pruebas fijan **las consecuencias de lo que dijo**, para que un cambio de colores no
 * las rompa en silencio:
 *
 * - Tres slots de identidad es el tope para figuras donde cualquier par de marcas puede
 *   tocarse. Con cuatro, magenta y verde azulado colapsan bajo deuteranopía a ΔE 0,9.
 * - Seis pasos es el tope de la rampa de orden. Con siete, dos pasos contiguos quedan a
 *   ΔL 0,056 y dejan de distinguirse.
 * - Ningún color se cicla: dos grupos con el mismo color en la misma figura es el defecto
 *   que la paleta viene a evitar.
 */

describe('la paleta', () => {
  it('mantiene el tope de tres identidades para marcas superpuestas', () => {
    expect(IDENTIDAD).toHaveLength(3)
    expect(new Set(IDENTIDAD).size).toBe(3)
  })

  it('mantiene el tope de seis pasos en la rampa de orden', () => {
    expect(ORDEN.length).toBeLessThanOrEqual(6)
    expect(new Set(ORDEN).size).toBe(ORDEN.length)
  })

  it('no repite colores en ningún corte de hasta seis grupos', () => {
    for (let n = 1; n <= ORDEN.length; n++) {
      const pasos = pasosDeOrden(n)
      expect(pasos).toHaveLength(n)
      expect(new Set(pasos).size, `con ${n} grupos hay colores repetidos`).toBe(n)
    }
  })

  it('usa los extremos de la rampa cuando hay más de un grupo', () => {
    // Sin esto, dos grupos quedarían con tonos casi iguales y el orden no se vería.
    for (const n of [2, 3, 4, 5]) {
      const pasos = pasosDeOrden(n)
      expect(pasos[0]).toBe(ORDEN[0])
      expect(pasos[n - 1]).toBe(ORDEN[ORDEN.length - 1])
    }
  })

  it('amarra los colores con significado a la etiqueta exacta que trae la base', () => {
    expect(Object.keys(SEMANTICOS)).toEqual([
      'A favor de China',
      'A favor de EE. UU.',
      'Mantener distancia de ambos',
      'Relacionarse con ambos',
      'Mucha',
      'Algo',
      'Poca',
      'Ninguna',
    ])
  })

  it('pinta la escala de confianza con dos tonos que se alejan del cero', () => {
    // La polaridad tiene que verse en el color: «Poca» y «Ninguna» de un lado, «Algo» y «Mucha»
    // del otro, y el extremo más oscuro que el interior. Con una sola rampa, el lector tiene que
    // leer la leyenda para saber de qué lado está cada segmento.
    const luz = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    expect(luz(SEMANTICOS.Mucha)).toBeLessThan(luz(SEMANTICOS.Algo))
    expect(luz(SEMANTICOS.Ninguna)).toBeLessThan(luz(SEMANTICOS.Poca))
    // Y los dos lados no comparten tono: el canal rojo separa el óxido del verde azulado.
    const rojo = (hex: string) => parseInt(hex.slice(1, 3), 16)
    expect(rojo(SEMANTICOS.Poca)).toBeGreaterThan(rojo(SEMANTICOS.Algo) + 80)
  })
})

describe('los grupos no se pintan como oleadas', () => {
  it('ningún color de grupo o de género es de la rampa de oleadas', () => {
    for (const c of [...GRUPOS, ...GENERO]) expect(ORDEN as readonly string[]).not.toContain(c)
  })
  it('pasosDeGrupo reparte de punta a punta sin repetir hasta cinco', () => {
    for (let n = 2; n <= 5; n++) {
      const pasos = pasosDeGrupo(n)
      expect(new Set(pasos).size).toBe(n)
      expect(pasos[0]).toBe(GRUPOS[0])
      expect(pasos[n - 1]).toBe(GRUPOS[4])
    }
  })
})
