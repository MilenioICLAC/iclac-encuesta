import type React from 'react'
import { useEffect, useState } from 'react'
import { textoExplorador as t } from '../nucleo/explorador'
import RotuloFigura from './RotuloFigura'

/**
 * Gráfico de puntos: una fila por entidad, un punto por grupo sobre esa misma fila.
 *
 * **Es la figura de comparación del producto**, y vive acá y no dentro de quien la usa porque
 * ya tiene dos usos (las palabras de las respuestas abiertas y el termómetro de los cinco
 * países) y todo su valor está en detalles de layout que se pagan una vez: los márgenes del
 * lienzo, el rótulo que despeja el punto, y el apilado en pantalla angosta. Copiada, las dos
 * copias derivan.
 *
 * **Por qué puntos y no líneas ni barras.** Con tres oleadas, una línea promete interpolación
 * que no existe: son tres encuestas sueltas, no un valor continuo muestreado. Y con varias
 * entidades a la vez las líneas se cruzan y el color tiene que distinguir todos los pares
 * contra todos, que es el caso donde la paleta validada topa en tres (un registro de decisiones interno). Con los
 * puntos en la fila de la entidad, la distancia entre ellos es el cambio y el nombre de la
 * fila carga la identidad.
 */

/** Margen en px a cada lado del lienzo: sin él, un punto en el mínimo o el máximo de la escala
 *  sale cortado por la mitad (se posiciona por su centro) y su rótulo se pierde fuera de la
 *  tarjeta. Es el mismo desborde que ya se pagó en las figuras de ideología. */
const MARGEN = 38
const PUNTO = 10
const ALTO_FILA = 22
/** Separación mínima entre el punto más chico y el más grande, en porcentaje del lienzo, para
 *  rotular los dos extremos. Bajo eso los dos rótulos se pisan y va solo el del máximo. */
const SEPARACION_MINIMA = 22

/**
 * Ancho en px de un rótulo de punto, medido con la familia que de verdad lo pinta (la del lienzo,
 * a 10 px); si no hay `canvas`, estimado.
 */
let medidor: CanvasRenderingContext2D | null | undefined
function anchoRotulo (texto: string, familia: string): number {
  if (medidor === undefined) {
    medidor = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d')
  }
  if (!medidor) return texto.length * 6.5
  medidor.font = `10px ${familia || 'sans-serif'}`
  return medidor.measureText(texto).width
}

export interface SerieDePuntos {
  clave: string
  etiqueta: string
  color: string
  /** Se muestra en gris al lado de la etiqueta en la leyenda. Suele ser la base. */
  nota?: string
  /** Diámetro en px, cuando lo decide quien usa la figura (el explorador, por grupo y no por
   *  posición: si falta un grupo, los demás no cambian de tamaño). Gana sobre `radioCreciente`. */
  tamano?: number
}

export interface FilaDePuntos {
  clave: string
  etiqueta: string
  /** Un valor por serie, en el mismo orden. `null` es «no hay dato», que no es cero. */
  valores: (number | null)[]
  /** Muestra de color junto al nombre, cuando la fila es una categoría que otra figura ya pintó
   *  (los niveles de exposición del mapa). El color es de la fila, no de los puntos. */
  color?: string
}

