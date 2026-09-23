import { describe, it, expect } from 'vitest'
import { bootstrap, estandarizada, generador, media, permutacion, permutacionPareada } from './lib/contraste.mjs'
import { contrastes, FAMILIAS, holm } from './lib/contrastes.mjs'
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

  it('en China se corre la escala entera, no solo la caja de arriba', () => {
    // La escena 2 muestra las cuatro categorías, así que lo que afirma no es «sube "mucha"» sino
    // que el reparto se desplaza: el lado que confía crece más que la sola punta de la escala.
    const arriba = entre('confianza-china', 2023, 2025)
    const confia = entre('confia-china', 2023, 2025)
    expect(confia.p).toBeLessThan(0.01)
    expect(confia.ic[0]).toBeGreaterThan(0)
    expect(confia.diferencia).toBeGreaterThan(arriba.diferencia)
  })

  it('Estados Unidos sube en 2024 y vuelve en 2025', () => {
    // La frase de la escena decía «no pierde confianza». Con «mucha o algo» eso es falso en el
    // último tramo: pierde 5,1 puntos por encima del ruido. Lo que sí se sostiene es que en el
    // balance de la serie no se distingue de cero.
    const sube = entre('confia-eeuu', 2023, 2024)
    expect(sube.diferencia).toBeGreaterThan(0)
    expect(sube.p).toBeLessThan(0.05)
    const vuelve = entre('confia-eeuu', 2024, 2025)
    expect(vuelve.diferencia).toBeLessThan(0)
    expect(vuelve.p).toBeLessThan(0.05)
    const serie = entre('confia-eeuu', 2023, 2025)
    expect(serie.p).toBeGreaterThan(0.05)
    expect(serie.ic[0]).toBeLessThan(0)
    expect(serie.ic[1]).toBeGreaterThan(0)
  })

  it('persona a persona, la ventaja de China crece a costa del empate y no de Estados Unidos', () => {
    const china = entre('mas-confianza-china', 2023, 2025)
    expect(china.diferencia).toBeGreaterThan(0)
    expect(china.p).toBeLessThan(0.01)
    expect(china.ic[0]).toBeGreaterThan(0)

    const empate = entre('empate-confianza', 2023, 2025)
    expect(empate.diferencia).toBeLessThan(0)
    expect(empate.p).toBeLessThan(0.01)
    expect(empate.ic[1]).toBeLessThan(0)

    // Y la caída del otro lado **no** pasa el contraste: por eso la frase dice que la ventaja sale
    // del empate. El día que Estados Unidos sí pierda por encima del ruido, esta prueba falla y la
    // frase se corrige en vez de quedar publicada.
    const eeuu = entre('mas-confianza-eeuu', 2023, 2025)
    expect(eeuu.p).toBeGreaterThan(0.05)
    expect(eeuu.ic[1]).toBeGreaterThan(0)
  })

  it('en la última oleada el balance de confianza se inclina hacia China', () => {
    // Dentro de la misma persona, igual que la brecha del termómetro: es lo que permite decir «le
    // confía más a China» sin elegir un umbral en una escala de cuatro categorías.
    const brecha = calculado.brechas.find((b) => b.id === 'brecha-confianza')
    const en = (ola) => brecha.porOla.find((x) => x.ola === ola)
    expect(en(2025).diferencia).toBeGreaterThan(0)
    expect(en(2025).ic[0]).toBeGreaterThan(0)
    expect(en(2025).p).toBeLessThan(0.01)
    // En 2024 el balance no se distingue de cero: el vuelco es del último año.
    expect(en(2024).p).toBeGreaterThan(0.05)
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

  /**
   * El titular de la escena 5 dice que en 2025 alinearse con China supera a alinearse con
   * Estados Unidos. Es una afirmación de tres partes y las tres se comprueban acá: que en las dos
   * primeras oleadas mandaba Estados Unidos, que en la última manda China, y que las tres pasan el
   * contraste. **Si una oleada nueva deja alguna sin sustento, esto falla antes de que la frase
   * quede publicada**, que es la única manera de que la regla se sostenga sola.
   *
   * La medida es la ventaja dentro de la persona, no la resta de dos porcentajes: `p26` es una
   * elección única, así que quien contesta «China» está a la vez no contestando «Estados Unidos».
   */
  it('el vuelco de p26 que afirma la escena 5 pasa el contraste en las tres oleadas', () => {
    const brecha = calculado.brechas.find((b) => b.id === 'ventaja-china-p26')
    expect(brecha, 'la brecha existe en el artefacto').toBeTruthy()
    expect(brecha.porOla.length, 'las tres oleadas tienen dato').toBe(3)

    const [primera, ...resto] = brecha.porOla
    const ultima = resto[resto.length - 1]

    // Las dos primeras, hacia Estados Unidos y por encima del ruido.
    for (const o of brecha.porOla.slice(0, -1)) {
      expect(o.diferencia, `${o.ola} favorece a Estados Unidos`).toBeLessThan(0)
      expect(o.ic[1], `${o.ola}: el intervalo no cruza el cero`).toBeLessThan(0)
      expect(o.p, `${o.ola} p=${o.p}`).toBeLessThan(0.05)
    }

    // La última, hacia China y también por encima del ruido: es el vuelco.
    expect(ultima.diferencia, 'la última favorece a China').toBeGreaterThan(0)
    expect(ultima.ic[0], 'la última: el intervalo no cruza el cero').toBeGreaterThan(0)
    expect(ultima.p, `última p=${ultima.p}`).toBeLessThan(0.05)

    // Y es un vuelco, no una oleada que sobresale: el signo cambia entre la primera y la última.
    expect(Math.sign(primera.diferencia)).not.toBe(Math.sign(ultima.diferencia))
  })

  /**
   * Lo que la escena **no** puede decir, y queda escrito para que nadie lo reponga: la caída del
   * no alineamiento. El agregado sí se mueve en la serie completa, pero **ninguna de sus dos
   * categorías se mueve sola en ninguna comparación**, así que el hallazgo dependía de sumarlas.
   * Ese era el guion viejo de la escena 5 y por eso salió.
   *
   * **Esta prueba consultaba solo el agregado** hasta el 09-09-2026, o sea que afirmaba en su
   * nombre algo más fuerte de lo que medía (lo encontró Codex revisando). Ahora `distancia-ambos`
   * y `relacionarse-ambos` existen como medidas propias y se comprueban las seis comparaciones.
   */
  it('ninguna de las dos categorías del no alineamiento se mueve por su cuenta', () => {
    const mitades = ['distancia-ambos', 'relacionarse-ambos']
    for (const id of mitades) {
      const m = calculado.medidas.find((x) => x.id === id)
      expect(m, `la medida ${id} existe`).toBeTruthy()
      expect(m.comparaciones.length, `${id}: las tres comparaciones`).toBe(3)
      for (const c of m.comparaciones) {
        expect(c.p, `${id} ${c.desde}→${c.hasta} p=${c.p}`).toBeGreaterThan(0.05)
        // El intervalo cruzando el cero es la otra cara de lo mismo, y es la que la figura usa.
        expect(c.ic[0] * c.ic[1], `${id} ${c.desde}→${c.hasta}: el intervalo cruza el cero`)
          .toBeLessThanOrEqual(0)
      }
    }
  })

  /**
   * Y el contraste que hace de esto un hallazgo y no una curiosidad: **la suma sí se mueve donde
   * las partes no**. Si una oleada nueva hiciera que alguna mitad se moviera sola, la de arriba
   * falla; si el agregado dejara de moverse, falla esta. Las dos juntas son la afirmación.
   */
  it('el no alineamiento sí cae en la serie completa, que es lo que las partes no explican', () => {
    const total = calculado.medidas.find((x) => x.id === 'no-alineamiento')
    const [primera] = total.comparaciones.filter((c) => c.hasta - c.desde > 1)
    expect(primera, 'la comparación de punta a punta existe').toBeTruthy()
    expect(primera.diferencia, 'cae').toBeLessThan(0)
    expect(primera.p, `serie completa p=${primera.p}`).toBeLessThan(0.05)
    // Y los tramos consecutivos, por separado, no se distinguen del ruido: la caída solo aparece
    // mirando las puntas, que es la otra mitad de por qué el guion viejo no se sostenía.
    for (const c of total.comparaciones.filter((x) => x.hasta - x.desde === 1)) {
      expect(c.p, `no alineamiento ${c.desde}→${c.hasta} p=${c.p}`).toBeGreaterThan(0.05)
    }
  })

  /**
   * La historia «China cotidiana», escenas 1 y 2.
   *
   * El arco es una comparación entre tres series del mismo bloque de ICLAC, y **la mitad de lo que
   * afirma es que algo no se mueve**. Eso es lo frágil: «parejo» no se prueba con un promedio, se
   * prueba con el intervalo cruzando el cero, y un día que la muestra crezca puede dejar de ser
   * cierto. Por eso las tres van juntas en una prueba: si el restaurante o el contacto empiezan a
   * moverse, la escena que los usa como contraste del mall deja de tener sentido y esto falla.
   *
   * La corrección por familia se comprueba acá misma, sobre las cuatro puntas de la historia
   * (mall, restaurante, contacto y racismo), con Holm. Sin eso, «el mall crece» sería un p sin
   * corregir elegido entre cuatro.
   */
  it('de la China cotidiana crece el mall, y el restaurante y el contacto quedan parejos', () => {
    const mall = entre('mall-cerca', 2023, 2025)
    expect(mall.diferencia, 'el mall crece').toBeGreaterThan(0)
    expect(mall.ic[0], 'el intervalo del mall no cruza el cero').toBeGreaterThan(0)
    // Y no es la composición de la muestra: con edad y sexo fijos queda a menos de un punto.
    expect(Math.abs(mall.estandarizada - mall.diferencia)).toBeLessThan(1)

    for (const id of ['restaurante-cerca', 'conoce-china']) {
      const punta = entre(id, 2023, 2025)
      expect(punta.ic[0] * punta.ic[1], `${id}: el intervalo cruza el cero, se dice «parejo»`).toBeLessThan(0)
    }
  })

  it('el mall sigue creciendo después de corregir por las cuatro puntas de la historia', () => {
    const familia = ['mall-cerca', 'restaurante-cerca', 'conoce-china', 'racismo-visto']
      .map((id) => ({ id, p: entre(id, 2023, 2025).p }))
      .sort((a, b) => a.p - b.p)
    // Holm: el i-ésimo p se compara contra alfa / (m - i), y ninguno puede bajar del anterior.
    let previo = 0
    const corregidos = familia.map((x, i) => {
      previo = Math.max(previo, Math.min(1, x.p * (familia.length - i)))
      return { id: x.id, corregido: previo }
    })
    const busca = (id) => corregidos.find((x) => x.id === id).corregido
    expect(busca('racismo-visto'), `racismo Holm=${busca('racismo-visto')}`).toBeLessThan(0.05)
    expect(busca('mall-cerca'), `mall Holm=${busca('mall-cerca')}`).toBeLessThan(0.05)
    for (const id of ['restaurante-cerca', 'conoce-china']) {
      expect(busca(id), `${id} Holm=${busca(id)}`).toBeGreaterThan(0.05)
    }
  })

  /**
   * La escena 3, que es la que era la historia de racismo reportado.
   *
   * La primera afirma una caída entre las puntas de la serie, y **viaja con una advertencia**: el
   * enunciado de `p18` no cambió, pero su lugar en el cuestionario sí, y año y contexto no se
   * pueden separar. Por eso acá no se prueba solo el número: se prueba que el aviso siga saliendo
   * del artefacto. Una escena que muestre esta cifra sin él es exactamente lo que estas pruebas
   * tienen que impedir.
   */
  it('el reporte de racismo cae entre las puntas de la serie', () => {
    const serie = entre('racismo-visto', 2023, 2025)
    expect(serie.diferencia, 'cae').toBeLessThan(0)
    expect(serie.p, `serie completa p=${serie.p}`).toBeLessThan(0.05)
    expect(serie.ic[1], 'el intervalo no cruza el cero').toBeLessThan(0)
    // Y no es la composición: con edad y sexo fijos queda a menos de un punto de la cruda.
    expect(Math.abs(serie.estandarizada - serie.diferencia)).toBeLessThan(1)
  })

  it('la cifra de racismo no se publica sin su advertencia de comparabilidad', () => {
    const medida = calculado.medidas.find((m) => m.id === 'racismo-visto')
    expect(medida.advertencia, 'la advertencia viaja con la medida').toBeTruthy()
    expect(medida.advertencia).toMatch(/fuentes de información/)
    expect(medida.advertencia).toMatch(/cuestionario/)
  })

  /**
   * La segunda escena. Es una comparación **dentro de una oleada**, así que el cambio de contexto
   * que arrastra la serie no la toca: los dos grupos llegaron a la pregunta por la misma
   * secuencia.
   *
   * **La diferencia aparece en las tres oleadas**, no solo en 2025 (2023: +7,3, p 0,020; 2024:
   * +6,2, p 0,032). Lo que distingue a 2025 es que es la única que sobrevive a corregir por las
   * quince pruebas de la familia declarada en la revisión del 17-09-2026; este archivo no corrige
   * por familia, así que acá se prueba lo que sí depende solo de los datos: misma dirección en las
   * tres, y en 2025 una diferencia que ninguna de las otras alcanza. Por eso la escena dice «en
   * 2025» y no «siempre».
   */
  it('quien conoce personalmente a alguien de China reporta más, y en 2025 es donde más se separa', () => {
    const grupo = calculado.grupos.find((g) => g.id === 'racismo-contacto')
    const en = (ola) => grupo.porOla.find((x) => x.ola === ola).brecha
    for (const ola of [2023, 2024, 2025]) {
      expect(en(ola).diferencia, `${ola}: quien conoce reporta más`).toBeGreaterThan(0)
    }
    expect(en(2025).p, `2025 p=${en(2025).p}`).toBeLessThan(0.01)
    expect(en(2025).ic[0], 'el intervalo de 2025 no cruza el cero').toBeGreaterThan(0)
    // Y la de 2025 es la más ancha de las tres: la que aguanta la corrección por familia.
    for (const ola of [2023, 2024]) {
      expect(en(2025).diferencia, `2025 contra ${ola}`).toBeGreaterThan(en(ola).diferencia)
      expect(en(ola).p, `${ola} p=${en(ola).p}`).toBeGreaterThan(en(2025).p)
    }
  })

  it('el artefacto declara el alcance de estos números', () => {
    expect(calculado.metodo.alcance).toMatch(/no es probabilística/)
    expect(calculado.metodo.alcance).toMatch(/no son margen de error/i)
  })
})

