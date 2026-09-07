import { describe, it, expect } from 'vitest'
import { bootstrap, estandarizada, generador, media, permutacion, permutacionPareada } from './lib/contraste.mjs'
import { contrastes } from './lib/contrastes.mjs'
import { casosDe } from './lib/combinada.mjs'

/**
 * Dos pruebas en un archivo, y son de naturaleza distinta.
 *
 * La primera mide **la máquina**: que la permutación y el bootstrap se comporten como tienen que
 * comportarse en casos donde la respuesta se conoce de antemano. Sin esto, un generador roto pasa
 * inadvertido: en la sesión del 07-09-2026 el primero que se escribió perdía precisión y devolvía
 * intervalos incoherentes con su propio p.
 *
 * La segunda mide **lo que el producto afirma**: el recorrido dice que entre 2023 y 2024 no se
 * movió nada y que el cambio ocurre en 2025. Eso es una afirmación sobre los datos y tiene que
 * fallar la prueba el día que deje de ser cierta, en vez de quedar publicada. Es la misma idea de
 * `informe_2023.test.mjs`: si nadie se va a enterar sin nosotros, falta el instrumento.
 *
 * Corre con menos rondas que el artefacto (2.000 contra 10.000): alcanzan para separar un p de
 * 0,7 de uno bajo 0,01, que es lo que estas pruebas afirman, y bajan el costo de `npm test`.
 */

const RONDAS = { rondas: 2000 }

describe('la máquina: permutación y bootstrap', () => {
  it('dos muestras idénticas no se distinguen', () => {
    const v = Array.from({ length: 200 }, (_, i) => i % 50)
    expect(permutacion(v, [...v], RONDAS)).toBeGreaterThan(0.5)
  })

  it('una diferencia grande queda en el piso del método', () => {
    const a = Array.from({ length: 200 }, (_, i) => i % 50)
    const b = a.map((x) => x + 25)
    // Con 2.000 rondas el piso es 1/2001: el `+1` del numerador impide publicar «p = 0».
    expect(permutacion(a, b, RONDAS)).toBeCloseTo(1 / 2001, 6)
  })

  it('el intervalo del bootstrap contiene la diferencia observada y excluye el cero cuando el p es chico', () => {
    const a = Array.from({ length: 300 }, (_, i) => (i * 7) % 40)
    const b = a.map((x) => x + 10)
    const [bajo, alto] = bootstrap(a, b, RONDAS)
    expect(bajo).toBeLessThan(10)
    expect(alto).toBeGreaterThan(10)
    expect(bajo).toBeGreaterThan(0)
  })

  it('el intervalo cruza el cero cuando no hay diferencia', () => {
    const v = Array.from({ length: 300 }, (_, i) => (i * 13) % 60)
    const [bajo, alto] = bootstrap(v, [...v].reverse(), RONDAS)
    expect(bajo).toBeLessThan(0)
    expect(alto).toBeGreaterThan(0)
  })

  it('es determinista: la misma entrada da el mismo número', () => {
    const a = Array.from({ length: 120 }, (_, i) => (i * 3) % 17)
    const b = Array.from({ length: 140 }, (_, i) => (i * 5) % 19)
    expect(permutacion(a, b, RONDAS)).toBe(permutacion(a, b, RONDAS))
    expect(bootstrap(a, b, RONDAS)).toEqual(bootstrap(a, b, RONDAS))
  })

  it('el generador es uniforme donde el congruencial clásico se rompía', () => {
    const azar = generador(20260907)
    const muestra = Array.from({ length: 20000 }, azar)
    expect(media(muestra)).toBeCloseTo(0.5, 2)
    // Cuartos poblados parejo: el generador roto amontonaba la secuencia.
    const cuartos = [0, 0, 0, 0]
    for (const x of muestra) cuartos[Math.min(3, Math.floor(x * 4))]++
    for (const c of cuartos) expect(c).toBeGreaterThan(20000 / 4 * 0.9)
  })

  it('la prueba pareada usa el signo, no la etiqueta', () => {
    const diferencias = Array.from({ length: 200 }, (_, i) => 6 + (i % 5))
    expect(permutacionPareada(diferencias, RONDAS)).toBeLessThan(0.01)
    const simetricas = Array.from({ length: 200 }, (_, i) => (i % 2 ? 5 : -5))
    expect(permutacionPareada(simetricas, RONDAS)).toBeGreaterThan(0.5)
  })

  it('la estandarización no mueve nada cuando las dos partes tienen la misma composición', () => {
    const casos = (desde) => [
      ...Array.from({ length: 50 }, () => ({ edadr: 3, sexo: 1, v: desde })),
      ...Array.from({ length: 50 }, () => ({ edadr: 6, sexo: 2, v: desde + 10 })),
    ]
    expect(estandarizada(casos(0), casos(4), (c) => c.v, (c) => `${c.edadr}|${c.sexo}`)).toBeCloseTo(4, 6)
  })

  it('la estandarización descuenta el cambio que es de composición y no de opinión', () => {
    // Las dos oleadas opinan **igual** dentro de cada grupo; lo único que cambia es cuántos hay
    // de cada uno. La diferencia cruda se mueve y la estandarizada no.
    const grupo = (edadr, valor, cuantos) => Array.from({ length: cuantos }, () => ({ edadr, sexo: 1, v: valor }))
    const a = [...grupo(3, 50, 100), ...grupo(6, 70, 100)]
    const b = [...grupo(3, 50, 20), ...grupo(6, 70, 180)]
    const cruda = media(b.map((c) => c.v)) - media(a.map((c) => c.v))
    expect(cruda).toBeCloseTo(8, 6)
    expect(estandarizada(a, b, (c) => c.v, (c) => `${c.edadr}|${c.sexo}`)).toBeCloseTo(0, 6)
  })
})

