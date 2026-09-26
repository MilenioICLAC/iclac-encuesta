import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { HISTORIAS } from './indice'
import { ContenidoTarjeta, RELLENO, RELLENO_MINI, TARJETA } from './TarjetaHistoria'
import { TransicionHistoria, type Eleccion } from './contextoTransicion'
import { CucharaPortada } from '../componentes/Sinan'

/**
 * Del menú a la portada de una historia, sin corte.
 *
 * 1. **Apilar:** las demás tarjetas se juntan bajo la elegida, con un desfase y un giro que crecen
 *    con la profundidad.
 * 2. **Centrar:** la pila va al centro de la pantalla.
 * 3. **Cubrir:** el fondo de la elegida crece hasta cubrir la pantalla de blanco; la etiqueta, el
 *    hallazgo y «Leer la historia» se desvanecen. **La pregunta se queda.**
 * 4. Se navega. La capa de la historia abre en su portada, debajo del blanco.
 * 5. **Titular:** la pregunta viaja hasta el título de la portada, **medido** en la capa ya
 *    montada, y toma su tamaño (fundido cruzado entre el estilo de la tarjeta y el de la portada:
 *    el corte de línea no es el mismo).
 *    **La cuchara del sinan va con ella:** sale de la tarjeta, donde se quedó cuando se apagó el
 *    resto, y llega bajo el título oscilando como una brújula que se asienta.
 * 6. El blanco se desvanece y aparece el resto de la portada alrededor del título, que no se mueve.
 * 7. **Dividir:** la cuchara se abre en tres y cada una se posa en su lugar: el ícono de scroll y
 *    los botones «Anterior» y «Siguiente» (girada para «Anterior»). En un teléfono no hay botones y
 *    va una sola. Es la entrada de las tarjetas al revés: allá muchas se juntan en una.
 *
 * Los tiempos de la cuchara salieron del laboratorio del viaje (25-09-2026).
 *
 * Inspirado en *Scroll Choreography* de componentry.dev, disparado por el clic y no por el scroll.
 *
 * **Vive fuera de las rutas** (`ProveedorTransicion`, en `App`): cruza el cambio de ruta, y dentro
 * del menú moriría con él. Corre sobre **copias fijas** en un portal sobre todo (`z-[60]`, encima
 * de la capa): la tarjeta real, creciendo dentro de la grilla, quedaba bajo el encabezado del
 * sitio y le abría scroll horizontal a la página.
 *
 * Solo `transform` y `opacity`. Con movimiento reducido no hay transición (el menú navega directo).
 * Atrás o `Escape` a mitad de camino la deshacen; un cambio de tamaño la abrevia (cubre, navega y
 * destapa) sin dejar el menú a la vista.
 */

export function ProveedorTransicion ({ children }: { children: React.ReactNode }) {
  const [eleccion, setEleccion] = useState<Eleccion | null>(null)
  // Una a la vez: un segundo clic durante la transición no la reemplaza.
  const iniciar = useCallback((e: Eleccion) => { setEleccion((actual) => actual ?? e) }, [])
  const terminar = useCallback(() => { setEleccion(null) }, [])

  /*
   * **El foco al volver al menú.** La capa devuelve el foco a donde estaba al abrirse, y ese era
   * el enlace de la tarjeta, que se desmontó al navegar: el foco caía en `body` y el tabulador
   * volvía a empezar desde el encabezado. El proveedor vive fuera de las rutas y ve pasar la ruta
   * anterior, así que sabe de qué historia se vuelve (Escape, «Volver a las historias», Atrás o
   * el cierre) y el menú enfoca esa tarjeta. Llegando de otra página no se fuerza nada.
   *
   * Se calcula en el render y no en un efecto: el menú lo necesita en su primer efecto.
   */
  const { pathname } = useLocation()
  const rutas = useRef({ actual: pathname, anterior: null as string | null })
  if (rutas.current.actual !== pathname) rutas.current = { actual: pathname, anterior: rutas.current.actual }
  const volviendoDe = pathname === '/'
    ? (/^\/historias\/([^/]+)/.exec(rutas.current.anterior ?? '')?.[1] ?? null)
    : null

  const valor = useMemo(
    () => ({ iniciar, enCurso: eleccion !== null, volviendoDe }),
    [iniciar, eleccion, volviendoDe],
  )
  return (
    <TransicionHistoria.Provider value={valor}>
      {children}
      {eleccion && <Transicion eleccion={eleccion} alTerminar={terminar} />}
    </TransicionHistoria.Provider>
  )
}

