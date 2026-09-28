import { describe, expect, it } from 'vitest'
import { aplanar, validarTraducciones } from './validar.mjs'
import { cargarTraducciones } from './publicar.mjs'

/*
 * El contrato de los archivos de traducción. Las primeras pruebas rompen un archivo a propósito; la
 * última carga los de verdad y comprueba que exporten lo que el ETL espera.
 */

const es = { p24: { titulo: 'Confianza en China', categorias: { 1: 'Mucha', 99: 'Ninguna' } } }
const copia = (o) => JSON.parse(JSON.stringify(o))

describe('validarTraducciones', () => {
  it('deja pasar las mismas claves', () => {
    expect(() => validarTraducciones('preguntas', es, { en: copia(es), cn: copia(es) })).not.toThrow()
  })

  it('ataja una clave que falta, en cualquier idioma, con su ruta', () => {
    const cn = copia(es)
    delete cn.p24.categorias[99]
    expect(() => validarTraducciones('preguntas', es, { en: copia(es), cn }))
      .toThrow(/preguntas\.cn\.mjs: falta p24 › categorias › 99/)
  })

  it('ataja una clave que sobra', () => {
    const en = copia(es)
    en.p24.enunciado = 'Trust in China'
    expect(() => validarTraducciones('preguntas', es, { en, cn: copia(es) }))
      .toThrow(/preguntas\.en\.mjs: sobra p24 › enunciado/)
  })

  it('ataja un texto vacío', () => {
    const en = copia(es)
    en.p24.titulo = ' '
    expect(() => validarTraducciones('preguntas', es, { en, cn: copia(es) })).toThrow(/p24 › titulo no es un texto/)
  })

  it('no confunde una palabra con un punto con dos niveles', () => {
    expect(aplanar({ 'ee.uu': 'ee.uu' })).toEqual([[['ee.uu'], 'ee.uu']])
    expect(() => validarTraducciones('palabras', { 'ee.uu': 'x' }, { en: { ee: { uu: 'x' } } })).toThrow(/falta ee\.uu/)
  })
})

describe('los archivos de traducción', () => {
  it('existen para los dos idiomas y exportan un objeto por tema', async () => {
    const t = await cargarTraducciones()
    for (const idioma of ['en', 'cn']) {
      for (const archivo of ['preguntas', 'contrastes', 'palabras']) {
        expect(typeof t[idioma][archivo], `${archivo}.${idioma}`).toBe('object')
        expect(Object.keys(t[idioma][archivo]).length, `${archivo}.${idioma}`).toBeGreaterThan(0)
      }
    }
  })
})
