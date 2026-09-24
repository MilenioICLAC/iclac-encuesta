import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { registros } from './lib/xlsx.mjs'
import { PREGUNTAS, validarPreguntas } from './lib/preguntas_explorador.mjs'

/*
 * El catálogo del explorador contra los datos. La primera prueba es la que corre el ETL; las demás
 * rompen el catálogo a propósito para comprobar que el validador no deja pasar lo que debe atajar.
 */

const encuesta = JSON.parse(readFileSync('public/data/encuesta.json', 'utf8'))
const { datos: valores } = registros('data/sources/combinada/ICLAC_2023_2025_combinada.xlsx', 'valores')
const base = { variables: encuesta.variables, multiples: encuesta.multiples, valores, casos: encuesta.casos }
const con = (id, cambio) => PREGUNTAS.map((p) => (p.id === id ? { ...p, ...cambio } : p))

describe('catálogo del explorador', () => {
  it('cuadra con los datos de las tres oleadas', () => {
    expect(() => validarPreguntas(base)).not.toThrow()
  })

  it('ataja un código que cambia de candidato sin etiqueta por oleada (p4)', () => {
    expect(() => validarPreguntas({ ...base, preguntas: con('p4', { porOla: undefined }) }))
      .toThrow(/p4: el código 1 cambia de etiqueta/)
  })

  it('ataja un código de los datos sin etiqueta', () => {
    expect(() => validarPreguntas({ ...base, preguntas: con('p12', { categorias: [[1, 'Sí']] }) }))
      .toThrow(/p12: el código 2 aparece en 2023 y no tiene etiqueta/)
  })

  it('ataja una serie en una oleada donde la pregunta no se hizo', () => {
    expect(() => validarPreguntas({ ...base, preguntas: con('p27', { serie: { olas: [2023, 2024, 2025] } }) }))
      .toThrow(/p27: la serie pide 2025/)
  })

  it('ataja una pregunta de varias oleadas que no se compara sin decir por qué', () => {
    expect(() => validarPreguntas({ ...base, preguntas: con('p7', { serie: null }) }))
      .toThrow(/p7: está en 2023, 2024, 2025 y no se compara/)
  })

  it('ataja una variable con categorías que nadie ubicó', () => {
    const variables = [...encuesta.variables, { nombre: 'p99', categorias: [{ codigo: 1, etiqueta: 'Sí' }] }]
    expect(() => validarPreguntas({ ...base, variables })).toThrow(/p99 tiene categorías y no está/)
  })

  it('ataja una serie que recodifica un código a una categoría que no existe (p4)', () => {
    const p4 = PREGUNTAS.find((p) => p.id === 'p4')
    const serie = { ...p4.serie, recodificar: { 2025: { 1: 2, 2: 9, 3: 3, 4: 4 } } }
    expect(() => validarPreguntas({ ...base, preguntas: con('p4', { serie }) }))
      .toThrow(/p4 \(serie\): el código 2 de 2025 queda como 9/)
  })

  it('ataja una categoría de la serie con respuestas fuera de sus oleadas (p4 sin recodificar)', () => {
    const p4 = PREGUNTAS.find((p) => p.id === 'p4')
    const serie = { ...p4.serie, recodificar: { 2025: { 1: 1, 2: 2, 3: 3, 4: 4 } } }
    expect(() => validarPreguntas({ ...base, preguntas: con('p4', { serie }) }))
      .toThrow(/«Boric» tiene respuestas en 2025/)
  })

  it('ataja una recodificación a medias, que sumaría los votos de Jara a Kast (p4)', () => {
    const p4 = PREGUNTAS.find((p) => p.id === 'p4')
    const serie = { ...p4.serie, recodificar: { 2025: { 1: 2 } } }
    expect(() => validarPreguntas({ ...base, preguntas: con('p4', { serie }) }))
      .toThrow(/el código 2 de 2025 no está en el mapa/)
  })

  it('ataja títulos con restos del diccionario', () => {
    expect(() => validarPreguntas({ ...base, preguntas: con('p7', { titulo: 'China_¿Cuál es tu opinión?' }) }))
      .toThrow(/restos del diccionario/)
  })
})