/** Duración de cada tramo, en milisegundos. */
const APILAR = 420
const CENTRAR = 340
const CUBRIR = 420
const TITULAR = 480
const DESTAPAR = 240
/** Escala de la elegida mientras está levantada. */
const ALZADA = 1.04
/** La división de la cuchara: espera tras destapar, vuelo, desfase entre las tres y relevo. */
const PAUSA = 150
const DIVIDIR = 450
const ESCALON = 60
const POSAR = 120
/** Cuánto queda la cuchara bajo el título, en píxeles. */
const BAJO_TITULO = 28

/**
 * Dónde está una cuchara del sinan en la pantalla: el centro y el largo de su dibujo (cuenco y
 * mango, sin el círculo). Con un giro de 180° el largo sigue siendo el alto de su caja.
 */
interface Cuchara { x: number, y: number, largo: number, giro: number }
function cucharaDe (svg: Element, giro = 0): Cuchara {
  const partes = [...svg.querySelectorAll('ellipse, path')].map((p) => p.getBoundingClientRect())
  const izquierda = Math.min(...partes.map((r) => r.left))
  const derecha = Math.max(...partes.map((r) => r.right))
  const arriba = Math.min(...partes.map((r) => r.top))
  const abajo = Math.max(...partes.map((r) => r.bottom))
  return { x: (izquierda + derecha) / 2, y: (arriba + abajo) / 2, largo: abajo - arriba, giro }
}

function geometria ({ indice, cajas }: Eleccion) {
  const elegida = cajas[indice]!
  const cx = elegida.left + elegida.width / 2
  const cy = elegida.top + elegida.height / 2
  // Las demás, de la más cercana a la más lejana: la cercana queda justo debajo de la elegida.
  // Desde el cierre no hay demás: la pila es de una.
  const orden = cajas
    .map((c, i) => ({ i, d: c ? Math.hypot(c.left + c.width / 2 - cx, c.top + c.height / 2 - cy) : Infinity }))
    .filter((x) => x.i !== indice && cajas[x.i])
    .sort((a, b) => a.d - b.d)
    .map((x) => x.i)
  return { indice, cajas, elegida, cx, cy, orden }
}

const t = (x: number, y: number, giro = 0, escala = 1) =>
  `translate(${x}px, ${y}px) rotate(${giro}deg) scale(${escala})`

