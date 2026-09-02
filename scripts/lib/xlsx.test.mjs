import { describe, it, expect } from 'vitest'
import { hojas, filas, registros } from './xlsx.mjs'

/**
 * El contrato del lector de .xlsx, contra la base canónica que ya está en el repositorio.
 *
 * No se inventa un archivo de prueba: el archivo real es el que tiene las trampas que importan
 * (celdas vacías salteadas, cadenas compartidas, hojas fuera del orden de sus relaciones), y si
 * el lector deja de entenderlo, el ETL entero deja de funcionar.
 */

const RUTA = 'data/sources/combinada/ICLAC_2023_2025_combinada.xlsx'

describe('lector de xlsx', () => {
  it('lista las hojas en el orden del libro', () => {
    expect(hojas(RUTA)).toEqual(['datos', 'diccionario', 'valores', 'notas'])
  })

  it('dice qué hojas hay cuando se pide una que no existe', () => {
    expect(() => filas(RUTA, 'inexistente')).toThrow(/Tiene: datos, diccionario, valores, notas/)
  })

  it('devuelve la hoja completa, encabezado incluido', () => {
    const f = filas(RUTA, 'datos')
    expect(f.length).toBe(2560)
    expect(f[0][0]).toBe('ola')
    expect(f[0].length).toBe(126)
  })

  it('distingue números de texto', () => {
    const { datos } = registros(RUTA, 'datos')
    expect(typeof datos[0].ola).toBe('number')
    expect(typeof datos[0].key).toBe('string')
  })

  it('rellena con null las celdas que el XML se saltea', () => {
    // p18e solo se preguntó en 2025: en las otras dos oleadas la celda no existe en el archivo.
    const { datos } = registros(RUTA, 'datos')
    const anteriores = datos.filter((d) => d.ola !== 2025)
    expect(anteriores.length).toBeGreaterThan(0)
    expect(anteriores.every((d) => d.p18e === null)).toBe(true)
  })

  it('resuelve las cadenas compartidas, que es donde vive el texto repetido', () => {
    const { datos } = registros(RUTA, 'valores')
    const p26 = datos.filter((d) => d.variable === 'p26' && d.ola === 2023)
    expect(p26.map((d) => d.etiqueta)).toContain('Mantener distancia de ambos')
  })
})
