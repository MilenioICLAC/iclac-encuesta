import { describe, it, expect } from 'vitest'
import { registros } from './xlsx.mjs'
import { campo, indiceRegional, mediana } from './ficha.mjs'
import { impacto } from './regiones.mjs'

/**
 * Lo que la «Ficha técnica» publica sin pasar por los casos, contra las fuentes reales. Las fechas son
 * las de la nota de la base combinada (hoja `notas`, «Fechas de campo»), no las del Policy Paper.
 */
describe('ficha técnica', () => {
  const { datos } = registros('data/sources/combinada/ICLAC_2023_2025_combinada.xlsx', 'datos')

  it('el campo de cada oleada es el de la nota de la combinada', () => {
    const c = campo(datos)
    expect(c[2023]).toMatchObject({ desde: '2023-10-10', hasta: '2023-10-13' })
    expect(c[2024]).toMatchObject({ desde: '2024-10-09', hasta: '2024-10-19' })
    expect(c[2025]).toMatchObject({ desde: '2025-10-07', hasta: '2025-10-18' })
    // En minutos, con un decimal: 11,0, 10,7 y 11,8.
    expect([2023, 2024, 2025].map((o) => (c[o].duracionMediana / 60).toFixed(1))).toEqual(['11.0', '10.7', '11.8'])
  })

  it('la mediana promedia los dos del medio', () => {
    expect(mediana([4, 1, 3, 2])).toBe(2.5)
    expect(mediana([3, 1, 2])).toBe(2)
  })

  it('el índice ordena las dieciséis regiones en los mismos cuartiles que impacto()', () => {
    const i = indiceRegional()
    expect(i).toHaveLength(16)
    expect(i[0]).toMatchObject({ codigo: 2 })
    expect(i[0].indice).toBeCloseTo(25.55, 2)
    expect(i.slice(0, 4).map((r) => impacto(r.codigo))).toEqual(['Muy alto', 'Muy alto', 'Muy alto', 'Muy alto'])
    expect(i.slice(12).map((r) => impacto(r.codigo))).toEqual(['Bajo', 'Bajo', 'Bajo', 'Bajo'])
  })
})
