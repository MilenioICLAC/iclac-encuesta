import { useTranslation } from 'react-i18next'
import Enfasis from './Enfasis'
import RotuloFigura from './RotuloFigura'
import { numero } from '../locale'
import { tintaSobre } from '../nucleo/paleta'

export interface FilaBarra {
  clave: string
  /** El nombre de la fila. En una serie es el año; en un corte, el grupo. */
  etiqueta: string
  valor: number
  color: string
  /** Casos detrás del valor, para el título al pasar el puntero y el texto equivalente. */
  n: number
  /** Si este paso la enciende. Lo apagado **sigue en el DOM**, con opacidad cero. */
  encendida: boolean
  /** La marca estática del paso. Una sola por figura. */
  marca?: boolean
}

interface Props {
  filas: FilaBarra[]
  /** El nombre del gráfico: la medida y su base. Ver `RotuloFigura`. */
  rotulo?: string
  /**
   * Unidad de la escala y su base, al pie.
   *
   * **Estas barras no dibujan eje**: el número va escrito al lado de cada una, así que el «%» se ve
   * pero no sobre quiénes está calculado. Hasta el 29-09-2026 eso vivía solo en la nota al pie, y
   * la nota se va a un pop-up: sin esta línea la base deja de estar a la vista, que es el hecho 2
   * de `CLAUDE.md` («con el N a la vista»).
   */
  unidadEje?: string
  /**
   * El tope del eje, en la unidad de los valores.
   *
   * **Se calcula fuera y con todas las filas de la escena**, las que todavía no entran incluidas,
   * porque una escala que dependiera de lo encendido movería la misma barra al avanzar el relato.
   * En una escena que cambia de filas sin cambiar de eje (la serie y después los dos grupos), el
   * tope sale de los dos juegos juntos.
   */
  max: number
  formato: (v: number) => string
  /** Qué dice la figura, para quien no la ve. */
  descripcion: string
  altoFila?: number
}

/**
 * Una barra por fila, con el número escrito sobre la barra o a su derecha.
 *
 * Es la figura de las escenas que siguen **una proporción** a lo largo de las oleadas, o entre dos
 * grupos de la misma oleada. `Puntos` no sirve acá: dibuja una fila por categoría con un punto por
 * oleada, que es lo que hace falta cuando se comparan cinco países entre sí, y en una sola serie
 * deja tres puntos sueltos sin nada que los ancle al cero.
 *
 * **No es `BarrasPorOla`**, la del explorador, aunque muestren la misma pregunta: esa va siempre de
 * 0 a 100 y con un color de identidad, porque ahí se consulta. Acá se afirma: el eje se ajusta a lo que la escena compara, el color es la rampa de
 * oleadas y lo que enciende cada barra es el paso del relato. El día que las dos tengan que verse
 * iguales, lo que se comparte es la escala, no el componente.
 *
 * El rótulo entra **dentro** de la barra cuando esta pasa de dos tercios del lienzo: afuera se
 * salía del ancho en el teléfono. La tinta la decide la luminancia del relleno (`tintaSobre`), no
 * una tabla escrita a mano.
 */
export default function BarrasDeEscena ({ filas, max, formato, descripcion, rotulo, unidadEje, altoFila = 26 }: Props) {
  const { t } = useTranslation('capa')
  return (
    <figure className="barras-escena m-0">
      <RotuloFigura>{rotulo}</RotuloFigura>
      {/* Toda figura lleva su texto equivalente: lo que sigue es decoración para quien ve. */}
      <p className="sr-only">{descripcion}</p>
      <div
        className="grid items-center gap-x-[10px] gap-y-2"
        style={{ gridTemplateColumns: 'auto minmax(0, 1fr)' }}
        aria-hidden
      >
        {filas.map((fila) => {
          const ancho = Math.max(0, Math.min(100, (fila.valor / max) * 100))
          // Pasado este ancho el número no cabe a la derecha de la barra en un teléfono.
          const dentro = ancho > 62
          return (
            <div key={fila.clave} className="contents">
              <span className="nombre-barra whitespace-nowrap text-[13px] tabular-nums text-gray-600">
                {fila.etiqueta}
              </span>
              <div
                className="relative rounded-sm bg-gray-100"
                style={{ height: `var(--alto-fila-barra-ancho, var(--alto-fila-barra, ${altoFila}px))` }}
                title={t('valorBarra', { etiqueta: fila.etiqueta, valor: formato(fila.valor), n: numero(fila.n) })}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-sm transition-opacity duration-300"
                  style={{
                    width: `${ancho}%`,
                    backgroundColor: fila.color,
                    opacity: fila.encendida ? 1 : 0,
                  }}
                >
                  {/* La marca no se apaga con movimiento reducido: es información, no movimiento. */}
                  {fila.marca && <Enfasis />}
                </div>
                <span
                  className={`valor-barra absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[13px] font-semibold tabular-nums transition-opacity duration-300 ${dentro ? 'pr-2 -translate-x-full' : 'pl-2'}`}
                  style={{
                    left: `${ancho}%`,
                    color: dentro ? tintaSobre(fila.color) : '#374151',
                    opacity: fila.encendida ? 1 : 0,
                  }}
                >
                  {formato(fila.valor)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      {/* La unidad al pie, con el mismo tamaño y tono que la de `Puntos` (10 px, gris 500): las dos
          figuras conviven en la misma historia y una diferencia de un píxel se lee como jerarquía. */}
      {unidadEje && <p className="mt-2 text-[10px] leading-tight text-gray-500">{unidadEje}</p>}
    </figure>
  )
}
