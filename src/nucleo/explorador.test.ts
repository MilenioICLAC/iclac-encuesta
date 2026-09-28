import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import type { Encuesta } from './tipos'
import { CORTES } from './modulos'
import { formaDeFigura, modelo, paletaDeCorte, tituloEn, type Estado, type Modelo } from './explorador'
import { GENERO, GRUPOS, IDEOLOGIA, MACROZONA } from './paleta'
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
    describe(`${p.id} · ${p.titulo.es}`, () => {
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
  })

  it('p4 entre oleadas sigue a Kast por candidato, no por código, y Boric y Jara solo en sus oleadas', () => {
    const m = serie('p4')
    if (m.forma !== 'porcentajes') throw new Error('esperaba porcentajes')
    const fila = (etiqueta: string) => m.bloques.find((b) => b.etiqueta === etiqueta)!.filas.map((f) => (f.valor === null ? null : Math.round(f.valor * 10) / 10))
    // 182 de 664, 171 de 668 y 482 de 1.227: en 2025 Kast es el código 1, antes el 2.
    expect(fila('Kast')).toEqual([27.4, 25.6, 39.3])
    expect(fila('Boric')).toEqual([43.4, 39.5, null])
    expect(fila('Jara')).toEqual([null, null, 32.1])
    expect(m.series.map((s) => s.clave)).toEqual(['2023', '2024', '2025'])
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

describe('la paleta de cada corte (duodécima ronda)', () => {
  const p = (id: string) => encuesta.preguntas.find((x) => x.id === id)!
  const con = (corte: string) => {
    const m = modelo(encuesta, p('p7'), { vista: 'ola', ola: 2025, corte, soloIndependientes: false })
    if (m.forma === 'vacia') throw new Error('vacía')
    return { m, ...paletaDeCorte(m) }
  }
  it('NSE va de E a AB · C1, como los otros cortes: AB · C1 al final, el más oscuro y el más grande', () => {
    const { m, colores, tamanos } = con('nse_rec')
    expect(m.series.map((x) => x.etiqueta)).toEqual(['E', 'D', 'C3', 'C2', 'AB · C1'])
    expect(colores[4]).toBe(GRUPOS[4])
    expect(tamanos).toEqual([8, 10, 12, 14, 16])
  })
  it('ideología va de rojo a azul, sin tamaño', () => {
    const { colores, tamanos } = con('p3_3')
    expect(colores).toEqual([...IDEOLOGIA])
    expect(tamanos).toBeNull()
  })
  it('macrozona va en su rampa azul de norte a sur, sin tamaño', () => {
    const { colores, tamanos } = con('region_macrozona')
    expect(colores).toEqual([...MACROZONA])
    expect(tamanos).toBeNull()
  })
  it('edad sigue en la rampa, con punto creciente', () => {
    const { colores, tamanos } = con('edad_rec')
    expect(colores[0]).toBe(GRUPOS[0])
    expect(tamanos).toEqual([8, 10, 12, 14, 16])
  })
  it('el color y el tamaño siguen al grupo aunque falte uno', () => {
    const ideo = con('p3_3').m
    expect(paletaDeCorte({ ...ideo, series: ideo.series.filter((s) => s.etiqueta !== 'Centro') }).colores).toEqual([IDEOLOGIA[0], IDEOLOGIA[2]])
    const nse = con('nse_rec').m
    const sinE = paletaDeCorte({ ...nse, series: nse.series.filter((s) => s.etiqueta !== 'E') })
    expect(sinE.tamanos![sinE.tamanos!.length - 1]).toBe(16)
    const genero = con('sexo').m
    expect(paletaDeCorte({ ...genero, series: genero.series.filter((s) => s.etiqueta !== 'Masculino') }).colores).toEqual([GENERO[1]])
  })
})

describe('las preguntas abiertas (laboratorio abiertas, 24-09-2026)', () => {
  const abiertas = encuesta.preguntas.filter((p) => p.abierta)
  const estado = (e: Partial<Estado>): Estado => ({ vista: 'ola', ola: 2025, corte: null, soloIndependientes: false, ...e })
  const porcentajes = (m: Modelo) => {
    if (m.forma !== 'porcentajes') throw new Error(`esperaba porcentajes, llegó ${m.forma}`)
    return m
  }

  it('son las ocho de las nubes', () => {
    expect(abiertas.map((p) => p.id).sort()).toEqual(['p16', 'p17_texto', 'p4_1', 'p4_2', 'p4_3', 'p4_4', 'p4_5', 'p6a_marcas'])
  })

  for (const p of abiertas) {
    it(`${p.id}: sin corte, diez palabras con las mismas cifras que su nube`, () => {
      // La nube se cuenta por otro camino (`contar` sobre el texto, en el ETL): si las marcas por
      // persona se desalinean, esto lo ve.
      const nube = encuesta.nubes.find((n) => n.id === (p.id === 'p6a_marcas' ? 'p6a' : p.id))!
      for (const ola of p.olas) {
        const m = porcentajes(modelo(encuesta, p, estado({ ola })))
        expect(m.bloques).toHaveLength(10)
        expect(m.escala).toBe('palabras')
        expect(m.bloques[0].filas[0].base, `${ola}: base`).toBe(nube.baseOla?.[ola])
        for (const b of m.bloques) {
          expect(b.filas[0].n, `${ola} · ${b.etiqueta}`).toBe(nube.porOla[ola].find((x) => x.palabra.es === b.etiqueta)?.n)
        }
      }
    })

    it(`${p.id}: con corte, las mismas palabras y ningún punto bajo el mínimo`, () => {
      const ola = p.olas[p.olas.length - 1]
      const sin = porcentajes(modelo(encuesta, p, estado({ ola }))).bloques.map((b) => b.etiqueta).sort()
      for (const corte of cortes.filter((c): c is string => c !== null)) {
        const m = porcentajes(modelo(encuesta, p, estado({ ola, corte })))
        expect(m.bloques.map((b) => b.etiqueta).sort(), corte).toEqual(sin)
        for (const f of m.bloques.flatMap((b) => b.filas)) {
          if (f.valor !== null) expect(f.n, `${corte} · ${f.etiqueta}`).toBeGreaterThanOrEqual(p.abierta!.minimo)
          else expect(f.n).toBeLessThan(p.abierta!.minimo)
        }
      }
    })
  }

  it('entre oleadas, diez palabras y un punto por oleada', () => {
    for (const p of abiertas) {
      const m = porcentajes(modelo(encuesta, p, estado({ vista: 'serie' })))
      expect(m.bloques).toHaveLength(10)
      expect(m.series.map((s) => Number(s.clave))).toEqual(p.olas)
      expect(m.bloques.every((b) => b.filas.every((f) => f.valor !== null))).toBe(true)
    }
  })

  it('el nombre del propio país no cuenta', () => {
    const etiquetas = (id: string) => encuesta.preguntas.find((x) => x.id === id)!.categorias!.map((c) => c.etiqueta.es)
    expect(etiquetas('p4_1')).not.toContain('china')
    expect(etiquetas('p4_4')).not.toContain('francia')
  })
})