function Transicion ({ eleccion, alTerminar }: { eleccion: Eleccion, alTerminar: () => void }) {
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const ruta = `/historias/${HISTORIAS[eleccion.indice].id}`
  // Dónde va: todavía en el menú, o ya en la historia (navegó en el tramo 4).
  const fase = useRef<'menu' | 'historia'>('menu')
  const terminar = useRef(alTerminar)
  terminar.current = alTerminar
  const navegarRef = useRef(navegar)
  navegarRef.current = navegar

  const lienzo = useRef<HTMLDivElement | null>(null)
  const copias = useRef<(HTMLDivElement | null)[]>([])
  const fondo = useRef<HTMLDivElement | null>(null)
  const titulo = useRef<HTMLDivElement | null>(null)
  // Las cucharas que viajan: la primera sale de la tarjeta; las otras dos nacen al dividirse.
  const viajeras = useRef<(HTMLDivElement | null)[]>([])
  const { indice, cajas, orden } = geometria(eleccion)

  // Atrás o `Escape` a mitad de camino: la ruta deja de ser la esperada y la transición se retira.
  // Antes de navegar se espera la de partida: el menú o la historia desde cuyo cierre se eligió.
  useEffect(() => {
    const esperada = fase.current === 'menu' ? eleccion.desde : ruta
    if (ubicacion.pathname !== esperada) terminar.current()
  }, [ubicacion.pathname, ruta, eleccion.desde])

  useLayoutEffect(() => {
    const { indice, cajas, elegida, cx, cy, orden } = geometria(eleccion)
    const animaciones: Animation[] = []
    let cuadro = 0
    let vigente = true
    const tramo = (el: Element | null | undefined, cuadros: Keyframe[], duracion: number, curva: string, retardo = 0) => {
      if (!el) return Promise.resolve()
      const a = el.animate(cuadros, { duration: duracion, delay: retardo, easing: curva, fill: 'forwards' })
      animaciones.push(a)
      return a.finished.then(() => undefined, () => undefined)
    }
    const salida = 'cubic-bezier(.2,.8,.2,1)'
    const suave = 'cubic-bezier(.65,0,.35,1)'
    // La división, más marcada que el resto: sale y llega con decisión (laboratorio del viaje).
    const FUERTE = 'cubic-bezier(.77,0,.175,1)'
    const centro = { x: window.innerWidth / 2 - cx, y: window.innerHeight / 2 - cy }
    // Lo justo para cubrir la pantalla desde el centro, con margen para que las esquinas
    // redondeadas queden afuera. El fondo está dentro de la copia, que ya va alzada.
    const cubrir = Math.max(window.innerWidth / elegida.width, window.innerHeight / elegida.height) * 1.2 / ALZADA

    const apilada = (i: number) => {
      const p = orden.indexOf(i) + 1
      const c = cajas[i]!
      const lado = p % 2 === 0 ? 1 : -1
      return {
        x: cx - (c.left + c.width / 2) + lado * 4 * p,
        y: cy - (c.top + c.height / 2) + 5 * p,
        giro: lado * (1.5 + 1.2 * p),
      }
    }

    const irALaHistoria = () => {
      fase.current = 'historia'
      // Los íconos donde se va a posar la cuchara esperan vacíos desde que la capa monta (ver
      // `index.css`). Recién acá: desde un cierre, antes vaciaría los botones de la historia de
      // partida, que están a la vista. Con un cambio de tamaño no hay viaje (`vigente` ya es falso).
      if (vigente) raiz.dataset.cucharaViaja = 'portada anterior siguiente'
      navegarRef.current(ruta)
    }

    // La capa de la historia a la que se va. Desde el cierre de otra historia, la de partida sigue
    // montada unos cuadros después de navegar: la de destino es la que no estaba al hacer clic.
    const previas = new Set(document.querySelectorAll('.capa-recorrido'))
    const capaDestino = () => [...document.querySelectorAll('.capa-recorrido')].find((c) => !previas.has(c)) ?? null
    const iconoDestino = () => capaDestino()?.querySelector('.portada-recorrido .cuchara-portada') ?? null

    // La cuchara que viaja, medida sin transformar: de ahí sale cuánto escalarla y dónde apoyarla
    // para que su dibujo quede exactamente sobre otro (medido en el laboratorio: 0 px de error).
    const svgViajera = viajeras.current[0]?.querySelector('svg')
    const base = svgViajera ? cucharaDe(svgViajera) : null
    const poner = (c: Cuchara) => base
      ? `translate(${c.x}px, ${c.y}px) rotate(${c.giro}deg) scale(${c.largo / base.largo}) translate(${-base.x}px, ${-base.y}px)`
      : 'none'
    // Dónde se anotan los íconos que esperan a la cuchara (se llena en `irALaHistoria`).
    const raiz = document.documentElement
    const posada = (clave: string) => {
      const quedan = (raiz.dataset.cucharaViaja ?? '').split(' ').filter((c) => c && c !== clave)
      if (quedan.length) raiz.dataset.cucharaViaja = quedan.join(' ')
      else delete raiz.dataset.cucharaViaja
    }
    // El vaivén del ícono de scroll: quieto en su punto de partida mientras la cuchara llega, para
    // medirlo sin él, y de vuelta desde ahí cuando se posa.
    const vaivenIcono = (icono: Element | null, correr: boolean) => {
      icono?.querySelector('.cuchara')?.getAnimations().forEach((a) => {
        a.currentTime = 0
        if (correr) a.play(); else a.pause()
      })
    }
    // Las copias siguen el vaivén donde lo dejó el menú: sin esto, la cuchara saltaba en el clic.
    if (eleccion.vaiven !== undefined) {
      copias.current.forEach((c) => {
        c?.querySelector('[data-cuchara] .cuchara')?.getAnimations().forEach((a) => { a.currentTime = eleccion.vaiven! })
      })
    }

    // Un cambio de tamaño invalida toda la geometría medida: se cubre la pantalla nueva de blanco
    // al instante, se navega si todavía no, y se destapa cuando la capa existe. Retirarse de
    // inmediato dejaba el menú a la vista 20 a 67 ms (medido por Codex, 22-09-2026): el router
    // aplica la navegación con menos prioridad que el estado de la transición, y no caen en el
    // mismo render. Las animaciones de duración cero se componen encima de las del camino.
    let desmontada = false
    // Destapada la portada, lo que queda es la división de la cuchara, que no tapa nada: el
    // teclado ya es de la capa (Tab no se bloquea más; hallazgo de Codex, 25-09-2026).
    let destapada = false
    const alRedimensionar = () => {
      if (!vigente) return
      vigente = false
      const ancho = window.innerWidth
      const alto = window.innerHeight
      const fijar = (el: Element | null | undefined, cuadro: Keyframe) => {
        if (el) animaciones.push(el.animate([cuadro, cuadro], { duration: 0, fill: 'forwards' }))
      }
      const elegidaCopia = copias.current[indice]
      fijar(elegidaCopia, { transform: t(ancho / 2 - cx, alto / 2 - cy, 0, ALZADA), opacity: 1 })
      fijar(fondo.current, { transform: `scale(${Math.max(ancho / elegida.width, alto / elegida.height) * 1.2 / ALZADA})` })
      elegidaCopia?.querySelectorAll('[data-pregunta], [data-desvanece], [data-cuchara]').forEach((el) => { fijar(el, { opacity: 0 }) })
      orden.forEach((i) => { fijar(copias.current[i], { opacity: 0 }) })
      fijar(titulo.current, { opacity: 0 })
      // Sin viaje: las cucharas se van y los íconos aparecen en su lugar.
      viajeras.current.forEach((v) => { fijar(v, { opacity: 0 }) })
      delete raiz.dataset.cucharaViaja
      vaivenIcono(iconoDestino(), true)
      fijar(lienzo.current, { opacity: 1 })
      if (fase.current === 'menu') irALaHistoria()
      const inicio = performance.now()
      const mirar = () => {
        if (desmontada) return
        if (capaDestino() || performance.now() - inicio > 1500) {
          void tramo(lienzo.current, [{ opacity: 1 }, { opacity: 0 }], DESTAPAR, 'ease-out')
            .then(() => { if (!desmontada) terminar.current() })
          return
        }
        cuadro = requestAnimationFrame(mirar)
      }
      cancelAnimationFrame(cuadro)
      cuadro = requestAnimationFrame(mirar)
    }
    window.addEventListener('resize', alRedimensionar)
    const alTeclear = (e: KeyboardEvent) => {
      // Las tarjetas salen del orden de Tab mientras dura, y el foco siguiente era el pie de
      // página: movía la página bajo las copias fijas.
      if (e.key === 'Tab' && !destapada) e.preventDefault()
      // `Escape` antes de navegar deshace la elección y deja el menú (o el cierre) como estaba, y
      // no sigue: desde un cierre, la capa de partida lo tomaría para salir al menú. Por eso se
      // escucha en captura. Después de navegar es de la capa, que sale al menú, y la transición se
      // retira sola (efecto de la ruta, arriba).
      if (e.key === 'Escape' && vigente && fase.current === 'menu') {
        e.stopPropagation()
        vigente = false
        terminar.current()
      }
      // Entre la navegación y el montaje de la capa nadie escucha `Escape` (medido: se perdía a
      // 40 ms de navegar). En ese hueco se hace lo que haría la capa: volver al menú.
      if (e.key === 'Escape' && fase.current === 'historia' && !capaDestino()) {
        navegarRef.current('/')
      }
    }
    document.addEventListener('keydown', alTeclear, true)

    // El título de la portada, cuando la capa ya lo dibujó y dejó de moverse (el imán lleva la
    // portada bajo la barra en los primeros cuadros).
    const esperarTitulo = () => new Promise<HTMLElement | null>((resolver) => {
      const inicio = performance.now()
      let anterior = Number.NaN
      let quieto = 0
      const mirar = () => {
        if (!vigente) { resolver(null); return }
        const h2 = capaDestino()?.querySelector<HTMLElement>('.pregunta-portada') ?? null
        if (h2) {
          const y = Math.round(h2.getBoundingClientRect().top)
          quieto = y === anterior ? quieto + 1 : 0
          anterior = y
        }
        if ((h2 && quieto >= 4) || performance.now() - inicio > 1500) { resolver(h2); return }
        cuadro = requestAnimationFrame(mirar)
      }
      cuadro = requestAnimationFrame(mirar)
    })

    const correr = async () => {
      // Dónde queda la cuchara bajo el título (tramo 5); sin portada medida, no hay división.
      let frente: Cuchara | null = null
      const copia = (i: number) => copias.current[i]
      const pregunta = copia(indice)?.querySelector<HTMLElement>('[data-pregunta]')

      // 1. Apilar.
      await Promise.all(cajas.map((c, i) => {
        if (!c) return Promise.resolve()
        if (i === indice) return tramo(copia(i), [{ transform: t(0, 0) }, { transform: t(0, 0, 0, ALZADA) }], APILAR, salida)
        const a = apilada(i)
        // Las más lejanas salen un poco después: la pila se arma de adentro hacia afuera.
        return tramo(copia(i), [{ transform: t(0, 0) }, { transform: t(a.x, a.y, a.giro, 0.96) }], APILAR, salida, orden.indexOf(i) * 30)
      }))
      if (!vigente) return

      // 2. Centrar.
      await Promise.all(cajas.map((c, i) => {
        if (!c) return Promise.resolve()
        if (i === indice) return tramo(copia(i), [{ transform: t(0, 0, 0, ALZADA) }, { transform: t(centro.x, centro.y, 0, ALZADA) }], CENTRAR, salida)
        const a = apilada(i)
        return tramo(copia(i), [{ transform: t(a.x, a.y, a.giro, 0.96) }, { transform: t(a.x + centro.x, a.y + centro.y, a.giro, 0.96) }], CENTRAR, salida)
      }))
      if (!vigente) return

      // 3. Cubrir: crece el fondo, no la tarjeta, y la pregunta se queda donde está.
      await Promise.all([
        tramo(fondo.current, [{ transform: 'scale(1)' }, { transform: `scale(${cubrir})` }], CUBRIR, suave),
        ...[...(copia(indice)?.querySelectorAll('[data-desvanece]') ?? [])].map((el) =>
          tramo(el, [{ opacity: 1 }, { opacity: 0 }], 200, 'ease-out')),
        ...orden.map((i) => tramo(copia(i), [{ opacity: 1 }, { opacity: 0 }], 200, 'ease-out', 120)),
      ])
      if (!vigente) return

      // 4. A la historia, que abre en su portada debajo del blanco.
      irALaHistoria()
      const h2 = await esperarTitulo()
      if (!vigente) return

      // 5. La pregunta viaja al título. El título de llegada copia el estilo calculado del de la
      //    portada y su ancho, así que corta las líneas igual que él y el relevo final no se ve.
      if (h2 && pregunta && titulo.current) {
        const destino = h2.getBoundingClientRect()
        const estilo = getComputedStyle(h2)
        const el = titulo.current
        Object.assign(el.style, {
          left: `${destino.left}px`,
          top: `${destino.top}px`,
          width: `${destino.width}px`,
          fontFamily: estilo.fontFamily,
          fontSize: estilo.fontSize,
          fontWeight: estilo.fontWeight,
          lineHeight: estilo.lineHeight,
          letterSpacing: estilo.letterSpacing,
          textAlign: estilo.textAlign,
          color: estilo.color,
        })
        // `text-balance`: sin él, el título de llegada corta las líneas distinto que el real.
        el.style.setProperty('text-wrap-style', estilo.getPropertyValue('text-wrap-style'))
        el.textContent = h2.textContent
        const origen = pregunta.getBoundingClientRect()
        const escala = parseFloat(getComputedStyle(pregunta).fontSize) * ALZADA / parseFloat(estilo.fontSize)
        const dx = (origen.left + origen.width / 2) - (destino.left + destino.width / 2)
        const dy = (origen.top + origen.height / 2) - (destino.top + destino.height / 2)

        // La cuchara deja la tarjeta y va bajo el título, del tamaño de la del ícono de scroll.
        // Pasa del sur y vuelve, cada vez menos, como una aguja que se asienta.
        const deTarjeta = copia(indice)?.querySelector<SVGElement>('[data-cuchara] svg')
        const icono = iconoDestino()
        const viajera = viajeras.current[0]
        if (deTarjeta && icono && viajera && base) {
          vaivenIcono(icono, false)
          const largo = cucharaDe(icono).largo
          frente = { x: destino.left + destino.width / 2, y: destino.bottom + BAJO_TITULO + largo / 2, largo, giro: 0 }
          const desde = cucharaDe(deTarjeta)
          deTarjeta.style.visibility = 'hidden'
          viajera.style.transform = poner(desde)
          viajera.style.opacity = '1'
          void tramo(viajera, [
            { transform: poner(desde) },
            { transform: poner({ ...frente, giro: -16 }), offset: 0.62 },
            { transform: poner({ ...frente, giro: 7 }), offset: 0.82 },
            { transform: poner(frente) },
          ], TITULAR, suave)
        }

        await Promise.all([
          // Un blur leve mientras las dos preguntas se cruzan: sin él se ven dos textos con cortes
          // de línea distintos, uno encima del otro; con él se leen como uno que cambia de forma.
          // Termina en cero: el tramo queda con `fill: 'forwards'`.
          tramo(el, [
            { transform: t(dx, dy, 0, escala), opacity: 0, filter: 'blur(2px)' },
            { opacity: 1, offset: 0.45, filter: 'blur(2px)' },
            { transform: t(0, 0), opacity: 1, filter: 'blur(0px)' },
          ], TITULAR, suave),
          // La pregunta de la tarjeta está dentro de la copia alzada: sus desplazamientos van en
          // la escala de la copia.
          tramo(pregunta, [
            { transform: t(0, 0), opacity: 1, filter: 'blur(0px)' },
            { opacity: 0, offset: 0.45, filter: 'blur(2px)' },
            { transform: t(-dx / ALZADA, -dy / ALZADA, 0, 1 / escala), opacity: 0, filter: 'blur(2px)' },
          ], TITULAR, suave),
        ])
        if (!vigente) return
      }

      // 6. Destapar. La cuchara no está en el lienzo: queda bajo el título.
      await tramo(lienzo.current, [{ opacity: 1 }, { opacity: 0 }], DESTAPAR, 'ease-out')
      if (!vigente) return
      destapada = true

      // 7. Dividir.
      if (frente) await dividir(frente)
      if (vigente) terminar.current()
    }

    /**
     * Una cuchara al ícono de scroll y una a cada botón que se vea (en un teléfono no hay). Las
     * destinos se miden al empezar: si el lector hace scroll a mitad de camino, se posan todas de
     * inmediato en vez de llegar a un lugar que ya se movió.
     */
    const dividir = async (frente: Cuchara) => {
      const capa = capaDestino()
      const icono = iconoDestino()
      if (!icono || !capa) return
      const botones = [...capa.querySelectorAll('.flechas-recorrido button')].filter((b) => b.getClientRects().length > 0)
      const destinos = [
        { clave: 'portada', el: icono, c: cucharaDe(icono), circulo: 0.3, color: getComputedStyle(icono).color },
        ...botones.map((b, i) => {
          const svg = b.querySelector('svg')!
          // «Anterior» es la misma cuchara girada: da media vuelta mientras vuela.
          return { clave: i === 0 ? 'anterior' : 'siguiente', el: svg, c: cucharaDe(svg, i === 0 ? 180 : 0), circulo: 0, color: getComputedStyle(b).color }
        }),
      ]
      // Las que no tienen destino (en un teléfono) no se usan.
      const sinUsar = new Set(['portada', 'anterior', 'siguiente'].filter((c) => !destinos.some((d) => d.clave === c)))
      sinUsar.forEach(posada)

      let cortada = false
      const cortar = () => {
        if (cortada) return
        cortada = true
        animaciones.forEach((a) => {
          const objetivo = (a.effect as KeyframeEffect | null)?.target
          if (objetivo && viajeras.current.some((v) => v?.contains(objetivo))) a.cancel()
        })
        viajeras.current.forEach((v) => { if (v) v.style.opacity = '0' })
        destinos.forEach((d) => { posada(d.clave) })
        vaivenIcono(icono, true)
      }
      capa.addEventListener('scroll', cortar, { passive: true, once: true })
      const color = getComputedStyle(viajeras.current[0]!).color

      await Promise.all(destinos.map(async (d, i) => {
        const v = viajeras.current[i]
        if (!v) return
        v.style.transform = poner(frente)
        v.style.opacity = '1'
        const retardo = PAUSA + i * ESCALON
        const circulo = v.querySelector('.circulo')
        await Promise.all([
          tramo(v, [{ transform: poner(frente), color }, { transform: poner(d.c), color: d.color }], DIVIDIR, FUERTE, retardo),
          tramo(circulo, [{ opacity: 0.3 }, { opacity: d.circulo }], DIVIDIR / 2, 'ease-out', retardo),
        ])
        if (!vigente || cortada) return
        // Se posa: aparece la de verdad debajo y la viajera se va.
        posada(d.clave)
        if (d.clave === 'portada') vaivenIcono(icono, true)
        await tramo(v, [{ opacity: 1 }, { opacity: 0 }], POSAR, 'ease-out')
      }))
      capa.removeEventListener('scroll', cortar)
    }
    void correr()

    return () => {
      vigente = false
      desmontada = true
      cancelAnimationFrame(cuadro)
      window.removeEventListener('resize', alRedimensionar)
      document.removeEventListener('keydown', alTeclear, true)
      animaciones.forEach((a) => { a.cancel() })
      // Se corte donde se corte (Atrás, `Escape`, un scroll), los íconos quedan en su lugar.
      delete raiz.dataset.cucharaViaja
      vaivenIcono(iconoDestino(), true)
    }
  }, [eleccion, ruta])

  return createPortal(
    <>
    <div ref={lienzo} aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      {cajas.map((c, i) => {
        // Desde el cierre solo está la elegida.
        if (!c) return null
        const h = HISTORIAS[i]
        const caja = {
          left: c.left,
          top: c.top,
          width: c.width,
          height: c.height,
          zIndex: i === indice ? cajas.length + 1 : cajas.length - orden.indexOf(i),
          willChange: 'transform',
        }
        if (i !== indice) {
          return (
            <div key={h.id} ref={(el) => { copias.current[i] = el }} className={`${TARJETA} absolute`} style={caja}>
              <ContenidoTarjeta h={h} i={i} />
            </div>
          )
        }
        // La elegida va en dos capas: el fondo, que crece hasta cubrir la pantalla, y el
        // contenido, que no crece. El borde transparente mantiene el texto donde lo deja el borde
        // de la tarjeta real.
        return (
          <div key={h.id} ref={(el) => { copias.current[i] = el }} className="absolute" style={caja}>
            <div ref={fondo} className="absolute inset-0 rounded-lg border border-gray-200 bg-white shadow-xl" />
            <div className={`relative flex h-full flex-col border border-transparent ${eleccion.mini ? RELLENO_MINI : RELLENO}`}>
              <ContenidoTarjeta h={h} i={i} mini={eleccion.mini} />
            </div>
          </div>
        )
      })}
      {/* El título de llegada: se posiciona y se llena al medir la portada (tramo 5). */}
      <div ref={titulo} className="absolute opacity-0" style={{ zIndex: cajas.length + 2 }} />
    </div>
    {/* Las cucharas que viajan, fuera del lienzo: siguen a la vista cuando el lienzo se destapa.
        Cada una se apoya en su esquina de arriba a la izquierda y la mueve `transform`. */}
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[61]">
      {[0, 1, 2].map((i) => (
        <div key={i} ref={(el) => { viajeras.current[i] = el }} className="absolute left-0 top-0 text-brand-dark opacity-0" style={{ transformOrigin: '0 0', willChange: 'transform' }}>
          <CucharaPortada clase="" />
        </div>
      ))}
    </div>
    </>,
    document.body,
  )
}
