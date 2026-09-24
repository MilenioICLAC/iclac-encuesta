import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import type { Encuesta } from './tipos'
import { CORTES } from './modulos'
import { formaDeFigura, modelo, tituloEn, type Estado, type Modelo } from './explorador'
import { topePorcentaje } from './escala'

/*
 * Cada pregunta del explorador, en cada uno de sus estados: una oleada (las tres), cada corte, y
 * entre oleadas. Lo que se fija es lo que la campaña del 23-09-2026 encontró roto: filas «0» y
 * «1», series de preguntas que no se comparan, rótulos de 2025 sobre datos de 2023, bases que
 * eran el total de la oleada y no las respuestas.
 */

const encuesta: Encuesta = JSON.parse(readFileSync('public/data/encuesta.json', 'utf8'))
const cortes = CORTES.map((c) => c.nombre)

function estados (olas: number[]): Estado[] {
  const lista: Estado[] = []
  for (const ola of olas) for (const corte of cortes) lista.push({ vista: 'ola', ola, corte, soloIndependientes: false })
  lista.push({ vista: 'serie', ola: olas[olas.length - 1], corte: null, soloIndependientes: false })
  lista.push({ vista: 'serie', ola: olas[0], corte: 'edad_rec', soloIndependientes: true })
  return lista
}

const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

describe('el explorador, pregunta por pregunta', () => {
  it('ofrece una sola entrada por pregunta, sin columnas sueltas', () => {
    const ids = encuesta.preguntas.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).not.toMatch(/^(p5_\d$|p6a_\d|p20_|p22_|p18a_|p6b_)/)
  })

  for (const p of encuesta.preguntas) {
    describe(`${p.id} · ${p.titulo}`, () => {
      it('tiene un título legible', () => {
        for (const ola of p.olas) {
          const t = tituloEn(p, { vista: 'ola', ola })
          expect(t.length).toBeLessThanOrEqual(80)
          expect(t).not.toMatch(/_¿| - ¿|\s{2}/)
        }
      })

      it('dibuja algo con sentido en cada estado', () => {
        for (const e of estados(p.olas)) {
          const m: Modelo = modelo(encuesta, p, e)
          const donde = `${e.vista} ${e.ola} ${e.corte ?? 'sin corte'}`
          if (m.forma === 'vacia') {
            // Solo puede quedar vacía si la pregunta no se hizo en esa oleada.
            expect(p.olas.includes(e.ola) && e.vista === 'ola', donde).toBe(false)
            continue
          }

          // La forma sigue a lo que se compara: mancuerna con oleadas o grupos, barras sin nada.
          const esperado = e.vista === 'serie' && p.serie ? 'olas' : m.series.length > 0 ? 'grupos' : 'nada'
          expect(m.compara, donde).toBe(esperado)
          // Barras sin comparar, en el termómetro y en las de dos categorías; mancuerna en el resto.
          const dos = m.forma === 'porcentajes' && m.escala === 'reparto' && m.bloques.length === 2
          expect(formaDeFigura(m), donde).toBe(esperado === 'nada' || m.forma === 'medias' || dos ? 'barras' : 'mancuerna')
          if (['binaria'].includes(p.tipo) && m.forma === 'porcentajes') expect(formaDeFigura(m), `${donde}: binaria`).toBe('barras')

          if (e.vista === 'serie' && p.serie) {
            // Entre oleadas: exactamente las oleadas que el catálogo compara.
            expect(m.series.map((s) => Number(s.clave)), donde).toEqual(p.serie.olas)
          }
          if (e.vista === 'serie' && !p.serie) {
            // Si no se compara, no aparece ninguna oleada de más: queda la vista de una.
            expect(m.series.every((s) => !/^20\d\d$/.test(s.clave)), donde).toBe(true)
          }

          if (m.forma === 'medias') {
            for (const f of m.filas) {
              expect(f.base, donde).toBe(f.n)
              if (f.valor !== null) expect(f.valor).toBeGreaterThanOrEqual(0)
              if (f.valor !== null) expect(f.valor).toBeLessThanOrEqual(100)
            }
            continue
          }

          for (const b of m.bloques) expect(b.etiqueta, `${donde}: rótulo de código crudo`).not.toMatch(/^(0|1|código \d+)$/)
          const filas = m.bloques[0].filas.map((_, i) => m.bloques.map((b) => b.filas[i]))
          for (const columna of filas) {
            const base = columna[0].base
            // La base es la de respuestas efectivas de esa fila, y todas sus celdas la comparten.
            for (const f of columna) expect(f.base, donde).toBe(base)
            if (m.escala === 'reparto' && base > 0) {
              expect(suma(columna.map((f) => f.n)), `${donde}: las categorías no cubren la base`).toBe(base)
              expect(suma(columna.map((f) => f.valor ?? 0))).toBeCloseTo(100, 6)
            }
          }
        }
      })
    })
  }
})