interface Props {
  series: SerieDePuntos[]
  filas: FilaDePuntos[]
  /** Compartida por toda la figura: si cada fila se autoescala, dejan de ser comparables. */
  escala: { min: number, max: number }
  formato: (v: number) => string
  /** Para las marcas del eje, cuando el rótulo del punto necesita más precisión que el eje.
   *  Un eje que dice «55,0» es ruido; un punto que dice «66» pierde el dato. */
  formatoEje?: (v: number) => string
  /** Texto del cursor sobre un punto. */
  titulo?: (fila: FilaDePuntos, serie: SerieDePuntos, valor: number) => string
  /** Cuántas marcas de eje, incluidos los dos extremos. */
  marcas?: number
  /** Ancho de la columna de nombres. Solo se ensancha si algún nombre se corta. */
  anchoEtiqueta?: string
  /**
   * Qué punto se rotula. `extremos` marca el mínimo y el máximo de cada fila, que es lo que
   * corresponde cuando ninguna serie es más importante que otra. Con un índice, esa serie va
   * rotulada **siempre**, y la más lejana además si hay espacio: es el caso del termómetro,
   * donde lo que importa es dónde está cada país hoy y no cuál fue su extremo histórico.
   */
  rotular?: 'extremos' | number
  /**
   * Qué puntos están encendidos, para el recorrido con scroll. Los apagados **siguen en el
   * documento** con opacidad cero: están al imprimir y para un lector de pantalla, y la
   * escala no depende de ellos, así que un punto nunca cambia de lugar al encenderse.
   */
  visible?: (fila: string, serie: string) => boolean
  /** Nombre siempre al lado y nunca sobre la fila, aunque la pantalla sea angosta. Es para la
   *  capa del recorrido, donde el alto está contado: apilar cuesta 18 px por fila. */
  compacto?: boolean
  /** Alto de cada fila en px. Se sube en el recorrido, donde la figura es lo que se mira. */
  altoFila?: number
  /**
   * El punto crece con el orden de la serie.
   *
   * Solo para series **ordenadas**, como las oleadas: el tamaño dice cuál es la más nueva, y así
   * el orden se lee también sin color, que es lo que necesita alguien que no distingue dos tonos
   * vecinos. En series nominales sería inventar una jerarquía que no existe.
   */
  radioCreciente?: boolean
  /** Unidad de la escala, junto al eje. Escrita acá se lee una vez; escrita en el relato hay que
   *  repetirla en cada frase. */
  unidadEje?: string
  /** El nombre del gráfico: la medida y su base. Ver `RotuloFigura`. */
  rotulo?: string
  /**
   * Qué dice la figura, para quien no la ve.
   *
   * **Faltaba.** Cada punto llevaba su `title`, pero no había ninguna frase que resumiera la figura
   * entera: quien usa lector de pantalla tenía que recorrer fila por fila para hacerse una idea.
   * Lo tenían `BarrasDeEscena` y `MapaRegiones`, y estas no (29-09-2026).
   */
  descripcion?: string
  /** La leyenda al pie. Se apaga cuando quien usa la figura pone la suya, como el recorrido, que
   *  la necesita arriba y como rampa: dos leyendas de lo mismo es peor que ninguna. */
  leyenda?: boolean
  /**
   * Nombres de fila en dos líneas en vez de cortados. Para el explorador, donde una fila es una
   * categoría del cuestionario («Debería poder limitarlas en sectores estratégicos») y cortada no
   * se lee. Las historias tienen nombres cortos y siguen con el corte de una línea.
   */
  rotulosLargos?: boolean
  /**
   * Con una serie destacada, su número va al lado donde no hay otro punto, y si los dos lados
   * están ocupados sale por fuera del extremo más cercano. Sin esto el número va siempre a la
   * derecha y en el explorador caía encima del punto de otra oleada (`p3`, fila «2»: 2,4 y 5,0).
   * Mide el lienzo en píxeles, así que el lado puede cambiar con el ancho; el recorrido no lo usa
   * porque ahí un rótulo que salta de lado al encender un punto se lee como un cambio del dato.
   */
  esquivar?: boolean
  /**
   * La emanata con que entra cada punto («esto acaba de llegar»). Es un gesto del recorrido, donde
   * un paso enciende un dato; en el explorador, que cambia de pregunta decenas de veces por visita,
   * se apaga: ahí lo aprobado es que solo el largo de las barras se mueva (novena ronda). Apagada,
   * tampoco se desliza el trazo: los puntos saltan en seco y un trazo que llega 500 ms después se
   * lee desparejo.
   */
  entrada?: boolean
}

