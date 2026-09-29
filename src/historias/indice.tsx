import type { Encuesta } from '../nucleo/tipos'
import { medidasDe } from './medidas'
import type { Traducible } from '../locale'
import { fichaDe } from './textos/tipos'
import { FICHA as FICHA_VACUNA } from './textos/vacuna'
import { FICHA as FICHA_TERRITORIO } from './textos/territorio'
import { FICHA as FICHA_INVERSION } from './textos/inversion'
import { HistoriaEntrePotencias, HistoriaMirada } from './recorrido'
import { FICHA as FICHA_MIRADA } from './textos/mirada'
import { FICHA as FICHA_POTENCIAS } from './textos/entre-potencias'
import { HistoriaChinaCotidiana } from './cotidiana'
import { FICHA as FICHA_COTIDIANA } from './textos/cotidiana'
import { HistoriaInversion } from './inversion'
import { HistoriaTerritorio } from './territorio'
import { HistoriaVacuna } from './vacuna'

/**
 * Las historias del visualizador, **una por bloque de la guía de contexto de ICLAC** (02-09-2026).
 *
 * El orden es el de la guía, que es el del cuestionario. Un bloque entra solo si alguna de sus
 * hipótesis sobrevive al contraste con Holm dentro de su familia (`scripts/contrastes.test.mjs`,
 * «las hipótesis de la guía, bloque por bloque»). El bloque tres, la economía de la comuna, no
 * sostuvo su hipótesis central y entra igual, **descriptivo**, por decisión de Felipe (22-09-2026):
 * lo que afirma es lo que sí pasó el contraste.
 *
 * `hallazgo` es lo que la tarjeta del menú promete. **No lleva cifras**: una cifra escrita acá
 * envejece con la oleada siguiente, y la que importa está dentro de la historia, calculada.
 * `medidas` son los contrastes que la sostienen, y con ellos se arma su pop-up de método. Salen de
 * `medidas.ts`, que los asigna figura por figura: la lista de la historia es la de sus figuras
 * juntas, en su orden, y no una segunda copia que se pueda desfasar.
 *
 * **Nombre, pregunta y hallazgo van en los tres idiomas** (`traducido()` al mostrarlos). Los de una
 * historia con módulo de textos salen de su `FICHA` (`textos/<id>.tsx`, con `fichaDe`); los demás
 * están acá, con `en` y `cn` provisorios iguales al español, hasta que su historia se migre.
 */
export interface Historia {
  id: string
  bloque: number
  nombre: Traducible
  pregunta: Traducible
  hallazgo: Traducible
  medidas: string[]
  Componente: (props: { encuesta: Encuesta, abierta: boolean }) => React.ReactElement
}

export const HISTORIAS: Historia[] = [
  {
    id: 'mirada',
    bloque: 1,
    ...fichaDe(FICHA_MIRADA),
    medidas: medidasDe('mirada'),
    Componente: HistoriaMirada,
  },
  {
    id: 'entre-potencias',
    bloque: 2,
    ...fichaDe(FICHA_POTENCIAS),
    medidas: medidasDe('entre-potencias'),
    Componente: HistoriaEntrePotencias,
  },
  {
    id: 'territorio',
    bloque: 3,
    ...fichaDe(FICHA_TERRITORIO),
    medidas: medidasDe('territorio'),
    Componente: HistoriaTerritorio,
  },
  {
    id: 'inversion',
    bloque: 4,
    ...fichaDe(FICHA_INVERSION),
    medidas: medidasDe('inversion'),
    Componente: HistoriaInversion,
  },
  {
    id: 'china-cotidiana',
    bloque: 5,
    ...fichaDe(FICHA_COTIDIANA),
    medidas: medidasDe('china-cotidiana'),
    Componente: HistoriaChinaCotidiana,
  },
  {
    id: 'vacuna',
    bloque: 6,
    ...fichaDe(FICHA_VACUNA),
    medidas: medidasDe('vacuna'),
    Componente: HistoriaVacuna,
  },
]

export const historiaDe = (id: string | undefined) => HISTORIAS.find((h) => h.id === id) ?? null