describe('lo que el recorrido afirma sobre las oleadas', () => {
  const casos = [...casosDe(2023), ...casosDe(2024), ...casosDe(2025)]
  const calculado = contrastes(casos, RONDAS)
  const medida = (id) => calculado.medidas.find((m) => m.id === id)
  const entre = (id, desde, hasta) => medida(id).comparaciones.find((c) => c.desde === desde && c.hasta === hasta)

  it('entre 2023 y 2024 ningún país del termómetro se distingue del ruido', () => {
    for (const id of ['termometro-china', 'termometro-eeuu', 'termometro-corea', 'termometro-francia', 'termometro-japon']) {
      const c = entre(id, 2023, 2024)
      expect(c.p, `${id} 2023→2024 p=${c.p}`).toBeGreaterThan(0.1)
      expect(c.ic[0]).toBeLessThan(0)
      expect(c.ic[1]).toBeGreaterThan(0)
    }
  })

  it('en 2025 China sube y Estados Unidos baja, las dos por encima del ruido', () => {
    const china = entre('termometro-china', 2024, 2025)
    expect(china.diferencia).toBeGreaterThan(0)
    expect(china.p).toBeLessThan(0.01)
    expect(china.ic[0]).toBeGreaterThan(0)

    const eeuu = entre('termometro-eeuu', 2024, 2025)
    expect(eeuu.diferencia).toBeLessThan(0)
    expect(eeuu.p).toBeLessThan(0.01)
    expect(eeuu.ic[1]).toBeLessThan(0)
  })

  it('el alza de China es de opinión y no de quién contestó', () => {
    const china = entre('termometro-china', 2024, 2025)
    // La estandarizada por edad y sexo se queda a menos de un punto de la cruda.
    expect(Math.abs(china.estandarizada - china.diferencia)).toBeLessThan(1)
  })

  it('la brecha con Estados Unidos se da vuelta en 2025, y antes no se distinguía de cero', () => {
    const brecha = calculado.brechas.find((b) => b.id === 'brecha-china-eeuu')
    const en = (ola) => brecha.porOla.find((x) => x.ola === ola)
    expect(en(2023).ic[0]).toBeLessThan(0)
    expect(en(2023).ic[1]).toBeGreaterThan(0)
    expect(en(2025).diferencia).toBeGreaterThan(0)
    expect(en(2025).ic[0]).toBeGreaterThan(0)
    expect(en(2025).p).toBeLessThan(0.01)
  })

  it('el país que encabeza la serie lo hace por encima del ruido', () => {
    // La escena 1 dice «Japón encabeza las tres oleadas». Es la misma clase de afirmación que la
    // brecha con Estados Unidos y se contrasta igual: dentro de la misma persona.
    const brecha = calculado.brechas.find((b) => b.id === 'brecha-japon-china')
    for (const x of brecha.porOla) {
      expect(x.diferencia, `${x.ola}`).toBeGreaterThan(0)
      expect(x.ic[0], `${x.ola}`).toBeGreaterThan(0)
      expect(x.p, `${x.ola}`).toBeLessThan(0.01)
    }
  })

  it('la confianza en China sube más que la de Estados Unidos, y las dos suben', () => {
    const china = entre('confianza-china', 2023, 2025)
    const eeuu = entre('confianza-eeuu', 2023, 2025)
    expect(china.p).toBeLessThan(0.01)
    expect(china.diferencia).toBeGreaterThan(eeuu.diferencia)
    expect(eeuu.diferencia).toBeGreaterThan(0)
  })

  it('el no alineamiento cae, y lo que pierde se va a China', () => {
    const noAlineado = entre('no-alineamiento', 2023, 2025)
    expect(noAlineado.diferencia).toBeLessThan(0)
    expect(noAlineado.p).toBeLessThan(0.05)
    const proChina = entre('pro-china', 2023, 2025)
    expect(proChina.diferencia).toBeGreaterThan(0)
    expect(proChina.p).toBeLessThan(0.01)
  })

  it('el eje político no ordena la opinión sobre China en ninguna oleada', () => {
    // Es lo que afirman los dos pasos nuevos de la escena 1, y es lo contrario de lo que dice la
    // guía de ICLAC (`C17`): que hay un gradiente ideológico en 2023 que después se invierte. La
    // brecha entre izquierda y derecha existe como número en las tres oleadas, y en ninguna se
    // distingue del ruido.
    const grupo = calculado.grupos.find((g) => g.id === 'ideologia-china')
    expect(grupo.porOla).toHaveLength(3)
    for (const o of grupo.porOla) {
      expect(o.brecha, `${o.ola} sin brecha`).not.toBeNull()
      expect(o.brecha.p, `${o.ola} p=${o.brecha.p}`).toBeGreaterThan(0.05)
      expect(o.brecha.ic[0]).toBeLessThan(0)
      expect(o.brecha.ic[1]).toBeGreaterThan(0)
    }
  })

  it('las dos puntas suben, y eso sí pasa el contraste', () => {
    const grupo = calculado.grupos.find((g) => g.id === 'ideologia-china')
    const izquierda = grupo.entreOlas.find((e) => e.tramo === 'Izquierda' && e.desde === 2024 && e.hasta === 2025)
    const derecha = grupo.entreOlas.find((e) => e.tramo === 'Derecha' && e.desde === 2023 && e.hasta === 2025)
    for (const [nombre, e] of [['izquierda', izquierda], ['derecha', derecha]]) {
      expect(e, nombre).toBeDefined()
      expect(e.diferencia, nombre).toBeGreaterThan(0)
      expect(e.p, `${nombre} p=${e.p}`).toBeLessThan(0.05)
      expect(e.ic[0], nombre).toBeGreaterThan(0)
    }
  })

  it('la inclinación de 2023 la sostiene una celda chica, y sin ella se apaga', () => {
    // Es lo que afirman los cinco pasos del experimento de la escena 1. El día que una oleada
    // nueva haga que la pendiente sobreviva a sacar ese punto, la escena deja de tener sentido y
    // esta prueba lo dice.
    const r = calculado.regresiones.find((x) => x.id === 'ideologia-china')
    const primera = r.porOla.find((o) => o.ola === 2023)
    expect(primera.recta.p, 'la recta completa tiene pendiente').toBeLessThan(0.05)
    expect(primera.sostiene, 'hay un punto que la sostiene').not.toBeNull()
    expect(primera.sostiene.recta.p, 'sin ese punto, la pendiente se apaga').toBeGreaterThan(0.05)
    // Y es una celda chica: menos del 10 % de la muestra de esa oleada.
    const total = primera.puntos.reduce((s, q) => s + q.n, 0)
    expect(primera.sostiene.n / total).toBeLessThan(0.1)
  })

  it('ninguna oleada tiene pendiente una vez que se saca esa celda', () => {
    const r = calculado.regresiones.find((x) => x.id === 'ideologia-china')
    for (const o of r.porOla) {
      expect(o.sostiene, `${o.ola}`).not.toBeNull()
      expect(o.sostiene.recta.p, `${o.ola} p=${o.sostiene.recta.p}`).toBeGreaterThan(0.05)
    }
  })

  it('el artefacto declara el alcance de estos números', () => {
    expect(calculado.metodo.alcance).toMatch(/no es probabilística/)
    expect(calculado.metodo.alcance).toMatch(/no son margen de error/i)
  })
})