export default function Puntos ({
  series, filas, escala, formato, formatoEje = formato, titulo, marcas = 3,
  anchoEtiqueta = '5.5rem', rotular = 'extremos', visible, compacto = false,
  altoFila = ALTO_FILA, radioCreciente = false, unidadEje, rotulo, descripcion, leyenda = true,
  rotulosLargos = false, esquivar = false, entrada = true,
}: Props) {
  // El lienzo de la primera fila, guardado en estado y no en una ref: si la primera fila cambia
  // (otra pregunta en la misma vista), el observador tiene que pasar al nodo nuevo (Codex).
  const [lienzo, setLienzo] = useState<HTMLDivElement | null>(null)
  const [anchoLienzo, setAnchoLienzo] = useState(0)
  const [familia, setFamilia] = useState('')
  useEffect(() => {
    if (!esquivar || !lienzo) return
    setFamilia(getComputedStyle(lienzo).fontFamily)
    const observador = new ResizeObserver(([e]) => setAnchoLienzo(e.contentRect.width))
    observador.observe(lienzo)
    return () => observador.disconnect()
  }, [esquivar, lienzo])
  // Tres oleadas dan 8, 10 y 12 px. El escalón es de 2 px porque con 1 no se distingue y con 3
  // el punto más nuevo empieza a tapar a su vecino.
  const tamano = (i: number) => (radioCreciente ? PUNTO - 2 + i * 2 : PUNTO)
  const rango = escala.max - escala.min || 1
  /** Posición en el lienzo, de 0 a 100. */
  const x = (v: number) => Math.min(100, Math.max(0, (100 * (v - escala.min)) / rango))
  const cortes = Array.from({ length: marcas }, (_, i) => i / (marcas - 1))
  // El ancho de la columna de nombres viaja como variable CSS. El porqué está en `.fila-puntos`,
  // en index.css: ni clase de Tailwind (interpolada, el compilador no la ve) ni estilo en línea
  // (sin media query, y le gana a la clase, así que rompe el apilado en teléfono).
  // El alto de la fila viaja como variable por la misma razón que el ancho de la etiqueta: escrito
  // en el atributo `style` no hay media query que lo alcance. Y con **dos** nombres, no uno: un
  // valor en línea le gana a cualquier regla, incluso para una variable, así que quien quiera
  // pasarlo por encima (el recorrido en escritorio, ver `.capa-recorrido` en index.css) define
  // `--alto-fila-ancho` en un ancestro y esa gana por ser la primera de la cadena.
  const ancho = {
    '--ancho-etiqueta': anchoEtiqueta,
    '--alto-fila': `${altoFila}px`,
  } as React.CSSProperties
  const rejilla = compacto ? 'fila-puntos compacta' : 'fila-puntos'

  // **`<figure>` solo cuando hay algo que rotular.** El rótulo es un `<figcaption>` y tiene que ir
  // dentro de la figura que nombra; pero el explorador ya envuelve estos puntos en su propio
  // `<figure>` (`FiguraExplorador`), y una figura dentro de otra deja dos leyendas para un mismo
  // gráfico. Sin rótulo ni descripción propia, esto vuelve a ser el `<div>` de antes.
  const Caja = (rotulo || descripcion ? 'figure' : 'div') as 'figure' | 'div'
  return (
    <Caja className={rotulo || descripcion ? 'm-0' : undefined}>
      <RotuloFigura>{rotulo}</RotuloFigura>
      {descripcion && <p className="sr-only">{descripcion}</p>}
      {/* Eje arriba. Va sobre el mismo lienzo que los puntos, márgenes incluidos, o las marcas
          quedan corridas respecto de lo que rotulan. */}
      <div className={`${rejilla} items-end`} style={ancho}>
        <span className={compacto ? undefined : 'hidden sm:block'} />
        <div className="relative h-4" style={{ marginLeft: MARGEN, marginRight: MARGEN }}>
          {cortes.map((f) => (
            <span
              key={f}
              className="absolute bottom-0 text-[10px] tabular-nums text-gray-400"
              style={{ left: `${f * 100}%`, transform: f === 0 ? 'none' : f === 1 ? 'translateX(-100%)' : 'translateX(-50%)' }}
            >
              {formatoEje(escala.min + f * rango)}
            </span>
          ))}
        </div>
      </div>

      {/* La unidad va pegada al eje y alineada con el lienzo, no con la columna de nombres. Dice
          además dónde empieza la escala: un eje recortado que no lo declara exagera la pendiente,
          que es el defecto del monitor actual. */}
      {unidadEje && (
        <div className={rejilla} style={ancho}>
          <span className={compacto ? undefined : 'hidden sm:block'} />
          <p
            className="mt-1.5 text-[10px] leading-tight text-gray-500"
            style={{ marginLeft: MARGEN, marginRight: MARGEN }}
          >
            {unidadEje}
          </p>
        </div>
      )}

      <div className="flex flex-col">
        {filas.map((fila) => {
          const todos = fila.valores
            .map((v, i) => ({ valor: v, serie: series[i] }))
            .filter((p): p is { valor: number, serie: SerieDePuntos } => p.valor !== null && p.serie !== undefined)
          // El trazo, los rótulos y los extremos se calculan sobre lo encendido: si no, el
          // trazo anunciaría un rango que todavía no se mostró.
          const puntos = visible ? todos.filter((p) => visible(fila.clave, p.serie.clave)) : todos
          const posiciones = puntos.map((p) => x(p.valor))
          const min = Math.min(...posiciones)
          const max = Math.max(...posiciones)
          // Con los extremos pegados los dos rótulos se pisan, así que va solo el del máximo.
          const separados = puntos.length > 1 && max - min >= SEPARACION_MINIMA
          const enMin = puntos[posiciones.indexOf(min)]
          const enMax = puntos[posiciones.indexOf(max)]
          // Con una serie destacada, esa va rotulada aunque quede en medio, y la otra solo si
          // hay espacio. Sin ella, se rotulan los dos extremos cuando están separados.
          // Si la serie destacada todavía no está encendida, se rotulan los extremos: una fila
          // con puntos y sin ningún número obliga a leer el eje a ojo.
          // En el explorador (`esquivar`), si la serie destacada no tiene dato en esta fila, se rotula
          // la última anterior que sí: en `p4`, Boric no existe en 2025 y el número de los extremos
          // (43 %, de 2023) se leía como el de hoy. Solo por dato nulo, no por punto apagado.
          const indiceDestacado = typeof rotular !== 'number'
            ? -1
            : esquivar
              ? [...fila.valores.slice(0, rotular + 1).keys()].reverse().find((i) => fila.valores[i] !== null) ?? -1
              : rotular
          const destacado = indiceDestacado >= 0
            ? puntos.find((p) => p.serie.clave === series[indiceDestacado]?.clave)
            : undefined
          // Con una serie destacada y encendida va **solo** ella. Antes se le sumaba el otro
          // extremo si había espacio, y en el recorrido eso dejaba el número de una oleada vieja
          // pegado al lado del de la última: dos números, y solo uno era del que hablaba el paso.
          const porExtremos = destacado === undefined
          let aIzquierda = porExtremos
            ? (separados ? enMin : undefined)
            : (destacado === enMin ? destacado : undefined)
          let aDerecha = porExtremos
            ? enMax
            : (destacado === enMin ? undefined : destacado)
          // Dónde se ancla cada rótulo: por defecto, en su propio punto.
          let anclaIzquierda = aIzquierda?.valor
          let anclaDerecha = aDerecha?.valor
          if (esquivar && destacado && puntos.length === 1) {
            // Un punto solo: siempre a la derecha, para que la columna de números no alterne.
            aIzquierda = undefined
            aDerecha = destacado
          } else if (esquivar && destacado && anchoLienzo > 0) {
            const px = (v: number) => (x(v) / 100) * anchoLienzo
            // 10 px de separación (pl-2.5) más el texto, medido.
            const largo = 10 + anchoRotulo(formato(destacado.valor), familia)
            const otros = puntos.filter((p) => p !== destacado).map((p) => px(p.valor) - px(destacado.valor))
            // El radio del punto vecino más grande posible (12 px con tres oleadas) más un px de aire.
            const libreDerecha = otros.every((d) => d <= 0 || d > largo + PUNTO / 2 + 2)
            const libreIzquierda = otros.every((d) => d >= 0 || -d > largo + PUNTO / 2 + 2)
            // En un extremo, hacia afuera; en medio, al lado libre; sin lado libre, por fuera
            // del extremo más cercano.
            const lado = destacado === enMax
              ? 'derecha'
              : destacado === enMin
                ? 'izquierda'
                : libreDerecha
                  ? 'derecha'
                  : libreIzquierda
                    ? 'izquierda'
                    : max - x(destacado.valor) <= x(destacado.valor) - min ? 'fueraDerecha' : 'fueraIzquierda'
            aIzquierda = lado === 'izquierda' || lado === 'fueraIzquierda' ? destacado : undefined
            aDerecha = lado === 'derecha' || lado === 'fueraDerecha' ? destacado : undefined
            anclaIzquierda = lado === 'fueraIzquierda' ? enMin.valor : destacado.valor
            anclaDerecha = lado === 'fueraDerecha' ? enMax.valor : destacado.valor
          }

          return (
            // En pantalla angosta el nombre va sobre su fila y no al lado: la columna de texto
            // se comía 88 de los 296 px disponibles y los puntos quedaban unos encima de otros.
            <div
              key={fila.clave}
              className={`${rejilla} items-center ${compacto ? '' : 'pb-1 sm:pb-0'}`}
              style={ancho}
            >
              <span className={`${rotulosLargos ? 'leading-snug' : 'truncate'} text-xs text-gray-700 sm:text-right ${fila.color ? 'flex items-center gap-1.5 sm:justify-end' : ''}`} title={fila.etiqueta}>
                {fila.color && <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: fila.color }} />}
                {fila.etiqueta}
              </span>
              <div
                ref={fila === filas[0] ? setLienzo : undefined}
                className="relative"
                style={{ height: 'var(--alto-fila-ancho, var(--alto-fila))', marginLeft: MARGEN, marginRight: MARGEN }}
              >
                {cortes.map((f) => (
                  <span key={f} className="absolute inset-y-0 w-px bg-gray-100" style={{ left: `${f * 100}%` }} />
                ))}

                {/* El trazo entre el punto más chico y el más grande: es el rango de la fila, y
                    sin él se lee como puntos sueltos en vez de como un recorrido. Ocupa la fila
                    entera y se recorta con `transform` (el porcentaje de `translateX` es del
                    propio ancho, que es el de la fila): animar `left` y `width` rehacía el layout
                    en cada cuadro. */}
                {puntos.length > 1 && (
                  <span
                    className={`absolute inset-x-0 top-1/2 h-px origin-left bg-gray-200 ${entrada ? 'transition-transform duration-500 motion-reduce:transition-none' : ''}`}
                    style={{ transform: `translateX(${min}%) translateY(-50%) scaleX(${(max - min) / 100})` }}
                  />
                )}

                {/* El anillo blanco separa dos puntos vecinos. Dos puntos con el mismo valor sí
                    se tapan: el número exacto está al pasar el cursor. No se desplazan, porque
                    desplazarlos sería dibujar un valor que no es. */}
                {todos.map((p) => {
                  const d = p.serie.tamano ?? tamano(series.indexOf(p.serie))
                  return (
                  <span
                    key={p.serie.clave}
                    className={`punto absolute top-1/2 rounded-full ring-2 ring-white transition-opacity duration-500 ${
                      puntos.includes(p) ? `opacity-100 ${entrada ? 'dato-nuevo dato-emanata' : ''}` : 'opacity-0'
                    }`}
                    style={{
                      left: `${x(p.valor)}%`,
                      width: `${d}px`,
                      height: `${d}px`,
                      marginLeft: `${-d / 2}px`,
                      marginTop: `${-d / 2}px`,
                      backgroundColor: p.serie.color,
                      // Los rayos de la emanata salen de `currentColor`: sin esto, toman el color
                      // del texto heredado y no el del dato.
                      color: p.serie.color,
                    }}
                    title={titulo
                      ? titulo(fila, p.serie, p.valor)
                      : t('figura.conEtiqueta', { etiqueta: `${p.serie.etiqueta} · ${fila.etiqueta}`, resto: formato(p.valor) })}
                  />
                  )
                })}

                {aIzquierda && (
                  <span
                    className="absolute inset-y-0 flex items-center justify-end pr-2.5 text-[10px] tabular-nums text-gray-500"
                    style={{ right: `${100 - x(anclaIzquierda ?? aIzquierda.valor)}%` }}
                  >
                    {formato(aIzquierda.valor)}
                  </span>
                )}
                {aDerecha && (
                  <span
                    className="absolute inset-y-0 flex items-center pl-2.5 text-[10px] tabular-nums text-gray-500"
                    style={{ left: `${x(anclaDerecha ?? aDerecha.valor)}%` }}
                  >
                    {formato(aDerecha.valor)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ul className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 ${leyenda ? '' : 'hidden'}`}>
        {series.map((s) => (
          <li key={s.clave} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.etiqueta}
            {s.nota && <span className="tabular-nums text-gray-400">{s.nota}</span>}
          </li>
        ))}
      </ul>
    </Caja>
  )
}