/**
 * **Las hipótesis de la guía de contexto de ICLAC (02-09-2026), una familia por bloque.**
 *
 * Cada familia se declaró antes de correr los contrastes (registro en
 * `la documentación interna`), y la historia de su bloque afirma
 * solo lo que sobrevive a Holm dentro de ella. Lo que cae se prueba también: una historia que
 * dijera lo contrario el día que entre una oleada nueva tiene que hacer fallar esto.
 */
describe('las hipótesis de la guía, bloque por bloque', () => {
  const casos = [...casosDe(2023), ...casosDe(2024), ...casosDe(2025)]
  const calculado = contrastes(casos, RONDAS)
  const medida = (id) => calculado.medidas.find((m) => m.id === id)
  const entre = (id, desde, hasta) => medida(id).comparaciones.find((c) => c.desde === desde && c.hasta === hasta)
  const brecha = (id, ola) => calculado.brechas.find((b) => b.id === id).porOla.find((x) => x.ola === ola)
  const grupo = (id, ola) => calculado.grupos.find((g) => g.id === id).porOla.find((x) => x.ola === ola)

  /** Holm sobre una familia `{ clave: p }`: devuelve los p corregidos con la misma clave. */
  const holm = (familia) => {
    const orden = Object.entries(familia).sort((a, b) => a[1] - b[1])
    let previo = 0
    return Object.fromEntries(orden.map(([k, p], i) => {
      previo = Math.max(previo, Math.min(1, p * (orden.length - i)))
      return [k, previo]
    }))
  }

  it('bloque 1: en 2025 China queda sobre Estados Unidos, Japón encabeza y la opinión no se polariza', () => {
    const h = holm({
      cruce: brecha('brecha-china-eeuu', 2025).p,
      japon: brecha('brecha-japon-china', 2025).p,
      gradiente: grupo('ideologia-china', 2023).brecha.p,
      polarizacion: entre('dispersion-china', 2023, 2025).p,
    })
    expect(brecha('brecha-china-eeuu', 2025).diferencia).toBeGreaterThan(0)
    expect(h.cruce).toBeLessThan(0.05)
    expect(h.japon).toBeLessThan(0.05)
    // En 2023 los dos países estaban parejos, no «Estados Unidos arriba».
    const b23 = brecha('brecha-china-eeuu', 2023)
    expect(b23.ic[0] * b23.ic[1], 'en 2023 parejos').toBeLessThan(0)
    expect(h.polarizacion, `polarización Holm=${h.polarizacion}`).toBeGreaterThan(0.05)
  })

  it('bloque 2: la confianza en China crece, la de Estados Unidos queda pareja, el no alineamiento cae y la minoría se da vuelta', () => {
    const h = holm({
      china: entre('confia-china', 2023, 2025).p,
      eeuu: entre('confia-eeuu', 2023, 2025).p,
      noAlineamiento: entre('no-alineamiento', 2023, 2025).p,
      vuelco: brecha('ventaja-china-p26', 2025).p,
    })
    expect(entre('confia-china', 2023, 2025).diferencia).toBeGreaterThan(0)
    expect(h.china).toBeLessThan(0.05)
    expect(h.eeuu, `EE. UU. Holm=${h.eeuu}`).toBeGreaterThan(0.05)
    // La guía dice que el no alineamiento no se movió: cae, y sobrevive a la corrección.
    expect(entre('no-alineamiento', 2023, 2025).diferencia).toBeLessThan(0)
    expect(h.noAlineamiento, `no alineamiento Holm=${h.noAlineamiento}`).toBeLessThan(0.05)
    expect(brecha('ventaja-china-p26', 2025).diferencia).toBeGreaterThan(0)
    expect(h.vuelco).toBeLessThan(0.05)
  })

  it('bloque 3: ni la exposición de la región ni el rol de China en la comuna sostienen una afirmación', () => {
    const h = holm({
      estrato: grupo('riesgo-estrato', 2023).brecha.p,
      proveedor: entre('p8-proveedor', 2023, 2025).p,
      inversor: entre('p8-inversor', 2023, 2025).p,
    })
    for (const [k, p] of Object.entries(h)) expect(p, `${k} Holm=${p}`).toBeGreaterThan(0.05)
    // Y el estrato no ordena el riesgo en ninguna oleada, corrigiendo por las tres.
    const porOla = holm(Object.fromEntries([2023, 2024, 2025].map((o) => [o, grupo('riesgo-estrato', o).brecha.p])))
    for (const [o, p] of Object.entries(porOla)) expect(p, `estrato ${o} Holm=${p}`).toBeGreaterThan(0.05)
  })

  it('palabras de las respuestas abiertas: familia exploratoria de cuatro, con Holm', () => {
    // Fijada el 22-09-2026 después de ver las frecuencias. Cada palabra, entre su primera y su
    // última oleada; «buena» solo existe en 2024 y 2025.
    const h = holm({
      trump: entre('palabra-trump', 2023, 2025).p,
      tecnologia: entre('palabra-tecnologia', 2023, 2025).p,
      mall: entre('palabra-mall', 2023, 2025).p,
      buena: entre('palabra-buena', 2024, 2025).p,
    })
    // Solo «Trump» sobrevive, y su salto está entero entre 2024 y 2025. «Tecnología» tiene p nominal
    // bajo 0,05 pero no pasa la corrección: la historia no puede decir que sube.
    expect(h.trump).toBeLessThan(0.05)
    expect(entre('palabra-trump', 2024, 2025).ic[0]).toBeGreaterThan(0)
    expect(entre('palabra-trump', 2023, 2024).ic[0]).toBeLessThan(0)
    for (const k of ['tecnologia', 'mall', 'buena']) expect(h[k], `${k} Holm=${h[k]}`).toBeGreaterThan(0.05)
    for (const id of ['palabra-trump', 'palabra-tecnologia', 'palabra-mall', 'palabra-buena']) {
      expect(medida(id).advertencia).toMatch(/exploratorio/)
    }
  })

  it('bloque 3: «proveedor» es la respuesta más frecuente en las tres oleadas, contra cada una de las otras', () => {
    const h = holm(Object.fromEntries(['inversor', 'comprador', 'competidor'].flatMap((k) =>
      [2023, 2024, 2025].map((o) => [`${k}-${o}`, brecha(`p8-proveedor-sobre-${k}`, o).p]))))
    for (const k of ['inversor', 'comprador', 'competidor']) {
      for (const o of [2023, 2024, 2025]) expect(brecha(`p8-proveedor-sobre-${k}`, o).diferencia).toBeGreaterThan(0)
    }
    for (const [k, p] of Object.entries(h)) expect(p, `${k} Holm=${p}`).toBeLessThan(0.05)
  })

  it('bloque 3: la pregunta del riesgo se lee entera, y el desacuerdo le gana al acuerdo', () => {
    // Las tres partes de `p7` quedan parejas entre oleadas...
    for (const id of ['riesgo-desacuerdo', 'riesgo-indiferente', 'riesgo-comuna']) {
      for (const c of medida(id).comparaciones) expect(c.ic[0] * c.ic[1], `${id} ${c.desde}→${c.hasta} cruza el cero`).toBeLessThan(0)
    }
    // ...y en cada oleada hay más desacuerdo que acuerdo, comparado dentro de la persona.
    const h = holm(Object.fromEntries([2023, 2024, 2025].map((o) => [o, brecha('riesgo-desacuerdo-sobre-acuerdo', o).p])))
    for (const o of [2023, 2024, 2025]) {
      expect(brecha('riesgo-desacuerdo-sobre-acuerdo', o).diferencia).toBeGreaterThan(0)
      expect(h[o], `${o} Holm=${h[o]}`).toBeLessThan(0.05)
    }
    // Y el nivel de exposición tampoco ordena ese neto en ninguna oleada.
    const porNivel = holm(Object.fromEntries([2023, 2024, 2025].map((o) => [o, grupo('riesgo-neto-exposicion', o).brecha.p])))
    for (const [o, p] of Object.entries(porNivel)) expect(p, `neto por nivel ${o} Holm=${p}`).toBeGreaterThan(0.05)
  })

  it('bloque 3: el riesgo que se ve en China no se mueve y ronda tres de cada diez', () => {
    for (const [a, b] of [[2023, 2024], [2024, 2025], [2023, 2025]]) {
      const c = entre('riesgo-comuna', a, b)
      expect(c.ic[0] * c.ic[1], `${a}→${b} cruza el cero`).toBeLessThan(0)
    }
    for (const c of medida('riesgo-comuna').comparaciones) {
      for (const v of [c.a, c.b]) expect(v >= 25 && v < 35, `${v} redondea a tres de cada diez`).toBe(true)
    }
  })

  it('bloque 4: la mayoría que quiere poder limitar inversiones estratégicas no se mueve', () => {
    for (const [a, b] of [[2023, 2024], [2024, 2025], [2023, 2025]]) {
      const c = entre('limitar-inversiones', a, b)
      expect(c.ic[0] * c.ic[1], `${a}→${b} cruza el cero`).toBeLessThan(0)
    }
    for (const c of medida('limitar-inversiones').comparaciones) expect(c.a).toBeGreaterThan(70)
    expect(medida('limitar-inversiones').advertencia).toMatch(/experimental/)
    // Los tres sectores más marcados son cobre, litio y distribución eléctrica: el tercero le gana
    // al cuarto (la banca) en las dos oleadas en que se preguntó, corrigiendo por las dos.
    const podio = holm({ 2023: brecha('electrica-sobre-banca', 2023).p, 2024: brecha('electrica-sobre-banca', 2024).p })
    for (const ola of [2023, 2024]) {
      expect(brecha('electrica-sobre-banca', ola).diferencia).toBeGreaterThan(0)
      expect(podio[ola], `eléctrica sobre banca ${ola} Holm=${podio[ola]}`).toBeLessThan(0.05)
    }
  })

  it('bloque 5, complemento: quien sabía que los buses son chinos evalúa mejor la electrificación', () => {
    const b = grupo('buses-sabia', 2025).brecha
    expect(b.diferencia).toBeGreaterThan(0)
    expect(b.p).toBeLessThan(0.05)
    // Solo 2025: en las otras oleadas no se preguntó, y el grupo no inventa una comparación.
    expect(grupo('buses-sabia', 2023).brecha).toBeNull()
  })

  it('bloque 6: el recuerdo de la vacuna se mantiene y la buena opinión de quienes la recibieron cae', () => {
    const recibio = entre('sinovac-recibio', 2023, 2025)
    expect(recibio.ic[0] * recibio.ic[1], 'recuerdo parejo').toBeLessThan(0)
    const h = holm({
      opinion: entre('sinovac-buena', 2023, 2025).p,
      pfizer: entre('prefiere-pfizer', 2023, 2025).p,
    })
    expect(entre('sinovac-buena', 2023, 2025).diferencia).toBeLessThan(0)
    expect(h.opinion, `opinión Holm=${h.opinion}`).toBeLessThan(0.05)
    expect(h.pfizer).toBeGreaterThan(0.05)
    // Toda la caída está en el primer tramo: entre 2024 y 2025 no se mueve.
    const segundo = entre('sinovac-buena', 2024, 2025)
    expect(segundo.ic[0] * segundo.ic[1]).toBeLessThan(0)
    // Y no es la base: la medida solo cuenta a quienes recibieron Sinovac, así que 2023 y 2025
    // comparan a la misma clase de persona. Sin fijarla la caída se duplicaba.
    expect(Math.abs(entre('sinovac-buena', 2023, 2025).diferencia)).toBeLessThan(15)
  })
})

