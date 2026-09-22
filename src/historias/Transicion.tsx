import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { HISTORIAS } from './indice'
import { ContenidoTarjeta, TARJETA } from './TarjetaHistoria'
import { TransicionHistoria, type Eleccion } from './contextoTransicion'

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
 * 6. El blanco se desvanece y aparece el resto de la portada alrededor del título, que no se mueve.
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

function geometria ({ indice, cajas }: Eleccion) {
  const elegida = cajas[indice]
  const cx = elegida.left + elegida.width / 2
  const cy = elegida.top + elegida.height / 2
  // Las demás, de la más cercana a la más lejana: la cercana queda justo debajo de la elegida.
  const orden = cajas
    .map((c, i) => ({ i, d: Math.hypot(c.left + c.width / 2 - cx, c.top + c.height / 2 - cy) }))
    .filter((x) => x.i !== indice)
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
  const { indice, cajas, orden } = geometria(eleccion)

  // Atrás o `Escape` a mitad de camino: la ruta deja de ser la esperada y la transición se retira.
  useEffect(() => {
    const esperada = fase.current === 'menu' ? '/' : ruta
    if (ubicacion.pathname !== esperada) terminar.current()
  }, [ubicacion.pathname, ruta])

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
    const centro = { x: window.innerWidth / 2 - cx, y: window.innerHeight / 2 - cy }
    // Lo justo para cubrir la pantalla desde el centro, con margen para que las esquinas
    // redondeadas queden afuera. El fondo está dentro de la copia, que ya va alzada.
    const cubrir = Math.max(window.innerWidth / elegida.width, window.innerHeight / elegida.height) * 1.2 / ALZADA

    const apilada = (i: number) => {
      const p = orden.indexOf(i) + 1
      const c = cajas[i]
      const lado = p % 2 === 0 ? 1 : -1
      return {
        x: cx - (c.left + c.width / 2) + lado * 4 * p,
        y: cy - (c.top + c.height / 2) + 5 * p,
        giro: lado * (1.5 + 1.2 * p),
      }
    }

    const irALaHistoria = () => {
      fase.current = 'historia'
      navegarRef.current(ruta)
    }

    // Un cambio de tamaño invalida toda la geometría medida: se cubre la pantalla nueva de blanco
    // al instante, se navega si todavía no, y se destapa cuando la capa existe. Retirarse de
    // inmediato dejaba el menú a la vista 20 a 67 ms (medido por Codex, 22-09-2026): el router
    // aplica la navegación con menos prioridad que el estado de la transición, y no caen en el
    // mismo render. Las animaciones de duración cero se componen encima de las del camino.
    let desmontada = false
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
      elegidaCopia?.querySelectorAll('[data-pregunta], [data-desvanece]').forEach((el) => { fijar(el, { opacity: 0 }) })
      orden.forEach((i) => { fijar(copias.current[i], { opacity: 0 }) })
      fijar(titulo.current, { opacity: 0 })
      fijar(lienzo.current, { opacity: 1 })
      if (fase.current === 'menu') irALaHistoria()
      const inicio = performance.now()
      const mirar = () => {
        if (desmontada) return
        if (document.querySelector('.capa-recorrido') || performance.now() - inicio > 1500) {
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
      if (e.key === 'Tab') e.preventDefault()
      // `Escape` antes de navegar deshace la elección y deja el menú como estaba. Después es de
      // la capa, que sale al menú, y la transición se retira sola (efecto de la ruta, arriba).
      if (e.key === 'Escape' && vigente && fase.current === 'menu') {
        vigente = false
        terminar.current()
      }
      // Entre la navegación y el montaje de la capa nadie escucha `Escape` (medido: se perdía a
      // 40 ms de navegar). En ese hueco se hace lo que haría la capa: volver al menú.
      if (e.key === 'Escape' && fase.current === 'historia' && !document.querySelector('.capa-recorrido')) {
        navegarRef.current('/')
      }
    }
    document.addEventListener('keydown', alTeclear)

    // El título de la portada, cuando la capa ya lo dibujó y dejó de moverse (el imán lleva la
    // portada bajo la barra en los primeros cuadros).
    const esperarTitulo = () => new Promise<HTMLElement | null>((resolver) => {
      const inicio = performance.now()
      let anterior = Number.NaN
      let quieto = 0
      const mirar = () => {
        if (!vigente) { resolver(null); return }
        const h2 = document.querySelector<HTMLElement>('.capa-recorrido .pregunta-portada')
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
      const copia = (i: number) => copias.current[i]
      const pregunta = copia(indice)?.querySelector<HTMLElement>('[data-pregunta]')

      // 1. Apilar.
      await Promise.all(cajas.map((_, i) => {
        if (i === indice) return tramo(copia(i), [{ transform: t(0, 0) }, { transform: t(0, 0, 0, ALZADA) }], APILAR, salida)
        const a = apilada(i)
        // Las más lejanas salen un poco después: la pila se arma de adentro hacia afuera.
        return tramo(copia(i), [{ transform: t(0, 0) }, { transform: t(a.x, a.y, a.giro, 0.96) }], APILAR, salida, orden.indexOf(i) * 30)
      }))
      if (!vigente) return

      // 2. Centrar.
      await Promise.all(cajas.map((_, i) => {
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
        await Promise.all([
          tramo(el, [
            { transform: t(dx, dy, 0, escala), opacity: 0 },
            { opacity: 1, offset: 0.45 },
            { transform: t(0, 0), opacity: 1 },
          ], TITULAR, suave),
          // La pregunta de la tarjeta está dentro de la copia alzada: sus desplazamientos van en
          // la escala de la copia.
          tramo(pregunta, [
            { transform: t(0, 0), opacity: 1 },
            { opacity: 0, offset: 0.45 },
            { transform: t(-dx / ALZADA, -dy / ALZADA, 0, 1 / escala), opacity: 0 },
          ], TITULAR, suave),
        ])
        if (!vigente) return
      }

      // 6. Destapar.
      await tramo(lienzo.current, [{ opacity: 1 }, { opacity: 0 }], DESTAPAR, 'ease-out')
      if (vigente) terminar.current()
    }
    void correr()

    return () => {
      vigente = false
      desmontada = true
      cancelAnimationFrame(cuadro)
      window.removeEventListener('resize', alRedimensionar)
      document.removeEventListener('keydown', alTeclear)
      animaciones.forEach((a) => { a.cancel() })
    }
  }, [eleccion, ruta])

  return createPortal(
    <div ref={lienzo} aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      {cajas.map((c, i) => {
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
            <div className="relative flex h-full flex-col border border-transparent p-5">
              <ContenidoTarjeta h={h} i={i} />
            </div>
          </div>
        )
      })}
      {/* El título de llegada: se posiciona y se llena al medir la portada (tramo 5). */}
      <div ref={titulo} className="absolute opacity-0" style={{ zIndex: cajas.length + 2 }} />
    </div>,
    document.body,
  )
}
