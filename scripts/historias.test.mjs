import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * **El vocabulario de las historias**, leído del código fuente de `src/historias/`.
 *
 * Lo que vigila no lo ve ningún tipo: que la misma fórmula no se repita hasta volverse ruido ella
 * misma («no se distingue del ruido» cansaba en cada escena) y que ninguna historia hable por el
 * país ni prometa un margen de error que una muestra por cuotas no tiene (hecho 2 de `CLAUDE.md`).
 * La cuenta de «ruido» lee también los comentarios: una frase que vive en un comentario termina
 * copiada a la interfaz. Las prohibiciones, no: un comentario puede nombrar lo que no se dice.
 */
const carpeta = 'src/historias'
const fuentes = readdirSync(carpeta)
  .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
  .map((f) => ({ archivo: f, texto: readFileSync(`${carpeta}/${f}`, 'utf8') }))

/** Sin comentarios: pueden nombrar lo que la interfaz no dice, justamente para prohibirlo. */
const sinComentarios = (texto) => texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/{\/\*[\s\S]*?\*\/}/g, '').replace(/^\s*\/\/.*$/gm, '')

const cuenta = (patron) => fuentes.reduce((t, f) => t + (f.texto.match(patron) ?? []).length, 0)

describe('el vocabulario de las historias', () => {
  it('lee las historias', () => {
    expect(fuentes.length).toBeGreaterThanOrEqual(5)
  })

  it('«no se distingue del ruido» aparece a lo más una vez en todas', () => {
    expect(cuenta(/no se distingue del ruido/gi)).toBeLessThanOrEqual(1)
  })

  it('no habla por el país ni de margen de error', () => {
    for (const { archivo, texto } of fuentes) {
      expect(sinComentarios(texto), archivo).not.toMatch(/los chilenos/i)
      expect(sinComentarios(texto), archivo).not.toMatch(/margen de error/i)
    }
  })

  it('no usa el vocabulario del equipo', () => {
    for (const { archivo, texto } of fuentes) {
      expect(sinComentarios(texto), archivo).not.toMatch(/microdata|ponderador|quiebre de serie/i)
    }
  })
})
