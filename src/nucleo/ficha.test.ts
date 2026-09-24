import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import type { Encuesta } from './tipos'
import { composicion, edades, pesoDeRegion, regionesPorIndice } from './ficha'
import { participacion, personasRepetidas } from './agregar'

/*
 * Las cifras de la «Ficha técnica» contra el artefacto. Los valores esperados son los de la base
 * combinada, verificados a mano el 24-09-2026 (hoja `notas` y conteos por columna).
 */
const encuesta: Encuesta = JSON.parse(readFileSync('public/data/encuesta.json', 'utf8'))

describe('ficha técnica', () => {
  it('respuestas y personas no son lo mismo', () => {
    expect(participacion(encuesta)).toEqual({ respuestas: 2559, personas: 2380, repetidas: 159, enDos: 139, enTres: 20, filasRepetidas: 338 })
    expect(personasRepetidas(encuesta)).toBe(159)
  })

  it('las regiones van en el orden del índice, cuatro por estrato, y suman cada oleada', () => {
    const r = regionesPorIndice(encuesta)
    expect(r).toHaveLength(16)
    expect(r.map((x) => x.q)).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4])
    expect(r[0]).toMatchObject({ codigo: 2, n: { 2023: 48, 2024: 48, 2025: 91 } })
    for (const o of encuesta.olas) expect(r.reduce((s, x) => s + (x.n[o] ?? 0), 0)).toBe(encuesta.n[o])
  })

  it('la Metropolitana pesa entre 15,8 y 16,5 % de los casos', () => {
    const p = pesoDeRegion(encuesta, 13)
    expect([2023, 2024, 2025].map((o) => p[o].toFixed(1))).toEqual(['15.8', '16.2', '16.5'])
  })

  it('edades de 18 a 81, 85 y 87, con medianas 43, 44 y 43', () => {
    const e = edades(encuesta)
    expect([e[2023], e[2024], e[2025]]).toEqual([{ min: 18, max: 81, mediana: 43 }, { min: 18, max: 85, mediana: 44 }, { min: 18, max: 87, mediana: 43 }])
  })

  it('cada variable de la composición suma el total de la oleada, sin el tramo vacío de 0 a 17', () => {
    const c = composicion(encuesta)
    expect(c.map((g) => g.variable)).toEqual(['Sexo', 'Edad', 'Nivel socioeconómico', 'Nivel educativo'])
    for (const g of c) for (const o of encuesta.olas) expect(g.categorias.reduce((s, x) => s + x.n[o], 0)).toBe(encuesta.n[o])
    expect(c[1].categorias.map((x) => x.etiqueta)).toEqual(['18 a 24 años', '25 a 34 años', '35 a 44 años', '45 a 54 años', '55 a 64 años', '65 años o más'])
  })
})
