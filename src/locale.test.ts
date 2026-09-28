import { afterEach, describe, expect, it } from 'vitest'
import i18n from './i18n'
import { idioma, lista, palabraVisible, plural, traducido } from './locale'

/*
 * Los ayudantes de idioma. Las pruebas corren en español (`i18n.ts` lo fija en Node) y cada una que
 * cambia de idioma lo devuelve.
 */
afterEach(async () => { await i18n.changeLanguage('es') })

describe('el idioma activo', () => {
  it('es el español en Node, aunque el `navigator` de Node diga inglés', () => {
    expect(idioma()).toBe('es')
  })
  it('sigue a i18next', async () => {
    await i18n.changeLanguage('cn')
    expect(idioma()).toBe('cn')
    expect(traducido({ es: 'Oleada', en: 'Wave', cn: '轮次' })).toBe('轮次')
  })
})

describe('lista', () => {
  it('une con la conjunción de cada idioma', async () => {
    expect(lista(['2023', '2024', '2025'])).toBe('2023, 2024 y 2025')
    expect(lista(['2023', '2024'])).toBe('2023 y 2024')
    await i18n.changeLanguage('en')
    expect(lista(['2023', '2024', '2025'])).toBe('2023, 2024, and 2025')
    expect(lista(['2023', '2024'], 'disjunction')).toBe('2023 or 2024')
  })
  it('una lista de uno es el elemento', () => {
    expect(lista(['2025'])).toBe('2025')
  })
})

describe('plural', () => {
  const formas = { one: 'prueba', other: 'pruebas' }
  it('elige la forma por el número', () => {
    expect(plural(1, formas)).toBe('prueba')
    expect(plural(3, formas)).toBe('pruebas')
    expect(plural(0, formas)).toBe('pruebas')
  })
  it('en chino todo es `other`', async () => {
    await i18n.changeLanguage('cn')
    expect(plural(1, { one: '一', other: '多' })).toBe('多')
  })
})

describe('palabraVisible', () => {
  it('en español, la palabra; fuera, la traducción con la original', async () => {
    const comercio = { es: 'comercio', en: 'trade', cn: '贸易' }
    expect(palabraVisible(comercio)).toBe('comercio')
    await i18n.changeLanguage('en')
    expect(palabraVisible(comercio)).toBe('trade (comercio)')
    // Una marca no se repite entre paréntesis.
    expect(palabraVisible({ es: 'huawei', en: 'huawei', cn: 'huawei' })).toBe('huawei')
  })
})