describe('los casos que estaban rotos', () => {
  const p = (id: string) => encuesta.preguntas.find((x) => x.id === id)!
  const una = (id: string, ola: number, corte: string | null = null) => modelo(encuesta, p(id), { vista: 'ola', ola, corte, soloIndependientes: false })
  const serie = (id: string) => modelo(encuesta, p(id), { vista: 'serie', ola: 2025, corte: null, soloIndependientes: false })

  it('p4 rotula a Boric en 2023 y a Jara en 2025, y no mezcla las dos elecciones', () => {
    const m23 = una('p4', 2023)
    const m25 = una('p4', 2025)
    expect(m23.forma === 'porcentajes' && m23.bloques.map((b) => b.etiqueta)).toContain('Boric')
    expect(m25.forma === 'porcentajes' && m25.bloques.map((b) => b.etiqueta)).toContain('Jara')
    expect(p('p4').serie!.olas).toEqual([2023, 2024])
  })

  it('p7 entre oleadas muestra la escala completa, no la primera categoría', () => {
    const m = serie('p7')
    expect(m.forma === 'porcentajes' && m.bloques.length).toBe(5)
  })

  it('p11 entre oleadas compara solo a quienes recibieron Sinovac', () => {
    const m = serie('p11')
    if (m.forma !== 'porcentajes') throw new Error('esperaba porcentajes')
    const bases = m.bloques[0].filas.map((f) => f.base)
    const vacunados = [2023, 2024, 2025].map((ola) => encuesta.casos.filter((c) => c.ola === ola && [1, 2].includes(Number(c.p9)) && c.p11 !== null).length)
    expect(bases).toEqual(vacunados)
  })

  it('p18a, p37 y las de una sola oleada no se comparan', () => {
    for (const id of ['p18a', 'p37', 'p6b', 'p18c', 'p17_escala']) expect(p(id).serie).toBeNull()
  })

  it('p3 no se corta por su propia ideología', () => {
    const m = una('p3', 2025, 'p3_3')
    expect(m.forma === 'porcentajes' && m.series.length).toBe(0)
  })

  it('una múltiple con corte muestra todos los grupos, no el primero', () => {
    const m = una('p22', 2024, 'edad_rec')
    expect(m.forma === 'porcentajes' && m.series.length).toBe(5)
  })

  it('el termómetro con corte da una media por grupo', () => {
    const m = una('p5_1_val', 2025, 'region_macrozona')
    expect(m.forma === 'medias' && m.filas.map((f) => f.etiqueta)).toEqual(['Norte', 'Centro', 'Centro sur', 'Sur'])
  })

  it('el orden por frecuencia cuenta personas, no porcentajes sumados de grupos (p18a por edad)', () => {
    const m = una('p18a', 2025, 'edad_rec')
    if (m.forma !== 'porcentajes') throw new Error('esperaba porcentajes')
    expect(m.bloques[0].clave).toBe('p18a_1')
  })

  it('las menciones se escalan sobre personas, no sobre la mención mayor', () => {
    const m = una('p6b', 2025)
    if (m.forma !== 'porcentajes') throw new Error('esperaba porcentajes')
    expect(m.escala).toBe('menciones')
    expect(m.bloques[m.bloques.length - 1].clave).toBe('p6b_98')
  })
})

describe('el eje de la mancuerna de porcentajes', () => {
  it('parte en cero y sube al múltiplo de 20 sobre el mayor valor, sin pasar de 100', () => {
    expect(topePorcentaje([3.2, 58.1])).toBe(60)
    expect(topePorcentaje([60])).toBe(60)
    expect(topePorcentaje([60.4])).toBe(80)
    expect(topePorcentaje([99.9])).toBe(100)
    expect(topePorcentaje([1, 4])).toBe(20)
    expect(topePorcentaje([])).toBe(20)
  })
})

describe('los casos de la décima ronda', () => {
  const p = (id: string) => encuesta.preguntas.find((x) => x.id === id)!
  const serie = (id: string) => modelo(encuesta, p(id), { vista: 'serie', ola: 2025, corte: null, soloIndependientes: false })
  it('el termómetro y las de sí o no van en barras; p7 y p26 en mancuerna', () => {
    expect(formaDeFigura(serie('p5_1_val'))).toBe('barras')
    expect(formaDeFigura(serie('p19'))).toBe('barras')
    expect(formaDeFigura(serie('p9'))).toBe('barras')
    expect(formaDeFigura(serie('p7'))).toBe('mancuerna')
    expect(formaDeFigura(serie('p26'))).toBe('mancuerna')
  })
})
