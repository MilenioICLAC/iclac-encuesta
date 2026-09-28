import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * **El vocabulario de las historias**, leído del código fuente de `src/historias/` y de sus textos
 * en tres idiomas (`src/historias/textos/`).
 *
 * Lo que vigila no lo ve ningún tipo: que la misma fórmula no se repita hasta volverse ruido ella
 * misma («no se distingue del ruido» cansaba en cada escena) y que ninguna historia hable por el
 * país ni prometa un margen de error que una muestra por cuotas no tiene (hecho 2 de `CLAUDE.md`).
 * La cuenta de «ruido» lee también los comentarios: una frase que vive en un comentario termina
 * copiada a la interfaz. Las prohibiciones, no: un comentario puede nombrar lo que no se dice.
 *
 * **Cada idioma se vigila con su propio vocabulario.** Un módulo de textos escribe cada idioma en un
 * bloque que empieza con `  es: `, `  en: ` o `  cn: ` a dos espacios (`textos/tipos.ts`); acá se
 * cortan por esas líneas. El código de las historias que todavía no migraron cuenta como español.
 */
const leer = (carpeta, filtro) => readdirSync(carpeta).filter(filtro).map((f) => ({ archivo: `${carpeta}/${f}`, texto: readFileSync(`${carpeta}/${f}`, 'utf8') }))
const historias = leer('src/historias', (f) => f.endsWith('.tsx') || f.endsWith('.ts'))
const textos = leer('src/historias/textos', (f) => f.endsWith('.tsx'))

/** Los bloques de cada idioma de un módulo de textos. Lo que va antes del primero (tipos, ayudantes) no es de ninguno. */
function porIdioma (texto) {
  const salida = { es: '', en: '', cn: '' }
  let actual = null
  for (const linea of texto.split('\n')) {
    const m = linea.match(/^ {2}(es|en|cn): /)
    if (m) actual = m[1]
    if (actual) salida[actual] += `${linea}\n`
  }
  return salida
}

const bloques = textos.map(({ archivo, texto }) => ({ archivo, ...porIdioma(texto) }))
const fuentes = {
  es: [...historias, ...bloques.map((b) => ({ archivo: b.archivo, texto: b.es }))],
  en: bloques.map((b) => ({ archivo: b.archivo, texto: b.en })),
  cn: bloques.map((b) => ({ archivo: b.archivo, texto: b.cn })),
}

/** Sin comentarios: pueden nombrar lo que la interfaz no dice, justamente para prohibirlo. */
const sinComentarios = (texto) => texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/{\/\*[\s\S]*?\*\/}/g, '').replace(/^\s*\/\/.*$/gm, '')

const cuenta = (idioma, patron) => fuentes[idioma].reduce((t, f) => t + (f.texto.match(patron) ?? []).length, 0)

describe('el vocabulario de las historias', () => {
  it('lee las historias y sus textos', () => {
    expect(historias.length).toBeGreaterThanOrEqual(5)
    expect(textos.length).toBeGreaterThanOrEqual(1)
    // Un módulo sin los tres bloques no se estaría vigilando entero.
    for (const b of bloques) for (const idioma of ['es', 'en', 'cn']) expect(b[idioma], `${b.archivo} · ${idioma}`).not.toBe('')
  })

  it('«no se distingue del ruido» aparece a lo más una vez en todas, en cada idioma', () => {
    expect(cuenta('es', /no se distingue del ruido/gi)).toBeLessThanOrEqual(1)
    expect(cuenta('en', /indistinguishable from noise/gi)).toBeLessThanOrEqual(1)
    expect(cuenta('cn', /与噪声无法区分/g)).toBeLessThanOrEqual(1)
  })

  it('no habla por el país ni de margen de error', () => {
    for (const { archivo, texto } of fuentes.es) {
      expect(sinComentarios(texto), archivo).not.toMatch(/los chilenos/i)
      expect(sinComentarios(texto), archivo).not.toMatch(/margen de error/i)
    }
  })

  it('no usa el vocabulario del equipo', () => {
    for (const { archivo, texto } of fuentes.es) {
      expect(sinComentarios(texto), archivo).not.toMatch(/microdata|ponderador|quiebre de serie/i)
    }
  })

  it('en inglés, tampoco: ni margen de error, ni ponderación, ni «panel» fuera de «panel online»', () => {
    for (const { archivo, texto } of fuentes.en) {
      expect(sinComentarios(texto), archivo).not.toMatch(/margin of error|microdata|weight(ed|ing|s)?\b|series break|\bthe chileans\b|\bpanel\b(?! online)/i)
    }
  })

  it('en chino, tampoco', () => {
    for (const { archivo, texto } of fuentes.cn) {
      expect(sinComentarios(texto), archivo).not.toMatch(/误差范围|抽样误差|加权|面板(?!在线)|微观数据/)
    }
  })
})

/**
 * El cromo, las páginas y el explorador (`src/locales/<idioma>/<namespace>.json`): **las mismas
 * claves en los tres idiomas**. Una clave que falta cae al español sin avisar (`fallbackLng`), y
 * una que sobra es un texto que nadie muestra.
 */
describe('los textos de i18next', () => {
  const claves = (objeto, ruta = '') => Object.entries(objeto).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' ? claves(v, `${ruta}${k}.`) : [`${ruta}${k}`]).sort()
  const namespaces = readdirSync('src/locales/es').filter((f) => f.endsWith('.json'))

  it('hay los mismos namespaces en los tres idiomas', () => {
    expect(namespaces.length).toBeGreaterThan(0)
    for (const idioma of ['en', 'cn']) expect(readdirSync(`src/locales/${idioma}`).filter((f) => f.endsWith('.json')).sort()).toEqual([...namespaces].sort())
  })

  for (const ns of namespaces) {
    it(`${ns}: las mismas claves en español, inglés y chino`, () => {
      const es = claves(JSON.parse(readFileSync(`src/locales/es/${ns}`, 'utf8')))
      for (const idioma of ['en', 'cn']) {
        expect(claves(JSON.parse(readFileSync(`src/locales/${idioma}/${ns}`, 'utf8'))), `${idioma}/${ns}`).toEqual(es)
      }
    })
  }
})