/**
 * **Holm vive en el ETL** (Felipe, 23-09-2026): las historias y «Sobre los datos» leen el p corregido
 * del artefacto. Esto fija qué pruebas forman cada familia, tal como se declararon arriba, y que el
 * número que trae el artefacto es el Holm de esas pruebas y no otro. Si alguien cambia una familia
 * en `scripts/lib/contrastes.mjs` sin cambiar su registro, falla acá.
 */
describe('las familias de Holm que trae el artefacto', () => {
  const casos = [...casosDe(2023), ...casosDe(2024), ...casosDe(2025)]
  const calculado = contrastes(casos, RONDAS)
  const DECLARADAS = {
    'guia-bloque-1': ['brecha brecha-china-eeuu 2025', 'brecha brecha-japon-china 2025', 'grupo ideologia-china 2023', 'medida dispersion-china 2023-2025'],
    'guia-bloque-2': ['medida confia-china 2023-2025', 'medida confia-eeuu 2023-2025', 'medida no-alineamiento 2023-2025', 'brecha ventaja-china-p26 2025'],
    'guia-bloque-3': ['grupo riesgo-estrato 2023', 'medida p8-proveedor 2023-2025', 'medida p8-inversor 2023-2025'],
    'estrato-por-oleada': ['grupo riesgo-estrato 2023', 'grupo riesgo-estrato 2024', 'grupo riesgo-estrato 2025'],
    'proveedor-primero': ['inversor', 'comprador', 'competidor'].flatMap((r) => [2023, 2024, 2025].map((o) => `brecha p8-proveedor-sobre-${r} ${o}`)),
    'neto-por-oleada': [2023, 2024, 2025].map((o) => `brecha riesgo-desacuerdo-sobre-acuerdo ${o}`),
    'neto-por-nivel': [2023, 2024, 2025].map((o) => `grupo riesgo-neto-exposicion ${o}`),
    'electrica-sobre-banca': ['brecha electrica-sobre-banca 2023', 'brecha electrica-sobre-banca 2024'],
    cotidiana: ['mall-cerca', 'restaurante-cerca', 'conoce-china', 'racismo-visto'].map((id) => `medida ${id} 2023-2025`),
    'guia-bloque-6': ['medida sinovac-buena 2023-2025', 'medida prefiere-pfizer 2023-2025'],
    palabras: ['medida palabra-trump 2023-2025', 'medida palabra-tecnologia 2023-2025', 'medida palabra-mall 2023-2025', 'medida palabra-buena 2024-2025'],
  }
  const nombrar = (p) => (p.tipo === 'medida' ? `medida ${p.id} ${p.desde}-${p.hasta}` : `${p.tipo} ${p.id} ${p.ola}`)
  const objeto = (clave) => {
    const [tipo, id, cuando] = clave.split(' ')
    if (tipo === 'medida') {
      const [desde, hasta] = cuando.split('-').map(Number)
      return calculado.medidas.find((m) => m.id === id).comparaciones.find((c) => c.desde === desde && c.hasta === hasta)
    }
    if (tipo === 'brecha') return calculado.brechas.find((b) => b.id === id).porOla.find((o) => o.ola === Number(cuando))
    return calculado.grupos.find((g) => g.id === id).porOla.find((o) => o.ola === Number(cuando)).brecha
  }
  /** Holm escrito de nuevo, a propósito: si el del ETL se rompe, este no se rompe con él. */
  const holmAparte = (ps) => {
    const orden = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0])
    const salida = []
    let previo = 0
    orden.forEach(([p, i], k) => { previo = Math.max(previo, Math.min(1, p * (ps.length - k))); salida[i] = previo })
    return salida
  }

  it('las familias del ETL son las declaradas, prueba por prueba', () => {
    expect(Object.fromEntries(FAMILIAS.map((f) => [f.id, f.pruebas.map(nombrar)]))).toEqual(DECLARADAS)
    expect(calculado.familias.map((f) => f.id)).toEqual(Object.keys(DECLARADAS))
  })

  it('cada prueba trae el Holm de su familia', () => {
    for (const [familia, claves] of Object.entries(DECLARADAS)) {
      const objetos = claves.map(objeto)
      const esperado = holmAparte(objetos.map((o) => o.p))
      objetos.forEach((o, i) => {
        const h = o.holm.find((x) => x.familia === familia)
        expect(h, `${familia}: ${claves[i]}`).toBeDefined()
        expect(h.p).toBeCloseTo(esperado[i], 12)
      })
    }
  })

  it('fuera de las familias, ninguna prueba trae corrección', () => {
    const conHolm = [
      ...calculado.medidas.flatMap((m) => m.comparaciones.filter((c) => c.holm).map((c) => `medida ${m.id} ${c.desde}-${c.hasta}`)),
      ...calculado.brechas.flatMap((b) => b.porOla.filter((o) => o.holm).map((o) => `brecha ${b.id} ${o.ola}`)),
      ...calculado.grupos.flatMap((g) => g.porOla.filter((o) => o.brecha?.holm).map((o) => `grupo ${g.id} ${o.ola}`)),
    ]
    expect(new Set(conHolm)).toEqual(new Set(Object.values(DECLARADAS).flat()))
  })

  it('holm() del ETL coincide con el cálculo a mano en un caso conocido', () => {
    // p = 0,01, 0,04, 0,03 → ordenados 0,01×3, 0,03×2, 0,04×1 = 0,03, 0,06, 0,06 (no baja del anterior).
    const r = holm([0.01, 0.04, 0.03])
    expect(r[0]).toBeCloseTo(0.03, 12)
    expect(r[2]).toBeCloseTo(0.06, 12)
    expect(r[1]).toBeCloseTo(0.06, 12)
  })
})
