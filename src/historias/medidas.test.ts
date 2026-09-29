import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Encuesta } from '../nucleo/tipos'
import { MEDIDAS, medidasDe, type IdHistoria } from './medidas'

/**
 * Qué prueba sostiene cuál figura.
 *
 * **`Evidencia` falla en silencio.** Un id que no existe en el artefacto no dibuja nada y no avisa:
 * el pop-up de esa figura se queda sin sus pruebas y la única señal es un hueco que nadie mira. El
 * riesgo no es teórico, porque los ids viven en cuatro colecciones distintas del artefacto
 * (`medidas`, `brechas`, `grupos`, `regresiones`, `transversal`) y una comparación que se retira
 * del ETL deja el nombre huérfano acá.
 *
 * También se vigila que las figuras se repartan las pruebas sin pisarse: una prueba en dos figuras
 * es una decisión, no un descuido, y hoy no hay ninguna.
 */
const encuesta: Encuesta = JSON.parse(readFileSync('public/data/encuesta.json', 'utf8'))
const c = encuesta.contrastes

const publicados = new Set<string>([
  ...(c?.medidas ?? []).map((m) => m.id),
  ...(c?.brechas ?? []).map((m) => m.id),
  ...(c?.grupos ?? []).map((m) => m.id),
  ...(c?.regresiones ?? []).map((m) => m.id),
  ...(c?.transversal ?? []).map((m) => m.id),
])

const historias = Object.keys(MEDIDAS) as IdHistoria[]

describe('los contrastes que sostienen cada figura', () => {
  it('el artefacto trae contrastes', () => {
    expect(publicados.size).toBeGreaterThan(0)
  })

  it.each(historias)('%s pide solo pruebas que el artefacto publica', (id) => {
    const faltan = medidasDe(id).filter((m) => !publicados.has(m))
    expect(faltan).toEqual([])
  })

  it.each(historias)('%s no repite una prueba entre sus figuras', (id) => {
    const todas = medidasDe(id)
    expect(todas.length).toBe(new Set(todas).size)
  })

  it('cada historia sostiene al menos una figura con pruebas', () => {
    for (const id of historias) expect(medidasDe(id).length).toBeGreaterThan(0)
  })

  it('el registro de historias deriva sus medidas de acá, sin una segunda copia', () => {
    const fuente = readFileSync('src/historias/indice.tsx', 'utf8')
    expect(fuente).not.toMatch(/medidas: \[/)
    for (const id of historias) expect(fuente).toContain(`medidas: medidasDe('${id}')`)
  })
})
