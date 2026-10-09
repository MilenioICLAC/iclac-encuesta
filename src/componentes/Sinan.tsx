/**
 * Los íconos de dirección de las historias: la cuchara del sinan (司南), la brújula de la dinastía
 * Han, una cuchara de piedra imán cuyo mango apunta al sur. **La dirección la da el mango.**
 *
 * Salieron del laboratorio del sinan (25-09-2026), con variantes de Claude y de Codex:
 *
 * - `CucharaPortada`: «Cuchara que baja» (Claude), bajo «Haz scroll para desplazarte», y en las
 *   tarjetas del menú en lugar de «→» (laboratorio del viaje de la cuchara, 25-09-2026).
 * - `CucharaBoton`: la misma cuchara sin el círculo, en «Anterior» y «Siguiente» (nota de Felipe;
 *   a 26 px, porque a 18 se leía como un alfiler).
 * - `MangoTendido`: «Mango tendido» (Codex), en las flechas de texto del cierre.
 *
 * Todas en `currentColor`: el color lo pone quien las usa. Sin caracteres chinos: los anillos del
 * sinan son direcciones reales y no se inventan.
 */

/**
 * El círculo liso del centro de la placa y una cuchara grande que baja 6 px y vuelve, el mismo
 * vaivén que tenían los arcos. Solo se mueve la cuchara, con `transform`, y con movimiento reducido
 * se detiene (`.cuchara-portada` y `.cuchara-tarjeta` en `index.css`).
 *
 * **Es la misma cuchara en la portada, en las tarjetas del menú (a 28 px) y la que viaja de una a
 * otra** al elegir una historia (`Transicion.tsx`). El vaivén va en unidades del dibujo, así que a
 * 28 px baja 2,6: se achica con ella. `clase` la distingue en cada lugar; sin clase no flota.
 */
export function CucharaPortada ({ tamano = 64, clase = 'cuchara-portada' }: { tamano?: number, clase?: string }) {
  return (
    <svg aria-hidden width={tamano} height={tamano} viewBox="0 0 64 64" className={`${clase} overflow-visible text-brand-dark`}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle className="circulo" cx={32} cy={29} r={22} strokeWidth={2} opacity={0.3} />
        <g className="cuchara">
          <ellipse cx={32} cy={22} rx={8} ry={9} strokeWidth={3} fill="currentColor" fillOpacity={0.12} />
          <path d="M29.9 31.4L34.1 31.4L33.2 55.5Q32 57.5 30.8 55.5Z" fill="currentColor" strokeWidth={1} />
        </g>
      </g>
    </svg>
  )
}

/**
 * La cuchara de la portada, sin el círculo, redibujada en 24 para que el trazo no quede en un
 * píxel. Se dibuja hacia abajo y se gira para ir hacia arriba, o hacia los lados en la botonera de
 * la vista quieta, donde se avanza de lado.
 */
const GIRO_BOTON = { abajo: '', arriba: 'rotate-180', derecha: '-rotate-90', izquierda: 'rotate-90' } as const

export function CucharaBoton ({ hacia }: { hacia: keyof typeof GIRO_BOTON }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`h-[26px] w-[26px] ${GIRO_BOTON[hacia]}`}>
      <ellipse cx={12} cy={7.4} rx={3.9} ry={4.4} fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={1.8} />
      <path d="M11 11.6L13 11.6L12.55 21.2Q12 22.2 11.45 21.2Z" fill="currentColor" />
    </svg>
  )
}

/**
 * Una cuchara maciza acostada, cuenco atrás y mango afilado adelante, en lugar de «→» o «↑».
 *
 * Mide 1,5 em de ancho: un poco más que el «→» de la fuente. El dibujo de Codex venía en un lienzo
 * de 24 × 24; el `viewBox` lo recorta a su franja (y de 5 a 19) sin tocar el trazo, para que el
 * ícono no sea más alto que la línea y no agrande el botón que lo lleva.
 */
export function MangoTendido ({ hacia }: { hacia: 'derecha' | 'arriba' }) {
  return (
    <svg aria-hidden viewBox="0 5 24 14" className={`inline-block h-auto w-[1.5em] align-middle ${hacia === 'arriba' ? '-rotate-90' : ''}`}>
      <path
        fill="currentColor"
        d="M1.5 12C1.5 9.1 4.5 6.5 7.8 6.5C10.4 6.5 12 8 12.6 10C15.4 10.7 18.6 11 21.7 11.4Q23.2 12 21.7 12.6C18.6 13 15.4 13.3 12.6 14C12 16 10.4 17.5 7.8 17.5C4.5 17.5 1.5 14.9 1.5 12Z"
      />
    </svg>
  )
}
